"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const supplements = require("../supplement-engine.js");

function stockedState(inventory = { "sports-drink": 2, "protein-bar": 2, "protein-shake": 2, preworkout: 2 }) {
  return supplements.createState({ inventory });
}

test("expose une API UMD/CommonJS et un catalogue central immuable", () => {
  assert.equal(globalThis.BoxeurSupplements, supplements);
  assert.equal(supplements.SCHEMA_VERSION, 1);
  assert.equal(supplements.STATE_KIND, "boxeur-supplements");
  assert.equal(supplements.MAX_WEEKLY_USES, 2);
  assert.equal(Object.keys(supplements.CATALOG).length, 4);
  assert.equal(Object.isFrozen(supplements.CATALOG), true);
  assert.equal(Object.isFrozen(supplements.CATALOG.preworkout.effects), true);
  assert.throws(() => { supplements.CATALOG.preworkout.price = 1; }, TypeError);
});

test("normalise un inventaire récent et migre les identifiants d'une ancienne sauvegarde", () => {
  const legacy = {
    supplementInventory: [
      { id: "sports-drink", quantity: 2 },
      { id: "energy-drink", quantity: 1 },
      { id: "protein-tub", quantity: 2 },
      { id: "inconnu", quantity: 50 },
    ],
    supplementWeek: 8,
    supplementsUsed: ["sports-drink", "energy-drink", "sports-drink"],
  };
  const before = structuredClone(legacy);
  const state = supplements.createState(legacy);

  assert.deepEqual(legacy, before);
  assert.deepEqual(state.inventory, {
    "protein-bar": 0,
    "sports-drink": 2,
    "protein-shake": 2,
    preworkout: 1,
  });
  assert.equal(state.weeklyUsage.weekKey, "8");
  assert.equal(state.weeklyUsage.count, 2);
  assert.deepEqual(state.weeklyUsage.productIds, ["sports-drink", "preworkout"]);
  assert.equal(supplements.canonicalProductId("protein-tub"), "protein-shake");
});

test("borne les quantités corrompues et retourne une liste d'inventaire lisible", () => {
  const state = supplements.createState({
    inventory: {
      "sports-drink": 999,
      "protein-bar": -5,
      "protein-shake": NaN,
      preworkout: 1.6,
    },
  });

  assert.deepEqual(state.inventory, {
    "protein-bar": 0,
    "sports-drink": 9,
    "protein-shake": 0,
    preworkout: 2,
  });
  assert.deepEqual(supplements.inventoryList(state).map(item => [item.id, item.quantity]), [
    ["sports-drink", 9],
    ["preworkout", 2],
  ]);
});

test("achète des quantités avec une transaction idempotente sans muter l'état ni les finances externes", () => {
  const initial = supplements.createState();
  const before = structuredClone(initial);
  const purchase = supplements.purchase(initial, "sports-drink", 3, {
    money: 100,
    transactionId: "achat-1",
  });

  assert.deepEqual(initial, before);
  assert.equal(purchase.state.inventory["sports-drink"], 3);
  assert.equal(purchase.result.cost, 42);
  assert.equal(purchase.balance, 58);

  const duplicate = supplements.purchase(purchase.state, "sports-drink", 3, {
    money: purchase.balance,
    transactionId: "achat-1",
  });
  assert.equal(duplicate.result.duplicate, true);
  assert.equal(duplicate.result.cost, 0);
  assert.equal(duplicate.balance, 58);
  assert.deepEqual(duplicate.state, purchase.state);
});

test("refuse un achat trop cher et coupe proprement une commande à la capacité de l'inventaire", () => {
  const empty = supplements.createState();
  const quote = supplements.quotePurchase(empty, "protein-shake", 2, { money: 25 });
  assert.equal(quote.ok, false);
  assert.equal(quote.code, "INSUFFICIENT_FUNDS");
  assert.throws(
    () => supplements.purchase(empty, "protein-shake", 2, { money: 25 }),
    error => error.code === "INSUFFICIENT_FUNDS",
  );

  const almostFull = supplements.createState({ inventory: { "protein-bar": 8 } });
  const capped = supplements.purchase(almostFull, "protein-bar", 5, { money: 100 });
  assert.equal(capped.result.quantity, 1);
  assert.equal(capped.result.cost, 10);
  assert.equal(capped.state.inventory["protein-bar"], 9);
});

test("réserve un seul produit pour une séance et peut annuler sans perdre l'unité", () => {
  const initial = stockedState({ "sports-drink": 2 });
  const before = structuredClone(initial);
  const prepared = supplements.prepareForSession(initial, "sports-drink", {
    weekKey: "semaine-3",
    sessionId: "seance-3-a",
    useId: "usage-3-a",
    careerStatus: "amateur",
  });

  assert.deepEqual(initial, before);
  assert.equal(prepared.state.inventory["sports-drink"], 1);
  assert.equal(prepared.state.activeUse.sessionId, "seance-3-a");
  assert.equal(prepared.state.weeklyUsage.count, 0, "la limite est débitée seulement lorsque la séance existe vraiment");
  assert.equal(
    supplements.canPrepareForSession(prepared.state, "protein-bar", { sessionId: "seance-b" }).code,
    "SUPPLEMENT_ALREADY_PREPARED",
  );

  const cancelled = supplements.cancelPreparedUse(prepared.state);
  assert.equal(cancelled.result.cancelled, true);
  assert.equal(cancelled.state.inventory["sports-drink"], 2);
  assert.equal(cancelled.state.activeUse, null);
  assert.equal(cancelled.state.useIds.includes("usage-3-a"), false);
});

test("une répétition du même événement de préparation demeure idempotente", () => {
  const first = supplements.prepareForSession(stockedState({ "protein-bar": 2 }), "protein-bar", {
    weekKey: "4",
    sessionId: "séance-4-a",
    useId: "usage-stable",
  });
  const duplicate = supplements.prepareForSession(first.state, "protein-bar", {
    weekKey: "4",
    sessionId: "séance-4-a",
    useId: "usage-stable",
  });

  assert.equal(duplicate.result.duplicate, true);
  assert.equal(duplicate.state.inventory["protein-bar"], 1);
  assert.deepEqual(duplicate.state, first.state);
});

test("un identifiant déjà consommé ne peut pas débiter une deuxième unité", () => {
  const prepared = supplements.prepareForSession(stockedState({ "protein-bar": 2 }), "protein-bar", {
    weekKey: "4",
    sessionId: "séance-4-a",
    useId: "usage-consommé",
  });
  const consumed = supplements.applyToSession(prepared.state, { energyCost: 8 }, { sessionId: "séance-4-a" });
  const check = supplements.canPrepareForSession(consumed.state, "protein-bar", {
    weekKey: "5",
    sessionId: "séance-5-a",
    useId: "usage-consommé",
  });

  assert.equal(check.ok, false);
  assert.equal(check.code, "USE_ALREADY_PROCESSED");
  assert.equal(consumed.state.inventory["protein-bar"], 1);
});

test("applique un effet temporaire modeste sans jamais modifier le stimulus ou les statistiques", () => {
  const prepared = supplements.prepareForSession(stockedState({ "sports-drink": 1 }), "sports-drink", {
    weekKey: "5",
    sessionId: "séance-5-a",
    useId: "usage-5-a",
  });
  const session = {
    energyCost: 20,
    fatigueGain: 12,
    fatigueRelief: 0,
    recoveryQuality: 1,
    stimulus: { technique: 2, power: 3, cardio: 4, defense: 1 },
    stats: { technique: 41, power: 40, cardio: 39, defense: 42 },
    xp: 8,
  };
  const before = structuredClone(session);
  const outcome = supplements.applyToSession(prepared.state, session, { sessionId: "séance-5-a" });

  assert.deepEqual(session, before);
  assert.equal(outcome.session.energyCost, 18);
  assert.equal(outcome.session.fatigueGain, 12);
  assert.equal(outcome.session.recoveryQuality, 1);
  assert.deepEqual(outcome.session.stimulus, before.stimulus);
  assert.deepEqual(outcome.session.stats, before.stats);
  assert.equal(outcome.session.xp, before.xp);
  assert.equal(outcome.state.activeUse, null);
  assert.equal(outcome.state.weeklyUsage.count, 1);
  assert.deepEqual(outcome.state.weeklyUsage.sessionIds, ["séance-5-a"]);
});

test("le pré-entraînement offre un vrai compromis au lieu d'un bonus sans coût", () => {
  const prepared = supplements.prepareForSession(stockedState({ preworkout: 1 }), "preworkout", {
    weekKey: "6",
    sessionId: "séance-dure",
  });
  const outcome = supplements.applyToSession(prepared.state, {
    energyCost: 20,
    fatigueGain: 20,
    recoveryQuality: 1,
    stimulus: { power: 6 },
  }, { sessionId: "séance-dure" });

  assert.equal(outcome.session.energyCost, 16.4);
  assert.equal(outcome.session.fatigueGain, 23);
  assert.equal(outcome.session.recoveryQuality, 0.97);
  assert.deepEqual(outcome.session.stimulus, { power: 6 });
  assert.match(outcome.result.compromise, /fatigue/i);
});

test("bloque le passage récréatif, l'empilement, la répétition et la troisième utilisation hebdomadaire", () => {
  const initial = stockedState();
  assert.equal(supplements.canPrepareForSession(initial, "sports-drink", {
    sessionId: "rec-1",
    careerStatus: "recreational",
  }).code, "SUPPLEMENTS_LOCKED");

  const firstPrepared = supplements.prepareForSession(initial, "sports-drink", {
    weekKey: "7",
    sessionId: "séance-1",
  });
  const first = supplements.applyToSession(firstPrepared.state, { energyCost: 10 }, { sessionId: "séance-1" });
  assert.equal(supplements.canPrepareForSession(first.state, "sports-drink", {
    weekKey: "7",
    sessionId: "séance-2",
  }).code, "PRODUCT_ALREADY_USED");

  const secondPrepared = supplements.prepareForSession(first.state, "protein-bar", {
    weekKey: "7",
    sessionId: "séance-2",
  });
  const second = supplements.applyToSession(secondPrepared.state, { energyCost: 10 }, { sessionId: "séance-2" });
  assert.equal(second.state.weeklyUsage.count, 2);
  assert.equal(supplements.canPrepareForSession(second.state, "protein-shake", {
    weekKey: "7",
    sessionId: "séance-3",
  }).code, "WEEKLY_USE_LIMIT");
});

test("une nouvelle semaine remet seulement la limite d'usage, pas l'inventaire", () => {
  const initial = supplements.createState({
    inventory: { "sports-drink": 1 },
    weeklyUsage: {
      weekKey: "8",
      count: 2,
      productIds: ["sports-drink", "protein-bar"],
      sessionIds: ["a", "b"],
    },
  });
  const available = supplements.canPrepareForSession(initial, "sports-drink", {
    weekKey: "9",
    sessionId: "c",
  });
  assert.equal(available.ok, true);
  const prepared = supplements.prepareForSession(initial, "sports-drink", {
    weekKey: "9",
    sessionId: "c",
  });
  assert.equal(prepared.state.weeklyUsage.weekKey, "9");
  assert.equal(prepared.state.weeklyUsage.count, 0);
  assert.equal(prepared.state.inventory["sports-drink"], 0);
});

test("refuse une séance différente et reste sérialisable après un cycle complet", () => {
  const prepared = supplements.prepareForSession(stockedState({ "protein-shake": 1 }), "protein-shake", {
    weekKey: "10",
    sessionId: "bonne-séance",
  });
  assert.throws(
    () => supplements.applyToSession(prepared.state, {}, { sessionId: "mauvaise-séance" }),
    error => error.code === "SESSION_MISMATCH",
  );

  const completed = supplements.applyToSession(prepared.state, {
    energyCost: 8,
    fatigueGain: 7,
    stimulus: { technique: 1 },
  }, { sessionId: "bonne-séance" });
  const restored = supplements.createState(JSON.parse(JSON.stringify(completed.state)));
  assert.deepEqual(restored, completed.state);
});
