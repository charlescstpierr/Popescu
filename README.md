# Toma Popescu — 20 minutes sans IA

Pour continuer dans une nouvelle discussion: [contexte de reprise](docs/REPRISE.md) et [consignes du projet](AGENTS.md).

Jeu web original en français québécois. Un seul monde procédural infini, auto-shooter, sept variantes de gorilles, orangs-outans, deux rivaux masculins, quinze améliorations, compagnon et musique originale synthétisée.

## Jouer
Ouvrir le lien déployé. Sur téléphone: glisser le pouce dans la partie inférieure gauche. Sur ordinateur: WASD, ZQSD ou flèches; Échap: pause; M: son. Les tirs sont automatiques. L'introduction et les événements peuvent être passés.

Après 20 minutes, victoire puis poursuite optionnelle à l'infini. Les records et paramètres sont conservés localement. Aucun service externe requis pendant la partie.

## Développement
Aucune dépendance. Servir `dist/` par HTTP; ne pas ouvrir les modules directement avec file://. `npm test` exécute les tests déterministes du moteur et du monde. Les fichiers `dist/engine.js`, `world.js`, `renderer.js`, `content.js`, `audio.js`, `app.js` séparent simulation, génération, rendu, narration, audio et interface.

## Audio
Le navigateur nécessite une première interaction pour autoriser le son. Le thème de combat original « Égo en cavale » joue à 150 BPM sur 32 mesures : refrain de sept notes, réponses, pont, harmonies, basse et percussions. Le menu reprend son motif à 104 BPM. La mélodie conserve sa progression pendant les améliorations et reprend après pause; les dialogues baissent la musique. Les voix et les effets sont limités pour garder la mélodie audible dans la horde. Le bouton ♫ active ou coupe le son.

## Vérification
Les tests couvrent déplacement normalisé, collisions, pauses, tirs, gaz annoncés, sept variantes, quinze améliorations, compagnon, mort/victoire/infini, limites mémoire et déterminisme. Simulation sans invulnérabilité de 20 minutes dans les quatre difficultés, plus stress du mode infini. Le rendu pixel art a été inspecté et les interfaces vérifiées par un adaptateur DOM. Le contrôle navigateur a été bloqué par la connexion du site privé et la politique locale; la disposition et le contrôle tactile sur iPhone/Android physique restent à vérifier.

Les personnages, comportements et événements sont parodiques et volontairement exagérés.

## Copie autonome
Le script `python3 scripts/export-standalone.py /chemin/Toma_Popescu_JOUER.html` embarque CSS, JavaScript et images dans un seul fichier HTML. Sur un ordinateur, ouvrir ce fichier dans un navigateur permet de jouer sans serveur.

## Mise à jour graphique
Acteurs illustrés en pixel art avec poses de course avant/arrière, variantes de gorilles, ville enrichie (vitrines, trottoirs, reflets, affichage néon), impacts et réactions. Toma utilise des images complètes du crâne aux bottes: tête, torse, mains, fusil et jambes restent dans le même dessin. Le secours conserve lui aussi le personnage entier si son image ne charge pas.

`node scripts/inspect-graphics.mjs /tmp/toma-graphics-qa` vérifie les véritables atlas et le moteur de rendu avec `@napi-rs/canvas` (dépendance de QA seulement), produit un rendu390×844 et mesure une moyenne de100images. Cette mesure hors navigateur ne constitue pas une mesure deFPS sur iPhone.

## Davantage de singes et de décor
Les orangs-outans femelles roux rejoignent les gorilles. Leurs longs bras portent une attaque annoncée par un secteur orange, puis une frappe dans cette direction. Les hordes mixtes arrivent dès20secondes, puis toutes les45secondes; la population régulière double et les groupes d’orangs-outans commencent à10secondes. Les effectifs restent limités à300 pour préserver les ressources.

La ville reçoit des groupes variés d’objets de rue: stands à hot-dogs, tables, distributrices, bacs de plantes et arbres, palettes et caisses, cônes et barrières, sacs, bornes-fontaines et trophées géants. Ils restent décoratifs et les rues centrales restent praticables.

## Toma, athlète autoproclamé
Le modèle approuvé reprend la calvitie visible, les sourcils marqués, la barbe courte et la veste sombre de Toma en pixel art. Chaque phase de course et de grand écart est une peinture complète. La course suit la distance réellement parcourue; les poses intermédiaires descendent vers une extension fixe puis remontent vers la course. Le canon et le personnage partagent la même transformation, et les balles partent de son extrémité enregistrée dans chaque image. Pendant la course, Toma fait parfois une split avec des comparaisons à Jean-Claude Van Damme et 16 vantardises différentes. Le mouvement et les tirs continuent normalement; sa blonde peut lui répondre.

## Rivaux
Le coq arrive après une minute, le bouc après 1 min 45, puis ils alternent. Deux rivaux maximum sont actifs à la fois. Le bouc baisse les cornes pendant 0,8 s et charge dans le couloir annoncé pendant 0,55 s. Le coq s’immobilise, prépare son cri pendant 0,85 s, puis crie « COCORICO! » avec une onde circulaire : seul l’anneau en expansion inflige des dégâts, une fois par cible. Les deux attaques peuvent être esquivées; charme et Mode avion interrompent leur préparation.

Seize insultes contextuelles sont réservées aux rivaux masculins. Les rivaux et la blonde répondent; les échanges sont espacés et peuvent être désactivés dans les paramètres. Au « COCORICO! », Toma réplique : « Men, farmes ta criss de gueule ! ». Cette réaction attend le vrai cri, reste lisible pendant l’action et n’est pas déclenchée si la préparation est interrompue.

## Monde à découvertes
Les ruines, cabanes, autels, épaves et failles hors ligne enrichissent la même ville infinie. Approche-toi d'un lieu pour obtenir un effet temporaire sans interrompre le combat : puissance du fusil, récupération, ramassage, vitesse ou cadence contre un léger ralentissement. Le HUD indique la règle et le temps restant. Un seul effet à la fois; un lieu se recharge après deux minutes et exige de s'éloigner avant de revenir. [Règles et vérification](docs/DECOUVERTES.md).

## Forêts et ville endommagée
Le monde alterne désormais quartiers urbains et régions boisées connectées. Pins, rochers et vestiges entourent des sentiers praticables; les villes mêlent appartements, garages, entrepôts, commerces et ruines. Les découvertes et le combat continuent sans changer de carte. [Direction, génération et vérification](docs/FORETS-ET-RUINES.md).

## Péli Zodiaque

Un boss majeur rejoint les rencontres aléatoires : un pélican à petite bedaine, veste étoilée et cartes de tarot. Câlin annoncé, cercle du zodiaque avec ouverture et cartes qui reviennent composent ses trois attaques. Les échanges non bloquants jouent sur Toma, Poissons ascendant Sagittaire. Péli, Travestia et la matriarche arrivent un à la fois, à des moments aléatoires. Les anciennes parties sont migrées. [Règles et vérification](docs/PELI-ZODIAQUE.md).


## Boss à moments aléatoires

Péli, Travestia et la matriarche partagent un seul calendrier : première rencontre entre 2 min 30 et 3 min 30, puis une pause aléatoire de 1 min 35 à 2 min 45 après chaque défaite. Leur ordre est mélangé par groupes de trois, avec chaque boss une fois par groupe et aucune répétition immédiate. Une annonce précède l'arrivée de cinq secondes. Le dernier direct garde un boss vivant ou fait venir le prochain déjà tiré au sort. La victoire reste à vingt minutes.

La sauvegarde v6 garde le prochain boss, le délai et le tirage aléatoire exacts. Reprendre une partie ne relance pas le hasard. [Détails et vérification](docs/BOSS-ALEATOIRES.md).
