import React from 'react';
import { Skull, Shield, BookOpen, AlertTriangle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

export default function Navigation({ 
  activeTab, 
  setActiveTab, 
  character, 
  characterDrawerOpen, 
  setCharacterDrawerOpen 
}) {
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

        {/* Center: HP, Resource & Fatigue Bars */}
        <div style={{ display: 'flex', gap: '1rem', flex: '1', maxWidth: '550px' }}>
          {/* HP Bar */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px', fontFamily: 'var(--font-rpg)' }}>
              <span>ЗДОРОВЬЕ (КОГНИТИВНЫЙ РЕСУРС)</span>
              <span>{Math.round(character.hp)}/{character.maxHp}</span>
            </div>
            <div className="character-bar" style={{ height: '14px' }}>
              <div className="character-bar-fill hp" style={{ width: `${Math.max(0, (character.hp / character.maxHp) * 100)}%` }} />
              <div className="character-bar-text">HP</div>
            </div>
          </div>

          {/* Resource Bar */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px', fontFamily: 'var(--font-rpg)' }}>
              <span>РЕСУРС (ФОКУС / ЭНЕРГИЯ)</span>
              <span>{Math.round(character.mana)}/{character.maxMana}</span>
            </div>
            <div className="character-bar" style={{ height: '14px' }}>
              <div className="character-bar-fill mp" style={{ width: `${Math.max(0, (character.mana / character.maxMana) * 100)}%`, background: 'linear-gradient(to right, #4b0082, #8a2be2)' }} />
              <div className="character-bar-text">RP</div>
            </div>
          </div>

          {/* Fatigue Bar */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px', fontFamily: 'var(--font-rpg)' }}>
              <span>ВЫНОСЛИВОСТЬ (УСТАЛОСТЬ)</span>
              <span>{Math.floor(character.dailyWorkMinutes || 0)}/300 м</span>
            </div>
            <div className="character-bar" style={{ height: '14px' }}>
              <div className="character-bar-fill fatigue" style={{
                width: `${Math.min(100, Math.max(0, ((character.dailyWorkMinutes || 0) / 300) * 100))}%`,
                background: 'linear-gradient(to right, #daa520, #ff8c00)'
              }} />
              <div className="character-bar-text">⚡</div>
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
            ПУТЕШЕСТВИЕ
          </button>
          
          <button 
            className={`rpg-btn ${characterDrawerOpen ? 'rpg-btn-mana' : ''}`}
            onClick={() => { playClick(); setCharacterDrawerOpen(!characterDrawerOpen); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', borderColor: characterDrawerOpen ? 'var(--color-mana)' : '' }}
          >
            <Shield size={14} />
            👤 ПЕРСОНАЖ
          </button>

          <button 
            className={`rpg-btn ${activeTab === 'planner' ? 'rpg-btn-mana' : ''}`}
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
