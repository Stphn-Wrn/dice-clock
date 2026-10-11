import { MODULE_ID } from "./shared/constants.js";
import { escapeHTML, playSound, t } from "./shared/foundry-adapter.js";
import {
  actionPoints,
  clockMinutes,
  createClock,
  diceValues,
  formatTime,
  normalizeClock,
  resetClock,
  restore,
  spend,
  totalPips,
  visibleClocks
} from "./clock-model.js";

const DICE_ICONS = [null, "fa-dice-one", "fa-dice-two", "fa-dice-three", "fa-dice-four", "fa-dice-five", "fa-dice-six"];

// Reads and writes the clocks (a world setting) and announces what happens to them.
export class DiceClockManager {
  static getClocks() {
    const stored = game.settings.get(MODULE_ID, "clocks")?.clocks ?? [];
    return stored.map(normalizeClock);
  }

  static getVisibleClocks() {
    return visibleClocks(this.getClocks(), game.user.isGM);
  }

  static getClock(id) {
    return this.getClocks().find((clock) => clock.id === id) ?? null;
  }

  static async saveClocks(clocks) {
    await game.settings.set(MODULE_ID, "clocks", { clocks: clocks.map(normalizeClock) });
  }

  static async replaceClock(updated) {
    await this.saveClocks(this.getClocks().map((clock) => {
      if (clock.id === updated.id) {
        return updated;
      }
      return clock;
    }));
  }

  static async addClock(presetId) {
    if (!game.user.isGM) return null;
    const clock = createClock(presetId, { id: foundry.utils.randomID(), t });
    await this.saveClocks([...this.getClocks(), clock]);
    return clock;
  }

  static async updateClock(id, changes) {
    if (!game.user.isGM) return;
    const clock = this.getClock(id);
    if (!clock) return;
    await this.replaceClock(normalizeClock({ ...clock, ...changes, id }));
  }

  static async removeClock(id) {
    if (!game.user.isGM) return;
    await this.saveClocks(this.getClocks().filter((clock) => clock.id !== id));
  }

  static async spend(id, points) {
    if (!game.user.isGM) return;
    const clock = this.getClock(id);
    if (!clock) return;
    const result = spend(clock, points);
    await this.replaceClock(result.clock);
    for (const event of result.events) {
      await this._announce(result.clock, event);
    }
  }

  static async runAction(id, actionId) {
    const clock = this.getClock(id);
    const action = clock?.actions.find((entry) => entry.id === actionId);
    if (!action) return;
    await this.spend(id, actionPoints(clock, action));
  }

  static async adjust(id, delta) {
    if (!game.user.isGM) return;
    if (delta < 0) {
      await this.spend(id, -delta);
      return;
    }
    const clock = this.getClock(id);
    if (clock) {
      await this.replaceClock(restore(clock, delta));
    }
  }

  static async reset(id) {
    if (!game.user.isGM) return;
    const clock = this.getClock(id);
    if (!clock) return;
    const fresh = resetClock(clock);
    await this.replaceClock(fresh);
    await this._post(fresh, "fa-rotate-left", t("DICECLOCK.Chat.ResetTitle", { name: this.nameOf(fresh) }), this.statusLine(fresh));
  }

  static nameOf(clock) {
    if (clock.name) {
      return clock.name;
    }
    return t("DICECLOCK.Untitled");
  }

  static formatMinutes(minutes) {
    const patterns = { h24: t("DICECLOCK.TimeFormat.H24"), h12: t("DICECLOCK.TimeFormat.H12") };
    return formatTime(minutes, game.settings.get(MODULE_ID, "timeFormat"), patterns);
  }

  static timeLabel(clock) {
    const minutes = clockMinutes(clock);
    if (minutes === null) {
      return null;
    }
    return this.formatMinutes(minutes);
  }

  static pointsLabel(clock) {
    return t("DICECLOCK.PointsLeft", { remaining: clock.remaining, total: totalPips(clock) });
  }

  static statusLine(clock) {
    return this.timeLabel(clock) ?? this.pointsLabel(clock);
  }

  static diceView(clock) {
    return diceValues(clock).map((value) => {
      let icon = null;
      if (clock.faces === 6 && value >= 1) {
        icon = DICE_ICONS[value];
      }
      return { value, visible: value > 0, icon };
    });
  }

  static async _announce(clock, event) {
    if (event.type === "hour") {
      await this._chime(clock);
      const time = this.formatMinutes(event.minutes);
      await this._post(clock, "fa-bell", t("DICECLOCK.Chat.ChimeTitle", { name: this.nameOf(clock) }), t("DICECLOCK.Chat.ChimeBody", { time: `<strong>${time}</strong>` }));
      return;
    }
    if (event.type === "end") {
      let message = clock.criticalMessage;
      if (!message) {
        message = t("DICECLOCK.Chat.EndBody");
      }
      await this._post(clock, "fa-triangle-exclamation", this.nameOf(clock), escapeHTML(message), "dice-clock-critical");
    }
  }

  static async _chime(clock) {
    const soundPath = game.settings.get(MODULE_ID, "soundPath");
    if (!clock.chime || !soundPath) return;
    try {
      await playSound({ src: soundPath, volume: 0.8, autoplay: true, loop: false }, clock.messages === "public");
    } catch (err) {
      console.warn("Dice Clock | Could not play the chime", err);
    }
  }

  static async _post(clock, icon, title, body, extraClass = "") {
    const data = {
      content: `
        <div class="dice-clock-message ${extraClass}">
          <p><strong><i class="fas ${icon}"></i> ${escapeHTML(title)}</strong></p>
          <p>${body}</p>
        </div>
      `
    };
    if (clock.messages === "gm") {
      data.whisper = ChatMessage.getWhisperRecipients("GM");
    }
    await ChatMessage.create(data);
  }
}
