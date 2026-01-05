import React, { useState } from 'react';
import { HELP_TEXT } from '../../game/constants/helpText';
import { ArrowLeft, Flame, Wind, Zap, Mountain, Droplet, Sword, Brain, Sparkles, Shield, Map, MapPin, Box, Hammer, Target, TreePine } from 'lucide-react';

interface GameGuideProps {
  onBack: () => void;
}

type Tab = 'STATS' | 'ELEMENTS' | 'EFFECTS' | 'COMBAT' | 'CLANS' | 'PROGRESSION' | 'EQUIPMENT' | 'EXPLORATION' | 'CRAFTING';

// Static Tailwind class mappings (dynamic class names don't work with Tailwind's JIT)
const RANK_COLOR_CLASSES: Record<string, { text: string; border: string }> = {
  'green-500': { text: 'text-green-500', border: 'border-green-500/20' },
  'yellow-500': { text: 'text-yellow-500', border: 'border-yellow-500/20' },
  'orange-500': { text: 'text-orange-500', border: 'border-orange-500/20' },
  'red-600': { text: 'text-red-600', border: 'border-red-600/20' },
};

const GameGuide: React.FC<GameGuideProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('STATS');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 z-50 relative">
      <div className="w-full max-w-5xl h-[85vh] parchment-panel rounded-lg shadow-2xl relative flex flex-col overflow-hidden border-4 border-zinc-900">

        {/* Header */}
        <div className="bg-zinc-900/10 p-6 border-b border-zinc-800/30 flex justify-between items-center backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/20 rounded-full border border-red-900/50">
              <ScrollIcon />
            </div>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase font-serif">Shinobi Handbook</h2>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-black border border-zinc-700 rounded uppercase text-xs font-bold tracking-widest transition-all"
          >
            <ArrowLeft size={14} /> Return to Menu
          </button>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-1 bg-zinc-900/5 p-3 border-b border-zinc-800/10 flex-wrap">
          {['STATS', 'ELEMENTS', 'EFFECTS', 'COMBAT', 'CLANS', 'PROGRESSION', 'EQUIPMENT', 'EXPLORATION', 'CRAFTING'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`px-6 py-2 font-black uppercase tracking-widest text-xs transition-all rounded
                ${activeTab === tab
                  ? 'bg-red-900 text-white shadow-lg scale-105'
                  : 'text-zinc-600 hover:bg-zinc-800/10 hover:text-zinc-900'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-transparent">

          {/* --- STATS TAB --- */}
          {activeTab === 'STATS' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Body */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-900 border-b-2 border-red-900/20 pb-1 mb-2">
                    <Sword size={18} /> <h3 className="font-black uppercase tracking-widest">The Body</h3>
                  </div>
                  {HELP_TEXT.STATS.BODY.map(stat => (
                    <div key={stat.id} className="bg-white/40 p-3 rounded border border-red-900/10">
                      <div className="font-bold text-zinc-900">{stat.name}</div>
                      <div className="text-xs text-zinc-600 italic mb-1">{stat.desc}</div>
                      <div className="text-[10px] font-mono leading-relaxed text-zinc-700">{stat.effect}</div>
                    </div>
                  ))}
                </div>

                {/* Mind */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 border-b-2 border-blue-900/20 pb-1 mb-2">
                    <Brain size={18} /> <h3 className="font-black uppercase tracking-widest">The Mind</h3>
                  </div>
                  {HELP_TEXT.STATS.MIND.map(stat => (
                    <div key={stat.id} className="bg-white/40 p-3 rounded border border-blue-900/10">
                      <div className="font-bold text-zinc-900">{stat.name}</div>
                      <div className="text-xs text-zinc-600 italic mb-1">{stat.desc}</div>
                      <div className="text-[10px] font-mono leading-relaxed text-zinc-700">{stat.effect}</div>
                    </div>
                  ))}
                </div>

                {/* Technique */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-900 border-b-2 border-green-900/20 pb-1 mb-2">
                    <Sparkles size={18} /> <h3 className="font-black uppercase tracking-widest">Technique</h3>
                  </div>
                  {HELP_TEXT.STATS.TECHNIQUE.map(stat => (
                    <div key={stat.id} className="bg-white/40 p-3 rounded border border-green-900/10">
                      <div className="font-bold text-zinc-900">{stat.name}</div>
                      <div className="text-xs text-zinc-600 italic mb-1">{stat.desc}</div>
                      <div className="text-[10px] font-mono leading-relaxed text-zinc-700">{stat.effect}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Derived Stats Section */}
              <div className="border-t-2 border-zinc-400 pt-6 mt-6">
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-widest">Derived Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {HELP_TEXT.DERIVED.map((stat, idx) => (
                    <div key={idx} className="bg-white/50 p-4 rounded border border-zinc-400/30">
                      <div className="font-bold text-zinc-900 mb-1">{stat.name}</div>
                      <div className="text-sm text-zinc-700 leading-relaxed">{stat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- ELEMENTS TAB --- */}
          {activeTab === 'ELEMENTS' && (
            <div className="flex flex-col items-center max-w-3xl mx-auto">
              <div className="bg-zinc-900/90 text-zinc-200 p-8 rounded-xl border-2 border-zinc-700 shadow-2xl w-full text-center mb-8 backdrop-blur-md">
                <h3 className="text-xl font-bold text-yellow-500 mb-8 uppercase tracking-[0.3em]">The Cycle of Chakra</h3>

                <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-lg font-black">
                  <ElementNode color="text-red-500" icon={<Flame size={32} />} label="FIRE" />
                  <span className="text-zinc-600 text-xs uppercase font-bold">&gt;</span>
                  <ElementNode color="text-green-500" icon={<Wind size={32} />} label="WIND" />
                  <span className="text-zinc-600 text-xs uppercase font-bold">&gt;</span>
                  <ElementNode color="text-yellow-400" icon={<Zap size={32} />} label="LIGHTNING" />
                  <span className="text-zinc-600 text-xs uppercase font-bold">&gt;</span>
                  <ElementNode color="text-orange-600" icon={<Mountain size={32} />} label="EARTH" />
                  <span className="text-zinc-600 text-xs uppercase font-bold">&gt;</span>
                  <ElementNode color="text-blue-500" icon={<Droplet size={32} />} label="WATER" />
                  <span className="text-zinc-600 text-xs uppercase font-bold">&gt;</span>
                  <ElementNode color="text-red-500" icon={<Flame size={32} />} label="FIRE" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="bg-green-100/80 border border-green-800/20 p-5 rounded text-green-900">
                  <div className="font-black text-lg mb-2 uppercase tracking-widest">Super Effective</div>
                  <ul className="text-sm space-y-2 list-disc pl-4 font-medium">
                    <li>Deals <strong>1.5x Base Damage</strong></li>
                    <li>Grants <strong>+20% Critical Chance</strong></li>
                    <li>Ignores <strong>50% of Percent Defense</strong></li>
                  </ul>
                </div>
                <div className="bg-red-100/80 border border-red-800/20 p-5 rounded text-red-900">
                  <div className="font-black text-lg mb-2 uppercase tracking-widest">Resisted</div>
                  <ul className="text-sm space-y-2 list-disc pl-4 font-medium">
                    <li>Deals <strong>0.5x Base Damage</strong></li>
                    <li>Standard Critical Chance</li>
                    <li>Full Defense Calculation</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* --- EFFECTS TAB --- */}
          {activeTab === 'EFFECTS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {HELP_TEXT.EFFECTS.map(effect => (
                <div key={effect.type} className="flex items-start gap-4 bg-white/60 p-4 rounded border border-zinc-300 shadow-sm">
                  <div className={`
                    w-1.5 h-full rounded-full self-stretch
                    ${['Bleed', 'Burn', 'Poison', 'Curse'].some(s => effect.label.includes(s)) ? 'bg-red-500' :
                      ['Stun', 'Confusion', 'Silence'].some(s => effect.label.includes(s)) ? 'bg-purple-500' :
                      ['Shield', 'Invulnerability', 'Regen', 'Reflection'].some(s => effect.label.includes(s)) ? 'bg-blue-500' :
                      'bg-zinc-500'}
                  `}></div>
                  <div>
                    <div className="font-black text-zinc-900 text-sm uppercase tracking-wider mb-1">{effect.label}</div>
                    <div className="text-xs text-zinc-700 font-mono leading-relaxed">{effect.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- COMBAT TAB --- */}
          {activeTab === 'COMBAT' && (
            <div className="space-y-8 max-w-3xl mx-auto text-zinc-800">
              <section className="bg-white/50 p-6 rounded border border-zinc-300">
                <h3 className="font-black uppercase tracking-widest mb-4 border-b border-zinc-400 pb-2 text-lg">Damage Formula</h3>
                <div className="bg-zinc-900 text-zinc-300 p-4 rounded font-mono text-xs md:text-sm mb-4 shadow-inner">
                  Final = (Base × Mult) - Flat_Def × (1 - %_Def)
                </div>
                <div className="text-sm space-y-2">
                  <p><span className="font-bold">1. Flat Defense:</span> Directly subtracts from incoming damage. Great against multi-hit weak attacks.</p>
                  <p><span className="font-bold">2. Percent Defense:</span> Reduces remaining damage by a percentage (capped at 75%). Great against heavy hits.</p>
                  <p><span className="font-bold text-red-700">3. True Damage:</span> Ignores ALL defense.</p>
                </div>
              </section>

              {/* Approaches */}
              <section className="bg-white/50 p-5 rounded border border-zinc-300">
                <h3 className="font-black uppercase tracking-widest mb-4 border-b border-zinc-400 pb-2 text-lg flex items-center gap-2">
                  <Target size={18} /> Combat Approaches
                </h3>
                <p className="text-xs text-zinc-600 mb-3">Choose your approach before combat begins to set your tactical stance:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {HELP_TEXT.COMBAT_MECHANICS.APPROACHES.map((approach, idx) => (
                    <div key={idx} className={`p-3 rounded border ${
                      approach.color === 'red' ? 'bg-red-50/80 border-red-200' :
                      approach.color === 'blue' ? 'bg-blue-50/80 border-blue-200' :
                      approach.color === 'green' ? 'bg-green-50/80 border-green-200' :
                      'bg-zinc-50/80 border-zinc-200'
                    }`}>
                      <div className={`font-bold text-sm uppercase tracking-wider mb-1 ${
                        approach.color === 'red' ? 'text-red-900' :
                        approach.color === 'blue' ? 'text-blue-900' :
                        approach.color === 'green' ? 'text-green-900' :
                        'text-zinc-900'
                      }`}>{approach.type}</div>
                      <div className="text-xs text-zinc-700">{approach.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Terrain */}
              <section className="bg-white/50 p-5 rounded border border-zinc-300">
                <h3 className="font-black uppercase tracking-widest mb-4 border-b border-zinc-400 pb-2 text-lg flex items-center gap-2">
                  <TreePine size={18} /> Terrain Effects
                </h3>
                <p className="text-xs text-zinc-600 mb-3">Different terrains provide unique combat modifiers:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {HELP_TEXT.COMBAT_MECHANICS.TERRAIN.map((terrain, idx) => (
                    <div key={idx} className="bg-zinc-100/80 p-3 rounded border border-zinc-200">
                      <div className="font-bold text-zinc-900 text-sm uppercase tracking-wider mb-1">{terrain.type}</div>
                      <div className="text-xs text-zinc-700">{terrain.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50/80 p-4 rounded border border-red-200">
                  <div className="font-bold text-red-900 text-sm mb-2 flex items-center gap-2"><Flame size={16} /> GUTS Mechanic</div>
                  <p className="text-xs leading-relaxed">
                    If you take lethal damage while above 1 HP, you have a chance based on your <strong>Willpower</strong> to survive with exactly 1 HP. High Willpower is essential for survival.
                  </p>
                </div>
                <div className="bg-blue-50/80 p-4 rounded border border-blue-200">
                  <div className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2"><Shield size={16} /> SHIELDS</div>
                  <p className="text-xs leading-relaxed">
                    Shields (Temporary HP) take damage before your actual Health. However, <strong>Shields do not benefit from your Defense stats</strong>. They take raw damage.
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* --- CLANS TAB --- */}
          {activeTab === 'CLANS' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {HELP_TEXT.CLANS.map(clan => (
                <div key={clan.id} className="bg-white/50 p-5 rounded border border-zinc-300 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-black text-zinc-900 uppercase tracking-wider">{clan.name}</h3>
                    <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest bg-white/60 px-2 py-1 rounded">{clan.role}</span>
                  </div>
                  <p className="text-sm text-zinc-700 italic mb-3">{clan.desc}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="font-bold text-green-800 mb-1 uppercase">Strengths</div>
                      <ul className="list-disc list-inside space-y-1 text-green-900">
                        {clan.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="font-bold text-red-800 mb-1 uppercase">Weakness</div>
                      <p className="text-red-900">{clan.weakness}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-700 mt-3 border-t border-zinc-300 pt-2"><span className="font-bold">Strategy:</span> {clan.strategy}</p>
                </div>
              ))}
            </div>
          )}

          {/* --- PROGRESSION TAB --- */}
          {activeTab === 'PROGRESSION' && (
            <div className="space-y-6 max-w-4xl mx-auto text-zinc-800">
              <section className="bg-white/50 p-5 rounded border border-zinc-300">
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg">Enemy Scaling Formula</h3>
                <div className="bg-zinc-900 text-zinc-300 p-3 rounded font-mono text-sm mb-3 shadow-inner">
                  {HELP_TEXT.PROGRESSION.SCALING.formula}
                </div>
                <div className="bg-zinc-800 text-zinc-400 p-3 rounded font-mono text-xs mb-4 space-y-1">
                  {HELP_TEXT.PROGRESSION.SCALING.breakdown.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
                <h4 className="font-bold text-sm text-zinc-800 mb-2">Examples:</h4>
                <div className="space-y-2">
                  {HELP_TEXT.PROGRESSION.SCALING.examples.map((ex, idx) => (
                    <div key={idx} className="text-xs bg-white/30 p-2 rounded font-mono">{ex.text}</div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg">Difficulty Ranks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {HELP_TEXT.PROGRESSION.DIFFICULTY_RANKS.map((rank, idx) => {
                    const colorClasses = RANK_COLOR_CLASSES[rank.color] || { text: 'text-zinc-500', border: 'border-zinc-500/20' };
                    return (
                      <div key={idx} className={`bg-white/50 p-3 rounded border ${colorClasses.border}`}>
                        <div className={`text-lg font-black ${colorClasses.text} mb-1`}>Rank {rank.rank}</div>
                        <div className="text-xs text-zinc-700 font-mono mb-1">Range: {rank.range}</div>
                        <p className="text-xs text-zinc-700">{rank.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg">Resources & Formulas</h3>
                {HELP_TEXT.PROGRESSION.RESOURCES.map((res, idx) => (
                  <div key={idx} className="bg-white/50 p-3 rounded border border-zinc-300">
                    <div className="font-bold text-sm text-zinc-900 mb-1">{res.label}</div>
                    <div className="font-mono text-xs text-zinc-700 bg-white/40 p-2 rounded">{res.formula}</div>
                  </div>
                ))}
                {HELP_TEXT.PROGRESSION.PROGRESSION_DETAILS.map((detail, idx) => (
                  <div key={idx} className="bg-white/50 p-3 rounded border border-zinc-300">
                    <div className="font-bold text-sm text-zinc-900 mb-1">{detail.label}</div>
                    <div className="font-mono text-xs text-zinc-700 bg-white/40 p-2 rounded">{detail.formula}</div>
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* --- EQUIPMENT TAB --- */}
          {activeTab === 'EQUIPMENT' && (
            <div className="space-y-6 max-w-4xl mx-auto text-zinc-800">
              <section>
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg">Rarity Tiers</h3>
                <div className="space-y-3">
                  {HELP_TEXT.EQUIPMENT.RARITIES.map((rarity, idx) => (
                    <div key={idx} className="bg-white/50 p-4 rounded border border-zinc-300">
                      <div className="flex justify-between items-start mb-2">
                        <div className={`font-black text-lg uppercase tracking-wider ${rarity.color}`}>{rarity.rarity}</div>
                        <span className="text-xs font-bold bg-white/60 px-2 py-1 rounded">{rarity.dropRate}</span>
                      </div>
                      <p className="text-xs text-zinc-700 mb-2">{rarity.desc}</p>
                      <div className="text-xs text-zinc-600 font-mono bg-white/40 p-2 rounded">{rarity.statBonus}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg">Equipment Slots</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {HELP_TEXT.EQUIPMENT.SLOTS.map((slot, idx) => (
                    <div key={idx} className="bg-white/50 p-3 rounded border border-zinc-300">
                      <div className="font-bold text-zinc-900 text-sm mb-1 uppercase">{slot.slot}</div>
                      <div className="text-xs text-zinc-700 mb-1">Primary: <span className="font-mono">{slot.primary}</span></div>
                      <p className="text-xs text-zinc-700">{slot.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white/50 p-4 rounded border border-zinc-300">
                <h3 className="font-black uppercase tracking-widest mb-2 text-lg">Item Scaling</h3>
                <p className="text-sm text-zinc-700">{HELP_TEXT.EQUIPMENT.SCALING}</p>
              </section>
            </div>
          )}

          {/* --- EXPLORATION TAB --- */}
          {activeTab === 'EXPLORATION' && (
            <div className="space-y-6 max-w-4xl mx-auto text-zinc-800">
              {/* Region Hierarchy */}
              <section className="bg-white/50 p-5 rounded border border-zinc-300">
                <h3 className="font-black uppercase tracking-widest mb-4 text-lg flex items-center gap-2">
                  <Map size={20} /> Region Hierarchy
                </h3>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
                  {HELP_TEXT.EXPLORATION.HIERARCHY.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <div className="bg-zinc-900/90 text-white p-4 rounded-lg text-center min-w-[140px]">
                        <div className="font-black text-lg uppercase tracking-wider text-yellow-400">{item.term}</div>
                        <div className="text-xs text-zinc-400 mt-1">{item.desc}</div>
                      </div>
                      {idx < HELP_TEXT.EXPLORATION.HIERARCHY.length - 1 && (
                        <span className="text-2xl text-zinc-500 font-bold hidden md:block">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </section>

              {/* Danger Levels */}
              <section className="bg-white/50 p-5 rounded border border-zinc-300">
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg flex items-center gap-2">
                  <Target size={18} /> Danger Levels
                </h3>
                <p className="text-sm text-zinc-700 mb-3">{HELP_TEXT.EXPLORATION.DANGER_LEVELS.desc}</p>
                <div className="bg-zinc-900 text-zinc-300 p-3 rounded font-mono text-xs mb-3 shadow-inner">
                  {HELP_TEXT.EXPLORATION.DANGER_LEVELS.formula}
                </div>
                <p className="text-xs text-zinc-600 italic">{HELP_TEXT.EXPLORATION.DANGER_LEVELS.note}</p>
              </section>

              {/* Room Activities */}
              <section>
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg">Room Activities</h3>
                <p className="text-xs text-zinc-600 mb-3">Activities are processed in this order within each room:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {HELP_TEXT.EXPLORATION.ACTIVITIES.map((act) => (
                    <div key={act.order} className="bg-white/50 p-3 rounded border border-zinc-300 flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center font-black text-sm">
                        {act.order}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 text-sm uppercase">{act.activity}</div>
                        <div className="text-xs text-zinc-600">{act.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Room States & Location Boss */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <section className="bg-white/50 p-4 rounded border border-zinc-300">
                  <h3 className="font-black uppercase tracking-widest mb-3 text-sm">Room States</h3>
                  <div className="space-y-2">
                    {HELP_TEXT.EXPLORATION.ROOM_STATES.map((rs, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                        <span className="font-bold text-xs text-zinc-900">{rs.state}:</span>
                        <span className="text-xs text-zinc-600">{rs.desc}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-yellow-50/80 p-4 rounded border border-yellow-200">
                  <h3 className="font-black uppercase tracking-widest mb-2 text-sm text-yellow-900 flex items-center gap-2">
                    <MapPin size={14} /> {HELP_TEXT.EXPLORATION.LOCATION_BOSS.title}
                  </h3>
                  <p className="text-xs text-yellow-800">{HELP_TEXT.EXPLORATION.LOCATION_BOSS.desc}</p>
                </section>
              </div>

              {/* Enemy Archetypes */}
              <section>
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg">Enemy Archetypes</h3>
                <div className="space-y-3">
                  {HELP_TEXT.EXPLORATION.ARCHETYPES.map((arch, idx) => (
                    <div key={idx} className="bg-white/50 p-3 rounded border border-zinc-300">
                      <div className="font-black text-zinc-900 text-sm mb-2 uppercase tracking-wider">{arch.archetype}</div>
                      <div className="text-xs space-y-1 text-zinc-700">
                        <div><span className="font-bold">Stats:</span> {arch.stats}</div>
                        <div><span className="font-bold">Playstyle:</span> {arch.playstyle}</div>
                        <div><span className="font-bold">Skills:</span> {arch.skills}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Story Arcs */}
              <section>
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg">Story Arcs</h3>
                <div className="space-y-2">
                  {HELP_TEXT.EXPLORATION.STORY_ARCS.map((arc, idx) => (
                    <div key={idx} className="bg-white/50 p-3 rounded border border-zinc-300">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-black text-zinc-900 text-sm uppercase tracking-wider">Arc {arc.arc}: {arc.name}</div>
                        <span className="text-xs font-mono bg-white/40 px-2 py-1 rounded">Danger {arc.danger}</span>
                      </div>
                      <p className="text-xs text-zinc-700">{arc.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* --- CRAFTING TAB --- */}
          {activeTab === 'CRAFTING' && (
            <div className="space-y-6 max-w-4xl mx-auto text-zinc-800">
              {/* Overview */}
              <section className="bg-gradient-to-r from-orange-50 to-yellow-50 p-5 rounded border border-orange-200">
                <h3 className="font-black uppercase tracking-widest mb-2 text-lg flex items-center gap-2 text-orange-900">
                  <Hammer size={20} /> {HELP_TEXT.CRAFTING.OVERVIEW.title}
                </h3>
                <p className="text-sm text-orange-800">{HELP_TEXT.CRAFTING.OVERVIEW.desc}</p>
              </section>

              {/* Components */}
              <section className="bg-white/50 p-5 rounded border border-zinc-300">
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg flex items-center gap-2">
                  <Box size={18} /> Components
                </h3>
                <p className="text-sm text-zinc-700 mb-4">{HELP_TEXT.CRAFTING.COMPONENTS.desc}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {HELP_TEXT.CRAFTING.COMPONENTS.examples.map((comp, idx) => (
                    <div key={idx} className="bg-zinc-100 p-3 rounded border border-zinc-200 text-center">
                      <div className="font-bold text-zinc-900 text-sm">{comp.name}</div>
                      <div className="text-xs text-zinc-500 mt-1">{comp.use}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Artifacts */}
              <section className="bg-white/50 p-5 rounded border border-zinc-300">
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg flex items-center gap-2">
                  <Sparkles size={18} /> Artifacts
                </h3>
                <p className="text-sm text-zinc-700 mb-4">{HELP_TEXT.CRAFTING.ARTIFACTS.desc}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {HELP_TEXT.CRAFTING.ARTIFACTS.triggers.map((t, idx) => (
                    <div key={idx} className="bg-purple-50/80 p-3 rounded border border-purple-200">
                      <div className="font-mono font-bold text-purple-900 text-sm">{t.trigger}</div>
                      <div className="text-xs text-purple-700 mt-1">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bag Capacity */}
              <section className="bg-blue-50/80 p-4 rounded border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-900 text-white rounded-lg flex items-center justify-center font-black text-xl">
                    {HELP_TEXT.CRAFTING.BAG.capacity}
                  </div>
                  <div>
                    <div className="font-bold text-blue-900">Bag Capacity</div>
                    <div className="text-xs text-blue-700">{HELP_TEXT.CRAFTING.BAG.desc}</div>
                  </div>
                </div>
              </section>

              {/* Synthesis */}
              <section className="bg-white/50 p-5 rounded border border-zinc-300">
                <h3 className="font-black uppercase tracking-widest mb-3 text-lg">Synthesis Mechanics</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-green-50/80 p-3 rounded border border-green-200">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">+</div>
                    <div>
                      <div className="font-bold text-green-900 text-sm">Combine</div>
                      <div className="text-xs text-green-700">{HELP_TEXT.CRAFTING.SYNTHESIS.combine}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-red-50/80 p-3 rounded border border-red-200">
                    <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">-</div>
                    <div>
                      <div className="font-bold text-red-900 text-sm">Disassemble</div>
                      <div className="text-xs text-red-700">{HELP_TEXT.CRAFTING.SYNTHESIS.disassemble}</div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 italic mt-4 border-t border-zinc-200 pt-3">{HELP_TEXT.CRAFTING.SYNTHESIS.tip}</p>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const ElementNode = ({ icon, color, label }: { icon: React.ReactNode, color: string, label: string }) => (
  <div className={`flex flex-col items-center ${color}`}>
    {icon}
    <span className="text-[10px] font-bold mt-2 tracking-wider">{label}</span>
  </div>
);

const ScrollIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

export default GameGuide;
