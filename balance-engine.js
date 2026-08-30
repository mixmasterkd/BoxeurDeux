(function attachBoxeurBalance(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurBalance = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurBalanceApi() {
  "use strict";

  /*
   * Contrat d'équilibrage de la carrière actuelle.
   *
   * Les nombres qui relient le temps, l'emploi, l'économie et la difficulté
   * des tournois vivent ici afin que l'interface et les bancs de simulation
   * utilisent exactement les mêmes règles. Les moteurs spécialisés gardent
   * leurs propres catalogues (exercices, entraîneurs et suppléments).
   */

  const VERSION = 1;

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, finiteNumber(value, min)));
  }

  const WEEK = deepFreeze({
    baseCapacity: 50,
    milestoneEveryLevels: 5,
    milestoneGain: 5,
    maximumCapacity: 65,
    load: {
      baseCost: 2,
      energyWeight: 0.55,
      fatigueWeight: 0.30,
      minimumCost: 4,
    },
    condition: {
      criticalEnergy: 20,
      criticalFatigue: 82,
      fragileEnergy: 30,
      fragileFatigue: 72,
    },
    recovery: {
      restCapacityCost: 10,
      restEnergyGain: 18,
      restFatigueRelief: 12,
      mealCost: 15,
      mealEnergyGain: 9,
      mealFatigueRelief: 2,
    },
  });

  const JOBS = deepFreeze([
    {
      id: "convenience",
      title: "Commis de dépanneur",
      schedule: "Horaire souple",
      wage: 75,
      interviewWeeks: 1,
      energy: -14,
      fatigue: 10,
      detail: "La solution la moins payante, mais la plus facile à concilier avec le camp.",
    },
    {
      id: "courier",
      title: "Coursier local",
      schedule: "Horaire variable",
      wage: 100,
      interviewWeeks: 2,
      energy: -20,
      fatigue: 16,
      detail: "Une meilleure paie hebdomadaire avec plus de kilomètres et de fatigue dans les jambes.",
    },
    {
      id: "office",
      title: "Employé de bureau",
      schedule: "Bureau · longues heures",
      wage: 120,
      interviewWeeks: 2,
      energy: -14,
      fatigue: 7,
      weekCapacityCost: 30,
      detail: "Une paie solide et peu de fatigue physique, mais de longues journées de bureau qui occupent une grande partie de la semaine.",
    },
    {
      id: "warehouse",
      title: "Manutention de nuit",
      schedule: "Horaire exigeant",
      wage: 130,
      interviewWeeks: 3,
      energy: -27,
      fatigue: 23,
      detail: "La paie hebdomadaire la plus élevée, au prix d’une lourde dépense physique.",
    },
  ]);

  const ECONOMY = deepFreeze({
    startingMoney: 220,
    memberships: {
      boxing: {
        monthly: { weeks: 4, price: 110 },
        threeMonths: { weeks: 12, price: 285 },
      },
      strength: {
        monthly: { weeks: 4, price: 95 },
        threeMonths: { weeks: 12, price: 270 },
      },
    },
  });

  const TOURNAMENT_CURVES = deepFreeze({
    bronze: { referenceDifficulty: 45, openingOffset: -2, roundStep: 2 },
    silver: { referenceDifficulty: 52, openingOffset: -1, roundStep: 2 },
    golden: { referenceDifficulty: 64, openingOffset: 0, roundStep: 2 },
    canadian: { referenceDifficulty: 70, openingOffset: 1, roundStep: 1.5 },
    olympic: { referenceDifficulty: 77, openingOffset: 2, roundStep: 1.5 },
    "regional-cup": { referenceDifficulty: 50, openingOffset: 0, roundStep: 2 },
  });

  const ACCEPTANCE = deepFreeze({
    week: {
      beginnerBalancedPlanMaximum: 50,
      minimumRecoveryCapacityShare: 0.18,
    },
    progression: {
      targetedSessionsForFirstPointMinimum: 7,
      targetedSessionsForFirstPointMaximum: 14,
      repeatedProgramMultiplier: 0.85,
    },
    economy: {
      minimumWeeklySurplusAfterBoxingMembership: 40,
      minimumWeeklySurplusAfterBothMemberships: 20,
    },
    combat: {
      comparableWinRateMinimum: 0.45,
      comparableWinRateMaximum: 0.63,
      minimumStatImpact: 0.08,
      comparableStoppageMaximum: 0.05,
    },
    tournament: {
      minimumFinalOffsetThreeBouts: 2,
      minimumFinalOffsetFiveBouts: 7,
    },
  });

  function weeklyCapacity(level = 1) {
    const normalizedLevel = Math.max(1, Math.floor(finiteNumber(level, 1)));
    const milestones = Math.floor(normalizedLevel / WEEK.milestoneEveryLevels);
    return Math.min(WEEK.maximumCapacity, WEEK.baseCapacity + milestones * WEEK.milestoneGain);
  }

  function activityCapacityCost(energyCost, fatigueDelta, options = {}) {
    const minimum = Math.max(0, finiteNumber(options.minimum, WEEK.load.minimumCost));
    const extraBaseCost = Math.max(0, finiteNumber(options.extraBaseCost, 0));
    const raw = WEEK.load.baseCost
      + extraBaseCost
      + Math.max(0, finiteNumber(energyCost)) * WEEK.load.energyWeight
      + Math.max(0, finiteNumber(fatigueDelta)) * WEEK.load.fatigueWeight;
    return Math.max(minimum, Math.round(raw));
  }

  function workCapacityCost(jobInput) {
    const job = typeof jobInput === "string" ? JOBS.find(item => item.id === jobInput) : jobInput;
    if (!job) return 0;
    const explicit = Number(job.weekCapacityCost);
    if (Number.isFinite(explicit)) return Math.max(8, Math.round(explicit));
    return Math.max(8, Math.round(
      Math.max(0, -finiteNumber(job.energy)) * 0.7
      + Math.max(0, finiteNumber(job.fatigue)) * 0.5,
    ));
  }

  function weeklyMembershipCost(family, term = "monthly") {
    const plan = ECONOMY.memberships[family]?.[term];
    if (!plan) return 0;
    return plan.price / plan.weeks;
  }

  function tournamentOpponentRating(input = {}) {
    const id = String(input.tournamentId || input.id || "");
    const curve = TOURNAMENT_CURVES[id] || TOURNAMENT_CURVES["regional-cup"];
    const playerRating = clamp(input.playerRating, 20, 99);
    const roundIndex = Math.max(0, Math.floor(finiteNumber(input.roundIndex, 0)));
    const suppliedBase = finiteNumber(input.baseDifficulty, curve.referenceDifficulty);
    const eventAdjustment = clamp(suppliedBase - curve.referenceDifficulty, -8, 8);
    return clamp(Math.round(
      playerRating + curve.openingOffset + eventAdjustment + roundIndex * curve.roundStep,
    ), 32, 98);
  }

  function opponentReputationReward(input = {}) {
    const avoidanceWeeks = Math.max(0, Math.floor(finiteNumber(input.avoidanceWeeks)));
    const avoidancePenalty = avoidanceWeeks >= 3 ? Math.min(2, Math.floor(avoidanceWeeks / 3)) : 0;
    return clamp(Math.round(
      4 + (finiteNumber(input.difficulty, 40) - finiteNumber(input.playerStrength, 40)) * 0.75,
    ) - avoidancePenalty, 2, 12);
  }

  function opponentExperienceReward(input = {}) {
    return clamp(Math.round(
      18 + (finiteNumber(input.difficulty, 40) - finiteNumber(input.playerStrength, 40)) * 0.9,
    ), 14, 26);
  }

  return Object.freeze({
    VERSION,
    WEEK,
    JOBS,
    ECONOMY,
    TOURNAMENT_CURVES,
    ACCEPTANCE,
    weeklyCapacity,
    activityCapacityCost,
    workCapacityCost,
    weeklyMembershipCost,
    tournamentOpponentRating,
    opponentReputationReward,
    opponentExperienceReward,
  });
});
