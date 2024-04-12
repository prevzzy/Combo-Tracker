export function vh(percent) {
  const h = document.documentElement.clientHeight;
  return (percent * h) / 100;
}

export function pixelsToVh(pixels) {
  const h = document.documentElement.clientHeight;
  return (pixels / h) * 100;
}

export function pixelsToVw(pixels) {
  const w = document.documentElement.clientWidth;
  return (pixels / w) * 100;
}

export function vwToPixels(vw) {
  const w = document.documentElement.clientWidth;
  return (vw * w) / 100;
}

export function vhToPixels(vh) {
  const h = document.documentElement.clientHeight;
  return (vh * h) / 100;
}

export function vw(percent) {
  const w = document.documentElement.clientWidth;
  return (percent * w) / 100;
}

export function getTransformProperties(element) {
  const computedStyle = window.getComputedStyle(element);
  const transformValue = computedStyle.getPropertyValue('transform');

  let translateX = 0;
  let translateY = 0;
  let scaleX = 1;
  let scaleY = 1;
  let rotate = 0;

  const match = transformValue.match(/matrix\(([^)]+)\)/);
  if (match) {
    const matrixValues = match[1].split(', ');
    translateX = parseFloat(matrixValues[4]);
    translateY = parseFloat(matrixValues[5]);
    scaleX = parseFloat(matrixValues[0]);
    scaleY = parseFloat(matrixValues[3]);

    rotate = Math.atan2(parseFloat(matrixValues[1]), parseFloat(matrixValues[0]));
  } else {
    console.error('Unable to extract transform values from the transform property.');
  }

  return {
    translateX,
    translateY,
    scaleX,
    scaleY,
    rotate,
  };
}
