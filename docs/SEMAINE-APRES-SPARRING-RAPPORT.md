# Confirmation de semaine après un sparring

## Problème confirmé

Une sauvegarde au mardi matin, après le sparring du lundi, ne pouvait pas confirmer son programme restant : séance de l’entraîneur et journée de repos. L’énergie, la capacité et l’abonnement étaient suffisants.

Le contrôleur transmettait correctement un budget de deux séances physiques au total : une déjà faite et une à venir. La normalisation du moteur hebdomadaire ramenait ce budget à une seule séance, car elle ne comptait que le programme fourni. L’exécution déduisait ensuite le sparring historique et ignorait l’entraînement. La protection transactionnelle annulait alors toute la confirmation avec le message générique « Allège ou réorganise le programme ».

## Correction ciblée

Seule la normalisation du budget physique dans `week-engine.js` est modifiée. Le plafond du plan fourni tient désormais compte des activités physiques déjà réalisées cette semaine et des entrées physiques encore à venir.

- Les anciennes entrées d’un plan complet repris ne sont pas comptées deux fois.
- Le budget explicite, s’il est inférieur, continue de s’appliquer.
- La limite technique existante de sept activités physiques par semaine reste inchangée; les limites plus strictes du planificateur sont conservées.
- Une seule activité physique principale reste autorisée par jour.
- L’historique d’une semaine précédente ne donne pas de capacité supplémentaire.
- Aucun changement aux prix, gains, suppléments, séances privées, emplois, abonnements, combats, tournois ou sauvegardes.

## Validation

- Huit nouveaux tests techniques couvrent la reprise rapide/hybride, le budget implicite, un budget déjà épuisé, le plan complet repris, la limite quotidienne, le plafond hebdomadaire et l’exclusion des semaines passées. Les trois tests reproduisant directement le défaut échouaient avant correction et passent après.
- `npm test` : 35 fichiers de tests réussis, dont 28 cas dans le moteur hebdomadaire.
- Deux nouveaux parcours Chromium, à 1366 et 390 px, vérifient la confirmation après sparring avec coach, repos et travail : salaire versé une fois, aucune absence ajoutée, abonnements décrémentés une fois et rechargement stable.
- Copie isolée de la sauvegarde du joueur : confirmation réussie sur les deux largeurs, une seule séance du coach et un seul repos, aucun sparring rejoué, aucun débit supplémentaire, séance privée et inventaire inchangés.
- `npm run test:browser -- --workers=1` : 83 scénarios Chromium réussis en 6,4 minutes, incluant tutoriel, passage amateur, emploi, vacances, abonnements, aréna, tournois, médailles, entraînements, Fédération et carrières longues.
- Vérification syntaxique et `git diff --check` réussis.

Les tests utilisent des navigateurs et sauvegardes isolés. La partie ouverte dans Chrome n’a pas été avancée. Aucun commit ni push effectué.

## Attention au programme actuel

La sauvegarde examinée ne contient pas de travail dans le programme restant, et le choix d’exclure le travail est actif. La confirmer telle quelle ajoute une absence selon la mécanique existante. Le correctif ne réinsère aucune activité et ne change pas ce choix : il faut réajouter le travail avant confirmation si l’on souhaite éviter cette absence.
