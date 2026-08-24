"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const view = require("../v2-week-view.js");

test("présente clairement les deux rythmes sans imposer le mode détaillé", () => {
  const html = view.renderLauncher({
    week: 3,
    coachName: "Coach Tremblay",
    quick: { available: true },
    detailed: { activitiesCompleted: 0, periodsRemaining: 21 },
  });

  assert.match(html, /Semaine 3/);
  assert.match(html, /Suivre le plan rapide/);
  assert.match(html, /Jouer la semaine en détail/);
  assert.doesNotMatch(html, /data-v2-week-handoff/);
});

test("explique un blocage rapide et permet de confier une semaine commencée au coach", () => {
  const blocked = view.renderLauncher({
    mode: "detailed",
    quick: { available: false, reason: "Inscris-toi d’abord au GYM de boxe." },
    detailed: { activitiesCompleted: 2, periodsRemaining: 15, canHandOff: true },
  });

  assert.match(blocked, /Inscris-toi d’abord/);
  assert.match(blocked, /data-v2-week-quick disabled/);
  assert.match(blocked, /Confier le reste au coach/);
});

test("le plan et le bilan échappent les données et exposent des actions accessibles", () => {
  const plan = view.renderPlan({
    coachName: "<Coach>",
    plan: {
      title: "Technique & récupération",
      items: [{ label: "GYM", detail: "Mitaines", tone: "positive" }],
      tradeoff: "Moins de contrôle.",
    },
  });
  const summary = view.renderSummary({
    weekFrom: 2,
    weekTo: 3,
    changes: [{ label: "Argent", detail: "+100 $", tone: "positive" }],
    events: [{ label: "Attention", detail: "Abonnement bientôt expiré", tone: "warning" }],
  });

  assert.match(plan, /&lt;Coach&gt;/);
  assert.match(plan, /data-v2-week-confirm/);
  assert.match(summary, /Semaine 2 terminée/);
  assert.match(summary, /\+100 \$/);
  assert.match(summary, /Abonnement bientôt expiré/);
  assert.match(summary, /aria-live="polite"/);
});
