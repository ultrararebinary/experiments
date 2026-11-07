# Experiments — décisions de départ

Décidé avec Yann le 29 octobre 2026, pendant une session `/grill-me` dans Claude Code. Ces choix servent de cadre à toutes les expériences. Une décision change seulement sur demande de Yann, avec la date et la raison ajoutées ici.

## Nature du dépôt

- Labo à copier-coller, dans l'esprit de shadcn/ui : chaque expérience est un dossier lisible qu'on copie dans son projet. Pas de paquet npm.
- Uniquement des composants d'interface web pour l'instant.
- Dépôt GitHub public `ultrararebinary/experiments`, licence MIT.
- Code local : `/Users/yann/AIOS/projects/experiments`, avec son propre git.
- But secondaire : réutiliser ces composants dans le futur portfolio de Yann (Next.js), qui n'est pas encore lancé.

## Stack

- React + TypeScript, CSS simple par composant (pas de Tailwind), pour qu'un composant marche partout sans configuration imposée.
- Motion ou GSAP seulement si une expérience en a vraiment besoin.
- Une seule app galerie construite avec Vite : un `npm install`, une commande pour tout lancer.

## Galerie

- Maintenant : page d'accueil sobre (nom, une phrase) et grille de cartes. Chaque carte affiche le composant en direct, qu'on peut survoler et cliquer. Un clic ouvre la page de l'expérience : démo de toutes les variantes, code à copier, notes.
- Plus tard, vers 8 à 10 expériences : la grille infinie qu'on parcourt librement devient d'abord une expérience du labo, puis éventuellement la page d'accueil. Une grille infinie presque vide paraîtrait abandonnée, d'où ce report.

## Mise en ligne

- GitHub Pages, déployé par une GitHub Action à chaque push sur `main`.
- Adresse : `https://ultrararebinary.github.io/experiments/`.
- Rien ne part en ligne sans un push.

## Contenu d'une expérience

Chaque dossier `experiments/<nom>/` contient quatre fichiers, pas plus :

1. le composant (`.tsx`) ;
2. son CSS ;
3. la démo affichée dans la galerie ;
4. un `README.md` court : utilisation, choix faits, inspiration.

## Références extérieures

On reconstruit l'effet nous-mêmes à partir d'une image ou d'une observation, sans reprendre le code de la source. Le README de l'expérience cite l'inspiration.

## Démarrer une expérience

Le premier chat crée le dépôt et construit la première expérience en même temps, pour ne jamais publier un site vide. Il écrit aussi `CLAUDE.md` et `NEW-EXPERIMENT.md` (modèle de prompt). Pour les suivantes : ouvrir un nouveau chat dans ce dossier, coller la capture ou le lien, remplir le modèle.

## Première expérience : bouton en relief

Référence : `references/glossy-button.png`, design vu sur le site d'Emil Kowalski.

- Tailles : `sm`, `md`, `lg`.
- Couleurs : quatre teintes prêtes (bleu comme la référence, violet, vert, neutre/noir), plus une variable CSS `--accent`. Le relief (dégradé, reflet, ombres) se calcule à partir de cette seule couleur.
- Contenu : texte libre, plus un emplacement optionnel à droite pour un détail secondaire. L'exemple du prix barré est une démo, sans prop « prix » codée en dur.
- Survol : le bouton monte de 1 à 2 px, le reflet du haut s'éclaircit, l'ombre s'allonge.
- Clic : il s'enfonce, l'ombre se resserre, retour avec un léger ressort.
- Clavier : anneau de focus visible.
- Désactivé : état propre.
- Mouvement réduit : plus de déplacement, seulement les changements de couleur.
- Option `shine` : reflet qui balaie le bouton au survol, désactivé par défaut.

## Changement du 29 octobre 2026 : survol et relief du bouton

Demandé par Yann après la première mise en ligne. Raison : le survol d'origine (léger soulèvement et reflet plus clair) se remarquait trop peu, et le relief manquait de présence. Trois directions ont été prototypées (Lumière, Touche, Élan) ; Yann a gardé Touche et Lumière, et voulait les deux dans le même composant.

- Le composant a une prop `variant` avec trois valeurs : `key` (Touche, par défaut), `light` (Lumière) et `key-light` (les deux).
- `key` : le bouton a une épaisseur visible, comme une touche de clavier. Au survol, la face monte de 1,5 à 2,5 px au-dessus de son socle ; au clic, elle s'enfonce à fleur du socle et revient avec le même ressort.
- `light` : face plate et brillante comme la référence. Au survol, une lumière douce suit le curseur et le bord s'éclaire de son côté. Le bouton ne bouge pas au survol ; le clic reste celui d'origine.
- `key-light` : la touche avec une lumière plus discrète (45 % de l'intensité de `light`), parce que les deux effets à pleine force chargeaient trop le bouton.
- Ces trois variantes remplacent la ligne « Survol » de la première expérience. Le reste (tailles, teintes, clic, focus, désactivé, mouvement réduit, option `shine`) ne change pas.

## Changement du 30 octobre 2026 : ombres neutres

Demandé par Yann. Raison : les ombres extérieures reprenaient la couleur du bouton et créaient un petit glow qui changeait selon la teinte, ce qui donnait un effet un peu cheap. Trois modes ont été comparés sur fonds sombre et clair : avec glow, sans glow, ombre neutre. Yann a choisi l'ombre neutre.

- Les ombres extérieures des trois variantes sont noires, avec les mêmes formes qu'avant.
- `--accent` règle toujours le dégradé, le bord et le socle, mais plus les ombres extérieures. Cela remplace « Le relief (dégradé, reflet, ombres) se calcule à partir de cette seule couleur » dans la section de la première expérience.

## Changement du 30 octobre 2026 : socle neutre et mode clair

Demandé par Yann. Raison : après le passage aux ombres noires, il voyait encore une bande de la couleur du bouton dessous, surtout au survol, et le bouton semblait flotter au lieu de paraître collé à la page. Cette bande était le socle, qui prenait encore la couleur de `--accent`. Quatre états ont été comparés sur fonds sombre et clair : actuel, socle neutre, socle fin, sans socle. Yann a choisi le socle neutre.

- Le socle de `key` et `key-light` est gris neutre pour toutes les couleurs. L'épaisseur, la montée au survol et le clic ne changent pas.
- Les ombres floues et la grande ombre du survol sont retirées sur les trois variantes. Il reste une arête nette de 1 px sous le bouton.
- `--accent` règle le dégradé et le bord de la face. Cela remplace la mention du socle dans la décision « ombres neutres » du même jour.
- Le site a un mode sombre et un mode clair, avec un bouton qui retient le choix. Sans choix enregistré, il suit le réglage de l'appareil.

## Deuxième et troisième expériences : Color Drift et Color Bloom (30 octobre 2026)

Demandé par Yann : un color picker original et minimaliste, sans référence, avec des animations fluides et trois tailles, rien de générique. Il a demandé `/prototype` pour concevoir trois directions, alors que `CLAUDE.md` limite les skills de design : sa demande explicite prime pour cette expérience. Sur les trois directions (Drift, Tuner, Bloom), il a gardé Drift et Bloom, chacune dans sa propre expérience, et a demandé de pousser leurs animations avec `emil-design-eng`. Il aimait déjà le mouvement de Drift et l'apparition des cercles de Bloom. Tuner et le sélecteur de prototypage sont retirés.

- Dossiers `experiments/color-drift` (`ColorDrift`) et `experiments/color-bloom` (`ColorBloom`), chacun en `sm`, `md`, `lg`. Les couleurs sont choisies en OKLCH et le composant renvoie un hex.
- `color-drift` : une surface qu'on fait glisser, horizontal pour la teinte, vertical pour le ton, avec de l'élan quand on la lance. La nouvelle couleur part du doigt et se diffuse vers les bords. La surface se déforme autour du point saisi et rebondit un peu seulement après un lancer.
- `color-bloom` : un point qui s'ouvre sur 12 pétales. Ils sortent en spirale avec la couleur du point, puis prennent la leur. On glisse vers un pétale, tirer vers l'intérieur éclaircit, vers l'extérieur assombrit. Une tige relie le point au pétale. Au relâchement la couleur descend par la tige et remplit le point depuis ce côté. Le point garde son ancienne couleur tant qu'on n'a pas relâché, mais la valeur change dès le relâchement.
- Exception assumée à la règle des 300 ms et à « transform et opacity seulement » : un color picker sert rarement et ces animations expliquent ce qui se passe. Le clavier reste sans animation et le mouvement réduit les retire.

## Changement du 30 octobre 2026 : refonte de l'accueil et du site

Demandé par Yann. Raison : l'accueil ne disait ni qui fait ce labo ni pourquoi, et le site ne bougeait pas alors que ses composants sont très travaillés. Il a demandé `emil-craft` et `grilling` en plus d'`emil-design-eng` et `apple-design` : sa demande explicite prime sur la liste de skills de `CLAUDE.md` pour ce chantier. Le wiki n'a pas de règle d'Emil sur la mise en page ou la couleur : ces choix suivent ce qui a été mesuré sur son portfolio, présenté comme une observation.

- L'accueil est une note personnelle suivie des composants vivants. Cela remplace « page d'accueil sobre (nom, une phrase) » de la section Galerie. Yann signe « a student », avec X et GitHub : ni âge, ni pays, ni titre.
- Une colonne d'environ 640 px sur toutes les pages, la plus récente en haut, date visible. Une seule taille de texte, hiérarchie à la graisse, neutres chauds, aucun accent, anneaux de 1 px au lieu de bordures.
- Inter Variable hébergée avec la galerie seulement, avec une police de secours aux mêmes mesures. Les composants à copier n'en dépendent pas.
- Sur l'accueil, la zone vivante sert à jouer et un clic à côté du composant ne fait rien. Seule la ligne en dessous ouvre la page. Cela remplace « un clic ouvre la page » de la section Galerie.
- Une seule transition signature, par l'API View Transitions et sans dépendance : la zone vivante devient la zone de démo, 300 ms en `--ease-in-out`. Le clavier ne l'anime pas, le mouvement réduit garde un fondu, un navigateur sans l'API change de page directement.
- Rejetés : entrée rejouée au retour sur l'accueil, révélation au défilement, effets au curseur sur le site, ressort sur le site.
- Le thème est un mot dans la ligne de liens. Pas de pied de page.
- README du dépôt : une image d'accueil et une liste d'expériences avec un aperçu chacune, en clair et en sombre, sans GIF. Les images sont de vraies captures du site, jamais des images générées. `npm run readme` (script `scripts/readme.mjs`, sans dépendance, Chrome requis) les refait et réécrit la liste entre `<!-- experiments:start -->` et `<!-- experiments:end -->` à partir du `meta` de chaque `demo.tsx`. Color Bloom est capturé pendant un appui, sinon on ne verrait qu'un point. Rejetés : un mur de badges, et les GIF pour l'instant (lourds, et faux dès qu'une animation change).
- L'écart du `demo.tsx` de Color Bloom passe de 180 à 140 px, pour que l'anneau de la grande taille reste dans la colonne.

## Quatrième expérience : Bento Grid (30 octobre 2026)

Demandé par Yann : une bento grid originale et minimaliste, sans référence, avec des animations fluides, rien de générique, conçue en trois versions avec `/prototype`. Sa demande explicite prime sur la liste de skills de `CLAUDE.md` pour cette expérience, comme pour les color pickers. « Variants I want: For each three versions » a été lu ainsi : trois versions, chacune en trois tailles qui sont aussi 3, 5 et 7 compartiments. Yann n'a pas encore choisi.

- Dossier `experiments/bento-grid` (`BentoGrid`), prop `variant` à trois valeurs. Le sélecteur de prototypage reste dans `demo.tsx` jusqu'au choix.
- `seam` : un seul rectangle et des lignes. On tire une ligne, les compartiments des deux côtés font de la place. La taille du chiffre suit celle du compartiment. Une pression donne la place à un compartiment.
- `tray` : des pièces dans une boîte avec des emplacements vides, comme un jeu de taquin. Les pièces butent sur leurs voisines et peuvent tourner à un emplacement pendant le même geste. Un point marque chaque emplacement vide.
- `dive` : la disposition ne change jamais, seule une caméra bouge. Une pression entre dans un compartiment, un glissé passe au voisin, un lancer sans voisin ressort.
- Le contenu de la démo décrit le labo lui-même, avec de vrais chiffres, pour ne rien inventer.
- Exception assumée à la règle des 300 ms : ces ressorts durent plus longtemps, parce qu'on peut toujours les rattraper et qu'ils ne bloquent rien. `seam` modifie aussi la largeur et la hauteur à chaque image, ce qui reste acceptable pour sept compartiments. Le clavier n'anime rien et le mouvement réduit retire tous les déplacements.
- Rejetés : animation d'entrée (l'accueil la rejouerait à chaque retour) et lumière qui suit le curseur (déjà vue sur trop de bento grids).

## Changement du 30 octobre 2026 : Shoji Bento, et règle pour `/prototype`

Demandé par Yann après avoir essayé les trois versions sur le serveur de développement. Il garde `seam` et supprime `tray` et `dive`. Raison du nom : il voulait un nom propre qui mette l'expérience en valeur, comme Glossy Button. Un shoji est un écran coulissant japonais fait de fines lignes et de panneaux qui glissent, ce qui décrit le composant et va bien avec « bento ».

- Le dossier devient `experiments/shoji-bento` (`ShojiBento`), sans prop `variant` ni sélecteur de prototypage. Cela remplace le dossier `bento-grid`, les trois valeurs de `variant` et le sélecteur de la section précédente. Le reste de `seam` ne change pas.
- `meta` accepte un `order` optionnel : à date égale, le plus grand passe devant. Raison : l'accueil montre la plus récente en haut, et le tri alphabétique plaçait Shoji Bento en troisième position parmi les trois expériences du jour.
- Règle de méthode, qui vaut pour la suite : avec `/prototype`, trois versions sont conçues et laissées sur le serveur de développement, sans préparer de commit. Yann choisit directement là. Le commit vient après son choix. Raison : le premier commit contenait les trois versions avant qu'il ait choisi, et il a fallu le refaire. Détail dans `CLAUDE.md`, section Prototypes.

## Cinquième expérience : Gem Clip (7 novembre 2026)

Demandé par Yann : un composant de copie original et minimaliste, sans référence, sans les boutons « copier / copié » habituels, conçu en trois versions avec `/prototype`, chacune en trois tailles, et en se servant de `codex-image`. Il a demandé `emil-craft` en plus d'`emil-design-eng` et `apple-design` : sa demande explicite prime sur la liste de skills de `CLAUDE.md` pour cette expérience.

- Premier tour : trois façons de copier, chacune pour un usage. `lift` (la valeur dans une phrase est le bouton), `clip` (un trombone pince un bloc), `tear` (on arrache le talon d'un ticket). Yann a gardé `clip`, qu'il trouve le plus beau.
- Deuxième tour, demandé par Yann après des captures de l'animation : trois façons pour le trombone de se poser. Pince (il s'ouvre en glissant et se referme sur le bloc), Glisse (il arrive penché et se redresse), Clac (il se lève, tombe et s'écrase un instant). Yann a gardé Pince.
- Raison du deuxième tour, d'après la revue des captures : le trombone descendait comme un ascenseur, le bloc ne réagissait pas, « Copied » apparaissait avant le trombone et trop loin de lui, et le relâchement était aussi lent que la prise.
- Dossier `experiments/gem-clip` (`GemClip`), en `sm`, `md`, `lg`, sans prop de variante. Raison du nom : « Gem » est le nom du modèle classique de trombone à deux boucles, celui du dessin.
- Le trombone vient d'une image générée par Codex (`docs/references/gem-clip-paperclip.png`), redessinée en deux tracés SVG. Le tracé complet passe derrière le bloc et la boucle extérieure devant, pour que le bloc paraisse pincé.
- Curseur : la main (`pointer`), comme les autres boutons du labo. Yann n'aimait pas le curseur `copy` (flèche avec un « + » vert) de la première version.
- « Copied » s'affiche dès le clic, petit et collé au trombone, une fois le trombone posé. Il passe à « Couldn't copy » si l'écriture échoue.
- Le relâchement prend environ 200 ms sans rebond, plus vite que la prise. Le clavier pose le trombone sans animation et le mouvement réduit ne garde qu'un fondu.
- Shoji Bento affiche maintenant 5 expériences au lieu de 4.
- Rejetés avec `lift` et `tear` : le curseur `copy`, et un rebond de position à l'arrivée, remplacé par l'ouverture puis la fermeture du trombone.

## Sixième expérience : Die Cut (7 novembre 2026)

Demandé par Yann : une petite collection de stickers SVG avec le contour blanc découpé d'un vrai sticker, et le composant React qui les affiche, à mettre dans une interface à la place d'icônes plates, avec une vibe tech et étudiante. Il a demandé `grilling`, `codex-image`, `emil-craft`, `/prototype` et `humanizer` en plus d'`emil-design-eng` et `apple-design` : sa demande explicite prime sur la liste de skills de `CLAUDE.md` pour cette expérience, comme pour Gem Clip.

- Huit stickers : portable, casque, carnet, ampoule, trombone, disquette, bulle d'assistant, tasse de café. La disquette remplace le ressort prévu au départ, dont le sens restait flou hors d'un labo d'animation. Le trombone est gardé : en sticker, il se lit comme « pièce jointe », pas comme Gem Clip.
- Aucun logo réel, parce que le dépôt est public sous licence MIT. Le portable n'a qu'un badge éclair générique ; l'assistant est une bulle bleue avec une étincelle blanche à quatre branches et une petite jaune, sans reprendre le logo de Claude ni son étoile orange.
- Style : gonflé et brillant, choisi parmi trois casques générés par Codex (aplats, gonflé, risographie). Palette partagée : bleu, corail, jaune et encre bleu nuit. Les couleurs sont fixes, sans `--accent`. Contour blanc de 2,5 unités sur 128, avec une arête neutre de 1 px qui le garde lisible sur fond clair.
- Méthode : chaque sticker part d'une image Codex (`docs/references/sticker-*.png`, le casque servant de `--ref` aux sept autres), puis il est redessiné à la main en SVG. vtracer a été comparé sur le casque : 12 à 23 Ko, volumes aplatis et liseré rosé autour du blanc, contre 2,9 Ko à la main. Le redessin à la main est gardé, entre 1,5 et 3 Ko par sticker.
- Composant `DieCut` en `sm` (48 px), `md` (80 px), `lg` (128 px) ou un nombre. Décoratif par défaut (`aria-hidden`) ; avec `label`, c'est une image nommée. Les identifiants de dégradés sont rendus uniques avec `useId`. `stickerSvg()` et `stickerJsx()` donnent le SVG autonome et la ligne JSX ; la démo propose Copy JSX, Copy SVG et le téléchargement du `.svg`.
- Prototypes : Peel (se décoller, avec l'envers blanc qui se replie), Slap (lancer depuis une réserve sur une surface) et Sheet (planche et panneau de copie). Yann a d'abord gardé Peel. Une relecture image par image a trouvé deux défauts à l'arrachage : le sticker se retournait entièrement quand le pli dépassait zéro, et il filait à 2,6 fois la vitesse du doigt. Une correction « Pop » les a réglés, puis Yann a abandonné Peel et Sheet et demandé de rapprocher le mouvement de [Stick It Up](https://x.com/samirande_/status/2119023597406568742) (prendre, incliner, faire sauter).
- Version gardée : le mouvement est dans le composant. `tilt` incline le sticker de 12° vers la souris en 3D. `movable` le fait prendre (pop à 110 % avec un léger dépassement), suivre le pointeur à 1:1 en s'inclinant jusqu'à 14° selon la vitesse, résister au bord de son parent, puis glisser sur son élan (projection d'Apple, taux 0,99) et se poser avec un petit écrasement et un angle légèrement différent. Plus de plateau ni de réserve : les stickers se posent librement dans leur parent.
- Exceptions assumées : la pose prend environ 400 ms, au-delà des 300 ms habituels, parce qu'on peut toujours rattraper le sticker et que rien n'attend ce mouvement (même raison que Shoji Bento). Pas d'ombre sous le sticker soulevé, malgré la référence : le pop et l'inclinaison suffisent, et la règle des ombres neutres reste entière. Le clavier déplace sans animation et le mouvement réduit retire inclinaison, pop, penchement et élan.
- Raison du nom : « die cut » est le découpage au contour qui donne ce bord blanc, et il donne un composant lisible, `<DieCut />`.
- Rejetés : vtracer (poids, volumes perdus), Peel, Slap avec plateau et réserve, Sheet, une ombre floue sous le sticker soulevé.

## Septième expérience : Snooze Button (7 novembre 2026)

Demandé par Yann : retravailler un bouton vu dans une vidéo (un bouton noir avec deux yeux qui suivent la souris), plus réactif, avec plusieurs états et un peu plus minimaliste, tout en restant reconnaissable. Il a demandé `emil-craft`, `grilling`, `codex-image`, `/prototype` et `humanizer` en plus d'`emil-design-eng` et `apple-design` : sa demande explicite prime sur la liste de skills de `CLAUDE.md` pour cette expérience, comme pour Gem Clip et Die Cut. La vidéo et ses images ne sont pas dans le dépôt : l'effet est reconstruit à partir de l'analyse image par image.

- Ce que la vidéo montrait (mesuré, 24 images/s) : un libellé qui change (« Let's talk! » / « Get in touch »), des yeux mi-clos qui s'ouvrent, des pupilles qui suivent le pointeur en environ 330 ms, un survol qui grossit le bouton de 3,5 % et noircit le fond en 2 images ou moins, un appui à 0,975 en environ 125 ms, une ombre floue et un liseré clair.
- Gardé comme caractère : deux yeux endormis au repos, qui s'éveillent et regardent le pointeur. Retirés : le changement de libellé (il change la largeur et ce qu'annonce un lecteur d'écran), l'ombre floue, le liseré, l'iris orange, l'ombrage des yeux, le grossissement et le noircissement au survol.
- Réveil : quand le pointeur passe à moins de 120 px du bouton, pas dans toute la page. Sinon, dix boutons regarderaient tous la souris en même temps.
- États : repos (mi-clos), éveillé, appui (le bouton à 0,97 et les yeux plissés d'un quart), chargement (les pupilles tournent, un tour en 0,9 s), succès (deux arcs souriants), désactivé (deux traits). Pas de clignement au hasard.
- API : une seule prop `status` (`idle`, `loading`, `success`) que la page contrôle ; le composant ne change jamais d'état seul après un clic, donc le clic n'est jamais retardé. `loadingLabel` et `successLabel` sont annoncés par une région `role="status"`. En chargement, le bouton est `aria-busy` et `aria-disabled` et ignore les clics, mais garde le focus.
- Valeurs : regard par deux ressorts sans dépassement (réponse 0,2 s) ; ouverture en 150 ms `ease-out` ; fermeture en 240 ms `ease`, 400 ms après la sortie de la zone, pour que les yeux ne clignotent pas quand on longe le bord ; appui en 100 ms, retour en 160 ms sans rebond, au moins 70 ms visibles.
- Tailles `sm`, `md`, `lg` (32, 40 et 48 px de haut) ; teintes `ink` (par défaut) et `paper`, plus `--accent` pour le fond. Les yeux font 60 % de la hauteur. Sans texte, le bouton n'a que ses yeux et demande un `aria-label`.
- Clavier : au focus, les yeux s'ouvrent d'un coup ; Entrée et Espace n'animent rien. Mouvement réduit : pas de regard ni d'échelle, l'appui assombrit le fond et les yeux changent avec un fondu. Toucher : les yeux s'ouvrent au contact, regardent le doigt et se rendorment environ 1 s après.
- Pas d'exception aux règles du labo : toutes les transitions durent 240 ms ou moins, et une seule arête nette de 1 px tient le bouton sur la page.
- Exploration : trois planches d'états générées avec Codex (Ink, Peek et Line), puis trois prototypes. Yann a gardé Ink (`docs/references/snooze-button-states.png`). Peek (des yeux derrière une fente découpée dans la pilule) et Line (un dessin au trait) sont retirés.
- Méthode retenue au prototype : la paupière n'est pas un calque posé sur l'œil. Le blanc de l'œil est découpé par le haut (`clip-path`), ce qui évite le liseré blanc que laissaient deux bords arrondis superposés.
- Raison du nom : le bouton somnole jusqu'à ce qu'on approche, et « snooze button » se retient comme « Glossy Button ».
