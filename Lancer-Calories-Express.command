#!/bin/bash
# Se place dans le dossier de CE fichier, quel que soit le nom du dossier extrait.
set -e
cd -- "$(dirname -- "$0")"

VERSION=$(node -p "require('./app.json').expo.version" 2>/dev/null || echo "inconnue")
DOSSIER="$(pwd)"
PARENT="$(dirname "$DOSSIER")"

echo ""
echo "======================================================================"
echo "  Calories Express — version $VERSION"
echo "  Dossier servi : $DOSSIER"
echo "======================================================================"
echo ""
echo "  Si la version affichée ci-dessus n'est pas celle que tu viens de"
echo "  décompresser, c'est que tu lances l'ancien dossier. Fais Ctrl+C,"
echo "  puis relance la commande avec le bon nom de dossier."
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js est manquant. Installe Node.js 22.13 ou supérieur puis relance."
  exit 1
fi
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 13)) { console.error("Node.js 22.13 ou supérieur est nécessaire."); process.exit(1); }'

# --- Espace disque -----------------------------------------------------------
# Une installation Expo demande environ 1,5 Go. Sans cette vérification, npm
# échoue à mi-parcours en laissant un dossier node_modules incomplet, et le
# message d'erreur se perd au milieu de centaines de lignes d'avertissement.
LIBRE_MO=$(df -m . | tail -1 | awk '{print $4}')
echo "Espace disque disponible : $((LIBRE_MO / 1024)) Go"

if [ "$LIBRE_MO" -lt 2500 ]; then
  echo ""
  echo "----------------------------------------------------------------------"
  echo "  PAS ASSEZ D'ESPACE DISQUE"
  echo "----------------------------------------------------------------------"
  echo ""
  echo "  Il faut environ 2,5 Go de libre ; il en reste $((LIBRE_MO / 1024)) Go."
  echo ""
  echo "  Le plus gros coupable est presque toujours le dossier node_modules"
  echo "  des anciennes versions. Voici ce qu'elles occupent :"
  echo ""
  for d in "$PARENT"/Calories-Express-*/node_modules; do
    [ -d "$d" ] || continue
    printf '    %6s  %s\n' "$(du -sh "$d" 2>/dev/null | cut -f1)" "$(dirname "$d")"
  done
  echo ""
  echo "  Pour tout libérer d'un coup, colle cette commande :"
  echo ""
  echo "    rm -rf ~/Downloads/Calories-Express-*/node_modules"
  echo ""
  echo "  Elle ne supprime que les dépendances téléchargées, jamais ton code"
  echo "  ni tes données : ce lanceur les réinstalle ensuite tout seul."
  echo "  Tes repas sont sur le téléphone, pas sur le Mac."
  echo ""
  echo "  Si cela ne suffit pas, vide aussi le cache de npm :"
  echo ""
  echo "    npm cache clean --force"
  echo ""
  exit 1
fi

# Une installation précédente interrompue laisse un node_modules inutilisable :
# mieux vaut repartir de zéro que de bricoler par-dessus.
if [ -d node_modules ] && [ ! -d node_modules/expo ]; then
  echo "Une installation précédente semble incomplète. Nettoyage avant de reprendre…"
  rm -rf node_modules
fi

echo "Installation des dépendances…"
if ! npm install; then
  echo ""
  echo "----------------------------------------------------------------------"
  echo "  L'INSTALLATION A ÉCHOUÉ"
  echo "----------------------------------------------------------------------"
  echo ""
  echo "  Si tu vois « ENOSPC » plus haut, c'est l'espace disque. Colle :"
  echo ""
  echo "    rm -rf ~/Downloads/Calories-Express-*/node_modules"
  echo "    npm cache clean --force"
  echo ""
  echo "  puis relance ce lanceur."
  echo ""
  exit 1
fi

echo ""
echo "Connecte le Mac et le téléphone au même Wi-Fi, puis scanne le QR code."
echo "Si Expo Go demande une connexion, arrête avec Ctrl+C puis lance npx expo login dans ce dossier."
echo "Dans Expo Go, ferme d'abord le projet déjà ouvert avant de scanner le nouveau QR code."
echo ""

if [ "${1:-}" = "--tunnel" ]; then
  npx expo start --go --tunnel --clear
else
  npx expo start --go --clear
fi
