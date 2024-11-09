import { Link } from "react-router-dom";
import ColorSelector from "@/components/color-selector";
import { useStateTogether } from "react-together";
import ShareButton from '@/components/share-button.jsx';

export default function Home() {
  const [color, setColor] = useStateTogether("brushColor", { hex: "#FFFFFF", name: "White" });

  return (
    <>
      <p>This is our home page.</p>
      <Link to="/canvas">Open a canvas</Link>
      <ColorSelector
        color={color}
        onChange={setColor}
      />
			<ShareButton />
    </>
  );
}
