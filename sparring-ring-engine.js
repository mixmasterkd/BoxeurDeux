(function sparringRingEngineFactory(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurSparringRing = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildSparringRingEngine() {
  "use strict";

  const VERSION = 1;
  const GRID_SIZE = 5;
  const DIRECTIONS = Object.freeze([
    Object.freeze({ id: "north", dx: 0, dy: -1 }),
    Object.freeze({ id: "east", dx: 1, dy: 0 }),
    Object.freeze({ id: "south", dx: 0, dy: 1 }),
    Object.freeze({ id: "west", dx: -1, dy: 0 }),
  ]);

  function clamp(value, min = 0, max = 100) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, number));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function roundTo(value, decimals = 1) {
    const factor = 10 ** decimals;
    return Math.round(Number(value) * factor) / factor;
  }

  function hashSeed(seed) {
    const text = String(seed == null ? "sparring-remy" : seed);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0 || 0x6d2b79f5;
  }

  function nextRandom(state) {
    state.rngState = (state.rngState + 0x6d2b79f5) >>> 0;
    let mixed = state.rngState;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  }

  function normalizeStats(stats) {
    const source = stats || {};
    return {
      technique: clamp(source.technique == null ? 40 : source.technique, 1, 99),
      power: clamp(source.power == null ? 40 : source.power, 1, 99),
      cardio: clamp(source.cardio == null ? 40 : source.cardio, 1, 99),
      defense: clamp(source.defense == null ? 40 : source.defense, 1, 99),
    };
  }

  function createState(config) {
    const source = config || {};
    return {
      version: VERSION,
      seed: String(source.seed == null ? "sparring-remy" : source.seed),
      rngState: hashSeed(source.seed),
      round: 1,
      playerCorner: source.playerCorner === "red" ? "red" : "blue",
      playerStats: normalizeStats(source.playerStats),
      opponentStyle: String(source.opponentStyle || "Pression"),
      coachQuality: clamp(source.coachQuality == null ? 0.60 : source.coachQuality, 0, 1),
      fighters: {
        player: { x: 1, y: 3 },
        opponent: { x: 3, y: 1 },
      },
      pendingMovement: null,
      perception: {
        value: 0,
        uncertainty: 30,
        trueFlow: 0,
        exchanges: 0,
      },
      lastOpponentMovement: null,
    };
  }

  function isInside(point) {
    return point.x >= 0 && point.x < GRID_SIZE && point.y >= 0 && point.y < GRID_SIZE;
  }

  function sameCell(left, right) {
    return left.x === right.x && left.y === right.y;
  }

  function distanceBetween(left, right) {
    return Math.max(Math.abs(left.x - right.x), Math.abs(left.y - right.y));
  }

  function movementRole(from, to, opponent) {
    const before = distanceBetween(from, opponent);
    const after = distanceBetween(to, opponent);
    if (after < before) return "advance";
    if (after > before) return "retreat";
    return "lateral";
  }

  function movementLabel(role, spaces) {
    const labels = {
      advance: spaces === 2 ? "Entrée rapide" : "Avancer",
      retreat: spaces === 2 ? "Sortie rapide" : "Reculer",
      lateral: spaces === 2 ? "Grand pivot" : "Pas de côté",
    };
    return labels[role] || "Se déplacer";
  }

  function getMovementOptions(state, energy = 100) {
    if (!state) return [];
    if (state.pendingMovement) return [];
    const from = state.fighters.player;
    const opponent = state.fighters.opponent;
    const options = [{
      id: "hold",
      direction: "hold",
      spaces: 0,
      energyCost: 0,
      role: "hold",
      label: "Rester en place",
      destination: clone(from),
    }];
    for (const direction of DIRECTIONS) {
      for (const spaces of [1, 2]) {
        const destination = { x: from.x + direction.dx * spaces, y: from.y + direction.dy * spaces };
        const middle = { x: from.x + direction.dx, y: from.y + direction.dy };
        const energyCost = spaces === 2 ? 3 : 1;
        if (!isInside(destination) || sameCell(destination, opponent)) continue;
        if (spaces === 2 && sameCell(middle, opponent)) continue;
        if (Number(energy) < energyCost) continue;
        const role = movementRole(from, destination, opponent);
        options.push({
          id: `${direction.id}-${spaces}`,
          direction: direction.id,
          spaces,
          energyCost,
          role,
          label: movementLabel(role, spaces),
          destination,
        });
      }
    }
    return options;
  }

  function ringContextFor(state, combatRing) {
    const player = state.fighters.player;
    const opponent = state.fighters.opponent;
    const distance = distanceBetween(player, opponent);
    const playerOnXEdge = player.x === 0 || player.x === GRID_SIZE - 1;
    const playerOnYEdge = player.y === 0 || player.y === GRID_SIZE - 1;
    const opponentOnXEdge = opponent.x === 0 || opponent.x === GRID_SIZE - 1;
    const opponentOnYEdge = opponent.y === 0 || opponent.y === GRID_SIZE - 1;
    let position = "center";
    let pressured = null;
    if (playerOnXEdge || playerOnYEdge) {
      position = playerOnXEdge && playerOnYEdge ? "corner" : "ropes";
      pressured = "player";
    } else if (opponentOnXEdge || opponentOnYEdge) {
      position = opponentOnXEdge && opponentOnYEdge ? "corner" : "ropes";
      pressured = "opponent";
    }
    return {
      ...(combatRing || {}),
      distance: distance <= 1 ? "inside" : distance === 2 ? "mid" : "outside",
      position,
      pressured,
    };
  }

  function applyMovement(state, combatState, movementId) {
    if (!state || !combatState || combatState.phase !== "exchange") throw new Error("Le déplacement exige un échange actif.");
    if (state.pendingMovement) throw new Error("Un déplacement a déjà été choisi pour cet échange.");
    const available = getMovementOptions(state, combatState.fighters?.player?.energy);
    const movement = available.find(option => option.id === movementId);
    if (!movement) throw new Error(`Déplacement indisponible : ${movementId}`);
    const next = clone(state);
    const nextCombat = clone(combatState);
    next.fighters.player = clone(movement.destination);
    next.pendingMovement = clone(movement);
    nextCombat.fighters.player.energy = clamp(roundTo(nextCombat.fighters.player.energy - movement.energyCost));
    nextCombat.ring = ringContextFor(next, nextCombat.ring);
    if (movement.role === "advance") nextCombat.ring.momentum = clamp(roundTo(nextCombat.ring.momentum + 0.2), -2, 2);
    if (movement.role === "retreat") nextCombat.ring.momentum = clamp(roundTo(nextCombat.ring.momentum - 0.15), -2, 2);
    if (movement.role === "lateral" && nextCombat.ring.position === "center") nextCombat.ring.momentum = clamp(roundTo(nextCombat.ring.momentum + 0.1), -2, 2);
    return {
      state: next,
      combatState: nextCombat,
      result: {
        ...clone(movement),
        text: movement.spaces === 0
          ? "Tu gardes ta position et ton énergie."
          : `${movement.label} : ${movement.energyCost} point${movement.energyCost > 1 ? "s" : ""} d’énergie.`,
      },
    };
  }

  function candidateOpponentMoves(state, role) {
    const opponent = state.fighters.opponent;
    const player = state.fighters.player;
    return DIRECTIONS.map(direction => ({
      x: opponent.x + direction.dx,
      y: opponent.y + direction.dy,
      direction: direction.id,
    })).filter(point => isInside(point) && !sameCell(point, player)).sort((left, right) => {
      const leftDistance = distanceBetween(left, player);
      const rightDistance = distanceBetween(right, player);
      if (role === "advance") return leftDistance - rightDistance;
      if (role === "retreat") return rightDistance - leftDistance;
      const leftCenter = Math.abs(left.x - 2) + Math.abs(left.y - 2);
      const rightCenter = Math.abs(right.x - 2) + Math.abs(right.y - 2);
      return leftCenter - rightCenter;
    });
  }

  function uncertaintyFor(state, combatState) {
    const stats = state.playerStats;
    const player = combatState?.fighters?.player || {};
    const clarity = stats.technique * 0.30
      + stats.defense * 0.28
      + stats.cardio * 0.17
      + clamp(player.energy == null ? 70 : player.energy) * 0.13
      + clamp(player.lucidity == null ? 80 : player.lucidity) * 0.12;
    const stylePenalty = /mobile|contre|adapt/i.test(state.opponentStyle) ? 4 : /pression|puncheur|tank/i.test(state.opponentStyle) ? 1 : 2;
    const coachHelp = state.coachQuality * 8;
    return roundTo(clamp(48 - clarity * 0.38 + stylePenalty - coachHelp, 9, 38));
  }

  function perceptionLabel(value) {
    if (value >= 48) return "Tu sens que tu imposes nettement le sparring";
    if (value >= 16) return "Tu crois avoir une légère emprise";
    if (value <= -48) return "Tu sens que Rémy impose nettement le rythme";
    if (value <= -16) return "Tu as l’impression de subir un peu";
    return "Le round te semble encore partagé";
  }

  function advanceAfterExchange(state, transition, combatState) {
    if (!state || !transition?.result) return state;
    const next = clone(state);
    const result = transition.result;
    const evidence = clamp(
      Number(result.edge || 0) * 3.2
        + (Number(result.playerImpact || 0) - Number(result.opponentImpact || 0)) * 1.4
        + (result.side === "player" ? 6 : result.side === "opponent" ? -6 : 0),
      -36,
      36,
    );
    next.perception.trueFlow = clamp(roundTo(next.perception.trueFlow * 0.68 + evidence), -100, 100);
    next.perception.uncertainty = uncertaintyFor(next, combatState || transition.state);
    const noise = (nextRandom(next) * 2 - 1) * next.perception.uncertainty * 0.55;
    next.perception.value = clamp(roundTo(next.perception.trueFlow * 0.82 + noise), -100, 100);
    next.perception.exchanges += 1;

    let opponentRole = result.side === "player" ? "retreat" : result.side === "opponent" ? "advance" : "lateral";
    if (/pression|puncheur|tank/i.test(next.opponentStyle) && result.side !== "player") opponentRole = "advance";
    const candidates = candidateOpponentMoves(next, opponentRole);
    if (candidates.length) {
      const preferred = candidates.filter(candidate => {
        const distance = distanceBetween(candidate, next.fighters.player);
        return opponentRole === "advance" ? distance >= 1 : true;
      });
      const pool = preferred.length ? preferred : candidates;
      const selected = pool[Math.min(pool.length - 1, Math.floor(nextRandom(next) * Math.min(pool.length, 2)))];
      next.fighters.opponent = { x: selected.x, y: selected.y };
      next.lastOpponentMovement = { role: opponentRole, direction: selected.direction };
    }
    next.pendingMovement = null;

    const nextRound = Number(transition.state?.round || combatState?.round || next.round);
    if (nextRound !== next.round && transition.state?.phase === "corner") {
      next.round = nextRound;
      next.fighters.player = { x: 1, y: 3 };
      next.fighters.opponent = { x: 3, y: 1 };
      next.lastOpponentMovement = null;
    }
    return next;
  }

  function beginRound(state, round) {
    if (!state) return state;
    const next = clone(state);
    next.round = Number(round) || next.round;
    next.pendingMovement = null;
    next.perception.value = 0;
    next.perception.trueFlow = 0;
    next.perception.exchanges = 0;
    return next;
  }

  function ringPoint(point) {
    const y = clamp(point.y, 0, GRID_SIZE - 1);
    const margin = 26 - y * 3.75;
    const width = 100 - margin * 2;
    return {
      xPercent: roundTo(margin + clamp(point.x, 0, GRID_SIZE - 1) * (width / (GRID_SIZE - 1)), 2),
      yPercent: roundTo(35 + y * 10.5, 2),
      scale: roundTo(0.62 + y * 0.08, 3),
      layer: 10 + Math.round(y),
    };
  }

  function fighterVisual(state, role) {
    const fighter = state.fighters[role];
    const target = state.fighters[role === "player" ? "opponent" : "player"];
    const point = ringPoint(fighter);
    const dx = target.x - fighter.x;
    const dy = target.y - fighter.y;
    const corner = role === "player" ? state.playerCorner : state.playerCorner === "blue" ? "red" : "blue";
    // Les silhouettes intégrées ont une orientation naturelle liée à leur rôle :
    // le boxeur bleu regarde à droite, Rémy en rouge regarde à gauche.
    // Le coin de carrière ne doit donc jamais retourner les deux personnages.
    const baseFacesRight = role === "player";
    const wantsRight = dx === 0 ? baseFacesRight : dx > 0;
    return {
      ...point,
      pose: dy < 0 ? "back" : "front",
      mirrored: wantsRight !== baseFacesRight,
      corner,
      direction: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "east" : "west") : (dy > 0 ? "south" : "north"),
    };
  }

  function getView(state, energy = 100) {
    if (!state) return null;
    return {
      fighters: {
        player: fighterVisual(state, "player"),
        opponent: fighterVisual(state, "opponent"),
      },
      movementOptions: getMovementOptions(state, energy).map(option => ({
        ...clone(option),
        point: ringPoint(option.destination),
      })),
      pendingMovement: clone(state.pendingMovement),
      perception: {
        value: state.perception.value,
        uncertainty: state.perception.uncertainty,
        low: clamp(state.perception.value - state.perception.uncertainty, -100, 100),
        high: clamp(state.perception.value + state.perception.uncertainty, -100, 100),
        label: perceptionLabel(state.perception.value),
        exchanges: state.perception.exchanges,
      },
    };
  }

  function findSuggestedMovement(state, combatState, purpose) {
    const options = getMovementOptions(state, combatState?.fighters?.player?.energy);
    if (!options.length) return null;
    const oneStep = options.filter(option => option.spaces === 1);
    if (purpose === "attack") return oneStep.find(option => option.role === "advance") || options[0];
    if (purpose === "exit") {
      const centerMoves = oneStep.filter(option => option.role !== "advance").sort((left, right) => {
        const leftCenter = Math.abs(left.destination.x - 2) + Math.abs(left.destination.y - 2);
        const rightCenter = Math.abs(right.destination.x - 2) + Math.abs(right.destination.y - 2);
        return leftCenter - rightCenter;
      });
      return centerMoves[0] || options[0];
    }
    if (purpose === "defense") return oneStep.find(option => option.role === "retreat") || options[0];
    return options.find(option => option.id === "hold") || options[0];
  }

  return Object.freeze({
    VERSION,
    GRID_SIZE,
    createState,
    getMovementOptions,
    applyMovement,
    advanceAfterExchange,
    beginRound,
    getView,
    findSuggestedMovement,
    formulas: Object.freeze({ uncertaintyFor, perceptionLabel, ringContextFor, distanceBetween }),
  });
});
