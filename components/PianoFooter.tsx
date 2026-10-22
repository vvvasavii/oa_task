'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import './PianoFooter.css';

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = [
  { after: 0, semitone: 1, name: 'C♯' },
  { after: 1, semitone: 3, name: 'D♯' },
  { after: 3, semitone: 6, name: 'F♯' },
  { after: 4, semitone: 8, name: 'G♯' },
  { after: 5, semitone: 10, name: 'A♯' },
  { after: 7, semitone: 13, name: 'C♯' },
  { after: 8, semitone: 15, name: 'D♯' },
  { after: 10, semitone: 18, name: 'F♯' },
  { after: 11, semitone: 20, name: 'G♯' },
  { after: 12, semitone: 22, name: 'A♯' },
];

const WHITE_KEYBOARD: Record<string, number> = {
  a: 60, s: 62, d: 64, f: 65, g: 67, h: 69, j: 71,
  k: 72, l: 74, ';': 76, "'": 77, z: 79, x: 81, c: 83,
};
const BLACK_KEYBOARD: Record<string, number> = {
  w: 61, e: 63, t: 66, y: 68, u: 70,
  o: 73, p: 75, '[': 78, ']': 80, v: 82,
};

type Voice = { oscillators: OscillatorNode[]; gain: GainNode };

export default function PianoFooter() {
  const audioRef = useRef<AudioContext | null>(null);
  const voicesRef = useRef(new Map<number, Voice>());
  const pressedKeysRef = useRef(new Set<string>());

  function startNote(note: number) {
    if (voicesRef.current.has(note)) return;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = audioRef.current ?? new AudioContextClass();
    audioRef.current = context;
    void context.resume();

    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    const now = context.currentTime;
    const frequency = 440 * Math.pow(2, (note - 69) / 12);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(5200, now);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.24, now + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.055, now + 0.45);
    filter.connect(envelope);
    envelope.connect(context.destination);

    const fundamental = context.createOscillator();
    const overtone = context.createOscillator();
    const overtoneGain = context.createGain();
    fundamental.type = 'triangle';
    overtone.type = 'sine';
    fundamental.frequency.setValueAtTime(frequency, now);
    overtone.frequency.setValueAtTime(frequency * 2, now);
    overtoneGain.gain.setValueAtTime(0.18, now);
    fundamental.connect(filter);
    overtone.connect(overtoneGain);
    overtoneGain.connect(filter);
    fundamental.start(now);
    overtone.start(now);
    voicesRef.current.set(note, { oscillators: [fundamental, overtone], gain: envelope });
  }

  function stopNote(note: number) {
    const voice = voicesRef.current.get(note);
    const context = audioRef.current;
    if (!voice || !context) return;
    const now = context.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0.0001, now, 0.075);
    voice.oscillators.forEach((oscillator) => oscillator.stop(now + 0.32));
    voicesRef.current.delete(note);
  }

  function keyboardDown(event: KeyboardEvent<HTMLElement>) {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    const note = WHITE_KEYBOARD[key] ?? BLACK_KEYBOARD[key];
    if (note === undefined) return;
    event.preventDefault();
    pressedKeysRef.current.add(key);
    startNote(note);
  }

  function keyboardUp(event: KeyboardEvent<HTMLElement>) {
    const key = event.key.toLowerCase();
    const note = WHITE_KEYBOARD[key] ?? BLACK_KEYBOARD[key];
    if (note === undefined) return;
    pressedKeysRef.current.delete(key);
    stopNote(note);
  }

  useEffect(() => () => {
    voicesRef.current.forEach((voice) => {
      voice.oscillators.forEach((oscillator) => {
        try { oscillator.stop(); } catch { /* The note may already be ending. */ }
      });
    });
    void audioRef.current?.close();
  }, []);

  return (
    <section
      className="piano-footer"
      aria-label="Interactive piano"
      tabIndex={0}
      onKeyDown={keyboardDown}
      onKeyUp={keyboardUp}
      onBlur={() => {
        pressedKeysRef.current.forEach((key) => stopNote(WHITE_KEYBOARD[key] ?? BLACK_KEYBOARD[key]));
        pressedKeysRef.current.clear();
      }}
    >
      <div className="piano-name">Aryan</div>
      <nav className="piano-links" aria-label="Footer links">
        <span>TERMS</span>
        <span>PRIVACY</span>
        <a href="mailto:aryan@ogxstudio.in">ARYAN@OGXSTUDIO.IN</a>
      </nav>
      <div className="piano-invite">
        <span>GO ON—PLINK THE KEYS</span>
        <span className="piano-icon" aria-hidden="true">▦</span>
      </div>
      <div className="piano-keys" aria-label="Two octave piano keyboard">
        <div className="piano-white-keys">
          {WHITE_NOTES.map((name, index) => {
            const note = 60 + [0, 2, 4, 5, 7, 9, 11][index % 7] + Math.floor(index / 7) * 12;
            return (
              <button
                className="piano-white-key"
                type="button"
                key={`white-${index}`}
                aria-label={`${name}${4 + Math.floor(index / 7)}`}
                onPointerDown={(event) => { event.preventDefault(); startNote(note); event.currentTarget.setPointerCapture(event.pointerId); }}
                onPointerUp={() => stopNote(note)}
                onPointerCancel={() => stopNote(note)}
                onClick={(event) => {
                  if (event.detail === 0) { startNote(note); window.setTimeout(() => stopNote(note), 280); }
                }}
              >
                <span>{name}</span>
              </button>
            );
          })}
        </div>
        <div className="piano-black-keys">
          {BLACK_KEYS.map(({ after, semitone, name }, index) => {
            const note = 60 + semitone;
            return (
              <button
                className="piano-black-key"
                type="button"
                key={`black-${index}`}
                style={{ left: `${((after + 1) / WHITE_NOTES.length) * 100}%` }}
                aria-label={`${name}${4 + Math.floor(semitone / 12)}`}
                onPointerDown={(event) => { event.preventDefault(); startNote(note); event.currentTarget.setPointerCapture(event.pointerId); }}
                onPointerUp={() => stopNote(note)}
                onPointerCancel={() => stopNote(note)}
                onClick={(event) => {
                  if (event.detail === 0) { startNote(note); window.setTimeout(() => stopNote(note), 280); }
                }}
              />
            );
          })}
        </div>
      </div>
      <p className="piano-hint">CLICK OR TAP A KEY · USE A–L AND W–P ON YOUR KEYBOARD</p>
    </section>
  );
}
