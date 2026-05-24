import React, { useState } from 'react';
import { Skull, AlertOctagon, Heart, HelpCircle, EyeOff, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

export default function RecoveryScreen({ 
  character, 
  setCharacter, 
  tasks, 
  setTasks, 
  requestDeconstruction
}) {
  const { playClick, playSuccess, playBoneCrack, setAtmosphereMood } = useAudio();
  const [activeEmergency, setActiveEmergency] = useState(null); // fear, overwhelm, boring, lost
  
  // Return anchor state
  const [returnAnchorText, setReturnAnchorText] = useState(() => {
    return localStorage.getItem('return_anchor_text') || 'Вы остановились на редактировании кода. Предыдущий микро-шаг: открыть index.css. Мешало: громкий шум на улице.';
  });
  
  const [savingAnchor, setSavingAnchor] = useState(false);
  const [aiSupportOutput, setAiSupportOutput] = useState('');
  const [aiSupportLoading, setAiSupportLoading] = useState(false);

  const handleSaveAnchor = () => {
    playClick();
    localStorage.setItem('return_anchor_text', returnAnchorText);
    playSuccess();
    alert("Якорь возврата надежно запечатан в рунах!");
  };

  // Trigger Panic Relief from AI Tunnel
  const handlePanicRelief = async (type) => {
    playClick();
    setActiveEmergency(type);
    setAiSupportLoading(true);
    setAiSupportOutput('');
    setAtmosphereMood('recovery');
    
    let prompt = '';
    if (type === 'fear') {
      prompt = 'Я боюсь приступать к задачам. Меня охватывает страх идеальности и прокрастинация. Дай мне три теплых RPG-совета от лица древнего мудрого наставника во вселенной Абаддона и напиши ОДИН микроскопический, нулевой физический шаг (например: открыть вкладку браузера или просто положить руки на стол), чтобы разбить Стену Страха.';
    } else if (type === 'overwhelm') {
      prompt = 'На меня навалилось слишком много задач, я теряюсь в панике. Дай мне краткий, суровый, но ободряющий орденский приказ, как отсечь лишний груз. Выбери из хаоса одну вещь и помоги мне мысленно похоронить остальные, снизив когнитивный шум.';
    } else if (type === 'boring') {
      prompt = 'Мне невыносимо скучно делать текущие задачи. Придумай для меня забавное ролевое игровое испытание на 10 минут (например, представить, что я расшифровываю древний свиток нежити), чтобы вернуть интерес.';
    } else {
      prompt = 'Я полностью выпал из контекста и не знаю, где нахожусь и что делать дальше. Задай мне один простой вопрос, чтобы я мог нащупать опору.';
    }

    try {
      const messages = [{ role: 'user', content: prompt }];
      // Query local proxy which forwards to deepseek-v4-flash
      const response = await fetch('http://localhost:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      if (!response.ok) throw new Error("Бездна перегружена");
      const data = await response.json();
      setAiSupportOutput(data.choices[0].message.content);
      playSuccess();
    } catch (e) {
      setAiSupportOutput("Древние руны шепчут: «Остановись, дыши. Сделай один вдох. Ты изгнанник, но твоя воля сильнее оков. Просто налей стакан чистой воды и посиди минуту в тишине.»");
    } finally {
      setAiSupportLoading(false);
    }
  };

  const handleSacrificeManaForBoredom = () => {
    if (character.mana < 15) {
      alert("Недостаточно Маны для плетения руны Азарта!");
      return;
    }
    playSuccess();
    setCharacter(prev => ({
      ...prev,
      mana: prev.mana - 15,
      gold: prev.gold + 20 // instant gold boost to reward salvage behavior!
    }));
    alert("Вы соткали заклинание Руны Азарта! Скверна скуки временно отступила. Получено +20 Золота!");
  };

  const handleBuryAllBacklog = () => {
    playBoneCrack();
    setTasks(prev => prev.map(t => t.date === null ? { ...t, status: 'buried' } : t));
    alert("Все мертвые долги из Договора с черепом были преданы земле! Разум полностью чист.");
  };

  return (
    <div className="rpg-panel" style={{ border: '2px solid var(--color-blood)', animation: 'pulse-red 6s infinite' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="gothic-title" style={{ color: 'var(--color-blood-glow)', fontSize: '2rem' }}>
          🕯 Палата Восстановления (Recovery)
        </h1>
        <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
          Аварийный терминал для ADHD-разума. Здесь вас никто не накажет за срыв ритма или усталость.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* LEFT COLUMN: Return Anchor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="rpg-title" style={{ fontSize: '1.2rem', color: '#fff' }}>
            ⚓ Руна «Якорь Возврата»
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', lineHeight: '1.4' }}>
            Перед тем как уйти на перерыв, запишите сюда ровно 1–2 строчки: где вы остановились, что делали и что мешало. 
            Когда вы вернетесь в следующий раз, этот якорь спасет вас от мучительных попыток вспомнить с чего начать.
          </p>

          <textarea 
            className="rpg-input"
            style={{ width: '100%', minHeight: '120px', fontSize: '0.95rem', lineHeight: '1.4' }}
            placeholder="Я остановился на... Мешало..."
            value={returnAnchorText}
            onChange={(e) => setReturnAnchorText(e.target.value)}
          />

          <button className="rpg-btn rpg-btn-mana" onClick={handleSaveAnchor}>
            ЗАПЕЧАТАТЬ ЯКОРЬ В РУНАХ
          </button>
        </div>

        {/* RIGHT COLUMN: Emergency Buttons */}
        <div>
          <h3 className="rpg-title" style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem' }}>
            🚨 Аварийная помощь: Я чувствую...
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <button className="panic-pill" onClick={() => handlePanicRelief('fear')}>
              😨 МНЕ СТРАШНО
            </button>
            <button className="panic-pill" onClick={() => handlePanicRelief('overwhelm')}>
              🤯 СЛИШКОМ МНОГО
            </button>
            <button className="panic-pill" onClick={() => handlePanicRelief('boring')}>
              🥱 МНЕ СКУЧНО
            </button>
            <button className="panic-pill" onClick={() => handlePanicRelief('lost')}>
              🧭 Я ПОТЕРЯЛСЯ
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', background: '#0a090b', padding: '1rem', border: '1px dashed var(--color-iron-light)' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--color-bone)', fontFamily: 'var(--font-rpg)', marginBottom: '5px' }}>
              КНОПКА МИЛОСЕРДИЯ:
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '10px' }}>
              Тяжелый груз старых планов в бэклоге отравляет совесть? Проведите ритуал мгновенных похорон для ВСЕХ задач бэклога.
            </p>
            <button className="rpg-btn rpg-btn-blood" style={{ width: '100%', fontSize: '0.8rem' }} onClick={handleBuryAllBacklog}>
              ☠ ПОХОРОНИТЬ ВЕСЬ БЭКЛОГ (Release Guilt)
            </button>
          </div>
        </div>

      </div>

      {/* LOWER PANEL: AI Response Output */}
      {activeEmergency && (
        <div style={{ 
          background: 'radial-gradient(circle, var(--color-iron) 0%, var(--color-iron-dark) 100%)', 
          border: '1px solid var(--color-bone-dim)', 
          padding: '1.5rem',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-iron-light)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <h3 className="rpg-title" style={{ color: 'var(--color-relic-glow)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} />
              <span>
                {activeEmergency === 'fear' && "Шепот Древнего Алтаря от Страха"}
                {activeEmergency === 'overwhelm' && "Военный Указ Против Перегруза"}
                {activeEmergency === 'boring' && "Испытание на Азарт"}
                {activeEmergency === 'lost' && "Нить Ариадны"}
              </span>
            </h3>
            <button 
              className="rpg-btn" 
              style={{ fontSize: '0.7rem', padding: '2px 8px' }}
              onClick={() => { playClick(); setActiveEmergency(null); setAiSupportOutput(''); }}
            >
              Скрыться в тумане
            </button>
          </div>

          {aiSupportLoading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <RefreshCw className="heartbeat-pulse fast" style={{ color: 'var(--color-mana-glow)', marginBottom: '0.5rem' }} size={24} />
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>Бездна сплетает исцеляющие слова воли...</p>
            </div>
          ) : (
            <div>
              <p style={{ 
                fontSize: '0.95rem', 
                color: '#fff', 
                lineHeight: '1.6', 
                fontFamily: 'Georgia, serif', 
                whiteSpace: 'pre-line',
                marginBottom: activeEmergency === 'boring' ? '1.5rem' : '0px'
              }}>
                {aiSupportOutput}
              </p>

              {activeEmergency === 'boring' && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button className="rpg-btn rpg-btn-mana" onClick={handleSacrificeManaForBoredom}>
                    🔮 ПОТРАТИТЬ 15 MP И АКТИВИРОВАТЬ РУНУ АЗАРТА
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
