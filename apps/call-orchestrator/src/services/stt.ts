// Placeholder interfaces. Swap in Deepgram/Google STT, Polly/ElevenLabs TTS.
export function startSTT() {
  let currentText = '';
  return {
    feed: (_pcm: Buffer) => {},
    finalizeTurn: () => (currentText ? { text: currentText } : null),
    setFinal: (t: string) => (currentText = t),
    resetTurn: () => (currentText = ''),
  };
}

export function startTTS() {
  return {
    pause: () => {},
    speakStream: async (text: string, onChunk: (pcm: Buffer) => void) => {
      // Replace with real TTS streaming; here we’d synthesize and chunk
      onChunk(Buffer.from([]));
    },
  };
}
