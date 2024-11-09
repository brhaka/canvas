export const TOOL_TYPES = {
  BRUSH: 'brush',
  ERASER: 'eraser'
}

// Shape of the stroke object for reference
export const strokeShape = {
  id: 'string',
  type: 'brush|eraser',
  points: [{ x: 0, y: 0 }],
  style: {
    color: 'string',
    size: 'number'
  },
  timestamp: 'number',
  visible: 'boolean'
}