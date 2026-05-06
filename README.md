# Formulaire d'Audit Starlink — IPKONEKT / Bouygues Telecom

Application web qui génère un rapport Word d'audit Starlink à partir d'un formulaire interactif, avec un éditeur d'annotation photo intégré.

## Nouveautés (v2)

- ✅ **Logos Bouygues + IPKONEKT sur chaque page** (en en-tête répété)
- ✅ **Mention « Document confidentiel »** alignée à gauche en pied de page (comme dans le template original)
- ✅ **Tailles de logos ajustées** pour reproduire le rendu du PDF d'origine
- ✅ **Éditeur d'annotation photo** intégré : permettez aux techniciens de poser directement des éléments (mâts, antennes Starlink) sur leurs photos et d'ajouter du texte stylé, sans quitter le navigateur

## Comment l'utiliser

1. **Ouvrir `index.html`** dans un navigateur web (Chrome, Firefox, Edge…). Double-clic sur le fichier suffit.
2. **Remplir les champs** du formulaire : informations client, emplacement, pose, EPI, synthèse.
3. **Importer une photo** en cliquant sur le sélecteur de fichier à côté de chaque emplacement.
4. **Annoter une photo** (optionnel) : cliquer sur le bouton vert « ✏ Annoter » à côté de la photo.
   - Choisir un élément dans la barre latérale (Antenne Starlink, Mât drapeau, Mât coudé)
   - Le faire glisser sur la photo
   - Le redimensionner (poignée bleue), le pivoter (poignée orange), le supprimer (poignée rouge)
   - Ajouter un texte stylé (couleur, contour, ombre, gras) avec le bouton « ➕ Ajouter le texte »
   - Enregistrer la photo annotée — elle remplace la photo d'origine pour la génération du Word
5. Cliquer sur **« 📄 Générer le rapport Word »** en bas de page.
6. Le fichier `.docx` est téléchargé automatiquement.

## L'éditeur d'annotation

L'éditeur s'ouvre dans une fenêtre modale et propose :

### Éléments image (PNG détourés, fond transparent)
- 🛰️ Antenne Starlink
- 📡 Mât drapeau / coudé rotatif
- ⚙️ Mât coudé fixe

### Outils texte
- Choix de la police (Arial Black, Impact, Georgia…)
- Taille, couleur de remplissage, couleur de contour
- Gras, ombre portée
- 6 couleurs rapides (rouge, blanc, jaune, vert, bleu, noir)
- Aperçu en direct du rendu

### Manipulation
- **Glisser** un élément pour le déplacer
- **Poignée bleue** (coin bas-droite) : redimensionner (les proportions sont conservées pour les images)
- **Poignée orange** (en haut) : pivoter
- **Poignée rouge** (coin haut-droite) ou touche **Suppr** : supprimer
- **Double-clic** sur un texte : modifier son contenu

### Export
À l'enregistrement, l'éditeur fusionne tous les éléments en une seule image PNG haute résolution (taille naturelle de la photo). Cette image est ensuite intégrée dans le Word.

## Comportement intelligent des photos

Le script gère automatiquement la mise en page :
- Les 2 photos d'une paire sont chargées → affichage en deux colonnes côte à côte
- Une seule photo de la paire → la photo prend toute la largeur
- Aucune photo de la paire → la rangée entière est supprimée du Word

## Nom du fichier généré

`AUDIT_STARLINK_<référence>_<raison_sociale>_<date>.docx`

## Fichiers de l'application

- `index.html` — l'interface du formulaire
- `app.js` — logique de génération du document Word
- `editor.js` — éditeur d'annotation photo (modal, drag/resize/rotate, export canvas)
- `assets.js` — éléments PNG (antenne, mâts) en base64, fonds détourés
- `logos.js` — logos IPKONEKT et Bouygues Telecom en base64
- `docx.umd.js` — librairie de génération Word (locale)
- `FileSaver.min.js` — librairie de téléchargement (locale)

⚠ **Important** : les **7 fichiers doivent rester dans le même dossier**.

L'app fonctionne **100 % hors-ligne**. Si `docx.umd.js` ou `FileSaver.min.js` est absent, un fallback CDN (unpkg.com) est tenté.

## Hébergement (optionnel)

Si vous voulez l'utiliser sur plusieurs postes ou tablettes :
- Mettre les 7 fichiers sur un partage réseau interne, OU
- Héberger sur un serveur statique (IIS, Apache, Nginx, GitHub Pages…)
- Aucun back-end nécessaire : tout fonctionne dans le navigateur.

## Confidentialité

Aucune donnée n'est envoyée sur Internet. Toutes les informations saisies, les photos, et les annotations restent dans le navigateur. Le document Word est généré localement.
