# BE-B — moteur isolé du bassin amateur

Ce rapport décrit la livraison isolée de BE-B. Le raccordement ultérieur au jeu est documenté dans [BASSIN-EVOLUTIF-BE-C-RAPPORT.md](BASSIN-EVOLUTIF-BE-C-RAPPORT.md).

## Résultat

Le moteur et le catalogue sont implémentés et vérifiés sur des parties virtuelles. Le jeu ne les charge pas encore : aucune référence n'a été ajoutée dans `index.html` ou `script.js`. Le raccordement à la carrière, aux sauvegardes existantes et aux galas appartient à BE-C.

## Livrables

- `roster-catalog.js` : vingt profils de catalogue, dont dix sont utilisés dans une partie; identités et bilans initiaux conservés, plafonds personnels et distributions identiques entre profils correspondants.
- `roster-engine.js` : création et restauration du bassin, progression, rencontres, réservations, résultats du joueur côté adversaire, archives et données publiques des fiches.
- `tests/roster-engine.test.js` : 26 cas de test, dont des campagnes sur plusieurs graines et des simulations allant jusqu'à 1 500 semaines.
- `scripts/simulate-roster.cjs` : banc reproductible de progression, volume de rencontres, taille JSON et durée de calcul.
- `package.json` : commandes `test:roster` et `simulate:roster`, sans nouvelle dépendance.

Les autres modifications déjà présentes dans l'espace de travail appartiennent aux étapes précédentes du Centre-ville.

## Comportements vérifiés

- Dix affiliés par partie, avec la catégorie fournie et un identifiant indépendant du gala.
- Progression conforme aux projections à 26, 52 et 104 semaines; plafonds respectés et écarts de style conservés à 520 semaines.
- Les boxeurs au plafond continuent à combattre; leurs caractéristiques ne baissent pas.
- Au maximum une rencontre automatique par semaine, quatre semaines entre deux participations et huit avant une revanche automatique.
- Aucune rencontre forcée si les participants sont indisponibles ou si l'écart dépasse huit points.
- La préparation d'un combat réservé gèle les stats et le bilan de cet adversaire; son annulation ne crée pas de résultat et ne rattrape pas la progression suspendue.
- Une réservation arrivée à échéance bloque la clôture du bassin jusqu'au résultat ou à l'annulation.
- Le résultat réel du joueur met à jour le bilan inverse de l'affilié, sans posséder ni modifier le bilan du joueur.
- Une même semaine, un même résultat ou une même réservation ne sont pas appliqués deux fois.
- Les deux fiches consultent un seul résultat commun avec des perspectives opposées.
- Les consultations publiques ne dévoilent ni caractéristiques exactes, ni plafonds, ni graine.
- Export/import simulé par JSON : même état et même avenir après reprise. Les versions ou bilans incohérents sont refusés explicitement.
- Aucun recours à une horloge réelle, au stockage du navigateur ou au hasard global. Une vérification en contexte JavaScript de navigateur sans CommonJS confirme le chargement des trois modules et le même résultat.

Un écart d'arrondi de 0,0001 entre certaines caractéristiques a été détecté pendant le test à dix ans. Le gain commun est maintenant arrondi une seule fois avant application, ce qui conserve les écarts de style.

## Progression observée

Scénario masculin neuf, sans réservation. Les valeurs représentent la moyenne des quatre caractéristiques; elles ne sont pas destinées à l'affichage dans l'annuaire.

| Affilié | Départ | Semaine 52 | Semaine 104 | Semaine 520 | Plafond |
| --- | ---: | ---: | ---: | ---: | ---: |
| Leclerc | 36 | 42,24 | 45,16 | 46 | 46 |
| Kramer | 34 | 40,24 | 43,23 | 44 | 44 |
| Okafor | 40 | 45,84 | 50 | 54 | 54 |
| Martel | 43 | 47,84 | 52 | 57,93 | 58 |
| Gagnon | 44 | 48,52 | 52,68 | 59,89 | 60 |
| Nguyen | 42 | 47,16 | 51,32 | 63,66 | 64 |
| Bouchard | 46 | 50,16 | 54,32 | 61,86 | 62 |
| Haddad | 45 | 49,16 | 53,32 | 65,34 | 66 |
| Wilson | 41 | 46,52 | 50,68 | 55,96 | 56 |
| Caron | 48 | 52,16 | 55,68 | 66,78 | 68 |

Les moyennes des profils féminins correspondants suivent exactement la même courbe. Les résultats de leurs rencontres peuvent différer selon les tirages et les identifiants de participants.

## Volume et performances mesurés

Exécution locale sous Node **v24.19.0**, séparément de la suite générale pour les mesures ci-dessous. Les tailles sont celles du JSON du bassin encodé en UTF-8, et non celles de la sauvegarde complète ou de son occupation exacte dans le navigateur. Les temps comprennent la validation et la copie de l'état du moteur, mais pas son enregistrement par le jeu ni le rendu de l'interface.

| Scénario | Semaines | Rencontres suivies | Détails conservés / archivés | JSON en octets | Calcul moyen par semaine | 95e percentile |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| Masculin, longue carrière | 1 500 | 1 407 | 1 000 / 407 | 167 126 | 2,10 ms | 3,42 ms |
| Féminin | 520 | 482 | 482 / 0 | 84 234 | 0,93 ms | 1,61 ms |
| Niveau initial avancé, décalage explicite +27 | 520 | 518 | 518 / 0 | 85 210 | 0,85 ms | 1,49 ms |
| Valeurs proches de 99, décalage explicite +56 | 520 | 520 | 520 / 0 | 85 474 | 0,90 ms | 1,53 ms |

Le scénario masculin utilise **11 577 octets à la semaine 52**, **79 635 à la semaine 520** et **167 126 à la semaine 1 500**, soit environ 11,6, 79,6 et 167,1 ko décimaux. Le stockage des détails est borné à 1 000 rencontres; les résultats antérieurs restent comptés dans les archives par paire.

Les comptes archivés ont été rapprochés des bilans et des confrontations. Un ancien résultat du joueur déjà archivé ne peut pas être rejoué pour ajouter une seconde défaite à son adversaire.

Ces mesures soutiennent le choix d'un petit bassin local. Les mesures sur Chrome et sur mobile avec le reste du jeu attendent l'intégration; ce banc Node ne les remplace pas.

## API préparée pour BE-C

Toutes les opérations de mutation renvoient `{ state, applied, reason }` et, lorsqu'une rencontre vient d'avoir lieu, `match`. Elles travaillent sur une copie; le code appelant est responsable de conserver puis sauvegarder le nouvel état.

| Appel | Usage |
| --- | --- |
| `createState({ sex, weightClass, seed, startWeek, initialLevelOffset })` | Crée un bassin; sexe, catégorie et graine sont requis. Le décalage est explicite et appliqué une fois. |
| `restoreState(state, { sex, weightClass })` | Valide et reprend exactement un bassin existant; ne migre pas la sauvegarde du jeu. |
| `advanceWeek(state, { week, careerStatus, completed, fightGateReady })` | Exige une semaine amateur clôturée et traite les semaines dans l'ordre. |
| `reserveFighter(state, { fighterId, bookingId, fightWeek })` | Protège l'affilié choisi et conserve sa copie de caractéristiques/bilan. |
| `cancelReservation(state, bookingId)` | Libère l'affilié sans rencontre fictive. |
| `recordPlayerFight(state, { bookingId, matchId, week, playerResult, method })` | Reçoit `win`, `loss` ou `draw` du point de vue du joueur; met à jour seulement l'affilié et l'historique. |
| `listFighters(state)` | Données publiques de l'annuaire, triées par nom. |
| `getFighterProfile(state, fighterId, { offset, limit })` | Fiche publique, pagination des détails et cumuls archivés. |
| `headToHead(state, fighterId, opponentId)` | Confrontations suivies, archives incluses; le joueur est identifié par `player`. |

La migration BE-C devra notamment conserver les identifiants du bassin et les fractions des caractéristiques dans les copies d'adversaires du jeu. Le normaliseur actuel d'adversaire ne prévoit pas encore ces nouveaux liens. Les propositions de galas et les copies d'anciennes réservations seront raccordées à cette étape.

## Commandes et limites de validation

```sh
npm run test:roster
node tests/roster-engine.test.js
npm run simulate:roster
npm test
```

- Tests ciblés : **26 réussis sur 26**. L'exécution directe affiche chaque cas; le lanceur général de cet environnement affiche les résultats par fichier.
- Suite générale : **31 fichiers de tests réussis sur 31**.
- Vérifications de syntaxe et d'espaces : réussies.
- Aucun test sur la sauvegarde Chrome du joueur n'a été nécessaire pour BE-B.

Le moteur est prêt pour le raccordement BE-C. L'équilibrage des offres contre un joueur réel reste à valider avec les combats actuels. Près de la limite 99, plusieurs plafonds se rapprochent naturellement; cela doit être pris en compte lors de la migration des carrières très avancées. Le moteur ne contourne pas cette limite en modifiant les règles du ring.
