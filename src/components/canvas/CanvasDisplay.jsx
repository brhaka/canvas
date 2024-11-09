/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { debounce } from 'lodash'
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
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const lastPointRef = useRef(null)
  const resizeTimeoutRef = useRef(null)
  const initialSizeRef = useRef(null)

  // Enhanced canvas resize handling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasSize = () => {
      const container = canvas.parentElement
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      // Store initial size if not set
      if (!initialSizeRef.current) {
        initialSizeRef.current = {
          width: rect.width,
          height: rect.height
        }
      }

      // Calculate scale to ensure content fits
      const scaleX = rect.width / initialSizeRef.current.width
      const scaleY = rect.height / initialSizeRef.current.height
      const scale = Math.min(scaleX, scaleY) * 0.9

      // Update canvas dimensions
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)

      const context = canvas.getContext('2d')
      context.scale(dpr, dpr)

      setCanvasSize({
        width: rect.width,
        height: rect.height,
        scale: scale
      })
    }

    const handleResize = debounce(() => {
      updateCanvasSize()
      renderStrokes()
    }, 250)

    updateCanvasSize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      handleResize.cancel()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  useEffect(() => {
    renderStrokes()
  }, [userStrokes, canvasSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (activeTool === TOOL_TYPES.ERASER) {
      canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize * 2}" height="${brushSize * 2}" viewBox="0 0 24 24" fill="%23000000"><circle cx="12" cy="12" r="10" fill="white" stroke="black" stroke-width="2"/></svg>') ${brushSize} ${brushSize}, auto`
    } else {
      const colorHex = color ? color.substring(1) : '000000'
      canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize * 2}" height="${brushSize * 2}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23${colorHex}" stroke="white" stroke-width="2"/></svg>') ${brushSize} ${brushSize}, auto`
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
    if (!canvas || !initialSizeRef.current) return

    const context = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.scale(dpr, dpr)

    // Center the content
    const offsetX = (canvas.width / dpr - initialSizeRef.current.width * canvasSize.scale) / 2
    const offsetY = (canvas.height / dpr - initialSizeRef.current.height * canvasSize.scale) / 2
    context.translate(offsetX, offsetY)

    Object.values(userStrokes).forEach(userStrokeList => {
      userStrokeList.forEach(stroke => {
        if (!stroke.points || stroke.points.length < 2) return

        for (let i = 1; i < stroke.points.length; i++) {
          const start = stroke.points[i - 1]
          const end = stroke.points[i]
          
          drawLine(
            context,
            {
              x: start.x * canvasSize.scale,
              y: start.y * canvasSize.scale
            },
            {
              x: end.x * canvasSize.scale,
              y: end.y * canvasSize.scale
            },
            {
              type: stroke.type,
              color: stroke.style.color,
              size: stroke.style.size * canvasSize.scale
            }
          )
        }
      })
    })

    // Reset transform
    context.setTransform(1, 0, 0, 1, 0, 0)
  }

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent
    const scaleX = initialSizeRef.current.width / canvasSize.width
    const scaleY = initialSizeRef.current.height / canvasSize.height
    
    const point = {
      x: offsetX * scaleX,
      y: offsetY * scaleY
    }

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
    const scaleX = initialSizeRef.current.width / canvasSize.width
    const scaleY = initialSizeRef.current.height / canvasSize.height
    
    const newPoint = {
      x: offsetX * scaleX,
      y: offsetY * scaleY
    }

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
      className="w-full h-full touch-none select-none rounded-lg border border-gray-200"
      style={{ 
        touchAction: 'none',
        display: 'block', // Ensure block display
        maxWidth: '100%', // Prevent overflow
        maxHeight: '100%' // Prevent overflow
      }}
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
