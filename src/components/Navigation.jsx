import React from 'react';
import { Skull, BookOpen, HelpCircle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

export default function Navigation({ 
  activeTab, 
  setActiveTab, 
  character 
}) {
  const { playClick } = useAudio();

  const handleTabClick = (tab) => {
    playClick();
    setActiveTab(tab);
  };

  // Calculate XP percentage
  const xpNeeded = character.level * 100;
  const xpPercent = Math.min(100, Math.max(0, (character.xp / xpNeeded) * 100));

  const getButtonStyle = (tab) => {
    const isActive = activeTab === tab;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.85rem',
      padding: '8px 16px',
      transition: 'all 0.25s ease',
      border: isActive ? '1.5px solid var(--color-relic-glow)' : '1px solid rgba(230, 223, 211, 0.15)',
      borderRadius: '6px',
      boxShadow: isActive ? '0 0 12px rgba(255, 184, 19, 0.35)' : 'none',
      color: isActive ? '#fff' : 'var(--color-bone-dim)',
      background: isActive ? 'rgba(45, 35, 20, 0.8)' : 'rgba(20, 16, 22, 0.4)',
      fontFamily: 'var(--font-rpg)',
      cursor: 'pointer',
      textShadow: isActive ? '0 0 5px var(--color-relic-glow)' : 'none',
      letterSpacing: '0.5px'
    };
  };

  return (
    <nav style={{ 
      padding: '1.2rem 2rem 0.2rem 2rem', 
      marginBottom: '1rem', 
      zIndex: 100,
      background: 'none',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '2rem',
      flexWrap: 'wrap'
    }}>
      {/* Left Side: Avatar/HUD stats - Floating Card */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        background: 'rgba(20, 16, 22, 0.75)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(230, 223, 211, 0.15)',
        borderRadius: '10px',
        padding: '0.6rem 1.2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65), inset 0 0 10px rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          background: 'linear-gradient(135deg, var(--color-blood), var(--color-mana))',
          border: '1px solid rgba(230, 223, 211, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '1.1rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
        }}>
          💀
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
            <span className="gothic-title" style={{ fontSize: '0.95rem', color: '#fff', letterSpacing: '0.5px' }}>{character.name}</span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(230, 223, 211, 0.12)', padding: '2px 6px', color: 'var(--color-relic-glow)', fontFamily: 'var(--font-rpg)', borderRadius: '3px' }}>
              УР {character.level}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', marginBottom: '4px' }}>
            {character.race} • {character.class}
          </div>
          
          {/* XP bar */}
          <div style={{ width: '140px', height: '4px', background: '#000', borderRadius: '2px', overflow: 'hidden', position: 'relative' }} title={`Опыт: ${character.xp}/${xpNeeded}`}>
            <div style={{
              height: '100%',
              width: `${xpPercent}%`,
              background: 'var(--color-relic-glow)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Right Side: Tab Buttons - Floating Widget Card */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        background: 'rgba(20, 16, 22, 0.75)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(230, 223, 211, 0.15)',
        borderRadius: '10px',
        padding: '0.5rem 0.8rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65), inset 0 0 10px rgba(255, 255, 255, 0.02)'
      }}>
        <button 
          style={getButtonStyle('escape')}
          onClick={() => handleTabClick('escape')}
          className="rpg-btn"
        >
          <Skull size={14} />
          ПУТЕШЕСТВИЕ
        </button>
        
        <button 
          style={getButtonStyle('planner')}
          onClick={() => handleTabClick('planner')}
          className="rpg-btn"
        >
          <BookOpen size={14} />
          ЗАДАЧНИК
        </button>

        <button 
          style={getButtonStyle('recovery')}
          onClick={() => handleTabClick('recovery')}
          className="rpg-btn"
        >
          <HelpCircle size={14} />
          НУЖНА ПОМОЩЬ
        </button>
      </div>
    </nav>
  );
}
