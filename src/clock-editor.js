import { modulePath } from "./shared/constants.js";
import { getDialogClass, renderTemplate, t } from "./shared/foundry-adapter.js";
import { DiceClockManager } from "./dice-clock-manager.js";

export const EDITOR_TEMPLATE = modulePath("src/clock-editor.html");

function choices(entries) {
  return Object.fromEntries(entries.map(([value, key]) => [value, t(key)]));
}

function readActions(form) {
  return [...form.querySelectorAll(".dice-clock-action-rows .dice-clock-action-row")].map((row) => {
    let id = row.dataset.actionId;
    if (!id) {
      id = foundry.utils.randomID();
    }
    return {
      id,
      label: row.querySelector(".action-label").value,
      icon: row.querySelector(".action-icon").value,
      amount: Number(row.querySelector(".action-amount").value),
      unit: row.querySelector(".action-unit").value
    };
  });
}

function readForm(form, clock) {
  const field = (name) => form.elements[name];
  const changes = {
    name: field("name").value,
    diceCount: Number(field("diceCount").value),
    faces: Number(field("faces").value),
    showTime: field("showTime").checked,
    startHour: Number(field("startHour").value),
    pipMinutes: Number(field("pipMinutes").value),
    visibility: field("visibility").value,
    messages: field("messages").value,
    chime: field("chime").checked,
    criticalMessage: field("criticalMessage").value,
    actions: readActions(form)
  };
  // New dice start full: the old points would not mean the same thing.
  if (changes.diceCount !== clock.diceCount || changes.faces !== clock.faces) {
    changes.remaining = changes.diceCount * changes.faces;
  }
  return changes;
}

function activateRows(html) {
  const rows = html.find(".dice-clock-action-rows");
  html.on("click", ".dice-clock-action-remove", (event) => $(event.currentTarget).closest(".dice-clock-action-row").remove());
  html.find(".dice-clock-action-add").on("click", () => {
    const template = html.find(".dice-clock-action-template")[0];
    rows.append(template.content.cloneNode(true));
  });
}

export async function openClockEditor(clockId) {
  const clock = DiceClockManager.getClock(clockId);
  if (!clock || !game.user.isGM) return;
  const content = await renderTemplate(EDITOR_TEMPLATE, {
    clock,
    visibilityChoices: choices([["players", "DICECLOCK.Editor.VisibilityPlayers"], ["gm", "DICECLOCK.Editor.VisibilityGm"]]),
    messageChoices: choices([["public", "DICECLOCK.Editor.MessagesPublic"], ["gm", "DICECLOCK.Editor.MessagesGm"]]),
    unitChoices: choices([["point", "DICECLOCK.Editor.UnitPoints"], ["hour", "DICECLOCK.Editor.UnitHours"]])
  });
  const DialogClass = getDialogClass();
  new DialogClass(
    {
      title: t("DICECLOCK.Editor.Title", { name: DiceClockManager.nameOf(clock) }),
      content,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: t("DICECLOCK.Common.Save"),
          callback: (html) => DiceClockManager.updateClock(clockId, readForm(html.find("form")[0], clock))
        },
        cancel: { icon: '<i class="fas fa-times"></i>', label: t("DICECLOCK.Common.Cancel") }
      },
      default: "save",
      render: activateRows
    },
    { width: 520, classes: ["dialog", "dice-clock-editor-dialog"] }
  ).render(true);
}
