'use client';

import { useRef, useEffect } from 'react';
import axios from 'axios';
import Matter from 'matter-js';
import { motion } from "motion/react";

const URL_CONFIG = {
  url: process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'http://localhost:8080'
};

export default function Home() {

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await axios.get(`${URL_CONFIG.url}/user/verify`, { withCredentials: true });
        // console.log("User verification result:", res.data);
  
        if (res.status != 403) {
          // alert("Access denied: Awaiting admin approval.");
          window.location.href = "/"; // Or any fallback page
        }
      } catch (error) {
        console.error("Verification error:", error);
      }
    };
  
    verifyUser();
  }, []);  

  const sceneRef = useRef<HTMLDivElement>(null);

  // Matter.js setup
  useEffect(() => {
    const container = sceneRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const engine = Matter.Engine.create();
    engine.world.gravity.scale = 0;

    const render = Matter.Render.create({
      element: container,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
      },
    });

    const canvas = render.canvas;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1'; // ensure canvas is behind other elements

    let walls = createWalls(width, height);
    Matter.World.add(engine.world, walls);

    const textures = ['/customEmote/awkward.png', '/customEmote/angy.png', '/customEmote/dumdum.png', '/customEmote/elegant.png', '/customEmote/lost_in_space.png', '/customEmote/murderous_intent.png', '/customEmote/patted.png', '/customEmote/sniff.png', '/customEmote/sus.png'];

    const emotes = Array.from({ length: 150 }).map(() => {
      const paddingX = width / 3;      // one-third left and right as buffer
      const paddingY = height / 3;     // one-third top and bottom as buffer
    
      let x, y;
      while (true) {
        x = Math.random() * width;
        y = Math.random() * height;
    
        // Skip if in the "big middle hole" (center third vertically, full width)
        const inMiddleX = x > paddingX / 2 && x < (width - paddingX/3); // wider hole
        const inMiddleY = y > paddingY / 2 && y < (height - paddingY/4); // taller hole
    
        if (!(inMiddleX && inMiddleY)) break;
      }
    
      const texture = textures[Math.floor(Math.random() * textures.length)];
    
      return Matter.Bodies.circle(x, y, 15, {
        restitution: 0.8,
        render: {
          sprite: { texture, xScale: 0.3, yScale: 0.3 },
        },
      });
    });    
    
    Matter.World.add(engine.world, emotes);

    const mouse = Matter.Mouse.create(canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 1, render: { visible: false } },
    });
    Matter.World.add(engine.world, mouseConstraint);

    Matter.Events.on(engine, 'beforeUpdate', () => {
      emotes.forEach(body => {
        if (mouseConstraint.body === body) return;
        const dx = body.position.x - mouse.position.x;
        const dy = body.position.y - mouse.position.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 200 * 200) {
          Matter.Body.applyForce(body, body.position, { x: dx * 0.0001, y: dy * 0.0001 });
        }
      });
    });

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      render.canvas.width = width;
      render.canvas.height = height;
      Matter.World.remove(engine.world, walls);
      walls = createWalls(width, height);
      Matter.World.add(engine.world, walls);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      canvas.remove();
      render.textures = {};
      window.removeEventListener('resize', handleResize);
    };

    function createWalls(w: number, h: number) {
      const offset = 50;
      return [
        Matter.Bodies.rectangle(w / 2, h + offset, w + 2 * offset, 50, { isStatic: true }),
        Matter.Bodies.rectangle(w / 2, -offset, w + 2 * offset, 50, { isStatic: true }),
        Matter.Bodies.rectangle(-offset, h / 2, 50, h + 2 * offset, { isStatic: true }),
        Matter.Bodies.rectangle(w + offset, h / 2, 50, h + 2 * offset, { isStatic: true }),
      ];
    }
  }, []);

  // inside your React page component
  const handleLogout = () => {
    // direct browser nav so the 302 from express-openid-connect will clear the cookie
    window.location.href = `${URL_CONFIG.url}/auth0/logout`;
  };
    


  return (
    <div className="relative flex items-center justify-center min-h-screen min-w-screen bg-amber-50">

      {/* Matter.js scene */}
      <div ref={sceneRef} className="hidden absolute inset-0 z-0 md:block" />

      {/* Main input UI */}
      <div className="p-8 z-20 rounded-2xl w-3/4 text-center">
        <div className="mb-8">
          <p className="text-md text-neutral-800">
            Hey, you are a real one :3
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="text-7xl text-neutral-800 font-bold p-32"
          >
            Thanks for stopping by!
          </motion.h1>
          <span className="text-md text-neutral-800">
              <a href="https://www.instagram.com/tony.tts_" className="hover:underline cursor-pointer">Talk to my mentor for beta access, troubleshooting, or recommendations!</a>
          </span>
          
        </div>
        <div>
          <span
            onClick={handleLogout}
            className="z-20 text-red-500 text-sm mt-2 block hover:underline cursor-pointer"
          >
            Logout
          </span>

        </div>
      </div>
    </div>
  );
}