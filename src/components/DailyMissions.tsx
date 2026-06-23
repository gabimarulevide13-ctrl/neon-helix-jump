/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Target, X, Award, CheckCircle2, Clock, Zap, Shield, Trophy, Gem, HelpCircle, Swords, Play, AlertTriangle } from 'lucide-react';
import { sfx } from '../audio';
import { GameStats, Challenge, ChallengeDifficulty } from '../types';

interface DailyMissionsProps {
  isOpen?: boolean;
  onClose: () => void;
  stats?: GameStats;
  onRewardClaimed: (type: 'coins' | 'gems' | 'skin', value: number, skinId?: string) => void;
  showFloatingTip?: (msg: string) => void;
  activeChallenge?: Challenge | null;
  onSelectChallenge?: (challenge: Challenge | null) => void;
  challengeFailed?: boolean;
}

interface Mission {
  id: string;
  title: string;
  desc: string;
  targetValue: number;
  rewardCoins: number;
  getCurrentValue: (stats: GameStats, played: number, coinsAcc: number, maxCombo: number) => number;
}

const NEON_CHALLENGES: Challenge[] = [
  // Faciles
  { id: 'phantom', title: '👻 Fantôme', desc: 'Ne pas rebondir 3 fois sur la même plateforme.', difficulty: 'facile', rewardGems: 30, points: 10 },
  { id: 'drop_5', title: '🎈 Chute Contrôlée', desc: 'Traverser 5 étages d\'un coup sans s\'arrêter (combo >= 5).', difficulty: 'facile', rewardGems: 40, points: 10 },
  { id: 'no_red', title: '🛡️ Sans Erreur', desc: 'Terminer le niveau sans toucher de plateforme rouge.', difficulty: 'facile', rewardGems: 50, points: 15 },
  { id: 'low_bounces', title: '📉 Économe', desc: 'Terminer le niveau avec moins de 15 rebonds.', difficulty: 'facile', rewardGems: 40, points: 10 },
  { id: 'speedrun', title: '⏱️ Sprinter', desc: 'Terminer le niveau en moins de 30 secondes.', difficulty: 'facile', rewardGems: 50, points: 15 },

  // Moyens
  { id: 'ninja_hover', title: '🥷 Ninja', desc: 'Ne jamais rester plus de 2 secondes sur une plateforme.', difficulty: 'moyen', rewardGems: 80, points: 25 },
  { id: 'blind', title: '👁️‍🗨️ Aveugle', desc: 'Jouer avec l\'écran légèrement obscurci (effet brouillard de guerre).', difficulty: 'moyen', rewardGems: 100, points: 30 },
  { id: 'combo_10', title: '🔥 Combo Master', desc: 'Réaliser une chute de 10 étages d\'un seul coup.', difficulty: 'moyen', rewardGems: 120, points: 35 },
  { id: 'smooth', title: '🕸️ Intouchable', desc: 'Ne pas rebondir 2 fois ou plus sur une même plateforme.', difficulty: 'moyen', rewardGems: 100, points: 30 },
  { id: 'edges', title: '🎯 Précision', desc: 'Atterrir uniquement sur les bords de sécurité de chaque plateforme.', difficulty: 'moyen', rewardGems: 120, points: 35 },

  // Difficiles
  { id: 'one_life', title: '❤️ One Life', desc: 'Une seule erreur autorisée (pas de revive, finir sans échec).', difficulty: 'difficile', rewardGems: 200, points: 50 },
  { id: 'narrow', title: '🪐 Impossible Route', desc: 'Génère uniquement les ouvertures les plus étroites (tour ultra-serrée).', difficulty: 'difficile', rewardGems: 250, points: 60 },
  { id: 'minimal_bounces', title: '🕊️ Sans Rebond', desc: 'Atteindre le fond en utilisant un minimum de rebonds (<= 3).', difficulty: 'difficile', rewardGems: 250, points: 60 },
  { id: 'neon_streak_3', title: '🌌 Maître Neon', desc: 'Terminer 3 niveaux consécutifs sans aucun échec.', difficulty: 'difficile', rewardGems: 300, points: 70 },
  { id: 'extreme_speed', title: '⚡ Vitesse Extrême', desc: 'La balle est 30% plus rapide (gravité et vitesse de rebond accrues).', difficulty: 'difficile', rewardGems: 300, points: 75 },

  // Légendaires
  { id: 'invisible_platforms', title: '🌫️ Invisible', desc: 'Les plateformes disparaissent progressivement au fil du temps.', difficulty: 'legendaire', rewardGems: 500, points: 100 },
  { id: 'storm', title: '🌪️ Tempête Neon', desc: 'La tour tourne constamment sur elle-même de manière automatique.', difficulty: 'legendaire', rewardGems: 500, points: 100 },
  { id: 'chaos', title: '💥 Chaos', desc: 'Les plateformes changent aléatoirement de type et de couleur au cours du temps.', difficulty: 'legendaire', rewardGems: 600, points: 120 },
  { id: 'void_king', title: '🕳️ Roi du Vide', desc: 'Atteindre le fond sans jamais toucher les plateformes paires.', difficulty: 'legendaire', rewardGems: 700, points: 130 },
  { id: 'helix_god', title: '👑 Helix God', desc: 'Réussir une série incroyable de 10 défis consécutifs sans échec.', difficulty: 'legendaire', rewardGems: 1000, points: 200, rewardSkinId: 'rainbow' },

  // Hebdomadaires
  { id: 'hebdo_marathon', title: '📅 Marathon Neon', desc: 'Compléter 20 niveaux de la tour dans la semaine.', difficulty: 'hebdo', rewardGems: 400, points: 80 },
  { id: 'hebdo_gems', title: '✨ Chasseur de Gemmes', desc: 'Gagner 500 gemmes grâce aux défis complétés.', difficulty: 'hebdo', rewardGems: 500, points: 100 },
  { id: 'hebdo_streak', title: '🔥 Série Parfaite', desc: 'Réussir une série de 15 défis d\'affilée.', difficulty: 'hebdo', rewardGems: 600, points: 120 },

  // Événementiels
  { id: 'event_halloween', title: '🎃 Halloween Spécial', desc: 'Éviter les plateformes "maudites" de couleur orange/noir.', difficulty: 'evenement', rewardGems: 300, points: 60 },
  { id: 'event_christmas', title: '🎄 Noël Magique', desc: 'Collecter des cadeaux brillants suspendus pendant la descente.', difficulty: 'evenement', rewardGems: 350, points: 70 },
  { id: 'event_cyber', title: '🛸 Cyber Season', desc: 'Traverser les nouveaux portails gravitationnels spéciaux.', difficulty: 'evenement', rewardGems: 400, points: 80 },
];

export const DailyMissions: React.FC<DailyMissionsProps> = ({
  isOpen = true,
  onClose,
  stats = { score: 0, highScore: 0, coins: 100, level: 1, currentCombo: 0, fireballProgress: 0, isFireball: false },
  onRewardClaimed,
  showFloatingTip = (_msg: string) => {},
  activeChallenge = null,
  onSelectChallenge = (_challenge: Challenge | null) => {},
  challengeFailed = false,
}) => {
  const [currentTab, setCurrentTab] = useState<'daily' | 'challenges'>('challenges');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ChallengeDifficulty | 'tous'>('tous');
  
  // Daily Tracking state
  const [playedGames, setPlayedGames] = useState(0);
  const [collectedCoins, setCollectedCoins] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [claimedMissions, setClaimedMissions] = useState<Record<string, boolean>>({});

  // Challenge tracking stats
  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>([]);
  const [claimedChallengeIds, setClaimedChallengeIds] = useState<string[]>([]);
  const [leaguePoints, setLeaguePoints] = useState(0);

  // Load stats and goals
  useEffect(() => {
    // Read game count and claims
    const savedPlayed = parseInt(localStorage.getItem('helix_missions_games_count') || '0', 10);
    const savedCoinsAcc = parseInt(localStorage.getItem('helix_missions_coins_acc') || '0', 10);
    const savedCombo = parseInt(localStorage.getItem('helix_missions_max_combo') || '0', 10);

    setPlayedGames(savedPlayed);
    setCollectedCoins(savedCoinsAcc);
    setMaxCombo(savedCombo);

    // Standard claims
    const savedClaimsStr = localStorage.getItem('helix_claimed_missions_map') || '{}';
    try {
      setClaimedMissions(JSON.parse(savedClaimsStr));
    } catch (e) {
      setClaimedMissions({});
    }

    // Challenge claims
    const savedCompletedChallenges = localStorage.getItem('helix_completed_challenges') || '[]';
    const savedClaimedChallenges = localStorage.getItem('helix_claimed_challenges') || '[]';
    try {
      const compIds = JSON.parse(savedCompletedChallenges);
      const claimIds = JSON.parse(savedClaimedChallenges);
      setCompletedChallengeIds(compIds);
      setClaimedChallengeIds(claimIds);

      // Re-calculate league points
      const points = compIds.reduce((acc: number, cid: string) => {
        const item = NEON_CHALLENGES.find(c => c.id === cid);
        return acc + (item ? item.points : 0);
      }, 0);
      setLeaguePoints(points);
      localStorage.setItem('helix_league_points', points.toString());
    } catch (e) {
      setCompletedChallengeIds([]);
      setClaimedChallengeIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const missionsList: Mission[] = [
    {
      id: 'play_3',
      title: 'Flâneur de l\'Arcade',
      desc: 'Jouer 3 parties complètes',
      targetValue: 3,
      rewardCoins: 50,
      getCurrentValue: (_, p) => p,
    },
    {
      id: 'reach_20',
      title: 'Maître Gravitationnel',
      desc: 'Atteindre le niveau 20 de la tour',
      targetValue: 20,
      rewardCoins: 150,
      getCurrentValue: (s) => s.level,
    },
    {
      id: 'collect_100',
      title: 'Pilleur de Coffres',
      desc: 'Collecter 100 pièces d\'or',
      targetValue: 100,
      rewardCoins: 80,
      getCurrentValue: (_, __, c) => c,
    },
    {
      id: 'combo_3',
      title: 'Briseur de Néon',
      desc: 'Réaliser un Combo x3 en sautant sans toucher',
      targetValue: 3,
      rewardCoins: 120,
      getCurrentValue: (_, __, ___, mc) => mc,
    },
  ];

  const handleClaim = (missionId: string, rewardCoins: number) => {
    if (claimedMissions[missionId]) return;

    const updatedClaims = { ...claimedMissions, [missionId]: true };
    localStorage.setItem('helix_claimed_missions_map', JSON.stringify(updatedClaims));
    setClaimedMissions(updatedClaims);

    onRewardClaimed('coins', rewardCoins);
    sfx.playLevelUp();
    showFloatingTip(`Mission accomplie ! +${rewardCoins} pièces ! 🪙`);
  };

  const handleClaimChallenge = (challenge: Challenge) => {
    if (claimedChallengeIds.includes(challenge.id)) return;

    const updatedClaims = [...claimedChallengeIds, challenge.id];
    localStorage.setItem('helix_claimed_challenges', JSON.stringify(updatedClaims));
    setClaimedChallengeIds(updatedClaims);

    if (challenge.rewardGems > 0) {
      onRewardClaimed('gems', challenge.rewardGems);
    }
    if (challenge.rewardCoins) {
      onRewardClaimed('coins', challenge.rewardCoins);
    }
    if (challenge.rewardSkinId) {
      onRewardClaimed('skin', 0, challenge.rewardSkinId);
    }

    sfx.playLevelUp();
    showFloatingTip(`Défi réclamé ! +${challenge.rewardGems} Gemmes 💎 !`);
  };

  // Helper to calculate league information
  const getLeagueInfo = (points: number) => {
    if (points >= 500) return { name: '👑 Neon Master', color: 'text-violet-400 font-extrabold', nextBadge: 'Max' };
    if (points >= 250) return { name: '💎 Diamant', color: 'text-sky-400 font-black', nextBadge: 'Neon Master', nextAt: 500 };
    if (points >= 120) return { name: '🥇 Or', color: 'text-yellow-400 font-black', nextBadge: 'Diamant', nextAt: 250 };
    if (points >= 40) return { name: '🥈 Argent', color: 'text-slate-300 font-bold', nextBadge: 'Or', nextAt: 120 };
    return { name: '🥉 Bronze', color: 'text-amber-600 font-medium', nextBadge: 'Argent', nextAt: 40 };
  };

  const league = getLeagueInfo(leaguePoints);

  const filteredChallenges = NEON_CHALLENGES.filter(c => {
    if (selectedDifficulty === 'tous') return true;
    return c.difficulty === selectedDifficulty;
  });

  const getDifficultyColor = (diff: ChallengeDifficulty) => {
    switch (diff) {
      case 'facile': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'moyen': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'difficile': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'legendaire': return 'bg-purple-500/10 text-purple-450 border-purple-500/25';
      case 'hebdo': return 'bg-sky-500/10 text-sky-450 border-sky-550/20';
      case 'evenement': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
    }
  };

  // Debug tool simulation
  const handleSimulateMissionIncrease = (type: 'games' | 'coins' | 'combo') => {
    sfx.playClick();
    if (type === 'games') {
      const nextGames = Math.min(playedGames + 1, 3);
      localStorage.setItem('helix_missions_games_count', nextGames.toString());
      setPlayedGames(nextGames);
      showFloatingTip(`Index Partie: ${nextGames}/3`);
    } else if (type === 'coins') {
      const nextCoins = Math.min(collectedCoins + 25, 100);
      localStorage.setItem('helix_missions_coins_acc', nextCoins.toString());
      setCollectedCoins(nextCoins);
      showFloatingTip(`Pièces collectées : ${nextCoins}/100`);
    } else if (type === 'combo') {
      const nextCombo = 3;
      localStorage.setItem('helix_missions_max_combo', nextCombo.toString());
      setMaxCombo(nextCombo);
      showFloatingTip(`Combo de pointe : x3 accompli !`);
    }
  };

  // Cheat simulation to easily complete a chosen challenge for testing
  const handleSimulateCompleteChallenge = (id: string) => {
    if (completedChallengeIds.includes(id)) return;
    const nextCompleted = [...completedChallengeIds, id];
    localStorage.setItem('helix_completed_challenges', JSON.stringify(nextCompleted));
    setCompletedChallengeIds(nextCompleted);

    const match = NEON_CHALLENGES.find(c => c.id === id);
    if (match) {
      const nextPoints = leaguePoints + match.points;
      setLeaguePoints(nextPoints);
      localStorage.setItem('helix_league_points', nextPoints.toString());
      showFloatingTip(`Défi ${match.title} validé ! +${match.points} pts ! ⚡`);
    }
  };

  const handleLaunchChallenge = (challenge: Challenge) => {
    sfx.playLevelUp();
    onSelectChallenge(challenge);
    showFloatingTip(`DÉFI ACTIVÉ : ${challenge.title}! Bonne chance !`);
    onClose();
  };

  const handleStopActiveChallenge = () => {
    sfx.playClick();
    onSelectChallenge(null);
    showFloatingTip(`Défi annulé.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070b15]/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pointer-events-auto">
      <div className="bg-[#0f172a] border-2 border-[#00f3ff]/60 p-4 sm:p-6 rounded-3xl shadow-[0_0_50px_rgba(0,243,255,0.25)] max-w-xl w-full relative animate-fade-in flex flex-col h-[90vh] sm:h-[84vh] select-none">
        
        {/* Close Button */}
        <button 
          onClick={() => {
            sfx.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-all cursor-pointer border border-slate-700/50 hover:scale-105 active:scale-95 z-50"
        >
          <X size={15} />
        </button>

        {/* Modal Toggling Tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit mx-auto mb-5">
          <button
            onClick={() => { sfx.playClick(); setCurrentTab('challenges'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-all uppercase flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'challenges' 
                ? 'bg-[#00f3ff] text-[#0f172a] shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap size={14} className={currentTab === 'challenges' ? 'text-[#0f172a]' : 'text-cyan-400'} />
            Défis Neon ⚡
          </button>
          
          <button
            onClick={() => { sfx.playClick(); setCurrentTab('daily'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-all uppercase flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'daily'
                ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Target size={14} className={currentTab === 'daily' ? 'text-white' : 'text-purple-400'} />
            Quotidien 🎯
          </button>
        </div>

        {/* Outer body based on Selected tab */}
        {currentTab === 'daily' ? (
          <>
            {/* Top Info */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Missions Temporaires</h3>
              <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-[#00f3ff] font-mono tracking-wider">
                <Clock size={11} />
                <span>RÉINITIALISATION DANS : 18H 41M</span>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
              {missionsList.map((m) => {
                const currentVal = m.getCurrentValue(stats, playedGames, collectedCoins, maxCombo);
                const isCompleted = currentVal >= m.targetValue;
                const isClaimed = claimedMissions[m.id];
                const progressPct = Math.min((currentVal / m.targetValue) * 100, 100);

                return (
                  <div 
                    key={m.id}
                    className={`bg-slate-900/60 border rounded-2xl p-3 flex flex-col justify-between ${
                      isClaimed 
                        ? 'border-slate-800/80 opacity-40' 
                        : isCompleted 
                          ? 'border-emerald-500/30 bg-emerald-500/5' 
                          : 'border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{m.title}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{m.desc}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[9px] text-slate-400 font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/30">
                        <span>{currentVal}</span>
                        <span>/</span>
                        <span className="text-[#00f3ff] font-black">{m.targetValue}</span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden mt-2.5 relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-[#00f3ff]'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-[10px] text-yellow-400 font-mono font-bold flex items-center gap-1">
                        <Award size={12} className="text-yellow-400" /> +{m.rewardCoins} 🪙
                      </span>

                      {isClaimed ? (
                        <span className="text-[9px] font-mono font-black text-slate-500 flex items-center gap-1">
                          ✓ RÉCUPÉRÉ
                        </span>
                      ) : isCompleted ? (
                        <button
                          onClick={() => handleClaim(m.id, m.rewardCoins)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] px-3 py-1 rounded-lg shadow-md hover:scale-105 active:scale-95 cursor-pointer transition-all"
                        >
                          RÉCLAMER
                        </button>
                      ) : (
                        <span className="text-[8px] font-mono font-bold text-slate-450 uppercase tracking-widest bg-slate-800/80 px-2 py-0.5 rounded border border-slate-75 *">
                          EN COURS
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Console simulations */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[8px] text-slate-500 font-mono tracking-wider font-bold text-center">MODE CONSOLE SÉCURISÉ (MOCK DES MISSIONS CONSOLE)</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleSimulateMissionIncrease('games')}
                  className="text-[9px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-350 py-1 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
                >
                  +1 Partie
                </button>
                <button
                  onClick={() => handleSimulateMissionIncrease('coins')}
                  className="text-[9px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-350 py-1 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
                >
                  +25 Pièces
                </button>
                <button
                  onClick={() => handleSimulateMissionIncrease('combo')}
                  className="text-[9px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-355 py-1 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Combo x3
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* League Rank Header Section */}
            <div className="bg-[#0c1222] border border-[#00f3ff]/20 rounded-2xl p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-400/30 flex items-center justify-center text-xl shadow-inner">
                  {league.name.includes('Bronze') && '🥉'}
                  {league.name.includes('Argent') && '🥈'}
                  {league.name.includes('Or') && '🥇'}
                  {league.name.includes('Diamant') && '💎'}
                  {league.name.includes('Master') && '👑'}
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-cyan-400 tracking-wider uppercase">Ligue Active</span>
                  <span className={`text-sm ${league.color}`}>{league.name}</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-slate-540 uppercase font-black">Score de Défi</span>
                <span className="text-sm font-black text-white font-mono">{leaguePoints} <span className="text-cyan-45 * text-xs">PTS</span></span>
                {league.nextAt && (
                  <span className="text-[8px] font-mono text-slate-400 mt-0.5">Suivant : {league.nextBadge} ({leaguePoints}/{league.nextAt} pts)</span>
                )}
              </div>
            </div>

            {/* If a challenge is active currently */}
            {activeChallenge ? (
              <div className="bg-cyan-500/10 border-2 border-cyan-400 rounded-2xl p-3.5 mb-4 animate-pulse flex items-center justify-between">
                <div className="flex items-center gap-2 max-w-[70%]">
                  <Swords size={20} className="text-cyan-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[#00f3ff] font-mono tracking-widest uppercase font-black">DÉFI ACTIF EN COURS</span>
                    <span className="text-xs font-black text-white">{activeChallenge.title}</span>
                    <span className="text-[10px] text-slate-350 leading-tight mt-0.5">{activeChallenge.desc}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleStopActiveChallenge}
                    className="bg-red-500 hover:bg-red-400 text-white font-black text-[9px] px-3 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    ABANDONNER
                  </button>
                </div>
              </div>
            ) : null}

            {/* Filters */}
            <div className="flex flex-wrap gap-1 mb-3.5 select-none overflow-x-auto pb-1 max-w-full">
              {(['tous', 'facile', 'moyen', 'difficile', 'legendaire', 'hebdo', 'evenement'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => { sfx.playClick(); setSelectedDifficulty(diff); }}
                  className={`text-[9px] font-black tracking-wider px-2.5 py-1.5 rounded-full border transition-all uppercase cursor-pointer capitalize ${
                    selectedDifficulty === diff
                      ? 'bg-[#00f3ff] text-slate-950 border-[#00f3ff] font-black'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 max-h-[350px]">
              {filteredChallenges.map((c) => {
                const isCompleted = completedChallengeIds.includes(c.id);
                const isClaimed = claimedChallengeIds.includes(c.id);
                const isActive = activeChallenge?.id === c.id;

                const diffColor = getDifficultyColor(c.difficulty);

                return (
                  <div 
                    key={c.id}
                    className={`bg-slate-900/70 border rounded-2xl p-3 flex flex-col justify-between transition-all ${
                      isClaimed 
                        ? 'border-slate-800/80 opacity-50 bg-slate-950/20' 
                        : isCompleted
                          ? 'border-emerald-500/50 bg-emerald-500/5'
                          : isActive
                            ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.15)] ring-1 ring-cyan-400/40 bg-cyan-950/5'
                            : 'border-slate-800 hover:border-slate-700/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{c.title}</span>
                          <span className={`text-[8px] font-mono border px-1.5 py-0.2 rounded font-black tracking-widest uppercase ${diffColor}`}>
                            {c.difficulty}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-350 mt-1 leading-normal">{c.desc}</span>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[9px] font-mono text-cyan-400 font-bold flex items-center gap-0.5">
                          💎 {c.rewardGems}
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono mt-0.5">+{c.points} PTS</span>
                      </div>
                    </div>

                    {/* Footer Options */}
                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-800/30">
                      <div className="flex items-center gap-1">
                        {isCompleted && !isClaimed && (
                          <span className="text-[9px] text-emerald-450 font-black font-mono animate-bounce flex items-center gap-1">
                            ✨ COMPLÉTÉ
                          </span>
                        )}
                        {!isCompleted && isActive && (
                          <span className="text-[9px] text-[#00f3ff] font-black font-mono flex items-center gap-1">
                            🎮 DÉFI EN COURS
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {/* Simulation cheat option for testing during review */}
                        {!isCompleted && (
                          <button
                            onClick={() => handleSimulateCompleteChallenge(c.id)}
                            className="bg-slate-805 hover:bg-slate-75 * text-slate-400 hover:text-slate-200 text-[8px] p-1 font-mono rounded cursor-pointer transition-all border border-slate-800 uppercase"
                            title="Simuler Réussite immédiate"
                          >
                            Simuler ✓
                          </button>
                        )}

                        {isClaimed ? (
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest select-none">
                            RÉCOMPENSE CLAIMED ✓
                          </span>
                        ) : isCompleted ? (
                          <button
                            onClick={() => handleClaimChallenge(c)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] px-3.5 py-1.5 rounded-lg shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                          >
                            RÉCLAMER 💎
                          </button>
                        ) : isActive ? (
                          <button
                            onClick={handleStopActiveChallenge}
                            className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 text-[9px] font-black px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
                          >
                            ANNULER
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLaunchChallenge(c)}
                            className="bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-[#0f172a] font-extrabold text-[9px] px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:scale-105 active:scale-95 cursor-pointer transition-all uppercase flex items-center gap-1"
                          >
                            <Play size={10} fill="currentColor" /> Lancer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </div>
  );
};
