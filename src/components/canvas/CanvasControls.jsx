/* eslint-disable react/prop-types */
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

export function CanvasControls({ color, setColor, brushSize, setBrushSize, clearCanvas }) {
  return (
    <div className="flex space-x-4">
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

      <Button onClick={clearCanvas}>Clear Canvas</Button>
    </div>
  )
}
