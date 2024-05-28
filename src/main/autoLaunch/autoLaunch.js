import AutoLaunch from 'auto-launch';
import { app } from 'electron';

const comboTrackerAutoLauncher = new AutoLaunch({
  name: 'Combo Tracker',
  path: app.getPath('exe'),
  isHidden: true,
})

export function startMinimized() {
  return (process.argv || []).indexOf('--hidden') !== -1
}

export default comboTrackerAutoLauncher
