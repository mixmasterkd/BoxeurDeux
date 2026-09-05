"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const planner = require("../week-planner-engine.js");

function work(overrides = {}) {
  return {
    id: "courier",
    title: "Coursier",
    active: true,
    weeklyPay: 250,
    capacityCost: 1,
    energyCost: 5,
    fatigueGain: 4,
    shifts: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    ...overrides,
  };
}

function fresh(overrides = {}) {
  return planner.createPlanner({
    weekKey: "week-4",
    careerStatus: "amateur",
    capacity: 10,
    condition: { energy: 90, fatigue: 10 },
    work: work(),
    supplements: {
      inventory: { "sports-drink": 2, "protein-shake": 1, preworkout: 1 },
      weeklyLimit: 2,
    },
    ...overrides,
  });
}

function boxing(id, overrides = {}) {
  return {
    id,
    label: `Boxe ${id}`,
    category: "boxing",
    location: "boxing-gym",
    physical: true,
    capacityCost: 1,
    energyCost: 12,
    fatigueDelta: 8,
    ...overrides,
  };
}

function strength(id, overrides = {}) {
  return {
    id,
    label: `Musculation ${id}`,
    category: "strength",
    location: "strength-gym",
    physical: true,
    capacityCost: 1,
    energyCost: 14,
    fatigueDelta: 10,
    ...overrides,
  };
}

test("expose un noyau UMD/CommonJS et des vocabulaires immuables", () => {
  assert.equal(globalThis.BoxeurWeekPlanner, planner);
  assert.equal(planner.SCHEMA_VERSION, 2);
  assert.equal(planner.STATE_KIND, "boxeur-week-planner");
  assert.equal(planner.DEFAULT_WEEKLY_CAPACITY, 10);
  assert.equal(planner.DAYS.length, 7);
  assert.ok(planner.ACTIVITY_CATEGORIES.includes("group-class"));
  assert.ok(planner.LOCATIONS.includes("strength-gym"));
  assert.ok(planner.LOCATIONS.includes("leisure-center"));
  assert.ok(planner.LOCATIONS.includes("media-studio"));
  assert.equal(planner.DEFAULT_FAMILY_LIMITS.leisure, 1);
  assert.equal(planner.DEFAULT_FAMILY_LIMITS.media, 1);
  assert.equal(Object.isFrozen(planner.DAYS), true);
  assert.equal(Object.isFrozen(planner.DAYS[0]), true);
  assert.throws(() => { planner.DAYS[0].label = "X"; }, TypeError);
});

test("pré-réserve le travail, sa capacité et son salaire sans muter la configuration", () => {
  const config = {
    weekKey: "semaine-1",
    careerStatus: "recreational",
    capacity: 8,
    condition: { energy: 80, fatigue: 5 },
    work: work({
      weeklyPay: 180,
      capacityCost: 2,
      shifts: ["lundi", { day: "mercredi", pay: 110 }],
    }),
  };
  const before = structuredClone(config);
  const state = planner.createPlanner(config);
  const preview = planner.previewPlan(state);

  assert.deepEqual(config, before);
  assert.equal(state.entries.length, 2);
  assert.equal(state.entries.every(entry => entry.preReserved && entry.source === "work"), true);
  assert.deepEqual(state.entries.map(entry => entry.day), ["monday", "wednesday"]);
  assert.equal(preview.capacity.workReserved, 4);
  assert.equal(preview.capacity.remaining, 4);
  assert.equal(preview.totals.pay, 200, "un montant explicite remplace seulement la part de ce quart");
});

test("refuse dès la création un horaire de travail qui dépasse la capacité", () => {
  assert.throws(
    () => fresh({ capacity: 4 }),
    error => error.code === "WORK_EXCEEDS_CAPACITY" && error.details.workCapacity === 5,
  );
  assert.throws(
    () => fresh({
      work: work({
        shifts: [{
          day: "monday",
          activity: boxing("travail-déguisé"),
        }],
      }),
    }),
    error => error.code === "INVALID_WORK_ACTIVITY",
  );
});

test("place automatiquement une seule activité physique par jour sans que le travail bloque le soir", () => {
  const initial = fresh();
  const monday = planner.addActivity(initial, boxing("mitts"), { preferredDay: "monday" });
  const tuesday = planner.addActivity(monday.state, strength("legs"), { preferredDay: "monday" });
  const wednesday = planner.addActivity(tuesday.state, strength("back"), { preferredDay: "lundi" });

  assert.equal(monday.result.entry.day, "monday");
  assert.equal(tuesday.result.entry.day, "tuesday");
  assert.equal(wednesday.result.entry.day, "wednesday");
  assert.equal(wednesday.preview.perDay[0].entries.some(entry => entry.source === "work"), true);
  assert.equal(wednesday.preview.perDay[0].physicalEntryId, monday.result.entry.id);
  assert.throws(
    () => planner.addActivity(wednesday.state, boxing("strict"), { day: "monday", strictDay: true }),
    error => error.code === "DAILY_PHYSICAL_LIMIT",
  );
});

test("réserve la capacité à l'ajout et laisse le brouillon intact lorsqu'elle est épuisée", () => {
  const initial = fresh({ capacity: 7 });
  const before = structuredClone(initial);
  const full = planner.addActivity(initial, boxing("long", { capacityCost: 2 }));

  assert.deepEqual(initial, before);
  assert.equal(full.preview.capacity.used, 7);
  assert.equal(full.preview.capacity.remaining, 0);
  assert.throws(
    () => planner.addActivity(full.state, boxing("too-much")),
    error => error.code === "WEEKLY_CAPACITY_EXCEEDED",
  );
  assert.equal(full.state.entries.length, 6);
});

test("l'édition rembourse le coût retiré et replace automatiquement une activité", () => {
  let state = fresh();
  const first = planner.addActivity(state, boxing("first", { capacityCost: 3 }), { day: "monday" });
  const second = planner.addActivity(first.state, boxing("second"), { day: "tuesday" });
  const edited = planner.editActivity(first.state, first.result.entry.id, {
    capacityCost: 1,
    energyCost: 7,
    day: "tuesday",
  });

  assert.equal(edited.result.capacityRefunded, 2);
  assert.equal(edited.result.entry.day, "tuesday");
  assert.equal(edited.preview.capacity.remaining, 4);

  const movedAroundConflict = planner.editActivity(second.state, first.result.entry.id, { day: "tuesday" });
  assert.equal(movedAroundConflict.result.entry.day, "wednesday");
  assert.throws(
    () => planner.editActivity(second.state, first.result.entry.id, { day: "tuesday", strictDay: true }),
    error => error.code === "DAILY_PHYSICAL_LIMIT",
  );
});

test("le retrait rembourse capacité et réservation, y compris un quart non verrouillé", () => {
  const added = planner.addActivity(fresh(), boxing("bag"));
  const reserved = planner.reserveSupplement(added.state, added.result.entry.id, "sports-drink");
  const removed = planner.removeActivity(reserved.state, added.result.entry.id);

  assert.equal(removed.result.capacityRefunded, 1);
  assert.equal(removed.result.supplementRefunded, "sports-drink");
  assert.equal(removed.preview.supplements.inventoryAvailable["sports-drink"], 2);

  const workEntry = removed.state.entries.find(entry => entry.source === "work");
  const missedShift = planner.removeActivity(removed.state, workEntry.id);
  assert.equal(missedShift.result.capacityRefunded, 1);
  assert.equal(missedShift.preview.capacity.workReserved, 4);
});

test("une réservation de travail explicitement verrouillée ne peut être modifiée", () => {
  const state = fresh({ work: work({ shifts: [{ day: "monday", locked: true }] }) });
  const entry = state.entries[0];
  assert.throws(() => planner.removeActivity(state, entry.id), error => error.code === "PLAN_ENTRY_LOCKED");
  assert.throws(() => planner.editActivity(state, entry.id, { day: "tuesday" }), error => error.code === "PLAN_ENTRY_LOCKED");
});

test("un plan rapide remplace seulement le contenu libre et demeure entièrement éditable", () => {
  const manual = planner.addActivity(fresh(), boxing("manual"));
  const quick = planner.applyQuickPlan(manual.state, [
    { activity: boxing("coach"), day: "tuesday" },
    { activity: strength("balanced"), preferredDay: "thursday" },
    {
      activity: {
        id: "rest",
        label: "Repos actif",
        category: "recovery",
        location: "home",
        capacityCost: 1,
        energyGain: 10,
        fatigueDelta: -4,
      },
      day: "sunday",
    },
  ]);

  assert.equal(quick.state.mode, "quick");
  assert.equal(quick.result.editable, true);
  assert.ok(quick.result.removedEntryIds.includes(manual.result.entry.id));
  assert.equal(quick.state.entries.filter(entry => entry.preReserved).length, 5);
  assert.deepEqual(quick.state.entries.filter(entry => entry.source === "quick").map(entry => entry.day), [
    "tuesday", "thursday", "sunday",
  ]);

  const quickEntry = quick.state.entries.find(entry => entry.source === "quick" && entry.physical);
  const edited = planner.editActivity(quick.state, quickEntry.id, { day: "friday", energyCost: 5 });
  assert.equal(edited.result.entry.day, "friday");
  assert.equal(edited.result.entry.source, "quick");
});

test("l'application d'un plan rapide est atomique si une activité est invalide", () => {
  const initial = fresh();
  const before = structuredClone(initial);
  assert.throws(
    () => planner.applyQuickPlan(initial, [boxing("valid"), { id: "broken", category: "unknown" }]),
    error => error.code === "INVALID_ACTIVITY_CATEGORY",
  );
  assert.deepEqual(initial, before);
});

test("applique les limites récréatives tout en permettant les bases et l'exception pédagogique de Rémy", () => {
  let state = fresh({
    careerStatus: "recreational",
    capacity: 8,
    work: work({ shifts: ["monday"] }),
    limits: { recreationalPhysicalActivities: 2 },
  });
  const group = planner.addActivity(state, {
    id: "group-basics",
    label: "Cours de groupe",
    category: "group-class",
    location: "boxing-gym",
    energyCost: 8,
    fatigueDelta: 5,
  });
  assert.equal(group.result.entry.day, "monday");
  assert.throws(
    () => planner.addActivity(group.state, strength("locked")),
    error => error.code === "RECREATIONAL_ACTIVITY_LOCKED",
  );

  const remy = planner.addActivity(group.state, {
    id: "remy-sparring",
    label: "Sparring pédagogique avec Rémy « Le Tank »",
    category: "sparring",
    location: "boxing-gym",
    recreationalAllowed: true,
    energyCost: 10,
    fatigueDelta: 7,
  });
  assert.equal(remy.result.entry.day, "tuesday");
  assert.throws(
    () => planner.addActivity(remy.state, boxing("third")),
    error => error.code === "RECREATIONAL_PHYSICAL_LIMIT",
  );
});

test("préserve des catégories et lieux explicites et refuse les vocabulaires ambigus", () => {
  const activity = planner.normalizeActivity({
    id: "jog",
    label: "Jogging",
    category: "home",
    location: "outdoors",
    physical: true,
  });
  assert.equal(activity.category, "home");
  assert.equal(activity.location, "outdoors");
  assert.equal(activity.physical, true);
  assert.throws(
    () => planner.normalizeActivity({ id: "x", category: "cardio-secret" }),
    error => error.code === "INVALID_ACTIVITY_CATEGORY",
  );
  assert.throws(
    () => planner.normalizeActivity({ id: "x", category: "home", location: "mars" }),
    error => error.code === "INVALID_ACTIVITY_LOCATION",
  );
  assert.throws(
    () => planner.normalizeActivity({ id: "x", allowedCareerStatuses: ["élite"] }),
    error => error.code === "INVALID_CAREER_STATUS",
  );
});

test("limite les familles plutôt que les boutons et réduit seulement la répétition exacte", () => {
  let state = fresh({ work: null, capacity: 10 });
  const coach = boxing("coach", {
    metadata: { familyId: "boxing", programSignature: "boxing:coach-balanced" },
  });
  const first = planner.addActivity(state, coach, { day: "monday" });
  const repeated = planner.addActivity(first.state, coach, { day: "tuesday" });

  assert.equal(first.result.entry.metadata.gainMultiplier, 1);
  assert.equal(repeated.result.entry.metadata.gainMultiplier, .85);
  assert.equal(repeated.preview.families.boxing.used, 2);
  assert.equal(repeated.preview.families.boxing.remaining, 0);
  assert.throws(
    () => planner.addActivity(repeated.state, boxing("custom", {
      metadata: { familyId: "boxing", programSignature: "boxing:custom-different" },
    })),
    error => error.code === "WEEKLY_FAMILY_LIMIT",
  );

  const removed = planner.removeActivity(repeated.state, first.result.entry.id);
  const survivor = removed.state.entries.find(entry => entry.id === repeated.result.entry.id);
  assert.equal(survivor.metadata.gainMultiplier, 1, "la séance restante redevient la première de ce programme");
});

test("accepte une récupération à coût nul sans créer de capacité", () => {
  const initial = fresh({ work: null, capacity: 5 });
  const rest = planner.addActivity(initial, {
    id: "rest",
    label: "Journée de repos",
    category: "recovery",
    location: "home",
    capacityCost: 0,
    energyGain: 10,
    fatigueDelta: -5,
  });
  assert.equal(rest.result.capacityReserved, 0);
  assert.equal(rest.preview.capacity.used, 0);
  assert.equal(rest.preview.capacity.remaining, 5);
});

test("migre un brouillon de schéma 1 en conservant ses choix", () => {
  const added = planner.addActivity(fresh({ work: null }), boxing("legacy"));
  const legacy = structuredClone(added.state);
  legacy.schemaVersion = 1;
  delete legacy.limits.family;
  delete legacy.entries[0].metadata.familyId;
  delete legacy.entries[0].metadata.programSignature;
  delete legacy.entries[0].metadata.repeatIndex;
  delete legacy.entries[0].metadata.gainMultiplier;

  const restored = planner.restorePlanner(legacy);
  assert.equal(restored.schemaVersion, 2);
  assert.equal(restored.entries.length, 1);
  assert.equal(restored.entries[0].metadata.familyId, "boxing");
  assert.equal(restored.entries[0].metadata.gainMultiplier, 1);
});

test("réserve les suppléments sur des séances physiques avec stock, unicité et plafond hebdomadaire", () => {
  const first = planner.addActivity(fresh(), boxing("a"));
  const second = planner.addActivity(first.state, boxing("b"));
  const third = planner.addActivity(second.state, strength("c"));
  const one = planner.reserveSupplement(third.state, first.result.entry.id, "sports-drink");
  const duplicate = planner.reserveSupplement(one.state, first.result.entry.id, "sports-drink");
  const two = planner.reserveSupplement(one.state, second.result.entry.id, "protein-shake");

  assert.equal(duplicate.result.duplicate, true);
  assert.equal(duplicate.state.revision, one.state.revision);
  assert.equal(two.preview.supplements.reserved, 2);
  assert.equal(two.preview.supplements.remainingUses, 0);
  assert.equal(two.preview.supplements.inventoryAvailable["sports-drink"], 1);
  assert.throws(
    () => planner.reserveSupplement(two.state, third.result.entry.id, "preworkout"),
    error => error.code === "WEEKLY_SUPPLEMENT_LIMIT",
  );
  assert.throws(
    () => planner.reserveSupplement(one.state, second.result.entry.id, "sports-drink"),
    error => error.code === "SUPPLEMENT_ALREADY_RESERVED",
  );
});

test("remplacer ou annuler un supplément rembourse immédiatement l'ancienne réservation", () => {
  const added = planner.addActivity(fresh(), boxing("session"));
  const drink = planner.reserveSupplement(added.state, added.result.entry.id, "sports-drink");
  const shake = planner.reserveSupplement(drink.state, added.result.entry.id, "protein-shake");

  assert.equal(shake.result.supplementRefunded, "sports-drink");
  assert.equal(shake.preview.supplements.inventoryAvailable["sports-drink"], 2);
  assert.equal(shake.preview.supplements.inventoryAvailable["protein-shake"], 0);

  const cancelled = planner.unreserveSupplement(shake.state, added.result.entry.id);
  assert.equal(cancelled.result.productId, "protein-shake");
  assert.equal(cancelled.preview.supplements.reserved, 0);
  assert.equal(cancelled.preview.supplements.inventoryAvailable["protein-shake"], 1);
});

test("bloque les suppléments au statut récréatif et sur une activité non physique", () => {
  const recreational = fresh({
    careerStatus: "recreational",
    work: null,
    capacity: 5,
    supplements: { inventory: { "sports-drink": 1 }, weeklyLimit: 2 },
  });
  const group = planner.addActivity(recreational, {
    id: "group",
    category: "group-class",
    location: "boxing-gym",
  });
  assert.equal(
    planner.canReserveSupplement(group.state, group.result.entry.id, "sports-drink").code,
    "SUPPLEMENTS_LOCKED",
  );

  const amateur = fresh({ work: null });
  const rest = planner.addActivity(amateur, {
    id: "rest",
    category: "recovery",
    location: "home",
    energyGain: 10,
  });
  assert.equal(
    planner.canReserveSupplement(rest.state, rest.result.entry.id, "sports-drink").code,
    "SUPPLEMENT_REQUIRES_PHYSICAL_ACTIVITY",
  );
});

test("l'aperçu expose capacité, réserve d'énergie, zone de fatigue et journées lisibles", () => {
  const initial = fresh({
    work: null,
    capacity: 4,
    condition: { energy: 55, fatigue: 30 },
  });
  const hard = planner.addActivity(initial, boxing("hard", {
    capacityCost: 3,
    energyCost: 45,
    fatigueDelta: 48,
  }), { day: "friday" });
  const preview = hard.preview;

  assert.deepEqual(preview.capacity, {
    total: 4,
    used: 3,
    remaining: 1,
    workReserved: 0,
    unavailable: 0,
    restPlanned: false,
    discretionaryReserved: 3,
  });
  assert.deepEqual(preview.condition.projected, { energy: 10, fatigue: 78 });
  assert.equal(preview.condition.energyReserve.id, "critical");
  assert.equal(preview.condition.fatigueZone.id, "critical");
  assert.equal(preview.perDay[4].physicalEntryId, hard.result.entry.id);
  assert.ok(preview.warnings.some(message => /capacité/i.test(message)));
  assert.ok(preview.warnings.some(message => /critique/i.test(message)));
});

test("fait du repos un choix normal qui concurrence directement les autres activités", () => {
  const initial = fresh({
    work: null,
    capacity: { total: 20, unavailable: 3 },
  });
  const preview = planner.previewPlan(initial);
  assert.equal(preview.capacity.total, 20);
  assert.equal(preview.capacity.unavailable, 3);
  assert.equal(preview.capacity.used, 3);
  assert.equal(preview.capacity.remaining, 17);

  const training = planner.addActivity(initial, boxing("reserve-limit", { capacityCost: 7 }));
  assert.equal(training.preview.capacity.remaining, 10);
  const rest = planner.addActivity(training.state, {
    id: "rest",
    label: "Journée de repos",
    category: "recovery",
    location: "home",
    capacityCost: 10,
  });
  assert.equal(rest.preview.capacity.remaining, 0);
  assert.equal(rest.preview.capacity.restPlanned, true);

  const filled = planner.addActivity(initial, {
    id: "extra-work",
    label: "Activité supplémentaire",
    category: "leisure",
    location: "other",
    capacityCost: 15,
  });
  assert.throws(
    () => planner.addActivity(filled.state, {
      id: "rest",
      label: "Journée de repos",
      category: "recovery",
      location: "home",
      capacityCost: 10,
    }),
    error => error.code === "WEEKLY_CAPACITY_EXCEEDED",
  );
});

test("limite aussi une famille non physique à une seule sortie par semaine", () => {
  const initial = fresh({ work: null, capacity: 20 });
  const first = planner.addActivity(initial, {
    id: "leisure:cinema",
    label: "Sortie · Cinéma",
    category: "leisure",
    location: "leisure-center",
    physical: false,
    capacityCost: 5,
    energyGain: 4,
    fatigueDelta: -5,
    metadata: { familyId: "leisure", moneyCost: 25 },
  });

  assert.equal(first.preview.families.leisure.used, 1);
  assert.throws(() => planner.addActivity(first.state, {
    id: "leisure:bowling",
    label: "Sortie · Quilles",
    category: "leisure",
    location: "leisure-center",
    physical: false,
    capacityCost: 6,
    energyGain: 3,
    fatigueDelta: -4,
    metadata: { familyId: "leisure", moneyCost: 30 },
  }), error => error.code === "WEEKLY_FAMILY_LIMIT");

  const corrupted = structuredClone(first.state);
  corrupted.entries.push({
    ...structuredClone(first.result.entry),
    id: "duplicate-leisure",
    activityId: "leisure:bowling",
    label: "Sortie · Quilles",
  });
  const validation = planner.validatePlan(corrupted);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some(error => error.code === "WEEKLY_FAMILY_LIMIT"));
});

test("évalue les conséquences de récupération selon l’état réel et annule le risque si le repos est planifié", () => {
  assert.equal(planner.assessRecoveryRisk({ plannedRest: true, condition: { energy: 4, fatigue: 98 } }).kind, "none");

  const warning = planner.assessRecoveryRisk({ condition: { energy: 34, fatigue: 60 } });
  assert.equal(warning.kind, "warning");
  assert.equal(warning.capacityCost, 0);

  const forced = planner.assessRecoveryRisk({ condition: { energy: 20, fatigue: 79 } });
  assert.equal(forced.kind, "forced-rest");
  assert.equal(forced.capacityCost, 10);

  const hospital = planner.assessRecoveryRisk({ condition: { energy: 7, fatigue: 94 }, injury: 12 });
  assert.equal(hospital.kind, "hospital");
  assert.equal(hospital.capacityCost, 15);
  assert.equal(hospital.medicalCost, 75);
});

test("confirme en une transaction pure et idempotente avec un inventaire après commit", () => {
  const added = planner.addActivity(fresh(), boxing("fight-camp"));
  const reserved = planner.reserveSupplement(added.state, added.result.entry.id, "protein-shake");
  const before = structuredClone(reserved.state);
  const confirmed = planner.confirmPlan(reserved.state, {
    transactionId: "week-4-confirmation",
    expectedRevision: reserved.state.revision,
  });

  assert.deepEqual(reserved.state, before);
  assert.equal(confirmed.state.status, "confirmed");
  assert.equal(confirmed.commit.kind, "boxeur-week-plan-commit");
  assert.equal(confirmed.commit.sourceRevision, reserved.state.revision);
  assert.equal(confirmed.commit.supplementInventoryBefore["protein-shake"], 1);
  assert.equal(confirmed.commit.supplementInventoryAfter["protein-shake"], 0);
  assert.equal(confirmed.commit.supplementUsesAfter, 1);
  assert.equal(confirmed.state.supplements.inventory["protein-shake"], 1, "seul le consommateur du commit débite la vraie sauvegarde");

  const duplicate = planner.confirmPlan(confirmed.state, { transactionId: "week-4-confirmation" });
  assert.equal(duplicate.result.duplicate, true);
  assert.deepEqual(duplicate.commit, confirmed.commit);
  assert.equal(duplicate.state.revision, confirmed.state.revision);
  assert.throws(
    () => planner.confirmPlan(confirmed.state, { transactionId: "autre-transaction" }),
    error => error.code === "PLAN_ALREADY_CONFIRMED",
  );
});

test("refuse une révision périmée et valide tout le plan avant de produire un commit", () => {
  const first = planner.addActivity(fresh({ work: null }), boxing("one"), { day: "monday" });
  assert.throws(
    () => planner.confirmPlan(first.state, { transactionId: "stale", expectedRevision: 0 }),
    error => error.code === "STALE_PLAN_REVISION" && error.details.actualRevision === 1,
  );

  const tampered = structuredClone(first.state);
  const duplicate = { ...structuredClone(tampered.entries[0]), id: "injected-entry" };
  tampered.entries.push(duplicate);
  const before = structuredClone(tampered);
  const validation = planner.validatePlan(tampered);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some(error => error.code === "DAILY_PHYSICAL_LIMIT"));
  assert.throws(
    () => planner.confirmPlan(tampered, { transactionId: "invalid" }),
    error => error.code === "PLAN_VALIDATION_FAILED",
  );
  assert.deepEqual(tampered, before);

  const forgedCapacity = structuredClone(first.state);
  forgedCapacity.entries[0].capacityCost = -100;
  const forgedValidation = planner.validatePlan(forgedCapacity);
  assert.equal(forgedValidation.ok, false);
  assert.ok(forgedValidation.errors.some(error => error.code === "INVALID_PLAN_ENTRY"));
  assert.throws(
    () => planner.confirmPlan(forgedCapacity, { transactionId: "forged" }),
    error => error.code === "PLAN_VALIDATION_FAILED",
  );
});

test("restaure un brouillon sérialisé sans perdre réservations ni possibilités d'édition", () => {
  const added = planner.addActivity(fresh(), boxing("persisted"));
  const reserved = planner.reserveSupplement(added.state, added.result.entry.id, "sports-drink");
  const restored = planner.restorePlanner(JSON.parse(JSON.stringify(reserved.state)));

  assert.deepEqual(restored, reserved.state);
  const removed = planner.removeActivity(restored, added.result.entry.id);
  assert.equal(removed.preview.supplements.reserved, 0);
  assert.equal(removed.preview.capacity.remaining, 5);
});
