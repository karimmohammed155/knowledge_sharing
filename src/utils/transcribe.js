import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import path from 'path';

const client = new AssemblyAI({
  apiKey: '8ab01a9496234811bcd7b26be2a02bf5',
});

const transcribeAudio = async (filePath) => {
  try {
    const fullPath = path.resolve(filePath);
    console.log("Uploading from:", fullPath);

    const fileStream = fs.createReadStream(fullPath);
    const audioUrl = await client.files.upload(fileStream);

    const transcript = await client.transcripts.transcribe({ audio_url: audioUrl });

    if (transcript.status === 'error') {
      console.error("Transcription error:", transcript.error);
      return null;
    }

    return transcript.text;
  } catch (error) {
    console.error("Failed to transcribe audio:", error.message || error);
    return null;
  }
};

export default transcribeAudio;
