
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  Github,
  Twitter,
  Mail,
  PenLine,
  ExternalLink,
  Code,
  Palette,
  Music,
  Cpu,
  Blocks,
  Network,
  Sun,
  Moon,
} from "lucide-react";
const plethoraImage = 'https://i.imgur.com/98sy6v4.png';

/**
 * DisintegrationCanvas — FULL-SCREEN, transparent, theme-synced.
 * - Background: transparent (lets your page gradient show through) + parallax stars + occasional shooting stars (always BEHIND text)
 * - Physics: hybrid attract/repel; re-accretion starts 1.2s after leaving letters, completes ~3.6s
 * - No sheens/torches; nothing that alters the page gradient
 */
function DisintegrationCanvas({ text = "Shango Bashi", isDark = true }) {
  const canvasRef = useRef(null);
  const heroId = "lettering-anchor";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    // Chrome/graphite dust + starfield levels for each theme
    const PALETTES = {
      dark: {
        dustMain: "#e3e7ed",
        dustHi: "#ffffff",
        dustLow: "#aeb7c4",
        starNear: 0.45,
        starFar: 0.18,
      },
      light: {
        dustMain: "#6b7280",
        dustHi: "#9ca3af",
        dustLow: "#a1a1aa",
        starNear: 0.12,
        starFar: 0.06,
      },
    };

    let W = 0,
      H = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // Track hero bounds (for clipping / positioning lettering)
    let heroRect = { x: 0, y: 0, width: 0, height: 0 };
    const readHeroRect = () => {
      const el = document.getElementById(heroId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      heroRect = { x: r.left, y: r.top, width: r.width, height: r.height };
    };

    // Offscreen mask for text sampling
    const off = document.createElement("canvas");
    const octx = off.getContext("2d", { willReadFrequently: true });
    const family = "Inter Black, Inter, Arial Black, system-ui, sans-serif";

    // Particles
    const GAP = 3; // balanced density
    const RADIUS = 78;
    const SPRING = 0.055; // ~3.6s collapse
    const FRICTION = 0.9;
    const BURST = 6.0;
    const ATTRACT = 0.07;
    const START_DELAY = 1200;

    let particles = []; // {x,y,ox,oy,vx,vy,a,r,c}
    let letterRects = [];
    let raf = 0;
    let lastInteract = 0;
    const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, v: 0 };

    // Background stars (BEHIND letters)
    let starsFar = [],
      starsNear = [],
      shooting = [];
    let shootTimer = null;

    function sizeToViewport() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      off.width = W;
      off.height = H;
      readHeroRect();
      initStars();
    }

    function initStars() {
      starsFar = Array.from({ length: isDark ? 160 : 100 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5,
      }));
      starsNear = Array.from({ length: isDark ? 80 : 40 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1.2 + Math.random() * 2.5,
      }));
      shooting = [];
      if (shootTimer) clearInterval(shootTimer);
      shootTimer = setInterval(() => {
        if (shooting.length < 3 && Math.random() < (isDark ? 0.4 : 0.15)) {
          shooting.push({
            x: Math.random() * W,
            y: -20,
            vx: -3 - Math.random() * 2,
            vy: 2 + Math.random() * 1.5,
            len: 80 + Math.random() * 40,
            life: 0,
          });
        }
      }, 4000);
    }

    function drawTextOffscreen() {
      if (W === 0 || H === 0) return;
      octx.clearRect(0, 0, W, H);
      if (!heroRect.width || !heroRect.height) readHeroRect();

      // Scale & position lettering inside hero bounds
      let size = Math.min(heroRect.width || W, heroRect.height || H) * 0.5;
      const setFont = (px) => (octx.font = `900 ${px}px ${family}`);
      setFont(size);
      const target = (heroRect.width || W) * 0.85;
      const measured = octx.measureText(text).width;
      if (measured > 0) size = size * (target / measured);
      size = Math.min(size, (heroRect.height || H) * 0.7);
      setFont(size);
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillStyle = "rgba(255,255,255,1)";
      const cx = (heroRect.x || 0) + (heroRect.width || W) / 2;
      const cy = (heroRect.y || 0) + (heroRect.height || H) / 2;
      octx.fillText(text, cx, cy);

      // Per-letter hover rects (for directional zones)
      letterRects = [];
      let x = cx - octx.measureText(text).width / 2;
      for (const ch of text) {
        const w = octx.measureText(ch).width || 1;
        letterRects.push({ x, y: cy, w, h: size * 1.05 });
        x += w;
      }
    }

    function buildParticles() {
      if (W === 0 || H === 0 || off.width === 0 || off.height === 0) return;
      particles = [];
      const data = octx.getImageData(0, 0, W, H).data;
      const pal = isDark ? PALETTES.dark : PALETTES.light;
      for (let y = 0; y < H; y += GAP) {
        for (let x = 0; x < W; x += GAP) {
          const a = data[(y * W + x) * 4 + 3];
          if (a > 8) {
            const r = Math.random();
            const c =
              r < 0.1 ? pal.dustHi : r < 0.7 ? pal.dustMain : pal.dustLow;
            particles.push({
              x,
              y,
              ox: x,
              oy: y,
              vx: 0,
              vy: 0,
              a: 1,
              r: 0.7 + Math.random() * 0.9,
              c,
            });
          }
        }
      }
    }

    function drawBackground(time) {
      // Transparent background — let your site gradient show through
      ctx.clearRect(0, 0, W, H);
      const pal = isDark ? PALETTES.dark : PALETTES.light;

      // Parallax stars
      ctx.globalAlpha = pal.starFar;
      starsFar.forEach((s) => {
        ctx.beginPath();
        ctx.arc(
          (s.x + ((time * 0.005) % W)) % W,
          (s.y + ((time * 0.003) % H)) % H,
          s.r,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      });
      ctx.globalAlpha = pal.starNear;
      starsNear.forEach((s) => {
        ctx.beginPath();
        ctx.arc(
          (s.x + ((time * 0.01) % W)) % W,
          (s.y + ((time * 0.006) % H)) % H,
          s.r,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      });

      // Shooting stars (always behind the lettering)
      ctx.globalAlpha = Math.max(pal.starNear, 0.12);
      ctx.lineWidth = 1.2;
      shooting.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * s.len, s.y - s.vy * s.len);
        ctx.stroke();
      });
      shooting = shooting.filter(
        (s) => s.x > -200 && s.y < H + 200 && s.life < 400,
      );
      ctx.globalAlpha = 1;
    }

    function animate(time) {
      drawBackground(time);

      // Clip particles to hero so lettering doesn't scroll with page
      ctx.save();
      ctx.beginPath();
      ctx.rect(heroRect.x, heroRect.y, heroRect.width, heroRect.height);
      ctx.clip();

      const overLetter = letterRects.some(
        (r) =>
          mouse.x >= r.x &&
          mouse.x <= r.x + r.w &&
          mouse.y >= r.y - r.h / 2 &&
          mouse.y <= r.y + r.h / 2,
      );
      const canReaccrete =
        !overLetter && performance.now() - lastInteract > START_DELAY;

      for (let p of particles) {
        const dx = p.x - mouse.x,
          dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < RADIUS * RADIUS) {
          const d = Math.max(1e-3, Math.sqrt(d2));
          const dirx = dx / d,
            diry = dy / d;
          if (mouse.v < 0.6) {
            // attract spiral
            p.vx -= dirx * ATTRACT * (1 - d / RADIUS);
            p.vy -= diry * ATTRACT * (1 - d / RADIUS);
            p.vx += -diry * 0.02;
            p.vy += dirx * 0.02;
          } else {
            // repel tail
            const force = (1 - d / RADIUS) * (BURST * 0.18);
            p.vx += dirx * force;
            p.vy += diry * force;
            p.a = Math.max(0.15, p.a - 0.02);
            lastInteract = performance.now();
          }
        }
        if (canReaccrete) {
          p.vx += (p.ox - p.x) * SPRING;
          p.vy += (p.oy - p.y) * SPRING;
          p.a = Math.min(1, p.a + 0.03);
        }
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;

        if (p.a > 0.02) {
          ctx.globalAlpha = p.a;
          ctx.fillStyle = p.c;
          ctx.fillRect(p.x, p.y, p.r, p.r);
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      raf = requestAnimationFrame(animate);
    }

    function rebuild() {
      drawTextOffscreen();
      buildParticles();
    }
    function init() {
      sizeToViewport();
      rebuild();
      cancelAnimationFrame(raf);
      animate(0);
    }

    function onMove(e) {
      const x = e.clientX,
        y = e.clientY;
      const dx = x - mouse.px,
        dy = y - mouse.py;
      mouse.v = Math.min(3, Math.sqrt(dx * dx + dy * dy) / 16);
      mouse.px = mouse.x = x;
      mouse.py = mouse.y = y;
      lastInteract = performance.now();
    }
    function onLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.v = 0;
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave, { passive: true });
    window.addEventListener("resize", init);

    // === FIX: keep lettering locked to its slot while scrolling (no rebuild jitter) ===
    const onScroll = () => {
      const el = document.getElementById(heroId);
      if (!el) return;

      const r = el.getBoundingClientRect();
      const dx = r.left - heroRect.x || 0;
      const dy = r.top - heroRect.y || 0;

      if (dx || dy) {
        // translate current particles and their home positions by the same delta
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += dx;
          p.y += dy;
          p.ox += dx;
          p.oy += dy;
        }
      }

      // if the slot resized (layout change), rebuild once
      const resized =
        Math.abs(r.width - heroRect.width) > 0.5 ||
        Math.abs(r.height - heroRect.height) > 0.5;

      heroRect = { x: r.left, y: r.top, width: r.width, height: r.height };

      if (resized) {
        drawTextOffscreen();
        buildParticles();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    init();

    return () => {
      if (shootTimer) clearInterval(shootTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", init);
      window.removeEventListener("scroll", onScroll);
    };
  }, [text, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-label={`${text} — disintegration canvas`}
    />
  );
}

export default function App() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const footerSheenRef = useRef(null);

  // --- THEME: Dark-only (Light mode disabled but kept for later) ---
  // Force dark mode on and keep the API shape stable.
  const [isDarkMode /*, setIsDarkMode*/] = useState(true);

  // Disabled: reading from localStorage / system preference
  /*
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    } else {
      setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);
  */

  // Disabled: toggling between themes
  /*
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };
  */

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting,
          }));
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll("[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!footerSheenRef.current) return;

    const sheen = footerSheenRef.current;
    const timeline = gsap.timeline({
      repeat: -1,
      repeatDelay: 1.5,
      defaults: { ease: "sine.inOut" },
    });

    gsap.set(sheen, {
      xPercent: -120,
      opacity: 0,
      scaleY: 1.15,
      transformOrigin: "center",
    });

    timeline
      .to(sheen, { opacity: 0.85, duration: 0.7 })
      .to(sheen, { xPercent: 120, duration: 3 }, "<")
      .to(sheen, { opacity: 0, duration: 0.9 }, "-=0.6");

    return () => timeline.kill();
  }, []);

  const projects = [
    {
      title: "BlueSwarm",
      description:
        "Multi-agent orchestration system coordinating 60+ specialized agents for planning and autonomous code.",
      image:
        "https://ik.imagekit.io/ljjuz5epq/ChatGPT%20Image%20Nov%203,%202025,%2007_21_41%20PM.png?updatedAt=1762194382903",
      tech: ["Python", "LangChain", "OpenAI", "Multi-Agent Systems"],
      github: "https://github.com/shangobashi/bs_v.0.1.1",
      ctaUrl: "https://github.com/shangobashi/bs_v.0.1.1",
      ctaLabel: "In production... Sneak peek",
    },
    {
      title: "Kingsley",
      description:
        "RAG system with source-aware output schemas for citation transparency and legal research accuracy.",
      image:
        "https://ucarecdn.com/9bccf43c-d141-4a5f-b5e0-de470d819bf5/-/format/auto/",
      tech: ["React", "TypeScript", "OpenAI", "HuggingFace", "Tailwind CSS"],
      github: "https://github.com/shangobashi/lexia_designPhase_github",
      ctaUrl: null,
    },
    {
      title: "Plethora",
      description:
        "Plethora - Real-time Rug Risk for Memecoins. A high-performance SaaS that scores token rug risk in under two seconds with wallet-authenticated access (Solana), a credit-based usage system, and transparent risk factors. Powered by a proprietary fine-tuned LLM. Phase 2 adds \"Meme Historian\" lore context to enrich trading decisions.",
      image:
        plethoraImage,
      tech: ["TypeScript", "React", "Node.js", "PostgreSQL", "Vercel"],
      github: "https://github.com/shangobashi",
      ctaUrl: null,
    },
    {
      title: "Shango.GBA",
      description:
        "Retro interaction engine built with Kaplay.js featuring custom physics and hardware-mimicry animations.",
      image: "https://i.imgur.com/RRGnxGh.png",
      tech: ["HTML", "CSS", "JavaScript", "Kaplay.js", "Vite", "Vercel"],
      github: "",
      ctaUrl: "https://gba.shangobashi.com",
    },
  ];

  const skills = [
    { icon: Code, label: "Full-Stack Engineering" },
    { icon: Cpu, label: "AI & Agentic Systems" },
    { icon: Blocks, label: "Data Engineering" },
    { icon: Network, label: "Blockchain Technology Enthusiast" },
    { icon: Palette, label: "UI/UX Design" },
    { icon: Music, label: "Sound Engineering" },
  ];

  const credentials = [
    "Codecademy - Data Engineer Career Path (2025)",
    "Codecademy - Computer Science Career Path (2025)",
    "Codecademy - Full-Stack Engineer Career Path (2025)",
    "Codecademy - Back-End Engineer Career Path (2025)",
    "Codecademy - Front-End Engineer Career Path (2025)",
    "Codecademy - UX Designer Career Path (2025)",
    "Codecademy - Web Development Skill Path (2025)"
  ];

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        // Forced dark palette
        isDarkMode
          ? "bg-gradient-to-br from-black via-black to-indigo-950 text-white"
          : "bg-white text-gray-900"
      }`}
    >
      {/* Full-screen, transparent canvas synced with theme */}
      <DisintegrationCanvas text="Shango Bashi" isDark={true} />

      {/* Theme toggle - disabled (kept for later) */}
      {/*
      <button
        onClick={toggleDarkMode}
        className={`fixed top-8 right-8 z-50 p-3 rounded-full transition-all duration-300 ${
          isDarkMode
            ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      */}

      {/* Wrap all content ABOVE the canvas */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section
          id="hero-anchor"
          data-hero
          className="relative min-h-screen flex items-center justify-center px-6"
        >
          <div className="max-w-6xl mx-auto w-full text-center">
            {/* Profile Image (restored) */}
            <div className="mb-12 max-w-5xl mx-auto">
              <img
                src="https://ucarecdn.com/4b71734a-311b-41ce-be1c-07a22b5daa57/-/format/auto/"
                alt="Shango Bashi"
                className="w-full h-72 md:h-80 object-cover object-[50%_30%] rounded-2xl shadow-xl"
              />
            </div>

            {/* Particle lettering lives in this exact slot (below the photo) */}
            <div id="lettering-anchor" className="h-40 md:h-48 lg:h-56" />

            {/* Keep an accessible name for SEO/screen readers but don’t visually render it */}
            <h1 className="sr-only">Shango Bashi</h1>

            <p className="text-lg md:text-xl mb-12 font-medium leading-relaxed text-gray-300">
              Full-Stack Engineer crafting the future through AI, Data, and Creative Technology
            </p>

            {/* Social Links */}
            <div className="flex justify-center space-x-6">
              {[
                { href: "https://github.com/shangobashi", icon: Github },       
                { href: "https://twitter.com/shangobashi", icon: Twitter },     
                { href: "mailto:shangobashi@gmail.com", icon: Mail },
                { href: "https://blog.shangobashi.com", icon: PenLine },
              ].map(({ href, icon: Icon }, index) => (
                <a
                  key={index}
                  href={href}
                  className="p-4 rounded-full transition-all duration-300 hover:scale-110 bg-gray-800 hover:bg-gray-700"
                >
                  <Icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div
              className={`transition-all duration-1000 ${
                isVisible.about
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h2 className="text-4xl font-light mb-16 text-center tracking-tight">
                About
              </h2>

              <div className="grid md:grid-cols-2 gap-16 items-center">
                {/* Text Content */}
                <div className="space-y-6">
                  <p className="text-lg leading-relaxed text-gray-300">
                    I'm a passionate Full Stack Engineer with a deep fascination
                    for emerging technologies. My journey spans across web development, AI engineering and
                    blockchain development, where I strive to create innovative solutions
                    that push the boundaries of what's possible.
                  </p>
                  <p className="text-lg leading-relaxed text-gray-300">
                    Beyond code, I'm a sound engineer and artist, bringing a
                    unique creative perspective to technical challenges. This
                    blend of technical expertise and artistic vision allows me
                    to craft experiences that are both functional and beautiful.
                  </p>

                  {/* Credentials */}
                  <div className="pt-6">
                    <h3 className="text-xl font-medium mb-4">Education & Certifications</h3>
                    <div className="space-y-3">
                      {credentials.map((credential, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          <span className="text-gray-400">{credential}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {skills.map((skill, index) => (
                    <div
                      key={index}
                      className="p-6 rounded-2xl transition-all duration-300 hover:scale-105 bg-gray-800 hover:bg-gray-700"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gray-700">
                        <skill.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-medium text-sm leading-tight">
                        {skill.label}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div
              className={`transition-all duration-1000 ${
                isVisible.projects
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h2 className="text-4xl font-light mb-16 text-center tracking-tight">
                Featured Projects
              </h2>

              <div className="space-y-24">
                {projects.map((project, index) => (
                  <div
                    key={index}
                    className={`grid md:grid-cols-2 gap-12 items-center ${
                      index % 2 === 1 ? "md:grid-flow-col-dense" : ""
                    }`}
                  >
                    {/* Project Image */}
                    <div
                      className={`${index % 2 === 1 ? "md:col-start-2" : ""}`}
                    >
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full rounded-2xl shadow-xl hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Project Content */}
                    <div
                      className={`space-y-6 ${
                        index % 2 === 1 ? "md:col-start-1 md:row-start-1" : ""
                      }`}
                    >
                      <h3 className="text-3xl font-light tracking-tight">
                        {project.title}
                      </h3>
                      <p className="text-lg leading-relaxed text-gray-300">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.tech.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-3 py-1 rounded-full text-sm bg-gray-800 text-gray-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      {project.ctaUrl ? (
                        <a
                          href={project.ctaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                        >
                          <span>{project.ctaLabel || "View the Project"}</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center space-x-2 text-gray-500 opacity-60 cursor-not-allowed">
                          In Production...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className={`transition-all duration-1000 ${
                isVisible.contact
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h2 className="text-4xl font-light mb-8 tracking-tight">
                Let's Create Together
              </h2>
              <p className="text-xl mb-12 leading-relaxed text-gray-300">
                Ready to bring your next project to life? Let's discuss how we
                can innovate together.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <a
                  href="https://github.com/shangobashi"
                  className="px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 font-medium bg-gray-800 hover:bg-gray-700 text-white"
                >
                  View Work
                </a>
                <a
                  href="mailto:shangobashi@gmail.com"
                  className="px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 font-medium bg-white text-black hover:bg-gray-100"
                >
                  Get In Touch
                </a>
                <a
                  href="https://blog.shangobashi.com"
                  className="px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 font-medium bg-gray-800 hover:bg-gray-700 text-white"
                >
                  My Writings
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="px-6">
          <div className="relative h-px w-3/4 mx-auto bg-gray-800 overflow-hidden">
            <span
              ref={footerSheenRef}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent blur-[2px] mix-blend-screen"
            />
          </div>
        </div>
        <footer className="py-12 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm text-gray-400">
              © 2026 Shango Bashi
            </p>
          </div>
        </footer>
      </div>

    </div>
  );
}
















