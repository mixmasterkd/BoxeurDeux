(function attachBoxeurProgression(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurProgression = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createProgressionApi() {
  "use strict";

  /*
   * Pure progression core for the current career.
   *
   * Training only creates stimulus. Recovery assimilates that stimulus into
   * visible 0-100 gauges, and a full gauge grants exactly one stat point. This
   * keeps the combat stats stable between level-ups while making partial
   * progression readable in the Boxer screen.
   */

  const SCHEMA_VERSION = 1;
  const STATE_KIND = "boxeur-v2-progression";
  const STAT_KEYS = Object.freeze(["technique", "power", "cardio", "defense"]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  const DEFAULT_CONFIG = deepFreeze({
    statMin: 0,
    statMax: 99,
    legacyDefaultStat: 40,
    progressMax: 100,
    activeStimulusMax: 100,

    // A normal three-session week remains under the soft cap. Extra volume is
    // still useful, but progressively less efficient and eventually capped.
    weeklySoftCapPerStat: 20,
    weeklyHardCapPerStat: 30,
    weeklyHardCapTotal: 70,
    weeklyDiminishingStrength: 1,

    // Equivalent to BoxeurTime.STAT_GAIN_SCALE (0.024) expressed as points on
    // a 0-100 gauge: 0.024 * 100 = 2.4.
    progressPointsPerStimulus: 2.4,
    statDiminishingReference: 120,
    minimumStatEfficiency: 0.08,

    assimilation: {
      baseRate: 0.28,
      minRate: 0.08,
      maxRate: 0.32,
      minimumRecoveryCapacity: 0.2,
      energyWeight: 0.35,
      fatigueWeight: 0.65,
      minimumQuality: 0.75,
      maximumQuality: 1.25,
    },

    // A costly private trainer improves a targeted stimulus; it never writes
    // directly to stats or progress.
    privateTrainer: {
      minimumMultiplier: 1,
      maximumMultiplier: 1.35,
    },

    receiptLimit: 256,
    decimals: 4,
  });

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

  function roundTo(value, decimals = DEFAULT_CONFIG.decimals) {
    const factor = 10 ** decimals;
    return Math.round((finiteNumber(value) + Number.EPSILON) * factor) / factor;
  }

  function progressionError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details !== undefined) error.details = details;
    return error;
  }

  function resolveConfig(overrides = {}) {
    const source = overrides && typeof overrides === "object" ? overrides : {};
    return {
      ...DEFAULT_CONFIG,
      ...source,
      assimilation: {
        ...DEFAULT_CONFIG.assimilation,
        ...(source.assimilation && typeof source.assimilation === "object" ? source.assimilation : {}),
      },
      privateTrainer: {
        ...DEFAULT_CONFIG.privateTrainer,
        ...(source.privateTrainer && typeof source.privateTrainer === "object" ? source.privateTrainer : {}),
      },
    };
  }

  function emptyStats(value = 0) {
    return STAT_KEYS.reduce((result, key) => {
      result[key] = value;
      return result;
    }, {});
  }

  function normalizeVector(source, fallback, min, max, decimals) {
    const input = source && typeof source === "object" ? source : {};
    return STAT_KEYS.reduce((result, key) => {
      const value = input[key] == null ? fallback : input[key];
      result[key] = roundTo(clamp(value, min, max), decimals);
      return result;
    }, {});
  }

  function normalizeIds(source, limit) {
    if (!Array.isArray(source)) return [];
    const ids = [];
    source.forEach(value => {
      const id = String(value == null ? "" : value).trim();
      if (id && !ids.includes(id)) ids.push(id);
    });
    return ids.slice(-Math.max(1, Math.trunc(limit)));
  }

  function normalizeLoad(source, config) {
    const input = source && typeof source === "object" ? source : {};
    return {
      weekKey: input.weekKey == null ? null : String(input.weekKey),
      raw: normalizeVector(input.raw, 0, 0, config.weeklyHardCapPerStat, config.decimals),
      effective: normalizeVector(input.effective, 0, 0, Number.MAX_SAFE_INTEGER, config.decimals),
      sourceIds: normalizeIds(input.sourceIds, config.receiptLimit),
    };
  }

  function createState(input = {}, options = {}) {
    const config = resolveConfig(options.config);
    const source = input && typeof input === "object" ? input : {};
    const state = {
      kind: STATE_KIND,
      schemaVersion: SCHEMA_VERSION,
      stats: normalizeVector(
        source.stats,
        20,
        config.statMin,
        config.statMax,
        config.decimals,
      ),
      progress: normalizeVector(
        source.progress,
        0,
        0,
        Number.MAX_SAFE_INTEGER,
        config.decimals,
      ),
      stimulus: normalizeVector(
        source.stimulus,
        0,
        0,
        config.activeStimulusMax,
        config.decimals,
      ),
      stimulusReserve: normalizeVector(
        source.stimulusReserve,
        0,
        0,
        Number.MAX_SAFE_INTEGER,
        config.decimals,
      ),
      weeklyLoad: normalizeLoad(source.weeklyLoad, config),
      assimilationIds: normalizeIds(source.assimilationIds, config.receiptLimit),
    };
    STAT_KEYS.forEach(key => {
      const resolved = resolveGauge(state.stats[key], 0, state.progress[key], config);
      state.stats[key] = resolved.stat;
      state.progress[key] = resolved.progress;
    });
    return state;
  }

  function assertState(state) {
    if (!state || typeof state !== "object"
      || state.kind !== STATE_KIND
      || state.schemaVersion !== SCHEMA_VERSION
      || !state.stats
      || !state.progress
      || !state.stimulus
      || !state.stimulusReserve
      || !state.weeklyLoad) {
      throw progressionError("INVALID_PROGRESSION_STATE", "État de progression invalide.");
    }
    return state;
  }

  function rememberId(ids, id, limit) {
    if (!id) return ids;
    return [...ids.filter(existing => existing !== id), id].slice(-Math.max(1, Math.trunc(limit)));
  }

  function normalizedWeekLoad(state, weekKey, config) {
    const requestedKey = weekKey == null
      ? state.weeklyLoad.weekKey == null ? "untracked" : state.weeklyLoad.weekKey
      : String(weekKey);
    if (state.weeklyLoad.weekKey === requestedKey) return clone(state.weeklyLoad);
    return {
      weekKey: requestedKey,
      raw: emptyStats(0),
      effective: emptyStats(0),
      sourceIds: [],
    };
  }

  /* Exact integral of the weekly attenuation curve. Keeping it continuous makes
   * one 10-point stimulus equivalent to two 5-point stimuli. */
  function effectiveWeeklySpan(from, to, config) {
    if (to <= from) return 0;
    const soft = Math.max(0.0001, finiteNumber(config.weeklySoftCapPerStat, 20));
    const strength = Math.max(0, finiteNumber(config.weeklyDiminishingStrength, 1));
    if (to <= soft || strength === 0) return to - from;

    const linearEnd = Math.min(to, soft);
    const linear = Math.max(0, linearEnd - from);
    const postFrom = Math.max(from, soft);
    if (to <= postFrom) return linear;

    const startRatio = 1 + strength * (postFrom - soft) / soft;
    const endRatio = 1 + strength * (to - soft) / soft;
    return linear + soft / strength * Math.log(endRatio / startRatio);
  }

  function positiveStimulusVector(source, config) {
    const input = source && typeof source === "object" ? source : {};
    const result = {};
    STAT_KEYS.forEach(key => {
      const supplied = input[key] == null ? 0 : Number(input[key]);
      if (!Number.isFinite(supplied) || supplied < 0) {
        throw progressionError("INVALID_STIMULUS", `Le stimulus ${key} doit être un nombre positif ou nul.`);
      }
      result[key] = roundTo(supplied, config.decimals);
    });
    if (!STAT_KEYS.some(key => result[key] > 0)) {
      throw progressionError("EMPTY_STIMULUS", "Au moins un stimulus positif est requis.");
    }
    return result;
  }

  function emptyStimulusResult(requested, weekKey, duplicate = false) {
    return {
      duplicate,
      weekKey,
      requested: clone(requested),
      rawAccepted: emptyStats(0),
      effectiveAccepted: emptyStats(0),
      rejectedByWeeklyCap: emptyStats(0),
      rejectedByPendingCap: emptyStats(0),
      diminishingFactors: emptyStats(1),
    };
  }

  /**
   * Adds pending training stimulus without changing a stat or a visible gauge.
   * sourceId makes the transition idempotent when UI events are retried.
   */
  function addStimulus(state, stimulusInput, options = {}) {
    assertState(state);
    const config = resolveConfig(options.config);
    const requested = positiveStimulusVector(stimulusInput, config);
    const next = createState(state, { config });
    next.weeklyLoad = normalizedWeekLoad(next, options.weekKey, config);
    const sourceId = options.sourceId == null ? "" : String(options.sourceId).trim();

    if (sourceId && next.weeklyLoad.sourceIds.includes(sourceId)) {
      return {
        state: next,
        result: emptyStimulusResult(requested, next.weeklyLoad.weekKey, true),
      };
    }

    const result = emptyStimulusResult(requested, next.weeklyLoad.weekKey, false);
    const totalRawBefore = STAT_KEYS.reduce((sum, key) => sum + next.weeklyLoad.raw[key], 0);
    const totalCapacity = Math.max(0, config.weeklyHardCapTotal - totalRawBefore);
    const candidates = STAT_KEYS.reduce((values, key) => {
      const statCapacity = Math.max(0, config.weeklyHardCapPerStat - next.weeklyLoad.raw[key]);
      values[key] = Math.min(requested[key], statCapacity);
      return values;
    }, {});
    const candidateTotal = STAT_KEYS.reduce((sum, key) => sum + candidates[key], 0);
    const totalScale = candidateTotal > 0 ? Math.min(1, totalCapacity / candidateTotal) : 0;

    STAT_KEYS.forEach(key => {
      const rawAccepted = candidates[key] * totalScale;
      const rawBefore = next.weeklyLoad.raw[key];
      const rawAfter = rawBefore + rawAccepted;
      const effective = effectiveWeeklySpan(rawBefore, rawAfter, config);
      const pendingTotal = next.stimulus[key] + next.stimulusReserve[key];
      const pendingCapacity = Math.max(0, config.activeStimulusMax - pendingTotal);
      const effectiveAccepted = Math.min(effective, pendingCapacity);

      next.weeklyLoad.raw[key] = roundTo(rawAfter, config.decimals);
      next.weeklyLoad.effective[key] = roundTo(
        next.weeklyLoad.effective[key] + effectiveAccepted,
        config.decimals,
      );
      next.stimulus[key] = roundTo(next.stimulus[key] + effectiveAccepted, config.decimals);

      result.rawAccepted[key] = roundTo(rawAccepted, config.decimals);
      result.effectiveAccepted[key] = roundTo(effectiveAccepted, config.decimals);
      result.rejectedByWeeklyCap[key] = roundTo(requested[key] - rawAccepted, config.decimals);
      result.rejectedByPendingCap[key] = roundTo(Math.max(0, effective - effectiveAccepted), config.decimals);
      result.diminishingFactors[key] = rawAccepted > 0
        ? roundTo(effective / rawAccepted, config.decimals)
        : 1;
    });

    if (sourceId) {
      next.weeklyLoad.sourceIds = rememberId(next.weeklyLoad.sourceIds, sourceId, config.receiptLimit);
    }
    return { state: next, result };
  }

  function privateTrainerMultiplier(quality, config) {
    const normalizedQuality = clamp(quality, 0, 100) / 100;
    const minimum = finiteNumber(config.privateTrainer.minimumMultiplier, 1);
    const maximum = Math.max(minimum, finiteNumber(config.privateTrainer.maximumMultiplier, 1.35));
    return minimum + (maximum - minimum) * normalizedQuality;
  }

  /** Creates a targeted stimulus bonus, never an immediate progress/stat gain. */
  function applyPrivateTrainerSession(state, input = {}, options = {}) {
    const target = String(input.target == null ? "" : input.target);
    if (!STAT_KEYS.includes(target)) {
      throw progressionError("INVALID_TRAINER_TARGET", `Compétence ciblée invalide : ${target}.`);
    }
    const baseStimulus = finiteNumber(input.baseStimulus, NaN);
    if (!Number.isFinite(baseStimulus) || baseStimulus <= 0) {
      throw progressionError("INVALID_TRAINER_STIMULUS", "La séance privée doit créer un stimulus positif.");
    }
    const config = resolveConfig(options.config);
    const quality = clamp(input.quality == null ? 50 : input.quality, 0, 100);
    const multiplier = privateTrainerMultiplier(quality, config);
    const stimulus = emptyStats(0);
    stimulus[target] = roundTo(baseStimulus * multiplier, config.decimals);
    const outcome = addStimulus(state, stimulus, { ...options, config });
    return {
      ...outcome,
      result: {
        ...outcome.result,
        trainer: {
          target,
          quality: roundTo(quality, config.decimals),
          baseStimulus: roundTo(baseStimulus, config.decimals),
          multiplier: roundTo(multiplier, config.decimals),
        },
      },
    };
  }

  function assimilationRate(recovery, options, config) {
    if (options.assimilationRate != null) {
      return clamp(options.assimilationRate, 0, 1);
    }
    const input = recovery && typeof recovery === "object" ? recovery : {};
    const energy = clamp(input.energy == null ? 80 : input.energy, 0, 100);
    const fatigue = clamp(input.fatigue == null ? 20 : input.fatigue, 0, 100);
    const quality = clamp(
      input.quality == null ? 1 : input.quality,
      config.assimilation.minimumQuality,
      config.assimilation.maximumQuality,
    );
    const recoveryCapacity = clamp(
      energy / 100 * config.assimilation.energyWeight
        + (100 - fatigue) / 100 * config.assimilation.fatigueWeight,
      config.assimilation.minimumRecoveryCapacity,
      1,
    );
    return clamp(
      config.assimilation.baseRate * quality * recoveryCapacity,
      config.assimilation.minRate,
      config.assimilation.maxRate,
    );
  }

  function statEfficiency(stat, config) {
    return clamp(
      1 - stat / config.statDiminishingReference,
      config.minimumStatEfficiency,
      1,
    );
  }

  function resolveGauge(stat, progress, gain, config) {
    let nextStat = stat;
    let nextProgress = progress + gain;
    let levelUps = 0;
    let blockedProgress = 0;

    while (nextProgress >= config.progressMax && nextStat < config.statMax) {
      nextProgress -= config.progressMax;
      nextStat = Math.min(config.statMax, nextStat + 1);
      levelUps += 1;
    }
    if (nextStat >= config.statMax && nextProgress > config.progressMax) {
      blockedProgress = nextProgress - config.progressMax;
      nextProgress = config.progressMax;
    }
    return {
      stat: roundTo(nextStat, config.decimals),
      progress: roundTo(nextProgress, config.decimals),
      levelUps,
      blockedProgress: roundTo(blockedProgress, config.decimals),
    };
  }

  /**
   * Assimilates pending stimulus. recoveryId prevents the same night/rest event
   * from being applied twice after a retry or save reload.
   */
  function assimilate(state, recovery = {}, options = {}) {
    assertState(state);
    const config = resolveConfig(options.config);
    const next = createState(state, { config });
    const recoveryId = options.recoveryId == null ? "" : String(options.recoveryId).trim();
    const rate = assimilationRate(recovery, options, config);
    const result = {
      duplicate: false,
      rate: roundTo(rate, config.decimals),
      processedStimulus: emptyStats(0),
      reserveTransferred: emptyStats(0),
      progressGains: emptyStats(0),
      statGains: emptyStats(0),
      levelUps: emptyStats(0),
      blockedProgress: emptyStats(0),
      efficiencies: emptyStats(0),
    };

    if (recoveryId && next.assimilationIds.includes(recoveryId)) {
      result.duplicate = true;
      return { state: next, result };
    }

    STAT_KEYS.forEach(key => {
      const beforeStat = next.stats[key];
      const processed = Math.min(next.stimulus[key], next.stimulus[key] * rate);
      const efficiency = statEfficiency(beforeStat, config);
      const progressGain = processed * efficiency * config.progressPointsPerStimulus;
      next.stimulus[key] = roundTo(next.stimulus[key] - processed, config.decimals);

      const freeActiveSpace = Math.max(0, config.activeStimulusMax - next.stimulus[key]);
      const reserveTransfer = Math.min(next.stimulusReserve[key], freeActiveSpace);
      next.stimulusReserve[key] = roundTo(next.stimulusReserve[key] - reserveTransfer, config.decimals);
      next.stimulus[key] = roundTo(next.stimulus[key] + reserveTransfer, config.decimals);

      const resolved = resolveGauge(beforeStat, next.progress[key], progressGain, config);
      next.stats[key] = resolved.stat;
      next.progress[key] = resolved.progress;

      result.processedStimulus[key] = roundTo(processed, config.decimals);
      result.reserveTransferred[key] = roundTo(reserveTransfer, config.decimals);
      result.progressGains[key] = roundTo(progressGain, config.decimals);
      result.statGains[key] = roundTo(resolved.stat - beforeStat, config.decimals);
      result.levelUps[key] = resolved.levelUps;
      result.blockedProgress[key] = resolved.blockedProgress;
      result.efficiencies[key] = roundTo(efficiency, config.decimals);
    });

    if (recoveryId) {
      next.assimilationIds = rememberId(next.assimilationIds, recoveryId, config.receiptLimit);
    }
    return { state: next, result };
  }

  function unwrapLegacyCareer(source) {
    if (!source || typeof source !== "object") return {};
    if (source.legacySnapshot && typeof source.legacySnapshot === "object") {
      return unwrapLegacyCareer(source.legacySnapshot);
    }
    if (source.state && typeof source.state === "object") return source.state;
    return source;
  }

  function findExplicitProgress(source) {
    if (!source || typeof source !== "object") return null;
    if (source.kind === STATE_KIND && source.progress) return source.progress;
    if (source.progression && source.progression.kind === STATE_KIND) return source.progression.progress;
    if (source.progressionState && source.progressionState.kind === STATE_KIND) {
      return source.progressionState.progress;
    }
    return null;
  }

  function legacyProgressVector(source, config) {
    const career = unwrapLegacyCareer(source);
    const legacy = career.trainingProgress && typeof career.trainingProgress === "object"
      ? career.trainingProgress
      : {};
    return STAT_KEYS.reduce((result, key) => {
      const oldSteps = clamp(legacy[key] == null ? 0 : legacy[key], 0, 9);
      result[key] = roundTo(oldSteps * 10, config.decimals);
      return result;
    }, {});
  }

  /**
   * Imports either a V5 career, a BoxeurTime state, or a current migration
   * capsule. Existing stimulus is authoritative over legacy trainingProgress,
   * so the same partial training can never be credited twice.
   */
  function migrate(source, options = {}) {
    const config = resolveConfig(options.config);
    if (!source || typeof source !== "object") {
      return {
        state: createState({}, { config }),
        report: { source: "empty", ignoredLegacyProgress: false, reserveImported: emptyStats(0) },
      };
    }

    const already = source.kind === STATE_KIND
      ? source
      : source.progressionState && source.progressionState.kind === STATE_KIND
        ? source.progressionState
        : source.progression && source.progression.kind === STATE_KIND
          ? source.progression
          : null;
    if (already) {
      return {
        state: createState(already, { config }),
        report: { source: "v2-progression", ignoredLegacyProgress: false, reserveImported: emptyStats(0) },
      };
    }

    const timeState = source.timeState && typeof source.timeState === "object"
      ? source.timeState
      : source.stats && source.stimulus ? source : null;
    const career = unwrapLegacyCareer(source);
    const suppliedStats = timeState && timeState.stats
      ? timeState.stats
      : career.combatStats || career.stats;
    const stats = normalizeVector(
      suppliedStats,
      timeState ? 20 : config.legacyDefaultStat,
      config.statMin,
      config.statMax,
      config.decimals,
    );
    const hasAuthoritativeStimulus = Boolean(timeState && timeState.stimulus
      && typeof timeState.stimulus === "object");
    const explicitProgress = findExplicitProgress(source);
    const progress = explicitProgress || (hasAuthoritativeStimulus
      ? emptyStats(0)
      : legacyProgressVector(source, config));
    const activeStimulus = hasAuthoritativeStimulus ? timeState.stimulus : emptyStats(0);
    const carriedReserve = source.legacyTrainingCarry
      && source.legacyTrainingCarry.stimulusReserve
      && typeof source.legacyTrainingCarry.stimulusReserve === "object"
      ? source.legacyTrainingCarry.stimulusReserve
      : emptyStats(0);

    const normalizedActive = {};
    const normalizedReserve = {};
    STAT_KEYS.forEach(key => {
      const suppliedActive = clamp(activeStimulus[key] == null ? 0 : activeStimulus[key], 0, Number.MAX_SAFE_INTEGER);
      const suppliedReserve = clamp(carriedReserve[key] == null ? 0 : carriedReserve[key], 0, Number.MAX_SAFE_INTEGER);
      normalizedActive[key] = roundTo(Math.min(config.activeStimulusMax, suppliedActive), config.decimals);
      normalizedReserve[key] = roundTo(
        Math.max(0, suppliedActive - normalizedActive[key]) + suppliedReserve,
        config.decimals,
      );
    });
    const state = createState({
      stats,
      progress,
      stimulus: normalizedActive,
      stimulusReserve: normalizedReserve,
    }, { config });

    return {
      state,
      report: {
        source: hasAuthoritativeStimulus ? "boxeur-time" : "legacy-training-progress",
        ignoredLegacyProgress: hasAuthoritativeStimulus
          && Boolean(career.trainingProgress && typeof career.trainingProgress === "object"),
        reserveImported: clone(normalizedReserve),
      },
    };
  }

  /** Fractional equivalent used only by balance tests, never as a combat stat. */
  function getBalanceEquivalent(state, options = {}) {
    assertState(state);
    const config = resolveConfig(options.config);
    return STAT_KEYS.reduce((result, key) => {
      result[key] = roundTo(state.stats[key] + state.progress[key] / config.progressMax, config.decimals);
      return result;
    }, {});
  }

  function getPublicState(state, options = {}) {
    assertState(state);
    const config = resolveConfig(options.config);
    return {
      schemaVersion: state.schemaVersion,
      stats: clone(state.stats),
      progress: clone(state.progress),
      stimulus: clone(state.stimulus),
      maxed: STAT_KEYS.reduce((result, key) => {
        result[key] = state.stats[key] >= config.statMax;
        return result;
      }, {}),
    };
  }

  return Object.freeze({
    SCHEMA_VERSION,
    STATE_KIND,
    STAT_KEYS,
    DEFAULT_CONFIG,
    createState,
    migrate,
    addStimulus,
    applyPrivateTrainerSession,
    assimilate,
    getBalanceEquivalent,
    getPublicState,
  });
});
