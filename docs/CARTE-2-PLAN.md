# Carte 2 — Centre-ville

## Suivi des étapes

| Étape | Objet | Statut |
| --- | --- | --- |
| 2-A | Conception fonctionnelle | Validée |
| 2-B | Navigation entre les deux cartes | Validée |
| 2-C | Composition et prompts visuels de la carte | Validée |
| 2-D | Génération des cartes ordinateur et mobile | Validée |
| 2-E | Intégration de la carte et de ses verrouillages | Implémentée, à valider |
| 2-F | Intérieur du centre de loisirs | En attente de GO |
| 2-G | Mécanique des sorties | En attente de GO |
| 2-H | Autres lieux, un à la fois | En attente de GO |
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

Les valeurs exactes seront fixées à l'étape 2-G. L'enveloppe de départ recommandée est de 5 à 8 points de capacité et de 20 à 60 $, avec un effet toujours inférieur au repos de 10 points.

### 2. Studio média

Lieu de réputation, sans progression physique : entrevues locales, photos, balados et apparitions publiques. Consulter les possibilités est gratuit; accepter une apparition utilise une petite quantité de capacité et peut augmenter la réputation. Ce lieu prépare les commanditaires professionnels sans créer de revenu automatique au lancement.

### 3. Fédération / promoteur

Lieu administratif branché sur les systèmes existants :

- au statut amateur, il présente la Fédération, le classement et l'admissibilité aux événements;
- au statut professionnel, son identité devient celle d'un bureau de promoteur et de contrats.

Consulter ce lieu ne coûte aucune capacité. Les inscriptions continuent d'utiliser le calendrier et le moteur de tournoi actuels; aucun second système d'événements n'est créé.

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
