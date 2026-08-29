(function attachBoxeurWeekView(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurWeekView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurWeekViewApi() {
  "use strict";

  const ZONES = Object.freeze(["comfortable", "low", "critical", "blocked"]);
  const TONES = Object.freeze(["positive", "neutral", "warning", "critical"]);

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function boundedNumber(value, fallback, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
  }

  function wholeNumber(value, fallback, min, max) {
    return Math.round(boundedNumber(value, fallback, min, max));
  }

  function normalizeItem(rawItem, index = 0) {
    const item = rawItem && typeof rawItem === "object" ? rawItem : {};
    return {
      id: String(item.id || `week-item-${index + 1}`),
      label: item.label || "Activité planifiée",
      detail: item.detail || "Incluse dans la semaine.",
      dayLabel: item.dayLabel || item.day || "Placement automatique",
      cost: wholeNumber(item.cost, 0, -100, 200),
      tone: TONES.includes(item.tone) ? item.tone : "neutral",
      removable: item.removable !== false,
      kindLabel: item.kindLabel || "Activité",
    };
  }

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const rawCapacity = raw.capacity && typeof raw.capacity === "object" ? raw.capacity : {};
    const rawPlan = raw.plan && typeof raw.plan === "object" ? raw.plan : {};
    const rawQuick = raw.quick && typeof raw.quick === "object" ? raw.quick : {};
    const rawRisk = raw.risk && typeof raw.risk === "object" ? raw.risk : null;
    const total = wholeNumber(rawCapacity.total, 100, 1, 200);
    const remaining = wholeNumber(rawCapacity.remaining, total, 0, total);
    const spent = wholeNumber(rawCapacity.spent, total - remaining, 0, total);
    const zone = ZONES.includes(rawCapacity.zone) ? rawCapacity.zone : remaining <= 0 ? "blocked" : remaining <= 12 ? "critical" : remaining <= 28 ? "low" : "comfortable";
    const items = Array.isArray(rawPlan.items) ? rawPlan.items.slice(0, 20).map(normalizeItem) : [];
    const available = raw.confirm?.available !== false && raw.confirmAvailable !== false;
    return {
      week: wholeNumber(raw.week, 1, 1, 99999),
      capacity: {
        total,
        remaining,
        spent,
        zone,
        zoneLabel: rawCapacity.zoneLabel || ({ comfortable: "Réserve confortable", low: "Réserve faible", critical: "Surcharge probable", blocked: "Capacité épuisée" })[zone],
        detail: rawCapacity.detail || "La réserve inutilisée aide la récupération de la prochaine semaine.",
        unavailable: wholeNumber(rawCapacity.unavailable, 0, 0, total),
      },
      quick: {
        available: rawQuick.available !== false,
        label: rawQuick.label || "Suivre le plan rapide",
        detail: rawQuick.detail || "Crée une semaine équilibrée que tu peux encore modifier avant de la confirmer.",
        reason: rawQuick.reason || "",
      },
      plan: {
        title: rawPlan.title || "Plan de la semaine",
        summary: rawPlan.summary || "Visite les lieux pour ajouter des activités, puis confirme lorsque le programme te convient.",
        items,
        editable: rawPlan.editable !== false,
      },
      confirm: {
        available,
        label: raw.confirm?.label || "Confirmer la semaine",
        reason: raw.confirm?.reason || raw.confirmReason || "",
      },
      risk: rawRisk && rawRisk.kind !== "none" ? {
        kind: rawRisk.kind || "warning",
        tone: TONES.includes(rawRisk.tone) ? rawRisk.tone : "warning",
        title: rawRisk.title || "Récupération à surveiller",
        detail: rawRisk.detail || "La condition du boxeur pourrait réduire la capacité de la prochaine semaine.",
      } : null,
    };
  }

  function capacityMarkup(context, compact = false) {
    const capacity = context.capacity;
    return `<section class="v2-week-capacity ${capacity.zone}" aria-labelledby="v2-week-capacity-title">
      <div class="v2-week-capacity-heading"><span id="v2-week-capacity-title">Capacité restante de la semaine</span><strong>${capacity.remaining}/${capacity.total}</strong></div>
      <progress max="${capacity.total}" value="${capacity.remaining}" aria-label="Capacité restante de la semaine : ${capacity.remaining} sur ${capacity.total}">${capacity.remaining}/${capacity.total}</progress>
      <div class="v2-week-capacity-meta"><b>${escapeHTML(capacity.zoneLabel)}</b><span>${capacity.spent} capacité réservée</span></div>
      ${compact ? "" : `<p>${escapeHTML(capacity.detail)}</p>`}
    </section>`;
  }

  function compactPlanMarkup(context) {
    if (!context.plan.items.length) return `<p class="v2-week-empty">Aucune activité facultative n’est encore planifiée.</p>`;
    const visible = context.plan.items.slice(0, 4);
    const extra = context.plan.items.length - visible.length;
    return `<ul class="v2-week-compact-items" aria-label="Activités déjà planifiées">${visible.map(item => `<li class="${item.tone}"><span>${escapeHTML(item.label)}</span><b>${item.cost > 0 ? `−${item.cost}` : item.cost < 0 ? `+${Math.abs(item.cost)}` : "Prévu"}</b></li>`).join("")}</ul>${extra > 0 ? `<p class="v2-week-more">+${extra} autre${extra > 1 ? "s" : ""} activité${extra > 1 ? "s" : ""}</p>` : ""}`;
  }

  function renderLauncher(rawContext) {
    const context = normalizeContext(rawContext);
    const quickDisabled = context.quick.available ? "" : ' disabled aria-disabled="true"';
    const reason = context.confirm.reason || context.quick.reason;
    return `<section class="v2-week-launcher" data-v2-week-zone="${context.capacity.zone}" aria-labelledby="v2-week-launcher-title">
      <div class="v2-week-launcher-heading"><div><p class="eyebrow">Semaine ${context.week} · plan modifiable</p><h3 id="v2-week-launcher-title">Bâtis ta semaine</h3></div><span>${context.plan.items.length} choix</span></div>
      ${capacityMarkup(context, true)}
      ${compactPlanMarkup(context)}
      <div class="v2-week-launcher-actions">
        <button type="button" class="secondary-button" data-v2-week-quick${quickDisabled}>${escapeHTML(context.quick.label)}</button>
        <button type="button" class="primary-button" data-v2-week-detailed>Confirmer semaine</button>
      </div>
      ${reason ? `<p class="v2-week-blocker" role="status">${escapeHTML(reason)}</p>` : ""}
    </section>`;
  }

  function planItemMarkup(item) {
    const cost = item.cost > 0 ? `−${item.cost} capacité` : item.cost < 0 ? `+${Math.abs(item.cost)} capacité` : "Aucun coût";
    const action = item.removable
      ? `<button type="button" data-v2-week-remove="${escapeHTML(item.id)}" aria-label="Retirer ${escapeHTML(item.label)} du plan">Retirer</button>`
      : `<span class="v2-week-item-fixed">Prévu par défaut</span>`;
    return `<li class="${item.tone}"><div><span>${escapeHTML(item.kindLabel)} · ${escapeHTML(item.dayLabel)}</span><strong>${escapeHTML(item.label)}</strong><small>${escapeHTML(item.detail)}</small></div><div><b>${cost}</b>${action}</div></li>`;
  }

  function renderPlan(rawContext) {
    const context = normalizeContext(rawContext);
    const items = context.plan.items.length
      ? context.plan.items.map(planItemMarkup).join("")
      : `<li class="neutral v2-week-plan-empty"><div><strong>Ton plan est vide</strong><small>Retourne à la carte et visite un lieu pour ajouter une activité.</small></div></li>`;
    const confirmDisabled = context.confirm.available ? "" : ' disabled aria-disabled="true"';
    return `<section class="v2-week-plan" aria-labelledby="v2-week-plan-title">
      <header><div><p class="eyebrow">Semaine ${context.week} · tout reste modifiable</p><h2 id="v2-week-plan-title">${escapeHTML(context.plan.title)}</h2></div><button type="button" data-v2-week-plan-close aria-label="Fermer le plan de la semaine">Fermer</button></header>
      <p>${escapeHTML(context.plan.summary)}</p>
      ${capacityMarkup(context)}
      ${context.risk ? `<aside class="v2-week-risk ${context.risk.tone}" role="note"><span aria-hidden="true">!</span><div><strong>${escapeHTML(context.risk.title)}</strong><p>${escapeHTML(context.risk.detail)}</p></div></aside>` : ""}
      <ul class="v2-week-plan-items" aria-label="Contenu du programme">${items}</ul>
      <p class="v2-week-engine-note">Les activités ne sont pas encore accomplies. Elles seront résolues seulement lorsque tu confirmeras la semaine.</p>
      ${context.confirm.reason ? `<p class="v2-week-blocker" role="status">${escapeHTML(context.confirm.reason)}</p>` : ""}
      <footer><button type="button" class="secondary-button" data-v2-week-plan-close>Continuer à planifier</button><button type="button" class="primary-button" data-v2-week-confirm${confirmDisabled}>${escapeHTML(context.confirm.label)}</button></footer>
    </section>`;
  }

  function normalizeSummaryItem(rawItem) {
    const item = rawItem && typeof rawItem === "object" ? rawItem : {};
    return { label: item.label || "Bilan", detail: item.detail || "À jour", tone: TONES.includes(item.tone) ? item.tone : "neutral" };
  }

  function renderSummary(rawSummary) {
    const raw = rawSummary && typeof rawSummary === "object" ? rawSummary : {};
    const changes = Array.isArray(raw.changes) ? raw.changes.slice(0, 12).map(normalizeSummaryItem) : [];
    const events = Array.isArray(raw.events) ? raw.events.slice(0, 10).map(normalizeSummaryItem) : [];
    const changesMarkup = changes.length
      ? changes.map(item => `<li class="${item.tone}"><span>${escapeHTML(item.label)}</span><strong>${escapeHTML(item.detail)}</strong></li>`).join("")
      : `<li class="neutral"><span>Bilan</span><strong>Semaine terminée</strong></li>`;
    const eventsMarkup = events.length
      ? `<section class="v2-week-summary-events" aria-labelledby="v2-week-alerts-title"><h3 id="v2-week-alerts-title">À retenir</h3><ul>${events.map(item => `<li class="${item.tone}"><strong>${escapeHTML(item.label)}</strong><span>${escapeHTML(item.detail)}</span></li>`).join("")}</ul></section>`
      : "";
    const weekFrom = wholeNumber(raw.weekFrom, 1, 1, 99999);
    const weekTo = wholeNumber(raw.weekTo, weekFrom + 1, weekFrom, 99999);
    const guide = raw.guide && typeof raw.guide === "object"
      ? `<section class="v2-week-summary-guide" aria-labelledby="v2-week-summary-guide-title"><p class="eyebrow">Guide récréatif</p><h3 id="v2-week-summary-guide-title">${escapeHTML(raw.guide.title || "Comprendre le bilan")}</h3><p>${escapeHTML(raw.guide.detail || "Ce bilan résume les effets de la semaine.")}</p>${raw.guide.next ? `<strong>${escapeHTML(raw.guide.next)}</strong>` : ""}</section>`
      : "";
    return `<section class="v2-week-summary" aria-labelledby="v2-week-summary-title" aria-live="polite">
      <p class="eyebrow">Semaine ${weekFrom} terminée</p><h2 id="v2-week-summary-title">${escapeHTML(raw.title || `Bienvenue à la semaine ${weekTo}`)}</h2>
      <p>${escapeHTML(raw.summary || "Ton plan, ton emploi et ta récupération ont été résolus.")}</p>
      ${guide}
      <ul class="v2-week-summary-changes" aria-label="Changements de la semaine">${changesMarkup}</ul>
      ${eventsMarkup}
      <div class="v2-week-summary-actions"><button type="button" class="primary-button" data-v2-week-summary-close>${escapeHTML(raw.actionLabel || "Retour à la carte")}</button></div>
    </section>`;
  }

  return Object.freeze({ ZONES, normalizeContext, renderLauncher, renderPlan, renderSummary });
});
