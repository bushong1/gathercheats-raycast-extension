export function setSpeedScript(speed: string) {
  if (!["1", "2", "3", "4"].includes(speed)) {
    throw new Error(`Invalid speed: ${speed}. Choose 1, 2, 3, or 4.`);
  }

  return `(() => {
    try {
      const key = '__gatherCheatsSpeedInterval';
      window.clearInterval(window[key]);
      delete window[key];
      game.setSpeedModifier(${speed});
      if (${speed} !== 1) {
        window[key] = window.setInterval(() => {
          try { game.setSpeedModifier(${speed}); }
          catch (error) { console.error('GatherCheats speed reapply failed', error); }
        }, 60000);
      }
      copy('GATHERCHEATS_OK');
    } catch (error) {
      copy('GATHERCHEATS_ERROR: ' + String(error) + ' ' + (error && error.stack ? error.stack : ''));
    }
  })()`.replace(/\n\s*/g, " ");
}
