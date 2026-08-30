"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const homeView = require("../home-view.js");

function baseContext(overrides = {}) {
  return {
    profile: { firstName: "Alex" },
    careerStatus: "recreational",
    clock: { week: 4, dayLabel: "Mercredi", dateLabel: "9 septembre 2026" },
    condition: {
      energy: 72,
      fatigue: 28,
      pendingLoad: 36,
      recommendation: "Une semaine plus calme serait utile",
      recommendationDetail: "Le travail de la semaine précédente doit encore être assimilé.",
      recommendationTone: "warning",
    },
    weekCapacity: { allowed: 3, used: 0, remaining: 3 },
    plan: { title: "Ma semaine", entries: [] },
    actions: {
      rest: { available: true },
      "home-quick": { available: true },
      "home-custom": { available: true },
      meal: { available: true },
    },
    ...overrides,
  };
}

test("expose la même API pure en CommonJS et dans le navigateur", () => {
  assert.equal(globalThis.BoxeurHomeView, homeView);
  assert.equal(homeView.ZONES.length, 4);
  assert.deepEqual(homeView.ACTIONS.map(action => action.id), ["rest", "home-quick", "home-custom", "roadwork-short", "roadwork-long", "roadwork-intervals", "meal"]);
  assert.deepEqual(homeView.ACTION_GROUPS.map(group => group.id), ["training", "running", "kitchen"]);
  assert.equal(typeof homeView.normalizePlan, "function");
  assert.equal(typeof homeView.normalizeWeekCapacity, "function");
  assert.equal(typeof homeView.renderMenu, "function");
  assert.equal(Object.isFrozen(homeView.ACTIONS), true);
});

test("emploie le gabarit partagé des lieux", () => {
  const html = homeView.render(baseContext());
  assert.match(html, /career-home-view career-place-view/);
  assert.match(html, /career-home-header career-place-header/);
  assert.match(html, /career-home-dashboard career-place-dashboard/);
  assert.match(html, /career-home-week-plan career-place-week-plan/);
});

test("conserve les deux illustrations et les quatre hotspots interactifs", () => {
  const html = homeView.render(baseContext());

  assert.match(html, /assets\/maison-v2-desktop\.jpg/);
  assert.match(html, /assets\/maison-v2-mobile\.jpg/);
  assert.equal((html.match(/data-career-home-zone=/g) || []).length, 4);
  for (const zone of homeView.ZONES) {
    const target = zone.menu ? `data-career-home-menu="${zone.menu}"` : `data-career-home-action="${zone.action}"`;
    assert.match(html, new RegExp(`<button[^>]+type="button"[^>]+data-career-home-zone="${zone.id}"[^>]+${target}`));
  }
  assert.match(html, /data-career-leave-home/);
  assert.match(html, /Appartement illustré avec cuisine, salon, chambre et espace d’entraînement au sous-sol/);
});

test("propose seulement le frigo comme prototype visuel pour ouvrir la cuisine", () => {
  const html = homeView.render(baseContext());

  assert.match(html, /career-home-fridge-prototype/);
  assert.match(html, /career-home-fridge-button[^>]+data-career-home-zone="kitchen"[^>]+data-career-home-menu="kitchen"/);
  assert.match(html, /career-home-fridge-image-desktop[^>]+assets\/maison-v2-desktop\.jpg/);
  assert.match(html, /career-home-fridge-image-mobile[^>]+assets\/maison-v2-mobile\.jpg/);
  assert.match(html, /career-home-fridge-title[^>]*>Cuisine<\/span>/);
  assert.doesNotMatch(html, /career-home-hotspot-kitchen/);
});

test("affiche le repère de semaine, les jauges et le conseil avant de planifier", () => {
  const html = homeView.render(baseContext());

  assert.match(html, /Semaine 4/);
  assert.match(html, /Mercredi · 9 septembre 2026/);
  assert.match(html, /Énergie<\/span><strong>72 %/);
  assert.match(html, /Fatigue<\/span><strong>28 %/);
  assert.match(html, /XP ciblée en attente<\/span><strong>36 XP/);
  assert.match(html, /Une semaine plus calme serait utile/);
  assert.match(html, /Conseil avant de planifier/);
});

test("normalise le plan sans le modifier et marque clairement les choix déjà planifiés", () => {
  const rawPlan = {
    title: "Semaine avec emploi",
    note: "Le travail utilise déjà une place.",
    entries: [{ actionId: "rest" }, { actionId: "work", label: "Emploi" }],
  };
  const snapshot = structuredClone(rawPlan);
  const context = homeView.normalizeContext(baseContext({
    plan: rawPlan,
    weekCapacity: { allowed: 3, used: 2, remaining: 1 },
  }));

  assert.deepEqual(rawPlan, snapshot);
  assert.deepEqual(context.plan.homeActionIds, ["rest"]);
  assert.equal(context.actions.rest.planned, true);
  assert.equal(context.actions["home-quick"].planned, false);
  assert.deepEqual(context.weekCapacity, {
    allowed: 3,
    used: 2,
    remaining: 1,
    full: false,
    label: "Choix hebdomadaires",
  });

  const html = homeView.render(context);
  assert.match(html, /<strong>1 \/ 3<\/strong>/);
  assert.match(html, /aria-label="Capacité hebdomadaire restante : 1 sur 3"/);
  assert.match(html, /data-career-home-action="rest"[^>]+data-career-home-planned="true" aria-pressed="true"/);
  assert.match(html, /Planifié pour cette semaine/);
  assert.match(html, /Journée de repos rapide<small>Aucun coût de capacité<\/small>/);
  assert.match(html, /data-career-location-remove="home-rest-1"/);
});

test("reconnaît les activityId produits par le planificateur hebdomadaire", () => {
  const plan = homeView.normalizePlan({
    entries: [{ id: "plan-week-2-3", activityId: "home-quick", label: "Entraînement maison rapide", cost: 12 }],
  });

  assert.deepEqual(plan.homeActionIds, ["home-quick"]);
  assert.deepEqual(plan.entries, [{
    id: "plan-week-2-3",
    actionId: "home-quick",
    label: "Entraînement maison rapide",
    cost: 12,
    removable: true,
  }]);
});

test("un programme complet bloque les nouveaux choix, mais pas un choix à retirer", () => {
  const context = homeView.normalizeContext(baseContext({
    careerStatus: "amateur",
    plan: { entries: [{ actionId: "rest" }, { actionId: "work" }, { actionId: "boxing-quick" }] },
    weekCapacity: { allowed: 3, used: 3, remaining: 0 },
  }));

  assert.equal(context.weekCapacity.full, true);
  assert.equal(context.actions.rest.available, true);
  assert.equal(context.actions.rest.planned, true);
  for (const actionId of ["home-quick", "home-custom", "roadwork-short", "roadwork-long", "roadwork-intervals", "meal"]) {
    assert.equal(context.actions[actionId].available, false);
    assert.match(context.actions[actionId].reason, /programme de la semaine est complet/i);
  }
  const html = homeView.render(context);
  assert.match(html, /Programme complet/);
});

test("le repos doit concurrencer les autres activités lorsque la semaine est pleine", () => {
  const context = homeView.normalizeContext(baseContext({
    careerStatus: "amateur",
    plan: { entries: [{ actionId: "work" }, { actionId: "boxing-quick" }] },
    weekCapacity: { allowed: 50, used: 50, remaining: 0 },
    actions: { rest: { available: true } },
  }));
  assert.equal(context.actions.rest.available, false);
  assert.equal(context.actions.rest.planned, false);
  assert.match(context.actions.rest.reason, /programme de la semaine est complet/i);
  const html = homeView.render(context);
  assert.match(html, /data-career-home-action="rest"[^>]+aria-disabled="true"/);
});

test("la séance maison personnalisée reste visible et verrouillée seulement au statut récréatif", () => {
  const recreational = homeView.normalizeContext(baseContext());
  assert.equal(recreational.actions["home-custom"].available, false);
  assert.match(recreational.actions["home-custom"].reason, /lorsque tu passes amateur/i);

  const lockedHtml = homeView.renderMenu("training", baseContext());
  assert.match(lockedHtml, /data-career-home-action="home-custom"[^>]+disabled aria-disabled="true"/);
  assert.match(lockedHtml, /id="career-home-action-home-custom-help">La séance personnalisée se débloque lorsque tu passes amateur\./);

  const amateur = homeView.normalizeContext(baseContext({ careerStatus: "amateur" }));
  const professional = homeView.normalizeContext(baseContext({ careerStatus: "pro" }));
  assert.equal(amateur.actions["home-custom"].available, true);
  assert.equal(professional.actions["home-custom"].available, true);
  assert.equal(professional.careerStatusLabel, "Professionnel");
});

test("la course reste un menu indépendant et seul le court jog est accessible en récréatif", () => {
  const recreational = homeView.normalizeContext(baseContext());
  assert.equal(recreational.actions["roadwork-short"].available, true);
  assert.equal(recreational.actions["roadwork-long"].available, false);
  assert.equal(recreational.actions["roadwork-intervals"].available, false);
  assert.equal(recreational.actions.meal.available, false);

  const menu = homeView.renderMenu("running", baseContext());
  assert.match(menu, /<h2 id="career-home-menu-title">Course<\/h2>/);
  assert.match(menu, /data-career-home-action="roadwork-short"/);
  assert.match(menu, /data-career-home-action="roadwork-long"[^>]+disabled aria-disabled="true"/);
  assert.match(menu, /id="career-home-action-roadwork-long-help">Le long jog se débloque lorsque tu passes amateur\.<\/small>/);
});

test("les menus gardent les commandes de planification et séparent les activités de la scène", () => {
  const context = baseContext({
    careerStatus: "amateur",
    actions: { meal: { available: true, moneyCost: 18 } },
  });
  const html = [
    homeView.render(context),
    homeView.renderMenu("training", context),
    homeView.renderMenu("running", context),
    homeView.renderMenu("kitchen", context),
  ].join("\n");

  for (const actionId of ["rest", "home-quick", "home-custom", "roadwork-short", "roadwork-long", "roadwork-intervals", "meal"]) {
    assert.match(html, new RegExp(`data-career-home-action="${actionId}"`));
  }
  assert.match(html, /Ajouter à la semaine/);
  assert.match(html, /Préparer pour la semaine/);
  assert.match(html, /18 \$ · soutien modeste/);
  assert.doesNotMatch(html, /BoxeurDeux classique|play-v1/);
  assert.doesNotMatch(html, /data-career-home-action="(?:sleep|recover|jogging|shadow-boxing|basement-bag|advance)"/);
});

test("accepte les formes compactes de capacité et les alias d’anciens plans", () => {
  const plan = homeView.normalizePlan(["sleep", "basement-bag"]);
  assert.deepEqual(plan.homeActionIds, ["rest", "home-quick"]);

  assert.deepEqual(homeView.normalizeWeekCapacity({ limit: 4, remaining: 2 }, plan), {
    allowed: 4,
    used: 2,
    remaining: 2,
    full: false,
    label: "Choix hebdomadaires",
  });
  assert.equal(homeView.normalizeWeekCapacity(5, homeView.normalizePlan([])).allowed, 5);
  assert.equal(homeView.normalizeWeekCapacity(null, homeView.normalizePlan([])).allowed, 3);
});

test("un menu verrouillé reste ouvrable et explique l’indisponibilité de son repas", () => {
  const context = baseContext({
    careerStatus: "amateur",
    actions: { meal: { available: false, reason: "Il manque 8 $ pour les provisions." } },
  });
  const home = homeView.render(context);
  const menu = homeView.renderMenu("kitchen", context);

  assert.match(home, /data-career-home-zone="kitchen"[^>]+data-career-home-menu="kitchen"/);
  assert.doesNotMatch(home, /data-career-home-zone="kitchen"[^>]+disabled/);
  assert.match(menu, /data-career-home-action="meal"[^>]+disabled aria-disabled="true"/);
  assert.match(menu, /id="career-home-action-meal-help">Il manque 8 \$ pour les provisions\.<\/small>/);
});

test("échappe les données fournies par la sauvegarde ou le moteur de semaine", () => {
  const attack = `<img src=x onerror="boom()">`;
  const html = homeView.render({
    profile: { firstName: attack },
    clock: { dayLabel: attack, dateLabel: attack },
    plan: { title: attack, note: attack, entries: [] },
    condition: { recommendation: attack, recommendationDetail: attack },
    actions: { rest: { available: false, reason: attack } },
  });

  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /onerror="boom\(\)"/);
  assert.match(html, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;/);
});

test("emploie un vocabulaire québécois cohérent et ne transforme pas dormir en action", () => {
  const html = `${homeView.render(baseContext({ careerStatus: "amateur" }))}\n${homeView.renderMenu("training", baseContext({ careerStatus: "amateur" }))}`;

  assert.match(html, /Sous-sol/);
  assert.match(html, /Course/);
  assert.match(html, /Journée de repos/);
  assert.match(html, /shadow-boxing/);
  assert.doesNotMatch(html, /Dormir jusqu|petit-déjeuner|cave/i);
});

test("rend un résultat de programme réutilisable et échappé", () => {
  const html = homeView.renderResult({
    title: "Choix ajouté <script>",
    summary: "Repos & récupération",
    timeLabel: "Semaine 5",
    changes: [
      { label: "Programme <b>", value: "+1 choix", tone: "positive" },
      { label: "Argent", value: "−15 $", tone: "warning" },
    ],
    recommendation: "Retourne au GYM <demain>",
  });

  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Choix ajouté &lt;script&gt;/);
  assert.match(html, /Repos &amp; récupération/);
  assert.match(html, /Programme &lt;b&gt;/);
  assert.match(html, /Retourne au GYM &lt;demain&gt;/);
  assert.doesNotMatch(html, /<script>|<demain>/);
  assert.match(html, /data-career-home-result-close/);
  assert.match(html, /data-career-leave-home/);
});

test("la CSS conserve le scroll mobile, les cibles tactiles et les états sans dépendre seulement de la couleur", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "home.css"), "utf8");

  assert.match(css, /\.career-home-view\s*\{[^}]*overflow-x:\s*hidden[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.career-home-view button,\s*\.career-home-result button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.career-home-view button:focus-visible[^}]*outline:/s);
  assert.match(css, /\.career-home-action\.planned \.career-home-action-command::before\s*\{[^}]*content:\s*"✓"/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.career-home-view\s*\{[^}]*width:\s*100%[^}]*min-height:\s*100dvh/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.career-home-action > button\s*\{[^}]*min-height:\s*48px[^}]*rgba\([^)]*, \.8\)/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
