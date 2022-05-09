const path = require('path')
const fs= require('fs')
import { screen, desktopCapturer } from 'electron'
import * as SavedCombosService from '../combo/savedCombosService'
import * as SettingsUI from '../ui/uiSettings'
import { getUniqueComboId } from '../utils/helpers'
import { ERROR_STRINGS } from '../utils/constants'

// from https://ourcodeworld.com/articles/read/280/creating-screenshots-of-your-app-or-the-screen-in-electron-framework
function handleStream(stream, imageName) {
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

function screenshotMainDisplay(imageName) {
  desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { height: 0, width: 0 }}, async (error, sources) => {
    try {
      const { id: mainScreenId } = screen.getPrimaryDisplay()

      if (!mainScreenId) {
        return
      }

      const mainScreen = sources.find(source =>
        source.display_id === mainScreenId.toString()
      )
  
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: mainScreen.id,
            minWidth: 1280,
            maxWidth: 4000,
            minHeight: 720,
            maxHeight: 4000
          }
        }
      });

      handleStream(stream, imageName);
    } catch (error) {
      console.error(error)
    }
  })
}

function screenshotLastComboScore(finalScore, comboStartTime, mapScriptName) {
  const fileName = getUniqueComboId(
    finalScore,
    SavedCombosService.getMapName(mapScriptName) || ERROR_STRINGS.UNKNOWN_MAP,
    comboStartTime,
  )
  
  // wait for score animation to end
  setTimeout(() => {
    try {
      screenshotMainDisplay(fileName)
    } catch (error) {
      console.error(error)
    }
  }, 400)
}

export {
  screenshotLastComboScore
}
