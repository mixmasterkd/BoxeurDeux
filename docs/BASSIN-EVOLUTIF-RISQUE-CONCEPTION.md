# Galas — conception des indications de risque

## Statut

Préparation initialement autorisée par le GO suivant le rapport BE-E, sans modification du jeu pendant cette conception. Le **GO indications de risque — implémentation** a ensuite autorisé sa mise en œuvre, désormais terminée : voir le [rapport d'intégration et de validation](GALAS-RISQUE-RAPPORT.md). Les règles ci-dessous concernent uniquement les indications des galas amateurs; elles ne constituent pas un rééquilibrage des combats.

Référence : [rapport BE-E](BASSIN-EVOLUTIF-BE-E-RAPPORT.md). Le moteur, les caractéristiques, les réservations, les coûts et les récompenses restent inchangés.

## 1. Ce qui doit être corrigé

Le libellé actuel compare la moyenne adverse à `playerCombatStrength()`, qui ajoute jusqu'à 1,5 point de maturité à la moyenne du joueur. Cette force sert aussi à sélectionner les offres et à calculer certaines récompenses : **ne pas modifier cette fonction pour corriger l'affichage**.

Dans le cas régulier de semaine 105, Caron est affiché « Combat serré » alors que les sondages BE-E donnent 3 % de victoires dans l'état observé et 4 % dans l'état de contrôle 90 énergie / 5 fatigue. Ce sont des résultats de comportements automatisés définis, pas des probabilités promises à un joueur humain.

Le moteur utilise notamment les caractéristiques pondérées par famille tactique, l'énergie, la fatigue, les actions et le contexte du ring. Un simple écart de moyenne ne prédit donc pas un combat serré. Une bonne préparation ne signifie pas non plus que l'adversaire est facile.

## 2. Affichage proposé

Séparer deux informations, sans nouvelle jauge ni fenêtre supplémentaire :

| Information | Présentation proposée | Sens |
| --- | --- | --- |
| Opposition sportive | **Avantage sur le papier** | Les caractéristiques comparées donnent un avantage au joueur; aucune victoire garantie. |
| Opposition sportive | **Combat exigeant** | Aucun avantage assez net pour rassurer le joueur; ne signifie pas « chances égales ». |
| Opposition sportive | **Gros défi** | L'adversaire présente un avantage important dans la comparaison. |
| Préparation | **Préparation actuelle : [état existant]** + énergie et fatigue | État du joueur maintenant, distinct du niveau adverse et de sa condition future. |

Dans le calendrier :

- Conserver nom, surnom, style, bilan et coût de chaque offre. Remplacer « difficulté 56 » et l'ancien risque par l'indication qualitative, sans exposer de nouvelles statistiques exactes ni pourcentages.
- Afficher une seule explication commune : « Comparaison des caractéristiques actuelles. Tes choix et ta condition le jour du combat comptent aussi. »
- Présenter la préparation une fois pour l'ensemble des offres, pas dans chacun des boutons.
- Pour un rendez-vous futur : « Ta préparation peut encore changer avant la semaine du combat. » Ne pas utiliser les gains d'un plan non confirmé comme s'ils étaient déjà acquis.

Dans le calendrier d'un gala réservé et à l'Aréna : reprendre la même indication sportive, avec les caractéristiques réservées de l'adversaire et les caractéristiques actuelles effectives du joueur. Conserver l'encadré de préparation de l'Aréna; ne pas en créer un second. L'adversaire réservé reste figé, mais le conseil peut évoluer si le joueur progresse réellement.

Sur mobile comme sur ordinateur, tous ces textes sont visibles sans survol; le coût garde une ligne clairement lisible. La couleur accompagne le libellé, jamais l'inverse. Aucun nouveau bouton de confirmation, verrou ou détour par le calendrier n'est ajouté.

## 3. Calcul d'affichage proposé, à éprouver

Une fonction pure dédiée reçoit une copie des quatre caractéristiques effectives de chaque combattant et le style adverse. Elle ne reçoit ni la graine du combat, ni le résultat, ni le générateur aléatoire, ni les intentions cachées.

Base candidate :

1. `d_moyen = moyenne adverse − moyenne du joueur`, sans bonus artificiel de maturité.
2. Calculer `d_profil`, l'écart des mêmes caractéristiques pondérées chez **les deux** boxeurs selon la famille du style adverse. Réutiliser les poids publiés par `BoxeurCombat.LEGACY_WEIGHTS` : attaque pour puncheur/pression/bagarreur, distance pour technicien/mobile, défense pour contre-attaquant/défensif. Un style non reconnu utilise `d_moyen`.
3. `indice = d_moyen + 0,35 × max(0, d_profil − d_moyen)` : tenir compte d'un point fort lié au profil sans supposer que le joueur choisira toujours la meilleure réponse tactique.
4. Seuils candidats : indice ≤ −2 → « Avantage sur le papier »; −2 < indice < 2 → « Combat exigeant »; indice ≥ 2 → « Gros défi ».

Le coefficient 0,35 et les seuils sont **une proposition d'affichage**, pas une formule exacte du ring. Ils devront passer le banc indépendant décrit plus bas. Ne pas convertir cet indice en probabilité et ne pas réutiliser la formule de victoire des rencontres automatiques entre affiliés.

La comparaison sportive ne change pas seulement parce que l'énergie baisse : la préparation est une information séparée. Réutiliser `careerPreparationView()` / `BoxeurTime.getPreparation()` pour garder les mêmes états que les autres lieux. Leurs raisons existantes signalent notamment l'énergie basse sous 35 et la fatigue persistante au-dessus de 65; ces seuils ne deviennent ni des interdictions de combattre ni des pénalités supplémentaires.

En cas d'alerte physique, rendre explicite : « Ta condition actuelle peut rendre ce combat plus difficile, même avec un avantage sur le papier. » Le statut de préparation existant inclut aussi l'assimilation des XP; ne pas le présenter comme une estimation des chances de victoire ni réinjecter ces XP dans l'indice sportif.

Les effets d'un déplacement encore à appliquer doivent être annoncés séparément comme à venir. Ne pas les appliquer en consultant l'écran, ne pas compter deux fois un déplacement déjà appliqué et ne pas qualifier la condition affichée de « condition d'entrée au ring » avant leur traitement réel.

Si les caractéristiques nécessaires sont absentes ou invalides, afficher « Évaluation indisponible ». Ne pas fabriquer une note rassurante à partir du nom, du bilan ou d'une valeur par défaut.

## 4. Premier contrôle de cohérence, hors jeu

La formule candidate a été évaluée en mémoire sur les **45 oppositions** des points de contrôle BE-E, puis comparée aux mesures déjà enregistrées. Aucun nouveau combat n'a été lancé et aucune sauvegarde n'a été modifiée.

| Libellé candidat | Nombre d'oppositions | Victoires observées dans les sondages BE-E à condition 90/5 |
| --- | ---: | ---: |
| Avantage sur le papier | 11 | 81,33 à 99,67 % |
| Combat exigeant | 22 | 16 à 82 % |
| Gros défi | 12 | 0 à 12,67 % |

Ces plages décrivent cet échantillon seulement. Elles ne définissent pas les seuils publics et ne doivent pas apparaître dans le jeu. La plage très large du niveau intermédiaire confirme l'intérêt d'éviter le terme « Combat serré ».

Exemple régulier, semaine 105 : Okafor devient « Avantage sur le papier », Haddad « Combat exigeant » et Caron « Gros défi ». Les neuf oppositions à 10 % de victoires ou moins dans les sondages de contrôle se trouvent dans « Gros défi ».

**Limite importante :** ce sont les données ayant motivé la correction, pas une validation indépendante. Le banc BE-E utilisait aussi la difficulté fractionnaire des offres, alors que `startFight()` arrondit ce paramètre pour l'adaptation adverse. Le futur banc doit reprendre le paramétrage réel du ring, y compris cet arrondi, sans changer les anciennes mesures ni leur faire dire davantage.

## 5. Conseil du coach

Actuellement, le coach désigne la première occasion et son candidat à la difficulté arrondie la plus basse. Cette sélection ne démontre pas que le combat est facile, ni qu'il est le plus favorable pour tous les styles.

Conserver exactement les adversaires sélectionnés, leur ordre, le candidat mis en avant et les règles de réservation. Corriger seulement la promesse du texte :

- Badge : « Repère du coach ».
- Explication : « Première occasion proposée. Compare les adversaires et vérifie ta préparation : ce choix ne garantit pas un combat facile. »

La mention de dépassement du bassin doit rester une comparaison des caractéristiques actuelles avec celles des affiliés, et non une promesse de victoire. Sa condition d'affichage pourra employer les évaluations sportives pures de tous les affiliés; elle ne doit modifier ni les offres ni les conditions d'admissibilité aux tournois.

## 6. Frontières d'intégration

- Ajouter un petit module de présentation/test indépendant. Aucun appel à `simulateFight()` pendant le rendu : quelques calculs fixes par adversaire, sans charge Monte-Carlo dans le navigateur.
- Raccorder uniquement les offres de gala, le récapitulatif réservé et le dossier de gala à l'Aréna. Utiliser une projection en lecture seule des caractéristiques actuellement transmises au ring; ne pas déclencher de normalisation persistante ou de semaine depuis l'évaluateur.
- Garder `galaOffers()`, `playerCombatStrength()`, `opponentDifficulty()`, leurs paramètres et leurs effets actuels. L'ancien champ sérialisé `risk` peut être conservé pour compatibilité, mais n'est plus la source du conseil visible. Ne pas réécrire une réservation existante pour actualiser son texte.
- Les instantanés réservés, identités, ordres de sélection, graines, coûts, paiements, résultats, progression et récompenses restent strictement identiques. Aucune migration ou donnée supplémentaire en sauvegarde n'est nécessaire.
- Récréatif, sparrings, tournois, médailles, travail, vacances et progression des affiliés restent hors modification. Le dossier Fédération n'affiche ni ce risque ni un nouveau classement. Les textes de risque des actions tactiques du ring sont un autre sujet et restent inchangés.

## 7. Critères de validation retenus

1. **Calcul pur :** valeurs limites et seuils exacts, profils équilibrés et spécialisés, styles inconnus, données invalides, stats fractionnaires et plafonnées. Augmenter une caractéristique du joueur ne doit pas aggraver l'indice; augmenter celle de l'adversaire ne doit pas l'améliorer. Modifier uniquement XP, réputation ou bilan ne change pas cette comparaison sportive.
2. **Calibrage hors rendu :** reprendre les cas BE-E, puis utiliser d'autres graines et répartitions de stats, les deux catalogues et plusieurs niveaux. Tester des politiques débutant/coach, une préparation correcte et des états fatigués, avec la configuration réelle du ring. Garder séparés les résultats servant au calibrage et ceux de validation; aucun sondage du combat réellement réservé.
3. **Critères de prudence :** Caron du cas signalé ne peut plus être présenté comme un combat serré ou favorable. Dans les contrôles à préparation comparable, une opposition classée favorable mais nettement défavorable dans plusieurs séries signale un défaut à corriger, pas un résultat à masquer. Les faibles taux du niveau intermédiaire doivent être analysés; ne pas prétendre qu'il représente du 50/50.
4. **Non-régression :** mêmes offres/ordre/réservation/coûts avant et après, puis même combat pour la même graine et les mêmes actions; aucune écriture causée par le nouvel évaluateur. Export/import et réservations anciennes inchangés; fatigue, déplacement, état confirmé et plan non confirmé correctement distingués.
5. **Interfaces :** calendrier et Aréna cohérents à 1366 × 900 et 390 × 844, retour sur mobile étroit à 320 px; textes et prix non coupés, alternatives et clavier accessibles. Vérifier le coût du rendu, sans en déduire un test sur téléphone physique.
6. **Suite générale :** relancer les tests techniques et navigateur, notamment récréatif, tournois, travail et verrou de semaine. Produire un rapport avec les réserves restantes avant de déclarer cette correction validée.

## Mise en œuvre

**GO indications de risque — implémentation** reçu et réalisé : module d'affichage, raccordements limités et tests ci-dessus, puis rapport. Le coefficient et les seuils candidats sont conservés après les contrôles indépendants. Bilan : 34 fichiers techniques et 75 scénarios navigateur réussis, sans modification des moteurs ni des caractéristiques des affiliés.

La variété des offres, la croissance des longues sauvegardes et les illustrations de Fédération restent des sujets séparés, chacun en attente de sa décision.
