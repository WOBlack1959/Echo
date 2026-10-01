import { MaterialInfo, EnvironmentInfo, MaterialType, EnvironmentType, SoundType, Challenge } from '../types';

export const MATERIALS: Record<MaterialType, MaterialInfo> = {
  rock: {
    id: 'rock',
    name: 'Hard Canyon Granite',
    icon: '⛰️',
    reflectivity: 0.95,
    absorption: 0.05,
    description: 'Rock is dense, stiff, and smooth. Sound energy cannot enter it, so almost all of it bounces right back!',
    kidNote: 'Super Loud Echo! 💥',
    wallColor: '#5c6479',
    pattern: 'rock',
  },
  brick: {
    id: 'brick',
    name: 'Brick Gymnasium Wall',
    icon: '🧱',
    reflectivity: 0.85,
    absorption: 0.15,
    description: 'Solid clay bricks provide a hard barrier that reflects clean, sharp sound waves.',
    kidNote: 'Clear & Crisp Echo 🔊',
    wallColor: '#b44a36',
    pattern: 'brick',
  },
  trees: {
    id: 'trees',
    name: 'Dense Pine Forest',
    icon: '🌲',
    reflectivity: 0.35,
    absorption: 0.65,
    description: 'Rough tree trunks, branches, and soft pine needles scatter sound in random directions and absorb vibrations.',
    kidNote: 'Faint & Whispering Echo 🍃',
    wallColor: '#2d6a4f',
    pattern: 'forest',
  },
  curtain: {
    id: 'curtain',
    name: 'Acoustic Foam & Curtains',
    icon: '🛋️',
    reflectivity: 0.08,
    absorption: 0.92,
    description: 'Fluffy porous fibers trap sound vibrations and turn their energy into tiny amounts of heat. No echo bounces back!',
    kidNote: 'Sound Absorber! Silent Bounce 🤫',
    wallColor: '#475569',
    pattern: 'foam',
  },
};

export const ENVIRONMENTS: Record<EnvironmentType, EnvironmentInfo> = {
  air_warm: {
    id: 'air_warm',
    name: 'Warm Summer Day (30°C / 86°F)',
    speedOfSound: 349.5,
    temperatureDesc: 'Hot & Fast',
    icon: '☀️',
    description: 'Higher temperature gives air molecules more kinetic energy to collide faster, increasing wave speed.',
    kidFact: 'Physics Formula: v = 331.3 + (0.606 × 30°C) = 349.5 m/s!',
  },
  air_normal: {
    id: 'air_normal',
    name: 'Classroom Air (20°C / 68°F)',
    speedOfSound: 343.4,
    temperatureDesc: 'Standard Room',
    icon: '🏫',
    description: 'Standard room temperature acoustic reference speed in dry air.',
    kidFact: 'Physics Formula: v = 331.3 + (0.606 × 20°C) = 343.4 m/s (768 mph)!',
  },
  air_cold: {
    id: 'air_cold',
    name: 'Freezing Winter Snow (0°C / 32°F)',
    speedOfSound: 331.3,
    temperatureDesc: 'Cold & Slower',
    icon: '❄️',
    description: 'Chilly air molecules have lower kinetic velocity, reducing acoustic propagation speed.',
    kidFact: 'Physics Formula: v = 331.3 + (0.606 × 0°C) = 331.3 m/s in freezing air.',
  },
  space: {
    id: 'space',
    name: 'Outer Space (Vacuum)',
    speedOfSound: 0,
    temperatureDesc: 'Vacuum (No Air)',
    icon: '🚀',
    description: 'Space is a vacuum with zero particle density (no molecules to vibrate). Sound cannot propagate.',
    kidFact: 'No medium = 0 m/s! Mechanical sound waves require particle collisions to travel.',
  },
};

export const SOUND_PRESETS: {
  type: SoundType;
  label: string;
  icon: string;
  emoji: string;
  color: string;
  maxDb: number;
  minDb: number;
}[] = [
  { type: 'drum', label: 'Drum Beat', icon: 'Disc', emoji: '🥁', color: '#ef4444', maxDb: 105, minDb: 60 },
  { type: 'yodel', label: 'Alpine Yodel', icon: 'Mountain', emoji: '🏔️', color: '#8b5cf6', maxDb: 96, minDb: 54 },
  { type: 'yell', label: 'Yell "HELLO!"', icon: 'Megaphone', emoji: '🗣️', color: '#f59e0b', maxDb: 86, minDb: 48 },
  { type: 'clap', label: 'Hand Clap', icon: 'Hand', emoji: '👏', color: '#3b82f6', maxDb: 78, minDb: 42 },
  { type: 'whistle', label: 'Whistle', icon: 'Music', emoji: '🎵', color: '#10b981', maxDb: 75, minDb: 40 },
  { type: 'bat', label: 'Bat Sonar Ping', icon: 'Radar', emoji: '🦇', color: '#ec4899', maxDb: 70, minDb: 38 },
];

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'The 1-Second Echo Delay',
    icon: '⏱️',
    goal: 'Make an echo take 1.0 second or more to return to your ears!',
    hint: 'Move the distance slider farther away! Remember: the sound has to travel there AND back (Round Trip).',
    completed: false,
    check: ({ distance, environment }) => {
      if (environment === 'space') return false;
      const speed = ENVIRONMENTS[environment].speedOfSound;
      const time = (2 * distance) / speed;
      return time >= 1.0;
    },
  },
  {
    id: 'c2',
    title: 'The Secret Sound Absorber',
    icon: '🧽',
    goal: 'Find the material that absorbs almost all sound energy so barely any echo returns!',
    hint: 'Which wall material has soft, fluffy fibers that trap vibrations instead of bouncing them?',
    completed: false,
    check: ({ material }) => material === 'curtain',
  },
  {
    id: 'c3',
    title: 'The 17-Meter Reverb Mystery',
    icon: '🔍',
    goal: 'Discover why small rooms do NOT have separate echoes! Move the wall closer than 17 meters.',
    hint: 'If a wall is closer than 17 meters, the bounce returns in less than 0.1s, blending into the original sound as "reverberation"!',
    completed: false,
    check: ({ distance }) => distance < 17,
  },
  {
    id: 'c4',
    title: 'Silence in Space',
    icon: '🌌',
    goal: 'Switch the environment to Outer Space and try to yell or clap!',
    hint: 'Sound needs vibrating molecules (like air) to travel. What happens when there are no molecules?',
    completed: false,
    check: ({ environment }) => environment === 'space',
  },
  {
    id: 'c5',
    title: 'The Booming Echo Test (60+ dB)',
    icon: '🔊',
    goal: 'Produce a strong return echo measuring 60 decibels (dB) or higher!',
    hint: 'Turn up the loudness slider, pick Hard Granite Cliff, and keep the wall close enough (e.g. 20m - 40m) so fewer decibels fade in the air!',
    completed: false,
    check: ({ echoDb }) => typeof echoDb === 'number' && echoDb >= 60,
  },
];
