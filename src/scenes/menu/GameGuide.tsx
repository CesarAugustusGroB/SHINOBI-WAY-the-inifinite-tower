import React, { useState, useEffect, useCallback } from 'react';
import { HELP_TEXT } from '../../game/constants/helpText';
import { ArrowLeft, Flame, Wind, Zap, Mountain, Droplet, Sword, Brain, Sparkles, Shield, Map, MapPin, Box, Hammer, Target, TreePine } from 'lucide-react';
import './GameGuide.css';

interface GameGuideProps {
  onBack: () => void;
}

type Tab = 'STATS' | 'ELEMENTS' | 'EFFECTS' | 'COMBAT' | 'CLANS' | 'PROGRESSION' | 'EQUIPMENT' | 'EXPLORATION' | 'CRAFTING';

const TABS: Tab[] = ['STATS', 'ELEMENTS', 'EFFECTS', 'COMBAT', 'CLANS', 'PROGRESSION', 'EQUIPMENT', 'EXPLORATION', 'CRAFTING'];

// Get rank color class
const getRankColorClass = (color: string): { card: string; label: string } => {
  switch (color) {
    case 'green-500':
      return { card: 'game-guide__rank-card--green', label: 'game-guide__rank-label--green' };
    case 'yellow-500':
      return { card: 'game-guide__rank-card--yellow', label: 'game-guide__rank-label--yellow' };
    case 'orange-500':
      return { card: 'game-guide__rank-card--orange', label: 'game-guide__rank-label--orange' };
    case 'red-600':
      return { card: 'game-guide__rank-card--red', label: 'game-guide__rank-label--red' };
    default:
      return { card: '', label: '' };
  }
};

// Get effect indicator class
const getEffectIndicatorClass = (label: string): string => {
  if (['Bleed', 'Burn', 'Poison', 'Curse'].some(s => label.includes(s))) {
    return 'game-guide__effect-indicator--damage';
  }
  if (['Stun', 'Confusion', 'Silence'].some(s => label.includes(s))) {
    return 'game-guide__effect-indicator--control';
  }
  if (['Shield', 'Invulnerability', 'Regen', 'Reflection'].some(s => label.includes(s))) {
    return 'game-guide__effect-indicator--defense';
  }
  return 'game-guide__effect-indicator--other';
};

// Get approach color classes
const getApproachClasses = (color: string): { card: string; name: string } => {
  switch (color) {
    case 'red':
      return { card: 'game-guide__approach-card--red', name: 'game-guide__approach-name--red' };
    case 'blue':
      return { card: 'game-guide__approach-card--blue', name: 'game-guide__approach-name--blue' };
    case 'green':
      return { card: 'game-guide__approach-card--green', name: 'game-guide__approach-name--green' };
    default:
      return { card: 'game-guide__approach-card--default', name: 'game-guide__approach-name--default' };
  }
};

// Get rarity name class
const getRarityNameClass = (rarity: string): string => {
  const lower = rarity.toLowerCase();
  if (lower.includes('common')) return 'game-guide__rarity-name--common';
  if (lower.includes('rare')) return 'game-guide__rarity-name--rare';
  if (lower.includes('epic')) return 'game-guide__rarity-name--epic';
  if (lower.includes('legendary')) return 'game-guide__rarity-name--legendary';
  if (lower.includes('cursed')) return 'game-guide__rarity-name--cursed';
  return '';
};

const GameGuide: React.FC<GameGuideProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('STATS');

  // Keyboard shortcuts: 1-9 for tabs, Escape to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    // Escape to go back
    if (e.key === 'Escape') {
      e.preventDefault();
      onBack();
      return;
    }

    // Number keys 1-9 for tabs
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      e.preventDefault();
      setActiveTab(TABS[num - 1]);
    }
  }, [onBack]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="game-guide">
      <div className="game-guide__container">

        {/* Header */}
        <div className="game-guide__header">
          <div className="game-guide__header-left">
            <div className="game-guide__icon-wrapper">
              <ScrollIcon />
            </div>
            <h2 className="game-guide__title">Shinobi Handbook</h2>
          </div>
          <button type="button" onClick={onBack} className="game-guide__back-btn">
            <ArrowLeft size={14} /> Return to Menu
          </button>
        </div>

        {/* Keyboard Hints */}
        <div className="game-guide__hints">
          <span className="game-guide__hint">
            <span className="sw-shortcut">1-9</span> Switch Tabs
          </span>
          <span className="game-guide__hint">
            <span className="sw-shortcut">Esc</span> Close
          </span>
        </div>

        {/* Tabs */}
        <div className="game-guide__tabs">
          {TABS.map((tab, idx) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`game-guide__tab ${activeTab === tab ? 'game-guide__tab--active' : ''}`}
            >
              <span className="game-guide__tab-number">{idx + 1}</span>
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="game-guide__content">

          {/* --- STATS TAB --- */}
          {activeTab === 'STATS' && (
            <div className="game-guide__section game-guide__section-space">
              <div className="game-guide__stats-grid">
                {/* Body */}
                <div className="game-guide__stat-category">
                  <div className="game-guide__stat-header game-guide__stat-header--body">
                    <Sword size={18} /> <h3>The Body</h3>
                  </div>
                  {HELP_TEXT.STATS.BODY.map(stat => (
                    <div key={stat.id} className="game-guide__stat-card game-guide__stat-card--body">
                      <div className="game-guide__stat-name">{stat.name}</div>
                      <div className="game-guide__stat-desc">{stat.desc}</div>
                      <div className="game-guide__stat-effect">{stat.effect}</div>
                    </div>
                  ))}
                </div>

                {/* Mind */}
                <div className="game-guide__stat-category">
                  <div className="game-guide__stat-header game-guide__stat-header--mind">
                    <Brain size={18} /> <h3>The Mind</h3>
                  </div>
                  {HELP_TEXT.STATS.MIND.map(stat => (
                    <div key={stat.id} className="game-guide__stat-card game-guide__stat-card--mind">
                      <div className="game-guide__stat-name">{stat.name}</div>
                      <div className="game-guide__stat-desc">{stat.desc}</div>
                      <div className="game-guide__stat-effect">{stat.effect}</div>
                    </div>
                  ))}
                </div>

                {/* Technique */}
                <div className="game-guide__stat-category">
                  <div className="game-guide__stat-header game-guide__stat-header--technique">
                    <Sparkles size={18} /> <h3>Technique</h3>
                  </div>
                  {HELP_TEXT.STATS.TECHNIQUE.map(stat => (
                    <div key={stat.id} className="game-guide__stat-card game-guide__stat-card--technique">
                      <div className="game-guide__stat-name">{stat.name}</div>
                      <div className="game-guide__stat-desc">{stat.desc}</div>
                      <div className="game-guide__stat-effect">{stat.effect}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Derived Stats Section */}
              <div className="game-guide__derived-section">
                <h3 className="game-guide__derived-title">Derived Stats</h3>
                <div className="game-guide__derived-grid">
                  {HELP_TEXT.DERIVED.map((stat, idx) => (
                    <div key={idx} className="game-guide__derived-card">
                      <div className="game-guide__derived-name">{stat.name}</div>
                      <div className="game-guide__derived-desc">{stat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- ELEMENTS TAB --- */}
          {activeTab === 'ELEMENTS' && (
            <div className="game-guide__elements-container">
              <div className="game-guide__cycle-panel">
                <h3 className="game-guide__cycle-title">The Cycle of Chakra</h3>

                <div className="game-guide__cycle-flow">
                  <ElementNode element="fire" icon={<Flame size={32} />} label="FIRE" />
                  <span className="game-guide__cycle-arrow">&gt;</span>
                  <ElementNode element="wind" icon={<Wind size={32} />} label="WIND" />
                  <span className="game-guide__cycle-arrow">&gt;</span>
                  <ElementNode element="lightning" icon={<Zap size={32} />} label="LIGHTNING" />
                  <span className="game-guide__cycle-arrow">&gt;</span>
                  <ElementNode element="earth" icon={<Mountain size={32} />} label="EARTH" />
                  <span className="game-guide__cycle-arrow">&gt;</span>
                  <ElementNode element="water" icon={<Droplet size={32} />} label="WATER" />
                  <span className="game-guide__cycle-arrow">&gt;</span>
                  <ElementNode element="fire" icon={<Flame size={32} />} label="FIRE" />
                </div>
              </div>

              <div className="game-guide__effectiveness-grid">
                <div className="game-guide__effectiveness-card game-guide__effectiveness-card--super">
                  <div className="game-guide__effectiveness-title">Super Effective</div>
                  <ul className="game-guide__effectiveness-list">
                    <li>Deals <strong>1.5x Base Damage</strong></li>
                    <li>Grants <strong>+20% Critical Chance</strong></li>
                    <li>Ignores <strong>50% of Percent Defense</strong></li>
                  </ul>
                </div>
                <div className="game-guide__effectiveness-card game-guide__effectiveness-card--resist">
                  <div className="game-guide__effectiveness-title">Resisted</div>
                  <ul className="game-guide__effectiveness-list">
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
            <div className="game-guide__effects-grid">
              {HELP_TEXT.EFFECTS.map(effect => (
                <div key={effect.type} className="game-guide__effect-card">
                  <div className={`game-guide__effect-indicator ${getEffectIndicatorClass(effect.label)}`}></div>
                  <div className="game-guide__effect-content">
                    <div className="game-guide__effect-label">{effect.label}</div>
                    <div className="game-guide__effect-desc">{effect.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- COMBAT TAB --- */}
          {activeTab === 'COMBAT' && (
            <div className="game-guide__section game-guide__section-space">
              <section className="game-guide__combat-section">
                <h3 className="game-guide__combat-title">Damage Formula</h3>
                <div className="game-guide__formula-box">
                  Final = (Base × Mult) - Flat_Def × (1 - %_Def)
                </div>
                <div className="game-guide__formula-desc">
                  <p><span>1. Flat Defense:</span> Directly subtracts from incoming damage. Great against multi-hit weak attacks.</p>
                  <p><span>2. Percent Defense:</span> Reduces remaining damage by a percentage (capped at 75%). Great against heavy hits.</p>
                  <p><span className="game-guide__formula-desc--true-damage">3. True Damage:</span> Ignores ALL defense.</p>
                </div>
              </section>

              {/* Approaches */}
              <section className="game-guide__combat-section game-guide__combat-section--small">
                <h3 className="game-guide__combat-title">
                  <Target size={18} /> Combat Approaches
                </h3>
                <p className="game-guide__approaches-intro">Choose your approach before combat begins to set your tactical stance:</p>
                <div className="game-guide__approaches-grid">
                  {HELP_TEXT.COMBAT_MECHANICS.APPROACHES.map((approach, idx) => {
                    const classes = getApproachClasses(approach.color);
                    return (
                      <div key={idx} className={`game-guide__approach-card ${classes.card}`}>
                        <div className={`game-guide__approach-name ${classes.name}`}>{approach.type}</div>
                        <div className="game-guide__approach-desc">{approach.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Terrain */}
              <section className="game-guide__combat-section game-guide__combat-section--small">
                <h3 className="game-guide__combat-title">
                  <TreePine size={18} /> Terrain Effects
                </h3>
                <p className="game-guide__approaches-intro">Different terrains provide unique combat modifiers:</p>
                <div className="game-guide__terrain-grid">
                  {HELP_TEXT.COMBAT_MECHANICS.TERRAIN.map((terrain, idx) => (
                    <div key={idx} className="game-guide__terrain-card">
                      <div className="game-guide__terrain-name">{terrain.type}</div>
                      <div className="game-guide__terrain-desc">{terrain.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="game-guide__mechanics-grid">
                <div className="game-guide__mechanic-card game-guide__mechanic-card--guts">
                  <div className="game-guide__mechanic-title game-guide__mechanic-title--guts">
                    <Flame size={16} /> GUTS Mechanic
                  </div>
                  <p className="game-guide__mechanic-desc">
                    If you take lethal damage while above 1 HP, you have a chance based on your <strong>Willpower</strong> to survive with exactly 1 HP. High Willpower is essential for survival.
                  </p>
                </div>
                <div className="game-guide__mechanic-card game-guide__mechanic-card--shields">
                  <div className="game-guide__mechanic-title game-guide__mechanic-title--shields">
                    <Shield size={16} /> SHIELDS
                  </div>
                  <p className="game-guide__mechanic-desc">
                    Shields (Temporary HP) take damage before your actual Health. However, <strong>Shields do not benefit from your Defense stats</strong>. They take raw damage.
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* --- CLANS TAB --- */}
          {activeTab === 'CLANS' && (
            <div className="game-guide__clans-section">
              {HELP_TEXT.CLANS.map(clan => (
                <div key={clan.id} className="game-guide__clan-card">
                  <div className="game-guide__clan-header">
                    <h3 className="game-guide__clan-name">{clan.name}</h3>
                    <span className="game-guide__clan-role">{clan.role}</span>
                  </div>
                  <p className="game-guide__clan-desc">{clan.desc}</p>
                  <div className="game-guide__clan-details">
                    <div>
                      <div className="game-guide__clan-strengths-title">Strengths</div>
                      <ul className="game-guide__clan-strengths-list">
                        {clan.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="game-guide__clan-weakness-title">Weakness</div>
                      <p className="game-guide__clan-weakness">{clan.weakness}</p>
                    </div>
                  </div>
                  <p className="game-guide__clan-strategy"><span>Strategy:</span> {clan.strategy}</p>
                </div>
              ))}
            </div>
          )}

          {/* --- PROGRESSION TAB --- */}
          {activeTab === 'PROGRESSION' && (
            <div className="game-guide__progression-section">
              <section className="game-guide__scaling-section">
                <h3 className="game-guide__scaling-title">Enemy Scaling Formula</h3>
                <div className="game-guide__scaling-formula">
                  {HELP_TEXT.PROGRESSION.SCALING.formula}
                </div>
                <div className="game-guide__scaling-breakdown">
                  {HELP_TEXT.PROGRESSION.SCALING.breakdown.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
                <h4 className="game-guide__examples-title">Examples:</h4>
                <div className="game-guide__examples-list">
                  {HELP_TEXT.PROGRESSION.SCALING.examples.map((ex, idx) => (
                    <div key={idx} className="game-guide__example-item">{ex.text}</div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="game-guide__ranks-title">Difficulty Ranks</h3>
                <div className="game-guide__ranks-grid">
                  {HELP_TEXT.PROGRESSION.DIFFICULTY_RANKS.map((rank, idx) => {
                    const colorClasses = getRankColorClass(rank.color);
                    return (
                      <div key={idx} className={`game-guide__rank-card ${colorClasses.card}`}>
                        <div className={`game-guide__rank-label ${colorClasses.label}`}>Rank {rank.rank}</div>
                        <div className="game-guide__rank-range">Range: {rank.range}</div>
                        <p className="game-guide__rank-desc">{rank.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="game-guide__resources-section">
                <h3 className="game-guide__resources-title">Resources & Formulas</h3>
                {HELP_TEXT.PROGRESSION.RESOURCES.map((res, idx) => (
                  <div key={idx} className="game-guide__resource-card">
                    <div className="game-guide__resource-label">{res.label}</div>
                    <div className="game-guide__resource-formula">{res.formula}</div>
                  </div>
                ))}
                {HELP_TEXT.PROGRESSION.PROGRESSION_DETAILS.map((detail, idx) => (
                  <div key={idx} className="game-guide__resource-card">
                    <div className="game-guide__resource-label">{detail.label}</div>
                    <div className="game-guide__resource-formula">{detail.formula}</div>
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* --- EQUIPMENT TAB --- */}
          {activeTab === 'EQUIPMENT' && (
            <div className="game-guide__equipment-section">
              <section className="game-guide__rarities-section">
                <h3 className="game-guide__rarities-title">Rarity Tiers</h3>
                {HELP_TEXT.EQUIPMENT.RARITIES.map((rarity, idx) => (
                  <div key={idx} className="game-guide__rarity-card">
                    <div className="game-guide__rarity-header">
                      <div className={`game-guide__rarity-name ${getRarityNameClass(rarity.rarity)}`}>{rarity.rarity}</div>
                      <span className="game-guide__rarity-drop">{rarity.dropRate}</span>
                    </div>
                    <p className="game-guide__rarity-desc">{rarity.desc}</p>
                    <div className="game-guide__rarity-stats">{rarity.statBonus}</div>
                  </div>
                ))}
              </section>

              <section>
                <h3 className="game-guide__slots-title">Equipment Slots</h3>
                <div className="game-guide__slots-grid">
                  {HELP_TEXT.EQUIPMENT.SLOTS.map((slot, idx) => (
                    <div key={idx} className="game-guide__slot-card">
                      <div className="game-guide__slot-name">{slot.slot}</div>
                      <div className="game-guide__slot-primary">Primary: <span>{slot.primary}</span></div>
                      <p className="game-guide__slot-desc">{slot.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="game-guide__scaling-info">
                <h3 className="game-guide__scaling-info-title">Item Scaling</h3>
                <p className="game-guide__scaling-info-desc">{HELP_TEXT.EQUIPMENT.SCALING}</p>
              </section>
            </div>
          )}

          {/* --- EXPLORATION TAB --- */}
          {activeTab === 'EXPLORATION' && (
            <div className="game-guide__exploration-section">
              {/* Region Hierarchy */}
              <section className="game-guide__hierarchy-section">
                <h3 className="game-guide__hierarchy-title">
                  <Map size={20} /> Region Hierarchy
                </h3>
                <div className="game-guide__hierarchy-flow">
                  {HELP_TEXT.EXPLORATION.HIERARCHY.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <div className="game-guide__hierarchy-item">
                        <div className="game-guide__hierarchy-term">{item.term}</div>
                        <div className="game-guide__hierarchy-desc">{item.desc}</div>
                      </div>
                      {idx < HELP_TEXT.EXPLORATION.HIERARCHY.length - 1 && (
                        <span className="game-guide__hierarchy-arrow">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </section>

              {/* Danger Levels */}
              <section className="game-guide__danger-section">
                <h3 className="game-guide__danger-title">
                  <Target size={18} /> Danger Levels
                </h3>
                <p className="game-guide__danger-desc">{HELP_TEXT.EXPLORATION.DANGER_LEVELS.desc}</p>
                <div className="game-guide__danger-formula">
                  {HELP_TEXT.EXPLORATION.DANGER_LEVELS.formula}
                </div>
                <p className="game-guide__danger-note">{HELP_TEXT.EXPLORATION.DANGER_LEVELS.note}</p>
              </section>

              {/* Room Activities */}
              <section>
                <h3 className="game-guide__activities-title">Room Activities</h3>
                <p className="game-guide__activities-intro">Activities are processed in this order within each room:</p>
                <div className="game-guide__activities-grid">
                  {HELP_TEXT.EXPLORATION.ACTIVITIES.map((act) => (
                    <div key={act.order} className="game-guide__activity-card">
                      <div className="game-guide__activity-number">{act.order}</div>
                      <div>
                        <div className="game-guide__activity-name">{act.activity}</div>
                        <div className="game-guide__activity-desc">{act.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Room States & Location Boss */}
              <div className="game-guide__states-row">
                <section className="game-guide__states-section">
                  <h3 className="game-guide__states-title">Room States</h3>
                  <div className="game-guide__states-list">
                    {HELP_TEXT.EXPLORATION.ROOM_STATES.map((rs, idx) => (
                      <div key={idx} className="game-guide__state-item">
                        <div className={`game-guide__state-dot ${idx === 0 ? 'game-guide__state-dot--available' : idx === 1 ? 'game-guide__state-dot--current' : 'game-guide__state-dot--cleared'}`}></div>
                        <span className="game-guide__state-name">{rs.state}:</span>
                        <span className="game-guide__state-desc">{rs.desc}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="game-guide__boss-section">
                  <h3 className="game-guide__boss-title">
                    <MapPin size={14} /> {HELP_TEXT.EXPLORATION.LOCATION_BOSS.title}
                  </h3>
                  <p className="game-guide__boss-desc">{HELP_TEXT.EXPLORATION.LOCATION_BOSS.desc}</p>
                </section>
              </div>

              {/* Enemy Archetypes */}
              <section>
                <h3 className="game-guide__archetypes-title">Enemy Archetypes</h3>
                <div className="game-guide__archetypes-list">
                  {HELP_TEXT.EXPLORATION.ARCHETYPES.map((arch, idx) => (
                    <div key={idx} className="game-guide__archetype-card">
                      <div className="game-guide__archetype-name">{arch.archetype}</div>
                      <div className="game-guide__archetype-details">
                        <div><span>Stats:</span> {arch.stats}</div>
                        <div><span>Playstyle:</span> {arch.playstyle}</div>
                        <div><span>Skills:</span> {arch.skills}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Story Arcs */}
              <section>
                <h3 className="game-guide__arcs-title">Story Arcs</h3>
                <div className="game-guide__arcs-list">
                  {HELP_TEXT.EXPLORATION.STORY_ARCS.map((arc, idx) => (
                    <div key={idx} className="game-guide__arc-card">
                      <div className="game-guide__arc-header">
                        <div className="game-guide__arc-name">Arc {arc.arc}: {arc.name}</div>
                        <span className="game-guide__arc-danger">Danger {arc.danger}</span>
                      </div>
                      <p className="game-guide__arc-desc">{arc.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* --- CRAFTING TAB --- */}
          {activeTab === 'CRAFTING' && (
            <div className="game-guide__crafting-section">
              {/* Overview */}
              <section className="game-guide__crafting-overview">
                <h3 className="game-guide__crafting-overview-title">
                  <Hammer size={20} /> {HELP_TEXT.CRAFTING.OVERVIEW.title}
                </h3>
                <p className="game-guide__crafting-overview-desc">{HELP_TEXT.CRAFTING.OVERVIEW.desc}</p>
              </section>

              {/* Components */}
              <section className="game-guide__components-section">
                <h3 className="game-guide__components-title">
                  <Box size={18} /> Components
                </h3>
                <p className="game-guide__components-desc">{HELP_TEXT.CRAFTING.COMPONENTS.desc}</p>
                <div className="game-guide__components-grid">
                  {HELP_TEXT.CRAFTING.COMPONENTS.examples.map((comp, idx) => (
                    <div key={idx} className="game-guide__component-card">
                      <div className="game-guide__component-name">{comp.name}</div>
                      <div className="game-guide__component-use">{comp.use}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Artifacts */}
              <section className="game-guide__artifacts-section">
                <h3 className="game-guide__artifacts-title">
                  <Sparkles size={18} /> Artifacts
                </h3>
                <p className="game-guide__artifacts-desc">{HELP_TEXT.CRAFTING.ARTIFACTS.desc}</p>
                <div className="game-guide__triggers-grid">
                  {HELP_TEXT.CRAFTING.ARTIFACTS.triggers.map((t, idx) => (
                    <div key={idx} className="game-guide__trigger-card">
                      <div className="game-guide__trigger-name">{t.trigger}</div>
                      <div className="game-guide__trigger-desc">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bag Capacity */}
              <section className="game-guide__bag-section">
                <div className="game-guide__bag-content">
                  <div className="game-guide__bag-number">
                    {HELP_TEXT.CRAFTING.BAG.capacity}
                  </div>
                  <div>
                    <div className="game-guide__bag-label">Bag Capacity</div>
                    <div className="game-guide__bag-desc">{HELP_TEXT.CRAFTING.BAG.desc}</div>
                  </div>
                </div>
              </section>

              {/* Synthesis */}
              <section className="game-guide__synthesis-section">
                <h3 className="game-guide__synthesis-title">Synthesis Mechanics</h3>
                <div className="game-guide__synthesis-list">
                  <div className="game-guide__synthesis-item game-guide__synthesis-item--combine">
                    <div className="game-guide__synthesis-icon game-guide__synthesis-icon--combine">+</div>
                    <div>
                      <div className="game-guide__synthesis-name game-guide__synthesis-name--combine">Combine</div>
                      <div className="game-guide__synthesis-desc game-guide__synthesis-desc--combine">{HELP_TEXT.CRAFTING.SYNTHESIS.combine}</div>
                    </div>
                  </div>
                  <div className="game-guide__synthesis-item game-guide__synthesis-item--disassemble">
                    <div className="game-guide__synthesis-icon game-guide__synthesis-icon--disassemble">-</div>
                    <div>
                      <div className="game-guide__synthesis-name game-guide__synthesis-name--disassemble">Disassemble</div>
                      <div className="game-guide__synthesis-desc game-guide__synthesis-desc--disassemble">{HELP_TEXT.CRAFTING.SYNTHESIS.disassemble}</div>
                    </div>
                  </div>
                </div>
                <p className="game-guide__synthesis-tip">{HELP_TEXT.CRAFTING.SYNTHESIS.tip}</p>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

interface ElementNodeProps {
  icon: React.ReactNode;
  element: 'fire' | 'wind' | 'lightning' | 'earth' | 'water';
  label: string;
}

const ElementNode: React.FC<ElementNodeProps> = ({ icon, element, label }) => (
  <div className={`game-guide__element-node game-guide__element-node--${element}`}>
    {icon}
    <span className="game-guide__element-label">{label}</span>
  </div>
);

const ScrollIcon = () => (
  <svg className="game-guide__scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

export default GameGuide;
