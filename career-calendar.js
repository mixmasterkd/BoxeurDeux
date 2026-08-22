(function attachBoxeurCalendar(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurCalendar = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurCalendar() {
  "use strict";

  const CALENDAR_VERSION = 1;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const DEFAULT_EPOCH = "2026-01-05"; // Un lundi; le calendrier du jeu reste reproductible.

  const DEFAULT_COSTS = Object.freeze({
    midCommute: 28,
    midHotelTravel: 22,
    farTravel: 48,
    regionalGalaTravel: 34,
    hotelNight: 52,
    regionalGalaNight: 62,
  });

  const DEFAULT_TOURNAMENT_SCHEDULE = Object.freeze([
    // Les fenêtres donnent le temps d'alterner galas et récupération avant les grands rendez-vous.
    Object.freeze({ id: "bronze", name: "Gants de bronze", firstWeek: 16, rounds: 3, participants: 8, entryFee: 45, eligibility: Object.freeze({ type: "fight-count", min: 0, max: 5 }) }),
    Object.freeze({ id: "silver", name: "Gants d'argent", firstWeek: 32, rounds: 3, participants: 8, entryFee: 60, eligibility: Object.freeze({ type: "fight-count", min: 0, max: 10 }) }),
    Object.freeze({ id: "golden", name: "Gants dorés", firstWeek: 46, repeatEveryWeeks: 20, rounds: 3, participants: 8, entryFee: 80, eligibility: Object.freeze({ type: "fight-count", min: 10 }) }),
    Object.freeze({ id: "canadian", name: "Championnat canadien", firstWeek: 60, repeatEveryWeeks: 24, rounds: 5, participants: 32, entryFee: 120, eligibility: Object.freeze({ type: "medal", tournamentId: "golden", medal: "gold" }) }),
    Object.freeze({ id: "olympic", name: "Parcours olympique", firstWeek: 76, repeatEveryWeeks: 32, rounds: 5, participants: 32, entryFee: 150, eligibility: Object.freeze({ type: "medal", tournamentId: "canadian", medal: "gold" }) }),
    Object.freeze({
      id: "regional-cup",
      name: "Coupe régionale des clubs",
      firstWeek: 11,
      repeatEveryWeeks: 14,
      rounds: 3,
      participants: 8,
      entryFee: 55,
      independent: true,
      baseDifficulty: 50,
      divisions: Object.freeze([
        Object.freeze({ id: "novice", label: "Division Relève · 0–10 combats", eligibility: Object.freeze({ type: "fight-count", min: 0, max: 10 }), difficultyOffset: -2 }),
        Object.freeze({ id: "open", label: "Division Ouverte · 10 combats ou plus", eligibility: Object.freeze({ type: "fight-count", min: 10 }), difficultyOffset: 3 }),
      ]),
    }),
  ]);

  const LOCAL_VENUES = Object.freeze([
    Object.freeze({ id: "centre-sud", name: "Centre sportif du Sud-Ouest", city: "Montréal", region: "QC" }),
    Object.freeze({ id: "maison-jeunes", name: "Maison des jeunes Saint-Michel", city: "Montréal", region: "QC" }),
    Object.freeze({ id: "arena-est", name: "Aréna de l'Est", city: "Montréal", region: "QC" }),
    Object.freeze({ id: "club-rive", name: "Club de boxe de la Rive", city: "Longueuil", region: "QC" }),
  ]);

  const REGIONAL_VENUES = Object.freeze([
    Object.freeze({ id: "sherbrooke", name: "Gala de l'Estrie", city: "Sherbrooke", region: "QC" }),
    Object.freeze({ id: "trois-rivieres", name: "Gala de la Mauricie", city: "Trois-Rivières", region: "QC" }),
    Object.freeze({ id: "quebec", name: "Gala de la Capitale", city: "Québec", region: "QC" }),
    Object.freeze({ id: "gatineau", name: "Gala de l'Outaouais", city: "Gatineau", region: "QC" }),
  ]);

  const TOURNAMENT_VENUES = Object.freeze([
    Object.freeze({ id: "montreal", city: "Montréal", region: "QC", travelTier: "local" }),
    Object.freeze({ id: "laval", city: "Laval", region: "QC", travelTier: "mid" }),
    Object.freeze({ id: "sherbrooke", city: "Sherbrooke", region: "QC", travelTier: "mid" }),
    Object.freeze({ id: "quebec", city: "Québec", region: "QC", travelTier: "far" }),
  ]);

  function assertInteger(value, label, minimum) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < minimum) throw new TypeError(`${label} doit être un entier >= ${minimum}.`);
    return parsed;
  }

  function parseIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) throw new TypeError(`Date ISO invalide : ${value}`);
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) throw new TypeError(`Date ISO invalide : ${value}`);
    return date;
  }

  function formatIsoDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function addDays(isoDate, amount) {
    const date = parseIsoDate(isoDate);
    date.setUTCDate(date.getUTCDate() + Number(amount || 0));
    return formatIsoDate(date);
  }

  function daysBetween(first, second) {
    return Math.round((parseIsoDate(second) - parseIsoDate(first)) / DAY_MS);
  }

  function startOfWeek(isoDate) {
    const date = parseIsoDate(isoDate);
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - mondayOffset);
    return formatIsoDate(date);
  }

  function normalizeEpoch(value) {
    return startOfWeek(value || DEFAULT_EPOCH);
  }

  function weekStartDate(epoch, week) {
    return addDays(normalizeEpoch(epoch), (assertInteger(week, "week", 1) - 1) * 7);
  }

  function dateForCareerWeek(epoch, week, weekdayOffset) {
    const offset = assertInteger(weekdayOffset == null ? 0 : weekdayOffset, "weekdayOffset", 0);
    if (offset > 6) throw new RangeError("weekdayOffset doit être compris entre 0 et 6.");
    return addDays(weekStartDate(epoch, week), offset);
  }

  function careerWeekForDate(epoch, isoDate) {
    return Math.floor(daysBetween(normalizeEpoch(epoch), isoDate) / 7) + 1;
  }

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value);
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function deterministicUnit(seed, key) {
    let value = hashString(`${seed}|${key}`) || 1;
    value += 0x6D2B79F5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  function deterministicPick(values, seed, key) {
    if (!Array.isArray(values) || !values.length) throw new TypeError("Une liste non vide est requise.");
    return values[Math.floor(deterministicUnit(seed, key) * values.length)];
  }

  function slug(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normalizeConfig(options) {
    const source = options || {};
    return {
      epoch: normalizeEpoch(source.epoch || source.careerStartDate || DEFAULT_EPOCH),
      seed: String(source.seed || "boxeur-deux"),
      horizonWeeks: assertInteger(source.horizonWeeks == null ? 6 : source.horizonWeeks, "horizonWeeks", 1),
      regionalGalaChance: Math.max(0, Math.min(1, Number(source.regionalGalaChance == null ? 0.45 : source.regionalGalaChance))),
      homeGym: {
        id: String(source.homeGym?.id || "gym-boxeur-deux"),
        name: String(source.homeGym?.name || "GYM de boxe du quartier"),
        city: String(source.homeGym?.city || "Montréal"),
        region: String(source.homeGym?.region || "QC"),
      },
      costs: { ...DEFAULT_COSTS, ...(source.costs || {}) },
      tournaments: Array.isArray(source.tournaments) ? source.tournaments : DEFAULT_TOURNAMENT_SCHEDULE,
      localVenues: Array.isArray(source.localVenues) && source.localVenues.length ? source.localVenues : LOCAL_VENUES,
      regionalVenues: Array.isArray(source.regionalVenues) && source.regionalVenues.length ? source.regionalVenues : REGIONAL_VENUES,
      tournamentVenues: Array.isArray(source.tournamentVenues) && source.tournamentVenues.length ? source.tournamentVenues : TOURNAMENT_VENUES,
      recoveryBufferDays: assertInteger(source.recoveryBufferDays == null ? 1 : source.recoveryBufferDays, "recoveryBufferDays", 0),
    };
  }

  function configSnapshot(config) {
    return JSON.parse(JSON.stringify({
      horizonWeeks: config.horizonWeeks,
      regionalGalaChance: config.regionalGalaChance,
      homeGym: config.homeGym,
      costs: config.costs,
      tournaments: config.tournaments,
      localVenues: config.localVenues,
      regionalVenues: config.regionalVenues,
      tournamentVenues: config.tournamentVenues,
      recoveryBufferDays: config.recoveryBufferDays,
    }));
  }

  function opponentSlots(scope) {
    if (scope === "home-gym") return [
      { id: "safe", ratingOffset: -3, label: "Adversaire accessible" },
      { id: "even", ratingOffset: 0, label: "Combat équilibré" },
      { id: "challenge", ratingOffset: 2, label: "Défi relevé" },
    ];
    if (scope === "regional") return [
      { id: "even", ratingOffset: -1, label: "Combat serré" },
      { id: "challenge", ratingOffset: 2, label: "Défi régional" },
      { id: "ambitious", ratingOffset: 4, label: "Grand défi" },
    ];
    return [
      { id: "safe", ratingOffset: -4, label: "Adversaire accessible" },
      { id: "even", ratingOffset: -1, label: "Combat serré" },
      { id: "challenge", ratingOffset: 2, label: "Défi risqué" },
    ];
  }

  function createGalaEvent(input) {
    const scope = input.scope || "local";
    const date = input.date;
    parseIsoDate(date);
    const venue = input.venue || {};
    const isHome = scope === "home-gym";
    const isRegional = scope === "regional";
    return {
      id: input.id || `gala-${scope}-${slug(venue.id || venue.name || "venue")}-${date}`,
      kind: "gala",
      scope,
      name: input.name || (isHome ? "Gala mensuel du GYM" : isRegional ? venue.name || "Gala régional" : "Gala local"),
      startDate: date,
      endDate: date,
      fightDates: [date],
      careerWeek: input.careerWeek || null,
      venue: {
        id: String(venue.id || `${scope}-venue`),
        name: String(venue.name || (isHome ? "GYM de boxe" : "Salle amateur")),
        city: String(venue.city || "Montréal"),
        region: String(venue.region || "QC"),
      },
      entryFee: 0,
      travelTier: isRegional ? "far" : "local",
      lodgingRequired: isRegional,
      lodgingNights: isRegional ? 1 : 0,
      weighInRequired: false,
      judges: 3,
      homeAdvantage: isHome ? { coachReadBonus: 0.02, openingComposure: 2 } : null,
      opponentSlots: opponentSlots(scope),
      eligibility: { type: "career-status", status: "amateur" },
    };
  }

  function chosenTournamentVenue(template, config) {
    const candidates = template.id === "bronze"
      ? config.tournamentVenues.filter(item => item.travelTier !== "far")
      : config.tournamentVenues;
    return deterministicPick(candidates.length ? candidates : config.tournamentVenues, config.seed, `tournament-venue-${template.id}-${template.firstWeek}`);
  }

  function createTournamentEvent(template, options) {
    const config = normalizeConfig(options);
    const rounds = assertInteger(template.rounds, "rounds", 1);
    const finalDate = dateForCareerWeek(config.epoch, template.firstWeek, 5);
    const startDate = addDays(finalDate, -(rounds - 1));
    const venue = template.venue || chosenTournamentVenue(template, config);
    const fightDates = Array.from({ length: rounds }, (_, index) => addDays(startDate, index));
    return {
      id: template.eventId || `tournament-${slug(template.id)}-${startDate}`,
      tournamentId: template.id,
      kind: "tournament",
      scope: "tournament",
      name: template.name,
      startDate,
      endDate: finalDate,
      fightDates,
      careerWeek: template.firstWeek,
      rounds,
      participants: template.participants || 2 ** rounds,
      independent: Boolean(template.independent),
      baseDifficulty: Number.isFinite(Number(template.baseDifficulty)) ? Number(template.baseDifficulty) : null,
      divisions: Array.isArray(template.divisions) ? template.divisions.map(division => ({
        id: String(division.id),
        label: String(division.label),
        eligibility: { ...(division.eligibility || {}) },
        difficultyOffset: Number(division.difficultyOffset) || 0,
      })) : [],
      venue: { id: venue.id, name: venue.name || template.name, city: venue.city, region: venue.region },
      entryFee: Math.max(0, Number(template.entryFee || 0)),
      travelTier: venue.travelTier || template.travelTier || "local",
      lodgingRequired: (venue.travelTier || template.travelTier) === "far",
      lodgingNights: Math.max(0, rounds - 1),
      weighInRequired: true,
      judges: 5,
      registrationDeadline: addDays(startDate, -14),
      eligibility: { ...(template.eligibility || { type: "career-status", status: "amateur" }), checkAt: "check-in" },
    };
  }

  function selectedHomeSaturday(year, monthIndex, seed) {
    const first = new Date(Date.UTC(year, monthIndex, 1));
    const daysToSaturday = (6 - first.getUTCDay() + 7) % 7;
    const occurrence = deterministicUnit(seed, `home-gym-${year}-${monthIndex + 1}`) < 0.5 ? 1 : 2;
    first.setUTCDate(1 + daysToSaturday + occurrence * 7); // Deuxième ou troisième samedi.
    return formatIsoDate(first);
  }

  function homeGymDatesInRange(startDate, endDate, seed) {
    const cursor = parseIsoDate(startDate);
    cursor.setUTCDate(1);
    const last = parseIsoDate(endDate);
    const dates = [];
    while (cursor <= last) {
      const date = selectedHomeSaturday(cursor.getUTCFullYear(), cursor.getUTCMonth(), seed);
      if (date >= startDate && date <= endDate) dates.push(date);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
    }
    return dates;
  }

  function generateEvents(options) {
    const config = normalizeConfig(options);
    const startWeek = assertInteger(options?.startWeek == null ? 1 : options.startWeek, "startWeek", 1);
    const weeks = assertInteger(options?.weeks == null ? config.horizonWeeks : options.weeks, "weeks", 1);
    const endWeek = startWeek + weeks - 1;
    const startDate = weekStartDate(config.epoch, startWeek);
    const endDate = addDays(weekStartDate(config.epoch, endWeek), 6);
    const events = [];

    for (let week = startWeek; week <= endWeek; week += 1) {
      const saturday = dateForCareerWeek(config.epoch, week, 5);
      const localVenue = deterministicPick(config.localVenues, config.seed, `local-${week}`);
      events.push(createGalaEvent({
        scope: "local",
        date: saturday,
        careerWeek: week,
        venue: localVenue,
        name: `Gala local · ${localVenue.name}`,
      }));

      // Les débuts de carrière offrent plus de choix, pas plus d'un combat possible par semaine.
      if (week <= 12 && deterministicUnit(config.seed, `early-local-${week}`) < 0.68) {
        const alternateVenue = deterministicPick(config.localVenues, config.seed, `early-local-venue-${week}`);
        events.push(createGalaEvent({
          scope: "local",
          date: dateForCareerWeek(config.epoch, week, deterministicUnit(config.seed, `early-local-day-${week}`) < 0.5 ? 4 : 5),
          careerWeek: week,
          venue: alternateVenue,
          name: `Gala local · ${alternateVenue.name}`,
        }));
      }

      if (deterministicUnit(config.seed, `regional-presence-${week}`) < config.regionalGalaChance) {
        const regionalVenue = deterministicPick(config.regionalVenues, config.seed, `regional-venue-${week}`);
        const weekday = deterministicUnit(config.seed, `regional-day-${week}`) < 0.42 ? 4 : 5;
        events.push(createGalaEvent({
          scope: "regional",
          date: dateForCareerWeek(config.epoch, week, weekday),
          careerWeek: week,
          venue: regionalVenue,
          name: regionalVenue.name,
        }));
      }
    }

    for (const date of homeGymDatesInRange(startDate, endDate, config.seed)) {
      events.push(createGalaEvent({
        scope: "home-gym",
        date,
        careerWeek: careerWeekForDate(config.epoch, date),
        venue: config.homeGym,
        name: `Gala mensuel · ${config.homeGym.name}`,
      }));
    }

    for (const tournament of config.tournaments) {
      if (!Number.isInteger(Number(tournament.firstWeek))) continue;
      const interval = Math.max(0, Math.round(Number(tournament.repeatEveryWeeks) || 0));
      for (let occurrenceWeek = Number(tournament.firstWeek); occurrenceWeek <= endWeek; occurrenceWeek += interval || endWeek + 1) {
        const occurrence = { ...tournament, firstWeek: occurrenceWeek, eventId: null };
        const event = createTournamentEvent(occurrence, config);
        if (event.endDate >= startDate && event.startDate <= endDate) events.push(event);
        if (!interval) break;
      }
    }

    return events.sort((left, right) => left.startDate.localeCompare(right.startDate) || left.id.localeCompare(right.id));
  }

  function generateCalendar(options) {
    const config = normalizeConfig(options);
    const startWeek = assertInteger(options?.startWeek == null ? 1 : options.startWeek, "startWeek", 1);
    const weeks = assertInteger(options?.weeks == null ? config.horizonWeeks : options.weeks, "weeks", 1);
    return {
      version: CALENDAR_VERSION,
      epoch: config.epoch,
      seed: config.seed,
      startWeek,
      endWeek: startWeek + weeks - 1,
      startDate: weekStartDate(config.epoch, startWeek),
      endDate: addDays(weekStartDate(config.epoch, startWeek + weeks - 1), 6),
      settings: configSnapshot(config),
      events: generateEvents({ ...config, startWeek, weeks }),
    };
  }

  function extendCalendar(calendar, options) {
    if (!calendar || !Array.isArray(calendar.events)) throw new TypeError("Calendrier invalide.");
    const throughWeek = assertInteger(options?.throughWeek, "throughWeek", calendar.endWeek || 1);
    if (throughWeek <= calendar.endWeek) return { ...calendar, events: calendar.events.map(event => ({ ...event })) };
    const generationOptions = { ...(calendar.settings || {}), ...(options || {}) };
    const added = generateEvents({
      ...generationOptions,
      epoch: calendar.epoch,
      seed: calendar.seed,
      startWeek: calendar.endWeek + 1,
      weeks: throughWeek - calendar.endWeek,
    });
    const byId = new Map([...calendar.events, ...added].map(event => [event.id, event]));
    return {
      ...calendar,
      endWeek: throughWeek,
      endDate: addDays(weekStartDate(calendar.epoch, throughWeek), 6),
      settings: configSnapshot(normalizeConfig({ ...generationOptions, epoch: calendar.epoch, seed: calendar.seed })),
      events: [...byId.values()].sort((left, right) => left.startDate.localeCompare(right.startDate) || left.id.localeCompare(right.id)),
    };
  }

  function nextTournamentPreview(options) {
    const config = normalizeConfig(options);
    const afterWeek = assertInteger(options?.afterWeek == null ? 1 : options.afterWeek, "afterWeek", 1);
    const future = config.tournaments.map(item => {
      const firstWeek = Number(item.firstWeek);
      const interval = Math.max(0, Math.round(Number(item.repeatEveryWeeks) || 0));
      if (firstWeek >= afterWeek) return { ...item, firstWeek };
      if (!interval) return null;
      const occurrence = firstWeek + Math.ceil((afterWeek - firstWeek) / interval) * interval;
      return { ...item, firstWeek: occurrence };
    }).filter(Boolean).sort((left, right) => left.firstWeek - right.firstWeek)[0];
    return future ? createTournamentEvent(future, config) : null;
  }

  function amateurFightCount(recordOrCareer) {
    const record = recordOrCareer?.amateurRecord || recordOrCareer || {};
    return [record.wins, record.losses, record.draws].reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  }

  function medalCount(career, tournamentId, medal) {
    return Math.max(0, Number(career?.medals?.[tournamentId]?.[medal]) || 0);
  }

  function projectedFightCountBefore(career, bookings, beforeDate) {
    let count = amateurFightCount(career);
    for (const booking of bookings || []) {
      if (["cancelled", "withdrawn"].includes(booking?.status)) continue;
      const event = booking.event || booking;
      if (!event?.startDate || event.startDate >= beforeDate) continue;
      if (event.kind === "gala") count += 1;
      else if (event.kind === "tournament") count += Math.max(1, Number(booking.expectedBouts ?? event.rounds) || 1);
    }
    return count;
  }

  function divisionForEvent(event, divisionId) {
    if (!Array.isArray(event?.divisions) || !event.divisions.length) return null;
    return event.divisions.find(division => division.id === divisionId) || null;
  }

  function eventForDivision(event, divisionId) {
    if (!Array.isArray(event?.divisions) || !event.divisions.length) return event;
    const division = divisionForEvent(event, divisionId);
    if (!division) return null;
    return {
      ...event,
      name: `${event.name} · ${division.label}`,
      eligibility: { ...(division.eligibility || {}) },
      divisions: [],
      selectedDivision: { ...division, eligibility: { ...(division.eligibility || {}) } },
      divisionId: division.id,
      baseDifficulty: (Number(event.baseDifficulty) || 0) + (Number(division.difficultyOffset) || 0),
    };
  }

  function evaluateEligibility(event, career, options) {
    if (!event) return { eligible: false, code: "missing-event", reason: "Événement introuvable." };
    if (career?.careerStatus === "professional") return { eligible: false, code: "not-amateur", reason: "Le circuit amateur est fermé." };
    const division = divisionForEvent(event, options?.divisionId);
    if (Array.isArray(event.divisions) && event.divisions.length && !division) {
      return { eligible: false, code: "division-required", reason: "Choisis une division de tournoi." };
    }
    const rule = division?.eligibility || event.eligibility || { type: "career-status", status: "amateur" };
    if (rule.type === "fight-count") {
      const count = Number.isFinite(Number(options?.fightCount))
        ? Math.max(0, Number(options.fightCount))
        : options?.includeBookings
          ? projectedFightCountBefore(career, options.bookings, event.startDate)
          : amateurFightCount(career);
      const min = Number.isFinite(Number(rule.min)) ? Number(rule.min) : 0;
      const max = Number.isFinite(Number(rule.max)) ? Number(rule.max) : Infinity;
      if (count < min) return { eligible: false, code: "too-few-fights", reason: `${min} combats amateurs sont requis.`, fightCount: count, min, max };
      if (count > max) return { eligible: false, code: "too-many-fights", reason: `La limite est de ${max} combats avant le tournoi.`, fightCount: count, min, max };
      return { eligible: true, code: "eligible", reason: "Admissible.", fightCount: count, min, max };
    }
    if (rule.type === "medal") {
      const count = medalCount(career, rule.tournamentId, rule.medal || "gold");
      return count > 0
        ? { eligible: true, code: "eligible", reason: "Admissible.", medalCount: count }
        : { eligible: false, code: "missing-medal", reason: `Une médaille ${rule.medal || "gold"} au tournoi ${rule.tournamentId} est requise.`, medalCount: 0 };
    }
    return { eligible: true, code: "eligible", reason: "Admissible." };
  }

  function isBronzeEligible(recordOrCareer, options) {
    const count = Number.isFinite(Number(options?.fightCount))
      ? Number(options.fightCount)
      : typeof recordOrCareer === "number"
        ? recordOrCareer
        : amateurFightCount(recordOrCareer);
    return count >= 0 && count <= 5;
  }

  function travelOptionsForEvent(event, options) {
    const config = normalizeConfig(options);
    if (!event) return [];
    if (event.kind === "gala" && event.scope === "regional") {
      return [{
        id: "regional-hotel",
        label: "Transport et hébergement",
        travelCost: config.costs.regionalGalaTravel,
        lodgingNights: 1,
        nightlyRate: config.costs.regionalGalaNight,
        energyDelta: -2,
        fatigueDelta: 2,
        required: true,
      }];
    }
    if (event.travelTier === "mid") {
      return [
        { id: "commute", label: "Faire l'aller-retour", travelCost: config.costs.midCommute * Math.max(1, event.rounds || 1), lodgingNights: 0, nightlyRate: 0, energyDelta: -4, fatigueDelta: 5, required: false },
        { id: "hotel", label: "Loger près du site", travelCost: config.costs.midHotelTravel, lodgingNights: Math.max(1, event.lodgingNights || 1), nightlyRate: config.costs.hotelNight, energyDelta: -1, fatigueDelta: 1, required: false },
      ];
    }
    if (event.travelTier === "far" || event.lodgingRequired) {
      return [{ id: "hotel", label: "Transport et hébergement obligatoires", travelCost: config.costs.farTravel, lodgingNights: Math.max(1, event.lodgingNights || 1), nightlyRate: config.costs.hotelNight, energyDelta: -2, fatigueDelta: 2, required: true }];
    }
    return [{ id: "none", label: "Aucun déplacement payant", travelCost: 0, lodgingNights: 0, nightlyRate: 0, energyDelta: 0, fatigueDelta: 0, required: true }];
  }

  function quoteEventCost(event, travelOptionId, options) {
    const choices = travelOptionsForEvent(event, options);
    const choice = choices.find(item => item.id === travelOptionId) || (choices.length === 1 ? choices[0] : null);
    if (!choice) return { valid: false, code: "travel-choice-required", reason: "Choisis le transport et l'hébergement." };
    const entryFee = Math.max(0, Number(event.entryFee) || 0);
    const travel = Math.max(0, Number(choice.travelCost) || 0);
    const lodging = Math.max(0, Number(choice.lodgingNights) || 0) * Math.max(0, Number(choice.nightlyRate) || 0);
    return {
      valid: true,
      code: "quoted",
      eventId: event.id,
      travelOptionId: choice.id,
      items: { entryFee, travel, lodging },
      total: entryFee + travel + lodging,
      effects: { energy: choice.energyDelta || 0, fatigue: choice.fatigueDelta || 0 },
      lodgingNights: choice.lodgingNights || 0,
    };
  }

  function bookingInterval(event, travelOptionId, options) {
    const config = normalizeConfig(options);
    const choice = travelOptionsForEvent(event, config).find(item => item.id === travelOptionId) || travelOptionsForEvent(event, config)[0];
    const travelBuffer = event.travelTier === "far" || event.scope === "regional" ? 1 : 0;
    return {
      startDate: addDays(event.startDate, -travelBuffer),
      endDate: addDays(event.endDate, config.recoveryBufferDays),
      travelOptionId: choice?.id || null,
    };
  }

  function rangesOverlap(first, second) {
    return first.startDate <= second.endDate && second.startDate <= first.endDate;
  }

  function findBookingConflicts(event, bookings, travelOptionId, options) {
    const candidate = bookingInterval(event, travelOptionId, options);
    return (bookings || []).filter(booking => {
      if (["cancelled", "withdrawn"].includes(booking?.status)) return false;
      const bookedEvent = booking.event || booking;
      if (!bookedEvent?.startDate || !bookedEvent?.endDate) return false;
      const interval = booking.interval || bookingInterval(bookedEvent, booking.travelOptionId, options);
      return bookedEvent.id !== event.id && rangesOverlap(candidate, interval);
    });
  }

  function createBooking(input) {
    const event = input?.event;
    if (!event) return { ok: false, code: "missing-event", reason: "Événement introuvable." };
    const bookedEvent = eventForDivision(event, input.divisionId);
    if (!bookedEvent) return { ok: false, code: "division-required", reason: "Choisis une division de tournoi." };
    const duplicate = (input.existingBookings || []).find(booking => booking?.eventId === event.id && !["cancelled", "withdrawn"].includes(booking.status));
    if (duplicate) return { ok: false, code: "already-booked", reason: "Cet événement est déjà réservé.", booking: duplicate };
    if (input.currentDate) {
      parseIsoDate(input.currentDate);
      if (input.currentDate > bookedEvent.startDate) return { ok: false, code: "event-started", reason: "Cet événement a déjà commencé." };
      if (bookedEvent.kind === "tournament" && bookedEvent.registrationDeadline && input.currentDate > bookedEvent.registrationDeadline) {
        return { ok: false, code: "registration-closed", reason: "La période d'inscription est terminée." };
      }
    }
    const eligibility = evaluateEligibility(bookedEvent, input.career || {}, {
      bookings: input.existingBookings,
      includeBookings: input.includeProjectedBookings !== false,
      fightCount: input.fightCount,
    });
    if (!eligibility.eligible) return { ok: false, ...eligibility };
    const quote = quoteEventCost(bookedEvent, input.travelOptionId, input.config);
    if (!quote.valid) return { ok: false, ...quote };
    const conflicts = findBookingConflicts(bookedEvent, input.existingBookings, quote.travelOptionId, input.config);
    if (conflicts.length) return { ok: false, code: "date-conflict", reason: "Un autre combat occupe cette date.", conflicts };
    const money = Math.max(0, Number(input.career?.money) || 0);
    if (money < quote.total) return { ok: false, code: "insufficient-funds", reason: `Il manque ${quote.total - money} $.`, quote };
    const registeredOn = input.registeredOn || input.currentDate || bookedEvent.registrationDeadline || bookedEvent.startDate;
    const booking = {
      id: `booking-${bookedEvent.id}`,
      eventId: bookedEvent.id,
      divisionId: bookedEvent.divisionId || null,
      event: JSON.parse(JSON.stringify(bookedEvent)),
      status: "registered",
      registeredOn,
      travelOptionId: quote.travelOptionId,
      interval: bookingInterval(bookedEvent, quote.travelOptionId, input.config),
      payment: { total: quote.total, status: "paid", transactionId: `entry-${bookedEvent.id}` },
      travelEffects: quote.effects,
      eligibilityAtRegistration: eligibility,
      eligibilitySnapshot: null,
      weighInStatus: bookedEvent.weighInRequired ? "pending" : "not-required",
      expectedBouts: bookedEvent.kind === "tournament" ? bookedEvent.rounds : 1,
      grandfathered: false,
    };
    return { ok: true, code: "booked", booking, quote, moneyDelta: -quote.total, moneyAfter: money - quote.total };
  }

  function checkInTournament(booking, career, options) {
    const event = booking?.event || options?.event;
    if (!event || event.kind !== "tournament") return { ok: false, code: "not-tournament", reason: "Ce check-in est réservé aux tournois." };
    const eligibility = evaluateEligibility(event, career || {}, { fightCount: options?.fightCount });
    if (!eligibility.eligible) return { ok: false, ...eligibility };
    return {
      ok: true,
      code: "checked-in",
      eligibilitySnapshot: { ...eligibility, checkedAt: options?.checkedAt || event.startDate, frozenForEvent: true },
    };
  }

  function eventsOnDate(events, date) {
    parseIsoDate(date);
    return (events || []).filter(event => event.startDate <= date && event.endDate >= date);
  }

  function groupEventsByDate(events) {
    return (events || []).reduce((groups, event) => {
      (groups[event.startDate] ||= []).push(event);
      return groups;
    }, {});
  }

  function legacyWeekToDate(week, options) {
    const epoch = normalizeEpoch(options?.epoch || options?.careerStartDate || DEFAULT_EPOCH);
    const weekdayOffset = options?.weekdayOffset == null ? 5 : options.weekdayOffset;
    return dateForCareerWeek(epoch, week, weekdayOffset);
  }

  function legacyLocalEvent(scheduledFight, options) {
    const date = legacyWeekToDate(scheduledFight.week || options.currentWeek || 1, options);
    const opponent = scheduledFight.opponent || {};
    return {
      ...createGalaEvent({
        id: `legacy-local-${slug(scheduledFight.id || opponent.id || "fight")}-${date}`,
        scope: "local",
        date,
        careerWeek: scheduledFight.week || options.currentWeek || 1,
        venue: { id: "legacy-local", name: "Gala local déjà programmé", city: "Montréal", region: "QC" },
        name: "Combat local déjà programmé",
      }),
      legacyOpponent: opponent,
    };
  }

  function legacyTournamentEvent(activeTournament, options) {
    const template = (options.tournaments || DEFAULT_TOURNAMENT_SCHEDULE).find(item => item.id === activeTournament.id) || {
      id: activeTournament.id,
      name: activeTournament.name || "Tournoi amateur",
      rounds: activeTournament.opponents?.length || 3,
      participants: 8,
      entryFee: 0,
      eligibility: { type: "career-status", status: "amateur" },
    };
    const rounds = Math.max(1, Number(template.rounds) || activeTournament.opponents?.length || 3);
    const finalDate = legacyWeekToDate(activeTournament.startWeek || options.currentWeek || 1, options);
    const startDate = addDays(finalDate, -(rounds - 1));
    return {
      id: `legacy-tournament-${slug(activeTournament.id)}-${startDate}`,
      tournamentId: activeTournament.id,
      kind: "tournament",
      scope: "tournament",
      name: template.name,
      startDate,
      endDate: finalDate,
      fightDates: Array.from({ length: rounds }, (_, index) => addDays(startDate, index)),
      careerWeek: activeTournament.startWeek || options.currentWeek || 1,
      rounds,
      participants: template.participants || 2 ** rounds,
      venue: { id: "legacy-tournament", name: template.name, city: "Montréal", region: "QC" },
      entryFee: 0,
      travelTier: "local",
      lodgingRequired: false,
      lodgingNights: 0,
      weighInRequired: true,
      judges: 5,
      registrationDeadline: addDays(startDate, -14),
      eligibility: { ...(template.eligibility || {}), checkAt: "check-in" },
      legacyTournament: JSON.parse(JSON.stringify(activeTournament)),
    };
  }

  function grandfatheredBooking(event, status) {
    return {
      id: `booking-${event.id}`,
      eventId: event.id,
      event: JSON.parse(JSON.stringify(event)),
      status: status || "registered",
      registeredOn: null,
      travelOptionId: "legacy-free",
      interval: { startDate: event.startDate, endDate: event.endDate, travelOptionId: "legacy-free" },
      payment: { total: 0, status: "grandfathered", transactionId: null },
      travelEffects: { energy: 0, fatigue: 0 },
      eligibilityAtRegistration: { eligible: true, code: "legacy-grandfathered" },
      eligibilitySnapshot: { eligible: true, code: "legacy-grandfathered", frozenForEvent: true },
      weighInStatus: event.kind === "tournament" ? "accepted-grandfathered" : "not-required",
      expectedBouts: event.kind === "tournament" ? event.rounds : 1,
      grandfathered: true,
    };
  }

  function migrateLegacyState(legacyState, options) {
    const source = legacyState || {};
    const config = normalizeConfig(options);
    const currentWeek = Math.max(1, Number(source.week) || 1);
    if (source.calendar?.version >= CALENDAR_VERSION) return JSON.parse(JSON.stringify(source.calendar));
    const events = [];
    const bookings = [];
    let activeCompetitionId = null;

    if (source.activeTournament) {
      const event = legacyTournamentEvent(source.activeTournament, { ...config, currentWeek });
      events.push(event);
      bookings.push(grandfatheredBooking(event, source.activeTournament.status === "completed" ? "completed" : "registered"));
      activeCompetitionId = event.id;
    }

    if (source.scheduledFight && !source.scheduledFight.tournamentId) {
      const event = legacyLocalEvent(source.scheduledFight, { ...config, currentWeek });
      events.push(event);
      bookings.push(grandfatheredBooking(event));
    }

    return {
      version: CALENDAR_VERSION,
      epoch: config.epoch,
      seed: config.seed,
      currentWeek,
      currentDate: weekStartDate(config.epoch, currentWeek),
      generatedThroughWeek: currentWeek,
      settings: configSnapshot(config),
      events,
      bookings,
      activeCompetitionId,
      migratedFromVersion: Number(options?.legacySaveVersion || 3),
    };
  }

  return Object.freeze({
    CALENDAR_VERSION,
    DEFAULT_EPOCH,
    DEFAULT_COSTS,
    DEFAULT_TOURNAMENT_SCHEDULE,
    addDays,
    startOfWeek,
    normalizeEpoch,
    weekStartDate,
    dateForCareerWeek,
    careerWeekForDate,
    deterministicUnit,
    deterministicPick,
    createGalaEvent,
    createTournamentEvent,
    generateEvents,
    generateCalendar,
    extendCalendar,
    nextTournamentPreview,
    amateurFightCount,
    projectedFightCountBefore,
    divisionForEvent,
    eventForDivision,
    evaluateEligibility,
    isBronzeEligible,
    travelOptionsForEvent,
    quoteEventCost,
    bookingInterval,
    findBookingConflicts,
    createBooking,
    checkInTournament,
    eventsOnDate,
    groupEventsByDate,
    legacyWeekToDate,
    legacyLocalEvent,
    legacyTournamentEvent,
    migrateLegacyState,
  });
});
