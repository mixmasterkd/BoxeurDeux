"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fighterView = require("../v2-fighter-view.js");

function context(overrides = {}) {
  return {
    profile: { firstName: "Alex", lastName: "Roy", nickname: "Le Nord", sex: "male", portraitId: 1 },
    careerStatus: "amateur",
    statusLabel: "Amateur",
    styleLabel: "Technicien",
    weightLabel: "M65 · 60 à 65 kg",
    money: 450,
    level: 2,
    experience: 135,
    levelPoints: 3,
    amateurRecord: { wins: 2, losses: 1, draws: 0 },
    combatStats: { technique: 43.37, power: 40, cardio: 41.995, defense: 42.02 },
    supplementInventory: [{ id: "electrolytes", label: "Électrolytes", quantity: 2, detail: "Récupération" }],
    ...overrides,
  };
}

test("normalise les quatre statistiques et dérive une jauge 0–100 sans ajouter de statistique", () => {
  const normalized = fighterView.normalizeContext(context());
  assert.deepEqual(normalized.stats, { technique: 43, power: 40, cardio: 41, defense: 42 });
  assert.deepEqual(normalized.progress, { technique: 37, power: 0, cardio: 99, defense: 2 });
});

test("rend une fiche accessible avec jauges et argent sans dupliquer l’inventaire", () => {
  const html = fighterView.render(context());
  assert.match(html, /Fiche du boxeur/);
  assert.match(html, /Alex « Le Nord » Roy/);
  assert.match(html, /450 \$/);
  assert.equal((html.match(/role="progressbar"/g) || []).length, 5);
  assert.match(html, /aria-valuenow="37"/);
  assert.match(html, />37 %<\/small>/);
  assert.doesNotMatch(html, /37\/100/);
  assert.doesNotMatch(html, /vers \+1 technique/i);
  assert.doesNotMatch(html, /\+1/);
  assert.match(html, /Progression générale/);
  assert.match(html, /Progression vers le niveau 3/);
  assert.match(html, /Récréatif – Niveau 2|Amateur – Niveau 2/);
  assert.match(html, /data-v2-level-up-slot data-level-points="3" hidden/);
  assert.doesNotMatch(html, /Électrolytes/);
  assert.doesNotMatch(html, /Suppléments/);
  assert.match(html, /data-v2-close-fighter/);
});

test("calcule la progression générale avec la même courbe que la carrière", () => {
  assert.equal(fighterView.xpForLevel(1), 0);
  assert.equal(fighterView.xpForLevel(2), 100);
  assert.equal(fighterView.xpForLevel(3), 280);
  const normalized = fighterView.normalizeContext(context({ level: 2, experience: 190 }));
  assert.equal(normalized.levelProgress.currentFloor, 100);
  assert.equal(normalized.levelProgress.nextFloor, 280);
  assert.equal(normalized.levelProgress.progress, 50);
  assert.equal(normalized.levelProgress.remaining, 90);
});

test("accepte un pourcentage général explicite et le borne", () => {
  assert.equal(fighterView.normalizeContext(context({ levelProgress: 145 })).levelProgress.progress, 100);
  assert.equal(fighterView.normalizeContext(context({ levelProgress: -4 })).levelProgress.progress, 0);
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
  assert.match(html, /18 points de progression potentielle créés par le programme/);
});

test("le CSS recentre le panneau et rend la fiche elle-même défilable sur mobile", () => {
  const css = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "v2-fighter.css"), "utf8");
  assert.match(css, /width:\s*min\(1120px, 100%\)/);
  assert.match(css, /margin:\s*0 auto/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.v2-fighter-view[\s\S]*?height:\s*100dvh/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.v2-fighter-view[\s\S]*?overflow-y:\s*auto/);
});

test("le statut récréatif masque le bilan et conserve le programme privé séparé", () => {
  const html = fighterView.render(context({
    careerStatus: "recreational",
    supplementInventory: [],
  }));
  assert.match(html, /Bilan amateur à venir/);
  assert.match(html, /Aucun programme privé actif/);
  assert.doesNotMatch(html, /2 V · 1 D/);
});
