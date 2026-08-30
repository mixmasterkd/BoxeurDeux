(function attachBoxeurTime(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurTime = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurTimeApi() {
  "use strict";

  /**
   * BoxeurTime is the deterministic clock used by the current career interface.
   *
   * Public transitions are pure: they return a new serializable state and never
   * mutate the state received by the caller. A week contains 21 fixed periods
   * (Monday to Sunday, morning/afternoon/evening). Every playable activity must
   * consume at least one period, so training or recovery can never be repeated
   * for free in the same instant.
   *
   * Minimal integration flow:
   *   let state = BoxeurTime.createState({ seed: "career-1" });
   *   state = BoxeurTime.performActivity(state, "jump_rope");
   *   state = BoxeurTime.scheduleAppointment(state, { ... });
   *   state = BoxeurTime.advanceToNextAppointment(state);
   *   state = BoxeurTime.attendAppointment(state, "coach-1");
   *
   * An injected RNG may be passed as the last argument of advanceTime,
   * performActivity or attendAppointment. Without one, the RNG state embedded in
   * the career state makes save/reload and automated simulations reproducible.
   */

  const SCHEMA_VERSION = 2;
  const STAT_XP_VERSION = 1;
  const DAYS = Object.freeze(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
  const DAY_LABELS = Object.freeze(["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]);
  const PERIODS = Object.freeze(["morning", "afternoon", "evening"]);
  const PERIOD_LABELS = Object.freeze(["Matin", "Après-midi", "Soir"]);
  const STAT_KEYS = Object.freeze(["technique", "power", "cardio", "defense"]);
  const PERIODS_PER_DAY = PERIODS.length;
  const PERIODS_PER_WEEK = DAYS.length * PERIODS_PER_DAY;
  const MAX_ACTIVITY_DURATION = PERIODS_PER_WEEK;
  const MAX_ADVANCE_PERIODS = PERIODS_PER_WEEK * 52;
  const MAX_RECURRENCES = 52;
  const MAX_APPOINTMENT_HORIZON = PERIODS_PER_WEEK * 260;
  const MAX_HISTORY = 500;
  // Conservé uniquement pour convertir les anciennes sauvegardes qui stockaient
  // une fraction de statistique. La progression active utilise maintenant de
  // l'XP entière et cumulative.
  const STAT_GAIN_SCALE = 0.024;
  const STAT_XP_FIRST_THRESHOLD = 40;
  const STAT_XP_THRESHOLD_STEP = 10;

  const DAY_ALIASES = Object.freeze({
    monday: 0, lundi: 0,
    tuesday: 1, mardi: 1,
    wednesday: 2, mercredi: 2,
    thursday: 3, jeudi: 3,
    friday: 4, vendredi: 4,
    saturday: 5, samedi: 5,
    sunday: 6, dimanche: 6,
  });

  const PERIOD_ALIASES = Object.freeze({
    morning: 0, matin: 0,
    afternoon: 1, "après-midi": 1, "apres-midi": 1, apresmidi: 1,
    evening: 2, soir: 2, soirée: 2, soiree: 2,
  });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  // Presets are conveniences for the future gym scene. Custom activities use
  // the exact same shape and can be supplied by data files or private coaches.
  const ACTIVITY_PRESETS = deepFreeze({
    recovery: {
      id: "recovery", label: "Récupération", category: "recovery", duration: 1,
      energyCost: 0, energyGain: 14, fatigueGain: 0, fatigueRelief: 3,
      stimulus: { technique: 0, power: 0, cardio: 0, defense: 0 },
    },
    jump_rope: {
      id: "jump_rope", label: "Corde à danser", category: "training", duration: 1,
      energyCost: 10, energyGain: 0, fatigueGain: 6, fatigueRelief: 0,
      stimulus: { technique: 0, power: 0, cardio: 5, defense: 0 },
    },
    shadow_boxing: {
      id: "shadow_boxing", label: "Shadow-boxing", category: "training", duration: 1,
      energyCost: 8, energyGain: 0, fatigueGain: 4, fatigueRelief: 0,
      stimulus: { technique: 4, power: 0, cardio: 0, defense: 2 },
    },
    heavy_bag: {
      id: "heavy_bag", label: "Sac lourd", category: "training", duration: 1,
      energyCost: 14, energyGain: 0, fatigueGain: 9, fatigueRelief: 0,
      stimulus: { technique: 2, power: 6, cardio: 0, defense: 0 },
    },
    mitts: {
      id: "mitts", label: "Travail aux mitaines", category: "training", duration: 1,
      energyCost: 12, energyGain: 0, fatigueGain: 7, fatigueRelief: 0,
      stimulus: { technique: 6, power: 0, cardio: 0, defense: 2 },
    },
    technical_sparring: {
      id: "technical_sparring", label: "Sparring technique", category: "training", duration: 1,
      energyCost: 16, energyGain: 0, fatigueGain: 11, fatigueRelief: 0,
      stimulus: { technique: 4, power: 0, cardio: 2, defense: 5 },
    },
    strength_training: {
      id: "strength_training", label: "Musculation", category: "training", duration: 1,
      energyCost: 15, energyGain: 0, fatigueGain: 12, fatigueRelief: 0,
      stimulus: { technique: 0, power: 5, cardio: 1, defense: 0 },
    },
    work_shift: {
      id: "work_shift", label: "Quart de travail", category: "work", duration: 2,
      energyCost: 10, energyGain: 0, fatigueGain: 8, fatigueRelief: 0,
      stimulus: { technique: 0, power: 0, cardio: 0, defense: 0 },
    },
  });

  function createError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details !== undefined) error.details = details;
    return error;
  }

  function clamp(value, min = 0, max = 100) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, number));
  }

  function roundTo(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeKey(value) {
    return String(value == null ? "" : value).trim().toLocaleLowerCase("fr-CA");
  }

  function hashSeed(seed) {
    const text = String(seed == null ? "boxeur-time" : seed);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0 || 0x6d2b79f5;
  }

  /** Creates a reproducible random function that can also be injected in tests. */
  function createSeededRng(seed) {
    let rngState = hashSeed(seed);
    const random = function seededRandom() {
      rngState = (rngState + 0x6d2b79f5) >>> 0;
      let value = rngState;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    random.getState = () => rngState >>> 0;
    random.setState = value => { rngState = Number(value) >>> 0; };
    return random;
  }

  function nextRandom(state, injectedRng) {
    let value;
    if (typeof injectedRng === "function") {
      value = injectedRng();
    } else if (injectedRng && typeof injectedRng.next === "function") {
      const next = injectedRng.next();
      value = typeof next === "number" ? next : next && next.value;
    } else {
      state.rngState = (state.rngState + 0x6d2b79f5) >>> 0;
      let mixed = state.rngState;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      value = ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    }
    if (injectedRng && typeof injectedRng.getState === "function") {
      state.rngState = Number(injectedRng.getState()) >>> 0;
    }
    state.randomCounter += 1;
    return clamp(value, 0, 0.9999999999999999);
  }

  function resolveDayIndex(value) {
    if (Number.isInteger(value) && value >= 0 && value < DAYS.length) return value;
    const result = DAY_ALIASES[normalizeKey(value)];
    if (result === undefined) throw createError("INVALID_DAY", `Jour invalide : ${value}.`);
    return result;
  }

  function resolvePeriodIndex(value) {
    if (Number.isInteger(value) && value >= 0 && value < PERIODS.length) return value;
    const result = PERIOD_ALIASES[normalizeKey(value)];
    if (result === undefined) throw createError("INVALID_PERIOD", `Période invalide : ${value}.`);
    return result;
  }

  /** Converts { week, day, period } to the stable integer stored by the engine. */
  function toAbsoluteSlot(time) {
    if (Number.isInteger(time)) {
      if (time < 0) throw createError("INVALID_TIME", "La période absolue ne peut pas être négative.");
      return time;
    }
    if (!time || typeof time !== "object") throw createError("INVALID_TIME", "Une date de carrière est requise.");
    const week = Number(time.week == null ? 1 : time.week);
    if (!Number.isInteger(week) || week < 1) throw createError("INVALID_WEEK", "La semaine doit être un entier positif.");
    const dayIndex = resolveDayIndex(time.dayIndex == null ? time.day : time.dayIndex);
    const periodIndex = resolvePeriodIndex(time.periodIndex == null ? time.period : time.periodIndex);
    return (week - 1) * PERIODS_PER_WEEK + dayIndex * PERIODS_PER_DAY + periodIndex;
  }

  /** Converts an absolute slot back to labels usable directly by the interface. */
  function fromAbsoluteSlot(absoluteSlot) {
    const slot = Number(absoluteSlot);
    if (!Number.isInteger(slot) || slot < 0) throw createError("INVALID_TIME", "La période absolue doit être un entier positif ou nul.");
    const week = Math.floor(slot / PERIODS_PER_WEEK) + 1;
    const withinWeek = slot % PERIODS_PER_WEEK;
    const dayIndex = Math.floor(withinWeek / PERIODS_PER_DAY);
    const periodIndex = withinWeek % PERIODS_PER_DAY;
    return {
      absoluteSlot: slot,
      week,
      day: DAYS[dayIndex],
      dayIndex,
      dayLabel: DAY_LABELS[dayIndex],
      period: PERIODS[periodIndex],
      periodIndex,
      periodLabel: PERIOD_LABELS[periodIndex],
    };
  }

  function normalizeStats(source, fallback = 20) {
    const input = source && typeof source === "object" ? source : {};
    return STAT_KEYS.reduce((result, key) => {
      result[key] = roundTo(clamp(input[key] == null ? fallback : input[key]));
      return result;
    }, {});
  }

  function normalizeIntegerVector(source, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
    const input = source && typeof source === "object" ? source : {};
    return STAT_KEYS.reduce((result, key) => {
      result[key] = Math.round(clamp(input[key] == null ? fallback : input[key], 0, max));
      return result;
    }, {});
  }

  /** Cumulative target: 40, 90, 150, 220... */
  function statXpForRank(rankInput) {
    const rank = Math.max(0, Math.trunc(Number(rankInput) || 0));
    const steps = rank + 1;
    return steps * STAT_XP_FIRST_THRESHOLD
      + (STAT_XP_THRESHOLD_STEP * rank * steps) / 2;
  }

  function rankForStatXp(xpInput) {
    const xp = Math.max(0, Math.round(Number(xpInput) || 0));
    let rank = 0;
    while (rank < 1000 && xp >= statXpForRank(rank)) rank += 1;
    return rank;
  }

  function normalizeCondition(source) {
    const input = source && typeof source === "object" ? source : {};
    return {
      energy: roundTo(clamp(input.energy == null ? 80 : input.energy)),
      fatigue: roundTo(clamp(input.fatigue == null ? 10 : input.fatigue)),
    };
  }

  function appendHistory(state, event) {
    state.sequence += 1;
    state.history.push({ id: `time-event-${state.sequence}`, ...event });
    if (state.history.length > MAX_HISTORY) state.history.splice(0, state.history.length - MAX_HISTORY);
  }

  function assertState(state) {
    if (!state || typeof state !== "object" || !state.clock || !state.condition || !state.stats || !state.stimulus
      || !state.statXp || !state.statXpRanks || state.statXpVersion !== STAT_XP_VERSION) {
      throw createError("INVALID_STATE", "État BoxeurTime invalide.");
    }
  }

  function statXpProgress(state, key) {
    if (!STAT_KEYS.includes(key)) throw createError("INVALID_STAT", `Statistique inconnue : ${key}.`);
    assertState(state);
    const rank = state.statXpRanks[key];
    const total = state.statXp[key];
    const currentFloor = rank === 0 ? 0 : statXpForRank(rank - 1);
    const nextThreshold = statXpForRank(rank);
    return {
      total,
      rank,
      currentFloor,
      nextThreshold,
      remaining: Math.max(0, nextThreshold - total),
      pendingXp: state.stimulus[key],
    };
  }

  /** Adds the cumulative integer-XP fields to a pre-XP BoxeurTime save. */
  function upgradeState(stateInput) {
    if (!stateInput || typeof stateInput !== "object" || !stateInput.clock || !stateInput.condition
      || !stateInput.stats || !stateInput.stimulus) {
      throw createError("INVALID_STATE", "État BoxeurTime invalide.");
    }
    const next = clone(stateInput);
    const alreadyCurrent = next.statXpVersion === STAT_XP_VERSION && next.statXp && next.statXpRanks;
    const originalStats = normalizeStats(next.stats, 20);
    next.schemaVersion = SCHEMA_VERSION;
    next.statXpVersion = STAT_XP_VERSION;
    next.stats = STAT_KEYS.reduce((result, key) => {
      result[key] = Math.floor(originalStats[key]);
      return result;
    }, {});

    if (alreadyCurrent) {
      next.statXp = normalizeIntegerVector(next.statXp, 0);
      next.statXpRanks = normalizeIntegerVector(next.statXpRanks, 0, 1000);
      next.stimulus = normalizeIntegerVector(next.stimulus, 0, 100);
      return next;
    }

    next.statXp = {};
    next.statXpRanks = {};
    const convertedPending = {};
    STAT_KEYS.forEach(key => {
      const fractionalProgress = originalStats[key] - Math.floor(originalStats[key]);
      next.statXp[key] = Math.min(
        STAT_XP_FIRST_THRESHOLD - 1,
        Math.max(0, Math.round(fractionalProgress * STAT_XP_FIRST_THRESHOLD)),
      );
      next.statXpRanks[key] = 0;
      const legacyStimulus = clamp(next.stimulus[key], 0, 100);
      const diminishingReturn = clamp(1 - originalStats[key] / 120, 0.08, 1);
      const equivalentXp = Math.round(legacyStimulus * diminishingReturn * STAT_GAIN_SCALE * STAT_XP_FIRST_THRESHOLD);
      convertedPending[key] = legacyStimulus > 0 ? Math.max(1, equivalentXp) : 0;
    });
    next.stimulus = convertedPending;
    return next;
  }

  /**
   * Creates a serializable career state. All physical and boxing values are
   * normalized to 0-100 so imported saves cannot corrupt later calculations.
   */
  function createState(config = {}) {
    const start = config.clock || config.time || {
      week: config.week == null ? 1 : config.week,
      day: config.day == null ? "monday" : config.day,
      period: config.period == null ? "morning" : config.period,
    };
    const absoluteSlot = config.absoluteSlot == null ? toAbsoluteSlot(start) : toAbsoluteSlot(config.absoluteSlot);
    const seed = String(config.seed == null ? "boxeur-time" : config.seed);
    const suppliedStats = normalizeStats(config.stats, 20);
    const suppliedXp = config.statXp && typeof config.statXp === "object" ? config.statXp : null;
    const suppliedRanks = config.statXpRanks && typeof config.statXpRanks === "object" ? config.statXpRanks : null;
    const stats = {};
    const statXp = {};
    const statXpRanks = {};
    STAT_KEYS.forEach(key => {
      stats[key] = Math.floor(suppliedStats[key]);
      statXp[key] = suppliedXp
        ? Math.round(clamp(suppliedXp[key], 0, Number.MAX_SAFE_INTEGER))
        : Math.min(STAT_XP_FIRST_THRESHOLD - 1, Math.max(0, Math.round((suppliedStats[key] - stats[key]) * STAT_XP_FIRST_THRESHOLD)));
      statXpRanks[key] = suppliedRanks
        ? Math.round(clamp(suppliedRanks[key], 0, 1000))
        : suppliedXp ? rankForStatXp(statXp[key]) : 0;
    });
    let state = {
      schemaVersion: SCHEMA_VERSION,
      statXpVersion: STAT_XP_VERSION,
      seed,
      rngState: hashSeed(seed),
      randomCounter: 0,
      clock: fromAbsoluteSlot(absoluteSlot),
      condition: normalizeCondition(config.condition),
      stats,
      statXp,
      statXpRanks,
      stimulus: normalizeIntegerVector(config.stimulus, 0, 100),
      appointments: [],
      completedAppointments: [],
      history: [],
      sequence: 0,
    };

    const appointments = Array.isArray(config.appointments) ? config.appointments : [];
    appointments.forEach(appointment => {
      state = scheduleAppointment(state, appointment);
    });
    return state;
  }

  function normalizeActivity(activity) {
    const source = typeof activity === "string" ? ACTIVITY_PRESETS[activity] : activity;
    if (!source || typeof source !== "object") {
      throw createError("UNKNOWN_ACTIVITY", `Activité inconnue : ${activity}.`);
    }
    const duration = Number(source.duration == null ? 1 : source.duration);
    if (!Number.isInteger(duration) || duration < 1 || duration > MAX_ACTIVITY_DURATION) {
      throw createError(
        "INVALID_ACTIVITY_DURATION",
        `Une activité doit durer de 1 à ${MAX_ACTIVITY_DURATION} périodes.`,
      );
    }
    const id = String(source.id == null ? "custom_activity" : source.id).trim();
    if (!id) throw createError("INVALID_ACTIVITY_ID", "Une activité doit avoir un identifiant.");
    return {
      id,
      label: String(source.label == null ? id : source.label),
      category: String(source.category == null ? "other" : source.category),
      duration,
      energyCost: roundTo(clamp(source.energyCost)),
      energyGain: roundTo(clamp(source.energyGain)),
      fatigueGain: roundTo(clamp(source.fatigueGain)),
      fatigueRelief: roundTo(clamp(source.fatigueRelief)),
      stimulus: normalizeIntegerVector(source.stimulus, 0, 100),
    };
  }

  function activitiesMatch(reserved, attempted) {
    if (!reserved || !attempted) return reserved === attempted;
    return reserved.id === attempted.id
      && reserved.duration === attempted.duration
      && reserved.energyCost === attempted.energyCost
      && reserved.energyGain === attempted.energyGain
      && reserved.fatigueGain === attempted.fatigueGain
      && reserved.fatigueRelief === attempted.fatigueRelief
      && STAT_KEYS.every(key => reserved.stimulus[key] === attempted.stimulus[key]);
  }

  function intervalsOverlap(firstStart, firstEnd, secondStart, secondEnd) {
    return firstStart < secondEnd && secondStart < firstEnd;
  }

  function findAppointment(state, appointmentId) {
    return state.appointments.find(appointment => appointment.id === appointmentId);
  }

  function normalizeAppointment(state, input, forcedId) {
    if (!input || typeof input !== "object") throw createError("INVALID_APPOINTMENT", "Un rendez-vous est requis.");
    const activity = input.activity == null ? null : normalizeActivity(input.activity);
    const startSlot = input.startSlot == null ? toAbsoluteSlot(input.start) : toAbsoluteSlot(input.startSlot);
    const duration = Number(input.duration == null ? (activity ? activity.duration : 1) : input.duration);
    if (!Number.isInteger(duration) || duration < 1 || duration > MAX_ACTIVITY_DURATION) {
      throw createError(
        "INVALID_APPOINTMENT_DURATION",
        `Un rendez-vous doit durer de 1 à ${MAX_ACTIVITY_DURATION} périodes.`,
      );
    }
    if (activity && activity.duration !== duration) {
      throw createError(
        "APPOINTMENT_DURATION_MISMATCH",
        "La durée réservée doit correspondre à la durée de l'activité.",
      );
    }
    if (startSlot < state.clock.absoluteSlot) {
      throw createError("APPOINTMENT_IN_PAST", "Un rendez-vous ne peut pas être placé dans le passé.");
    }
    if (startSlot - state.clock.absoluteSlot > MAX_APPOINTMENT_HORIZON) {
      throw createError("APPOINTMENT_TOO_FAR", "Le rendez-vous dépasse l'horizon de planification permis.");
    }
    const id = String(forcedId || input.id || `appointment-${state.sequence + 1}`).trim();
    if (!id) throw createError("INVALID_APPOINTMENT_ID", "Un rendez-vous doit avoir un identifiant.");
    if (state.appointments.some(appointment => appointment.id === id)
      || state.completedAppointments.some(appointment => appointment.id === id)) {
      throw createError("DUPLICATE_APPOINTMENT", `Le rendez-vous ${id} existe déjà.`);
    }
    const endSlot = startSlot + duration;
    const conflict = state.appointments.find(appointment => (
      intervalsOverlap(startSlot, endSlot, appointment.startSlot, appointment.endSlot)
    ));
    if (conflict) {
      throw createError("APPOINTMENT_OVERLAP", `Le rendez-vous chevauche ${conflict.title}.`, { conflictId: conflict.id });
    }
    return {
      id,
      title: String(input.title == null ? (activity ? activity.label : "Rendez-vous") : input.title),
      kind: String(input.kind == null ? "appointment" : input.kind),
      location: input.location == null ? null : String(input.location),
      startSlot,
      endSlot,
      duration,
      activity,
      metadata: input.metadata && typeof input.metadata === "object" ? clone(input.metadata) : {},
    };
  }

  /** Returns a non-throwing preview suitable for disabling an interface button. */
  function canScheduleAppointment(state, input) {
    try {
      assertState(state);
      const appointment = normalizeAppointment(state, input);
      return { ok: true, appointment: clone(appointment) };
    } catch (error) {
      return { ok: false, code: error.code || "INVALID_APPOINTMENT", reason: error.message };
    }
  }

  /** Adds one appointment and rejects any past date, duplicate id or overlap. */
  function scheduleAppointment(state, input) {
    assertState(state);
    const next = clone(state);
    const appointment = normalizeAppointment(next, input);
    next.appointments.push(appointment);
    next.appointments.sort((left, right) => left.startSlot - right.startSlot || left.id.localeCompare(right.id));
    appendHistory(next, {
      type: "appointment-scheduled",
      appointmentId: appointment.id,
      at: state.clock.absoluteSlot,
      startSlot: appointment.startSlot,
      duration: appointment.duration,
    });
    return next;
  }

  /**
   * Atomically schedules a finite recurrence. Count is deliberately capped: an
   * accidental Infinity or unbounded UI loop can never fill a career save.
   */
  function scheduleRecurringAppointments(state, template, recurrence = {}) {
    assertState(state);
    const count = Number(recurrence.count);
    const every = Number(recurrence.every);
    if (!Number.isInteger(count) || count < 1 || count > MAX_RECURRENCES) {
      throw createError("INVALID_RECURRENCE", `Une récurrence doit contenir de 1 à ${MAX_RECURRENCES} rendez-vous.`);
    }
    if (!Number.isInteger(every) || every < 1 || every > MAX_ADVANCE_PERIODS) {
      throw createError("INVALID_RECURRENCE", "L'intervalle de récurrence doit être fini et positif.");
    }
    const firstStart = template.startSlot == null ? toAbsoluteSlot(template.start) : toAbsoluteSlot(template.startSlot);
    const baseId = String(template.id || `recurring-${state.sequence + 1}`);
    let next = clone(state);
    for (let index = 0; index < count; index += 1) {
      next = scheduleAppointment(next, {
        ...template,
        id: `${baseId}-${index + 1}`,
        startSlot: firstStart + every * index,
      });
    }
    return next;
  }

  /** Cancels a future appointment; completed appointments remain auditable. */
  function cancelAppointment(state, appointmentId) {
    assertState(state);
    const next = clone(state);
    const index = next.appointments.findIndex(appointment => appointment.id === appointmentId);
    if (index < 0) throw createError("APPOINTMENT_NOT_FOUND", `Rendez-vous introuvable : ${appointmentId}.`);
    const [appointment] = next.appointments.splice(index, 1);
    appendHistory(next, {
      type: "appointment-cancelled",
      appointmentId: appointment.id,
      at: next.clock.absoluteSlot,
    });
    return next;
  }

  /** Returns the sorted agenda with friendly start/end labels for rendering. */
  function getAgenda(state, options = {}) {
    assertState(state);
    const fromSlot = options.fromSlot == null ? state.clock.absoluteSlot : toAbsoluteSlot(options.fromSlot);
    const toSlot = options.toSlot == null ? Number.POSITIVE_INFINITY : toAbsoluteSlot(options.toSlot);
    return state.appointments
      .filter(appointment => appointment.endSlot > fromSlot && appointment.startSlot < toSlot)
      .map(appointment => ({
        ...clone(appointment),
        start: fromAbsoluteSlot(appointment.startSlot),
        end: fromAbsoluteSlot(appointment.endSlot),
      }));
  }

  function preparationFrom(state) {
    const stimulusLoad = STAT_KEYS.reduce((sum, key) => sum + state.stimulus[key], 0) / STAT_KEYS.length;
    const score = roundTo(clamp(
      state.condition.energy * 0.5
      + (100 - state.condition.fatigue) * 0.4
      + (100 - stimulusLoad) * 0.1,
    ), 1);
    let status = "critical";
    let label = "Épuisée";
    if (score >= 80) {
      status = "excellent";
      label = "Excellente";
    } else if (score >= 65) {
      status = "good";
      label = "Bonne";
    } else if (score >= 45) {
      status = "fair";
      label = "Correcte";
    } else if (score >= 25) {
      status = "fragile";
      label = "Fragile";
    }
    const reasons = [];
    if (state.condition.energy < 35) reasons.push("Énergie basse");
    if (state.condition.fatigue > 65) reasons.push("Fatigue persistante élevée");
    if (stimulusLoad > 50) reasons.push("Beaucoup d’XP ciblée en attente");
    if (!reasons.length && score >= 65) reasons.push("XP ciblée bien assimilée");
    if (!reasons.length) reasons.push("Récupération à surveiller");
    return { score, status, label, reasons, stimulusLoad: roundTo(stimulusLoad, 1) };
  }

  /** Derives a readable preparation diagnosis; it is not a fifth stored gauge. */
  function getPreparation(state) {
    assertState(state);
    return preparationFrom(state);
  }

  function applyNightRecoveryMutable(state, rng, nightSlot, recoveryQuality = 1) {
    const before = {
      condition: clone(state.condition),
      stats: clone(state.stats),
      statXp: clone(state.statXp),
      statXpRanks: clone(state.statXpRanks),
      stimulus: clone(state.stimulus),
    };
    const qualityModifier = clamp(recoveryQuality == null ? 1 : recoveryQuality, 0.75, 1.25);
    const quality = (0.92 + nextRandom(state, rng) * 0.16) * qualityModifier;
    const energyGain = (24 - state.condition.fatigue * 0.05) * quality;
    const fatigueRelief = (9 + state.condition.energy * 0.015) * quality;
    state.condition.energy = roundTo(clamp(state.condition.energy + energyGain));
    state.condition.fatigue = roundTo(clamp(state.condition.fatigue - fatigueRelief));

    const recoveryCapacity = clamp(
      (state.condition.energy / 100) * 0.35 + ((100 - state.condition.fatigue) / 100) * 0.65,
      0.2,
      1,
    );
    const assimilationRate = clamp(0.28 * quality * recoveryCapacity, 0.08, 0.32);
    const assimilated = {};
    const statXpGains = {};
    const statGains = {};
    STAT_KEYS.forEach(key => {
      const beforeStat = state.stats[key];
      const pendingXp = state.stimulus[key];
      const processedXp = pendingXp > 0
        ? Math.min(pendingXp, Math.max(1, Math.round(pendingXp * assimilationRate)))
        : 0;
      state.stimulus[key] -= processedXp;
      state.statXp[key] += processedXp;
      while (state.stats[key] < 99 && state.statXp[key] >= statXpForRank(state.statXpRanks[key])) {
        state.stats[key] += 1;
        state.statXpRanks[key] += 1;
      }
      assimilated[key] = processedXp;
      statXpGains[key] = processedXp;
      statGains[key] = state.stats[key] - beforeStat;
    });
    appendHistory(state, {
      type: "night-recovery",
      at: nightSlot,
      quality: roundTo(quality, 3),
      qualityModifier: roundTo(qualityModifier, 3),
      before,
      after: {
        condition: clone(state.condition),
        stats: clone(state.stats),
        statXp: clone(state.statXp),
        statXpRanks: clone(state.statXpRanks),
        stimulus: clone(state.stimulus),
      },
      assimilated,
      statXpGains,
      statGains,
    });
  }

  function advanceClockMutable(state, periods, rng, recoveryQuality = 1) {
    for (let index = 0; index < periods; index += 1) {
      const leavingPeriod = state.clock.periodIndex;
      state.clock = fromAbsoluteSlot(state.clock.absoluteSlot + 1);
      if (leavingPeriod === PERIODS.length - 1) {
        applyNightRecoveryMutable(state, rng, state.clock.absoluteSlot, recoveryQuality);
      }
    }
  }

  function validatePeriodCount(periods) {
    const count = Number(periods);
    if (!Number.isInteger(count) || count < 1 || count > MAX_ADVANCE_PERIODS) {
      throw createError(
        "INVALID_ADVANCE",
        `Le temps doit avancer de 1 à ${MAX_ADVANCE_PERIODS} périodes par transition.`,
      );
    }
    return count;
  }

  function firstBlockingAppointment(state, startSlot, endSlot, ignoredAppointmentId) {
    return state.appointments.find(appointment => (
      appointment.id !== ignoredAppointmentId
      && intervalsOverlap(startSlot, endSlot, appointment.startSlot, appointment.endSlot)
    ));
  }

  /** Advances empty time, applying one recovery/assimilation pass per crossed night. */
  function advanceTime(state, periods = 1, rng) {
    assertState(state);
    const count = validatePeriodCount(periods);
    const startSlot = state.clock.absoluteSlot;
    const endSlot = startSlot + count;
    const missed = state.appointments.find(appointment => appointment.startSlot < startSlot);
    if (missed) {
      throw createError("APPOINTMENT_MISSED", `${missed.title} doit être réglé avant d'avancer.`, { appointmentId: missed.id });
    }
    const blocking = firstBlockingAppointment(state, startSlot, endSlot);
    if (blocking) {
      throw createError("APPOINTMENT_BLOCKS_TIME", `${blocking.title} bloque cette avance.`, { appointmentId: blocking.id });
    }
    const next = clone(state);
    advanceClockMutable(next, count, rng);
    appendHistory(next, { type: "time-advanced", fromSlot: startSlot, toSlot: endSlot });
    return next;
  }

  function activityPreview(state, activity) {
    const immediate = {
      energy: roundTo(clamp(state.condition.energy - activity.energyCost + activity.energyGain)),
      fatigue: roundTo(clamp(state.condition.fatigue + activity.fatigueGain - activity.fatigueRelief)),
    };
    const stimulus = STAT_KEYS.reduce((result, key) => {
      result[key] = Math.round(clamp(state.stimulus[key] + activity.stimulus[key]));
      return result;
    }, {});
    return { immediate, stimulus };
  }

  /** Non-throwing activity check used by the gym's quick and custom session UI. */
  function canPerformActivity(state, activityInput, options = {}) {
    try {
      assertState(state);
      const activity = normalizeActivity(activityInput);
      const appointmentId = options && options.appointmentId;
      const startSlot = state.clock.absoluteSlot;
      const endSlot = startSlot + activity.duration;
      if (activity.energyCost > state.condition.energy) {
        return { ok: false, code: "INSUFFICIENT_ENERGY", reason: "Énergie insuffisante pour cette activité." };
      }
      if (appointmentId) {
        const appointment = findAppointment(state, appointmentId);
        if (!appointment) return { ok: false, code: "APPOINTMENT_NOT_FOUND", reason: "Rendez-vous introuvable." };
        if (appointment.startSlot !== startSlot) {
          return { ok: false, code: "APPOINTMENT_NOT_DUE", reason: "Ce rendez-vous n'est pas prévu maintenant." };
        }
        if (appointment.activity && !activitiesMatch(appointment.activity, activity)) {
          return {
            ok: false,
            code: "APPOINTMENT_ACTIVITY_MISMATCH",
            reason: "L'activité choisie ne correspond pas à celle réservée.",
            appointmentId: appointment.id,
          };
        }
        if (appointment.duration !== activity.duration) {
          return { ok: false, code: "APPOINTMENT_DURATION_MISMATCH", reason: "L'activité ne correspond pas à la durée réservée." };
        }
      }
      const blocking = firstBlockingAppointment(state, startSlot, endSlot, appointmentId);
      if (blocking) {
        return {
          ok: false,
          code: "APPOINTMENT_BLOCKS_ACTIVITY",
          reason: `${blocking.title} chevauche cette activité.`,
          appointmentId: blocking.id,
        };
      }
      return {
        ok: true,
        activity,
        start: fromAbsoluteSlot(startSlot),
        end: fromAbsoluteSlot(endSlot),
        ...activityPreview(state, activity),
      };
    } catch (error) {
      return { ok: false, code: error.code || "INVALID_ACTIVITY", reason: error.message };
    }
  }

  /**
   * Performs an activity now. Costs, fatigue and stimulus are applied immediately;
   * elapsed nights then recover energy and assimilate part of the pending stimulus.
   */
  function performActivity(state, activityInput, options = {}, rng) {
    assertState(state);
    const check = canPerformActivity(state, activityInput, options);
    if (!check.ok) throw createError(check.code, check.reason, check.appointmentId ? { appointmentId: check.appointmentId } : undefined);
    const next = clone(state);
    const before = {
      condition: clone(next.condition),
      stimulus: clone(next.stimulus),
      statXp: clone(next.statXp),
      preparation: preparationFrom(next),
    };
    next.condition = clone(check.immediate);
    next.stimulus = clone(check.stimulus);
    const afterImmediate = {
      condition: clone(next.condition),
      stimulus: clone(next.stimulus),
      statXp: clone(next.statXp),
    };
    const startSlot = next.clock.absoluteSlot;
    advanceClockMutable(next, check.activity.duration, rng, options && options.recoveryQuality);

    if (options && options.appointmentId) {
      const index = next.appointments.findIndex(appointment => appointment.id === options.appointmentId);
      const [appointment] = next.appointments.splice(index, 1);
      next.completedAppointments.push({
        ...appointment,
        completedAt: next.clock.absoluteSlot,
      });
    }

    appendHistory(next, {
      type: "activity-completed",
      activityId: check.activity.id,
      activityCategory: check.activity.category,
      appointmentId: options && options.appointmentId ? options.appointmentId : null,
      fromSlot: startSlot,
      toSlot: next.clock.absoluteSlot,
      before,
      afterImmediate,
      after: {
        condition: clone(next.condition),
        stimulus: clone(next.stimulus),
        statXp: clone(next.statXp),
        preparation: preparationFrom(next),
      },
    });
    return next;
  }

  /** Attends the appointment currently due and executes its reserved activity. */
  function attendAppointment(state, appointmentId, rng) {
    assertState(state);
    const appointment = findAppointment(state, appointmentId);
    if (!appointment) throw createError("APPOINTMENT_NOT_FOUND", `Rendez-vous introuvable : ${appointmentId}.`);
    if (appointment.startSlot < state.clock.absoluteSlot) {
      throw createError("APPOINTMENT_MISSED", `${appointment.title} est déjà passé.`);
    }
    if (appointment.startSlot > state.clock.absoluteSlot) {
      throw createError("APPOINTMENT_NOT_DUE", `${appointment.title} n'est pas encore commencé.`);
    }
    const activity = appointment.activity || {
      id: `appointment:${appointment.id}`,
      label: appointment.title,
      category: appointment.kind,
      duration: appointment.duration,
    };
    return performActivity(state, activity, { appointmentId }, rng);
  }

  /** Advances exactly to the next appointment without silently skipping one. */
  function advanceToNextAppointment(state, rng) {
    assertState(state);
    const appointment = state.appointments
      .filter(item => item.startSlot >= state.clock.absoluteSlot)
      .sort((left, right) => left.startSlot - right.startSlot)[0];
    if (!appointment) throw createError("NO_UPCOMING_APPOINTMENT", "Aucun rendez-vous à venir.");
    const periods = appointment.startSlot - state.clock.absoluteSlot;
    return periods === 0 ? clone(state) : advanceTime(state, periods, rng);
  }

  /** Lightweight snapshot for renderers; all returned values remain serializable. */
  function getPublicState(state) {
    assertState(state);
    return {
      schemaVersion: state.schemaVersion,
      clock: clone(state.clock),
      condition: clone(state.condition),
      stats: clone(state.stats),
      statXp: clone(state.statXp),
      statXpRanks: clone(state.statXpRanks),
      statXpProgress: Object.fromEntries(STAT_KEYS.map(key => [key, statXpProgress(state, key)])),
      stimulus: clone(state.stimulus),
      preparation: preparationFrom(state),
      agenda: getAgenda(state),
    };
  }

  return Object.freeze({
    SCHEMA_VERSION,
    STAT_XP_VERSION,
    STAT_XP_FIRST_THRESHOLD,
    STAT_XP_THRESHOLD_STEP,
    DAYS,
    DAY_LABELS,
    PERIODS,
    PERIOD_LABELS,
    STAT_KEYS,
    PERIODS_PER_DAY,
    PERIODS_PER_WEEK,
    MAX_ACTIVITY_DURATION,
    MAX_ADVANCE_PERIODS,
    MAX_RECURRENCES,
    STAT_GAIN_SCALE,
    ACTIVITY_PRESETS,
    createSeededRng,
    createState,
    upgradeState,
    statXpForRank,
    statXpProgress,
    toAbsoluteSlot,
    fromAbsoluteSlot,
    normalizeActivity,
    getPreparation,
    getAgenda,
    getPublicState,
    canScheduleAppointment,
    scheduleAppointment,
    scheduleRecurringAppointments,
    cancelAppointment,
    canPerformActivity,
    performActivity,
    attendAppointment,
    advanceTime,
    advanceToNextAppointment,
  });
});
