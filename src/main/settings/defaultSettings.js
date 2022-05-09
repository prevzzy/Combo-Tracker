import path from 'path'
import { app } from 'electron'

export const SETTINGS_STRINGS = {
  ALLOW_BAILED_COMBOS: 'allow-bailed-combos',
  ENABLE_TOASTS: 'enable-toasts',
  ENABLE_SCREENSHOTS: 'enable-screenshots',
  SCREENSHOTS_MINIMAL_SCORE: 'screenshots-minimal-score',
  SCREENSHOTS_PATH: 'screenshots-path',
  ALL_TOP_SCORES_HOTKEY: 'all-top-scores-hotkey',
  MAP_TOP_SCORES_HOTKEY: 'map-top-scores-hotkey'
}

export const defaultSettings = {
  [SETTINGS_STRINGS.ALLOW_BAILED_COMBOS]: true,
  [SETTINGS_STRINGS.ENABLE_TOASTS]: true,
  [SETTINGS_STRINGS.ENABLE_SCREENSHOTS]: true,
  [SETTINGS_STRINGS.SCREENSHOTS_MINIMAL_SCORE]: 1000000,
  [SETTINGS_STRINGS.SCREENSHOTS_PATH]: path.join(app.getPath('pictures'), 'Combo Tracker'),
  [SETTINGS_STRINGS.ALL_TOP_SCORES_HOTKEY]: 'F6',
  [SETTINGS_STRINGS.MAP_TOP_SCORES_HOTKEY]: 'F7',
}
