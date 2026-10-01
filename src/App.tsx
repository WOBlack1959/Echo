import { useState, useEffect, useCallback } from 'react';
import { MaterialType, EnvironmentType, SoundType, Challenge } from './types';
import { INITIAL_CHALLENGES } from './data/simulationData';
import { EchoCanvas } from './components/EchoCanvas';
import { ControlPanel } from './components/ControlPanel';
import { EchoMeter } from './components/EchoMeter';
import { ChallengeModal } from './components/ChallengeModal';
import { ScienceGuideModal } from './components/ScienceGuideModal';
import { soundEngine } from './utils/audio';
import { triggerCelebrationConfetti } from './utils/confetti';
import { getInitialDb, calculateEchoDecibels } from './utils/decibels';
import { Trophy, BookOpen, Volume2, VolumeX, RotateCcw, Waves, Sparkles, HelpCircle, Activity } from 'lucide-react';

export default function App() {
  // Main simulation state
  const [distance, setDistance] = useState<number>(85); // 85 meters default (~1 soccer field)
  const [material, setMaterial] = useState<MaterialType>('rock');
  const [environment, setEnvironment] = useState<EnvironmentType>('air_normal');
  const [loudness, setLoudness] = useState<number>(7);
  const [speedFactor, setSpeedFactor] = useState<number>(0.25); // 0.25x is perfect for 4th graders to watch wave travel
  const [activeSound, setActiveSound] = useState<SoundType>('yell');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showMolecules, setShowMolecules] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [lastEchoTime, setLastEchoTime] = useState<number | null>(null);
  const [soundCount, setSoundCount] = useState<number>(0);

  // Modals state
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);

  // Trigger sound wave
  const handleTriggerSound = useCallback((soundType?: SoundType) => {
    const type = soundType || activeSound;
    window.dispatchEvent(
      new CustomEvent('sim-emit-sound', {
        detail: { soundType: type },
      })
    );
    setSoundCount((prev) => prev + 1);
  }, [activeSound]);

  // Spacebar keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is in input or modal
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        handleTriggerSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerSound]);

  // Check mission challenges upon state changes
  useEffect(() => {
    let newlyCompleted = false;
    const curInitialDb = getInitialDb(activeSound, loudness);
    const { echoDb } = calculateEchoDecibels(curInitialDb, distance, material, environment);

    setChallenges((prevChallenges) =>
      prevChallenges.map((ch) => {
        if (ch.completed) return ch;
        const isDone = ch.check({
          distance,
          material,
          environment,
          loudness,
          echoDb,
          soundCount,
          lastEchoTime,
        });
        if (isDone) {
          newlyCompleted = true;
          return { ...ch, completed: true };
        }
        return ch;
      })
    );

    if (newlyCompleted) {
      soundEngine.playSuccessChime();
      triggerCelebrationConfetti();
    }
  }, [distance, material, environment, loudness, activeSound, soundCount, lastEchoTime]);

  // Handle echo arrival
  const handleEchoDetected = useCallback((roundTripSeconds: number) => {
    setLastEchoTime(roundTripSeconds);
  }, []);

  // Reset to default
  const handleResetLab = () => {
    setDistance(85);
    setMaterial('rock');
    setEnvironment('air_normal');
    setLoudness(7);
    setSpeedFactor(0.25);
    setActiveSound('yell');
    setIsPaused(false);
    setShowMolecules(true);
    setLastEchoTime(null);
  };

  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & School Badge */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 font-black">
              <Waves className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  ECHO EXPLORER
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Grade 4 Science Lab
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive Sound Wave Reflection, Distance & Decibel (dB) Lab
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Missions Button */}
            <button
              type="button"
              onClick={() => setIsChallengeModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Lab Missions</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                {completedCount}/{challenges.length}
              </span>
            </button>

            {/* Science Guide Button */}
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-xs font-bold text-sky-300 hover:text-sky-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>How Echoes Work</span>
            </button>

            {/* Mute Audio Button */}
            <button
              type="button"
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                soundEngine.setMuted(nextMuted);
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Reset Lab Button */}
            <button
              type="button"
              onClick={handleResetLab}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Reset Simulation to Initial State"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Simulation Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Top Hint Bar for 4th Graders */}
        <div className="bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-base">🎒</span>
            <span>
              <strong className="text-amber-400">Classroom Lab Activity:</strong> Measure both{' '}
              <strong className="text-sky-300">Time Delay (Seconds)</strong> and{' '}
              <strong className="text-amber-300">Sound Strength (Decibels / dB)</strong>! Watch how sound loses energy traveling through air and bouncing off walls!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsChallengeModalOpen(true)}
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>View {challenges.length} Lab Missions</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Visual Simulation Canvas */}
        <section>
          <EchoCanvas
            distance={distance}
            onDistanceChange={setDistance}
            material={material}
            environment={environment}
            loudness={loudness}
            speedFactor={speedFactor}
            activeSound={activeSound}
            isPaused={isPaused}
            showMolecules={showMolecules}
            onEchoDetected={handleEchoDetected}
          />
        </section>

        {/* 2. Live Echo Science & Decibel Meter */}
        <section>
          <EchoMeter
            distance={distance}
            material={material}
            environment={environment}
            loudness={loudness}
            activeSound={activeSound}
            lastEchoTime={lastEchoTime}
          />
        </section>

        {/* 3. Interactive Controls Panel */}
        <section>
          <ControlPanel
            distance={distance}
            onDistanceChange={setDistance}
            material={material}
            onMaterialChange={setMaterial}
            environment={environment}
            onEnvironmentChange={setEnvironment}
            loudness={loudness}
            onLoudnessChange={setLoudness}
            speedFactor={speedFactor}
            onSpeedFactorChange={setSpeedFactor}
            activeSound={activeSound}
            onActiveSoundChange={setActiveSound}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((prev) => !prev)}
            showMolecules={showMolecules}
            onToggleMolecules={() => setShowMolecules((prev) => !prev)}
            isMuted={isMuted}
            onToggleMute={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              soundEngine.setMuted(nextMuted);
            }}
            onTriggerSound={handleTriggerSound}
          />
        </section>

        {/* Teacher's Corner & Classroom Inquiry Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Card 1: What is a Decibel? */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Activity className="w-4 h-4" />
              <h4>What is a Decibel (dB)?</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Decibels (dB) measure sound loudness and energy! A whisper is around 40 dB, normal talking is 60–70 dB, and a loud cheer is 80–100 dB. Notice how the return echo is always fewer dB than your initial yell!
            </p>
          </div>

          {/* Card 2: The 17 Meter Rule */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <span>📏</span>
              <h4>The 17-Meter Echo Secret</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              If the wall is closer than 17 meters (about 56 feet), the bounce returns in less than 0.1s. Human brains cannot tell the two sounds apart, merging them into a reverberation (reverb)!
            </p>
          </div>

          {/* Card 3: Bouncing vs Absorbing */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span>🧽</span>
              <h4>Why Do Soft Things Absorb?</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hard rocks reflect sound waves with almost zero loss. Soft foam and heavy curtains have millions of tiny air pockets that trap the sound vibrations, dropping the echo strength by over 20 decibels!
            </p>
          </div>

          {/* Card 4: Animal Superpowers */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <span>🦇</span>
              <h4>Echolocation in Nature</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bats measure both the <em>time delay</em> (distance) and the <em>decibel strength</em> (size of the insect) of returning echoes to hunt moths in total darkness!
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Echo Explorer · Elementary Science Standards (4-PS4-1 Waves, Amplitude, Wavelength & Energy Transfer)
          </span>
          <button
            type="button"
            onClick={() => setIsGuideModalOpen(true)}
            className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Interactive Science Guide & Pop Quiz</span>
          </button>
        </div>
      </footer>

      {/* Modals */}
      <ChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        challenges={challenges}
        onSelectHint={() => {}}
      />

      <ScienceGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}

