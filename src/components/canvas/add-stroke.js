import { getJsonSize } from './utils'

export const addStroke = ({
  stroke,
  strokes,
  setStrokes,
  setMyStrokes,
  setUndoStack,
  queue,
  inBetween,
  saveState,
  MAX_STATE_SIZE_BYTES
}) => {
  const newStroke = { ...stroke };
  const potentialNewStrokes = [...strokes, newStroke];
  const potentialSize = getJsonSize(potentialNewStrokes);

  // Add to local state first
  setMyStrokes(prev => [...prev, newStroke]);

  // Handle size limit
  if (potentialSize >= MAX_STATE_SIZE_BYTES) {
    saveState();
    setStrokes([newStroke]); // Start fresh with just the new stroke
    setUndoStack(prev => [...prev, newStroke.id]);
    return;
  }

  // Handle normal case
  if (inBetween) {
    queue.push(newStroke);
  } else {
    inBetween = true;
    setStrokes(prev => [...prev, newStroke]);
  }
  setUndoStack(prev => [...prev, newStroke.id]);
};
