import React, { useState, useEffect } from 'react';
import { Skull, AlertTriangle, ChevronRight, Zap, RefreshCw, X, AlertCircle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

export default function CarriageSession({ 
  character, 
  setCharacter, 
  tasks, 
  setTasks, 
  parseMessyTasks,
  activeSession,
  setActiveSession,
  playActiveSessionTrack
}) {
  const { playClick, playBoneCrack, playSuccess, startHeartbeat, stopHeartbeat, setAtmosphereMood } = useAudio();
  const [messyText, setMessyText] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [customBpm, setCustomBpm] = useState(60);

  // Exile/Setup Phase State
  const [setupStage, setSetupStage] = useState('lore'); // 'lore' -> 'input' -> 'review' -> 'crash' -> 'active'
  const [parsedList, setParsedList] = useState([]);
  
  // "Write to Survive" States
  const [survivalInput, setSurvivalInput] = useState('');
  const [survivalTimeLeft, setSurvivalTimeLeft] = useState(180); // 3 minutes
  const [survivalTimerStarted, setSurvivalTimerStarted] = useState(false);
  const [survivalCompleted, setSurvivalCompleted] = useState(false);

  // Active Session states
  const [activeTask, setActiveTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 min default
  const [isRunning, setIsRunning] = useState(false);
  const [sessionSteps, setSessionSteps] = useState([]);
  const [intentInput, setIntentInput] = useState('');

  // 1. Core initialization of Character
  const generateRandomCharacter = () => {
    playClick();
    const classes = [
      "Маг огня", "Маг земли", "Маг камня", "Некромант", "Рунный маг", "Рыцарь меча",
      "Химомансер (Маг крови) [РЕДКОЕ]", "Плазмомансер [УЛЬТРА-РЕДКОЕ]"
    ];
    const races = ["Человек", "Эльф", "Нежить", "Тролль", "Каргахаулец (Бледный гигант)"];
    const startingPerks = {
      "Маг огня": ["Огненный щит", "Вспышка страсти"],
      "Маг земли": ["Каменное упорство", "Заземление тревоги"],
      "Маг камня": ["Руна защиты", "Нерушимый фокус"],
      "Некромант": ["Воскрешение мертвых", "Договор с костями"],
      "Рунный маг": ["Начертание рун", "Магический барьер"],
      "Рыцарь меча": ["Закаленная воля", "Удар по прокрастинации"],
      "Химомансер (Маг крови) [РЕДКОЕ]": ["Жертва крови (HP -> Мгновенный шаг)", "Сгущение скверны"],
      "Плазмомансер [УЛЬТРА-РЕДКОЕ]": ["Разряд молнии (Супер-фокус)", "Плазменный барьер"]
    };

    const randClass = classes[Math.floor(Math.random() * classes.length)];
    const randRace = races[Math.floor(Math.random() * races.length)];
    
    setCharacter(prev => ({
      ...prev,
      race: randRace,
      class: randClass,
      perks: startingPerks[randClass] || ["Случайная стойкость"],
      shacklesBroken: false,
      hp: 100,
      maxHp: 100,
      mana: 50,
      maxMana: 50
    }));
    setSetupStage('input');
  };

  // 2. Parse Tasks with AI Tunnel
  const handleParseTasks = async () => {
    if (!messyText.trim()) return;
    setLoadingAI(true);
    playClick();
    try {
      const result = await parseMessyTasks(messyText);
      setParsedList(result);
      setSetupStage('review');
    } catch (e) {
      alert("Не удалось связаться с Бездной (AI Tunnel): " + e.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleStartCrashSequence = () => {
    playClick();
    // Add parsed tasks to database
    const newTasks = parsedList.map((t, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      title: t.title,
      type: t.type || 'hunt',
      status: 'active',
      date: new Date().toISOString().split('T')[0],
      pomodoroTime: t.estimatedTime || 25,
      pomodoroSpent: 0,
      toxicity: t.toxicity || 'standard',
      barrierType: null,
      curseLevel: 0,
      steps: t.steps ? t.steps.map((s, sIdx) => ({ id: `step-${sIdx}-${Date.now()}`, title: s, completed: false })) : [],
      intent: ''
    }));

    setTasks(prev => [...prev, ...newTasks]);
    // Pick the most toxic or first task as the active focus target
    const target = newTasks[0] || null;
    setActiveTask(target);
    if (target) {
      setTimeLeft(target.pomodoroTime * 60);
      setSessionSteps(target.steps);
    }

    setSetupStage('crash');
    setAtmosphereMood('escape');
  };

  // "Write to Survive" countdown logic
  useEffect(() => {
    let interval = null;
    if (setupStage === 'crash' && survivalTimerStarted && survivalTimeLeft > 0 && !survivalCompleted) {
      interval = setInterval(() => {
        setSurvivalTimeLeft(prev => prev - 1);
        // speed up heartbeat sound synth as time runs short
        const heartRate = survivalTimeLeft < 60 ? 120 : survivalTimeLeft < 120 ? 90 : 70;
        startHeartbeat(heartRate);
      }, 1000);
    } else if (survivalTimeLeft === 0) {
      // HP damage if failed to write first action in time
      setCharacter(prev => ({ ...prev, hp: Math.max(10, prev.hp - 20) }));
      handleWakeUp();
    }
    return () => {
      clearInterval(interval);
      stopHeartbeat();
    };
  }, [setupStage, survivalTimerStarted, survivalTimeLeft, survivalCompleted]);

  const handleSurvivalTyping = (e) => {
    const val = e.target.value;
    setSurvivalInput(val);
    if (!survivalTimerStarted && val.trim().length > 0) {
      setSurvivalTimerStarted(true);
      startHeartbeat(70);
    }
  };

  const handleWakeUp = () => {
    stopHeartbeat();
    playBoneCrack();
    playSuccess();
    setSurvivalCompleted(true);
    setCharacter(prev => ({ ...prev, shacklesBroken: true }));
    setSetupStage('active');
    setAtmosphereMood(activeTask?.type === 'siege' ? 'siege' : 'hunt');
    if (playActiveSessionTrack) playActiveSessionTrack(activeTask?.type === 'siege' ? 'siege' : 'hunt');
  };

  // Active Session Focus Timer
  useEffect(() => {
    let timer = null;
    if (setupStage === 'active' && isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playSuccess();
      alert("Сессия завершена! Вы очистили область пути.");
      // Level up & gold rewards
      const expReward = activeTask?.type === 'siege' ? 60 : 25;
      setCharacter(prev => {
        const nextXp = prev.xp + expReward;
        const xpNeeded = prev.level * 100;
        if (nextXp >= xpNeeded) {
          playSuccess();
          return { ...prev, level: prev.level + 1, xp: nextXp - xpNeeded, gold: prev.gold + 15, hp: prev.maxHp };
        }
        return { ...prev, xp: nextXp, gold: prev.gold + 5 };
      });
      // Save progress to task list
      if (activeTask) {
        setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: 'completed' } : t));
      }
    }
    return () => clearInterval(timer);
  }, [setupStage, isRunning, timeLeft]);

  const toggleTimer = () => {
    playClick();
    setIsRunning(!isRunning);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleToggleStep = (stepId) => {
    playClick();
    const updatedSteps = sessionSteps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s);
    setSessionSteps(updatedSteps);
    // Update master tasks list
    if (activeTask) {
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, steps: updatedSteps } : t));
    }
  };

  const handleFlee = () => {
    playClick();
    setIsRunning(false);
    // Fleeing costs cognitive endurance (HP)
    setCharacter(prev => ({ ...prev, hp: Math.max(10, prev.hp - 15) }));
    // Return task to backlog/active pool
    if (activeTask) {
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, date: null } : t));
    }
    setSetupStage('input');
    setAtmosphereMood('quiet_focus');
  };

  const handleExtend = () => {
    playClick();
    setTimeLeft(prev => prev + 600); // Add 10 minutes
  };

  const handleSacrificeHP = () => {
    if (character.hp <= 15) return;
    playBoneCrack();
    setCharacter(prev => ({ ...prev, hp: prev.hp - 10 }));
    // Complete first incomplete step instantly!
    const firstIncomplete = sessionSteps.find(s => !s.completed);
    if (firstIncomplete) {
      handleToggleStep(firstIncomplete.id);
    }
  };

  // --- RENDERING STAGES ---

  if (setupStage === 'lore') {
    return (
      <div className="rpg-panel" style={{ maxWidth: '750px', margin: '3rem auto', padding: '2.5rem' }}>
        <h1 className="gothic-title" style={{ color: 'var(--color-blood-glow)', fontSize: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          Повозка Смерти
        </h1>
        <p style={{ lineHeight: '1.7', color: 'var(--color-bone)', fontSize: '1.05rem', marginBottom: '1.5rem', fontFamily: 'Georgia, serif' }}>
          «Ты — изгнанник, совершивший непростительное злодеяние во вселенной Абаддона. Твои силы запечатаны, на руках звенят 
          тяжелые антимагические оковы. Тебя везли на скрипучей повозке к рубежам Империи Света, чтобы выпнуть в бескрайние 
          пустоши выживать в одиночку...»
        </p>
        <p style={{ lineHeight: '1.7', color: 'var(--color-bone-dim)', fontSize: '0.95rem', marginBottom: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Но у судьбы свои планы. На рубежах Каргахаула повозка попадает в засаду. Скрежет железа, грохот... Тебе нужно выбраться. 
          Но сперва давай разберемся с хаосом в твоей голове.
        </p>
        <div style={{ textAlign: 'center' }}>
          <button className="rpg-btn rpg-btn-blood" style={{ padding: '0.8rem 2.5rem', fontSize: '1.1rem' }} onClick={generateRandomCharacter}>
            СГЕНЕРИРОВАТЬ ГЕРОЯ
          </button>
        </div>
      </div>
    );
  }

  if (setupStage === 'input') {
    return (
      <div className="rpg-panel" style={{ maxWidth: '800px', margin: '1rem auto' }}>
        <h2 className="gothic-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-bone)' }}>
          Сплести заклинание Задач
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-bone-dim)', marginBottom: '1.5rem' }}>
          Вывалите сюда абсолютно все дела, которые вертятся в голове комом. Бессвязно, хаотично, эмоционально. 
          DeepSeek v4 Flash структурирует этот хаос, оценит «токсичность» каждой задачи и распределит их по типам (Охота, Осады, Реликвии).
        </p>

        <textarea
          className="rpg-input"
          style={{ width: '100%', minHeight: '220px', resize: 'vertical', fontFamily: 'monospace', fontSize: '1rem', marginBottom: '1.5rem', padding: '1rem' }}
          placeholder="Например: мне надо помыть посуду, но блин раковина полная и воняет, это пипец страшно начать. Еще сдать проект заказчику до среды, там куча мелких правок, надо написать тесты и проверить сборку, это огромная осада! Еще купить корм коту, это быстро. А, и позвонить бабушке, блин я откладываю это уже месяц, это прям гниющий труп..."
          value={messyText}
          onChange={(e) => setMessyText(e.target.value)}
          disabled={loadingAI}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>
              Класс: <b style={{ color: 'var(--color-mana-glow)' }}>{character.class}</b>
            </span>
          </div>
          <button 
            className="rpg-btn rpg-btn-mana" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem' }}
            onClick={handleParseTasks}
            disabled={loadingAI || !messyText.trim()}
          >
            {loadingAI ? <RefreshCw className="heartbeat-pulse fast" size={16} /> : <Zap size={16} />}
            {loadingAI ? "РАЗБИРАЕМ ХАОС..." : "СТРУКТУРИРОВАТЬ БЕЗДНОЙ"}
          </button>
        </div>
      </div>
    );
  }

  if (setupStage === 'review') {
    return (
      <div className="rpg-panel" style={{ maxWidth: '800px', margin: '1rem auto' }}>
        <h2 className="gothic-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-bone)' }}>
          Одобрить Пакт Задач
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', marginBottom: '1.5rem' }}>
          AI разложил ваш хаос по сущностям вселенной Абаддона. Проверьте их перед стартом аварийного побега.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {parsedList.map((t, idx) => (
            <div key={idx} style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid var(--color-iron-light)`,
              borderLeft: `4px solid ${t.type === 'siege' ? 'var(--color-blood)' : t.type === 'relic' ? 'var(--color-relic)' : 'var(--color-bone)'}`,
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <b style={{ color: '#fff', fontSize: '1.05rem' }}>{t.title}</b>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  background: t.type === 'siege' ? 'rgba(139,26,26,0.2)' : 'rgba(255,255,255,0.05)',
                  color: t.type === 'siege' ? 'var(--color-blood-glow)' : 'var(--color-bone-dim)',
                  border: `1px solid ${t.type === 'siege' ? 'var(--color-blood)' : 'var(--color-iron-light)'}`
                }}>
                  {t.type === 'siege' ? '💥 ОСАДА (БОСС)' : t.type === 'relic' ? '💎 РЕЛИКВИЯ' : t.type === 'corpse' ? '💀 ТРУП ПРОШЛОГО' : '🏹 ОХОТА'}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>
                <span>Время: <b>{t.estimatedTime || 25} мин</b></span>
                {t.toxicity && (
                  <span style={{ color: 'var(--color-blood-glow)' }}>
                    Токсичность: <b>{t.toxicity === 'scary' ? 'Страшно' : t.toxicity === 'vague' ? 'Мутно' : t.toxicity === 'tedious' ? 'Скучно' : 'Стандарт'}</b>
                  </span>
                )}
              </div>
              {t.steps && t.steps.length > 0 && (
                <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '1px dashed var(--color-iron-light)' }}>
                  {t.steps.map((s, sIdx) => (
                    <div key={sIdx} style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', marginTop: '2px' }}>
                      • {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="rpg-btn" onClick={() => setSetupStage('input')}>
            ВЕРНУТЬСЯ
          </button>
          <button className="rpg-btn rpg-btn-blood" style={{ padding: '0.75rem 2.5rem' }} onClick={handleStartCrashSequence}>
            РАЗБИТЬ ПОВОЗКУ И НАЧАТЬ
          </button>
        </div>
      </div>
    );
  }

  if (setupStage === 'crash') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        zIndex: 5000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        animation: 'pulse-red 3s infinite'
      }}>
        <div style={{ maxWidth: '650px', textAlign: 'center' }}>
          <h1 className="gothic-title" style={{ fontSize: '2.5rem', color: 'var(--color-blood-glow)', marginBottom: '1rem', letterSpacing: '0.15em' }}>
            НАПИШИ, ЧТОБЫ ВЫЖИТЬ
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-bone-dim)', marginBottom: '2rem' }}>
            Повозка перевернулась и разбита в щепки! Вы очнулись в кандалах под дождем. 
            Каргахаульские конвоиры лежат без сознания, но скверна стягивается.
            <b> Напишите первое элементарное физическое или умственное действие, которое вы сделаете ПРЯМО СЕЙЧАС, чтобы запустить процесс.</b>
          </p>

          <div style={{ fontSize: '1.2rem', color: '#fff', fontFamily: 'var(--font-rpg)', marginBottom: '1.5rem' }}>
            Текущая угроза: <span style={{ color: 'var(--color-blood-glow)' }}>{activeTask?.title}</span>
          </div>

          <input
            type="text"
            className="rpg-input"
            style={{ 
              width: '100%', 
              fontSize: '1.25rem', 
              textAlign: 'center', 
              padding: '1rem', 
              border: '2px solid var(--color-blood)',
              background: 'rgba(20, 10, 10, 0.8)',
              color: '#fff',
              marginBottom: '2rem'
            }}
            placeholder="Например: Открыть файл кода, или Дойти до раковины..."
            value={survivalInput}
            onChange={handleSurvivalTyping}
            disabled={survivalCompleted}
          />

          {survivalTimerStarted && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
              <div className={`heartbeat-pulse ${survivalTimeLeft < 60 ? 'fast' : ''}`} style={{ fontSize: '3rem', color: 'var(--color-blood-glow)', fontFamily: 'var(--font-rpg)', fontWeight: 'bold' }}>
                {survivalTimeLeft} c
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                Стучит сердце. Пиши или проиграешь когнитивный бой!
              </div>
            </div>
          )}

          {survivalInput.trim().length > 2 && (
            <button 
              className="rpg-btn rpg-btn-blood heartbeat-pulse" 
              style={{ fontSize: '1.3rem', padding: '1rem 3.5rem', border: '2px solid #fff', boxShadow: '0 0 25px var(--color-blood-glow)' }}
              onClick={handleWakeUp}
            >
              ОЧНУТЬСЯ
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- STAGE: ACTIVE SESSION (POMODORO BOSS FIGHT) ---
  if (setupStage === 'active' && activeTask) {
    const isBoss = activeTask.type === 'siege';

    return (
      <div className="rpg-panel" style={{ maxWidth: '900px', margin: '0 auto', border: `2px solid ${isBoss ? 'var(--color-blood-glow)' : 'var(--color-iron-light)'}` }}>
        {isBoss && (
          <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-blood)', color: '#fff', padding: '3px 15px', fontSize: '0.75rem', fontFamily: 'var(--font-rpg)', border: '1px solid var(--color-blood-glow)' }}>
            👹 БОСС-БИТВА (ОСАДА)
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="gothic-title" style={{ fontSize: '1.8rem', color: isBoss ? 'var(--color-blood-glow)' : '#fff' }}>
              {activeTask.title}
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Статус пути: {isBoss ? 'Осада цитадели' : 'Быстрая охота'}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '3rem', fontFamily: 'var(--font-rpg)', color: isRunning ? '#fff' : 'var(--color-bone-dim)', textShadow: isRunning ? '0 0 10px rgba(255,255,255,0.2)' : 'none' }}>
              {formatTime(timeLeft)}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>
              Оценка AI: {activeTask.pomodoroTime} мин
            </span>
          </div>
        </div>

        {/* Cognitive intent reminder */}
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.8rem 1.2rem', borderLeft: '3px solid var(--color-mana)', marginBottom: '1.5rem', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--color-bone)' }}>
          <b>Намерение сессии:</b> «Выжить и продвинуться вперед. Каждое действие ломает кандалы.»
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Active Steps list */}
          <div>
            <h3 className="rpg-title" style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--color-bone-dim)' }}>
              Шаги преодоления (разбито ИИ):
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sessionSteps.map((step) => (
                <div 
                  key={step.id} 
                  onClick={() => handleToggleStep(step.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    padding: '0.8rem',
                    background: step.completed ? 'rgba(0,0,0,0.2)' : 'var(--color-iron)',
                    border: '1px solid var(--color-iron-light)',
                    textDecoration: step.completed ? 'line-through' : 'none',
                    opacity: step.completed ? 0.5 : 1,
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={step.completed} 
                    onChange={() => {}} // handled by div click
                    style={{ pointerEvents: 'none' }}
                  />
                  <span style={{ fontSize: '0.95rem', color: step.completed ? 'var(--color-bone-dim)' : '#fff' }}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Spell Perks & Time control panel */}
          <div>
            <h3 className="rpg-title" style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--color-bone-dim)' }}>
              Магия и Действия:
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Blood Mage HP sacrifice perk */}
              {character.class.includes("Химомансер") && (
                <button 
                  className="rpg-btn rpg-btn-blood" 
                  style={{ fontSize: '0.8rem', padding: '8px' }}
                  onClick={handleSacrificeHP}
                  disabled={character.hp <= 15}
                >
                  🩸 ЖЕРТВА КРОВИ (Минус 10 HP за авто-шаг)
                </button>
              )}

              <button className="rpg-btn" onClick={handleExtend}>
                ⏳ ПРОДЛИТЬ НА 10 МИНУТ
              </button>

              <button className="rpg-btn rpg-btn-blood" onClick={handleFlee}>
                🏃 УБЕЖАТЬ (В бэклог, Урон: -15 HP)
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px dashed var(--color-iron-light)', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--color-bone)', marginBottom: '5px', fontFamily: 'var(--font-rpg)' }}>
                АВТОРИТЕТ КЛАССА:
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', lineHeight: '1.4' }}>
                Каждый завершенный шаг восполняет <b>+2 MP</b>. Полное завершение квеста дает <b>+25 XP</b> и исцеляет HP.
              </p>
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', borderTop: '1px solid var(--color-iron-light)', paddingTop: '1.2rem' }}>
          <button 
            className={`rpg-btn ${isRunning ? 'rpg-btn-blood' : 'rpg-btn-mana'}`} 
            style={{ fontSize: '1.2rem', padding: '0.6rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
            onClick={toggleTimer}
          >
            {isRunning ? "⚔ ПРИОСТАНОВИТЬ БОЙ" : "⚔ НАЧАТЬ СРАЖЕНИЕ"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rpg-panel" style={{ textAlign: 'center', padding: '3rem' }}>
      <Skull size={48} style={{ color: 'var(--color-blood-glow)', marginBottom: '1rem' }} />
      <h2 className="gothic-title">Повозка пуста</h2>
      <p style={{ color: 'var(--color-bone-dim)', marginTop: '0.5rem' }}>
        Все текущие цели достигнуты, либо вы еще не сгенерировали своего беглеца.
      </p>
      <button className="rpg-btn rpg-btn-blood" style={{ marginTop: '1.5rem' }} onClick={() => setSetupStage('lore')}>
        НАЧАТЬ НОВОЕ ПУТЕШЕСТВИЕ
      </button>
    </div>
  );
}
