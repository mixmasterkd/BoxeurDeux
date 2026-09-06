"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const combat = require("../combat-engine.js");
const visuals = require("../combat-visuals.js");

test("le visuel de sparring choisit Rémy pour tous les portraits masculins et préserve Nadia", () => {
  for (const portraitId of [0, 1, 2]) {
    for (const kind of ["isRecreationalSparring", "isPracticeSparring"]) {
      for (const [sex, expected] of [["male", "remy"], ["female", "nadia"]]) {
        const profile = Object.freeze({ sex, portraitId });
        assert.equal(visuals.sparringOpponentContext(profile, Object.freeze({ [kind]: true })), expected);
        for (const official of ["isLocalOfficialFight", "isTournamentOfficialFight"]) {
          assert.equal(visuals.sparringOpponentContext(profile, { [kind]: true, [official]: true }), null);
        }
        assert.equal(visuals.sparringOpponentContext(profile, {}), null);
      }
      assert.equal(visuals.sparringOpponentContext({ sex: "unknown" }, { [kind]: true }), null);
      assert.equal(visuals.sparringOpponentContext(null, { [kind]: true }), null);
    }
  }
  assert.equal(visuals.sparringOpponentContext(), null);
});

test("Nadia couvre tous les portraits féminins en sparring, jamais les combats officiels ou les hommes", () => {
  for (const portraitId of [0, 1, 2]) {
    for (const kind of ["isRecreationalSparring", "isPracticeSparring"]) {
      const meta = Object.freeze({ [kind]: true });
      assert.equal(visuals.isNadiaSparring({ sex: "female", portraitId }, meta), true);
      assert.equal(visuals.isNadiaSparring({ sex: "male", portraitId }, meta), false);
      for (const official of ["isLocalOfficialFight", "isTournamentOfficialFight"]) {
        assert.equal(visuals.isNadiaSparring({ sex: "female", portraitId }, { ...meta, [official]: true }), false);
      }
    }
  }
  assert.equal(visuals.isNadiaSparring({ sex: "female" }, {}), false);
  assert.equal(visuals.isNadiaSparring(), false);
});

test("les intentions déjà montrées ont une pose adverse valide sans modifier le moteur", () => {
  const expected = { aggressive_entry: "hook", long_jab: "jab", quick_combination: "jab", body_pressure: "body", counter_trap: "jab", circle_away: "slip", compact_cover: "guard", finish_pressure: "hook" };
  assert.deepEqual(Object.keys(expected).sort(), Object.keys(combat.INTENTIONS).sort());
  for (const [id, pose] of Object.entries(expected)) assert.equal(visuals.opponentActionPose(id), pose);
  for (const id of [undefined, null, "unknown", "__proto__", "constructor"]) assert.equal(visuals.opponentActionPose(id), "guard");
});

test("Nadia réagit à ses propres coups reçus et laisse les knockdowns aux effets existants", () => {
  for (const visualCue of ["opponent-hit", "opponent-hit-hard", "opponent-rocked", "trade"]) {
    assert.equal(visuals.opponentResultPose({ visualCue, shownIntentionId: "body_pressure" }), "impact");
  }
  for (const visualCue of ["player-hit", "player-hit-hard", "neutral"]) {
    assert.equal(visuals.opponentResultPose({ visualCue, shownIntentionId: "body_pressure" }), "body");
  }
  for (const visualCue of ["knockdown", "player-knockdown", "opponent-knockdown", "knockout", "referee-stoppage"]) {
    assert.equal(visuals.opponentResultPose({ visualCue, shownIntentionId: "long_jab" }), "guard");
  }
  for (const knockedDown of ["player", "opponent"]) {
    assert.equal(visuals.opponentResultPose({ visualCue: "trade", knockdown: { knockedDown } }), "guard");
  }
  assert.equal(visuals.opponentResultPose(null), "guard");
});

test("les poses de Nadia ignorent les informations cachées, les dégâts, les scores et le hasard", () => {
  const forbidden = () => { throw new Error("Information interdite à la présentation"); };
  const result = Object.freeze(Object.defineProperties({ visualCue: "neutral", shownIntentionId: "circle_away" },
    Object.fromEntries(["actualIntentionId", "readingType", "playerImpact", "opponentImpact", "edge", "judgeCards", "rngState"].map(key => [key, { get: forbidden }]))));
  const random = Math.random;
  try {
    Math.random = forbidden;
    assert.equal(visuals.opponentResultPose(result), "slip");
  } finally {
    Math.random = random;
  }
});

test("chaque action du moteur possède une illustration et une pose disponibles", () => {
  const actions = Object.keys(combat.ACTIONS);
  assert.equal(actions.length, 20);
  for (const actionId of actions) {
    const visual = visuals.actionVisual(actionId);
    assert.ok(visual?.title, actionId);
    assert.ok(Number.isInteger(visual.card) && visual.card >= 0 && visual.card <= 9, actionId);
    assert.ok(["guard", "jab", "body", "hook", "slip"].includes(visual.pose), actionId);
    assert.ok(Object.isFrozen(visual), actionId);
  }
  for (const actionId of [undefined, null, "unknown", "__proto__", "constructor", "toString"]) {
    assert.equal(visuals.actionVisual(actionId), null);
  }
});

test("les nouvelles poses restent limitées au premier portrait féminin", () => {
  for (const portraitId of [0, "0", 0.49, -1, undefined]) {
    assert.equal(visuals.isPilotProfile({ sex: "female", portraitId }), true);
  }
  for (const portraitId of [0.5, 1, 2, 3, Infinity]) {
    assert.equal(visuals.isPilotProfile({ sex: "female", portraitId }), false);
  }
  for (const sex of ["male", "unknown", undefined]) {
    for (const portraitId of [0, 1, 2]) assert.equal(visuals.isPilotProfile({ sex, portraitId }), false);
  }
  assert.equal(visuals.isPilotProfile(null), false);
  assert.equal(visuals.isPilotProfile(), false);
});

test("les coordonnées couvrent exactement les six poses et les dix cartes des atlas", () => {
  assert.deepEqual(
    ["guard", "jab", "body", "hook", "slip", "impact"].map(visuals.spritePosition),
    ["0% 0%", "50% 0%", "100% 0%", "0% 100%", "50% 100%", "100% 100%"],
  );
  assert.deepEqual(
    Array.from({ length: 10 }, (_, index) => visuals.cardPosition(index)),
    ["0% 0%", "25% 0%", "50% 0%", "75% 0%", "100% 0%", "0% 100%", "25% 100%", "50% 100%", "75% 100%", "100% 100%"],
  );
  for (const pose of [null, undefined, "missing", "__proto__"]) assert.equal(visuals.spritePosition(pose), "0% 0%");
  for (const card of [-1, 10, 1.5, NaN, Infinity, "missing"]) assert.equal(visuals.cardPosition(card), "0% 0%");
});

test("seuls les signaux visibles de coup reçu déclenchent la réaction du joueur", () => {
  for (const visualCue of ["player-hit", "player-hit-hard", "player-rocked", "trade"]) {
    assert.equal(visuals.resultPose({ visualCue, actionId: "power_hook" }), "impact");
  }
  for (const visualCue of ["opponent-hit", "opponent-hit-hard", "neutral", "miss", "block", "player-win", "opponent-win"]) {
    assert.equal(visuals.resultPose({ visualCue, actionId: "power_hook", side: "opponent" }), "hook");
  }
  assert.equal(visuals.resultPose({ visualCue: "neutral", actionId: "body_attack" }), "body");
  assert.equal(visuals.resultPose({ visualCue: "neutral", actionId: "high_guard" }, "lateral_evade"), "slip");
  assert.equal(visuals.resultPose(null), "guard");
});

test("les knockdowns et les arrêts préservent la pose de base pour leurs effets existants", () => {
  for (const visualCue of ["knockdown", "player-knockdown", "opponent-knockdown", "knockout", "referee-stoppage"]) {
    assert.equal(visuals.resultPose({ visualCue, actionId: "power_hook" }), "guard");
  }
  for (const knockedDown of ["player", "opponent"]) {
    assert.equal(visuals.resultPose({ visualCue: "trade", knockdown: { knockedDown }, actionId: "power_hook" }), "guard");
  }
});

test("la présentation ne modifie aucune donnée et ne consulte pas les scores", () => {
  const result = Object.freeze({
    visualCue: "neutral",
    actionId: "body_attack",
    get edge() { throw new Error("Le score ne doit pas être lu."); },
    get playerImpact() { throw new Error("Les dégâts ne doivent pas être lus."); },
    get opponentImpact() { throw new Error("Les dégâts ne doivent pas être lus."); },
    get judgeCards() { throw new Error("Les cartes ne doivent pas être lues."); },
  });
  const profile = Object.freeze({ sex: "female", portraitId: 0 });
  assert.equal(visuals.resultPose(result), "body");
  assert.equal(visuals.isPilotProfile(profile), true);
  const before = JSON.stringify(combat.ACTIONS);
  for (const actionId of Object.keys(combat.ACTIONS)) {
    const visual = visuals.actionVisual(actionId);
    visuals.spritePosition(visual.pose);
    visuals.cardPosition(visual.card);
    visuals.resultPose(Object.freeze({ visualCue: "opponent-hit", actionId }));
  }
  assert.equal(JSON.stringify(combat.ACTIONS), before);
  assert.throws(() => { visuals.actionVisual("body_attack").pose = "guard"; }, TypeError);
});
