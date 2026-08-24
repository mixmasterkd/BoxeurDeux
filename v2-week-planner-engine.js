(function attachBoxeurWeekPlanner(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurWeekPlanner = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurWeekPlannerApi() {
  "use strict";

  /*
   * Noyau pur du planificateur hebdomadaire V2.
   *
   * Ce module ne fait pas avancer l'horloge et ne dépense aucun inventaire.
   * Il construit un brouillon sérialisable, réserve la capacité et les
   * suppléments, puis produit un paquet de commit atomique. Le moteur central
   * demeure ainsi la seule autorité qui applique réellement une semaine.
   */

  const SCHEMA_VERSION = 2;
  const LEGACY_SCHEMA_VERSION = 1;
  const STATE_KIND = "boxeur-v2-week-planner";
  const DEFAULT_WEEKLY_CAPACITY = 10;
  const DEFAULT_RECREATIONAL_PHYSICAL_LIMIT = 2;
  const DEFAULT_SUPPLEMENT_LIMIT = 2;
  const REPEAT_GAIN_MULTIPLIER = 0.85;
  const MAX_ENTRIES = 64;
  const MAX_CAPACITY = 50;
  const DEFAULT_FAMILY_LIMITS = deepFreeze({
    group: 1,
    boxing: 2,
    strength: 2,
    home: 2,
    sparring: 1,
  });

  const DAYS = deepFreeze([
    { id: "monday", label: "Lundi" },
    { id: "tuesday", label: "Mardi" },
    { id: "wednesday", label: "Mercredi" },
    { id: "thursday", label: "Jeudi" },
    { id: "friday", label: "Vendredi" },
    { id: "saturday", label: "Samedi" },
    { id: "sunday", label: "Dimanche" },
  ]);
  const DAY_ALIASES = deepFreeze({
    monday: 0, lundi: 0,
    tuesday: 1, mardi: 1,
    wednesday: 2, mercredi: 2,
    thursday: 3, jeudi: 3,
    friday: 4, vendredi: 4,
    saturday: 5, samedi: 5,
    sunday: 6, dimanche: 6,
  });
  const ACTIVITY_CATEGORIES = deepFreeze([
    "work",
    "boxing",
    "strength",
    "sparring",
    "fight",
    "group-class",
    "private-training",
    "recovery",
    "home",
    "appointment",
    "event",
    "leisure",
    "other",
  ]);
  const LOCATIONS = deepFreeze([
    "work",
    "boxing-gym",
    "strength-gym",
    "home",
    "arena",
    "calendar",
    "outdoors",
    "other",
  ]);
  const PHYSICAL_CATEGORIES = deepFreeze([
    "boxing", "strength", "sparring", "fight", "group-class", "private-training",
  ]);
  const RECREATIONAL_BLOCKED_CATEGORIES = deepFreeze([
    "strength", "sparring", "fight", "private-training",
  ]);
  const RECREATIONAL_BLOCKED_LOCATIONS = deepFreeze(["strength-gym", "arena"]);
  const DEFAULT_LOCATIONS = deepFreeze({
    work: "work",
    boxing: "boxing-gym",
    strength: "strength-gym",
    sparring: "boxing-gym",
    fight: "arena",
    "group-class": "boxing-gym",
    "private-training": "boxing-gym",
    recovery: "home",
    home: "home",
    appointment: "calendar",
    event: "calendar",
    leisure: "home",
    other: "other",
  });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function finiteNumber(value, fallback = 0, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
  }

  function wholeNumber(value, fallback, min, max) {
    return Math.round(finiteNumber(value == null ? fallback : value, fallback, min, max));
  }

  function roundTo(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round((finiteNumber(value) + Number.EPSILON) * factor) / factor;
  }

  function cleanId(value) {
    return String(value == null ? "" : value).trim();
  }

  function plannerError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details !== undefined) error.details = details;
    return error;
  }

  function normalizeCareerStatus(value) {
    const status = String(value || "recreational").trim().toLowerCase();
    return ["recreational", "amateur", "professional"].includes(status) ? status : "recreational";
  }

  function resolveDayIndex(value, fallback) {
    if (value == null && fallback != null) return resolveDayIndex(fallback);
    if (Number.isInteger(value) && value >= 0 && value < DAYS.length) return value;
    const key = String(value == null ? "" : value).trim().toLocaleLowerCase("fr-CA");
    if (Object.prototype.hasOwnProperty.call(DAY_ALIASES, key)) return DAY_ALIASES[key];
    throw plannerError("INVALID_DAY", `Jour de semaine inconnu : ${String(value == null ? "—" : value)}.`);
  }

  function normalizeStatusList(value) {
    if (!Array.isArray(value)) return [];
    const statuses = value.map(raw => String(raw || "").trim().toLowerCase());
    const invalid = statuses.find(status => !["recreational", "amateur", "professional"].includes(status));
    if (invalid) throw plannerError("INVALID_CAREER_STATUS", `Statut de carrière inconnu : ${invalid}.`);
    return [...new Set(statuses)];
  }

  function normalizeActivity(input, defaults = {}) {
    if (!input || typeof input !== "object") {
      throw plannerError("INVALID_ACTIVITY", "Une activité structurée est requise.");
    }
    const suppliedId = input.id == null ? input.activityId : input.id;
    const id = cleanId(suppliedId == null ? defaults.id == null ? defaults.activityId : defaults.id : suppliedId);
    if (!id) throw plannerError("INVALID_ACTIVITY_ID", "L'activité doit avoir un identifiant stable.");
    const category = cleanId(input.category == null ? defaults.category : input.category) || "other";
    if (!ACTIVITY_CATEGORIES.includes(category)) {
      throw plannerError("INVALID_ACTIVITY_CATEGORY", `Catégorie d'activité inconnue : ${category}.`);
    }
    const location = cleanId(input.location == null ? defaults.location : input.location)
      || DEFAULT_LOCATIONS[category]
      || "other";
    if (!LOCATIONS.includes(location)) {
      throw plannerError("INVALID_ACTIVITY_LOCATION", `Lieu d'activité inconnu : ${location}.`);
    }
    const explicitPhysical = input.physical == null ? defaults.physical : input.physical;
    const fatigueDelta = input.fatigueDelta == null
      ? finiteNumber(input.fatigueGain == null ? defaults.fatigueGain : input.fatigueGain, 0, 0, 100)
        - finiteNumber(input.fatigueRelief == null ? defaults.fatigueRelief : input.fatigueRelief, 0, 0, 100)
      : finiteNumber(input.fatigueDelta, 0, -100, 100);
    const metadata = clone(input.metadata == null ? defaults.metadata || {} : input.metadata);
    const inferredFamily = category === "group-class"
      ? "group"
      : category === "boxing"
        ? "boxing"
        : category === "strength"
          ? "strength"
          : category === "sparring"
            ? "sparring"
            : category === "home" && explicitPhysical === true
              ? "home"
              : "";
    const familyId = cleanId(metadata.familyId) || inferredFamily;
    if (familyId) {
      metadata.familyId = familyId;
      metadata.programSignature = cleanId(metadata.programSignature) || `${familyId}:${id}`;
    }
    return {
      activityId: id,
      label: String(input.label == null ? defaults.label == null ? id : defaults.label : input.label),
      category,
      location,
      physical: explicitPhysical == null ? PHYSICAL_CATEGORIES.includes(category) : explicitPhysical === true,
      capacityCost: wholeNumber(
        input.capacityCost == null ? defaults.capacityCost : input.capacityCost,
        1,
        0,
        MAX_CAPACITY,
      ),
      energyCost: roundTo(finiteNumber(
        input.energyCost == null ? defaults.energyCost : input.energyCost,
        0,
        0,
        100,
      )),
      energyGain: roundTo(finiteNumber(
        input.energyGain == null ? defaults.energyGain : input.energyGain,
        0,
        0,
        100,
      )),
      fatigueDelta: roundTo(fatigueDelta),
      pay: roundTo(finiteNumber(input.pay == null ? defaults.pay : input.pay, 0, 0, Number.MAX_SAFE_INTEGER)),
      recreationalAllowed: input.recreationalAllowed == null
        ? defaults.recreationalAllowed == null ? null : defaults.recreationalAllowed === true
        : input.recreationalAllowed === true,
      allowedCareerStatuses: normalizeStatusList(
        input.allowedCareerStatuses == null ? defaults.allowedCareerStatuses : input.allowedCareerStatuses,
      ),
      metadata,
    };
  }

  function normalizeFamilyLimits(value, careerStatus) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const limits = {};
    Object.entries(DEFAULT_FAMILY_LIMITS).forEach(([familyId, defaultLimit]) => {
      const recreationalHomeLimit = careerStatus === "recreational" && familyId === "home" ? 1 : defaultLimit;
      limits[familyId] = wholeNumber(source[familyId], recreationalHomeLimit, 0, DAYS.length);
    });
    return limits;
  }

  function familyFor(activity) {
    return cleanId(activity && activity.metadata && activity.metadata.familyId);
  }

  function programSignatureFor(activity) {
    return cleanId(activity && activity.metadata && activity.metadata.programSignature);
  }

  function recalculateRepetition(entries) {
    const next = clone(entries);
    const groups = new Map();
    next.forEach(entry => {
      if (entry.preReserved || entry.physical !== true) return;
      const signature = programSignatureFor(entry);
      if (!signature) return;
      if (!groups.has(signature)) groups.set(signature, []);
      groups.get(signature).push(entry);
    });
    groups.forEach(group => {
      group.sort((left, right) => left.dayIndex - right.dayIndex || left.id.localeCompare(right.id));
      group.forEach((entry, index) => {
        entry.metadata = clone(entry.metadata || {});
        entry.metadata.repeatIndex = index + 1;
        entry.metadata.gainMultiplier = index === 0 ? 1 : REPEAT_GAIN_MULTIPLIER;
      });
    });
    return next;
  }

  function normalizeInventory(value) {
    const inventory = {};
    if (!value || typeof value !== "object" || Array.isArray(value)) return inventory;
    Object.entries(value).forEach(([rawId, rawQuantity]) => {
      const id = cleanId(rawId);
      const quantity = wholeNumber(rawQuantity, 0, 0, 999);
      if (id && quantity > 0) inventory[id] = quantity;
    });
    return inventory;
  }

  function normalizeSupplements(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    const usedProductIds = Array.isArray(source.usedProductIds)
      ? [...new Set(source.usedProductIds.map(cleanId).filter(Boolean))]
      : [];
    const weeklyLimit = wholeNumber(source.weeklyLimit, DEFAULT_SUPPLEMENT_LIMIT, 0, 20);
    return {
      inventory: normalizeInventory(source.inventory),
      weeklyLimit,
      alreadyUsed: wholeNumber(source.alreadyUsed, 0, 0, weeklyLimit),
      usedProductIds,
      uniqueProducts: source.uniqueProducts !== false,
    };
  }

  function normalizeCondition(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    return {
      energy: roundTo(finiteNumber(source.energy, 100, 0, 100)),
      fatigue: roundTo(finiteNumber(source.fatigue, 0, 0, 100)),
    };
  }

  function workEntries(workInput, weekKey) {
    const work = workInput && typeof workInput === "object" ? workInput : null;
    if (!work || work.active === false) return [];
    const shifts = Array.isArray(work.shifts) && work.shifts.length
      ? work.shifts
      : ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const workId = cleanId(work.id) || "job";
    const weeklyPay = finiteNumber(work.weeklyPay, 0, 0, Number.MAX_SAFE_INTEGER);
    const payShare = shifts.length ? roundTo(weeklyPay / shifts.length) : 0;
    return shifts.map((shiftInput, index) => {
      const shift = shiftInput && typeof shiftInput === "object" ? shiftInput : { day: shiftInput };
      const dayIndex = resolveDayIndex(shift.day == null ? shift.dayIndex : shift.day);
      const pay = shift.pay == null
        ? index === shifts.length - 1 ? roundTo(weeklyPay - payShare * (shifts.length - 1)) : payShare
        : finiteNumber(shift.pay, 0, 0, Number.MAX_SAFE_INTEGER);
      const activity = normalizeActivity(shift.activity || {
        id: cleanId(shift.activityId) || `work:${workId}`,
        label: shift.label || work.label || work.title || "Quart de travail",
        category: "work",
        location: "work",
        physical: false,
        capacityCost: shift.capacityCost == null ? work.capacityCost : shift.capacityCost,
        energyCost: shift.energyCost == null ? work.energyCost : shift.energyCost,
        energyGain: shift.energyGain == null ? work.energyGain : shift.energyGain,
        fatigueDelta: shift.fatigueDelta == null
          ? shift.fatigueGain == null ? work.fatigueGain : shift.fatigueGain
          : shift.fatigueDelta,
        pay,
        recreationalAllowed: true,
        metadata: { jobId: workId },
      }, {
        category: "work",
        location: "work",
        physical: false,
        capacityCost: 1,
        energyCost: 8,
        fatigueGain: 6,
        pay,
        recreationalAllowed: true,
      });
      if (activity.category !== "work" || activity.location !== "work" || activity.physical) {
        throw plannerError(
          "INVALID_WORK_ACTIVITY",
          "Un quart pré-réservé doit rester une activité non physique au lieu de travail.",
        );
      }
      activity.pay = roundTo(pay);
      return {
        id: cleanId(shift.id) || `work-${weekKey}-${index + 1}`,
        ...activity,
        day: DAYS[dayIndex].id,
        dayIndex,
        source: "work",
        preReserved: true,
        locked: shift.locked == null ? work.locked === true : shift.locked === true,
        supplementId: null,
      };
    });
  }

  function createPlanner(config = {}) {
    const source = config && typeof config === "object" ? config : {};
    const weekKey = cleanId(source.weekKey == null ? source.week : source.weekKey) || "untracked";
    const careerStatus = normalizeCareerStatus(source.careerStatus);
    const capacityTotal = wholeNumber(
      source.capacity && typeof source.capacity === "object" ? source.capacity.total : source.capacity,
      DEFAULT_WEEKLY_CAPACITY,
      1,
      MAX_CAPACITY,
    );
    const entries = recalculateRepetition(workEntries(source.work, weekKey));
    if (new Set(entries.map(entry => entry.id)).size !== entries.length) {
      throw plannerError("DUPLICATE_ENTRY_ID", "Deux quarts de travail utilisent le même identifiant.");
    }
    const workCapacity = entries.reduce((sum, entry) => sum + entry.capacityCost, 0);
    if (workCapacity > capacityTotal) {
      throw plannerError("WORK_EXCEEDS_CAPACITY", "Le travail pré-réservé dépasse la capacité de la semaine.", {
        capacityTotal,
        workCapacity,
      });
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      kind: STATE_KIND,
      status: "draft",
      mode: "manual",
      weekKey,
      careerStatus,
      revision: 0,
      nextEntrySequence: 1,
      capacity: { total: capacityTotal },
      condition: normalizeCondition(source.condition),
      limits: {
        recreationalPhysicalActivities: wholeNumber(
          source.limits && source.limits.recreationalPhysicalActivities,
          DEFAULT_RECREATIONAL_PHYSICAL_LIMIT,
          0,
          DAYS.length,
        ),
        family: normalizeFamilyLimits(source.limits && source.limits.family, careerStatus),
      },
      supplements: normalizeSupplements(source.supplements),
      entries: clone(entries),
      quickTemplate: Array.isArray(source.quickPlan) ? clone(source.quickPlan.slice(0, MAX_ENTRIES)) : [],
      confirmation: null,
    };
  }

  function assertPlannerState(source) {
    if (!source || typeof source !== "object"
      || source.kind !== STATE_KIND
      || source.schemaVersion !== SCHEMA_VERSION
      || !Array.isArray(source.entries)
      || !source.capacity || !source.condition || !source.supplements || !source.limits) {
      throw plannerError("INVALID_PLANNER_STATE", "État du planificateur hebdomadaire invalide.");
    }
    return source;
  }

  function migratePlannerState(source) {
    if (!source || typeof source !== "object" || source.kind !== STATE_KIND) return source;
    if (source.schemaVersion === SCHEMA_VERSION) return clone(source);
    if (source.schemaVersion !== LEGACY_SCHEMA_VERSION) return source;
    const next = clone(source);
    next.schemaVersion = SCHEMA_VERSION;
    next.careerStatus = normalizeCareerStatus(next.careerStatus);
    next.limits = next.limits && typeof next.limits === "object" ? next.limits : {};
    next.limits.recreationalPhysicalActivities = wholeNumber(
      next.limits.recreationalPhysicalActivities,
      DEFAULT_RECREATIONAL_PHYSICAL_LIMIT,
      0,
      DAYS.length,
    );
    next.limits.family = normalizeFamilyLimits(next.limits.family, next.careerStatus);
    next.entries = recalculateRepetition((Array.isArray(next.entries) ? next.entries : []).map(entry => {
      if (!entry || typeof entry !== "object") return entry;
      const activity = normalizeActivity({ ...entry, id: entry.activityId });
      return { ...entry, metadata: activity.metadata };
    }));
    return next;
  }

  function restorePlanner(source) {
    const state = clone(assertPlannerState(migratePlannerState(source)));
    const validation = validatePlan(state);
    if (!validation.ok) {
      throw plannerError("INVALID_PLANNER_STATE", "Le planificateur sauvegardé contient un plan invalide.", validation.errors);
    }
    return state;
  }

  function assertEditable(state) {
    if (state.status !== "draft") {
      throw plannerError("PLAN_ALREADY_CONFIRMED", "Ce plan est déjà confirmé et ne peut plus être modifié.");
    }
  }

  function accessForActivity(state, activity) {
    if (activity.allowedCareerStatuses.length && !activity.allowedCareerStatuses.includes(state.careerStatus)) {
      return {
        ok: false,
        code: "CAREER_STATUS_REQUIRED",
        reason: "Cette activité n'est pas disponible pour le statut de carrière actuel.",
      };
    }
    if (state.careerStatus !== "recreational") return { ok: true, code: null, reason: "" };
    if (activity.recreationalAllowed === true) return { ok: true, code: null, reason: "" };
    if (activity.recreationalAllowed === false
      || RECREATIONAL_BLOCKED_CATEGORIES.includes(activity.category)
      || RECREATIONAL_BLOCKED_LOCATIONS.includes(activity.location)) {
      return {
        ok: false,
        code: "RECREATIONAL_ACTIVITY_LOCKED",
        reason: "Cette activité se débloque après le passage amateur.",
      };
    }
    return { ok: true, code: null, reason: "" };
  }

  function usedCapacity(entries) {
    return roundTo(entries.reduce((sum, entry) => sum + finiteNumber(entry.capacityCost), 0));
  }

  function occupiedPhysicalDays(entries, excludedEntryId) {
    const occupied = new Set();
    entries.forEach(entry => {
      if (entry.id !== excludedEntryId && entry.physical === true) occupied.add(entry.dayIndex);
    });
    return occupied;
  }

  function findPhysicalDay(entries, requestedDay, strictDay) {
    const occupied = occupiedPhysicalDays(entries);
    const start = requestedDay == null ? 0 : resolveDayIndex(requestedDay);
    if (strictDay && occupied.has(start)) return null;
    for (let offset = 0; offset < DAYS.length; offset += 1) {
      const dayIndex = (start + offset) % DAYS.length;
      if (!occupied.has(dayIndex)) return dayIndex;
      if (strictDay) break;
    }
    return null;
  }

  function quoteActivity(source, activityInput, options = {}) {
    const state = assertPlannerState(source);
    const activity = normalizeActivity(activityInput);
    const access = accessForActivity(state, activity);
    if (!access.ok) return { ...access, activity };
    const used = usedCapacity(state.entries);
    if (used + activity.capacityCost > state.capacity.total) {
      return {
        ok: false,
        code: "WEEKLY_CAPACITY_EXCEEDED",
        reason: "La capacité hebdomadaire restante est insuffisante.",
        activity,
        capacity: { total: state.capacity.total, used, remaining: state.capacity.total - used },
      };
    }
    if (state.careerStatus === "recreational" && activity.physical) {
      const count = state.entries.filter(entry => entry.physical).length;
      if (count >= state.limits.recreationalPhysicalActivities) {
        return {
          ok: false,
          code: "RECREATIONAL_PHYSICAL_LIMIT",
          reason: "La charge physique du parcours récréatif est déjà complète pour cette semaine.",
          activity,
        };
      }
    }
    const familyId = familyFor(activity);
    if (familyId) {
      const limit = wholeNumber(state.limits.family && state.limits.family[familyId], 0, 0, DAYS.length);
      const count = state.entries.filter(entry => familyFor(entry) === familyId).length;
      if (count >= limit) {
        return {
          ok: false,
          code: "WEEKLY_FAMILY_LIMIT",
          reason: `La limite hebdomadaire de la famille « ${familyId} » est atteinte.`,
          activity,
          family: { id: familyId, count, limit },
        };
      }
    }
    let dayIndex;
    if (activity.physical) {
      const requested = options.day == null ? options.preferredDay : options.day;
      dayIndex = findPhysicalDay(state.entries, requested, options.strictDay === true);
      if (dayIndex == null) {
        return {
          ok: false,
          code: "DAILY_PHYSICAL_LIMIT",
          reason: options.strictDay
            ? "Une autre activité physique est déjà prévue cette journée."
            : "Chaque journée contient déjà une activité physique.",
          activity,
        };
      }
    } else {
      dayIndex = resolveDayIndex(options.day == null ? options.preferredDay : options.day, 0);
    }
    return {
      ok: true,
      code: null,
      reason: "",
      activity,
      day: DAYS[dayIndex].id,
      dayIndex,
      capacity: {
        total: state.capacity.total,
        usedAfter: used + activity.capacityCost,
        remainingAfter: state.capacity.total - used - activity.capacityCost,
      },
    };
  }

  function nextEntryId(state) {
    let sequence = wholeNumber(state.nextEntrySequence, 1, 1, Number.MAX_SAFE_INTEGER);
    let id = `plan-${state.weekKey}-${sequence}`;
    const ids = new Set(state.entries.map(entry => entry.id));
    while (ids.has(id)) {
      sequence += 1;
      id = `plan-${state.weekKey}-${sequence}`;
    }
    return { id, nextSequence: sequence + 1 };
  }

  function addActivity(source, activityInput, options = {}) {
    const current = assertPlannerState(source);
    assertEditable(current);
    if (current.entries.length >= MAX_ENTRIES) {
      throw plannerError("PLAN_ENTRY_LIMIT", "Le plan contient déjà le nombre maximal d'activités.");
    }
    const quote = quoteActivity(current, activityInput, options);
    if (!quote.ok) throw plannerError(quote.code, quote.reason, quote);
    const next = clone(current);
    const generated = nextEntryId(next);
    const requestedEntryId = cleanId(options.entryId);
    const entryId = requestedEntryId || generated.id;
    if (next.entries.some(entry => entry.id === entryId)) {
      throw plannerError("DUPLICATE_ENTRY_ID", `L'identifiant ${entryId} est déjà utilisé.`);
    }
    const entry = {
      id: entryId,
      ...clone(quote.activity),
      day: quote.day,
      dayIndex: quote.dayIndex,
      source: options.source === "quick" ? "quick" : "manual",
      preReserved: false,
      locked: false,
      supplementId: null,
    };
    next.entries.push(entry);
    next.entries = recalculateRepetition(next.entries);
    const storedEntry = next.entries.find(candidate => candidate.id === entry.id);
    next.nextEntrySequence = generated.nextSequence;
    next.revision += 1;
    return {
      state: next,
      result: { action: "added", entry: clone(storedEntry), capacityReserved: storedEntry.capacityCost },
      preview: previewPlan(next),
    };
  }

  function locateEntry(state, entryId) {
    const id = cleanId(entryId);
    const index = state.entries.findIndex(entry => entry.id === id);
    if (index < 0) throw plannerError("UNKNOWN_PLAN_ENTRY", `Activité planifiée inconnue : ${id || "—"}.`);
    return { id, index, entry: state.entries[index] };
  }

  function removeActivity(source, entryId) {
    const current = assertPlannerState(source);
    assertEditable(current);
    const found = locateEntry(current, entryId);
    if (found.entry.locked) {
      throw plannerError("PLAN_ENTRY_LOCKED", "Cette réservation obligatoire ne peut pas être retirée.");
    }
    const next = clone(current);
    next.entries.splice(found.index, 1);
    next.entries = recalculateRepetition(next.entries);
    next.revision += 1;
    return {
      state: next,
      result: {
        action: "removed",
        entry: clone(found.entry),
        capacityRefunded: found.entry.capacityCost,
        supplementRefunded: found.entry.supplementId || null,
      },
      preview: previewPlan(next),
    };
  }

  function editableActivity(entry, patch) {
    const activityPatch = patch && patch.activity && typeof patch.activity === "object" ? patch.activity : patch || {};
    return normalizeActivity({
      id: activityPatch.id == null ? entry.activityId : activityPatch.id,
      label: activityPatch.label == null ? entry.label : activityPatch.label,
      category: activityPatch.category == null ? entry.category : activityPatch.category,
      location: activityPatch.location == null ? entry.location : activityPatch.location,
      physical: activityPatch.physical == null ? entry.physical : activityPatch.physical,
      capacityCost: activityPatch.capacityCost == null ? entry.capacityCost : activityPatch.capacityCost,
      energyCost: activityPatch.energyCost == null ? entry.energyCost : activityPatch.energyCost,
      energyGain: activityPatch.energyGain == null ? entry.energyGain : activityPatch.energyGain,
      fatigueDelta: activityPatch.fatigueDelta == null ? entry.fatigueDelta : activityPatch.fatigueDelta,
      pay: activityPatch.pay == null ? entry.pay : activityPatch.pay,
      recreationalAllowed: activityPatch.recreationalAllowed == null
        ? entry.recreationalAllowed
        : activityPatch.recreationalAllowed,
      allowedCareerStatuses: activityPatch.allowedCareerStatuses == null
        ? entry.allowedCareerStatuses
        : activityPatch.allowedCareerStatuses,
      metadata: activityPatch.metadata == null ? entry.metadata : activityPatch.metadata,
    });
  }

  function editActivity(source, entryId, patch = {}) {
    const current = assertPlannerState(source);
    assertEditable(current);
    const found = locateEntry(current, entryId);
    if (found.entry.locked) {
      throw plannerError("PLAN_ENTRY_LOCKED", "Cette réservation obligatoire ne peut pas être modifiée.");
    }
    const activity = editableActivity(found.entry, patch);
    const base = clone(current);
    base.entries.splice(found.index, 1);
    const hasDay = Object.prototype.hasOwnProperty.call(patch, "day");
    const quote = quoteActivity(base, activity, {
      day: hasDay ? patch.day : found.entry.day,
      strictDay: patch.strictDay === true,
    });
    if (!quote.ok) throw plannerError(quote.code, quote.reason, quote);
    const nextEntry = {
      ...clone(found.entry),
      ...clone(quote.activity),
      id: found.entry.id,
      day: quote.day,
      dayIndex: quote.dayIndex,
      supplementId: quote.activity.physical ? found.entry.supplementId : null,
    };
    base.entries.push(nextEntry);
    base.entries = recalculateRepetition(base.entries);
    const storedEntry = base.entries.find(candidate => candidate.id === nextEntry.id);
    base.revision = current.revision + 1;
    return {
      state: base,
      result: {
        action: "edited",
        before: clone(found.entry),
        entry: clone(storedEntry),
        capacityRefunded: Math.max(0, found.entry.capacityCost - storedEntry.capacityCost),
        capacityAdded: Math.max(0, storedEntry.capacityCost - found.entry.capacityCost),
        supplementRefunded: found.entry.supplementId && !storedEntry.supplementId
          ? found.entry.supplementId
          : null,
      },
      preview: previewPlan(base),
    };
  }

  function baseForQuickPlan(current, options) {
    const keepManual = options.keepManual === true;
    const next = clone(current);
    next.entries = next.entries.filter(entry => entry.preReserved || (keepManual && entry.source === "manual"));
    next.mode = "quick";
    return next;
  }

  function quickSpec(value) {
    if (value && typeof value === "object" && value.activity && typeof value.activity === "object") {
      return {
        activity: value.activity,
        options: {
          day: value.day,
          preferredDay: value.preferredDay,
          strictDay: value.strictDay === true,
          source: "quick",
        },
      };
    }
    return {
      activity: value,
      options: {
        day: value && typeof value === "object" ? value.day : undefined,
        preferredDay: value && typeof value === "object" ? value.preferredDay : undefined,
        strictDay: Boolean(value && typeof value === "object" && value.strictDay === true),
        source: "quick",
      },
    };
  }

  function applyQuickPlan(source, templateInput, options = {}) {
    const current = assertPlannerState(source);
    assertEditable(current);
    const supplied = templateInput == null ? current.quickTemplate : templateInput;
    if (!Array.isArray(supplied)) {
      throw plannerError("INVALID_QUICK_PLAN", "Le plan rapide doit être une liste d'activités.");
    }
    if (supplied.length > MAX_ENTRIES) {
      throw plannerError("PLAN_ENTRY_LIMIT", "Le plan rapide contient trop d'activités.");
    }
    let working = baseForQuickPlan(current, options);
    const removedEntryIds = current.entries
      .filter(entry => !working.entries.some(candidate => candidate.id === entry.id))
      .map(entry => entry.id);
    const addedEntryIds = [];
    supplied.forEach(value => {
      const spec = quickSpec(value);
      const outcome = addActivity(working, spec.activity, spec.options);
      working = outcome.state;
      addedEntryIds.push(outcome.result.entry.id);
    });
    working.revision = current.revision + 1;
    working.mode = "quick";
    return {
      state: working,
      result: {
        action: "quick-plan-applied",
        editable: true,
        removedEntryIds,
        addedEntryIds,
      },
      preview: previewPlan(working),
    };
  }

  function canReserveSupplement(source, entryId, productId) {
    const state = assertPlannerState(source);
    const id = cleanId(productId);
    let found;
    try {
      found = locateEntry(state, entryId);
    } catch (error) {
      return { ok: false, code: error.code, reason: error.message };
    }
    if (state.careerStatus === "recreational") {
      return { ok: false, code: "SUPPLEMENTS_LOCKED", reason: "Les suppléments se débloquent après le passage amateur." };
    }
    if (!found.entry.physical) {
      return { ok: false, code: "SUPPLEMENT_REQUIRES_PHYSICAL_ACTIVITY", reason: "Un supplément doit être lié à une activité physique." };
    }
    if (!id || !Object.prototype.hasOwnProperty.call(state.supplements.inventory, id)) {
      return { ok: false, code: "SUPPLEMENT_NOT_IN_INVENTORY", reason: "Ce supplément n'est pas dans l'inventaire." };
    }
    if (found.entry.supplementId === id) {
      return { ok: true, duplicate: true, productId: id, entry: clone(found.entry) };
    }
    const otherReservations = state.entries
      .filter(entry => entry.id !== found.entry.id && entry.supplementId)
      .map(entry => entry.supplementId);
    if (state.supplements.alreadyUsed + otherReservations.length >= state.supplements.weeklyLimit) {
      return { ok: false, code: "WEEKLY_SUPPLEMENT_LIMIT", reason: "La limite hebdomadaire de suppléments est atteinte." };
    }
    if (state.supplements.uniqueProducts
      && (state.supplements.usedProductIds.includes(id) || otherReservations.includes(id))) {
      return { ok: false, code: "SUPPLEMENT_ALREADY_RESERVED", reason: "Ce produit est déjà utilisé ou réservé cette semaine." };
    }
    const reservedQuantity = otherReservations.filter(candidate => candidate === id).length;
    if (reservedQuantity >= state.supplements.inventory[id]) {
      return { ok: false, code: "SUPPLEMENT_STOCK_RESERVED", reason: "Toutes les unités de ce produit sont déjà réservées." };
    }
    return {
      ok: true,
      duplicate: false,
      productId: id,
      entry: clone(found.entry),
      replacing: found.entry.supplementId || null,
    };
  }

  function reserveSupplement(source, entryId, productId) {
    const current = assertPlannerState(source);
    assertEditable(current);
    const check = canReserveSupplement(current, entryId, productId);
    if (!check.ok) throw plannerError(check.code, check.reason, check);
    if (check.duplicate) {
      return {
        state: clone(current),
        result: { action: "supplement-reserved", duplicate: true, entryId: check.entry.id, productId: check.productId },
        preview: previewPlan(current),
      };
    }
    const next = clone(current);
    const found = locateEntry(next, entryId);
    const previous = found.entry.supplementId;
    found.entry.supplementId = check.productId;
    next.revision += 1;
    return {
      state: next,
      result: {
        action: "supplement-reserved",
        duplicate: false,
        entryId: found.entry.id,
        productId: check.productId,
        supplementRefunded: previous || null,
      },
      preview: previewPlan(next),
    };
  }

  function unreserveSupplement(source, entryId) {
    const current = assertPlannerState(source);
    assertEditable(current);
    const found = locateEntry(current, entryId);
    if (!found.entry.supplementId) {
      return {
        state: clone(current),
        result: { action: "supplement-unreserved", duplicate: true, entryId: found.entry.id, productId: null },
        preview: previewPlan(current),
      };
    }
    const next = clone(current);
    const productId = next.entries[found.index].supplementId;
    next.entries[found.index].supplementId = null;
    next.revision += 1;
    return {
      state: next,
      result: { action: "supplement-unreserved", duplicate: false, entryId: found.entry.id, productId },
      preview: previewPlan(next),
    };
  }

  function energyZone(value) {
    if (value < 15) return { id: "critical", label: "Réserve critique" };
    if (value < 30) return { id: "low", label: "Réserve faible" };
    if (value < 50) return { id: "watch", label: "Réserve à surveiller" };
    return { id: "comfortable", label: "Réserve confortable" };
  }

  function fatigueZone(value) {
    if (value >= 75) return { id: "critical", label: "Fatigue critique" };
    if (value >= 55) return { id: "high", label: "Fatigue élevée" };
    if (value >= 35) return { id: "managed", label: "Charge soutenue" };
    return { id: "fresh", label: "Charge légère" };
  }

  function sortEntries(entries) {
    return [...entries].sort((left, right) => (
      left.dayIndex - right.dayIndex
      || (left.source === "work" ? -1 : 1) - (right.source === "work" ? -1 : 1)
      || left.id.localeCompare(right.id)
    ));
  }

  function previewPlan(source) {
    const state = assertPlannerState(source);
    const entries = sortEntries(state.entries).map(clone);
    const capacityUsed = usedCapacity(entries);
    const workCapacity = usedCapacity(entries.filter(entry => entry.preReserved));
    const totals = entries.reduce((sum, entry) => ({
      energyCost: roundTo(sum.energyCost + finiteNumber(entry.energyCost)),
      energyGain: roundTo(sum.energyGain + finiteNumber(entry.energyGain)),
      fatigueDelta: roundTo(sum.fatigueDelta + finiteNumber(entry.fatigueDelta)),
      pay: roundTo(sum.pay + finiteNumber(entry.pay)),
    }), { energyCost: 0, energyGain: 0, fatigueDelta: 0, pay: 0 });
    const projectedEnergy = roundTo(finiteNumber(
      state.condition.energy - totals.energyCost + totals.energyGain,
      0,
      0,
      100,
    ));
    const projectedFatigue = roundTo(finiteNumber(
      state.condition.fatigue + totals.fatigueDelta,
      0,
      0,
      100,
    ));
    const reservationIds = entries.filter(entry => entry.supplementId).map(entry => entry.supplementId);
    const familyCounts = entries.reduce((counts, entry) => {
      const familyId = familyFor(entry);
      if (familyId) counts[familyId] = (counts[familyId] || 0) + 1;
      return counts;
    }, {});
    const inventoryAvailable = { ...state.supplements.inventory };
    reservationIds.forEach(id => { inventoryAvailable[id] = Math.max(0, finiteNumber(inventoryAvailable[id]) - 1); });
    const perDay = DAYS.map(day => {
      const dayEntries = entries.filter(entry => entry.day === day.id);
      return {
        id: day.id,
        label: day.label,
        entries: dayEntries,
        physicalEntryId: dayEntries.find(entry => entry.physical)?.id || null,
      };
    });
    const reserve = energyZone(projectedEnergy);
    const fatigue = fatigueZone(projectedFatigue);
    const warnings = [];
    if (state.capacity.total - capacityUsed <= 1) warnings.push("La capacité de la semaine est presque entièrement réservée.");
    if (["low", "critical"].includes(reserve.id)) warnings.push(reserve.label + ".");
    if (["high", "critical"].includes(fatigue.id)) warnings.push(fatigue.label + ".");
    return {
      weekKey: state.weekKey,
      status: state.status,
      mode: state.mode,
      revision: state.revision,
      entries,
      perDay,
      capacity: {
        total: state.capacity.total,
        used: capacityUsed,
        remaining: roundTo(state.capacity.total - capacityUsed),
        workReserved: workCapacity,
        discretionaryReserved: roundTo(capacityUsed - workCapacity),
      },
      condition: {
        before: clone(state.condition),
        projected: { energy: projectedEnergy, fatigue: projectedFatigue },
        energyReserve: { value: projectedEnergy, ...reserve },
        fatigueZone: { value: projectedFatigue, ...fatigue },
      },
      totals,
      families: Object.fromEntries(Object.entries(state.limits.family || {}).map(([familyId, limit]) => [familyId, {
        used: familyCounts[familyId] || 0,
        limit,
        remaining: Math.max(0, limit - (familyCounts[familyId] || 0)),
      }])),
      supplements: {
        weeklyLimit: state.supplements.weeklyLimit,
        alreadyUsed: state.supplements.alreadyUsed,
        reserved: reservationIds.length,
        remainingUses: Math.max(0, state.supplements.weeklyLimit - state.supplements.alreadyUsed - reservationIds.length),
        reservations: entries
          .filter(entry => entry.supplementId)
          .map(entry => ({ entryId: entry.id, productId: entry.supplementId })),
        inventoryAvailable,
      },
      warnings,
    };
  }

  function validationError(code, reason, details) {
    return { code, reason, ...(details === undefined ? {} : { details }) };
  }

  function validatePlan(source) {
    const state = assertPlannerState(source);
    const errors = [];
    if (!["draft", "confirmed"].includes(state.status)) {
      errors.push(validationError("INVALID_PLAN_STATUS", `Statut de plan invalide : ${state.status || "—"}.`));
    }
    if (!Number.isInteger(state.revision) || state.revision < 0) {
      errors.push(validationError("INVALID_PLAN_REVISION", "La révision du plan est invalide."));
    }
    if (!Number.isInteger(state.capacity.total)
      || state.capacity.total < 1
      || state.capacity.total > MAX_CAPACITY) {
      errors.push(validationError("INVALID_WEEKLY_CAPACITY", "La capacité hebdomadaire est invalide."));
    }
    if (state.entries.length > MAX_ENTRIES) {
      errors.push(validationError("PLAN_ENTRY_LIMIT", "Le plan contient trop d'activités."));
    }
    const ids = new Set();
    const physicalDays = new Map();
    const familyCounts = {};
    const expectedRepetition = new Map(recalculateRepetition(state.entries).map(entry => [entry.id, entry.metadata || {}]));
    let recreationalPhysical = 0;
    const reservations = [];
    state.entries.forEach((entry, index) => {
      if (!entry || typeof entry !== "object") {
        errors.push(validationError("INVALID_PLAN_ENTRY", `Entrée invalide à la position ${index + 1}.`));
        return;
      }
      if (!cleanId(entry.id) || ids.has(entry.id)) {
        errors.push(validationError("DUPLICATE_ENTRY_ID", `Identifiant d'entrée invalide ou dupliqué : ${entry.id || "—"}.`));
      }
      ids.add(entry.id);
      let dayIndex;
      try {
        dayIndex = resolveDayIndex(entry.day);
      } catch (error) {
        errors.push(validationError(error.code, error.message, { entryId: entry.id }));
        return;
      }
      if (entry.dayIndex !== dayIndex) {
        errors.push(validationError("PLAN_DAY_MISMATCH", `Le jour de ${entry.id} est incohérent.`));
      }
      let activity;
      try {
        activity = normalizeActivity({ ...entry, id: entry.activityId });
      } catch (error) {
        errors.push(validationError(error.code || "INVALID_ACTIVITY", error.message, { entryId: entry.id }));
        return;
      }
      if (entry.activityId !== activity.activityId
        || entry.category !== activity.category
        || entry.location !== activity.location
        || typeof entry.physical !== "boolean"
        || entry.physical !== activity.physical
        || entry.capacityCost !== activity.capacityCost
        || entry.energyCost !== activity.energyCost
        || entry.energyGain !== activity.energyGain
        || entry.fatigueDelta !== activity.fatigueDelta) {
        errors.push(validationError("INVALID_PLAN_ENTRY", `Les valeurs de ${entry.id} ne sont pas canoniques.`));
      }
      if (!["work", "manual", "quick"].includes(entry.source)) {
        errors.push(validationError("INVALID_PLAN_ENTRY_SOURCE", `La source de ${entry.id} est invalide.`));
      }
      if (entry.preReserved && (entry.category !== "work" || entry.location !== "work" || entry.physical)) {
        errors.push(validationError("INVALID_WORK_ACTIVITY", `Le quart ${entry.id} n'est plus une réservation de travail valide.`));
      }
      const access = accessForActivity(state, activity);
      if (!access.ok) errors.push(validationError(access.code, access.reason, { entryId: entry.id }));
      if (entry.physical) {
        recreationalPhysical += 1;
        const familyId = familyFor(activity);
        if (familyId) familyCounts[familyId] = (familyCounts[familyId] || 0) + 1;
        const expectedMetadata = expectedRepetition.get(entry.id) || {};
        if (programSignatureFor(activity)
          && (Number(entry.metadata?.gainMultiplier) !== Number(expectedMetadata.gainMultiplier)
            || Number(entry.metadata?.repeatIndex) !== Number(expectedMetadata.repeatIndex))) {
          errors.push(validationError("INVALID_REPEAT_ADJUSTMENT", `La réduction de répétition de ${entry.id} est incohérente.`));
        }
        if (physicalDays.has(dayIndex)) {
          errors.push(validationError("DAILY_PHYSICAL_LIMIT", "Deux activités physiques occupent la même journée.", {
            firstEntryId: physicalDays.get(dayIndex),
            secondEntryId: entry.id,
          }));
        } else physicalDays.set(dayIndex, entry.id);
      }
      if (entry.supplementId) {
        if (!entry.physical) {
          errors.push(validationError("SUPPLEMENT_REQUIRES_PHYSICAL_ACTIVITY", "Un supplément est lié à une activité non physique.", { entryId: entry.id }));
        }
        reservations.push({ entryId: entry.id, productId: entry.supplementId });
      }
    });
    const capacityUsed = usedCapacity(state.entries);
    if (capacityUsed > state.capacity.total) {
      errors.push(validationError("WEEKLY_CAPACITY_EXCEEDED", "La capacité hebdomadaire est dépassée."));
    }
    if (state.careerStatus === "recreational"
      && recreationalPhysical > state.limits.recreationalPhysicalActivities) {
      errors.push(validationError("RECREATIONAL_PHYSICAL_LIMIT", "La limite physique récréative est dépassée."));
    }
    Object.entries(familyCounts).forEach(([familyId, count]) => {
      const limit = wholeNumber(state.limits.family && state.limits.family[familyId], 0, 0, DAYS.length);
      if (count > limit) {
        errors.push(validationError("WEEKLY_FAMILY_LIMIT", `La limite hebdomadaire de la famille « ${familyId} » est dépassée.`, {
          familyId,
          count,
          limit,
        }));
      }
    });
    if (state.careerStatus === "recreational" && reservations.length) {
      errors.push(validationError("SUPPLEMENTS_LOCKED", "Les suppléments sont verrouillés au statut récréatif."));
    }
    if (state.supplements.alreadyUsed + reservations.length > state.supplements.weeklyLimit) {
      errors.push(validationError("WEEKLY_SUPPLEMENT_LIMIT", "La limite hebdomadaire de suppléments est dépassée."));
    }
    const reservationCounts = {};
    reservations.forEach(({ productId }) => { reservationCounts[productId] = (reservationCounts[productId] || 0) + 1; });
    Object.entries(reservationCounts).forEach(([productId, quantity]) => {
      if (quantity > finiteNumber(state.supplements.inventory[productId])) {
        errors.push(validationError("SUPPLEMENT_STOCK_RESERVED", `Réservation excédentaire pour ${productId}.`));
      }
      if (state.supplements.uniqueProducts && quantity > 1) {
        errors.push(validationError("SUPPLEMENT_ALREADY_RESERVED", `Le produit ${productId} est réservé plusieurs fois.`));
      }
      if (state.supplements.uniqueProducts && state.supplements.usedProductIds.includes(productId)) {
        errors.push(validationError("SUPPLEMENT_ALREADY_USED", `Le produit ${productId} a déjà été utilisé.`));
      }
    });
    let preview = null;
    try {
      preview = previewPlan(state);
    } catch (error) {
      errors.push(validationError(error.code || "INVALID_PLAN_PREVIEW", error.message));
    }
    return { ok: errors.length === 0, errors, preview };
  }

  function commitFor(state, transactionId, validation) {
    const inventoryAfter = { ...state.supplements.inventory };
    validation.preview.supplements.reservations.forEach(({ productId }) => {
      inventoryAfter[productId] = Math.max(0, finiteNumber(inventoryAfter[productId]) - 1);
    });
    return {
      schemaVersion: SCHEMA_VERSION,
      kind: "boxeur-v2-week-plan-commit",
      transactionId,
      weekKey: state.weekKey,
      sourceRevision: state.revision,
      mode: state.mode,
      careerStatus: state.careerStatus,
      entries: clone(validation.preview.entries),
      capacity: clone(validation.preview.capacity),
      projectedCondition: clone(validation.preview.condition.projected),
      supplementReservations: clone(validation.preview.supplements.reservations),
      supplementInventoryBefore: clone(state.supplements.inventory),
      supplementInventoryAfter: inventoryAfter,
      supplementUsesAfter: state.supplements.alreadyUsed + validation.preview.supplements.reserved,
    };
  }

  function confirmPlan(source, options = {}) {
    const current = assertPlannerState(source);
    const transactionId = cleanId(options.transactionId);
    if (!transactionId) {
      throw plannerError("TRANSACTION_ID_REQUIRED", "Un identifiant de transaction est requis pour confirmer la semaine.");
    }
    if (current.status === "confirmed") {
      if (current.confirmation && current.confirmation.transactionId === transactionId) {
        return {
          state: clone(current),
          result: { action: "confirmed", duplicate: true, transactionId },
          commit: clone(current.confirmation.commit),
        };
      }
      throw plannerError("PLAN_ALREADY_CONFIRMED", "Ce plan a déjà été confirmé par une autre transaction.");
    }
    if (options.expectedRevision != null && Number(options.expectedRevision) !== current.revision) {
      throw plannerError("STALE_PLAN_REVISION", "Le plan a changé depuis son dernier affichage.", {
        expectedRevision: Number(options.expectedRevision),
        actualRevision: current.revision,
      });
    }
    const validation = validatePlan(current);
    if (!validation.ok) {
      throw plannerError("PLAN_VALIDATION_FAILED", "Le plan complet est invalide; aucune réservation n'a été débitée.", validation.errors);
    }
    const commit = commitFor(current, transactionId, validation);
    const next = clone(current);
    next.status = "confirmed";
    next.revision += 1;
    next.confirmation = {
      transactionId,
      confirmedRevision: next.revision,
      commit: clone(commit),
    };
    return {
      state: next,
      result: { action: "confirmed", duplicate: false, transactionId },
      commit,
      preview: validation.preview,
    };
  }

  return Object.freeze({
    SCHEMA_VERSION,
    STATE_KIND,
    DEFAULT_WEEKLY_CAPACITY,
    DEFAULT_RECREATIONAL_PHYSICAL_LIMIT,
    DEFAULT_SUPPLEMENT_LIMIT,
    DEFAULT_FAMILY_LIMITS,
    REPEAT_GAIN_MULTIPLIER,
    MAX_ENTRIES,
    DAYS,
    ACTIVITY_CATEGORIES,
    LOCATIONS,
    PHYSICAL_CATEGORIES,
    normalizeCareerStatus,
    normalizeActivity,
    createPlanner,
    restorePlanner,
    accessForActivity,
    quoteActivity,
    addActivity,
    editActivity,
    removeActivity,
    applyQuickPlan,
    canReserveSupplement,
    reserveSupplement,
    unreserveSupplement,
    previewPlan,
    validatePlan,
    confirmPlan,
  });
});
