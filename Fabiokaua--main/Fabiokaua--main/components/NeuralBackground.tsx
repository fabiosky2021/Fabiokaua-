import React, { useRef, useEffect } from 'react';
import { AppStatus } from '../types';

interface NeuralBackgroundProps {
  isVisible: boolean;
  status: AppStatus;
  isSystemActive?: boolean;
}

export const NeuralBackground: React.FC<NeuralBackgroundProps> = ({ isVisible, status, isSystemActive = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width: number;
    let height: number;
    let particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000 };

    const isThinking = status === AppStatus.THINKING;
    const isError = status === AppStatus.ERROR;
    const isListening = status === AppStatus.LISTENING;

    const config = {
      particleCount: window.innerWidth < 768 ? 30 : 80,
      connectionDistance: isThinking ? 240 : (isListening ? 180 : 150),
      mouseDistance: 200,
      baseSpeed: isThinking ? 2.5 : (isListening ? 1.0 : (isSystemActive ? 0.2 : 0.5)),
      particleColor: isThinking ? '#00d2ff' : (isError ? '#ff3366' : '#00ffcc'),
      lineColor: isThinking ? '0, 210, 255' : (isError ? '255, 51, 102' : '0, 255, 204')
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      glitchX: number = 0;
      glitchY: number = 0;
      intensity: number = 1;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * config.baseSpeed;
        this.vy = (Math.random() - 0.5) * config.baseSpeed;
        this.size = Math.random() * 2 + 1;
        this.intensity = Math.random();
      }

      update() {
        // Speed scaling based on status
        const speedMultiplier = isThinking ? 3 : (isListening ? 1.5 : 1);
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;

        // Glitch Logic for ERROR status
        if (isError) {
          if (Math.random() > 0.94) {
            this.glitchX = (Math.random() - 0.5) * 25;
            this.glitchY = (Math.random() - 0.5) * 25;
          } else {
            this.glitchX *= 0.7;
            this.glitchY *= 0.7;
          }
        } else {
          this.glitchX = 0;
          this.glitchY = 0;
        }

        // Pulse logic for LISTENING
        if (isListening) {
          this.size = (Math.random() * 2 + 1) * (1 + Math.sin(Date.now() / 150) * 0.5);
        }

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.mouseDistance) {
          const force = (config.mouseDistance - distance) / config.mouseDistance;
          this.x -= (dx / distance) * force * 5;
          this.y -= (dy / distance) * force * 5;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        const drawX = this.x + this.glitchX;
        const drawY = this.y + this.glitchY;
        
        ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
        
        let alpha = isThinking ? 0.9 : (isListening ? 0.7 : (isSystemActive ? 0.2 : 0.5));
        // Add brightness pulse for thinking
        if (isThinking) alpha += Math.sin(Date.now() / 100) * 0.1;
        
        ctx.fillStyle = `${config.particleColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        // Glow effect for thinking
        if (isThinking) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = config.particleColor;
        } else {
          ctx.shadowBlur = 0;
        }
      }
    }

    const init = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < config.particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.fillStyle = '#010413';
      ctx.fillRect(0, 0, width, height);

      // Status dependent radial glow
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
      if (isError) {
        gradient.addColorStop(0, 'rgba(100, 0, 0, 0.4)');
      } else if (isThinking) {
        gradient.addColorStop(0, 'rgba(0, 100, 150, 0.3)');
      } else if (isListening) {
        gradient.addColorStop(0, 'rgba(0, 100, 80, 0.2)');
      } else {
        gradient.addColorStop(0, 'rgba(5, 10, 20, 0.1)');
      }
      gradient.addColorStop(1, '#010413');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p, i) => {
        p.update();
        p.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < config.connectionDistance) {
            ctx.beginPath();
            let opacity = (1 - dist / config.connectionDistance) * (isSystemActive ? 0.15 : 0.4);
            if (isThinking) opacity *= 2;
            if (isError) opacity *= 0.5;
            
            ctx.strokeStyle = `rgba(${config.lineColor}, ${opacity})`;
            ctx.lineWidth = isThinking ? 2 : 0.8;
            ctx.moveTo(p.x + p.glitchX, p.y + p.glitchY);
            ctx.lineTo(p2.x + p2.glitchX, p2.y + p2.glitchY);
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', init);
    window.addEventListener('mousemove', handleMouseMove);
    
    init();
    const animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', init);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [status, isSystemActive]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ touchAction: 'none' }}
    />
  );
};