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
// const MAX_STROKES_BEFORE_SAVE = 15;
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

  // API-related state
  const [isSaving, setIsSaving] = useStateTogether("isSaving", false);
  const [lastSaveTime, setLastSaveTime] = useStateTogether("lastSaveTime", 0);
  const hasLoaded = useRef(false);

  // User management
  const connectedUsers = useConnectedUsers()
  const [userConfig, setUserConfig, allUsersConfig] = useStateTogetherWithPerUserValues('userConfigs', {
    userId: null,
    userName: null,
    isHost: false,
    userPaceLimited: false,
    squares: []
  });

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

  // User configuration effect
  useEffect(() => {
    console.log("connectedUsers", connectedUsers, userConfig.userId, isReady)

    if (connectedUsers.length > 0 && connectedUsers.find(user => user.isYou) && !isReady) {
      console.log("setting ready")
      setIsReady(true)

      if (!userConfig.userId) {
        console.log("showing config modal")
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

  // Save completion effect
  useEffect(() => {
    if (lastSaveTime === 0) return;

    setMyStrokes(prevMyStrokes => {
      const newStrokes = [...baseStrokes];
      strokes.forEach(stroke => {
        if (!newStrokes.find(s => s.id === stroke.id)) {
          newStrokes.push(stroke);
        }
      });
      return newStrokes;
    });
  }, [lastSaveTime, baseStrokes, strokes]);

  const saveState = async () => {
    if (isSaving || strokes.length === 0) return;

    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    if (isSaving) return;

    try {
      setIsSaving(true);
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

      setBaseStrokes(newBaseStrokes);
      setStrokes([]);
      setLastSaveTime(Date.now());

    } catch (error) {
      console.error('Failed to save state:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addStroke = (stroke) => {
    const newStroke = { ...stroke };
    const potentialNewStrokes = [...strokes, newStroke];
    const potentialSize = getJsonSize(potentialNewStrokes);

    if (potentialSize >= MAX_STATE_SIZE_BYTES) {
      saveState().then(() => {
        setMyStrokes(prev => [...prev, newStroke]);
        setStrokes([newStroke]);
        setUndoStack(prev => [...prev, newStroke.id]);
      });
      return;
    }

    setMyStrokes(prev => [...prev, newStroke]);

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

  const handleConfigSubmit = ({ username, limitUserSpace }) => {
    setUserConfig({
      userId: uuidv4(),
      userName: username,
      isHost: connectedUsers[0]?.id === connectedUsers.find(user => user.isYou)?.id,
      userSpaceLimited: limitUserSpace,
      squares: []
    })
    setShowConfigModal(false)
  }

  const currentSize = activeTool === TOOL_TYPES.ERASER ? eraserSize : brushSize

  return (
    <>
      {showConfigModal && isReady && (
        <UserConfigModal
          isHost={connectedUsers[0]?.id === connectedUsers.find(user => user.isYou)?.id}
          onSubmit={handleConfigSubmit}
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