"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const time = require("../career-time-engine.js");
const strength = require("../strength-engine.js");

const ACTIVE_GYM = Object.freeze({ careerStatus: "amateur", membershipActive: true });

function freshState(overrides = {}) {
  return time.createState({
    seed: "strength-gym-tests",
    condition: { energy: 90, fatigue: 10 },
    stats: { technique: 40, power: 40, cardio: 40, defense: 40 },
    ...overrides,
  });
}

function fixedRng(value = 0.5) {
  return () => value;
}

test("expose le moteur en CommonJS et dans le navigateur avec huit activités utiles à la boxe", () => {
  assert.equal(globalThis.BoxeurStrength, strength);
  assert.equal(strength.SCHEMA_VERSION, 1);
  assert.equal(strength.SESSION_DURATION_PERIODS, 1);
  assert.equal(Object.keys(strength.ACTIVITIES).length, 8);
  assert.deepEqual(strength.STAT_KEYS, ["technique", "power", "cardio", "defense"]);
  assert.equal(strength.ACTIVITIES.rotational_power.label, "Lancers rotatifs au ballon lesté");
  assert.match(strength.ACTIVITIES.machine_conditioning.benefit, /Rameur, vélo ou tapis/);
  assert.doesNotMatch(JSON.stringify(strength.ACTIVITIES), /bodybuilding|crossfit|pattes d['’]ours/i);
});

test("propose seulement les forfaits de un et trois mois et accepte leurs valeurs injectées par le contexte", () => {
  assert.deepEqual(
    strength.MEMBERSHIP_PLANS.map(plan => [plan.id, plan.weeks, plan.price]),
    [
      ["monthly", 4, 95],
      ["three-months", 12, 270],
    ],
  );
  const plans = strength.normalizeMembershipPlans([
    { id: "monthly", weeks: 5, price: 99, label: "Mois test", detail: "Valeurs du contrôleur", available: false, disabledReason: "Budget protégé" },
  ]);
  assert.equal(plans.length, 2);
  assert.deepEqual(plans[0], {
    id: "monthly",
    label: "Mois test",
    weeks: 5,
    price: 99,
    savings: 0,
    detail: "Valeurs du contrôleur",
    available: false,
    disabledReason: "Budget protégé",
  });
  assert.equal(plans[1].price, 270, "les forfaits non fournis gardent leur valeur rétrocompatible");
  assert.equal(
    strength.resolveAccess({ careerStatus: "amateur", strengthGymWeeks: 48 }).state,
    "active",
    "une ancienne sauvegarde conserve toutes ses semaines d'accès déjà payées",
  );
});

test("distingue les accès et ignore les anciennes restrictions médicales", () => {
  assert.deepEqual(strength.resolveAccess({ careerStatus: "recreational", membershipActive: true }), {
    state: "recreational-locked",
    available: false,
    label: "Débloqué au statut amateur",
    reason: "Le gym de musculation devient accessible après le passage amateur.",
  });
  assert.equal(strength.resolveAccess({ careerStatus: "amateur" }).state, "membership-required");
  assert.equal(strength.resolveAccess({ careerStatus: "professional", membershipActive: true }).state, "active");
  const legacyMedical = strength.resolveAccess({
    careerStatus: "amateur",
    membershipActive: true,
    injuryWeeks: 2,
    medicalRestriction: true,
  });
  assert.equal(legacyMedical.state, "active");
});

test("compose librement plus de trois activités sans plafond artificiel", () => {
  const selected = Object.keys(strength.ACTIVITIES);
  const aggregate = strength.aggregateSelection(selected);
  const preview = strength.previewSession(
    freshState({ condition: { energy: 100, fatigue: 0 } }),
    selected,
    ACTIVE_GYM,
  );

  assert.equal(selected.length, 8);
  assert.equal(aggregate.activities.length, 8);
  assert.equal(aggregate.totals.energyCost, 74);
  assert.equal(aggregate.totals.durationMinutes, 125);
  assert.equal(preview.ok, true);
  assert.equal(preview.projected.energy, 26);
  assert.match(preview.warnings.join(" "), /Séance très longue/);
  assert.equal("MAX_BLOCKS" in strength, false);
});

test("l'aperçu met immédiatement à jour énergie, fatigue et stimuli sans mutation", () => {
  const state = freshState({ condition: { energy: 80, fatigue: 10 } });
  const selection = ["dynamic_warmup", "lower_body_strength", "boxing_core", "mobility_cooldown"];
  const before = JSON.stringify(state);
  const preview = strength.previewDraft(state, selection, ACTIVE_GYM);

  assert.equal(preview.ok, true);
  assert.equal(preview.canConfirm, true);
  assert.equal(preview.totals.durationMinutes, 55);
  assert.equal(preview.totals.energyCost, 29);
  assert.equal(preview.totals.fatigueDelta, 12);
  assert.deepEqual(preview.totals.stimulus, { technique: 0, power: 4.4, cardio: 2.2, defense: 1.7 });
  assert.deepEqual(preview.projected, {
    energy: 51,
    fatigue: 22,
    stimulus: { technique: 0, power: 4.4, cardio: 2.2, defense: 1.7 },
  });
  assert.equal(JSON.stringify(state), before);
  assert.deepEqual(selection, ["dynamic_warmup", "lower_body_strength", "boxing_core", "mobility_cooldown"]);
});

test("les suppléments ajustent seulement l'effort immédiat de musculation", () => {
  const state = freshState({ condition: { energy: 80, fatigue: 10 } });
  const selection = ["dynamic_warmup", "lower_body_strength", "boxing_core", "mobility_cooldown"];
  const base = strength.previewSession(state, selection, ACTIVE_GYM);
  const adjusted = strength.previewSession(state, selection, {
    ...ACTIVE_GYM,
    sessionAdjustment: {
      energyCost: 23,
      fatigueGain: 14,
      fatigueRelief: 2,
      recoveryQuality: .97,
      stimulus: { power: 99 },
      xp: 999,
    },
  });

  assert.equal(adjusted.ok, true);
  assert.equal(adjusted.totals.energyCost, 23);
  assert.equal(adjusted.totals.fatigueDelta, 12);
  assert.equal(adjusted.recoveryQuality, .97);
  assert.deepEqual(adjusted.totals.stimulus, base.totals.stimulus);
  assert.equal(adjusted.totals.xp, base.totals.xp);
  assert.equal(adjusted.totals.wear, base.totals.wear);
  assert.equal(adjusted.totals.injuryRisk, base.totals.injuryRisk);
});

test("l'énergie disponible bloque naturellement l'ajout suivant mais permet toujours de retirer", () => {
  const lowEnergy = freshState({ condition: { energy: 20, fatigue: 20 } });
  const first = strength.toggleActivity(lowEnergy, [], "lower_body_strength", ACTIVE_GYM);
  const blocked = strength.toggleActivity(lowEnergy, first.selection, "upper_back_guard", ACTIVE_GYM);
  const removed = strength.toggleActivity(lowEnergy, first.selection, "lower_body_strength", ACTIVE_GYM);

  assert.equal(first.ok, true);
  assert.deepEqual(first.selection, ["lower_body_strength"]);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.code, "INSUFFICIENT_ENERGY");
  assert.deepEqual(blocked.selection, ["lower_body_strength"]);
  assert.equal(removed.ok, true);
  assert.equal(removed.action, "removed");
  assert.deepEqual(removed.selection, []);
});

test("un échauffement ou un retour au calme seul ne constitue pas une séance de progression", () => {
  const state = freshState();
  const warmup = strength.previewDraft(state, ["dynamic_warmup"], ACTIVE_GYM);
  const cooldown = strength.previewSession(state, ["mobility_cooldown"], ACTIVE_GYM);

  assert.equal(warmup.ok, true, "le brouillon doit permettre d'ajouter l'échauffement en premier");
  assert.equal(warmup.canConfirm, false);
  assert.equal(warmup.code, "WORK_ACTIVITY_REQUIRED");
  assert.equal(cooldown.ok, false);
  assert.equal(cooldown.code, "WORK_ACTIVITY_REQUIRED");
});

test("une séance personnalisée exige préparation, travail principal et retour au calme", () => {
  const state = freshState();
  const withoutWarmup = strength.previewDraft(state, ["boxing_core", "mobility_cooldown"], ACTIVE_GYM);
  const withoutCooldown = strength.previewDraft(state, ["dynamic_warmup", "boxing_core"], ACTIVE_GYM);
  const complete = strength.previewDraft(state, ["dynamic_warmup", "boxing_core", "mobility_cooldown"], ACTIVE_GYM);

  assert.equal(withoutWarmup.canConfirm, false);
  assert.equal(withoutWarmup.code, "WARMUP_REQUIRED");
  assert.equal(withoutCooldown.canConfirm, false);
  assert.equal(withoutCooldown.code, "COOLDOWN_REQUIRED");
  assert.equal(complete.canConfirm, true);
});

test("refuse les activités inconnues, les doublons et l'accès verrouillé sans réactiver les anciennes blessures", () => {
  assert.throws(
    () => strength.aggregateSelection(["lower_body_strength", "inconnue"]),
    error => error.code === "UNKNOWN_ACTIVITY",
  );
  assert.throws(
    () => strength.aggregateSelection(["boxing_core", "boxing_core"]),
    error => error.code === "DUPLICATE_ACTIVITY",
  );
  const state = freshState();
  assert.equal(
    strength.previewSession(state, ["boxing_core"], { careerStatus: "recreational", membershipActive: true }).code,
    "RECREATIONAL_LOCKED",
  );
  assert.equal(
    strength.previewSession(state, ["boxing_core"], { careerStatus: "amateur" }).code,
    "MEMBERSHIP_REQUIRED",
  );
  const legacyMedical = strength.previewSession(
    state,
    ["dynamic_warmup", "boxing_core", "mobility_cooldown"],
    { ...ACTIVE_GYM, medicalRestriction: true, injuryWeeks: 3 },
  );
  assert.equal(legacyMedical.ok, true);
});

test("prévoit explicitement le verrou d'une seule activité physique principale par jour", () => {
  const state = freshState();
  const context = { ...ACTIVE_GYM, physicalSessionCompletedToday: true };
  const preview = strength.previewSession(state, ["machine_conditioning"], context);
  const toggle = strength.toggleActivity(state, [], "machine_conditioning", context);

  assert.equal(preview.code, "SESSION_ALREADY_COMPLETED");
  assert.equal(toggle.code, "SESSION_ALREADY_COMPLETED");
  assert.throws(
    () => strength.executeSession(state, ["machine_conditioning"], context),
    error => error.code === "SESSION_ALREADY_COMPLETED",
  );
});

test("une séance complète produit une seule transition et aucun gain de statistique instantané", () => {
  const initial = freshState({ condition: { energy: 80, fatigue: 10 } });
  const outcome = strength.executeSession(
    initial,
    ["dynamic_warmup", "lower_body_strength", "boxing_core", "mobility_cooldown"],
    ACTIVE_GYM,
    fixedRng(),
  );

  assert.equal(outcome.timeState.clock.absoluteSlot, initial.clock.absoluteSlot + 1);
  assert.equal(outcome.result.durationPeriods, 1);
  assert.equal(outcome.result.type, "strength-gym-session");
  assert.deepEqual(outcome.result.statGains, { technique: 0, power: 0, cardio: 0, defense: 0 });
  assert.deepEqual(outcome.timeState.stats, initial.stats);
  assert.ok(outcome.timeState.stimulus.power > initial.stimulus.power);
  assert.equal(outcome.timeState.history.filter(event => event.type === "activity-completed").length, 1);
  assert.deepEqual(outcome.result.activities, ["dynamic_warmup", "lower_body_strength", "boxing_core", "mobility_cooldown"]);
});

test("l'exécution reste pure et déterministe avec une source aléatoire injectable", () => {
  const initial = freshState();
  const selection = ["dynamic_warmup", "rotational_power", "machine_conditioning", "mobility_cooldown"];
  const context = { ...ACTIVE_GYM, sessionLabel: "Puissance et moteur" };
  const snapshots = [JSON.stringify(initial), JSON.stringify(selection), JSON.stringify(context)];
  const first = strength.executeSession(initial, selection, context, time.createSeededRng("force"));
  const second = strength.executeSession(initial, selection, context, time.createSeededRng("force"));

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(initial), snapshots[0]);
  assert.equal(JSON.stringify(selection), snapshots[1]);
  assert.equal(JSON.stringify(context), snapshots[2]);
  assert.equal(first.result.label, "Puissance et moteur");
  assert.ok(first.result.xpAward > 0);
  assert.equal(first.result.injuryRiskPercent, 0);
  assert.equal(first.result.injuryResolved, false);
});

test("la récupération assimile ensuite le stimulus selon le moteur temporel commun", () => {
  const initial = freshState({
    condition: { energy: 100, fatigue: 0 },
    stats: { technique: 40, power: 30, cardio: 40, defense: 40 },
  });
  const trained = strength.executeSession(
    initial,
    ["dynamic_warmup", "lower_body_strength", "posterior_chain", "mobility_cooldown"],
    ACTIVE_GYM,
    fixedRng(),
  ).timeState;
  const recovered = time.advanceTime(trained, 20, fixedRng());

  assert.equal(trained.stats.power, 30);
  assert.ok(recovered.statXp.power > trained.statXp.power);
  assert.ok(recovered.stimulus.power < trained.stimulus.power);
});
