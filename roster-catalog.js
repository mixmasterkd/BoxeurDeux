(function attachRosterCatalog(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurRosterCatalog = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createRosterCatalog() {
  "use strict";

  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freeze);
    return Object.freeze(value);
  }

  // Shared identities for the live roster and legacy gala migration.
  // counterpartId gives both divisions the same development distribution.
  const definitions = [
    ["leclerc", "Technicien", 36, 46,
      ["leclerc", "Thomas Leclerc", "BETON", 1, 1],
      ["f-beaulieu", "Camille Beaulieu", "La Boussole", 1, 1]],
    ["kramer", "Défensif", 34, 44,
      ["kramer", "Maxime Kramer", "THE QUITTER", 0, 2],
      ["f-kim", "Naomi Kim", "L’Insaisissable", 0, 2]],
    ["okafor", "Puncheur", 40, 54,
      ["okafor", "Darnell Okafor", "Brick", 2, 1],
      ["f-okafor", "Amara Okafor", "La Brique", 2, 1]],
    ["martel", "Contre-attaquant", 43, 58,
      ["martel", "Émile Martel", "Le Serein", 2, 2],
      ["f-martel", "Élodie Martel", "La Sereine", 2, 2]],
    ["gagnon", "Bagarreur", 44, 60,
      ["gagnon", "Olivier Gagnon", "Le Bûcheron", 3, 2],
      ["f-gagnon", "Marianne Gagnon", "La Forge", 3, 2]],
    ["nguyen", "Boxeur mobile", 42, 64,
      ["nguyen", "Minh Nguyen", "Vif-Argent", 3, 0],
      ["f-nguyen", "Linh Nguyen", "Vif-Argent", 3, 1]],
    ["bouchard", "Défensif", 46, 62,
      ["bouchard", "Samuel Bouchard", "Le Mur", 4, 3],
      ["f-bouchard", "Sophie Bouchard", "La Garde", 4, 3]],
    ["haddad", "Contre-attaquant", 45, 66,
      ["haddad", "Yanis Haddad", "Le Cobra", 4, 1],
      ["f-haddad", "Maya Haddad", "La Vipère", 3, 1]],
    ["wilson", "Technicien", 41, 56,
      ["wilson", "Jayden Wilson", "Quickstep", 2, 2],
      ["f-wilson", "Avery Wilson", "North Star", 2, 2]],
    ["caron", "Puncheur", 48, 68,
      ["caron", "Alexis Caron", "La Masse", 5, 3],
      ["f-caron", "Maude Caron", "La Masse", 5, 3]],
  ];

  const CATALOG = freeze(Object.fromEntries(["male", "female"].map((sex, division) => [
    sex,
    definitions.map(([counterpartId, style, initialLevel, ceiling, ...identities]) => {
      const [id, name, nickname, wins, losses] = identities[division];
      return { id, counterpartId, name, nickname, style, initialLevel, ceiling, initialRecord: { wins, losses, draws: 0 } };
    }),
  ])));

  function list(sex) {
    if (!Object.hasOwn(CATALOG, sex)) throw new TypeError("Division du bassin inconnue.");
    return CATALOG[sex];
  }

  return Object.freeze({ VERSION: 1, CATALOG, list });
});
