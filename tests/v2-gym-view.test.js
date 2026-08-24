"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const gymView = require("../v2-gym-view.js");

function baseContext(overrides = {}) {
  return {
    careerStatus: "recreational",
    profile: { firstName: "Alex" },
    condition: {
      preparationLabel: "Très bonne",
      preparationDetail: "Prêt pour une séance utile.",
      preparationTone: "positive",
      energy: 88,
      fatigue: 14,
      availableMinutes: 75,
    },
    coach: {
      name: "Coach Nadia",
      sessionTitle: "Bases et déplacements",
      sessionSummary: "Corde, shadow et mitaines.",
      durationMinutes: 55,
      available: true,
    },
    membership: { active: true, label: "Abonnement actif", detail: "Expire le 30 septembre.", monthlyPrice: 110, balance: 220 },
    recreational: { trainingWeeks: 4, targetWeeks: 6, remyStatus: "locked" },
    ...overrides,
  };
}

test("expose la même API en CommonJS et sur globalThis", () => {
  assert.equal(globalThis.BoxeurGymView, gymView);
  assert.equal(gymView.EXERCISES.length, 6);
  assert.equal(gymView.ZONES.length, 8);
});

test("rend les deux illustrations et huit zones sous forme de vrais boutons", () => {
  const html = gymView.render(baseContext());

  assert.match(html, /assets\/gym-boxe-v2-desktop\.jpg/);
  assert.match(html, /assets\/gym-boxe-v2-mobile\.jpg/);
  assert.equal((html.match(/data-v2-gym-zone=/g) || []).length, 9, "huit hotspots et le raccourci d’accueil");
  for (const zone of gymView.ZONES) {
    assert.match(html, new RegExp(`<button[^>]+data-v2-gym-zone="${zone.id}"`));
  }
  assert.match(html, /<button[^>]+data-v2-coach-session[^>]*>Faire la séance de l’entraîneur<\/button>/);
  assert.match(html, /<button[^>]+data-v2-compose-session[^>]*>Composer ma séance<\/button>/);
  assert.match(html, /Énergie/);
  assert.match(html, /Fatigue/);
  assert.match(html, /Temps disponible <b>75 min<\/b>/);
});

test("emploie le vocabulaire québécois pour les mitaines", () => {
  const rendered = `${gymView.render(baseContext())}${gymView.renderComposer(baseContext())}`;

  assert.match(rendered, /Travail aux mitaines/);
  assert.doesNotMatch(rendered, /pattes d['’]ours/i);
});

test("échappe les données sérialisables dans la vue principale", () => {
  const attack = `<img src=x onerror="boom()">`;
  const html = gymView.render(baseContext({
    profile: { firstName: attack },
    coach: {
      name: attack,
      sessionTitle: attack,
      sessionSummary: attack,
      notice: attack,
      available: true,
    },
    membership: { active: true, label: attack, detail: attack },
    recreational: { trainingWeeks: 2, targetWeeks: 6, remyStatus: "locked", remyDetail: attack },
  }));

  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /onerror="boom\(\)"/);
  assert.match(html, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;/);
});

test("montre le chemin pédagogique de Rémy uniquement au statut récréatif", () => {
  const recreational = gymView.render(baseContext({
    recreational: { trainingWeeks: 6, targetWeeks: 6, remyStatus: "ready" },
  }));
  const amateur = gymView.render(baseContext({ careerStatus: "amateur" }));

  assert.match(recreational, /Parcours récréatif/);
  assert.match(recreational, /Rémy « Le Tank »/);
  assert.match(recreational, /Cours de groupe/);
  assert.match(recreational, /data-v2-remy-sparring/);
  assert.doesNotMatch(amateur, /Rémy « Le Tank »/);
  assert.match(amateur, /Parcours amateur/);
  assert.match(amateur, /sparring pour arriver prêt/);
  assert.doesNotMatch(amateur, /Cours de groupe/);
});

test("rend l’inscription incontournable et explique les activités verrouillées", () => {
  const html = gymView.render(baseContext({
    condition: {
      energy: 88,
      fatigue: 14,
      trainingBlocked: true,
      trainingBlockedReason: "Charge productive atteinte pour cette semaine.",
    },
    membership: {
      active: false,
      label: "Abonnement requis",
      detail: "Passe à la réception.",
      monthlyPrice: 110,
      balance: 75,
    },
  }));

  assert.match(html, /data-membership-active="false"/);
  assert.match(html, /<strong>Inscription requise<\/strong>/);
  assert.match(html, /Forfait 1 mois/);
  assert.match(html, /<strong>110 \$<\/strong>/);
  assert.match(html, /Solde : 75 \$ · il manque 35 \$/);
  assert.match(html, /data-v2-gym-zone="reception"[^>]+aria-label="S’inscrire · 110 \$\. Solde : 75 \$ · il manque 35 \$"/);
  assert.match(html, /Cours de groupe récréatif/);
  assert.match(html, /sac au sous-sol reste accessible à la maison/);

  for (const zone of gymView.ZONES.filter(item => item.id !== "reception")) {
    assert.match(html, new RegExp(`data-v2-gym-zone="${zone.id}"[^>]+aria-disabled="true"[^>]+aria-describedby="v2-gym-membership-lock-reason"`));
    const openingTag = html.match(new RegExp(`<button[^>]+data-v2-gym-zone="${zone.id}"[^>]*>`))[0];
    assert.doesNotMatch(openingTag, /\sdisabled(?:\s|>)/);
  }
  assert.doesNotMatch(html, /data-v2-gym-zone="reception"[^>]+aria-disabled/);
  assert.match(html, /data-v2-coach-session[^>]+disabled[^>]+aria-disabled="true"/);
  assert.match(html, /data-v2-compose-session[^>]+disabled[^>]+aria-disabled="true"/);

  const composer = gymView.renderComposer(baseContext({ membership: { active: false, monthlyPrice: 110, balance: 75 } }));
  assert.match(composer, /Inscription requise/);
  assert.equal((composer.match(/class="v2-exercise-choice[^>]+disabled/g) || []).length, gymView.EXERCISES.length);
  assert.match(composer, /data-v2-confirm-session[^>]+disabled/);
});

test("le compositeur accepte au plus trois blocs connus", () => {
  const context = baseContext({
    selectedExercises: ["jump-rope", "mitt-work", "sparring", "<script>", "heavy-bag"],
    draftDurationMinutes: 64,
  });
  const normalized = gymView.normalizeContext(context);
  const html = gymView.renderComposer(context);

  assert.deepEqual(normalized.selectedExercises, ["jump-rope", "mitt-work", "sparring"]);
  assert.match(html, /3\/3 blocs/);
  assert.match(html, /Durée prévue : 64 min/);
  assert.doesNotMatch(html, /<script>/);
  assert.equal((html.match(/class="v2-exercise-choice/g) || []).length, gymView.EXERCISES.length);
  assert.match(html, /data-v2-exercise="heavy-bag"[^>]+disabled/);
  assert.match(html, /data-v2-confirm-session/);
  assert.match(gymView.renderComposer(baseContext({ selectedExercises: ["mitt-work"] })), /data-v2-confirm-session disabled/);
  assert.doesNotMatch(gymView.renderComposer(baseContext({ selectedExercises: ["mitt-work", "defense"] })), /data-v2-confirm-session disabled/);
});

test("échappe le bilan de séance sans inventer ses effets", () => {
  const html = gymView.renderResult({
    title: "Bon travail <script>",
    summary: "Rythme & contrôle",
    durationMinutes: 52,
    changes: [{ label: "Technique <b>", value: "+1 & stable", tone: "positive" }],
    highlights: ["Pivot <img src=x>"],
    nextStep: "Récupère avant <le prochain bloc>",
  });

  assert.doesNotMatch(html, /<script>|<img src=x>|<le prochain bloc>/);
  assert.match(html, /Bon travail &lt;script&gt;/);
  assert.match(html, /Rythme &amp; contrôle/);
  assert.match(html, /Technique &lt;b&gt;/);
  assert.match(html, /Durée : <strong>52 min<\/strong>/);
  assert.match(html, /aria-live="polite"/);
});

test("rend la restriction médicale visible et bloque les zones d’entraînement", () => {
  const html = gymView.render(baseContext({
    condition: {
      energy: 85,
      fatigue: 12,
      trainingBlocked: true,
      trainingBlockedReason: "Repos médical obligatoire pendant 2 semaines.",
    },
    coach: {
      name: "Coach",
      available: false,
      notice: "Repos médical obligatoire pendant 2 semaines.",
    },
  }));

  assert.match(html, /Repos médical obligatoire pendant 2 semaines/);
  assert.match(html, /data-v2-gym-zone="heavy-bag"[^>]+disabled[^>]+aria-disabled="true"/);
  assert.doesNotMatch(html, /data-v2-gym-zone="reception"[^>]+disabled/);
  assert.match(html, /data-v2-compose-session[^>]+disabled[^>]+aria-disabled="true"/);
});
