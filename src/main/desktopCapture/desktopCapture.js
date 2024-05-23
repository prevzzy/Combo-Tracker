import { screen, desktopCapturer } from 'electron'

export async function getPrimaryDisplayId() {
  try {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { height: 0, width: 0 }})

    const { id: primaryDisplayId } = screen.getPrimaryDisplay()

    if (!primaryDisplayId) {
      return
    }

    const primaryDisplay = sources.find(source =>
      source.display_id === primaryDisplayId.toString()
    )

    return primaryDisplay?.id
  } catch (error) {
    console.error(error)
  }
}
