import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import './index.css'

// Routes
import App from './App'
import Home from './routes/Home'
import ErrorPage from "./ErrorPage";
import Canvas from './routes/Canvas'
import SessionGenerator from './routes/SessionGenerator'

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
        element: <SessionGenerator />,
      },
      {
        path: "/canvas/:uuid",
        element: <Canvas />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <RouterProvider router={router} />
  </StrictMode>,
)
