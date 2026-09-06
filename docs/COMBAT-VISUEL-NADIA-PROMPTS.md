# Nadia — poses de sparring

Production avec ImageGen intégré, à partir des références existantes `assets/sparring-nadia-front-v1.png` et `assets/sparring-nadia-back-v1.png`.

Livrables :
- `assets/combat-sparring-nadia-front-atlas-v1.png`
- `assets/combat-sparring-nadia-back-atlas-v1.png`

Six poses par atlas 3 × 2 : garde, jab, corps, crochet, esquive, impact. Direction naturelle vers la gauche, identique au rôle adverse existant. Les sorties RGB avec damier ont été détourées et recentrées avec `scripts/key-checkerboard.cjs --repack-grid=3x2`, comme les atlas précédents.

Les poses s'appliquent aux sparrings féminins, indépendamment du portrait de la joueuse. Elles utilisent seulement l'intention déjà montrée et les signaux visuels des échanges. Aucune lecture du plan caché, des notes, des dégâts ou du générateur aléatoire. Les écrans avant/coin/après, les déplacements et les effets de knockdown existants conservent leur rôle.

## Face — prompt initial

Use case: stylized-concept
Asset type: transparent sprite atlas for Nadia, the female sparring opponent in a boxing game.
Input image: exact identity, clothing, proportions and three-quarter FRONT camera reference. Keep this adult athletic woman's face, muscular build, twin dark braids, burgundy padded headguard, burgundy short-sleeved training T-shirt and matching shorts, burgundy boxing gloves with black cuffs, white socks and burgundy boots with black soles. No singlet.
Create ONE square 3-column by 2-row atlas, six equal portrait cells aspect ratio 2:3. FULL BODY in every cell, each completely isolated.
All poses face screen-LEFT, three-quarter FRONT view with chest visible. This natural direction is essential because she is the opponent on the right, aiming left. Do not turn toward screen-right.
Exact cell order: top left balanced neutral guard; top middle clear straight lead jab toward LEFT at head height with other hand guarding; top right compact rear-hand body punch aimed LEFT and lower with other glove near face; bottom left compact bent-elbow lead hook toward LEFT; bottom middle defensive slip/duck with both gloves near face, bent knees; bottom right controlled recoil from a received blow, leaning slightly back while keeping both feet grounded.
Premium realistic painted sports game art matching reference. Consistent anatomy, outfit, body scale and foot baseline at 92% cell height. Generous clear margins in every cell. Fit the full extent of every limb INSIDE its cell; no overlap or crossing between cells, no tiny partial adjacent feet, no cropping. Head in guard around 8% cell height. Exactly two arms, two legs and two gloves per figure.
Background MUST be genuinely transparent alpha PNG, not a painted checkerboard. Remove reference background glow entirely. No floor, shadow, gradient, ring, opponent, text, grid, labels, borders, blood or injury.

## Face — correction retenue

Edit this exact Nadia sprite atlas. Preserve identity, burgundy T-shirt, shorts, red headguard/gloves/boots, twin braids, all six cell positions, full-body scale, LEFT facing three-quarter FRONT camera, and poses in top-left, top-middle, bottom-middle, bottom-right. Correct TWO poses ONLY: top-right BODY PUNCH: extend her rear punching arm diagonally LEFT downward at opponent abdomen height, knees flexed, other glove stays at cheek. This must be an unmistakable actual punch, not a preparatory stance. Bottom-left HOOK: show a compact horizontal hook aimed LEFT at chin height, upper arm lifted, elbow distinctly bent ninety degrees, forearm horizontal and coming across the body; rear glove at her cheek. Do not draw a straight jab in this cell. Use exact 3x2 equal grid with all six full figures completely contained in their cells, 5% transparent margins on all sides, feet at 92% cell height. Make the background genuinely transparent alpha PNG, remove the painted checkerboard. No opponent, floor, text, grid, extra limbs, cropping or shadows.

## Dos — prompt final

Use case: stylized-concept
Asset type: transparent sprite atlas for Nadia, the female sparring opponent in a boxing game.
Input image: exact identity, clothing, proportions and three-quarter REAR camera reference. Keep this adult athletic woman's face, muscular build, twin dark braids, burgundy padded headguard, burgundy short-sleeved training T-shirt and matching shorts, burgundy boxing gloves with black cuffs, white socks and burgundy boots with black soles. No singlet.
Create ONE square 3-column by 2-row atlas, six equal portrait cells aspect ratio 2:3. FULL BODY in every cell, each completely isolated.
All poses face screen-LEFT, three-quarter REAR view with back visible. This natural direction is essential because she is the opponent on the right, aiming left. Do not turn toward screen-right.
Exact cell order: top left balanced neutral guard; top middle clear straight lead jab toward LEFT at head height with other hand guarding; top right compact rear-hand body punch aimed LEFT and lower with other glove near face; bottom left compact bent-elbow lead hook toward LEFT; bottom middle defensive slip/duck with both gloves near face, bent knees; bottom right controlled recoil from a received blow, leaning slightly back while keeping both feet grounded.
Premium realistic painted sports game art matching reference. Consistent anatomy, outfit, body scale and foot baseline at 92% cell height. Generous clear margins in every cell. Fit the full extent of every limb INSIDE its cell; no overlap or crossing between cells, no tiny partial adjacent feet, no cropping. Head in guard around 8% cell height. Exactly two arms, two legs and two gloves per figure.
Background MUST be genuinely transparent alpha PNG, not a painted checkerboard. Remove reference background glow entirely. No floor, shadow, gradient, ring, opponent, text, grid, labels, borders, blood or injury.
The BODY pose must show an actual extended punch aimed at abdomen height to the LEFT, not two hands pulled back. The HOOK must show a visibly bent elbow at 90 degrees, curved punching path, glove near shoulder level, NOT another extended straight jab.

