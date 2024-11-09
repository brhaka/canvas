/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { TOOL_TYPES } from './types'

export function CanvasDisplay({
  canvasRef,
  userStrokes,
  activeTool,
  color,
  brushSize,
  addStroke
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (activeTool === TOOL_TYPES.ERASER) {
      canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize * 2}" height="${brushSize * 2}" viewBox="0 0 24 24" fill="%23000000"><circle cx="12" cy="12" r="10" fill="white" stroke="black" stroke-width="2"/></svg>') ${brushSize} ${brushSize}, auto`
    } else {
      canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize * 2}" height="${brushSize * 2}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23${color.substring(1)}" stroke="white" stroke-width="2"/></svg>') ${brushSize} ${brushSize}, auto`
    }
  }, [activeTool, color, brushSize])

  const renderStrokes = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height) // Clear canvas

    // Render strokes from all users
    Object.values(userStrokes).forEach(userStrokeList => {
      userStrokeList.forEach(stroke => {
        drawStroke(context, stroke)
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

    // Handle eraser tool
    if (stroke.type === TOOL_TYPES.ERASER) {
      context.globalCompositeOperation = 'destination-out'
      context.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      context.globalCompositeOperation = 'source-over'
      context.strokeStyle = stroke.style.color
    }

    context.lineWidth = stroke.style.size
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.stroke()
    context.globalCompositeOperation = 'source-over' // Reset composite operation
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

    // Add the stroke to the shared state
    addStroke(currentStroke)

    // Reset local state
    setCurrentStroke(null)
    currentStrokeRef.current = null
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
