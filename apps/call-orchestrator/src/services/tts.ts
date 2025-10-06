import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

const polly = new PollyClient({});

const MULAW_BIAS = 0x84;
const MULAW_CLIP = 32635;
const EXPONENT_LUT = [
    0, 0, 1, 1,
    2, 2, 3, 3,
    4, 4, 5, 5,
    6, 6, 7, 7,
];

function pcmSampleToMulaw(sample: number): number {
    let sign = 0;
    if (sample < 0) {
        sign = 0x80;
        sample = -sample;
    }
    if (sample > MULAW_CLIP) sample = MULAW_CLIP;
    sample += MULAW_BIAS;

    const exponent = EXPONENT_LUT[(sample >> 7) & 0x0F];
    const mantissa = (sample >> (exponent + 3)) & 0x0F;
    return ~(sign | (exponent << 4) | mantissa) & 0xFF;
}

function pcm16ToMulaw(pcm: Buffer): Buffer {
    const samples = pcm.length >> 1;
    const out = Buffer.alloc(samples);
    for (let i = 0; i < samples; i++) {
        const s = pcm.readInt16LE(i * 2);
        out[i] = pcmSampleToMulaw(s);
    }
    return out;
}

export async function synthesize(
    text: string,
    _opts: { format: 'mulaw'; sampleRate: 8000; voice?: string }
): Promise<Buffer> {
    const cmd = new SynthesizeSpeechCommand({
        Engine: 'neural',
        VoiceId: (_opts.voice ?? 'Amy') as any,        // e.g. "Amy", "Emma", "Brian"
        OutputFormat: 'pcm',
        SampleRate: '8000',
        Text: text
    });

    const { AudioStream } = await polly.send(cmd);
    if (!AudioStream) return Buffer.alloc(0);

    // AudioStream is a Readable or Uint8Array depending on runtime; normalize to Buffer
    if (AudioStream instanceof Uint8Array) {
        if (_opts.format === 'mulaw') return pcm16ToMulaw(Buffer.from(AudioStream));
        return Buffer.from(AudioStream);
    }
    const chunks: Buffer[] = [];
    for await (const c of AudioStream as any) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    const pcm = Buffer.concat(chunks);
    return _opts.format === 'mulaw' ? pcm16ToMulaw(pcm) : pcm;
}
