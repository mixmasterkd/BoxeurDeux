"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const roster = require("../roster-engine.js");
const catalog = require("../roster-catalog.js");
const combat = require("../combat-engine.js");

const copy = value => JSON.parse(JSON.stringify(value));
const mean = vector => Object.values(vector).reduce((sum, value) => sum + value, 0) / 4;
const count = record => record.wins + record.losses + record.draws;
const make = options => roster.createState({ sex: "male", weightClass: "M65", seed: "roster-tests", ...options });
const tick = (state, options = {}) => roster.advanceWeek(state, {
  week: state.lastProcessedWeek + 1, careerStatus: "amateur", completed: true, ...options,
});
const errorCode = code => error => error.code === code;
function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function run(state, weeks) {
  for (let i = 0; i < weeks; i += 1) state = tick(state).state;
  return state;
}

test("les vingt profils reprennent les identités, styles et bilans réels des galas", () => {
  const legacy = require("./fixtures/legacy-gala-catalog.cjs");
  for (const sex of ["male", "female"]) {
    const current = legacy[sex];
    const profiles = catalog.list(sex);
    assert.equal(profiles.length, 10);
    assert.equal(Object.isFrozen(profiles[0].initialRecord), true);
    for (const profile of profiles) {
      const old = current.find(item => item.id === profile.id);
      assert.ok(old);
      for (const key of ["name", "nickname", "style"]) assert.equal(profile[key], old[key]);
      assert.equal(profile.initialLevel, old.difficulty);
      assert.equal(`${profile.initialRecord.wins} V · ${profile.initialRecord.losses} D`, old.record);
    }
  }
});

test("crée dix fiches persistantes avec la même distribution dans les deux divisions", () => {
  const male = make();
  const female = make({ sex: "female", weightClass: "W57" });
  assert.notEqual(male.id, female.id);
  for (let index = 0; index < 10; index += 1) {
    assert.deepEqual(male.fighters[index].stats, female.fighters[index].stats);
    assert.deepEqual(male.fighters[index].ceilings, female.fighters[index].ceilings);
    assert.equal(mean(male.fighters[index].stats), catalog.list("male")[index].initialLevel);
    assert.equal(mean(male.fighters[index].ceilings), catalog.list("male")[index].ceiling);
  }
  assert.equal(male.matches.length, 0);
  assert.ok(male.fighters.every(fighter => fighter.lastFightWeek === null));
  assert.equal(roster.validateState(male), true);
  assert.equal(roster.validateState(female), true);
});

test("fonctionne comme script de navigateur sans stockage, horloge ni hasard global", () => {
  const context = vm.createContext({});
  vm.runInContext("Math.random = () => { throw new Error('global RNG'); }; Date.now = () => { throw new Error('wall clock'); };", context);
  for (const file of ["combat-engine.js", "roster-catalog.js", "roster-engine.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
  }
  const actual = vm.runInContext(`(() => {
    const state = BoxeurRoster.createState({sex:'male', weightClass:'M65', seed:'roster-tests'});
    return BoxeurRoster.advanceWeek(state, {week:1, careerStatus:'amateur', completed:true}).state;
  })()`, context);
  assert.deepEqual(copy(actual), tick(make()).state);
});

test("ne modifie jamais son entrée ni les objets renvoyés par les consultations", () => {
  const state = freeze(make());
  const before = JSON.stringify(state);
  const next = tick(state).state;
  const list = roster.listFighters(state);
  list[0].record.wins = 900;
  const profile = roster.getFighterProfile(next, next.matches[0].fighterIds[0]);
  profile.history[0].opponentId = "modified";
  assert.equal(JSON.stringify(state), before);
  assert.equal(next.matches[0].fighterIds.includes("modified"), false);
  assert.notDeepEqual(next, state);
});

test("refuse une progression hors carrière amateur ou avant la clôture de la semaine", () => {
  const state = make();
  for (const options of [
    { careerStatus: "recreational" }, { careerStatus: "professional" },
    { careerStatus: undefined }, { completed: false }, { completed: undefined }, { fightGateReady: true },
  ]) {
    const result = tick(state, options);
    assert.equal(result.applied, false);
    assert.deepEqual(result.state, state);
  }
  assert.throws(() => tick(state, { week: 2 }), errorCode("week-gap"));
});

test("rejouer une semaine déjà terminée n'ajoute ni progression ni combat", () => {
  const first = tick(make()).state;
  for (const state of [first, roster.restoreState(copy(first))]) {
    const repeat = tick(state, { week: 1 });
    assert.equal(repeat.reason, "already-processed");
    assert.deepEqual(repeat.state, first);
  }
});

test("un début de suivi tardif ne reconstruit aucune semaine passée", () => {
  const state = make({ startWeek: 80 });
  assert.equal(state.lastProcessedWeek, 79);
  assert.equal(state.matches.length, 0);
  const next = tick(state).state;
  assert.equal(next.matches[0].week, 80);
  assert.equal(roster.getFighterProfile(next, "leclerc").trackedSinceWeek, 80);
});

test("la courbe retrouve les projections de conception à 26, 52 et 104 semaines", () => {
  const expected = {
    26: { kramer: 37.12, leclerc: 39.12, nguyen: 45.08, caron: 50.08 },
    52: { kramer: 40.24, leclerc: 42.24, nguyen: 47.16, caron: 52.16 },
    104: { kramer: 43.23, leclerc: 45.16, nguyen: 51.32, caron: 55.68 },
  };
  let state = make();
  for (let week = 1; week <= 104; week += 1) {
    state = tick(state).state;
    if (!expected[week]) continue;
    for (const [id, value] of Object.entries(expected[week])) {
      assert.ok(Math.abs(mean(state.fighters.find(f => f.id === id).stats) - value) < 0.006);
    }
  }
});

test("les plafonds et les différences de style tiennent sur 520 semaines", () => {
  for (const sex of ["male", "female"]) {
    const initial = make({ sex, weightClass: sex === "male" ? "M65" : "W57" });
    const state = run(initial, 520);
    assert.equal(roster.validateState(state), true);
    for (const fighter of state.fighters) {
      const before = initial.fighters.find(f => f.id === fighter.id);
      for (const key of roster.STAT_KEYS) {
        assert.ok(fighter.stats[key] <= fighter.ceilings[key]);
        assert.ok(fighter.stats[key] >= before.stats[key]);
        assert.ok(Math.abs((fighter.stats[key] - fighter.stats.technique) - (before.stats[key] - before.stats.technique)) < 0.00001);
      }
    }
    const beginner = state.fighters[1];
    assert.deepEqual(beginner.stats, beginner.ceilings);
    assert.notEqual(mean(beginner.stats), mean(state.fighters[9].stats));
    assert.ok(state.matches.some(match => match.week > 300 && match.fighterIds.includes(beginner.id)));
  }
});

test("arrête les boxeurs au plafond sans diminuer les caractéristiques déjà trop hautes", () => {
  const state = make();
  for (const [index, fighter] of state.fighters.entries()) {
    fighter.stats = Object.fromEntries(roster.STAT_KEYS.map(key => [key, index % 2 ? 70 : 60]));
    fighter.ceilings = Object.fromEntries(roster.STAT_KEYS.map(key => [key, 60]));
  }
  const next = tick(state).state;
  assert.deepEqual(next.fighters.map(f => f.stats), state.fighters.map(f => f.stats));
  assert.equal(next.matches.length, 1);
});

test("les statistiques proches du plafond l'atteignent exactement sans dépasser 99", () => {
  const state = make({ initialLevelOffset: 56 });
  assert.ok(state.fighters.every(f => Object.values(f.stats).every(value => value <= 99)));
  const fighter = state.fighters[0];
  fighter.stats = Object.fromEntries(roster.STAT_KEYS.map(key => [key, 98.995]));
  fighter.ceilings = Object.fromEntries(roster.STAT_KEYS.map(key => [key, 99]));
  const next = tick(state).state;
  assert.deepEqual(next.fighters[0].stats, fighter.ceilings);
});

test("le suivi exporté reprend le même avenir sans dépendre du niveau du joueur", () => {
  let first = make();
  let second = make();
  for (let week = 1; week <= 104; week += 1) {
    first = tick(first, { playerStrength: 25 }).state;
    second = tick(second, { playerStrength: 99 }).state;
    if (week === 26 || week === 52) second = roster.restoreState(copy(second), { sex: "male", weightClass: "M65" });
  }
  assert.deepEqual(first, second);
  assert.notDeepEqual(run(make({ seed: "another" }), 104).matches, first.matches);
  assert.deepEqual(run(make({ seed: "another" }), 104).fighters.map(f => f.stats), first.fighters.map(f => f.stats));
});

test("chaque paire simulée respecte les disponibilités, niveaux et délais sur plusieurs graines", () => {
  for (const seed of ["pair-a", "pair-b", "pair-c", "pair-d"]) {
    let state = make({ seed });
    const lastPair = new Map();
    const bouts = new Map(state.fighters.map(fighter => [fighter.id, 0]));
    for (let week = 1; week <= 260; week += 1) {
      const outcome = tick(state);
      if (outcome.match) {
        const match = outcome.match;
        assert.equal(match.source, "simulation");
        assert.equal(match.fighterIds.length, 2);
        assert.equal(match.fighterIds.includes("player"), false);
        const [first, second] = match.fighterIds.map(id => state.fighters.find(f => f.id === id));
        assert.ok(Math.abs(mean(first.stats) - mean(second.stats)) <= 8.00001);
        for (const fighter of [first, second]) {
          assert.ok(fighter.lastFightWeek == null || week - fighter.lastFightWeek >= 4);
          bouts.set(fighter.id, bouts.get(fighter.id) + 1);
        }
        const key = JSON.stringify([...match.fighterIds].sort());
        assert.ok(!lastPair.has(key) || week - lastPair.get(key) >= 8);
        lastPair.set(key, week);
      }
      state = outcome.state;
    }
    assert.ok([...bouts.values()].every(value => value >= 15), "tous les affiliés doivent avoir des rencontres");
    assert.equal(new Set(state.matches.map(match => match.week)).size, state.matches.length);
    roster.validateState(state);
  }
});

test("ne force aucune rencontre si une seule personne est disponible", () => {
  let state = make();
  for (const fighter of state.fighters.slice(0, 9)) {
    state = roster.reserveFighter(state, { fighterId: fighter.id, bookingId: `booking-${fighter.id}`, fightWeek: 20 }).state;
  }
  const next = tick(state);
  assert.equal(next.match, null);
  assert.equal(next.applied, true);
  assert.deepEqual(next.state.fighters.slice(0, 9), state.fighters.slice(0, 9));
  assert.notDeepEqual(next.state.fighters[9].stats, state.fighters[9].stats);
});

test("ne force pas une rencontre déséquilibrée et ne dépend pas de l'ordre du catalogue", () => {
  let state = make();
  for (const fighter of state.fighters.slice(2)) {
    state = roster.reserveFighter(state, { fighterId: fighter.id, bookingId: fighter.id, fightWeek: 10 }).state;
  }
  state.fighters[0].stats = Object.fromEntries(roster.STAT_KEYS.map(key => [key, 20]));
  state.fighters[1].stats = Object.fromEntries(roster.STAT_KEYS.map(key => [key, 80]));
  assert.equal(tick(state).match, null);
  const normal = make();
  const reversed = copy(normal);
  reversed.fighters.reverse();
  assert.deepEqual(tick(normal).match, tick(reversed).match);
});

test("protège une fiche réservée puis reprend sa progression sans rattrapage après annulation", () => {
  let state = make();
  const original = copy(state.fighters[0]);
  state = roster.reserveFighter(state, { fighterId: "leclerc", bookingId: "gala-a", fightWeek: 12 }).state;
  assert.equal(roster.getFighterProfile(state, "leclerc").preparingForPlayer, true);
  state = run(state, 10);
  assert.deepEqual(state.fighters[0], original);
  assert.equal(state.matches.some(m => m.fighterIds.includes("leclerc")), false);
  state = roster.cancelReservation(state, "gala-a").state;
  const next = tick(state).state;
  assert.ok(Math.abs(mean(next.fighters[0].stats) - mean(original.stats) - 0.12) < 0.00001);
  assert.equal(roster.getFighterProfile(next, "leclerc").preparingForPlayer, false);
});

test("une réservation arrivée à échéance empêche la clôture tant que le combat reste en attente", () => {
  const state = roster.reserveFighter(make(), { fighterId: "leclerc", bookingId: "due", fightWeek: 1 }).state;
  const next = tick(state);
  assert.equal(next.reason, "fight-pending");
  assert.deepEqual(next.state, state);
});

test("les réservations identiques sont idempotentes et les conflits explicites", () => {
  const options = { fighterId: "leclerc", bookingId: "gala-a", fightWeek: 4 };
  const state = roster.reserveFighter(make(), options).state;
  assert.deepEqual(roster.reserveFighter(state, options).state, state);
  assert.throws(() => roster.reserveFighter(state, { ...options, fighterId: "kramer" }), errorCode("reservation-conflict"));
  assert.throws(() => roster.reserveFighter(state, { ...options, bookingId: "gala-b" }), errorCode("fighter-reserved"));
  assert.throws(() => roster.reserveFighter(state, { ...options, fighterId: "player" }), errorCode("unknown-fighter"));
  const cancelled = roster.cancelReservation(state, "gala-a").state;
  assert.deepEqual(roster.cancelReservation(cancelled, "gala-a").state, cancelled);
  assert.equal(cancelled.matches.length, 0);
});

test("un résultat réel change uniquement le bilan de l'adversaire et libère sa réservation", () => {
  for (const [playerResult, field] of [["win", "losses"], ["loss", "wins"], ["draw", "draws"]]) {
    const initial = make();
    const reserved = roster.reserveFighter(initial, { fighterId: "leclerc", bookingId: "gala", fightWeek: 1 }).state;
    const options = { bookingId: "gala", matchId: "fight-1", week: 1, playerResult, method: "decision" };
    const outcome = roster.recordPlayerFight(freeze(reserved), options);
    assert.equal(outcome.state.fighters[0].record[field], initial.fighters[0].record[field] + 1);
    assert.deepEqual(outcome.state.fighters[0].stats, initial.fighters[0].stats);
    assert.deepEqual(outcome.state.fighters.slice(1), initial.fighters.slice(1));
    assert.equal("amateurRecord" in outcome.state, false);
    assert.equal(outcome.state.reservations.length, 0);
    assert.deepEqual(roster.recordPlayerFight(outcome.state, options).state, outcome.state);
    assert.throws(() => roster.recordPlayerFight(outcome.state, { ...options, playerResult: playerResult === "win" ? "loss" : "win" }), errorCode("result-conflict"));
    assert.equal(tick(outcome.state).match.fighterIds.includes("leclerc"), false);
    assert.equal(roster.validateState(outcome.state), true);
  }
});

test("les deux fiches voient une seule rencontre avec des résultats opposés", () => {
  const state = tick(make()).state;
  const match = state.matches[0];
  const first = roster.getFighterProfile(state, match.fighterIds[0]);
  const second = roster.getFighterProfile(state, match.fighterIds[1]);
  assert.equal(first.history[0].id, second.history[0].id);
  assert.notEqual(first.history[0].result, second.history[0].result);
  assert.equal(first.history[0].opponentId, second.id);
  assert.equal(first.trackedSinceWeek, 1);
  for (const forbidden of ["stats", "ceilings", "probability", "seed", "difficulty", "rating"]) assert.equal(forbidden in first, false);
  const head = roster.headToHead(state, first.id, second.id);
  assert.equal(head.wins + head.losses, 1);
  assert.equal(count(first.record), count(first.initialRecord) + 1);
});

test("refuse les résultats sans réservation et les doubles résultats d'un même rendez-vous", () => {
  const options = { bookingId: "gala", matchId: "fight-a", week: 1, playerResult: "win" };
  const initial = make();
  assert.throws(() => roster.recordPlayerFight(initial, options), errorCode("missing-reservation"));
  const state = roster.reserveFighter(initial, { fighterId: "leclerc", bookingId: "gala", fightWeek: 1 }).state;
  assert.throws(() => roster.recordPlayerFight(state, { ...options, playerResult: "unknown" }), errorCode("invalid-result"));
  assert.throws(() => roster.recordPlayerFight(state, { ...options, week: 2 }), errorCode("week-gap"));
  const completed = roster.recordPlayerFight(state, options).state;
  assert.throws(() => roster.recordPlayerFight(completed, { ...options, matchId: "fight-b" }), errorCode("missing-reservation"));
  assert.throws(() => roster.reserveFighter(completed, { fighterId: "leclerc", bookingId: "gala", fightWeek: 1 }), errorCode("booking-completed"));
  const corrupted = copy(completed);
  corrupted.matches.push({ ...copy(completed.matches[0]), id: "player:duplicate-booking" });
  assert.throws(() => roster.restoreState(corrupted), errorCode("invalid-data"));
  corrupted.matches.pop();
  corrupted.reservations = copy(state.reservations);
  corrupted.reservations[0].snapshot.record = copy(completed.fighters[0].record);
  assert.throws(() => roster.restoreState(corrupted), errorCode("invalid-data"));
});

test("la force et la part de surprise favorisent le meilleur sans garantir le résultat", () => {
  const fighter = value => ({ style: "Équilibré", stats: Object.fromEntries(roster.STAT_KEYS.map(key => [key, value])) });
  assert.equal(roster.winProbability(fighter(40), fighter(40)), 0.5);
  assert.ok(Math.abs(roster.winProbability(fighter(44), fighter(40)) - 0.622459) < 0.00001);
  assert.ok(Math.abs(roster.winProbability(fighter(48), fighter(40)) - 0.731059) < 0.00001);
  assert.equal(roster.winProbability(fighter(99), fighter(1)), 0.9);
  assert.equal(roster.winProbability(fighter(1), fighter(99)), 0.1);
  const styleStats = { technique: 45, power: 60, cardio: 35, defense: 35 };
  assert.ok(roster.effectiveStrength({ style: "Puncheur", stats: styleStats })
    > roster.effectiveStrength({ style: "Défensif", stats: styleStats }));
});

test("les tirages réels du circuit sont statistiquement cohérents avec leur probabilité", () => {
  const countSamples = 600;
  for (const gap of [0, 4, 8]) {
    let base = make();
    for (const fighter of base.fighters.slice(2)) {
      base = roster.reserveFighter(base, { fighterId: fighter.id, bookingId: fighter.id, fightWeek: 10 }).state;
    }
    const [first, second] = base.fighters;
    first.style = second.style = "Équilibré";
    first.stats = Object.fromEntries(roster.STAT_KEYS.map(key => [key, 40 + gap]));
    second.stats = Object.fromEntries(roster.STAT_KEYS.map(key => [key, 40]));
    let wins = 0;
    const probability = roster.winProbability(first, second);
    for (let index = 0; index < countSamples; index += 1) {
      const outcome = tick({ ...base, seed: `distribution-${index}` });
      assert.ok(outcome.match);
      if (outcome.match.winnerId === first.id) wins += 1;
    }
    assert.ok(Math.abs(wins / countSamples - probability) < 0.07, `${gap}: ${wins}/${countSamples}`);
  }
});

test("les archives bornent les détails tout en conservant bilans et confrontations", () => {
  let state = make({ seed: "archives" });
  state = roster.reserveFighter(state, { fighterId: "leclerc", bookingId: "old-gala", fightWeek: 1 }).state;
  const oldResult = { bookingId: "old-gala", matchId: "old-fight", week: 1, playerResult: "win", method: "decision" };
  state = roster.recordPlayerFight(state, oldResult).state;
  const expected = new Map(state.fighters.map(f => [f.id, { ...f.record }]));
  const pairs = new Map();
  for (let week = 1; week <= 1500; week += 1) {
    const next = tick(state);
    if (next.match) {
      for (const id of next.match.fighterIds) expected.get(id)[next.match.winnerId === id ? "wins" : "losses"] += 1;
      const key = JSON.stringify([...next.match.fighterIds].sort());
      pairs.set(key, (pairs.get(key) || 0) + 1);
    }
    state = next.state;
  }
  assert.equal(state.matches.length, 1000);
  assert.ok(state.archives.count > 0);
  assert.equal(state.matches.some(match => match.id === "player:old-fight"), false);
  for (const fighter of state.fighters) {
    assert.deepEqual(fighter.record, expected.get(fighter.id));
    const profile = roster.getFighterProfile(state, fighter.id);
    assert.equal(count(fighter.record) - count(fighter.initialRecord), profile.retainedCount + profile.archivedCount);
  }
  for (const [key, total] of pairs) {
    const [first, second] = JSON.parse(key);
    const record = roster.headToHead(state, first, second);
    assert.equal(record.wins + record.losses + record.draws, total);
  }
  assert.equal(roster.headToHead(state, "leclerc", "player").losses, 1);
  assert.deepEqual(roster.recordPlayerFight(state, oldResult).state, state);
  const restored = roster.restoreState(copy(state));
  assert.deepEqual(tick(restored), tick(state));
  const paged = roster.getFighterProfile(state, "leclerc", { offset: 2, limit: 3 });
  assert.deepEqual(paged.history, roster.getFighterProfile(state, "leclerc", { limit: 10 }).history.slice(2, 5));
});

test("la restauration refuse les incohérences plutôt que réinitialiser la partie", () => {
  const initial = make();
  assert.throws(() => roster.restoreState(initial, { sex: "female" }), errorCode("division-mismatch"));
  assert.throws(() => roster.restoreState(initial, { weightClass: "M80" }), errorCode("division-mismatch"));
  const mutations = [
    s => { s.schemaVersion = 99; }, s => { s.rulesVersion = 99; },
    s => { s.fighters[1].id = s.fighters[0].id; },
    s => { s.fighters[0].stats.power = NaN; }, s => { s.fighters[0].record.wins += 1; },
    s => { s.lastProcessedWeek = -1; }, s => { s.archives.count = 1; },
  ];
  for (const mutate of mutations) {
    const broken = copy(initial);
    mutate(broken);
    assert.throws(() => roster.restoreState(broken));
  }
  const reserved = roster.reserveFighter(initial, { fighterId: "leclerc", bookingId: "drift", fightWeek: 3 }).state;
  reserved.fighters[0].stats.technique += 0.1;
  assert.throws(() => roster.restoreState(reserved), errorCode("reservation-drift"));
  const duplicate = tick(initial).state;
  duplicate.matches.push(copy(duplicate.matches[0]));
  assert.throws(() => roster.restoreState(duplicate));
});

test("faire évoluer le bassin ne consomme pas le hasard d'un combat indépendant", () => {
  const before = combat.createSeededRng("actual-bout");
  const expected = combat.createSeededRng("actual-bout");
  assert.equal(before(), expected());
  run(make(), 52);
  assert.equal(before(), expected());
});
