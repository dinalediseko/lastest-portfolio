import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import "./App.css";

const HEART_PATH =
  "M170 284C148 246 45 177 45 99C45 50 81 24 120 24C143 24 160 35 170 51C180 35 197 24 220 24C259 24 295 50 295 99C295 177 192 246 170 284Z";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const drawingRef = useRef(false);
  const scratchReadyRef = useRef(false);
  const songStartedRef = useRef(false);

  const [revealed, setRevealed] = useState(false);
  const [showCalendarButton, setShowCalendarButton] = useState(false);

  const heartPixelCountRef = useRef(0);
  const heartMaskRef = useRef<Uint8Array | null>(null);

  const buildHeartPath = (width: number, height: number) => {
    const scaleX = width / 340;
    const scaleY = height / 320;

    const path = new Path2D();
    path.moveTo(170 * scaleX, 284 * scaleY);
    path.bezierCurveTo(
      148 * scaleX,
      246 * scaleY,
      45 * scaleX,
      177 * scaleY,
      45 * scaleX,
      99 * scaleY,
    );
    path.bezierCurveTo(
      45 * scaleX,
      50 * scaleY,
      81 * scaleX,
      24 * scaleY,
      120 * scaleX,
      24 * scaleY,
    );
    path.bezierCurveTo(
      143 * scaleX,
      24 * scaleY,
      160 * scaleX,
      35 * scaleY,
      170 * scaleX,
      51 * scaleY,
    );
    path.bezierCurveTo(
      180 * scaleX,
      35 * scaleY,
      197 * scaleX,
      24 * scaleY,
      220 * scaleX,
      24 * scaleY,
    );
    path.bezierCurveTo(
      259 * scaleX,
      24 * scaleY,
      295 * scaleX,
      50 * scaleY,
      295 * scaleX,
      99 * scaleY,
    );
    path.bezierCurveTo(
      295 * scaleX,
      177 * scaleY,
      192 * scaleX,
      246 * scaleY,
      170 * scaleX,
      284 * scaleY,
    );
    path.closePath();

    return path;
  };

  const createGlitterTile = () => {
    const tile = document.createElement("canvas");
    tile.width = 96;
    tile.height = 96;

    const tctx = tile.getContext("2d");
    if (!tctx) return tile;

    tctx.fillStyle = "#D4AF37";
    tctx.fillRect(0, 0, tile.width, tile.height);

    const dots = 1500;
    const colors = ["#FFF7CC", "#F3D36B", "#C9971E", "#FFFDF0", "#B57E10"];

    for (let i = 0; i < dots; i++) {
      const x = Math.random() * tile.width;
      const y = Math.random() * tile.height;
      const r = Math.random() * 1.6 + 0.35;

      tctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      tctx.beginPath();
      tctx.arc(x, y, r, 0, Math.PI * 2);
      tctx.fill();
    }

    const stars = 18;
    for (let i = 0; i < stars; i++) {
      const x = Math.random() * tile.width;
      const y = Math.random() * tile.height;
      const s = Math.random() * 2 + 1.5;

      tctx.fillStyle = Math.random() > 0.5 ? "#FFFBE6" : "#F6E08E";
      tctx.beginPath();
      tctx.moveTo(x, y - s);
      tctx.lineTo(x + s * 0.35, y - s * 0.35);
      tctx.lineTo(x + s, y);
      tctx.lineTo(x + s * 0.35, y + s * 0.35);
      tctx.lineTo(x, y + s);
      tctx.lineTo(x - s * 0.35, y + s * 0.35);
      tctx.lineTo(x - s, y);
      tctx.lineTo(x - s * 0.35, y - s * 0.35);
      tctx.closePath();
      tctx.fill();
    }

    return tile;
  };

  const buildHeartMask = (width: number, height: number) => {
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;

    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    const heartPath = buildHeartPath(width, height);
    maskCtx.fillStyle = "#000";
    maskCtx.fill(heartPath);

    const data = maskCtx.getImageData(0, 0, width, height).data;
    const mask = new Uint8Array(width * height);

    let count = 0;
    for (let i = 0; i < width * height; i++) {
      const alpha = data[i * 4 + 3];
      if (alpha > 0) {
        mask[i] = 1;
        count++;
      }
    }

    heartMaskRef.current = mask;
    heartPixelCountRef.current = count;
  };

  const drawScratchLayer = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ) => {
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    const heartPath = buildHeartPath(width, height);
    const glitterTile = createGlitterTile();

    buildHeartMask(width, height);

    ctx.save();
    ctx.clip(heartPath);

    const pattern = ctx.createPattern(glitterTile, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();

    scratchReadyRef.current = true;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();

      // Use CSS pixel dimensions directly for reliability on touch devices.
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);

      scratchReadyRef.current = false;
      drawScratchLayer(ctx, canvas);
    };

    setup();
    window.addEventListener("resize", setup);
    return () => window.removeEventListener("resize", setup);
  }, [revealed]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startSongOnFirstScratch = async () => {
    if (songStartedRef.current) return;

    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.currentTime = 0;
      audio.volume = 1;
      await audio.play();
      songStartedRef.current = true;
    } catch (error) {
      console.error("Audio play was blocked or failed:", error);
    }
  };

  const scratch = (x: number, y: number) => {
    if (!scratchReadyRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const heartPath = buildHeartPath(canvas.width, canvas.height);

    ctx.save();
    ctx.clip(heartPath);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    checkReveal();
  };

  const checkReveal = () => {
    if (!scratchReadyRef.current) return;
    if (revealed) return;

    const canvas = canvasRef.current;
    const mask = heartMaskRef.current;
    const totalHeartPixels = heartPixelCountRef.current;

    if (!canvas || !mask || totalHeartPixels === 0) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height).data;

    let clearedHeartPixels = 0;

    for (let i = 0; i < width * height; i++) {
      if (mask[i] === 1) {
        const alpha = imageData[i * 4 + 3];
        if (alpha < 35) {
          clearedHeartPixels++;
        }
      }
    }

    const percent = (clearedHeartPixels / totalHeartPixels) * 100;

    if (percent > 60) {
      setRevealed(true);
      fireConfetti();

      window.setTimeout(() => {
        setShowCalendarButton(true);
      }, 450);
    }
  };

  const fireConfetti = () => {
    const end = Date.now() + 3200;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 65,
        startVelocity: 30,
        origin: { x: 0, y: 0.55 },
      });

      confetti({
        particleCount: 4,
        angle: 120,
        spread: 65,
        startVelocity: 30,
        origin: { x: 1, y: 0.55 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const handlePointerDown = async (
    e: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (revealed || !scratchReadyRef.current) return;

    e.preventDefault();
    drawingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);

    await startSongOnFirstScratch();

    const { x, y } = getPoint(e);
    scratch(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || revealed) return;

    e.preventDefault();

    // FALLBACK: If the browser blocked the audio on the first tap, 
    // try again while they are actively scratching.
    if (!songStartedRef.current) {
      startSongOnFirstScratch();
    }

    const { x, y } = getPoint(e);
    scratch(x, y);
  };

  const handlePointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    if (e) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const escapeICS = (value: string) =>
    value
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const downloadICS = () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Didi & Naledi//Save the Date//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:dinalediseko-save-the-date-20300615",
      "DTSTART;VALUE=DATE:20300615",
      "DTEND;VALUE=DATE:20300616",
      `SUMMARY:${escapeICS("Dinalediseko Wedding")}`,
      `DESCRIPTION:${escapeICS("Save the date for our wedding.")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "didi-naledi-save-the-date.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <main className="app">
      <section className="invite-shell">
        <article className="invite-card">
          <audio
            ref={audioRef}
            preload="auto"
            playsInline
            src="/audio/reveal-song.mp3"
          />

          <header className="header">
            <h1 className="title deboss">Save the Date</h1>
          </header>

          <section className="scratch-section">
            <div className="heart-stage">
              <div className="heart-date-layer">
                <div className="date-block">
                  <span className="date-label">We’re getting married</span>
                  <span className="date-main">15 June</span>
                  <span className="date-year">2030</span>
                </div>
              </div>

              {!revealed && (
                <canvas
                  ref={canvasRef}
                  className="scratch-canvas"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />
              )}

              <svg
                viewBox="0 0 340 320"
                className="heart-svg"
                aria-hidden="true"
              >
                <path
                  d={HEART_PATH}
                  fill="none"
                  stroke="rgba(140,100,65,0.35)"
                  strokeWidth="2"
                  transform="translate(-0.6 -0.6)"
                />
                <path
                  d={HEART_PATH}
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="1.6"
                  transform="translate(0.6 0.6)"
                />
                <path
                  d={HEART_PATH}
                  fill="none"
                  stroke="#cdb598"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
          </section>

          <section className="names">
            <h2 className="deboss">Didi &amp; Naledi</h2>
          </section>

          <div className="action-area">
            {!revealed ? (
              <p className="helper">
                Scratch the golden heart to reveal the date
              </p>
            ) : showCalendarButton ? (
              <button
                className="calendar-btn calendar-btn-pop"
                onClick={downloadICS}
              >
                Add to Calendar
              </button>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  );
}
