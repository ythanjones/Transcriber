
const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const app = express();
const port = 3000;
const cors = require('cors');

// Enable CORS for all routes
app.use(cors());

// The 'type' is now more flexible, accepting any audio type.
app.use(express.raw({
  type: 'audio/*',
  limit: '10mb'
}));

const client = new SpeechClient();

app.post('/transcribe', async (req, res) => {
  try {
    const audioBytes = req.body;
    const contentType = req.headers['content-type'];
    let encoding;

    // Determine encoding from Content-Type
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
    
    console.log(`Received audio with Content-Type: ${contentType}, using encoding: ${encoding}`);

    const request = {
      audio: {
        content: audioBytes.toString('base64'),
      },
      config: {
        encoding: encoding,
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
      },
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('
'); // Corrected this line to remove the invalid newline

    res.send({ transcription });

  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).send('Error during transcription.');
  }
});

app.listen(port, () => {
  console.log(`Transcription backend listening on http://localhost:${port}`);
});
