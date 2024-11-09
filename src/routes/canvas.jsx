import { Link } from "react-router-dom";
import CollaborativeCanvas from "@/components/custom/canvas";

export default function Canvas() {
  return (
    <>
      <CollaborativeCanvas />
      <Link to="/">Go back to home</Link>
    </>
  );
}
