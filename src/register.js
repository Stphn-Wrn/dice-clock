import { MODULE_ID } from "./shared/constants.js";
import { backToTokenControls, rerenderOpenApps, t } from "./shared/foundry-adapter.js";
import { DiceClockManager } from "./dice-clock-manager.js";
import { DiceClockApp } from "./dice-clock-app.js";
import { migrateFromCompanion, registerMigrationSettings } from "./shared/companion-migration.js";
import { CLIENT_RULES, WORLD_RULES } from "./migration-rules.js";

export const diceClockFeature = {
  init() {
    window.DiceClockManager = DiceClockManager;
    window.DiceClockApp = DiceClockApp;

    game.settings.register(MODULE_ID, "diceClockDiceCount", {
      name: "DICECLOCK.Settings.DiceClockDiceCount.Name",
      hint: "DICECLOCK.Settings.DiceClockDiceCount.Hint",
      scope: "world",
      config: true,
      type: Number,
      default: 3,
      range: { min: 1, max: 8, step: 1 },
      onChange: () => DiceClockManager.resetClock()
    });

    game.settings.register(MODULE_ID, "diceClockFaces", {
      name: "DICECLOCK.Settings.DiceClockFaces.Name",
      hint: "DICECLOCK.Settings.DiceClockFaces.Hint",
      scope: "world",
      config: true,
      type: Number,
      default: 6,
      range: { min: 2, max: 20, step: 1 },
      onChange: () => DiceClockManager.resetClock()
    });

    game.settings.register(MODULE_ID, "diceClockPipMinutes", {
      name: "DICECLOCK.Settings.DiceClockPipMinutes.Name",
      hint: "DICECLOCK.Settings.DiceClockPipMinutes.Hint",
      scope: "world",
      config: true,
      type: Number,
      default: 20,
      range: { min: 1, max: 120, step: 1 }
    });

    game.settings.register(MODULE_ID, "diceClockStartHour", {
      name: "DICECLOCK.Settings.DiceClockStartHour.Name",
      hint: "DICECLOCK.Settings.DiceClockStartHour.Hint",
      scope: "world",
      config: true,
      type: Number,
      default: 18,
      range: { min: 0, max: 23, step: 1 },
      onChange: () => DiceClockManager.resetClock()
    });

    game.settings.register(MODULE_ID, "diceClockSoundPath", {
      name: "DICECLOCK.Settings.DiceClockSoundPath.Name",
      hint: "DICECLOCK.Settings.DiceClockSoundPath.Hint",
      scope: "world",
      config: true,
      type: String,
      default: "modules/dice-clock/sounds/vecna-clock.mp3",
      filePicker: "audio",
      onChange: () => rerenderOpenApps(DiceClockApp)
    });

    game.settings.register(MODULE_ID, "diceClockCriticalMessage", {
      name: "DICECLOCK.Settings.DiceClockCriticalMessage.Name",
      hint: "DICECLOCK.Settings.DiceClockCriticalMessage.Hint",
      scope: "world",
      config: true,
      type: String,
      default: "DICECLOCK.DiceClock.DefaultCriticalMessage"
    });

    game.settings.register(MODULE_ID, "diceClockState", {
      scope: "world",
      config: false,
      type: Object,
      default: { remaining: 18, hour: 18 },
      onChange: () => rerenderOpenApps(DiceClockApp)
    });

    registerMigrationSettings();
  },

  async ready() {
    DiceClockManager.suspendReset = true;
    try {
      if (await migrateFromCompanion({ worldRules: WORLD_RULES, clientRules: CLIENT_RULES })) {
        ui.notifications.info(t("DICECLOCK.Migration.Done"));
      }
    } finally {
      DiceClockManager.suspendReset = false;
    }
  },

  getSceneControlButtons(controls) {
    controls.diceClock = {
      name: "diceClock",
      title: t("DICECLOCK.DiceClock.Title"),
      icon: "fas fa-dice-six",
      order: 101,
      tools: {
        open: {
          name: "open",
          title: t("DICECLOCK.DiceClock.OpenTool"),
          icon: "fas fa-dice-six",
          button: true,
          onChange: (event, active) => {
            if (active) {
              new DiceClockApp().render(true);
              backToTokenControls();
            }
          }
        }
      },
      activeTool: "open"
    };
  }
};
