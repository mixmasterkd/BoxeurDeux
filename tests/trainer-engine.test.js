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

function activeProgram(trainerId = "club", target = "technique", balance = 500) {
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
  assert.equal(trainers.TRAINERS.length, 3);
  assert.equal(Object.isFrozen(trainers.TRAINERS), true);
  assert.equal(Object.isFrozen(trainers.TRAINERS[0]), true);
});

test("un entraîneur plus cher produit davantage d’XP ciblée entière estimée", () => {
  const offers = trainers.listOffers({ statValue: 40 });
  assert.deepEqual(offers.map(offer => offer.cost), [60, 120, 220]);
  assert.ok(offers[0].estimatedGaugePointsPerSession < offers[1].estimatedGaugePointsPerSession);
  assert.ok(offers[1].estimatedGaugePointsPerSession < offers[2].estimatedGaugePointsPerSession);
  offers.forEach(offer => {
    assert.equal(Number.isInteger(offer.estimatedTargetedXpPerSession), true);
    assert.equal(offer.estimatedTargetedXpPerSession, offer.estimatedGaugePointsPerSession);
    assert.ok(offer.estimatedTargetedXpPerSession > 0 && offer.estimatedTargetedXpPerSession < 100);
  });
});

test("les séances réelles respectent aussi l'ordre de rendement du catalogue", () => {
  const outcomes = ["club", "specialist", "elite"].map(trainerId => {
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
  const beginner = trainers.estimateGaugePoints("elite", 20);
  const intermediate = trainers.estimateGaugePoints("elite", 55);
  const advanced = trainers.estimateGaugePoints("elite", 90);
  assert.equal(beginner, intermediate);
  assert.equal(intermediate, advanced);
  assert.equal(Number.isInteger(advanced), true);
  assert.ok(advanced > 0);
});

test("démarrer un programme déduit son coût par contrat sans muter les finances externes", () => {
  const initial = trainerState();
  const before = structuredClone(initial);
  const outcome = trainers.startProgram(initial, {
    trainerId: "specialist",
    target: "defense",
    startedWeek: 4,
    programId: "defense-4",
  }, { balance: 300 });

  assert.deepEqual(initial, before);
  assert.equal(outcome.result.moneyDelta, -120);
  assert.equal(outcome.result.remainingBalance, 180);
  assert.equal(outcome.state.activeProgram.target, "defense");
  assert.equal(outcome.state.activeProgram.sessionsCompleted, 0);
  assert.equal(outcome.state.activeProgram.costPaid, 120);
});

test("un bon de cours privé paie exactement une séance du prochain programme", () => {
  const outcome = trainers.startProgram(trainerState(), {
    trainerId: "specialist",
    target: "technique",
    startedWeek: 5,
  }, { balance: 100, freeSessions: 1 });

  assert.equal(outcome.result.regularCost, 120);
  assert.equal(outcome.result.discount, 30);
  assert.equal(outcome.result.moneyDelta, -90);
  assert.equal(outcome.result.remainingBalance, 10);
  assert.equal(outcome.result.freeSessionsUsed, 1);
  assert.equal(outcome.state.activeProgram.costPaid, 90);
});

test("refuse un programme sans argent, avec une cible invalide ou pendant un programme actif", () => {
  assert.throws(
    () => trainers.startProgram(trainerState(), { trainerId: "elite", target: "power" }, { balance: 219 }),
    error => error.code === "INSUFFICIENT_FUNDS" && error.details.cost === 220,
  );
  assert.throws(
    () => trainers.startProgram(trainerState(), { trainerId: "club", target: "vitesse" }, { balance: 500 }),
    error => error.code === "INVALID_TRAINER_TARGET",
  );
  const started = activeProgram();
  assert.throws(
    () => trainers.startProgram(started.state, { trainerId: "elite", target: "power" }, { balance: 500 }),
    error => error.code === "ACTIVE_PROGRAM_EXISTS",
  );
});

test("une séance privée crée seulement du stimulus ciblé et retourne énergie/fatigue", () => {
  const started = activeProgram("specialist", "power");
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
  assert.equal(outcome.state.activeProgram.sessionsCompleted, 1);
  assert.equal(outcome.state.activeProgram.pendingGaugePoints, outcome.result.gaugePointsCreated);
  assert.equal(outcome.state.activeProgram.pendingTargetedXp, outcome.result.targetedXpCreated);
});

test("le reçu de séance empêche de payer la fatigue ou le stimulus deux fois", () => {
  const started = activeProgram("club", "cardio");
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
  const started = activeProgram("elite", "defense");
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

test("la quatrième séance complète le programme et conserve un historique minimal", () => {
  let state = activeProgram("club", "technique").state;
  let skills = progressionState();
  for (let index = 1; index <= 4; index += 1) {
    const outcome = trainers.completeSession(state, skills, {
      sourceId: `club-technique-${index}`,
      weekKey: `week-${index}`,
      condition: { energy: 100 },
    });
    state = outcome.state;
    skills = outcome.progressionState;
    if (index < 4) assert.equal(outcome.result.programCompleted, false);
    else assert.equal(outcome.result.programCompleted, true);
  }

  assert.equal(state.activeProgram, null);
  assert.deepEqual(state.completedPrograms, ["program-club-technique"]);
  assert.equal(state.sessionReceipts.length, 4);
  assert.ok(skills.stimulus.technique > 0);
  assert.equal(skills.stats.technique, 40);
});

test("l'état public expose le programme pour la fiche Boxeur sans les reçus internes", () => {
  const started = activeProgram("elite", "defense");
  const session = trainers.completeSession(started.state, progressionState(), {
    sourceId: "elite-defense-1",
    weekKey: "week-7",
    condition: { energy: 100 },
  });
  const publicState = trainers.getPublicState(session.state);

  assert.deepEqual(Object.keys(publicState), ["schemaVersion", "activeProgram"]);
  assert.equal(publicState.activeProgram.trainerLabel, "Nadia Bouchard");
  assert.equal(publicState.activeProgram.target, "defense");
  assert.equal(publicState.activeProgram.progress, 25);
  assert.ok(publicState.activeProgram.pendingGaugePoints > 0);
  assert.equal(publicState.activeProgram.pendingTargetedXp, publicState.activeProgram.pendingGaugePoints);
  assert.equal("sessionReceipts" in publicState, false);
});

test("annuler est explicite et ne crée aucun remboursement implicite", () => {
  const started = activeProgram("specialist", "cardio");
  const cancelled = trainers.cancelProgram(started.state);
  assert.equal(cancelled.result.cancelled, true);
  assert.equal(cancelled.result.refund, 0);
  assert.equal(cancelled.state.activeProgram, null);
  const repeated = trainers.cancelProgram(cancelled.state);
  assert.equal(repeated.result.cancelled, false);
});

test("normalise une ancienne structure privateProgram sans inventer de gain", () => {
  const migrated = trainers.createState({
    privateProgram: {
      coachId: "specialist",
      target: "power",
      sessionsCompleted: 2,
      sessionsTotal: 4,
      firstSessionPaid: true,
    },
  });
  assert.equal(migrated.activeProgram.trainerId, "specialist");
  assert.equal(migrated.activeProgram.sessionsCompleted, 2);
  assert.equal(migrated.activeProgram.pendingGaugePoints, 0);
  assert.equal(migrated.activeProgram.pendingTargetedXp, 0);
});
