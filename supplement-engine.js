(function attachBoxeurSupplements(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurSupplements = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurSupplementsApi() {
  "use strict";

  /*
   * Noyau pur des suppléments de la carrière actuelle.
   *
   * Un produit est acheté, placé dans l'inventaire, puis réservé avant une
   * seule séance. Il peut modifier légèrement le coût immédiat de cette
   * séance ou sa récupération, mais ne crée jamais de statistique, de stimulus
   * ou d'expérience. Le moteur qui exécute l'entraînement demeure l'autorité.
   */

  const SCHEMA_VERSION = 1;
  const STATE_KIND = "boxeur-supplements";
  const LEGACY_STATE_KINDS = Object.freeze(["boxeur-v2-supplements"]);
  const MAX_WEEKLY_USES = 2;
  const MAX_INVENTORY_PER_PRODUCT = 9;
  const RECEIPT_LIMIT = 128;

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  const CATALOG = deepFreeze({
    "protein-bar": {
      id: "protein-bar",
      label: "Barre protéinée",
      price: 10,
      category: "collation",
      detail: "Une petite collation avant l'entraînement.",
      benefit: "Réduit très légèrement le coût d'énergie et la fatigue finale.",
      compromise: "Effet plus discret que les autres options; elle occupe quand même ton choix de produit.",
      effects: {
        energyCostMultiplier: 0.96,
        fatigueGainMultiplier: 1,
        fatigueRelief: 1,
        recoveryQualityBonus: 0,
      },
    },
    "sports-drink": {
      id: "sports-drink",
      label: "Boisson sportive",
      price: 14,
      category: "hydratation",
      detail: "À préparer pour ta prochaine séance.",
      benefit: "Réduit modestement le coût d'énergie de la séance.",
      compromise: "N’améliore ni l’XP ciblée, ni la progression, ni la récupération de nuit.",
      effects: {
        energyCostMultiplier: 0.9,
        fatigueGainMultiplier: 1,
        fatigueRelief: 0,
        recoveryQualityBonus: 0,
      },
    },
    "protein-shake": {
      id: "protein-shake",
      label: "Shake protéiné",
      price: 20,
      category: "récupération",
      detail: "Un soutien léger après la prochaine séance.",
      benefit: "Réduit un peu la fatigue finale et soutient légèrement l'assimilation à la prochaine récupération.",
      compromise: "N'aide pas à payer le coût d'énergie immédiat de la séance.",
      effects: {
        energyCostMultiplier: 1,
        fatigueGainMultiplier: 1,
        fatigueRelief: 2,
        recoveryQualityBonus: 0.03,
      },
    },
    preworkout: {
      id: "preworkout",
      label: "Pré-entraînement",
      price: 28,
      category: "stimulant",
      detail: "Un coup de pouce bref pour une seule séance.",
      benefit: "Réduit davantage le coût d'énergie immédiat.",
      compromise: "La fatigue monte plus vite et la récupération de la séance est légèrement moins efficace.",
      effects: {
        energyCostMultiplier: 0.82,
        fatigueGainMultiplier: 1.15,
        fatigueRelief: 0,
        recoveryQualityBonus: -0.03,
      },
    },
  });

  const LEGACY_ID_ALIASES = deepFreeze({
    "energy-drink": "preworkout",
    "protein-tub": "protein-shake",
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function finiteNumber(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, finiteNumber(value, min)));
  }

  function wholeNumber(value, fallback, min, max) {
    return Math.round(clamp(value == null ? fallback : value, min, max));
  }

  function roundTo(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round((finiteNumber(value) + Number.EPSILON) * factor) / factor;
  }

  function supplementError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details !== undefined) error.details = details;
    return error;
  }

  function canonicalProductId(value) {
    const supplied = String(value == null ? "" : value).trim();
    return LEGACY_ID_ALIASES[supplied] || supplied;
  }

  function resolveProduct(productId) {
    const canonicalId = canonicalProductId(productId);
    const product = CATALOG[canonicalId];
    if (!product) throw supplementError("UNKNOWN_SUPPLEMENT", `Supplément inconnu : ${String(productId || "—")}.`);
    return product;
  }

  function normalizeIds(source, limit = RECEIPT_LIMIT) {
    if (!Array.isArray(source)) return [];
    const ids = [];
    source.forEach(value => {
      const id = String(value == null ? "" : value).trim();
      if (id && !ids.includes(id)) ids.push(id);
    });
    return ids.slice(-limit);
  }

  function rememberId(ids, id) {
    if (!id) return ids;
    return [...ids.filter(existing => existing !== id), id].slice(-RECEIPT_LIMIT);
  }

  function emptyInventory() {
    return Object.keys(CATALOG).reduce((inventory, id) => {
      inventory[id] = 0;
      return inventory;
    }, {});
  }

  function addInventoryQuantity(inventory, rawId, rawQuantity) {
    const id = canonicalProductId(rawId);
    if (!CATALOG[id]) return;
    inventory[id] = wholeNumber(
      finiteNumber(inventory[id]) + finiteNumber(rawQuantity),
      0,
      0,
      MAX_INVENTORY_PER_PRODUCT,
    );
  }

  function normalizeInventory(source) {
    const inventory = emptyInventory();
    if (Array.isArray(source)) {
      source.forEach(item => {
        if (!item || typeof item !== "object") return;
        addInventoryQuantity(inventory, item.id, item.quantity == null ? 1 : item.quantity);
      });
      return inventory;
    }
    if (!source || typeof source !== "object") return inventory;
    Object.entries(source).forEach(([id, quantity]) => addInventoryQuantity(inventory, id, quantity));
    return inventory;
  }

  function normalizeActiveUse(source) {
    if (!source || typeof source !== "object") return null;
    const productId = canonicalProductId(source.productId || source.id);
    const sessionId = String(source.sessionId == null ? "" : source.sessionId).trim();
    const useId = String(source.useId == null ? "" : source.useId).trim();
    if (!CATALOG[productId] || !sessionId || !useId) return null;
    return {
      productId,
      sessionId,
      useId,
      weekKey: String(source.weekKey == null ? "untracked" : source.weekKey),
    };
  }

  function normalizeWeeklyUsage(source, legacySource, fallbackWeekKey) {
    const weekly = source && typeof source === "object" ? source : {};
    const legacyIds = Array.isArray(legacySource?.supplementsUsed)
      ? legacySource.supplementsUsed.map(canonicalProductId).filter(id => CATALOG[id])
      : [];
    const productIds = normalizeIds(
      Array.isArray(weekly.productIds) ? weekly.productIds.map(canonicalProductId) : legacyIds,
      MAX_WEEKLY_USES,
    ).filter(id => CATALOG[id]);
    const count = wholeNumber(
      weekly.count == null ? productIds.length : weekly.count,
      productIds.length,
      productIds.length,
      MAX_WEEKLY_USES,
    );
    return {
      weekKey: String(weekly.weekKey == null
        ? legacySource?.supplementWeek == null
          ? fallbackWeekKey == null ? "untracked" : fallbackWeekKey
          : legacySource.supplementWeek
        : weekly.weekKey),
      count,
      productIds,
      sessionIds: normalizeIds(weekly.sessionIds, MAX_WEEKLY_USES),
    };
  }

  /** Accepte l'état actuel, un inventaire de fiche ou une ancienne sauvegarde. */
  function createState(input = {}, options = {}) {
    const outer = input && typeof input === "object" ? input : {};
    const source = outer.supplements && typeof outer.supplements === "object"
      ? outer.supplements
      : outer;
    const inventorySource = source.inventory == null
      ? source.supplementInventory == null ? outer.supplementInventory : source.supplementInventory
      : source.inventory;
    return {
      kind: STATE_KIND,
      schemaVersion: SCHEMA_VERSION,
      inventory: normalizeInventory(inventorySource),
      activeUse: normalizeActiveUse(source.activeUse),
      weeklyUsage: normalizeWeeklyUsage(source.weeklyUsage, outer, options.weekKey),
      purchaseIds: normalizeIds(source.purchaseIds),
      useIds: normalizeIds(source.useIds),
    };
  }

  function assertState(state) {
    if (!state || typeof state !== "object"
      || state.kind !== STATE_KIND
      || state.schemaVersion !== SCHEMA_VERSION
      || !state.inventory
      || !state.weeklyUsage) {
      throw supplementError("INVALID_SUPPLEMENT_STATE", "État des suppléments invalide.");
    }
    return state;
  }

  function inventoryList(state) {
    assertState(state);
    return Object.values(CATALOG).map(product => ({
      id: product.id,
      label: product.label,
      quantity: wholeNumber(state.inventory[product.id], 0, 0, MAX_INVENTORY_PER_PRODUCT),
      price: product.price,
      detail: product.detail,
      benefit: product.benefit,
      compromise: product.compromise,
    })).filter(item => item.quantity > 0);
  }

  function quotePurchase(state, productId, quantity = 1, options = {}) {
    assertState(state);
    const product = resolveProduct(productId);
    const requested = wholeNumber(quantity, 1, 1, MAX_INVENTORY_PER_PRODUCT);
    const current = wholeNumber(state.inventory[product.id], 0, 0, MAX_INVENTORY_PER_PRODUCT);
    const accepted = Math.min(requested, MAX_INVENTORY_PER_PRODUCT - current);
    const cost = accepted * product.price;
    const balance = options.money == null ? null : Math.max(0, finiteNumber(options.money));
    if (accepted <= 0) {
      return {
        ok: false,
        code: "INVENTORY_FULL",
        reason: `Ton inventaire contient déjà le maximum de ${product.label.toLocaleLowerCase("fr-CA")}.`,
        productId: product.id,
        requested,
        accepted: 0,
        cost: 0,
      };
    }
    if (balance !== null && balance < cost) {
      return {
        ok: false,
        code: "INSUFFICIENT_FUNDS",
        reason: `Il manque ${Math.ceil(cost - balance)} $ pour cet achat.`,
        productId: product.id,
        requested,
        accepted,
        cost,
      };
    }
    return { ok: true, productId: product.id, requested, accepted, cost, unitPrice: product.price };
  }

  function purchase(state, productId, quantity = 1, options = {}) {
    assertState(state);
    const next = createState(state);
    const transactionId = String(options.transactionId == null ? "" : options.transactionId).trim();
    if (transactionId && next.purchaseIds.includes(transactionId)) {
      return {
        state: next,
        result: { duplicate: true, productId: canonicalProductId(productId), quantity: 0, cost: 0 },
        balance: options.money == null ? null : finiteNumber(options.money),
      };
    }
    const quote = quotePurchase(next, productId, quantity, options);
    if (!quote.ok) throw supplementError(quote.code, quote.reason, quote);
    next.inventory[quote.productId] += quote.accepted;
    if (transactionId) next.purchaseIds = rememberId(next.purchaseIds, transactionId);
    const balance = options.money == null ? null : roundTo(finiteNumber(options.money) - quote.cost);
    return {
      state: next,
      result: {
        duplicate: false,
        productId: quote.productId,
        quantity: quote.accepted,
        cost: quote.cost,
        unitPrice: quote.unitPrice,
      },
      balance,
    };
  }

  function weeklyUsageFor(state, weekKey) {
    const requestedKey = String(weekKey == null ? state.weeklyUsage.weekKey : weekKey);
    if (state.weeklyUsage.weekKey === requestedKey) return clone(state.weeklyUsage);
    return { weekKey: requestedKey, count: 0, productIds: [], sessionIds: [] };
  }

  function canPrepareForSession(state, productId, options = {}) {
    try {
      assertState(state);
      const product = resolveProduct(productId);
      const sessionId = String(options.sessionId == null ? "" : options.sessionId).trim();
      const useId = String(options.useId == null ? `supplement-${sessionId}` : options.useId).trim();
      const weeklyUsage = weeklyUsageFor(state, options.weekKey);
      if (!sessionId) return { ok: false, code: "MISSING_SESSION_ID", reason: "Choisis d'abord la séance visée." };
      if (options.careerStatus === "recreational") {
        return { ok: false, code: "SUPPLEMENTS_LOCKED", reason: "La boutique de suppléments se débloque au passage amateur." };
      }
      if (state.activeUse) {
        if (state.activeUse.useId === useId && state.activeUse.productId === product.id) {
          return { ok: true, duplicate: true, product, weeklyUsage, sessionId, useId };
        }
        return { ok: false, code: "SUPPLEMENT_ALREADY_PREPARED", reason: "Un produit est déjà réservé pour une séance." };
      }
      if (state.useIds.includes(useId)) {
        return { ok: false, code: "USE_ALREADY_PROCESSED", reason: "Cette utilisation a déjà été enregistrée." };
      }
      if (state.inventory[product.id] <= 0) {
        return { ok: false, code: "OUT_OF_STOCK", reason: `${product.label} n'est pas dans ton inventaire.` };
      }
      if (weeklyUsage.count >= MAX_WEEKLY_USES) {
        return { ok: false, code: "WEEKLY_USE_LIMIT", reason: `Limite de ${MAX_WEEKLY_USES} produits par semaine atteinte.` };
      }
      if (weeklyUsage.productIds.includes(product.id)) {
        return { ok: false, code: "PRODUCT_ALREADY_USED", reason: "Ce produit a déjà été utilisé cette semaine." };
      }
      if (weeklyUsage.sessionIds.includes(sessionId)) {
        return { ok: false, code: "SESSION_ALREADY_SUPPLEMENTED", reason: "Cette séance a déjà reçu un produit." };
      }
      return { ok: true, duplicate: false, product, weeklyUsage, sessionId, useId };
    } catch (error) {
      return { ok: false, code: error.code || "INVALID_SUPPLEMENT_USE", reason: error.message };
    }
  }

  /** Réserve et retire une unité; cancelPreparedUse permet de l'annuler sans perte. */
  function prepareForSession(state, productId, options = {}) {
    assertState(state);
    const check = canPrepareForSession(state, productId, options);
    if (!check.ok) throw supplementError(check.code, check.reason);
    const next = createState(state);
    if (check.duplicate) return { state: next, result: { duplicate: true, activeUse: clone(next.activeUse) } };
    next.weeklyUsage = check.weeklyUsage;
    next.inventory[check.product.id] -= 1;
    next.activeUse = {
      productId: check.product.id,
      sessionId: check.sessionId,
      useId: check.useId,
      weekKey: check.weeklyUsage.weekKey,
    };
    next.useIds = rememberId(next.useIds, check.useId);
    return { state: next, result: { duplicate: false, activeUse: clone(next.activeUse) } };
  }

  function cancelPreparedUse(state) {
    assertState(state);
    const next = createState(state);
    if (!next.activeUse) return { state: next, result: { cancelled: false } };
    const cancelled = clone(next.activeUse);
    next.inventory[cancelled.productId] = Math.min(
      MAX_INVENTORY_PER_PRODUCT,
      next.inventory[cancelled.productId] + 1,
    );
    next.useIds = next.useIds.filter(id => id !== cancelled.useId);
    next.activeUse = null;
    return { state: next, result: { cancelled: true, activeUse: cancelled } };
  }

  function normalizeSession(source) {
    const session = source && typeof source === "object" ? source : {};
    return {
      ...clone(session),
      energyCost: Math.max(0, finiteNumber(session.energyCost)),
      fatigueGain: Math.max(0, finiteNumber(session.fatigueGain)),
      fatigueRelief: Math.max(0, finiteNumber(session.fatigueRelief)),
      recoveryQuality: clamp(session.recoveryQuality == null ? 1 : session.recoveryQuality, 0.75, 1.25),
      stimulus: session.stimulus && typeof session.stimulus === "object" ? clone(session.stimulus) : {},
    };
  }

  /**
   * Consomme le produit réservé et retourne les totaux temporaires ajustés.
   * Le stimulus est volontairement copié sans aucune modification.
   */
  function applyToSession(state, sessionInput, options = {}) {
    assertState(state);
    if (!state.activeUse) throw supplementError("NO_PREPARED_SUPPLEMENT", "Aucun produit n'est réservé pour cette séance.");
    const sessionId = String(options.sessionId == null ? "" : options.sessionId).trim();
    if (!sessionId || state.activeUse.sessionId !== sessionId) {
      throw supplementError("SESSION_MISMATCH", "Le produit réservé appartient à une autre séance.");
    }
    const product = resolveProduct(state.activeUse.productId);
    const before = normalizeSession(sessionInput);
    const effects = product.effects;
    const after = {
      ...before,
      energyCost: roundTo(before.energyCost * effects.energyCostMultiplier),
      fatigueGain: roundTo(Math.max(0, before.fatigueGain * effects.fatigueGainMultiplier - effects.fatigueRelief)),
      recoveryQuality: roundTo(clamp(before.recoveryQuality + effects.recoveryQualityBonus, 0.75, 1.25), 4),
      stimulus: clone(before.stimulus),
    };
    const next = createState(state);
    next.weeklyUsage = weeklyUsageFor(next, next.activeUse.weekKey);
    next.weeklyUsage.count += 1;
    next.weeklyUsage.productIds.push(product.id);
    next.weeklyUsage.sessionIds.push(sessionId);
    const consumedUse = clone(next.activeUse);
    next.activeUse = null;
    return {
      state: next,
      session: after,
      result: {
        productId: product.id,
        label: product.label,
        useId: consumedUse.useId,
        before,
        after: clone(after),
        benefit: product.benefit,
        compromise: product.compromise,
      },
    };
  }

  function getUseOptions(state, options = {}) {
    assertState(state);
    return Object.values(CATALOG).map(product => {
      const availability = canPrepareForSession(state, product.id, options);
      return {
        id: product.id,
        label: product.label,
        quantity: state.inventory[product.id],
        price: product.price,
        detail: product.detail,
        benefit: product.benefit,
        compromise: product.compromise,
        available: availability.ok,
        disabledReason: availability.ok ? null : availability.reason,
      };
    });
  }

  return Object.freeze({
    SCHEMA_VERSION,
    STATE_KIND,
    LEGACY_STATE_KINDS,
    MAX_WEEKLY_USES,
    MAX_INVENTORY_PER_PRODUCT,
    CATALOG,
    LEGACY_ID_ALIASES,
    createState,
    assertState,
    canonicalProductId,
    resolveProduct,
    inventoryList,
    quotePurchase,
    purchase,
    canPrepareForSession,
    prepareForSession,
    cancelPreparedUse,
    applyToSession,
    getUseOptions,
  });
});
