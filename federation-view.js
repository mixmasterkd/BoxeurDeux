(function attachFederationView(root, factory) {
  "use strict";
  const commonjs = typeof module === "object" && module.exports;
  const api = factory(commonjs ? require("./roster-engine.js") : root.BoxeurRoster,
    commonjs ? require("./career-calendar.js") : root.BoxeurCalendar);
  if (commonjs) module.exports = api;
  if (root) root.BoxeurFederationView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createFederationView(roster, calendar) {
  "use strict";
  const PAGE_SIZE = 10;
  const escape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const number = value => Math.max(0, Math.floor(Number(value) || 0));
  const record = value => ({ wins: number(value?.wins), losses: number(value?.losses), draws: number(value?.draws) });
  const recordText = value => `${number(value?.wins)} V · ${number(value?.losses)} D · ${number(value?.draws)} N`;
  const total = value => number(value?.wins) + number(value?.losses) + number(value?.draws);
  const activeBooking = booking => !["cancelled", "withdrawn", "completed"].includes(booking.status);
  const dateText = date => date ? new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)) : "Date à confirmer";

  function styleDescription(style) {
    if (/contre/i.test(style)) return "Observe les ouvertures et cherche à répondre au bon moment.";
    if (/défensif/i.test(style)) return "Privilégie une garde solide et limite les ouvertures.";
    if (/mobile/i.test(style)) return "Utilise les déplacements pour choisir la distance de l’échange.";
    if (/puncheur/i.test(style)) return "Cherche à faire la différence avec des frappes puissantes.";
    if (/bagarreur|pression/i.test(style)) return "Avance pour imposer le rythme et combattre de près.";
    if (/technicien/i.test(style)) return "Construit ses échanges avec précision et maîtrise de la distance.";
    return "Associe plusieurs approches selon la situation du combat.";
  }

  function tournamentOverview(career) {
    const saved = career.calendar;
    if (!saved?.epoch) return { events: [], next: null, warnings: [], bookings: [] };
    const definitions = saved.settings?.tournaments || calendar.DEFAULT_TOURNAMENT_SCHEDULE;
    const labels = Object.fromEntries(definitions.map(item => [item.id, item.name]));
    const week = Math.max(1, number(career.week));
    // Same Monday-based registration date and projections as the live calendar.
    const today = calendar.dateForCareerWeek(saved.epoch, week, 0);
    const bookings = (career.bookings || []).filter(activeBooking);
    const describeRule = rule => rule?.type === "fight-count"
      ? Number.isFinite(Number(rule.max)) ? `${rule.min || 0} à ${rule.max} combats amateurs` : `Au moins ${rule.min || 0} combats amateurs`
      : rule?.type === "medal" ? `Médaille d’or : ${labels[rule.tournamentId] || rule.tournamentId}` : "Statut amateur requis";
    const preview = (definition, afterWeek) => calendar.nextTournamentPreview({
      ...(saved.settings || {}), epoch: saved.epoch, seed: saved.seed, tournaments: [definition], afterWeek,
    });
    function summarize(event, definition) {
      const booking = bookings.find(item => item.eventId === event.id);
      const expired = event.endDate < today;
      const closed = event.registrationDeadline < today;
      const divisions = (event.divisions?.length ? event.divisions : [null]).map(division => {
        const result = calendar.evaluateEligibility(event, career, { bookings, includeBookings: true, divisionId: division?.id });
        return { label: division?.label || "", condition: describeRule(division?.eligibility || event.eligibility),
          eligible: result.eligible, code: result.code,
          reason: result.code === "missing-medal" ? describeRule(division?.eligibility || event.eligibility) : result.reason,
          warning: ["bronze", "silver"].includes(definition.id) && result.eligible && Number.isFinite(result.max)
            ? `${Math.max(0, result.max - result.fightCount)} combat(s) supplémentaire(s) possible(s) avant la limite de ${result.max}. Les combats réservés sont inclus.` : "" };
      });
      const choices = calendar.travelOptionsForEvent(event);
      const costs = choices.map(choice => calendar.quoteEventCost(event, choice.id).total);
      const minCost = Math.min(...costs);
      const maxCost = Math.max(...costs);
      const eligible = !expired && !closed && divisions.some(item => item.eligible);
      const conflict = !booking && choices.length > 0 && choices.every(choice => calendar.findBookingConflicts(event, bookings, choice.id).length > 0);
      return { id: event.id, tournamentId: definition.id, name: event.name, week: event.careerWeek,
        date: dateText(event.startDate), deadline: dateText(event.registrationDeadline),
        city: event.venue?.city || "", rounds: event.rounds, divisions, eligible, booked: Boolean(booking),
        status: booking ? "Inscription confirmée" : expired ? "Édition terminée" : closed ? "Inscriptions closes" : eligible ? "Admissible" : "Condition non remplie",
        expired, closed, cost: minCost === maxCost ? `${minCost} $` : `${minCost} à ${maxCost} $`,
        notice: booking ? `Frais déjà réglés : ${number(booking.payment?.total)} $. L’admissibilité sera contrôlée à l’arrivée.`
          : conflict ? "Un autre rendez-vous occupe cette période. Vérifie les dates dans le calendrier."
            : number(career.money) < minCost ? `Budget insuffisant pour le coût minimal : il manque ${minCost - number(career.money)} $.` : "",
      };
    }
    const events = definitions.map(definition => {
      const known = (saved.events || []).filter(event => event.kind === "tournament" && event.tournamentId === definition.id)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
      const event = known.find(item => item.endDate >= today) || preview(definition, week)
        || known.at(-1) || preview(definition, 1);
      return event ? summarize(event, definition) : null;
    }).filter(Boolean);
    // A repeat event whose registration closed does not hide its next occurrence.
    const nextCandidates = [...events];
    for (const event of events.filter(item => !item.booked && (item.closed || item.expired))) {
      const definition = definitions.find(item => item.id === event.tournamentId);
      const following = preview(definition, Math.max(week, event.week + 1));
      if (following) nextCandidates.push(summarize(following, definition));
    }
    const next = nextCandidates.filter(item => item.booked || item.eligible).sort((a, b) => a.week - b.week || a.id.localeCompare(b.id))[0] || null;
    const warnings = events.filter(item => ["bronze", "silver"].includes(item.tournamentId) && !item.booked)
      .map(item => `${item.name} : ${item.expired ? "la date de cette édition est passée." : item.closed ? "les inscriptions sont closes." : item.divisions[0].warning || item.divisions[0].reason}`);
    return { events, next, warnings,
      bookings: bookings.map(item => ({ id: item.id, name: item.event?.name || "Rendez-vous confirmé", week: item.event?.careerWeek,
        date: dateText(item.event?.startDate), cost: number(item.payment?.total) })) };
  }

  /** Read-only projection. Only public roster fields reach the HTML renderer. */
  function buildContext(career, navigation = {}) {
    const professional = career.careerStatus === "professional";
    const rosterState = career.rosterState;
    const fighters = rosterState ? roster.listFighters(rosterState) : [];
    const selectedId = navigation.fighterId;
    const view = ["home", "directory", "fighter", "dossier", "tournaments"].includes(navigation.view) ? navigation.view : "home";
    const offset = Math.min(990, Math.max(0, Math.floor(number(navigation.offset) / PAGE_SIZE) * PAGE_SIZE));
    const fullName = [career.profile?.firstName, career.profile?.lastName].filter(Boolean).join(" ") || "Ton boxeur";
    const player = { id: "player", name: fullName, nickname: career.profile?.nickname || "", record: record(career.amateurRecord),
      weightClass: career.profile?.weightClass || "", reputation: number(career.reputation) };
    const overview = professional ? { events: [], next: null, warnings: [], bookings: [] } : tournamentOverview(career);
    const names = { player: `${fullName} (toi)`, ...Object.fromEntries(fighters.map(fighter => [fighter.id, fighter.name])) };
    let selected = null;
    let playerHistory = null;
    if (rosterState && view === "fighter" && fighters.some(fighter => fighter.id === selectedId)) {
      selected = roster.getFighterProfile(rosterState, selectedId, { offset, limit: PAGE_SIZE });
      selected.againstPlayer = roster.headToHead(rosterState, selectedId, "player");
    }
    if (rosterState && view === "dossier") {
      const matches = rosterState.matches.filter(match => match.fighterIds.includes("player")).slice().reverse();
      const archivedOpponents = fighters.map(fighter => rosterState.archives.pairs[JSON.stringify([fighter.id, "player"].sort())])
        .filter(Boolean).map(pair => {
          const index = pair.fighterIds.indexOf("player");
          return { opponentId: pair.fighterIds[1 - index], wins: pair.wins[index], losses: pair.wins[1 - index], draws: pair.draws,
            firstWeek: pair.firstWeek, lastWeek: pair.lastWeek };
        });
      playerHistory = { retainedCount: matches.length, archivedOpponents,
        archivedCount: archivedOpponents.reduce((sum, pair) => sum + total(pair), 0),
        history: matches.slice(offset, offset + PAGE_SIZE).map(match => ({ id: match.id, week: match.week,
          opponentId: match.fighterIds.find(id => id !== "player"), result: match.winnerId == null ? "draw" : match.winnerId === "player" ? "win" : "loss", method: match.method })) };
    }
    const labels = Object.fromEntries(calendar.DEFAULT_TOURNAMENT_SCHEDULE.map(item => [item.id, item.name]));
    const medals = Object.entries(career.medals || {}).map(([id, value]) => ({ name: labels[id] || id,
      gold: number(value.gold), silver: number(value.silver), bronze: number(value.bronze) }))
      .filter(row => row.gold + row.silver + row.bronze > 0);
    return { view, offset, professional, week: number(career.week), player, fighters, names, selected, playerHistory,
      trackedSinceWeek: rosterState?.startWeek, medals, overview };
  }

  const viewButton = (id, label, className = "secondary-button") => `<button type="button" class="${className}" data-federation-view="${id}">${escape(label)}</button>`;
  const profileButton = (id, name) => `<button type="button" class="federation-name" data-federation-fighter="${escape(id)}">${escape(name)}</button>`;
  const badge = fighter => fighter.preparingForPlayer
    ? `<span class="federation-badge preparing">Prépare un combat contre toi · semaine ${fighter.fightWeek}</span>` : '<span class="federation-badge">Affilié</span>';

  function renderHistory(profile, context) {
    if (!profile) return '<p class="federation-empty">Le suivi du bassin n’a pas encore commencé pour cette carrière.</p>';
    const results = { win: "Victoire", loss: "Défaite", draw: "Match nul" };
    const methods = { decision: "Décision", ko: "KO", tko: "TKO" };
    const history = profile.history.map(match => `<li class="federation-match" data-federation-match="${escape(match.id)}">
      <span class="federation-result ${match.result}">${results[match.result]}</span><div>${profileButton(match.opponentId, context.names[match.opponentId])}<small>Semaine ${match.week}${match.method ? ` · ${escape(methods[String(match.method).toLowerCase()] || "Résultat officiel")}` : ""}</small></div></li>`).join("");
    const pages = profile.retainedCount > PAGE_SIZE ? `<nav class="federation-pagination" aria-label="Pages des résultats">
      <button class="secondary-button" type="button" data-federation-page="${Math.max(0, context.offset - PAGE_SIZE)}" ${context.offset === 0 ? "disabled" : ""}>Plus récents</button>
      <span>Page ${Math.floor(context.offset / PAGE_SIZE) + 1} sur ${Math.ceil(profile.retainedCount / PAGE_SIZE)}</span>
      <button class="secondary-button" type="button" data-federation-page="${context.offset + PAGE_SIZE}" ${context.offset + PAGE_SIZE >= profile.retainedCount ? "disabled" : ""}>Plus anciens</button></nav>` : "";
    const archived = profile.archivedCount ? `<details class="federation-archives"><summary>${profile.archivedCount} rencontre(s) archivée(s) · voir les cumuls</summary><p>Les détails les plus anciens ont été regroupés. Leurs résultats restent inclus dans les bilans.</p><ul>${profile.archivedOpponents.map(pair => `<li>${profileButton(pair.opponentId, context.names[pair.opponentId])}<span>${recordText(pair)} · semaines ${pair.firstWeek} à ${pair.lastWeek}</span></li>`).join("")}</ul></details>` : "";
    return `${history ? `<ol class="federation-history">${history}</ol>` : '<p class="federation-empty">Aucune rencontre suivie pour le moment.</p>'}${pages}${archived}`;
  }

  function renderTournament(event) {
    return `<article class="federation-card federation-tournament" data-federation-tournament="${escape(event.tournamentId)}">
      <div class="federation-row"><span class="federation-badge${event.booked || event.eligible ? " preparing" : ""}">${escape(event.status)}</span><strong>Semaine ${event.week}</strong></div>
      <h3>${escape(event.name)}</h3><p>${escape(event.date)} · ${escape(event.city)} · ${event.rounds} jours</p>
      <ul class="federation-conditions">${event.divisions.map(item => `<li>${item.label ? `<strong>${escape(item.label)}</strong> · ` : ""}${escape(item.condition)}<small>${escape(item.reason)}</small></li>`).join("")}</ul>
      <p>Date limite : ${escape(event.deadline)}<br>Inscription et déplacement : ${escape(event.cost)}</p>
      ${event.notice ? `<p class="federation-notice">${escape(event.notice)}</p>` : ""}</article>`;
  }

  function renderHome(context) {
    const next = context.overview.next;
    return `<div class="federation-home-grid"><section class="federation-card federation-intro"><p class="eyebrow">Ton parcours, au même endroit</p>
      <h3>Le circuit amateur</h3><p>Retrouve ton dossier, les compétitions et les boxeurs de ta catégorie. Les bilans évoluent au fil des semaines jouées.</p>
      <div class="federation-entry-grid">${viewButton("dossier", "Mon dossier amateur")}${viewButton("tournaments", "Parcours des tournois")}${viewButton("directory", "Site de la Fédération", "primary-button")}</div>
      <p class="federation-footnote">Consultation gratuite · aucun temps écoulé · aucun classement amateur</p></section>
      <section class="federation-card federation-next"><p class="eyebrow">Prochain tournoi admissible</p>${next ? `<span class="federation-week">Semaine ${next.week}</span><h3>${escape(next.name)}</h3><p>${escape(next.date)} · ${escape(next.status)}</p><p>Date limite : ${escape(next.deadline)}<br>Frais estimés : ${escape(next.cost)}</p>${next.notice ? `<p>${escape(next.notice)}</p>` : ""}` : '<h3>Aucune occasion admissible pour le moment</h3><p>Consulte les conditions du parcours pour préparer la suite.</p>'}${viewButton("tournaments", "Voir le parcours")}</section></div>
      ${context.overview.warnings.length ? `<section class="federation-card"><h3>Fenêtres à surveiller</h3><ul>${context.overview.warnings.map(warning => `<li>${escape(warning)}</li>`).join("")}</ul></section>` : ""}
      <section class="federation-card"><h3>Rendez-vous confirmés</h3>${context.overview.bookings.length ? `<ul>${context.overview.bookings.map(booking => `<li><strong>${escape(booking.name)}</strong> · semaine ${booking.week} · ${escape(booking.date)} · ${booking.cost} $ réglés</li>`).join("")}</ul>` : '<p>Aucune inscription en attente.</p>'}<button type="button" class="secondary-button" data-career-open-calendar>Ouvrir le calendrier</button><p class="federation-footnote">Les inscriptions et les choix d’adversaire se font uniquement dans le calendrier.</p></section>`;
  }

  function renderDossier(context) {
    return `<section class="federation-card"><p class="eyebrow">Ton dossier amateur</p><h3>${escape(context.player.name)}${context.player.nickname ? ` « ${escape(context.player.nickname)} »` : ""}</h3>
      <dl class="federation-facts"><div><dt>Catégorie</dt><dd>${escape(context.player.weightClass)}</dd></div><div><dt>Bilan officiel</dt><dd>${recordText(context.player.record)}</dd></div><div><dt>Combats amateurs</dt><dd>${total(context.player.record)}</dd></div><div><dt>Réputation</dt><dd>${context.player.reputation}/100</dd></div></dl></section>
      <section class="federation-card"><h3>Médailles</h3>${context.medals.length ? `<ul class="federation-medals">${context.medals.map(row => `<li><strong>${escape(row.name)}</strong><span>Or ${row.gold} · Argent ${row.silver} · Bronze ${row.bronze}</span></li>`).join("")}</ul>` : '<p>Aucune médaille pour le moment.</p>'}</section>
      <section class="federation-card"><h3>Mes rencontres avec les affiliés</h3><p>Suivi depuis la semaine ${context.trackedSinceWeek || "—"}. Ce registre couvre seulement les galas du bassin : les anciens combats et les tournois ne sont pas reconstruits ici. Ton bilan officiel les conserve.</p>${renderHistory(context.playerHistory, context)}</section>`;
  }

  function renderDirectory(context) {
    return `<section class="federation-directory"><div class="federation-section-title"><div><p class="eyebrow">Site de la Fédération · annuaire</p><h3>Les boxeurs de ta catégorie</h3></div><span>${context.fighters.length} affiliés · ${escape(context.player.weightClass)}</span></div>
      <p>Ordre alphabétique, sans classement sportif. Ouvre un nom pour consulter sa fiche et ses rencontres.</p>
      ${context.fighters.length ? `<ul class="federation-directory-grid">${context.fighters.map(fighter => `<li class="federation-card" data-federation-affiliate="${escape(fighter.id)}"><div class="federation-row">${profileButton(fighter.id, fighter.name)}<span class="federation-record">${recordText(fighter.record)}</span></div><p class="federation-nickname">« ${escape(fighter.nickname)} »</p><p>${escape(fighter.weightClass)} · ${escape(fighter.style)}</p>${badge(fighter)}</li>`).join("")}</ul>` : '<p class="federation-empty">Le bassin n’est pas encore disponible. Aucun résultat passé ne sera inventé.</p>'}</section>`;
  }

  function renderFighter(context) {
    const fighter = context.selected;
    if (!fighter) return `<section class="federation-card"><h3>Fiche indisponible</h3>${viewButton("directory", "Retour à l’annuaire")}</section>`;
    return `<div class="federation-profile-toolbar">${viewButton("directory", "Retour à l’annuaire")}</div>
      <div class="federation-profile-grid"><section class="federation-card"><p class="eyebrow">Fiche affiliée · ${escape(fighter.weightClass)}</p><h3>${escape(fighter.name)}</h3><p class="federation-nickname">« ${escape(fighter.nickname)} »</p>${badge(fighter)}<h4>${escape(fighter.style)}</h4><p>${escape(styleDescription(fighter.style))}</p><p class="federation-record-large">${recordText(fighter.record)}</p><p>Bilan avant le suivi : ${recordText(fighter.initialRecord)}.<br>Détails suivis depuis la semaine ${fighter.trackedSinceWeek}.</p></section>
      <section class="federation-card"><h3>Ses confrontations avec toi</h3>${total(fighter.againstPlayer) ? `<p class="federation-record-large">${recordText(fighter.againstPlayer)}</p><p>Du point de vue de ${escape(fighter.name)}, archives incluses.</p>` : '<p>Aucune rencontre suivie contre toi.</p>'}${profileButton("player", context.player.name + " (ton dossier)")}</section></div>
      <section class="federation-card"><h3>Rencontres suivies</h3><p>De la plus récente à la plus ancienne. Chaque résultat est présenté du point de vue de ce boxeur.</p>${renderHistory(fighter, context)}</section>`;
  }

  function render(context) {
    const active = context.view === "fighter" ? "directory" : context.view;
    const nav = context.professional ? "" : `<nav class="federation-nav" aria-label="Sections de la Fédération">${[["home", "Accueil"], ["dossier", "Mon dossier"], ["tournaments", "Tournois"], ["directory", "Affiliés"]].map(([id, label]) => `<button type="button" data-federation-view="${id}" ${active === id ? 'aria-current="page"' : ""}>${label}</button>`).join("")}</nav>`;
    const content = context.professional ? '<section class="federation-card"><h3>Le bureau professionnel reste à concevoir</h3><p>Les promoteurs et les contrats ne sont pas encore disponibles. Aucun service, inscription ou revenu professionnel n’est activé ici.</p></section>'
      : context.view === "directory" ? renderDirectory(context)
        : context.view === "fighter" ? renderFighter(context)
          : context.view === "dossier" ? renderDossier(context)
            : context.view === "tournaments" ? `<div class="federation-section-title"><h3>Parcours des tournois</h3><button type="button" class="secondary-button" data-career-open-calendar>Ouvrir le calendrier</button></div><p>Conditions et dates du calendrier actuel. L’admissibilité sportive ne garantit pas le budget ou la disponibilité des dates.</p><div class="federation-tournament-grid">${context.overview.events.map(renderTournament).join("")}</div>` : renderHome(context);
    return `<div class="career-federation-view career-place-view" data-federation-current-view="${context.view}"><header class="career-place-header"><div><p class="eyebrow">Centre-ville · consultation</p><h2 tabindex="-1">Fédération</h2><p class="career-place-meta">${context.professional ? "Professionnel · services à venir" : `Circuit amateur · ${escape(context.player.weightClass)} · semaine ${context.week}`}</p></div><button type="button" class="secondary-button" data-career-leave-federation>Retour au Centre-ville</button></header>${nav}<div class="federation-content">${content}</div><footer class="federation-footer">V = victoires · D = défaites · N = nuls. Consulter les dossiers ne fait pas avancer la semaine.</footer></div>`;
  }

  return Object.freeze({ PAGE_SIZE, buildContext, tournamentOverview, styleDescription, render });
});
