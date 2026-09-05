# Abonnements des gyms — harmonisation

## Périmètre autorisé

GO du joueur : harmoniser l’abonnement du gym de boxe et celui du gym de musculation, afficher leur état sur la carte et améliorer la clarté du paiement, sans modifier les autres systèmes.

Implémentation réalisée et vérifiée le 4 septembre 2026. Les tests automatisés sont tous réussis; aucun commit ni push effectué.

## Résultat visible

- Les deux accueils utilisent les mêmes cartes de forfaits, le même gabarit pleine page et les mêmes commandes. Les tarifs restent propres à chaque gym.
- Sur téléphone, les forfaits sont empilés verticalement et les boutons restent accessibles sans défilement horizontal.
- Les boutons des gyms sur la carte portent une pastille : verte pour plusieurs semaines, orange pour la dernière semaine, rouge « Non abonné ». Le gym de musculation verrouillé conserve « Amateur requis ».
- L’accueil affiche le solde, les semaines restantes et la dernière semaine couverte. La semaine courante compte dans le solde : 4 semaines achetées en semaine 10 couvrent les semaines 10 à 13.
- Chaque achat passe par une confirmation avec la durée, le prix, le solde après achat et l’échéance. Le paiement unique et l’absence de renouvellement automatique sont explicités.
- Fermer ou annuler la confirmation ne débite rien. Un double déclenchement, une confirmation devenue périmée ou un rechargement ne provoquent pas de paiement supplémentaire.

## Mécaniques préservées

- Boxe : 110 $ pour 4 semaines; 285 $ pour 12 semaines.
- Musculation : 95 $ pour 4 semaines; 270 $ pour 12 semaines.
- Pas de prolongation anticipée : l’abonnement actuel doit expirer avant un nouvel achat, comme auparavant.
- Pas de nouveau verrou à l’entrée d’un gym non abonné : son accueil reste consultable lorsque le lieu est accessible.
- Le premier mois de boxe reste obligatoire et son budget reste protégé. Son écran initial demeure bloquant, mais reprend les mêmes cartes et la même confirmation. Annuler le paiement ramène à ce choix obligatoire.
- Le parcours récréatif, le passage amateur, les entraînements, les suppléments, l’emploi, les vacances, les combats, les tournois et le bassin évolutif ne sont pas modifiés.
- Le décompte reste appliqué une seule fois à la clôture effective de la semaine. Le verrou de combat conserve sa priorité.
- Aucun champ durable ni aucune migration de sauvegarde n’est ajouté. La confirmation est uniquement un état temporaire d’interface.

Comparaison avec le début du chantier : les 19 fichiers de moteurs et d’intégration contrôlés ont des empreintes SHA-256 identiques. Les deux fonctions de paiement, le calcul du budget réservé, la clôture hebdomadaire, l’exécution de semaine et les règles d’accès aux lieux sont également identiques.

## Vérifications

- `npm test` : 35 fichiers de tests techniques réussis.
- `npm run test:browser -- --workers=1` : 81 scénarios réussis en 6,4 minutes, dont les parcours existants de tutoriel, aréna, tournois, médailles, emploi, vacances, entraînements, suppléments, Fédération, sauvegardes et carrières longues.
- Vérification de syntaxe des cinq scripts JavaScript modifiés ou ajoutés et `git diff --check` : réussies.
- Nouveaux scénarios : achat/annulation/clavier/recharge à 1366, 390 et 320 px; expiration réelle sur deux semaines; renouvellement; argent insuffisant; devis périmé; verrou de combat; abandon d’une confirmation au rechargement.
- Vérification renforcée du premier abonnement : annuler le paiement conserve le tutoriel bloquant et toutes les données intactes.
- Captures inspectées : les deux accueils sur ordinateur/mobile, la confirmation et les pastilles de carte. Les tests contrôlent aussi les débordements et les hauteurs des commandes.

Ces vérifications utilisent Chromium automatisé avec des sauvegardes isolées, pas la partie ouverte dans Chrome. Les formats téléphone sont simulés; aucun appareil physique n’a été testé.

## Essai rapide du joueur

Recharger le jeu, comparer les pastilles des deux gyms, puis ouvrir leur accueil. Avec un abonnement expiré et suffisamment d’argent, choisir un forfait, annuler une première fois, puis confirmer : seul le paiement confirmé doit modifier l’argent et le compteur correspondant.

L’avis visuel du joueur reste à recueillir avant toute autre modification ou commit.
