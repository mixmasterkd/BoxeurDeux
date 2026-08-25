(function attachBoxeurOnboarding(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurOnboarding = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurOnboardingApi() {
  "use strict";

  /**
   * Pure state machine for the V2 recreational introduction.
   *
   * The engine deliberately owns no DOM, money, training or combat side effect.
   * It only describes the current tutorial step and the gates that adapters must
   * respect. applyEvent returns a new serializable state for every transition.
   */

  const KIND = "boxeur-deux-v2-onboarding";
  const SCHEMA_VERSION = 1;
  const REMY_WEEK = 6;
  const MAX_RECREATIONAL_WEEK = 10;
  const MAX_HISTORY = 100;
  const MODES = Object.freeze(["guided", "exempt", "complete"]);
  const EVENT_TYPES = Object.freeze({
    SELECT_INITIAL_JOB: "select-initial-job",
    DISMISS_JOB_SELECTION: "dismiss-job-selection",
    CANCEL_JOB_SELECTION: "cancel-job-selection",
    LEAVE_JOB: "leave-job",
    PURCHASE_INITIAL_MEMBERSHIP: "purchase-initial-membership",
    EXPIRE_MEMBERSHIP: "expire-membership",
    COMPLETE_OBJECTIVE: "complete-objective",
    COMPLETE_TRAINING_WEEK: "complete-training-week",
    CLOSE_WEEK: "close-week",
    COMPLETE_REMY_SPARRING: "complete-remy-sparring",
    PASS_AMATEUR: "pass-amateur",
  });

  const OBJECTIVES = deepFreeze([
    {
      id: "week-1-first-session", week: 1, locationId: "boxing-gym",
      title: "Faire une première séance",
      detail: "Suis le programme simple du coach pour découvrir le GYM sans devoir tout planifier.",
    },
    {
      id: "week-2-follow-plan", week: 2, locationId: "map",
      title: "Suivre un plan préparé",
      detail: "Le plan rapide conserve ton travail et prépare le cours récréatif avec une journée de repos. Rien ne sera appliqué avant ta confirmation.",
    },
    {
      id: "week-3-training-priority", week: 3, locationId: "map",
      title: "Donner priorité à l’entraînement",
      detail: "Prépare un plan rapide, retire exceptionnellement le travail, puis utilise la capacité libérée pour ajouter un entraînement maison. Tu perdras la paie et recevras une première absence.",
    },
    {
      id: "week-4-roadwork", week: 4, locationId: "home",
      title: "Tester la course et la récupération",
      detail: "Le court jog se choisit dans le menu Course et développe surtout le cardio. Ajoute ensuite une journée de repos pour assimiler le travail.",
    },
    {
      id: "week-5-renew-and-prepare", week: 5, locationId: "boxing-gym",
      title: "Renouveler le GYM et préparer Rémy",
      detail: "Le premier mois est terminé. Renouvelle réellement ton abonnement, puis suis un dernier plan rapide avant le sparring pédagogique de la semaine 6.",
    },
  ]);

  const OBJECTIVE_ALIASES = Object.freeze({
    "week-2-group-class": "week-2-follow-plan",
    "week-3-mitts": "week-3-training-priority",
    "week-4-defense": "week-4-roadwork",
    "week-5-remy-preparation": "week-5-renew-and-prepare",
  });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function onboardingError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details !== undefined) error.details = details;
    return error;
  }

  function boundedInteger(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(number)));
  }

  function cleanId(value) {
    return typeof value === "string" ? value.trim().slice(0, 120) : "";
  }

  function careerFrom(source) {
    if (!source || typeof source !== "object") return {};
    if (source.previewRuntime && source.previewRuntime.career) {
      const legacyEnvelope = source.legacySnapshot && typeof source.legacySnapshot === "object"
        ? source.legacySnapshot
        : {};
      const legacy = legacyEnvelope.state && typeof legacyEnvelope.state === "object"
        ? legacyEnvelope.state
        : legacyEnvelope;
      const phaseStatus = source.phase === "recreational"
        ? "recreational"
        : source.phase === "professional" ? "professional" : source.phase === "amateur" ? "amateur" : null;
      return {
        ...legacy,
        ...source.previewRuntime.career,
        onboardingRequired: source.previewRuntime.career.onboardingRequired === true
          || legacy.onboardingRequired === true
          || legacy.introJobRequired === true
          || legacy.initialGymRequired === true,
        careerStatus: source.previewRuntime.career.careerStatus || phaseStatus || legacy.careerStatus,
        week: source.timeState?.clock?.week ?? source.previewRuntime.career.week ?? legacy.week,
      };
    }
    if (source.state && typeof source.state === "object") return source.state;
    return source;
  }

  function isOnboardingState(value) {
    return Boolean(value && typeof value === "object"
      && value.kind === KIND
      && Number(value.schemaVersion) === SCHEMA_VERSION);
  }

  function isDeveloperSource(source, options) {
    const career = careerFrom(source);
    return options.developerMode === true
      || options.developerProfile === true
      || career.developerMode === true
      || career.isDeveloperProfile === true
      || career.testProfile === true
      || career.profile?.isDeveloper === true
      || career.v2DeveloperTest?.active === true;
  }

  function normalizeCareerStatus(value) {
    if (["recreational", "amateur_pending", "amateur", "professional"].includes(value)) return value;
    return "amateur";
  }

  function normalizeCompletedObjectives(value) {
    const known = new Set(OBJECTIVES.map(objective => objective.id));
    return [...new Set((Array.isArray(value) ? value : [])
      .map(cleanId)
      .map(id => OBJECTIVE_ALIASES[id] || id)
      .filter(id => known.has(id)))];
  }

  function normalizeHistory(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(-MAX_HISTORY).filter(event => event && typeof event === "object").map(event => ({
      id: cleanId(event.id) || "onboarding-event",
      type: cleanId(event.type) || "unknown",
      week: boundedInteger(event.week, 1, 1, 99999),
      ...(cleanId(event.value) ? { value: cleanId(event.value) } : {}),
    }));
  }

  function remyStatusFor(state) {
    if (state.careerStatus === "amateur_pending" || state.remyStatus === "completed") return "completed";
    const prerequisitesMet = state.initialJob.selected && state.initialGym.purchased;
    return state.mode === "guided" && prerequisitesMet && state.week >= state.remyWeek ? "ready" : "training";
  }

  /**
   * Accepts either a raw career snapshot or a prior canonical onboarding state.
   * A raw recreational save is guided only when it carries an explicit initial
   * requirement. This conservative opt-in keeps legacy saves from being trapped.
   */
  function normalizeState(source = {}, options = {}) {
    const canonical = isOnboardingState(source);
    const raw = canonical ? source : careerFrom(source);
    const careerStatus = normalizeCareerStatus(raw.careerStatus);
    const week = boundedInteger(raw.week, 1, 1, 99999);
    const jobId = canonical
      ? cleanId(raw.initialJob && raw.initialJob.currentJobId)
      : cleanId(raw.jobId || raw.v2Job?.id);
    const jobsHeld = canonical
      ? (raw.initialJob && raw.initialJob.selected === true)
      : boundedInteger(raw.jobsHeldCount, jobId ? 1 : 0, 0, 999) > 0;
    const membershipWeeks = boundedInteger(
      canonical ? (raw.initialGym && raw.initialGym.remainingWeeks) : (raw.gymWeeks ?? raw.membership?.weeks),
      0,
      0,
      5200,
    );
    const explicitInitialJobRequirement = canonical
      ? raw.initialJob && raw.initialJob.required === true
      : raw.introJobRequired === true;
    const explicitInitialGymRequirement = canonical
      ? raw.initialGym && raw.initialGym.required === true
      : raw.initialGymRequired === true;
    const freshMarker = canonical
      || raw.onboardingRequired === true
      || explicitInitialJobRequirement
      || explicitInitialGymRequirement;
    const developer = isDeveloperSource(source, options);
    const legacyExempt = options.legacySave === true || raw.onboardingExempt === true;

    let mode;
    let exemptionReason = null;
    if (["amateur", "professional"].includes(careerStatus)) {
      mode = "complete";
    } else if (developer) {
      mode = "exempt";
      exemptionReason = "developer-profile";
    } else if (legacyExempt || (!canonical && careerStatus === "recreational" && !freshMarker)) {
      mode = "exempt";
      exemptionReason = legacyExempt ? "legacy-save" : "legacy-unmarked";
    } else {
      mode = canonical && MODES.includes(raw.mode) ? raw.mode : "guided";
      if (mode === "complete" && careerStatus === "recreational") mode = "guided";
      exemptionReason = mode === "exempt" ? cleanId(raw.exemptionReason) || "explicit" : null;
    }

    const selected = canonical
      ? Boolean(raw.initialJob && raw.initialJob.selected)
      : Boolean(jobId || jobsHeld);
    const purchased = canonical
      ? Boolean(raw.initialGym && raw.initialGym.purchased)
      : membershipWeeks > 0 || raw.initialGymRequired === false;
    const firstWeekClosed = canonical ? raw.firstWeekClosed === true : week > 1;
    const suppliedRemyStatus = canonical ? raw.remyStatus : raw.recreationalSparringStatus;
    const remyCompleted = careerStatus === "amateur_pending" || suppliedRemyStatus === "completed";

    const state = {
      kind: KIND,
      schemaVersion: SCHEMA_VERSION,
      mode,
      exemptionReason,
      careerStatus,
      week,
      remyWeek: boundedInteger(canonical ? raw.remyWeek : options.remyWeek, REMY_WEEK, 1, MAX_RECREATIONAL_WEEK),
      maxRecreationalWeek: boundedInteger(
        canonical ? raw.maxRecreationalWeek : options.maxRecreationalWeek,
        MAX_RECREATIONAL_WEEK,
        REMY_WEEK,
        52,
      ),
      initialJob: {
        required: canonical ? Boolean(raw.initialJob && raw.initialJob.required) : explicitInitialJobRequirement,
        selected,
        currentJobId: jobId || null,
      },
      initialGym: {
        required: canonical ? Boolean(raw.initialGym && raw.initialGym.required) : explicitInitialGymRequirement,
        purchased,
        active: canonical ? Boolean(raw.initialGym && raw.initialGym.active) : membershipWeeks > 0,
        remainingWeeks: membershipWeeks,
      },
      firstWeekClosed,
      trainingWeeks: boundedInteger(
        canonical ? raw.trainingWeeks : raw.recreationalTrainingWeeks,
        0,
        0,
        MAX_RECREATIONAL_WEEK,
      ),
      remyStatus: remyCompleted ? "completed" : suppliedRemyStatus === "ready" ? "ready" : "training",
      completedObjectiveIds: normalizeCompletedObjectives(raw.completedObjectiveIds),
      sequence: boundedInteger(raw.sequence, 0, 0, Number.MAX_SAFE_INTEGER),
      history: normalizeHistory(raw.history),
    };
    state.remyStatus = remyStatusFor(state);
    return state;
  }

  function allowed(reason = "Action disponible.") {
    return { allowed: true, code: "ALLOWED", reason };
  }

  function denied(code, reason) {
    return { allowed: false, code, reason };
  }

  function getGates(source, options = {}) {
    const state = normalizeState(source, options);
    const inactive = state.mode !== "guided";
    if (inactive) {
      const open = allowed(state.mode === "complete" ? "Le tutoriel est terminé." : "Ce profil est exempté du tutoriel bloquant.");
      return {
        tutorialActive: false,
        jobSelection: { required: false, openAllowed: true, dismissAllowed: true, cancelAllowed: true },
        initialMembership: open,
        leaveJob: state.initialJob.currentJobId ? open : denied("NO_ACTIVE_JOB", "Aucun emploi actif."),
        closeWeek: open,
        remySparring: open,
        passAmateur: open,
        fullCalendar: open,
        strengthGym: open,
        fullSparring: open,
        groupClasses: state.careerStatus === "recreational" ? open : denied("AMATEUR_GROUP_CLASS_REMOVED", "Les cours de groupe sont réservés au parcours récréatif."),
      };
    }

    const missingJob = !state.initialJob.selected;
    const missingMembership = !state.initialGym.purchased;
    let closeWeek = allowed("Les obligations du tutoriel sont remplies pour cette semaine.");
    if (missingJob) closeWeek = denied("INITIAL_JOB_REQUIRED", "Choisis ton emploi de départ avant de terminer la semaine 1.");
    else if (missingMembership) closeWeek = denied("INITIAL_MEMBERSHIP_REQUIRED", "Active le premier abonnement au GYM de boxe avant de continuer.");
    else if (state.week >= state.remyWeek && state.remyStatus !== "completed") {
      closeWeek = denied("REMY_SPARRING_REQUIRED", "Le sparring pédagogique de Rémy doit être terminé avant de poursuivre.");
    } else if (state.week >= state.maxRecreationalWeek) {
      closeWeek = denied("AMATEUR_TRANSITION_REQUIRED", "La semaine 10 termine le parcours récréatif : confirme maintenant le passage amateur.");
    }

    const remyReady = !missingJob && !missingMembership
      && state.week >= state.remyWeek
      && state.remyStatus !== "completed";
    const amateurReady = state.remyStatus === "completed" && state.week >= state.remyWeek;
    return {
      tutorialActive: true,
      jobSelection: {
        required: missingJob,
        openAllowed: missingJob,
        dismissAllowed: !missingJob,
        cancelAllowed: !missingJob,
      },
      initialMembership: missingMembership
        ? allowed("Le premier abonnement au GYM de boxe est requis.")
        : denied("INITIAL_MEMBERSHIP_ALREADY_PURCHASED", "Le premier abonnement a déjà été activé."),
      leaveJob: !state.initialJob.currentJobId
        ? denied("NO_ACTIVE_JOB", "Aucun emploi actif.")
        : !state.firstWeekClosed
          ? denied("INITIAL_JOB_LOCKED", "L’emploi de départ est garanti et ne peut pas être quitté avant la clôture de la semaine 1.")
          : allowed("L’emploi peut maintenant être quitté sans réactiver le tutoriel initial."),
      closeWeek,
      remySparring: remyReady
        ? allowed("Rémy « Le Tank » est prêt pour le sparring pédagogique.")
        : state.remyStatus === "completed"
          ? denied("REMY_ALREADY_COMPLETED", "Le sparring pédagogique est déjà terminé.")
          : denied("REMY_NOT_READY", `Rémy est réservé pour la semaine ${state.remyWeek}.`),
      passAmateur: amateurReady
        ? allowed("Le passage amateur est disponible et doit rester une confirmation explicite.")
        : denied("REMY_REQUIRED_FOR_AMATEUR", "Termine d’abord le sparring pédagogique avec Rémy."),
      fullCalendar: denied("AMATEUR_STATUS_REQUIRED", "Le calendrier complet se débloque après la confirmation du passage amateur."),
      strengthGym: denied("AMATEUR_STATUS_REQUIRED", "Le gym de musculation se débloque après la confirmation du passage amateur."),
      fullSparring: denied("AMATEUR_STATUS_REQUIRED", "Le sparring régulier se débloque après le sparring de Rémy et le passage amateur."),
      groupClasses: allowed("Les cours de groupe sont disponibles seulement pendant le parcours récréatif."),
    };
  }

  function objectiveForWeek(state) {
    return OBJECTIVES.find(objective => (
      objective.week === state.week && !state.completedObjectiveIds.includes(objective.id)
    )) || null;
  }

  function getCurrentStep(source, options = {}) {
    const state = normalizeState(source, options);
    const gates = getGates(state);
    if (state.mode === "complete") {
      return { id: "onboarding-complete", type: "complete", title: "Parcours récréatif terminé", detail: "La carrière amateur est maintenant ouverte.", locationId: "map", required: false };
    }
    if (state.mode === "exempt") {
      return { id: "onboarding-exempt", type: "exempt", title: "Tutoriel facultatif", detail: "Cette sauvegarde ou ce profil de test ne sera pas bloqué par l’introduction.", locationId: "map", required: false };
    }
    if (gates.jobSelection.required) {
      return { id: "choose-initial-job", type: "job", title: "Choisir ton emploi de départ", detail: "Ce choix est obligatoire pour la semaine 1. La fenêtre reste ouverte jusqu’à la sélection.", locationId: "work", required: true };
    }
    if (!state.initialGym.purchased) {
      return { id: "purchase-initial-membership", type: "membership", title: "T’inscrire au GYM de boxe", detail: "Ton budget initial protège le prix du premier mois.", locationId: "boxing-gym", required: true };
    }
    if (state.week >= state.remyWeek && state.remyStatus !== "completed") {
      return { id: "remy-sparring", type: "sparring", title: "Sparring avec Rémy « Le Tank »", detail: "Une évaluation pédagogique interactive, sans gagnant ni défaite au bilan.", locationId: "boxing-gym", required: true };
    }
    if (state.remyStatus === "completed") {
      const required = state.week >= state.maxRecreationalWeek;
      return {
        id: "pass-amateur", type: "transition", title: "Passer amateur",
        detail: required
          ? "La semaine 10 est terminée : confirme le passage amateur pour poursuivre."
          : `Tu peux confirmer maintenant ou continuer le parcours récréatif jusqu’à la semaine ${state.maxRecreationalWeek}.`,
        locationId: "boxing-gym", required,
      };
    }
    const objective = objectiveForWeek(state);
    if (objective) return { ...clone(objective), type: "objective", required: false };
    return { id: "finish-guided-week", type: "week", title: "Terminer la semaine", detail: "Les repères importants sont acquis; le reste de la semaine peut être simulé.", locationId: "map", required: false };
  }

  function gateForEvent(state, event) {
    const gates = getGates(state);
    switch (event.type) {
      case EVENT_TYPES.SELECT_INITIAL_JOB:
        if (state.mode !== "guided") return allowed();
        if (state.initialJob.selected) return denied("INITIAL_JOB_ALREADY_SELECTED", "L’emploi de départ a déjà été choisi.");
        return cleanId(event.jobId || event.value)
          ? allowed()
          : denied("INVALID_JOB_ID", "Un emploi de départ valide est requis.");
      case EVENT_TYPES.DISMISS_JOB_SELECTION:
        return gates.jobSelection.dismissAllowed ? allowed() : denied("INITIAL_JOB_DIALOG_LOCKED", "La fenêtre ne peut pas être fermée avant le choix d’un emploi.");
      case EVENT_TYPES.CANCEL_JOB_SELECTION:
        return gates.jobSelection.cancelAllowed ? allowed() : denied("INITIAL_JOB_CANNOT_BE_CANCELLED", "Le choix de l’emploi de départ ne peut pas être annulé.");
      case EVENT_TYPES.LEAVE_JOB: return gates.leaveJob;
      case EVENT_TYPES.PURCHASE_INITIAL_MEMBERSHIP:
        return state.initialGym.purchased ? denied("INITIAL_MEMBERSHIP_ALREADY_PURCHASED", "Le premier abonnement a déjà été activé.") : allowed();
      case EVENT_TYPES.EXPIRE_MEMBERSHIP:
        return state.initialGym.active ? allowed() : denied("MEMBERSHIP_ALREADY_INACTIVE", "L’abonnement est déjà inactif.");
      case EVENT_TYPES.COMPLETE_OBJECTIVE: {
        const objective = objectiveForWeek(state);
        if (!objective) return denied("NO_CURRENT_OBJECTIVE", "Aucun objectif guidé n’est actif cette semaine.");
        return cleanId(event.objectiveId || event.value) === objective.id
          ? allowed()
          : denied("OBJECTIVE_MISMATCH", "Seul l’objectif guidé de la semaine courante peut être validé.");
      }
      case EVENT_TYPES.COMPLETE_TRAINING_WEEK: return allowed();
      case EVENT_TYPES.CLOSE_WEEK: return gates.closeWeek;
      case EVENT_TYPES.COMPLETE_REMY_SPARRING: return gates.remySparring;
      case EVENT_TYPES.PASS_AMATEUR: return gates.passAmateur;
      default: return denied("UNKNOWN_ONBOARDING_EVENT", `Événement de tutoriel inconnu : ${event.type || "vide"}.`);
    }
  }

  function canApplyEvent(source, eventInput, options = {}) {
    const state = normalizeState(source, options);
    const event = typeof eventInput === "string" ? { type: eventInput } : eventInput && typeof eventInput === "object" ? eventInput : {};
    return gateForEvent(state, event);
  }

  function appendHistory(state, type, value) {
    state.sequence += 1;
    state.history.push({
      id: `onboarding-event-${state.sequence}`,
      type,
      week: state.week,
      ...(cleanId(value) ? { value: cleanId(value) } : {}),
    });
    if (state.history.length > MAX_HISTORY) state.history.splice(0, state.history.length - MAX_HISTORY);
  }

  /** Applies one validated transition without mutating the received state. */
  function applyEvent(source, eventInput, options = {}) {
    const current = normalizeState(source, options);
    const event = typeof eventInput === "string" ? { type: eventInput } : eventInput && typeof eventInput === "object" ? eventInput : {};
    const check = gateForEvent(current, event);
    if (!check.allowed) throw onboardingError(check.code, check.reason, { eventType: event.type || null });
    const next = clone(current);

    switch (event.type) {
      case EVENT_TYPES.SELECT_INITIAL_JOB: {
        const jobId = cleanId(event.jobId || event.value);
        next.initialJob.selected = true;
        next.initialJob.currentJobId = jobId;
        appendHistory(next, event.type, jobId);
        break;
      }
      case EVENT_TYPES.DISMISS_JOB_SELECTION:
      case EVENT_TYPES.CANCEL_JOB_SELECTION:
        return next;
      case EVENT_TYPES.LEAVE_JOB:
        appendHistory(next, event.type, next.initialJob.currentJobId);
        next.initialJob.currentJobId = null;
        break;
      case EVENT_TYPES.PURCHASE_INITIAL_MEMBERSHIP:
        next.initialGym.purchased = true;
        next.initialGym.active = true;
        next.initialGym.remainingWeeks = boundedInteger(event.weeks, 4, 1, 5200);
        appendHistory(next, event.type, String(next.initialGym.remainingWeeks));
        break;
      case EVENT_TYPES.EXPIRE_MEMBERSHIP:
        next.initialGym.active = false;
        next.initialGym.remainingWeeks = 0;
        appendHistory(next, event.type);
        break;
      case EVENT_TYPES.COMPLETE_OBJECTIVE: {
        const objectiveId = cleanId(event.objectiveId || event.value);
        next.completedObjectiveIds.push(objectiveId);
        appendHistory(next, event.type, objectiveId);
        break;
      }
      case EVENT_TYPES.COMPLETE_TRAINING_WEEK:
        next.trainingWeeks = Math.min(next.maxRecreationalWeek, next.trainingWeeks + 1);
        appendHistory(next, event.type);
        break;
      case EVENT_TYPES.CLOSE_WEEK:
        appendHistory(next, event.type);
        if (next.week === 1) next.firstWeekClosed = true;
        next.week += 1;
        break;
      case EVENT_TYPES.COMPLETE_REMY_SPARRING:
        next.remyStatus = "completed";
        appendHistory(next, event.type);
        break;
      case EVENT_TYPES.PASS_AMATEUR:
        next.careerStatus = "amateur";
        next.mode = "complete";
        next.exemptionReason = null;
        appendHistory(next, event.type);
        break;
      default:
        break;
    }

    next.remyStatus = remyStatusFor(next);
    return normalizeState(next);
  }

  return Object.freeze({
    KIND,
    SCHEMA_VERSION,
    REMY_WEEK,
    MAX_RECREATIONAL_WEEK,
    MODES,
    EVENT_TYPES,
    OBJECTIVES,
    isOnboardingState,
    normalizeState,
    getCurrentStep,
    getGates,
    canApplyEvent,
    applyEvent,
  });
});
