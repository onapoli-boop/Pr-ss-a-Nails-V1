# Mise en place du kit "7 Days · 7 Looks"

Le prix à 40€ pour 7 sets est géré par une **réduction automatique Shopify**, pas par du code du thème — le thème se contente d'afficher la progression et de proposer les boutons d'ajout. Voici la configuration côté admin, en 4 étapes.

## 1. Tagger les produits éligibles

Pour chaque set qui doit pouvoir entrer dans le kit "7 Days" :

1. **Catalogue → Produits →** ouvre le produit
2. Dans le champ **Tags**, ajoute :
   - Le tag `7days` (obligatoire — c'est lui qui fait apparaître le bouton "Ajouter à mon kit" sur la fiche produit)
   - Si ce produit doit aussi représenter un jour précis dans le calendrier de la section "7 Days · 7 Looks" de l'accueil, ajoute en plus le tag du jour correspondant : `lundi`, `mardi`, `mercredi`, `jeudi`, `vendredi`, `samedi` ou `dimanche` (un seul produit par jour — le premier trouvé avec le tag est utilisé)

**Tous les produits tagués `7days` doivent avoir le même prix** (ex: 14,90€) — c'est ce qui permet à la réduction automatique de calculer un montant fixe et fiable à l'étape 3.

## 2. Créer la collection "7 Days"

**Produits → Collections → Créer une collection**
- Titre : `7 Days`
- Type de collection : **Automatique**
- Condition : `Tag` `est égal à` `7days`

Cette collection doit être sélectionnée à **deux endroits** dans Personnaliser (les réglages globaux du thème ne supportent pas les sélecteurs de collection, donc chaque section qui en a besoin a son propre champ) :
- Section **En-tête** → réglage "Collection des sets éligibles au kit 7 Days" (pour le badge de progression dans le panier)
- Section **7 Days · 7 Looks** (sur l'accueil) → même réglage (pour les images du calendrier par jour)

## 3. Créer la réduction automatique

**Réductions → Créer une réduction → Réduction automatique**

- Type : **Montant fixe sur la commande**
- Condition : quantité minimale d'articles = **7**, applicable uniquement aux produits de la collection **7 Days**
- Montant de la réduction = `(prix unitaire × 7) − 40€`

  Exemple avec un prix unitaire à 14,90€ : `(14,90 × 7) − 40 = 64,30€` de réduction dès que 7 articles de la collection sont dans le panier.

  **Si tu changes le prix unitaire des sets 7 Days, il faut recalculer et mettre à jour ce montant.**

## 4. Vérifier les réglages

**Personnaliser → Réglages du thème → Kit 7 Days** (paramètres globaux, valeurs par défaut déjà correctes)
- Tag produit utilisé pour le kit 7 Days : `7days`
- Nombre d'articles pour compléter le kit : `7`
- Prix affiché du kit complet : `40 €` (texte affiché dans le badge "Kit complet", purement informatif — n'affecte pas le calcul réel)

**Personnaliser → section En-tête** et **Personnaliser → accueil → section 7 Days · 7 Looks**
- Collection des sets éligibles : `7 Days` (à sélectionner dans les deux, voir étape 2 ci-dessus)

## Ce que fait le thème automatiquement une fois configuré

- Un badge dans l'en-tête ("Kit 7 Days · 3/7") apparaît dès qu'un produit tagué `7days` est dans le panier, et passe en "Kit complet" à 7
- Chaque fiche produit taguée `7days` affiche un bouton "Ajouter à mon kit 7 Days"
- La section "7 Days · 7 Looks" de l'accueil affiche automatiquement l'image du produit tagué pour chaque jour (`lundi`, `mardi`, etc.) à la place de la couleur de repli
- Le quiz popup ("Obtenir les 7 looks") continue d'ajouter 7 produits d'un coup selon les moods configurés dans les blocs "Option du quiz" de la même section

Dans tous les cas, une fois 7 articles de la collection dans le panier, c'est la réduction automatique créée à l'étape 3 qui ramène le total à 40€ — le thème ne fait qu'afficher où on en est.
