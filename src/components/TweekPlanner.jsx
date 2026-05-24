import React, { useState } from 'react';
import { Skull, Pin, Trash2, Shield, Calendar, Sparkles, CheckSquare, Plus, ArrowRight, UserCheck, Flame, RefreshCw } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

export default function TweekPlanner({ tasks, setTasks, character, setCharacter, requestDeconstruction }) {
  const { playClick, playBoneCrack, playSuccess } = useAudio();
  const [activeKanbanDay, setActiveKanbanDay] = useState(null); // YYYY-MM-DD
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('hunt'); // hunt, siege, relic, corpse
  
  // Drag-and-drop state
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // --- TASK EDITING STATE ---
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('hunt');
  const [editTime, setEditTime] = useState(25);
  const [editIntent, setEditIntent] = useState('');
  const [editSteps, setEditSteps] = useState([]);
  const [newStepText, setNewStepText] = useState('');

  // AI Inside Editor States
  const [editDeconstructLoading, setEditDeconstructLoading] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0); // 0 = default, 1 = answering questions, 2 = done
  const [guidedQuestions, setGuidedQuestions] = useState([]);
  const [guidedAnswers, setGuidedAnswers] = useState({});

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditType(task.type);
    setEditTime(task.pomodoroTime);
    setEditIntent(task.intent || '');
    setEditSteps(task.steps || []);
    setGuidedStep(0);
    setGuidedAnswers({});
    setNewStepText('');
  };

  // --- EDIT MODAL AI DECONSTRUCTORS ---

  const handleEditInstantDeconstruct = async () => {
    if (!editTitle.trim()) return;
    playClick();
    setEditDeconstructLoading(true);
    try {
      const tempTask = { title: editTitle, type: editType };
      const response = await requestDeconstruction(tempTask, 'instant');
      const steps = response.steps.map((s, idx) => ({
        id: `step-${idx}-${Date.now()}`,
        title: s,
        completed: false
      }));
      setEditSteps(steps);
      setEditIntent(response.intent || '');
      playSuccess();
    } catch (e) {
      alert("Не удалось переразбить ИИ: " + e.message);
    } finally {
      setEditDeconstructLoading(false);
    }
  };

  const handleEditStartGuided = async () => {
    if (!editTitle.trim()) return;
    playClick();
    setEditDeconstructLoading(true);
    try {
      const tempTask = { title: editTitle };
      const response = await requestDeconstruction(tempTask, 'guided_questions');
      setGuidedQuestions(response.questions || [
        "Какая самая скучная деталь в этой задаче?",
        "С чего физически проще всего начать?",
        "Что именно вызывает у вас страх или ступор?"
      ]);
      setGuidedStep(1);
    } catch (e) {
      alert("Ошибка запуска ритуала: " + e.message);
    } finally {
      setEditDeconstructLoading(false);
    }
  };

  const handleEditAnswerSubmit = async () => {
    playClick();
    setEditDeconstructLoading(true);
    try {
      const tempTask = { title: editTitle };
      const response = await requestDeconstruction(tempTask, 'guided_steps', {
        questions: guidedQuestions,
        answers: guidedAnswers
      });
      const steps = response.steps.map((s, idx) => ({
        id: `step-${idx}-${Date.now()}`,
        title: s,
        completed: false
      }));
      setEditSteps(steps);
      setEditIntent(response.intent || '');
      setGuidedStep(2);
      playSuccess();
    } catch (e) {
      alert("Ошибка ритуала: " + e.message);
    } finally {
      setEditDeconstructLoading(false);
    }
  };

  const handleSaveEdits = () => {
    playSuccess();
    setTasks(prev => prev.map(t => t.id === editingTask.id ? {
      ...t,
      title: editTitle,
      type: editType,
      pomodoroTime: Number(editTime),
      intent: editIntent,
      steps: editSteps
    } : t));
    setEditingTask(null);
  };

  const handleAddStepManual = () => {
    if (!newStepText.trim()) return;
    playClick();
    setEditSteps([...editSteps, {
      id: `step-${Date.now()}`,
      title: newStepText,
      completed: false
    }]);
    setNewStepText('');
  };

  const handleDeleteStepManual = (id) => {
    playClick();
    setEditSteps(editSteps.filter(s => s.id !== id));
  };

  const handleToggleStepManual = (id) => {
    playClick();
    setEditSteps(editSteps.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  // Generate date strings for current week (Mon to Sun)
  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMon);

    const weekdaysRU = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      
      dates.push({
        name: weekdaysRU[i],
        dateStr: dateStr,
        dayNum: current.getDate(),
        monthStr: current.toLocaleString('ru-RU', { month: 'short' }),
        isToday: dateStr === today.toISOString().split('T')[0]
      });
    }
    return dates;
  };

  const weekDays = getWeekDates();

  // --- RITUAL STATE ACTIONS ---

  const handleCreateTask = (dateStr = null) => {
    if (!newTaskTitle.trim()) return;
    playClick();
    
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      type: newTaskType,
      status: 'active',
      date: dateStr, // Null for backlog
      pomodoroTime: newTaskType === 'siege' ? 50 : 25,
      pomodoroSpent: 0,
      toxicity: 'standard',
      barrierType: null,
      curseLevel: 0,
      steps: [],
      intent: ''
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    playSuccess();
  };

  const handleSealTask = (taskId) => {
    playSuccess();
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
    
    // Reward XP & Gold & update ADHD stats
    setCharacter(prev => {
      const target = tasks.find(t => t.id === taskId);
      const isSiege = target?.type === 'siege';
      const reward = isSiege ? 50 : target?.type === 'relic' ? 35 : 15;
      const nextXp = prev.xp + reward;
      const xpNeeded = prev.level * 100;
      
      let nextLevel = prev.level;
      let remXp = nextXp;
      let goldReward = 2; // base gold from planner
      let levelUpGold = 0;
      
      if (remXp >= xpNeeded) {
        nextLevel += 1;
        remXp -= xpNeeded;
        levelUpGold = 10;
      }
      
      const totalEarned = goldReward + levelUpGold;
      
      return {
        ...prev,
        level: nextLevel,
        xp: remXp,
        gold: (prev.gold || 0) + totalEarned,
        hp: nextLevel > prev.level ? prev.maxHp : prev.hp,
        
        // ADHD stats updates
        completedTasksCount: (prev.completedTasksCount || 0) + 1,
        completedSiegesCount: (prev.completedSiegesCount || 0) + (isSiege ? 1 : 0),
        totalGoldEarned: (prev.totalGoldEarned || 0) + totalEarned
      };
    });
  };

  const handlePostponeTask = (taskId, targetDateStr) => {
    playClick();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextCurse = Math.min(5, t.curseLevel + 1);
        return { 
          ...t, 
          date: targetDateStr,
          curseLevel: nextCurse
        };
      }
      return t;
    }));
  };

  const handleBuryTask = (taskId) => {
    playBoneCrack();
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'buried' } : t));
  };

  const handleResurrectTask = (taskId) => {
    playSuccess();
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'active', curseLevel: 0 } : t));
  };

  const handleCleanseCurse = (taskId) => {
    playSuccess();
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, curseLevel: 0 } : t));
    setCharacter(prev => ({ ...prev, mana: Math.max(0, prev.mana - 10) }));
  };

  // --- DRAG AND DROP HANDLERS ---

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetDateStr) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    playClick();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let curse = t.curseLevel;
        if (t.date && t.date !== targetDateStr && targetDateStr !== null) {
          curse = Math.min(5, curse + 1);
        }
        return { ...t, date: targetDateStr, curseLevel: curse };
      }
      return t;
    }));
    setDraggedTaskId(null);
  };

  const renderJourneyMap = () => {
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const miles = tasks.filter(t => t.status === 'completed').reduce((acc, t) => {
      if (t.type === 'siege') return acc + 15;
      if (t.type === 'relic') return acc + 10;
      return acc + 5;
    }, 0);

    let location = "🚐 Побег в Смертной Повозке";
    let locationDesc = "Вы разбили повозку смерти и выбираетесь из лесов империи Света.";
    if (miles >= 20 && miles < 50) {
      location = "💀 Равнины Ндравна (Империя Нежити)";
      locationDesc = "Вокруг расстилается туман, земля усеяна костями. Шепчут духи мертвых.";
    } else if (miles >= 50 && miles < 100) {
      location = "🏔 Перевалы Каргахаула ( Pale Lands )";
      locationDesc = "Бледные гиганты бродят среди обледенелых утесов. Воет зимний ветер.";
    } else if (miles >= 100 && miles < 180) {
      location = "🛡 Разрозненные Оплоты Человечества";
      locationDesc = "Разрушенные железные замки, сырые таверны, где беглецов сдают за горсть медяков.";
    } else if (miles >= 180) {
      location = "🔥 Пылающие Пустоши Хаоса";
      locationDesc = "Небо расколото фиолетовыми разрядами плазмы. Здесь правит первозданный огонь.";
    }

    const progressPercent = Math.min(100, (miles / 200) * 100);

    return (
      <div className="rpg-panel" style={{ background: '#09080a', borderColor: '#3a2d21', marginBottom: '0.2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Текущий Регион Пути</span>
            <h3 className="gothic-title" style={{ fontSize: '1.25rem', color: 'var(--color-relic-glow)', marginTop: '2px' }}>{location}</h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)' }}>Пройдено: <b>{miles} миль</b></span>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-mana-glow)' }}>Успешно запечатано: {completedCount} квестов</div>
          </div>
        </div>

        {/* Elegant map route line */}
        <div style={{ position: 'relative', height: '10px', background: '#000', border: '1px solid var(--color-iron-light)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(to right, var(--color-blood), var(--color-relic-glow))', transition: 'width 0.8s ease' }} />
        </div>

        {/* Location tags below progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-bone-dim)', marginTop: '6px', fontFamily: 'var(--font-rpg)' }}>
          <span>Повозка (0м)</span>
          <span style={{ color: miles >= 20 ? '#fff' : '' }}>Ндравна (20м)</span>
          <span style={{ color: miles >= 50 ? '#fff' : '' }}>Каргахаул (50м)</span>
          <span style={{ color: miles >= 100 ? '#fff' : '' }}>Империи (100м)</span>
          <span style={{ color: miles >= 180 ? '#fff' : '' }}>Хаос (180м+)</span>
        </div>

        <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--color-bone-dim)', marginTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', lineHeight: '1.4' }}>
          🧭 {locationDesc}
        </p>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '80vh' }}>
      
      {/* 1. Add Task Bar at Root */}
      <div className="rpg-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <input 
            type="text" 
            className="rpg-input" 
            style={{ width: '100%', fontSize: '1rem' }} 
            placeholder="Вбейте контракт (задачу)..." 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTask(new Date().toISOString().split('T')[0])}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            className="rpg-input" 
            style={{ fontSize: '0.9rem' }}
            value={newTaskType}
            onChange={(e) => setNewTaskType(e.target.value)}
          >
            <option value="hunt">🏹 Простая Охота</option>
            <option value="siege">💥 Тяжелая Осада (Босс)</option>
            <option value="relic">💎 Редкая Реликвия</option>
            <option value="corpse">💀 Труп прошлого</option>
          </select>

          <button 
            className="rpg-btn rpg-btn-mana"
            onClick={() => handleCreateTask(new Date().toISOString().split('T')[0])}
            disabled={!newTaskTitle.trim()}
          >
            <Plus size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            ПРИБИТЬ К ДОГОВОРУ ДНЯ
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
        💡 <i>Дважды кликните по любой задаче, чтобы изменить её поля, намерение или переразбить ИИ.</i>
      </div>

      {/* Exile's Journey Map Roadmap */}
      {renderJourneyMap()}

      {/* 2. Tweek Horizontal Scrollboard */}
      <div className="tweek-scrollboard">
        {weekDays.map(day => {
          const dayTasks = tasks.filter(t => t.date === day.dateStr && t.status !== 'buried');

          return (
            <div 
              key={day.dateStr} 
              className={`tweek-day-col ${day.isToday ? 'today' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.dateStr)}
            >
              <div 
                className="tweek-day-header"
                onClick={() => { playClick(); setActiveKanbanDay(day.dateStr); }}
                style={{ cursor: 'pointer' }}
              >
                <div className="tweek-day-title">
                  <span style={{ color: day.isToday ? '#fff' : 'var(--color-bone)' }}>
                    {day.name}
                  </span>
                  <span className="tweek-day-date">
                    {day.dayNum} {day.monthStr}
                  </span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-mana-glow)', textTransform: 'uppercase', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Calendar size={10} /> Кликни для Канбана
                </div>
              </div>

              {/* Day Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
                {dayTasks.map(task => (
                  <div 
                    key={task.id}
                    className={`task-card ${task.type} ${task.status === 'completed' ? 'completed' : ''} ${task.curseLevel > 2 ? 'cursed' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDoubleClick={() => handleOpenEdit(task)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{task.title}</span>
                      {task.curseLevel > 0 && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-curse-glow)' }}>
                          ☠ {task.curseLevel}
                        </span>
                      )}
                    </div>
                    
                    {/* Small action bars */}
                    <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                      {task.status !== 'completed' && (
                        <>
                          <button 
                            className="rpg-btn" 
                            style={{ fontSize: '0.65rem', padding: '2px 5px' }}
                            onClick={() => handleSealTask(task.id)}
                          >
                            Запечатать
                          </button>
                          <button 
                            className="rpg-btn rpg-btn-blood" 
                            style={{ fontSize: '0.65rem', padding: '2px 5px' }}
                            onClick={() => handleBuryTask(task.id)}
                          >
                            Похоронить
                          </button>
                        </>
                      )}
                      {task.status === 'completed' && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-bone-dim)' }}>✓ Запечатан</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Row: Backlog Skull Contract & Cemetery list */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: 'auto' }}>
        
        {/* Parchment Backlog Pact */}
        <div 
          className="parchment-contract"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
        >
          <div className="dagger-pin" />
          <h3 className="gothic-title" style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#c5b59f' }}>
            ⚔ Договор с Черепом (Бэклог)
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
            {tasks.filter(t => t.date === null && t.status !== 'buried').map(task => (
              <div
                key={task.id}
                className={`task-card ${task.type} ${task.curseLevel > 2 ? 'cursed' : ''}`}
                style={{ flex: '0 0 200px', margin: 0 }}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDoubleClick={() => handleOpenEdit(task)}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{task.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-bone-dim)' }}>
                    {task.type === 'siege' ? 'Осада' : 'Охота'}
                  </span>
                  <button 
                    className="rpg-btn" 
                    style={{ fontSize: '0.6rem', padding: '1px 4px' }}
                    onClick={() => handleSealTask(task.id)}
                  >
                    Да
                  </button>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.date === null && t.status !== 'buried').length === 0 && (
              <div style={{ fontSize: '0.85rem', color: '#8c7d6b', fontStyle: 'italic', padding: '1rem' }}>
                Пакт чист. Утащите сюда любые задачи для отложенного созревания...
              </div>
            )}
          </div>
        </div>

        {/* Cemetery/Buried Tasks (ADHD Guilt-free Archive) */}
        <div className="rpg-panel" style={{ background: '#0a090b', borderColor: '#332c38' }}>
          <h3 className="gothic-title" style={{ fontSize: '1rem', color: 'var(--color-bone-dim)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Skull size={14} /> Кладбище Долгов
          </h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-bone-dim)', marginBottom: '0.8rem', lineHeight: '1.3' }}>
            Забытые или неактуальные задачи, от которых вы сознательно отказались, чтобы разгрузить совесть.
          </p>

          <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {tasks.filter(t => t.status === 'buried').map(task => (
              <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: '#121014', padding: '5px', borderLeft: '2px solid var(--color-iron-light)' }}>
                <span style={{ textDecoration: 'line-through', opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                  {task.title}
                </span>
                <button 
                  className="rpg-btn" 
                  style={{ fontSize: '0.6rem', padding: '1px 5px' }}
                  onClick={() => handleResurrectTask(task.id)}
                >
                  Воскресить
                </button>
              </div>
            ))}
            {tasks.filter(t => t.status === 'buried').length === 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-iron-light)', fontStyle: 'italic', textAlign: 'center', paddingTop: '10px' }}>
                Здесь пусто и тихо.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NESTED KANBAN DAY BOARD MODAL */}
      {activeKanbanDay && (
        <div className="gothic-modal-overlay">
          <div className="gothic-modal-content" style={{ maxWidth: '900px', width: '95%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-iron-light)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
              <div>
                <h3 className="gothic-title" style={{ fontSize: '1.3rem', color: '#fff' }}>
                  🛡 Военный Совет: {activeKanbanDay}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>
                  Управляйте активной фазой сражений за этот конкретный день.
                </span>
              </div>
              <button 
                className="rpg-btn"
                style={{ padding: '4px 10px' }}
                onClick={() => { playClick(); setActiveKanbanDay(null); }}
              >
                ЗАКРЫТЬ
              </button>
            </div>

            {/* Kanban Grid */}
            <div className="kanban-grid">
              {/* 1. TO DO / CONTRACT BACKLOG */}
              <div 
                className="kanban-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, activeKanbanDay)}
              >
                <h4 className="kanban-col-title">📜 Контракты (To Do)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tasks.filter(t => t.date === activeKanbanDay && t.status === 'active' && (!t.steps || !t.steps.some(s => s.completed))).map(task => (
                    <div 
                      key={task.id} 
                      className={`task-card ${task.type}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDoubleClick={() => { playClick(); handleOpenEdit(task); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{task.title}</div>
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '5px', justifyContent: 'flex-end' }}>
                        <button className="rpg-btn" style={{ fontSize: '0.6rem', padding: '2px' }} onClick={() => handleSealTask(task.id)}>Да</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. IN PROGRESS / IN ACTIVE COMBAT */}
              <div className="kanban-col">
                <h4 className="kanban-col-title">⚔ В разгаре боя (In Progress)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tasks.filter(t => t.date === activeKanbanDay && t.status === 'active' && t.steps && t.steps.some(s => s.completed)).map(task => (
                    <div 
                      key={task.id} 
                      className={`task-card ${task.type}`} 
                      style={{ borderLeftColor: 'var(--color-mana)', cursor: 'pointer' }}
                      onDoubleClick={() => { playClick(); handleOpenEdit(task); }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{task.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-bone-dim)', marginTop: '2px' }}>
                        Шагов сделано: {task.steps.filter(s => s.completed).length}/{task.steps.length}
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '5px', justifyContent: 'flex-end' }}>
                        <button className="rpg-btn" style={{ fontSize: '0.6rem', padding: '2px' }} onClick={() => handleSealTask(task.id)}>Завершить</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. DONE / SEALED PACT */}
              <div className="kanban-col">
                <h4 className="kanban-col-title">💎 Победа / Запечатано (Done)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tasks.filter(t => t.date === activeKanbanDay && t.status === 'completed').map(task => (
                    <div 
                      key={task.id} 
                      className="task-card completed"
                      onDoubleClick={() => { playClick(); handleOpenEdit(task); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: '0.85rem' }}>{task.title}</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-bone-dim)' }}>✓ Ритуал проведен</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick add within Kanban day */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--color-iron-light)', paddingTop: '1rem' }}>
              <input 
                type="text" 
                className="rpg-input" 
                style={{ flex: 1, fontSize: '0.85rem' }} 
                placeholder="Быстрый контракт на этот день..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask(activeKanbanDay)}
              />
              <button 
                className="rpg-btn rpg-btn-mana" 
                onClick={() => handleCreateTask(activeKanbanDay)}
                disabled={!newTaskTitle.trim()}
              >
                ПРИЗВАТЬ
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TASK EDITING PARCHMENT MODAL */}
      {editingTask && (
        <div className="gothic-modal-overlay">
          <div className="gothic-modal-content" style={{ maxWidth: '680px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-iron-light)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
              <h3 className="gothic-title" style={{ fontSize: '1.2rem', color: 'var(--color-relic-glow)' }}>
                ⚔ Свиток Контракта: {editingTask.title.slice(0, 30)}...
              </h3>
              <button 
                className="rpg-btn" 
                style={{ padding: '3px 8px' }} 
                onClick={() => setEditingTask(null)}
              >
                Отмена
              </button>
            </div>

            {editDeconstructLoading && guidedStep === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <RefreshCw className="heartbeat-pulse fast" style={{ color: 'var(--color-mana-glow)', marginBottom: '1rem' }} size={32} />
                <p style={{ fontFamily: 'var(--font-rpg)' }}>Взывание к Бездне... ИИ перестраивает шаги под новый контекст...</p>
              </div>
            )}

            {guidedStep === 1 && (
              <div>
                <h4 className="rpg-title" style={{ color: 'var(--color-mana-glow)', marginBottom: '0.5rem' }}>Ритуал уточняющих вопросов:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {guidedQuestions.map((q, idx) => (
                    <div key={idx}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>
                        Вопрос {idx + 1}: {q}
                      </label>
                      <input 
                        type="text" 
                        className="rpg-input" 
                        style={{ width: '100%', fontSize: '0.9rem' }}
                        placeholder="Ответьте честно..."
                        value={guidedAnswers[idx] || ''}
                        onChange={(e) => setGuidedAnswers({ ...guidedAnswers, [idx]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="rpg-btn" onClick={() => setGuidedStep(0)}>Назад</button>
                  <button 
                    className="rpg-btn rpg-btn-mana" 
                    onClick={handleEditAnswerSubmit}
                    disabled={Object.keys(guidedAnswers).length < guidedQuestions.length}
                  >
                    Завершить разбор
                  </button>
                </div>
              </div>
            )}

            {guidedStep !== 1 && !editDeconstructLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {/* 1. Core Task Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>НАЗВАНИЕ КОНТРАКТА</label>
                    <input 
                      type="text" 
                      className="rpg-input" 
                      style={{ width: '100%', fontSize: '0.95rem' }} 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>ТИП СУЩНОСТИ</label>
                    <select 
                      className="rpg-input" 
                      style={{ width: '100%', fontSize: '0.9rem' }}
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                    >
                      <option value="hunt">🏹 Охота</option>
                      <option value="siege">💥 Осада</option>
                      <option value="relic">💎 Реликвия</option>
                      <option value="corpse">💀 Труп прошлого</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>ВРЕМЯ (МИН)</label>
                    <input 
                      type="number" 
                      className="rpg-input" 
                      style={{ width: '100%', fontSize: '0.9rem' }} 
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* 2. Intent Field ("Зачем мне это сегодня") */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>
                    СМЫСЛОВОЙ ЯКОРЬ (НАМЕРЕНИЕ ДЛЯ ADHD - ЗАЧЕМ МНЕ ЭТО СЕГОДНЯ?)
                  </label>
                  <textarea 
                    className="rpg-input" 
                    style={{ width: '100%', minHeight: '55px', fontSize: '0.85rem', resize: 'vertical' }}
                    placeholder="Например: Чтобы сдать проект и получить деньги на долгожданный стул, сняв тревогу..."
                    value={editIntent}
                    onChange={(e) => setEditIntent(e.target.value)}
                  />
                </div>

                {/* 3. DeepSeek AI Deconstructor Panel */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', border: '1px solid var(--color-iron-light)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--color-mana-glow)', marginBottom: '5px', fontFamily: 'var(--font-rpg)' }}>
                    🔮 Авто-настройка шагов ИИ (Контекст Безды)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '10px' }}>
                    ИИ автоматически перестроит структуру шагов, используя отредактированное название и намерение выше как истинный контекст.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="rpg-btn" 
                      style={{ flex: 1, fontSize: '0.75rem' }} 
                      onClick={handleEditInstantDeconstruct}
                    >
                      🚀 БЫСТРО И ГРУБО
                    </button>
                    <button 
                      className="rpg-btn rpg-btn-mana" 
                      style={{ flex: 1, fontSize: '0.75rem' }} 
                      onClick={handleEditStartGuided}
                    >
                      🔮 С СОПРОВОЖДЕНИЕМ (ВОПРОСЫ)
                    </button>
                  </div>
                </div>

                {/* 4. Manual steps manipulation (Manual Overrides) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-bone)', marginBottom: '6px', fontFamily: 'var(--font-rpg)' }}>
                    СПИСОК ШАГОВ (РУЧНЫЕ КОРРЕКТИРОВКИ):
                  </label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '0.8rem' }}>
                    {editSteps.map(s => (
                      <div 
                        key={s.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          background: 'rgba(0,0,0,0.2)', 
                          padding: '6px 10px', 
                          border: '1px solid var(--color-iron-light)' 
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={s.completed} 
                          onChange={() => handleToggleStepManual(s.id)}
                        />
                        <span style={{ 
                          fontSize: '0.85rem', 
                          color: s.completed ? 'var(--color-bone-dim)' : '#fff',
                          textDecoration: s.completed ? 'line-through' : 'none',
                          flex: 1
                        }}>
                          {s.title}
                        </span>
                        <button 
                          className="rpg-btn" 
                          style={{ padding: '2px 6px', color: 'var(--color-blood-glow)' }} 
                          onClick={() => handleDeleteStepManual(s.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {editSteps.length === 0 && (
                      <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--color-iron-light)', padding: '5px' }}>
                        Нет шагов в контракте. Сделайте ручной шаг или призовите ИИ.
                      </div>
                    )}
                  </div>

                  {/* Manual Step Adding Field */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="rpg-input" 
                      style={{ flex: 1, fontSize: '0.85rem' }} 
                      placeholder="Добавить свой ручной шаг..."
                      value={newStepText}
                      onChange={(e) => setNewStepText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStepManual()}
                    />
                    <button className="rpg-btn" onClick={handleAddStepManual} disabled={!newStepText.trim()}>
                      Добавить
                    </button>
                  </div>
                </div>

                {/* Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--color-iron-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <button className="rpg-btn" onClick={() => setEditingTask(null)}>
                    ОТМЕНИТЬ
                  </button>
                  <button className="rpg-btn rpg-btn-blood" onClick={handleSaveEdits}>
                    СОХРАНИТЬ КОНТРАКТ В БАЗУ
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
