/**
 * Calories Express — journal de test.
 *
 * À coller dans Extensions > Apps Script d'un Google Sheets, puis à publier
 * (Déployer > Nouveau déploiement > Application web). Voir le mode d'emploi
 * complet dans docs/JOURNAL_DE_TEST.md.
 *
 * Ce script n'accepte que six champs, et refuse tout le reste : même si
 * l'application envoyait par erreur autre chose, rien d'autre ne serait
 * écrit dans le tableur.
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
