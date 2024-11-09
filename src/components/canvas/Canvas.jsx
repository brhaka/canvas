import { useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CanvasControls } from './CanvasControls'
import { CanvasDisplay } from './CanvasDisplay'
import { useStateTogether } from 'react-together'
import { TOOL_TYPES } from './types'
import _ from 'lodash'

let queue = [];
let inBetween = false;

export default function CollaborativeCanvas() {
  const canvasRef = useRef(null)
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.BRUSH)
  const [color, setColor] = useState(null)
  const [brushSize, setBrushSize] = useState(5)
  const [eraserSize, setEraserSize] = useState(20)

  const [strokes, setStrokes] = useStateTogether("strokes", [])
  const [myStrokes, setMyStrokes] = useState([])
  const [undoStack, setUndoStack] = useStateTogether("undoStack", [])

  useEffect(() => {
    // add strokes to my strokes not removing ones that dont exist on strokes
    const myIds = myStrokes.map(stroke => stroke.id);
    setMyStrokes([...myStrokes, ...strokes.filter(stroke => !myIds.includes(stroke.id))]);

    // when this shit changes, we know we can send the second message
    if (queue.length > 0) {
      inBetween = true;
      setStrokes([...strokes, ...queue])
      queue = []
    } else {
      inBetween = false;
    }
  }, [strokes]);

  // Add a stroke to the current user's strokes and update undo stack
  const addStroke = (stroke) => {
    setMyStrokes([...myStrokes, stroke]);

    if (inBetween) {
      queue.push(stroke);
    } else {
      inBetween = true;
      setStrokes((prev) => [...prev, stroke])
    }
    setUndoStack((prev) => [...prev, stroke.id])
  }

  // Modified undo to work with single array of strokes
  const handleUndo = () => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev

      const strokeIdToUndo = prev[prev.length - 1]

      // Remove the stroke from strokes
      setStrokes((prevStrokes) =>
        prevStrokes.filter(stroke => stroke.id !== strokeIdToUndo)
      )

      // Return updated undo stack
      return prev.slice(0, -1)
    })
  }

  const currentSize = activeTool === TOOL_TYPES.ERASER ? eraserSize : brushSize

  return (
    <Card className="fixed inset-0 w-screen h-screen overflow-hidden">
      <CardHeader className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-4 lg:p-6 h-[60px] bg-background/95 backdrop-blur-sm">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-center sm:text-left">
          Canvas
        </CardTitle>
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
  )
}
