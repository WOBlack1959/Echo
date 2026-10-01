import React, { useState } from 'react';
import { BookOpen, X, Sparkles, Check, HelpCircle } from 'lucide-react';

interface ScienceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScienceGuideModal: React.FC<ScienceGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'laws' | 'animals' | 'quiz'>('basics');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  if (!isOpen) return null;

  const quizQuestions = [
    {
      q: 'What is sound made of?',
      options: [
        'Invisible wind blowing fast',
        'Vibrations traveling through air or other materials',
        'Tiny pieces of light',
      ],
      correct: 1,
      explanation: 'Sound is kinetic energy from vibrations that bump neighboring air molecules into one another!',
    },
    {
      q: 'Why can’t you hear an echo in a tiny closet?',
      options: [
        'The walls are too shy to answer',
        'The sound bounces back in less than 0.1s, so your brain blends it with your voice',
        'Sound cannot bounce off closet walls',
      ],
      correct: 1,
      explanation: 'Our brains need at least 0.1 seconds (about 17 meters / 56 ft away) to perceive a reflection as a distinct second sound!',
    },
    {
      q: 'Which material absorbs the most sound?',
      options: [
        'Granite canyon rock',
        'Solid brick wall',
        'Fluffy acoustic foam and heavy curtains',
      ],
      correct: 2,
      explanation: 'Soft, porous materials trap sound vibrations inside their fibers, turning the sound energy into tiny bits of heat!',
    },
    {
      q: 'Can an astronaut hear an echo on the surface of the Moon without a radio?',
      options: [
        'No, because space is a vacuum with no air molecules to vibrate',
        'Yes, because moon rocks are very bouncy',
        'Yes, but only if they shout very loudly',
      ],
      correct: 0,
      explanation: 'Sound CANNOT travel through empty space because there are no particles to carry the wave vibrations!',
    },
  ];

  const handleSelectQuiz = (qIdx: number, optIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) score++;
    });
    return score;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                How Do Echoes Work?
                <Sparkles className="w-4 h-4 text-sky-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Elementary Science Explained: Waves, Reflection, and Hearing!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-850 px-5 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'basics'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. The 4 Echo Steps 🌊
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('laws')}
            className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'laws'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Real Physics Laws & Formulas 📐
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('animals')}
            className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'animals'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Animals & Echolocation 🦇
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'quiz'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            4. 4th Grade Pop Quiz 📝
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'basics' && (
            <div className="space-y-4 text-slate-300 text-xs leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                    <span className="text-xl">🗣️</span> Step 1: The Vibration
                  </div>
                  <p>
                    When you shout "HELLO!", your vocal cords vibrate back and forth. They push against the air molecules in front of your mouth like dominos bumping into each other!
                  </p>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-extrabold text-sm">
                    <span className="text-xl">🌊</span> Step 2: The Sound Wave
                  </div>
                  <p>
                    The bumped molecules push their neighbors, creating an expanding ripple (sound wave) that travels through the air at roughly <strong className="text-sky-300">343 meters every second</strong>!
                  </p>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-extrabold text-sm">
                    <span className="text-xl">🏀</span> Step 3: The Bounce (Reflection)
                  </div>
                  <p>
                    When the wave hits a hard, rigid surface like a canyon cliff or gym wall, it cannot enter. Just like a bouncy rubber ball hitting a wall, the sound wave bounces straight backward!
                  </p>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                    <span className="text-xl">👂</span> Step 4: The Delayed Return
                  </div>
                  <p>
                    The reflected wave travels all the way back to your ears. Because it had to travel there AND back (double distance), it arrives a fraction of a second later: <strong className="text-emerald-300">an ECHO!</strong>
                  </p>
                </div>
              </div>

              {/* The 17 Meter Secret Callout */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 space-y-1.5">
                <h4 className="font-black text-sm flex items-center gap-2 text-amber-300">
                  <HelpCircle className="w-4 h-4" />
                  Why doesn't your bedroom or shower have an echo?
                </h4>
                <p className="text-slate-300">
                  Your human brain cannot separate two sounds if they arrive less than <strong className="text-amber-300">0.1 seconds</strong> apart!
                  Sound travels 34 meters in 0.1s. Divided by 2 (there and back), the wall must be at least <strong className="text-amber-300">17 meters (about 56 feet)</strong> away. Closer walls produce reverberation (reverb), not a distinct echo!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'laws' && (
            <div className="space-y-4 text-slate-300 text-xs leading-relaxed">
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3.5 text-sky-200">
                <span className="font-bold text-sm text-sky-300 flex items-center gap-1.5 mb-1">
                  <span>🔬</span> The Proper Scientific Laws of Acoustics
                </span>
                <p className="text-[12px] text-slate-300">
                  This simulation follows real-world physics equations from acoustic engineering and thermodynamic science:
                </p>
              </div>

              {/* Law 1: Speed of Sound */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
                    <span>🌡️</span> Law 1: The Rate Sound Travels (Speed of Sound)
                  </h4>
                  <code className="text-xs bg-slate-900 px-2 py-0.5 rounded text-amber-400 font-mono">
                    v = 331.3 + (0.606 × T) m/s
                  </code>
                </div>
                <p>
                  Sound travels by molecules bumping into their neighbors. When air is warmer, air molecules already have higher thermal speed, so they collide more frequently!
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-center">
                  <div className="bg-slate-900 p-2 rounded border border-slate-750">
                    <div className="text-slate-400">Winter (0°C)</div>
                    <div className="text-sky-300 font-bold">331.3 m/s</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-750">
                    <div className="text-slate-400">Room (20°C)</div>
                    <div className="text-emerald-300 font-bold">343.4 m/s</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-750">
                    <div className="text-slate-400">Summer (30°C)</div>
                    <div className="text-amber-300 font-bold">349.5 m/s</div>
                  </div>
                </div>
              </div>

              {/* Law 2: Inverse-Square Law */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-sky-300 flex items-center gap-2">
                    <span>📐</span> Law 2: The Inverse-Square Decibel Law (The 6 dB Rule)
                  </h4>
                  <code className="text-xs bg-slate-900 px-2 py-0.5 rounded text-sky-400 font-mono">
                    ΔL = 20 · log₁₀(2d / 1m)
                  </code>
                </div>
                <p>
                  Sound radiates in a 3D sphere. The surface area of a sphere is <strong className="text-sky-300">A = 4πr²</strong>. As the wave travels outward, the same sound energy is spread over a vastly larger sphere area.
                </p>
                <p className="bg-slate-900/90 p-2.5 rounded border border-slate-800 text-[11px]">
                  ⭐ <strong>The Golden Rule:</strong> Every single time the distance doubles (e.g. from 20m to 40m, or 50m to 100m), the sound pressure drops by exactly <strong className="text-amber-300">6.02 dB</strong>!
                </p>
              </div>

              {/* Law 3: Surface Reflection vs Absorption */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-purple-300 flex items-center gap-2">
                    <span>🪨</span> Law 3: Boundary Reflection Law (Energy Conservation)
                  </h4>
                  <code className="text-xs bg-slate-900 px-2 py-0.5 rounded text-purple-400 font-mono">
                    ΔL_wall = -10 · log₁₀(R)
                  </code>
                </div>
                <p>
                  When sound hits a wall, energy is conserved: <strong className="text-purple-300">Reflection (R) + Absorption (α) = 100%</strong>.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2 text-[11px]">
                  <li><strong>Hard Granite:</strong> R = 95% reflection → only 0.2 dB lost!</li>
                  <li><strong>Brick Wall:</strong> R = 85% reflection → 0.7 dB lost.</li>
                  <li><strong>Pine Forest:</strong> R = 20% reflection → 7.0 dB lost (branches scatter sound).</li>
                  <li><strong>Acoustic Foam:</strong> R = 3% reflection → 15.2 dB lost (trapped inside porous fibers as microscopic heat!).</li>
                </ul>
              </div>

              {/* Law 4: Air Absorption */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-emerald-300 flex items-center gap-2">
                    <span>💨</span> Law 4: Atmospheric Air Attenuation (ISO 9613-1)
                  </h4>
                  <code className="text-xs bg-slate-900 px-2 py-0.5 rounded text-emerald-400 font-mono">
                    ΔL_air = 0.005 dB/m × RoundTrip
                  </code>
                </div>
                <p>
                  As sound pushes through air, tiny amounts of wave energy are converted to heat through molecular relaxation of Nitrogen (N₂) and Oxygen (O₂) molecules.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'animals' && (
            <div className="space-y-4 text-slate-300 text-xs leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-pink-400 font-extrabold text-sm">
                  <span className="text-2xl">🦇</span> Bats and Echolocation
                </div>
                <p>
                  Micro-bats hunt in pitch-black night! Instead of relying on vision, they emit high-frequency ultrasonic chirps from their mouth or nose.
                </p>
                <p>
                  When the echo bounces off a tiny flying moth, the bat calculates:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
                  <li><strong>How long the echo took:</strong> How far away the insect is!</li>
                  <li><strong>Which ear heard it first:</strong> Which direction the insect is flying!</li>
                  <li><strong>How loud the return is:</strong> How big or plump the bug is!</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-extrabold text-sm">
                  <span className="text-2xl">🐬</span> Dolphins & Submarine SONAR
                </div>
                <p>
                  Dolphins and whales use clicking sounds underwater to find schools of fish. Sound travels over <strong className="text-sky-300">4 times faster in water (1,500 m/s)</strong> than in air because water molecules are packed tightly together!
                </p>
                <p>
                  Human scientists copied this animal superpower to create <strong className="text-sky-300">SONAR</strong> (Sound Navigation and Ranging) to map the deep ocean floor and find sunken shipwrecks!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 mb-2">
                Test your knowledge! Answer all 4 questions, then click "Check Answers":
              </div>

              {quizQuestions.map((q, qIdx) => (
                <div key={qIdx} className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="font-bold text-slate-200 text-xs">
                    {qIdx + 1}. {q.q}
                  </div>
                  <div className="space-y-1.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = quizAnswers[qIdx] === optIdx;
                      const isCorrect = q.correct === optIdx;
                      let btnStyle = 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750';
                      if (isSelected) {
                        btnStyle = 'bg-sky-500/20 border-sky-400 text-sky-300 font-semibold';
                      }
                      if (showQuizResults) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-rose-500/20 border-rose-400 text-rose-300';
                        }
                      }
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectQuiz(qIdx, optIdx)}
                          className={`w-full text-left p-2 rounded-lg border text-xs transition-colors cursor-pointer flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {showQuizResults && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                  {showQuizResults && (
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                {showQuizResults ? (
                  <div className="text-sm font-black text-amber-400">
                    Your Score: {calculateScore()} / {quizQuestions.length}{' '}
                    {calculateScore() === quizQuestions.length ? '🎉 PERFECT 100%!' : '⭐ Great effort!'}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    {Object.keys(quizAnswers).length} of {quizQuestions.length} answered
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setShowQuizResults(!showQuizResults)}
                  disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
                >
                  {showQuizResults ? 'Hide Answers' : 'Check Answers!'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">Elementary School Physical Science Unit: Sound Waves & Energy</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
