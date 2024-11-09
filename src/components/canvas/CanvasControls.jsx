/* eslint-disable react/prop-types */
// CanvasControls.jsx
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { TOOL_TYPES } from './types'
import ColorSelector from "@/components/color-selector"
import { Brush, Eraser, Undo } from "lucide-react"

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
    <div className="flex flex-col sm:flex-row gap-4 p-2 sm:p-4 bg-background/80 backdrop-blur-sm rounded-lg">
      <div className="flex flex-row sm:flex-1 gap-4 items-center">
        <div className="flex-none">
          <ColorSelector
            color={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        
        <div className="flex-1 min-w-[100px]">
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            max={20}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-row gap-2 sm:gap-4 justify-end items-center">
        <Button
          variant={activeTool === TOOL_TYPES.BRUSH ? 'default' : 'outline'}
          onClick={() => setActiveTool(TOOL_TYPES.BRUSH)}
          className="flex-1 sm:flex-none"
          size="sm"
        >
          <Brush className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Brush</span>
        </Button>

        <Button
          variant={activeTool === TOOL_TYPES.ERASER ? 'default' : 'outline'}
          onClick={() => setActiveTool(TOOL_TYPES.ERASER)}
          className="flex-1 sm:flex-none"
          size="sm"
        >
          <Eraser className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Eraser</span>
        </Button>

        <Button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex-1 sm:flex-none"
          size="sm"
        >
          <Undo className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Undo</span>
        </Button>
      </div>
    </div>
  )
}
