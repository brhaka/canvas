/* eslint-disable react/prop-types */
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import colors from "@/lib/colors.json"
import ColorPicker from "@/components/color-picker"
import { useState, useEffect } from "react"
import { Pipette, RefreshCw } from "lucide-react"

// Utility functions
const getContrastColor = (hex) => {
  const rgb = hex.replace('#', '').match(/.{2}/g)
    .map(x => parseInt(x, 16))
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
  return brightness > 128 ? 'text-black' : 'text-white'
}

const calculateBrightness = (hex) => {
  const rgb = hex.replace('#', '').match(/.{2}/g)
    .map(x => parseInt(x, 16))
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
}

const getRandomColor = () => {
  const hexCodes = Object.entries(colors)
  let randomColor
  do {
    const [hex, name] = hexCodes[Math.floor(Math.random() * hexCodes.length)]
    randomColor = { hex, name }
    // Avoid colors with brightness > 200 (adjust this threshold as needed)
  } while (calculateBrightness(randomColor.hex) > 200)
  return randomColor
}

// Constants
const initialColor = getRandomColor()

// Reusable color button component
function ColorButton({ color, onClick, className }) {
  const isClickable = !!onClick;

  return (
    <button
      className={cn(
        "flex flex-col items-center p-2 rounded-md border focus:outline-none transition-opacity hover:border-transparent",
        // Only apply hover effects and pointer cursor if clickable
        isClickable && "transition-transform hover:scale-110 cursor-pointer",
        !isClickable && "cursor-default",
        getContrastColor(color.hex),
        className
      )}
      style={{ backgroundColor: color.hex }}
      onClick={onClick}
    >
      <span className="text-xs font-medium truncate w-full text-center">
        {color.name}
      </span>
      <span className={cn(
        "text-xs opacity-80",
        getContrastColor(color.hex)
      )}>
        {color.hex.replace('#', '').toUpperCase()}
      </span>
    </button>
  )
}

export default function ColorSelector({
  color: externalColor = null,
  onChange = () => {},
  className
}) {
  if (!externalColor) {
    externalColor = initialColor.hex
  }

  const [localColor, setLocalColor] = useState({
    hex: externalColor,
    name: colors[externalColor] || externalColor
  })

  const [isOpen, setIsOpen] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [suggestedColors, setSuggestedColors] = useState(
    Array.from({ length: 9 }, () => getRandomColor())
  )

  const regenerateSuggestions = () => {
    setSuggestedColors(Array.from({ length: 9 }, () => getRandomColor()))
  }

  const handleColorChange = (newHex) => {
    // Look up the color name in the colors dictionary, fallback to hex if not found
    const name = colors[newHex] || newHex
    // Update the internal state
    setLocalColor({ hex: newHex, name })
    // Only return the hex to the parent component
    onChange(newHex)
  }

  useEffect(() => {
    handleColorChange(initialColor.hex)
  }, [])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="w-10 h-10">
          <div
            className={cn(
              "w-full h-full rounded-md cursor-pointer border border-input transition-transform hover:scale-110",
              className
            )}
            style={{ backgroundColor: localColor.hex }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] p-0"
        sideOffset={10}
        side="right"
        align="start"
      >
        <div className="w-full">
          {showPicker ? (
            <div className="p-4">
              <Button
                variant="outline"
                className="mb-2 w-full justify-start focus:outline-none hover:border-transparent text-foreground"
                onClick={() => setShowPicker(false)}
              >
                ← Back
              </Button>
              <ColorPicker
                color={localColor.hex}
                onChange={handleColorChange}
              />
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <ColorButton
                  color={localColor}
                  className="flex-1 focus:ring-0 focus:outline-none hover:border-transparent rounded-md"
                />
                <Button
                  variant="outline"
                  className="h-[50px] aspect-square p-0 flex items-center justify-center text-foreground"
                  onClick={() => setShowPicker(true)}
                >
                  <Pipette className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 mb-3">
                <p className="text-lg font-semibold">Colorful Suggestions</p>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 p-0 focus:outline-none hover:border-transparent text-foreground"
                  onClick={regenerateSuggestions}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {suggestedColors.map((suggestedColor) => (
                  <ColorButton
                    key={suggestedColor.hex}
                    color={suggestedColor}
                    onClick={() => handleColorChange(suggestedColor.hex)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}