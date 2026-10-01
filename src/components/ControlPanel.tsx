import React from 'react';
import { MaterialType, EnvironmentType, SoundType } from '../types';
import { MATERIALS, ENVIRONMENTS, SOUND_PRESETS } from '../data/simulationData';
import { getInitialDb, getDecibelComparison, SOUND_DB_PROFILES } from '../utils/decibels';
import { Volume2, VolumeX, Play, Pause, Zap, Sparkles, Wind } from 'lucide-react';

interface ControlPanelProps {
  distance: number;
  onDistanceChange: (val: number) => void;
  material: MaterialType;
  onMaterialChange: (val: MaterialType) => void;
  environment: EnvironmentType;
  onEnvironmentChange: (val: EnvironmentType) => void;
  loudness: number;
  onLoudnessChange: (val: number) => void;
  speedFactor: number;
  onSpeedFactorChange: (val: number) => void;
  activeSound: SoundType;
  onActiveSoundChange: (val: SoundType) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  showMolecules: boolean;
  onToggleMolecules: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onTriggerSound: (soundType?: SoundType) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  distance,
  onDistanceChange,
  material,
  onMaterialChange,
  environment,
  onEnvironmentChange,
  loudness,
  onLoudnessChange,
  speedFactor,
  onSpeedFactorChange,
  activeSound,
  onActiveSoundChange,
  isPaused,
  onTogglePause,
  showMolecules,
  onToggleMolecules,
  isMuted,
  onToggleMute,
  onTriggerSound,
}) => {
  // Real world comparison label for distance
  const getDistanceComparison = (dist: number) => {
    if (dist < 17) return 'Smaller than a gymnasium (Echo blends into reverb!)';
    if (dist <= 30) return 'About 2 school buses long 🚌🚌';
    if (dist <= 60) return 'About half a football field 🏈';
    if (dist <= 110) return 'About the length of 1 full soccer field ⚽';
    if (dist <= 180) return 'Almost two soccer fields long! 🏃‍♂️';
    return 'Over two and a half soccer fields away! 🏔️';
  };

  const currentDb = getInitialDb(activeSound, loudness);
  const activeProfile = SOUND_DB_PROFILES[activeSound];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-6">
      {/* Sound Triggers Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            1. Pick a Sound to Send (Each has a unique Decibel power level!):
          </label>
          <span className="text-xs text-amber-400 font-medium">Click any sound or press Spacebar!</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SOUND_PRESETS.map((preset) => {
            const isSelected = activeSound === preset.type;
            const presetProfile = SOUND_DB_PROFILES[preset.type];
            return (
              <button
                key={preset.type}
                type="button"
                onClick={() => {
                  onActiveSoundChange(preset.type);
                  onTriggerSound(preset.type);
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 shadow-lg scale-[1.02]'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-slate-600'
                }`}
              >
                <span className="text-2xl mb-1">{preset.emoji}</span>
                <span className="text-xs font-bold leading-tight">{preset.label}</span>
                <span className="text-[10px] font-mono font-bold mt-1 px-1.5 py-0.2 rounded bg-slate-900/90 text-amber-300 border border-slate-700">
                  up to {presetProfile.maxDb} dB
                </span>
              </button>
            );
          })}
        </div>

        {/* Big Action Button */}
        <button
          type="button"
          onClick={() => onTriggerSound()}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.99] text-slate-950 font-extrabold text-base md:text-lg rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform cursor-pointer"
        >
          <Zap className="w-5 h-5 fill-slate-950" />
          <span>LAUNCH SOUND WAVE! ({activeSound.toUpperCase()} · {currentDb} dB)</span>
        </button>
      </div>

      {/* Primary Sliders Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-800">
        {/* Distance Slider */}
        <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <span>📏 Distance to Wall:</span>
            </span>
            <span className="text-lg font-black text-sky-400 font-mono">
              {distance} meters <span className="text-xs text-slate-400 font-normal">({Math.round(distance * 3.28)} ft)</span>
            </span>
          </div>

          <input
            type="range"
            min={10}
            max={250}
            step={1}
            value={distance}
            onChange={(e) => onDistanceChange(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />

          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>10m (Close)</span>
            <span className="text-amber-400 font-semibold">17m (Echo Line)</span>
            <span>250m (Far Valley)</span>
          </div>

          <div className="bg-slate-900/80 rounded-lg p-2.5 text-xs text-slate-300 border border-slate-800 flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              <strong className="text-sky-300">Kid Ruler:</strong> {getDistanceComparison(distance)}
            </span>
          </div>
        </div>

        {/* Volume & Loudness Slider (Sound-Specific Decibels) */}
        <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800/90 space-y-3">
          {(() => {
            const comp = getDecibelComparison(currentDb);
            return (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-200">
                    🔊 {activeSound.toUpperCase()} Strength:
                  </span>
                  <span className="text-base font-extrabold text-amber-400 font-mono flex items-center gap-1.5">
                    <span>{currentDb} dB</span>
                    <span className="text-xs text-slate-400 font-normal">(Level {loudness}/10)</span>
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={loudness}
                  onChange={(e) => onLoudnessChange(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />

                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{activeProfile.minDb} dB (Softest)</span>
                  <span>{Math.round((activeProfile.minDb + activeProfile.maxDb) / 2)} dB (Medium)</span>
                  <span className="font-bold text-amber-300">{activeProfile.maxDb} dB (Max Power!)</span>
                </div>

                <div className="bg-slate-900/80 rounded-lg p-2.5 text-xs text-slate-300 border border-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>{comp.emoji}</span>
                    <span>
                      <strong className="text-amber-300">Measured:</strong> {comp.label}
                    </span>
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-mono font-bold uppercase">
                    Initial dB
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  💡 {activeProfile.description}
                </p>
              </>
            );
          })()}
        </div>
      </div>

      {/* Wall Material Selector */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <label className="text-sm font-bold text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            2. Choose Wall Material (Absorption vs. Reflection):
          </span>
          <span className="text-xs text-emerald-400 font-medium">Try different surfaces!</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(Object.keys(MATERIALS) as MaterialType[]).map((matKey) => {
            const mat = MATERIALS[matKey];
            const isSelected = material === matKey;
            return (
              <button
                key={matKey}
                type="button"
                onClick={() => onMaterialChange(matKey)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/30 shadow-md'
                    : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">{mat.icon}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        mat.reflectivity > 0.7
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : mat.reflectivity > 0.2
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {Math.round(mat.reflectivity * 100)}% Bounce
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs mb-1">{mat.name}</h4>
                  <p className="text-[11px] text-slate-400 leading-tight">{mat.kidNote}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Environment / Air Medium Selector */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <label className="text-sm font-bold text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            3. Air Environment & Speed of Sound:
          </span>
          <span className="text-xs text-sky-400 font-medium">Temperature changes sound speed!</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(Object.keys(ENVIRONMENTS) as EnvironmentType[]).map((envKey) => {
            const env = ENVIRONMENTS[envKey];
            const isSelected = environment === envKey;
            return (
              <button
                key={envKey}
                type="button"
                onClick={() => onEnvironmentChange(envKey)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-400 ring-2 ring-sky-400/30 shadow-md'
                    : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{env.icon}</span>
                  <span className="font-bold text-xs text-slate-200 truncate">{env.temperatureDesc}</span>
                </div>
                <div className="text-[11px] font-mono text-sky-300 font-bold">
                  {env.speedOfSound > 0 ? `${env.speedOfSound} m/s` : '0 m/s (Vacuum)'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulation Controls: Speed, Molecules, Audio Mute, Pause */}
      <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Speed Slider / Slow Mo */}
        <div className="flex items-center gap-2.5">
          <span className="text-slate-300 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Watch Speed:
          </span>
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => onSpeedFactorChange(0.1)}
              className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                speedFactor <= 0.1 ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              0.1x (Slow-Mo)
            </button>
            <button
              type="button"
              onClick={() => onSpeedFactorChange(0.25)}
              className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                speedFactor > 0.1 && speedFactor <= 0.35 ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              0.25x (Easy to See)
            </button>
            <button
              type="button"
              onClick={() => onSpeedFactorChange(1.0)}
              className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                speedFactor >= 0.8 ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              1.0x (Real-Time)
            </button>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          {/* Air Molecules Toggle */}
          <button
            type="button"
            onClick={onToggleMolecules}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
              showMolecules
                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle visualization of vibrating air molecules"
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Air Molecules: {showMolecules ? 'ON' : 'OFF'}</span>
          </button>

          {/* Pause / Resume */}
          <button
            type="button"
            onClick={onTogglePause}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 font-medium cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Resume' : 'Freeze'}</span>
          </button>

          {/* Audio Mute */}
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg border cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute Sound' : 'Mute Classroom Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
