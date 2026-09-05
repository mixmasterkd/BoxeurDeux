(function attachBoxeurRoster(root, factory) {
  "use strict";
  const commonjs = typeof module === "object" && module.exports;
  const api = factory(commonjs ? require("./roster-catalog.js") : root.BoxeurRosterCatalog,
    commonjs ? require("./combat-engine.js") : root.BoxeurCombat);
  if (commonjs) module.exports = api;
  if (root) root.BoxeurRoster = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createRosterEngine(catalog, combat) {
  "use strict";

  if (!catalog || !combat?.createSeededRng || !combat.LEGACY_WEIGHTS) {
    throw new Error("Le bassin requiert son catalogue et le moteur de combat.");
  }
  const SCHEMA_VERSION = 1;
  const RULES_VERSION = 1;
  const STATE_KIND = "boxeur-roster";
  const PLAYER_ID = "player";
  const STAT_KEYS = Object.freeze(["technique", "power", "cardio", "defense"]);
  const RECORD_KEYS = ["wins", "losses", "draws"];
  const CONFIG = Object.freeze({
    statMin: 1, statMax: 99, historyLimit: 1000,
    fightInterval: 4, rematchInterval: 8, maximumLevelGap: 8,
    ceilingSlowdownRange: 4, ceilingSnapGap: 0.01,
    progression: Object.freeze([
      Object.freeze({ below: 45, gain: 0.12 }), Object.freeze({ below: 55, gain: 0.08 }),
      Object.freeze({ below: 65, gain: 0.04 }), Object.freeze({ below: 100, gain: 0.02 }),
    ]),
  });
  const clone = value => JSON.parse(JSON.stringify(value));
  const round = value => Math.round((value + Number.EPSILON) * 10000) / 10000;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const compareIds = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  const average = vector => STAT_KEYS.reduce((sum, key) => sum + vector[key], 0) / STAT_KEYS.length;
  const pairKey = ids => JSON.stringify([...ids].sort(compareIds));

  function fail(code, message) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  function integer(value, name, min = 0, max = 9999999) {
    if (!Number.isSafeInteger(value) || value < min || value > max) fail("invalid-data", `${name} invalide.`);
    return value;
  }

  function textValue(value, name, maximum = 180) {
    if (typeof value !== "string" || !value.trim() || value.length > maximum) fail("invalid-data", `${name} invalide.`);
    return value;
  }

  function recordIsValid(record) {
    if (!record || typeof record !== "object") fail("invalid-data", "Bilan manquant.");
    RECORD_KEYS.forEach(key => integer(record[key], `Bilan ${key}`));
  }

  function vectorIsValid(vector) {
    if (!vector || typeof vector !== "object") fail("invalid-data", "Caractéristiques manquantes.");
    for (const key of STAT_KEYS) {
      if (!Number.isFinite(vector[key]) || vector[key] < CONFIG.statMin || vector[key] > CONFIG.statMax) {
        fail("invalid-data", `Caractéristique ${key} invalide.`);
      }
    }
  }

  function findFighter(state, id) {
    const fighter = state.fighters.find(item => item.id === id);
    if (!fighter) fail("unknown-fighter", "Cet affilié ne fait pas partie du bassin.");
    return fighter;
  }

  function participantExists(state, id) {
    return id === PLAYER_ID || state.fighters.some(fighter => fighter.id === id);
  }

  function familyForStyle(style) {
    if (/puncheur|pression|bagarreur/i.test(style)) return "attack";
    if (/technicien|mobile/i.test(style)) return "distance";
    if (/contre|défensif/i.test(style)) return "defense";
    return null;
  }

  function initialVectors(profile, levelOffset) {
    const offsets = /puncheur|pression|bagarreur/i.test(profile.style) ? [0, 5, -2, -3]
      : /technicien/i.test(profile.style) ? [4, -3, 0, -1]
        : /mobile/i.test(profile.style) ? [2, -3, 4, -3]
          : /contre|défensif/i.test(profile.style) ? [1, -3, -1, 3] : [1, 1, 0, -2];
    // Each call owns its RNG; neither rendering nor circuit matches consume the
    // RNG of an actual bout. Counterparts share the same permanent stat shape.
    const random = combat.createSeededRng(`roster-shape:${profile.counterpartId}`);
    const shape = offsets.map(offset => offset + Math.floor(random() * 5) - 2);
    const center = shape.reduce((sum, value) => sum + value, 0) / shape.length;
    return {
      stats: Object.fromEntries(STAT_KEYS.map((key, index) => [key,
        round(clamp(profile.initialLevel + levelOffset + shape[index] - center, CONFIG.statMin, CONFIG.statMax))])),
      ceilings: Object.fromEntries(STAT_KEYS.map((key, index) => [key,
        round(clamp(profile.ceiling + levelOffset + shape[index] - center, CONFIG.statMin, CONFIG.statMax))])),
    };
  }

  function createState(options = {}) {
    const sex = options.sex;
    const profiles = catalog.list(sex);
    const weightClass = textValue(options.weightClass, "Catégorie", 20);
    const seed = textValue(options.seed, "Graine du bassin");
    const startWeek = integer(options.startWeek ?? 1, "Semaine de début", 1, 99999);
    const levelOffset = options.initialLevelOffset ?? 0;
    if (!Number.isFinite(levelOffset) || levelOffset < 0 || levelOffset > 99) fail("invalid-data", "Décalage initial invalide.");
    const id = options.id == null
      ? `roster-${combat.createSeededRng(JSON.stringify([seed, sex, weightClass, startWeek])).getState().toString(16)}`
      : textValue(options.id, "Identifiant du bassin");
    return {
      kind: STATE_KIND, schemaVersion: SCHEMA_VERSION, rulesVersion: RULES_VERSION,
      id, seed, sex, weightClass, startWeek, lastProcessedWeek: startWeek - 1,
      initialLevelOffset: levelOffset,
      fighters: profiles.map(profile => ({
        id: profile.id, name: profile.name, nickname: profile.nickname, style: profile.style,
        ...initialVectors(profile, levelOffset),
        initialRecord: clone(profile.initialRecord), record: clone(profile.initialRecord), lastFightWeek: null,
      })),
      reservations: [], matches: [],
      archives: { count: 0, throughWeek: null, pairs: {} },
    };
  }

  function emptyPair(ids) {
    return { fighterIds: [...ids].sort(compareIds), wins: [0, 0], draws: 0, firstWeek: null, lastWeek: null };
  }

  function countPairMatch(pair, match) {
    if (match.winnerId == null) pair.draws += 1;
    else pair.wins[pair.fighterIds.indexOf(match.winnerId)] += 1;
    pair.firstWeek = pair.firstWeek == null ? match.week : Math.min(pair.firstWeek, match.week);
    pair.lastWeek = Math.max(pair.lastWeek || 0, match.week);
  }

  function pairTotals(state) {
    const pairs = clone(state.archives.pairs);
    for (const match of state.matches) {
      const key = pairKey(match.fighterIds);
      if (!pairs[key]) pairs[key] = emptyPair(match.fighterIds);
      countPairMatch(pairs[key], match);
    }
    return pairs;
  }

  /** Strict restore: malformed or future schemas must not silently reset a career. */
  function validateState(state, expected = {}) {
    if (!state || state.kind !== STATE_KIND || state.schemaVersion !== SCHEMA_VERSION || state.rulesVersion !== RULES_VERSION) {
      fail("unsupported-state", "Version du bassin non prise en charge.");
    }
    textValue(state.id, "Identifiant du bassin");
    textValue(state.seed, "Graine du bassin");
    textValue(state.weightClass, "Catégorie", 20);
    const profiles = catalog.list(state.sex);
    if ((expected.sex && expected.sex !== state.sex) || (expected.weightClass && expected.weightClass !== state.weightClass)) {
      fail("division-mismatch", "Le bassin appartient à une autre division ou catégorie.");
    }
    integer(state.startWeek, "Semaine de début", 1, 99999);
    integer(state.lastProcessedWeek, "Dernière semaine traitée", state.startWeek - 1, 99999);
    if (!Number.isFinite(state.initialLevelOffset) || state.initialLevelOffset < 0 || state.initialLevelOffset > 99) {
      fail("invalid-data", "Décalage initial invalide.");
    }
    if (!Array.isArray(state.fighters) || state.fighters.length !== profiles.length) fail("invalid-data", "Bassin incomplet.");
    const ids = new Set();
    for (const fighter of state.fighters) {
      if (!profiles.some(profile => profile.id === fighter.id) || ids.has(fighter.id)) fail("invalid-data", "Identité dupliquée ou inconnue.");
      ids.add(fighter.id);
      ["name", "nickname", "style"].forEach(key => textValue(fighter[key], key));
      vectorIsValid(fighter.stats);
      vectorIsValid(fighter.ceilings);
      recordIsValid(fighter.initialRecord);
      recordIsValid(fighter.record);
      if (fighter.lastFightWeek != null) integer(fighter.lastFightWeek, "Dernier combat", state.startWeek, state.lastProcessedWeek + 1);
    }
    if (!Array.isArray(state.reservations) || state.reservations.length > profiles.length) fail("invalid-data", "Réservations invalides.");
    const bookings = new Set();
    const reserved = new Set();
    for (const reservation of state.reservations) {
      textValue(reservation.bookingId, "Réservation");
      const fighter = findFighter(state, reservation.fighterId);
      if (bookings.has(reservation.bookingId) || reserved.has(fighter.id)) fail("invalid-data", "Réservation dupliquée.");
      bookings.add(reservation.bookingId);
      reserved.add(fighter.id);
      integer(reservation.createdWeek, "Semaine de réservation", state.startWeek, state.lastProcessedWeek + 1);
      integer(reservation.fightWeek, "Semaine du combat", Math.max(reservation.createdWeek, state.lastProcessedWeek + 1), 99999);
      if (!reservation.snapshot) fail("invalid-data", "Fiche réservée absente.");
      vectorIsValid(reservation.snapshot.stats);
      recordIsValid(reservation.snapshot.record);
      if (STAT_KEYS.some(key => fighter.stats[key] !== reservation.snapshot.stats[key])
        || RECORD_KEYS.some(key => fighter.record[key] !== reservation.snapshot.record[key])) {
        fail("reservation-drift", "La fiche réservée a été modifiée.");
      }
    }
    const validPair = pair => {
      if (!Array.isArray(pair) || pair.length !== 2 || pair[0] === pair[1] || pair.some(id => !participantExists(state, id))) {
        fail("invalid-data", "Participants invalides.");
      }
    };
    if (!state.archives || !state.archives.pairs || typeof state.archives.pairs !== "object" || Array.isArray(state.archives.pairs)) {
      fail("invalid-data", "Archives invalides.");
    }
    let archivedCount = 0;
    let archivedLastWeek = null;
    const archivedPairs = Object.entries(state.archives.pairs);
    if (archivedPairs.length > 55) fail("invalid-data", "Trop de paires archivées.");
    for (const [key, pair] of archivedPairs) {
      validPair(pair.fighterIds);
      if (key !== pairKey(pair.fighterIds) || compareIds(...pair.fighterIds) >= 0) fail("invalid-data", "Identité d'archive invalide.");
      if (!Array.isArray(pair.wins) || pair.wins.length !== 2) fail("invalid-data", "Bilan d'archive invalide.");
      pair.wins.forEach(value => integer(value, "Victoires archivées"));
      integer(pair.draws, "Nuls archivés");
      const count = pair.wins[0] + pair.wins[1] + pair.draws;
      if (count === 0) fail("invalid-data", "Archive vide.");
      integer(pair.firstWeek, "Début d'archive", state.startWeek, state.lastProcessedWeek + 1);
      integer(pair.lastWeek, "Fin d'archive", pair.firstWeek, state.lastProcessedWeek + 1);
      archivedCount += count;
      archivedLastWeek = Math.max(archivedLastWeek || 0, pair.lastWeek);
    }
    if (state.archives.count !== archivedCount || state.archives.throughWeek !== archivedLastWeek) {
      fail("invalid-data", "Cumuls d'archives incohérents.");
    }
    if (!Array.isArray(state.matches) || state.matches.length > CONFIG.historyLimit) fail("invalid-data", "Historique invalide.");
    const matchIds = new Set();
    const completedBookings = new Set();
    const automaticWeeks = new Set();
    let previousWeek = archivedLastWeek || state.startWeek;
    for (const match of state.matches) {
      textValue(match.id, "Identifiant de rencontre", 400);
      validPair(match.fighterIds);
      integer(match.week, "Semaine de rencontre", previousWeek, state.lastProcessedWeek + 1);
      previousWeek = match.week;
      if (matchIds.has(match.id)) fail("invalid-data", "Rencontre dupliquée.");
      matchIds.add(match.id);
      if (match.winnerId !== null && !match.fighterIds.includes(match.winnerId)) fail("invalid-data", "Vainqueur invalide.");
      if (match.source === "simulation") {
        if (match.fighterIds.includes(PLAYER_ID) || match.winnerId == null || match.method !== "decision"
          || match.week > state.lastProcessedWeek || automaticWeeks.has(match.week)) {
          fail("invalid-data", "Rencontre automatique invalide.");
        }
        automaticWeeks.add(match.week);
      } else if (match.source === "player") {
        if (!match.fighterIds.includes(PLAYER_ID)) fail("invalid-data", "Combat du joueur invalide.");
        textValue(match.bookingId, "Réservation du combat");
        if (completedBookings.has(match.bookingId) || bookings.has(match.bookingId)) {
          fail("invalid-data", "Une réservation terminée ne peut être comptée ou utilisée deux fois.");
        }
        completedBookings.add(match.bookingId);
      } else fail("invalid-data", "Origine de rencontre inconnue.");
      if (match.method !== null) textValue(match.method, "Méthode", 80);
    }
    // Reconcile every record against its baseline + retained/archived results.
    const totals = pairTotals(state);
    for (const fighter of state.fighters) {
      const record = clone(fighter.initialRecord);
      let lastWeek = null;
      for (const pair of Object.values(totals)) {
        const index = pair.fighterIds.indexOf(fighter.id);
        if (index === -1) continue;
        record.wins += pair.wins[index];
        record.losses += pair.wins[1 - index];
        record.draws += pair.draws;
        lastWeek = Math.max(lastWeek || 0, pair.lastWeek);
      }
      if (RECORD_KEYS.some(key => record[key] !== fighter.record[key]) || lastWeek !== fighter.lastFightWeek) {
        fail("record-mismatch", "Le bilan ne correspond pas aux rencontres suivies.");
      }
    }
    return true;
  }

  function restoreState(input, expected = {}) {
    validateState(input, expected);
    return clone(input);
  }

  function resultState(state, applied, reason, extra = {}) {
    return { state, applied, reason, ...extra };
  }

  function appendMatch(state, match) {
    for (const id of match.fighterIds) {
      if (id === PLAYER_ID) continue;
      const fighter = findFighter(state, id);
      const result = match.winnerId == null ? "draws" : match.winnerId === id ? "wins" : "losses";
      fighter.record[result] += 1;
      fighter.lastFightWeek = match.week;
    }
    state.matches.push(match);
    while (state.matches.length > CONFIG.historyLimit) {
      const old = state.matches.shift();
      const key = pairKey(old.fighterIds);
      if (!state.archives.pairs[key]) state.archives.pairs[key] = emptyPair(old.fighterIds);
      countPairMatch(state.archives.pairs[key], old);
      state.archives.count += 1;
      state.archives.throughWeek = Math.max(state.archives.throughWeek || 0, old.week);
    }
  }

  function reserveFighter(input, options = {}) {
    const state = restoreState(input);
    const fighter = findFighter(state, options.fighterId);
    const bookingId = textValue(options.bookingId, "Réservation");
    const currentWeek = state.lastProcessedWeek + 1;
    const fightWeek = integer(options.fightWeek, "Semaine du combat", currentWeek, 99999);
    const existing = state.reservations.find(item => item.bookingId === bookingId);
    if (existing) {
      if (existing.fighterId !== fighter.id || existing.fightWeek !== fightWeek) fail("reservation-conflict", "Cette réservation est déjà liée à un autre rendez-vous.");
      return resultState(state, false, "already-reserved");
    }
    if (state.reservations.some(item => item.fighterId === fighter.id)) fail("fighter-reserved", "Cet affilié prépare déjà un combat.");
    if (state.matches.some(item => item.source === "player" && item.bookingId === bookingId)) fail("booking-completed", "Cette réservation est déjà terminée.");
    state.reservations.push({
      bookingId, fighterId: fighter.id, createdWeek: currentWeek, fightWeek,
      snapshot: { stats: clone(fighter.stats), record: clone(fighter.record) },
    });
    return resultState(state, true, "reserved");
  }

  function cancelReservation(input, bookingId) {
    const state = restoreState(input);
    textValue(bookingId, "Réservation");
    const index = state.reservations.findIndex(item => item.bookingId === bookingId);
    if (index === -1) return resultState(state, false, "not-reserved");
    state.reservations.splice(index, 1);
    return resultState(state, true, "cancelled");
  }

  /** Records only the opponent side; the application owns the player's record. */
  function recordPlayerFight(input, options = {}) {
    const state = restoreState(input);
    const matchId = textValue(options.matchId, "Identifiant du combat");
    const bookingId = textValue(options.bookingId, "Réservation");
    const week = integer(options.week, "Semaine du combat", state.startWeek, 99999);
    if (!["win", "loss", "draw"].includes(options.playerResult)) fail("invalid-result", "Résultat du joueur inconnu.");
    const method = options.method == null ? null : textValue(options.method, "Méthode", 80);
    const id = `player:${matchId}`;
    const previous = state.matches.find(match => match.id === id);
    if (previous) {
      const previousResult = previous.winnerId == null ? "draw" : previous.winnerId === PLAYER_ID ? "win" : "loss";
      if (previous.week !== week || previous.bookingId !== bookingId || previousResult !== options.playerResult || previous.method !== method) {
        fail("result-conflict", "Un autre résultat existe pour ce combat.");
      }
      return resultState(state, false, "already-recorded");
    }
    // Older receipts can have left the detailed history. A closed week remains
    // closed, so replaying an old callback can never recreate an archived result.
    if (week <= state.lastProcessedWeek) return resultState(state, false, "week-already-processed");
    if (week !== state.lastProcessedWeek + 1) fail("week-gap", "Le combat n'appartient pas à la semaine en cours.");
    const reservation = state.reservations.find(item => item.bookingId === bookingId);
    if (!reservation || reservation.fightWeek !== week) fail("missing-reservation", "La réservation de ce combat est introuvable.");
    const winnerId = options.playerResult === "draw" ? null : options.playerResult === "win" ? PLAYER_ID : reservation.fighterId;
    const match = { id, week, fighterIds: [PLAYER_ID, reservation.fighterId], winnerId, source: "player", method, bookingId };
    appendMatch(state, match);
    state.reservations = state.reservations.filter(item => item.bookingId !== bookingId);
    return resultState(state, true, "recorded", { match: clone(match) });
  }

  function effectiveStrength(fighter) {
    vectorIsValid(fighter.stats);
    const mean = average(fighter.stats);
    const family = familyForStyle(fighter.style);
    const weighted = family
      ? STAT_KEYS.reduce((sum, key) => sum + fighter.stats[key] * combat.LEGACY_WEIGHTS[family][key], 0) : mean;
    return mean * 0.65 + weighted * 0.35;
  }

  function winProbability(first, second) {
    return clamp(1 / (1 + Math.exp(-(effectiveStrength(first) - effectiveStrength(second)) / 8)), 0.1, 0.9);
  }

  function selectPair(state, week) {
    const reserved = new Set(state.reservations.map(item => item.fighterId));
    const available = state.fighters.filter(fighter => !reserved.has(fighter.id)
      && (fighter.lastFightWeek == null || week - fighter.lastFightWeek >= CONFIG.fightInterval));
    const totals = pairTotals(state);
    const candidates = [];
    for (let i = 0; i < available.length; i += 1) {
      for (let j = i + 1; j < available.length; j += 1) {
        const fighters = [available[i], available[j]].sort((a, b) => compareIds(a.id, b.id));
        const key = pairKey(fighters.map(fighter => fighter.id));
        const lastMeeting = totals[key]?.lastWeek;
        const gap = Math.abs(average(fighters[0].stats) - average(fighters[1].stats));
        if (gap > CONFIG.maximumLevelGap + 0.00001 || (lastMeeting != null && week - lastMeeting < CONFIG.rematchInterval)) continue;
        const lastWeeks = fighters.map(fighter => fighter.lastFightWeek ?? state.startWeek - CONFIG.fightInterval);
        candidates.push({ fighters, key, gap, oldest: Math.min(...lastWeeks), newest: Math.max(...lastWeeks),
          tie: combat.createSeededRng(JSON.stringify(["roster-pair", state.seed, week, key]))() });
      }
    }
    candidates.sort((a, b) => a.oldest - b.oldest || a.newest - b.newest || a.gap - b.gap || a.tie - b.tie || compareIds(a.key, b.key));
    return candidates[0]?.fighters || null;
  }

  function progressFighter(fighter) {
    const mean = average(fighter.stats);
    const remaining = Math.max(0, average(fighter.ceilings) - mean);
    if (remaining <= 0) return;
    const rate = CONFIG.progression.find(band => mean < band.below)?.gain || 0;
    // Round the shared increment once. Independently rounding halfway values
    // for each stat would slowly distort their original style offsets.
    const gain = round(remaining <= CONFIG.ceilingSnapGap + 0.0000001 ? remaining
      : Math.min(remaining, rate * Math.min(1, remaining / CONFIG.ceilingSlowdownRange)));
    for (const key of STAT_KEYS) {
      if (fighter.stats[key] < fighter.ceilings[key]) fighter.stats[key] = round(Math.min(fighter.ceilings[key], fighter.stats[key] + gain));
    }
  }

  function advanceWeek(input, options = {}) {
    const state = restoreState(input);
    const week = integer(options.week, "Semaine à terminer", state.startWeek, 99999);
    if (options.careerStatus !== "amateur") return resultState(state, false, "not-amateur");
    if (week <= state.lastProcessedWeek) return resultState(state, false, "already-processed");
    if (week !== state.lastProcessedWeek + 1) fail("week-gap", "Les semaines du bassin doivent être traitées dans l'ordre.");
    if (options.completed !== true || options.fightGateReady === true) return resultState(state, false, "week-not-complete");
    if (state.reservations.some(item => item.fightWeek <= week)) return resultState(state, false, "fight-pending");
    const pair = selectPair(state, week);
    let match = null;
    if (pair) {
      const ids = pair.map(fighter => fighter.id);
      const random = combat.createSeededRng(JSON.stringify(["roster-result", state.seed, week, ids]));
      match = {
        id: `circuit:${state.id}:${week}:${ids.join(":")}`, week, fighterIds: ids,
        winnerId: random() < winProbability(pair[0], pair[1]) ? ids[0] : ids[1], source: "simulation", method: "decision",
      };
      appendMatch(state, match);
    }
    const reserved = new Set(state.reservations.map(item => item.fighterId));
    state.fighters.filter(fighter => !reserved.has(fighter.id)).forEach(progressFighter);
    state.lastProcessedWeek = week;
    return resultState(state, true, "week-complete", { match: match ? clone(match) : null });
  }

  function perspective(pair, fighterId) {
    const index = pair.fighterIds.indexOf(fighterId);
    return { opponentId: pair.fighterIds[1 - index], wins: pair.wins[index], losses: pair.wins[1 - index],
      draws: pair.draws, firstWeek: pair.firstWeek, lastWeek: pair.lastWeek };
  }

  function headToHead(input, fighterId, opponentId) {
    validateState(input);
    if (fighterId === opponentId || !participantExists(input, fighterId) || !participantExists(input, opponentId)) {
      fail("unknown-fighter", "Participants des confrontations invalides.");
    }
    const pair = pairTotals(input)[pairKey([fighterId, opponentId])] || emptyPair([fighterId, opponentId]);
    return perspective(pair, fighterId);
  }

  function publicSummary(state, fighter) {
    const reservation = state.reservations.find(item => item.fighterId === fighter.id);
    return { id: fighter.id, name: fighter.name, nickname: fighter.nickname, style: fighter.style,
      sex: state.sex, weightClass: state.weightClass, record: clone(fighter.record),
      preparingForPlayer: Boolean(reservation), fightWeek: reservation?.fightWeek ?? null };
  }

  function listFighters(input) {
    validateState(input);
    return input.fighters.map(fighter => publicSummary(input, fighter))
      .sort((a, b) => a.name.localeCompare(b.name, "fr-CA") || compareIds(a.id, b.id));
  }

  function getFighterProfile(input, fighterId, options = {}) {
    validateState(input);
    const fighter = findFighter(input, fighterId);
    const limit = integer(options.limit ?? 20, "Nombre de rencontres", 1, CONFIG.historyLimit);
    const offset = integer(options.offset ?? 0, "Position dans l'historique", 0, CONFIG.historyLimit);
    const retained = input.matches.filter(match => match.fighterIds.includes(fighterId)).reverse();
    const archived = Object.values(input.archives.pairs).filter(pair => pair.fighterIds.includes(fighterId));
    return {
      ...publicSummary(input, fighter), initialRecord: clone(fighter.initialRecord), trackedSinceWeek: input.startWeek,
      retainedCount: retained.length,
      archivedCount: archived.reduce((sum, pair) => sum + pair.wins[0] + pair.wins[1] + pair.draws, 0),
      archivedOpponents: archived.map(pair => perspective(pair, fighterId)),
      history: retained.slice(offset, offset + limit).map(match => ({
        id: match.id, week: match.week, opponentId: match.fighterIds.find(id => id !== fighterId),
        result: match.winnerId == null ? "draw" : match.winnerId === fighterId ? "win" : "loss",
        method: match.method, source: match.source,
      })),
    };
  }

  return Object.freeze({ SCHEMA_VERSION, RULES_VERSION, STATE_KIND, PLAYER_ID, STAT_KEYS, CONFIG,
    createState, restoreState, validateState, reserveFighter, cancelReservation, recordPlayerFight,
    advanceWeek, effectiveStrength, winProbability, listFighters, getFighterProfile, headToHead });
});
