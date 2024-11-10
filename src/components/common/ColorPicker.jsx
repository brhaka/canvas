import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from "@/lib/utils"
import PropTypes from 'prop-types'

export default function ColorPicker({
  color = "#FFFFFF",
  onChange = () => {},
  className
}) {
  const [state, setState] = useState({
    isDragging: false,
    baseColor: color,
    position: { x: 0, y: 0 }
  })

  const refs = {
    canvas: useRef(null),
    slider: useRef(null),
    container: useRef(null)
  }

  const rgbToHex = useCallback((imageData) => {
    return '#' + [imageData[0], imageData[1], imageData[2]]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')
  }, [])

  const findSliderPosition = useCallback((color) => {
    const canvas = refs.slider.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Scan across the slider to find the closest matching color
    for (let x = 0; x < canvas.width; x++) {
      const imageData = ctx.getImageData(x, 0, 1, 1).data;
      const hex = rgbToHex(imageData);
      if (hex.toLowerCase() === color.toLowerCase()) {
        return x;
      }
    }
    return 0;
  }, [rgbToHex, refs.slider]);

  const drawGradient = useCallback(() => {
    const canvas = refs.canvas.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // horizontal white-to-color-to-black gradient
    const gradientH = ctx.createLinearGradient(0, 0, canvas.width, 0)

    gradientH.addColorStop(0, '#FFFFFF')
    gradientH.addColorStop(0.5, state.baseColor)
    gradientH.addColorStop(1, '#000000')

    // base gradient
    ctx.fillStyle = gradientH
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // vertical transparent-to-black gradient
    const gradientV = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradientV.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradientV.addColorStop(1, 'rgba(0, 0, 0, 1)')

    // transparency gradient
    ctx.fillStyle = gradientV
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // position indicator
    ctx.beginPath()
    ctx.arc(state.position.x, state.position.y, 10, 0, 2 * Math.PI)
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(state.position.x, state.position.y, 9, 0, 2 * Math.PI)
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 1
    ctx.stroke()
  }, [state.baseColor, state.position, refs.canvas])

  const drawSlider = useCallback(() => {
    const canvas = refs.slider.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // rainbow gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);

    gradient.addColorStop(0, '#FF0000');
    gradient.addColorStop(0.17, '#FF00FF');
    gradient.addColorStop(0.33, '#0000FF');
    gradient.addColorStop(0.5, '#00FFFF');
    gradient.addColorStop(0.67, '#00FF00');
    gradient.addColorStop(0.83, '#FFFF00');
    gradient.addColorStop(1, '#FF0000');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // marker for selected color
    const markerX = findSliderPosition(state.baseColor);
    ctx.beginPath();
    ctx.moveTo(markerX, 0);
    ctx.lineTo(markerX, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(markerX, 0);
    ctx.lineTo(markerX, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [findSliderPosition, state.baseColor, refs.slider])

  const handleColorSelect = useCallback((e, isSlider = false) => {
    const canvas = isSlider ? refs.slider.current : refs.canvas.current;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = isSlider ? 0 : e.clientY - rect.top;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(imageData);

    if (isSlider) {
      setState(prev => ({ ...prev, baseColor: hex }))
    } else {
      setState(prev => ({ ...prev, position: { x, y } }))
      onChange(hex)
    }
  }, [onChange, rgbToHex, refs.slider, refs.canvas])

  const handleMouseEvents = {
    onMouseDown: (e, isSlider = false) => {
      setState(prev => ({ ...prev, isDragging: true }))
      handleColorSelect(e, isSlider)
    },
    onMouseMove: (e, isSlider = false) => {
      if (state.isDragging) {
        handleColorSelect(e, isSlider)
      }
    },
    onMouseUp: () => {
      setState(prev => ({ ...prev, isDragging: false }))
    }
  }

  useEffect(() => {
    const container = refs.container.current
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect

      // update canvas sizes
      const canvas = refs.canvas.current
      const slider = refs.slider.current

      canvas.width = width
      canvas.height = height
      slider.width = width
      slider.height = 20

      // redraw after resize
      drawGradient()
      drawSlider()
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [drawGradient, drawSlider, refs.container, refs.canvas, refs.slider])

  return (
    <div className={cn("flex flex-col gap-2 mt-2 bg-white rounded-md w-full", className)}>
      {/* main color picker */}
      <div
        ref={refs.container}
        className="relative w-full aspect-square"
        onMouseUp={handleMouseEvents.onMouseUp}
        onMouseLeave={handleMouseEvents.onMouseUp}
      >
        <canvas
          ref={refs.canvas}
          className="w-full h-full cursor-crosshair rounded-md"
          onMouseDown={(e) => handleMouseEvents.onMouseDown(e, false)}
          onMouseMove={(e) => handleMouseEvents.onMouseMove(e, false)}
        />
      </div>

      {/* rainbow slider */}
      <div
        className="relative w-full h-6"
        onMouseUp={handleMouseEvents.onMouseUp}
        onMouseLeave={handleMouseEvents.onMouseUp}
      >
        <canvas
          ref={refs.slider}
          className="w-full h-full rounded-md cursor-pointer"
          onMouseDown={(e) => handleMouseEvents.onMouseDown(e, true)}
          onMouseMove={(e) => handleMouseEvents.onMouseMove(e, true)}
        />
      </div>

      {/* hex color input */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-md p-2">
        <input
          type="text"
          value={color.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none"
        />
        <div
          className="w-6 h-6 rounded-md"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}

ColorPicker.propTypes = {
  color: PropTypes.string,
  onChange: PropTypes.func,
  className: PropTypes.string
}