"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const progression = require("../progression-engine.js");
const trainers = require("../trainer-engine.js");

function trainerState(overrides = {}) {
  return trainers.createState(overrides);
}

function progressionState(overrides = {}) {
  return progression.createState({
    stats: { technique: 40, power: 40, cardio: 40, defense: 40 },
    ...overrides,
  });
}

function activeProgram(trainerId = "boxing-club", target = "technique", balance = 500) {
  return trainers.startProgram(trainerState(), {
    trainerId,
    target,
    startedWeek: "week-3",
    programId: `program-${trainerId}-${target}`,
  }, { balance });
}

test("expose un moteur UMD/CommonJS et un catalogue central immuable", () => {
  assert.equal(globalThis.BoxeurTrainer, trainers);
  assert.equal(trainers.STATE_KIND, "boxeur-private-trainer");
  assert.equal(trainers.SCHEMA_VERSION, 1);
  assert.deepEqual(trainers.STAT_KEYS, ["technique", "power", "cardio", "defense"]);
  assert.deepEqual(trainers.TRAINER_LOCATIONS, ["boxing-gym", "strength-gym"]);
  assert.equal(trainers.TRAINERS.length, 6);
  assert.deepEqual(trainers.TRAINERS.map(trainer => trainer.sessions), [1, 1, 1, 1, 1, 1]);
  assert.equal(Object.isFrozen(trainers.TRAINERS), true);
  assert.equal(Object.isFrozen(trainers.TRAINERS[0]), true);
});

test("un entraîneur plus cher produit davantage d’XP ciblée entière estimée", () => {
  const offers = trainers.listOffers({ statValue: 40, location: "boxing-gym" });
  assert.deepEqual(offers.map(offer => offer.cost), [120, 200, 320]);
  assert.deepEqual(offers.map(offer => offer.label), ["Olivier Martel", "Maude Lavoie", "Hector Vargas"]);
  assert.deepEqual(
    trainers.listOffers({ location: "strength-gym" }).map(offer => offer.label),
    ["Kim Nguyen", "Darnell Brooks", "Valérie Fortin"],
  );
  assert.ok(offers[0].estimatedGaugePointsPerSession < offers[1].estimatedGaugePointsPerSession);
  assert.ok(offers[1].estimatedGaugePointsPerSession < offers[2].estimatedGaugePointsPerSession);
  offers.forEach(offer => {
    assert.equal(Number.isInteger(offer.estimatedTargetedXpPerSession), true);
    assert.equal(offer.estimatedTargetedXpPerSession, offer.estimatedGaugePointsPerSession);
    assert.ok(offer.estimatedTargetedXpPerSession > 0 && offer.estimatedTargetedXpPerSession < 100);
  });
});

test("les séances réelles respectent aussi l'ordre de rendement du catalogue", () => {
  const outcomes = ["boxing-club", "boxing-specialist", "boxing-elite"].map(trainerId => {
    const started = activeProgram(trainerId, "technique");
    return trainers.completeSession(started.state, progressionState(), {
      sourceId: `yield-${trainerId}`,
      weekKey: "yield-week",
      condition: { energy: 100 },
    });
  });
  const stimuli = outcomes.map(outcome => outcome.progressionState.stimulus.technique);
  assert.ok(stimuli[0] < stimuli[1]);
  assert.ok(stimuli[1] < stimuli[2]);
  outcomes.forEach(outcome => {
    assert.equal(outcome.progressionState.stats.technique, 40);
    assert.equal(outcome.progressionState.progress.technique, 0);
  });
});

test("l’estimation XP reste entière et indépendante de l’ancienne jauge en pourcentage", () => {
  const beginner = trainers.estimateGaugePoints("boxing-elite", 20);
  const intermediate = trainers.estimateGaugePoints("boxing-elite", 55);
  const advanced = trainers.estimateGaugePoints("boxing-elite", 90);
  assert.equal(beginner, intermediate);
  assert.equal(intermediate, advanced);
  assert.equal(Number.isInteger(advanced), true);
  assert.ok(advanced > 0);
});

test("acheter une séance déduit seulement son prix unitaire sans muter les finances externes", () => {
  const initial = trainerState();
  const before = structuredClone(initial);
  const outcome = trainers.startProgram(initial, {
    trainerId: "boxing-specialist",
    target: "defense",
    startedWeek: 4,
    programId: "defense-4",
  }, { balance: 300 });

  assert.deepEqual(initial, before);
  assert.equal(outcome.result.moneyDelta, -200);
  assert.equal(outcome.result.remainingBalance, 100);
  assert.equal(outcome.state.activeProgram.target, "defense");
  assert.equal(outcome.state.activeProgram.sessionsTotal, 1);
  assert.equal(outcome.state.activeProgram.sessionsCompleted, 0);
  assert.equal(outcome.state.activeProgram.costPaid, 200);
});

test("un bon de cours privé paie entièrement la prochaine séance unique", () => {
  const outcome = trainers.startProgram(trainerState(), {
    trainerId: "boxing-specialist",
    target: "technique",
    startedWeek: 5,
  }, { balance: 100, freeSessions: 1 });

  assert.equal(outcome.result.regularCost, 200);
  assert.equal(outcome.result.discount, 200);
  assert.equal(outcome.result.moneyDelta, 0);
  assert.equal(outcome.result.remainingBalance, 100);
  assert.equal(outcome.result.freeSessionsUsed, 1);
  assert.equal(outcome.state.activeProgram.costPaid, 0);
  assert.equal(outcome.state.activeProgram.freeSessionsUsed, 1);
});

test("refuse une séance sans argent, avec une cible invalide ou pendant une séance active", () => {
  assert.throws(
    () => trainers.startProgram(trainerState(), { trainerId: "strength-elite", target: "power" }, { balance: 319 }),
    error => error.code === "INSUFFICIENT_FUNDS" && error.details.cost === 320,
  );
  assert.throws(
    () => trainers.startProgram(trainerState(), { trainerId: "boxing-club", target: "vitesse" }, { balance: 500 }),
    error => error.code === "INVALID_TRAINER_TARGET",
  );
  assert.throws(
    () => trainers.startProgram(trainerState(), { trainerId: "boxing-club", target: "power" }, { balance: 500 }),
    error => error.code === "TRAINER_TARGET_UNAVAILABLE",
  );
  const started = activeProgram();
  assert.throws(
    () => trainers.startProgram(started.state, { trainerId: "strength-elite", target: "power" }, { balance: 500 }),
    error => error.code === "ACTIVE_PROGRAM_EXISTS",
  );
});

test("une séance privée crée seulement du stimulus ciblé et retourne énergie/fatigue", () => {
  const started = activeProgram("strength-specialist", "power");
  const skillState = progressionState({ progress: { power: 99 } });
  const skillBefore = structuredClone(skillState);
  const outcome = trainers.completeSession(started.state, skillState, {
    sourceId: "private-power-1",
    weekKey: "week-3",
    condition: { energy: 80, fatigue: 15 },
  });

  assert.deepEqual(outcome.progressionState.stats, skillBefore.stats);
  assert.deepEqual(outcome.progressionState.progress, skillBefore.progress);
  assert.equal(outcome.progressionState.stimulus.technique, 0);
  assert.equal(outcome.progressionState.stimulus.power, 9.2063);
  assert.equal(outcome.result.energyDelta, -16);
  assert.equal(outcome.result.fatigueDelta, 10);
  assert.equal(outcome.result.target, "power");
  assert.ok(outcome.result.gaugePointsCreated > 0);
  assert.equal(outcome.result.targetedXpCreated, Math.round(outcome.result.stimulusAccepted));
  assert.equal(outcome.result.program.sessionsCompleted, 1);
  assert.equal(outcome.result.program.pendingGaugePoints, outcome.result.gaugePointsCreated);
  assert.equal(outcome.result.program.pendingTargetedXp, outcome.result.targetedXpCreated);
  assert.equal(outcome.result.programCompleted, true);
  assert.equal(outcome.state.activeProgram, null);
});

test("le reçu de séance empêche de payer la fatigue ou le stimulus deux fois", () => {
  const started = activeProgram("strength-club", "cardio");
  const first = trainers.completeSession(started.state, progressionState(), {
    sourceId: "cardio-session-1",
    weekKey: "week-5",
    condition: { energy: 100 },
  });
  const duplicate = trainers.completeSession(first.state, first.progressionState, {
    sourceId: "cardio-session-1",
    weekKey: "week-5",
    condition: { energy: 100 },
  });

  assert.equal(duplicate.result.duplicate, true);
  assert.equal(duplicate.result.energyDelta, 0);
  assert.equal(duplicate.result.fatigueDelta, 0);
  assert.equal(duplicate.result.gaugePointsCreated, 0);
  assert.deepEqual(duplicate.state, first.state);
  assert.deepEqual(duplicate.progressionState, first.progressionState);
});

test("une séance trop exigeante est bloquée avant toute transition", () => {
  const started = activeProgram("boxing-elite", "defense");
  const skillState = progressionState();
  assert.throws(
    () => trainers.completeSession(started.state, skillState, {
      condition: { energy: 17 },
      weekKey: "week-4",
    }),
    error => error.code === "INSUFFICIENT_ENERGY" && error.details.required === 18,
  );
  assert.equal(started.state.activeProgram.sessionsCompleted, 0);
  assert.equal(skillState.stimulus.defense, 0);
});

test("la séance unique complète la réservation et conserve un historique minimal", () => {
  const started = activeProgram("boxing-club", "technique");
  const outcome = trainers.completeSession(started.state, progressionState(), {
    sourceId: "club-technique-1",
    weekKey: "week-3",
    condition: { energy: 100 },
  });

  assert.equal(outcome.result.programCompleted, true);
  assert.equal(outcome.state.activeProgram, null);
  assert.deepEqual(outcome.state.completedPrograms, ["program-boxing-club-technique"]);
  assert.equal(outcome.state.sessionReceipts.length, 1);
  assert.ok(outcome.progressionState.stimulus.technique > 0);
  assert.equal(outcome.progressionState.stats.technique, 40);
});

test("retire les anciens forfaits et expose seulement une réservation unitaire", () => {
  const legacy = trainerState({
    activeProgram: {
      id: "legacy-elite-defense",
      trainerId: "boxing-elite",
      target: "defense",
      sessionsTotal: 4,
      sessionsCompleted: 0,
      costPaid: 320,
    },
  });
  assert.equal(legacy.activeProgram, null);

  const started = activeProgram("boxing-elite", "defense");
  const publicState = trainers.getPublicState(started.state);

  assert.deepEqual(Object.keys(publicState), ["schemaVersion", "activeProgram"]);
  assert.equal(publicState.activeProgram.trainerLabel, "Hector Vargas");
  assert.equal(publicState.activeProgram.target, "defense");
  assert.equal(publicState.activeProgram.progress, 0);
  assert.equal(publicState.activeProgram.pendingTargetedXp, publicState.activeProgram.pendingGaugePoints);
  assert.equal("sessionReceipts" in publicState, false);
});

test("annuler une séance non exécutée rembourse explicitement son paiement", () => {
  const started = activeProgram("strength-specialist", "cardio");
  const cancelled = trainers.cancelProgram(started.state);
  assert.equal(cancelled.result.cancelled, true);
  assert.equal(cancelled.result.refund, 200);
  assert.equal(cancelled.result.freeSessionsReturned, 0);
  assert.equal(cancelled.state.activeProgram, null);
  const repeated = trainers.cancelProgram(cancelled.state);
  assert.equal(repeated.result.cancelled, false);
});

test("supprime une ancienne structure privateProgram sans inventer de gain", () => {
  const migrated = trainers.createState({
    privateProgram: {
      coachId: "specialist",
      target: "power",
      sessionsCompleted: 2,
      sessionsTotal: 4,
      firstSessionPaid: true,
    },
  });
  assert.equal(migrated.activeProgram, null);
});
