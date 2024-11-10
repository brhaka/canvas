import { Outlet } from "react-router-dom"
import "./App.css"

export default function App() {
  return (
    <main className="w-full h-full">
      <Outlet />
    </main>
  )
}
