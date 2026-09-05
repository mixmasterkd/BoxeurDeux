# BE-D — Fédération, annuaire et historiques

## Résultat

Le GO suivant BE-C autorise l’intégration de l’interface de consultation. La Fédération est désormais accessible dans le Centre-ville après le premier résultat amateur officiel. Elle reste fermée lorsque le verrou d’Aréna impose de régler le combat.

L’accueil propose le dossier du joueur, les six parcours de tournoi, le site de la Fédération et un accès au calendrier existant. Aucun second système d’inscription n’est créé.

## Contenu livré

- Annuaire alphabétique des dix affiliés du sexe et de la catégorie du personnage, sans classement sportif.
- Fiches avec nom, surnom, style expliqué, bilan V/D/N et préparation contre le joueur lorsqu’une réservation existe.
- Distinction explicite entre bilan antérieur et rencontres suivies depuis la création du bassin. Aucun ancien combat inventé.
- Résultats récents, adversaires cliquables, résultats inverses entre les deux fiches et confrontations avec le joueur.
- Dix rencontres par page; archives présentées séparément avec leurs cumuls, toujours inclus dans les bilans.
- Dossier du joueur : bilan amateur officiel, catégorie, réputation, toutes les médailles et ses rencontres suivies avec les affiliés.
- Dates, semaines, échéances, coûts et admissibilité tirés du moteur du calendrier, y compris les projections des combats réservés et les deux divisions de la Coupe régionale.
- Même contenu sur ordinateur et mobile; retour à la position et au nom consulté dans l’annuaire, navigation clavier et fermeture par Échap.
- Page informative seulement au statut professionnel, sans contrats ni inscription amateur.

## Protection des systèmes existants

`federation-view.js` produit uniquement un contexte public et du HTML. Il ne fait pas avancer le bassin et ne réécrit aucune donnée de carrière. Les statistiques précises, plafonds et probabilités ne sont pas exposés sur le site.

Le raccordement dans `script.js` réutilise la fenêtre de lieu et son mécanisme de focus. Il évite volontairement de reconstruire le planificateur ou de normaliser la capsule lorsqu’on consulte la Fédération.

Les moteurs de combat, de progression, de semaine, de réservation et de tournoi ne sont pas modifiés par BE-D. Les modifications déjà présentes des lots antérieurs sont conservées.

## Vérifications

- `node tests/federation-view.test.js` : **11 cas réussis**, dont deux bassins, consultation immuable, réservations, résultats inverses, pagination, archives sur 1 120 semaines, anciennes carrières, médailles, projections, échéances, budget et échappement HTML.
- `npm test` : **33 fichiers de tests réussis**.
- `npm run test:browser -- --workers=1` : **62 scénarios réussis** en environ 4,6 minutes, y compris les parcours récréatifs, l’Aréna, le travail, les vacances, les séances privées, les suppléments, les tournois et les médailles.
- Scénarios navigateur BE-D : **3 réussis**. Navigation complète à 1366 × 900 et 390 × 844, puis affiliées et accès professionnels à 360 × 800.
- Les tests navigateur comparent à l’identique l’ensemble du stockage local, l’état de carrière et la capsule avant/après consultation. Ils vérifient le retour du focus, la position de l’annuaire, la pagination, les résultats des deux côtés, les médailles, le calendrier et l’absence de débordement horizontal.
- Captures ordinateur/mobile examinées; aucune erreur JavaScript dans les scénarios BE-D.
- Vérifications de syntaxe des scripts et `git diff --check` réussies.

### Partie de test dans le Chrome de l’utilisateur

Avec l’autorisation de modifier cette partie, le plan déjà présent de la semaine 18 a été confirmé : balado et emploi Coursier local. La partie est passée à la semaine 19; la paie de 100 $ a été versée normalement, portant le solde de 452 $ à 552 $.

La clôture a produit **Émile Martel contre Olivier Gagnon, semaine 18, décision**. L’annuaire et les deux fiches montrent respectivement la victoire et la défaite. Le lien d’adversaire passe directement à l’autre fiche. Le suivi débute bien à la semaine 18, sans reconstruire les semaines antérieures. Aucune erreur ni avertissement dans la console Chrome au cours de cette vérification.

## Limites et prochain GO

Les rencontres des tournois et les anciens combats du joueur ne sont pas reconstruits dans le registre des affiliés; ils restent compris dans son bilan officiel. Les adversaires de tournoi ne sont pas fusionnés avec le bassin.

L’interface utilise un habillage HTML/CSS. Les deux illustrations du bureau de Fédération, déjà préparées dans `FEDERATION-ASSET-PROMPTS.md`, restent en attente d’un GO distinct.

**BE-E reste à autoriser** : validation du parcours complet et équilibrage contre différentes progressions du joueur sur ordinateur/mobile. Les tests de BE-D ne constituent pas une validation de l’équilibrage d’une carrière complète. Aucun commit ni push effectué.
