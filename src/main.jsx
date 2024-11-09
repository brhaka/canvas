import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ReactTogether } from 'react-together'

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
      <App />
    </ReactTogether>
  </StrictMode>,
)
