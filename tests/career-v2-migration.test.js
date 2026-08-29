"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const time = require("../career-time-engine.js");
const migration = require("../career-v2-migration.js");

const MIGRATED_AT = "2026-08-23T14:30:00.000Z";

function v5Snapshot(overrides = {}) {
  const stateOverrides = overrides.state || {};
  return {
    version: 5,
    savedAt: "2026-08-20T12:00:00.000Z",
    weeklyPlan: ["jump-rope", { id: "coach-session", paid: true }],
    ...overrides,
    state: {
      profile: { firstName: "Alex", lastName: "Roy", sex: "female" },
      week: 17,
      energy: 64,
      fatigue: 28,
      money: 875,
      jobId: "courier",
      vacationBankWeeks: 2,
      tournaments: { bronze: "won", silver: "entered" },
      activeTournament: null,
      amateurRecord: { wins: 4, losses: 1, draws: 0 },
      professionalRecord: { wins: 0, losses: 0, draws: 0 },
      careerStatus: "amateur",
      combatStats: { technique: 52, power: 49, cardio: 57, defense: 54 },
      trainingProgress: { technique: 4, power: 0, cardio: 9, defense: 2 },
      unknownFutureField: { must: "survive" },
      ...stateOverrides,
    },
  };
}

test("expose une API CommonJS et globale adossée à BoxeurTime", () => {
  assert.equal(globalThis.BoxeurCareerV2Migration, migration);
  assert.equal(migration.CAPSULE_VERSION, 2);
  assert.equal(migration.LEGACY_TRAINING_CARRY_VERSION, 1);
  assert.equal(migration.EXPECTED_SOURCE_VERSION, 5);
  assert.equal(time.STAT_GAIN_SCALE, 0.024);
});

test("migration additive, immutable et idempotente", () => {
  const source = v5Snapshot();
  const before = structuredClone(source);
  const capsule = migration.migrateV5ToV2(source, { migratedAt: MIGRATED_AT, seed: "alex" });

  assert.deepEqual(source, before, "la sauvegarde reçue ne doit pas être modifiée");
  assert.notEqual(capsule.legacySnapshot, source);
  assert.deepEqual(capsule.legacySnapshot, source);
  assert.deepEqual(capsule.legacyPendingPlan, source.weeklyPlan);
  assert.notEqual(capsule.legacyPendingPlan, source.weeklyPlan);
  assert.equal(capsule.migrationAudit.legacyWeeklyPlan.executed, false);
  assert.equal(capsule.migratedAt, MIGRATED_AT);

  const secondPass = migration.migrateV5ToV2(capsule, { migratedAt: "2099-01-01T00:00:00Z" });
  assert.deepEqual(secondPass, capsule, "une capsule ne doit jamais être migrée une deuxième fois");
  assert.notEqual(secondPass, capsule, "l'idempotence ne doit pas exposer le même objet mutable");
});

test("rollback restitue exactement le snapshot initial et une copie indépendante", () => {
  const source = v5Snapshot({ customEnvelope: { checksum: "abc" } });
  const capsule = migration.migrateV5ToV2(source, { migratedAt: MIGRATED_AT });
  capsule.timeState.condition.energy = 1;
  capsule.legacyPendingPlan.push("not-in-source");

  const restored = migration.rollbackV2Migration(capsule);
  assert.deepEqual(restored, source);
  assert.notEqual(restored, capsule.legacySnapshot);
  restored.state.money = 0;
  assert.equal(capsule.legacySnapshot.state.money, 875);
});

test("progression partielle devient de l’XP ciblée cumulative sans hausse immédiate", () => {
  const source = v5Snapshot();
  const capsule = migration.migrateV5ToV2(source, { migratedAt: MIGRATED_AT });
  assert.equal(capsule.timeState.stats.technique, 52, "la migration ne doit accorder aucun point");
  assert.equal(capsule.timeState.statXp.technique, 16);
  assert.equal(capsule.timeState.statXp.cardio, 36);
  assert.equal(capsule.migrationAudit.trainingProgress.technique.intendedGain, 0.4);
  assert.equal(capsule.timeState.stimulus.power, 0);
  assert.ok(Object.values(capsule.timeState.stimulus).every(value => value === 0));

  const extreme = migration.migrateV5ToV2(v5Snapshot({ state: {
    combatStats: { technique: 100, power: 100, cardio: 100, defense: 100 },
    trainingProgress: { technique: 9, power: 9, cardio: 9, defense: 9 },
  } }), { migratedAt: MIGRATED_AT });
  assert.equal(extreme.timeState.statXp.technique, 36);
  assert.equal(extreme.timeState.stimulus.technique, 0);
  const extremeAudit = extreme.migrationAudit.trainingProgress.technique;
  const extremeCarry = extreme.legacyTrainingCarry;
  assert.ok(extremeAudit.overflowStimulus > 0);
  assert.equal(extremeCarry.unit, "legacy-stat-gain");
  assert.equal(extremeCarry.intendedStatGain.technique, 0.9);
  assert.equal(extremeCarry.stimulusReserve.technique, extremeAudit.overflowStimulus);
  assert.equal(extreme.timeState.stats.technique, 99, "la réserve ne doit pas devenir un point immédiat");
});

test("répare rétrocompatiblement une capsule V2 antérieure sans réserve", () => {
  const source = v5Snapshot({ state: {
    combatStats: { technique: 99, power: 99, cardio: 99, defense: 99 },
    trainingProgress: { technique: 9, power: 8, cardio: 7, defense: 6 },
  } });
  const current = migration.migrateV5ToV2(source, { migratedAt: MIGRATED_AT });
  const olderCapsule = structuredClone(current);
  delete olderCapsule.legacyTrainingCarry;

  const repaired = migration.migrateV5ToV2(olderCapsule);
  assert.equal(repaired.version, 2, "le correctif reste additif au format de capsule existant");
  assert.equal(repaired.legacyTrainingCarry.intendedStatGain.technique, 0.9);
  assert.equal(repaired.timeState.statXp.technique, 36);
  assert.equal(repaired.timeState.stimulus.technique, 0);
  assert.equal("legacyTrainingCarry" in olderCapsule, false, "la réparation doit demeurer immutable");
  assert.deepEqual(migration.migrateV5ToV2(repaired), repaired, "une capsule réparée redevient idempotente");
});

test("met à niveau une ancienne capsule à statistiques fractionnaires sans perdre sa progression", () => {
  const current = migration.migrateV5ToV2(v5Snapshot(), { migratedAt: MIGRATED_AT });
  const olderCapsule = structuredClone(current);
  delete olderCapsule.timeState.statXpVersion;
  delete olderCapsule.timeState.statXp;
  delete olderCapsule.timeState.statXpRanks;
  olderCapsule.timeState.schemaVersion = 1;
  olderCapsule.timeState.stats.technique = 52.25;
  olderCapsule.timeState.stimulus.technique = 10;

  const upgraded = migration.migrateV5ToV2(olderCapsule);

  assert.equal(upgraded.timeState.stats.technique, 52);
  assert.equal(upgraded.timeState.statXp.technique, 10);
  assert.ok(upgraded.timeState.stimulus.technique > 0);
  assert.equal(upgraded.timeState.statXpVersion, 1);
  assert.equal("statXp" in olderCapsule.timeState, false, "la mise à niveau doit rester immutable");
});

test("le stimulus actif et sa réserve représentent exactement chaque fraction héritée", () => {
  for (let stat = 0; stat <= 99; stat += 1) {
    for (let progress = 0; progress <= 9; progress += 1) {
      const converted = migration.progressToResidualStimulus(progress, stat);
      assert.equal(
        Number((converted.appliedStimulus + converted.overflowStimulus).toFixed(4)),
        converted.rawStimulus,
        `conversion inexacte pour stat=${stat}, progression=${progress}`,
      );
      assert.ok(converted.appliedStimulus <= 100);
      assert.ok(converted.overflowStimulus >= 0);
    }
  }
});

test("identifie les phases récréative, amateur, tournoi et professionnelle", () => {
  const cases = [
    [{ careerStatus: "recreational" }, "recreational"],
    [{ careerStatus: "amateur_pending" }, "amateur"],
    [{ careerStatus: "amateur" }, "amateur"],
    [{ careerStatus: "amateur", activeTournament: { status: "in_progress" } }, "tournament"],
    [{ careerStatus: "professional" }, "professional"],
  ];

  cases.forEach(([state, expected], index) => {
    const capsule = migration.migrateV5ToV2(v5Snapshot({ state }), {
      migratedAt: MIGRATED_AT,
      seed: `phase-${index}`,
    });
    assert.equal(capsule.phase, expected);
  });
});

test("borne les données invalides et produit quand même un état temps sain", () => {
  const source = {
    version: Infinity,
    weeklyPlan: "pas-un-plan",
    state: {
      careerStatus: "???",
      week: -400,
      energy: 800,
      fatigue: -20,
      combatStats: { technique: NaN, power: Infinity, cardio: -3, defense: 400 },
      trainingProgress: { technique: -9, power: 100, cardio: NaN, defense: 4.5 },
    },
  };
  const capsule = migration.migrateV5ToV2(source, { migratedAt: "invalide" });

  assert.equal(capsule.sourceVersion, 5);
  assert.equal(capsule.migratedAt, "1970-01-01T00:00:00.000Z");
  assert.equal(capsule.phase, "amateur");
  assert.equal(capsule.timeState.clock.week, 1);
  assert.deepEqual(capsule.timeState.condition, { energy: 100, fatigue: 0 });
  assert.deepEqual(capsule.timeState.stats, { technique: 40, power: 40, cardio: 0, defense: 99 });
  assert.equal(capsule.timeState.stimulus.technique, 0);
  assert.equal(capsule.migrationAudit.trainingProgress.power.progress, 9);
  assert.deepEqual(capsule.legacyPendingPlan, []);
});

test("synchronise seulement semaine, condition et stats vers une copie carrière", () => {
  const source = v5Snapshot({ state: {
    fitness: 23,
    morale: 81,
    injury: 67,
    injuryWeeks: 3,
    injuryStartedWeek: 16,
  } });
  const sourceBefore = structuredClone(source);
  const capsule = migration.migrateV5ToV2(source, { migratedAt: MIGRATED_AT });
  let nextTime = time.advanceTime(capsule.timeState, 21, () => 0.5);
  nextTime = {
    ...nextTime,
    stats: { ...nextTime.stats, technique: 53.25 },
  };
  const synced = migration.syncTimeStateToCareer(capsule, nextTime);

  assert.deepEqual(source, sourceBefore);
  assert.equal(synced.state.week, 18);
  assert.equal(synced.state.combatStats.technique, 53.25);
  assert.equal(synced.state.money, source.state.money);
  assert.equal(synced.state.jobId, source.state.jobId);
  assert.equal(synced.state.vacationBankWeeks, source.state.vacationBankWeeks);
  assert.deepEqual(synced.state.tournaments, source.state.tournaments);
  assert.deepEqual(synced.state.amateurRecord, source.state.amateurRecord);
  assert.deepEqual(synced.state.professionalRecord, source.state.professionalRecord);
  assert.deepEqual(synced.state.unknownFutureField, source.state.unknownFutureField);
  assert.deepEqual(
    {
      fitness: synced.state.fitness,
      morale: synced.state.morale,
      injury: synced.state.injury,
      injuryWeeks: synced.state.injuryWeeks,
      injuryStartedWeek: synced.state.injuryStartedWeek,
    },
    { fitness: 23, morale: 81, injury: 67, injuryWeeks: 3, injuryStartedWeek: 16 },
    "les champs V1 restent sérialisés même s'ils sont inactifs en V2",
  );
});
