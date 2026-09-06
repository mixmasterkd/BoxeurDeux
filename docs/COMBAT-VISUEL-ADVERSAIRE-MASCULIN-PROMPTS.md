# Adversaire officiel masculin — poses amateurs

Création avec ImageGen intégré, à partir des visuels officiels existants. Un seul jeu de poses est partagé par les dix noms masculins du catalogue, indépendamment du portrait du joueur.

## Livrables

- `assets/combat-official-opponent-male-front-atlas-v1.png`
- `assets/combat-official-opponent-male-back-atlas-v1.png`

Atlas transparents 1254 × 1254 en grille 3 × 2 : garde, jab, corps, crochet, esquive et impact. Orientation naturelle vers la gauche. La tenue amateur rouge et blanche existante est conservée.

La génération initiale de face `exec-45221811-c4d5-45f8-a877-0347fb4f129d.png` et celle de dos `exec-596ecda9-e5ab-41ac-bec3-e046f8f4d6a1.png` ont servi de base. Le crochet a été corrigé séparément dans les deux vues. Les livrables finaux proviennent de `exec-0a83da9c-b4ca-4725-ae9e-25d1f64e873b.png` et `exec-ec61396d-c458-47e7-a864-f322cfe42162.png`.

Les damiers ont été détourés et les silhouettes recentrées avec `scripts/key-checkerboard.cjs --repack-grid=3x2`. La vue de face utilise `--sprite-scale=0.9` afin que le jab reste entièrement dans sa cellule.

## Intégration

- Combats locaux et tournois amateurs masculins, pour les trois portraits.
- Même système de présentation que l’adversaire officielle féminine.
- Les dix noms et leurs caractéristiques restent fournis par le catalogue et le moteur existants.
- Rémy reste réservé au sparring masculin.
- Les poses dépendent uniquement des intentions montrées et des signaux visuels existants.
- Aucun changement aux actions, déplacements, énergie, fatigue, dégâts, scores, juges, résultats ou knockdowns.

## Vérification

- `npm test` : 36 fichiers réussis; vérifications de syntaxe et de diff réussies.
- Les empreintes de `combat-engine.js` et `sparring-ring-engine.js` restent inchangées.
- Le test de sélection couvre les dix adversaires, les trois portraits, les combats locaux et les tournois; il exclut le statut professionnel et le sparring.
- Chrome, parcours normal : création d’Alex Test, six semaines récréatives, sparring contre Rémy, passage amateur, réservation d’un gala et combat officiel complet contre Darnell Okafor.
- HUD Alex / Darnell, atlas officiel masculin actif, couleurs normales et poses garde, jab, corps, crochet, esquive et impact observées durant les trois rounds.
- Les sprites sont retirés pendant les pauses au coin et au résultat.
- Largeur mobile 390 × 844 : aucun débordement horizontal; émulation retirée ensuite.
- La vue de dos a été inspectée dans l’atlas. Elle n’est pas apparue durant ce combat précis; son routage réutilise le système d’orientation déjà validé.

## Prompt initial — face

Use case: stylized-concept
Asset type: production transparent boxing game sprite atlas for one shared official male amateur opponent.
Input image: exact character identity, clothing, proportions, art style, and camera orientation reference.
Primary request: Create ONE square 3-column by 2-row atlas with six equal cells. Use the same adult muscular Black man throughout: medium-brown skin, short tightly curled black hair, light short beard and moustache, red padded amateur headguard, shiny red sleeveless singlet with white trim, red satin shorts with a white side stripe, red gloves with black cuffs, white socks, red boots with black soles. Preserve the reference identity and equipment.
Composition: Every figure faces screen LEFT. Full body visible in each cell; consistent scale; feet near 90% of cell height; at least 7% empty margin; visible gutters; no overlap or crop.
Exact order:
TOP LEFT: balanced boxing guard.
TOP CENTER: clear straight lead jab LEFT at head height, rear glove protecting cheek.
TOP RIGHT: rear-hand straight body punch diagonally LEFT/downward toward abdomen height, knees bent, opposite glove protecting face.
BOTTOM LEFT: compact horizontal lead hook at head height, elbow clearly bent 90 degrees, other glove at cheek; visibly different from the jab.
BOTTOM CENTER: defensive slip and duck, knees bent, both gloves near face.
BOTTOM RIGHT: restrained recoil after receiving a punch, slight backward lean, feet grounded, gloves near face.
Style: premium realistic painted sports game art matching the reference.
Constraints: exactly two arms, two gloves, two legs per figure. TRUE transparent alpha PNG background. No checkerboard, matte, floor, shadow, ring, opponent, text, labels, borders, blood, or injury.
Camera: three-quarter FRONT view in every cell; chest visible; preserve the input orientation.

## Correction du crochet — face

Use case: precise-object-edit.
Edit this exact six-pose boxing atlas. Change ONLY the BOTTOM LEFT cell.
Replace its straight extended arm with a clearly recognizable compact LEFT HOOK aimed screen-left: elbow bent about 90 degrees, elbow raised to shoulder height, upper arm roughly horizontal, forearm curved inward across the chest, punching glove close to the left side of the head rather than far away. Rear glove stays at cheek.
Keep the other five cells pixel-compositionally unchanged. Preserve the same man, face, red amateur uniform, proportions, full-body scale, three-quarter front camera, 3x2 grid, spacing and transparent alpha background.
No crop, overlap, checkerboard, shadow, text, extra limbs, blood or injury.

## Prompt initial — dos

Use case: stylized-concept
Asset type: production transparent boxing game sprite atlas for one shared official male amateur opponent.
Input image: exact character identity, clothing, proportions, art style, and camera orientation reference.
Primary request: Create ONE square 3-column by 2-row atlas with six equal cells. Use the same adult muscular Black man throughout: medium-brown skin, short tightly curled black hair, light short beard and moustache, red padded amateur headguard, shiny red sleeveless singlet with white trim, red satin shorts with a white side stripe, red gloves with black cuffs, white socks, red boots with black soles. Preserve the reference identity and equipment.
Composition: Every figure faces screen LEFT. Full body visible in each cell; consistent scale; feet near 90% of cell height; at least 7% empty margin; visible gutters; no overlap or crop.
Exact order:
TOP LEFT: balanced boxing guard.
TOP CENTER: clear straight lead jab LEFT at head height, rear glove protecting cheek.
TOP RIGHT: rear-hand straight body punch diagonally LEFT/downward toward abdomen height, knees bent, opposite glove protecting face.
BOTTOM LEFT: compact horizontal lead hook at head height, elbow clearly bent 90 degrees, other glove at cheek; visibly different from the jab.
BOTTOM CENTER: defensive slip and duck, knees bent, both gloves near face.
BOTTOM RIGHT: restrained recoil after receiving a punch, slight backward lean, feet grounded, gloves near face.
Style: premium realistic painted sports game art matching the reference.
Constraints: exactly two arms, two gloves, two legs per figure. TRUE transparent alpha PNG background. No checkerboard, matte, floor, shadow, ring, opponent, text, labels, borders, blood, or injury.
Camera: three-quarter REAR view in every cell; back visible; head may look screen LEFT over the shoulder; preserve the input orientation.

## Correction du crochet — dos

Use case: precise-object-edit.
Edit this exact six-pose boxing atlas. Change ONLY the BOTTOM LEFT cell.
Replace its straight extended arm with a clearly recognizable compact LEFT HOOK aimed screen-left: elbow bent about 90 degrees, elbow raised to shoulder height, upper arm roughly horizontal, forearm curved inward across the body, punching glove kept close rather than far away. Rear glove stays at cheek.
Keep the other five cells pixel-compositionally unchanged. Preserve the same man, red amateur uniform, proportions, full-body scale, three-quarter rear camera with back visible, 3x2 grid, spacing and transparent alpha background.
No crop, overlap, checkerboard, shadow, text, extra limbs, blood or injury.
