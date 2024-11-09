import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from "@/lib/utils"

export default function ColorPicker({
  color = "#FFFFFF",
  onChange = () => {},
  className
}) {
  const [state, setState] = useState({
    isDragging: false,
    baseColor: color
  })
  const refs = {
    canvas: useRef(null),
    slider: useRef(null),
    container: useRef(null)
  }

  const drawGradient = useCallback(() => {
    const canvas = refs.canvas.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    // Create horizontal white-to-color-to-black gradient
    const gradientH = ctx.createLinearGradient(0, 0, canvas.width, 0)
    gradientH.addColorStop(0, '#FFFFFF')
    gradientH.addColorStop(0.5, state.baseColor)
    gradientH.addColorStop(1, '#000000')

    // Draw base gradient
    ctx.fillStyle = gradientH
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Create vertical transparent-to-black gradient
    const gradientV = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradientV.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradientV.addColorStop(1, 'rgba(0, 0, 0, 1)')

    // Draw transparency gradient
    ctx.fillStyle = gradientV
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [state.baseColor])

  const drawSlider = useCallback(() => {
    const canvas = refs.slider.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
    gradient.addColorStop(0, '#FF0000')
    gradient.addColorStop(0.17, '#FF00FF')
    gradient.addColorStop(0.33, '#0000FF')
    gradient.addColorStop(0.5, '#00FFFF')
    gradient.addColorStop(0.67, '#00FF00')
    gradient.addColorStop(0.83, '#FFFF00')
    gradient.addColorStop(1, '#FF0000')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const rgbToHex = useCallback((imageData) => {
    return '#' + [imageData[0], imageData[1], imageData[2]]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')
  }, [])

  const handleColorSelect = useCallback((e, isSlider = false) => {
    const canvas = isSlider ? refs.slider.current : refs.canvas.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = isSlider ? 0 : e.clientY - rect.top
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const imageData = ctx.getImageData(x, y, 1, 1).data
    const hex = rgbToHex(imageData)

    if (isSlider) {
      setState(prev => ({ ...prev, baseColor: hex }))
    } else {
      onChange(hex)
    }
  }, [onChange, rgbToHex])

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
    drawGradient()
    drawSlider()
  }, [drawGradient, drawSlider])

  return (
    <div className={cn("flex flex-col gap-2 p-4 bg-white rounded-xl shadow-lg w-[300px]", className)}>
      {/* Main color picker */}
      <div
        ref={refs.container}
        className="relative w-full aspect-square"
        onMouseUp={handleMouseEvents.onMouseUp}
        onMouseLeave={handleMouseEvents.onMouseUp}
      >
        <canvas
          ref={refs.canvas}
          width={200}
          height={200}
          className="w-full h-full cursor-crosshair rounded-lg"
          onMouseDown={(e) => handleMouseEvents.onMouseDown(e, false)}
          onMouseMove={(e) => handleMouseEvents.onMouseMove(e, false)}
        />
      </div>

      {/* Rainbow slider */}
      <div className="relative w-full h-6">
        <canvas
          ref={refs.slider}
          width={200}
          height={20}
          className="w-full h-full rounded-full cursor-pointer"
          onMouseDown={(e) => handleMouseEvents.onMouseDown(e, true)}
          onMouseMove={(e) => handleMouseEvents.onMouseMove(e, true)}
          onMouseUp={handleMouseEvents.onMouseUp}
          onMouseLeave={handleMouseEvents.onMouseUp}
        />
      </div>

      {/* Hex color input */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
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