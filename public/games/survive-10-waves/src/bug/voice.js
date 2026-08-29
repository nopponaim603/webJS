import { CFG } from '../config/index.js';

export function voiceOf(type) {
  const V = CFG.bugVoice;
  const j = 1 + (Math.random() * 2 - 1) * V.jitter;
  return {
    rate: Math.pow(type.scale, V.pitchExp) * (type.voice || 1) * j,
    gainScale: Math.pow(type.scale, V.gainExp),
  };
}

export function jitterOnly() {
  return { rate: 1 + (Math.random() * 2 - 1) * CFG.bugVoice.jitter };
}
