/* eslint-disable react/prop-types */
import { useEffect, useState, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { debounce } from 'lodash'
import { TOOL_TYPES } from './types'
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { simplifyPoints, smoothStroke } from './utils'
import { drawLine } from './utils'
import { Card } from "@/components/ui/card"

export function CanvasDisplay({
  canvasRef,
  strokes,
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
  const initialSizeRef = useRef(null)
  const [zoom, setZoom] = useState(1);
  const CANVAS_WIDTH = 3000;
  const CANVAS_HEIGHT = 3000;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 0.1;
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Enhanced canvas resize handling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasSize = () => {
      const container = canvas.parentElement
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      // Calculate the scale to fit the canvas in the container while maintaining aspect ratio
      const scale = Math.min(
        rect.width / CANVAS_WIDTH,
        rect.height / CANVAS_HEIGHT
      )

      // Set the styled dimensions to maintain aspect ratio
      const displayWidth = CANVAS_WIDTH * scale
      const displayHeight = CANVAS_HEIGHT * scale

      // Update canvas display size
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`

      // Set actual canvas dimensions (accounting for DPR)
      canvas.width = CANVAS_WIDTH * dpr
      canvas.height = CANVAS_HEIGHT * dpr

      setCanvasSize({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        displayWidth,
        displayHeight,
        dpr,
        scale
      })
    }

    const handleResize = debounce(() => {
      updateCanvasSize()
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
  }, [strokes, canvasSize])

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

  const renderStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Scale the context to account for DPR
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);

    // Render all strokes
    strokes.forEach(stroke => {
      if (!stroke.points || stroke.points.length < 2) return;

      const smoothedPoints = smoothStroke(stroke.points);

      for (let i = 1; i < smoothedPoints.length; i++) {
        drawLine(
          context,
          smoothedPoints[i - 1],
          smoothedPoints[i],
          {
            type: stroke.type,
            color: stroke.style.color,
            size: stroke.style.size
          }
        );
      }
    });
  }, [strokes]);

  useEffect(() => {
    renderStrokes();
  }, [renderStrokes, canvasSize]);

  // Helper function to get correct coordinates for both mouse and touch events
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    let clientX, clientY;

    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calculate the scale factor between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calculate coordinates in canvas space
    const x = (clientX - rect.left) * scaleX / dpr;
    const y = (clientY - rect.top) * scaleY / dpr;

    return { x, y };
  };

  const startDrawing = (e) => {
    e?.preventDefault();
    setIsMouseDown(true);
    const point = getCoordinates(e);

    const newStroke = {
      id: uuidv4(),
      type: activeTool,
      points: [point],
      style: {
        color,
        size: brushSize
      },
      timestamp: Date.now()
    };

    setCurrentStroke(newStroke);
    currentStrokeRef.current = newStroke;
    lastPointRef.current = point;
    setIsDrawing(true);
  };

  const draw = (e) => {
    e?.preventDefault();
    if (!isDrawing || (!e.touches && !isMouseDown)) return;

    const newPoint = getCoordinates(e);
    const lastPoint = lastPointRef.current;

    // Calculate distance from last point
    const distance = Math.sqrt(
      Math.pow(newPoint.x - lastPoint.x, 2) +
      Math.pow(newPoint.y - lastPoint.y, 2)
    );

    if (distance > 2) {
      setCurrentStroke(prev => {
        const updatedStroke = {
          ...prev,
          points: [...prev.points, newPoint]
        };
        currentStrokeRef.current = updatedStroke;
        lastPointRef.current = newPoint;
        return updatedStroke;
      });

      // Draw the line immediately
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;

      // Set up the context for the current canvas size
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);

      drawLine(
        context,
        lastPoint,
        newPoint,
        {
          type: activeTool,
          color: color,
          size: brushSize
        }
      );
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentStroke) return;

    setIsMouseDown(false);

    // Only add stroke if it has at least 2 points
    if (currentStroke.points.length >= 2) {
      // Simplify the points before adding the stroke
      const simplifiedStroke = {
        ...currentStroke,
        points: simplifyPoints(currentStroke.points)
      };

      // Remove console.logs that might cause delay
      // console.log('Original points:', currentStroke.points.length);
      // console.log('Simplified points:', simplifiedStroke.points.length);

      // Update these state changes to happen simultaneously
      setCurrentStroke(null);
      currentStrokeRef.current = null;
      lastPointRef.current = null;
      setIsDrawing(false);

      // Move addStroke after state updates
      addStroke(simplifiedStroke);
    } else {
      // If stroke is too short, just reset states
      setCurrentStroke(null);
      currentStrokeRef.current = null;
      lastPointRef.current = null;
      setIsDrawing(false);
    }
  };

  // Add global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
      stopDrawing();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add non-passive touch event listeners while keeping the existing ones
    const options = { passive: false };

    const handleTouchStart = (e) => {
      e.preventDefault();
      startDrawing(e);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      draw(e);
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      stopDrawing();
    };

    // Add these listeners alongside existing ones
    canvas.addEventListener('touchstart', handleTouchStart, options);
    canvas.addEventListener('touchmove', handleTouchMove, options);
    canvas.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none select-none rounded-lg border border-gray-200"
        style={{
          touchAction: 'none',
          display: 'block',
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`
        }}
        onMouseDown={(e) => {
          setIsMouseDown(true);
          startDrawing(e);
        }}
        onMouseMove={draw}
        onMouseUp={() => {
          setIsMouseDown(false);
          stopDrawing();
        }}
        onMouseOut={(e) => {
          if (isDrawing) {
            // Finalize the current stroke before leaving the canvas
            if (currentStroke?.points.length >= 2) {
              const simplifiedStroke = {
                ...currentStroke,
                points: simplifyPoints(currentStroke.points)
              };
              addStroke(simplifiedStroke);
            }
            setIsDrawing(false);
            setCurrentStroke(null);
            currentStrokeRef.current = null;
            lastPointRef.current = null;
          }
        }}
        onMouseEnter={(e) => {
          if (isMouseDown) {
            // Start a fresh stroke when re-entering
            const point = getCoordinates(e);
            const newStroke = {
              id: uuidv4(),
              type: activeTool,
              points: [point],
              style: {
                color,
                size: brushSize
              },
              timestamp: Date.now()
            };
            setCurrentStroke(newStroke);
            currentStrokeRef.current = newStroke;
            lastPointRef.current = point;
            setIsDrawing(true);
          }
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          startDrawing(e);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          draw(e);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopDrawing();
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          stopDrawing();
        }}
      />

      {/* Zoom Controls */}
      <Card className="absolute right-0 flex flex-col gap-2 p-1.5 w-[48px] items-center !rounded-r-none top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (zoom < MAX_ZOOM) {
              setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
            }
          }}
          size="icon"
          className={`h-8 w-8 bg-background/80 hover:bg-accent/10 hover:border-transparent`}
          disabled={zoom >= MAX_ZOOM}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4 text-foreground" />
        </Button>

        <Button
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (zoom > MIN_ZOOM) {
              setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
            }
          }}
          size="icon"
          className={`h-8 w-8 bg-background/80 hover:bg-accent/10 hover:border-transparent`}
          disabled={zoom <= MIN_ZOOM}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4 text-foreground" />
        </Button>

        <Button
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setZoom(1);
          }}
          size="icon"
          className={`h-8 w-8 bg-background/80 hover:bg-accent/10 hover:border-transparent`}
          disabled={zoom === 1}
          title="Reset Zoom"
        >
          <RotateCcw className="h-4 w-4 text-foreground" />
        </Button>
      </Card>
    </div>
  )
}