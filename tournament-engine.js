(function exposeTournamentEngine(root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurTournament = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createTournamentEngine() {
  "use strict";

  const SCHEMA_VERSION = 1;
  const SUPPORTED_LENGTHS = Object.freeze([3, 5]);
  const PHASES = Object.freeze({
    PREPARING: "preparing",
    DAILY_CHECK: "daily_check",
    READY: "ready",
    IN_BOUT: "in_bout",
    INTER_BOUT: "inter_bout",
    COMPLETED: "completed",
    ELIMINATED: "eliminated",
    WITHDRAWN: "withdrawn",
  });
  const CHOICE_IDS = Object.freeze({
    REST: "rest",
    PROTECT: "protect",
    SCOUT: "scout",
  });

  const VALID_PHASES = new Set(Object.values(PHASES));
  const VALID_MEDICAL_STATUSES = new Set(["unchecked", "fit", "fit_with_warning", "unfit"]);
  const VALID_CHOICES = new Set(Object.values(CHOICE_IDS));

  class TournamentError extends Error {
    constructor(code, message) {
      super(message);
      this.name = "TournamentError";
      this.code = code;
    }
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
  }

  function finiteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function boundedNumber(value, fallback, min = 0, max = 100) {
    return clamp(finiteNumber(value, fallback), min, max);
  }

  function boundedInteger(value, fallback, min, max) {
    return Math.round(boundedNumber(value, fallback, min, max));
  }

  function safeText(value, fallback = "", maxLength = 120) {
    return typeof value === "string" && value.trim()
      ? value.trim().slice(0, maxLength)
      : fallback;
  }

  function normalizeLength(value) {
    const total = Math.round(finiteNumber(value, NaN));
    if (!SUPPORTED_LENGTHS.includes(total)) {
      throw new TournamentError("UNSUPPORTED_LENGTH", "Un tournoi doit comporter exactement 3 ou 5 combats.");
    }
    return total;
  }

  function normalizeCondition(source = {}, fallback = {}) {
    const base = fallback || {};
    return {
      energy: Math.round(boundedNumber(source.energy, finiteNumber(base.energy, 72))),
      fatigue: Math.round(boundedNumber(source.fatigue, finiteNumber(base.fatigue, 0))),
      injury: Math.round(boundedNumber(source.injury, finiteNumber(base.injury, 0))),
      fitness: Math.round(boundedNumber(source.fitness, finiteNumber(base.fitness, 50))),
      cardio: Math.round(boundedNumber(source.cardio, finiteNumber(base.cardio, 50), 0, 99)),
      headDamage: Math.round(boundedNumber(source.headDamage, finiteNumber(base.headDamage, 0))),
      bodyDamage: Math.round(boundedNumber(source.bodyDamage, finiteNumber(base.bodyDamage, 0))),
      lucidity: Math.round(boundedNumber(source.lucidity, finiteNumber(base.lucidity, 100))),
    };
  }

  function normalizeWeight(source = {}, fallback = {}) {
    const raw = source && typeof source === "object" ? source : {};
    const base = fallback && typeof fallback === "object" ? fallback : {};
    const minCandidate = finiteNumber(raw.minKg, finiteNumber(base.minKg, NaN));
    const maxCandidate = finiteNumber(raw.maxKg, finiteNumber(base.maxKg, NaN));
    const minKg = Number.isFinite(minCandidate) && minCandidate > 0 ? minCandidate : null;
    const maxKg = Number.isFinite(maxCandidate) && maxCandidate > 0 ? maxCandidate : null;
    const toleranceKg = boundedNumber(raw.toleranceKg, finiteNumber(base.toleranceKg, 0), 0, 1);
    const historySource = Array.isArray(raw.history) ? raw.history : Array.isArray(base.history) ? base.history : [];

    return {
      className: safeText(raw.className, safeText(base.className, "Catégorie du tournoi", 80), 80),
      minKg,
      maxKg,
      toleranceKg,
      last: raw.last && typeof raw.last === "object" ? clone(raw.last) : base.last ? clone(base.last) : null,
      history: historySource.slice(-10).map(item => clone(item)),
    };
  }

  function normalizeMedical(source = {}) {
    const status = VALID_MEDICAL_STATUSES.has(source?.status) ? source.status : "unchecked";
    return {
      status,
      day: boundedInteger(source?.day, 0, 0, 5),
      reasons: Array.isArray(source?.reasons) ? source.reasons.map(reason => safeText(reason, "", 80)).filter(Boolean).slice(0, 8) : [],
    };
  }

  function normalizeMedicalFlags(source = {}) {
    return {
      restrictionDays: boundedInteger(source?.restrictionDays, 0, 0, 365),
      acuteInjury: Boolean(source?.acuteInjury),
      knockedOut: Boolean(source?.knockedOut),
      doctorStatus: VALID_MEDICAL_STATUSES.has(source?.doctorStatus) && source.doctorStatus !== "unchecked"
        ? source.doctorStatus
        : null,
    };
  }

  function normalizeResult(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (["win", "victory", "victoire"].includes(normalized)) return "win";
    if (["loss", "defeat", "défaite", "defaite"].includes(normalized)) return "loss";
    if (["draw", "match nul", "nul"].includes(normalized)) {
      throw new TournamentError("DRAW_NOT_ALLOWED", "Un combat amateur de tournoi doit désigner un vainqueur.");
    }
    throw new TournamentError("INVALID_RESULT", "Le résultat doit être une victoire ou une défaite.");
  }

  function createTournament(options = {}) {
    const totalBouts = normalizeLength(options.totalBouts);
    const condition = normalizeCondition(options.condition);
    const entryCondition = normalizeCondition(options.entryCondition || condition, condition);

    return {
      schemaVersion: SCHEMA_VERSION,
      id: safeText(options.id, "tournament", 100),
      totalBouts,
      day: 1,
      wins: 0,
      boutsFought: 0,
      phase: options.started === false ? PHASES.PREPARING : PHASES.DAILY_CHECK,
      entryCondition,
      condition,
      weight: normalizeWeight(options.weight),
      medical: normalizeMedical(),
      pendingMedical: null,
      currentBout: null,
      interBout: null,
      activeEffects: [],
      results: [],
      history: [],
      appliedRecoveryIds: [],
      lastBoutDay: null,
      lastRecoveryId: null,
      termination: null,
      migration: null,
    };
  }

  function normalizeStoredResult(result, index) {
    const rawResult = String(result?.result || "").toLowerCase();
    const type = /victoire|win/.test(rawResult)
      ? "win"
      : /défaite|defaite|loss/.test(rawResult)
        ? "loss"
        : /nul|draw/.test(rawResult)
          ? "legacy_draw"
          : "unknown";
    return {
      bout: boundedInteger(result?.bout ?? result?.round, index + 1, 1, 5),
      day: boundedInteger(result?.day, index + 1, 1, 5),
      result: type,
      method: safeText(result?.method, "points", 40),
      score: safeText(result?.score, "", 60),
      opponent: safeText(result?.opponent, "Adversaire", 80),
    };
  }

  function inferLength(raw, context) {
    const candidates = [
      raw?.totalBouts,
      raw?.rounds,
      Array.isArray(raw?.opponents) ? raw.opponents.length : null,
      context?.totalBouts,
    ];
    for (const candidate of candidates) {
      const number = Math.round(finiteNumber(candidate, NaN));
      if (SUPPORTED_LENGTHS.includes(number)) return number;
    }
    throw new TournamentError("UNSUPPORTED_LENGTH", "La sauvegarde ne permet pas d’identifier un tournoi de 3 ou 5 combats.");
  }

  function normalizeTournament(raw = {}, context = {}) {
    const totalBouts = inferLength(raw, context);
    const isCurrentSchema = raw?.schemaVersion === SCHEMA_VERSION;
    const fallbackCondition = context.condition || {};
    const condition = normalizeCondition(raw.condition || fallbackCondition, fallbackCondition);
    const entryCondition = normalizeCondition(raw.entryCondition || context.entryCondition || condition, condition);
    const results = Array.isArray(raw.results) ? raw.results.slice(0, totalBouts).map(normalizeStoredResult) : [];
    const wins = boundedInteger(raw.wins ?? raw.completedBouts ?? raw.currentRound, results.filter(item => item.result === "win").length, 0, totalBouts);
    const boutsFought = boundedInteger(raw.boutsFought, Math.max(wins, results.length), 0, totalBouts);
    let phase = VALID_PHASES.has(raw.phase) ? raw.phase : PHASES.DAILY_CHECK;

    if (!isCurrentSchema) {
      if (raw.status === "completed" || wins >= totalBouts) phase = PHASES.COMPLETED;
      else if (raw.status === "preparing" && wins === 0 && context.started === false) phase = PHASES.PREPARING;
      else phase = PHASES.DAILY_CHECK;
    }

    const day = boundedInteger(raw.day, Math.min(totalBouts, wins + 1), 1, totalBouts);
    const appliedRecoveryIds = Array.isArray(raw.appliedRecoveryIds)
      ? [...new Set(raw.appliedRecoveryIds.map(id => safeText(id, "", 160)).filter(Boolean))].slice(-10)
      : [];
    let interBout = isCurrentSchema && raw.interBout && typeof raw.interBout === "object" ? clone(raw.interBout) : null;

    if (phase === PHASES.INTER_BOUT && !interBout) {
      interBout = {
        id: `${safeText(raw.id, "tournament", 100)}:bout-${wins}:day-${day}`,
        afterBout: wins,
        recoveryApplied: false,
        medicalFlags: normalizeMedicalFlags(),
      };
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      id: safeText(raw.id, safeText(context.id, "tournament", 100), 100),
      totalBouts,
      day,
      wins,
      boutsFought,
      phase,
      entryCondition,
      condition,
      weight: normalizeWeight(raw.weight || context.weight, context.weight),
      medical: normalizeMedical(raw.medical),
      pendingMedical: raw.pendingMedical ? normalizeMedicalFlags(raw.pendingMedical) : null,
      currentBout: isCurrentSchema && raw.currentBout ? clone(raw.currentBout) : null,
      interBout,
      activeEffects: Array.isArray(raw.activeEffects) ? raw.activeEffects.map(item => clone(item)).slice(-6) : [],
      results,
      history: Array.isArray(raw.history) ? raw.history.map(item => clone(item)).slice(-30) : [],
      appliedRecoveryIds,
      lastBoutDay: raw.lastBoutDay == null ? null : boundedInteger(raw.lastBoutDay, null, 1, totalBouts),
      lastRecoveryId: safeText(raw.lastRecoveryId, "", 160) || null,
      termination: raw.termination && typeof raw.termination === "object" ? clone(raw.termination) : null,
      migration: isCurrentSchema ? (raw.migration ? clone(raw.migration) : null) : {
        from: "legacy",
        legacyRecoveryAssumedApplied: wins > 0,
      },
    };
  }

  function migrateLegacyTournament(raw, context = {}) {
    return normalizeTournament(raw, context);
  }

  function activateTournament(rawState) {
    const state = normalizeTournament(rawState);
    if (state.phase !== PHASES.PREPARING) return state;
    state.phase = PHASES.DAILY_CHECK;
    state.history.push({ type: "tournament_started", day: state.day });
    return state;
  }

  function recoveryTarget(condition) {
    const current = normalizeCondition(condition);
    // La cible représente la disponibilité du lendemain, pas une guérison complète.
    return clamp(Math.round(
      82
      + (current.cardio - 50) * 0.18
      + (current.fitness - 50) * 0.08
      - Math.max(0, current.fatigue - 40) * 0.10
      - Math.max(0, current.injury - 45) * 0.08
    ), 62, 90);
  }

  function baseOvernightRecovery(condition, entryCondition) {
    const current = normalizeCondition(condition);
    const entry = normalizeCondition(entryCondition, current);
    const target = recoveryTarget(current);

    return {
      target,
      condition: normalizeCondition({
        ...current,
        energy: Math.round(current.energy + (target - current.energy) * 0.70),
        fatigue: Math.round(entry.fatigue + (current.fatigue - entry.fatigue) * 0.30),
        headDamage: Math.round(current.headDamage * 0.30),
        bodyDamage: Math.round(current.bodyDamage * 0.40),
        lucidity: Math.max(75, Math.round(current.lucidity + 25)),
      }, current),
    };
  }

  function preferredProtectionZone(condition, requestedZone) {
    if (requestedZone === "head" || requestedZone === "body") return requestedZone;
    return condition.headDamage > condition.bodyDamage ? "head" : "body";
  }

  function getInterBoutChoices(rawState) {
    const state = normalizeTournament(rawState);
    const zone = preferredProtectionZone(state.condition);
    const zoneLabel = zone === "head" ? "la tête" : "le corps";
    return [
      {
        id: CHOICE_IDS.REST,
        title: "Repos, repas, hydratation et sommeil",
        summary: "+6 énergie · −3 fatigue · +5 lucidité",
        tradeoff: "Aucun avantage de lecture sur le prochain adversaire.",
      },
      {
        id: CHOICE_IDS.PROTECT,
        title: `Gérer ${zoneLabel}`,
        targetZone: zone,
        summary: "+2 énergie · −1 fatigue · protection ciblée pendant 2 échanges",
        tradeoff: "Récupération plus faible et aucun renseignement tactique.",
      },
      {
        id: CHOICE_IDS.SCOUT,
        title: "Étudier le prochain adversaire",
        summary: "+8 % de précision de lecture pendant 2 échanges",
        tradeoff: "Aucun supplément de récupération physique.",
      },
    ];
  }

  function recoveryForChoice(rawState, choiceId, options = {}) {
    const state = normalizeTournament(rawState);
    if (!VALID_CHOICES.has(choiceId)) {
      throw new TournamentError("INVALID_CHOICE", "Le choix inter-combats est inconnu.");
    }

    const base = baseOvernightRecovery(state.condition, state.entryCondition);
    const condition = clone(base.condition);
    const effects = [];
    let targetZone = null;

    if (choiceId === CHOICE_IDS.REST) {
      condition.energy = clamp(condition.energy + 6);
      condition.fatigue = clamp(condition.fatigue - 3);
      condition.lucidity = clamp(condition.lucidity + 5);
    } else if (choiceId === CHOICE_IDS.PROTECT) {
      targetZone = preferredProtectionZone(condition, options.targetZone);
      condition.energy = clamp(condition.energy + 2);
      condition.fatigue = clamp(condition.fatigue - 1);
      const field = targetZone === "head" ? "headDamage" : "bodyDamage";
      condition[field] = Math.round(condition[field] * 0.65);
      effects.push({
        type: "protection",
        zone: targetZone,
        impactReduction: 0.15,
        exchangesRemaining: 2,
      });
    } else {
      effects.push({
        type: "scouting",
        readAccuracyBonus: 0.08,
        revealTendency: true,
        exchangesRemaining: 2,
      });
    }

    return {
      choiceId,
      targetZone,
      targetEnergy: base.target,
      before: clone(state.condition),
      afterBase: clone(base.condition),
      after: normalizeCondition(condition, condition),
      effects,
    };
  }

  function previewInterBoutRecovery(rawState, choiceId, options = {}) {
    return recoveryForChoice(rawState, choiceId, options);
  }

  function applyInterBoutChoice(rawState, choiceId, options = {}) {
    const state = normalizeTournament(rawState);
    const requestedId = safeText(options.recoveryId, "", 160) || state.interBout?.id || state.lastRecoveryId || null;

    if (requestedId && state.appliedRecoveryIds.includes(requestedId)) return state;
    if (state.phase !== PHASES.INTER_BOUT || !state.interBout) {
      throw new TournamentError("NO_INTER_BOUT", "Aucune récupération inter-combats n’est en attente.");
    }
    if (requestedId !== state.interBout.id) {
      throw new TournamentError("RECOVERY_ID_MISMATCH", "Cette récupération ne correspond pas au combat terminé.");
    }

    const recovery = recoveryForChoice(state, choiceId, options);
    state.condition = recovery.after;
    state.activeEffects = recovery.effects.map(effect => ({ ...effect, startsOnDay: state.day + 1 }));
    state.pendingMedical = normalizeMedicalFlags(state.interBout.medicalFlags);
    state.appliedRecoveryIds.push(requestedId);
    state.appliedRecoveryIds = state.appliedRecoveryIds.slice(-10);
    state.lastRecoveryId = requestedId;
    state.history.push({
      type: "inter_bout_recovery",
      day: state.day,
      recoveryId: requestedId,
      choiceId,
      targetZone: recovery.targetZone,
      before: recovery.before,
      after: recovery.after,
    });
    state.day = Math.min(state.totalBouts, state.day + 1);
    state.phase = PHASES.DAILY_CHECK;
    state.medical = normalizeMedical();
    state.interBout = null;
    return state;
  }

  function evaluateWeighIn(input = {}) {
    const weightKg = finiteNumber(input.weightKg, NaN);
    const minKg = finiteNumber(input.minKg, NaN);
    const maxKg = finiteNumber(input.maxKg, NaN);
    const toleranceKg = boundedNumber(input.toleranceKg, 0, 0, 1);

    if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(maxKg) || maxKg <= 0) {
      return {
        status: "unconfigured",
        passed: false,
        reason: "La pesée quotidienne exige un poids et une limite de catégorie valides.",
      };
    }
    if (Number.isFinite(minKg) && minKg > maxKg) {
      return {
        status: "unconfigured",
        passed: false,
        reason: "Les limites de la catégorie sont incohérentes.",
      };
    }

    const over = weightKg > maxKg + toleranceKg;
    const under = Number.isFinite(minKg) && weightKg < minKg - toleranceKg;
    return {
      status: over ? "over" : under ? "under" : "passed",
      passed: !over && !under,
      weightKg: Math.round(weightKg * 100) / 100,
      minKg: Number.isFinite(minKg) ? minKg : null,
      maxKg,
      toleranceKg,
      reason: over
        ? "Poids supérieur à la limite de la catégorie."
        : under
          ? "Poids inférieur à la limite minimale de la catégorie."
          : "Pesée réussie.",
    };
  }

  function assessMedicalFitness(input = {}) {
    const condition = normalizeCondition(input.condition);
    const flags = normalizeMedicalFlags(input);
    const reasons = [];

    if (flags.restrictionDays > 0) reasons.push("medical_restriction");
    if (flags.acuteInjury) reasons.push("acute_injury");
    if (flags.knockedOut) reasons.push("previous_knockout");
    if (reasons.length) return { status: "unfit", reasons };

    if (flags.doctorStatus) {
      return {
        status: flags.doctorStatus,
        reasons: flags.doctorStatus === "fit" ? [] : ["doctor_decision"],
      };
    }

    // Ces seuils sont des garde-fous de jeu; ils ne représentent pas un diagnostic médical.
    if (condition.headDamage >= 85 || condition.lucidity <= 20) {
      return { status: "unfit", reasons: [condition.headDamage >= 85 ? "severe_head_damage" : "very_low_lucidity"] };
    }
    if (
      condition.headDamage >= 55
      || condition.bodyDamage >= 65
      || condition.injury >= 75
      || condition.lucidity < 55
      || condition.energy < 35
    ) {
      return { status: "fit_with_warning", reasons: ["condition_requires_attention"] };
    }
    return { status: "fit", reasons: [] };
  }

  function performDailyChecks(rawState, checks = {}) {
    const state = normalizeTournament(rawState);
    if (state.phase !== PHASES.DAILY_CHECK) {
      throw new TournamentError("DAILY_CHECK_NOT_DUE", "La pesée et l’examen ne sont pas attendus maintenant.");
    }

    state.weight = normalizeWeight({
      ...state.weight,
      minKg: checks.minKg ?? state.weight.minKg,
      maxKg: checks.maxKg ?? state.weight.maxKg,
      toleranceKg: checks.toleranceKg ?? state.weight.toleranceKg,
    }, state.weight);
    const weighIn = evaluateWeighIn({
      weightKg: checks.weightKg,
      minKg: state.weight.minKg,
      maxKg: state.weight.maxKg,
      toleranceKg: state.weight.toleranceKg,
    });
    const weightRecord = { ...weighIn, day: state.day };
    state.weight.last = weightRecord;
    state.weight.history.push(weightRecord);
    state.weight.history = state.weight.history.slice(-10);

    if (weighIn.status === "unconfigured") {
      throw new TournamentError("WEIGH_IN_UNCONFIGURED", weighIn.reason);
    }

    const pending = normalizeMedicalFlags(state.pendingMedical || {});
    const medical = assessMedicalFitness({
      condition: state.condition,
      restrictionDays: Math.max(pending.restrictionDays, boundedInteger(checks.restrictionDays, 0, 0, 365)),
      acuteInjury: pending.acuteInjury || Boolean(checks.acuteInjury),
      knockedOut: pending.knockedOut || Boolean(checks.knockedOut),
      doctorStatus: checks.doctorStatus || pending.doctorStatus,
    });
    state.medical = { ...medical, day: state.day };
    state.history.push({ type: "daily_check", day: state.day, weighIn: weightRecord, medical: state.medical });

    if (!weighIn.passed) {
      state.phase = PHASES.WITHDRAWN;
      state.termination = { method: "WO", reason: "weigh_in", day: state.day };
      return state;
    }
    if (medical.status === "unfit") {
      state.phase = PHASES.WITHDRAWN;
      state.termination = { method: "WO", reason: "medical", day: state.day, details: medical.reasons };
      return state;
    }

    state.pendingMedical = null;
    state.phase = PHASES.READY;
    return state;
  }

  function canStartBout(rawState) {
    const state = normalizeTournament(rawState);
    if (state.phase !== PHASES.READY) return { ok: false, reason: "Le tournoi n’est pas prêt pour un combat." };
    if (state.lastBoutDay === state.day) return { ok: false, reason: "Un seul combat est permis par journée de tournoi." };
    if (!state.weight.last || state.weight.last.day !== state.day || !state.weight.last.passed) {
      return { ok: false, reason: "La pesée quotidienne doit être réussie avant le combat." };
    }
    if (!state.medical || state.medical.day !== state.day || !["fit", "fit_with_warning"].includes(state.medical.status)) {
      return { ok: false, reason: "L’aptitude médicale quotidienne doit être confirmée avant le combat." };
    }
    if (state.wins >= state.totalBouts) return { ok: false, reason: "Le tournoi est déjà terminé." };
    return { ok: true, reason: "Prêt à boxer." };
  }

  function beginBout(rawState) {
    const state = normalizeTournament(rawState);
    const readiness = canStartBout(state);
    if (!readiness.ok) throw new TournamentError("BOUT_NOT_READY", readiness.reason);

    state.phase = PHASES.IN_BOUT;
    state.currentBout = { number: state.wins + 1, day: state.day };
    state.history.push({ type: "bout_started", bout: state.currentBout.number, day: state.day });
    return state;
  }

  function recordBoutResult(rawState, payload = {}) {
    const state = normalizeTournament(rawState);
    if (state.phase !== PHASES.IN_BOUT || !state.currentBout) {
      throw new TournamentError("NO_ACTIVE_BOUT", "Aucun combat de tournoi n’est en cours.");
    }
    const result = normalizeResult(payload.result);
    const bout = state.currentBout.number;
    const day = state.currentBout.day;
    const endCondition = normalizeCondition(payload.condition || state.condition, state.condition);
    const method = safeText(payload.method, "points", 40);
    const resultRecord = {
      bout,
      day,
      result,
      method,
      score: safeText(payload.score, "", 60),
      opponent: safeText(payload.opponent, "Adversaire", 80),
    };

    state.condition = endCondition;
    state.boutsFought = Math.min(state.totalBouts, state.boutsFought + 1);
    state.lastBoutDay = day;
    state.currentBout = null;
    state.results.push(resultRecord);
    state.history.push({ type: "bout_result", ...resultRecord, condition: clone(endCondition) });

    if (result === "loss") {
      state.phase = PHASES.ELIMINATED;
      state.termination = { method, reason: "bout_loss", day, bout };
      return state;
    }

    state.wins = Math.min(state.totalBouts, state.wins + 1);
    if (state.wins >= state.totalBouts) {
      state.phase = PHASES.COMPLETED;
      state.termination = { method, reason: "champion", day, bout };
      return state;
    }

    const recoveryId = `${state.id}:bout-${bout}:day-${day}`;
    state.phase = PHASES.INTER_BOUT;
    state.interBout = {
      id: recoveryId,
      afterBout: bout,
      recoveryApplied: false,
      medicalFlags: normalizeMedicalFlags(payload.medical),
    };
    return state;
  }

  return Object.freeze({
    SCHEMA_VERSION,
    SUPPORTED_LENGTHS,
    PHASES,
    CHOICE_IDS,
    TournamentError,
    createTournament,
    normalizeTournament,
    migrateLegacyTournament,
    activateTournament,
    normalizeCondition,
    recoveryTarget,
    baseOvernightRecovery,
    getInterBoutChoices,
    previewInterBoutRecovery,
    applyInterBoutChoice,
    evaluateWeighIn,
    assessMedicalFitness,
    performDailyChecks,
    canStartBout,
    beginBout,
    recordBoutResult,
  });
});
