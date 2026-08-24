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
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
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
  if (!await page.locator("#calendar-dialog").isVisible()) {
    await page.locator("#open-calendar").click();
    await expect(page.locator("#calendar-dialog")).toBeVisible();
  }
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
  await expect(page.locator("#fight-round-dynamic")).toContainText("Dynamique du round");
  await expect(page.locator("#fight-round-dynamic")).toContainText("ce n’est pas une carte de juge");
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
  const completionButton = page.locator("#fight-instruction button.primary-button").filter({ hasText: /Retour au camp|Retour au tournoi|Retour au GYM|Retour au menu test|Voir le parcours récréatif/ });
  for (let decision = 0; decision < 30; decision += 1) {
    if (await completionButton.isVisible()) return;
    if (await chooseCoachDirective(page)) continue;
    if (await chooseExchangeAction(page)) continue;
    throw new Error(`Le combat est bloqué après ${decision} décisions tactiques.`);
  }
  await expect(completionButton, "un combat amateur doit se terminer en au plus 18 décisions (3 briefings et 15 échanges)").toBeVisible();
}

function amateurSnapshot(overrides = {}) {
  const state = {
    profile: {
      firstName: "Alex",
      lastName: "Amateur",
      nickname: "Le Test",
      sex: "male",
      weightClass: "M65",
      portraitId: 1,
      style: "balanced",
      corner: "blue",
    },
    careerStatus: "amateur",
    careerStartDate: "2026-11-16",
    combatStats: { technique: 45, power: 43, cardio: 44, defense: 44 },
    amateurRecord: { wins: 0, losses: 0, draws: 0 },
    week: 1,
    money: 220,
    energy: 78,
    fitness: 45,
    morale: 70,
    reputation: 12,
    injury: 6,
    fatigue: 4,
    gymWeeks: 0,
    introJobRequired: false,
    initialGymRequired: false,
    journal: [{ week: 1, text: "Carrière amateur de test." }],
    ...overrides,
  };
  state.profile = { ...state.profile, ...(overrides.profile || {}) };
  return { version: 5, savedAt: "2026-11-16T12:00:00.000Z", weeklyPlan: [], state };
}

function recreationalReadySnapshot() {
  const snapshot = amateurSnapshot({
    careerStatus: "recreational",
    careerStartDate: "2026-09-07",
    week: 6,
    gymWeeks: 4,
    jobId: "convenience",
    introJobRequired: false,
    initialGymRequired: false,
    recreationalTrainingWeeks: 5,
    recreationalSparringStatus: "training",
    scheduledFight: null,
    journal: [{ week: 6, text: "Rémy attend au GYM." }],
  });
  snapshot.state.profile = { ...snapshot.state.profile, firstName: "Noa", lastName: "Récréatif" };
  return snapshot;
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
    await expect(page.locator("#fighter-meta")).toContainText("Récréatif");
    await expect(page.locator("#fighter-portrait-image")).toHaveAttribute("src", profile.portrait);
    await expect(page.locator("#amateur-record")).toHaveText("À venir");
    await expect(page.locator("#money-spotlight")).toHaveText("220 $");
    await expect(page.locator("#top-date")).toHaveText(/\d{1,2}.+\d{4}/);
    await expect(page.locator("#top-date")).toContainText(/sept/i);
    await expect(page.locator("#calendar-summary")).toContainText("0 / 10 entraînements");
    await expect(page.locator("#job-dialog")).toBeVisible();
    await page.locator("#job-dialog-close").click();

    const savedProfile = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state.profile);
    expect(savedProfile.sex).toBe(profile.sex);
    expect(savedProfile.weightClass).toBe(profile.sex === "female" ? "W57" : "M65");
    expect(savedProfile.portraitId).toBe(1);
  });
}

test("cadre les trois portraits masculins et féminins sans déformation sur ordinateur et mobile", async ({ page }) => {
  await openFreshCareer(page);

  const assertPortraitGeometry = async expectedAsset => {
    await expect(page.locator("#creation-portraits .portrait-option")).toHaveCount(3);
    const metrics = await page.locator("#creation-portraits .portrait-option").evaluateAll(buttons => buttons.map((button, index) => {
      const preview = button.querySelector(".portrait-option-preview");
      const image = preview.querySelector("img");
      const previewBox = preview.getBoundingClientRect();
      const imageBox = image.getBoundingClientRect();
      return {
        index,
        source: image.getAttribute("src"),
        previewWidth: previewBox.width,
        previewHeight: previewBox.height,
        imageWidth: imageBox.width,
        imageHeight: imageBox.height,
        imageLeft: imageBox.left,
        imageTop: imageBox.top,
        previewLeft: previewBox.left,
        previewTop: previewBox.top,
      };
    }));
    for (const metric of metrics) {
      expect(metric.source).toContain(expectedAsset);
      expect(metric.previewWidth).toBeGreaterThan(80);
      expect(metric.previewHeight).toBeGreaterThanOrEqual(126);
      expect(Math.abs(metric.imageWidth / metric.previewWidth - 3)).toBeLessThan(.03);
      expect(Math.abs(metric.imageHeight / metric.imageWidth - 2 / 3)).toBeLessThan(.03);
      expect(Math.abs(metric.imageTop - metric.previewTop)).toBeLessThan(2);
      expect(Math.abs(metric.imageLeft - (metric.previewLeft - metric.index * metric.previewWidth))).toBeLessThan(3);
      expect(metric.imageHeight).toBeGreaterThan(metric.previewHeight);
    }
    const width = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth }));
    expect(width.body).toBeLessThanOrEqual(width.viewport + 1);
  };

  await assertPortraitGeometry("portraits-hommes.webp");
  await page.locator("#fighter-sex").selectOption("female");
  await assertPortraitGeometry("portraits-femmes.webp");

  await page.setViewportSize({ width: 390, height: 844 });
  await assertPortraitGeometry("portraits-femmes.webp");
  await page.locator("#fighter-sex").selectOption("male");
  await assertPortraitGeometry("portraits-hommes.webp");
  for (const button of await page.locator("#creation-portraits .portrait-option").all()) {
    expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(128);
  }
});

test("explique et verrouille le GYM V2 avant l’inscription", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const snapshot = amateurSnapshot({
    careerStatus: "recreational",
    gymWeeks: 0,
    money: 75,
    jobId: "courier",
    introJobRequired: false,
  });
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(value));
  }, snapshot);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).first().click();

  await expect(page.locator("#v2-gym-membership-lock-reason")).toContainText("Inscription requise");
  await expect(page.locator(".v2-gym-membership.inactive")).toContainText("1 mois · ou 3 mois à rabais");
  await expect(page.locator(".v2-gym-membership.inactive")).toContainText("110 $");
  await expect(page.locator(".v2-gym-membership.inactive")).toContainText("Solde");
  await expect(page.locator(".v2-gym-membership.inactive")).toContainText("Cours de groupe récréatif");
  await expect(page.locator("#v2-gym-membership-lock-reason")).toContainText("sac au sous-sol");

  const lockedHotspots = page.locator('.v2-gym-hotspot[aria-disabled="true"]');
  await expect(lockedHotspots).toHaveCount(3);
  const reception = page.locator('.v2-gym-hotspot[data-v2-gym-zone="reception"]');
  await expect(reception).not.toHaveAttribute("aria-disabled", "true");
  await lockedHotspots.first().focus();
  await expect(lockedHotspots.first()).toBeFocused();
  await lockedHotspots.first().dispatchEvent("click");
  await expect(page.locator(".v2-session-composer")).toHaveCount(0);

  const signup = page.locator('.v2-gym-membership [data-v2-gym-zone="reception"]');
  expect((await signup.boundingBox()).height).toBeGreaterThanOrEqual(44);
  const fit = await page.locator(".v2-gym-view").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(fit.scrollWidth).toBeLessThanOrEqual(fit.clientWidth + 1);
  expect(fit.documentWidth).toBeLessThanOrEqual(fit.viewportWidth + 1);
  await signup.click();
  await expect(page.locator("#membership-dialog")).toBeVisible();
});

test("bâtit une semaine V2 modifiable puis ne l’exécute qu’à la confirmation", async ({ page }) => {
  test.setTimeout(60_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const snapshot = amateurSnapshot({
    careerStatus: "recreational",
    careerStartDate: "2026-09-07",
    week: 1,
    money: 220,
    jobId: null,
    jobsHeldCount: 0,
    introJobRequired: true,
    gymWeeks: 0,
    initialGymRequired: true,
    recreationalTrainingWeeks: 0,
    recreationalSparringStatus: "training",
  });
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(value));
  }, snapshot);
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  const mainBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  const launcher = page.locator(".v2-week-launcher");
  await expect(launcher).toContainText("Bâtis ta semaine");
  await expect(launcher).toContainText("Énergie restante de la semaine");
  await expect(launcher.locator("progress")).toHaveAttribute("max", "50");
  await expect(launcher.locator("progress")).toHaveAttribute("value", "50");
  await expect(page.locator("[data-v2-week-quick]")).toBeDisabled();
  await expect(page.locator(".v2-week-blocker")).toContainText("emploi de départ");

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await expect(page.locator(".v2-work-management.required")).toContainText("Choisis ton premier emploi");
  await page.locator("[data-v2-open-job-menu]").click();
  await expect(page.locator("#job-dialog")).toBeVisible();
  await page.locator('#job-options [data-select-job="courier"]').click();
  await expect(page.locator("#job-dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: /Entrer : Emploi/ })).toHaveAccessibleName(/Emploi actif/);

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  const workToggle = page.locator("[data-v2-toggle-work]");
  await expect(page.locator(".v2-work-management")).toContainText("prévu cette semaine");
  await expect(workToggle).toContainText("Retirer le travail de ma semaine");
  const capacityWithWork = Number(await launcher.locator("progress").getAttribute("value"));
  await workToggle.click();
  await expect(page.locator(".v2-work-management")).toContainText("aucune paie");
  await expect(page.locator("[data-v2-toggle-work]")).toContainText("Ajouter le travail à ma semaine");
  const capacityWithoutWork = Number(await launcher.locator("progress").getAttribute("value"));
  expect(capacityWithoutWork).toBeGreaterThan(capacityWithWork);
  await page.locator("[data-v2-toggle-work]").click();
  await expect(page.locator("[data-v2-toggle-work]")).toContainText("Retirer le travail de ma semaine");
  await page.locator("[data-v2-close-location]").click();

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await expect(page.locator(".v2-gym-membership.inactive")).toContainText("Inscription requise");
  await page.locator('.v2-gym-membership [data-v2-gym-zone="reception"]').click();
  await expect(page.locator("#membership-dialog")).toBeVisible();
  await page.locator('#membership-options [data-gym-plan="monthly"]').click();
  await expect(page.locator("#membership-dialog")).not.toBeVisible();
  await expect(page.locator(".v2-gym-membership")).toContainText("Abonnement actif");
  await page.locator("[data-v2-leave-gym]").click();

  await expect(page.locator("[data-v2-week-quick]")).toBeEnabled();
  const capacityAfterWork = Number(await launcher.locator("progress").getAttribute("value"));
  expect(capacityAfterWork).toBeLessThan(50);
  await page.locator("[data-v2-week-quick]").click();
  const quickPlan = page.locator(".v2-week-plan");
  await expect(quickPlan).toBeVisible();
  await expect(quickPlan).toContainText("Plan rapide modifiable");
  await expect(quickPlan).toContainText("Coursier local");
  await expect(quickPlan).toContainText("Cours de groupe");
  await expect(quickPlan).toContainText("Journée de repos");
  await expect(quickPlan).toContainText("Les activités ne sont pas encore accomplies");

  const restItem = quickPlan.locator(".v2-week-plan-items li", { hasText: "Journée de repos" });
  const capacityBeforeRemoval = Number(await quickPlan.locator("progress").getAttribute("value"));
  await restItem.locator("[data-v2-week-remove]").click();
  await expect(page.locator(".v2-week-plan")).not.toContainText("Journée de repos");
  const capacityAfterRemoval = Number(await page.locator(".v2-week-plan progress").getAttribute("value"));
  expect(capacityAfterRemoval).toBe(capacityBeforeRemoval);
  await page.locator("[data-v2-week-plan-close]").first().click();

  await page.getByRole("button", { name: /Entrer : Maison/ }).click();
  const restAction = page.locator('.v2-home-actions [data-v2-home-action="rest"]');
  await restAction.click();
  await expect(restAction).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-v2-leave-home]").click();

  await page.locator(".v2-week-launcher [data-v2-week-confirm]").click();
  await expect(page.locator(".v2-week-summary")).toBeVisible();
  await expect(page.locator(".v2-week-summary")).toContainText("Paie");
  await expect(page.locator(".v2-week-summary")).toContainText("+100 $");

  let capsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(capsule.timeState.clock.week).toBe(2);
  expect(capsule.previewRuntime.career.money).toBe(210);
  expect(capsule.previewRuntime.career.gymWeeks).toBe(3);
  expect(capsule.previewRuntime.career.jobTenureWeeks).toBe(1);
  expect(capsule.previewRuntime.career.jobWagesEarned).toBe(100);
  expect(capsule.previewRuntime.weeklySummaries[0].mode).toBe("quick");
  expect(capsule.previewRuntime.weeklySummaries[0].counts.training).toBe(1);
  expect(capsule.previewRuntime.weeklySummaries[0].counts.work).toBe(1);
  expect(capsule.previewRuntime.weeklySummaries[0].actions.some(action => action.primitive?.plannerActivityId === "rest")).toBe(true);
  await page.locator("[data-v2-week-summary-close]").click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-v2-week-detailed]").click();
  await expect(page.locator(".v2-week-plan")).toContainText("Coursier local");
  await expect(page.locator(".v2-week-plan").locator("[data-v2-week-remove]").first()).toBeVisible();
  await page.locator("[data-v2-week-plan-close]").first().click();

  const beforeManualDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")).timeState);
  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await page.locator("[data-v2-toggle-work]").click();
  await expect(page.locator("[data-v2-toggle-work]")).toContainText("Ajouter le travail à ma semaine");
  await page.locator("[data-v2-close-location]").click();
  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await page.locator("[data-v2-coach-session]").scrollIntoViewIfNeeded();
  await page.locator("[data-v2-coach-session]").click();
  await expect(page.locator(".v2-gym-view")).toContainText("Cours de groupe");
  await expect(page.locator(".v2-gym-week-plan")).toContainText("Cours de groupe");
  await page.locator('.v2-gym-week-plan [data-v2-location-remove]').click();
  await expect(page.locator(".v2-gym-week-plan")).toContainText("Aucune activité du GYM n’est encore planifiée");
  await expect(page.locator("[data-v2-coach-session]")).toHaveAttribute("aria-pressed", "false");
  await page.locator("[data-v2-coach-session]").click();
  await expect(page.locator(".v2-gym-week-plan")).toContainText("Cours de groupe");
  await page.locator("[data-v2-leave-gym]").click();

  const manualPlanner = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")).previewRuntime.weekPlanner);
  expect(manualPlanner.limits.recreationalPhysicalActivities).toBe(2);
  expect(manualPlanner.entries.filter(entry => entry.physical).map(entry => entry.activityId)).toEqual(["group-class"]);
  await page.getByRole("button", { name: /Entrer : Maison/ }).click();
  const homeQuick = page.locator('.v2-home-actions [data-v2-home-action="home-quick"]');
  await homeQuick.click();
  await expect(page.locator(".v2-home-week-plan")).toContainText("Entraînement maison rapide");
  await expect(homeQuick).toBeDisabled();
  await page.locator("[data-v2-leave-home]").click();

  const afterManualDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")).timeState);
  expect(afterManualDraft).toEqual(beforeManualDraft);
  await page.locator("[data-v2-week-detailed]").click();
  await expect(page.locator(".v2-week-plan")).toContainText("Cours de groupe");
  await expect(page.locator(".v2-week-plan")).toContainText("Entraînement maison rapide");
  const mobilePlanFit = await page.locator(".v2-week-plan").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(mobilePlanFit.scrollWidth).toBeLessThanOrEqual(mobilePlanFit.clientWidth + 1);
  expect(mobilePlanFit.documentWidth).toBeLessThanOrEqual(mobilePlanFit.viewportWidth + 1);
  for (const button of await page.locator(".v2-week-plan button").all()) {
    expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  await page.locator(".v2-week-plan [data-v2-week-confirm]").click();
  await expect(page.locator(".v2-week-summary")).toBeVisible();
  capsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(capsule.timeState.clock.week).toBe(3);
  expect(capsule.previewRuntime.weeklySummaries[0].counts.training).toBe(2);
  expect(capsule.previewRuntime.weeklySummaries[0].counts.work).toBe(0);
  expect(capsule.previewRuntime.career.money).toBe(210);
  expect(capsule.previewRuntime.career.jobTenureWeeks).toBe(1);
  expect(capsule.previewRuntime.career.jobWagesEarned).toBe(100);

  const mainAfter = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  expect(mainAfter.state.week).toBe(capsule.timeState.clock.week);
  expect(mainAfter.state.money).toBe(capsule.previewRuntime.career.money);
  expect(mainAfter.state.gymWeeks).toBe(capsule.previewRuntime.career.gymWeeks);
  expect(mainAfter.state.jobId).toBe(capsule.previewRuntime.career.jobId);
  expect(mainAfter.state.jobWagesEarned).toBe(capsule.previewRuntime.career.jobWagesEarned);
  expect(mainAfter.state.recreationalTrainingWeeks).toBe(capsule.previewRuntime.trainingSessions);
  expect(mainAfter.state.amateurRecord).toEqual(mainBefore.state.amateurRecord);
  expect(mainAfter.weeklyPlan).toEqual(mainBefore.weeklyPlan);
});

test("réduit progressivement la capacité après l’inactivité sans retirer de statistiques", async ({ page }) => {
  test.setTimeout(45_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const snapshot = amateurSnapshot({
    careerStatus: "amateur",
    fitness: 68,
    trainingRhythmPenalty: 0,
    jobId: "courier",
    gymWeeks: 4,
    initialGymRequired: false,
  });
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(value));
  }, snapshot);
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  const finishWeek = async () => {
    await page.locator(".v2-week-launcher [data-v2-week-confirm]").click();
    await expect(page.locator(".v2-week-summary")).toBeVisible();
    const result = await page.evaluate(() => ({
      main: JSON.parse(localStorage.getItem("boxeur-deux-career-v2")),
      capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")),
    }));
    result.summaryText = await page.locator(".v2-week-summary").textContent();
    await page.locator("[data-v2-week-summary-close]").click();
    return result;
  };

  let result = await finishWeek();
  expect(result.capsule.previewRuntime.career.trainingRhythmPenalty).toBe(1);
  expect(result.main.state.fitness).toBe(68);
  expect(result.summaryText).toContain("Rythme fragile");
  await expect(page.locator(".v2-week-launcher progress")).toHaveAttribute("max", "45");

  result = await finishWeek();
  expect(result.capsule.previewRuntime.career.trainingRhythmPenalty).toBe(2);
  expect(result.main.state.fitness).toBe(68);
  expect(result.summaryText).toContain("Rythme faible");
  expect(result.summaryText).toContain("sans diminution des statistiques");
  await expect(page.locator(".v2-week-launcher progress")).toHaveAttribute("max", "40");

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await page.locator("[data-v2-coach-session]").click();
  await expect(page.locator(".v2-gym-week-plan")).toContainText("Séance de l’entraîneur");
  await page.locator("[data-v2-leave-gym]").click();
  result = await finishWeek();
  expect(result.capsule.previewRuntime.career.trainingRhythmPenalty).toBe(1);
  expect(result.main.state.fitness).toBe(68);
});

test("fait passer Rémy « Le Tank » du parcours récréatif au statut amateur", async ({ page }) => {
  test.setTimeout(60_000);
  await openStoredCareer(page, recreationalReadySnapshot());
  await expect(page.locator('[data-action="group-class"]')).toBeVisible();

  await expect(page.locator("#calendar-summary")).toContainText("Sparring disponible");
  await page.locator("#open-calendar").click();
  await expect(page.locator("#recreational-path")).toContainText("Rémy « Le Tank »");
  await page.locator("#start-fight").click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-week-label")).toContainText("Rémy « Le Tank »");
  await chooseCoachDirective(page);
  await expect(page.locator("#fight-round")).toContainText("échange 1 / 4");
  await completeFight(page);
  await expect(page.locator("#fight-round")).toHaveText("Sparring terminé");
  await expect(page.locator("#fight-score-label")).toHaveText("Sparring non comptabilisé");
  await expect(page.locator("#fight-status")).toHaveText("Sparring terminé");
  await expect(page.locator("#fight-instruction")).not.toContainText(/Victoire|Défaite/);
  await expect(page.locator("#fight-instruction .sparring-debrief")).toBeVisible();
  await expect(page.locator("#fight-instruction .sparring-debrief")).toContainText("Ce que Rémy veut te montrer");
  await expect(page.locator("#fight-instruction .sparring-debrief")).toContainText("À essayer au prochain combat");
  await page.locator("#fight-instruction button.primary-button", { hasText: "Voir le parcours récréatif" }).click();
  await expect(page.locator("#calendar-dialog")).toBeVisible();
  await expect(page.locator("#turn-amateur")).toBeVisible();
  const afterSparring = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(afterSparring.careerStatus).toBe("recreational");
  expect(afterSparring.week).toBe(7);
  await page.locator("#calendar-dialog-done").click();
  await expect(page.locator("#week-event-dialog")).toBeVisible();
  await page.locator("#week-event-choices button:not([disabled])").first().click();
  await expect(page.locator('[data-action="group-class"]')).toBeVisible();
  await page.locator("#open-calendar").click();
  await expect(page.locator("#turn-amateur")).toBeVisible();
  await page.locator("#turn-amateur").click();

  await expect(page.locator("#fighter-meta")).toContainText("Amateur");
  await expect(page.locator("#week")).toHaveText("01");
  await expect(page.locator('[data-action="group-class"]')).toHaveCount(0);
  await page.locator("#open-calendar").click();
  await expect(page.locator("#calendar-events")).toContainText("Gala");
});

test("retire le travail, congédie après trois absences puis attend 1 à 3 semaines avant la nouvelle embauche", async ({ page }) => {
  test.setTimeout(60_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const snapshot = amateurSnapshot({
    careerStatus: "amateur",
    week: 12,
    money: 500,
    gymWeeks: 20,
    jobId: "convenience",
    jobsHeldCount: 1,
    missedWorkWeeks: 0,
    jobTenureWeeks: 4,
    jobWagesEarned: 300,
  });
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(value));
  }, snapshot);
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  const missWorkWeek = async expectedAbsences => {
    await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
    await page.locator("[data-v2-toggle-work]").click();
    await expect(page.locator(".v2-work-management")).toContainText("aucune paie");
    await page.locator("[data-v2-close-location]").click();
    await page.locator(".v2-week-launcher [data-v2-week-confirm]").click();
    await expect(page.locator(".v2-week-summary")).toBeVisible();
    await expect(page.locator(".v2-week-summary")).toContainText(expectedAbsences < 2 ? "Première absence" : expectedAbsences === 2 ? "Dernier avertissement" : "Emploi perdu");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
    if (expectedAbsences < 3) {
      expect(saved.state.jobId).toBe("convenience");
      expect(saved.state.missedWorkWeeks).toBe(expectedAbsences);
    } else {
      expect(saved.state.jobId).toBeNull();
      expect(saved.state.missedWorkWeeks).toBe(0);
    }
    await page.locator("[data-v2-week-summary-close]").click();
  };

  await missWorkWeek(1);
  await missWorkWeek(2);
  await missWorkWeek(3);
  await expect(page.locator("#job-loss-dialog")).toBeVisible();
  await expect(page.locator("#job-loss-copy")).toContainText("trois absences consécutives");
  await page.locator("#job-loss-acknowledge").click();

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await page.locator("[data-v2-open-job-menu]").click();
  await page.locator('#job-options [data-select-job="warehouse"]').click();
  await expect(page.locator("#job-dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: /Entrer : Emploi/ })).toHaveAccessibleName(/Candidature en cours/);

  for (let elapsed = 1; elapsed <= 3; elapsed += 1) {
    await page.locator(".v2-week-launcher [data-v2-week-confirm]").click();
    await expect(page.locator(".v2-week-summary")).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
    if (elapsed < 3) {
      expect(saved.state.jobId).toBeNull();
      expect(saved.state.jobApplication.progress).toBe(elapsed);
      expect(saved.state.jobApplication.requiredWeeks).toBe(3);
    } else {
      expect(saved.state.jobId).toBe("warehouse");
      expect(saved.state.jobApplication).toBeNull();
    }
    await page.locator("[data-v2-week-summary-close]").click();
  }
});

test("propose les quatre forfaits de musculation et débloque les exercices dès le statut récréatif", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    careerStatus: "recreational",
    careerStartDate: "2026-09-07",
    week: 2,
    money: 1000,
    gymWeeks: 4,
    jobId: "courier",
    introJobRequired: false,
    initialGymRequired: false,
    recreationalTrainingWeeks: 1,
  }));

  await expect(page.locator(".strength-membership-panel")).toBeVisible();
  await expect(page.locator('[data-action="strength-power"]')).toHaveCount(0);
  await page.locator("#strength-membership-button").click();
  await expect(page.locator("#strength-membership-dialog")).toBeVisible();
  await expect(page.locator("#strength-membership-options [data-strength-gym-plan]")).toHaveCount(4);
  await expect(page.locator('[data-strength-gym-plan="monthly"]')).toContainText("95 $");
  await expect(page.locator('[data-strength-gym-plan="three-months"]')).toContainText("270 $");
  await expect(page.locator('[data-strength-gym-plan="six-months"]')).toContainText("510 $");
  await expect(page.locator('[data-strength-gym-plan="yearly"]')).toContainText("960 $");
  await page.locator('[data-strength-gym-plan="monthly"]').click();
  await expect(page.locator("#strength-membership-dialog")).not.toBeVisible();
  await expect(page.locator('[data-action="strength-power"]')).toBeVisible();
  await expect(page.locator('[data-action="strength-circuit"]')).toBeVisible();
});

test("protège le budget du premier GYM de boxe contre les dépenses de musculation", async ({ page }) => {
  await openFreshCareer(page);
  await createCareer(page, { firstName: "Mia", lastName: "Budget" });
  await page.locator('[data-select-job="convenience"]').click();
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.initialGymRequired).toBe(true);

  await page.locator("#strength-membership-button").click();
  await expect(page.locator('[data-strength-gym-plan="monthly"]')).toBeEnabled();
  await expect(page.locator('[data-strength-gym-plan="six-months"]')).toBeDisabled();
  await expect(page.locator("#strength-membership-dialog-copy")).toContainText("réservés pour le premier mois obligatoire du GYM de boxe");
  await page.locator('[data-strength-gym-plan="monthly"]').click();

  await expect(page.locator('[data-buy-supplement="protein-tub"]')).toBeDisabled();
  await expect(page.locator("#strength-gym-services")).toContainText("réservés pour le premier mois du GYM de boxe");
  await page.locator("#membership-button").click();
  await page.locator('[data-gym-plan="monthly"]').click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.money).toBe(15);
  expect(saved.initialGymRequired).toBe(false);
  expect(saved.gymWeeks).toBe(4);
});

test("débloque les vacances payées après huit semaines dans le même emploi", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    week: 2,
    money: 250,
    gymWeeks: 4,
    jobId: "courier",
    jobTenureWeeks: 7,
    initialGymRequired: false,
  }));

  const vacation = page.locator('[data-action="vacation"]');
  await expect(vacation).toBeDisabled();
  await expect(vacation).toContainText("Prochaine semaine de vacances dans 1 semaine");
  await page.locator('[data-action="work"]').click();
  await page.locator("#advance-week").click();
  await expect(page.locator("#summary-dialog")).toBeVisible();
  await page.locator("#summary-close").click();
  await expect(page.locator("#week-event-dialog")).toBeVisible();
  await page.locator("#week-event-choices button:not([disabled])").first().click();

  await expect(vacation).toBeEnabled();
  const moneyBeforeVacation = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state.money);
  await vacation.click();
  await page.locator('[data-action="rest"]').click();
  await page.locator('[data-action="gym"]').click();
  await page.locator('[data-action="video"]').click();
  await expect(page.locator("#plan-count")).toContainText("3 / 3 actions · + vacances");
  await page.locator("#advance-week").click();
  await expect(page.locator("#summary-dialog")).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.money).toBe(moneyBeforeVacation + 100);
  expect(saved.jobVacationEarnedAtTenure).toBe(8);
  expect(saved.vacationBankWeeks).toBe(0);
  expect(saved.missedWorkWeeks).toBe(0);
  await expect(page.locator("#summary-content")).toContainText("Vacances payées");
});

test("verse l’indemnité de vacances de 4 % lors d’un congédiement avec une banque active", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    week: 2,
    money: 250,
    jobId: "courier",
    missedWorkWeeks: 2,
    jobTenureWeeks: 8,
    jobVacationEarnedAtTenure: 8,
    vacationBankWeeks: 1,
    jobWagesEarned: 1000,
    initialGymRequired: false,
  }));

  await page.locator('[data-action="rest"]').click();
  await page.locator("#advance-week").click();
  await expect(page.locator("#summary-content")).toContainText("Indemnité de vacances : +40 $");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.money).toBe(290);
  expect(saved.jobId).toBeNull();
  expect(saved.vacationBankWeeks).toBe(0);
});

test("ouvre le menu de test caché depuis la tuile à venir et restaure la carrière", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({ money: 333, gymWeeks: 4, initialGymRequired: false }));
  const hiddenTile = page.locator('[data-action="drug-sales"]');
  await expect(hiddenTile).toBeVisible();
  for (let click = 0; click < 5; click += 1) await hiddenTile.click();
  await expect(page.locator("#developer-code-dialog")).toBeVisible();
  await page.locator("#developer-code-input").fill("127");
  await page.locator("#developer-code-form").press("Enter");
  await expect(page.locator("#developer-code-error")).toHaveText("Code invalide.");
  await page.locator("#developer-code-input").fill("128");
  await page.locator("#developer-code-form").press("Enter");
  await expect(page.locator("#developer-test-dialog")).toBeVisible();
  await expect(page.locator("[data-developer-preset]")).toHaveCount(8);
  await page.locator('[data-developer-tool="funds"]').click();
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.money).toBe(9999);
  await page.locator('[data-developer-tool="recover"]').click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.energy).toBe(100);
  expect(saved.fatigue).toBe(0);
  expect(saved.injury).toBe(0);
  await page.locator('[data-developer-tool="next-week"]').click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.week).toBe(2);
  await page.locator('[data-developer-corner="purple"]').click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.profile.corner).toBe("purple");
  await page.locator('[data-developer-corner="pink"]').click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.profile.corner).toBe("pink");
  await page.locator('[data-developer-preset="bronze-ready"]').click();

  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.week).toBe(15);
  expect(saved.amateurRecord.wins + saved.amateurRecord.losses).toBe(5);
  expect(saved.profile.lastName).toBe("Test");

  for (let click = 0; click < 5; click += 1) await page.locator('[data-action="drug-sales"]').click();
  await page.locator("#developer-code-input").fill("128");
  await page.locator("#developer-code-form").press("Enter");
  await page.locator('[data-developer-preset="pro-ready"]').click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.careerStatus).toBe("professional");
  expect(saved.professionalRecord.wins).toBe(6);
  expect(saved.profile.corner).toBe("green");

  for (let click = 0; click < 5; click += 1) await page.locator('[data-action="drug-sales"]').click();
  await page.locator("#developer-code-input").fill("128");
  await page.locator("#developer-code-form").press("Enter");
  await expect(page.locator("#developer-return-career")).toBeVisible();
  await page.locator("#developer-return-career").click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.money).toBe(9999);
  expect(saved.profile.lastName).toBe("Amateur");
  expect(saved.profile.corner).toBe("pink");
  expect(saved.week).toBe(2);
});

test("lance immédiatement le sparring et le combat développeur sans altérer la carrière", async ({ page }) => {
  test.setTimeout(90_000);
  await openStoredCareer(page, amateurSnapshot({
    money: 487,
    energy: 41,
    fatigue: 37,
    injury: 12,
    gymWeeks: 4,
    jobId: "courier",
    initialGymRequired: false,
    journal: [{ week: 1, text: "Repère immuable du test développeur." }],
  }));

  const hiddenTile = page.locator('[data-action="drug-sales"]');
  for (let activation = 0; activation < 5; activation += 1) await hiddenTile.click();
  await page.locator("#developer-code-input").fill("128");
  await page.locator("#developer-code-form").press("Enter");
  await expect(page.locator("#developer-test-dialog")).toBeVisible();
  await expect(page.locator('[data-developer-tool="test-sparring"]')).toContainText("Sparring immédiat");
  await expect(page.locator('[data-developer-tool="test-fight"]')).toContainText("Combat immédiat");

  const careerBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));

  await page.locator('[data-developer-tool="test-sparring"]').click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-week-label")).toContainText("Sparring immédiat · mode développeur");
  await expect(page.locator("#fight-opponent-name")).toContainText("Banc d’essai");
  await completeFight(page);
  await expect(page.locator("#fight-score-label")).toHaveText("Sparring non comptabilisé");
  await expect(page.locator("#fight-instruction")).toContainText("la carrière, le bilan, les jauges et le calendrier sont restés intacts");
  await page.locator("#fight-instruction button.primary-button", { hasText: "Retour au menu test" }).click();
  await expect(page.locator("#developer-test-dialog")).toBeVisible();

  let careerAfter = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  expect(careerAfter.state).toEqual(careerBefore.state);
  expect(careerAfter.weeklyPlan).toEqual(careerBefore.weeklyPlan);

  await page.locator('[data-developer-tool="test-fight"]').click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-week-label")).toContainText("Combat immédiat · mode développeur");
  await completeFight(page);
  await expect(page.locator("#fight-instruction")).toContainText("la carrière, le bilan, les jauges et le calendrier sont restés intacts");
  await page.locator("#fight-instruction button.primary-button", { hasText: "Retour au menu test" }).click();
  await expect(page.locator("#developer-test-dialog")).toBeVisible();

  careerAfter = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  expect(careerAfter.state).toEqual(careerBefore.state);
  expect(careerAfter.weeklyPlan).toEqual(careerBefore.weeklyPlan);
});

test("évite la double paie, limite le repos inutile et rétablit le rythme de boxe", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    jobId: "courier",
    vacationBankWeeks: 1,
    jobTenureWeeks: 8,
    gymWeeks: 4,
    initialGymRequired: false,
  }));
  await page.locator('[data-action="work"]').click();
  await expect(page.locator('[data-action="vacation"]')).toBeDisabled();
  await expect(page.locator('[data-action="vacation"]')).toContainText("remplacent le travail");

  await openStoredCareer(page, amateurSnapshot({
    energy: 100,
    fitness: 10,
    fatigue: 0,
    injury: 0,
    injuryWeeks: 0,
    boxingInactivityWeeks: 3,
    gymWeeks: 4,
    initialGymRequired: false,
  }));
  await expect(page.locator('[data-action="rest"]')).toBeDisabled();
  await expect(page.locator('[data-action="rest"]')).toContainText("déjà frais et intact");
  await expect(page.locator('[data-action="gym"]')).toBeEnabled();
  await expect(page.locator('[data-action="gym"]')).toContainText("Reprise progressive");
  await expect(page.locator('[data-action="sparring"]')).toBeDisabled();
  await expect(page.locator("#action-limit-help")).toContainText("Rythme faible");
  await expect(page.locator("#action-pips span")).toHaveCount(1);
  await page.locator('[data-action="gym"]').click();
  await page.locator("#advance-week").click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.boxingInactivityWeeks).toBe(0);
});

test("met en avant les montées de niveau et les congédiements", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({ experience: 95, gymWeeks: 4, initialGymRequired: false }));
  await page.locator('[data-action="gym"]').click();
  await page.locator("#advance-week").click();
  await page.locator("#summary-close").click();
  await expect(page.locator("#level-up-dialog")).toBeVisible();
  await expect(page.locator("#level-up-title")).toContainText("Niveau 2 atteint");
  await page.locator("#level-up-allocate").click();
  await expect(page.locator("#level-dialog")).toBeVisible();
  for (let point = 0; point < 3; point += 1) await page.locator("#level-choices [data-level-stat]:not([disabled])").first().click();
  await expect(page.locator("#level-dialog")).not.toBeVisible();
  await expect(page.locator("#week-event-dialog")).toBeVisible();
});

test("fait progresser une candidature seulement avec les entrevues et garantit l’embauche", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    jobId: null,
    jobsHeldCount: 1,
    introJobRequired: false,
    initialGymRequired: false,
  }));
  await page.locator("#open-job-menu").click();
  await page.locator('[data-select-job="warehouse"]').click();
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.jobId).toBeNull();
  expect(saved.jobApplication).toMatchObject({ jobId: "warehouse", progress: 0, requiredWeeks: 3, offerReady: false });
  await expect(page.locator('[data-action="interview"]')).toBeVisible();

  async function finishWeek() {
    await page.locator("#advance-week").click();
    await expect(page.locator("#summary-dialog")).toBeVisible();
    await page.locator("#summary-close").click();
    await expect(page.locator("#week-event-dialog")).toBeVisible();
    await page.locator("#week-event-choices button:not([disabled])").first().click();
  }

  await page.locator('[data-action="family"]').click();
  await finishWeek();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.jobApplication.progress).toBe(0);

  for (let interview = 1; interview <= 3; interview += 1) {
    await page.locator('[data-action="interview"]').click();
    await page.locator("#advance-week").click();
    await expect(page.locator("#summary-dialog")).toBeVisible();
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
    if (interview < 3) {
      expect(saved.jobId).toBeNull();
      expect(saved.jobApplication.progress).toBe(interview);
      await page.locator("#summary-close").click();
      await page.locator("#week-event-choices button:not([disabled])").first().click();
    }
  }
  expect(saved.jobId).toBe("warehouse");
  expect(saved.jobApplication).toBeNull();
});

test("affiche les deux divisions du même tournoi extérieur et le conseil du coach abonné", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    week: 9,
    money: 1000,
    gymWeeks: 4,
    amateurRecord: { wins: 4, losses: 0, draws: 0 },
  }));
  await page.locator("#open-calendar").click();
  const regionalCup = page.locator(".calendar-event", { hasText: "Coupe régionale des clubs" });
  await expect(regionalCup).toBeVisible();
  await expect(regionalCup).toContainText("Division Relève");
  await expect(regionalCup).toContainText("Division Ouverte");
  await expect(regionalCup.locator(".calendar-coach-advice")).toContainText("Conseil du coach");
  const noviceEntry = regionalCup.locator('[data-tournament-division="novice"]:not([disabled])').first();
  await expect(noviceEntry).toBeVisible();
  await noviceEntry.click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.bookings).toHaveLength(1);
  expect(saved.bookings[0].event.divisionId).toBe("novice");
  expect(saved.bookings[0].event.name).toContain("Division Relève");
});

test("réserve un gala et joue un combat tactique complet avant de révéler les trois cartes", async ({ page }) => {
  test.setTimeout(60_000);
  await openStoredCareer(page, amateurSnapshot({
    profile: { firstName: "Jade", lastName: "Decision", sex: "female", weightClass: "W57", style: "counter", corner: "blue" },
  }));
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
  await openStoredCareer(page, amateurSnapshot({
    profile: { firstName: "Mobile", lastName: "Test", sex: "male", weightClass: "M65", style: "balanced", corner: "blue" },
    jobId: "courier",
  }));

  const calendarMetrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(calendarMetrics.body).toBeLessThanOrEqual(calendarMetrics.viewport + 1);
  expect(calendarMetrics.document).toBeLessThanOrEqual(calendarMetrics.viewport + 1);
  const employmentMetrics = await page.locator("#employment").evaluate(element => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
  expect(employmentMetrics.scrollWidth).toBeLessThanOrEqual(employmentMetrics.clientWidth + 1);

  await page.locator("#open-calendar").click();
  await expect(page.locator("#calendar-dialog")).toBeVisible();
  await expect(page.locator("#calendar-dialog-done")).toBeVisible();
  await page.locator("#calendar-dialog-done").click();
  await expect(page.locator("#calendar-dialog")).not.toBeVisible();

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
  const tacticalTextFits = await tacticalButtons.evaluateAll(buttons => buttons.every(button => {
    const buttonBox = button.getBoundingClientRect();
    return [...button.children].every(child => {
      const childBox = child.getBoundingClientRect();
      return childBox.left >= buttonBox.left - 1 && childBox.right <= buttonBox.right + 1;
    });
  }));
  expect(tacticalTextFits).toBe(true);

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

test("guide une nouvelle carrière V2 sans permettre de contourner l’emploi ni le premier abonnement", async ({ page }) => {
  test.setTimeout(45_000);
  await page.addInitScript(() => localStorage.clear());
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await createCareer(page, { firstName: "Guide", lastName: "V2" });

  const jobDialog = page.locator("#job-dialog");
  await expect(jobDialog).toBeVisible();
  await expect(jobDialog).toHaveAttribute("data-mandatory", "true");
  await expect(page.locator("#job-dialog-close")).toBeHidden();
  await expect(page.locator("#job-dialog-cancel")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(jobDialog).toBeVisible();
  await expect(page.locator("#job-options [data-select-job]:not([disabled])")).toHaveCount(3);
  await page.locator("#job-options [data-select-job]").first().click();
  await expect(jobDialog).toBeHidden();

  const guideCard = page.locator(".v2-onboarding-card");
  await expect(guideCard).toContainText("T’inscrire au GYM de boxe");
  await expect(guideCard).toContainText("Obligatoire");
  await guideCard.locator('[data-v2-location="boxing-gym"]').click();
  await expect(page.locator(".v2-gym-view")).toBeVisible();
  await expect(page.locator(".v2-gym-access-lock")).toContainText("Inscription requise");
  await page.locator('[data-v2-gym-zone="reception"]').first().click();

  const membershipDialog = page.locator("#membership-dialog");
  await expect(membershipDialog).toBeVisible();
  await expect(membershipDialog).toHaveAttribute("data-mandatory", "true");
  await expect(page.locator("#membership-dialog-close")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(membershipDialog).toBeVisible();
  await page.locator("#membership-options [data-gym-plan]").first().click();
  await expect(membershipDialog).toBeHidden();
  await expect(page.locator("[data-v2-coach-session]")).toBeEnabled();
  await expect(page.locator(".v2-gym-path")).toContainText("Rémy « Le Tank »");

  await page.locator("[data-v2-leave-gym]").click();
  await expect(page.locator(".v2-onboarding-card")).toContainText("Faire une première séance");
  await expect(page.locator(".v2-onboarding-card")).toContainText("Facultatif");

  await page.locator('.v2-onboarding-card [data-v2-location="boxing-gym"]').click();
  await page.locator("[data-v2-coach-session]").click();
  await page.locator("[data-v2-leave-gym]").click();
  await expect(page.locator(".v2-onboarding-card")).toContainText("Ta première séance est planifiée");
  await expect(page.locator(".v2-onboarding-card")).toContainText("Rien n’est encore appliqué");
  await expect(page.locator(".v2-onboarding-card [data-v2-week-handoff]")).toHaveText("Voir mon programme");
  await expect(page.locator(".v2-onboarding-card [data-v2-week-confirm]")).toHaveText("Confirmer et vivre la semaine");

  await page.locator(".v2-onboarding-card [data-v2-week-handoff]").click();
  await expect(page.locator(".v2-week-plan")).toBeVisible();
  await expect(page.locator(".v2-week-engine-note")).toContainText("seront résolues seulement lorsque tu confirmeras");
  await page.locator("[data-v2-week-plan-close]").first().click();
  await page.locator(".v2-onboarding-card [data-v2-week-confirm]").click();
  await expect(page.locator(".v2-week-summary")).toBeVisible();
  await expect(page.locator(".v2-week-summary-guide")).toContainText("Comment lire ton premier bilan");
  await expect(page.locator("[data-v2-week-summary-close]")).toHaveText("Continuer vers la semaine 2");
  await page.locator("[data-v2-week-summary-close]").click();
  await expect(page.locator(".v2-onboarding-card")).toContainText("Essayer un cours de groupe");

  await page.locator('[data-v2-nav="fighter"]').click();
  await expect(page.locator(".v2-fighter-view")).toBeVisible();
  await expect(page.locator('.v2-fighter-stat [role="progressbar"]')).toHaveCount(4);
  await expect(page.locator(".v2-fighter-identity dd.money")).toContainText("185 $");
});

test("joue le sparring interactif de Rémy en V2 sans modifier le bilan puis confirme le statut amateur", async ({ page }) => {
  test.setTimeout(60_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const snapshot = recreationalReadySnapshot();
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(value));
  }, snapshot);
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await expect(page.locator("[data-v2-remy-sparring]")).toBeVisible();
  await page.locator("[data-v2-remy-sparring]").click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-week-label")).toContainText("Rémy « Le Tank »");
  await completeFight(page);
  await expect(page.locator("#fight-score-label")).toHaveText("Sparring non comptabilisé");
  await expect(page.locator("#fight-score")).toHaveText("—");
  await expect(page.locator("#fight-instruction")).toContainText("Ce que Rémy veut te montrer");

  const storedAfterSparring = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  expect(storedAfterSparring.state.amateurRecord).toEqual({ wins: 0, losses: 0, draws: 0 });
  expect(storedAfterSparring.state.recreationalSparringStatus).toBe("completed");
  await page.locator("#fight-instruction button.primary-button", { hasText: "Voir le parcours récréatif" }).click();
  await expect(page.locator(".v2-gym-path")).toContainText("Évaluation terminée");
  await page.locator("[data-v2-amateur-transition]").click();

  await expect(page.locator("#v2-world")).toBeVisible();
  await expect(page.locator(".v2-onboarding-card")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Entrer : Aréna/ })).toHaveAccessibleName(/Événements disponibles/);
  const storedAmateur = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  expect(storedAmateur.state.careerStatus).toBe("amateur");
  expect(storedAmateur.state.week).toBe(1);
  expect(storedAmateur.state.amateurRecord).toEqual({ wins: 0, losses: 0, draws: 0 });

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await expect(page.locator('[data-v2-sparring-activity="cta"]')).toBeEnabled();
  await page.locator('[data-v2-sparring-activity="cta"]').click();
  await expect(page.locator("#fight-dialog")).not.toBeVisible();
  await expect(page.locator('[data-v2-sparring-activity="cta"]')).toContainText("Retirer de ma semaine");
  let plannedPractice = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(plannedPractice.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "sparring" && !entry.metadata?.completed)).toBe(true);
  const beforePracticeTime = plannedPractice.timeState;
  await page.locator("[data-v2-leave-gym]").click();
  await page.locator("[data-v2-week-confirm]").click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-week-label")).toContainText("Sparring technique");
  await completeFight(page);
  await expect(page.locator("#fight-score-label")).toHaveText("Sparring non comptabilisé");
  await expect(page.locator("#fight-instruction")).toContainText("aucune victoire ni défaite");
  await page.locator("#fight-instruction button.primary-button", { hasText: "Retour au GYM" }).click();
  await expect(page.locator(".v2-gym-view")).toBeVisible();
  let afterPractice = await page.evaluate(() => ({
    career: JSON.parse(localStorage.getItem("boxeur-deux-career-v2")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")),
  }));
  expect(afterPractice.career.state.amateurRecord).toEqual({ wins: 0, losses: 0, draws: 0 });
  expect(afterPractice.capsule.timeState.history.some(event => event.activityCategory === "sparring")).toBe(true);
  expect(afterPractice.capsule.timeState.clock.absoluteSlot).toBeGreaterThan(beforePracticeTime.clock.absoluteSlot);
  expect(afterPractice.capsule.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "sparring" && entry.metadata?.completed)).toBe(true);

  await page.locator("[data-v2-leave-gym]").click();
  await page.locator("[data-v2-week-confirm]").click();
  await expect(page.locator(".v2-week-summary")).toBeVisible();
  afterPractice = await page.evaluate(() => ({
    career: JSON.parse(localStorage.getItem("boxeur-deux-career-v2")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")),
  }));
  expect(afterPractice.career.state.week).toBe(2);
});

test("cadre la carte V2 sur ordinateur et téléphone et synchronise la sauvegarde compatible", async ({ page }) => {
  test.setTimeout(75_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const original = amateurSnapshot({
    profile: { firstName: "Carte", lastName: "V2", sex: "female", weightClass: "W57", style: "balanced", corner: "pink" },
    jobId: "courier",
    gymWeeks: 3,
  });
  await page.evaluate(snapshot => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(snapshot));
  }, original);
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  await expect(page.locator("body")).toHaveClass(/v2-preview/);
  await expect(page.locator("#v2-world")).toBeVisible();
  await expect(page.locator("#v2-world .v2-map-hotspot")).toHaveCount(5);
  await expect(page.locator("#v2-world .v2-map-canvas img")).toHaveJSProperty("complete", true);
  await expect(page.locator("#v2-world h2").first()).toContainText("Carte");
  await expect(page.locator("#game > .topbar")).toBeHidden();
  const desktopMap = await page.locator(".v2-map-canvas").boundingBox();
  expect(desktopMap.width / desktopMap.height).toBeGreaterThan(1.6);
  const gymOpener = page.getByRole("button", { name: /Entrer : GYM de boxe/ }).first();
  await gymOpener.click();
  const locationSheet = page.locator(".v2-location-sheet");
  await expect(locationSheet).toBeVisible();
  await expect(locationSheet).toHaveAttribute("role", "dialog");
  await expect(locationSheet).toHaveAttribute("aria-modal", "true");
  expect(await locationSheet.evaluate(sheet => {
    const label = sheet.getAttribute("aria-labelledby");
    return Boolean(label && document.getElementById(label)?.textContent.trim());
  })).toBe(true);
  expect(await page.locator(".v2-world-layout").evaluate(element => element.inert)).toBe(true);
  const gymDialogButtons = locationSheet.locator("button:not([disabled])");
  await gymDialogButtons.last().focus();
  await page.keyboard.press("Tab");
  await expect(gymDialogButtons.first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(locationSheet).toBeHidden();
  await expect(gymOpener).toBeFocused();
  expect(await page.locator(".v2-world-layout").evaluate(element => element.inert)).toBe(false);
  await gymOpener.click();
  await expect(page.locator(".v2-gym-view")).toBeVisible();
  await expect(page.locator(".v2-gym-view")).toContainText(/travail aux mitaines/i);
  await expect(page.locator(".v2-gym-floor img")).toHaveJSProperty("complete", true);
  await expect(page.locator('[data-v2-sparring-state="available"]')).toContainText("Activité distincte");
  await expect(page.locator('[data-v2-sparring-activity="cta"]')).toBeEnabled();

  const timeBeforeGymDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")).timeState);
  await page.locator("[data-v2-coach-session]").click();
  await expect(page.locator(".v2-gym-view")).toContainText(/planifié|programme/i);
  let v2Capsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(v2Capsule.timeState).toEqual(timeBeforeGymDraft);
  expect(v2Capsule.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "boxing-coach")).toBe(true);

  await page.locator("[data-v2-compose-session]").click();
  await expect(page.locator('[data-v2-exercise="sparring"]')).toHaveCount(0);
  await expect(page.locator("[data-v2-confirm-session]")).toBeDisabled();
  await page.locator('[data-v2-session-preset="technique"]').click();
  await expect(page.locator('.v2-session-structure .complete')).toHaveCount(3);
  await expect(page.locator("[data-v2-confirm-session]")).toBeEnabled();
  await page.locator("[data-v2-confirm-session]").click();
  await expect(page.locator(".v2-gym-view")).toBeVisible();
  v2Capsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(v2Capsule.timeState).toEqual(timeBeforeGymDraft);
  expect(v2Capsule.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "boxing-custom")).toBe(true);
  await page.locator("[data-v2-leave-gym]").click();

  await page.locator('[data-v2-nav="inventory"]').click();
  await expect(page.locator(".v2-inventory-view")).toBeVisible();
  await expect(page.locator(".v2-inventory-view")).toContainText("Ton inventaire est vide");
  await page.locator("[data-v2-close-inventory]").click();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator(".v2-map-canvas img").evaluate(image => image.currentSrc)).toContain("carte-quartier-v2-mobile.jpg");
  const mobileMetrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    currentImage: document.querySelector(".v2-map-canvas img").currentSrc,
  }));
  expect(mobileMetrics.body).toBeLessThanOrEqual(mobileMetrics.viewport + 1);
  expect(mobileMetrics.document).toBeLessThanOrEqual(mobileMetrics.viewport + 1);
  expect(mobileMetrics.currentImage).toContain("carte-quartier-v2-mobile.jpg");
  const mobileMap = await page.locator(".v2-map-canvas").boundingBox();
  expect(mobileMap.height / mobileMap.width).toBeGreaterThan(0.98);
  expect(mobileMap.height / mobileMap.width).toBeLessThan(1.02);
  const objectiveButton = await page.locator(".v2-objective-card [data-v2-location]").boundingBox();
  expect(objectiveButton && objectiveButton.y).toBeLessThan(844);
  for (const button of await page.locator(".v2-map-hotspot, .v2-world-nav button").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await expect.poll(() => page.locator(".v2-gym-floor img").evaluate(image => image.currentSrc)).toContain("gym-boxe-v2-mobile.jpg");
  await expect(page.locator(".v2-gym-hotspot")).toHaveCount(4);
  const gymMetrics = await page.locator(".v2-gym-view").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(gymMetrics.scrollWidth).toBeLessThanOrEqual(gymMetrics.clientWidth + 1);
  for (const button of await page.locator(".v2-gym-hotspot").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator("[data-v2-coach-session]").scrollIntoViewIfNeeded();
  const mobileCoachButton = await page.locator("[data-v2-coach-session]").boundingBox();
  expect(mobileCoachButton && mobileCoachButton.height).toBeGreaterThanOrEqual(44);
  await page.locator('[data-v2-sparring-activity="cta"]').scrollIntoViewIfNeeded();
  const mobileSparringButton = await page.locator('[data-v2-sparring-activity="cta"]').boundingBox();
  expect(mobileSparringButton && mobileSparringButton.height).toBeGreaterThanOrEqual(44);
  await page.locator("[data-v2-leave-gym]").click();

  await page.getByRole("button", { name: /Entrer : Maison/ }).click();
  await expect(page.locator(".v2-home-view")).toBeVisible();
  await expect(page.locator(".v2-home-hotspot")).toHaveCount(4);
  await expect.poll(() => page.locator(".v2-home-scene img").evaluate(image => image.currentSrc)).toContain("maison-v2-mobile.jpg");
  const mobileHomeScene = await page.locator(".v2-home-scene").boundingBox();
  expect(mobileHomeScene.height / mobileHomeScene.width).toBeGreaterThan(0.98);
  expect(mobileHomeScene.height / mobileHomeScene.width).toBeLessThan(1.02);
  const homeMetrics = await page.locator(".v2-home-view").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(homeMetrics.scrollWidth).toBeLessThanOrEqual(homeMetrics.clientWidth + 1);
  for (const button of await page.locator(".v2-home-hotspot").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(43.9);
  }
  const firstHomeAction = await page.locator(".v2-home-actions [data-v2-home-action]").first().boundingBox();
  expect(firstHomeAction && firstHomeAction.y + firstHomeAction.height).toBeLessThanOrEqual(844);
  const kitchenHotspot = page.locator('[data-v2-home-zone="kitchen"]');
  await expect(kitchenHotspot).not.toHaveAttribute("aria-disabled", "true");
  expect(await kitchenHotspot.getAttribute("disabled")).toBeNull();
  await kitchenHotspot.focus();
  await expect(kitchenHotspot).toBeFocused();

  const beforeRestDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  const restButton = page.locator('.v2-home-actions [data-v2-home-action="rest"]');
  await restButton.click();
  await expect(restButton).toHaveAttribute("aria-pressed", "true");
  const afterRestDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(afterRestDraft.timeState).toEqual(beforeRestDraft.timeState);
  expect(afterRestDraft.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "rest")).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator(".v2-location-sheet")).toBeHidden();
  await expect(page.getByRole("button", { name: /Entrer : Maison/ }).first()).toBeFocused();

  for (const viewport of [
    { width: 360, height: 800 },
    { width: 844, height: 390 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const fit = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(fit.body, `débordement du body à ${viewport.width} × ${viewport.height}`).toBeLessThanOrEqual(fit.viewport + 1);
    expect(fit.document, `débordement du document à ${viewport.width} × ${viewport.height}`).toBeLessThanOrEqual(fit.viewport + 1);
  }

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  expect(stored.state.amateurRecord).toEqual(original.state.amateurRecord);
  expect(stored.state.money).toBe(original.state.money);
  expect(stored.state.week).toBe(original.state.week);
  expect(stored.state.energy).toBe(original.state.energy);
  expect(stored.state.fatigue).toBe(original.state.fatigue);
  expect(stored.state.v2WeekPlannerState.entries.some(entry => entry.activityId === "boxing-custom")).toBe(true);
  expect(stored.state.v2WeekPlannerState.entries.some(entry => entry.activityId === "rest")).toBe(true);
});

test("compose la semaine à la Maison et joue à la V1 sans faire avancer le temps", async ({ page }) => {
  test.setTimeout(45_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const snapshot = amateurSnapshot({
    profile: { firstName: "Maison", lastName: "Quotidienne" },
    energy: 78,
    fatigue: 9,
    gymWeeks: 2,
    initialGymRequired: false,
  });
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(value));
  }, snapshot);
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  const migrationDialog = page.locator("#division-migration-dialog");
  if (await migrationDialog.isVisible()) {
    await migrationDialog.getByRole("button", { name: "Confirmer et continuer" }).click();
  }

  await page.getByRole("button", { name: /Entrer : Maison/ }).click();
  const home = page.locator(".v2-home-view");
  await expect(home).toBeVisible();
  await expect(home.locator(".v2-home-action-group-physical")).toContainText("S'entraîner à la maison");
  await expect(home.locator(".v2-home-week-plan")).toContainText(/énergie hebdomadaire/i);
  await expect(home).toContainText("Les nuits restent automatiques");

  const beforeClassic = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  await home.locator('.v2-home-actions [data-v2-home-action="play-v1"]').click();
  await expect(page.locator(".v2-classic-computer")).toBeVisible();
  await expect(page.locator(".v2-classic-computer")).toContainText("ne fait pas avancer son temps");
  await expect(page.locator(".v2-classic-monitor iframe")).toHaveAttribute("src", /\?classic=1&arcade=1/);
  const afterClassic = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(afterClassic.timeState).toEqual(beforeClassic.timeState);

  await page.locator("[data-v2-classic-close]").click();
  await expect(home).toBeVisible();
  const homeQuick = home.locator('.v2-home-actions [data-v2-home-action="home-quick"]');
  const capacityBefore = Number(await home.locator(".v2-home-week-plan meter").getAttribute("value"));
  await homeQuick.click();
  await expect(homeQuick).toHaveAttribute("aria-pressed", "false");
  await expect(home.locator(".v2-home-week-plan")).toContainText("Entraînement maison rapide");
  const capacityWithTraining = Number(await home.locator(".v2-home-week-plan meter").getAttribute("value"));
  expect(capacityWithTraining).toBeLessThan(capacityBefore);

  const afterTrainingDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(afterTrainingDraft.timeState).toEqual(beforeClassic.timeState);
  expect(afterTrainingDraft.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "home-quick")).toBe(true);

  await home.locator(".v2-home-planned-list", { hasText: "Entraînement maison rapide" }).getByRole("button", { name: "Retirer" }).click();
  await expect(homeQuick).toHaveAttribute("aria-pressed", "false");
  expect(Number(await home.locator(".v2-home-week-plan meter").getAttribute("value"))).toBe(capacityBefore);
  await homeQuick.click();
  await home.locator('.v2-home-actions [data-v2-home-action="rest"]').click();
  await home.locator('.v2-home-actions [data-v2-home-action="meal"]').click();
  await expect(home.locator('.v2-home-actions [data-v2-home-action="meal"]')).toHaveAttribute("aria-pressed", "true");
  await expect(home.locator('.v2-home-actions [data-v2-home-action="play-v1"]')).toBeEnabled();

  const beforeConfirmation = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career-v2")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")),
  }));
  expect(beforeConfirmation.main.state.money).toBe(snapshot.state.money);
  expect(beforeConfirmation.main.state.week).toBe(snapshot.state.week);
  expect(beforeConfirmation.capsule.timeState).toEqual(beforeClassic.timeState);

  await page.locator("[data-v2-leave-home]").click();
  await page.locator("[data-v2-week-confirm]").click();
  await expect(page.locator(".v2-week-summary")).toBeVisible();
  const afterConfirmation = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career-v2")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")),
  }));
  expect(afterConfirmation.main.state.week).toBe(snapshot.state.week + 1);
  expect(afterConfirmation.main.state.money).toBe(snapshot.state.money - 15);
  expect(afterConfirmation.capsule.previewRuntime.weeklySummaries[0].counts.training).toBe(1);
  expect(afterConfirmation.capsule.previewRuntime.weeklySummaries[0].actions.some(action => action.primitive?.plannerActivityId === "rest")).toBe(true);
  expect(afterConfirmation.capsule.previewRuntime.weeklySummaries[0].actions.some(action => action.primitive?.plannerActivityId === "meal")).toBe(true);
});

test("ouvre le menu développeur depuis Travail en V2 et restaure la vraie carrière", async ({ page }) => {
  test.setTimeout(45_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const original = amateurSnapshot({
    profile: { firstName: "Vraie", lastName: "Carrière", sex: "female", weightClass: "W57", corner: "pink" },
    careerStatus: "recreational",
    careerStartDate: "2026-09-07",
    week: 3,
    money: 333,
    energy: 38,
    fatigue: 62,
    gymWeeks: 2,
    jobId: "courier",
    recreationalTrainingWeeks: 2,
    recreationalSparringStatus: "training",
  });
  await page.evaluate(snapshot => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(snapshot));
  }, original);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  const secretTile = page.getByRole("button", { name: "Vente de stupéfiants — À venir" });
  await expect(secretTile).toBeVisible();
  await expect(secretTile).toContainText("Vente de stupéfiants");
  await expect(secretTile).toContainText("À venir");
  expect((await secretTile.boundingBox()).height).toBeGreaterThanOrEqual(44);
  const workFit = await page.locator('.v2-location-card[data-location="work"]').evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(workFit.scrollWidth).toBeLessThanOrEqual(workFit.clientWidth + 1);
  expect(workFit.documentWidth).toBeLessThanOrEqual(workFit.viewportWidth + 1);
  for (let activation = 0; activation < 5; activation += 1) await secretTile.click();

  await expect(page.locator("#developer-code-dialog")).toBeVisible();
  await page.locator("#developer-code-input").fill("128");
  await page.locator("#developer-code-form").press("Enter");
  await expect(page.locator("#developer-test-dialog")).toBeVisible();
  await expect(page.locator("[data-developer-preset]")).toHaveCount(8);

  await page.locator('[data-developer-tool="funds"]').click();
  await expect(page.locator("#v2-world")).toContainText("9999 $");
  await page.locator('[data-developer-tool="recover"]').click();
  await expect(page.locator(".v2-vitals")).toContainText("100 %");
  await expect(page.locator(".v2-vitals")).toContainText("0 %");
  let capsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(capsule.timeState.condition.energy).toBe(100);
  expect(capsule.timeState.condition.fatigue).toBe(0);

  await page.locator('[data-developer-preset="bronze-ready"]').click();
  await expect(page.locator(".v2-test-mode-banner")).toBeVisible();
  await expect(page.locator(".v2-test-mode-banner")).toContainText("Mode test actif");
  await expect(page.locator(".v2-test-mode-banner")).toContainText("Alex Test");
  await expect(page.locator("[data-v2-restore-career]")).toBeVisible();
  const bannerFit = await page.locator(".v2-test-mode-banner").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(bannerFit.scrollWidth).toBeLessThanOrEqual(bannerFit.clientWidth + 1);
  capsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(capsule.legacySnapshot.state.profile.lastName).toBe("Test");
  expect(capsule.legacySnapshot.state.week).toBe(15);

  await page.locator("[data-v2-restore-career]").click();
  await expect(page.locator(".v2-test-mode-banner")).toHaveCount(0);
  const restored = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career-v2")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")),
    active: localStorage.getItem("boxeur-deux-career-v2-dev-active"),
    backup: localStorage.getItem("boxeur-deux-career-v2-dev-return"),
    overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth,
  }));
  expect(restored.main.state.profile.firstName).toBe("Vraie");
  expect(restored.main.state.profile.lastName).toBe("Carrière");
  expect(restored.main.state.money).toBe(9999);
  expect(restored.main.state.energy).toBe(100);
  expect(restored.capsule.legacySnapshot.state.profile.lastName).toBe("Carrière");
  expect(restored.active).toBeNull();
  expect(restored.backup).toBeNull();
  expect(restored.overflow).toBeLessThanOrEqual(1);
});

test("bloque clairement l’entraînement V2 pendant un repos médical", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const injured = amateurSnapshot({
    gymWeeks: 3,
    injury: 55,
    injuryWeeks: 2,
  });
  await page.evaluate(snapshot => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(snapshot));
  }, injured);
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await expect(page.locator(".v2-gym-readiness.critical")).toContainText("Repos médical");
  await expect(page.locator("[data-v2-coach-session]")).toBeDisabled();
  await expect(page.locator("[data-v2-compose-session]")).toBeDisabled();
  await expect(page.locator('[data-v2-gym-zone="training"]')).toBeDisabled();
  await expect(page.locator(".v2-gym-hotspot-reception")).toBeEnabled();
});

test("choisit un emploi, reçoit sa paie et perd le poste après trois absences", async ({ page }) => {
  test.setTimeout(45_000);
  await openFreshCareer(page);
  await createCareer(page, { firstName: "Sam", lastName: "Travail" });

  const workAction = page.locator('[data-action="work"]');
  await expect(workAction).toBeDisabled();
  await expect(workAction).toContainText("Choisis d’abord un emploi");
  await expect(page.locator("#job-dialog")).toBeVisible();
  await expect(page.locator("#job-options [data-select-job]")).toHaveCount(3);
  await page.locator('[data-select-job="courier"]').click();
  await expect(page.locator("#job-dialog")).not.toBeVisible();
  await expect(workAction).toBeEnabled();
  await expect(workAction).toContainText("100 $");

  await page.locator("#membership-button").click();
  await expect(page.locator("#membership-dialog")).toBeVisible();
  await expect(page.locator('#membership-options [data-gym-plan="monthly"]')).toBeVisible();
  await page.locator('#membership-options [data-gym-plan="monthly"]').click();
  await expect(page.locator("#membership-dialog")).not.toBeVisible();
  await expect(page.locator("#membership-status")).toContainText("GYM de boxe actif");

  await workAction.click();
  await page.locator("#advance-week").click();
  await expect(page.locator("#summary-dialog")).toBeVisible();
  await expect(page.locator("#summary-content")).toContainText("+100 $");
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")).state);
  expect(saved.money).toBe(210);
  expect(saved.jobId).toBe("courier");
  expect(saved.missedWorkWeeks).toBe(0);

  async function continueToNextWeek() {
    await page.locator("#summary-close").click();
    await expect(page.locator("#week-event-dialog")).toBeVisible();
    await expect(page.locator("#week-event-title")).toHaveText(/Les repères du GYM|Trouver son rythme|Les premières courbatures|Un conseil qui reste/);
    await page.locator("#week-event-choices button:not([disabled])").first().click();
    await expect(page.locator("#week-event-dialog")).not.toBeVisible();
  }

  await continueToNextWeek();
  for (let absence = 1; absence <= 3; absence += 1) {
    await page.locator('[data-action="home-bag"]').click();
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
      await page.locator("#summary-close").click();
      await expect(page.locator("#job-loss-dialog")).toBeVisible();
      await expect(page.locator("#job-loss-copy")).toContainText("Tu as perdu ton emploi");
    }
    if (absence < 3) await continueToNextWeek();
  }
});

test("migre une sauvegarde v3, recâble son combat réservé et impose le choix de division", async ({ page }) => {
  test.setTimeout(45_000);
  await openStoredCareer(page, legacyV3Snapshot());

  await page.locator("#open-calendar").click();
  await expect(page.locator("#scheduled-fight")).toContainText("Prochain combat programmé");
  await expect(page.locator("#division-migration-dialog")).not.toBeVisible();

  const migratedBeforeWithdrawal = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2")));
  expect(migratedBeforeWithdrawal.version).toBe(5);
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
  expect(migratedAfterChoice.version).toBe(5);
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

  await page.locator("#open-calendar").click();
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

test("reconstruit la capsule V2 depuis une carrière importée avant son premier rendu", async ({ page }) => {
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const previous = amateurSnapshot({
    profile: { firstName: "Sam", lastName: "Import", nickname: "Avant" },
    money: 900,
    gymWeeks: 3,
    jobId: "courier",
    jobsHeldCount: 1,
    jobTenureWeeks: 1,
    jobWagesEarned: 100,
    vacationBankWeeks: 0,
    experience: 110,
    level: 2,
    initialJobLockedUntilWeek: 2,
    recreationalTrainingWeeks: 1,
  });
  const imported = amateurSnapshot({
    profile: { firstName: "Sam", lastName: "Import", nickname: "Après" },
    money: 900,
    gymWeeks: 3,
    jobId: "courier",
    jobsHeldCount: 2,
    jobTenureWeeks: 6,
    jobWagesEarned: 575,
    vacationBankWeeks: 1,
    experience: 220,
    level: 2,
    initialJobLockedUntilWeek: 9,
    recreationalTrainingWeeks: 4,
  });
  await page.evaluate(snapshot => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(snapshot));
  }, previous);
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  const beforeImport = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(beforeImport.previewRuntime.career.experience).toBe(110);
  expect(beforeImport.previewRuntime.career.jobTenureWeeks).toBe(1);

  await page.locator("#import-career-file").setInputFiles({
    name: "carriere-importee.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(imported)),
  });
  await expect(page.locator("#toast")).toContainText("Carrière restaurée");
  const afterImport = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career-v2")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")),
  }));
  expect(afterImport.main.state.profile.nickname).toBe("Après");
  expect(afterImport.main.state.experience).toBe(220);
  expect(afterImport.main.state.jobTenureWeeks).toBe(6);
  expect(afterImport.main.state.jobWagesEarned).toBe(575);
  expect(afterImport.main.state.vacationBankWeeks).toBe(1);
  expect(afterImport.main.state.initialJobLockedUntilWeek).toBe(9);
  expect(afterImport.capsule.previewRuntime.career.experience).toBe(220);
  expect(afterImport.capsule.previewRuntime.career.jobTenureWeeks).toBe(6);
  expect(afterImport.capsule.previewRuntime.career.jobWagesEarned).toBe(575);
  expect(afterImport.capsule.previewRuntime.career.vacationBankWeeks).toBe(1);
  expect(afterImport.capsule.previewRuntime.career.initialJobLockedUntilWeek).toBe(9);
  expect(afterImport.capsule.previewRuntime.trainingSessions).toBe(4);
});

test("planifie musculation, entraîneur privé et supplément dans l’inventaire V2 sur PC et mobile", async ({ page }) => {
  test.setTimeout(60_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });

  const original = amateurSnapshot({
    profile: {
      firstName: "Morgan",
      lastName: "Force",
      nickname: "Le Moteur",
      sex: "female",
      weightClass: "W57",
      portraitId: 1,
      style: "balanced",
      corner: "blue",
    },
    careerStatus: "amateur",
    money: 2600,
    energy: 92,
    fatigue: 5,
    gymWeeks: 4,
    strengthGymWeeks: 0,
    jobId: "courier",
    combatStats: { technique: 45, power: 43, cardio: 44, defense: 44 },
  });
  await page.evaluate(snapshot => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(snapshot));
  }, original);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseURL}/?v2=1`, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  const strengthOpener = page.getByRole("button", { name: /Entrer : Gym de musculation/ }).first();
  await expect(strengthOpener).toHaveAccessibleName(/Abonnement facultatif/);
  await strengthOpener.click();
  const strengthView = page.locator(".v2-strength-view");
  await expect(strengthView).toBeVisible();
  await expect(strengthView).toHaveAttribute("data-v2-strength-access", "membership-required");
  await expect(page.locator("[data-v2-strength-plan]")).toHaveCount(4);
  await expect(page.locator('[data-v2-strength-plan="monthly"]')).toContainText("Choisir 1 mois");
  await expect(page.locator('[data-v2-strength-plan="monthly"]')).toBeEnabled();
  await expect(page.locator('.v2-strength-plan:has([data-v2-strength-plan="monthly"])')).toContainText("95 $");
  await expect(page.locator('.v2-strength-plan:has([data-v2-strength-plan="three-months"])')).toContainText("270 $");
  await expect(page.locator('.v2-strength-plan:has([data-v2-strength-plan="six-months"])')).toContainText("510 $");
  await expect(page.locator('.v2-strength-plan:has([data-v2-strength-plan="yearly"])')).toContainText("960 $");

  const desktopStrengthFit = await strengthView.evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(desktopStrengthFit.scrollWidth).toBeLessThanOrEqual(desktopStrengthFit.clientWidth + 1);
  expect(desktopStrengthFit.documentWidth).toBeLessThanOrEqual(desktopStrengthFit.viewportWidth + 1);

  await page.locator('[data-v2-strength-plan="monthly"]').click();
  await expect(strengthView).toHaveAttribute("data-v2-strength-access", "active");
  await expect(page.locator(".v2-strength-membership-current.active")).toContainText("Abonnement actif · 4 sem.");
  await expect(page.locator(".v2-strength-energy").first()).toContainText("92 % → 92 %");

  await page.locator("[data-v2-strength-trainer]").click();
  const trainerPanel = page.locator(".v2-trainer-panel");
  await expect(trainerPanel).toBeVisible();
  await expect(trainerPanel).toContainText("Préparateur privé");
  await expect(page.locator('[data-v2-trainer-target="power"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-v2-trainer-start]")).toHaveCount(3);
  await page.locator('[data-v2-trainer-start="club"]').click();
  await expect(page.locator(".v2-trainer-active")).toContainText("Mélanie Côté");
  await expect(page.locator(".v2-trainer-active")).toContainText("0/4 séances complétées");
  await page.locator("[data-v2-trainer-close]").click();
  await expect(page.locator(".v2-strength-service", { hasText: "Mélanie Côté" })).toBeVisible();

  await page.locator("[data-v2-strength-shop]").click();
  const supplementShop = page.locator(".v2-supplement-shop");
  await expect(supplementShop).toBeVisible();
  await expect(supplementShop).toContainText("Boutique de suppléments");
  const proteinBar = page.locator('[data-v2-supplement-buy="protein-bar"]');
  await expect(proteinBar).toBeEnabled();
  await proteinBar.click();
  await expect(page.locator('.v2-supplement-card:has([data-v2-supplement-buy="protein-bar"])')).toContainText("inventaire ×1");
  await page.locator('[data-v2-supplement-buy="protein-bar"]').click();
  await expect(page.locator('.v2-supplement-card:has([data-v2-supplement-buy="protein-bar"])')).toContainText("inventaire ×2");
  await page.locator("[data-v2-supplement-shop-close]").click();
  await expect(strengthView).toBeVisible();
  await expect(page.locator(".v2-strength-service", { hasText: "2 produits dans ton inventaire" })).toBeVisible();

  await page.locator('[data-v2-strength-activity="dynamic_warmup"]').first().click();
  await page.locator('[data-v2-strength-activity="upper_back_guard"]').first().click();
  await page.locator('[data-v2-strength-activity="mobility_cooldown"]').first().click();
  await expect(page.locator(".v2-strength-selection")).toContainText("3 activités");
  await expect(page.locator(".v2-strength-energy").first()).toContainText("92 % → 76 %");
  await expect(page.locator("#v2-strength-week-energy-title")).toHaveText("Énergie restante de la semaine");
  await expect(page.locator(".v2-strength-selection")).toContainText("Fatigue après");
  await expect(page.locator("[data-v2-strength-confirm]")).toBeEnabled();
  const beforeStrengthDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  await page.locator("[data-v2-strength-confirm]").click();
  await expect(strengthView).toBeVisible();
  let plannedServices = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(plannedServices.timeState).toEqual(beforeStrengthDraft.timeState);
  expect(plannedServices.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "strength-custom")).toBe(true);
  expect(plannedServices.previewRuntime.career.v2SupplementState.inventory["protein-bar"]).toBe(2);

  await page.locator("[data-v2-strength-trainer]").click();
  await expect(page.locator(".v2-trainer-active")).toContainText("0/4 séances complétées");
  await expect(page.locator("[data-v2-trainer-session]")).toBeEnabled();
  await page.locator("[data-v2-trainer-session]").click();
  await expect(strengthView).toBeVisible();
  plannedServices = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  expect(plannedServices.timeState).toEqual(beforeStrengthDraft.timeState);
  expect(plannedServices.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "private-training")).toBe(true);
  expect(plannedServices.previewRuntime.career.v2TrainerState.activeProgram.sessionsCompleted).toBe(0);
  expect(plannedServices.previewRuntime.career.money).toBe(2425);
  await page.locator("[data-v2-leave-strength-gym]").click();
  await expect(page.locator(".v2-now-money")).toContainText("2425 $");
  const moneyColor = await page.locator(".v2-now-money").evaluate(element => getComputedStyle(element).color);
  const moneyChannels = (moneyColor.match(/\d+/g) || []).map(Number);
  expect(moneyChannels).toHaveLength(3);
  expect(moneyChannels[1], `la dominante de ${moneyColor} doit rester verte`).toBeGreaterThan(moneyChannels[0]);
  expect(moneyChannels[1], `la dominante de ${moneyColor} doit rester verte`).toBeGreaterThan(moneyChannels[2]);

  await page.locator('[data-v2-nav="inventory"]').click();
  const inventoryView = page.locator(".v2-inventory-view");
  await expect(inventoryView).toBeVisible();
  await expect(inventoryView).toContainText("Barre protéinée");
  await expect(inventoryView).toContainText("×2");
  await expect(inventoryView).toContainText("Le coût sera recalculé");
  const strengthEntryBeforeSupplement = plannedServices.previewRuntime.weekPlanner.entries.find(entry => entry.activityId === "strength-custom");
  await page.locator('[data-v2-inventory-item="protein-bar"]').click();
  const supplementReservation = page.locator(".v2-supplement-picker");
  await expect(supplementReservation).toBeVisible();
  await expect(supplementReservation).toContainText(/recalculé à partir du même effet/i);
  const strengthReservation = supplementReservation.locator(".v2-supplement-card", { hasText: "Séance de musculation personnalisée" });
  await strengthReservation.locator("[data-v2-plan-supplement-entry]").click();
  await expect(inventoryView).toContainText("Réservé cette semaine");
  const afterReservation = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")));
  const strengthEntryAfterSupplement = afterReservation.previewRuntime.weekPlanner.entries.find(entry => entry.activityId === "strength-custom");
  expect(strengthEntryAfterSupplement.capacityCost).toBe(strengthEntryBeforeSupplement.capacityCost - 1);
  expect(strengthEntryAfterSupplement.supplementId).toBe("protein-bar");
  expect(afterReservation.previewRuntime.career.v2SupplementState.inventory["protein-bar"]).toBe(2);
  expect(afterReservation.timeState).toEqual(beforeStrengthDraft.timeState);
  await page.locator("[data-v2-close-inventory]").click();

  await page.locator('[data-v2-nav="fighter"]').click();

  const fighterView = page.locator(".v2-fighter-view");
  await expect(fighterView).toBeVisible();
  await expect(page.locator(".v2-fighter-identity dd.money")).toContainText("2425 $");
  await expect(page.locator(".v2-fighter-private-program")).toContainText("Mélanie Côté");
  await expect(page.locator(".v2-fighter-private-program")).toContainText("0/4 séances");
  await expect(page.locator(".v2-fighter-supplements")).toHaveCount(0);
  await expect(page.locator('.v2-fighter-stat [role="progressbar"]')).toHaveCount(4);
  await expect(page.locator(".v2-fighter-level-progress [role=progressbar]")).toBeVisible();
  await expect(fighterView).not.toContainText(/0\/100|\+1 Technique/i);

  const fighterDesktopBox = await fighterView.boundingBox();
  expect(fighterDesktopBox && Math.abs(fighterDesktopBox.x + fighterDesktopBox.width / 2 - 720)).toBeLessThanOrEqual(2);
  expect(fighterDesktopBox && fighterDesktopBox.width).toBeLessThanOrEqual(1120);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileFighterMetrics = await fighterView.evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(mobileFighterMetrics.scrollWidth).toBeLessThanOrEqual(mobileFighterMetrics.clientWidth + 1);
  expect(mobileFighterMetrics.documentWidth).toBeLessThanOrEqual(mobileFighterMetrics.viewportWidth + 1);
  expect(mobileFighterMetrics.scrollHeight).toBeGreaterThan(mobileFighterMetrics.clientHeight);
  await page.locator(".v2-fighter-private").scrollIntoViewIfNeeded();
  expect(await fighterView.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await expect(page.locator(".v2-fighter-private")).toBeVisible();
  const mobileCloseButton = await page.locator("[data-v2-close-fighter]").boundingBox();
  expect(mobileCloseButton && mobileCloseButton.height).toBeGreaterThanOrEqual(44);

  await page.locator("[data-v2-close-fighter]").click();
  await page.locator("[data-v2-week-confirm]").click();
  await expect(page.locator(".v2-week-summary")).toBeVisible();

  const afterConfirmation = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career-v2")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")),
    overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth,
  }));
  expect(afterConfirmation.main.state.week).toBe(2);
  expect(afterConfirmation.main.state.money).toBe(2525);
  expect(afterConfirmation.main.state.v2TrainerState.activeProgram.trainerId).toBe("club");
  expect(afterConfirmation.main.state.v2TrainerState.activeProgram.sessionsCompleted).toBe(1);
  expect(afterConfirmation.main.state.v2SupplementState.inventory["protein-bar"]).toBe(1);
  expect(afterConfirmation.main.state.v2SupplementState.weeklyUsage.count).toBe(1);
  expect(afterConfirmation.capsule.previewRuntime.career.strengthGymWeeks).toBe(3);
  expect(afterConfirmation.capsule.timeState.history.filter(event => String(event.activityId).startsWith("strength-gym-session:")).length).toBe(1);
  expect(afterConfirmation.capsule.timeState.history.filter(event => String(event.activityId).startsWith("private-trainer:")).length).toBe(1);
  expect(afterConfirmation.overflow).toBeLessThanOrEqual(1);

  await page.locator("[data-v2-week-summary-close]").click();
  await page.locator('[data-v2-nav="inventory"]').click();
  await expect(page.locator(".v2-inventory-view")).toContainText("Barre protéinée");
  await expect(page.locator(".v2-inventory-view")).toContainText("×1");
  await page.locator("[data-v2-close-inventory]").click();
  await page.locator('[data-v2-nav="fighter"]').click();
  await expect(page.locator(".v2-fighter-private-program")).toContainText("1/4 séances");
  await expect(page.locator(".v2-fighter-supplements")).toHaveCount(0);
});
