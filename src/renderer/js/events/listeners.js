import { ipcRenderer } from 'electron'
import { getCurrentMapScript } from '../game/memory'
import { hasActiveGameInstance } from '../game/gameProcessService'
import { requestMapHighscoresToast } from './mainIpcEvents'
import { ALL_MAPS } from '../utils/constants'
import { onSettingsRequestResponse } from '../ui/uiSettings'

export function initMainWindowIpcEventListeners() {
  ipcRenderer.on('display-all-maps-highscores', () => {
    requestMapHighscoresToast(ALL_MAPS)
  })

  ipcRenderer.on('display-current-map-highscores', () => {
    if (hasActiveGameInstance()) {
      const currentMapScriptName = getCurrentMapScript()
      
      requestMapHighscoresToast(currentMapScriptName)
    }
  })

  ipcRenderer.on('settings-request-response', (event, arg) => {
    onSettingsRequestResponse(arg)
  })
}
