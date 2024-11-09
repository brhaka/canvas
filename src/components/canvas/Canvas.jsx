import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CanvasControls } from './CanvasControls'
import { CanvasDisplay } from './CanvasDisplay'
import { useStateTogetherWithPerUserValues } from 'react-together'
import { TOOL_TYPES } from './types'

export default function CollaborativeCanvas() {
  const canvasRef = useRef(null)
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.BRUSH)
  const [color, setColor] = useState('#000' + Math.floor(Math.random() * 16777215).toString(16))
  const [brushSize, setBrushSize] = useState(5)
  const [eraserSize, setEraserSize] = useState(20)

  // Initialize user-specific state for strokes and undo stack
  const [userStrokes, setUserStrokes, getAllUserStrokes] = useStateTogetherWithPerUserValues("userStrokes", [])
  const [undoStack, setUndoStack] = useStateTogetherWithPerUserValues("undoStack", [])

  // Add a stroke to the current user's strokes and update undo stack
  const addStroke = (stroke) => {
    setUserStrokes((prev) => [...prev, stroke])
    setUndoStack((prev) => [...prev, stroke.id])
  }

  // Handle undo for the current user only
  const handleUndo = () => {
    setUndoStack((prev) => {
      const currentUndoStack = prev || []
      if (currentUndoStack.length === 0) return prev

      const strokeIdToUndo = currentUndoStack[currentUndoStack.length - 1]

      // Remove the stroke from userStrokes
      setUserStrokes((prevStrokes) =>
        prevStrokes.filter(stroke => stroke.id !== strokeIdToUndo)
      )

      // Return updated undo stack
      return currentUndoStack.slice(0, -1)
    })
  }

  // Update the size passed to CanvasDisplay based on active tool
  const currentSize = activeTool === TOOL_TYPES.ERASER ? eraserSize : brushSize

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Canvas</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <CanvasDisplay
            canvasRef={canvasRef}
            userStrokes={getAllUserStrokes}
            activeTool={activeTool}
            color={color}
            brushSize={currentSize}
            addStroke={addStroke}
            updateUndoStack={addStroke}
          />
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
      </CardContent>
    </Card>
  )
}
