import React from 'react';
import { MaterialType, EnvironmentType, SoundType } from '../types';
import { MATERIALS, ENVIRONMENTS, SOUND_PRESETS } from '../data/simulationData';
import { calculateEchoDecibels, getDecibelComparison, getInitialDb, SOUND_DB_PROFILES } from '../utils/decibels';
import { Timer, ArrowRightLeft, Ear, AlertCircle, Sparkles, Activity, ArrowDownRight, Volume2 } from 'lucide-react';

interface EchoMeterProps {
  distance: number;
  material: MaterialType;
  environment: EnvironmentType;
  loudness: number;
  activeSound: SoundType;
  lastEchoTime: number | null;
}

export const EchoMeter: React.FC<EchoMeterProps> = ({
  distance,
  material,
  environment,
  loudness,
  activeSound,
  lastEchoTime,
}) => {
  const env = ENVIRONMENTS[environment];
  const mat = MATERIALS[material];
  const speed = env.speedOfSound;

  const isSpace = environment === 'space';
  const oneWayTime = speed > 0 ? distance / speed : 0;
  const roundTripTime = speed > 0 ? (2 * distance) / speed : 0;
  const isDistinctEcho = distance >= 17 && !isSpace;
  const isAbsorbed = mat.reflectivity < 0.15;

  // Sound-specific initial decibels
  const initialDb = getInitialDb(activeSound, loudness);
  const activeProfile = SOUND_DB_PROFILES[activeSound];
  const soundPreset = SOUND_PRESETS.find((p) => p.type === activeSound);

  const dbData = calculateEchoDecibels(initialDb, distance, material, environment);
  const initialComp = getDecibelComparison(dbData.initialDb);
  const echoComp = getDecibelComparison(dbData.echoDb);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-slate-100 text-sm md:text-base">
            Live Science & Decibel (dB) Strength Meter
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            Decibel Unit: dB (Sound Strength)
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-sky-300 font-bold border border-slate-700">
            Speed: {speed} m/s
          </span>
        </div>
      </div>

      {/* PROMINENT HERO DISPLAY: EXACT TIME UNTIL ECHO REACHES THE GUY */}
      <div className="bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-amber-500/15 border-2 border-emerald-400/60 rounded-xl p-4 md:p-5 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
              <Timer className="w-7 h-7 animate-pulse text-emerald-400" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                <span>⏱️ TIME FROM INITIAL SOUND UNTIL ECHO REACHES GUY:</span>
              </span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
                  {isSpace ? 'Never (No sound in space)' : `${roundTripTime.toFixed(3)} seconds`}
                </span>
                {!isSpace && (
                  <span className="text-xs sm:text-sm font-semibold text-emerald-300 font-mono">
                    ({Math.round(roundTripTime * 1000)} ms)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono text-right">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Physics Equation:</div>
            <strong className="text-emerald-300">
              t = (2 × {distance}m) ÷ {speed} m/s
            </strong>
          </div>
        </div>

        {/* Journey breakdown: Outward + Return = Total */}
        {!isSpace && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">1. Outward Leg (Alex ➔ Wall)</span>
              <span className="font-bold text-amber-300 font-mono text-sm">+{oneWayTime.toFixed(3)} s</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{distance}m ÷ {speed} m/s</span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">2. Return Leg (Wall ➔ Alex)</span>
              <span className="font-bold text-sky-300 font-mono text-sm">+{oneWayTime.toFixed(3)} s</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{distance}m ÷ {speed} m/s</span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-emerald-500/50">
              <span className="text-emerald-400 font-bold block text-[11px]">3. Total Wait for Guy</span>
              <span className="font-black text-emerald-300 font-mono text-base">={roundTripTime.toFixed(3)} s</span>
              <span className="text-[10px] text-slate-300 block mt-0.5">Round trip (there & back)</span>
            </div>
          </div>
        )}
      </div>

      {/* Decibel Comparison Feature Box (New!) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-emerald-500/10 border border-slate-700/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <span>🔊 SOUND STRENGTH COMPARISON (Initial vs. Echo Return)</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Measured in <strong>Decibels (dB)</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* 1. Initial Sound Decibels */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>{soundPreset?.emoji || '🗣️'}</span>
                <span>{soundPreset?.label || 'Initial Sound'}</span>
                <span className="text-[10px] text-amber-400/80 font-mono font-normal">
                  (max {activeProfile.maxDb} dB)
                </span>
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {isSpace ? '0 dB' : `${dbData.initialDb} dB`}
              </span>
            </div>

            {/* Visual dB Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (dbData.initialDb / 110) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <span>{initialComp.emoji}</span>
                <span className="font-semibold text-amber-200">{initialComp.label}</span>
              </span>
              <span className="text-[11px] text-slate-400">{activeProfile.realWorldExample}</span>
            </div>
          </div>

          {/* 2. Echo Return Decibels */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-sky-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <span>👂 Echo Heard Back</span>
              </span>
              <span className="text-2xl font-black text-sky-400 font-mono">
                {isSpace ? '0 dB' : `${dbData.echoDb} dB`}
              </span>
            </div>

            {/* Visual dB Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (dbData.echoDb / 105) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <span>{echoComp.emoji}</span>
                <span className="font-semibold text-sky-200">{echoComp.label}</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-rose-400 flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                Lost: -{dbData.totalLossDb} dB
              </span>
            </div>
          </div>
        </div>

        {/* Why did decibels drop? Scientific Breakdown for 4th Graders */}
        {!isSpace && (
          <div className="bg-slate-850/90 p-3 rounded-lg border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">📉</span>
                <span className="font-bold text-slate-200">
                  Exact Scientific Decibel Drop Laws:
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  dbData.isAudible
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {dbData.audibilityNote}
              </span>
            </div>

            {/* 3 Physical Components */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-amber-300 flex items-center justify-between">
                  <span>1. Inverse-Square Law</span>
                  <span className="font-mono">-{dbData.geometricLossDb} dB</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Spherical spreading: <code className="text-amber-200 font-mono">20·log₁₀({dbData.roundTripMeters}m)</code>. Sound drops exactly <strong>6 dB</strong> every time distance doubles!
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-sky-300 flex items-center justify-between">
                  <span>2. Air Friction (ISO 9613)</span>
                  <span className="font-mono">-{dbData.airAbsorptionLossDb} dB</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Atmospheric dissipation: <code className="text-sky-200 font-mono">0.005 dB/m × {dbData.roundTripMeters}m</code>. Viscous friction from air molecules absorbing sound waves.
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-purple-300 flex items-center justify-between">
                  <span>3. Wall Reflection Loss</span>
                  <span className="font-mono">-{dbData.materialLossDb} dB</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Boundary reflection: <code className="text-purple-200 font-mono">-10·log₁₀(R={Math.round(mat.reflectivity * 100)}%)</code>. Energy absorbed by the surface.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono pt-1 text-center bg-slate-900/40 py-1 rounded">
              Final Echo Decibels = {dbData.initialDb} dB - {dbData.geometricLossDb} dB (spread) - {dbData.airAbsorptionLossDb} dB (air) - {dbData.materialLossDb} dB (wall) = <strong className="text-sky-300 font-bold">{dbData.echoDb} dB</strong>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid Readout for Time & Distance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Distance */}
        <div className="bg-slate-850/80 p-3 rounded-xl border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            One-Way Distance
          </div>
          <div className="text-xl font-black text-sky-400 font-mono">
            {distance} m
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Round trip = {distance * 2} m
          </div>
        </div>

        {/* 2. One-Way Time */}
        <div className="bg-slate-850/80 p-3 rounded-xl border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Time to Hit Wall
          </div>
          <div className="text-xl font-black text-amber-400 font-mono">
            {isSpace ? '—' : `${oneWayTime.toFixed(3)}s`}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            distance ÷ speed
          </div>
        </div>

        {/* 3. Total Round Trip Time */}
        <div className="bg-slate-850/80 p-3 rounded-xl border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Echo Delay
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {isSpace ? '—' : `${roundTripTime.toFixed(2)}s`}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            (2 × distance) ÷ speed
          </div>
        </div>

        {/* 4. Wall Bounce Rate */}
        <div className="bg-slate-850/80 p-3 rounded-xl border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Echo Bounce Power
          </div>
          <div className="text-xl font-black text-purple-400 font-mono">
            {Math.round(mat.reflectivity * 100)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {Math.round(mat.absorption * 100)}% absorbed
          </div>
        </div>
      </div>

      {/* Human Brain Perception Status Box */}
      <div
        className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
          isSpace
            ? 'bg-rose-950/40 border-rose-800 text-rose-200'
            : isAbsorbed
            ? 'bg-purple-950/40 border-purple-800 text-purple-200'
            : isDistinctEcho
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
            : 'bg-amber-950/40 border-amber-800 text-amber-200'
        }`}
      >
        <div className="mt-0.5">
          {isSpace ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : isDistinctEcho ? (
            <Ear className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <ArrowRightLeft className="w-5 h-5 text-amber-400 shrink-0" />
          )}
        </div>

        <div className="space-y-1 text-xs">
          <div className="font-extrabold text-sm flex items-center gap-2">
            {isSpace && <span>🚀 Silence! No Echo Can Exist in Space!</span>}
            {!isSpace && isAbsorbed && <span>🤫 Trapped Energy! Foam Absorbs the Sound!</span>}
            {!isSpace && !isAbsorbed && isDistinctEcho && (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                DISTINCT ECHO HEARD! (Two separate sounds)
              </span>
            )}
            {!isSpace && !isAbsorbed && !isDistinctEcho && (
              <span className="text-amber-300">
                REVERBERATION ZONE (Wall is closer than 17m!)
              </span>
            )}
          </div>

          <p className="text-slate-300 leading-relaxed text-[12px]">
            {isSpace &&
              'Sound waves require a physical substance (solid, liquid, or gas molecules) to vibrate. In a space vacuum, there are no particles, so sound cannot travel at all.'}
            {!isSpace &&
              isAbsorbed &&
              `The soft foam trapped vibrations and dropped sound strength by ${dbData.materialLossDb} dB! The return is only ${dbData.echoDb} dB, which is barely audible.`}
            {!isSpace &&
              !isAbsorbed &&
              isDistinctEcho &&
              `Because the sound takes ${roundTripTime.toFixed(2)} seconds to return (more than 0.1s), human ears and brain clearly hear the original sound (${dbData.initialDb} dB) and the echo (${dbData.echoDb} dB) as two separate events!`}
            {!isSpace &&
              !isAbsorbed &&
              !isDistinctEcho &&
              `The sound returned in only ${roundTripTime.toFixed(3)} seconds! Human brains cannot distinguish two sounds arriving less than 0.1 seconds apart. It merges into a lingering reverberation (reverb)!`}
          </p>
        </div>
      </div>
    </div>
  );
};
