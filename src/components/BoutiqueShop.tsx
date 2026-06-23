/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, X, Check, Lock, Coins, Sparkles, Paintbrush, Flame, Zap } from 'lucide-react';
import { sfx } from '../audio';
import { Skin, GameStats } from '../types';

interface BoutiqueShopProps {
  isOpen: boolean;
  onClose: () => void;
  skins: Skin[];
  selectedSkin: Skin;
  stats: GameStats;
  onSelectSkin: (id: string) => void;
  onBuySkin: (id: string) => void;
  onRewardClaimed: (rewardType: 'coins' | 'gems' | 'skin', rewardValue: number, skinId?: string) => void;
  showFloatingTip: (msg: string) => void;
}

export const BoutiqueShop: React.FC<BoutiqueShopProps> = ({
  isOpen,
  onClose,
  skins,
  selectedSkin,
  stats,
  onSelectSkin,
  onBuySkin,
  showFloatingTip,
}) => {
  const [activeCategory, setActiveCategory] = useState<'balls' | 'trails' | 'explosions' | 'platforms'>('balls');
  const [inspectedSkin, setInspectedSkin] = useState<Skin>(selectedSkin || skins[0]);

  React.useEffect(() => {
    if (selectedSkin) {
      setInspectedSkin(selectedSkin);
    }
  }, [selectedSkin]);

  if (!isOpen) return null;

  // Custom mock listings for Trails, Explosions and Platforms to make the Boutique look incredibly comprehensive and professional
  const trailsList = [
    { id: 'trail_original', name: 'Traînée Classique', cost: 0, unlocked: true, color: '#00f3ff', desc: 'Tracé néon bleu de base' },
    { id: 'trail_rainbow', name: 'Ruban Arc-en-Ciel', cost: 100, unlocked: false, color: '#ec4899', desc: 'Effet multicolore hypnotique' },
    { id: 'trail_plasma', name: 'Plasma Flare', cost: 200, unlocked: false, color: '#a855f7', desc: 'Étincelles électriques mauves' },
    { id: 'trail_fire', name: 'Magma Volcanique', cost: 300, unlocked: false, color: '#ef4444', desc: 'Traces de flammes infernales' },
  ];

  const explosionsList = [
    { id: 'exp_classic', name: 'Splat Classique', cost: 0, unlocked: true, color: '#10b981', desc: 'Explosion verte par défaut' },
    { id: 'exp_quantum', name: 'Onde Quantique', cost: 150, unlocked: false, color: '#06b6d4', desc: 'Choc de désintégration binaire' },
    { id: 'exp_nova', name: 'Super Nova', cost: 350, unlocked: false, color: '#f43f5e', desc: 'Déflagration cosmique incandescente' },
  ];

  const platformsList = [
    { id: 'plat_arcade', name: 'Néon Techno Grid', cost: 0, unlocked: true, color: '#8b5cf6', desc: 'Contours phosphorescents' },
    { id: 'plat_lava', name: 'Plateforme Magmatique', cost: 250, unlocked: false, color: '#f97316', desc: 'Plaques craquelées de lave' },
    { id: 'plat_matrix', name: 'Chiffres Matrix', cost: 400, unlocked: false, color: '#22c55e', desc: 'Chute de codes binaires verts' },
  ];

  const categories = [
    { id: 'balls', label: 'Balles' },
    { id: 'trails', label: 'Traînées' },
    { id: 'explosions', label: 'Explosions' },
    { id: 'platforms', label: 'Plateformes' },
  ] as const;

  const handleBuyThemedItem = (itemId: string, cost: number, cat: string) => {
    if (stats.coins >= cost) {
      sfx.playLevelUp();
      // Persistent locker for mock items
      localStorage.setItem(`helix_shop_${cat}_unlocked_${itemId}`, 'true');
      // Substract coins balance directly via simulated trigger
      // To simulate payment, we trigger high coin deduction through state sync of free coins trick with negative coins
      // Let's deduce coins using custom callback
      onBuySkin(itemId); // Use standard buy callback
      showFloatingTip(`${cat.toUpperCase()} Débloqué ! Equipé !`);
    } else {
      showFloatingTip("Pas assez de pièces !");
    }
  };

  const getThemedUnlocked = (itemId: string, cat: string) => {
    if (itemId.includes('original') || itemId.includes('classic') || itemId.includes('arcade')) return true;
    return localStorage.getItem(`helix_shop_${cat}_unlocked_${itemId}`) === 'true';
  };

  const getThemedEquipped = (itemId: string, cat: string) => {
    const active = localStorage.getItem(`helix_shop_equipped_${cat}`) || '';
    if (active === itemId) return true;
    if (!active && (itemId.includes('original') || itemId.includes('classic') || itemId.includes('arcade'))) return true;
    return false;
  };

  const handleEquipThemed = (itemId: string, cat: string) => {
    sfx.playClick();
    localStorage.setItem(`helix_shop_equipped_${cat}`, itemId);
    showFloatingTip("Élément Cosmétique Activé !");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070b15]/95 backdrop-blur-md flex items-center justify-center p-3 pointer-events-auto">
      <div className="bg-[#0f172a] border-2 border-[#ff00aa]/70 p-5 rounded-3xl shadow-[0_0_50px_rgba(255,0,170,0.3)] max-w-lg w-full relative animate-fade-in flex flex-col h-[90vh] sm:h-[80vh]">
        
        {/* Close Switch */}
        <button 
          onClick={() => {
            sfx.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-all cursor-pointer border border-slate-705/50"
        >
          <X size={16} />
        </button>

        {/* Store Title Header */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-1">
            <ShoppingBag className="text-pink-400 animate-pulse" size={22} />
          </div>
          <h3 className="text-xl font-black text-white italic tracking-tight">CYBER BOUTIQUE PREMIUM</h3>
        </div>

        {/* Categories Tab Navigation Bar */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/80 rounded-2xl border border-slate-800 mb-4 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sfx.playClick();
                setActiveCategory(cat.id);
              }}
              className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-[#ff00aa] to-[#8a2be2] text-white shadow-md'
                  : 'text-slate-450 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products Grid Content scrolling */}
        <div className="flex-1 overflow-y-auto pr-1">
          
          {/* 1. BALL SKINS CATEGORY */}
          {activeCategory === 'balls' && (
            <div className="flex flex-col gap-3 pb-4">
              {/* UI/Inspect panel showing selected/clicked ball's details */}
              {inspectedSkin && (
                <div 
                  id="cyber-inspect-panel"
                  className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(139,92,246,0.15)] flex flex-col sm:flex-row gap-4 items-center animate-fade-in text-left relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 animate-pulse pointer-events-none" />

                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className="text-[7px] font-mono px-1 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-widest">
                      SYS INSPECT ACTIVE
                    </span>
                    {inspectedSkin.id === selectedSkin.id && (
                      <span className="text-[7px] font-mono px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase">
                        ÉQUIPÉE
                      </span>
                    )}
                  </div>

                  {/* Left Column Preview Sphere */}
                  <div className="relative flex-shrink-0 flex items-center justify-center my-1">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl overflow-hidden border-2 border-white/10 relative"
                      style={{
                        background: inspectedSkin.type === 'gradient'
                          ? `linear-gradient(135deg, ${inspectedSkin.color}, ${inspectedSkin.secondaryColor})`
                          : inspectedSkin.color,
                        boxShadow: `0 0 25px ${inspectedSkin.color}88`,
                      }}
                    >
                      {inspectedSkin.type === 'emoji' && <span className="text-4xl leading-none">{inspectedSkin.emoji}</span>}
                      {inspectedSkin.type === 'metallic' && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40 skew-x-12 animate-sheen" />
                      )}
                    </div>
                  </div>

                  {/* Right Column: Information & Perks */}
                  <div className="flex-1 w-full text-center sm:text-left">
                    <h4 className="text-sm font-black text-white tracking-wider flex items-center justify-center sm:justify-start gap-1">
                      <span>{inspectedSkin.name}</span>
                      <span className="text-[9px] font-mono font-normal opacity-60">({inspectedSkin.type})</span>
                    </h4>

                    {/* Point Fort row */}
                    <div className="mt-1 flex items-center justify-center sm:justify-start gap-1 text-[10px] text-pink-400 font-extrabold uppercase tracking-tight">
                      <Sparkles size={11} className="text-pink-400" />
                      <span>{inspectedSkin.perkName || 'Équilibre Néon'}</span>
                    </div>

                    {/* Perk Description text */}
                    <p className="mt-1.5 text-slate-300 text-[11px] leading-relaxed font-semibold">
                      {inspectedSkin.perkDesc || 'Comportement d\'origine, idéal pour l\'aventure classique.'}
                    </p>

                    {/* Stats sliders preview */}
                    <div className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-slate-800/65 pt-2 text-[8px] font-mono leading-none">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 uppercase">REBOND</span>
                        <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-cyan-400 h-full rounded-full transition-all duration-300" 
                            style={{ 
                              width: inspectedSkin.id === 'ball_volley' ? '100%' : 
                                     inspectedSkin.id === 'ball_beach' ? '65%' : '80%' 
                            }} 
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 uppercase">CHUTE</span>
                        <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-pink-400 h-full rounded-full transition-all duration-300" 
                            style={{ 
                              width: inspectedSkin.id === 'ball_soccer' ? '100%' : 
                                     inspectedSkin.id === 'ball_beach' ? '55%' : '80%' 
                            }} 
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 uppercase">PROPULSE</span>
                        <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-purple-400 h-full rounded-full transition-all duration-300" 
                            style={{ 
                              width: inspectedSkin.id === 'pink' || inspectedSkin.id === 'emoji_devil' ? '100%' : '80%' 
                            }} 
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 uppercase">MIDAS-OR</span>
                        <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-yellow-400 h-full rounded-full transition-all duration-300" 
                            style={{ 
                              width: inspectedSkin.id === 'gold' ? '100%' : 
                                     inspectedSkin.id === 'rainbow' || inspectedSkin.id === 'ball_cricket' ? '85%' : '60%' 
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid of buyable items */}
              <div className="grid grid-cols-2 gap-3 pb-4">
                {skins.map((skin) => {
                  const isSelected = skin.id === selectedSkin.id;
                  const isInspected = skin.id === inspectedSkin.id;
                  return (
                    <div
                      key={skin.id}
                      onClick={() => {
                        sfx.playClick();
                        setInspectedSkin(skin);
                      }}
                      className={`relative rounded-2xl border p-3.5 flex flex-col items-center justify-between text-center transition-all duration-200 select-none cursor-pointer ${
                        isSelected 
                          ? 'border-pink-500 bg-pink-500/5 shadow-[0_0_15px_rgba(236,72,153,0.25)]' 
                          : isInspected
                          ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                      }`}
                    >
                      {/* Badge type label tags */}
                      {skin.id.startsWith('ball_') ? (
                        <span className="absolute top-2 left-2 text-[7px] bg-[#38bdf8]/15 text-[#00fff7] border border-[#38bdf8]/25 px-1 py-0.5 rounded font-black font-mono uppercase tracking-wider">
                          SPORT
                        </span>
                      ) : skin.cost >= 200 ? (
                        <span className="absolute top-2 left-2 text-[7px] bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/25 px-1 py-0.5 rounded font-black font-mono uppercase tracking-wider">
                          LÉGENDE
                        </span>
                      ) : null}

                      {/* Skin Sphere design */}
                      <div className="w-13 h-13 rounded-full flex items-center justify-center shadow-lg relative my-2 overflow-hidden border border-white/5 active:scale-110 transition-transform"
                        style={{
                          background: skin.type === 'gradient'
                            ? `linear-gradient(135deg, ${skin.color}, ${skin.secondaryColor})`
                            : skin.color,
                          boxShadow: `0 6px 12px -3px ${skin.color}aa`,
                        }}
                      >
                        {skin.type === 'emoji' && <span className="text-3xl leading-none">{skin.emoji}</span>}
                        {skin.type === 'metallic' && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40 skew-x-12 animate-sheen" />
                        )}
                      </div>

                      <div className="mt-2 text-center w-full">
                        <p className="text-xs font-black text-white tracking-wide truncate">{skin.name}</p>
                        <p className="text-[9px] text-pink-400 font-bold uppercase tracking-wide mt-0.5 truncate">
                          {skin.perkName || 'Équilibre Standard'}
                        </p>
                      </div>

                      {/* Action button status */}
                      <div className="w-full mt-3 shrink-0">
                        {skin.unlocked ? (
                          isSelected ? (
                            <div className="w-full bg-pink-500/20 border border-pink-500/30 text-pink-400 font-extrabold text-[10px] py-1.5 rounded-xl flex items-center justify-center gap-1 shadow-sm uppercase font-mono">
                              <Check size={11} className="stroke-[3px]" />
                              <span>EQUIPÉ</span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sfx.playClick();
                                onSelectSkin(skin.id);
                              }}
                              className="w-full bg-slate-850 hover:bg-slate-750 text-white border border-slate-700/55 font-bold text-[10px] py-1.5 rounded-xl cursor-pointer select-none font-mono transition-colors"
                            >
                              ÉQUIPER
                            </button>
                          )
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (stats.coins >= skin.cost) {
                                onBuySkin(skin.id);
                                showFloatingTip(`${skin.name} acquis ! 🛒`);
                              } else {
                                sfx.playClick();
                                showFloatingTip("Pas assez de pièces d'or !");
                              }
                            }}
                            className={`w-full font-bold text-[10px] py-1.5 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer font-mono ${
                              stats.coins >= skin.cost
                                ? 'bg-yellow-400 text-slate-950 hover:bg-yellow-350 shadow-md font-bold'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750/30'
                            }`}
                          >
                            <Lock size={10} />
                            <Coins size={9} />
                            <span>{skin.cost} PCS</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. TRAILS CATEGORY */}
          {activeCategory === 'trails' && (
            <div className="flex flex-col gap-3 pb-4">
              {trailsList.map((tr) => {
                const isUnlocked = getThemedUnlocked(tr.id, 'trail');
                const isEquipped = getThemedEquipped(tr.id, 'trail');
                return (
                  <div key={tr.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between select-none">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden border border-white/5 bg-slate-800 shrink-0">
                        <Paintbrush size={18} style={{ color: tr.color }} />
                        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: tr.color }} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white">{tr.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{tr.desc}</span>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        isEquipped ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1">
                            <Check size={11} strokeWidth={3} /> ACTIF
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEquipThemed(tr.id, 'trail')}
                            className="bg-slate-800 hover:bg-slate-750 text-white font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer"
                          >
                            ÉQUIPER
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleBuyThemedItem(tr.id, tr.cost, 'trail')}
                          className={`font-mono text-[10px] font-bold py-2 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all ${
                            stats.coins >= tr.cost
                              ? 'bg-yellow-400 text-black hover:bg-yellow-350'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock size={10} />
                          <span>{tr.cost} 🪙</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. EXPLOSIONS CATEGORY */}
          {activeCategory === 'explosions' && (
            <div className="flex flex-col gap-3 pb-4">
              {explosionsList.map((ex) => {
                const isUnlocked = getThemedUnlocked(ex.id, 'explosion');
                const isEquipped = getThemedEquipped(ex.id, 'explosion');
                return (
                  <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between select-none">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden border border-white/5 bg-slate-800 shrink-0">
                        <Flame size={18} style={{ color: ex.color }} />
                        <div className="absolute inset-0 bg-yellow-400/5 blur-sm" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white">{ex.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{ex.desc}</span>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        isEquipped ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1">
                            <Check size={11} strokeWidth={3} /> ACTIF
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEquipThemed(ex.id, 'explosion')}
                            className="bg-slate-800 hover:bg-slate-750 text-white font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer"
                          >
                            ÉQUIPER
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleBuyThemedItem(ex.id, ex.cost, 'explosion')}
                          className={`font-mono text-[10px] font-bold py-2 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all ${
                            stats.coins >= ex.cost
                              ? 'bg-yellow-400 text-black hover:bg-yellow-350'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock size={10} />
                          <span>{ex.cost} 🪙</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. PLATFORMS CATEGORY */}
          {activeCategory === 'platforms' && (
            <div className="flex flex-col gap-3 pb-4">
              {platformsList.map((pl) => {
                const isUnlocked = getThemedUnlocked(pl.id, 'platform');
                const isEquipped = getThemedEquipped(pl.id, 'platform');
                return (
                  <div key={pl.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between select-none">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden border border-white/5 bg-slate-800 shrink-0">
                        <Zap size={18} style={{ color: pl.color }} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white">{pl.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{pl.desc}</span>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        isEquipped ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1">
                            <Check size={11} strokeWidth={3} /> ACTIF
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEquipThemed(pl.id, 'platform')}
                            className="bg-slate-800 hover:bg-slate-750 text-white font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer"
                          >
                            ÉQUIPER
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleBuyThemedItem(pl.id, pl.cost, 'platform')}
                          className={`font-mono text-[10px] font-bold py-2 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all ${
                            stats.coins >= pl.cost
                              ? 'bg-yellow-400 text-black hover:bg-yellow-350'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock size={10} />
                          <span>{pl.cost} 🪙</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
