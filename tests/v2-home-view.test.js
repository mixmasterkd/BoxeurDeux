"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const homeView = require("../v2-home-view.js");

function baseContext(overrides = {}) {
  return {
    profile: { firstName: "Alex" },
    clock: { dayLabel: "Mercredi", periodLabel: "Soir", dateLabel: "9 septembre 2026" },
    condition: {
      energy: 72,
      fatigue: 28,
      pendingLoad: 36,
      recommendation: "Une soirée calme serait utile",
      recommendationDetail: "Le travail de la veille doit encore être assimilé.",
      recommendationTone: "warning",
    },
    actions: {
      sleep: { available: true },
      recover: { available: true },
      advance: { available: true },
    },
    ...overrides,
  };
}

test("expose la même API en CommonJS et sur globalThis", () => {
  assert.equal(globalThis.BoxeurHomeView, homeView);
  assert.equal(homeView.ZONES.length, 4);
  assert.equal(homeView.ACTIONS.length, 3);
});

test("rend les deux illustrations et quatre zones sous forme de vrais boutons", () => {
  const html = homeView.render(baseContext());

  assert.match(html, /assets\/maison-v2-desktop\.jpg/);
  assert.match(html, /assets\/maison-v2-mobile\.jpg/);
  assert.equal((html.match(/data-v2-home-zone=/g) || []).length, 4);
  for (const zone of homeView.ZONES) {
    assert.match(html, new RegExp(`<button[^>]+type="button"[^>]+data-v2-home-zone="${zone.id}"`));
  }
  assert.match(html, /data-v2-home-action="sleep"/);
  assert.match(html, /data-v2-home-action="recover"/);
  assert.match(html, /data-v2-home-action="advance"/);
  assert.match(html, /data-v2-leave-home/);
});

test("affiche le moment, les trois indicateurs et la prochaine recommandation", () => {
  const html = homeView.render(baseContext());

  assert.match(html, /Mercredi · Soir/);
  assert.match(html, /9 septembre 2026/);
  assert.match(html, /Énergie<\/span><strong>72 %/);
  assert.match(html, /Fatigue<\/span><strong>28 %/);
  assert.match(html, /Charge à assimiler<\/span><strong>36 %/);
  assert.match(html, /Une soirée calme serait utile/);
});

test("la cuisine reste focusable, sans action, avec une raison accessible", () => {
  const html = homeView.render(baseContext());

  assert.match(html, /<button[^>]+data-v2-home-zone="kitchen"[^>]+aria-disabled="true"[^>]+aria-describedby="v2-home-zone-kitchen-reason"/);
  assert.doesNotMatch(html, /data-v2-home-zone="kitchen"[^>]+ disabled/);
  assert.match(html, /Repas et poids · bientôt branché/);
  assert.match(html, /id="v2-home-zone-kitchen-reason">Cette fonction sera branchée avec le système de repas et de poids\.<\/span>/);
  assert.doesNotMatch(html, /data-v2-home-zone="kitchen"[^>]+data-v2-home-action/);
});

test("explique aussi pourquoi une récupération est temporairement indisponible", () => {
  const html = homeView.render(baseContext({
    actions: {
      sleep: { available: true },
      recover: { available: false, reason: "Une blessure exige du repos complet." },
      advance: { available: true },
    },
  }));

  assert.match(html, /data-v2-home-action="recover"[^>]+disabled[^>]+aria-disabled="true"/);
  assert.match(html, /id="v2-home-action-recover-help">Une blessure exige du repos complet\.<\/small>/);
  assert.match(html, /id="v2-home-zone-lounge-reason">Une blessure exige du repos complet\.<\/span>/);
});

test("échappe toutes les données sérialisables de la vue", () => {
  const attack = `<img src=x onerror="boom()">`;
  const html = homeView.render({
    profile: { firstName: attack },
    clock: { dayLabel: attack, periodLabel: attack, dateLabel: attack },
    condition: {
      recommendation: attack,
      recommendationDetail: attack,
    },
    actions: {
      sleep: { available: false, reason: attack },
      recover: { available: true },
      advance: { available: true },
    },
  });

  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /onerror="boom\(\)"/);
  assert.match(html, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;/);
});

test("emploie un vocabulaire québécois cohérent pour la maison", () => {
  const html = homeView.render(baseContext());

  assert.match(html, /Sous-sol/);
  assert.match(html, /Entraînement de dépannage/);
  assert.match(html, /Dormir jusqu’à demain matin/);
  assert.match(html, /Récupération active/);
  assert.doesNotMatch(html, /cave|petit-déjeuner/i);
});

test("rend un résultat de récupération réutilisable et échappé", () => {
  const html = homeView.renderResult({
    title: "Bonne nuit <script>",
    summary: "Énergie & assimilation",
    timeLabel: "Jeudi · Matin",
    changes: [
      { label: "Énergie <b>", value: "+18 %", tone: "positive" },
      { label: "Fatigue", value: "-12 %", tone: "warning" },
    ],
    recommendation: "Retourne au GYM <demain>",
  });

  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Bonne nuit &lt;script&gt;/);
  assert.match(html, /Énergie &amp; assimilation/);
  assert.match(html, /Énergie &lt;b&gt;/);
  assert.match(html, /Retourne au GYM &lt;demain&gt;/);
  assert.doesNotMatch(html, /<script>|<demain>/);
  assert.match(html, /data-v2-home-result-close/);
  assert.match(html, /data-v2-leave-home/);
});
