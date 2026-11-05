# Reprendre Toma Popescu

Ce dépôt est une copie portable de la version v1.5 approuvée. Le prochain objectif sera donné par l'utilisateur. Commencer par lire [docs/REPRISE.md](docs/REPRISE.md), puis [docs/QA-V1.5.md](docs/QA-V1.5.md) et les fichiers concernés par sa demande. Ne pas inventer de prochaine fonctionnalité.

## Référence actuelle

- Jeu JavaScript natif, modules ES, sans compilation ni service distant pendant la partie. `dist/` contient l'application complète.
- La v1.5 remplace les anciens assemblages de torse et de jambes. Les descriptions v1.3/v1.4 conservées dans les documents sont historiques; elles ne doivent pas réintroduire cette technique.
- La copie GitHub est indépendante du Site d'origine. Ne pas ajouter de configuration d'hébergement ni publier une nouvelle version sans demande correspondante.
- L'utilisateur a explicitement demandé des sous-agents pour accélérer le travail. Répartir les tâches indépendantes avec des propriétaires de fichiers distincts. Après un changement d'animation, faire effectuer une revue visuelle indépendante du rendu réel, en plus des tests.

## Graphisme approuvé à conserver

- Chaque image de Toma contient le personnage entier, du crâne aux bottes, avec ses deux mains et son arme. Aucun assemblage de membres, découpage du torse, rotation, cisaillement ou déformation du personnage pour suivre la visée.
- `hero-frames.js` enregistre des cellules de 144 × 128 px, ancrées en `[65,111]`. Huit vues peintes donnent quatorze directions par six miroirs horizontaux. L'atlas courant `toma-whole-v7.png` contient 104 entrées issues de 96 peintures complètes; seules les préparations debout inutilisées sont dupliquées. Sources et préparation courantes : `art/source/toma-likeness/` et `scripts/prepare-hero-likeness.py`.
- Le 5 novembre 2026, l'utilisateur a signalé la perte de ressemblance et fourni quatre nouvelles photos pour corriger Toma. Cette demande remplace l'ancienne obligation de garder les peintures E pixel par pixel. Le visage courant conserve un front haut, un crâne rasé, une barbe courte, une bouche visible et les lunettes sur le crâne dans toutes les vues. Les atlas v5/v6 et leurs préparateurs restent des références historiques inchangées, pas la version à reconstruire. Ne pas régénérer l'art pour une simple modification de code.
- Le pas dépend de la distance réellement parcourue: 10 px par phase, huit phases. La phase continue change de sens sans inversion instantanée de son indice quand Toma recule. Une intention de déplacement contre un mur ne doit pas faire courir le personnage.
- Le grand écart utilise les images complètes `run0 → split2 → split3 → split4`, tient exactement la même extension entre 24 % et 69 %, puis revient vers la course. Déplacement, tirs et dégâts continuent; les écrans modaux figent la simulation.
- Le corps est choisi par un point stable au torse, `y−40`, y compris au contact, et conserve sa vue à l'arrêt. Les virages sont bornés à 16 rad/s avec une rétention de 0,08 rad entre coûts; un tir imminent termine un demi-tour si le rayon serait à rebours du canon. Le déplacement du canon d'une image à l'autre ne doit pas faire alterner la vue du corps.
- `computeHeroPose(s).muzzle` est l'origine réelle des balles. `pose.aim` vise la cible depuis ce canon; `pose.barrelAim` suit l'arme peinte pour l'éclat. Ces deux directions peuvent différer. Préserver les peintures natives et la visée exacte.

## Limites de modification

- Dans un dialogue, le grand portrait et son nom suivent la personne qui parle (`line.who`), jamais l’acteur propriétaire de la scène. Garder séparés le contexte de rencontre sauvegardé et la présentation du locuteur. Le portrait courant de Toma est `dialogue-toma.png`; les rangs de Blonde IA restent issus de la progression courante.

- Le moteur reste indépendant du DOM; le rendu ne modifie jamais l'état de simulation.
- Conserver les contrôles tactiles et clavier, les attaques annoncées et esquivables, les plafonds mémoire, les quatre difficultés, la victoire à 20 minutes et l'infini optionnel.
- Garder la satire québécoise dirigée contre l'ego fictif de Toma. Les insultes destinées aux rivaux masculins restent réservées à ces rivaux. Les interventions spontanées de la compagne en partie dépendent de son déblocage.
- Ne pas remplacer les effets établis par leurs anciens contresens: `airplane` est le Mode avion défensif; `chopper` est une moto Harley holographique.
- La réplique au vrai cri du coq est exactement `Men, farmes ta criss de gueule !`; une préparation interrompue ne la déclenche pas.

## Vérifier selon le changement

```bash
npm test
python3 -m http.server 8000 --directory dist
python3 scripts/export-offline.py
python3 scripts/export-standalone.py
```

La suite utilise Node.js et Python 3 (bibliothèque standard pour vérifier les exports), sans paquet externe pour le moteur et l'export. Les trois tests de fumée graphiques du dossier hors ligne et le test natif de publication atomique des captures sont ignorés avec une raison explicite si `@napi-rs/canvas` n'est pas déjà installé. Pour la QA graphique native facultative:

```bash
npm install --no-save @napi-rs/canvas@0.1.100
node scripts/inspect-hero.mjs /tmp/toma-hero-qa
node scripts/inspect-graphics.mjs /tmp/toma-graphics-qa
```

Les scripts Python de préparation artistique nécessitent les versions de Pillow, NumPy et SciPy épinglées dans `art/requirements.txt`:

```bash
python3 -m pip install -r art/requirements.txt
```

Ne reconstruire les atlas que si la tâche le demande. Si `dist/` change, régénérer le dossier hors ligne avec `scripts/export-offline.py` avant de le livrer. `release/Toma_Popescu_JOUER.html` est le point d'entrée courant avec `release/assets/`; ne pas déplacer ce chemin ni modifier les clés de sauvegarde pour un changement d'emballage. L'export monofichier facultatif va dans `generated/standalone/`, jamais à la place de ce dossier. Lire [docs/EXPORTS-HORS-LIGNE.md](docs/EXPORTS-HORS-LIGNE.md); les anciennes commandes d'export dans les rapports historiques ne définissent plus la livraison courante. Une mesure Canvas native ne prouve pas les performances ni le comportement tactile sur un téléphone physique.
