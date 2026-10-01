import React from 'react';
import { Challenge } from '../types';
import { Trophy, CheckCircle, Circle, X, Sparkles, HelpCircle } from 'lucide-react';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: Challenge[];
  onSelectHint: (hint: string) => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  challenges,
  onSelectHint,
}) => {
  if (!isOpen) return null;

  const completedCount = challenges.filter((c) => c.completed).length;
  const allDone = completedCount === challenges.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-purple-500/20 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                Echo Science Lab Missions
                {allDone && <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />}
              </h2>
              <p className="text-xs text-slate-400">
                Complete these 4th-grade experiments to earn your Echo Scientist Badge!
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

        {/* Progress Bar */}
        <div className="px-5 py-3 bg-slate-850/70 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            Missions Completed: <strong className="text-amber-400">{completedCount}</strong> of {challenges.length}
          </span>
          <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${(completedCount / challenges.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Challenge List */}
        <div className="p-5 space-y-3.5 overflow-y-auto">
          {challenges.map((challenge, idx) => (
            <div
              key={challenge.id}
              className={`p-4 rounded-xl border transition-all ${
                challenge.completed
                  ? 'bg-emerald-950/30 border-emerald-700/60 shadow-md'
                  : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{challenge.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      <span>Mission {idx + 1}: {challenge.title}</span>
                      {challenge.completed && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                          SOLVED! ⭐
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-snug">
                      {challenge.goal}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 mt-1">
                  {challenge.completed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Hint Accordion */}
              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  <strong className="text-slate-300">Teacher's Clue:</strong> {challenge.hint}
                </span>
              </div>
            </div>
          ))}

          {allDone && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-400/60 text-center space-y-2">
              <span className="text-3xl">🏆🎓🌟</span>
              <h3 className="font-black text-amber-300 text-base">
                SUPER ECHO SCIENTIST!
              </h3>
              <p className="text-xs text-slate-200">
                You successfully mastered distance, reflection, sound absorption, reverberation, and space acoustics! Great job!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Got it, Back to Lab!
          </button>
        </div>
      </div>
    </div>
  );
};
