import React from 'react';
import { Skull, BookOpen, HelpCircle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

const getRacePortraitUrl = (race) => {
  const r = race ? race.toLowerCase() : '';
  if (r.includes('человек')) return 'http://localhost:3001/races/human.jpg';
  if (r.includes('эльф')) return 'http://localhost:3001/races/elf.jpg';
  if (r.includes('тролль')) return 'http://localhost:3001/races/troll.jpg';
  if (r.includes('каргахаул')) return 'http://localhost:3001/races/kargahaul.jpg';
  return null;
};

export default function Navigation({ 
  activeTab, 
  setActiveTab, 
  character,
  activeTask,
  timeLeft,
  isRunning,
  ritualTimerActive = false,
  ritualTimeLeft = 0,
  ritualTimeTotal = 0,
  huntIsRunning = false,
  huntTimeSpent = 0,
  huntTimerValue = 0,
  huntMode = 'pomodoro',
  huntIsBreak = false,
  huntBreakTimeLeft = 0
}) {
  const { playClick } = useAudio();
  const portraitUrl = getRacePortraitUrl(character.race);

  const formatTime = (secs) => {
    const isNegative = secs < 0;
    const absSecs = Math.abs(secs);
    const m = Math.floor(absSecs / 60).toString().padStart(2, '0');
    const s = (absSecs % 60).toString().padStart(2, '0');
    return `${isNegative ? '-' : ''}${m}:${s}`;
  };

  const isTimeCritical = activeTask ? (timeLeft <= 0 || timeLeft < (activeTask.pomodoroTime * 60) * 0.2) : false;
  const formattedTime = timeLeft !== undefined ? formatTime(timeLeft) : '00:00';

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
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
        }}>
          {portraitUrl ? (
            <img 
              src={portraitUrl} 
              alt={character.race} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 15%'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '💀';
              }}
            />
          ) : (
            '💀'
          )}
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
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(20, 16, 22, 0.75)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(230, 223, 211, 0.15)',
        borderRadius: '10px',
        padding: '0.5rem 0.8rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65), inset 0 0 10px rgba(255, 255, 255, 0.02)'
      }}>
        {activeTab !== 'escape' && (
          <>
            {activeTask && (
              <div 
                className={isTimeCritical ? "pulsating-red-frame" : "golden-frame"} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  height: '32px',
                  marginRight: '0.4rem',
                  boxSizing: 'border-box'
                }}
              >
                {/* Timer */}
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: isTimeCritical ? '#ff2424' : 'var(--color-relic-glow, #ffb813)',
                  textShadow: isTimeCritical ? '0 0 6px #ff2424' : 'none'
                }}>
                  {formattedTime}
                </span>
                
                {/* Divider */}
                <span style={{ color: 'rgba(230, 223, 211, 0.25)' }}>|</span>
                
                {/* Task Name */}
                <span style={{
                  fontSize: '0.72rem',
                  color: '#fff',
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  maxWidth: '280px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.5px'
                }} title={activeTask.title}>
                  {activeTask.title}
                </span>
              </div>
            )}

            {!activeTask && ritualTimerActive && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  height: '32px',
                  marginRight: '0.4rem',
                  boxSizing: 'border-box',
                  border: '1.5px solid #9b5de5',
                  background: 'rgba(15, 10, 22, 0.8)',
                  animation: 'pulse-purple-glow 1.5s infinite alternate'
                }}
              >
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#ffb813',
                  textShadow: '0 0 5px rgba(255, 184, 19, 0.5)'
                }}>
                  {(() => {
                    const m = Math.floor(ritualTimeLeft / 60).toString().padStart(2, '0');
                    const s = (ritualTimeLeft % 60).toString().padStart(2, '0');
                    return `${m}:${s}`;
                  })()}
                </span>
                <span style={{ color: 'rgba(155, 93, 229, 0.4)' }}>|</span>
                <span style={{
                  fontSize: '0.75rem',
                  color: '#9b5de5',
                  fontWeight: 'bold',
                  textShadow: '0 0 8px rgba(155, 93, 229, 0.5)',
                  letterSpacing: '1px'
                }}>
                  🔮 РИТУАЛ
                </span>
              </div>
            )}

            {!activeTask && !ritualTimerActive && huntIsRunning && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  height: '32px',
                  marginRight: '0.4rem',
                  boxSizing: 'border-box',
                  border: huntIsBreak ? '1.5px solid #2ed573' : '1.5px solid var(--color-blood-glow, #8b1a1a)',
                  background: huntIsBreak ? 'rgba(10, 22, 15, 0.8)' : 'rgba(22, 10, 10, 0.8)',
                  animation: huntIsBreak ? 'pulse-green-glow 1.5s infinite alternate' : 'pulse-red-glow 1.5s infinite alternate'
                }}
              >
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: huntIsBreak ? '#2ed573' : '#ff4d4d',
                  textShadow: huntIsBreak ? '0 0 5px rgba(46, 213, 115, 0.5)' : '0 0 5px rgba(255, 77, 77, 0.5)'
                }}>
                  {(() => {
                    if (huntIsBreak) {
                      const m = Math.floor(huntBreakTimeLeft / 60).toString().padStart(2, '0');
                      const s = (huntBreakTimeLeft % 60).toString().padStart(2, '0');
                      return `${m}:${s}`;
                    } else if (huntMode === 'pomodoro') {
                      const m = Math.floor(huntTimerValue / 60).toString().padStart(2, '0');
                      const s = (huntTimerValue % 60).toString().padStart(2, '0');
                      return `${m}:${s}`;
                    } else {
                      const m = Math.floor(huntTimeSpent / 60).toString().padStart(2, '0');
                      const s = (huntTimeSpent % 60).toString().padStart(2, '0');
                      return `${m}:${s}`;
                    }
                  })()}
                </span>
                <span style={{ color: huntIsBreak ? 'rgba(46, 213, 115, 0.4)' : 'rgba(139, 26, 26, 0.4)' }}>|</span>
                <span style={{
                  fontSize: '0.75rem',
                  color: huntIsBreak ? '#2ed573' : '#ff4d4d',
                  fontWeight: 'bold',
                  textShadow: huntIsBreak ? '0 0 8px rgba(46, 213, 115, 0.5)' : '0 0 8px rgba(255, 77, 77, 0.5)',
                  letterSpacing: '1px'
                }}>
                  {huntIsBreak ? '⛺ ПРИВАЛ' : '🏹 ОХОТА'}
                </span>
              </div>
            )}
          </>
        )}
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
