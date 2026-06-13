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
      const { audio, mode } = payload; // Expected to be a Float32Array, mode can be 'speech' or 'music'
      
      // Load transcriber — whisper-base is multilingual (Swahili + English) and 3x more
      // accurate than whisper-tiny, especially for vocals in music.
      if (!PipelineCache.transcriber) {
        self.postMessage({ id, status: 'progress', message: 'Downloading Whisper AI model (~145 MB, one-time only)...' });
        PipelineCache.transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
          progress_callback: (prog) => {
            if (prog.status === 'progress') {
              self.postMessage({ id, status: 'progress', message: `Downloading model... ${Math.round(prog.progress)}%` });
            }
          }
        });
      }
      
      self.postMessage({ id, status: 'progress', message: `Transcribing audio in ${mode === 'music' ? 'Music/Lyric' : 'Speech'} mode...` });
      
      const transcriber = PipelineCache.transcriber;
      
      const generate_kwargs = {
        task: 'transcribe'
      };
      
      if (mode === 'music') {
        try {
          const promptText = "Here are the lyrics of the song: ";
          const prompt_ids = transcriber.tokenizer.encode(promptText, { add_special_tokens: false });
          generate_kwargs.prompt_ids = prompt_ids;
        } catch (e) {
          console.warn('[AI Worker] Failed to tokenize prompt, continuing without prompt_ids:', e);
        }
        generate_kwargs.no_speech_threshold = 0.25;  // very lenient with musical background VAD
        generate_kwargs.logprob_threshold = -1.2;    // allow lower logprobs for vocal extraction
        generate_kwargs.compression_ratio_threshold = 2.4;
      } else {
        generate_kwargs.no_speech_threshold = 0.55;
        generate_kwargs.logprob_threshold = -1.0;
      }
      
      const output = await transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        task: 'transcribe',
        return_timestamps: true,
        generate_kwargs
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
