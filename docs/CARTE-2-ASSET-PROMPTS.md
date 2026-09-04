# Carte 2 — Direction visuelle et prompts

Statut : **deux images maîtresses générées, à valider avant intégration**

Cette étape définit les deux images maîtresses du **Centre-ville**. Elle ne génère aucun fichier et ne modifie ni la navigation, ni les lieux, ni les mécaniques de jeu.

## Direction artistique commune

Le Centre-ville doit appartenir au même univers que la carte actuelle du quartier : vue aérienne légèrement oblique, réalisme cinématographique chaleureux, automne québécois, rues crédibles, bâtiments lisibles et lumière de fin d'après-midi. Il doit toutefois paraître plus dense, plus vertical et plus animé que le quartier résidentiel.

Éléments de continuité :

- mêmes tons de brique, béton gris, acier sombre, arbres orange et rouge et fenêtres ambrées;
- même niveau de détail et même caméra en trois quarts légèrement surélevée;
- fleuve, pont métallique et silhouette urbaine en arrière-plan pour suggérer la même ville;
- rues et trottoirs qui relient clairement les quatre repères;
- aucun texte intégré à l'image : tous les noms demeurent des boutons HTML;
- aucun personnage important, logo, marque, interface ou filigrane.

Différences recherchées :

- davantage d'immeubles à étages et de circulation visuelle;
- architecture civique et culturelle plutôt que résidentielle ou sportive;
- éclairage urbain légèrement plus lumineux, sans ambiance de nuit ni néons excessifs;
- Centre de loisirs dominant, les autres bâtiments restant faciles à reconnaître;
- aucune maison, aucun gym, aucun lieu de travail générique et aucune aréna copiés de la première carte.

## Hiérarchie des lieux

### Centre de loisirs — point focal

Complexe public contemporain en brique et verre, accueillant et plus volumineux que les autres bâtiments. Une grande entrée vitrée, un auvent coloré discret et quelques indices extérieurs de divertissement lui donnent une identité familiale. Il ne faut pas tenter de montrer précisément les quatre activités depuis l'extérieur; leur identité sera développée dans l'intérieur à l'étape 2-F.

### Studio média

Immeuble créatif réhabilité, en brique et métal, reconnaissable grâce à une grande baie vitrée, une petite antenne et deux paraboles sur le toit. L'ensemble doit évoquer la production locale, pas une chaîne de télévision nationale.

### Fédération

Bâtiment civique sobre en pierre claire et verre, avec une entrée formelle, de larges marches et deux bannières abstraites sans texte. Son apparence doit suggérer une administration sportive sans ressembler à un palais ni à une aréna.

### Aéroport

Petit terminal régional placé dans le lointain, mais encore identifiable par sa tour de contrôle, une piste et un seul avion sans marque. Sa position secondaire traduit son verrou professionnel et évite qu'il domine la carte.

## Composition ordinateur

Format cible : **1440 × 810, paysage 16:9**.

La caméra regarde le Centre-ville depuis une hauteur comparable à la carte du quartier. Le Centre de loisirs occupe le bas gauche et agit comme point focal. Le studio média se trouve dans le tiers supérieur gauche. La Fédération occupe le centre droit. L'aéroport reste au loin dans le coin supérieur droit, au-delà d'une voie rapide ou près du fleuve. Le bas droit conserve une rue et un parvis lisibles afin d'aérer la composition.

Zones à garder libres pour les boutons HTML :

| Repère | Centre suggéré | Zone libre souhaitée |
| --- | ---: | --- |
| Studio média | 21 % × 29 % | façade ou parvis dégagé |
| Centre de loisirs | 28 % × 68 % | entrée et place publique |
| Fédération | 68 % × 58 % | marches et parvis |
| Aéroport | 82 % × 22 % | ciel ou piste adjacente |

Les zones indiquent les futurs centres des bulles, pas l'emplacement obligatoire du bâtiment au pixel près. Aucun élément essentiel ne doit être placé sous une autre zone de bouton.

### Prompt maître — ordinateur

```text
Use case: stylized-concept
Asset type: wide desktop environment map background for a career-management boxing game
Primary request: create a polished downtown district map that clearly belongs to the same city and visual world as the supplied autumn neighborhood map, while using a completely new denser urban layout
Scene/backdrop: believable French-Canadian riverside city in autumn, seen from a slightly elevated three-quarter aerial viewpoint; connected streets, sidewalks, mature orange and red trees, a distant river, steel bridge and restrained skyline
Main landmark: a welcoming contemporary public leisure center in brick and glass at the lower left, the largest and most visually important building, with a broad glazed entrance, public plaza and subtle colorful architectural accents
Supporting landmarks: a small converted-brick local media studio with rooftop antenna and two satellite dishes in the upper left; a dignified sports federation office in pale stone and glass with broad steps and abstract blank banners at center right; a compact regional airport in the far upper right with a recognizable control tower, short runway and one unbranded airplane
Style/medium: highly detailed semi-realistic cinematic game environment, painterly photorealism, grounded architecture, consistent with the supplied neighborhood map, not cartoonish
Composition/framing: wide 16:9 at 1440 by 810, slightly elevated three-quarter aerial view, strong readable separation between all four landmarks, streets create a natural visual loop, reserve clean facade or pavement space for large HTML hotspot bubbles near these normalized centers: media studio 21% x 29%, leisure center 28% x 68%, federation 68% x 58%, airport 82% x 22%; keep a readable street and public space in the lower right and do not hide any important facade or entrance behind another building
Lighting/mood: dry late-autumn golden hour approaching dusk, warm windows and streetlights beginning to glow, lively and aspirational but still grounded
Color palette: aged red brick, charcoal steel, pale civic stone, muted concrete, amber windows, restrained red and blue accents, orange and crimson foliage
Continuity: preserve the supplied map's camera height, atmospheric depth, warm cinematic realism and Montreal-inspired geography, but do not copy its building arrangement
Constraints: exterior environment only, no prominent people, no readable signs, no letters, no logos, no trademarks, no UI, no labels, no boxing ring, no watermark
Avoid: duplicated house, boxing gym, strength gym, workplace or arena from the neighborhood map; theme-park architecture; giant airport; futuristic skyscrapers; cyberpunk neon; nighttime darkness; snow; excessive traffic; fisheye distortion; collage; isometric board-game tiles
```

## Composition mobile

Format cible : **1000 × 1000, carré**, comme la carte mobile actuelle. Il s'agit d'une recomposition autonome, jamais d'un recadrage de l'image ordinateur.

La caméra reste aérienne et légèrement oblique, mais les rues forment une boucle plus compacte. L'aéroport et le fleuve occupent la partie haute. Le studio média se situe dans le haut gauche, la Fédération dans la moitié droite et le Centre de loisirs dans le bas gauche. Chaque bâtiment doit conserver sa façade principale et son entrée dans le cadre; le bas droit reste plus calme pour préserver la lisibilité.

Zones à garder libres pour les boutons HTML :

| Repère | Centre suggéré | Zone libre souhaitée |
| --- | ---: | --- |
| Aéroport | 68 % × 14 % | ciel ou piste adjacente |
| Studio média | 27 % × 31 % | façade et trottoir |
| Fédération | 72 % × 50 % | marches et parvis |
| Centre de loisirs | 30 % × 72 % | entrée et place publique |

### Prompt maître — mobile

```text
Use case: stylized-concept
Asset type: square mobile environment map background for a career-management boxing game
Primary request: create a purpose-built square mobile composition of the same downtown district as the desktop scene, visually continuous with the supplied square autumn neighborhood map, never a crop of the desktop image
Scene/backdrop: compact believable French-Canadian riverside downtown in autumn, seen from a slightly elevated three-quarter aerial viewpoint; a clear looping street layout, sidewalks, orange and red trees, river and steel bridge near the top edge
Main landmark: a welcoming contemporary public leisure center in brick and glass in the lower-left area, the largest building, with a broad glazed entrance, public plaza and restrained colorful architectural accents
Supporting landmarks: a converted-brick local media studio with rooftop antenna and two satellite dishes in the upper left; a pale-stone and glass sports federation office with broad steps and blank abstract banners in the right half; a small regional airport across the upper background with control tower, short runway and one unbranded airplane
Style/medium: highly detailed semi-realistic cinematic game environment, painterly photorealism, grounded architecture, consistent with the supplied neighborhood map, not cartoonish
Composition/framing: square 1:1 at 1000 by 1000, independently recomposed for a phone screen, all four landmarks fully readable with generous separation and uninterrupted entrances, reserve clean space for large HTML hotspot bubbles near these normalized centers: airport 68% x 14%, media studio 27% x 31%, federation 72% x 50%, leisure center 30% x 72%; keep the lower-right street area visually calm and keep important objects away from the extreme edges
Lighting/mood: dry late-autumn golden hour approaching dusk, warm windows and streetlights beginning to glow, lively and aspirational but grounded
Color palette: aged red brick, charcoal steel, pale civic stone, muted concrete, amber windows, restrained red and blue accents, orange and crimson foliage
Continuity: preserve the supplied square map's camera angle, density of detail, atmospheric depth and Montreal-inspired setting, but use a new downtown street plan and new buildings
Constraints: exterior environment only, no prominent people, no readable signs, no letters, no logos, no trademarks, no UI, no labels, no boxing ring, no watermark
Avoid: a crop or vertical extension of the desktop image; duplicated house, boxing gym, strength gym, workplace or arena; theme-park architecture; giant airport; futuristic skyscrapers; cyberpunk neon; nighttime darkness; snow; excessive traffic; fisheye distortion; collage; isometric board-game tiles
```

## Fichiers prévus

- `assets/carte-centre-ville-desktop.jpg`
- `assets/carte-centre-ville-mobile.jpg`

À l'étape 2-D, chaque image a été générée séparément avec la carte actuelle du même format utilisée uniquement comme référence de style. Les fichiers ne remplacent pas `carte-quartier-v2-desktop.jpg` ou `carte-quartier-v2-mobile.jpg`.

Génération réalisée avec **Built-in ImageGen** :

- ordinateur : 1440 × 810, JPEG optimisé, environ 328 Ko;
- mobile : 1000 × 1000, JPEG optimisé, environ 296 Ko;
- les originaux PNG générés sont conservés séparément par ImageGen;
- les deux images sont référencées par la carte du Centre-ville depuis l'étape 2-E.

## Contrôle qualité avant intégration

- les quatre repères sont identifiables sans étiquette intégrée à l'image;
- le Centre de loisirs domine visuellement sans masquer les autres lieux;
- ordinateur et mobile racontent le même secteur avec une composition adaptée à chacun;
- les zones réservées peuvent accueillir des boutons de 124 à 176 px sur ordinateur et de 112 à 130 px sur mobile;
- les façades, entrées, pistes et escaliers ne sont pas coupés;
- l'aéroport paraît secondaire et plus lointain;
- aucune destination de la carte du quartier n'est reproduite;
- aucune interface, marque, écriture déformée ou filigrane n'apparaît;
- le contraste demeure suffisant derrière les bulles semi-transparentes existantes.
