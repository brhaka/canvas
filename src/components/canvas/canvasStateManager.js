import { getJsonSize } from './utils'
import { saveCanvasState } from './canvas-states'

const MAX_STROKES_BEFORE_SAVE = 15;

export const handleStrokeUpdate = ({
  strokes,
  myStrokes,
  setMyStrokes,
  setStrokes,
  queue,
  inBetween,
  baseStrokes,
  saveState,
  MAX_STATE_SIZE_BYTES
}) => {
  if (strokes.length === 0) return;

  const currentSize = getJsonSize(strokes);
  console.log("Current strokes state size:", currentSize, "bytes");

  // Check if we need to save
  const shouldSave =
    strokes.length >= MAX_STROKES_BEFORE_SAVE ||
    currentSize >= MAX_STATE_SIZE_BYTES;

  if (shouldSave) {
    saveState();
  }

  // Handle new strokes
  const myIds = myStrokes.map(stroke => stroke.id);
  const newStrokes = strokes.filter(stroke => !myIds.includes(stroke.id));

  if (newStrokes.length > 0) {
    setMyStrokes(prevMyStrokes => [...prevMyStrokes, ...newStrokes]);
  }

  if (queue.length > 0) {
    inBetween = true;
    setStrokes(prevStrokes => [...prevStrokes, ...queue]);
    queue = [];
  } else {
    inBetween = false;
  }

  return inBetween;
};

export const handleStateSave = async ({
  strokes,
  baseStrokes,
  setBaseStrokes,
  setStrokes,
  uuid
}) => {
  if (strokes.length === 0) return;

  // Add a small random delay to prevent race conditions between users
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

  const strokesToSave = [...strokes];
  const newBaseStrokes = [...baseStrokes, ...strokesToSave];

  const success = await saveCanvasState(uuid, newBaseStrokes);
  if (success) {
    setBaseStrokes(newBaseStrokes);
    setStrokes([]);
  }
};