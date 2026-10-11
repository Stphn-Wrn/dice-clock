# Dice Clocks

[Version française](README.fr.md)

A Foundry VTT module for countdowns made of dice. The GM spends points as the story moves on; a clock can follow the time of day and ring every full hour, and it posts a final message when its dice run out. Works with any system.

## What it does

- **As many clocks as you need**, each with its own name and dice: a burning torch, a ritual in progress, a patrol, the hours of a haunted night.
- **Presets** to start quickly: Death House (3d6 from 6 PM, 20 minutes per point), Torch (1d6), Day (4d6, one hour per point), Threat (2d6, GM only), or a plain clock.
- **Your own buttons**: each clock has the actions you choose ("Search a room", "Travel", "Long rest"...), each costing points or hours.
- **Time of day, if you want it**: show the time in 24-hour or 12-hour format, with a chime and a chat message on every full hour. Without time, the clock shows the points left.
- **Visibility**: share a clock with the players (read-only) or keep it for the GM, with public or whispered chat messages.
- **A final message** of your choice when the dice run out.

## Installation

In Foundry: *Add-on Modules, Install Module*, then paste this manifest URL:

```
https://raw.githubusercontent.com/Stphn-Wrn/dice-clock/main/module.json
```

## Usage

Enable the module, then click the **die** icon in the left toolbar. As GM, pick a preset and click **New clock**; the editor opens so you can name it and adjust its dice, time, visibility, messages and actions. Each clock then has its action buttons, -1 / +1 to adjust by hand, a reset button, and the pen to edit it again.

Module settings: the chime sound and the time format.

## Coming from the SotDL Companion

The clock used to be part of the [SotDL Companion](https://github.com/Stphn-Wrn/sodl-custom). The first time a GM opens the world with this module, the Companion's clock becomes your first clock, with the settings you had changed and the points left.

## Customization

- **Presets**: `PRESETS` in `src/clock-model.js`, texts in `lang/en.json` and `lang/fr.json`.
- **Chat messages**: `_announce()` and `_post()` in `src/dice-clock-manager.js`.
- **Look**: `src/dice-clock.css`; the clock list is `src/dice-clock.html`, the editor `src/clock-editor.html`.
- **Default chime**: `sounds/chime.wav`, an original synthesized sound you are free to reuse.

## Macros

`DiceClockManager` is available for macros and the console:

```javascript
const [clock] = DiceClockManager.getClocks();
await DiceClockManager.spend(clock.id, 1);      // remove one point
await DiceClockManager.adjust(clock.id, 1);     // give one back
await DiceClockManager.reset(clock.id);
await DiceClockManager.addClock("torch");       // deathHouse, torch, day, threat, custom
```

## Development

```bash
npm test
```

## License

MIT, including the chime sound.
