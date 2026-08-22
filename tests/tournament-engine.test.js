"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const tournament = require("../tournament-engine");

const WEIGHT = Object.freeze({ className: "Poids léger", minKg: 55, maxKg: 60, toleranceKg: 0 });

function create(totalBouts = 3, condition = {}) {
  return tournament.createTournament({
    id: `test-${totalBouts}`,
    totalBouts,
    weight: WEIGHT,
    condition: {
      energy: 72,
      fatigue: 10,
      injury: 8,
      fitness: 50,
      cardio: 50,
      headDamage: 0,
      bodyDamage: 0,
      lucidity: 100,
      ...condition,
    },
  });
}

function passDailyChecks(state, overrides = {}) {
  return tournament.performDailyChecks(state, {
    weightKg: 59.5,
    doctorStatus: "fit",
    ...overrides,
  });
}

function winCurrentBout(state, condition = {}) {
  const started = tournament.beginBout(state);
  return tournament.recordBoutResult(started, {
    result: "win",
    method: "points",
    score: "30–27",
    opponent: `Adversaire ${started.currentBout.number}`,
    condition: { ...started.condition, ...condition },
  });
}

test("expose la même API en CommonJS et sur globalThis", () => {
  assert.equal(globalThis.BoxeurTournament, tournament);
  assert.equal(tournament.SCHEMA_VERSION, 1);
  assert.deepEqual(tournament.SUPPORTED_LENGTHS, [3, 5]);
});

test("accepte uniquement les tableaux de trois ou cinq combats", () => {
  assert.equal(create(3).totalBouts, 3);
  assert.equal(create(5).totalBouts, 5);
  assert.throws(
    () => create(4),
    error => error.code === "UNSUPPORTED_LENGTH"
  );
});

test("exige une pesée et un examen chaque jour avant le combat", () => {
  let state = create(3);
  assert.equal(state.phase, tournament.PHASES.DAILY_CHECK);
  assert.equal(tournament.canStartBout(state).ok, false);

  state = passDailyChecks(state);
  assert.equal(state.phase, tournament.PHASES.READY);
  assert.equal(state.weight.last.day, 1);
  assert.equal(state.medical.status, "fit");
  assert.equal(tournament.canStartBout(state).ok, true);
});

test("un échec à la pesée produit un WO et ferme le parcours", () => {
  const state = passDailyChecks(create(3), { weightKg: 60.01 });
  assert.equal(state.phase, tournament.PHASES.WITHDRAWN);
  assert.deepEqual(state.termination, { method: "WO", reason: "weigh_in", day: 1 });
  assert.equal(tournament.canStartBout(state).ok, false);
});

test("une pesée non configurée est une erreur d'intégration, pas un WO", () => {
  const state = tournament.createTournament({ id: "sans-limite", totalBouts: 3 });
  assert.throws(
    () => tournament.performDailyChecks(state, { weightKg: 59, doctorStatus: "fit" }),
    error => error.code === "WEIGH_IN_UNCONFIGURED"
  );
  assert.equal(state.phase, tournament.PHASES.DAILY_CHECK);
});

test("une inaptitude médicale ou une restriction produit un WO", () => {
  const explicit = passDailyChecks(create(3), { doctorStatus: "unfit" });
  assert.equal(explicit.phase, tournament.PHASES.WITHDRAWN);
  assert.equal(explicit.termination.reason, "medical");

  const restricted = passDailyChecks(create(3), { restrictionDays: 7, doctorStatus: "fit" });
  assert.equal(restricted.phase, tournament.PHASES.WITHDRAWN);
  assert.ok(restricted.termination.details.includes("medical_restriction"));
});

test("une aptitude avec avertissement permet le combat", () => {
  const state = passDailyChecks(create(3, { energy: 30 }), { doctorStatus: "fit_with_warning" });
  assert.equal(state.phase, tournament.PHASES.READY);
  assert.equal(state.medical.status, "fit_with_warning");
  assert.equal(tournament.canStartBout(state).ok, true);
});

test("la récupération adaptative reste prudente et les trois choix ont des compromis", () => {
  const baseState = create(3);
  baseState.condition = tournament.normalizeCondition({
    ...baseState.condition,
    energy: 30,
    fatigue: 40,
    injury: 20,
    headDamage: 40,
    bodyDamage: 20,
    lucidity: 50,
  });
  const choices = tournament.getInterBoutChoices(baseState);
  const rest = tournament.previewInterBoutRecovery(baseState, tournament.CHOICE_IDS.REST);
  const protect = tournament.previewInterBoutRecovery(baseState, tournament.CHOICE_IDS.PROTECT);
  const scout = tournament.previewInterBoutRecovery(baseState, tournament.CHOICE_IDS.SCOUT);

  assert.equal(choices.length, 3);
  assert.deepEqual(choices.map(choice => choice.id), ["rest", "protect", "scout"]);
  assert.equal(scout.targetEnergy, 82);
  assert.deepEqual(scout.afterBase, {
    energy: 66,
    fatigue: 19,
    injury: 20,
    fitness: 50,
    cardio: 50,
    headDamage: 12,
    bodyDamage: 8,
    lucidity: 75,
  });
  assert.equal(rest.after.energy, 72);
  assert.equal(rest.after.fatigue, 16);
  assert.equal(rest.after.lucidity, 80);
  assert.equal(protect.targetZone, "head");
  assert.equal(protect.after.headDamage, 8);
  assert.equal(protect.effects[0].impactReduction, 0.15);
  assert.equal(scout.effects[0].readAccuracyBonus, 0.08);
});

test("la récupération est idempotente et avance d'une seule journée", () => {
  let state = passDailyChecks(create(3));
  state = winCurrentBout(state, { energy: 35, fatigue: 35, headDamage: 20 });
  const recoveryId = state.interBout.id;
  const recovered = tournament.applyInterBoutChoice(state, tournament.CHOICE_IDS.REST);
  const duplicate = tournament.applyInterBoutChoice(recovered, tournament.CHOICE_IDS.REST, { recoveryId });
  const duplicateWithoutExplicitId = tournament.applyInterBoutChoice(recovered, tournament.CHOICE_IDS.REST);

  assert.equal(recovered.day, 2);
  assert.equal(recovered.phase, tournament.PHASES.DAILY_CHECK);
  assert.deepEqual(duplicate, recovered);
  assert.deepEqual(duplicateWithoutExplicitId, recovered);
  assert.equal(recovered.appliedRecoveryIds.filter(id => id === recoveryId).length, 1);
});

test("interdit deux combats dans la même journée même si la phase est altérée", () => {
  let state = passDailyChecks(create(3));
  state = winCurrentBout(state);
  state.phase = tournament.PHASES.READY;
  state.medical = { status: "fit", day: 1, reasons: [] };
  state.weight.last = { passed: true, day: 1 };

  const readiness = tournament.canStartBout(state);
  assert.equal(readiness.ok, false);
  assert.match(readiness.reason, /Un seul combat/);
});

test("refuse explicitement tout résultat nul amateur", () => {
  const state = tournament.beginBout(passDailyChecks(create(3)));
  assert.throws(
    () => tournament.recordBoutResult(state, { result: "Match nul" }),
    error => error.code === "DRAW_NOT_ALLOWED"
  );
});

for (const totalBouts of [3, 5]) {
  test(`enchaîne exactement ${totalBouts} combats sur ${totalBouts} jours`, () => {
    let state = create(totalBouts);
    for (let bout = 1; bout <= totalBouts; bout += 1) {
      state = passDailyChecks(state);
      assert.equal(state.day, bout);
      state = winCurrentBout(state, { energy: 45, fatigue: 28 });
      if (bout < totalBouts) {
        assert.equal(state.phase, tournament.PHASES.INTER_BOUT);
        state = tournament.applyInterBoutChoice(state, tournament.CHOICE_IDS.SCOUT);
        assert.equal(state.day, bout + 1);
      }
    }

    assert.equal(state.phase, tournament.PHASES.COMPLETED);
    assert.equal(state.wins, totalBouts);
    assert.equal(state.boutsFought, totalBouts);
    assert.equal(state.day, totalBouts);
    assert.equal(state.results.length, totalBouts);
  });
}

test("propage une blessure aiguë vers le contrôle du lendemain", () => {
  let state = passDailyChecks(create(3));
  state = tournament.beginBout(state);
  state = tournament.recordBoutResult(state, {
    result: "win",
    condition: { ...state.condition, energy: 42 },
    medical: { acuteInjury: true },
  });
  state = tournament.applyInterBoutChoice(state, tournament.CHOICE_IDS.PROTECT);
  state = passDailyChecks(state, { doctorStatus: "fit" });

  assert.equal(state.day, 2);
  assert.equal(state.phase, tournament.PHASES.WITHDRAWN);
  assert.equal(state.termination.reason, "medical");
});

test("migre un tournoi v3 sans appliquer une seconde récupération", () => {
  const legacy = {
    id: "golden",
    status: "active",
    currentRound: 1,
    opponents: [{}, {}, {}],
    results: [{ round: 0, result: "Victoire", score: "29–28", opponent: "A" }],
  };
  const migrated = tournament.migrateLegacyTournament(legacy, {
    condition: { energy: 68, fatigue: 22, injury: 12, cardio: 55, fitness: 52 },
    weight: WEIGHT,
  });

  assert.equal(migrated.schemaVersion, 1);
  assert.equal(migrated.totalBouts, 3);
  assert.equal(migrated.day, 2);
  assert.equal(migrated.wins, 1);
  assert.equal(migrated.phase, tournament.PHASES.DAILY_CHECK);
  assert.equal(migrated.interBout, null);
  assert.equal(migrated.migration.legacyRecoveryAssumedApplied, true);
  assert.deepEqual(migrated.appliedRecoveryIds, []);
  assert.throws(
    () => tournament.applyInterBoutChoice(migrated, tournament.CHOICE_IDS.REST),
    error => error.code === "NO_INTER_BOUT"
  );
});

test("normalise les bornes sans muter la sauvegarde source", () => {
  const raw = {
    schemaVersion: 1,
    id: "canadian",
    totalBouts: 5,
    day: 99,
    wins: -2,
    condition: { energy: 200, fatigue: -10, cardio: 140, lucidity: -5 },
    entryCondition: { energy: 72, fatigue: 5 },
    weight: WEIGHT,
    phase: tournament.PHASES.DAILY_CHECK,
  };
  const before = JSON.parse(JSON.stringify(raw));
  const normalized = tournament.normalizeTournament(raw);

  assert.deepEqual(raw, before);
  assert.equal(normalized.day, 5);
  assert.equal(normalized.wins, 0);
  assert.equal(normalized.condition.energy, 100);
  assert.equal(normalized.condition.fatigue, 0);
  assert.equal(normalized.condition.cardio, 99);
  assert.equal(normalized.condition.lucidity, 0);
});

test("la tolérance de pesée est explicite et bornée", () => {
  assert.equal(tournament.evaluateWeighIn({ weightKg: 60.1, maxKg: 60, toleranceKg: 0.1 }).passed, true);
  assert.equal(tournament.evaluateWeighIn({ weightKg: 60.11, maxKg: 60, toleranceKg: 0.1 }).passed, false);
  assert.equal(tournament.evaluateWeighIn({ weightKg: 59, maxKg: null }).status, "unconfigured");
});
