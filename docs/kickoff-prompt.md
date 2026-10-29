# Prompt de lancement : à coller dans un nouveau chat Claude Code

Ouvrir un **nouveau** chat Claude Code dans `/Users/yann/AIOS`, choisir le modèle Opus 5.5, puis coller tout le bloc ci-dessous. Un chat déjà ouvert garde les anciennes instructions d'AIOS en mémoire : ne pas réutiliser le chat arrêté.

Version du 29 octobre 2026 : la première version faisait piloter la construction par app-craft (retiré d'AIOS) et l'agent avait aussi chargé gpt-taste. Cette version limite la mission à deux skills de design, plus Humanizer pour la prose.

---

```text
Mission : créer le dépôt open source « experiments » de Yann et y construire la première expérience, un bouton en relief animé. Tu travailles dans AIOS : lis d'abord AGENTS.md, context/profile.md, context/preferences.md et workflows/build.md.

## Skills : ces deux-là, plus Humanizer pour la prose

Pour le design et le mouvement, tu utilises uniquement deux skills, tous deux installés dans /Users/yann/AIOS/.agents/skills/ (visibles par Claude via le lien .claude/skills), à jour au commit a81dbca07f2217b7103e510c0f13f8d5b017afc9 de https://github.com/emilkowalski/skills. Ne les réinstalle pas et ne les mets pas à jour.

1. emil-design-eng : charge-le réellement avec l'outil Skill au début. Il guide chaque décision d'animation et d'interaction : durées, courbes, état pressé, survol, focus, mouvement réduit, et ce qu'il vaut mieux ne pas animer.
2. apple-design : charge-le réellement avec l'outil Skill au début. Il guide le ressort du clic, le mouvement qui repart de la valeur courante et reste interruptible, la profondeur et le relief, et le mouvement réduit.

3. humanizer, pour toute prose publique (README, notes de l'expérience, textes de démo) : lis workflows/writing.md et le skill complet, révision intégrée, code et identifiants protégés.

Quand emil-design-eng et apple-design ne disent pas la même chose (par exemple durée fixe contre ressort), le cahier des charges decisions.md tranche s'il en parle ; sinon choisis, et explique ton choix dans le bilan.

Dérogation explicite de Yann pour cette mission, qui prime sur les routes générales d'AIOS :
- N'utilise pas web-craft, même si AGENTS.md le désigne pour les interfaces web. Ne lis pas workflows/interfaces.md.
- App-craft n'existe plus ; s'il apparaît encore quelque part, ignore-le. Ne crée aucun dossier .app-craft/ ni .web-craft/.
- Ne charge aucun autre skill de design, d'interface, d'animation ou d'écriture : ni gpt-taste, ni frontend-design, impeccable ou ui-ux-pro-max (des copies existent dans ~/.claude/skills), ni stop-slop. Si un autre skill se charge malgré tout, n'applique pas ses consignes et signale-le dans le bilan.
- La continuité de la mission passe par le STATE.md du projet, comme le décrit workflows/build.md.

## Sources à lire avant tout

- /Users/yann/AIOS/projects/experiments/docs/decisions.md : toutes les décisions prises avec Yann. C'est le cahier des charges. Ne rediscute aucun de ces choix ; signale-moi seulement un vrai blocage.
- /Users/yann/AIOS/projects/experiments/docs/references/glossy-button.png : la référence visuelle du bouton (design vu sur le site d'Emil Kowalski).

## Ce que tu construis

Dans /Users/yann/AIOS/projects/experiments (le dossier docs/ existe déjà, garde-le) :

- `git init`, branche `main`.
- App galerie Vite + React + TypeScript, CSS simple, sans Tailwind. `base: '/experiments/'` pour GitHub Pages. Le routage doit survivre à un rechargement direct d'une page d'expérience sur GitHub Pages (HashRouter, ou 404.html qui redirige : choisis et explique).
- Page d'accueil sobre avec grille de cartes ; chaque carte montre le composant en direct. Page d'expérience : toutes les variantes, code à copier (bouton « copier »), notes du README.
- `experiments/glossy-button/` avec exactement quatre fichiers : le composant `.tsx`, son CSS, la démo, `README.md`. La galerie découvre les expériences automatiquement (import.meta.glob ou équivalent), sans liste à maintenir à la main.
- Le bouton suit à la lettre la section « Première expérience » de decisions.md : tailles sm/md/lg, quatre teintes + `--accent` dont dérive tout le relief (color-mix ou équivalent), emplacement secondaire optionnel, survol, clic avec ressort, focus clavier, désactivé, prefers-reduced-motion, option `shine` désactivée par défaut. Un vrai `<button>`, accessible, qui accepte les props natives.
- Reconstruis l'effet à partir de l'image. Ne télécharge pas et ne recopie pas le code ni les textes du site d'Emil ; utilise tes propres textes de démo. Le README du bouton cite l'inspiration avec un lien vers son site.
- `.github/workflows/deploy.yml` : build et déploiement GitHub Pages (actions officielles configure-pages, upload-pages-artifact, deploy-pages) à chaque push sur `main`.
- `LICENSE` MIT au nom de ultrararebinary, année 2026.
- `README.md` racine en anglais (le dépôt est public) : ce qu'est le labo, lien vers le site, comment copier un composant, comment lancer en local.
- `CLAUDE.md` : règles du dépôt pour les futurs chats (renvoi vers docs/decisions.md, structure à quatre fichiers, règle des références, les skills autorisés emil-design-eng et apple-design, plus humanizer pour la prose, vérifications à faire avant de finir).
- `NEW-EXPERIMENT.md` : modèle de prompt court à remplir pour chaque nouvelle expérience (nom, référence image ou lien, ce qui plaît dans la référence, variantes voulues, états). Le modèle rappelle les deux skills à utiliser.
- `STATE.md` du projet, et une entrée « Experiments » dans /Users/yann/AIOS/projects/README.md au format des autres entrées.

Code et textes publics en anglais ; tes explications pour moi en français.

## Vérification avant de dire que c'est fini

- `npm run build` et le typecheck passent sans erreur.
- Ouvre la galerie dans le navigateur intégré : accueil, page du bouton, rechargement direct de cette page, bouton copier.
- Contrôle chaque état du bouton dans chaque taille et chaque teinte : survol, clic, focus au clavier (Tab), désactivé, shine, et prefers-reduced-motion émulé. Prends des captures et compare-les à la référence. Une capture ne prouve pas une animation : pour le clic et le ressort, mesure la transformation à plusieurs instants, et teste un clic interrompu (relâcher avant la fin) ainsi que des clics rapides répétés.
- Vérifie la console : zéro erreur.
- Teste `npm run build && npx vite preview --base /experiments/` pour simuler le chemin GitHub Pages.

## Publication : arrête-toi et demande-moi

Quand tout est vérifié en local, fais un premier commit, puis arrête-toi. Montre-moi les captures et les commandes ci-dessous, et attends mon « oui » avant de rien publier. La variable GITHUB_TOKEN de mon environnement est invalide et masque ma vraie connexion ; d'où le `env -u GITHUB_TOKEN`.

    env -u GITHUB_TOKEN gh repo create ultrararebinary/experiments --public --source . --remote origin --push --description "Small UI experiments, free to copy."
    env -u GITHUB_TOKEN gh api -X POST repos/ultrararebinary/experiments/pages -f build_type=workflow
    env -u GITHUB_TOKEN gh run watch

Après mon accord : exécute-les, attends la fin du déploiement, ouvre https://ultrararebinary.github.io/experiments/ et vérifie que la page et le bouton fonctionnent en ligne.

## Bilan final (en français)

Selon mes préférences : explique d'abord comment le bouton fonctionne (comment une seule couleur produit tout le relief, comment le clic donne l'impression d'enfoncer le bouton, pourquoi ces durées et ce ressort), avec des exemples tirés du vrai code. Cite les règles précises d'emil-design-eng et d'apple-design que tu as appliquées, et dis où elles se contredisaient et ce que tu as choisi. Puis ce qui a été fait, ce qui a été vérifié pour de vrai, ce qui ne l'a pas été, la liste des skills réellement chargés, et comment lancer une deuxième expérience avec NEW-EXPERIMENT.md.
```
