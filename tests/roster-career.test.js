"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const roster = require("../roster-engine.js");
const adapter = require("../roster-career.js");
const legacy = require("./fixtures/legacy-gala-catalog.cjs");
const clone = value => JSON.parse(JSON.stringify(value));
const stats = { technique: 62.125, power: 59.75, cardio: 61.5, defense: 60.625 };
const career = overrides => ({ profile: { sex: "male", weightClass: "M65" }, careerStatus: "amateur",
  week: 20, money: 900, amateurRecord: { wins: 8, losses: 3, draws: 0 }, scheduledFight: null,
  ...overrides });
const init = (input = career(), options = {}) => adapter.initialize(input, { seed: "career-roster", playerStrength: 61, ...options });
const event = { id: "gala-20", opponentSlots: [{ ratingOffset: -4 }, { ratingOffset: 0 }, { ratingOffset: 3 }] };
function legacyBooking(profile = legacy.male[0], overrides = {}) {
  return { id: `${event.id}-${profile.id}-0`, eventId: event.id, bookingId: "gala-booking", week: 23,
    fightSeed: "keep-this-seed", event: { ...event, startDate: "2027-03-05" }, travelApplied: false,
    travelEffects: { energy: -6, fatigue: 8 },
    opponent: { ...profile, id: `${event.id}-${profile.id}-0`, stats: clone(stats), record: "9 V · 4 D · 1 N" },
    ...overrides };
}
function tick(input) {
  const next = clone(input);
  next.rosterState = adapter.completeWeek(next, next.week);
  next.week += 1;
  return next;
}

test("initialise une ancienne carrière à sa semaine actuelle sans toucher à ses systèmes", () => {
  const old = career({ journal: [{ week: 3, text: "Victoire contre Thomas Leclerc" }] });
  const next = init(old);
  assert.equal(next.rosterState.startWeek, 20);
  assert.equal(next.rosterState.lastProcessedWeek, 19);
  assert.equal(next.rosterState.initialLevelOffset, 18);
  assert.equal(next.rosterState.matches.length, 0);
  const { rosterState, ...rest } = next;
  assert.deepEqual(rest, old);
  assert.equal(old.rosterState, undefined);
  assert.deepEqual(init(next, { playerStrength: 99 }), next);
});

test("ne crée pas de bassin récréatif, professionnel ni avant le choix de division", () => {
  for (const override of [{ careerStatus: "recreational" }, { careerStatus: "professional" }, { migrationPending: true }]) {
    const old = career(override);
    assert.deepEqual(init(old), old);
  }
  const fresh = init(career({ week: 1 }), { fresh: true, playerStrength: 90 });
  assert.equal(fresh.rosterState.initialLevelOffset, 0);
  assert.equal(fresh.rosterState.fighters[0].stats.technique, roster.createState({ sex: "male", weightClass: "M65", seed: "test" }).fighters[0].stats.technique);
});

test("préserve les vingt anciennes identités, leurs stats fractionnaires, bilans et rendez-vous", () => {
  for (const sex of ["male", "female"]) for (const profile of legacy[sex]) {
    const scheduledFight = legacyBooking(profile);
    const old = career({ profile: { sex, weightClass: sex === "male" ? "M65" : "W57" }, scheduledFight });
    const next = init(old);
    const fighter = next.rosterState.fighters.find(item => item.id === profile.id);
    assert.deepEqual(fighter.stats, stats);
    assert.deepEqual(fighter.initialRecord, { wins: 9, losses: 4, draws: 1 });
    assert.equal(fighter.lastFightWeek, null);
    assert.ok(Object.keys(stats).every(key => fighter.ceilings[key] >= stats[key]));
    const restoredBooking = clone(next.scheduledFight);
    delete restoredBooking.opponent.rosterFighterId;
    delete restoredBooking.opponent.rosterBookingId;
    assert.deepEqual(restoredBooking, scheduledFight);
    assert.deepEqual(init(JSON.parse(JSON.stringify(next))), next);
    assert.equal(next.rosterState.reservations[0].fighterId, profile.id);
  }
});

test("protège aussi les galas différés par un tournoi ou un sparring", () => {
  for (const container of ["tournament", "sparring"]) {
    const scheduled = legacyBooking();
    const source = container === "tournament"
      ? career({ scheduledFight: { tournamentId: "bronze", opponent: clone(scheduled.opponent) }, activeTournament: { deferredScheduledFight: scheduled } })
      : career({ scheduledFight: { isPracticeSparring: true, opponent: clone(scheduled.opponent), deferredScheduledFight: scheduled } });
    let current = init(source);
    const before = clone(current.rosterState.fighters[0]);
    for (let i = 0; i < 3; i += 1) current = tick(current);
    assert.deepEqual(current.rosterState.fighters[0], before);
    assert.ok(current.rosterState.matches.every(match => !match.fighterIds.includes(before.id)));
    assert.equal(adapter.validateCareer(current), true);
    assert.throws(() => tick(current), /combat réservé/);
  }
});

test("ne devine aucun lien par nom et ne fusionne pas un participant de tournoi", () => {
  for (const scheduledFight of [legacyBooking(undefined, { opponent: { ...legacy.male[0], id: "unknown-leclerc-0", stats } }),
    legacyBooking(undefined, { tournamentId: "bronze" })]) {
    const next = init(career({ scheduledFight }));
    assert.equal(next.rosterState.reservations.length, 0);
    assert.deepEqual(next.scheduledFight, scheduledFight);
  }
});

test("adopte les stats effectives d’un ancien ID seul sans changer le moteur ni la date échue", () => {
  const scheduledFight = { id: "leclerc", week: 12, opponent: clone(legacy.male[0]) };
  const next = init(career({ scheduledFight }), { legacyStats: () => stats });
  assert.deepEqual(next.scheduledFight.opponent.stats, stats);
  assert.equal(next.scheduledFight.week, 12);
  assert.equal(next.rosterState.reservations[0].fightWeek, 20);
  assert.equal(adapter.validateCareer(next), true);
});

test("offre au plus trois identités distinctes, déterministes et non réservées sans écrire", () => {
  let current = init(career(), { playerStrength: 43 });
  const before = clone(current);
  const offers = adapter.galaOffers(current.rosterState, event, 43);
  assert.equal(new Set(offers.map(item => item.rosterFighterId)).size, 3);
  assert.deepEqual(adapter.galaOffers(clone(current.rosterState), event, 43), offers);
  assert.deepEqual(current, before);
  for (const offer of offers) {
    const fighter = current.rosterState.fighters.find(item => item.id === offer.rosterFighterId);
    assert.deepEqual(offer.stats, fighter.stats);
    assert.equal(offer.record, adapter.formatRecord(fighter.record));
    assert.notEqual(offer.id, fighter.id);
  }
  for (const fighter of current.rosterState.fighters.slice(0, 9)) {
    current.rosterState = roster.reserveFighter(current.rosterState, { fighterId: fighter.id, bookingId: fighter.id, fightWeek: 22 }).state;
  }
  assert.equal(adapter.galaOffers(current.rosterState, event, 43).filter(Boolean).length, 1);
});

test("ne rehausse pas les affiliés quand le joueur dépasse le bassin", () => {
  const current = init(career(), { fresh: true });
  const before = clone(current.rosterState);
  const offers = adapter.galaOffers(current.rosterState, event, 95);
  assert.ok(offers.every(offer => offer.risk === "Accessible" && offer.rating <= 48));
  assert.deepEqual(current.rosterState, before);
});

test("reprend une semaine une seule fois après sérialisation et sans évolution hors amateur", () => {
  let current = tick(init());
  current = init(JSON.parse(JSON.stringify(current)));
  assert.deepEqual(adapter.completeWeek(current, 20), current.rosterState);
  assert.deepEqual(adapter.completeWeek({ ...current, careerStatus: "professional" }, 21), current.rosterState);
  assert.throws(() => adapter.completeWeek(current, 22), /ordre/);
  assert.equal(current.amateurRecord.wins, 8);
});

test("rejette un bassin corrompu, d’une autre division ou décalé sans l’effacer", () => {
  const good = init(career({ scheduledFight: legacyBooking() }));
  for (const change of [
    state => { state.profile.sex = "female"; },
    state => { state.profile.weightClass = "M75"; },
    state => { state.rosterState.schemaVersion = 999; },
    state => { state.week += 1; },
    state => { state.rosterState.fighters[0].record.wins += 1; },
    state => { state.scheduledFight.opponent.stats.power += 1; },
    state => { state.scheduledFight = null; },
    state => { state.scheduledFight.opponent.rosterBookingId = "wrong"; },
  ]) {
    const bad = clone(good); change(bad); const before = clone(bad);
    assert.throws(() => init(bad));
    assert.deepEqual(bad, before);
  }
});

test("une ancienne copie dans la capsule ne remplace jamais le bassin courant", () => {
  const current = tick(init());
  current.careerCapsule = { legacySnapshot: { state: { rosterState: init().rosterState } } };
  assert.deepEqual(init(current).rosterState, current.rosterState);
});

test("annuler libère sans résultat ni rattrapage et le résultat réel reste unique", () => {
  let current = init(career({ scheduledFight: legacyBooking(undefined, { week: 21 }) }));
  current = tick(current);
  const reservedStats = clone(current.rosterState.fighters[0].stats);
  const cancelled = roster.cancelReservation(current.rosterState, "gala-booking").state;
  assert.deepEqual(cancelled.fighters[0].stats, reservedStats);
  assert.equal(cancelled.matches.filter(match => match.source === "player").length, 0);
  const result = { bookingId: "gala-booking", matchId: "gala-booking", week: 21, playerResult: "win", method: "decision" };
  const recorded = roster.recordPlayerFight(current.rosterState, result).state;
  assert.equal(recorded.fighters[0].record.losses, 5);
  assert.equal(recorded.reservations.length, 0);
  assert.deepEqual(roster.recordPlayerFight(recorded, result).state, recorded);
  const completed = adapter.completeWeek({ ...current, rosterState: recorded, scheduledFight: null }, 21);
  assert.equal(completed.lastProcessedWeek, 21);
  assert.ok(completed.matches.filter(match => match.source === "simulation" && match.week === 21).every(match => !match.fighterIds.includes("leclerc")));
});
