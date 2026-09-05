# Bassin amateur évolutif — conception

## Statut et périmètre

Conception préparée à la suite du **GO conception du bassin évolutif**, puis retenue pour le **GO BE-B**. Le moteur isolé et ses simulations sont implémentés; le **GO BE-C** a autorisé leur raccordement aux sauvegardes, aux semaines et aux galas. Les GO suivants ont permis l’interface de Fédération BE-D puis la validation BE-E. Cette validation conserve les règles actuelles et a relevé une priorité de lisibilité : la correction des indications de risque est désormais implémentée et vérifiée, après son GO distinct, sans rééquilibrage du moteur.

Les résultats, mesures et commandes de BE-B sont consignés dans [BASSIN-EVOLUTIF-BE-B-RAPPORT.md](BASSIN-EVOLUTIF-BE-B-RAPPORT.md).

L'intégration et ses vérifications sont décrites dans [BASSIN-EVOLUTIF-BE-C-RAPPORT.md](BASSIN-EVOLUTIF-BE-C-RAPPORT.md).

L’annuaire, les fiches et les historiques sont décrits dans [BASSIN-EVOLUTIF-BE-D-RAPPORT.md](BASSIN-EVOLUTIF-BE-D-RAPPORT.md).

Les parcours de 104 semaines, les sondages de combat, les mesures de volume et les réserves d’équilibrage sont décrits dans [BASSIN-EVOLUTIF-BE-E-RAPPORT.md](BASSIN-EVOLUTIF-BE-E-RAPPORT.md).

Le périmètre retenu comprend dix adversaires de gala persistants par partie, leur progression hebdomadaire, quelques rencontres entre eux et leur historique sur le site de la Fédération. Le bassin pourra être agrandi plus tard. Supabase est différé.

Cette conception remplace la proposition initiale d'annuaire statique de la Fédération, qui excluait les résultats entre affiliés.

## 1. Bassin et identité

- Utiliser les dix profils masculins ou les dix profils féminins déjà définis, selon le personnage.
- Leur attribuer la catégorie de poids du personnage à la création du bassin, comme les offres actuelles. Aucune autre catégorie n'est simulée.
- Conserver nom, surnom, style et identifiant de catalogue. L'identifiant permanent du boxeur doit être distinct de celui du gala et du combat.
- Le joueur figure dans son propre dossier et dans les historiques, mais ne devient jamais un participant à une rencontre automatique.
- Les douze noms de tournoi par sexe restent gérés par le générateur de tournoi actuel. Ne pas les fusionner avec les affiliés par simple ressemblance de nom.
- Les partenaires de sparring restent extérieurs au bassin.

Une même identité retrouve la même fiche dans l'annuaire, dans une offre de gala et dans le ring. Les stats d'un adversaire ne sont plus recalculées en fonction de celles du joueur à chaque offre.

## 2. Début du suivi et calendrier de calcul

Pour une nouvelle partie, le bassin est créé lors du passage automatique amateur, après la remise de la semaine à 1. Cela rend les fiches disponibles pour le premier gala sans modifier le parcours récréatif. Le site reste accessible seulement après le premier résultat amateur, avec le déverrouillage actuel du Centre-ville.

Le bassin est mis à jour lorsque la semaine amateur W est réellement terminée, avant les offres de W+1 :

1. Le résultat d'un éventuel combat du joueur est enregistré par le traitement habituel de ce combat.
2. À la clôture de W, le bassin choisit éventuellement une paire disponible et résout sa rencontre à partir des fiches de W.
3. Il applique la progression hebdomadaire aux affiliés qui ne sont pas réservés pour un combat du joueur.
4. Il enregistre les résultats, les nouvelles fiches et la dernière semaine traitée ensemble.

Le verrou de l'Aréna reste déterminant : préparer et vivre la semaine jusqu'au combat ne suffit pas à déclencher la mise à jour. Celle-ci attend la clôture effective après le rendez-vous. Les journées successives d'un tournoi ne déclenchent pas de semaines supplémentaires.

Chaque mise à jour est identifiée par le bassin et la semaine amateur. La traiter une seconde fois ne produit aucun effet. Le calcul n'est appelé ni par le rendu de la carte, ni par la consultation d'une fiche, ni par une minuterie.

Fermer le jeu ou passer plusieurs jours réels sans jouer ne fait pas avancer les affiliés. Une carrière professionnelle ne continue pas automatiquement cette simulation amateur dans cette première version.

## 3. Niveaux de départ et plafonds personnels

Les valeurs de départ reprennent les niveaux de référence des profils existants. Les propositions de plafond sont les mêmes pour les profils masculins et féminins correspondants.

| Profil masculin | Profil féminin | Niveau de départ | Plafond moyen proposé |
| --- | --- | ---: | ---: |
| Thomas Leclerc | Camille Beaulieu | 36 | 46 |
| Maxime Kramer | Naomi Kim | 34 | 44 |
| Darnell Okafor | Amara Okafor | 40 | 54 |
| Émile Martel | Élodie Martel | 43 | 58 |
| Olivier Gagnon | Marianne Gagnon | 44 | 60 |
| Minh Nguyen | Linh Nguyen | 42 | 64 |
| Samuel Bouchard | Sophie Bouchard | 46 | 62 |
| Yanis Haddad | Maya Haddad | 45 | 66 |
| Jayden Wilson | Avery Wilson | 41 | 56 |
| Alexis Caron | Maude Caron | 48 | 68 |

Ces niveaux représentent la moyenne des quatre caractéristiques; ils ne constituent pas un classement et ne sont pas affichés sur le site. Le niveau initial le plus élevé ne donne pas systématiquement le plus grand potentiel : Nguyen peut notamment dépasser certains boxeurs initialement plus forts.

Les quatre caractéristiques initiales sont réparties selon le style. Les écarts issus du générateur actuel peuvent servir de base, avec une graine stable liée au catalogue et sans dépendance à la semaine. Recentrer ces écarts sur la moyenne de référence pour que les valeurs du tableau restent interprétables.

Le plafond de chaque caractéristique conserve cet écart de style. Une moyenne plafonnée à 54 ne signifie donc pas quatre stats identiques à 54. Un puncheur conserve une puissance supérieure à sa défense. Les bornes du moteur actuel restent respectées.

## 4. Vitesse de progression proposée

| Moyenne actuelle | Gain moyen maximal par semaine |
| --- | ---: |
| Moins de 45 | +0,12 |
| De 45 à moins de 55 | +0,08 |
| De 55 à moins de 65 | +0,04 |
| 65 et plus | +0,02 |
| Plafond personnel atteint ou dépassé | 0 |

Le gain ralentit davantage dans les quatre derniers points avant le plafond. La règle de départ est : gain de la tranche multiplié par `min(1, (plafond − moyenne) / 4)`, limité à ce qui reste disponible. Les fractions sont conservées avec quatre décimales; un écart restant inférieur ou égal à 0,01 est fermé une fois pour atteindre le plafond exactement.

Le même petit incrément est appliqué aux caractéristiques encore disponibles, en respectant leurs plafonds. Pour une fiche neuve, cela conserve ses écarts de style. Un plafond déjà dépassé dans une sauvegarde importée ne provoque aucune diminution.

Le rythme dépend du niveau propre au boxeur et de son plafond, pas des stats, du niveau, des victoires ou du temps de jeu réel du joueur. Une victoire simulée ne donne pas de bonus supplémentaire de stats : les gagnants ne doivent pas cumuler une progression qui accélère à chaque victoire.

Les boxeurs au plafond continuent à combattre et à faire évoluer leur bilan. Aucun vieillissement, déclin, changement de catégorie, blessure, retraite ou recrutement automatique n'est ajouté.

### Projection arithmétique de cette proposition

Projection sans pause pour combat réservé, avec les moyennes de départ exactes du tableau. Les décimales servent ici à expliquer le rythme; elles ne seront pas affichées sur les fiches publiques.

| Profil représentatif | Départ | Après 26 semaines | Après 52 semaines | Après 104 semaines | Plafond |
| --- | ---: | ---: | ---: | ---: | ---: |
| Kramer / Kim | 34 | 37,12 | 40,24 | 43,23 | 44 |
| Leclerc / Beaulieu | 36 | 39,12 | 42,24 | 45,16 | 46 |
| Nguyen | 42 | 45,08 | 47,16 | 51,32 | 64 |
| Caron | 48 | 50,08 | 52,16 | 55,68 | 68 |

Ces projections ont été calculées en mémoire pendant la conception. Elles vérifient la courbe proposée, pas l'équilibrage contre une carrière jouée. Le futur banc de validation devra comparer ces rythmes à la progression réelle d'un joueur débutant, régulier et avancé.

## 5. Rencontres entre affiliés

Proposition initiale : **au maximum une rencontre automatique par semaine pour tout le bassin**, soit au plus deux participants parmi les dix. Une semaine sans paire convenable est possible.

Conditions de sélection :

- Aucun participant n'est le joueur, un partenaire de sparring ou un adversaire de tournoi.
- Aucun participant n'est réservé pour un combat contre le joueur, y compris un gala différé pendant un tournoi ou un combat temporairement masqué par un sparring.
- Un affilié doit avoir au moins quatre semaines d'écart depuis son dernier combat, qu'il ait affronté le joueur ou un autre affilié. Une fiche sans rencontre suivie est disponible dès le début du suivi; aucune fausse date passée n'est créée.
- Une même paire doit attendre au moins huit semaines avant une nouvelle rencontre automatique.
- L'écart de moyenne entre les deux affiliés ne dépasse pas huit points.

Ces délais encadrent les rencontres automatiques uniquement. Ils n'ajoutent pas de nouvelle restriction aux réservations du joueur dans le calendrier.

Parmi les paires admissibles, privilégier celles dont les participants attendent depuis le plus longtemps, puis les niveaux proches. Départager avec une graine propre au bassin et à la semaine. Chaque rencontre est stockée une seule fois et consultable depuis les deux fiches.

À ce rythme, le bassin peut produire au plus 52 rencontres automatiques par année jouée, soit environ dix participations par affilié si elles sont bien réparties. Ce volume ne s'ajoute jamais au compteur de combats du joueur ni à ses conditions d'admissibilité aux tournois.

## 6. Résolution simplifiée des rencontres automatiques

Le calcul utilise les caractéristiques réelles des deux affiliés avant leur progression de fin de semaine. Il ne lance ni le ring visuel ni une carrière parallèle avec entraînements, argent et récupération.

Proposition à éprouver dans le banc isolé :

- Évaluer chaque affilié avec 65 % de sa moyenne et 35 % d'une moyenne pondérée correspondant à son style.
- Utiliser les pondérations attaque, distance et défense déjà disponibles dans `combat-engine.js`; les styles offensifs favorisent l'attaque, les techniciens et mobiles la distance, les défensifs et contre-attaquants la défense.
- Un style sans famille connue utilise la moyenne simple.
- Pour une différence de force effective `d = force A − force B`, utiliser `p(A) = 1 / (1 + exp(−d / 8))`, bornée entre 10 % et 90 %.
- Tirer le résultat une seule fois avec la graine persistante du bassin et l'identifiant de rencontre.

À force effective égale, chacun a 50 % de chances; un avantage de quatre points donne environ 62 %, huit points environ 73 %. Ce résolveur est une approximation destinée au circuit automatique; il ne prétend pas reproduire exactement une partie jouée au ring.

Pour cette première version, les rencontres automatiques produisent une victoire et une défaite par décision, sans score détaillé, KO ni incident. Le champ des nuls reste présent pour les bilans existants et les éventuels résultats réels qui en contiennent. Les combats du joueur conservent exclusivement le résultat et la méthode issus de leur moteur actuel.

## 7. Offres de gala et protection des réservations

Les galas au gym, locaux et régionaux utilisent ces dix fiches. Les dates, frais, déplacements, conflits de réservation, récompenses et fonctions du calendrier restent ceux du système actuel.

Pour proposer un adversaire, les décalages de niveau actuels des créneaux deviennent des cibles de sélection dans le bassin. Ils ne modifient plus les caractéristiques du boxeur sélectionné. Présenter au maximum trois identités distinctes par gala et qualifier le risque selon l'écart réel avec le joueur.

Les propositions non réservées sont préparées pour la semaine et restent stables à état identique, y compris après rechargement. L'affichage ne consomme pas de tirage aléatoire et ne crée pas de combat. Plusieurs galas peuvent proposer une même personne tant qu'aucune réservation n'a été acceptée.

Au moment de réserver :

1. Vérifier à nouveau l'existence et la disponibilité de l'identité choisie, avant tout paiement.
2. Conserver une copie des caractéristiques et du bilan utilisés pour ce rendez-vous, plus l'identifiant permanent de l'affilié.
3. Réserver cet affilié : aucune rencontre automatique et aucune progression pendant cette préparation.
4. Faire correspondre la fiche publique à cet état réservé, avec une mention de préparation contre le joueur.
5. Après le combat, inscrire son résultat inverse dans le bilan de l'affilié, puis libérer la réservation. Une annulation libère l'affilié sans inscrire de victoire, défaite ou rencontre fictive.

La progression suspendue n'est pas rattrapée après la libération. Un résultat appliqué deux fois ne doit jamais compter deux victoires ou défaites. Le traitement habituel reste seul responsable du bilan et des récompenses du joueur.

Si les dix profils ne permettent pas trois propositions distinctes, en montrer moins. Si le joueur dépasse le bassin, montrer les adversaires réellement présents avec leur risque réel et orienter vers les tournois existants. Ne pas augmenter artificiellement les fiches pour recréer un défi. Cette limite indiquera éventuellement le besoin d'agrandir le bassin.

## 8. Site de la Fédération

L'annuaire est trié par nom, sans classement sportif. Il montre nom, surnom, catégorie, style, bilan V/D/N et éventuelle préparation contre le joueur. Les statistiques exactes, plafonds et probabilités restent internes.

Cliquer sur un nom ouvre sa fiche dans le lieu. La fiche présente :

- son profil qualitatif et son bilan total;
- ses résultats récents, de la rencontre la plus récente à la plus ancienne;
- pour chaque rencontre : semaine, adversaire et résultat du point de vue de la fiche consultée;
- le nom de l'autre affilié cliquable pour passer à sa fiche;
- le bilan des confrontations avec le joueur lorsqu'elles existent.

Une rencontre avec le joueur renvoie à son dossier. Le retour à l'annuaire conserve sa position. Sur mobile, les lignes deviennent des cartes lisibles pleine largeur; toutes les actions restent accessibles au clavier.

Les bilans initiaux des catalogues sont conservés comme **bilan avant le début du suivi**. Aucune rencontre passée n'est inventée pour les expliquer. Exemple de texte : « Bilan initial : 1 V · 1 D. Détails des rencontres suivis depuis la semaine 1. » Une partie migrée indique sa véritable semaine de début du suivi.

Le total correspond au bilan initial plus les résultats suivis, archivés compris. Une ligne de victoire chez A correspond à une défaite chez B pour le même identifiant. Le journal narratif actuel n'est pas utilisé pour reconstruire ces données.

L'intérieur de Fédération et ses trois zones préparées restent adaptés à cette fonction. Aucun nouveau portrait ni image n'est requis pour la conception du bassin.

## 9. Données locales, conservation et extensions

Prévoir un module de calcul pur `roster-engine.js` et un catalogue stable des profils. Le moteur reçoit un état et renvoie un nouvel état; l'interface n'écrit pas dans les fiches. Les paramètres d'équilibrage du bassin sont regroupés dans une configuration dédiée.

Une seule représentation du bassin fait autorité dans la sauvegarde de carrière :

| Donnée | Contenu prévu |
| --- | --- |
| Métadonnées | Version du schéma, version des règles, identifiant du bassin, graine, sexe, poids, semaine de début et dernière semaine traitée |
| Affiliés | Identifiant stable, identité, style, caractéristiques, plafonds, bilan initial, bilan courant et dernière semaine de combat |
| Réservations | Lien vers le rendez-vous existant du joueur et sa copie de fiche réservée |
| Rencontres | Identifiant unique, semaine, deux identifiants de participants, résultat, source automatique ou joueur, méthode si connue |
| Archives | Cumuls de résultats par paire et par affilié, période archivée |
| Offres de la semaine | Références dérivées de façon déterministe du bassin et du contexte sauvegardés, sans copie autonome des bilans ni cache persistant |

Proposition de conservation : garder les **1 000 dernières rencontres détaillées**. Au-delà, regrouper les plus anciennes dans les archives par paire; conserver les bilans et afficher clairement la limite des détails disponibles. Ainsi, « qui a affronté qui » reste connu même lorsqu'une ancienne date détaillée a été archivée. Le seuil sera confronté à la taille réelle de la sauvegarde pendant la validation.

Stocker un combat une fois et filtrer par participant à l'affichage. Ne pas copier une liste complète dans chaque fiche ni enregistrer les coups, images ou animations. Avec dix affiliés, il n'y a que 45 paires possibles entre eux, plus les dix paires avec le joueur.

L'export/import JSON inclut le bassin, sa graine, ses réservations, ses archives et ses marqueurs de traitement. Les données actuelles de la carrière font autorité sur une éventuelle ancienne copie conservée dans la capsule de migration. La synchronisation hebdomadaire ne doit pas écraser le bassin avec un état plus ancien.

La version de schéma et les identifiants stables faciliteront un éventuel stockage distant. Aucun compte, connexion, dépendance Supabase ou synchronisation n'est ajouté. Une future synchronisation devra définir ses propres règles de conflit; deux appareils ne devront pas simuler librement une même semaine puis additionner leurs résultats.

## 10. Sauvegardes déjà commencées

Une ancienne sauvegarde sans bassin commence son suivi à la semaine amateur courante, sans simuler toutes les semaines passées et sans déduire les rencontres du journal.

Pour éviter qu'une carrière avancée retrouve soudain dix débutants, proposer une adaptation initiale unique : décaler les niveaux de référence et les plafonds de `max(0, force actuelle du joueur − 43)`, puis respecter les bornes de chaque caractéristique. Ce décalage est figé dans le bassin créé; il n'est jamais recalculé ensuite. Les valeurs proches de la limite 99 demandent une vérification particulière car les écarts peuvent se réduire.

Un combat déjà réservé conserve strictement son adversaire, ses caractéristiques, son bilan, sa date, ses frais et sa graine de combat. Si son ancienne identité peut être reliée sans ambiguïté au catalogue, sa copie devient la fiche initiale de cet affilié et la réservation est protégée. Ajuster ses plafonds pour ne réduire aucune caractéristique existante.

Si le rapprochement est incertain, conserver ce combat dans son fonctionnement actuel, puis activer ses futures offres avec le bassin. Ne pas inventer de lien par nom et ne pas remplacer l'adversaire réservé. Un tournoi en cours ou un gala différé doit bénéficier de la même protection.

Une sauvegarde qui possède déjà un bassin valide le reprend exactement, sans nouvelle adaptation. Une incohérence de sexe, de catégorie ou de version doit être détectée et traitée par la migration, jamais corrigée silencieusement par une remise à zéro des bilans.

## 11. Validation prévue avant activation

Le prochain lot de moteur isolé doit vérifier les comportements suivants sur des données de test :

- Les deux bassins comptent dix identités; les distributions de niveaux et plafonds sont comparables.
- Une semaine est appliquée exactement une fois, même après export/import et rechargement.
- Les plafonds tiennent sur 26, 52, 104 et 520 semaines; les profils faibles progressent davantage et les écarts de style subsistent.
- Avec la même graine et sans réservation, deux copies du bassin évoluent de la même manière même si le joueur possède des stats différentes.
- Le tirage des combats automatiques ne consomme pas la graine des combats réels ni celle des autres événements.
- Les délais de quatre et huit semaines, l'écart maximal et les exclusions de réservation sont respectés.
- Les bilans des deux participants et les archives correspondent aux rencontres réellement enregistrées.
- Le passage de la limite d'archivage garde les cumuls et annonce les détails archivés.

L'intégration devra ensuite valider :

- conservation du parcours récréatif, des semaines de travail et du verrou d'Aréna;
- conservation exacte d'un gala réservé avant migration et d'un tournoi en cours;
- aucun résultat automatique pour le joueur et aucune modification de ses médailles, argent, XP, fatigue ou admissibilité;
- aucune inscription ni dépense par consultation; les contrôles restent au calendrier;
- concordance annuaire → offre → réservation → ring → résultat;
- profils débutants, joueurs réguliers, carrières avancées et anciennes sauvegardes;
- poids réel de la sauvegarde et durée du calcul mesurés, puis vérification sur ordinateur et mobile.

La projection de progression seule ne suffit pas à déclarer l'équilibrage réussi. Les rencontres du joueur devront utiliser le moteur actuel pour vérifier qu'un débutant conserve des offres abordables et que la nouvelle sélection ne change pas brutalement la difficulté.

## 12. Étapes et prochains GO

| Étape | Livrable | Statut |
| --- | --- | --- |
| BE-A | Conception du bassin et mise à jour de la Fédération | Retenue pour BE-B |
| BE-B | Moteur isolé, catalogue persistant et simulations de progression/rencontres | Implémenté et vérifié hors jeu |
| BE-C | Sauvegardes, migration, semaines et raccordement des galas | Implémenté et vérifié : 32 fichiers techniques et 59 scénarios navigateur réussis |
| BE-D | Annuaire, fiches et historiques dans la Fédération | Implémenté et vérifié : 33 fichiers techniques et 62 scénarios navigateur réussis |
| BE-E | Validation du parcours complet et équilibrage ordinateur/mobile | 33 fichiers techniques et 71 scénarios navigateur réussis; indications de risque à améliorer, aucune règle modifiée |
| Suite BE-E — risque | Libellés qualitatifs, préparation distincte, calendrier et Aréna | Implémenté et vérifié : 34 fichiers techniques et 75 scénarios navigateur réussis |

La [conception des indications de risque](BASSIN-EVOLUTIF-RISQUE-CONCEPTION.md) est mise en œuvre. Le [rapport de livraison](GALAS-RISQUE-RAPPORT.md) détaille les 78 600 sondages dédiés, les tests sur ordinateur/mobile simulé et la préservation des mécaniques et sauvegardes. Les premiers coefficients et seuils sont conservés après la validation indépendante; ils ne prétendent pas prédire les chances d'un joueur humain.

Suite : essais du joueur sur les nouveaux conseils, puis décision commune sur le prochain sujet. Variété des offres et conservation des longues sauvegardes : sujets séparés, non autorisés pour implémentation.

La génération des deux visuels de Fédération reste une étape distincte déjà préparée, encore en attente de GO. BE-D dispose d’un habillage HTML/CSS utilisable sans ces images. Chaque étape s'arrête à son résultat de validation pour respecter le déroulement convenu avec l'utilisateur.
