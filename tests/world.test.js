"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const world = require("../world.js");

function baseCareer(overrides = {}) {
  return {
    week: 1,
    careerStatus: "recreational",
    jobId: "courier",
    careerJob: { id: "courier", title: "Coursier à vélo", wage: 100, schedule: "Quart variable" },
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

test("calcule la préparation avec l'énergie et la fatigue en ignorant les anciennes blessures", () => {
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
    careerJob: null,
    jobsHeldCount: 0,
    gymWeeks: 0,
    careerOnboarding: { mode: "guided", week: 3, remyWeek: 6 },
    careerOnboardingStep: {
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
    careerOnboarding: { mode: "guided", week: 1, remyWeek: 6 },
    careerOnboardingStep: {
      id: "choose-initial-job",
      type: "job",
      title: "Choisir ton emploi de départ",
      detail: "La fenêtre reste ouverte jusqu’au choix.",
      locationId: "work",
      required: true,
    },
  };
  const required = world.render(baseCareer(common));

  assert.match(required, /data-career-onboarding-step="choose-initial-job"/);
  assert.match(required, /Guide récréatif/);
  assert.match(required, /career-objective-requirement required">Obligatoire/);
  assert.match(required, /Semaine 1/);
  assert.match(required, /Rémy · semaine 6/);
  assert.match(required, /<progress max="6" value="1">1\/6<\/progress>/);
  assert.match(required, /aria-label="Parcours guidé : semaine 1 sur 6 avant le sparring de Rémy"/);
  assert.match(required, /data-career-location="work">M’y rendre/);

  const optional = world.render(baseCareer({
    ...common,
    careerOnboarding: { mode: "guided", week: 4, remyWeek: 6 },
    careerOnboardingStep: { ...common.careerOnboardingStep, id: "week-4-roadwork", required: false },
  }));
  assert.match(optional, /career-objective-requirement optional">Facultatif/);
  assert.match(optional, /<progress max="6" value="4">4\/6<\/progress>/);
});

test("conserve la même étape du guide et adapte seulement l’instruction au lieu actuel", () => {
  const career = baseCareer({
    gymWeeks: 0,
    careerOnboarding: { mode: "guided", week: 1, remyWeek: 6 },
    careerOnboardingStep: {
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
    assert.match(html, /data-career-onboarding-step="purchase-initial-membership"/);
    assert.match(html, /T’inscrire au GYM de boxe/);
  }
  assert.match(map, /Sur la carte, appuie sur « GYM de boxe »/);
  assert.match(map, /data-career-location="boxing-gym">M’y rendre/);
  assert.match(gym, /Dans le GYM, appuie sur « Accueil »/);
  assert.match(gym, /data-career-gym-zone="reception">Aller à l’accueil/);
  assert.match(home, /Retourne à la carte, puis appuie sur « GYM de boxe »/);
  assert.match(home, /data-career-location="boxing-gym">M’y rendre/);
  assert.match(work, /Retourne à la carte, puis appuie sur « GYM de boxe »/);
});

test("propose de revoir ou confirmer la première semaine une fois la séance planifiée", () => {
  const html = world.render(baseCareer({
    careerOnboarding: { mode: "guided", week: 1, remyWeek: 6 },
    careerOnboardingStep: {
      id: "week-1-review-program",
      type: "review-week",
      title: "Ta première séance est planifiée",
      detail: "Rien n’est encore appliqué.",
      locationId: "map",
      required: false,
      actionMode: "review-and-confirm",
    },
  }));

  assert.match(html, /data-career-week-handoff>Confirmer semaine/);
  assert.doesNotMatch(html, /data-career-week-confirm/);
  assert.doesNotMatch(html, /data-career-location="map"/);
});

test("guide la journée de repos depuis la maison avec la même action que la zone repos", () => {
  const career = baseCareer({
    careerOnboarding: { mode: "guided", week: 1, remyWeek: 6 },
    careerOnboardingStep: {
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
  assert.match(map, /data-career-location="home">M’y rendre/);
  assert.match(home, /À la maison, appuie sur « Journée de repos »/);
  assert.match(home, /data-career-home-action="rest">Ajouter une journée de repos/);
});

test("réutilise les vraies commandes pour le plan rapide, le travail, la course et le renouvellement", () => {
  const cases = [
    {
      locationId: "home",
      step: { id: "week-2-follow-plan", type: "plan-quick", title: "Suivre un plan", detail: "Prépare un plan.", locationId: "map", actionMode: "quick-plan" },
      expected: /data-career-week-quick>Suivre le plan rapide/,
    },
    {
      locationId: "work",
      step: { id: "week-3-skip-work", type: "work-priority", title: "Libérer du temps", detail: "Aucune paie.", locationId: "work" },
      expected: /data-career-toggle-work aria-pressed="true">Ne pas travailler cette semaine/,
    },
    {
      locationId: "home",
      step: { id: "week-4-add-roadwork", type: "roadwork", title: "Tester la course", detail: "Court jog.", locationId: "home" },
      expected: /data-career-home-menu="running">Ouvrir le menu Course/,
    },
    {
      locationId: "boxing-gym",
      step: { id: "week-5-renew-membership", type: "membership-renewal", title: "Renouveler", detail: "Paie le forfait.", locationId: "boxing-gym" },
      expected: /data-career-gym-zone="reception">Renouveler à l’accueil/,
    },
  ];

  for (const item of cases) {
    const html = world.renderLocationGuide(baseCareer({
      careerOnboarding: { mode: "guided", week: Number(item.step.id.match(/week-(\d+)/)?.[1] || 2), remyWeek: 6 },
      careerOnboardingStep: { ...item.step, required: false },
    }), item.locationId);
    assert.match(html, item.expected);
  }
});

test("ignore une étape terminée ou exemptée et conserve les anciens contextes", () => {
  const oldContext = baseCareer({ recreationalTrainingWeeks: 4 });
  assert.equal(world.onboardingObjective(oldContext), null);
  assert.equal(world.objective(oldContext).title, "Bâtir tes bases");
  assert.doesNotMatch(world.render(oldContext), /career-onboarding-card/);

  const completed = baseCareer({
    careerStatus: "amateur",
    careerOnboarding: { mode: "complete", week: 6, remyWeek: 6 },
    careerOnboardingStep: {
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
    careerOnboarding: { mode: "guided", week: 2, remyWeek: 6 },
    careerOnboardingStep: {
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
    careerClock: { absoluteSlot: 4 },
    careerAppointments: [
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
  const fightGateCareer = baseCareer({ careerStatus: "amateur", careerFightGate: { status: "ready", kind: "gala" } });
  for (const locationId of ["home", "boxing-gym", "strength-gym", "work"]) {
    assert.deepEqual(world.locationAccess(locationId, fightGateCareer), {
      locked: true,
      reason: "Ta semaine est terminée. Règle maintenant le combat à l’aréna.",
    });
  }
  assert.equal(world.locationAccess("arena", fightGateCareer).locked, false);
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
    assert.doesNotMatch(world.render(experienced), /career-objective-card|Prochaine étape/);
    assert.doesNotMatch(world.renderLocation("arena", experienced), /Destination recommandée/);
  }

  assert.equal(world.objective({ ...amateur, careerStatus: "professional" }), null);
});

test("rend les cinq destinations du quartier et la navigation vers le Centre-ville", () => {
  const html = world.render(baseCareer());

  assert.equal(world.LOCATIONS.length, 5);
  for (const location of world.LOCATIONS) {
    assert.match(html, new RegExp(`data-career-location="${location.id}"`));
    assert.match(html, new RegExp(location.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(html, /<picture>/);
  assert.match(html, /srcset="assets\/carte-quartier-v2-mobile\.jpg"/);
  assert.match(html, /src="assets\/carte-quartier-v2-desktop\.jpg"/);
  assert.match(html, /class="career-side-stack">\s*<header class="career-world-bar">/);
  assert.match(html, /<nav[^>]+aria-label="Navigation principale de la carrière"/);
  assert.match(html, /data-career-primary-navigation data-career-navigation-view="map"/);
  assert.match(html, /class="active" aria-current="page" type="button" data-career-nav="map"/);
  assert.match(html, /data-career-nav="calendar">Calendrier/);
  assert.match(html, /<section class="career-location-sheet" role="dialog" aria-modal="true" aria-label="Lieu du quartier" tabindex="-1" hidden>/);
  assert.equal((html.match(/<button\b/g) || []).length, 13);
  assert.equal((html.match(/<button\b[^>]*\btype="button"/g) || []).length, 13);
  assert.equal((html.match(/class="career-map-hotspot"/g) || []).length, 5);
  assert.match(html, /data-career-district-view="neighborhood"/);
  assert.match(html, /aria-label="Choisir une carte"/);
  assert.match(html, /data-career-district="neighborhood"/);
  assert.match(html, /data-career-district="downtown"[^>]+disabled aria-disabled="true"/);
  assert.match(html, /Disponible après ton premier combat amateur officiel/);
  assert.doesNotMatch(html, /Métro/);
  assert.equal((html.match(/data-career-locked="true"/g) || []).length, 2);
  assert.match(html, /data-career-location="strength-gym"[^>]+disabled aria-disabled="true"/);
  assert.match(html, /data-career-location="arena"[^>]+disabled aria-disabled="true"/);
  assert.match(html, /Accès verrouillé : Gym de musculation\. Disponible après le passage amateur\./);
  assert.match(html, /Accès verrouillé : Aréna\. Disponible après le passage amateur\./);
});

test("déverrouille le Centre-ville après un résultat amateur et le referme pendant le verrou de combat", () => {
  const beginner = baseCareer({ careerStatus: "amateur" });
  assert.deepEqual(world.districtAccess("downtown", beginner), {
    locked: true,
    reason: "Disponible après ton premier combat amateur officiel.",
  });
  assert.equal(world.normalizeDistrict("downtown", beginner), "neighborhood");

  for (const amateurRecord of [
    { wins: 1, losses: 0, draws: 0 },
    { wins: 0, losses: 1, draws: 0 },
    { wins: 0, losses: 0, draws: 1 },
  ]) {
    const experienced = { ...beginner, amateurRecord };
    assert.equal(world.districtAccess("downtown", experienced).locked, false);
    assert.equal(world.normalizeDistrict("downtown", experienced), "downtown");
  }

  assert.equal(world.districtAccess("downtown", { ...beginner, careerStatus: "professional" }).locked, false);
  const fightGate = {
    ...beginner,
    amateurRecord: { wins: 1, losses: 0, draws: 0 },
    careerFightGate: { status: "ready", kind: "gala" },
  };
  assert.deepEqual(world.districtAccess("downtown", fightGate), {
    locked: true,
    reason: "Ta semaine est terminée. Règle maintenant le combat à l’aréna.",
  });
  assert.equal(world.normalizeDistrict("downtown", fightGate), "neighborhood");
});

test("intègre le Centre-ville avec les loisirs, le Studio média et la Fédération ouverts", () => {
  const career = baseCareer({
    careerStatus: "amateur",
    amateurRecord: { wins: 0, losses: 1, draws: 0 },
  });
  const html = world.render(career, { district: "downtown" });

  assert.match(html, /data-career-district-view="downtown"/);
  assert.match(html, /srcset="assets\/carte-centre-ville-mobile\.jpg"/);
  assert.match(html, /src="assets\/carte-centre-ville-desktop\.jpg"/);
  assert.match(html, /Carte illustrée du Centre-ville avec le Centre de loisirs, le Studio média, la Fédération et l’aéroport/);
  assert.doesNotMatch(html, /Métro/);
  assert.equal(world.DOWNTOWN_LOCATIONS.length, 4);
  assert.equal((html.match(/class="career-map-hotspot career-downtown-hotspot"/g) || []).length, 4);
  assert.equal((html.match(/data-career-downtown-location=/g) || []).length, 4);
  assert.equal((html.match(/data-career-locked="true"/g) || []).length, 1);
  assert.equal((html.match(/disabled aria-disabled="true"/g) || []).length, 1);
  assert.equal((html.match(/data-career-location=/g) || []).length, 3);
  assert.doesNotMatch(html, /carte-quartier-v2-(?:mobile|desktop)\.jpg/);
  assert.doesNotMatch(html, /career-downtown-placeholder|Visuel de la carte à venir/);
  assert.match(html, /data-career-downtown-location="leisure-center" data-career-location="leisure-center"/);
  assert.match(html, /Entrer : Centre de loisirs\. Quilles, arcade, cinéma et karting\./);
  assert.match(html, /data-career-downtown-location="media-studio" data-career-location="media-studio"/);
  assert.match(html, /Entrer : Studio média\. Entrevue, séance photo, balado et apparition publique\./);
  assert.equal((html.match(/<small>Ouvert<\/small>/g) || []).length, 2);
  assert.match(html, /Entrer : Fédération\. Dossier amateur, parcours des tournois et annuaire des affiliés\./);
  assert.match(html, /Accès verrouillé : Aéroport\. Disponible au statut professionnel\./);
  assert.match(html, /data-career-primary-navigation/);
  assert.match(html, /class="career-side-stack"/);
});

test("ouvre les lieux actifs seulement lorsque le Centre-ville est accessible", () => {
  const beginner = baseCareer({
    careerStatus: "amateur",
    amateurRecord: { wins: 0, losses: 0, draws: 0 },
  });
  const experienced = baseCareer({
    careerStatus: "amateur",
    amateurRecord: { wins: 1, losses: 0, draws: 0 },
  });
  const fightGate = baseCareer({
    careerStatus: "amateur",
    amateurRecord: { wins: 1, losses: 0, draws: 0 },
    careerFightGate: { status: "ready", kind: "gala" },
  });

  assert.deepEqual(world.locationAccess("leisure-center", beginner), {
    locked: true,
    status: "Centre-ville verrouillé",
    reason: "Disponible après ton premier combat amateur officiel.",
  });
  assert.deepEqual(world.locationAccess("leisure-center", experienced), {
    locked: false,
    status: "Ouvert",
    reason: "",
  });
  assert.deepEqual(world.locationAccess("leisure-center", fightGate), {
    locked: true,
    status: "Centre-ville verrouillé",
    reason: "Ta semaine est terminée. Règle maintenant le combat à l’aréna.",
  });
  assert.deepEqual(world.locationAccess("media-studio", beginner), {
    locked: true,
    status: "Centre-ville verrouillé",
    reason: "Disponible après ton premier combat amateur officiel.",
  });
  assert.deepEqual(world.locationAccess("media-studio", experienced), {
    locked: false,
    status: "Ouvert",
    reason: "",
  });
  assert.deepEqual(world.locationAccess("media-studio", fightGate), {
    locked: true,
    status: "Centre-ville verrouillé",
    reason: "Ta semaine est terminée. Règle maintenant le combat à l’aréna.",
  });
});

test("conserve l’aéroport verrouillé mais adapte son explication au statut professionnel", () => {
  assert.deepEqual(world.downtownLocationAccess("airport", baseCareer({ careerStatus: "amateur" })), {
    locked: true,
    status: "Professionnel requis",
    reason: "Disponible au statut professionnel.",
  });
  assert.deepEqual(world.downtownLocationAccess("airport", baseCareer({ careerStatus: "professional" })), {
    locked: true,
    status: "Camps à venir",
    reason: "Les camps professionnels seront annoncés prochainement.",
  });
});

test("rend les quatre états du menu principal avec une seule vue active", () => {
  for (const active of ["map", "calendar", "fighter", "inventory"]) {
    const html = world.renderNavigation(active);
    assert.equal((html.match(/data-career-nav=/g) || []).length, 4);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    assert.match(html, new RegExp(`data-career-navigation-view="${active}"`));
    assert.match(html, new RegExp(`aria-current="page" type="button" data-career-nav="${active}"`));
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

  assert.match(gym, /class="career-location-card"/);
  assert.match(gym, /data-location="boxing-gym"/);
  assert.match(gym, /Destination recommandée/);
  assert.match(gym, /Séance du coach/);
  assert.match(gym, /<button\b[^>]*type="button"[^>]*data-career-close-location/);
  assert.match(gym, />Retour à la carte<\/button>/);
  const arena = world.renderLocation("arena", baseCareer({ careerStatus: "amateur" }));
  assert.match(arena, /data-career-open-calendar>Ouvrir le calendrier/);
  assert.doesNotMatch(arena, /sera branché|prochaine étape de la carrière/i);
  assert.equal(world.renderLocation("does-not-exist", career), "");
});

test("résume sur la carte le prochain usage réel de l’aréna", () => {
  const arena = world.LOCATIONS.find(location => location.id === "arena");

  assert.equal(world.locationStatus(arena, baseCareer()), "Verrouillé · amateur requis");
  assert.equal(world.locationStatus(arena, baseCareer({ careerStatus: "amateur" })), "Aucun combat réservé");
  assert.equal(world.locationStatus(arena, baseCareer({ careerStatus: "amateur", careerFightGate: { status: "ready", kind: "gala" } })), "Combat prêt");
  assert.equal(world.locationStatus(arena, baseCareer({ careerStatus: "amateur", careerFightGate: { status: "ready", kind: "tournament" } })), "Tournoi prêt");
  assert.equal(world.locationStatus(arena, baseCareer({ careerStatus: "amateur", scheduledFight: { week: 8 } })), "Combat · semaine 8");
  assert.equal(world.locationStatus(arena, baseCareer({ careerStatus: "amateur", scheduledFight: { week: 8, isPracticeSparring: true } })), "Aucun combat réservé");
  assert.equal(world.locationStatus(arena, baseCareer({
    careerStatus: "amateur",
    bookings: [{ status: "registered", event: { kind: "tournament", careerWeek: 11 } }],
  })), "Tournoi · semaine 11");
  assert.equal(world.locationStatus(arena, baseCareer({
    careerStatus: "amateur",
    activeTournament: { status: "active" },
  })), "Tournoi en cours");
});

test("masque les fonctions de travail incomplètes", () => {
  const career = baseCareer({ careerStatus: "recreational" });
  const work = world.renderLocation("work", career);
  const gym = world.renderLocation("boxing-gym", career);

  assert.doesNotMatch(work, /data-career-developer-secret/);
  assert.doesNotMatch(work, /Vente de stupéfiants|mini-jeu|À venir/i);
  assert.match(work, /Emploi actuel/);
  assert.match(work, /data-career-open-job-menu/);
  assert.match(work, /data-career-toggle-work/);
  assert.match(work, /Retirer le travail de ma semaine/);
  assert.match(work, /travail est prévu cette semaine/);
  assert.match(work, /Le salaire affiché est hebdomadaire/);
  assert.doesNotMatch(gym, /data-career-developer-secret/);
});

test("garde le travail proposé par défaut tout en permettant de le retirer", () => {
  const work = world.renderLocation("work", baseCareer({
    careerWorkCompleted: true,
    careerWorkAvailable: false,
    careerWorkBlockReason: "Travail fait cette semaine · paie hebdomadaire versée.",
  }));

  assert.match(work, /Le travail est prévu cette semaine/);
  assert.match(work, /Retirer le travail de ma semaine/);
  assert.match(work, /data-career-toggle-work[^>]+aria-pressed="true">Retirer le travail de ma semaine/);
  assert.doesNotMatch(work, /Travail fait · paie versée/);
});

test("met l'argent en évidence dans la barre de semaine", () => {
  const html = world.render(baseCareer({ money: 432 }));
  assert.match(html, /class="career-now-money"[^>]*>432 \$<\/b>/);
  assert.match(html, /aria-label="Argent disponible 432 \$"/);
});

test("rend l’emploi de départ comme une étape explicite et immédiate", () => {
  const work = world.renderLocation("work", baseCareer({
    jobId: null,
    jobsHeldCount: 0,
    careerJob: null,
  }));

  assert.match(work, /Étape obligatoire/);
  assert.match(work, /Choisis ton premier emploi/);
  assert.match(work, />Choisir mon emploi<\/button>/);
  assert.match(work, /inclus par défaut dans chaque semaine/);
});

test("montre une candidature automatique et le nombre de semaines restantes", () => {
  const work = world.renderLocation("work", baseCareer({
    jobId: null,
    careerJob: null,
    jobsHeldCount: 1,
    jobApplication: { jobId: "warehouse", progress: 1, requiredWeeks: 3 },
    careerJobApplicationLabel: "Manutention de nuit",
  }));

  assert.match(work, /Candidature en cours/);
  assert.match(work, /Manutention de nuit/);
  assert.match(work, /2 semaines/);
  assert.match(work, /progress max="3" value="1"/);
});

test("signale clairement un profil de test et offre le retour à la carrière", () => {
  const html = world.render(baseCareer({
    profile: { firstName: "Alex", lastName: '<Test & Co>' },
    careerDeveloperTest: { active: true, canReturn: true, profileLabel: 'Alex <Test & Co>' },
  }));

  assert.match(html, /class="career-test-mode-banner"/);
  assert.match(html, /Mode test actif/);
  assert.match(html, /Ta vraie carrière reste conservée séparément/);
  assert.match(html, /data-career-restore-career/);
  assert.match(html, /Alex &lt;Test &amp; Co&gt;/);
  assert.doesNotMatch(html, /Alex <Test & Co>/);
});
