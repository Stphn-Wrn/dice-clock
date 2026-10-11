# Dice Clock

[Version française](README.fr.md)

A Foundry VTT module that keeps time with dice. The GM spends points from a row of dice as the party explores; every full hour rings a chime and posts a message in the chat, and the last point triggers a final message. Works with any system.

## What it does

- A countdown clock shown as dice, with the current hour.
- The GM removes a point (search a room, change floor), an hour (short rest) or adjusts by hand; players see the clock read-only.
- Every full hour plays a chime and posts the new hour in the chat; when the dice run out, a final message of your choice is posted.
- Configurable: number of dice, faces per die, minutes per point, starting hour, chime sound and final message.

## Installation

In Foundry: *Add-on Modules, Install Module*, then paste this manifest URL:

```
https://raw.githubusercontent.com/Stphn-Wrn/dice-clock/main/module.json
```

## Usage

Enable the module in your world, then click the **die** icon in the left toolbar to open the clock. Settings are in *Configure Settings, Module Settings*.

## Coming from the SotDL Companion

The clock used to be part of the [SotDL Companion](https://github.com/Stphn-Wrn/sodl-custom). The first time a GM opens the world with this module, the clock's state and the settings you had changed are imported from the Companion.

## Customization

Everyday settings are in the module settings. The rest:
- **GM buttons**: `src/dice-clock.html` for display, `activateListeners()` in `src/dice-clock-app.js` for the action;
- **chat messages**: `_removeOnePoint()` and `resetClock()` in `src/dice-clock-manager.js`, texts in `lang/en.json` and `lang/fr.json`;
- **default sound**: `sounds/vecna-clock.mp3`;
- **look**: `src/dice-clock.css`.

## Macros

`DiceClockManager` is available for macros and the console:

```javascript
DiceClockManager.getState();         // { remaining, hour }
await DiceClockManager.removePoints(1);
await DiceClockManager.resetClock();
```

## Development

```bash
npm test
```

## License

MIT.
