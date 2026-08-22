"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const calendar = require("../career-calendar.js");

const BASE_OPTIONS = Object.freeze({
  careerStartDate: "2026-01-05",
  seed: "carriere-test",
});

test("expose la même API dans CommonJS et globalThis", () => {
  assert.equal(globalThis.BoxeurCalendar, calendar);
  assert.equal(calendar.CALENDAR_VERSION, 1);
});

test("calcule des semaines ISO déterministes du lundi au dimanche", () => {
  assert.equal(calendar.normalizeEpoch("2026-01-07"), "2026-01-05");
  assert.equal(calendar.weekStartDate("2026-01-05", 1), "2026-01-05");
  assert.equal(calendar.dateForCareerWeek("2026-01-05", 1, 4), "2026-01-09");
  assert.equal(calendar.dateForCareerWeek("2026-01-05", 1, 5), "2026-01-10");
  assert.equal(calendar.weekStartDate("2026-01-05", 8), "2026-02-23");
  assert.equal(calendar.careerWeekForDate("2026-01-05", "2026-02-28"), 8);
});

test("génère le même événement pour une semaine quel que soit l'horizon demandé", () => {
  const full = calendar.generateEvents({ ...BASE_OPTIONS, startWeek: 1, weeks: 10, regionalGalaChance: 1 });
  const partial = calendar.generateEvents({ ...BASE_OPTIONS, startWeek: 4, weeks: 2, regionalGalaChance: 1 });
  const matching = full.filter(event => event.careerWeek >= 4 && event.careerWeek <= 5);
  assert.deepEqual(partial, matching);
});

test("crée un gala local gratuit chaque samedi et un gala au gym par mois", () => {
  const result = calendar.generateCalendar({ ...BASE_OPTIONS, startWeek: 1, weeks: 9, regionalGalaChance: 0 });
  const locals = result.events.filter(event => event.kind === "gala" && event.scope === "local");
  const home = result.events.filter(event => event.scope === "home-gym");
  assert.equal(locals.length, 9);
  assert.ok(locals.every(event => new Date(`${event.startDate}T00:00:00Z`).getUTCDay() === 6));
  assert.equal(home.length, 2); // Les samedis mensuels de janvier et février sont dans l'horizon.
  assert.ok(home.every(event => event.entryFee === 0 && event.weighInRequired === false));
});

test("permet plusieurs galas simultanés mais les expose comme choix incompatibles", () => {
  const events = calendar.generateEvents({ ...BASE_OPTIONS, startWeek: 1, weeks: 9, regionalGalaChance: 0 });
  const home = events.find(event => event.scope === "home-gym");
  const sameDay = calendar.eventsOnDate(events, home.startDate).filter(event => event.kind === "gala");
  assert.ok(sameDay.length >= 2);
  const firstBooking = calendar.createBooking({ event: sameDay[0], career: { money: 200, careerStatus: "amateur" }, existingBookings: [] });
  assert.equal(firstBooking.ok, true);
  const secondBooking = calendar.createBooking({ event: sameDay[1], career: { money: 200, careerStatus: "amateur" }, existingBookings: [firstBooking.booking] });
  assert.equal(secondBooking.ok, false);
  assert.equal(secondBooking.code, "date-conflict");
});

test("rend le gala régional gratuit à l'inscription mais impose transport et hébergement", () => {
  const event = calendar.createGalaEvent({
    scope: "regional",
    date: "2026-01-16",
    venue: { id: "estrie", name: "Gala de l'Estrie", city: "Sherbrooke", region: "QC" },
  });
  const choices = calendar.travelOptionsForEvent(event, BASE_OPTIONS);
  const quote = calendar.quoteEventCost(event, null, BASE_OPTIONS);
  assert.equal(event.entryFee, 0);
  assert.equal(choices.length, 1);
  assert.equal(choices[0].required, true);
  assert.equal(quote.total, calendar.DEFAULT_COSTS.regionalGalaTravel + calendar.DEFAULT_COSTS.regionalGalaNight);
  assert.equal(quote.lodgingNights, 1);
});

test("offre le trajet ou l'hôtel pour un tournoi à moyenne distance", () => {
  const event = calendar.createTournamentEvent({
    id: "test-mid",
    name: "Tournoi test",
    firstWeek: 4,
    rounds: 3,
    entryFee: 45,
    venue: { id: "laval", city: "Laval", region: "QC", travelTier: "mid" },
    eligibility: { type: "fight-count", min: 0, max: 5 },
  }, BASE_OPTIONS);
  const choices = calendar.travelOptionsForEvent(event, BASE_OPTIONS);
  const commute = calendar.quoteEventCost(event, "commute", BASE_OPTIONS);
  const hotel = calendar.quoteEventCost(event, "hotel", BASE_OPTIONS);
  assert.deepEqual(choices.map(choice => choice.id), ["commute", "hotel"]);
  assert.equal(commute.items.lodging, 0);
  assert.ok(commute.effects.fatigue > hotel.effects.fatigue);
  assert.ok(hotel.items.lodging > 0);
  assert.equal(hotel.lodgingNights, 2);
});

test("impose l'hôtel pour un tournoi éloigné", () => {
  const event = calendar.createTournamentEvent({
    id: "test-far",
    name: "Tournoi éloigné",
    firstWeek: 5,
    rounds: 5,
    entryFee: 100,
    venue: { id: "quebec", city: "Québec", region: "QC", travelTier: "far" },
  }, BASE_OPTIONS);
  const choices = calendar.travelOptionsForEvent(event, BASE_OPTIONS);
  assert.equal(choices.length, 1);
  assert.equal(choices[0].id, "hotel");
  assert.equal(choices[0].lodgingNights, 4);
});

test("reprogramme les circuits avancés après une première édition", () => {
  const events = calendar.generateEvents({ ...BASE_OPTIONS, startWeek: 1, weeks: 100, regionalGalaChance: 0 });
  const weeksFor = id => events.filter(event => event.kind === "tournament" && event.tournamentId === id).map(event => event.careerWeek);
  assert.deepEqual(weeksFor("bronze"), [8]);
  assert.deepEqual(weeksFor("silver"), [18]);
  assert.deepEqual(weeksFor("golden"), [30, 50, 70, 90]);
  assert.deepEqual(weeksFor("canadian"), [44, 68, 92]);
  assert.deepEqual(weeksFor("olympic"), [60, 92]);
});

test("admet aux Gants de bronze de 0 à 5 combats, jamais 6", () => {
  const bronze = calendar.createTournamentEvent(calendar.DEFAULT_TOURNAMENT_SCHEDULE[0], BASE_OPTIONS);
  for (let fights = 0; fights <= 5; fights += 1) {
    const result = calendar.evaluateEligibility(bronze, { amateurRecord: { wins: fights, losses: 0, draws: 0 } });
    assert.equal(result.eligible, true, `${fights} combats devrait être admissible`);
    assert.equal(calendar.isBronzeEligible({ wins: fights, losses: 0, draws: 0 }), true);
  }
  const refused = calendar.evaluateEligibility(bronze, { amateurRecord: { wins: 6, losses: 0, draws: 0 } });
  assert.equal(refused.eligible, false);
  assert.equal(refused.code, "too-many-fights");
});

test("compte les nuls historiques et les combats réservés avant le check-in Bronze", () => {
  const bronze = calendar.createTournamentEvent(calendar.DEFAULT_TOURNAMENT_SCHEDULE[0], BASE_OPTIONS);
  const local = calendar.createGalaEvent({ scope: "local", date: "2026-02-14", venue: { id: "local", name: "Local" } });
  const career = { amateurRecord: { wins: 3, losses: 1, draws: 1 } };
  const projected = calendar.evaluateEligibility(bronze, career, {
    includeBookings: true,
    bookings: [{ event: local, status: "registered" }],
  });
  assert.equal(calendar.amateurFightCount(career), 5);
  assert.equal(projected.fightCount, 6);
  assert.equal(projected.eligible, false);
  assert.equal(projected.code, "too-many-fights");
});

test("refuse une inscription trop chère sans modifier la carrière", () => {
  const event = calendar.createGalaEvent({
    scope: "regional",
    date: "2026-01-17",
    venue: { id: "quebec", name: "Gala de Québec", city: "Québec", region: "QC" },
  });
  const career = { money: 20, careerStatus: "amateur", amateurRecord: { wins: 0, losses: 0, draws: 0 } };
  const before = JSON.parse(JSON.stringify(career));
  const result = calendar.createBooking({ event, career, existingBookings: [] });
  assert.equal(result.ok, false);
  assert.equal(result.code, "insufficient-funds");
  assert.deepEqual(career, before);
});

test("produit une inscription atomique et un instantané d'admissibilité seulement au check-in", () => {
  const bronze = calendar.createTournamentEvent({
    ...calendar.DEFAULT_TOURNAMENT_SCHEDULE[0],
    venue: { id: "montreal", city: "Montréal", region: "QC", travelTier: "local" },
  }, BASE_OPTIONS);
  const career = { money: 180, careerStatus: "amateur", amateurRecord: { wins: 2, losses: 1, draws: 0 } };
  const registered = calendar.createBooking({ event: bronze, career, existingBookings: [] });
  assert.equal(registered.ok, true);
  assert.equal(registered.moneyDelta, -45);
  assert.equal(registered.moneyAfter, 135);
  assert.equal(registered.booking.eligibilitySnapshot, null);
  const checkedIn = calendar.checkInTournament(registered.booking, career, { checkedAt: bronze.startDate });
  assert.equal(checkedIn.ok, true);
  assert.equal(checkedIn.eligibilitySnapshot.frozenForEvent, true);
});

test("refuse par défaut une réservation Bronze qui dépasserait cinq combats", () => {
  const bronze = calendar.createTournamentEvent({
    ...calendar.DEFAULT_TOURNAMENT_SCHEDULE[0],
    venue: { id: "montreal", city: "Montréal", region: "QC", travelTier: "local" },
  }, BASE_OPTIONS);
  const local = calendar.createGalaEvent({ scope: "local", date: "2026-02-14", venue: { id: "local", name: "Local" } });
  const localBooking = calendar.createBooking({
    event: local,
    career: { money: 200, careerStatus: "amateur", amateurRecord: { wins: 5, losses: 0, draws: 0 } },
    existingBookings: [],
  }).booking;
  const result = calendar.createBooking({
    event: bronze,
    career: { money: 200, careerStatus: "amateur", amateurRecord: { wins: 5, losses: 0, draws: 0 } },
    existingBookings: [localBooking],
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "too-many-fights");
});

test("refuse une double inscription et une inscription de tournoi hors délai", () => {
  const event = calendar.createTournamentEvent({
    ...calendar.DEFAULT_TOURNAMENT_SCHEDULE[0],
    venue: { id: "montreal", city: "Montréal", region: "QC", travelTier: "local" },
  }, BASE_OPTIONS);
  const career = { money: 200, careerStatus: "amateur", amateurRecord: { wins: 0, losses: 0, draws: 0 } };
  const first = calendar.createBooking({ event, career, existingBookings: [], currentDate: "2026-01-01" });
  assert.equal(first.ok, true);
  const duplicate = calendar.createBooking({ event, career, existingBookings: [first.booking], currentDate: "2026-01-01" });
  assert.equal(duplicate.code, "already-booked");
  const late = calendar.createBooking({ event, career, existingBookings: [], currentDate: calendar.addDays(event.registrationDeadline, 1) });
  assert.equal(late.code, "registration-closed");
});

test("migre un combat local existant sans frais, trajet ni pesée", () => {
  const legacy = {
    week: 3,
    money: 75,
    scheduledFight: { id: "leclerc", week: 5, opponent: { id: "leclerc", name: "Thomas Leclerc" } },
    activeTournament: null,
  };
  const before = JSON.parse(JSON.stringify(legacy));
  const migrated = calendar.migrateLegacyState(legacy, BASE_OPTIONS);
  assert.equal(migrated.currentDate, "2026-01-19");
  assert.equal(migrated.events.length, 1);
  assert.equal(migrated.events[0].startDate, "2026-02-07");
  assert.equal(migrated.events[0].weighInRequired, false);
  assert.equal(migrated.bookings[0].payment.total, 0);
  assert.equal(migrated.bookings[0].grandfathered, true);
  assert.deepEqual(legacy, before);
});

test("migre un tournoi actif avec inscription et pesée acquises", () => {
  const legacy = {
    week: 8,
    scheduledFight: null,
    activeTournament: {
      id: "bronze",
      startWeek: 8,
      status: "active",
      currentRound: 1,
      opponents: [{ name: "A" }, { name: "B" }, { name: "C" }],
      results: [{ round: 0, result: "Victoire" }],
    },
  };
  const migrated = calendar.migrateLegacyState(legacy, BASE_OPTIONS);
  assert.equal(migrated.events[0].fightDates.length, 3);
  assert.equal(migrated.bookings[0].payment.status, "grandfathered");
  assert.equal(migrated.bookings[0].weighInStatus, "accepted-grandfathered");
  assert.equal(migrated.bookings[0].eligibilitySnapshot.frozenForEvent, true);
  assert.equal(migrated.activeCompetitionId, migrated.events[0].id);
});

test("étend l'horizon sans dupliquer les événements existants", () => {
  const initial = calendar.generateCalendar({ ...BASE_OPTIONS, startWeek: 1, weeks: 3, regionalGalaChance: 1 });
  const extended = calendar.extendCalendar(initial, { throughWeek: 8 });
  const ids = extended.events.map(event => event.id);
  assert.equal(extended.endWeek, 8);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(extended.events.filter(event => initial.events.some(old => old.id === event.id)), initial.events);
  assert.equal(extended.settings.regionalGalaChance, 1);
  assert.equal(extended.events.filter(event => event.scope === "regional").length, 8);
});
