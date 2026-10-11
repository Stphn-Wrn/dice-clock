import { MODULE_ID } from "./shared/constants.js";
import { backToTokenControls, loadTemplates, rerenderOpenApps, t } from "./shared/foundry-adapter.js";
import { DiceClockManager } from "./dice-clock-manager.js";
import { DiceClockApp } from "./dice-clock-app.js";
import { EDITOR_TEMPLATE } from "./clock-editor.js";
import { migrateFromCompanion, registerMigrationSettings } from "./shared/companion-migration.js";
import { CLIENT_RULES, WORLD_RULES, toClockSettings } from "./migration-rules.js";

export const DEFAULT_SOUND = `modules/${MODULE_ID}/sounds/chime.wav`;

function rerender() {
  rerenderOpenApps(DiceClockApp);
}

export const diceClockFeature = {
  init() {
    window.DiceClockManager = DiceClockManager;
    window.DiceClockApp = DiceClockApp;

    game.settings.register(MODULE_ID, "clocks", {
      scope: "world",
      config: false,
      type: Object,
      default: { clocks: [] },
      onChange: rerender
    });

    game.settings.register(MODULE_ID, "soundPath", {
      name: "DICECLOCK.Settings.SoundPath.Name",
      hint: "DICECLOCK.Settings.SoundPath.Hint",
      scope: "world",
      config: true,
      type: String,
      default: DEFAULT_SOUND,
      filePicker: "audio"
    });

    game.settings.register(MODULE_ID, "timeFormat", {
      name: "DICECLOCK.Settings.TimeFormat.Name",
      hint: "DICECLOCK.Settings.TimeFormat.Hint",
      scope: "world",
      config: true,
      type: String,
      choices: { "24h": "DICECLOCK.Settings.TimeFormat.H24", "12h": "DICECLOCK.Settings.TimeFormat.H12" },
      default: "24h",
      onChange: rerender
    });

    registerMigrationSettings();
    loadTemplates([EDITOR_TEMPLATE]);
  },

  async ready() {
    const imported = await migrateFromCompanion({
      worldRules: WORLD_RULES,
      clientRules: CLIENT_RULES,
      toWorldSettings: (changed) => toClockSettings(changed, { id: foundry.utils.randomID(), t })
    });
    if (imported) {
      ui.notifications.info(t("DICECLOCK.Migration.Done"));
    }
  },

  getSceneControlButtons(controls) {
    controls.diceClock = {
      name: "diceClock",
      title: t("DICECLOCK.Title"),
      icon: "fas fa-dice-six",
      order: 101,
      tools: {
        open: {
          name: "open",
          title: t("DICECLOCK.OpenTool"),
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
