(function combatVisualsFactory(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurCombatVisuals = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildCombatVisuals() {
  "use strict";

  // Presentation only: these entries never select actions or change their costs.
  const ACTION_VISUALS = Object.freeze(Object.fromEntries([
    ["cautious_jab", "Jab", 0, "jab"],
    ["double_jab_move", "Double jab", 0, "jab"],
    ["fast_combination", "Enchaînement", 1, "jab"],
    ["body_attack", "Au corps", 2, "body"],
    ["power_hook", "Crochet", 3, "hook"],
    ["feint_attack", "Feinte", 4, "guard"],
    ["controlled_pressure", "Pression", 5, "guard"],
    ["counter_attack", "Contre", 6, "jab"],
    ["cut_ring", "Couper le ring", 5, "guard"],
    ["high_guard", "Garde haute", 7, "guard"],
    ["parry_counter", "Parade-contre", 6, "jab"],
    ["lateral_evade", "Esquive", 8, "slip"],
    ["roll_under", "Sous le coup", 8, "slip"],
    ["retreat_step", "Retrait", 8, "guard"],
    ["pivot_exit", "Pivot", 8, "slip"],
    ["clinch", "Clinch", 9, "guard"],
    ["compact_cover", "Compact", 7, "guard"],
    ["retake_center", "Au centre", 5, "guard"],
    ["protect_body", "Coudes serrés", 7, "guard"],
    ["finish_pressure", "Accélérer", 1, "jab"],
  ].map(([id, title, card, pose]) => [id, Object.freeze({ title, card, pose })])));

  const SPRITE_CELLS = Object.freeze({ guard: 0, jab: 1, body: 2, hook: 3, slip: 4, impact: 5 });
  // These are the intentions already shown to the player, never the hidden plan.
  const OPPONENT_POSES = Object.freeze({
    aggressive_entry: "hook", long_jab: "jab", quick_combination: "jab",
    body_pressure: "body", counter_trap: "jab", circle_away: "slip",
    compact_cover: "guard", finish_pressure: "hook",
  });
  const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  function pilotProfileContext(profile) {
    const portraitId = Math.max(0, Math.min(2, Math.round(Number(profile?.portraitId) || 0)));
    if (portraitId !== 0 || !["female", "male"].includes(profile?.sex)) return null;
    return `${profile.sex}-1`;
  }

  function isPilotProfile(profile) {
    return Boolean(pilotProfileContext(profile));
  }

  function actionVisual(actionId) {
    return owns(ACTION_VISUALS, actionId) ? ACTION_VISUALS[actionId] : null;
  }

  function isNadiaSparring(profile, meta) {
    return sparringOpponentContext(profile, meta) === "nadia";
  }

  function sparringOpponentContext(profile, meta) {
    if (meta?.isLocalOfficialFight || meta?.isTournamentOfficialFight
      || !(meta?.isRecreationalSparring || meta?.isPracticeSparring)) return null;
    if (profile?.sex === "female") return "nadia";
    if (profile?.sex === "male") return "remy";
    return null;
  }

  function opponentActionPose(shownIntentionId) {
    return owns(OPPONENT_POSES, shownIntentionId) ? OPPONENT_POSES[shownIntentionId] : "guard";
  }

  function officialOpponentContext(profile, meta, careerStatus) {
    if (careerStatus === "professional" || !["female", "male"].includes(profile?.sex)
      || !(meta?.isLocalOfficialFight || meta?.isTournamentOfficialFight)
      || meta?.isRecreationalSparring || meta?.isPracticeSparring) return null;
    // One shared opponent appearance for each amateur roster division.
    return `official-${profile.sex}`;
  }

  function opponentResultPose(result) {
    const cue = result?.visualCue || "";
    if (result?.knockdown || /^(?:(?:player-|opponent-)?knockdown|knockout|referee-stoppage)$/.test(cue)) return "guard";
    if (/^(?:opponent-hit(?:-hard)?|opponent-rocked|trade)$/.test(cue)) return "impact";
    return opponentActionPose(result?.shownIntentionId);
  }

  function atlasPosition(index, columns) {
    return `${index % columns * 100 / (columns - 1)}% ${Math.floor(index / columns) * 100}%`;
  }

  function spritePosition(pose) {
    return atlasPosition(owns(SPRITE_CELLS, pose) ? SPRITE_CELLS[pose] : 0, 3);
  }

  function cardPosition(card) {
    const index = Number(card);
    return atlasPosition(Number.isInteger(index) && index >= 0 && index <= 9 ? index : 0, 5);
  }

  function resultPose(result, actionId) {
    const cue = result?.visualCue || "";
    // Existing knockdown transforms keep control of both fighters' silhouettes.
    if (result?.knockdown || /^(?:(?:player-|opponent-)?knockdown|knockout|referee-stoppage)$/.test(cue)) return "guard";
    // Use the displayed exchange cue; no score, judge card or impact calculation.
    if (/^(?:player-hit(?:-hard)?|player-rocked|trade)$/.test(cue)) return "impact";
    return actionVisual(actionId || result?.actionId)?.pose || "guard";
  }

  return Object.freeze({ pilotProfileContext, isPilotProfile, isNadiaSparring, sparringOpponentContext, officialOpponentContext, actionVisual, spritePosition, cardPosition, resultPose, opponentActionPose, opponentResultPose });
});
