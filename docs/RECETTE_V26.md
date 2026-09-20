# Recette V2.6 — direction visuelle premium

## Changements vérifiés

- Le nouveau visuel de « Ma journée » utilise uniquement les illustrations SVG
  déjà embarquées dans l'application : assiette, avocat et tomate.
- Le visuel affiche l'objectif sélectionné et le repère en kcal quand le profil
  est enregistré.
- Le mouvement de l'assiette respecte le réglage de réduction des animations,
  le lecteur d'écran et l'état actif de l'application.
- Une photographie Open Food Facts garde maintenant un voile discret pour que
  la pastille du repas reste lisible.
- La version affichée par Expo est `2.6.0`.

## Contrôles automatiques

- 71 fichiers TypeScript/TSX parcourus : aucune erreur de syntaxe.
- 46 fichiers d'interface analysés : aucun texte brut hors `<Text>`.
- 120 assertions métier et d'interface existantes : 0 échec.

## À vérifier sur téléphone

1. Ouvrir l'accueil avec un profil enregistré et vérifier la carte visuelle dans
   « Ma journée ».
2. Activer « réduire les animations » dans Profil : l'assiette doit rester
   immobile.
3. Ajouter un produit possédant une photo Open Food Facts : la pastille du
   moment doit rester lisible sur la photo.
4. Tester une taille de texte importante : le titre de la carte ne doit pas
   être coupé.
