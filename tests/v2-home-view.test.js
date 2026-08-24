"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const homeView = require("../v2-home-view.js");

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
      "play-v1": { available: true },
    },
    ...overrides,
  };
}

test("expose la même API pure en CommonJS et dans le navigateur", () => {
  assert.equal(globalThis.BoxeurHomeView, homeView);
  assert.equal(homeView.ZONES.length, 4);
  assert.deepEqual(homeView.ACTIONS.map(action => action.id), ["rest", "home-quick", "home-custom", "meal", "play-v1"]);
  assert.deepEqual(homeView.ACTION_GROUPS.map(group => group.id), ["physical", "recovery", "leisure"]);
  assert.equal(typeof homeView.normalizePlan, "function");
  assert.equal(typeof homeView.normalizeWeekCapacity, "function");
  assert.equal(Object.isFrozen(homeView.ACTIONS), true);
});

test("emploie le gabarit partagé des lieux V2", () => {
  const html = homeView.render(baseContext());
  assert.match(html, /v2-home-view v2-place-view/);
  assert.match(html, /v2-home-header v2-place-header/);
  assert.match(html, /v2-home-dashboard v2-place-dashboard/);
  assert.match(html, /v2-home-week-plan v2-place-week-plan/);
});

test("conserve les deux illustrations et les quatre hotspots interactifs", () => {
  const html = homeView.render(baseContext());

  assert.match(html, /assets\/maison-v2-desktop\.jpg/);
  assert.match(html, /assets\/maison-v2-mobile\.jpg/);
  assert.equal((html.match(/data-v2-home-zone=/g) || []).length, 4);
  for (const zone of homeView.ZONES) {
    assert.match(html, new RegExp(`<button[^>]+type="button"[^>]+data-v2-home-zone="${zone.id}"[^>]+data-v2-home-action="${zone.action}"`));
  }
  assert.match(html, /data-v2-leave-home/);
  assert.match(html, /Appartement illustré avec cuisine, salon, chambre et espace d’entraînement au sous-sol/);
});

test("affiche le repère de semaine, les jauges et le conseil avant de planifier", () => {
  const html = homeView.render(baseContext());

  assert.match(html, /Semaine 4/);
  assert.match(html, /Mercredi · 9 septembre 2026/);
  assert.match(html, /Énergie<\/span><strong>72 %/);
  assert.match(html, /Fatigue<\/span><strong>28 %/);
  assert.match(html, /Charge à assimiler<\/span><strong>36 %/);
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
  assert.match(html, /aria-label="Énergie hebdomadaire restante : 1 sur 3"/);
  assert.match(html, /data-v2-home-action="rest"[^>]+data-v2-home-planned="true" aria-pressed="true"/);
  assert.match(html, /Planifié pour la semaine/);
  assert.match(html, /Journée de repos rapide<small>Aucun coût d’énergie<\/small>/);
  assert.match(html, /data-v2-location-remove="home-rest-1"/);
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

test("un programme complet bloque les nouveaux choix, mais pas le loisir ni un choix à retirer", () => {
  const context = homeView.normalizeContext(baseContext({
    careerStatus: "amateur",
    plan: { entries: [{ actionId: "rest" }, { actionId: "work" }, { actionId: "boxing-quick" }] },
    weekCapacity: { allowed: 3, used: 3, remaining: 0 },
  }));

  assert.equal(context.weekCapacity.full, true);
  assert.equal(context.actions.rest.available, true);
  assert.equal(context.actions.rest.planned, true);
  for (const actionId of ["home-quick", "home-custom", "meal"]) {
    assert.equal(context.actions[actionId].available, false);
    assert.match(context.actions[actionId].reason, /programme de la semaine est complet/i);
  }
  assert.equal(context.actions["play-v1"].available, true);
  assert.equal(context.actions["play-v1"].planned, false);

  const html = homeView.render(context);
  assert.match(html, /Programme complet/);
  assert.match(html, /data-v2-home-action="play-v1"[^>]*(?!disabled)/);
});

test("la séance maison personnalisée reste visible et verrouillée seulement au statut récréatif", () => {
  const recreational = homeView.normalizeContext(baseContext());
  assert.equal(recreational.actions["home-custom"].available, false);
  assert.match(recreational.actions["home-custom"].reason, /lorsque tu passes amateur/i);

  const lockedHtml = homeView.render(baseContext());
  assert.match(lockedHtml, /data-v2-home-action="home-custom"[^>]+disabled aria-disabled="true"/);
  assert.match(lockedHtml, /id="v2-home-action-home-custom-help">La séance personnalisée se débloque lorsque tu passes amateur\./);

  const amateur = homeView.normalizeContext(baseContext({ careerStatus: "amateur" }));
  const professional = homeView.normalizeContext(baseContext({ careerStatus: "pro" }));
  assert.equal(amateur.actions["home-custom"].available, true);
  assert.equal(professional.actions["home-custom"].available, true);
  assert.equal(professional.careerStatusLabel, "Professionnel");
});

test("les boutons emploient Ajouter ou Préparer pour la semaine et le repas montre son coût", () => {
  const html = homeView.render(baseContext({
    careerStatus: "amateur",
    actions: { meal: { available: true, moneyCost: 18 } },
  }));

  for (const actionId of ["rest", "home-quick", "home-custom", "meal", "play-v1"]) {
    assert.match(html, new RegExp(`data-v2-home-action="${actionId}"`));
  }
  assert.match(html, /Ajouter à la semaine/);
  assert.match(html, /Préparer pour la semaine/);
  assert.match(html, /18 \$ · soutien modeste/);
  assert.match(html, /Jouer maintenant/);
  assert.match(html, /ne planifie rien, ne prend aucune place et ne fait pas avancer la semaine/);
  assert.doesNotMatch(html, /data-v2-home-action="(?:sleep|recover|jogging|shadow-boxing|basement-bag|advance)"/);
});

test("jouer à la V1 est systématiquement exclu du plan et de sa capacité", () => {
  const plan = homeView.normalizePlan({
    entries: [
      { actionId: "play-v1" },
      { actionId: "rest" },
      { actionId: "souvenir", countsTowardCapacity: false },
    ],
  });
  const capacity = homeView.normalizeWeekCapacity({}, plan);

  assert.deepEqual(plan.homeActionIds, ["rest"]);
  assert.equal(plan.entryCount, 1);
  assert.equal(capacity.used, 1);

  const html = homeView.render(baseContext({ plan: { entries: [{ actionId: "play-v1" }] } }));
  const playButton = html.match(/<button[^>]+data-v2-home-action="play-v1"[^>]*>/)?.[0] || "";
  assert.doesNotMatch(playButton, /aria-pressed|data-v2-home-planned/);
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

test("un hotspot bloqué reste focusable et sa carte explique aussi la raison", () => {
  const html = homeView.render(baseContext({
    actions: { meal: { available: false, reason: "Il manque 8 $ pour les provisions." } },
  }));

  assert.match(html, /<button[^>]+data-v2-home-zone="kitchen"[^>]+aria-disabled="true"[^>]+aria-describedby="v2-home-zone-kitchen-reason"/);
  assert.doesNotMatch(html, /data-v2-home-zone="kitchen"[^>]+ disabled/);
  assert.match(html, /id="v2-home-zone-kitchen-reason">Il manque 8 \$ pour les provisions\.<\/span>/);
  assert.match(html, /data-v2-home-action="meal"[^>]+disabled aria-disabled="true"/);
  assert.match(html, /id="v2-home-action-meal-help">Il manque 8 \$ pour les provisions\.<\/small>/);
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
  const html = homeView.render(baseContext({ careerStatus: "amateur" }));

  assert.match(html, /Sous-sol/);
  assert.match(html, /GYM/);
  assert.match(html, /Journée de repos rapide/);
  assert.match(html, /Les nuits restent automatiques/);
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
  assert.match(html, /data-v2-home-result-close/);
  assert.match(html, /data-v2-leave-home/);
});

test("la CSS conserve le scroll mobile, les cibles tactiles et les états sans dépendre seulement de la couleur", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "v2-home.css"), "utf8");

  assert.match(css, /\.v2-home-view\s*\{[^}]*overflow-x:\s*hidden[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.v2-home-view button,\s*\.v2-home-result button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.v2-home-view button:focus-visible[^}]*outline:/s);
  assert.match(css, /\.v2-home-action\.planned \.v2-home-action-command::before\s*\{[^}]*content:\s*"✓"/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.v2-home-view\s*\{[^}]*width:\s*100%[^}]*min-height:\s*100dvh/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.v2-home-action > button\s*\{[^}]*min-height:\s*48px[^}]*rgba\([^)]*, \.8\)/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
