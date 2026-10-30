import { useEffect, useRef } from 'react';

/**
 * Multi-layer Cinematic Animated Background
 * - Layer 1: Deep Emerald Atmosphere with ambient floating light spots
 * - Layer 2: Hundreds of glowing particles with Mint & Metallic Gold hues
 * - Layer 3: Flowing harmonic light energy waves
 * - Layer 4: Geometric rotating orbital rings
 * - Layer 5: Cursor-reactive ambient field
 */
export default function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse tracking for subtle ambient parallax & repulsion
    const mouse = {
      x: width * 0.7,
      y: height * 0.45,
      targetX: width * 0.7,
      targetY: height * 0.45,
      radius: 200,
    };

    // Color palette constants
    const PARTICLE_COLORS = [
      { r: 167, g: 243, b: 208, glow: '#A7F3D0' }, // Mint
      { r: 209, g: 250, b: 229, glow: '#D1FAE5' }, // Soft Mint
      { r: 52, g: 211, b: 153, glow: '#34D399' },  // Emerald
      { r: 212, g: 175, b: 55, glow: '#D4AF37' },  // Metallic Gold
      { r: 245, g: 217, b: 142, glow: '#F5D98E' }, // Champagne Gold
    ];

    // Particle settings
    const particleCount = Math.min(Math.floor((width * height) / 10000), 120);
    const connectionDistance = 120;

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = initial ? Math.random() * width : Math.random() < 0.5 ? -10 : width + 10;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = (Math.random() - 0.5) * 0.45;
        this.radius = Math.random() * 1.8 + 0.6;
        const colorObj = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
        this.r = colorObj.r;
        this.g = colorObj.g;
        this.b = colorObj.b;
        this.glow = colorObj.glow;
        this.baseAlpha = Math.random() * 0.55 + 0.15;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }

      update(time) {
        this.x += this.vx;
        this.y += this.vy;

        // Pulse alpha
        this.currentAlpha = this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.15;

        // Wrap around screen edges
        if (this.x < -20) this.x = width + 20;
        if (this.x > width + 20) this.x = -20;
        if (this.y < -20) this.y = height + 20;
        if (this.y > height + 20) this.y = -20;

        // Subtle mouse interaction
        if (!prefersReducedMotion && mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            this.x -= Math.cos(angle) * force * 1.5;
            this.y -= Math.sin(angle) * force * 1.5;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${Math.max(0.05, this.currentAlpha)})`;
        if (this.radius > 1.4) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = this.glow;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const particles = Array.from({ length: particleCount }, () => new Particle());

    // Event listeners
    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = width * 0.7;
      mouse.targetY = height * 0.45;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    let startTime = performance.now();

    const render = (now) => {
      const time = (now - startTime) * 0.001;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // LAYER 1: Deep Dark Emerald Atmosphere (#020B08 Base with slow moving radial glows)
      // 1A. Deep base fill
      ctx.fillStyle = '#020B08';
      ctx.fillRect(0, 0, width, height);

      // 1B. Ambient Moving Radial Glow Spots
      const spot1X = width * 0.3 + Math.sin(time * 0.4) * 80;
      const spot1Y = height * 0.35 + Math.cos(time * 0.35) * 60;
      const grad1 = ctx.createRadialGradient(spot1X, spot1Y, 10, spot1X, spot1Y, width * 0.45);
      grad1.addColorStop(0, 'rgba(6, 78, 59, 0.22)'); // Deep Emerald
      grad1.addColorStop(0.5, 'rgba(2, 44, 34, 0.12)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const spot2X = width * 0.75 + Math.cos(time * 0.3) * 70;
      const spot2Y = height * 0.4 + Math.sin(time * 0.4) * 50;
      const grad2 = ctx.createRadialGradient(spot2X, spot2Y, 10, spot2X, spot2Y, width * 0.38);
      grad2.addColorStop(0, 'rgba(212, 175, 55, 0.10)'); // Metallic Gold shimmer
      grad2.addColorStop(0.4, 'rgba(11, 61, 46, 0.16)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // LAYER 3: Animated Harmonic Light Waves (Flowing curves across canvas)
      if (!prefersReducedMotion) {
        ctx.save();
        ctx.lineWidth = 1.2;

        // Wave 1: Mint Energy Wave
        ctx.beginPath();
        const wave1Y = height * 0.55;
        for (let x = 0; x <= width; x += 15) {
          const y = wave1Y + Math.sin(x * 0.0025 + time * 0.6) * 45 + Math.cos(x * 0.001 - time * 0.4) * 25;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(167, 243, 208, 0.07)';
        ctx.stroke();

        // Wave 2: Subtle Gold Energy Wave
        ctx.beginPath();
        const wave2Y = height * 0.65;
        for (let x = 0; x <= width; x += 15) {
          const y = wave2Y + Math.cos(x * 0.002 + time * 0.5) * 35 + Math.sin(x * 0.0015 + time * 0.3) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
        ctx.stroke();
        ctx.restore();
      }

      // LAYER 4: Rotating Geometric Orbital Rings (Centered behind Hero Visual)
      const ringCenterX = width > 1024 ? width * 0.72 : width * 0.5;
      const ringCenterY = height > 700 ? height * 0.48 : height * 0.42;

      ctx.save();
      ctx.lineWidth = 1;
      // Ring 1: Clockwise rotation
      ctx.beginPath();
      ctx.setLineDash([8, 14]);
      ctx.arc(ringCenterX, ringCenterY, 210, time * 0.15, time * 0.15 + Math.PI * 2);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.12)';
      ctx.stroke();

      // Ring 2: Counter-clockwise rotation with gold dash
      ctx.beginPath();
      ctx.setLineDash([4, 18]);
      ctx.arc(ringCenterX, ringCenterY, 320, -time * 0.1, -time * 0.1 + Math.PI * 2);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
      ctx.stroke();

      // Ring 3: Large faint outer ring
      ctx.beginPath();
      ctx.setLineDash([12, 24]);
      ctx.arc(ringCenterX, ringCenterY, 440, time * 0.05, time * 0.05 + Math.PI * 2);
      ctx.strokeStyle = 'rgba(167, 243, 208, 0.04)';
      ctx.stroke();
      ctx.restore();

      // LAYER 2: Floating Particles & Constellation Web
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(time);
        particles[i].draw();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: '#020B08' }}
    />
  );
}
