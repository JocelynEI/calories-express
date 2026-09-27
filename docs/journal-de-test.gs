/**
 * Calories Express — journal de test.
 *
 * À coller dans Extensions > Apps Script d'un Google Sheets. Voir le mode
 * d'emploi complet dans docs/JOURNAL_DE_TEST.md.
 *
 * Deux parties :
 *
 *  - `doPost` reçoit les actions et les écrit, une ligne par action, dans la
 *    première feuille. C'est le journal brut.
 *  - `resume` relit ce journal et fabrique une feuille « Résumé » : une ligne
 *    par testeur, lisible d'un coup d'œil. À lancer quand on veut, depuis
 *    l'éditeur — aucun redéploiement nécessaire.
 *
 * Le script n'accepte que six champs et une liste fermée d'actions : même si
 * l'application envoyait autre chose, rien d'autre ne serait écrit.
 */

var COLONNES = ['at', 'visiteur', 'visite', 'evenement', 'version', 'ecran'];

var EVENEMENTS = [
  'ecran-accueil', 'ecran-journal', 'ecran-progression', 'ecran-profil',
  'ouvre-ajout-repas', 'repas-ajoute', 'repas-modifie', 'ajout-repas-abandonne',
  'aliment-cherche', 'etiquette-scannee',
  'ouvre-activite', 'activite-commencee', 'seance-estimee', 'seance-enregistree', 'activite-abandonnee',
  'profil-commence', 'profil-termine', 'profil-passe',
  'premiere-ouverture', 'erreur-affichee'
];

/* ------------------------------------------------------- le journal brut -- */

function doPost(e) {
  try {
    var recu = JSON.parse(e.postData.contents);
    if (EVENEMENTS.indexOf(recu.evenement) === -1) return ok();

    var feuille = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (feuille.getLastRow() === 0) {
      feuille.appendRow(['Date et heure', 'Visiteur', 'Visite', 'Action', 'Version', 'Appareil']);
      feuille.setFrozenRows(1);
    }

    var ligne = [];
    for (var i = 0; i < COLONNES.length; i++) {
      var valeur = recu[COLONNES[i]];
      // Une valeur absente ou trop longue est remplacée, jamais recopiée
      // telle quelle : ce tableur ne doit contenir que des mots attendus.
      ligne.push(typeof valeur === 'string' && valeur.length <= 40 ? valeur : '');
    }
    feuille.appendRow(ligne);
  } catch (erreur) {
    // On ne renvoie jamais d'erreur : l'application ne lit pas la réponse, et
    // une ligne perdue vaut mieux qu'un journal qui bloque.
  }
  return ok();
}

function doGet() {
  return ok();
}

function ok() {
  return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
}

/* ----------------------------------------------------------- le résumé --- */

/** Les colonnes du résumé, dans l'ordre, avec leur titre en clair. */
var RESUME_COLONNES = [
  ['premiere-ouverture', 'Ouvertures'],
  ['profil-commence', 'Profil commencé'],
  ['profil-termine', 'Profil terminé'],
  ['ouvre-ajout-repas', 'Repas ouverts'],
  ['repas-ajoute', 'Repas ajoutés'],
  ['ajout-repas-abandonne', 'Repas abandonnés'],
  ['seance-enregistree', 'Séances notées'],
  ['ecran-progression', 'Progression ouverte'],
  ['erreur-affichee', 'Erreurs']
];

/**
 * Fabrique (ou refait) la feuille « Résumé » : une ligne par testeur.
 *
 * Le journal brut devient illisible dès qu'il y a plusieurs personnes —
 * c'est normal, ce n'est pas fait pour être lu, c'est fait pour être
 * compté. Cette feuille-ci est faite pour être lue.
 */
function resume() {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var source = classeur.getSheets()[0];
  var lignes = source.getDataRange().getValues();

  var par = {};
  var ordre = [];
  for (var i = 1; i < lignes.length; i++) {
    var date = String(lignes[i][0]);
    var visiteur = String(lignes[i][1]);
    var visite = String(lignes[i][2]);
    var action = String(lignes[i][3]);
    var appareil = String(lignes[i][5]);
    if (!visiteur) continue;

    if (!par[visiteur]) {
      par[visiteur] = { premier: date, dernier: date, visites: {}, actions: {}, total: 0, appareil: appareil };
      ordre.push(visiteur);
    }
    var p = par[visiteur];
    if (date < p.premier) p.premier = date;
    if (date > p.dernier) p.dernier = date;
    if (visite) p.visites[visite] = true;
    p.actions[action] = (p.actions[action] || 0) + 1;
    p.total++;
    if (appareil) p.appareil = appareil;
  }

  var titres = ['Testeur', 'Appareil', 'Visites', 'Actions en tout', 'Première fois', 'Dernière fois'];
  for (var c = 0; c < RESUME_COLONNES.length; c++) titres.push(RESUME_COLONNES[c][1]);
  var table = [titres];

  // Le plus récent en haut : c'est celui dont on attend des nouvelles.
  ordre.sort(function (a, b) { return par[a].dernier < par[b].dernier ? 1 : -1; });

  for (var j = 0; j < ordre.length; j++) {
    var v = par[ordre[j]];
    var ligne = [ordre[j], v.appareil, compter(v.visites), v.total, lisible(v.premier), lisible(v.dernier)];
    for (var k = 0; k < RESUME_COLONNES.length; k++) ligne.push(v.actions[RESUME_COLONNES[k][0]] || 0);
    table.push(ligne);
  }

  if (table.length === 1) table.push(['Aucune ligne pour l’instant', '', '', '', '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  var feuille = classeur.getSheetByName('Résumé');
  if (!feuille) feuille = classeur.insertSheet('Résumé');
  feuille.clear();
  feuille.getRange(1, 1, table.length, titres.length).setValues(table);
  feuille.getRange(1, 1, 1, titres.length).setFontWeight('bold');
  feuille.setFrozenRows(1);
  feuille.autoResizeColumns(1, titres.length);
  classeur.setActiveSheet(feuille);
}

function compter(objet) {
  var n = 0;
  for (var cle in objet) if (Object.prototype.hasOwnProperty.call(objet, cle)) n++;
  return n;
}

/** « 2026-09-27T09:14:02.000Z » devient « 27/09 à 09:14 ». */
function lisible(iso) {
  if (!iso || iso.length < 16) return iso;
  return iso.substring(8, 10) + '/' + iso.substring(5, 7) + ' à ' + iso.substring(11, 16);
}
