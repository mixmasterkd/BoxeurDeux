"use strict";
// Offline only. No game/save imports or real reserved seeds. JSON goes to stdout.
const combat = require("../combat-engine.js");
const roster = require("../roster-engine.js");
const risk = require("../gala-risk.js");
const stage = process.env.RISK_STAGE || "calibration";
const samples = Number(process.env.RISK_SAMPLES) || 100;
const keys = ["technique", "power", "cardio", "defense"];
const mean = stats => keys.reduce((sum, key) => sum + stats[key], 0) / 4;
const shapes = [[0, 0, 0, 0], [0, 6, -3, -3], [4, -5, 5, -4], [1, -4, -2, 5]];
const rows = [];
for (const [levelIndex, level] of [43, 65, 85].entries()) {
  for (const [shapeIndex, shape] of shapes.entries()) {
    for (let i = 0; i < 10; i++) {
      const sex = (i + shapeIndex + levelIndex) % 2 ? "female" : "male";
      const circuit = roster.createState({ sex, weightClass: sex === "male" ? "M65" : "W57", seed: `risk-${stage}` });
      const source = circuit.fighters[i];
      const gap = [-6, -3, 0, 3, 6][(i + shapeIndex + levelIndex) % 5];
      // Holdout also changes shapes and means, not only combat noise.
      const jitter = combat.createSeededRng(`${stage}:${level}:${shapeIndex}:${i}`);
      const playerStats = Object.fromEntries(keys.map((key, k) => [key, level + shape[k]
        + (stage === "validation" ? (jitter() - .5) * 3 : 0)]));
      const opponentStats = Object.fromEntries(keys.map(key => [key, Math.max(1, Math.min(99,
        source.stats[key] - mean(source.stats) + level + gap))]));
      const assessment = risk.assess(playerStats, opponentStats, source.style);
      for (const policy of ["novice", "coached"]) for (const condition of ["standard", "tired"]) {
        let wins = 0;
        for (let sample = 0; sample < samples; sample++) {
          const result = combat.simulateFight({
            seed: `gala-risk:${stage}:${level}:${shapeIndex}:${i}:${policy}:${sample}`,
            kind: "local", exchangesPerRound: 5, actionChoiceCount: 5, coachQuality: .60,
            opponentDifficulty: Math.max(20, Math.min(99, Math.round(mean(opponentStats)))),
            player: { id: "player", stats: playerStats, style: "Équilibré", energy: condition === "standard" ? 90 : 30,
              fatigue: condition === "standard" ? 5 : 70, fitness: 50, morale: 50, injury: 0, level: 1, experience: 0 },
            opponent: { id: source.id, style: source.style, stats: opponentStats },
          }, {
            coach: (state, choices) => choices.find(c => c.id === "recover" && state.fighters.player.energy < 35)
              || choices.find(c => c.recommended) || choices[0],
            action: (state, choices) => policy === "novice" ? choices[(state.round + state.exchange) % choices.length]
              : choices.find(c => c.directiveAligned) || choices[0],
          }).result;
          wins += result.winner === "player" ? 1 : 0;
        }
        rows.push({ level, shapeIndex, sex, opponent: source.id, gap, policy, condition,
          label: assessment.id, index: assessment.index, samples, wins, winPercent: Math.round(wins / samples * 10000) / 100 });
      }
    }
  }
}
const summary = [];
for (const condition of ["standard", "tired"]) for (const label of ["favorable", "demanding", "challenging"]) {
  const subset = rows.filter(row => row.condition === condition && row.label === label);
  summary.push({ condition, label, cases: subset.length, min: Math.min(...subset.map(r => r.winPercent)),
    max: Math.max(...subset.map(r => r.winPercent)), average: subset.reduce((sum, r) => sum + r.winPercent, 0) / subset.length });
}
console.log(JSON.stringify({ stage, samples, simulations: rows.length * samples,
  note: "Offline scripted policies without voluntary ring movement; not human win probabilities. Tired state is a separate condition warning, never a sporting grade change.",
  summary, unfavorableFavorable: rows.filter(r => r.condition === "standard" && r.label === "favorable" && r.winPercent < 40), rows }, null, 2));
