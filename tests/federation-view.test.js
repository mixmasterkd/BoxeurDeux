"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const view = require("../federation-view.js");
const roster = require("../roster-engine.js");
const calendar = require("../career-calendar.js");
const world = require("../world.js");
const clone = value => JSON.parse(JSON.stringify(value));
function career(overrides = {}) {
  return { profile: { firstName: "Alex", lastName: "Test", nickname: "Le Test", sex: "male", weightClass: "M65" },
    careerStatus: "amateur", week: 1, money: 500, reputation: 15, amateurRecord: { wins: 1, losses: 0, draws: 0 }, medals: {}, bookings: [],
    calendar: calendar.generateCalendar({ epoch: "2026-01-05", seed: "federation-test", weeks: 10 }),
    rosterState: roster.createState({ sex: "male", weightClass: "M65", seed: "federation-test" }), ...overrides };
}
function withMatches(weeks = 25) {
  const current = career();
  for (let week = 1; week <= weeks; week += 1) {
    if (week === 1) {
      current.rosterState = roster.reserveFighter(current.rosterState, { fighterId: "leclerc", bookingId: "gala", fightWeek: 1 }).state;
      current.rosterState = roster.recordPlayerFight(current.rosterState, { bookingId: "gala", matchId: "gala", week, playerResult: "win", method: "decision" }).state;
    }
    current.rosterState = roster.advanceWeek(current.rosterState, { week, completed: true, careerStatus: "amateur" }).state;
  }
  current.week = weeks + 1;
  return current;
}

test("ouvrir la Fédération respecte le récréatif, le premier résultat et le verrou d’aréna", () => {
  assert.equal(world.locationAccess("federation", career({ careerStatus: "recreational" })).locked, true);
  assert.equal(world.locationAccess("federation", career({ amateurRecord: { wins: 0, losses: 0, draws: 0 } })).locked, true);
  assert.equal(world.locationAccess("federation", career()).locked, false);
  assert.equal(world.locationAccess("federation", career({ careerFightGate: { status: "ready" } })).locked, true);
  assert.equal(world.locationAccess("federation", career({ careerStatus: "professional" })).status, "Information");
});

test("le contexte et les vues ne modifient ni la carrière ni la sauvegarde du bassin", () => {
  const current = withMatches();
  const before = clone(current);
  for (const page of ["home", "directory", "dossier", "tournaments", "fighter"]) {
    const context = view.buildContext(current, { view: page, fighterId: "leclerc" });
    const html = view.render(context);
    assert.match(html, /Consult|consult/);
    assert.doesNotMatch(html, /data-book-gala|data-book-tournament|data-federation-confirm|rating|ceilings|probability|<script/);
    assert.equal(JSON.stringify(context).includes('"stats"'), false);
  }
  assert.deepEqual(current, before);
});

test("annuaire alphabétique des dix affiliés dans les deux divisions, sans classement", () => {
  for (const sex of ["male", "female"]) {
    const current = career({ profile: { sex, weightClass: sex === "male" ? "M65" : "W57" },
      rosterState: roster.createState({ sex, weightClass: sex === "male" ? "M65" : "W57", seed: "fede" }) });
    const context = view.buildContext(current, { view: "directory" });
    assert.equal(context.fighters.length, 10);
    const names = context.fighters.map(fighter => fighter.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "fr-CA")));
    const html = view.render(context);
    assert.equal((html.match(/data-federation-affiliate=/g) || []).length, 10);
    assert.match(html, /sans classement sportif/);
    assert.match(html, /V · .*D · .*N/);
  }
});

test("fiche réservée, bilan initial, perspective inverse et lien vers le dossier du joueur", () => {
  const current = withMatches(1);
  current.rosterState = roster.reserveFighter(current.rosterState, { fighterId: "leclerc", bookingId: "gala-2", fightWeek: 4 }).state;
  const context = view.buildContext(current, { view: "fighter", fighterId: "leclerc" });
  assert.equal(context.selected.history[0].result, "loss");
  assert.equal(context.selected.againstPlayer.losses, 1);
  assert.equal(context.selected.initialRecord.losses, 1);
  const html = view.render(context);
  assert.match(html, /Prépare un combat contre toi · semaine 4/);
  assert.match(html, /Bilan avant le suivi : 1 V · 1 D · 0 N/);
  assert.match(html, /data-federation-fighter="player"/);
  const dossier = view.buildContext(current, { view: "dossier" });
  assert.equal(dossier.playerHistory.history[0].result, "win");
  assert.equal(dossier.playerHistory.history[0].id, context.selected.history[0].id);
});

test("les deux affiliés voient le même combat avec des résultats opposés", () => {
  const current = withMatches(3);
  const match = current.rosterState.matches.find(item => item.source === "simulation");
  const [first, second] = match.fighterIds.map(fighterId => view.buildContext(current, { view: "fighter", fighterId }).selected);
  const a = first.history.find(item => item.id === match.id);
  const b = second.history.find(item => item.id === match.id);
  assert.notEqual(a.result, b.result);
  assert.equal(a.opponentId, second.id);
  assert.equal(b.opponentId, first.id);
});

test("historique paginé et archives restent explicitement séparés du bilan initial", () => {
  const current = withMatches(1120);
  const fighter = current.rosterState.fighters.find(item => current.rosterState.matches.filter(match => match.fighterIds.includes(item.id)).length > 10);
  const first = view.buildContext(current, { view: "fighter", fighterId: fighter.id });
  const second = view.buildContext(current, { view: "fighter", fighterId: fighter.id, offset: 10 });
  assert.equal(first.selected.history.length, 10);
  assert.equal(second.selected.history.length, 10);
  assert.equal(first.selected.history.some(match => second.selected.history.some(other => other.id === match.id)), false);
  assert.ok(first.selected.archivedCount > 0);
  assert.match(view.render(first), /rencontre\(s\) archivée\(s\)/);
  assert.match(view.render(second), /Page 2 sur/);
  const player = view.buildContext(current, { view: "dossier" });
  assert.equal(player.playerHistory.archivedCount, 1);
  assert.match(view.render(player), /data-federation-fighter="leclerc"/);
});

test("pas de faux anciens matchs, fiche inconnue sûre et dossier avec toutes les médailles", () => {
  const current = career({ week: 50, rosterState: roster.createState({ sex: "male", weightClass: "M65", seed: "late", startWeek: 50 }),
    amateurRecord: { wins: 19, losses: 4, draws: 2 }, medals: { bronze: { gold: 1 }, "regional-cup": { silver: 2 }, olympic: { bronze: 1 } } });
  const html = view.render(view.buildContext(current, { view: "fighter", fighterId: "leclerc" }));
  assert.match(html, /suivis depuis la semaine 50/);
  assert.match(html, /Aucune rencontre suivie pour le moment/);
  assert.match(view.render(view.buildContext(current, { view: "fighter", fighterId: "unknown" })), /Fiche indisponible/);
  const dossier = view.render(view.buildContext(current, { view: "dossier" }));
  assert.match(dossier, /19 V · 4 D · 2 N/);
  assert.match(dossier, /Coupe régionale des clubs/);
  assert.match(dossier, /Or 0 · Argent 2 · Bronze 0/);
  assert.match(dossier, /Parcours olympique/);
});

test("les dates, divisions, projections et coûts proviennent du calendrier existant", () => {
  const current = career({ amateurRecord: { wins: 5, losses: 0, draws: 0 } });
  const overview = view.tournamentOverview(current);
  assert.equal(overview.events.length, 6);
  const bronze = overview.events.find(item => item.tournamentId === "bronze");
  assert.equal(bronze.week, 16);
  assert.equal(bronze.eligible, true);
  assert.match(overview.warnings[0], /0 combat/);
  const region = overview.events.find(item => item.tournamentId === "regional-cup");
  assert.equal(overview.next.id, region.id);
  assert.equal(region.divisions.length, 2);
  assert.equal(region.divisions[0].eligible, true);
  assert.equal(region.divisions[1].eligible, false);
  const raw = calendar.nextTournamentPreview({ ...current.calendar.settings, epoch: current.calendar.epoch, seed: current.calendar.seed, afterWeek: 16, tournaments: [calendar.DEFAULT_TOURNAMENT_SCHEDULE[0]] });
  const costs = calendar.travelOptionsForEvent(raw).map(choice => calendar.quoteEventCost(raw, choice.id).total);
  assert.ok(bronze.cost.startsWith(String(Math.min(...costs))));
  current.bookings = [{ id: "reserved-gala", eventId: "gala", status: "registered", event: { id: "gala", kind: "gala", startDate: "2026-01-10", endDate: "2026-01-10", careerWeek: 1 }, expectedBouts: 1 }];
  assert.equal(view.tournamentOverview(current).events.find(item => item.tournamentId === "bronze").eligible, false);
});

test("une édition passée ne paraît pas ouverte, une médaille ouvre le parcours suivant", () => {
  const current = career({ week: 40, amateurRecord: { wins: 12, losses: 0, draws: 0 }, medals: { golden: { gold: 1 } } });
  const overview = view.tournamentOverview(current);
  assert.equal(overview.events.find(item => item.tournamentId === "bronze").status, "Édition terminée");
  assert.equal(overview.events.find(item => item.tournamentId === "canadian").eligible, true);
  assert.equal(overview.events.find(item => item.tournamentId === "olympic").eligible, false);
  assert.match(overview.events.find(item => item.tournamentId === "olympic").divisions[0].reason, /Championnat canadien/);
});

test("la consultation ne réinscrit pas une réservation et explique budget et mode professionnel", () => {
  const current = career({ money: 0 });
  assert.match(view.tournamentOverview(current).next.notice, /Budget insuffisant/);
  const nextEvent = calendar.nextTournamentPreview({ ...current.calendar.settings, epoch: current.calendar.epoch, seed: current.calendar.seed, afterWeek: 1 });
  const booked = calendar.createBooking({ event: nextEvent, career: { ...current, money: 500 }, divisionId: "novice", travelOptionId: calendar.travelOptionsForEvent(nextEvent)[0].id });
  current.bookings = [booked.booking];
  const before = clone(current);
  assert.equal(view.tournamentOverview(current).next.status, "Inscription confirmée");
  assert.deepEqual(current, before);
  const professional = view.render(view.buildContext(career({ careerStatus: "professional" })));
  assert.match(professional, /contrats ne sont pas encore disponibles/);
  assert.doesNotMatch(professional, /data-career-open-calendar|data-federation-fighter|data-federation-view=/);
});

test("les identités sont échappées et les données internes ne sont pas divulguées", () => {
  const current = career();
  current.rosterState.fighters[0].name = '<img src=x onerror="evil()">';
  const html = view.render(view.buildContext(current, { view: "fighter", fighterId: "leclerc" }));
  assert.match(html, /&lt;img src=x onerror=&quot;evil\(\)&quot;&gt;/);
  assert.doesNotMatch(html, /<img|onerror="|federation-test|initialLevelOffset|ceilings|rating|probability|Technique : [0-9]/);
});
