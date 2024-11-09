/* eslint-disable react/prop-types */
// CanvasControls.jsx
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { TOOL_TYPES } from './types'
import ColorSelector from "@/components/color-selector";
// import { useStateTogether } from "react-together";

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
      <ColorSelector
        color={color}
        onChange={(e) => setColor(e.target.value)}
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
