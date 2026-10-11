import { modulePath } from "./shared/constants.js";
import { getDialogClass, t } from "./shared/foundry-adapter.js";
import { PRESETS } from "./clock-model.js";
import { DiceClockManager } from "./dice-clock-manager.js";
import { openClockEditor } from "./clock-editor.js";

function costLabel(action) {
  if (action.unit === "hour") {
    return t("DICECLOCK.Cost.Hours", { count: action.amount });
  }
  return t("DICECLOCK.Cost.Points", { count: action.amount });
}

function statusIcon(clock) {
  if (clock.showTime) {
    return "fa-clock";
  }
  return "fa-hourglass-half";
}

function clockView(clock) {
  return {
    id: clock.id,
    name: DiceClockManager.nameOf(clock),
    gmOnly: clock.visibility === "gm",
    status: DiceClockManager.statusLine(clock),
    statusIcon: statusIcon(clock),
    ended: clock.remaining === 0,
    dice: DiceClockManager.diceView(clock),
    actions: clock.actions.map((action) => ({ id: action.id, label: action.label, icon: action.icon, cost: costLabel(action) }))
  };
}

function confirm(title, content, onYes) {
  const DialogClass = getDialogClass();
  new DialogClass({
    title,
    content: `<p>${content}</p>`,
    buttons: {
      yes: { icon: '<i class="fas fa-check"></i>', label: t("DICECLOCK.Common.Confirm"), callback: onYes },
      no: { icon: '<i class="fas fa-times"></i>', label: t("DICECLOCK.Common.Cancel") }
    },
    default: "no"
  }).render(true);
}

export class DiceClockApp extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "dice-clock-app",
      title: t("DICECLOCK.Title"),
      template: modulePath("src/dice-clock.html"),
      width: 300,
      height: "auto",
      resizable: true,
      minimizable: true,
      classes: ["dice-clock-window"]
    });
  }

  getData(options = {}) {
    const data = super.getData(options);
    data.isGM = game.user.isGM;
    data.presets = Object.entries(PRESETS).map(([id, preset]) => ({ id, label: t(preset.name) }));
    data.clocks = DiceClockManager.getVisibleClocks().map(clockView);
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!game.user.isGM) return;

    const clockId = (event) => $(event.currentTarget).closest("[data-clock-id]").attr("data-clock-id");

    html.find(".dice-clock-add").on("click", async () => {
      const clock = await DiceClockManager.addClock(html.find(".dice-clock-preset").val());
      if (clock) {
        openClockEditor(clock.id);
      }
    });
    html.find(".dice-clock-action").on("click", (event) => {
      DiceClockManager.runAction(clockId(event), $(event.currentTarget).attr("data-action-id"));
    });
    html.find(".dice-clock-minus").on("click", (event) => DiceClockManager.adjust(clockId(event), -1));
    html.find(".dice-clock-plus").on("click", (event) => DiceClockManager.adjust(clockId(event), 1));
    html.find(".dice-clock-edit").on("click", (event) => openClockEditor(clockId(event)));
    html.find(".dice-clock-reset").on("click", (event) => {
      const id = clockId(event);
      confirm(t("DICECLOCK.ResetDialog.Title"), t("DICECLOCK.ResetDialog.Content"), () => DiceClockManager.reset(id));
    });
    html.find(".dice-clock-delete").on("click", (event) => {
      const id = clockId(event);
      confirm(t("DICECLOCK.DeleteDialog.Title"), t("DICECLOCK.DeleteDialog.Content"), () => DiceClockManager.removeClock(id));
    });
  }
}
