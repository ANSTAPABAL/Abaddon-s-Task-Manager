import React, { useState, useRef, useEffect } from 'react';
import { Skull, HelpCircle, Sparkles, RefreshCw, Send, ArrowLeft } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

export default function RecoveryScreen({ 
  character, 
  setCharacter, 
  tasks, 
  setTasks 
}) {
  const { playClick, playSuccess, playBoneCrack, setAtmosphereMood } = useAudio();
  const [chatStarted, setChatStarted] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [chatLog, setChatLog] = useState([]); // elements: { role: 'oracle' | 'user', content: string }
  const [apiMessages, setApiMessages] = useState([]); // for full history sent to DeepSeek
  
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, chatLoading]);

  const handleStartHelpChat = async () => {
    playClick();
    setChatStarted(true);
    setChatLoading(true);
    setChatLog([]);
    setAtmosphereMood('recovery');

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === todayStr && t.status === 'active');
    const backlogTasks = tasks.filter(t => t.date === null && t.status === 'active');

    const initialPrompt = `Ты — Оракул Бездны (Oracle of the Void), древний, таинственный и суровый наставник из темного готического мира Абаддон. К тебе пришел изгнанник по имени ${character.name} (класс: ${character.class}, уровень: ${character.level}, здоровье разума: ${character.hp}/100) в поисках направления. Он растерян, парализован или перегружен задачами.

Вот список его текущих контрактов (задач) на сегодня:
${todayTasks.length > 0 ? todayTasks.map(t => `- [${t.type}] "${t.title}" (скверна: ${t.curseLevel}/5)`).join('\n') : '(нет активных контрактов на сегодня)'}

Вот список контрактов в его бэклоге (Договор с Черепом):
${backlogTasks.length > 0 ? backlogTasks.map(t => `- [${t.type}] "${t.title}" (скверна: ${t.curseLevel}/5)`).join('\n') : '(бэклог пуст)'}

Твоя цель:
1. Поприветствуй его в готическом стиле, соответствующем его состоянию.
2. Проанализируй его текущую нагрузку. Мрачно, но ободряюще подтолкни его к действию.
3. Задай ровно 2-3 конкретных, прямых вопроса о его задачах, чтобы помочь ему выбрать ровно одну задачу для фокуса или помочь отсеять/перенести лишнее.
4. Отвечай кратко, не пиши огромные простыни текста. Будь загадочным и мудрым.
5. Говори ИСКЛЮЧИТЕЛЬНО на языке темного фэнтези и вселенной Абаддона. Не используй термины реального мира или психологии (никаких слов: СДВГ, дофамин, прокрастинация, тайм-менеджмент, синдром, терапия и т.д.). Вместо "задачи" говори "контракты" или "обеты", вместо "усталость" говори "слабость духа" или "оковы плоти".`;

    const initialMessages = [{ role: 'user', content: initialPrompt }];

    try {
      const response = await fetch('http://localhost:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: initialMessages })
      });
      if (!response.ok) throw new Error("Бездна перегружена");
      const data = await response.json();
      const text = data.choices[0].message.content;
      
      setChatLog([{ role: 'oracle', content: text }]);
      setApiMessages([
        { role: 'user', content: initialPrompt },
        { role: 'assistant', content: text }
      ]);
      playSuccess();
    } catch (e) {
      const fallbackText = `«Изгнанник ${character.name}, туман сгущается над твоим разумом. Твои обеты тяжелы, а оковы плоти тянут на дно. Ответь мне: какой из твоих сегодняшних контрактов страшит тебя сильнее всего? Запиши свой ответ, и мы рассеем этот мрак вместе.»`;
      setChatLog([{ role: 'oracle', content: fallbackText }]);
      setApiMessages([
        { role: 'user', content: initialPrompt },
        { role: 'assistant', content: fallbackText }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || chatLoading) return;

    playClick();
    const userMsgText = inputText.trim();
    setInputText('');

    const updatedChatLog = [...chatLog, { role: 'user', content: userMsgText }];
    setChatLog(updatedChatLog);

    const updatedApiMessages = [...apiMessages, { role: 'user', content: userMsgText }];
    setApiMessages(updatedApiMessages);
    setChatLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedApiMessages })
      });
      if (!response.ok) throw new Error("Бездна перегружена");
      const data = await response.json();
      const text = data.choices[0].message.content;

      setChatLog([...updatedChatLog, { role: 'oracle', content: text }]);
      setApiMessages([...updatedApiMessages, { role: 'assistant', content: text }]);
      playSuccess();
    } catch (e) {
      const fallbackText = `«Шум Бездны глушит наши голоса. Но помни, изгнанник: твоя воля — твой единственный щит. Выбери один контракт, сделай первый шаг, и мрак отступит.»`;
      setChatLog([...updatedChatLog, { role: 'oracle', content: fallbackText }]);
      setApiMessages([...updatedApiMessages, { role: 'assistant', content: fallbackText }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleBuryAllBacklog = () => {
    playBoneCrack();
    setTasks(prev => prev.map(t => t.date === null ? { ...t, status: 'buried' } : t));
    alert("Все мертвые долги из Договора с черепом были преданы земле! Разум полностью чист.");
  };

  return (
    <div className="rpg-panel" style={{ border: '2px solid var(--color-blood)', animation: 'pulse-red 8s infinite', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(230, 223, 211, 0.08)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="gothic-title" style={{ color: 'var(--color-blood-glow)', fontSize: '1.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            🕯 Палата Восстановления (Recovery)
          </h1>
          <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.88rem', marginTop: '0.2rem', textAlign: 'left' }}>
            Аварийный терминал для перегруженного разума. Здесь нет спешки, штрафов или чувства вины.
          </p>
        </div>
        {chatStarted && (
          <button 
            className="rpg-btn" 
            style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => { playClick(); setChatStarted(false); setChatLog([]); setApiMessages([]); }}
          >
            <ArrowLeft size={12} />
            ВЫЙТИ
          </button>
        )}
      </div>

      {/* CHAT LOG VIEW */}
      {chatStarted ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
          
          {/* Chat Container */}
          <div style={{ 
            background: 'rgba(5, 4, 6, 0.65)', 
            border: '1px solid var(--color-iron-light)', 
            borderRadius: '6px', 
            padding: '1.2rem', 
            height: '350px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
          }}>
            {chatLog.map((msg, index) => {
              const isOracle = msg.role === 'oracle';
              return (
                <div 
                  key={index}
                  style={{
                    alignSelf: isOracle ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    background: isOracle ? 'rgba(42, 28, 52, 0.4)' : 'rgba(38, 32, 22, 0.5)',
                    border: isOracle ? '1px solid rgba(187, 0, 255, 0.25)' : '1px solid rgba(255, 184, 19, 0.25)',
                    borderRadius: '8px',
                    padding: '0.8rem 1.2rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    color: isOracle ? '#e2d7e8' : '#eeddbb',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    fontFamily: isOracle ? 'Georgia, serif' : 'var(--font-sans)',
                    fontStyle: isOracle ? 'italic' : 'normal',
                    borderLeftWidth: isOracle ? '4px' : '1px',
                    borderRightWidth: isOracle ? '1px' : '4px',
                    borderLeftColor: isOracle ? 'var(--color-mana-glow)' : 'rgba(255, 184, 19, 0.25)',
                    borderRightColor: isOracle ? 'rgba(187, 0, 255, 0.25)' : 'var(--color-relic-glow)'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: isOracle ? 'var(--color-mana-glow)' : 'var(--color-relic-glow)', fontWeight: 'bold', marginBottom: '4px', fontFamily: 'var(--font-rpg)', fontStyle: 'normal' }}>
                    {isOracle ? '🔮 ОРАКУЛ БЕЗДНЫ' : '🕯️ ИСПОВЕДЬ ИЗГНАННИКА'}
                  </div>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>
                </div>
              );
            })}

            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(20, 20, 25, 0.3)', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={14} className="heartbeat-pulse fast" style={{ color: 'var(--color-mana-glow)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', fontStyle: 'italic' }}>
                  Оракул всматривается в плетение ваших мыслей...
                </span>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.6rem' }}>
            <input 
              type="text" 
              className="rpg-input" 
              style={{ flex: 1, fontSize: '0.9rem', padding: '0.75rem 1rem' }} 
              placeholder="Изложите свои сомнения или ответьте Оракулу..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={chatLoading}
            />
            <button 
              type="submit" 
              className="rpg-btn rpg-btn-mana" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1.5rem' }}
              disabled={chatLoading || !inputText.trim()}
            >
              <Send size={14} />
              <span>ОТПРАВИТЬ</span>
            </button>
          </form>

        </div>
      ) : (
        /* LAUNCH VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2rem 1rem', textAlign: 'center' }}>
          
          <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            
            <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 15px rgba(187, 0, 255, 0.2))' }}>
              🔮
            </div>

            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-bone)' }}>
              Когда когнитивный шум заглушает голос разума, и вы не знаете, к какому обету подступиться — воззовите к Оракулу Бездны. 
              <br />
              Древний страж распутает клубок ваших контрактов без упреков и суеты.
            </p>

            <button 
              className="rpg-btn rpg-btn-mana"
              style={{ 
                fontSize: '1.15rem', 
                padding: '12px 36px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem',
                borderColor: 'var(--color-relic-glow)',
                boxShadow: '0 0 15px rgba(187, 0, 255, 0.25)',
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}
              onClick={handleStartHelpChat}
            >
              <Sparkles size={18} />
              🛡️ ВЫЗОВ ПОМОЩИ
            </button>

          </div>

          {/* CEMETERY OF BACKLOG PANEL */}
          <div style={{ 
            marginTop: '3rem', 
            background: 'rgba(10, 8, 12, 0.5)', 
            padding: '1.2rem 2rem', 
            border: '1px dashed var(--color-blood)', 
            borderRadius: '6px',
            maxWidth: '650px',
            width: '100%',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--color-blood-glow)', fontFamily: 'var(--font-rpg)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Skull size={14} /> АЛТАРЬ ЗАХОРОНЕНИЯ БЭКЛОГА
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-bone-dim)', marginBottom: '12px', lineHeight: '1.4' }}>
              Если груз невыполненных обещаний в бэклоге давит тяжелым камнем и мешает сделать хоть один шаг — освободите свой разум. Проведите ритуал мгновенного захоронения для всех отложенных задач.
            </p>
            <button 
              className="rpg-btn rpg-btn-blood" 
              style={{ width: '100%', fontSize: '0.8rem', padding: '6px 12px' }} 
              onClick={handleBuryAllBacklog}
            >
              ☠ ПОХОРОНИТЬ ВЕСЬ БЭКЛОГ (Очистить разум от вины)
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
