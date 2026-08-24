(function attachBoxeurTraining(root, factory) {
  const timeApi = typeof module === "object" && module.exports
    ? require("./career-time-engine.js")
    : root && root.BoxeurTime;
  const api = factory(timeApi);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurTraining = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurTrainingApi(BoxeurTime) {
  "use strict";

  if (!BoxeurTime) {
    throw new Error("BoxeurTraining requiert career-time-engine.js (BoxeurTime).");
  }

  const SCHEMA_VERSION = 1;
  // La séance personnalisée n'est plus un formulaire à trois blocs. Le joueur
  // peut commencer avec une seule activité et en ajouter jusqu'à parcourir tout
  // le catalogue du GYM; l'énergie et la surcharge deviennent les vraies
  // limites. Les séances du coach conservent volontairement leur format court.
  const MIN_BLOCKS = 1;
  const MAX_BLOCKS = 6;
  const SESSION_DURATION_PERIODS = 1;
  const MAX_PROJECTED_FATIGUE = 90;
  const MAX_PENDING_STIMULUS = 90;
  const MAX_AVERAGE_PENDING_STIMULUS = 65;
  const STAT_KEYS = Object.freeze([...BoxeurTime.STAT_KEYS]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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

  function trainingError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details !== undefined) error.details = details;
    return error;
  }

  /*
   * Les stimuli d'une séance complète ciblée totalisent généralement 5 à 7.
   * Avec BoxeurTime.STAT_GAIN_SCALE, dix séances bien récupérées demeurent donc
   * près du gain historique d'environ un point, au lieu de tripler la progression
   * parce que l'interface montre trois blocs.
   */
  const EXERCISES = deepFreeze({
    jump_rope: {
      id: "jump_rope",
      label: "Corde à danser",
      category: "conditioning",
      durationMinutes: 15,
      energyCost: 5,
      fatigueGain: 3,
      fatigueRelief: 0,
      stimulus: { technique: 0.5, power: 0, cardio: 2.5, defense: 0 },
      xp: 2,
      wear: 0.4,
      injuryRisk: 0.15,
      benefit: "Réveille les appuis et le cardio sans grosse charge d'impact.",
      compromise: "Travaille peu la puissance et la défense.",
    },
    shadow_boxing: {
      id: "shadow_boxing",
      label: "Shadow-boxing",
      category: "technique",
      durationMinutes: 20,
      energyCost: 4,
      fatigueGain: 2,
      fatigueRelief: 0,
      stimulus: { technique: 2, power: 0, cardio: 0, defense: 1 },
      xp: 2,
      wear: 0.25,
      injuryRisk: 0.05,
      benefit: "Répète les gestes et les déplacements à faible risque.",
      compromise: "Le stimulus est plus léger que sur une cible ou avec opposition.",
    },
    heavy_bag: {
      id: "heavy_bag",
      label: "Sac lourd",
      category: "power",
      durationMinutes: 25,
      energyCost: 7,
      fatigueGain: 5,
      fatigueRelief: 0,
      stimulus: { technique: 0.5, power: 5.5, cardio: 0, defense: 0 },
      xp: 3,
      wear: 1.4,
      injuryRisk: 0.7,
      benefit: "Développe l'impact et la capacité à enchaîner sur une cible stable.",
      compromise: "Coûte plus d'énergie et ne répond pas aux coups.",
    },
    mitts: {
      id: "mitts",
      label: "Travail aux mitaines",
      category: "technique",
      durationMinutes: 25,
      energyCost: 6,
      fatigueGain: 4,
      fatigueRelief: 0,
      stimulus: { technique: 4, power: 0, cardio: 0, defense: 1 },
      xp: 3,
      wear: 0.65,
      injuryRisk: 0.25,
      benefit: "Travaille la précision et les enchaînements avec les corrections du coach.",
      compromise: "Demande un coach disponible et développe peu la puissance brute.",
    },
    defense_drills: {
      id: "defense_drills",
      label: "Défense et esquives",
      category: "defense",
      durationMinutes: 20,
      energyCost: 5,
      fatigueGain: 3,
      fatigueRelief: 0,
      stimulus: { technique: 1, power: 0, cardio: 0, defense: 4 },
      xp: 3,
      wear: 0.5,
      injuryRisk: 0.2,
      benefit: "Automatise la garde, les esquives et les sorties d'angle.",
      compromise: "Produit peu de volume offensif et aucun gain direct de puissance.",
    },
    technical_sparring: {
      id: "technical_sparring",
      label: "Sparring technique",
      category: "opposition",
      durationMinutes: 25,
      energyCost: 8,
      fatigueGain: 6,
      fatigueRelief: 0,
      stimulus: { technique: 2, power: 0, cardio: 1, defense: 3 },
      xp: 4,
      wear: 2.1,
      injuryRisk: 1.4,
      benefit: "Transfère plusieurs acquis vers une opposition contrôlée.",
      compromise: "Apporte plus d'usure et de risque qu'un exercice sans contact.",
    },
    cooldown: {
      id: "cooldown",
      label: "Retour au calme",
      category: "recovery",
      durationMinutes: 10,
      energyCost: 1,
      fatigueGain: 0,
      fatigueRelief: 4,
      stimulus: { technique: 0, power: 0, cardio: 0, defense: 0 },
      xp: 0,
      wear: 0,
      injuryRisk: 0,
      benefit: "Réduit la charge immédiate et facilite la récupération.",
      compromise: "Prend la place d'un bloc qui aurait créé plus de stimulus.",
    },
  });

  const FOCUS_LABELS = deepFreeze({
    technique: "technique",
    power: "puissance",
    cardio: "cardio",
    defense: "défense",
    balanced: "fondamentaux",
  });

  const TARGETED_BLOCKS = deepFreeze({
    technique: ["shadow_boxing", "mitts", "cooldown"],
    power: ["jump_rope", "heavy_bag", "cooldown"],
    cardio: ["jump_rope", "mitts", "cooldown"],
    defense: ["shadow_boxing", "defense_drills", "cooldown"],
  });

  const LIGHT_BLOCKS = deepFreeze({
    technique: ["shadow_boxing", "cooldown"],
    power: ["heavy_bag", "cooldown"],
    cardio: ["jump_rope", "cooldown"],
    defense: ["defense_drills", "cooldown"],
  });

  function normalizeStatus(context = {}) {
    const status = String(context.careerStatus || context.status || "recreational").toLowerCase();
    return ["recreational", "amateur", "professional"].includes(status) ? status : "recreational";
  }

  function hasGymMembership(context = {}) {
    if (context.membershipActive != null) return Boolean(context.membershipActive);
    if (context.boxingGymMembershipActive != null) return Boolean(context.boxingGymMembershipActive);
    if (context.boxingGymAccess != null) return Boolean(context.boxingGymAccess);
    if (context.hasGymMembership != null) return Boolean(context.hasGymMembership);
    if (context.gymWeeks != null) return Number(context.gymWeeks) > 0;
    if (context.membership && typeof context.membership === "object") {
      if (context.membership.active != null) return Boolean(context.membership.active);
      if (context.membership.status != null) return ["active", "paid"].includes(String(context.membership.status));
    }
    return false;
  }

  function mandatoryRecoveryReason(context = {}) {
    const recoveryWeeks = Math.max(0, Number(context.injuryWeeks || context.medicalRestWeeks || 0));
    if (recoveryWeeks <= 0 && context.medicalRestriction !== true) return null;
    const duration = recoveryWeeks > 0
      ? `${Math.ceil(recoveryWeeks)} semaine${Math.ceil(recoveryWeeks) > 1 ? "s" : ""}`
      : "la période prescrite";
    return `Repos médical obligatoire : aucun entraînement de boxe pendant ${duration}.`;
  }

  function hashText(value) {
    const text = String(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function randomValue(rng, fallbackKey) {
    let value;
    if (typeof rng === "function") value = rng();
    else if (rng && typeof rng.next === "function") {
      const next = rng.next();
      value = typeof next === "number" ? next : next && next.value;
    } else value = hashText(fallbackKey) / 4294967296;
    return clamp(value, 0, 0.9999999999999999);
  }

  function weakestStat(timeState, rng) {
    const minimum = Math.min(...STAT_KEYS.map(key => Number(timeState.stats[key])));
    const tied = STAT_KEYS.filter(key => Number(timeState.stats[key]) === minimum);
    if (tied.length === 1) return tied[0];
    const fallbackKey = `${timeState.seed}:${timeState.clock.absoluteSlot}:${tied.join(":")}`;
    return tied[Math.floor(randomValue(rng, fallbackKey) * tied.length)];
  }

  function normalizeBlocks(input) {
    const blockInputs = Array.isArray(input)
      ? input
      : input && Array.isArray(input.blocks) ? input.blocks : [];
    if (blockInputs.length < MIN_BLOCKS || blockInputs.length > MAX_BLOCKS) {
      throw trainingError(
        "INVALID_BLOCK_COUNT",
        `Une séance doit contenir de ${MIN_BLOCKS} à ${MAX_BLOCKS} blocs.`,
      );
    }
    const blocks = blockInputs.map(blockInput => {
      const id = typeof blockInput === "string" ? blockInput : blockInput && blockInput.id;
      const exercise = EXERCISES[id];
      if (!exercise) throw trainingError("UNKNOWN_EXERCISE", `Exercice inconnu : ${id}.`);
      return exercise;
    });
    const cooldownCount = blocks.filter(block => block.id === "cooldown").length;
    if (cooldownCount > 1) {
      throw trainingError("DUPLICATE_COOLDOWN", "Une séance ne peut contenir qu'un retour au calme.");
    }
    const duplicate = blocks.find((block, index) => blocks.findIndex(item => item.id === block.id) !== index);
    if (duplicate) {
      throw trainingError("DUPLICATE_EXERCISE", `L'activité « ${duplicate.label} » est déjà dans la séance.`);
    }
    if (!blocks.some(block => Object.values(block.stimulus).some(value => value > 0))) {
      throw trainingError("EMPTY_TRAINING", "La séance doit contenir au moins un bloc d'entraînement.");
    }
    return blocks;
  }

  function makeSession(blockInputs, options = {}) {
    const blocks = normalizeBlocks(blockInputs);
    const focus = options.focus && FOCUS_LABELS[options.focus] ? options.focus : "balanced";
    const source = options.source === "coach" ? "coach" : "custom";
    const id = String(options.id || `${source}-${blocks.map(block => block.id).join("-")}`);
    return {
      schemaVersion: SCHEMA_VERSION,
      id,
      label: String(options.label || (source === "coach" ? "Séance préparée par le coach" : "Ma séance")),
      source,
      focus,
      focusLabel: FOCUS_LABELS[focus],
      rationale: String(options.rationale || "Une séance composée librement au gym de boxe, dans la limite de l'énergie disponible."),
      benefit: String(options.benefit || `Stimulus principalement orienté vers la ${FOCUS_LABELS[focus]}.`),
      tradeoff: String(options.tradeoff || "La spécialisation laisse nécessairement d'autres qualités moins travaillées."),
      blocks: blocks.map(block => clone(block)),
    };
  }

  function createCustomSession(blockInputs, options = {}) {
    return makeSession(blockInputs, { ...options, source: "custom" });
  }

  function coachPlanFor(timeState, context = {}, rng) {
    const preparation = BoxeurTime.getPreparation(timeState);
    const status = normalizeStatus(context);
    const focus = weakestStat(timeState, rng);
    const needsLightLoad = ["critical", "fragile"].includes(preparation.status);
    let blockIds = needsLightLoad ? LIGHT_BLOCKS[focus] : TARGETED_BLOCKS[focus];
    let label = needsLightLoad ? "Séance de reprise du coach" : "Séance ciblée du coach";
    let benefit = needsLightLoad
      ? `Protège la récupération tout en entretenant la ${FOCUS_LABELS[focus]}.`
      : `Corrige en priorité ta qualité la plus faible : la ${FOCUS_LABELS[focus]}.`;
    let tradeoff = needsLightLoad
      ? "Charge réduite, donc progression plus lente qu'une séance complète."
      : "Le travail ciblé développe moins les trois autres qualités.";

    if (status === "recreational" && !needsLightLoad) {
      blockIds = focus === "power"
        ? ["shadow_boxing", "heavy_bag", "cooldown"]
        : focus === "defense"
          ? ["shadow_boxing", "defense_drills", "cooldown"]
          : ["jump_rope", "shadow_boxing", "cooldown"];
      label = "Fondamentaux avec le coach";
      benefit = "Renforce des gestes simples et reproductibles avant le circuit amateur.";
      tradeoff = `Approche pédagogique : la ${FOCUS_LABELS[focus]} progresse moins vite qu'avec une spécialisation complète.`;
    }

    return makeSession(blockIds, {
      id: `coach-${status}-${preparation.status}-${focus}`,
      source: "coach",
      focus,
      label,
      rationale: `${preparation.label} · le coach relève la ${FOCUS_LABELS[focus]} comme priorité.`,
      benefit,
      tradeoff,
    });
  }

  function balancedCoachPlan(timeState, context = {}) {
    const status = normalizeStatus(context);
    const recreational = status === "recreational";
    return makeSession(
      recreational
        ? ["jump_rope", "shadow_boxing", "cooldown"]
        : ["mitts", "defense_drills", "cooldown"],
      {
        id: `coach-${status}-balanced`,
        source: "coach",
        focus: "balanced",
        label: recreational ? "Circuit des fondamentaux" : "Séance complète du coach",
        rationale: recreational
          ? "Le coach privilégie les bases et une charge facile à assimiler."
          : "Le coach relie technique et défense sans transformer la séance en sparring.",
        benefit: "Répartit le stimulus sur plusieurs qualités.",
        tradeoff: recreational
          ? "Très sécuritaire, mais la puissance reste peu travaillée."
          : "Plus d'usure et aucun correctif aussi marqué qu'une séance ciblée.",
      },
    );
  }

  function recoveryCoachPlan(timeState, context = {}, rng) {
    const focus = weakestStat(timeState, rng);
    return makeSession(LIGHT_BLOCKS[focus], {
      id: `coach-${normalizeStatus(context)}-light-${focus}`,
      source: "coach",
      focus,
      label: "Entretien et récupération",
      rationale: "Le coach réduit volontairement le volume de la séance.",
      benefit: `Entretient la ${FOCUS_LABELS[focus]} avec une charge contenue.`,
      tradeoff: "Préserve davantage l'énergie, mais crée moins de stimulus.",
    });
  }

  function buildCoachChoices(timeState, context = {}, rng) {
    const targeted = coachPlanFor(timeState, context, rng);
    const balanced = balancedCoachPlan(timeState, context);
    const light = recoveryCoachPlan(timeState, context, rng);
    // coachPlanFor devient déjà une séance légère lorsque la préparation est
    // fragile. Elle reste donc la recommandation, tandis que les autres plans
    // sont de vrais compromis présentables dans l'interface.
    const recommendedId = targeted.id;
    const unique = [];
    [targeted, balanced, light].forEach(session => {
      if (!unique.some(item => item.blocks.map(block => block.id).join("|") === session.blocks.map(block => block.id).join("|"))) {
        unique.push(session);
      }
    });
    return unique.map(session => ({ ...session, recommended: session.id === recommendedId }));
  }

  function buildCoachSession(timeState, context = {}, rng) {
    const choices = buildCoachChoices(timeState, context, rng);
    return choices.find(choice => choice.recommended) || choices[0];
  }

  function aggregateSession(sessionInput) {
    const session = sessionInput && sessionInput.schemaVersion === SCHEMA_VERSION
      ? makeSession(sessionInput.blocks, sessionInput)
      : createCustomSession(sessionInput);
    const totals = {
      durationMinutes: 0,
      durationPeriods: SESSION_DURATION_PERIODS,
      energyCost: 0,
      fatigueGain: 0,
      fatigueRelief: 0,
      stimulus: STAT_KEYS.reduce((result, key) => ({ ...result, [key]: 0 }), {}),
      xp: 0,
      wear: 0,
      injuryRisk: 0,
    };
    session.blocks.forEach(block => {
      totals.durationMinutes += block.durationMinutes;
      totals.energyCost += block.energyCost;
      totals.fatigueGain += block.fatigueGain;
      totals.fatigueRelief += block.fatigueRelief;
      totals.xp += block.xp;
      totals.wear += block.wear;
      totals.injuryRisk += block.injuryRisk;
      STAT_KEYS.forEach(key => { totals.stimulus[key] += block.stimulus[key]; });
    });
    totals.energyCost = roundTo(totals.energyCost);
    totals.energyDelta = -totals.energyCost;
    totals.fatigueGain = roundTo(totals.fatigueGain);
    totals.fatigueRelief = roundTo(totals.fatigueRelief);
    totals.fatigueDelta = roundTo(totals.fatigueGain - totals.fatigueRelief);
    totals.xp = roundTo(totals.xp);
    totals.wear = roundTo(totals.wear);
    totals.injuryRisk = roundTo(totals.injuryRisk);
    STAT_KEYS.forEach(key => { totals.stimulus[key] = roundTo(totals.stimulus[key]); });
    return { session, totals };
  }

  function activityFrom(session, totals) {
    return {
      id: `boxing-gym-session:${session.id}`,
      label: session.label,
      category: "boxing-gym-training",
      duration: SESSION_DURATION_PERIODS,
      energyCost: totals.energyCost,
      energyGain: 0,
      fatigueGain: totals.fatigueGain,
      fatigueRelief: totals.fatigueRelief,
      stimulus: clone(totals.stimulus),
    };
  }

  function applySessionAdjustment(baseTotals, input) {
    const totals = clone(baseTotals);
    const adjustment = input && typeof input === "object" ? input : {};
    const read = (key, fallback) => Number.isFinite(Number(adjustment[key])) ? Number(adjustment[key]) : fallback;
    totals.energyCost = roundTo(clamp(read("energyCost", totals.energyCost), 0, 100));
    totals.energyDelta = -totals.energyCost;
    totals.fatigueGain = roundTo(clamp(read("fatigueGain", totals.fatigueGain), 0, 100));
    totals.fatigueRelief = roundTo(clamp(read("fatigueRelief", totals.fatigueRelief), 0, 100));
    totals.fatigueDelta = roundTo(totals.fatigueGain - totals.fatigueRelief);
    return {
      totals,
      recoveryQuality: roundTo(clamp(read("recoveryQuality", 1), .75, 1.25), 4),
    };
  }

  function failedPreview(code, reason, aggregate) {
    return {
      ok: false,
      code,
      reason,
      ...(aggregate ? { session: aggregate.session, totals: aggregate.totals } : {}),
    };
  }

  function previewSession(timeState, sessionInput, context = {}) {
    let aggregate;
    try {
      aggregate = aggregateSession(sessionInput);
      if (!hasGymMembership(context)) {
        return failedPreview(
          "GYM_MEMBERSHIP_REQUIRED",
          "Un abonnement actif au gym de boxe est requis pour cette séance.",
          aggregate,
        );
      }
      const recoveryReason = mandatoryRecoveryReason(context);
      if (recoveryReason) {
        return failedPreview("MEDICAL_REST_REQUIRED", recoveryReason, aggregate);
      }

      const { session, totals: baseTotals } = aggregate;
      const basePendingStimulus = {};
      STAT_KEYS.forEach(key => {
        basePendingStimulus[key] = roundTo(clamp(timeState.stimulus[key] + baseTotals.stimulus[key]));
      });
      const baseAveragePendingStimulus = roundTo(
        STAT_KEYS.reduce((sum, key) => sum + basePendingStimulus[key], 0) / STAT_KEYS.length,
        1,
      );
      const baseProjectedFatigue = roundTo(clamp(
        timeState.condition.fatigue + baseTotals.fatigueGain - baseTotals.fatigueRelief,
      ));
      if (baseProjectedFatigue > MAX_PROJECTED_FATIGUE
        || Math.max(...Object.values(basePendingStimulus)) > MAX_PENDING_STIMULUS
        || baseAveragePendingStimulus > MAX_AVERAGE_PENDING_STIMULUS) {
        return failedPreview(
          "OVERLOAD_RISK",
          "La charge est trop élevée pour être assimilée correctement. Récupère ou allège la séance.",
          aggregate,
        );
      }
      const baseTimeCheck = BoxeurTime.canPerformActivity(timeState, activityFrom(session, baseTotals), {
        appointmentId: context.appointmentId,
      });
      if (!baseTimeCheck.ok) return failedPreview(baseTimeCheck.code, baseTimeCheck.reason, aggregate);

      const adjusted = applySessionAdjustment(baseTotals, context.sessionAdjustment);
      const totals = adjusted.totals;
      const projectedFatigue = roundTo(clamp(
        timeState.condition.fatigue + totals.fatigueGain - totals.fatigueRelief,
      ));
      const projectedEnergy = roundTo(clamp(timeState.condition.energy - totals.energyCost));
      const pendingStimulus = {};
      STAT_KEYS.forEach(key => {
        pendingStimulus[key] = roundTo(clamp(timeState.stimulus[key] + totals.stimulus[key]));
      });
      const averagePendingStimulus = roundTo(
        STAT_KEYS.reduce((sum, key) => sum + pendingStimulus[key], 0) / STAT_KEYS.length,
        1,
      );
      if (projectedFatigue > MAX_PROJECTED_FATIGUE
        || Math.max(...Object.values(pendingStimulus)) > MAX_PENDING_STIMULUS
        || averagePendingStimulus > MAX_AVERAGE_PENDING_STIMULUS) {
        return failedPreview(
          "OVERLOAD_RISK",
          "La charge est trop élevée pour être assimilée correctement. Récupère ou allège la séance.",
          aggregate,
        );
      }

      const activity = activityFrom(session, totals);
      const timeCheck = BoxeurTime.canPerformActivity(timeState, activity, {
        appointmentId: context.appointmentId,
      });
      if (!timeCheck.ok) return failedPreview(timeCheck.code, timeCheck.reason, aggregate);

      const warnings = [];
      if (projectedFatigue >= 75) warnings.push("Fatigue élevée après la séance");
      if (averagePendingStimulus >= 50) warnings.push("Beaucoup de charge reste à assimiler");
      if (projectedEnergy <= 25) warnings.push("Peu d'énergie restera disponible");
      return {
        ok: true,
        session,
        totals,
        activity,
        projected: {
          energy: projectedEnergy,
          fatigue: projectedFatigue,
          pendingStimulus,
          averagePendingStimulus,
          end: clone(timeCheck.end),
        },
        warnings,
        baseTotals,
        recoveryQuality: adjusted.recoveryQuality,
      };
    } catch (error) {
      return failedPreview(error.code || "INVALID_SESSION", error.message, aggregate);
    }
  }

  function businessResult(before, after, preview) {
    const preparation = BoxeurTime.getPreparation(before);
    const effortModifier = 0.85 + preparation.score / 500;
    const startingFatiguePenalty = Math.max(0, before.condition.fatigue - 50) * 0.08;
    const lowEnergyPenalty = Math.max(0, 35 - before.condition.energy) * 0.06;
    const injuryRiskPercent = roundTo(clamp(
      preview.totals.injuryRisk + startingFatiguePenalty + lowEnergyPenalty,
      0,
      20,
    ), 1);
    const statGains = {};
    STAT_KEYS.forEach(key => {
      statGains[key] = roundTo(after.stats[key] - before.stats[key]);
    });
    const afterSession = {
      energy: roundTo(clamp(before.condition.energy - preview.totals.energyCost)),
      fatigue: roundTo(clamp(before.condition.fatigue + preview.totals.fatigueGain - preview.totals.fatigueRelief)),
    };
    const sessionConditionDelta = {
      energy: roundTo(afterSession.energy - before.condition.energy),
      fatigue: roundTo(afterSession.fatigue - before.condition.fatigue),
    };
    const nightRecoveryDelta = {
      energy: roundTo(after.condition.energy - afterSession.energy),
      fatigue: roundTo(after.condition.fatigue - afterSession.fatigue),
    };
    const remainingStimulus = clone(after.stimulus);
    return {
      type: "boxing-gym-session",
      sessionId: preview.session.id,
      source: preview.session.source,
      label: preview.session.label,
      focus: preview.session.focus,
      blocks: preview.session.blocks.map(block => block.id),
      startedAt: clone(before.clock),
      endedAt: clone(after.clock),
      durationMinutes: preview.totals.durationMinutes,
      durationPeriods: SESSION_DURATION_PERIODS,
      conditionDelta: {
        energy: roundTo(after.condition.energy - before.condition.energy),
        fatigue: roundTo(after.condition.fatigue - before.condition.fatigue),
      },
      sessionConditionDelta,
      nightRecoveryDelta,
      plannedStimulus: clone(preview.totals.stimulus),
      remainingStimulus,
      statGains,
      xpAward: Math.max(1, Math.round(preview.totals.xp * effortModifier)),
      wear: roundTo(preview.totals.wear * (1 + Math.max(0, before.condition.fatigue - 40) / 100), 1),
      injuryRiskPercent,
      injuryResolved: false,
      tradeoff: preview.session.tradeoff,
      warnings: clone(preview.warnings),
    };
  }

  function executeSession(timeState, sessionInput, context = {}, rng) {
    const check = previewSession(timeState, sessionInput, context);
    if (!check.ok) throw trainingError(check.code, check.reason);
    const nextTimeState = BoxeurTime.performActivity(
      timeState,
      check.activity,
      { appointmentId: context.appointmentId, recoveryQuality: check.recoveryQuality },
      rng,
    );
    return {
      timeState: nextTimeState,
      state: nextTimeState,
      session: clone(check.session),
      result: businessResult(timeState, nextTimeState, check),
    };
  }

  /* Action principale de l'interface : composer et exécuter la recommandation
   * ne demande qu'un seul appel/clic et produit une seule transition de temps. */
  function runCoachSession(timeState, context = {}, rng) {
    const session = buildCoachSession(timeState, context, rng);
    return executeSession(timeState, session, context, rng);
  }

  return Object.freeze({
    SCHEMA_VERSION,
    MIN_BLOCKS,
    MAX_BLOCKS,
    SESSION_DURATION_PERIODS,
    MAX_PROJECTED_FATIGUE,
    MAX_PENDING_STIMULUS,
    MAX_AVERAGE_PENDING_STIMULUS,
    EXERCISES,
    createCustomSession,
    buildCoachChoices,
    buildCoachSession,
    aggregateSession,
    applySessionAdjustment,
    mandatoryRecoveryReason,
    previewSession,
    canExecuteSession: previewSession,
    executeSession,
    runCoachSession,
  });
});
