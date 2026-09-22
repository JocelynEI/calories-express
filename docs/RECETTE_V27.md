# Recette V2.7 — ce qui a été vérifié

## Ce que je ne peux pas faire

Je n'ai jamais exécuté l'application : l'environnement où ce code est écrit ne
peut pas installer les dépendances npm. La police Plus Jakarta Sans n'a pas pu
non plus être chargée dans mes aperçus. Le seul test qui compte reste le tien.

## Vérifications automatiques

| Vérification | Résultat |
| --- | --- |
| Logique métier et garde-fous (`npm run test:logic`) | 128 assertions, 0 échec |
| Textes bruts hors `<Text>` | aucun, 46 fichiers |
| API dépréciées | aucune |
| `fontWeight` au lieu d'une famille de police | aucun |
| Références TypeScript | 70 fichiers analysés, 0 erreur |

## À vérifier sur ton téléphone

1. **La police.** Les titres doivent avoir l'allure ronde et géométrique de
   Plus Jakarta Sans, pas la police habituelle du téléphone. Si tout est dans
   la police du système, dis-le-moi : le chargement aurait échoué.
2. **La jauge.** Un arc ouvert en bas, le total consommé au centre, « sur …
   kcal » dessous, et la pastille d'état dans l'ouverture.
3. **Les en-têtes de section.** Le titre et, dessous, son chiffre : rien ne
   doit être coupé par des points de suspension.
4. **Le journal.** Petit-déjeuner orangé, déjeuner vert, dîner violet doux,
   goûter menthe. Toutes les pastilles doivent se lire sans effort.
5. **Les autres écrans** (Profil, Progression, fenêtres d'ajout) : nouvelles
   couleurs et nouvelle police, mais mise en page d'avant. C'est voulu, ils
   seront repris ensuite. Signale-moi ce qui te gêne le plus.
