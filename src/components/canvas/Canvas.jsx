import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CanvasControls } from './CanvasControls'
import { CanvasDisplay } from './CanvasDisplay'
import { useStateTogetherWithPerUserValues } from 'react-together'
import { TOOL_TYPES } from './types'

export default function CollaborativeCanvas() {
  const canvasRef = useRef(null)
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.BRUSH)
  const [color, setColor] = useState(null)
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
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Canvas</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <CanvasDisplay
            canvasRef={canvasRef}
            userStrokes={getAllUserStrokes} // Retrieve all user strokes to render
            activeTool={activeTool}
            color={color}
            brushSize={brushSize}
            addStroke={addStroke}
            updateUndoStack={updateUndoStack}
          />
          <CanvasControls
            color={color}
            setColor={setColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            onUndo={handleUndo}
            canUndo={undoStack.length > 0}
          />
        </div>
      </CardContent>
    </Card>
  )
}
