(function attachRosterCareer(root, factory) {
  "use strict";
  const commonjs = typeof module === "object" && module.exports;
  const api = factory(commonjs ? require("./roster-engine.js") : root.BoxeurRoster,
    commonjs ? require("./roster-catalog.js") : root.BoxeurRosterCatalog,
    commonjs ? require("./combat-engine.js") : root.BoxeurCombat);
  if (commonjs) module.exports = api;
  if (root) root.BoxeurRosterCareer = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createRosterCareer(roster, catalog, combat) {
  "use strict";
  const clone = value => JSON.parse(JSON.stringify(value));
  const mean = stats => roster.STAT_KEYS.reduce((sum, key) => sum + stats[key], 0) / 4;
  const formatRecord = record => `${record.wins} V · ${record.losses} D${record.draws ? ` · ${record.draws} N` : ""}`;

  function parseRecord(text) {
    const match = /^(\d+) V · (\d+) D(?: · (\d+) N)?$/.exec(text || "");
    return match ? { wins: Number(match[1]), losses: Number(match[2]), draws: Number(match[3] || 0) } : null;
  }

  // Includes an official gala temporarily hidden by a practice sparring or tournament.
  function pendingGalas(career) {
    const galas = [];
    function visit(scheduled, depth = 0) {
      if (!scheduled || depth > 4) return;
      if (!scheduled.tournamentId && !scheduled.isPracticeSparring && !scheduled.isRecreationalSparring
        && !scheduled.isDeveloperBout && scheduled.opponent) galas.push(scheduled);
      visit(scheduled.deferredScheduledFight, depth + 1);
    }
    visit(career.scheduledFight);
    visit(career.activeTournament?.deferredScheduledFight);
    return galas;
  }

  function legacyFighterId(scheduled, sex) {
    const id = scheduled.opponent.id;
    const matches = catalog.list(sex).filter(profile => id === profile.id
      || (scheduled.eventId && [0, 1, 2].some(slot => id === `${scheduled.eventId}-${profile.id}-${slot}`)));
    return matches.length === 1 ? matches[0].id : null;
  }

  function validateCareer(career) {
    if (!career.rosterState) return true;
    roster.validateState(career.rosterState, career.profile);
    const state = career.rosterState;
    if (career.careerStatus === "amateur" && state.lastProcessedWeek !== career.week - 1) {
      throw new Error("Le bassin et la semaine de carrière ne correspondent pas.");
    }
    const bindings = new Map();
    for (const scheduled of pendingGalas(career)) {
      const opponent = scheduled.opponent;
      if (!opponent.rosterFighterId) continue; // Uncertain legacy identities remain legacy for that bout.
      const reservation = state.reservations.find(item => item.bookingId === opponent.rosterBookingId);
      const fighter = state.fighters.find(item => item.id === opponent.rosterFighterId);
      if (!reservation || !fighter || reservation.fighterId !== fighter.id
        || (scheduled.bookingId && scheduled.bookingId !== reservation.bookingId)
        || reservation.fightWeek !== Math.max(career.week, scheduled.week)
        || roster.STAT_KEYS.some(key => opponent.stats?.[key] !== reservation.snapshot.stats[key])
        || JSON.stringify(parseRecord(opponent.record)) !== JSON.stringify(reservation.snapshot.record)
        || ["name", "nickname", "style"].some(key => opponent[key] !== fighter[key])) {
        throw new Error("Le gala réservé ne correspond pas à la fiche protégée du bassin.");
      }
      bindings.set(reservation.bookingId, reservation.fighterId);
    }
    if (state.reservations.some(item => !bindings.has(item.bookingId))) {
      throw new Error("Une réservation du bassin n’a plus de rendez-vous dans la carrière.");
    }
    return true;
  }

  /** Pure, one-time initialization. Never mines the narrative journal or backfills past weeks. */
  function initialize(career, options = {}) {
    const next = clone(career);
    if (next.rosterState != null) {
      validateCareer(next);
      next.rosterState = roster.restoreState(next.rosterState, next.profile);
      return next;
    }
    // Very old saves must first confirm their division; do not create the wrong roster.
    if (next.careerStatus !== "amateur" || next.migrationPending) return next;
    next.rosterState = roster.createState({
      sex: next.profile.sex, weightClass: next.profile.weightClass,
      seed: options.seed, startWeek: next.week,
      initialLevelOffset: options.fresh ? 0 : Math.max(0, (options.playerStrength ?? 43) - 43),
    });
    for (const scheduled of pendingGalas(next)) {
      const opponent = scheduled.opponent;
      const fighterId = legacyFighterId(scheduled, next.profile.sex);
      const record = parseRecord(opponent.record);
      const stats = opponent.stats || options.legacyStats?.(opponent);
      if (!fighterId || !record || !stats || next.rosterState.reservations.some(item => item.fighterId === fighterId)) continue;
      const fighter = next.rosterState.fighters.find(item => item.id === fighterId);
      for (const key of ["name", "nickname", "style"]) fighter[key] = opponent[key];
      fighter.stats = clone(stats);
      fighter.initialRecord = clone(record);
      fighter.record = clone(record);
      for (const key of roster.STAT_KEYS) fighter.ceilings[key] = Math.max(fighter.ceilings[key], stats[key]);
      const bookingId = scheduled.bookingId || `legacy:${scheduled.id}:${scheduled.week}`;
      next.rosterState = roster.reserveFighter(next.rosterState, {
        fighterId, bookingId, fightWeek: Math.max(next.week, scheduled.week),
      }).state;
      // Retain the event identity, date, payment and combat seed. Only add the permanent link.
      opponent.stats ||= clone(stats);
      opponent.rosterFighterId = fighterId;
      opponent.rosterBookingId = bookingId;
    }
    validateCareer(next);
    return next;
  }

  /** References derived from the saved roster: no cache, RNG consumption or writes on render. */
  function galaOffers(state, event, playerStrength) {
    if (!state) return [];
    const used = new Set(state.reservations.map(item => item.fighterId));
    return (event.opponentSlots || []).slice(0, 3).map((slot, slotIndex) => {
      const target = playerStrength + (Number(slot.ratingOffset) || 0);
      const candidates = state.fighters.filter(fighter => !used.has(fighter.id)).map(fighter => ({
        fighter, gap: Math.abs(mean(fighter.stats) - target),
        tie: combat.createSeededRng(JSON.stringify([state.seed, state.lastProcessedWeek + 1, event.id, slotIndex, fighter.id]))(),
      })).sort((a, b) => a.gap - b.gap || a.tie - b.tie || a.fighter.id.localeCompare(b.fighter.id));
      const fighter = candidates[0]?.fighter;
      if (!fighter) return null;
      used.add(fighter.id);
      const rating = mean(fighter.stats);
      const gap = rating - playerStrength;
      return {
        id: `${event.id}-${fighter.id}-${slotIndex}`, rosterFighterId: fighter.id,
        name: fighter.name, nickname: fighter.nickname, style: fighter.style,
        weightClass: state.weightClass, stats: clone(fighter.stats), record: formatRecord(fighter.record),
        dateLead: 4, experience: 0,
        rating, difficulty: rating, risk: gap <= -3 ? "Accessible" : gap >= 2 ? "Défi risqué" : "Combat serré",
      };
    });
  }

  function completeWeek(career, week) {
    if (!career.rosterState || career.careerStatus !== "amateur") return career.rosterState;
    const result = roster.advanceWeek(career.rosterState, { week, careerStatus: career.careerStatus, completed: true });
    if (result.reason === "fight-pending") throw new Error("Le combat réservé doit être réglé avant de terminer la semaine du bassin.");
    return result.state;
  }

  return Object.freeze({ initialize, validateCareer, pendingGalas, legacyFighterId, galaOffers, completeWeek, formatRecord });
});
