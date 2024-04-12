import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/pulse/bootstrap.min.css';
import '../../style.css';
import '../../overlay.css';
import { enableInspectingHtml } from '../debug/debugHelpers';
import { BalanceDisplay } from './balanceDisplay/BalanceDisplay';
import { ipcRenderer } from 'electron';

const HORIZONTAL_BALANCE_CONTAINER_ID = 'horizontal-balance-arc-svg-container';
const VERTICAL_BALANCE_CONTAINER_ID = 'vertical-balance-arc-svg-container';

const verticalBalanceAngles = { startAngle: 130, endAngle: 230 }
const horizontalBalanceAngles = { startAngle: 220, endAngle: 320 }

const verticalBalanceDisplay = new BalanceDisplay(
  verticalBalanceAngles.startAngle,
  verticalBalanceAngles.endAngle,
  VERTICAL_BALANCE_CONTAINER_ID,
  'vertical-balance-arrow-svg-container',
  true,
  0,
  2,
)

const horizontalBalanceDisplay = new BalanceDisplay(
  horizontalBalanceAngles.startAngle,
  horizontalBalanceAngles.endAngle,
  HORIZONTAL_BALANCE_CONTAINER_ID,
  'horizontal-balance-arrow-svg-container',
  false,
  0,
  0,
)

ipcRenderer.on('focus-change', (e, state) => {
  document.getElementById('text1').textContent = (state) ? ' (overlay is clickable) ' : 'clicks go through overlay'
});

ipcRenderer.on('visibility-change', (e, state) => {
  if (document.body.style.display) {
    document.body.style.display = null
  } else {
    document.body.style.display = 'none'
  }
});

ipcRenderer.on('draw-balance', (event, arg) => {
  const { horizontal, vertical } = arg;

  if (typeof horizontal === 'number') {
    horizontalBalanceDisplay.showBalance()
    horizontalBalanceDisplay.drawBalance(horizontal);
  } else {
    horizontalBalanceDisplay.hideBalance()
  }
  
  if (typeof vertical === 'number') {
    verticalBalanceDisplay.showBalance()
    verticalBalanceDisplay.drawBalance(vertical);
  } else {
    verticalBalanceDisplay.hideBalance()
  }
});

enableInspectingHtml()
