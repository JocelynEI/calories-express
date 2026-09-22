# Calories Express — V2.7

Version de test Expo Go · 20 septembre 2026.

## Ce qui change en V2.7 — le design system

- **La palette du brief**, reprise exactement : violet `#5B48E8`, bleu nuit `#1A1B4B`, menthe `#00C4CC`, orangé `#EAC15C`, vert `#4CAF50`, violet doux `#8C62FF`, fonds `#F5F7FB` et `#FFFFFF`, textes `#1E2022` et `#6C757D`. Pour le texte posé sur les accents, une version foncée de chaque teinte, calculée pour rester lisible.
- **Plus Jakarta Sans** partout, avec la hiérarchie du brief : 28 · 20 · 16 · 32 · 14 · 12 px.
- **Cartes à 20 px de rayon, pilules à 100 px, champs à 16 px**, ombre très légère.
- **La jauge est un arc de 240°**, avec le total consommé au centre et le repère dessous. La pastille d'état loge dans l'ouverture.
- **Les moments de la journée** suivent les catégories du brief : petit-déjeuner orangé, déjeuner vert, dîner violet doux, collation menthe.
- Sur la version web, **« Effacer mon profil »** fonctionne enfin.

## Ce qui change en V2.6 — une direction premium

- **Une accroche éditoriale dans « Ma journée ».** Une composition d'assiette,
  d'avocat et de tomate donne une vraie image au repère du jour sans ajouter
  de téléchargement ni de photo générique.
- **Une image utile, pas décorative.** Le visuel rappelle l'équilibre et reste
  séparé du baromètre : le nombre de kcal reste lisible et accessible dans le
  texte de l'interface.
- **Un mouvement discret.** L'assiette flotte légèrement quand les animations
  sont autorisées, et s'immobilise automatiquement avec le réglage « réduire
  les animations » ou un lecteur d'écran.
- **Les photos de produits sont mieux lisibles.** Un voile de contraste est
  appliqué aux photographies Open Food Facts pour que la pastille du repas ne
  se perde pas dans l'image.

## Ce qui change en V2.5 — des images alimentaires

- **21 illustrations dessinées pour de bon.** Fruits, légumes, plats, féculents, protéines. Dégradés, volume, ombre portée, lumière venant toujours du même côté. Les versions précédentes empilaient des cercles et des rectangles de couleur unie — cela faisait brouillon, et c'était vrai.
- **Les cartes de repas sont menées par l'image.** Une bande illustrée pleine largeur en tête de carte, la photo réelle du produit quand Open Food Facts en a une, l'illustration sinon. Le moment de la journée est une pastille posée sur l'image, avec sa propre couleur.
- **Un bandeau illustré par bloc.** Chaque bloc thématique porte une illustration qui déborde de son bord droit, en retrait derrière le titre.
- **Quatre couleurs vraiment distinctes** pour les moments de la journée. Le déjeuner et le dîner partageaient deux violets presque identiques.

## Ce qui change en V2.4.4

- **Sans profil, les étapes reviennent.** L'application gardait en mémoire, définitivement, le fait d'avoir déjà vu le parcours guidé. Effacer son profil ne le ramenait donc jamais : on se retrouvait sans profil et sans moyen guidé d'en refaire un. La règle est maintenant celle qu'on attend — pas de profil, donc le parcours. « Passer » ne vaut que pour ce lancement.

## Ce qui change en V2.4.3

- **La création de profil étape par étape se trouve enfin.** Elle existait depuis la V2.1, mais son bouton était tout en bas du Profil, au milieu des réglages d'animation. Il est maintenant **en tête de l'écran Profil**, en grand, sous le titre. Un parcours qu'on ne trouve pas n'existe pas.

## Ce qui change en V2.4.2

- **La migration `SafeAreaView` était incomplète.** J'avais corrigé `App.tsx` et oublié cinq autres fichiers. L'avertissement se déclenche au simple chargement d'un module : un seul import oublié suffisait à le faire réapparaître au démarrage. Les cinq sont migrés, et un contrôle automatique refuse désormais la livraison si l'import déprécié revient.
- **La version s'affiche dans les journaux au démarrage.** Une ligne `----- Calories Express 2.4.2 -----` apparaît avant toute erreur : plus moyen de se tromper de dossier sans le voir.

## Ce qui change en V2.4.1 — deux correctifs

- **« Text strings must be rendered within a Text component ».** Trois espaces oubliés avant une balise fermante suffisaient : JSX les garde comme du texte, et React Native refuse tout texte qui n'est pas dans un `<Text>`. Un contrôle automatique passe maintenant les 44 écrans à l'analyseur syntaxique avant chaque livraison.
- **L'avertissement sur `SafeAreaView`.** L'application utilise désormais `react-native-safe-area-context`, la bibliothèque recommandée par Expo. Au passage, la barre du bas tient compte de la barre d'accueil des iPhone récents, ce que l'ancienne version ne faisait pas.

## Ce qui change en V2.4 — ranger

- **L'accueil tient en trois blocs.** « Ma journée » (le baromètre, les repères, les macronutriments), « Mes repas » (ajouter, refaire, la liste du jour), « Mon activité » (les pas et les séances). Chaque bloc porte un titre et une pastille de couleur, et ne parle que d'une chose. Avant, dix cartes sans lien se suivaient dans un même défilement.
- **Les minutes de Jaws ne vivent plus qu'à un seul endroit** : l'onglet Progression. Elles apparaissaient sur trois écrans à la fois.
- **De vraies photographies.** Quand un produit vient d'Open Food Facts, l'application affiche maintenant sa photo — dans la recherche et dans ton journal. Ce sont des photos prises par des contributeurs, pas des images fabriquées. Sans photo, un dessin prend le relais quand le nom est reconnu ; sinon la case reste sobre.
- **Jaws ne bouge plus.** Il est redevenu une illustration fixe.
- **Plus de valeurs d'exemple dans la création de profil.** Les nombres gris dans les champs se lisaient comme des réponses déjà saisies.

## Ce qui était arrivé en V2.3

- Jaws d'une seule pièce, qui ne se découd plus.
- La barre du bas n'est plus coupée, et les libellés non plus quand la taille de texte est augmentée.

## Il n'y a pas de compte

L'application ne demande **ni e-mail, ni mot de passe**, et ne crée aucun compte. « Créer son profil » veut dire enregistrer sur ce téléphone les quelques informations qui servent à estimer un repère : prénom, objectif, âge, taille, poids et activité habituelle.

Rien n'est envoyé sur un serveur, il n'y a pas de synchronisation entre appareils, et personne d'autre que toi n'y a accès. C'est aussi la raison pour laquelle **Profil → Sauvegarder mes données** existe : sans compte, la sauvegarde est à ta charge.

Un vrai compte demanderait un serveur, une base de données, une politique de confidentialité et la conformité RGPD — les repas et le poids sont des données de santé. C'est un chantier à part entière, volontairement laissé de côté.

## Lancer sur ton Mac

1. Dans le Terminal qui fait tourner l’ancienne version, appuie sur **Ctrl+C**.
2. Décompresse le ZIP dans **Téléchargements**. Le dossier extrait doit s’appeler `Calories-Express-V2.7-2026-09-22`.
3. Colle uniquement cette commande :

```bash
bash ~/Downloads/Calories-Express-V2.7-2026-09-22/Lancer-Calories-Express.command
```

Le lanceur se place dans son propre dossier et installe les dépendances.
Node.js 22.13 ou supérieur est requis. Pas de sudo ni d’installation globale.
Laisse le Terminal ouvert, Mac et téléphone sur le même Wi-Fi. Sur iPhone,
scanne avec l’appareil photo puis ouvre Expo Go. Sur Android, utilise Expo Go.

Si le dossier a un autre nom : tape `bash ` (avec l’espace), puis glisse le
fichier `Lancer-Calories-Express.command` dans Terminal et appuie sur Entrée.
Ne recopie pas l’invite `jocelynlebon@… %`.

Si Expo demande une connexion : arrête avec Ctrl+C, puis :

```bash
cd ~/Downloads/Calories-Express-V2.7-2026-09-22 && npx expo login
```

Connecte le même compte que dans Expo Go, précédemment **jojaws**, puis relance.
Le mot de passe est à saisir dans Terminal, jamais dans une conversation.

Si le Wi-Fi ne laisse pas passer la connexion :

```bash
bash ~/Downloads/Calories-Express-V2.7-2026-09-22/Lancer-Calories-Express.command --tunnel
```

L’outil de tunnel est installé dans le projet. En cas de « remote gone away »,
reviens au Wi-Fi : Ngrok est un service externe.

## Jaws animé et les aliments en mouvement

**Jaws est découpé en trois calques** — tête, bras droit, buste — animés
séparément. Il respire en permanence, et joue une pose selon le contexte :
il salue dans l'accueil et après un repas, acquiesce après une séance, présente
quand il explique. Les calques sont dans `assets/jaws-head.png`, `jaws-arm.png`
et `jaws-body.png` ; le rendu d'origine reste dans `jaws-avatar-v13.png`.

Pour aller plus loin un jour, la voie la plus nette serait de fournir **quelques
rendus supplémentaires du personnage** dans d'autres poses : l'application
pourrait alors passer de l'un à l'autre au lieu de déformer une seule image.
La découpe actuelle autorise des mouvements amples mais pas une gestuelle
complète.

**Les aliments** sont dix illustrations décrites dans
`src/data/foods-art.json`, en formes simples. Trois mises en scène existent :
orbite, pluie et défilé. Tout est dessiné sur l'appareil, sans fichier vidéo :
`<FoodMotion kind="orbit" />` suffit à en poser une où tu veux, et ajouter un
aliment ne demande que quelques lignes dans le fichier de données.

## Le premier lancement

Au tout premier démarrage, l'application ouvre un parcours de six étapes :
bienvenue, ton prénom, ton objectif, toi en chiffres, ton activité habituelle,
puis ton repère. Chaque étape a sa propre animation ; la dernière dessine
l'anneau et fait monter le nombre, puis déplie le calcul — besoins au repos,
maintien estimé, écart prévu.

**Rien n'est enregistré avant le dernier bouton.** « Passer » ne touche ni au
profil ni au journal, ce qui compte surtout si tu rejoues le parcours plus tard
avec des semaines de saisie derrière toi.

Le parcours **n'apparaît qu'une fois**. Il ne s'affiche pas si un profil est
déjà enregistré : en mettant à jour depuis une version précédente, tu ne le
verras donc pas. Pour le revoir : **Profil → Refaire la création de mon
profil**. Il repart à zéro et n'écrase ton profil actuel qu'à la dernière étape.

Si les animations sont réduites — réglage de l'application, préférence du
téléphone ou lecteur d'écran actif — les étapes s'affichent directement dans
leur état final, sans mouvement. La barre d'avancement est annoncée comme telle
aux lecteurs d'écran, et chaque champ signale ce qui lui manque plutôt que de
refuser sans expliquer.

## Les minutes de Jaws

Six séquences courtes, entre quinze et vingt-cinq secondes chacune, accessibles
depuis l’accueil, depuis Progression et depuis le Profil :

| Séquence | Ce qu’elle explique |
| --- | --- |
| Ton repère en une minute | Maintien, écart prévu, objectif alimentaire, et pourquoi le déficit ne se retire pas deux fois. |
| Lire une étiquette | La colonne 100 g, la colonne par portion, puis ta quantité. |
| Les kcal de tes pas | L’hypothèse à 100 pas/minute et 3 MET, les pas déjà couverts par la base, la règle anti-doublon. |
| Le poids d’un matin | Pourquoi la balance saute, et pourquoi c’est la moyenne qu’il faut lire. |
| Composer une assiette | Des repères de volume, les protéines, cru contre cuit. |
| Une journée différente | Ce que l’application ne demandera jamais : compenser un repas ou se punir le lendemain. |

**Ce que ces séquences ne sont pas.** Ce ne sont pas des fichiers vidéo : chaque
scène est un dessin animé à l’écran, en quelques kilo-octets, qui fonctionne
sans connexion. Les regarder n’ajoute jamais de minutes, de kcal ni d’activité à
ton journal. Elles sont explicatives et non médicales, et les sources citées à
la fin de chaque séquence sont celles déjà utilisées par l’application.

Appuie à droite pour avancer, à gauche pour revenir, ou utilise les boutons
**Précédent** et **Suivant**. Si les animations sont réduites — par ton réglage
dans Profil, par une préférence de ton téléphone ou par un lecteur d’écran —
l’avance automatique est désactivée et la séquence attend ton geste.

Si tu veux plus tard remplacer une scène par une vraie vidéo, le champ
`videoUri` est déjà prévu dans `src/domain/stories.ts`. Il faudra alors ajouter
`expo-video` et fournir le fichier : l’application ne télécharge aucune vidéo
aujourd’hui.

## Retrouver et corriger une journée passée

Sous ton prénom, une flèche recule d’un jour, l’autre avance. Le bouton
**Aujourd’hui** revient au jour en cours dès que tu t’en éloignes. Les journées
futures restent fermées.

Ce que tu ajoutes pendant que tu consultes une journée passée est daté de cette
journée, et un bandeau te le rappelle. Un repas ajouté sur un jour passé est
enregistré à midi, faute de connaître l’heure réelle. Dans **Journal**, les sept
dernières journées contenant une saisie sont proposées en puces, pour sauter
directement à la bonne.

Une entrée se corrige avec la flèche à droite de sa carte : le moment, les
aliments et les quantités restent modifiables, et le total se recalcule. Un
aliment enregistré avant la V1.6 n’a pas sa référence de calcul : dans ce cas
l’application le dit et propose de le retirer puis de l’ajouter à nouveau,
plutôt que d’inventer une quantité.

Dans **Progression**, chaque barre du graphique ouvre sa journée.

## Noter mon poids

Dans **Progression**, la carte **Mon poids** accepte une pesée par journée ; une
nouvelle valeur remplace la précédente. La pesée concerne la journée consultée,
ce qui permet de rattraper une pesée oubliée.

La courbe trace **une seule ligne** : la moyenne mobile sur sept jours. Les
pesées elles-mêmes restent en gris, en fond. C’est volontaire : d’un matin à
l’autre, le chiffre varie surtout avec l’eau, le sel, le transit et l’heure de
la pesée, et c’est la moyenne qui décrit quelque chose.

La phrase sous la courbe donne une pente en kilos par semaine, calculée par
moindres carrés sur les vingt-huit derniers jours. En dessous de quatre pesées
étalées sur deux semaines, l’application écrit que la tendance n’est pas encore
lisible au lieu d’afficher un chiffre. **Aucune projection n’est calculée** : ni
date d’arrivée, ni poids futur. Une pente décrit le passé ; elle ne le prolonge
pas.

## Sauvegarder mes données

Dans **Profil → Sauvegarder mes données**, le bouton prépare un texte JSON
contenant le profil, les repas, l’activité, les pesées et les aliments
mémorisés. Il est produit sur le téléphone : rien n’est envoyé sur un serveur.
Tu peux le sélectionner pour le copier, ou le partager vers une note ou un
courriel.

Cette version ne réimporte pas encore une sauvegarde. Le fichier sert à
conserver et à relire tes données, pas à les réinstaller automatiquement.
C’est utile parce que tout vit sur ce téléphone : il n’y a ni compte, ni
synchronisation entre appareils, et désinstaller Expo Go effacerait le journal.

## Faire évoluer le repère avec l’activité

Les kcal d’activité sont visibles quel que soit le mode. Si le **repère alimentaire**
ne change pas, vérifie ce réglage : la mise à jour conserve le mode précédemment choisi.

1. Enregistre ton **Profil**, si ce n’est pas déjà fait.
2. Ouvre **Mon activité → Activer l’ajustement avec mon activité**, ou **Mon objectif → Changer** sur l’accueil.
3. Choisis **Calculer avec mon profil**, puis **Ajusté à ma journée**.
4. Vérifie la base et l’aperçu du repère, puis **Enregistrer mon objectif**.
5. Dans **Mon activité → Ma séance**, renseigne l’activité, la durée, le poids et l’intensité ; vérifie les kcal puis enregistre. Ou choisis **Saisir mes kcal** pour utiliser une valeur connue.
6. Dans **Préciser la note et la prise en compte**, laisse **Activité supplémentaire** activé pour une séance supplémentaire.
   Désactive-le pour une activité habituelle déjà couverte par la base.

**Mode fixe** : maintien calculé avec le niveau d’activité habituel du profil.
Les kcal des pas et des séances sont affichées, sans être ajoutées une seconde fois.

**Mode ajusté** : maintien de base = métabolisme de repos estimé × 1,2.
Le coefficient d’activité habituel est remplacé par cette base de journée calme.
Les calories actives des pas au-delà du quotidien et des séances supplémentaires sont ensuite ajoutées au
maintien et à l’objectif alimentaire. La base peut donc être plus basse que ton
ancien repère. Le déficit prévu reste le même.

**Mode manuel** : la valeur choisie reste fixe. Passe au calcul automatique
pour bénéficier de l’ajustement aux pas et aux séances.

L’ajustement automatique lié au poids reste −300 kcal pour une perte, +250 kcal
pour une prise et 0 pour le maintien. Ce point de départ est personnalisable,
pas une promesse de résultat. Le guide « Jaws m’explique le déficit » est conservé.

### Comprendre les calories de l’activité

La formule approximative utilise les MET standards du Compendium 2024 :

- dépense totale de la séance ≈ MET × poids (kg) × durée (heures) ;
- calories actives ≈ (MET − 1) × poids × durée, après retrait du repos déjà compté.

Exemple fictif : 30 min de marche modérée à 3,8 MET pour 80 kg donnent environ
152 kcal totales, dont **112 kcal actives**. Seules les 112 kcal actives sont
prises en compte dans le mode ajusté, si la séance est supplémentaire.
Ce sont des estimations générales, pas des mesures ni des calories de graisse
perdues. Les MET adultes standards peuvent être moins représentatifs selon
l’âge, la condition physique et la situation individuelle.

Le poids est conservé avec une nouvelle séance : changer ensuite le profil ne
réécrit pas cette estimation passée. Pour les anciennes séances sans poids ni
intensité, le poids actuel et une intensité légère sont utilisés et signalés.
Une nouvelle séance sans estimation ou kcal renseignées ne peut plus être enregistrée.
Pour **Autre activité**, recopie les kcal connues, ou choisis une activité proposée.
Les anciennes séances incomplètes restent dans le journal avec un bouton pour les corriger.

### Recopier les calories de ma montre

Deux saisies distinctes évitent les doublons :

| Ce que tu connais | Où le saisir | Effet sur le bilan |
| --- | --- | --- |
| Les kcal actives d’une séance | Ma séance → Saisir mes kcal | Remplace l’estimation de cette séance, puis participe au cumul avec les pas et autres séances. |
| Les kcal actives de toute la journée | Total montre | Remplace l’ensemble du cumul estimé pour ce jour. |

Sur Apple Watch, le total de l’anneau **Bouger** correspond aux calories actives.
Pour une séance, recopie les calories actives de l’exercice. N’utilise pas un
total incluant les calories de repos : le repos est déjà couvert par la base.
La saisie est manuelle ; aucune connexion à Apple Santé, Garmin ou une montre
n’est mise en place. Ces chiffres restent des estimations de l’appareil.

Le mode Total montre demande confirmation du périmètre « pas + séances inclus ».
Si la montre indique 620 kcal, le bilan montre 620, et non 620 + pas + séances.
Si tu bouges ensuite, mets à jour cette valeur. **Remplacer le total** ne l’ajoute
pas à l’ancien. **Revenir au cumul des pas et séances** retire la valeur montre
après confirmation et retrouve les estimations, sans effacer le journal.

Pour ajuster l’objectif, les **kcal habituelles déjà couvertes par la base** sont
retranchées du total actif. Le formulaire propose une valeur selon le poids et
les pas habituels, à vérifier et modifier. C’est une hypothèse de l’application,
pas une mesure de la montre ni une équivalence validée de la base × 1,2. Les séances
marquées habituelles limitent aussi le crédit. Sans profil valide, la dépense
saisie reste visible et aucun crédit alimentaire personnalisé n’est calculé.

### Les pas et les doublons

Les pas donnent maintenant des **kcal actives estimées**. Le modèle de cette
version suppose une marche à 100 pas/minute et 3 MET :
`kcal actives ≈ (3 − 1) × poids × pas / 6 000`.
Ce sont des hypothèses d’application, pas une mesure de l’allure, de la distance
ou de la dépense de ton téléphone. Terrain, pauses, condition physique et
longueur des pas font varier le résultat. L’app ne lit pas automatiquement une montre.

Exemple fictif pour 75 kg : 6 000 pas donnent environ **150 kcal actives**.
Par défaut, 2 000 pas sont considérés comme déjà couverts par la base calme.
Ce nombre est **modifiable**, ne constitue pas un objectif de santé et n’est
pas une équivalence validée du coefficient 1,2. Dans cet exemple, seuls les
4 000 pas supplémentaires apportent environ **100 kcal** au repère ajusté.
Les valeurs sont un point de départ indicatif à adapter.

Pour les pas et les séances marquées **Cette séance est comprise dans mes pas**, l’app retient
la plus grande des deux estimations, au lieu de les additionner. La marche et la course sont
marquées ainsi par défaut. Active ce réglage pour toute autre séance comprise dans
ton total de pas. Si une séance correspond à une période sans pas enregistrés,
tu peux désactiver ce réglage. Cette règle prudente peut sous-estimer des périodes
partiellement distinctes : l’app ne connaît pas les horaires de tes pas.

Les séances marquées comme habituelles ne sont pas réintroduites dans le crédit
par les pas. Les autres activités, comme une séance de vélo, s’ajoutent. Le poids
et le nombre de pas habituels sont conservés avec chaque nouvelle saisie du jour.
Pour les anciens pas sans poids enregistré, le poids actuel est utilisé et signalé.
Une idée consultée ne crée jamais une activité faite.

## Ajouter un repas sans connaître les kcal

1. Appuie sur **Ajouter un repas**.
2. Écris par exemple **150 g de riz cuit et 2 œufs**.
3. Sélectionne le riz correspondant à ce que tu as mangé, vérifie **150 g**, ajoute.
4. La saisie restante garde les œufs. Sélectionne par exemple **Oeuf dur**.
   Une pièce est proposée à 50 g comestibles : cette portion indicative reste modifiable.
5. Vérifie les aliments ajoutés, le moment du repas et le total, puis enregistre.

La recherche accepte accents, pluriels et quantités en g/kg ou ml/cl/l.
Chaque composant est confirmé : aucun aliment non reconnu n’est ajouté en secret.
Les noms Ciqual précisent la préparation. Un riz cru et un riz cuit n’ont pas
la même référence. Une marque ou une recette peuvent différer de la moyenne.

Les valeurs Ciqual sont **pour 100 g de partie comestible**. Les volumes ne sont
pas convertis silencieusement en poids. Pour une pièce dont le poids est inconnu,
l’app demande les grammes ; les hypothèses pour œuf, pomme et banane sont signalées.

Pour une marque, écris son nom ou les chiffres du code-barres dans le même champ,
puis **Chercher une marque en ligne**. Choisis le produit, vérifie sur l’étiquette
si les valeurs sont pour 100 g ou 100 ml et indique la quantité consommée.
Le code-barres peut être saisi au clavier. Une référence trouvée peut être mémorisée hors ligne. La caméra sert au tableau nutritionnel, pas au code-barres.

Si tu connais les kcal de l’étiquette ou d’un plat, **Je connais les kcal : saisir
une étiquette** permet de les entrer. Choisis 100 g, 100 ml ou Ma portion.
Exemple : 150 kcal / 100 g et 250 g mangés donnent **375 kcal**.
Les macronutriments sont facultatifs, avec un bilan signalé comme partiel.

Modifier une quantité déjà ajoutée demande **Appliquer** avant d’enregistrer.
Une description encore en cours doit être traitée ou effacée avant validation.
Les références personnelles peuvent être oubliées sans supprimer les repas passés.

## Un burger ou un autre plat maison

1. Dans **Ajouter un repas**, écris **burger maison avec viande de bœuf**.
2. Appuie sur **Personnaliser mon burger**. Les quantités proposées sont un exemple à modifier, pas la composition reconnue de ton repas.
3. Ajuste les ingrédients et leur poids, notamment le steak (référence cuite), le pain, le fromage, l’huile et la sauce. Pour remplacer, retire l’ingrédient puis cherche le bon en dessous.
4. Indique combien de portions donne toute la recette et combien tu en as mangé.
5. Confirme les ingrédients, ajoute le plat, puis enregistre le repas.

**Composer un plat maison** fonctionne aussi sans modèle prérempli.
Une recette mémorisée apparaît dans la même recherche. Sa valeur est par portion.
La base générique ne connaît pas chaque recette personnelle ni toutes les marques.

## Photographier une étiquette et compter les biscuits

1. **Ajouter un repas → Photographier une étiquette**.
2. Prends une photo nette du **tableau nutritionnel**, de face, avec la ligne Énergie et les en-têtes de colonnes. Tu peux choisir une photo existante.
3. Vérifie les valeurs lues. Si plusieurs kcal sont proposées, choisis celles d’une colonne puis indique **100 g**, **100 ml**, **1 pièce** ou **Une portion de plusieurs pièces**.
4. Pour 100 g et un compte de biscuits, renseigne le poids d’un biscuit. L’app peut le déduire d’une mention explicite comme « 2 biscuits (40 g) », ou calculer le poids net du paquet divisé par le nombre total de biscuits. Vérifie cette proposition.
5. Indique combien tu en as mangé. Confirme les valeurs, ajoute, puis enregistre le repas.

Exemple **fictif**, sans rapport avec les valeurs d’une marque : 500 kcal pour
100 g et 20 g par biscuit donnent 100 kcal par biscuit ; 3 biscuits = 300 kcal.
Une colonne « 200 kcal pour 2 biscuits » donne le même résultat, **pas** 200 kcal
par biscuit. Un poids inconnu n’est jamais inventé à partir du nom ou de la photo.
La liste des ingrédients seule ne permet pas ce calcul.

Le produit peut être mémorisé : la prochaine fois, cherche son nom et change
seulement le nombre de biscuits. Les macronutriments de l’étiquette ne sont pas
extraits automatiquement dans cette version ; le bilan les signale comme partiels.

Le lecteur **Tesseract.js 6.0.1** tourne sur l’appareil. Il télécharge son moteur,
son module WebAssembly et le modèle français depuis **jsDelivr** : une connexion
Internet est nécessaire, sans compte ni clé API. Ces téléchargements transmettent
les données de connexion habituelles au CDN, **pas la photo**. L’image n’est ni
envoyée à une IA distante, ni ajoutée au journal ; des copies temporaires peuvent
rester dans le cache système. Aucun microphone n’est demandé par le build de l’app.

Une photo floue, courbée, sombre ou mal cadrée peut donner un résultat erroné ou
aucun résultat. Une confirmation est toujours nécessaire. En cas de refus caméra,
choisis une image existante ou modifie les autorisations dans les réglages.
En cas de panne Internet, annule la lecture et recopie les valeurs.

## Les bulles de Jaws

Après un repas, une bulle peut proposer une marche ou une pause mobilité.
Si tu as déjà bougé, elle reconnaît l’activité ; le soir tard, elle suggère de
récupérer. Ces messages ne dépendent pas du nombre de kcal du repas et n’invitent
pas à le compenser. Les suggestions sont écrites, sans voix et sans IA distante.

Tu peux fermer la bulle, choisir **Pas aujourd’hui**, ou **Désactiver ces conseils**.
Le réglage **Profil → Conseils après un repas** permet de les réactiver.
Consulter une idée n’ajoute ni minutes ni kcal au journal.

## Données et sources

Le profil, les repas, l’activité, les pesées et les préférences sont conservés
sur l’appareil. Les anciennes clés de stockage sont maintenues et le slug Expo
ne change pas : le journal de la V1.7 est retrouvé. Un échec de sauvegarde est
signalé. Dans Expo Go, conserver les mêmes clés ne garantit pas de retrouver
l’espace de stockage si Expo change l’identité de l’expérience : il n’y a pas de
synchronisation entre appareils. Ne désinstalle pas Expo Go pour mettre à jour.

Depuis la V1.8, le profil et les repas sont **relus et validés à l’ouverture**.
Une entrée abîmée est écartée sans faire perdre les autres, et un profil
illisible retombe sur ses valeurs par défaut plutôt que de propager une valeur
invalide jusqu’au repère. Les écritures sont regroupées : saisir une quantité ne
réécrit plus tout le journal à chaque frappe, et une mise en arrière-plan force
l’enregistrement immédiat.

La recherche locale ne transmet rien. Les séquences animées et la courbe de
poids sont entièrement locales : aucune requête, aucun fichier téléchargé.
La recherche de marques envoie seulement les mots recherchés ou le code-barres à
Open Food Facts, avec les données techniques de connexion. Le profil, les repas,
les activités et les pesées ne sont jamais envoyés.

- [Anses, table Ciqual 2025, DOI 10.57745/RDMHWY](https://doi.org/10.57745/RDMHWY), publiée le 19/11/2025, consultée le 17/09/2026. Sous-ensemble de 3 339 références ; détails de transformation et licence dans `docs/SOURCES_DONNEES.md`.
- [Compendium 2024 des activités physiques](https://pacompendium.com/) : valeurs MET et codes dans le calculateur.
- [Apple : suivi de l’activité quotidienne](https://support.apple.com/en-euro/guide/watch/apd3bf6d85a6/watchos) et [précision des mesures](https://support.apple.com/fr-fr/105002).
- [Open Food Facts : API](https://openfoodfacts.github.io/openfoodfacts-server/api/) et [service Search-a-licious](https://search.openfoodfacts.org/openapi.json). Attribution ODbL dans l’app ; valeurs collaboratives à vérifier sur l’étiquette.
- [Assurance Maladie](https://www.ameli.fr/assure/sante/themes/surpoids-obesite-adulte/modifier-quotidien) et [NIDDK](https://www.niddk.nih.gov/bwp) : explications de bilan énergétique conservées de V1.3.
- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

## Vérifications et publication

```bash
npm run check
npm run test:logic
npm run test:activity-ui   # nécessite react-test-renderer installé
npx expo-doctor
npx expo export --platform all
```

Résultats et parcours de test sur téléphone : `docs/RECETTE_V19.md`.
Les exports techniques ne sont pas des APK/IPA signés ni une publication.
La validation sur iPhone et Android, les builds signés, les fiches des stores et
les informations de confidentialité restent à finaliser avant distribution publique.
Enregistrer l’usage de l’API Open Food Facts et un contact d’application fait aussi
partie de cette préparation. L’icône de l’app native ne remplace pas celle d’Expo Go.
