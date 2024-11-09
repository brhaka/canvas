/* eslint-disable react/prop-types */
// CanvasControls.jsx
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { TOOL_TYPES } from './types'
import ColorSelector from "@/components/color-selector";
import { Paintbrush, Eraser } from "lucide-react";

export function CanvasControls({
  color,
  setColor,
  brushSize,
  setBrushSize,
  eraserSize,
  setEraserSize,
  activeTool,
  setActiveTool,
  onUndo,
  canUndo
}) {

  return (
    <div className="flex space-x-4 items-center">
      <ColorSelector
        color={color}
        onChange={setColor}
      />

      <div className="flex-1">

        <div className="flex gap-2">
          <Button
            variant={activeTool === TOOL_TYPES.BRUSH ? 'default' : 'outline'}
            onClick={() => setActiveTool(TOOL_TYPES.BRUSH)}
            size="icon"
            className="h-10 w-10"
            title="Brush Tool"
          >
            <Paintbrush className="h-5 w-5" />
          </Button>

          <Button
            variant={activeTool === TOOL_TYPES.ERASER ? 'default' : 'outline'}
            onClick={() => setActiveTool(TOOL_TYPES.ERASER)}
            size="icon"
            className="h-10 w-10"
            title="Eraser Tool"
          >
            <Eraser className="h-5 w-5" />
          </Button>

          {/* <Button
            variant="outline"
            onClick={onUndo}
            disabled={!canUndo}
            size="icon"
            className="h-10 w-10"
            title="Undo"
          >
            <Undo className="h-5 w-5" />
          </Button> */}
        </div>
      </div>

      <div className="space-y-2">
        {activeTool === TOOL_TYPES.BRUSH ? (
          <div className="space-y-1">
            <label className="text-sm">Brush Size: {brushSize}px</label>
            <Slider
              value={[brushSize]}
              onValueChange={(value) => setBrushSize(value[0])}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-sm">Eraser Size: {eraserSize}px</label>
            <Slider
              value={[eraserSize]}
              onValueChange={(value) => setEraserSize(value[0])}
              min={1}
              max={40}
              step={1}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}
