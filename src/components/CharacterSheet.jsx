import React, { useState } from 'react';
import { Shield, Sparkles, BookOpen, AlertCircle, RefreshCw, Trash2, Heart, Award, Key, DollarSign, Package, Eye, FileText, Skull } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

const getRacePortraitUrl = (race) => {
  const r = race ? race.toLowerCase() : '';
  if (r.includes('человек')) return 'http://localhost:3001/races/human.jpg';
  if (r.includes('эльф')) return 'http://localhost:3001/races/elf.jpg';
  if (r.includes('тролль')) return 'http://localhost:3001/races/troll.jpg';
  if (r.includes('каргахаул')) return 'http://localhost:3001/races/kargahaul.jpg';
  return null;
};

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
    { id: 'item_ring', name: 'Перстень Допаминовой Сети', slot: 'ring', price: 20, bonus: '+5 RP за микро-действия', icon: '💍' },
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
    if (character.class.includes("Бандит") || character.class.includes("Изгоев") || character.class.includes("Головорез")) return "🗡️";
    if (character.class.includes("Каратель") || character.class.includes("Храмовник")) return "🕯️";
    if (character.class.includes("Паладин")) return "🛡️";
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{
                width: '125px',
                height: '170px',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#0d0a10',
                border: '2px solid var(--color-relic)',
                boxShadow: '0 0 15px rgba(0,0,0,0.9)',
                overflow: 'hidden',
                borderRadius: '4px'
              }}>
                {getRacePortraitUrl(character.race) ? (
                  <img 
                    src={getRacePortraitUrl(character.race)} 
                    alt={character.race} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center 15%',
                      opacity: 0.95,
                      filter: 'contrast(1.05) brightness(0.9) drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.05))' }}>
                    {character.race === 'Каргахаулец (Бледный гигант)' ? '👹' : character.race === 'Нежить' ? '💀' : character.race === 'Эльф' ? '🧝' : '👤'}
                  </span>
                )}
                
                {/* Race Label overlay at the bottom of the frame */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)',
                  padding: '4px 2px',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-rpg)',
                  color: 'var(--color-bone)',
                  textAlign: 'center',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {character.race}
                </div>
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

          {/* Race description box */}
          {(() => {
            const raceDescriptions = {
              'Человек': {
                lore: 'Ловкий и гибкий духом. Потомок строителей старого мира. Не имеет ярко выраженных слабостей, но быстрее приспосабливается к когнитивной нагрузке.',
                trait: '✨ Адаптивность: Сбалансированное восстановление сил.',
                icon: '👤'
              },
              'Эльф': {
                lore: 'Древнее создание, чье восприятие времени растянуто на века. Обладает высоким запасом ментальных сил, но склонен к меланхолии и глубокой прокрастинации.',
                trait: '🍃 Вневременной фокус: Повышенная регенерация маны.',
                icon: '🧝'
              },
              'Нежить': {
                lore: 'Существо, восставшее из могил прошлого. Ему чужды усталость плоти, но скверна незавершенных дел сильнее разъедает его разум.',
                trait: '💀 Оковы смерти: Устойчивость к усталости, но повышенный урон от просроченных дел.',
                icon: '💀'
              },
              'Тролль': {
                lore: 'Дикий житель окраин, обладающий колоссальной регенерацией и силой, но с трудом справляющийся со сложными рунами.',
                trait: '🐗 Регенерация плоти: Повышенное исцеление HP при использовании зелий.',
                icon: '🐗'
              },
              'Каргахаулец (Бледный гигант)': {
                lore: 'Суровый исполин из заснеженных клыков Каргахаула. Привык преодолевать ледяные бури и колоссальные препятствия.',
                trait: '👹 Ледяная стойкость: Увеличенный максимальный запас HP разума.',
                icon: '👹'
              }
            };
            const raceInfo = Object.entries(raceDescriptions).find(([name]) => character.race && character.race.includes(name));
            if (!raceInfo) return null;
            const [raceName, info] = raceInfo;
            return (
              <div style={{ background: 'rgba(25, 20, 30, 0.4)', padding: '0.6rem 0.8rem', border: '1px dashed var(--color-relic-glow)', fontSize: '0.75rem', marginBottom: '1rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-rpg)', color: 'var(--color-relic-glow)', margin: '0 0 4px 0', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{info.icon}</span>
                  <span>Наследие Расы: {raceName}</span>
                </h4>
                <p style={{ color: 'var(--color-bone-dim)', margin: '0 0 6px 0', fontStyle: 'italic', lineHeight: '1.3' }}>
                  {info.lore}
                </p>
                <div style={{ color: '#ffb813', fontWeight: 'bold' }}>
                  {info.trait}
                </div>
              </div>
            );
          })()}

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

              </div>

      {/* RIGHT COLUMN: Hero Biography Scroll */}
      <div className="rpg-panel" style={{ 
        background: 'radial-gradient(circle, #1a1412 0%, #0a0706 100%)', 
        border: '2px solid var(--color-relic-glow)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.8), inset 0 0 20px rgba(212,175,55,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minHeight: '400px'
      }}>
        <div style={{ borderBottom: '1px solid #4a3e31', paddingBottom: '0.8rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2rem' }}>📜</span>
          <h2 className="gothic-title" style={{ fontSize: '1.4rem', color: 'var(--color-relic-glow)', margin: '0.3rem 0 0 0' }}>
            Хроника Жизни и Деяний
          </h2>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-rpg)' }}>
            Биография Изгнанника разума
          </div>
        </div>

        <div className="rpg-scrollbar" style={{ 
          flex: 1, 
          maxHeight: '480px', 
          overflowY: 'auto', 
          padding: '0.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem' 
        }}>
          {(() => {
            const bio = character.biography && character.biography.length > 0
              ? character.biography 
              : [`Родился под знаком Бездны как ${character.race || 'Человек'} (${character.class || 'Воин'}). Ступил на путь когнитивного искупления в Абаддоне.`];
            
            return bio.map((entry, idx) => (
              <div 
                key={idx}
                style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  border: '1px solid #33281e', 
                  borderLeft: '3px solid var(--color-relic)', 
                  padding: '0.8rem 1rem',
                  borderRadius: '3px',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--color-iron-light)', fontFamily: 'monospace', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Запись #{idx + 1}
                </div>
                <p style={{ 
                  fontSize: '0.85rem', 
                  color: '#dfc5c5', 
                  lineHeight: '1.5', 
                  fontFamily: 'Georgia, serif', 
                  margin: 0, 
                  textAlign: 'justify',
                  whiteSpace: 'pre-line' 
                }}>
                  {entry}
                </p>
              </div>
            ));
          })()}
        </div>
        
        <div style={{ borderTop: '1px solid #33281e', paddingTop: '0.6rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-bone-dim)', fontStyle: 'italic' }}>
          Каждый запечатанный контракт и совершенный выбор вписывают новую главу в эту летопись.
        </div>
      </div>

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
            🏛️ Зал Вечных Пьедесталов
          </h2>
          <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '650px', margin: '0 auto 2.5rem auto', lineHeight: '1.5', fontStyle: 'italic' }}>
            Здесь увековечены духи героев, бросивших вызов когнитивному застою. Те, кто искупил свои долги пред Светом, сияют на Золотых Столпах. Те, кто сдался Бездне, навек погребены в багровом мраке...
          </p>

          {/* Legend stats header badges */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.35)', padding: '6px 16px', fontSize: '0.85rem', color: '#ffb813', borderRadius: '3px', fontFamily: 'var(--font-rpg)', letterSpacing: '0.5px' }}>
              😇 Освященные души: <b>{pedestals.filter(p => p.legacyStatus === 'sanctified').length}</b>
            </span>
            <span style={{ background: 'rgba(207,20,43,0.06)', border: '1px solid rgba(207,20,43,0.35)', padding: '6px 16px', fontSize: '0.85rem', color: '#ff4d4d', borderRadius: '3px', fontFamily: 'var(--font-rpg)', letterSpacing: '0.5px' }}>
              💀 Запятнанные души: <b>{pedestals.filter(p => p.legacyStatus === 'stained').length}</b>
            </span>
          </div>

          {pedestals && pedestals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* === THE THREE PILLARS OF ASCENSION === */}
              {(() => {
                const sorted = [...pedestals].sort((a, b) => {
                  const scoreA = (a.completedTasksCount || 0) + (a.completedSiegesCount || 0) * 3;
                  const scoreB = (b.completedTasksCount || 0) + (b.completedSiegesCount || 0) * 3;
                  return scoreB - scoreA;
                });
                
                const top3 = sorted.slice(0, 3);
                const rest = sorted.slice(3);
                
                const getPillarTitle = (legend) => {
                  const sieges = legend.completedSiegesCount || 0;
                  const lvl = legend.level || 1;
                  if (legend.legacyStatus === 'stained') return "Падшая Тень Бездны";
                  if (sieges >= 5) return "Верховный Истребитель Скверны";
                  if (lvl >= 5) return "Архимагистр Когнитивной Воли";
                  return "Искупивший Изгнанник";
                };

                const getPillarIcon = (legend) => {
                  const c = legend.class ? legend.class.toLowerCase() : "";
                  if (c.includes("некромант")) return "💀";
                  if (c.includes("рыцарь")) return "⚔️";
                  if (c.includes("маг огня")) return "🔥";
                  if (c.includes("маг крови")) return "🩸";
                  if (c.includes("маг света")) return "☀️";
                  if (c.includes("маг тьмы")) return "🌑";
                  if (c.includes("маг бездны")) return "🕳️";
                  return "👤";
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ borderBottom: '1px dashed #d4af37', paddingBottom: '0.5rem', textAlign: 'center' }}>
                      <h3 className="gothic-title" style={{ fontSize: '1.4rem', color: '#ffb813', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        👑 ТРИ ВЕЛИКИХ СТОЛПА ВОСХОЖДЕНИЯ 👑
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase' }}>Лучшие из лучших героев в истории Абаддона</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                      {top3.map((legend, idx) => {
                        const isStained = legend.legacyStatus === 'stained';
                        const border = isStained 
                          ? '3px solid #ff4d4d' 
                          : '3px solid #ffb813';
                        const glow = isStained 
                          ? '0 0 25px rgba(255, 77, 77, 0.4), inset 0 0 15px rgba(255, 77, 77, 0.1)' 
                          : '0 0 25px rgba(255, 184, 19, 0.4), inset 0 0 15px rgba(255, 184, 19, 0.1)';
                        const rankLabel = ["🥇 ПЕРВЫЙ СТОЛП", "🥈 ВТОРОЙ СТОЛП", "🥉 ТРЕТИЙ СТОЛП"][idx];
                        const titleColor = isStained ? '#ff4d4d' : '#ffb813';
                        
                        return (
                          <div 
                            key={idx}
                            style={{
                              background: '#0c0a0e',
                              border: border,
                              padding: '1.5rem 1rem',
                              boxShadow: glow,
                              textAlign: 'center',
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.8rem'
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', color: titleColor, fontWeight: 'bold', fontFamily: 'var(--font-rpg)', letterSpacing: '1px' }}>
                              {rankLabel}
                            </div>

                            <div style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              background: isStained ? '#1a0505' : '#1e1a0a',
                              border: `2px solid ${titleColor}`,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              fontSize: '2.2rem',
                              margin: '0.5rem auto',
                              boxShadow: `0 0 15px ${titleColor}33`
                            }}>
                              {getPillarIcon(legend)}
                            </div>

                            <div>
                              <h4 className="gothic-title" style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>
                                {legend.name}
                              </h4>
                              {legend.nickname && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', margin: '2px 0' }}>
                                  «{legend.nickname}»
                                </div>
                              )}
                              <span style={{ fontSize: '0.68rem', background: isStained ? 'rgba(255,77,77,0.1)' : 'rgba(212,175,55,0.1)', border: `1px solid ${titleColor}44`, color: titleColor, padding: '2px 8px', textTransform: 'uppercase', fontFamily: 'var(--font-rpg)', display: 'inline-block', marginTop: '4px' }}>
                                {getPillarTitle(legend)}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--color-bone-dim)', background: 'rgba(0,0,0,0.3)', padding: '6px', border: '1px solid var(--color-iron-light)' }}>
                              <div>📜 Задачи: <b>{legend.completedTasksCount || 0}</b></div>
                              <div>👹 Боссы: <b>{legend.completedSiegesCount || 0}</b></div>
                              <div>🪙 Золото: <b>{legend.totalGoldEarned || 0}</b></div>
                              <div>🔮 Ур: <b>{legend.level || 1}</b></div>
                            </div>

                            <div style={{ 
                              background: isStained ? 'radial-gradient(circle, #1c0e0e 0%, #0d0505 100%)' : 'radial-gradient(circle, #1a1613 0%, #0d0b09 100%)', 
                              border: `1px solid ${isStained ? '#5c1a1a' : '#4a3e31'}`, 
                              padding: '8px', 
                              color: isStained ? '#dfc5c5' : '#cbbba5', 
                              fontSize: '0.7rem', 
                              textAlign: 'justify',
                              maxHeight: '100px',
                              overflowY: 'auto'
                            }} className="rpg-scrollbar">
                              <b>Летопись деяний:</b>
                              <br />
                              {legend.pedestalEulogy}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {rest.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ borderBottom: '1px dashed var(--color-iron-light)', paddingBottom: '0.5rem', textAlign: 'left' }}>
                          <h4 className="gothic-title" style={{ fontSize: '1.2rem', color: 'var(--color-bone-dim)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            ⚓ ДРУГИЕ ДУХИ БЕЗДНЫ (ПАВШИЕ ИЛИ ВОЗНЕСШИЕСЯ)
                          </h4>
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-iron-light)' }}>Упорядочены по очкам славы и заслугам</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                          {rest.map((legend, idx) => {
                            const isStained = legend.legacyStatus === 'stained';
                            const cardBorder = isStained 
                              ? 'linear-gradient(to bottom, #cf142b, #8b0000, #220000) 1'
                              : 'linear-gradient(to bottom, #d4af37, #aa820a, #1a1505) 1';
                            const cardShadow = isStained
                              ? '0 5px 15px rgba(139,0,0,0.3), inset 0 0 10px rgba(139,0,0,0.05)'
                              : '0 5px 15px rgba(0,0,0,0.6), inset 0 0 10px rgba(212,175,55,0.02)';
                            const icon = isStained ? '☠️' : '☀️';
                            const label = isStained ? 'ЗАПЯТНАННОЕ ИМЯ' : `ЛЕГЕНДА #${idx + 4}`;
                            const titleColor = isStained ? '#ff4d4d' : '#ffb813';
                            const scrollBg = isStained
                              ? 'radial-gradient(circle, #1c0e0e 0%, #0d0505 100%)'
                              : 'radial-gradient(circle, #1a1613 0%, #0d0b09 100%)';
                            const scrollBorder = isStained ? '#5c1a1a' : '#4a3e31';
                            const scrollText = isStained ? '#dfc5c5' : '#cbbba5';
                            const scrollTitleColor = isStained ? '#ff4d4d' : '#ffb813';
                            const scrollTitle = isStained ? '📜 Печать Тлена / Летопись Падения:' : '📜 Летопись Искупления ИИ:';

                            return (
                              <div 
                                key={idx} 
                                style={{
                                  background: '#0a080c',
                                  border: '2px solid',
                                  borderImage: cardBorder,
                                  padding: '1.2rem',
                                  boxShadow: cardShadow,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.8rem'
                                }}
                              >
                                <div style={{ borderBottom: '1px solid ' + (isStained ? '#5c1a1a' : '#4a3e31'), paddingBottom: '0.6rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                                    <span style={{ fontSize: '0.7rem', color: titleColor, fontFamily: 'var(--font-rpg)', fontWeight: 'bold' }}>{label}</span>
                                  </div>
                                  <h3 className="gothic-title" style={{ fontSize: '1.15rem', color: titleColor, marginTop: '4px', margin: 0 }}>
                                    {legend.name}
                                  </h3>
                                  {legend.nickname && (
                                    <div style={{ fontSize: '0.68rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', marginTop: '1px' }}>
                                      «{legend.nickname}»
                                    </div>
                                  )}
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginTop: '4px' }}>
                                    {legend.race} • {legend.class} • <b>Уровень {legend.level}</b>
                                  </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--color-bone-dim)', background: 'rgba(0,0,0,0.3)', padding: '6px', border: '1px solid var(--color-iron-light)', textAlign: 'left' }}>
                                  <div>📜 Квесты: <b>{legend.completedTasksCount || 0} шт</b></div>
                                  <div>👹 Боссы: <b>{legend.completedSiegesCount || 0} шт</b></div>
                                  <div>🪙 Золото: <b>{legend.totalGoldEarned || 0}</b></div>
                                  <div>🔮 Ур: <b>{legend.level || 1}</b></div>
                                </div>

                                <div style={{ background: scrollBg, border: '1px solid ' + scrollBorder, padding: '0.8rem', color: scrollText, textAlign: 'left' }}>
                                  <h4 style={{ fontSize: '0.75rem', fontFamily: 'var(--font-rpg)', borderBottom: '1px solid ' + (isStained ? '#441414' : '#33281e'), paddingBottom: '3px', marginBottom: '6px', color: scrollTitleColor, textTransform: 'uppercase', margin: 0 }}>
                                    {scrollTitle}
                                  </h4>
                                  <div style={{ fontSize: '0.7rem', lineHeight: '1.35', overflowY: 'auto', maxHeight: '100px', textAlign: 'justify', whiteSpace: 'pre-line' }} className="rpg-scrollbar">
                                    {legend.pedestalEulogy}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ border: '1px dashed #4a3e31', padding: '3rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', maxWidth: '500px', margin: '0 auto' }}>
              <Skull size={32} style={{ color: 'var(--color-iron-light)', marginBottom: '0.8rem' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--color-bone-dim)', fontStyle: 'italic' }}>
                Зал Пьедесталов пуст и погружен во тьму. Ваши герои еще не взошли на постамент бессмертия.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-iron-light)', marginTop: '8px', lineHeight: '1.4' }}>
                ☀️ Запечатайте как минимум <b>15 контрактов</b> и одолейте <b>3 тяжелых Осады (Боссов)</b>, чтобы разблокировать Ритуал Искупления в боевом штабе Путешествия и вписать своего первого героя в вечные летописи Света!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}