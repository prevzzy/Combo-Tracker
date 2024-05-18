import {
  requestSettingValue,
  requestSettingUpdate,
  requestSettingsRestart,
} from '../events/outgoingIpcEvents'
import { formatScore } from '../utils/helpers'
import { resetHighscores, isPathWritable } from '../files/fileService'
import { setItemDisplay } from './uiGlobal'
import { mapKeyToAccelerator } from '../utils/hotkeyMapper'
import * as OverlayUI from './uiOverlay'
import * as HighscoresUI from './uiHighscores'
import _ from 'lodash'
import { GAMES, GAME_PROCESSES } from '../utils/constants'

const settingFields = document.querySelectorAll('.user-setting')
const pageContainer = document.getElementById('settings-page-container')
const minimalScoreSelect = document.getElementById('settings-screenshots-minimal-score')
const gameSelect = document.getElementById('settings-reset-scores-game')

function getSettingFieldsOfType(typeClass) {
  return Array.from(settingFields).filter(field => field.classList.contains(typeClass))
}

function getSettingNameAttribute(field) {
  return field.attributes['data-setting-name'].value
}

function initSettings() {
  requestSettingValue()
  initSwitchListeners()
  initMinimalScoreSelect()
  initResetAllModal()
  initRestoreSettingsButton()
  initScreenshotsPathInput()
  initHotkeyChangeListeners()
}

function onSettingsRequestResponse(settings) {
  settingFields.forEach(field => {
    const fieldSettingName = getSettingNameAttribute(field)

    if (settings.hasOwnProperty(fieldSettingName)) {
      applySetting(field, settings[fieldSettingName])
    }
  })

  document.getElementById('settings-screenshots').checked
    ? $('#settings-screenshot-collapse').collapse('show')
    : $('#settings-screenshot-collapse').collapse('hide')

  OverlayUI.displayOverlay(false)
  pageContainer.style.display = 'block'
}

function applySetting(field, settingValue) {
  if (field.tagName === 'SELECT') {
    $(`#${field.id}`).val(settingValue)
    $(`#${field.id}`).selectpicker('refresh');
  }

  field[getSettingValuePropertyName(field)] = settingValue
}

function getSettingValue(key) {
  const settingField = Array.from(settingFields).find(field => {
    const fieldSettingName = getSettingNameAttribute(field)

    return fieldSettingName === key
  })

  return settingField[getSettingValuePropertyName(settingField)]
}

function getSettingValuePropertyName(field) {
  if (field.classList.contains('user-setting-switch')) {
    return 'checked'
  }

  if (field.classList.contains('user-setting-text')) {
    return 'textContent'
  }

  if (field.classList.contains('user-setting-input')) {
    return 'value'
  }
}

function initSwitchListeners() {
  getSettingFieldsOfType('user-setting-switch').forEach(field => {
    const debouncedSettingUpdate = _.debounce(() => {
      requestSettingUpdate({
        [getSettingNameAttribute(field)]: !!field.checked
      })
    }, 500)
    
    field.addEventListener('click', () => debouncedSettingUpdate())
  })
}

function initMinimalScoreSelect() {
  const scores = [
    100000,
    1000000,
    10000000,
    100000000,
    500000000,
    1000000000,
  ]
  
  scores.forEach(score => {
    const scoreItem = document.createElement('option')
    scoreItem.className = 'map m-0 border-0'
    scoreItem.value = score
    scoreItem.textContent = formatScore(score)
      
    minimalScoreSelect.appendChild(scoreItem) 
  })

  $('#settings-screenshots-minimal-score').selectpicker('render');
}

function initResetAllModal() {
  initGameOptionsForResetModal()
  const resetAllInput = document.getElementById('reset-all-scores-input')
  const resetAllConfirmButton = document.getElementById('reset-all-scores-confirm-button')

  resetAllInput.addEventListener('keyup', (e) => {
    resetAllConfirmButton.disabled = e.target.value !== 'RESET ALL'
  })

  resetAllConfirmButton.addEventListener('click', async (e) => {
    try {
      const game = gameSelect.value;
      await resetHighscores(game)
      updateResetButtonSectionDisplay(true)
      HighscoresUI.resetMapCategoriesMenu()
    } catch(error) {
      console.error(error)
      updateResetButtonSectionDisplay(false)
    }
  })

  $('#reset-all-scores-modal').on('hidden.bs.modal', function (e) {
    const buttonsForm = document.getElementById('reset-all-buttons-1')
    const buttonsOk = document.getElementById('reset-all-buttons-2')
    setItemDisplay(buttonsForm, 'block')
    setItemDisplay(buttonsOk, 'none')
    resetAllInput.value = ''
    resetAllConfirmButton.disabled = true
  })
}

function initGameOptionsForResetModal() {
  const games = [
    {
      value: GAME_PROCESSES.THUGPRO,
      text: GAMES.THUGPRO
    },
    {
      value: GAME_PROCESSES.RETHAWED,
      text: GAMES.RETHAWED
    }
  ]
  
  games.forEach(({ value, text }) => {
    const gameItem = document.createElement('option')
    gameItem.className = 'map m-0'
    gameItem.value = value
    gameItem.textContent = text
      
    gameSelect.appendChild(gameItem) 
  })

  $('#settings-reset-scores-game').selectpicker('render');
}

function updateResetButtonSectionDisplay(isResetSuccessful) {
  const buttonsForm = document.getElementById('reset-all-buttons-1')
  const buttonsOk = document.getElementById('reset-all-buttons-2')
  const resetStatusText = document.getElementById('reset-status-text')

  if (isResetSuccessful) {
    setItemDisplay(buttonsForm, 'none')
    setItemDisplay(buttonsOk, 'block')
    resetStatusText.textContent = 'Reset successful'
  } else {
    setItemDisplay(buttonsForm, 'none')
    setItemDisplay(buttonsOk, 'block')
    resetStatusText.textContent = 'Something went wrong. Try again.'
  }
}

function initScreenshotsPathInput() {
  const screenshotsPathBtn = document.getElementById('screenshot-path-btn')
  const screenshotsPath = document.getElementById('settings-screenshots-path')
  const screenshotsPathError = document.getElementById('screenshots-path-error')

  screenshotsPathBtn.addEventListener('change', (e) => {
    const newPath = e.target.files[0].path;
    if (isPathWritable(newPath)) {
      setItemDisplay(screenshotsPathError, 'none')
      screenshotsPath.textContent = newPath;
      requestSettingUpdate({
        [getSettingNameAttribute(screenshotsPath)]: newPath
      })
    } else {
      screenshotsPathError.firstElementChild.textContent = newPath
      setItemDisplay(screenshotsPathError, 'block')
    }
  })
}

function initHotkeyChangeListeners() {
  getSettingFieldsOfType('hotkey').forEach((hotkeyElement) => {
    const hotkeyEditElement = hotkeyElement.nextElementSibling.querySelectorAll('.hotkey-edit')[0]
    
    if (hotkeyEditElement) {
      hotkeyEditElement.addEventListener('click', (e) => {
        onHotkeyEditClick(hotkeyElement)
      })
    }
  })
}

function onHotkeyEditClick(hotkeyElement) {
  const hotkeyListenerElement = document.getElementById('hotkey-listener')
  
  hotkeyListenerElement.addEventListener('blur', () => {
    hotkeyElement.classList.add('text-light')
    hotkeyElement.classList.remove('text-secondary')
    hotkeyListenerElement.value = ''
    hotkeyListenerElement.replaceWith(hotkeyListenerElement.cloneNode(true))
  })

  hotkeyListenerElement.addEventListener('keyup', (e) => {
    onHotkeyChange(e, hotkeyElement, hotkeyElement.value)
  })

  hotkeyElement.classList.remove('text-light')
  hotkeyElement.classList.add('text-secondary')

  hotkeyListenerElement.focus({
    preventScroll: true
  })
}

function getHotkeyElementIndex(accelerator) {
  return getSettingFieldsOfType('hotkey').findIndex(hotkeyElement =>
    hotkeyElement.value === accelerator
  )
}

function onHotkeyChange(e, hotkeyElement, currentHotkey) {
  e.preventDefault()

  const hotkeyListenerElement = e.target
  const accelerator = mapKeyToAccelerator(e.key, e.shiftKey, e.altKey, e.ctrlKey, e.metaKey)
  
  if (typeof accelerator === 'string' && accelerator.length !== 0) {
    hotkeyListenerElement.blur()    
    handleNewHotkeyRegistering(accelerator, hotkeyElement, currentHotkey)
  }
}

function handleNewHotkeyRegistering(accelerator, hotkeyElement, currentHotkey) {
  const currentHotkeyElementIndex = getHotkeyElementIndex(currentHotkey)
  const alreadyUsedHotkeyElementIndex = getHotkeyElementIndex(accelerator)
  
  applySetting(hotkeyElement, accelerator)
  let hotkeysToUpdate = {
    [getSettingNameAttribute(hotkeyElement)]: accelerator,
  }
  
  if (
    alreadyUsedHotkeyElementIndex !== -1 &&
    currentHotkeyElementIndex !== alreadyUsedHotkeyElementIndex
  ) {
    const alreadyUsedHotkeyElement = Array.from(getSettingFieldsOfType('hotkey'))[alreadyUsedHotkeyElementIndex]
    
    applySetting(alreadyUsedHotkeyElement, currentHotkey)
    hotkeysToUpdate = {
      ...hotkeysToUpdate,
      [getSettingNameAttribute(alreadyUsedHotkeyElement)]: currentHotkey,
    }
  }
    
  requestSettingUpdate(hotkeysToUpdate)
}

function initRestoreSettingsButton() {
  const restoreButton = document.getElementById('restore-settings-button')
  restoreButton.addEventListener('click', () => {
    requestSettingsRestart()
  })
}

export {
  initSettings,
  onSettingsRequestResponse,
  getSettingValue,
}
