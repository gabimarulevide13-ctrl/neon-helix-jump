/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Gift, Calendar, Check, Coins, Sparkles, X, ChevronRight } from 'lucide-react';
import { sfx } from '../audio';

interface DailyRewardsProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  gems: number;
  onRewardClaimed: (rewardType: 'coins' | 'gems' | 'skin', rewardValue: number, skinId?: string) => void;
  showFloatingTip: (msg: string) => void;
}

export const DailyRewards: React.FC<DailyRewardsProps> = ({
  isOpen,
  onClose,
  coins,
  gems,
  onRewardClaimed,
  showFloatingTip,
}) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [isOpeningChest, setIsOpeningChest] = useState(false);
  const [openedDay, setOpenedDay] = useState<number | null>(null);

  // Load claim state from localStorage
  useEffect(() => {
    const savedStreak = localStorage.getItem('helix_daily_rewards_streak');
    const savedLastClaim = localStorage.getItem('helix_daily_rewards_last_claim');

    if (savedStreak) {
      setCurrentStreak(parseInt(savedStreak, 10));
    } else {
      setCurrentStreak(0);
    }

    if (savedLastClaim) {
      const lastClaimDate = new Date(savedLastClaim);
      const today = new Date();
      // Simple date equality check (same day, month, year)
      const sameDay = 
        lastClaimDate.getDate() === today.getDate() &&
        lastClaimDate.getMonth() === today.getMonth() &&
        lastClaimDate.getFullYear() === today.getFullYear();
      
      setHasClaimedToday(sameDay);
    } else {
      setHasClaimedToday(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rewards = [
    { day: 1, label: 'Jour 1', type: 'coins', value: 100, icon: '🪙' },
    { day: 2, label: 'Jour 2', type: 'coins', value: 150, icon: '🪙' },
    { day: 3, label: 'Jour 3', type: 'skin', value: 0, skinId: 'gold', name: 'Or Pur', icon: '⚽' },
    { day: 4, label: 'Jour 4', type: 'coins', value: 200, icon: '🪙' },
    { day: 5, label: 'Jour 5', type: 'gems', value: 50, icon: '💎' },
    { day: 6, label: 'Jour 6', type: 'coins', value: 300, icon: '🪙' },
    { day: 7, label: 'Jour 7', type: 'skin', value: 0, skinId: 'rainbow', name: 'Arc-en-Ciel', icon: '🌌' },
  ];

  const handleClaimReward = (dayIndex: number) => {
    if (hasClaimedToday) {
      showFloatingTip("Déjà récupéré aujourd'hui ! Reviens demain !");
      return;
    }
    
    // Day can only be claimed sequentially matching currentStreak
    if (dayIndex !== currentStreak) {
      showFloatingTip(`Vous devez réclamer le Jour ${currentStreak + 1} !`);
      return;
    }

    sfx.playLevelUp();
    setIsOpeningChest(true);
    setOpenedDay(dayIndex + 1);

    setTimeout(() => {
      const reward = rewards[dayIndex];
      const todayString = new Date().toISOString();
      const nextStreak = (currentStreak + 1) % 7;

      localStorage.setItem('helix_daily_rewards_streak', nextStreak.toString());
      localStorage.setItem('helix_daily_rewards_last_claim', todayString);

      setCurrentStreak(nextStreak);
      setHasClaimedToday(true);
      setIsOpeningChest(false);

      if (reward.type === 'coins') {
        onRewardClaimed('coins', reward.value);
        showFloatingTip(`Félicitations ! +${reward.value} pièces d'or !`);
      } else if (reward.type === 'gems') {
        onRewardClaimed('gems', reward.value);
        showFloatingTip(`Incroyable ! +${reward.value} gemmes néon !`);
      } else if (reward.type === 'skin' && reward.skinId) {
        onRewardClaimed('skin', 0, reward.skinId);
        showFloatingTip(`Peau Débloquée : ${reward.name} !`);
      }
    }, 1500);
  };

  const handleSimulateNewDay = () => {
    // Reset date restriction for easy previewing/testing
    localStorage.removeItem('helix_daily_rewards_last_claim');
    setHasClaimedToday(false);
    showFloatingTip("Nouveau jour simulé ! Réclame ta récompense !");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070b15]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border-2 border-[#8a2be2]/60 p-6 rounded-3xl shadow-[0_0_50px_rgba(138,43,226,0.3)] max-w-md w-full relative animate-fade-in flex flex-col text-center">
        
        {/* Close Button */}
        <button 
          onClick={() => {
            sfx.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-all cursor-pointer border border-slate-700/50"
        >
          <X size={16} />
        </button>

        {/* Sparkling Reward Header */}
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff00aa] to-[#8a2be2] flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(255,0,170,0.4)]">
          <Gift size={32} className="text-white animate-bounce mt-1" />
          <div className="absolute inset-0 bg-pink-500/25 blur-md rounded-full -z-10 animate-pulse" />
        </div>

        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 italic tracking-tight mb-1">
          RÉCOMPENSES QUOTIDIENNES
        </h3>
        <p className="text-xs text-slate-400 mb-6 font-mono">
          Connecte-toi chaque jour pour piller des trésors légendaires !
        </p>

        {/* 1-7 Days Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {rewards.slice(0, 4).map((r, idx) => {
            const isClaimed = idx < currentStreak;
            const isClaimable = idx === currentStreak && !hasClaimedToday;
            const isLocked = idx > currentStreak || (idx === currentStreak && hasClaimedToday);

            return (
              <div
                key={r.day}
                onClick={() => isClaimable && handleClaimReward(idx)}
                className={`relative p-3 rounded-2xl flex flex-col items-center justify-between border select-none transition-all duration-300 ${
                  isClaimed 
                    ? 'bg-slate-900 border-slate-800 opacity-60' 
                    : isClaimable 
                      ? 'bg-gradient-to-b from-[#8a2be2]/30 to-purple-900/40 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.35)] cursor-pointer hover:scale-105 active:scale-95' 
                      : 'bg-slate-800/40 border-slate-705/50 opacity-80'
                }`}
              >
                <span className={`text-[10px] font-bold ${isClaimable ? 'text-cyan-400' : 'text-slate-450'}`}>{r.label}</span>
                <span className="text-2xl my-1.5">{r.icon}</span>
                <span className="text-[10px] font-mono font-bold text-white">
                  {r.type === 'skin' ? 'SKIN' : `+${r.value}`}
                </span>
                
                {isClaimed && (
                  <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5 shadow-sm">
                    <Check size={8} className="text-slate-950 stroke-[3px]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Highlight Day 5 - 7 including the grand day 7 chest prize */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {rewards.slice(4).map((r, idx) => {
            const index = idx + 4;
            const isClaimed = index < currentStreak;
            const isClaimable = index === currentStreak && !hasClaimedToday;
            const isGrandPrize = r.day === 7;

            return (
              <div
                key={r.day}
                onClick={() => isClaimable && handleClaimReward(index)}
                className={`relative p-3.5 rounded-2xl flex flex-col items-center justify-between border select-none transition-all duration-300 ${
                  isClaimed 
                    ? 'bg-slate-900 border-slate-800 opacity-60' 
                    : isClaimable 
                      ? `bg-gradient-to-b ${isGrandPrize ? 'from-[#ff00aa]/30 to-pink-900/40 border-pink-500' : 'from-[#8a2be2]/30 to-purple-900/40 border-purple-500'} shadow-lg cursor-pointer hover:scale-105 active:scale-95` 
                      : 'bg-slate-800/40 border-slate-755/50 opacity-80'
                } ${isGrandPrize ? 'col-span-1 border-dashed' : ''}`}
              >
                <span className={`text-[10px] font-bold ${isClaimable ? 'text-pink-400' : 'text-slate-400'}`}>
                  {isGrandPrize ? '🌟 Jour 7' : r.label}
                </span>
                <span className={`text-2xl my-2 ${isGrandPrize && isClaimable ? 'animate-bounce' : ''}`}>{r.icon}</span>
                <span className="text-[10px] font-mono font-black text-white">
                  {r.type === 'skin' ? r.name : `+${r.value}`}
                </span>

                {isClaimed && (
                  <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5">
                    <Check size={8} className="text-slate-950 stroke-[3px]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chest Opening Animation overlay */}
        {isOpeningChest && (
          <div className="absolute inset-0 z-40 bg-[#0f172a]/95 rounded-3xl flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-pink-500 flex items-center justify-center animate-spin" style={{ animationDuration: '4s' }}>
              <Sparkles className="text-white text-3xl animate-pulse" size={40} />
            </div>
            <h4 className="text-xl font-black text-white italic tracking-wide mt-4 animate-bounce">
              OUVERTURE DU COFFRE...
            </h4>
            <span className="text-xs text-slate-400 font-mono mt-1">Génération des récompenses néon</span>
          </div>
        )}

        {/* Interactive Claim Status Banner */}
        <div className="mt-2 bg-[#0b0f19] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-450 font-mono font-bold">STATUT DU JOUR</span>
            <span className={`text-xs font-black ${hasClaimedToday ? 'text-emerald-400' : 'text-yellow-400 animate-pulse'}`}>
              {hasClaimedToday ? '✓ RÉCOMPENSE RÉCUPÉRÉE' : '⚡ RÉCOMPENSE INTÉGRALE PRÊTE'}
            </span>
          </div>
          <button
            onClick={handleSimulateNewDay}
            className="text-[9px] font-mono font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-1 rounded"
          >
            SIMULER DEMAIN
          </button>
        </div>

      </div>
    </div>
  );
};
