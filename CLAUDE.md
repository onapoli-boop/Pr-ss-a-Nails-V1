# Prompt pour Claude Code — VELOUR, thème Shopify

Copie tout ce qui suit dans Claude Code, à la racine de ton dépôt git (après y avoir mis les fichiers de la maquette — voir note en bas). Tu peux aussi enregistrer ce fichier tel quel sous le nom `CLAUDE.md` à la racine du repo : Claude Code le relit automatiquement à chaque session, donc tu n'auras pas à tout réexpliquer la prochaine fois qu'on y retouche.

---

## Contexte projet

VELOUR est une marque européenne de press-on nails, positionnement "affordable feminine luxury", marchés FR · DE · ES · EN (Belgique gérée séparément). Boutique construite sur Shopify (Online Store 2.0).

J'ai validé une maquette statique HTML/CSS/JS (`index.html`, `product.html`, `blog.html`, `article.html`, `styles.css`, `script.js`) qui se trouve à la racine de ce dépôt. Elle sert de référence visuelle et fonctionnelle exacte — pas juste d'inspiration. Le rendu final du thème Shopify doit reproduire cette direction à l'identique (structure, espacements, typographie, interactions), pas s'en inspirer librement.

## Ta mission

Convertir cette maquette statique en thème Shopify Online Store 2.0 (architecture sections/blocks, JSON templates), en conservant fidèlement le design system et les interactions déjà validés. On avancera par itérations : ne construis pas tout le thème d'un coup, on ira section par section, je validerai à chaque étape avant de continuer.

### Étape 1 (à faire maintenant)
1. Mets en place la structure standard d'un thème Shopify 2.0 : `/sections`, `/snippets`, `/templates`, `/templates/customers`, `/assets`, `/config`, `/locales`, `/layout`.
2. Reprends `styles.css` dans `/assets/theme.css` (ou split en plusieurs fichiers si ça devient trop long), et adapte les URLs d'images (`https://images.unsplash.com/...`) pour rester en placeholders explicites tant que je n'ai pas les vraies photos produit.
3. Convertis `index.html` en `layout/theme.liquid` (header, footer, cart drawer, announcement bar, popup 7 Days communs à tout le site) + `templates/index.json` avec les sections de la homepage (hero, 7 Days, moods, shop the look, bestsellers, edits, why velour, before/after, avis, UGC, blog teaser, capture email).
4. Convertis `product.html` en `templates/product.json` + `sections/main-product.liquid` (galerie, buybox avec variantes réelles Shopify pour la forme, upsell, accordéon, guide de pose, FAQ, avis, nouveautés, bestsellers).
5. Convertis `blog.html` / `article.html` en utilisant les objets natifs Shopify `blog` et `article` (`templates/blog.json`, `templates/article.json`) plutôt qu'en pages statiques, pour bénéficier de l'admin Shopify pour la rédaction.
6. Langue française par défaut : mets en place `locales/fr.default.json` avec toutes les chaînes de texte du thème (pas de texte en dur dans les fichiers Liquid — utilise `{{ 'clé' | t }}`), pour permettre plus tard les traductions DE/ES/EN.

### Fonctionnalités interactives à préserver (déjà codées en JS vanilla dans `script.js`)
- Panier latéral (cart drawer) — à reconnecter à l'API Cart réelle de Shopify (AJAX Cart)
- Popup de création de look "7 Days" (mini quiz puis grille de 7 jours modifiable) — reste en JS côté client, mais le bouton final doit ajouter les vrais produits/variantes au panier Shopify
- Slider avant/après (input range natif + clip-path)
- Accordéon (infos produit + FAQ, indépendants l'un de l'autre)
- Filtre de catégories sur le blog
- Galerie produit avec miniatures
- Barre d'achat collante en mobile
- Animations GSAP + ScrollTrigger, avec repli en JS pur si les CDN ne chargent pas (voir le pattern `hasGSAP` dans `script.js` — à conserver)

### Design system (déjà dans `styles.css`, à reprendre tel quel)
- Couleurs : ivoire `#F6F1EA`, noir `#17130F`, nude `#D8B9A0`, rose poudré `#EFDFD9`, bordeaux `#6B2733`, chocolat `#4A3228`
- Typo : Fraunces (titres, serif) + Inter (UI, sans-serif), chargées via Google Fonts
- Rayons : boutons en pilule (`--radius-full`), cartes/images en rayon moyen à large (`--radius-md` / `--radius-lg`)
- Ombres douces teintées (jamais de gris pur)

### Points d'attention
- Toutes les images sont des placeholders (dégradés CSS ou photos Unsplash temporaires) — prévoir des champs d'image dans les settings/metafields pour que je puisse les remplacer facilement une fois les vraies photos produit prêtes.
- Les avis clients, le compteur "8 personnes regardent" (retiré de la maquette, ne pas le réintégrer), et tout contenu marqué "Contenu démo" dans la maquette sont fictifs — à remplacer par de vraies données ou une vraie app d'avis (Judge.me, Loox, etc.) avant mise en ligne.
- Les tailles de nails (Almond/Amande, Coffin/Ballerine, Square/Carré, Stiletto) doivent devenir de vraies options de variante Shopify, pas juste des boutons visuels.
- Le style Shopify (thème) est distinct de ma stack habituelle (Next.js/Supabase) — reste bien en Liquid/JSON natif Shopify pour ce projet, pas de framework JS ajouté par-dessus sauf besoin réel.

On avance étape par étape à partir de maintenant — commence par l'étape 1 et montre-moi le résultat avant de passer à la conversion de `product.html`.
