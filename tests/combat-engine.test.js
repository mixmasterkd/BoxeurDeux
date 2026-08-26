const test = require("node:test");
const assert = require("node:assert/strict");

const engine = require("../combat-engine.js");

const balancedStats = { technique: 45, power: 45, cardio: 45, defense: 45 };

function baseConfig(overrides = {}) {
  return {
    seed: "combat-test",
    player: {
      name: "Joueur",
      stats: balancedStats,
      energy: 80,
      fitness: 50,
      fatigue: 0,
      injury: 0,
      morale: 50,
    },
    opponent: {
      name: "Adversaire",
      stats: balancedStats,
      energy: 80,
      style: "Équilibré",
    },
    ...overrides,
  };
}

function chooseDefaultCoach(state) {
  const options = engine.getCoachOptions(state);
  return (options.find(option => option.recommended) || options[0]).id;
}

function advanceOneRound(state) {
  let next = state;
  if (next.phase === "corner") next = engine.chooseCoachDirective(next, chooseDefaultCoach(next)).state;
  const startingRound = next.round;
  let guard = 0;
  while (!next.status.finished && next.round === startingRound && guard < 10) {
    guard += 1;
    const actions = engine.getAvailableActions(next);
    next = engine.resolveExchange(next, actions[0].id).state;
  }
  return next;
}

test("expose la même API en CommonJS et sur globalThis", () => {
  assert.equal(globalThis.BoxeurCombat, engine);
  assert.equal(engine.ROUND_COUNT, 3);
  assert.equal(typeof engine.createFight, "function");
  assert.equal(typeof engine.resolveExchange, "function");
  assert.equal(typeof engine.createSeededRng, "function");
});

test("la source aléatoire seedée est reproductible et injectable", () => {
  const first = engine.createSeededRng("injected-seed");
  const second = engine.createSeededRng("injected-seed");
  assert.deepEqual(
    Array.from({ length: 8 }, () => first()),
    Array.from({ length: 8 }, () => second()),
  );
  assert.equal(typeof first.getState(), "number");

  const fightA = engine.createFight(baseConfig({ seed: "external-rng" }), engine.createSeededRng("stream"));
  const fightB = engine.createFight(baseConfig({ seed: "external-rng" }), engine.createSeededRng("stream"));
  assert.deepEqual(fightB, fightA);
});

test("conserve exactement les pondérations des trois familles historiques", () => {
  assert.deepEqual(engine.LEGACY_WEIGHTS.attack, { technique: 0.28, power: 0.42, cardio: 0.14, defense: 0.16 });
  assert.deepEqual(engine.LEGACY_WEIGHTS.distance, { technique: 0.38, power: 0.10, cardio: 0.28, defense: 0.24 });
  assert.deepEqual(engine.LEGACY_WEIGHTS.defense, { technique: 0.24, power: 0.12, cardio: 0.24, defense: 0.40 });
  for (const weights of Object.values(engine.LEGACY_WEIGHTS)) {
    assert.equal(Object.values(weights).reduce((sum, value) => sum + value, 0), 1);
  }
  assert.equal(engine.formulas.strategySkill({ technique: 40, power: 40, cardio: 40, defense: 40 }, "attack"), 40);
});

test("une graine et les mêmes décisions reproduisent exactement le même combat", () => {
  function run() {
    let state = engine.createFight(baseConfig({ seed: "deterministic-fight" }));
    let guard = 0;
    while (!state.status.finished && guard < 100) {
      guard += 1;
      if (state.phase === "corner") {
        state = engine.chooseCoachDirective(state, chooseDefaultCoach(state)).state;
      } else {
        state = engine.resolveExchange(state, engine.getAvailableActions(state)[0].id).state;
      }
    }
    return state;
  }

  const first = run();
  const second = run();
  assert.deepEqual(second, first);
  assert.ok(first.status.finished);
  assert.ok(["player", "opponent"].includes(first.result.winner));
});

test("les transitions sont pures et ne modifient pas l'état reçu", () => {
  const initial = engine.createFight(baseConfig({ seed: "immutable" }));
  const snapshot = JSON.stringify(initial);
  const transition = engine.chooseCoachDirective(initial, chooseDefaultCoach(initial));
  assert.equal(JSON.stringify(initial), snapshot);
  assert.equal(initial.phase, "corner");
  assert.equal(transition.state.phase, "exchange");
  assert.equal(transition.result.visualCue, "coach");

  const beforeExchange = JSON.stringify(transition.state);
  const action = engine.getAvailableActions(transition.state)[0];
  const resolved = engine.resolveExchange(transition.state, action.id);
  assert.equal(JSON.stringify(transition.state), beforeExchange);
  assert.equal(typeof resolved.result.visualCue, "string");
});

test("le format local utilise 3 juges, le tournoi 5, avec 4 à 6 échanges", () => {
  const local = engine.simulateFight(baseConfig({
    seed: "local-four",
    kind: "local",
    exchangesPerRound: 4,
    player: { stats: { technique: 45, power: 25, cardio: 50, defense: 65 }, energy: 85, fitness: 50, morale: 50 },
    opponent: { stats: { technique: 45, power: 25, cardio: 50, defense: 65 }, energy: 85 },
  }));
  const tournament = engine.simulateFight(baseConfig({
    seed: "tournament-six",
    kind: "tournament",
    exchangesPerRound: 6,
    player: { stats: { technique: 45, power: 25, cardio: 50, defense: 65 }, energy: 85, fitness: 50, morale: 50 },
    opponent: { stats: { technique: 45, power: 25, cardio: 50, defense: 65 }, energy: 85 },
  }));

  assert.equal(local.format.judgeCount, 3);
  assert.equal(local.judges.length, 3);
  assert.equal(local.history.filter(event => event.type === "exchange").length, 12);
  assert.equal(tournament.format.judgeCount, 5);
  assert.equal(tournament.judges.length, 5);
  assert.equal(tournament.history.filter(event => event.type === "exchange").length, 18);
  assert.equal(local.coach.history.length, 3, "briefing initial et deux véritables pauses");
  assert.equal(tournament.coach.history.length, 3);
});

test("les cartes et l'intention réelle restent cachées jusqu'au verdict", () => {
  let state = engine.createFight(baseConfig({ seed: "hidden-cards" }));
  state = engine.chooseCoachDirective(state, chooseDefaultCoach(state)).state;
  const before = engine.getPublicState(state);
  assert.ok(before.currentExchange.intention);
  assert.equal("actualIntentionId" in before.currentExchange, false);
  assert.equal("readingType" in before.currentExchange, false);
  assert.equal(before.judges.length, 3);
  assert.deepEqual(before.judges.map(judge => judge.id).sort(), ["judge-1", "judge-2", "judge-3"]);
  assert.ok(before.judges.every(judge => Object.keys(judge).length === 1));

  state = advanceOneRound(state);
  assert.equal(state.phase, "corner");
  const betweenRounds = engine.getPublicState(state);
  assert.equal("cards" in betweenRounds.rounds[0], false);
  assert.equal("winner" in betweenRounds.rounds[0], false);
  assert.equal("edge" in betweenRounds.rounds[0], false);

  const final = engine.simulateFight(baseConfig({ seed: "visible-final-cards" }));
  const publicFinal = engine.getPublicState(final);
  assert.equal(publicFinal.result.judgeCards.length, 3);
});

test("les actions sont contextuelles et proposent une vraie sortie des câbles", () => {
  let state = engine.createFight(baseConfig({ seed: "ropes-actions" }));
  state = engine.chooseCoachDirective(state, chooseDefaultCoach(state)).state;
  state = JSON.parse(JSON.stringify(state));
  state.ring.distance = "mid";
  state.ring.position = "ropes";
  state.ring.pressured = "player";
  state.currentExchange.shownIntentionId = "aggressive_entry";
  const actions = engine.getAvailableActions(state);
  assert.ok(actions.length >= 3 && actions.length <= 4);
  assert.ok(actions.some(action => ["pivot_exit", "lateral_evade", "retake_center", "clinch"].includes(action.id)));
  assert.ok(actions.some(action => action.family === "defense"));
  assert.ok(actions.some(action => action.family === "attack"));
});

test("le laboratoire Rémy peut exposer cinq actions sans modifier le format standard", () => {
  let standard = engine.createFight(baseConfig({ seed: "standard-action-count" }));
  let remy = engine.createFight(baseConfig({ seed: "remy-action-count", actionChoiceCount: 5 }));
  standard = engine.chooseCoachDirective(standard, chooseDefaultCoach(standard)).state;
  remy = engine.chooseCoachDirective(remy, chooseDefaultCoach(remy)).state;

  const standardActions = engine.getAvailableActions(standard);
  const remyActions = engine.getAvailableActions(remy);
  assert.equal(standard.format.actionChoiceCount, 4);
  assert.equal(remy.format.actionChoiceCount, 5);
  assert.equal(standardActions.length, 4);
  assert.equal(remyActions.length, 5);
  assert.equal(new Set(remyActions.map(action => action.id)).size, 5);
  assert.doesNotThrow(() => engine.resolveExchange(remy, remyActions[4].id));
  assert.equal(standard.format.judgeCount, 3);
  assert.equal(remy.format.judgeCount, 3);
});

test("la récupération du coin échange un plan tactique contre énergie et initiative", () => {
  let state = engine.createFight(baseConfig({
    seed: "corner-recovery",
    player: { stats: { technique: 45, power: 25, cardio: 45, defense: 65 }, energy: 45, fitness: 50, morale: 50 },
    opponent: { stats: { technique: 45, power: 25, cardio: 45, defense: 65 }, energy: 80 },
  }));
  state = advanceOneRound(state);
  assert.equal(state.round, 2);
  assert.equal(state.phase, "corner");
  assert.ok(engine.getCoachOptions(state).some(option => option.id === "recover"));
  state.ring.momentum = 1;
  const energyBefore = state.fighters.player.energy;
  const transition = engine.chooseCoachDirective(state, "recover");
  assert.equal(transition.state.fighters.player.energy, Math.min(100, energyBefore + 4));
  assert.equal(transition.state.ring.momentum, 0);
  assert.equal(transition.state.coach.activeDirective.bonus, 0);
});

test("l'étude améliore le diagnostic et la lecture sans les rendre infaillibles", () => {
  const plain = engine.createFight(baseConfig({ seed: "study-comparison", coachQuality: 0.6 }));
  const studied = engine.createFight(baseConfig({ seed: "study-comparison", coachQuality: 0.6, studiedOpponent: true }));
  assert.ok(studied.roundState.coachAccuracy > plain.roundState.coachAccuracy);
  assert.ok(studied.roundState.coachAccuracy <= 0.82);

  const plainExchange = engine.chooseCoachDirective(plain, chooseDefaultCoach(plain)).state;
  const studiedExchange = engine.chooseCoachDirective(studied, chooseDefaultCoach(studied)).state;
  assert.ok(studiedExchange.currentExchange.readingAccuracy > plainExchange.currentExchange.readingAccuracy);
  assert.ok(studiedExchange.currentExchange.readingAccuracy <= 0.78);
});

test("un coach peut se tromper et sa directive n'accorde alors aucun bonus caché", () => {
  const highRandom = () => 0.99;
  let state = engine.createFight(baseConfig({ seed: "wrong-coach" }), highRandom);
  assert.equal(state.roundState.coachCorrect, false);
  assert.notEqual(state.roundState.predictedPlan, state.roundState.actualPlan);
  state = engine.chooseCoachDirective(state, "recommended", highRandom).state;
  const aligned = engine.getAvailableActions(state).find(action => action.directiveAligned);
  assert.ok(aligned, "une action doit permettre de suivre la directive proposée");
  const resolved = engine.resolveExchange(state, aligned.id, () => 0.5);
  assert.equal(resolved.result.directiveBonus, 0);
  assert.equal(resolved.result.coachSignal, "wrong");
  assert.ok(resolved.result.events.some(event => event.visualCue === "coach-warning"));
});

test("aucun combat amateur ne se termine par un nul avec 3 ou 5 juges", () => {
  for (const kind of ["local", "tournament"]) {
    for (let index = 0; index < 120; index += 1) {
      const state = engine.simulateFight(baseConfig({ seed: `${kind}-no-draw-${index}`, kind }));
      assert.ok(["player", "opponent"].includes(state.result.winner));
      assert.notEqual(state.result.winner, "draw");
      if (state.result.method === "decision") {
        const expected = kind === "tournament" ? 5 : 3;
        assert.equal(state.result.judgeCards.length, expected);
        assert.equal(state.result.playerVotes + state.result.opponentVotes, expected);
        assert.notEqual(state.result.playerVotes, state.result.opponentVotes);
        for (const judge of state.judges) {
          assert.equal(judge.rounds.length, 3);
          for (const round of judge.rounds) {
            assert.notEqual(round.player, round.opponent);
            assert.ok(round.player === 10 || round.opponent === 10);
            assert.ok(Math.min(round.player, round.opponent) >= 7);
          }
        }
      }
    }
  }
});

test("un coup exceptionnel sur un adversaire déjà compromis peut produire un KO", () => {
  let state = engine.createFight(baseConfig({
    seed: "forced-ko",
    player: { stats: { technique: 99, power: 99, cardio: 70, defense: 70 }, energy: 90, fitness: 70, morale: 80 },
    opponent: { stats: { technique: 20, power: 20, cardio: 1, defense: 1 }, energy: 5, head: 90, lucidity: 5, morale: 20 },
  }));
  state = engine.chooseCoachDirective(state, chooseDefaultCoach(state)).state;
  state = JSON.parse(JSON.stringify(state));
  state.ring.distance = "mid";
  state.currentExchange.shownIntentionId = "compact_cover";
  state.currentExchange.actualIntentionId = "compact_cover";
  const actions = engine.getAvailableActions(state);
  const finisher = actions.find(action => action.id === "finish_pressure")
    || actions.find(action => action.family === "attack");
  assert.ok(finisher);
  const resolved = engine.resolveExchange(state, finisher.id, () => 0);
  assert.equal(resolved.state.status.finished, true);
  assert.equal(resolved.state.result.winner, "player");
  assert.equal(resolved.state.result.method, "KO");
  assert.equal(resolved.state.result.visualCue, "knockout");
});

test("l'accumulation sévère peut déclencher un TKO, mais jamais le moral seul", () => {
  let danger = engine.createFight(baseConfig({
    seed: "forced-tko",
    player: { stats: { technique: 40, power: 10, cardio: 40, defense: 50 }, energy: 80, fitness: 50, morale: 50 },
    opponent: { stats: { technique: 40, power: 10, cardio: 40, defense: 50 }, energy: 8, head: 82, body: 80, lucidity: 18, morale: 50 },
  }));
  danger = engine.chooseCoachDirective(danger, chooseDefaultCoach(danger)).state;
  danger = JSON.parse(JSON.stringify(danger));
  danger.fighters.opponent.unanswered = 5;
  const stopped = engine.resolveExchange(danger, engine.getAvailableActions(danger)[0].id, () => 0.99);
  assert.equal(stopped.state.status.finished, true);
  assert.equal(stopped.state.result.method, "TKO");
  assert.equal(stopped.state.result.winner, "player");

  let lowMorale = engine.createFight(baseConfig({
    seed: "morale-alone",
    opponent: { stats: balancedStats, energy: 90, head: 0, body: 0, lucidity: 100, morale: 0 },
  }));
  lowMorale = engine.chooseCoachDirective(lowMorale, chooseDefaultCoach(lowMorale)).state;
  const ordinary = engine.resolveExchange(lowMorale, engine.getAvailableActions(lowMorale)[0].id, () => 0.99);
  assert.notEqual(ordinary.state.result && ordinary.state.result.method, "TKO");
});

test("les états restent bornés pendant un échantillon de combats", () => {
  for (let index = 0; index < 100; index += 1) {
    const state = engine.simulateFight(baseConfig({
      seed: `bounds-${index}`,
      kind: index % 2 ? "local" : "tournament",
      exchangesPerRound: 4 + (index % 3),
    }));
    assert.ok(state.round <= 3);
    assert.ok(engine.DISTANCES.includes(state.ring.distance));
    assert.ok(engine.POSITIONS.includes(state.ring.position));
    assert.ok(state.ring.momentum >= -2 && state.ring.momentum <= 2);
    for (const fighter of Object.values(state.fighters)) {
      for (const key of ["energy", "head", "body", "lucidity"]) {
        assert.ok(Number.isFinite(fighter[key]), `${key} doit être fini`);
        assert.ok(fighter[key] >= 0 && fighter[key] <= 100, `${key} doit rester borné`);
      }
      assert.ok(Number.isFinite(fighter.legacyExposure) && fighter.legacyExposure >= 0);
    }
    assert.equal(state.result.exposure.player, Math.round(state.fighters.player.legacyExposure * 10) / 10);
    assert.ok(state.history.filter(event => event.type === "exchange").length <= 18);
    assert.equal(typeof state.result.visualCue, "string");
  }
});
