import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const adjectives = ['Happy', 'Creative', 'Bright', 'Swift', 'Clever', 'Gentle', 'Bold', 'Calm']
const nouns = ['Artist', 'Painter', 'Creator', 'Dreamer', 'Maker', 'Designer', 'Sketcher', 'Drawer']

export function generateRandomUsername() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 100)
  return `${adjective}${noun}${number}`
}

export function getRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}