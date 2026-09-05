"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const media = require("../media-engine.js");

test("définit quatre apparitions média immuables et transparentes", () => {
  assert.equal(globalThis.BoxeurMedia, media);
  assert.equal(media.FAMILY_ID, "media");
  assert.equal(media.LOCATION_ID, "media-studio");
  assert.deepEqual(Object.keys(media.CATALOG), ["interview", "photoshoot", "podcast", "appearance"]);
  assert.deepEqual(Object.values(media.CATALOG).map(activity => activity.requiredReputation), [0, 10, 20, 35]);
  for (const activity of Object.values(media.CATALOG)) {
    assert.equal(Object.isFrozen(activity), true);
    assert.ok(activity.capacityCost >= 4 && activity.capacityCost <= 8);
    assert.ok(activity.reputationGain >= 1 && activity.reputationGain <= 3);
    assert.equal("price" in activity, false);
  }
});

test("produit une activité de planification limitée à la réputation", () => {
  const definition = media.plannerDefinition("podcast");

  assert.deepEqual(definition, {
    id: "media:podcast",
    label: "Média · Balado sportif",
    category: "media",
    location: "media-studio",
    physical: false,
    capacityCost: 6,
    energyCost: 0,
    energyGain: 0,
    fatigueDelta: 0,
    allowedCareerStatuses: ["amateur", "professional"],
    metadata: {
      plannerType: "media",
      mediaActivityId: "podcast",
      familyId: "media",
      programSignature: "media:podcast",
      reputationGain: 2,
      fatigueGain: 0,
      fatigueRelief: 0,
    },
  });
  assert.equal(media.getActivity("media:podcast"), media.CATALOG.podcast);
  assert.throws(() => media.plannerDefinition("unknown"), /n’existe pas/);
});
