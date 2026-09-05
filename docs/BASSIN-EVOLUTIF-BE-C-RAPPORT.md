# BE-C — raccordement du bassin à la carrière

## Résultat

Le bassin évolutif est maintenant chargé par le jeu et raccordé aux galas, à la clôture des semaines et aux sauvegardes. Cette étape n'ajoute pas encore l'annuaire ni les fiches de la Fédération : leur interface appartient à BE-D.

## Changements livrés

- `roster-career.js` relie le moteur isolé aux données de carrière, avec initialisation, migration, validation des réservations et sélection déterministe des offres.
- `state.rosterState` est la source persistante du bassin dans la sauvegarde principale et l'export JSON. La synchronisation de la capsule hebdomadaire ne l'écrase pas avec son ancienne copie de migration.
- Les dix profils sont créés au passage amateur, après la remise à la semaine 1. Aucun bassin n'est créé ni simulé pendant le récréatif; la simulation amateur n'est pas poursuivie en professionnel.
- Les galas sélectionnent jusqu'à trois affiliés distincts selon les cibles des créneaux existants. Les caractéristiques et bilans ne sont plus ajustés à chaque proposition selon le joueur.
- L'ancien générateur adaptatif de galas est retiré. Les identités sont centralisées dans `roster-catalog.js`; les valeurs historiques nécessaires aux tests de compatibilité sont conservées dans une fixture de test.
- Le calendrier affiche le risque réel des adversaires. Si le joueur dépasse tout le bassin, le conseil du coach invite à consulter les tournois admissibles.
- La disponibilité et l'identité affichée sont revérifiées avant paiement. Une proposition devenue périmée ne réserve pas silencieusement une autre personne.
- La réservation protège la fiche jusqu'au résultat ou au désistement. Le ring reçoit les mêmes statistiques, fractions comprises.
- Le résultat officiel de gala met à jour le bilan inverse de l'affilié une seule fois. Les récompenses et le bilan du joueur restent gérés par le traitement de combat existant.
- Le calcul hebdomadaire intervient après la clôture réelle, jamais à l'ouverture d'une carte ou du calendrier. Il attend le combat derrière le verrou d'Aréna et ne se répète pas entre les journées d'un tournoi.

Les dates, tarifs, règles d'inscription, déplacements et moteurs de combat/tournoi ne sont pas remplacés. Aucun serveur, compte, Supabase, minuteur de simulation ou nouvelle dépendance n'est ajouté.

## Sauvegardes et migration

Une ancienne carrière amateur débute son suivi à sa semaine actuelle, avec l'adaptation de niveau initiale unique prévue dans la conception. Aucune ancienne semaine n'est simulée et aucun résultat n'est déduit du journal narratif.

Pour un adversaire déjà réservé :

- un identifiant de catalogue exact ou un identifiant de gala composé sans ambiguïté peut être relié au bassin;
- sa fiche effective devient la fiche initiale de cet affilié, en conservant son bilan, ses statistiques et au minimum ses plafonds actuels;
- la date, les frais et la graine de combat restent ceux du rendez-vous existant;
- un adversaire non reconnu reste un adversaire historique pour ce combat; aucun rapprochement n'est fait par son seul nom;
- les galas différés dans un tournoi ou un sparring restent protégés;
- les très anciennes parties sans division confirmée attendent ce choix avant de créer le bassin.

Un bassin déjà présent est repris tel quel. Une version inconnue, une division incohérente, un bilan corrompu, un décalage de semaine ou une fiche réservée modifiée provoque un refus de chargement, pas une remise à zéro silencieuse.

Le schéma de carrière reste en version 6 : l'ajout est compatible et le bassin dispose de ses propres versions de schéma et de règles. Les identifiants, réservations, résultats et archives sont inclus automatiquement dans l'export complet existant. Une capsule importée d'une autre semaine est également refusée.

Les offres ne nécessitent pas une deuxième liste persistante : leurs références sont dérivées du bassin sauvegardé, de la semaine, du gala et de la force actuelle du joueur. À état identique, elles restent identiques après rechargement. Leur affichage n'écrit pas dans le bassin ni ne consomme le hasard des combats.

## Validation

Vérification finale du 4 septembre 2026 :

- **38 cas ciblés réussis** : 26 pour le moteur et 12 pour le raccordement/migration.
- **32 fichiers de tests techniques sur 32 réussis** avec `npm test`.
- **59 scénarios Chromium sur 59 réussis** avec `npm run test:browser -- --workers=1` (environ 4,1 minutes).
- Syntaxe de `script.js` et `roster-career.js`, ainsi que `git diff --check` : aucune erreur.

La suite navigateur vérifie aussi le récréatif et son passage automatique amateur, le travail et les vacances, les entraînements privés et suppléments, les loisirs, les activités média, les deux cartes, les tournois ordinaires et olympiques, ainsi que les médailles. Aucune régression détectée dans ces scénarios.

Les tests ciblés couvrent notamment les vingt profils historiques, la migration avancée, l'absence de rattrapage, la protection des réservations, les galas différés, les erreurs d'importation, les offres distinctes et les doubles traitements. Des scénarios Chromium vérifient également deux semaines de préparation, les rechargements, le verrou d'Aréna, un combat réel, le désistement et le téléchargement/réimportation JSON.

Pour reproduire : `npm run test:roster`, `npm test`, puis `npm run test:browser -- --workers=1`. Le serveur HTTP de test nécessite l'ouverture d'un port local; il utilise une origine et des sauvegardes distinctes de la partie sur le port 5501.

## Limites et prochain GO

- Les vérifications utilisent des sauvegardes isolées de test; la partie ouverte dans Chrome du joueur n'a pas été modifiée.
- Les dimensions mobiles sont testées dans Chromium sur ordinateur, pas sur un téléphone physique.
- Les règles de progression et les plafonds de BE-B sont conservés. L'équilibrage d'une carrière complète et les mesures de performance sur appareil mobile restent à BE-E.
- Les résultats sont enregistrés dès maintenant; leur consultation détaillée dans la Fédération attend BE-D.
- Les deux visuels de Fédération restent une génération distincte en attente de GO.
- Aucun commit ni synchronisation GitHub n'est effectué par cette étape.

Prochaine étape : **GO BE-D**, pour l'annuaire, les fiches et les historiques. Ne pas la commencer sans validation du joueur.
