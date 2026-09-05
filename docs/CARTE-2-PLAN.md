# Carte 2 — Centre-ville

## Suivi des étapes

| Étape | Objet | Statut |
| --- | --- | --- |
| 2-A | Conception fonctionnelle | Validée |
| 2-B | Navigation entre les deux cartes | Validée |
| 2-C | Composition et prompts visuels de la carte | Validée |
| 2-D | Génération des cartes ordinateur et mobile | Validée |
| 2-E | Intégration de la carte et de ses verrouillages | Validée |
| 2-F | Intérieur du centre de loisirs | Validée |
| 2-G | Mécanique des sorties | Validée |
| 2-H | Autres lieux, un à la fois | Studio média implémenté; bassin BE-C raccordé et vérifié; interface Fédération BE-D en attente de GO |
| 2-I | Aéroport et camps professionnels | Différé |
| 2-J | Validation et équilibrage | En attente |

Ce document sert de spécification et de suivi. L'étape 2-B ajoute seulement la navigation et un plan structurel temporaire du Centre-ville; elle ne modifie aucune sauvegarde ni mécanique de jeu.

## Rôle de la carte

La deuxième carte représente le **Centre-ville**. Elle agrandit la vie du boxeur après ses débuts sans reproduire la maison, l'emploi, les deux gyms ou l'aréna du quartier.

Ses fonctions sont :

- introduire les loisirs et la vie sociale;
- donner une utilité supplémentaire à l'argent et à la capacité hebdomadaire;
- accueillir les services de réputation et de progression de carrière;
- préparer visuellement la future carrière professionnelle et les voyages;
- garder la carte du quartier simple pour un joueur débutant.

## Déverrouillage recommandé

Le Centre-ville se débloque après le **premier résultat de combat amateur officiel**, victoire, défaite ou match nul.

Ce jalon est préféré au simple passage amateur : le joueur a alors terminé le tutoriel récréatif, compris la carte principale, planifié au moins une semaine amateur et disputé un vrai combat. Le déverrouillage ne dépend donc ni d'un niveau caché ni d'une victoire obligatoire.

Avant ce jalon, l'accès demeure visible avec la raison :

> Centre-ville · disponible après ton premier combat amateur officiel.

Le bilan de ce combat annonce ensuite :

> Le Centre-ville est maintenant accessible depuis le sélecteur de carte.

## Navigation entre les cartes

### Accès principal

L'en-tête de chaque carte contient un sélecteur unique **Quartier | Centre-ville**. Il indique clairement le secteur actif et permet de passer directement à l'autre carte dès son déverrouillage.

Changer de carte :

- ne consomme aucune capacité hebdomadaire;
- ne fait pas avancer l'horloge;
- ne coûte pas d'argent;
- ne constitue pas un voyage de carrière;
- ne modifie pas la sauvegarde du joueur.

Il n'existe aucun second bouton de transport sous la carte. Le sélecteur d'en-tête constitue l'unique commande afin d'éviter une navigation en double.

### Règles de retour

- Quitter un lieu du Centre-ville ramène au Centre-ville.
- Quitter un lieu du quartier ramène au quartier.
- Recharger une sauvegarde ouvre le quartier afin de conserver un point de repère stable.
- Pendant le verrou obligatoire d'un combat, les lieux du Centre-ville se verrouillent comme ceux du quartier et l'Aréna demeure la destination requise.
- Une destination de camp utilisera plus tard l'aéroport et une vraie durée de voyage; elle ne sera jamais simulée par le changement gratuit de carte.

## Lieux recommandés au lancement

### 1. Centre de loisirs

Premier lieu jouable et identité principale de la carte. Un seul intérieur illustré donne accès à quatre activités :

- quilles;
- arcade;
- cinéma;
- karting.

Le joueur voit toutes les activités, puis ouvre une fiche avec le prix, la capacité, l'effet et une confirmation. Les sorties appartiennent à une seule famille **Loisirs** et une seule peut être planifiée par semaine.

Une sortie :

- est ajoutée au plan hebdomadaire sans effet immédiat;
- peut être remplacée ou retirée avant la confirmation;
- débite son prix seulement lorsque la semaine est confirmée;
- procure une récupération plus faible qu'une journée de repos;
- ne donne jamais directement de statistique, d'XP de boxe ou d'avantage de combat;
- produit un résultat visible **Détendu**, expliqué par ses effets réels d'énergie et de fatigue plutôt que par une nouvelle jauge cachée.

Les valeurs retenues à l'étape 2-G sont :

| Sortie | Prix | Capacité | Énergie | Fatigue |
| --- | ---: | ---: | ---: | ---: |
| Arcade | 20 $ | 5 | +2 | −3 |
| Cinéma | 25 $ | 5 | +4 | −5 |
| Quilles | 30 $ | 6 | +3 | −4 |
| Karting | 60 $ | 8 | +2 | −3 |

Ces effets demeurent volontairement très inférieurs à une journée de repos (+18 énergie et −12 fatigue pour 10 points de capacité). Ils ne donnent ni XP, ni statistique, ni avantage de combat. Le résultat **Détendu** est inscrit dans le bilan avec les variations réellement appliquées.

### 2. Studio média

Lieu de réputation, sans progression physique : entrevues locales, photos, balados et apparitions publiques. Consulter les possibilités est gratuit; accepter une apparition utilise une petite quantité de capacité et peut augmenter la réputation. Ce lieu prépare les commanditaires professionnels sans créer de revenu automatique au lancement.

Le Studio média est le premier lieu traité à l’étape 2-H. Une seule apparition peut être planifiée par semaine; elle peut être remplacée ou retirée avant la confirmation. Elle ne donne ni argent, ni XP, ni énergie, ni récupération, ni statistique de combat. Son gain de réputation est appliqué une seule fois lorsque la semaine est vécue.

| Apparition | Déverrouillage | Capacité | Réputation |
| --- | ---: | ---: | ---: |
| Entrevue locale | Accès au Studio | 4 | +1 |
| Séance photo | 10 réputation | 5 | +2 |
| Balado sportif | 20 réputation | 6 | +2 |
| Apparition publique | 35 réputation | 8 | +3 |

Ces valeurs gardent l’entrevue accessible dans une semaine chargée et réservent la meilleure visibilité à une apparition plus coûteuse en temps. Toutes les zones restent visibles et ouvrent leur fiche; un verrou indique le seuil requis et la réputation actuelle, sans condition cachée. Le Studio devient inutile à 100 de réputation et explique alors clairement le verrouillage. La Fédération est désormais raccordée au bassin évolutif, comme décrit dans la section suivante.

### 3. Fédération / promoteur

Lieu administratif branché sur les systèmes existants :

- au statut amateur, il présente la Fédération, le dossier de compétition et l'admissibilité aux événements;
- au statut professionnel, son identité pourra devenir celle d'un bureau de promoteur et de contrats lorsque cette carrière sera conçue.

Consulter ce lieu ne coûte aucune capacité. Les inscriptions continuent d'utiliser le calendrier et le moteur de tournoi actuels; aucun second système d'inscriptions ou de calendrier jouable n'est créé.

#### Conception retenue pour la Fédération amateur

La Fédération est un lieu de **consultation** et d'orientation, sans classement amateur. La conception a été étendue à un bassin de dix adversaires locaux persistants : leurs rencontres et leur progression sont calculées à la clôture des semaines jouées, indépendamment de la consultation du site.

Les règles proposées, les plafonds, les protections des sauvegardes et les étapes BE-A à BE-E sont détaillés dans [BASSIN-EVOLUTIF-PLAN.md](BASSIN-EVOLUTIF-PLAN.md). Cette extension remplace la proposition initiale d'annuaire statique. Le moteur BE-B, son raccordement BE-C et l’interface BE-D sont implémentés. La validation BE-E conserve les règles de progression, mais recommande de revoir les indications de risque des galas avant de déclarer l’équilibrage entièrement validé. Voir le [rapport d’intégration BE-C](BASSIN-EVOLUTIF-BE-C-RAPPORT.md), le [rapport de Fédération BE-D](BASSIN-EVOLUTIF-BE-D-RAPPORT.md) et le [rapport de validation BE-E](BASSIN-EVOLUTIF-BE-E-RAPPORT.md). Les illustrations restent une génération distincte en attente de GO; l’habillage HTML/CSS de BE-D permet déjà la consultation.

Suite à BE-E et au GO dédié, la [correction des indications de risque des galas](BASSIN-EVOLUTIF-RISQUE-CONCEPTION.md) est implémentée : conseil sportif qualitatif, préparation distincte et aucune modification des mécaniques. Le [rapport de validation](GALAS-RISQUE-RAPPORT.md) consigne 34 fichiers techniques et 75 scénarios navigateur réussis. Les essais du joueur peuvent maintenant porter sur la clarté de ces conseils.

Son accueil présente quatre accès clairs :

1. **Mon dossier amateur** : catégorie, bilan victoires-défaites-nulles, nombre de combats, réputation et médailles;
2. **Parcours des tournois** : état des six compétitions, conditions exactes, fenêtre encore ouverte ou manquée et prochaine occasion pertinente;
3. **Site de la Fédération** : annuaire des boxeurs affiliés de la même division sexuelle et de la même catégorie de poids;
4. **Ouvrir le calendrier** : unique passage vers les inscriptions, les coûts, les dates et les choix d'adversaire.

La page d'accueil met aussi en évidence :

- le prochain tournoi auquel le boxeur est réellement admissible;
- sa semaine, sa date limite et une estimation des frais lorsque ces données sont disponibles;
- toute inscription déjà confirmée;
- un avertissement si la fenêtre des Gants de bronze ou d'argent risque de se fermer.

Les états d'admissibilité proviennent exclusivement du moteur du calendrier et de ses événements réels. L'ancien catalogue de tournois ne devient pas une deuxième source de vérité.

#### Site de la Fédération et fiches affiliées

L'annuaire réutilise les dix profils locaux du sexe correspondant au personnage et leur attribue sa catégorie de poids. Il ne simule pas les autres catégories. Les adversaires créés uniquement pour un tableau de tournoi restent dans ce tableau et ne sont pas annoncés d'avance comme des affiliés locaux permanents.

La liste contient dix identités stables dont les fiches et bilans évoluent. Chaque fiche montre :

- nom et surnom;
- catégorie de poids du personnage;
- style de boxe;
- profil public qualitatif associé au style;
- statut **Affilié**, et préparation contre le joueur lorsqu'un combat est réservé;
- bilan victoires-défaites-nulles;
- historique des rencontres suivies, avec les noms des autres affiliés cliquables;
- confrontations avec le joueur lorsqu'elles existent.

Les statistiques numériques de combat, les plafonds et les probabilités demeurent cachés sur le site. Les descriptions de style restent qualitatives. Le calendrier et le ring utilisent les mêmes fiches persistantes; un gala sélectionne un adversaire approprié sans recalculer ses caractéristiques selon celles du joueur.

Le bilan initial des profils reste identifié comme antérieur au début du suivi. Le site ne lui invente pas d'anciennes rencontres. Les nouveaux résultats sont enregistrés une seule fois et apparaissent sur les deux fiches concernées.

Il n'y a pas, dans cette version :

- de classement numérique;
- de simulation des autres catégories ou des bassins de tournoi;
- de calendrier futur complet publié pour chaque affilié;
- de changement de catégorie, blessure ou retraite simulée;
- de bouton pour provoquer directement un affilié;
- de connexion à Supabase.

Un historique structuré relie les nouvelles rencontres au joueur et aux affiliés. Le journal actuel contient du texte, mais ne doit pas être interprété comme une base de données fiable ni servir à reconstruire les combats d'avant le suivi.

#### Navigation et présentation

Le bouton **Site de la Fédération** ouvre une sous-vue dans le lieu, jamais un nouvel onglet du navigateur. Un retour visible ramène à l'accueil de la Fédération; fermer le lieu ramène au Centre-ville.

Sur ordinateur, l'accueil peut placer le dossier à gauche et le parcours compétitif à droite, avec l'annuaire dans une sous-vue en grille. Sur mobile, les mêmes blocs passent en une seule colonne et les fiches s'ouvrent pleine largeur. Les deux versions possèdent exactement les mêmes renseignements et actions.

L'intérieur illustré doit évoquer un bureau de fédération amateur québécoise crédible : comptoir d'accueil, affiches de compétitions, vitrines de médailles et écran institutionnel. L'image ne doit contenir aucun texte généré important; les titres et boutons restent en HTML.

#### Protections fonctionnelles

- Entrer, consulter une fiche ou ouvrir le calendrier ne coûte ni argent, ni capacité, ni temps.
- La Fédération devient accessible avec le Centre-ville, après le premier résultat amateur officiel.
- Le verrou obligatoire de l'Aréna continue de fermer le Centre-ville lorsque le combat doit être réglé.
- Aucune inscription n'est créée ou annulée depuis la Fédération.
- Aucune statistique, récompense, réputation ou sauvegarde n'est modifiée par la consultation.
- Le parcours récréatif demeure inchangé.
- Le mode professionnel reste informatif tant que les contrats et promoteurs ne sont pas conçus.

### 4. Aéroport

Visible dès l'ouverture du Centre-ville, mais verrouillé jusqu'au statut professionnel. Son texte explique son rôle futur : camps d'une à trois semaines, dont Cuba comme première destination. L'aéroport reste informatif jusqu'à l'étape 2-I.

## Lieux différés

### Boutique d'équipement

À conserver comme possibilité, mais pas au lancement. Les suppléments possèdent déjà leur boutique et leur inventaire. Ajouter des gants, chaussures ou protections exige d'abord une règle claire de durabilité et d'effets pour ne pas créer des bonus permanents obligatoires.

### Centre de récupération

À différer tant qu'il ne possède pas un rôle distinct. Les blessures sont désactivées et la maison offre déjà le repos. Une clinique payante ne doit pas devenir une copie plus efficace de cette activité.

## Activités sociales et amis

La première version n'ajoute pas de jauge de moral ni de système complexe de relations. Les amis servent d'abord à contextualiser les sorties : invitation dans le calendrier, court texte avant la sortie et résumé de semaine.

Des invitations peuvent varier d'une semaine à l'autre sans modifier les valeurs de base :

- soirée de quilles;
- film attendu au cinéma;
- tournoi amical à l'arcade;
- sortie de karting.

Refuser ou ignorer une invitation n'entraîne aucune pénalité. Les loisirs demeurent un choix utile, jamais une corvée obligatoire.

## Contraintes de protection

- Aucun lieu existant n'est retiré ou déplacé.
- Le parcours récréatif demeure inchangé.
- Le changement de carte n'altère ni l'emploi ni la semaine.
- Une sortie ne retire jamais automatiquement le travail ou une activité planifiée.
- Le planificateur refuse simplement une sortie si la capacité restante est insuffisante.
- Les coûts et effets sont appliqués une seule fois à la confirmation.
- Les anciennes sauvegardes restent valides et commencent sur la carte du quartier.
- Les vues ordinateur, mobile, clavier et lecteur d'écran possèdent les mêmes actions.
- Les lieux non terminés restent verrouillés et expliqués; aucun bouton vide n'est activé.

## Critères d'acceptation de l'étape 2-A

- Le Centre-ville possède une identité distincte du quartier.
- Son déverrouillage repose sur un jalon visible et non sur une condition cachée.
- Le sélecteur d'en-tête rend le changement de carte gratuit et réversible.
- Le Centre de loisirs fournit la première activité concrète.
- Les quilles, l'arcade, le cinéma et le karting partagent une limite hebdomadaire commune.
- Les loisirs n'exigent pas la réactivation du moral ou des blessures.
- La Fédération réutilise le calendrier existant.
- L'aéroport prépare les camps sans les implémenter prématurément.
- Les systèmes différés sont identifiés explicitement.

## Décisions confirmées pour l'étape 2-B

1. Nom affiché : **Centre-ville**.
2. Déverrouillage : après le premier résultat amateur officiel.
3. Navigation : sélecteur unique **Quartier | Centre-ville** dans l'en-tête.
4. Lieux initiaux : Centre de loisirs, Studio média, Fédération et Aéroport verrouillé.
5. Loisirs initiaux : quilles, arcade, cinéma et karting.
6. Aucun retour de la jauge de moral; l'effet **Détendu** est expliqué par l'énergie et la fatigue.
7. Boutique d'équipement et centre de récupération différés.
