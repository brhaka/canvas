import { Link } from "react-router-dom";
// import ShareButton from '@/components/share-button.jsx';
import { useEffect, useRef } from 'react';

export default function Home() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frame;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };

    // Initial resize
    resizeCanvas();

    // Add resize listener
    window.addEventListener('resize', resizeCanvas);

    // Helper function to generate truly unique colors
    const generateUniqueColors = (count) => {
      const goldenRatio = 0.618033988749895;
      const colors = [];
      let hue = Math.random();

      for (let i = 0; i < count; i++) {
        hue += goldenRatio;
        hue %= 1;

        // Convert to HSL color space
        const color = {
          hue: hue * 360,
          saturation: 70 + Math.random() * 20, // 70-90%
          lightness: 65 + Math.random() * 15,  // 65-80%
        };
        colors.push(color);
      }

      return colors;
    };

    // Create cursors with unique colors
    const uniqueColors = generateUniqueColors(1000);
    const cursors = Array.from({ length: 1000 }, (_, index) => {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        lastX: null,
        lastY: null,
        color: uniqueColors[index],
        angle: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2,
        changeDirection: () => {
          return Math.random() * 0.2 - 0.1;
        }
      };
    });

    const animate = () => {
      // Slower fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      cursors.forEach(cursor => {
        // Store last position before updating
        cursor.lastX = cursor.x;
        cursor.lastY = cursor.y;

        // Update position with bounds checking
        cursor.angle += cursor.changeDirection();

        let nextX = cursor.x + Math.cos(cursor.angle) * cursor.speed;
        let nextY = cursor.y + Math.sin(cursor.angle) * cursor.speed;

        // Bounce off edges
        if (nextX < 0 || nextX > canvas.width) {
          cursor.angle = Math.PI - cursor.angle;
          nextX = cursor.x;
        }
        if (nextY < 0 || nextY > canvas.height) {
          cursor.angle = -cursor.angle;
          nextY = cursor.y;
        }

        cursor.x = nextX;
        cursor.y = nextY;

        // Draw line from last position to current position
        if (cursor.lastX !== null) {
          ctx.beginPath();
          ctx.moveTo(cursor.lastX, cursor.lastY);
          ctx.lineTo(cursor.x, cursor.y);
          ctx.strokeStyle = `hsla(${cursor.color.hue}, ${cursor.color.saturation}%, ${cursor.color.lightness}%, 0.6)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw cursor
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${cursor.color.hue}, ${cursor.color.saturation}%, ${cursor.color.lightness}%)`;
        ctx.fill();

        // Optional: Draw connections between nearby cursors
        cursors.forEach(otherCursor => {
          const dx = cursor.x - otherCursor.x;
          const dy = cursor.y - otherCursor.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 60 && distance > 0) {
            ctx.beginPath();
            ctx.moveTo(cursor.x, cursor.y);
            ctx.lineTo(otherCursor.x, otherCursor.y);
            ctx.strokeStyle = `hsla(${cursor.color.hue}, ${cursor.color.saturation}%, ${cursor.color.lightness}%, 0.1)`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      frame = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row">
      {/* Left Section - White */}
      <div className="w-full md:w-1/2 bg-white flex items-center">
        <div className="w-full px-8 md:px-16 lg:px-24">
          <div className="space-y-4 mb-8">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Welcome to Canvas
            </h1>
            <p className="text-lg md:text-xl text-gray-500">
              Create art with friends & strangers in real-time.
            </p>
          </div>

          <div className="flex flex-row gap-4">
            <Link
              to="/login"
              className="w-full px-6 py-4 text-lg font-semibold rounded-lg bg-black text-white hover:bg-black/90 transition-colors text-center"
            >
              Login
            </Link>
            <Link
              to="/canvas"
              className="w-full px-6 py-4 text-lg font-semibold rounded-lg border border-black text-black hover:bg-black/5 transition-colors text-center"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Right Section - Black */}
      <div className="w-full md:w-1/2 bg-black h-[320px] md:h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}