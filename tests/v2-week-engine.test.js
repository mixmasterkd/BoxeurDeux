"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const time = require("../career-time-engine.js");
const training = require("../v2-training-engine.js");
const migration = require("../career-v2-migration.js");
const week = require("../v2-week-engine.js");

const GYM = Object.freeze({ membershipActive: true, careerStatus: "amateur" });
const fixedRng = (value = 0.5) => () => value;

function freshState(overrides = {}) {
  return time.createState({
    seed: "week-engine",
    time: { week: 1, day: "monday", period: "morning" },
    condition: { energy: 85, fatigue: 12 },
    stats: { technique: 40, power: 42, cardio: 44, defense: 46 },
    ...overrides,
  });
}

function twoTrainingWeek(extra = {}) {
  return {
    budget: { trainingSessions: 2, shortRecoveries: 2 },
    training: {
      slots: [1, 13],
      sessions: [
        training.createCustomSession(["shadow_boxing", "mitts"], { focus: "technique" }),
        training.createCustomSession(["jump_rope", "cooldown"], { focus: "cardio" }),
      ],
      context: GYM,
    },
    ...extra,
  };
}

test("expose le même noyau pur en CommonJS et sur globalThis", () => {
  assert.equal(globalThis.BoxeurWeek, week);
  assert.equal(week.SCHEMA_VERSION, 1);
  assert.deepEqual(week.MODES, ["detailed", "quick", "hybrid"]);
  assert.deepEqual(week.DEFAULT_BUDGET, { trainingSessions: 3, shortRecoveries: 2 });
});

test("une capsule migrée devient une enveloppe indépendante sans réécrire son snapshot de rollback", () => {
  const source = {
    version: 5,
    state: {
      profile: { firstName: "Alex", lastName: "Roy" },
      week: 4,
      money: 875,
      energy: 70,
      fatigue: 20,
      careerStatus: "amateur",
      combatStats: { technique: 50, power: 50, cardio: 50, defense: 50 },
    },
  };
  const capsule = migration.migrateV5ToV2(source, { migratedAt: "2026-01-01T00:00:00Z" });
  const before = structuredClone(capsule);
  const envelope = week.createWeekState(capsule);

  assert.equal(envelope.finances.money, 875);
  assert.equal(envelope.timeState.clock.week, 4);
  envelope.finances.money = 0;
  assert.deepEqual(capsule, before);
  assert.equal(capsule.legacySnapshot.state.money, 875);
});

test("le travail rapide utilise l'activité normale, applique la fatigue et verse exactement le salaire", () => {
  const initial = week.createWeekState(freshState(), { money: 100 });
  const config = twoTrainingWeek({
    budget: { trainingSessions: 0, shortRecoveries: 0 },
    work: {
      id: "convenience",
      title: "Commis de dépanneur",
      weeklyPay: 75,
      energy: -14,
      fatigue: 10,
      shifts: [{ day: "monday", period: "morning" }],
    },
  });
  const before = structuredClone(initial);
  const result = week.runQuickWeek(initial, config, fixedRng());

  assert.equal(result.status, "week-complete");
  assert.equal(result.summary.counts.work, 1);
  assert.equal(result.summary.money.earned, 75);
  assert.equal(result.finances.money, 175);
  assert.equal(result.summary.actions[0].kind, "work");
  assert.equal(result.summary.actions[0].conditionDelta.energy, -14);
  assert.equal(result.summary.actions[0].conditionDelta.fatigue, 10);
  assert.deepEqual(initial, before, "la semaine rapide doit être pure");
});

test("la semaine rapide s'arrête au rendez-vous important sans le consommer", () => {
  let initial = freshState();
  initial = time.scheduleAppointment(initial, {
    id: "weigh-in",
    title: "Pesée du tournoi",
    kind: "weigh-in",
    startSlot: 5,
    duration: 1,
    metadata: { important: true, requiresDecision: true },
  });
  const result = week.runQuickWeek(initial, twoTrainingWeek({
    budget: { trainingSessions: 0, shortRecoveries: 0 },
  }), fixedRng());

  assert.equal(result.status, "appointment");
  assert.equal(result.timeState.clock.absoluteSlot, 5);
  assert.equal(result.summary.stoppedBeforeAppointment.id, "weigh-in");
  assert.equal(result.timeState.appointments.some(item => item.id === "weigh-in"), true);
  assert.equal(result.timeState.completedAppointments.length, 0);
});

test("la récupération rapide reste bornée au budget et conserve les vraies nuits", () => {
  const initial = freshState({ condition: { energy: 35, fatigue: 65 } });
  const result = week.runQuickWeek(initial, {
    training: false,
    budget: { shortRecoveries: 2 },
  }, fixedRng());

  assert.equal(result.status, "week-complete");
  assert.equal(result.plan.budget.trainingSessions, 0);
  assert.equal(result.summary.counts.recovery, 2);
  assert.equal(result.summary.budget.executed.shortRecoveries, 2);
  assert.equal(result.summary.nightRecoveries, 7);
  assert.ok(result.summary.actions.some(action => action.primitive.actionId === "nap"));
  assert.ok(result.summary.actions.some(action => action.primitive.actionId === "active_recovery"));
});

test("un rendez-vous de travail auto-simulable est payé, mais un rendez-vous ordinaire demeure une décision", () => {
  let initial = freshState();
  initial = time.scheduleAppointment(initial, {
    id: "work-now",
    title: "Quart au dépanneur",
    kind: "work",
    startSlot: 0,
    activity: {
      id: "v2-work:convenience",
      label: "Quart au dépanneur",
      category: "work",
      duration: 1,
      energyCost: 8,
      fatigueGain: 5,
    },
    metadata: { autoSimulate: true, salary: 30 },
  });
  initial = time.scheduleAppointment(initial, {
    id: "coach-choice",
    title: "Rencontre avec le coach",
    kind: "coach",
    startSlot: 3,
    duration: 1,
  });
  const result = week.runQuickWeek(week.createWeekState(initial, { money: 10 }), {
    budget: { trainingSessions: 0, shortRecoveries: 0 },
  }, fixedRng());

  assert.equal(result.summary.actions[0].kind, "appointment");
  assert.equal(result.summary.actions[0].moneyDelta, 30);
  assert.equal(result.summary.money.after, 40);
  assert.equal(result.status, "appointment");
  assert.equal(result.summary.stoppedBeforeAppointment.id, "coach-choice");
});

test("l'hybride complète la semaine après une séance manuelle sans dépasser le budget détaillé", () => {
  const initial = freshState();
  const manualSession = training.createCustomSession(["shadow_boxing", "mitts"], { focus: "technique" });
  const manual = training.executeSession(initial, manualSession, GYM, fixedRng()).timeState;
  assert.equal(manual.clock.absoluteSlot, 1);

  const result = week.runHybridWeek(manual, twoTrainingWeek(), fixedRng());
  const allWeekTraining = result.timeState.history.filter(event => (
    event.type === "activity-completed"
    && String(event.activityId).startsWith("boxing-gym-session:")
    && event.fromSlot >= result.plan.weekStartSlot
    && event.fromSlot < result.plan.weekEndSlot
  ));

  assert.equal(result.status, "week-complete");
  assert.equal(result.summary.budget.usedBefore.trainingSessions, 1);
  assert.equal(result.summary.counts.training, 1);
  assert.equal(allWeekTraining.length, 2);
  assert.equal(result.summary.budget.remaining.trainingSessions, 0);
});

test("le mode détaillé refuse une séance de plus que son budget", () => {
  const initial = freshState();
  const session = training.createCustomSession(["shadow_boxing", "cooldown"]);
  const config = {
    ...twoTrainingWeek(),
    budget: { trainingSessions: 1, shortRecoveries: 0 },
    actions: [
      { kind: "training", session, context: GYM },
      { kind: "training", session, context: GYM },
    ],
  };
  const result = week.runDetailedWeek(initial, config, fixedRng());

  assert.equal(result.status, "budget-exhausted");
  assert.equal(result.summary.counts.training, 1);
  assert.equal(result.summary.budget.remaining.trainingSessions, 0);
  assert.match(result.summary.warnings[0], /budget détaillé épuisé/i);
});

test("les actions produites par le rapide sont rejouables par le détaillé avec le même résultat", () => {
  const initial = week.createWeekState(freshState({ condition: { energy: 62, fatigue: 52 } }), { money: 25 });
  const config = twoTrainingWeek({
    work: {
      id: "convenience",
      payPerShift: 30,
      energyCost: 6,
      fatigueGain: 4,
      duration: 1,
      shifts: [{ relativeSlot: 4 }],
    },
  });
  const quick = week.runQuickWeek(initial, config, time.createSeededRng("replay-week"));
  const replay = week.runDetailedWeek(initial, {
    ...config,
    plan: quick.plan,
    actions: quick.summary.actions.map(action => action.primitive),
  }, time.createSeededRng("replay-week"));

  assert.equal(quick.status, "week-complete");
  assert.equal(replay.status, "week-complete");
  assert.deepEqual(replay.timeState, quick.timeState);
  assert.deepEqual(replay.finances, quick.finances);
  assert.deepEqual(replay.summary.statGains, quick.summary.statGains);
  assert.equal(replay.summary.money.earned, quick.summary.money.earned);
});

test("un travail ne peut pas contourner le budget avec du stimulus de boxe", () => {
  const initial = freshState();
  const disguisedTraining = {
    budget: { trainingSessions: 0, shortRecoveries: 0 },
    work: {
      id: "fake-job",
      payPerShift: 100,
      activity: {
        id: "v2-work:fake-job",
        label: "Faux quart",
        category: "work",
        duration: 1,
        stimulus: { technique: 10 },
      },
      shifts: [{ relativeSlot: 0 }],
    },
  };

  assert.throws(
    () => week.buildWeekPlan(initial, disguisedTraining),
    error => error.code === "INVALID_WORK_ACTIVITY",
  );
  assert.throws(
    () => week.executePrimitive(initial, {
      kind: "work",
      pay: 100,
      activity: disguisedTraining.work.activity,
    }),
    error => error.code === "INVALID_WORK_ACTIVITY",
  );
});

test("un salaire hebdomadaire reste exact lorsqu'il est réparti sur trois quarts", () => {
  const config = {
    budget: { trainingSessions: 0, shortRecoveries: 0 },
    work: {
      id: "courier",
      weeklyPay: 100,
      shifts: [{ relativeSlot: 0 }, { relativeSlot: 6 }, { relativeSlot: 12 }],
    },
  };
  const plan = week.buildWeekPlan(freshState(), config);
  assert.equal(plan.entries.reduce((sum, entry) => sum + entry.pay, 0), 100);
  assert.deepEqual(plan.entries.map(entry => entry.pay), [33.33, 33.33, 33.34]);

  const result = week.runQuickWeek(week.createWeekState(freshState(), { money: 25 }), config, fixedRng());
  assert.equal(result.status, "week-complete");
  assert.equal(result.summary.counts.work, 3);
  assert.equal(result.summary.money.earned, 100);
  assert.equal(result.summary.money.after, 125);
});

test("un plan fourni ne peut pas gonfler son budget au-delà de ses séances détaillées", () => {
  const config = twoTrainingWeek({ budget: { trainingSessions: 1, shortRecoveries: 0 } });
  const plan = week.buildWeekPlan(freshState(), config);
  plan.budget.trainingSessions = 999;
  const session = training.createCustomSession(["shadow_boxing", "cooldown"]);
  const result = week.runDetailedWeek(freshState(), {
    plan,
    actions: [
      { kind: "training", session, context: GYM },
      { kind: "training", session, context: GYM },
    ],
  }, fixedRng());

  assert.equal(result.plan.budget.trainingSessions, 1);
  assert.equal(result.status, "budget-exhausted");
  assert.equal(result.summary.counts.training, 1);
});

test("la source aléatoire injectable rend toute la semaine reproductible", () => {
  const initial = freshState({ condition: { energy: 55, fatigue: 50 } });
  const config = twoTrainingWeek();
  const first = week.runWeek(initial, { ...config, mode: "quick" }, time.createSeededRng("same-week"));
  const second = week.runWeek(initial, { ...config, mode: "quick" }, time.createSeededRng("same-week"));

  assert.deepEqual(first, second);
  assert.equal(first.summary.actions.length > 0, true);
  assert.ok(first.summary.actions.every(action => Number.isInteger(action.elapsedPeriods) && action.elapsedPeriods >= 1));
});
