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
