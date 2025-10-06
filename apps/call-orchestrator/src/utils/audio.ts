// Convert 16-bit PCM (LE) mono 8k into μ-law 8k
export function linear16ToMulaw(pcm: Buffer): Buffer {
    const MULAW_MAX = 0x1FFF;
    const BIAS = 0x84;
    const out = Buffer.alloc(pcm.length / 2);
    for (let i = 0, j = 0; i < pcm.length; i += 2, j++) {
        // read int16 little-endian
        let sample = pcm.readInt16LE(i);
        let sign = (sample >> 8) & 0x80;
        if (sign !== 0) sample = -sample;
        if (sample > 32635) sample = 32635;

        sample = sample + BIAS;
        let exponent = 7;
        for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1) { }
        let mantissa = (sample >> ((exponent === 0) ? 4 : (exponent + 3))) & 0x0F;
        let mu = ~(sign | (exponent << 4) | mantissa) & 0xFF;
        out[j] = mu;
    }
    return out;
}
