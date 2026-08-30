"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const time = require("../career-time-engine.js");
const recovery = require("../recovery-engine.js");

const fixedRng = (value = 0.5) => () => value;

function allZeros(values) {
  return Object.values(values).every(value => value === 0);
}

test("expose une API CommonJS et globale fondée sur BoxeurTime", () => {
  assert.equal(globalThis.BoxeurRecovery, recovery);
  assert.equal(recovery.SCHEMA_VERSION, 1);
  assert.equal(recovery.ACTIONS.active_recovery.activity.energyGain, 10);
  assert.equal(recovery.ACTIONS.active_recovery.activity.fatigueRelief, 5);
  assert.equal(recovery.ACTIONS.nap.activity.energyGain, 16);
  assert.equal(recovery.ACTIONS.nap.activity.fatigueRelief, 2);
});

test("la récupération active et la sieste consomment une période avec des compromis distincts", () => {
  const initial = time.createState({
    time: { week: 1, day: "monday", period: "morning" },
    condition: { energy: 40, fatigue: 50 },
  });
  const active = recovery.activeRecovery(initial, fixedRng());
  const nap = recovery.takeNap(initial, fixedRng());

  assert.equal(active.elapsedPeriods, 1);
  assert.equal(active.state.clock.period, "afternoon");
  assert.equal(active.state.condition.energy, 50);
  assert.equal(active.state.condition.fatigue, 45);
  assert.equal(nap.state.condition.energy, 56);
  assert.equal(nap.state.condition.fatigue, 48);
  assert.ok(nap.deltas.energy > active.deltas.energy);
  assert.ok(active.deltas.fatigue < nap.deltas.fatigue);
  assert.equal(active.nightCount, 0);
  assert.ok(allZeros(active.assimilated));
});

test("dormir avance exactement jusqu'au prochain matin et ne déclenche qu'une nuit", () => {
  const starts = [
    { period: "morning", expected: 3 },
    { period: "afternoon", expected: 2 },
    { period: "evening", expected: 1 },
  ];

  starts.forEach(({ period, expected }) => {
    const initial = time.createState({
      time: { week: 2, day: "wednesday", period },
      condition: { energy: 45, fatigue: 40 },
    });
    const result = recovery.sleepUntilNextMorning(initial, fixedRng());
    assert.equal(result.elapsedPeriods, expected);
    assert.equal(result.state.clock.day, "thursday");
    assert.equal(result.state.clock.period, "morning");
    assert.equal(result.nightCount, 1);
  });
});

test("la nuit de dimanche fait passer à la semaine suivante", () => {
  const initial = time.createState({
    time: { week: 4, day: "sunday", period: "evening" },
    condition: { energy: 50, fatigue: 30 },
  });
  const result = recovery.sleepUntilNextMorning(initial, fixedRng());

  assert.equal(result.elapsedPeriods, 1);
  assert.equal(result.state.clock.week, 5);
  assert.equal(result.state.clock.day, "monday");
  assert.equal(result.state.clock.period, "morning");
  assert.equal(result.nightCount, 1);
});

test("seule une nuit assimile l’XP ciblée et la conserve jusqu’au prochain seuil", () => {
  const initial = time.createState({
    time: { week: 1, day: "monday", period: "evening" },
    condition: { energy: 45, fatigue: 35 },
    stats: { technique: 40, power: 40, cardio: 40, defense: 40 },
    stimulus: { technique: 20, power: 10, cardio: 5, defense: 15 },
  });
  const result = recovery.sleepUntilNextMorning(initial, fixedRng());

  assert.equal(result.nightCount, 1);
  assert.ok(result.assimilated.technique > 0);
  assert.ok(result.statXpGains.technique > 0);
  assert.equal(result.state.stats.technique, initial.stats.technique);
  assert.ok(result.state.statXp.technique > initial.statXp.technique);
  assert.deepEqual(result.ui.stimulusAssimilated, result.assimilated);
  assert.equal(typeof result.advice, "string");
});

test("détecte la récupération nocturne même lorsque l'historique de 500 entrées est tronqué", () => {
  const initial = time.createState({
    time: { week: 1, day: "monday", period: "evening" },
    condition: { energy: 40, fatigue: 45 },
    stats: { technique: 40, power: 40, cardio: 40, defense: 40 },
    stimulus: { technique: 20, power: 10, cardio: 5, defense: 15 },
  });
  initial.sequence = 500;
  initial.history = Array.from({ length: 500 }, (_, index) => ({
    id: `time-event-${index + 1}`,
    type: "historical-event",
  }));
  const before = structuredClone(initial);

  const result = recovery.sleepUntilNextMorning(initial, fixedRng());

  assert.deepEqual(initial, before, "la source pleine doit rester immutable");
  assert.equal(result.state.history.length, 500, "BoxeurTime conserve son plafond d'historique");
  assert.equal(result.state.sequence, 502);
  assert.equal(result.nightCount, 1);
  assert.ok(result.assimilated.technique > 0);
  assert.ok(result.statXpGains.technique > 0);
  assert.equal(result.state.history.at(-2).id, "time-event-501");
  assert.equal(result.state.history.at(-2).type, "night-recovery");
});

test("aucune récupération courte n'accorde de statistique ou d'assimilation sans nuit", () => {
  const initial = time.createState({
    time: { week: 1, day: "monday", period: "morning" },
    condition: { energy: 55, fatigue: 30 },
    stats: { technique: 45, power: 46, cardio: 47, defense: 48 },
    stimulus: { technique: 12, power: 8, cardio: 4, defense: 6 },
  });
  const active = recovery.activeRecovery(initial, fixedRng());
  const nap = recovery.takeNap(initial, fixedRng());

  assert.deepEqual(active.state.stats, initial.stats);
  assert.deepEqual(active.state.stimulus, initial.stimulus);
  assert.deepEqual(nap.state.stats, initial.stats);
  assert.deepEqual(nap.state.stimulus, initial.stimulus);
  assert.ok(allZeros(active.assimilated));
  assert.ok(allZeros(nap.statGains));
});

test("les rendez-vous bloquent les récupérations et le sommeil sans être sautés", () => {
  let atAppointment = time.createState({
    time: { week: 1, day: "monday", period: "morning" },
    condition: { energy: 40, fatigue: 50 },
  });
  atAppointment = time.scheduleAppointment(atAppointment, {
    id: "coach-now",
    title: "Cours privé",
    startSlot: atAppointment.clock.absoluteSlot,
    duration: 1,
  });

  assert.equal(recovery.canPerformAction(atAppointment, "active_recovery").code, "APPOINTMENT_BLOCKS_ACTIVITY");
  assert.throws(
    () => recovery.activeRecovery(atAppointment),
    error => error.code === "APPOINTMENT_BLOCKS_ACTIVITY",
  );

  let beforeAppointment = time.createState({
    time: { week: 1, day: "monday", period: "morning" },
    condition: { energy: 40, fatigue: 50 },
  });
  beforeAppointment = time.scheduleAppointment(beforeAppointment, {
    id: "coach-tonight",
    title: "Cours privé",
    startSlot: beforeAppointment.clock.absoluteSlot + 2,
    duration: 1,
  });
  assert.equal(recovery.canPerformAction(beforeAppointment, "sleep_until_morning").code, "APPOINTMENT_BLOCKS_TIME");
  assert.throws(
    () => recovery.sleepUntilNextMorning(beforeAppointment),
    error => error.code === "APPOINTMENT_BLOCKS_TIME",
  );
  assert.equal(beforeAppointment.clock.absoluteSlot, 0);
  assert.equal(beforeAppointment.appointments.length, 1);
});

test("les valeurs restent bornées et la récupération immédiate ne dépasse jamais 100", () => {
  const almostFull = time.createState({
    condition: { energy: 95, fatigue: 1 },
  });
  const nap = recovery.takeNap(almostFull, fixedRng());
  assert.equal(nap.state.condition.energy, 100);
  assert.equal(nap.state.condition.fatigue, 0);

  const exhausted = time.createState({
    condition: { energy: 0, fatigue: 100 },
  });
  const active = recovery.activeRecovery(exhausted, fixedRng());
  assert.ok(active.state.condition.energy >= 0 && active.state.condition.energy <= 100);
  assert.ok(active.state.condition.fatigue >= 0 && active.state.condition.fatigue <= 100);
  assert.ok(Object.values(active.state.stats).every(value => value >= 0 && value <= 100));
  assert.ok(Object.values(active.state.stimulus).every(value => value >= 0 && value <= 100));
});

test("l'anti-boucle bloque les repos courts inutiles mais jamais le passage explicite du temps", () => {
  const fresh = time.createState({
    time: { week: 1, day: "monday", period: "morning" },
    condition: { energy: 96, fatigue: 4 },
  });

  assert.equal(recovery.isShortRecoveryUseful(fresh), false);
  assert.equal(recovery.canPerformAction(fresh, "active_recovery").code, "RECOVERY_NOT_NEEDED");
  assert.equal(recovery.canPerformAction(fresh, "nap").code, "RECOVERY_NOT_NEEDED");
  assert.throws(() => recovery.activeRecovery(fresh), error => error.code === "RECOVERY_NOT_NEEDED");

  const advanced = recovery.advanceFreePeriod(fresh, fixedRng());
  assert.equal(advanced.elapsedPeriods, 1);
  assert.equal(advanced.state.clock.absoluteSlot, fresh.clock.absoluteSlot + 1);
  assert.equal(advanced.deltas.energy, 0);
  assert.equal(advanced.deltas.fatigue, 0);
});

test("chaque transition demeure déterministe, immuable et étrangère aux finances", () => {
  const initial = time.createState({
    seed: "home-recovery",
    time: { week: 3, day: "friday", period: "evening" },
    condition: { energy: 38, fatigue: 62 },
    stimulus: { technique: 14, power: 2, cardio: 9, defense: 11 },
  });
  initial.money = 777;
  initial.weight = 69.4;
  initial.job = { id: "courier", attendance: 3 };
  const snapshot = JSON.stringify(initial);

  const first = recovery.sleepUntilNextMorning(initial, fixedRng(0.42));
  const second = recovery.sleepUntilNextMorning(initial, fixedRng(0.42));

  assert.equal(JSON.stringify(initial), snapshot);
  assert.deepEqual(first, second);
  assert.equal(first.state.money, 777);
  assert.equal(first.state.weight, 69.4);
  assert.deepEqual(first.state.job, initial.job);
  assert.notEqual(first.state, initial);
});
