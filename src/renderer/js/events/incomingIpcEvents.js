import { ipcRenderer } from 'electron'
import { getCurrentMapScript } from '../game/memory'
import { hasActiveGameInstance } from '../game/gameProcessService'
import { requestMapHighscoresToast } from './outgoingIpcEvents'
import { ALL_MAPS } from '../utils/constants'
import { onSettingsRequestResponse } from '../ui/uiSettings'
import { isConnectedToOnlineCT, handleNewOnlineCTMessage } from '../online/connectionService'

export function initIncomingIpcEventListeners() {
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

  ipcRenderer.on('host-server-request-response', (event, arg) => {
    console.log('host-server-request-response', arg);
  })

  ipcRenderer.on('connect-to-server-request-response', (event, arg) => {
    // w sumie to na connected server powinien wysłać player list chyba?
  }) 

  ipcRenderer.on('new-ws-message', (event, arg) => {
    if (!isConnectedToOnlineCT()) {
      return;
    }

    handleNewOnlineCTMessage(arg);
  })
}
