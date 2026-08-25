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
      { id: "convenience", title: "Commis de dépanneur", wage: 75, schedule: "Horaire souple" },
      { id: "courier", title: "Coursier local", wage: 100, schedule: "Horaire variable" },
      { id: "office", title: "Employé de bureau", wage: 120, schedule: "Bureau · longues heures" },
      { id: "warehouse", title: "Manutention de nuit", wage: 130, schedule: "Horaire exigeant" },
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
  assert.match(html, /data-v2-work-zone="mini-game" aria-disabled="true"/);
  assert.match(html, /data-v2-leave-work>Retour à la carte/);
  assert.match(html, /120 \$/);
  assert.match(html, /30 énergie/);
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

test("garde la bascule hebdomadaire dans le menu Horaire", () => {
  const html = work.renderMenu("schedule", activeContext({ v2WorkPlan: { planned: false, cost: 30 } }));

  assert.match(html, /Horaire de la semaine/);
  assert.match(html, /aucune paie/);
  assert.match(html, /data-v2-toggle-work aria-pressed="false">Ajouter le travail à ma semaine/);
  assert.match(html, /data-v2-work-menu-close>Retour à l’emploi/);
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
