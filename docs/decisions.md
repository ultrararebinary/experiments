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
