(function attachBoxeurLeisure(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurLeisure = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurLeisureApi() {
  "use strict";

  const FAMILY_ID = "leisure";
  const LOCATION_ID = "leisure-center";

  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  const CATALOG = freeze({
    bowling: {
      id: "bowling",
      plannerId: "leisure:bowling",
      label: "Quilles",
      detail: "Une partie entre amis",
      description: "Une sortie sociale simple pour décrocher sans sacrifier une grande partie de la semaine.",
      price: 30,
      capacityCost: 6,
      energyGain: 3,
      fatigueRelief: 4,
    },
    cinema: {
      id: "cinema",
      plannerId: "leisure:cinema",
      label: "Cinéma",
      detail: "Décrocher devant un film",
      description: "La sortie la plus calme du centre, utile pour souffler à coût modéré.",
      price: 25,
      capacityCost: 5,
      energyGain: 4,
      fatigueRelief: 5,
    },
    arcade: {
      id: "arcade",
      plannerId: "leisure:arcade",
      label: "Arcade",
      detail: "Jeux et défis amicaux",
      description: "L’option la plus abordable pour voir des amis et changer d’air.",
      price: 20,
      capacityCost: 5,
      energyGain: 2,
      fatigueRelief: 3,
    },
    karting: {
      id: "karting",
      plannerId: "leisure:karting",
      label: "Karting",
      detail: "Quelques tours de piste",
      description: "Une sortie plus chère et plus longue, choisie pour le plaisir plutôt que pour l’entraînement.",
      price: 60,
      capacityCost: 8,
      energyGain: 2,
      fatigueRelief: 3,
    },
  });

  function getActivity(activityInput) {
    const id = String(activityInput == null ? "" : activityInput);
    return CATALOG[id] || Object.values(CATALOG).find(activity => activity.plannerId === id) || null;
  }

  function plannerDefinition(activityInput) {
    const activity = getActivity(activityInput);
    if (!activity) throw new Error("Cette sortie n’existe pas.");
    return {
      id: activity.plannerId,
      label: `Sortie · ${activity.label}`,
      category: "leisure",
      location: LOCATION_ID,
      physical: false,
      capacityCost: activity.capacityCost,
      energyCost: 0,
      energyGain: activity.energyGain,
      fatigueDelta: -activity.fatigueRelief,
      allowedCareerStatuses: ["amateur", "professional"],
      metadata: {
        plannerType: FAMILY_ID,
        leisureActivityId: activity.id,
        familyId: FAMILY_ID,
        programSignature: `${FAMILY_ID}:${activity.id}`,
        moneyCost: activity.price,
        fatigueGain: 0,
        fatigueRelief: activity.fatigueRelief,
      },
    };
  }

  return Object.freeze({ FAMILY_ID, LOCATION_ID, CATALOG, getActivity, plannerDefinition });
});
