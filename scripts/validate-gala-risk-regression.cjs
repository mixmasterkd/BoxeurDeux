"use strict";
// Replays the known BE-E week-105 examples with startFight's rounded difficulty.
// Generate the input with the BE-E browser campaigns; this never reads a live save.
const fs = require("node:fs");
const combat = require("../combat-engine.js");
const risk = require("../gala-risk.js");
const point = JSON.parse(fs.readFileSync("/tmp/boxeur-be-e-regulier-1366.json", "utf8")).observations.at(-1);
if (point.week !== 105) throw Error("Expected 104-week BE-E checkpoint");
const rows = [];
for (const opponent of point.offers) for (const condition of ["actual", "standard"]) {
  const player = condition === "actual" ? point.combatPlayer : { ...point.combatPlayer, energy: 90, fatigue: 5 };
  let wins = 0;
  for (let i = 0; i < 300; i++) {
    const result = combat.simulateFight({ seed: `risk-regression:${opponent.rosterFighterId}:${i}`, kind: "local", exchangesPerRound: 5,
      actionChoiceCount: 5, opponentDifficulty: Math.round(opponent.rating), coachQuality: .60, player, opponent }, {
      coach: (fight, choices) => choices.find(c => c.id === "recover" && fight.fighters.player.energy < 35)
        || choices.find(c => c.recommended) || choices[0],
      action: (fight, choices) => choices.find(c => c.directiveAligned) || choices[0],
    }).result;
    wins += result.winner === "player" ? 1 : 0;
  }
  rows.push({ opponent: opponent.rosterFighterId, condition,
    assessment: risk.assess(player.stats, opponent.stats, opponent.style), samples: 300, wins,
    winPercent: Math.round(wins / 3 * 100) / 100 });
}
console.log(JSON.stringify({ week: point.week, simulations: 1800, rows }, null, 2));
