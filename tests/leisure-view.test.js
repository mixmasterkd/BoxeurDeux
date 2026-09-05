"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const leisureView = require("../leisure-view.js");

function baseContext(overrides = {}) {
  return {
    profile: { firstName: "Alex" },
    careerStatus: "amateur",
    week: 8,
    careerClock: { dayLabel: "Lundi · matin" },
    careerDateLabel: "2 novembre 2026",
    money: 125,
    capacityRemaining: 19,
    activities: [
      { id: "bowling", available: true },
      { id: "cinema", available: true },
      { id: "arcade", available: true },
      { id: "karting", available: true },
    ],
    ...overrides,
  };
}

test("expose une vue pure, quatre activités et deux décors dédiés", () => {
  assert.equal(globalThis.BoxeurLeisureView, leisureView);
  assert.equal(leisureView.SCENES.desktop, "assets/centre-loisirs-desktop.jpg");
  assert.equal(leisureView.SCENES.mobile, "assets/centre-loisirs-mobile.jpg");
  assert.deepEqual(leisureView.ACTIVITIES.map(activity => activity.id), ["bowling", "cinema", "arcade", "karting"]);
});

test("rend l’intérieur plein écran avec les quatre fiches de sortie", () => {
  const html = leisureView.render(baseContext());

  assert.match(html, /career-leisure-view career-place-view/);
  assert.match(html, /career-leisure-layout career-place-layout/);
  assert.match(html, /career-leisure-dashboard career-place-dashboard/);
  assert.match(html, /Une pause bien méritée, Alex/);
  assert.match(html, /Amateur · Semaine 8 · Lundi · matin · 2 novembre 2026/);
  assert.match(html, /assets\/centre-loisirs-desktop\.jpg/);
  assert.match(html, /assets\/centre-loisirs-mobile\.jpg/);
  assert.equal((html.match(/data-career-leisure-activity=/g) || []).length, 4);
  assert.equal((html.match(/disabled aria-disabled="true"/g) || []).length, 0);
  assert.match(html, /Quilles\. Une partie entre amis\. 30 \$ · 6 capacité\. Ouvrir les détails\./);
  assert.match(html, /125 \$ · 19 capacité/);
  assert.match(html, /Une seule sortie peut être prévue par semaine/);
  assert.match(html, /Le prix sera payé seulement lorsque tu confirmeras/);
  assert.doesNotMatch(html, /data-career-leisure-confirm|data-career-leisure-buy/);
});

test("affiche la sortie planifiée et une fiche de remplacement confirmable", () => {
  const context = baseContext({
    plannedEntryId: "plan-week-8-2",
    plannedActivityId: "bowling",
    activities: [
      { id: "bowling", available: true, planned: true, plannedEntryId: "plan-week-8-2" },
      { id: "cinema", available: true },
      { id: "arcade", available: true },
      { id: "karting", available: false, reason: "Il manque 10 $ pour cette sortie." },
    ],
  });
  const interior = leisureView.render(context);
  const replacement = leisureView.renderMenu(context, "cinema");
  const unavailable = leisureView.renderMenu(context, "karting");
  const current = leisureView.renderMenu(context, "bowling");

  assert.match(interior, /career-leisure-hotspot-bowling planned/);
  assert.match(interior, /data-career-leisure-remove="plan-week-8-2"/);
  assert.match(replacement, /Remplacer par Cinéma/);
  assert.match(replacement, /Aucun argent n’a encore été dépensé/);
  assert.match(replacement, /Prix<\/dt><dd>25 \$/);
  assert.match(replacement, /Aucune XP et aucun bonus de statistique/);
  assert.match(unavailable, /Il manque 10 \$ pour cette sortie/);
  assert.match(unavailable, /data-career-leisure-confirm="karting" disabled aria-disabled="true"/);
  assert.match(current, /Retirer de ma semaine/);
  assert.doesNotMatch(current, /data-career-leisure-confirm=/);
});

test("normalise et échappe les données de sauvegarde affichées", () => {
  const attack = '<img src=x onerror="boom()">';
  const context = leisureView.normalizeContext({
    profile: { firstName: attack },
    careerStatus: "professional",
    week: -12,
    careerClock: { dayLabel: attack },
    careerDateLabel: attack,
  });
  const html = leisureView.render({
    profile: { firstName: attack },
    careerStatus: "professional",
    week: -12,
    careerClock: { dayLabel: attack },
    careerDateLabel: attack,
  });

  assert.equal(context.statusLabel, "Professionnel");
  assert.equal(context.week, 1);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /onerror="boom\(\)"/);
  assert.match(html, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;/);
});
