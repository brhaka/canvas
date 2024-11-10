import { useRef, useState, useEffect } from 'react'
import { CanvasControls } from './CanvasControls'
import { CanvasDisplay } from './CanvasDisplay'
import { useStateTogether, useStateTogetherWithPerUserValues, useConnectedUsers } from 'react-together'
import { TOOL_TYPES } from './types'
import { v4 as uuidv4 } from 'uuid';
import { loadCanvasState } from './canvas-states';
import { handleStrokeUpdate, handleStateSave } from './canvasStateManager';
import { addStroke } from './addStroke';
import ShareButton from "@/components/share-button"
import { getJsonSize } from './utils';

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

  const [showConfigModal, setShowConfigModal] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const hasLoaded = useRef(false);
  const inBetween = useRef(false);
  const queue = useRef([]);

  // User management
  const connectedUsers = useConnectedUsers()
  const [userConfig, setUserConfig] = useStateTogetherWithPerUserValues('userConfigs', {
    userId: null,
    userName: null,
    isHost: false,
    squares: []
  });

  const [canvasSettings, setCanvasSettings] = useStateTogether('canvasSettings', {
    userSpaceLimited: false
  });

  // User configuration effect
  useEffect(() => {
    if (connectedUsers.length > 0 && connectedUsers.find(user => user.isYou) && !isReady) {
      const isFirstUser = connectedUsers.length === 1;
      console.log("Setting ready, isFirstUser:", isFirstUser);
      setIsReady(true);

      if (!userConfig.userId) {
        console.log("Showing config modal, isFirstUser:", isFirstUser);
        setShowConfigModal(true);
      }
    }
  }, [connectedUsers, userConfig.userId, isReady]);

  const handleConfigSubmit = ({ username, limitUserSpace }) => {
    const isFirstUser = connectedUsers.length === 1;
    const currentUser = connectedUsers.find(user => user.isYou);

    // Set user-specific config
    setUserConfig({
      userId: currentUser?.userId || uuidv4(),
      userName: username,
      isHost: isFirstUser,
      squares: []
    });

    // If user is host, set the global canvas settings
    if (isFirstUser) {
      setCanvasSettings({
        userSpaceLimited: limitUserSpace
      });
    }

    setShowConfigModal(false);
  };

  // Simplified initial state loading
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const initializeCanvas = async () => {
      const initialState = await loadCanvasState(uuid);
      setLocalStrokes(initialState);
    };

    initializeCanvas();
  }, [uuid]);

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
    await handleStateSave({
      strokes,
      setStrokes,
      uuid
    });
  };

  // User configuration effect
  useEffect(() => {
    if (connectedUsers.length > 0 && !isReady) {
      setIsReady(true)
      if (!userConfig.userId) {
        setShowConfigModal(true)
      }
    }
  }, [connectedUsers, userConfig.userId, isReady])

  // Strokes synchronization effect
  useEffect(() => {
    console.log("strokes", strokes, strokes.length);
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

  const currentSize = activeTool === TOOL_TYPES.ERASER ? eraserSize : brushSize

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      <p className="text-center text-4xl font-medium mt-4 mb-6">
        Canvas
      </p>

      <div className="pr-8 pl-8 ml-10 mr-7">
        <ShareButton url={`${window.location.href}`} />
        <CanvasDisplay
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