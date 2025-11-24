'use client';

import { useState, useRef, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
axios.defaults.withCredentials = true;
// import Matter from 'matter-js';
import { motion } from "motion/react";

const URL_CONFIG = {
  url: 'http://localhost:8080'
};

export default function Home() {
  // const [input, setInput] = useState('');
  // const [disable, setDisable] = useState(false);
  // const [loading, setLoading] = useState(false);
  // const [progress, setProgress] = useState(0);
  // const [loadingMessage, setLoadingMessage] = useState('');
  const finalInterval = useRef<number | undefined>(undefined);

  // const inputRef = useRef<HTMLInputElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
     
  const nextRef = useRef<HTMLDivElement>(null);
  // preset messages for milestones

  // update loadingMessage based on progress
  // useEffect(() => {

  //   const milestones = [
  //     { pct: 10, msg: 'Warming up engines…' },
  //     { pct: 30, msg: 'Verifying inputs…' },
  //     { pct: 50, msg: 'Building response…' },
  //     { pct: 70, msg: 'Fetching history…' },
  //     { pct: 85, msg: 'Applying narrative…' },
  //   ];
  //   const finalMessages = [
  //     'Almost there…', 'Putting on finishing touches…', 'Wrapping up…', 'One sec more…'
  //   ];
    
  //   if (!loading) return;
  //   clearInterval(finalInterval.current);

  //   if (progress < 100) {
  //     const { msg } = milestones.find(m => progress <= m.pct) || milestones[milestones.length - 1];
  //     setLoadingMessage(msg);
  //   } else {
  //     // cycle final messages every 2s
  //     setLoadingMessage(finalMessages[0]);
  //     finalInterval.current = window.setInterval(() => {
  //       setLoadingMessage(
  //         finalMessages[Math.floor(Math.random() * finalMessages.length)]
  //       );
  //     }, 5000);
  //   }
  // }, [progress, loading]);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.pageYOffset;
      if (bgRef.current) {
        // move at half scroll speed
        bgRef.current.style.transform = `translateY(${offset * 0.5}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // cleanup interval on unmount
  useEffect(() => () => clearInterval(finalInterval.current), []);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        await axios.get(`${URL_CONFIG.url}/user/verify`, { withCredentials: true });
      } catch (error: unknown) {
        // Narrow the unknown error safely
        if (axios.isAxiosError(error)) {
          const axiosErr = error as AxiosError;
          if (axiosErr.response?.status === 403) {
            window.location.href = "/queue";
          } else if (axiosErr.response?.status === 401) {
            window.location.href = `${URL_CONFIG.url}/auth0/login`;
            return;
          } else {
            console.error("Verification error:", axiosErr);
          }
        } else if (error instanceof Error) {
          // Non-Axios standard Error
          console.error("Unexpected error:", error.message);
        } else {
          // Fallback for anything else
          console.error("Unknown error:", error);
        }
      }
    };

    verifyUser();
  }, []);

  // capture global key presses
  // useEffect(() => {
  //   const handleGlobalKey = (e: KeyboardEvent) => {
  //     if (disable || loading || e.ctrlKey || e.metaKey || e.altKey) return;
  //     if (e.key.length === 1) {
  //       e.preventDefault();
  //       inputRef.current?.focus();
  //       setInput(prev => prev + e.key);
  //     }
  //   };
  //   window.addEventListener('keydown', handleGlobalKey);
  //   return () => window.removeEventListener('keydown', handleGlobalKey);
  // }, [disable, loading]);

  // Matter.js setup
  // useEffect(() => {
  //   const container = sceneRef.current;
  //   if (!container) return;

  //   let width = window.innerWidth;
  //   let height = window.innerHeight;

  //   const engine = Matter.Engine.create();
  //   engine.world.gravity.scale = 0;

  //   const render = Matter.Render.create({
  //     element: container,
  //     engine,
  //     options: {
  //       width,
  //       height,
  //       wireframes: false,
  //       background: 'transparent',
  //     },
  //   });

  //   const canvas = render.canvas;
  //   canvas.style.position = 'absolute';
  //   canvas.style.top = '0';
  //   canvas.style.left = '0';
  //   canvas.style.zIndex = '-1'; // ensure canvas is behind other elements

  //   let walls = createWalls(width, height);
  //   Matter.World.add(engine.world, walls);

  //   const textures = ['/customEmote/awkward.png', '/customEmote/angy.png', '/customEmote/dumdum.png', '/customEmote/elegant.png', '/customEmote/lost_in_space.png', '/customEmote/murderous_intent.png', '/customEmote/patted.png', '/customEmote/sniff.png', '/customEmote/sus.png'];

  //   const emotes = Array.from({ length: 150 }).map(() => {
  //         const paddingX = width / 3;      // one-third left and right as buffer
  //         const paddingY = height / 3;     // one-third top and bottom as buffer
        
  //         let x, y;
  //         while (true) {
  //           x = Math.random() * width;
  //           y = Math.random() * height;
        
  //           // Skip if in the "big middle hole" (center third vertically, full width)
  //           const inMiddleX = x > paddingX / 2 && x < (width - paddingX/3); // wider hole
  //           const inMiddleY = y > paddingY / 2 && y < (height - paddingY/4); // taller hole
        
  //           if (!(inMiddleX && inMiddleY)) break;
  //         }
        
  //         const texture = textures[Math.floor(Math.random() * textures.length)];
        
  //         return Matter.Bodies.circle(x, y, 15, {
  //           restitution: 0.8,
  //           render: {
  //             sprite: { texture, xScale: 0.3, yScale: 0.3 },
  //           },
  //         });
  //       }); 
      
  //   Matter.World.add(engine.world, emotes);

  //   const mouse = Matter.Mouse.create(canvas);
  //   const mouseConstraint = Matter.MouseConstraint.create(engine, {
  //     mouse,
  //     constraint: { stiffness: 1, render: { visible: false } },
  //   });
  //   Matter.World.add(engine.world, mouseConstraint);

  //   Matter.Events.on(engine, 'beforeUpdate', () => {
  //     emotes.forEach(body => {
  //       if (mouseConstraint.body === body) return;
  //       const dx = body.position.x - mouse.position.x;
  //       const dy = body.position.y - mouse.position.y;
  //       const distSq = dx * dx + dy * dy;
  //       if (distSq < 200 * 200) {
  //         Matter.Body.applyForce(body, body.position, { x: dx * 0.0001, y: dy * 0.0001 });
  //       }
  //     });
  //   });

  //   const runner = Matter.Runner.create();
  //   Matter.Runner.run(runner, engine);
  //   Matter.Render.run(render);

  //   const handleResize = () => {
  //     width = window.innerWidth;
  //     height = window.innerHeight;
  //     render.canvas.width = width;
  //     render.canvas.height = height;
  //     Matter.World.remove(engine.world, walls);
  //     walls = createWalls(width, height);
  //     Matter.World.add(engine.world, walls);
  //   };
  //   window.addEventListener('resize', handleResize);

  //   return () => {
  //     Matter.Render.stop(render);
  //     Matter.Runner.stop(runner);
  //     Matter.Engine.clear(engine);
  //     canvas.remove();
  //     render.textures = {};
  //     window.removeEventListener('resize', handleResize);
  //   };

  //   function createWalls(w: number, h: number) {
  //     const offset = 50;
  //     return [
  //       Matter.Bodies.rectangle(w / 2, h + offset, w + 2 * offset, 50, { isStatic: true }),
  //       Matter.Bodies.rectangle(w / 2, -offset, w + 2 * offset, 50, { isStatic: true }),
  //       Matter.Bodies.rectangle(-offset, h / 2, 50, h + 2 * offset, { isStatic: true }),
  //       Matter.Bodies.rectangle(w + offset, h / 2, 50, h + 2 * offset, { isStatic: true }),
  //     ];
  //   }
  // }, []);

  // const handleSubmit = async () => {
  //   if (!input.trim()) return;
  //   console.log('→ handleSubmit start, input:', input);
  //   setLoading(true);
  //   setProgress(10);
  
  //   try {
  //     const axiosOpts = { timeout: 60000 };
  
  //     // 1️⃣ Guardrail validation
  //     console.log('→ Step 1: calling /agent/guardrailInput');
  //     const guardRes = await axios.post<{ guardrail: string }>(
  //       `${URL_CONFIG.url}/agent/guardrailInput`,
  //       { input },
  //       { ...axiosOpts, timeout: 15000, withCredentials: true  },
  //     );
  //     console.log('← /agent/guardrailInput response:', guardRes.data);
  //     setProgress(30);
  //     if (guardRes.data.guardrail === 'fail') {
  //       console.log('‼ Guardrail failed, disabling input');
  //       setDisable(true);
  //       setInput('');
  //       setLoading(false);
  //       return;
  //     }
  
  //     // 2️⃣ Retrieve _one_ thread ID
  //     console.log('→ Step 2: calling GET /assistant/thread/retrieve');
  //     const prevRes = await axios.get<{ threadID: string }>(
  //       `${URL_CONFIG.url}/assistant/thread/retrieve`,
  //       { ...axiosOpts, timeout: 15000, withCredentials: true }
  //     );
  //     console.log('← GET /assistant/thread/retrieve response:', prevRes.data);
  //     setProgress(50);
  //     const prevId = prevRes.data.threadID;
  //     console.log('→ Prev threadID:', prevId);
  
  //     // Update the previous thread
  //     console.log('→ Step 2b: calling POST /assistant/thread/update', { prevId });
  //     const updatePrevRes = await axios.post(
  //       `${URL_CONFIG.url}/assistant/thread/update`,
  //       { threadID: prevId, readJSON: JSON.stringify({ threadID: prevId }), withCredentials: true  },
  //       axiosOpts
  //     );
  //     console.log('← POST /assistant/thread/update response:', updatePrevRes.data);
  
  //     // 3️⃣ Create narrative for PREVIOUS thread
  //     console.log('→ Step 3: calling POST /agent/narrative', { prevId });
  //     const narrRes = await axios.post(
  //       `${URL_CONFIG.url}/agent/narrative`,
  //       { threadID: prevId, withCredentials: true  },
  //       axiosOpts
  //     );
  //     console.log('← POST /agent/narrative response:', narrRes.data);
  //     setProgress(70);
  
  //     // 4️⃣ Vector‐store housekeeping
  //     console.log('→ Step 4: calling POST /vector/files/list');
  //     const listRes = await axios.post<{ files: { id: string }[] }>(
  //       `${URL_CONFIG.url}/vector/files/list`,
  //       { withCredentials: true },
  //       axiosOpts
  //     );
  //     console.log('← POST /vector/files/list response:', listRes.data);
  //     setProgress(75);
  
  //     console.log('→ Deleting files:', listRes.data.files.map(f => f.id));
  //     await Promise.all(
  //       listRes.data.files.map(f =>
  //         axios.post(
  //           `${URL_CONFIG.url}/files/delete`,
  //           { fileID: f.id },
  //           axiosOpts
  //         )
  //       )
  //     );
  //     console.log('← All vector files deleted');
  //     setProgress(80);
  
  //     // Integrity‐check uploads & attaches
  //     console.log('→ Step 4b: uploading profile.json');
  //     const up1 = await axios.post(
  //       `${URL_CONFIG.url}/files/upload`,
  //       { filePath: '/temp/profile.json', withCredentials: true  },
  //       axiosOpts
  //     );
  //     console.log('← profile.json upload response:', up1.data);
  
  //     console.log('→ uploading threadID.json');
  //     const up2 = await axios.post(
  //       `${URL_CONFIG.url}/files/upload`,
  //       { filePath: '/temp/threadID.json', withCredentials: true  },
  //       axiosOpts
  //     );
  //     // console.log('← threadID.json upload response:', up2.data);
  
  //     // console.log('→ attaching profile.json to vector');
  //     await axios.post(
  //       `${URL_CONFIG.url}/vector/files/attach`,
  //       { fileID: up1.data.result.id, withCredentials: true },
  //       axiosOpts
  //     );
  //     // console.log('← profile.json attached');
  
  //     setProgress(85);
  
  //     // console.log('→ attaching threadID.json to vector');
  //     await axios.post(
  //       `${URL_CONFIG.url}/vector/files/attach`,
  //       { fileID: up2.data.result.id, withCredentials: true },
  //       axiosOpts
  //     );
  //     // console.log('← threadID.json attached');
  //     setProgress(90);
  
  //     // 5️⃣ Create NEW assistant thread
  //     // console.log('→ Step 5: calling POST /assistant/run/create');
  //     const createRes = await axios.post(
  //       `${URL_CONFIG.url}/assistant/run/create`,
  //       { input, withCredentials: true  },
  //       axiosOpts
  //     );
  //     // console.log('← POST /assistant/run/create response:', createRes.data);
  //     setProgress(95);
  //     const newID = createRes.data.thread.thread_id;
  //     // console.log('→ New threadID:', newID);
  
  //     // console.log('→ updating new thread');
  //     const updateNewRes = await axios.post(
  //       `${URL_CONFIG.url}/assistant/thread/update`,
  //       { threadID: newID, readJSON: JSON.stringify({ threadID: newID }), withCredentials: true },
  //       axiosOpts
  //     );
  //     // console.log('← POST /assistant/thread/update response:', updateNewRes.data);
  //     setProgress(98);
  
  //     // ✅ Done — redirect
  //     // console.log('✅ All steps complete, redirecting to /chat');
  //     setProgress(100);
  //     setTimeout(() => {
  //       window.location.href = '/chat';
  //     }, 3000);
  
  //   } catch (err) {
  //     console.error('handleSubmit error:', err);
  //     setLoading(false);
  //   }
  // };
  
  

  // const restore = () => (window.location.href = '/chat');

  // inside your React page component
  const handleLogout = () => {
    // direct browser nav so the 302 from express-openid-connect will clear the cookie
    window.location.href = `${URL_CONFIG.url}/auth0/logout`;
  };

  // Questionaire check

  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);

  const [obAgeRange, setObAgeRange] = useState('');
  const [obPlace, setObPlace] = useState('');
  const [obSource, setObSource] = useState('');

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const res = await axios.get(`${URL_CONFIG.url}/user/onboarding`, {
          withCredentials: true
        });

        // If backend returns null or undefined → onboarding required
        const answers = res.data?.answers;
        setNeedsOnboarding(!answers);
        setLoadingOnboarding(false);
      } catch (err) {
        console.error("onboarding check error:", err);
        setLoadingOnboarding(false);
      }
    };

    checkOnboarding();
  }, []);

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obAgeRange || !obPlace || !obSource) return;

    try {
      await axios.post(
        `${URL_CONFIG.url}/user/onboarding`,
        {
          ageRange: obAgeRange,
          place: obPlace,
          source: obSource
        },
        { withCredentials: true }
      );

      setNeedsOnboarding(false);   // 🎉 hide onboarding
    } catch (err) {
      console.error('onboarding submit error:', err);
    }
  };

  return (
    <div className="relative">
      <div className="relative overflow-hidden">
        {!loadingOnboarding && needsOnboarding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <form
              onSubmit={handleOnboardingSubmit}
              className="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl text-neutral-900"
            >
              <h2 className="text-xl font-semibold mb-4">
                Before we continue…
              </h2>
              <p className="text-sm text-neutral-700 mb-4">
                Just <b>three quick questions</b> so we know who’s using DANTE.
              </p>

              {/* 1) Age range */}
              <label className="block mb-3 text-sm">
                <span className="mb-1 inline-block font-medium">
                  1. Age range
                </span>
                <select
                  value={obAgeRange}
                  onChange={(e) => setObAgeRange(e.target.value)}
                  className="w-full p-2 rounded bg-neutral-100 border border-neutral-300"
                  required
                >
                  <option value="">Select…</option>
                  <option value="lt_18">Lower than 18</option>
                  <option value="18_22">18–22</option>
                  <option value="23_29">23–29</option>
                  <option value="30_59">30–59</option>
                  <option value="60_plus">60+</option>
                </select>
              </label>

              {/* 2) Place */}
              <label className="block mb-3 text-sm">
                <span className="mb-1 inline-block font-medium">
                  2. Place of study / work
                </span>
                <select
                  value={obPlace}
                  onChange={(e) => setObPlace(e.target.value)}
                  className="w-full p-2 rounded bg-neutral-100 border border-neutral-300"
                  required
                >
                  <option value="">Select…</option>
                  <option value="chulalongkorn">Chulalongkorn University</option>
                  <option value="other_university">Other universities</option>
                  <option value="employed">Employed</option>
                </select>
              </label>

              {/* 3) How have you heard of us */}
              <label className="block mb-5 text-sm">
                <span className="mb-1 inline-block font-medium">
                  3. How have you heard of us?
                </span>
                <select
                  value={obSource}
                  onChange={(e) => setObSource(e.target.value)}
                  className="w-full p-2 rounded bg-neutral-100 border border-neutral-300"
                  required
                >
                  <option value="">Select…</option>
                  <option value="social_media">Social media</option>
                  <option value="friends">Friends</option>
                  <option value="acquaintances">Acquaintances</option>
                  <option value="articles">Articles</option>
                  <option value="others">Others</option>
                </select>
              </label>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
              >
                Start using DANTE →
              </button>
            </form>
          </div>
        )}
        {/* Parallax Background Layer */}
        <div ref={bgRef} className="absolute top-0 left-0 w-full h-[150vh] bg-[url('/dante_wallpaper.png')] bg-cover bg-fixed bg-no-repeat z-0" style={{ transform: 'translateY(0px)' }} />
        {/* Main Content with transparency & z-index */}
        <div className="relative flex place-content-center items-center justify-center min-h-screen min-w-screen bg-amber-50/80 z-10">
        {/* Black overlay */}
        {/* <div
          className={`fixed inset-0 z-40 bg-black ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-500`}/> */}
        {/* Loading UI */}
        {/* {loading && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white">
            <div className="mb-4 text-lg animate-bounce">
              {loadingMessage}
            </div>
            <div className="w-3/4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-2 bg-white animate-pulse transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )} */}

        {/* Violation modal */}
        {/* {disable && (
          <div className="absolute inset-0 z-70 flex items-center justify-center bg-white/50 transition-opacity">
            <div className="bg-red-500 p-4 rounded-sm shadow-sm">
              <p className="text-neutral-800">
                You have violated the usage policy. Contact administrator if you think this is a mistake.
              </p>
            </div>
          </div>
        )} */}

        {/* Matter.js scene */}
        <div ref={sceneRef} className="hidden absolute inset-0 z-0 md:block" />

        {/* NavBar */}
        {/* <div className="absolute top-0 w-screen h-24 bg-amber-50/50 z-0 place-content-center">
          <nav className="flex width-max height-max place-content-center">
            <span className="cursor-pointer px-6">
              <p className="text-sm text-neutral-800 font-regular hover:underline">About us</p>
            </span>
            <span className="cursor-pointer px-6">
              <p className="text-sm text-neutral-800 font-regular hover:underline">About us</p>
            </span>
            <span className="cursor-pointer px-6">
              <p className="text-sm text-neutral-800 font-regular hover:underline">About us</p>
            </span>
          </nav>
        </div> */}

        {/* Main input UI */}
        {/* <div className="p-8 z-20 rounded-2xl w-3/4 text-center">
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="text-4xl text-neutral-800 font-semibold mb-1"
            >
              This is DANTE speaking!
            </motion.h1>
          </div>
          <div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              disabled={disable || loading}
              className="bg-amber-50/50 z-20 w-3/4 h-24 px-8 py-2 border border-amber-300 rounded-2xl mb-4 placeholder:text-neutral-600 text-neutral-800 font-light outline-none disabled:opacity-50 transition-all duration-300"
              placeholder="Ask away!"
            />
            <span onClick={restore} className="z-20 text-neutral-800 text-sm font-light mt-2 block hover:underline cursor-pointer">
              Continue with previous chat.
            </span>
            <span onClick={handleLogout} className="z-20 text-red-500 text-sm mt-2 block hover:underline cursor-pointer">
              Logout
            </span>
          </div>
        </div> */}
        <div className="flex flex-col p-8 z-20 w-3/4 text-center">
          <div className="mb-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="text-8xl text-neutral-800 font-semibold mb-8"
            >
              This is DANTE speaking!
            </motion.h1>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="text-lg text-neutral-800 font-regular mb-8"
            >
              <i>&ldquo;Overwhelming moments can lowkey strike as fast as lightning, so your way to release and vent should be just as fast.&rdquo;</i>
            </motion.h3>
          </div>
          <div className="flex gap-x-8 place-content-center">
            <motion.button
              onClick={() => {
                if (nextRef.current) {
                  window.scrollTo({
                    top: nextRef.current.offsetTop,
                    behavior: "smooth",
                  });
                }
              }}
              initial={{ opacity: 1, y: 0 }}
              whileHover={{ opacity: 1, y: -4, scale: 1.2, backgroundColor: "#ffbd33" }}
              transition={{ type: "spring", stiffness: 500 }}
              className="text-md text-light text-neutral-800 bg-amber-300 py-2 px-8 rounded-full"
            >
              about me? :3
            </motion.button>
            <motion.button
              onClick={() => {
                if (nextRef.current) {
                  window.location.href = "/tarot";
                }
              }}
              initial={{ opacity: 1, y: 0 }}
              whileHover={{ opacity: 1, y: -4, scale: 1.2, backgroundColor: "#ffbd33" }}
              transition={{ type: "spring", stiffness: 500 }}
              className="text-md text-light text-neutral-800 bg-amber-300 py-2 px-8 rounded-full"
            >
              read tarot with me!
            </motion.button>
          </div>
          <div className="mt-6">
            <span onClick={handleLogout} className="z-20 text-red-500 text-sm mt-2 block hover:underline cursor-pointer">
              Logout
            </span>
          </div>
        </div>
        </div>
        <div ref={nextRef} className="relative flex place-content-center items-center justify-center min-h-screen min-w-screen bg-amber-300/95">
          <div className="flex w-3/4 px-32 place-content-between gap-x-24">
            <span className="place-content-center align-center">
              <h1 className="text-9xl text-neutral-800 font-bold">
                DANTE
              </h1>
              <p className="text-xl font-light text-neutral-800 mb-4">
                <i>[dan-tae]</i> (n.) - an AI-companion tailored with user preferences to vibe with you, understand you, support you, relate to you, or just sit there and listen AT ANY TIME.
              </p>
              <br />
              <p className="text-md font-light text-neutral-800 mb-4 italic">
                &ldquo;Life today can feel like too much. There are always things to do, choices to make, and distractions that never stop. Therefore, DANTE is here to help you understand yourself better, cope with the challenges you face, and grow together with you.&rdquo;
              </p>
              <p className="text-md font-light text-neutral-800 mb-4 italic">
                &quot;But how are we <b>different</b> than other solutions? Stay tuned, I guess :3&quot;
              </p>
            </span>
          </div>
        </div>
        <div className="relative flex place-content-center items-center justify-center w-full py-24 bg-neutral-950 z-0">
          <div className="flex w-screen px-64 place-content-center">
            {/* <span className="w-1/2 place-content-center align-center">
              <h1 className="text-9xl text-neutral-800 font-bold">
                DANTE
              </h1>
            </span> */}
            <span className="flex flex-col w-1/2 place-content-center align-center text-center gap-y-4">
              <p className="text-sm font-light text-neutral-200">
                contact my mentor <a href="https://www.instagram.com/tony.tts_" className="hover:italic cursor-pointer"><u>here!</u></a>
              </p>
              <p className="font-extralight text-xs">All rights reserved to DANTE © (2025)</p>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}