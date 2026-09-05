# Fédération amateur — préparation des visuels maîtres

## État de l'étape

Prompts préparés seulement. Aucune image n'est générée à cette étape.

## Direction visuelle

La Fédération doit ressembler à un vrai service sportif provincial : plus institutionnel que le Studio média, mais toujours chaleureux et crédible dans le Centre-ville du jeu.

L'intérieur réunit trois zones visuelles destinées aux commandes HTML :

1. **Dossier amateur** : comptoir d'accueil et dossiers d'inscription;
2. **Parcours des tournois** : vitrine de médailles et mur de compétitions;
3. **Site de la Fédération** : borne publique ou poste de consultation.

Le bouton **Ouvrir le calendrier** reste dans l'interface HTML. Il ne nécessite pas une quatrième zone dans l'image.

Les titres, catégories, fiches de boxeurs et conditions d'admissibilité seront entièrement produits en HTML. Aucun texte généré dans l'image ne doit porter une information nécessaire au jeu.

## Références prévues pour la génération

- Ordinateur : `assets/carte-centre-ville-desktop.jpg` pour l'identité du bâtiment et `assets/studio-media-desktop.jpg` pour le niveau de réalisme, la chaleur et la finition.
- Mobile : `assets/carte-centre-ville-mobile.jpg` pour l'identité du bâtiment et `assets/studio-media-mobile.jpg` pour le niveau de réalisme, la chaleur et la finition.

Ces images serviront uniquement de références de lieu, d'éclairage et de style. Le nouvel intérieur ne doit pas copier l'aménagement du Studio média.

## Sorties prévues

- `assets/federation-amateur-desktop.jpg` — cible 1440 × 810;
- `assets/federation-amateur-mobile.jpg` — cible 1000 × 1000.

## Prompt ordinateur

```text
Use case: stylized-concept
Asset type: wide desktop game environment for the amateur boxing federation location in a French-language boxing career game
Primary request: create the interior of a credible provincial amateur boxing federation office located inside the dignified stone-and-glass civic building shown in reference image 1; match the grounded cinematic photorealism, warm evening finish, realistic materials and polished game-environment quality of reference image 2 without copying its media-studio layout
Input images: Image 1 is a location and architectural identity reference for the federation building; Image 2 is a visual-quality, lighting and realism reference only
Scene/backdrop: contemporary civic sports-administration lobby with pale stone, warm walnut, dark metal, large glass panels, discreet boxing heritage and a corridor toward administrative offices
Subject: an empty but operational federation reception organized into three immediately readable consultation zones — a staffed-style registration counter without a visible person on the left with folders and document trays for the boxer dossier; a central backlit glass display of generic boxing medals, trophies and framed competition imagery for the tournament pathway; a public computer kiosk and clean digital information screen on the right for the federation website and affiliated boxer directory
Style/medium: cinematic photorealistic game environment, grounded contemporary realism, premium but not luxurious, consistent with a warm boxing career simulation
Composition/framing: wide 16:9 elevated eye-level establishing view; the three zones separated clearly across the scene at approximately left, center and right; open central circulation; readable silhouettes and uncluttered areas suitable for HTML hotspot overlays; keep the principal zones away from the extreme top and bottom edges
Lighting/mood: warm late-afternoon interior light mixed with soft institutional ceiling lights and restrained cool light from the public kiosk; calm, official, welcoming and aspirational
Color palette: limestone beige, warm walnut brown, charcoal metal, muted navy and subtle brass medal accents
Materials/textures: realistic veined stone, wood grain, brushed metal, glass reflections, paper folders and fabric seating with natural wear
Constraints: no people in the foreground, no readable text, no letters, no numbers, no logos, no real federation branding, no flags, no trademarks, no boxing ring, no interface elements, no labels, no buttons, no borders, no watermark; medals and framed imagery must be generic; leave clean visual space over each of the three consultation zones
Avoid: media production equipment, microphones, cameras, photo backdrops, nightclub lighting, exaggerated luxury, cavernous empty scale, clutter, illegible pseudo-writing
```

## Prompt mobile

```text
Use case: stylized-concept
Asset type: square mobile game environment for the amateur boxing federation location in a French-language boxing career game
Primary request: create a phone-optimized interior of a credible provincial amateur boxing federation office located inside the dignified stone-and-glass civic building shown in reference image 1; match the grounded cinematic photorealism, warm finish, realistic materials and polished game-environment quality of reference image 2 without cropping or copying its media-studio layout
Input images: Image 1 is a location and architectural identity reference for the federation building; Image 2 is a visual-quality, lighting and realism reference only
Scene/backdrop: contemporary civic sports-administration lobby with pale stone, warm walnut, dark metal, tall glass panels, discreet boxing heritage and compact administrative offices
Subject: an empty but operational federation reception with three large and immediately recognizable consultation zones — upper-left registration counter with folders and document trays for the boxer dossier; upper-right backlit glass display of generic boxing medals, trophies and framed competition imagery for the tournament pathway; lower-center public computer kiosk and clean digital information screen for the federation website and affiliated boxer directory
Style/medium: cinematic photorealistic game environment, grounded contemporary realism, premium but not luxurious, consistent with a warm boxing career simulation
Composition/framing: purpose-built square 1:1 elevated establishing view, not a crop of the desktop composition; arrange the three zones as a clear triangle with an open central aisle; each zone must remain large enough for a 44-pixel HTML hotspot; keep all important objects away from the extreme edges and preserve a calm lower margin for the location interface
Lighting/mood: warm late-afternoon interior light mixed with soft institutional ceiling lights and restrained cool light from the public kiosk; calm, official, welcoming and aspirational
Color palette: limestone beige, warm walnut brown, charcoal metal, muted navy and subtle brass medal accents
Materials/textures: realistic veined stone, wood grain, brushed metal, glass reflections, paper folders and fabric seating with natural wear
Constraints: no people in the foreground, no readable text, no letters, no numbers, no logos, no real federation branding, no flags, no trademarks, no boxing ring, no interface elements, no labels, no buttons, no borders, no watermark; medals and framed imagery must be generic; leave clean visual space over each of the three consultation zones
Avoid: media production equipment, microphones, cameras, photo backdrops, nightclub lighting, exaggerated luxury, cavernous empty scale, clutter, illegible pseudo-writing
```

## Contrôles après génération

- Les compositions ordinateur et mobile montrent les mêmes trois zones.
- La version mobile est réellement recomposée et non simplement recadrée.
- Les zones restent compréhensibles une fois les commandes HTML ajoutées.
- Aucun faux texte ou logo important n'attire l'attention.
- Le bâtiment paraît institutionnel sans devenir froid ou intimidant.
- Le visuel ne promet ni classement ni service professionnel absent du jeu.
- Les images finales sont inspectées avant compression et intégration.
