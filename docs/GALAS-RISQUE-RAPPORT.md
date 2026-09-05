# Indications de risque — intégration et validation

## Résultat

Le **GO indications de risque — implémentation** a permis une correction de présentation uniquement, désormais implémentée et validée techniquement. Les trois libellés de la [conception](BASSIN-EVOLUTIF-RISQUE-CONCEPTION.md) sont raccordés aux offres de gala, au combat réservé dans le calendrier et au dossier de gala à l'Aréna :

- **Avantage sur le papier**;
- **Combat exigeant**, sans promesse de chances égales;
- **Gros défi**.

Le conseil utilise les caractéristiques effectives actuelles, sans le bonus de maturité de `playerCombatStrength()`. La formule, le coefficient 0,35 et les seuils −2 / +2 proposés sont conservés après les contrôles hors jeu. L'ancien nombre « difficulté » disparaît des boutons de gala; le coût possède sa propre ligne. Aucun score interne ou pourcentage de victoire n'est affiché.

La préparation demeure distincte : état existant, énergie, fatigue et avertissement en condition dégradée. Les rendez-vous futurs précisent que cette préparation peut changer. Les déplacements encore à appliquer sont annoncés sur la réservation, sans les exécuter en consultant l'écran. Les déplacements déjà appliqués ne sont pas annoncés à nouveau.

Le « Repère du coach » garde exactement le candidat et l'occasion mis en avant auparavant. Son texte ne promet plus qu'il s'agit d'un combat facile. La mention d'avantage sur le bassin local reste seulement une orientation vers les tournois admissibles.

## Protection du jeu existant

- Les fonctions de sélection, les adversaires, leurs caractéristiques, les réservations et leur ordre restent inchangés. Le risque est calculé dans une projection d'affichage, jamais injecté dans les données sportives.
- Le champ historique `risk` reste intact dans les sauvegardes; l'interface ne s'en sert plus pour conseiller le joueur. Aucune migration ou nouvelle donnée sauvegardée n'est ajoutée.
- Les six modules `combat-engine.js`, `roster-engine.js`, `roster-career.js`, `roster-catalog.js`, `career-time-engine.js` et `week-planner-engine.js` ont les mêmes empreintes SHA-256 avant et après ce lot.
- Aucun changement aux coûts, récompenses, travail, vacances, progression, verrou de semaine, sparrings, tournois ou médailles. Les risques propres aux actions tactiques du ring sont distincts et restent inchangés.
- Les nouveaux conseils ne lancent aucun combat simulé dans le navigateur. Le module `gala-risk.js` effectue seulement quelques calculs et produit du texte.
- Les essais utilisent des sauvegardes Chromium isolées. La partie Chrome de l'utilisateur sur le port 5501 n'a pas été manipulée. Aucun commit ni push n'est effectué.

## Contrôles de calibrage

Deux ensembles distincts couvrent les catalogues masculin et féminin, trois niveaux de référence (43, 65, 85), quatre répartitions de caractéristiques et des écarts adverses de −6, −3, 0, +3 ou +6 points. Chaque ensemble comprend 120 oppositions, deux comportements (débutant/coach) et deux conditions physiques : 90 énergie / 5 fatigue, puis 30 / 70.

- Premier contrôle : **28 800 simulations**, 60 graines par combinaison.
- Validation indépendante : **48 000 simulations**, 100 graines par combinaison, avec de nouvelles graines et des variations supplémentaires des caractéristiques du joueur.

Les sondages reprennent le format local à trois rounds et cinq échanges, cinq actions et une qualité de coach de 0,60. La difficulté adverse utilisée pour l'adaptation est arrondie comme dans `startFight()`. Ils n'utilisent aucune graine d'un combat réellement réservé.

Résultats de la validation indépendante, **condition de contrôle 90/5 uniquement** :

| Libellé | Combinaisons opposition/comportement | Plage de victoires mesurée |
| --- | ---: | ---: |
| Avantage sur le papier | 90 | 65 à 100 % |
| Combat exigeant | 54 | 13 à 86 % |
| Gros défi | 96 | 0 à 15 % |

Ces chiffres décrivent les essais, pas des chances de victoire garanties ni les limites universelles d'une catégorie. Le niveau intermédiaire reste volontairement prudent : il ne signifie pas « combat serré ». Aucune opposition classée favorable n'est nettement défavorable dans les séries de contrôle testées.

**La condition physique compte beaucoup :** dans les états extrêmes 30/70, même les oppositions favorables sur le papier ne donnent que 0 à 11 % de victoires dans la validation. Cela confirme la nécessité de séparer les caractéristiques de la préparation et de montrer l'alerte. Ce lot ne modifie pas la sévérité actuelle de la fatigue.

Les sondages utilisent des choix tactiques automatisés sans déplacements volontaires dans le ring. Ils ne couvrent pas tous les comportements humains ou répartitions possibles. Les animations et les boutons réels sont vérifiés par la suite navigateur, distincte de ce banc.

Mesures détaillées : [GALAS-RISQUE-MESURES.json](GALAS-RISQUE-MESURES.json). Les indices sont arrondis à six décimales dans cette archive seulement, jamais avant la classification du jeu.

### Retour sur le cas Caron

Les trois offres du régulier BE-E, semaine 105, ont aussi été rejouées avec le paramétrage arrondi du ring et de nouvelles graines : **1 800 sondages supplémentaires**, 300 par adversaire/condition.

Cela porte le banc dédié à **78 600 simulations**. Le [résultat de régression](GALAS-RISQUE-REGRESSION.json) a été reproduit à l'identique par une seconde exécution du script dédié.

| Adversaire | Nouveau conseil | Victoires en condition observée 86/3 | Victoires en contrôle 90/5 |
| --- | --- | ---: | ---: |
| Okafor | Avantage sur le papier | 246/300 | 248/300 |
| Haddad | Combat exigeant | 107/300 | 123/300 |
| Caron | Gros défi | 5/300 | 7/300 |

L'ancien « Combat serré » de Caron est donc bien retiré sans modifier l'adversaire pour rendre ce texte artificiellement vrai. Les anciennes mesures BE-E restent conservées telles quelles; ces sondages constituent un nouveau contrôle, avec d'autres graines et l'arrondi du paramètre d'adaptation.

## Vérifications techniques et visuelles

- **34 fichiers de tests techniques réussis** : seuils, données invalides, styles, plafonds, monotonie, immutabilité et déterminisme inclus.
- **Quatre nouveaux scénarios navigateur ciblés réussis** : ordinateur 1366 × 900, mobile simulé 390 × 844, petit mobile 320 × 740, puis lecture pure / plan non confirmé / ancienne réservation.
- Le prix, l'ordre, les identités et les caractéristiques des offres correspondent aux fonctions de sélection et de devis inchangées. La réservation conserve ses caractéristiques, son coût, sa graine et son état après consultation et rechargement.
- Une ancienne réservation Caron conserve même son texte historique sérialisé « Combat serré », mais les deux écrans affichent désormais « Gros défi ».
- Cent lectures/rendus du nouveau conseil laissent identiques l'état de carrière, la capsule et le stockage. Mesure indicative sur cet ordinateur : environ **1,4–1,5 ms pour les 100 appels**, hors rendu graphique; ce n'est pas une mesure sur téléphone physique.
- Un plan rapide non confirmé ne change pas les caractéristiques ou la préparation utilisées dans le conseil.
- Captures inspectées sur ordinateur et mobile; badges, prix, alternatives et parcours clavier accessibles. Aucun débordement horizontal mesuré sur les nouveaux éléments aux trois largeurs testées.
- **75 scénarios navigateur réussis**, environ 6,9 minutes : récréatif, travail/vacances, séances privées, suppléments, tournois, médailles, six carrières de 104 semaines et deux parcours visuels annuaire → réservation → ring → résultat inclus. Les formats mobiles sont simulés dans Chromium, pas testés sur téléphone physique.
- Vérifications de syntaxe, liens de documentation et `git diff --check` réussis.

## Reproduction

```sh
npm test
npm run test:browser -- --grep 'Risque galas' --workers=1
npm run test:browser -- --workers=1
RISK_STAGE=calibration RISK_SAMPLES=60 node scripts/validate-gala-risk.cjs
RISK_STAGE=validation RISK_SAMPLES=100 node scripts/validate-gala-risk.cjs
node scripts/validate-gala-risk-regression.cjs
```

Le dernier script utilise `/tmp/boxeur-be-e-regulier-1366.json`, produit par les campagnes BE-E de la suite navigateur complète. Si nécessaire, le régénérer avec `npm run test:browser -- --grep 'BE-E carrière longue' --workers=1`. Les scripts de sondage écrivent leur résultat JSON sur la sortie standard, sans être chargés par le jeu et sans lire une partie réelle.

## Suite

La validation technique est terminée. Le joueur peut maintenant comparer les indications dans le calendrier, réserver un gala et retrouver le conseil à l'Aréna. Une modification réelle de ses caractéristiques peut faire évoluer le conseil; sa préparation est toujours affichée séparément. Les essais humains restent utiles pour juger la compréhension de ces mentions.

La variété des offres, les longues sauvegardes et les illustrations de Fédération restent hors de ce lot et attendent une décision distincte.
