"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const world = require("../v2-world.js");

function baseCareer(overrides = {}) {
  return {
    week: 1,
    careerStatus: "recreational",
    jobId: "courier",
    v2Job: { id: "courier", title: "Coursier à vélo", wage: 100, schedule: "Quart variable" },
    introJobRequired: true,
    jobsHeldCount: 1,
    gymWeeks: 1,
    strengthGymWeeks: 0,
    recreationalTrainingWeeks: 2,
    recreationalSparringStatus: "locked",
    energy: 80,
    fatigue: 15,
    injury: 0,
    injuryWeeks: 0,
    profile: { firstName: "Alex" },
    ...overrides,
  };
}

test("calcule une préparation qualitative bornée et donne priorité à une blessure", () => {
  assert.deepEqual(world.preparation(baseCareer({ energy: 100, fatigue: 0, injury: 0 })), {
    label: "Très bonne",
    tone: "positive",
    detail: "Le corps est frais et disponible pour une séance productive.",
  });
  assert.equal(world.preparation(baseCareer({ energy: 80, fatigue: 30, injury: 0 })).label, "Très bonne");
  assert.equal(world.preparation(baseCareer({ energy: 60, fatigue: 30, injury: 10 })).label, "Correcte");
  assert.equal(world.preparation(baseCareer({ energy: -50, fatigue: 500, injury: 500 })).label, "Fragile");

  const injured = world.preparation(baseCareer({ energy: 100, injuryWeeks: 2 }));
  assert.equal(injured.label, "Blessé");
  assert.match(injured.detail, /2 semaines/);
});

test("guide le parcours récréatif sans masquer les étapes obligatoires", () => {
  assert.deepEqual(world.objective(baseCareer({ jobId: null, jobsHeldCount: 0 })), {
    title: "Choisir un emploi",
    detail: "Ton premier revenu finance le GYM et le début du parcours.",
    locationId: "work",
  });
  assert.equal(world.objective(baseCareer({ gymWeeks: 0 })).title, "Entrer au GYM de boxe");
  assert.match(world.objective(baseCareer({ recreationalTrainingWeeks: 4 })).detail, /4\/10 entraînements/);
  assert.equal(world.objective(baseCareer({ recreationalSparringStatus: "ready" })).title, "Sparring avec Rémy");
  assert.equal(world.objective(baseCareer({
    scheduledFight: { isRecreationalSparring: true },
  })).title, "Sparring avec Rémy");
  assert.equal(world.objective(baseCareer({ recreationalSparringStatus: "completed" })).title, "Passer amateur");
});

test("rend l’emploi facultatif après un premier poste et n’invente aucun quart", () => {
  const firstJob = baseCareer({ jobId: null, jobsHeldCount: 0 });
  assert.equal(world.locationStatus(world.LOCATIONS.find(location => location.id === "work"), firstJob), "Premier emploi requis");

  const afterJobLoss = baseCareer({ jobId: null, jobsHeldCount: 1 });
  assert.equal(world.locationStatus(world.LOCATIONS.find(location => location.id === "work"), afterJobLoss), "Facultatif");
  assert.notEqual(world.objective(afterJobLoss).locationId, "work");
  assert.equal(world.nextAppointment(baseCareer()), "Aucun rendez-vous confirmé");

  assert.equal(world.nextAppointment(baseCareer({
    v2Clock: { absoluteSlot: 4 },
    v2Appointments: [
      { title: "Ancien quart", startSlot: 2 },
      { title: "Quart du dépanneur", startSlot: 7 },
    ],
  })), "Quart du dépanneur");
  assert.equal(world.locationStatus(world.LOCATIONS.find(location => location.id === "boxing-gym"), baseCareer({ gymWeeks: 0 })), "Inscription requise");
});

test("oriente le boxeur amateur vers le gala ou le tournoi pertinent", () => {
  const amateur = baseCareer({ careerStatus: "amateur" });
  assert.equal(world.objective(amateur).title, "Choisir la prochaine occasion");

  const scheduled = world.objective({ ...amateur, scheduledFight: { week: 12 } });
  assert.equal(scheduled.title, "Préparer le prochain combat");
  assert.match(scheduled.detail, /semaine 12/);
  assert.equal(scheduled.locationId, "arena");

  const tournament = world.objective({
    ...amateur,
    scheduledFight: { week: 12 },
    activeTournament: { id: "bronze" },
  });
  assert.equal(tournament.title, "Tournoi en cours");
  assert.equal(tournament.locationId, "arena");
});

test("rend les cinq destinations et les deux compositions illustrées avec de vrais boutons", () => {
  const html = world.render(baseCareer());

  assert.equal(world.LOCATIONS.length, 5);
  for (const location of world.LOCATIONS) {
    assert.match(html, new RegExp(`data-v2-location="${location.id}"`));
    assert.match(html, new RegExp(location.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(html, /<picture>/);
  assert.match(html, /srcset="assets\/carte-quartier-v2-mobile\.jpg"/);
  assert.match(html, /src="assets\/carte-quartier-v2-desktop\.jpg"/);
  assert.match(html, /<nav[^>]+aria-label="Navigation principale V2"/);
  assert.match(html, /<section class="v2-location-sheet" role="dialog" aria-modal="true" aria-label="Lieu du quartier" tabindex="-1" hidden>/);
  assert.equal((html.match(/<button\b/g) || []).length, 11);
  assert.equal((html.match(/<button\b[^>]*\btype="button"/g) || []).length, 11);
  assert.equal((html.match(/class="v2-map-hotspot"/g) || []).length, 5);
});

test("échappe les données de sauvegarde avant de les insérer dans le HTML", () => {
  const html = world.render(baseCareer({
    careerStatus: "amateur",
    profile: { firstName: '<img src=x onerror="alert(1)">' },
    scheduledFight: { week: '<script data-owned="yes">boom()</script>' },
  }));

  assert.doesNotMatch(html, /<script data-owned=/);
  assert.doesNotMatch(html, /<img src=x onerror=/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html, /&lt;script data-owned=&quot;yes&quot;&gt;boom\(\)&lt;\/script&gt;/);
});

test("rend une fiche de lieu accessible et refuse une destination inconnue", () => {
  const career = baseCareer();
  const gym = world.renderLocation("boxing-gym", career);

  assert.match(gym, /class="v2-location-card"/);
  assert.match(gym, /data-location="boxing-gym"/);
  assert.match(gym, /Destination recommandée/);
  assert.match(gym, /Séance du coach/);
  assert.match(gym, /<button\b[^>]*type="button"[^>]*data-v2-close-location/);
  assert.match(gym, />Retour à la carte<\/button>/);
  assert.equal(world.renderLocation("does-not-exist", career), "");
});

test("place la tuile développeur uniquement dans le lieu Travail", () => {
  const career = baseCareer({ careerStatus: "recreational" });
  const work = world.renderLocation("work", career);
  const gym = world.renderLocation("boxing-gym", career);

  assert.match(work, /data-v2-developer-secret/);
  assert.match(work, /Vente de stupéfiants/);
  assert.match(work, /À venir/);
  assert.match(work, /aria-label="Vente de stupéfiants — À venir"/);
  assert.match(work, /Emploi actuel/);
  assert.match(work, /data-v2-open-job-menu/);
  assert.match(work, /data-v2-work-shift/);
  assert.match(work, /Faire mon quart · \+100 \$/);
  assert.doesNotMatch(gym, /data-v2-developer-secret/);
});

test("confirme visuellement un quart déjà payé sans offrir un deuxième salaire", () => {
  const work = world.renderLocation("work", baseCareer({
    v2WorkCompleted: true,
    v2WorkAvailable: false,
    v2WorkBlockReason: "Quart terminé cette semaine · paie versée.",
  }));

  assert.match(work, /Quart terminé cette semaine · paie versée/);
  assert.match(work, /disabled aria-disabled="true">Quart terminé · paie versée/);
  assert.doesNotMatch(work, /data-v2-work-shift/);
});

test("rend l’emploi de départ comme une étape explicite et immédiate", () => {
  const work = world.renderLocation("work", baseCareer({
    jobId: null,
    jobsHeldCount: 0,
    v2Job: null,
  }));

  assert.match(work, /Étape obligatoire/);
  assert.match(work, /Choisis ton premier emploi/);
  assert.match(work, />Choisir mon emploi<\/button>/);
  assert.match(work, /inclus dans chaque semaine rapide/);
});

test("signale clairement un profil de test et offre le retour à la carrière", () => {
  const html = world.render(baseCareer({
    profile: { firstName: "Alex", lastName: '<Test & Co>' },
    v2DeveloperTest: { active: true, canReturn: true, profileLabel: 'Alex <Test & Co>' },
  }));

  assert.match(html, /class="v2-test-mode-banner"/);
  assert.match(html, /Mode test actif/);
  assert.match(html, /Ta vraie carrière reste conservée séparément/);
  assert.match(html, /data-v2-restore-career/);
  assert.match(html, /Alex &lt;Test &amp; Co&gt;/);
  assert.doesNotMatch(html, /Alex <Test & Co>/);
});
