#!/usr/bin/env python3
"""Generate the offline HTML + assets folder without altering source artwork."""
from pathlib import Path
import hashlib, json, shutil, sys
from offline_bundle import root, dist, bundle_html

out = Path(sys.argv[1]) if len(sys.argv) > 1 else root/'release/Toma_Popescu_JOUER.html'
out.parent.mkdir(parents=True, exist_ok=True)
assets = out.parent/'assets'
assets.mkdir(exist_ok=True)
files = []
# Keep every source asset, including legacy references and dynamically chosen portraits.
# copyfile preserves the exact encoded bytes; no image package or recompression is used.
for source in sorted((dist/'assets').iterdir()):
    if source.is_file():
        target = assets/source.name
        shutil.copyfile(source, target)
        files.append(target)
out.write_text(bundle_html(embed_assets=False), encoding='utf-8')
files.append(out)
readme = out.parent/'LIRE-MOI.txt'
readme.write_text(f'''TOMA POPESCU — DOSSIER HORS LIGNE

1. Extraire le dossier complet de l'archive ZIP.
2. Garder {out.name}, assets/ et les autres fichiers ensemble.
3. Ouvrir {out.name} dans un navigateur de bureau.

Aucun serveur, Node.js ni connexion réseau n'est nécessaire pour jouer.
Ne pas ouvrir le HTML depuis l'aperçu d'une archive ni télécharger le HTML seul.
Les images conservent leurs octets d'origine; elles sont séparées, pas réduites.

MISE À JOUR ET SAUVEGARDES
Garder le même navigateur, profil et chemin complet du fichier HTML.
Avant remplacement, fermer le jeu et conserver une copie de l'ancien dossier.
Le format et les clés de sauvegarde restent inchangés. Le stockage des pages
file:// dépend toutefois du navigateur; déplacer le dossier ou changer de
profil peut rendre les anciennes sauvegardes invisibles. Aucune migration
entre origines ou aucun effacement du stockage n'est effectué.

EXPORT FACULTATIF EN UN SEUL FICHIER
Depuis le dépôt source : python3 scripts/export-standalone.py
Sortie : generated/standalone/Toma_Popescu_JOUER.html (fichier plus volumineux).
Ce fichier généré n'est pas la version courante à ouvrir dans ce dossier.

Les tests Canvas/DOM ne remplacent pas une vérification sur navigateur réel
ou téléphone physique. Voir docs/EXPORTS-HORS-LIGNE.md dans le dépôt source.
''', encoding='utf-8')
files.append(readme)
manifest = {'format': 'offline-folder-v1', 'entrypoint': out.name, 'files': [
    {'path': p.relative_to(out.parent).as_posix(), 'bytes': p.stat().st_size,
     'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(files)
]}
(out.parent/'OFFLINE_MANIFEST.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'{out} ({out.stat().st_size:,} bytes; {len(files)-2} assets; offline folder)')
