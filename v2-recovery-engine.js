(function attachBoxeurRecovery(root, factory) {
  let timeApi = root && root.BoxeurTime;
  if (!timeApi && typeof module === "object" && module.exports && typeof require === "function") {
    timeApi = require("./career-time-engine.js");
  }
  const api = factory(timeApi);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurRecovery = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurRecoveryApi(BoxeurTime) {
  "use strict";

  if (!BoxeurTime || typeof BoxeurTime.advanceTime !== "function" || typeof BoxeurTime.performActivity !== "function") {
    throw new Error("BoxeurRecovery requiert BoxeurTime.");
  }

  const SCHEMA_VERSION = 1;
  const REST_THRESHOLD = Object.freeze({ energy: 96, fatigue: 4 });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function roundTo(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function createError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details !== undefined) error.details = details;
    return error;
  }

  const ZERO_STIMULUS = Object.freeze({ technique: 0, power: 0, cardio: 0, defense: 0 });

  const ACTIONS = deepFreeze({
    active_recovery: {
      id: "active_recovery",
      label: "Récupération active",
      description: "Bouger doucement, s'étirer et faire redescendre la fatigue.",
      kind: "activity",
      activity: {
        id: "home_active_recovery",
        label: "Récupération active à la maison",
        category: "recovery",
        duration: 1,
        energyCost: 0,
        energyGain: 10,
        fatigueGain: 0,
        fatigueRelief: 5,
        stimulus: ZERO_STIMULUS,
      },
    },
    nap: {
      id: "nap",
      label: "Faire une sieste",
      description: "Refaire rapidement le plein d'énergie sans remplacer une vraie nuit.",
      kind: "activity",
      activity: {
        id: "home_nap",
        label: "Sieste à la maison",
        category: "recovery",
        duration: 1,
        energyCost: 0,
        energyGain: 16,
        fatigueGain: 0,
        fatigueRelief: 2,
        stimulus: ZERO_STIMULUS,
      },
    },
    sleep_until_morning: {
      id: "sleep_until_morning",
      label: "Journée de repos",
      description: "Libérer le reste de la journée; la récupération de nuit est appliquée automatiquement.",
      kind: "sleep",
    },
    advance_free_period: {
      id: "advance_free_period",
      label: "Passer une période libre",
      description: "Laisser le temps avancer sans activité et sans gain immédiat.",
      kind: "advance",
      duration: 1,
    },
  });

  function assertState(state) {
    // BoxeurTime demeure l'autorité sur la forme et les bornes de l'état.
    BoxeurTime.getPublicState(state);
  }

  function resolveAction(actionId) {
    const id = String(actionId == null ? "" : actionId);
    const action = ACTIONS[id];
    if (!action) throw createError("UNKNOWN_RECOVERY_ACTION", `Action de récupération inconnue : ${id}.`);
    return action;
  }

  function periodsUntilNextMorning(state) {
    assertState(state);
    return BoxeurTime.PERIODS_PER_DAY - state.clock.periodIndex;
  }

  function isShortRecoveryUseful(state) {
    assertState(state);
    return !(
      state.condition.energy >= REST_THRESHOLD.energy
      && state.condition.fatigue <= REST_THRESHOLD.fatigue
    );
  }

  function actionDuration(state, action) {
    if (action.kind === "sleep") return periodsUntilNextMorning(state);
    if (action.kind === "activity") return action.activity.duration;
    return action.duration;
  }

  /**
   * Non-throwing validation for buttons at home. It delegates appointment
   * conflicts to BoxeurTime so home actions and gym actions obey one calendar.
   */
  function canPerformAction(state, actionId) {
    try {
      assertState(state);
      const action = resolveAction(actionId);
      const duration = actionDuration(state, action);

      if (action.kind === "activity" && !isShortRecoveryUseful(state)) {
        return {
          ok: false,
          code: "RECOVERY_NOT_NEEDED",
          reason: "Tu es déjà reposé. Avance le temps ou va faire une activité utile.",
          duration,
        };
      }

      if (action.kind === "activity") {
        const check = BoxeurTime.canPerformActivity(state, action.activity);
        if (!check.ok) return { ...check, duration };
      } else {
        // Cette prévisualisation est pure. La valeur fixe évite aussi de faire
        // avancer la source aléatoire injectable avant la vraie transition.
        BoxeurTime.advanceTime(state, duration, () => 0.5);
      }

      return { ok: true, action: clone(action), duration };
    } catch (error) {
      return {
        ok: false,
        code: error.code || "INVALID_RECOVERY_ACTION",
        reason: error.message,
      };
    }
  }

  function sumNightValues(events, field) {
    return BoxeurTime.STAT_KEYS.reduce((totals, key) => {
      totals[key] = roundTo(events.reduce((sum, event) => sum + Number((event[field] || {})[key] || 0), 0));
      return totals;
    }, {});
  }

  function statDeltas(before, after) {
    return BoxeurTime.STAT_KEYS.reduce((deltas, key) => {
      deltas[key] = roundTo(after[key] - before[key]);
      return deltas;
    }, {});
  }

  function recoveryAdvice(state, action, nightCount) {
    const preparation = BoxeurTime.getPreparation(state);
    const stimulusLoad = BoxeurTime.STAT_KEYS.reduce((sum, key) => sum + state.stimulus[key], 0);

    if (state.condition.fatigue >= 65) {
      return "Ta fatigue persistante reste élevée : évite une séance dure et vise une vraie nuit de sommeil.";
    }
    if (state.condition.energy <= 35) {
      return "Ton énergie demeure basse : garde la prochaine période légère.";
    }
    if (stimulusLoad > 0 && nightCount === 0) {
      return "Ton entraînement est encore à assimiler; une nuit de sommeil transformera ce stimulus en progression.";
    }
    if (preparation.score >= 80) {
      return "Ta préparation est excellente; inutile d'empiler d'autres récupérations courtes.";
    }
    if (action.id === "nap") {
      return "La sieste redonne surtout de l'énergie; la fatigue persistante demande encore du sommeil ou une récupération active.";
    }
    if (action.id === "active_recovery") {
      return "La récupération active réduit surtout la fatigue; elle ne remplace pas une nuit pour assimiler l'entraînement.";
    }
    return "Ta récupération progresse; choisis la prochaine activité selon ton énergie et ta fatigue persistante.";
  }

  function historyEventSequence(event) {
    const match = /^time-event-(\d+)$/.exec(String(event && event.id || ""));
    return match ? Number(match[1]) : null;
  }

  /**
   * BoxeurTime keeps only its 500 most recent events. Comparing array lengths
   * therefore fails as soon as a transition appends an event while dropping an
   * older one. Sequence-backed ids remain monotonic across that truncation.
   */
  function eventsAddedAfter(source, next) {
    const sourceSequence = Number(source.sequence);
    const knownIds = new Set((source.history || []).map(event => String(event && event.id || "")));
    return (next.history || []).filter(event => {
      const eventSequence = historyEventSequence(event);
      if (Number.isFinite(sourceSequence) && eventSequence !== null) return eventSequence > sourceSequence;
      return !knownIds.has(String(event && event.id || ""));
    });
  }

  function buildResult(source, next, action, duration) {
    const newEvents = eventsAddedAfter(source, next);
    const nightEvents = newEvents.filter(event => event.type === "night-recovery");
    const assimilated = sumNightValues(nightEvents, "assimilated");
    const gains = sumNightValues(nightEvents, "statGains");
    const deltas = {
      energy: roundTo(next.condition.energy - source.condition.energy),
      fatigue: roundTo(next.condition.fatigue - source.condition.fatigue),
      stats: statDeltas(source.stats, next.stats),
      stimulus: statDeltas(source.stimulus, next.stimulus),
    };
    const advice = recoveryAdvice(next, action, nightEvents.length);
    const periodWord = duration === 1 ? "période" : "périodes";
    const summary = `${action.label} : ${duration} ${periodWord} écoulée${duration === 1 ? "" : "s"}.`;

    return {
      ok: true,
      action: { id: action.id, label: action.label },
      state: next,
      elapsedPeriods: duration,
      from: clone(source.clock),
      to: clone(next.clock),
      nightCount: nightEvents.length,
      deltas,
      assimilated,
      stimulusAssimilated: clone(assimilated),
      statGains: gains,
      advice,
      ui: {
        title: action.label,
        summary,
        deltas: clone(deltas),
        stimulusAssimilated: clone(assimilated),
        advice,
      },
    };
  }

  /** Runs one home transition and returns both its new state and UI summary. */
  function performAction(state, actionId, rng) {
    assertState(state);
    const action = resolveAction(actionId);
    const check = canPerformAction(state, action.id);
    if (!check.ok) throw createError(check.code, check.reason, check.appointmentId ? { appointmentId: check.appointmentId } : undefined);

    let next;
    if (action.kind === "activity") {
      next = BoxeurTime.performActivity(state, action.activity, {}, rng);
    } else {
      next = BoxeurTime.advanceTime(state, check.duration, rng);
    }
    return buildResult(state, next, action, check.duration);
  }

  function activeRecovery(state, rng) {
    return performAction(state, "active_recovery", rng);
  }

  function takeNap(state, rng) {
    return performAction(state, "nap", rng);
  }

  function sleepUntilNextMorning(state, rng) {
    return performAction(state, "sleep_until_morning", rng);
  }

  function advanceFreePeriod(state, rng) {
    return performAction(state, "advance_free_period", rng);
  }

  function getActions(state) {
    assertState(state);
    return Object.values(ACTIONS).map(action => {
      const availability = canPerformAction(state, action.id);
      return {
        id: action.id,
        label: action.label,
        description: action.description,
        duration: availability.duration || actionDuration(state, action),
        available: availability.ok,
        disabledReason: availability.ok ? null : availability.reason,
      };
    });
  }

  return Object.freeze({
    SCHEMA_VERSION,
    REST_THRESHOLD,
    ACTIONS,
    periodsUntilNextMorning,
    isShortRecoveryUseful,
    canPerformAction,
    getActions,
    performAction,
    activeRecovery,
    takeNap,
    sleepUntilNextMorning,
    advanceFreePeriod,
  });
});
