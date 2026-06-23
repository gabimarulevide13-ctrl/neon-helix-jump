/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'MENU' | 'TUTORIAL' | 'PLAYING' | 'GAMEOVER' | 'SKINS' | 'PAUSED' | 'COSMIC_ASCENSION';

export interface Skin {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  type: 'color' | 'gradient' | 'emoji' | 'metallic';
  color: string;
  secondaryColor?: string;
  emoji?: string;
  metalness?: number;
  roughness?: number;
  perkName?: string;
  perkDesc?: string;
}

export interface GameStats {
  score: number;
  highScore: number;
  coins: number;
  level: number;
  currentCombo: number; // For cascading platform breaks
  fireballProgress: number; // Maxing out grants Fireball Mode
  isFireball: boolean;
}

export interface BallParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export type ChallengeDifficulty = 'facile' | 'moyen' | 'difficile' | 'legendaire' | 'hebdo' | 'evenement';

export interface Challenge {
  id: string;
  title: string;
  desc: string;
  difficulty: ChallengeDifficulty;
  rewardGems: number;
  rewardCoins?: number;
  rewardSkinId?: string;
  rewardTitle?: string;
  points: number; // points towards League advancement
}

