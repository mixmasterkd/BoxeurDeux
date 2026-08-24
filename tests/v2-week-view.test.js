"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const view = require("../v2-week-view.js");

test("normalise la capacité hebdomadaire et déduit une zone lisible", () => {
  const context = view.normalizeContext({
    week: 3,
    capacity: { total: 100, remaining: 24, spent: 76 },
  });

  assert.equal(context.week, 3);
  assert.deepEqual(context.capacity, {
    total: 100,
    remaining: 24,
    spent: 76,
    zone: "low",
    zoneLabel: "Réserve faible",
    detail: "La réserve inutilisée aide la récupération de la prochaine semaine.",
  });
});

test("le lanceur montre l'énergie restante et mène au bâtisseur avant la confirmation", () => {
  const html = view.renderLauncher({
    week: 4,
    capacity: {
      total: 120,
      remaining: 73,
      spent: 47,
      zone: "comfortable",
      zoneLabel: "Bonne réserve",
    },
    plan: {
      items: [
        { id: "work", label: "Emploi", cost: 28, removable: false },
        { id: "gym", label: "Séance du coach", cost: 19, tone: "positive" },
      ],
    },
  });

  assert.match(html, /Semaine 4 · plan modifiable/);
  assert.match(html, /Énergie restante de la semaine/);
  assert.match(html, /<progress max="120" value="73" aria-label="Énergie restante de la semaine : 73 sur 120">/);
  assert.match(html, /47 énergie réservée/);
  assert.match(html, /2 choix/);
  assert.match(html, /data-v2-week-detailed/);
  assert.match(html, /Confirmer semaine/);
  assert.match(html, /data-v2-week-quick/);
  assert.doesNotMatch(html, /data-v2-week-confirm/);
  assert.doesNotMatch(html, /data-v2-week-handoff/);
});

test("le plan rapide reste disponible et le lanceur mène au bâtisseur avant la confirmation", () => {
  const html = view.renderLauncher({
    quick: {
      label: "Appliquer mon plan rapide",
      detail: "Un programme équilibré qui reste modifiable.",
    },
    plan: {
      items: [
        { label: "Travail", cost: 28 },
        { label: "Cours de groupe", cost: 20 },
        { label: "Repos à la maison", cost: -8 },
        { label: "Cuisine", cost: 0 },
        { label: "Corde à danser", cost: 9 },
      ],
    },
  });

  assert.match(html, /Appliquer mon plan rapide/);
  assert.match(html, /Travail/);
  assert.match(html, /−28/);
  assert.match(html, /\+8/);
  assert.match(html, /Cuisine[\s\S]*Prévu/);
  assert.match(html, /\+1 autre activité/);
  assert.match(html, /Confirmer semaine/);
});

test("le plan rapide peut être bloqué et la confirmation reste dans le bâtisseur", () => {
  const launcher = view.renderLauncher({
    quick: { available: false, reason: "Choisis d’abord ton emploi." },
    confirm: { available: true },
  });
  const confirmBlocked = view.renderPlan({
    confirm: { available: false, reason: "Le plan dépasse ton énergie disponible." },
  });

  assert.match(launcher, /data-v2-week-quick disabled aria-disabled="true"/);
  assert.match(launcher, /data-v2-week-detailed/);
  assert.doesNotMatch(launcher, /data-v2-week-confirm/);
  assert.match(launcher, /role="status">Choisis d’abord ton emploi\./);

  assert.match(confirmBlocked, /data-v2-week-confirm disabled aria-disabled="true"/);
  assert.match(confirmBlocked, /role="status">Le plan dépasse ton énergie disponible\./);
});

test("le plan détaillé permet de retirer les choix facultatifs mais protège les engagements fixes", () => {
  const html = view.renderPlan({
    week: 2,
    capacity: { total: 100, remaining: 53, spent: 47 },
    plan: {
      title: "Technique & récupération",
      summary: "Tout peut encore changer avant la confirmation.",
      items: [
        {
          id: "work-default",
          kindLabel: "Emploi",
          dayLabel: "Lundi au vendredi",
          label: "Entrepôt",
          detail: "Salaire prévu cette semaine.",
          cost: 28,
          removable: false,
        },
        {
          id: "gym-<jab>",
          kindLabel: "GYM de boxe",
          dayLabel: "Mercredi soir",
          label: "Mitaines <techniques>",
          detail: "Travail de précision.",
          cost: 19,
          removable: true,
        },
      ],
    },
  });

  assert.match(html, /id="v2-week-plan-title">Technique &amp; récupération/);
  assert.match(html, /Emploi · Lundi au vendredi/);
  assert.match(html, /Prévu par défaut/);
  assert.match(html, /Mitaines &lt;techniques&gt;/);
  assert.match(html, /data-v2-week-remove="gym-&lt;jab&gt;"/);
  assert.match(html, /aria-label="Retirer Mitaines &lt;techniques&gt; du plan"/);
  assert.doesNotMatch(html, /data-v2-week-remove="work-default"/);
  assert.match(html, /data-v2-week-plan-close aria-label="Fermer le plan de la semaine"/);
  assert.match(html, /résolues seulement lorsque tu confirmeras la semaine/);
});

test("un plan vide explique comment ajouter une activité", () => {
  const html = view.renderPlan({ plan: { items: [] } });

  assert.match(html, /Ton plan est vide/);
  assert.match(html, /Retourne à la carte et visite un lieu/);
  assert.match(html, /aria-label="Contenu du programme"/);
});

test("le bilan échappe les données et annonce les résultats importants", () => {
  const html = view.renderSummary({
    weekFrom: 2,
    weekTo: 3,
    title: "Bienvenue <champion>",
    changes: [{ label: "Argent", detail: "+100 $", tone: "positive" }],
    events: [{ label: "Attention", detail: "Abonnement bientôt expiré", tone: "warning" }],
  });

  assert.match(html, /Semaine 2 terminée/);
  assert.match(html, /Bienvenue &lt;champion&gt;/);
  assert.match(html, /\+100 \$/);
  assert.match(html, /Abonnement bientôt expiré/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /data-v2-week-summary-close/);
});

test("explique le premier bilan guidé et annonce la semaine suivante", () => {
  const html = view.renderSummary({
    weekFrom: 1,
    weekTo: 2,
    title: "Bienvenue à la semaine 2",
    guide: {
      title: "Comment lire ton premier bilan",
      detail: "Énergie et fatigue résument le coût du programme.",
      next: "Le guide affichera l’objectif suivant.",
    },
    actionLabel: "Continuer vers la semaine 2",
  });
  assert.match(html, /v2-week-summary-guide/);
  assert.match(html, /Comment lire ton premier bilan/);
  assert.match(html, /Continuer vers la semaine 2/);
});
