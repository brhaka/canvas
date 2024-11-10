import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

function SessionGenerator() {
  const navigate = useNavigate();

  useEffect(() => {
    const uuid = uuidv4();
    navigate(`/canvas/${uuid}`);
  }, [navigate]);

  return null;
}

export default SessionGenerator;
