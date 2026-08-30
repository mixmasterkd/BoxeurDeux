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
    amateurRecord: { wins: 0, losses: 0, draws: 0 },
    energy: 80,
    fatigue: 15,
    injury: 0,
    injuryWeeks: 0,
    profile: { firstName: "Alex" },
    ...overrides,
  };
}

test("calcule la préparation avec l'énergie et la fatigue en ignorant les blessures V1", () => {
  assert.deepEqual(world.preparation(baseCareer({ energy: 100, fatigue: 0, injury: 0 })), {
    label: "Très bonne",
    tone: "positive",
    detail: "Le corps est frais et disponible pour une séance productive.",
  });
  assert.equal(world.preparation(baseCareer({ energy: 80, fatigue: 30, injury: 0 })).label, "Très bonne");
  assert.equal(world.preparation(baseCareer({ energy: 60, fatigue: 30, injury: 10 })).label, "Correcte");
  assert.equal(world.preparation(baseCareer({ energy: -50, fatigue: 500, injury: 500 })).label, "Fragile");

  const legacyInjury = world.preparation(baseCareer({ energy: 100, injury: 100, injuryWeeks: 2 }));
  assert.equal(legacyInjury.label, "Très bonne");
  assert.doesNotMatch(legacyInjury.detail, /bless|médical/i);
});

test("guide le parcours récréatif sans masquer les étapes obligatoires", () => {
  assert.deepEqual(world.objective(baseCareer({ jobId: null, jobsHeldCount: 0 })), {
    title: "Choisir un emploi",
    detail: "Ton premier revenu finance le GYM et le début du parcours.",
    locationId: "work",
  });
  assert.equal(world.objective(baseCareer({ gymWeeks: 0 })).title, "Entrer au GYM de boxe");
  assert.match(world.objective(baseCareer({ recreationalTrainingWeeks: 4 })).detail, /4 entraînements complétés/);
  assert.equal(world.objective(baseCareer({ recreationalSparringStatus: "ready" })).title, "Sparring avec Rémy");
  assert.equal(world.objective(baseCareer({
    scheduledFight: { isRecreationalSparring: true },
  })).title, "Sparring avec Rémy");
  assert.equal(world.objective(baseCareer({ recreationalSparringStatus: "completed" })).title, "Statut amateur obtenu");
});

test("donne priorité à l'étape déterministe du nouveau tutoriel", () => {
  const career = baseCareer({
    jobId: null,
    v2Job: null,
    jobsHeldCount: 0,
    gymWeeks: 0,
    v2Onboarding: { mode: "guided", week: 3, remyWeek: 6 },
    v2OnboardingStep: {
      id: "week-3-skip-work",
      type: "work-priority",
      title: "Libérer du temps d’entraînement",
      detail: "Une absence réelle libère de la capacité.",
      locationId: "work",
      required: false,
    },
  });
  const current = world.objective(career);

  assert.equal(current.id, "week-3-skip-work");
  assert.equal(current.title, "Libérer du temps d’entraînement");
  assert.equal(current.locationId, "work");
  assert.equal(current.required, false);
  assert.equal(current.onboarding, true);
  assert.equal(current.week, 3);
  assert.equal(current.remyWeek, 6);
});

test("affiche textuellement le caractère obligatoire ou facultatif et la progression vers Rémy", () => {
  const common = {
    v2Onboarding: { mode: "guided", week: 1, remyWeek: 6 },
    v2OnboardingStep: {
      id: "choose-initial-job",
      type: "job",
      title: "Choisir ton emploi de départ",
      detail: "La fenêtre reste ouverte jusqu’au choix.",
      locationId: "work",
      required: true,
    },
  };
  const required = world.render(baseCareer(common));

  assert.match(required, /data-v2-onboarding-step="choose-initial-job"/);
  assert.match(required, /Guide récréatif/);
  assert.match(required, /v2-objective-requirement required">Obligatoire/);
  assert.match(required, /Semaine 1/);
  assert.match(required, /Rémy · semaine 6/);
  assert.match(required, /<progress max="6" value="1">1\/6<\/progress>/);
  assert.match(required, /aria-label="Parcours guidé : semaine 1 sur 6 avant le sparring de Rémy"/);
  assert.match(required, /data-v2-location="work">M’y rendre/);

  const optional = world.render(baseCareer({
    ...common,
    v2Onboarding: { mode: "guided", week: 4, remyWeek: 6 },
    v2OnboardingStep: { ...common.v2OnboardingStep, id: "week-4-roadwork", required: false },
  }));
  assert.match(optional, /v2-objective-requirement optional">Facultatif/);
  assert.match(optional, /<progress max="6" value="4">4\/6<\/progress>/);
});

test("conserve la même étape du guide et adapte seulement l’instruction au lieu actuel", () => {
  const career = baseCareer({
    gymWeeks: 0,
    v2Onboarding: { mode: "guided", week: 1, remyWeek: 6 },
    v2OnboardingStep: {
      id: "purchase-initial-membership",
      type: "membership",
      title: "T’inscrire au GYM de boxe",
      detail: "Le premier abonnement est obligatoire.",
      locationId: "boxing-gym",
      required: true,
    },
  });
  const map = world.renderLocationGuide(career, "map");
  const gym = world.renderLocationGuide(career, "boxing-gym");
  const home = world.renderLocationGuide(career, "home");
  const work = world.renderLocationGuide(career, "work");

  for (const html of [map, gym, home, work]) {
    assert.match(html, /data-v2-onboarding-step="purchase-initial-membership"/);
    assert.match(html, /T’inscrire au GYM de boxe/);
  }
  assert.match(map, /Sur la carte, appuie sur « GYM de boxe »/);
  assert.match(map, /data-v2-location="boxing-gym">M’y rendre/);
  assert.match(gym, /Dans le GYM, appuie sur « Accueil »/);
  assert.match(gym, /data-v2-gym-zone="reception">Aller à l’accueil/);
  assert.match(home, /Retourne à la carte, puis appuie sur « GYM de boxe »/);
  assert.match(home, /data-v2-location="boxing-gym">M’y rendre/);
  assert.match(work, /Retourne à la carte, puis appuie sur « GYM de boxe »/);
});

test("propose de revoir ou confirmer la première semaine une fois la séance planifiée", () => {
  const html = world.render(baseCareer({
    v2Onboarding: { mode: "guided", week: 1, remyWeek: 6 },
    v2OnboardingStep: {
      id: "week-1-review-program",
      type: "review-week",
      title: "Ta première séance est planifiée",
      detail: "Rien n’est encore appliqué.",
      locationId: "map",
      required: false,
      actionMode: "review-and-confirm",
    },
  }));

  assert.match(html, /data-v2-week-handoff>Confirmer semaine/);
  assert.doesNotMatch(html, /data-v2-week-confirm/);
  assert.doesNotMatch(html, /data-v2-location="map"/);
});

test("guide la journée de repos depuis la maison avec la même action que la zone repos", () => {
  const career = baseCareer({
    v2Onboarding: { mode: "guided", week: 1, remyWeek: 6 },
    v2OnboardingStep: {
      id: "week-1-add-rest",
      type: "recovery",
      title: "Prévoir une journée de repos",
      detail: "Équilibre entraînement et récupération.",
      locationId: "home",
      required: false,
    },
  });
  const map = world.renderLocationGuide(career, "map");
  const home = world.renderLocationGuide(career, "home");

  assert.match(map, /Sur la carte, appuie sur « Maison »/);
  assert.match(map, /data-v2-location="home">M’y rendre/);
  assert.match(home, /À la maison, appuie sur « Journée de repos »/);
  assert.match(home, /data-v2-home-action="rest">Ajouter une journée de repos/);
});

test("réutilise les vraies commandes pour le plan rapide, le travail, la course et le renouvellement", () => {
  const cases = [
    {
      locationId: "home",
      step: { id: "week-2-follow-plan", type: "plan-quick", title: "Suivre un plan", detail: "Prépare un plan.", locationId: "map", actionMode: "quick-plan" },
      expected: /data-v2-week-quick>Suivre le plan rapide/,
    },
    {
      locationId: "work",
      step: { id: "week-3-skip-work", type: "work-priority", title: "Libérer du temps", detail: "Aucune paie.", locationId: "work" },
      expected: /data-v2-toggle-work aria-pressed="true">Ne pas travailler cette semaine/,
    },
    {
      locationId: "home",
      step: { id: "week-4-add-roadwork", type: "roadwork", title: "Tester la course", detail: "Court jog.", locationId: "home" },
      expected: /data-v2-home-menu="running">Ouvrir le menu Course/,
    },
    {
      locationId: "boxing-gym",
      step: { id: "week-5-renew-membership", type: "membership-renewal", title: "Renouveler", detail: "Paie le forfait.", locationId: "boxing-gym" },
      expected: /data-v2-gym-zone="reception">Renouveler à l’accueil/,
    },
  ];

  for (const item of cases) {
    const html = world.renderLocationGuide(baseCareer({
      v2Onboarding: { mode: "guided", week: Number(item.step.id.match(/week-(\d+)/)?.[1] || 2), remyWeek: 6 },
      v2OnboardingStep: { ...item.step, required: false },
    }), item.locationId);
    assert.match(html, item.expected);
  }
});

test("ignore une étape terminée ou exemptée et conserve les anciens contextes", () => {
  const oldContext = baseCareer({ recreationalTrainingWeeks: 4 });
  assert.equal(world.onboardingObjective(oldContext), null);
  assert.equal(world.objective(oldContext).title, "Bâtir tes bases");
  assert.doesNotMatch(world.render(oldContext), /v2-onboarding-card/);

  const completed = baseCareer({
    careerStatus: "amateur",
    v2Onboarding: { mode: "complete", week: 6, remyWeek: 6 },
    v2OnboardingStep: {
      id: "onboarding-complete",
      type: "complete",
      title: "Parcours terminé",
      locationId: "map",
    },
  });
  assert.equal(world.objective(completed).title, "Choisir la prochaine occasion");
});

test("échappe les données du tutoriel et corrige une destination inconnue", () => {
  const career = baseCareer({
    v2Onboarding: { mode: "guided", week: 2, remyWeek: 6 },
    v2OnboardingStep: {
      id: 'guide"><script>boom()</script>',
      type: "objective",
      title: '<img src=x onerror="boom()">',
      detail: "<b>danger</b>",
      locationId: 'work" onclick="boom()',
      required: false,
    },
  });
  const current = world.objective(career);
  const html = world.render(career);

  assert.equal(current.locationId, "boxing-gym");
  assert.doesNotMatch(html, /<script>|<img src=x|onclick=/);
  assert.match(html, /&lt;img src=x onerror=&quot;boom\(\)&quot;&gt;/);
  assert.match(html, /&lt;b&gt;danger&lt;\/b&gt;/);
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
  assert.equal(world.locationStatus(world.LOCATIONS.find(location => location.id === "strength-gym"), baseCareer()), "Verrouillé · amateur requis");
  assert.equal(world.locationStatus(world.LOCATIONS.find(location => location.id === "strength-gym"), baseCareer({ careerStatus: "amateur" })), "Abonnement facultatif");
  assert.deepEqual(world.locationAccess("strength-gym", baseCareer()), {
    locked: true,
    reason: "Disponible après le passage amateur.",
  });
  assert.equal(world.locationAccess("arena", baseCareer()).locked, true);
  assert.equal(world.locationAccess("home", baseCareer()).locked, false);
  assert.equal(world.locationAccess("strength-gym", baseCareer({ careerStatus: "amateur" })).locked, false);
});

test("oriente le début amateur puis retire le tutoriel après le premier résultat officiel", () => {
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

  for (const amateurRecord of [
    { wins: 1, losses: 0, draws: 0 },
    { wins: 0, losses: 1, draws: 0 },
    { wins: 0, losses: 0, draws: 1 },
  ]) {
    const experienced = { ...amateur, amateurRecord, scheduledFight: { week: 12 } };
    assert.equal(world.objective(experienced), null);
    assert.doesNotMatch(world.render(experienced), /v2-objective-card|Prochaine étape/);
    assert.doesNotMatch(world.renderLocation("arena", experienced), /Destination recommandée/);
  }

  assert.equal(world.objective({ ...amateur, careerStatus: "professional" }), null);
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
  assert.match(html, /class="v2-side-stack">\s*<header class="v2-world-bar">/);
  assert.match(html, /<nav[^>]+aria-label="Navigation principale V2"/);
  assert.match(html, /data-v2-primary-navigation data-v2-navigation-view="map"/);
  assert.match(html, /class="active" aria-current="page" type="button" data-v2-nav="map"/);
  assert.match(html, /data-v2-nav="calendar">Calendrier/);
  assert.match(html, /<section class="v2-location-sheet" role="dialog" aria-modal="true" aria-label="Lieu du quartier" tabindex="-1" hidden>/);
  assert.equal((html.match(/<button\b/g) || []).length, 11);
  assert.equal((html.match(/<button\b[^>]*\btype="button"/g) || []).length, 11);
  assert.equal((html.match(/class="v2-map-hotspot"/g) || []).length, 5);
  assert.equal((html.match(/data-v2-locked="true"/g) || []).length, 2);
  assert.match(html, /data-v2-location="strength-gym"[^>]+disabled aria-disabled="true"/);
  assert.match(html, /data-v2-location="arena"[^>]+disabled aria-disabled="true"/);
  assert.match(html, /Accès verrouillé : Gym de musculation\. Disponible après le passage amateur\./);
  assert.match(html, /Accès verrouillé : Aréna\. Disponible après le passage amateur\./);
});

test("rend les quatre états du menu principal avec une seule vue active", () => {
  for (const active of ["map", "calendar", "fighter", "inventory"]) {
    const html = world.renderNavigation(active);
    assert.equal((html.match(/data-v2-nav=/g) || []).length, 4);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    assert.match(html, new RegExp(`data-v2-navigation-view="${active}"`));
    assert.match(html, new RegExp(`aria-current="page" type="button" data-v2-nav="${active}"`));
  }
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
  const arena = world.renderLocation("arena", baseCareer({ careerStatus: "amateur" }));
  assert.match(arena, /data-v2-open-calendar>Ouvrir le calendrier/);
  assert.doesNotMatch(arena, /sera branché|prochaine étape de la V2/i);
  assert.equal(world.renderLocation("does-not-exist", career), "");
});

test("masque les fonctions de travail incomplètes", () => {
  const career = baseCareer({ careerStatus: "recreational" });
  const work = world.renderLocation("work", career);
  const gym = world.renderLocation("boxing-gym", career);

  assert.doesNotMatch(work, /data-v2-developer-secret/);
  assert.doesNotMatch(work, /Vente de stupéfiants|mini-jeu|À venir/i);
  assert.match(work, /Emploi actuel/);
  assert.match(work, /data-v2-open-job-menu/);
  assert.match(work, /data-v2-toggle-work/);
  assert.match(work, /Retirer le travail de ma semaine/);
  assert.match(work, /travail est prévu cette semaine/);
  assert.match(work, /Le salaire affiché est hebdomadaire/);
  assert.doesNotMatch(gym, /data-v2-developer-secret/);
});

test("garde le travail proposé par défaut tout en permettant de le retirer", () => {
  const work = world.renderLocation("work", baseCareer({
    v2WorkCompleted: true,
    v2WorkAvailable: false,
    v2WorkBlockReason: "Travail fait cette semaine · paie hebdomadaire versée.",
  }));

  assert.match(work, /Le travail est prévu cette semaine/);
  assert.match(work, /Retirer le travail de ma semaine/);
  assert.match(work, /data-v2-toggle-work[^>]+aria-pressed="true">Retirer le travail de ma semaine/);
  assert.doesNotMatch(work, /Travail fait · paie versée/);
});

test("met l'argent en évidence dans la barre de semaine", () => {
  const html = world.render(baseCareer({ money: 432 }));
  assert.match(html, /class="v2-now-money"[^>]*>432 \$<\/b>/);
  assert.match(html, /aria-label="Argent disponible 432 \$"/);
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
  assert.match(work, /inclus par défaut dans chaque semaine/);
});

test("montre une candidature automatique et le nombre de semaines restantes", () => {
  const work = world.renderLocation("work", baseCareer({
    jobId: null,
    v2Job: null,
    jobsHeldCount: 1,
    jobApplication: { jobId: "warehouse", progress: 1, requiredWeeks: 3 },
    v2JobApplicationLabel: "Manutention de nuit",
  }));

  assert.match(work, /Candidature en cours/);
  assert.match(work, /Manutention de nuit/);
  assert.match(work, /2 semaines/);
  assert.match(work, /progress max="3" value="1"/);
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
