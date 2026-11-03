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
  {
    "who": "TOMA",
    "text": "Check le char. Huit cent mille piasses, mes abdos sont sortis, pis y'a même pas une criss de feuille dans ma piscine à Dubaï."
  },
  {
    "who": "BLONDE IA",
    "text": "T'as demandé de retirer les feuilles de la photo. La piscine aussi est générée."
  },
  {
    "who": "TOMA",
    "text": "YEAHHHHHH ! Rajoute un hélicoptère. Les filles vont capoter."
  },
  {
    "who": "BLONDE IA",
    "text": "Ta dentiste t'a écrit. Elle veut savoir si tu viens jeudi."
  },
  {
    "who": "TOMA",
    "text": "Encore elle ! Dis-lui de prendre un numéro, j'ai une vie à vivre."
  },
  {
    "who": "SYSTÈME",
    "text": "PANNE MONDIALE. IA hors ligne. Tes créations se promènent en ville. Survis 20 minutes."
  },
  {
    "who": "TOMA",
    "text": "Hein ?! Rallume ça, tabarnak ! Mon char est encore en train de charger !"
  }
];

export const GORILLA_NAMES = [
  'Ginette Turbo', 'Roxanne Flex', 'Brigitte Béton', 'Monique Nitro',
  'Claudette Panache', 'Ghislaine Catastrophe', 'Constance du Cardio',
];

export const BARKS = [
  {
    "context": "orangutan",
    "who": "TOMA",
    "text": "Check les bras ! Elle peut liker mes photos dans deux quartiers en même temps !"
  },
  {
    "context": "orangutan",
    "who": "BLONDE IA",
    "text": "Toma, tasse-toi. L'orang-outan prépare sa claque."
  },
  {
    "context": "orangutan",
    "who": "TOMA",
    "text": "Wo, doucement ! Mon visage est assuré pour un montant que j'ai choisi moi-même !"
  },
  {
    "context": "orangutan",
    "who": "BLONDE IA",
    "text": "Elle s'en va te plier. Cours."
  },
  {
    "context": "horde",
    "who": "TOMA",
    "text": "YEAHHHHHH ! Ça, c'est du monde à mon lancement !"
  },
  {
    "context": "horde",
    "who": "TOMA",
    "text": "Y'a-tu quelqu'un qui gère la file, tabarnak ?!"
  },
  {
    "context": "horde",
    "who": "BLONDE IA",
    "text": "Passe par le côté. Le milieu est plein de poings."
  },
  {
    "who": "TOMA",
    "text": "IA, mets une nappe sur le stand à hot-dogs. J'vas manger riche."
  },
  {
    "who": "TOMA",
    "text": "Où c'est qu'il est, mon criss de char ?"
  },
  {
    "who": "TOMA",
    "text": "Dix sur dix. J'ai demandé à l'IA de vérifier deux fois."
  },
  {
    "who": "TOMA",
    "text": "Pousse-toi, la vedette passe !"
  },
  {
    "who": "TOMA",
    "text": "Filme-moi de côté, on voit mieux mes abdos."
  },
  {
    "who": "TOMA",
    "text": "FUCKK ! J'avais pas signé pour courir autant !"
  },
  {
    "who": "TOMA",
    "text": "Mon parfum coûte plus cher que cette rue-là !"
  },
  {
    "who": "TOMA",
    "text": "Même mon ombre me suit partout. Décroche un peu !"
  },
  {
    "who": "TOMA",
    "text": "Bon. Qui a encore changé mon plan sans me consulter ?"
  },
  {
    "who": "TOMA",
    "text": "Le trottoir m'a fait une jambette. J'ai des témoins !"
  },
  {
    "who": "TOMA",
    "text": "Va lire ma bio si tu me crois pas."
  },
  {
    "who": "TOMA",
    "text": "J'ai besoin d'un bureau avec deux chaises. Une pour moi pis une pour mon trophée."
  },
  {
    "who": "TOMA",
    "text": "IA ? Réponds, câlisse !"
  },
  {
    "who": "TOMA",
    "text": "Mes abdos sont là. En dessous."
  },
  {
    "who": "TOMA",
    "text": "Je brille-tu encore ? Check vite."
  },
  {
    "who": "TOMA",
    "text": "Pourquoi tout le monde court après moi avec les mains ouvertes ?"
  },
  {
    "who": "TOMA",
    "text": "Ça se réclame-tu aux assurances, une réputation ?"
  },
  {
    "who": "TOMA",
    "text": "Cent mille piasses pour une photo avec moi. Cash."
  },
  {
    "who": "TOMA",
    "text": "Mon plan disait juste de rester beau. C'était clair pourtant."
  },
  {
    "who": "TOMA",
    "text": "Touche pas à mes cheveux !"
  },
  {
    "who": "TOMA",
    "text": "Ils pourraient laver leurs trottoirs avant que j'arrive."
  },
  {
    "who": "TOMA",
    "text": "Mon chauffeur est où ?! J'vas lui mettre une étoile !"
  },
  {
    "who": "TOMA",
    "text": "J'aurais dû rester dans ma piscine générée."
  },
  {
    "who": "TOMA",
    "text": "J'ai une liste de fans. Ma mère est inscrite deux fois."
  },
  {
    "who": "TOMA",
    "text": "Elle répond pu. Elle doit être émue."
  },
  {
    "who": "TOMA",
    "text": "Une poutine pis un chargeur. C'est tout c'que j'demande."
  },
  {
    "who": "TOMA",
    "text": "IA, quand j'ai dit plein de filles, fallait me poser des questions !"
  },
  {
    "who": "TOMA",
    "text": "Donnez-moi deux secondes. J'ai un point dans le côté."
  },
  {
    "who": "TOMA",
    "text": "Le documentaire, filme pas ce bout-là !"
  },
  {
    "who": "TOMA",
    "text": "Des longues marches ? Qui a écrit ça sur mon profil ?!"
  },
  {
    "who": "TOMA",
    "text": "Mon coach, c'est moi. Pis là j'me donne une pause."
  },
  {
    "who": "TOMA",
    "text": "Je lui ai dit milliardaire. Elle m'a mis millionnaire, l'ostie."
  },
  {
    "who": "TOMA",
    "text": "Mes bottes valent trois loyers !"
  },
  {
    "who": "TOMA",
    "text": "Le char est à moi. La compagnie de location comprend pas le concept."
  },
  {
    "who": "TOMA",
    "text": "Avez-vous remarqué que j'suis encore le plus beau ici ?"
  },
  {
    "who": "TOMA",
    "text": "Ça pète de partout, criss !"
  },
  {
    "who": "TOMA",
    "text": "C'est qui qui a commandé tout ce monde-là ?"
  },
  {
    "who": "TOMA",
    "text": "J'ai une coche bleue. Vous pouvez pas me traiter de même !"
  },
  {
    "who": "TOMA",
    "text": "Même le grille-pain me répond pu."
  },
  {
    "who": "TOMA",
    "text": "J'pourrais gagner là. J'étire le suspense."
  },
  {
    "who": "TOMA",
    "text": "Cogne pas, texte-moi. J'suis occupé à être célèbre."
  },
  {
    "who": "TOMA",
    "text": "Attends... attends... j'reprends mon souffle."
  },
  {
    "who": "TOMA",
    "text": "Filme ça ! Non, efface. Recommence."
  },
  {
    "who": "TOMA",
    "text": "IA, enlève la sueur. Toute."
  },
  {
    "who": "TOMA",
    "text": "Mes fans sont intenses en tabarnak."
  },
  {
    "who": "SYSTÈME",
    "text": "Toma s'est donné cinq étoiles avec le compte de sa mère."
  },
  {
    "who": "SYSTÈME",
    "text": "Compliments indisponibles. Il va falloir marcher sans."
  },
  {
    "who": "SYSTÈME",
    "text": "Mémoire pleine. 4 812 selfies à supprimer."
  },
  {
    "who": "SYSTÈME",
    "text": "Sa demande de vérification est encore dans les brouillons."
  },
  {
    "who": "SYSTÈME",
    "text": "La garantie couvre le téléphone. Toma devra se gérer lui-même."
  },
  {
    "who": "SYSTÈME",
    "text": "Aucun gorille ne suit Toma sur les réseaux."
  },
  {
    "who": "SYSTÈME",
    "text": "La ville cherche le propriétaire d'un ego stationné en double."
  },
  {
    "who": "SYSTÈME",
    "text": "Toma vient de courir sans publier sa distance."
  },
  {
    "who": "SYSTÈME",
    "text": "Le mot humble a été retiré de sa bio à sa demande."
  },
  {
    "who": "SYSTÈME",
    "text": "Les dégâts restent actifs pendant ses explications."
  },
  {
    "who": "SYSTÈME",
    "text": "Il a fait un clin d'oeil au panneau SORTIE."
  },
  {
    "who": "SYSTÈME",
    "text": "Huit secondes sans demander un compliment. Record battu."
  },
  {
    "who": "BLONDE IA",
    "text": "J'suis là. Regarde la rue."
  },
  {
    "who": "BLONDE IA",
    "text": "T'as deux jambes, sers-t'en !"
  },
  {
    "who": "BLONDE IA",
    "text": "Laisse tes cheveux tranquilles, y'a du monde derrière."
  },
  {
    "who": "BLONDE IA",
    "text": "Ton plan finit par un selfie. On va improviser."
  },
  {
    "who": "BLONDE IA",
    "text": "Beau réflexe ! Continue !"
  },
  {
    "who": "BLONDE IA",
    "text": "Respire par le nez. Oui, même ton nez de vedette."
  },
  {
    "who": "BLONDE IA",
    "text": "Je prends la gauche. Bouge à droite."
  },
  {
    "who": "BLONDE IA",
    "text": "Ils suivent ta voix. Tu veux-tu essayer de te taire ?"
  },
  {
    "who": "BLONDE IA",
    "text": "T'as rien à prouver au parcomètre."
  },
  {
    "who": "BLONDE IA",
    "text": "Le banc te trouve beau. Avance, là."
  },
  {
    "who": "BLONDE IA",
    "text": "La vitrine sera encore là tantôt."
  },
  {
    "who": "BLONDE IA",
    "text": "Garde ton discours. J'ai besoin de tes jambes."
  },
  {
    "who": "BLONDE IA",
    "text": "Les pièces, Toma ! Ramasse les pièces !"
  },
  {
    "who": "BLONDE IA",
    "text": "Viens par ici, j'te couvre."
  },
  {
    "who": "BLONDE IA",
    "text": "Deux secondes de panique, c'est assez. On repart."
  },
  {
    "who": "BLONDE IA",
    "text": "Oui ! Refais ça !"
  },
  {
    "who": "BLONDE IA",
    "text": "Lâche ton téléphone. Ça pogne pas."
  },
  {
    "who": "BLONDE IA",
    "text": "Tes PV baissent. Fais ton beau plus loin."
  },
  {
    "who": "BLONDE IA",
    "text": "Je tire. Toi, passe entre les deux."
  },
  {
    "who": "BLONDE IA",
    "text": "Ton jet viendra nous chercher après. Cours !"
  }
];


export const EVENTS = {
  "foodcart": [
    {
      "who": "TOMA",
      "text": "IA, mets-moi une assiette en or avec ça. Pis cache la moutarde sur mon chandail."
    },
    {
      "who": "SYSTÈME",
      "text": "IA hors ligne. Supplément moutarde : 50 cents."
    },
    {
      "who": "TOMA",
      "text": "Cinquante cennes ? Sais-tu à qui tu parles ?!"
    }
  ],
  "vending": [
    {
      "who": "TOMA",
      "text": "Ouvre-toi, criss. J'ai une carte VIP."
    },
    {
      "who": "SYSTÈME",
      "text": "Les chips sont coincées."
    },
    {
      "who": "TOMA",
      "text": "J'vas acheter la compagnie. Après, tu vas voir."
    }
  ],
  "trophy": [
    {
      "who": "TOMA",
      "text": "YEAHHHHHH ! Mon trophée ! Ils ont enfin compris !"
    },
    {
      "who": "SYSTÈME",
      "text": "Commande retrouvée : un trophée plus grand que celui du voisin."
    },
    {
      "who": "TOMA",
      "text": "Il l'a-tu vu ? Tourne-le vers sa fenêtre."
    }
  ],
  "planter": [
    {
      "who": "TOMA",
      "text": "IA, fais pousser des cent piasses là-dedans."
    },
    {
      "who": "SYSTÈME",
      "text": "Aucune connexion. La plante garde ses feuilles."
    },
    {
      "who": "TOMA",
      "text": "Arrose-la avec du champagne. Ça va la motiver."
    }
  ],
  "bike": [
    {
      "who": "TOMA",
      "text": "Check mon nouveau bolide ! Édition européenne !"
    },
    {
      "who": "SYSTÈME",
      "text": "Vélo communal. Selle manquante."
    },
    {
      "who": "TOMA",
      "text": "J'conduis debout. C'est sportif."
    }
  ],
  "mirror": [
    {
      "who": "TOMA",
      "text": "Wo. Check le beau gars."
    },
    {
      "who": "SYSTÈME",
      "text": "Batterie du téléphone : 2 %."
    },
    {
      "who": "TOMA",
      "text": "Vite, prends-en douze !"
    }
  ],
  "car": [
    {
      "who": "TOMA",
      "text": "C'est mon char ! Touche pas !"
    },
    {
      "who": "SYSTÈME",
      "text": "Le contrat de location a expiré mardi."
    },
    {
      "who": "TOMA",
      "text": "J'avais dit que j'allais le rapporter. Ils sont fatigants."
    }
  ],
  "bench": [
    {
      "who": "TOMA",
      "text": "Réservez-moi ce banc. Au complet."
    },
    {
      "who": "SYSTÈME",
      "text": "Un pigeon occupe déjà la place."
    },
    {
      "who": "TOMA",
      "text": "Il paie-tu, lui ?!"
    }
  ],
  "bin": [
    {
      "who": "TOMA",
      "text": "Mets mes commentaires négatifs là-dedans."
    },
    {
      "who": "SYSTÈME",
      "text": "La poubelle est pleine de factures au nom de Toma."
    },
    {
      "who": "TOMA",
      "text": "Ça, c'est confidentiel, tabarnak !"
    }
  ],
  "phone": [
    {
      "who": "TOMA",
      "text": "Du réseau ! IA, vite, dis que j'suis beau !"
    },
    {
      "who": "SYSTÈME",
      "text": "Erreur 503."
    },
    {
      "who": "TOMA",
      "text": "Cinq cent trois sur dix ? YEAHHHHHH !"
    }
  ],
  "horde": [
    {
      "who": "TOMA",
      "text": "Les filles arrivent ! Attendez, j'arrange mes cheveux !"
    },
    {
      "who": "SYSTÈME",
      "text": "Ginette Turbo prépare un coup de poing."
    },
    {
      "who": "TOMA",
      "text": "Wo ! Les autographes après !"
    }
  ],
  "companion": [
    {
      "who": "BLONDE IA",
      "text": "Toma ! Par ici !"
    },
    {
      "who": "TOMA",
      "text": "Ah ! Ma blonde ! T'es venue m'admirer ?"
    },
    {
      "who": "BLONDE IA",
      "text": "J'suis venue tirer. Tasse-toi un peu."
    },
    {
      "who": "TOMA",
      "text": "Prends mon bon côté si tu filmes."
    },
    {
      "who": "BLONDE IA",
      "text": "J'ai les deux mains prises à te sauver."
    }
  ]
};

// Ce sont les vantardises de Toma, pas des faits sur les personnes qu'il cite.
export const STUNT_BARKS = [
  {
    "who": "TOMA",
    "text": "YEAHHHHHH ! Van Damme, check ça ! J'ai même pas enlevé mes jeans !"
  },
  {
    "who": "TOMA",
    "text": "Chuck Norris peut aller se rhabiller ! Moi aussi, d'ailleurs, ça vient de craquer."
  },
  {
    "who": "TOMA",
    "text": "Mets-moi sur le podium ! En haut !"
  },
  {
    "who": "TOMA",
    "text": "IA, filme mes jambes ! Les deux, câlisse !"
  },
  {
    "who": "TOMA",
    "text": "Usain Bolt m'aurait jamais rattrapé avec mes souliers !"
  },
  {
    "who": "TOMA",
    "text": "Simone Biles, prends des notes ! Bon, filme pas l'atterrissage."
  },
  {
    "who": "TOMA",
    "text": "Jackie Chan fait-tu ça dans des bottes de même ?!"
  },
  {
    "who": "TOMA",
    "text": "Rocky avait des marches. Moi j'ai un criss de trottoir !"
  },
  {
    "who": "TOMA",
    "text": "Aïe ! C'était mon pantalon ou ma hanche ?"
  },
  {
    "who": "TOMA",
    "text": "Photographe ! C'est là qu'y faut cliquer !"
  },
  {
    "who": "TOMA",
    "text": "Record mondial ! Quelqu'un l'a vu ? Quelqu'un ?!"
  },
  {
    "who": "TOMA",
    "text": "Le Cirque du Soleil peut m'appeler. J'charge à la jambe."
  },
  {
    "who": "TOMA",
    "text": "Tasse le tapis de yoga, j'ai besoin du stationnement !"
  },
  {
    "who": "TOMA",
    "text": "Rajoute une médaille sur ma photo. Une grosse."
  },
  {
    "who": "TOMA",
    "text": "Regarde mes jambes, tabarnak ! Ça mérite une commandite !"
  },
  {
    "who": "TOMA",
    "text": "FUCKK YEAHHHHHH ! ... Ouch."
  }
];

export const STUNT_REPLIES = [
  {
    "who": "BLONDE IA",
    "text": "Ton pantalon a tenu. Belle surprise."
  },
  {
    "who": "BLONDE IA",
    "text": "C'était beau. Le poteau, maintenant."
  },
  {
    "who": "BLONDE IA",
    "text": "Champion, regarde en avant !"
  },
  {
    "who": "BLONDE IA",
    "text": "Tu peux fermer les jambes, y'a du trafic."
  },
  {
    "who": "BLONDE IA",
    "text": "La médaille attendra. Relève-toi."
  },
  {
    "who": "BLONDE IA",
    "text": "J'ai vu ! Pas besoin de recommencer pour moi."
  },
  {
    "who": "BLONDE IA",
    "text": "Garde du jus pour courir."
  },
  {
    "who": "BLONDE IA",
    "text": "Je couvre. Reviens sur tes pieds."
  }
];

// Répliques réservées aux deux rivaux masculins. Jamais dans les barks généraux.
export const RIVAL_BARKS = [
  {
    "who": "TOMA",
    "target": "male",
    "text": "T'as pas d'argent ! Tes lunettes sont encore sur quatre paiements !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Trouve-toi une job, le BS !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "J'te chie dans bouche ! Viens pas plus proche, par exemple !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Ta chaîne verdit, mon gars. J'la vois d'ici !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Ta yeule ! C'est moi qu'on filme !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Ton char de luxe a encore le collant de location !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Tu m'dois vingt piasses, tabarnak !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "T'as pris ton ego dans le bac à une piasse ?"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Influenceur de Wi-Fi gratuit !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Le mâle alpha a oublié son mot de passe !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Ostie que tu frimes ! Bouge, j'prends une photo."
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Va compter le change dans ton porte-gobelet !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Mon IA t'a donné zéro. J'ai gardé la capture !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Même ton ombre veut pu t'suivre !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Des gros bras de même pour porter un portefeuille vide !"
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Ta photo de patron, je l'ai vue dans une pub de matelas !"
  }
];

export const ROOSTER_REACTION = {who:'TOMA',text:'Men, farmes ta criss de gueule !'};

export const RIVAL_REPLIES = {
  "rival_rooster": [
    "COCORICO ! Ramène ton char avant qu'ils appellent la remorqueuse !",
    "Ta job, c'est de te liker avec ton deuxième compte ?",
    "Tes abonnés ont tous la même photo, Toma.",
    "Garde ton souffle. Tu siffles quand tu cours."
  ],
  "rival_goat": [
    "J'ai payé mon complet. Essaie ça une fois.",
    "T'as compté tes notifications dans ton solde, encore ?",
    "Ta carte a refusé un café, Toma.",
    "Ton yacht a le même numéro que la photo de stock."
  ]
};

export const RIVAL_COMPANION_REPLIES = [
  {
    "who": "BLONDE IA",
    "text": "Il charge, Toma ! Tasse-toi !"
  },
  {
    "who": "BLONDE IA",
    "text": "Son CV attendra. Regarde ses cornes."
  },
  {
    "who": "BLONDE IA",
    "text": "Tu peux l'insulter en courant ?"
  },
  {
    "who": "BLONDE IA",
    "text": "Il s'en vient. Ferme ton enquête sur ses finances."
  }
];

// Short, non-modal street encounters. Each object type speaks once per run.
export const WORLD_REMARKS = {
  "foodcart": {
    "who": "TOMA",
    "text": "Un hot-dog ? Mets ça à mon compte VIP."
  },
  "vending": {
    "who": "SYSTÈME",
    "text": "Chips coincées. La banque privée de Toma ouvre pas aujourd'hui."
  },
  "trophy": {
    "who": "TOMA",
    "text": "Mon trophée ! Mettez une lumière dessus !"
  },
  "planter": {
    "who": "SYSTÈME",
    "text": "La plante attend encore le virement promis par Toma."
  },
  "bike": {
    "who": "TOMA",
    "text": "Où c'est qu'on met la clé de ce char-là ?"
  },
  "mirror": {
    "who": "SYSTÈME",
    "text": "Toma s'est arrêté pour saluer son reflet."
  },
  "car": {
    "who": "TOMA",
    "text": "C'est mon char ! ... Pourquoi le gars barre les portes ?"
  },
  "bench": {
    "who": "TOMA",
    "text": "Gardez ma place, j'reviens quand j'serai célèbre."
  },
  "bin": {
    "who": "SYSTÈME",
    "text": "La poubelle déborde de factures marquées urgent."
  },
  "phone": {
    "who": "TOMA",
    "text": "IA ? Allô ? Fais au moins semblant de m'écouter !"
  }
};
export const STORY_MILESTONES = [
  {
    "at": 300,
    "who": "TOMA",
    "text": "Cinq minutes de survie ! YEAHHHHHH ! Quelqu'un a parti le chrono ou c'est juste moi qui sue ?"
  },
  {
    "at": 600,
    "who": "SYSTÈME",
    "text": "Dix minutes. Toma demande si le cardio se rembourse."
  },
  {
    "at": 900,
    "who": "TOMA",
    "text": "Quinze minutes, tabarnak ! J'sens pu mes pieds !"
  },
  {
    "at": 1140,
    "who": "SYSTÈME",
    "text": "Encore une minute. Toma prépare déjà ses remerciements à lui-même."
  }
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
  if(s.companion)return "YEAHHHHHH ! On l'a fait ! Viens dans la photo. Attends, de l'autre bord, c'est mon bon côté.";
  if(s.upg.truth)return "La vérité, ça cogne en tabarnak. J'vas peut-être en mettre un peu dans ma bio.";
  if(s.discovery?.count>=3)return "J'connais tout le quartier maintenant ! La prochaine fois, quelqu'un me prête un char.";
  return "Vingt minutes ! Sans IA ! Y'a quelqu'un qui a filmé, au moins ?!";
}
