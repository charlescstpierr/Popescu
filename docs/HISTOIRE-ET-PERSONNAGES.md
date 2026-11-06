# Histoire et fiches des personnages

Référence éditoriale du 5 novembre 2026, tirée du jeu exécutable. Ce document distingue les faits de la fiction, les vantardises de Toma et les règles du jeu. Il ne prétend pas rapporter l'avis de joueurs humains. Les fichiers cités, et non les anciens rapports de version, font foi.

## Le fil de l'histoire

Toma s'est fabriqué une vie de légende avec des images générées : voiture, villa, abdos et clés. La panne mondiale coupe l'IA en ligne; les créations sortent des images et échappent à ses ordres. Il doit maintenant courir et survivre pour de vrai pendant vingt minutes. Ses anciens symboles de prestige deviennent des pouvoirs, mais pas la preuve qu'il possédait réellement cette vie.

La plaisanterie centrale reste la même du début à la fin : Toma interprète toute chose comme un hommage à sa grandeur; ce que voit le joueur le contredit. La victoire est une exception réelle : le joueur a effectivement survécu. Le récit peut lui reconnaître ce succès sans valider la fortune ou la célébrité inventées.

### Ce que le nouveau joueur doit comprendre

1. **La photo est fausse, la poursuite est jouable.** Les trois cartes d'ouverture relient le fantasme, la panne et la rue. Elles ne demandent pas de connaissance préalable des personnages.
2. **Il commande le déplacement, pas les tirs.** La première ennemie est seule au départ. Le temps attend le premier mouvement; le tir est automatique ensuite.
3. **Les éclats bleus donnent de l'expérience.** Monter de niveau permet de choisir un pouvoir. Le tutoriel l'explique après le tir; le choix arrête le temps.
4. **Vingt minutes suffisent.** Aucun boss précis ni nombre de victimes n'est nécessaire pour gagner. La fin ne promet pas le retour d'Internet.
5. **La Blonde IA est une copie locale.** Son existence en jeu ne rétablit pas le service en ligne. La carte de pouvoir donne cette explication même lorsque le bavardage est coupé.
6. **Après la victoire, tout est facultatif.** Le mode infini prolonge la survie; l'épilogue Charles est un autre choix. La victoire reste acquise.

Sources : `dist/opening.js`, `dist/index.html`, `dist/content.js`, `dist/engine.js`, `dist/charles.js`.

## Ordre réel des scènes

- **Ouverture :** les trois cartes `fantasy → offline → street`. `INTRO`, encore exporté par `content.js`, contient un ancien dialogue de sept lignes; il n'est pas le parcours actuel du bouton JOUER ou REVOIR L'INTRO. Ne pas le confondre avec le texte réellement lu.
- **Pendant l'action :** la première horde fournit un démenti au fantasme des admiratrices. Le pic de douze ennemis vivants est noté (`horde-peak`), puis la scène se joue au premier calme; ce n'est pas une cinématique garantie à une seconde exacte.
- **Scènes de rue :** téléphone, distributrice, trophée, vélo, miroir, char et banc jouent leur scène complète de `EVENTS`, une fois par partie, seulement au calme. Les autres objets gardent leur remarque d'une ligne. Une scène lue ou annulée ne revient pas.
- **Compagne :** l'invocation est liée à l'acquisition de Blonde IA. La scène compacte `companion-local` précise ensuite sa copie locale si le bavardage est actif et qu'elle est disponible. Ne pas écrire de réponse de sa part dans une partie solo.
- **Construction du personnage :** la première amélioration choisie parmi voiture, vérité, billets et abonnés sélectionne un seul petit fil narratif. Les anciennes sauvegardes sans choix mémorisé utilisent un pouvoir acquis comme repli. Il ne faut pas annoncer au joueur qu'il verra les quatre scènes dans une seule partie.
- **Jalons :** cinq, dix, quinze et dix-neuf minutes. À dix minutes, le rappel dépend d'un fil d'amélioration entièrement lu; à quinze minutes, de la dernière scène de rue entièrement lue. Une reprise tardive ne déverse pas tous les anciens jalons.
- **Boss :** Matriarche, Travestia et Péli arrivent dans un ordre variable. Leur première conversation admissible peut arrêter le temps; les provocations suivantes restent compactes. Le récit ne doit pas supposer que Péli a précédé Travestia.
- **Dernière minute :** les nouvelles scènes facultatives s'arrêtent avant les annonces finales. Survivre jusqu'à 20:00 suffit même si les ennemis sont encore présents.
- **Victoire :** une réplique tient compte du fil effectivement terminé ou des pouvoirs de la partie. Charles conserve son dialogue et sa séquence distincts.
- **Défaite :** `defeatQuote` choisit selon `deathCause`, la source d'abord (nuage de gaz, explosion, cri du coq, queue de Travestia, Péli), puis l'acteur d'un contact (orang-outan, bouc, Matriarche, gorilles ordinaires). Animaux, bêtes de l'ego et causes inconnues gardent « FUCKK ! Efface la vidéo. On recommence. »
- **Calme :** `Game.isCalm` exige l'absence d'attaque annoncée ou en cours, de nuage et de boss à l'écran (`CALM_DANGER_R`), de boss en attaque n'importe où, de contact, de coup reçu depuis une seconde et de foule (`CALM_N`, `CALM_R`). Une scène au calme attend jusqu'à huit secondes entre deux répliques, puis s'annule; la simulation ne se fige jamais. Recalibrer avec `node scripts/simulate-story-lulls.mjs`.

Sources : `Game.story`, `Game.isCalm`, `Game.chooseUpgrade`, `STORY_SCENES`, `STREET_SCENE_TYPES`, `storyMilestoneLine`, `victoryQuote`, `defeatQuote`, `dist/boss-director.js`, `dist/encounter-dialogue.js`. L'ordre d'arrivée détaillé peut différer si une zone d'apparition est bloquée.

## Toma Popescu

- **Rôle :** protagoniste jouable et cible de la satire. Il veut être perçu comme une vedette richissime et irrésistible; le joueur veut surtout le garder en vie.
- **Faits montrés :** il court, tire automatiquement, fait le grand écart et utilise les pouvoirs acquis. Sa voiture, sa villa et ses abdos de photo sont générés. Sa victoire de vingt minutes est réelle dans la fiction.
- **Voix :** français québécois, vantardise concrète, brusque panique quand le réel le rejoint. Il réinterprète la contradiction plutôt que de devenir soudain modeste.
- **Rapports :** il s'attribue le travail de la Blonde IA; provoque le bouc et le coq; repousse les avances des boss; se fait contredire par Charles.
- **Garde-fous :** ses allusions à Chuck Norris ou Van Damme sont des fanfaronnades de ce personnage fictif. Ne pas les présenter comme des faits sur ces personnes. N'inventer ni domicile chez son père, ni métier, ni âge, ni biographie réelle.
- **Réplique protégée :** `Men, farmes ta criss de gueule !`, uniquement après le vrai cri du coq, jamais si sa préparation a été interrompue.

Sources : `OPENING`, `STUNT_BARKS`, `RIVAL_BARKS`, `ROOSTER_REACTION`, `Game.updateStunt`, `Game.reactToCrow`.

## Blonde IA

- **Rôle :** alliée concrète et contrepoint pratique. Elle aide Toma, mais n'est pas son public docile.
- **Faits montrés :** cinq femmes différentes, une par rang (décision du 6 novembre 2026). Toma prend chaque changement pour un hommage; la nouvelle venue rétablit les faits (`COMPANION_ARRIVALS`, rangs 2 à 5, au calme, seulement le rang en attente le plus haut). Cœurs et collecte au premier rang; esquive, collecte accrue, protection puis deux drones aux rangs suivants. Elle redémarre après sa mise à terre.
- **Voix :** courte, sèche, attentive à ce qui se passe. Une pointe finale répond à la vantardise qui vient réellement d'être prononcée.
- **Continuité :** copie locale compatible avec la panne du service en ligne. Ses interventions en action exigent son déblocage et sa disponibilité. Sa présence illustrée sur la couverture n'est pas un déblocage de jeu.
- **Garde-fous :** pas de mémoire d'une partie à l'autre; pas de réplique après sa mise hors service, hormis l'annonce de transition déjà prévue. Une alerte de claque exige une véritable préparation hostile; une baisse de PV exige un dégât de santé récent, pas seulement un bouclier touché.

Sources : `COMPANION_LEVELS`, `COMPANION_ARRIVALS`, `EVENTS.companion`, `STORY_SCENES['companion-local']`, `currentBarkContext`, `Game.updateCompanion`.

## Système

- **Rôle :** voix factuelle qui précise les règles et démonte le décor de prestige.
- **Voix :** constats courts, absurdité administrative ou économique, sans surenchère d'insultes.
- **Continuité :** cette voix d'interface n'est pas la preuve du retour de l'IA en ligne. Elle peut annoncer une panne et expliquer un effet local.
- **Garde-fou :** ne pas affirmer un événement de combat qui n'a pas eu lieu. Les annonces importantes priment sur les blagues.

Sources : `OPENING`, `WORLD_REMARKS`, `STORY_MILESTONES`, `STORY_SCENES`.

## Gorilles, orangs-outans et Matriarche

- **Rôle :** poursuite et démenti physique aux « fans » que Toma imagine. Le récit ne confirme pas qu'elles sont attirées par lui.
- **Gorilles ordinaires :** les variantes `normal`, `sprinter`, `gas`, `tank`, `jealous`, `explosive` ont des comportements distincts. La jalouse peut viser la compagne; le gaz et les explosions restent annoncés.
- **Orangs-outans :** silhouette et longs bras distincts; claque annoncée dans un secteur. Ce ne sont pas une simple couleur de gorille.
- **Matriarche (`matriarch`) :** boss majeur, aussi annoncé comme « la modération ». Elle invoque des renforts. Son coffre ouvre un choix entre Fan-club forcé et Badge de modération, une fois par partie.
- **Voix :** leur menace est surtout portée par le mouvement. Les noms Ginette Turbo, Roxanne Flex, etc. constituent une liste de noms existante, pas une biographie individuelle établie par le moteur.
- **Garde-fous :** ne pas leur attribuer les répliques masculines du coq ou du bouc. « Fans » doit rester l'interprétation de Toma.

Sources : `GORILLA_NAMES`, `Game.updateEnemies`, `Game.spawnHorde`, `BOSS_TROPHIES`.

## Coq rival

- **Rôle :** rival masculin qui répond aux attaques d'ego de Toma.
- **Action :** préparation immobile, cri effectif puis anneau qui s'étend. L'esquive porte sur l'anneau, pas sur une zone pleine imaginaire.
- **Voix :** répond à la provocation précise, renvoie Toma à ses faux comptes et à son prestige de photo.
- **Garde-fous :** pas de réponse sans amorce; pas de cri ou de riposte de Toma si le cri a été interrompu; pas de réplique après disparition du rival.

Sources : `RIVAL_BARKS[*].replies.rival_rooster`, `Game.updateRivalBanter`, `Game.updateShockwaves`, `ROOSTER_REACTION`.

## Bouc rival

- **Rôle :** autre rival masculin, distinct du coq; il retourne à Toma ses insultes sur l'argent, l'emploi et le statut.
- **Action :** prépare un coup de tête puis charge dans une direction verrouillée.
- **Voix :** réponses directes et concrètes, écrites pour la provocation correspondante.
- **Garde-fous :** ne pas lui donner le cri du coq ni une réponse choisie au hasard dans un autre échange. Ses propos sur Toma sont du dialogue satirique, pas une source de faits privés.

Sources : `RIVAL_BARKS[*].replies.rival_goat`, `Game.updateRivalBanter`, `Game.updateEnemies`.

## Péli Zodiaque

- **Rôle :** boss envahissant qui mélange astrologie, tarot et câlins non désirés. Son surnom « mononcle » appartient à son numéro; aucune parenté réelle n'est établie.
- **Action :** charge de câlin, anneau zodiacal avec ouverture, cartes de tarot aller-retour. Le trophée offre Tarot flatteur ou Ascendant protégé.
- **Voix :** rapprochement insistant, lecture flatteuse de Toma, vocabulaire de l'horoscope. Toma profite un instant du compliment puis le repousse.
- **Garde-fous :** conserver les paires écrites et les répliques demandées. Fermer une provocation compacte annule aussi la réponse de Toma, même si celle-ci a déjà été mise en file. Cela ne supprime ni l'attaque ni son avertissement.

Sources : `PELICAN_BANTER`, `dist/pelican.js`, `BOSS_TROPHIES.pelican`, `dismissSpeech`.

## Travestia

- **Rôle :** boss théâtral qui provoque Toma autour de sa queue. La rencontre repose sur ce personnage précis, sans transformer sa caricature en jugement sur un groupe réel.
- **Action :** balayage circulaire et charge en alternance, chacun annoncé. Le trophée offre Coup de panache ou Sortie de star.
- **Voix :** provocation assumée; Toma panique, proteste et prétend seulement regarder où il marche.
- **Réplique protégée :** `Vas-y Toma, je sais que tu veux toucher ma queue, touche-la Toma`, suivie de `FUCKK !` dans le premier échange.
- **Garde-fous :** pas de réponse isolée après fermeture de l'amorce. Ne pas confondre la queue hélicoptère avec le pouvoir `chopper`, qui est une moto.

Sources : `TRAVESTIA_BANTER`, `dist/travestia.js`, `dist/travestia-dash.js`, `BOSS_TROPHIES.travestia`.

## Les animaux secondaires

Ils diversifient les esquives; ils ne constituent pas quatre nouveaux narrateurs ni quatre chapitres obligatoires.

- **Autruche (`ostrich`) :** charge rectiligne annoncée.
- **Paparazzi (`paparazzi`) :** flash en cône. Le distinguer du Paon Paparazzi ci-dessous.
- **Orignal (`moose`) :** charge plus lourde, couloir annoncé.
- **Poulet disco (`disco_chicken`) :** attaque circulaire proche. Le distinguer du coq rival et de son anneau en expansion.

Sources : `ANIMALS`, `beginAnimalAttack`, `drawAnimalWarning`.

## Les quatre bêtes de l'ego

Leurs noms font écho aux obsessions de Toma. Aucun passé personnel ni dialogue n'est ajouté par cette fiche.

- **Paon Paparazzi (`ego_peacock`) :** piège rectangulaire de cadrage; ne pas lui attribuer le cône du paparazzi ordinaire.
- **Crapaud Alpha (`ego_toad`) :** saut vers un point annoncé, impact puis récupération vulnérable.
- **Rat Huissier (`ego_rat`) :** trois couloirs de reçus qui s'activent successivement.
- **Caméléon Discount (`ego_chameleon`) :** camouflage de surface puis langue dans une direction annoncée.

Sources : `EGO_BEASTS`, `egoAttackGeometry`, `updateEgoBeast`. Les animations sont traitées séparément de ce document.

## Charles l'Illuminé

- **Rôle :** rencontre optionnelle après la vraie victoire; il confronte les preuves de survie aux preuves photographiques douteuses.
- **Faits du jeu :** invincible; ses attaques sont mortelles en un coup. Les impacts reçus font avancer sa transformation, pas une barre de vie à vider.
- **Voix :** répond aux affirmations exactes de Toma. Il peut reconnaître sa survie sans croire sa photo de fortune.
- **Garde-fous :** ne jamais le présenter comme le boss qu'il faudrait battre pour gagner les vingt minutes. Laisser le joueur quitter l'épilogue; préserver sa victoire. Ne pas inventer de lien familial ou de biographie réelle.

Sources : `CHARLES_LINES`, `startCharles`, `finishCharles`, écrans de confirmation et de résultat dans `dist/index.html`. Cette fiche n'altère pas son arrivée ni sa séquence finale.

## Contrats d'écriture à préserver

- Un mensonge de Toma appelle une contradiction liée à ce mensonge, pas une réponse interchangeable.
- Une explication indispensable ne doit pas dépendre exclusivement du bavardage facultatif.
- La voiture de pouvoir est holographique et sans siège; les épaves du décor ne se conduisent pas. Le luxe en photo ne devient pas une propriété réelle par une réplique du Système.
- `airplane` est un Mode avion défensif. `chopper` est une moto Harley holographique. Ni avion offensif, ni hélicoptère allié.
- Une scène fermée n'est pas une scène entièrement lue. Elle ne gagne pas un rappel narratif de fin.
- Les textes déjà en attente dans une sauvegarde sont conservés. Modifier un dialogue modal canonique demande de traiter explicitement sa validation et sa migration; une simple substitution de texte peut rendre une reprise invalide.
- Les chiffres de réussite des tests mesurent le logiciel, pas le plaisir, la compréhension d'un vrai joueur ni la fluidité d'un téléphone physique.
