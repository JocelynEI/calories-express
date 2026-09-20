# Vérifications V1.3 — 15 septembre 2026

## Réussies en développement

- Installation des dépendances dans une copie distincte de la V1.2.
- TypeScript : `npm run check`, sans erreur.
- Logique métier : `npm run test:logic`, 42 assertions réussies.
- Expo Doctor : 21 contrôles sur 21 réussis.
- Export web et export des bundles Hermes pour iOS et Android réussis.
- Versions `package.json`, `package-lock.json` et `app.json` cohérentes en 1.3.0.
- Ancienne dépendance vocale absente du code et du fichier de verrouillage.
- Icônes configurées présentes ; ancien portrait et grande photo retirés.
- Avatar PNG inspecté, avec vrai canal alpha, redimensionné en 384 × 384.
- Syntaxe du lanceur Mac validée avec `bash -n`.

Les tests vérifient notamment : l’autocomplétion `ban` et `pain au cho`, les phrases
avec plusieurs aliments, le déficit automatique appliqué une seule fois, la
priorité des objectifs manuels, la distinction objectif/maintien à 2 200 kcal,
les modes maintien et prise, les valeurs de profil invalides, les anciens repères
trop bas, la cohérence des objectifs, les salutations et les préférences.

Les bundles exportés ne sont pas des applications natives signées IPA/APK.

## Vérification visuelle et téléphone

Le navigateur de test a refusé l’accès au serveur local (`ERR_BLOCKED_BY_CLIENT`).
Aucune capture d’écran de l’application en fonctionnement ni validation
interactive sur iPhone/Android n’est revendiquée pour cette version.

À tester sur le téléphone :

1. Accueil : Jaws, prénom ou bonjour générique, aucune grande photo, aucune voix.
2. Conseils : changement de bulle et mouvement léger, puis arrêt du mouvement.
3. Profil : création, modification, sauvegarde et conservation après fermeture.
4. Profil : annuler une suppression, puis confirmer et recréer le profil ; conserver les repas.
5. Déficit : ouvrir/fermer le guide, parcourir les trois étapes et les trois totaux de l’exemple.
6. Baromètre : enregistrer un repas, vérifier le compteur et l’objectif ; observer le texte en cas de dépassement.
7. Saisie : suggestions, choix d’aliments, portions, clavier ouvert et validation.
8. Photo : refus puis autorisation de caméra/galerie, ajout et retrait d’une image.
9. Accessibilité : petite largeur, grande police, lecteur d’écran, réduction des mouvements, passage en arrière-plan.
10. Réglages : animations et accueil désactivés, accueil rejoué, réglages conservés au redémarrage.

## Limites à traiter avant diffusion publique

Catalogue alimentaire de test, macronutriments à valider, estimation des besoins
à personnaliser, données stockées localement, analyse automatique des photos
non connectée. La caméra et la qualité des interactions ne peuvent pas être
confirmées par une compilation seule.
