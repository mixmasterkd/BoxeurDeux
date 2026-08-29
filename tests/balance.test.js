const test = require("node:test");
const assert = require("node:assert/strict");

const combat = require("../combat-engine.js");
const balance = require("../v2-balance-engine.js");

// Banc de non-régression statistique. Sa graine et sa taille sont fixes par
// défaut, mais BALANCE_SAMPLES permet une campagne plus longue en CI sans
// changer les règles du jeu.
const SAMPLE_COUNT = Math.max(300, Number(process.env.BALANCE_SAMPLES) || 1600);
const FAMILIES = ["attack", "distance", "defense"];
const BEATS = Object.freeze({ attack: "distance", distance: "defense", defense: "attack" });
const FATIGUE = Object.freeze({ attack: 16, distance: 10, defense: 7 });

const balanced = value => ({ technique: value, power: value, cardio: value, defense: value });
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

function weightedSkill(stats, family) {
  const weights = combat.LEGACY_WEIGHTS[family];
  return Object.entries(weights).reduce((total, [stat, weight]) => total + stats[stat] * weight, 0);
}

function counterTo(family) {
  return FAMILIES.find(candidate => BEATS[candidate] === family);
}

function stylePreference(style, rng) {
  if (/puncheur|pression|bagarreur/i.test(style || "")) return "attack";
  if (/technicien|mobile/i.test(style || "")) return "distance";
  if (/contre|défensif/i.test(style || "")) return "defense";
  return FAMILIES[Math.floor(rng() * FAMILIES.length)];
}

function tacticalEdge(playerFamily, opponentFamily) {
  if (BEATS[playerFamily] === opponentFamily) return 4.5;
  if (BEATS[opponentFamily] === playerFamily) return -4.5;
  return 0;
}

function legacyEnergyCost(stats, family, opposingStats, opposingFamily, rng) {
  const cardioRelief = clamp((stats.cardio - 40) * 0.08, -2, 5);
  const intensity = opposingFamily === "attack" ? 0.12 : opposingFamily === "distance" ? 0.075 : 0.045;
  const incomingPressure = clamp(
    opposingStats.power * intensity + opposingStats.technique * 0.025 - stats.defense * 0.075,
    0,
    7,
  );
  return Math.max(4, Math.round(FATIGUE[family] - cardioRelief + incomingPressure + rng() * 2));
}

/**
 * Reproduction autonome du résolveur historique de script.js : mêmes poids,
 * triangle tactique (+/-4,5), condition, cardio tardif, puissance, bruit de
 * round [-6,+6], coûts d'énergie et scores 10-9/10-8. Le joueur répond à
 * l'indice imparfait qui était montré dans l'ancienne interface.
 */
function simulateLegacy(config, seed) {
  const rng = combat.createSeededRng(seed);
  const playerStats = config.playerStats;
  const opponentStats = config.opponentStats;
  const style = config.style || "Équilibré";
  const difficulty = config.difficulty == null ? 40 : config.difficulty;
  let playerEnergy = config.energy == null ? 84 : config.energy;
  let opponentEnergy = config.energy == null ? 84 : config.energy;
  let playerPoints = 0;
  let opponentPoints = 0;
  let lastPlayerFamily = null;

  for (let round = 1; round <= 3; round += 1) {
    let opponentFamily;
    if (round > 1 && lastPlayerFamily && rng() < 0.25 + difficulty / 250) {
      opponentFamily = counterTo(lastPlayerFamily);
    } else if (opponentEnergy < 24 && rng() < 0.65) {
      opponentFamily = "defense";
    } else if (rng() < 0.62) {
      opponentFamily = stylePreference(style, rng);
    } else {
      opponentFamily = FAMILIES[Math.floor(rng() * FAMILIES.length)];
    }

    const accuracy = clamp(
      0.38 + (playerStats.technique - 35) * 0.006 + ((config.morale ?? 50) - 50) * 0.0015,
      0.34,
      0.74,
    );
    const preferred = stylePreference(style, rng);
    const alternatives = FAMILIES.filter(family => family !== opponentFamily);
    const shownFamily = rng() < accuracy
      ? opponentFamily
      : (preferred !== opponentFamily ? preferred : alternatives[Math.floor(rng() * alternatives.length)]);
    const playerFamily = counterTo(shownFamily);

    const matchup = tacticalEdge(playerFamily, opponentFamily);
    const repeatPenalty = lastPlayerFamily === playerFamily ? -2.5 : 0;
    const playerCondition = (playerEnergy - 70) * 0.10
      + ((config.fitness ?? 50) - 50) * 0.06
      - (config.fatigue ?? 0) * 0.09
      - (config.injury ?? 0) * 0.04
      + ((config.morale ?? 50) - 50) * 0.045;
    const opponentCondition = (opponentEnergy - 70) * 0.10;
    const lateCardio = (round - 1) * (playerStats.cardio - opponentStats.cardio) * 0.065;
    const tacticalTechnique = (playerStats.technique - opponentStats.technique) * 0.03;
    const playerPower = (playerStats.power - opponentStats.defense) * (playerFamily === "attack" ? 0.08 : 0.035);
    const opponentPower = (opponentStats.power - playerStats.defense) * (opponentFamily === "attack" ? 0.08 : 0.035);
    const edge = weightedSkill(playerStats, playerFamily) + playerCondition + matchup + repeatPenalty
      + lateCardio + tacticalTechnique + playerPower
      - weightedSkill(opponentStats, opponentFamily) - opponentCondition - opponentPower
      + (rng() * 12 - 6);

    if (edge >= 8.5) {
      playerPoints += 10;
      opponentPoints += 8;
    } else if (edge >= 0) {
      playerPoints += 10;
      opponentPoints += 9;
    } else if (edge <= -8.5) {
      playerPoints += 8;
      opponentPoints += 10;
    } else {
      playerPoints += 9;
      opponentPoints += 10;
    }

    playerEnergy = clamp(playerEnergy - legacyEnergyCost(playerStats, playerFamily, opponentStats, opponentFamily, rng));
    opponentEnergy = clamp(opponentEnergy - legacyEnergyCost(opponentStats, opponentFamily, playerStats, playerFamily, rng));
    if (round < 3) {
      playerEnergy = clamp(playerEnergy + clamp(Math.round((playerStats.cardio - 30) * 0.075), 1, 6));
      opponentEnergy = clamp(opponentEnergy + clamp(Math.round((opponentStats.cardio - 30) * 0.075), 1, 6));
    }
    lastPlayerFamily = playerFamily;
  }

  return playerPoints > opponentPoints ? "player" : playerPoints < opponentPoints ? "opponent" : "draw";
}

function newConfig(scenario, seed, index) {
  return {
    seed: `${seed}-new-${index}`,
    kind: index % 2 ? "local" : "tournament",
    opponentDifficulty: scenario.difficulty,
    player: {
      name: "Profil test",
      stats: scenario.playerStats,
      energy: 84,
      fitness: 50,
      fatigue: 0,
      injury: 0,
      morale: 50,
    },
    opponent: {
      name: "Adversaire test",
      style: scenario.style || "Équilibré",
      stats: scenario.opponentStats,
      energy: 84,
      fitness: 50,
      fatigue: 0,
      injury: 0,
      morale: 50,
    },
  };
}

function runScenario(name, scenario, samples = SAMPLE_COUNT) {
  const tally = {
    name,
    samples,
    legacyWins: 0,
    legacyDraws: 0,
    newWins: 0,
    newLosses: 0,
    ko: 0,
    tko: 0,
    decision: 0,
    invalid: 0,
  };
  for (let index = 0; index < samples; index += 1) {
    const legacy = simulateLegacy(scenario, `${name}-legacy-${index}`);
    if (legacy === "player") tally.legacyWins += 1;
    if (legacy === "draw") tally.legacyDraws += 1;

    const state = combat.simulateFight(newConfig(scenario, name, index));
    if (state.result.winner === "player") tally.newWins += 1;
    else if (state.result.winner === "opponent") tally.newLosses += 1;
    else tally.invalid += 1;
    const method = String(state.result.method || "").toLowerCase();
    if (method === "ko") tally.ko += 1;
    else if (method === "tko") tally.tko += 1;
    else if (method === "decision") tally.decision += 1;
    else tally.invalid += 1;
  }
  return {
    ...tally,
    legacyRate: (tally.legacyWins + tally.legacyDraws * 0.5) / samples,
    legacyDrawRate: tally.legacyDraws / samples,
    newRate: tally.newWins / samples,
    stoppageRate: (tally.ko + tally.tko) / samples,
    koRate: tally.ko / samples,
    tkoRate: tally.tko / samples,
  };
}

function formatMetrics(metrics) {
  const percentage = value => `${(value * 100).toFixed(1)} %`;
  return `${metrics.name}: ancien=${percentage(metrics.legacyRate)} (nuls ${percentage(metrics.legacyDrawRate)}), `
    + `nouveau=${percentage(metrics.newRate)}, KO=${percentage(metrics.koRate)}, TKO=${percentage(metrics.tkoRate)}`;
}

const scenarios = Object.freeze({
  favorable: Object.freeze({ playerStats: balanced(47), opponentStats: balanced(45), difficulty: 25 }),
  comparable: Object.freeze({ playerStats: balanced(45), opponentStats: balanced(45), difficulty: 40 }),
  unfavorable: Object.freeze({ playerStats: balanced(43), opponentStats: balanced(45), difficulty: 75 }),
});

const results = Object.fromEntries(
  Object.entries(scenarios).map(([name, scenario]) => [name, runScenario(name, scenario)]),
);

test("le banc déterministe mesure le nouveau moteur contre le résolveur historique", t => {
  for (const metrics of Object.values(results)) t.diagnostic(formatMetrics(metrics));
  assert.equal(results.comparable.samples, SAMPLE_COUNT);
  assert.equal(results.comparable.invalid, 0);
  assert.ok(results.comparable.legacyRate >= 0.43 && results.comparable.legacyRate <= 0.57);
  assert.ok(
    results.comparable.newRate >= balance.ACCEPTANCE.combat.comparableWinRateMinimum
      && results.comparable.newRate <= balance.ACCEPTANCE.combat.comparableWinRateMaximum,
  );
  assert.ok(
    Math.abs(results.comparable.newRate - results.comparable.legacyRate) <= 0.12,
    "un profil comparable ne doit pas être déplacé de plus de 12 points de pourcentage",
  );
});

test("les avantages et désavantages de statistiques/difficulté restent ordonnés", () => {
  for (const model of ["legacyRate", "newRate"]) {
    assert.ok(results.favorable[model] > results.comparable[model] + 0.16, `${model}: l'avantage doit être sensible`);
    assert.ok(results.unfavorable[model] < results.comparable[model] - 0.16, `${model}: le désavantage doit être sensible`);
  }
  assert.ok(Math.abs(results.favorable.newRate - results.favorable.legacyRate) <= 0.18);
  assert.ok(Math.abs(results.unfavorable.newRate - results.unfavorable.legacyRate) <= 0.18);
});

test("le nouveau format amateur ne rend jamais un nul et conserve 3/5 juges", () => {
  for (const metrics of Object.values(results)) {
    assert.equal(metrics.newWins + metrics.newLosses, metrics.samples);
    assert.equal(metrics.invalid, 0);
    assert.equal(metrics.ko + metrics.tko + metrics.decision, metrics.samples);
  }
  const local = combat.simulateFight(newConfig(scenarios.comparable, "judge-local", 1));
  const tournament = combat.simulateFight({ ...newConfig(scenarios.comparable, "judge-tournament", 2), kind: "tournament" });
  assert.equal(local.format.judgeCount, 3);
  assert.equal(tournament.format.judgeCount, 5);
});

test("les arrêts sont rares à niveau comparable et liés à une vulnérabilité réelle", t => {
  const danger = runScenario("danger", {
    playerStats: { technique: 50, power: 75, cardio: 48, defense: 48 },
    opponentStats: { technique: 42, power: 42, cardio: 42, defense: 35 },
    difficulty: 45,
  }, Math.max(600, Math.round(SAMPLE_COUNT * 0.5)));
  t.diagnostic(formatMetrics(danger));
  assert.ok(
    results.comparable.stoppageRate <= balance.ACCEPTANCE.combat.comparableStoppageMaximum,
    "KO/TKO doit rester rare entre boxeurs frais comparables",
  );
  assert.ok(danger.stoppageRate >= 0.10, "une puissance élevée face à une défense faible doit augmenter les arrêts");
  assert.ok(danger.stoppageRate <= 0.75, "même un net avantage ne doit pas garantir automatiquement un arrêt");
  assert.ok(danger.ko > 0, "la voie KO doit être atteignable");
  assert.ok(danger.tko > 0, "la voie TKO doit être atteignable");
});
