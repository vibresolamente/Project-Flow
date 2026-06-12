import { pipeline, env } from '@xenova/transformers';

// Disable local models, since we will download from Hugging Face
env.allowLocalModels = false;

class PipelineSingleton {
  static task = 'automatic-speech-recognition';
  static model = 'Xenova/whisper-tiny.en';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { audioData } = event.data;

  try {
    // Send a status update that we're loading the model
    self.postMessage({ status: 'loading' });

    // Retrieve the pipeline
    const transcriber = await PipelineSingleton.getInstance((x) => {
      // Send progress updates for model downloading back to the main thread
      self.postMessage({ status: 'progress', data: x });
    });

    self.postMessage({ status: 'processing' });

    // Run the model on the audio data
    const output = await transcriber(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: 'english',
      task: 'transcribe',
    });

    // Send the output back to the main thread
    self.postMessage({
      status: 'complete',
      output: output.text,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    self.postMessage({
      status: 'error',
      error: error.message,
    });
  }
});
