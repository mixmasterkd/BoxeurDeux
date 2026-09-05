/* BE-E test-only harness, loaded by Playwright, never by index.html.
 * Calls the application's real planner, payments, bookings and settlement.
 * Tactical decisions skip animation, not the combat engine or career receipt.
 */
window.BERosterCampaign = (() => {
  const copy = value => JSON.parse(JSON.stringify(value));
  const average = vector => Object.values(vector).reduce((sum, n) => sum + n, 0) / 4;
  const requireCheck = (ok, message) => { if (!ok) throw new Error(message); };
  function observation() {
    const career = careerCareerView();
    const event = state.calendar.events.find(item => item.kind === "gala" && item.careerWeek === state.week && item.scope !== "regional")
      || state.calendar.events.find(item => item.kind === "gala" && item.careerWeek >= state.week);
    const offers = BoxeurRosterCareer.galaOffers(state.rosterState, event, playerCombatStrength());
    return { week: state.week, stats: copy(career.combatStats), average: average(career.combatStats),
      energy: career.energy, fatigue: career.fatigue, money: career.money, level: state.level,
      record: copy(state.amateurRecord), jobId: career.jobId, missedWorkWeeks: career.missedWorkWeeks,
      rosterMinimum: Math.min(...state.rosterState.fighters.map(f => average(f.stats))),
      rosterMaximum: Math.max(...state.rosterState.fighters.map(f => average(f.stats))),
      offers: copy(offers), strength: playerCombatStrength(),
      // Same neutral condition and local format as startFight, no scouting bonus.
      combatPlayer: { id: "player", name: state.profile.firstName, stats: copy(career.combatStats),
        style: styles[state.profile.style].label, energy: career.energy, fatigue: career.fatigue,
        fitness: CAREER_NEUTRAL_COMBAT_CONDITION.fitness, injury: CAREER_NEUTRAL_COMBAT_CONDITION.injury,
        morale: CAREER_NEUTRAL_COMBAT_CONDITION.morale, experience: state.experience, level: state.level },
    };
  }
  function finishTactical(policy) {
    let steps = 0;
    while (!fightState.status.finished && steps++ < 100) {
      if (fightState.phase === "corner") {
        const choices = BoxeurCombat.getCoachOptions(fightState);
        const chosen = choices.find(c => c.id === "recover" && fightState.fighters.player.energy < 35)
          || choices.find(c => c.recommended) || choices[0];
        fightState = BoxeurCombat.chooseCoachDirective(fightState, chosen.id).state;
      } else {
        const choices = BoxeurCombat.getAvailableActions(fightState);
        const selected = policy === "novice" ? choices[(fightState.round + fightState.exchange) % choices.length]
          : choices.find(c => c.directiveAligned) || choices[0];
        fightState = BoxeurCombat.resolveExchange(fightState, selected.id).state;
      }
    }
    requireCheck(fightState.status.finished, "Un combat du banc n’a pas abouti");
    finishFight();
  }
  async function run(config) {
    const observations = [observation()];
    const weeks = [];
    const fights = [];
    const initialRecord = amateurFightCount();
    const initialMedals = JSON.stringify(state.medals);
    const initialOffset = state.rosterState.initialLevelOffset;
    for (let step = 1; step <= config.weeks; step += 1) {
      const week = state.week;
      let current = careerCareerView();
      if (current.gymWeeks === 0 && current.money >= 110) selectCareerGymPlan("monthly");
      closeCareerLocation();
      if (config.mode === "quick") applyCareerQuickWeekPlan();
      else {
        addCareerPlannerActivity(careerCareerView().gymWeeks > 0 ? "boxing-coach" : "home-quick");
        addCareerPlannerActivity("rest");
      }
      document.querySelector("#session-supplement-dialog")?.close();
      const planned = copy(ensureCareerWeekPlanner().entries);
      if (step % config.fightEvery === 0) {
        ensureCareerCalendar();
        const event = state.calendar.events.find(item => item.kind === "gala" && item.careerWeek === week && item.scope !== "regional");
        if (event) {
          const offers = BoxeurRosterCareer.galaOffers(state.rosterState, event, playerCombatStrength());
          const selectedIndex = offers.reduce((index, item, i) => item.rating < offers[index].rating ? i : index, 0);
          bookGalaEvent(event.id, selectedIndex, offers[selectedIndex].rosterFighterId);
          if (state.scheduledFight) {
            state.scheduledFight.fightSeed = `BE-E:${config.label}:${step}`;
            persistCareer();
          }
        }
      }
      document.querySelector("#calendar-dialog")?.close();
      const reserved = copy(state.scheduledFight);
      const beforeRoster = JSON.stringify(state.rosterState);
      const previousCount = amateurFightCount();
      runCareerAutomaticWeek();
      if (reserved) {
        requireCheck(careerFightGateReady(), `Verrou absent en semaine ${week}`);
        requireCheck(JSON.stringify(state.rosterState) === beforeRoster, "Bassin avancé avant le combat");
        requireCheck(BoxeurWorld.locationAccess("federation", federationReadOnlyCareer()).locked, "Fédération accessible pendant le verrou");
        closeCareerLocation();
        await startFight();
        requireCheck(JSON.stringify(fightState.fighters.opponent.stats) === JSON.stringify(reserved.opponent.stats), "Stats modifiées entre offre et ring");
        const before = { energy: fightState.fighters.player.energy, fatigue: fightState.fighters.player.fatigue };
        finishTactical(config.policy);
        requireCheck(amateurFightCount() === previousCount + 1, "Résultat du joueur manquant ou doublé");
        const afterFirst = JSON.stringify(state);
        finishFight();
        requireCheck(JSON.stringify(state) === afterFirst, "Double récompense de combat");
        fights.push({ week, opponent: reserved.opponent.rosterFighterId, opponentRating: reserved.opponent.rating,
          playerAverage: average(fightState.fighters.player.stats), before, winner: fightState.result.winner,
          method: fightState.result.method });
        document.querySelector("#fight-instruction button.primary-button").click();
      } else {
        requireCheck(amateurFightCount() === previousCount, "Combat automatique attribué au joueur");
        closeCareerLocation();
      }
      requireCheck(state.week === week + 1, `Semaine ${week} non clôturée : ${document.querySelector("#toast").textContent}`);
      requireCheck(state.rosterState.lastProcessedWeek === week, "Bassin désynchronisé");
      requireCheck(state.rosterState.initialLevelOffset === initialOffset, "Réadaptation du bassin au joueur");
      requireCheck(BoxeurRosterCareer.validateCareer(state), "Sauvegarde invalide");
      requireCheck(JSON.stringify(state.medals) === initialMedals, "Médaille attribuée hors tournoi");
      const automatic = state.rosterState.matches.filter(match => match.week === week && match.source === "simulation");
      requireCheck(automatic.length <= 1 && automatic.every(m => !m.fighterIds.includes("player")), "Rencontre automatique invalide");
      // Spend earned level points through the same UI handler as a player.
      // All profiles distribute to the weakest stat; no free points are added.
      if (state.levelPoints > 0) {
        if (document.querySelector("#level-up-dialog").open) document.querySelector("#level-up-allocate").click();
        else openLevelDialog();
        while (state.levelPoints > 0) {
          const key = Object.keys(state.combatStats).sort((a, b) => state.combatStats[a] - state.combatStats[b])[0];
          if (state.combatStats[key] >= 99) break;
          document.querySelector(`#level-choices [data-level-stat="${key}"]`).click();
        }
        document.querySelector("#level-dialog-close").click();
      }
      if (document.querySelector("#level-up-dialog").open) document.querySelector("#level-up-later").click();
      await new Promise(resolve => setTimeout(resolve, 0));
      current = careerCareerView();
      weeks.push({ week, energy: current.energy, fatigue: current.fatigue, money: current.money,
        jobId: current.jobId, missedWorkWeeks: current.missedWorkWeeks,
        training: planned.filter(entry => entry.physical).length,
        activities: planned.map(entry => entry.activityId), playerAverage: average(current.combatStats) });
      if ([13, 26, 52, 104].includes(step)) observations.push(observation());
    }
    requireCheck(amateurFightCount() === initialRecord + fights.length, "Bilan final incohérent");
    const snapshot = JSON.parse(localStorage.getItem("boxeur-deux-career"));
    requireCheck(JSON.stringify(snapshot.state.rosterState) === JSON.stringify(state.rosterState), "Bassin non persisté");
    return { config, observations, weeks, fights, finalRoster: copy(state.rosterState),
      saveBytesUTF8: new TextEncoder().encode(JSON.stringify(snapshot)).length,
      rosterBytesUTF8: new TextEncoder().encode(JSON.stringify(state.rosterState)).length };
  }
  return { run, observation };
})();
