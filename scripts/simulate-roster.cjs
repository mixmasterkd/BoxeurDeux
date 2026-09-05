"use strict";

// Standalone BE-B bench: no application state, localStorage or browser save.
const { performance } = require("node:perf_hooks");
const roster = require("../roster-engine.js");
const average = vector => Object.values(vector).reduce((sum, value) => sum + value, 0) / 4;
const rounded = value => Math.round(value * 100) / 100;

function scenario({ label, sex = "male", offset = 0, weeks = 520 }) {
  let state = roster.createState({ sex, weightClass: sex === "male" ? "M65" : "W57", seed: `BE-B:${label}`, initialLevelOffset: offset });
  const samples = [];
  const snapshots = [];
  for (let week = 1; week <= weeks; week += 1) {
    const started = performance.now();
    state = roster.advanceWeek(state, { week, careerStatus: "amateur", completed: true }).state;
    samples.push(performance.now() - started);
    if ([26, 52, 104, 520, 1500].includes(week)) snapshots.push({
      week, matches: state.matches.length + state.archives.count,
      levels: state.fighters.map(fighter => rounded(average(fighter.stats))),
      bytesUTF8: Buffer.byteLength(JSON.stringify(state), "utf8"),
    });
  }
  roster.validateState(state);
  const sortedTimes = [...samples].sort((a, b) => a - b);
  return {
    label, weeks, matches: state.matches.length + state.archives.count,
    retained: state.matches.length, archived: state.archives.count,
    meanWeekMs: rounded(samples.reduce((sum, value) => sum + value, 0) / samples.length),
    p95WeekMs: rounded(sortedTimes[Math.min(sortedTimes.length - 1, Math.floor(sortedTimes.length * 0.95))]),
    bytesUTF8: Buffer.byteLength(JSON.stringify(state), "utf8"),
    fighters: state.fighters.map(fighter => ({
      id: fighter.id, level: rounded(average(fighter.stats)), ceiling: rounded(average(fighter.ceilings)),
      followedFights: Object.values(fighter.record).reduce((sum, value) => sum + value, 0)
        - Object.values(fighter.initialRecord).reduce((sum, value) => sum + value, 0),
      record: fighter.record,
    })),
    snapshots,
  };
}

const scenarios = [
  { label: "masculin", weeks: 1500 },
  { label: "feminin", sex: "female" },
  { label: "niveau-initial-avance", offset: 27 },
  { label: "limite-99", offset: 56 },
];
console.log(JSON.stringify({ runtime: process.version, note: "Mesures Node locales, hors interface et sauvegarde du jeu; pas un benchmark mobile.",
  results: scenarios.map(scenario) }, null, 2));
