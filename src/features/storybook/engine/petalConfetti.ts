/**
 * Paper-petal confetti on a canvas: a burst flies out from a point, petals
 * flutter (flip + spin), drag slows them and gravity pulls them down off the
 * screen. The loop only runs while petals are alive.
 */
interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  flip: number;
  flipSpeed: number;
  sway: number;
  color: string;
  life: number;
}

const GRAVITY = 320; // px/s², light: these are paper petals
const DRAG = 2.2; // 1/s
const MAX_LIFE = 3.2; // s

export interface PetalConfetti {
  burst(x: number, y: number, count: number): void;
  destroy(): void;
}

export function createPetalConfetti(canvas: HTMLCanvasElement, colors: string[]): PetalConfetti {
  const ctx = canvas.getContext('2d');
  let petals: Petal[] = [];
  let frame = 0;
  let last = 0;
  let width = 0;
  let height = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (p: Petal) => {
    if (!ctx) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.scale(1, Math.cos(p.flip)); // the petal turning over in the air
    ctx.globalAlpha = Math.min(1, (MAX_LIFE - p.life) / 0.5);
    ctx.fillStyle = p.color;
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.6, 0, s);
    ctx.bezierCurveTo(-s * 0.7, s * 0.6, -s * 0.9, -s * 0.6, 0, -s);
    ctx.fill();
    // a soft crease down the middle reads as folded paper
    ctx.strokeStyle = 'rgba(120, 10, 20, 0.22)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.8);
    ctx.lineTo(0, s * 0.8);
    ctx.stroke();
    ctx.restore();
  };

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    ctx?.clearRect(0, 0, width, height);
    petals = petals.filter((p) => {
      p.life += dt;
      const drag = Math.exp(-DRAG * dt);
      p.vx *= drag;
      p.vy = p.vy * drag + GRAVITY * dt;
      p.x += (p.vx + Math.sin(p.life * 3 + p.sway) * 30) * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      p.flip += p.flipSpeed * dt;
      draw(p);
      return p.life < MAX_LIFE && p.y < height + 40;
    });
    frame = petals.length ? requestAnimationFrame(tick) : 0;
    if (!frame) ctx?.clearRect(0, 0, width, height);
  };

  return {
    burst(x, y, count) {
      if (!ctx) return;
      resize();
      for (let i = 0; i < count; i++) {
        // mostly upwards, like a popper
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
        const speed = 380 + Math.random() * 520;
        petals.push({
          x,
          y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          size: 5 + Math.random() * 7,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 8,
          flip: Math.random() * Math.PI,
          flipSpeed: 4 + Math.random() * 8,
          sway: Math.random() * Math.PI * 2,
          color: colors[i % colors.length],
          life: 0,
        });
      }
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    },
    destroy() {
      cancelAnimationFrame(frame);
      frame = 0;
      petals = [];
    },
  };
}
