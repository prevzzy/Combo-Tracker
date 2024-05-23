
import { ipcRenderer } from 'electron'
import { ALL_MAPS } from '../utils/constants'
import { HIGHSCORE_PEEK_TYPES, TOAST_EVENT_TYPES } from '../../../main/events/toastEventTypes'
import * as SavedCombosService from '../combo/savedCombosService'

export function requestMapHighscoresToast(game, mapScriptName) {
  let payload

  if (mapScriptName === ALL_MAPS) {
    const allMapsData = SavedCombosService.getAllMapsData(game)
  
    payload = {
      mapName: allMapsData.name,
      scores: allMapsData.scores,
      shouldDisplayScoreMapName: true,
      highscoresPeekType: HIGHSCORE_PEEK_TYPES.ALL_MAPS
    }
  } else {
    const mapCategory = SavedCombosService.getMapCategory(game, mapScriptName)

    if (!mapCategory) { 
      return
    }

    payload = {
      mapName: SavedCombosService.getMapName(game, mapScriptName),
      scores: SavedCombosService.getMapData(game, mapCategory, mapScriptName).scores,
      shouldDisplayScoreMapName: false,
      highscoresPeekType: HIGHSCORE_PEEK_TYPES.CURRENT_MAP
    }
  }
  
  ipcRenderer.send('display-toast-request', {
    toastEventType: TOAST_EVENT_TYPES.MAP_HIGHSCORES,
    payload
  })
}

export function requestNewBestScoreToast(
  generalBestScoreNumber,
  mapBestScoreNumber,
  mapName,
) {
  ipcRenderer.send('display-toast-request', {
    toastEventType: TOAST_EVENT_TYPES.NEW_BEST_SCORE,
    payload: {
      generalBestScoreNumber,
      mapBestScoreNumber,
      mapName,
    }
  })
}

export function requestNewMapToast() {
  ipcRenderer.send('display-toast-request', {
    toastEventType: TOAST_EVENT_TYPES.NEW_MAP_DETECTED,
    payload: {}
  })
}

export function requestSettingValue(key) {
  ipcRenderer.send('get-setting-request', {
    payload: {
      key
    }
  })
}

export function requestSettingUpdate(settingsToUpdate) {
  ipcRenderer.send('set-setting-request', {
    payload: {
      settingsToUpdate
    }
  })
}

export function requestSettingsRestart() {
  ipcRenderer.send('request-settings-restart')
}

export function requestAppMinimize() {
  ipcRenderer.send('request-app-minimize')
}

export function requestAppFullscreen() {
  ipcRenderer.send('request-app-fullscreen')
}

export function requestAppExit() {
  ipcRenderer.send('request-app-exit')
}

export async function requestPrimaryDisplayId() {
  const response = await ipcRenderer.invoke('get-primary-display-id-request')
  return response;
}

export function requestServerHosting(username) {
  ipcRenderer.send('host-server-request', { username });
}

export function requestConnectingToServer(username) {
  ipcRenderer.send('connect-to-server-request', { username });
}

export function requestServerShutdown() {
  ipcRenderer.send('shutdown-server-request');
}

export function requestDisconnectingFromServer() {
  ipcRenderer.send('disconnect-from-server-request');
}

// export function requestShowingOverlay() {
//   ipcRenderer.send('show-overlay-request');
// }

export function requestSendingWsMessage(message, isHost) {
  const event = isHost ? 'send-ws-server-message' : 'send-ws-client-message'
  ipcRenderer.send(event, message);
}
