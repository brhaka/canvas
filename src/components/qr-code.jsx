import { useState } from 'react';
import QRCode from 'qrcode.react';
// import { generateSessionLink } from '../utils/generateSessionLink';

// utils/generateSessionLink.js
function generateSessionLink() {
  const sessionId = Math.random().toString(36).substr(2, 9);
  return `${window.location.origin}/session/${sessionId}`;
}


const QRCodeButton = () => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [sessionLink, setSessionLink] = useState('');

  const handleClick = () => {
    const link = generateSessionLink();
    setSessionLink(link);
    setShowQRCode(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sessionLink);
    alert('Session link copied to clipboard!');
  };

  return (
    <div>
      <button onClick={handleClick}>Generate QR Code</button>
      {showQRCode && (
        <div style={{ marginTop: '20px' }}>
          <p>Scan this QR code or use the link to join the session:</p>
          <QRCode value={sessionLink} size={256} />
          <div style={{ marginTop: '10px' }}>
            <input type="text" value={sessionLink} readOnly style={{ width: '80%' }} />
            <button onClick={handleCopyLink}>Copy Link</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeButton;



