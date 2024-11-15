import { getJsonSize } from './utils'

const LAMBDA_ENDPOINT = "https://myi4qklfpb.execute-api.eu-west-3.amazonaws.com/canvas-state";

export const loadCanvasState = async (uuid) => {
  try {
    const response = await fetch(`${LAMBDA_ENDPOINT}/${uuid}`, {
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return [];
  } catch (error) {
    console.error('Failed to load state:', error);
    return [];
  }
};

export const saveCanvasState = async (uuid, strokesToSave) => {
  try {
    console.log("Starting save to S3", {
      newStrokesCount: strokesToSave.length,
      currentStateSize: getJsonSize(strokesToSave)
    });

    const response = await fetch(`${LAMBDA_ENDPOINT}/${uuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(strokesToSave)
    });

    if (!response.ok) {
      throw new Error(`Failed to save: ${response.statusText}`);
    }

    console.log("Save completed successfully", {
      savedStrokesCount: strokesToSave.length
    });

    return true;
  } catch (error) {
    console.error('Failed to save state:', error);
    return false;
  }
};