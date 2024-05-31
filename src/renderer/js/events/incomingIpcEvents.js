import { ipcRenderer } from 'electron'
import { getCurrentMapScript } from '../game/memory'
import { getActiveGameProcessName } from '../game/gameProcessService'
import { requestMapHighscoresToast } from './outgoingIpcEvents'
import { ALL_MAPS } from '../utils/constants'
import { onSettingsRequestResponse } from '../ui/uiSettings'
import { setIsStickyWindowVisible } from '../combo/trackerBridge/helpers'

export function initIncomingIpcEventListeners() {
  ipcRenderer.on('display-all-maps-highscores', () => {
    const activeGame = getActiveGameProcessName();
    if (activeGame) {
      requestMapHighscoresToast(activeGame, ALL_MAPS)
    }
  })

  ipcRenderer.on('display-current-map-highscores', () => {
    const activeGame = getActiveGameProcessName();
    if (activeGame) {
      const currentMapScriptName = getCurrentMapScript()
      
      requestMapHighscoresToast(activeGame, currentMapScriptName)
    }
  })

  ipcRenderer.on('settings-request-response', (event, arg) => {
    onSettingsRequestResponse(arg)
  })

  ipcRenderer.on('sticky-window-visibility-change', (event, arg) => {
    setIsStickyWindowVisible(arg)
  })
}
