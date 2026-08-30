"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const work = require("../v2-work-view.js");

function activeContext(overrides = {}) {
  return {
    profile: { firstName: "Alex" },
    week: 3,
    v2Clock: { week: 3, dayLabel: "Mercredi · soir" },
    v2DateLabel: "18 septembre 2026",
    v2Job: {
      id: "office",
      title: "Employé de bureau",
      wage: 120,
      schedule: "Bureau · longues heures",
      detail: "Une paie solide avec de longues journées.",
    },
    v2WorkPlan: { planned: true, cost: 30 },
    v2JobOffers: [
      { id: "convenience", title: "Commis de dépanneur", wage: 75, schedule: "Horaire souple", interviewWeeks: 1, energy: -14, fatigue: 10, weekCapacityCost: 15, detail: "Facile à concilier." },
      { id: "courier", title: "Coursier local", wage: 100, schedule: "Horaire variable", interviewWeeks: 2, energy: -20, fatigue: 16, weekCapacityCost: 22, detail: "Plus de kilomètres." },
      { id: "office", title: "Employé de bureau", wage: 120, schedule: "Bureau · longues heures", interviewWeeks: 2, energy: -14, fatigue: 7, weekCapacityCost: 30, detail: "Longues journées." },
      { id: "warehouse", title: "Manutention de nuit", wage: 130, schedule: "Horaire exigeant", interviewWeeks: 3, energy: -27, fatigue: 23, weekCapacityCost: 30, detail: "Lourde dépense physique." },
    ],
    ...overrides,
  };
}

test("rend un environnement adapté à l’emploi actif avec les zones de travail", () => {
  const html = work.render(activeContext());

  assert.match(html, /class="v2-work-view v2-place-view v2-work-view-office"/);
  assert.match(html, /assets\/emploi-bureau-v2-desktop\.png/);
  assert.match(html, /assets\/emploi-bureau-v2-mobile\.png/);
  assert.match(html, /data-v2-work-zone="schedule"/);
  assert.match(html, /data-v2-work-zone="job"/);
  assert.doesNotMatch(html, /data-v2-work-zone="mini-game"/);
  assert.doesNotMatch(html, /Faire mon emploi/);
  assert.match(html, /data-v2-leave-work>Retour à la carte/);
  assert.match(html, /120 \$/);
  assert.match(html, /30 capacité/);
});

test("affiche le babillard quand aucun emploi n’est actif", () => {
  const html = work.render(activeContext({
    v2Job: null,
    introJobRequired: true,
    jobsHeldCount: 0,
    jobApplication: null,
  }));

  assert.match(html, /v2-work-view-unemployed/);
  assert.match(html, /v2-work-board-scene/);
  assert.match(html, /Ton premier emploi est requis/);
  assert.equal((html.match(/data-v2-work-zone="employment"/g) || []).length, 4);
  assert.doesNotMatch(html, /emploi-bureau-v2-desktop/);
});

test("permet de postuler directement sur le babillard après un emploi perdu", () => {
  const html = work.render(activeContext({
    v2Job: null,
    introJobRequired: false,
    jobsHeldCount: 1,
    jobApplication: null,
  }));

  assert.match(html, /Choisis directement ton prochain emploi/);
  assert.equal((html.match(/data-select-job=/g) || []).length, 4);
  assert.doesNotMatch(html, /data-v2-work-zone="employment"/);
  assert.match(html, /3 semaines d’attente/);
  assert.match(html, /-27 énergie · \+23 fatigue · 30 capacité/);
  assert.match(html, /Lourde dépense physique/);
});

test("identifie la candidature en cours tout en laissant les autres offres disponibles", () => {
  const html = work.render(activeContext({
    v2Job: null,
    introJobRequired: false,
    jobsHeldCount: 1,
    jobApplication: { jobId: "warehouse", progress: 1, requiredWeeks: 3 },
    v2JobApplicationLabel: "Manutention de nuit",
  }));

  assert.match(html, /data-select-job="warehouse" disabled aria-disabled="true"/);
  assert.match(html, /Candidature en cours · 1\/3/);
  assert.match(html, /data-select-job="convenience"/);
  assert.doesNotMatch(html, /data-select-job="convenience" disabled/);
});

test("garde la bascule hebdomadaire dans le menu Horaire", () => {
  const html = work.renderMenu("schedule", activeContext({ v2WorkPlan: { planned: false, cost: 30 } }));

  assert.match(html, /Horaire de la semaine/);
  assert.match(html, /aucune paie/);
  assert.match(html, /data-v2-toggle-work aria-pressed="false">Ajouter le travail à ma semaine/);
  assert.match(html, /data-v2-work-menu-close>Retour à l’emploi/);
});

test("présente les absences injustifiées comme un compteur cumulatif chez l’employeur", () => {
  const html = work.render(activeContext({ missedWorkWeeks: 2 }));

  assert.match(html, /2\/3 absences injustifiées cumulées/);
  assert.match(html, /restent au dossier chez cet employeur/);
  assert.match(html, /la troisième entraîne le congédiement/);
  assert.doesNotMatch(html, /absences consécutives/);
});

test("explique et verrouille le travail quand la capacité ou la condition ne le permet plus", () => {
  const html = work.renderMenu("schedule", activeContext({
    v2WorkPlan: {
      planned: false,
      available: false,
      cost: 30,
      reason: "Après les 21 points déjà occupés, le travail à 30 points ne tient plus dans la semaine.",
    },
  }));

  assert.match(html, /Après les 21 points déjà occupés/);
  assert.match(html, /data-v2-toggle-work[^>]+disabled/);
  assert.match(html, /Travail indisponible cette semaine/);
});

test("échappe les données injectées dans la scène d’emploi", () => {
  const html = work.render(activeContext({
    profile: { firstName: '<img src=x onerror="boom">' },
    v2Job: { id: "office", title: '<script>boom()</script>', wage: 120, schedule: '<b>danger</b>' },
  }));

  assert.doesNotMatch(html, /<script>|<img src=x|<b>danger/);
  assert.match(html, /&lt;script&gt;boom\(\)&lt;\/script&gt;/);
  assert.match(html, /&lt;b&gt;danger&lt;\/b&gt;/);
});
