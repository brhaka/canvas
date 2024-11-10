import { useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CanvasControls } from './CanvasControls'
import { CanvasDisplay } from './CanvasDisplay'
import { useStateTogether, useStateTogetherWithPerUserValues, useConnectedUsers } from 'react-together'
import ShareButton from '@/components/share-button';
import { TOOL_TYPES } from './types'
import { v4 as uuidv4 } from 'uuid';
import { UserConfigModal } from './UserConfigModal'

let queue = [];
let inBetween = false;

const LAMBDA_ENDPOINT = "https://myi4qklfpb.execute-api.eu-west-3.amazonaws.com/canvas-state"
const MAX_STROKES_BEFORE_SAVE = 15;
const MAX_STATE_SIZE_BYTES = 4000;

const getJsonSize = (obj) => new TextEncoder().encode(JSON.stringify(obj)).length;

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

  // Initial state loading
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadState = async () => {
      try {
        const response = await fetch(`${LAMBDA_ENDPOINT}/${uuid}`, {
          method: 'GET'
        })

        if (response.ok) {
          const data = await response.json()
          setBaseStrokes(data)
          setMyStrokes(data)
        }
      } catch (error) {
        console.error('Failed to load state:', error)
      }
    }

    loadState()
  }, [uuid])

  useEffect(() => {
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
  }, [strokes]);

  // // Add effect to handle save completion
  // useEffect(() => {
  //   // All users update their local state when a save completes
  //   setMyStrokes(prevMyStrokes => {
  //     const newStrokes = [...baseStrokes];
  //     // Add any new strokes that came in since the save started
  //     strokes.forEach(stroke => {
  //       if (!newStrokes.find(s => s.id === stroke.id)) {
  //         newStrokes.push(stroke);
  //       }
  //     });
  //     return newStrokes;
  //   });
  // },);

  // Modified save function that coordinates across users
  const saveState = async () => {
    if (strokes.length === 0) return;

    // Add a small random delay to prevent race conditions between users
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

    try {
      console.log("Starting save to S3", {
        baseStrokesCount: baseStrokes.length,
        newStrokesCount: strokes.length,
        currentStateSize: getJsonSize(strokes)
      });

      const strokesToSave = [...strokes];
      const newBaseStrokes = [...baseStrokes, ...strokesToSave];

      const response = await fetch(`${LAMBDA_ENDPOINT}/${uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBaseStrokes)
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`);
      }

      // Update shared state
      setBaseStrokes(newBaseStrokes);
      setStrokes([]);

      console.log("Save completed successfully", {
        savedStrokesCount: strokesToSave.length
      });

    } catch (error) {
      console.error('Failed to save state:', error);
    }
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

  const addStroke = (stroke) => {
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
    <>
      {showConfigModal && isReady && (
        <UserConfigModal
          isHost={connectedUsers.length === 1}
          onSubmit={handleConfigSubmit}
          canvasSettings={canvasSettings}
        />
      )}
      <Card className="fixed inset-0 w-screen h-screen overflow-hidden">
        <CardHeader className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-4 lg:p-6 h-[60px] bg-background/95 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
              Canvas
            </CardTitle>
            <ShareButton url={`${window.location.href}`} />
          </div>
        </CardHeader>

        <CardContent className="h-full pt-[60px] pb-[80px] sm:pb-[100px]">
          <div className="relative w-full h-full">
            <CanvasDisplay
              canvasRef={canvasRef}
              strokes={myStrokes}
              activeTool={activeTool}
              color={color}
              brushSize={currentSize}
              addStroke={addStroke}
            />
          </div>
        </CardContent>

        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-background/95 backdrop-blur-sm">
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
      </Card>
    </>
  )
}