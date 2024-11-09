import { Link } from "react-router-dom";
import ShareButton from '@/components/share-button.jsx';

export default function Home() {
  return (
    <>
      <p>This is our home page.</p>
      <Link to="/canvas">Open a canvas</Link>
			<ShareButton />
    </>
  );
}
