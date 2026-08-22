"use strict";

const { test, expect } = require("@playwright/test");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const MIME_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
});

let server;
let baseURL;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const relativePath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname).replace(/^\/+/, "");
      const filePath = path.resolve(PROJECT_ROOT, relativePath);
      if (filePath !== PROJECT_ROOT && !filePath.startsWith(`${PROJECT_ROOT}${path.sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const body = await fs.readFile(filePath);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      });
      response.end(body);
    } catch (error) {
      response.writeHead(error && error.code === "ENOENT" ? 404 : 500).end("Not found");
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  baseURL = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  if (!server) return;
  await new Promise(resolve => server.close(resolve));
});

async function openFreshCareer(page) {
  await page.addInitScript(() => localStorage.clear());
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#creation-screen")).toBeVisible();
  await expect(page.locator("#resume-dialog")).not.toBeVisible();
}

async function openStoredCareer(page, snapshot) {
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(value));
  }, snapshot);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#resume-dialog")).toBeVisible();
  await page.locator("#resume-load").click();
  await expect(page.locator("#game")).toBeVisible();
}

async function createCareer(page, options = {}) {
  const sex = options.sex === "female" ? "female" : "male";
  const firstName = options.firstName || (sex === "female" ? "Jade" : "Alex");
  const lastName = options.lastName || "Tactique";

  await page.locator("#first-name").fill(firstName);
  await page.locator("#last-name").fill(lastName);
  await page.locator("#nickname").fill(options.nickname || "Le Test");
  await page.locator("#fighter-sex").selectOption(sex);
  await page.locator("#weight-class").selectOption(sex === "female" ? "W57" : "M65");
  await page.locator("#fighter-style").selectOption(options.style || "balanced");
  await page.locator("#fighter-corner").selectOption(options.corner || "blue");
  await page.locator(`[data-portrait-id="${options.portraitId ?? 1}"]`).click();

  for (let point = 0; point < 5; point += 1) {
    await page.locator('#creation-stats button[data-change="1"]:not([disabled])').first().click();
  }
  await expect(page.locator("#points-left")).toHaveText("0");
  await page.getByRole("button", { name: "Commencer la carrière" }).click();
  await expect(page.locator("#game")).toBeVisible();
  await expect(page.locator("#creation-screen")).toBeHidden();
  return { sex, firstName, lastName };
}

async function bookCurrentGala(page) {
  const galaChoice = page.locator("#calendar-events [data-book-gala]").first();
  await expect(galaChoice).toBeVisible();
  await expect(galaChoice.locator("xpath=ancestor::article[1]")).toContainText("3 juges");
  await galaChoice.click();
  await expect(page.locator("#scheduled-fight")).toContainText("Prochain combat programmé");
  await expect(page.locator("#start-fight")).toBeVisible();
}

async function startTacticalFight(page) {
  await page.locator("#start-fight").click();
  const dialog = page.locator("#fight-dialog");
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.locator(".ring-backdrop").evaluate(image => image.complete ? image.naturalWidth : 0)).toBeGreaterThan(0);
  await expect(page.locator("#fight-score-label")).toHaveText("Cartes cachées");
  await expect(page.locator("#fight-score")).toHaveText("—");
  await expect(page.locator("#fight-judge-cards")).toBeHidden();
  await expect(page.locator("#fight-judge-cards")).toBeEmpty();
  await expect(page.locator("#fight-opponent-tell")).not.toHaveText("Tendance inconnue");
}

async function chooseCoachDirective(page) {
  const recommended = page.locator("#fight-coach-choices [data-coach-option]", { hasText: "conseillé" }).first();
  if (await recommended.isVisible()) {
    await recommended.click();
    return true;
  }
  const fallback = page.locator("#fight-coach-choices [data-coach-option]").first();
  if (await fallback.isVisible()) {
    await fallback.click();
    return true;
  }
  return false;
}

async function chooseExchangeAction(page) {
  const aligned = page.locator("#fight-choices [data-fight-action].coach-match").first();
  if (await aligned.isVisible()) {
    await aligned.click();
    return true;
  }
  const fallback = page.locator("#fight-choices [data-fight-action]").first();
  if (await fallback.isVisible()) {
    await fallback.click();
    return true;
  }
  return false;
}

async function completeFight(page) {
  const completionButton = page.locator("#fight-instruction button.primary-button").filter({ hasText: /Retour au camp|Retour au tournoi/ });
  for (let decision = 0; decision < 30; decision += 1) {
    if (await completionButton.isVisible()) return;
    if (await chooseCoachDirective(page)) continue;
    if (await chooseExchangeAction(page)) continue;
    throw new Error(`Le combat est bloqué après ${decision} décisions tactiques.`);
  }
  await expect(completionButton, "un combat amateur doit se terminer en au plus 18 décisions (3 briefings et 15 échanges)").toBeVisible();
}

async function chooseLowImpactExchange(page) {
  const priorities = [
    "high_guard", "compact_cover", "protect_body", "retreat_step", "clinch",
    "lateral_evade", "roll_under", "pivot_exit", "retake_center", "cautious_jab",
    "double_jab_move", "cut_ring", "parry_counter",
  ];
  for (const actionId of priorities) {
    const action = page.locator(`#fight-choices [data-fight-action="${actionId}"]`);
    if (await action.isVisible()) {
      await action.click();
      return true;
    }
  }
  return chooseExchangeAction(page);
}

async function completeFightWithLowImpactActions(page) {
  const completionButton = page.locator("#fight-instruction button.primary-button").filter({ hasText: /Retour au camp|Retour au tournoi/ });
  for (let decision = 0; decision < 30; decision += 1) {
    if (await completionButton.isVisible()) return;
    if (await chooseCoachDirective(page)) continue;
    if (await chooseLowImpactExchange(page)) continue;
    throw new Error(`Le combat de tournoi est bloqué après ${decision} décisions tactiques.`);
  }
  await expect(completionButton).toBeVisible();
}

function legacyV3Snapshot() {
  return {
    version: 3,
    savedAt: "2026-01-12T12:00:00.000Z",
    weeklyPlan: [],
    state: {
      profile: {
        firstName: "Louis",
        lastName: "Legacy",
        nickname: "L’Archive",
        style: "balanced",
        corner: "red",
      },
      combatStats: { technique: 44, power: 42, cardio: 43, defense: 41 },
      amateurRecord: { wins: 2, losses: 1, draws: 0 },
      week: 1,
      money: 210,
      energy: 78,
      fitness: 45,
      morale: 70,
      reputation: 12,
      injury: 6,
      fatigue: 4,
      scheduledFight: {
        id: "leclerc",
        week: 1,
        tournamentId: null,
      },
      journal: [{ week: 1, text: "Ancienne carrière de test." }],
    },
  };
}

function dueTournamentSnapshot() {
  const condition = {
    energy: 94,
    fatigue: 3,
    injury: 2,
    fitness: 82,
    cardio: 99,
    headDamage: 0,
    bodyDamage: 0,
    lucidity: 100,
  };
  const opponents = Array.from({ length: 3 }, (_, index) => ({
    id: `browser-opponent-${index + 1}`,
    name: `Adversaire test ${index + 1}`,
    nickname: "Le Repère",
    style: "Équilibré",
    record: "0 V · 0 D",
    difficulty: 25,
    rating: 25,
    stats: { technique: 25, power: 25, cardio: 25, defense: 25 },
  }));
  return {
    version: 4,
    savedAt: "2026-03-01T12:00:00.000Z",
    weeklyPlan: [],
    state: {
      profile: {
        firstName: "Ari",
        lastName: "Tournoi",
        nickname: "Le Métronome",
        sex: "male",
        weightClass: "M65",
        portraitId: 0,
        style: "counter",
        corner: "blue",
      },
      combatStats: { technique: 99, power: 1, cardio: 99, defense: 99 },
      amateurRecord: { wins: 0, losses: 0, draws: 0 },
      week: 8,
      money: 300,
      energy: condition.energy,
      fitness: condition.fitness,
      morale: 90,
      reputation: 15,
      injury: condition.injury,
      fatigue: condition.fatigue,
      currentWeightKg: 62.5,
      migrationPending: false,
      tournaments: { bronze: "entered", silver: "pending", golden: "pending", canadian: "locked", olympic: "locked" },
      activeTournament: {
        id: "bronze",
        startWeek: 8,
        status: "active",
        currentRound: 0,
        opponents,
        results: [],
        medal: null,
        summary: "",
        competition: {
          schemaVersion: 1,
          id: "browser-bronze-due",
          totalBouts: 3,
          day: 1,
          wins: 0,
          boutsFought: 0,
          phase: "daily_check",
          entryCondition: condition,
          condition,
          weight: { className: "M65", minKg: 60, maxKg: 65, toleranceKg: 0, history: [] },
          medical: { status: "unchecked", day: 0, reasons: [] },
          pendingMedical: null,
          currentBout: null,
          interBout: null,
          activeEffects: [],
          results: [],
          history: [],
          appliedRecoveryIds: [],
          lastBoutDay: null,
          lastRecoveryId: null,
          termination: null,
        },
      },
      scheduledFight: {
        id: "future-gala-browser",
        opponent: {
          id: "future-gala-browser",
          name: "Gala Futur",
          nickname: "La Relève",
          style: "Technicien",
          record: "1 V · 1 D",
          difficulty: 36,
          rating: 36,
          weightClass: "M65",
          stats: { technique: 36, power: 34, cardio: 37, defense: 37 },
        },
        tournamentId: null,
        week: 12,
        travelApplied: false,
        travelEffects: { energy: 0, fatigue: 0 },
        fightSeed: "future-gala-browser-seed",
      },
      journal: [{ week: 8, text: "Arrivée au tournoi Browser." }],
    },
  };
}

for (const profile of [
  { sex: "female", label: "féminine", weight: /W57/, portrait: /portraits-femmes\.webp/ },
  { sex: "male", label: "masculine", weight: /M65/, portrait: /portraits-hommes\.webp/ },
]) {
  test(`crée une carrière ${profile.label} avec sa catégorie et son portrait`, async ({ page }) => {
    await openFreshCareer(page);
    const identity = await createCareer(page, { sex: profile.sex });

    await expect(page.locator("#fighter-name")).toContainText(identity.firstName);
    await expect(page.locator("#fighter-meta")).toContainText(new RegExp(`Division ${profile.label}`));
    await expect(page.locator("#fighter-meta")).toContainText(profile.weight);
    await expect(page.locator("#fighter-portrait-image")).toHaveAttribute("src", profile.portrait);
    await expect(page.locator("#amateur-record")).toHaveText("0 V · 0 D");
    await expect(page.locator("#money-spotlight")).toHaveText("220 $");
    await expect(page.locator("#top-date")).toHaveText(/\d{1,2}.+\d{4}/);
    await expect(page.locator(".calendar-week-reference").first()).toContainText(/Semaine 1 · cette semaine/i);

    const savedProfile = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state.profile);
    expect(savedProfile.sex).toBe(profile.sex);
    expect(savedProfile.weightClass).toBe(profile.sex === "female" ? "W57" : "M65");
    expect(savedProfile.portraitId).toBe(1);
  });
}

test("réserve un gala et joue un combat tactique complet avant de révéler les trois cartes", async ({ page }) => {
  test.setTimeout(60_000);
  await openFreshCareer(page);
  await createCareer(page, { sex: "female", firstName: "Jade", lastName: "Decision", style: "counter" });
  await bookCurrentGala(page);
  await startTacticalFight(page);

  const viewport = page.viewportSize();
  const coachBox = await page.locator("#fight-coach-choices [data-coach-option]").first().boundingBox();
  expect(coachBox && coachBox.y + coachBox.height).toBeLessThanOrEqual(viewport.height);
  await chooseCoachDirective(page);
  const actionBox = await page.locator("#fight-choices [data-fight-action]").first().boundingBox();
  expect(actionBox && actionBox.y + actionBox.height).toBeLessThanOrEqual(viewport.height);

  await completeFight(page);

  await expect(page.locator("#fight-round")).toHaveText("Combat terminé");
  await expect(page.locator("#fight-status")).toContainText(/Victoire|Défaite|KO|TKO/);
  await expect(page.locator("#fight-score-label")).toHaveText(/Décision · 3 juges/);
  await expect(page.locator("#fight-judge-cards")).toBeVisible();
  await expect(page.locator("#fight-judge-cards .judge-card")).toHaveCount(3);
  await expect(page.locator("#fight-score")).toHaveText(/^(3–0|2–1|1–2|0–3)$/);

  const persistedBeforeClosingResult = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  expect(persistedBeforeClosingResult.state.week).toBe(2);
  expect(persistedBeforeClosingResult.state.amateurRecord.wins + persistedBeforeClosingResult.state.amateurRecord.losses).toBe(1);

  await page.locator("#fight-instruction button.primary-button").click();
  const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  expect(snapshot.state.amateurRecord.draws).toBe(0);
  expect(snapshot.state.amateurRecord.wins + snapshot.state.amateurRecord.losses).toBe(1);
  await expect(page.locator("#amateur-record")).not.toContainText(/N|nul/i);
});

test("reste utilisable à 390 × 844 px sans débordement et avec des actions tactiques de 44 px", async ({ page }) => {
  test.setTimeout(45_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openFreshCareer(page);
  await createCareer(page, { sex: "male", firstName: "Mobile", lastName: "Test" });

  const calendarMetrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(calendarMetrics.body).toBeLessThanOrEqual(calendarMetrics.viewport + 1);
  expect(calendarMetrics.document).toBeLessThanOrEqual(calendarMetrics.viewport + 1);

  const calendarToggle = page.locator(".calendar-panel .mobile-section-toggle");
  await expect(calendarToggle).toBeVisible();
  await calendarToggle.click();
  await expect(calendarToggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#calendar-events")).toBeHidden();
  await calendarToggle.click();
  await expect(calendarToggle).toHaveAttribute("aria-expanded", "true");

  await bookCurrentGala(page);
  await startTacticalFight(page);

  const coachButtons = page.locator("#fight-coach-choices [data-coach-option]:visible");
  expect(await coachButtons.count()).toBeGreaterThanOrEqual(3);
  const firstCoachBox = await coachButtons.first().boundingBox();
  expect(firstCoachBox && firstCoachBox.y).toBeGreaterThanOrEqual(0);
  expect(firstCoachBox && firstCoachBox.y).toBeLessThan(844);
  for (const button of await coachButtons.all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }

  await chooseCoachDirective(page);
  const tacticalButtons = page.locator("#fight-choices [data-fight-action]:visible");
  expect(await tacticalButtons.count()).toBeGreaterThanOrEqual(3);
  for (const button of await tacticalButtons.all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }

  const fightMetrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    dialog: document.querySelector("#fight-dialog").scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(fightMetrics.body).toBeLessThanOrEqual(fightMetrics.viewport + 1);
  expect(fightMetrics.document).toBeLessThanOrEqual(fightMetrics.viewport + 1);
  expect(fightMetrics.dialog).toBeLessThanOrEqual(fightMetrics.viewport + 1);

  await completeFight(page);
  await expect(page.locator("#fight-round")).toHaveText("Combat terminé");
  await expect(page.locator("#fight-instruction button.primary-button", { hasText: "Retour au camp" })).toBeVisible();
  const finishedMetrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    dialog: document.querySelector("#fight-dialog").scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(finishedMetrics.body).toBeLessThanOrEqual(finishedMetrics.viewport + 1);
  expect(finishedMetrics.document).toBeLessThanOrEqual(finishedMetrics.viewport + 1);
  expect(finishedMetrics.dialog).toBeLessThanOrEqual(finishedMetrics.viewport + 1);
});

test("choisit un emploi, reçoit sa paie et perd le poste après trois absences", async ({ page }) => {
  test.setTimeout(45_000);
  await openFreshCareer(page);
  await createCareer(page, { firstName: "Sam", lastName: "Travail" });

  const workAction = page.locator('[data-action="work"]');
  await expect(workAction).toBeDisabled();
  await expect(workAction).toContainText("Choisis d’abord un emploi");
  const futureAction = page.locator('[data-action="drug-sales"]');
  await expect(futureAction).toBeDisabled();
  await expect(futureAction).toContainText(/À venir|Bientôt disponible/);

  await page.locator("#open-job-menu").click();
  await expect(page.locator("#job-dialog")).toBeVisible();
  await expect(page.locator("#job-options [data-select-job]")).toHaveCount(3);
  await page.locator('[data-select-job="courier"]').click();
  await expect(page.locator("#job-dialog")).not.toBeVisible();
  await expect(workAction).toBeEnabled();
  await expect(workAction).toContainText("100 $");

  await workAction.click();
  await page.locator("#advance-week").click();
  await expect(page.locator("#summary-dialog")).toBeVisible();
  await expect(page.locator("#summary-content")).toContainText("+100 $");
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.money).toBe(320);
  expect(saved.jobId).toBe("courier");
  expect(saved.missedWorkWeeks).toBe(0);

  async function continueToNextWeek() {
    await page.locator("#summary-close").click();
    await expect(page.locator("#week-event-dialog")).toBeVisible();
    await page.locator("#week-event-choices button:not([disabled])").first().click();
    await expect(page.locator("#week-event-dialog")).not.toBeVisible();
  }

  await continueToNextWeek();
  for (let absence = 1; absence <= 3; absence += 1) {
    await page.locator('[data-action="family"]').click();
    await page.locator("#advance-week").click();
    await expect(page.locator("#summary-dialog")).toBeVisible();
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
    if (absence < 3) {
      expect(saved.jobId).toBe("courier");
      expect(saved.missedWorkWeeks).toBe(absence);
    } else {
      expect(saved.jobId).toBeNull();
      expect(saved.missedWorkWeeks).toBe(0);
      await expect(page.locator("#summary-content")).toContainText("congédiement");
    }
    if (absence < 3) await continueToNextWeek();
  }
});

test("migre une sauvegarde v3, recâble son combat réservé et impose le choix de division", async ({ page }) => {
  test.setTimeout(45_000);
  await openStoredCareer(page, legacyV3Snapshot());

  await expect(page.locator("#scheduled-fight")).toContainText("Prochain combat programmé");
  await expect(page.locator("#division-migration-dialog")).not.toBeVisible();

  const migratedBeforeWithdrawal = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  expect(migratedBeforeWithdrawal.version).toBe(4);
  expect(migratedBeforeWithdrawal.state.migrationPending).toBe(true);
  expect(migratedBeforeWithdrawal.state.scheduledFight.bookingId).toBeTruthy();
  const legacyBooking = migratedBeforeWithdrawal.state.bookings.find(
    booking => booking.id === migratedBeforeWithdrawal.state.scheduledFight.bookingId,
  );
  expect(legacyBooking).toBeTruthy();
  expect(legacyBooking.grandfathered).toBe(true);
  expect(legacyBooking.payment.status).toBe("grandfathered");
  expect(legacyBooking.event.kind).toBe("gala");
  expect(legacyBooking.eventId).toBe(migratedBeforeWithdrawal.state.scheduledFight.eventId);

  page.once("dialog", dialog => dialog.accept());
  await page.locator("#withdraw-fight").click();
  await expect(page.locator("#scheduled-fight")).toBeEmpty();

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#resume-dialog")).toBeVisible();
  await page.locator("#resume-load").click();
  const migrationDialog = page.locator("#division-migration-dialog");
  await expect(migrationDialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(migrationDialog, "Échap ne doit pas permettre d’éviter la migration obligatoire").toBeVisible();
  await expect(migrationDialog.getByRole("button", { name: "Confirmer et continuer" })).toBeVisible();

  await page.locator("#migration-sex").selectOption("female");
  await page.locator("#migration-weight").selectOption("W60");
  await page.locator("#migration-portrait").selectOption("2");
  await migrationDialog.getByRole("button", { name: "Confirmer et continuer" }).click();
  await expect(migrationDialog).not.toBeVisible();
  await expect(page.locator("#fighter-meta")).toContainText("Division féminine");
  await expect(page.locator("#fighter-meta")).toContainText("W60");

  const migratedAfterChoice = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  expect(migratedAfterChoice.version).toBe(4);
  expect(migratedAfterChoice.state.migrationPending).toBe(false);
  expect(migratedAfterChoice.state.profile.sex).toBe("female");
  expect(migratedAfterChoice.state.profile.weightClass).toBe("W60");
  expect(migratedAfterChoice.state.profile.portraitId).toBe(2);
});

test("enchaîne pesée, combat à cinq juges et récupération vers le jour suivant d’un tournoi", async ({ page }) => {
  test.setTimeout(75_000);
  await page.addInitScript(() => {
    let value = 1000;
    try {
      Object.defineProperty(globalThis.crypto, "getRandomValues", {
        configurable: true,
        value(array) {
          for (let index = 0; index < array.length; index += 1) array[index] = value + index * 17;
          value += 101;
          return array;
        },
      });
    } catch {
      // Les statistiques du snapshot gardent tout de même ce parcours très stable.
    }
  });
  await openStoredCareer(page, dueTournamentSnapshot());

  const migratedTournament = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(migratedTournament.activeTournament.bookingId).toBeTruthy();
  expect(migratedTournament.bookings.some(booking => booking.id === migratedTournament.activeTournament.bookingId)).toBe(true);

  await page.locator("#active-tournament [data-open-tournament]").click();
  const tournamentDialog = page.locator("#tournament-dialog");
  await expect(tournamentDialog).toBeVisible();
  await expect(page.locator("#tournament-daily-status")).toContainText("1 / 3");
  await expect(page.locator("#tournament-daily-status")).toContainText("Pesée et contrôle à effectuer");

  const nextTournamentStep = page.locator("#tournament-next-fight");
  await expect(nextTournamentStep).toContainText(/Passer la pesée.*jour 1/);
  await nextTournamentStep.click();
  await expect(page.locator("#tournament-daily-status")).toContainText("Autorisé à boxer aujourd’hui");
  await expect(nextTournamentStep).toContainText(/Disputer/);
  await nextTournamentStep.click();

  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-score-label")).toHaveText("Cartes cachées");
  await expect(page.locator("#fight-judge-cards")).toBeHidden();
  await completeFightWithLowImpactActions(page);

  await expect(page.locator("#fight-status")).toContainText("Victoire aux points");
  await expect(page.locator("#fight-score-label")).toHaveText("Décision · 5 juges");
  await expect(page.locator("#fight-judge-cards")).toBeVisible();
  await expect(page.locator("#fight-judge-cards .judge-card")).toHaveCount(5);
  await page.locator("#fight-instruction button.primary-button", { hasText: "Retour au tournoi" }).click();

  await expect(tournamentDialog).toBeVisible();
  await expect(page.locator("#tournament-interbout")).toBeVisible();
  await expect(page.locator("#tournament-recovery-choices [data-tournament-recovery]")).toHaveCount(3);
  await expect(page.locator("#tournament-recovery-preview")).toContainText("Un seul choix pour la nuit");
  await page.locator('#tournament-recovery-choices [data-tournament-recovery="rest"]').click();

  await expect(page.locator("#tournament-interbout")).toBeHidden();
  await expect(page.locator("#tournament-daily-status")).toContainText("2 / 3");
  await expect(page.locator("#tournament-daily-status")).toContainText("Pesée et contrôle à effectuer");
  await expect(nextTournamentStep).toContainText(/Passer la pesée.*jour 2/);

  const afterRecovery = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(afterRecovery.activeTournament.currentRound).toBe(1);
  expect(afterRecovery.activeTournament.competition.day).toBe(2);
  expect(afterRecovery.activeTournament.competition.wins).toBe(1);
  expect(afterRecovery.activeTournament.competition.boutsFought).toBe(1);
  expect(afterRecovery.activeTournament.competition.phase).toBe("daily_check");
  expect(afterRecovery.activeTournament.competition.lastRecoveryId).toBeTruthy();
  expect(afterRecovery.currentWeightKg).toBe(63);
  expect(afterRecovery.amateurRecord.draws).toBe(0);
  expect(afterRecovery.scheduledFight.id).toBe("future-gala-browser");
  expect(afterRecovery.scheduledFight.week).toBe(12);
  expect(afterRecovery.activeTournament.deferredScheduledFight).toBeUndefined();

  await nextTournamentStep.click();
  await expect(page.locator("#tournament-daily-status")).toContainText("Autorisé à boxer aujourd’hui");
  const afterDayTwoWeighIn = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state.activeTournament.competition);
  expect(afterDayTwoWeighIn.phase).toBe("ready");
  expect(afterDayTwoWeighIn.weight.history).toHaveLength(2);
  expect(afterDayTwoWeighIn.weight.history.every(entry => entry.passed)).toBe(true);
});
