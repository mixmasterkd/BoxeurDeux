"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const strength = require("../v2-strength-engine.js");
const strengthView = require("../v2-strength-view.js");

function baseContext(overrides = {}) {
  return {
    careerStatus: "amateur",
    profile: { firstName: "Alex" },
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
    ...overrides,
  };
}

test("expose la même API de vue en CommonJS et dans le navigateur", () => {
  assert.equal(globalThis.BoxeurStrengthView, strengthView);
  assert.equal(strengthView.STAT_LABELS.power, "Puissance");
  assert.equal(typeof strengthView.render, "function");
  assert.equal(typeof strengthView.renderResult, "function");
});

test("rend une composition libre avec énergie principale et huit vrais boutons d'activité", () => {
  const html = strengthView.render(baseContext());

  assert.match(html, /Gym de musculation/);
  assert.match(html, /Énergie principale/);
  assert.match(html, /82 % → 64 %/);
  assert.match(html, /<meter[^>]+aria-label="Énergie prévue après la séance : 64 %"/);
  assert.match(html, /data-v2-strength-mobile-confirm/);
  assert.equal((html.match(/data-v2-strength-activity=/g) || []).length, 10, "huit choix et deux raccourcis de retrait");
  for (const activity of Object.values(strength.ACTIVITIES)) {
    assert.match(html, new RegExp(`<button[^>]+type="button"[^>]+data-v2-strength-activity="${activity.id}"`));
  }
  assert.match(html, /2 activités/);
  assert.match(html, /Ta séance en construction/);
  assert.match(html, /Ajouter cette séance à ma semaine/);
  assert.doesNotMatch(html, /\bbloc(?:s)?\b/i);
  assert.doesNotMatch(html, /[0-9]+\s*\/\s*3/);
});

test("prévisualise coûts, fatigue et XP ciblée entière directement dans chaque activité", () => {
  const html = strengthView.render(baseContext({ selectedActivities: [] }));

  assert.match(html, /Force des jambes/);
  assert.match(html, /−13 énergie/);
  assert.match(html, /\+8 fatigue/);
  assert.match(html, /<b>Puissance<\/b> \+3 XP/);
  assert.match(html, /Conditionnement sur appareils/);
  assert.match(html, /<b>Cardio<\/b> \+4 XP/);
  assert.match(html, /chaque ajout met immédiatement à jour l'énergie, la fatigue et l’XP ciblée prévue/i);
});

test("désactive seulement les ajouts trop coûteux et laisse les activités choisies retirables", () => {
  const html = strengthView.render(baseContext({
    condition: { energy: 16, fatigue: 30 },
    selectedActivities: ["lower_body_strength"],
  }));
  const selectedButton = html.match(/<button[^>]+data-v2-strength-activity="lower_body_strength"[^>]*>/)[0];
  const expensiveButton = html.match(/<button[^>]+data-v2-strength-activity="posterior_chain"[^>]*>/)[0];

  assert.match(selectedButton, /aria-pressed="true"/);
  assert.doesNotMatch(selectedButton, / disabled/);
  assert.match(expensiveButton, /disabled/);
  assert.match(expensiveButton, /aria-describedby="v2-strength-activity-posterior_chain-reason"/);
  assert.match(html, /Il faut 14 % d&#039;énergie; il en reste 3 %/);
});

test("affiche et bloque clairement le gym pendant le statut récréatif", () => {
  const html = strengthView.render(baseContext({
    careerStatus: "recreational",
    membership: { active: false, balance: 640, plans: strength.MEMBERSHIP_PLANS },
    selectedActivities: [],
  }));

  assert.match(html, /data-v2-strength-access="recreational-locked"/);
  assert.match(html, /Débloqué au statut amateur/);
  assert.match(html, /devient accessible après le passage amateur/);
  assert.equal((html.match(/data-v2-strength-plan=/g) || []).length, 4);
  assert.equal((html.match(/data-v2-strength-plan=[^>]+disabled/g) || []).length, 4);
  assert.equal((html.match(/data-v2-strength-activity=[^>]+disabled/g) || []).length, 8);
});

test("distingue abonnement requis, accès actif et blocage médical", () => {
  const membershipRequired = strengthView.render(baseContext({
    membership: { active: false, balance: 640, plans: strength.MEMBERSHIP_PLANS },
    selectedActivities: [],
  }));
  const active = strengthView.render(baseContext());
  const medical = strengthView.render(baseContext({
    condition: {
      energy: 82,
      fatigue: 18,
      trainingBlocked: true,
      trainingBlockedReason: "Repos médical obligatoire pendant deux semaines.",
    },
    selectedActivities: [],
  }));

  assert.match(membershipRequired, /data-v2-strength-access="membership-required"/);
  assert.match(membershipRequired, /Abonnement requis/);
  assert.match(active, /data-v2-strength-access="active"/);
  assert.match(active, /Accès actif/);
  assert.match(medical, /data-v2-strength-access="medical-blocked"/);
  assert.match(medical, /Repos médical obligatoire pendant deux semaines/);
  assert.match(medical, /data-v2-strength-confirm[^>]+disabled/);
});

test("affiche exactement les quatre forfaits V1 et respecte budget et blocage injectés", () => {
  const plans = strength.MEMBERSHIP_PLANS.map(plan => ({ ...plan }));
  plans[0].disabledReason = "Fonds réservés au GYM de boxe.";
  plans[0].available = false;
  const html = strengthView.render(baseContext({
    membership: {
      active: false,
      balance: 530,
      spendableBalance: 530,
      plans,
    },
    selectedActivities: [],
  }));

  assert.equal((html.match(/data-v2-strength-plan=/g) || []).length, 4);
  assert.match(html, /1 mois/);
  assert.match(html, /95 \$/);
  assert.match(html, /3 mois/);
  assert.match(html, /270 \$/);
  assert.match(html, /6 mois/);
  assert.match(html, /510 \$/);
  assert.match(html, /1 an/);
  assert.match(html, /960 \$/);
  assert.match(html, /Économie de 15 \$/);
  assert.match(html, /Économie de 60 \$/);
  assert.match(html, /Économie de 180 \$/);
  assert.match(html, /Fonds réservés au GYM de boxe/);
  assert.match(html, /data-v2-strength-plan="yearly"[^>]+disabled/);
  assert.match(html, /Il manque 430 \$/);
  assert.doesNotMatch(html, /data-v2-strength-plan="six-months"[^>]+disabled/);
});

test("réserve des commandes accessibles au préparateur privé et à la boutique", () => {
  const active = strengthView.render(baseContext());
  const locked = strengthView.render(baseContext({
    careerStatus: "recreational",
    membership: { active: false, plans: strength.MEMBERSHIP_PLANS },
    selectedActivities: [],
  }));

  assert.match(active, /Préparateur privé/);
  assert.match(active, /Mélanie Tremblay/);
  assert.match(active, /<progress max="5" value="2">/);
  assert.match(active, /data-v2-strength-trainer(?![^>]+disabled)/);
  assert.match(active, /Suppléments/);
  assert.match(active, /2 produits dans ton inventaire/);
  assert.match(active, /data-v2-strength-shop(?![^>]+disabled)/);
  assert.match(locked, /data-v2-strength-trainer[^>]+disabled/);
  assert.match(locked, /data-v2-strength-shop[^>]+disabled/);
});

test("affiche les séances planifiées avec un retrait direct dans le gym", () => {
  const html = strengthView.render(baseContext({
    quick: { available: true, planned: true },
    weekPlan: { entries: [{ id: "strength-1", label: "Séance rapide", cost: 11, removable: true }] },
  }));

  assert.match(html, /Séances de musculation planifiées/);
  assert.match(html, /data-v2-location-remove="strength-1"/);
  assert.match(html, /data-v2-strength-quick aria-pressed="true"[^>]*>Retirer la séance rapide/);
});

test("explique qu'un préparateur produit davantage d’XP ciblée sans donner de point instantané", () => {
  const html = strengthView.render(baseContext({ trainer: {} }));

  assert.match(html, /Aucun préparateur choisi/);
  assert.match(html, /produit davantage d’XP ciblée/);
  assert.match(html, /ne donne jamais un point de statistique instantané/);
});

test("échappe toutes les données externes de la vue et des forfaits", () => {
  const attack = `<img src=x onerror="boom()">`;
  const html = strengthView.render(baseContext({
    profile: { firstName: attack },
    condition: { energy: 80, fatigue: 10, trainingBlocked: true, trainingBlockedReason: attack },
    membership: {
      active: true,
      weeksRemaining: 2,
      label: attack,
      detail: attack,
      balance: 500,
      plans: [{ id: "monthly", label: attack, detail: attack }],
    },
    trainer: { active: true, name: attack, programLabel: attack, detail: attack },
    shop: { summary: attack },
    selectedActivities: [],
  }));

  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /onerror="boom\(\)"/);
  assert.match(html, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;/);
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
  assert.match(html, /data-v2-strength-result-close/);
  assert.match(html, /data-v2-leave-strength-gym/);
  assert.doesNotMatch(html, /<script>|<b>|<i>/);
});

test("le CSS prévoit mobile, défilement sûr, cibles tactiles et mouvement réduit", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "v2-strength.css"), "utf8");

  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /@media \(max-width:\s*760px\)/);
  assert.match(css, /\.v2-strength-layout\s*\{[\s\S]*?flex-direction:\s*column/);
  assert.match(css, /\.v2-strength-mobile-summary\s*\{[\s\S]*?position:\s*sticky/);
  assert.doesNotMatch(css, /\.v2-strength-sidebar\s*\{\s*order:\s*-1/);
  assert.match(css, /\.v2-strength-plan-grid\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /^\s*width:\s*390px/m);
});
