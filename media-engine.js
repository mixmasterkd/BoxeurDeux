(function attachBoxeurMedia(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurMedia = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurMediaApi() {
  "use strict";

  const FAMILY_ID = "media";
  const LOCATION_ID = "media-studio";

  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  const CATALOG = freeze({
    interview: {
      id: "interview",
      plannerId: "media:interview",
      label: "Entrevue locale",
      detail: "Quelques questions devant les caméras",
      description: "Une courte entrevue pour faire connaître ton parcours au public local.",
      requiredReputation: 0,
      capacityCost: 4,
      reputationGain: 1,
    },
    photoshoot: {
      id: "photoshoot",
      plannerId: "media:photoshoot",
      label: "Séance photo",
      detail: "Portraits pour la presse sportive",
      description: "Une séance professionnelle qui donne à ton image un peu plus de portée.",
      requiredReputation: 10,
      capacityCost: 5,
      reputationGain: 2,
    },
    podcast: {
      id: "podcast",
      plannerId: "media:podcast",
      label: "Balado sportif",
      detail: "Conversation longue avec des passionnés",
      description: "Un échange approfondi qui permet au public de mieux connaître le boxeur derrière les gants.",
      requiredReputation: 20,
      capacityCost: 6,
      reputationGain: 2,
    },
    appearance: {
      id: "appearance",
      plannerId: "media:appearance",
      label: "Apparition publique",
      detail: "Rencontre devant un petit public",
      description: "Une présence plus exigeante qui offre la meilleure visibilité de la semaine.",
      requiredReputation: 35,
      capacityCost: 8,
      reputationGain: 3,
    },
  });

  function getActivity(activityInput) {
    const id = String(activityInput == null ? "" : activityInput);
    return CATALOG[id] || Object.values(CATALOG).find(activity => activity.plannerId === id) || null;
  }

  function plannerDefinition(activityInput) {
    const activity = getActivity(activityInput);
    if (!activity) throw new Error("Cette apparition média n’existe pas.");
    return {
      id: activity.plannerId,
      label: `Média · ${activity.label}`,
      category: FAMILY_ID,
      location: LOCATION_ID,
      physical: false,
      capacityCost: activity.capacityCost,
      energyCost: 0,
      energyGain: 0,
      fatigueDelta: 0,
      allowedCareerStatuses: ["amateur", "professional"],
      metadata: {
        plannerType: FAMILY_ID,
        mediaActivityId: activity.id,
        familyId: FAMILY_ID,
        programSignature: `${FAMILY_ID}:${activity.id}`,
        reputationGain: activity.reputationGain,
        fatigueGain: 0,
        fatigueRelief: 0,
      },
    };
  }

  return Object.freeze({ FAMILY_ID, LOCATION_ID, CATALOG, getActivity, plannerDefinition });
});
