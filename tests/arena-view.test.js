"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const arenaView = require("../arena-view.js");

function baseContext(overrides = {}) {
  return {
    profile: { firstName: "Alex" },
    careerStatusLabel: "Amateur",
    clock: { week: 4, dayLabel: "Lundi · matin", dateLabel: "2 novembre 2026" },
    condition: {
      preparationLabel: "Excellente",
      preparationDetail: "XP ciblée bien assimilée.",
      preparationTone: "positive",
      energy: 92,
      fatigue: 8,
    },
    event: null,
    ...overrides,
  };
}

test("expose une vue pure et les deux décors de l’aréna", () => {
  assert.equal(globalThis.BoxeurArenaView, arenaView);
  assert.equal(arenaView.SCENES.desktop, "assets/arena-v2-desktop.png");
  assert.equal(arenaView.SCENES.mobile, "assets/arena-v2-mobile.png");
  assert.deepEqual(arenaView.EVENT_STATES, ["none", "future", "due", "ready", "active", "completed"]);
});

test("rend l’aréna comme un lieu plein écran lorsqu’aucun combat n’est réservé", () => {
  const html = arenaView.render(baseContext());

  assert.match(html, /career-arena-view career-place-view/);
  assert.match(html, /career-arena-layout career-place-layout/);
  assert.match(html, /career-arena-dashboard career-place-dashboard/);
  assert.match(html, /data-career-arena-state="none"/);
  assert.match(html, /Aucun combat réservé/);
  assert.match(html, /Consulter les événements/);
  assert.match(html, /assets\/arena-v2-desktop\.png/);
  assert.match(html, /assets\/arena-v2-mobile\.png/);
  assert.equal((html.match(/data-career-arena-action/g) || []).length, 2);
  assert.doesNotMatch(html, /data-start-fight|id="start-fight"/);
});

test("affiche le gala futur, son lieu et son adversaire", () => {
  const html = arenaView.render(baseContext({
    event: {
      kind: "gala",
      state: "future",
      name: "Gala de l’Est",
      week: 7,
      dateLabel: "21 novembre 2026",
      venue: "Aréna de l’Est · Montréal · QC",
      opponent: { name: "Samuel Bouchard", nickname: "Le Mur", style: "Défensif", record: "4 V · 3 D" },
    },
  }));

  assert.match(html, /data-career-arena-state="future"/);
  assert.match(html, /Combat réservé/);
  assert.match(html, /Gala de l’Est/);
  assert.match(html, /Semaine<\/dt><dd>7/);
  assert.match(html, /Samuel Bouchard « Le Mur »/);
  assert.match(html, /Défensif · 4 V · 3 D/);
  assert.match(html, /Voir le combat réservé/);
});

test("distingue la préparation, le combat prêt et un tournoi actif", () => {
  const due = arenaView.render(baseContext({ event: { kind: "gala", state: "due", name: "Gala local", week: 4 } }));
  const ready = arenaView.render(baseContext({ event: { kind: "gala", state: "ready", name: "Gala local", week: 4 } }));
  const active = arenaView.render(baseContext({ event: { kind: "tournament", state: "active", name: "Gants dorés", week: 4, roundLabel: "Demi-finale", remaining: 2 } }));

  assert.match(due, /data-career-arena-state="due"/);
  assert.match(due, /Semaine de combat/);
  assert.match(due, /Préparer et confirmer la semaine/);
  assert.match(ready, /data-career-arena-state="ready"/);
  assert.match(ready, /Combat prêt/);
  assert.match(ready, /Entrer dans le ring/);
  assert.match(active, /data-career-arena-state="active"/);
  assert.match(active, /Tournoi en cours/);
  assert.match(active, /Demi-finale/);
  assert.match(active, /Ouvrir le tableau du tournoi/);
});

test("échappe toutes les données de sauvegarde affichées", () => {
  const attack = '<img src=x onerror="boom()">';
  const html = arenaView.render(baseContext({
    profile: { firstName: attack },
    event: { kind: "gala", state: "future", name: attack, venue: attack, week: 8, opponent: { name: attack, nickname: attack, style: attack, record: attack } },
  }));

  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /onerror="boom\(\)"/);
  assert.match(html, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;/);
});

test("sépare le conseil de gala, la préparation et les effets de déplacement", () => {
  const event = { kind: "gala", state: "future", name: "Gala", week: 7,
    opponent: { name: "Caron", style: "Puncheur" }, galaRisk: { id: "challenging", index: 3.238 },
    travelEffects: { energy: -6, fatigue: 4 }, travelApplied: false };
  const context = baseContext({ event, condition: { energy: 30, fatigue: 70, preparationLabel: "Fragile" } });
  const before = JSON.stringify(context);
  const html = arenaView.render(context);
  assert.match(html, /Gros défi/);
  assert.match(html, /Préparation actuelle/);
  assert.match(html, /plus difficile/);
  assert.match(html, /Déplacement à venir/);
  assert.match(html, /Ta préparation peut encore changer/);
  assert.doesNotMatch(html, /3\.238/);
  assert.equal((html.match(/aria-label="État de préparation actuel"/g) || []).length, 1);
  assert.equal(JSON.stringify(context), before);
  assert.doesNotMatch(arenaView.render(baseContext({ event: { ...event, travelApplied: true } })), /Déplacement à venir/);
  const tournament = arenaView.render(baseContext({ event: { ...event, kind: "tournament" } }));
  assert.doesNotMatch(tournament, /data-gala-risk|Déplacement à venir|Comparaison des caractéristiques|plus difficile/);
});
