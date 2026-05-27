import React, { useState, useEffect, useRef } from 'react';
import { Skull, Pin, Trash2, Shield, Calendar, Sparkles, CheckSquare, Plus, ArrowRight, UserCheck, Flame, RefreshCw } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

const generateLocalSteps = (title, type) => {
  const t = title.toLowerCase();

  if (t.includes('код') || t.includes('программ') || t.includes('питон') || t.includes('тест') || t.includes('написать') || t.includes('разработ') || t.includes('фикс') || t.includes('баг') || t.includes('dev') || t.includes('react') || t.includes('js') || t.includes('css')) {
    return [
      "Найти безопасное место в укрытии (Включить компьютер, открыть IDE)",
      "Снять ржавые кандалы апатии (Закрыть все развлекательные вкладки и чаты)",
      "Заварить эликсир концентрации (Налить стакан свежей воды или чая)",
      "Совершить пробный выпад клинком (Написать одну строчку кода, функцию или комментарий)",
      "Проверить натяжение тетивы (Запустить сборку проекта, тесты или проверить в браузере)",
      "Осадить врага до конца (Сосредоточенно работать в течение 10-15 минут)"
    ];
  }

  if (t.includes('изучить') || t.includes('прочитать') || t.includes('почитать') || t.includes('курс') || t.includes('книг') || t.includes('лекци') || t.includes('учить') || t.includes('разобрать') || t.includes('исследов') || t.includes('анализ')) {
    return [
      "Протереть линзы очков мудрости (Открыть нужный учебный материал, статью или книгу)",
      "Запечатать посторонние шепоты (Поставить телефон на беззвучный режим)",
      "Прочесть первую руну древнего свитка (Внимательно прочесть ровно один абзац или 1 слайд)",
      "Записать ценное откровение в летопись (Выписать одну ключевую мысль или термин в блокнот)",
      "Укрепить ментальный барьер (Прочитать еще 2-3 страницы без самокритики)",
      "Осознать полученное знание (Сделать краткую паузу и осмыслить прочитанное)"
    ];
  }

  if (t.includes('помыть') || t.includes('убрать') || t.includes('стир') || t.includes('уборка') || t.includes('комнат') || t.includes('вещи') || t.includes('посуд') || t.includes('пыль') || t.includes('чистк')) {
    return [
      "Надеть латные рукавицы выживания (Встать со стула и дойти до места уборки)",
      "Собрать осколки Скверны Бездны (Выбросить в мусорку ровно 3 ненужные вещи/бумажки)",
      "Призвать силу Водного Источника (Включить воду, взять тряпку или губку)",
      "Очистить первый рубеж обороны (Помыть или убрать одну конкретную тарелку, вещь или полку)",
      "Объявить о победе в лагере (Поставить очищенный предмет на его законное место)",
      "Оглядеть очищенные земли (Оценить результат и похвалить себя за сделанный шаг)"
    ];
  }

  // Generic fallback steps
  return [
    "Снять кандалы ступора (Сделать глубокий вдох и выдох по схеме 4-4-4-4)",
    "Разведать территорию боя (Открыть материалы задачи, файл или блокнот перед собой)",
    "Совершить микро-удар кинжалом (Сделать любое простейшее действие по задаче за 2 минуты)",
    "Прорвать когнитивную блокаду (Сделать второе простое микро-действие)",
    "Занять доминирующую позицию (Продолжить работу в спокойном ритме в течение 5 минут)",
    "Оценить первый рубеж (Свериться с планом и продолжить путь)"
  ];
};

export default function TweekPlanner({ tasks, setTasks, character, setCharacter, requestDeconstruction, communeWithSpirits, triggerRuneOfReturn, parseMessyTasks }) {
  const { playClick, playBoneCrack, playSuccess } = useAudio();
  const [activeKanbanDay, setActiveKanbanDay] = useState(null); // YYYY-MM-DD
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Drag-and-drop state
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Sound, Date & Long Journey task bar states
  const [taskDateOption, setTaskDateOption] = useState(new Date().toISOString().split('T')[0]);
  const [customDateValue, setCustomDateValue] = useState('');
  const [isLongJourney, setIsLongJourney] = useState(false);

  // Chaos Dump State
  const [chaosDumpOpen, setChaosDumpOpen] = useState(false);
  const [chaosText, setChaosText] = useState('');
  const [chaosLoading, setChaosLoading] = useState(false);

  // --- TASK EDITING STATE ---
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('hunt');
  const [editTime, setEditTime] = useState(25);
  const [editIntent, setEditIntent] = useState('');
  const [editSteps, setEditSteps] = useState([]);
  const [newStepText, setNewStepText] = useState('');
  const [editNature, setEditNature] = useState('external');
  // Adaptation Modal States
  const [adaptationModalOpen, setAdaptationModalOpen] = useState(false);
  const [adaptationTask, setAdaptationTask] = useState(null);
  const [adaptationDeadline, setAdaptationDeadline] = useState('');
  const [adaptationCallback, setAdaptationCallback] = useState(null);

  const newTaskTitleRef = useRef(null);
  const kanbanNewTaskTitleRef = useRef(null);
  const editTitleRef = useRef(null);

  // Auto-resize task input textareas vertically to fit content instead of sliding right
  useEffect(() => {
    const el = newTaskTitleRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.value === '' ? '40px' : `${el.scrollHeight}px`;
    }
  }, [newTaskTitle]);

  useEffect(() => {
    const el = kanbanNewTaskTitleRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.value === '' ? '35px' : `${el.scrollHeight}px`;
    }
  }, [newTaskTitle]);

  useEffect(() => {
    const el = editTitleRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.value === '' ? '40px' : `${el.scrollHeight}px`;
    }
  }, [editTitle]);

  const getTaskDateOptions = () => {
    const options = [];
    const today = new Date();
    const weekdaysShortRU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const formattedDate = `${dayNum}-${monthNum}`;
      let label = '';
      if (i === 0) label = `Сегодня (${formattedDate})`;
      else if (i === 1) label = `Завтра (${formattedDate})`;
      else {
        const dayName = weekdaysShortRU[d.getDay()];
        label = `${dayName} (${formattedDate})`;
      }
      options.push({ value: dateStr, label });
    }
    options.push({ value: 'backlog', label: 'В бэклог' });
    options.push({ value: 'custom', label: 'Вписать свою дату...' });
    return options;
  };

  // --- DRAG-TO-SCROLL (MOUSE DRAG) FOR WEEKLY COLUMNS ---
  const scrollRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e) => {
    // Avoid triggering drag-scroll when clicking task cards, buttons, or inputs
    if (e.target.closest('.task-card') || e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) {
      return;
    }
    isDown.current = true;
    scrollRef.current?.classList.add('active');
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    scrollRef.current?.classList.remove('active');
  };

  const handleMouseUp = () => {
    isDown.current = false;
    scrollRef.current?.classList.remove('active');
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Scroll multiplier
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  const handleChaosDumpParse = async () => {
    if (!chaosText.trim() || !parseMessyTasks) return;
    playClick();
    setChaosLoading(true);
    try {
      const result = await parseMessyTasks(chaosText);
      if (result && Array.isArray(result)) {
        const todayDateStr = new Date().toISOString().split('T')[0];
        const newTasks = result.map((t, idx) => {
          const initialType = t.type || classifyLocally(t.title);
          return {
            id: `task-${Date.now()}-${idx}`,
            title: t.title,
            type: initialType,
            status: 'active',
            date: t.deadline ? todayDateStr : null, // if they have a deadline, add to today, else backlog
            pomodoroTime: t.estimatedTime || (initialType === 'siege' ? 50 : 25),
            pomodoroSpent: 0,
            toxicity: t.toxicity || 'standard',
            barrierType: null,
            curseLevel: 0,
            isLongJourney: t.isLongJourney || false,
            createdAt: Date.now(),
            // Fallback to local steps if AI didn't provide steps
            steps: t.steps ? t.steps.map((s, sIdx) => ({ id: `step-${sIdx}-${Date.now()}`, title: s, completed: false })) : generateLocalSteps(t.title, initialType).map((s, sIdx) => ({ id: `step-${sIdx}-${Date.now()}`, title: s, completed: false })),
            intent: t.intent || '',
            deadline: t.deadline || '',
            combatLore: {
              enemyName: t.enemyName || "Безымянный Ужас Бездны",
              visualType: t.visualType || initialType,
              weakPoints: t.weakPoints || ["Монстр боится разбития.", "Сделайте шаг за 5 минут!"],
              randomEvent: t.randomEvent || "Бой протекает при поддержке Бездны."
            }
          };
        });
        setTasks(prev => [...prev, ...newTasks]);
        setChaosText('');
        setChaosDumpOpen(false);
        playBoneCrack();
        playSuccess();
        alert(`🔮 Бездна успешно извлекла ${newTasks.length} квестов и занесла их в ваш Задачник!`);
      }
    } catch (e) {
      alert("Не удалось разобрать хаос Бездной: " + e.message);
    } finally {
      setChaosLoading(false);
    }
  };

  // --- AUTOMATIC TASK TYPE CLASSIFICATION BY AI/LOCAL HEURISTICS ---
  const classifyLocally = (title) => {
    const t = title.toLowerCase();
    // Siege: huge, scary, complex
    if (t.includes('переписать') || t.includes('диплом') || t.includes('проект') || t.includes('экзамен') || t.includes('презентация') || t.includes('сложный') || t.includes('отчет') || t.includes('база данных') || t.includes('рефакторинг') || t.includes('оптимизи') || t.includes('написать')) {
      return 'siege';
    }
    // Relic: creative, valuable, research, learning
    if (t.includes('изучить') || t.includes('прочитать') || t.includes('почитать') || t.includes('курс') || t.includes('книг') || t.includes('исследов') || t.includes('найти') || t.includes('дизайн') || t.includes('нарисовать') || t.includes('творче')) {
      return 'relic';
    }
    // Corpse: debts, old stuff
    if (t.includes('долг') || t.includes('хвост') || t.includes('старое') || t.includes('прошл') || t.includes('архив') || t.includes('разобрать')) {
      return 'corpse';
    }
    // Hunt: default
    return 'hunt';
  };

  const classifyTaskWithAI = async (title) => {
    const systemPrompt = `Ты — Бездна во вселенной Абаддона. Твоя задача — определить тип задачи в формате JSON для ролевого планировщика:
1. "siege" — если задача сложная, крупная, пугающая, требует много времени или усилий (например, подготовиться к экзамену, написать сложный код, сдать отчет).
2. "relic" — если задача связана с поиском ценной информации, обучением, исследованием, творчеством или чем-то редким/полезным (например, прочитать главу, изучить новую библиотеку, нарисовать эскиз).
3. "hunt" — простая, рутинная, понятная задача на каждый день (например, помыть посуду, сходить в магазин, сделать звонок, отправить письмо).
4. "corpse" — если задача явно связана с разбором старых долгов или хвостов.

Выведи ответ строго в формате JSON:
{"type": "hunt" | "siege" | "relic" | "corpse"}`;

    try {
      const response = await fetch('http://localhost:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Определи тип для задачи: "${title}"` }
          ]
        })
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      let text = data.choices[0].message.content.trim();
      if (text.startsWith("```json")) text = text.slice(7);
      if (text.endsWith("```")) text = text.slice(0, -3);
      const parsed = JSON.parse(text.trim());
      if (['hunt', 'siege', 'relic', 'corpse'].includes(parsed.type)) {
        return parsed.type;
      }
    } catch (e) {
      console.warn("AI classification failed, falling back to local heuristic");
    }
    return classifyLocally(title);
  };



  // AI Inside Editor States
  const [editDeconstructLoading, setEditDeconstructLoading] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0); // 0 = default, 1 = answering questions, 2 = done
  const [guidedQuestions, setGuidedQuestions] = useState([]);
  const [activeMapSection, setActiveMapSection] = useState('wasteland');

  const renderAdaptationModal = () => {
    if (!adaptationModalOpen || !adaptationTask) return null;

    return (
      <div className="gothic-modal-overlay" style={{ zIndex: 100000 }}>
        <div className="gothic-modal-content" style={{ 
          maxWidth: '550px', 
          border: '2px solid var(--color-blood-glow)', 
          boxShadow: '0 0 35px rgba(139, 26, 26, 0.75)',
          animation: 'pulse-red 3s infinite',
          background: 'radial-gradient(circle, #1a0f12 0%, #060203 100%)'
        }}>
          <h3 className="gothic-title" style={{ color: 'var(--color-blood-glow)', fontSize: '1.4rem', marginBottom: '1rem', textAlign: 'center', letterSpacing: '2px' }}>
            🔮 ПРОТИВОСТОЯНИЕ БЕЗДНЫ
          </h3>
          
          <div style={{ color: 'var(--color-bone)', fontSize: '0.95rem', marginBottom: '1.2rem', lineHeight: '1.5', fontFamily: 'Georgia, serif' }}>
            <p style={{ marginBottom: '8px' }}>
              Вы ставите длительный контракт или призываете его поздним вечером (после 20:00).
            </p>
            <p style={{ color: '#ffb813', fontStyle: 'italic', borderLeft: '2px solid #ffb813', paddingLeft: '8px', fontSize: '0.85rem' }}>
              «Бездна рекомендует детально спланировать дедлайн или разделить его силы, дабы избежать штрафного урона разуму!»
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-bone-dim)', marginBottom: '6px', fontFamily: 'var(--font-rpg)' }}>
              🚨 КОНЕЦ ДЕДЛАЙНА (необязательно, но крайне рекомендуется):
            </label>
            <input 
              type="text"
              className="rpg-input"
              style={{ width: '100%', fontSize: '0.95rem', background: '#000', color: '#fff', border: '1px solid var(--color-iron-light)' }}
              placeholder="Например: до 18:00 / среды / через 2 дня"
              value={adaptationDeadline}
              onChange={(e) => setAdaptationDeadline(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button 
              className="rpg-btn rpg-btn-mana"
              style={{ fontSize: '0.9rem', padding: '10px 15px', fontWeight: 'bold' }}
              onClick={() => {
                if (adaptationCallback) {
                  adaptationCallback('split', adaptationDeadline);
                }
                setAdaptationModalOpen(false);
              }}
            >
              🛡️ Разбить на 2 части (Рекомендуется)
            </button>

            <button 
              className="rpg-btn"
              style={{ fontSize: '0.9rem', padding: '10px 15px', borderColor: 'var(--color-relic-glow)', color: '#ffb813' }}
              onClick={() => {
                if (adaptationCallback) {
                  adaptationCallback('postpone', adaptationDeadline || 'через 2 дня');
                }
                setAdaptationModalOpen(false);
              }}
            >
              ⏳ На 2 дня и более
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                className="rpg-btn rpg-btn-blood"
                style={{ flex: 1, fontSize: '0.85rem', padding: '8px' }}
                onClick={() => {
                  if (adaptationCallback) {
                    adaptationCallback('continue', adaptationDeadline);
                  }
                  setAdaptationModalOpen(false);
                }}
              >
                ✓ Продолжить
              </button>
              <button 
                className="rpg-btn"
                style={{ flex: 1, fontSize: '0.85rem', padding: '8px' }}
                onClick={() => {
                  playClick();
                  setAdaptationModalOpen(false);
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTaskTitle = (task, fontSize = '0.9rem') => {
    return (
      <span style={{ fontSize, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
        {task.title}
        {task.runeOfReturn && (
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--color-relic-glow)',
            background: 'rgba(255, 184, 19, 0.1)',
            padding: '1px 4px',
            borderRadius: '3px',
            border: '1px solid rgba(255, 184, 19, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            fontWeight: 'normal',
            cursor: 'help'
          }} title="Записана Руна возврата когнитивного следа">
            📜 Руна
          </span>
        )}
      </span>
    );
  };

  // --- SOUL CONJUNCTION RITUAL STATE ---
  const [ritualMessage, setRitualMessage] = useState('');
  const [taskToPullId, setTaskToPullId] = useState('');
  const [taskToPushId, setTaskToPushId] = useState('');
  const [pushDestination, setPushDestination] = useState('backlog'); // backlog, tomorrow

  const handlePostponeAllToday = () => {
    const todayDateStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

    const todayActiveTasks = tasks.filter(t => t.date === todayDateStr && t.status === 'active');
    if (todayActiveTasks.length === 0) {
      alert("Сегодня нет активных задач для переноса!");
      return;
    }

    if (character.hp <= 5) {
      alert("Ваш разум слишком слаб для этой жертвы! Восстановите HP (выпейте зелье или отдохните у костра).");
      return;
    }

    const performPostpone = (runeData) => {
      playBoneCrack();

      const updatedTasks = tasks.map(t => {
        if (t.date === todayDateStr && t.status === 'active') {
          return {
            ...t,
            date: tomorrowDateStr,
            curseLevel: Math.min(5, t.curseLevel + 1),
            runeOfReturn: runeData
          };
        }
        return t;
      });
      setTasks(updatedTasks);

      // Deduct HP
      setCharacter(prev => ({
        ...prev,
        hp: Math.max(1, prev.hp - 5),
        totalHpSacrificed: (prev.totalHpSacrificed || 0) + 5
      }));

      setRitualMessage(`💀 Сделка совершена! ${todayActiveTasks.length} задач перенесены на завтра. Потеряно 5 HP рассудка. Скверна перенесенных задач возросла!`);
      setTimeout(() => setRitualMessage(''), 7000);

      // Automatically trigger AI Spirits Counsel
      if (communeWithSpirits) {
        setTimeout(() => communeWithSpirits(updatedTasks), 150);
      }
    };

    if (triggerRuneOfReturn) {
      triggerRuneOfReturn(todayActiveTasks, performPostpone);
    } else {
      performPostpone(null);
    }
  };

  const handlePullTaskToToday = (taskId) => {
    if (!taskId) return;
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    if (character.mana < 5) {
      alert("Недостаточно маны для этого сопряжения разума! Требуется 5 MP.");
      return;
    }

    playSuccess();

    const todayDateStr = new Date().toISOString().split('T')[0];
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          date: todayDateStr
        };
      }
      return t;
    }));

    setCharacter(prev => ({
      ...prev,
      mana: Math.max(0, prev.mana - 5),
      totalManaSpent: (prev.totalManaSpent || 0) + 5
    }));

    setRitualMessage(`🔮 Контракт «${targetTask.title}» притянут на сегодня! Потрачено 5 MP маны.`);
    setTimeout(() => setRitualMessage(''), 5000);
    setTaskToPullId('');
  };

  const handlePushTask = (taskId, destination) => {
    if (!taskId || !destination) return;
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    if (character.hp <= 2) {
      alert("Ваш разум слишком слаб для этой жертвы! Требуется 2 HP.");
      return;
    }

    const performPush = (runeData) => {
      playBoneCrack();

      const targetDate = destination === 'tomorrow' ? (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      })() : null; // backlog is null

      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            date: targetDate,
            curseLevel: Math.min(5, t.curseLevel + 1),
            runeOfReturn: runeData
          };
        }
        return t;
      });
      setTasks(updatedTasks);

      setCharacter(prev => ({
        ...prev,
        hp: Math.max(1, prev.hp - 2),
        totalHpSacrificed: (prev.totalHpSacrificed || 0) + 2
      }));

      const destLabel = destination === 'tomorrow' ? 'на завтра' : 'в Бэклог';
      setRitualMessage(`💀 Задача «${targetTask.title}» изгнана ${destLabel}! Потеряно 2 HP. Скверна задачи возросла.`);
      setTimeout(() => setRitualMessage(''), 5000);
      setTaskToPushId('');

      // Automatically trigger AI Spirits Counsel
      if (communeWithSpirits) {
        setTimeout(() => communeWithSpirits(updatedTasks), 150);
      }
    };

    if (triggerRuneOfReturn) {
      triggerRuneOfReturn(targetTask, performPush);
    } else {
      performPush(null);
    }
  };

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
    setEditNature(task.nature || 'external');
    setEditExecutionMode(task.executionMode || 'ask_later');
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
      console.warn("AI deconstruction failed, falling back to local steps", e);
      const localSteps = generateLocalSteps(editTitle, editType).map((s, idx) => ({
        id: `step-${idx}-${Date.now()}`,
        title: s,
        completed: false
      }));
      setEditSteps(localSteps);
      setEditIntent("Локальный контракт воли (ИИ Бездны оффлайн)");
      playSuccess();
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
      steps: editSteps,
      nature: editNature,
      executionMode: editExecutionMode
    } : t));
    setEditingTask(null);
  };

  const handleAddToBacklog = () => {
    playClick();
    setTasks(prev => prev.map(t => {
      if (t.id === editingTask.id) {
        return {
          ...t,
          date: null,
          status: 'active'
        };
      }
      return t;
    }));
    playSuccess();
    setRitualMessage(`🔮 Контракт «${editingTask.title}» отправлен в Бэклог.`);
    setTimeout(() => setRitualMessage(''), 5000);
    setEditingTask(null);
  };

  const handleExileTask = () => {
    playBoneCrack();
    setTasks(prev => prev.map(t => {
      if (t.id === editingTask.id) {
        return {
          ...t,
          status: 'buried'
        };
      }
      return t;
    }));
    setCharacter(prev => ({
      ...prev,
      hp: Math.max(1, prev.hp - 15),
      totalHpSacrificed: (prev.totalHpSacrificed || 0) + 15
    }));
    setRitualMessage(`💀 Контракт «${editingTask.title}» изгнан во тьму! Потеряно 15 HP.`);
    setTimeout(() => setRitualMessage(''), 5000);
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

  const handleCreateTask = async (dateStr = null) => {
    if (!newTaskTitle.trim()) return;
    const title = newTaskTitle;
    playClick();

    // Instant local classification for zero lag
    const initialType = classifyLocally(title);

    const taskId = `task-${Date.now()}`;
    const localSteps = generateLocalSteps(title, initialType).map((s, sIdx) => ({
      id: `step-${sIdx}-${Date.now()}`,
      title: s,
      completed: false
    }));

    const newTask = {
      id: taskId,
      title: title,
      type: initialType,
      status: 'active',
      date: dateStr, // Null for backlog
      pomodoroTime: initialType === 'siege' ? 50 : 25,
      pomodoroSpent: 0,
      toxicity: 'standard',
      barrierType: null,
      curseLevel: 0,
      createdAt: Date.now(),
      steps: localSteps,
      intent: '',
      isLongJourney: isLongJourney
    };

    const currentHour = new Date().getHours();
    const isLate = currentHour >= 20 || currentHour < 5;

    if (isLongJourney || isLate) {
      // Intercept with Gothic Adaptation Modal!
      setAdaptationTask(newTask);
      setAdaptationDeadline('');
      setAdaptationModalOpen(true);
      setAdaptationCallback(() => async (action, dl) => {
        let finalTasks = [];
        if (action === 'split') {
          const halfTime = initialType === 'siege' ? 25 : 12;
          const steps1 = localSteps.slice(0, Math.ceil(localSteps.length / 2));
          const steps2 = localSteps.slice(Math.ceil(localSteps.length / 2));
          
          finalTasks.push({
            ...newTask,
            id: `task-${Date.now()}-1`,
            title: `${title} (Часть I: Подготовка)`,
            pomodoroTime: halfTime,
            steps: steps1,
            deadline: dl || 'до конца дня',
            isLongJourney: false
          });
          finalTasks.push({
            ...newTask,
            id: `task-${Date.now()}-2`,
            title: `${title} (Часть II: Завершение)`,
            pomodoroTime: halfTime,
            steps: steps2,
            deadline: dl ? `Завтра / ${dl}` : 'Завтра',
            isLongJourney: false,
            date: dateStr
          });
        } else if (action === 'postpone') {
          const mDate = new Date();
          mDate.setDate(mDate.getDate() + 2);
          const futureDateStr = mDate.toISOString().split('T')[0];
          
          finalTasks.push({
            ...newTask,
            deadline: dl || 'через 2 дня',
            date: futureDateStr, // postpone 2 days
            pomodoroTime: Math.max(15, Math.round(newTask.pomodoroTime / 2)),
            isLongJourney: false
          });
        } else {
          // continue
          finalTasks.push({
            ...newTask,
            deadline: dl || '',
            isLongJourney: isLongJourney
          });
        }

        setTasks(prev => [...prev, ...finalTasks]);
        setNewTaskTitle('');
        setIsLongJourney(false);
        playSuccess();

        // Background AI classification query
        for (const t of finalTasks) {
          try {
            const finalType = await classifyTaskWithAI(t.title);
            if (finalType && finalType !== t.type) {
              setTasks(prev => prev.map(pt => pt.id === t.id ? { ...pt, type: finalType, pomodoroTime: finalType === 'siege' ? 50 : 25 } : pt));
            }
          } catch (err) {
            console.warn("AI background classification failed", err);
          }
        }
      });
      return;
    }

    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    const wasLong = isLongJourney;
    setIsLongJourney(false); // reset
    playSuccess();

    if (wasLong) {
      // Immediately open edit modal
      setEditingTask(newTask);
      setEditTitle(title);
      setEditType(initialType);
      setEditTime(initialType === 'siege' ? 50 : 25);
      setEditIntent('');
      setEditSteps(localSteps);
      setNewStepText('');
      setEditNature('external');
      setEditExecutionMode('ask_later');

      // Trigger Guided questions immediately
      setGuidedStep(0);
      setGuidedAnswers({});
      setEditDeconstructLoading(true);
      try {
        const response = await requestDeconstruction({ title }, 'guided_questions');
        setGuidedQuestions(response.questions || [
          "Какая самая скучная деталь в этой задаче?",
          "С чего физически проще всего начать?",
          "Что именно вызывает у вас страх или ступор?"
        ]);
        setGuidedStep(1);
      } catch (e) {
        console.error("AI deconstruct failed:", e);
      } finally {
        setEditDeconstructLoading(false);
      }
    }

    // Background AI classification query
    try {
      const finalType = await classifyTaskWithAI(title);
      if (finalType && finalType !== initialType) {
        setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
            const updated = {
              ...t,
              type: finalType,
              pomodoroTime: finalType === 'siege' ? 50 : 25
            };
            if (wasLong) {
              setEditType(finalType);
              setEditTime(finalType === 'siege' ? 50 : 25);
            }
            return updated;
          }
          return t;
        }));
      }
    } catch (err) {
      console.warn("AI background classification failed", err);
    }
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

  const renderTaskNatureBadge = (task) => {
    const isInternal = task.nature === 'internal';
    const synonym = task.combatLore?.visualType || task.visualType;
    return (
      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
        <span style={{
          fontSize: '0.62rem',
          color: isInternal ? '#4fc3f7' : '#ff8a80',
          background: 'rgba(0,0,0,0.5)',
          padding: '1px 4px',
          borderRadius: '3px',
          border: `1px solid ${isInternal ? 'rgba(79, 195, 247, 0.25)' : 'rgba(255, 138, 128, 0.25)'}`
        }}>
          {isInternal ? '🧿' : '⚔️'} {synonym || (isInternal ? 'ритуал' : 'схватка')}
        </span>
        {task.executionMode && task.executionMode !== 'ask_later' && (
          <span style={{
            fontSize: '0.62rem',
            color: 'var(--color-bone-dim)',
            background: 'rgba(0,0,0,0.5)',
            padding: '1px 4px',
            borderRadius: '3px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {task.executionMode === 'timer' ? '⏳' : '🌅'} {task.executionMode === 'timer' ? 'Таймер' : 'День'}
          </span>
        )}
      </div>
    );
  };

  const handlePostponeTask = (taskId, targetDateStr) => {
    playClick();
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const performPostpone = (runeData) => {
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          const nextCurse = Math.min(5, t.curseLevel + 1);
          return {
            ...t,
            date: targetDateStr,
            curseLevel: nextCurse,
            runeOfReturn: runeData
          };
        }
        return t;
      });
      setTasks(updatedTasks);

      // Automatically trigger AI Spirits Counsel
      if (communeWithSpirits) {
        setTimeout(() => communeWithSpirits(updatedTasks), 150);
      }
    };

    if (triggerRuneOfReturn) {
      triggerRuneOfReturn(targetTask, performPostpone);
    } else {
      performPostpone(null);
    }
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

    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    playClick();

    // Check if the date is actually changing (meaning a reschedule/postponement)
    const isRescheduling = targetTask.date && targetTask.date !== targetDateStr && targetDateStr !== null;

    const performDrop = (runeData) => {
      let dateChanged = false;
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          let curse = t.curseLevel;
          if (t.date && t.date !== targetDateStr && targetDateStr !== null) {
            curse = Math.min(5, curse + 1);
            dateChanged = true;
          }
          return {
            ...t,
            date: targetDateStr,
            curseLevel: curse,
            runeOfReturn: runeData || t.runeOfReturn
          };
        }
        return t;
      });
      setTasks(updatedTasks);
      setDraggedTaskId(null);

      // Automatically trigger AI Spirits Counsel if rescheduled
      if (dateChanged && communeWithSpirits) {
        setTimeout(() => communeWithSpirits(updatedTasks), 150);
      }
    };

    if (isRescheduling && triggerRuneOfReturn) {
      triggerRuneOfReturn(targetTask, performDrop);
    } else {
      performDrop(null);
    }
  };

  const renderJourneyMap = () => {
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const miles = tasks.filter(t => t.status === 'completed').reduce((acc, t) => {
      if (t.type === 'siege') return acc + 15;
      if (t.type === 'relic') return acc + 10;
      return acc + 5;
    }, 0);

    let location = "🚐 Начало великого Путешествия";
    let locationDesc = "Вы вырвались из оков и отправляетесь в мрачные земли Абаддона.";
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
          <span>Начало (0м)</span>
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

  const todayDateStr = new Date().toISOString().split('T')[0];
  const pullableTasks = tasks.filter(t => t.status === 'active' && t.date !== todayDateStr);
  const pushableTasks = tasks.filter(t => t.status === 'active' && t.date === todayDateStr);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '80vh' }}>

      {/* Exile's Journey Map Roadmap */}
      {renderJourneyMap()}

      {/* 1. Add Task Bar now situated below Journey Map */}
      <div className="rpg-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#09080a', borderColor: '#3a2d21' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '2', minWidth: '250px' }}>
            <textarea
              ref={newTaskTitleRef}
              className="rpg-input rpg-input-auto rpg-scrollbar"
              style={{
                width: '100%',
                fontSize: '1.1rem',
                minHeight: '40px',
                resize: 'none',
                overflowY: 'hidden',
                paddingTop: '8px',
                paddingBottom: '8px',
                lineHeight: '1.3',
                display: 'block'
              }}
              placeholder="Вбейте задачу..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const targetDate = taskDateOption === 'backlog' ? null : (taskDateOption === 'custom' ? customDateValue.trim() || null : taskDateOption);
                  handleCreateTask(targetDate);
                }
              }}
            />
          </div>

          <div style={{ flex: '1', minWidth: '180px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="rpg-input"
              style={{ width: '100%', fontSize: '0.9rem', cursor: 'pointer', height: '40px', padding: '0 8px' }}
              value={taskDateOption}
              onChange={(e) => setTaskDateOption(e.target.value)}
            >
              {getTaskDateOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {taskDateOption === 'custom' && (
              <input
                type="text"
                className="rpg-input animate-fade-in"
                style={{ width: '115px', fontSize: '0.85rem', height: '40px' }}
                placeholder="ГГГГ-ММ-ДД"
                value={customDateValue}
                onChange={(e) => setCustomDateValue(e.target.value)}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-bone-dim)' }}>
              <input
                type="checkbox"
                checked={isLongJourney}
                onChange={(e) => setIsLongJourney(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-blood)', cursor: 'pointer' }}
              />
              <span>Длительное путешествие</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <button
              className="rpg-btn rpg-btn-mana"
              onClick={() => {
                const targetDate = taskDateOption === 'backlog' ? null : (taskDateOption === 'custom' ? customDateValue.trim() || null : taskDateOption);
                handleCreateTask(targetDate);
              }}
              disabled={!newTaskTitle.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 15px' }}
            >
              <Plus size={16} />
              <span>ПРИБИТЬ К ДОГОВОРУ ДНЯ</span>
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          💡 <i>Дважды кликните по любой задаче, чтобы изменить её поля, намерение или переразбить ИИ.</i>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem', marginTop: '0.4rem', paddingLeft: '0.5rem' }}>
          <button
            className={`rpg-btn ${chaosDumpOpen ? 'rpg-btn-blood' : ''}`}
            style={{ fontSize: '0.8rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px', height: '32px' }}
            onClick={() => { playClick(); setChaosDumpOpen(!chaosDumpOpen); }}
          >
            <span>🔮</span>
            <span>{chaosDumpOpen ? 'СКРЫТЬ ОМУТ ХАОСА' : 'ОМУТ ХАОСА (ДАМП МЫСЛЕЙ)'}</span>
          </button>
        </div>

        {chaosDumpOpen && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', border: '1px dashed var(--color-iron-light)', borderRadius: '4px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-rpg)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🌌 Вылейте хаос своего разума (СДВГ-дамп мыслей):
            </label>
            <textarea
              className="rpg-input"
              style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontSize: '0.92rem', background: 'rgba(10,5,15,0.6)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', lineHeight: '1.4' }}
              placeholder="Например: мне надо помыть посуду, но блин раковина полная и воняет, это пипец страшно начать. Еще сдать проект заказчику до среды, там куча мелких правок, надо написать тесты и проверить сборку, это огромная осада! Еще купить корм коту, это быстро."
              value={chaosText}
              onChange={(e) => setChaosText(e.target.value)}
              disabled={chaosLoading}
            />
            <button
              className="rpg-btn rpg-btn-mana"
              style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 20px', fontSize: '0.85rem' }}
              onClick={handleChaosDumpParse}
              disabled={chaosLoading || !chaosText.trim()}
            >
              {chaosLoading ? <RefreshCw className="heartbeat-pulse fast" size={14} /> : <span>🔮</span>}
              <span>{chaosLoading ? 'РАСШИФРОВКА ХАОСА...' : 'РАСШИФРОВАТЬ СХВАТКИ БЕЗДНОЙ'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 1.5. Ritual Alert Notification */}
      {ritualMessage && (
        <div style={{
          background: 'rgba(74, 18, 18, 0.95)',
          border: '1px solid var(--color-blood-glow)',
          boxShadow: '0 0 15px rgba(122, 18, 18, 0.4)',
          color: '#fff',
          padding: '0.8rem 1.2rem',
          fontFamily: 'var(--font-rpg)',
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'screen-shiver 0.3s 1'
        }}>
          <span>{ritualMessage}</span>
          <button
            onClick={() => setRitualMessage('')}
            style={{ background: 'none', border: 'none', color: 'var(--color-bone-dim)', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Tweek Horizontal Scrollboard - NOW AT THE TOP WITH DRAG-TO-SCROLL */}
      <div
        className="tweek-scrollboard"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
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
                      {renderTaskTitle(task, '0.9rem')}
                      {task.curseLevel > 0 && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-curse-glow)' }}>
                          ☠ {task.curseLevel}
                        </span>
                      )}
                    </div>
                    {renderTaskNatureBadge(task)}

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
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>

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
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  {renderTaskTitle(task, '0.85rem')}
                </div>
                {renderTaskNatureBadge(task)}
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

      {/* 1.6. Altar of Soul Conjunction Panel - NOW AT THE VERY BOTTOM */}
      <div className="rpg-panel" style={{
        background: 'radial-gradient(circle, #100a0e 0%, #030104 100%)',
        border: '1px solid var(--color-blood-glow)',
        boxShadow: '0 0 20px rgba(122, 18, 18, 0.15)',
        padding: '1.2rem',
        marginTop: '0.5rem'
      }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          <h3 className="gothic-title" style={{ fontSize: '1.2rem', color: 'var(--color-blood-glow)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚖️</span>
            <span>Алтарь Слияния Душ (Перераспределение Времени)</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', margin: '4px 0 0 0' }}>
            «Когда разум слаб или задачи навалились непосильным грузом, вы можете обменять крупицы жизненных сил и маны на перетасовку судьбы...»
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {/* Postpone all */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Временная Отсрочка (Все задачи)</span>
            <button
              className="rpg-btn rpg-btn-blood"
              style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 'bold' }}
              onClick={handlePostponeAllToday}
              disabled={tasks.filter(t => t.date === new Date().toISOString().split('T')[0] && t.status === 'active').length === 0}
            >
              Отложить всё на завтра (Цена: 15 HP)
            </button>
          </div>

          {/* Pull to today */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Призвать контракт на сегодня</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="rpg-input"
                style={{ flex: 1, fontSize: '0.8rem' }}
                value={taskToPullId}
                onChange={(e) => setTaskToPullId(e.target.value)}
              >
                <option value="">-- Выберите контракт --</option>
                {pullableTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.date ? `на ${t.date}` : 'Бэклог'})
                  </option>
                ))}
              </select>
              <button
                className="rpg-btn rpg-btn-mana"
                style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                onClick={() => handlePullTaskToToday(taskToPullId)}
                disabled={!taskToPullId}
              >
                Призвать (5 MP)
              </button>
            </div>
          </div>

          {/* Push from today */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Изгнать контракт из сегодняшнего дня</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <select
                className="rpg-input"
                style={{ fontSize: '0.8rem' }}
                value={taskToPushId}
                onChange={(e) => setTaskToPushId(e.target.value)}
              >
                <option value="">-- Выберите задачу --</option>
                {pushableTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="rpg-input"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                  value={pushDestination}
                  onChange={(e) => setPushDestination(e.target.value)}
                >
                  <option value="backlog">В Бэклог (Без даты)</option>
                  <option value="tomorrow">На завтра</option>
                </select>
                <button
                  className="rpg-btn"
                  style={{ fontSize: '0.8rem', borderColor: 'var(--color-blood)', padding: '4px 10px' }}
                  onClick={() => handlePushTask(taskToPushId, pushDestination)}
                  disabled={!taskToPushId}
                >
                  Изгнать (10 HP)
                </button>
              </div>
            </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>{renderTaskTitle(task, '0.85rem')}</div>
                      {renderTaskNatureBadge(task)}
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
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>{renderTaskTitle(task, '0.85rem')}</div>
                      {renderTaskNatureBadge(task)}
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
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>{renderTaskTitle(task, '0.85rem')}</div>
                      {renderTaskNatureBadge(task)}
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-bone-dim)' }}>✓ Ритуал проведен</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick add within Kanban day */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--color-iron-light)', paddingTop: '1rem' }}>
              <textarea
                ref={kanbanNewTaskTitleRef}
                className="rpg-input rpg-input-auto kanban-input rpg-scrollbar"
                style={{
                  flex: 1,
                  fontSize: '0.85rem',
                  minHeight: '35px',
                  resize: 'none',
                  overflowY: 'hidden',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  lineHeight: '1.3',
                  display: 'block'
                }}
                placeholder="Быстрый контракт на этот день..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateTask(activeKanbanDay);
                  }
                }}
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
        <div className="gothic-modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="gothic-modal-content" style={{ maxWidth: '680px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-iron-light)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
              <h3 className="gothic-title" style={{ fontSize: '1.2rem', color: 'var(--color-relic-glow)' }}>
                ⚔ Свиток Контракта: {editingTask.title.slice(0, 30)}...
              </h3>
            </div>

            {/* Past Advice from Rune of Return */}
            {editingTask.runeOfReturn && (
              <div style={{
                background: 'radial-gradient(circle, #2a2013 0%, #151006 100%)',
                border: '1px solid var(--color-relic-glow)',
                padding: '1rem 1.2rem',
                marginBottom: '1.2rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.01)',
                color: '#e6dfd3',
                fontSize: '0.85rem',
                lineHeight: '1.4',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                borderLeftWidth: '4px'
              }}>
                <h4 className="gothic-title" style={{ fontSize: '0.8rem', color: 'var(--color-relic-glow)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '0.6rem', fontStyle: 'normal' }}>
                  📜 Напутствие из прошлого (Руна возврата)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div><strong>1. Где остановился:</strong> {editingTask.runeOfReturn.whereFinished}</div>
                  <div><strong>2. Причина переноса:</strong> {editingTask.runeOfReturn.whyDeferred}</div>
                  <div><strong>3. Почему начал/не начал:</strong> {editingTask.runeOfReturn.whyStartedOrNot}</div>
                  <div style={{ marginTop: '0.3rem', paddingLeft: '8px', borderLeft: '2px solid var(--color-relic-glow)', color: 'var(--color-relic-glow)', fontWeight: 'bold' }}>
                    <strong>Совет самому себе:</strong> "{editingTask.runeOfReturn.futureAdvice}"
                  </div>
                </div>
              </div>
            )}

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
                    <textarea
                      ref={editTitleRef}
                      className="rpg-input rpg-input-auto rpg-scrollbar"
                      style={{
                        width: '100%',
                        fontSize: '0.95rem',
                        minHeight: '40px',
                        resize: 'none',
                        overflowY: 'hidden',
                        paddingTop: '8px',
                        paddingBottom: '8px',
                        lineHeight: '1.3',
                        display: 'block'
                      }}
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

                {/* Nature and Execution Mode selectors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>ПРИРОДА ЗАДАЧИ</label>
                    <select
                      className="rpg-input"
                      style={{ width: '100%', fontSize: '0.9rem' }}
                      value={editNature}
                      onChange={(e) => setEditNature(e.target.value)}
                    >
                      <option value="internal">🧿 Внутренний Обет (для себя)</option>
                      <option value="external">⚔️ Внешняя Схватка (для мира)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>РЕЖИМ ВЫПОЛНЕНИЯ</label>
                    <select
                      className="rpg-input"
                      style={{ width: '100%', fontSize: '0.9rem' }}
                      value={editExecutionMode}
                      onChange={(e) => setEditExecutionMode(e.target.value)}
                    >
                      <option value="timer">⏳ Таймер (Печать Времени)</option>
                      <option value="day">🌅 В течение дня (Свободный Переход)</option>
                      <option value="ask_later">❓ Спросить позже (Шепот Сомнений)</option>
                    </select>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-iron-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="rpg-btn" onClick={handleAddToBacklog}>
                      🗄️ Добавить в бэклог
                    </button>
                    <button className="rpg-btn rpg-btn-blood" onClick={handleExileTask}>
                      💀 Изгнать задачу (15 HP)
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="rpg-btn" onClick={() => setEditingTask(null)}>
                      ЗАКРЫТЬ
                    </button>
                    <button className="rpg-btn rpg-btn-blood" onClick={handleSaveEdits}>
                      СОХРАНИТЬ КОНТРАКТ В БАЗУ
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {renderAdaptationModal()}
    </div>
  );
}
