# BoxeurDeux V2 — Document de conception

## Statut du document

Ce document consolide la direction approuvée pour la V2 avant le développement de la carrière professionnelle. Il décrit l'expérience cible, les systèmes à conserver ou à transformer et les critères qui permettront de décider si la refonte est prête.

La V2 doit préserver les carrières, l'économie, les compétitions et l'équilibre général de la version actuelle. Elle ne doit pas empiler une nouvelle interface par-dessus les anciens systèmes : chaque mécanique doit avoir un rôle clair, une seule source de vérité et une utilité visible.

### État d'implantation actuel

La préversion reste disponible uniquement avec l'option de test `?v2=1`. Elle comprend maintenant l'horloge déterministe, la migration additive, la carte, le guide récréatif, le gym de boxe et sa séance libre limitée par l'énergie, le gym de musculation, les activités de la maison, la récupération, l'emploi initial, les entraîneurs privés, les suppléments, la fiche Boxeur et les quatre jauges de progression. Le menu caché peut lancer immédiatement un sparring ou un combat réel sans modifier la carrière testée.

La capsule conserve encore le détail de l'horloge, de l'historique et des charges en attente. Les champs durables nécessaires au reste du jeu — argent, abonnements, emploi, énergie, fatigue, statistiques fractionnaires, inventaire, programme privé et progression — sont synchronisés vers la sauvegarde principale afin de survivre au rechargement, à l'importation et à l'exportation. Avant d'activer la V2 par défaut, un orchestrateur unique devra toujours unifier la journée, la fin de semaine, les rendez-vous, le calendrier, Rémy, les combats et les tournois. Cette boucle globale est volontairement reportée jusqu'à ce que les moteurs de lieux soient suffisamment stables.

## Vision

BoxeurDeux devient un jeu de carrière illustré dans lequel le joueur comprend naturellement où aller et quoi faire :

> Carte vivante → entrer dans un lieu → faire une activité → le temps avance → récupérer et assimiler → atteindre le prochain rendez-vous → combattre.

La profondeur demeure disponible, mais elle devient facultative. Un nouveau joueur peut suivre les recommandations de son entraîneur et avancer rapidement. Un joueur expérimenté peut composer ses séances, réserver des entraîneurs privés, gérer précisément sa récupération et prendre le contrôle tactique complet dans le ring.

Les principes directeurs sont les suivants :

- une prochaine étape toujours visible;
- un maximum de deux interactions pour lancer une activité ordinaire;
- aucune planification hebdomadaire obligatoire;
- de la profondeur par les choix et leurs compromis, pas par une multiplication de jauges;
- une présentation d'abord visuelle, avec une solution textuelle accessible équivalente;
- le même langage de boxe au gym, en sparring et en combat;
- aucun changement arbitraire de l'équilibre actuel;
- aucun système conservé uniquement parce qu'il existait avant.

## 1. Boucle de carrière et horloge

### 1.1 Remplacement des actions hebdomadaires

Le compteur de trois ou quatre actions par semaine disparaît de l'expérience V2. Il est remplacé par une horloge de carrière comprenant :

- la date;
- le jour de la semaine;
- une période simple : matin, après-midi ou soir;
- les rendez-vous déjà engagés;
- le temps nécessaire aux activités et aux déplacements;
- la récupération nocturne et hebdomadaire.

Le joueur n'a pas à remplir un horaire complet. Lorsqu'il choisit une activité, le jeu indique sa durée et fait avancer l'horloge automatiquement. Le changement de semaine devient une conséquence naturelle du temps qui passe.

La journée suit un contrat unique : le travail ou un rendez-vous peut occuper le jour, puis un seul entraînement physique principal peut être planifié le soir. Une séance au gym de boxe, une séance au gym de musculation, un entraînement au sous-sol, une séance privée ou un sparring utilisent tous cette même place; ils ne peuvent pas être empilés pour doubler la progression. Un combat ou un autre événement physique important bloque également tout entraînement supplémentaire ce jour-là.

Les nuits sont automatiques et appliquent la récupération une seule fois. Le joueur ne clique donc pas sur « Dormir » chaque soir. Sa décision stratégique est plutôt de prendre une journée de repos, de choisir une charge plus légère ou de libérer une soirée.

### 1.2 Navigation rapide dans le temps

Le panneau « Maintenant » présente toujours :

- l'heure de carrière actuelle;
- l'énergie disponible;
- la fatigue accumulée;
- la préparation générale;
- le prochain rendez-vous;
- la prochaine étape de carrière.

Deux rythmes sont proposés directement dans le panneau « Maintenant » :

- **Suivre le plan rapide** : l'entraîneur présente un programme court, puis le jeu résout en un seul bilan le quart de travail, les séances autorisées et la récupération. La cible d'usage est de 20 à 45 secondes par semaine;
- **Jouer la semaine en détail** : le joueur visite les lieux, peut effectuer son quart lui-même et choisit les soirées ou rendez-vous importants; les nuits et les périodes sans décision sont résolues automatiquement.

Après au moins une activité détaillée, « Confier le reste au coach » termine la même semaine en mode hybride. Les trois rythmes utilisent les mêmes primitives, coûts, plafonds de charge, salaires et règles de récupération. Le rapide n'accorde donc aucun multiplicateur caché et l'hybride ne répète jamais une séance ou une paie déjà exécutée.

Avant la confirmation, le programme résume ce qui sera simulé. La simulation s'arrête avant un combat, une pesée, un tournoi ou tout rendez-vous qui demande une vraie décision. La fin de semaine applique les abonnements et les effets récurrents une seule fois.

Le rapide et le détaillé ne sont pas deux économies différentes. Le travail planifié, la séance du soir et la récupération produisent les mêmes coûts et résultats dans les deux modes; seule la quantité de décisions manuelles change.

### 1.3 Parcours récréatif guidé

Une nouvelle carrière commence avec le statut récréatif et un guide progressif qui reste visible jusqu'au premier sparring pédagogique :

- **semaine 1** : payer le premier abonnement obligatoire du gym de boxe, choisir l'emploi initial obligatoire, puis faire la première séance guidée;
- **semaines 2 à 5** : découvrir graduellement le plan de l'entraîneur, les cours de groupe récréatifs, l'énergie, la fatigue et la journée de repos, sans ouvrir tous les systèmes à la fois;
- **semaine 6** : effectuer le sparring pédagogique avec Rémy « Le Tank » dans l'interface de ring;
- **semaines 6 à 10** : après Rémy, afficher clairement le bouton « Passer amateur » et laisser le joueur confirmer lui-même le changement de statut.

Le guide utilise une prochaine étape visible, le lieu pertinent mis en évidence et de courtes interventions de l'entraîneur. Il ne doit pas devenir une chaîne de fenêtres. Seuls les choix initiaux indispensables — abonnement et emploi — sont bloquants. Le calendrier amateur, le gym de musculation et le sparring ordinaire demeurent verrouillés jusqu'au passage amateur explicite; aucune semaine ne transforme automatiquement le boxeur en amateur.

### 1.4 Rythme de compétiteur

L'ancien gain d'une action supplémentaire est converti en avantage cohérent :

> Rythme de compétiteur — le boxeur récupère mieux et peut assimiler une charge productive supplémentaire.

Cet avantage doit préserver approximativement la progression obtenue par l'ancienne quatrième action, sans recréer un compteur d'actions caché.

## 2. Carte et lieux visitables

### 2.1 Carte principale

La carte de la ville devient l'écran d'accueil. Elle montre uniquement les lieux qui ont une fonction actuelle :

- maison;
- gym de boxe;
- gym de musculation, si accessible;
- emploi ou lieu d'entrevue;
- lieu du prochain gala ou tournoi;
- transport lorsqu'un déplacement est nécessaire;
- destination temporaire pendant un tournoi ou, plus tard, un camp professionnel.

Le lieu recommandé est mis en évidence par l'entraîneur. Les lieux verrouillés peuvent être visibles s'ils aident à comprendre la progression, mais leur condition doit être écrite directement : « Disponible après le sparring avec Rémy » plutôt qu'un cadenas inexpliqué.

Une vue « Liste des lieux » offre exactement les mêmes commandes pour le clavier, les lecteurs d'écran et les joueurs qui préfèrent une navigation rapide.

### 2.2 Gym de boxe

Le gym de boxe est le centre de l'apprentissage. Sa scène intérieure peut comprendre :

- l'entraîneur principal;
- la corde à danser;
- le miroir ou l'espace de shadow-boxing;
- le sac lourd;
- le sac de vitesse;
- la zone de travail aux mitaines;
- le ring de sparring;
- une zone d'échauffement et de retour au calme;
- les entraîneurs privés présents dans ce gym;
- le comptoir pour l'abonnement.

Les objets sont des zones interactives, mais ils correspondent aussi à de vrais boutons accessibles. Il ne doit pas être nécessaire de chercher un petit point caché dans l'image.

Le cours de groupe demeure exclusif au statut récréatif et disparaît une fois le passage amateur confirmé. Le sparring avec Rémy « Le Tank » demeure l'étape pédagogique qui ouvre le passage amateur.

À la création d'une carrière, le premier abonnement au gym de boxe est obligatoire et son écran ne peut pas être fermé sans choisir l'offre initiale. Le budget de départ doit toujours permettre ce paiement avant tout achat facultatif. À sa première expiration, le renouvellement redevient facultatif et suit les règles normales d'abonnement.

### 2.3 Gym de musculation

Le gym de musculation possède une identité distincte :

- poids libres;
- machines;
- conditionnement cardiovasculaire;
- mobilité et récupération active;
- entraîneurs privés spécialisés;
- comptoir d'abonnement et boutique.

Les abonnements existants de 1, 3, 6 et 12 mois, avec rabais progressifs équilibrés, doivent être conservés. Les achats doivent continuer à protéger le minimum nécessaire au premier abonnement obligatoire du gym de boxe au début de la carrière.

### 2.4 Maison

La maison regroupe les activités qui ne nécessitent pas un autre lieu :

- prendre une journée de repos;
- manger et surveiller le poids lorsqu'une pesée est pertinente;
- récupération active légère;
- téléphone, messages et inscriptions;
- aperçu du calendrier;
- entraînement de dépannage au sous-sol si aucun abonnement au gym de boxe n'est actif.

L'entraînement au sous-sol reste volontairement limité. Il évite un blocage complet sans rendre l'abonnement au gym inutile.

La nuit et le sommeil ne constituent pas une activité à sélectionner : ils sont résolus automatiquement par l'horloge. Une récupération active ou un entraînement au sous-sol compte toutefois comme l'unique activité physique principale du jour.

### 2.5 Identité des lieux et futurs camps professionnels

Chaque gym peut posséder :

- ses installations;
- ses spécialités;
- ses entraîneurs privés;
- ses partenaires de sparring;
- ses tarifs;
- sa qualité d'encadrement;
- son ambiance et ses effets sur le moral;
- ses disponibilités.

Ce modèle est conçu pour être réutilisé plus tard dans la carrière professionnelle. Voyager pour un camp donnera accès à un lieu temporaire avec ses propres entraîneurs, partenaires, coûts, hébergement et avantages, sans nécessiter un second système de camp.

## 3. Entraînement, énergie et récupération

### 3.1 Les trois notions physiques

La V2 distingue clairement :

- **Énergie** : les ressources disponibles aujourd'hui; elle baisse pendant les activités et remonte rapidement avec les repas, les pauses et le sommeil.
- **Fatigue** : la charge persistante des derniers jours; elle s'accumule avec les activités exigeantes et descend plus lentement.
- **Préparation** : un diagnostic calculé, pas une troisième ressource à remplir. Elle résume le cardio, le rythme récent, la fatigue, la santé, le moral et la qualité du camp.

La préparation est affichée avec des mots — excellente, bonne, moyenne, fragile ou mauvaise — et une explication courte. Elle remplace la forme physique comme jauge indépendante afin d'éviter de pénaliser deux fois le boxeur pour la même cause.

### 3.2 Charge et assimilation

Chaque activité d'entraînement produit :

- un stimulus dans une ou plusieurs statistiques;
- une dépense d'énergie;
- une charge de fatigue;
- parfois une usure ou un risque de blessure;
- une durée.

Le stimulus est assimilé pendant la récupération. Une séance exigeante correctement récupérée est productive. Une succession de séances exigeantes sans récupération augmente surtout la fatigue et l'usure, avec un rendement décroissant.

Chaque statistique possède une jauge de progression visible de 0 à 100. Lorsque la jauge atteint 100, la statistique gagne `+1` et tout débordement demeure dans la jauge suivante. La séance ne donne jamais ce point immédiatement : elle crée du stimulus, puis la récupération l'assimile vers la jauge. Des plafonds et rendements décroissants empêchent d'obtenir plusieurs gains en répétant artificiellement la même charge.

La présentation doit rester simple :

- charge légère;
- charge productive;
- charge exigeante;
- surcharge.

Le détail numérique peut être ouvert, mais il n'est pas nécessaire pour jouer correctement.

### 3.3 Séance préparée par l'entraîneur

La séance de l'entraîneur est proposée à l'intérieur du gym, au moment de s'entraîner. Elle reste une activité complète et distincte : le plan rapide peut la placer dans la semaine, mais ne la transforme pas en suite de clics ni en bonus différent.

Exemple :

> Séance recommandée aujourd'hui  
> Corde à danser → shadow-boxing → travail aux mitaines → retour au calme  
> 55 minutes · charge modérée · objectif technique

Trois commandes suffisent :

- « Faire la séance de l'entraîneur »;
- « Composer ma séance »;
- « Répéter ma dernière séance ».

La séance recommandée doit être efficace et équilibrée. Le joueur qui ne veut pas optimiser chaque exercice ne doit pas être désavantagé de façon importante.

### 3.4 Séance personnalisée

Le joueur avancé peut composer librement une séance en ajoutant progressivement des activités :

- corde à danser;
- shadow-boxing;
- sac lourd;
- sac de vitesse;
- travail aux mitaines;
- exercices défensifs;
- conditionnement;
- mobilité et retour au calme.

Il n'existe pas trois emplacements obligatoires. Une activité unique ou plusieurs activités différentes peuvent former la séance, jusqu'à la limite naturelle de l'énergie, du temps disponible et de la charge productive. La composition retire immédiatement l'énergie dans l'aperçu, sans la dépenser définitivement avant la confirmation, et affiche la durée, la fatigue prévue et les qualités travaillées. Une séance peut être confirmée en un seul bouton; elle ne se joue pas exercice par exercice sauf lorsqu'un exercice interactif facultatif existe.

La personnalisation permet de cibler un besoin ou de moduler l'intensité. Elle ne doit jamais fournir un multiplicateur automatique supérieur à une bonne séance de l'entraîneur.

Le sparring n'est jamais un bloc du compositeur. Il se choisit comme une activité complète dans le ring, possède ses propres conditions de déverrouillage, remplace l'entraînement du soir et ne peut pas être ajouté à une séance pour contourner la limite quotidienne.

### 3.5 Entraîneurs privés

Les entraîneurs privés sont présents dans les lieux, avec :

- spécialité;
- tarif;
- disponibilité;
- qualité pédagogique;
- style privilégié;
- type de séance offert;
- relation avec le boxeur.

Dans la première intégration, un programme comprend quatre séances et son prix complet est payé au choix de l'entraîneur. Technique et Défense se travaillent au gym de boxe; Puissance et Cardio au gym de musculation. Une seule séance privée peut être active et chaque cours consomme l'activité physique principale de la journée. Son raccord futur à l'agenda devra conserver exactement ce contrat et ne créer ni deuxième paiement ni deuxième progression.

La qualité et la spécialité d'un entraîneur privé augmentent seulement le stimulus ciblé d'une séance. Elles n'accordent jamais directement `+1` ou `+2` à une statistique et restent soumises aux mêmes plafonds, à l'assimilation et à la récupération que les autres entraînements.

### 3.6 Suppléments

Les suppléments sont achetés à la boutique du gym de musculation et apparaissent dans le sac de l'onglet Boxeur. Le joueur peut en préparer au plus un avant une séance, pour un maximum de deux utilisations par semaine et une utilisation d'un même produit par semaine. Ils peuvent modifier modestement l'énergie, la fatigue ou la qualité de récupération, mais jamais l'XP, le stimulus ni une statistique. Si une séance échoue, la transaction entière est annulée et le produit demeure dans l'inventaire.

## 4. Agenda personnel et calendrier de compétition

### 4.1 Agenda personnel

L'agenda répond à la question « Qu'est-ce qui s'en vient pour mon boxeur? ». Il contient :

- quarts de travail;
- entrevues;
- vacances;
- séances privées;
- sparrings réservés;
- déplacement;
- pesée;
- combat;
- récupération imposée après un événement important.

L'interface principale n'affiche que le prochain rendez-vous et une bande des sept prochains jours. Sur téléphone, cette bande défile horizontalement sans provoquer de défilement général de la page.

### 4.2 Calendrier de compétition

Le calendrier de compétition répond à la question « Où puis-je combattre? ». Il contient :

- galas locaux;
- gala mensuel au gym;
- galas en région;
- tournois indépendants;
- Gants de bronze, d'argent et dorés;
- Championnats canadiens et parcours olympique selon leurs conditions existantes.

Chaque événement montre d'abord seulement :

- date et nombre de semaines restantes;
- admissibilité;
- frais d'inscription;
- déplacement et hébergement;
- pesée, si applicable;
- bouton principal.

Les détails, divisions et adversaires s'ouvrent au besoin. Plusieurs galas simultanés doivent rester comparables dans une même fenêtre simple.

Les conditions validées demeurent : Gants de bronze pour 0 à 5 combats, Gants d'argent pour 0 à 10 combats, Gants dorés à partir de 10 combats; les dates doivent laisser au joueur une possibilité réaliste d'approcher les maximums. Les petits tournois indépendants peuvent offrir, dans un même tournoi, une division 0 à 10 combats et une division 10 combats ou plus. Les conditions déjà définies pour les Championnats canadiens et le parcours olympique ne sont pas remplacées.

### 4.3 Tournois

Un tournoi forme un parcours continu de 3 ou 5 combats selon son niveau :

- arrivée et hébergement;
- pesée;
- combat du jour;
- récupération entre les combats;
- alimentation avec conséquence possible sur le poids;
- combat suivant.

Un combat a lieu par jour. La récupération quotidienne doit empêcher qu'un boxeur normalement préparé arrive automatiquement épuisé au troisième ou au cinquième combat. Les décisions entre les combats doivent créer des compromis sans condamner d'avance le reste du tournoi.

En amateur, il n'y a aucun match nul. Les combats locaux utilisent trois juges et les tournois cinq juges; les cartes demeurent cachées jusqu'à la fin.

## 5. Emplois, entrevues, vacances et mini-jeux

### 5.1 Emploi

Le premier emploi demeure obligatoire au début de la carrière. Sa fenêtre initiale n'offre ni fermeture ni annulation, ne se ferme pas par clic à l'extérieur ou avec la touche Échap et bloque l'avancement tant qu'un emploi n'a pas été choisi. L'emploi est ensuite proposé par défaut dans chaque semaine, mais le joueur peut le retirer avant de confirmer son programme. Retrouver un emploi après une perte demeure facultatif.

La semaine de travail réserve automatiquement une partie de l'énergie hebdomadaire. La paie et la fatigue normale sont simulées sans exiger un clic répétitif. Retirer le travail rembourse cette énergie, supprime la paie et compte comme une absence. Une présence remet le dossier d'assiduité en règle; trois semaines consécutives sans travailler entraînent le congédiement et l'indemnité de vacances V1 applicable.

En cas de conflit avec un combat, un déplacement ou une séance réservée, le jeu pourra proposer :

- conserver le quart;
- utiliser des vacances;
- demander un congé sans solde;
- manquer le quart;
- quitter l'emploi.

Les emplois mieux payés créent davantage de fatigue hebdomadaire. Après une candidature, l'embauche est garantie après un délai automatique de une, deux ou trois semaines selon le poste. Le joueur n'a pas à dépenser une activité « entrevue » chaque semaine; la progression de la candidature est visible dans le lieu Emploi.

### 5.2 Vacances

Les vacances :

- s'accumulent avec l'ancienneté;
- peuvent atteindre un maximum de trois semaines;
- maintiennent la paie;
- libèrent les quarts correspondants;
- peuvent être choisies par le joueur;
- sont payées au départ ou au congédiement selon l'indemnité prévue.

Une semaine de vacances peut servir à récupérer ou à faire un camp intensif. Dans le second cas, la paie est conservée, mais la fatigue d'entraînement s'applique normalement.

### 5.3 Mini-jeux facultatifs

Certains emplois peuvent proposer un mini-jeu très court. Le joueur choisit toujours entre « Simuler le quart » et « Jouer le quart ».

La simulation donne la paie et les effets normaux. Le mini-jeu n'est jamais requis pour conserver son emploi ou rester compétitif. Sa récompense est limitée : petit bonus d'argent, moral, fatigue légèrement réduite ou sécurité d'emploi.

L'emploi de coursier peut inclure un mini-jeu de bourse assumé comme élément ludique. Pour protéger l'économie :

- la mise est plafonnée;
- les résultats sont générés une fois par période et ne changent pas après un rechargement;
- les gains comme les pertes sont limités;
- il n'existe aucune boucle permettant de produire de l'argent à l'infini;
- la sauvegarde conserve l'état du mini-jeu.

## 6. Statistiques et états

### 6.1 Statistiques permanentes conservées

Les quatre statistiques principales demeurent le langage central de la boxe :

- Technique;
- Puissance;
- Cardio;
- Défense.

Dans l'onglet Boxeur, chaque statistique affiche sa valeur permanente et sa propre jauge de progression de 0 à 100. Ces quatre jauges constituent l'unique progression d'entraînement visible : le stimulus en attente demeure interne, puis la récupération le transforme dans ces jauges. Atteindre 100 accorde `+1`, conserve le débordement et produit une annonce de montée claire.

Le style demeure une identité du boxeur et modifie les préférences, les affinités de distance et l'exécution, sans devenir une statistique brute supplémentaire.

### 6.2 États de carrière visibles

- énergie quotidienne;
- fatigue accumulée;
- préparation calculée;
- moral;
- santé et blessures;
- poids lorsqu'il est pertinent;
- réputation;
- argent;
- niveau et expérience;
- expérience réelle du ring.

Le niveau et l'expérience générale servent à la progression de carrière. L'expérience du ring provient des combats et des sparrings et influence surtout la lecture, la stabilité et l'adaptation. Les deux concepts ne doivent pas récompenser deux fois le même événement; leurs rôles et leurs gains seront centralisés dans la configuration d'équilibrage.

### 6.3 États visibles seulement pendant un combat

- énergie du combat;
- état de la tête;
- état du corps;
- lucidité ou sang-froid;
- distance;
- position dans le ring;
- dynamique récente;
- knockdowns et comptes de huit;
- séquences significatives sans réponse.

La dynamique récente n'est jamais présentée comme la carte des juges.

### 6.4 États internes

- charge et stimulus en attente d'assimilation;
- rythme d'entraînement;
- inactivité;
- forme du jour;
- précision de lecture;
- adaptation au style;
- usure de tournoi;
- risque de blessure;
- séquences sans réponse;
- historique utile aux conseils de l'entraîneur.

Un état interne doit avoir un effet mesurable et testé. S'il ne change aucune décision, aucun résultat ou aucune présentation utile, il doit être supprimé.

### 6.5 Règle contre les pénalités doublées

Une même cause ne doit pas pénaliser plusieurs fois une résolution. Par exemple, la fatigue peut réduire la préparation et l'énergie de départ, mais ne doit pas en plus appliquer plusieurs malus identiques à toutes les statistiques sans justification.

Chaque modificateur doit posséder :

- une source;
- un effet principal;
- une limite;
- une explication affichable;
- un test de sensibilité.

## 7. Ring interactif

### 7.1 Grille 5 × 5 simplifiée

Le ring utilise une grille interne de 5 × 5 afin de représenter le centre, les zones proches des câbles, les câbles et les coins. Cette grille ne devient pas un jeu d'échecs :

- aucun point de déplacement;
- aucun trajet à dessiner;
- aucun calcul affiché par case;
- seulement les deux à quatre choix pertinents sont éclairés;
- maximum deux choix par échange : déplacement, puis action;
- les ajustements de jambes mineurs sont automatiques.

La distance — extérieur, mi-distance et corps à corps — demeure distincte de la position sur la grille.

### 7.2 Trois niveaux de contrôle

Le joueur peut agir de trois façons compatibles :

1. **Suivre l'entraîneur** : un clic applique sa recommandation.
2. **Choix rapide** : attaquer, se défendre, sortir de la pression ou reprendre le centre.
3. **Choix précis** : sélectionner une tuile, une zone du corps ou une action contextuelle.

Les trois méthodes passent par le même moteur. Le contrôle précis donne de la souplesse, pas un bonus caché systématique.

### 7.3 Déroulement d'un échange

1. Le jeu montre la position et la distance.
2. L'intention probable de l'adversaire est annoncée.
3. L'entraîneur peut tracer une recommandation directement dans le ring.
4. Le joueur choisit un déplacement ou un choix rapide.
5. Il choisit une attaque, une défense ou un positionnement lorsque nécessaire.
6. L'échange est résolu immédiatement.
7. Les boxeurs, jauges, effets et commentaires sont mis à jour.

Un round amateur vise environ quatre échanges importants, avec une plage acceptable de quatre à six selon les événements. Une option de contrôle ne doit pas ajouter des échanges artificiels.

### 7.4 Conseil de l'entraîneur

L'entraîneur peut indiquer :

- une tuile de sortie;
- une zone dangereuse;
- le centre à reprendre;
- une cible au corps ou à la tête;
- une intention probable;
- une action à éviter.

La qualité de l'entraîneur, la qualité de son observation et le contexte déterminent la fiabilité. Une recommandation aide, mais peut être incomplète ou incorrecte. Le jeu doit distinguer visuellement une certitude d'une lecture probable.

### 7.5 Résolution et équilibre

Les résultats continuent de dépendre des statistiques existantes, du style, de la distance, de la position, de l'énergie, de la fatigue, des dégâts, de la lucidité, de l'expérience et d'une incertitude contrôlée. La préparation reste un diagnostic dérivé pour le joueur : elle ne s'ajoute jamais comme multiplicateur aux composantes qui ont déjà servi à la calculer.

Le joueur reçoit une explication courte :

> Bonne lecture · bonne distance · exécution propre  
> Ton double jab interrompt son entrée.

Les coefficients exacts demeurent internes et centralisés. Les KO, TKO, knockdowns, comptes de huit et cartes des juges conservent leurs règles de référence jusqu'à ce qu'une comparaison statistique approuve une modification.

## 8. Sparring et apprentissage avec Rémy « Le Tank »

Le sparring avec Rémy est interactif et utilise le même ring que les combats. Il sert de tutoriel jouable :

- lire une intention;
- comprendre la distance;
- choisir une sortie;
- travailler derrière le jab;
- protéger le corps;
- gérer l'énergie;
- suivre ou remettre en question un conseil.

Rémy peut interrompre une séquence, expliquer l'erreur et permettre de recommencer sans pénalité. Le sparring ne déclare aucun gagnant et ne modifie pas le bilan de carrière.

Il demeure réservé à partir de la semaine 6 du parcours récréatif. Après l'avoir terminé, le bouton « Passer amateur » devient disponible jusqu'à la semaine 10. Le joueur doit confirmer lui-même ce passage; s'il attend, l'interface explique clairement que le calendrier amateur est prêt, mais encore verrouillé par cette confirmation.

Le débrief final montre :

- le meilleur réflexe du joueur;
- son erreur la plus fréquente;
- une réponse concrète à essayer;
- le conseil que Rémy rappellera au premier combat amateur.

Les sparrings futurs peuvent être techniques, légers, intenses ou ciblés contre un style. Leur intensité change la progression, la fatigue et le risque, mais ils utilisent toujours les mêmes commandes de base.

## 9. Coin du boxeur entre les rounds

Un combat amateur possède exactement deux scènes au coin : entre les rounds 1 et 2, puis entre les rounds 2 et 3.

La scène montre :

- le boxeur sur son tabouret;
- l'entraîneur devant lui;
- l'eau et la serviette;
- la zone touchée;
- le ring et le public en arrière-plan;
- deux courtes observations fondées sur le round réel.

Le joueur choisit une priorité parmi environ trois options contextuelles :

- **Récupérer** : davantage d'énergie, mais peu ou pas de nouvel avantage tactique;
- **Directive tactique** : plan plus précis, récupération normale;
- **Protéger ou adapter** : limite l'aggravation d'une faiblesse, avec un compromis sur l'initiative ou l'offensive.

Les éléments de la scène peuvent servir de commandes — eau, entraîneur, zone touchée — tout en demeurant accompagnés de boutons avec du texte. La qualité de l'entraîneur influence la précision du diagnostic et la pertinence des options, sans fournir plusieurs bonus automatiques simultanés.

## 10. Direction graphique

### 10.1 Style

La direction recommandée est semi-réaliste et illustrée, avec :

- personnages détourés dans des poses cohérentes;
- décors en plusieurs plans;
- éclairage selon l'heure, la saison et l'événement;
- effets courts pour les impacts, déplacements et moments importants;
- couleurs de coin conservées et étendues;
- animations légères qui ne retardent jamais une décision.

Les images servent l'interaction. Elles ne doivent pas remplacer un libellé nécessaire ni ajouter un décor qui nuit à la lisibilité.

### 10.2 Cadrage des images

Chaque scène possède une zone de sécurité documentée pour les personnages, objets interactifs et textes. Les règles de cadrage sont :

- aucun visage, objet interactif ou indice important coupé par un format courant;
- point focal défini par scène et par point de rupture;
- version paysage et version portrait lorsqu'un simple recadrage dégrade la scène;
- personnages transparents produits sur des canevas et échelles cohérents;
- zones cliquables ancrées en coordonnées normalisées plutôt qu'en pixels fixes;
- fonds capables de s'étendre sans déformer le sujet;
- aucun texte intégré directement dans une image lorsqu'il doit être traduit ou agrandi.

Les scènes sont validées au minimum en 1440 × 900, 1280 × 720, 390 × 844, 360 × 800 et en orientation mobile paysage.

### 10.3 Ordinateur

- carte ou scène occupant la majeure partie de l'écran;
- panneau « Maintenant » adjacent;
- objectif, prochain rendez-vous, préparation et argent visibles;
- intérieur des lieux présenté comme une scène principale;
- ring suffisamment grand, avec les décisions placées à sa hauteur;
- journal récent compact et détails repliables;
- navigation clavier complète et focus très visible.

### 10.4 Mobile

- conception verticale propre à environ 390 × 844;
- scène sur environ 35 à 45 % de la hauteur selon le contexte;
- panneau d'actions près du pouce;
- navigation fixe et courte : Carte, Agenda, Boxeur, Messages;
- boutons d'au moins 44 pixels de hauteur;
- aucune largeur fixe ni défilement horizontal de la page;
- agenda de sept jours défilable indépendamment;
- textes courts et détails repliables;
- respect des zones sécuritaires de l'appareil;
- pas de clavier visuel masquant l'action principale.

### 10.5 Accessibilité et mouvement

- vrais boutons derrière chaque zone graphique;
- nom accessible décrivant le lieu, la tuile ou l'action;
- couleurs accompagnées d'un mot, d'une icône ou d'une forme;
- annonces pour knockdowns, fins de round, blessures, pertes d'emploi et montées de niveau;
- prise en charge de `prefers-reduced-motion`;
- aucune animation qui bloque, ralentit ou modifie la fenêtre de décision;
- vue en liste équivalente pour la carte et le ring.

## 11. Sauvegardes et migration

La V2 doit ouvrir les sauvegardes actuelles sans supprimer de progression. La migration est versionnée, idempotente et testée sur plusieurs profils : récréatif, amateur débutant, tournoi actif, carrière avancée, sans emploi et profil professionnel de test.

Pendant la transition, la V2 reste une préversion activée explicitement avec `?v2=1`. Sa capsule écrit uniquement les champs durables prévus dans la sauvegarde principale et conserve séparément son historique détaillé. L'ordinateur de la maison permet d'ouvrir la V1 dans un espace isolé qui ne fait pas avancer l'horloge V2. Une carrière déjà avancée ne repasse pas par l'abonnement et l'emploi bloquants destinés uniquement à une nouvelle carrière.

Principes de conversion :

- conserver l'identité, le sexe, les couleurs, les statistiques, le style, le niveau, l'XP, l'argent, la réputation, le bilan, les blessures, les abonnements, l'emploi, les vacances, les inscriptions et les résultats;
- convertir la forme actuelle en données initiales de préparation sans modifier les statistiques permanentes;
- convertir l'énergie et la fatigue existantes vers les nouvelles échelles avec des bornes sûres;
- convertir l'action hebdomadaire en cours en état temporel cohérent ou terminer proprement l'ancienne semaine;
- préserver les dates relatives des événements et tournois;
- ne jamais créer de match nul dans un bilan amateur;
- conserver les champs historiques nécessaires à l'importation, mais ne plus les utiliser comme source active après migration;
- exporter directement au nouveau format tout en important les anciennes versions.

La capsule additive et la sauvegarde principale servent de mécanisme de retour contrôlé pendant la transition. Le moteur de combat reste lançable directement par le menu développeur jusqu'à ce que son raccord complet au calendrier et la comparaison d'équilibre soient acceptés. La V1 ne sera retirée qu'après validation de la migration, des importations et exportations et de l'absence de progression doublée.

## 12. Suppression des systèmes inutiles ou obsolètes

Avant de retirer un système, un inventaire doit répondre à cinq questions :

1. Qui écrit cette donnée?
2. Qui la lit?
3. Quelle décision du joueur change-t-elle?
4. Quel résultat change-t-elle?
5. Quel test protège son comportement?

Une donnée sans réponse utile est supprimée ou gardée seulement dans la couche de migration.

Les candidats déjà identifiés sont :

- compteur de trois ou quatre actions hebdomadaires;
- forme physique comme jauge indépendante;
- pénalités répétées provenant de la même fatigue;
- vues distinctes qui dupliquent agenda et calendrier;
- anciens choix généraux de round après validation du ring interactif;
- champs de sauvegarde historiques qui ne pilotent plus aucun système;
- alertes ou verrouillages sans explication ni action directe;
- progressions parallèles qui récompensent deux fois le même entraînement;
- menus de lieu remplacés par une scène sans fonction exclusive restante.

La suppression est faite seulement après migration, tests et vérification qu'aucune carrière active n'en dépend. Le menu caché de test est conservé et adapté aux nouveaux états afin de valider rapidement tous les parcours.

## 13. Architecture recommandée

La V2 conserve HTML, CSS et JavaScript sans nouvelle dépendance importante. Les responsabilités sont séparées :

- **état de carrière** : temps, argent, emploi, abonnements, calendrier et progression;
- **moteur d'entraînement** : séances, stimulus, énergie, fatigue et assimilation;
- **moteur de combat** : échanges, positions, scores cachés, KO et arrêts;
- **présentation** : carte, scènes, boutons, effets et annonces;
- **configuration** : coûts, durées, gains, seuils et poids statistiques;
- **migration** : lecture des anciennes sauvegardes;
- **aléatoire injectable** : comportement normal en jeu et graines fixes en test.

Aucune règle d'équilibrage ne doit être enfouie dans le rendu d'un écran. Une action déclenchée depuis une image, un bouton rapide ou une vue accessible appelle exactement la même règle.

## 14. Équilibre et validation statistique

Avant de modifier les formules, la version actuelle sert de référence. Une suite déterministe simule les mêmes oppositions dans les deux moteurs et compare :

- taux de victoire et de défaite;
- fréquence des décisions, KO, TKO et knockdowns;
- distribution des pointages;
- énergie et dégâts restants;
- influence marginale de Technique, Puissance, Cardio et Défense;
- avantage réel d'un bon choix tactique;
- performance après un mauvais camp;
- usure sur les tournois de trois et cinq combats;
- progression et économie sur plusieurs saisons.

Pour des boxeurs comparables, la cible centrale reste un partage proche de 50/50. Les seuils d'acceptation exacts sont fixés après mesure de la référence actuelle; ils ne sont pas choisis à partir d'une impression visuelle.

Le nouveau système doit démontrer que :

- une bonne décision aide sans garantir le résultat;
- une erreur isolée n'anéantit pas normalement le combat;
- plusieurs erreurs ou une mauvaise gestion de récupération deviennent significatives;
- la puissance ne remplace pas la technique;
- le cardio gagne en importance avec la durée;
- la défense protège sans rendre invincible;
- une fatigue moyenne ne rend pas toute victoire improbable;
- un boxeur bien préparé peut terminer un tournoi sans épuisement artificiel;
- le moral seul ne provoque jamais un TKO.

## 15. Étapes d'implantation réversibles

1. Auditer les données, formules, écrans et champs de sauvegarde actuels.
2. Mesurer l'équilibre et l'économie de référence avec des graines fixes.
3. Centraliser la configuration sans changer le comportement.
4. Ajouter la nouvelle horloge, l'énergie, la fatigue et la préparation derrière une option de test.
5. Construire la carte et le panneau « Maintenant » avec une vue en liste équivalente.
6. Verrouiller l'abonnement, l'emploi initial et le guide récréatif des semaines 1 à 6.
7. Construire le gym de boxe, les séances et les quatre jauges avant la personnalisation avancée.
8. Ajouter les entraîneurs privés, le gym de musculation et les activités de la maison.
9. Unifier l'emploi courant, l'agenda personnel et le calendrier de compétition.
10. Prototyper le ring 5 × 5 en conservant l'ancien moteur comme référence.
11. Intégrer le sparring pédagogique avec Rémy et la scène du coin.
12. Adapter les galas, déplacements, pesées et tournois.
13. Migrer et tester les sauvegardes.
14. Comparer statistiquement les deux versions, puis ajuster.
15. Retirer les systèmes obsolètes uniquement après la parité fonctionnelle.
16. Valider ordinateur, téléphone, clavier, lecteur d'écran et mouvement réduit.
17. Publier la V2, puis bâtir la carrière professionnelle sur ses systèmes de lieux, camps et combats.

Chaque étape doit pouvoir être désactivée ou annulée sans convertir à nouveau les sauvegardes ni perdre une carrière.

## 16. Critères d'acceptation de la V2

### Compréhension

- Un nouveau joueur peut expliquer sa prochaine étape en moins de 30 secondes.
- Une nouvelle carrière ne peut quitter l'inscription initiale sans abonnement au gym et emploi pour la semaine 1.
- Il trouve Rémy, termine le sparring et voit comment passer amateur sans aide extérieure.
- Le passage amateur reste une confirmation explicite après Rémy et n'arrive jamais automatiquement.
- Tout verrouillage indique une cause et un bouton menant à la solution.
- Une activité ordinaire se lance en deux interactions ou moins depuis la carte.

### Entraînement et récupération

- La séance de l'entraîneur est compétitive face à une bonne séance personnalisée.
- L'énergie et la fatigue ont des rôles distincts et compréhensibles.
- La préparation explique clairement les facteurs qui l'améliorent ou la dégradent.
- Une journée ne peut produire qu'une activité physique principale et les nuits ne demandent aucun clic de sommeil.
- Les quatre jauges atteignent 100 avant d'accorder `+1`, avec leur débordement conservé.
- Un entraîneur privé ne modifie jamais directement une statistique permanente.
- Le sparring ne peut jamais être ajouté comme bloc d'une séance personnalisée.
- Aucune combinaison répétable ne produit une progression, une récupération ou de l'argent à l'infini.

### Combats

- Un échange demande au maximum deux choix.
- Le ring reste lisible sans connaître la boxe.
- Les choix précis et les raccourcis utilisent le même moteur.
- Le sparring de Rémy enseigne au moins une erreur et sa correction.
- Les cartes sont cachées pendant le combat.
- Il n'existe aucun match nul amateur.
- Les taux de victoire et les méthodes de fin restent dans les tolérances établies par la référence.

### Graphisme et appareils

- Aucun élément important n'est coupé aux formats de validation.
- Aucun écran mobile n'a de défilement horizontal général.
- Le ring, les décisions et les états prioritaires sont visibles ensemble sur ordinateur.
- Les actions principales sont accessibles au pouce sur téléphone.
- Les zones illustrées possèdent un équivalent accessible et un focus visible.
- Le mode mouvement réduit ne ralentit jamais le jeu.

### Compatibilité

- Toutes les sauvegardes de test migrent et peuvent être exportées puis réimportées.
- La V1 demeure utilisable et son instantané de retour n'est jamais modifié par la capsule V2.
- Les carrières récréatives, amateurs, en tournoi et avancées reprennent à un état cohérent.
- Emplois, vacances, abonnements, blessures, argent, réputation, statistiques et bilans sont préservés.
- Le reste du jeu ne dépend plus d'un champ ou d'un écran déclaré obsolète.

## Décision de conception principale

La V2 ne sera pas un planificateur détaillé ni un jeu de plateau. Elle sera une carrière illustrée pilotée par le temps et la récupération, avec deux niveaux d'engagement : suivre rapidement une séance ou un conseil efficace, ou ouvrir les choix avancés pour personnaliser son parcours.

La suppression des anciens systèmes ne se fera qu'après avoir prouvé trois choses : la nouvelle mécanique est plus claire, elle conserve la fonction utile de l'ancienne et elle maintient l'équilibre mesuré du jeu.
