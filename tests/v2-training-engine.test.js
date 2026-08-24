"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const time = require("../career-time-engine.js");
const training = require("../v2-training-engine.js");

const GYM = Object.freeze({ membershipActive: true, careerStatus: "amateur" });

function freshState(overrides = {}) {
  return time.createState({
    seed: "training-tests",
    condition: { energy: 90, fatigue: 10 },
    stats: { technique: 40, power: 40, cardio: 40, defense: 40 },
    ...overrides,
  });
}

function fixedRng(value = 0.5) {
  return () => value;
}

test("expose le catalogue en CommonJS et sur globalThis avec le terme québécois mitaines", () => {
  assert.equal(globalThis.BoxeurTraining, training);
  assert.equal(training.SCHEMA_VERSION, 1);
  assert.equal(training.MIN_BLOCKS, 1);
  assert.equal(training.MAX_BLOCKS, 5);
  assert.equal(training.EXERCISES.mitts.label, "Travail aux mitaines");
  assert.deepEqual(
    Object.keys(training.EXERCISES),
    ["jump_rope", "shadow_boxing", "heavy_bag", "mitts", "defense_drills", "technical_sparring", "cooldown"],
  );
});

test("une séance du coach se lance en un clic et consomme exactement une période", () => {
  const initial = freshState({
    stats: { technique: 20, power: 45, cardio: 44, defense: 43 },
  });
  const outcome = training.runCoachSession(initial, GYM, fixedRng(0.5));

  assert.equal(outcome.session.source, "coach");
  assert.equal(outcome.session.focus, "technique");
  assert.ok(outcome.session.blocks.length >= 2 && outcome.session.blocks.length <= 3);
  assert.equal(outcome.timeState.clock.absoluteSlot, initial.clock.absoluteSlot + 1);
  assert.equal(outcome.result.durationPeriods, 1);
  assert.equal(outcome.result.source, "coach");
  assert.equal(
    outcome.timeState.history.filter(event => event.type === "activity-completed").length,
    1,
    "un clic doit produire une seule transition atomique",
  );
});

test("le coach allège réellement sa recommandation lorsque la préparation est fragile", () => {
  const tired = freshState({ condition: { energy: 35, fatigue: 72 } });
  const choices = training.buildCoachChoices(tired, GYM, fixedRng(0.5));
  const recommended = choices.find(choice => choice.recommended);

  assert.ok(recommended);
  assert.equal(recommended.blocks.length, 2);
  assert.equal(recommended.blocks.at(-1).id, "cooldown");
  assert.match(recommended.tradeoff, /progression plus lente/i);
});

test("l'aperçu agrège durée, énergie, fatigue et stimulus sans rien modifier", () => {
  const initial = freshState();
  const session = training.createCustomSession(["jump_rope", "heavy_bag", "cooldown"], {
    label: "Puissance avec appuis",
    focus: "power",
  });
  const before = JSON.stringify(initial);
  const preview = training.previewSession(initial, session, GYM);

  assert.equal(preview.ok, true);
  assert.equal(JSON.stringify(initial), before);
  assert.equal(preview.totals.durationMinutes, 50);
  assert.equal(preview.totals.durationPeriods, 1);
  assert.equal(preview.totals.energyCost, 13);
  assert.equal(preview.totals.fatigueDelta, 4);
  assert.deepEqual(preview.totals.stimulus, {
    technique: 1,
    power: 5.5,
    cardio: 2.5,
    defense: 0,
  });
  assert.equal(preview.projected.energy, 77);
  assert.equal(preview.projected.fatigue, 14);
});

test("un ajustement de supplément reste limité aux coûts de séance", () => {
  const initial = freshState({ condition: { energy: 90, fatigue: 10 } });
  const session = training.createCustomSession(["jump_rope", "heavy_bag", "cooldown"]);
  const base = training.previewSession(initial, session, GYM);
  const adjusted = training.previewSession(initial, session, {
    ...GYM,
    sessionAdjustment: {
      energyCost: 10.4,
      fatigueGain: 6,
      fatigueRelief: 3,
      recoveryQuality: 1.03,
      stimulus: { technique: 99, power: 99, cardio: 99, defense: 99 },
      xp: 999,
    },
  });

  assert.equal(base.ok, true);
  assert.equal(adjusted.ok, true);
  assert.equal(adjusted.totals.energyCost, 10.4);
  assert.equal(adjusted.totals.fatigueDelta, 3);
  assert.equal(adjusted.recoveryQuality, 1.03);
  assert.deepEqual(adjusted.totals.stimulus, base.totals.stimulus);
  assert.equal(adjusted.totals.xp, base.totals.xp);
  assert.equal(adjusted.totals.wear, base.totals.wear);
  assert.equal(adjusted.totals.injuryRisk, base.totals.injuryRisk);
});

test("un supplément ne rend pas autorisée une séance de base impossible", () => {
  const exhausted = freshState({ condition: { energy: 5, fatigue: 10 } });
  const session = training.createCustomSession(["heavy_bag"]);
  const preview = training.previewSession(exhausted, session, {
    ...GYM,
    sessionAdjustment: { energyCost: 1 },
  });
  assert.equal(preview.code, "INSUFFICIENT_ENERGY");
});

test("refuse l'absence d'abonnement, le manque d'énergie, la surcharge et les séances mal formées", () => {
  const initial = freshState();
  const normal = training.createCustomSession(["shadow_boxing", "mitts"]);
  assert.equal(training.previewSession(initial, normal, {}).code, "GYM_MEMBERSHIP_REQUIRED");

  const exhausted = freshState({ condition: { energy: 4, fatigue: 30 } });
  assert.equal(training.previewSession(exhausted, normal, GYM).code, "INSUFFICIENT_ENERGY");

  const overloaded = freshState({
    condition: { energy: 100, fatigue: 89 },
    stimulus: { technique: 88, power: 0, cardio: 0, defense: 0 },
  });
  assert.equal(training.previewSession(overloaded, normal, GYM).code, "OVERLOAD_RISK");

  const injuredContext = { ...GYM, injury: 65, injuryWeeks: 2 };
  const injuredPreview = training.previewSession(initial, normal, injuredContext);
  assert.equal(injuredPreview.code, "MEDICAL_REST_REQUIRED");
  assert.match(injuredPreview.reason, /repos médical obligatoire/i);
  assert.throws(
    () => training.executeSession(initial, normal, injuredContext),
    error => error.code === "MEDICAL_REST_REQUIRED",
  );

  assert.equal(training.createCustomSession(["mitts"]).blocks.length, 1);
  assert.throws(
    () => training.createCustomSession(["mitts", "mitts"]),
    error => error.code === "DUPLICATE_EXERCISE",
  );
  assert.throws(
    () => training.createCustomSession(["mitts", "cooldown", "cooldown"]),
    error => error.code === "DUPLICATE_COOLDOWN",
  );
});

test("la séance libre accepte les cinq activités et laisse l'énergie imposer la limite", () => {
  const initial = freshState({ condition: { energy: 100, fatigue: 5 } });
  const allActivities = training.createCustomSession([
    "jump_rope",
    "shadow_boxing",
    "heavy_bag",
    "mitts",
    "defense_drills",
  ]);
  const preview = training.previewSession(initial, allActivities, GYM);

  assert.equal(allActivities.blocks.length, 5);
  assert.equal(preview.ok, true);
  assert.equal(preview.totals.energyCost, 27);
  assert.equal(preview.projected.energy, 73);

  const lowEnergy = freshState({ condition: { energy: 20, fatigue: 5 } });
  assert.equal(training.previewSession(lowEnergy, allActivities, GYM).code, "INSUFFICIENT_ENERGY");
});

test("sépare le coût de la séance du rétablissement nocturne", () => {
  const evening = freshState({
    period: "evening",
    condition: { energy: 70, fatigue: 20 },
  });
  const session = training.createCustomSession(["jump_rope", "cooldown"]);
  const outcome = training.executeSession(evening, session, GYM, fixedRng(0.5));

  assert.ok(outcome.result.sessionConditionDelta.energy < 0, "la séance doit toujours montrer son propre coût");
  assert.ok(outcome.result.nightRecoveryDelta.energy > 0, "la nuit doit être présentée séparément");
  assert.ok(outcome.result.nightRecoveryDelta.fatigue < 0);
  assert.deepEqual(outcome.result.remainingStimulus, outcome.timeState.stimulus);
  assert.ok(outcome.result.remainingStimulus.cardio < outcome.result.plannedStimulus.cardio);
});

test("l'entraînement crée du stimulus, mais aucun gain de statistique sans récupération", () => {
  const initial = freshState();
  const session = training.createCustomSession(["shadow_boxing", "mitts"], { focus: "technique" });
  const outcome = training.executeSession(initial, session, GYM, fixedRng());

  assert.deepEqual(outcome.timeState.stats, initial.stats);
  assert.ok(outcome.timeState.stimulus.technique > initial.stimulus.technique);
  assert.deepEqual(outcome.result.statGains, { technique: 0, power: 0, cardio: 0, defense: 0 });

  const recovered = time.advanceTime(outcome.timeState, 2, fixedRng());
  assert.ok(recovered.stats.technique > initial.stats.technique);
  assert.ok(recovered.stimulus.technique < outcome.timeState.stimulus.technique);
});

test("la sélection et l'exécution sont déterministes avec la même source aléatoire", () => {
  const initial = freshState();
  const first = training.runCoachSession(initial, GYM, time.createSeededRng("coach-choice"));
  const second = training.runCoachSession(initial, GYM, time.createSeededRng("coach-choice"));

  assert.deepEqual(first, second);
  assert.ok(["technique", "power", "cardio", "defense"].includes(first.session.focus));
});

test("l'exécution ne modifie ni l'état source, ni la séance, ni le contexte carrière", () => {
  const initial = freshState();
  const session = training.createCustomSession(["defense_drills", "cooldown"], { focus: "defense" });
  const context = {
    membershipActive: true,
    careerStatus: "recreational",
    career: { money: 250, xp: 12, wear: 3 },
  };
  const snapshots = [JSON.stringify(initial), JSON.stringify(session), JSON.stringify(context)];
  const outcome = training.executeSession(initial, session, context, fixedRng());

  assert.equal(JSON.stringify(initial), snapshots[0]);
  assert.equal(JSON.stringify(session), snapshots[1]);
  assert.equal(JSON.stringify(context), snapshots[2]);
  assert.deepEqual(context.career, { money: 250, xp: 12, wear: 3 });
  assert.ok(outcome.result.xpAward > 0);
  assert.ok(outcome.result.wear >= 0);
  assert.ok(outcome.result.injuryRiskPercent >= 0);
  assert.equal(outcome.result.injuryResolved, false);
  assert.equal("xp" in outcome.timeState, false);
  assert.equal("wear" in outcome.timeState, false);
});

test("dix séances ciblées bien récupérées restent près de la progression historique", () => {
  let state = freshState({
    seed: "training-parity",
    condition: { energy: 100, fatigue: 0 },
    stats: { technique: 30, power: 50, cardio: 50, defense: 50 },
  });
  for (let index = 0; index < 10; index += 1) {
    state = training.runCoachSession(state, GYM, fixedRng(0.5)).timeState;
    state = time.advanceTime(state, 20, fixedRng(0.5));
  }
  const gain = state.stats.technique - 30;
  assert.ok(gain >= 0.8 && gain <= 1.25, `gain de technique obtenu : ${gain}`);
  assert.ok(state.stats.power < 50.01, "la séance technique ne doit pas augmenter la puissance");
});

test("la charge ne peut pas être répétée gratuitement dans le même instant", () => {
  const initial = freshState();
  const first = training.runCoachSession(initial, GYM, fixedRng()).timeState;
  const second = training.runCoachSession(first, GYM, fixedRng()).timeState;
  assert.equal(first.clock.absoluteSlot, initial.clock.absoluteSlot + 1);
  assert.equal(second.clock.absoluteSlot, initial.clock.absoluteSlot + 2);
});
