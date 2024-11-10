import { useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CanvasControls } from './CanvasControls'
import { CanvasDisplay } from './CanvasDisplay'
import { useStateTogether, useStateTogetherWithPerUserValues, useConnectedUsers } from 'react-together'
import { TOOL_TYPES } from './types'
import { v4 as uuidv4 } from 'uuid';
import { UserConfigModal } from './UserConfigModal'
import { loadCanvasState } from './canvas-states';
import { handleStrokeUpdate, handleStateSave } from './canvasStateManager';
import { addStroke } from './addStroke';
import ShareButton from "@/components/share-button"
import './canvas-styles.css'

let queue = [];
let inBetween = false;

const MAX_STATE_SIZE_BYTES = 4000;

export default function CollaborativeCanvas({ uuid }) {
  const canvasRef = useRef(null)
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.BRUSH)
  const [color, setColor] = useState(null)
  const [brushSize, setBrushSize] = useState(5)
  const [eraserSize, setEraserSize] = useState(20)

  const [strokes, setStrokes] = useStateTogether("strokes", [])
  const [myStrokes, setMyStrokes] = useState([])
  const [undoStack, setUndoStack] = useStateTogether("undoStack", [])
  const [baseStrokes, setBaseStrokes] = useState([])

  const [showConfigModal, setShowConfigModal] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const hasLoaded = useRef(false);

  // User management
  const connectedUsers = useConnectedUsers()
  const [userConfig, setUserConfig] = useStateTogetherWithPerUserValues('userConfigs', {
    userId: null,
    userName: null,
    isHost: false,
    squares: []
  });

  // const [canvasSettings, setCanvasSettings] = useStateTogether('canvasSettings', {
  //   userSpaceLimited: false
  // });

  const [userCountChanged, setUserCountChanged] = useState(false);

  // Add effect to trigger animation when user count changes
  useEffect(() => {
    setUserCountChanged(true);
    const timer = setTimeout(() => setUserCountChanged(false), 300);
    return () => clearTimeout(timer);
  }, [connectedUsers.length]);

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


  // const handleConfigSubmit = ({ username, limitUserSpace }) => {
  //   const isFirstUser = connectedUsers.length === 1;
  //   const currentUser = connectedUsers.find(user => user.isYou);

  //   // Set user-specific config
  //   setUserConfig({
  //     userId: currentUser?.userId || uuidv4(),
  //     userName: username,
  //     isHost: isFirstUser,
  //     squares: []
  //   });

  //   // If user is host, set the global canvas settings
  //   if (isFirstUser) {
  //     setCanvasSettings({
  //       userSpaceLimited: limitUserSpace
  //     });
  //   }

  //   setShowConfigModal(false);
  // };

  // Simplified initial state loading
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const initializeCanvas = async () => {
      const initialState = await loadCanvasState(uuid);
      setBaseStrokes(initialState);
      setMyStrokes(initialState);
    };

    initializeCanvas();
  }, [uuid]);

  useEffect(() => {
    handleStrokeUpdate({
      strokes,
      myStrokes,
      setMyStrokes,
      setStrokes,
      queue,
      inBetween,
      baseStrokes,
      saveState,
      MAX_STATE_SIZE_BYTES
    });
  }, [strokes]);

  const saveState = async () => {
    await handleStateSave({
      strokes,
      baseStrokes,
      setBaseStrokes,
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
    const myIds = myStrokes.map(stroke => stroke.id);
    setMyStrokes([...myStrokes, ...strokes.filter(stroke => !myIds.includes(stroke.id))]);

    if (queue.length > 0) {
      inBetween = true;
      setStrokes(prevStrokes => [...prevStrokes, ...queue]);
      queue = [];
    } else {
      inBetween = false;
    }
  }, [strokes]);

  const handleAddStroke = (stroke) => {
    addStroke({
      stroke,
      strokes,
      setStrokes,
      setMyStrokes,
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
      <div className="relative text-center mt-4 mb-6">
        <p className="text-4xl font-medium">
          Canvas
        </p>

        {/* Mobile view - shown below Canvas title */}
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

        {/* Desktop view - shown to the right */}
        <div className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-full ${
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
        {/* Show ShareButton below status on mobile */}
        <div className="md:hidden flex justify-end mb-4">
          <ShareButton url={`${window.location.href}`} />
        </div>

        <CanvasDisplay
          canvasRef={canvasRef}
          strokes={myStrokes}
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