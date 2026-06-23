/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, GameStats, Skin, Challenge } from '../types';
import { sfx } from '../audio';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Sparkles, 
  Coins, 
  Volume2, 
  VolumeX, 
  ShoppingBag, 
  Check, 
  Lock, 
  ArrowLeft, 
  Tv, 
  Flame, 
  Gamepad2, 
  HeartHandshake,
  Pause,
  Settings,
  MapPin,
  Palette,
  X,
  Gift,
  Trash2,
  Shield,
  Award,
  User,
  Target,
  Zap,
  Gem,
  AlertTriangle
} from 'lucide-react';

import { DailyRewards } from './DailyRewards';
import { DailyMissions } from './DailyMissions';
import { LeaderboardLeague } from './LeaderboardLeague';
import { PlayerProfile } from './PlayerProfile';
import { BoutiqueShop } from './BoutiqueShop';

interface GameUIProps {
  gameState: GameState;
  stats: GameStats;
  skins: Skin[];
  selectedSkin: Skin;
  isMuted: boolean;
  onStartGame: () => void;
  onRestartLevel: () => void;
  onReviveWithAd: () => void;
  onSelectSkin: (skinId: string) => void;
  onBuySkin: (skinId: string) => void;
  onToggleMute: () => void;
  onFreeCoinsAd: () => void;
  onOpenSkinsMenu: () => void;
  onCloseSkinsMenu: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onQuitToMenu: () => void;
  activeChallenge: Challenge | null;
  onSelectChallenge: (challenge: Challenge | null) => void;
  challengeFailed: boolean;
}

export const GameUI: React.FC<GameUIProps> = ({
  gameState,
  stats,
  skins,
  selectedSkin,
  isMuted,
  onStartGame,
  onRestartLevel,
  onReviveWithAd,
  onSelectSkin,
  onBuySkin,
  onToggleMute,
  onFreeCoinsAd,
  onOpenSkinsMenu,
  onCloseSkinsMenu,
  onPauseGame,
  onResumeGame,
  onQuitToMenu,
  activeChallenge,
  onSelectChallenge,
  challengeFailed,
}) => {
  const [showTutorial, setShowTutorial] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [showLeague, setShowLeague] = useState(false);
  const [showChestModal, setShowChestModal] = useState(false);
  const [showNoAdsModal, setShowNoAdsModal] = useState(false);
  const [floatingTip, setFloatingTip] = useState<string | null>(null);

  // Modular state managers for premium features
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [showDailyMissions, setShowDailyMissions] = useState(false);
  const [showBoutiqueShop, setShowBoutiqueShop] = useState(false);
  const [showLeaderboardLeague, setShowLeaderboardLeague] = useState(false);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);

  // Virtual Gems and Name state synchronizer
  const [gems, setGems] = useState(250);
  const [playerName, setPlayerName] = useState('ArcadePlayer');

  useEffect(() => {
    const savedGems = localStorage.getItem('helix_gems_balance');
    if (savedGems) {
      setGems(parseInt(savedGems, 10));
    } else {
      setGems(250);
      localStorage.setItem('helix_gems_balance', '250');
    }
    const savedName = localStorage.getItem('helix_player_username');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, [showPlayerProfile]);

  const handleRewardClaimed = (type: 'coins' | 'gems' | 'skin', value: number, skinId?: string) => {
    if (type === 'coins') {
      const loops = Math.round(value / 50);
      for (let i = 0; i < loops; i++) {
        setTimeout(() => onFreeCoinsAd(), i * 60);
      }
    } else if (type === 'gems') {
      const nextGems = gems + value;
      setGems(nextGems);
      localStorage.setItem('helix_gems_balance', nextGems.toString());
    } else if (type === 'skin' && skinId) {
      onBuySkin(skinId);
    }
  };

  const handleMissionRewardClaimed = (value: number) => {
    const loops = Math.round(value / 50);
    // Add leftover gems reward or similar
    onFreeCoinsAd();
    if (value > 50) {
      setTimeout(() => onFreeCoinsAd(), 100);
    }
  };

  const showFloatingTip = (text: string) => {
    setFloatingTip(text);
    setTimeout(() => {
      setFloatingTip(null);
    }, 1800);
  };

  // --- POKI SDK INTEGRATION HELPERS ---
  // If integrating real Poki SDK, include these script variables in index.html
  // and trigger these functions. We leave comments and mock integration for a polished demo!
  const triggerPokiInterstitial = () => {
    console.log("PokiSDK: Commercial Break Triggered! (Interstitial ad displays)");
    /*
    if (typeof PokiSDK !== 'undefined') {
      PokiSDK.commercialBreak().then(() => {
        // Resume game / unmute audio
        sfx.setMute(isMuted);
      });
    }
    */
  };

  const triggerPokiRewarded = (onSuccess: () => void) => {
    console.log("PokiSDK: Rewarded Break Triggered! (Rewarded video displays)");
    /*
    if (typeof PokiSDK !== 'undefined') {
      PokiSDK.rewardedBreak().then((completed: boolean) => {
        if (completed) {
          onSuccess();
        }
      });
    } else {
      // Mock success for development preview
      onSuccess();
    }
    */
    onSuccess();
  };

  const handlePlayClick = () => {
    sfx.playClick();
    onStartGame();
  };

  const handleReviveClick = () => {
    sfx.playClick();
    triggerPokiRewarded(() => {
      onReviveWithAd();
    });
  };

  const handleReviveWithGemsClick = () => {
    if (gems >= 50) {
      sfx.playLevelUp();
      const nextGems = gems - 50;
      setGems(nextGems);
      localStorage.setItem('helix_gems_balance', nextGems.toString());
      onReviveWithAd();
      showFloatingTip("Sauvetage héroïque avec 50 💎 !");
    } else {
      sfx.playClick();
      showFloatingTip("Gemmes insuffisantes ! Faites des défis pour en collecter ! 💎");
    }
  };

  const handleGetCoinsClick = () => {
    sfx.playClick();
    triggerPokiRewarded(() => {
      onFreeCoinsAd();
    });
  };

  const handleRestartClick = () => {
    sfx.playClick();
    triggerPokiInterstitial();
    onRestartLevel();
  };

  return (
    <div id="game-ui-overlay" className="absolute inset-0 pointer-events-none z-10 font-sans flex flex-col justify-between p-4 select-none">
      
      {/* ==========================================================
          HEADER OPTIONS / HUD / SETTINGS (Always Visible Overlay) 
          ========================================================== */}
      <header className="w-full flex justify-between items-center pointer-events-auto z-30 select-none pb-2">
        <div className="flex gap-2.5 items-center">
          {/* Sfx / Music toggle - Hidden in MENU (handled inside settings) */}
          {gameState !== 'MENU' && (
            <button
              id="btn-mute-toggle"
              onClick={() => {
                sfx.playClick();
                onToggleMute();
              }}
              className="bg-black/60 backdrop-blur-md border border-white/10 p-2.5 rounded-full text-white hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer shadow-lg active:scale-95"
              title="Toggle Mute"
            >
              {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-emerald-400" />}
            </button>
          )}

          {/* Settings Gear Toggle Button for MENU State */}
          {gameState === 'MENU' && (
            <button
              id="btn-settings-toggle"
              onClick={() => {
                sfx.playClick();
                setShowSettings(true);
              }}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-705/60 p-2.5 rounded-full text-slate-200 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-xl active:scale-95"
              title="Réglages"
            >
              <Settings size={18} />
            </button>
          )}

          {/* Pause game toggle button */}
          {gameState === 'PLAYING' && (
            <button
              id="btn-pause-toggle"
              onClick={() => {
                sfx.playClick();
                onPauseGame();
              }}
              className="bg-black/60 backdrop-blur-md border border-white/10 p-2.5 rounded-full text-white hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer shadow-lg active:scale-95"
              title="Pause Game"
            >
              <Pause size={18} className="text-[#00d4ff]" />
            </button>
          )}
        </div>

        {/* HUB: Middle Center Section (Active Score) */}
        {gameState === 'PLAYING' && (
          <div className="flex flex-col items-center bg-black/60 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/10 shadow-xl">
            <span className="text-[9px] tracking-widest text-[#00d4ff] font-mono font-bold">CURRENT SCORE</span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)] font-mono leading-none mt-0.5">
              {stats.score}
            </span>
          </div>
        )}

        {/* Currency balances block inside header - styled like premium pills */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Gems counter display */}
          <div 
            onClick={() => {
              sfx.playClick();
              showFloatingTip("Gagnez des Gemmes dans les Récompenses ou Missions !");
            }}
            className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-705/60 px-3 py-1.5 rounded-full shadow-xl hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
          >
            <Gem size={12} className="text-[#00fff7] animate-pulse" />
            <span className="text-xs font-black font-mono text-[#00fff7]">{gems}</span>
          </div>

          {/* Gold Coins balance display */}
          <div 
            onClick={() => {
              sfx.playClick();
              setShowBoutiqueShop(true);
            }}
            className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-705/60 px-3 py-1.5 rounded-full shadow-xl hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
          >
            <Coins size={12} className="text-yellow-400 animate-bounce" />
            <span className="text-xs font-black font-mono text-yellow-400">{stats.coins}</span>
          </div>
        </div>
      </header>

      {/* ==========================================================
          1. MAIN MENU STATE (GORGEOUS FLOATING NEON BENTO INTERFACE)
          ========================================================== */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 pointer-events-auto flex flex-col justify-between pt-16 pb-4 z-10 animate-fade-in block bg-transparent">
          
          {/* Top Logo and Header credit titles in pure 3D styles */}
          <div className="text-center mt-3 flex flex-col items-center shrink-0">
            <h1 className="text-4xl xs:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#00fff7] via-[#8a2be2] to-[#ff00aa] drop-shadow-[0_0_20px_rgba(138,43,226,0.6)] animate-text-glow select-none uppercase font-sans">
              NEON HELIX JUMP
            </h1>
            <span className="text-[9px] font-mono font-black tracking-[0.25em] text-[#00d4ff] mt-1.5 block select-none">
              CYBER ARCADE EDITION
            </span>
          </div>

          {/* Central Section is transparent, showing the rotating 3D tower! */}
          <div className="flex-1 min-h-[140px]" />

          {/* Progress Indicator Slider section */}
          <div className="w-full max-w-sm mx-auto px-6 shrink-0">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 mb-1.5">
              <span className="text-xs font-black text-rose-450 font-mono">NIVEAU {stats.level} / 100</span>
              <span className="text-cyan-400 font-mono font-bold text-[9px] tracking-wider">RANG : PLATINE I</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              {[-2, -1, 0, 1, 2].map((offset) => {
                const mappedLevel = stats.level + offset;
                if (mappedLevel < 1) return null;
                const isCurrent = offset === 0;
                const isCompleted = offset < 0;
                return (
                  <div key={offset} className="flex-1 flex flex-col items-center">
                    <div className={`w-full h-1.5 rounded-full ${
                      isCurrent ? 'bg-gradient-to-r from-[#ff00aa] to-[#8a2be2]' :
                      isCompleted ? 'bg-[#00fff7]' : 'bg-slate-800'
                    }`} />
                    <span className={`text-[9px] font-mono mt-1 font-black ${isCurrent ? 'text-pink-400 scale-110' : 'text-slate-500'}`}>
                      L{mappedLevel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Giant play call-to-action button */}
          <div className="flex flex-col items-center mt-5 mb-2 shrink-0">
            <button
              onClick={handlePlayClick}
              className="relative px-12 py-4 bg-gradient-to-r from-[#ff5100] to-[#ff00aa] hover:from-[#ff6e00] hover:to-[#ff1fac] rounded-full border border-t-white/20 border-b-[4px] border-pink-900 font-extrabold tracking-wide text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_0_35px_rgba(255,0,170,0.55)] group shrink-0"
            >
              {/* Floating light sheen reflection across the button */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 animate-sheen" />
              </div>
              <div className="flex items-center justify-center gap-2.5">
                <Play fill="white" size={16} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-pulse" />
                <span className="text-base font-black italic tracking-wider uppercase font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                  PLAY NOW
                </span>
              </div>
            </button>
            <span className="text-[8px] font-mono text-slate-500 mt-2.5 uppercase tracking-widest">GLISSEZ LA SOURIS POUR PILOTER LE PILIER</span>
          </div>          {/* LOWER FIXED BENTO NAVBAR */}
          <footer className="w-full max-w-[240px] mx-auto bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-3xl p-2.5 flex justify-around items-center shadow-[0_10px_35px_rgba(0,0,0,0.8)] mt-4 mb-2 select-none">
            {/* 2. Missions panel */}
            <button
              onClick={() => { sfx.playClick(); setShowDailyMissions(true); }}
              className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700/50 flex items-center justify-center relative shadow-sm hover:scale-105 active:scale-95 transition-all">
                <Target size={16} className="text-[#facc15]" />
              </div>
              <span className="text-[8px] font-black uppercase font-mono tracking-wider">Missions</span>
            </button>

            {/* 3. Shop panel */}
            <button
              onClick={() => { sfx.playClick(); setShowBoutiqueShop(true); }}
              className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-[#8a2be2] border border-white/20 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                <ShoppingBag size={16} className="text-white" />
              </div>
              <span className="text-[8px] font-black uppercase font-mono tracking-wider text-pink-400 font-sans">Shop</span>
            </button>
          </footer>

        </div>
      )}

      {/* Legacy menu block (deactivated) */}
      {false && gameState === 'MENU' && (
        <div className="absolute inset-x-0 bottom-0 top-0 z-0 bg-gradient-to-b from-[#4cd5ff] via-[#35bfff] to-[#0486f0] pointer-events-auto flex flex-col justify-between overflow-y-auto overflow-x-hidden pt-20 animate-fade-in relative">
          
          {/* Subtle water ripple outlines and sky decals */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-[15%] left-[-15%] w-[130%] h-3 bg-white/10 rounded-full rotate-[-4deg] pointer-events-none animate-pulse" />
          <div className="absolute top-[48%] right-[-10%] w-[120%] h-4 bg-white/5 rounded-full rotate-[3deg] pointer-events-none" />

          {/* Floating Island on the Left - Exact Match with Image */}
          <div className="absolute left-1.5 bottom-[25%] sm:left-[8%] z-10 select-none animate-bounce" style={{ animationDuration: '4s' }}>
            {/* Ripples around the island base */}
            <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-28 h-6 rounded-full border-2 border-white/20 animate-ping opacity-40 pointer-events-none" />
            <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-[#1b3c63]/30 blur-sm pointer-events-none" />
            
            {/* The island structure (Green dome shape) */}
            <div className="relative w-28 h-18 rounded-[50%/60%] bg-gradient-to-b from-[#22c55e] to-[#15803d] border-b-8 border-[#14532d] shadow-2xl flex flex-col items-center justify-center">
              
              {/* Little wooden beach hut */}
              <div className="absolute top-[-26px] right-[16px] w-7 h-7 bg-[#a16207] border border-[#78350f] rounded-tr-md rounded-tl-md flex flex-col items-center">
                {/* Triangular straw roof */}
                <div className="absolute top-[-10px] w-9 h-3.5 bg-[#f59e0b] border-b border-amber-850 rounded-t-full rotate-6 shadow-sm" />
                <div className="w-2.5 h-3.5 bg-[#451a03] rounded-t-sm mt-3.5" />
              </div>

              {/* Tiny round green trees */}
              <div className="absolute top-[-15px] left-[10px] w-5 h-5 rounded-full bg-[#16a34a] border border-[#14532d]" />
              <div className="absolute top-[-24px] left-[20px] w-4 h-4 rounded-full bg-[#4ade80] border border-[#16a34a]" />
            </div>

            {/* Crossed-out "ADS" visual circular helper with Support banner */}
            <div className="absolute top-[-52px] left-[10px] flex flex-col items-center">
              <span className="bg-[#f97316] text-white font-mono font-black text-[7px] px-1.5 py-0.5 rounded-md uppercase border border-t-white/20 shadow-sm leading-none whitespace-nowrap mb-1 animate-pulse">
                Support the developer
              </span>
              <button
                onClick={() => {
                  sfx.playClick();
                  setShowNoAdsModal(true);
                }}
                className="w-12 h-12 rounded-full bg-white border-[3px] border-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                title="Soutenir / Supprimer Pubs"
              >
                <div className="relative flex items-center justify-center w-full h-full">
                  <span className="text-[#dc2626] font-black text-xs font-mono tracking-tighter leading-none select-none">ADS</span>
                  <div className="absolute w-9 h-[3px] bg-[#dc2626] rounded-full rotate-[-45deg]" />
                </div>
              </button>
            </div>
          </div>

          {/* ==========================================
              STAGGERED SELECT LEVEL TOWERS PATH
              ========================================== */}
          <section className="flex-1 flex flex-col items-center justify-center px-4 w-full my-auto space-y-12 pb-24 relative select-none z-10">
            
            {/* LEVEL 5 (LOCKED DARK PLATFORM + padlock) */}
            <div className="relative flex flex-col items-center group">
              {/* Tower structure column at the back */}
              <div className="relative">
                <div className="absolute bottom-[2px] w-14 h-4 border border-cyan-400/10 rounded-full pointer-events-none" />
                <div className="w-6 h-28 bg-gradient-to-r from-slate-200 via-white to-slate-300 shadow-inner rounded-md relative flex flex-col justify-end">
                  <div className="absolute top-[18px] left-[-8px] w-12 h-1.5 bg-white/70 rounded-full rotate-[15deg] shadow-sm" />
                  <div className="absolute top-[42px] right-[-8px] w-12 h-1.5 bg-white/60 rounded-full rotate-[-15deg] shadow-sm" />
                  <div className="absolute top-[68px] left-[-8px] w-12 h-1.5 bg-white/70 rounded-full rotate-[15deg] shadow-sm" />
                </div>
              </div>

              {/* Locked Disk Platform - Graphite Color with 5 */}
              <div className="relative -mt-24 z-10 flex flex-col items-center">
                <div className="w-22 h-8 rounded-[50%/35%] bg-[#374151] border-b-[5px] border-[#111827] flex items-center justify-center text-white/50 font-black text-sm select-none shadow-md">
                  {stats.level + 2}
                </div>
                {/* Padlock below platform */}
                <div className="bg-[#eab308] border border-[#d97706] rounded-md p-1 shadow-md -mt-1 flex items-center justify-center select-none animate-shiver">
                  <Lock size={10} className="text-white" fill="white" />
                </div>
              </div>
            </div>

            {/* SIDE BONUS TOWER (Mystery locked Chest of Level 5) - Positioned next to level 5 */}
            <div className="absolute right-[6%] top-[8%] z-10 hidden xs:flex flex-col items-center">
              {/* Pillar Column */}
              <div className="relative">
                <div className="absolute bottom-[2px] w-12 h-3 border border-cyan-400/10 rounded-full pointer-events-none" />
                <div className="w-5 h-20 bg-gradient-to-r from-slate-300 via-white to-slate-400 shadow-inner rounded-md relative flex flex-col justify-end">
                  <div className="absolute top-[12px] left-[-6px] w-9 h-1 bg-white/70 rounded-full rotate-[15deg]" />
                  <div className="absolute top-[32px] right-[-6px] w-9 h-1 bg-white/60 rounded-full rotate-[-15deg]" />
                </div>
              </div>

              {/* Bonus platform with treasure chest */}
              <div 
                onClick={() => {
                  sfx.playClick();
                  setShowChestModal(true);
                }}
                className="relative -mt-16 z-10 flex flex-col items-center cursor-pointer group"
              >
                {/* Golden & Brown Chest Model mimicking 3D graphic */}
                <div className="w-11 h-9 bg-[#a16207] border-2 border-[#78350f] rounded-lg shadow-xl relative flex flex-col items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="absolute top-[40%] left-0 w-full h-[3px] bg-[#451a03]" />
                  <div className="absolute top-[40%] w-3 h-3 bg-[#f59e0b] border border-amber-950 rounded-sm flex items-center justify-center">
                    <Lock size={6} className="text-[#a16207]" />
                  </div>
                  {/* Glowing glow aura */}
                  <div className="absolute inset-0 bg-[#f59e0b]/20 blur-md rounded-full -z-10 animate-pulse" />
                </div>

                {/* platform base */}
                <div className="w-14 h-4 rounded-[50%/35%] bg-slate-800 border-b-2 border-slate-950 flex items-center justify-center text-[7px] text-white/40 font-black shadow-sm mt-0.5">
                  BONUS
                </div>
                {/* small locked lock */}
                <div className="bg-[#eab308] border border-[#d97706] rounded-md p-0.5 shadow-sm -mt-1 flex items-center justify-center">
                  <Lock size={7} className="text-white" fill="white" />
                </div>
              </div>
            </div>

            {/* LEVEL 4 (LOCKED DARK PLATFORM + padlock) */}
            <div className="relative flex flex-col items-center">
              {/* Column */}
              <div className="relative">
                <div className="absolute bottom-[2px] w-14 h-4 border border-cyan-400/10 rounded-full pointer-events-none" />
                <div className="w-6 h-28 bg-gradient-to-r from-slate-200 via-white to-slate-300 shadow-inner rounded-md relative flex flex-col justify-end">
                  <div className="absolute top-[18px] left-[-8px] w-12 h-1.5 bg-white/70 rounded-full rotate-[15deg] shadow-sm" />
                  <div className="absolute top-[42px] right-[-8px] w-12 h-1.5 bg-white/60 rounded-full rotate-[-15deg] shadow-sm" />
                  <div className="absolute top-[68px] left-[-8px] w-12 h-1.5 bg-white/70 rounded-full rotate-[15deg] shadow-sm" />
                </div>
              </div>

              {/* Locked Disk Platform - Graphite with 4 */}
              <div className="relative -mt-24 z-10 flex flex-col items-center">
                <div className="w-22 h-8 rounded-[50%/35%] bg-[#374151] border-b-[5px] border-[#111827] flex items-center justify-center text-white/50 font-black text-sm select-none shadow-md">
                  {stats.level + 1}
                </div>
                {/* Padlock below platform */}
                <div className="bg-[#eab308] border border-[#d97706] rounded-md p-1 shadow-md -mt-1 flex items-center justify-center select-none animate-shiver">
                  <Lock size={10} className="text-white" fill="white" />
                </div>
              </div>
            </div>

            {/* LEVEL 3 (ACTIVE LEVEL - ORANGE THEME PLATFORM + PLAY BUTTON + CLAW BALL) */}
            <div className="relative flex flex-col items-center">
              {/* Splash ripples under active level */}
              <div className="absolute bottom-[-15px] w-32 h-8 border-2 border-white/30 rounded-full animate-ping opacity-70 pointer-events-none" />
              <div className="absolute bottom-[-15px] w-24 h-6 border border-white/40 rounded-full pointers-events-none" />

              {/* Central Pillar Column */}
              <div className="relative">
                <div className="w-7 h-30 bg-gradient-to-r from-slate-200 via-white to-slate-300 shadow-inner rounded-md flex flex-col justify-end relative">
                  <div className="absolute top-[18px] left-[-10px] w-14 h-2 bg-white/80 rounded-full rotate-[15deg] shadow-sm" />
                  <div className="absolute top-[44px] right-[-10px] w-14 h-2 bg-white/70 rounded-full rotate-[-15deg] shadow-sm" />
                  <div className="absolute top-[72px] left-[-10px] w-14 h-2 bg-white/80 rounded-full rotate-[15deg] shadow-sm" />
                </div>
              </div>

              {/* Current Unlocked Platform - Large vibrant yellow-orange design */}
              <div className="relative -mt-24 z-20 flex flex-col items-center">
                
                {/* Bouncing Player Skins Ball on top of the orange dial platform */}
                <div className="relative">
                  <div 
                    className="w-5 h-5 rounded-full shadow-lg border-2 border-white absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce flex items-center justify-center text-[10px]"
                    style={{
                      background: selectedSkin.type === 'gradient'
                        ? `linear-gradient(135deg, ${selectedSkin.color}, ${selectedSkin.secondaryColor})`
                        : selectedSkin.color,
                      boxShadow: `0 0 12px ${selectedSkin.color}`,
                      animationDuration: '0.8s'
                    }}
                  >
                    {selectedSkin.type === 'emoji' && (
                      <span className="text-xs leading-none">{selectedSkin.emoji}</span>
                    )}
                  </div>
                </div>

                {/* Main platform ring in exact golden-yellow styling */}
                <div 
                  onClick={handlePlayClick}
                  className="w-28 h-10 rounded-[50%/35%] bg-gradient-to-r from-[#fb923c] to-[#f97316] border-b-[6px] border-[#ea580c] flex items-center justify-center text-white font-black text-2xl drop-shadow-[0_4px_8px_rgba(234,88,12,0.5)] cursor-pointer hover:brightness-105 active:scale-95 transition-all select-none"
                >
                  {stats.level}
                </div>

                {/* LARGE PLAY BUTTON - Exact duplicate of Orange Play Capsule in the reference image */}
                <button
                  id="btn-play-game-map"
                  onClick={handlePlayClick}
                  className="mt-4 px-10 py-3 bg-[#e25c00] hover:bg-[#ff7214] rounded-full border-t border-white/20 border-b-[5px] border-[#a03600] font-black tracking-wide flex items-center justify-center gap-2 shadow-[0_6px_15px_rgba(226,92,0,0.6)] text-white hover:scale-105 active:scale-95 transition-all cursor-pointer select-none ring-4 ring-white/10"
                >
                  <Play fill="white" size={14} className="text-white drop-shadow-sm" />
                  <span className="text-sm font-black italic tracking-wider">PLAY</span>
                </button>
              </div>
            </div>

            {/* LEVEL 2 (GREEN COMPLETED PLATFORM) - Visible at the lowest node of the spiral selection scroll */}
            {stats.level > 1 && (
              <div className="relative flex flex-col items-center">
                {/* Column */}
                <div className="relative">
                  <div className="w-6 h-24 bg-gradient-to-r from-slate-200 via-white to-slate-300 shadow-inner rounded-md relative flex flex-col justify-end">
                    <div className="absolute top-[15px] left-[-8px] w-11 h-1 bg-white/60 rounded-full rotate-[15deg]" />
                    <div className="absolute top-[35px] right-[-8px] w-11 h-1 bg-white/50 rounded-full rotate-[-15deg]" />
                  </div>
                </div>

                {/* Completed platform - Green design */}
                <div className="relative -mt-20 z-10 flex flex-col items-center opacity-85">
                  <div className="w-20 h-6 rounded-[50%/35%] bg-[#22c55e] border-b-4 border-[#15803d] flex items-center justify-center text-white font-black text-xs shadow-md">
                    {stats.level - 1}
                  </div>
                  {/* check mark checkmark */}
                  <div className="mt-1 w-4 h-4 rounded-full bg-green-600 border border-green-300 flex items-center justify-center text-[8px] text-white font-black">
                    ✓
                  </div>
                </div>
              </div>
            )}
            
          </section>

          {/* Submerged Green Sphere representing Completed Level 2 sticking out from bottom */}
          <div className="absolute bottom-[-105px] left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-gradient-to-b from-[#22c55e] to-[#15803d] border-t-[8px] border-[#4ade80] opacity-90 -z-5 pointer-events-none flex flex-col items-center justify-start pt-[14px] shadow-2xl">
            <span className="text-[44px] font-black text-white/95 font-sans italic tracking-wide">2</span>
          </div>

          {/* Footer menu layout with the Three bright orange navigation shortcuts - Aligned perfectly */}
          <footer className="w-full flex justify-center items-center gap-6 sm:gap-10 pb-6 pt-2 px-4 z-20 relative select-none mt-auto pointer-events-auto">
            
            {/* MAP Action Circle Button */}
            <button
              id="footer-btn-map"
              onClick={() => {
                sfx.playClick();
                showFloatingTip("Déjà sur la Carte !");
              }}
              className="flex flex-col items-center gap-1 focus:outline-none group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-b from-[#f97316] to-[#ea580c] border-2 border-white flex items-center justify-center text-white shadow-[0_5px_12px_rgba(234,88,12,0.4)] hover:brightness-110 cursor-pointer ring-4 ring-orange-500/35">
                <MapPin size={20} fill="white" className="text-orange-100" />
              </div>
              <span className="text-[9px] uppercase tracking-wider font-mono font-black text-orange-950">MAP</span>
            </button>

            {/* SKINS Action Circle Button */}
            <button
              id="footer-btn-skins"
              onClick={() => {
                sfx.playClick();
                onOpenSkinsMenu();
              }}
              className="flex flex-col items-center gap-1 focus:outline-none group relative active:scale-95 transition-transform"
            >
              {/* Red notification exclamation mark badge */}
              <div className="absolute top-0 left-0 -translate-x-1 -translate-y-1 w-4.5 h-4.5 rounded-full bg-[#dc2626] border border-white text-white font-black flex items-center justify-center text-[10px] shadow-md z-30 animate-pulse">
                !
              </div>
              <div className="w-13 h-13 rounded-full bg-gradient-to-b from-[#f97316] to-[#ea580c] border-2 border-white flex items-center justify-center text-white shadow-[0_5px_12px_rgba(234,88,12,0.4)] hover:brightness-110 cursor-pointer">
                <Palette size={20} className="text-orange-100 animate-pulse" />
              </div>
              <span className="text-[9px] uppercase tracking-wider font-mono font-extrabold text-orange-950/80 group-hover:text-orange-950 transition-colors">SKINS</span>
            </button>

            {/* LEAGUE Action Circle Button */}
            <button
              id="footer-btn-league"
              onClick={() => {
                sfx.playClick();
                setShowLeague(true);
              }}
              className="flex flex-col items-center gap-1 focus:outline-none group relative active:scale-95 transition-transform"
            >
              {/* Red notification exclamation mark badge */}
              <div className="absolute top-0 left-0 -translate-x-1 -translate-y-1 w-4.5 h-4.5 rounded-full bg-[#dc2626] border border-white text-white font-black flex items-center justify-center text-[10px] shadow-md z-30 animate-pulse">
                !
              </div>
              <div className="w-13 h-13 rounded-full bg-gradient-to-b from-[#f97316] to-[#ea580c] border-2 border-white flex items-center justify-center text-white shadow-[0_5px_12px_rgba(234,88,12,0.4)] hover:brightness-110 cursor-pointer">
                <Trophy size={19} className="text-orange-100" />
              </div>
              <span className="text-[9px] uppercase tracking-wider font-mono font-extrabold text-[#113a69]">LEAGUE</span>
            </button>

          </footer>

        </div>
      )}

      {/* ==========================================================
          2. PLAYING RETRO HUD / FIREBAR OVERLAY
          ========================================================== */}
      {gameState === 'PLAYING' && (
        <React.Fragment>
          {/* Top progress tracker */}
          <div className="w-full max-w-md mx-auto mt-2 flex flex-col items-center px-4 pointer-events-auto">
            <div className="flex justify-between w-full text-xs font-mono font-bold mb-1">
              <span className="text-cyan-400">LEVEL {stats.level}</span>
              <span className="text-pink-400">LEVEL {stats.level + 1}</span>
            </div>
            
            {/* Horizontal completion tracking cylinder */}
            <div className="w-full h-2.5 bg-black/50 border border-white/10 rounded-full overflow-hidden p-[1px]">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-all duration-300"
                style={{ width: `${Math.min(((stats.score % 250) / 250) * 100, 100)}%` }}
              />
            </div>
            
            {/* Fireball Heat Indicator */}
            {stats.currentCombo > 0 && (
              <div className="mt-3 flex items-center justify-center gap-1.5 scale-95 animate-pulse bg-gradient-to-r from-amber-500/20 to-pink-500/20 px-3 py-1 rounded-full border border-amber-400/30">
                <Flame size={14} className="text-amber-400" />
                <span className="text-amber-400 text-xs font-bold font-mono tracking-wide">
                  COMBO X{stats.currentCombo} (+{stats.currentCombo * 10}!)
                </span>
              </div>
            )}

            {stats.isFireball && (
              <div className="mt-2 text-[10px] tracking-widest font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 bg-300% animate-pan-bg flex items-center gap-1">
                <Flame size={12} className="text-red-500 animate-spin" />
                <span>FIREBALL SUPERPOWER ACTIVE! DETONATE EVERYTHING!</span>
              </div>
            )}

            {/* Active Neon Challenge Tracker Overlay */}
            {activeChallenge && (
              <div className="mt-3.5 flex flex-col items-center bg-[#070b15]/90 border border-cyan-400/50 px-4 py-2.5 rounded-2xl w-full max-w-[280px] text-center shadow-[0_0_15px_rgba(0,243,255,0.15)] animate-fade-in">
                <div className="flex items-center gap-1 text-cyan-400 font-mono text-[9px] tracking-widest uppercase font-black">
                  <Zap size={11} className="text-yellow-400 animate-pulse fill-yellow-400" />
                  <span>DÉFI {challengeFailed ? "ÉCHOUÉ ❌" : "ACTIF ⚡"}</span>
                </div>
                <span className="text-xs font-black text-white mt-1 uppercase tracking-wider">{activeChallenge.title}</span>
                <span className="text-[9px] text-slate-350 leading-tight mt-0.5">{activeChallenge.desc}</span>
                {challengeFailed && (
                  <div className="mt-1.5 flex items-center gap-1 bg-red-950/80 border border-red-500/30 px-2 py-0.5 rounded-md text-[8px] text-red-400 font-bold tracking-wide">
                    <AlertTriangle size={10} />
                    <span>RÉGLEMENT VIOLÉ (recommencer)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* First run Swipe Instruction banner */}
          {showTutorial && (
            <div className="flex-1 flex flex-col justify-end items-center mb-10 animate-fade-in pointer-events-auto">
              <div className="bg-black/60 border border-white/10 px-6 py-4 rounded-3xl text-center backdrop-blur-md max-w-xs">
                <Gamepad2 size={24} className="text-cyan-400 mx-auto mb-2 animate-bounce" />
                <p className="text-sm font-bold text-white tracking-wide">Swipe gauche / droite</p>
                <p className="text-xs text-white/50 mt-1">Fais pivoter la tour néon pour aligner les ouvertures et descendre.</p>
                <button
                  onClick={() => {
                    sfx.playClick();
                    setShowTutorial(false);
                  }}
                  className="mt-3 bg-white/10 hover:bg-white/25 border border-white/15 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </React.Fragment>
      )}

      {/* ==========================================================
          3. SKINS STORE STATE OVERLAY 
          ========================================================== */}
      {gameState === 'SKINS' && (
        <section className="flex-1 flex flex-col justify-between pointer-events-auto animate-fade-in max-w-lg mx-auto w-full my-auto pb-6">
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header store */}
            <div className="flex justify-between items-center mb-6 pt-2">
              <button
                onClick={() => {
                  sfx.playClick();
                  onCloseSkinsMenu();
                }}
                className="bg-white/5 border border-white/10 p-2 rounded-xl text-white hover:bg-white/10 transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <Sparkles size={20} className="text-pink-400" />
                <span>BALL SKINS</span>
              </h2>
              {/* Spacer matching layout */}
              <div className="w-10" />
            </div>

            {/* Skins Grid List */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 xs:grid-cols-3 gap-3 min-h-[300px]">
              {skins.map((skin) => {
                const isSelected = skin.id === selectedSkin.id;
                return (
                  <div
                    key={skin.id}
                    className={`relative rounded-2xl border p-4 flex flex-col items-center justify-between text-center transition-all bg-white/5 ${
                      isSelected 
                        ? 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Visual 2D approximation of skin ball */}
                    <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg relative my-2 overflow-hidden border border-white/10"
                      style={{
                        background: skin.type === 'gradient'
                          ? `linear-gradient(135deg, ${skin.color}, ${skin.secondaryColor})`
                          : skin.color,
                        boxShadow: `0 8px 16px -4px ${skin.color}aa`,
                      }}
                    >
                      {/* Emoji element */}
                      {skin.type === 'emoji' && (
                        <span className="text-3xl leading-none">{skin.emoji}</span>
                      )}
                      
                      {/* Glossy overlay sheen for metallic balls */}
                      {skin.type === 'metallic' && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-white/40 skew-x-12 animate-sheen pointer-events-none" />
                      )}
                    </div>

                    {/* Skin Name */}
                    <div className="mt-2.5">
                      <p className="text-xs font-bold text-white tracking-wide truncate">{skin.name}</p>
                      <p className="text-[10px] text-white/40 uppercase font-mono mt-0.5">{skin.type}</p>
                    </div>

                    {/* Action button status */}
                    <div className="w-full mt-3">
                      {skin.unlocked ? (
                        isSelected ? (
                          <div className="w-full bg-pink-500/20 border border-pink-500/30 text-pink-400 font-extrabold text-xs py-1.5 rounded-xl flex items-center justify-center gap-1 shadow-sm">
                            <Check size={12} />
                            <span>EQUIPPE</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              sfx.playClick();
                              onSelectSkin(skin.id);
                            }}
                            className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs py-1.5 rounded-xl transition-all cursor-pointer select-none"
                          >
                            ÉQUIPER
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => {
                            if (stats.coins >= skin.cost) {
                              onBuySkin(skin.id);
                            } else {
                              sfx.playClick();
                              alert("Pas assez de pièces ! Regardez une publicité pour gagner des pièces.");
                            }
                          }}
                          className={`w-full font-bold text-xs py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            stats.coins >= skin.cost
                              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                              : 'bg-white/5 border border-white/5 text-white/30 cursor-not-allowed'
                          }`}
                        >
                          <Lock size={12} />
                          <Coins size={10} />
                          <span>{skin.cost}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick ad trigger in skins shop */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <button
              onClick={handleGetCoinsClick}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all border-none"
            >
              <Tv size={14} />
              <span>REGARDER UNE PUB : +50 PIÈCES GRATUITES</span>
            </button>
          </div>
        </section>
      )}

      {/* ==========================================================
          4. GAME OVER STATE 
          ========================================================== */}
      {gameState === 'GAMEOVER' && (
        <section className="flex-1 flex flex-col justify-center items-center pointer-events-auto animate-fade-in max-w-sm mx-auto w-full my-auto text-center px-4">
          <div className="bg-black/40 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full flex flex-col items-center">
            
            {/* Defeat Indicator */}
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
              <RotateCcw size={32} className="text-red-400" />
            </div>

            <h2 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
              GAME OVER
            </h2>
            <p className="text-xs text-white/40 tracking-widest font-mono uppercase mt-1">Vous avez touché l'obstacle !</p>

            {/* Scores summary */}
            <div className="w-full grid grid-cols-2 gap-3 my-6 pt-4 border-t border-b border-white/5 pb-4">
              <div className="flex flex-col bg-white/5 p-3 rounded-2xl">
                <span className="text-[10px] text-white/40 tracking-wider font-mono">FIN SCORE</span>
                <span className="text-2xl font-black text-cyan-400 font-mono">{stats.score}</span>
              </div>
              <div className="flex flex-col bg-white/5 p-3 rounded-2xl">
                <span className="text-[10px] text-white/40 tracking-wider font-mono">BEST RECORD</span>
                <span className="text-2xl font-black text-yellow-400 font-mono">{stats.highScore}</span>
              </div>
            </div>

            {/* Revive / Continue with Ad Button - Highly visible (Highlighted monetization target) */}
            <div className="flex flex-col gap-3 w-full">
              <button
                id="btn-ad-revive"
                onClick={handleReviveClick}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer border-t border-white/15"
              >
                <HeartHandshake size={18} className="animate-pulse" />
                <div className="flex flex-col items-start leading-tight text-left">
                  <span className="text-xs font-black">REVIVE AVEC UNE PUB</span>
                  <span className="text-[8px] text-white/70 font-bold uppercase tracking-wide">Reprendre la partie sans perdre le score</span>
                </div>
              </button>

              {/* Revive with Gems option */}
              <button
                id="btn-gem-revive"
                onClick={handleReviveWithGemsClick}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00b4f0] to-[#005fbc] hover:from-[#33c9ff] hover:to-[#0072e3] text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(0,180,240,0.35)] transition-all cursor-pointer border-t border-white/15"
              >
                <Gem size={18} className="text-[#00fff7] animate-pulse" />
                <div className="flex flex-col items-start leading-tight text-left">
                  <span className="text-xs font-black">REVIVE AVEC 50 <span className="text-[#00fff7] font-sans">💎</span></span>
                  <span className="text-[8px] text-white/70 font-bold uppercase tracking-wide">Sauvetage direct sans publicité ! (Solde: {gems} 💎)</span>
                </div>
              </button>

              {/* Restart Button */}
              <button
                id="btn-restart-game"
                onClick={handleRestartClick}
                className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
              >
                <RotateCcw size={16} />
                <span>RECOMMENCER</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ==========================================================
          5. PAUSE MENU STATE 
          ========================================================== */}
      {gameState === 'PAUSED' && (
        <section className="flex-1 flex flex-col justify-center items-center pointer-events-auto animate-fade-in max-w-sm mx-auto w-full my-auto text-center px-4">
          <div className="bg-black/80 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full flex flex-col items-center animate-fade-in">
            
            {/* Pause Indicator with glowing outline */}
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
              <Pause size={32} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            </div>

            <h2 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)] animate-pulse">
              PAUSE
            </h2>
            <p className="text-xs text-white/40 tracking-widest font-mono uppercase mt-1">Le jeu est suspendu</p>

            {/* Current Game Score summary card */}
            <div className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl my-6 flex flex-col items-center">
              <span className="text-[10px] text-white/40 tracking-wider font-mono uppercase mb-0.5">SCORE ACTUEL</span>
              <span className="text-3xl font-black text-cyan-400 font-mono tracking-wider">{stats.score}</span>
              <span className="text-[10px] text-white/30 font-mono mt-1">NIVEAU EN COURS : {stats.level}</span>
            </div>

            {/* Action Group for Pause Controls */}
            <div className="flex flex-col gap-3 w-full">
              {/* Resume Button */}
              <button
                id="btn-resume-game"
                onClick={() => {
                  sfx.playClick();
                  onResumeGame();
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all cursor-pointer border-t border-white/15 active:scale-95"
              >
                <Play fill="white" size={18} />
                <span>REPRENDRE</span>
              </button>

              {/* Quit and go back to Menu */}
              <button
                id="btn-quit-to-menu"
                onClick={() => {
                  sfx.playClick();
                  onQuitToMenu();
                }}
                className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <ArrowLeft size={16} />
                <span>QUITTER LE JEU</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ==========================================================
          4.5 COSMIC ASCENSION (LEVEL 100 COMPLETE PRESTIGE SCREEN)
          ========================================================== */}
      {gameState === 'COSMIC_ASCENSION' && (
        <section className="flex-1 flex flex-col justify-center items-center pointer-events-auto animate-fade-in max-w-lg mx-auto w-full my-auto text-center px-4">
          <div className="bg-[#0b0f19]/90 border border-amber-500/30 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] w-full flex flex-col items-center relative overflow-hidden">
            
            {/* Ambient gold pulse lights behind */}
            <div className="absolute top-[-30px] w-64 h-64 bg-amber-500/15 rounded-full filter blur-[50px] animate-pulse pointer-events-none" />
            
            {/* Crown reward highlight */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-bounce border-2 border-white/20">
              <span className="text-5xl">👑</span>
            </div>

            <h2 className="text-4xl font-extrabold italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              TRIOMPHE COSMIQUE
            </h2>
            <p className="text-[10px] text-amber-400 tracking-[0.25em] font-mono uppercase mt-1.5 font-bold">Maître Divin de la Tour Helix</p>
            
            <div className="my-6 text-sm text-white/80 space-y-4 max-w-md font-sans leading-relaxed text-center">
              <p>
                Incroyable ! Vous venez de dompter avec brio le <span className="font-extrabold text-amber-300">100e Niveau</span> ! Votre nom est désormais gravé au Panthéon des Légendes Hélix.
              </p>
              
              {/* Unlocked Reward Box */}
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col items-center gap-1.5 shadow-inner">
                <span className="text-xs font-mono font-bold text-amber-400">RÉCOMPENSE ULTIME DÉVERROUILLÉE</span>
                <span className="text-lg font-black text-white">Couronne Divinement Absolue</span>
                <span className="text-xs text-white/70 italic max-w-sm">
                  "Multiplicateurs doublés (Or Pur), Double Bouclier automatique par niveau, et +25% de bonus sur les points d'étage !"
                </span>
              </div>

              <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl text-xs text-white/60 text-left space-y-2">
                <div className="flex items-center gap-1 text-amber-300 font-bold">
                  <Sparkles size={14} />
                  <span>MODE PRESTIGE ENCLENCHÉ (NIVEAU 101+)</span>
                </div>
                <p>
                  Le voyage ne s'arrête pas là. Les prochains étages entrent dans un cycle de difficulté prestige sans limite : plateformes rotatives frénétiques, trap-colors piégeuses stroboscopiques multiples, vitesse accrue et chutes déstabilisantes !
                </p>
              </div>
            </div>

            {/* Prestige Progression Call to Action */}
            <div className="flex flex-col gap-3 w-full">
              <button
                id="btn-prestige-proceed"
                onClick={() => {
                  sfx.playClick();
                  onQuitToMenu();
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer border-t border-white/20 active:scale-95"
              >
                <Sparkles size={18} className="animate-spin" />
                <span className="font-mono tracking-tight uppercase">ENTRER EN MODE PRESTIGE (NIVEAU 101+)</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ==========================================================
          DYNAMIC OVERLAYS & MODALS (POPUP DIALOGS)
          ========================================================== */}

      {/* 1. Floating Toast Notifications */}
      {floatingTip && (
        <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 bg-[#0f172a]/95 text-white border border-slate-700 px-5 py-2.5 rounded-full font-black tracking-wide text-xs shadow-2xl animate-bounce pointer-events-none flex items-center gap-1.5 ring-4 ring-cyan-500/15">
          <Sparkles size={14} className="text-yellow-400" />
          <span>{floatingTip}</span>
        </div>
      )}

      {/* 2. Interactive Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#0f172a] border-2 border-slate-700 p-6 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] max-w-sm w-full relative animate-fade-in flex flex-col">
            <button 
              onClick={() => {
                sfx.playClick();
                setShowSettings(false);
                setResetConfirm(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 p-1.5 rounded-full transition-all cursor-pointer border border-slate-700/50"
            >
              <X size={16} />
            </button>

            <h3 className="text-xl font-black text-white italic tracking-tight mb-4 flex items-center gap-2">
              <Settings className="text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} size={22} />
              <span>RÉGLAGES</span>
            </h3>

            <div className="flex flex-col gap-4 mt-2">
              {/* Sounds Toggle */}
              <div className="bg-slate-850 p-4 rounded-2xl flex items-center justify-between border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Effets & Musique</span>
                  <span className="text-[10px] text-slate-400 font-mono">Audio global de l'arcade</span>
                </div>
                <button
                  onClick={() => {
                    sfx.playClick();
                    onToggleMute();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md text-xs font-bold font-mono active:scale-95 text-white"
                >
                  {isMuted ? (
                    <span className="text-red-400 flex items-center gap-1"><VolumeX size={14} /> COUPÉ</span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1"><Volume2 size={14} /> ACTIF</span>
                  )}
                </button>
              </div>

              {/* Reset Game Progress option */}
              <div className="bg-slate-850 p-4 rounded-2xl border border-red-950/20 flex flex-col gap-2">
                {!resetConfirm ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-rose-300 font-bold">Sécurité du profil</span>
                    <button
                      onClick={() => {
                        sfx.playClick();
                        setResetConfirm(true);
                      }}
                      className="w-full bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 font-bold text-[10px] py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono"
                    >
                      <Trash2 size={12} />
                      <span>RECOMMENCER LE JEU À ZÉRO</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 animate-bounce-short text-left">
                    <span className="text-[10px] text-red-400 font-black leading-tight">Attention ! Votre niveau, score, pièces et skins acquis seront réinitialisés de manière permanente.</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        onClick={() => {
                          sfx.playClick();
                          setResetConfirm(false);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-1.5 rounded-lg border border-slate-700 cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => {
                          sfx.playClick();
                          localStorage.clear();
                          window.location.reload();
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-1.5 rounded-lg cursor-pointer"
                      >
                        EFFACER
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Credits */}
              <div className="bg-[#0b0f19] p-3 text-center rounded-xl border border-slate-800 text-[10px] text-slate-500 font-mono">
                <span>Vite + React 18+ Arcades • v1.1.2</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. NoAds/Donation Sponsor Modal */}
      {showNoAdsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#0f172a] border-2 border-orange-500/60 p-6 rounded-3xl shadow-2xl max-w-sm w-full relative animate-fade-in flex flex-col text-center">
            <button 
              onClick={() => {
                sfx.playClick();
                setShowNoAdsModal(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 p-1.5 rounded-full transition-all cursor-pointer border border-slate-700/50"
            >
              <X size={16} />
            </button>

            <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-3">
              <Tv size={24} className="text-orange-400 animate-pulse" />
            </div>

            <h3 className="text-xl font-black text-white italic tracking-tight mb-2">
              SANS PUBLICITÉ !
            </h3>
            
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Soutenez notre jeu indépendant Helix Jump ! Un don bénévole fictif supprime les publicités et vous offre <strong className="text-yellow-400">+100 pièces gratuites</strong> pour acquérir des skins de balles !
            </p>

            <button
              onClick={() => {
                sfx.playClick();
                // Trigger free rewards twice to award 100 free coins total
                onFreeCoinsAd();
                setTimeout(() => {
                  onFreeCoinsAd();
                }, 80);
                setShowNoAdsModal(false);
                showFloatingTip("Sponsorisé ! +100 pièces accordées !");
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-xs py-3.5 rounded-2xl border-b-[4px] border-orange-700 active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              SOUTENIR GRATUITEMENT (+100 🪙)
            </button>
          </div>
        </div>
      )}

      {/* 4. Mystery Coin Chest Level Modal */}
      {showChestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#0f172a] border-2 border-amber-500/60 p-6 rounded-3xl shadow-2xl max-w-sm w-full relative animate-fade-in flex flex-col text-center">
            <button 
              onClick={() => {
                sfx.playClick();
                setShowChestModal(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 p-1.5 rounded-full transition-all cursor-pointer border border-slate-700/50"
            >
              <X size={16} />
            </button>

            <div className="relative w-15 h-13 bg-[#78350f] border-2 border-amber-900 rounded-lg shadow-xl mx-auto mb-3 flex flex-col items-center justify-center">
              <div className="absolute top-[40%] left-0 w-full h-[3px] bg-amber-950" />
              <Gift size={20} className="text-yellow-400 animate-bounce mt-1" />
              <div className="absolute inset-0 bg-yellow-400/25 blur-md rounded-full -z-10 animate-pulse" />
            </div>

            <h3 className="text-xl font-black text-white italic tracking-tight mb-2">
              COFFRE MYSTÈRE
            </h3>
            
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Ce coffre magique débordant d'or est scellé sous un cadenas légendaire. Atteignez le <strong className="text-orange-400">Niveau 5</strong> de la tour Helix pour l'ouvrir et piller <strong className="text-yellow-400">+150 pièces supplémentaires</strong> !
            </p>

            <button
              onClick={() => {
                sfx.playClick();
                if (stats.level >= 5) {
                  onFreeCoinsAd();
                  setTimeout(() => {
                    onFreeCoinsAd();
                  }, 80);
                  setTimeout(() => {
                    onFreeCoinsAd();
                  }, 160);
                  setShowChestModal(false);
                  showFloatingTip("Coffre dévalisé ! +150 pièces !");
                } else {
                  setShowChestModal(false);
                  showFloatingTip(`Atteins le Niveau 5 ! Actuel: ${stats.level}`);
                }
              }}
              className={`w-full text-xs font-black py-3 rounded-xl transition-all ${
                stats.level >= 5
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:scale-105 active:scale-95 text-[#0f172a] cursor-pointer shadow-lg font-bold'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed font-medium'
              }`}
            >
              {stats.level >= 5 ? "OUVRIR ET RÉCLAMER +150 🪙" : "SCELLÉ (REQUIS NIVEAU 5)"}
            </button>
          </div>
        </div>
      )}

      {/* 5. League Competitors Leaderboard Modal */}
      {showLeague && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#0f172a] border-2 border-sky-500/60 p-6 rounded-3xl shadow-2xl max-w-md w-full relative animate-fade-in flex flex-col">
            <button 
              onClick={() => {
                sfx.playClick();
                setShowLeague(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 p-1.5 rounded-full transition-all cursor-pointer border border-slate-700/50"
            >
              <X size={16} />
            </button>

            <h3 className="text-xl font-black text-white italic tracking-tight mb-2 flex items-center gap-2">
              <Trophy className="text-yellow-400 animate-pulse" size={20} />
              <span>CLASSEMENT DE LA LIGUE</span>
            </h3>
            <p className="text-[10px] text-slate-450 font-mono mb-4 uppercase">Saison en cours • Helix Ultimate Cup</p>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              
              {/* Rank 1 */}
              <div className="bg-slate-800/30 p-3 rounded-xl border border-yellow-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-yellow-400 text-black font-black text-xs flex items-center justify-center shadow-sm">1</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">HelixMaster3000</span>
                    <span className="text-[9px] text-yellow-400 font-mono tracking-wide">🏆 Ligue Diamant</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-white">15,200 pt</span>
              </div>

              {/* Rank 2 - Player dynamic stats */}
              <div className="bg-slate-800/90 p-3 rounded-xl border-2 border-cyan-400 flex items-center justify-between shadow-lg animate-pulse">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-400 text-black font-black text-xs flex items-center justify-center shadow-md">2</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-cyan-300">VOUS (Joueur)</span>
                    <span className="text-[9px] text-cyan-400 font-mono tracking-wide">✨ Ligue Platine</span>
                  </div>
                </div>
                <span className="text-sm font-mono font-black text-cyan-300">{Math.max(stats.highScore, 500)} pt</span>
              </div>

              {/* Rank 3 */}
              <div className="bg-slate-800/20 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center">3</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300">CyberSkater</span>
                    <span className="text-[9px] text-amber-500 font-mono tracking-wide">🏆 Ligue d'Or</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">4,800 pt</span>
              </div>

              {/* Rank 4 */}
              <div className="bg-slate-800/20 p-3 rounded-xl border border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-600 text-white font-black text-[10px] flex items-center justify-center">4</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400">NeonGravity</span>
                    <span className="text-[9px] text-slate-400 font-mono tracking-wide">🏆 Ligue d'Argent</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">3,500 pt</span>
              </div>

              {/* Rank 5 */}
              <div className="bg-slate-800/10 p-3 rounded-xl border border-slate-900 flex items-center justify-between opacity-80">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-950 text-white font-black text-[10px] flex items-center justify-center">5</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400">QuickBall_FR</span>
                    <span className="text-[9px] text-amber-900 font-mono tracking-wide">🏆 Ligue de Bronze</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600">1,200 pt</span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL VIEWS COMPONENT SYNCHRONIZERS
          ========================================================== */}
      {showDailyRewards && (
        <DailyRewards 
          onClose={() => setShowDailyRewards(false)} 
          onClaimReward={handleRewardClaimed}
          skins={skins}
        />
      )}

      {showDailyMissions && (
        <DailyMissions 
          onClose={() => setShowDailyMissions(false)} 
          onClaimReward={handleRewardClaimed}
          stats={stats}
          showFloatingTip={showFloatingTip}
          activeChallenge={activeChallenge}
          onSelectChallenge={onSelectChallenge}
          challengeFailed={challengeFailed}
        />
      )}

      {showLeaderboardLeague && (
        <LeaderboardLeague 
          onClose={() => setShowLeaderboardLeague(false)} 
          currentScore={stats.highScore}
        />
      )}

      {showPlayerProfile && (
        <PlayerProfile 
          onClose={() => setShowPlayerProfile(false)} 
          trophies={Math.max(stats.level * 3, 15)}
          score={stats.highScore}
        />
      )}

      {showBoutiqueShop && (
        <BoutiqueShop 
          isOpen={showBoutiqueShop}
          onClose={() => setShowBoutiqueShop(false)} 
          skins={skins}
          selectedSkin={selectedSkin}
          stats={stats}
          onSelectSkin={onSelectSkin}
          onBuySkin={onBuySkin}
          onRewardClaimed={handleRewardClaimed}
          showFloatingTip={showFloatingTip}
        />
      )}

      {/* Spacer margin used to anchor bottom */}
      <footer className="w-full text-center text-[10px] text-white/20 font-mono select-none py-2">
        <span>PROJET PROPRE PRÊT POUR INTEGRATION POKI SDK</span>
      </footer>

    </div>
  );
};
