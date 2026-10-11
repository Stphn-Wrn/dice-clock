import { modulePath } from "./shared/constants.js";
import { getDialogClass, t } from "./shared/foundry-adapter.js";
import { DiceClockManager } from "./dice-clock-manager.js";

export class DiceClockApp extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "dice-clock-app",
      title: t("DICECLOCK.DiceClock.Title"),
      template: modulePath("src/dice-clock.html"),
      width: 260,
      height: "auto",
      resizable: false,
      minimizable: true,
      classes: ["dice-clock-window"]
    });
  }

  getData(options = {}) {
    const data = super.getData(options);
    const state = DiceClockManager.getState();

    data.isGM = game.user.isGM;
    data.hourLabel = DiceClockManager.getHourLabel(state.hour);
    data.isMidnight = state.remaining === 0;
    data.dice = DiceClockManager.getDiceValues(state.remaining).map((value) => ({
      value,
      visible: value > 0,
      icon: DiceClockManager.getDiceIcon(value)
    }));
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!game.user.isGM) return;

    html.find(".dice-clock-room").on("click", () => DiceClockManager.removePoints(1));
    html.find(".dice-clock-rest").on("click", () => DiceClockManager.removePoints(DiceClockManager.pipsPerHour));
    html.find(".dice-clock-minus").on("click", () => DiceClockManager.manualAdjust(-1));
    html.find(".dice-clock-plus").on("click", () => DiceClockManager.manualAdjust(1));

    html.find(".dice-clock-reset").on("click", () => {
      const DialogClass = getDialogClass();
      new DialogClass({
        title: t("DICECLOCK.DiceClock.ResetDialog.Title"),
        content: `<p>${t("DICECLOCK.DiceClock.ResetDialog.Content")}</p>`,
        buttons: {
          yes: {
            icon: '<i class="fas fa-undo"></i>',
            label: t("DICECLOCK.DiceClock.Reset"),
            callback: () => DiceClockManager.resetClock()
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: t("DICECLOCK.Common.Cancel")
          }
        },
        default: "no"
      }).render(true);
    });
  }
}
