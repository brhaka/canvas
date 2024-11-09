import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// utils/generateSessionLink.js
export function generateSessionLink() {
  const sessionId = Math.random().toString(36).substr(2, 9);
  return `${window.location.origin}/session/${sessionId}`;
}


// components/QRCodeButton.jsx
import QRCode from 'qrcode.react';
// import { generateSessionLink } from '../utils/generateSessionLink';

const QRCodeButton = () => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [sessionLink, setSessionLink] = useState('');

  const handleClick = () => {
    const link = generateSessionLink();
    setSessionLink(link);
    setShowQRCode(true);
  };

  return (
    <div>
      <button onClick={handleClick}>Generate QR Code</button>
      {showQRCode && (
        <div style={{ marginTop: '20px' }}>
          <p>Scan this QR code to join the session:</p>
          <QRCode value={sessionLink} size={256} />
          <p>{sessionLink}</p>
        </div>
      )}
    </div>
  );
};

// export default QRCodeButton;


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
				<div>
    			<h1>Collaborative Canvas</h1>
    				<QRCodeButton />
    				{/* Your canvas or other components */}
  			</div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}


export default App
