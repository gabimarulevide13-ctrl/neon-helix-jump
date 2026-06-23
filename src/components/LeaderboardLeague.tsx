/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Trophy, X, Shield, Medal, Award, Flame } from 'lucide-react';
import { sfx } from '../audio';
import { GameStats } from '../types';

interface LeaderboardLeagueProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
}

interface Rival {
  rank: number;
  name: string;
  score: number;
  league: string;
  badge: string;
}

export const LeaderboardLeague: React.FC<LeaderboardLeagueProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  const [rivals, setRivals] = useState<Rival[]>([]);

  useEffect(() => {
    // Generate lovely competitive list based on player stats
    const playerScore = Math.max(stats.highScore, 500);
    
    const sampleRivals: Rival[] = [
      { rank: 1, name: 'HelixMaster⚡️', score: Math.round(playerScore * 1.5 + 2500), league: 'Ligue Diamant 💎', badge: 'bg-indigo-500 text-white' },
      { rank: 2, name: 'ArcadeLegend_99', score: Math.round(playerScore * 1.25 + 800), league: 'Ligue Diamant 💎', badge: 'bg-blue-500 text-white' },
      // Rank 3 starts player or rival
      { rank: 3, name: 'VOUS (Joueur)', score: playerScore, league: 'Ligue Platine ✨', badge: 'bg-cyan-500 text-black border-2 border-cyan-300' },
      { rank: 4, name: 'CyberSkater99', score: Math.round(playerScore * 0.82), league: 'Ligue d\'Or 🏆', badge: 'bg-yellow-500 text-slate-950' },
      { rank: 5, name: 'NeonGravityX', score: Math.round(playerScore * 0.65), league: 'Ligue d\'Argent 🥈', badge: 'bg-slate-400 text-slate-950' },
      { rank: 6, name: 'QuickBall_FR', score: Math.round(playerScore * 0.44), league: 'Ligue de Bronze 🥉', badge: 'bg-amber-800 text-white' },
    ];

    // Reorder based on player score modification
    const sorted = sampleRivals.sort((a,b) => b.score - a.score).map((r, i) => ({
      ...r,
      rank: i + 1
    }));

    setRivals(sorted);
  }, [isOpen, stats.highScore]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#070b15]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border-2 border-[#8a2be2]/60 p-6 rounded-3xl shadow-[0_0_50px_rgba(138,43,226,0.3)] max-w-md w-full relative animate-fade-in flex flex-col">
        
        {/* Close Button */}
        <button 
          onClick={() => {
            sfx.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-all cursor-pointer border border-slate-705/50"
        >
          <X size={16} />
        </button>

        {/* Top Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-[#8a2be2]/10 border border-[#8a2be2]/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Trophy className="text-yellow-400 animate-pulse" size={26} />
          </div>
          <h3 className="text-xl font-black text-white italic tracking-tight uppercase">CLASSEMENT DE LA LIGUE</h3>
          <p className="text-[10px] text-slate-450 font-mono tracking-widest mt-0.5 uppercase">Helix Ultimate Cup • Saison 12</p>
        </div>

        {/* Competitor Board scrolling */}
        <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
          {rivals.map((r) => {
            const isPlayer = r.name.includes('VOUS');
            
            return (
              <div 
                key={r.rank}
                className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all select-none ${
                  isPlayer 
                    ? 'bg-gradient-to-r from-[#8a2be2]/20 via-[#ff00aa]/10 to-slate-900 border-pink-500 shadow-[0_0_15px_rgba(255,0,170,0.15)] animate-pulse' 
                    : 'bg-slate-900/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shadow-sm ${
                    r.rank === 1 ? 'bg-yellow-450 text-slate-950 font-mono scale-110 shadow-yellow-500/20' :
                    r.rank === 2 ? 'bg-slate-300 text-slate-950' : 
                    r.rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {r.rank}
                  </span>

                  <div className="flex flex-col text-left">
                    <span className={`text-xs font-bold ${isPlayer ? 'text-pink-400' : 'text-slate-200'}`}>{r.name}</span>
                    <span className="text-[9px] text-slate-400 font-mono tracking-wider">{r.league}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-black ${isPlayer ? 'text-pink-400' : 'text-slate-300'}`}>
                    {r.score.toLocaleString()} pt
                  </span>
                  {r.rank <= 3 && (
                    <Shield size={12} className={r.rank === 1 ? 'text-yellow-400' : r.rank === 2 ? 'text-slate-300' : 'text-amber-500'} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Promotion info banner */}
        <div className="mt-4 bg-[#0b0f19] p-3 text-center rounded-xl border border-slate-800 flex items-center gap-2">
          <Flame size={18} className="text-pink-500 animate-pulse shrink-0" />
          <p className="text-[10px] text-slate-400 font-mono text-left leading-tight">
            Le <strong className="text-pink-400">Top 3</strong> de la saison sera promu en <strong className="text-yellow-400">Ligue des Légendes</strong> ! Relevez des combos x3 pour accumuler un bonus de score !
          </p>
        </div>

      </div>
    </div>
  );
};
