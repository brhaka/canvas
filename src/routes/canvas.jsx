import { Link } from "react-router-dom";
import CollaborativeCanvas from "@/components/canvas/Canvas";
import { ReactTogether } from 'react-together'

export default function Canvas() {
  return (
    <>
    <ReactTogether
      sessionParams={{
        appId: import.meta.env['VITE_APP_ID'],
        apiKey: import.meta.env['VITE_API_KEY'],
        // Having the two args below will make React Together immediately connect
        // to a new session. Remove them if you want users to start "offline"
        // TODO: sync the sessions later with uuid
        name: 'test5',
        password: 'test5',
      }}
    >

      <CollaborativeCanvas />
      <Link to="/">Go back to home</Link>
    </ReactTogether>
    </>
  );
}
