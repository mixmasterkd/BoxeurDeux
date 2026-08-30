"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const strength = require("../strength-engine.js");
const strengthView = require("../strength-view.js");

function baseContext(overrides = {}) {
  return {
    careerStatus: "amateur",
    profile: { firstName: "Alex" },
    clock: { week: 8, dayLabel: "Mardi", timeLabel: "14 h" },
    condition: { energy: 82, fatigue: 18 },
    membership: {
      active: true,
      weeksRemaining: 8,
      label: "Abonnement actif",
      detail: "Expire dans huit semaines.",
      balance: 640,
      spendableBalance: 640,
      plans: strength.MEMBERSHIP_PLANS,
    },
    selectedActivities: ["dynamic_warmup", "lower_body_strength"],
    trainer: {
      active: true,
      name: "Mélanie Tremblay",
      programLabel: "Programme puissance",
      detail: "Progression graduelle vers la prochaine jauge.",
      sessionsCompleted: 2,
      sessionsTotal: 5,
    },
    shop: {
      itemCount: 2,
      summary: "Deux produits sont prêts à être utilisés avant une séance.",
    },
    weekCapacity: { total: 55, used: 12, remaining: 43 },
    weekPlan: {
      entries: [{ id: "strength-1", label: "Cours de CrossFit", cost: 11, removable: true }],
    },
    quick: { available: true, planned: false, plannedCount: 0 },
    ...overrides,
  };
}

function productFixtures() {
  return [
    { id: "protein-bar", label: "Barre protéinée", price: 10, quantity: 2, available: true },
    { id: "sports-drink", label: "Boisson sportive", price: 14, quantity: 1, available: true },
    { id: "protein-shake", label: "Shake protéiné", price: 20, quantity: 0, available: true },
    { id: "preworkout", label: "Pré-entraînement", price: 28, quantity: 3, available: false, reason: "Inventaire plein." },
  ];
}

function buttonFor(html, attribute, value) {
  const suffix = value == null ? "" : `="${value}"`;
  const match = html.match(new RegExp(`<button[^>]*${attribute}${suffix}[^>]*>`));
  assert.ok(match, `bouton ${attribute}${suffix} absent`);
  return match[0];
}

function cssDeclarationsFor(css, selector) {
  const declarations = [];
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1].split(",").map(item => item.trim());
    if (selectors.includes(selector)) declarations.push(match[2]);
  }
  assert.ok(declarations.length, `règle CSS ${selector} absente`);
  return declarations.join("\n");
}

test("expose l'API de scène, de menus et de boutique en CommonJS et dans le navigateur", () => {
  assert.equal(globalThis.BoxeurStrengthView, strengthView);
  assert.equal(strengthView.STAT_LABELS.power, "Puissance");
  assert.deepEqual(Object.keys(strengthView.SCENES), ["gym", "shop"]);
  assert.equal(strengthView.ZONES.length, 5);
  assert.equal(typeof strengthView.render, "function");
  assert.equal(typeof strengthView.renderMenu, "function");
  assert.equal(typeof strengthView.renderShop, "function");
  assert.equal(typeof strengthView.renderResult, "function");
});

test("rend le gym comme scène responsive avec exactement cinq bulles", () => {
  const html = strengthView.render(baseContext());

  assert.match(html, /data-career-strength-access="active"/);
  assert.match(html, /<picture>/);
  assert.match(html, /<source media="\(max-width: 640px\)" srcset="assets\/gym-musculation-v2-mobile\.png">/);
  assert.match(html, /<img src="assets\/gym-musculation-v2-desktop\.png"/);
  assert.equal((html.match(/data-career-strength-zone=/g) || []).length, 5);
  for (const id of ["reception", "crossfit", "program", "trainer", "shop"]) {
    assert.doesNotMatch(buttonFor(html, "data-career-strength-zone", id), /\sdisabled(?:\s|>)/);
  }
  assert.match(html, /Cours de CrossFit/);
  assert.match(html, /Bâtir mon programme/);
  assert.match(html, /Entraîneurs privés/);
});

test("garde le tableau de bord principal informatif et sans commandes cachées", () => {
  const html = strengthView.render(baseContext());
  const dashboard = html.match(/<aside class="career-strength-dashboard[^>]*>[\s\S]*<\/aside>/)?.[0] || "";

  assert.ok(dashboard, "tableau de bord absent");
  assert.match(dashboard, /Capacité restante/);
  assert.match(dashboard, /43\/55/);
  assert.match(dashboard, /Énergie <strong>82 %<\/strong>/);
  assert.match(dashboard, /Fatigue <strong>18 %<\/strong>/);
  assert.match(dashboard, /Cours de CrossFit/);
  assert.match(dashboard, /<em>Planifiée<\/em>/);
  assert.match(dashboard, /Mélanie Tremblay/);
  assert.match(dashboard, /2 en inventaire/);
  assert.doesNotMatch(dashboard, /<button\b/);
  assert.doesNotMatch(dashboard, /data-career-location-remove/);
  assert.doesNotMatch(html, /data-career-strength-activity=/);
  assert.doesNotMatch(html, /data-career-strength-plan=/);
  assert.doesNotMatch(html, /data-career-strength-quick/);
});

test("verrouille les bulles selon le statut, l'abonnement et la condition visible", () => {
  const recreational = strengthView.render(baseContext({
    careerStatus: "recreational",
    membership: { active: false, balance: 640, plans: strength.MEMBERSHIP_PLANS },
  }));
  assert.match(recreational, /data-career-strength-access="recreational-locked"/);
  assert.equal((recreational.match(/data-career-strength-zone=[^>]+\sdisabled/g) || []).length, 5);
  assert.match(recreational, /Débloqué au statut amateur/);

  const membershipRequired = strengthView.render(baseContext({
    membership: { active: false, balance: 640, plans: strength.MEMBERSHIP_PLANS },
  }));
  assert.match(membershipRequired, /data-career-strength-access="membership-required"/);
  assert.doesNotMatch(buttonFor(membershipRequired, "data-career-strength-zone", "reception"), /\sdisabled(?:\s|>)/);
  for (const id of ["crossfit", "program", "trainer", "shop"]) {
    assert.match(buttonFor(membershipRequired, "data-career-strength-zone", id), /\sdisabled(?:\s|>)/);
  }
  assert.match(membershipRequired, /Inscription requise à l’accueil/);

  const conditionBlocked = strengthView.render(baseContext({
    condition: {
      energy: 82,
      fatigue: 18,
      trainingBlocked: true,
      trainingBlockedReason: "La fatigue est trop élevée pour cette séance.",
    },
  }));
  assert.match(conditionBlocked, /data-career-strength-access="condition-blocked"/);
  for (const id of ["crossfit", "program", "trainer"]) {
    assert.match(buttonFor(conditionBlocked, "data-career-strength-zone", id), /\sdisabled(?:\s|>)/);
  }
  for (const id of ["reception", "shop"]) {
    assert.doesNotMatch(buttonFor(conditionBlocked, "data-career-strength-zone", id), /\sdisabled(?:\s|>)/);
  }
  assert.match(conditionBlocked, /La fatigue est trop élevée pour cette séance/);
});

test("le menu d'accueil propose exactement les forfaits de un et trois mois", () => {
  const plans = strength.MEMBERSHIP_PLANS.map(plan => ({ ...plan }));
  plans[0].available = false;
  plans[0].disabledReason = "Fonds réservés au GYM de boxe.";
  const html = strengthView.renderMenu("reception", baseContext({
    membership: {
      active: false,
      balance: 530,
      spendableBalance: 530,
      plans,
    },
  }));

  assert.match(html, /data-career-strength-menu="reception"/);
  assert.match(html, /Inscription au gym/);
  assert.equal((html.match(/data-career-strength-plan=/g) || []).length, 2);
  assert.match(html, /data-career-strength-plan="monthly"/);
  assert.match(html, /1 mois/);
  assert.match(html, /95 \$/);
  assert.match(html, /data-career-strength-plan="three-months"/);
  assert.match(html, /3 mois/);
  assert.match(html, /270 \$/);
  assert.match(html, /Économie de 15 \$/);
  assert.match(buttonFor(html, "data-career-strength-plan", "monthly"), /\sdisabled(?:\s|>)/);
  assert.match(html, /Fonds réservés au GYM de boxe/);
  assert.doesNotMatch(html, /data-career-strength-plan="(?:six-months|yearly)"/);
  assert.doesNotMatch(html, />6 mois<|>1 an</);
});

test("le menu CrossFit conserve la séance strength-quick et ses limites", () => {
  const available = strengthView.renderMenu("crossfit", baseContext());

  assert.match(available, /data-career-strength-menu="crossfit"/);
  assert.match(available, /Cours de CrossFit/);
  assert.match(available, /utilise exactement la séance rapide du moteur/);
  assert.equal((available.match(/data-career-strength-quick/g) || []).length, 1);
  assert.match(buttonFor(available, "data-career-strength-quick"), /aria-pressed="false"/);
  assert.match(available, /Ajouter le cours à ma semaine/);

  const second = strengthView.renderMenu("crossfit", baseContext({
    quick: { available: true, planned: true, plannedCount: 1 },
  }));
  assert.match(buttonFor(second, "data-career-strength-quick"), /aria-pressed="true"/);
  assert.match(second, /Ajouter un deuxième cours/);

  const full = strengthView.renderMenu("crossfit", baseContext({
    quick: { available: false, planned: true, plannedCount: 2, reason: "Maximum hebdomadaire atteint." },
  }));
  assert.match(buttonFor(full, "data-career-strength-quick"), /\sdisabled(?:\s|>)/);
  assert.match(full, /Maximum de deux cours atteint/);
  assert.match(full, /Maximum hebdomadaire atteint/);
});

test("le menu de programme rend huit exercices et la projection énergie, fatigue et XP", () => {
  const html = strengthView.renderMenu("program", baseContext());

  assert.match(html, /data-career-strength-menu="program"/);
  assert.match(html, /Bâtis ton programme/);
  assert.equal((html.match(/data-strength-category=/g) || []).length, 8);
  for (const activity of Object.values(strength.ACTIVITIES)) {
    assert.match(html, new RegExp(`<button[^>]+data-career-strength-activity="${activity.id}"`));
  }
  assert.match(html, /2 activités/);
  assert.match(html, /Énergie après<\/span><strong>64 %/);
  assert.match(html, /Fatigue après<\/span><strong>28 %/);
  assert.match(html, /<b>Puissance<\/b> \+4 XP/);
  assert.match(html, /<b>Cardio<\/b> \+2 XP/);
  assert.match(html, /Force des jambes/);
  assert.match(html, /−13 énergie/);
  assert.match(html, /\+8 fatigue/);
  assert.match(html, /<b>Puissance<\/b> \+3 XP/);
  assert.equal((html.match(/<li><span>[^<]+<\/span><button type="button" data-career-strength-activity=/g) || []).length, 2);
  assert.match(html, /data-career-location-remove="strength-1"/);
  assert.match(html, /data-career-strength-confirm/);
  assert.match(html, /data-career-strength-mobile-confirm/);
  assert.doesNotMatch(html, /data-career-strength-plan=/);
  assert.doesNotMatch(html, /data-career-strength-quick/);
});

test("le programme bloque seulement les ajouts trop coûteux et garde les choix retirables", () => {
  const html = strengthView.renderMenu("program", baseContext({
    condition: { energy: 16, fatigue: 30 },
    selectedActivities: ["lower_body_strength"],
  }));
  const selectedButton = buttonFor(html, "data-career-strength-activity", "lower_body_strength");
  const expensiveButton = buttonFor(html, "data-career-strength-activity", "posterior_chain");

  assert.match(selectedButton, /aria-pressed="true"/);
  assert.doesNotMatch(selectedButton, /\sdisabled(?:\s|>)/);
  assert.match(expensiveButton, /\sdisabled(?:\s|>)/);
  assert.match(expensiveButton, /aria-describedby="career-strength-activity-posterior_chain-reason"/);
  assert.match(html, /Il faut 14 % d&#039;énergie; il en reste 3 %/);
});

test("rend la boutique comme décor responsive avec exactement quatre bulles de produits", () => {
  const html = strengthView.renderShop({ balance: 512, products: productFixtures() });

  assert.match(html, /class="career-strength-shop career-place-view career-supplement-shop"/);
  assert.match(html, /<picture>/);
  assert.match(html, /<source media="\(max-width: 640px\)" srcset="assets\/boutique-supplements-v2-mobile\.png">/);
  assert.match(html, /<img src="assets\/boutique-supplements-v2-desktop\.png"/);
  assert.equal((html.match(/data-career-supplement-buy=/g) || []).length, 4);
  for (const product of productFixtures()) {
    assert.match(html, new RegExp(`data-career-supplement-buy="${product.id}"`));
    assert.match(html, new RegExp(product.label));
  }
  assert.match(buttonFor(html, "data-career-supplement-buy", "preworkout"), /\sdisabled(?:\s|>)/);
  assert.match(html, /Inventaire plein/);
  assert.match(html, /Solde disponible · 512 \$/);
  assert.match(html, /Maximum de deux utilisations par semaine/);
  assert.match(html, /data-career-supplement-shop-close/);
});

test("échappe les données externes de la scène, des menus et de la boutique", () => {
  const attack = `<img src=x onerror="boom()">`;
  const scene = strengthView.render(baseContext({
    profile: { firstName: attack },
    condition: { energy: 80, fatigue: 10, trainingBlocked: true, trainingBlockedReason: attack },
    membership: { active: true, weeksRemaining: 2, label: attack, detail: attack, plans: strength.MEMBERSHIP_PLANS },
    trainer: { active: true, name: attack },
  }));
  const reception = strengthView.renderMenu("reception", baseContext({
    membership: {
      active: false,
      balance: 500,
      plans: [{ id: "monthly", label: attack, detail: attack, weeks: 4, price: 95 }],
    },
  }));
  const shop = strengthView.renderShop({
    balance: 500,
    products: [{ id: attack, label: attack, price: 10, quantity: 0, available: false, reason: attack }],
  });

  for (const html of [scene, reception, shop]) {
    assert.doesNotMatch(html, /<img src=x/);
    assert.doesNotMatch(html, /onerror="boom\(\)"/);
    assert.match(html, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;/);
  }
});

test("rend un bilan de séance réutilisable, accessible et échappé", () => {
  const html = strengthView.renderResult({
    title: "Bonne séance <script>",
    summary: "Puissance & cardio",
    durationMinutes: 54,
    activities: ["Jambes <b>", "Rameur"],
    changes: [{ label: "Énergie <i>", value: "−24 %", tone: "warning" }],
  });

  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Bonne séance &lt;script&gt;/);
  assert.match(html, /Puissance &amp; cardio/);
  assert.match(html, /Jambes &lt;b&gt;/);
  assert.match(html, /Énergie &lt;i&gt;/);
  assert.match(html, /Durée : <strong>54 min<\/strong>/);
  assert.match(html, /data-career-strength-result-close/);
  assert.match(html, /data-career-leave-strength-gym/);
  assert.doesNotMatch(html, /<script>|<b>|<i>/);
});

test("le CSS prévoit scènes responsives, bulles transparentes et aucune marque rouge", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "strength.css"), "utf8");
  const gymHotspot = cssDeclarationsFor(css, ".career-strength-hotspot");
  const shopHotspot = cssDeclarationsFor(css, ".career-supplement-hotspot");

  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(gymHotspot, /position:\s*absolute/);
  assert.match(shopHotspot, /position:\s*absolute/);
  assert.match(gymHotspot, /background(?:-color)?:[^;]*rgba\([^)]*,\s*(?:0?\.)[0-8]\d*\)/);
  assert.match(shopHotspot, /background(?:-color)?:[^;]*rgba\([^)]*,\s*(?:0?\.)[0-8]\d*\)/);
  assert.doesNotMatch(css, /\.career-strength-hotspot::after\s*\{/);
  assert.doesNotMatch(css, /\.career-supplement-hotspot::after\s*\{/);
  assert.match(css, /@media \(max-width:\s*(?:640|760)px\)/);
  assert.match(css, /@media \(max-width:\s*(?:640|760)px\)[\s\S]*?\.career-strength-layout\s*\{[\s\S]*?(?:flex-direction:\s*column|grid-template-columns:\s*minmax\(0,\s*1fr\))/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /^\s*width:\s*390px/m);
});
