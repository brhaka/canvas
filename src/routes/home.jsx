import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <p>This is our home page.</p>
      <Link to="/canvas">Open a canvas</Link>
    </>
  );
}
