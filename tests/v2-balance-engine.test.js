"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const balance = require("../v2-balance-engine.js");
const time = require("../career-time-engine.js");
const training = require("../v2-training-engine.js");
const strength = require("../v2-strength-engine.js");
const progression = require("../v2-progression-engine.js");
const trainers = require("../v2-trainer-engine.js");
const supplements = require("../v2-supplement-engine.js");
const planner = require("../v2-week-planner-engine.js");
const tournament = require("../tournament-engine.js");

const fixedRng = () => 0.5;
const STAT_KEYS = ["technique", "power", "cardio", "defense"];

function coachState(focus) {
  const stats = { technique: 45, power: 45, cardio: 45, defense: 45 };
  stats[focus] = 39;
  return time.createState({
    seed: `balance-${focus}`,
    condition: { energy: 100, fatigue: 0 },
    stats,
  });
}

function coachAggregate(focus) {
  const state = coachState(focus);
  const session = training.buildCoachSession(
    state,
    { membershipActive: true, careerStatus: "amateur" },
    fixedRng,
  );
  return training.aggregateSession(session);
}

function sessionsForFirstPoint(focus) {
  let state = coachState(focus);
  const session = training.buildCoachSession(
    state,
    { membershipActive: true, careerStatus: "amateur" },
    fixedRng,
  );
  let sessions = 0;
  while (state.stats[focus] < 40 && sessions < 30) {
    state = training.executeSession(
      state,
      session,
      { membershipActive: true, careerStatus: "amateur" },
      fixedRng,
    ).timeState;
    state = time.advanceTime(state, 20, fixedRng);
    sessions += 1;
  }
  return sessions;
}

test("centralise un contrat d'équilibrage immuable utilisé par la carrière actuelle", () => {
  assert.equal(globalThis.BoxeurBalance, balance);
  assert.equal(balance.VERSION, 1);
  assert.equal(Object.isFrozen(balance.WEEK), true);
  assert.equal(Object.isFrozen(balance.JOBS), true);
  assert.equal(Object.isFrozen(balance.ACCEPTANCE), true);
  assert.throws(() => { balance.WEEK.baseCapacity = 999; }, TypeError);
});

test("la capacité donne un choix clair entre revenu, entraînement et récupération", () => {
  assert.deepEqual([1, 4, 5, 10, 15, 20].map(balance.weeklyCapacity), [50, 50, 55, 60, 65, 65]);
  assert.deepEqual(balance.JOBS.map(job => balance.workCapacityCost(job)), [15, 22, 30, 30]);

  const boxing = coachAggregate("cardio").totals;
  const boxingCost = balance.activityCapacityCost(boxing.energyCost, boxing.fatigueDelta);
  const strengthTotals = strength.aggregateSelection([
    "dynamic_warmup",
    "machine_conditioning",
    "mobility_cooldown",
  ]).totals;
  const strengthCost = balance.activityCapacityCost(strengthTotals.energyCost, strengthTotals.fatigueDelta);
  const restCost = balance.WEEK.recovery.restCapacityCost;

  const flexiblePlan = balance.workCapacityCost("convenience") + boxingCost + restCost + strengthCost;
  assert.ok(flexiblePlan <= balance.ACCEPTANCE.week.beginnerBalancedPlanMaximum);

  for (const jobId of ["courier", "office", "warehouse"]) {
    const safeCore = balance.workCapacityCost(jobId) + boxingCost + restCost;
    assert.ok(safeCore <= balance.weeklyCapacity(1), `${jobId} doit permettre travail + boxe + repos`);
    assert.ok(
      safeCore + strengthCost > balance.weeklyCapacity(1),
      `${jobId} doit demander de sacrifier du temps ou du revenu pour une deuxième séance lourde`,
    );
  }
});

test("les quatre recommandations du coach ciblent réellement la qualité annoncée", () => {
  for (const focus of STAT_KEYS) {
    const aggregate = coachAggregate(focus);
    const target = aggregate.totals.stimulus[focus];
    const otherMaximum = Math.max(...STAT_KEYS.filter(key => key !== focus).map(key => aggregate.totals.stimulus[key]));
    assert.ok(target > otherMaximum, `${focus} doit être le stimulus principal`);
    assert.ok(target >= 4 && target <= 6, `${focus} doit rester dans la plage utile commune`);
  }
});

test("la première hausse de chaque statistique reste dans la fenêtre de progression acceptée", () => {
  const minimum = balance.ACCEPTANCE.progression.targetedSessionsForFirstPointMinimum;
  const maximum = balance.ACCEPTANCE.progression.targetedSessionsForFirstPointMaximum;
  const measured = Object.fromEntries(STAT_KEYS.map(key => [key, sessionsForFirstPoint(key)]));

  for (const [key, sessions] of Object.entries(measured)) {
    assert.ok(sessions >= minimum && sessions <= maximum, `${key}: ${sessions} séances`);
  }
  assert.ok(Math.max(...Object.values(measured)) - Math.min(...Object.values(measured)) <= 3);
});

test("les méthodes d'entraînement offrent des spécialités distinctes sans option gratuite dominante", () => {
  const boxingPower = coachAggregate("power").totals;
  const boxingCardio = coachAggregate("cardio").totals;
  const strengthPower = strength.aggregateSelection([
    "dynamic_warmup",
    "lower_body_strength",
    "mobility_cooldown",
  ]).totals;
  const strengthCardio = strength.aggregateSelection([
    "dynamic_warmup",
    "machine_conditioning",
    "mobility_cooldown",
  ]).totals;
  const offers = trainers.listOffers({ statValue: 40 });

  assert.ok(boxingPower.stimulus.power > boxingPower.stimulus.cardio);
  assert.ok(strengthPower.stimulus.power > strengthPower.stimulus.cardio);
  assert.ok(strengthCardio.stimulus.cardio > strengthCardio.stimulus.power);
  assert.ok(boxingCardio.energyCost < strengthCardio.energyCost, "le gym de musculation paie son meilleur cardio par une charge accrue");
  assert.deepEqual(offers.map(offer => offer.cost), [60, 120, 220]);
  assert.ok(offers[0].estimatedTargetedXpPerSession < offers[1].estimatedTargetedXpPerSession);
  assert.ok(offers[1].estimatedTargetedXpPerSession < offers[2].estimatedTargetedXpPerSession);
});

test("l'économie de départ finance les bases, tandis que les options premium exigent un choix", () => {
  const boxingWeekly = balance.weeklyMembershipCost("boxing");
  const strengthWeekly = balance.weeklyMembershipCost("strength");
  const lowestWage = balance.JOBS[0].wage;

  assert.ok(balance.ECONOMY.startingMoney >= balance.ECONOMY.memberships.boxing.monthly.price);
  assert.ok(
    lowestWage - boxingWeekly >= balance.ACCEPTANCE.economy.minimumWeeklySurplusAfterBoxingMembership,
  );
  assert.ok(
    lowestWage - boxingWeekly - strengthWeekly >= balance.ACCEPTANCE.economy.minimumWeeklySurplusAfterBothMemberships,
  );
  assert.ok(
    lowestWage - boxingWeekly - trainers.TRAINERS.at(-1).cost / trainers.TRAINERS.at(-1).sessions < 0,
    "l'entraîneur élite ne doit pas être un achat automatique avec l'emploi le plus souple",
  );
});

test("les suppléments restent des aides temporaires modestes et non une progression achetable", () => {
  const baseSession = {
    energyCost: 20,
    fatigueGain: 10,
    fatigueRelief: 3,
    recoveryQuality: 1,
    stimulus: { technique: 2, power: 1, cardio: 3, defense: 1 },
    stats: { technique: 40, power: 40, cardio: 40, defense: 40 },
    xp: 7,
  };

  for (const product of Object.values(supplements.CATALOG)) {
    const prepared = supplements.prepareForSession(
      supplements.createState({ inventory: { [product.id]: 1 } }),
      product.id,
      { weekKey: "balance-week", sessionId: `session-${product.id}` },
    );
    const outcome = supplements.applyToSession(prepared.state, baseSession, {
      sessionId: `session-${product.id}`,
    });
    assert.deepEqual(outcome.session.stimulus, baseSession.stimulus);
    assert.deepEqual(outcome.session.stats, baseSession.stats);
    assert.equal(outcome.session.xp, baseSession.xp);
    assert.ok(outcome.session.energyCost >= baseSession.energyCost * 0.8);
    assert.ok(outcome.session.recoveryQuality >= 0.95 && outcome.session.recoveryQuality <= 1.05);
  }
  assert.equal(supplements.MAX_WEEKLY_USES, 2);
});

test("les récompenses d'adversaires sont ordonnées et bornées", () => {
  const inputs = [-6, 0, 6].map(offset => ({ difficulty: 45 + offset, playerStrength: 45 }));
  const reputation = inputs.map(input => balance.opponentReputationReward(input));
  const experience = inputs.map(input => balance.opponentExperienceReward(input));

  assert.ok(reputation[0] < reputation[1] && reputation[1] < reputation[2]);
  assert.ok(experience[0] < experience[1] && experience[1] < experience[2]);
  assert.equal(balance.opponentReputationReward({ difficulty: 99, playerStrength: 20 }), 12);
  assert.equal(balance.opponentExperienceReward({ difficulty: 99, playerStrength: 20 }), 26);
  assert.ok(
    balance.opponentReputationReward({ difficulty: 45, playerStrength: 45, avoidanceWeeks: 6 })
      < balance.opponentReputationReward({ difficulty: 45, playerStrength: 45 }),
  );
});

test("les tournois montent par palier et récupèrent sans effacer les dégâts du parcours", () => {
  const rating = 50;
  const openings = ["bronze", "silver", "golden", "canadian", "olympic"].map(tournamentId => (
    balance.tournamentOpponentRating({
      tournamentId,
      playerRating: rating,
      roundIndex: 0,
      baseDifficulty: balance.TOURNAMENT_CURVES[tournamentId].referenceDifficulty,
    })
  ));
  assert.deepEqual(openings, [48, 49, 50, 51, 52]);

  const bronzeFinal = balance.tournamentOpponentRating({ tournamentId: "bronze", playerRating: rating, roundIndex: 2, baseDifficulty: 45 });
  const olympicFinal = balance.tournamentOpponentRating({ tournamentId: "olympic", playerRating: rating, roundIndex: 4, baseDifficulty: 77 });
  assert.ok(bronzeFinal - rating >= balance.ACCEPTANCE.tournament.minimumFinalOffsetThreeBouts);
  assert.ok(olympicFinal - rating >= balance.ACCEPTANCE.tournament.minimumFinalOffsetFiveBouts);

  let state = tournament.createTournament({
    id: "five-bout-balance",
    totalBouts: 5,
    condition: { energy: 82, fatigue: 12, cardio: 52, headDamage: 0, bodyDamage: 0, lucidity: 100 },
    weight: { minKg: 55, maxKg: 60 },
  });
  for (let bout = 0; bout < 4; bout += 1) {
    state = tournament.performDailyChecks(state, { weightKg: 58, doctorStatus: "fit" });
    state = tournament.beginBout(state);
    state = tournament.recordBoutResult(state, {
      result: "win",
      condition: {
        ...state.condition,
        energy: Math.max(38, state.condition.energy - 28),
        fatigue: Math.min(70, state.condition.fatigue + 18),
        headDamage: Math.min(70, state.condition.headDamage + 10),
        bodyDamage: Math.min(70, state.condition.bodyDamage + 8),
        lucidity: Math.max(55, state.condition.lucidity - 10),
      },
    });
    state = tournament.applyInterBoutChoice(state, tournament.CHOICE_IDS.REST);
  }
  assert.equal(state.phase, tournament.PHASES.DAILY_CHECK);
  assert.ok(state.condition.energy >= 70, `énergie après quatre combats : ${state.condition.energy}`);
  assert.ok(state.condition.fatigue <= 30, `fatigue après quatre combats : ${state.condition.fatigue}`);
  assert.ok(state.condition.headDamage > 0, "les dégâts du tournoi ne doivent pas être remis à zéro");
});

test("les garde-fous bloquent répétition gratuite, surcharge et double récompense", () => {
  let week = planner.createPlanner({ weekKey: "anti-exploit", careerStatus: "amateur", capacity: 50 });
  const repeated = {
    id: "same-program",
    label: "Même programme",
    category: "boxing",
    location: "boxing-gym",
    physical: true,
    capacityCost: 8,
    energyCost: 10,
    fatigueDelta: 2,
    metadata: { familyId: "boxing", programSignature: "boxing:same" },
  };
  week = planner.addActivity(week, repeated, { day: "monday" }).state;
  week = planner.addActivity(week, repeated, { day: "tuesday" }).state;
  const repeatedEntries = planner.previewPlan(week).entries.filter(entry => entry.activityId === "same-program");
  assert.deepEqual(repeatedEntries.map(entry => entry.metadata.gainMultiplier), [1, balance.ACCEPTANCE.progression.repeatedProgramMultiplier]);
  assert.throws(
    () => planner.addActivity(week, repeated, { day: "wednesday" }),
    error => error.code === "WEEKLY_FAMILY_LIMIT",
  );

  let skill = progression.createState({ stats: { technique: 40, power: 40, cardio: 40, defense: 40 } });
  const first = progression.addStimulus(skill, { technique: 6 }, { weekKey: "anti-exploit", sourceId: "receipt-1" });
  const duplicate = progression.addStimulus(first.state, { technique: 6 }, { weekKey: "anti-exploit", sourceId: "receipt-1" });
  assert.equal(duplicate.result.duplicate, true);
  assert.equal(duplicate.state.stimulus.technique, first.state.stimulus.technique);
});
