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
    localStorage.setItem("boxeur-deux-career", JSON.stringify(value));
  }, snapshot);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#resume-dialog")).toBeVisible();
  await page.locator("#resume-load").click();
  await expect(page.locator("#career-world")).toBeVisible();
}

for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
  test(`Risque galas : offres, prix et conseil réservé cohérents à ${viewport.width} px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await openStoredCareer(page, amateurSnapshot({ money: 2000, gymWeeks: 8, jobId: "convenience" }));
    await page.locator("[data-career-open-calendar]").first().click();
    const expected = await page.evaluate(() => {
      const event = state.calendar.events.find(event => event.kind === "gala" && event.careerWeek === 3);
      const offers = BoxeurRosterCareer.galaOffers(state.rosterState, event, playerCombatStrength())
        .map((offer, slot) => ({ ...offer, slot })).sort((a, b) => opponentDifficulty(a) - opponentDifficulty(b) || a.slot - b.slot);
      const player = galaRiskPlayerContext();
      return { eventId: event.id, money: state.money, offers: offers.map(offer => ({ id: offer.rosterFighterId, slot: offer.slot,
        stats: offer.stats, risk: BoxeurGalaRisk.assess(player.stats, offer.stats, offer.style).id })),
        quote: BoxeurCalendar.quoteEventCost(event, BoxeurCalendar.travelOptionsForEvent(event)[0]?.id || "none").total };
    });
    await expect(page.locator(".gala-preparation")).toHaveCount(1);
    await expect(page.locator(".gala-preparation")).toContainText("Préparation actuelle");
    await expect(page.locator(".gala-preparation")).toContainText("Ta préparation peut encore changer");
    const choices = page.locator(`[data-book-gala="${expected.eventId}"]`);
    const week = page.locator(".calendar-week-group").filter({ has: choices.first() });
    await week.locator(":scope > summary").click();
    const article = choices.first().locator("xpath=ancestor::article[1]");
    await article.locator(".calendar-opponent-alternatives > summary").click();
    expect(await choices.evaluateAll(elements => elements.map(el => ({ id: el.dataset.rosterFighter, slot: Number(el.dataset.slot),
      risk: el.querySelector("[data-gala-risk]").dataset.galaRisk })))).toEqual(expected.offers.map(({ stats, ...offer }) => offer));
    for (const choice of await choices.all()) {
      await expect(choice).not.toContainText(/Combat serré|difficulté \d|Recommandé par le coach/);
      await expect(choice.locator(".gala-cost")).toHaveText(expected.quote ? `${expected.quote} $` : "Gratuit");
    }
    await choices.first().scrollIntoViewIfNeeded();
    const geometry = await article.evaluate(element => [element, ...element.querySelectorAll("button, [data-gala-risk], .gala-cost")]
      .map(node => ({ tag: node.className, overflow: node.scrollWidth - node.clientWidth,
        clipped: node.scrollHeight - node.clientHeight })));
    expect(geometry.every(item => item.overflow <= 1 && item.clipped <= 1), JSON.stringify(geometry)).toBe(true);
    await page.screenshot({ path: `/tmp/gala-risk-calendar-${viewport.width}.png` });
    // Same selection/booking handler, including keyboard activation.
    await choices.first().focus();
    await page.keyboard.press("Enter");
    const reserved = await page.evaluate(() => JSON.parse(JSON.stringify(state.scheduledFight)));
    expect(reserved.opponent.rosterFighterId).toBe(expected.offers[0].id);
    expect(reserved.opponent.stats).toEqual(expected.offers[0].stats);
    expect(await page.evaluate(() => state.money)).toBe(expected.money - expected.quote);
    await expect(page.locator("#scheduled-fight [data-gala-risk]")).toHaveAttribute("data-gala-risk", expected.offers[0].risk);
    if (reserved.travelEffects.energy || reserved.travelEffects.fatigue) {
      expect(reserved.travelApplied).toBe(false);
      await expect(page.locator("#scheduled-fight .gala-travel-note")).toContainText("non encore appliqués");
    }
    await page.locator('#calendar-dialog [data-career-nav="map"]').click();
    await page.locator('.career-map-hotspot[data-career-location="arena"]').click();
    await expect(page.locator(".career-arena-view [data-gala-risk]")).toHaveAttribute("data-gala-risk", expected.offers[0].risk);
    await expect(page.locator(".career-arena-condition")).toHaveCount(1);
    await expect(page.locator(".career-arena-condition")).toContainText("Préparation actuelle");
    if (reserved.travelEffects.energy || reserved.travelEffects.fatigue) {
      await expect(page.locator(".career-arena-opponent .gala-travel-note")).toContainText("non encore appliqués");
    }
    expect(await page.locator(".career-arena-view").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.locator(".career-arena-opponent").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/gala-risk-arena-${viewport.width}.png` });
    expect(await page.evaluate(() => JSON.parse(JSON.stringify(state.scheduledFight)))).toEqual(reserved);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#resume-load").click();
    expect(await page.evaluate(() => JSON.parse(JSON.stringify(state.scheduledFight)))).toEqual(reserved);
    expect(errors).toEqual([]);
  });
}

test("Risque galas : lecture pure, plan non confirmé et ancienne réservation Caron", async ({ page }) => {
  const opponent = { id: "legacy-risk-caron", name: "Alexis Caron", nickname: "La Masse", style: "Puncheur",
    record: "18 V · 10 D", rating: 55.68, difficulty: 56, risk: "Combat serré",
    stats: { technique: 55.43, power: 59.43, cardio: 54.43, defense: 53.43 } };
  await openStoredCareer(page, amateurSnapshot({ money: 2000, gymWeeks: 8, jobId: "convenience", energy: 30, fatigue: 70,
    combatStats: { technique: 53, power: 53, cardio: 53, defense: 52 },
    scheduledFight: { id: "legacy-risk", opponent, week: 3, tournamentId: null, fightSeed: "risk-legacy-do-not-consume",
      travelApplied: true, travelEffects: { energy: -6, fatigue: 4 } } }));
  await page.locator("[data-career-open-calendar]").first().click();
  await expect(page.locator("#scheduled-fight [data-gala-risk]")).toHaveText("Gros défi");
  await expect(page.locator(".gala-preparation .gala-condition-warning")).toContainText("plus difficile");
  await expect(page.locator("#scheduled-fight .gala-travel-note")).toHaveCount(0);
  const purity = await page.evaluate(() => {
    const capture = () => JSON.stringify({ state, careerCapsule, storage: { ...localStorage } });
    const before = capture();
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      const player = galaRiskPlayerContext();
      BoxeurGalaRisk.renderAssessment(BoxeurGalaRisk.assess(player.stats, state.scheduledFight.opponent.stats, state.scheduledFight.opponent.style));
      BoxeurGalaRisk.renderPreparation(player.preparation, true);
      BoxeurGalaRisk.renderTravel(state.scheduledFight.travelEffects, state.scheduledFight.travelApplied);
    }
    const milliseconds = performance.now() - start;
    return { unchanged: capture() === before, milliseconds,
      reserved: JSON.parse(JSON.stringify(state.scheduledFight)) };
  });
  expect(purity.unchanged).toBe(true);
  expect(purity.reserved.opponent.risk).toBe("Combat serré"); // Compatibility snapshot untouched, ignored by UI.
  expect(purity.reserved.fightSeed).toBe("risk-legacy-do-not-consume");
  expect(purity.reserved.travelApplied).toBe(true);
  console.log("Risque : 100 lectures/rendus purs", purity.milliseconds, "ms");
  await page.locator('#calendar-dialog [data-career-nav="map"]').click();
  await page.locator('.career-map-hotspot[data-career-location="arena"]').click();
  await expect(page.locator(".career-arena-opponent [data-gala-risk]")).toHaveText("Gros défi");
  await expect(page.locator(".career-arena-condition .gala-condition-warning")).toBeVisible();
  await expect(page.locator(".career-arena-opponent .gala-travel-note")).toHaveCount(0);
  await page.locator("[data-career-leave-arena]").click();
  const pending = await page.evaluate(() => {
    const before = galaRiskPlayerContext();
    applyCareerQuickWeekPlan();
    return { before, after: galaRiskPlayerContext(), entries: ensureCareerWeekPlanner().entries.length };
  });
  expect(pending.entries).toBeGreaterThan(0);
  expect(pending.after).toEqual(pending.before);
  expect(await page.evaluate(() => JSON.parse(JSON.stringify(state.scheduledFight)))).toEqual(purity.reserved);
});

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
    await page.locator("[data-career-open-calendar]").first().click();
    await expect(page.locator("#calendar-dialog")).toBeVisible();
  }
  const galaChoice = page.locator("#calendar-events [data-book-gala]").first();
  await expect(galaChoice).toBeVisible();
  await expect(galaChoice.locator("xpath=ancestor::article[1]")).toContainText("3 juges");
  await galaChoice.click();
  await expect(page.locator("#scheduled-fight")).toContainText("Prochain combat programmé");
  await expect(page.locator("#scheduled-fight [data-career-go-arena]")).toBeVisible();
}

async function startTacticalFight(page) {
  if (await page.locator("#calendar-dialog").isVisible()) {
    await page.locator("#scheduled-fight [data-career-go-arena]").click();
  }
  await expect(page.locator(".career-arena-view")).toBeVisible();
  await expect(page.locator(".career-arena-view")).toHaveAttribute("data-career-arena-state", "due");
  await page.locator(".career-arena-dashboard [data-career-arena-action]").click();
  await expect(page.locator(".career-week-plan")).toBeVisible();
  await page.locator(".career-week-plan [data-career-week-confirm]").click();
  await expect(page.locator(".career-week-summary")).toContainText("combat prêt");
  await page.locator("[data-career-week-summary-close]").click();
  await expect(page.locator(".career-arena-view")).toHaveAttribute("data-career-arena-state", "ready");
  await page.locator(".career-arena-dashboard [data-career-arena-action]").click();
  const dialog = page.locator("#fight-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveClass(/local-fight-prototype/);
  await expect(dialog).toHaveClass(/sparring-ring-prototype/);
  await expect.poll(() => page.locator(".local-fight-before-backdrop").evaluate(image => image.complete ? image.naturalWidth : 0)).toBeGreaterThan(0);
  await expect.poll(() => page.locator(".local-fight-ring-backdrop").evaluate(image => image.complete ? image.naturalWidth : 0)).toBeGreaterThan(0);
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-scene", "before");
  await expect(page.locator("#fight-score-label")).toHaveText("Cartes cachées");
  await expect(page.locator("#fight-score")).toHaveText("—");
  await expect(page.locator("#fight-judge-cards")).toBeHidden();
  await expect(page.locator("#fight-judge-cards")).toBeEmpty();
  await expect(page.locator("#fight-round-dynamic")).toContainText("Cette perception n’est jamais une carte de juge");
  await expect(page.locator("#sparring-perception-hud")).toHaveAttribute("aria-label", /Lecture/);
  await expect(page.locator("#fight-coach-title")).toHaveText("Le coach prépare ton combat");
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

async function waitForAutomaticSparringResolution(page) {
  const stage = page.locator("#fight-ring-stage");
  if (await stage.getAttribute("data-sparring-step") === "resolving") {
    await expect(stage).not.toHaveAttribute("data-sparring-step", "resolving");
  }
}

async function chooseExchangeAction(page) {
  const aligned = page.locator("#fight-choices [data-fight-action].coach-match").first();
  if (await aligned.isVisible()) {
    await aligned.click();
    await waitForAutomaticSparringResolution(page);
    return true;
  }
  const fallback = page.locator("#fight-choices [data-fight-action]").first();
  if (await fallback.isVisible()) {
    await fallback.click();
    await waitForAutomaticSparringResolution(page);
    return true;
  }
  return false;
}

async function completeFight(page) {
  const completionButton = page.locator("#fight-instruction button.primary-button").filter({ hasText: /Retour au camp|Retour au tournoi|Retour au GYM|Retour au menu test|Voir mon passage amateur/ });
  for (let decision = 0; decision < 30; decision += 1) {
    if (await completionButton.isVisible()) return;
    if (await chooseCoachDirective(page)) continue;
    if (await chooseExchangeAction(page)) continue;
    throw new Error(`Le combat est bloqué après ${decision} décisions tactiques.`);
  }
  await expect(completionButton, "un combat amateur doit se terminer en au plus 18 décisions (3 briefings et 15 échanges)").toBeVisible();
}

async function confirmWeekFromLauncher(page) {
  await page.locator(".career-week-launcher [data-career-week-detailed]").click();
  await expect(page.locator(".career-week-plan")).toBeVisible();
  await page.locator(".career-week-plan [data-career-week-confirm]").click();
}

async function enterDueTournamentFromArena(page) {
  if (!await page.locator("#calendar-dialog").isVisible()) {
    await page.locator("[data-career-open-calendar]").first().click();
  }
  await page.locator("#active-tournament [data-career-go-arena]").click();
  await expect(page.locator('.career-arena-view[data-career-arena-state="due"]')).toBeVisible();
  await page.locator(".career-arena-dashboard [data-career-arena-action]").click();
  await expect(page.locator(".career-week-plan")).toBeVisible();
  await page.locator(".career-week-plan [data-career-week-confirm]").click();
  await expect(page.locator(".career-week-summary")).toContainText("combat prêt");
  await page.locator("[data-career-week-summary-close]").click();
  await expect(page.locator(".career-arena-view")).toHaveAttribute("data-career-arena-state", /ready|active/);
  await page.locator(".career-arena-dashboard [data-career-arena-action]").click();
  await expect(page.locator("#tournament-dialog")).toBeVisible();
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
  return { version: 6, savedAt: "2026-11-16T12:00:00.000Z", weeklyPlan: [], state };
}

function recreationalReadySnapshot(overrides = {}) {
  const { profile: profileOverrides = {}, ...careerOverrides } = overrides;
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
    ...careerOverrides,
  });
  snapshot.state.profile = { ...snapshot.state.profile, firstName: "Noa", lastName: "Récréatif", ...profileOverrides };
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
      await waitForAutomaticSparringResolution(page);
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

function dueTournamentSnapshot(tournamentId = "bronze") {
  const totalBouts = tournamentId === "olympic" || tournamentId === "canadian" ? 5 : 3;
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
  const opponents = Array.from({ length: totalBouts }, (_, index) => ({
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
      tournaments: {
        bronze: tournamentId === "bronze" ? "entered" : "won",
        silver: "pending",
        golden: tournamentId === "olympic" || tournamentId === "canadian" ? "won" : "pending",
        canadian: tournamentId === "olympic" ? "won" : tournamentId === "canadian" ? "entered" : "locked",
        olympic: tournamentId === "olympic" ? "entered" : "locked",
      },
      activeTournament: {
        id: tournamentId,
        startWeek: 8,
        status: "active",
        currentRound: 0,
        opponents,
        results: [],
        medal: null,
        summary: "",
        competition: {
          schemaVersion: 1,
          id: `browser-${tournamentId}-due`,
          totalBouts,
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

function finalTournamentSnapshot(tournamentId = "regional-cup") {
  const snapshot = dueTournamentSnapshot(tournamentId);
  const active = snapshot.state.activeTournament;
  const competition = active.competition;
  const finalRound = competition.totalBouts - 1;
  active.currentRound = finalRound;
  active.medalCelebrated = false;
  active.results = active.opponents.slice(0, finalRound).map((opponent, index) => ({
    round: index,
    opponent: opponent.name,
    result: "Victoire",
    score: "décision unanime",
  }));
  competition.day = competition.totalBouts;
  competition.wins = finalRound;
  competition.boutsFought = finalRound;
  competition.phase = "daily_check";
  competition.results = active.results.map((result, index) => ({
    bout: index + 1,
    day: index + 1,
    result: "win",
    method: "decision",
    score: result.score,
    opponent: result.opponent,
  }));
  snapshot.state.amateurRecord.wins = finalRound;
  snapshot.state.level = 2;
  snapshot.state.experience = 40;
  snapshot.state.levelPoints = 0;
  return snapshot;
}

function completedMedalSnapshot(medal) {
  const snapshot = dueTournamentSnapshot("bronze");
  const active = snapshot.state.activeTournament;
  active.status = "completed";
  active.medal = medal;
  delete active.medalCelebrated;
  active.summary = `Gants de bronze terminés : médaille ${medal}.`;
  active.competition.phase = medal === "gold" ? "completed" : "eliminated";
  return snapshot;
}

for (const profile of [
  { sex: "female", label: "féminine", weight: /W57/, portrait: /portraits-femmes\.webp/ },
  { sex: "male", label: "masculine", weight: /M65/, portrait: /portraits-hommes\.webp/ },
]) {
  test(`crée une carrière ${profile.label} avec sa catégorie et son portrait`, async ({ page }) => {
    await openFreshCareer(page);
    const identity = await createCareer(page, { sex: profile.sex });

    await expect(page.locator("#onboarding-guide-dialog")).toBeVisible();
    await page.locator("#onboarding-guide-acknowledge").click();
    await expect(page.locator("#job-dialog")).toBeVisible();
    await page.locator('[data-select-job="courier"]').click();
    await page.locator('[data-career-nav="fighter"]').click();
    await expect(page.locator("#career-fighter-title")).toContainText(identity.firstName);
    await expect(page.locator(".career-fighter-badges")).toContainText("Récréatif");
    await expect(page.locator(".career-fighter-identity")).toContainText("220 $");
    await expect(page.locator(".career-fighter-portrait img")).toHaveAttribute("src", profile.portrait);

    const savedProfile = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state.profile);
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

test("ignore les anciens paramètres et garde le jeu actuel comme unique interface", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(`${baseURL}/?classic=1&arcade=1`, { waitUntil: "domcontentloaded" });
  const legacySnapshot = amateurSnapshot({ profile: { firstName: "Unique", lastName: "Interface" } });
  legacySnapshot.weeklyPlan = [{ actionId: "work" }, { actionId: "gym" }];
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career", JSON.stringify(value));
  }, legacySnapshot);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  await expect(page.locator("body")).toHaveClass(/career-preview/);
  await expect(page.locator("#career-world")).toBeVisible();
  await expect(page.locator("#game > .topbar")).toBeHidden();
  await expect(page.locator('[data-career-home-zone="lounge"]')).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);
  const migrated = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(migrated.main.weeklyPlan).toEqual([]);
  expect(migrated.capsule.legacyPendingPlan).toEqual(legacySnapshot.weeklyPlan);
  expect(migrated.capsule.migrationAudit.legacyWeeklyPlan.executed).toBe(false);
});

test("migre une sauvegarde et sa capsule historiques vers les clés neutres sans effacer l’original", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const legacySnapshot = amateurSnapshot({
    profile: { firstName: "Ancienne", lastName: "Sauvegarde" },
    v2SupplementState: {
      kind: "boxeur-v2-supplements",
      schemaVersion: 1,
      inventory: { "protein-bar": 2 },
      weeklyUsage: { weekKey: "4", count: 0, productIds: [], sessionIds: [] },
      purchaseIds: [],
      useIds: [],
    },
    v2TrainerState: {
      kind: "boxeur-v2-private-trainer",
      schemaVersion: 1,
      activeProgram: null,
      completedPrograms: [],
      sessionReceipts: [],
    },
  });
  legacySnapshot.version = 5;
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career-v2", JSON.stringify(value));
  }, legacySnapshot);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#resume-dialog")).toBeVisible();
  await page.locator("#resume-load").click();

  const migratedMain = await page.evaluate(() => ({
    current: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    legacy: JSON.parse(localStorage.getItem("boxeur-deux-career-v2")),
    runtime: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(migratedMain.current.version).toBe(6);
  expect(migratedMain.current.state.supplementState.kind).toBe("boxeur-supplements");
  expect(migratedMain.current.state.supplementState.inventory["protein-bar"]).toBe(2);
  expect(migratedMain.current.state.trainerState.kind).toBe("boxeur-private-trainer");
  expect(migratedMain.current.state).not.toHaveProperty("v2SupplementState");
  expect(migratedMain.current.state).not.toHaveProperty("v2TrainerState");
  expect(migratedMain.runtime.kind).toBe("boxeur-deux-career-capsule");
  expect(migratedMain.runtime.version).toBe(3);
  expect(migratedMain.legacy.version).toBe(5);

  await page.evaluate(() => {
    const capsule = JSON.parse(localStorage.getItem("boxeur-deux-career-runtime"));
    capsule.kind = "boxeur-deux-career-v2-capsule";
    capsule.version = 2;
    capsule.previewRuntime.weeklySummaries = [{ week: 77, marker: "legacy-runtime" }];
    capsule.previewRuntime.career.v2SupplementState = capsule.previewRuntime.career.supplementState;
    delete capsule.previewRuntime.career.supplementState;
    localStorage.removeItem("boxeur-deux-career-runtime");
    localStorage.setItem("boxeur-deux-career-v2-v2-preview", JSON.stringify(capsule));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  const migratedRuntime = await page.evaluate(() => ({
    current: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
    legacy: JSON.parse(localStorage.getItem("boxeur-deux-career-v2-v2-preview")),
  }));
  expect(migratedRuntime.current.kind).toBe("boxeur-deux-career-capsule");
  expect(migratedRuntime.current.version).toBe(3);
  expect(migratedRuntime.current.previewRuntime.career.supplementState.kind).toBe("boxeur-supplements");
  expect(migratedRuntime.current.previewRuntime.career).not.toHaveProperty("v2SupplementState");
  expect(migratedRuntime.current.previewRuntime.weeklySummaries).toContainEqual({ week: 77, marker: "legacy-runtime" });
  expect(migratedRuntime.legacy.kind).toBe("boxeur-deux-career-v2-capsule");
});

test("charge les lieux actuels sans erreur JavaScript ni ressource locale manquante", async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  const missingResources = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => {
    // Les deux polices Google sont volontairement bloquées dans le QA local.
    if (message.type() === "error" && !/Failed to load resource: net::ERR_FAILED/.test(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  page.on("response", response => {
    if (response.url().startsWith(baseURL) && response.status() >= 400) {
      missingResources.push(`${response.status()} ${new URL(response.url()).pathname}`);
    }
  });

  await openStoredCareer(page, amateurSnapshot({
    gymWeeks: 4,
    strengthGymWeeks: 4,
    jobId: "courier",
    money: 1000,
  }));

  await page.getByRole("button", { name: /Entrer : Maison/ }).click();
  await expect.poll(() => page.locator(".career-home-scene > picture > img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await page.locator("[data-career-leave-home]").click();
  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await expect.poll(() => page.locator(".career-gym-floor > picture > img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await page.locator("[data-career-leave-gym]").click();
  await page.getByRole("button", { name: /Entrer : Gym de musculation/ }).click();
  await expect(page.locator(".career-strength-view")).toBeVisible();
  await page.locator("[data-career-leave-strength-gym]").click();
  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await expect(page.locator(".career-work-view")).toBeVisible();
  await page.locator("[data-career-leave-work]").click();
  await page.getByRole("button", { name: /Entrer : Aréna/ }).click();
  await expect(page.locator('.career-arena-view[data-career-arena-state="none"]')).toBeVisible();
  await expect.poll(() => page.locator(".career-arena-scene > picture > img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator(".career-arena-event-card")).toContainText("Aucun combat réservé");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator(".career-arena-scene img").evaluate(image => image.currentSrc)).toContain("arena-v2-mobile.png");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(() => page.locator(".career-arena-scene img").evaluate(image => image.currentSrc)).toContain("arena-v2-desktop.png");
  await page.locator("[data-career-leave-arena]").click();
  await page.locator('[data-career-nav="fighter"]').click();
  await expect.poll(() => page.locator(".career-fighter-portrait img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await page.locator('.career-location-sheet [data-career-nav="inventory"]').click();
  await expect(page.locator(".career-inventory-view")).toBeVisible();
  await page.locator('.career-location-sheet [data-career-nav="map"]').click();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(missingResources).toEqual([]);
});

test("termine la semaine de combat avant d’ouvrir l’aréna, protège le travail et restaure le verrou après recharge", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    week: 1,
    gymWeeks: 8,
    strengthGymWeeks: 4,
    jobId: "convenience",
    jobsHeldCount: 1,
    missedWorkWeeks: 1,
    jobTenureWeeks: 3,
    jobWagesEarned: 225,
    money: 500,
  }));
  await bookCurrentGala(page);
  await page.locator("#scheduled-fight [data-career-go-arena]").click();
  await expect(page.locator('.career-arena-view[data-career-arena-state="due"]')).toContainText("Joue et confirme d’abord ta semaine normale");
  await page.locator(".career-arena-dashboard [data-career-arena-action]").click();
  await expect(page.locator(".career-week-plan")).toBeVisible();
  await page.locator(".career-week-plan [data-career-week-confirm]").click();
  await expect(page.locator(".career-week-summary")).toContainText("Semaine 1 terminée · combat prêt");
  await expect(page.locator(".career-week-summary")).toContainText("Paie brute");

  let saved = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(saved.main.state.week).toBe(1);
  expect(saved.main.state.rosterState.lastProcessedWeek).toBe(0);
  expect(saved.main.state.rosterState.matches).toEqual([]);
  expect(saved.main.state.rosterState.reservations).toHaveLength(1);
  expect(saved.main.state.missedWorkWeeks).toBe(1);
  expect(saved.capsule.previewRuntime.fightGate).toMatchObject({ status: "ready", week: 1, kind: "gala" });
  expect(saved.capsule.previewRuntime.weekLedgers["1"].workShifts).toBe(1);

  await page.locator("[data-career-week-summary-close]").click();
  await expect(page.locator('.career-arena-view[data-career-arena-state="ready"]')).toBeVisible();
  await page.locator("[data-career-leave-arena]").click();
  for (const locationId of ["home", "boxing-gym", "strength-gym", "work"]) {
    await expect(page.locator(`.career-map-hotspot[data-career-location="${locationId}"]`)).toBeDisabled();
  }
  await expect(page.locator('.career-map-hotspot[data-career-location="arena"]')).toBeEnabled();

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  await expect(page.locator('.career-map-hotspot[data-career-location="work"]')).toBeDisabled();
  await page.locator('.career-map-hotspot[data-career-location="arena"]').click();
  await expect(page.locator('.career-arena-view[data-career-arena-state="ready"]')).toContainText("Entrer dans le ring");
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(saved.previewRuntime.fightGate.status).toBe("ready");
});

test("permet le désistement depuis le calendrier après le verrou de l’aréna et libère la semaine sans absence", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    week: 1,
    gymWeeks: 8,
    jobId: "convenience",
    jobsHeldCount: 1,
    missedWorkWeeks: 1,
    jobTenureWeeks: 3,
    jobWagesEarned: 225,
    money: 500,
  }));
  await bookCurrentGala(page);
  await page.locator("#scheduled-fight [data-career-go-arena]").click();
  await page.locator(".career-arena-dashboard [data-career-arena-action]").click();
  await page.locator(".career-week-plan [data-career-week-confirm]").click();
  await page.locator("[data-career-week-summary-close]").click();
  await page.locator("[data-career-leave-arena]").click();
  await page.locator('[data-career-nav="calendar"]').click();
  await expect(page.locator("#withdraw-fight")).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await page.locator("#withdraw-fight").click();

  let saved = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")).state,
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(saved.main.week).toBe(2);
  expect(saved.main.scheduledFight).toBeNull();
  expect(saved.main.missedWorkWeeks).toBe(1);
  expect(saved.main.jobTenureWeeks).toBe(4);
  expect(saved.main.jobWagesEarned).toBe(300);
  expect(saved.main.rosterState.lastProcessedWeek).toBe(1);
  expect(saved.main.rosterState.reservations).toEqual([]);
  expect(saved.main.rosterState.matches.filter(match => match.source === "player")).toEqual([]);
  expect(saved.main.bookings.some(booking => booking.status === "withdrawn")).toBe(true);
  expect(saved.capsule.previewRuntime.fightGate).toBeNull();

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  await expect(page.locator('.career-map-hotspot[data-career-location="work"]')).toBeEnabled();
  await expect(page.locator('.career-map-hotspot[data-career-location="arena"]')).toHaveAccessibleName(/Aucun combat réservé/);
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(saved.week).toBe(2);
  expect(saved.scheduledFight).toBeNull();
});

test("explique et verrouille le GYM avant l’inscription", async ({ page }) => {
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
    localStorage.setItem("boxeur-deux-career", JSON.stringify(value));
  }, snapshot);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).first().click();

  await expect(page.locator("#career-gym-membership-lock-reason")).toContainText("Inscription requise");
  await expect(page.locator(".career-gym-membership.inactive")).toContainText("Utilise le bouton Accueil");
  await expect(page.locator("#career-gym-membership-lock-reason")).toContainText("sac au sous-sol");

  const lockedHotspots = page.locator('.career-gym-hotspot[aria-disabled="true"]');
  await expect(lockedHotspots).toHaveCount(3);
  const reception = page.locator('.career-gym-hotspot[data-career-gym-zone="reception"]');
  await expect(reception).not.toHaveAttribute("aria-disabled", "true");
  await lockedHotspots.first().focus();
  await expect(lockedHotspots.first()).toBeFocused();
  expect((await reception.boundingBox()).height).toBeGreaterThanOrEqual(44);
  const fit = await page.locator(".career-gym-view").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(fit.scrollWidth).toBeLessThanOrEqual(fit.clientWidth + 1);
  expect(fit.documentWidth).toBeLessThanOrEqual(fit.viewportWidth + 1);
  await reception.click();
  await expect(page.locator("#membership-dialog")).toBeVisible();
});

test("affiche le lieu Emploi selon le poste sans modifier sa mécanique", async ({ page }) => {
  const officeSnapshot = amateurSnapshot({
    jobId: "office",
    jobsHeldCount: 1,
    introJobRequired: false,
    initialGymRequired: false,
  });
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career", JSON.stringify(value));
  }, officeSnapshot);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  const workView = page.locator(".career-work-view-office");
  await expect(workView).toBeVisible();
  await expect(workView.locator('.career-work-scene img')).toHaveAttribute("src", /emploi-bureau-v2-desktop\.png$/);
  await expect(workView.locator("[data-career-work-zone]")).toHaveCount(2);
  await expect(workView.locator("[data-career-leave-work]")).toBeVisible();
  await expect(workView.locator('[data-career-work-zone="mini-game"]')).toHaveCount(0);
  await expect(workView).not.toContainText("Faire mon emploi");

  const hotspotStyle = await workView.locator('[data-career-work-zone="schedule"]').evaluate(element => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      border: style.borderTopStyle,
      opacity: style.opacity,
      markerContent: getComputedStyle(element, "::after").content,
    };
  });
  expect(hotspotStyle).toEqual({
    background: "rgba(12, 15, 13, 0.28)",
    border: "dashed",
    opacity: "0.7",
    markerContent: "none",
  });

  await page.locator('[data-career-work-zone="schedule"]').click();
  await expect(page.locator(".career-work-menu")).toContainText("Horaire de la semaine");
  await expect(page.locator("[data-career-toggle-work]")).toContainText("Retirer le travail de ma semaine");
  await page.locator("[data-career-work-menu-close]").click();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => workView.locator('.career-work-scene img').evaluate(image => image.currentSrc)).toContain("emploi-bureau-v2-mobile.png");
  expect((await workView.locator('[data-career-work-zone="schedule"]').boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.locator("[data-career-leave-work]").click();

  const noJobSnapshot = amateurSnapshot({
    jobId: null,
    jobsHeldCount: 1,
    introJobRequired: false,
    initialGymRequired: false,
  });
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career", JSON.stringify(value));
  }, noJobSnapshot);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await expect(page.locator(".career-work-board-scene")).toBeVisible();
  await expect(page.locator('.career-work-board-scene [data-select-job]')).toHaveCount(4);
  await expect(page.locator('[data-career-work-zone="employment"]')).toHaveCount(0);
  await expect(page.locator(".career-work-board-scene")).toContainText("1 semaine d’attente");
  await expect(page.locator("#job-dialog")).not.toBeVisible();
  await page.locator('.career-work-board-scene [data-select-job="convenience"]').click();
  await expect(page.locator("#job-dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: /Entrer : Emploi/ })).toHaveAccessibleName(/Candidature en cours/);
});

test("bâtit une semaine modifiable puis ne l’exécute qu’à la confirmation", async ({ page }) => {
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
    localStorage.setItem("boxeur-deux-career", JSON.stringify(value));
  }, snapshot);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  const mainBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  const launcher = page.locator(".career-week-launcher");
  await expect(launcher).toContainText("Bâtis ta semaine");
  await expect(launcher).toContainText("Capacité restante de la semaine");
  await expect(launcher.locator("progress")).toHaveAttribute("max", "50");
  await expect(launcher.locator("progress")).toHaveAttribute("value", "50");
  await expect(launcher).not.toContainText("points gardés pour le repos");
  await expect(page.locator("[data-career-week-quick]")).toBeDisabled();
  await expect(page.locator(".career-week-blocker")).toContainText("emploi de départ");

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await expect(page.locator(".career-work-board-scene")).toContainText("Ton premier emploi est requis");
  await page.locator('[data-career-work-zone="employment"]').first().click();
  await expect(page.locator("#job-dialog")).toBeVisible();
  await page.locator('#job-options [data-select-job="courier"]').click();
  await expect(page.locator("#job-dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: /Entrer : Emploi/ })).toHaveAccessibleName(/Emploi actif/);

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await expect(page.locator(".career-work-view")).toContainText("Coursier local");
  await page.locator('[data-career-work-zone="schedule"]').click();
  const workToggle = page.locator("[data-career-toggle-work]");
  await expect(page.locator(".career-work-menu")).toContainText("prévu cette semaine");
  await expect(workToggle).toContainText("Retirer le travail de ma semaine");
  const capacityWithWork = Number(await launcher.locator("progress").getAttribute("value"));
  await workToggle.click();
  await page.locator('[data-career-work-zone="schedule"]').click();
  await expect(page.locator(".career-work-menu")).toContainText("aucune paie");
  await expect(page.locator("[data-career-toggle-work]")).toContainText("Ajouter le travail à ma semaine");
  const capacityWithoutWork = Number(await launcher.locator("progress").getAttribute("value"));
  expect(capacityWithoutWork).toBeGreaterThan(capacityWithWork);
  await page.locator("[data-career-toggle-work]").click();
  await page.locator('[data-career-work-zone="schedule"]').click();
  await expect(page.locator("[data-career-toggle-work]")).toContainText("Retirer le travail de ma semaine");
  await page.locator("[data-career-work-menu-close]").click();
  await page.locator("[data-career-leave-work]").click();

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await expect(page.locator(".career-gym-membership.inactive")).toContainText("Inscription requise");
  await page.locator('.career-gym-hotspot[data-career-gym-zone="reception"]').click();
  await expect(page.locator("#membership-dialog")).toBeVisible();
  await page.locator('#membership-options [data-gym-plan="monthly"]').click();
  await expect(page.locator("#membership-dialog")).not.toBeVisible();
  await expect(page.locator(".career-gym-membership")).toContainText("Abonnement actif");
  await page.locator("[data-career-leave-gym]").click();

  await expect(page.locator("[data-career-week-quick]")).toBeEnabled();
  const capacityAfterWork = Number(await launcher.locator("progress").getAttribute("value"));
  expect(capacityAfterWork).toBeLessThan(50);
  await page.locator("[data-career-week-quick]").click();
  const quickPlan = page.locator(".career-week-plan");
  await expect(quickPlan).toBeVisible();
  await expect(quickPlan).toContainText("Plan rapide modifiable");
  await expect(quickPlan).toContainText("Coursier local");
  await expect(quickPlan).toContainText("Cours de groupe");
  await expect(quickPlan).toContainText("Journée de repos");
  await expect(quickPlan).toContainText("Les activités ne sont pas encore accomplies");

  const restItem = quickPlan.locator(".career-week-plan-items li", { hasText: "Journée de repos" });
  const capacityBeforeRemoval = Number(await quickPlan.locator("progress").getAttribute("value"));
  await restItem.locator("[data-career-week-remove]").click();
  await expect(page.locator(".career-week-plan")).not.toContainText("Journée de repos");
  const capacityAfterRemoval = Number(await page.locator(".career-week-plan progress").getAttribute("value"));
  expect(capacityAfterRemoval).toBe(capacityBeforeRemoval + 10);
  await expect(page.locator(".career-week-plan")).not.toContainText("points gardés pour le repos");
  await page.locator("[data-career-week-plan-close]").first().click();

  await page.getByRole("button", { name: /Entrer : Maison/ }).click();
  const restAction = page.locator('[data-career-home-zone="bed"]');
  await restAction.click();
  await expect(restAction).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-career-leave-home]").click();

  await confirmWeekFromLauncher(page);
  await expect(page.locator(".career-week-summary")).toBeVisible();
  await expect(page.locator(".career-week-summary")).toContainText("Paie");
  await expect(page.locator(".career-week-summary")).toContainText("+100 $");

  let capsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(capsule.timeState.clock.week).toBe(2);
  expect(capsule.previewRuntime.career.money).toBe(210);
  expect(capsule.previewRuntime.career.gymWeeks).toBe(3);
  expect(capsule.previewRuntime.career.jobTenureWeeks).toBe(1);
  expect(capsule.previewRuntime.career.jobWagesEarned).toBe(100);
  expect(capsule.previewRuntime.weeklySummaries[0].mode).toBe("quick");
  expect(capsule.previewRuntime.weeklySummaries[0].counts.training).toBe(1);
  expect(capsule.previewRuntime.weeklySummaries[0].counts.work).toBe(1);
  expect(capsule.previewRuntime.weeklySummaries[0].actions.some(action => action.primitive?.plannerActivityId === "rest")).toBe(true);
  const completedRest = capsule.previewRuntime.weeklySummaries[0].actions.find(action => action.primitive?.plannerActivityId === "rest");
  expect(completedRest.primitive.activity.energyGain).toBe(18);
  expect(completedRest.primitive.activity.fatigueRelief).toBe(12);
  await page.locator("[data-career-week-summary-close]").click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-career-week-detailed]").click();
  await expect(page.locator(".career-week-plan")).toContainText("Coursier local");
  await expect(page.locator(".career-week-plan").locator("[data-career-week-remove]").first()).toBeVisible();
  await page.locator("[data-career-week-plan-close]").first().click();

  const beforeManualDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")).timeState);
  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await page.locator('[data-career-work-zone="schedule"]').click();
  await page.locator("[data-career-toggle-work]").click();
  await page.locator('[data-career-work-zone="schedule"]').click();
  await expect(page.locator("[data-career-toggle-work]")).toContainText("Ajouter le travail à ma semaine");
  await page.locator("[data-career-work-menu-close]").click();
  await page.locator("[data-career-leave-work]").click();
  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await page.locator('.career-gym-hotspot[data-career-gym-zone="coach"]').click();
  await page.locator("[data-career-coach-session]").click();
  await expect(page.locator(".career-gym-view")).toContainText("Cours de groupe");
  await expect(page.locator(".career-gym-week-plan")).toContainText("Cours de groupe");
  await page.locator('.career-gym-week-plan [data-career-location-remove]').click();
  await expect(page.locator(".career-gym-week-plan")).toContainText("Aucune activité du GYM n’est encore planifiée");
  await page.locator('[data-career-gym-zone="coach"]').click();
  await expect(page.locator("[data-career-coach-session]")).toHaveAttribute("aria-pressed", "false");
  await page.locator("[data-career-coach-session]").click();
  await expect(page.locator(".career-gym-week-plan")).toContainText("Cours de groupe");
  await page.locator("[data-career-leave-gym]").click();

  const manualPlanner = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")).previewRuntime.weekPlanner);
  expect(manualPlanner.limits.recreationalPhysicalActivities).toBe(2);
  expect(manualPlanner.entries.filter(entry => entry.physical).map(entry => entry.activityId)).toEqual(["group-class"]);
  await page.getByRole("button", { name: /Entrer : Maison/ }).click();
  await page.locator('[data-career-home-menu="training"]').click();
  const homeQuick = page.locator('.career-home-menu [data-career-home-action="home-quick"]');
  await homeQuick.click();
  await expect(page.locator(".career-home-week-plan")).toContainText("Entraînement maison rapide");
  await page.locator('[data-career-home-menu="training"]').click();
  await expect(page.locator('.career-home-menu [data-career-home-action="home-quick"]')).toBeDisabled();
  await page.locator("[data-career-home-menu-close]").click();
  await page.locator("[data-career-leave-home]").click();

  const afterManualDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")).timeState);
  expect(afterManualDraft).toEqual(beforeManualDraft);
  await page.locator("[data-career-week-detailed]").click();
  await expect(page.locator(".career-week-plan")).toContainText("Cours de groupe");
  await expect(page.locator(".career-week-plan")).toContainText("Entraînement maison rapide");
  const mobilePlanFit = await page.locator(".career-week-plan").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    planTop: element.getBoundingClientRect().top,
    planBottom: element.getBoundingClientRect().bottom,
    sheetBottom: element.parentElement.getBoundingClientRect().bottom,
    footerBottom: element.querySelector("footer").getBoundingClientRect().bottom,
    confirmBottom: element.querySelector("[data-career-week-confirm]").getBoundingClientRect().bottom,
  }));
  expect(mobilePlanFit.scrollWidth).toBeLessThanOrEqual(mobilePlanFit.clientWidth + 1);
  expect(mobilePlanFit.documentWidth).toBeLessThanOrEqual(mobilePlanFit.viewportWidth + 1);
  expect(mobilePlanFit.planTop).toBeGreaterThanOrEqual(0);
  expect(mobilePlanFit.planBottom).toBeLessThanOrEqual(mobilePlanFit.viewportHeight + 1);
  expect(mobilePlanFit.sheetBottom).toBeLessThanOrEqual(mobilePlanFit.viewportHeight + 1);
  expect(mobilePlanFit.footerBottom).toBeLessThanOrEqual(mobilePlanFit.planBottom + 1);
  expect(mobilePlanFit.confirmBottom).toBeLessThanOrEqual(mobilePlanFit.viewportHeight + 1);
  for (const button of await page.locator(".career-week-plan button").all()) {
    expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  await page.locator(".career-week-plan [data-career-week-confirm]").click();
  await expect(page.locator(".career-week-summary")).toBeVisible();
  capsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(capsule.timeState.clock.week).toBe(3);
  expect(capsule.previewRuntime.weeklySummaries[0].counts.training).toBe(2);
  expect(capsule.previewRuntime.weeklySummaries[0].counts.work).toBe(0);
  expect(capsule.previewRuntime.career.money).toBe(210);
  expect(capsule.previewRuntime.career.jobTenureWeeks).toBe(1);
  expect(capsule.previewRuntime.career.jobWagesEarned).toBe(100);

  const mainAfter = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(mainAfter.state.week).toBe(capsule.timeState.clock.week);
  expect(mainAfter.state.money).toBe(capsule.previewRuntime.career.money);
  expect(mainAfter.state.gymWeeks).toBe(capsule.previewRuntime.career.gymWeeks);
  expect(mainAfter.state.jobId).toBe(capsule.previewRuntime.career.jobId);
  expect(mainAfter.state.jobWagesEarned).toBe(capsule.previewRuntime.career.jobWagesEarned);
  expect(mainAfter.state.recreationalTrainingWeeks).toBe(capsule.previewRuntime.trainingSessions);
  expect(mainAfter.state.amateurRecord).toEqual(mainBefore.state.amateurRecord);
  expect(mainAfter.weeklyPlan).toEqual(mainBefore.weeklyPlan);
});

test("le plan amateur protège le repos lorsque l'emploi ne permet pas deux séances lourdes", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    careerStatus: "amateur",
    jobId: "courier",
    gymWeeks: 4,
    strengthGymWeeks: 4,
    money: 500,
  }));

  await page.locator("[data-career-week-quick]").click();
  const quickPlan = page.locator(".career-week-plan");
  await expect(quickPlan).toBeVisible();
  await expect(quickPlan).toContainText("Coursier local");
  await expect(quickPlan).toContainText("Séance de l’entraîneur");
  await expect(quickPlan).toContainText("Journée de repos");
  await expect(quickPlan).not.toContainText("Cours de CrossFit");

  const labels = await quickPlan.locator(".career-week-plan-items li strong").allTextContents();
  expect(labels).toEqual(expect.arrayContaining(["Coursier local", "Séance de l’entraîneur", "Journée de repos"]));
  expect(labels).not.toContain("Cours de CrossFit");
  expect(Number(await quickPlan.locator("progress").getAttribute("value"))).toBeGreaterThanOrEqual(0);
});

test("occupe progressivement la capacité après l’inactivité sans réduire son maximum ni les statistiques", async ({ page }) => {
  test.setTimeout(45_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const snapshot = amateurSnapshot({
    careerStatus: "amateur",
    fitness: 68,
    trainingRhythmPenalty: 0,
    jobId: "convenience",
    gymWeeks: 4,
    initialGymRequired: false,
  });
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career", JSON.stringify(value));
  }, snapshot);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  const finishWeek = async () => {
    await confirmWeekFromLauncher(page);
    await expect(page.locator(".career-week-summary")).toBeVisible();
    const result = await page.evaluate(() => ({
      main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
      capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
    }));
    result.summaryText = await page.locator(".career-week-summary").textContent();
    await page.locator("[data-career-week-summary-close]").click();
    return result;
  };

  let result = await finishWeek();
  expect(result.capsule.previewRuntime.career.trainingRhythmPenalty).toBe(1);
  expect(result.main.state.fitness).toBe(68);
  expect(result.summaryText).toContain("Rythme fragile");
  expect(result.summaryText).toContain("Fatigue accumulée");
  expect(result.capsule.timeState.condition.fatigue).toBeGreaterThan(4);
  await expect(page.locator(".career-week-launcher progress")).toHaveAttribute("max", "50");
  await expect(page.locator(".career-week-launcher progress")).toHaveAttribute("value", "30");

  result = await finishWeek();
  expect(result.capsule.previewRuntime.career.trainingRhythmPenalty).toBe(2);
  expect(result.main.state.fitness).toBe(68);
  expect(result.summaryText).toContain("Rythme faible");
  expect(result.summaryText).toContain("sans diminution des statistiques");
  await expect(page.locator(".career-week-launcher progress")).toHaveAttribute("max", "50");
  await expect(page.locator(".career-week-launcher progress")).toHaveAttribute("value", "25");

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await page.locator('[data-career-gym-zone="coach"]').click();
  await page.locator("[data-career-coach-session]").click();
  await expect(page.locator(".career-gym-week-plan")).toContainText("Séance de l’entraîneur");
  await page.locator("[data-career-leave-gym]").click();
  result = await finishWeek();
  expect(result.capsule.previewRuntime.career.trainingRhythmPenalty).toBe(1);
  expect(result.main.state.fitness).toBe(68);
});

test("ne protège plus le travail quand le rythme et la condition occupent déjà trop de capacité", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    week: 12,
    jobId: "office",
    jobsHeldCount: 1,
    gymWeeks: 4,
    trainingRhythmPenalty: 4,
    energy: 78,
    fatigue: 66,
  }));

  const launcher = page.locator(".career-week-launcher");
  await expect(launcher.locator("progress")).toHaveAttribute("max", "50");
  await expect(launcher.locator("progress")).toHaveAttribute("value", "29");
  await page.locator("[data-career-week-detailed]").click();
  await expect(page.locator(".career-week-plan")).toContainText("20 par le manque d’entraînement");
  await expect(page.locator(".career-week-plan")).toContainText("1 par l’état physique");
  await page.locator("[data-career-week-plan-close]").first().click();

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await page.locator('[data-career-work-zone="schedule"]').click();
  await expect(page.locator(".career-work-menu")).toContainText("le travail à 30 points ne tient plus");
  await expect(page.locator("[data-career-toggle-work]")).toBeDisabled();
  await expect(page.locator("[data-career-toggle-work]")).toContainText("Travail indisponible cette semaine");
});

test("empêche de répéter dix semaines de bureau sans entraînement ni repos", async ({ page }) => {
  test.setTimeout(45_000);
  await openStoredCareer(page, amateurSnapshot({
    week: 3,
    jobId: "office",
    jobsHeldCount: 1,
    gymWeeks: 8,
    trainingRhythmPenalty: 0,
    energy: 78,
    fatigue: 4,
  }));

  for (let completed = 0; completed < 5; completed += 1) {
    await confirmWeekFromLauncher(page);
    await expect(page.locator(".career-week-summary")).toContainText("Fatigue accumulée");
    await page.locator("[data-career-week-summary-close]").click();
  }

  const saved = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(saved.capsule.previewRuntime.career.trainingRhythmPenalty).toBe(4);
  expect(saved.capsule.timeState.condition.fatigue).toBeGreaterThanOrEqual(68);
  expect(saved.capsule.previewRuntime.career.jobWagesEarned).toBe(600);

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await page.locator('[data-career-work-zone="schedule"]').click();
  await expect(page.locator("[data-career-toggle-work]")).toBeDisabled();
  await expect(page.locator(".career-work-menu")).toContainText("ne tient plus dans la semaine");
});

test("bloque clairement le travail et l’entraînement lorsque l’état physique est critique", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    week: 8,
    jobId: "convenience",
    jobsHeldCount: 1,
    gymWeeks: 4,
    energy: 40,
    fatigue: 84,
  }));

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await page.locator('[data-career-work-zone="schedule"]').click();
  await expect(page.locator(".career-work-menu")).toContainText("L’état physique est critique");
  await expect(page.locator("[data-career-toggle-work]")).toBeDisabled();
  await page.locator("[data-career-work-menu-close]").click();
  await page.locator("[data-career-leave-work]").click();

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await page.locator('[data-career-gym-zone="coach"]').click();
  await expect(page.locator(".career-gym-menu")).toContainText("L’état physique est critique");
  await expect(page.locator("[data-career-coach-session]")).toBeDisabled();
});

test("cumule trois absences espacées, congédie puis attend 1 à 3 semaines avant la nouvelle embauche", async ({ page }) => {
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
    localStorage.setItem("boxeur-deux-career", JSON.stringify(value));
  }, snapshot);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  const missWorkWeek = async expectedAbsences => {
    await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
    await page.locator('[data-career-work-zone="schedule"]').click();
    await page.locator("[data-career-toggle-work]").click();
    await page.locator('[data-career-work-zone="schedule"]').click();
    await expect(page.locator(".career-work-menu")).toContainText("aucune paie");
    await page.locator("[data-career-work-menu-close]").click();
    await page.locator("[data-career-leave-work]").click();
    await confirmWeekFromLauncher(page);
    await expect(page.locator(".career-week-summary")).toBeVisible();
    await expect(page.locator(".career-week-summary")).toContainText(expectedAbsences < 2 ? "Première absence" : expectedAbsences === 2 ? "Dernier avertissement" : "Emploi perdu");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
    if (expectedAbsences < 3) {
      expect(saved.state.jobId).toBe("convenience");
      expect(saved.state.missedWorkWeeks).toBe(expectedAbsences);
    } else {
      expect(saved.state.jobId).toBeNull();
      expect(saved.state.missedWorkWeeks).toBe(0);
    }
    await page.locator("[data-career-week-summary-close]").click();
  };

  const workWeekWithoutClearingAbsences = async expectedAbsences => {
    await confirmWeekFromLauncher(page);
    await expect(page.locator(".career-week-summary")).toBeVisible();
    await expect(page.locator(".career-week-summary")).toContainText("Présence enregistrée");
    await expect(page.locator(".career-week-summary")).toContainText(`${expectedAbsences}/3 absence`);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
    expect(saved.state.jobId).toBe("convenience");
    expect(saved.state.missedWorkWeeks).toBe(expectedAbsences);
    await page.locator("[data-career-week-summary-close]").click();
  };

  await missWorkWeek(1);
  await workWeekWithoutClearingAbsences(1);
  await missWorkWeek(2);
  await workWeekWithoutClearingAbsences(2);
  await missWorkWeek(3);
  await expect(page.locator("#job-loss-dialog")).toBeVisible();
  await expect(page.locator("#job-loss-copy")).toContainText("trois absences injustifiées cumulées");
  await page.locator("#job-loss-acknowledge").click();

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await expect(page.locator('.career-work-board-scene [data-select-job]')).toHaveCount(4);
  await expect(page.locator("#job-dialog")).not.toBeVisible();
  await page.locator('.career-work-board-scene [data-select-job="warehouse"]').click();
  await expect(page.locator("#job-dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: /Entrer : Emploi/ })).toHaveAccessibleName(/Candidature en cours/);

  for (let elapsed = 1; elapsed <= 3; elapsed += 1) {
    await confirmWeekFromLauncher(page);
    await expect(page.locator(".career-week-summary")).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
    if (elapsed < 3) {
      expect(saved.state.jobId).toBeNull();
      expect(saved.state.jobApplication.progress).toBe(elapsed);
      expect(saved.state.jobApplication.requiredWeeks).toBe(3);
    } else {
      expect(saved.state.jobId).toBe("warehouse");
      expect(saved.state.jobApplication).toBeNull();
    }
    await page.locator("[data-career-week-summary-close]").click();
  }
});

test("protège le budget du premier GYM de boxe contre les dépenses de musculation", async ({ page }) => {
  await openFreshCareer(page);
  await createCareer(page, { firstName: "Mia", lastName: "Budget" });
  await page.locator("#onboarding-guide-acknowledge").click();
  await page.locator('[data-select-job="convenience"]').click();
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(saved.initialGymRequired).toBe(true);

  const strengthGym = page.locator('.career-map-hotspot[data-career-location="strength-gym"]');
  await expect(strengthGym).toBeDisabled();
  await expect(strengthGym).toHaveAccessibleName(/Accès verrouillé.*passage amateur/i);

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await page.locator('[data-career-gym-zone="reception"]').first().click();
  await expect(page.locator("#membership-dialog")).toBeVisible();
  await page.locator('[data-gym-plan="monthly"]').click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(saved.money).toBe(110);
  expect(saved.initialGymRequired).toBe(false);
  expect(saved.gymWeeks).toBe(4);
});

test("crédite les vacances payées après huit semaines dans le même emploi", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    week: 2,
    money: 250,
    gymWeeks: 4,
    jobId: "courier",
    jobTenureWeeks: 7,
    initialGymRequired: false,
  }));

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await expect(page.locator(".career-work-vacation-card")).toContainText("0/3 semaines en banque");
  await expect(page.locator(".career-work-vacation-card")).toContainText("Prochaine semaine après 1 semaine travaillée");
  await page.locator('[data-career-work-zone="schedule"]').click();
  await expect(page.locator(".career-work-vacation-summary")).toContainText("première semaine est acquise après 8 semaines travaillées");
  await page.locator("[data-career-work-menu-close]").click();
  await page.locator("[data-career-leave-work]").click();

  await confirmWeekFromLauncher(page);
  await expect(page.locator(".career-week-summary")).toBeVisible();
  await expect(page.locator(".career-week-summary")).toContainText("Vacances acquises");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(saved.money).toBe(350);
  expect(saved.jobVacationEarnedAtTenure).toBe(8);
  expect(saved.vacationBankWeeks).toBe(1);
  expect(saved.missedWorkWeeks).toBe(0);
});

test("une semaine de vacances remplace le travail sans coût ni pénalité et reste annulable avant confirmation", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    week: 2,
    money: 250,
    energy: 72,
    fatigue: 18,
    gymWeeks: 4,
    jobId: "courier",
    jobTenureWeeks: 8,
    jobVacationEarnedAtTenure: 8,
    vacationBankWeeks: 1,
    jobWagesEarned: 800,
    initialGymRequired: false,
  }));

  const launcher = page.locator(".career-week-launcher");
  const capacityWithWork = Number(await launcher.locator("progress").getAttribute("value"));
  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await page.locator('[data-career-work-zone="schedule"]').click();
  await expect(page.locator("[data-career-toggle-vacation]")).toContainText("Prendre une semaine de vacances");
  await page.locator("[data-career-toggle-vacation]").click();
  await expect(page.locator(".career-work-vacation-card")).toContainText("Prévues cette semaine · 100 $ de paie maintenue");
  const capacityOnVacation = Number(await launcher.locator("progress").getAttribute("value"));
  expect(capacityOnVacation).toBeGreaterThan(capacityWithWork);

  let saved = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(saved.main.state.vacationBankWeeks).toBe(1);
  expect(saved.capsule.previewRuntime.weekPlanner.paidVacationPlanned).toBe(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await expect(page.locator(".career-work-vacation-card")).toContainText("Prévues cette semaine");
  await page.locator('[data-career-work-zone="schedule"]').click();
  await expect(page.locator(".career-work-menu")).toContainText("sans coût d’énergie, de fatigue ou de capacité et sans absence");
  await page.locator("[data-career-toggle-vacation]").click();
  expect(Number(await launcher.locator("progress").getAttribute("value"))).toBe(capacityWithWork);
  saved = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(saved.main.state.vacationBankWeeks).toBe(1);
  expect(saved.capsule.previewRuntime.weekPlanner.paidVacationPlanned).toBe(false);

  await page.locator('[data-career-work-zone="schedule"]').click();
  await page.locator("[data-career-toggle-vacation]").click();
  await page.locator("[data-career-leave-work]").click();
  await confirmWeekFromLauncher(page);
  await expect(page.locator(".career-week-summary")).toContainText("Vacances payées utilisées");
  await expect(page.locator(".career-week-summary")).toContainText("Paie brute");
  await expect(page.locator(".career-week-summary")).toContainText("+100 $");

  saved = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(saved.main.state.money).toBe(350);
  expect(saved.main.state.vacationBankWeeks).toBe(0);
  expect(saved.main.state.missedWorkWeeks).toBe(0);
  expect(saved.main.state.jobTenureWeeks).toBe(9);
  expect(saved.main.state.jobWagesEarned).toBe(900);
  expect(saved.capsule.previewRuntime.weekLedgers["2"].paidVacationWeeks).toBe(1);
  const vacationAction = saved.capsule.previewRuntime.weeklySummaries[0].actions
    .find(record => record.primitive?.plannerActivityId === "paid-vacation");
  expect(vacationAction.primitive.activity.energyCost).toBe(0);
  expect(vacationAction.primitive.activity.fatigueGain).toBe(0);
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

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  await page.locator('[data-career-work-zone="schedule"]').click();
  await page.locator("[data-career-toggle-work]").click();
  await page.locator("[data-career-leave-work]").click();
  await confirmWeekFromLauncher(page);
  await expect(page.locator(".career-week-summary")).toContainText("Indemnité de vacances : +40 $");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(saved.money).toBe(290);
  expect(saved.jobId).toBeNull();
  expect(saved.vacationBankWeeks).toBe(0);
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

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  const hiddenTile = page.locator("[data-career-developer-secret]");
  await expect(hiddenTile).toBeVisible();
  for (let activation = 0; activation < 5; activation += 1) await hiddenTile.click();
  await page.locator("#developer-code-input").fill("128");
  await page.locator("#developer-code-form").press("Enter");
  await expect(page.locator("#developer-test-dialog")).toBeVisible();
  await expect(page.locator('[data-developer-tool="test-sparring"]')).toContainText("Sparring immédiat");
  await expect(page.locator('[data-developer-tool="test-fight"]')).toContainText("Combat immédiat");

  const careerBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));

  await page.locator('[data-developer-tool="test-sparring"]').click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-week-label")).toContainText("Sparring immédiat · mode développeur");
  await expect(page.locator("#fight-opponent-name")).toContainText("Banc d’essai");
  await completeFight(page);
  await expect(page.locator("#fight-score-label")).toHaveText("Sparring non comptabilisé");
  await expect(page.locator("#fight-instruction")).toContainText("la carrière, le bilan, les jauges et le calendrier sont restés intacts");
  await expect(page.locator(".fight-career-debrief")).toContainText("Bilan du combat");
  await expect(page.locator(".fight-career-debrief")).toContainText("Aucun effet sur la carrière");
  await page.locator("#fight-instruction button.primary-button", { hasText: "Retour au menu test" }).click();
  await expect(page.locator("#developer-test-dialog")).toBeVisible();

  let careerAfter = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(careerAfter.state).toEqual(careerBefore.state);
  expect(careerAfter.weeklyPlan).toEqual(careerBefore.weeklyPlan);

  await page.locator('[data-developer-tool="test-fight"]').click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-week-label")).toContainText("Combat immédiat · mode développeur");
  await completeFight(page);
  await expect(page.locator("#fight-instruction")).toContainText("la carrière, le bilan, les jauges et le calendrier sont restés intacts");
  await expect(page.locator(".fight-career-debrief")).toContainText("Repères du ring");
  await page.locator("#fight-instruction button.primary-button", { hasText: "Retour au menu test" }).click();
  await expect(page.locator("#developer-test-dialog")).toBeVisible();

  careerAfter = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(careerAfter.state).toEqual(careerBefore.state);
  expect(careerAfter.weeklyPlan).toEqual(careerBefore.weeklyPlan);
});

test("met en avant les montées de niveau et les congédiements", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({ experience: 39, gymWeeks: 4, initialGymRequired: false }));
  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await page.locator('[data-career-gym-zone="coach"]').click();
  await page.locator("[data-career-coach-session]").click();
  await page.locator("[data-career-leave-gym]").click();
  await confirmWeekFromLauncher(page);
  await expect(page.locator(".career-week-summary")).toBeVisible();
  await page.locator("[data-career-week-summary-close]").click();
  await expect(page.locator("#level-up-dialog")).toBeVisible();
  await expect(page.locator("#level-up-title")).toContainText("Niveau 2 atteint");
  await expect(page.locator("#level-up-rewards")).toContainText("+50 $");
  await page.locator("#level-up-allocate").click();
  await expect(page.locator("#level-dialog")).toBeVisible();
  for (let point = 0; point < 3; point += 1) await page.locator("#level-choices [data-level-stat]:not([disabled])").first().click();
  await expect(page.locator("#level-dialog")).not.toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(saved.level).toBe(2);
  expect(saved.levelPoints).toBe(0);
  expect(saved.money).toBe(270);
});

test("offre un supplément puis un cours privé selon la rotation des niveaux", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({ level: 2, experience: 150, gymWeeks: 4 }));
  await expect(page.locator("#level-up-dialog")).toBeVisible();
  await expect(page.locator("#level-up-title")).toContainText("Niveau 4 atteint");
  await expect(page.locator("#level-up-rewards")).toContainText("Boisson sportive en cadeau");
  await expect(page.locator("#level-up-rewards")).toContainText("Un cours privé offert");
  await page.locator("#level-up-later").click();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(saved.level).toBe(4);
  expect(saved.levelPoints).toBe(6);
  expect(saved.supplementState.inventory["sports-drink"]).toBe(1);
  expect(saved.privateLessonCredits).toBe(1);

  await page.locator('[data-career-nav="fighter"]').click();
  await expect(page.locator(".career-fighter-identity")).toContainText("Cours privé offert");
  await expect(page.locator(".career-fighter-identity")).toContainText("1 bon");
  await page.locator('.career-location-sheet [data-career-nav="map"]').click();
  const moneyBeforeFreeLesson = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")).previewRuntime.career.money);
  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).first().click();
  await page.locator('[data-career-gym-zone="coach"]').click();
  await page.locator("[data-career-boxing-trainer]").click();
  await expect(page.locator(".career-trainer-credit-banner")).toContainText("1 séance privée gratuite");
  await expect(page.locator(".career-trainer-credit-banner")).toContainText("appliqué automatiquement");
  const freeClubLesson = page.locator('.career-trainer-offer:has([data-career-trainer-start="boxing-club"])');
  await expect(freeClubLesson).toContainText("120 $ 0 $ · séance unique");
  await expect(freeClubLesson).toContainText("cette séance est offerte");
  await page.locator('[data-career-trainer-start="boxing-club"]').click();
  await expect(page.locator("#trainer-session-dialog")).toContainText("bon appliqué");
  await page.locator('[data-career-trainer-confirm="boxing-club"]').click();
  const privateSupplementChoice = page.locator("#session-supplement-dialog");
  await expect(privateSupplementChoice).toBeVisible();
  await expect(privateSupplementChoice).toContainText("Séance privée · Olivier Martel");
  await expect(privateSupplementChoice).toContainText("Boisson sportive ×1");
  await expect(privateSupplementChoice).not.toContainText("undefined");
  await privateSupplementChoice.locator('[data-career-session-supplement="sports-drink"]').click();
  await expect(privateSupplementChoice).toBeHidden();
  const afterFreeLesson = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")).previewRuntime.career);
  expect(afterFreeLesson.money).toBe(moneyBeforeFreeLesson);
  expect(afterFreeLesson.privateLessonCredits).toBe(0);
  expect(afterFreeLesson.trainerState.activeProgram.sessionsTotal).toBe(1);
  const privateEntry = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")).previewRuntime.weekPlanner.entries.find(entry => entry.activityId === "private-training"));
  expect(privateEntry.supplementId).toBe("sports-drink");
});

test("augmente la capacité au niveau 5 sans réserver automatiquement le repos", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    level: 4,
    experience: 220,
    energy: 60,
    fatigue: 65,
    gymWeeks: 4,
    jobId: "office",
    jobsHeldCount: 1,
  }));

  await expect(page.locator("#level-up-dialog")).toBeVisible();
  await expect(page.locator("#level-up-title")).toContainText("Niveau 5 atteint");
  await expect(page.locator("#level-up-rewards")).toContainText("+5 capacité hebdomadaire");
  await expect(page.locator("#level-up-rewards")).toContainText("maximum permanent passe à 55");
  await page.locator("#level-up-later").click();

  const launcher = page.locator(".career-week-launcher");
  await expect(launcher.locator("progress")).toHaveAttribute("max", "55");
  await expect(launcher).not.toContainText("points gardés pour le repos");

  await page.locator("[data-career-week-detailed]").click();
  await expect(page.locator(".career-week-plan")).toContainText("Ton maximum permanent reste intact");
  await expect(page.locator('[data-career-week-rest-reserve]')).toHaveCount(0);
  await page.locator("[data-career-week-plan-close]").first().click();

  await page.getByRole("button", { name: /Entrer : Maison/ }).click();
  const capacityBeforeRest = Number(await page.locator(".career-home-week-plan meter").getAttribute("value"));
  await page.locator('[data-career-home-zone="bed"]').click();
  const capacityAfterRest = Number(await page.locator(".career-home-week-plan meter").getAttribute("value"));
  expect(capacityAfterRest).toBe(capacityBeforeRest - 10);
  await expect(page.locator(".career-home-week-plan")).toContainText("Journée de repos");
});

test("affiche le repos forcé comme capacité déjà occupée dans la semaine suivante", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    week: 4,
    jobId: null,
    jobsHeldCount: 0,
    energy: 60,
    fatigue: 40,
    recoveryConsequence: { kind: "forced-rest", week: 4, capacityCost: 10, medicalCost: 0 },
  }));

  const launcher = page.locator(".career-week-launcher");
  await expect(launcher.locator("progress")).toHaveAttribute("max", "50");
  await expect(launcher.locator("progress")).toHaveAttribute("value", "40");
  await expect(launcher).toContainText("Repos forcé");

  await page.locator("[data-career-week-detailed]").click();
  const plan = page.locator(".career-week-plan");
  await expect(plan).toContainText("10 par le repos forcé");
  const forcedRecovery = plan.locator(".career-week-plan-items li", { hasText: "Repos forcé" });
  await expect(forcedRecovery).toContainText("−10 capacité");
  await expect(forcedRecovery).toContainText("Prévu par défaut");
  await expect(forcedRecovery.locator("[data-career-week-remove]")).toHaveCount(0);
});

test("affiche les deux divisions du même tournoi extérieur et le conseil du coach abonné", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    week: 9,
    money: 1000,
    gymWeeks: 4,
    amateurRecord: { wins: 4, losses: 0, draws: 0 },
  }));
  await page.locator("[data-career-open-calendar]").first().click();
  const nextTournamentIndicator = page.locator("#next-tournament-indicator");
  await expect(nextTournamentIndicator).toContainText("Prochain tournoi admissible");
  await expect(nextTournamentIndicator).toContainText("Coupe régionale des clubs");
  await expect(nextTournamentIndicator).toContainText("Semaine 11 · dans 2 semaines");
  const regionalCup = page.locator(".calendar-event", { hasText: "Coupe régionale des clubs" });
  const regionalWeek = regionalCup.locator("xpath=ancestor::details[contains(@class, 'calendar-week-group')][1]");
  await expect(regionalWeek.locator(".calendar-week-tournament-badge")).toHaveText("Tournoi");
  if (!await regionalWeek.getAttribute("open")) await regionalWeek.locator(":scope > summary").click();
  await expect(regionalCup).toBeVisible();
  await expect(regionalCup).toContainText("Division Relève");
  await expect(regionalCup).toContainText("Division Ouverte");
  await expect(regionalCup.locator(".calendar-coach-advice")).toContainText("Conseil du coach");
  const noviceEntry = regionalCup.locator('[data-tournament-division="novice"]:not([disabled])').first();
  await expect(noviceEntry).toBeVisible();
  await noviceEntry.click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(saved.bookings).toHaveLength(1);
  expect(saved.bookings[0].event.divisionId).toBe("novice");
  expect(saved.bookings[0].event.name).toContain("Division Relève");
});

test("réserve un gala et joue un combat tactique complet avant de révéler les trois cartes", async ({ page }) => {
  test.setTimeout(60_000);
  await openStoredCareer(page, amateurSnapshot({
    profile: { firstName: "Jade", lastName: "Decision", sex: "female", weightClass: "W57", style: "counter", corner: "blue" },
    jobId: "convenience",
    jobsHeldCount: 1,
    missedWorkWeeks: 1,
    jobTenureWeeks: 3,
    jobWagesEarned: 225,
    gymWeeks: 8,
    strengthGymWeeks: 4,
  }));
  await bookCurrentGala(page);
  const reservedRosterOpponent = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state.scheduledFight.opponent);
  await startTacticalFight(page);
  const ringRosterStats = await page.evaluate(() => fightState.fighters.opponent.stats);
  expect(ringRosterStats).toEqual(reservedRosterOpponent.stats);
  await expect(page.locator(".sparring-combat-hud")).toBeHidden();

  const viewport = page.viewportSize();
  const coachBox = await page.locator("#fight-coach-choices [data-coach-option]").first().boundingBox();
  expect(coachBox && coachBox.y + coachBox.height).toBeLessThanOrEqual(viewport.height);
  await chooseCoachDirective(page);
  await expect(page.locator(".sparring-combat-hud")).toBeVisible();
  await expect(page.locator("#sparring-player-energy-bar")).toHaveCSS("opacity", "1");
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-scene", "ring");
  await expect(page.locator("#fight-choices [data-fight-action]")).toHaveCount(5);
  await expect(page.locator(".local-fight-ring-backdrop")).toBeVisible();
  await expect(page.locator(".sparring-south-ropes")).toBeVisible();
  const actionBox = await page.locator("#fight-choices [data-fight-action]").first().boundingBox();
  expect(actionBox && actionBox.y + actionBox.height).toBeLessThanOrEqual(viewport.height);

  await completeFight(page);

  await expect(page.locator("#fight-round")).toHaveText("Combat terminé");
  await expect(page.locator("#fight-status")).toContainText(/Victoire|Défaite|KO|TKO/);
  await expect(page.locator("#fight-score-label")).toHaveText(/Décision · 3 juges/);
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-scene", "after");
  await expect(page.locator(".local-fight-after-backdrop")).toBeVisible();
  await expect(page.locator("#fight-judge-cards")).toBeVisible();
  await expect(page.locator("#fight-judge-cards .judge-card")).toHaveCount(3);
  await expect(page.locator("#fight-score")).toHaveText(/^(3–0|2–1|1–2|0–3)$/);
  await expect(page.locator(".fight-career-debrief")).toContainText("Condition");
  await expect(page.locator(".fight-career-debrief")).toContainText("Progression");
  await expect(page.locator(".fight-career-debrief")).toContainText("Finances");
  await expect(page.locator(".fight-career-debrief")).toContainText(/1 V · 0 D|0 V · 1 D/);

  const persistedBeforeClosingResult = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(persistedBeforeClosingResult.state.week).toBe(2);
  expect(persistedBeforeClosingResult.state.amateurRecord.wins + persistedBeforeClosingResult.state.amateurRecord.losses).toBe(1);
  expect(persistedBeforeClosingResult.state.missedWorkWeeks).toBe(1);
  expect(persistedBeforeClosingResult.state.jobTenureWeeks).toBe(4);
  expect(persistedBeforeClosingResult.state.jobWagesEarned).toBe(300);
  expect(persistedBeforeClosingResult.state.gymWeeks).toBe(7);
  expect(persistedBeforeClosingResult.state.strengthGymWeeks).toBe(3);
  const rosterResult = persistedBeforeClosingResult.state.rosterState;
  expect(rosterResult.lastProcessedWeek).toBe(1);
  expect(rosterResult.reservations).toEqual([]);
  const playerMatches = rosterResult.matches.filter(match => match.source === "player");
  expect(playerMatches).toHaveLength(1);
  expect(playerMatches[0].fighterIds).toEqual(["player", reservedRosterOpponent.rosterFighterId]);
  const affiliated = rosterResult.fighters.find(fighter => fighter.id === reservedRosterOpponent.rosterFighterId);
  expect(affiliated.record.losses - affiliated.initialRecord.losses).toBe(persistedBeforeClosingResult.state.amateurRecord.wins);
  expect(affiliated.record.wins - affiliated.initialRecord.wins).toBe(persistedBeforeClosingResult.state.amateurRecord.losses);
  await page.evaluate(() => finishFight());
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state.rosterState)).toEqual(rosterResult);

  await page.locator("#fight-instruction button.primary-button").click();
  const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(snapshot.state.amateurRecord.draws).toBe(0);
  expect(snapshot.state.amateurRecord.wins + snapshot.state.amateurRecord.losses).toBe(1);
  expect(snapshot.state.pendingWeekEvent).toBeNull();
  await expect(page.locator("#week-event-dialog")).toHaveCount(0);
  if (await page.locator("#calendar-dialog").isVisible()) {
    await page.locator('#calendar-dialog [data-career-nav="map"]').click();
  }
  await expect(page.locator(".career-objective-card")).toHaveCount(0);
  await page.locator('[data-career-nav="fighter"]').click();
  await expect(page.locator(".career-fighter-identity dl > div", { hasText: "Bilan" }).locator("dd")).not.toContainText(/N|nul/i);
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
  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  const employmentMetrics = await page.locator(".career-work-view").evaluate(element => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
  expect(employmentMetrics.scrollWidth).toBeLessThanOrEqual(employmentMetrics.clientWidth + 1);
  await page.locator("[data-career-leave-work]").click();

  await page.locator("[data-career-open-calendar]").first().click();
  await expect(page.locator("#calendar-dialog")).toBeVisible();
  await expect(page.locator('#calendar-dialog [data-career-primary-navigation]')).toBeVisible();
  await expect(page.locator('#calendar-dialog [data-career-nav="calendar"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#calendar-dialog-close, #calendar-dialog-done")).toHaveCount(0);
  await expect(page.locator("#pro-transition, #amateur-transition")).toHaveCount(0);
  await expect(page.locator("#recreational-path")).toBeHidden();
  await expect(page.locator("#calendar-dialog")).not.toContainText("Passer professionnel");
  const calendarWeeks = page.locator(".calendar-week-group");
  await expect(calendarWeeks).toHaveCount(6);
  await expect(calendarWeeks.first()).toHaveAttribute("open", "");
  await expect(calendarWeeks.nth(1)).not.toHaveAttribute("open", "");
  await expect(calendarWeeks.nth(1).locator(".calendar-week-content")).toBeHidden();
  const coachPick = page.locator(".calendar-event.recommended");
  await expect(coachPick).toHaveCount(1);
  await expect(coachPick).toBeVisible();
  await expect(coachPick.locator(".calendar-opponent-primary")).toContainText("Repère du coach");
  const alternateOpponents = coachPick.locator(".calendar-opponent-alternatives");
  await expect(alternateOpponents).toBeVisible();
  await expect(alternateOpponents.locator("[data-book-gala]").first()).toBeHidden();
  await alternateOpponents.locator("summary").click();
  await expect(alternateOpponents.locator("[data-book-gala]").first()).toBeVisible();
  await alternateOpponents.locator("summary").click();
  await expect(page.locator("#tournament-catalog")).not.toHaveAttribute("open", "");
  await expect(page.locator("#next-tournament-indicator")).toContainText("Coupe régionale des clubs");
  await expect(page.locator("#next-tournament-indicator")).toContainText("Semaine 11 · dans 10 semaines");
  const tournamentIndicatorMetrics = await page.locator("#next-tournament-indicator").evaluate(element => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
  expect(tournamentIndicatorMetrics.scrollWidth).toBeLessThanOrEqual(tournamentIndicatorMetrics.clientWidth + 1);
  await calendarWeeks.nth(1).locator(":scope > summary").click();
  await expect(calendarWeeks.first()).not.toHaveAttribute("open", "");
  await expect(calendarWeeks.nth(1)).toHaveAttribute("open", "");
  await calendarWeeks.first().locator(":scope > summary").click();
  await expect(calendarWeeks.first()).toHaveAttribute("open", "");
  await expect(calendarWeeks.nth(1)).not.toHaveAttribute("open", "");
  await page.locator('#calendar-dialog [data-career-nav="map"]').click();
  await expect(page.locator("#calendar-dialog")).not.toBeVisible();

  await bookCurrentGala(page);
  await startTacticalFight(page);

  const mobileFightLayout = await page.locator("#fight-dialog").evaluate(dialog => {
    const box = dialog.getBoundingClientRect();
    return { left: box.left, top: box.top, width: box.width, height: box.height, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });
  expect(Math.abs(mobileFightLayout.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(mobileFightLayout.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(mobileFightLayout.width - mobileFightLayout.viewportWidth)).toBeLessThanOrEqual(1);
  expect(Math.abs(mobileFightLayout.height - mobileFightLayout.viewportHeight)).toBeLessThanOrEqual(1);
  await expect(page.locator(".fight-mobile-details")).toBeVisible();
  await expect(page.locator("#sparring-player-energy-value")).toHaveText(/\d+ %/);
  await expect(page.locator("#sparring-opponent-energy-value")).toHaveText(/\d+ %/);
  await expect(page.locator(".sparring-combat-hud")).toBeHidden();
  await expect(page.locator(".fight-decision-area")).toBeHidden();

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
  await expect(page.locator(".sparring-combat-hud")).toBeVisible();
  await expect(page.locator("#sparring-player-energy-bar")).toHaveCSS("opacity", "0.78");
  await expect(page.locator(".fight-decision-area")).toBeVisible();
  const tacticalButtons = page.locator("#fight-choices [data-fight-action]:visible");
  expect(await tacticalButtons.count()).toBe(5);
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
  const tacticalType = await tacticalButtons.first().evaluate(button => ({
    title: parseFloat(getComputedStyle(button.querySelector("strong")).fontSize),
    detail: parseFloat(getComputedStyle(button.querySelector("span")).fontSize),
    meta: parseFloat(getComputedStyle(button.querySelector("em")).fontSize),
  }));
  expect(tacticalType.title).toBeGreaterThanOrEqual(14);
  expect(tacticalType.detail).toBeGreaterThanOrEqual(12);
  expect(tacticalType.meta).toBeGreaterThanOrEqual(11);

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
  await expect(page.locator(".sparring-combat-hud")).toBeHidden();
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

test("guide une nouvelle carrière sans permettre de contourner l’emploi ni le premier abonnement", async ({ page }) => {
  test.setTimeout(75_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await createCareer(page, { firstName: "Guide", lastName: "Parcours" });

  const guideIntroDialog = page.locator("#onboarding-guide-dialog");
  await expect(guideIntroDialog).toBeVisible();
  await expect(guideIntroDialog).toContainText("Ton parcours récréatif commence");
  await expect(guideIntroDialog).toContainText("Le Guide récréatif");
  await expect(guideIntroDialog).toContainText("colonne de droite sur ordinateur");
  await expect(guideIntroDialog).toContainText("choisir ton premier emploi");
  await expect(guideIntroDialog.locator("picture source")).toHaveAttribute("srcset", "assets/accueil-parcours-recreatif-mobile.png");
  await expect(guideIntroDialog.locator("picture img")).toHaveAttribute("src", "assets/accueil-parcours-recreatif-desktop.png");
  await page.keyboard.press("Escape");
  await expect(guideIntroDialog).toBeVisible();
  await page.locator("#onboarding-guide-acknowledge").click();
  await expect(guideIntroDialog).toBeHidden();

  const jobDialog = page.locator("#job-dialog");
  await expect(jobDialog).toBeVisible();
  await expect(jobDialog).toHaveAttribute("data-mandatory", "true");
  await expect(page.locator("#job-dialog-close")).toBeHidden();
  await expect(page.locator("#job-dialog-cancel")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(jobDialog).toBeVisible();
  await expect(page.locator("#job-options [data-select-job]:not([disabled])")).toHaveCount(4);
  await page.locator("#job-options [data-select-job]").first().click();
  await expect(jobDialog).toBeHidden();

  const guideCard = page.locator(".career-now-panel > .career-onboarding-card");
  await expect(guideCard).toContainText("T’inscrire au GYM de boxe");
  await expect(guideCard).toContainText("Obligatoire");
  await expect(guideCard).toContainText("Sur la carte, appuie sur « GYM de boxe »");
  const launcherConfirmation = page.locator(".career-week-launcher [data-career-week-detailed]");
  await expect(launcherConfirmation).toHaveText("Confirmer semaine");
  const launcherActions = await page.locator(".career-week-launcher-actions").evaluate(element => {
    const quick = element.querySelector("[data-career-week-quick]").getBoundingClientRect();
    const confirm = element.querySelector("[data-career-week-detailed]").getBoundingClientRect();
    return { quickTop: quick.top, confirmTop: confirm.top, confirmWidth: confirm.width, containerWidth: element.getBoundingClientRect().width };
  });
  expect(launcherActions.confirmTop).toBeLessThanOrEqual(launcherActions.quickTop + 1);
  expect(launcherActions.confirmWidth).toBeLessThan(launcherActions.containerWidth);
  await guideCard.locator('[data-career-location="boxing-gym"]').click();
  await expect(page.locator(".career-gym-view")).toBeVisible();
  const gymTutorial = page.locator(".career-gym-dashboard > .career-onboarding-card");
  await expect(gymTutorial).toContainText("T’inscrire au GYM de boxe");
  await expect(gymTutorial).toContainText("Dans le GYM, appuie sur « Accueil »");
  await expect(gymTutorial).toContainText("Obligatoire");
    const guideTop = await gymTutorial.evaluate(element => element.getBoundingClientRect().top);
    const weekPlanTop = await page.locator(".career-gym-week-plan").evaluate(element => element.getBoundingClientRect().top);
    const preparationTop = await page.locator(".career-gym-readiness").evaluate(element => element.getBoundingClientRect().top);
    const membershipTop = await page.locator(".career-gym-membership").evaluate(element => element.getBoundingClientRect().top);
    expect(guideTop).toBeLessThan(weekPlanTop);
    expect(guideTop).toBeLessThan(preparationTop);
    expect(guideTop).toBeLessThan(membershipTop);
  await expect(page.locator(".career-gym-access-lock")).toContainText("Inscription requise");

  await page.locator("[data-career-leave-gym]").click();
  await page.locator('[data-career-location="home"]').first().click();
  const homeTutorial = page.locator(".career-home-dashboard > .career-onboarding-card");
  await expect(homeTutorial).toHaveAttribute("data-career-onboarding-step", "purchase-initial-membership");
  await expect(homeTutorial).toContainText("Retourne à la carte, puis appuie sur « GYM de boxe »");
  const homeGuideTop = await homeTutorial.evaluate(element => element.getBoundingClientRect().top);
  const homeWeekPlanTop = await page.locator(".career-home-week-plan").evaluate(element => element.getBoundingClientRect().top);
  const homeConditionTop = await page.locator(".career-home-condition").evaluate(element => element.getBoundingClientRect().top);
  expect(homeGuideTop).toBeLessThan(homeWeekPlanTop);
  expect(homeGuideTop).toBeLessThan(homeConditionTop);
  await homeTutorial.locator('[data-career-location="boxing-gym"]').click();
  await expect(gymTutorial).toContainText("Dans le GYM, appuie sur « Accueil »");

  await page.locator("[data-career-leave-gym]").click();
  await page.locator('[data-career-location="work"]').first().click();
  const workTutorial = page.locator(".career-work-dashboard > .career-onboarding-card");
  await expect(workTutorial).toHaveAttribute("data-career-onboarding-step", "purchase-initial-membership");
  await expect(workTutorial).toContainText("Retourne à la carte, puis appuie sur « GYM de boxe »");
  const workGuideTop = await workTutorial.evaluate(element => element.getBoundingClientRect().top);
  const workHeadingTop = await page.locator(".career-work-dashboard > .career-work-status-card").evaluate(element => element.getBoundingClientRect().top);
  expect(workGuideTop).toBeLessThan(workHeadingTop);
  await workTutorial.locator('[data-career-location="boxing-gym"]').click();
  await expect(gymTutorial).toContainText("Dans le GYM, appuie sur « Accueil »");

  await gymTutorial.locator('[data-career-gym-zone="reception"]').click();

  const membershipDialog = page.locator("#membership-dialog");
  await expect(membershipDialog).toBeVisible();
  await expect(membershipDialog).toHaveAttribute("data-mandatory", "true");
  await expect(page.locator("#membership-dialog-close")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(membershipDialog).toBeVisible();
  await page.locator("#membership-options [data-gym-plan]").first().click();
  await expect(membershipDialog).toBeHidden();
  await expect(page.locator(".career-gym-view")).toContainText("Cours récréatifs");
  await expect(gymTutorial).toContainText("Faire une première séance");
  await gymTutorial.locator('[data-career-gym-zone="coach"]').click();
  await expect(page.locator("[data-career-coach-session]")).toBeEnabled();
  await expect(page.locator("[data-career-coach-session]")).toBeFocused();

  await page.locator("[data-career-gym-menu-close]").click();
  await page.locator("[data-career-leave-gym]").click();
  await expect(guideCard).toContainText("Faire une première séance");
  await expect(guideCard).toContainText("Facultatif");

  await guideCard.locator('[data-career-location="boxing-gym"]').click();
  await page.locator('.career-gym-hotspot[data-career-gym-zone="coach"]').click();
  await page.locator("[data-career-coach-session]").click();
  await expect(gymTutorial).toContainText("Prévoir une journée de repos");
  await expect(gymTutorial).toContainText("Va à la maison");
  await gymTutorial.locator('[data-career-location="home"]').click();
  await expect(homeTutorial).toHaveAttribute("data-career-onboarding-step", "week-1-add-rest");
  await expect(homeTutorial).toContainText("À la maison, appuie sur « Journée de repos »");
  await homeTutorial.locator('[data-career-home-action="rest"]').click();
  await expect(homeTutorial).toContainText("Ta première séance est planifiée");
  await expect(homeTutorial).toContainText("Rien n’est encore appliqué");
  await expect(homeTutorial.locator("[data-career-week-handoff]")).toHaveText("Confirmer semaine");
  await expect(homeTutorial.locator("[data-career-week-confirm]")).toHaveCount(0);
  const guideButtonWidth = await homeTutorial.locator("[data-career-week-handoff]").evaluate(element => ({
    button: element.getBoundingClientRect().width,
    container: element.parentElement.getBoundingClientRect().width,
  }));
  expect(guideButtonWidth.button).toBeGreaterThanOrEqual(guideButtonWidth.container - 1);

  await homeTutorial.locator("[data-career-week-handoff]").click();
  await expect(page.locator(".career-week-plan")).toBeVisible();
  await expect(page.locator(".career-week-engine-note")).toContainText("seront résolues seulement lorsque tu confirmeras");
  await page.locator("[data-career-week-plan-close]").first().click();
  await expect(guideCard).toContainText("Ta première séance est planifiée");
  await guideCard.locator("[data-career-week-handoff]").click();
  await page.locator(".career-week-plan [data-career-week-confirm]").click();
  await expect(page.locator(".career-week-summary")).toBeVisible();
  await expect(page.locator(".career-week-summary-guide")).toContainText("Comment lire ton premier bilan");
  await expect(page.locator("[data-career-week-summary-close]")).toHaveText("Continuer vers la semaine 2");
  const storedAfterConfirmation = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(storedAfterConfirmation.previewRuntime.onboardingState.completedObjectiveIds).toEqual(["week-1-first-session"]);
  await page.locator("[data-career-week-summary-close]").click();
  await expect(guideCard).toContainText("Suivre un plan préparé");

  await page.reload({ waitUntil: "domcontentloaded" });
  const storedAfterReload = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(storedAfterReload.previewRuntime.onboardingState.completedObjectiveIds).toEqual(["week-1-first-session"]);
  await expect(page.locator("#resume-dialog")).toBeVisible();
  await page.locator("#resume-load").click();
  await expect(guideCard).toContainText("Suivre un plan préparé");

  await page.locator('[data-career-nav="fighter"]').click();
  await expect(page.locator(".career-fighter-view")).toBeVisible();
  await expect(page.locator('.career-fighter-stat [role="progressbar"]')).toHaveCount(4);
  await expect(page.locator(".career-fighter-identity dd.money")).toContainText("185 $");
  await page.locator('.career-location-sheet [data-career-nav="map"]').click();

  await guideCard.locator("[data-career-week-quick]").click();
  await expect(page.locator(".career-week-plan")).toContainText("Cours de groupe");
  await expect(page.locator(".career-week-plan")).toContainText("Journée de repos");
  await page.locator("[data-career-week-plan-close]").first().click();
  await expect(guideCard).toContainText("Ton plan rapide est prêt");
  await guideCard.locator("[data-career-week-handoff]").click();
  await page.locator(".career-week-plan [data-career-week-confirm]").click();
  await expect(page.locator(".career-week-summary")).toBeVisible();
  await page.locator("[data-career-week-summary-close]").click();
  await expect(guideCard).toContainText("Préparer le point de départ");

  await guideCard.locator("[data-career-week-quick]").click();
  await page.locator("[data-career-week-plan-close]").first().click();
  await expect(guideCard).toContainText("Libérer du temps d’entraînement");
  await guideCard.locator('[data-career-location="work"]').click();
  await expect(workTutorial).toContainText("aucune paie");
  await workTutorial.locator("[data-career-toggle-work]").click();
  await expect(workTutorial).toContainText("Ajouter un deuxième entraînement");
  await workTutorial.locator('[data-career-location="home"]').click();
  await expect(homeTutorial).toContainText("shadow-boxing et le sac");
  await homeTutorial.locator('[data-career-home-menu="training"]').click();
  await page.locator('[data-career-home-action="home-quick"]').click();
  await expect(homeTutorial).toContainText("Ta semaine priorise l’entraînement");
  await homeTutorial.locator("[data-career-week-handoff]").click();
  await page.locator(".career-week-plan [data-career-week-confirm]").click();
  await expect(page.locator(".career-week-summary")).toContainText("Première absence");
  await page.locator("[data-career-week-summary-close]").click();
  await expect(guideCard).toContainText("Tester la course");

  await guideCard.locator('[data-career-location="home"]').click();
  await expect(homeTutorial).toContainText("Ouvre le menu Course par la porte");
  await homeTutorial.locator('[data-career-home-menu="running"]').click();
  await expect(page.locator('.career-home-menu')).toContainText("Court jog");
  await page.locator('[data-career-home-action="roadwork-short"]').click();
  await expect(homeTutorial).toContainText("Prévoir l’assimilation");
  await homeTutorial.locator('[data-career-home-action="rest"]').click();
  await expect(homeTutorial).toContainText("Course et récupération sont planifiées");
  await homeTutorial.locator("[data-career-week-handoff]").click();
  await page.locator(".career-week-plan [data-career-week-confirm]").click();
  await expect(page.locator(".career-week-summary")).toContainText("Présence enregistrée");
  await expect(page.locator(".career-week-summary")).toContainText("1/3 absence injustifiée demeure au dossier");
  await page.locator("[data-career-week-summary-close]").click();
  await expect(guideCard).toContainText("Renouveler l’abonnement au GYM");

  await guideCard.locator('[data-career-location="boxing-gym"]').click();
  await expect(gymTutorial).toContainText("quatre semaines du premier mois sont terminées");
  await expect(page.locator("[data-career-remy-sparring]")).toHaveCount(0);
  await gymTutorial.locator('[data-career-gym-zone="reception"]').click();
  await page.locator('#membership-options [data-gym-plan="monthly"]').click();
  await expect(gymTutorial).toContainText("Préparer la semaine avant Rémy");
  await gymTutorial.locator("[data-career-week-quick]").click();
  await page.locator("[data-career-week-plan-close]").first().click();
  await expect(guideCard).toContainText("Dernière semaine avant Rémy");
  await guideCard.locator("[data-career-week-handoff]").click();
  await page.locator(".career-week-plan [data-career-week-confirm]").click();
  await expect(page.locator(".career-week-summary")).toBeVisible();
  await page.locator("[data-career-week-summary-close]").click();
  await expect(guideCard).toContainText("Sparring avec Rémy");

  const storedBeforeRemy = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(storedBeforeRemy.timeState.clock.week).toBe(6);
  expect(storedBeforeRemy.previewRuntime.career.gymWeeks).toBe(3);
  expect(storedBeforeRemy.previewRuntime.onboardingState.completedObjectiveIds).toEqual([
    "week-1-first-session",
    "week-2-follow-plan",
    "week-3-training-priority",
    "week-4-roadwork",
    "week-5-renew-and-prepare",
  ]);
});

test("associe les cinq visuels de sparring aux six portraits jouables", async ({ page }) => {
  await openStoredCareer(page, recreationalReadySnapshot());
  const identities = [
    { sex: "male", portraitId: 0, prefix: null },
    { sex: "male", portraitId: 1, prefix: "male-2" },
    { sex: "male", portraitId: 2, prefix: "male-3" },
    { sex: "female", portraitId: 0, prefix: "female-1" },
    { sex: "female", portraitId: 1, prefix: "female-2" },
    { sex: "female", portraitId: 2, prefix: "female-3" },
  ];

  for (const identity of identities) {
    const actual = await page.evaluate(({ sex, portraitId }) => {
      state.profile.sex = sex;
      state.profile.portraitId = portraitId;
      configureSparringPlayerImages();
      const visuals = sparringPlayerVisualSet();
      return {
        visuals,
        front: sparringFighterAsset("player", { pose: "front" }),
        back: sparringFighterAsset("player", { pose: "back" }),
        opponentFront: sparringFighterAsset("opponent", { pose: "front" }),
        opponentBack: sparringFighterAsset("opponent", { pose: "back" }),
        before: document.querySelector(".sparring-before-backdrop")?.getAttribute("src"),
        corner: document.querySelector(".sparring-corner-backdrop")?.getAttribute("src"),
        after: document.querySelector(".sparring-after-backdrop")?.getAttribute("src"),
      };
    }, identity);
    const expected = identity.sex === "female"
      ? {
        front: `assets/sparring-player-${identity.prefix}-front.png`,
        back: `assets/sparring-player-${identity.prefix}-back.png`,
        before: `assets/sparring-nadia-${identity.prefix}-before-v1.png`,
        corner: `assets/sparring-nadia-${identity.prefix}-corner-v1.png`,
        after: `assets/sparring-nadia-${identity.prefix}-after-v1.png`,
      }
      : identity.prefix
      ? {
        front: `assets/sparring-player-${identity.prefix}-front.png`,
        back: `assets/sparring-player-${identity.prefix}-back.png`,
        before: `assets/sparring-player-${identity.prefix}-before.png`,
        corner: `assets/sparring-player-${identity.prefix}-corner.png`,
        after: `assets/sparring-player-${identity.prefix}-after.png`,
      }
      : {
        front: "assets/sparring-boxer-blue-front-v2.png",
        back: "assets/sparring-boxer-blue-back-v2.png",
        before: "assets/sparring-remy-before-v3.png",
        corner: "assets/sparring-remy-corner-v3.png",
        after: "assets/sparring-remy-after-v3.png",
      };
    const expectedOpponent = identity.sex === "female"
      ? {
        opponentFront: "assets/sparring-nadia-front-v1.png",
        opponentBack: "assets/sparring-nadia-back-v1.png",
      }
      : {
        opponentFront: "assets/sparring-boxer-red-front-v2.png",
        opponentBack: "assets/sparring-boxer-red-back-v2.png",
      };
    expect(actual.visuals).toEqual(expected);
    expect(actual).toMatchObject({ ...expected, ...expectedOpponent });
    for (const asset of [...Object.values(expected), ...Object.values(expectedOpponent)]) {
      const stats = await fs.stat(path.join(PROJECT_ROOT, asset));
      expect(stats.size).toBeGreaterThan(0);
    }
  }
});

test("utilise seulement des adversaires et portraits féminins dans les combats officiels féminins", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    profile: { sex: "female", firstName: "Jade", weightClass: "W57", portraitId: 2 },
  }));
  const audit = await page.evaluate(() => {
    const local = state.rosterState.fighters;
    const tournament = generateTournamentOpponents(tournamentDefs.find(item => item.id === "bronze"));
    configureRingImages();
    return {
      localIds: local.map(opponent => opponent.id),
      localNames: local.map(opponent => opponent.name),
      tournamentNames: tournament.map(opponent => opponent.name),
      femaleTournamentNames: tournamentNamesFemale.map(identity => `${identity[0]} ${identity[1]}`),
      portrait: opponentPortraitAsset(),
      playerImage: document.querySelector(".ring-fighter-player .ring-fighter-silhouette")?.style.getPropertyValue("--fighter-image"),
      opponentImage: document.querySelector(".ring-fighter-opponent .ring-fighter-silhouette")?.style.getPropertyValue("--fighter-image"),
    };
  });
  expect(audit.localIds.every(id => id.startsWith("f-"))).toBe(true);
  expect(audit.localNames).toContain("Sophie Bouchard");
  expect(audit.tournamentNames.every(name => audit.femaleTournamentNames.includes(name))).toBe(true);
  expect(audit.portrait).toMatch(/assets\/boxeuse-coin-(bleu|rouge)\.webp/);
  expect(audit.playerImage).toMatch(/boxeuse-coin-(bleu|rouge)\.webp/);
  expect(audit.opponentImage).toMatch(/boxeuse-coin-(bleu|rouge)\.webp/);
  expect(audit.playerImage).not.toBe(audit.opponentImage);
});

test("présente Nadia comme première partenaire de sparring du parcours féminin", async ({ page }) => {
  test.setTimeout(60_000);
  await openStoredCareer(page, recreationalReadySnapshot({
    profile: { sex: "female", firstName: "Jade", weightClass: "W57", portraitId: 1 },
    journal: [{ week: 6, text: "Nadia attend au GYM avec Rémy." }],
  }));

  await expect(page.locator(".career-now-panel > .career-objective-card")).toContainText("Sparring avec Nadia");
  await expect(page.locator(".career-now-panel > .career-objective-card")).toContainText("Nadia Bouchard « La Muraille »");
  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await expect(page.locator('[data-career-gym-zone="ring"]')).toContainText("Sparring pédagogique avec Nadia");
  await page.locator('[data-career-gym-zone="ring"]').click();

  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-week-label")).toContainText("Nadia Bouchard « La Muraille »");
  await expect(page.locator("#fight-opponent-name")).toHaveText("Nadia Bouchard");
  await expect(page.locator(".sparring-opponent-energy")).toHaveAttribute("aria-label", "Énergie de Nadia");
  await expect(page.locator(".sparring-before-backdrop")).toHaveAttribute("src", "assets/sparring-nadia-female-2-before-v1.png");
  await expect(page.locator(".ring-fighter-opponent .sparring-fighter-image")).toHaveAttribute("src", "assets/sparring-nadia-front-v1.png");
  await expect.poll(() => page.locator(".sparring-before-backdrop").evaluate(image => image.complete ? image.naturalWidth : 0)).toBeGreaterThan(0);
  await expect.poll(() => page.locator(".ring-fighter-opponent .sparring-fighter-image").evaluate(image => image.complete ? image.naturalWidth : 0)).toBeGreaterThan(0);
  await chooseCoachDirective(page);
  await completeFight(page);
  await expect(page.locator("#fight-score-label")).toHaveText("Sparring non comptabilisé");
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-scene", "after");
  await expect(page.locator(".sparring-after-backdrop")).toHaveAttribute("src", "assets/sparring-nadia-female-2-after-v1.png");
  await expect(page.locator("#fight-instruction")).toContainText("Ce que Rémy et Nadia veulent te montrer");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(stored.state.amateurRecord).toEqual({ wins: 0, losses: 0, draws: 0 });
  expect(stored.state.recreationalSparringStatus).toBe("completed");
});

test("joue le sparring interactif de Rémy puis passe automatiquement amateur avec une célébration", async ({ page }) => {
  test.setTimeout(60_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const snapshot = recreationalReadySnapshot();
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career", JSON.stringify(value));
  }, snapshot);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  const lockedStrengthGym = page.locator('.career-map-hotspot[data-career-location="strength-gym"]');
  const lockedArena = page.locator('.career-map-hotspot[data-career-location="arena"]');
  await expect(lockedStrengthGym).toBeDisabled();
  await expect(lockedArena).toBeDisabled();
  await expect(lockedStrengthGym).toHaveAccessibleName(/Accès verrouillé.*Gym de musculation.*passage amateur/i);
  await expect(lockedArena).toHaveAccessibleName(/Accès verrouillé.*Aréna.*passage amateur/i);

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await expect(page.locator('[data-career-gym-zone="ring"]')).toBeEnabled();
  await page.locator('[data-career-gym-zone="ring"]').click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-dialog")).toHaveClass(/sparring-ring-prototype/);
  await expect(page.locator("#fight-week-label")).toContainText("Rémy « Le Tank »");
  await expect.poll(() => page.locator(".sparring-ring-backdrop").evaluate(image => image.complete ? image.naturalWidth : 0)).toBeGreaterThan(0);
  await expect.poll(() => page.locator(".sparring-before-backdrop").evaluate(image => image.complete ? image.naturalWidth : 0)).toBeGreaterThan(0);
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-scene", "before");
  await expect(page.locator(".sparring-combat-hud")).toBeHidden();
  await chooseCoachDirective(page);
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-scene", "ring");
  await expect(page.locator(".sparring-player-energy")).toBeVisible();
  await expect(page.locator(".sparring-opponent-energy")).toBeVisible();
  await expect(page.locator("#sparring-round-hud")).toHaveText("ROUND 1 / 3");
  await expect(page.locator("#sparring-perception-hud")).toBeVisible();
  await expect(page.locator("#sparring-perception-hud")).toHaveAttribute("aria-label", /round|lecture/i);
  await expect(page.locator("[data-sparring-move]")).toHaveCount(0);
  await expect(page.locator("#fight-choices [data-fight-action]")).toHaveCount(5);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#sparring-coach-callout")).toBeHidden();
  const mobileMetrics = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth }));
  expect(mobileMetrics.body).toBeLessThanOrEqual(mobileMetrics.viewport + 1);
  const mobileChoices = page.locator("#fight-choices [data-fight-action]");
  for (const choice of await mobileChoices.all()) {
    const box = await choice.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }
  const energyBeforeChoice = Number(await page.locator(".sparring-player-energy").getAttribute("aria-valuenow"));
  await mobileChoices.first().click();
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-step", "resolving");
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-movement", /hold|advance|retreat|lateral/);
  await waitForAutomaticSparringResolution(page);
  await expect.poll(async () => Number(await page.locator(".sparring-player-energy").getAttribute("aria-valuenow"))).toBeLessThan(energyBeforeChoice);
  await expect(page.locator("#fight-choices [data-fight-action]")).toHaveCount(5);
  await completeFight(page);
  await expect(page.locator("#fight-score-label")).toHaveText("Sparring non comptabilisé");
  await expect(page.locator("#fight-score")).toHaveText("—");
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-scene", "after");
  await expect(page.locator("#fight-instruction")).toContainText("Ce que Rémy veut te montrer");

  const storedAfterSparring = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(storedAfterSparring.state.amateurRecord).toEqual({ wins: 0, losses: 0, draws: 0 });
  expect(storedAfterSparring.state.recreationalSparringStatus).toBe("completed");
  expect(storedAfterSparring.state.careerStatus).toBe("amateur");
  expect(storedAfterSparring.state.week).toBe(1);
  expect(storedAfterSparring.state.rosterState).toMatchObject({ startWeek: 1, lastProcessedWeek: 0, initialLevelOffset: 0, matches: [] });
  expect(storedAfterSparring.state.amateurPromotionPending).toBe(true);
  await expect(page.locator("#fight-instruction")).toContainText("activé automatiquement");
  await page.locator("#fight-instruction button.primary-button", { hasText: "Voir mon passage amateur" }).click();

  const promotionDialog = page.locator("#amateur-promotion-dialog");
  await expect(promotionDialog).toBeVisible();
  await expect(promotionDialog).toContainText("Tu es maintenant amateur");
  await expect(promotionDialog).toContainText("Rémy « Le Tank »");
  await expect(promotionDialog).toContainText("Calendrier compétitif");
  await expect(promotionDialog).toContainText("Sparring régulier");
  await expect(promotionDialog).toContainText("Musculation");
  await expect(promotionDialog.locator("picture source")).toHaveAttribute("srcset", "assets/passage-amateur-mobile.png");
  await expect(promotionDialog.locator("picture img")).toHaveAttribute("src", "assets/passage-amateur-desktop.png");
  await expect.poll(() => promotionDialog.locator("picture img").evaluate(image => image.currentSrc)).toContain("passage-amateur-mobile.png");
  await page.keyboard.press("Escape");
  await expect(promotionDialog).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(() => promotionDialog.locator("picture img").evaluate(image => image.currentSrc)).toContain("passage-amateur-desktop.png");
  await page.locator("#amateur-promotion-acknowledge").click();
  await expect(promotionDialog).toBeHidden();
  await expect(page.locator("[data-career-amateur-transition], #turn-amateur")).toHaveCount(0);

  await expect(page.locator("#career-world")).toBeVisible();
  await expect(page.locator(".career-now-panel > .career-onboarding-card")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Entrer : Aréna/ })).toHaveAccessibleName(/Aucun combat réservé/);
  await expect(page.locator('.career-map-hotspot[data-career-location="arena"]')).toBeEnabled();
  await expect(page.locator('.career-map-hotspot[data-career-location="strength-gym"]')).toBeEnabled();
  const storedAmateur = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(storedAmateur.state.careerStatus).toBe("amateur");
  expect(storedAmateur.state.week).toBe(1);
  expect(storedAmateur.state.amateurRecord).toEqual({ wins: 0, losses: 0, draws: 0 });
  expect(storedAmateur.state.amateurPromotionPending).toBe(false);

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  const amateurSparringHotspot = page.locator('[data-career-gym-zone="ring"]');
  await expect(amateurSparringHotspot).toContainText("Sparring");
  await expect(amateurSparringHotspot).toContainText("−18 énergie");
  const beforePractice = await page.evaluate(() => {
    const capsule = JSON.parse(localStorage.getItem("boxeur-deux-career-runtime"));
    return {
      timeState: capsule.timeState,
      capacity: BoxeurWeekPlanner.previewPlan(capsule.previewRuntime.weekPlanner).capacity,
    };
  });
  await amateurSparringHotspot.click();
  await expect(page.locator('[data-career-sparring-activity="cta"]')).toBeEnabled();
  await expect(page.locator('[data-career-sparring-activity="cta"]')).toContainText("Participer au sparring · −18 énergie");
  await page.locator('[data-career-sparring-activity="cta"]').click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-dialog")).toHaveClass(/sparring-ring-prototype/);
  await expect(page.locator("#fight-week-label")).toContainText("Sparring technique");
  const chargedPractice = await page.evaluate(() => {
    const capsule = JSON.parse(localStorage.getItem("boxeur-deux-career-runtime"));
    return {
      entry: capsule.previewRuntime.weekPlanner.entries.find(entry => entry.activityId === "sparring"),
      capacity: BoxeurWeekPlanner.previewPlan(capsule.previewRuntime.weekPlanner).capacity,
    };
  });
  expect(chargedPractice.entry.capacityCost).toBe(18);
  expect(chargedPractice.entry.metadata.immediate).toBe(true);
  expect(chargedPractice.entry.metadata.completed).toBe(false);
  expect(chargedPractice.capacity.remaining).toBe(beforePractice.capacity.remaining - 18);
  await chooseCoachDirective(page);
  await expect(page.locator("#fight-choices [data-fight-action]")).toHaveCount(5);
  await completeFight(page);
  await expect(page.locator("#fight-score-label")).toHaveText("Sparring non comptabilisé");
  await expect(page.locator("#fight-instruction")).toContainText("aucune victoire ni défaite");
  await page.locator("#fight-instruction button.primary-button", { hasText: "Retour au GYM" }).click();
  await expect(page.locator(".career-gym-view")).toBeVisible();
  let afterPractice = await page.evaluate(() => ({
    career: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(afterPractice.career.state.amateurRecord).toEqual({ wins: 0, losses: 0, draws: 0 });
  expect(afterPractice.capsule.timeState.history.some(event => event.activityCategory === "sparring")).toBe(true);
  expect(afterPractice.capsule.timeState.clock.absoluteSlot).toBeGreaterThan(beforePractice.timeState.clock.absoluteSlot);
  const completedPractice = afterPractice.capsule.previewRuntime.weekPlanner.entries.find(entry => entry.activityId === "sparring");
  expect(completedPractice.metadata.completed).toBe(true);
  expect(completedPractice.metadata.immediate).toBe(true);
  await expect(page.locator('.career-place-week-plan li', { hasText: "Sparring technique interactif" })).toContainText("Déjà joué");
  await expect(page.locator('.career-place-week-plan li', { hasText: "Sparring technique interactif" }).locator("button")).toHaveCount(0);
  await expect(page.locator('[data-career-gym-zone="ring"]')).toBeDisabled();

  await page.locator("[data-career-leave-gym]").click();
  await confirmWeekFromLauncher(page);
  await expect(page.locator(".career-week-summary")).toBeVisible();
  await expect(page.locator("#fight-dialog")).not.toBeVisible();
  afterPractice = await page.evaluate(() => ({
    career: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(afterPractice.career.state.week).toBe(2);
  expect(afterPractice.career.state.rosterState.lastProcessedWeek).toBe(1);
  expect(afterPractice.career.state.rosterState.matches.every(match => match.source === "simulation")).toBe(true);
});

test("promeut aussi automatiquement après le sparring lancé depuis le calendrier", async ({ page }) => {
  test.setTimeout(45_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career", JSON.stringify(value));
  }, recreationalReadySnapshot());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  await page.locator("[data-career-open-calendar]").first().click();
  await expect(page.locator("#start-fight")).toBeVisible();
  await page.locator("#start-fight").click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-coach-choices [data-coach-option]").first()).toBeVisible();
  await completeFight(page);
  await expect(page.locator("#fight-instruction")).toContainText("activé automatiquement");

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(stored.state.careerStatus).toBe("amateur");
  expect(stored.state.week).toBe(1);
  expect(stored.state.amateurPromotionPending).toBe(true);
  await page.locator("#fight-instruction button.primary-button", { hasText: "Voir mon passage amateur" }).click();
  await expect(page.locator("#amateur-promotion-dialog")).toBeVisible();
});

test("bloque le sparring amateur pendant un combat, exige 18 énergie et préserve un combat futur", async ({ page }) => {
  test.setTimeout(45_000);
  const officialFight = week => ({
    id: `combat-officiel-semaine-${week}`,
    opponent: {
      id: `adversaire-officiel-${week}`,
      name: "Thomas Leclerc",
      nickname: "Béton",
      style: "Technicien",
      record: "1 V · 1 D",
      difficulty: 36,
      rating: 36,
      stats: { technique: 36, power: 34, cardio: 37, defense: 37 },
    },
    tournamentId: null,
    week,
    travelApplied: true,
    travelEffects: { energy: 0, fatigue: 0 },
    fightSeed: `combat-officiel-${week}`,
  });

  await openStoredCareer(page, amateurSnapshot({ gymWeeks: 4, scheduledFight: officialFight(1) }));
  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  const currentFightRing = page.locator('[data-career-gym-zone="ring"]');
  await expect(currentFightRing).toBeDisabled();
  await expect(currentFightRing).toContainText("Sparring");
  await expect(currentFightRing).toHaveAccessibleName(/Semaine de combat/);

  await openStoredCareer(page, amateurSnapshot({
    gymWeeks: 4,
    jobId: "office",
    energy: 10,
    fatigue: 90,
  }));
  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  const lowCapacityRing = page.locator('[data-career-gym-zone="ring"]');
  await expect(lowCapacityRing).toBeDisabled();
  await expect(lowCapacityRing).toHaveAccessibleName(/Énergie insuffisante|capacité hebdomadaire restante est insuffisante|état physique est critique/i);

  const futureFight = officialFight(3);
  futureFight.id = "leclerc";
  futureFight.opponent.id = "leclerc";
  await openStoredCareer(page, amateurSnapshot({ gymWeeks: 4, scheduledFight: futureFight }));
  const storedFutureFightBeforeSparring = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state.scheduledFight);
  const rosterBeforePractice = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state.rosterState);
  expect(rosterBeforePractice.reservations).toHaveLength(1);
  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  const futureFightRing = page.locator('[data-career-gym-zone="ring"]');
  await expect(futureFightRing).toBeEnabled();
  await futureFightRing.click();
  await page.locator('[data-career-sparring-activity="cta"]').click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await completeFight(page);
  await page.locator("#fight-instruction button.primary-button", { hasText: "Retour au GYM" }).click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(stored.state.scheduledFight.id).toBe(storedFutureFightBeforeSparring.id);
  expect(stored.state.scheduledFight.opponent.name).toBe(storedFutureFightBeforeSparring.opponent.name);
  expect(stored.state.scheduledFight.week).toBe(3);
  expect(stored.state.rosterState).toEqual(rosterBeforePractice);
});

test("conserve le menu principal entre Carte, Calendrier, Boxeur et Inventaire", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openStoredCareer(page, amateurSnapshot({
    jobId: "convenience",
    gymWeeks: 4,
    strengthGymWeeks: 4,
  }));

  const worldNavigation = page.locator("#career-world [data-career-primary-navigation]");
  await expect(worldNavigation).toHaveCount(1);
  await expect(worldNavigation.locator('[data-career-nav="map"]')).toHaveAttribute("aria-current", "page");
  const desktopMapNavigationBox = await worldNavigation.boundingBox();
  expect(desktopMapNavigationBox && desktopMapNavigationBox.y).toBeGreaterThan(700);
  expect(desktopMapNavigationBox && desktopMapNavigationBox.y + desktopMapNavigationBox.height).toBeLessThanOrEqual(900);
  expect(desktopMapNavigationBox && Math.abs(desktopMapNavigationBox.x + desktopMapNavigationBox.width / 2 - 640)).toBeLessThanOrEqual(1);

  await worldNavigation.locator('[data-career-nav="fighter"]').click();
  await expect(page.locator(".career-fighter-view")).toBeVisible();
  await expect(page.locator(".career-location-sheet > [data-career-primary-navigation]")).toHaveCount(1);
  await expect(page.locator('.career-location-sheet [data-career-nav="fighter"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-career-close-fighter]")).toHaveCount(0);

  await page.locator('.career-location-sheet [data-career-nav="inventory"]').click();
  await expect(page.locator(".career-inventory-view")).toBeVisible();
  await expect(page.locator(".career-fighter-view")).toHaveCount(0);
  await expect(page.locator('.career-location-sheet [data-career-nav="inventory"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-career-close-inventory]")).toHaveCount(0);

  await page.locator('.career-location-sheet [data-career-nav="calendar"]').click();
  await expect(page.locator(".career-location-sheet")).toBeHidden();
  await expect(page.locator("#calendar-dialog")).toBeVisible();
  await expect(page.locator('#calendar-dialog [data-career-nav="calendar"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#calendar-dialog-close, #calendar-dialog-done")).toHaveCount(0);
  const desktopCalendarNavigation = page.locator("#calendar-dialog [data-career-primary-navigation]");
  const desktopCalendarNavigationBox = await desktopCalendarNavigation.boundingBox();
  expect(desktopCalendarNavigationBox && desktopCalendarNavigationBox.y).toBeGreaterThan(700);
  expect(desktopCalendarNavigationBox && desktopCalendarNavigationBox.y + desktopCalendarNavigationBox.height).toBeLessThanOrEqual(900);
  expect(desktopCalendarNavigationBox && Math.abs(desktopCalendarNavigationBox.x + desktopCalendarNavigationBox.width / 2 - 640)).toBeLessThanOrEqual(1);

  await page.locator('#calendar-dialog [data-career-nav="fighter"]').click();
  await expect(page.locator("#calendar-dialog")).toBeHidden();
  await expect(page.locator(".career-fighter-view")).toBeVisible();
  await expect(worldNavigation).toHaveCount(1);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileNavigation = page.locator(".career-location-sheet > [data-career-primary-navigation]");
  const navigationBox = await mobileNavigation.boundingBox();
  expect(navigationBox && navigationBox.y + navigationBox.height).toBeLessThanOrEqual(844);
  for (const button of await mobileNavigation.locator("button").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }
  const fit = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(fit.document).toBeLessThanOrEqual(fit.viewport + 1);

  await mobileNavigation.locator('[data-career-nav="calendar"]').click();
  await expect(page.locator("#calendar-dialog")).toBeVisible();
  const mobileCalendarNavigation = page.locator("#calendar-dialog [data-career-primary-navigation]");
  const mobileCalendarNavigationBox = await mobileCalendarNavigation.boundingBox();
  expect(mobileCalendarNavigationBox && mobileCalendarNavigationBox.y).toBeGreaterThan(700);
  expect(mobileCalendarNavigationBox && mobileCalendarNavigationBox.y + mobileCalendarNavigationBox.height).toBeLessThanOrEqual(844);
  for (const button of await mobileCalendarNavigation.locator("button").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }

  await mobileCalendarNavigation.locator('[data-career-nav="map"]').click();
  await expect(page.locator(".career-location-sheet")).toBeHidden();
  const mobileMapNavigation = page.locator("#career-world .career-map-stack > [data-career-primary-navigation]");
  await expect(mobileMapNavigation.locator('[data-career-nav="map"]')).toHaveAttribute("aria-current", "page");
  const mobileMapNavigationBox = await mobileMapNavigation.boundingBox();
  expect(mobileMapNavigationBox && mobileMapNavigationBox.y).toBeGreaterThan(700);
  expect(mobileMapNavigationBox && mobileMapNavigationBox.y + mobileMapNavigationBox.height).toBeLessThanOrEqual(844);
});

test("retire Prochaine étape après le premier résultat amateur sur ordinateur et mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openStoredCareer(page, amateurSnapshot({
    week: 7,
    jobId: "convenience",
    gymWeeks: 4,
    amateurRecord: { wins: 0, losses: 0, draws: 0 },
  }));

  await expect(page.locator(".career-objective-card")).toContainText("Choisir la prochaine occasion");
  await expect(page.locator(".career-objective-card [data-career-location=\"arena\"]")).toBeVisible();

  const experienced = amateurSnapshot({
    week: 8,
    jobId: "convenience",
    gymWeeks: 4,
    amateurRecord: { wins: 0, losses: 1, draws: 0 },
  });
  await page.evaluate(snapshot => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career", JSON.stringify(snapshot));
  }, experienced);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  await expect(page.locator(".career-objective-card")).toHaveCount(0);
  await expect(page.locator(".career-week-launcher")).toBeVisible();
  await expect(page.locator(".career-now-panel")).not.toContainText("Prochaine étape");
  let fit = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(fit.document).toBeLessThanOrEqual(fit.viewport + 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".career-objective-card")).toHaveCount(0);
  await expect(page.locator(".career-week-launcher")).toBeVisible();
  fit = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(fit.document).toBeLessThanOrEqual(fit.viewport + 1);
});

test("navigue gratuitement entre le quartier et le Centre-ville après le premier résultat amateur", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openStoredCareer(page, amateurSnapshot({
    week: 7,
    jobId: "convenience",
    gymWeeks: 4,
    amateurRecord: { wins: 0, losses: 0, draws: 0 },
  }));

  await expect(page.locator('.career-district-switch [data-career-district="downtown"]')).toBeDisabled();
  await expect(page.locator('.career-district-switch [data-career-district="downtown"]')).toHaveAccessibleName(/premier combat amateur officiel/i);
  await expect(page.getByText(/Métro/)).toHaveCount(0);

  await openStoredCareer(page, amateurSnapshot({
    week: 8,
    jobId: "convenience",
    gymWeeks: 4,
    money: 740,
    energy: 71,
    fatigue: 18,
    amateurRecord: { wins: 0, losses: 1, draws: 0 },
  }));

  const storageBeforeDistrictChange = await page.evaluate(() => ({
    career: localStorage.getItem("boxeur-deux-career"),
    runtime: localStorage.getItem("boxeur-deux-career-runtime"),
  }));
  await expect(page.locator('.career-district-switch [data-career-district="downtown"]')).toBeEnabled();
  await page.locator('.career-district-switch [data-career-district="downtown"]').click();

  await expect(page.locator('.career-map-panel[data-career-district-view="downtown"]')).toBeVisible();
  await expect(page.locator('.career-district-switch [data-career-district="downtown"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".career-downtown-canvas > picture > img")).toHaveJSProperty("complete", true);
  await expect.poll(() => page.locator(".career-downtown-canvas > picture > img").evaluate(image => image.currentSrc)).toContain("carte-centre-ville-desktop.jpg");
  await expect(page.locator(".career-downtown-hotspot")).toHaveCount(4);
  await expect(page.locator('[data-career-downtown-location="leisure-center"]')).toBeEnabled();
  await expect(page.locator('[data-career-downtown-location="media-studio"]')).toBeEnabled();
  await expect(page.locator('[data-career-downtown-location="federation"]')).toBeEnabled();
  await expect(page.locator('[data-career-downtown-location="airport"]')).toBeDisabled();
  await expect(page.locator('[data-career-downtown-location="leisure-center"]')).toHaveAccessibleName(/entrer.*quilles, arcade, cinéma et karting/i);
  await expect(page.locator('[data-career-downtown-location="media-studio"]')).toHaveAccessibleName(/entrer.*entrevue, séance photo, balado et apparition publique/i);
  await expect(page.locator('[data-career-downtown-location="airport"]')).toHaveAccessibleName(/statut professionnel/i);
  const desktopDowntownMap = await page.locator(".career-downtown-canvas").boundingBox();
  expect(desktopDowntownMap.width / desktopDowntownMap.height).toBeGreaterThan(1.6);
  await expect(page.locator(".career-world-nav")).toBeVisible();
  await expect(page.locator(".career-now-time")).toContainText("740 $");

  await page.locator('[data-career-downtown-location="leisure-center"]').click();
  await expect(page.locator(".career-leisure-view")).toBeVisible();
  await expect(page.locator(".career-leisure-scene > picture > img")).toHaveJSProperty("complete", true);
  await expect.poll(() => page.locator(".career-leisure-scene > picture > img").evaluate(image => image.currentSrc)).toContain("centre-loisirs-desktop.jpg");
  await expect(page.locator("[data-career-leisure-activity]")).toHaveCount(4);
  for (const activity of await page.locator("[data-career-leisure-activity]").all()) await expect(activity).toBeEnabled();
  await expect(page.locator('[data-career-leisure-activity="bowling"]')).toContainText("30 $ · 6 capacité");
  await expect(page.locator(".career-leisure-status")).toContainText("Le prix sera payé seulement lorsque tu confirmeras");
  await expect(page.locator(".career-world-layout")).toHaveJSProperty("inert", true);
  await page.keyboard.press("Escape");
  await expect(page.locator(".career-location-sheet")).toBeHidden();
  await expect(page.locator('.career-map-panel[data-career-district-view="downtown"]')).toBeVisible();
  await expect(page.locator('[data-career-downtown-location="leisure-center"]')).toBeFocused();

  const storageAfterDistrictChange = await page.evaluate(() => ({
    career: localStorage.getItem("boxeur-deux-career"),
    runtime: localStorage.getItem("boxeur-deux-career-runtime"),
  }));
  expect(storageAfterDistrictChange).toEqual(storageBeforeDistrictChange);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator(".career-downtown-canvas > picture > img").evaluate(image => image.currentSrc)).toContain("carte-centre-ville-mobile.jpg");
  const mobileFit = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(mobileFit.document).toBeLessThanOrEqual(mobileFit.viewport + 1);
  const mobileDowntownMap = await page.locator(".career-downtown-canvas").boundingBox();
  expect(mobileDowntownMap.height / mobileDowntownMap.width).toBeGreaterThan(0.98);
  expect(mobileDowntownMap.height / mobileDowntownMap.width).toBeLessThan(1.02);
  for (const button of await page.locator(".career-district-switch button, .career-downtown-hotspot").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }

  await page.locator('[data-career-downtown-location="leisure-center"]').click();
  await expect.poll(() => page.locator(".career-leisure-scene > picture > img").evaluate(image => image.currentSrc)).toContain("centre-loisirs-mobile.jpg");
  const mobileLeisureScene = await page.locator(".career-leisure-scene").boundingBox();
  expect(mobileLeisureScene.height / mobileLeisureScene.width).toBeGreaterThan(0.98);
  expect(mobileLeisureScene.height / mobileLeisureScene.width).toBeLessThan(1.02);
  for (const activity of await page.locator("[data-career-leisure-activity]").all()) {
    const box = await activity.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator('[data-career-leisure-activity="cinema"]').click();
  await expect(page.locator(".career-leisure-quote")).toBeVisible();
  const mobileLeisureMenuFit = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(mobileLeisureMenuFit.document).toBeLessThanOrEqual(mobileLeisureMenuFit.viewport + 1);
  for (const button of await page.locator(".career-leisure-menu footer button").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator("[data-career-leisure-menu-close]").first().click();
  await page.locator("[data-career-leave-leisure]").click();
  await expect(page.locator(".career-location-sheet")).toBeHidden();
  await expect(page.locator('.career-map-panel[data-career-district-view="downtown"]')).toBeVisible();

  await page.locator('.career-district-switch [data-career-district="neighborhood"]').click();
  await expect(page.locator('.career-map-panel[data-career-district-view="neighborhood"]')).toBeVisible();
  await expect(page.locator(".career-map-hotspot")).toHaveCount(5);

  await page.locator('.career-district-switch [data-career-district="downtown"]').click();
  await expect(page.locator('.career-map-panel[data-career-district-view="downtown"]')).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  await expect(page.locator('.career-map-panel[data-career-district-view="neighborhood"]')).toBeVisible();
  await expect(page.locator(".career-map-hotspot")).toHaveCount(5);
});

test("planifie, remplace, retire puis applique une seule sortie sans XP ni débit anticipé", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openStoredCareer(page, amateurSnapshot({
    week: 9,
    jobId: null,
    money: 50,
    energy: 70,
    fatigue: 30,
    amateurRecord: { wins: 1, losses: 0, draws: 0 },
    combatStats: { technique: 35, power: 34, cardio: 33, defense: 32 },
  }));

  await page.locator('[data-career-district="downtown"]').click();
  await page.locator('[data-career-downtown-location="leisure-center"]').click();
  await page.locator('[data-career-leisure-activity="cinema"]').click();
  const cinemaSheet = page.locator(".career-leisure-menu");
  await expect(cinemaSheet).toContainText("25 $");
  await expect(cinemaSheet).toContainText("−5");
  await expect(cinemaSheet).toContainText("+4");
  await expect(cinemaSheet).toContainText("Aucune XP et aucun bonus de statistique");
  await page.locator('[data-career-leisure-confirm="cinema"]').click();

  await expect(page.locator(".career-leisure-planned")).toContainText("Cinéma");
  await expect(page.locator('[data-career-leisure-activity="cinema"]')).toContainText("Planifiée");
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(saved.previewRuntime.career.money).toBe(50);
  expect(saved.previewRuntime.weekPlanner.entries.filter(entry => entry.metadata?.familyId === "leisure")).toHaveLength(1);
  expect(saved.previewRuntime.weekPlanner.entries.find(entry => entry.metadata?.familyId === "leisure").activityId).toBe("leisure:cinema");

  await page.locator('[data-career-leisure-activity="karting"]').click();
  await expect(page.locator(".career-leisure-menu")).toContainText("Il manque 10 $ pour cette sortie");
  await expect(page.locator('[data-career-leisure-confirm="karting"]')).toBeDisabled();
  await page.locator("[data-career-leisure-menu-close]").first().click();
  await page.locator('[data-career-leisure-activity="bowling"]').click();
  await expect(page.locator(".career-leisure-menu")).toContainText("remplacera la sortie déjà planifiée");
  await page.locator('[data-career-leisure-confirm="bowling"]').click();

  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(saved.previewRuntime.career.money).toBe(50);
  expect(saved.previewRuntime.weekPlanner.entries.filter(entry => entry.metadata?.familyId === "leisure")).toHaveLength(1);
  expect(saved.previewRuntime.weekPlanner.entries.find(entry => entry.metadata?.familyId === "leisure").activityId).toBe("leisure:bowling");

  await page.locator('[data-career-leisure-remove]').click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(saved.previewRuntime.career.money).toBe(50);
  expect(saved.previewRuntime.weekPlanner.entries.some(entry => entry.metadata?.familyId === "leisure")).toBe(false);

  await page.locator('[data-career-leisure-activity="cinema"]').click();
  await page.locator('[data-career-leisure-confirm="cinema"]').click();
  await page.locator('[data-career-leave-leisure]').click();
  await page.locator('[data-career-week-detailed]').click();
  await page.locator('[data-career-week-confirm]').click();
  await expect(page.locator(".career-week-summary")).toContainText("Détendu · Cinéma");
  await expect(page.locator(".career-week-summary")).toContainText("Dépenses planifiées");
  await expect(page.locator(".career-week-summary")).toContainText("−25 $");
  await expect(page.locator(".career-week-summary")).toContainText("XP générale");

  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(saved.previewRuntime.career.money).toBe(25);
  const leisureHistory = saved.timeState.history.filter(event => event.activityId === "leisure:cinema");
  expect(leisureHistory).toHaveLength(1);
  expect(leisureHistory[0].activityCategory).toBe("leisure");
  expect(leisureHistory[0].afterImmediate.stimulus).toEqual(leisureHistory[0].before.stimulus);
  expect(leisureHistory[0].afterImmediate.statXp).toEqual(leisureHistory[0].before.statXp);
});

test("planifie une apparition média sur mobile et applique seulement la réputation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStoredCareer(page, amateurSnapshot({
    week: 10,
    jobId: null,
    money: 200,
    reputation: 18,
    energy: 72,
    fatigue: 24,
    amateurRecord: { wins: 1, losses: 0, draws: 0 },
    combatStats: { technique: 35, power: 34, cardio: 33, defense: 32 },
  }));

  await page.locator('[data-career-district="downtown"]').click();
  await page.locator('[data-career-downtown-location="media-studio"]').click();
  await expect(page.locator(".career-media-view")).toBeVisible();
  await expect.poll(() => page.locator(".career-media-scene > picture > img").evaluate(image => image.currentSrc)).toContain("studio-media-mobile.jpg");
  await expect(page.locator("[data-career-media-activity]")).toHaveCount(4);
  const mediaScene = await page.locator(".career-media-scene").boundingBox();
  expect(mediaScene.height / mediaScene.width).toBeGreaterThan(0.98);
  expect(mediaScene.height / mediaScene.width).toBeLessThan(1.02);
  for (const activity of await page.locator("[data-career-media-activity]").all()) {
    const box = await activity.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }

  await expect(page.locator('[data-career-media-activity="interview"]')).not.toHaveClass(/locked/);
  await expect(page.locator('[data-career-media-activity="photoshoot"]')).not.toHaveClass(/locked/);
  await expect(page.locator('[data-career-media-activity="podcast"]')).toHaveClass(/locked/);
  await expect(page.locator('[data-career-media-activity="appearance"]')).toHaveClass(/locked/);
  await expect(page.locator('[data-career-media-activity="podcast"]')).toContainText("Débloqué à 20 réputation");
  await page.locator('[data-career-media-activity="appearance"]').click();
  await expect(page.locator(".career-media-menu")).toContainText("−8");
  await expect(page.locator(".career-media-menu")).toContainText("+3");
  await expect(page.locator(".career-media-menu")).toContainText("Aucun argent, aucune XP");
  await expect(page.locator(".career-media-menu")).toContainText("35 de réputation requise; ta réputation actuelle est de 18");
  await expect(page.locator('[data-career-media-confirm="appearance"]')).toBeDisabled();
  const mobileMenuFit = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(mobileMenuFit.document).toBeLessThanOrEqual(mobileMenuFit.viewport + 1);
  for (const button of await page.locator(".career-media-menu footer button").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator("[data-career-media-menu-close]").first().click();
  await page.locator('[data-career-media-activity="photoshoot"]').click();
  await page.locator('[data-career-media-confirm="photoshoot"]').click();

  let runtime = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  let career = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(career.state.reputation).toBe(18);
  expect(runtime.previewRuntime.weekPlanner.entries.filter(entry => entry.metadata?.familyId === "media")).toHaveLength(1);
  expect(runtime.previewRuntime.weekPlanner.entries.find(entry => entry.metadata?.familyId === "media").activityId).toBe("media:photoshoot");

  await page.locator('[data-career-media-activity="interview"]').click();
  await expect(page.locator(".career-media-menu")).toContainText("remplacera l’apparition déjà planifiée");
  await page.locator('[data-career-media-confirm="interview"]').click();
  runtime = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(runtime.previewRuntime.weekPlanner.entries.filter(entry => entry.metadata?.familyId === "media")).toHaveLength(1);
  expect(runtime.previewRuntime.weekPlanner.entries.find(entry => entry.metadata?.familyId === "media").activityId).toBe("media:interview");

  await page.locator("[data-career-media-remove]").click();
  runtime = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  career = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(career.state.reputation).toBe(18);
  expect(runtime.previewRuntime.weekPlanner.entries.some(entry => entry.metadata?.familyId === "media")).toBe(false);

  await page.locator('[data-career-media-activity="photoshoot"]').click();
  await page.locator('[data-career-media-confirm="photoshoot"]').click();
  await page.locator("[data-career-leave-media]").click();
  await page.locator("[data-career-week-detailed]").click();
  await expect(page.locator(".career-week-plan")).toContainText("+2 réputation à la confirmation");
  await page.locator("[data-career-week-confirm]").click();
  await expect(page.locator(".career-week-summary")).toContainText("Visibilité · Séance photo");
  await expect(page.locator(".career-week-summary")).toContainText("réputation 18 → 20 (+2)");

  runtime = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  career = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(career.state.reputation).toBe(20);
  expect(runtime.previewRuntime.career.money).toBe(200);
  const mediaHistory = runtime.timeState.history.filter(event => event.activityId === "media:photoshoot");
  expect(mediaHistory).toHaveLength(1);
  expect(mediaHistory[0].activityCategory).toBe("media");
  expect(mediaHistory[0].afterImmediate.condition).toEqual(mediaHistory[0].before.condition);
  expect(mediaHistory[0].afterImmediate.stimulus).toEqual(mediaHistory[0].before.stimulus);
  expect(mediaHistory[0].afterImmediate.statXp).toEqual(mediaHistory[0].before.statXp);

  await page.locator("[data-career-week-summary-close]").click();
  await page.locator('[data-career-district="downtown"]').click();
  await page.locator('[data-career-downtown-location="media-studio"]').click();
  await expect(page.locator('[data-career-media-activity="podcast"]')).not.toHaveClass(/locked/);
  await page.locator('[data-career-media-activity="podcast"]').click();
  await expect(page.locator('[data-career-media-confirm="podcast"]')).toBeEnabled();
});

test("cadre la carte sur ordinateur et téléphone et synchronise la sauvegarde compatible", async ({ page }) => {
  test.setTimeout(75_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const original = amateurSnapshot({
    profile: { firstName: "Carte", lastName: "Parcours", sex: "female", weightClass: "W57", style: "balanced", corner: "pink" },
    jobId: "convenience",
    gymWeeks: 3,
  });
  await page.evaluate(snapshot => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career", JSON.stringify(snapshot));
  }, original);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  await expect(page.locator("body")).toHaveClass(/career-preview/);
  await expect(page.locator("#career-world")).toBeVisible();
  await expect(page.locator("#career-world .career-map-hotspot")).toHaveCount(5);
  await expect(page.locator("#career-world .career-map-canvas > picture > img")).toHaveJSProperty("complete", true);
  await expect(page.locator("#career-world .career-map-panel")).toHaveAttribute("aria-label", /Carte/);
  await expect(page.locator("#game > .topbar")).toBeHidden();
  const desktopMapPanel = await page.locator(".career-map-panel").boundingBox();
  const desktopMap = await page.locator(".career-map-canvas").boundingBox();
  expect(desktopMap.width / desktopMap.height).toBeGreaterThan(1.6);
  const desktopMapHotspotAppearance = await page.locator(".career-map-hotspot").first().evaluate(element => ({
    background: getComputedStyle(element).backgroundColor,
    borderStyle: getComputedStyle(element).borderStyle,
    opacity: getComputedStyle(element).opacity,
    markerContent: getComputedStyle(element, "::after").content,
  }));
  expect(desktopMapHotspotAppearance.background).toBe("rgba(12, 15, 13, 0.28)");
  expect(desktopMapHotspotAppearance.borderStyle).toBe("dashed");
  expect(desktopMapHotspotAppearance.opacity).toBe("0.7");
  expect(desktopMapHotspotAppearance.markerContent).toBe("none");
  await expect(page.locator(".career-side-stack")).toHaveCSS("position", "sticky");
  const desktopHeader = await page.locator(".career-now-time").boundingBox();
  const desktopSidebar = await page.locator(".career-now-panel").boundingBox();
  expect(Math.abs(desktopHeader.x - desktopSidebar.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(desktopHeader.width - desktopSidebar.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(desktopHeader.y - desktopMapPanel.y)).toBeLessThanOrEqual(2);
  expect(desktopSidebar.y - (desktopHeader.y + desktopHeader.height)).toBeLessThanOrEqual(10);
  const gymOpener = page.getByRole("button", { name: /Entrer : GYM de boxe/ }).first();
  await gymOpener.click();
  const locationSheet = page.locator(".career-location-sheet");
  await expect(locationSheet).toBeVisible();
  await expect(locationSheet).toHaveAttribute("role", "dialog");
  await expect(locationSheet).toHaveAttribute("aria-modal", "true");
  expect(await locationSheet.evaluate(sheet => {
    const label = sheet.getAttribute("aria-labelledby");
    return Boolean(label && document.getElementById(label)?.textContent.trim());
  })).toBe(true);
  expect(await page.locator(".career-world-layout").evaluate(element => element.inert)).toBe(true);
  const gymDialogButtons = locationSheet.locator("button:not([disabled])");
  await gymDialogButtons.last().focus();
  await page.keyboard.press("Tab");
  await expect(gymDialogButtons.first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(locationSheet).toBeHidden();
  await expect(gymOpener).toBeFocused();
  expect(await page.locator(".career-world-layout").evaluate(element => element.inert)).toBe(false);
  await gymOpener.click();
  await expect(page.locator(".career-gym-view")).toBeVisible();
  await expect(page.locator(".career-gym-view")).toContainText("Coach et entraîneur privé");
  await expect(page.locator(".career-gym-floor img")).toHaveJSProperty("complete", true);
  const desktopGymHotspotAppearance = await page.locator(".career-gym-hotspot").first().evaluate(element => ({
    background: getComputedStyle(element).backgroundColor,
    borderStyle: getComputedStyle(element).borderStyle,
    opacity: getComputedStyle(element).opacity,
    markerContent: getComputedStyle(element, "::after").content,
  }));
  expect(desktopGymHotspotAppearance.background).toBe("rgba(12, 15, 13, 0.28)");
  expect(desktopGymHotspotAppearance.borderStyle).toBe("dashed");
  expect(desktopGymHotspotAppearance.opacity).toBe("0.7");
  expect(desktopGymHotspotAppearance.markerContent).toBe("none");
  await page.locator('[data-career-gym-zone="ring"]').click();
  await expect(page.locator('[data-career-sparring-state="available"]')).toContainText("Activité distincte");
  await expect(page.locator('[data-career-sparring-activity="cta"]')).toBeEnabled();
  await page.locator("[data-career-gym-menu-close]").click();

  const timeBeforeGymDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")).timeState);
  await page.locator('[data-career-gym-zone="coach"]').click();
  await page.locator("[data-career-coach-session]").click();
  await expect(page.locator(".career-gym-view")).toContainText(/planifié|programme/i);
  let careerCapsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(careerCapsule.timeState).toEqual(timeBeforeGymDraft);
  expect(careerCapsule.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "boxing-coach")).toBe(true);

  await page.locator('[data-career-gym-zone="training"]').click();
  await expect(page.locator('[data-career-exercise="sparring"]')).toHaveCount(0);
  await expect(page.locator("[data-career-confirm-session]")).toBeDisabled();
  await page.locator('[data-career-session-preset="technique"]').click();
  await expect(page.locator('.career-session-structure .complete')).toHaveCount(3);
  await expect(page.locator("[data-career-confirm-session]")).toBeEnabled();
  await page.locator("[data-career-confirm-session]").click();
  await expect(page.locator(".career-gym-view")).toBeVisible();
  careerCapsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(careerCapsule.timeState).toEqual(timeBeforeGymDraft);
  expect(careerCapsule.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "boxing-custom")).toBe(true);
  await page.locator("[data-career-leave-gym]").click();

  await page.getByRole("button", { name: /Entrer : Maison/ }).click();
  const desktopHomeHotspotAppearance = await page.locator('.career-home-hotspot:not(:disabled):not([aria-disabled="true"])').first().evaluate(element => ({
    background: getComputedStyle(element).backgroundColor,
    borderStyle: getComputedStyle(element).borderStyle,
    opacity: getComputedStyle(element).opacity,
    markerContent: getComputedStyle(element, "::after").content,
  }));
  expect(desktopHomeHotspotAppearance.background).toBe("rgba(12, 15, 13, 0.28)");
  expect(desktopHomeHotspotAppearance.borderStyle).toBe("dashed");
  expect(desktopHomeHotspotAppearance.opacity).toBe("0.7");
  expect(desktopHomeHotspotAppearance.markerContent).toBe("none");
  await page.keyboard.press("Escape");

  await page.locator('[data-career-nav="inventory"]').click();
  await expect(page.locator(".career-inventory-view")).toBeVisible();
  await expect(page.locator(".career-inventory-view")).toContainText("Ton inventaire est vide");
  await page.locator('.career-location-sheet [data-career-nav="map"]').click();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator(".career-map-canvas > picture > img").evaluate(image => image.currentSrc)).toContain("carte-quartier-v2-mobile.jpg");
  const mobileMetrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    currentImage: document.querySelector(".career-map-canvas > picture > img").currentSrc,
  }));
  expect(mobileMetrics.body).toBeLessThanOrEqual(mobileMetrics.viewport + 1);
  expect(mobileMetrics.document).toBeLessThanOrEqual(mobileMetrics.viewport + 1);
  expect(mobileMetrics.currentImage).toContain("carte-quartier-v2-mobile.jpg");
  const mobileMap = await page.locator(".career-map-canvas").boundingBox();
  expect(mobileMap.height / mobileMap.width).toBeGreaterThan(0.98);
  expect(mobileMap.height / mobileMap.width).toBeLessThan(1.02);
  const mobileWeekBar = await page.locator(".career-now-time").boundingBox();
  const mobileMapPanel = await page.locator(".career-map-panel").boundingBox();
  const mobileWeekBarBottom = mobileWeekBar.y + mobileWeekBar.height;
  expect(mobileWeekBar.width).toBeGreaterThanOrEqual(375);
  expect(mobileWeekBarBottom).toBeLessThan(mobileMapPanel.y);
  expect(mobileMapPanel.y - mobileWeekBarBottom).toBeLessThanOrEqual(12);
  const objectiveButton = await page.locator(".career-objective-card [data-career-location]").boundingBox();
  expect(objectiveButton && objectiveButton.y).toBeLessThan(844);
  for (const button of await page.locator(".career-map-hotspot, .career-world-nav button").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }

  const mobileGymOpener = page.getByRole("button", { name: /Entrer : GYM de boxe/ }).first();
  await mobileGymOpener.click();
  await expect(page.locator(".career-location-sheet")).toBeVisible();
  await expect.poll(() => page.locator(".career-gym-floor img").evaluate(image => image.currentSrc)).toContain("gym-boxe-v2-mobile.jpg");
  await expect(page.locator(".career-gym-hotspot")).toHaveCount(4);
  const gymMetrics = await page.locator(".career-gym-view").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(gymMetrics.scrollWidth).toBeLessThanOrEqual(gymMetrics.clientWidth + 1);
  for (const button of await page.locator(".career-gym-hotspot").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }
  await page.mouse.move(0, 0);
  await expect.poll(() => page.locator(".career-gym-hotspot").first().evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgba(12, 15, 13, 0.28)");
  const mobileGymHotspotAppearance = await page.locator(".career-gym-hotspot").first().evaluate(element => ({
    background: getComputedStyle(element).backgroundColor,
    borderStyle: getComputedStyle(element).borderStyle,
    opacity: getComputedStyle(element).opacity,
    markerContent: getComputedStyle(element, "::after").content,
  }));
  expect(mobileGymHotspotAppearance.background).toBe("rgba(12, 15, 13, 0.28)");
  expect(mobileGymHotspotAppearance.borderStyle).toBe("dashed");
  expect(mobileGymHotspotAppearance.opacity).toBe("0.7");
  expect(mobileGymHotspotAppearance.markerContent).toBe("none");
  await page.locator('[data-career-gym-zone="coach"]').click();
  await page.locator("[data-career-coach-session]").scrollIntoViewIfNeeded();
  const mobileCoachButton = await page.locator("[data-career-coach-session]").boundingBox();
  expect(mobileCoachButton && mobileCoachButton.height).toBeGreaterThanOrEqual(44);
  await page.locator("[data-career-gym-menu-close]").click();
  const mobileRingHotspot = page.locator('[data-career-gym-zone="ring"]');
  const mobileRingButton = await mobileRingHotspot.boundingBox();
  expect(mobileRingButton && mobileRingButton.height).toBeGreaterThanOrEqual(44);
  await expect(mobileRingHotspot).toBeDisabled();
  await page.locator("[data-career-leave-gym]").click();

  await page.getByRole("button", { name: /Entrer : Maison/ }).click();
  await expect(page.locator(".career-home-view")).toBeVisible();
  await expect(page.locator("[data-career-home-zone]")).toHaveCount(4);
  await expect(page.locator(".career-home-hotspot")).toHaveCount(4);
  await expect.poll(() => page.locator(".career-home-scene > picture > img").evaluate(image => image.currentSrc)).toContain("maison-v2-mobile.jpg");
  const mobileHomeScene = await page.locator(".career-home-scene").boundingBox();
  expect(mobileHomeScene.height / mobileHomeScene.width).toBeGreaterThan(0.98);
  expect(mobileHomeScene.height / mobileHomeScene.width).toBeLessThan(1.02);
  const homeMetrics = await page.locator(".career-home-view").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(homeMetrics.scrollWidth).toBeLessThanOrEqual(homeMetrics.clientWidth + 1);
  for (const button of await page.locator(".career-home-hotspot").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(43.9);
  }
  const runningHotspot = page.locator('[data-career-home-zone="running"]');
  await expect(runningHotspot).toHaveAttribute("data-career-home-menu", "running");
  await page.mouse.move(0, 0);
  await expect.poll(() => runningHotspot.evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgba(12, 15, 13, 0.28)");
  const mobileHotspotAppearance = await runningHotspot.evaluate(element => ({
    background: getComputedStyle(element).backgroundColor,
    borderStyle: getComputedStyle(element).borderStyle,
    opacity: getComputedStyle(element).opacity,
    markerContent: getComputedStyle(element, "::after").content,
  }));
  expect(mobileHotspotAppearance.background).toBe("rgba(12, 15, 13, 0.28)");
  expect(mobileHotspotAppearance.borderStyle).toBe("dashed");
  expect(mobileHotspotAppearance.opacity).toBe("0.7");
  expect(mobileHotspotAppearance.markerContent).toBe("none");
  const mobileRunningBox = await runningHotspot.boundingBox();
  const mobileRunningX = (mobileRunningBox.x + mobileRunningBox.width / 2 - mobileHomeScene.x) / mobileHomeScene.width;
  const mobileRunningY = (mobileRunningBox.y + mobileRunningBox.height / 2 - mobileHomeScene.y) / mobileHomeScene.height;
  expect(mobileRunningX).toBeGreaterThan(0.16);
  expect(mobileRunningX).toBeLessThan(0.34);
  expect(mobileRunningY).toBeGreaterThan(0.43);
  expect(mobileRunningY).toBeLessThan(0.60);
  const kitchenHotspot = page.locator('[data-career-home-zone="kitchen"]');
  await expect(kitchenHotspot).not.toHaveAttribute("aria-disabled", "true");
  expect(await kitchenHotspot.getAttribute("disabled")).toBeNull();
  await kitchenHotspot.focus();
  await expect(kitchenHotspot).toBeFocused();

  const beforeRestDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  const restButton = page.locator('[data-career-home-zone="bed"]');
  await restButton.click();
  await expect(restButton).toHaveAttribute("aria-pressed", "true");
  const afterRestDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(afterRestDraft.timeState).toEqual(beforeRestDraft.timeState);
  expect(afterRestDraft.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "rest")).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator(".career-location-sheet")).toBeHidden();
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

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(stored.state.amateurRecord).toEqual(original.state.amateurRecord);
  expect(stored.state.money).toBe(original.state.money);
  expect(stored.state.week).toBe(original.state.week);
  expect(stored.state.energy).toBe(original.state.energy);
  expect(stored.state.fatigue).toBe(original.state.fatigue);
  expect(stored.state.weekPlannerState.entries.some(entry => entry.activityId === "boxing-custom")).toBe(true);
  expect(stored.state.weekPlannerState.entries.some(entry => entry.activityId === "rest")).toBe(true);
});

test("télécharge depuis l’onglet Boxeur une sauvegarde JSON complète et réimportable", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    profile: {
      firstName: "Éric",
      lastName: "Export",
      nickname: "Copie",
      sex: "male",
      weightClass: "M65",
      portraitId: 1,
      style: "balanced",
      corner: "blue",
    },
    money: 735,
    trainingProgress: { technique: 4, power: 0, cardio: 0, defense: 0 },
  }));

  await page.locator('[data-career-nav="fighter"]').click();
  const exportButton = page.locator("[data-career-export-career]");
  await expect(exportButton).toBeVisible();
  await expect(exportButton).toHaveText("Télécharger la sauvegarde JSON");

  const downloadPromise = page.waitForEvent("download");
  await exportButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("boxeur-deux-eric-export-semaine-1.json");
  const downloadPath = await download.path();
  const exported = JSON.parse(await fs.readFile(downloadPath, "utf8"));

  expect(exported.export).toMatchObject({ kind: "boxeur-deux-complete-career", version: 2 });
  expect(exported.state.profile).toMatchObject({ firstName: "Éric", lastName: "Export", nickname: "Copie" });
  expect(exported.state.money).toBe(735);
  expect(exported.state.rosterState.fighters).toHaveLength(10);
  expect(exported.careerCapsule.kind).toBe("boxeur-deux-career-capsule");
  expect(exported.careerCapsule.timeState.statXp.technique).toBe(16);
  await expect(page.locator("#toast")).toContainText("Sauvegarde JSON téléchargée");

  await page.evaluate(() => {
    const capsule = JSON.parse(localStorage.getItem("boxeur-deux-career-runtime"));
    capsule.timeState.statXp.technique = 0;
    localStorage.setItem("boxeur-deux-career-runtime", JSON.stringify(capsule));
  });
  await page.locator("#import-career-file").setInputFiles(downloadPath);
  await expect(page.locator("#toast")).toContainText("Carrière restaurée");
  const restoredXp = await page.evaluate(() => JSON.parse(
    localStorage.getItem("boxeur-deux-career-runtime"),
  ).timeState.statXp.technique);
  expect(restoredXp).toBe(16);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state.rosterState)).toEqual(exported.state.rosterState);
});

test("compose la semaine à la Maison sans appliquer le plan avant sa confirmation", async ({ page }) => {
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
    localStorage.setItem("boxeur-deux-career", JSON.stringify(value));
  }, snapshot);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  const migrationDialog = page.locator("#division-migration-dialog");
  if (await migrationDialog.isVisible()) {
    await migrationDialog.getByRole("button", { name: "Confirmer et continuer" }).click();
  }

  await page.getByRole("button", { name: /Entrer : Maison/ }).click();
  const home = page.locator(".career-home-view");
  await expect(home).toBeVisible();
  await expect(home.locator(".career-home-week-plan")).toContainText(/capacité hebdomadaire/i);
  await expect(home.locator('[data-career-home-zone="basement"]')).toHaveAttribute("data-career-home-menu", "training");
  await expect(home.locator('[data-career-home-zone="running"]')).toHaveAttribute("data-career-home-menu", "running");
  const desktopScene = await home.locator(".career-home-scene").boundingBox();
  const desktopRunning = await home.locator('[data-career-home-zone="running"]').boundingBox();
  const desktopRunningX = (desktopRunning.x + desktopRunning.width / 2 - desktopScene.x) / desktopScene.width;
  const desktopRunningY = (desktopRunning.y + desktopRunning.height / 2 - desktopScene.y) / desktopScene.height;
  expect(desktopRunningX).toBeGreaterThan(0.24);
  expect(desktopRunningX).toBeLessThan(0.38);
  expect(desktopRunningY).toBeGreaterThan(0.14);
  expect(desktopRunningY).toBeLessThan(0.29);

  const beforePlanning = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  const capacityBefore = Number(await home.locator(".career-home-week-plan meter").getAttribute("value"));
  await home.locator('[data-career-home-menu="training"]').click();
  const homeQuick = page.locator('.career-home-menu [data-career-home-action="home-quick"]');
  await homeQuick.click();
  await expect(home.locator(".career-home-week-plan")).toContainText("Entraînement maison rapide");
  const capacityWithTraining = Number(await home.locator(".career-home-week-plan meter").getAttribute("value"));
  expect(capacityWithTraining).toBeLessThan(capacityBefore);

  const afterTrainingDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(afterTrainingDraft.timeState).toEqual(beforePlanning.timeState);
  expect(afterTrainingDraft.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "home-quick")).toBe(true);

  await home.locator(".career-home-planned-list", { hasText: "Entraînement maison rapide" }).getByRole("button", { name: "Retirer" }).click();
  expect(Number(await home.locator(".career-home-week-plan meter").getAttribute("value"))).toBe(capacityBefore);
  await home.locator('[data-career-home-menu="training"]').click();
  await page.locator('.career-home-menu [data-career-home-action="home-quick"]').click();
  await home.locator('[data-career-home-zone="bed"]').click();
  await home.locator('[data-career-home-menu="kitchen"]').click();
  await page.locator('.career-home-menu [data-career-home-action="meal"]').click();
  await expect(home.locator(".career-home-week-plan")).toContainText("Repas maison de récupération");

  const beforeConfirmation = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(beforeConfirmation.main.state.money).toBe(snapshot.state.money);
  expect(beforeConfirmation.main.state.week).toBe(snapshot.state.week);
  expect(beforeConfirmation.capsule.timeState).toEqual(beforePlanning.timeState);

  await page.locator("[data-career-leave-home]").click();
  await confirmWeekFromLauncher(page);
  await expect(page.locator(".career-week-summary")).toBeVisible();
  const afterConfirmation = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(afterConfirmation.main.state.week).toBe(snapshot.state.week + 1);
  expect(afterConfirmation.main.state.money).toBe(snapshot.state.money - 15);
  expect(afterConfirmation.capsule.previewRuntime.weeklySummaries[0].counts.training).toBe(1);
  expect(afterConfirmation.capsule.previewRuntime.weeklySummaries[0].actions.some(action => action.primitive?.plannerActivityId === "rest")).toBe(true);
  expect(afterConfirmation.capsule.previewRuntime.weeklySummaries[0].actions.some(action => action.primitive?.plannerActivityId === "meal")).toBe(true);
});

test("ouvre le menu développeur depuis Travail et restaure la vraie carrière", async ({ page }) => {
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
    localStorage.setItem("boxeur-deux-career", JSON.stringify(snapshot));
  }, original);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  await page.getByRole("button", { name: /Entrer : Emploi/ }).click();
  const secretTrigger = page.locator(".career-work-header [data-career-developer-secret]");
  await expect(secretTrigger).toBeVisible();
  await expect(page.locator(".career-work-view")).not.toContainText("Vente de stupéfiants");
  await expect(page.locator(".career-work-view")).not.toContainText("Faire mon emploi");
  const workFit = await page.locator(".career-work-view").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(workFit.scrollWidth).toBeLessThanOrEqual(workFit.clientWidth + 1);
  expect(workFit.documentWidth).toBeLessThanOrEqual(workFit.viewportWidth + 1);
  for (let activation = 0; activation < 5; activation += 1) await secretTrigger.click();

  await expect(page.locator("#developer-code-dialog")).toBeVisible();
  await page.locator("#developer-code-input").fill("128");
  await page.locator("#developer-code-form").press("Enter");
  await expect(page.locator("#developer-test-dialog")).toBeVisible();
  await expect(page.locator("[data-developer-preset]")).toHaveCount(8);

  await page.locator('[data-developer-tool="funds"]').click();
  await expect(page.locator("#career-world")).toContainText("9999 $");
  await page.locator('[data-developer-tool="recover"]').click();
  await expect(page.locator(".career-vitals")).toContainText("100 %");
  await expect(page.locator(".career-vitals")).toContainText("0 %");
  let capsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(capsule.timeState.condition.energy).toBe(100);
  expect(capsule.timeState.condition.fatigue).toBe(0);

  await page.locator('[data-developer-preset="bronze-ready"]').click();
  await expect(page.locator(".career-test-mode-banner")).toBeVisible();
  await expect(page.locator(".career-test-mode-banner")).toContainText("Mode test actif");
  await expect(page.locator(".career-test-mode-banner")).toContainText("Alex Test");
  await expect(page.locator("[data-career-restore-career]")).toBeVisible();
  const bannerFit = await page.locator(".career-test-mode-banner").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(bannerFit.scrollWidth).toBeLessThanOrEqual(bannerFit.clientWidth + 1);
  capsule = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(capsule.legacySnapshot.state.profile.lastName).toBe("Test");
  expect(capsule.legacySnapshot.state.week).toBe(15);

  await page.locator("[data-career-restore-career]").click();
  await expect(page.locator(".career-test-mode-banner")).toHaveCount(0);
  const restored = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
    active: localStorage.getItem("boxeur-deux-career-dev-active"),
    backup: localStorage.getItem("boxeur-deux-career-dev-return"),
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

test("préserve les anciennes blessures sans bloquer ni afficher un repos médical", async ({ page }) => {
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
    localStorage.setItem("boxeur-deux-career", JSON.stringify(snapshot));
  }, injured);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  await page.getByRole("button", { name: /Entrer : GYM de boxe/ }).click();
  await expect(page.locator(".career-gym-readiness")).not.toContainText("Repos médical");
  await page.locator('[data-career-gym-zone="coach"]').click();
  await expect(page.locator("[data-career-coach-session]")).toBeEnabled();
  await page.locator("[data-career-gym-menu-close]").click();
  await expect(page.locator('[data-career-gym-zone="training"]')).toBeEnabled();
  await expect(page.locator(".career-gym-hotspot-reception")).toBeEnabled();
  const preserved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(preserved.injury).toBe(55);
  expect(preserved.injuryWeeks).toBe(2);
});

test("migre une sauvegarde v3, recâble son combat réservé et impose le choix de division", async ({ page }) => {
  test.setTimeout(45_000);
  await openStoredCareer(page, legacyV3Snapshot());

  await page.locator("[data-career-open-calendar]").first().click();
  await expect(page.locator("#scheduled-fight")).toContainText("Prochain combat programmé");
  await expect(page.locator("#division-migration-dialog")).not.toBeVisible();

  const migratedBeforeWithdrawal = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(migratedBeforeWithdrawal.version).toBe(6);
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
  await page.locator('[data-career-nav="fighter"]').click();
  await expect(page.locator(".career-fighter-identity")).toContainText("W60");
  await expect(page.locator(".career-fighter-portrait img")).toHaveAttribute("src", /portraits-femmes\.webp/);

  const migratedAfterChoice = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(migratedAfterChoice.version).toBe(6);
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
  const tournamentSource = dueTournamentSnapshot();
  tournamentSource.state.scheduledFight.id = "leclerc";
  tournamentSource.state.scheduledFight.opponent.id = "leclerc";
  await openStoredCareer(page, tournamentSource);

  const migratedTournament = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(migratedTournament.activeTournament.bookingId).toBeTruthy();
  expect(migratedTournament.rosterState.reservations).toHaveLength(1);
  expect(migratedTournament.bookings.some(booking => booking.id === migratedTournament.activeTournament.bookingId)).toBe(true);

  await enterDueTournamentFromArena(page);
  const tournamentDialog = page.locator("#tournament-dialog");
  await expect(tournamentDialog).toBeVisible();
  await expect(page.locator("#tournament-daily-status")).toContainText("1 / 3");
  await expect(page.locator("#tournament-daily-status")).toContainText("Pesée à effectuer");

  const nextTournamentStep = page.locator("#tournament-next-fight");
  await expect(nextTournamentStep).toContainText(/Passer la pesée.*jour 1/);
  await nextTournamentStep.click();
  await expect(page.locator("#tournament-daily-status")).toContainText("Autorisé à boxer aujourd’hui");
  await expect(nextTournamentStep).toContainText(/Disputer/);
  await nextTournamentStep.click();

  const fightDialog = page.locator("#fight-dialog");
  await expect(fightDialog).toBeVisible();
  await expect(fightDialog).not.toHaveClass(/local-fight-prototype/);
  await expect(fightDialog).toHaveClass(/sparring-ring-prototype/);
  await expect(fightDialog).toHaveClass(/tournament-fight-prototype/);
  await expect(fightDialog).not.toHaveClass(/olympic-fight-prototype/);
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-scene", "before");
  await expect(page.locator(".tournament-amateur-before-backdrop")).toBeVisible();
  await expect(page.locator(".ring-backdrop")).toBeHidden();
  await expect(page.locator(".local-fight-ring-backdrop")).toBeHidden();
  await expect(page.locator("#fight-score-label")).toHaveText("Cartes cachées");
  await expect(page.locator("#fight-judge-cards")).toBeHidden();
  await expect(page.locator("#fight-coach-title")).toHaveText("Le coach prépare ton combat");
  await chooseCoachDirective(page);
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-scene", "ring");
  await expect(page.locator(".tournament-amateur-ring-backdrop")).toBeVisible();
  await expect(page.locator("#fight-choices [data-fight-action]")).toHaveCount(5);
  await completeFightWithLowImpactActions(page);

  await expect(page.locator("#fight-status")).toContainText("Victoire aux points");
  await expect(page.locator("#fight-score-label")).toHaveText("Décision · 5 juges");
  await expect(page.locator("#fight-ring-stage")).toHaveAttribute("data-sparring-scene", "after");
  await expect(page.locator(".tournament-amateur-after-backdrop")).toBeVisible();
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
  await expect(page.locator("#tournament-daily-status")).toContainText("Pesée à effectuer");
  await expect(nextTournamentStep).toContainText(/Passer la pesée.*jour 2/);

  const afterRecovery = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(afterRecovery.activeTournament.currentRound).toBe(1);
  expect(afterRecovery.activeTournament.competition.day).toBe(2);
  expect(afterRecovery.activeTournament.competition.wins).toBe(1);
  expect(afterRecovery.activeTournament.competition.boutsFought).toBe(1);
  expect(afterRecovery.activeTournament.competition.phase).toBe("daily_check");
  expect(afterRecovery.activeTournament.competition.lastRecoveryId).toBeTruthy();
  expect(afterRecovery.currentWeightKg).toBe(63);
  expect(afterRecovery.amateurRecord.draws).toBe(0);
  expect(afterRecovery.scheduledFight.id).toBe("leclerc");
  expect(afterRecovery.scheduledFight.week).toBe(12);
  expect(afterRecovery.activeTournament.deferredScheduledFight).toBeUndefined();
  expect(afterRecovery.rosterState).toEqual(migratedTournament.rosterState);

  await nextTournamentStep.click();
  await expect(page.locator("#tournament-daily-status")).toContainText("Autorisé à boxer aujourd’hui");
  const afterDayTwoWeighIn = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state.activeTournament.competition);
  expect(afterDayTwoWeighIn.phase).toBe("ready");
  expect(afterDayTwoWeighIn.weight.history).toHaveLength(2);
  expect(afterDayTwoWeighIn.weight.history.every(entry => entry.passed)).toBe(true);
});

test("utilise les quatre scènes olympiques avec le combat tactique sur mobile", async ({ page }) => {
  test.setTimeout(75_000);
  await page.addInitScript(() => {
    let value = 3000;
    try {
      Object.defineProperty(globalThis.crypto, "getRandomValues", {
        configurable: true,
        value(array) {
          for (let index = 0; index < array.length; index += 1) array[index] = value + index * 19;
          value += 103;
          return array;
        },
      });
    } catch {
      // Les statistiques du snapshot gardent tout de même ce parcours très stable.
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await openStoredCareer(page, dueTournamentSnapshot("olympic"));

  await enterDueTournamentFromArena(page);
  await expect(page.locator("#tournament-daily-status")).toContainText("1 / 5");
  const nextTournamentStep = page.locator("#tournament-next-fight");
  await nextTournamentStep.click();
  await expect(page.locator("#tournament-daily-status")).toContainText("Autorisé à boxer aujourd’hui");
  await nextTournamentStep.click();

  const fightDialog = page.locator("#fight-dialog");
  const stage = page.locator("#fight-ring-stage");
  await expect(fightDialog).toHaveClass(/sparring-ring-prototype/);
  await expect(fightDialog).toHaveClass(/tournament-fight-prototype/);
  await expect(fightDialog).toHaveClass(/olympic-fight-prototype/);
  await expect(stage).toHaveAttribute("data-sparring-scene", "before");
  await expect(page.locator(".tournament-olympic-before-backdrop")).toBeVisible();
  await expect(page.locator(".tournament-amateur-before-backdrop")).toBeHidden();

  const beforeMetrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    dialog: document.querySelector("#fight-dialog").scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(beforeMetrics.body).toBeLessThanOrEqual(beforeMetrics.viewport + 1);
  expect(beforeMetrics.document).toBeLessThanOrEqual(beforeMetrics.viewport + 1);
  expect(beforeMetrics.dialog).toBeLessThanOrEqual(beforeMetrics.viewport + 1);

  await chooseCoachDirective(page);
  await expect(stage).toHaveAttribute("data-sparring-scene", "ring");
  await expect(page.locator(".tournament-olympic-ring-backdrop")).toBeVisible();
  const tacticalButtons = page.locator("#fight-choices [data-fight-action]:visible");
  await expect(tacticalButtons).toHaveCount(5);
  for (const button of await tacticalButtons.all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }

  for (let exchange = 0; exchange < 5; exchange += 1) {
    expect(await chooseLowImpactExchange(page)).toBe(true);
  }
  await expect(stage).toHaveAttribute("data-sparring-scene", "corner");
  await expect(page.locator(".tournament-olympic-corner-backdrop")).toBeVisible();
  await chooseCoachDirective(page);
  await completeFightWithLowImpactActions(page);

  await expect(stage).toHaveAttribute("data-sparring-scene", "after");
  await expect(page.locator(".tournament-olympic-after-backdrop")).toBeVisible();
  await expect(page.locator("#fight-score-label")).toHaveText("Décision · 5 juges");
  await expect(page.locator("#fight-judge-cards .judge-card")).toHaveCount(5);
});

test("célèbre l’or d’un tournoi indépendant et l’inscrit au bilan sur ordinateur et mobile", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    let value = 5000;
    try {
      Object.defineProperty(globalThis.crypto, "getRandomValues", {
        configurable: true,
        value(array) {
          for (let index = 0; index < array.length; index += 1) array[index] = value + index * 23;
          value += 107;
          return array;
        },
      });
    } catch {
      // Le profil de finale reste très supérieur à son adversaire.
    }
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await openStoredCareer(page, finalTournamentSnapshot());

  await enterDueTournamentFromArena(page);
  const tournamentStep = page.locator("#tournament-next-fight");
  await expect(page.locator("#tournament-daily-status")).toContainText("3 / 3");
  await tournamentStep.click();
  await expect(page.locator("#tournament-daily-status")).toContainText("Autorisé à boxer aujourd’hui");
  await tournamentStep.click();
  await expect(page.locator("#fight-dialog")).toBeVisible();
  await expect(page.locator("#fight-coach-choices [data-coach-option]").first()).toBeVisible();
  await completeFightWithLowImpactActions(page);
  await expect(page.locator("#fight-status")).toContainText("Victoire");
  await page.locator("#fight-instruction button.primary-button", { hasText: "Retour au tournoi" }).click();

  const medalDialog = page.locator("#tournament-medal-dialog");
  const medalImage = page.locator("#tournament-medal-image");
  await expect(medalDialog).toBeVisible();
  await expect(page.locator("#tournament-medal-card")).toHaveAttribute("data-medal", "gold");
  await expect(page.locator("#tournament-medal-title")).toHaveText("Médaille d’or");
  await expect(page.locator("#tournament-medal-congratulations")).toHaveText("Félicitations, Ari !");
  await expect(page.locator("#tournament-medal-copy")).toContainText("Coupe régionale des clubs");
  await expect(medalImage).toHaveAttribute("src", "assets/tournament-medal-gold-v1.png");
  await expect.poll(() => medalImage.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);

  const desktopMetrics = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    dialog: document.querySelector("#tournament-medal-dialog").scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(desktopMetrics.document).toBeLessThanOrEqual(desktopMetrics.viewport + 1);
  expect(desktopMetrics.dialog).toBeLessThanOrEqual(desktopMetrics.viewport + 1);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileMetrics = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    dialog: document.querySelector("#tournament-medal-dialog").scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(mobileMetrics.document).toBeLessThanOrEqual(mobileMetrics.viewport + 1);
  expect(mobileMetrics.dialog).toBeLessThanOrEqual(mobileMetrics.viewport + 1);
  const continueBox = await page.locator("#tournament-medal-continue").boundingBox();
  expect(continueBox && continueBox.height).toBeGreaterThanOrEqual(44);

  await page.locator("#tournament-medal-continue").click();
  await expect(page.locator("#tournament-dialog")).toBeVisible();
  await expect(page.locator("#tournament-board-status")).toContainText("médaille d’or");
  await page.locator("#tournament-board-close").click();
  if (await page.locator("#calendar-dialog").isVisible()) await page.locator('#calendar-dialog [data-career-nav="map"]').click();

  await page.locator('[data-career-nav="fighter"]').click();
  await expect(page.locator(".career-fighter-medal-summary")).toContainText("Or 1");
  const regionalMedals = page.locator(".career-fighter-medal-row", { hasText: "Coupe régionale des clubs" });
  await expect(regionalMedals).toContainText("Or 1");
  await expect(regionalMedals).toContainText("Argent 0");
  await expect(regionalMedals).toContainText("Bronze 0");

  const saved = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")).state,
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(saved.main.medals["regional-cup"].gold).toBe(1);
  expect(saved.main.activeTournament).toBeNull();
  expect(saved.main.week).toBe(9);
  expect(saved.capsule.previewRuntime.fightGate).toBeNull();
});

test("associe or, argent et bronze à leur visuel dans une ancienne sauvegarde", async ({ page }) => {
  const cases = [
    { medal: "gold", label: "Médaille d’or", asset: "tournament-medal-gold-v1.png" },
    { medal: "silver", label: "Médaille d’argent", asset: "tournament-medal-silver-v1.png" },
    { medal: "bronze", label: "Médaille de bronze", asset: "tournament-medal-bronze-v1.png" },
  ];

  for (const medalCase of cases) {
    await openStoredCareer(page, completedMedalSnapshot(medalCase.medal));
    await page.locator("[data-career-open-calendar]").first().click();
    await page.locator("#active-tournament [data-open-tournament]").click();
    await expect(page.locator("#tournament-medal-dialog")).toBeVisible();
    await expect(page.locator("#tournament-medal-card")).toHaveAttribute("data-medal", medalCase.medal);
    await expect(page.locator("#tournament-medal-title")).toHaveText(medalCase.label);
    await expect(page.locator("#tournament-medal-image")).toHaveAttribute("src", new RegExp(`${medalCase.asset}$`));
    await expect.poll(() => page.locator("#tournament-medal-image").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.locator("#tournament-medal-continue").click();
    await expect(page.locator("#tournament-dialog")).toBeVisible();
  }
});

test("reconstruit la capsule de carrière depuis une carrière importée avant son premier rendu", async ({ page }) => {
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
    privateProgram: {
      coachId: "renard",
      target: "technique",
      sessionsCompleted: 2,
      firstSessionPaid: true,
    },
  });
  await page.evaluate(snapshot => {
    localStorage.clear();
    localStorage.setItem("boxeur-deux-career", JSON.stringify(snapshot));
  }, previous);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  const beforeImport = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(beforeImport.previewRuntime.career.experience).toBe(110);
  expect(beforeImport.previewRuntime.career.jobTenureWeeks).toBe(1);

  await page.locator("#import-career-file").setInputFiles({
    name: "carriere-importee.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(imported)),
  });
  await expect(page.locator("#toast")).toContainText("Carrière restaurée");
  const afterImport = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
  }));
  expect(afterImport.main.state.profile.nickname).toBe("Après");
  expect(afterImport.main.state.experience).toBe(220);
  expect(afterImport.main.state.jobTenureWeeks).toBe(6);
  expect(afterImport.main.state.jobWagesEarned).toBe(575);
  expect(afterImport.main.state.vacationBankWeeks).toBe(1);
  expect(afterImport.main.state.initialJobLockedUntilWeek).toBe(9);
  expect(afterImport.main.state.privateProgram).toBeNull();
  expect(afterImport.main.state.trainerState.activeProgram).toBeNull();
  expect(afterImport.capsule.previewRuntime.career.experience).toBe(220);
  expect(afterImport.capsule.previewRuntime.career.jobTenureWeeks).toBe(6);
  expect(afterImport.capsule.previewRuntime.career.jobWagesEarned).toBe(575);
  expect(afterImport.capsule.previewRuntime.career.vacationBankWeeks).toBe(1);
  expect(afterImport.capsule.previewRuntime.career.initialJobLockedUntilWeek).toBe(9);
  expect(afterImport.capsule.previewRuntime.career.trainerState.activeProgram).toBeNull();
  expect(afterImport.capsule.previewRuntime.trainingSessions).toBe(4);
});

test("planifie musculation, entraîneur privé et supplément dans l’inventaire sur PC et mobile", async ({ page }) => {
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
    localStorage.setItem("boxeur-deux-career", JSON.stringify(snapshot));
  }, original);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();

  const strengthOpener = page.getByRole("button", { name: /Entrer : Gym de musculation/ }).first();
  await expect(strengthOpener).toHaveAccessibleName(/Abonnement facultatif/);
  await strengthOpener.click();
  const strengthView = page.locator(".career-strength-view");
  await expect(strengthView).toBeVisible();
  await expect(strengthView).toHaveAttribute("data-career-strength-access", "membership-required");
  await expect(page.locator("[data-career-strength-zone]")).toHaveCount(5);
  await expect(page.locator('.career-strength-scene img')).toHaveJSProperty("naturalWidth", 1672);
  await expect(page.locator('[data-career-strength-zone="reception"]')).toBeEnabled();
  await expect(page.locator('[data-career-strength-zone="crossfit"]')).toBeDisabled();

  await page.locator('[data-career-strength-zone="reception"]').click();
  await expect(page.locator('[data-career-strength-menu="reception"]')).toBeVisible();
  await expect(page.locator("[data-career-strength-plan]")).toHaveCount(2);
  await expect(page.locator('[data-career-strength-plan="monthly"]')).toContainText("Choisir 1 mois");
  await expect(page.locator('[data-career-strength-plan="monthly"]')).toBeEnabled();
  await expect(page.locator('.career-strength-plan:has([data-career-strength-plan="monthly"])')).toContainText("95 $");
  await expect(page.locator('.career-strength-plan:has([data-career-strength-plan="three-months"])')).toContainText("270 $");

  const desktopStrengthFit = await page.locator(".career-strength-reception-menu").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(desktopStrengthFit.scrollWidth).toBeLessThanOrEqual(desktopStrengthFit.clientWidth + 1);
  expect(desktopStrengthFit.documentWidth).toBeLessThanOrEqual(desktopStrengthFit.viewportWidth + 1);

  await page.locator('[data-career-strength-plan="monthly"]').click();
  await expect(strengthView).toHaveAttribute("data-career-strength-access", "active");
  await expect(page.locator(".career-strength-membership-summary")).toContainText("Abonnement actif · 4 sem.");
  await expect(page.locator(".career-strength-access")).toContainText("Énergie 92 %");

  await page.locator('[data-career-strength-zone="crossfit"]').click();
  await expect(page.locator('[data-career-strength-menu="crossfit"]')).toContainText("Cours de CrossFit");
  await expect(page.locator("[data-career-strength-quick]")).toContainText("Ajouter le cours à ma semaine");
  await page.locator("[data-career-strength-menu-close]").click();

  await page.locator("[data-career-strength-trainer]").click();
  const trainerPanel = page.locator(".career-trainer-panel");
  await expect(trainerPanel).toBeVisible();
  await expect(trainerPanel).toContainText("Entraîneurs privés");
  await expect(page.locator('[data-career-trainer-target="power"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-career-trainer-start]")).toHaveCount(3);
  await expect(trainerPanel).toContainText("Kim Nguyen");
  await expect(trainerPanel).toContainText("Darnell Brooks");
  await expect(trainerPanel).toContainText("Valérie Fortin");
  await expect(trainerPanel).not.toContainText(/Olivier Martel|Maude Lavoie|Hector Vargas|\/[4-9] séances/);
  const clubTrainer = page.locator('.career-trainer-offer:has([data-career-trainer-start="strength-club"])');
  await expect(clubTrainer).toContainText("120 $ · séance unique");
  await expect(clubTrainer).toContainText("−12 capacité hebdomadaire");
  await expect(page.locator('[data-career-trainer-start="strength-club"]')).toHaveText("Voir et réserver cette séance");
  const beforeTrainerReservation = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  await page.locator('[data-career-trainer-start="strength-club"]').click();
  const trainerDialog = page.locator("#trainer-session-dialog");
  await expect(trainerDialog).toBeVisible();
  await expect(trainerDialog).toContainText("Confirmer avec Kim Nguyen");
  await expect(trainerDialog).toContainText("2505 $ → 2385 $");
  await expect(trainerDialog).toContainText("28 → 16");
  await expect(trainerDialog).toContainText("12 de capacité hebdomadaire seront réservés");
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileTrainerFit = await trainerDialog.evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(mobileTrainerFit.scrollWidth).toBeLessThanOrEqual(mobileTrainerFit.clientWidth + 1);
  expect(mobileTrainerFit.documentWidth).toBeLessThanOrEqual(mobileTrainerFit.viewportWidth + 1);
  const mobileTrainerButton = await page.locator('[data-career-trainer-confirm="strength-club"]').boundingBox();
  expect(mobileTrainerButton?.height).toBeGreaterThanOrEqual(44);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("[data-career-trainer-confirmation-cancel]").last().click();
  let trainerReservation = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(trainerReservation.previewRuntime.career.money).toBe(beforeTrainerReservation.previewRuntime.career.money);
  expect(trainerReservation.previewRuntime.career.trainerState.activeProgram).toBeNull();
  expect(trainerReservation.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "private-training")).toBe(false);
  await page.locator('[data-career-trainer-start="strength-club"]').click();
  await page.locator('[data-career-trainer-confirm="strength-club"]').click();
  await expect(page.locator(".career-trainer-active")).toContainText("Kim Nguyen");
  await expect(page.locator(".career-trainer-active")).toContainText("Séance privée réservée");
  await expect(page.locator(".career-trainer-active")).toContainText("Puissance · une seule séance");
  await expect(page.locator("[data-career-location-remove]")).toContainText("rembourser 120 $");
  await page.locator("[data-career-location-remove]").click();
  await expect(strengthView).toBeVisible();
  await page.locator("[data-career-strength-trainer]").click();
  await expect(page.locator('[data-career-trainer-start="strength-club"]')).toBeVisible();
  trainerReservation = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(trainerReservation.previewRuntime.career.money).toBe(2505);
  expect(trainerReservation.previewRuntime.career.trainerState.activeProgram).toBeNull();
  await page.locator('[data-career-trainer-start="strength-club"]').click();
  await page.locator('[data-career-trainer-confirm="strength-club"]').click();
  await page.locator("[data-career-trainer-close]").click();
  await expect(page.locator(".career-strength-membership-summary", { hasText: "Kim Nguyen" })).toBeVisible();

  await page.locator("[data-career-strength-shop]").click();
  const supplementShop = page.locator(".career-supplement-shop");
  await expect(supplementShop).toBeVisible();
  await expect(supplementShop).toContainText("Boutique de suppléments");
  await expect(supplementShop).toContainText("Choisis, vérifie, confirme");
  await expect(supplementShop).toContainText("L’achat n’utilise pas le produit");
  const proteinBar = page.locator('[data-career-supplement-buy="protein-bar"]');
  await expect(proteinBar).toBeEnabled();
  const beforePurchase = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  await proteinBar.click();
  const purchaseDialog = page.locator("#supplement-purchase-dialog");
  await expect(purchaseDialog).toBeVisible();
  await expect(purchaseDialog).toContainText("Confirmer l’achat");
  await expect(purchaseDialog).toContainText("Barre protéinée");
  await expect(purchaseDialog).toContainText("Réduit très légèrement le coût d'énergie");
  await expect(purchaseDialog).toContainText("2385 $ → 2375 $");
  await expect(purchaseDialog).toContainText("×0 → ×1");
  await page.locator("[data-career-supplement-purchase-cancel]").last().click();
  await expect(purchaseDialog).toBeHidden();
  let purchaseState = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(purchaseState.previewRuntime.career.money).toBe(beforePurchase.previewRuntime.career.money);
  expect(purchaseState.previewRuntime.career.supplementState.inventory["protein-bar"] || 0).toBe(0);

  await proteinBar.click();
  await expect(purchaseDialog).toBeVisible();
  await page.locator('[data-career-supplement-purchase-confirm="protein-bar"]').click();
  await expect(purchaseDialog).toBeHidden();
  await expect(page.locator('[data-career-supplement-buy="protein-bar"]')).toContainText("possédé ×1");
  await page.locator('[data-career-supplement-buy="protein-bar"]').click();
  await page.locator('[data-career-supplement-purchase-confirm="protein-bar"]').click();
  await expect(page.locator('[data-career-supplement-buy="protein-bar"]')).toContainText("possédé ×2");
  purchaseState = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(purchaseState.previewRuntime.career.money).toBe(2365);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".career-strength-shop-scene img")).toHaveJSProperty("naturalWidth", 941);
  await expect(proteinBar).toContainText("10 $");
  await expect(proteinBar).toContainText("possédé ×2");
  await proteinBar.click();
  await expect(purchaseDialog).toBeVisible();
  await expect(purchaseDialog).toContainText("2365 $ → 2355 $");
  await expect(purchaseDialog).toContainText("×2 → ×3");
  const mobilePurchaseFit = await purchaseDialog.evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(mobilePurchaseFit.scrollWidth).toBeLessThanOrEqual(mobilePurchaseFit.clientWidth + 1);
  expect(mobilePurchaseFit.documentWidth).toBeLessThanOrEqual(mobilePurchaseFit.viewportWidth + 1);
  const mobilePurchaseButton = await page.locator('[data-career-supplement-purchase-confirm="protein-bar"]').boundingBox();
  expect(mobilePurchaseButton?.height).toBeGreaterThanOrEqual(44);
  await page.locator("[data-career-supplement-purchase-cancel]").last().click();
  await expect(purchaseDialog).toBeHidden();
  purchaseState = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(purchaseState.previewRuntime.career.money).toBe(2365);
  expect(purchaseState.previewRuntime.career.supplementState.inventory["protein-bar"]).toBe(2);
  const mobileShopFit = await page.locator(".career-strength-shop").evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(mobileShopFit.scrollWidth).toBeLessThanOrEqual(mobileShopFit.clientWidth + 1);
  expect(mobileShopFit.documentWidth).toBeLessThanOrEqual(mobileShopFit.viewportWidth + 1);
  await page.locator("[data-career-supplement-shop-close]").click();
  await expect(strengthView).toBeVisible();
  await expect(page.locator(".career-strength-scene img")).toHaveJSProperty("naturalWidth", 941);
  await expect(page.locator(".career-strength-membership-summary", { hasText: "2 en inventaire" })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.locator('[data-career-strength-zone="program"]').click();
  await page.locator('[data-career-strength-activity="dynamic_warmup"]').first().click();
  await page.locator('[data-career-strength-activity="upper_back_guard"]').first().click();
  await page.locator('[data-career-strength-activity="mobility_cooldown"]').first().click();
  await expect(page.locator(".career-strength-selection")).toContainText("3 activités");
  await expect(page.locator(".career-strength-selection")).toContainText(/Énergie après\s*76 %/);
  await expect(page.locator(".career-strength-menu-header")).toContainText("de capacité disponible");
  await expect(page.locator(".career-strength-selection")).toContainText("Fatigue après");
  await expect(page.locator("[data-career-strength-confirm]")).toBeEnabled();
  const beforeStrengthDraft = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  await page.locator("[data-career-strength-confirm]").click();
  const directSupplementChoice = page.locator("#session-supplement-dialog");
  await expect(directSupplementChoice).toBeVisible();
  await expect(directSupplementChoice).toContainText("Séance de musculation personnalisée");
  await expect(directSupplementChoice).toContainText("Barre protéinée ×2");
  await expect(directSupplementChoice).not.toContainText("undefined");
  const strengthBeforeDirectSupplement = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")).previewRuntime.weekPlanner.entries.find(entry => entry.activityId === "strength-custom"));
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileSupplementChoiceFit = await directSupplementChoice.evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(mobileSupplementChoiceFit.scrollWidth).toBeLessThanOrEqual(mobileSupplementChoiceFit.clientWidth + 1);
  expect(mobileSupplementChoiceFit.documentWidth).toBeLessThanOrEqual(mobileSupplementChoiceFit.viewportWidth + 1);
  const mobileSupplementChoiceButton = await directSupplementChoice.locator('[data-career-session-supplement="protein-bar"]').boundingBox();
  expect(mobileSupplementChoiceButton?.height).toBeGreaterThanOrEqual(44);
  await directSupplementChoice.locator('[data-career-session-supplement="protein-bar"]').click();
  await expect(directSupplementChoice).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(strengthView).toBeVisible();
  await expect(strengthView).toContainText("Supplément : Barre protéinée");
  let plannedServices = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(plannedServices.timeState).toEqual(beforeStrengthDraft.timeState);
  const strengthAfterDirectSupplement = plannedServices.previewRuntime.weekPlanner.entries.find(entry => entry.activityId === "strength-custom");
  expect(strengthAfterDirectSupplement.capacityCost).toBe(strengthBeforeDirectSupplement.capacityCost - 1);
  expect(strengthAfterDirectSupplement.supplementId).toBe("protein-bar");
  expect(plannedServices.previewRuntime.career.supplementState.inventory["protein-bar"]).toBe(2);

  await page.locator("[data-career-strength-trainer]").click();
  await expect(page.locator(".career-trainer-active")).toContainText("Séance privée réservée");
  await expect(page.locator(".career-trainer-active")).toContainText("est ajoutée à ta semaine");
  plannedServices = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(plannedServices.timeState).toEqual(beforeStrengthDraft.timeState);
  expect(plannedServices.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "private-training")).toBe(true);
  expect(plannedServices.previewRuntime.career.trainerState.activeProgram.sessionsCompleted).toBe(0);
  expect(plannedServices.previewRuntime.career.trainerState.activeProgram.sessionsTotal).toBe(1);
  expect(plannedServices.previewRuntime.career.money).toBe(2365);
  await page.locator("[data-career-trainer-close]").click();
  await page.locator("[data-career-leave-strength-gym]").click();
  await expect(page.locator(".career-now-money")).toContainText("2365 $");
  const moneyColor = await page.locator(".career-now-money").evaluate(element => getComputedStyle(element).color);
  const moneyChannels = (moneyColor.match(/\d+/g) || []).map(Number);
  expect(moneyChannels).toHaveLength(3);
  expect(moneyChannels[1], `la dominante de ${moneyColor} doit rester verte`).toBeGreaterThan(moneyChannels[0]);
  expect(moneyChannels[1], `la dominante de ${moneyColor} doit rester verte`).toBeGreaterThan(moneyChannels[2]);

  await page.locator('[data-career-nav="inventory"]').click();
  const inventoryView = page.locator(".career-inventory-view");
  await expect(inventoryView).toBeVisible();
  await expect(inventoryView).toContainText("Barre protéinée");
  await expect(inventoryView).toContainText("×2");
  await expect(inventoryView).toContainText("Réservé cette semaine");
  await expect(inventoryView).toContainText("Associé à : Séance de musculation personnalisée");
  await page.locator('[data-career-inventory-item="protein-bar"]').click();
  const supplementReservation = page.locator(".career-supplement-picker");
  await expect(supplementReservation).toBeVisible();
  await expect(supplementReservation).toContainText(/recalculé à partir du même effet/i);
  const strengthReservation = supplementReservation.locator(".career-supplement-card", { hasText: "Séance de musculation personnalisée" });
  await expect(strengthReservation.locator("[data-career-plan-supplement-entry]")).toContainText("Garder cette séance");
  await page.locator("[data-career-inventory-reserve-close]").click();
  const afterReservation = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  const strengthEntryAfterSupplement = afterReservation.previewRuntime.weekPlanner.entries.find(entry => entry.activityId === "strength-custom");
  expect(strengthEntryAfterSupplement.capacityCost).toBe(strengthBeforeDirectSupplement.capacityCost - 1);
  expect(strengthEntryAfterSupplement.supplementId).toBe("protein-bar");
  expect(afterReservation.previewRuntime.career.supplementState.inventory["protein-bar"]).toBe(2);
  expect(afterReservation.timeState).toEqual(beforeStrengthDraft.timeState);
  await page.locator('.career-location-sheet [data-career-nav="fighter"]').click();

  const fighterView = page.locator(".career-fighter-view");
  await expect(fighterView).toBeVisible();
  await expect(page.locator(".career-fighter-identity dd.money")).toContainText("2365 $");
  await expect(page.locator(".career-fighter-private-program")).toContainText("Kim Nguyen");
  await expect(page.locator(".career-fighter-private-program")).toContainText("Séance réservée");
  await expect(page.locator(".career-fighter-private-program")).toContainText("déjà ajoutée à la semaine");
  await expect(page.locator(".career-fighter-supplements")).toHaveCount(0);
  await expect(page.locator('.career-fighter-stat [role="progressbar"]')).toHaveCount(4);
  await expect(page.locator(".career-fighter-level-progress [role=progressbar]")).toBeVisible();
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
  await page.locator(".career-fighter-private").scrollIntoViewIfNeeded();
  expect(await fighterView.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await expect(page.locator(".career-fighter-private")).toBeVisible();
  for (const button of await page.locator(".career-location-sheet .career-world-nav button").all()) {
    const box = await button.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }

  await page.locator('.career-location-sheet [data-career-nav="map"]').click();
  await confirmWeekFromLauncher(page);
  await expect(page.locator(".career-week-summary")).toBeVisible();

  const afterConfirmation = await page.evaluate(() => ({
    main: JSON.parse(localStorage.getItem("boxeur-deux-career")),
    capsule: JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")),
    overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth,
  }));
  expect(afterConfirmation.main.state.week).toBe(2);
  expect(afterConfirmation.main.state.money).toBe(2465);
  expect(afterConfirmation.main.state.trainerState.activeProgram).toBeNull();
  expect(afterConfirmation.main.state.trainerState.completedPrograms).toHaveLength(1);
  expect(afterConfirmation.main.state.supplementState.inventory["protein-bar"]).toBe(1);
  expect(afterConfirmation.main.state.supplementState.weeklyUsage.count).toBe(1);
  expect(afterConfirmation.capsule.previewRuntime.career.strengthGymWeeks).toBe(3);
  expect(afterConfirmation.capsule.timeState.history.filter(event => String(event.activityId).startsWith("strength-gym-session:")).length).toBe(1);
  expect(afterConfirmation.capsule.timeState.history.filter(event => String(event.activityId).startsWith("private-trainer:")).length).toBe(1);
  expect(afterConfirmation.overflow).toBeLessThanOrEqual(1);

  await page.locator("[data-career-week-summary-close]").click();
  await page.locator('[data-career-nav="inventory"]').click();
  await expect(page.locator(".career-inventory-view")).toContainText("Barre protéinée");
  await expect(page.locator(".career-inventory-view")).toContainText("×1");
  await page.locator('.career-location-sheet [data-career-nav="fighter"]').click();
  await expect(page.locator(".career-fighter-private-program")).toHaveCount(0);
  await expect(page.locator(".career-fighter-private")).toContainText("Aucune séance privée en attente");
  await expect(page.locator(".career-fighter-supplements")).toHaveCount(0);
});

test("bloque clairement une séance privée sans argent ou sans capacité hebdomadaire", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({
    money: 119,
    gymWeeks: 2,
    strengthGymWeeks: 2,
  }));
  await page.getByRole("button", { name: /Entrer : Gym de musculation/ }).first().click();
  await page.locator("[data-career-strength-trainer]").click();
  const poorClubTrainer = page.locator('.career-trainer-offer:has([data-career-trainer-start="strength-club"])');
  await expect(poorClubTrainer).toContainText("120 $ · séance unique");
  await expect(poorClubTrainer).toContainText("Il manque 1 $ pour cette séance");
  await expect(page.locator('[data-career-trainer-start="strength-club"]')).toBeDisabled();
  await expect(page.locator("#trainer-session-dialog")).toBeHidden();

  await openStoredCareer(page, amateurSnapshot({
    money: 1000,
    energy: 92,
    fatigue: 5,
    gymWeeks: 2,
    strengthGymWeeks: 2,
    jobId: "office",
    jobsHeldCount: 1,
  }));
  await page.getByRole("button", { name: /Entrer : Gym de musculation/ }).first().click();
  await page.locator('[data-career-strength-zone="program"]').click();
  await page.locator('[data-career-strength-activity="dynamic_warmup"]').first().click();
  await page.locator('[data-career-strength-activity="upper_back_guard"]').first().click();
  await page.locator('[data-career-strength-activity="mobility_cooldown"]').first().click();
  await expect(page.locator("[data-career-strength-confirm]")).toBeEnabled();
  await page.locator("[data-career-strength-confirm]").click();
  await page.locator("[data-career-strength-trainer]").click();
  const fullWeekClubTrainer = page.locator('.career-trainer-offer:has([data-career-trainer-start="strength-club"])');
  await expect(fullWeekClubTrainer).toContainText("Il faut 12 de capacité hebdomadaire pour cette séance");
  await expect(page.locator('[data-career-trainer-start="strength-club"]')).toBeDisabled();
  await expect(page.locator("#trainer-session-dialog")).toBeHidden();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(saved.previewRuntime.career.money).toBe(1000);
  expect(saved.previewRuntime.career.trainerState.activeProgram).toBeNull();
  expect(saved.previewRuntime.weekPlanner.entries.some(entry => entry.activityId === "private-training")).toBe(false);
});

test("explique un achat de supplément impossible sans ouvrir la confirmation", async ({ page }) => {
  const original = amateurSnapshot({
    careerStatus: "amateur",
    money: 5,
    gymWeeks: 2,
    strengthGymWeeks: 2,
    combatStats: { technique: 38, power: 38, cardio: 38, defense: 38 },
  });
  await openStoredCareer(page, original);

  await page.getByRole("button", { name: /Entrer : Gym de musculation/ }).first().click();
  await page.locator("[data-career-strength-shop]").click();
  const proteinBar = page.locator('[data-career-supplement-buy="protein-bar"]');
  await expect(proteinBar).toBeDisabled();
  await expect(proteinBar).toContainText("10 $");
  await expect(proteinBar).toContainText("possédé ×0");
  await expect(proteinBar).toContainText("Il manque 5 $ pour cet achat");
  await expect(page.locator("#supplement-purchase-dialog")).toBeHidden();

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career-runtime")));
  expect(persisted.previewRuntime.career.money).toBe(5);
  expect(persisted.previewRuntime.career.supplementState.inventory["protein-bar"] || 0).toBe(0);
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`BE-C conserve un gala futur et son bassin pendant deux semaines à ${viewport.width} px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await openStoredCareer(page, amateurSnapshot({ money: 2000, gymWeeks: 8, jobId: "convenience" }));
    const initial = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
    await page.locator("[data-career-open-calendar]").first().click();
    const futureEvent = initial.calendar.events.find(event => event.kind === "gala" && event.careerWeek === 3);
    expect(futureEvent).toBeTruthy();
    const choice = page.locator(`[data-book-gala="${futureEvent.id}"]`).first();
    const group = page.locator(".calendar-week-group").filter({ has: choice });
    if (!await group.evaluate(element => element.open)) await group.locator(".calendar-week-summary").click();
    const chosenId = await choice.getAttribute("data-roster-fighter");
    // A stale button cannot silently buy a different opponent or charge the player.
    await page.evaluate(({ id, slot }) => bookGalaEvent(id, slot, "stale-id"), { id: futureEvent.id, slot: await choice.getAttribute("data-slot") });
    expect(await page.evaluate(() => state.money)).toBe(initial.money);
    expect(await page.evaluate(() => state.scheduledFight)).toBeNull();
    if (!await group.evaluate(element => element.open)) await group.locator(".calendar-week-summary").click();
    await choice.click();
    const booked = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
    expect(booked.scheduledFight.opponent.rosterFighterId).toBe(chosenId);
    expect(booked.rosterState.reservations).toHaveLength(1);
    const frozenFighter = booked.rosterState.fighters.find(fighter => fighter.id === chosenId);
    expect(booked.scheduledFight.opponent.stats).toEqual(frozenFighter.stats);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#resume-load").click();
    for (let week = 1; week <= 2; week += 1) {
      await confirmWeekFromLauncher(page);
      await expect(page.locator(".career-week-summary")).toBeVisible();
      await page.locator("[data-career-week-summary-close]").click();
      const current = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
      expect(current.week).toBe(week + 1);
      expect(current.rosterState.lastProcessedWeek).toBe(week);
      expect(current.rosterState.fighters.find(fighter => fighter.id === chosenId)).toEqual(frozenFighter);
      expect(current.scheduledFight).toEqual(booked.scheduledFight);
      expect(current.amateurRecord).toEqual(initial.amateurRecord);
      expect(current.rosterState.matches.every(match => !match.fighterIds.includes(chosenId) && !match.fighterIds.includes("player"))).toBe(true);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator("#resume-load").click();
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state.rosterState)).toEqual(current.rosterState);
    }
    const check = await page.evaluate(() => ({ valid: BoxeurRosterCareer.validateCareer(state),
      overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
    expect(check).toEqual({ valid: true, overflow: false });
    expect(errors).toEqual([]);
  });
}

test("BE-C migre un adversaire réservé sans changer sa fiche ni sa graine", async ({ page }) => {
  const opponent = { id: "leclerc", name: "Thomas Leclerc", nickname: "BETON", style: "Technicien",
    record: "12 V · 7 D · 1 N", difficulty: 65, rating: 65,
    stats: { technique: 69.125, power: 61.75, cardio: 65.5, defense: 63.625 }, weightClass: "M65" };
  const scheduledFight = { id: "leclerc", opponent, week: 23, tournamentId: null,
    fightSeed: "legacy-frozen-ring-seed", travelApplied: true, travelEffects: { energy: -4, fatigue: 6 } };
  await openStoredCareer(page, amateurSnapshot({ week: 20, money: 3500, scheduledFight,
    combatStats: { technique: 75, power: 72, cardio: 71, defense: 74 } }));
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(first.rosterState).toMatchObject({ startWeek: 20, lastProcessedWeek: 19, matches: [] });
  const storedOpponent = { ...first.scheduledFight.opponent };
  delete storedOpponent.rosterFighterId;
  delete storedOpponent.rosterBookingId;
  expect(storedOpponent).toMatchObject(opponent);
  expect(first.scheduledFight.fightSeed).toBe(scheduledFight.fightSeed);
  expect(first.scheduledFight.week).toBe(23);
  expect(first.money).toBe(3500);
  const fighter = first.rosterState.fighters.find(item => item.id === "leclerc");
  expect(fighter.stats).toEqual(opponent.stats);
  expect(fighter.initialRecord).toEqual({ wins: 12, losses: 7, draws: 1 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#resume-load").click();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")).state);
  expect(restored.rosterState).toEqual(first.rosterState);
  expect(restored.scheduledFight).toEqual(first.scheduledFight);
});

test("BE-C refuse une importation incohérente sans remplacer la carrière en cours", async ({ page }) => {
  await openStoredCareer(page, amateurSnapshot({ money: 777 }));
  await page.locator('[data-career-nav="fighter"]').click();
  const original = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  const invalid = JSON.parse(JSON.stringify(original));
  invalid.state.rosterState.weightClass = "M75";
  invalid.state.money = 1;
  await page.locator("#import-career-file").setInputFiles({ name: "invalid-roster.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(invalid)) });
  await expect(page.locator("#toast")).toContainText("Fichier de carrière invalide");
  const actual = await page.evaluate(() => JSON.parse(localStorage.getItem("boxeur-deux-career")));
  expect(actual.state).toEqual(original.state);
  expect(await page.evaluate(() => state.money)).toBe(777);
});

function federationSnapshot(sex = "male", weeks = 90) {
  const roster = require("../roster-engine.js");
  const fighterId = sex === "female" ? "f-beaulieu" : "leclerc";
  const weightClass = sex === "female" ? "W57" : "M65";
  let rosterState = roster.createState({ sex, weightClass, seed: "federation-browser" });
  for (let week = 1; week <= weeks; week += 1) {
    if (week === weeks) {
      rosterState = roster.reserveFighter(rosterState, { fighterId, bookingId: "federation-player", fightWeek: week }).state;
      rosterState = roster.recordPlayerFight(rosterState, { bookingId: "federation-player", matchId: "federation-player", week, playerResult: "win", method: "decision" }).state;
    }
    rosterState = roster.advanceWeek(rosterState, { week, completed: true, careerStatus: "amateur" }).state;
  }
  return amateurSnapshot({ week: weeks + 1, money: 2400, gymWeeks: 10,
    profile: { firstName: "Alex", lastName: "Fédération", sex, weightClass, portraitId: 1, style: "balanced", corner: "blue" },
    amateurRecord: { wins: 2, losses: 1, draws: 1 }, rosterState,
    medals: { bronze: { gold: 1 }, "regional-cup": { silver: 2 } } });
}

for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
  test(`BE-D Fédération : consultation, résultats et navigation à ${viewport.width} px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const snapshot = federationSnapshot();
    await openStoredCareer(page, snapshot);
    await page.locator('[data-career-district="downtown"]').click();
    const before = await page.evaluate(() => ({ storage: { ...localStorage }, state: JSON.stringify(state), capsule: JSON.stringify(careerCapsule) }));
    const hotspot = page.locator('[data-career-downtown-location="federation"]');
    await hotspot.click();
    const place = page.locator(".career-federation-view");
    await expect(place).toBeVisible();
    await expect(place.locator("h2")).toBeFocused();
    await expect(page.locator(".career-world-layout")).toHaveJSProperty("inert", true);
    await page.screenshot({ path: `/tmp/boxeur-federation-home-${viewport.width}.png` });
    await place.getByRole("button", { name: "Site de la Fédération", exact: true }).click();
    await expect(place.locator("[data-federation-affiliate]")).toHaveCount(10);
    const last = place.locator("[data-federation-affiliate] [data-federation-fighter]").last();
    await last.scrollIntoViewIfNeeded();
    const lastId = await last.getAttribute("data-federation-fighter");
    const directoryScroll = await place.evaluate(element => element.scrollTop);
    expect(directoryScroll).toBeGreaterThan(0);
    await last.click();
    await place.getByRole("button", { name: "Retour à l’annuaire", exact: true }).click();
    await expect(place.locator(`[data-federation-fighter="${lastId}"]`)).toBeFocused();
    expect(await place.evaluate(element => element.scrollTop)).toBeCloseTo(directoryScroll, 0);
    await place.locator('[data-federation-fighter="leclerc"]').click();
    await expect(place).toContainText("Bilan avant le suivi");
    await expect(place.locator('[data-federation-match="player:federation-player"]')).toContainText("Défaite");
    await expect(place.locator('[data-federation-match="player:federation-player"]')).toContainText("Alex Fédération (toi)");
    await page.screenshot({ path: `/tmp/boxeur-federation-profile-${viewport.width}.png` });
    await expect(place.locator('[data-federation-page="10"]')).toBeEnabled();
    await place.locator('[data-federation-page="10"]').click();
    await expect(place).toContainText("Page 2 sur");
    await place.getByRole("button", { name: "Plus récents", exact: true }).click();
    await place.locator('[data-federation-match="player:federation-player"] [data-federation-fighter="player"]').click();
    await expect(place).toHaveAttribute("data-federation-current-view", "dossier");
    await expect(place).toContainText("2 V · 1 D · 1 N");
    await expect(place).toContainText("Coupe régionale des clubs");
    await expect(place.locator('[data-federation-match="player:federation-player"]')).toContainText("Victoire");
    // The same background match opens the opponent's inverse perspective.
    const match = [...snapshot.state.rosterState.matches].reverse().find(item => item.source === "simulation");
    await place.locator('.federation-nav [data-federation-view="directory"]').click();
    await place.locator(`[data-federation-fighter="${match.fighterIds[0]}"]`).click();
    const row = place.locator(`[data-federation-match="${match.id}"]`);
    const result = await row.locator(".federation-result").textContent();
    await row.locator(`[data-federation-fighter="${match.fighterIds[1]}"]`).click();
    await expect(place.locator(`[data-federation-match="${match.id}"] .federation-result`)).toHaveText(result === "Victoire" ? "Défaite" : "Victoire");
    await place.locator('.federation-nav [data-federation-view="tournaments"]').click();
    await expect(place.locator("[data-federation-tournament]")).toHaveCount(6);
    await expect(place.locator('[data-federation-tournament="bronze"]')).toContainText("Édition terminée");
    const overflow = await place.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth, page: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.width + 1);
    expect(overflow.page).toBeLessThanOrEqual(overflow.viewport + 1);
    await page.keyboard.press("Escape");
    await expect(place).toBeHidden();
    await expect(hotspot).toBeFocused();
    const after = await page.evaluate(() => ({ storage: { ...localStorage }, state: JSON.stringify(state), capsule: JSON.stringify(careerCapsule) }));
    expect(after).toEqual(before);
    await hotspot.click();
    await place.locator("[data-career-open-calendar]").click();
    await expect(page.locator("#calendar-dialog")).toBeVisible();
    await expect(page.locator(".career-location-sheet")).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test("BE-D Fédération : affiliées sans passé inventé, accès verrouillé et bureau professionnel", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openStoredCareer(page, amateurSnapshot({ week: 30, profile: { firstName: "Jade", lastName: "Test", sex: "female", weightClass: "W57" }, amateurRecord: { wins: 0, losses: 1, draws: 0 } }));
  await page.locator('[data-career-district="downtown"]').click();
  await page.locator('[data-career-downtown-location="federation"]').click();
  const place = page.locator(".career-federation-view");
  await place.locator('.federation-nav [data-federation-view="directory"]').click();
  await expect(place.locator("[data-federation-affiliate]")).toHaveCount(10);
  await place.locator('[data-federation-fighter="f-beaulieu"]').click();
  await expect(place).toContainText("suivis depuis la semaine 30");
  await expect(place).toContainText("Aucune rencontre suivie pour le moment");
  await expect(place).toContainText("W57");
  expect(await place.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await place.locator("[data-career-leave-federation]").click();
  await expect(page.locator('[data-career-downtown-location="federation"]')).toBeFocused();
  await openStoredCareer(page, amateurSnapshot());
  await page.evaluate(() => openCareerLocation("federation"));
  await expect(place).toHaveCount(0);
  await expect(page.locator("#toast")).toContainText("premier combat amateur officiel");
  await openStoredCareer(page, amateurSnapshot({ careerStatus: "professional" }));
  await page.locator('[data-career-district="downtown"]').click();
  await page.locator('[data-career-downtown-location="federation"]').click();
  await expect(place).toContainText("contrats ne sont pas encore disponibles");
  await expect(place.locator("[data-career-open-calendar], [data-federation-view], [data-federation-fighter]")).toHaveCount(0);
});

for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
  for (const profile of [
    { label: "debutant", mode: "single", policy: "novice", fightEvery: 8, jobId: "courier", stats: 43, money: 220 },
    { label: "regulier", mode: "quick", policy: "coached", fightEvery: 4, jobId: "convenience", stats: 43, money: 220 },
    { label: "avance-migre", mode: "quick", policy: "coached", fightEvery: 4, jobId: "convenience", stats: 70, money: 1000 },
  ]) {
    test(`BE-E carrière longue ${profile.label} à ${viewport.width} px`, async ({ page }) => {
      test.setTimeout(180_000);
      page.setDefaultTimeout(10_000);
      await page.setViewportSize(viewport);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const weeks = Number(process.env.BE_E_WEEKS) || 104;
      const calendar = require("../career-calendar.js");
      await openStoredCareer(page, amateurSnapshot({
        profile: { firstName: "Alex", lastName: "Validation", sex: "male", weightClass: "M65", style: "balanced", portraitId: 1, corner: "blue" },
        combatStats: { technique: profile.stats, power: profile.stats, cardio: profile.stats, defense: profile.stats },
        energy: 85, fatigue: 5, money: profile.money, jobId: profile.jobId, jobsHeldCount: 1,
        calendar: calendar.generateCalendar({ epoch: "2026-11-16", seed: "BE-E-calendar", weeks: 16 }),
        amateurRecord: { wins: profile.stats > 43 ? 12 : 0, losses: profile.stats > 43 ? 4 : 0, draws: 0 },
      }));
      await page.addScriptTag({ path: path.join(PROJECT_ROOT, "tests/fixtures/roster-campaign.js") });
      const result = await page.evaluate(config => BERosterCampaign.run(config), { ...profile, weeks });
      await fs.writeFile(`/tmp/boxeur-be-e-${profile.label}-${viewport.width}.json`, JSON.stringify(result, null, 2));
      expect(result.weeks).toHaveLength(weeks);
      expect(result.fights.length).toBeGreaterThan(0);
      expect(result.weeks.every(week => week.jobId === profile.jobId && !week.missedWorkWeeks && week.money >= 0)).toBe(true);
      expect(result.finalRoster.reservations).toHaveLength(0);
      expect(result.finalRoster.lastProcessedWeek).toBe(weeks);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator("#resume-load").click();
      expect(await page.evaluate(() => state.rosterState)).toEqual(result.finalRoster);
      await page.locator('[data-career-district="downtown"]').click();
      await page.locator('[data-career-downtown-location="federation"]').click();
      await page.getByRole("button", { name: "Site de la Fédération", exact: true }).click();
      await expect(page.locator("[data-federation-affiliate]")).toHaveCount(10);
      const fighterId = result.fights.at(-1).opponent;
      await page.locator(`[data-federation-affiliate="${fighterId}"] [data-federation-fighter]`).click();
      await expect(page.locator(".career-federation-view")).toContainText("Bilan avant le suivi");
      const fit = await page.locator(".career-federation-view").evaluate(element => element.scrollWidth <= element.clientWidth + 1);
      expect(fit).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

test("BE-E longue sauvegarde féminine : archives et mesures Chromium avec CPU ralenti", async ({ page }) => {
  test.setTimeout(90_000);
  page.setDefaultTimeout(10_000);
  const roster = require("../roster-engine.js");
  let rosterState = roster.createState({ sex: "female", weightClass: "W57", seed: "BE-E-performance" });
  for (let week = 1; week <= 1500; week += 1) rosterState = roster.advanceWeek(rosterState, { week, careerStatus: "amateur", completed: true }).state;
  await page.setViewportSize({ width: 390, height: 844 });
  await openStoredCareer(page, amateurSnapshot({ week: 1501, gymWeeks: 4, rosterState,
    profile: { firstName: "Jade", lastName: "Archives", sex: "female", weightClass: "W57", style: "balanced", portraitId: 1, corner: "blue" },
    amateurRecord: { wins: 1, losses: 0, draws: 0 } }));
  const cdp = await page.context().newCDPSession(page);
  const measurements = [];
  try {
    for (const rate of [1, 4]) {
      await cdp.send("Emulation.setCPUThrottlingRate", { rate });
      const measured = await page.evaluate(() => {
        const input = JSON.stringify(state.rosterState);
        const saved = localStorage.getItem("boxeur-deux-career");
        const storageProbe = JSON.parse(saved);
        const percentile = values => {
          const sorted = [...values].sort((a, b) => a - b);
          return { medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)] };
        };
        const weekTimes = [], directoryTimes = [], profileTimes = [], writeTimes = [];
        for (let i = 0; i < 25; i += 1) {
          let start = performance.now();
          const projected = BoxeurRoster.advanceWeek(state.rosterState, { week: state.week, careerStatus: "amateur", completed: true });
          weekTimes.push(performance.now() - start);
          if (projected.state.lastProcessedWeek !== state.week) throw new Error("Clôture de mesure invalide");
          start = performance.now();
          BoxeurFederationView.render(BoxeurFederationView.buildContext(state, { view: "directory" }));
          directoryTimes.push(performance.now() - start);
          start = performance.now();
          BoxeurFederationView.render(BoxeurFederationView.buildContext(state, { view: "fighter", fighterId: "f-beaulieu" }));
          profileTimes.push(performance.now() - start);
          start = performance.now();
          storageProbe.savedAt = new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString();
          localStorage.setItem("boxeur-deux-career", JSON.stringify(storageProbe));
          writeTimes.push(performance.now() - start);
        }
        localStorage.setItem("boxeur-deux-career", saved);
        if (JSON.stringify(state.rosterState) !== input) throw new Error("Le benchmark a modifié le bassin");
        return { week: percentile(weekTimes), directory: percentile(directoryTimes), profile: percentile(profileTimes),
          serializeAndWriteSave: percentile(writeTimes), rosterBytesUTF8: new TextEncoder().encode(input).length,
          saveBytesUTF8: new TextEncoder().encode(saved).length,
          calendarBytesUTF8: new TextEncoder().encode(JSON.stringify(state.calendar)).length,
          storage: Object.keys(localStorage).map(key => ({ key, characters: localStorage.getItem(key).length, bytesUTF8: new TextEncoder().encode(localStorage.getItem(key)).length })),
          retained: state.rosterState.matches.length, archived: state.rosterState.archives.count };
      });
      measurements.push({ cpuSlowdown: rate, ...measured });
    }
  } finally {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await cdp.detach();
  }
  // Diagnostic headroom only: temporary ASCII probe, always removed.
  // No additional permanent copy of the career is created.
  const storageHeadroom = await page.evaluate(() => {
    let additionalAsciiCharacters = 0;
    let quotaEncountered = false;
    try {
      for (let size = 100_000; size <= 2_000_000; size += 100_000) {
        try { localStorage.setItem("boxeur-be-e-headroom", "x".repeat(size)); additionalAsciiCharacters = size; }
        catch (error) { if (error.name !== "QuotaExceededError") throw error; quotaEncountered = true; break; }
      }
    } finally { localStorage.removeItem("boxeur-be-e-headroom"); }
    return { additionalAsciiCharacters, quotaEncountered, resolutionCharacters: 100_000 };
  });
  measurements.forEach(item => { item.storageHeadroom = storageHeadroom; });
  await fs.writeFile("/tmp/boxeur-be-e-performance.json", JSON.stringify(measurements, null, 2));
  expect(measurements[0].retained).toBe(1000);
  expect(measurements[0].archived).toBeGreaterThan(0);
  expect(measurements[0].rosterBytesUTF8).toBeLessThan(250_000);
  await page.locator('[data-career-district="downtown"]').click();
  await page.locator('[data-career-downtown-location="federation"]').click();
  await page.getByRole("button", { name: "Site de la Fédération", exact: true }).click();
  await page.locator('[data-federation-fighter="f-beaulieu"]').click();
  const archives = page.locator(".federation-archives");
  await expect(archives).toBeVisible();
  await archives.locator("summary").click();
  await expect(archives).toContainText("semaines");
  await expect(page.locator("[data-federation-match]")).toHaveCount(10);
  expect(await page.locator(".career-federation-view").evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});

for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
  test(`BE-E parcours visuel annuaire → réservation → ring → résultat à ${viewport.width} px`, async ({ page }) => {
    test.setTimeout(90_000);
    page.setDefaultTimeout(10_000);
    await page.setViewportSize(viewport);
    await openStoredCareer(page, amateurSnapshot({ jobId: "convenience", gymWeeks: 8, money: 600,
      amateurRecord: { wins: 1, losses: 0, draws: 0 } }));
    await page.locator('[data-career-district="downtown"]').click();
    await page.locator('[data-career-downtown-location="federation"]').click();
    await page.getByRole("button", { name: "Ouvrir le calendrier", exact: true }).click();
    const choice = page.locator("#calendar-events [data-book-gala]").first();
    const fighterId = await choice.getAttribute("data-roster-fighter");
    await choice.click();
    const reserved = await page.evaluate(() => JSON.parse(JSON.stringify(state.scheduledFight)));
    await page.locator('#calendar-dialog [data-career-nav="map"]').click();
    await page.locator('[data-career-district="downtown"]').click();
    await page.locator('[data-career-downtown-location="federation"]').click();
    await page.getByRole("button", { name: "Site de la Fédération", exact: true }).click();
    await page.locator(`[data-federation-fighter="${fighterId}"]`).click();
    await expect(page.locator(".career-federation-view")).toContainText("Prépare un combat contre toi");
    await expect(page.locator(".career-federation-view")).toContainText(reserved.opponent.name);
    await page.locator("[data-career-leave-federation]").click();
    await page.locator('[data-career-district="neighborhood"]').click();
    await page.locator('[data-career-location="arena"]').click();
    await startTacticalFight(page);
    expect(await page.evaluate(() => fightState.fighters.opponent.stats)).toEqual(reserved.opponent.stats);
    await completeFight(page);
    const won = await page.evaluate(() => fightState.result.winner === "player");
    await page.locator("#fight-instruction button.primary-button").click();
    if (await page.locator("#level-up-dialog").isVisible()) await page.locator("#level-up-later").click();
    await page.locator('[data-career-district="downtown"]').click();
    await page.locator('[data-career-downtown-location="federation"]').click();
    await page.getByRole("button", { name: "Site de la Fédération", exact: true }).click();
    await page.locator(`[data-federation-fighter="${fighterId}"]`).click();
    await expect(page.locator(".career-federation-view")).not.toContainText("Prépare un combat contre toi");
    const matchId = `player:${reserved.bookingId}`;
    await expect(page.locator(`[data-federation-match="${matchId}"]`)).toContainText(won ? "Défaite" : "Victoire");
    await page.locator(`[data-federation-match="${matchId}"] [data-federation-fighter="player"]`).click();
    await expect(page.locator(`[data-federation-match="${matchId}"]`)).toContainText(won ? "Victoire" : "Défaite");
    expect(await page.evaluate(() => BoxeurRosterCareer.validateCareer(state))).toBe(true);
  });
}
