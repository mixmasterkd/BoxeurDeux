"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const gymView = require("../gym-view.js");

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
  assert.equal(gymView.ZONES.length, 4);
  assert.equal(gymView.PRESETS.length, 4);
});

test("emploie le gabarit partagé des lieux", () => {
  const html = gymView.render(baseContext({ clock: { week: 3, dayLabel: "Lundi · matin", dateLabel: "15 septembre" } }));
  assert.match(html, /career-gym-view career-place-view/);
  assert.match(html, /career-gym-header career-place-header/);
  assert.match(html, /career-gym-dashboard career-place-dashboard/);
  assert.match(html, /Récréatif · Semaine 3 · Lundi · matin · 15 septembre/);
});

test("rend les deux illustrations et quatre zones principales sous forme de vrais boutons", () => {
  const html = gymView.render(baseContext());

  assert.match(html, /assets\/gym-boxe-v2-desktop\.jpg/);
  assert.match(html, /assets\/gym-boxe-v2-mobile\.jpg/);
  assert.equal((html.match(/class="career-gym-hotspot career-gym-hotspot-/g) || []).length, 4);
  for (const zone of gymView.ZONES) {
    assert.match(html, new RegExp(`<button[^>]+data-career-gym-zone="${zone.id}"`));
  }
  assert.doesNotMatch(html, /data-career-coach-session|data-career-compose-session|data-career-boxing-trainer|data-career-sparring-activity="cta"/);
  const coachMenu = gymView.renderMenu("coach", baseContext());
  assert.match(coachMenu, /<button[^>]+data-career-coach-session[^>]*>Ajouter à ma semaine<\/button>/);
  assert.match(html, /Cours récréatifs/);
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

test("retire la tuile de parcours récréatif et route Rémy par le ring", () => {
  const recreational = gymView.render(baseContext({
    recreational: { trainingWeeks: 6, targetWeeks: 6, remyStatus: "ready" },
  }));
  const amateur = gymView.render(baseContext({ careerStatus: "amateur" }));
  const recreationalCoachMenu = gymView.renderMenu("coach", baseContext());
  const amateurCoachMenu = gymView.renderMenu("coach", baseContext({ careerStatus: "amateur" }));

  assert.doesNotMatch(recreational, /Parcours récréatif|En route vers Rémy|data-career-remy-sparring/);
  assert.match(recreational, /data-career-gym-zone="ring"(?![^>]+disabled)/);
  assert.match(recreational, /Sparring pédagogique avec Rémy/);
  assert.match(recreationalCoachMenu, /cours récréatifs sont préparés/i);
  assert.doesNotMatch(amateur, /Rémy « Le Tank »/);
  assert.doesNotMatch(amateur, /data-career-coach-session|data-career-boxing-trainer/);
  assert.match(amateurCoachMenu, /data-career-coach-session/);
  assert.match(amateurCoachMenu, /data-career-boxing-trainer/);
});

test("sépare le sparring des séances et retire toute confirmation manuelle après Rémy", () => {
  const beforeRemy = gymView.render(baseContext({
    recreational: { trainingWeeks: 4, targetWeeks: 6, remyStatus: "locked" },
  }));
  const afterRemy = gymView.render(baseContext({
    recreational: { trainingWeeks: 6, targetWeeks: 6, remyStatus: "completed" },
  }));
  const afterRemyCoach = gymView.renderMenu("coach", baseContext({
    recreational: { trainingWeeks: 6, targetWeeks: 6, remyStatus: "completed" },
  }));
  const amateurContext = baseContext({ careerStatus: "amateur", sparring: { immediate: true, cost: 18 } });
  const amateur = gymView.renderMenu("ring", amateurContext);
  const amateurGym = gymView.render(amateurContext);

  assert.match(beforeRemy, /data-career-gym-zone="ring"[^>]+disabled/);
  assert.match(beforeRemy, /sparring pédagogique avec Rémy/);
  assert.doesNotMatch(beforeRemy, /data-career-sparring-activity="cta"/);
  assert.match(afterRemy, /Passage amateur automatique/);
  assert.doesNotMatch(afterRemy, /data-career-sparring-activity="cta"/);
  assert.doesNotMatch(afterRemyCoach, /data-career-amateur-transition|Passer amateur|Confirmer le passage amateur/);
  assert.match(amateur, /data-career-sparring-state="available"/);
  assert.match(amateur, /activité distincte/);
  assert.match(amateur, /data-career-sparring-activity="cta"(?![^>]+disabled)/);
  assert.match(amateur, /Participer au sparring · −18 énergie/);
  assert.match(amateurGym, /data-career-gym-zone="ring"[^>]*><strong>Sparring<\/strong><small>Participer maintenant · −18 énergie<\/small>/);
  assert.doesNotMatch(amateur, /Cours de groupe/);
});

test("rend le CTA de sparring dans son menu et explique chaque blocage", () => {
  const membershipBlocked = gymView.renderMenu("ring", baseContext({
    careerStatus: "amateur",
    membership: { active: false, monthlyPrice: 110, balance: 75 },
  }));
  const conditionBlocked = gymView.renderMenu("ring", baseContext({
    careerStatus: "amateur",
    condition: {
      energy: 80,
      fatigue: 20,
      trainingBlocked: true,
      trainingBlockedReason: "La fatigue est trop élevée pour un sparring.",
    },
  }));

  assert.match(membershipBlocked, /data-career-sparring-state="membership"/);
  assert.match(membershipBlocked, /Abonnement requis/);
  assert.match(conditionBlocked, /data-career-sparring-state="unavailable"/);
  assert.match(conditionBlocked, /La fatigue est trop élevée/);
  assert.match(conditionBlocked, /data-career-sparring-activity="cta"[^>]+aria-disabled="true"[^>]+aria-describedby="career-gym-sparring-reason"/);
});

test("présente le sparring amateur immédiat comme non rejouable et le bloque en semaine de combat", () => {
  const resumed = gymView.renderMenu("ring", baseContext({
    careerStatus: "amateur",
    sparring: { available: true, planned: true, immediate: true, cost: 18 },
  }));
  const completed = gymView.renderMenu("ring", baseContext({
    careerStatus: "amateur",
    sparring: { available: false, completed: true, immediate: true, cost: 18 },
  }));
  const fightWeek = gymView.renderMenu("ring", baseContext({
    careerStatus: "amateur",
    sparring: {
      available: false,
      immediate: true,
      fightWeek: true,
      cost: 18,
      reason: "Le sparring n’est pas disponible pendant une semaine de combat officiel.",
    },
  }));

  assert.match(resumed, /Énergie déjà consommée/);
  assert.match(resumed, />Reprendre le sparring<\/button>/);
  assert.match(completed, /data-career-sparring-state="completed"/);
  assert.match(completed, /18 points de capacité hebdomadaire ont déjà été consommés/);
  assert.match(completed, />Sparring terminé<\/button>/);
  assert.match(fightWeek, /data-career-sparring-state="fight-week"/);
  assert.match(fightWeek, /Semaine de combat/);
  assert.match(fightWeek, /semaine de combat officiel/);
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
  assert.match(html, /Utilise le bouton <strong>Accueil<\/strong> dans le GYM pour t’inscrire/);
  assert.match(html, /data-career-gym-zone="reception"/);
  assert.match(html, /sac au sous-sol reste accessible à la maison/);

  for (const zone of gymView.ZONES.filter(item => !["reception", "ring"].includes(item.id))) {
    assert.match(html, new RegExp(`data-career-gym-zone="${zone.id}"[^>]+aria-disabled="true"`));
    const openingTag = html.match(new RegExp(`<button[^>]+data-career-gym-zone="${zone.id}"[^>]*>`))[0];
    assert.doesNotMatch(openingTag, /\sdisabled(?:\s|>)/);
  }
  assert.match(html, /data-career-gym-zone="ring"[^>]+disabled[^>]+aria-disabled="true"/);
  assert.doesNotMatch(html, /data-career-gym-zone="reception"[^>]+aria-disabled/);
  assert.doesNotMatch(html, /data-career-coach-session|data-career-compose-session/);
  assert.match(gymView.renderMenu("coach", baseContext({ membership: { active: false, monthlyPrice: 110, balance: 75 } })), /data-career-coach-session[^>]+disabled[^>]+aria-disabled="true"/);

  const composer = gymView.renderComposer(baseContext({ membership: { active: false, monthlyPrice: 110, balance: 75 } }));
  assert.match(composer, /Inscription requise/);
  assert.equal((composer.match(/class="career-exercise-choice[^>]+disabled/g) || []).length, gymView.EXERCISES.length);
  assert.match(composer, /data-career-confirm-session[^>]+disabled/);
});

test("le compositeur est libre et sa limite visible devient l'énergie disponible", () => {
  const context = baseContext({
    selectedExercises: ["jump-rope", "mitt-work", "sparring", "<script>", "heavy-bag", "shadow-boxing", "defense", "cooldown"],
    draftDurationMinutes: 115,
    draftWeekCost: 21,
  });
  const normalized = gymView.normalizeContext(context);
  const html = gymView.renderComposer(context);

  assert.deepEqual(normalized.selectedExercises, ["jump-rope", "mitt-work", "heavy-bag", "shadow-boxing", "defense", "cooldown"]);
  assert.match(html, /6 activités/);
  assert.match(html, /Durée prévue : 115 min/);
  assert.match(html, /Capacité restante de la semaine/);
  assert.match(html, /coût estimé 21/);
  assert.match(html, /Énergie après : 60 %/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /data-career-exercise="sparring"|Ring et sparring|Mise en situation contrôlée/);
  assert.equal((html.match(/class="career-exercise-choice/g) || []).length, gymView.EXERCISES.length);
  assert.match(html, /data-career-confirm-session/);
  assert.doesNotMatch(html, /data-career-confirm-session disabled/);
  assert.match(gymView.renderComposer(baseContext({ selectedExercises: ["mitt-work"] })), /data-career-confirm-session disabled/);
  assert.equal((html.match(/data-career-session-preset=/g) || []).length, gymView.PRESETS.length);

  const lowEnergy = gymView.renderComposer(baseContext({
    condition: { energy: 5, fatigue: 12 },
    selectedExercises: ["shadow-boxing"],
    draftDurationMinutes: 20,
  }));
  assert.match(lowEnergy, /data-career-exercise="heavy-bag"[^>]+disabled/);
  assert.match(lowEnergy, /Énergie après : 1 %/);
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

test("affiche les activités du GYM planifiées avec un retrait direct", () => {
  const html = gymView.render(baseContext({
    coach: { planned: true },
    weekPlan: { entries: [{ id: "boxing-1", label: "Travail aux mitaines", supplementLabel: "Boisson sportive", cost: 9, removable: true }] },
  }));

  assert.match(html, /Programme de la semaine/);
  assert.match(html, /career-place-week-plan/);
  assert.match(html, /Supplément : Boisson sportive/);
  assert.match(html, /data-career-location-remove="boxing-1"/);
  assert.match(gymView.renderMenu("coach", baseContext({ coach: { planned: true } })), /data-career-coach-session aria-pressed="true"[^>]*>Retirer de ma semaine/);
});

test("rend une condition insuffisante visible et bloque les zones d’entraînement", () => {
  const html = gymView.render(baseContext({
    careerStatus: "amateur",
    condition: {
      energy: 85,
      fatigue: 12,
      trainingBlocked: true,
      trainingBlockedReason: "La réserve physique est critique.",
    },
    coach: {
      name: "Coach",
      available: false,
      notice: "La réserve physique est critique.",
    },
  }));

  assert.match(html, /La réserve physique est critique/);
  assert.match(html, /data-career-gym-zone="training"[^>]+disabled[^>]+aria-disabled="true"/);
  assert.doesNotMatch(html, /data-career-gym-zone="reception"[^>]+disabled/);
  assert.match(gymView.renderMenu("coach", baseContext({
    careerStatus: "amateur",
    condition: { trainingBlocked: true, trainingBlockedReason: "La réserve physique est critique." },
    coach: { available: false },
  })), /data-career-coach-session[^>]+disabled[^>]+aria-disabled="true"/);
});
