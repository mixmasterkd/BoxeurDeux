"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const onboarding = require("../v2-onboarding-engine.js");

const E = onboarding.EVENT_TYPES;

function freshCareer(overrides = {}) {
  return {
    careerStatus: "recreational",
    week: 1,
    jobId: null,
    jobsHeldCount: 0,
    introJobRequired: true,
    gymWeeks: 0,
    initialGymRequired: true,
    recreationalTrainingWeeks: 0,
    recreationalSparringStatus: "training",
    ...overrides,
  };
}

function completeInitialChoices(source = freshCareer()) {
  let state = onboarding.normalizeState(source);
  state = onboarding.applyEvent(state, { type: E.SELECT_INITIAL_JOB, jobId: "convenience" });
  return onboarding.applyEvent(state, { type: E.PURCHASE_INITIAL_MEMBERSHIP, weeks: 4 });
}

function advanceToWeek(source, targetWeek) {
  let state = source;
  while (state.week < targetWeek) state = onboarding.applyEvent(state, E.CLOSE_WEEK);
  return state;
}

test("expose le moteur pur en CommonJS et sur globalThis", () => {
  assert.equal(globalThis.BoxeurOnboarding, onboarding);
  assert.equal(onboarding.KIND, "boxeur-deux-v2-onboarding");
  assert.equal(onboarding.SCHEMA_VERSION, 1);
  assert.equal(onboarding.REMY_WEEK, 6);
  assert.equal(onboarding.MAX_RECREATIONAL_WEEK, 10);
  assert.equal(Object.isFrozen(onboarding), true);
  assert.equal(Object.isFrozen(onboarding.OBJECTIVES), true);
});

test("normalise une nouvelle carrière sans la modifier et commence par l'emploi obligatoire", () => {
  const source = freshCareer();
  const before = structuredClone(source);
  const state = onboarding.normalizeState(source);

  assert.deepEqual(source, before);
  assert.equal(state.mode, "guided");
  assert.equal(state.week, 1);
  assert.equal(state.initialJob.selected, false);
  assert.equal(state.initialGym.purchased, false);
  assert.equal(onboarding.getCurrentStep(state).id, "choose-initial-job");
});

test("la fenêtre du premier emploi ne peut être fermée ni annulée avant le choix", () => {
  const state = onboarding.normalizeState(freshCareer());
  const gates = onboarding.getGates(state);

  assert.deepEqual(gates.jobSelection, {
    required: true,
    openAllowed: true,
    dismissAllowed: false,
    cancelAllowed: false,
  });
  assert.equal(onboarding.canApplyEvent(state, E.DISMISS_JOB_SELECTION).code, "INITIAL_JOB_DIALOG_LOCKED");
  assert.equal(onboarding.canApplyEvent(state, E.CANCEL_JOB_SELECTION).code, "INITIAL_JOB_CANNOT_BE_CANCELLED");
  assert.throws(
    () => onboarding.applyEvent(state, E.DISMISS_JOB_SELECTION),
    error => error.code === "INITIAL_JOB_DIALOG_LOCKED",
  );
  assert.throws(
    () => onboarding.applyEvent(state, { type: E.SELECT_INITIAL_JOB, jobId: "" }),
    error => error.code === "INVALID_JOB_ID",
  );
});

test("l'emploi initial est garanti jusqu'à la clôture de la semaine 1", () => {
  let state = onboarding.normalizeState(freshCareer());
  const before = structuredClone(state);
  state = onboarding.applyEvent(state, { type: E.SELECT_INITIAL_JOB, jobId: "convenience" });

  assert.equal(before.initialJob.selected, false, "la transition doit rester immutable");
  assert.equal(state.initialJob.currentJobId, "convenience");
  assert.equal(onboarding.getCurrentStep(state).id, "purchase-initial-membership");
  assert.equal(onboarding.getGates(state).leaveJob.code, "INITIAL_JOB_LOCKED");
  assert.equal(onboarding.getGates(state).closeWeek.code, "INITIAL_MEMBERSHIP_REQUIRED");
  assert.throws(
    () => onboarding.applyEvent(state, E.LEAVE_JOB),
    error => error.code === "INITIAL_JOB_LOCKED",
  );
});

test("emploi et abonnement suffisent au verrou de semaine 1; la première séance reste guidée", () => {
  let state = completeInitialChoices();

  assert.equal(onboarding.getCurrentStep(state).id, "week-1-first-session");
  assert.equal(onboarding.getCurrentStep(state).required, false);
  assert.equal(onboarding.getGates(state).closeWeek.allowed, true);
  state = onboarding.applyEvent(state, E.CLOSE_WEEK);

  assert.equal(state.week, 2);
  assert.equal(state.firstWeekClosed, true);
  assert.equal(onboarding.getCurrentStep(state).id, "week-2-group-class");
  assert.equal(onboarding.getGates(state).leaveJob.allowed, true);
  state = onboarding.applyEvent(state, E.LEAVE_JOB);
  assert.equal(state.initialJob.selected, true, "quitter plus tard ne doit pas réactiver l'obligation initiale");
  assert.equal(state.initialJob.currentJobId, null);
});

test("les objectifs courts des semaines 1 à 5 sont déterministes mais non bloquants", () => {
  let state = completeInitialChoices();
  const expected = [
    "week-1-first-session",
    "week-2-group-class",
    "week-3-mitts",
    "week-4-defense",
    "week-5-remy-preparation",
  ];

  expected.forEach((objectiveId, index) => {
    assert.equal(state.week, index + 1);
    assert.equal(onboarding.getCurrentStep(state).id, objectiveId);
    state = onboarding.applyEvent(state, { type: E.COMPLETE_OBJECTIVE, objectiveId });
    assert.equal(onboarding.getCurrentStep(state).id, "finish-guided-week");
    if (index < expected.length - 1) state = onboarding.applyEvent(state, E.CLOSE_WEEK);
  });
  assert.deepEqual(state.completedObjectiveIds, expected);
});

test("Rémy devient un rendez-vous obligatoire à la semaine 6 sans quota d'entraînements", () => {
  let state = advanceToWeek(completeInitialChoices(), 6);

  assert.equal(state.trainingWeeks, 0);
  assert.equal(state.remyStatus, "ready");
  assert.equal(onboarding.getCurrentStep(state).id, "remy-sparring");
  assert.equal(onboarding.getGates(state).remySparring.allowed, true);
  assert.equal(onboarding.getGates(state).closeWeek.code, "REMY_SPARRING_REQUIRED");
  assert.throws(
    () => onboarding.applyEvent(state, E.CLOSE_WEEK),
    error => error.code === "REMY_SPARRING_REQUIRED",
  );

  state = onboarding.applyEvent(state, E.COMPLETE_REMY_SPARRING);
  assert.equal(state.remyStatus, "completed");
  assert.equal(onboarding.getCurrentStep(state).id, "pass-amateur");
  assert.equal(onboarding.getCurrentStep(state).required, false);
  assert.equal(onboarding.getGates(state).passAmateur.allowed, true);
});

test("le joueur peut rester récréatif après Rémy, mais pas dépasser la semaine 10", () => {
  let state = advanceToWeek(completeInitialChoices(), 6);
  state = onboarding.applyEvent(state, E.COMPLETE_REMY_SPARRING);
  state = advanceToWeek(state, 10);

  const step = onboarding.getCurrentStep(state);
  assert.equal(step.id, "pass-amateur");
  assert.equal(step.required, true);
  assert.equal(onboarding.getGates(state).closeWeek.code, "AMATEUR_TRANSITION_REQUIRED");
  assert.throws(
    () => onboarding.applyEvent(state, E.CLOSE_WEEK),
    error => error.code === "AMATEUR_TRANSITION_REQUIRED",
  );
});

test("le passage amateur demeure explicite et ouvre les systèmes amateurs", () => {
  let state = advanceToWeek(completeInitialChoices(), 6);
  state = onboarding.applyEvent(state, E.COMPLETE_REMY_SPARRING);
  const before = structuredClone(state);
  state = onboarding.applyEvent(state, E.PASS_AMATEUR);
  const gates = onboarding.getGates(state);

  assert.equal(before.careerStatus, "recreational");
  assert.equal(state.careerStatus, "amateur");
  assert.equal(state.mode, "complete");
  assert.equal(onboarding.getCurrentStep(state).id, "onboarding-complete");
  assert.equal(gates.fullCalendar.allowed, true);
  assert.equal(gates.strengthGym.allowed, true);
  assert.equal(gates.fullSparring.allowed, true);
  assert.equal(gates.groupClasses.code, "AMATEUR_GROUP_CLASS_REMOVED");
});

test("un profil développeur n'est jamais bloqué par les obligations initiales", () => {
  const state = onboarding.normalizeState(freshCareer({
    v2DeveloperTest: { active: true, presetId: "recreational-start" },
  }));
  const gates = onboarding.getGates(state);

  assert.equal(state.mode, "exempt");
  assert.equal(state.exemptionReason, "developer-profile");
  assert.equal(onboarding.getCurrentStep(state).id, "onboarding-exempt");
  assert.equal(gates.closeWeek.allowed, true);
  assert.equal(gates.jobSelection.dismissAllowed, true);
  assert.equal(gates.fullCalendar.allowed, true);
});

test("une ancienne sauvegarde non marquée reste compatible et non bloquante", () => {
  const legacy = {
    careerStatus: "recreational",
    week: 4,
    jobId: null,
    gymWeeks: 0,
    recreationalTrainingWeeks: 2,
  };
  const state = onboarding.normalizeState(legacy);

  assert.equal(state.mode, "exempt");
  assert.equal(state.exemptionReason, "legacy-unmarked");
  assert.equal(onboarding.getGates(state).closeWeek.allowed, true);

  const existingAmateur = onboarding.normalizeState({ careerStatus: "amateur", week: 30 });
  assert.equal(existingAmateur.mode, "complete");
  assert.equal(onboarding.getGates(existingAmateur).fullCalendar.allowed, true);
});

test("normalise directement une capsule V2 sans perdre sa phase ni sa semaine", () => {
  const capsule = {
    phase: "recreational",
    legacySnapshot: { state: freshCareer() },
    timeState: { clock: { week: 3 } },
    previewRuntime: {
      career: {
        jobId: "convenience",
        jobsHeldCount: 1,
        introJobRequired: false,
        gymWeeks: 2,
        initialGymRequired: false,
      },
    },
  };
  const state = onboarding.normalizeState(capsule);

  assert.equal(state.careerStatus, "recreational");
  assert.equal(state.week, 3);
  assert.equal(state.initialJob.selected, true);
  assert.equal(state.initialGym.purchased, true);
  assert.equal(onboarding.getCurrentStep(state).id, "week-3-mitts");
});

test("un état canonique reste sérialisable, normalisable et conserve les choix terminés", () => {
  let state = completeInitialChoices();
  state = onboarding.applyEvent(state, {
    type: E.COMPLETE_OBJECTIVE,
    objectiveId: "week-1-first-session",
  });
  const serialized = JSON.parse(JSON.stringify(state));
  const restored = onboarding.normalizeState(serialized);

  assert.deepEqual(restored, state);
  assert.equal(onboarding.isOnboardingState(restored), true);
  assert.equal(restored.history.length, 3);
  assert.equal(restored.sequence, 3);
});

test("une transition refusée ne modifie jamais l'état reçu", () => {
  const state = completeInitialChoices();
  const before = structuredClone(state);

  assert.throws(
    () => onboarding.applyEvent(state, { type: "evenement-inconnu" }),
    error => error.code === "UNKNOWN_ONBOARDING_EVENT",
  );
  assert.deepEqual(state, before);
});
