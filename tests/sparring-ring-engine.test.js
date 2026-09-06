"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const ring = require("../sparring-ring-engine.js");

function combatState(overrides = {}) {
  return {
    phase: "exchange",
    round: 1,
    fighters: {
      player: { energy: 80, lucidity: 90 },
      opponent: { energy: 80, lucidity: 90 },
    },
    ring: { distance: "outside", position: "center", pressured: null, momentum: 0 },
    ...overrides,
  };
}

test("crée un ring tactique 5 × 5 sans exposer de grille visuelle", () => {
  const state = ring.createState({ seed: "remy", playerCorner: "blue" });
  assert.equal(ring.GRID_SIZE, 5);
  assert.deepEqual(state.fighters.player, { x: 1, y: 3 });
  assert.deepEqual(state.fighters.opponent, { x: 3, y: 1 });
  assert.equal(ring.getView(state).movementOptions.some(option => option.spaces === 2), true);
});

test("facture 1 énergie pour une case et 3 pour deux sans muter le moteur de combat", () => {
  const initialRing = ring.createState({ seed: "costs" });
  const initialCombat = combatState();
  const oneStep = ring.getMovementOptions(initialRing, 80).find(option => option.spaces === 1);
  const one = ring.applyMovement(initialRing, initialCombat, oneStep.id);
  assert.equal(one.combatState.fighters.player.energy, 79);
  assert.equal(initialCombat.fighters.player.energy, 80);
  assert.equal(initialRing.pendingMovement, null);

  const freshRing = ring.createState({ seed: "costs-two" });
  const twoStep = ring.getMovementOptions(freshRing, 80).find(option => option.spaces === 2);
  const two = ring.applyMovement(freshRing, initialCombat, twoStep.id);
  assert.equal(two.combatState.fighters.player.energy, 77);
  assert.equal(two.result.energyCost, 3);
});

test("le placement influence le contexte existant de distance et de câbles", () => {
  const state = ring.createState({ seed: "context" });
  const options = ring.getMovementOptions(state, 80);
  const towardEdge = options.find(option => option.destination.x === 0);
  const transition = ring.applyMovement(state, combatState(), towardEdge.id);
  assert.equal(transition.combatState.ring.pressured, "player");
  assert.equal(transition.combatState.ring.position, "ropes");
});

test("les boxeurs changent de vue et se font face autour du ring", () => {
  const state = ring.createState({ seed: "facing", playerCorner: "blue" });
  const initial = ring.getView(state);
  assert.equal(initial.fighters.player.pose, "back");
  assert.equal(initial.fighters.opponent.pose, "front");

  state.fighters.player = { x: 4, y: 1 };
  state.fighters.opponent = { x: 1, y: 1 };
  const eastSide = ring.getView(state);
  assert.equal(eastSide.fighters.player.direction, "west");
  assert.equal(eastSide.fighters.opponent.direction, "east");
  assert.equal(eastSide.fighters.player.mirrored, true);
  assert.equal(eastSide.fighters.opponent.mirrored, true);

  const redCareerCorner = ring.createState({ seed: "facing-red", playerCorner: "red" });
  const redCornerView = ring.getView(redCareerCorner);
  assert.equal(redCornerView.fighters.player.mirrored, false);
  assert.equal(redCornerView.fighters.opponent.mirrored, false);
});

test("la perception reste déterministe et une meilleure lecture resserre l'incertitude", () => {
  const low = ring.createState({ seed: "reading", playerStats: { technique: 25, power: 50, cardio: 25, defense: 25 }, coachQuality: 0.55 });
  const high = ring.createState({ seed: "reading", playerStats: { technique: 85, power: 50, cardio: 85, defense: 85 }, coachQuality: 0.75 });
  const transition = {
    result: { edge: 3, side: "player", playerImpact: 5, opponentImpact: 1 },
    state: combatState(),
  };
  const lowAfter = ring.advanceAfterExchange(low, transition, transition.state);
  const highAfter = ring.advanceAfterExchange(high, transition, transition.state);
  assert.equal(lowAfter.perception.exchanges, 1);
  assert.equal(lowAfter.perception.value, ring.advanceAfterExchange(low, transition, transition.state).perception.value);
  assert.ok(highAfter.perception.uncertainty < lowAfter.perception.uncertainty);
  assert.ok(highAfter.perception.value > -100 && highAfter.perception.value <= 100);
});

test("un déplacement choisi ne peut pas être facturé deux fois dans le même échange", () => {
  const initial = ring.createState({ seed: "once" });
  const first = ring.applyMovement(initial, combatState(), "hold");
  assert.throws(() => ring.applyMovement(first.state, first.combatState, "hold"), /déjà été choisi/);
});

test("les intentions tactiques choisissent un déplacement interne cohérent", () => {
  const initial = ring.createState({ seed: "automatic-choices" });
  const combat = combatState();
  const attack = ring.findSuggestedMovement(initial, combat, "attack");
  const defense = ring.findSuggestedMovement(initial, combat, "defense");
  const reading = ring.findSuggestedMovement(initial, combat, "hold");

  assert.equal(attack.role, "advance");
  assert.equal(attack.spaces, 1);
  assert.equal(defense.role, "retreat");
  assert.equal(defense.spaces, 1);
  assert.equal(reading.id, "hold");

  const moved = ring.applyMovement(initial, combat, attack.id);
  assert.equal(moved.state.pendingMovement.role, "advance");
  assert.equal(moved.combatState.fighters.player.energy, 79);
});

function feelExchanges(seed, player, result, count = 6, initial) {
  let state = initial || ring.createState({ seed });
  const combat = combatState({ fighters: { player, opponent: { energy: 80, lucidity: 90 } } });
  for (let index = 0; index < count; index += 1) {
    state = ring.advanceAfterExchange(state, { result, state: combat }, combat);
  }
  return state;
}

const restedFighter = { energy: 90, lucidity: 95, fatigue: 0, morale: 50, head: 0, body: 0 };
const goodExchange = { edge: 2.5, side: "player", playerImpact: 4, opponentImpact: 0, actionId: "cautious_jab" };
const quietExchange = { edge: 0, side: "neutral", playerImpact: 0, opponentImpact: 0, actionId: "cautious_jab" };

test("la fatigue peut faire douter d'un bon round sans imposer le pessimisme à chaque rencontre", () => {
  let tiredWinnersFeelingBehind = 0;
  let tiredWinnersFeelingAhead = 0;
  for (let index = 0; index < 32; index += 1) {
    const seed = `scene${index}`;
    const tired = feelExchanges(seed, { ...restedFighter, energy: 10, lucidity: 80, fatigue: 85, morale: 40 }, goodExchange);
    const rested = feelExchanges(seed, { ...restedFighter, lucidity: 80, morale: 40 }, goodExchange);
    assert.ok(rested.perception.value > 0, "des touches propres restent généralement lisibles au repos");
    assert.ok(tired.perception.value < rested.perception.value);
    if (tired.perception.value < 0) tiredWinnersFeelingBehind += 1;
    if (tired.perception.value > 0) tiredWinnersFeelingAhead += 1;
  }
  assert.ok(tiredWinnersFeelingBehind > 0, "un boxeur peut mieux boxer tout en se croyant en difficulté");
  assert.ok(tiredWinnersFeelingAhead > 0, "la fatigue n'impose pas systématiquement une mauvaise impression");
});

test("l'assurance et l'activité peuvent donner un halo serré du mauvais côté", () => {
  let confidentlyMistaken = 0;
  for (let index = 0; index < 32; index += 1) {
    const state = feelExchanges(`scene${index}`, { ...restedFighter, energy: 95, lucidity: 100, morale: 100 }, {
      edge: -1.8, side: "opponent", playerImpact: 0, opponentImpact: 2, actionId: "fast_combination",
    });
    const view = ring.getView(state).perception;
    if (view.value > 10 && view.uncertainty < 16) confidentlyMistaken += 1;
    assert.ok(view.blur >= 0 && view.blur <= 1);
    assert.ok(view.drift >= 0 && view.drift <= 1);
  }
  assert.ok(confidentlyMistaken > 0, "le halo doit pouvoir confirmer une impression erronée");
});

test("les séquences nettement réussies restent généralement favorables au ressenti", () => {
  for (let index = 0; index < 24; index += 1) {
    const state = feelExchanges(`clear-${index}`, restedFighter, { ...goodExchange, edge: 6, playerImpact: 7 });
    assert.ok(state.perception.value > 20);
  }
});

test("un coup marquant laisse une impression qui survit aux échanges suivants", () => {
  const before = feelExchanges("impact-memory", restedFighter, goodExchange, 3);
  const hit = { edge: -5, side: "opponent", playerImpact: 0, opponentImpact: 10 };
  let marked = feelExchanges("impact-memory", restedFighter, hit, 1, before);
  let unmarked = feelExchanges("impact-memory", restedFighter, quietExchange, 1, before);
  for (let index = 0; index < 3; index += 1) {
    marked = feelExchanges("impact-memory", restedFighter, quietExchange, 1, marked);
    unmarked = feelExchanges("impact-memory", restedFighter, quietExchange, 1, unmarked);
    assert.ok(marked.perception.value < unmarked.perception.value - 3);
  }
});

test("la perte de lucidité élargit le halo et fait flotter le ressenti", () => {
  const calm = ring.getView(feelExchanges("lucidity", restedFighter, quietExchange)).perception;
  const disoriented = ring.getView(feelExchanges("lucidity", {
    ...restedFighter, energy: 20, fatigue: 70, lucidity: 15, head: 55,
  }, quietExchange)).perception;
  assert.ok(disoriented.uncertainty > calm.uncertainty);
  assert.ok(disoriented.blur > calm.blur);
  assert.ok(disoriented.drift > calm.drift + 0.3);
  const initial = ring.getView(ring.createState({ seed: "calm-start" })).perception;
  assert.equal(initial.value, 0);
  assert.equal(initial.drift, 0);
  assert.ok(initial.uncertainty >= 25);
});

test("le coin efface la mémoire du round et atténue l'humeur sans la supprimer", () => {
  const tired = { ...restedFighter, energy: 10, fatigue: 85, lucidity: 40 };
  const state = feelExchanges("corner-mood", tired, { ...quietExchange, opponentImpact: 9 }, 5);
  const snapshot = JSON.stringify(state);
  const next = ring.beginRound(state, 2);
  assert.equal(JSON.stringify(state), snapshot);
  assert.equal(next.perception.value, 0);
  assert.equal(next.perception.memory, 0);
  assert.equal(next.perception.exchanges, 0);
  for (const field of ["mood", "salience", "disorientation", "drift"]) {
    assert.ok(Math.abs(next.perception[field]) < Math.abs(state.perception[field]), field);
    assert.ok(Math.abs(next.perception[field]) > 0, field);
  }
  assert.equal(next.rngState, state.rngState);
  assert.equal(next.perception.rngState, state.perception.rngState);
});

test("la sauvegarde conserve exactement la mémoire, l'humeur et les deux flux aléatoires", () => {
  const original = feelExchanges("serialization", restedFighter, goodExchange, 3);
  const saved = JSON.parse(JSON.stringify(original));
  const next = feelExchanges("serialization", restedFighter, quietExchange, 4, original);
  const restoredNext = feelExchanges("serialization", restedFighter, quietExchange, 4, saved);
  assert.deepEqual(restoredNext, next);
  assert.notEqual(original.perception.rngState, next.perception.rngState);
  assert.equal(original.perception.exchanges, 3);
});

test("les anciennes parties gardent leur impression et ignorent leur ancien flux objectif", () => {
  const initial = ring.createState({ seed: "old-save" });
  initial.perception = { value: 12, uncertainty: 25, trueFlow: 100, exchanges: 3 };
  const alternative = JSON.parse(JSON.stringify(initial));
  alternative.perception.trueFlow = -100;
  const updated = feelExchanges("old-save", restedFighter, quietExchange, 1, initial);
  const other = feelExchanges("old-save", restedFighter, quietExchange, 1, alternative);
  assert.deepEqual(updated, other);
  assert.ok(Number.isFinite(updated.perception.value));
  assert.equal(updated.perception.exchanges, 4);
  assert.equal("trueFlow" in updated.perception, false);
  assert.equal(ring.getView(initial).perception.drift, 0);
});

test("le ressenti ne lit pas les juges ou les totaux et sa vue ne révèle aucun biais interne", () => {
  const combat = combatState({ fighters: { player: restedFighter, opponent: restedFighter } });
  for (const property of ["judges", "rounds", "roundState"]) {
    Object.defineProperty(combat, property, { get() { throw new Error(`Lecture interdite : ${property}`); } });
  }
  const transition = { result: { ...goodExchange }, state: combat };
  Object.defineProperty(transition.result, "roundSummary", { get() { throw new Error("Lecture interdite des cartes"); }, configurable: true });
  const initial = ring.createState({ seed: "hidden-judges" });
  const state = ring.advanceAfterExchange(initial, transition, combat);
  assert.equal(initial.perception.exchanges, 0);
  const view = ring.getView(state).perception;
  assert.deepEqual(Object.keys(view).sort(), ["blur", "drift", "exchanges", "high", "label", "low", "uncertainty", "value"]);
});
