/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { debounce } from 'lodash'

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
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      
      // Set display size
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      
      // Set actual size in memory (scaled for retina)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      
      // Scale context for retina display
      const context = canvas.getContext('2d')
      context.scale(dpr, dpr)
      
      setCanvasSize({ width: rect.width, height: rect.height })
    }

    // Debounce resize handler
    const debouncedResize = debounce(() => {
      updateCanvasSize()
      renderStrokes() // Re-render strokes after resize
    }, 250)

    // Initial setup
    updateCanvasSize()

    // Add resize listener
    window.addEventListener('resize', debouncedResize)
    window.addEventListener('orientationchange', debouncedResize)

    return () => {
      window.removeEventListener('resize', debouncedResize)
      window.removeEventListener('orientationchange', debouncedResize)
    }
  }, [])

  useEffect(() => {
    renderStrokes()
  }, [userStrokes, canvasSize])

  const renderStrokes = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)

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
      className="w-full h-full touch-none select-none rounded-lg border border-gray-200"
      style={{ touchAction: 'none' }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
      onTouchStart={(e) => {
        e.preventDefault()
        const touch = e.touches[0]
        const rect = e.target.getBoundingClientRect()
        const offsetX = touch.clientX - rect.left
        const offsetY = touch.clientY - rect.top
        startDrawing({ nativeEvent: { offsetX, offsetY } })
      }}
      onTouchMove={(e) => {
        e.preventDefault()
        const touch = e.touches[0]
        const rect = e.target.getBoundingClientRect()
        const offsetX = touch.clientX - rect.left
        const offsetY = touch.clientY - rect.top
        draw({ nativeEvent: { offsetX, offsetY } })
      }}
      onTouchEnd={stopDrawing}
      onTouchCancel={stopDrawing}
    />
  )
}
