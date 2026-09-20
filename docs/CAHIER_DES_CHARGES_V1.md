# Cahier des charges — Calories Express V1.1 test

## Proposition de valeur

Calories Express aide le grand public à comprendre sa journée alimentaire sans transformer chaque repas en séance de calcul. La saisie doit prendre quelques secondes et chaque estimation doit rester corrigeable.

## Public

Adultes souhaitant suivre simplement leurs apports énergétiques. La V1 n’est pas conçue pour les mineurs, la grossesse, les troubles des conduites alimentaires ou le suivi d’une pathologie.

## Navigation

| Écran | Rôle principal |
| --- | --- |
| Aujourd’hui | Voir le baromètre, les repères nutritionnels et les derniers repas |
| Journal | Vérifier les entrées et supprimer une erreur |
| Ajouter | Décrire, photographier ou sélectionner un repas |
| Progression | Lire les sept derniers jours sans jugement quotidien |
| Profil | Choisir l’objectif et calculer ou saisir le budget calorique |

Lina, le professeur-guide de l’application, intervient sur Aujourd’hui, Ajouter et Profil. Son rôle est d’expliquer le fonctionnement sans se présenter comme une professionnelle de santé.

## Baromètre

Le baromètre compare les calories centrales estimées de la journée à l’objectif actif.

| Avancement | Message | Couleur |
| --- | --- | --- |
| 0 % | Prêt pour ta journée | Bleu nuit |
| 1 à 54 % | Ta journée progresse | Bleu nuit |
| 55 à 89 % | Tu approches de ta zone cible | Vert sauge |
| 90 à 105 % | Zone cible atteinte | Doré |
| Plus de 105 % | Objectif dépassé aujourd’hui | Corail doux |

L’application affiche simultanément la valeur centrale, la quantité restante et une fourchette par repas. Le dépassement ne déclenche ni alarme ni message culpabilisant.

## Calcul de l’objectif

Deux modes sont disponibles :

1. Objectif manuel choisi par l’utilisateur.
2. Estimation automatique basée sur Mifflin–St Jeor, un facteur d’activité et un ajustement modéré : 0 kcal pour le maintien, –300 kcal pour une perte progressive et +250 kcal pour une prise progressive.

Les activités enregistrées ne sont pas automatiquement ajoutées au budget dans cette V1 afin d’éviter le double comptage avec le facteur d’activité habituel.

## Saisie des repas

### Phrase simple

- reconnaissance locale sans connexion ;
- autocomplétion visible dès deux lettres ;
- suggestions sélectionnables pendant la frappe ;
- gestion d’expressions équivalentes et de quantités simples ;
- gestion de connecteurs naturels tels que « et » et « avec » ;
- affichage des aliments reconnus avant validation ;
- ajustement des quantités ;
- bascule vers le mode manuel si rien n’est reconnu.

### Saisie manuelle

- recherche dans le catalogue ;
- sélection de plusieurs aliments ;
- augmentation, diminution ou suppression d’une portion ;
- total recalculé instantanément.

### Photo

- photo prise avec la caméra ou choisie dans la galerie ;
- aperçu avant validation ;
- confirmation manuelle des aliments en V1 ;
- aucun résultat d’analyse fictif.

## Données et confidentialité

- conservation locale pour la V1 ;
- accès caméra demandé uniquement au moment de prendre une photo ;
- aucun partage public des repas ;
- suppression d’une entrée depuis le journal ;
- politique de confidentialité et suppression complète des données à finaliser avant diffusion publique.

## Critères d’acceptation

- Ajouter le repas test produit 370 kcal au centre de la fourchette.
- Deux bananes et un yaourt produisent trois portions et 320 kcal centrales.
- Ajouter ou supprimer un repas actualise le baromètre sans redémarrage.
- Modifier l’objectif actualise le baromètre et les repères nutritionnels.
- Effacer le profil rétablit un profil à créer sans supprimer le journal.
- Les entrées restent disponibles après fermeture puis réouverture.
- Refuser la permission caméra n’empêche pas les saisies par phrase ou manuelles.
- Aucun texte ne présente l’estimation comme un diagnostic ou une valeur certaine.

## Étapes avant publication

1. Valider les aliments et macronutriments avec Ciqual.
2. Tester l’utilisabilité avec un petit groupe d’adultes.
3. Ajouter les mentions légales, la politique de confidentialité et l’effacement complet des données.
4. Décider si un compte et une synchronisation sont nécessaires.
5. Brancher l’analyse photo seulement après mesure de sa précision.
6. Réaliser les tests bêta iOS et Android.
7. Préparer les fiches et captures des stores.
