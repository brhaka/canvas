import { Link } from "react-router-dom";
import {QRCodeButton as QRCodeButton} from '../components/qr-code';

export default function Home() {
  return (
    <>
      <p>This is our home page.</p>
      <Link to="/canvas">Open a canvas</Link>
			<QRCodeButton />
    </>
  );
}
