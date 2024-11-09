/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

export function CanvasDisplay({
  canvasRef,
  userStrokes,
  activeTool,
  color,
  brushSize,
  addStroke,
  updateUndoStack
}) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState(null)
  const currentStrokeRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const setupCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
    }
    setupCanvas()
    window.addEventListener('resize', setupCanvas)
    return () => window.removeEventListener('resize', setupCanvas)
  }, [])

  useEffect(() => {
    renderStrokes()
  }, [userStrokes])

  const renderStrokes = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height) // Clear canvas

    // Render strokes from all users
    Object.values(userStrokes).forEach(userStrokeList => {
      userStrokeList.forEach(stroke => {
        if (stroke.visible !== false) {
          drawStroke(context, stroke)
        }
      })
    })

    if (currentStrokeRef.current) {
      drawStroke(context, currentStrokeRef.current)
    }
  }

  const drawStroke = (context, stroke) => {
    if (stroke.points.length < 2) return

    context.beginPath()
    context.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length; i++) {
      context.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    context.strokeStyle = stroke.style.color
    context.lineWidth = stroke.style.size
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.stroke()
  }

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent
    const newStroke = {
      id: uuidv4(),
      type: activeTool,
      points: [{ x: offsetX, y: offsetY }],
      style: { color, size: brushSize },
      timestamp: Date.now(),
      visible: true
    }

    setCurrentStroke(newStroke)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const { offsetX, offsetY } = e.nativeEvent

    setCurrentStroke(prev => {
      const updatedStroke = {
        ...prev,
        points: [...prev.points, { x: offsetX, y: offsetY }]
      }
      currentStrokeRef.current = updatedStroke
      return updatedStroke
    })

    renderStrokes()
  }

  const stopDrawing = () => {
    if (!isDrawing || !currentStroke) return

    // Finalize the current stroke by adding it to the current user's strokes
    addStroke(currentStroke)
    updateUndoStack(currentStroke.id)
    setCurrentStroke(null)
    setIsDrawing(false)
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[500px] border border-gray-200 rounded-lg"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
    />
  )
}
