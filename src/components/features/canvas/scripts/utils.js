import { TOOL_TYPES } from './types'

export const getJsonSize = (obj) => new TextEncoder().encode(JSON.stringify(obj)).length;

// Add this new function before the CanvasDisplay component
// Ramer-Douglas-Peucker
export const simplifyPoints = (points, tolerance = 2) => {
  if (points.length <= 2) return points;

  const findPerpendicularDistance = (point, lineStart, lineEnd) => {
    const numerator = Math.abs(
      (lineEnd.y - lineStart.y) * point.x -
      (lineEnd.x - lineStart.x) * point.y +
      lineEnd.x * lineStart.y -
      lineEnd.y * lineStart.x
    );

    const denominator = Math.sqrt(
      Math.pow(lineEnd.y - lineStart.y, 2) +
      Math.pow(lineEnd.x - lineStart.x, 2)
    );

    return numerator / denominator;
  };

  let maxDistance = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const distance = findPerpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1]
    );

    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const firstHalf = simplifyPoints(points.slice(0, maxIndex + 1), tolerance);
    const secondHalf = simplifyPoints(points.slice(maxIndex), tolerance);
    return [...firstHalf.slice(0, -1), ...secondHalf];
  }

  return [points[0], points[points.length - 1]];
};

// Add this smoothing function before renderStrokes
export const smoothStroke = (points, tension = 0.5) => {
  if (points.length < 2) return points;

  const smoothedPoints = [];
  const numSegments = 16; // Number of segments between each pair of points

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Generate points for each segment
    for (let t = 0; t < (i === points.length - 2 ? numSegments + 1 : numSegments); t++) {
      const t1 = t / numSegments;

      // Catmull-Rom spline calculation
      const t2 = t1 * t1;
      const t3 = t2 * t1;

      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t1 +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );

      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t1 +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );

      smoothedPoints.push({ x, y });
    }
  }

  return smoothedPoints;
};

export const drawLine = (context, start, end, style) => {
  context.beginPath();

  if (style.type === TOOL_TYPES.BRUSH) {
    // Save context state
    context.save();

    // Parse the color to RGB components
    let r, g, b;
    if (style.color.startsWith('rgb')) {
      [r, g, b] = style.color.match(/\d+/g).map(Number);
    } else {
      r = parseInt(style.color.slice(1,3), 16);
      g = parseInt(style.color.slice(3,5), 16);
      b = parseInt(style.color.slice(5,7), 16);
    }

    // Draw main stroke
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = style.size;
    context.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    context.globalCompositeOperation = 'source-over';
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();

    // Draw blending border
    context.globalCompositeOperation = 'destination-over';
    context.lineWidth = style.size + 2; // Slightly larger for border
    context.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.1)`;
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();

    // Restore context state
    context.restore();
  } else {
    // Eraser remains unchanged
    context.globalCompositeOperation = 'destination-out';
    context.strokeStyle = 'rgba(0,0,0,1)';
    context.lineWidth = style.size;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.globalCompositeOperation = 'source-over';
  }
}
