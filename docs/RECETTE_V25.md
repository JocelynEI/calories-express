# Recette V2.5 — ce qui a été vérifié

## Ce que je ne peux toujours pas faire

Je n'ai jamais exécuté l'application : l'environnement où ce code est écrit ne
peut pas installer les dépendances npm. Le seul test qui compte reste le tien.

Je n'ai pas non plus de générateur d'images, et je ne peux pas télécharger de
photographies. C'est la raison pour laquelle les illustrations sont dessinées
en SVG plutôt que photographiées — c'était le choix retenu.

## L'aperçu au pixel près

Le format des illustrations a changé pour une raison qui n'est pas seulement
graphique : chaque dessin est maintenant **un vrai document SVG**, une chaîne
de caractères. Le téléphone la lit avec `SvgXml`, et mon aperçu la lit avec un
moteur de rendu de navigateur.

**Les deux lisent exactement le même texte.** Ce que montre la planche de
contrôle est donc ce qui s'affichera, aux différences de moteur près. C'est ce
qui a permis de rattraper trois dessins illisibles avant livraison, et une
collision entre un chiffre-clé et une illustration de bandeau.

## Vérifications automatiques

| Vérification | Outil | Résultat |
| --- | --- | --- |
| Syntaxe de tous les fichiers TypeScript | `tsc --noCheck` | aucune erreur |
| Références : imports, exports, noms | `tsc` avec déclarations de substitution | aucune erreur |
| Logique métier et garde-fous | `node --test` sur 9 suites | **120 assertions, 0 échec** |
| Textes bruts hors `<Text>` | analyseur syntaxique TypeScript | 45 écrans, aucun |
| API dépréciées importées | lecture des imports | aucune |

### Les assertions nouvelles sur les illustrations

- **Chaque SVG est complet** : en-tête attendu, balise fermante présente.
- **Les balises sont équilibrées.** Un SVG mal fermé ne lève aucune erreur : il
  ne dessine simplement rien. Compté ouvertures contre fermetures.
- **Chaque dégradé référencé existe.** Un `url(#x)` sans définition donne une
  forme noire — c'est le défaut qui avait transformé un logo en disque plein
  dans une version précédente.
- **Les identifiants sont préfixés par le nom de l'aliment**, et aucun n'est
  partagé entre deux illustrations. Sans cela, deux dessins affichés côte à
  côte se volent leurs couleurs.

## Rendus visuels avant livraison

Trois planches ont été regardées, et trois défauts corrigés :

1. **Les 21 illustrations**, en 110 px et en vignette 44 px. Le bol de riz
   passait pour une tache blanche, l'assiette pour des miettes, le poulet pour
   une pomme de terre. Refaits — le poulet en trois essais.
2. **Les cartes de repas**, grandes et resserrées. Le déjeuner et le dîner
   portaient deux violets indistinguables ; un vert a été ajouté.
3. **L'accueil complet.** Le chiffre-clé de chaque bloc passait par-dessus
   l'illustration du bandeau ; la place de l'illustration est désormais
   réservée.

## À vérifier toi-même

1. **Le journal.** Chaque repas doit avoir sa bande illustrée en tête de carte,
   avec la pastille du moment posée dessus.
2. **Un produit de marque.** Ajoute-en un par la recherche : sa vraie
   photographie doit remplacer l'illustration, dans la recherche et dans le
   journal.
3. **Un aliment inconnu** (« cassoulet », « tiramisu »). La bande doit rester
   un aplat teinté sans dessin : c'est voulu, une illustration fausse coûte
   plus cher qu'une case vide.
4. **Les bandeaux de bloc.** Le chiffre à droite ne doit jamais toucher
   l'illustration.
5. **Tes données.** Le journal doit contenir tes repas des jours précédents.
