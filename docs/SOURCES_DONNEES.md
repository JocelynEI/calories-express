# Données alimentaires et dépense d’activité — V1.7

## Ciqual 2025

Producteur : Anses. Publication : 19 novembre 2025. Récupération : 17 septembre 2026.
Source pérenne : https://doi.org/10.57745/RDMHWY
Fichier source XLSX : https://entrepot.recherche.data.gouv.fr/api/access/datafile/666260
Licence : Etalab 2.0 / Licence ouverte, https://spdx.org/licenses/etalab-2.0.html

Le JSON embarqué est une extraction, sans modifier les nombres fournis :
`[code, nom français, énergie kcal/100g, protéines g/100g, glucides g/100g, lipides g/100g]`.
Énergie au sens du règlement UE 1169/2011 (colonne 10), protéines N×6,25
(colonne 15), glucides 16, lipides 17 du classeur. Les codes et noms sont conservés.

Sur 3 484 lignes alimentaires, 3 339 ont une énergie numérique utilisable et sont
incluses. Les chaînes « traces », « < … », « - » et les valeurs absentes ne sont
pas converties en zéro. Un macronutriment non quantifiable est `null` dans le
JSON et déclenche un indicateur de bilan partiel dans l’app.

Les résultats sont présentés comme une composition moyenne estimée, pas comme
une mesure du repas de l’utilisateur. Quantités en partie comestible, sans
conversion automatique de volume en masse. Les portions proposées pour œuf
(50 g), banane (120 g), pomme (150 g) sont des hypothèses de l’application,
explicitement signalées et modifiables, pas des portions publiées par Ciqual.

Reproduction : installer openpyxl dans un environnement de développement,
télécharger le fichier source puis exécuter :

```bash
python3 scripts/import-ciqual.py /chemin/vers/ciqual-2025.xlsx
```

La licence du code ne remplace pas celle de la base Ciqual.

## Open Food Facts

Le 17 septembre 2026, l’ancien endpoint de recherche `cgi/search.pl` renvoyait
HTTP 503. La V1.5 interroge `https://search.openfoodfacts.org/search` (Search-a-licious),
avec langues fr/en, champs limités, maximum 12 résultats, cache de cinq minutes,
huit requêtes par minute et délai de 20 secondes. Aucun appel à chaque frappe.
Le code-barres utilise une recherche exacte `code:"…"` avec filtrage strict du résultat.
Le parser conserve la compatibilité avec nutriments et le schéma nutrition >= 3.5.

La base est collaborative : la valeur et l’unité sont à vérifier sur l’étiquette.
Énergie absente : résultat écarté. Macronutriments absents : bilan partiel.
L’attribution et le lien vers la fiche source sont présentés dans l’app.
Base sous ODbL, contenus individuels sous DbCL ; consulter les conditions à
https://world.openfoodfacts.org/terms-of-use pour une distribution publique.
Pas de copie exhaustive OFF embarquée. L’utilisateur peut mémoriser ses références.

## Activité

Source : 2024 Adult Compendium, https://pacompendium.com/.
Codes et MET sont documentés dans `src/domain/activity-energy.ts`.
Calcul approximatif : MET × kg × heures, dont un MET retranché pour la dépense active.
Les valeurs standards ne sont pas une mesure individuelle ; la référence adulte
vise principalement les 19–59 ans. L’âge et la situation peuvent modifier la validité
individuelle de l’estimation. L’app n’en déduit pas une perte de masse grasse.

Les séances proposées sont des exemples rédigés pour l’application, sans exercice
maximal imposé. Elles ne sont pas des protocoles attribués au Compendium.

Ajouts V1.7, tables officielles consultées le 18 septembre 2026 :

- Course, https://pacompendium.com/running/ : codes 12028 (6,5 MET), 12030 (8,5 MET), 12050 (9,3 MET).
- Aquagym, https://pacompendium.com/water-activities/ : 18356 (3,8 MET, résistance), 18355 (5,5 MET, général), 18358 (7,5 MET, soutenu).

## Valeurs renseignées depuis une montre — V1.7

Apple distingue les calories actives de l’anneau Bouger et les calories de repos :
https://support.apple.com/en-euro/guide/watch/apd3bf6d85a6/watchos.
Ses estimations dépendent notamment des informations du profil et des capteurs :
https://support.apple.com/fr-fr/105002. Pages consultées le 18 septembre 2026.

L’application ne lit aucun capteur et n’a pas d’intégration HealthKit ou Health Connect.
L’utilisateur recopie une valeur active et confirme son périmètre. Une valeur de
séance remplace son estimation MET. Un total actif journalier remplace toutes les
estimations du jour ; ajouter ensuite une séance ne modifie pas ce total saisi.

En mode alimentaire ajusté, le crédit du total journalier est :
`max(0, total actif saisi − max(allocation habituelle, kcal des séances exclues))`.
L’allocation habituelle est proposée à partir du modèle de pas ci-dessous et reste
modifiable. Ce choix comptable empêche d’ajouter intégralement une dépense habituelle
à une base qui la couvre déjà ; ce n’est pas une conversion physiologique validée
du coefficient × 1,2. La dépense active affichée n’est pas diminuée par l’allocation.


## Pas — hypothèses V1.6

Le chiffre pour les pas est un modèle simplifié déclaré dans l’interface :
100 pas/min et 3 MET, soit une dépense active `(3 − 1) × kg × pas / 6 000`.
Le Compendium donne 3 MET pour la marche à 2,5 mph (code 17170, marche de niveau)
à https://pacompendium.com/walking/ ; **le nombre de pas ne permet pas de mesurer
cette vitesse**. La cadence de 100 pas/min est une hypothèse de l’app, pas une
mesure ni une formule individuelle validée. Aucune distance ou pente n’est déduite.

Les 2 000 pas habituels proposés sont une allocation de calcul modifiable ;
il ne s’agit pas d’un objectif sanitaire ni d’une traduction validée de la base
BMR × 1,2. Les pas au-delà peuvent créditer le mode ajusté. Pour le groupe partagé
« pas et séances comprises dans les pas », l’app conserve le maximum des
estimations. Cette règle évite leur addition complète mais ne reconstitue pas
les périodes d’activité ; elle peut sous-estimer des activités partiellement distinctes.
Les séances explicitement exclues du repère limitent aussi le crédit venant des pas.

## Recettes maison

Le burger est un exemple éditable composé d’ingrédients Ciqual, et non une
nouvelle entrée officielle Anses ni la reconnaissance du contenu d’un repas :
7259 pain à burger 75 g ; 6255 bœuf haché 15 % MG cuit 100 g ; 12726 cheddar 20 g ;
20276 tomate ronde crue 40 g ; 20031 laitue 15 g ; 11008 ketchup 15 g.
Le total est calculé sur les quantités confirmées, divisé par les portions préparées,
puis multiplié par les portions mangées. La recette conserve l’indicateur de
macronutriments partiels si un ingrédient a une valeur inconnue.

## Lecture d’étiquette

- Tesseract.js 6.0.1, Apache-2.0 : https://github.com/naptha/tesseract.js
- Tesseract.js-core 6.0.0 : https://github.com/naptha/tesseract.js-core
- Modèle français `@tesseract.js-data/fra@1.0.0/4.0.0_best_int` : https://github.com/naptha/tessdata
- Moteur et modèles servis par https://cdn.jsdelivr.net/ ; versions épinglées dans `src/services/ocr/page.ts`.
- Photo : Expo ImagePicker, compression JPEG et taille maximale 2 000 px avec ImageManipulator.
- Moteur dans une WebView native, ou un iframe isolé sur Web, chargé uniquement après une photo choisie par l’utilisateur. La photo n’est pas envoyée au CDN.
- Le texte est traité comme des données : seules des valeurs avec l’unité kcal (ou kJ convertis) sont proposées. Aucune instruction provenant de l’étiquette n’est exécutée.
- Plusieurs colonnes : choix de valeur et de référence, puis confirmation utilisateur. Aucune association de colonnes automatique en cas d’ambiguïté.
- Un poids par pièce n’est proposé que si le texte contient un nombre de pièces et un poids explicites. Sinon l’utilisateur renseigne le poids ou le paquet et le nombre de pièces.
- Les valeurs peuvent être corrigées. Pas d’estimation des kcal depuis la seule liste d’ingrédients. Aucun poids présumé pour une marque.
- Pas de reprise automatique des macronutriments de l’étiquette dans cette version. Les valeurs inconnues sont signalées comme telles.
- Les téléchargements transmettent au CDN l’adresse IP et les métadonnées réseau habituelles. La photo reste locale ; les caches temporaires de la caméra et de la manipulation sont gérés par le système.

`tests/fixtures/etiquette-fictive.jpg` est une image de test créée pour cette version,
avec des nombres fictifs. Elle ne représente pas les valeurs d’un produit commercial.
