import { Outlet } from "react-router-dom"

export default function App() {
  return (
    <div>
      {/* Shared layout elements go here (footer, navigation, etc) */}
      <Outlet />
    </div>
  )
}
