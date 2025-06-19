
const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const app = express();
const port = 3000;
const cors = require('cors');

// Enable CORS for all routes, which is necessary for cross-origin requests from the browser.
app.use(cors());

// Use express.raw middleware to accept any audio format.
app.use(express.raw({
  type: 'audio/*',
  limit: '20mb' // Increased limit for longer audio chunks
}));

// Initialize the Google Cloud Speech Client
const client = new SpeechClient();

app.post('/transcribe', async (req, res) => {
  // 1. Check for Audio Data
  if (!req.body || req.body.length === 0) {
    console.log("Received empty request body.");
    return res.status(400).send('No audio data received.');
  }

  try {
    const audioBytes = req.body;
    const contentType = req.headers['content-type'];
    let encoding;

    // 2. Determine Encoding from Content-Type
    if (contentType.includes('webm')) {
      encoding = 'WEBM_OPUS';
    } else if (contentType.includes('ogg')) {
      encoding = 'OGG_OPUS';
    } else if (contentType.includes('mp4')) {
      encoding = 'MP4_AUDIO';
    } else {
      console.error(`Unsupported content type: ${contentType}`);
      return res.status(400).send(`Unsupported content type: ${contentType}`);
    }

    console.log(`Processing audio with Content-Type: ${contentType}, Encoding: ${encoding}`);

    const request = {
      audio: {
        content: audioBytes.toString('base64'),
      },
      config: {
        encoding: encoding,
        // 3. Removed sampleRateHertz to allow Google API to auto-detect it.
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
      },
    };

    const [response] = await client.recognize(request);
    
    // 4. Handle Empty Transcription Results
    if (response.results.length === 0 || !response.results[0].alternatives[0]) {
        console.log("Received no transcription results from API.");
        return res.send({ transcription: "" }); // Send empty transcription
    }

    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('
'); // 5. Corrected the syntax error here.

    console.log("Successfully transcribed audio.");
    res.send({ transcription });

  } catch (error) {
    console.error('ERROR during Google Cloud transcription:', error);
    res.status(500).send('Error during transcription.');
  }
});

app.listen(port, () => {
  console.log(`Transcription backend listening on http://localhost:${port}`);
});
