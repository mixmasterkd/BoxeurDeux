"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const progression = require("../v2-progression-engine.js");

const ZERO = Object.freeze({ technique: 0, power: 0, cardio: 0, defense: 0 });

function freshState(overrides = {}) {
  return progression.createState({
    stats: { technique: 40, power: 40, cardio: 40, defense: 40 },
    ...overrides,
  });
}

test("expose un noyau UMD/CommonJS et une configuration centrale immuable", () => {
  assert.equal(globalThis.BoxeurProgression, progression);
  assert.equal(progression.SCHEMA_VERSION, 1);
  assert.equal(progression.STATE_KIND, "boxeur-v2-progression");
  assert.deepEqual(progression.STAT_KEYS, ["technique", "power", "cardio", "defense"]);
  assert.equal(progression.DEFAULT_CONFIG.progressPointsPerStimulus, 2.4);
  assert.equal(Object.isFrozen(progression.DEFAULT_CONFIG), true);
  assert.equal(Object.isFrozen(progression.DEFAULT_CONFIG.assimilation), true);
  assert.throws(() => { progression.DEFAULT_CONFIG.statMax = 500; }, TypeError);
});

test("normalise les quatre statistiques, jauges et stimuli sans muter l'entrée", () => {
  const input = {
    stats: { technique: -8, power: 45.25, cardio: 800, defense: NaN },
    progress: { technique: -1, power: 35.55555, cardio: 150, defense: 12 },
    stimulus: { technique: -3, power: 25, cardio: 150, defense: 4 },
  };
  const before = structuredClone(input);
  const state = progression.createState(input);

  assert.deepEqual(input, before);
  assert.deepEqual(state.stats, { technique: 0, power: 45.25, cardio: 99, defense: 0 });
  assert.deepEqual(state.progress, { technique: 0, power: 35.5555, cardio: 100, defense: 12 });
  assert.deepEqual(state.stimulus, { technique: 0, power: 25, cardio: 100, defense: 4 });
  assert.deepEqual(state.stimulusReserve, ZERO);
});

test("une séance crée seulement du stimulus et ne donne aucun gain instantané", () => {
  const initial = freshState({ progress: { technique: 99 } });
  const before = structuredClone(initial);
  const outcome = progression.addStimulus(initial, { technique: 6 }, {
    weekKey: "week-1",
    sourceId: "session-1",
  });

  assert.deepEqual(initial, before);
  assert.deepEqual(outcome.state.stats, initial.stats);
  assert.deepEqual(outcome.state.progress, initial.progress);
  assert.equal(outcome.state.stimulus.technique, 6);
  assert.equal(outcome.result.effectiveAccepted.technique, 6);
  assert.equal(outcome.state.weeklyLoad.weekKey, "week-1");
});

test("un identifiant de séance empêche toute double progression", () => {
  const initial = freshState();
  const first = progression.addStimulus(initial, { defense: 8 }, {
    weekKey: "week-2",
    sourceId: "defense-2-a",
  });
  const duplicate = progression.addStimulus(first.state, { defense: 8 }, {
    weekKey: "week-2",
    sourceId: "defense-2-a",
  });

  assert.equal(duplicate.result.duplicate, true);
  assert.deepEqual(duplicate.state, first.state);
  assert.equal(duplicate.state.stimulus.defense, 8);
});

test("le rendement décroissant hebdomadaire est continu et indépendant du découpage", () => {
  const initial = freshState();
  const single = progression.addStimulus(initial, { technique: 30 }, {
    weekKey: "week-3",
    sourceId: "single",
  });
  const splitA = progression.addStimulus(initial, { technique: 20 }, {
    weekKey: "week-3",
    sourceId: "split-a",
  });
  const splitB = progression.addStimulus(splitA.state, { technique: 10 }, {
    weekKey: "week-3",
    sourceId: "split-b",
  });

  assert.equal(single.state.stimulus.technique, 28.1093);
  assert.equal(splitB.state.stimulus.technique, single.state.stimulus.technique);
  assert.equal(splitB.state.weeklyLoad.raw.technique, 30);
  assert.ok(splitB.result.diminishingFactors.technique < 1);

  const capped = progression.addStimulus(splitB.state, { technique: 5 }, {
    weekKey: "week-3",
    sourceId: "over-cap",
  });
  assert.equal(capped.result.rawAccepted.technique, 0);
  assert.equal(capped.result.rejectedByWeeklyCap.technique, 5);
  assert.equal(capped.state.stimulus.technique, single.state.stimulus.technique);
});

test("le plafond total répartit la charge sans favoriser une statistique", () => {
  const outcome = progression.addStimulus(freshState(), {
    technique: 30,
    power: 30,
    cardio: 30,
    defense: 30,
  }, { weekKey: "week-total", sourceId: "balanced-overload" });

  assert.deepEqual(outcome.result.rawAccepted, {
    technique: 17.5,
    power: 17.5,
    cardio: 17.5,
    defense: 17.5,
  });
  assert.equal(Object.values(outcome.result.rawAccepted).reduce((sum, value) => sum + value, 0), 70);
});

test("une statistique déjà plafonnée ne gaspille pas la capacité des autres", () => {
  const techniqueFull = progression.addStimulus(freshState(), { technique: 30 }, {
    weekKey: "redistribution",
    sourceId: "technique-full",
  });
  const mixed = progression.addStimulus(techniqueFull.state, {
    technique: 30,
    power: 30,
  }, { weekKey: "redistribution", sourceId: "mixed-after-full" });

  assert.equal(mixed.result.rawAccepted.technique, 0);
  assert.equal(mixed.result.rawAccepted.power, 30);
  assert.equal(mixed.state.weeklyLoad.raw.power, 30);
});

test("la récupération assimile le stimulus vers la jauge selon la stat et la condition", () => {
  const initial = freshState({ stimulus: { technique: 10 } });
  const before = structuredClone(initial);
  const outcome = progression.assimilate(initial, { energy: 100, fatigue: 0 }, {
    assimilationRate: 1,
    recoveryId: "night-1",
  });

  assert.deepEqual(initial, before);
  assert.equal(outcome.result.rate, 1);
  assert.equal(outcome.result.processedStimulus.technique, 10);
  assert.equal(outcome.result.efficiencies.technique, 0.6667);
  assert.equal(outcome.result.progressGains.technique, 16);
  assert.equal(outcome.state.progress.technique, 16);
  assert.equal(outcome.state.stimulus.technique, 0);
  assert.equal(outcome.state.stats.technique, 40);
});

test("une jauge à 100 donne +1 et conserve exactement le débordement", () => {
  const initial = freshState({
    progress: { technique: 95 },
    stimulus: { technique: 10 },
  });
  const outcome = progression.assimilate(initial, {}, { assimilationRate: 1 });

  assert.equal(outcome.result.progressGains.technique, 16);
  assert.equal(outcome.result.levelUps.technique, 1);
  assert.equal(outcome.result.statGains.technique, 1);
  assert.equal(outcome.state.stats.technique, 41);
  assert.equal(outcome.state.progress.technique, 11);
});

test("plusieurs passages de niveau restent exacts lors d'un gros débordement", () => {
  const initial = freshState({
    progress: { technique: 90 },
    stimulus: { technique: 100 },
  });
  const outcome = progression.assimilate(initial, {}, { assimilationRate: 1 });

  assert.equal(outcome.result.progressGains.technique, 160);
  assert.equal(outcome.result.levelUps.technique, 2);
  assert.equal(outcome.state.stats.technique, 42);
  assert.equal(outcome.state.progress.technique, 50);
});

test("la normalisation d'une sauvegarde résout aussi une jauge déjà pleine", () => {
  const state = freshState({
    stats: { technique: 40, power: 40, cardio: 40, defense: 40 },
    progress: { technique: 250 },
  });

  assert.equal(state.stats.technique, 42);
  assert.equal(state.progress.technique, 50);
});

test("une statistique maximale ne dépasse jamais 99 et signale le progrès bloqué", () => {
  const initial = freshState({
    stats: { technique: 99, power: 99, cardio: 99, defense: 99 },
    progress: { technique: 95 },
    stimulus: { technique: 100 },
  });
  const outcome = progression.assimilate(initial, {}, { assimilationRate: 1 });

  assert.equal(outcome.state.stats.technique, 99);
  assert.equal(outcome.state.progress.technique, 100);
  assert.equal(outcome.result.levelUps.technique, 0);
  assert.equal(outcome.result.progressGains.technique, 42);
  assert.equal(outcome.result.blockedProgress.technique, 37);
  progression.STAT_KEYS.forEach(key => assert.ok(outcome.state.stats[key] <= 99));
});

test("la réserve migrée est assimilée sans perte et sans dépasser la jauge active", () => {
  const initial = freshState({
    stimulus: { cardio: 100 },
    stimulusReserve: { cardio: 50 },
  });
  const outcome = progression.assimilate(initial, {}, { assimilationRate: 0.5 });

  assert.equal(outcome.result.processedStimulus.cardio, 50);
  assert.equal(outcome.result.reserveTransferred.cardio, 50);
  assert.equal(outcome.state.stimulus.cardio, 100);
  assert.equal(outcome.state.stimulusReserve.cardio, 0);
  assert.equal(
    initial.stimulus.cardio + initial.stimulusReserve.cardio
      - outcome.result.processedStimulus.cardio,
    outcome.state.stimulus.cardio + outcome.state.stimulusReserve.cardio,
  );
});

test("un identifiant de récupération empêche d'assimiler deux fois la même nuit", () => {
  const initial = freshState({ stimulus: { cardio: 20 } });
  const first = progression.assimilate(initial, {}, {
    assimilationRate: 0.5,
    recoveryId: "week-4-night-1",
  });
  const duplicate = progression.assimilate(first.state, {}, {
    assimilationRate: 0.5,
    recoveryId: "week-4-night-1",
  });

  assert.equal(duplicate.result.duplicate, true);
  assert.deepEqual(duplicate.state, first.state);
});

test("l'entraîneur privé bonifie seulement le stimulus ciblé, jamais la stat", () => {
  const initial = freshState({ progress: { power: 99 } });
  const outcome = progression.applyPrivateTrainerSession(initial, {
    target: "power",
    baseStimulus: 10,
    quality: 100,
  }, { weekKey: "private-1", sourceId: "private-power-1" });

  assert.equal(outcome.result.trainer.multiplier, 1.35);
  assert.equal(outcome.result.requested.power, 13.5);
  assert.equal(outcome.state.stimulus.power, 13.5);
  assert.equal(outcome.state.stimulus.technique, 0);
  assert.deepEqual(outcome.state.stats, initial.stats);
  assert.deepEqual(outcome.state.progress, initial.progress);
});

test("la migration V5 transforme les dixièmes historiques en jauges visibles", () => {
  const legacy = {
    state: {
      combatStats: { technique: 52, power: 49.25, cardio: 57, defense: 54 },
      trainingProgress: { technique: 4, power: 0, cardio: 9, defense: 2 },
    },
  };
  const before = structuredClone(legacy);
  const migrated = progression.migrate(legacy);

  assert.deepEqual(legacy, before);
  assert.equal(migrated.report.source, "legacy-training-progress");
  assert.deepEqual(migrated.state.stats, {
    technique: 52,
    power: 49.25,
    cardio: 57,
    defense: 54,
  });
  assert.deepEqual(migrated.state.progress, {
    technique: 40,
    power: 0,
    cardio: 90,
    defense: 20,
  });
  assert.deepEqual(migrated.state.stimulus, ZERO);
});

test("une ancienne sauvegarde incomplète reprend la valeur historique par défaut", () => {
  const migrated = progression.migrate({
    state: {
      combatStats: { technique: 55 },
      trainingProgress: { technique: 2 },
    },
  });

  assert.deepEqual(migrated.state.stats, {
    technique: 55,
    power: 40,
    cardio: 40,
    defense: 40,
  });
  assert.equal(migrated.state.progress.technique, 20);
});

test("le stimulus BoxeurTime est prioritaire sur trainingProgress pour éviter le double crédit", () => {
  const capsule = {
    legacySnapshot: {
      state: {
        combatStats: { technique: 52, power: 49, cardio: 57, defense: 54 },
        trainingProgress: { technique: 4, power: 0, cardio: 9, defense: 2 },
      },
    },
    timeState: {
      stats: { technique: 52.1, power: 49, cardio: 57.2, defense: 54 },
      stimulus: { technique: 25, power: 0, cardio: 80, defense: 5 },
    },
    legacyTrainingCarry: {
      stimulusReserve: { technique: 3, power: 0, cardio: 12, defense: 0 },
    },
  };
  const migrated = progression.migrate(capsule);

  assert.equal(migrated.report.source, "boxeur-time");
  assert.equal(migrated.report.ignoredLegacyProgress, true);
  assert.equal(migrated.state.stats.technique, 52.1);
  assert.deepEqual(migrated.state.progress, ZERO);
  assert.deepEqual(migrated.state.stimulus, {
    technique: 25,
    power: 0,
    cardio: 80,
    defense: 5,
  });
  assert.deepEqual(migrated.state.stimulusReserve, {
    technique: 3,
    power: 0,
    cardio: 12,
    defense: 0,
  });
});

test("la migration conserve en réserve tout stimulus actif supérieur à 100", () => {
  const migrated = progression.migrate({
    stats: { technique: 50, power: 50, cardio: 50, defense: 50 },
    stimulus: { technique: 135, power: 0, cardio: 0, defense: 0 },
  });

  assert.equal(migrated.state.stimulus.technique, 100);
  assert.equal(migrated.state.stimulusReserve.technique, 35);
});

test("dix séances ciblées conservent la cadence historique près de +1", () => {
  let state = freshState();
  for (let index = 1; index <= 10; index += 1) {
    state = progression.addStimulus(state, { technique: 6 }, {
      weekKey: `week-${index}`,
      sourceId: `technique-${index}`,
    }).state;
    state = progression.assimilate(state, {}, {
      assimilationRate: 1,
      recoveryId: `recovery-${index}`,
    }).state;
  }
  const equivalentGain = progression.getBalanceEquivalent(state).technique - 40;

  assert.equal(state.stats.technique, 40);
  assert.equal(state.progress.technique, 96);
  assert.ok(equivalentGain >= 0.8 && equivalentGain <= 1.25, `gain équivalent : ${equivalentGain}`);
});

test("l'état public expose les jauges sans divulguer les reçus internes", () => {
  const applied = progression.addStimulus(freshState(), { defense: 5 }, {
    weekKey: "public-1",
    sourceId: "public-session",
  });
  const publicState = progression.getPublicState(applied.state);

  assert.deepEqual(Object.keys(publicState), ["schemaVersion", "stats", "progress", "stimulus", "maxed"]);
  assert.equal("weeklyLoad" in publicState, false);
  assert.equal("assimilationIds" in publicState, false);
  assert.equal(publicState.progress.defense, 0);
  assert.equal(publicState.stimulus.defense, 5);
});

test("refuse les stimuli et cibles invalides", () => {
  const initial = freshState();
  assert.throws(
    () => progression.addStimulus(initial, { technique: -1 }),
    error => error.code === "INVALID_STIMULUS",
  );
  assert.throws(
    () => progression.addStimulus(initial, ZERO),
    error => error.code === "EMPTY_STIMULUS",
  );
  assert.throws(
    () => progression.applyPrivateTrainerSession(initial, { target: "vitesse", baseStimulus: 5 }),
    error => error.code === "INVALID_TRAINER_TARGET",
  );
  assert.throws(
    () => progression.applyPrivateTrainerSession(initial, { target: "technique", baseStimulus: 0 }),
    error => error.code === "INVALID_TRAINER_STIMULUS",
  );
});

test("les transitions maintiennent les bornes et la conservation sur les cas limites", () => {
  const stats = [0, 40, 98, 99];
  const progresses = [0, 99.9999, 100, 250];
  const stimuli = [0, 0.0001, 50, 100];

  stats.forEach(stat => {
    progresses.forEach(progressValue => {
      stimuli.forEach(stimulusValue => {
        const initial = freshState({
          stats: { technique: stat, power: 40, cardio: 40, defense: 40 },
          progress: { technique: progressValue },
          stimulus: { technique: stimulusValue },
        });
        const beforePending = initial.stimulus.technique + initial.stimulusReserve.technique;
        const outcome = progression.assimilate(initial, {}, { assimilationRate: 0.37 });
        const afterPending = outcome.state.stimulus.technique + outcome.state.stimulusReserve.technique;

        assert.ok(outcome.state.stats.technique >= 0 && outcome.state.stats.technique <= 99);
        assert.ok(outcome.state.progress.technique >= 0 && outcome.state.progress.technique <= 100);
        assert.ok(outcome.state.stimulus.technique >= 0 && outcome.state.stimulus.technique <= 100);
        assert.equal(
          Number((beforePending - outcome.result.processedStimulus.technique).toFixed(4)),
          Number(afterPending.toFixed(4)),
        );
      });
    });
  });
});
