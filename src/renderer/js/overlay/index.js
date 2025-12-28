import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/pulse/bootstrap.min.css';
import '../../style.css';
import '../../overlay.css';
import { enableInspectingHtml } from '../debug/debugHelpers';
import { BalanceDisplay } from './balanceDisplay/BalanceDisplay';
import { ipcRenderer } from 'electron';
import { ScoreDisplay } from './scoreDisplay';

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

const scoreDisplay = new ScoreDisplay();

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

function handleDrawingBalance(balanceDisplay, balancePosition) {
  if (typeof balancePosition === 'number') {
    balanceDisplay.showBalance()
    balanceDisplay.drawBalance(balancePosition);
  } else {
    balanceDisplay.hideBalance()
  }
}

ipcRenderer.on('draw-balance', (event, arg) => {
  const { horizontal, vertical } = arg;

  handleDrawingBalance(horizontalBalanceDisplay, horizontal);
  handleDrawingBalance(verticalBalanceDisplay, vertical);
});

ipcRenderer.on('draw-score-numbers', (event, arg) => {
  const { basePoints, multiplier, score, isLanded } = arg;

  if (typeof isLanded === 'boolean') {
    scoreDisplay.displayFinalScore(basePoints, multiplier, score, isLanded)
  } else {
    scoreDisplay.updateScoreText(basePoints, multiplier, score);
  }
})

ipcRenderer.on('ct-observer-new-message', (event, arg) => {
  const {
    score,
    multiplier,
    basePoints,
    balanceTrickType,
    balancePosition,
    isLanded
  } = arg;

  const isVerticalBalance = balanceTrickType === 'MANUAL'

  if (typeof isLanded === 'boolean') {
    scoreDisplay.displayFinalScore(basePoints, multiplier, score, isLanded)
  } else {
    scoreDisplay.updateScoreText(basePoints, multiplier, score);
  }

  let horizontalBalance = null;
  let verticalBalance = null;

  if (balanceTrickType) {
    horizontalBalance = isVerticalBalance ? null : balancePosition;
    verticalBalance = isVerticalBalance ? balancePosition : null;
  }

  handleDrawingBalance(horizontalBalanceDisplay, horizontalBalance);
  handleDrawingBalance(verticalBalanceDisplay, verticalBalance);
})

enableInspectingHtml()
