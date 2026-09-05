(function attachBoxeurWeek(root, factory) {
  const isCommonJs = typeof module === "object" && module.exports;
  const timeApi = isCommonJs ? require("./career-time-engine.js") : root && root.BoxeurTime;
  const trainingApi = isCommonJs ? require("./training-engine.js") : root && root.BoxeurTraining;
  const recoveryApi = isCommonJs ? require("./recovery-engine.js") : root && root.BoxeurRecovery;
  const api = factory(timeApi, trainingApi, recoveryApi);
  if (isCommonJs) module.exports = api;
  if (root) root.BoxeurWeek = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createWeekApi(
  BoxeurTime,
  BoxeurTraining,
  BoxeurRecovery,
) {
  "use strict";

  if (!BoxeurTime || !BoxeurTraining || !BoxeurRecovery) {
    throw new Error("BoxeurWeek requiert BoxeurTime, BoxeurTraining et BoxeurRecovery.");
  }

  const SCHEMA_VERSION = 1;
  const MODES = Object.freeze(["detailed", "quick", "hybrid"]);
  const DEFAULT_BUDGET = Object.freeze({ trainingSessions: 3, shortRecoveries: 2 });
  const DEFAULT_TRAINING_SLOTS = Object.freeze([2, 5, 8, 11, 14, 17, 20]);
  const MAX_TRAINING_SESSIONS = BoxeurTime.DAYS.length;
  const IMPORTANT_KINDS = Object.freeze([
    "bout", "combat", "fight", "sparring", "tournament", "tournoi", "weigh-in", "weigh_in", "weighin",
  ]);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function roundTo(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function finiteNumber(value, fallback = 0, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function boundedInteger(value, fallback, min, max) {
    return Math.trunc(finiteNumber(value, fallback, min, max));
  }

  function weekError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details !== undefined) error.details = details;
    return error;
  }

  function isTimeState(value) {
    return Boolean(value && typeof value === "object"
      && value.clock && value.condition && value.stats && value.stimulus);
  }

  function legacyCareerFrom(source) {
    const legacy = source && source.legacySnapshot;
    if (!legacy || typeof legacy !== "object") return {};
    return legacy.state && typeof legacy.state === "object" ? legacy.state : legacy;
  }

  /**
   * Normalizes a raw BoxeurTime state, a prior week envelope or a migration
   * capsule without altering any of them. Finances remain a separate concern so
   * this engine never rewrites the rollback snapshot stored by the migration.
   */
  function createWeekState(source, options = {}) {
    let timeState;
    if (isTimeState(source)) timeState = source;
    else if (source && isTimeState(source.timeState)) timeState = source.timeState;
    else throw weekError("INVALID_WEEK_STATE", "Un état BoxeurTime ou une capsule de carrière valide est requis.");
    BoxeurTime.getPublicState(timeState);

    const previousFinances = source && source.finances && typeof source.finances === "object"
      ? source.finances
      : {};
    const legacyCareer = legacyCareerFrom(source);
    const suppliedMoney = options.money == null
      ? previousFinances.money == null
        ? legacyCareer.money == null ? timeState.money : legacyCareer.money
        : previousFinances.money
      : options.money;
    return {
      schemaVersion: SCHEMA_VERSION,
      timeState: clone(timeState),
      finances: {
        ...clone(previousFinances),
        money: roundTo(finiteNumber(suppliedMoney, 0, 0, Number.MAX_SAFE_INTEGER)),
      },
    };
  }

  function weekBounds(timeState) {
    const weekStartSlot = (timeState.clock.week - 1) * BoxeurTime.PERIODS_PER_WEEK;
    return {
      week: timeState.clock.week,
      weekStartSlot,
      weekEndSlot: weekStartSlot + BoxeurTime.PERIODS_PER_WEEK,
    };
  }

  function absoluteSlotFor(week, input) {
    if (Number.isInteger(input)) return (week - 1) * BoxeurTime.PERIODS_PER_WEEK + input;
    if (!input || typeof input !== "object") throw weekError("INVALID_PLAN_SLOT", "Une période de semaine est requise.");
    if (input.startSlot != null) return BoxeurTime.toAbsoluteSlot(input.startSlot);
    if (input.relativeSlot != null) {
      const relativeSlot = Number(input.relativeSlot);
      if (!Number.isInteger(relativeSlot) || relativeSlot < 0 || relativeSlot >= BoxeurTime.PERIODS_PER_WEEK) {
        throw weekError("INVALID_PLAN_SLOT", "La période relative doit appartenir à la semaine courante.");
      }
      return (week - 1) * BoxeurTime.PERIODS_PER_WEEK + relativeSlot;
    }
    return BoxeurTime.toAbsoluteSlot({ week, day: input.day, period: input.period });
  }

  function normalizeWorkActivity(work = {}, shift = {}, index = 0) {
    const supplied = shift.activity == null ? work.activity : shift.activity;
    if (supplied != null) {
      const activity = BoxeurTime.normalizeActivity(supplied);
      if (activity.category !== "work" || Object.values(activity.stimulus).some(value => value > 0)) {
        throw weekError(
          "INVALID_WORK_ACTIVITY",
          "Un quart de travail ne peut pas être utilisé comme entraînement de boxe déguisé.",
        );
      }
      return activity;
    }
    const legacyEnergy = finiteNumber(shift.energy == null ? work.energy : shift.energy, -10, -100, 100);
    return BoxeurTime.normalizeActivity({
      id: String(shift.activityId || work.activityId || `work:${work.id || "job"}`),
      label: String(shift.label || work.label || work.title || `Quart de travail ${index + 1}`),
      category: "work",
      duration: boundedInteger(shift.duration == null ? work.duration : shift.duration, 2, 1, BoxeurTime.MAX_ACTIVITY_DURATION),
      energyCost: shift.energyCost == null && work.energyCost == null
        ? Math.max(0, -legacyEnergy)
        : finiteNumber(shift.energyCost == null ? work.energyCost : shift.energyCost, 10, 0, 100),
      energyGain: finiteNumber(shift.energyGain == null ? work.energyGain : shift.energyGain, 0, 0, 100),
      fatigueGain: finiteNumber(
        shift.fatigueGain == null ? (work.fatigueGain == null ? work.fatigue : work.fatigueGain) : shift.fatigueGain,
        8,
        0,
        100,
      ),
      fatigueRelief: 0,
      stimulus: { technique: 0, power: 0, cardio: 0, defense: 0 },
    });
  }

  function normalizeTrainingEntries(timeState, config, budget, bounds) {
    if (budget.trainingSessions <= 0 || config.training === false) return [];
    const training = config.training && typeof config.training === "object" ? config.training : {};
    const slots = Array.isArray(training.slots) && training.slots.length
      ? training.slots
      : DEFAULT_TRAINING_SLOTS.slice(0, budget.trainingSessions);
    const sessions = Array.isArray(training.sessions) ? training.sessions : [];
    return slots.slice(0, budget.trainingSessions).map((slot, index) => ({
      id: `training-${bounds.week}-${index + 1}`,
      kind: "training",
      startSlot: absoluteSlotFor(bounds.week, slot),
      duration: BoxeurTraining.SESSION_DURATION_PERIODS,
      session: sessions[index] == null ? "coach" : clone(sessions[index]),
      context: clone(training.context || config.trainingContext || {}),
      budgetKind: "trainingSessions",
    }));
  }

  function normalizeWorkEntries(config, bounds) {
    const work = config.work && typeof config.work === "object" ? config.work : null;
    if (!work || work.active === false || !Array.isArray(work.shifts) || !work.shifts.length) return [];
    const count = work.shifts.length;
    const weeklyPay = finiteNumber(work.weeklyPay == null ? work.wage : work.weeklyPay, 0, 0, Number.MAX_SAFE_INTEGER);
    const regularWeeklyShare = count > 0 ? roundTo(weeklyPay / count) : 0;
    return work.shifts.map((shiftInput, index) => {
      const shift = typeof shiftInput === "object" ? shiftInput : { relativeSlot: shiftInput };
      const activity = normalizeWorkActivity(work, shift, index);
      const explicitPay = shift.pay == null ? (shift.salary == null ? work.payPerShift : shift.salary) : shift.pay;
      const pay = explicitPay == null && weeklyPay > 0
        ? index === count - 1 ? roundTo(weeklyPay - regularWeeklyShare * (count - 1)) : regularWeeklyShare
        : explicitPay;
      return {
        id: `work-${bounds.week}-${index + 1}`,
        kind: "work",
        startSlot: absoluteSlotFor(bounds.week, shift),
        duration: activity.duration,
        activity,
        pay: roundTo(finiteNumber(pay, 0, 0, Number.MAX_SAFE_INTEGER)),
        jobId: String(work.id || "job"),
        budgetKind: "workShifts",
      };
    });
  }

  function isPhysicalPrimitive(primitive) {
    return Boolean(primitive && (
      primitive.kind === "training"
      || (primitive.kind === "activity" && (
        primitive.physical === true
        || primitive.budgetKind === "trainingSessions"
      ))
    ));
  }

  function budgetKindForPrimitive(primitive) {
    if (isPhysicalPrimitive(primitive)) return "trainingSessions";
    if (primitive && primitive.kind === "recovery") return "shortRecoveries";
    if (primitive && primitive.kind === "work") return "workShifts";
    return null;
  }

  function normalizeActivityDetail(detailInput, activity) {
    const detail = detailInput && typeof detailInput === "object" ? detailInput : {};
    return {
      label: String(detail.label == null ? activity.label : detail.label),
      category: String(detail.category == null ? activity.category : detail.category),
      xpAward: Math.round(finiteNumber(detail.xpAward, 0, 0, Number.MAX_SAFE_INTEGER)),
      wear: roundTo(finiteNumber(detail.wear, 0, 0, Number.MAX_SAFE_INTEGER)),
      injuryRiskPercent: 0,
    };
  }

  function normalizeGenericActivityPrimitive(primitiveInput) {
    const primitive = primitiveInput && typeof primitiveInput === "object" ? primitiveInput : {};
    const activity = BoxeurTime.normalizeActivity(primitive.activity);
    const physical = primitive.physical === true || primitive.budgetKind === "trainingSessions";
    return {
      ...clone(primitive),
      kind: "activity",
      activity,
      duration: activity.duration,
      moneyDelta: roundTo(finiteNumber(
        primitive.moneyDelta,
        0,
        -Number.MAX_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER,
      )),
      detail: normalizeActivityDetail(primitive.detail, activity),
      physical,
      budgetKind: physical ? "trainingSessions" : null,
    };
  }

  function assertNoPlanOverlap(entries) {
    const sorted = [...entries].sort((left, right) => left.startSlot - right.startSlot || left.id.localeCompare(right.id));
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (current.startSlot < previous.startSlot + previous.duration) {
        throw weekError("WEEK_PLAN_OVERLAP", `${current.id} chevauche ${previous.id}.`, {
          firstId: previous.id,
          secondId: current.id,
        });
      }
    }
    return sorted;
  }

  /** Creates the common budget and primitive list shared by all three modes. */
  function buildWeekPlan(source, config = {}) {
    const weekState = createWeekState(source, config.finances || {});
    const bounds = weekBounds(weekState.timeState);
    const budgetInput = config.budget && typeof config.budget === "object" ? config.budget : {};
    const trainingInput = config.training && typeof config.training === "object" ? config.training : {};
    const configuredTrainingCount = Array.isArray(trainingInput.slots) && trainingInput.slots.length
      ? trainingInput.slots.length
      : Array.isArray(trainingInput.sessions) && trainingInput.sessions.length
        ? trainingInput.sessions.length
        : DEFAULT_BUDGET.trainingSessions;
    const budget = {
      trainingSessions: config.training === false
        ? 0
        : boundedInteger(
          budgetInput.trainingSessions,
          configuredTrainingCount,
          0,
          MAX_TRAINING_SESSIONS,
        ),
      shortRecoveries: boundedInteger(
        budgetInput.shortRecoveries,
        DEFAULT_BUDGET.shortRecoveries,
        0,
        BoxeurTime.PERIODS_PER_WEEK,
      ),
      workShifts: 0,
    };
    const entries = [
      ...normalizeTrainingEntries(weekState.timeState, config, budget, bounds),
      ...normalizeWorkEntries(config, bounds),
    ];
    budget.workShifts = entries.filter(entry => entry.kind === "work").length;
    const sorted = assertNoPlanOverlap(entries);
    sorted.forEach(entry => {
      if (entry.startSlot < bounds.weekStartSlot || entry.startSlot + entry.duration > bounds.weekEndSlot) {
        throw weekError("WEEK_PLAN_OUT_OF_BOUNDS", `${entry.id} dépasse la semaine courante.`);
      }
    });
    return {
      schemaVersion: SCHEMA_VERSION,
      week: bounds.week,
      weekStartSlot: bounds.weekStartSlot,
      weekEndSlot: bounds.weekEndSlot,
      budget,
      entries: clone(sorted),
    };
  }

  function normalizeSuppliedPlan(timeState, planInput) {
    if (!planInput || typeof planInput !== "object" || !Array.isArray(planInput.entries)) {
      throw weekError("INVALID_WEEK_PLAN", "Un plan de semaine structuré est requis.");
    }
    const bounds = weekBounds(timeState);
    if (Number(planInput.week) !== bounds.week
      || Number(planInput.weekStartSlot) !== bounds.weekStartSlot
      || Number(planInput.weekEndSlot) !== bounds.weekEndSlot) {
      throw weekError("STALE_WEEK_PLAN", "Le plan ne correspond pas à la semaine courante.");
    }
    const entries = planInput.entries.map((entry, index) => {
      if (!entry || typeof entry !== "object" || !["training", "work", "recovery", "activity"].includes(entry.kind)) {
        throw weekError("INVALID_WEEK_PLAN", `Entrée de plan invalide à la position ${index + 1}.`);
      }
      const normalizedEntry = entry.kind === "activity"
        ? normalizeGenericActivityPrimitive(entry)
        : clone(entry);
      const duration = entry.kind === "activity"
        ? normalizedEntry.activity.duration
        : boundedInteger(entry.duration, 1, 1, BoxeurTime.MAX_ACTIVITY_DURATION);
      if (entry.kind === "activity"
        && entry.duration != null
        && Number(entry.duration) !== normalizedEntry.activity.duration) {
        throw weekError(
          "WEEK_PLAN_ACTIVITY_DURATION_MISMATCH",
          `${entry.id || `entrée-${index + 1}`} ne correspond pas à la durée de son activité.`,
        );
      }
      const startSlot = Number(entry.startSlot);
      if (!Number.isInteger(startSlot)
        || startSlot < bounds.weekStartSlot
        || startSlot + duration > bounds.weekEndSlot) {
        throw weekError("WEEK_PLAN_OUT_OF_BOUNDS", `${entry.id || `entrée-${index + 1}`} dépasse la semaine courante.`);
      }
      return {
        ...normalizedEntry,
        id: String(entry.id || `plan-${bounds.week}-${index + 1}`),
        startSlot,
        duration,
      };
    });
    const sorted = assertNoPlanOverlap(entries);
    const budgetInput = planInput.budget && typeof planInput.budget === "object" ? planInput.budget : {};
    // Le budget couvre toute la semaine, y compris le sparring déjà joué.
    // Seules les entrées à venir s'ajoutent à l'historique : un plan complet
    // repris ne doit pas compter deux fois ses anciennes séances.
    const completedTrainingCount = weekHistoryCounts(timeState, { ...bounds, entries: sorted }).trainingSessions;
    const remainingTrainingCount = sorted.filter(entry => (
      isPhysicalPrimitive(entry) && entry.startSlot >= timeState.clock.absoluteSlot
    )).length;
    const detailedTrainingCount = completedTrainingCount + remainingTrainingCount;
    return {
      schemaVersion: SCHEMA_VERSION,
      week: bounds.week,
      weekStartSlot: bounds.weekStartSlot,
      weekEndSlot: bounds.weekEndSlot,
      budget: {
        trainingSessions: Math.min(
          detailedTrainingCount,
          boundedInteger(
            budgetInput.trainingSessions,
            detailedTrainingCount,
            0,
            MAX_TRAINING_SESSIONS,
          ),
        ),
        shortRecoveries: boundedInteger(
          budgetInput.shortRecoveries,
          DEFAULT_BUDGET.shortRecoveries,
          0,
          BoxeurTime.PERIODS_PER_WEEK,
        ),
        workShifts: sorted.filter(entry => entry.kind === "work").length,
      },
      entries: clone(sorted),
    };
  }

  function resolvePlan(weekState, config) {
    return config.plan
      ? normalizeSuppliedPlan(weekState.timeState, config.plan)
      : buildWeekPlan(weekState, config);
  }

  function eventSequence(event) {
    const match = /^time-event-(\d+)$/.exec(String(event && event.id || ""));
    return match ? Number(match[1]) : null;
  }

  function newEvents(before, after) {
    const cutoff = Number(before.sequence);
    const oldIds = new Set((before.history || []).map(event => String(event && event.id || "")));
    return (after.history || []).filter(event => {
      const sequence = eventSequence(event);
      if (Number.isFinite(cutoff) && sequence !== null) return sequence > cutoff;
      return !oldIds.has(String(event && event.id || ""));
    });
  }

  function valueDeltas(before, after) {
    return BoxeurTime.STAT_KEYS.reduce((result, key) => {
      result[key] = roundTo(Number(after[key]) - Number(before[key]));
      return result;
    }, {});
  }

  function makeRecord(before, after, beforeMoney, afterMoney, primitive, detail = {}) {
    const events = newEvents(before, after);
    return {
      id: `week-action-${after.sequence}`,
      kind: primitive.kind,
      label: String(detail.label || primitive.label || primitive.kind),
      from: clone(before.clock),
      to: clone(after.clock),
      elapsedPeriods: after.clock.absoluteSlot - before.clock.absoluteSlot,
      conditionDelta: {
        energy: roundTo(after.condition.energy - before.condition.energy),
        fatigue: roundTo(after.condition.fatigue - before.condition.fatigue),
      },
      statGains: valueDeltas(before.stats, after.stats),
      statXpGains: valueDeltas(before.statXp, after.statXp),
      stimulusDelta: valueDeltas(before.stimulus, after.stimulus),
      moneyDelta: roundTo(afterMoney - beforeMoney),
      nightRecoveries: events.filter(event => event.type === "night-recovery").length,
      xpAward: Math.round(finiteNumber(detail.xpAward, 0, 0, Number.MAX_SAFE_INTEGER)),
      wear: finiteNumber(detail.wear, 0, 0, Number.MAX_SAFE_INTEGER),
      injuryRiskPercent: 0,
      category: detail.category == null ? null : String(detail.category),
      primitive: clone(primitive),
    };
  }

  /** Executes exactly one canonical primitive; every mode delegates here. */
  function executePrimitive(source, primitiveInput, options = {}, rng) {
    const sourceOwnsFinances = Boolean(source && source.finances && typeof source.finances === "object");
    const weekState = createWeekState(source, sourceOwnsFinances ? {} : options.finances || {});
    const primitive = primitiveInput && typeof primitiveInput === "object" ? clone(primitiveInput) : {};
    const before = weekState.timeState;
    const beforeMoney = weekState.finances.money;
    let after;
    let detail = {};

    if (primitive.kind === "training") {
      const context = { ...(options.trainingContext || {}), ...(primitive.context || {}) };
      // Coach selection uses BoxeurTraining's deterministic career fallback.
      // The injected stream is reserved for physical transitions so a resolved
      // quick trace can be replayed exactly by detailed mode.
      const session = primitive.session === "coach" || primitive.session == null
        ? BoxeurTraining.buildCoachSession(before, context)
        : primitive.session;
      const outcome = BoxeurTraining.executeSession(before, session, context, rng);
      after = outcome.timeState;
      detail = {
        label: outcome.result.label,
        xpAward: outcome.result.xpAward,
        wear: outcome.result.wear,
        injuryRiskPercent: outcome.result.injuryRiskPercent,
      };
      primitive.session = clone(outcome.session);
    } else if (primitive.kind === "work") {
      const activity = normalizeWorkActivity({}, { activity: primitive.activity || "work_shift" });
      after = BoxeurTime.performActivity(before, activity, {}, rng);
      weekState.finances.money = roundTo(beforeMoney + finiteNumber(primitive.pay, 0, 0, Number.MAX_SAFE_INTEGER));
      detail.label = activity.label;
      primitive.activity = activity;
    } else if (primitive.kind === "activity") {
      const normalized = normalizeGenericActivityPrimitive(primitive);
      const moneyAfter = beforeMoney + normalized.moneyDelta;
      if (moneyAfter < 0) {
        throw weekError(
          "INSUFFICIENT_FUNDS",
          `Fonds insuffisants pour ${normalized.activity.label}.`,
          { required: Math.abs(normalized.moneyDelta), available: beforeMoney },
        );
      }
      after = BoxeurTime.performActivity(before, normalized.activity, {}, rng);
      weekState.finances.money = roundTo(finiteNumber(
        moneyAfter,
        beforeMoney,
        0,
        Number.MAX_SAFE_INTEGER,
      ));
      detail = normalized.detail;
      Object.assign(primitive, normalized);
      if (normalized.physical) {
        const event = [...(after.history || [])].reverse().find(candidate => (
          candidate.type === "activity-completed"
          && Number(candidate.fromSlot) === Number(before.clock.absoluteSlot)
          && candidate.activityId === normalized.activity.id
        ));
        if (event) {
          event.weekPhysical = true;
          event.weekBudgetKind = "trainingSessions";
        }
      }
    } else if (primitive.kind === "recovery") {
      const outcome = BoxeurRecovery.performAction(before, primitive.actionId || "active_recovery", rng);
      after = outcome.state;
      detail.label = outcome.action.label;
      primitive.actionId = outcome.action.id;
    } else if (primitive.kind === "advance") {
      const periods = boundedInteger(primitive.periods, 1, 1, BoxeurTime.MAX_ADVANCE_PERIODS);
      if (periods === 1) {
        const outcome = BoxeurRecovery.advanceFreePeriod(before, rng);
        after = outcome.state;
        detail.label = outcome.action.label;
      } else {
        after = BoxeurTime.advanceTime(before, periods, rng);
        detail.label = "Temps libre";
      }
      primitive.periods = periods;
    } else if (primitive.kind === "appointment") {
      const appointmentId = String(primitive.appointmentId || "");
      const appointment = before.appointments.find(item => item.id === appointmentId);
      if (!appointment) throw weekError("APPOINTMENT_NOT_FOUND", `Rendez-vous introuvable : ${appointmentId}.`);
      if (isWorkAppointment(appointment) && appointment.activity) {
        normalizeWorkActivity({}, { activity: appointment.activity });
      }
      after = BoxeurTime.attendAppointment(before, appointmentId, rng);
      const metadata = appointment.metadata || {};
      const pay = finiteNumber(
        primitive.pay == null ? (metadata.pay == null ? (metadata.salary == null ? metadata.wage : metadata.salary) : metadata.pay) : primitive.pay,
        0,
        0,
        Number.MAX_SAFE_INTEGER,
      );
      weekState.finances.money = roundTo(beforeMoney + pay);
      detail.label = appointment.title;
      detail.category = isWorkAppointment(appointment) ? "work" : appointmentKind(appointment);
      primitive.pay = roundTo(pay);
      primitive.appointmentKind = appointmentKind(appointment);
    } else {
      throw weekError("UNKNOWN_WEEK_PRIMITIVE", `Primitive de semaine inconnue : ${primitive.kind}.`);
    }

    weekState.timeState = after;
    return {
      weekState,
      state: after,
      timeState: after,
      finances: clone(weekState.finances),
      record: makeRecord(before, after, beforeMoney, weekState.finances.money, primitive, detail),
    };
  }

  function appointmentKind(appointment) {
    return String(appointment && appointment.kind || "appointment").trim().toLowerCase();
  }

  function isWorkAppointment(appointment) {
    const kind = appointmentKind(appointment);
    return kind === "work" || kind === "travail" || (appointment.activity && appointment.activity.category === "work");
  }

  function isImportantAppointment(appointment) {
    const metadata = appointment && appointment.metadata || {};
    if (metadata.important != null) return Boolean(metadata.important);
    if (metadata.requiresDecision === true) return true;
    if (isWorkAppointment(appointment) && metadata.autoSimulate !== false) return false;
    if (metadata.autoSimulate === true) return false;
    const kind = appointmentKind(appointment);
    if (IMPORTANT_KINDS.some(token => kind.includes(token))) return true;
    // Un rendez-vous inconnu reste protégé par défaut. Seul un contrat
    // explicitement auto-simulable peut être consommé sans décision.
    return true;
  }

  function isPhysicalTrainingEvent(event, plan) {
    if (event?.type !== "activity-completed") return false;
    const category = String(event.activityCategory || "");
    const id = String(event.activityId || "");
    const suppliedPhysicalIds = new Set((plan && plan.entries || [])
      .filter(isPhysicalPrimitive)
      .map(entry => String(entry.activity && entry.activity.id || ""))
      .filter(Boolean));
    return event.weekPhysical === true
      || event.weekBudgetKind === "trainingSessions"
      || suppliedPhysicalIds.has(id)
      || [
        "training", "boxing", "boxing-gym-training", "strength", "strength-gym-training",
        "home-training", "private-training", "group-class", "sparring", "fight",
      ].includes(category)
      || id.startsWith("boxing-gym-session:")
      || id.startsWith("strength-gym-session:")
      || id.startsWith("home-session:")
      || id.startsWith("private-trainer:");
  }

  function physicalDayIndex(absoluteSlot, plan) {
    return Math.floor((Number(absoluteSlot) - plan.weekStartSlot) / BoxeurTime.PERIODS_PER_DAY);
  }

  function physicalDaysFromHistory(timeState, plan) {
    return new Set((timeState.history || []).filter(event => (
      isPhysicalTrainingEvent(event, plan)
        && Number(event.fromSlot) >= plan.weekStartSlot
        && Number(event.fromSlot) < timeState.clock.absoluteSlot
    )).map(event => physicalDayIndex(event.fromSlot, plan)));
  }

  function weekHistoryCounts(timeState, plan) {
    const workIds = new Set(plan.entries
      .filter(entry => entry.kind === "work")
      .map(entry => entry.activity.id));
    const counts = { trainingSessions: 0, shortRecoveries: 0, workShifts: 0 };
    (timeState.history || []).forEach(event => {
      if (event.type !== "activity-completed") return;
      if (!Number.isFinite(Number(event.fromSlot))
        || event.fromSlot < plan.weekStartSlot
        || event.fromSlot >= timeState.clock.absoluteSlot) return;
      const id = String(event.activityId || "");
      if (isPhysicalTrainingEvent(event, plan)) counts.trainingSessions += 1;
      else if (["home_active_recovery", "home_nap"].includes(id)) counts.shortRecoveries += 1;
      else if (id === "work_shift" || id.startsWith("work:") || workIds.has(id)) counts.workShifts += 1;
    });
    return counts;
  }

  function aggregateSummary(initial, current, mode, plan, records, usedBefore, status, stop, warnings) {
    const executed = {
      trainingSessions: records.filter(record => budgetKindForPrimitive(record.primitive) === "trainingSessions").length,
      shortRecoveries: records.filter(record => record.kind === "recovery").length,
      workShifts: records.filter(record => record.kind === "work" || (
        record.kind === "appointment" && record.category === "work"
      )).length,
    };
    const remaining = {};
    Object.keys(plan.budget).forEach(key => {
      remaining[key] = Math.max(0, plan.budget[key] - (usedBefore[key] || 0) - (executed[key] || 0));
    });
    return {
      schemaVersion: SCHEMA_VERSION,
      mode,
      status,
      from: clone(initial.timeState.clock),
      to: clone(current.timeState.clock),
      elapsedPeriods: current.timeState.clock.absoluteSlot - initial.timeState.clock.absoluteSlot,
      conditionDelta: {
        energy: roundTo(current.timeState.condition.energy - initial.timeState.condition.energy),
        fatigue: roundTo(current.timeState.condition.fatigue - initial.timeState.condition.fatigue),
      },
      statGains: valueDeltas(initial.timeState.stats, current.timeState.stats),
      statXpGains: valueDeltas(initial.timeState.statXp, current.timeState.statXp),
      stimulusDelta: valueDeltas(initial.timeState.stimulus, current.timeState.stimulus),
      money: {
        before: initial.finances.money,
        earned: roundTo(current.finances.money - initial.finances.money),
        after: current.finances.money,
      },
      xpAward: Math.round(records.reduce((sum, record) => sum + record.xpAward, 0)),
      wear: roundTo(records.reduce((sum, record) => sum + record.wear, 0)),
      maximumSingleActionInjuryRiskPercent: roundTo(Math.max(0, ...records.map(record => record.injuryRiskPercent)), 1),
      nightRecoveries: records.reduce((sum, record) => sum + record.nightRecoveries, 0),
      counts: {
        training: executed.trainingSessions,
        work: executed.workShifts,
        recovery: executed.shortRecoveries,
        freePeriods: records.filter(record => record.kind === "advance").reduce((sum, record) => sum + record.elapsedPeriods, 0),
        appointments: records.filter(record => record.kind === "appointment").length,
      },
      budget: {
        allowed: clone(plan.budget),
        usedBefore: clone(usedBefore),
        executed,
        remaining,
      },
      stoppedBeforeAppointment: stop ? clone(stop) : null,
      warnings: clone(warnings),
      actions: clone(records),
    };
  }

  function actionWouldExceedBudget(primitive, usedBefore, executed, budget) {
    const key = budgetKindForPrimitive(primitive);
    return key && (usedBefore[key] || 0) + (executed[key] || 0) >= (budget[key] || 0);
  }

  function dueAppointment(timeState) {
    return timeState.appointments.find(item => item.startSlot === timeState.clock.absoluteSlot) || null;
  }

  function blockingAppointment(timeState, appointmentId) {
    if (appointmentId) return timeState.appointments.find(item => item.id === appointmentId) || null;
    return timeState.appointments.find(item => item.startSlot >= timeState.clock.absoluteSlot) || null;
  }

  function finalize(initial, current, mode, plan, records, usedBefore, status, stop, warnings) {
    const summary = aggregateSummary(initial, current, mode, plan, records, usedBefore, status, stop, warnings);
    return {
      ok: !["blocked", "invalid-plan", "daily-training-limit"].includes(status),
      mode,
      status,
      weekState: current,
      timeState: current.timeState,
      state: current.timeState,
      finances: clone(current.finances),
      plan: clone(plan),
      summary,
    };
  }

  function runAutomaticWeek(source, config = {}, rng, mode = "quick") {
    const initial = createWeekState(source, config.finances || {});
    let current = createWeekState(initial);
    const plan = resolvePlan(initial, config);
    const usedBefore = weekHistoryCounts(initial.timeState, plan);
    const records = [];
    const warnings = [];
    const processed = new Set();
    const executed = { trainingSessions: 0, shortRecoveries: 0, workShifts: 0 };
    const physicalDays = physicalDaysFromHistory(initial.timeState, plan);
    const recoveryConfig = config.recovery && typeof config.recovery === "object" ? config.recovery : {};
    const recoveryEnergy = finiteNumber(recoveryConfig.energyThreshold, 45, 0, 100);
    const recoveryFatigue = finiteNumber(recoveryConfig.fatigueThreshold, 58, 0, 100);

    while (current.timeState.clock.absoluteSlot < plan.weekEndSlot) {
      const now = current.timeState.clock.absoluteSlot;
      plan.entries.filter(entry => entry.startSlot < now && !processed.has(entry.id)).forEach(entry => {
        processed.add(entry.id);
        warnings.push(`${entry.id} était déjà passé au début de cette simulation.`);
      });

      const appointment = dueAppointment(current.timeState);
      if (appointment) {
        if (isImportantAppointment(appointment) || !isWorkAppointment(appointment)) {
          return finalize(initial, current, mode, plan, records, usedBefore, "appointment", appointment, warnings);
        }
        try {
          const outcome = executePrimitive(current, {
            kind: "appointment",
            appointmentId: appointment.id,
          }, config, rng);
          current = outcome.weekState;
          records.push(outcome.record);
          continue;
        } catch (error) {
          warnings.push(error.message);
          return finalize(initial, current, mode, plan, records, usedBefore, "blocked", appointment, warnings);
        }
      }

      const entry = plan.entries.find(item => item.startSlot === now && !processed.has(item.id));
      if (entry) {
        processed.add(entry.id);
        if (actionWouldExceedBudget(entry, usedBefore, executed, plan.budget)) {
          warnings.push(`${entry.id} ignoré : budget détaillé déjà utilisé.`);
          continue;
        }
        if (isPhysicalPrimitive(entry) && physicalDays.has(physicalDayIndex(now, plan))) {
          warnings.push(`${entry.id} ignoré : une activité physique principale a déjà été faite cette journée.`);
          continue;
        }
        try {
          const outcome = executePrimitive(current, entry, config, rng);
          current = outcome.weekState;
          records.push(outcome.record);
          const budgetKey = budgetKindForPrimitive(entry);
          if (budgetKey) executed[budgetKey] += 1;
          if (isPhysicalPrimitive(entry)) physicalDays.add(physicalDayIndex(now, plan));
          continue;
        } catch (error) {
          const blocked = String(error.code || "").startsWith("APPOINTMENT_")
            ? blockingAppointment(current.timeState, error.details && error.details.appointmentId)
            : null;
          if (blocked) return finalize(initial, current, mode, plan, records, usedBefore, "appointment", blocked, warnings);
          warnings.push(`${entry.id} non exécuté : ${error.message}`);
          if (entry.kind === "work" || error.code === "INSUFFICIENT_FUNDS") {
            return finalize(initial, current, mode, plan, records, usedBefore, "blocked", null, warnings);
          }
        }
      }

      const recoveryNeeded = current.timeState.condition.energy <= recoveryEnergy
        || current.timeState.condition.fatigue >= recoveryFatigue;
      if (recoveryNeeded && (usedBefore.shortRecoveries + executed.shortRecoveries) < plan.budget.shortRecoveries) {
        const actionId = current.timeState.condition.energy <= recoveryEnergy ? "nap" : "active_recovery";
        const availability = BoxeurRecovery.canPerformAction(current.timeState, actionId);
        if (availability.ok) {
          const outcome = executePrimitive(current, {
            id: `recovery-${now}`,
            kind: "recovery",
            actionId,
            budgetKind: "shortRecoveries",
          }, config, rng);
          current = outcome.weekState;
          records.push(outcome.record);
          executed.shortRecoveries += 1;
          continue;
        }
      }

      try {
        const outcome = executePrimitive(current, { kind: "advance", periods: 1 }, config, rng);
        current = outcome.weekState;
        records.push(outcome.record);
      } catch (error) {
        const blocked = String(error.code || "").startsWith("APPOINTMENT_")
          ? blockingAppointment(current.timeState, error.details && error.details.appointmentId)
          : null;
        if (blocked) return finalize(initial, current, mode, plan, records, usedBefore, "appointment", blocked, warnings);
        warnings.push(error.message);
        return finalize(initial, current, mode, plan, records, usedBefore, "blocked", null, warnings);
      }
    }

    return finalize(initial, current, mode, plan, records, usedBefore, "week-complete", null, warnings);
  }

  /**
   * Detailed mode executes only explicitly supplied actions, through the same
   * primitive executor and under the same weekly budget as quick mode.
   */
  function runDetailedWeek(source, config = {}, rng) {
    const initial = createWeekState(source, config.finances || {});
    let current = createWeekState(initial);
    const plan = resolvePlan(initial, config);
    const usedBefore = weekHistoryCounts(initial.timeState, plan);
    const executed = { trainingSessions: 0, shortRecoveries: 0, workShifts: 0 };
    const records = [];
    const warnings = [];
    const actions = Array.isArray(config.actions) ? config.actions : [];
    const physicalDays = physicalDaysFromHistory(initial.timeState, plan);

    for (const action of actions) {
      const due = dueAppointment(current.timeState);
      if (due && action.kind !== "appointment") {
        return finalize(initial, current, "detailed", plan, records, usedBefore, "appointment", due, warnings);
      }
      if (actionWouldExceedBudget(action, usedBefore, executed, plan.budget)) {
        warnings.push(`${action.id || action.kind} refusé : budget détaillé épuisé.`);
        return finalize(initial, current, "detailed", plan, records, usedBefore, "budget-exhausted", null, warnings);
      }
      const actionDay = physicalDayIndex(current.timeState.clock.absoluteSlot, plan);
      if (isPhysicalPrimitive(action) && physicalDays.has(actionDay)) {
        warnings.push(`${action.id || action.kind} refusé : une activité physique principale a déjà été faite cette journée.`);
        return finalize(initial, current, "detailed", plan, records, usedBefore, "daily-training-limit", null, warnings);
      }
      try {
        const outcome = executePrimitive(current, action, config, rng);
        current = outcome.weekState;
        records.push(outcome.record);
        const key = budgetKindForPrimitive(action);
        if (key) executed[key] += 1;
        if (isPhysicalPrimitive(action)) physicalDays.add(actionDay);
      } catch (error) {
        const blocked = String(error.code || "").startsWith("APPOINTMENT_")
          ? blockingAppointment(current.timeState, error.details && error.details.appointmentId)
          : null;
        if (blocked) return finalize(initial, current, "detailed", plan, records, usedBefore, "appointment", blocked, warnings);
        warnings.push(error.message);
        return finalize(initial, current, "detailed", plan, records, usedBefore, "blocked", null, warnings);
      }
    }

    const status = current.timeState.clock.absoluteSlot >= plan.weekEndSlot
      ? "week-complete"
      : "awaiting-manual-action";
    return finalize(initial, current, "detailed", plan, records, usedBefore, status, null, warnings);
  }

  function runQuickWeek(source, config = {}, rng) {
    return runAutomaticWeek(source, config, rng, "quick");
  }

  function runHybridWeek(source, config = {}, rng) {
    return runAutomaticWeek(source, config, rng, "hybrid");
  }

  function runWeek(source, config = {}, rng) {
    const mode = String(config.mode || "quick").toLowerCase();
    if (!MODES.includes(mode)) throw weekError("INVALID_WEEK_MODE", `Mode de semaine inconnu : ${mode}.`);
    if (mode === "detailed") return runDetailedWeek(source, config, rng);
    if (mode === "hybrid") return runHybridWeek(source, config, rng);
    return runQuickWeek(source, config, rng);
  }

  return Object.freeze({
    SCHEMA_VERSION,
    MODES,
    DEFAULT_BUDGET,
    MAX_TRAINING_SESSIONS,
    createWeekState,
    buildWeekPlan,
    isImportantAppointment,
    executePrimitive,
    runDetailedWeek,
    runQuickWeek,
    runHybridWeek,
    runWeek,
  });
});
