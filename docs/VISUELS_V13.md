# Visuels V1.3

Jaws utilise le deuxième avatar 3D choisi par Jocelyn, initialement nommé
« Avatar 3D Jaws, sourire chaleureux ». Le visage, la coiffure, la barbe, la pose
et le tee-shirt indigo à bordures turquoise sont conservés.

Le damier était incorporé dans les pixels de l’original. Le générateur d’images
intégré a servi uniquement à retirer ce fond et produire un vrai canal alpha.
Aucun service API externe n’a été configuré. L’image a ensuite été redimensionnée
mécaniquement en PNG 384 × 384, avec transparence, pour les petits emplacements de
l’application. Asset utilisé : `assets/jaws-avatar-v13.png` (172 367 octets).

Prompt final (outil intégré, mode édition) :

> Use case: background-extraction. Edit target: the attached selected 3D cartoon Jaws avatar for the Calories Express app. Remove ONLY the baked-in gray and white checkerboard background. Preserve the exact existing stylized man's face, warm brown eyes, brown sculpted hair, short beard, friendly smile, pose with open palm to image right, proportions, indigo T-shirt and turquoise trim. Keep the chosen character unchanged. Output a clean cutout with a genuinely transparent alpha background, clean hair and fingers edges. No visible checkerboard pattern, no other background, no halo, no text, no logos. Same square framing with entire visible torso and both hands; do not crop fingers or hair. Production app asset.

Le composant `GuideAvatar` anime le personnage deux fois à chaque nouveau conseil,
avec un mouvement vertical et une faible rotation. Il s’arrête en arrière-plan et
respecte les préférences d’accessibilité. Les bulles s’affichent avec une transition
courte, puis restent lisibles jusqu’à l’action de l’utilisateur.

Le grand visuel d’ouverture, les déclinaisons de l’icône portrait et le précédent
personnage sont retirés du livrable. L’icône graphique de Calories Express est
restaurée pour iOS, Android et le favicon web. Les fichiers SVG de cette icône
restent modifiables dans `assets/`.
