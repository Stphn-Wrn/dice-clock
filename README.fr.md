# Horloge à dés

[English version](README.md)

Un module Foundry VTT qui mesure le temps avec des dés. Le MJ retire des points d'une rangée de dés à mesure que le groupe explore ; chaque heure pleine fait sonner un carillon et poste un message dans le chat, et le dernier point déclenche un message final. Fonctionne avec tous les systèmes.

## Ce que fait le module

- Un compte à rebours affiché sous forme de dés, avec l'heure en cours.
- Le MJ retire un point (fouiller une pièce, changer d'étage), une heure (repos court) ou ajuste à la main ; les joueurs voient l'horloge en lecture seule.
- Chaque heure pleine joue un carillon et annonce la nouvelle heure dans le chat ; quand les dés sont épuisés, le message final de votre choix est posté.
- Configurable : nombre de dés, faces par dé, minutes par point, heure de départ, son du carillon et message final.

## Installation

Dans Foundry : *Modules complémentaires, Installer un module*, puis collez l'URL du manifeste :

```
https://raw.githubusercontent.com/Stphn-Wrn/dice-clock/main/module.json
```

## Utilisation

Activez le module dans votre monde, puis cliquez sur l'icône **dé** de la barre d'outils de gauche pour ouvrir l'horloge. Les réglages sont dans *Configurer les paramètres, Paramètres des modules*.

## Si vous utilisiez le Compagnon SODL

L'horloge faisait partie du [Compagnon SODL](https://github.com/Stphn-Wrn/sodl-custom). La première fois qu'un MJ ouvre le monde avec ce module, l'état de l'horloge et les réglages que vous aviez modifiés sont repris du Compagnon.

## Personnalisation

Les réglages courants se font dans les paramètres du module. Le reste :
- **boutons du MJ** : `src/dice-clock.html` pour l'affichage, `activateListeners()` de `src/dice-clock-app.js` pour l'action ;
- **messages du chat** : `_removeOnePoint()` et `resetClock()` de `src/dice-clock-manager.js`, textes dans `lang/fr.json` et `lang/en.json` ;
- **son par défaut** : `sounds/vecna-clock.mp3` ;
- **apparence** : `src/dice-clock.css`.

## Macros

`DiceClockManager` est accessible depuis les macros et la console :

```javascript
DiceClockManager.getState();         // { remaining, hour }
await DiceClockManager.removePoints(1);
await DiceClockManager.resetClock();
```

## Développement

```bash
npm test
```

## Licence

MIT.
