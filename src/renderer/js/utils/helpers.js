import { ERROR_STRINGS } from './constants'
import { shell } from '@electron/remote'

export function formatTimestamp(timestamp) {
  if (!Number.isInteger(timestamp)) {
    return
  }

  const timestampInSeconds = Math.ceil(timestamp / 1000)
  return formatSeconds(timestampInSeconds)
}

export function formatSeconds(seconds) {
  if (!Number.isInteger(seconds)) {
    return
  }

  const hour = Math.floor(seconds / 3600);
  let second = seconds % 60
  let minute = Math.floor(seconds % (60 * 60) / 60)
  if (second < 10) { 
    second = `0${second}` 
  }
  if (hour && minute < 10) {
    minute = `0${minute}`
  }

  return hour ? `${hour}:${minute}:${second}` : `${minute}:${second}`
}

export function formatSecondsToHours(seconds) {
  if (!Number.isInteger(seconds)) {
    return
  }

  return `${(seconds / 3600).toFixed(1)} h`
}

export function formatScore(score) {
  if (score == null) {
    return
  }
  return score.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatBalancePropertyTime(time, shouldAddPrefix) {
  const timeAsNumber = new Number(time).toFixed(2)

  if (isNaN(timeAsNumber)) {
    return
  }

  return shouldAddPrefix && timeAsNumber >= 0
    ? `+${timeAsNumber}s`
    : `${timeAsNumber}s`
}

//from https://community.shopify.com/c/Shopify-Design/Ordinal-Number-in-javascript-1st-2nd-3rd-4th/m-p/72156
export function getNumberWithOrdinal(n) {
  const number = new Number(n)

  if (!isNaN(number)) {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return number + (s[(v - 20) % 10] || s[v] || s[0])
  }

  return ERROR_STRINGS.STANDARD_ERROR_TEXT
}

export function hasSpecialUnicodeCharacter(str) {
  const specialCharsRegex = /[^\u0020-\u007E\u00A0-\u00FF\u0100-\u017F]/;

  return specialCharsRegex.test(str);
}

export function getUniqueComboId(game, finalScore, mapName, comboStartTime) {
  let gameName = game.replace('.exe', '');

  const date = new Date(Date.now() || comboStartTime)
  const day = date.toISOString().split('T')[0]
  const time = date.toLocaleTimeString().replace(/:/g, '-')
  const mapNameCleared = mapName.match(/[a-zA-Z0-9\s]/g).join('')
  const score = finalScore || ''
  return `${gameName} ${mapNameCleared} ${score} - ${day} ${time}`
}

export function hasDismissedUpdate(version) {
  const storedVersion = localStorage.getItem('dismissed-update-version');
  return storedVersion === version;
}

export function setupAppVersionLink(version) {
  const appVersionLink = document.getElementById('app-version')

  appVersionLink.textContent = `v${version}`
  appVersionLink.addEventListener('click', (e) => {
    e.preventDefault();
    shell.openExternal(e.target.href)
  })
}

export function setupExternalLinks() {
  const troubleShootingLink = document.getElementById('troubleshooting-link')
  troubleShootingLink.addEventListener('click', (e) => {
    e.preventDefault();
    shell.openExternal(e.target.href)
  })
}

export function testFlag(playerFlags, flagToTest) {
  return (playerFlags & flagToTest) !== 0;
}
