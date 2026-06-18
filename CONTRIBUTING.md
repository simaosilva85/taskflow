# Guide de contribution — TaskFlow

Ce document explique comment le groupe travaille sur le dépôt, afin que la
**participation de chaque membre** soit visible dans l'historique Git (exigence
du projet).

## 1. Récupérer le projet

```bash
git clone <url-du-depot> taskflow
cd taskflow
```

## 2. Chaque membre commite sous SON identité

Avant de commiter, chaque étudiant configure son nom et son email **une fois** :

```bash
git config user.name "Prénom Nom"
git config user.email "prenom.nom@exemple.com"
```

> Si vous travaillez en *pair programming* sur une même machine, ajoutez le
> co-auteur au message de commit :
>
> ```
> git commit -m "feat: ajoute le filtre par priorité
>
> Co-authored-by: Prénom Nom <email@exemple.com>"
> ```

## 3. Convention de messages (messages « métier » clairs)

Format : `type: description courte à l'impératif`

| Type       | Quand l'utiliser                          |
| ---------- | ----------------------------------------- |
| `feat`     | nouvelle fonctionnalité                   |
| `fix`      | correction de bug                         |
| `docs`     | documentation (README, rapport…)          |
| `chore`    | configuration, outillage (Docker, CI…)    |
| `refactor` | réorganisation sans changement de comportement |

Exemples :
- `feat: permet de marquer une tâche comme terminée`
- `fix: corrige la validation des priorités invalides`
- `chore: ajoute le Dockerfile et docker-compose`

## 4. Workflow recommandé

1. Créer une branche par fonctionnalité : `git checkout -b feat/filtres`
2. Commiter par petites étapes avec des messages clairs.
3. Ouvrir une *pull request* sur GitHub, faire relire par un autre membre.
4. Fusionner dans `main` → Coolify redéploie automatiquement.

## 5. Correspondance pseudo Git ↔ étudiant

Si vos pseudos GitHub ne permettent pas d'identifier les étudiants, complétez
ce tableau (à reporter aussi dans le rapport) :

| Pseudo GitHub | Étudiant·e        |
| ------------- | ----------------- |
| `_________`   | _________________ |
| `_________`   | _________________ |
| `_________`   | _________________ |
