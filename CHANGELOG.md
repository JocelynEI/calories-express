# V3.0 — 26 septembre 2026

« Il faudrait *Ajouter un repas* et *Ajouter une activité* sans rien
préremplir la première fois, et que remplir des infos se passe après. »

## Pourquoi c'était juste

La V2.9 affichait la phrase déjà remplie — « J'ai fait de la natation pendant
30 min » — et son résultat, avant que personne n'ait rien demandé. C'était
lisible, mais l'écran affirmait une séance qui n'avait pas eu lieu, et un doigt
sur « Enregistrer » suffisait à l'inscrire pour de bon. Une valeur préremplie
se prend pour une réponse.

## Deux temps, comme pour un repas

Au repos, « Mon activité » ne montre qu'un bouton : **« Ajouter une
activité »**, de la même forme et du même verbe que « Ajouter un repas », avec
une ligne qui annonce ce qu'il fait — ton sport et sa durée, l'application
estime les calories dépensées.

Une fois touché, la phrase s'ouvre **sur place**, avec ses blancs vides :

> J'ai fait *quelle activité ?* pendant *combien de temps ?*

Le premier blanc s'ouvre tout seul, le second s'enchaîne dès que le premier est
rempli. Le chiffre n'apparaît qu'une fois les deux choisis, et le bouton
« Enregistrer » avec lui : tant qu'il manque quelque chose, l'application ne
prétend rien. « Annuler » referme tout.

## Rien n'est mémorisé

Chaque séance repart de zéro, y compris juste après en avoir enregistré une.
On ne peut pas inscrire par inadvertance le sport de la veille.

## Côté repas aussi

Dans « Saisir mes valeurs », la quantité consommée ne vaut plus « 100 » par
défaut. Quelqu'un qui mangeait 250 g et ne touchait pas au champ enregistrait
100 g sans le savoir. Le champ part vide, avec un exemple en gris, et
l'application refuse toujours d'ajouter un aliment sans quantité.

## Ce qui n'a pas changé

Le moteur de calcul, le formulaire complet, les félicitations de Jaws, et la
place du bloc sur l'accueil — l'activité reste en deuxième, juste sous le
baromètre.

# V2.9 — 26 septembre 2026

« La fonctionnalité qui estime n'est pas assez mise en avant. Il faut que ce
soit plus simple à comprendre. »

## Ce qui n'allait pas

La V2.8 avait réduit la saisie à deux rangées de boutons. Mais deux rangées de
boutons ne disent pas ce qu'elles font : on voyait des choix, pas un calcul. Et
le bloc se trouvait en troisième position, après le baromètre et après les
repas — il fallait descendre pour découvrir une fonction qu'on ne savait pas
chercher.

## Une question, une phrase

Le bloc s'ouvre maintenant sur une question — **« Combien ai-je dépensé ? »** —
et la réponse se lit comme une phrase à trous :

> J'ai fait **de la natation** pendant **30 min**

Les deux mots soulignés s'ouvrent au toucher. Rien à lire avant de comprendre :
la phrase se termine toute seule dans la tête de celui qui la lit, et le
chiffre se met à jour sous ses yeux. La dépense s'affiche en grand, écrite en
toutes lettres — « kilocalories dépensées », pas « kcal ».

Chaque activité a sa tournure avec l'article (« du vélo », « de la marche »,
« de l'aquagym ») : l'étiquette du formulaire aurait donné « J'ai fait
Natation », qui n'est pas du français. Un texte qui parle mal se fait relire
deux fois, et c'est exactement ce qu'on cherchait à éviter.

## L'accueil, dans l'ordre

« Mon activité » passe en deuxième position, juste sous le baromètre et avant
les repas. On ouvre l'application, on voit son repère du jour, puis
immédiatement « Combien ai-je dépensé ? ». Les repas suivent : on les saisit
plus tard dans la journée, une fois qu'on a mangé.

## Plus de choix, sans plus de complexité

Huit activités au lieu de six (fractionné et aquagym rejoignent la liste) et
sept durées au lieu de quatre, de 10 à 90 minutes. Elles ne s'affichent que
lorsqu'on ouvre le mot correspondant : la carte au repos ne montre qu'une
phrase, un chiffre et un bouton.

## Ce qui n'a pas changé

Le moteur de calcul, à la virgule près. Le formulaire complet — intensité,
poids de la séance, calories de la montre, notes — reste accessible d'un lien
et n'a rien perdu. Les félicitations de Jaws non plus, et toujours aucune
version négative : quand il n'y a rien à saluer, rien ne s'affiche.

# V2.8 — 25 septembre 2026

« Une personne qui n'y connaît rien met 30 min de natation, et l'application
lui donne ses dépenses. » C'était l'idée de départ ; le calcul la tenait déjà,
le formulaire non.

## Ce qui bloquait

Le moteur d'estimation était bon : valeurs MET du Compendium 2024, poids,
durée, et même une déduplication entre la marche saisie et les pas comptés.

C'est la saisie qui demandait trop. Pour enregistrer trente minutes de piscine,
il fallait passer par l'activité, le mode d'estimation, la durée, le poids,
l'intensité — libellée « Crawl à allure moyenne » —, un interrupteur sur les
pas, puis une section « précisions ». Et sans poids, aucun chiffre ne
s'affichait : quelqu'un qui découvrait l'application restait devant un
formulaire, sans réponse.

## La saisie rapide

Dans « Mon activité », sur l'accueil : six activités, quatre durées, la dépense
qui s'affiche en direct, un bouton. Deux gestes.

L'intensité retenue est l'allure habituelle, **écrite dans la séance** au
moment de l'enregistrement. Le formulaire complet reste accessible d'un lien,
avec tous ses réglages.

## Estimer sans profil

Sans poids connu, l'application n'attend plus : elle estime avec une moyenne de
70 kg et le dit, à l'écran comme dans les félicitations. La séance retient
qu'elle a été estimée ainsi ; le jour où un vrai poids existe, elle se
recalcule toute seule.

Une limite volontaire : **estimer n'est pas créditer**. Sans profil, la dépense
s'affiche mais n'augmente pas le repère alimentaire du jour, qui n'existe pas
encore.

### Le piège évité

En passant l'intensité par défaut à « habituelle », j'allais du même coup
recalculer à la hausse toutes les séances déjà enregistrées sans intensité —
des mois plus tard, sans que personne n'ait rien demandé. Un test existant l'a
attrapé.

Le moteur garde donc « facile » pour les séances anciennes ; seule la saisie
choisit « habituelle » pour les nouvelles.

## Les félicitations

Trois règles tiennent tout le fichier `praise.ts` :

1. **On félicite ce qui a été fait, jamais ce qui a été évité.** Rien ne
   complimente le fait d'avoir peu mangé. Une journée sous le repère reçoit un
   mot sur les repas notés, pas sur le total.
2. **Quand il n'y a rien à dire, on ne dit rien.** Chaque fonction peut
   renvoyer « rien ». L'absence de carte n'est jamais un reproche : il n'existe
   aucune version négative de cette carte.
3. **Le mérite revient à la personne.** « Tu as nagé 30 minutes », pas
   « objectif atteint ».

Concrètement : après une séance, un message qui varie selon la durée et le type
d'activité — cinq minutes de mobilité sont saluées comme une habitude qui
s'installe, pas minimisées. Sur l'accueil, une carte quand la journée est
complète. Et aux paliers de régularité : 3, 7, 14 et 30 jours, jamais entre les
deux — un compliment quotidien deviendrait une obligation quotidienne.

Une seule carte s'affiche à la fois.

## Vérifications

- 147 vérifications automatiques, dont 19 nouvelles : estimation sans profil,
  poids supposé remplacé par le vrai, poids aberrant toujours refusé, stabilité
  des anciennes séances, variété et déterminisme des félicitations, silence
  quand la journée n'est pas remplie, absence de tout vocabulaire de
  restriction ou de reproche.
- Garde-fous : textes bruts, API dépréciées, graisses — 48 fichiers.
- Références TypeScript : 73 fichiers, aucune erreur.
- Aperçu du bloc de saisie et des cartes rendu avant livraison. La police n'a
  pas pu y être chargée : l'aperçu montre la mise en page, pas les glyphes
  exacts.

---

# V2.7 — 22 septembre 2026

Refonte à partir du moodboard et du design system « Calories Express ».
Cette version pose les fondations pour toute l'application, et reprend en
détail l'accueil et le journal. Les autres écrans héritent déjà des couleurs,
de la police et des rayons ; ils seront repris un par un ensuite.

Elle part de la V2.6 publiée sur GitHub, pour ne rien perdre de ses
retouches — notamment la composition « Ton repère du jour » de l'accueil.

## La palette : exacte, et lisible

Toutes les couleurs du brief sont reprises au code près. Mais trois accents
sont illisibles comme couleur de texte :

| Couleur du brief | Contraste sur blanc | Minimum lisible |
| --- | --- | --- |
| Menthe `#00C4CC` | 2,2:1 | 4,5:1 |
| Orangé `#EAC15C` | 1,7:1 | 4,5:1 |
| Vert `#4CAF50` | 2,8:1 | 4,5:1 |

La règle retenue : **la couleur exacte pour tout ce qui est aplat** — fonds,
jauge, pastilles, barres — **et une encre de la même teinte pour le texte**,
assombrie juste assez pour passer 4,5:1 sur sa pastille comme sous un texte
blanc :

| Accent | Aplat (brief) | Pastel (brief) | Encre du texte |
| --- | --- | --- | --- |
| Menthe | `#00C4CC` | `#E6F8F8` | `#007A7F` |
| Orangé | `#EAC15C` | `#FFF9EB` | `#906C13` |
| Vert | `#4CAF50` | `#EBF7ED` | `#367B38` |
| Violet doux | `#8C62FF` | `#F3EFFF` | `#7643FF` |

Le brun doré obtenu pour l'orangé est d'ailleurs celui de la pastille
« Petit-déjeuner » dessinée sur le moodboard.

Les anciennes clés de couleur sont conservées et pointent vers la nouvelle
palette : les écrans pas encore repris changent de couleurs sans rien casser.

## Plus Jakarta Sans

Chargée au démarrage, en cinq graisses. Les fichiers font partie de
l'application : aucun réseau n'est nécessaire. Tant qu'ils ne sont pas prêts,
l'écran reste d'un fond uni, pour éviter un texte qui changerait de police
sous les yeux. En cas d'échec, l'application s'ouvre avec la police du système.

Avec une police chargée, Android ignore la graisse demandée : chaque graisse
doit être nommée comme une famille à part. **Les 220 graisses de
l'application ont été converties par programme**, en passant par l'analyseur
syntaxique de TypeScript plutôt que par des remplacements de texte. Un
garde-fou refuse désormais toute graisse écrite à l'ancienne.

La hiérarchie du brief est dans le thème : 28 px pour « Bonjour Jocelyn »,
20 px pour les titres de section, 16 px pour les titres de carte, 32 px pour
les grands chiffres, 14 px pour le texte, 12 px pour les légendes. Les textes
de 10 et 11 px introduits en V2.6 remontent à 12.

## L'accueil et le journal

- **La jauge** passe de 270° à 240°. Au centre, le total consommé en grand et
  « sur 2 100 kcal » dessous, comme le brief le demande. La pastille d'état
  (« Dans ton repère »…) loge dans l'ouverture de l'arc. Ce qu'il reste
  s'affiche juste dessous, dans la ligne de chiffres.
- **Les en-têtes de section** passent à 20 px. À cette taille, le titre et son
  chiffre-clé ne tenaient plus côte à côte sur un téléphone : le premier
  aperçu coupait « 790 kcal restantes » en deux lignes. Le chiffre passe donc
  sous le titre.
- **Les cartes de repas** : pastille du moment en pilule, titre 16 px
  semi-gras, légende 12 px, calories en gras à droite, et les quatre couleurs
  du brief par moment de la journée.
- **Le bloc Jaws** : bulle blanche sur violet très clair, ombre douce.
- **Boutons et pilules** : rayons du brief.

## Corrigé au passage

- Sur la version web, « Effacer mon profil » ne faisait rien : la fenêtre de
  confirmation utilisée n'existe que sur téléphone. Le navigateur demande
  désormais sa propre confirmation.

## Un défaut dans mes propres vérifications

En préparant cette version, j'ai découvert que mon contrôle des références
TypeScript pointait vers un dossier renommé depuis la V2.2. Il ne vérifiait
donc plus rien, et les journaux des V2.2 à V2.5 affirment à tort qu'il était
passé.

Le contrôle a été refait : il échoue désormais bruyamment s'il n'a presque
rien analysé. Relancé sur la V2.5 et sur la V2.6, il ne trouve aucune erreur :
rien de caché ne s'était glissé. Sur la V2.7, il a immédiatement attrapé une
accolade en trop, corrigée avant livraison.

## Vérifications

- 128 vérifications automatiques, dont 8 nouvelles sur le design system :
  couleurs exactes, lisibilité de chaque encre, hiérarchie typographique,
  rayons et ombre, chargement des cinq graisses, jauge à 240°, couleurs des
  moments, confirmation web.
- Garde-fous : textes bruts, API dépréciées, graisses — sur 46 fichiers.
- Références TypeScript : 70 fichiers analysés, aucune erreur.
- Aperçus de l'accueil et du journal rendus avant livraison. **La police n'a
  pas pu y être chargée** (accès à Google Fonts fermé dans mon environnement) :
  ils montrent la mise en page, les couleurs et la hiérarchie, avec une police
  de remplacement plus large que Plus Jakarta Sans.

---

# V2.6 — 20 septembre 2026

## Premium visuel

- Ajout d'une composition éditoriale locale dans « Ma journée » : assiette,
  avocat et tomate avec profondeur, halo et mouvement très léger.
- Conservation du rendu vectoriel local : aucune photo lourde ou téléchargement
  supplémentaire n'est nécessaire pour l'accueil.
- Renforcement de la lisibilité des photographies de produits par un voile
  discret sous la pastille du moment.
- Version de l'application passée à `2.6.0`.

# V2.5 — 20 septembre 2026

« L'appli manque d'images, les cartes font trop développeur junior. »

Les deux remarques n'en font qu'une : il n'y avait pas d'images, et ce qui en
tenait lieu était fait de cercles et de rectangles de couleur unie. C'était
effectivement le degré zéro du dessin.

## 21 illustrations, dessinées pour de bon

Fruits, légumes, plats, féculents, protéines : pomme, tomate, carotte, banane,
brocoli, œuf, pain, avocat, poisson, bol de riz, fraise, assiette, salade,
poulet, fromage, yaourt, pâtes, raisin, orange, poivron, soupe.

Un système, pas une collection : boîte de 100 × 100, **lumière venant toujours
du haut à gauche**, ombre portée au sol, dégradé décalé vers la lumière, arête
sombre du côté opposé, reflet discret. C'est cette cohérence qui fait qu'un
ensemble d'images tient debout — plus que le soin mis sur chacune prise à part.

Le format a changé : chaque illustration est désormais un **vrai document
SVG**, plus une liste de primitives. C'est ce qui autorise les dégradés, et
surtout ce qui permet de voir le rendu exact dans un navigateur avant de
livrer : le téléphone et l'aperçu lisent la même chaîne de caractères.

Trois dessins ont été refaits jusqu'à ce qu'ils se lisent : le bol de riz
passait pour une tache blanche, l'assiette pour des miettes, le poulet pour une
pomme de terre. Le poulet a demandé trois essais.

## Les cartes de repas

L'image occupe maintenant toute la largeur en tête de carte, sur 132 pixels.
En dessous, la description, l'heure et les calories.

Trois sources, de la plus vraie à la plus générique : la **photographie** du
produit servie par Open Food Facts ; l'**illustration** correspondante quand le
nom de l'aliment est reconnu ; un **aplat teinté seul** quand on ne sait pas —
jamais une image fausse.

Le moment de la journée devient une pastille posée sur l'image. Et il a
maintenant **quatre couleurs vraiment distinctes** : jusqu'ici le déjeuner et
le dîner partageaient deux violets presque identiques, et le journal se lisait
tout d'une pièce. Un vert a été ajouté pour le déjeuner — contraste 5,3:1,
au-dessus du seuil d'accessibilité.

Sur l'accueil, les repas gardent une ligne resserrée, avec une vignette passée
de 44 à 62 pixels : trois repas doivent tenir sous le baromètre sans allonger
la page.

## Un bandeau par bloc

Chaque bloc thématique — Ma journée, Mes repas, Mon activité, Repas et
collations — porte un bandeau teinté avec une illustration qui **déborde de son
bord droit**, en retrait derrière le titre.

Le débordement est volontaire : une vignette posée bien au milieu d'un coin
ressemble à un autocollant ; une illustration coupée par le bord donne au
bandeau l'air d'une image. Le premier rendu faisait passer le chiffre-clé
par-dessus le dessin — la place de l'illustration est maintenant réservée, et
les deux ne se chevauchent plus jamais.

## Vérifications

- 120 vérifications automatiques, dont cinq nouvelles sur les illustrations :
  SVG bien formé, balises équilibrées, dégradés référencés existants,
  identifiants préfixés par le nom de l'aliment — deux illustrations côte à
  côte ne peuvent pas se voler leurs couleurs.
- Contrôles des textes bruts et des API dépréciées sur 45 écrans.
- Trois rendus successifs avant livraison : la planche des 21 illustrations,
  les cartes de repas, l'accueil complet.

---

# V2.4.4 — 20 septembre 2026

## « Avant, sans profil, j'avais les étapes »

C'était vrai, et c'était un défaut de ma part — pas une fausse impression.

L'application écrivait sur le téléphone un drapeau « parcours déjà vu », posé
dès la première fois, à l'achèvement comme à l'abandon. Il n'était jamais
effacé. La conséquence, que je n'avais pas vue : **effacer son profil ne
ramenait jamais les étapes**. On se retrouvait sans profil, donc sans repère
calorique, et sans autre moyen d'en refaire un que le formulaire détaillé.

Le raisonnement d'origine — « ne pas imposer deux fois un parcours qu'on a
passé » — était correct. Son application était mauvaise : un choix valable pour
un instant avait été gravé pour toujours.

### La règle, maintenant

Pas de profil enregistré, donc le parcours guidé. C'est tout.

« Passer » le met de côté **pour ce lancement seulement** : on entre dans
l'application, et rien n'est écrit sur le téléphone. Au lancement suivant, s'il
n'y a toujours pas de profil, les étapes sont là. Le bouton du Profil, lui,
l'emporte toujours.

La décision tient maintenant dans une fonction isolée, `shouldShowOnboarding`,
et cinq vérifications automatiques la verrouillent — dont le scénario exact
rapporté : parcours suivi, profil créé, profil effacé, relancement. Deux
d'entre elles lisent le code source pour interdire qu'un réglage enregistré
reprenne un jour cette décision.

L'ancien champ reste lu, pour que les sauvegardes des versions 2.1 à 2.4.3 se
relisent sans erreur. Il ne décide plus de rien.

## Vérifications

- 119 vérifications automatiques, plus les contrôles des textes bruts et des
  API dépréciées sur 44 écrans.

---

# V2.4.3 — 20 septembre 2026

## « J'avais une version qui me permettait de créer mon profil étape par étape »

Elle n'est jamais partie. Elle était introuvable, ce qui revient au même.

Le parcours en six étapes apparaît une seule fois, au tout premier lancement.
Une fois le profil enregistré, il n'y avait plus de raison de le rejouer — sauf
si on le demande. Et le bouton pour le demander se trouvait **tout en bas de
l'écran Profil**, après le formulaire, après l'objectif, après le calcul du
repère, au milieu des réglages d'animation.

C'est ma faute de conception : j'ai traité un parcours qu'on veut refaire comme
un réglage secondaire.

Il est maintenant **en tête de l'écran Profil**, juste sous le titre, dans une
carte violette qu'on ne peut pas manquer :

> ✦ **Revoir mon profil étape par étape**
> Six questions, une par écran, avec Jaws qui explique. Ton profil actuel n'est
> remplacé qu'au dernier bouton.

Suivi d'une ligne « ou modifie un détail ci-dessous », pour que le formulaire
détaillé reste ce qu'il doit être : le raccourci pour changer un seul chiffre.

Le bouton en double, en bas de l'écran, a été retiré.

Le comportement, lui, ne change pas : rien n'est enregistré avant la dernière
étape, et abandonner en route laisse le profil actuel intact.

## Vérifications

- 114 vérifications automatiques, plus les contrôles des textes bruts et des
  API dépréciées sur 44 écrans.
- Le haut de l'écran Profil a été rendu en image avant livraison.

---

# V2.4.2 — 20 septembre 2026

## Ma migration était incomplète

En V2.4.1 j'ai annoncé l'avertissement `SafeAreaView` réglé. Je n'avais corrigé
qu'`App.tsx`. **Cinq autres fichiers** importaient encore l'ancien composant :
le lecteur de séquences, la fenêtre d'activité, l'ajout de repas, le choix
d'objectif et la fiche d'explication de l'énergie.

Ce détail compte : l'avertissement se déclenche au simple **chargement** du
module, pas à son affichage. `App.tsx` importe le lecteur de séquences dès le
départ, donc un seul import oublié suffisait à faire réapparaître le message au
démarrage — exactement comme avant.

Les cinq sont migrés. Les fenêtres modales reçoivent en plus leur propre
fournisseur de marges, comme la documentation de la bibliothèque le demande :
une modale est une fenêtre à part, et sans lui les marges sont fausses sur
Android.

Un contrôle automatique refuse maintenant la livraison si l'import déprécié
revient dans le code.

## La version s'annonce au démarrage

Deux fois de suite, un message d'erreur m'est arrivé depuis une version déjà
corrigée, et rien dans les journaux de React Native ne dit quel paquet tourne
réellement. J'ai passé du temps à chercher un défaut qui n'existait plus.

Au démarrage, l'application écrit désormais :

```
----- Calories Express 2.4.2 -----
```

Cette ligne apparaît avant les éventuelles erreurs. Si le numéro n'est pas
celui qu'on vient d'installer, c'est l'ancien dossier qui tourne, et cela se
voit en une seconde.

## Sur les trois erreurs de texte

Le paquet V2.4.1 a été décompressé et vérifié une fois livré : les trois
espaces fautifs n'y sont plus, et le contrôle syntaxique des 44 écrans ne
trouve aucun texte brut. Les trois erreurs correspondent exactement à ce que
produisait la V2.4 — trois blocs, trois balises fermantes collées. La ligne de
version ci-dessus permettra de le confirmer sans discussion.

## Vérifications

- 114 vérifications automatiques, plus le contrôle des textes bruts et celui
  des API dépréciées, sur 44 écrans.
- Syntaxe et références relues par le compilateur TypeScript.

---

# V2.4.1 — 20 septembre 2026

Deux messages remontés du téléphone, deux corrections.

## « Text strings must be rendered within a `<Text>` component »

Trois fois le même message, et aucune indication d'où il venait.

La cause : **trois espaces**. En réorganisant l'accueil, j'avais laissé la
balise fermante collée au contenu sur la même ligne —
`</View>      </Section>`. JSX supprime un blanc qui contient un retour à la
ligne, mais garde celui-là : les six espaces deviennent un enfant texte, et
React Native refuse tout texte qui n'est pas dans un `<Text>`. Trois blocs sur
l'accueil, trois erreurs.

Les trois balises sont remises à la ligne.

### Un garde-fou, pour ne plus le chercher

Ce message ne dit jamais où est le problème, et une expression régulière ne
suffit pas à le trouver : elle confond un générique TypeScript
`Record<TabName, string>` avec une balise JSX. Le nouveau contrôle
`scripts/check-jsx-text.cjs` passe donc par **l'analyseur syntaxique de
TypeScript** et parcourt le véritable arbre des éléments.

Il signale les deux formes du défaut : une phrase oubliée hors d'un `<Text>`,
et les espaces collés à une balise. Il tourne avec les tests, sur les 44
écrans, et refuse la livraison s'il trouve quoi que ce soit.

## L'avertissement sur `SafeAreaView`

Le `SafeAreaView` de React Native est déprécié. Il avait surtout deux défauts
concrets : il ne faisait rien sur Android, et il ignorait la barre d'accueil en
bas des iPhone récents — la barre de navigation pouvait donc passer dessous.

L'application utilise maintenant **`react-native-safe-area-context`**, la
bibliothèque que la documentation d'Expo SDK 57 recommande, en version
`~5.7.0`. Le fournisseur enveloppe l'application, et les marges du haut comme
du bas sont respectées sur les deux systèmes.

C'est une dépendance en plus : le lanceur la télécharge tout seul au prochain
démarrage.

## Un détail de plus

Quand le repère calorique est à vérifier, le bloc « Ma journée » n'avait rien à
montrer et n'affichait que son titre. Il disparaît entièrement : la carte de
Jaws juste au-dessus dit déjà quoi faire.

## Vérifications

- 114 vérifications automatiques, plus le nouveau contrôle des textes bruts sur
  44 écrans.
- Syntaxe et références relues par le compilateur TypeScript.

---

# V2.4 — 20 septembre 2026

Quatre demandes, quatre réponses. La plus importante n'est pas d'avoir ajouté
quelque chose, c'est d'avoir rangé.

## L'accueil tient en trois blocs

L'écran d'accueil empilait dix cartes sans lien dans un même défilement : le
baromètre, un bouton, des repas habituels, la liste du jour, l'activité, des
séquences vidéo, un conseil illustré, une frise d'aliments, une mention légale.
Chacune se défendait. Ensemble, elles ne disaient plus rien — c'est exactement
ce que veut dire « brouillon ».

Il y a maintenant **trois blocs, et rien d'autre** :

| Bloc | Ce qu'il contient |
| --- | --- |
| **Ma journée** | le baromètre, les trois repères chiffrés, les macronutriments |
| **Mes repas** | ajouter, refaire un repas habituel, la liste du jour |
| **Mon activité** | les pas, les séances, les kcal actives |

Chaque bloc porte une pastille de couleur, un titre, et son chiffre-clé aligné
à droite. Le même gabarit se répète : c'est cette régularité qui rend une page
lisible, bien plus que le fait d'en retirer des informations.

Ce qui en sort n'est pas supprimé, seulement rangé ailleurs :

- **Les minutes de Jaws** rejoignent la Progression. Elles figuraient sur
  *trois* écrans à la fois — l'accueil, la progression et le profil. Elles ne
  vivent plus qu'à un seul endroit : celui où l'on vient pour comprendre.
- **La frise d'aliments** descend dans le Journal, l'écran qui parle de
  nourriture. C'est sa place.
- **Le conseil illustré** disparaît de l'accueil : les conseils de Jaws
  apparaissent déjà quand ils servent à quelque chose.

## De vraies photographies

Pour que l'application ait moins l'air fabriquée, il fallait des images qui
n'aient pas été fabriquées.

Elles existaient déjà, sans que rien ne les affiche. L'application interroge
Open Food Facts pour les produits de marque ; cette base contient aussi **la
photographie de chaque produit**, prise et versée par ses contributeurs. Elle
est maintenant demandée avec les valeurs nutritionnelles, et affichée :

- dans les résultats de recherche, à côté de chaque produit ;
- dans ton journal, sur chaque repas — la pastille du moment passe en coin.

Quand il n'y a pas de photo, un dessin prend le relais, mais seulement si le
nom est reconnu : *saumon* donne un poisson, *pain de campagne* donne du pain.
**Lasagnes ou cassoulet ne donnent rien** — une case sobre. Une illustration
fausse coûte plus cher en confiance qu'une case vide.

Trois garde-fous entourent ces images. Une seule origine est acceptée, le
serveur d'Open Food Facts en HTTPS ; une adresse venant d'ailleurs est ignorée
et jamais chargée. Le filtre s'applique aussi bien à l'arrivée du réseau qu'à
la relecture du stockage. Et un échec de chargement — réseau coupé, photo
retirée — redescend simplement au dessin, sans casser la ligne.

## Jaws ne bouge plus

Trois versions ont essayé de l'animer. Il est redevenu une illustration fixe :
aucune valeur animée n'est plus créée dans ce composant, il n'y a donc plus
rien à démarrer, rien à arrêter, rien à synchroniser. Les aliments animés et
l'écran d'ouverture, eux, restent.

Le réglage **Profil › Animations** et son banc d'essai restent en place : ils
pilotent désormais les aliments, les transitions et l'écran d'ouverture.

## Plus de valeurs d'exemple à la création de profil

Les champs affichaient des exemples en gris — *42*, *178*, *80*, *Par exemple :
Jocelyn*. Sur un téléphone, un nombre gris dans un champ se lit comme une
réponse déjà saisie : on ne sait plus ce qui vient de soi et ce qui vient de
l'application. Les champs sont vides ; leur étiquette et leur unité suffisent.

## Vérifications

- 114 vérifications automatiques passent, dont **huit nouvelles** sur les
  photos : origine acceptée, adresses refusées, produit sans photo toujours
  utilisable, dessin jamais inventé, vignette d'un repas, doublons disparus,
  blocs de l'accueil, champs sans exemple.
- L'accueil réorganisé a été rendu en image avant livraison
  (`accueil-trois-blocs.png`).

---

# V2.3 — 20 septembre 2026

Deux choses étaient cassées, et les deux pour la même raison de fond : du code
que je n'avais jamais vu s'exécuter. Cette version les répare et, surtout,
supprime la construction fragile qui rendait la première inévitable.

## Jaws était découpé

Depuis la V2.0, le personnage n'était plus une image mais **trois** : la tête,
le bras droit et le buste, superposés et animés séparément. C'était plus
ambitieux — un vrai petit pantin articulé — et c'était une mauvaise idée.

Chaque calque tournait autour de son propre point de pivot, et le téléphone
redimensionnait les trois images chacune de son côté. Tant que le personnage se
contentait de respirer, les coutures tenaient. Dès qu'une pose s'y ajoutait —
un salut, un geste de présentation — le cou et l'épaule s'ouvraient, et un
éclat de tissu bleu se détachait au-dessus de l'épaule.

**Il n'y a plus qu'une seule image, entière.** Une image entière ne peut pas se
découdre. Le mouvement porte désormais sur le personnage complet :

- il respire — une inclinaison lente de ±2,6°, un soulèvement, un léger
  gonflement ;
- il s'incline et saute d'un bloc pour saluer, acquiescer ou présenter ;
- tout pivote autour du bas de l'image, jamais autour du centre — sinon il
  flotterait au lieu de se balancer ;
- le halo derrière lui respire à contretemps, ce qui donne du relief au
  mouvement.

L'image a été refaite avec une marge autour du personnage, pour qu'il puisse
s'incliner et sauter sans jamais toucher le bord de son cadre.

Une vérification automatique interdit désormais de revenir au découpage sans
s'en rendre compte : elle échoue si l'avatar charge plus d'une image.

## La barre du bas était coupée

Le bouton « Ajouter » dépasse volontairement de 31 pixels au-dessus de la
barre — c'est ce qui le fait flotter. En V2.2, j'avais ajouté un masquage du
débordement sur cette barre, pour un indicateur coulissant dont je n'avais pas
besoin à cet endroit. Le masquage a fait son travail : il a **tranché le haut
du bouton**.

Le masquage est supprimé. La V1.7 n'en avait pas : la barre retrouve exactement
le comportement qui marchait chez toi.

Deux autres coupures possibles sont réglées au passage :

- la barre avait une hauteur figée à 82 pixels ; si la taille de texte du
  téléphone est augmentée, les libellés dépassaient. Elle s'adapte désormais à
  leur hauteur.
- les libellés des onglets plafonnent maintenant leur agrandissement, comme le
  reste de l'application.

## Comment j'ai vérifié, cette fois

Je ne peux toujours pas exécuter l'application ici. J'ai donc écrit un
**simulateur des transformations de React Native** : il compose les matrices
exactement comme le téléphone le fait, et rend le résultat en image.

Ce simulateur a reproduit le défaut que tu décrivais — l'éclat de tissu détaché
de l'épaule apparaît noir sur blanc dans les poses « saluer » et « présenter ».
Ce n'était donc plus une supposition. Il a ensuite servi à valider la nouvelle
version, image par image, à cinq tailles d'affichage.

La barre du bas a été rendue côte à côte, avant et après, dans un vrai moteur
de rendu.

Ces deux contrôles sont livrés avec la version : `jaws-bouge.mp4` et
`barre-du-bas.png`.

- 107 vérifications automatiques passent.

---

# V2.2 — 20 septembre 2026

Deux remarques, deux corrections. Elles se répondent : la belle mise en scène
était bien là, mais elle ne se jouait qu'une fois ; et l'avatar était bien
animé, mais un réglage pouvait l'arrêter sans jamais le dire.

## « J'avais une belle présentation au début, pourquoi ça n'y est plus ? »

Elle existait toujours — c'était le parcours de création du profil, joué une
seule fois, à la première ouverture. Une fois le profil créé, il n'y avait plus
de raison de le rejouer, et l'application retombait sur un écran d'accueil
hérité de la V1.1, resté austère : un titre, une phrase, un bouton.

**L'écran d'ouverture reprend désormais le même langage visuel que le parcours
de création.** À chaque lancement :

- deux halos de couleur dérivent lentement en arrière-plan ;
- la marque se dessine d'elle-même, l'arc violet se traçant en un peu moins
  d'une seconde ;
- la date du jour et le bonjour personnalisé montent en place ;
- Jaws salue, avec une bulle qui change selon que le profil existe ou non ;
- une file d'aliments défile sous lui ;
- le bouton « Entrer » arrive en dernier.

L'ensemble dure environ une seconde et se coupe dans **Profil › Accueil au
lancement** pour celles et ceux qui préfèrent aller droit au but. Le parcours
de création complet reste rejouable à tout moment depuis **Profil › Refaire la
création de mon profil** : il ne remplace le profil existant qu'à la toute
dernière étape.

## « Je n'ai toujours pas mon avatar qui bouge »

Trois causes possibles subsistaient. Elles sont traitées séparément.

### Le réglage d'animation devient explicite, et se voit

Jusqu'ici l'application suivait aveuglément la préférence « Réduire les
animations » du téléphone. Cette préférence s'active parfois sans qu'on s'en
souvienne — elle est aussi mise en route automatiquement par le mode économie
d'énergie sur certains appareils. Résultat : un personnage figé, sans aucune
explication.

**Profil › Animations** propose maintenant trois choix explicites :

| Choix | Effet |
| --- | --- |
| **Mon téléphone** | suit le réglage système (comportement d'avant) |
| **Toujours** | anime quoi qu'il arrive, même si le téléphone demande le contraire |
| **Jamais** | coupe tout |

Sous ces trois boutons, **une phrase dit à chaque instant ce qui s'applique et
pourquoi** — par exemple « Ton téléphone demande de réduire les animations :
Jaws reste immobile. Choisis "Toujours" pour passer outre. » Cinq situations,
cinq phrases distinctes : plus de doute possible.

### Un banc d'essai sous le réglage

Juste en dessous, **Jaws en direct** : le personnage à taille confortable, qui
respire et salue. On change le réglage, on regarde. La question « est-ce que ça
bouge ? » se tranche en trois secondes, sans quitter l'écran.

### La respiration ne s'arrête plus jamais toute seule

La V2.1 arrêtait toute l'animation du personnage quand l'application passait en
arrière-plan. L'intention était bonne — économiser la batterie — mais une seule
lecture erronée de cet état suffisait à figer Jaws définitivement.

Désormais **la respiration ne dépend que du réglage d'animation**. Seules les
poses — le salut, le hochement de tête — se mettent en pause en arrière-plan.
Si le réglage est sur « Toujours », Jaws respire, point final.

## Détails

- Nouvelle date longue en français (`samedi 20 septembre`) sur l'écran
  d'ouverture.
- Respiration de l'avatar renforcée : inclinaison portée à ±3,2°, soulèvement
  d'au moins 1,2 pixel même sur les vignettes.
- Poses rejouées toutes les 2,4 secondes au lieu de 5,2 — le personnage
  n'attend plus si longtemps entre deux saluts.
- Le garde-fou automatique « un seul pilote d'animation par fichier » couvre
  maintenant le nouvel écran d'ouverture.
- 106 vérifications automatiques passent.

---

# V2.1 — 20 septembre 2026

## Deux réglages éteignaient toutes les animations

C'est la vraie raison pour laquelle rien ne bougeait, et le défaut existait
depuis longtemps — il était simplement invisible tant que les animations
restaient discrètes.

- **La préférence système était présumée « animations réduites »** tant qu'elle
  n'avait pas pu être lue, et l'échec de lecture était avalé en silence. Si la
  lecture échouait, toute l'application restait figée pour de bon. La valeur par
  défaut est désormais « animations actives », et la préférence réelle est
  appliquée dès qu'elle est connue.
- **L'état de l'application pouvait rester bloqué sur « inactif »**. Au
  lancement, cet état est parfois encore indéterminé, et l'écouteur ne réagit
  qu'aux *changements* : une valeur initiale fausse n'était donc jamais
  corrigée, et tout ce qui s'anime — l'avatar, les aliments — ne démarrait
  jamais. « Indéterminé » compte maintenant comme actif, et l'état est relu
  après le montage.

Ces deux décisions sont sorties du composant dans des fonctions vérifiables, et
six tests les couvrent.

## L'avatar bouge vraiment

Mes amplitudes de la V2.0 étaient exprimées en pixels de la planche de 384 : un
hochement de 7 px devenait moins d'un pixel sur une vignette de 46 px. Le
mouvement repose désormais sur les **angles**, qui ne dépendent pas de la
taille — une tête inclinée de 8° se voit autant en vignette qu'en grand plan —
et les déplacements restent courts, sinon le bras se décolle du buste.

La pose se **rejoue toutes les cinq secondes** au lieu d'être jouée une fois au
montage, et la respiration ne s'arrête jamais. Jaws passe de 46 à 88 px sur
l'accueil.

## Plus de mouvement ailleurs

- Un bandeau d'aliments traverse l'accueil.
- L'indicateur de la barre du bas glisse d'un onglet à l'autre au lieu de sauter.

---

# V2.0 — 20 septembre 2026

## Jaws est articulé

Le rendu d'origine a été découpé en trois calques — la tête, le bras droit et le
buste — que l'application fait bouger séparément. La couture du cou passe
derrière le col turquoise, qui la masque ; celle de l'épaule suit le contour
réel du bras. C'est le procédé de la marionnette découpée : il donne un vrai
mouvement sans redessiner le personnage.

Quatre poses : **repos** (une respiration continue, pour qu'il n'ait jamais
l'air figé), **acquiescer**, **saluer** et **présenter**. Chaque endroit demande
la sienne — Jaws salue dans l'accueil animé et après un repas, acquiesce après
une séance, et présente quand il explique quelque chose.

## Des aliments en mouvement

Une bibliothèque de dix aliments dessinés — pomme, brocoli, œuf, tomate, pain,
carotte, avocat, poisson, raisin, bol de riz — et trois mises en scène :

- **orbite** : ils tournent doucement. Utilisée quand aucun repas n'est saisi.
- **pluie** : ils tombent et rebondissent. Utilisée à l'enregistrement d'un repas.
- **défilé** : ils traversent l'écran en ligne, pour un bandeau décoratif.

Comme les séquences de Jaws, tout est dessiné et animé sur l'appareil : aucune
vidéo n'est téléchargée, aucun lecteur externe n'est appelé, et l'ensemble pèse
quelques kilo-octets. Les formes vivent dans `src/data/foods-art.json` : en
ajouter un ne demande de toucher à aucun composant.

## Détails

- L'écran vide des repas devient une vraie invitation, avec les aliments en
  orbite et un bouton lisible, au lieu d'une ligne grise.
- La scène finale des séquences utilise l'avatar articulé.
- Le garde-fou d'animation couvre désormais cinq fichiers : les trois qui
  tournent sur le pilote JavaScript et les deux sur le pilote natif. Mélanger
  les deux dans une même vue reste la seule faute possible, et elle est
  détectée avant le téléphone.
- 15 tests supplémentaires : chaque aliment tient dans sa boîte, chaque nom
  utilisé par un écran existe, et chaque pose demandée est connue de l'avatar.

---

# V1.9 — 20 septembre 2026

## Un accueil animé au premier lancement

Six étapes pour créer son profil, au lieu du formulaire dense caché dans
l'onglet Profil : bienvenue, prénom, objectif, chiffres, activité habituelle,
puis l'annonce du repère. Une animation par étape, Jaws qui accompagne, une
barre d'avancement, un retour en arrière et un « Passer » toujours accessibles.

- **Rien n'est enregistré avant la dernière étape.** Passer ou quitter en cours
  de route ne touche ni au profil ni au journal — ce qui compte pour quelqu'un
  qui rejoue le parcours avec des semaines de saisie derrière lui.
- **Le parcours n'apparaît qu'une fois**, et jamais si un profil existe déjà :
  une mise à jour depuis une version précédente ne le déclenche pas. Il reste
  rejouable depuis Profil.
- **Aucun compte n'est créé** : ni e-mail, ni mot de passe, ni serveur. Le
  parcours enregistre un profil local, et l'écran final le dit explicitement.
- La dernière étape déplie le calcul — besoins au repos, maintien estimé, écart
  prévu — au lieu d'annoncer un nombre sans explication.
- Toute la logique du parcours vit dans `src/domain/onboarding.ts`, en fonctions
  pures, et 12 tests la vérifient sans lancer l'application.

## Nouveau logo

Direction claire : fond lavande très pâle, arc du baromètre en violet, bol
marine, pastille turquoise. Il a été relu à 170, 96, 56 et 34 px, sur fond
sombre comme sur fond clair. Le fond de l'icône adaptative Android suit la même
direction.

## Détails

- `useExperience` gagne le réglage `onboardingDone`. Une mise à jour conserve
  les préférences existantes ; la nouvelle clé prend sa valeur par défaut.
- Le bouton retour d'Android referme le parcours rejoué.
- Le garde-fou d'animation de la V1.8.2 s'applique aussi à l'écran d'accueil :
  un test vérifie qu'il n'utilise qu'un seul pilote.

---

# V1.8.2 — 19 septembre 2026

La vraie cause du plantage de la V1.8, enfin identifiée grâce au message
d'erreur que la V1.8.1 a laissé passer.

**« Attempting to run JS driven animation on animated node that has been moved
to native earlier »**, levé par `StoryPlayer`. Dans la scène finale de Jaws, une
seule vue animée réunissait deux valeurs : l'apparition, dérivée de `progress`
et pilotée par le JS, et le balancement, piloté en natif. React Native fusionne
les valeurs d'un même style dans un seul nœud de propriétés : `progress` se
retrouvait donc déplacé vers le pilote natif, et l'animation de la scène
suivante échouait. Comme toutes les séquences se terminent par cette scène, le
problème se déclenchait dès la première lecture menée à son terme.

Trois corrections, dont chacune suffirait seule :

- **La scène de Jaws sépare ses deux vues** : une valeur animée, une vue.
- **Toutes les boucles des scènes repassent sur le pilote JS**, comme
  `progress`. Un seul pilote dans le lecteur, donc plus aucun nœud déplaçable.
- **Le lecteur repart d'une valeur neuve à chaque scène**, ce qui cloisonne le
  problème au lieu de le laisser se propager d'une scène à la suivante.

Et un garde-fou pour la suite : un test vérifie désormais qu'aucun fichier du
lecteur de séquences n'utilise `useNativeDriver: true`.

---

# V1.8.1 — 19 septembre 2026

Correctif de l'écran d'erreur introduit en V1.8.

- **L'écran d'erreur plantait à son tour.** Il était monté au-dessus des
  fournisseurs de contexte, mais utilisait `MotionPressable`, qui demande
  `useExperience`. Toute erreur de rendu se transformait donc en
  « ExperienceProvider manquant », et l'erreur d'origine restait invisible.
  L'écran d'erreur n'utilise désormais que des composants de base.
- **Il dit maintenant où ça casse** : le message et les premières lignes de la
  pile de composants sont affichés et sélectionnables sur le téléphone.
- **Un second filet entoure chaque écran**, à l'intérieur des fournisseurs :
  si Aujourd'hui, Journal, Progression ou Profil échoue, l'erreur est nommée et
  la barre de navigation reste utilisable.
- **`useExperience` ne lève plus d'exception hors fournisseur** : il renvoie un
  repli sans animation. Ces réglages ne pilotent que du confort visuel ; ils ne
  méritent pas de faire tomber un écran.
- `theme.ts` : `type` renommé en `typeScale`, pour qu'un futur
  `import { type } from '../theme'` ne soit pas lu comme la syntaxe d'import de
  type de TypeScript.
- L'initiale de l'avatar repasse à `toUpperCase()`, comme en V1.7.

---

# V1.8 — 19 septembre 2026

## Ce qui est nouveau

- **Les minutes de Jaws** : six séquences animées courtes (Comprendre, Saisir, Bouger, Progresser, Manger, Souffler), dessinées et jouées sur le téléphone. Aucune vidéo téléchargée, aucun lecteur externe, aucune dépendance ajoutée. Lecture, pause, retour en arrière, et avance automatique désactivée quand les animations sont réduites.
- **Navigation par date** : toutes les journées passées sont consultables et modifiables depuis l’accueil et le journal. Un dîner oublié se rattrape ; le futur reste fermé.
- **Suivi du poids** : une pesée par jour, une courbe lissée sur sept jours et une phrase de tendance qui décrit le passé sans rien prédire. Sous trois semaines de pesées, l’application dit que la tendance n’est pas lisible plutôt que d’afficher un chiffre rassurant.
- **Modification d’un repas** : une entrée se corrige directement, au lieu d’être supprimée puis ressaisie.
- **Repas habituels** : les repas les plus souvent saisis se refont en un geste depuis l’accueil, avec exactement les aliments déjà confirmés.
- **Sauvegarde des données** : un export JSON lisible, partageable ou copiable, préparé sur le téléphone. Rien n’est envoyé nulle part.

## Ce qui change dans l’apparence

- Le grand nombre de l’accueil est désormais **ce qu’il reste**, pas ce qui a été saisi. Le total, le repère et l’activité passent sur une ligne de trois chiffres sous le baromètre.
- L’écran Aujourd’hui passe de onze blocs à sept : la carte objectif devient une pastille dans le baromètre, et les explications passent derrière un bouton (i).
- **Échelle typographique à six valeurs** (12, 14, 16, 20, 28, 44) au lieu des vingt et une tailles de la V1.7. Plus rien sous 12 px, et le corps de texte passe de 11–12 à 16.
- **Contrastes corrigés** : les couleurs qui portent du texte atteignent 4,5:1, les traits et icônes 3:1. Les teintes vives d’origine restent pour les aplats, sous les clés `aquaBright`, `goldBright` et `coralBright`.
- Les textes plafonnent leur grossissement, pour rester lisibles sans casser les cartes.
- Nouvelle icône d’application : l’arc du baromètre et un bol, lisibles jusqu’à 32 px. Le nom reste **Calories Express**.

## Ce qui est réparé

- **Bouton retour d’Android** : il ferme la couche ouverte — séquence, conseil, journée passée, onglet — au lieu de quitter l’application. Les modales avec une saisie en cours gardent leur propre confirmation.
- **Filet de sécurité** : une erreur de rendu affiche un écran lisible avec un bouton Réessayer, au lieu de l’écran rouge sans issue. Il rappelle que rien n’est supprimé.
- **Relecture du stockage** : le profil et les repas sont validés à l’ouverture. Une entrée abîmée est écartée sans faire perdre les autres, et un profil illisible retombe sur ses valeurs par défaut au lieu de propager un NaN jusqu’au repère.
- **Écriture différée et groupée** : saisir une quantité ne réécrit plus tout le journal à chaque frappe. Une mise en arrière-plan force l’écriture immédiate.
- La journée d’un repas est calculée en heure locale : un repas saisi le soir n’est plus rattaché au lendemain.

## Ce qui est conservé

Les 3 339 aliments Ciqual 2025, la recherche Open Food Facts, la photo d’étiquette avec OCR local, les plats maison, les pas et séances avec déduplication, le total montre, les trois modes d’objectif, les bulles de Jaws après un repas et toutes les clés de stockage. Le slug Expo reste `calories-express-v1` : le journal déjà enregistré est retrouvé.

---

# V1.7 — 19 septembre 2026

- Formulaire de séance séparé des pas : calcul visible avant sauvegarde et poids saisissable directement. Un profil alimentaire incomplet ne bloque plus une estimation avec un poids valide.
- Saisie des calories actives d’une séance depuis une montre ou un appareil, sans poids requis ; remplacement de l’estimation plutôt qu’addition.
- Total actif journalier manuel : confirmation du périmètre, remplacement du cumul estimé, mise à jour et retour aux estimations sans perte du journal.
- Détail du bilan : pas, séances estimées, valeurs renseignées et doublons retirés. Affichage des anciennes séances incomplètes avec action de correction.
- Estimations course à pied et aquagym, course comprise dans les pas par défaut.
- Réglage de l’objectif accessible directement depuis l’activité ; explication visible du mode fixe et du mode ajusté.
- Conservation des sources, valeurs et dates après relecture des données. Maintien des clés de stockage précédentes.
- Tests des calculs et des vrais formulaires React, dont la saisie sans profil et les corrections de source.

---

# V1.6 — 18 septembre 2026

- Estimation calorique des pas visible pendant la saisie, après sauvegarde et sur l’accueil ; prise en compte dans le mode ajusté.
- Poids et nombre de pas habituels conservés par jour ; remplacement du total et recalcul des doublons avec les séances.
- Recettes maison composables, modèle burger au bœuf modifiable et mémorisable, accompagnements conservés dans la phrase.
- Photo du tableau nutritionnel avec OCR local, choix de colonne obligatoire en cas d’ambiguïté, calcul par biscuit/pièce ou poids, confirmation et mémorisation.
- Commande Changer mon objectif mise en évidence en haut de l’accueil.
- Conservation des clés de stockage et migration des pas et aliments des versions précédentes.

---

# V1.5 — 17 septembre 2026

- Ajout de repas unifié : texte, quantités, correspondances Ciqual hors ligne et recherche de marques au même endroit.
- 3 339 références énergétiques Ciqual 2025 intégrées, attribution et import reproductible.
- Migration de la recherche Open Food Facts vers Search-a-licious après diagnostic HTTP 503 de l’ancien endpoint ; listes de marques et schéma hits gérés.
- Calcul de dépense active par type, intensité, durée et poids ; crédit quotidien optionnel sans cumul avec le coefficient d’activité habituel.
- Affichage synchronisé du repère dans l’accueil, le journal, l’explication et la progression.
- Félicitations après activité et invitations de Jaws après repas, désactivables et limitées en fréquence.
- Migration des anciennes préférences ; journal conservé, poids des nouvelles séances mémorisé, journée rafraîchie au retour dans l’app.
- Conservation de Jaws silencieux, sans ajout d’une dépendance d’animation ou d’un service vocal.

# Historique

## 1.4.0 — Produits, objectifs et activité (16 septembre 2026)

- Changement rapide d’objectif depuis l’accueil, aperçu et mode manuel explicite.
- Recherche Open Food Facts par nom/marque et code-barres saisi, prise en charge du schéma nutritionnel v3.6.
- Saisie de n’importe quel aliment avec kcal par 100 g/ml ou portion, recalcul depuis la référence.
- Aliments personnels mémorisés, disponibles hors ligne et supprimables des favoris.
- Retrait du mode photo et de sa dépendance ; anciens repas conservés.
- Journal de pas quotidiens et séances modifiables, idées d’activité avec confirmation.
- Aucun crédit calorique automatique lié à l’activité saisie.
- Ligne d’objectif foncée en tirets, barres bleues/ambre et macronutriments différenciés.
- Signalement des macronutriments partiels, validation des données et erreurs réseau lisibles.
- Tests des unités, schémas de données, annulation/requêtes lentes et migration.

# Journal des versions

## 1.3.0 — Jaws et le déficit expliqué (15 septembre 2026)

- Remplacement du guide par le deuxième avatar 3D choisi, Jaws, détouré et optimisé.
- Suppression de la lecture vocale, de la grande photo d’accueil et de l’icône portrait.
- Accueil typographique avec petit guide animé et retour de l’icône graphique.
- Affichage séparé du maintien estimé, de l’objectif alimentaire et de l’écart prévu.
- Explication interactive en trois étapes, avec exemple à 2 100/2 200/2 500 kcal.
- Libellés du baromètre précisés ; dépassement du repère sans diagnostic d’excédent.
- Vérification de la cohérence des objectifs manuels et des données de profil.
- Suppression du plancher silencieux à 800 kcal : les valeurs hors des limites de la version sont signalées.
- Informations du profil modifiables en mode manuel ; les repas de démonstration sont retirés au premier enregistrement du profil.
- Graphique hebdomadaire décrit comme un total saisi, avec avertissement sur les journées incomplètes.
- Suppression des assets et maquettes obsolètes ; conservation des clés de stockage.
- Ajout des vérifications métier du déficit, des cibles manuelles et des saisies invalides.

## 1.1.0 — version de test

- Ajout d’une autocomplétion pendant la description d’un repas.
- Reconnaissance instantanée des aliments déjà identifiés dans la phrase.
- Passage du catalogue de test de 18 à 50 aliments et portions courantes.
- Recherche manuelle désormais insensible aux accents et enrichie des synonymes.
- Ajout de la réinitialisation du profil avec conservation du journal.
- Ajout du prénom ou pseudo au formulaire de profil.
- Intégration de Lina, professeur-guide pédagogique et non médical.
- Nouvelle direction visuelle indigo, violet, turquoise et corail.
- Nouvelle icône assortie à la palette.
- Ajout local de l’outil de tunnel Expo afin d’éviter les erreurs d’installation globale sur macOS.

## 1.2.0 — Accueil et guide animés

- Visuel fourni intégré à l’accueil, icône portrait adaptée et images de lancement optimisées.
- Bonjour/bonsoir avec le prénom enregistré, animation d’entrée et accueil rejouable.
- Bulles de conseils successives, personnage animé et voix française sur demande.
- Arrêt de la parole à la navigation, à la fermeture des bulles et en arrière-plan.
- Transitions, boutons réactifs, compteur calorique et barres de macros animés lors des changements.
- Confirmation après l’ajout d’un repas, sans récompense liée à une restriction calorique.
- Préférences persistantes pour les animations et l’accueil ; respect de l’accessibilité.
- Lanceur Mac qui retrouve son dossier automatiquement.
