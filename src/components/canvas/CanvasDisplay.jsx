/* eslint-disable react/prop-types */
import { useEffect, useState, useRef, useCallback } from 'react'
import { Card } from "@/components/ui/card"
import { v4 as uuidv4 } from 'uuid'
import { debounce } from 'lodash'
import { TOOL_TYPES } from './types'
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { simplifyPoints, smoothStroke } from './utils'
import { drawLine } from './utils'
import seedrandom from 'seedrandom';

export function CanvasDisplay({
  canvasRef,
  strokes,
  activeTool,
  color,
  brushSize,
  addStroke,
  userId
}) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState(null)
  const currentStrokeRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const lastPointRef = useRef(null)
  const [zoom, setZoom] = useState(1);
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 1000;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 0.2;
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const BASE_CANVAS_WIDTH = 3000;
  const BASE_CANVAS_HEIGHT = 3000;
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: BASE_CANVAS_WIDTH,
    height: BASE_CANVAS_HEIGHT
  });
  const initialZoomRef = useRef(false);

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

    let size = Math.max(brushSize / 2, 8);

    if (activeTool === TOOL_TYPES.ERASER) {
      canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${
        size * 2
      }" height="${
        size * 2
      }" viewBox="0 0 24 24" fill="%23000000"><circle cx="12" cy="12" r="10" fill="white" stroke="black" stroke-width="2"/></svg>') ${size} ${size}, auto`;
    } else {
      const colorHex = color ? color.substring(1) : "000000";
      canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${
        size * 2
      }" height="${
        size * 2
      }" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23${colorHex}" stroke="white" stroke-width="2"/></svg>') ${size} ${size}, auto`;
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
  const getCoordinates = useCallback((e) => {
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
  }, []);

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

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDrawing) return;

      const point = getCoordinates(e);
      if (currentStrokeRef.current) {
        const updatedStroke = {
          ...currentStrokeRef.current,
          points: [...currentStrokeRef.current.points, point],
        };
        setCurrentStroke(updatedStroke);
        currentStrokeRef.current = updatedStroke;

        // Draw the new line segment immediately
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;

        if (lastPointRef.current) {
          context.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawLine(context, lastPointRef.current, point, {
            type: activeTool,
            color: color,
            size: brushSize,
          });
        }

        lastPointRef.current = point;
      }
    },
    [isDrawing, activeTool, color, brushSize]
  );

  const handleMouseLeave = useCallback(() => {
    if (isDrawing && currentStrokeRef.current) {
      addStroke(currentStrokeRef.current);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
    currentStrokeRef.current = null;
    lastPointRef.current = null;
  }, [isDrawing, addStroke]);

  const handleMouseEnter = useCallback(
    (e) => {
      // Only start drawing if mouse button is still pressed (e.buttons === 1 for left button)
      if (isMouseDown && e.buttons === 1) {
        const point = getCoordinates(e);
        const newStroke = {
          id: uuidv4(),
          type: activeTool,
          points: [point],
          style: {
            color,
            size: brushSize,
          },
          timestamp: Date.now(),
        };
        setCurrentStroke(newStroke);
        currentStrokeRef.current = newStroke;
        lastPointRef.current = point;
        setIsDrawing(true);
      } else {
        // Reset drawing state if mouse button is not pressed
        setIsMouseDown(false);
        setIsDrawing(false);
        setCurrentStroke(null);
        currentStrokeRef.current = null;
        lastPointRef.current = null;
      }
    },
    [isMouseDown, activeTool, color, brushSize]
  );

  // Calculate initial zoom based on window size
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
      stopDrawing();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Calculate initial zoom and position based on user ID
  useEffect(() => {
    if (containerRef.current && !initialZoomRef.current && userId) {
      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Create a seeded random number generator
        const rng = seedrandom(userId);

        // Calculate zoom (between 1.5 and 2.5 for mobile)
        const mobileZoom = 1.5 + (rng() * 1);

        // Calculate random position within canvas bounds
        // Ensure the visible area stays within canvas boundaries
        const maxX = canvasDimensions.width - (containerWidth / mobileZoom);
        const maxY = canvasDimensions.height - (containerHeight / mobileZoom);

        const randomX = Math.floor(rng() * maxX);
        const randomY = Math.floor(rng() * maxY);

        setZoom(mobileZoom);
        setTransform({ x: -randomX, y: -randomY });
      } else {
        // Desktop behavior remains the same
        const horizontalZoom = containerWidth / canvasDimensions.width;
        setZoom(horizontalZoom);
        setTransform({ x: 0, y: 0 });
      }

      // Mark initial zoom as complete
      initialZoomRef.current = true;
    }
  }, [userId, canvasDimensions]);

  // Update containerStyle to use canvasDimensions
  const containerStyle = {
    transform: `translate(${transform.x}px, ${transform.y}px) scale(${zoom})`,
    transformOrigin: '0 0',
    transition: 'transform 0.2s ease-out',
    width: `${canvasDimensions.width}px`,
    height: `${canvasDimensions.height}px`,
  };

  // Add zoom handlers
  const handleZoomIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setZoom(prevZoom => Math.min(prevZoom + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setZoom(prevZoom => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const minZoom = containerWidth / CANVAS_WIDTH;
      const effectiveMinZoom = Math.max(minZoom, MIN_ZOOM);
      return Math.max(prevZoom - ZOOM_STEP, effectiveMinZoom);
    });
  }, []);

  const handleResetZoom = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setZoom(1);
    setTransform({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const widthScale = Math.max(1, screenWidth / BASE_CANVAS_WIDTH);
        const heightScale = Math.max(1, screenHeight / BASE_CANVAS_HEIGHT);
        const scale = Math.max(widthScale, heightScale);

        setCanvasDimensions({
          width: BASE_CANVAS_WIDTH * scale,
          height: BASE_CANVAS_HEIGHT * scale
        });
      } else {
        setCanvasDimensions({
          width: BASE_CANVAS_WIDTH,
          height: BASE_CANVAS_HEIGHT
        });
      }
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto"
      style={{ height: 'calc(100vh - 64px)' }}
    >
    <div className="relative w-full h-full flex-1">
      <Card className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 p-2 w-[60px] items-center !rounded-r-none z-50 bg-background">
        <Button
          variant="ghost"
          onClick={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
          size="icon"
          className="h-10 w-10 bg-background hover:bg-accent/10 hover:border-transparent"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5 text-foreground" />
        </Button>

        <Button
          variant="ghost"
          onClick={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
          size="icon"
          className="h-10 w-10 bg-background hover:bg-accent/10 hover:border-transparent"
          title="Zoom Out"
        >
          <ZoomOut className="h-5 w-5 text-foreground" />
        </Button>

        <Button
          variant="ghost"
          onClick={handleResetZoom}
          size="icon"
          className="h-10 w-10 bg-background hover:bg-accent/10 hover:border-transparent"
          title="Reset Zoom"
        >
          <RotateCcw className="h-5 w-5 text-foreground" />
        </Button>
      </Card>

      <div
        className="absolute h-full w-full"
        style={containerStyle}
      >
        <canvas
          ref={canvasRef}
          className="touch-none select-none rounded-lg border border-gray-200"
          style={{
            touchAction: 'none',
            display: 'block',
            width: `${canvasDimensions.width}px`,
            height: `${canvasDimensions.height}px`
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />

        {/* Zoom Controls */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="w-10 h-10 bg-background/95 backdrop-blur-sm shadow-lg hover:bg-background"
            title="Zoom In"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="w-10 h-10 bg-background/95 backdrop-blur-sm shadow-lg hover:bg-background"
            title="Zoom Out"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleResetZoom}
            disabled={zoom === 1}
            className="w-10 h-10 bg-background/95 backdrop-blur-sm shadow-lg hover:bg-background"
            title="Reset Zoom"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}
