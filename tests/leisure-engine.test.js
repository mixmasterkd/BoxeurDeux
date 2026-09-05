"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const leisure = require("../leisure-engine.js");

test("définit quatre sorties équilibrées, immuables et moins récupératrices que le repos", () => {
  assert.equal(globalThis.BoxeurLeisure, leisure);
  assert.equal(leisure.FAMILY_ID, "leisure");
  assert.equal(leisure.LOCATION_ID, "leisure-center");
  assert.deepEqual(Object.keys(leisure.CATALOG), ["bowling", "cinema", "arcade", "karting"]);
  for (const activity of Object.values(leisure.CATALOG)) {
    assert.equal(Object.isFrozen(activity), true);
    assert.ok(activity.price >= 20 && activity.price <= 60);
    assert.ok(activity.capacityCost >= 5 && activity.capacityCost <= 8);
    assert.ok(activity.energyGain < 18);
    assert.ok(activity.fatigueRelief < 12);
  }
});

test("produit une activité de planification sans XP, physique ou effet caché", () => {
  const definition = leisure.plannerDefinition("cinema");

  assert.deepEqual(definition, {
    id: "leisure:cinema",
    label: "Sortie · Cinéma",
    category: "leisure",
    location: "leisure-center",
    physical: false,
    capacityCost: 5,
    energyCost: 0,
    energyGain: 4,
    fatigueDelta: -5,
    allowedCareerStatuses: ["amateur", "professional"],
    metadata: {
      plannerType: "leisure",
      leisureActivityId: "cinema",
      familyId: "leisure",
      programSignature: "leisure:cinema",
      moneyCost: 25,
      fatigueGain: 0,
      fatigueRelief: 5,
    },
  });
  assert.equal(leisure.getActivity("leisure:cinema"), leisure.CATALOG.cinema);
  assert.throws(() => leisure.plannerDefinition("unknown"), /n’existe pas/);
});
