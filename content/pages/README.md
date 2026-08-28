# Contenu des pages VELOUR

Shopify stocke les Pages (Boutique en ligne → Pages) comme des données dans la boutique, pas comme des fichiers du thème — elles ne peuvent pas être créées via ce repo. Les fichiers `.html` de ce dossier sont donc la **source de vérité versionnée** pour le contenu de chaque page ; il faut les copier manuellement dans l'admin Shopify.

## Marche à suivre, pour chaque page

1. **Boutique en ligne → Pages → Ajouter une page**
2. Titre = celui indiqué ci-dessous. Vérifie que le handle généré (visible dans "Référencement naturel" en bas) correspond à celui indiqué — sinon édite-le manuellement, car le footer du thème (`sections/site-footer.liquid`) pointe vers ces handles précis.
3. Dans l'éditeur de contenu, clique sur l'icône `<>` ("Modifier le code HTML") et colle le contenu du fichier `.html` correspondant.
4. Enregistre.

| Fichier | Titre de la page | Handle attendu |
|---|---|---|
| `livraison.html` | Livraison | `livraison` |
| `faq.html` | FAQ | `faq` |
| `notre-histoire.html` | Notre histoire | `notre-histoire` |
| `les-press-on.html` | Les press-on | `les-press-on` |
| `guide-dentretien.html` | Guide d'entretien | `guide-dentretien` |
| `contact.html` | Contact | `contact` |

## Cas particulier : Contact

Après avoir créé la page Contact avec le contenu de `contact.html`, va dans **"Modèle de thème"** en bas à droite de l'éditeur de page et choisis **`page.contact`** au lieu de `page` (par défaut) — ça affiche le vrai formulaire de contact (`sections/page-contact-form.liquid`) au lieu d'une page de texte statique.

## Contenu à compléter

Certains passages sont marqués `[À compléter : ...]` — ce sont des infos que je ne peux pas inventer (frais de livraison réels, politique d'annulation, histoire réelle de la marque). Remplace-les avant publication.

## Pages légales — hors périmètre

Mentions légales, CGV, politique de confidentialité et politique de remboursement ne sont **pas** dans ce dossier : elles doivent venir de l'outil natif Shopify (**Réglages → Politiques**), qui génère un texte conforme à partir des vraies informations de la société. Une fois générées, elles sont automatiquement liées dans le footer du thème (section "Retours" notamment, via `shop.policies.refund_policy`).
