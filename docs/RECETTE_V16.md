# Vérification V1.6 — 18 septembre 2026

## Contrôles réalisés

- TypeScript strict : succès.
- 42 assertions historiques + 22 tests V1.4 + 15 tests V1.5 adaptés à l’estimation des pas + 14 tests V1.6 : succès.
- Expo Doctor : 21 contrôles sur 21 réussis.
- Export iOS, Android et Web avec Expo SDK 57 : succès.
- Calculs : total des pas remplacé, poids mémorisé, dates séparées, pas habituels, séances exclues, dédoublonnage, modes fixe/manuel/ajusté, déficit conservé.
- Aliments : recette burger composée à partir de six références Ciqual, modification/retrait des ingrédients, portions partagées, accompagnement conservé dans la phrase.
- Étiquette : énergie distincte des autres nombres, deux colonnes, kJ/kcal, portion de deux biscuits, trois biscuits consommés, poids du paquet, valeur absente, persistance des produits par pièce.
- OCR réel sur `tests/fixtures/etiquette-fictive.jpg` : Tesseract.js 6.0.1 et modèle français exécutés sous Node. Résultat lu : 500 kcal / 100 g et 200 kcal / 2 biscuits (40 g). Après choix de la deuxième colonne, 3 biscuits = 300 kcal.
- Accès HTTP contrôlé aux quatre ressources CDN épinglées (moteur, worker, core, modèle français).
- Blocage des données d’image non base64 et limitation de taille ; pont OCR ignorant les messages malformés.

Le test du moteur OCR sous Node **ne valide pas son intégration WebView sur
un téléphone**. Aucun iPhone ni appareil Android physique n’est connecté à cet
environnement. Les autorisations caméra, le fonctionnement du moteur dans la
WebView, la lisibilité réelle et les interactions tactiles restent à valider avec
les parcours ci-dessous. Les exports ne sont pas des APK/IPA signés.

## Parcours sur le téléphone

1. Ouvrir la V1.6 avec le lanceur fourni. Vérifier le profil et les repas précédents si Expo Go a conservé leur espace de stockage.
2. Voir **Mon objectif → Changer** en haut de l’accueil. Enregistrer successivement maintien, perte et prise ; vérifier que le libellé, le baromètre et le journal se recalculent. L’annulation ne doit rien enregistrer.
3. Pour le scénario suivant, profil de test à 75 kg, calcul automatique, **Ajusté à ma journée**. Dans Mon activité, 6 000 pas et 2 000 habituels doivent montrer ≈150 kcal actives, dont ≈100 créditées avant doublons. Le déficit prévu reste identique.
4. Remplacer 6 000 par 6 500 : ≈163 kcal actives, ≈113 créditées. Un seul total, pas 12 500. Réouvrir et redémarrer : total et poids de référence conservés. Le lendemain n’a pas de crédit reporté.
5. À 6 000 pas, ajouter 30 min de marche modérée à 75 kg : ≈105 kcal pour la séance ; le total pas + marche reste ≈150, pas 255. La plus grande estimation de crédit est retenue. Ajouter 20 min de vélo modéré : +150 kcal distinctes.
6. Cocher/décocher « Déjà comprise dans mes pas » et « En plus de mon quotidien » ; vérifier les explications et les crédits. Modifier/supprimer une séance, mettre les pas à zéro, tester une autre date. Les champs invalides ne s’enregistrent pas.
7. Repasser en mode fixe ou manuel : les kcal restent affichées mais le repère ne change pas. Sans profil, demander le poids au lieu d’inventer des kcal.
8. Chercher **burger maison avec viande de bœuf**. Ouvrir Personnaliser, changer le steak et sa quantité, retirer le fromage, ajouter l’huile si utilisée. Vérifier la cuisson (cru/cuit) et les portions. Mémoriser et réutiliser la recette.
9. Essayer **burger maison avec viande de bœuf et 100 g de frites**. Après ajout du burger, les frites doivent rester à confirmer. Aucun accompagnement ne doit être perdu.
10. **Photographier une étiquette → Choisir une photo**, avec l’image fictive fournie. Attendre le lecteur, choisir 200 kcal pour une portion de 2 biscuits et entrer 3 mangés : 300 kcal. Confirmer, ajouter et enregistrer.
11. Refaire avec 500 kcal pour 100 g, poids d’une pièce 20 g, quantité 3 : même résultat. Refaire avec paquet de 300 g contenant 15 biscuits. Mémoriser puis rechercher ce produit : une quantité de 4 donne 400 kcal.
12. Prendre une vraie photo de tableau nutritionnel (pas seulement des ingrédients). Vérifier toutes les valeurs lues contre le paquet avant validation ; ne pas comparer à l’image fictive. Tester une photo claire, puis floue, une référence par portion et une référence en ml.
13. Refuser la caméra, choisir une photo existante, ouvrir les réglages, annuler le sélecteur, arrêter la lecture, réessayer hors connexion. La saisie manuelle doit toujours permettre de continuer.
14. Quitter un brouillon : confirmation demandée. Modifier une quantité ajoutée puis Appliquer. Vérifier le total du repas, l’enregistrement au journal et la réouverture.
15. Petit écran, texte agrandi, clavier ouvert, retour arrière Android, retour de l’arrière-plan, réduction des animations. Confirmer que Jaws reste silencieux.
