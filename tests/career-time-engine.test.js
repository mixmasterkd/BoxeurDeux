"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const time = require("../career-time-engine.js");

function fixedRng(value = 0.5) {
  return () => value;
}

function assertAllPhysicalValuesAreBounded(state) {
  const values = [
    ...Object.values(state.condition),
    ...Object.values(state.stats),
    ...Object.values(state.stimulus),
  ];
  assert.ok(values.every(value => value >= 0 && value <= 100));
}

test("expose la même API en CommonJS et sur globalThis", () => {
  assert.equal(globalThis.BoxeurTime, time);
  assert.equal(time.SCHEMA_VERSION, 2);
  assert.equal(time.STAT_XP_VERSION, 1);
  assert.deepEqual([0, 1, 2, 3].map(time.statXpForRank), [40, 90, 150, 220]);
  assert.equal(time.PERIODS_PER_WEEK, 21);
  assert.deepEqual(time.DAYS, ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
  assert.deepEqual(time.PERIODS, ["morning", "afternoon", "evening"]);
  assert.equal(time.ACTIVITY_PRESETS.mitts.label, "Travail aux mitaines");
});

test("l'horloge parcourt lundi à dimanche puis ouvre une nouvelle semaine", () => {
  let state = time.createState({ seed: "clock", time: { week: 1, day: "lundi", period: "matin" } });
  assert.deepEqual(state.clock, {
    absoluteSlot: 0,
    week: 1,
    day: "monday",
    dayIndex: 0,
    dayLabel: "Lundi",
    period: "morning",
    periodIndex: 0,
    periodLabel: "Matin",
  });

  state = time.advanceTime(state, 20, fixedRng());
  assert.equal(state.clock.day, "sunday");
  assert.equal(state.clock.period, "evening");
  assert.equal(state.clock.week, 1);

  state = time.advanceTime(state, 1, fixedRng());
  assert.equal(state.clock.day, "monday");
  assert.equal(state.clock.period, "morning");
  assert.equal(state.clock.week, 2);
  assert.equal(state.history.filter(event => event.type === "night-recovery").length, 7);
});

test("normalise toutes les jauges et statistiques entre 0 et 100", () => {
  const state = time.createState({
    condition: { energy: 140, fatigue: -25 },
    stats: { technique: -5, power: 180, cardio: 55, defense: 200 },
    stimulus: { technique: 200, power: -1, cardio: 30, defense: 101 },
  });

  assert.deepEqual(state.condition, { energy: 100, fatigue: 0 });
  assert.deepEqual(state.stats, { technique: 0, power: 100, cardio: 55, defense: 100 });
  assert.deepEqual(state.stimulus, { technique: 100, power: 0, cardio: 30, defense: 100 });
  assertAllPhysicalValuesAreBounded(state);
});

test("refuse les rendez-vous qui se chevauchent, sont dans le passé ou réutilisent un id", () => {
  let state = time.createState({ absoluteSlot: 5 });
  state = time.scheduleAppointment(state, {
    id: "gym",
    title: "Gym de boxe",
    startSlot: 7,
    duration: 2,
  });

  assert.throws(
    () => time.scheduleAppointment(state, { id: "coach", title: "Coach", startSlot: 8, duration: 1 }),
    error => error.code === "APPOINTMENT_OVERLAP",
  );
  assert.throws(
    () => time.scheduleAppointment(state, { id: "old", startSlot: 4 }),
    error => error.code === "APPOINTMENT_IN_PAST",
  );
  assert.throws(
    () => time.scheduleAppointment(state, { id: "gym", startSlot: 10 }),
    error => error.code === "DUPLICATE_APPOINTMENT",
  );
  assert.equal(time.canScheduleAppointment(state, { id: "free", startSlot: 10 }).ok, true);
});

test("les activités dépensent immédiatement de l'énergie, ajoutent de la fatigue et font avancer le temps", () => {
  const initial = time.createState({ condition: { energy: 60, fatigue: 10 } });
  const snapshot = JSON.stringify(initial);
  const next = time.performActivity(initial, "jump_rope");

  assert.equal(JSON.stringify(initial), snapshot, "la transition doit être pure");
  assert.equal(next.clock.absoluteSlot, 1);
  assert.deepEqual(next.condition, { energy: 50, fatigue: 16 });
  assert.equal(next.stimulus.cardio, 5);
  assert.equal(next.history.at(-1).type, "activity-completed");
  assert.equal(next.history.at(-1).activityCategory, "training");
  assert.deepEqual(next.history.at(-1).afterImmediate.condition, { energy: 50, fatigue: 16 });
});

test("une activité ne peut être ni gratuite, ni infinie, ni répétée au même instant", () => {
  const state = time.createState();
  assert.throws(
    () => time.performActivity(state, { id: "free-loop", duration: 0 }),
    error => error.code === "INVALID_ACTIVITY_DURATION",
  );
  assert.throws(
    () => time.performActivity(state, { id: "infinite-loop", duration: Infinity }),
    error => error.code === "INVALID_ACTIVITY_DURATION",
  );

  const once = time.performActivity(state, "recovery");
  const twice = time.performActivity(once, "recovery");
  assert.equal(once.clock.absoluteSlot, 1);
  assert.equal(twice.clock.absoluteSlot, 2);
  assert.ok(twice.condition.energy <= 100);
});

test("un rendez-vous bloque les activités et ne peut pas être sauté silencieusement", () => {
  let state = time.createState();
  state = time.scheduleAppointment(state, {
    id: "private-coach",
    title: "Séance privée",
    startSlot: 1,
    activity: "mitts",
  });

  assert.equal(time.canPerformActivity(state, { id: "long", duration: 2 }).code, "APPOINTMENT_BLOCKS_ACTIVITY");
  assert.throws(
    () => time.advanceTime(state, 2),
    error => error.code === "APPOINTMENT_BLOCKS_TIME",
  );

  state = time.advanceToNextAppointment(state, fixedRng());
  assert.equal(state.clock.absoluteSlot, 1);
  assert.throws(
    () => time.performActivity(state, "jump_rope"),
    error => error.code === "APPOINTMENT_BLOCKS_ACTIVITY",
  );

  state = time.attendAppointment(state, "private-coach", fixedRng());
  assert.equal(state.clock.absoluteSlot, 2);
  assert.equal(state.appointments.length, 0);
  assert.equal(state.completedAppointments[0].id, "private-coach");
  assert.equal(state.stimulus.technique, 6);
});

test("un rendez-vous avec activité ne peut être consommé par une autre activité de même durée", () => {
  let state = time.createState({
    condition: { energy: 100, fatigue: 0 },
  });
  state = time.scheduleAppointment(state, {
    id: "reserved-mitts",
    title: "Travail privé aux mitaines",
    startSlot: state.clock.absoluteSlot,
    activity: "mitts",
  });
  const before = structuredClone(state);

  const wrongIdentity = time.canPerformActivity(state, "jump_rope", { appointmentId: "reserved-mitts" });
  assert.equal(wrongIdentity.ok, false);
  assert.equal(wrongIdentity.code, "APPOINTMENT_ACTIVITY_MISMATCH");
  assert.equal(wrongIdentity.appointmentId, "reserved-mitts");
  assert.throws(
    () => time.performActivity(state, "jump_rope", { appointmentId: "reserved-mitts" }),
    error => error.code === "APPOINTMENT_ACTIVITY_MISMATCH",
  );

  const spoofedContent = {
    ...time.ACTIVITY_PRESETS.mitts,
    energyCost: time.ACTIVITY_PRESETS.mitts.energyCost - 10,
  };
  assert.equal(
    time.canPerformActivity(state, spoofedContent, { appointmentId: "reserved-mitts" }).code,
    "APPOINTMENT_ACTIVITY_MISMATCH",
    "réutiliser l'id réservé avec un contenu moins coûteux doit aussi être refusé",
  );
  assert.deepEqual(state, before, "les tentatives refusées ne doivent pas consommer le rendez-vous");

  const renamedForTranslation = {
    ...time.ACTIVITY_PRESETS.mitts,
    label: "Libellé modernisé aux mitaines",
    category: "libellé-interne-modernisé",
  };
  assert.equal(
    time.canPerformActivity(state, renamedForTranslation, { appointmentId: "reserved-mitts" }).ok,
    true,
    "un changement de libellé ne doit pas invalider une vieille sauvegarde si les effets sont identiques",
  );

  const attended = time.attendAppointment(state, "reserved-mitts", fixedRng());
  assert.equal(attended.appointments.length, 0);
  assert.equal(attended.completedAppointments[0].id, "reserved-mitts");
  assert.equal(attended.history.at(-1).activityId, "mitts");
});

test("la récupération nocturne restaure l'énergie, réduit la fatigue et assimile le stimulus", () => {
  let state = time.createState({
    time: { week: 1, day: "monday", period: "evening" },
    condition: { energy: 35, fatigue: 55 },
    stats: { technique: 40, power: 40, cardio: 40, defense: 40 },
    stimulus: { technique: 20, power: 10, cardio: 5, defense: 15 },
  });
  const before = JSON.parse(JSON.stringify(state));
  state = time.advanceTime(state, 1, fixedRng(0.5));

  assert.equal(state.clock.day, "tuesday");
  assert.equal(state.clock.period, "morning");
  assert.ok(state.condition.energy > before.condition.energy);
  assert.ok(state.condition.fatigue < before.condition.fatigue);
  for (const key of time.STAT_KEYS) {
    assert.ok(state.stimulus[key] < before.stimulus[key] || before.stimulus[key] === 0);
    assert.ok(state.stats[key] >= before.stats[key]);
    assert.ok(state.statXp[key] >= before.statXp[key]);
  }
  assert.ok(state.statXp.technique > before.statXp.technique);
  assert.equal(state.history[0].type, "night-recovery");
  assertAllPhysicalValuesAreBounded(state);
});

test("un modificateur de récupération ne touche que la nuit traversée par l'activité", () => {
  const evening = time.createState({
    time: { week: 1, day: "monday", period: "evening" },
    condition: { energy: 30, fatigue: 55 },
    stimulus: { technique: 12, power: 6, cardio: 4, defense: 8 },
  });
  const activity = {
    id: "supplement-test",
    duration: 1,
    energyCost: 5,
    fatigueGain: 4,
    stimulus: { technique: 1 },
  };
  const normal = time.performActivity(evening, activity, {}, fixedRng(.5));
  const supported = time.performActivity(evening, activity, { recoveryQuality: 1.03 }, fixedRng(.5));

  assert.ok(supported.condition.energy > normal.condition.energy);
  assert.ok(supported.condition.fatigue < normal.condition.fatigue);
  assert.equal(supported.history.find(event => event.type === "night-recovery").qualityModifier, 1.03);
  const nextNormalNight = time.advanceTime(normal, 3, fixedRng(.5));
  const nextSupportedNight = time.advanceTime(supported, 3, fixedRng(.5));
  assert.equal(nextNormalNight.history.filter(event => event.type === "night-recovery").at(-1).qualityModifier, 1);
  assert.equal(nextSupportedNight.history.filter(event => event.type === "night-recovery").at(-1).qualityModifier, 1);
});

test("dix séances ciblées gardent une progression proche du système historique", () => {
  let state = time.createState({
    seed: "parity-mitts",
    condition: { energy: 100, fatigue: 0 },
    stats: { technique: 40, power: 40, cardio: 40, defense: 40 },
  });
  for (let session = 0; session < 10; session += 1) {
    state = time.performActivity(state, "mitts", {}, fixedRng(0.5));
    state = time.advanceTime(state, 20, fixedRng(0.5));
  }
  const techniqueGain = state.stats.technique - 40;
  assert.ok(techniqueGain >= 0.9 && techniqueGain <= 1.15, `gain obtenu : ${techniqueGain}`);
  assert.ok(state.stats.power < 40.01, "une séance technique ne doit pas augmenter la puissance");
});

test("l’XP ciblée est entière, cumulative et conserve l’excédent au changement de statistique", () => {
  let state = time.createState({
    time: { week: 1, day: "monday", period: "evening" },
    stats: { technique: 40, power: 40, cardio: 40, defense: 40 },
    statXp: { technique: 39 },
    statXpRanks: { technique: 0 },
    stimulus: { technique: 6 },
  });

  state = time.advanceTime(state, 1, fixedRng(.5));

  assert.equal(state.stats.technique, 41);
  assert.equal(state.statXp.technique, 41);
  assert.equal(state.statXpRanks.technique, 1);
  assert.deepEqual(time.statXpProgress(state, "technique"), {
    total: 41,
    rank: 1,
    currentFloor: 40,
    nextThreshold: 90,
    remaining: 49,
    pendingXp: 4,
  });
});

test("la source aléatoire seedée et l'injection reproduisent exactement une récupération", () => {
  function runWithEmbeddedRng() {
    let state = time.createState({
      seed: "same-career",
      time: { week: 1, day: "monday", period: "evening" },
      condition: { energy: 30, fatigue: 45 },
      stimulus: { technique: 10 },
    });
    state = time.advanceTime(state, 1);
    return state;
  }

  assert.deepEqual(runWithEmbeddedRng(), runWithEmbeddedRng());
  const firstStream = time.createSeededRng("night-stream");
  const secondStream = time.createSeededRng("night-stream");
  assert.deepEqual(
    Array.from({ length: 6 }, () => firstStream()),
    Array.from({ length: 6 }, () => secondStream()),
  );

  const initial = time.createState({
    time: { week: 1, day: "monday", period: "evening" },
    condition: { energy: 20, fatigue: 60 },
  });
  const lowQuality = time.advanceTime(initial, 1, fixedRng(0));
  const highQuality = time.advanceTime(initial, 1, fixedRng(0.999));
  assert.ok(highQuality.condition.energy > lowQuality.condition.energy);
  assert.ok(highQuality.condition.fatigue < lowQuality.condition.fatigue);
});

test("la préparation est dérivée des jauges et non stockée comme un système de plus", () => {
  const ready = time.createState({ condition: { energy: 100, fatigue: 0 } });
  const tired = time.createState({
    condition: { energy: 12, fatigue: 92 },
    stimulus: { technique: 80, power: 80, cardio: 80, defense: 80 },
  });

  assert.equal("preparation" in ready, false);
  assert.equal(time.getPreparation(ready).status, "excellent");
  assert.equal(time.getPreparation(ready).label, "Excellente");
  assert.equal(time.getPreparation(tired).status, "critical");
  assert.ok(time.getPreparation(tired).reasons.includes("Énergie basse"));
  assert.equal(time.getPublicState(ready).preparation.score, 100);
});

test("les récurrences doivent être finies, plafonnées et sans auto-chevauchement", () => {
  const state = time.createState();
  assert.throws(
    () => time.scheduleRecurringAppointments(state, { id: "work", startSlot: 1 }, { every: 3, count: Infinity }),
    error => error.code === "INVALID_RECURRENCE",
  );
  assert.throws(
    () => time.scheduleRecurringAppointments(
      state,
      { id: "work", startSlot: 1 },
      { every: 3, count: time.MAX_RECURRENCES + 1 },
    ),
    error => error.code === "INVALID_RECURRENCE",
  );
  assert.throws(
    () => time.scheduleRecurringAppointments(
      state,
      { id: "overlap", startSlot: 1, duration: 2 },
      { every: 1, count: 2 },
    ),
    error => error.code === "APPOINTMENT_OVERLAP",
  );

  const scheduled = time.scheduleRecurringAppointments(
    state,
    { id: "work", title: "Travail", startSlot: 1, activity: "work_shift" },
    { every: 7, count: 3 },
  );
  assert.deepEqual(scheduled.appointments.map(item => item.id), ["work-1", "work-2", "work-3"]);
  assert.equal(state.appointments.length, 0, "l'échec ou le succès ne doit pas modifier l'état source");
});

test("refuse une activité trop exigeante au lieu de laisser l'énergie négative", () => {
  const state = time.createState({ condition: { energy: 5, fatigue: 80 } });
  const preview = time.canPerformActivity(state, "technical_sparring");
  assert.equal(preview.ok, false);
  assert.equal(preview.code, "INSUFFICIENT_ENERGY");
  assert.throws(
    () => time.performActivity(state, "technical_sparring"),
    error => error.code === "INSUFFICIENT_ENERGY",
  );

  const rested = time.performActivity(state, "recovery");
  assert.equal(rested.condition.energy, 19);
  assert.equal(rested.condition.fatigue, 77);
  assertAllPhysicalValuesAreBounded(rested);
});
