import { ipcRenderer } from 'electron'
import { initIncomingIpcEventListeners } from './events/incomingIpcEvents'
import * as HighscoresUI from './ui/uiHighscores'
import * as SettingsUI from './ui/uiSettings'
import * as GameProcessService from './game/gameProcessService'
import * as LastComboUI from './ui/lastCombo/uiLastCombo'
import * as FileService from './files/fileService'
import { setupGlobalError } from './ui/globalError'
import { app } from '@electron/remote'
import { COMBO_PAGE_INFO_MESSAGES } from './utils/constants'
import { setupAppVersionLink, setupExternalLinks } from './utils/helpers'
import { setupLatestUpdateInfo } from './patchNotes/patchNotes'
import { blockHighscoresPage, setupToolbarListeners, showApp } from './ui/uiNavigation'
import { requestCleaningUpAllShortcuts } from './events/outgoingIpcEvents'

let isRunning = false

async function startApp() {
  if (isRunning) {
    return
  }

  ipcRenderer.send('user-data-path-request')
  ipcRenderer.on('user-data-path-request-response', (event, arg) => {
    initIncomingIpcEventListeners()
    SettingsUI.initSettings()
    runCoreLogic(arg)
    ipcRenderer.removeAllListeners('user-data-path-request-response')
  })

  setupAppVersionLink(app.getVersion())
  setupExternalLinks()
}

function runCoreLogic(paths) {
  FileService.setSavingPaths(paths)
  FileService.readAllHighscoreJsons()
    .then(async () => {
      LastComboUI.displayDefaultComboPageInfo()

      isRunning = true

      LastComboUI.init()
      setupToolbarListeners()
      await GameProcessService.mainLoop()
      HighscoresUI.initHighscoresPage()

      setupLatestUpdateInfo()
    })
    .catch((error) => {
      console.error(error)
      setupGlobalError(true, 'Failed to read highscores data. Try resetting your highscores in the settings.', 1)

      LastComboUI.setLastComboPageInfo(
        true,
        COMBO_PAGE_INFO_MESSAGES.TRACKER_UNAVAILABLE,
        1,
        false
      )

      requestCleaningUpAllShortcuts()
      blockHighscoresPage()
    })
    .finally(() => {
      showApp()
    })
}

export {
  startApp,
}
