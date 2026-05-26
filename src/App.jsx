import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation';
import CarriageSession from './components/CarriageSession';
import CharacterSheet from './components/CharacterSheet';
import TweekPlanner from './components/TweekPlanner';
import SpotifyPlayer from './components/SpotifyPlayer';
import RecoveryScreen from './components/RecoveryScreen';
import RuneOfReturnModal from './components/RuneOfReturnModal';
import { useAudio } from './hooks/useAudio';
import { Settings as SettingsIcon, Volume2, VolumeX, Sliders } from 'lucide-react';
import { getVirtualTodayStr, getVirtualTomorrowStr } from './utils/dateUtils';
import { rollStartingCharacter } from './utils/characterUtils';

export default function App() {
  const { initAudio, setAtmosphereMood, playClick, playSuccess, setMuted, setVolume, setUseLocalDoublePlaylist, setAmbientLayerActive, restartActiveLayers, synthInstance } = useAudio();
  
  // App States
  const [activeTab, setActiveTab] = useState('escape'); // escape, character, planner, recovery
  const [tasks, setTasks] = useState([]);
  const [character, setCharacter] = useState(rollStartingCharacter);
  const [characterLoaded, setCharacterLoaded] = useState(false);

  const [pedestals, setPedestals] = useState([]);

  // Fate Card Selection Mode States
  const [taskPendingModeSelect, setTaskPendingModeSelect] = useState(null);
  const [modeSelectCallback, setModeSelectCallback] = useState(null);

  const [activeSessionSync, setActiveSessionSync] = useState({
    activeTask: null,
    timeLeft: 0,
    isRunning: false
  });

  const handleTimerStateSync = useCallback((syncData) => {
    setActiveSessionSync(prev => {
      const activeTaskChanged = prev.activeTask?.id !== syncData.activeTask?.id;
      const timeLeftChanged = prev.timeLeft !== syncData.timeLeft;
      const isRunningChanged = prev.isRunning !== syncData.isRunning;
      
      if (!activeTaskChanged && !timeLeftChanged && !isRunningChanged) {
        return prev;
      }
      return syncData;
    });
  }, []);

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
  };

  const handleSelectModeForTask = (taskId, mode) => {
    playClick();
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, executionMode: mode } : t));
    setTaskPendingModeSelect(null);
    if (modeSelectCallback) {
      modeSelectCallback(mode);
      setModeSelectCallback(null);
    }
  };

  const requestTaskExecutionModeSelect = (task, callback) => {
    setTaskPendingModeSelect(task);
    setModeSelectCallback(() => callback);
  };

  // Auto-detect newly created tasks that have no executionMode and show the card picker
  useEffect(() => {
    const unconfiguredTask = tasks.find(t => t.status === 'active' && !t.executionMode);
    if (unconfiguredTask) {
      setTaskPendingModeSelect(unconfiguredTask);
    }
  }, [tasks]);

  // Spirits Counsel states
  const [spiritsCounselOpen, setSpiritsCounselOpen] = useState(false);
  const [spiritsCounselText, setSpiritsCounselText] = useState('');
  const [spiritsCounselLoading, setSpiritsCounselLoading] = useState(false);

  // Character Sidebar Drawer state
  const [characterDrawerOpen, setCharacterDrawerOpen] = useState(false);

  // Rune of Return states
  const [runeModalOpen, setRuneModalOpen] = useState(false);
  const [runeTargetTask, setRuneTargetTask] = useState(null);
  const [runeOnConfirm, setRuneOnConfirm] = useState(null);

  const triggerRuneOfReturn = (taskOrTasks, onConfirm) => {
    setRuneTargetTask(taskOrTasks);
    setRuneOnConfirm(() => onConfirm);
    setRuneModalOpen(true);
  };

  // Daily Judgment states
  const [judgmentOpen, setJudgmentOpen] = useState(false);
  const [judgmentTasks, setJudgmentTasks] = useState([]);
  const [judgmentIndex, setJudgmentIndex] = useState(0);
  const [judgmentShowReschedule, setJudgmentShowReschedule] = useState(false);

  const handleCommuneWithSpirits = async (overrideTasks) => {
    playClick();
    setSpiritsCounselOpen(true);
    setSpiritsCounselLoading(true);
    setSpiritsCounselText('');

    try {
      const activeTasks = overrideTasks || tasks;
      const todayStr = getVirtualTodayStr();
      const todayTasks = activeTasks.filter(t => t.date === todayStr && t.status === 'active');
      const backlogTasks = activeTasks.filter(t => t.date === null && t.status === 'active');

      const charContext = {
        name: character.name,
        class: character.class,
        hp: character.hp,
        maxHp: character.maxHp,
        mana: character.mana,
        level: character.level,
        dailyWorkMinutes: character.dailyWorkMinutes ? Math.round(character.dailyWorkMinutes) : 0,
        completedTasksCount: character.completedTasksCount || 0
      };

      const systemPrompt = `Ты — Древние Духи Абаддона (mysterious grim-dark фэнтези духи).
Мы говорим от первого лица множественного числа (Мы, Наш, Нам). Мы обращаемся непосредственно к Пользователю на "ты".
СТРОГО ИЗБЕГАЙ третьего лица при описании его состояния (никаких фразочек вроде "Герой чувствует усталость" или "Рыцарь готов"). Говори с ним напрямую: "Мы видим, что твоё сознание...", "Твой взор...", "Твоя ментальная защита...".
Тон должен быть серьезным, величественным, древним, таинственным и глубоким, но при этом искренне поддерживающим и бережным к СДВГ-мозгу (без карикатурных глупостей и дешевой комедии).

Внимательно изучи состояние пользователя (HP - его фокус и защита, Mana - энергия, время работы сегодня) и списки его текущих контрактов/квестов (сегодняшние и бэклог, включая их типы, токсичность "toxicity" и скверну/переносы "curseLevel").

Обязанности Духов при ответе:
1. ОЦЕНКА КОГНИТИВНОГО СОСУДА:
   - Если его HP низкое (меньше 40) или он уже долго трудится сегодня: мрачным, сочувствующим шепотом поведай, что его ментальный щит трещит под напором Бездны, а когнитивный сосуд пуст. Предупреди о риске Выгорания/Скверны. Настоятельно посоветуй прекратить насилие над собой, отложить тяжелые "осады" и отдохнуть, либо взяться за крошечный, не требующий усилий ритуал.
   - Если HP высокое и свершений мало: ободри его, скажи, что Мы чувствуем кипение чистой первозданной воли в его жилах, и он готов к великой охоте.
2. ИЗГНАНИЕ СКВЕРНЫ (Cursed Tasks):
   - Если есть задачи со скверной (curseLevel >= 2), укажи на них прямо. Скажи, что этот древний квест висит на его душе мертвым грузом, высасывая внимание даже тогда, когда он не смотрит на него. Посоветуй обмануть разум: снизить сложность (из "осады" в "охоту"), совершить всего 2 минуты физического действия или разбить на крошечные микро-шаги.
3. АНАЛИЗ ПЕРЕПЛЕТЕНИЙ И ДУБЛИКАТОВ (Task Connections):
   - Тщательно проанализируй названия всех задач на сегодня и в бэклоге.
   - Ищи концептуальные повторы, дубликаты или тесно связанные по смыслу задачи.
   - Если найдешь пересечения, прямо скажи об этом! Предложи объединить их или сделать одну задачу шагом или фазой другой.
   - Используй атмосферные формулировки: "Мы чуем, что квесты 'X' и 'Y' питаются из одной ментальной раны. Не лучше ли объединить их в одно горнило или сделать 'Y' первой фазой для 'X'? Поведай нам..."
4. НАПУТСТВИЕ И ВОПРОС ПОТОКА:
   - Укажи на одну конкретную задачу, с которой его разуму будет легче всего начать прямо сейчас (для снижения тревоги).
   - Задай 1-2 глубоких, интригующих вопроса, помогающих войти в состояние потока и сделать первый шаг.

Напиши ответ строго на русском языке, используя красивые абзацы, готические выделения и списки. Текст должен быть емким, вдохновляющим и не длиннее 3-4 абзацев.`;

      const userMessage = `Персонаж: ${JSON.stringify(charContext)}
Активные задачи на сегодня (сегодняшние квесты): ${JSON.stringify(todayTasks.map(t => ({ id: t.id, title: t.title, type: t.type, toxicity: t.toxicity, estimatedTime: t.estimatedTime, stepsCount: t.steps ? t.steps.length : 0, curseLevel: t.curseLevel })))}
Задачи в бэклоге (спящие квесты): ${JSON.stringify(backlogTasks.map(t => ({ id: t.id, title: t.title, type: t.type, toxicity: t.toxicity, estimatedTime: t.estimatedTime, stepsCount: t.steps ? t.steps.length : 0, curseLevel: t.curseLevel })))}
`;

      const response = await fetch('http://localhost:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) throw new Error("Связь с духами прервалась");
      const data = await response.json();
      setSpiritsCounselText(data.choices[0].message.content);
    } catch (e) {
      setSpiritsCounselText(`💀 Духи молчат. Шепот Бездны доносит лишь эхо: "${e.message}". Попробуйте воззвать позже...`);
    } finally {
      setSpiritsCounselLoading(false);
    }
  };

  const generateRedemptionEulogy = async (char) => {
    try {
      const systemPrompt = `Ты — Летописец Бездны во вселенной Абаддона. Твоя задача — составить торжественную, мрачно-триумфальную и поэтичную летопись-эпитафию о подвиге Изгнанника, который искупил свои грехи и прошел Абаддон.
Тебе предоставлена игровая статистика героя (класс, уровень, количество побежденных боссов, потраченное здоровье, выпитые зелья, восстановленная мана и т.д.).
Используй эти данные для глубокого психологического анализа и воспевания его пути:
- Если он часто жертвовал HP (высокое значение totalHpSacrificed), воспой его безумную, стальную готовность пробивать когнитивный ступор ценой собственной крови.
- Если он часто медитировал или пил зелья (meditationsCount, potionsDrunk), восхвали его мудрость баланса и умение вовремя беречь свой разум.
- Если он потратил много маны (totalManaSpent), упомяни его невероятную силу фокуса и магический расход энергии.
- Обязательно упомяни класс героя, его имя и уровень, а также количество запечатанных контрактов.

Напиши летопись на русском языке в атмосферном, готическом, возвышенном стиле древних фолиантов. Раздели на красивые абзацы. Сделай текст глубоко личным и вдохновляющим для человека с СДВГ.`;

      const userMessage = `Статистика Изгнанника:
Имя: ${char.name}
Класс: ${char.class}
Уровень: ${char.level}
Запечатано контрактов всего: ${char.completedTasksCount}
Осаждено Боссов: ${char.completedSiegesCount}
Заработано золота всего: ${char.totalGoldEarned}
Потрачено маны всего: ${char.totalManaSpent}
Пожертвовано HP всего: ${char.totalHpSacrificed}
Выпито зелий: ${char.potionsDrunk}
Проведено медитаций: ${char.meditationsCount}
`;

      const response = await fetch('http://localhost:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) throw new Error("Connection failed");
      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (e) {
      return `«Его воля сокрушила прокрастинацию и навеки разогнала Скверну Абаддона...»\n\n(Не удалось соединиться с сервером AI для составления индивидуальной летописи, но духи помнят твой подвиг!)`;
    }
  };

  // Settings & Env Configuration State
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [ambientLayers, setAmbientLayers] = useState({
    chains: localStorage.getItem('ambient_layer_chains') === 'true',
    dogs: localStorage.getItem('ambient_layer_dogs') === 'true',
    lightning: localStorage.getItem('ambient_layer_lightning') === 'true',
    rain: localStorage.getItem('ambient_layer_rain') === 'true',
    screams: localStorage.getItem('ambient_layer_screams') === 'true',
    river: localStorage.getItem('ambient_layer_river') === 'true',
    swamp: localStorage.getItem('ambient_layer_swamp') === 'true',
    wolves: localStorage.getItem('ambient_layer_wolves') === 'true',
    owls: localStorage.getItem('ambient_layer_owls') === 'true'
  });

  const handleToggleAmbientLayer = (layerId, isChecked) => {
    playClick();
    setAmbientLayers(prev => ({
      ...prev,
      [layerId]: isChecked
    }));
    if (setAmbientLayerActive) {
      setAmbientLayerActive(layerId, isChecked);
    }
  };

  const [envConfig, setEnvConfig] = useState({ configured: false, key: '', port: 3001 });
  const [inputApiKey, setInputApiKey] = useState('');
  const [inputPort, setInputPort] = useState(3001);

  // Audio State
  const [audioMuted, setAudioMuted] = useState(() => localStorage.getItem('default_muted') === 'true');
  const [audioVolume, setAudioVolume] = useState(() => localStorage.getItem('default_volume') !== null ? Number(localStorage.getItem('default_volume')) : 0.5);
  const [useLocalDoublePlaylist, setUseLocalDoublePlaylistState] = useState(() => localStorage.getItem('use_local_double_playlist') === 'true');

  const handleToggleLocalDoublePlaylist = (val) => {
    playClick();
    setUseLocalDoublePlaylistState(val);
    setUseLocalDoublePlaylist(val);
  };

  // Spotify integration states
  const [spotifyToken, setSpotifyToken] = useState(() => localStorage.getItem('spotify_token') || '');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [activeSessionType, setActiveSessionType] = useState(null); // escape, hunt, siege, etc.

  // Sync token to localStorage
  useEffect(() => {
    if (spotifyToken) {
      localStorage.setItem('spotify_token', spotifyToken);
    } else {
      localStorage.removeItem('spotify_token');
    }
  }, [spotifyToken]);

  // Initialize Web Audio API on first interaction
  useEffect(() => {
    const handleGesture = () => {
      initAudio();
      if (restartActiveLayers) {
        restartActiveLayers();
      }
      document.removeEventListener('click', handleGesture);
    };
    document.addEventListener('click', handleGesture);
    return () => document.removeEventListener('click', handleGesture);
  }, [initAudio]);

  // --- SETTINGS, ENV CONFIGURATION, AUDIO CONTROLS & REROLL ---
  const fetchEnvConfig = () => {
    fetch('http://localhost:3001/api/env-config')
      .then(res => res.json())
      .then(data => {
        setEnvConfig(data);
        setInputPort(data.port);
        // If not configured, automatically open settings modal on first entrance!
        if (!data.configured) {
          setSettingsOpen(true);
        }
      })
      .catch(err => console.warn("Could not check env status from backend"));
  };

  useEffect(() => {
    fetchEnvConfig();
  }, []);

  const handleSaveEnvConfig = () => {
    playClick();
    fetch('http://localhost:3001/api/env-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: inputApiKey, port: inputPort })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to save");
        return res.json();
      })
      .then(data => {
        alert("Конфигурация Бездны успешно сохранена в .env и применена!");
        fetchEnvConfig();
        setInputApiKey('');
      })
      .catch(err => alert("Ошибка сохранения конфигурации: " + err.message));
  };

  const toggleAudioMute = () => {
    playClick();
    const nextMuted = !audioMuted;
    setAudioMuted(nextMuted);
    setMuted(nextMuted);
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setAudioVolume(val);
    setVolume(val);
  };

  const handleRerollCharacter = () => {
    playClick();
    if (window.confirm("Вы уверены, что хотите стереть текущего героя и сгенерировать нового? Все ваши активные задачи будут перенесены как Долг прошлого (Труп прошлого).")) {
      const newChar = rollStartingCharacter(pedestals);
      newChar.intensity = character.intensity || "grim";
      setCharacter(newChar);

      // Convert active tasks to "corpse" (Труп прошлого / Debt)
      setTasks(prev => prev.map(t => {
        if (t.status === 'active') {
          return {
            ...t,
            type: 'corpse',
            curseLevel: Math.min(5, (t.curseLevel || 0) + 1)
          };
        }
        return t;
      }));

      setSettingsOpen(false);
      setActiveTab('escape');
    }
  };




  // Auto-switch music/atmosphere when activeTab changes
  useEffect(() => {
    if (activeTab === 'recovery') {
      setAtmosphereMood('recovery');
      playActiveSessionTrack('recovery');
    } else if (activeTab === 'planner') {
      setAtmosphereMood('hunt');
      playActiveSessionTrack('hunt');
    } else if (activeTab === 'character') {
      setAtmosphereMood('deconstruct');
      playActiveSessionTrack('deconstruct');
    } else if (activeTab === 'escape') {
      const activeTaskId = localStorage.getItem('active_task_id');
      if (activeTaskId) {
        const activeTask = tasks.find(t => t.id === activeTaskId);
        if (activeTask) {
          const type = activeTask.type === 'siege' ? 'siege' : 'hunt';
          setAtmosphereMood(type);
          playActiveSessionTrack(type);
          return;
        }
      }
      setAtmosphereMood('quiet_focus');
      playActiveSessionTrack('quiet_focus');
    }
  }, [activeTab, tasks]);

  // 3. Dynamic RPG Grim-Dark Title Evolving System
  useEffect(() => {
    if (!character || !character.race || !character.class) return;

    const completed = character.completedTasksCount || 0;
    const completedSieges = character.completedSiegesCount || 0;
    const hpSacrificed = character.totalHpSacrificed || 0;
    const meditations = character.meditationsCount || 0;
    const potions = character.potionsDrunk || 0;
    const level = character.level || 1;

    // Calculate active cursed tasks and total curse levels
    const activeCursedTasks = tasks.filter(t => t.status === 'active' && t.curseLevel > 1);
    const totalCurseLevel = tasks.reduce((acc, t) => acc + (t.curseLevel || 0), 0);
    const totalCursedTasksCount = tasks.filter(t => t.curseLevel > 0).length;

    let dynamicName = "Изгнанник";

    // Tier 1: Win Condition Savior / Hero-Savior
    if (completed >= 15 && completedSieges >= 3) {
      dynamicName = "Герой-Спаситель Абаддона";
    }
    // Tier 2: Heavy procrastination / Slow Prisoner
    else if (activeCursedTasks.length >= 3 || totalCurseLevel >= 8) {
      dynamicName = "Медлительный Узник";
    }
    else if (totalCursedTasksCount >= 4 && completed < 3) {
      dynamicName = "Скованный Долгами";
    }
    // Tier 3: Boss destroyer
    else if (completedSieges >= 4) {
      dynamicName = "Разрушитель Осад";
    }
    // Tier 4: Indefatigable Hunter
    else if (completed >= 8 && completedSieges === 0) {
      dynamicName = "Неутомимый Охотник";
    }
    // Tier 5: Blood martyr
    else if (hpSacrificed >= 45) {
      dynamicName = "Багровый Мученик";
    }
    // Tier 6: Serene contemplator (high meditation and potion usage)
    else if (meditations >= 6 || (meditations + potions >= 8)) {
      dynamicName = "Безмятежный Созерцатель";
    }
    // Tier 7: progression liberator
    else if (completed >= 6 && level >= 2) {
      dynamicName = "Освободитель Рубежей";
    }
    // Tier 8: ghost / wanderer
    else if (level >= 3 && completed < 4) {
      dynamicName = "Блуждающая Тень";
    }

    if (character.name !== dynamicName) {
      setCharacter(prev => ({
        ...prev,
        name: dynamicName
      }));
    }
  }, [
    character.completedTasksCount,
    character.completedSiegesCount,
    character.totalHpSacrificed,
    character.meditationsCount,
    character.potionsDrunk,
    character.level,
    tasks
  ]);

  // --- LOCAL BACKEND JSON PERSISTENCE & LOAD ---
  
  useEffect(() => {
    // 1. Load tasks from local server
    fetch('http://localhost:3001/api/tasks')
      .then(res => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      })
      .then(data => {
        const migrated = data.map(t => ({
          ...t,
          executionMode: t.executionMode || 'ask_later',
          nature: t.nature || 'external'
        }));
        setTasks(migrated);

        // Trigger Daily Judgment Ceremony for overdue active contracts
        const todayStr = getVirtualTodayStr();
        const overdue = migrated.filter(t => t.status === 'active' && t.date && t.date < todayStr);
        if (overdue.length > 0) {
          setJudgmentTasks(overdue);
          setJudgmentIndex(0);
          setJudgmentOpen(true);
          setJudgmentShowReschedule(false);
        }
      })
      .catch(err => console.warn("Using in-memory tasks (Backend server offline)"));

    // 2. Load character stats
    fetch('http://localhost:3001/api/character')
      .then(res => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      })
      .then(data => {
        if (data && data.race && data.class) {
          setCharacter(data);
        }
        setCharacterLoaded(true);
      })
      .catch(err => {
        console.warn("Using in-memory character (Backend server offline)");
        setCharacterLoaded(true);
      });

    // 3. Load pedestals hall
    fetch('http://localhost:3001/api/pedestals')
      .then(res => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      })
      .then(data => setPedestals(data))
      .catch(err => console.warn("Using in-memory pedestals hall"));
  }, []);

  // Save tasks on edit
  useEffect(() => {
    if (tasks.length === 0) return;
    fetch('http://localhost:3001/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks)
    }).catch(err => console.warn("Could not save tasks to backend"));
  }, [tasks]);

  // Save character on stat change
  useEffect(() => {
    if (!characterLoaded || !character || !character.race) return;
    fetch('http://localhost:3001/api/character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(character)
    }).catch(err => console.warn("Could not save character to backend"));
  }, [character, characterLoaded]);

  // Save pedestals when modified
  const savePedestals = (updatedPedestals) => {
    setPedestals(updatedPedestals);
    fetch('http://localhost:3001/api/pedestals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPedestals)
    }).catch(err => console.warn("Could not save pedestals to backend"));
  };

  // --- DEEPSEEK CORE INTEGRATIONS (AI TUNNEL) ---
  const parseMessyTasks = async (textBlob) => {
    const systemPrompt = `Ты — Бездна во вселенной Абаддона. Твоя задача — взять хаотичные мысли СДВГ-пользователя и превратить их в структурированный JSON-массив задач, геймифицированных как квесты из мрачной фэнтези RPG.

Для каждой задачи определи ее ПРИРОДУ ("nature"):
1. "internal" (Внутренние Обеты - задачи для себя, саморазвития, отдыха, личной организации): ритуал, контракт, пакт, обряд, обет, причастие, созерцание, исповедь, медитация, таинство, уединение, аскеза, очищение.
2. "external" (Внешние Схватки - работа, учеба, внешние обязательства, звонки, дела, подготовка, домашние хлопоты): охота, побег, энкаунтер, столкновение, стычка, осада, вылазка, дуэль, схватка, засада, набег, штурм, рейд.

Геймифицируй каждую задачу! Свяжи её с одной из этих ролевых категорий в зависимости от природы:
- Внутренние (internal): Снятие скверны соляного завеса, Ритуал кровавого пакта, Расшифровка руны забвения, Начертание защитного рунного круга, Сжигание архивов Скверны, Изгнание когнитивного демона, Призыв слуги смерти, Пленение духа сомнений, Заклятие плазменного щита, Ритуал искупления грехов, Активация алтаря костей, Таинство тихого сна, Аскеза безмолвия.
- Внешние (external): Засада каргахаульских мародеров, Схватка с костяным големом, Дуэль с паладином Света, Нападение гарпий Ndravna, Бой с болотным химо-слизнем, Потасовка с пьяным троллем, Атака гончих Бездны, Босс: Инквизитор Забвения, Сражение с некро-паразитом, Босс: Некро-Паук Хаоса, Схватка с железным рыцарем, Дуэль на мосту Вздохов, Стычка с темным культистом, Сражение с плазменным элементалем, Охота на слепого пожирателя, Побег от каргахаульского конвоя, Погоня на костяных колесницах, Ускользание от гончих света, Прорыв сквозь огненный шторм, Побег из цитадели инквизиции, Вылазка из окружения, Преследование вора реликвий, Набег на аванпост ордена, Штурм чумной башни.

Сделай названия шагов ("steps") атмосферными, добавив к ролевому описанию реальное действие в скобках! (Например: "Прорвать оцепление паладинов (Открыть среду разработки)", "Начертить руну отсечения (Удалить старые файлы)").

Оцени "toxicity" (токсичность задачи): "scary" (страшная), "vague" (мутная), "tedious" (скучная), "standard" (обычная).

Каждому квесту обязательно сгенерируй:
1. "nature": либо "internal", либо "external".
2. "visualType": одно из слов синонимов, соответствующих природе:
   - для internal: ритуал, контракт, пакт, обряд, обет, причастие, созерцание, исповедь, медитация, таинство, уединение, аскеза, очищение.
   - для external: охота, побег, энкаунтер, столкновение, стычка, осада, вылазка, дуэль, схватка, засада, набег, штурм, рейд.
3. "enemyName": атмосферное, жуткое и уникальное имя врага или босса (например, "Костяной Жнец Апатии", "Огненная Тварь Дедлайнов", "Призрак Мутных Задач", "Палач Бледных Земель").
4. "weakPoints": массив из 2 инсайтов о психологических и поведенческих слабостях этого врага/задачи (например: ["Монстр боится правила 5 минут...", "Враг слеп к вашей активности..."]).
5. "randomEvent": жуткое или допаминовое случайное событие-модификатор боя (например: "Густой туман Бездны скрывает шкалу здоровья", "Допаминовая вспышка: удвоенный опыт за этот бой!", "Скрежет цепей ускоряет таймер страха").
6. "deadline": найди в тексте пользователя срок выполнения, дедлайн, время или день (например: "до среды", "до 18:00", "завтра утром", "до конца дня"), извлеки его и кратко запиши (например: "Среда", "18:00", "Завтра"). Если срок в тексте не упомянут или не ясен, запиши null.

Выведи ТОЛЬКО валидный JSON-массив, без markdown-разметки или постороннего текста.

Пример формата:
[
  {
    "title": "Название задачи",
    "type": "hunt",
    "estimatedTime": 25,
    "toxicity": "scary",
    "steps": ["Шаг 1", "Шаг 2"],
    "nature": "internal",
    "visualType": "ритуал",
    "enemyName": "Костяной Жнец Апатии",
    "weakPoints": ["Монстр боится правила 5 минут...", "Начните с глупого действия..."],
    "randomEvent": "Густой туман Бездны скрывает здоровье...",
    "deadline": "до среды"
  }
]`;

    const response = await fetch('http://localhost:3001/api/ai/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: textBlob }
        ]
      })
    });

    if (!response.ok) throw new Error("AI Tunnel compilation failed");
    const data = await response.json();
    
    // Parse response content cleanly, stripping markdown JSON markers if any
    let cleanedText = data.choices[0].message.content.trim();
    if (cleanedText.startsWith("```json")) cleanedText = cleanedText.slice(7);
    if (cleanedText.endsWith("```")) cleanedText = cleanedText.slice(0, -3);
    
    return JSON.parse(cleanedText.trim());
  };

  const requestDeconstruction = async (task, mode, extraData = {}) => {
    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'instant') {
      systemPrompt = `Ты — Бездна. Твоя цель — разложить задачу разработчика на 4-6 элементарных физических микро-шагов.
НИ В КОЕМ СЛУЧАЕ не выдумывай конкретный стек технологий, базы данных, библиотеки или требования, если они явно не указаны в названии задачи! Если задача сформулирована обобщенно, шаги должны быть абстрактными (например, "составить список требований", "описать структуру данных", "создать заготовку файла"), либо в первом шаге предложить запустить Ритуал вопросов для уточнения деталей. Не делай ложных допущений за пользователя!
Дай также 1-строчное намерение (intent) "зачем мне это сегодня". Выведи ответ ТОЛЬКО в формате JSON:
{
  "steps": ["Микро-шаг 1", "Микро-шаг 2"],
  "intent": "Намерение"
}`;
      userPrompt = `Задача: "${task.title}". Тип: ${task.type}.`;
    } else if (mode === 'guided_questions') {
      systemPrompt = `Ты — Бездна во вселенной Абаддона (grim-dark RPG фэнтези дух). Твоя цель — допросить Изгнанника по планируемому контракту/задаче СТРОГО до мелочей и прояснить её конкретный контекст.
НИ В КОЕМ СЛУЧАЕ не задавай шаблонные общие вопросы вроде "Каковы требования?", "Какой стек технологий?" или "Что будет вехой?". Пользователь с СДВГ ненавидит такие абстрактные и скучные вопросы.
Вместо этого:
1. Внимательно проанализируй название задачи.
2. Составь ровно 3 простых, крайне конкретных и приземленных уточняющих вопроса о деталях реализации именно этой задачи. Сформулируй их так, будто ты уже понимаешь суть дела и хочешь докопаться до физических/бытовых или технических мелочей.
   - Например, если задача "помыть посуду", спроси: "Будешь мыть руками или доверишься механической посудомойке?", "Скопилась ли там гора жирной посуды или всего пара тарелок?", "Куда сложишь чистую утварь — на сушилку или сразу вытрешь?".
   - Если задача "сделать кнопку на сайте", спроси: "Где именно на странице будет стоять кнопка?", "Какого цвета и стиля она должна быть (хотя бы примерно)?", "Какое действие должно произойти при нажатии?".
3. Тон должен быть темным, древним, таинственным, но вопросы должны оставаться кристально приземленными, практическими и физическими, помогая мозгу сфокусироваться на реальных действиях.
Ответ выведи ТОЛЬКО в формате JSON:
{
  "questions": ["Вопрос 1", "Вопрос 2", "Вопрос 3"]
}`;
      userPrompt = `Задача: "${task.title}".`;
    } else if (mode === 'guided_steps') {
      systemPrompt = `Ты — Бездна. Твоя цель — составить для разработчика 4-6 физических беспрепятственных микро-шагов, снижающих стресс.
Шаги должны СТРОГО опираться на ответы пользователя о технологическом стеке, функционале, требованиях, промежуточных и итоговых результатах.
НИ В КОЕМ СЛУЧАЕ не придумывай посторонние технологии, библиотеки или требования, о которых пользователь не упоминал! Разложи шаги последовательно: от подготовки окружения и инструментов под стек пользователя, через реализацию промежуточного результата, до достижения итогового результата.
Определи преобладающий психологический барьер ("unclear", "scary", "boring", "too_much"). Выведи ответ ТОЛЬКО в JSON:
{
  "steps": ["Физический микро-шаг 1", "Шаг 2"],
  "intent": "Экзистенциальное намерение сегодня (связанное с итоговым результатом)",
  "barrierType": "unclear"
}`;
      userPrompt = `Задача: "${task.title}". Вопросы: ${JSON.stringify(extraData.questions)}. Ответы пользователя: ${JSON.stringify(extraData.answers)}`;
    }

    const response = await fetch('http://localhost:3001/api/ai/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) throw new Error("AI Tunnel compilation failed");
    const data = await response.json();
    
    let cleanedText = data.choices[0].message.content.trim();
    if (cleanedText.startsWith("```json")) cleanedText = cleanedText.slice(7);
    if (cleanedText.endsWith("```")) cleanedText = cleanedText.slice(0, -3);

    return JSON.parse(cleanedText.trim());
  };

  // --- DYNAMIC CORRUPTION EXHAUSTION SYSTEM ---
  // Calculates corruption overlay filter levels based on cursed or messy backlog tasks.
  const calculateCorruptionLevel = () => {
    const cursedTasksCount = tasks.filter(t => t.status === 'active' && t.curseLevel > 2).length;
    if (cursedTasksCount >= 8) return 5;
    if (cursedTasksCount >= 5) return 4;
    if (cursedTasksCount >= 3) return 3;
    if (cursedTasksCount >= 2) return 2;
    if (cursedTasksCount >= 1) return 1;
    return 0;
  };

  const corruptionLevel = calculateCorruptionLevel();

  // Playback control synced from CarriageSession to Spotify
  const playActiveSessionTrack = (mood) => {
    setActiveSessionType(mood);
  };

  if (!characterLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        background: '#0a0a0a', 
        color: '#1db954', 
        fontFamily: 'monospace',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div className="heartbeat-pulse" style={{ fontSize: '1.4rem', marginBottom: '1rem', letterSpacing: '2px', fontWeight: 'bold' }}>
          👁️ СОПРЯЖЕНИЕ С БЕЗДНОЙ...
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', letterSpacing: '0.5px' }}>
          Загрузка когнитивного сосуда Изгнанника...
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Corruption Graphic Overlay */}
      <div className={`corruption-overlay level-${corruptionLevel}`} />

      {/* Settings Gear Button (Top-Right) */}
      <button 
        onClick={() => { playClick(); setSettingsOpen(!settingsOpen); }}
        className="rpg-btn" 
        style={{
          position: 'fixed',
          top: '12px',
          right: characterDrawerOpen ? '695px' : '15px',
          zIndex: 1100,
          padding: '8px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(20, 15, 25, 0.85)',
          border: '1px solid var(--color-iron-light)',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          transition: 'right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
        title="Настройки Бездны"
      >
        <SettingsIcon size={18} style={{ color: 'var(--color-bone)' }} />
      </button>

      {/* Settings gothic dropdown/modal panel */}
      {settingsOpen && (
        <div className="gothic-modal-overlay" style={{ zIndex: 1050 }} onClick={() => setSettingsOpen(false)}>
          <div className="gothic-modal-content" style={{ maxWidth: '500px', width: '90%', border: '2px solid var(--color-iron-light)' }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-iron-light)', paddingBottom: '0.6rem', marginBottom: '1.2rem' }}>
              <h3 className="gothic-title" style={{ fontSize: '1.2rem', color: '#ffb813', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <SettingsIcon size={16} />
                <span>Настройки Бездны</span>
              </h3>
              <button 
                className="rpg-btn"
                style={{ padding: '3px 8px' }}
                onClick={() => { playClick(); setSettingsOpen(false); }}
              >
                Закрыть
              </button>
            </div>

            {/* 1. AUDIO SETTINGS */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', border: '1px solid rgba(255,255,255,0.03)', marginBottom: '1.2rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'var(--font-rpg)' }}>
                🔊 Звук и Громкость разума
              </h4>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.85rem' }}>Процедурные звуки (эффекты):</span>
                <button 
                  className={`rpg-btn ${audioMuted ? 'rpg-btn-blood' : ''}`}
                  style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                  onClick={toggleAudioMute}
                >
                  {audioMuted ? <VolumeX size={12} style={{ display: 'inline', marginRight: '4px' }} /> : <Volume2 size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                  {audioMuted ? "ВЫКЛЮЧЕН" : "ВКЛЮЧЕН"}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', minWidth: '70px' }}>Громкость:</span>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={audioVolume}
                  onChange={handleVolumeChange}
                  style={{ flex: 1, accentColor: 'var(--color-blood)' }}
                />
                <span style={{ fontSize: '0.8rem', minWidth: '35px', textAlign: 'right' }}>{Math.round(audioVolume * 100)}%</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-bone-dim)', marginBottom: '6px' }}>
                    🎵 Фоновый Эмбиент:
                  </label>
                  <select 
                    className="rpg-input"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px' }}
                    value={useLocalDoublePlaylist ? 'double_mp3' : 'synth_drone'}
                    onChange={(e) => handleToggleLocalDoublePlaylist(e.target.value === 'double_mp3')}
                  >
                    <option value="synth_drone">🔮 Процедурный синтезатор дрона Бездны</option>
                    <option value="double_mp3">🎻 Fear & Hunger + Бурый Шум (Двойной Локальный Плейлист)</option>
                  </select>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '0.8rem', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-bone-dim)', marginBottom: '8px' }}>
                    🌲 Дополнительные слои окружения (Web Audio Synth):
                  </label>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-bone)'
                  }}>
                    {[
                      { id: 'rain', label: '🌧️ Дождь' },
                      { id: 'river', label: '🌊 Река' },
                      { id: 'swamp', label: '🐊 Болото' },
                      { id: 'chains', label: '⛓️ Цепи' },
                      { id: 'dogs', label: '🐕 Собаки' },
                      { id: 'lightning', label: '⚡ Молния' },
                      { id: 'screams', label: '👻 Крики' },
                      { id: 'wolves', label: '🐺 Волки' },
                      { id: 'owls', label: '🦉 Совы' }
                    ].map(layer => (
                      <label 
                        key={layer.id} 
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        <input 
                          type="checkbox"
                          checked={ambientLayers[layer.id]}
                          onChange={(e) => handleToggleAmbientLayer(layer.id, e.target.checked)}
                          style={{ accentColor: 'var(--color-blood)', cursor: 'pointer' }}
                        />
                        <span>{layer.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button 
                  className="rpg-btn rpg-btn-mana"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px', marginTop: '4px', borderColor: 'var(--color-relic-glow)', color: 'var(--color-relic-glow)' }}
                  onClick={() => {
                    playSuccess();
                    localStorage.setItem('default_muted', audioMuted ? 'true' : 'false');
                    localStorage.setItem('default_volume', String(audioVolume));
                    localStorage.setItem('default_ambience', synthInstance?.currentMood || 'quiet_focus');
                    localStorage.setItem('use_local_double_playlist', useLocalDoublePlaylist ? 'true' : 'false');
                    
                    // Save all ambient layers
                    Object.keys(ambientLayers).forEach(k => {
                      localStorage.setItem('ambient_layer_' + k, ambientLayers[k] ? 'true' : 'false');
                    });
                    
                    alert("Текущие настройки звука, эмбиент и слои окружения сохранены по умолчанию!");
                  }}
                >
                  💾 Сохранить звук как по умолчанию
                </button>
              </div>
            </div>

            {/* 2. ENV SETTINGS (.env API configuration) */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', border: '1px solid rgba(255,255,255,0.03)', marginBottom: '1.2rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'var(--font-rpg)' }}>
                🔑 Конфигурация Окружения (.env)
              </h4>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>Статус ИИ-Туннеля:</span>
                {envConfig.configured ? (
                  <span style={{ fontSize: '0.75rem', color: '#1db954', fontWeight: 'bold' }}>● АКТИВЕН ({envConfig.key})</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-blood-glow)', fontWeight: 'bold' }}>● НЕ НАСТРОЕН</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>
                    AI_TUNNEL_KEY (Ключ для DeepSeek API)
                  </label>
                  <input 
                    type="password" 
                    className="rpg-input" 
                    style={{ width: '100%', fontSize: '0.85rem' }} 
                    placeholder="Вставьте sk-aitunnel-... ключ"
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>
                    PORT (Порт бэкенд сервера)
                  </label>
                  <input 
                    type="number" 
                    className="rpg-input" 
                    style={{ width: '100%', fontSize: '0.85rem' }} 
                    placeholder="3001"
                    value={inputPort}
                    onChange={(e) => setInputPort(Number(e.target.value))}
                  />
                </div>

                <button 
                  className="rpg-btn rpg-btn-mana"
                  style={{ alignSelf: 'flex-end', fontSize: '0.8rem', padding: '6px 15px' }}
                  onClick={handleSaveEnvConfig}
                >
                  Сохранить настройки Бездны
                </button>
              </div>
            </div>

            {/* 3. ADDITIONAL UTILITIES */}
            {/* 3. ADDITIONAL UTILITIES */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>Пересоздать героя (Реролл):</span>
                <button 
                  className="rpg-btn" 
                  style={{ padding: '3px 10px', fontSize: '0.75rem', borderColor: 'var(--color-relic-glow)' }}
                  onClick={handleRerollCharacter}
                >
                  ⚔️ Новый герой
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Sliding Main Content Wrapper */}
      <div style={{
        transition: 'margin-right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        marginRight: characterDrawerOpen ? '680px' : '0px',
        width: characterDrawerOpen ? 'calc(100% - 680px)' : '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Main HUD Stats */}
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          character={character}
          activeTask={activeSessionSync.activeTask}
          timeLeft={activeSessionSync.timeLeft}
          isRunning={activeSessionSync.isRunning}
        />

        {/* Main Tab Controller Grid */}
        <main style={{ flex: 1, paddingBottom: '3rem' }}>
          <div style={{ display: activeTab === 'escape' ? 'block' : 'none' }}>
            <CarriageSession 
              character={character}
              setCharacter={setCharacter}
              tasks={tasks}
              setTasks={setTasks}
              parseMessyTasks={parseMessyTasks}
              requestDeconstruction={requestDeconstruction}
              playActiveSessionTrack={playActiveSessionTrack}
              generateRedemptionEulogy={generateRedemptionEulogy}
              pedestals={pedestals}
              savePedestals={savePedestals}
              requestTaskExecutionModeSelect={requestTaskExecutionModeSelect}
              communeWithSpirits={handleCommuneWithSpirits}
              onStateSync={handleTimerStateSync}
            />
          </div>

          {activeTab === 'planner' && (
            <TweekPlanner 
              tasks={tasks}
              setTasks={setTasks}
              character={character}
              setCharacter={setCharacter}
              requestDeconstruction={requestDeconstruction}
              communeWithSpirits={handleCommuneWithSpirits}
              triggerRuneOfReturn={triggerRuneOfReturn}
              parseMessyTasks={parseMessyTasks}
            />
          )}

          {activeTab === 'recovery' && (
            <RecoveryScreen 
              character={character}
              setCharacter={setCharacter}
              tasks={tasks}
              setTasks={setTasks}
              requestDeconstruction={requestDeconstruction}
            />
          )}
        </main>

        {/* Spotify Integration Deck at Footer */}
        <footer style={{ marginTop: 'auto' }}>
          <SpotifyPlayer 
            character={character}
            spotifyToken={spotifyToken}
            setSpotifyToken={setSpotifyToken}
            currentTrack={currentTrack}
            setCurrentTrack={setCurrentTrack}
            activeSessionType={activeSessionType}
          />
        </footer>
      </div>

      {/* КАРТА СУДЬБЫ: ВЫБОР РЕЖИМА ВЫПОЛНЕНИЯ (Tarot/Card Game Style Overlay) */}
      {taskPendingModeSelect && (
        <div className="gothic-modal-overlay animate-fade-in" style={{ zIndex: 1200, background: 'rgba(5, 3, 8, 0.96)' }}>
          <div style={{
            maxWidth: '900px',
            width: '90%',
            textAlign: 'center',
            padding: '2rem',
            background: 'linear-gradient(180deg, #18141d 0%, #0d0a10 100%)',
            border: '2px solid var(--color-iron-light)',
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(255, 184, 19, 0.05)',
            position: 'relative'
          }}>
            <div className="dagger-pin" style={{ top: '-15px' }} />
            
            <h2 className="gothic-title" style={{ fontSize: '1.8rem', color: '#ffb813', marginBottom: '0.5rem', letterSpacing: '2px' }}>
              📜 Печать Судьбы: Выбор Режима
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-bone-dim)', marginBottom: '2rem', fontFamily: 'var(--font-rpg)' }}>
              Вы стоите на перепутье. Как воплотится контракт <b style={{ color: '#fff' }}>«{taskPendingModeSelect.title}»</b> в реальном мире?
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Card 1: Timer */}
              <div 
                onClick={() => handleSelectModeForTask(taskPendingModeSelect.id, 'timer')}
                className="gothic-fate-card timer-card"
                style={{
                  flex: '1 1 240px',
                  maxWidth: '280px',
                  background: 'rgba(35, 15, 15, 0.65)',
                  border: '2px solid #8b1a1a',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 5px 15px rgba(139, 26, 26, 0.2)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(139, 26, 26, 0.4)';
                  e.currentTarget.style.borderColor = '#ff4500';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(139, 26, 26, 0.2)';
                  e.currentTarget.style.borderColor = '#8b1a1a';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                <h3 className="gothic-title" style={{ fontSize: '1.25rem', color: '#ff4500', marginBottom: '0.8rem' }}>Печать Времени</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', lineHeight: '1.4' }}>
                  Бой не на жизнь, а на смерть. Таймер тикает, время ограничено. Нарушение концентрации и простой ранят ваш когнитивный ресурс (HP).
                </p>
              </div>

              {/* Card 2: Free Day Walk */}
              <div 
                onClick={() => handleSelectModeForTask(taskPendingModeSelect.id, 'day')}
                className="gothic-fate-card day-card"
                style={{
                  flex: '1 1 240px',
                  maxWidth: '280px',
                  background: 'rgba(15, 25, 35, 0.65)',
                  border: '2px solid #1db954',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 5px 15px rgba(29, 185, 84, 0.2)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(29, 185, 84, 0.4)';
                  e.currentTarget.style.borderColor = '#4feb82';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(29, 185, 84, 0.2)';
                  e.currentTarget.style.borderColor = '#1db954';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌅</div>
                <h3 className="gothic-title" style={{ fontSize: '1.25rem', color: '#1db954', marginBottom: '0.8rem' }}>Свободный Переход</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', lineHeight: '1.4' }}>
                  Путь созерцания. Без ограничения по времени и урона. Вычеркивайте шаги в свободном ритме в течение дня, духи не торопят вас.
                </p>
              </div>

              {/* Card 3: Ask Later (Only shown if NOT in immediate execution callback) */}
              {!modeSelectCallback && (
                <div 
                  onClick={() => handleSelectModeForTask(taskPendingModeSelect.id, 'ask_later')}
                  className="gothic-fate-card ask-later-card"
                  style={{
                    flex: '1 1 240px',
                    maxWidth: '280px',
                    background: 'rgba(25, 20, 30, 0.65)',
                    border: '2px solid #5a4f6e',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 5px 15px rgba(90, 79, 110, 0.2)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(90, 79, 110, 0.4)';
                    e.currentTarget.style.borderColor = '#a894c7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(90, 79, 110, 0.2)';
                    e.currentTarget.style.borderColor = '#5a4f6e';
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❓</div>
                  <h3 className="gothic-title" style={{ fontSize: '1.25rem', color: '#a894c7', marginBottom: '0.8rem' }}>Шепот Сомнений</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', lineHeight: '1.4' }}>
                    Отложить решение. Выполнить спонтанно. Бездна спросит вас о режиме выполнения непосредственно перед вступлением в бой.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* СВИТОК ДУХОВ: СОВЕТЫ ИИ (Commune with Spirits Modal) */}
      {spiritsCounselOpen && (
        <div className="gothic-modal-overlay animate-fade-in" style={{ zIndex: 1210 }}>
          <div className="parchment-contract" style={{
            maxWidth: '650px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '2.5rem',
            position: 'relative',
            background: '#eeddbb',
            color: '#2a1a08',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
            borderRadius: '4px'
          }}>
            <div className="dagger-pin" style={{ top: '-15px' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #5c4033', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              <h3 className="gothic-title" style={{ fontSize: '1.4rem', color: '#5c4033', margin: 0, fontFamily: 'var(--font-gothic)' }}>
                🧿 Шепот Древних Духов
              </h3>
              <button 
                className="rpg-btn" 
                style={{
                  background: '#5c4033',
                  color: '#eeddbb',
                  borderColor: '#2a1a08',
                  padding: '3px 10px',
                  fontSize: '0.8rem'
                }}
                onClick={() => { playClick(); setSpiritsCounselOpen(false); }}
              >
                Вернуться к яви
              </button>
            </div>

            {spiritsCounselLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div className="heartbeat-pulse fast" style={{ fontSize: '2.5rem', color: '#5c4033', marginBottom: '1rem' }}>🧿</div>
                <p style={{ fontFamily: 'var(--font-rpg)', fontStyle: 'italic' }}>Духи собираются вокруг алтаря времени... Пожалуйста, подождите...</p>
              </div>
            ) : (
              <div style={{ fontFamily: 'Georgia, serif', lineHeight: '1.6', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                {spiritsCounselText}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
              <button 
                className="rpg-btn" 
                style={{
                  background: '#5c4033',
                  color: '#eeddbb',
                  borderColor: '#2a1a08',
                  padding: '8px 25px',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.15)'
                }}
                onClick={() => { playClick(); setSpiritsCounselOpen(false); }}
              >
                Да будет так
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Sheet Sidebar Toggle (Fixed circle right on the browser edge) */}
      <button 
        onClick={() => { playClick(); setCharacterDrawerOpen(!characterDrawerOpen); }}
        className="rpg-btn" 
        style={{
          position: 'fixed',
          top: '50%',
          right: characterDrawerOpen ? '680px' : '0px',
          transform: 'translate(50%, -50%)',
          zIndex: 1100,
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--color-relic), var(--color-iron-dark))',
          border: '2px solid var(--color-relic-glow)',
          boxShadow: '0 0 15px rgba(255, 184, 19, 0.3)',
          cursor: 'pointer',
          transition: 'right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
        title={characterDrawerOpen ? "Закрыть Лист Персонажа" : "Открыть Лист Персонажа"}
      >
        <span style={{ fontSize: '1.25rem', color: 'var(--color-relic-glow)', display: 'block', pointerEvents: 'none' }}>
          {characterDrawerOpen ? '▶' : '◀'}
        </span>
      </button>

      {/* Character Sheet Sidebar Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '680px',
        maxWidth: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #151119 0%, #0c090e 100%)',
        borderLeft: '2px solid var(--color-iron-light)',
        boxShadow: '-5px 0 25px rgba(0,0,0,0.8)',
        padding: '1.5rem',
        overflowY: 'auto',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        transform: characterDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-iron-light)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
          <h3 className="gothic-title" style={{ fontSize: '1.25rem', color: 'var(--color-relic-glow)', margin: 0 }}>
            👤 Лист Персонажа
          </h3>
          <button 
            className="rpg-btn" 
            style={{ padding: '2px 8px', fontSize: '0.8rem' }}
            onClick={() => { playClick(); setCharacterDrawerOpen(false); }}
          >
            Закрыть
          </button>
        </div>
        <div style={{ flex: 1, zoom: '0.80', transformOrigin: 'top center' }}>
          <CharacterSheet 
            character={character}
            setCharacter={setCharacter}
            tasks={tasks}
            setTasks={setTasks}
            requestDeconstruction={requestDeconstruction}
            pedestals={pedestals}
            savePedestals={savePedestals}
          />
        </div>
      </div>

      {/* СУДНЫЙ ДЕНЬ: ДНЕВНОЙ СУД НАД ПРОСРОЧЕННЫМИ КОНТРАКТАМИ */}
      {judgmentOpen && judgmentTasks.length > 0 && judgmentIndex < judgmentTasks.length && (
        <div className="gothic-modal-overlay animate-fade-in" style={{ zIndex: 1300, background: 'rgba(10, 5, 15, 0.95)' }}>
          <div className="parchment-contract" style={{
            maxWidth: '550px',
            width: '90%',
            padding: '2.5rem',
            position: 'relative',
            background: '#eeddbb',
            color: '#2a1a08',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9)',
            borderRadius: '4px',
            border: '3px double #5c4033',
            textAlign: 'center'
          }}>
            <div className="dagger-pin" style={{ top: '-15px' }} />
            
            <h2 className="gothic-title" style={{ fontSize: '1.8rem', color: '#8b0000', margin: '0 0 10px 0', fontFamily: 'var(--font-gothic)', letterSpacing: '1px' }}>
              💀 СУДНЫЙ ДЕНЬ БЕГЛЕЦА
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#5c4033', margin: '0 0 20px 0', fontStyle: 'italic', fontFamily: 'var(--font-rpg)' }}>
              Бездна проверяет старые долги. Контракт от {judgmentTasks[judgmentIndex].date} просрочен...
            </p>

            <div style={{ background: 'rgba(0,0,0,0.05)', border: '1px dashed #5c4033', padding: '1.2rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#000', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                «{judgmentTasks[judgmentIndex].title}»
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#4a321f', margin: 0 }}>
                Сущность: {judgmentTasks[judgmentIndex].type === 'siege' ? '💥 ОСАДА (БОСС)' : judgmentTasks[judgmentIndex].type === 'relic' ? '💎 РЕЛИКВИЯ' : '🏹 ОХОТА'}
              </p>
            </div>

            {!judgmentShowReschedule ? (
              <div>
                <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                  Вы смогли завершить этот контракт вовремя?
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button 
                    className="rpg-btn"
                    style={{ background: '#2ecc71', color: '#fff', borderColor: '#27ae60', padding: '8px 25px' }}
                    onClick={() => {
                      playClick();
                      const task = judgmentTasks[judgmentIndex];
                      const isSiege = task.type === 'siege';
                      const exp = isSiege ? 60 : 25;
                      const gold = isSiege ? 15 : 5;

                      // Complete task
                      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
                      
                      // Rewards
                      setCharacter(c => {
                        const nextXp = c.xp + exp;
                        const needed = c.level * 100;
                        let nextLvl = c.level;
                        let rx = nextXp;
                        if (rx >= needed) {
                          nextLvl += 1;
                          rx -= needed;
                        }
                        return {
                          ...c,
                          level: nextLvl,
                          xp: rx,
                          gold: (c.gold || 0) + gold,
                          completedTasksCount: (c.completedTasksCount || 0) + 1,
                          completedSiegesCount: (c.completedSiegesCount || 0) + (isSiege ? 1 : 0),
                          totalGoldEarned: (c.totalGoldEarned || 0) + gold
                        };
                      });

                      // Next
                      if (judgmentIndex + 1 < judgmentTasks.length) {
                        setJudgmentIndex(prev => prev + 1);
                      } else {
                        setJudgmentOpen(false);
                      }
                    }}
                  >
                    👍 ДА, ВЫПОЛНЕНО
                  </button>
                  
                  <button 
                    className="rpg-btn"
                    style={{ background: '#e74c3c', color: '#fff', borderColor: '#c0392b', padding: '8px 25px' }}
                    onClick={() => {
                      playClick();
                      // HP damage
                      setCharacter(c => ({
                        ...c,
                        hp: Math.max(10, c.hp - 10),
                        totalHpSacrificed: (c.totalHpSacrificed || 0) + 10
                      }));
                      setJudgmentShowReschedule(true);
                    }}
                  >
                    👎 НЕТ, Я ЗАВАЛИЛ
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.95rem', color: '#8b0000', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                  💥 Вы теряете 10 HP здоровья разума! <br />
                  Куда перенесем этот оскверненный контракт?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <button 
                    className="rpg-btn"
                    style={{ background: '#5c4033', color: '#eeddbb', borderColor: '#2a1a08' }}
                    onClick={() => {
                      playClick();
                      const task = judgmentTasks[judgmentIndex];
                      triggerRuneOfReturn(task, (runeData) => {
                        const todayStr = getVirtualTodayStr();
                        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, date: todayStr, curseLevel: Math.min(5, (t.curseLevel || 0) + 1), runeOfReturn: runeData } : t));
                        
                        // Move next
                        setJudgmentShowReschedule(false);
                        if (judgmentIndex + 1 < judgmentTasks.length) {
                          setJudgmentIndex(prev => prev + 1);
                        } else {
                          setJudgmentOpen(false);
                        }
                      });
                    }}
                  >
                    📅 Перенести на СЕГОДНЯ
                  </button>
                  <button 
                    className="rpg-btn"
                    style={{ background: '#5c4033', color: '#eeddbb', borderColor: '#2a1a08' }}
                    onClick={() => {
                      playClick();
                      const task = judgmentTasks[judgmentIndex];
                      triggerRuneOfReturn(task, (runeData) => {
                        const tomorrowStr = getVirtualTomorrowStr();
                        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, date: tomorrowStr, curseLevel: Math.min(5, (t.curseLevel || 0) + 1), runeOfReturn: runeData } : t));

                        // Move next
                        setJudgmentShowReschedule(false);
                        if (judgmentIndex + 1 < judgmentTasks.length) {
                          setJudgmentIndex(prev => prev + 1);
                        } else {
                          setJudgmentOpen(false);
                        }
                      });
                    }}
                  >
                    ⏳ Отложить на ЗАВТРА
                  </button>
                  <button 
                    className="rpg-btn"
                    style={{ background: '#5c4033', color: '#eeddbb', borderColor: '#2a1a08' }}
                    onClick={() => {
                      playClick();
                      const task = judgmentTasks[judgmentIndex];
                      triggerRuneOfReturn(task, (runeData) => {
                        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, date: null, curseLevel: Math.min(5, (t.curseLevel || 0) + 1), runeOfReturn: runeData } : t));

                        // Move next
                        setJudgmentShowReschedule(false);
                        if (judgmentIndex + 1 < judgmentTasks.length) {
                          setJudgmentIndex(prev => prev + 1);
                        } else {
                          setJudgmentOpen(false);
                        }
                      });
                    }}
                  >
                    💀 Сбросить в БЭКЛОГ (Долг)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ARPG Status Globes */}
      <div className="arpg-globes-container" style={{ pointerEvents: 'none' }}>
        {/* Left: Mana & Stamina Globe */}
        <div style={{
          position: 'fixed',
          bottom: '25px',
          left: '25px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(5, 5, 10, 0.8)',
          border: '3px solid var(--color-iron-light)',
          boxShadow: '0 0 20px rgba(0,0,0,0.8), inset 0 0 15px rgba(255,255,255,0.05)',
          overflow: 'hidden',
          zIndex: 900,
          pointerEvents: 'auto'
        }} title={`Ресурс и Выносливость: ${Math.round(character.mana)}/${character.maxMana} RP • Усталость: ${Math.floor(character.dailyWorkMinutes || 0)}/300 мин`}>
          {/* Liquid Fill */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${Math.min(100, Math.max(0, (character.mana / character.maxMana) * 100))}%`,
            background: 'linear-gradient(to top, #3a0078 0%, #8a2be2 100%)',
            boxShadow: '0 0 15px rgba(138, 43, 226, 0.6)',
            transition: 'height 0.5s ease',
            width: '100%'
          }}>
            <div style={{
              position: 'absolute',
              top: '-5px',
              left: 0,
              right: 0,
              height: '10px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              filter: 'blur(1px)'
            }} />
          </div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontFamily: 'var(--font-rpg)',
            fontSize: '0.75rem',
            textShadow: '2px 2px 4px #000',
            fontWeight: 'bold',
            textAlign: 'center',
            pointerEvents: 'none',
            lineHeight: '1.2'
          }}>
            <div>{Math.round(character.mana)}</div>
            <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>RP (⚡)</div>
            <div style={{ fontSize: '0.55rem', color: '#ffb813' }}>{Math.floor(character.dailyWorkMinutes || 0)}м</div>
          </div>
        </div>

        {/* Right: HP Globe */}
        <div style={{
          position: 'fixed',
          bottom: '25px',
          right: characterDrawerOpen ? '705px' : '25px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(10, 5, 5, 0.8)',
          border: '3px solid var(--color-iron-light)',
          boxShadow: '0 0 20px rgba(0,0,0,0.8), inset 0 0 15px rgba(255,255,255,0.05)',
          overflow: 'hidden',
          zIndex: 900,
          pointerEvents: 'auto',
          transition: 'right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }} title={`Здоровье (HP): ${Math.round(character.hp)}/${character.maxHp}`}>
          {/* Liquid Fill */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${Math.min(100, Math.max(0, (character.hp / character.maxHp) * 100))}%`,
            background: 'linear-gradient(to top, #5c0000 0%, #e74c3c 100%)',
            boxShadow: '0 0 15px rgba(231, 76, 60, 0.6)',
            transition: 'height 0.5s ease',
            width: '100%'
          }}>
            <div style={{
              position: 'absolute',
              top: '-5px',
              left: 0,
              right: 0,
              height: '10px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              filter: 'blur(1px)'
            }} />
          </div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontFamily: 'var(--font-rpg)',
            fontSize: '0.78rem',
            textShadow: '2px 2px 4px #000',
            fontWeight: 'bold',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            <div>{Math.round(character.hp)}</div>
            <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>HP</div>
          </div>
        </div>
      </div>

      {/* Rune of Return Modal Overlay */}
      {runeModalOpen && (
        <RuneOfReturnModal 
          task={runeTargetTask}
          onConfirm={(runeData) => {
            if (runeOnConfirm) {
              runeOnConfirm(runeData);
            }
            setRuneModalOpen(false);
            setRuneTargetTask(null);
            setRuneOnConfirm(null);
          }}
          onCancel={() => {
            setRuneModalOpen(false);
            setRuneTargetTask(null);
            setRuneOnConfirm(null);
          }}
        />
      )}
    </div>
  );
}
