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

function suppliedPlan(entries, budget = {}) {
  return {
    schemaVersion: 1,
    week: 1,
    weekStartSlot: 0,
    weekEndSlot: time.PERIODS_PER_WEEK,
    budget: {
      trainingSessions: 0,
      shortRecoveries: 0,
      workShifts: 0,
      ...budget,
    },
    entries,
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

test("l'hybride compte une activité physique faite à la maison et ne réentraîne pas le même jour", () => {
  const initial = freshState();
  const afterHome = time.performActivity(initial, {
    id: "home-session:shadow-boxing",
    label: "Shadow-boxing à la maison",
    category: "home-training",
    duration: 1,
    energyCost: 6,
    fatigueGain: 3,
    stimulus: { technique: 2, defense: 1 },
  }, {}, fixedRng());
  const session = training.createCustomSession(["jump_rope", "cooldown"]);
  const result = week.runHybridWeek(afterHome, {
    budget: { trainingSessions: 2, shortRecoveries: 0 },
    training: { slots: [2, 8], sessions: [session, session], context: GYM },
  }, fixedRng());

  assert.equal(result.status, "week-complete");
  assert.equal(result.summary.budget.usedBefore.trainingSessions, 1);
  assert.equal(result.summary.counts.training, 1);
  assert.equal(result.timeState.history.filter(event => event.activityCategory === "home-training").length, 1);
  assert.equal(result.timeState.history.filter(event => event.activityCategory === "boxing-gym-training").length, 1);
  assert.match(result.summary.warnings.join(" "), /activité physique principale a déjà été faite/i);
});

test("le moteur rapide refuse de compresser plusieurs séances dans une même journée", () => {
  const session = training.createCustomSession(["shadow_boxing", "cooldown"]);
  const result = week.runQuickWeek(freshState(), {
    budget: { trainingSessions: 3, shortRecoveries: 0 },
    training: { slots: [0, 1, 2], sessions: [session, session, session], context: GYM },
  }, fixedRng());

  assert.equal(result.status, "week-complete");
  assert.equal(result.summary.counts.training, 1);
  assert.equal(result.timeState.history.filter(event => event.activityCategory === "boxing-gym-training").length, 1);
  assert.equal(result.summary.warnings.filter(message => /activité physique principale/.test(message)).length, 2);
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

test("un plan fourni exécute une activité générique physique avec ses finances et ses détails", () => {
  const initial = week.createWeekState(freshState(), { money: 200 });
  const plan = suppliedPlan([{
    id: "home-conditioning",
    kind: "activity",
    startSlot: 0,
    physical: true,
    moneyDelta: -25,
    activity: {
      id: "home-session:conditioning",
      label: "Conditionnement à la maison",
      category: "home-training",
      duration: 2,
      energyCost: 12,
      fatigueGain: 8,
      stimulus: { cardio: 3, defense: 1 },
    },
    detail: {
      xpAward: 7.5,
      wear: 3,
      injuryRisk: 12.4,
    },
  }], { trainingSessions: 1 });
  const result = week.runQuickWeek(initial, { plan }, fixedRng());

  assert.equal(result.status, "week-complete");
  assert.equal(result.plan.entries[0].duration, 2, "la durée canonique vient de BoxeurTime");
  assert.equal(result.plan.entries[0].activity.energyCost, 12);
  assert.equal(result.plan.entries[0].budgetKind, "trainingSessions");
  assert.equal(result.summary.counts.training, 1);
  assert.equal(result.summary.budget.executed.trainingSessions, 1);
  assert.equal(result.summary.money.earned, -25);
  assert.equal(result.finances.money, 175);
  assert.equal(result.summary.xpAward, 7.5);
  assert.equal(result.summary.wear, 3);
  assert.equal(result.summary.maximumSingleActionInjuryRiskPercent, 12.4);
  assert.equal(result.summary.actions[0].category, "home-training");
  assert.equal(result.summary.actions[0].primitive.detail.injuryRiskPercent, 12.4);
  assert.equal(result.timeState.history.some(event => event.weekPhysical === true), true);
});

test("budgetKind rend une activité générique physique et impose une seule activité principale par jour", () => {
  const activity = id => ({
    id,
    label: id,
    category: "other",
    duration: 1,
    energyCost: 3,
    fatigueGain: 1,
  });
  const plan = suppliedPlan([
    {
      id: "first-physical",
      kind: "activity",
      startSlot: 0,
      budgetKind: "trainingSessions",
      activity: activity("first-physical"),
    },
    {
      id: "second-physical",
      kind: "activity",
      startSlot: 1,
      budgetKind: "trainingSessions",
      activity: activity("second-physical"),
    },
  ], { trainingSessions: 2 });
  const result = week.runQuickWeek(freshState(), { plan }, fixedRng());

  assert.equal(result.status, "week-complete");
  assert.equal(result.summary.counts.training, 1);
  assert.equal(result.summary.budget.executed.trainingSessions, 1);
  assert.match(result.summary.warnings.join(" "), /activité physique principale/i);
  assert.equal(result.timeState.history.some(event => event.activityId === "second-physical"), false);
});

test("une activité payante est refusée atomiquement lorsque les fonds sont insuffisants", () => {
  const initial = week.createWeekState(freshState(), { money: 40 });
  const before = structuredClone(initial);
  const primitive = {
    kind: "activity",
    moneyDelta: -45,
    activity: {
      id: "private-session",
      label: "Séance privée",
      category: "private-training",
      duration: 1,
      energyCost: 5,
    },
  };

  assert.throws(
    () => week.executePrimitive(initial, primitive, {}, fixedRng()),
    error => error.code === "INSUFFICIENT_FUNDS"
      && error.details.required === 45
      && error.details.available === 40,
  );
  assert.deepEqual(initial, before);

  const result = week.runQuickWeek(initial, {
    plan: suppliedPlan([{ id: "private-session", startSlot: 0, ...primitive }]),
  }, fixedRng());
  assert.equal(result.status, "blocked");
  assert.equal(result.timeState.clock.absoluteSlot, 0);
  assert.equal(result.finances.money, 40);
  assert.equal(result.summary.actions.length, 0);
  assert.match(result.summary.warnings[0], /fonds insuffisants/i);
});

test("un plan fourni refuse une durée qui contredit l'activité normalisée", () => {
  const plan = suppliedPlan([{
    id: "bad-duration",
    kind: "activity",
    startSlot: 0,
    duration: 1,
    activity: {
      id: "two-periods",
      label: "Deux périodes",
      duration: 2,
    },
  }]);

  assert.throws(
    () => week.runQuickWeek(freshState(), { plan }, fixedRng()),
    error => error.code === "WEEK_PLAN_ACTIVITY_DURATION_MISMATCH",
  );
});
