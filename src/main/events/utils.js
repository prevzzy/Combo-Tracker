import { TOAST_EVENT_TYPES } from './toastEventTypes'

export function isToastTypeSettingsDependant(eventName) {
  return eventName === TOAST_EVENT_TYPES.NEW_BEST_SCORE ||
    eventName === TOAST_EVENT_TYPES.NEW_MAP_DETECTED
}
