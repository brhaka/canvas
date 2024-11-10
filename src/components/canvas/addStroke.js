import { getJsonSize } from './utils'

export const addStroke = ({
  stroke,
  strokes,
  setStrokes,
  setLocalStrokes,
  setUndoStack,
  queue,
  inBetween,
  saveState,
  MAX_STATE_SIZE_BYTES
}) => {
  const newStroke = { ...stroke };

  // Check if the single stroke is larger than the limit
  const singleStrokeSize = getJsonSize([newStroke]);
  if (singleStrokeSize >= MAX_STATE_SIZE_BYTES) {
    console.warn('Single stroke exceeds size limit, splitting into multiple strokes');

    // Split points into chunks that will fit within size limit
    const splitStrokes = splitLargeStroke(newStroke, MAX_STATE_SIZE_BYTES);

    // Add all split strokes to local state
    setLocalStrokes(prev => [...prev, ...splitStrokes]);

    // Handle each split stroke
    splitStrokes.forEach(splitStroke => {
      if (inBetween) {
        queue.push(splitStroke);
      } else {
        inBetween = true;
        setStrokes(prev => [...prev, splitStroke]);
      }
      setUndoStack(prev => [...prev, splitStroke.id]);
    });

    return;
  }

  // Normal case - handle as before
  setLocalStrokes(prev => [...prev, newStroke]);

  const potentialNewStrokes = [...strokes, newStroke];
  const potentialSize = getJsonSize(potentialNewStrokes);

  if (potentialSize >= MAX_STATE_SIZE_BYTES) {
    saveState();
    setStrokes([newStroke]);
    setUndoStack(prev => [...prev, newStroke.id]);
    return;
  }

  if (inBetween) {
    queue.push(newStroke);
  } else {
    inBetween = true;
    setStrokes(prev => [...prev, newStroke]);
  }
  setUndoStack(prev => [...prev, newStroke.id]);
};

// Helper function to split a large stroke into smaller ones
const splitLargeStroke = (stroke, maxBytes) => {
  const points = stroke.points;
  const splitStrokes = [];
  let currentPoints = [];
  let currentStroke = null;

  for (let i = 0; i < points.length; i++) {
    currentPoints.push(points[i]);

    // Create a test stroke with current points
    currentStroke = {
      ...stroke,
      id: `${stroke.id}-${splitStrokes.length}`,
      points: currentPoints
    };

    // Check if adding another point would exceed the limit
    if (getJsonSize([currentStroke]) >= maxBytes * 0.8) { // Using 80% of max as buffer
      // Save current stroke and start a new one
      splitStrokes.push(currentStroke);
      // Keep last point as first point of next stroke for continuity
      currentPoints = [points[i]];
    }
  }

  // Add remaining points as final stroke
  if (currentPoints.length > 0) {
    currentStroke = {
      ...stroke,
      id: `${stroke.id}-${splitStrokes.length}`,
      points: currentPoints
    };
    splitStrokes.push(currentStroke);
  }

  return splitStrokes;
};
