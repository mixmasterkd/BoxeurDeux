# Rémy — poses de sparring

Visuels créés avec ImageGen intégré, à partir de `assets/sparring-boxer-red-front-v2.png` et `assets/sparring-boxer-red-back-v2.png`.

## Livrables

- `assets/combat-sparring-remy-front-atlas-v1.png`
- `assets/combat-sparring-remy-back-atlas-v1.png`

Deux atlas 3 × 2 : garde, jab, corps, crochet, esquive, impact. Direction naturelle à gauche. Les sorties RGB avec damier ont été détourées et recentrées avec le script existant `scripts/key-checkerboard.cjs --repack-grid=3x2`.

Rémy utilise le même système de présentation que Nadia, limité aux sparrings masculins. Seuls le sexe du profil et le type de séance sélectionnent l’atlas. Les intentions montrées et les signaux visuels déterminent les poses; aucune modification des actions, du hasard, des scores, des dégâts, des déplacements ou des effets de knockdown.

## Face — prompt final

Use case: stylized-concept
Asset type: production transparent boxing sprite atlas for Rémy, male sparring opponent.
Input image: EXACT character identity, clothing, body proportions, and three-quarter FRONT orientation reference.
Create ONE square 3-column by 2-row atlas with six equal portrait cells, each aspect ratio 2:3. Full body visible inside every cell. Same adult muscular stocky man throughout: tan skin, short dark curly hair, short dark beard, burgundy padded headguard, burgundy short-sleeved training T-shirt, burgundy shorts, burgundy gloves with black cuffs, white socks, burgundy boots with black soles. Preserve reference identity and equipment.
All six figures face screen LEFT in three-quarter FRONT view, chest visible. He is the opponent on the right aiming left. Do not face right or reverse the camera.
Exact cell order:
TOP LEFT: balanced boxing guard.
TOP CENTER: a clear straight lead jab LEFT at head height, rear glove protecting cheek.
TOP RIGHT: rear-hand straight body punch diagonally LEFT downward toward abdomen height, knees bent, opposite glove protecting face. An ACTUAL extended punch, not preparatory guard.
BOTTOM LEFT: a compact horizontal lead HOOK at head height, elbow visibly bent ninety degrees, forearm sweeping across body, other glove at cheek. Distinct from straight jab.
BOTTOM CENTER: defensive slip and duck with bent knees, both gloves at face.
BOTTOM RIGHT: restrained recoil after receiving a punch, leaning backward slightly, both feet remain grounded and gloves near face.
Premium realistic painted sports game art matching reference. Consistent body scale and anatomy across poses. Uniform foot baseline at 92% cell height, head near 8% in guard. Every glove, elbow and foot must fit within its own cell with at least 5% empty margins. Do not overlap adjacent cells or crop any body part.
TRUE transparent alpha PNG background. Remove all reference background glow. No painted checkerboard, matte, floor, shadows, ring, opponent, text, labels, borders, blood or injury. Exactly two arms, two gloves and two legs per figure.

## Dos — prompt final

Use case: stylized-concept
Asset type: production transparent boxing sprite atlas for Rémy, male sparring opponent.
Input image: EXACT character identity, clothing, body proportions, and three-quarter REAR orientation reference.
Create ONE square 3-column by 2-row atlas with six equal portrait cells, each aspect ratio 2:3. Full body visible inside every cell. Same adult muscular stocky man throughout: tan skin, short dark curly hair, short dark beard, burgundy padded headguard, burgundy short-sleeved training T-shirt, burgundy shorts, burgundy gloves with black cuffs, white socks, burgundy boots with black soles. Preserve reference identity and equipment.
All six figures face screen LEFT in three-quarter REAR view, back visible. He is the opponent on the right aiming left. Do not face right or reverse the camera.
Exact cell order:
TOP LEFT: balanced boxing guard.
TOP CENTER: a clear straight lead jab LEFT at head height, rear glove protecting cheek.
TOP RIGHT: rear-hand straight body punch diagonally LEFT downward toward abdomen height, knees bent, opposite glove protecting face. An ACTUAL extended punch, not preparatory guard.
BOTTOM LEFT: a compact horizontal lead HOOK at head height, elbow visibly bent ninety degrees, forearm sweeping across body, other glove at cheek. Distinct from straight jab.
BOTTOM CENTER: defensive slip and duck with bent knees, both gloves at face.
BOTTOM RIGHT: restrained recoil after receiving a punch, leaning backward slightly, both feet remain grounded and gloves near face.
Premium realistic painted sports game art matching reference. Consistent body scale and anatomy across poses. Uniform foot baseline at 92% cell height, head near 8% in guard. Every glove, elbow and foot must fit within its own cell with at least 5% empty margins. Do not overlap adjacent cells or crop any body part.
TRUE transparent alpha PNG background. Remove all reference background glow. No painted checkerboard, matte, floor, shadows, ring, opponent, text, labels, borders, blood or injury. Exactly two arms, two gloves and two legs per figure.

