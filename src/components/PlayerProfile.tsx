/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, X, Check, Save, ShieldAlert, Award, AwardIcon, Sparkles } from 'lucide-react';
import { sfx } from '../audio';
import { GameStats, Skin } from '../types';

interface PlayerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  skins: Skin[];
  selectedSkin: Skin;
  gems: number;
  showFloatingTip: (msg: string) => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  isOpen,
  onClose,
  stats,
  skins,
  selectedSkin,
  gems,
  showFloatingTip,
}) => {
  const [username, setUsername] = useState('Joueur Anonyme');
  const [gamesPlayed, setGamesPlayed] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const savedName = localStorage.getItem('helix_player_username') || 'ArcadePlayer';
    const savedPlayed = parseInt(localStorage.getItem('helix_missions_games_count') || '1', 10);
    
    setUsername(savedName);
    setTempName(savedName);
    setGamesPlayed(Math.max(savedPlayed, 1));
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSkinsUnlocked = skins.filter(s => s.unlocked).length;
  const skinsCompletionPct = Math.round((totalSkinsUnlocked / skins.length) * 100);

  const handleSaveName = () => {
    if (!tempName.trim()) {
      showFloatingTip("Nom d'utilisateur invalide !");
      return;
    }
    const cropped = tempName.trim().slice(0, 16);
    localStorage.setItem('helix_player_username', cropped);
    setUsername(cropped);
    setIsEditing(false);
    sfx.playLevelUp();
    showFloatingTip("Nom mis à jour !");
  };

  const badgesList = [
    { title: "Néo-Saut", desc: "Terminer le Niveau 1", completed: stats.level > 1 },
    { title: "Super Combo", desc: "Faire un combo x3", completed: parseInt(localStorage.getItem('helix_missions_max_combo') || '0', 10) >= 3 },
    { title: "Skins Collector", desc: "Débloquer 3 skins", completed: totalSkinsUnlocked >= 3 },
    { title: "Grave Millionnaire", desc: "Gagner 500 pièces", completed: stats.coins >= 500 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#070b15]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border-2 border-pink-500/60 p-6 rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.3)] max-w-md w-full relative animate-fade-in flex flex-col">
        
        {/* Close trigger */}
        <button 
          onClick={() => {
            sfx.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-all cursor-pointer border border-slate-705/50"
        >
          <X size={16} />
        </button>

        {/* Top Header info */}
        <div className="text-center mb-5 flex flex-col items-center">
          
          {/* Avatar frame */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#020108] via-[#090518] to-pink-500/20 p-1 border-2 border-pink-400 shadow-xl relative mb-3">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <User className="text-pink-400" size={28} />
            </div>
            {/* Online bulb status */}
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-slate-950 animate-pulse" />
          </div>

          {isEditing ? (
            <div className="flex items-center gap-1.5 w-full justify-center max-w-[240px]">
              <input 
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-slate-800/80 border border-slate-700 text-white font-bold text-sm rounded-lg px-2.5 py-1 text-center w-full focus:ring-1 focus:ring-pink-500 outline-none"
                maxLength={16}
                autoFocus
              />
              <button 
                onClick={handleSaveName}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-1.5 rounded-lg font-bold"
              >
                <Save size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-black text-white italic tracking-wide">{username}</h3>
              <button 
                onClick={() => {
                  sfx.playClick();
                  setIsEditing(true);
                }}
                className="text-[10px] uppercase font-mono tracking-wider text-pink-400 font-bold hover:underline"
              >
                Editer
              </button>
            </div>
          )}
          <span className="text-[9px] text-[#00f3ff] font-mono font-bold tracking-wider mt-0.5 block">LICENCE CYBER-GAMING #7-49F</span>
        </div>

        {/* Profile Statistics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800 flex flex-col">
            <span className="text-[9px] text-slate-450 font-mono font-bold tracking-wider">HÉLIX COMPLETED</span>
            <span className="text-xl font-black text-[#00FFF7] font-mono mt-0.5">NIVEAU {stats.level}</span>
          </div>

          <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800 flex flex-col">
            <span className="text-[9px] text-slate-450 font-mono font-bold tracking-wider">SCORE RECORD</span>
            <span className="text-xl font-black text-yellow-400 font-mono mt-0.5">{stats.highScore} pt</span>
          </div>

          <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800 flex flex-col">
            <span className="text-[9px] text-slate-450 font-mono font-bold tracking-wider">SKINS ACQUIS</span>
            <span className="text-xl font-black text-pink-400 font-mono mt-0.5">{totalSkinsUnlocked} / {skins.length}</span>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-pink-500 h-full rounded-full" style={{ width: `${skinsCompletionPct}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800 flex flex-col">
            <span className="text-[9px] text-slate-450 font-mono font-bold tracking-wider">WALLET INTEGRAL</span>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-xs font-bold text-slate-200">
              <span className="flex items-center gap-0.5">🪙 {stats.coins}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-[#00FFF7]">💎 {gems}</span>
            </div>
          </div>
        </div>

        {/* Trophies & Achievements list */}
        <h4 className="text-xs font-black text-white italic tracking-tight mb-2.5 uppercase text-left flex items-center gap-1.5">
          <Award className="text-pink-400" size={14} />
          <span>SUCCÈS DÉBLOQUÉS</span>
        </h4>
        
        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
          {badgesList.map((bg, idx) => {
            return (
              <div 
                key={idx}
                className={`flex items-center justify-between p-2.5 rounded-xl border select-none ${
                  bg.completed 
                    ? 'bg-[#10b981]/5 border-[#10b981]/15 text-white' 
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className={`text-[11px] font-bold ${bg.completed ? 'text-emerald-400' : 'text-slate-500'}`}>{bg.title}</span>
                  <p className="text-[9px] text-slate-450 leading-none mt-0.5">{bg.desc}</p>
                </div>
                {bg.completed ? (
                  <div className="bg-emerald-500/10 text-emerald-400 text-[9px] py-0.5 px-1.5 rounded border border-emerald-400/20 font-bold font-mono">
                    VALIDÉ
                  </div>
                ) : (
                  <div className="bg-slate-800 text-slate-600 text-[9px] py-0.5 px-1.5 rounded font-bold font-mono">
                    BLOQUÉ
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
