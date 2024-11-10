import { useRef, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid';

// canvas components
import { CanvasControls } from '../canvas/CanvasControls'
import { CanvasDisplay } from '../canvas/CanvasDisplay'
import { TOOL_TYPES } from '../canvas/scripts/types'

// canvas state management
import { loadCanvasState } from '../canvas/scripts/canvas-states';
import { handleStrokeUpdate, handleStateSave } from '../canvas/scripts/canvasStateManager';
import { addStroke } from '../canvas/scripts/addStroke';
import { getJsonSize } from '../canvas/scripts/utils';

// custom components
import ShareButton from "@/components/common/ShareButton"

import PropTypes from 'prop-types'

import { useStateTogether, useConnectedUsers } from 'react-together'

// Styles
import './canvas-styles.css'

const MAX_STATE_SIZE_BYTES = 4000;

export default function CollaborativeCanvas({ uuid }) {
  const canvasRef = useRef(null)
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.BRUSH)
  const [color, setColor] = useState(null)
  const [brushSize, setBrushSize] = useState(5)
  const [eraserSize, setEraserSize] = useState(20)

  const [strokes, setStrokes] = useStateTogether("strokes", [])
  const [localStrokes, setLocalStrokes] = useState([])
  const [undoStack, setUndoStack] = useStateTogether("undoStack", [])

  const myUserId = uuidv4();

  const hasLoaded = useRef(false);
  const inBetween = useRef(false);
  const queue = useRef([]);

  // keeps track of connected users
  const connectedUsers = useConnectedUsers()

  const [userCountChanged, setUserCountChanged] = useState(false);

  // triggers animation when user count changes
  useEffect(() => {
    setUserCountChanged(true);
    const timer = setTimeout(() => setUserCountChanged(false), 300);
    return () => clearTimeout(timer);
  }, [connectedUsers.length]);

  // simplified initial state loading
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const initializeCanvas = async () => {
      const initialState = await loadCanvasState(uuid);
      setLocalStrokes(initialState);
    };

    initializeCanvas();
  }, [uuid]);

  // tricky, this one.
  useEffect(() => {
    handleStrokeUpdate({
      strokes,
      localStrokes,
      setLocalStrokes,
      setStrokes,
      queue,
      inBetween,
      saveState,
      MAX_STATE_SIZE_BYTES
    });
  }, [strokes]);

  const saveState = async () => {
    // Check if all strokes are in localStrokes
    const allStrokesPresent = strokes.every(stroke =>
      localStrokes.some(localStroke => localStroke.id === stroke.id)
    );
    console.log('All strokes present in localStrokes:', allStrokesPresent);

    await handleStateSave({
      localStrokes,
      setStrokes,
      uuid
    });
  };

  // Strokes synchronization effect
  useEffect(() => {
    const myIds = localStrokes.map(stroke => stroke.id);
    setLocalStrokes([...localStrokes, ...strokes.filter(stroke => !myIds.includes(stroke.id))]);

    if (queue.current.length > 0) {
      inBetween.current = true;

      const newStrokes = [];
      while (queue.current.length > 0 && getJsonSize([...strokes, ...newStrokes, queue.current[0]]) <= MAX_STATE_SIZE_BYTES) {
        console.log("inside loop adding strokes", getJsonSize([...strokes, ...newStrokes, queue.current[0]]))
        newStrokes.push(queue.current.shift());
      }

      setStrokes(prev => [...prev, ...newStrokes]);
    } else {
      inBetween.current = false;
    }
  }, [strokes]);

  const handleAddStroke = (stroke) => {
    addStroke({
      stroke,
      strokes,
      setStrokes,
      setLocalStrokes,
      setUndoStack,
      queue,
      inBetween,
      saveState,
      MAX_STATE_SIZE_BYTES
    });
  };

  const handleUndo = () => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev

      const strokeIdToUndo = prev[prev.length - 1]
      setStrokes((prevStrokes) =>
        prevStrokes.filter(stroke => stroke.id !== strokeIdToUndo)
      )
      return prev.slice(0, -1)
    })
  }

  const currentSize = activeTool === TOOL_TYPES.ERASER ? eraserSize : brushSize;

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      <div className="relative text-center mt-4 mb-6">
        <p className="text-4xl font-medium">
          Canvas
        </p>

        {/* mobile view - canvas title */}
        <div className="md:hidden mt-2">
          <div className={`inline-flex items-center gap-2 bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-full ${
            userCountChanged ? 'animate-pop' : ''
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              {connectedUsers.length} {connectedUsers.length === 1 ? 'user' : 'users'} online
            </span>
          </div>
        </div>

        {/* desktop view - canvas controls */}
        <div className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 bg-secondary/80 backdrop-blur-sm pl-3 pr-10 mr-6 mt-3 py-1.5 rounded-full ${
              userCountChanged ? 'animate-pop' : ''
            }`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                {connectedUsers.length} {connectedUsers.length === 1 ? 'user' : 'users'} online
              </span>
            </div>
            <ShareButton url={`${window.location.href}`} />
          </div>
        </div>
      </div>

      <div className="pr-8 pl-8 ml-10 mr-7 scrollbar-hide">
        <CanvasDisplay
          userId={myUserId}
          canvasRef={canvasRef}
          strokes={localStrokes}
          activeTool={activeTool}
          color={color}
          brushSize={currentSize}
          addStroke={handleAddStroke}
        />
      </div>

      <div className="absolute left-0 top-1/2 -translate-y-1/2">
        <CanvasControls
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          eraserSize={eraserSize}
          setEraserSize={setEraserSize}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onUndo={handleUndo}
          canUndo={(undoStack || []).length > 0}
        />
      </div>
    </div>
  )
}

CollaborativeCanvas.propTypes = {
  uuid: PropTypes.string.isRequired
}
