# Adversaire officielle féminine — poses amateurs

Création avec ImageGen intégré, à partir des visuels officiels existants. Un seul jeu de poses pour les dix noms féminins du catalogue, indépendant du portrait de la joueuse.

## Livrables

- `assets/combat-official-opponent-female-front-atlas-v1.png`
- `assets/combat-official-opponent-female-back-atlas-v1.png`

Atlas PNG transparents 1254 × 1254, grille 3 × 2 : garde, jab, corps, crochet, esquive, impact. Orientation naturelle vers la gauche. Tenue amateur rouge et blanche conservée.

Les deux premières générations ont été retenues : face `exec-9ed27b60-aaf5-48f9-bb55-9208a4be397f.png`, dos `exec-beb64c69-5ec2-4ef3-9aee-6130e759e1d5.png`. Les essais suivants de réduction par ImageGen n'ont pas été retenus car ils altéraient le crochet ou réduisaient trop les silhouettes.

Préparation avec `scripts/key-checkerboard.cjs --repack-grid=3x2`. Pour le dos, `--sprite-scale=0.9` réduit uniformément les six silhouettes pendant le placement, afin que le jab tienne dans sa case et que la hauteur reste proche de la face. Le mode de préparation existant conserve son résultat identique sans cette option.

## Intégration

- Combats locaux et tournois amateurs féminins, tous les portraits de joueuse.
- Les noms et caractéristiques viennent toujours du catalogue et du moteur existants.
- Nadia et Rémy restent réservés au sparring; les adversaires masculins conservent leurs visuels.
- Les poses utilisent uniquement les intentions montrées et signaux visuels déjà disponibles.
- Déplacements, fatigue, dégâts, scores, juges, résultats et effets de knockdown inchangés.
- Les scènes avant combat, au coin et après combat conservent les images existantes; repli sur l'image existante si un atlas ne charge pas.

## Vérification

- `npm test` : 36 fichiers réussis.
- `node --check script.js` et `git diff --check` réussis.
- Test de sélection pour les dix adversaires féminines, les trois portraits et les deux types de combat; exclusion des hommes, du sparring et du statut professionnel.
- Chrome, parcours normal : création Erika Test, six semaines récréatives, sparring Nadia, inscription au gala du gym contre Amara Okafor, combat officiel terminé en trois rounds.
- HUD Erika / Amara, atlas officiel actif, filtre couleur normal, réactions jab/crochet/esquive/impact et retour en garde observés. Sprites retirés au coin et au résultat.
- Largeur mobile 390 × 844 : pas de débordement horizontal; émulation retirée ensuite.
- La vue de dos et le coup au corps ont été inspectés dans les atlas. Ils n'ont pas été observés pendant ce combat précis; leur routage réutilise le système d'orientation et de poses existant. Le tournoi est couvert par le test de sélection, sans tournoi complet joué dans Chrome.

## Face — prompt retenu

Use case: stylized-concept
Asset type: production boxing game transparent sprite atlas, official female amateur opponent.
Input image: exact character identity, uniform, proportions and camera orientation reference. Preserve this adult athletic Black woman with brown skin, dark cornrow braids tied into a small bun, red padded amateur headguard, shiny red sleeveless boxing singlet with white trim, red satin boxing shorts with white side stripe, red gloves with black cuffs, white socks, red boxing boots with black soles. No T-shirt.
Create ONE square atlas, 3 columns by 2 rows of six equal portrait cells. Same character and body scale in every cell, entire body inside each cell with at least 5% empty margin. Feet at 92% cell height.
All figures aim screen LEFT.
Exact order: TOP LEFT balanced guard; TOP CENTER clearly extended straight lead jab LEFT at head height, rear glove protects cheek; TOP RIGHT rear-hand straight punch LEFT downward to body height, knees bent, opposite glove protects face; BOTTOM LEFT compact horizontal lead hook at head height with elbow bent 90 degrees, other glove at cheek; BOTTOM CENTER defensive slip/duck with bent knees, both gloves by face; BOTTOM RIGHT restrained recoil from impact, slight backward lean with both feet grounded.
Realistic painted sports game illustration matching reference. Exactly two arms, gloves, legs per figure. No overlap between cells.
TRUE transparent alpha PNG background; no checkerboard, matte, floor, shadows, ring, other people, labels, text, borders, blood or injury.
Camera: three-quarter FRONT view in all six cells, chest visible, face looking screen LEFT. Preserve input orientation.

## Dos — prompt retenu

Use case: stylized-concept
Asset type: production boxing game transparent sprite atlas, official female amateur opponent.
Input image: exact character identity, uniform, proportions and camera orientation reference. Preserve this adult athletic Black woman with brown skin, dark cornrow braids tied into a small bun, red padded amateur headguard, shiny red sleeveless boxing singlet with white trim, red satin boxing shorts with white side stripe, red gloves with black cuffs, white socks, red boxing boots with black soles. No T-shirt.
Create ONE square atlas, 3 columns by 2 rows of six equal portrait cells. Same character and body scale in every cell, entire body inside each cell with at least 5% empty margin. Feet at 92% cell height.
All figures aim screen LEFT.
Exact order: TOP LEFT balanced guard; TOP CENTER clearly extended straight lead jab LEFT at head height, rear glove protects cheek; TOP RIGHT rear-hand straight punch LEFT downward to body height, knees bent, opposite glove protects face; BOTTOM LEFT compact horizontal lead hook at head height with elbow bent 90 degrees, other glove at cheek; BOTTOM CENTER defensive slip/duck with bent knees, both gloves by face; BOTTOM RIGHT restrained recoil from impact, slight backward lean with both feet grounded.
Realistic painted sports game illustration matching reference. Exactly two arms, gloves, legs per figure. No overlap between cells.
TRUE transparent alpha PNG background; no checkerboard, matte, floor, shadows, ring, other people, labels, text, borders, blood or injury.
Camera: three-quarter REAR view in all six cells, BACK visible, face looking screen LEFT over shoulder. Preserve input orientation.

