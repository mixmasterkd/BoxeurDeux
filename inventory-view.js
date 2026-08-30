(function attachBoxeurInventoryView(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurInventoryView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurInventoryViewApi() {
  "use strict";

  const SCHEMA_VERSION = 1;
  const MAX_ITEMS = 120;
  const MAX_QUANTITY = 9999;

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  const DEFAULT_CATEGORIES = deepFreeze([
    {
      id: "supplements",
      label: "Suppléments",
      description: "Produits à choisir avant une séance. Leurs effets demeurent temporaires et modestes.",
      order: 10,
    },
    {
      id: "equipment",
      label: "Équipement",
      description: "Matériel d’entraînement et objets durables.",
      order: 20,
    },
    {
      id: "consumables",
      label: "Consommables",
      description: "Objets utilisés une fois dans un contexte précis.",
      order: 30,
    },
    {
      id: "other",
      label: "Autres objets",
      description: "Objets de carrière qui n’appartiennent pas encore à une catégorie spécialisée.",
      order: 90,
    },
  ]);

  const STATUS_LABELS = deepFreeze({
    stored: "Dans le sac",
    prepared: "Réservé",
    locked: "Verrouillé",
    unavailable: "Indisponible",
  });

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function wholeNumber(value, fallback, min, max) {
    return Math.round(Math.min(max, Math.max(min, finiteNumber(value, fallback))));
  }

  function safeText(value, fallback = "", maxLength = 240) {
    const supplied = String(value == null ? "" : value).trim();
    return (supplied || fallback).slice(0, maxLength);
  }

  function safeId(value, fallback = "item") {
    const normalized = safeText(value, fallback, 100)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9._:-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || fallback;
  }

  function friendlyLabel(value, fallback = "Autres objets") {
    const text = safeText(value, fallback, 80).replace(/[-_]+/g, " ");
    return text.charAt(0).toLocaleUpperCase("fr-CA") + text.slice(1);
  }

  function canonicalCategoryId(value) {
    const id = safeId(value, "other");
    if (["supplement", "supplements", "nutrition"].includes(id)) return "supplements";
    if (["equipment", "equipement", "materiel"].includes(id)) return "equipment";
    if (["consumable", "consumables", "consommable", "consommables"].includes(id)) return "consumables";
    return id;
  }

  function normalizeCategory(rawCategory, index = 0) {
    const source = rawCategory && typeof rawCategory === "object"
      ? rawCategory
      : { id: rawCategory, label: friendlyLabel(rawCategory) };
    const id = canonicalCategoryId(source.id || source.categoryId || `category-${index + 1}`);
    const known = DEFAULT_CATEGORIES.find(category => category.id === id);
    return {
      id,
      label: safeText(source.label, known?.label || friendlyLabel(id), 80),
      description: safeText(source.description || source.detail, known?.description || "Objets rangés dans cette catégorie.", 300),
      order: wholeNumber(source.order, known?.order ?? 50 + index, -9999, 9999),
    };
  }

  function inventorySource(raw) {
    if (Array.isArray(raw.items)) return { items: raw.items, defaultCategoryId: null };
    if (Array.isArray(raw.inventory)) return { items: raw.inventory, defaultCategoryId: null };
    if (Array.isArray(raw.supplementInventory)) return { items: raw.supplementInventory, defaultCategoryId: "supplements" };
    if (Array.isArray(raw.supplements)) return { items: raw.supplements, defaultCategoryId: "supplements" };
    if (raw.inventory && typeof raw.inventory === "object") {
      const catalog = raw.catalog && typeof raw.catalog === "object" ? raw.catalog : {};
      return {
        items: Object.entries(raw.inventory).map(([id, supplied]) => {
          const item = supplied && typeof supplied === "object" ? supplied : { quantity: supplied };
          return { ...(catalog[id] && typeof catalog[id] === "object" ? catalog[id] : {}), ...item, id };
        }),
        defaultCategoryId: null,
      };
    }
    return { items: [], defaultCategoryId: null };
  }

  function normalizeAction(source, itemId, accessAvailable, itemStatus, quantity) {
    const supplied = source.action && typeof source.action === "object" ? source.action : null;
    const label = safeText(supplied?.label || source.actionLabel, "", 80);
    if (!supplied && !label) return null;
    const id = safeId(supplied?.id || source.actionId || "use", "use");
    const ownAvailable = supplied?.available !== false && source.actionAvailable !== false;
    const available = accessAvailable && ownAvailable && !["locked", "unavailable"].includes(itemStatus) && quantity > 0;
    const reason = !accessAvailable
      ? "L’inventaire n’est pas accessible pour le moment."
      : quantity <= 0
        ? "Aucune unité disponible."
        : safeText(supplied?.disabledReason || supplied?.reason || source.actionDisabledReason, "Cette action est indisponible pour le moment.", 240);
    return {
      id,
      label: label || "Utiliser",
      available,
      disabledReason: available ? "" : reason,
      itemId,
    };
  }

  function normalizeItem(rawItem, index = 0, options = {}) {
    const source = rawItem && typeof rawItem === "object" ? rawItem : {};
    const id = safeId(source.id || source.itemId || `item-${index + 1}`, `item-${index + 1}`);
    const quantity = wholeNumber(source.quantity == null ? source.count : source.quantity, 1, 0, MAX_QUANTITY);
    const suppliedCategory = options.defaultCategoryId
      || source.categoryId
      || source.groupId
      || source.category
      || source.type
      || "other";
    const categoryId = canonicalCategoryId(suppliedCategory);
    const status = Object.hasOwn(STATUS_LABELS, source.status) ? source.status : source.locked === true ? "locked" : "stored";
    const kindLabel = options.defaultCategoryId === "supplements" && source.category
      ? friendlyLabel(source.category, "Supplément")
      : safeText(source.kindLabel || source.typeLabel, "", 80);
    const item = {
      id,
      domId: `${id}-${index + 1}`,
      label: safeText(source.label || source.name, friendlyLabel(id, "Objet"), 100),
      quantity,
      categoryId,
      kindLabel,
      description: safeText(source.description || source.detail, "Objet conservé dans ton inventaire.", 320),
      benefit: safeText(source.benefit || source.effect, "", 320),
      compromise: safeText(source.compromise || source.tradeoff, "", 320),
      status,
      statusLabel: safeText(source.statusLabel, STATUS_LABELS[status], 80),
      note: safeText(source.note || source.usageNote, "", 240),
    };
    item.action = normalizeAction(source, id, options.accessAvailable !== false, status, quantity);
    return item;
  }

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
    const accessSource = raw.access && typeof raw.access === "object" ? raw.access : {};
    const accessAvailable = accessSource.available !== false && raw.available !== false;
    const sourced = inventorySource(raw);
    const items = sourced.items.slice(0, MAX_ITEMS)
      .map((item, index) => normalizeItem(item, index, {
        defaultCategoryId: sourced.defaultCategoryId,
        accessAvailable,
      }))
      .filter(item => item.quantity > 0 || raw.showEmptyItems === true);

    const categoriesById = new Map(DEFAULT_CATEGORIES.map((category, index) => [category.id, normalizeCategory(category, index)]));
    (Array.isArray(raw.categories) ? raw.categories : []).slice(0, 40).forEach((category, index) => {
      const normalized = normalizeCategory(category, index);
      categoriesById.set(normalized.id, normalized);
    });
    items.forEach(item => {
      if (categoriesById.has(item.categoryId)) return;
      categoriesById.set(item.categoryId, normalizeCategory({
        id: item.categoryId,
        label: friendlyLabel(item.categoryId),
        order: 50,
      }));
    });
    const usedCategoryIds = new Set(items.map(item => item.categoryId));
    const categories = [...categoriesById.values()]
      .filter(category => usedCategoryIds.has(category.id))
      .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label, "fr-CA"));
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      profile: { firstName: safeText(profile.firstName, "Boxeur", 40) },
      title: safeText(raw.title, "Ton inventaire", 100),
      eyebrow: safeText(raw.eyebrow, "Sac et objets", 80),
      introduction: safeText(
        raw.introduction,
        "Retrouve ici les objets que tu possèdes. Les suppléments se sélectionnent seulement au moment prévu avant une séance.",
        360,
      ),
      emptyTitle: safeText(raw.emptyTitle, "Ton inventaire est vide", 100),
      emptyMessage: safeText(raw.emptyMessage, "Les objets achetés ou obtenus pendant la carrière apparaîtront ici.", 280),
      access: {
        available: accessAvailable,
        label: safeText(accessSource.label, accessAvailable ? "Inventaire accessible" : "Inventaire verrouillé", 100),
        reason: safeText(accessSource.reason, accessAvailable ? "" : "Cette section se débloquera plus tard dans la carrière.", 280),
      },
      items,
      categories,
      summary: {
        distinctItems: items.filter(item => item.quantity > 0).length,
        totalQuantity,
        categoryCount: categories.length,
      },
    };
  }

  function renderItem(item) {
    const titleId = `career-inventory-item-${item.domId}`;
    const reasonId = `${titleId}-reason`;
    const kind = item.kindLabel ? `<span class="career-inventory-item-kind">${escapeHTML(item.kindLabel)}</span>` : "";
    const benefit = item.benefit
      ? `<div><dt>Effet temporaire</dt><dd>${escapeHTML(item.benefit)}</dd></div>`
      : "";
    const compromise = item.compromise
      ? `<div><dt>Compromis</dt><dd>${escapeHTML(item.compromise)}</dd></div>`
      : "";
    const facts = benefit || compromise ? `<dl class="career-inventory-item-facts">${benefit}${compromise}</dl>` : "";
    const note = item.note ? `<p class="career-inventory-item-note">${escapeHTML(item.note)}</p>` : "";
    let action = "";
    if (item.action) {
      const disabled = item.action.available ? "" : ` disabled aria-disabled="true" aria-describedby="${reasonId}"`;
      const reason = item.action.available ? "" : `<small class="career-inventory-action-reason" id="${reasonId}">${escapeHTML(item.action.disabledReason)}</small>`;
      action = `<div class="career-inventory-item-action"><button type="button" data-career-inventory-action="${escapeHTML(item.action.id)}" data-career-inventory-item="${escapeHTML(item.id)}"${disabled}>${escapeHTML(item.action.label)}</button>${reason}</div>`;
    }
    return `<li class="career-inventory-item status-${escapeHTML(item.status)}">
      <article aria-labelledby="${titleId}">
        <header><div>${kind}<h4 id="${titleId}">${escapeHTML(item.label)}</h4></div><span class="career-inventory-quantity" aria-label="Quantité : ${item.quantity}">×${item.quantity}</span></header>
        <p>${escapeHTML(item.description)}</p>
        ${facts}${note}
        <footer><span class="career-inventory-status"><span aria-hidden="true"></span>${escapeHTML(item.statusLabel)}</span>${action}</footer>
      </article>
    </li>`;
  }

  function renderCategory(category, items) {
    const titleId = `career-inventory-category-${safeId(category.id, "other")}`;
    return `<section class="career-inventory-category" data-career-inventory-category="${escapeHTML(category.id)}" aria-labelledby="${titleId}">
      <header><div><p class="eyebrow">Catégorie</p><h3 id="${titleId}">${escapeHTML(category.label)}</h3></div><p>${escapeHTML(category.description)}</p></header>
      <ul class="career-inventory-grid" role="list">${items.map(renderItem).join("")}</ul>
    </section>`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const access = context.access.available
      ? ""
      : `<section class="career-inventory-access" role="status"><strong>${escapeHTML(context.access.label)}</strong><p>${escapeHTML(context.access.reason)}</p></section>`;
    const content = context.items.length
      ? context.categories.map(category => renderCategory(
          category,
          context.items.filter(item => item.categoryId === category.id),
        )).join("")
      : `<section class="career-inventory-empty" role="status"><h3>${escapeHTML(context.emptyTitle)}</h3><p>${escapeHTML(context.emptyMessage)}</p></section>`;
    const totalLabel = `${context.summary.totalQuantity} unité${context.summary.totalQuantity > 1 ? "s" : ""}`;
    const distinctLabel = `${context.summary.distinctItems} objet${context.summary.distinctItems > 1 ? "s" : ""} distinct${context.summary.distinctItems > 1 ? "s" : ""}`;

    return `<section class="career-inventory-view" aria-labelledby="career-inventory-title">
      <header class="career-inventory-header"><div><p class="eyebrow">${escapeHTML(context.eyebrow)}</p><h2 id="career-inventory-title">${escapeHTML(context.title)}</h2><p>${escapeHTML(context.introduction)}</p></div></header>
      <section class="career-inventory-summary" aria-label="Résumé de l’inventaire" aria-live="polite">
        <div><span>Propriétaire</span><strong>${escapeHTML(context.profile.firstName)}</strong></div>
        <div><span>Dans le sac</span><strong>${escapeHTML(totalLabel)}</strong><small>${escapeHTML(distinctLabel)}</small></div>
        <div><span>Catégories</span><strong>${context.summary.categoryCount}</strong></div>
      </section>
      ${access}<div class="career-inventory-content">${content}</div>
    </section>`;
  }

  return Object.freeze({
    SCHEMA_VERSION,
    MAX_ITEMS,
    MAX_QUANTITY,
    DEFAULT_CATEGORIES,
    STATUS_LABELS,
    escapeHTML,
    normalizeCategory,
    normalizeItem,
    normalizeContext,
    renderItem,
    renderCategory,
    render,
  });
});
