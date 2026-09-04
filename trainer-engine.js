(function attachBoxeurTrainerEngine(root, factory) {
  "use strict";
  let progressionApi = root && root.BoxeurProgression ? root.BoxeurProgression : null;
  if (!progressionApi && typeof module === "object" && module.exports && typeof require === "function") {
    progressionApi = require("./progression-engine.js");
  }
  const api = factory(progressionApi);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurTrainer = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurTrainerApi(defaultProgressionApi) {
  "use strict";

  /*
   * Pure private-trainer contract.
   *
   * - This engine owns only the persistent private booking and its receipts.
   * - Money, energy and fatigue stay authoritative in the career/time engines;
   *   transitions return explicit deltas for those engines to apply once.
   * - Skill work is delegated to BoxeurProgression as pending stimulus. A
   *   trainer can therefore never write +1/+2 directly to a combat statistic.
   */

  const SCHEMA_VERSION = 1;
  const STATE_KIND = "boxeur-private-trainer";
  const LEGACY_STATE_KINDS = Object.freeze(["boxeur-v2-private-trainer"]);
  const STAT_KEYS = Object.freeze(["technique", "power", "cardio", "defense"]);
  const TRAINER_LOCATIONS = Object.freeze(["boxing-gym", "strength-gym"]);
  const RECEIPT_LIMIT = 128;

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  const TRAINERS = deepFreeze([
    {
      id: "boxing-club",
      location: "boxing-gym",
      targets: ["technique", "defense"],
      label: "Olivier Martel",
      tierLabel: "Entraîneur du club",
      sessions: 1,
      cost: 120,
      baseStimulus: 6,
      quality: 25,
      energyCost: 14,
      fatigue: 8,
    },
    {
      id: "boxing-specialist",
      location: "boxing-gym",
      targets: ["technique", "defense"],
      label: "Maude Lavoie",
      tierLabel: "Spécialiste technique",
      sessions: 1,
      cost: 200,
      baseStimulus: 7.5,
      quality: 65,
      energyCost: 16,
      fatigue: 10,
    },
    {
      id: "boxing-elite",
      location: "boxing-gym",
      targets: ["technique", "defense"],
      label: "Hector Vargas",
      tierLabel: "Entraîneur élite",
      sessions: 1,
      cost: 320,
      baseStimulus: 9,
      quality: 100,
      energyCost: 18,
      fatigue: 12,
    },
    {
      id: "strength-club",
      location: "strength-gym",
      targets: ["power", "cardio"],
      label: "Kim Nguyen",
      tierLabel: "Préparatrice du club",
      sessions: 1,
      cost: 120,
      baseStimulus: 6,
      quality: 25,
      energyCost: 14,
      fatigue: 8,
    },
    {
      id: "strength-specialist",
      location: "strength-gym",
      targets: ["power", "cardio"],
      label: "Darnell Brooks",
      tierLabel: "Spécialiste physique",
      sessions: 1,
      cost: 200,
      baseStimulus: 7.5,
      quality: 65,
      energyCost: 16,
      fatigue: 10,
    },
    {
      id: "strength-elite",
      location: "strength-gym",
      targets: ["power", "cardio"],
      label: "Valérie Fortin",
      tierLabel: "Préparatrice élite",
      sessions: 1,
      cost: 320,
      baseStimulus: 9,
      quality: 100,
      energyCost: 18,
      fatigue: 12,
    },
  ]);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, finiteNumber(value, min)));
  }

  function roundTo(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round((finiteNumber(value) + Number.EPSILON) * factor) / factor;
  }

  function trainerError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details !== undefined) error.details = details;
    return error;
  }

  function normalizeId(value) {
    return String(value == null ? "" : value).trim().slice(0, 120);
  }

  function normalizeIds(source, limit = RECEIPT_LIMIT) {
    if (!Array.isArray(source)) return [];
    const result = [];
    source.forEach(value => {
      const id = normalizeId(value);
      if (id && !result.includes(id)) result.push(id);
    });
    return result.slice(-limit);
  }

  function getTrainer(id) {
    return TRAINERS.find(trainer => trainer.id === id) || null;
  }

  function assertTarget(target) {
    const normalized = String(target == null ? "" : target);
    if (!STAT_KEYS.includes(normalized)) {
      throw trainerError("INVALID_TRAINER_TARGET", `Qualité ciblée invalide : ${normalized || "aucune"}.`);
    }
    return normalized;
  }

  function normalizeProgram(source) {
    if (!source || typeof source !== "object") return null;
    const trainer = getTrainer(source.trainerId || source.coachId);
    if (!trainer) return null;
    const target = trainer.targets.includes(source.target) ? source.target : trainer.targets[0];
    const sessionsTotal = Math.round(clamp(source.sessionsTotal == null ? trainer.sessions : source.sessionsTotal, 1, 99));
    if (sessionsTotal !== 1) return null;
    const sessionsCompleted = Math.round(clamp(source.sessionsCompleted, 0, sessionsTotal));
    if (sessionsCompleted >= sessionsTotal) return null;
    const pendingTargetedXp = Math.round(clamp(source.pendingTargetedXp, 0, 99999));
    return {
      id: normalizeId(source.id) || `${trainer.id}:${target}:migrated`,
      trainerId: trainer.id,
      target,
      sessionsTotal,
      sessionsCompleted,
      // pendingGaugePoints reste un alias de sauvegarde; seules les nouvelles
      // valeurs explicitement marquées comme XP sont reprises.
      pendingGaugePoints: pendingTargetedXp,
      pendingTargetedXp,
      startedWeek: source.startedWeek == null ? null : String(source.startedWeek),
      costPaid: Math.round(clamp(source.costPaid == null ? trainer.cost : source.costPaid, 0, 999999)),
      freeSessionsUsed: Math.round(clamp(source.freeSessionsUsed, 0, 1)),
    };
  }

  function createState(input = {}) {
    const source = input && typeof input === "object" ? input : {};
    return {
      kind: STATE_KIND,
      schemaVersion: SCHEMA_VERSION,
      activeProgram: normalizeProgram(source.activeProgram || source.privateProgram),
      completedPrograms: normalizeIds(source.completedPrograms, 64),
      sessionReceipts: normalizeIds(source.sessionReceipts),
    };
  }

  function assertState(state) {
    if (!state || typeof state !== "object"
      || state.kind !== STATE_KIND
      || state.schemaVersion !== SCHEMA_VERSION
      || !Array.isArray(state.completedPrograms)
      || !Array.isArray(state.sessionReceipts)) {
      throw trainerError("INVALID_TRAINER_STATE", "État des entraîneurs privés invalide.");
    }
    return state;
  }

  function resolveProgressionApi(options = {}) {
    const api = options.progressionApi || defaultProgressionApi;
    if (!api || typeof api.applyPrivateTrainerSession !== "function") {
      throw trainerError("PROGRESSION_API_REQUIRED", "Le moteur BoxeurProgression est requis pour cette séance.");
    }
    return api;
  }

  function trainerMultiplier(trainer, progressionApi) {
    const config = progressionApi.DEFAULT_CONFIG || {};
    const privateConfig = config.privateTrainer || {};
    const minimum = finiteNumber(privateConfig.minimumMultiplier, 1);
    const maximum = Math.max(minimum, finiteNumber(privateConfig.maximumMultiplier, 1.35));
    return minimum + (maximum - minimum) * trainer.quality / 100;
  }

  function estimateGaugePoints(trainerId, statValue = 40, options = {}) {
    const trainer = getTrainer(trainerId);
    if (!trainer) throw trainerError("UNKNOWN_TRAINER", `Entraîneur inconnu : ${trainerId}.`);
    const progressionApi = resolveProgressionApi(options);
    // statValue demeure accepté pour préserver l’API des sauvegardes et vues
    // existantes. L’XP actuelle ne subit plus l’ancienne conversion en %.
    void statValue;
    return Math.max(1, Math.round(trainer.baseStimulus * trainerMultiplier(trainer, progressionApi)));
  }

  function listOffers(options = {}) {
    const statValue = options.statValue == null ? 40 : options.statValue;
    const location = TRAINER_LOCATIONS.includes(options.location) ? options.location : null;
    return TRAINERS.filter(trainer => !location || trainer.location === location).map(trainer => {
      const targetedXp = estimateGaugePoints(trainer.id, statValue, options);
      return {
        ...clone(trainer),
        estimatedGaugePointsPerSession: targetedXp,
        estimatedTargetedXpPerSession: targetedXp,
      };
    });
  }

  function startProgram(state, input = {}, options = {}) {
    assertState(state);
    const next = createState(state);
    if (next.activeProgram) {
      throw trainerError("ACTIVE_PROGRAM_EXISTS", "Termine ta séance privée actuelle avant d'en acheter une autre.");
    }
    const trainer = getTrainer(String(input.trainerId || ""));
    if (!trainer) throw trainerError("UNKNOWN_TRAINER", `Entraîneur inconnu : ${input.trainerId || "aucun"}.`);
    const target = assertTarget(input.target);
    if (!trainer.targets.includes(target)) {
      throw trainerError("TRAINER_TARGET_UNAVAILABLE", `${trainer.label} ne travaille pas cette qualité dans ce gym.`);
    }
    const freeSessions = Math.round(clamp(options.freeSessions, 0, trainer.sessions));
    const discount = Math.round(trainer.cost / trainer.sessions * freeSessions);
    const price = Math.max(0, trainer.cost - discount);
    const balance = clamp(options.balance, 0, Number.MAX_SAFE_INTEGER);
    if (balance < price) {
      throw trainerError("INSUFFICIENT_FUNDS", `Il manque ${price - balance} $ pour cette séance.`, {
        cost: price,
        regularCost: trainer.cost,
        discount,
        balance,
      });
    }
    const startedWeek = input.startedWeek == null ? null : String(input.startedWeek);
    const programId = normalizeId(input.programId)
      || `${trainer.id}:${target}:${startedWeek == null ? "untracked" : startedWeek}:${next.sessionReceipts.length + next.completedPrograms.length}`;
    if (next.completedPrograms.includes(programId)) {
      throw trainerError("PROGRAM_ALREADY_COMPLETED", "Cette séance privée a déjà été complétée.");
    }
    next.activeProgram = {
      id: programId,
      trainerId: trainer.id,
      target,
      sessionsTotal: trainer.sessions,
      sessionsCompleted: 0,
      pendingGaugePoints: 0,
      pendingTargetedXp: 0,
      startedWeek,
      costPaid: price,
      freeSessionsUsed: freeSessions,
    };
    return {
      state: next,
      result: {
        program: clone(next.activeProgram),
        trainer: clone(trainer),
        moneyDelta: price > 0 ? -price : 0,
        remainingBalance: balance - price,
        regularCost: trainer.cost,
        discount,
        freeSessionsUsed: freeSessions,
      },
    };
  }

  function duplicateSessionOutcome(state, progressionState, sourceId) {
    return {
      state: createState(state),
      progressionState,
      result: {
        duplicate: true,
        sourceId,
        energyDelta: 0,
        fatigueDelta: 0,
        gaugePointsCreated: 0,
        targetedXpCreated: 0,
        programCompleted: false,
      },
    };
  }

  function completeSession(state, progressionState, input = {}, options = {}) {
    assertState(state);
    const next = createState(state);
    const requestedSourceId = normalizeId(input.sourceId);
    if (requestedSourceId && next.sessionReceipts.includes(requestedSourceId)) {
      return duplicateSessionOutcome(next, progressionState, requestedSourceId);
    }
    const program = next.activeProgram;
    if (!program) throw trainerError("NO_ACTIVE_PROGRAM", "Aucune séance privée n'est active.");
    const trainer = getTrainer(program.trainerId);
    const defaultReceipt = `${program.id}:session-${program.sessionsCompleted + 1}`;
    const sourceId = requestedSourceId || defaultReceipt;
    if (next.sessionReceipts.includes(sourceId)) {
      return duplicateSessionOutcome(next, progressionState, sourceId);
    }
    const condition = input.condition && typeof input.condition === "object" ? input.condition : {};
    const energy = clamp(condition.energy == null ? 100 : condition.energy, 0, 100);
    if (energy < trainer.energyCost) {
      throw trainerError("INSUFFICIENT_ENERGY", `Il faut au moins ${trainer.energyCost} % d'énergie pour cette séance.`, {
        required: trainer.energyCost,
        energy,
      });
    }
    const progressionApi = resolveProgressionApi(options);
    const progressionOutcome = progressionApi.applyPrivateTrainerSession(progressionState, {
      target: program.target,
      baseStimulus: trainer.baseStimulus,
      quality: trainer.quality,
    }, {
      weekKey: input.weekKey,
      sourceId: `private-trainer:${sourceId}`,
      ...(options.progressionConfig ? { config: options.progressionConfig } : {}),
    });
    const acceptedStimulus = progressionOutcome.result.effectiveAccepted[program.target];
    const targetedXpCreated = acceptedStimulus > 0 ? Math.max(1, Math.round(acceptedStimulus)) : 0;
    program.sessionsCompleted += 1;
    program.pendingTargetedXp = Math.round(program.pendingTargetedXp + targetedXpCreated);
    program.pendingGaugePoints = program.pendingTargetedXp;
    next.sessionReceipts = [...next.sessionReceipts, sourceId].slice(-RECEIPT_LIMIT);
    const completedProgram = clone(program);
    const programCompleted = program.sessionsCompleted >= program.sessionsTotal;
    if (programCompleted) {
      next.completedPrograms = [...next.completedPrograms.filter(id => id !== program.id), program.id].slice(-64);
      next.activeProgram = null;
    } else {
      next.activeProgram = program;
    }
    return {
      state: next,
      progressionState: progressionOutcome.state,
      result: {
        duplicate: false,
        sourceId,
        trainer: clone(trainer),
        program: completedProgram,
        programCompleted,
        target: program.target,
        energyDelta: -trainer.energyCost,
        fatigueDelta: trainer.fatigue,
        gaugePointsCreated: targetedXpCreated,
        targetedXpCreated,
        stimulusAccepted: acceptedStimulus,
        progression: progressionOutcome.result,
      },
    };
  }

  function cancelProgram(state) {
    assertState(state);
    const next = createState(state);
    if (!next.activeProgram) {
      return { state: next, result: { cancelled: false, refund: 0, program: null } };
    }
    const cancelled = clone(next.activeProgram);
    next.activeProgram = null;
    return {
      state: next,
      result: {
        cancelled: true,
        refund: cancelled.costPaid,
        freeSessionsReturned: cancelled.freeSessionsUsed,
        program: cancelled,
      },
    };
  }

  function getPublicState(state) {
    assertState(state);
    const normalized = createState(state);
    if (!normalized.activeProgram) return { schemaVersion: SCHEMA_VERSION, activeProgram: null };
    const trainer = getTrainer(normalized.activeProgram.trainerId);
    return {
      schemaVersion: SCHEMA_VERSION,
      activeProgram: {
        ...clone(normalized.activeProgram),
        trainerLabel: trainer.label,
        tierLabel: trainer.tierLabel,
        progress: Math.round(normalized.activeProgram.sessionsCompleted / normalized.activeProgram.sessionsTotal * 100),
      },
    };
  }

  return Object.freeze({
    SCHEMA_VERSION,
    STATE_KIND,
    LEGACY_STATE_KINDS,
    STAT_KEYS,
    TRAINER_LOCATIONS,
    TRAINERS,
    createState,
    getTrainer,
    listOffers,
    estimateGaugePoints,
    startProgram,
    completeSession,
    cancelProgram,
    getPublicState,
  });
});
