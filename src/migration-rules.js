// Settings brought over from the SotDL Companion, with the defaults it used.
// The state comes last: changing the dice, faces or start hour resets the clock.
export const WORLD_RULES = {
  diceClockDiceCount: { oldDefault: 3 },
  diceClockFaces: { oldDefault: 6 },
  diceClockPipMinutes: { oldDefault: 20 },
  diceClockStartHour: { oldDefault: 18 },
  diceClockSoundPath: { oldDefault: "modules/sodl-companion/sounds/vecna-clock.mp3" },
  diceClockCriticalMessage: { oldDefault: "SODL.DiceClock.DefaultCriticalMessage" },
  diceClockState: { oldDefault: { remaining: 18, hour: 18 } }
};

export const CLIENT_RULES = {};
