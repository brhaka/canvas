/* eslint-disable react/prop-types */
// CanvasControls.jsx
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { TOOL_TYPES } from './types'

export function CanvasControls({
  color,
  setColor,
  brushSize,
  setBrushSize,
  activeTool,
  setActiveTool,
  onUndo,
  canUndo
}) {
  return (
    <div className="flex space-x-4 items-center">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-10 h-10"
      />

      <div className="flex-1">
        <Slider
          value={[brushSize]}
          onValueChange={(value) => setBrushSize(value[0])}
          max={20}
          step={1}
        />
      </div>

      <Button
        variant={activeTool === TOOL_TYPES.BRUSH ? 'default' : 'outline'}
        onClick={() => setActiveTool(TOOL_TYPES.BRUSH)}
      >
        Brush
      </Button>

      <Button
        variant={activeTool === TOOL_TYPES.ERASER ? 'default' : 'outline'}
        onClick={() => setActiveTool(TOOL_TYPES.ERASER)}
      >
        Eraser
      </Button>

      <Button
        onClick={onUndo}
        disabled={!canUndo}
      >
        Undo
      </Button>
    </div>
  )
}
