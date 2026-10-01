export type SoundType = 'yell' | 'clap' | 'whistle' | 'drum' | 'yodel' | 'bat';

export type MaterialType = 'rock' | 'brick' | 'trees' | 'curtain';

export type EnvironmentType = 'air_warm' | 'air_normal' | 'air_cold' | 'space';

export interface SoundWave {
  id: string;
  startX: number; // canvas x coordinate of origin
  startY: number; // canvas y coordinate of origin
  startTime: number; // timestamp in simulation seconds
  radius: number; // current radius in meters
  maxRadius: number; // maximum travel distance in meters
  isReflected: boolean;
  wallHitX?: number; // x coordinate where it reflected
  reflectionOriginX?: number; // virtual center of reflected wave
  amplitude: number; // loudness 0-1
  materialReflectivity: number; // reflectivity of hit material
  color: string;
  soundType: SoundType;
  hasPlayedEcho: boolean;
  echoTriggerDistance?: number;
}

export interface MaterialInfo {
  id: MaterialType;
  name: string;
  icon: string;
  reflectivity: number; // 0 to 1
  absorption: number; // 0 to 1
  description: string;
  kidNote: string;
  wallColor: string;
  pattern: 'rock' | 'brick' | 'forest' | 'foam';
}

export interface EnvironmentInfo {
  id: EnvironmentType;
  name: string;
  speedOfSound: number; // in meters per second
  temperatureDesc: string;
  icon: string;
  description: string;
  kidFact: string;
}

export interface Challenge {
  id: string;
  title: string;
  icon: string;
  goal: string;
  hint: string;
  completed: boolean;
  check: (state: {
    distance: number;
    material: MaterialType;
    environment: EnvironmentType;
    loudness: number;
    echoDb?: number;
    soundCount: number;
    lastEchoTime: number | null;
  }) => boolean;
}
