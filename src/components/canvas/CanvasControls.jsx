/* eslint-disable react/prop-types */
// CanvasControls.jsx
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { TOOL_TYPES } from './types'
import ColorSelector from "@/components/color-selector"
import { Brush, Eraser } from "lucide-react"
import { Card } from "@/components/ui/card"

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
    <Card className="flex flex-col gap-4 p-2 w-[60px] items-center !rounded-l-none">
      {/* Color Selector */}
      <ColorSelector
        color={color || null}
        onChange={setColor}
        className="w-10 h-10 rounded cursor-pointer"
      />

      {/* Tools */}
      <Button
        variant="ghost"
        onClick={() => setActiveTool(TOOL_TYPES.BRUSH)}
        size="icon"
        className={`h-10 w-10 bg-background hover:bg-accent/10 hover:border-transparent
          ${activeTool === TOOL_TYPES.BRUSH ? 'ring-2 ring-primary/50' : ''}`}
        title="Brush Tool"
      >
        <Brush className="h-5 w-5 text-foreground" />
      </Button>

      <Button
        variant="ghost"
        onClick={() => setActiveTool(TOOL_TYPES.ERASER)}
        size="icon"
        className={`h-10 w-10 bg-background hover:bg-accent/10 hover:border-transparent
          ${activeTool === TOOL_TYPES.ERASER ? 'ring-2 ring-primary/50' : ''}`}
        title="Eraser Tool"
      >
        <Eraser className="h-5 w-5 text-foreground" />
      </Button>

      {/* Size Control */}
      <div className="w-full relative group h-10 mb-2">
        <div className="absolute left-0 hover:shadow-md bg-background rounded-md w-[46px] hover:w-[140px] transition-all duration-200 ease-in-out pt-1 pb-2 px-1">
          <div className="text-xs text-center mb-2">
            {activeTool === TOOL_TYPES.BRUSH ? `${brushSize}px` : `${eraserSize}px`}
          </div>
          {activeTool === TOOL_TYPES.BRUSH ? (
            <Slider
              value={[brushSize]}
              onValueChange={(value) => setBrushSize(value[0])}
              min={1}
              max={20}
              step={1}
              className="w-full cursor-pointer"
            />
          ) : (
            <Slider
              value={[eraserSize]}
              onValueChange={(value) => setEraserSize(value[0])}
              min={1}
              max={40}
              step={1}
              className="w-full cursor-pointer"
            />
          )}
        </div>
      </div>
    </Card>
  )
}
