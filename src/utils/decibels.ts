import { MaterialType, EnvironmentType, SoundType } from '../types';
import { MATERIALS } from '../data/simulationData';

export interface DecibelComparison {
  minDb: number;
  maxDb: number;
  label: string;
  emoji: string;
  color: string;
}

export interface SoundDbProfile {
  minDb: number; // At loudness level 1 (measured at 1m reference distance)
  maxDb: number; // At loudness level 10 (measured at 1m reference distance)
  description: string;
  realWorldExample: string;
}

/**
 * Acoustically calibrated sound pressure level (SPL) at 1 meter reference distance (L_0)
 */
export const SOUND_DB_PROFILES: Record<SoundType, SoundDbProfile> = {
  drum: {
    minDb: 60,
    maxDb: 105,
    description: 'Bass drum strike produces intense acoustic pressure pulses up to 105 dB SPL at 1m!',
    realWorldExample: 'Like a marching band bass drum or thunder clap!',
  },
  yodel: {
    minDb: 54,
    maxDb: 96,
    description: 'Alpine yodel voice projection resonates across open canyons up to 96 dB SPL at 1m!',
    realWorldExample: 'Like a mountain yodeler echoing across Swiss peaks!',
  },
  yell: {
    minDb: 48,
    maxDb: 86,
    description: 'Shouting "HELLO!" with a megaphone reaches up to 86 dB SPL at 1m.',
    realWorldExample: 'Like a recess cheer on the elementary school playground!',
  },
  clap: {
    minDb: 42,
    maxDb: 78,
    description: 'Hand clap is a quick impulse wave reaching up to 78 dB SPL at 1m.',
    realWorldExample: 'Like applauding loudly in an auditorium.',
  },
  whistle: {
    minDb: 40,
    maxDb: 75,
    description: 'High-pitch tone reaches up to 75 dB SPL at 1m.',
    realWorldExample: 'Like a referee whistle or songbird tweet.',
  },
  bat: {
    minDb: 38,
    maxDb: 70,
    description: 'High-frequency ultrasonic chirp (audible simulation) reaches up to 70 dB SPL at 1m.',
    realWorldExample: 'Like a bat echolocation ping in a dark cave.',
  },
};

export const DECIBEL_SCALE: DecibelComparison[] = [
  { minDb: 0, maxDb: 24, label: 'Silent / Rustling Leaves (Near Noise Floor)', emoji: '🍃', color: '#64748b' },
  { minDb: 25, maxDb: 40, label: 'Quiet Library Whisper', emoji: '🤫', color: '#38bdf8' },
  { minDb: 41, maxDb: 55, label: 'Quiet Room / Gentle Rain', emoji: '🌧️', color: '#10b981' },
  { minDb: 56, maxDb: 70, label: 'Normal Classroom Talk', emoji: '🗣️', color: '#facc15' },
  { minDb: 71, maxDb: 85, label: 'Loud Shout / Cafeteria', emoji: '📢', color: '#f97316' },
  { minDb: 86, maxDb: 110, label: 'Bass Drum / Stadium Cheer', emoji: '⚡', color: '#ef4444' },
];

export function getDecibelComparison(db: number): DecibelComparison {
  for (const item of DECIBEL_SCALE) {
    if (db >= item.minDb && db <= item.maxDb) {
      return item;
    }
  }
  return DECIBEL_SCALE[0];
}

/**
 * Calculates initial sound level in decibels (dB SPL at 1m) from sound preset and 1-10 loudness slider
 */
export function getInitialDb(soundType: SoundType = 'yell', loudness: number = 7): number {
  const profile = SOUND_DB_PROFILES[soundType] || SOUND_DB_PROFILES.yell;
  const clampedLoudness = Math.max(1, Math.min(10, loudness));
  const fraction = (clampedLoudness - 1) / 9;
  return Math.round(profile.minDb + fraction * (profile.maxDb - profile.minDb));
}

export interface AcousticCalculationResult {
  initialDb: number;
  echoDb: number;
  roundTripMeters: number;
  geometricLossDb: number; // Inverse-square law: 20*log10(r/r0)
  airAbsorptionLossDb: number; // ISO 9613-1: alpha * r
  materialLossDb: number; // Reflection law: -10*log10(R)
  totalLossDb: number;
  isAudible: boolean;
  audibilityNote: string;
}

/**
 * Calculates the return echo decibel level using exact acoustic physics:
 *
 * 1. INVERSE-SQUARE LAW (Geometric Spherical Spreading):
 *    Intensity I(r) = P / (4 * pi * r^2)
 *    Sound Pressure Level drop: Delta L_geom = 20 * log10(r_total / r_0)
 *    where r_total = 2 * distance (round trip), and r_0 = 1.0 meter reference.
 *    -> Exactly drops 6.02 dB per doubling of distance!
 *
 * 2. ATMOSPHERIC AIR ABSORPTION (ISO 9613-1):
 *    Sound dissipation in air from molecular relaxation (N2 and O2) and viscosity:
 *    Delta L_air = alpha * r_total  (at ~1kHz, alpha ≈ 0.005 dB/meter)
 *
 * 3. BOUNDARY REFLECTION LAW:
 *    Surface reflection energy ratio R = 1 - alpha_absorption
 *    Delta L_material = -10 * log10(R)
 *
 * Total Echo SPL:
 *    L_echo = L_0 - Delta L_geom - Delta L_air - Delta L_material
 */
export function calculateEchoDecibels(
  initialDb: number,
  distanceMeters: number,
  material: MaterialType,
  environment: EnvironmentType
): AcousticCalculationResult {
  if (environment === 'space') {
    return {
      initialDb: 0,
      echoDb: 0,
      roundTripMeters: distanceMeters * 2,
      geometricLossDb: 0,
      airAbsorptionLossDb: 0,
      materialLossDb: 0,
      totalLossDb: 0,
      isAudible: false,
      audibilityNote: 'Zero decibels! No air molecules to carry sound energy.',
    };
  }

  // Total round-trip distance traveled through air:
  const roundTripMeters = 2 * distanceMeters;
  const referenceDistanceMeters = 1.0; // Standard 1m acoustic reference

  // 1. INVERSE-SQUARE LAW (Spherical Geometric Spreading)
  // Delta L_geom = 20 * log10(2d / 1.0)
  const geometricLossDb = Math.round(
    20 * Math.log10(roundTripMeters / referenceDistanceMeters) * 10
  ) / 10;

  // 2. ATMOSPHERIC ATTENUATION (ISO 9613-1 at ~1kHz, 20°C, 50% RH)
  // alpha ≈ 0.005 dB/meter
  const alphaAir = 0.005;
  const airAbsorptionLossDb = Math.round(alphaAir * roundTripMeters * 10) / 10;

  // 3. SURFACE REFLECTION LAW
  // Delta L_material = -10 * log10(R)
  const matInfo = MATERIALS[material];
  const reflectivity = Math.max(0.01, Math.min(0.99, matInfo.reflectivity));
  const materialLossDb = Math.round(-10 * Math.log10(reflectivity) * 10) / 10;

  // Total acoustic loss
  const totalLossDb = Math.round((geometricLossDb + airAbsorptionLossDb + materialLossDb) * 10) / 10;
  const rawEchoDb = Math.round((initialDb - totalLossDb) * 10) / 10;

  // Ambient acoustic noise floor in typical quiet outdoors / classroom is ~22 to 25 dB SPL
  const echoDb = Math.max(0, rawEchoDb);
  const isAudible = rawEchoDb >= 24;

  let audibilityNote = 'Clear and audible to human ears!';
  if (!isAudible) {
    audibilityNote = 'Too faint! Below ambient background noise (under 24 dB).';
  } else if (rawEchoDb < 38) {
    audibilityNote = 'Soft whisper-level echo.';
  } else if (rawEchoDb > 60) {
    audibilityNote = 'Strong, booming echo!';
  }

  return {
    initialDb,
    echoDb,
    roundTripMeters,
    geometricLossDb,
    airAbsorptionLossDb,
    materialLossDb,
    totalLossDb,
    isAudible,
    audibilityNote,
  };
}
