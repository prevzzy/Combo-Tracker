import { getScreenRatioAdjustmentFactors } from './ui/overlayRatioHelpers';
import { formatScore } from '../utils/helpers';

export class ScoreDisplay {
  constructor() {
    this.scoreTextContainer = document.getElementById('score-text-container');
    this.calculatedScoreElement = document.getElementById('calculated-score');
    this.basePointsXMultiplierElement = document.getElementById('score-base-x-multiplier-text');
    this.finalScoreAnimationTimeoutId = null;
  }

  updateScoreText(basePoints, multiplier, score) {
    if (this.finalScoreAnimationTimeoutId) {
      this.clearFinalScore();
    }

    const { x, y } = getScreenRatioAdjustmentFactors();
    
    const screenWidth = document.documentElement.clientWidth;
    const screenHeight = document.documentElement.clientHeight;
    
    this.scoreTextContainer.style.visibility = 'visible';
    this.scoreTextContainer.style.transform = `scale(${x > 1 ? 1 : x}, ${y > 1 ? 1 : y})`;
    this.calculatedScoreElement.style.fontSize = screenWidth > screenHeight ? '2.3vw' : '4.3vh';
    this.basePointsXMultiplierElement.style.fontSize = screenWidth > screenHeight ? '2.1vw' : '3.9vh';
    this.setScoreText({ basePoints, multiplier, score });
  }

  setScoreText({ basePoints, multiplier, score }) {
    if (score > 0) {
      this.calculatedScoreElement.innerText = formatScore(score)
    }
    
    if (basePoints > 0) {
      this.basePointsXMultiplierElement.innerText = `${formatScore(basePoints)}${multiplier > 0 ? ' X ' + multiplier : ''}`;
    }
  }

  displayFinalScore(basePoints, multiplier, score, isLanded) {
    const animationClassName = isLanded ? 'combo-landed' : 'combo-bailed'
    
    this.scoreTextContainer.classList.add(animationClassName);
    this.updateScoreText(basePoints, multiplier, score)

    this.finalScoreAnimationTimeoutId = setTimeout(() => this.clearFinalScore(), 5000);
  }

  clearFinalScore() {
    clearTimeout(this.finalScoreAnimationTimeoutId);
    this.finalScoreAnimationTimeoutId = null;
    this.scoreTextContainer.classList.remove(...[...this.scoreTextContainer.classList]);
    this.calculatedScoreElement.innerText = '';
    this.basePointsXMultiplierElement.innerText = '';
  }
}
