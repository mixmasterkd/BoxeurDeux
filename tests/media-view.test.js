"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const mediaView = require("../media-view.js");

function baseContext(overrides = {}) {
  return {
    profile: { firstName: "Alex" },
    careerStatus: "amateur",
    week: 8,
    careerClock: { dayLabel: "Lundi · matin" },
    careerDateLabel: "2 novembre 2026",
    reputation: 18,
    capacityRemaining: 19,
    activities: [
      { id: "interview", available: true },
      { id: "photoshoot", available: true },
      { id: "podcast", available: false, reputationLocked: true, reason: "20 de réputation requise; ta réputation actuelle est de 18." },
      { id: "appearance", available: false, reputationLocked: true, reason: "35 de réputation requise; ta réputation actuelle est de 18." },
    ],
    ...overrides,
  };
}

test("expose une vue pure, quatre apparitions et deux décors dédiés", () => {
  assert.equal(globalThis.BoxeurMediaView, mediaView);
  assert.equal(mediaView.SCENES.desktop, "assets/studio-media-desktop.jpg");
  assert.equal(mediaView.SCENES.mobile, "assets/studio-media-mobile.jpg");
  assert.deepEqual(mediaView.ACTIVITIES.map(activity => activity.id), ["interview", "photoshoot", "podcast", "appearance"]);
});

test("rend le studio plein écran avec les quatre propositions", () => {
  const html = mediaView.render(baseContext());

  assert.match(html, /career-media-view career-place-view/);
  assert.match(html, /Fais connaître ton parcours, Alex/);
  assert.match(html, /Amateur · Semaine 8 · Lundi · matin · 2 novembre 2026/);
  assert.match(html, /assets\/studio-media-desktop\.jpg/);
  assert.match(html, /assets\/studio-media-mobile\.jpg/);
  assert.equal((html.match(/data-career-media-activity=/g) || []).length, 4);
  assert.match(html, /Entrevue locale\. Quelques questions devant les caméras\. 4 capacité · \+1 réputation\. Ouvrir les détails\./);
  assert.match(html, /career-media-hotspot-podcast locked/);
  assert.match(html, /Débloqué à 20 réputation/);
  assert.match(html, /Verrouillée\. 20 de réputation requise; ta réputation actuelle est de 18/);
  assert.match(html, /18\/100 réputation/);
  assert.match(html, /19 points de capacité restent disponibles/);
  assert.match(html, /Une seule apparition peut être prévue par semaine/);
  assert.match(html, /ni argent, ni XP, ni énergie/);
  assert.doesNotMatch(html, /data-career-media-confirm=/);
});

test("affiche l’apparition planifiée et une proposition de remplacement", () => {
  const context = baseContext({
    plannedEntryId: "plan-week-8-3",
    plannedActivityId: "interview",
    activities: [
      { id: "interview", available: true, planned: true, plannedEntryId: "plan-week-8-3" },
      { id: "photoshoot", available: true },
      { id: "podcast", available: true },
      { id: "appearance", available: false, reason: "Ta réputation est déjà au maximum." },
    ],
  });
  const interior = mediaView.render(context);
  const replacement = mediaView.renderMenu(context, "photoshoot");
  const unavailable = mediaView.renderMenu(context, "appearance");
  const current = mediaView.renderMenu(context, "interview");

  assert.match(interior, /career-media-hotspot-interview planned/);
  assert.match(interior, /data-career-media-remove="plan-week-8-3"/);
  assert.match(replacement, /Remplacer par Séance photo/);
  assert.match(replacement, /aucun gain n’a encore été appliqué/);
  assert.match(replacement, /Capacité<\/dt><dd>−5/);
  assert.match(replacement, /Réputation<\/dt><dd>\+2/);
  assert.match(replacement, /Aucun argent, aucune XP/);
  assert.match(unavailable, /Ta réputation est déjà au maximum/);
  assert.match(unavailable, /data-career-media-confirm="appearance" disabled aria-disabled="true"/);
  assert.match(current, /Retirer de ma semaine/);
  assert.doesNotMatch(current, /data-career-media-confirm=/);
});

test("normalise et échappe les données affichées", () => {
  const attack = '<img src=x onerror="boom()">';
  const context = mediaView.normalizeContext({
    profile: { firstName: attack },
    careerStatus: "professional",
    week: -12,
    reputation: 999,
    careerClock: { dayLabel: attack },
    careerDateLabel: attack,
  });
  const html = mediaView.render({ profile: { firstName: attack }, careerStatus: "professional" });

  assert.equal(context.statusLabel, "Professionnel");
  assert.equal(context.week, 1);
  assert.equal(context.reputation, 100);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /onerror="boom\(\)"/);
  assert.match(html, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;/);
});
