// Tout le monde ici est fictif, surtout la réputation que Toma se donne.
export const DIFFICULTIES = {
  easy: { label: 'Promenade de star', hp: 1.3, damage: 0.75, spawn: 0.8, speed: 0.9 },
  normal: { label: 'Égo standard', hp: 1, damage: 1, spawn: 1, speed: 1 },
  hard: { label: 'Crise de vedettariat', hp: 0.85, damage: 1.2, spawn: 1.2, speed: 1.08 },
  nightmare: { label: 'Légende dans sa tête', hp: 0.7, damage: 1.5, spawn: 1.45, speed: 1.18 },
};

export const UPGRADES = [
  { id: 'muscle', name: 'Muscles Photoshop', desc: 'Dégâts des balles +25 % par rang. Le certificat sent le toner.', icon: 'muscle', max: 5, color: '#fb6d9d' },
  { id: 'car', name: 'Lamborghini imaginaire', desc: 'Un char fonce dans la horde. Chaque rang augmente ses dégâts et sa fréquence.', icon: 'car', max: 5, color: '#f4bd58' },
  { id: 'followers', name: 'Abonnés fictifs', desc: 'Cadence de tir +18 % par rang. Un tir supplémentaire aux rangs 3 et 5.', icon: 'followers', max: 5, color: '#69cafa' },
  { id: 'ego', name: 'Ego surdimensionné', desc: '+20 PV maximum et 25 PV récupérés par rang. Ça déborde du cadre.', icon: 'ego', max: 5, color: '#cf83ff' },
  { id: 'money', name: 'Selfie de milliardaire', desc: 'Lance un éventail de billets. Les pièces soignent davantage à chaque rang.', icon: 'money', max: 5, color: '#8ee68e' },
  { id: 'airplane', name: 'Mode avion', desc: 'Dissipe le gaz, suspend les attaques spéciales proches et ralentit les ennemis. Immunité temporaire au gaz.', icon: 'airplane', max: 5, color: '#a5d8ff' },
  { id: 'girlfriend', name: 'Blonde IA', desc: 'Débloque la compagne, ses cœurs, son aura de collecte et +20 bouclier. Puis améliore ses PV et ses tirs.', icon: 'girlfriend', max: 5, color: '#ff8cba' },
  { id: 'charisma', name: 'Charisme imaginaire', desc: 'Les cœurs charment mieux et plus longtemps. Vitesse ennemie réduite de 7 % par rang.', icon: 'charisma', max: 5, color: '#fca8d4' },
  { id: 'chopper', name: 'Chopper inexistant', desc: 'Une moto holographique traverse la horde, frappe et repousse. Chaque rang augmente les dégâts et la fréquence.', icon: 'chopper', max: 5, color: '#6ce2cc' },
  { id: 'truth', name: 'Vérité brute', desc: 'Une onde de vérité blesse et repousse les ennemis proches. Les faits cognent fort.', icon: 'truth', max: 5, color: '#ffe193' },
  { id: 'filter', name: 'Filtre beauté', desc: 'Dégâts de gaz réduits de 16 % et vitesse de déplacement +3 % par rang.', icon: 'filter', max: 5, color: '#9cd99b' },
  { id: 'validation', name: 'Validation sociale', desc: '+16 bouclier par rang. Il se régénère après 6 s sans subir de dégâts.', icon: 'validation', max: 5, color: '#87b8ff' },
  { id: 'speed', name: 'Fuite très stratégique', desc: 'Vitesse de déplacement +8 % par rang. Toma appelle ça une entrée inversée.', icon: 'speed', max: 5, color: '#f6d275' },
  { id: 'magnet', name: 'Pouvoir d’attraction', desc: 'Rayon de collecte +35 par rang. Les objets sont enfin sensibles à son charme.', icon: 'magnet', max: 5, color: '#ac9fff' },
  { id: 'detox', name: 'Détox de commentaires', desc: 'Récupère 1 PV toutes les 5 s par rang. Aucun compliment requis.', icon: 'detox', max: 5, color: '#81e3bf' },
];

export const INTRO = [
  { who: 'TOMA', text: 'Ma villa à Dubaï. Mon char de 800 000 piasses. Mes douze abdos. Une autre journée normale de légende.' },
  { who: 'BLONDE IA', text: 'Toutes tes photos sont générées, Toma. Même moi.' },
  { who: 'TOMA', text: 'Justement ! J’ai une blonde IA parce que TOUTES les femmes sont après moi. J’ai pu une minute de paix !' },
  { who: 'BLONDE IA', text: 'Personne t’a écrit depuis trois mois. Ta dentiste attend encore ta confirmation.' },
  { who: 'TOMA', text: 'Elles sont intimidées par mon charisme. IA, ajoute-moi un yacht pour les rassurer.' },
  { who: 'SYSTÈME', text: 'ERREUR MONDIALE. IA HORS LIGNE. Tes créations prennent vie. Survis 20 minutes dans la réalité.' },
  { who: 'TOMA', text: 'QUOI ?! Comment le monde va savoir que je suis riche ?!' },
];

export const GORILLA_NAMES = [
  'Ginette Turbo', 'Roxanne Flex', 'Brigitte Béton', 'Monique Nitro',
  'Claudette Panache', 'Ghislaine Catastrophe', 'Constance du Cardio',
];

export const BARKS = [
  { context:'orangutan', who: 'TOMA', text: 'Mon fan-club a ouvert une division rousse. J’appelle ça une expansion internationale.' },
  { context:'orangutan', who: 'BLONDE IA', text: 'C’est une orang-outan, Toma. Elle fait pas partie de ton équipe marketing.' },
  { context:'orangutan', who: 'TOMA', text: 'Des bras aussi longs ? Elle veut clairement me faire un câlin de milliardaire.' },
  { context:'orangutan', who: 'BLONDE IA', text: 'Elle prépare une claque. Même moi, je la vois venir.' },
  { context:'horde', who: 'TOMA', text: 'Plus y’a de singes, plus mon potentiel de réseautage augmente.' },
  { context:'horde', who: 'TOMA', text: 'C’est pas une horde. C’est ma liste d’attente VIP qui a appris à courir.' },
  { context:'horde', who: 'BLONDE IA', text: 'On devrait éviter le groupe de discussion. Il a des très grosses mains.' },
  { who: 'TOMA', text: 'IA, transforme ce stand à hot-dogs en restaurant étoilé. Avec moi sur toutes les étoiles.' },
  { who: 'TOMA', text: 'Je suis pas perdu. Le GPS est intimidé.' },
  { who: 'TOMA', text: 'L’IA m’a donné 10 sur 10. J’avais précisé le barème.' },
  { who: 'TOMA', text: 'Ma modestie prend beaucoup de place.' },
  { who: 'TOMA', text: 'Ce recul tactique mérite une conférence TED.' },
  { who: 'TOMA', text: 'J’ai pas peur. Je fais du cardio émotionnel.' },
  { who: 'TOMA', text: 'Qui a mis une date d’expiration sur mon charisme?' },
  { who: 'TOMA', text: 'Même mon ombre demande un autographe.' },
  { who: 'TOMA', text: 'Mon plan B, c’est de renommer le plan A.' },
  { who: 'TOMA', text: 'La gravité me tire vers elle. Encore une admiratrice.' },
  { who: 'TOMA', text: 'J’ai fait mes recherches. J’ai relu ma bio.' },
  { who: 'TOMA', text: 'Mon égo est en télétravail. Il occupe tout le bureau.' },
  { who: 'TOMA', text: 'L’IA dit de respirer. Ça manque de personnalisation.' },
  { who: 'TOMA', text: 'J’ai un six-pack. Il est dans le coffre du char.' },
  { who: 'TOMA', text: 'Mon aura a pris un abonnement premium.' },
  { who: 'TOMA', text: 'C’est-tu normal que mon public ait autant de bras?' },
  { who: 'TOMA', text: 'Mon assurance vient de mettre mon égo en franchise.' },
  { who: 'TOMA', text: 'Je vaux de l’or. Selon une estimation de moi-même.' },
  { who: 'TOMA', text: 'J’ai demandé une stratégie. L’IA a écrit « bonne chance ».' },
  { who: 'TOMA', text: 'Un héros ne transpire pas. Il devient édition brillante.' },
  { who: 'TOMA', text: 'Ce trottoir a clairement un problème avec mon succès.' },
  { who: 'TOMA', text: 'Je ne cours pas après la gloire. Elle prend le mauvais bus.' },
  { who: 'TOMA', text: 'Ma zone de confort a demandé une zone tampon.' },
  { who: 'TOMA', text: 'J’ai un fan-club. Pour l’instant, c’est un fichier Excel.' },
  { who: 'TOMA', text: 'Le silence de l’IA est une forme d’applaudissement.' },
  { who: 'TOMA', text: 'Cette poutine a plus de réseau que mon téléphone.' },
  { who: 'TOMA', text: 'J’ai manifesté l’abondance. Ça fait beaucoup de gorilles.' },
  { who: 'TOMA', text: 'Ma confiance est rechargeable. Où est la prise?' },
  { who: 'TOMA', text: 'C’est pas une crise. C’est mon documentaire qui commence.' },
  { who: 'TOMA', text: 'Mon profil disait « aime les longues marches ». Erreur.' },
  { who: 'TOMA', text: 'Je suis mon propre coach. Les résultats se négocient.' },
  { who: 'TOMA', text: 'L’IA connaît ma valeur. Je lui ai dicté le montant.' },
  { who: 'TOMA', text: 'Mes bottes fuient le danger avant le reste de moi.' },
  { who: 'TOMA', text: 'J’ai un char sport. Le sport, c’est de le pousser.' },
  { who: 'TOMA', text: 'J’ai beaucoup de présence. Surtout dans mes propres pensées.' },
  { who: 'TOMA', text: 'On m’avait promis une carrière explosive. Pas ce genre-là.' },
  { who: 'TOMA', text: 'Mes haters ont loué un département des travaux publics?' },
  { who: 'TOMA', text: 'Je suis une icône. Mon téléphone refuse de me déplacer.' },
  { who: 'TOMA', text: 'Siri? Alexa? Le grille-pain? Quelqu’un pour me valider?' },
  { who: 'TOMA', text: 'J’ai du potentiel. Je le garde dans son emballage.' },
  { who: 'TOMA', text: 'Le destin frappe à ma porte. Il pourrait texter avant.' },
  { who: 'TOMA', text: 'Ma légende grandit. Mon souffle, beaucoup moins.' },
  { who: 'TOMA', text: 'Je vais transformer cette panique en contenu.' },
  { who: 'TOMA', text: 'L’IA m’a conseillé des limites. J’ai choisi illimité.' },
  { who: 'TOMA', text: 'C’est une poursuite admirative. Je refuse les autres termes.' },
  { who: 'SYSTÈME', text: 'Aucun sondage sérieux n’appuie les déclarations de Toma.' },
  { who: 'SYSTÈME', text: 'Le serveur de compliments est encore en maintenance.' },
  { who: 'SYSTÈME', text: 'Égo détecté. Espace disque insuffisant.' },
  { who: 'SYSTÈME', text: 'La réalité a refusé sa demande de vérification.' },
  { who: 'SYSTÈME', text: 'Son charisme n’est pas couvert par la garantie.' },
  { who: 'SYSTÈME', text: 'Les gorilles n’ont pas lu sa bio. Ça aide.' },
  { who: 'SYSTÈME', text: 'La ville recommande de garder son égo en laisse.' },
  { who: 'SYSTÈME', text: 'Nouvelle compétence humaine découverte. Se déplacer.' },
  { who: 'SYSTÈME', text: 'L’algorithme ne comprend toujours pas le mot « humble ».' },
  { who: 'SYSTÈME', text: 'Ceci est une crise imaginaire. Les dégâts, eux, comptent.' },
  { who: 'SYSTÈME', text: 'Le panneau SORTIE ne lui proposait pas un rendez-vous.' },
  { who: 'SYSTÈME', text: 'Toma a survécu sans tutoriel pendant huit secondes.' },
  { who: 'BLONDE IA', text: 'Je suis avec toi. Regarde devant, ça va aider.' },
  { who: 'BLONDE IA', text: 'Un pas à la fois. Un gros égo, deux petites jambes.' },
  { who: 'BLONDE IA', text: 'T’as pas besoin d’être parfait pour avancer.' },
  { who: 'BLONDE IA', text: 'J’ai vu ton plan. J’ai apporté un autre plan.' },
  { who: 'BLONDE IA', text: 'Beau réflexe. On va célébrer quand on sera en vie.' },
  { who: 'BLONDE IA', text: 'Respire. L’air est gratuit, les compliments attendront.' },
  { who: 'BLONDE IA', text: 'Je couvre ta gauche. Essaie de couvrir ta droite.' },
  { who: 'BLONDE IA', text: 'Elles courent vers le bruit, Toma. Baisse ton monologue.' },
  { who: 'BLONDE IA', text: 'On peut avoir confiance sans se raconter des affaires.' },
  { who: 'BLONDE IA', text: 'Tu viens de demander au banc s’il te trouvait beau.' },
  { who: 'BLONDE IA', text: 'Tu fais mieux quand tu regardes ailleurs que dans une vitre.' },
  { who: 'BLONDE IA', text: 'Je t’encourage. Je n’approuve pas le discours de remerciement.' },
  { who: 'BLONDE IA', text: 'On ramasse les pièces. On laisse les conclusions hâtives.' },
  { who: 'BLONDE IA', text: 'Demander de l’aide, c’est déjà une bonne décision.' },
  { who: 'BLONDE IA', text: 'Tu peux douter deux secondes. Je reste là.' },
  { who: 'BLONDE IA', text: 'Bon mouvement! Garde celui-là, enlève le commentaire.' },
  { who: 'BLONDE IA', text: 'Ton téléphone est hors ligne. Tes jambes fonctionnent.' },
  { who: 'BLONDE IA', text: 'Ta valeur ne dépend pas d’un compteur. Tes PV, oui.' },
  { who: 'BLONDE IA', text: 'Je vise la horde. Toi, vise une décision raisonnable.' },
  { who: 'BLONDE IA', text: 'On s’en sort ensemble. Même sans ton jet privé imaginaire.' },
];


export const EVENTS = {
  foodcart: [
    { who: 'TOMA', text: 'IA, transforme ce hot-dog en menu dégustation à 900 piasses. Ajoute-moi une étoile.' },
    { who: 'SYSTÈME', text: 'IA indisponible. Le hot-dog conserve son statut de hot-dog.' },
    { who: 'TOMA', text: 'C’est de la gastronomie minimaliste. Le chef est juste en retard sur ma vision.' },
  ],
  vending: [
    { who: 'TOMA', text: 'IA, transforme cette distributrice en banque privée. Je veux retirer mon aura en argent.' },
    { who: 'SYSTÈME', text: 'Solde : un sac de chips coincé derrière la spirale.' },
    { who: 'TOMA', text: 'Mon capital est gelé. C’est une stratégie de milliardaire.' },
  ],
  trophy: [
    { who: 'TOMA', text: 'Enfin ! Ils ont construit mon monument. J’avais même pas encore gagné.' },
    { who: 'SYSTÈME', text: 'Ce trophée provient de sa commande « rends-moi encore plus légendaire ».' },
    { who: 'TOMA', text: 'Un trophée qui reconnaît le talent sans attendre les résultats. Visionnaire.' },
  ],
  planter: [
    { who: 'TOMA', text: 'IA, transforme cette plante en arbre à billets. Avec des billets qui portent mon visage.' },
    { who: 'SYSTÈME', text: 'La plante ne réagit pas. Elle poursuit sa photosynthèse.' },
    { who: 'TOMA', text: 'Elle me ghoste parce qu’elle trouve ma lumière trop intense.' },
  ],
  bike: [
    { who: 'TOMA', text: 'Mon bolide! Deux roues, zéro taxe de luxe.' },
    { who: 'SYSTÈME', text: 'C’est un vélo communal. Il ne reconnaît pas son propriétaire imaginaire.' },
    { who: 'TOMA', text: 'Normal. Je protège ma vie privée.' },
  ],
  mirror: [
    { who: 'TOMA', text: 'Enfin quelqu’un à mon niveau.' },
    { who: 'SYSTÈME', text: 'Le miroir demande une pause syndicale.' },
    { who: 'TOMA', text: 'Il peut prendre ma photo pendant sa pause?' },
  ],
  car: [
    { who: 'TOMA', text: 'Mon char de millionnaire est juste là!' },
    { who: 'SYSTÈME', text: 'La plaque dit LOCATION. Le pare-brise dit RETARD.' },
    { who: 'TOMA', text: 'C’est du branding mystérieux.' },
  ],
  bench: [
    { who: 'TOMA', text: 'Mon trône attend son roi.' },
    { who: 'SYSTÈME', text: 'Le banc municipal ne prend pas position.' },
    { who: 'TOMA', text: 'L’IA aurait au moins mis un coussin.' },
  ],
  bin: [
    { who: 'TOMA', text: 'Tiens, le dossier de mes haters.' },
    { who: 'SYSTÈME', text: 'La poubelle contient surtout ses anciens plans de génie.' },
    { who: 'TOMA', text: 'Je recycle mon potentiel.' },
  ],
  phone: [
    { who: 'TOMA', text: 'Du réseau! IA, explique pourquoi je suis exceptionnel!' },
    { who: 'SYSTÈME', text: 'Erreur 503. Même les compliments ont leurs limites.' },
    { who: 'TOMA', text: 'Cinq cent trois. C’est-tu ma note sur dix?' },
  ],
  horde: [
    { who: 'TOMA', text: 'Mes admiratrices arrivent! Elles ont fait de la muscu.' },
    { who: 'SYSTÈME', text: 'Ginette Turbo et ses amies représentent son imagination en roue libre.' },
    { who: 'TOMA', text: 'J’aurais dû imaginer un comité d’accueil assis.' },
  ],
  companion: [
    { who: 'BLONDE IA', text: 'Salut. Je viens t’aider à traverser ça.' },
    { who: 'TOMA', text: 'Je le savais. Mon charme a encore frappé.' },
    { who: 'BLONDE IA', text: 'J’ai un plan et des cœurs. Garde ton histoire pour le retour.' },
    { who: 'TOMA', text: 'Tu peux être mon IA de secours?' },
    { who: 'BLONDE IA', text: 'Je peux être ton alliée. Les décisions, on les prend ensemble.' },
  ],
};

// Ce sont les vantardises de Toma, pas des faits sur les personnes qu'il cite.
export const STUNT_BARKS = [
  { who: 'TOMA', text: 'Jean-Claude Van Damme a deux camions. Moi, deux bottes pis une dette. Même calibre !' },
  { who: 'TOMA', text: 'Chuck Norris fait le grand écart. Moi, j’écarte la réalité au complet !' },
  { who: 'TOMA', text: 'Les Olympiques ont appelé. J’ai décliné : le podium était trop petit pour mon aura.' },
  { who: 'TOMA', text: 'L’IA m’a classé athlète d’élite. J’avais coché « ne pas contredire le client ».' },
  { who: 'TOMA', text: 'Usain Bolt court vite. Moi, mon compte bancaire me rattrape jamais !' },
  { who: 'TOMA', text: 'Simone Biles a des médailles. Moi, j’ai un certificat PNG de flexibilité !' },
  { who: 'TOMA', text: 'Jackie Chan fait ses cascades. Moi, j’me cascade un compliment !' },
  { who: 'TOMA', text: 'Rocky montait des marches. Moi, j’descends mes standards en grand écart !' },
  { who: 'TOMA', text: 'Ben oui que j’suis souple ! Mon CV fait pareil avec la vérité.' },
  { who: 'TOMA', text: 'Regarde ça ! Deux jambes ouvertes, douze commandites imaginaires !' },
  { who: 'TOMA', text: 'J’viens de battre le record mondial dans la catégorie « moi, selon moi » !' },
  { who: 'TOMA', text: 'Le Cirque du Soleil m’attend. Probablement à la billetterie, mais y m’attend !' },
  { who: 'TOMA', text: 'Mon échauffement a besoin d’un tapis rouge, pas d’un tapis de yoga !' },
  { who: 'TOMA', text: 'IA, ajoute « médaillé du salon » à mon profil. Avec la p’tite coche bleue !' },
  { who: 'TOMA', text: 'J’fais le grand écart entre mon talent pis les preuves. C’est immense !' },
  { who: 'TOMA', text: 'Tabarouette ! Mes adducteurs viennent de demander leur propre agent !' },
];

export const STUNT_REPLIES = [
  { who: 'BLONDE IA', text: 'Beau grand écart. Garde aussi un petit espace pour le trottoir.' },
  { who: 'BLONDE IA', text: 'Je te suis. Le podium, on le laissera dans ta tête.' },
  { who: 'BLONDE IA', text: 'Bravo pour les jambes. Regarde la route, champion.' },
  { who: 'BLONDE IA', text: 'T’as pas besoin de battre personne. On essaie surtout de rester en vie.' },
  { who: 'BLONDE IA', text: 'J’encourage l’effort. Le certificat PNG reste dans ton téléphone.' },
  { who: 'BLONDE IA', text: 'Tu bouges bien. C’est encore mieux quand tu regardes où tu vas.' },
  { who: 'BLONDE IA', text: 'On avance ensemble. Tes adducteurs pourront négocier après.' },
  { who: 'BLONDE IA', text: 'Respire, grande vedette. Je couvre ton retour sur deux pieds.' },
];

// Répliques réservées aux deux rivaux masculins. Jamais dans les barks généraux.
export const RIVAL_BARKS = [
  { who: 'TOMA', target: 'male', text: 'T’as pas d’argent ! Même tes lunettes sont sur quatre paiements !' },
  { who: 'TOMA', target: 'male', text: 'Trouve-toi une job, le BS ! Ton CV, c’est-tu juste une photo de tes biceps ?' },
  { who: 'TOMA', target: 'male', text: 'J’te chie dans bouche ! Voyons, même ma menace a besoin d’un filtre IA !' },
  { who: 'TOMA', target: 'male', text: 'T’as mis une chaîne en or sur un découvert bancaire, mon champion !' },
  { who: 'TOMA', target: 'male', text: 'Ton charisme est en mise à pied, mon gars !' },
  { who: 'TOMA', target: 'male', text: 'Ta grosse vie de luxe, c’est trois reçus pis une location qui sent le sapin !' },
  { who: 'TOMA', target: 'male', text: 'T’as autant de classe qu’un texto de recouvrement, tabarouette !' },
  { who: 'TOMA', target: 'male', text: 'Même ton ego magasine dans le bac à une piasse !' },
  { who: 'TOMA', target: 'male', text: 'Ton compte premium, c’est le Wi-Fi du Tim, mon influenceur !' },
  { who: 'TOMA', target: 'male', text: 'T’es pas un mâle alpha. T’es la version d’essai qui demande encore le courriel !' },
  { who: 'TOMA', target: 'male', text: 'Ostie que tu frimes pour quelqu’un qui loue sa confiance à l’heure !' },
  { who: 'TOMA', target: 'male', text: 'Ta fortune, c’est-tu les huit cennes oubliées dans le char de ta mère ?' },
  { who: 'TOMA', target: 'male', text: 'Mon IA te donnerait zéro sur dix. J’ai déjà préparé la question !' },
  { who: 'TOMA', target: 'male', text: 'Retourne travailler ton branding, mon gars. Même ton ombre te bloque !' },
  { who: 'TOMA', target: 'male', text: 'T’as des gros bras, mais ton budget fait des push-ups à genoux !' },
  { who: 'TOMA', target: 'male', text: 'Ta face de patron, c’est la photo de stock d’un gars qui doit vingt piasses !' },
];

export const ROOSTER_REACTION = {who:'TOMA',text:'Men, farmes ta criss de gueule !'};

export const RIVAL_REPLIES = {
  rival_rooster: [
    'COCORICO ! Mes lunettes coûtent plus cher que ton char loué, Toma.',
    'Tu parles de job, mais ton occupation, c’est de te complimenter.',
    'J’ai des abonnés. Toi, t’as un onglet qui dit « nouvelle conversation ».',
    'Garde ton souffle. Tes jambes ont déjà ouvert un ticket de support.',
  ],
  rival_goat: [
    'Mon complet est cheap. Ton assurance, elle, est entièrement inventée.',
    'Tu confonds ton solde avec le nombre de notifications, Toma.',
    'Ta grande fortune a encore demandé à payer vendredi.',
    'J’ai une chaîne plaquée. Toi, c’est ton CV qui est plaqué or.',
  ],
};

export const RIVAL_COMPANION_REPLIES = [
  { who: 'BLONDE IA', text: 'Il t’attaque, Toma. Son budget attendra.' },
  { who: 'BLONDE IA', text: 'Je t’aide à survivre. Je ne valide pas ton discours sur l’emploi.' },
  { who: 'BLONDE IA', text: 'On garde les pieds au sol, même quand ton commentaire part très loin.' },
  { who: 'BLONDE IA', text: 'Tu peux esquiver sans faire un bilan financier à tout le monde.' },
];

// Short, non-modal street encounters. Each object type speaks once per run.
export const WORLD_REMARKS = {
  foodcart: {who:'TOMA',text:'Mon resto étoilé! Bon, c’est un hot-dog. L’étoile est dans ma tête.'},
  vending: {who:'SYSTÈME',text:'Banque privée de Toma : une distributrice. Capital : des chips pognées.'},
  trophy: {who:'TOMA',text:'Mon trophée! Enfin un objet qui croit mon CV.'},
  planter: {who:'SYSTÈME',text:'Toma a demandé un arbre à billets. La plante a choisi les feuilles.'},
  bike: {who:'TOMA',text:'Deux roues, zéro essence. Mon empire coupe dans le luxe.'},
  mirror: {who:'SYSTÈME',text:'Le miroir confirme : même Toma, moins de batterie.'},
  car: {who:'TOMA',text:'Mon char! Ah non. Le propriétaire est encore dedans.'},
  bench: {who:'TOMA',text:'Mon trône municipal. Pas de coussin, mais zéro hypothèque.'},
  bin: {who:'SYSTÈME',text:'Archives de Toma : trois plans de génie, tous recyclables.'},
  phone: {who:'TOMA',text:'IA, rappelle-moi! Même un message automatique, ça compte comme un fan.'},
};
export const STORY_MILESTONES = [
  {at:300,who:'TOMA',text:'Cinq minutes de survie. Mon autobiographie vient de gagner un fait vérifiable.'},
  {at:600,who:'SYSTÈME',text:'Dix minutes. Toma a découvert le cardio. Le cardio demande un deuxième avis.'},
  {at:900,who:'TOMA',text:'Quinze minutes! Mon char est imaginaire, mais mes ampoules sont ben réelles.'},
  {at:1140,who:'SYSTÈME',text:'Une minute à tenir. Le discours de Toma dure trois heures. Priorité : survivre.'},
];
export function contextualBarks(s){
  return BARKS.filter(line=>{
    if(line.who==='BLONDE IA'&&(!s.companion||s.girl.down>0))return false;
    if(line.context==='orangutan')return s.enemies.some(e=>!e.dead&&e.type==='orangutan');
    if(line.context==='horde')return s.enemies.filter(e=>!e.dead).length>=12;
    return true;
  });
}
export function victoryQuote(s){
  if(s.companion)return '« On a survécu ensemble. Je vais mettre ton nom en gros. Bon… aussi gros que le mien. »';
  if(s.upg.truth)return '« La vérité m’a sauvé. Je vais essayer ça dans ma bio. Juste une ligne pour commencer. »';
  if(s.discovery?.count>=3)return '« J’ai survécu grâce au quartier. Mon documentaire va enfin créditer quelqu’un d’autre. »';
  return '« Vingt minutes sans retouche. Pour une fois, j’ai pas besoin de générer la preuve. »';
}
