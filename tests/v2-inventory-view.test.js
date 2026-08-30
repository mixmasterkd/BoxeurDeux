"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const inventoryView = require("../v2-inventory-view.js");

test("expose une API pure identique en CommonJS et dans le navigateur", () => {
  assert.equal(globalThis.BoxeurInventoryView, inventoryView);
  assert.equal(inventoryView.SCHEMA_VERSION, 1);
  assert.equal(typeof inventoryView.normalizeContext, "function");
  assert.equal(typeof inventoryView.render, "function");
  assert.equal(Object.isFrozen(inventoryView), true);
  assert.equal(Object.isFrozen(inventoryView.DEFAULT_CATEGORIES), true);
});

test("normalise un ancien inventaire de suppléments sans modifier les données reçues", () => {
  const raw = {
    profile: { firstName: "Sam" },
    supplementInventory: [
      {
        id: "boisson-sport",
        label: "Boisson sportive",
        quantity: 2,
        category: "hydratation",
        detail: "À préparer avant une séance.",
        benefit: "Petit soutien d’énergie pendant cette séance.",
        compromise: "Ne remplace ni un repas ni la récupération.",
      },
      { id: "vide", label: "Boîte vide", quantity: 0 },
      { id: "reserve", label: "Réserve", quantity: 50_000 },
    ],
  };
  const snapshot = structuredClone(raw);
  const context = inventoryView.normalizeContext(raw);

  assert.deepEqual(raw, snapshot);
  assert.equal(context.profile.firstName, "Sam");
  assert.equal(context.items.length, 2);
  assert.deepEqual(context.categories.map(category => category.id), ["supplements"]);
  assert.equal(context.items[0].categoryId, "supplements");
  assert.equal(context.items[0].kindLabel, "Hydratation");
  assert.equal(context.items[1].quantity, inventoryView.MAX_QUANTITY);
  assert.deepEqual(context.summary, {
    distinctItems: 2,
    totalQuantity: inventoryView.MAX_QUANTITY + 2,
    categoryCount: 1,
  });
});

test("rend les suppléments hors de la fiche Boxeur avec des repères explicites", () => {
  const html = inventoryView.render({
    profile: { firstName: "Noémie" },
    supplementInventory: [{
      id: "electrolytes",
      label: "Électrolytes",
      quantity: 2,
      category: "hydratation",
      description: "À choisir au moment prévu avant l’entraînement.",
      benefit: "Effet bref et modeste sur le confort de la séance.",
      compromise: "Coûte de l’argent et une unité est consommée.",
      status: "prepared",
    }],
  });

  assert.match(html, /<section class="v2-inventory-view" aria-labelledby="v2-inventory-title">/);
  assert.match(html, /<h2 id="v2-inventory-title">Ton inventaire<\/h2>/);
  assert.doesNotMatch(html, /Fiche du boxeur/i);
  assert.doesNotMatch(html, /data-v2-close-inventory|Retour à la carte/);
  assert.match(html, /data-v2-inventory-category="supplements"/);
  assert.match(html, /<ul class="v2-inventory-grid" role="list">/);
  assert.match(html, /aria-label="Quantité : 2">×2/);
  assert.match(html, /Effet temporaire/);
  assert.match(html, /Compromis/);
  assert.match(html, /Réservé/);
  assert.match(html, /Noémie/);
});

test("reste extensible aux catégories et actions d’objets futures", () => {
  const context = inventoryView.normalizeContext({
    categories: [
      { id: "souvenirs", label: "Souvenirs", description: "Objets remportés.", order: 5 },
    ],
    items: [
      { id: "medaille", name: "Médaille", quantity: 1, category: "souvenirs" },
      {
        id: "corde",
        name: "Corde à danser",
        quantity: 1,
        categoryId: "equipment",
        action: { id: "equip", label: "Mettre dans le sac" },
      },
    ],
  });

  assert.deepEqual(context.categories.map(category => category.id), ["souvenirs", "equipment"]);
  assert.equal(context.items[0].categoryId, "souvenirs");
  assert.equal(context.items[1].action.available, true);

  const html = inventoryView.render(context);
  assert.match(html, /data-v2-inventory-category="souvenirs"/);
  assert.match(html, /data-v2-inventory-category="equipment"/);
  assert.match(html, /<button type="button" data-v2-inventory-action="equip" data-v2-inventory-item="corde">Mettre dans le sac<\/button>/);
});

test("lit aussi un inventaire clé-quantité accompagné d’un catalogue", () => {
  const context = inventoryView.normalizeContext({
    inventory: { corde: 2, billets: { quantity: 3, status: "prepared" } },
    catalog: {
      corde: { label: "Corde", categoryId: "equipment" },
      billets: { label: "Billets", categoryId: "consumables" },
    },
  });

  assert.deepEqual(context.items.map(item => [item.id, item.quantity, item.categoryId]), [
    ["corde", 2, "equipment"],
    ["billets", 3, "consumables"],
  ]);
  assert.equal(context.items[1].statusLabel, "Réservé");
});

test("rend les blocages et les actions indisponibles compréhensibles au lecteur d’écran", () => {
  const html = inventoryView.render({
    access: { available: false, label: "Sac remisé", reason: "Reviens après le tutoriel." },
    items: [{
      id: "gants",
      label: "Gants",
      quantity: 1,
      status: "locked",
      action: { id: "use", label: "Utiliser" },
    }],
  });

  assert.match(html, /class="v2-inventory-access" role="status"/);
  assert.match(html, /Sac remisé/);
  assert.match(html, /Reviens après le tutoriel\./);
  assert.match(html, /data-v2-inventory-action="use"[^>]*disabled aria-disabled="true" aria-describedby="v2-inventory-item-gants-1-reason"/);
  assert.match(html, /id="v2-inventory-item-gants-1-reason">L’inventaire n’est pas accessible pour le moment\.<\/small>/);
  assert.match(html, /Verrouillé/);
});

test("fournit un état vide et échappe les données avant de les insérer dans le HTML", () => {
  const attack = `<img src=x onerror="boom()">`;
  const html = inventoryView.render({
    title: attack,
    emptyTitle: attack,
    emptyMessage: attack,
    profile: { firstName: attack },
  });

  assert.match(html, /class="v2-inventory-empty" role="status"/);
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /onerror="boom\(\)"/);
  assert.match(html, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;/);
});

test("la feuille de style garantit une vue mobile défilable et des cibles accessibles", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "v2-inventory.css"), "utf8");

  assert.match(css, /\.v2-inventory-view\s*\{[^}]*width:\s*min\(1060px, 100%\)/s);
  assert.match(css, /\.v2-inventory-view\s*\{[^}]*overflow-x:\s*hidden[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.v2-inventory-item-action button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.v2-inventory-view button:focus-visible[^}]*outline:/s);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.v2-inventory-view\s*\{[^}]*width:\s*100%[^}]*height:\s*100dvh/s);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.v2-inventory-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
