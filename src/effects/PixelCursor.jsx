
import { useEffect, useRef } from "react";
import "./PixelCursor.css";

function PixelCursor() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrame;
    let lastX = 0;
    let lastY = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    let lightX = -1000;
    let lightY = -1000;
    let particles = [];

    const colors = [
      "#00eaff",
      "#00eaff",
      "#398cff",
      "#ff00d4",
      "#ff00d4",
      "#ff4de1",
      "#ff4de1",
    ];

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createParticle = (x, y, burst = false) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = burst
        ? 2 + Math.random() * 6
        : 0.5 + Math.random() * 1.5;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: burst ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
        life: burst ? 1 : 0.7,
        decay: burst ? 0.018 : 0.035,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    const handlePointerMove = (event) => {
      const x = event.clientX;
      const y = event.clientY;

      mouseX = x;
      mouseY = y;

      const distance = Math.hypot(x - lastX, y - lastY);

      if (distance > 5) {
        createParticle(x, y);
        lastX = x;
        lastY = y;
      }
    };

    const handlePointerDown = (event) => {
      if (event.button !== 0) return;

      for (let i = 0; i < 24; i++) {
        createParticle(event.clientX, event.clientY, true);
      }
    };

    const drawCursorGlow = () => {
      lightX += (mouseX - lightX) * 0.18;
      lightY += (mouseY - lightY) * 0.18;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // Cyan outer glow
      const cyanGlow = ctx.createRadialGradient(
        lightX, lightY, 0,
        lightX, lightY, 110
      );

      cyanGlow.addColorStop(0, "rgba(0, 234, 255, 0.22)");
      cyanGlow.addColorStop(0.4, "rgba(0, 234, 255, 0.10)");
      cyanGlow.addColorStop(1, "rgba(0, 234, 255, 0)");

      ctx.fillStyle = cyanGlow;
      ctx.beginPath();
      ctx.arc(lightX, lightY, 110, 0, Math.PI * 2);
      ctx.fill();

      // Pink inner glow
      const pinkGlow = ctx.createRadialGradient(
        lightX, lightY, 0,
        lightX, lightY, 65
      );

      pinkGlow.addColorStop(0, "rgba(255, 0, 212, 0.16)");
      pinkGlow.addColorStop(0.5, "rgba(255, 0, 212, 0.07)");
      pinkGlow.addColorStop(1, "rgba(255, 0, 212, 0)");

      ctx.fillStyle = pinkGlow;
      ctx.beginPath();
      ctx.arc(lightX, lightY, 65, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      drawCursorGlow();

      particles = particles.filter((particle) => particle.life > 0);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.96;
        particle.vy *= 0.96;
        particle.life -= particle.decay;

        ctx.globalAlpha = Math.max(0, particle.life);
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 12;

        ctx.fillRect(
          particle.x,
          particle.y,
          particle.size,
          particle.size
        );
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animationFrame = requestAnimationFrame(animate);
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return <canvas ref={canvasRef} className="pixel-cursor-canvas" />;
}

export default PixelCursor;
