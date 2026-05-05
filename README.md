# Formulaire d'Audit Starlink — IPKONEKT / Bouygues Telecom

Application web qui génère automatiquement un rapport Word d'audit Starlink à partir d'un formulaire interactif.

## Comment l'utiliser

1. **Ouvrir `index.html`** dans un navigateur web (Chrome, Firefox, Edge…) — double-clic sur le fichier suffit.
2. **Remplir les champs** du formulaire : informations client, emplacement, pose, EPI, synthèse.
3. **Cocher les cases** correspondantes (type d'emplacement, accessibilité, support, EPI, etc.).
4. **Ajouter les photos** en cliquant sur les zones d'upload — un aperçu apparaît immédiatement.
5. Cliquer sur **« 📄 Générer le rapport Word »** en bas de page.
6. Le fichier `.docx` est téléchargé automatiquement, prêt à être envoyé.

## Comportement intelligent des photos

Le script gère automatiquement la mise en page selon les photos présentes :

- ✅ **Les 2 photos d'une paire sont chargées** → affichage en deux colonnes côte à côte
- ✅ **Une seule photo de la paire est présente** → la photo prend toute la largeur, le cadre vide est supprimé
- ✅ **Aucune photo de la paire n'est chargée** → la rangée entière est supprimée du document

Cela vaut pour toutes les paires de photos :
- 2.2 : Vue générale + Vue détaillée
- 2.3 : Capture obstruction + Carte couverture
- 3.2 : 6 photos (Antenne, Cheminement 1/2/3, Pénétration façade, Routeur)

## Nom du fichier généré

Le fichier porte automatiquement le nom : 
`AUDIT_STARLINK_<référence_commande>_<raison_sociale>_<date>.docx`

## Fichiers de l'application

- `index.html` — l'interface du formulaire
- `app.js` — la logique de génération du document Word
- `logos.js` — les logos IPKONEKT et Bouygues Telecom encodés en base64

⚠ **Important** : les 3 fichiers doivent rester dans le **même dossier** pour que l'application fonctionne.

## Hébergement (optionnel)

Si vous souhaitez utiliser l'application sur plusieurs postes ou sur tablette, vous pouvez :
- Mettre les 3 fichiers sur un partage réseau interne
- Héberger sur un serveur web interne (n'importe quel serveur statique : IIS, Apache, Nginx, GitHub Pages…)
- Aucun back-end n'est nécessaire : tout fonctionne dans le navigateur.

## Confidentialité

Aucune donnée n'est envoyée sur Internet. Toutes les informations saisies et les photos restent dans le navigateur, et le document Word est généré localement.
