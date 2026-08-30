"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fighterView = require("../fighter-view.js");

function context(overrides = {}) {
  return {
    profile: { firstName: "Alex", lastName: "Roy", nickname: "Le Nord", sex: "male", portraitId: 1 },
    careerStatus: "amateur",
    statusLabel: "Amateur",
    styleLabel: "Technicien",
    weightLabel: "M65 · 60 à 65 kg",
    money: 450,
    level: 2,
    experience: 45,
    levelPoints: 3,
    amateurRecord: { wins: 2, losses: 1, draws: 0 },
    combatStats: { technique: 43.37, power: 40, cardio: 41.995, defense: 42.02 },
    statXpProgress: {
      technique: { total: 12, nextThreshold: 40, pendingXp: 4 },
      power: { total: 45, nextThreshold: 90, pendingXp: 0 },
      cardio: { total: 89, nextThreshold: 90, pendingXp: 2 },
      defense: { total: 6, nextThreshold: 40, pendingXp: 0 },
    },
    ...overrides,
  };
}

test("normalise les quatre statistiques et leur XP cumulative sans ajouter de statistique", () => {
  const normalized = fighterView.normalizeContext(context());
  assert.deepEqual(normalized.stats, { technique: 43, power: 40, cardio: 41, defense: 42 });
  assert.deepEqual(normalized.statXp.technique, { total: 12, nextThreshold: 40, pendingXp: 4 });
  assert.deepEqual(normalized.statXp.power, { total: 45, nextThreshold: 90, pendingXp: 0 });
});

test("rend une fiche accessible avec jauges et argent sans dupliquer l’inventaire", () => {
  const html = fighterView.render(context());
  assert.match(html, /Fiche du boxeur/);
  assert.match(html, /Alex « Le Nord » Roy/);
  assert.match(html, /450 \$/);
  assert.equal((html.match(/role="progressbar"/g) || []).length, 5);
  assert.match(html, /aria-valuemax="40" aria-valuenow="12"/);
  assert.match(html, /<strong>12 \/ 40 XP<\/strong>/);
  assert.match(html, /\+4 XP en attente de récupération/);
  assert.match(html, /Toute l’XP est assimilée/);
  assert.doesNotMatch(html, /37\/100/);
  assert.doesNotMatch(html, /vers \+1 technique/i);
  assert.match(html, /XP générale/);
  assert.match(html, /45 \/ 90 XP/);
  assert.match(html, /avant le niveau 3/);
  assert.match(html, /Récréatif – Niveau 2|Amateur – Niveau 2/);
  assert.match(html, /data-career-level-up-slot data-level-points="3" hidden/);
  assert.doesNotMatch(html, /Électrolytes/);
  assert.doesNotMatch(html, /Suppléments/);
  assert.doesNotMatch(html, /data-career-close-fighter|Retour à la carte/);
  assert.match(html, /Sauvegarde externe/);
  assert.match(html, /Télécharger la sauvegarde JSON/);
  assert.match(html, /data-career-export-career/);
});

test("calcule la progression générale avec la même courbe que la carrière", () => {
  assert.equal(fighterView.xpForLevel(1), 0);
  assert.equal(fighterView.xpForLevel(2), 40);
  assert.equal(fighterView.xpForLevel(3), 90);
  assert.equal(fighterView.xpForLevel(4), 150);
  const normalized = fighterView.normalizeContext(context({ level: 2, experience: 65 }));
  assert.equal(normalized.levelProgress.currentFloor, 40);
  assert.equal(normalized.levelProgress.nextFloor, 90);
  assert.equal(normalized.levelProgress.progress, 72);
  assert.equal(normalized.levelProgress.remaining, 25);
});

test("borne la représentation visuelle sans remplacer l’affichage XP cumulatif", () => {
  assert.equal(fighterView.normalizeContext(context({ experience: 900 })).levelProgress.progress, 100);
  assert.equal(fighterView.normalizeContext(context({ experience: -4 })).levelProgress.progress, 0);
});

test("présente un programme privé actif sans promettre de gain instantané", () => {
  const html = fighterView.render(context({
    privateTrainerProgram: {
      trainerLabel: "Nadia Bouchard",
      target: "defense",
      sessionsCompleted: 2,
      sessionsTotal: 4,
      pendingGaugePoints: 18,
    },
  }));

  assert.match(html, /Programme privé/);
  assert.match(html, /Nadia Bouchard/);
  assert.match(html, /Cible : Défense/);
  assert.match(html, /2\/4 séances/);
  assert.match(html, /aria-valuenow="50"/);
  assert.match(html, /18 XP ciblée créée par le programme/);
});

test("affiche les bons de cours privé reçus lors des montées de niveau", () => {
  const html = fighterView.render(context({ privateLessonCredits: 2 }));
  assert.match(html, /Cours privé offert/);
  assert.match(html, /2 bons/);
});

test("résume les médailles dans le bilan et détaille seulement les tournois récompensés", () => {
  const html = fighterView.render(context({
    medals: [
      { id: "golden", label: "Gants dorés", gold: 2, silver: 1, bronze: 0 },
      { id: "regional-cup", label: "Coupe régionale des clubs", gold: 0, silver: 0, bronze: 3 },
      { id: "olympic", label: "Parcours olympique", gold: 0, silver: 0, bronze: 0 },
    ],
  }));
  const normalized = fighterView.normalizeContext(context({
    medals: [{ id: "regional-cup", label: "Coupe régionale", gold: 2, silver: 1, bronze: 3 }],
  }));

  assert.deepEqual(normalized.medals.totals, { gold: 2, silver: 1, bronze: 3 });
  assert.equal(normalized.medals.count, 6);
  assert.match(html, /Bilan de tournoi/);
  assert.match(html, /Gants dorés/);
  assert.match(html, /Coupe régionale des clubs/);
  assert.doesNotMatch(html, /Parcours olympique/);
  assert.match(html, /Or 2/);
  assert.match(html, /Argent 1/);
  assert.match(html, /Bronze 3/);
});

test("explique le bilan de médailles vide pour une carrière amateur", () => {
  const html = fighterView.render(context({ medals: [] }));
  assert.match(html, /Aucune médaille pour le moment/);
  assert.match(html, /défaite en demi-finale donne le bronze/);
});

test("le CSS recentre le panneau et rend la fiche elle-même défilable sur mobile", () => {
  const css = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "fighter.css"), "utf8");
  assert.match(css, /width:\s*min\(1120px, 100%\)/);
  assert.match(css, /margin:\s*0 auto/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.career-fighter-view[\s\S]*?height:\s*100dvh/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.career-fighter-view[\s\S]*?overflow-y:\s*auto/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.career-fighter-save[\s\S]*?display:\s*grid/);
  assert.match(css, /\.career-fighter-save button[\s\S]*?min-height:\s*44px/);
});

test("le statut récréatif masque le bilan et conserve le programme privé séparé", () => {
  const html = fighterView.render(context({
    careerStatus: "recreational",
  }));
  assert.match(html, /Bilan amateur à venir/);
  assert.match(html, /Aucun programme privé actif/);
  assert.doesNotMatch(html, /2 V · 1 D/);
  assert.doesNotMatch(html, /Bilan de tournoi/);
});
