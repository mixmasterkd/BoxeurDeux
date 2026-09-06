# Prototype visuel de combat — Ericka

Visuels produits avec l’outil imagegen intégré, à partir de `assets/sparring-player-female-1-back.png` et `assets/sparring-player-female-1-front.png`.

Livrables intégrés :

- `assets/combat-actions-ericka-atlas-v1.png` : 10 illustrations utilisées par les 20 actions existantes.
- `assets/combat-pilot-ericka-atlas-v1.png` : 6 poses de ring détourées localement après que les deux sorties de l’outil ont fourni un damier RGB sans canal alpha.
- `assets/combat-pilot-ericka-front-atlas-v1.png` : les 6 mêmes poses vues de face, détourées localement après une sortie RGB avec damier.
- `assets/combat-official-ericka-back-atlas-v1.png` : 6 poses de combat amateur officiel vues de dos, avec la tenue bleue réglementaire.
- `assets/combat-official-ericka-front-atlas-v1.png` : les 6 poses officielles vues de face.

## Combat amateur officiel — poses de dos

Use case: stylized-concept
Asset type: transparent 2D boxing game sprite atlas for official amateur bouts, REAR orientation.
Input images: Image 1 is the exact playable character identity and official amateur uniform reference from behind. Image 2 is the approved six-pose rear sparring atlas and defines pose order, body scale, rendering style, spacing, and cell geometry.
Primary request: Create ONE square sprite atlas in an exact 3-column by 2-row uniform grid. Show the exact same adult athletic tan-skinned female boxer from Image 1, consistently seen from a three-quarter REAR view. Preserve her dark braid, navy padded headguard, blue gloves with white cuffs, blue official boxing singlet with white piping, matching blue official shorts with white piping, white socks, and navy boots.
Pose order: top-left neutral boxing guard; top-center lead jab; top-right lowered rear-hand body punch; bottom-left lead hook; bottom-center slip-and-duck defensive movement; bottom-right braced recoil after receiving a punch.
Composition: every cell has aspect ratio 2:3. Full body visible in all six cells, same body size, camera height, foot baseline, and margins as Image 2. Feet around 92% cell height and head near 8%. Keep every glove, elbow, braid, and foot inside its cell with at least 4% empty space. Do not shrink individual punch poses to fit.
Style: premium realistic painted sports game art matching the references. Exact same face, body proportions, and official uniform in all six cells.
Background: genuine transparent alpha everywhere outside the silhouettes. Output RGBA PNG. Do not draw checkerboard, matte, shadow, floor, ring, haze, grid, border, text, numbers, labels, opponent, blood, or injury.
Constraints: exactly one character per cell, exactly two arms and two legs, no cropped body parts.

## Combat amateur officiel — poses de face

Use case: stylized-concept
Asset type: transparent 2D boxing game sprite atlas for official amateur bouts, FRONT orientation.
Input images: Image 1 is the exact playable character identity and official amateur uniform reference from the front. Image 2 is the approved six-pose front sparring atlas and defines pose order, body scale, rendering style, spacing, and cell geometry.
Primary request: Create ONE square sprite atlas in an exact 3-column by 2-row uniform grid. Show the exact same adult athletic tan-skinned female boxer from Image 1, consistently seen from a three-quarter FRONT view, with a natural base facing screen-right so the game can mirror her. Preserve her dark braid, navy padded headguard, blue gloves with white cuffs, blue official boxing singlet with white piping, matching blue official shorts with white piping, white socks, and navy boots.
Pose order: top-left neutral boxing guard; top-center lead jab toward screen-right; top-right lowered rear-hand body punch toward screen-right; bottom-left lead hook toward screen-right; bottom-center slip-and-duck defensive movement; bottom-right braced recoil after receiving a punch.
Composition: every cell has aspect ratio 2:3. Full body visible in all six cells, same body size, camera height, foot baseline, and margins as Image 2. Feet around 92% cell height and head near 8%. Keep every glove, elbow, braid, and foot inside its cell with at least 4% empty space. Do not shrink individual punch poses to fit.
Style: premium realistic painted sports game art matching the references. Exact same face, body proportions, and official uniform in all six cells.
Background: genuine transparent alpha everywhere outside the silhouettes. Output RGBA PNG. Do not draw checkerboard, matte, shadow, floor, ring, haze, grid, border, text, numbers, labels, opponent, blood, or injury.
Constraints: exactly one character per cell, exactly two arms and two legs, no cropped body parts.

## Poses de face (3 colonnes × 2 lignes)

Use case: stylized-concept
Asset type: transparent 2D boxing game sprite atlas for the FRONT orientation of an existing playable character.
Input images: Image 1 is the exact front identity/clothing reference. Image 2 is the approved rear-view six-pose atlas and defines pose order, body scale, rendering style, lighting, spacing, and cell geometry.
Primary request: Create ONE square sprite atlas in an exact 3-column by 2-row uniform grid. Show the same adult athletic tan-skinned female boxer from the references, now consistently seen from a three-quarter FRONT view, facing screen-left. Keep her exact dark braid, navy padded headguard, navy T-shirt, navy shorts, blue gloves with white cuffs, white socks, and navy boots.
Pose order: top-left neutral boxing guard; top-center lead jab extended toward screen-left; top-right lowered rear-hand body punch toward screen-left; bottom-left lead hook toward screen-left; bottom-center slip-and-duck defensive movement; bottom-right braced recoil after receiving a punch.
Composition: every cell has aspect ratio 2:3. Full body visible in all six cells, same body size, camera height, foot baseline, and margins as the rear atlas. Put feet at roughly 92% cell height and head near 8%. All gloves, elbows, braid, and feet must stay inside their own cells with at least 4% empty space. Do not shrink individual punch poses to fit.
Style: premium realistic painted sports game art matching both references, identical character proportions and navy equipment in every cell.
Background: genuine transparent alpha everywhere outside the six silhouettes. Output must be RGBA PNG. Do not draw a checkerboard, white field, colored matte, shadow, floor, ring, haze, grid, border, text, numbers, or labels.
Constraints: exactly one character per cell, exactly two arms and two legs, consistent face and clothing, no opponent, no injury, no blood, no cropped body parts.

## Actions (5 colonnes × 2 lignes)

Use case: stylized-concept. Asset type: ONE boxing action illustration atlas for a game interface, exactly 5 columns by 2 rows of equal SQUARE cells, ten distinct illustrations. Desired overall size 2560 x 1024, each cell 512 x 512. No outside padding, no labels, no titles, no numbers, no written text, no logos, no watermarks, no borders, no UI chrome.
Reference images show the SAME adult female player whose identity, blue gloves, navy protective headguard, navy T-shirt and shorts, tan skin, dark braid and navy boots must be consistent in every cell.
Each cell is a readable dynamic sports illustration for a small action button, waist-up or three-quarter crop as useful. Premium realistic painted game art, strong gesture silhouettes, crisp glove/arm anatomy. The player is on the LEFT facing RIGHT, shown in a side/rear three-quarter angle. Use a simplified dark charcoal opponent on the right when needed to explain the action; the opponent is secondary and partly cropped. Dark forest-charcoal background #101714 across every cell, warm soft rim light, player blue gloves remain recognizable. Clean uncluttered composition, no boxing ring ropes crossing gestures. Moderate contrast and warm pale-gold thin motion arcs when helpful, no blood or injury. No exaggerated comic explosions.
Strict cell order:
ROW 1 COLUMN 1: JAB — player extends a straight LEFT jab to opponent head-height, rear hand at chin.
ROW 1 COLUMN 2: COMBINATION — player in quick alternating straight punches, subtle two successive glove motion trails conveying a short combination, exactly two solid arms.
ROW 1 COLUMN 3: BODY ATTACK — player bends knees and delivers compact straight/right punch toward opponent abdomen, head protected.
ROW 1 COLUMN 4: HOOK — player rotates into a LEFT hook, elbow bent at ninety degrees, clear curved path toward opponent head, other glove at chin.
ROW 1 COLUMN 5: FEINT — player makes a small uncommitted glove twitch while the charcoal opponent raises guard in reaction; a short faint dashed arc makes this distinct from a committed punch.
ROW 2 COLUMN 1: PRESSURE — three-quarter full body player stepping firmly forward behind a compact guard, charcoal opponent giving ground, simple arrow across the floor pointing right.
ROW 2 COLUMN 2: COUNTER/PARRY — player deflects a charcoal opponent's extended glove with one glove and prepares a short straight reply with the other, defensive timing is readable.
ROW 2 COLUMN 3: GUARD — player crouched slightly with BOTH gloves high by temples and elbows tucked over ribs, charcoal incoming glove glancing onto forearm, protective silhouette.
ROW 2 COLUMN 4: EVASION/FOOTWORK — player slipping sideways beneath a straight punch, feet and lowered center of gravity visible, curved floor arrow shows angle change; both gloves protect face.
ROW 2 COLUMN 5: CLINCH — two adult boxers standing close chest-to-shoulder, gloves and forearms wrapped into a controlled sporting clinch that smothers a punch, no wrestling throw.
All ten gestures must remain clear at 140 pixels wide. No illustrated text. Every panel strictly inside its own equal square cell, compositions consistent but gestures visually distinct. Render one atlas image.

## Poses (3 colonnes × 2 lignes)

Use case: identity-preserve. Asset type: ONE transparent game sprite atlas for Boxeur Deux, a six-pose sheet (NOT a UI mockup).
Input image 1 is the exact character identity, clothing, camera direction and full-body composition reference. Input image 2 only supports facial identity and clothing; do NOT use its front-facing camera.
Create a clean production-ready 3-column by 2-row sprite atlas, exactly 3072 x 3072 pixels if possible. Each of the six equal cells is 1024 x 1536. Genuine transparent alpha background everywhere outside the fighter, including all gutters. No black background, no colored haze, no painted checkerboard, no ring, no environment, no floor shadows, no text, no labels, no visible grid or border.
In every cell, the SAME adult athletic woman from reference 1: tan skin, dark braided hair, navy protective amateur headguard, navy T-shirt, navy boxing shorts, blue boxing gloves with white cuffs, white socks, navy boxing boots. Realistic illustrated/rendered game art matching reference identity and material texture; nonsexual functional sportswear.
Camera invariant for ALL six cells: three-quarter REAR view, body and gaze facing screen-right and slightly away/upstage. She is the player at the lower left of a boxing ring facing an opponent at the upper right. Do not turn her toward the camera; do not mirror any cell. Same scale, overhead angle, lighting, leg proportions, head size, body center, feet baseline in every cell. Full body including both gloves and both feet must fit in each cell with comfortable transparent margins. Ground contact line around 92% cell height; head near 8%; body centered near 48% cell width. Do not scale down the whole fighter in the punch cells: extend glove inside the right margin.
Pose order by cells:
TOP LEFT (guard): balanced orthodox guard, left foot forward toward screen-right, knees soft, both gloves beside cheeks, elbows tucked.
TOP MIDDLE (jab): a clear left straight jab extended toward screen-right at opponent head height, right glove protecting jaw, rear hand remains in guard, small forward weight shift.
TOP RIGHT (body): knees lowered, compact right straight punch aimed lower at opponent abdomen height, other glove protecting jaw, recognizably different from jab.
BOTTOM LEFT (hook): compact left hook at head height, elbow bent about ninety degrees, torso rotates while keeping same rear camera, right glove at cheek; do not face camera.
BOTTOM MIDDLE (evade): clear lateral slip/duck, knees bent and torso inclined off the punch line, BOTH gloves near face, grounded feet, not falling.
BOTTOM RIGHT (impact): brief restrained recoil from a received blow, upper torso tilts backward, gloves near temples, bent knees, both feet grounded; no injury, blood, spark, opponent or extra body part.
Anatomical accuracy: exactly two arms, two gloves, two legs per fighter. All figures completely separated by transparency and contained within their equal grid cell. Each pose must be distinct and instantly readable at small on-screen size. Preserve the same woman and navy outfit throughout.

## Correction du détourage

Edit this exact six-pose boxing sprite atlas. Remove the visible white and grey checkerboard completely and make the entire background truly TRANSPARENT using an alpha channel. This must be an RGBA transparent PNG cutout, NOT an RGB image with a drawn checkerboard. Keep all six female boxer poses, navy clothing, lighting and identity. Organize poses in an exact 3-column 2-row uniform grid, square overall sheet with each cell aspect ratio 2:3. Row1 guard, jab, body punch; row2 hook, duck, impact recoil. Every figure including outstretched gloves must fit entirely inside its own cell with 5% empty transparent space at all edges; no pixels may cross into neighboring cells. Keep consistent head/body/leg size across poses and feet at 92% of each cell's height. No grid, no floor, no shadow, no checkerboard, no background color. Genuine transparent alpha everywhere outside the six boxer silhouettes. Retain full body in all six poses, no cropped gloves/feet, no duplicated limbs.
