import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

const dg = createClient(process.env.DEEPGRAM_API_KEY!);

export type LiveSTT = {
  feed: (mulawBuf: Buffer) => void;
  stop: () => Promise<void>;
  onPartial?: (t: string) => void;
  onFinal?: (t: string) => void;
  ready: Promise<void>;
};

export function startLiveSTT(): LiveSTT {
  const live = dg.listen.live({
    model: 'nova-2-phonecall',
    encoding: 'mulaw' as any,
    sample_rate: 8000 as any,
    interim_results: true,
    smart_format: true,
    endpointing: 500 as any,
  });

  const stt: LiveSTT = {
    feed: (_: Buffer) => { },
    stop: async () => { try { await live.finish(); } catch { } },
    onPartial: undefined,
    onFinal: undefined,
    ready: new Promise<void>((resolve, reject) => {
      live.on(LiveTranscriptionEvents.Open, () => resolve());
      live.on(LiveTranscriptionEvents.Error, (e: any) => reject(e));
    }),
  };

  live.on(LiveTranscriptionEvents.Transcript, (data: any) => {
    const alts = data?.channel?.alternatives;
    if (!alts || !alts[0]) return;
    const text = (alts[0].transcript || '').trim();
    if (!text) return;
    const isFinal = Boolean(data?.is_final ?? data?.speech_final ?? data?.metadata?.is_final);
    if (isFinal) stt.onFinal?.(text);
    else stt.onPartial?.(text);
  });

  // Convert Node Buffer -> ArrayBuffer or Uint8Array before send
  stt.ready.then(() => {
    stt.feed = (mulawBuf: Buffer) => {
      try {
        // Option A: ArrayBuffer slice (safe for offset/length)
        const ab = mulawBuf.buffer.slice(
          mulawBuf.byteOffset,
          mulawBuf.byteOffset + mulawBuf.byteLength
        );
        live.send(ab); // type: ArrayBuffer

        // Option B: Uint8Array (either works)
        // live.send(new Uint8Array(mulawBuf)); // type: Uint8Array
      } catch {
        /* ignore backpressure / closed socket */
      }
    };
  });

  return stt;
}
