export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const playPCM = (
  pcmData: Uint8Array,
  audioContext: AudioContext,
  sampleRate: number = 24000
): AudioBufferSourceNode => {
  const numChannels = 1;
  // Gemini TTS/Audio usually returns 16-bit PCM
  const dataInt16 = new Int16Array(pcmData.buffer);
  const frameCount = dataInt16.length / numChannels;

  const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Convert Int16 to Float32 [-1.0, 1.0]
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
  return source;
};

const initAudio = (audioContextRef: React.RefObject<AudioContext | null>) => {
  if (!audioContextRef.current) {
    const AudioContextClass =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
  }
  if (audioContextRef.current.state === "suspended")
    audioContextRef.current.resume();
  return audioContextRef.current;
};

export const playTickSound = ({
  audioContextRef,
  audioEnabled,
}: {
  audioEnabled: boolean;
  audioContextRef: React.RefObject<AudioContext | null>;
}) => {
  if (!audioEnabled) return;
  const ctx = initAudio(audioContextRef);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);

  playChaosAscending(ctx);
};

const playChaosAscending = (ctx: AudioContext) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.8);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.8);
};

export const stopAudio = (
  audioSourceRef: React.RefObject<AudioBufferSourceNode | null>
) => {
  if (audioSourceRef.current) {
    try {
      audioSourceRef.current.stop();
    } catch {
      // ignore
    }
    audioSourceRef.current = null;
  }
};

export const playAudio = ({
  audioContextRef,
  audioEnabled,
  base64Data,
  audioSourceRef,
}: {
  base64Data: string;
  audioEnabled: boolean;
  audioContextRef: React.RefObject<AudioContext | null>;
  audioSourceRef: React.RefObject<AudioBufferSourceNode | null>;
}) => {
  if (!audioEnabled) return;
  const ctx = initAudio(audioContextRef);
  stopAudio(audioSourceRef);

  // Strip data URI scheme if present
  const base64String = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;

  const pcmData = base64ToUint8Array(base64String);
  audioSourceRef.current = playPCM(pcmData, ctx);
};
