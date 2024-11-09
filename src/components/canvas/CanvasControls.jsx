/* eslint-disable react/prop-types */
// CanvasControls.jsx
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { TOOL_TYPES } from './types'
import ColorSelector from "@/components/color-selector"
import { Brush, Eraser } from "lucide-react"

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
    <div className="flex flex-col sm:flex-row gap-4 p-2 sm:p-4 rounded-lg bg-background/80 backdrop-blur-sm">
      {/* Color Selector with button styling */}
      <div className="flex justify-center sm:justify-start">
        <div className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground p-1">
          <ColorSelector
            color={color || "#000000"}
            onChange={setColor}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Tools Section with fixed button styling */}
      <div className="flex justify-center sm:justify-start sm:flex-1">
        <div className="flex gap-2 sm:gap-4">
          <Button
            variant="ghost"
            onClick={() => setActiveTool(TOOL_TYPES.BRUSH)}
            size="icon"
            className={`h-10 w-10 sm:h-12 sm:w-12 bg-transparent hover:bg-accent/10
              ${activeTool === TOOL_TYPES.BRUSH ? 'ring-2 ring-primary/50' : ''}`}
            title="Brush Tool"
          >
            <Brush className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTool(TOOL_TYPES.ERASER)}
            size="icon"
            className={`h-10 w-10 sm:h-12 sm:w-12 bg-transparent hover:bg-accent/10
              ${activeTool === TOOL_TYPES.ERASER ? 'ring-2 ring-primary/50' : ''}`}
            title="Eraser Tool"
          >
            <Eraser className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
          </Button>
        </div>
      </div>

      {/* Size Controls */}
      <div className="w-full sm:w-[200px] md:w-[250px] lg:w-[300px]">
        {activeTool === TOOL_TYPES.BRUSH ? (
          <div className="space-y-1">
            <label className="text-sm sm:text-base block text-center sm:text-left text-foreground">
              Brush Size: {brushSize}px
            </label>
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
            <label className="text-sm sm:text-base block text-center sm:text-left text-foreground">
              Eraser Size: {eraserSize}px
            </label>
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
