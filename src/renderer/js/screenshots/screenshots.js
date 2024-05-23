const path = require('path')
const fs= require('fs')
import * as SavedCombosService from '../combo/savedCombosService'
import * as SettingsUI from '../ui/uiSettings'
import { getUniqueComboId } from '../utils/helpers'
import { ERROR_STRINGS } from '../utils/constants'
import { requestPrimaryDisplayId } from '../events/outgoingIpcEvents'

// from https://ourcodeworld.com/articles/read/280/creating-screenshots-of-your-app-or-the-screen-in-electron-framework
export function screenshotStreamToFile(stream, imageName) {
  const video = document.createElement('video')
  video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;'

  // Event connected to stream
  video.onloadedmetadata = function () {
    video.style.height = this.videoHeight + 'px';
    video.style.width = this.videoWidth + 'px';
    video.play()
    
    const canvas = document.createElement('canvas')
    canvas.width = this.videoWidth;
    canvas.height = this.videoHeight;
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    const img = canvas.toDataURL('image/png')
    const imgData = img.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(imgData, 'base64')
    
    const screenshotsPath = SettingsUI.getSettingValue('screenshots-path')

    fs.writeFile(path.join(screenshotsPath, `${imageName}.png`), buffer, (err) => {
      if (err) {
        console.error(err)
      }
    })
    
    video.remove()
    try {
      stream.getTracks()[0].stop()
    } catch (e) {
      console.error(e)
    }
  }

  video.srcObject = stream
  document.body.appendChild(video);
}

async function screenshotDisplay(displayId, imageName) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: displayId,
          minWidth: 1280,
          maxWidth: 4000,
          minHeight: 720,
          maxHeight: 4000
        }
      }
    });

    screenshotStreamToFile(stream, imageName);
  } catch (error) {
    console.error(error)
  }
}

function screenshotLastComboScore(game, finalScore, comboStartTime, mapScriptName) {
  const imageName = getUniqueComboId(
    game,
    finalScore,
    SavedCombosService.getMapName(game, mapScriptName) || ERROR_STRINGS.UNKNOWN_MAP,
    comboStartTime,
  )
  
  // wait for score animation to end
  setTimeout(async () => {
    try {
      const primaryDisplayId = await requestPrimaryDisplayId()
      screenshotDisplay(primaryDisplayId, imageName)
    } catch (error) {
      console.error(error)
    }
  }, 400)
}

export {
  screenshotLastComboScore
}
