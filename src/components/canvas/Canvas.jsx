import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CanvasControls } from './CanvasControls'
import { CanvasDisplay } from './CanvasDisplay'
import { useStateTogetherWithPerUserValues } from 'react-together'
import { TOOL_TYPES } from './types'

export default function CollaborativeCanvas() {
  const canvasRef = useRef(null)
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.BRUSH)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)

  // Initialize user-specific state for strokes, undoStack, and redoStack
  const [userStrokes, setUserStrokes, getAllUserStrokes] = useStateTogetherWithPerUserValues("userStrokes", [])
  const [undoStack, setUndoStack, getAllUndoStacks] = useStateTogetherWithPerUserValues("undoStack", [])
  const [redoStack, setRedoStack, getAllRedoStacks] = useStateTogetherWithPerUserValues("redoStack", [])

  // Add a stroke to the current user's strokes
  const addStroke = (stroke) => {
    setUserStrokes((prev) => [...prev, stroke])
    console.log("Stroke added:", stroke)
  }

  // Update the undo stack for the current user
  const updateUndoStack = (strokeId) => {
    setUndoStack((prev) => [...prev, strokeId])
    console.log("Undo stack updated:", strokeId)
  }

  // Handle undo for the current user only
  const handleUndo = () => {
    const userUndoStack = undoStack || []
    if (userUndoStack.length === 0) return

    const strokeToUndo = userUndoStack[userUndoStack.length - 1]
    setUserStrokes((prevStrokes) =>
      prevStrokes.map(stroke =>
        stroke.id === strokeToUndo ? { ...stroke, visible: false } : stroke
      )
    )

    setUndoStack((prev) => prev.slice(0, -1))
    setRedoStack((prev) => [...prev, strokeToUndo])
    console.log("Undo performed for stroke:", strokeToUndo)
  }

  return (
    <Card className="w-[95%] h-[90vh] max-w-[1400px] mx-auto rounded-lg sm:w-full">
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-center sm:text-left">
          Canvas
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2 sm:p-4 lg:p-6 h-[calc(100%-4rem)]">
        <div className="flex flex-col h-full space-y-2 sm:space-y-4">
          {/* Canvas Display with adaptive dimensions */}
          <div className="relative flex-grow w-full rounded-lg overflow-hidden bg-background/5">
            <CanvasDisplay
              canvasRef={canvasRef}
              userStrokes={getAllUserStrokes}
              activeTool={activeTool}
              color={color}
              brushSize={brushSize}
              addStroke={addStroke}
              updateUndoStack={updateUndoStack}
              className="w-full h-full"
            />
          </div>

          {/* Controls with adaptive layout */}
          <div className="flex-none mt-2 sm:mt-4">
            <CanvasControls
              color={color}
              setColor={setColor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              onUndo={handleUndo}
              canUndo={undoStack.length > 0}
              className="flex-wrap gap-2 sm:gap-3 lg:gap-4"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
