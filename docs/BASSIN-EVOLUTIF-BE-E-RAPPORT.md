# BE-E — validation des parcours et diagnostic d’équilibrage

## Verdict

Le bassin est fonctionnel et reste léger dans les parcours testés. Les règles de progression et les plafonds peuvent être conservés. **L’équilibrage n’est cependant pas à déclarer parfait : les indications de risque des galas méritent une correction**, et la variété devient limitée lorsque le joueur recherche systématiquement l’adversaire le plus facile.

Aucune règle de jeu, statistique de catalogue, vitesse de progression, mécanique de combat ou sauvegarde réelle de l’utilisateur n’a été modifiée dans BE-E. Seuls des tests, un banc reproductible et ce rapport sont ajoutés. Les changements des lots précédents restent présents dans le répertoire; aucun commit ni push n’a été effectué.

## Méthode et limites

Trois carrières synthétiques ont été jouées pendant **104 semaines chacune**, puis répétées à l’identique à **1366 × 900** et **390 × 844**, soit **624 semaines effectivement clôturées** par les fonctions du jeu.

| Parcours | Départ | Programme | Galas |
| --- | --- | --- | --- |
| Débutant peu actif | Moyenne 43, 220 $, Coursier local | Une séance encadrée et repos par semaine | Un toutes les 8 semaines |
| Régulier | Moyenne 43, 220 $, Commis de dépanneur | Plan rapide existant : boxe, repos, maison si la capacité le permet | Un toutes les 4 semaines |
| Avancé migré | Moyenne 70, 1 000 $, bilan initial 12 V / 4 D | Même plan rapide | Un toutes les 4 semaines |

Les abonnements mensuels sont réellement payés et renouvelés; les points de niveau réellement gagnés sont répartis vers les caractéristiques les plus faibles. Aucune énergie, argent, XP ou semaine gratuite n’est injectée pendant ces parcours. Le profil avancé constitue une sauvegarde de départ synthétique, pas le résultat du parcours débutant accéléré.

Chaque parcours choisit la moins forte des offres disponibles pour son gala local/de gym. Le débutant alterne ses actions tactiques; les autres suivent les actions signalées comme alignées avec le coach. La longue campagne utilise les transitions du moteur de combat sans animer les échanges ni sélectionner volontairement des déplacements de ring. **Deux parcours UI supplémentaires** vérifient les véritables boutons, animations et enchaînements annuaire → calendrier → préparation → ring → résultat → fiches, sur ordinateur et mobile.

Un second banc effectue **27 600 simulations tactiques**, soit 300 graines par point de comparaison : cinq états de chacune des trois carrières, trois offres, état physique observé et état de contrôle énergie 90 / fatigue 5, plus deux références comparables. Il ne simule pas 27 600 carrières complètes et ne prétend pas prédire les taux de victoire de joueurs humains. Les intervalles à 95 % sont des intervalles de Wilson pour ces essais définis. Ils ne couvrent pas tous les comportements de joueur ni l’incertitude liée à leur modélisation.

Les parcours longs partagent une graine de calendrier/bassin pour permettre la comparaison exacte des deux formats. La variation aléatoire étendue concerne ici les combats de sondage; ce n’est pas une étude exhaustive de toutes les carrières possibles.

## Progression observée

Valeurs internes moyennes, non destinées à être affichées dans les fiches publiques. « Après 104 » correspond à l’entrée en semaine 105.

| Parcours | Départ | Après 26 semaines | Après 52 | Après 104 | Bassin après 104 : min–max |
| --- | ---: | ---: | ---: | ---: | --- |
| Débutant | 43 | 45,50 | 47 | 50 | 43,23–55,68 |
| Régulier | 43 | 46,75 | 49 | 52,75 | 43,23–55,68 |
| Avancé migré | 70 | 73,75 | 76 | 79,75 | 65,48–77,88 |

Les profils moins forts du bassin progressent; les plus élevés ralentissent et leurs plafonds tiennent. Le décalage initial de la sauvegarde avancée reste figé : le moteur ne réadapte pas les affiliés lorsque le joueur progresse. Les essais supplémentaires à 520 semaines, dans les deux sexes et près de la limite 99, conservent trois identités distinctes lorsque disponibles et respectent toutes les bornes.

Les deux exécutions de chaque carrière donnent exactement les mêmes observations, combats, bilans et bassin final, indépendamment de la largeur d’affichage.

## Ce qui fonctionne

- Les six carrières terminent les 104 semaines, sans argent négatif, perte de l’emploi ni absence injustifiée dans les programmes retenus.
- Les réservations restent identiques de l’offre au ring. L’affilié réservé ne progresse pas et ne dispute pas de rencontre automatique pendant sa préparation.
- Le bassin attend le résultat derrière le verrou d’Aréna; aucun combat automatique ne compte au bilan du joueur ni n’attribue de médaille.
- Un second traitement du même résultat ne double ni les récompenses ni les bilans.
- Les résultats sont persistés, réapparaissent après rechargement et sont inverses sur les deux fiches.
- Les annexes d’archives restent lisibles et paginées, même pour un bassin féminin de 1 500 semaines.
- Un débutant conserve une proposition réellement abordable : à l’état initial étudié, l’offre « Accessible » obtient environ 83 % de victoires dans les sondages, contre environ 7–8 % pour l’offre « Défi risqué ».
- La référence à statistiques identiques et condition contrôlée donne environ 50 % de victoires avec chacun des deux comportements testés. Le banc ne donne donc pas systématiquement la victoire au joueur.

## Réserves et changements recommandés

### 1. Priorité : indications de risque trop simplifiées

Exemple reproductible : parcours régulier, entrée en semaine 105. Alexis Caron est annoncé **« Combat serré »**, mais le comportement testé ne gagne que **9 combats sur 300, soit 3 %**. Avec la condition standardisée 90/5, il gagne 4 %. L’offre accessible du même écran reste nettement plus abordable, à 79 % dans l’état observé.

La cause identifiée est la projection d’affichage dans `roster-career.js`, qui classe seulement l’écart entre la moyenne de l’adversaire et `playerCombatStrength()`. Cette dernière inclut jusqu’à 1,5 point de « maturité ». Ici, la moyenne du joueur est 52,75, la comparaison utilise 54,25 et Caron vaut 55,68 : un écart affiché de 1,43 est classé serré, alors que l’écart des caractéristiques est de 2,93 avant même le style et les conditions physiques.

**Proposition à préparer avec un nouveau GO :** rendre le conseil qualitatif cohérent avec les caractéristiques effectives, le profil adverse et la préparation. Garder les chiffres exacts et probabilités cachés; ne pas modifier les adversaires, le moteur du ring ou les résultats pour faire correspondre le jeu au libellé actuel. Vérifier ensuite le calibrage sur plusieurs profils et les effets d’une variation d’énergie/fatigue.

### 2. Variété limitée si l’on choisit toujours la facilité

Dans les 13 galas du parcours débutant, seulement **deux adversaires distincts** sont rencontrés. Le régulier en rencontre quatre sur 26; l’avancé en rencontre six sur 26. Cela découle en partie de la stratégie du banc, qui choisit toujours l’offre la plus faible, et ne signifie pas que l’annuaire ne contient que ces profils.

**Conseil :** conserver pour l’instant les dix affiliés comme décidé. Si les essais humains confirment la répétition, étudier une meilleure variété parmi des adversaires de risque réellement voisin, sans supprimer l’option abordable ni recalculer leurs caractéristiques. Aucun agrandissement du bassin n’est nécessaire pour valider la fiabilité technique actuelle.

### 3. Le joueur avancé dépasse naturellement le circuit local

Après 104 semaines supplémentaires, le joueur migré vaut 79,75 en moyenne et le meilleur affilié 77,88. Ses trois offres sont alors accessibles. C’est compatible avec le choix d’un petit circuit amateur à plafonds propres, pas une raison de réintroduire l’adaptation permanente au joueur.

**Conseil :** conserver l’orientation vers les tournois existants, puis traiter l’élargissement du bassin ou le parcours professionnel dans un lot de contenu distinct si nécessaire. Les galas ne doivent pas garantir un défi infini.

### 4. Sauvegardes très longues : le calendrier domine, pas le bassin

Après 104 semaines, le bassin pèse environ **22–25 ko UTF-8** et la sauvegarde principale **203–225 ko** dans les parcours testés.

Dans le cas de 1 500 semaines, les **1 000 rencontres détaillées + 407 archivées** représentent **177 206 octets** pour le bassin. La sauvegarde principale atteint **2 197 129 octets**, dont **2 017 294 pour le calendrier**. Une deuxième clé de sauvegarde du runtime occupe aussi environ 2,2 Mo. Il serait donc trompeur d’attribuer l’essentiel du poids aux dix affiliés.

La mesure navigateur couvre le calcul du bassin, la production HTML des fiches et une sérialisation/écriture de sauvegarde complète. Elle ne mesure pas le temps d’une semaine de jeu entière ni le rendu graphique complet. Le profil CPU ralenti ×4 est une simulation sur cet ordinateur, **pas un essai sur un téléphone physique**.

Dernier passage de la suite complète, 25 mesures par opération. Temps médians, en millisecondes :

| Opération, sauvegarde de 1 500 semaines | CPU normal | CPU ralenti ×4 |
| --- | ---: | ---: |
| Calcul d’une semaine du bassin | 3,2 | 12,5 |
| Contexte + HTML de l’annuaire | 4,5 | 25,2 |
| Contexte + HTML d’une fiche et ses archives | 6,4 | 35,1 |
| Sérialisation + remplacement d’une sauvegarde complète | 33 | 150,4 |

Une sonde temporaire accepte encore 800 000 caractères ASCII supplémentaires, mais 900 000 dépassent le quota de ce Chromium dans ce cas de test. Elle est ensuite supprimée. Le remplacement normal de la sauvegarde existante réussit; ajouter une troisième copie complète n’est pas une opération normale du jeu. Cette mesure invite néanmoins à traiter la croissance des sauvegardes avant de promettre une durée illimitée aux très longues carrières. Il ne s’agit pas d’un quota garanti pour tous les navigateurs.

**Conseil :** avant d’envisager Supabase pour une raison de volume, diagnostiquer séparément la conservation des anciens événements de calendrier et la duplication entre sauvegarde/runtime. Aucun nettoyage ou changement de format n’est appliqué dans ce lot.

## Validation et reproduction

- `npm test` : **33 fichiers techniques réussis**.
- `npm run test:browser -- --workers=1` : **71 scénarios réussis**, environ 6,7 minutes pour la suite complète.
- Neuf scénarios BE-E : six carrières longues, un cas archives/performance et deux parcours visuels complets; passages ciblés réussis.
- Les mesures de combat sont conservées dans [BASSIN-EVOLUTIF-BE-E-MESURES.json](BASSIN-EVOLUTIF-BE-E-MESURES.json).
- Les tailles, temps et marges de stockage sont conservés dans [BASSIN-EVOLUTIF-BE-E-PERFORMANCE.json](BASSIN-EVOLUTIF-BE-E-PERFORMANCE.json).
- Syntaxe des fichiers de test/banc et `git diff --check` réussis. Une seconde exécution complète retrouve les mêmes trajectoires documentées.

Commandes, depuis le projet :

```sh
npm run test:browser -- --grep 'BE-E' --workers=1
node scripts/validate-roster-balance.cjs
npm test
npm run test:browser -- --workers=1
```

Le premier appel génère les observations de carrière sous `/tmp/boxeur-be-e-*.json`; le second les compare et génère `/tmp/boxeur-be-e-balance.json`. `BE_E_WEEKS=8` sert uniquement à un essai court : il ne remplace pas les 104 semaines et est refusé par le banc statistique. `BE_E_SAMPLES` permet d’augmenter le nombre de sondages. Aucun de ces outils n’est chargé par le jeu.

Les tests utilisent un serveur temporaire et des sauvegardes Chromium isolées, distinctes de la partie Chrome sur le port 5501. Les contrôles récréatifs, tournois, travail, vacances, séances privées, suppléments et médailles demeurent dans la suite générale. Les longues trajectoires BE-E elles-mêmes jouent des galas, pas un palmarès complet de tournois.

## Suite proposée

Préparer en premier la correction des **indications de risque**, après accord de l’utilisateur. La variété des offres et l’optimisation des sauvegardes longues sont des sujets distincts à décider ensuite. Les illustrations de la Fédération restent elles aussi en attente de leur GO séparé.
