
const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const app = express();
const port = 3000;

// Middleware to parse raw bodies for audio data.
// The 'type' should match the 'Content-Type' header from the front-end.
app.use(express.raw({
  type: 'audio/webm',
  limit: '10mb'
}));

// This enables your frontend (which will be on a different origin)
// to make requests to your backend.
const cors = require('cors');
app.use(cors());


// Instantiate Google Cloud Speech-to-Text client.
// This automatically uses the GOOGLE_APPLICATION_CREDENTIALS environment variable.
const client = new SpeechClient();

app.post('/transcribe', async (req, res) => {
  try {
    const audioBytes = req.body;

    if (!Buffer.isBuffer(audioBytes)) {
      return res.status(400).send('Invalid audio data.');
    }

    const request = {
      audio: {
        content: audioBytes.toString('base64'),
      },
      config: {
        // IMPORTANT: These settings must match the audio from the MediaRecorder in the frontend.
        encoding: 'WEBM_OPUS', // This encoding works for 'audio/webm; codecs=opus'
        sampleRateHertz: 48000,  // This is a common sample rate for web audio.
        languageCode: 'en-US',
      },
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('
');

    // Send the transcription back to the frontend.
    res.send({ transcription });

  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).send('Error during transcription.');
  }
});

app.listen(port, () => {
  console.log(`Transcription backend listening on http://localhost:${port}`);
});
