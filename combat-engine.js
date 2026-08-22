(function attachBoxeurCombat(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurCombat = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurCombatApi() {
  "use strict";

  const VERSION = 1;
  const ROUND_COUNT = 3;
  const DEFAULT_EXCHANGES = 5;
  const DISTANCES = ["outside", "mid", "inside"];
  const POSITIONS = ["center", "near_ropes", "ropes", "corner"];
  const FAMILIES = ["attack", "distance", "defense"];

  // These are the exact strategy weights used by the original round resolver.
  const LEGACY_WEIGHTS = Object.freeze({
    attack: Object.freeze({ technique: 0.28, power: 0.42, cardio: 0.14, defense: 0.16 }),
    distance: Object.freeze({ technique: 0.38, power: 0.10, cardio: 0.28, defense: 0.24 }),
    defense: Object.freeze({ technique: 0.24, power: 0.12, cardio: 0.24, defense: 0.40 }),
  });

  const FAMILY_ROUND_COST = Object.freeze({ attack: 16, distance: 10, defense: 7 });
  const FAMILY_INTENSITY = Object.freeze({ attack: 0.12, distance: 0.075, defense: 0.045 });
  const COUNTER_PLAN = Object.freeze({ attack: "defense", distance: "attack", defense: "distance" });

  const INTENTIONS = Object.freeze({
    aggressive_entry: Object.freeze({
      id: "aggressive_entry", label: "Entrée agressive", family: "attack", aggression: 0.92,
      impact: 6.2, target: "head", pressure: 2, desiredDistance: "mid",
      description: "Il semble vouloir entrer fort derrière ses premiers coups.",
    }),
    long_jab: Object.freeze({
      id: "long_jab", label: "Jab à distance", family: "distance", aggression: 0.48,
      impact: 3.2, target: "head", pressure: 0.5, desiredDistance: "outside",
      description: "Il prépare probablement son jab pour contrôler la distance.",
    }),
    quick_combination: Object.freeze({
      id: "quick_combination", label: "Combinaison rapide", family: "attack", aggression: 0.82,
      impact: 5.8, target: "head", pressure: 1.4, desiredDistance: "mid",
      description: "Ses appuis annoncent une combinaison rapide à mi-distance.",
    }),
    body_pressure: Object.freeze({
      id: "body_pressure", label: "Pression au corps", family: "attack", aggression: 0.78,
      impact: 6.0, target: "body", pressure: 1.6, desiredDistance: "inside",
      description: "Il baisse son niveau et paraît viser le corps.",
    }),
    counter_trap: Object.freeze({
      id: "counter_trap", label: "Piège de contre", family: "defense", aggression: 0.35,
      impact: 6.8, target: "head", pressure: 0, desiredDistance: "mid",
      description: "Il temporise et semble attendre une ouverture pour contrer.",
    }),
    circle_away: Object.freeze({
      id: "circle_away", label: "Déplacement extérieur", family: "distance", aggression: 0.30,
      impact: 2.5, target: "head", pressure: -1, desiredDistance: "outside",
      description: "Il cherche probablement à tourner et à garder l'extérieur.",
    }),
    compact_cover: Object.freeze({
      id: "compact_cover", label: "Garde compacte", family: "defense", aggression: 0.18,
      impact: 2.2, target: "body", pressure: -0.5, desiredDistance: "inside",
      description: "Il se referme pour casser le rythme et récupérer.",
    }),
    finish_pressure: Object.freeze({
      id: "finish_pressure", label: "Accélération", family: "attack", aggression: 1,
      impact: 8.4, target: "head", pressure: 2.4, desiredDistance: "mid",
      description: "Il croit voir une ouverture et paraît vouloir accélérer.",
    }),
  });

  const ACTIONS = Object.freeze({
    cautious_jab: Object.freeze({
      id: "cautious_jab", label: "Jab prudent", family: "distance", tags: ["jab", "cautious", "control"],
      distances: ["outside", "mid"], cost: 1.65, impact: 3.0, target: "head", aggression: 0.35, risk: "low",
      description: "Marquer sans s'engager et conserver de l'énergie.",
      responses: { aggressive_entry: 0.8, long_jab: 0.7, counter_trap: 1.2, circle_away: 0.8 },
    }),
    double_jab_move: Object.freeze({
      id: "double_jab_move", label: "Double jab et déplacement", family: "distance", tags: ["jab", "angle", "exit"],
      distances: ["outside", "mid"], cost: 2.2, impact: 3.7, target: "head", aggression: 0.52, risk: "low",
      description: "Occuper l'adversaire et sortir de sa ligne d'attaque.",
      responses: { aggressive_entry: 2.1, long_jab: 1.4, quick_combination: 1.1, circle_away: 1.0 },
    }),
    fast_combination: Object.freeze({
      id: "fast_combination", label: "Combinaison rapide", family: "attack", tags: ["combo", "speed", "pressure"],
      distances: ["mid", "inside"], cost: 3.05, impact: 6.2, target: "head", aggression: 0.82, risk: "medium",
      description: "Accumuler des coups nets avant de ressortir.",
      responses: { long_jab: 1.0, compact_cover: 1.5, circle_away: 0.7, counter_trap: -1.8 },
    }),
    body_attack: Object.freeze({
      id: "body_attack", label: "Attaque au corps", family: "attack", tags: ["body", "pressure"],
      distances: ["mid", "inside"], cost: 3.0, impact: 6.5, target: "body", aggression: 0.78, risk: "medium",
      description: "Entamer l'énergie adverse en acceptant une ouverture à la tête.",
      responses: { long_jab: 1.8, compact_cover: 1.3, counter_trap: 0.5, quick_combination: -0.8 },
    }),
    power_hook: Object.freeze({
      id: "power_hook", label: "Crochet puissant", family: "attack", tags: ["power", "finish"],
      distances: ["mid", "inside"], cost: 3.65, impact: 9.0, target: "head", aggression: 1, risk: "high",
      description: "Chercher un coup décisif au prix d'une forte exposition.",
      responses: { compact_cover: 0.8, body_pressure: 0.3, counter_trap: -2.6, circle_away: -1.5 },
    }),
    feint_attack: Object.freeze({
      id: "feint_attack", label: "Feinte puis attaque", family: "distance", tags: ["feint", "angle", "attack"],
      distances: ["outside", "mid"], cost: 2.45, impact: 5.4, target: "head", aggression: 0.62, risk: "medium",
      description: "Provoquer une réaction avant de choisir l'ouverture.",
      responses: { counter_trap: 3.0, compact_cover: 1.7, long_jab: 0.8, aggressive_entry: -0.5 },
    }),
    controlled_pressure: Object.freeze({
      id: "controlled_pressure", label: "Pression contrôlée", family: "attack", tags: ["pressure", "control", "ringcraft"],
      distances: ["outside", "mid", "inside"], cost: 2.8, impact: 5.2, target: "head", aggression: 0.72, risk: "medium",
      description: "Avancer sans se jeter et limiter les sorties adverses.",
      responses: { circle_away: 2.5, compact_cover: 1.3, long_jab: 0.9, counter_trap: -0.7 },
    }),
    counter_attack: Object.freeze({
      id: "counter_attack", label: "Contre-attaque", family: "defense", tags: ["counter", "timing"],
      distances: ["outside", "mid", "inside"], cost: 1.85, impact: 7.0, target: "head", aggression: 0.55, risk: "high",
      description: "Laisser venir puis frapper dans l'ouverture.",
      responses: { aggressive_entry: 2.8, quick_combination: 2.1, finish_pressure: 2.4, long_jab: 0.3, circle_away: -1.0 },
    }),
    cut_ring: Object.freeze({
      id: "cut_ring", label: "Couper le ring", family: "distance", tags: ["pressure", "ringcraft", "center"],
      distances: ["outside", "mid"], cost: 2.25, impact: 3.4, target: "body", aggression: 0.55, risk: "low",
      description: "Fermer les sorties et conduire l'adversaire vers les câbles.",
      responses: { circle_away: 3.1, long_jab: 0.7, compact_cover: 0.8 },
    }),
    high_guard: Object.freeze({
      id: "high_guard", label: "Garde haute", family: "defense", tags: ["guard", "protect_head", "cautious"],
      distances: ["outside", "mid", "inside"], cost: 1.25, impact: 1.7, target: "head", aggression: 0.12, risk: "low",
      description: "Réduire les dégâts à la tête mais céder du terrain.",
      responses: { aggressive_entry: 1.5, quick_combination: 2.2, finish_pressure: 2.1, body_pressure: -1.1 },
    }),
    parry_counter: Object.freeze({
      id: "parry_counter", label: "Parade et contre", family: "defense", tags: ["parry", "counter", "timing"],
      distances: ["outside", "mid"], cost: 1.8, impact: 6.0, target: "head", aggression: 0.48, risk: "medium",
      description: "Dévier le premier coup et répondre immédiatement.",
      responses: { long_jab: 3.1, aggressive_entry: 1.4, quick_combination: 0.8, body_pressure: -0.8 },
    }),
    lateral_evade: Object.freeze({
      id: "lateral_evade", label: "Esquive latérale", family: "defense", tags: ["evade", "angle", "exit"],
      distances: ["outside", "mid"], cost: 1.7, impact: 2.5, target: "head", aggression: 0.22, risk: "medium",
      description: "Quitter la ligne d'attaque et créer un nouvel angle.",
      responses: { aggressive_entry: 2.7, long_jab: 1.7, quick_combination: 1.5, finish_pressure: 2.0 },
    }),
    roll_under: Object.freeze({
      id: "roll_under", label: "Rouler sous le crochet", family: "defense", tags: ["evade", "roll", "angle"],
      distances: ["mid", "inside"], cost: 1.75, impact: 3.0, target: "body", aggression: 0.32, risk: "high",
      description: "Passer sous le coup et ressortir sur le côté.",
      responses: { quick_combination: 2.3, finish_pressure: 2.5, aggressive_entry: 1.0, long_jab: -1.1 },
    }),
    retreat_step: Object.freeze({
      id: "retreat_step", label: "Pas de retrait", family: "defense", tags: ["retreat", "cautious", "distance"],
      distances: ["outside", "mid"], cost: 1.35, impact: 1.8, target: "head", aggression: 0.10, risk: "low",
      description: "Faire manquer et rétablir la distance, au risque de céder le ring.",
      responses: { aggressive_entry: 1.6, quick_combination: 1.1, finish_pressure: 1.4, circle_away: -0.5 },
    }),
    pivot_exit: Object.freeze({
      id: "pivot_exit", label: "Pivot de sortie", family: "distance", tags: ["pivot", "angle", "exit", "center"],
      distances: ["outside", "mid", "inside"], cost: 2.0, impact: 3.0, target: "head", aggression: 0.35, risk: "medium",
      description: "Sortir des câbles ou du coin en changeant l'angle.",
      responses: { aggressive_entry: 2.8, body_pressure: 2.1, quick_combination: 1.4, finish_pressure: 2.2 },
    }),
    clinch: Object.freeze({
      id: "clinch", label: "Clinch", family: "defense", tags: ["clinch", "recover", "cautious"],
      distances: ["mid", "inside"], cost: 0.95, impact: 0.8, target: "body", aggression: 0.05, risk: "low",
      description: "Casser la séquence et reprendre son souffle sans marquer.",
      responses: { body_pressure: 2.7, aggressive_entry: 1.6, quick_combination: 1.4, finish_pressure: 2.5 },
    }),
    compact_cover: Object.freeze({
      id: "compact_cover", label: "Couverture compacte", family: "defense", tags: ["guard", "cautious", "recover"],
      distances: ["mid", "inside"], cost: 1.05, impact: 1.0, target: "head", aggression: 0.05, risk: "low",
      description: "Absorber l'orage et attendre une sortie, en abandonnant l'initiative.",
      responses: { quick_combination: 2.3, finish_pressure: 2.4, aggressive_entry: 1.3, body_pressure: 0.4 },
    }),
    retake_center: Object.freeze({
      id: "retake_center", label: "Reprendre le centre", family: "distance", tags: ["center", "angle", "ringcraft"],
      distances: ["outside", "mid", "inside"], cost: 1.95, impact: 2.5, target: "head", aggression: 0.30, risk: "medium",
      description: "Sacrifier une occasion de frapper pour améliorer la position.",
      responses: { circle_away: 1.7, compact_cover: 1.1, aggressive_entry: 0.7 },
    }),
    protect_body: Object.freeze({
      id: "protect_body", label: "Protéger le corps", family: "defense", tags: ["guard", "protect_body", "cautious"],
      distances: ["outside", "mid", "inside"], cost: 1.2, impact: 1.5, target: "body", aggression: 0.10, risk: "low",
      description: "Fermer les coudes et réduire les dégâts au corps, tête plus accessible.",
      responses: { body_pressure: 3.0, compact_cover: 0.6, quick_combination: -0.7, finish_pressure: -0.8 },
    }),
    finish_pressure: Object.freeze({
      id: "finish_pressure", label: "Accélérer proprement", family: "attack", tags: ["finish", "combo", "pressure"],
      distances: ["mid", "inside"], cost: 3.55, impact: 8.1, target: "head", aggression: 0.95, risk: "high",
      description: "Tenter de finir un adversaire ébranlé sans charger un seul coup.",
      responses: { compact_cover: 1.4, circle_away: 1.0, counter_trap: -1.7 },
    }),
  });

  function clamp(value, min = 0, max = 100) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, number));
  }

  function roundTo(value, decimals = 1) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function hashSeed(seed) {
    const text = String(seed == null ? "boxeur-deux" : seed);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0 || 0x6d2b79f5;
  }

  function createSeededRng(seed) {
    let state = hashSeed(seed);
    const random = function seededRandom() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    random.getState = () => state >>> 0;
    random.setState = value => { state = Number(value) >>> 0; };
    return random;
  }

  function nextRandom(state, injectedRng) {
    let value;
    if (typeof injectedRng === "function") {
      value = injectedRng();
    } else if (injectedRng && typeof injectedRng.next === "function") {
      const next = injectedRng.next();
      value = typeof next === "number" ? next : next && next.value;
    } else {
      state.rngState = (state.rngState + 0x6d2b79f5) >>> 0;
      let mixed = state.rngState;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      value = ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    }
    if (injectedRng && typeof injectedRng.getState === "function") {
      state.rngState = Number(injectedRng.getState()) >>> 0;
    }
    state.randomCounter += 1;
    return clamp(Number(value), 0, 0.9999999999999999);
  }

  function randomBetween(state, min, max, rng) {
    return min + nextRandom(state, rng) * (max - min);
  }

  function pick(state, values, rng) {
    return values[Math.floor(nextRandom(state, rng) * values.length)];
  }

  function weightedPick(state, entries, rng) {
    const usable = entries.filter(entry => entry.weight > 0);
    const total = usable.reduce((sum, entry) => sum + entry.weight, 0);
    if (!usable.length || total <= 0) return entries[0] && entries[0].value;
    let cursor = nextRandom(state, rng) * total;
    for (const entry of usable) {
      cursor -= entry.weight;
      if (cursor <= 0) return entry.value;
    }
    return usable[usable.length - 1].value;
  }

  function strategySkill(stats, family) {
    const weights = LEGACY_WEIGHTS[family] || LEGACY_WEIGHTS.distance;
    return Object.entries(weights).reduce((total, [key, weight]) => total + clamp(stats[key], 1, 99) * weight, 0);
  }

  function normalizeStats(stats) {
    return {
      technique: clamp(stats && stats.technique == null ? 40 : stats.technique, 1, 99),
      power: clamp(stats && stats.power == null ? 40 : stats.power, 1, 99),
      cardio: clamp(stats && stats.cardio == null ? 40 : stats.cardio, 1, 99),
      defense: clamp(stats && stats.defense == null ? 40 : stats.defense, 1, 99),
    };
  }

  function normalizeFighter(input, role) {
    const source = input || {};
    return {
      id: source.id || role,
      name: source.name || (role === "player" ? "Boxeur" : "Adversaire"),
      style: source.style || "Équilibré",
      stats: normalizeStats(source.stats || source.combatStats),
      energy: source.energy == null ? null : clamp(source.energy),
      fitness: clamp(source.fitness == null ? 50 : source.fitness),
      fatigue: clamp(source.fatigue == null ? 0 : source.fatigue),
      injury: clamp(source.injury == null ? 0 : source.injury),
      morale: clamp(source.morale == null ? 50 : source.morale),
      experience: Math.max(0, Number(source.experience) || 0),
      level: Math.max(1, Number(source.level) || 1),
      careerCondition: source.careerCondition == null ? role === "player" : Boolean(source.careerCondition),
      head: clamp(source.head == null ? 0 : source.head),
      body: clamp(source.body == null ? 0 : source.body),
      lucidity: clamp(source.lucidity == null ? 100 : source.lucidity),
      knockdowns: 0,
      roundKnockdowns: 0,
      unanswered: 0,
      legacyExposure: 0,
      lastActions: [],
    };
  }

  function stylePreference(style) {
    if (/puncheur|pression|bagarreur/i.test(style || "")) return "attack";
    if (/technicien|mobile/i.test(style || "")) return "distance";
    if (/contre|défensif/i.test(style || "")) return "defense";
    return null;
  }

  function conditionScore(fighter) {
    let score = (fighter.energy - 70) * 0.10;
    if (fighter.careerCondition) {
      score += (fighter.fitness - 50) * 0.06;
      score -= fighter.fatigue * 0.09;
      score -= fighter.injury * 0.04;
      score += (fighter.morale - 50) * 0.045;
    }
    return score;
  }

  function executionPenalty(fighter) {
    return clamp(
      fighter.head * 0.008 + fighter.body * 0.005 + (100 - fighter.lucidity) * 0.018,
      0,
      2.5,
    );
  }

  function readingAccuracy(state) {
    const fighter = state.fighters.player;
    const fights = Math.max(0, fighter.experience);
    const experienceBonus = Math.min(0.03, Math.log1p(fights) * 0.006 + (fighter.level - 1) * 0.004);
    const exchangeIndex = (state.round - 1) * state.format.exchangesPerRound + state.exchange;
    const limitedStudyExpired = Number.isFinite(state.coach.studyExchangeLimit) && exchangeIndex >= state.coach.studyExchangeLimit;
    const studyBonus = limitedStudyExpired ? 0 : state.coach.studyBonus * (state.round === 1 && state.exchange < 2 ? 1 : 0.35);
    const value = 0.38
      + (fighter.stats.technique - 35) * 0.006
      + (fighter.morale - 50) * 0.0015
      + experienceBonus
      + (fighter.lucidity - 50) * 0.001
      - fighter.fatigue * 0.0008
      + studyBonus;
    return clamp(value, 0.30, 0.78);
  }

  function coachAccuracy(state) {
    const coach = state.coach;
    const opponent = state.fighters.opponent;
    const adaptability = clamp((opponent.stats.technique - 50) * 0.001, -0.02, 0.04)
      + (/mobile|contre/i.test(opponent.style) ? 0.025 : 0);
    return clamp(
      0.60 + (state.round - 1) * 0.055 + coach.studyBonus + (coach.quality - 0.60) * 0.40 - adaptability,
      0.50,
      0.82,
    );
  }

  function makeJudges(state, count, rng) {
    const centeredBiases = count === 5 ? [-0.8, -0.4, 0, 0.4, 0.8] : [-0.6, 0, 0.6];
    const profiles = centeredBiases.map((bias, index) => ({
      id: `judge-${index + 1}`,
      bias,
      qualityPreference: randomBetween(state, 0.92, 1.08, rng),
      technicalPreference: randomBetween(state, 0.20, 0.32, rng),
      competitivePreference: randomBetween(state, 0.08, 0.16, rng),
      rounds: [],
    }));
    for (let index = profiles.length - 1; index > 0; index -= 1) {
      const other = Math.floor(nextRandom(state, rng) * (index + 1));
      [profiles[index], profiles[other]] = [profiles[other], profiles[index]];
    }
    return profiles;
  }

  function chooseRoundPlan(state, rng) {
    const opponent = state.fighters.opponent;
    const preferred = stylePreference(opponent.style) || pick(state, FAMILIES, rng);
    if (state.round > 1 && state.lastPlayerFamily) {
      const adaptChance = clamp(0.25 + state.opponentDifficulty / 250, 0.25, 0.65);
      if (nextRandom(state, rng) < adaptChance) return COUNTER_PLAN[state.lastPlayerFamily];
    }
    if (opponent.energy < 24 && nextRandom(state, rng) < 0.65) return "defense";
    if (nextRandom(state, rng) < 0.62) return preferred;
    return pick(state, FAMILIES, rng);
  }

  function directiveForPlan(plan) {
    if (plan === "attack") {
      return {
        label: "Pivoter sur son entrée", short: "Angle et contre",
        description: "Sors de sa ligne puis réponds sans rester devant lui.",
        tradeoff: "Demande de la lucidité et du cardio; inutile s'il temporise.",
        tags: ["pivot", "angle", "exit", "counter", "parry"],
      };
    }
    if (plan === "distance") {
      return {
        label: "Neutraliser son jab", short: "Parade et pression",
        description: "Dévie le jab ou double le tien avant de fermer la distance.",
        tradeoff: "Fermer trop vite ouvre les contres et coûte davantage d'énergie.",
        tags: ["parry", "jab", "pressure", "body", "ringcraft"],
      };
    }
    return {
      label: "Faire réagir avant d'attaquer", short: "Feinte et patience",
      description: "Utilise une feinte ou un jab prudent pour déjouer son contre.",
      tradeoff: "Produit moins de pression immédiate s'il refuse toujours l'échange.",
      tags: ["feint", "jab", "cautious", "control"],
    };
  }

  function adaptiveDirective(state) {
    const fighter = state.fighters.player;
    if (state.ring.position !== "center" && state.ring.pressured === "player") {
      return {
        label: "Sortir des câbles", short: "Reprendre le centre",
        description: "Priorise un pivot, une sortie latérale ou une reprise du centre.",
        tradeoff: "Moins de volume offensif pendant les premiers échanges.",
        tags: ["exit", "pivot", "angle", "center"], bonus: 0.55,
      };
    }
    if (fighter.body >= fighter.head + 8) {
      return {
        label: "Fermer les coudes", short: "Protéger le corps",
        description: "Réduis le travail au corps avant de reprendre l'initiative.",
        tradeoff: "La tête devient légèrement plus accessible.",
        tags: ["protect_body", "guard", "clinch"], bonus: 0.55,
      };
    }
    if (fighter.head >= 25 || fighter.lucidity < 70) {
      return {
        label: "Retrouver de la lucidité", short: "Défense compacte",
        description: "Protège la tête et brise les longues séquences.",
        tradeoff: "Tu risques de céder temporairement le rythme.",
        tags: ["protect_head", "guard", "clinch", "cautious"], bonus: 0.55,
      };
    }
    return {
      label: "Changer d'angle", short: "Boxe mobile",
      description: "Termine chaque action par un déplacement ou une reprise du centre.",
      tradeoff: "Coûte un peu plus de cardio qu'une garde statique.",
      tags: ["angle", "exit", "center", "jab"], bonus: 0.50,
    };
  }

  function factualCoachObservation(state) {
    if (state.round === 1) {
      return state.coach.studyBonus > 0
        ? `L'étude confirme une préférence ${stylePreference(state.fighters.opponent.style) || "variable"}.`
        : "Nous n'avons encore aucune séquence réelle à analyser.";
    }
    const previous = state.rounds[state.rounds.length - 1];
    if (!previous) return "Le combat reste difficile à lire.";
    if (previous.playerKnockdowns > previous.opponentKnockdowns) return "Tu l'as envoyé au tapis au round précédent.";
    if (previous.opponentKnockdowns > previous.playerKnockdowns) return "Tu as subi un compte au round précédent.";
    if (previous.positionPressure.player > previous.positionPressure.opponent) return "Tu as passé davantage de temps sous pression près des câbles.";
    if (previous.playerQuality > previous.opponentQuality) return "Tes coups de qualité ont été plus nombreux au round précédent.";
    if (previous.opponentQuality > previous.playerQuality) return "Il a produit davantage de coups de qualité au round précédent.";
    return "Le round précédent était très serré et sans tendance dominante.";
  }

  function buildCoachOptions(state, predictedPlan) {
    const recommended = directiveForPlan(predictedPlan);
    const adaptive = adaptiveDirective(state);
    const options = [{
      id: "recommended",
      kind: "tactical",
      recommended: true,
      label: recommended.label,
      short: recommended.short,
      description: recommended.description,
      tradeoff: recommended.tradeoff,
      tags: recommended.tags,
      targetPlan: predictedPlan,
      bonus: 0.75,
      maxActivations: 2,
    }];
    if (state.round > 1) {
      options.push({
        id: "recover",
        kind: "recovery",
        recommended: false,
        label: "Récupérer et calmer le rythme",
        short: "+4 énergie",
        description: "Le coin privilégie le souffle et la lucidité plutôt qu'un plan précis.",
        tradeoff: "Tu commences le round en cédant une partie de l'initiative.",
        tags: ["cautious", "guard", "clinch"],
        targetPlan: null,
        bonus: 0,
        maxActivations: 0,
        energy: 4,
        lucidity: 6,
      });
    } else {
      options.push({
        id: "observe",
        kind: "patient",
        recommended: false,
        label: "Débuter avec patience",
        short: "Lecture prudente",
        description: "Jab prudent et défense compacte le temps de confirmer son plan.",
        tradeoff: "L'adversaire peut prendre le centre au premier échange.",
        tags: ["cautious", "jab", "guard", "control"],
        targetPlan: null,
        bonus: 0.40,
        maxActivations: 2,
      });
    }
    options.push({
      id: "adaptive",
      kind: "adaptive",
      recommended: false,
      label: adaptive.label,
      short: adaptive.short,
      description: adaptive.description,
      tradeoff: adaptive.tradeoff,
      tags: adaptive.tags,
      targetPlan: null,
      bonus: adaptive.bonus,
      maxActivations: 2,
    });
    return options;
  }

  function prepareRound(state, rng) {
    state.exchange = 0;
    state.fighters.player.roundKnockdowns = 0;
    state.fighters.opponent.roundKnockdowns = 0;
    state.fighters.player.unanswered = 0;
    state.fighters.opponent.unanswered = 0;
    const actualPlan = chooseRoundPlan(state, rng);
    const accuracy = coachAccuracy(state);
    const correct = nextRandom(state, rng) < accuracy;
    const alternatives = FAMILIES.filter(plan => plan !== actualPlan);
    const preferred = stylePreference(state.fighters.opponent.style);
    const predictedPlan = correct
      ? actualPlan
      : (preferred && preferred !== actualPlan ? preferred : pick(state, alternatives, rng));
    const noises = Array.from({ length: state.format.exchangesPerRound }, () => randomBetween(state, -2.4, 2.4, rng));
    const noiseMean = noises.reduce((sum, value) => sum + value, 0) / noises.length;
    state.roundState = {
      actualPlan,
      predictedPlan,
      coachAccuracy: accuracy,
      coachCorrect: correct,
      coachRevealedWrong: false,
      coachWrongAnnounced: false,
      roundLuck: randomBetween(state, -6, 6, rng),
      localNoise: noises.map(value => value - noiseMean),
      edgeSum: 0,
      exchangesResolved: 0,
      playerQuality: 0,
      opponentQuality: 0,
      playerSignificant: 0,
      opponentSignificant: 0,
      playerTechnical: 0,
      opponentTechnical: 0,
      playerCompetitive: 0,
      opponentCompetitive: 0,
      playerKnockdowns: 0,
      opponentKnockdowns: 0,
      positionPressure: { player: 0, opponent: 0 },
    };
    state.coach.pending = {
      type: state.round === 1 ? "briefing" : "corner",
      observation: factualCoachObservation(state),
      prediction: directiveForPlan(predictedPlan).short,
      confidence: accuracy >= 0.73 ? "élevée" : accuracy >= 0.62 ? "moyenne" : "prudente",
      options: buildCoachOptions(state, predictedPlan),
    };
    state.coach.activeDirective = null;
    state.phase = "corner";
    state.currentExchange = null;
  }

  function createFight(config, rng) {
    const source = config || {};
    const seed = source.seed == null ? `${Date.now()}-${Math.random()}` : source.seed;
    const kind = source.kind === "tournament" || source.tournamentId ? "tournament" : "local";
    const exchangesPerRound = Math.round(clamp(source.exchangesPerRound == null ? DEFAULT_EXCHANGES : source.exchangesPerRound, 4, 6));
    const state = {
      engineVersion: VERSION,
      id: source.id || `fight-${hashSeed(seed).toString(16)}`,
      seed: String(seed),
      rngState: hashSeed(seed),
      randomCounter: 0,
      format: {
        amateur: true,
        kind,
        rounds: ROUND_COUNT,
        exchangesPerRound,
        judgeCount: kind === "tournament" ? 5 : 3,
      },
      phase: "setup",
      round: 1,
      exchange: 0,
      opponentDifficulty: clamp(source.opponentDifficulty == null ? 40 : source.opponentDifficulty, 0, 100),
      fighters: {
        player: normalizeFighter(source.player, "player"),
        opponent: normalizeFighter(source.opponent, "opponent"),
      },
      ring: {
        distance: DISTANCES.includes(source.distance) ? source.distance : "outside",
        position: POSITIONS.includes(source.position) ? source.position : "center",
        pressured: null,
        momentum: 0,
      },
      coach: {
        quality: clamp(source.coachQuality == null ? 0.60 : source.coachQuality, 0, 1),
        studyBonus: source.studiedOpponent ? 0.10 : clamp(source.studyBonus == null ? 0 : source.studyBonus, 0, 0.15),
        studyExchangeLimit: source.studyExchangeLimit != null && Number.isFinite(Number(source.studyExchangeLimit)) ? Math.round(clamp(Number(source.studyExchangeLimit), 1, 18)) : null,
        pending: null,
        activeDirective: null,
        history: [],
      },
      temporaryEffects: Array.isArray(source.playerEffects) ? source.playerEffects
        .filter(effect => effect && effect.type === "protection" && ["head", "body"].includes(effect.zone))
        .map(effect => ({
          type: "protection",
          zone: effect.zone,
          impactReduction: clamp(effect.impactReduction == null ? 0.15 : effect.impactReduction, 0, 0.45),
          exchangesRemaining: Math.round(clamp(effect.exchangesRemaining == null ? 2 : effect.exchangesRemaining, 0, 6)),
        }))
        : [],
      judges: [],
      refereeTolerance: 0,
      lastPlayerFamily: null,
      rounds: [],
      history: [],
      currentExchange: null,
      roundState: null,
      status: { winner: null, loser: null, method: null, finished: false },
      result: null,
      lastResult: null,
    };
    if (state.fighters.player.energy == null) state.fighters.player.energy = 72;
    if (state.fighters.opponent.energy == null) {
      const cardio = state.fighters.opponent.stats.cardio;
      state.fighters.opponent.energy = clamp(Math.round(84 + (cardio - 40) * 0.18 + nextRandom(state, rng) * 5), 78, 97);
    }
    state.refereeTolerance = randomBetween(state, -4, 4, rng);
    state.judges = makeJudges(state, state.format.judgeCount, rng);
    prepareRound(state, rng);
    return state;
  }

  function coachOptions(state) {
    if (!state || state.phase !== "corner" || !state.coach.pending) return [];
    return clone(state.coach.pending.options);
  }

  function chooseCoachDirective(state, optionId, rng) {
    if (!state || state.phase !== "corner") throw new Error("Aucune intervention du coin n'est disponible.");
    const next = clone(state);
    const option = next.coach.pending.options.find(item => item.id === optionId);
    if (!option) throw new Error(`Directive inconnue : ${optionId}`);
    const player = next.fighters.player;
    if (option.kind === "recovery") {
      player.energy = clamp(player.energy + option.energy);
      player.lucidity = clamp(player.lucidity + option.lucidity);
      next.ring.momentum = clamp(next.ring.momentum - 1, -2, 2);
    } else if (option.kind === "patient") {
      player.lucidity = clamp(player.lucidity + 2);
      next.ring.momentum = clamp(next.ring.momentum - 0.5, -2, 2);
    }
    next.coach.activeDirective = {
      id: option.id,
      kind: option.kind,
      label: option.label,
      tags: option.tags,
      targetPlan: option.targetPlan,
      bonus: option.bonus,
      activations: 0,
      maxActivations: option.maxActivations,
    };
    next.coach.history.push({
      round: next.round,
      optionId: option.id,
      prediction: next.roundState.predictedPlan,
      observation: next.coach.pending.observation,
    });
    const result = {
      type: next.round === 1 ? "briefing" : "corner",
      round: next.round,
      optionId: option.id,
      text: option.kind === "recovery"
        ? "Le coin privilégie la récupération. Tu reprends du souffle, mais tu cèdes l'initiative."
        : `Directive du coin : ${option.label}.`,
      visualCue: "coach",
    };
    next.coach.pending = null;
    prepareExchangePrompt(next, rng);
    next.lastResult = result;
    next.history.push(result);
    return { state: next, result };
  }

  function intentWeight(intent, state) {
    const opponent = state.fighters.opponent;
    let weight = intent.family === state.roundState.actualPlan ? 4.2 : 0.9;
    if (stylePreference(opponent.style) === intent.family) weight += 1.1;
    if (opponent.energy < 28 && intent.id === "compact_cover") weight += 5;
    if (state.fighters.player.lucidity < 48 && intent.id === "finish_pressure") weight += 4;
    if (state.fighters.player.head > 55 && intent.id === "finish_pressure") weight += 3;
    if (state.ring.distance === intent.desiredDistance) weight += 1.2;
    if (state.ring.position !== "center" && state.ring.pressured === "player" && intent.family === "attack") weight += 1.4;
    if (state.ring.pressured === "opponent" && intent.id === "circle_away") weight += 1.8;
    return Math.max(0.1, weight);
  }

  function chooseActualIntention(state, rng) {
    const entries = Object.values(INTENTIONS).map(intent => ({ value: intent.id, weight: intentWeight(intent, state) }));
    return weightedPick(state, entries, rng);
  }

  function chooseShownIntention(state, actualId, accuracy, rng) {
    const actual = INTENTIONS[actualId];
    const roll = nextRandom(state, rng);
    if (roll < accuracy) return { id: actualId, type: "exact" };
    const sameFamily = Object.values(INTENTIONS).filter(intent => intent.family === actual.family && intent.id !== actualId);
    if (roll < accuracy + 0.14 && sameFamily.length) return { id: pick(state, sameFamily, rng).id, type: "partial" };
    const alternatives = Object.values(INTENTIONS).filter(intent => intent.family !== actual.family);
    return { id: pick(state, alternatives, rng).id, type: "uncertain" };
  }

  function prepareExchangePrompt(state, rng) {
    const actualId = chooseActualIntention(state, rng);
    const accuracy = readingAccuracy(state);
    const shown = chooseShownIntention(state, actualId, accuracy, rng);
    const shownIntent = INTENTIONS[shown.id];
    state.currentExchange = {
      number: state.exchange + 1,
      actualIntentionId: actualId,
      shownIntentionId: shown.id,
      readingType: shown.type,
      readingAccuracy: accuracy,
      intention: shownIntent.description,
      situation: describeRing(state),
    };
    state.phase = "exchange";
  }

  function describeRing(state) {
    const distanceLabels = { outside: "à l'extérieur", mid: "à mi-distance", inside: "au corps à corps" };
    const positionLabels = { center: "au centre", near_ropes: "près des câbles", ropes: "dans les câbles", corner: "dans un coin" };
    const subject = state.ring.pressured === "player" ? "Tu es" : state.ring.pressured === "opponent" ? "L'adversaire est" : "Vous êtes";
    return `${subject} ${positionLabels[state.ring.position]}, ${distanceLabels[state.ring.distance]}.`;
  }

  function actionIsAvailable(action, state) {
    if (!action.distances.includes(state.ring.distance)) return false;
    if (action.id === "clinch" && state.ring.distance !== "inside" && state.ring.position === "center") return false;
    if (action.id === "pivot_exit" && state.ring.position === "center" && state.ring.distance === "outside") return false;
    if (action.id === "retake_center" && state.ring.position === "center") return false;
    if (action.id === "finish_pressure") {
      const opponent = state.fighters.opponent;
      if (opponent.lucidity >= 55 && opponent.head < 45 && opponent.energy > 28) return false;
    }
    return true;
  }

  function tagsOverlap(first, second) {
    return first.some(tag => second.includes(tag));
  }

  function actionDisplayScore(action, state) {
    const shown = state.currentExchange && state.currentExchange.shownIntentionId;
    let score = (action.responses && action.responses[shown]) || 0;
    const player = state.fighters.player;
    const opponent = state.fighters.opponent;
    if (state.ring.position !== "center" && state.ring.pressured === "player" && tagsOverlap(action.tags, ["exit", "pivot", "center", "clinch"])) score += 1.8;
    if (player.energy < 25 && action.family === "defense") score += 1.2;
    if (player.energy < 25 && action.aggression > 0.75) score -= 1.4;
    if (player.body > 35 && action.tags.includes("protect_body")) score += 1.4;
    if ((opponent.head > 45 || opponent.lucidity < 55) && action.tags.includes("finish")) score += 1.8;
    if (state.coach.activeDirective && tagsOverlap(action.tags, state.coach.activeDirective.tags)) score += 0.35;
    return score;
  }

  function availableActions(state) {
    if (!state || state.phase !== "exchange" || !state.currentExchange) return [];
    const eligible = Object.values(ACTIONS)
      .filter(action => actionIsAvailable(action, state))
      .map(action => ({ action, score: actionDisplayScore(action, state) }))
      .sort((a, b) => b.score - a.score || a.action.id.localeCompare(b.action.id));
    const selected = eligible.slice(0, 4);
    if (!selected.some(item => item.action.family === "defense")) {
      const defensive = eligible.find(item => item.action.family === "defense" && !selected.includes(item));
      if (defensive) selected[selected.length - 1] = defensive;
    }
    if (!selected.some(item => item.action.family === "attack")) {
      const offensive = eligible.find(item => item.action.family === "attack" && !selected.includes(item));
      if (offensive) selected[selected.length - 1] = offensive;
    }
    return selected.slice(0, 4).map(({ action }) => ({
      id: action.id,
      label: action.label,
      description: action.description,
      family: action.family,
      risk: action.risk,
      baseEnergyCost: action.cost,
      directiveAligned: Boolean(state.coach.activeDirective && tagsOverlap(action.tags, state.coach.activeDirective.tags)),
    }));
  }

  function repetitionPenalty(fighter, action) {
    const sameAction = fighter.lastActions.filter(id => id === action.id).length;
    if (sameAction >= 2) return -2.5;
    if (sameAction === 1) return -1.25;
    const previous = fighter.lastActions[fighter.lastActions.length - 1];
    return previous && ACTIONS[previous] && ACTIONS[previous].family === action.family ? -0.25 : 0;
  }

  function contextFit(state, action, intent) {
    let fit = (action.responses && action.responses[intent.id]) || 0;
    const player = state.fighters.player;
    const opponent = state.fighters.opponent;
    if (state.ring.position !== "center" && state.ring.pressured === "player") {
      if (tagsOverlap(action.tags, ["exit", "pivot", "center", "clinch"])) fit += 1.1;
      if (action.aggression > 0.85 && !action.tags.includes("counter")) fit -= 0.8;
    }
    if (state.ring.distance === "outside" && action.id === "power_hook") fit -= 1.4;
    if (player.energy < 25) {
      if (action.family === "defense" || action.tags.includes("cautious")) fit += 0.6;
      if (action.aggression > 0.75) fit -= 1.4;
    }
    if (player.lucidity < 50 && tagsOverlap(action.tags, ["guard", "clinch", "exit"])) fit += 0.7;
    if ((opponent.lucidity < 55 || opponent.head > 45) && action.tags.includes("finish")) fit += 1.2;
    if (action.id === "clinch" && player.unanswered === 0) fit -= 0.5;
    return clamp(fit, -4.5, 4.5);
  }

  function directiveBonus(state, action) {
    const directive = state.coach.activeDirective;
    if (!directive || directive.activations >= directive.maxActivations || !tagsOverlap(action.tags, directive.tags)) return 0;
    if (directive.targetPlan && directive.targetPlan !== state.roundState.actualPlan) {
      state.roundState.coachRevealedWrong = true;
      return 0;
    }
    directive.activations += 1;
    return directive.bonus;
  }

  function actionAggressionFamily(action) {
    return action.aggression >= 0.72 ? "attack" : action.family;
  }

  function calculateExchangeEdge(state, action, intent) {
    const player = state.fighters.player;
    const opponent = state.fighters.opponent;
    const playerFamily = action.family;
    const opponentFamily = intent.family;
    const fit = contextFit(state, action, intent);
    const directive = directiveBonus(state, action);
    const repeat = repetitionPenalty(player, action);
    const lateCardio = (state.round - 1) * (player.stats.cardio - opponent.stats.cardio) * 0.065;
    const tacticalTechnique = (player.stats.technique - opponent.stats.technique) * 0.03;
    const playerPowerFactor = actionAggressionFamily(action) === "attack" ? 0.08 : 0.035;
    const opponentPowerFactor = opponentFamily === "attack" ? 0.08 : 0.035;
    const playerPowerEdge = (player.stats.power - opponent.stats.defense) * playerPowerFactor;
    const opponentPowerEdge = (opponent.stats.power - player.stats.defense) * opponentPowerFactor;
    const opponentPlanFit = (intent.family === state.roundState.actualPlan ? 1.7 : -0.10)
      + (state.ring.distance === intent.desiredDistance ? 0.45 : 0);
    const stateExecution = executionPenalty(opponent) - executionPenalty(player);
    const momentum = state.ring.momentum * 0.35;
    const localNoise = state.roundState.localNoise[state.exchange] || 0;
    const playerBase = strategySkill(player.stats, playerFamily) + conditionScore(player) + fit + repeat
      + directive + lateCardio + tacticalTechnique + playerPowerEdge + stateExecution + momentum;
    const opponentBase = strategySkill(opponent.stats, opponentFamily) + conditionScore(opponent)
      + opponentPowerEdge + opponentPlanFit;
    return {
      edge: playerBase - opponentBase + state.roundState.roundLuck + localNoise,
      fit,
      directive,
      repeat,
      playerFamily,
      opponentFamily,
    };
  }

  function energyCost(state, fighter, family, baseCost, opponent, opposingFamily, rng) {
    const cardioRelief = clamp((fighter.stats.cardio - 40) * 0.08, -2, 5);
    const intensity = FAMILY_INTENSITY[opposingFamily] || FAMILY_INTENSITY.distance;
    const incomingPressure = clamp(opponent.stats.power * intensity + opponent.stats.technique * 0.025 - fighter.stats.defense * 0.075, 0, 7);
    const dividedRelief = cardioRelief / state.format.exchangesPerRound;
    const dividedPressure = incomingPressure / state.format.exchangesPerRound;
    const jitter = nextRandom(state, rng) * 2 / state.format.exchangesPerRound;
    const bodyTax = fighter.body / 250;
    const cost = Math.max(0.7, baseCost - dividedRelief + dividedPressure + jitter + bodyTax);
    return { cost: roundTo(cost), incomingPressure: dividedPressure };
  }

  function impactFor(state, attacker, defender, baseImpact, context, factor, rng) {
    const raw = baseImpact
      + (attacker.stats.power - 40) * 0.10
      + (attacker.stats.technique - 40) * 0.04
      - (defender.stats.defense - 40) * 0.07
      + context * 0.45
      + randomBetween(state, -2, 2, rng);
    return roundTo(clamp(raw * factor, 0, 18));
  }

  function applyImpact(defender, target, impact, protectionTags, externalReduction = 0) {
    // The tactical impact roll is deliberately compressed before it reaches the
    // persistent 0-100 damage tracks. Five exchanges must not behave like five
    // complete legacy rounds or make late-tournament stoppages inevitable.
    let adjusted = impact * 0.72;
    if (target === "head" && protectionTags.includes("protect_head")) adjusted *= 0.62;
    if (target === "body" && protectionTags.includes("protect_body")) adjusted *= 0.58;
    if (protectionTags.includes("guard")) adjusted *= 0.84;
    adjusted *= 1 - clamp(externalReduction, 0, 0.45);
    adjusted = roundTo(adjusted);
    if (target === "body") {
      defender.body = clamp(roundTo(defender.body + adjusted));
      defender.energy = clamp(roundTo(defender.energy - adjusted * 0.45));
      defender.lucidity = clamp(roundTo(defender.lucidity - adjusted * 0.12));
    } else {
      defender.head = clamp(roundTo(defender.head + adjusted));
      defender.lucidity = clamp(roundTo(defender.lucidity - adjusted * 0.72));
    }
    return adjusted;
  }

  function tournamentProtectionReduction(state, target) {
    const effect = (state.temporaryEffects || []).find(item => item.type === "protection" && item.zone === target && item.exchangesRemaining > 0);
    return effect?.impactReduction || 0;
  }

  function consumeTemporaryEffects(state) {
    state.temporaryEffects = (state.temporaryEffects || [])
      .map(effect => ({ ...effect, exchangesRemaining: Math.max(0, effect.exchangesRemaining - 1) }))
      .filter(effect => effect.exchangesRemaining > 0);
  }

  function knockdownChance(attacker, defender, target, impact) {
    if (impact < 5.5) return 0;
    const powerDefense = attacker.stats.power - defender.stats.defense;
    const vulnerability = target === "body"
      ? 0.50 * defender.body + 0.30 * (100 - defender.energy) + 2.5 * impact + 0.08 * powerDefense
      : 0.45 * defender.head + 0.20 * (100 - defender.energy) + 0.25 * (100 - defender.lucidity) + 3 * impact + 0.10 * powerDefense;
    return vulnerability <= 35 ? 0 : clamp((vulnerability - 35) * 0.004, 0, 0.22);
  }

  function recoveryScore(state, defender, rng) {
    return 0.35 * defender.lucidity
      + 0.20 * defender.energy
      + 0.18 * defender.stats.cardio
      + 0.12 * defender.morale
      + 0.15 * defender.stats.defense
      - 8 * Math.max(0, defender.knockdowns - 1)
      + randomBetween(state, -12, 12, rng);
  }

  function tryKnockdown(state, attackerKey, defenderKey, target, impact, rng) {
    const attacker = state.fighters[attackerKey];
    const defender = state.fighters[defenderKey];
    const probability = knockdownChance(attacker, defender, target, impact);
    if (probability <= 0 || nextRandom(state, rng) >= probability) return null;
    defender.knockdowns += 1;
    defender.roundKnockdowns += 1;
    defender.energy = clamp(roundTo(defender.energy - 5));
    defender.lucidity = clamp(roundTo(defender.lucidity - 8));
    const score = recoveryScore(state, defender, rng);
    const knockedDown = defenderKey;
    if (score < 22) {
      return {
        knockedDown,
        count: 10,
        recovered: false,
        probability,
        recoveryScore: score,
        method: "KO",
      };
    }
    return {
      knockedDown,
      count: 8,
      recovered: true,
      probability,
      recoveryScore: score,
      method: null,
    };
  }

  function tkoDanger(fighter) {
    return 0.30 * fighter.head
      + 0.20 * fighter.body
      + 0.18 * (100 - fighter.energy)
      + 0.20 * (100 - fighter.lucidity)
      + 8 * fighter.knockdowns
      + 6 * fighter.unanswered;
  }

  function tkoGate(state, fighterKey) {
    const fighter = state.fighters[fighterKey];
    const trapped = state.ring.pressured === fighterKey && ["ropes", "corner"].includes(state.ring.position);
    return fighter.unanswered >= 3
      || fighter.head >= 70
      || fighter.body >= 75
      || fighter.energy <= 10
      || fighter.roundKnockdowns >= 2
      || (trapped && fighter.lucidity < 35 && fighter.unanswered >= 2);
  }

  function shouldStopTko(state, fighterKey) {
    const fighter = state.fighters[fighterKey];
    if (fighter.roundKnockdowns >= 3 || fighter.knockdowns >= 4) return true;
    return tkoGate(state, fighterKey) && tkoDanger(fighter) + state.refereeTolerance >= 94;
  }

  function moveTowardRopes(state, pressuredKey, steps) {
    const current = POSITIONS.indexOf(state.ring.position);
    state.ring.position = POSITIONS[clamp(current + steps, 0, POSITIONS.length - 1)];
    state.ring.pressured = state.ring.position === "center" ? null : pressuredKey;
  }

  function moveTowardCenter(state, actorKey, steps) {
    if (state.ring.pressured && state.ring.pressured !== actorKey) return;
    const current = POSITIONS.indexOf(state.ring.position);
    state.ring.position = POSITIONS[clamp(current - steps, 0, POSITIONS.length - 1)];
    if (state.ring.position === "center") state.ring.pressured = null;
  }

  function updateRing(state, action, intent, edge) {
    const playerWon = edge > 1.5;
    const opponentWon = edge < -1.5;
    if (playerWon && tagsOverlap(action.tags, ["pressure", "ringcraft", "center", "finish"])) moveTowardRopes(state, "opponent", edge > 7 ? 2 : 1);
    if (opponentWon && intent.pressure > 0) moveTowardRopes(state, "player", edge < -7 ? 2 : 1);
    if (tagsOverlap(action.tags, ["exit", "pivot", "center"]) && edge > -4) moveTowardCenter(state, "player", action.id === "pivot_exit" ? 2 : 1);
    if (action.tags.includes("retreat") && state.ring.position !== "center") moveTowardRopes(state, "player", 1);
    if (action.id === "clinch") {
      state.ring.distance = "inside";
      state.ring.momentum += state.ring.momentum > 0 ? -1 : state.ring.momentum < 0 ? 1 : 0;
    } else if (action.id === "retreat_step" || action.id === "double_jab_move" || action.id === "cautious_jab") {
      state.ring.distance = "outside";
    } else if (action.id === "body_attack" || action.id === "roll_under") {
      state.ring.distance = "inside";
    } else if (action.aggression > 0.65 || intent.aggression > 0.65) {
      state.ring.distance = "mid";
    } else {
      state.ring.distance = intent.desiredDistance;
    }
    const momentumDelta = edge >= 7 ? 2 : edge >= 1.5 ? 1 : edge <= -7 ? -2 : edge <= -1.5 ? -1 : 0;
    state.ring.momentum = clamp(state.ring.momentum + momentumDelta, -2, 2);
    if (state.ring.position !== "center" && state.ring.pressured) state.roundState.positionPressure[state.ring.pressured] += 1;
  }

  function exchangeText(side, quality, action, intent) {
    if (side === "neutral") return "Les deux boxeurs se neutralisent sans coup vraiment net.";
    if (side === "trade") return "Les deux boxeurs touchent dans un échange risqué.";
    const dominant = quality >= 3 ? "une séquence dominante" : quality >= 1.7 ? "un coup net" : "le meilleur coup";
    return side === "player"
      ? `Tu places ${dominant} avec ${action.label.toLocaleLowerCase("fr-CA")}.`
      : `L'adversaire place ${dominant} pendant ${intent.label.toLocaleLowerCase("fr-CA")}.`;
  }

  function visualCueFor(side, significant) {
    if (side === "player") return significant ? "opponent-hit-hard" : "opponent-hit";
    if (side === "opponent") return significant ? "player-hit-hard" : "player-hit";
    if (side === "trade") return "trade";
    return "neutral";
  }

  function recordEvidence(state, edge, fit, side, quality, significant) {
    const round = state.roundState;
    round.edgeSum += edge;
    round.exchangesResolved += 1;
    if (side === "player" || side === "trade") {
      round.playerQuality += side === "trade" ? quality * 0.55 : quality;
      if (significant) round.playerSignificant += 1;
    }
    if (side === "opponent" || side === "trade") {
      round.opponentQuality += side === "trade" ? quality * 0.55 : quality;
      if (significant) round.opponentSignificant += 1;
    }
    round.playerTechnical += clamp(fit, -2, 3) + (edge > 0 ? 0.35 : 0);
    round.opponentTechnical += clamp(-fit, -2, 3) + (edge < 0 ? 0.35 : 0);
    round.playerCompetitive += edge >= -2 ? 0.5 : 0;
    round.opponentCompetitive += edge <= 2 ? 0.5 : 0;
  }

  function naturalRecovery(fighter) {
    return clamp(Math.round((fighter.stats.cardio - 30) * 0.075), 1, 6);
  }

  function scoreForJudge(state, judge) {
    const round = state.roundState;
    const baseEdge = round.edgeSum / Math.max(1, round.exchangesResolved);
    const qualityDiff = round.playerQuality - round.opponentQuality;
    const technicalDiff = round.playerTechnical - round.opponentTechnical;
    const competitiveDiff = round.playerCompetitive - round.opponentCompetitive;
    const closeFactor = Math.max(0, 1 - Math.abs(baseEdge) / 8.5);
    let interpreted = baseEdge
      + qualityDiff * 0.12 * judge.qualityPreference
      + technicalDiff * 0.05 * judge.technicalPreference
      + competitiveDiff * 0.04 * judge.competitivePreference
      + judge.bias * closeFactor;
    if (Math.abs(interpreted) < 0.0001) interpreted = qualityDiff || technicalDiff || competitiveDiff || judge.bias || 0.0001;
    const playerWon = interpreted > 0;
    const evidence = playerWon ? qualityDiff : -qualityDiff;
    const significantDiff = playerWon
      ? round.playerSignificant - round.opponentSignificant
      : round.opponentSignificant - round.playerSignificant;
    const knockdownDiff = playerWon
      ? round.playerKnockdowns - round.opponentKnockdowns
      : round.opponentKnockdowns - round.playerKnockdowns;
    const dominance = Math.abs(interpreted);
    const totalDominance = dominance >= 13 && (evidence >= 4.5 || significantDiff >= 4 || knockdownDiff >= 2);
    const clearDominance = dominance >= 8.5 && (dominance >= 10 || evidence >= 1 || significantDiff >= 2 || knockdownDiff >= 1);
    const losingScore = totalDominance ? 7 : clearDominance ? 8 : 9;
    return {
      player: playerWon ? 10 : losingScore,
      opponent: playerWon ? losingScore : 10,
      edge: interpreted,
    };
  }

  function summarizeRound(state) {
    const round = state.roundState;
    const cards = state.judges.map(judge => {
      const score = scoreForJudge(state, judge);
      judge.rounds.push({ round: state.round, player: score.player, opponent: score.opponent });
      return { judgeId: judge.id, player: score.player, opponent: score.opponent, edge: score.edge };
    });
    const playerVotes = cards.filter(card => card.player > card.opponent).length;
    const opponentVotes = cards.length - playerVotes;
    const summary = {
      number: state.round,
      cards,
      playerVotes,
      opponentVotes,
      winner: playerVotes > opponentVotes ? "player" : "opponent",
      playerQuality: roundTo(round.playerQuality),
      opponentQuality: roundTo(round.opponentQuality),
      playerSignificant: round.playerSignificant,
      opponentSignificant: round.opponentSignificant,
      playerKnockdowns: round.playerKnockdowns,
      opponentKnockdowns: round.opponentKnockdowns,
      positionPressure: clone(round.positionPressure),
      edge: roundTo(round.edgeSum / Math.max(1, round.exchangesResolved), 2),
      coachPredictionCorrect: round.coachCorrect,
    };
    state.rounds.push(summary);
    return summary;
  }

  function decideCardWinner(state, judge) {
    const playerTotal = judge.rounds.reduce((sum, round) => sum + round.player, 0);
    const opponentTotal = judge.rounds.reduce((sum, round) => sum + round.opponent, 0);
    if (playerTotal !== opponentTotal) return { playerTotal, opponentTotal, winner: playerTotal > opponentTotal ? "player" : "opponent", tieBreak: false };
    const quality = state.rounds.reduce((sum, round) => sum + round.playerQuality - round.opponentQuality, 0);
    const technical = state.rounds.reduce((sum, round) => sum + round.edge, 0);
    const competitive = state.rounds.reduce((sum, round) => sum + round.playerSignificant - round.opponentSignificant, 0);
    const tieEdge = quality * judge.qualityPreference + technical * judge.technicalPreference
      + competitive * judge.competitivePreference + judge.bias;
    return { playerTotal, opponentTotal, winner: tieEdge >= 0 ? "player" : "opponent", tieBreak: true };
  }

  function finishByDecision(state) {
    const cards = state.judges.map(judge => ({ judgeId: judge.id, ...decideCardWinner(state, judge) }));
    let playerVotes = cards.filter(card => card.winner === "player").length;
    let opponentVotes = cards.length - playerVotes;
    if (playerVotes === opponentVotes) {
      const evidence = state.rounds.reduce((sum, round) => sum + round.edge, 0);
      if (evidence >= 0) playerVotes += 1;
      else opponentVotes += 1;
    }
    const winner = playerVotes > opponentVotes ? "player" : "opponent";
    const loser = winner === "player" ? "opponent" : "player";
    state.phase = "finished";
    state.status = { winner, loser, method: "decision", finished: true };
    state.result = {
      winner,
      loser,
      method: "decision",
      label: winner === "player" ? "Victoire aux points" : "Défaite aux points",
      decision: `${playerVotes}–${opponentVotes}`,
      playerVotes,
      opponentVotes,
      judgeCards: cards,
      rounds: clone(state.rounds),
      exposure: {
        player: roundTo(state.fighters.player.legacyExposure),
        opponent: roundTo(state.fighters.opponent.legacyExposure),
      },
      visualCue: winner === "player" ? "player-win" : "opponent-win",
    };
    return state.result;
  }

  function finishByStoppage(state, winner, method, details) {
    const loser = winner === "player" ? "opponent" : "player";
    state.phase = "finished";
    state.status = { winner, loser, method, finished: true };
    state.result = {
      winner,
      loser,
      method,
      label: method === "KO" ? "KO" : "TKO — arrêt de l'arbitre",
      round: state.round,
      exchange: state.exchange + 1,
      count: details && details.count,
      judgeCards: null,
      rounds: clone(state.rounds),
      exposure: {
        player: roundTo(state.fighters.player.legacyExposure),
        opponent: roundTo(state.fighters.opponent.legacyExposure),
      },
      visualCue: method === "KO" ? "knockout" : "referee-stoppage",
    };
    return state.result;
  }

  function finishRound(state, result, rng) {
    const roundSummary = summarizeRound(state);
    result.roundSummary = clone(roundSummary);
    result.events.push({
      type: "round-end",
      round: state.round,
      text: `Round ${state.round} terminé.`,
      visualCue: "round-end",
    });
    if (state.round >= ROUND_COUNT) {
      result.fightResult = finishByDecision(state);
      result.events.push({ type: "decision", text: result.fightResult.label, visualCue: result.fightResult.visualCue });
      result.visualCue = result.fightResult.visualCue;
      return;
    }
    const playerRecovery = naturalRecovery(state.fighters.player);
    const opponentRecovery = naturalRecovery(state.fighters.opponent);
    state.fighters.player.energy = clamp(roundTo(state.fighters.player.energy + playerRecovery));
    state.fighters.opponent.energy = clamp(roundTo(state.fighters.opponent.energy + opponentRecovery));
    state.fighters.player.lucidity = clamp(roundTo(state.fighters.player.lucidity + 4));
    state.fighters.opponent.lucidity = clamp(roundTo(state.fighters.opponent.lucidity + 4));
    result.recovery = { player: playerRecovery, opponent: opponentRecovery };
    state.round += 1;
    prepareRound(state, rng);
  }

  function resolveExchange(state, actionId, rng) {
    if (!state || state.phase !== "exchange" || !state.currentExchange) throw new Error("Aucun échange n'attend une décision.");
    const offered = availableActions(state);
    if (!offered.some(action => action.id === actionId)) throw new Error(`Action indisponible dans cette situation : ${actionId}`);
    const next = clone(state);
    const action = ACTIONS[actionId];
    const intent = INTENTIONS[next.currentExchange.actualIntentionId];
    const calculation = calculateExchangeEdge(next, action, intent);
    const edge = calculation.edge;
    const absoluteEdge = Math.abs(edge);
    let side = edge >= 1.5 ? "player" : edge <= -1.5 ? "opponent" : "neutral";
    if (side === "neutral" && action.aggression > 0.65 && intent.aggression > 0.65 && absoluteEdge < 1) side = "trade";
    const quality = roundTo(clamp((absoluteEdge - 0.5) / 2.4, 0.4, 4));
    const impactFactor = absoluteEdge >= 8.5 ? 1.18 : absoluteEdge >= 5 ? 1 : 0.72;
    let playerImpact = 0;
    let opponentImpact = 0;
    if (side === "player" || side === "trade") {
      const factor = side === "trade" ? 0.60 : impactFactor;
      playerImpact = impactFor(next, next.fighters.player, next.fighters.opponent, action.impact, calculation.fit, factor, rng);
      playerImpact = applyImpact(next.fighters.opponent, action.target, playerImpact, []);
    }
    if (side === "opponent" || side === "trade") {
      const factor = side === "trade" ? 0.60 : impactFactor;
      opponentImpact = impactFor(next, next.fighters.opponent, next.fighters.player, intent.impact, -calculation.fit, factor, rng);
      opponentImpact = applyImpact(next.fighters.player, intent.target, opponentImpact, action.tags, tournamentProtectionReduction(next, intent.target));
    }
    const playerEnergy = energyCost(next, next.fighters.player, action.family, action.cost, next.fighters.opponent, intent.family, rng);
    const opponentBaseCost = FAMILY_ROUND_COST[intent.family] / next.format.exchangesPerRound;
    const opponentEnergy = energyCost(next, next.fighters.opponent, intent.family, opponentBaseCost, next.fighters.player, action.family, rng);
    next.fighters.player.energy = clamp(roundTo(next.fighters.player.energy - playerEnergy.cost));
    next.fighters.opponent.energy = clamp(roundTo(next.fighters.opponent.energy - opponentEnergy.cost));
    const lossShare = 1.5 / next.format.exchangesPerRound;
    next.fighters.player.legacyExposure = roundTo(
      next.fighters.player.legacyExposure
        + playerEnergy.incomingPressure
        + (side === "opponent" ? lossShare : side === "trade" ? lossShare * 0.5 : 0)
        + (edge <= -8.5 ? lossShare : 0),
      3,
    );
    next.fighters.opponent.legacyExposure = roundTo(
      next.fighters.opponent.legacyExposure
        + opponentEnergy.incomingPressure
        + (side === "player" ? lossShare : side === "trade" ? lossShare * 0.5 : 0)
        + (edge >= 8.5 ? lossShare : 0),
      3,
    );
    if (side === "player") {
      next.fighters.opponent.unanswered += playerImpact >= 5.5 ? 1 : 0;
      next.fighters.player.unanswered = 0;
    } else if (side === "opponent") {
      next.fighters.player.unanswered += opponentImpact >= 5.5 ? 1 : 0;
      next.fighters.opponent.unanswered = 0;
    } else if (side === "neutral") {
      next.fighters.player.unanswered = Math.max(0, next.fighters.player.unanswered - 1);
      next.fighters.opponent.unanswered = Math.max(0, next.fighters.opponent.unanswered - 1);
      next.fighters.player.lucidity = clamp(roundTo(next.fighters.player.lucidity + 0.3));
      next.fighters.opponent.lucidity = clamp(roundTo(next.fighters.opponent.lucidity + 0.3));
    } else {
      next.fighters.player.unanswered = 0;
      next.fighters.opponent.unanswered = 0;
    }
    const significant = Math.max(playerImpact, opponentImpact) >= 7 || absoluteEdge >= 6;
    recordEvidence(next, edge, calculation.fit, side, quality, significant);
    updateRing(next, action, intent, edge);
    next.fighters.player.lastActions.push(action.id);
    next.fighters.player.lastActions = next.fighters.player.lastActions.slice(-3);
    next.lastPlayerFamily = action.family;
    consumeTemporaryEffects(next);

    const result = {
      type: "exchange",
      round: next.round,
      exchange: next.exchange + 1,
      actionId,
      shownIntentionId: next.currentExchange.shownIntentionId,
      readingType: next.currentExchange.readingType,
      side,
      edge: roundTo(edge, 2),
      contextFit: calculation.fit,
      directiveBonus: calculation.directive,
      playerImpact,
      opponentImpact,
      significant,
      text: exchangeText(side, quality, action, intent),
      visualCue: visualCueFor(side, significant),
      events: [],
    };
    if (next.roundState.coachRevealedWrong && !next.roundState.coachWrongAnnounced) {
      next.roundState.coachWrongAnnounced = true;
      result.coachSignal = "wrong";
      result.events.push({
        type: "coach-correction",
        text: "La lecture du coin ne se confirme pas : adapte-toi au prochain échange.",
        visualCue: "coach-warning",
      });
    } else if (calculation.directive > 0) {
      result.coachSignal = "followed";
    }

    let knockdown = null;
    if (side === "player" || side === "trade") knockdown = tryKnockdown(next, "player", "opponent", action.target, playerImpact, rng);
    if (!knockdown && (side === "opponent" || side === "trade")) knockdown = tryKnockdown(next, "opponent", "player", intent.target, opponentImpact, rng);
    if (knockdown) {
      const attackerKey = knockdown.knockedDown === "player" ? "opponent" : "player";
      next.roundState[`${attackerKey}Knockdowns`] += 1;
      result.knockdown = knockdown;
      result.events.push({
        type: knockdown.recovered ? "count-eight" : "knockout",
        boxer: knockdown.knockedDown,
        count: knockdown.count,
        text: knockdown.recovered ? "Knockdown et compte obligatoire de huit." : "Le compte atteint dix.",
        visualCue: knockdown.recovered ? "count-eight" : "knockout",
      });
      result.visualCue = knockdown.recovered ? "knockdown" : "knockout";
      if (!knockdown.recovered) {
        result.fightResult = finishByStoppage(next, attackerKey, "KO", knockdown);
      }
    }

    if (!next.status.finished) {
      const playerStopped = shouldStopTko(next, "player");
      const opponentStopped = shouldStopTko(next, "opponent");
      if (playerStopped || opponentStopped) {
        const stopped = playerStopped && opponentStopped
          ? (tkoDanger(next.fighters.player) >= tkoDanger(next.fighters.opponent) ? "player" : "opponent")
          : (playerStopped ? "player" : "opponent");
        const winner = stopped === "player" ? "opponent" : "player";
        result.fightResult = finishByStoppage(next, winner, "TKO", null);
        result.events.push({
          type: "tko",
          boxer: stopped,
          text: "L'arbitre arrête le combat : le boxeur ne se défend plus intelligemment.",
          visualCue: "referee-stoppage",
        });
        result.visualCue = "referee-stoppage";
      }
    }

    next.exchange += 1;
    next.currentExchange = null;
    if (!next.status.finished) {
      if (next.exchange >= next.format.exchangesPerRound) finishRound(next, result, rng);
      else prepareExchangePrompt(next, rng);
    }
    next.lastResult = result;
    next.history.push(clone(result));
    return { state: next, result };
  }

  function publicState(state) {
    const visible = clone(state);
    if (visible.currentExchange) {
      delete visible.currentExchange.actualIntentionId;
      delete visible.currentExchange.readingType;
    }
    if (visible.roundState) {
      delete visible.roundState.actualPlan;
      delete visible.roundState.coachCorrect;
      delete visible.roundState.roundLuck;
      delete visible.roundState.localNoise;
    }
    delete visible.refereeTolerance;
    delete visible.rngState;
    if (!visible.status.finished) {
      visible.judges = visible.judges.map(judge => ({ id: judge.id }));
      visible.rounds = visible.rounds.map(round => {
        const safe = clone(round);
        delete safe.cards;
        delete safe.playerVotes;
        delete safe.opponentVotes;
        delete safe.winner;
        delete safe.edge;
        return safe;
      });
      const hideRoundCards = result => {
        if (!result || !result.roundSummary) return result;
        delete result.roundSummary.cards;
        delete result.roundSummary.playerVotes;
        delete result.roundSummary.opponentVotes;
        delete result.roundSummary.winner;
        delete result.roundSummary.edge;
        return result;
      };
      visible.lastResult = hideRoundCards(visible.lastResult);
      visible.history = visible.history.map(hideRoundCards);
    }
    return visible;
  }

  function simulateFight(config, policies, rng) {
    const choices = policies || {};
    let state = createFight(config, rng);
    let guard = 0;
    while (!state.status.finished && guard < 100) {
      guard += 1;
      if (state.phase === "corner") {
        const options = coachOptions(state);
        const selected = typeof choices.coach === "function"
          ? choices.coach(publicState(state), options)
          : (options.find(option => option.id === "recover" && state.fighters.player.energy < 35)
            || options.find(option => option.recommended)
            || options[0]);
        state = chooseCoachDirective(state, typeof selected === "string" ? selected : selected.id, rng).state;
      } else if (state.phase === "exchange") {
        const actions = availableActions(state);
        const selected = typeof choices.action === "function"
          ? choices.action(publicState(state), actions)
          : actions[0];
        state = resolveExchange(state, typeof selected === "string" ? selected : selected.id, rng).state;
      } else {
        throw new Error(`Phase de simulation inconnue : ${state.phase}`);
      }
    }
    if (!state.status.finished) throw new Error("La simulation n'a pas atteint un état final.");
    return state;
  }

  return Object.freeze({
    VERSION,
    ROUND_COUNT,
    DISTANCES: Object.freeze(DISTANCES.slice()),
    POSITIONS: Object.freeze(POSITIONS.slice()),
    LEGACY_WEIGHTS,
    ACTIONS,
    INTENTIONS,
    createSeededRng,
    createFight,
    getCoachOptions: coachOptions,
    chooseCoachDirective,
    getAvailableActions: availableActions,
    resolveExchange,
    getPublicState: publicState,
    simulateFight,
    formulas: Object.freeze({
      strategySkill,
      conditionScore,
      readingAccuracy,
      coachAccuracy,
      naturalRecovery,
      knockdownChance,
      tkoDanger,
    }),
  });
});
