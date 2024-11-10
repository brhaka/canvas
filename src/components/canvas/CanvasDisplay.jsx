/* eslint-disable react/prop-types */
import { useEffect, useState, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { debounce } from "lodash";
import { TOOL_TYPES } from "./types";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { simplifyPoints, smoothStroke } from "./utils";
import { drawLine } from "./utils";
import { Card } from "@/components/ui/card";

export function CanvasDisplay({
  canvasRef,
  strokes,
  activeTool,
  color,
  brushSize,
  addStroke,
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(null);
  const currentStrokeRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const lastPointRef = useRef(null);
  const initialSizeRef = useRef(null);
  const [zoom, setZoom] = useState(0.8);
  const CANVAS_WIDTH = 3000;
  const CANVAS_HEIGHT = 3000;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 0.2;
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Enhanced canvas resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Calculate the scale to fit the canvas in the container while maintaining aspect ratio
      const scale = Math.min(
        rect.width / CANVAS_WIDTH,
        rect.height / CANVAS_HEIGHT
      );

      // Set the styled dimensions to maintain aspect ratio
      const displayWidth = CANVAS_WIDTH * scale;
      const displayHeight = CANVAS_HEIGHT * scale;

      // Update canvas display size
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      // Set actual canvas dimensions (accounting for DPR)
      canvas.width = CANVAS_WIDTH * dpr;
      canvas.height = CANVAS_HEIGHT * dpr;

      setCanvasSize({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        displayWidth,
        displayHeight,
        dpr,
        scale,
      });
    };

    const handleResize = debounce(() => {
      updateCanvasSize();
    }, 250);

    updateCanvasSize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      handleResize.cancel();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => {
    renderStrokes();
  }, [strokes, canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
  }, [activeTool, color, brushSize]);

  const renderStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Scale the context to account for DPR
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);

    // Render all strokes
    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 2) return;

      const smoothedPoints = smoothStroke(stroke.points);

      for (let i = 1; i < smoothedPoints.length; i++) {
        drawLine(context, smoothedPoints[i - 1], smoothedPoints[i], {
          type: stroke.type,
          color: stroke.style.color,
          size: stroke.style.size,
        });
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
    const x = ((clientX - rect.left) * scaleX) / dpr;
    const y = ((clientY - rect.top) * scaleY) / dpr;

    return { x, y };
  }, []);

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      setIsMouseDown(true);
      setIsDrawing(true);

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
    },
    [activeTool, color, brushSize]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentStrokeRef.current) {
      addStroke(currentStrokeRef.current);
    }
    setIsMouseDown(false);
    setIsDrawing(false);
    setCurrentStroke(null);
    currentStrokeRef.current = null;
    lastPointRef.current = null;
  }, [isDrawing, addStroke]);

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
      if (isMouseDown) {
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
      }
    },
    [isMouseDown, activeTool, color, brushSize]
  );

  // Calculate initial zoom based on window size
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.offsetWidth;

      // Calculate zoom needed to fit width
      const horizontalZoom = containerWidth / CANVAS_WIDTH;

      // Start with zoom 1 or smaller if needed to fit width
      setZoom(Math.min(1, horizontalZoom));
    }
  }, []);

  // Update containerStyle to center the canvas
  const containerStyle = {
    transform: `scale(${zoom})`,
    transformOrigin: "0 0",
    transition: "transform 0.2s ease-out",
    width: `${CANVAS_WIDTH}px`,
    height: `${CANVAS_HEIGHT}px`,
  };

  // Add zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((prevZoom) => Math.min(prevZoom + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prevZoom) => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const minZoom = containerWidth / CANVAS_WIDTH;
      const effectiveMinZoom = Math.max(minZoom, MIN_ZOOM);
      return Math.max(prevZoom - ZOOM_STEP, effectiveMinZoom);
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();

      const delta = e.deltaY;
      setZoom((prevZoom) => {
        const containerWidth = containerRef.current?.offsetWidth || 0;
        const minZoom = containerWidth / CANVAS_WIDTH;
        const effectiveMinZoom = Math.max(minZoom, MIN_ZOOM);

        return delta > 0
          ? Math.max(prevZoom - ZOOM_STEP, effectiveMinZoom)
          : Math.min(prevZoom + ZOOM_STEP, MAX_ZOOM);
      });
    }
  }, []);

  // Add this to prevent default browser zoom
  useEffect(() => {
    const preventDefault = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    document.addEventListener("wheel", preventDefault, { passive: false });
    return () => document.removeEventListener("wheel", preventDefault);
  }, []);

  return (
    <div className="relative w-full h-full flex-1">
      <Card className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 p-2 w-[60px] items-center !rounded-l-none z-50 bg-background">
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
        ref={containerRef}
        className="w-full h-full"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          overflow: "auto",
          zIndex: "10"
        }}
        onWheel={handleWheel}
      >
        <div
          className="w-full h-full"
          style={{
            transform: `scale(${zoom})`,
          }}
        >
          <div className="flex items-center justify-center w-full h-full">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border border-border bg-background"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onMouseEnter={handleMouseEnter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
