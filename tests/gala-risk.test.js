"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const risk = require("../gala-risk.js");
const combat = require("../combat-engine.js");
const roster = require("../roster-engine.js");
const adapter = require("../roster-career.js");
const vector = n => ({ technique: n, power: n, cardio: n, defense: n });

test("seuils précis, égalité, décimales, styles inconnus et données invalides", () => {
  for (const [gap, id] of [[-2.0001, "favorable"], [-2, "favorable"], [-1.9999, "demanding"],
    [0, "demanding"], [1.9999, "demanding"], [2, "challenging"], [2.0001, "challenging"]]) {
    assert.equal(risk.assess(vector(50), vector(50 + gap), "Inconnu").id, id);
  }
  for (const invalid of [null, {}, { ...vector(45), power: "45" }, { ...vector(45), power: NaN },
    vector(100), vector(0), { ...vector(45), defense: Infinity }]) {
    assert.equal(risk.assess(invalid, vector(45)).id, "unknown");
    assert.equal(risk.assess(vector(45), invalid).id, "unknown");
  }
  assert.equal(risk.assess(vector(99), vector(1)).id, "favorable");
});

test("Caron BE-E, profil adverse et monotonicité des caractéristiques", () => {
  const player = { technique: 53, power: 53, cardio: 53, defense: 52 };
  const caron = { technique: 55.43, power: 59.43, cardio: 54.43, defense: 53.43 };
  assert.equal(risk.assess(player, caron, "Puncheur").id, "challenging");
  const rng = combat.createSeededRng("gala-risk-unit-monotonicity");
  for (const style of ["Puncheur", "Bagarreur", "Pression", "Technicien", "Boxeur mobile", "Contre-attaquant", "Défensif", "Équilibré"]) {
    for (let i = 0; i < 100; i++) {
      const a = Object.fromEntries(Object.keys(player).map(key => [key, 20 + rng() * 70]));
      const b = Object.fromEntries(Object.keys(player).map(key => [key, 20 + rng() * 70]));
      const initial = risk.assess(a, b, style).index;
      for (const key of Object.keys(a)) {
        assert.ok(risk.assess({ ...a, [key]: a[key] + 1 }, b, style).index <= initial);
        assert.ok(risk.assess(a, { ...b, [key]: b[key] + 1 }, style).index >= initial);
      }
    }
  }
});

test("évaluer n’altère ni les offres, ni le bassin, ni le combat déterministe", () => {
  const circuit = roster.createState({ sex: "female", weightClass: "W57", seed: "risk-invariant" });
  const event = { id: "gala", opponentSlots: [-4, 0, 3].map(ratingOffset => ({ ratingOffset })) };
  const offers = adapter.galaOffers(circuit, event, 43);
  const before = JSON.stringify({ circuit, offers });
  const config = { seed: "risk-invariant-bout", player: { stats: vector(43), energy: 90, fatigue: 5 },
    opponent: offers[0], opponentDifficulty: Math.round(offers[0].difficulty), actionChoiceCount: 5 };
  const initial = combat.simulateFight(config);
  for (const offer of offers) for (let n = 0; n < 20; n++) risk.assess(vector(43), offer.stats, offer.style);
  assert.equal(JSON.stringify({ circuit, offers }), before);
  assert.deepEqual(adapter.galaOffers(circuit, event, 43), offers);
  assert.deepEqual(combat.simulateFight(config), initial);
  assert.deepEqual(risk.assess({ ...vector(43), experience: 99999, level: 90, wins: 100 }, offers[0].stats, offers[0].style),
    risk.assess(vector(43), offers[0].stats, offers[0].style));
});

test("rendu sans score caché, préparation distincte et déplacement non appliqué", () => {
  const malicious = '<img src=x onerror="alert(1)">';
  const html = risk.renderAssessment({ id: malicious, label: malicious, index: 123.456 });
  assert.match(html, /Évaluation indisponible/);
  assert.doesNotMatch(html, /123|<img|alert/);
  assert.match(risk.renderPreparation({ label: malicious, energy: 34, fatigue: 0 }, true), /&lt;img/);
  assert.match(risk.renderPreparation({ label: "Bonne", energy: 34, fatigue: 0 }, true), /plus difficile.*Ta préparation peut encore changer/);
  assert.equal(risk.conditionWarning({ energy: 35, fatigue: 65 }), "");
  assert.ok(risk.conditionWarning({ energy: 100, fatigue: 66 }));
  assert.match(risk.renderTravel({ energy: -6, fatigue: 4 }), /énergie -6 · fatigue \+4/);
  assert.equal(risk.renderTravel({ energy: -6, fatigue: 4 }, true), "");
  assert.equal(risk.renderTravel({ energy: 0, fatigue: 0 }), "");
});
