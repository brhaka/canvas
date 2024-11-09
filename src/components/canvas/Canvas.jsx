import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CanvasControls } from './CanvasControls'
import { CanvasDisplay } from './CanvasDisplay'
// import { useFunctionTogether } from 'react-together'

export default function CollaborativeCanvas() {
  const canvasRef = useRef(null)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)

  // const clearCanvas = useFunctionTogether("clearCanvas", () => {
  //   setSharedStrokes([])
  //   const canvas = canvasRef.current

  //   if (canvas) {
  //     const context = canvas.getContext('2d')
  //     if (context) {
  //       context.clearRect(0, 0, canvas.width, canvas.height)
  //     }
  //   }
  // });

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Canvas</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <CanvasDisplay
            canvasRef={canvasRef}
            color={color}
            brushSize={brushSize}
          />

          <CanvasControls
            color={color}
            setColor={setColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            // clearCanvas={clearCanvas}
          />
        </div>
      </CardContent>
    </Card>
  )
}
