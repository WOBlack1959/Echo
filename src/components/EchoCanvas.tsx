import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MaterialType, EnvironmentType, SoundType } from '../types';
import { MATERIALS, ENVIRONMENTS } from '../data/simulationData';
import { soundEngine } from '../utils/audio';
import { getInitialDb, calculateEchoDecibels } from '../utils/decibels';

interface EchoCanvasProps {
  distance: number; // in meters (10 to 250)
  onDistanceChange: (newDistance: number) => void;
  material: MaterialType;
  environment: EnvironmentType;
  loudness: number; // 1 to 10
  speedFactor: number; // 0.05 to 1.0
  activeSound: SoundType;
  isPaused: boolean;
  showMolecules: boolean;
  onEchoDetected: (roundTripSeconds: number) => void;
}

interface WavePulse {
  id: number;
  startX: number;
  startY: number;
  radiusMeters: number;
  maxMeters: number;
  isReflected: boolean;
  wallXPos: number;
  soundType: SoundType;
  loudness: number;
  material: MaterialType;
  hasPlayedEcho: boolean;
  speed: number;
  initialSpeed: number;
}

interface Particle {
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
}

export const EchoCanvas: React.FC<EchoCanvasProps> = ({
  distance,
  onDistanceChange,
  material,
  environment,
  loudness,
  speedFactor,
  activeSound,
  isPaused,
  showMolecules,
  onEchoDetected,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingWall, setIsDraggingWall] = useState(false);
  const [alexReaction, setAlexReaction] = useState<string | null>(null);
  const reactionTimerRef = useRef<number | null>(null);

  // Simulation waves state
  const wavesRef = useRef<WavePulse[]>([]);
  const nextWaveId = useRef(1);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const elapsedSimTimeRef = useRef<number>(0);

  // Initialize air molecule particles
  useEffect(() => {
    const particles: Particle[] = [];
    const cols = 28;
    const rows = 9;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        particles.push({
          baseX: (c + 0.5) / cols,
          baseY: (r + 0.5) / rows,
          currentX: 0,
          currentY: 0,
        });
      }
    }
    particlesRef.current = particles;
  }, []);

  // Public method to launch a sound pulse from Alex
  const launchPulse = useCallback(
    (soundOverride?: SoundType) => {
      const type = soundOverride || activeSound;
      const speed = ENVIRONMENTS[environment].speedOfSound;

      if (environment === 'space') {
        // Space vacuum: sound cannot be made!
        setAlexReaction('No air in space! 🚀 (Silence)');
        if (reactionTimerRef.current) window.clearTimeout(reactionTimerRef.current);
        reactionTimerRef.current = window.setTimeout(() => setAlexReaction(null), 2500);
        return;
      }

      // Play direct audio
      soundEngine.playSound(type, loudness);

      const initialDb = getInitialDb(type, loudness);

      // Reaction bubble on Alex with decibels
      let reactionText = `HELLO! 🗣️ (${initialDb} dB)`;
      if (type === 'clap') reactionText = `CLAP! 👏 (${initialDb} dB)`;
      if (type === 'whistle') reactionText = `TWEEET! 🎵 (${initialDb} dB)`;
      if (type === 'drum') reactionText = `BOOM! 🥁 (${initialDb} dB)`;
      if (type === 'yodel') reactionText = `YODEL! 🏔️ (${initialDb} dB)`;
      if (type === 'bat') reactionText = `CHIRP! 🦇 (${initialDb} dB)`;

      setAlexReaction(reactionText);
      if (reactionTimerRef.current) window.clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = window.setTimeout(() => setAlexReaction(null), 1800);

      // Add new wave pulse
      wavesRef.current.push({
        id: nextWaveId.current++,
        startX: 0, // In meters from Alex (Alex is at 0m)
        startY: 0,
        radiusMeters: 0.1,
        maxMeters: distance * 2.2,
        isReflected: false,
        wallXPos: distance,
        soundType: type,
        loudness,
        material,
        hasPlayedEcho: false,
        speed,
        initialSpeed: speed,
      });
    },
    [activeSound, distance, environment, loudness, material]
  );

  // Expose launch method via window custom event so buttons can trigger it
  useEffect(() => {
    const handleEmitSound = (e: Event) => {
      const customEvent = e as CustomEvent<{ soundType?: SoundType }>;
      launchPulse(customEvent.detail?.soundType);
    };

    window.addEventListener('sim-emit-sound', handleEmitSound);
    return () => {
      window.removeEventListener('sim-emit-sound', handleEmitSound);
    };
  }, [launchPulse]);

  // Main animation loop
  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Handle high DPI display
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const targetWidth = Math.floor(rect.width * dpr);
      const targetHeight = Math.floor(rect.height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      // Coordinate mapping:
      // Alex is located at x = marginX (0 meters)
      // Max viewable meters = 260m
      const marginX = 75;
      const maxMetersView = 265;
      const groundY = height - 60;
      const alexX = marginX;
      const alexY = groundY - 45;
      const meterToPx = (width - marginX - 50) / maxMetersView;

      const wallCanvasX = alexX + distance * meterToPx;
      const wallHeight = height - 90;
      const wallY = groundY - wallHeight;

      // Advance physics if not paused
      const effectiveDt = isPaused ? 0 : dt * speedFactor;
      elapsedSimTimeRef.current += effectiveDt;

      // Background Sky / Scenery based on Environment
      drawBackground(ctx, width, height, groundY, environment);

      // Air molecules (if enabled & not in space)
      if (showMolecules && environment !== 'space') {
        drawAirMolecules(ctx, alexX, wallCanvasX, groundY, wavesRef.current, meterToPx, distance);
      }

      // Metric Distance Ruler on Ground
      drawDistanceRuler(ctx, marginX, groundY, width, meterToPx, distance);

      // Target Wall / Obstacle
      drawWall(ctx, wallCanvasX, wallY, wallHeight, material, isDraggingWall);

      // Student Character ("Alex")
      drawStudent(ctx, alexX, groundY, activeSound, alexReaction);

      // Update and Draw Sound Waves
      const currentSpeed = ENVIRONMENTS[environment].speedOfSound;
      const updatedWaves: WavePulse[] = [];

      for (const wave of wavesRef.current) {
        if (!isPaused) {
          // Increment radius based on speed of sound and time step
          wave.radiusMeters += currentSpeed * effectiveDt;
        }

        // Draw outgoing wave arc
        const waveCanvasRadius = wave.radiusMeters * meterToPx;

        // Check if wave has reached the wall
        if (!wave.isReflected && wave.radiusMeters >= wave.wallXPos) {
          // Hit the wall! Create reflected wave
          wave.isReflected = true;
          // Spawn impact bounce sparkle particles
          drawWallImpactSparkles(ctx, wallCanvasX, alexY);
        }

        if (!wave.isReflected) {
          // Outgoing wave from Alex
          drawOutgoingWave(ctx, alexX, alexY, waveCanvasRadius, wallCanvasX, wave);
          if (wave.radiusMeters < wave.wallXPos + 5) {
            updatedWaves.push(wave);
          }
        } else {
          // Reflected wave bouncing back toward Alex!
          // Reflected wave distance from wall back towards Alex
          const returnDistMeters = wave.radiusMeters - wave.wallXPos;
          const reflectedWaveCanvasRadius = returnDistMeters * meterToPx;

          drawReflectedWave(ctx, wallCanvasX, alexY, alexX, reflectedWaveCanvasRadius, wave, meterToPx);

          // Check if reflected wave has reached Alex!
          if (returnDistMeters >= wave.wallXPos && !wave.hasPlayedEcho) {
            wave.hasPlayedEcho = true;

            // Trigger acoustic echo playback
            soundEngine.playEcho(wave.soundType, wave.loudness, wave.material, wave.wallXPos);

            // Calculation of true real-life round-trip time and decibel strength
            const trueRoundTripSec = (2 * wave.wallXPos) / wave.speed;
            onEchoDetected(trueRoundTripSec);

            const initialWaveDb = getInitialDb(wave.soundType, wave.loudness);
            const { echoDb, totalLossDb, isAudible } = calculateEchoDecibels(
              initialWaveDb,
              wave.wallXPos,
              wave.material,
              environment
            );

            // Ear reaction badge on Alex with decibels
            let echoMsg = `Echo: ${echoDb} dB (-${totalLossDb} dB lost)`;
            if (!isAudible) {
              echoMsg = `Too faint to hear! (${echoDb} dB)`;
            } else if (wave.material === 'curtain') {
              echoMsg = `Absorbed! 🤫 (${echoDb} dB)`;
            }

            setAlexReaction(`Echo Heard! 👂 ${echoMsg}`);
            if (reactionTimerRef.current) window.clearTimeout(reactionTimerRef.current);
            reactionTimerRef.current = window.setTimeout(() => setAlexReaction(null), 2500);
          }

          // Keep wave alive until it passes Alex by a small margin
          if (returnDistMeters < wave.wallXPos + 35) {
            updatedWaves.push(wave);
          }
        }
      }

      wavesRef.current = updatedWaves;

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    distance,
    material,
    environment,
    speedFactor,
    activeSound,
    isPaused,
    showMolecules,
    isDraggingWall,
    alexReaction,
    onEchoDetected,
  ]);

  // Mouse / Touch handlers for dragging the wall or clicking to set distance
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const marginX = 75;
    const maxMetersView = 265;
    const meterToPx = (rect.width - marginX - 50) / maxMetersView;
    const wallCanvasX = marginX + distance * meterToPx;

    // Check if clicked near the wall handle (+/- 25px) or ruler area
    if (Math.abs(clientX - wallCanvasX) < 30 || clientY > rect.height - 70) {
      setIsDraggingWall(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updateDistanceByClientX(clientX, rect.width);
    } else if (clientX < marginX + 30) {
      // Clicked on Alex! Launch sound!
      launchPulse();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingWall) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    updateDistanceByClientX(clientX, rect.width);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingWall) {
      setIsDraggingWall(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  const updateDistanceByClientX = (clientX: number, canvasWidth: number) => {
    const marginX = 75;
    const maxMetersView = 265;
    const meterToPx = (canvasWidth - marginX - 50) / maxMetersView;
    const rawMeters = (clientX - marginX) / meterToPx;
    const clampedMeters = Math.round(Math.max(10, Math.min(250, rawMeters)));
    onDistanceChange(clampedMeters);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380px] md:h-[430px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-xl select-none"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full block cursor-ew-resize touch-none"
      />

      {/* Top Overlay Badge with Quick Hint */}
      <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 flex items-center gap-2 pointer-events-none shadow-md">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-emerald-300">Interactive Canvas:</span>
        <span className="hidden sm:inline">Drag the wall or click anywhere to change distance!</span>
        <span className="sm:hidden">Drag wall to change distance!</span>
      </div>

      {/* Top-Right Live Decibel Strength HUD */}
      {(() => {
        const curInitialDb = getInitialDb(activeSound, loudness);
        const { echoDb, totalLossDb } = calculateEchoDecibels(curInitialDb, distance, material, environment);
        return (
          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 flex items-center gap-2.5 pointer-events-none shadow-md">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span>🗣️</span>
              <span>{environment === 'space' ? '0' : curInitialDb} dB</span>
            </span>
            <span className="text-slate-400">➔</span>
            <span className="text-sky-300 font-bold flex items-center gap-1">
              <span>👂</span>
              <span>{environment === 'space' ? '0' : echoDb} dB</span>
            </span>
            {environment !== 'space' && (
              <span className="text-[10px] text-rose-400 font-mono bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/80">
                -{totalLossDb} dB
              </span>
            )}
          </div>
        );
      })()}

      {/* Quick Click-to-Shout button on the character */}
      <button
        type="button"
        onClick={() => launchPulse()}
        className="absolute bottom-16 left-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 text-xs transition-transform cursor-pointer"
        title="Click to make Alex sound off!"
      >
        <span>🗣️ Shout Now!</span>
      </button>

      {/* Wall Distance Draggable Indicator Pill */}
      <div
        style={{
          left: `calc(75px + ${(distance / 265) * 82}% )`,
        }}
        className="absolute top-4 -translate-x-1/2 pointer-events-none transition-all duration-75 flex flex-col items-center"
      >
        <div className="bg-sky-500 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-lg border border-sky-300 flex items-center gap-1">
          <span>{distance} m</span>
          <span className="text-[10px] text-sky-100 font-normal">({Math.round(distance * 3.28)} ft)</span>
        </div>
        <div className="w-0.5 h-3 bg-sky-400" />
      </div>
    </div>
  );
};

// Canvas Drawing Helper Functions

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  groundY: number,
  env: EnvironmentType
) {
  if (env === 'space') {
    // Deep cosmic space
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#030712');
    skyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137.5) % width);
      const sy = ((i * 89.3) % (groundY - 30));
      const sSize = (i % 3 === 0) ? 2 : 1;
      ctx.globalAlpha = 0.4 + (i % 5) * 0.12;
      ctx.fillRect(sx, sy, sSize, sSize);
    }
    ctx.globalAlpha = 1.0;

    // Distant Earth or Moon in sky
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(width - 90, 70, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(width - 94, 66, 12, 0, Math.PI * 2);
    ctx.fill();

    // Lunar ground surface
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, groundY, width, 4);

    // Craters on ground
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(140, groundY + 18, 25, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(320, groundY + 28, 40, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (env === 'air_cold') {
    // Winter snowy scene
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#64748b');
    skyGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, groundY);

    // Snow capped distant mountains
    drawDistantMountains(ctx, width, groundY, '#94a3b8', '#e2e8f0');

    // Snowy ground
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, groundY, width, 6);
    return;
  }

  // Warm summer or standard classroom / canyon
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  if (env === 'air_warm') {
    skyGrad.addColorStop(0, '#38bdf8');
    skyGrad.addColorStop(0.7, '#7dd3fc');
    skyGrad.addColorStop(1, '#fed7aa'); // warm golden glow
  } else {
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(1, '#bae6fd');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, groundY);

  // Friendly Sun
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(width - 70, 55, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(width - 70, 55, 21, 0, Math.PI * 2);
  ctx.fill();

  // Distant mountains
  drawDistantMountains(ctx, width, groundY, '#64748b', '#475569');

  // Grass / Canyon ground
  const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
  groundGrad.addColorStop(0, '#15803d');
  groundGrad.addColorStop(1, '#14532d');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, groundY, width, height - groundY);

  // Top grass trim
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, groundY, width, 5);
}

function drawDistantMountains(
  ctx: CanvasRenderingContext2D,
  width: number,
  groundY: number,
  color1: string,
  color2: string
) {
  ctx.fillStyle = color1;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(80, groundY - 90);
  ctx.lineTo(190, groundY);
  ctx.lineTo(310, groundY - 120);
  ctx.lineTo(440, groundY);
  ctx.lineTo(580, groundY - 110);
  ctx.lineTo(width, groundY - 70);
  ctx.lineTo(width, groundY);
  ctx.closePath();
  ctx.fill();

  // Fore-hills
  ctx.fillStyle = color2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(130, groundY - 60);
  ctx.lineTo(260, groundY);
  ctx.lineTo(400, groundY - 75);
  ctx.lineTo(520, groundY);
  ctx.lineTo(width, groundY - 50);
  ctx.lineTo(width, groundY);
  ctx.closePath();
  ctx.fill();
}

function drawAirMolecules(
  ctx: CanvasRenderingContext2D,
  alexX: number,
  wallX: number,
  groundY: number,
  waves: WavePulse[],
  meterToPx: number,
  _distanceMeters: number
) {
  ctx.save();
  const topY = 40;
  const bottomY = groundY - 20;
  const availableWidth = wallX - alexX - 20;

  if (availableWidth <= 20) {
    ctx.restore();
    return;
  }

  const cols = 28;
  const rows = 7;

  for (let c = 0; c < cols; c++) {
    const baseX = alexX + 15 + (c / cols) * availableWidth;
    const distFromAlexMeters = (baseX - alexX) / meterToPx;

    // Calculate displacement from passing sound waves
    let displacementX = 0;

    for (const wave of waves) {
      // Check if outgoing wave front is near this molecule
      const distToWaveFront = Math.abs(distFromAlexMeters - wave.radiusMeters);
      if (distToWaveFront < 18) {
        // Molecule oscillates back and forth
        const phase = (distFromAlexMeters - wave.radiusMeters) / 3;
        displacementX += Math.sin(phase * Math.PI) * 7 * (wave.loudness / 10);
      }

      // Check if reflected wave is near
      if (wave.isReflected) {
        const returnMeters = wave.radiusMeters - wave.wallXPos;
        const wavePosFromAlex = wave.wallXPos - returnMeters;
        const distToReflectedFront = Math.abs(distFromAlexMeters - wavePosFromAlex);
        if (distToReflectedFront < 18) {
          const phase = (distFromAlexMeters - wavePosFromAlex) / 3;
          displacementX -= Math.sin(phase * Math.PI) * 5 * (wave.loudness / 10);
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      const baseY = topY + (r / rows) * (bottomY - topY);
      const posX = baseX + displacementX;
      const posY = baseY;

      ctx.fillStyle = Math.abs(displacementX) > 1 ? '#38bdf8' : '#94a3b8';
      ctx.globalAlpha = Math.abs(displacementX) > 1 ? 0.8 : 0.35;
      ctx.beginPath();
      ctx.arc(posX, posY, Math.abs(displacementX) > 1.5 ? 2.5 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawDistanceRuler(
  ctx: CanvasRenderingContext2D,
  startX: number,
  groundY: number,
  _canvasWidth: number,
  meterToPx: number,
  currentDistance: number
) {
  ctx.save();
  const rulerY = groundY + 18;

  // Ruler bar
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, rulerY);
  ctx.lineTo(startX + 250 * meterToPx, rulerY);
  ctx.stroke();

  // Highlighted path between Alex and Wall
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(startX, rulerY);
  ctx.lineTo(startX + currentDistance * meterToPx, rulerY);
  ctx.stroke();

  // Tick marks
  for (let m = 0; m <= 250; m += 25) {
    const x = startX + m * meterToPx;
    const isMajor = m % 50 === 0;

    ctx.strokeStyle = isMajor ? '#cbd5e1' : '#64748b';
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x, rulerY - (isMajor ? 8 : 4));
    ctx.lineTo(x, rulerY + (isMajor ? 8 : 4));
    ctx.stroke();

    ctx.fillStyle = isMajor ? '#f1f5f9' : '#94a3b8';
    ctx.font = isMajor ? 'bold 11px sans-serif' : '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${m}m`, x, rulerY + 22);
  }

  // 17 Meter Reverb vs Echo Threshold Marker!
  const threshX = startX + 17 * meterToPx;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(threshX, groundY - 120);
  ctx.lineTo(threshX, rulerY + 12);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label for 17m
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('17m (Echo Line)', threshX, groundY - 126);

  ctx.restore();
}

function drawWall(
  ctx: CanvasRenderingContext2D,
  wallX: number,
  wallY: number,
  wallHeight: number,
  material: MaterialType,
  isDragging: boolean
) {
  ctx.save();
  const wallWidth = 42;
  const matInfo = MATERIALS[material];

  // Draw wall drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(wallX + wallWidth, wallY + 10, 8, wallHeight - 10);

  // Material-specific textures
  if (material === 'rock') {
    // Rocky mountain cliff
    const cliffGrad = ctx.createLinearGradient(wallX, 0, wallX + wallWidth, 0);
    cliffGrad.addColorStop(0, '#475569');
    cliffGrad.addColorStop(0.5, '#64748b');
    cliffGrad.addColorStop(1, '#334155');
    ctx.fillStyle = cliffGrad;
    ctx.fillRect(wallX, wallY, wallWidth, wallHeight);

    // Rock crags and highlights
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    for (let y = wallY + 20; y < wallY + wallHeight; y += 35) {
      ctx.beginPath();
      ctx.moveTo(wallX + 2, y);
      ctx.lineTo(wallX + 18, y + 14);
      ctx.lineTo(wallX + 38, y + 6);
      ctx.stroke();
    }
  } else if (material === 'brick') {
    // Brick courses
    ctx.fillStyle = '#b44a36';
    ctx.fillRect(wallX, wallY, wallWidth, wallHeight);

    // Mortar lines
    ctx.strokeStyle = '#d67563';
    ctx.lineWidth = 1;
    const brickH = 12;
    const brickW = 18;
    for (let y = wallY; y < wallY + wallHeight; y += brickH) {
      ctx.beginPath();
      ctx.moveTo(wallX, y);
      ctx.lineTo(wallX + wallWidth, y);
      ctx.stroke();

      const offset = (Math.floor(y / brickH) % 2) * (brickW / 2);
      for (let x = wallX + offset; x < wallX + wallWidth; x += brickW) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + brickH);
        ctx.stroke();
      }
    }
  } else if (material === 'trees') {
    // Pine forest trunks & needles
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(wallX, wallY, wallWidth, wallHeight);

    // Pine branches pattern
    ctx.fillStyle = '#15803d';
    for (let y = wallY; y < wallY + wallHeight; y += 22) {
      ctx.beginPath();
      ctx.moveTo(wallX, y + 18);
      ctx.lineTo(wallX + wallWidth / 2, y);
      ctx.lineTo(wallX + wallWidth, y + 18);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Acoustic foam wedges (Curtain/Foam)
    ctx.fillStyle = '#334155';
    ctx.fillRect(wallX, wallY, wallWidth, wallHeight);

    // Wedge pyramid sound baffles
    ctx.fillStyle = '#1e293b';
    const wedgeH = 16;
    for (let y = wallY; y < wallY + wallHeight; y += wedgeH) {
      ctx.beginPath();
      ctx.moveTo(wallX, y);
      ctx.lineTo(wallX + 18, y + wedgeH / 2);
      ctx.lineTo(wallX, y + wedgeH);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Border highlight
  ctx.strokeStyle = isDragging ? '#38bdf8' : '#e2e8f0';
  ctx.lineWidth = isDragging ? 3 : 2;
  ctx.strokeRect(wallX, wallY, wallWidth, wallHeight);

  // Top Handle with Icon & Drag Hint
  ctx.fillStyle = isDragging ? '#38bdf8' : '#0ea5e9';
  ctx.beginPath();
  ctx.roundRect(wallX - 6, wallY - 32, wallWidth + 12, 28, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`↔ ${matInfo.icon}`, wallX + wallWidth / 2, wallY - 14);

  // Material Tag on wall
  ctx.save();
  ctx.translate(wallX + wallWidth / 2, wallY + wallHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(matInfo.name.toUpperCase(), 0, 4);
  ctx.restore();

  ctx.restore();
}

function drawStudent(
  ctx: CanvasRenderingContext2D,
  alexX: number,
  groundY: number,
  activeSound: SoundType,
  reaction: string | null
) {
  ctx.save();
  const charY = groundY - 48;

  // Shadow on ground
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(alexX, groundY, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs / Pants
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(alexX - 9, charY + 22, 6, 26);
  ctx.fillRect(alexX + 3, charY + 22, 6, 26);

  // Shoes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(alexX - 11, charY + 44, 9, 5);
  ctx.fillRect(alexX + 3, charY + 44, 9, 5);

  // Torso / T-Shirt
  ctx.fillStyle = '#ef4444'; // Bright red shirt
  ctx.beginPath();
  ctx.roundRect(alexX - 12, charY + 4, 24, 22, 4);
  ctx.fill();

  // Arms / Hands
  ctx.fillStyle = '#fed7aa'; // Skin tone
  if (activeSound === 'clap') {
    // Clapping hands together in front
    ctx.beginPath();
    ctx.arc(alexX + 16, charY + 12, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (activeSound === 'drum') {
    // Holding drumstick
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(alexX + 10, charY + 12);
    ctx.lineTo(alexX + 22, charY + 18);
    ctx.stroke();
  } else {
    // Arm extended with megaphone or cupping mouth
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(alexX + 14, charY + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    // Yellow Megaphone
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(alexX + 14, charY + 8);
    ctx.lineTo(alexX + 28, charY + 1);
    ctx.lineTo(alexX + 28, charY + 17);
    ctx.closePath();
    ctx.fill();
  }

  // Head
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(alexX, charY - 8, 14, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(alexX, charY - 14, 14, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(alexX - 10, charY - 10, 6, 0, Math.PI * 2);
  ctx.fill();

  // Face details: Smiling eye & mouth
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(alexX + 4, charY - 8, 2, 0, Math.PI * 2); // Eye looking right
  ctx.fill();

  // Open speaking mouth
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.arc(alexX + 8, charY - 4, 3, 0, Math.PI);
  ctx.fill();

  // Ear with sound detection indicator
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(alexX - 12, charY - 7, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Ear listener rings when reaction is active
  if (reaction && reaction.includes('Echo Heard')) {
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(alexX - 12, charY - 7, 10, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(alexX - 12, charY - 7, 16, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.stroke();
  }

  // Name badge under character
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Alex 🧑‍🔬', alexX, groundY + 14);

  // Speech bubble or reaction banner
  if (reaction) {
    const bubbleText = reaction;
    ctx.font = 'bold 12px sans-serif';
    const textWidth = ctx.measureText(bubbleText).width;
    const bubbleW = textWidth + 18;
    const bubbleH = 26;
    const bubbleX = alexX + 16;
    const bubbleY = charY - 46;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Tail pointing to Alex
    ctx.beginPath();
    ctx.moveTo(bubbleX, bubbleY + 14);
    ctx.lineTo(bubbleX - 7, bubbleY + 18);
    ctx.lineTo(bubbleX, bubbleY + 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(bubbleText, bubbleX + bubbleW / 2, bubbleY + 17);
  }

  ctx.restore();
}

function drawOutgoingWave(
  ctx: CanvasRenderingContext2D,
  alexX: number,
  alexY: number,
  waveRadiusPx: number,
  wallCanvasX: number,
  wave: WavePulse
) {
  ctx.save();

  // Wave color based on sound type
  let baseColor = '245, 158, 11'; // Amber yell
  if (wave.soundType === 'clap') baseColor = '59, 130, 246'; // Blue
  if (wave.soundType === 'whistle') baseColor = '16, 185, 129'; // Emerald
  if (wave.soundType === 'drum') baseColor = '239, 68, 68'; // Red
  if (wave.soundType === 'yodel') baseColor = '139, 92, 246'; // Purple
  if (wave.soundType === 'bat') baseColor = '236, 72, 153'; // Pink

  const amplitudeAlpha = (wave.loudness / 10) * 0.85;
  // Fade slightly with distance
  const distanceFade = Math.max(0.2, 1 - wave.radiusMeters / 300);
  const finalAlpha = amplitudeAlpha * distanceFade;

  ctx.strokeStyle = `rgba(${baseColor}, ${finalAlpha})`;
  ctx.lineWidth = Math.max(2, (wave.loudness / 10) * 5);

  // Clip to not draw past the wall
  ctx.beginPath();
  ctx.rect(0, 0, wallCanvasX, 1000);
  ctx.clip();

  // Concentric arc radiating toward the right
  ctx.beginPath();
  // Arc angle spans facing right: -65 deg to +65 deg
  ctx.arc(alexX + 15, alexY, waveRadiusPx, -Math.PI * 0.38, Math.PI * 0.38);
  ctx.stroke();

  // Secondary softer inner harmonic ring
  if (waveRadiusPx > 16) {
    ctx.strokeStyle = `rgba(${baseColor}, ${finalAlpha * 0.45})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(alexX + 15, alexY, waveRadiusPx - 10, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();
  }

  ctx.restore();
}

function drawReflectedWave(
  ctx: CanvasRenderingContext2D,
  wallCanvasX: number,
  alexY: number,
  alexX: number,
  reflectedRadiusPx: number,
  wave: WavePulse,
  _meterToPx: number
) {
  ctx.save();
  const matInfo = MATERIALS[wave.material];
  const reflectivity = matInfo.reflectivity;

  // Reflected color
  let baseColor = '56, 189, 248'; // Cyan
  if (wave.material === 'curtain') {
    baseColor = '148, 163, 184'; // Soft gray / absorbed
  } else if (wave.material === 'trees') {
    baseColor = '52, 211, 153'; // Greenish faint
  } else if (wave.material === 'brick') {
    baseColor = '244, 114, 182'; // Rose
  }

  const alpha = (wave.loudness / 10) * reflectivity * 0.9;
  if (alpha < 0.04) {
    ctx.restore();
    return; // Completely absorbed!
  }

  ctx.strokeStyle = `rgba(${baseColor}, ${alpha})`;
  ctx.lineWidth = Math.max(1.5, (wave.loudness / 10) * reflectivity * 4.5);

  if (wave.material === 'curtain') {
    ctx.setLineDash([4, 6]); // Dashed wave showing scattered absorption
  }

  // Clip between Alex and wall
  ctx.beginPath();
  ctx.rect(alexX - 20, 0, wallCanvasX - alexX + 20, 1000);
  ctx.clip();

  // Reflected arc originating from wall point, facing left!
  ctx.beginPath();
  ctx.arc(wallCanvasX, alexY, reflectedRadiusPx, Math.PI * 0.62, Math.PI * 1.38);
  ctx.stroke();

  // Second harmonic ring
  if (reflectedRadiusPx > 18 && reflectivity > 0.4) {
    ctx.strokeStyle = `rgba(${baseColor}, ${alpha * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(wallCanvasX, alexY, reflectedRadiusPx - 10, Math.PI * 0.65, Math.PI * 1.35);
    ctx.stroke();
  }

  ctx.restore();
}

function drawWallImpactSparkles(ctx: CanvasRenderingContext2D, wallX: number, impactY: number) {
  ctx.save();
  ctx.fillStyle = '#fde047';
  for (let i = 0; i < 7; i++) {
    const angle = ((i - 3) * Math.PI) / 8;
    const dist = 12 + (i % 3) * 6;
    const px = wallX - Math.cos(angle) * dist;
    const py = impactY + Math.sin(angle) * dist;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
