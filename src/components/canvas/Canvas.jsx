import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CanvasControls } from './CanvasControls'
import { CanvasDisplay } from './CanvasDisplay'
import { useStateTogether } from 'react-together'
import { TOOL_TYPES } from './types'
import _ from 'lodash'

export default function CollaborativeCanvas() {
  const canvasRef = useRef(null)
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.BRUSH)
  const [color, setColor] = useState(null)
  const [brushSize, setBrushSize] = useState(5)
  const [eraserSize, setEraserSize] = useState(20)

  const [strokes, setStrokes] = useStateTogether("strokes", [])
  const [undoStack, setUndoStack] = useStateTogether("undoStack", [])

  // Modified to work with single array of strokes
  const addStroke = (stroke) => {
    _.throttle(() => {
      setStrokes((prev) => [...prev, stroke])
      setUndoStack((prev) => [...prev, stroke.id])
    }, 1000)
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
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Canvas</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <CanvasDisplay
            canvasRef={canvasRef}
            strokes={strokes}
            activeTool={activeTool}
            color={color}
            brushSize={currentSize}
            addStroke={addStroke}
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
