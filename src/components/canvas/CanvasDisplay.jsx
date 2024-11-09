/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { useStateTogether } from 'react-together'
import _ from 'lodash'

export function CanvasDisplay({ canvasRef, color, brushSize }) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [sharedStrokes, setSharedStrokes] = useStateTogether("canvasStrokes", [])

  useEffect(() => {
    const canvas = canvasRef.current

    if (canvas) {
      const context = canvas.getContext('2d')
      if (context) {
        context.lineCap = 'round'
        context.lineJoin = 'round'
        redrawCanvas(context, sharedStrokes)
      }
    }
  }, [sharedStrokes, canvasRef])

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

        const throttledSetStrokes = _.throttle((x, y, color, brushSize) => {
          setSharedStrokes((prev) => [...prev, [{ x, y, color, brushSize }]])
          console.log('sharedStrokes', sharedStrokes)
        }, 2000)

        throttledSetStrokes(x, y, color, brushSize);
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

        const throttledSetStrokes = _.throttle((x, y, color, brushSize) => {
            setSharedStrokes((prev) => {
              const updatedStroke = [...prev[prev.length - 1], { x, y, color, brushSize }]
              return [...prev.slice(0, -1), updatedStroke]
            })
          }, 1000)

        throttledSetStrokes(x, y, color, brushSize);
      }
    }
  }

  const stopDrawing = () => setIsDrawing(false)

  const redrawCanvas = (context, strokes) => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)

    strokes.forEach((stroke) => {
      if (stroke.length < 2) return
      context.beginPath()
      context.moveTo(stroke[0].x, stroke[0].y)
      stroke.forEach(({ x, y, color, brushSize }) => {
        context.lineWidth = brushSize
        context.strokeStyle = color
        context.lineTo(x, y)
      })

      context.stroke()
    })
  }

  return (
    <>
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

    <div className="mt-4 text-sm text-muted-foreground">
      <p>Current Strokes:</p>
      <ul className="list-disc pl-6">
        {sharedStrokes.map((stroke, strokeIndex) => (
          <li key={strokeIndex}>
            Stroke {strokeIndex + 1}: {stroke.length} points,
            Color: {stroke[0]?.color},
            Brush Size: {stroke[0]?.brushSize}px
          </li>
        ))}
      </ul>
    </div>
    </>
  )
}
