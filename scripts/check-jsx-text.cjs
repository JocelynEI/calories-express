/**
 * Garde-fou : aucun texte brut dans un élément qui n'est pas du texte.
 *
 * React Native refuse une chaîne posée directement dans une `View`, et son
 * message — « Text strings must be rendered within a <Text> component » — ne
 * dit jamais où. Le piège le plus sournois n'est même pas une phrase oubliée :
 * ce sont les espaces. JSX supprime un blanc qui contient un retour à la
 * ligne, mais conserve `</View>      </Section>` — les six espaces deviennent
 * un enfant texte, et l'écran tombe.
 *
 * L'analyse passe par l'analyseur syntaxique de TypeScript, pas par une
 * expression régulière : un générique `Record<TabName, string>` n'est donc
 * jamais confondu avec une balise.
 *
 * Les composants maison qui enveloppent leur contenu dans un `<Text>` sont
 * déclarés dans WRAPPERS : leur contenu textuel est légitime.
 */
const ts = require('/opt/node-tools/node_modules/typescript');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TEXTY = new Set(['Text', 'Animated.Text']);

/** Composants maison dont le rendu enveloppe `children` dans un `<Text>`. */
const WRAPPERS = new Set(['Caption']);

function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

function scan(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = [];
  const report = (node, parent, what) => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart());
    found.push({ file: path.relative(ROOT, file), line: line + 1, parent, what });
  };
  const visit = (node) => {
    if (ts.isJsxElement(node)) {
      const parent = node.openingElement.tagName.getText();
      const allowed = TEXTY.has(parent) || WRAPPERS.has(parent);
      for (const child of node.children) {
        if (allowed) continue;
        if (ts.isJsxText(child)) {
          const raw = child.getText();
          // JSX retire un blanc qui contient un retour à la ligne ; tout le
          // reste arrive jusqu'au rendu.
          if (raw.includes('\n') && !raw.trim()) continue;
          if (!raw) continue;
          report(child, parent, raw.trim() ? `texte « ${raw.trim().slice(0, 50)} »` : `${raw.length} espace(s) collé(s) à la balise`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

const files = [...collect(path.join(ROOT, 'src')), path.join(ROOT, 'App.tsx')].sort();
const problems = files.flatMap(scan);
for (const p of problems) console.error(`${p.file}:${p.line}  dans <${p.parent}>  →  ${p.what}`);
if (problems.length) {
  console.error(`\n${problems.length} texte(s) brut(s) : React Native refusera de rendre ces écrans.`);
  process.exit(1);
}
console.log(`Aucun texte brut hors <Text> dans ${files.length} fichiers.`);

/* ------------------------------------------- l'API dépréciée de React Native */

// V2.4.2 : `SafeAreaView` de react-native est déprécié. Il ne faisait rien sur
// Android et ignorait la barre d'accueil des iPhone récents. L'avertissement
// se déclenche au simple chargement du module, donc un seul import oublié
// suffit à le faire apparaître au démarrage — c'est ce qui s'est passé en
// V2.4.1, où cinq fichiers avaient été oubliés.
const deprecated = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    if (/^import \{[^}]*\bSafeAreaView\b[^}]*\} from 'react-native';/.test(line)) {
      deprecated.push(path.relative(ROOT, file));
    }
  }
}
if (deprecated.length) {
  console.error(`\nSafeAreaView importé depuis react-native (déprécié) dans : ${deprecated.join(', ')}`);
  console.error(`Utilise react-native-safe-area-context.`);
  process.exit(1);
}
console.log('Aucune API dépréciée importée.');
