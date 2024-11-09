/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { TOOL_TYPES } from './types'

export function CanvasDisplay({
  canvasRef,
  userStrokes,
  currentUserId,
  activeTool,
  color,
  brushSize,
  addStroke
}) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState(null)
  const currentStrokeRef = useRef(null)
  const lastPointRef = useRef(null)

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

  const drawLine = (context, start, end, style) => {
    context.beginPath()
    context.moveTo(start.x, start.y)

    // Use quadratic curve to smooth the line
    if (style.type === TOOL_TYPES.BRUSH) {
      const controlPoint = {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2
      }
      context.quadraticCurveTo(controlPoint.x, controlPoint.y, end.x, end.y)
    } else {
      // For eraser, use straight lines for more precise control
      context.lineTo(end.x, end.y)
    }

    // Configure line style
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = style.size

    if (style.type === TOOL_TYPES.ERASER) {
      context.globalCompositeOperation = 'destination-out'
      context.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      context.globalCompositeOperation = 'source-over'
      context.strokeStyle = style.color
    }

    context.stroke()
    context.globalCompositeOperation = 'source-over' // Reset for next operation
  }

  const renderStrokes = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Create an offscreen canvas for current user's strokes
    const userCanvas = document.createElement('canvas')
    userCanvas.width = canvas.width
    userCanvas.height = canvas.height
    const userContext = userCanvas.getContext('2d')

    // Create an offscreen canvas for other users' strokes
    const othersCanvas = document.createElement('canvas')
    othersCanvas.width = canvas.width
    othersCanvas.height = canvas.height
    const othersContext = othersCanvas.getContext('2d')

    // Separate and render strokes based on user
    Object.values(userStrokes).forEach(userStrokeList => {
      userStrokeList.forEach(stroke => {
        if (!stroke.points || stroke.points.length < 2) return

        // Choose which context to draw on based on stroke ownership
        const ctx = stroke.userId === currentUserId ? userContext : othersContext

        for (let i = 1; i < stroke.points.length; i++) {
          drawLine(
            ctx,
            stroke.points[i - 1],
            stroke.points[i],
            {
              type: stroke.type,
              color: stroke.style.color,
              size: stroke.style.size
            }
          )
        }
      })
    })

    // Draw current stroke on user canvas if it exists
    if (currentStrokeRef.current?.points.length >= 2) {
      const points = currentStrokeRef.current.points
      for (let i = 1; i < points.length; i++) {
        drawLine(
          userContext,
          points[i - 1],
          points[i],
          {
            type: currentStrokeRef.current.type,
            color: currentStrokeRef.current.style.color,
            size: currentStrokeRef.current.style.size
          }
        )
      }
    }

    // Composite the layers onto the main canvas
    // Other users' strokes first (cannot be erased)
    context.drawImage(othersCanvas, 0, 0)
    // Then current user's strokes (can be erased)
    context.drawImage(userCanvas, 0, 0)
  }

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent
    const point = { x: offsetX, y: offsetY }

    const newStroke = {
      id: uuidv4(),
      type: activeTool,
      points: [point],
      style: {
        color,
        size: brushSize
      },
      timestamp: Date.now()
    }

    setCurrentStroke(newStroke)
    currentStrokeRef.current = newStroke
    lastPointRef.current = point
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const { offsetX, offsetY } = e.nativeEvent
    const newPoint = { x: offsetX, y: offsetY }

    // Calculate distance from last point
    const lastPoint = lastPointRef.current
    const distance = Math.sqrt(
      Math.pow(newPoint.x - lastPoint.x, 2) +
      Math.pow(newPoint.y - lastPoint.y, 2)
    )

    // Only add point if we've moved far enough (reduces points for better performance)
    if (distance > 2) {
      setCurrentStroke(prev => {
        const updatedStroke = {
          ...prev,
          points: [...prev.points, newPoint]
        }
        currentStrokeRef.current = updatedStroke
        lastPointRef.current = newPoint
        return updatedStroke
      })

      renderStrokes()
    }
  }

  const stopDrawing = () => {
    if (!isDrawing || !currentStroke) return

    // Only add stroke if it has at least 2 points
    if (currentStroke.points.length >= 2) {
      addStroke(currentStroke)
    }

    setCurrentStroke(null)
    currentStrokeRef.current = null
    lastPointRef.current = null
    setIsDrawing(false)
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[500px] border border-gray-200 rounded-lg touch-none"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
    />
  )
}
