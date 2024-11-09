import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ReactTogether } from 'react-together'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import './index.css'

// Routes
import App from './App'
import Home from './routes/home'
import ErrorPage from "./error-page";
import Canvas from './routes/canvas'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/home",
        element: <Navigate to="/" replace />,
      },
      {
        path: "/canvas",
        element: <Canvas />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ReactTogether
      sessionParams={{
        appId: import.meta.env['VITE_APP_ID'],
        apiKey: import.meta.env['VITE_API_KEY'],
        // Having the two args below will make React Together immediately connect
        // to a new session. Remove them if you want users to start "offline"
        // name: import.meta.env['VITE_SESSION_NAME'],
        // password: import.meta.env['VITE_SESSION_PASSWORD'],
      }}
    >
      <RouterProvider router={router} />
    </ReactTogether>
  </StrictMode>,
)
