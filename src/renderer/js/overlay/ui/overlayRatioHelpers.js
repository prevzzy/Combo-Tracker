export function getScreenRatioAdjustmentFactors(referenceX = 16, referenceY = 9) {
  const screenWidth = document.documentElement.clientWidth;
  const screenHeight = document.documentElement.clientHeight;
  const referenceScreenRatio = referenceX / referenceY;
  const currentScreenRatio = screenWidth / screenHeight;
  
  return {
    x: currentScreenRatio / referenceScreenRatio,
    y: referenceScreenRatio / currentScreenRatio,
  }
}
