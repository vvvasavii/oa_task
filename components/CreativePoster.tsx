'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Shuffle from './Shuffle';
import RippleGrid from './RippleGrid';
import './CreativePoster.css';

function WaveField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let pointerX = -1000;
    let pointerY = -1000;
    let animation = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const pointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;
    };
    const pointerLeave = () => {
      pointerX = -1000;
      pointerY = -1000;
    };

    const draw = () => {
      if (!context) return;
      frame += reducedMotion ? 0 : 0.008;
      context.clearRect(0, 0, width, height);
      context.strokeStyle = 'rgba(20, 13, 0, .78)';
      context.lineWidth = 1.1;
      const spacing = Math.max(8, Math.min(12, width / 150));
      for (let start = -spacing; start < width + spacing; start += spacing) {
        context.beginPath();
        for (let y = -12; y <= height + 12; y += 7) {
          const nx = start / width;
          const ny = y / height;
          const bend = Math.sin(ny * 7.6 + nx * 3.8 + frame) * 24
            + Math.sin(ny * 14 - nx * 5 + frame * 0.65) * 8
            + Math.sin(nx * 8 + frame * 0.4) * 9;
          const dx = start + bend;
          const distance = Math.hypot(dx - pointerX, y - pointerY);
          const influence = Math.max(0, 1 - distance / 175);
          const x = dx + (dx - pointerX) * influence * 0.48;
          if (y === -12) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
      if (!reducedMotion) animation = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerleave', pointerLeave);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerleave', pointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="wave-field" aria-hidden="true" />;
}

const tickerItems = [
  '/////////////////////',
  '06006060606006',
  '/////////////////////',
  '0060606606',
  '/////////////////////',
  '060660000600',
  '/////////////////////',
];

function Ticker({ reverse = false }: { reverse?: boolean }) {
  const [paused, setPaused] = useState(false);
  const items = reverse ? [...tickerItems].reverse() : tickerItems;

  return (
    <div className={`ticker ${reverse ? 'ticker-reverse' : ''} ${paused ? 'ticker-paused' : ''}`}>
      <button className="ticker-arrow" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Resume ticker' : 'Pause ticker'}>
        ◀
      </button>
      <div className="ticker-track" aria-label="Decorative scrolling ticker">
        {[...items, ...items].map((item, index) => (
          <span className="ticker-cell" key={`${index}-${item}`}>{item}</span>
        ))}
      </div>
      <button className="ticker-arrow" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Resume ticker' : 'Pause ticker'}>
        ▶
      </button>
    </div>
  );
}

export default function CreativePoster() {
  const [contactOpen, setContactOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactStatus, setContactStatus] = useState('');
  const [rockActive, setRockActive] = useState(false);

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setContactStatus('');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send your message.');
      setContactStatus(result.emailSent ? 'Thanks — your message is in. Check your inbox for a confirmation.' : 'Thanks — your message is saved. Email confirmation needs to be configured by the site owner.');
      form.reset();
    } catch (error) {
      setContactStatus(error instanceof Error ? error.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="portfolio-hero">
      <div className="hero-utility" aria-hidden="true">
        <span>OGX — CREATIVE TECHNOLOGY</span>
        <span>SCROLL TO EXPLORE&nbsp; ↓</span>
      </div>
      <section className="wave-stage" aria-label="Interactive flowing line artwork">
        <WaveField />
      </section>
      <Ticker />
      <section className="title-band" aria-label="Creative developer">
        <Shuffle
          text="CREATIVE"
          className="hero-title"
          tag="span"
          effect="slide"
          shuffleDirection="right"
          duration={0.35}
          animationMode="evenodd"
          shuffleTimes={1}
          ease="power3.out"
          stagger={0.03}
          triggerOnce={true}
          triggerOnHover={true}
          hoverRadius={18}
          motionBlur={false}
          respectReducedMotion={true}
          scrambleCharset="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        />
        <svg className="title-star" viewBox="0 0 100 100" aria-label="plus">
          <path d="M50 0 59 41 100 50 59 59 50 100 41 59 0 50 41 41Z" />
        </svg>
        <Shuffle
          text="DEVELOPER"
          className="hero-title"
          tag="span"
          effect="slide"
          shuffleDirection="right"
          duration={0.35}
          animationMode="evenodd"
          shuffleTimes={1}
          ease="power3.out"
          stagger={0.03}
          triggerOnce={true}
          triggerOnHover={true}
          hoverRadius={18}
          motionBlur={false}
          respectReducedMotion={true}
          scrambleCharset="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        />
      </section>
      <Ticker reverse />
      <section className="rock-stage" aria-label="Interactive ripple grid">
        <RippleGrid
          color="#ffffff"
          cellSize={48}
          rippleStrength={1}
          autoRipple="center"
          lightMode
          className="rock-grid"
        />
        <button
          className={`rock-orb${rockActive ? ' rock-orb-active' : ''}`}
          type="button"
          aria-label="Let's rock"
          onPointerEnter={() => setRockActive(true)}
          onMouseEnter={() => setRockActive(true)}
          onMouseLeave={() => setRockActive(false)}
          onFocus={() => setRockActive(true)}
          onBlur={() => setRockActive(false)}
          onClick={() => setRockActive(true)}
        >
          {rockActive ? (
            <span className="rock-words" aria-hidden="true">
              <Shuffle text="LET’S" className="rock-word" tag="span" effect="slide" duration={0.35} shuffleTimes={1} triggerOnce={true} scrambleCharset="ABCDEFGHIJKLMNOPQRSTUVWXYZ" />
              <Shuffle text="ROCK" className="rock-word" tag="span" effect="slide" duration={0.35} shuffleTimes={1} triggerOnce={true} scrambleCharset="ABCDEFGHIJKLMNOPQRSTUVWXYZ" />
              <span className="rock-email">ARYAN@OGXSTUDIO.IN</span>
            </span>
          ) : <span className="rock-go">GO</span>}
        </button>
      </section>
      <section className="after-fold">
        <p>DESIGNING DIGITAL EXPERIENCES&nbsp; · &nbsp;BUILDING FOR THE WEB</p>
        <button className="contact-trigger" onClick={() => setContactOpen(true)}>LET’S WORK TOGETHER ↗</button>
      </section>
      {contactOpen && (
        <div className="contact-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setContactOpen(false); }}>
          <section className="contact-panel" role="dialog" aria-modal="true" aria-labelledby="contact-title">
            <button className="contact-close" onClick={() => setContactOpen(false)} aria-label="Close contact form">×</button>
            <p className="contact-kicker">HAVE A PROJECT IN MIND?</p>
            <h2 id="contact-title">LET’S TALK.</h2>
            <form onSubmit={submitContact}>
              <label>Name<input name="name" autoComplete="name" required maxLength={100} /></label>
              <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
              <label>Message<textarea name="message" required rows={4} maxLength={4000} /></label>
              <button type="submit" disabled={sending}>{sending ? 'SENDING…' : 'SEND MESSAGE ↗'}</button>
            </form>
            {contactStatus && <p className="contact-status" role="status">{contactStatus}</p>}
          </section>
        </div>
      )}
    </main>
  );
}
