# Visuels de combat — premier personnage masculin

Ce lot couvre seulement le premier portrait masculin jouable. Les poses suivent l’ordre `garde, jab, corps, crochet, esquive, impact` dans une grille 3 × 2. Les cartes suivent la grille 5 × 2 déjà utilisée par le premier personnage féminin. Les images ont été produites avec l’outil ImageGen intégré, puis vérifiées visuellement et intégrées sans modifier les calculs du combat.

## Atlas sparring — vue avant

Source ImageGen retenue : `/home/mixmasterkd/.codex/generated_images/01a07346-23ff-74f0-9e25-1ed5c83f3058/exec-db058585-2846-461b-88c1-91cd0007ef69.png`

Fichier du projet : `assets/combat-player-male-1-sparring-front-atlas-v1.png`

```text
Use case: stylized-concept
Asset type: production transparent boxing game sprite atlas for the first playable male character.
Input image: exact identity, clothing, colors, body proportions, art style, and camera orientation reference.
Primary request: Create ONE square 3-column by 2-row atlas with six equal cells. Same young adult athletic light-skinned man in every cell: short curly brown hair, clean-shaven face, navy padded headguard, navy gloves with black-and-white cuffs, navy training T-shirt, navy training shorts with black waistband, white socks, navy boxing boots with pale side accents. Preserve the reference identity and equipment.
Composition: All figures aim screen RIGHT. Full body visible within each cell; consistent body scale; feet near 90% cell height; at least 7% empty margins and clear gutters; no overlap or crop.
Exact cell order:
TOP LEFT balanced boxing guard.
TOP CENTER clear straight lead jab RIGHT at head height, rear glove protecting cheek.
TOP RIGHT rear-hand straight body punch diagonally RIGHT/downward toward abdomen height, knees bent, opposite glove protecting face.
BOTTOM LEFT compact horizontal lead hook RIGHT at head height, elbow clearly bent about 90 degrees, other glove at cheek; visibly distinct from a jab.
BOTTOM CENTER defensive slip and duck, knees bent, both gloves near face.
BOTTOM RIGHT restrained recoil after receiving a punch, slight backward lean, both feet grounded, gloves near face.
Style: premium realistic painted sports game art matching the reference.
Constraints: exactly two arms, two gloves, two legs per figure. TRUE transparent alpha PNG background. No checkerboard, matte, glow, floor, shadow, ring, opponent, text, labels, borders, blood or injury.
Camera: three-quarter FRONT view in every cell, chest visible; preserve input orientation.

Correction appliquée au crochet :

Use case: precise-object-edit.
Edit this exact six-pose sparring atlas. Change ONLY the BOTTOM LEFT cell.
Replace its straight arm with a clearly recognizable compact lead hook aimed screen-right: elbow bent about 90 degrees and raised near shoulder height, forearm curving horizontally inward, punching glove close to the right side of the head rather than far away; rear glove protects cheek.
Keep the other five cells, same man, navy T-shirt and shorts, headguard, proportions, three-quarter front camera, square 3x2 layout, spacing and scale unchanged. Clean true transparent alpha background. No crop, checkerboard, glow, text, extra limbs, blood or injury.
```

## Atlas sparring — vue arrière

Source ImageGen retenue : `/home/mixmasterkd/.codex/generated_images/01a07346-23ff-74f0-9e25-1ed5c83f3058/exec-7264828f-f4bc-4d90-8936-ad43c45689cc.png`

Fichier du projet : `assets/combat-player-male-1-sparring-back-atlas-v1.png`

```text
Use case: stylized-concept
Asset type: production transparent boxing game sprite atlas for the first playable male character.
Input image: exact identity, clothing, colors, body proportions, art style, and camera orientation reference.
Primary request: Create ONE square 3-column by 2-row atlas with six equal cells. Same young adult athletic light-skinned man in every cell: short curly brown hair, clean-shaven face, navy padded headguard, navy gloves with black-and-white cuffs, navy training T-shirt, navy training shorts with black waistband, white socks, navy boxing boots with pale side accents. Preserve the reference identity and equipment.
Composition: All figures aim screen RIGHT. Full body visible within each cell; consistent body scale; feet near 90% cell height; at least 7% empty margins and clear gutters; no overlap or crop.
Exact cell order:
TOP LEFT balanced boxing guard.
TOP CENTER clear straight lead jab RIGHT at head height, rear glove protecting cheek.
TOP RIGHT rear-hand straight body punch diagonally RIGHT/downward toward abdomen height, knees bent, opposite glove protecting face.
BOTTOM LEFT compact horizontal lead hook RIGHT at head height, elbow clearly bent about 90 degrees, other glove at cheek; visibly distinct from a jab.
BOTTOM CENTER defensive slip and duck, knees bent, both gloves near face.
BOTTOM RIGHT restrained recoil after receiving a punch, slight backward lean, both feet grounded, gloves near face.
Style: premium realistic painted sports game art matching the reference.
Constraints: exactly two arms, two gloves, two legs per figure. TRUE transparent alpha PNG background. No checkerboard, matte, glow, floor, shadow, ring, opponent, text, labels, borders, blood or injury.
Camera: three-quarter REAR view in every cell, back visible; face may look screen RIGHT over shoulder; preserve input orientation.
CRITICAL FIT: output must remain a SQUARE 3x2 atlas with portrait-shaped cells. Draw each silhouette about 72% of cell height and no more than 74% of cell width. Large empty gutters. The top-right body-punch glove and every limb must be fully visible. Clean true transparency with no colored edge glow.

Nettoyage intermédiaire des contours :

Use case: background-extraction.
Clean this exact six-pose sprite atlas. Remove ONLY the red, yellow, blue, magenta or cyan fringe/glow pixels around the outer silhouettes and replace all background with true transparent alpha. Preserve every boxer pose, identity, navy T-shirt, navy shorts, navy gloves, headguard, anatomy, scale, cell positions and camera angles exactly. Do not redraw, resize or move the figures. Keep natural anti-aliased edges with no colored halo.
Exactly six full-body figures in the same 3x2 arrangement. No checkerboard, matte, glow, floor, shadow, text, borders, extra limbs, blood or injury.

Correction de cadrage intermédiaire :

Use case: precise-object-edit.
Recompose this exact six-pose rear-view boxing atlas so every complete silhouette is 82% of its current size and centered inside its own equal 3x2 cell. Preserve the same man, navy sparring gear, all six exact poses, rear camera, art style and cell order. Restore the FULL right glove in the TOP RIGHT body-punch cell; it must be entirely visible with empty space beyond it. Preserve the compact bent-elbow hook in BOTTOM LEFT.
All figures aim screen RIGHT. Keep at least 8% blank margin around every hand, elbow, head and foot. No part may touch or cross the image or cell edges.
True transparent alpha background, clean natural edges, no colored fringe, checkerboard, matte, glow, floor, shadow, text, borders, extra limbs, blood or injury.
```

## Atlas combat officiel — vue avant

Source ImageGen retenue : `/home/mixmasterkd/.codex/generated_images/01a07346-23ff-74f0-9e25-1ed5c83f3058/exec-6bb1e099-96d0-4d32-b4fc-e707cab34a1b.png`

Fichier du projet : `assets/combat-player-male-1-official-front-atlas-v1.png`

```text
Use case: stylized-concept
Asset type: production transparent boxing game sprite atlas for the first playable male character.
Input image: exact identity, clothing, colors, body proportions, art style, and camera orientation reference.
Primary request: Create ONE square 3-column by 2-row atlas with six equal cells. Same young adult athletic light-skinned man in every cell: short curly brown hair, clean-shaven face, navy padded headguard, navy gloves with black-and-white cuffs, shiny royal-blue sleeveless amateur singlet with white trim, royal-blue satin amateur shorts with white side stripes and a white-and-black waistband, white socks, navy boxing boots with pale side accents. Preserve the reference identity and equipment.
Composition: All figures aim screen RIGHT. Full body visible within each cell; consistent body scale; feet near 90% cell height; at least 7% empty margins and clear gutters; no overlap or crop.
Exact cell order:
TOP LEFT balanced boxing guard.
TOP CENTER clear straight lead jab RIGHT at head height, rear glove protecting cheek.
TOP RIGHT rear-hand straight body punch diagonally RIGHT/downward toward abdomen height, knees bent, opposite glove protecting face.
BOTTOM LEFT compact horizontal lead hook RIGHT at head height, elbow clearly bent about 90 degrees, other glove at cheek; visibly distinct from a jab.
BOTTOM CENTER defensive slip and duck, knees bent, both gloves near face.
BOTTOM RIGHT restrained recoil after receiving a punch, slight backward lean, both feet grounded, gloves near face.
Style: premium realistic painted sports game art matching the reference.
Constraints: exactly two arms, two gloves, two legs per figure. TRUE transparent alpha PNG background. No checkerboard, matte, glow, floor, shadow, ring, opponent, text, labels, borders, blood or injury.
Camera: three-quarter FRONT view in every cell, chest visible; preserve input orientation.
CRITICAL FIT: output must remain a SQUARE 3x2 atlas with portrait-shaped cells. Draw each silhouette about 78% of cell height and no more than 78% of cell width. Large empty gutters. Every glove and foot must be fully visible. Clean true transparency with no red, yellow, blue, magenta, or cyan edge glow.
```

## Atlas combat officiel — vue arrière

Source ImageGen retenue : `/home/mixmasterkd/.codex/generated_images/01a07346-23ff-74f0-9e25-1ed5c83f3058/exec-764f101e-a795-415f-aa6c-b4a04678c0e9.png`

Fichier du projet : `assets/combat-player-male-1-official-back-atlas-v1.png`

```text
Use case: stylized-concept
Asset type: production transparent boxing game sprite atlas for the first playable male character.
Input image: exact identity, clothing, colors, body proportions, art style, and camera orientation reference.
Primary request: Create ONE square 3-column by 2-row atlas with six equal cells. Same young adult athletic light-skinned man in every cell: short curly brown hair, clean-shaven face, navy padded headguard, navy gloves with black-and-white cuffs, shiny royal-blue sleeveless amateur singlet with white trim, royal-blue satin amateur shorts with white side stripes and a white-and-black waistband, white socks, navy boxing boots with pale side accents. Preserve the reference identity and equipment.
Composition: All figures aim screen RIGHT. Full body visible within each cell; consistent body scale; feet near 90% cell height; at least 7% empty margins and clear gutters; no overlap or crop.
Exact cell order:
TOP LEFT balanced boxing guard.
TOP CENTER clear straight lead jab RIGHT at head height, rear glove protecting cheek.
TOP RIGHT rear-hand straight body punch diagonally RIGHT/downward toward abdomen height, knees bent, opposite glove protecting face.
BOTTOM LEFT compact horizontal lead hook RIGHT at head height, elbow clearly bent about 90 degrees, other glove at cheek; visibly distinct from a jab.
BOTTOM CENTER defensive slip and duck, knees bent, both gloves near face.
BOTTOM RIGHT restrained recoil after receiving a punch, slight backward lean, both feet grounded, gloves near face.
Style: premium realistic painted sports game art matching the reference.
Constraints: exactly two arms, two gloves, two legs per figure. TRUE transparent alpha PNG background. No checkerboard, matte, glow, floor, shadow, ring, opponent, text, labels, borders, blood or injury.
Camera: three-quarter REAR view in every cell, back visible; face may look screen RIGHT over shoulder; preserve input orientation.
```

## Cartes d’actions

Source ImageGen retenue : `/home/mixmasterkd/.codex/generated_images/01a07346-23ff-74f0-9e25-1ed5c83f3058/exec-6c0d0cef-75e9-4957-98e6-6e2e7d6c8570.png`

Fichier du projet : `assets/combat-actions-male-1-atlas-v1.png`

```text
Use case: stylized-concept
Asset type: production boxing action-card atlas for the first playable male character.
Input Image 1: exact 5-column by 2-row action-card layout, dark studio background, opponent treatment, framing, visual language, and cell order reference. Input Image 2: exact identity, navy sparring clothing, headguard, gloves, physique and colors for the playable man.
Create ONE wide 5-column by 2-row atlas of ten equal landscape cards. Replace the female blue boxer in Image 1 with the same young adult athletic light-skinned man from Image 2: short curly brown hair, clean-shaven, navy padded headguard, navy T-shirt, navy shorts, navy gloves, white socks and navy boots. A charcoal-black anonymous sparring silhouette may appear where the reference action needs an opponent.
Exact cells:
TOP 1 cautious jab; TOP 2 fast combination with two visible motion beats; TOP 3 body punch; TOP 4 compact head hook; TOP 5 feint with a restrained gold directional cue.
BOTTOM 1 controlled forward pressure/retake center with full body and subtle floor arrow; BOTTOM 2 parry-counter; BOTTOM 3 high compact guard absorbing a punch; BOTTOM 4 lateral evade/pivot with full body and subtle floor arrow; BOTTOM 5 clinch.
Match the existing atlas: premium realistic painted sports-game art, deep black-green background, consistent warm rim light, readable boxing anatomy, strong subject separation. No text or labels. No blood, injury, logos or watermark. Every action stays inside its exact cell with no overlap across borders.
```

## Traitement et validation

- Les quatre atlas de poses ont été convertis en PNG RGBA 1254 × 1254 et repaquetés en cellules égales avec `scripts/key-checkerboard.cjs`.
- La vue avant de sparring a été repaquetée à l’échelle 0,95 et la vue arrière officielle à 0,93 pour conserver les marges autour des silhouettes.
- L’atlas des cartes mesure 1983 × 793 et conserve les dix actions dans l’ordre de la banque existante.
- Vérification dans le parcours normal : sparring contre Rémy, combat officiel contre un adversaire de la banque, orientations avant et arrière, transitions de coin, résultat et affichage mobile 390 × 844 sans débordement horizontal.
- Les deux moteurs de combat sont restés inchangés; seule la présentation sélectionne ces fichiers pour le portrait masculin 1.

