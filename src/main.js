import { diceClockFeature } from "./register.js";

Hooks.once("init", () => diceClockFeature.init());
Hooks.once("ready", () => diceClockFeature.ready());
Hooks.on("getSceneControlButtons", (controls) => diceClockFeature.getSceneControlButtons(controls));
