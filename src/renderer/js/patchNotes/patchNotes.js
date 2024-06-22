import { app } from '@electron/remote';
import { isAppInDebugMode } from '../debug/debugHelpers';
import { requestFetchingLatestUpdateInfo, requestShowingMainWindow } from '../events/outgoingIpcEvents'
import { setAndShowPatchNotesModal } from '../ui/generalPurposeModal/uiGeneralPurposeModal'
import { showNewUpdateAlert } from '../ui/uiSettings'
import { hasDismissedUpdate } from '../utils/helpers'

function setLastUpdateCheckDate() {
  const currentDate = new Date().toISOString().split('T')[0];
  localStorage.setItem('last-update-check-date', currentDate);
}

function getLastUpdateCheckDate() {
  return localStorage.getItem('last-update-check-date');
}

function shouldCheckForUpdate() {
  const currentDate = new Date().toISOString().split('T')[0];
  // return true
  return (
    hasNewUpdateAvailableNote() ||
    currentDate !== getLastUpdateCheckDate() ||
    isAppInDebugMode() 
  )
}

function hasNewUpdateAvailableNote() {
  return localStorage.getItem('new-update-available') === 'true'
}

function isNewUpdate(version) {
  return version !== app.getVersion()
}

function setNewUpdateAvailableNote(version) {
  localStorage.setItem('new-update-available', isNewUpdate(version))
}

export async function setupLatestUpdateInfo() {
  if (!shouldCheckForUpdate()) {
    return
  }

  setLastUpdateCheckDate()
  const newUpdateInfo = await requestFetchingLatestUpdateInfo()

  if (!newUpdateInfo) {
    return;
  }

  const { version } = newUpdateInfo

  if (newUpdateInfo && isNewUpdate(version)) {
    setNewUpdateAvailableNote(newUpdateInfo.version)
    showNewUpdateAlert(newUpdateInfo)
    
    if (!hasDismissedUpdate(newUpdateInfo.version)) {
      setAndShowPatchNotesModal(newUpdateInfo, false)
      requestShowingMainWindow()
    }
  }
}
