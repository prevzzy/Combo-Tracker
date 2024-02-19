const manualBalanceAngles = { startAngle: 135, endAngle: 225 }
const grindBalanceAngles = { startAngle: 225, endAngle: 315 }
const drawingOffset = 100

function drawBalanceArrow(context, x, y) {
  context.beginPath();
  context.arc(x + drawingOffset, y + drawingOffset, 5, 0, 2 * Math.PI);
  context.fillStyle = 'blue';
  context.strokeStyle = 'black'
  context.fill();
  context.stroke();
}

function mapBalancePositionToArc(value, radius, startAngle, endAngle) {
  // In-game values are flipped for some reason, f.e. on grind balance -4000 is max right and 4000 is max left.
  value *= -1
  let normalizedValue = (value + 4000) / 8000;

  // Balance arrow follows a 1/4th of a circle
  let angleRange = 90;
  let angle = startAngle + normalizedValue * angleRange;  
  let x = radius * Math.cos(angle * Math.PI / 180);
  let y = -radius * Math.sin(angle * Math.PI / 180);

  x += radius
  y = radius - y
  return { x, y };
}

export function drawBalance(value, radius, canvasId, isManual) {
  let canvas = document.getElementById(canvasId);
  let context = canvas.getContext('2d');

  const { startAngle, endAngle } = isManual ? manualBalanceAngles : grindBalanceAngles;

  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw balance arc
  context.beginPath();
  context.arc(radius + drawingOffset, radius + drawingOffset, radius, startAngle * Math.PI / 180, endAngle * Math.PI / 180);
  context.stroke();

  const { x, y } = mapBalancePositionToArc(value, radius, startAngle, endAngle);
  drawBalanceArrow(context, x, y, isManual);
}
