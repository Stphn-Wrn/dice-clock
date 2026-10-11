# Horloges à dés

[English version](README.md)

Un module Foundry VTT pour des comptes à rebours en dés. Le MJ dépense des points à mesure que l'histoire avance ; une horloge peut suivre l'heure de la journée et sonner chaque heure pleine, et elle poste un message final quand ses dés sont épuisés. Fonctionne avec tous les systèmes.

## Ce que fait le module

- **Autant d'horloges que nécessaire**, chacune avec son nom et ses dés : une torche qui brûle, un rituel en cours, une patrouille, les heures d'une nuit hantée.
- **Des modèles** pour démarrer vite : Maison de la Mort (3d6 à partir de 18h, 20 minutes par point), Torche (1d6), Journée (4d6, une heure par point), Menace (2d6, MJ seulement), ou une horloge simple.
- **Vos propres boutons** : chaque horloge a les actions que vous choisissez (« Fouiller une pièce », « Voyager », « Repos long »...), chacune coûtant des points ou des heures.
- **L'heure, si vous le voulez** : affichée au format 24 h ou 12 h, avec un carillon et un message dans le chat à chaque heure pleine. Sans heure, l'horloge affiche les points restants.
- **Visibilité** : partagez une horloge avec les joueurs (en lecture seule) ou gardez-la pour le MJ, avec des messages publics ou chuchotés.
- **Un message final** de votre choix quand les dés sont épuisés.

## Installation

Dans Foundry : *Modules complémentaires, Installer un module*, puis collez l'URL du manifeste :

```
https://raw.githubusercontent.com/Stphn-Wrn/dice-clock/main/module.json
```

## Utilisation

Activez le module, puis cliquez sur l'icône **dé** de la barre d'outils de gauche. En tant que MJ, choisissez un modèle et cliquez sur **Nouvelle horloge** : l'éditeur s'ouvre pour la nommer et régler ses dés, son heure, sa visibilité, ses messages et ses actions. Chaque horloge a ensuite ses boutons d'action, -1 / +1 pour ajuster à la main, un bouton de remise à zéro et le crayon pour la modifier.

Paramètres du module : le son du carillon et le format de l'heure.

## Si vous utilisiez le Compagnon SODL

L'horloge faisait partie du [Compagnon SODL](https://github.com/Stphn-Wrn/sodl-custom). La première fois qu'un MJ ouvre le monde avec ce module, l'horloge du Compagnon devient votre première horloge, avec les réglages que vous aviez modifiés et les points restants.

## Personnalisation

- **Modèles** : `PRESETS` dans `src/clock-model.js`, textes dans `lang/fr.json` et `lang/en.json`.
- **Messages du chat** : `_announce()` et `_post()` dans `src/dice-clock-manager.js`.
- **Apparence** : `src/dice-clock.css` ; la liste des horloges est `src/dice-clock.html`, l'éditeur `src/clock-editor.html`.
- **Carillon par défaut** : `sounds/chime.wav`, un son original synthétisé, libre de réutilisation.

## Macros

`DiceClockManager` est accessible depuis les macros et la console :

```javascript
const [clock] = DiceClockManager.getClocks();
await DiceClockManager.spend(clock.id, 1);      // retirer un point
await DiceClockManager.adjust(clock.id, 1);     // en rendre un
await DiceClockManager.reset(clock.id);
await DiceClockManager.addClock("torch");       // deathHouse, torch, day, threat, custom
```

## Développement

```bash
npm test
```

## Licence

MIT, carillon compris.
