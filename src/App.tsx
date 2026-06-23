/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GameState, GameStats, Skin, Challenge } from './types';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { sfx } from './audio';

// Dynamic default skin selections configurations to play
const DEFAULT_SKINS: Skin[] = [
  { id: 'cyan', name: 'Néon Cyan', cost: 0, unlocked: true, type: 'color', color: '#00f3ff', perkName: 'Équilibre Néon', perkDesc: 'Comportement d\'origine, agile et équilibré.' },
  { id: 'pink', name: 'Éclair Rose', cost: 40, unlocked: false, type: 'color', color: '#ff00aa', perkName: 'Super Chargeur', perkDesc: 'Chargement de la super-boule de feu accéléré de 15%.' },
  { id: 'emerald', name: 'Émeraude', cost: 60, unlocked: false, type: 'color', color: '#10b981', perkName: 'Moisson Verte', perkDesc: 'Bonus de +10% de score à chaque étage brisé.' },
  
  // Row 1 of user image
  { id: 'ball_beach', name: 'Ballon de Plage', cost: 50, unlocked: false, type: 'emoji', color: '#38bdf8', emoji: '🏖️', perkName: 'Légèreté de l\'Air', perkDesc: 'Vitesse de chute diminuée de 12% pour un vol contrôlé.' },
  { id: 'ball_volley', name: 'Ballon de Volley', cost: 80, unlocked: false, type: 'emoji', color: '#fef08a', emoji: '🏐', perkName: 'Super Rebond', perkDesc: 'Rebondit 15% plus haut pour mieux voir venir.' },
  { id: 'ball_bowling', name: 'Boule de Bowling', cost: 120, unlocked: false, type: 'emoji', color: '#1d4ed8', emoji: '🎳', perkName: 'Saccage Obscur', perkDesc: 'Brise les plateformes rouges après seulement combo x2.' },
  { id: 'ball_basket', name: 'Ballon de Basket', cost: 100, unlocked: false, type: 'emoji', color: '#ea580c', emoji: '🏀', perkName: 'Adhérence Spatiale', perkDesc: 'Accélère la vitesse de rotation de la tour de 15%.' },
  { id: 'ball_cricket', name: 'Balle de Cricket', cost: 110, unlocked: false, type: 'emoji', color: '#b91c1c', emoji: '🏏', perkName: 'Jackpot Cricket', perkDesc: 'Les pièces collectées valent x1.5 plus de points.' },

  // Row 2 of user image
  { id: 'ball_golf', name: 'Balle de Golf', cost: 70, unlocked: false, type: 'emoji', color: '#f1f5f9', emoji: '⛳', perkName: 'Aspiration Précise', perkDesc: 'Attire automatiquement les pièces d\'or très proches.' },
  { id: 'ball_billiard', name: 'Boule de Billard 8', cost: 180, unlocked: false, type: 'emoji', color: '#dc2626', emoji: '🎱', perkName: 'Protection Huit', perkDesc: 'Réduit les risques : 10% de chance d\'éviter une zone rouge.' },
  { id: 'ball_soccer', name: 'Ballon de Foot', cost: 150, unlocked: false, type: 'emoji', color: '#ffffff', emoji: '⚽', perkName: 'Dynamisme Pro', perkDesc: 'Vitesse de descente augmentée de 15% pour les speedruns.' },
  { id: 'ball_baseball', name: 'Balle de Baseball', cost: 90, unlocked: false, type: 'emoji', color: '#f8fafc', emoji: '⚾', perkName: 'Super Impact', perkDesc: 'Augmente de +25% les éclats d\'étincelles créés.' },
  { id: 'ball_tennis', name: 'Balle de Tennis', cost: 130, unlocked: false, type: 'emoji', color: '#a3e635', emoji: '🎾', perkName: 'Service Lifté', perkDesc: 'Sauts plus réguliers et combo conservé plus longtemps.' },

  // Specialty & Metallic collectibles
  { id: 'gold', name: 'Or Pur', cost: 250, unlocked: false, type: 'metallic', color: '#eab308', metalness: 1.0, roughness: 0.1, perkName: 'Midas Aura', perkDesc: 'Double toutes les pièces d\'or collectées (+100% 🪙) !' },
  { id: 'silver', name: 'Platine', cost: 200, unlocked: false, type: 'metallic', color: '#94a3b8', metalness: 0.95, roughness: 0.05, perkName: 'Solidité Militaire', perkDesc: 'Absorbe un impact fatal sur une plateforme rouge par niveau !' },
  { id: 'emoji_cool', name: 'Cool Face', cost: 140, unlocked: false, type: 'emoji', color: '#fbbf24', emoji: '😎', perkName: 'Combo Cool', perkDesc: 'Augmente de +30% le temps de buffer pour maintenir un combo.' },
  { id: 'emoji_devil', name: 'Petit Démon', cost: 160, unlocked: false, type: 'emoji', color: '#ef4444', emoji: '😈', perkName: 'Feu Infernal', perkDesc: 'Déclenche la super-boule de feu plus rapidement.' },
  { id: 'emoji_alien', name: 'Alien Spark', cost: 220, unlocked: false, type: 'emoji', color: '#8b5cf6', emoji: '👽', perkName: 'Gravité Alien', perkDesc: 'Incline légèrement l\'attraction orbitale pour s\'ajuster.' },
  { id: 'rainbow', name: 'Arc-en-Ciel', cost: 300, unlocked: false, type: 'gradient', color: '#ec4899', secondaryColor: '#06b6d4', perkName: 'Prisme Sacré', perkDesc: 'Toutes les pièces valent x1.5 et absorbe 1 impact rouge !' },
  { id: 'holy_crown', name: 'Couronne Divinement Absolue', cost: 1000, unlocked: false, type: 'emoji', color: '#ffea00', emoji: '👑', perkName: 'Apogée Triomphal', perkDesc: 'Le prestige de l\'Olympe Hélix. Toutes les pièces valent x2, et absorbe 2 chocs fatals ! Unlocked à la fin du niveau 100.' },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [isMuted, setIsMuted] = useState(false);

  // Manage Game Stats
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    coins: 0,
    level: 1,
    currentCombo: 0,
    fireballProgress: 0,
    isFireball: false,
  });

  // Neon Challenge Active States
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [challengeFailed, setChallengeFailed] = useState(false);
  const [challengeBounces, setChallengeBounces] = useState(0);
  const [lastPlatformBounced, setLastPlatformBounced] = useState<number | null>(null);
  const [bounceCountOnSamePlatform, setBounceCountOnSamePlatform] = useState(0);
  const [challengeStartTime, setChallengeStartTime] = useState<number>(0);
  const [maxComboThisLevel, setMaxComboThisLevel] = useState(0);

  // Manage Customize Skins Wallet
  const [skins, setSkins] = useState<Skin[]>(DEFAULT_SKINS);
  const [selectedSkin, setSelectedSkin] = useState<Skin>(DEFAULT_SKINS[0]);

  // Loading settings and storage states on startup
  useEffect(() => {
    // 1. Mute Preferences
    const savedMuted = localStorage.getItem('helix_game_muted');
    const bMuted = savedMuted === 'true';
    setIsMuted(bMuted);
    sfx.setMute(bMuted);

    // 2. High Score & Coins wallet
    const savedHighScore = localStorage.getItem('helix_high_score');
    const savedCoins = localStorage.getItem('helix_coins_balance');

    setStats((prev) => ({
      ...prev,
      highScore: savedHighScore ? parseInt(savedHighScore, 10) : 0,
      coins: savedCoins ? parseInt(savedCoins, 10) : 0,
    }));

    // 3. Skins unlocked listings
    const savedUnlockedStr = localStorage.getItem('helix_unlocked_skins');
    let unlockedIDs = ['cyan'];
    if (savedUnlockedStr) {
      try {
        unlockedIDs = JSON.parse(savedUnlockedStr);
        if (!Array.isArray(unlockedIDs)) unlockedIDs = ['cyan'];
      } catch (e) {
        unlockedIDs = ['cyan'];
      }
    }

    // Populate default list with correct unlocked status
    const populated = DEFAULT_SKINS.map((s) => ({
      ...s,
      unlocked: unlockedIDs.includes(s.id),
    }));
    setSkins(populated);

    // 4. Selected Skin loader
    const savedSelectedIdx = localStorage.getItem('helix_selected_skin_id') || 'cyan';
    const active = populated.find((s) => s.id === savedSelectedIdx) || populated[0];
    setSelectedSkin(active);
  }, []);

  // Update background audio on GameState alterations
  useEffect(() => {
    if (gameState === 'PLAYING') {
      sfx.startMusic();
    } else {
      sfx.stopMusic();
    }
  }, [gameState]);

  // Save changes helper routines
  const saveHighScoreAndCoins = (newHigh: number, newCoins: number) => {
    localStorage.setItem('helix_high_score', newHigh.toString());
    localStorage.setItem('helix_coins_balance', newCoins.toString());
    setStats((prev) => ({
      ...prev,
      highScore: newHigh,
      coins: newCoins,
    }));
  };

  // Callback triggers from dynamic 3D physics Loop
  const handleBounce = (platformIdx?: number) => {
    // Basic bounce behavior (resets combo cascade metrics)
    setStats((prev) => ({
      ...prev,
      currentCombo: 0,
    }));

    if (activeChallenge && !challengeFailed) {
      const nextBounces = challengeBounces + 1;
      setChallengeBounces(nextBounces);

      // Rule: Économe (low_bounces) - Less than 15 bounces
      if (activeChallenge.id === 'low_bounces' && nextBounces >= 15) {
        setChallengeFailed(true);
      }

      // Rule: Sans Rebond (minimal_bounces) - Max 3 bounces
      if (activeChallenge.id === 'minimal_bounces' && nextBounces > 3) {
        setChallengeFailed(true);
      }

      if (platformIdx !== undefined) {
        if (platformIdx === lastPlatformBounced) {
          const nextSameCount = bounceCountOnSamePlatform + 1;
          setBounceCountOnSamePlatform(nextSameCount);

          // Rule: Fantôme (phantom) - Do not bounce 3 times on the same platform
          if (activeChallenge.id === 'phantom' && nextSameCount >= 3) {
            setChallengeFailed(true);
          }

          // Rule: Intouchable (smooth) - Do not bounce twice or more on the same platform
          if (activeChallenge.id === 'smooth' && nextSameCount >= 2) {
            setChallengeFailed(true);
          }
        } else {
          setLastPlatformBounced(platformIdx);
          setBounceCountOnSamePlatform(1);
        }
      }
    }
  };

  const handleCoinCollected = () => {
    let multiplier = 1;
    if (selectedSkin.id === 'gold' || selectedSkin.id === 'holy_crown') {
      multiplier = 2; // Golden and Crown skins: double coins!
    } else if (selectedSkin.id === 'rainbow') {
      multiplier = 1.5; // Rainbow skin: 1.5x coins
    }

    const coinValue = Math.floor(5 * multiplier);
    const nextCoins = stats.coins + coinValue;
    localStorage.setItem('helix_coins_balance', nextCoins.toString());

    // Cricket Ball Perk: Additional score bonus when collecting coins
    if (selectedSkin.id === 'ball_cricket') {
      handleScoreUp(50);
    }

    setStats((prev) => ({
      ...prev,
      coins: nextCoins,
    }));
  };

  const handleScoreUp = (points: number) => {
    let finalPoints = points;
    if (selectedSkin.id === 'emerald') {
      finalPoints = Math.ceil(points * 1.10); // Emerald perk: +10% score bonus!
    } else if (selectedSkin.id === 'holy_crown') {
      finalPoints = Math.ceil(points * 1.25); // Holy Crown: +25% score bonus!
    }

    setStats((prev) => {
      const nextScore = prev.score + finalPoints;
      const isNewHigh = nextScore > prev.highScore;
      const finalHigh = isNewHigh ? nextScore : prev.highScore;

      if (isNewHigh) {
        localStorage.setItem('helix_high_score', finalHigh.toString());
      }

      return {
        ...prev,
        score: nextScore,
        highScore: finalHigh,
      };
    });
  };

  const handleLevelCompleted = () => {
    // Reward level completion points + coin bonus!
    const finishBonusPoints = 250 + stats.level * 20;
    const finalScore = stats.score + finishBonusPoints;
    const isNewHigh = finalScore > stats.highScore;
    const finalHigh = isNewHigh ? finalScore : stats.highScore;

    const coinsReward = 20 + stats.level * 2;
    const nextCoins = stats.coins + coinsReward;

    let didSucceedChallenge = false;
    let challengeMsg = "";

    if (activeChallenge && !challengeFailed) {
      let finalFail = false;

      // Sprinter - finish count under 30 seconds
      if (activeChallenge.id === 'speedrun') {
        const elapsedSec = (Date.now() - challengeStartTime) / 1000;
        if (elapsedSec > 30) finalFail = true;
      }

      // Chute Contrôlée - max combo >= 5
      if (activeChallenge.id === 'drop_5' && maxComboThisLevel < 5) {
        finalFail = true;
      }

      // Combo Master - max combo >= 10
      if (activeChallenge.id === 'combo_10' && maxComboThisLevel < 10) {
        finalFail = true;
      }

      if (finalFail) {
        setChallengeFailed(true);
        challengeMsg = `❌ Défi Échoué ! (Objectif manqué)`;
      } else {
        didSucceedChallenge = true;
        challengeMsg = `🎉 DÉFI RÉUSSI : ${activeChallenge.title}! (+${activeChallenge.rewardGems} 💎)`;
        
        // Save to solved challenges
        try {
          const completedChallenges = JSON.parse(localStorage.getItem('helix_completed_challenges') || '[]');
          if (!completedChallenges.includes(activeChallenge.id)) {
            completedChallenges.push(activeChallenge.id);
            localStorage.setItem('helix_completed_challenges', JSON.stringify(completedChallenges));
          }
        } catch (e) {
          console.warn(e);
        }

        // Add gems
        const oldGems = parseInt(localStorage.getItem('helix_gems_balance') || '250', 10);
        localStorage.setItem('helix_gems_balance', (oldGems + activeChallenge.rewardGems).toString());
      }
    }

    localStorage.setItem('helix_high_score', finalHigh.toString());
    localStorage.setItem('helix_coins_balance', nextCoins.toString());

    // Unlock holy_crown skin if they just finished level 100
    let crownUnlocked = false;
    if (stats.level === 100) {
      try {
        const savedUnlockedStr = localStorage.getItem('helix_unlocked_skins') || '["cyan"]';
        const unlockedIDs = JSON.parse(savedUnlockedStr);
        if (!unlockedIDs.includes('holy_crown')) {
          unlockedIDs.push('holy_crown');
          localStorage.setItem('helix_unlocked_skins', JSON.stringify(unlockedIDs));
          crownUnlocked = true;
        }
      } catch (e) {
        console.warn(e);
      }
    }

    setStats((prev) => ({
      ...prev,
      score: finalScore,
      highScore: finalHigh,
      coins: nextCoins,
      level: prev.level + 1,
      currentCombo: 0,
      isFireball: false,
    }));

    if (crownUnlocked) {
      setSkins((prevSkins) => 
        prevSkins.map((s) => s.id === 'holy_crown' ? { ...s, unlocked: true } : s)
      );
    }

    // Reset challenge tracking for next level
    setActiveChallenge(null);
    setChallengeFailed(false);
    setChallengeBounces(0);
    setLastPlatformBounced(null);
    setBounceCountOnSamePlatform(0);
    setMaxComboThisLevel(0);

    // Reset loop
    if (stats.level === 100) {
      setGameState('COSMIC_ASCENSION');
    } else {
      setGameState('MENU');
    }
    sfx.playLevelUp();
  };

  const handleGameOver = () => {
    setGameState('GAMEOVER');
  };

  const handleComboChange = (combo: number) => {
    setStats((prev) => ({
      ...prev,
      currentCombo: combo,
    }));
    if (combo > maxComboThisLevel) {
      setMaxComboThisLevel(combo);
    }
  };

  const handleFireballStateChange = (active: boolean) => {
    setStats((prev) => ({
      ...prev,
      isFireball: active,
    }));
  };

  // Start Active Game mechanics
  const handleStartGame = () => {
    setStats((prev) => ({
      ...prev,
      score: 0, // Reset score on fresh click
      currentCombo: 0,
      isFireball: false,
    }));
    
    // Reset challenge metrics on restart / start
    setChallengeFailed(false);
    setChallengeBounces(0);
    setLastPlatformBounced(null);
    setBounceCountOnSamePlatform(0);
    setChallengeStartTime(Date.now());
    setMaxComboThisLevel(0);

    setGameState('PLAYING');
  };

  // Full revive mechanism: allows player to save current progression score
  const handleReviveWithAd = () => {
    // On revive, we set GameState back to playing and trigger temporary invincibility frame
    setStats((prev) => ({
      ...prev,
      currentCombo: 0,
      isFireball: false,
    }));
    setGameState('PLAYING');
  };

  // Restart after complete failure
  const handleRestartLevel = () => {
    setStats((prev) => ({
      ...prev,
      score: 0,
      currentCombo: 0,
      isFireball: false,
    }));

    // Reset challenge metrics on restart
    setChallengeFailed(false);
    setChallengeBounces(0);
    setLastPlatformBounced(null);
    setBounceCountOnSamePlatform(0);
    setChallengeStartTime(Date.now());
    setMaxComboThisLevel(0);

    setGameState('PLAYING');
  };

  // Select Neon Challenge
  const handleSelectChallenge = (challenge: Challenge | null) => {
    setActiveChallenge(challenge);
    setChallengeFailed(false);
    setChallengeBounces(0);
    setLastPlatformBounced(null);
    setBounceCountOnSamePlatform(0);
    setChallengeStartTime(Date.now());
    setMaxComboThisLevel(0);

    if (challenge) {
      setStats((prev) => ({
        ...prev,
        score: 0,
        currentCombo: 0,
        isFireball: false,
      }));
      setGameState('PLAYING');
    }
  };

  // Buy Skin action
  const handleBuySkin = (skinId: string) => {
    sfx.playClick();
    const target = skins.find((s) => s.id === skinId);
    if (!target) return;

    if (stats.coins >= target.cost) {
      const remainingCoins = stats.coins - target.cost;
      const updatedSkins = skins.map((s) => {
        if (s.id === skinId) return { ...s, unlocked: true };
        return s;
      });

      // Update storage
      const unlockedIds = updatedSkins.filter((s) => s.unlocked).map((s) => s.id);
      localStorage.setItem('helix_unlocked_skins', JSON.stringify(unlockedIds));
      localStorage.setItem('helix_coins_balance', remainingCoins.toString());

      setSkins(updatedSkins);
      setStats((prev) => ({ ...prev, coins: remainingCoins }));
      setSelectedSkin(target);
      localStorage.setItem('helix_selected_skin_id', skinId);

      sfx.playLevelUp(); // Triumph sound!
    }
  };

  // Mute switch
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sfx.setMute(nextMute);
    localStorage.setItem('helix_game_muted', nextMute.toString());
  };

  // Award Free Coins Option
  const handleFreeCoinsAd = () => {
    const nextCoins = stats.coins + 50;
    localStorage.setItem('helix_coins_balance', nextCoins.toString());
    setStats((prev) => ({
      ...prev,
      coins: nextCoins,
    }));
    sfx.playCoin();
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#0b1020] font-sans text-white select-none">
      
      {/* Visual cyber-space grid backdrop to offer high-fidelity depth behind the translucent 3D tower */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Animated neon gradient background: Blue -> Violet -> Cyan with slow pan effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-[#00d4ff]/20 via-[#4c0519]/25 via-[#8a2be2]/25 to-[#00fff7]/10 bg-[size:400%_400%] animate-pan-bg opacity-100" 
        />
        
        {/* Receding TRON Perspective Grid on lower screen */}
        <div className="absolute inset-x-0 bottom-[-50px] top-[40%] tron-grid opacity-65" />

        {/* Ambient Halo behind the main central tower */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full helix-halo filter blur-[40px] opacity-75 pointer-events-none" />

        {/* Floating Glowing Particles (simulating moving cyber stars) */}
        <div className="absolute top-[20%] left-[10%] w-6 h-6 rounded-full bg-[#00d4ff]/35 filter blur-[6px] animate-float-1" />
        <div className="absolute top-[60%] right-[15%] w-8 h-8 rounded-full bg-[#ff00aa]/30 filter blur-[8px] animate-float-2" />
        <div className="absolute top-[40%] left-[80%] w-4 h-4 rounded-full bg-[#00fff7]/40 filter blur-[4px] animate-float-3" />
        <div className="absolute top-[75%] left-[25%] w-10 h-10 rounded-full bg-[#8a2be2]/25 filter blur-[10px] animate-float-1" style={{ animationDelay: '-4s' }} />
        <div className="absolute top-[15%] right-[25%] w-5 h-5 rounded-full bg-[#00d4ff]/30 filter blur-[5px] animate-float-3" style={{ animationDelay: '-8s' }} />

        {/* Subtle scan grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,24,0)_40%,rgba(0,243,255,0.015)_50%,rgba(18,16,24,0)_60%)] bg-[length:100%_4px] opacity-40" />
      </div>

      {/* THREE.JS WebGL 3D Gameplay Stage */}
      <div className="absolute inset-0 z-10">
        <GameCanvas
          gameState={gameState}
          stats={stats}
          selectedSkin={selectedSkin}
          difficultyMultiplier={1 + (stats.level - 1) * 0.15}
          onBounce={handleBounce}
          onCoinCollected={handleCoinCollected}
          onScoreUp={handleScoreUp}
          onLevelCompleted={handleLevelCompleted}
          onGameOver={handleGameOver}
          onComboChange={handleComboChange}
          onFireballStateChange={handleFireballStateChange}
          isPlaying={gameState === 'PLAYING'}
          activeChallenge={activeChallenge}
        />
      </div>

      {/* 2D Interactive User Interface Layers & HUD System */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <GameUI
          gameState={gameState}
          stats={stats}
          skins={skins}
          selectedSkin={selectedSkin}
          isMuted={isMuted}
          onStartGame={handleStartGame}
          onRestartLevel={handleRestartLevel}
          onReviveWithAd={handleReviveWithAd}
          onSelectSkin={(id) => {
            const match = skins.find((s) => s.id === id);
            if (match) {
              setSelectedSkin(match);
              localStorage.setItem('helix_selected_skin_id', id);
            }
          }}
          onBuySkin={handleBuySkin}
          onToggleMute={handleToggleMute}
          onFreeCoinsAd={handleFreeCoinsAd}
          onOpenSkinsMenu={() => setGameState('SKINS')}
          onCloseSkinsMenu={() => setGameState('MENU')}
          onPauseGame={() => setGameState('PAUSED')}
          onResumeGame={() => setGameState('PLAYING')}
          onQuitToMenu={() => setGameState('MENU')}
          activeChallenge={activeChallenge}
          onSelectChallenge={handleSelectChallenge}
          challengeFailed={challengeFailed}
        />
      </div>

    </main>
  );
}
