'use client'

import { useRef, useState, useEffect } from 'react'

/* shadcn-ui */
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/* react-together */
import { useStateTogether } from 'react-together'

export default function CollaborativeCanvas() {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useStateTogether('canvas-color', '#000000')
  const [brushSize, setBrushSize] = useStateTogether('canvas-brush-size', 5)

  useEffect(() => {
    console.log('color', color)
    console.log('brushSize', brushSize)

    const canvas = canvasRef.current;

    if (canvas) {
      const context = canvas.getContext('2d')
      if (context) {
        context.lineCap = 'round'
        context.lineJoin = 'round'
      }
    }

  })

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const context = canvas.getContext('2d')
      if (context) {
        context.beginPath()
        context.moveTo(x, y)
        setIsDrawing(true)
      }
    }
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const context = canvas.getContext('2d')
      if (context) {
        context.lineWidth = brushSize
        context.strokeStyle = color
        context.lineTo(x, y)
        context.stroke()
      }
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const context = canvas.getContext('2d')
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Collaborative Canvas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            className="border border-gray-300 rounded-lg w-full h-auto cursor-crosshair"
          />
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
        </div>
      </CardContent>
    </Card>
  )
}