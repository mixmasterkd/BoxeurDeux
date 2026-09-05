"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const view = require("../membership-view.js");
const world = require("../world.js");
const economy = require("../balance-engine.js").ECONOMY;
const plans = kind => [{ ...economy.memberships[kind].monthly, id: "monthly", label: "1 mois" },
  { ...economy.memberships[kind].threeMonths, id: "three-months", label: "3 mois" }];
const context = (kind, patch = {}) => ({ kind, careerStatus: "amateur", week: 10,
  membership: { active: false, weeksRemaining: 0, balance: 500, plans: plans(kind), ...patch } });

test("compteur pur : échéance inclusive, dernière semaine et verrou amateur prioritaire", () => {
  assert.equal(view.status(3, { week: 10 }).lastWeek, 12);
  assert.equal(view.status(1, { week: 10 }).lastWeek, 10);
  assert.equal(view.status(1).tone, "ending");
  assert.equal(view.status(2).tone, "active");
  assert.equal(view.status(0).tone, "inactive");
  assert.equal(view.status(0).lastWeek, null);
  assert.equal(view.status(8, { locked: true }).tone, "locked");
  assert.equal(view.status(8, { locked: true }).lastWeek, null);
  assert.equal(view.status(NaN).tone, "inactive");
});

test("même composant, tarifs et économies propres à chaque gym", () => {
  for (const [kind, monthly, quarterly, savings, attr] of [["boxing", 110, 285, 45, "data-gym-plan"],
    ["strength", 95, 270, 15, "data-career-strength-plan"]]) {
    const input = context(kind);
    const before = JSON.stringify(input);
    const html = view.renderPlans(input);
    assert.equal((html.match(/class="membership-plan available"/g) || []).length, 2);
    assert.match(html, new RegExp(`${monthly} \\$`));
    assert.match(html, new RegExp(`${quarterly} \\$`));
    assert.match(html, new RegExp(`Économie de ${savings} \\$`));
    assert.match(html, new RegExp(`${attr}="monthly"`));
    assert.match(html, /Paiement unique pour 4 semaines/);
    assert.match(html, /Paiement unique pour 12 semaines/);
    assert.match(html, /aucun renouvellement automatique/);
    assert.equal(JSON.stringify(input), before);
    const confirm = view.renderConfirmation({ kind, plan: plans(kind)[0], balance: 500, week: 10 });
    assert.match(confirm, new RegExp(`${500 - monthly} \\$`));
    assert.match(confirm, /Semaine 13/);
  }
});

test("refuse abonnement actif, manque d'argent, budget réservé et forfait initial de trois mois", () => {
  const monthly = plans("boxing")[0];
  assert.equal(view.planState(monthly, context("boxing", { balance: 109 })).available, false);
  assert.equal(view.planState(monthly, context("boxing", { balance: 110 })).available, true);
  assert.equal(view.planState(monthly, context("boxing", { active: true, weeksRemaining: 1 })).available, false);
  assert.equal(view.planState(plans("strength")[0], context("strength", { balance: 200, spendableBalance: 90 })).available, false);
  assert.equal(view.planState(plans("strength")[0], { ...context("strength"), careerStatus: "recreational" }).available, false);
  assert.equal(view.planState(plans("boxing")[1], context("boxing", { initialRequired: true })).available, false);
  const html = view.renderPlans(context("boxing", { initialRequired: true }));
  assert.match(html, /data-gym-plan="monthly"/);
  assert.doesNotMatch(html, /data-gym-plan="three-months"/);
});

test("pastilles indépendantes, aucun verrou supplémentaire d'accès à la réception", () => {
  const career = { profile: { firstName: "Alex" }, careerStatus: "amateur", week: 10, gymWeeks: 1, strengthGymWeeks: 8 };
  const before = JSON.stringify(career);
  const html = world.render(career);
  assert.match(html, /membership-map-badge ending/);
  assert.match(html, /membership-map-badge active/);
  assert.match(html, /dernière semaine/);
  assert.equal(JSON.stringify(career), before);
  assert.equal(world.locationAccess("boxing-gym", { ...career, gymWeeks: 0 }).locked, false);
  assert.equal(world.locationAccess("strength-gym", { ...career, strengthGymWeeks: 0 }).locked, false);
  assert.equal(world.locationAccess("boxing-gym", { ...career, careerFightGate: { status: "ready" } }).locked, true);
});

test("échappe les libellés de forfait et les raisons de refus", () => {
  const attack = '<img src=x onerror="alert(1)">';
  const input = context("boxing", { detail: attack, plans: [{ ...plans("boxing")[0], id: attack, label: attack,
    available: false, disabledReason: attack }] });
  const html = view.renderPlans(input);
  assert.doesNotMatch(html, /<img|onerror="alert/);
  assert.match(html, /&lt;img/);
  const maliciousPlan = { ...plans("boxing")[0], price: attack, weeks: attack };
  assert.doesNotMatch(view.renderPlans(context("boxing", { balance: attack, plans: [maliciousPlan] })), /<img|onerror="alert/);
  assert.doesNotMatch(view.renderConfirmation({ kind: "boxing", plan: maliciousPlan, balance: 500, week: 1 }), /<img|onerror="alert/);
});
