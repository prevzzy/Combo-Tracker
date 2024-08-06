import { setItemDisplay } from '../../ui/uiHelpers';
import { getScreenRatioAdjustmentFactors } from '../ui/overlayRatioHelpers';
import { vhToPixels, pixelsToVh, vwToPixels, pixelsToVw } from './helpers';

export class BalanceDisplay {
  constructor(startAngle, endAngle, arcContainerId, arrowContainerId,isVertical, drawingXOffset, drawingYOffset) {
    this.isVisible = false;

    // arrowSvgContainer is used for showing/hiding the arrow
    this.arrowSvgContainer = document.getElementById(arrowContainerId)
    // arrowSvgElement is a container with width and height set to 100vw and 100vh to maintain aspect ratio. the container is translated by x and y, to match balance arcs. 
    this.arrowSvgElement = this.arrowSvgContainer.querySelector('.balance-arrow-svg');
    // arrowGElement is always positioned to svg's center and then rotated so the tip stays perpendicular to the arc
    this.arrowGElement = this.arrowSvgContainer.querySelector('.balance-arrow-g');

    // arcContainerElement is used for showing/hiding the arc
    this.arcContainerElement = document.getElementById(arcContainerId);
    this.arcGElement = this.arcContainerElement.querySelector('.balance-g')
  
    this.startAngle = startAngle;
    this.endAngle = endAngle;

    this.isVertical = isVertical;
    this.arrowBaseRotation = isVertical ? -90 : 0

    this.drawingXOffset = drawingXOffset;
    this.drawingYOffset = drawingYOffset;

    this.hideBalanceCallCount = 0;
  }

  getBalanceArcDimensions() {
    const { width, height } = this.arcGElement.getBoundingClientRect();

    return { width, height }
  }

  getArrowDimensions(rotation) {
    const svgClone = this.arrowSvgElement.cloneNode(true);
    svgClone.style.visibility = 'none';
   
    const gClone = svgClone.querySelector('.balance-arrow-g');
    const existingTransform = gClone.getAttribute('transform');
    if (existingTransform) {
      const transformWithoutRotation = existingTransform.replace(/rotate\([^)]*\)/g, `rotate(${rotation})`);
      
      gClone.setAttribute('transform', transformWithoutRotation);
    }
    
    document.body.appendChild(svgClone);    
    const { width, height } = gClone.getBoundingClientRect();
    document.body.removeChild(svgClone);

    return { width, height }
  }

  getBalanceRadius(balanceArcWidth, balanceArcHeight) {
    const base = this.isVertical ? balanceArcHeight : balanceArcWidth;

    return base / 2 * Math.sqrt(2)
  }

  mapBalancePositionToArc(value, radius) {
    // In-game values are flipped for some reason, f.e. on grind balance -4000 is max right and 4000 is max left.
    value *= -1
    let normalizedValue = (value + 4000) / 8000;
  
    // Balance arrow follows a 1/4th of a circle
    let angleRange = this.endAngle - this.startAngle;
    let angle = this.startAngle + normalizedValue * angleRange;
    let x = (radius + this.drawingXOffset) * Math.cos(angle * Math.PI / 180);
    let y = (radius + this.drawingYOffset) * Math.sin(angle * Math.PI / 180);
  
    const rotation = -45 - normalizedValue * (normalizedValue > 0 ? -90 : 90);
    return { x, y, rotation };
  }

  getTranslateArrowYValue(value, arrowHeight) {
    const adjustedY = this.isVertical ? value : value * getScreenRatioAdjustmentFactors().y

    return adjustedY - (this.isVertical ? arrowHeight / 2 : -arrowHeight / 2)
  }

  getTranslateArrowXValue(value, arrowWidth) {
    const adjustedX = this.isVertical ? value * getScreenRatioAdjustmentFactors().x : value;
    const adjustedArrowWidth = arrowWidth / (this.isVertical ? 1 : 2);
  
    return adjustedX - adjustedArrowWidth
  }

  drawBalanceArrow(x, y, rotation, arrowWidth, arrowHeight) {
    const arrowCenterX = this.getTranslateArrowXValue(x, arrowWidth);
    const arrowCenterY = this.getTranslateArrowYValue(y, arrowHeight);

    this.arrowSvgElement.style.transform = `translate(${arrowCenterX}px, ${arrowCenterY}px)`

    const svgCenter = this.getSvgContainerCenter();

    // without this offset arrow isn't positioned exactly to the middle and i'm tired of finding out why
    const additionalOffset = 19;

    this.arrowGElement.setAttribute('transform', `translate(${svgCenter.x + additionalOffset}, ${svgCenter.y + additionalOffset}) rotate(${this.arrowBaseRotation + rotation})`);
  }
  
  drawBalance(value) {
    const { width: balanceArcWidth, height: balanceArcHeight } = this.getBalanceArcDimensions();
    const { width: arrowWidth, height: arrowHeight } = this.getArrowDimensions(this.arrowBaseRotation);

    const radius = this.getBalanceRadius(balanceArcWidth, balanceArcHeight);
    const { x, y, rotation } = this.mapBalancePositionToArc(value, radius);
  
    this.drawBalanceArrow(x, y, rotation, arrowWidth, arrowHeight);
  }

  getSvgContainerCenter() {
    const svgWidth = vwToPixels(Number(this.arrowSvgElement.getAttribute('width').replace('vw', '')));
    const svgHeight = vhToPixels(Number(this.arrowSvgElement.getAttribute('height').replace('vh', '')));

    const { width: gWidth, height: gHeight } = this.arrowGElement.getBBox();

    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;

    const translateX = centerX - (gWidth / 2);
    const translateY = centerY - (gHeight / 2);

    return { x: pixelsToVw(translateX), y: pixelsToVh(translateY) }
  }

  showBalance() {
    setItemDisplay(this.arcContainerElement, 'block');
    setItemDisplay(this.arrowSvgContainer, 'block');
  }

  hideBalance() {  
    setItemDisplay(this.arcContainerElement, 'none');
    setItemDisplay(this.arrowSvgContainer, 'none');
  }
}
