(function attachBoxeurCareerV2Migration(root, factory) {
  const timeEngine = typeof module === "object" && module.exports
    ? require("./career-time-engine.js")
    : root && root.BoxeurTime;
  const api = factory(timeEngine);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurCareerV2Migration = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMigrationApi(BoxeurTime) {
  "use strict";

  if (!BoxeurTime || typeof BoxeurTime.createState !== "function") {
    throw new Error("BoxeurTime doit être chargé avant career-v2-migration.js.");
  }

  const CAPSULE_KIND = "boxeur-deux-career-v2-capsule";
  const CAPSULE_VERSION = 2;
  const LEGACY_TRAINING_CARRY_VERSION = 1;
  const EXPECTED_SOURCE_VERSION = 5;
  const MAX_CAREER_WEEK = 99999;
  const DEFAULT_COMBAT_STAT = 40;
  const STAT_KEYS = Object.freeze([...BoxeurTime.STAT_KEYS]);

  function clone(value, seen = new Map()) {
    if (value === null || typeof value !== "object") return value;
    if (seen.has(value)) return seen.get(value);
    if (value instanceof Date) return new Date(value.getTime());
    if (Array.isArray(value)) {
      const result = [];
      seen.set(value, result);
      value.forEach(item => result.push(clone(item, seen)));
      return result;
    }
    const result = {};
    seen.set(value, result);
    Object.keys(value).forEach(key => { result[key] = clone(value[key], seen); });
    return result;
  }

  function clampNumber(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function boundedInteger(value, fallback, min, max) {
    return Math.trunc(clampNumber(value, fallback, min, max));
  }

  function roundTo(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function floorTo(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.floor((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function stateFromSnapshot(snapshot) {
    if (snapshot && typeof snapshot === "object" && snapshot.state && typeof snapshot.state === "object") {
      return snapshot.state;
    }
    return snapshot && typeof snapshot === "object" ? snapshot : {};
  }

  function sourceVersionFrom(snapshot, override) {
    if (override !== undefined) return boundedInteger(override, EXPECTED_SOURCE_VERSION, 1, 999);
    const source = snapshot && typeof snapshot === "object" ? snapshot.version : undefined;
    return boundedInteger(source, EXPECTED_SOURCE_VERSION, 1, 999);
  }

  function normalizedMigratedAt(options) {
    const supplied = options.migratedAt !== undefined
      ? options.migratedAt
      : typeof options.now === "function" ? options.now() : new Date();
    const date = supplied instanceof Date ? supplied : new Date(supplied);
    return Number.isFinite(date.getTime()) ? date.toISOString() : new Date(0).toISOString();
  }

  function inferCareerPhase(career) {
    const activeTournament = career.activeTournament;
    const tournamentActive = activeTournament && typeof activeTournament === "object"
      && !["completed", "cancelled", "withdrawn"].includes(String(activeTournament.status || "").toLowerCase());
    if (tournamentActive) return "tournament";
    if (career.careerStatus === "professional") return "professional";
    if (career.careerStatus === "recreational") return "recreational";
    return "amateur";
  }

  function normalizeCombatStats(career) {
    const source = career.combatStats && typeof career.combatStats === "object" ? career.combatStats : {};
    return STAT_KEYS.reduce((stats, key) => {
      stats[key] = roundTo(clampNumber(source[key], DEFAULT_COMBAT_STAT, 0, 99), 2);
      return stats;
    }, {});
  }

  function normalizeTrainingProgress(career) {
    const source = career.trainingProgress && typeof career.trainingProgress === "object"
      ? career.trainingProgress
      : {};
    return STAT_KEYS.reduce((progress, key) => {
      progress[key] = roundTo(clampNumber(source[key], 0, 0, 9), 4);
      return progress;
    }, {});
  }

  /**
   * Converts a V5 counter (ten steps historically yielded +1) into unassimilated
   * current stimulus. The diminishing-return factor is inverted so the pending
   * value still represents roughly progress / 10 of a future stat point.
   */
  function progressToResidualStimulus(progressValue, currentStat) {
    const progress = clampNumber(progressValue, 0, 0, 9);
    const stat = clampNumber(currentStat, DEFAULT_COMBAT_STAT, 0, 100);
    const intendedGain = progress / 10;
    const diminishingReturn = clampNumber(1 - stat / 120, 0.08, 0.08, 1);
    const raw = intendedGain / (diminishingReturn * BoxeurTime.STAT_GAIN_SCALE);
    const rawStimulus = roundTo(raw);
    // BoxeurTime serializes physical values to two decimals; matching that
    // precision here keeps the audit and the actual pending gauge identical.
    // Flooring (instead of rounding upward) guarantees that the additive
    // reserve can represent the exact four-decimal total without a negative
    // correction.
    const applied = floorTo(Math.min(100, rawStimulus), 2);
    return {
      progress: roundTo(progress),
      intendedGain: roundTo(intendedGain),
      diminishingReturn: roundTo(diminishingReturn, 6),
      rawStimulus,
      appliedStimulus: applied,
      overflowStimulus: roundTo(Math.max(0, rawStimulus - applied)),
    };
  }

  /**
   * The active BoxeurTime stimulus gauge is deliberately capped at 100. At a
   * high stat, inverting diminishing returns can require more than 100 stimulus
   * to preserve the fraction of a legacy +1 counter. Keep that excess beside
   * the time state instead of silently turning it into an immediate stat gain.
   *
   * intendedStatGain is the authoritative, unit-stable migration intent. The
   * stimulusReserve is the part that could not fit in the bounded active gauge.
   * Both fields are additive, so capsules written before this carry existed
   * remain readable and can be repaired from their migration audit.
   */
  function legacyTrainingCarryFromAudit(progressAudit) {
    const intendedStatGain = {};
    const stimulusReserve = {};
    const totalStimulus = {};
    STAT_KEYS.forEach(key => {
      const audit = progressAudit && progressAudit[key] && typeof progressAudit[key] === "object"
        ? progressAudit[key]
        : {};
      intendedStatGain[key] = roundTo(clampNumber(audit.intendedGain, 0, 0, 0.9), 4);
      stimulusReserve[key] = roundTo(clampNumber(audit.overflowStimulus, 0, 0, Number.MAX_SAFE_INTEGER), 4);
      totalStimulus[key] = roundTo(clampNumber(
        audit.rawStimulus,
        stimulusReserve[key],
        0,
        Number.MAX_SAFE_INTEGER,
      ), 4);
    });
    return {
      version: LEGACY_TRAINING_CARRY_VERSION,
      unit: "legacy-stat-gain",
      intendedStatGain,
      stimulusReserve,
      totalStimulus,
    };
  }

  function hasCompleteLegacyTrainingCarry(value) {
    return Boolean(value && typeof value === "object"
      && value.version === LEGACY_TRAINING_CARRY_VERSION
      && value.unit === "legacy-stat-gain"
      && STAT_KEYS.every(key => (
        Number.isFinite(Number(value.intendedStatGain && value.intendedStatGain[key]))
        && Number.isFinite(Number(value.stimulusReserve && value.stimulusReserve[key]))
        && Number.isFinite(Number(value.totalStimulus && value.totalStimulus[key]))
      )));
  }

  function ensureLegacyTrainingCarry(capsule) {
    const result = clone(capsule);
    if (hasCompleteLegacyTrainingCarry(result.legacyTrainingCarry)) return result;

    let progressAudit = result.migrationAudit && result.migrationAudit.trainingProgress;
    if (!progressAudit || typeof progressAudit !== "object") {
      const career = stateFromSnapshot(result.legacySnapshot);
      const stats = normalizeCombatStats(career);
      const progress = normalizeTrainingProgress(career);
      progressAudit = {};
      STAT_KEYS.forEach(key => {
        progressAudit[key] = progressToResidualStimulus(progress[key], stats[key]);
      });
    }
    result.legacyTrainingCarry = legacyTrainingCarryFromAudit(progressAudit);
    return result;
  }

  function legacyWeeklyPlanFrom(snapshot, career) {
    if (snapshot && typeof snapshot === "object" && Array.isArray(snapshot.weeklyPlan)) {
      return snapshot.weeklyPlan;
    }
    return Array.isArray(career.weeklyPlan) ? career.weeklyPlan : [];
  }

  function isV2Capsule(value) {
    return Boolean(value && typeof value === "object"
      && value.kind === CAPSULE_KIND
      && value.version === CAPSULE_VERSION
      && Object.prototype.hasOwnProperty.call(value, "legacySnapshot")
      && value.timeState);
  }

  /**
   * Creates an additive career capsule. The complete input remains inside
   * legacySnapshot; no V5 field is deleted, renamed or executed here.
   */
  function migrateV5ToV2(snapshot, options = {}) {
    if (isV2Capsule(snapshot)) {
      const upgraded = ensureLegacyTrainingCarry(snapshot);
      upgraded.timeState = BoxeurTime.upgradeState(upgraded.timeState);
      return upgraded;
    }

    const legacySnapshot = clone(snapshot);
    const career = stateFromSnapshot(snapshot);
    const week = boundedInteger(career.week, 1, 1, MAX_CAREER_WEEK);
    const stats = normalizeCombatStats(career);
    const progress = normalizeTrainingProgress(career);
    const progressAudit = {};
    const statXp = {};
    const statXpRanks = {};
    const stimulus = {};

    STAT_KEYS.forEach(key => {
      progressAudit[key] = progressToResidualStimulus(progress[key], stats[key]);
      const fractionalXp = Math.round((stats[key] - Math.floor(stats[key])) * BoxeurTime.STAT_XP_FIRST_THRESHOLD);
      const legacyCounterXp = Math.round(progress[key] / 10 * BoxeurTime.STAT_XP_FIRST_THRESHOLD);
      statXp[key] = Math.min(BoxeurTime.STAT_XP_FIRST_THRESHOLD - 1, Math.max(fractionalXp, legacyCounterXp));
      statXpRanks[key] = 0;
      stimulus[key] = 0;
    });

    const seed = String(options.seed == null
      ? `v5:${career.profile?.firstName || "boxeur"}:${career.profile?.lastName || "deux"}:${week}`
      : options.seed);
    const timeState = BoxeurTime.createState({
      seed,
      week,
      day: "monday",
      period: "morning",
      condition: {
        energy: clampNumber(career.energy, 72, 0, 100),
        fatigue: clampNumber(career.fatigue, 0, 0, 100),
      },
      stats: Object.fromEntries(STAT_KEYS.map(key => [key, Math.floor(stats[key])])),
      statXp,
      statXpRanks,
      stimulus,
    });
    const legacyPendingPlan = clone(legacyWeeklyPlanFrom(snapshot, career));

    return {
      kind: CAPSULE_KIND,
      version: CAPSULE_VERSION,
      sourceVersion: sourceVersionFrom(snapshot, options.sourceVersion),
      migratedAt: normalizedMigratedAt(options),
      phase: inferCareerPhase(career),
      sourceCareerStatus: typeof career.careerStatus === "string" ? career.careerStatus : null,
      legacySnapshot,
      legacyPendingPlan,
      legacyPendingPlanStatus: legacyPendingPlan.length ? "pending-review" : "empty",
      timeState,
      legacyTrainingCarry: legacyTrainingCarryFromAudit(progressAudit),
      migrationAudit: {
        trainingProgress: progressAudit,
        legacyWeeklyPlan: {
          executed: false,
          count: legacyPendingPlan.length,
          disposition: "preserved-for-review",
        },
      },
    };
  }

  function assertTimeState(timeState) {
    if (!timeState || typeof timeState !== "object" || !timeState.clock || !timeState.condition || !timeState.stats) {
      throw new TypeError("Un état BoxeurTime valide est requis.");
    }
  }

  /**
   * Projects only the four runtime-owned values back onto a copied V5 career. Money,
   * employment, vacations, tournaments, records and every unknown field survive.
   */
  function syncTimeStateToCareer(snapshotOrCapsule, suppliedTimeState) {
    const capsule = isV2Capsule(snapshotOrCapsule) ? snapshotOrCapsule : null;
    const source = capsule ? capsule.legacySnapshot : snapshotOrCapsule;
    const timeState = suppliedTimeState || (capsule && capsule.timeState);
    assertTimeState(timeState);
    if (!source || typeof source !== "object") throw new TypeError("Une sauvegarde carrière valide est requise.");

    const result = clone(source);
    const career = result.state && typeof result.state === "object" ? result.state : result;
    career.week = boundedInteger(timeState.clock.week, 1, 1, MAX_CAREER_WEEK);
    career.energy = roundTo(clampNumber(timeState.condition.energy, 72, 0, 100), 2);
    career.fatigue = roundTo(clampNumber(timeState.condition.fatigue, 0, 0, 100), 2);
    const oldStats = career.combatStats && typeof career.combatStats === "object" ? career.combatStats : {};
    career.combatStats = { ...oldStats };
    STAT_KEYS.forEach(key => {
      career.combatStats[key] = roundTo(clampNumber(timeState.stats[key], DEFAULT_COMBAT_STAT, 0, 99), 2);
    });
    return result;
  }

  /** Returns an independent copy byte-for-byte equivalent to the migrated input. */
  function rollbackV2Migration(capsule) {
    if (!isV2Capsule(capsule)) throw new TypeError("Une capsule de migration de carrière valide est requise.");
    return clone(capsule.legacySnapshot);
  }

  return Object.freeze({
    CAPSULE_KIND,
    CAPSULE_VERSION,
    LEGACY_TRAINING_CARRY_VERSION,
    EXPECTED_SOURCE_VERSION,
    STAT_KEYS,
    isV2Capsule,
    inferCareerPhase,
    progressToResidualStimulus,
    migrateV5ToV2,
    syncTimeStateToCareer,
    rollbackV2Migration,
  });
});
