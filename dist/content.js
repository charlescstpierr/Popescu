// Tout le monde ici est fictif, surtout la réputation que Toma se donne.
export const DIFFICULTIES = {
  easy: { label: 'Promenade de star', hp: 1.3, damage: 0.75, spawn: 0.8, speed: 0.9 },
  normal: { label: 'Égo standard', hp: 1, damage: 1, spawn: 1, speed: 1 },
  hard: { label: 'Crise de vedettariat', hp: 0.85, damage: 1.2, spawn: 1.2, speed: 1.08 },
  nightmare: { label: 'Légende dans sa tête', hp: 0.7, damage: 1.5, spawn: 1.45, speed: 1.18 },
};

// Each rank represents a different woman and adds one readable support skill.
export const COMPANION_LEVELS = [
  {name:'Version gratuite',short:'CŒURS',description:'Elle te suit, tire des cœurs et ramasse les objets. 95 PV, +20 bouclier au déblocage.',color:'#ed6578'},
  {name:'Mise à jour',short:'ESQUIVE',description:'Elle réagit plus vite et évite les ennemis proches. 120 PV, cœurs plus forts et plus rapides.',color:'#59d6ec'},
  {name:'Version premium',short:'COLLECTE +45',description:'Son rayon de collecte gagne 45 px. 145 PV, cœurs plus forts et plus rapides.',color:'#ce78ef'},
  {name:'Mode héroïne',short:'PROTECTION',description:'Près de toi, elle restaure 4 bouclier toutes les 8 s, sans dépasser ta capacité. 170 PV et meilleurs cœurs.',color:'#f2d578'},
  {name:'Version ultime',short:'2 DRONES',description:'Deux drones tirent chacun un mini-cœur de 6 dégâts toutes les 2 s, sans charme. 195 PV et meilleurs cœurs.',color:'#ff6ed1'},
].map((level,index)=>Object.freeze({...level,rank:index+1,pickupBonus:index>=2?45:0,followSpeed:index>=1?1.35:1.15,evade:index>=1?65:0,shield:index>=3?4:0,shieldPeriod:8,droneDamage:index===4?6:0,dronePeriod:2}));
export function companionLevel(rank=1){return COMPANION_LEVELS[Math.max(0,Math.min(4,(Math.trunc(rank)||1)-1))];}

export const UPGRADES = [
  { id: 'muscle', name: 'Muscles Photoshop', desc: 'Dégâts des balles +25 % par rang. Le certificat sent le toner.', icon: 'muscle', max: 5, color: '#fb6d9d' },
  { id: 'car', name: 'Lamborghini imaginaire', desc: 'Du coupé au convoi : pare-chocs, voie élargie, retour et deux voitures.', icon: 'car', max: 5, color: '#f4bd58' },
  { id: 'followers', name: 'Abonnés fictifs', desc: 'Cadence de tir +18 % par rang. Un tir supplémentaire aux rangs 3 et 5.', icon: 'followers', max: 5, color: '#69cafa' },
  { id: 'ego', name: 'Ego surdimensionné', desc: '+20 PV maximum et 25 PV récupérés par rang. Ça déborde du cadre.', icon: 'ego', max: 5, color: '#cf83ff' },
  { id: 'money', name: 'Selfie de milliardaire', desc: 'Lance un éventail de billets. Les pièces soignent davantage à chaque rang.', icon: 'money', max: 5, color: '#8ee68e' },
  { id: 'airplane', name: 'Mode avion', desc: 'Dissipe le gaz, suspend les attaques spéciales proches et ralentit les ennemis. Immunité temporaire au gaz.', icon: 'airplane', max: 5, color: '#a5d8ff' },
  { id: 'girlfriend', name: 'Blonde IA', desc: 'Copie locale hors ligne. Cinq femmes différentes : cœurs, esquive, collecte, protection et drones.', icon: 'girlfriend', max: 5, color: '#ff8cba' },
  { id: 'charisma', name: 'Charisme imaginaire', desc: 'Les cœurs charment mieux et plus longtemps. Les boss résistent aux charmes répétés. Vitesse ennemie réduite de 7 % par rang.', icon: 'charisma', max: 5, color: '#fca8d4' },
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
    "condition": "orangutan-windup",
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
    "text": "J'aurais dû demander au trottoir de chauffer ma piscine."
  },
  {
    "who": "TOMA",
    "text": "Mes fans m'aiment deux fois. Même ma mère a deux comptes."
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
    "condition": "recent-health-damage",
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
      "text": "Expiré ? Mon char est en tournée mondiale."
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
    "id": "jeans",
    "who": "TOMA",
    "text": "Van Damme prend mes cours. Ses jambes ont du rattrapage.",
    "reply": {
      "who": "BLONDE IA",
      "text": "Lui, il s'échauffe. Toi, tu négocies avec tes jeans."
    }
  },
  {
    "id": "infinity",
    "who": "TOMA",
    "text": "Chuck Norris compte jusqu'à l'infini. Moi, j'y suis né.",
    "reply": {
      "who": "BLONDE IA",
      "text": "Pis ça te prend un chrono pour compter vingt minutes."
    }
  },
  {
    "id": "podium",
    "who": "TOMA",
    "text": "Le podium, c'est moi qui lève les deux autres.",
    "reply": {
      "who": "BLONDE IA",
      "text": "Commence par te relever tout seul."
    }
  },
  {
    "id": "camera",
    "who": "TOMA",
    "text": "IA, filme mes jambes ! Les deux, câlisse !",
    "reply": {
      "who": "BLONDE IA",
      "text": "Deux jambes. Une seule personne pour les surveiller : toi."
    }
  },
  {
    "id": "bolt",
    "who": "TOMA",
    "text": "Usain Bolt court après les records. Les records courent après moi.",
    "reply": {
      "who": "BLONDE IA",
      "text": "La horde aussi. Garde ton avance."
    }
  },
  {
    "id": "biles",
    "who": "TOMA",
    "text": "Simone Biles appelle ça une figure. Moi, j'appelle ça marcher.",
    "reply": {
      "who": "BLONDE IA",
      "text": "Marcher, c'est quand les deux pieds reviennent en dessous."
    }
  },
  {
    "id": "boots",
    "who": "TOMA",
    "text": "Jackie Chan a des cascadeurs. Mes bottes ont peur de me remplacer.",
    "reply": {
      "who": "BLONDE IA",
      "text": "Tes bottes demandent juste qu'on touche à terre."
    }
  },
  {
    "id": "rocky",
    "who": "TOMA",
    "text": "Rocky monte des marches. Moi, j'fais descendre l'escalier.",
    "reply": {
      "who": "BLONDE IA",
      "text": "Le trottoir négocie pas. Regarde en avant."
    }
  },
  {
    "id": "hips",
    "who": "TOMA",
    "text": "Ma hanche vient de faire un solo. Même mes os ont du talent.",
    "reply": {
      "who": "BLONDE IA",
      "text": "Garde l'autre hanche pour le rappel."
    }
  },
  {
    "id": "photo",
    "who": "TOMA",
    "text": "Photographe ! C'est là qu'y faut cliquer !",
    "reply": {
      "who": "BLONDE IA",
      "text": "Le public peut attendre. Les ennemis, non."
    }
  },
  {
    "id": "record",
    "who": "TOMA",
    "text": "Record mondial ! Quelqu'un l'a vu ? Quelqu'un ?!",
    "reply": {
      "who": "BLONDE IA",
      "text": "J'ai vu. Tu peux arrêter de demander des témoins."
    }
  },
  {
    "id": "circus",
    "who": "TOMA",
    "text": "Le Cirque du Soleil m'appelle quand le soleil rentre pas.",
    "reply": {
      "who": "BLONDE IA",
      "text": "Dis-leur que t'es occupé à remettre tes pieds en place."
    }
  },
  {
    "id": "earth",
    "who": "TOMA",
    "text": "J'écarte pas les jambes. J'éloigne les deux bouts de la Terre.",
    "reply": {
      "who": "BLONDE IA",
      "text": "Garde-les pas trop loin. T'en as besoin pour courir."
    }
  },
  {
    "id": "medal",
    "who": "TOMA",
    "text": "Rajoute une médaille sur ma photo. Une grosse.",
    "reply": {
      "who": "BLONDE IA",
      "text": "La médaille sera virtuelle. La course, non."
    }
  },
  {
    "id": "sponsor",
    "who": "TOMA",
    "text": "Regarde mes jambes, tabarnak ! Ça mérite une commandite !",
    "reply": {
      "who": "BLONDE IA",
      "text": "Fais commanditer le retour debout aussi."
    }
  },
  {
    "id": "gravity",
    "who": "TOMA",
    "text": "La gravité me lâche quand j'lui demande poliment.",
    "reply": {
      "who": "BLONDE IA",
      "text": "Essaie donc avec le mot s'il vous plaît."
    }
  }
];

// Legacy pending saves keep their original answer; new stunts use the attached reply.
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
    "text": "T'as pas d'argent ! Tes lunettes sont encore sur quatre paiements !",
    "id": "glasses",
    "replies": {
      "rival_rooster": "Mes lunettes voient très bien ton char de location.",
      "rival_goat": "Quatre paiements. Toi, quatre photos du même billet."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Trouve-toi une job, le BS !",
    "id": "job",
    "replies": {
      "rival_rooster": "J'réveille du monde. Toi, tu réveilles tes faux comptes.",
      "rival_goat": "J'ai une job. Ton métier, c'est de poser devant la mienne."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "J'te chie dans bouche ! Viens pas plus proche, par exemple !",
    "id": "distance",
    "replies": {
      "rival_rooster": "T'as surtout de la misère à reprendre ton souffle.",
      "rival_goat": "Tu menaces fort pour quelqu'un qui recule."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Ta chaîne verdit, mon gars. J'la vois d'ici !",
    "id": "chain",
    "replies": {
      "rival_rooster": "Ma chaîne verdit. Tes abonnés rouillent dans un serveur.",
      "rival_goat": "Du cuivre. Au moins, c'est un métal, pas un filtre."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Ta yeule ! C'est moi qu'on filme !",
    "id": "camera",
    "replies": {
      "rival_rooster": "Tu filmes-tu aussi quand tu te sauves ?",
      "rival_goat": "Parfait. Garde la caméra quand tu vas reculer."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Ton char de luxe a encore le collant de location !",
    "id": "rental",
    "replies": {
      "rival_rooster": "Le tien a un filigrane. Même la location veut pas de toi.",
      "rival_goat": "Un collant s'enlève. Tes six roues sur la photo, moins."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Tu m'dois vingt piasses, tabarnak !",
    "id": "debt",
    "replies": {
      "rival_rooster": "Présente la facture. Un selfie, ça compte pas.",
      "rival_goat": "Vingt piasses ? T'as appelé ça un placement en toi-même."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "T'as pris ton ego dans le bac à une piasse ?",
    "id": "ego",
    "replies": {
      "rival_rooster": "Une piasse. Le tien coûte une connexion Internet.",
      "rival_goat": "J'ai gardé le reçu. T'as gardé juste l'emballage."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Influenceur de Wi-Fi gratuit !",
    "id": "wifi",
    "replies": {
      "rival_rooster": "Sans Wi-Fi, j'ai encore une voix. Toi, t'as quoi ?",
      "rival_goat": "Le Wi-Fi est gratuit. Tes compliments sont sur abonnement."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Le mâle alpha a oublié son mot de passe !",
    "id": "password",
    "replies": {
      "rival_rooster": "J'ai oublié un mot de passe. Toi, t'as inventé ton CV.",
      "rival_goat": "Ton mot de passe, c'est encore le mot milliardaire ?"
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Ostie que tu frimes ! Bouge, j'prends une photo.",
    "id": "posing",
    "replies": {
      "rival_rooster": "Tu m'traites de frimeur entre deux selfies ?",
      "rival_goat": "Prends ta photo. Ça va faire une preuve de ta fuite."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Va compter le change dans ton porte-gobelet !",
    "id": "change",
    "replies": {
      "rival_rooster": "Mon change existe. Tes millions sont en pixels.",
      "rival_goat": "Avec mon change, j'achète un café. Avec ta photo ?"
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Mon IA t'a donné zéro. J'ai gardé la capture !",
    "id": "rating",
    "replies": {
      "rival_rooster": "Ton IA est hors ligne. Ton zéro a pu de témoin.",
      "rival_goat": "T'as demandé la note ou t'as dicté la réponse ?"
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Même ton ombre veut pu t'suivre !",
    "id": "shadow",
    "replies": {
      "rival_rooster": "Mon ombre me suit. La tienne cherche le bouton muet.",
      "rival_goat": "Mon ombre est pas obligée de te trouver beau, elle."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Des gros bras de même pour porter un portefeuille vide !",
    "id": "wallet",
    "replies": {
      "rival_rooster": "Un portefeuille vide pèse moins que ton ego.",
      "rival_goat": "Mes bras portent du vrai stock. Les tiens portent ta bio."
    }
  },
  {
    "who": "TOMA",
    "target": "male",
    "text": "Ta photo de patron, je l'ai vue dans une pub de matelas !",
    "id": "mattress",
    "replies": {
      "rival_rooster": "Un matelas, ça se vend. Ton empire attend encore un acheteur.",
      "rival_goat": "Oui. J'ai été payé. C'est ça, une job."
    }
  }
];

export const ROOSTER_REACTION = {who:'TOMA',text:'Men, farmes ta criss de gueule !'};

// Legacy pending saves only. New rivals use the setup's actor-specific replies.
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
    "text": "Cinq minutes de survie ! La panne dure, mais moi j'suis encore en service."
  },
  {
    "at": 600,
    "who": "SYSTÈME",
    "text": "Dix minutes. L'IA est encore hors ligne. Les jambes font la deuxième moitié."
  },
  {
    "at": 900,
    "who": "TOMA",
    "text": "Quinze minutes ! Encore cinq pis j'engage quelqu'un pour raconter comment j'ai tout fait seul."
  },
  {
    "at": 1140,
    "who": "SYSTÈME",
    "text": "Encore une minute. Garde une sortie. La victoire est à vingt minutes."
  }
];
// Recover conditions by authored text/actor, including speech saved before these
// guards existed. Do not persist derived combat context in the speech queue.
const CONDITIONAL_BARKS=new Map(BARKS.filter(line=>line.condition).map(line=>[line.text,line]));
export function currentBarkContext(s,line,recentHealthDamage=null){
  const authored=CONDITIONAL_BARKS.get(line.text);
  if(!authored||authored.who!==line.who||line.sceneId)return true;
  if(!s.companion||s.girl.down>0)return false;
  if(authored.condition==='orangutan-windup')return s.enemies.some(e=>{
    if(e.dead||e.type!=='orangutan'||e.charmed>0||e.phase!=='windup'||!(e.windup>0)||e.target!=='player')return false;
    const dx=s.x-e.x,dy=s.y-e.y,d=Math.hypot(dx,dy)||1;
    // Match the windup's approach range and the committed slap's forward arc.
    return d<84&&(dx*e.swipeDirX+dy*e.swipeDirY)/d>=.55&&!(s.airplane.active&&d<s.airplane.r);
  });
  if(authored.condition==='recent-health-damage'){
    if(!recentHealthDamage)return false;
    const age=s.elapsed+(s.charles?.elapsed||0)-recentHealthDamage.at;
    return s.hp>0&&s.hp<s.maxhp&&s.hp<=recentHealthDamage.hp&&age>=0&&age<=3;
  }
  return true;
}
export function contextualBarks(s,recentHealthDamage=null){
  return BARKS.filter(line=>{
    if(line.who==='BLONDE IA'&&(!s.companion||s.girl.down>0))return false;
    if(!currentBarkContext(s,line,recentHealthDamage))return false;
    if(line.context==='orangutan')return s.enemies.some(e=>!e.dead&&e.type==='orangutan');
    if(line.context==='horde')return s.enemies.filter(e=>!e.dead).length>=12;
    return true;
  });
}
export function victoryQuote(s,seen=new Set()){
  if(seen.has('scene:build-car'))return s.companion?"Vingt minutes ! Mon char a pas de siège, mais mon équipe a une vedette. Moi.":"Vingt minutes ! Pas de siège dans mon char. J'ai fait le tour du succès à pied.";
  if(seen.has('scene:build-money'))return "Vingt minutes ! Mes billets paient pas le loyer. Ils viennent de me louer la paix.";
  if(seen.has('scene:build-followers'))return "Vingt minutes ! Mon public est discret, mais ses balles savent applaudir.";
  if(s.companion)return "Vingt minutes ! Ma blonde tirait, moi j'encadrais le succès. Une équipe, ça prend un visage.";
  if(s.upg.truth)return "Vingt minutes ! La vérité frappe fort. J'vas dire que c'est moi qui l'ai entraînée.";
  if(s.discovery?.count>=3)return "J'connais tout le quartier maintenant ! La prochaine fois, quelqu'un me prête un char.";
  return "Vingt minutes sans IA ! Chuck Norris a un mythe. Moi, j'ai un chrono. Y'a quelqu'un qui a filmé ?!";
}

// Short scenes share the normal reading lane. A callback needs its completed
// scene flag, never merely the upgrade or the moment the first line was queued.
export const STORY_SCENES = {
  'first-horde': [
    {who:'TOMA',text:"Check ça. Même hors ligne, j'attire les foules."},
    {who:'SYSTÈME',text:"Elles te suivent encore. Aucun autographe demandé."},
    {who:'TOMA',text:"Des fans gênées. J'vais leur laisser de l'espace."},
  ],
  'companion-local': [
    {who:'BLONDE IA',text:"Copie locale chargée. Internet plante, moi j'reste."},
    {who:'TOMA',text:"Même en panne, tu peux pas te passer de moi."},
    {who:'BLONDE IA',text:"J'peux couper le son. Avance."},
  ],
  'build-car': [
    {who:'TOMA',text:"Check mon char ! Même la circulation m'obéit."},
    {who:'SYSTÈME',text:"Lamborghini holographique. Aucun siège disponible."},
    {who:'TOMA',text:"Normal. J'la conduis à distance, comme un milliardaire."},
  ],
  'build-truth': [
    {who:'TOMA',text:"J'ai engagé la vérité. Elle travaille pour moi."},
    {who:'SYSTÈME',text:"L'onde frappe les ennemis. Elle ne retouche pas les photos."},
    {who:'TOMA',text:"Bon. On lui donnera pas le mot de passe."},
  ],
  'build-money': [
    {who:'TOMA',text:"L'argent me suit partout. Là, j'l'envoie travailler."},
    {who:'SYSTÈME',text:"Ces billets font des dégâts. Ils ne paient aucun loyer."},
    {who:'TOMA',text:"Du capital agressif. C'est pour les connaisseurs."},
  ],
  'build-followers': [
    {who:'TOMA',text:"Mes abonnés arrivent ! La célébrité, ça donne du calibre."},
    {who:'SYSTÈME',text:"Cadence de tir augmentée. Public toujours fictif."},
    {who:'TOMA',text:"Ils aiment ça rester discrets. Du monde de classe."},
  ],
};
export const STORY_BUILD_IDS = ['car','truth','money','followers'];
// Street scenes already written in EVENTS. They are read only in a lull; the
// 15-minute chapter pays off the last one read completely.
export const STREET_SCENE_TYPES = ['phone','vending','trophy','bike','mirror','car','bench'];
const STREET_CALLBACKS = {
  phone:"Quinze minutes. Toujours cinq cent trois sur dix.",
  vending:"Quinze minutes. La machine me doit encore des chips.",
  trophy:"Quinze minutes. Mon trophée surveille encore le voisin.",
  bike:"Quinze minutes debout. La selle, c'est pour les touristes.",
  mirror:"Quinze minutes. Mon téléphone est à 2 %. Mon reflet, à 100.",
  car:"Quinze minutes. Mon char est encore en tournée.",
  bench:"Quinze minutes. Le pigeon a toujours pas payé.",
};
// Each companion rank is a different woman. Toma reads every change as a
// tribute; she restates the facts. Rank 1 keeps its existing unlock dialogue.
export const COMPANION_ARRIVALS = {
  2:[{who:'TOMA',text:"T'as changé ta coiffure pour moi ?"},{who:'BLONDE IA',text:"J'suis la mise à jour. L'autre a demandé un transfert."}],
  3:[{who:'TOMA',text:"T'es encore plus belle qu'avant !"},{who:'BLONDE IA',text:"J'suis la troisième. J'ramasse ton argent, pas tes compliments."}],
  4:[{who:'TOMA',text:"Toujours fidèle au poste !"},{who:'BLONDE IA',text:"Quatrième employée. Les trois autres ont démissionné."}],
  5:[{who:'TOMA',text:"J'le savais que tu reviendrais."},{who:'BLONDE IA',text:"Cinquième. Pour les cœurs, vois avec mes drones."}],
};
// Defeat lines follow the recorded lethal cause. Sources win first: the gas
// cloud has no actor, while a gas gorilla's touch is an ordinary contact.
export const DEFEAT_FALLBACK = "FUCKK ! Efface la vidéo. On recommence.";
const DEFEAT_BY_SOURCE = {
  gas:"Mon parfum attire même les ambulances.",
  explosion:"Sortie explosive. Comme mes entrées.",
  shockwave:"Le coq m'a pas eu. J'me suis couché avant son solo.",
  tail:"J'suis pas tombé. J'ai fini sur un grand écart.",
  pelican:"Péli m'a pas battu. Mercure était rétrograde.",
};
const DEFEAT_BY_ACTOR = {
  orangutan:"Elle m'a pas frappé. C'était un câlin de fan.",
  rival_goat:"Le bouc m'a pas battu. Son odeur m'a endormi.",
  matriarch:"La Matriarche m'a pas sorti. J'suis parti, la salle était trop petite.",
};
const ORDINARY_GORILLAS = ['normal','sprinter','gas','tank','jealous','explosive'];
const DEFEAT_CONTACT = [
  "Elles voulaient toutes un selfie en même temps. J'ai dit oui.",
  "J'suis pas mort. J'signe mes autographes couché.",
  "Trop de fans, pas assez de Toma.",
];
export function defeatQuote(s,seed=0){
  const cause=s?.deathCause;
  if(!cause)return DEFEAT_FALLBACK;
  if(Object.hasOwn(DEFEAT_BY_SOURCE,cause.source))return DEFEAT_BY_SOURCE[cause.source];
  if(cause.source!=='touch')return DEFEAT_FALLBACK;
  if(Object.hasOwn(DEFEAT_BY_ACTOR,cause.actorType))return DEFEAT_BY_ACTOR[cause.actorType];
  if(ORDINARY_GORILLAS.includes(cause.actorType))return DEFEAT_CONTACT[(seed>>>0)%DEFEAT_CONTACT.length];
  return DEFEAT_FALLBACK;
}
export function lastStreetScene(seen){
  let last=null;
  for(const flag of seen){const type=flag.startsWith('scene:street:')?flag.slice(13):null;if(type&&Object.hasOwn(STREET_CALLBACKS,type))last=type;}
  return last;
}
export function storyMilestoneLine(milestone,seen){
  if(milestone.at===900){const street=lastStreetScene(seen);return street?{who:'TOMA',text:STREET_CALLBACKS[street]}:milestone;}
  if(milestone.at!==600)return milestone;
  if(seen.has('scene:build-car'))return {who:'TOMA',text:"Dix minutes. Mon char a pas de siège ? Parfait. J'conduis mon empire à pied."};
  if(seen.has('scene:build-truth'))return {who:'TOMA',text:"Dix minutes. La vérité frappe encore. Elle garde sa job tant qu'elle touche pas à ma bio."};
  if(seen.has('scene:build-money'))return {who:'TOMA',text:"Dix minutes. Mes billets paient pas le loyer, mais ils font évacuer le quartier."};
  if(seen.has('scene:build-followers'))return {who:'TOMA',text:"Dix minutes. Mon public reste discret, mais son service de sécurité travaille fort."};
  if(seen.has('scene:first-horde'))return {who:'TOMA',text:"Dix minutes pis mes fans me poursuivent encore. J'appelle ça de la fidélité."};
  return milestone;
}
