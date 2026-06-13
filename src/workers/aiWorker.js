import { pipeline, env } from '@xenova/transformers';

// Skip local check, download models directly from huggingface
env.allowLocalModels = false;

// We will cache pipelines so we don't load them repeatedly
const PipelineCache = {
  transcriber: null,
  classifier: null
};

self.onmessage = async (event) => {
  const { action, payload, id } = event.data;
  
  try {
    if (action === 'transcribe') {
      const { audio } = payload; // Expected to be a Float32Array
      
      // Load transcriber
      if (!PipelineCache.transcriber) {
        self.postMessage({ id, status: 'progress', message: 'Downloading Whisper AI model... (this happens once)' });
        PipelineCache.transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
          progress_callback: (prog) => {
            if (prog.status === 'progress') {
              self.postMessage({ id, status: 'progress', message: `Downloading model... ${Math.round(prog.progress)}%` });
            }
          }
        });
      }
      
      self.postMessage({ id, status: 'progress', message: 'Transcribing audio...' });
      
      const transcriber = PipelineCache.transcriber;
      const output = await transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: 'english',
        task: 'transcribe'
      });
      
      self.postMessage({ id, status: 'success', result: { text: output.text } });
      
    } else if (action === 'analyze') {
      const { text } = payload;
      
      // Load text classifier for sentiment
      if (!PipelineCache.classifier) {
        self.postMessage({ id, status: 'progress', message: 'Downloading Semantic Audit model... (this happens once)' });
        PipelineCache.classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
          progress_callback: (prog) => {
            if (prog.status === 'progress') {
              self.postMessage({ id, status: 'progress', message: `Downloading model... ${Math.round(prog.progress)}%` });
            }
          }
        });
      }
      
      self.postMessage({ id, status: 'progress', message: 'Analyzing semantics...' });
      const classifier = PipelineCache.classifier;
      
      // We only analyze the first 500 characters to keep it fast
      const shortText = text.substring(0, 500);
      const sentimentResult = await classifier(shortText);
      const sentiment = sentimentResult[0].label; // 'POSITIVE' or 'NEGATIVE'
      
      // Calculate a heuristic compliance score based on text length, formatting, and simple keywords
      let complianceScore = 65; // Base score
      const words = text.split(/\s+/).length;
      if (words > 50) complianceScore += 10;
      if (words > 200) complianceScore += 10;
      if (text.includes('CONFIDENTIAL') || text.includes('Confidential')) complianceScore += 5;
      if (text.includes('Policy') || text.includes('Procedure')) complianceScore += 5;
      if (sentiment === 'POSITIVE') complianceScore += 5;
      
      let readability = 'Intermediate';
      if (words < 50) readability = 'Simple';
      if (words > 300) readability = 'Advanced';
      
      const riskFlags = [];
      if (!text.includes('CONFIDENTIAL')) riskFlags.push('Missing Confidentiality Header');
      if (words < 20) riskFlags.push('Document lacks sufficient detail');
      if (sentiment === 'NEGATIVE') riskFlags.push('Tone appears negative or urgent');
      if (riskFlags.length === 0) riskFlags.push('None Detected');

      self.postMessage({ 
        id, 
        status: 'success', 
        result: {
          complianceScore: Math.min(100, complianceScore),
          riskFlags: riskFlags.slice(0, 3),
          readability,
          sentiment: sentiment === 'POSITIVE' ? 'Positive/Constructive' : 'Urgent/Critical'
        }
      });
    }
  } catch (error) {
    self.postMessage({ id, status: 'error', error: error.message });
  }
};
