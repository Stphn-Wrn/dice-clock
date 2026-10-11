// Pure logic of the dice clocks: no Foundry calls, covered by tests.

export const UNITS = ["point", "hour"];
export const VISIBILITIES = ["players", "gm"];
export const AUDIENCES = ["public", "gm"];
export const TIME_FORMATS = ["24h", "12h"];

const DEFAULT_ICON = "fa-hourglass-half";
const MINUTES_PER_DAY = 24 * 60;

const LIMITS = {
  diceCount: [1, 8],
  faces: [2, 20],
  startHour: [0, 23],
  pipMinutes: [1, 240]
};

// Texts are i18n keys, translated when a clock is created so the GM edits plain text.
export const PRESETS = {
  deathHouse: {
    name: "DICECLOCK.Presets.DeathHouse.Name",
    diceCount: 3,
    faces: 6,
    showTime: true,
    startHour: 18,
    pipMinutes: 20,
    visibility: "players",
    messages: "public",
    criticalMessage: "DICECLOCK.Presets.DeathHouse.Final",
    actions: [
      { label: "DICECLOCK.Actions.SearchRoom", icon: "fa-door-open", amount: 1, unit: "point" },
      { label: "DICECLOCK.Actions.ShortRest", icon: "fa-bed", amount: 1, unit: "hour" }
    ]
  },
  torch: {
    name: "DICECLOCK.Presets.Torch.Name",
    diceCount: 1,
    faces: 6,
    showTime: false,
    startHour: 0,
    pipMinutes: 10,
    visibility: "players",
    messages: "public",
    criticalMessage: "DICECLOCK.Presets.Torch.Final",
    actions: [{ label: "DICECLOCK.Actions.ExplorationTurn", icon: "fa-fire", amount: 1, unit: "point" }]
  },
  day: {
    name: "DICECLOCK.Presets.Day.Name",
    diceCount: 4,
    faces: 6,
    showTime: true,
    startHour: 6,
    pipMinutes: 60,
    visibility: "players",
    messages: "public",
    criticalMessage: "DICECLOCK.Presets.Day.Final",
    actions: [
      { label: "DICECLOCK.Actions.OneHour", icon: "fa-clock", amount: 1, unit: "hour" },
      { label: "DICECLOCK.Actions.LongRest", icon: "fa-moon", amount: 8, unit: "hour" }
    ]
  },
  threat: {
    name: "DICECLOCK.Presets.Threat.Name",
    diceCount: 2,
    faces: 6,
    showTime: false,
    startHour: 0,
    pipMinutes: 10,
    visibility: "gm",
    messages: "gm",
    criticalMessage: "DICECLOCK.Presets.Threat.Final",
    actions: [{ label: "DICECLOCK.Actions.Escalate", icon: "fa-skull", amount: 1, unit: "point" }]
  },
  custom: {
    name: "DICECLOCK.Presets.Custom.Name",
    diceCount: 3,
    faces: 6,
    showTime: false,
    startHour: 0,
    pipMinutes: 10,
    visibility: "players",
    messages: "public",
    criticalMessage: "DICECLOCK.Presets.Custom.Final",
    actions: [{ label: "DICECLOCK.Actions.OnePoint", icon: "fa-minus", amount: 1, unit: "point" }]
  }
};

function clampInteger(value, [min, max], fallback) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, number));
}

function oneOf(value, allowed) {
  if (allowed.includes(value)) {
    return value;
  }
  return allowed[0];
}

function text(value) {
  return String(value ?? "").trim();
}

function normalizeAction(action) {
  let icon = text(action.icon);
  if (icon === "") {
    icon = DEFAULT_ICON;
  }
  return {
    id: text(action.id),
    label: text(action.label),
    icon,
    amount: clampInteger(action.amount, [1, 999], 1),
    unit: oneOf(action.unit, UNITS)
  };
}

export function totalPips(clock) {
  return clock.diceCount * clock.faces;
}

// Brings any stored or edited clock back to valid values, always with the same key order.
export function normalizeClock(raw) {
  const diceCount = clampInteger(raw.diceCount, LIMITS.diceCount, 3);
  const faces = clampInteger(raw.faces, LIMITS.faces, 6);
  const total = diceCount * faces;
  return {
    id: text(raw.id),
    name: text(raw.name),
    diceCount,
    faces,
    remaining: clampInteger(raw.remaining ?? total, [0, total], total),
    showTime: Boolean(raw.showTime),
    startHour: clampInteger(raw.startHour, LIMITS.startHour, 0),
    pipMinutes: clampInteger(raw.pipMinutes, LIMITS.pipMinutes, 10),
    visibility: oneOf(raw.visibility, VISIBILITIES),
    messages: oneOf(raw.messages, AUDIENCES),
    chime: raw.chime !== false,
    criticalMessage: text(raw.criticalMessage),
    actions: (raw.actions ?? []).map(normalizeAction).filter((action) => action.label !== "")
  };
}

export function createClock(presetId, { id, t }) {
  const preset = PRESETS[presetId] ?? PRESETS.custom;
  return normalizeClock({
    ...preset,
    id,
    name: t(preset.name),
    remaining: preset.diceCount * preset.faces,
    chime: true,
    criticalMessage: t(preset.criticalMessage),
    actions: preset.actions.map((action, position) => ({ ...action, id: `${id}-${position}`, label: t(action.label) }))
  });
}

// The first die empties last: with 3d6 and 14 points left, the dice read 6, 6, 2.
export function diceValues(clock) {
  const values = [];
  for (let position = 0; position < clock.diceCount; position++) {
    const offset = clock.faces * position;
    values.push(Math.max(0, Math.min(clock.faces, clock.remaining - offset)));
  }
  return values;
}

export function pipsPerHour(clock) {
  return Math.max(1, Math.round(60 / clock.pipMinutes));
}

export function actionPoints(clock, action) {
  if (action.unit === "hour") {
    return action.amount * pipsPerHour(clock);
  }
  return action.amount;
}

// Minutes since midnight of the start day, or null when the clock does not track time.
export function clockMinutes(clock) {
  if (!clock.showTime) {
    return null;
  }
  return clock.startHour * 60 + (totalPips(clock) - clock.remaining) * clock.pipMinutes;
}

export function spend(clock, points) {
  let current = { ...clock };
  const events = [];
  for (let step = 0; step < points && current.remaining > 0; step++) {
    const before = clockMinutes(current);
    current = { ...current, remaining: current.remaining - 1 };
    const after = clockMinutes(current);
    if (after !== null && Math.floor(after / 60) > Math.floor(before / 60)) {
      events.push({ type: "hour", minutes: Math.floor(after / 60) * 60 });
    }
    if (current.remaining === 0) {
      events.push({ type: "end" });
    }
  }
  return { clock: current, events };
}

export function restore(clock, points) {
  return { ...clock, remaining: Math.min(totalPips(clock), clock.remaining + points) };
}

export function resetClock(clock) {
  return { ...clock, remaining: totalPips(clock) };
}

export function formatTime(minutes, format, patterns) {
  const ofDay = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hour = Math.floor(ofDay / 60);
  const minute = String(ofDay % 60).padStart(2, "0");
  if (format === "12h") {
    let period = "AM";
    if (hour >= 12) {
      period = "PM";
    }
    return patterns.h12.replace("{hour}", String(hour % 12 || 12)).replace("{minute}", minute).replace("{period}", period);
  }
  return patterns.h24.replace("{hour}", String(hour).padStart(2, "0")).replace("{minute}", minute);
}

export function visibleClocks(clocks, isGM) {
  if (isGM) {
    return clocks;
  }
  return clocks.filter((clock) => clock.visibility === "players");
}
