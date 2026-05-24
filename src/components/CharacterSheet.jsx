import React, { useState } from 'react';
import { Shield, Sparkles, BookOpen, AlertCircle, RefreshCw, Trash2, Heart, Award, Key, DollarSign, Package, Eye, FileText } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

export default function CharacterSheet({ character, setCharacter, tasks, setTasks, requestDeconstruction, pedestals = [], savePedestals }) {
  const { playClick, playBoneCrack, playSuccess } = useAudio();
  const [selectedTask, setSelectedTask] = useState(null);
  const [sheetTab, setSheetTab] = useState('sheet'); // sheet, pedestals
  
  // Guided Deconstruction (ADHD Interview) States
  const [guidedModalOpen, setGuidedModalOpen] = useState(false);
  const [deconstructLoading, setDeconstructLoading] = useState(false);
  const [guidedQuestions, setGuidedQuestions] = useState([]);
  const [guidedAnswers, setGuidedAnswers] = useState({});
  const [guidedStep, setGuidedStep] = useState(0); // 0 = start, 1 = answering questions, 2 = steps generated

  // Customization handbook state
  const [assetScrollOpen, setAssetScrollOpen] = useState(false);

  // Shop Items Configuration
  const merchantItems = [
    { id: 'item_dagger', name: 'Кинжал Отсечения Долгов', slot: 'weapon', price: 10, bonus: '+15% к скорости Охоты', icon: '🗡️' },
    { id: 'item_sword', name: 'Палаш Кровавого Алтаря', slot: 'weapon', price: 25, bonus: '+25% к сбору Золота', icon: '⚔️' },
    { id: 'item_shield', name: 'Рунический Эгис Файрвола', slot: 'shield', price: 15, bonus: '+10 HP при отходе', icon: '🛡️' },
    { id: 'item_armor', name: 'Мантия Безмятежности', slot: 'armor', price: 30, bonus: '+25 к Макс HP', icon: '👘' },
    { id: 'item_ring', name: 'Перстень Допаминовой Сети', slot: 'ring', price: 20, bonus: '+5 MP за микро-действия', icon: '💍' },
    { id: 'item_potion', name: 'Зелье Когнитивной Выносливости', slot: 'potion', price: 8, bonus: 'Мгновенный сброс 60м усталости, лечит 25 HP', icon: '🧪' }
  ];

  // --- SHOP HANDLERS ---

  const handleBuyItem = (item) => {
    if (character.gold < item.price) {
      playClick();
      alert("Недостаточно Золота! Запечатывайте квесты на Осаду или Охоту в Задачнике, чтобы заработать.");
      return;
    }
    playClick();
    playSuccess();
    
    // Decrement gold, add item to inventory backpack
    setCharacter(prev => ({
      ...prev,
      gold: prev.gold - item.price,
      inventory: [...(prev.inventory || []), item]
    }));
  };

  const handleEquipFromInventory = (item, index) => {
    if (item.slot === 'potion') {
      playClick();
      playSuccess();
      setCharacter(prev => {
        const newInventory = [...prev.inventory];
        newInventory.splice(index, 1);
        
        const nextHp = Math.min(prev.maxHp, prev.hp + 25);
        const nextFatigue = Math.max(0, prev.dailyWorkMinutes - 60);
        
        return {
          ...prev,
          hp: nextHp,
          dailyWorkMinutes: nextFatigue,
          inventory: newInventory,
          potionsDrunk: (prev.potionsDrunk || 0) + 1
        };
      });
      alert("Вы выпили Зелье Когнитивной Выносливости! Восстановлено 25 HP здоровья разума, усталость снижена на 60 минут.");
      return;
    }

    playClick();
    playSuccess();

    // Set item in active equipped slot
    setCharacter(prev => {
      const currentEquipped = prev.equipped[item.slot];
      let newInventory = [...prev.inventory];
      
      // Remove newly equipped item from backpack
      newInventory.splice(index, 1);
      
      // If we already had something equipped in that slot, return it to backpack
      if (currentEquipped) {
        newInventory.push(currentEquipped);
      }

      return {
        ...prev,
        equipped: {
          ...prev.equipped,
          [item.slot]: item
        },
        inventory: newInventory
      };
    });
  };

  const handleUnequipItem = (slot) => {
    const item = character.equipped[slot];
    if (!item) return;
    
    playClick();
    setCharacter(prev => ({
      ...prev,
      equipped: {
        ...prev.equipped,
        [slot]: null
      },
      inventory: [...(prev.inventory || []), item]
    }));
  };

  // --- AI DECONSTRUCTION HANDLERS ---

  const handleInstantDeconstruct = async (task) => {
    playClick();
    setDeconstructLoading(true);
    try {
      const response = await requestDeconstruction(task, 'instant');
      const steps = response.steps.map((s, idx) => ({
        id: `step-${idx}-${Date.now()}`,
        title: s,
        completed: false
      }));

      setTasks(prev => prev.map(t => t.id === task.id ? { 
        ...t, 
        steps: steps,
        intent: response.intent || '',
        toxicity: response.toxicity || t.toxicity
      } : t));

      setSelectedTask(prev => prev && prev.id === task.id ? { ...prev, steps: steps } : prev);
      playSuccess();
    } catch (e) {
      alert("Не удалось связаться с Бездной (AI Tunnel): " + e.message);
    } finally {
      setDeconstructLoading(false);
    }
  };

  const handleStartGuidedDeconstruct = async (task) => {
    playClick();
    setDeconstructLoading(true);
    setGuidedModalOpen(true);
    setGuidedStep(0);
    setGuidedAnswers({});
    
    try {
      const response = await requestDeconstruction(task, 'guided_questions');
      setGuidedQuestions(response.questions || [
        "Какая самая скучная деталь в этой задаче?",
        "С чего физически проще всего начать?",
        "Что именно вызывает у вас страх или ступор?"
      ]);
      setGuidedStep(1);
    } catch (e) {
      alert("Не удалось запустить ритуал вопросов: " + e.message);
      setGuidedModalOpen(false);
    } finally {
      setDeconstructLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    playClick();
    setDeconstructLoading(true);
    try {
      const response = await requestDeconstruction(selectedTask, 'guided_steps', {
        questions: guidedQuestions,
        answers: guidedAnswers
      });

      const steps = response.steps.map((s, idx) => ({
        id: `step-${idx}-${Date.now()}`,
        title: s,
        completed: false
      }));

      setTasks(prev => prev.map(t => t.id === selectedTask.id ? {
        ...t,
        steps: steps,
        intent: response.intent || '',
        barrierType: response.barrierType || null
      } : t));

      setSelectedTask(prev => ({ ...prev, steps: steps }));
      setGuidedStep(2);
      playSuccess();
    } catch (e) {
      alert("Ошибка завершения ритуала: " + e.message);
    } finally {
      setDeconstructLoading(false);
    }
  };

  const handleToggleStep = (taskId, stepId) => {
    playClick();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updated = t.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s);
        return { ...t, steps: updated };
      }
      return t;
    }));

    setSelectedTask(prev => {
      if (prev && prev.id === taskId) {
        const updated = prev.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s);
        return { ...prev, steps: updated };
      }
      return prev;
    });

    setCharacter(prev => ({ ...prev, mana: Math.min(prev.maxMana, prev.mana + 2) }));
  };

  const getClassIcon = () => {
    if (character.class.includes("Некромант")) return "💀";
    if (character.class.includes("Рыцарь")) return "⚔";
    if (character.class.includes("огня")) return "🔥";
    if (character.class.includes("крови")) return "🩸";
    if (character.class.includes("Плазма")) return "⚡";
    if (character.class.includes("света")) return "☀️";
    if (character.class.includes("тьмы")) return "🌑";
    if (character.class.includes("бездны")) return "🕳️";
    if (character.class.includes("меток")) return "💮";
    return "✨";
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Top Sheet Tabs */}
      <div style={{ display: 'flex', gap: '5px', background: '#0a090c', padding: '3px', border: '1px solid var(--color-iron-light)', maxWidth: '420px', alignSelf: 'flex-start' }}>
        <button 
          onClick={() => { playClick(); setSheetTab('sheet'); }}
          style={{
            flex: 1, padding: '8px 15px', fontSize: '0.8rem', fontFamily: 'var(--font-rpg)', background: sheetTab === 'sheet' ? 'var(--color-iron)' : 'none',
            border: 'none', color: sheetTab === 'sheet' ? 'var(--color-relic-glow)' : 'var(--color-bone-dim)', borderBottom: sheetTab === 'sheet' ? '2px solid var(--color-relic)' : 'none', cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          👤 ПЕРСОНАЖ & ЛАВКА
        </button>
        <button 
          onClick={() => { playClick(); setSheetTab('pedestals'); }}
          style={{
            flex: 1, padding: '8px 15px', fontSize: '0.8rem', fontFamily: 'var(--font-rpg)', background: sheetTab === 'pedestals' ? 'var(--color-iron)' : 'none',
            border: 'none', color: sheetTab === 'pedestals' ? 'var(--color-mana-glow)' : 'var(--color-bone-dim)', borderBottom: sheetTab === 'pedestals' ? '2px solid var(--color-mana)' : 'none', cursor: 'pointer',
            fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center'
          }}
        >
          🏛️ ЗАЛ ПЬЕДЕСТАЛОВ ({pedestals.length})
        </button>
      </div>

      {sheetTab === 'sheet' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1.75fr', gap: '1.5rem' }}>
          {/* LEFT COLUMN: Character Paperdoll, Inventory Backpack, and Merchant Shop */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* 1. Paperdoll Board */}
        <div className="rpg-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h2 className="gothic-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{getClassIcon()}</span>
              <span>Лист Персонажа</span>
            </h2>
            
            <button 
              className="rpg-btn" 
              style={{ fontSize: '0.7rem', padding: '3px 8px', borderColor: 'var(--color-relic-glow)' }}
              onClick={() => { playClick(); setAssetScrollOpen(true); }}
            >
              <FileText size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              СВИДЕТЕЛЬСТВО АССЕТОВ
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '5px 10px', border: '1px solid var(--color-iron-light)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>Сундук с золотом:</span>
            <span style={{ fontSize: '1rem', color: 'var(--color-relic-glow)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
              🪙 {character.gold || 0} ЗОЛОТА
            </span>
          </div>

          {/* Paperdoll Slot Grid */}
          <div className="paperdoll-grid" style={{ marginBottom: '1rem' }}>
            {/* Left slots */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div 
                className={`paperdoll-slot ${character.equipped.weapon ? 'equipped' : ''}`}
                onClick={() => handleUnequipItem('weapon')}
                title={character.equipped.weapon ? "Кликните, чтобы снять меч" : "Слот под оружие"}
              >
                {character.equipped.weapon ? character.equipped.weapon.icon : '⚔️'}
                <span style={{ fontSize: '0.55rem', opacity: 0.8, textAlign: 'center', marginTop: '2px' }}>
                  {character.equipped.weapon ? character.equipped.weapon.name : 'Оружие'}
                </span>
              </div>
              <div 
                className={`paperdoll-slot ${character.equipped.ring ? 'equipped' : ''}`}
                onClick={() => handleUnequipItem('ring')}
                title={character.equipped.ring ? "Кликните, чтобы снять кольцо" : "Слот под кольцо"}
              >
                {character.equipped.ring ? character.equipped.ring.icon : '💍'}
                <span style={{ fontSize: '0.55rem', opacity: 0.8, textAlign: 'center', marginTop: '2px' }}>
                  {character.equipped.ring ? character.equipped.ring.name : 'Кольцо'}
                </span>
              </div>
            </div>

            {/* Center avatar */}
            <div className="paperdoll-avatar-center">
              <span style={{ fontSize: '5.5rem', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.05))' }}>
                {character.race === 'Каргахаулец (Бледный гигант)' ? '👹' : character.race === 'Нежить' ? '💀' : character.race === 'Эльф' ? '🧝' : '👤'}
              </span>
              <div style={{ position: 'absolute', bottom: '5px', width: '100%', textAlign: 'center', background: 'rgba(0,0,0,0.6)', padding: '2px', fontSize: '0.65rem' }}>
                {character.race}
              </div>
            </div>

            {/* Right slots */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div 
                className={`paperdoll-slot ${character.equipped.shield ? 'equipped' : ''}`}
                onClick={() => handleUnequipItem('shield')}
                title={character.equipped.shield ? "Кликните, чтобы снять щит" : "Слот под щит"}
              >
                {character.equipped.shield ? character.equipped.shield.icon : '🛡️'}
                <span style={{ fontSize: '0.55rem', opacity: 0.8, textAlign: 'center', marginTop: '2px' }}>
                  {character.equipped.shield ? character.equipped.shield.name : 'Щит'}
                </span>
              </div>
              <div 
                className={`paperdoll-slot ${character.equipped.armor ? 'equipped' : ''}`}
                onClick={() => handleUnequipItem('armor')}
                title={character.equipped.armor ? "Кликните, чтобы снять латы" : "Слот под броню"}
              >
                {character.equipped.armor ? character.equipped.armor.icon : '👘'}
                <span style={{ fontSize: '0.55rem', opacity: 0.8, textAlign: 'center', marginTop: '2px' }}>
                  {character.equipped.armor ? character.equipped.armor.name : 'Броня'}
                </span>
              </div>
            </div>
          </div>

          {/* Equipment modifiers active list */}
          {(character.equipped.weapon || character.equipped.ring || character.equipped.shield || character.equipped.armor) ? (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', border: '1px solid var(--color-iron-light)', fontSize: '0.75rem', marginBottom: '1rem' }}>
              <h4 style={{ fontFamily: 'var(--font-rpg)', color: 'var(--color-relic-glow)', marginBottom: '3px', textTransform: 'uppercase' }}>
                🛡️ Модификаторы снаряжения:
              </h4>
              {Object.entries(character.equipped).map(([slot, item]) => item && (
                <div key={slot} style={{ color: 'var(--color-bone-dim)', padding: '1px 0' }}>
                  • <b>{item.name}</b>: {item.bonus}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontStyle: 'italic', fontSize: '0.7rem', color: 'var(--color-iron-light)', textAlign: 'center', marginBottom: '1rem' }}>
              У вас нет активной экипировки. Приобретите её у Торговца!
            </div>
          )}

          {/* visual Inventory Backpack */}
          <div style={{ background: '#0a090b', padding: '0.8rem', border: '1px solid var(--color-iron-light)' }}>
            <h4 style={{ fontSize: '0.75rem', color: '#fff', marginBottom: '6px', fontFamily: 'var(--font-rpg)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Package size={12} />
              <span>РЮКЗАК СНАРЯЖЕНИЯ (Кликни чтобы надеть):</span>
            </h4>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', minHeight: '44px' }}>
              {(character.inventory && character.inventory.length > 0) ? (
                character.inventory.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleEquipFromInventory(item, idx)}
                    style={{ 
                      width: '42px', 
                      height: '42px', 
                      background: 'var(--color-iron)', 
                      border: '1px dashed var(--color-bone-dim)', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      fontSize: '1.3rem', 
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                    }}
                    title={`${item.name} (${item.bonus}) - Нажми чтобы экипировать!`}
                  >
                    {item.icon}
                  </div>
                ))
              ) : (
                <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--color-iron-light)', padding: '5px' }}>
                  Рюкзак пуст. Купите вещи у Торговца ниже.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Item Shop Board */}
        <div className="rpg-panel" style={{ border: '1px solid var(--color-relic-glow)', background: 'radial-gradient(circle, var(--color-iron-dark) 0%, var(--color-void) 100%)' }}>
          <h3 className="gothic-title" style={{ fontSize: '1.1rem', color: 'var(--color-relic-glow)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            🏪 Лавка Темного Торговца
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '1rem', lineHeight: '1.3' }}>
            В лавке Абаддона продаются артефакты, помогающие ADHD-беглецам удерживать когнитивное внимание.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {merchantItems.map(item => {
              const alreadyBought = item.slot !== 'potion' && (character.inventory?.some(i => i.id === item.id) || Object.values(character.equipped).some(i => i && i.id === item.id));
              
              return (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--color-iron-light)',
                    padding: '8px 10px',
                    opacity: alreadyBought ? 0.4 : 1
                  }}
                >
                  <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-bone-dim)', fontStyle: 'italic' }}>{item.bonus}</div>
                  </div>
                  <button 
                    className="rpg-btn" 
                    style={{ fontSize: '0.75rem', padding: '4px 10px', borderColor: 'var(--color-relic-glow)' }}
                    onClick={() => handleBuyItem(item)}
                    disabled={alreadyBought}
                  >
                    {alreadyBought ? 'Приобретено' : `🪙 ${item.price}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Active Quests list & AI Deconstructors */}
      <div className="rpg-panel">
        <h2 className="gothic-title" style={{ fontSize: '1.3rem', marginBottom: '1.2rem' }}>
          Активные Контракты (Квесты)
        </h2>

        {tasks.filter(t => t.status === 'active').length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-bone-dim)', fontStyle: 'italic' }}>
            Нет активных контрактов. Отправьтесь в Задачник, чтобы добавить цели!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.filter(t => t.status === 'active').map(task => {
              const isSelected = selectedTask && selectedTask.id === task.id;
              
              return (
                <div 
                  key={task.id} 
                  style={{
                    background: isSelected ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${isSelected ? 'var(--color-bone-dim)' : 'var(--color-iron-light)'}`,
                    borderLeft: `4px solid ${task.type === 'siege' ? 'var(--color-blood)' : task.type === 'relic' ? 'var(--color-relic)' : 'var(--color-bone)'}`,
                    padding: '1rem',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div 
                    onClick={() => { playClick(); setSelectedTask(isSelected ? null : task); }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: '#fff', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                        {task.title}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginTop: '2px' }}>
                        {task.type === 'siege' ? 'ОСАДА (БОСС)' : task.type === 'relic' ? 'РЕЛИКВИЯ' : 'ОХОТА'} • {task.pomodoroTime} мин
                      </div>
                    </div>
                    {task.curseLevel > 0 && (
                      <span className="heartbeat-pulse" style={{ fontSize: '0.8rem', background: 'var(--color-curse)', color: '#fff', padding: '2px 6px', border: '1px solid var(--color-curse-glow)' }}>
                        ☠ СКВЕРНА УР.{task.curseLevel}
                      </span>
                    )}
                  </div>

                  {/* Expanded Task Deconstruction Options */}
                  {isSelected && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-iron-light)', paddingTop: '1rem' }}>
                      
                      {/* Active Intent display */}
                      {task.intent && (
                        <div style={{ padding: '0.5rem 0.8rem', background: 'rgba(0,0,0,0.3)', borderLeft: '2px solid var(--color-mana)', fontSize: '0.8rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                          <b>Зачем мне это сегодня:</b> {task.intent}
                        </div>
                      )}

                      {/* AI Deconstructor trigger buttons */}
                      {(!task.steps || task.steps.length === 0) ? (
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', marginBottom: '0.8rem' }}>
                            Эта задача еще не разложена на элементарные действия. СДВГ-мозг боится больших и неясных объемов. Позвольте Бездне разобрать её:
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="rpg-btn" 
                              onClick={() => handleInstantDeconstruct(task)}
                              disabled={deconstructLoading}
                              style={{ flex: 1, fontSize: '0.8rem' }}
                            >
                              🚀 БЫСТРО И ГРУБО
                            </button>
                            <button 
                              className="rpg-btn rpg-btn-mana" 
                              onClick={() => handleStartGuidedDeconstruct(task)}
                              disabled={deconstructLoading}
                              style={{ flex: 1, fontSize: '0.8rem' }}
                            >
                              🔮 СОПРОВОЖДЕНИЕ (ВОПРОСЫ)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', fontWeight: 'bold' }}>Шаги преодоления:</span>
                            <button 
                              className="rpg-btn" 
                              style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                              onClick={() => handleInstantDeconstruct(task)}
                              disabled={deconstructLoading}
                            >
                              {deconstructLoading ? 'ПЕРЕСОЗДАЕМ...' : '🔄 ПЕРЕРАЗБИТЬ ИИ'}
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {task.steps.map(step => (
                              <label 
                                key={step.id} 
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  fontSize: '0.9rem',
                                  color: step.completed ? 'var(--color-bone-dim)' : '#fff',
                                  textDecoration: step.completed ? 'line-through' : 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  background: 'rgba(0,0,0,0.15)'
                                }}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={step.completed} 
                                  onChange={() => handleToggleStep(task.id, step.id)}
                                />
                                <span>{step.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GUIDED DECONSTRUCTION INTERACTIVE MODAL */}
      {guidedModalOpen && selectedTask && (
        <div className="gothic-modal-overlay">
          <div className="gothic-modal-content" style={{ animation: 'screen-shiver 0.3s 1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-iron-light)', paddingBottom: '0.5rem' }}>
              <h3 className="gothic-title" style={{ fontSize: '1.2rem', color: 'var(--color-mana-glow)' }}>
                🔮 Ритуал Интеллектуальной Декомпозиции
              </h3>
              <button 
                onClick={() => setGuidedModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-bone-dim)', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            {deconstructLoading && guidedStep === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <RefreshCw className="heartbeat-pulse fast" style={{ color: 'var(--color-mana-glow)', marginBottom: '1rem' }} size={32} />
                <p style={{ fontFamily: 'var(--font-rpg)' }}>ИИ анализирует токсичность задачи и готовит ритуал вопросов...</p>
              </div>
            )}

            {guidedStep === 1 && (
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-bone)', marginBottom: '1.5rem' }}>
                  Чтобы разгрузить ваш когнитивный ресурс и обойти барьер «Стены Тошнотворного Страха», честно ответьте на эти уточняющие вопросы Безны:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {guidedQuestions.map((q, idx) => (
                    <div key={idx}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-bone-dim)', marginBottom: '4px', fontFamily: 'var(--font-rpg)' }}>
                        Вопрос {idx + 1}: {q}
                      </label>
                      <input 
                        type="text" 
                        className="rpg-input" 
                        style={{ width: '100%', fontSize: '0.95rem' }}
                        placeholder="Мой честный ответ..."
                        value={guidedAnswers[idx] || ''}
                        onChange={(e) => setGuidedAnswers({ ...guidedAnswers, [idx]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="rpg-btn" onClick={() => setGuidedModalOpen(false)}>
                    ОТСТУПИТЬ
                  </button>
                  <button 
                    className="rpg-btn rpg-btn-mana" 
                    onClick={handleAnswerSubmit}
                    disabled={deconstructLoading || Object.keys(guidedAnswers).length < guidedQuestions.length}
                  >
                    {deconstructLoading ? 'РАЗРУШАЕМ КАМЕНЬ...' : '✨ РАСЩЕПИТЬ НА ШАГИ'}
                  </button>
                </div>
              </div>
            )}

            {guidedStep === 2 && (
              <div style={{ textAlign: 'center' }}>
                <Award size={48} style={{ color: 'var(--color-relic-glow)', marginBottom: '1rem' }} />
                <h3 className="gothic-title" style={{ color: '#fff', marginBottom: '1rem' }}>Ритуал Завершен!</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-bone-dim)', marginBottom: '1.5rem' }}>
                  Бездна успешно расщепила тяжелый камень задачи на микро-кусочки. Оковы разума спали. Нажмите кнопку, чтобы закрыть окно и начать бой!
                </p>
                <button className="rpg-btn rpg-btn-mana" onClick={() => setGuidedModalOpen(false)}>
                  ПРИНЯТЬ КОНТРАКТ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSET CUSTOMIZATION HANDBOOK MODAL */}
      {assetScrollOpen && (
        <div className="gothic-modal-overlay">
          <div className="gothic-modal-content" style={{ maxWidth: '680px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-iron-light)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
              <h3 className="gothic-title" style={{ fontSize: '1.25rem', color: 'var(--color-relic-glow)' }}>
                📖 Книга Кастомизации & Поиска Ассетов
              </h3>
              <button className="rpg-btn" style={{ padding: '4px 10px' }} onClick={() => setAssetScrollOpen(false)}>
                Закрыть книгу
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Процедурные звуки Web Audio работают отлично, но вы можете сделать погружение полноценным! 
              Просто найдите и положите аудио файлы формата **.mp3** в вашу локальную папку:
              <br />
              <code style={{ background: '#000', padding: '3px 8px', color: '#1db954', fontSize: '0.85rem', fontFamily: 'monospace', display: 'inline-block', marginTop: '5px' }}>
                public/sounds/
              </code>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderLeft: '3px solid var(--color-relic-glow)' }}>
                <b style={{ color: '#fff', fontSize: '0.9rem' }}>🖱️ Звук Клика:</b>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>Имя файла: <code style={{ color: 'var(--color-mana-glow)' }}>public/sounds/click.mp3</code></div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginTop: '2px' }}>Рекомендуется: Короткий деревянный щелчок или звон меча из Diablo.</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderLeft: '3px solid var(--color-blood)' }}>
                <b style={{ color: '#fff', fontSize: '0.9rem' }}>☠️ Звук Разрушения / Смерти (Bury):</b>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>Имя файла: <code style={{ color: 'var(--color-blood-glow)' }}>public/sounds/bonecrack.mp3</code></div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginTop: '2px' }}>Рекомендуется: Хруст костей, скрежет тяжелой цепи, или звук смерти скелета.</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderLeft: '3px solid var(--color-mana)' }}>
                <b style={{ color: '#fff', fontSize: '0.9rem' }}>✨ Звук Запечатывания (Complete):</b>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>Имя файла: <code style={{ color: 'var(--color-mana-glow)' }}>public/sounds/success.mp3</code></div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginTop: '2px' }}>Рекомендуется: Звон церковного колокола, триумфальные фанфары или шелест святой магии.</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderLeft: '3px solid var(--color-blood-glow)' }}>
                <b style={{ color: '#fff', fontSize: '0.9rem' }}>💓 Звук Сердцебиения (Timer):</b>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>Имя файла: <code style={{ color: 'var(--color-blood-glow)' }}>public/sounds/heartbeat.mp3</code></div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginTop: '2px' }}>Рекомендуется: Глухой, двойной удар человеческого сердца. Автоматически ускоряется на таймере.</div>
              </div>
            </div>

            <h4 className="rpg-title" style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.5rem' }}>🎨 Кастомизация графики (CSS):</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', lineHeight: '1.4' }}>
              Вы можете заменить фоновые изображения на текстуры старинного пергамента! Положите картинку <code style={{ color: 'var(--color-relic-glow)' }}>parchment.png</code> в папку <code style={{ color: 'var(--color-mana-glow)' }}>public/</code> и укажите её в файле <code style={{ color: 'var(--color-mana-glow)' }}>src/index.css</code> для классов <code style={{ color: '#fff' }}>.rpg-panel</code> или <code style={{ color: '#fff' }}>.parchment-contract</code>.
            </p>
          </div>
        </div>
      )}

        </div>
      ) : (
        /* Persistent Hall of Pedestals (Legends Gallery) */
        <div className="rpg-panel" style={{ background: 'radial-gradient(circle, #0e0a0f 0%, #050406 100%)', border: '2px solid var(--color-relic-glow)', padding: '2rem' }}>
          <h2 className="gothic-title" style={{ fontSize: '1.8rem', color: 'var(--color-relic-glow)', textAlign: 'center', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>
            🏛️ Зал Бессмертных Легенд Абаддона
          </h2>
          <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '650px', margin: '0 auto 2.5rem auto', lineHeight: '1.5', fontStyle: 'italic' }}>
            «В этих холодных стенах застыли души тех беглецов, что сотворили великую добродетель, запечатали Скверну 
            и с триумфом покинули мрачные границы Абаддона, обретя новые благородные цели.»
          </p>

          {pedestals.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {pedestals.map((legend, idx) => (
                <div 
                  key={idx} 
                  style={{
                    background: '#0a080c',
                    border: '2px solid #d4af37',
                    borderImage: 'linear-gradient(to bottom, #d4af37, #aa820a, #1a1505) 1',
                    padding: '1.5rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.8), inset 0 0 15px rgba(212,175,55,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ borderBottom: '1px solid #4a3e31', paddingBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>☀️</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-relic-glow)', fontFamily: 'var(--font-rpg)' }}>ЛЕГЕНДА #{idx + 1}</span>
                    </div>
                    <h3 className="gothic-title" style={{ fontSize: '1.3rem', color: '#ffb813', marginTop: '4px' }}>{legend.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', marginTop: '2px' }}>
                      {legend.race} • {legend.class} • <b>Уровень {legend.level}</b>
                    </div>
                  </div>

                  {/* Eulogy stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-bone-dim)', background: 'rgba(0,0,0,0.3)', padding: '8px', border: '1px solid var(--color-iron-light)', textAlign: 'left' }}>
                    <div>📜 Квесты: <b>{legend.completedTasksCount || 0} шт</b></div>
                    <div>👹 Боссы: <b>{legend.completedSiegesCount || 0} шт</b></div>
                    <div>🪙 Золото: <b>{legend.totalGoldEarned || 0}</b></div>
                    <div>🔮 Мана: <b>{legend.totalManaSpent || 0} MP</b></div>
                    <div>🧪 Зелья: <b>{legend.potionsDrunk || 0} шт</b></div>
                    <div>🎪 Медитации: <b>{legend.meditationsCount || 0}</b></div>
                    <div style={{ gridColumn: 'span 2' }}>🩸 Пролито здоровья: <b>{legend.totalHpSacrificed || 0} HP</b></div>
                  </div>

                  {/* Unfolding AI Scroll */}
                  <div style={{ background: 'radial-gradient(circle, #1a1613 0%, #0d0b09 100%)', border: '1px solid #4a3e31', padding: '1rem', color: '#cbbba5', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '0.78rem', fontFamily: 'var(--font-rpg)', borderBottom: '1px solid #33281e', paddingBottom: '3px', marginBottom: '8px', color: '#ffb813', textTransform: 'uppercase' }}>
                      📜 Летопись Искупления ИИ:
                    </h4>
                    <div style={{ fontSize: '0.75rem', lineHeight: '1.4', overflowY: 'auto', maxHeight: '180px', textAlign: 'justify', whiteSpace: 'pre-line' }}>
                      {legend.pedestalEulogy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ border: '1px dashed #4a3e31', padding: '3rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', maxWidth: '500px', margin: '0 auto' }}>
              <Skull size={32} style={{ color: 'var(--color-iron-light)', marginBottom: '0.8rem' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--color-bone-dim)', fontStyle: 'italic' }}>
                Зал Пьедесталов пуст и погружен во тьму. Ваши герои еще не взошли на постамент бессмертия.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-iron-light)', marginTop: '8px', lineHeight: '1.4' }}>
                ☀️ Запечатайте как минимум <b>15 контрактов</b> и одолейте <b>3 тяжелых Осады (Боссов)</b>, чтобы разблокировать Ритуал Искупления в боевом штабе Повозки и вписать своего первого героя в вечные летописи Света!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
