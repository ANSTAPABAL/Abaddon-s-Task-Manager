import React from 'react';
import { Skull, Shield, BookOpen, AlertTriangle, Music } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

export default function Navigation({ activeTab, setActiveTab, character, spotifyConnected }) {
  const { playClick } = useAudio();

  const handleTabClick = (tab) => {
    playClick();
    setActiveTab(tab);
  };

  // Calculate XP percentage
  const xpNeeded = character.level * 100;
  const xpPercent = Math.min(100, Math.max(0, (character.xp / xpNeeded) * 100));

  return (
    <nav className="rpg-panel" style={{ padding: '1rem', marginBottom: '1.5rem', zIndex: 100 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        
        {/* Left Side: Avatar/HUD stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, var(--color-blood), var(--color-mana))',
            border: '2px solid var(--color-bone-dim)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '1.5rem'
          }}>
            💀
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="gothic-title" style={{ fontSize: '1.1rem', color: '#fff' }}>{character.name}</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(230, 223, 211, 0.1)', padding: '1px 5px', color: 'var(--color-bone-dim)' }}>
                УР {character.level}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', fontStyle: 'italic' }}>
              {character.race} • {character.class}
            </div>
            
            {/* XP bar */}
            <div style={{ width: '150px', height: '4px', background: '#000', marginTop: '4px', position: 'relative' }}>
              <div style={{
                height: '100%',
                width: `${xpPercent}%`,
                background: 'var(--color-relic-glow)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Center: HP & MP Bars */}
        <div style={{ display: 'flex', gap: '1rem', flex: '1', maxWidth: '400px' }}>
          {/* HP Bar */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px', fontFamily: 'var(--font-rpg)' }}>
              <span>ЗДОРОВЬЕ (КОГНИТИВНЫЙ РЕСУРС)</span>
              <span>{character.hp}/{character.maxHp}</span>
            </div>
            <div className="character-bar">
              <div className="character-bar-fill hp" style={{ width: `${Math.max(0, (character.hp / character.maxHp) * 100)}%` }} />
              <div className="character-bar-text">HP</div>
            </div>
          </div>

          {/* Mana Bar */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px', fontFamily: 'var(--font-rpg)' }}>
              <span>МАНА (ФОКУС / ЭНЕРГИЯ)</span>
              <span>{character.mana}/{character.maxMana}</span>
            </div>
            <div className="character-bar">
              <div className="character-bar-fill mp" style={{ width: `${Math.max(0, (character.mana / character.maxMana) * 100)}%` }} />
              <div className="character-bar-text">MP</div>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
            className={`rpg-btn ${activeTab === 'escape' ? 'rpg-btn-blood' : ''}`}
            onClick={() => handleTabClick('escape')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Skull size={14} />
            ПОВОЗКА
          </button>
          
          <button 
            className={`rpg-btn ${activeTab === 'character' ? 'rpg-btn-mana' : ''}`}
            onClick={() => handleTabClick('character')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Shield size={14} />
            ПЕРСОНАЖ
          </button>

          <button 
            className={`rpg-btn ${activeTab === 'planner' ? '' : ''}`}
            onClick={() => handleTabClick('planner')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', borderColor: activeTab === 'planner' ? 'var(--color-bone)' : '' }}
          >
            <BookOpen size={14} />
            ЗАДАЧНИК
          </button>

          <button 
            className="rpg-btn rpg-btn-blood"
            onClick={() => handleTabClick('recovery')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', boxShadow: '0 0 10px rgba(139,26,26,0.5)' }}
          >
            <AlertTriangle size={14} />
            Я ВЫПАЛ
          </button>
        </div>
      </div>
    </nav>
  );
}
