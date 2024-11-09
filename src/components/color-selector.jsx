import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import colorNames from "@/lib/color-names.json"
import ColorPicker from "@/components/color-picker"
import { useState } from "react"

// Utility functions
const getContrastColor = (hex) => {
  const rgb = hex.replace('#', '').match(/.{2}/g)
    .map(x => parseInt(x, 16))
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
  return brightness > 128 ? 'text-black' : 'text-white'
}

// Constants
const suggestedColors = Array.from({ length: 9 }, () => {
  const hexCodes = Object.entries(colorNames)
  const [hex, name] = hexCodes[Math.floor(Math.random() * hexCodes.length)]
  return { hex, name }
})

// Reusable color button component
function ColorButton({ color, onClick, className }) {
  return (
    <button
      className={cn(
        "flex flex-col items-center p-2 rounded-md border hover:opacity-90 hover:border-transparent focus:outline-none transition-opacity",
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
  color = { hex: "#FFFFFF", name: "White" },
  onChange = () => {},
  className
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const handleColorChange = (newHex) => {
    const name = colorNames[newHex] || newHex
    onChange({ hex: newHex, name })
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-[65px] h-[35px] p-1", className)}
        >
          <div
            className="w-full h-full rounded-sm"
            style={{ backgroundColor: color.hex }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] p-0"
        side="bottom"
        sideOffset={5}
        align="start"
        collisionPadding={20}
        avoidCollisions={false}
      >
        {showPicker ? (
          <div className="p-4">
            <Button
              variant="ghost"
              className="mb-2 w-full justify-start"
              onClick={() => setShowPicker(false)}
            >
              ← Back
            </Button>
            <ColorPicker
              color={color.hex}
              onChange={handleColorChange}
            />
          </div>
        ) : (
          <div className="p-4">
            <ColorButton
              color={color}
              onClick={() => setShowPicker(true)}
              className="w-full mb-4"
            />
            <div className="grid grid-cols-3 gap-2">
              {suggestedColors.map((suggestedColor) => (
                <ColorButton
                  key={suggestedColor.hex}
                  color={suggestedColor}
                  onClick={() => onChange(suggestedColor)}
                />
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}