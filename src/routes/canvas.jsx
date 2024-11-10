import { Link, useParams } from "react-router-dom";
import CollaborativeCanvas from "@/components/canvas/Canvas";
import { ReactTogether } from 'react-together'

export default function Canvas() {
  const { uuid } = useParams();

  return (
    <>
    <ReactTogether
      sessionParams={{
        appId: import.meta.env['VITE_APP_ID'],
        apiKey: import.meta.env['VITE_API_KEY'],
        name: uuid,
        password: uuid,
      }}
    >

      <CollaborativeCanvas uuid={uuid} />
      <Link to="/">Go back to home</Link>
    </ReactTogether>
    </>
  );
}
