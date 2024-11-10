import { getJsonSize } from './utils'
import { saveCanvasState } from './canvas-states'

const MAX_STROKES_BEFORE_SAVE = 15;

export const handleStrokeUpdate = ({
  strokes,
  localStrokes,
  setLocalStrokes,
  setStrokes,
  queue,
  inBetween,
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
  const myIds = localStrokes.map(stroke => stroke.id);
  const newStrokes = strokes.filter(stroke => !myIds.includes(stroke.id));

  if (newStrokes.length > 0) {
    setLocalStrokes(prevlocalStrokes => [...prevlocalStrokes, ...newStrokes]);
  }

  if (queue.current.length > 0) {
    inBetween.current = true;
    setStrokes(prevStrokes => [...prevStrokes, ...queue.current]);
    queue.current = [];
  } else {
    inBetween.current = false;
  }
};

export const handleStateSave = async ({
  localStrokes, // we assume 'strokes' is here too
  setStrokes,
  uuid
}) => {
  if (localStrokes?.length === 0) return;

  const strokesToSave = [...localStrokes];

  await saveCanvasState(uuid, strokesToSave);
  // if (success) {
  //   setStrokes([]);
  // }
};