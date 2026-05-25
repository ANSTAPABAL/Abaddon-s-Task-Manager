import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import CarriageSession from './components/CarriageSession';
import CharacterSheet from './components/CharacterSheet';
import TweekPlanner from './components/TweekPlanner';
import SpotifyPlayer from './components/SpotifyPlayer';
import RecoveryScreen from './components/RecoveryScreen';
import { useAudio } from './hooks/useAudio';
import { Settings as SettingsIcon, Volume2, VolumeX, Sliders } from 'lucide-react';

export default function App() {
  const { initAudio, setAtmosphereMood, playClick, setMuted, setVolume } = useAudio();
  
  // App States
  const [activeTab, setActiveTab] = useState('escape'); // escape, character, planner, recovery
  const [tasks, setTasks] = useState([]);
  const [character, setCharacter] = useState({
    name: "Изгнанник",
    race: "Каргахаулец",
    class: "Химомансер (Маг крови)",
    level: 1,
    xp: 0,
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50,
    equipped: { weapon: null, shield: null, armor: null, ring: null },
    inventory: [],
    perks: ["Сгусток крови"],
    shacklesBroken: false,
    intensity: "grim", // grim, soft_grim, quiet_focus
    
    // Новые счетчики СДВГ-статистики (Win Condition & Legacy)
    completedTasksCount: 0,
    completedSiegesCount: 0,
    totalGoldEarned: 0,
    totalManaSpent: 0,
    totalHpSacrificed: 0,
    potionsDrunk: 0,
    meditationsCount: 0
  });

  const [pedestals, setPedestals] = useState([]);

  // Fate Card Selection Mode States
  const [taskPendingModeSelect, setTaskPendingModeSelect] = useState(null);
  const [modeSelectCallback, setModeSelectCallback] = useState(null);

  // Tab switcher with warning & auto-pause
  const handleTabChange = (nextTab) => {
    if (activeTab === 'escape' && nextTab !== 'escape') {
      const activeTaskId = localStorage.getItem('active_task_id');
      const isTimerRunning = localStorage.getItem('combat_is_running') === 'true';
      if (activeTaskId && isTimerRunning) {
        const activeTask = tasks.find(t => t.id === activeTaskId);
        if (activeTask && activeTask.executionMode === 'timer') {
          if (!window.confirm("Вы собираетесь покинуть сражение. Текущее время таймера будет приостановлено и сохранено. Продолжить?")) {
            return;
          }
        }
      }
    }
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

  const handleCommuneWithSpirits = async () => {
    playClick();
    setSpiritsCounselOpen(true);
    setSpiritsCounselLoading(true);
    setSpiritsCounselText('');

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayTasks = tasks.filter(t => t.date === todayStr && t.status === 'active');
      const backlogTasks = tasks.filter(t => t.date === null && t.status === 'active');

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
Пользователь обращается к тебе за советом по поводу своих задач.
Пользователь имеет СДВГ. Твоя цель — дать атмосферный совет, поддержать и разгрузить его мозг, помочь с фокусом.

Взгляни на его состояние (HP - когнитивный ресурс, Mana - энергия, время работы сегодня) и список задач (сегодняшние и бэклог).

Оцени его состояние:
- Если HP низкое (меньше 40) или он проработал много минут сегодня: расскажи мрачным шепотом, что его душа истощена, он чувствует отягощение, и не стоит насиловать себя. Посоветуй отдохнуть, отложить сложные задачи ("осады") или заменить их на простые ритуалы.
- Если HP высокое и задач сделано мало: подбодри его, скажи, что духи чувствуют прилив сил в его жилах, он на пике готовности к охоте.
- Предложи конкретную задачу, с которой лучше начать (выбери самую простую или ту, которая снизит тревогу).
- Если нужно, предложи заменить сложную задачу на более простую или разделить её.
- Задай 1-2 интригующих вопроса, помогающих войти в состояние потока.

Напиши ответ в готическом, таинственном, но теплом и поддерживающем СДВГ-мозг стиле (на русском языке). Используй списки, абзацы и красивые выделения. Сделай ответ не слишком длинным (3-4 абзаца).`;

      const userMessage = `Персонаж: ${JSON.stringify(charContext)}
Активные задачи на сегодня: ${JSON.stringify(todayTasks.map(t => ({ title: t.title, type: t.type, toxicity: t.toxicity, steps: t.steps.length })))}
Задачи в бэклоге: ${JSON.stringify(backlogTasks.map(t => t.title))}
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
  const [envConfig, setEnvConfig] = useState({ configured: false, key: '', port: 3001 });
  const [inputApiKey, setInputApiKey] = useState('');
  const [inputPort, setInputPort] = useState(3001);

  // Audio State
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.5);

  // Spotify integration states
  const [spotifyToken, setSpotifyToken] = useState(() => localStorage.getItem('spotify_token') || '');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [activeSessionType, setActiveSessionType] = useState(null); // escape, hunt, siege, etc.
  const [safeMode, setSafeMode] = useState(false);

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
    if (window.confirm("Вы уверены, что хотите стереть текущего героя и сгенерировать нового? Весь игровой прогресс будет сброшен.")) {
      const classes = [
        "Маг огня", "Маг земли", "Маг камня", "Маг молнии",
        "Маг огня и камня (Мультикласс)", "Маг молнии и земли (Мультикласс)",
        "Некромант", "Рунный маг", "Маг света", "Маг тьмы", "Маг бездны",
        "Дикий Рыцарь", "Наемник Военной Банды", "Бывший Рыцарь", "Рыцарь-Убийца",
        "Рыцарь Чумной Стали", "Отреченный Паладин",
        "Мятежник Изгоев (Бандит)", "Головорез Чумных Земель (Бандит)",
        "Каратель Багрового Ордена", "Храмовник Пепла",
        "Маг меток (Сфрагист) [РЕДКОЕ]",
        "Химомансер (Маг крови) [РЕДКОЕ]",
        "Ментальный Суверен (Телекинетик) [УЛЬТРА-РЕДКОЕ]",
        "Плазмомансер (Эфирный ткач) [УЛЬТРА-РЕДКОЕ]"
      ];
      const races = ["Человек", "Эльф", "Нежить", "Тролль", "Каргахаулец (Бледный гигант)"];
      const startingPerks = {
        "Маг огня": ["Огненный щит", "Вспышка страсти"],
        "Маг земли": ["Каменное упорство", "Заземление тревоги"],
        "Маг камня": ["Руна защиты", "Нерушимый фокус"],
        "Маг молнии": ["Грозовой разряд", "Цепная молния"],
        "Маг огня и камня (Мультикласс)": ["Лавовая струя", "Метеоритный барьер"],
        "Маг молнии и земли (Мультикласс)": ["Грозовой щит", "Сейсмический шок"],
        "Некромант": ["Воскрешение зомби-помощника", "Стрела тьмы"],
        "Рунный маг": ["Начертание рун", "Магический барьер"],
        "Маг света": ["Вспышка озарения", "Световой барьер"],
        "Маг тьмы": ["Покров теней", "Сгущение тьмы"],
        "Маг бездны": ["Зов Бездны", "Щит Забвения"],
        "Дикий Рыцарь": ["Ярость зверя", "Удар топора"],
        "Наемник Военной Банды": ["Круговой замах", "Боевой клич"],
        "Бывший Рыцарь": ["Забытая присяга", "Парирование клинком"],
        "Рыцарь-Убийца": ["Смертельный выпад", "Яд на лезвии"],
        "Рыцарь Чумной Стали": ["Ржавый замах", "Сгнивший барьер"],
        "Отреченный Паладин": ["Оскверненная клятва", "Слепое неистовство"],
        "Мятежник Изгоев (Бандит)": ["Нож в спину", "Коварная уловка"],
        "Головорез Чумных Земель (Бандит)": ["Чумной клинок", "Грабёж допамина"],
        "Каратель Багрового Ордена": ["Багровый допрос", "Священная плеть"],
        "Храмовник Пепла": ["Карающий пепел", "Завеса пепла"],
        "Маг меток (Сфрагист) [РЕДКОЕ]": ["Метка слабости", "Печать отсечения"],
        "Химомансер (Маг крови) [РЕДКОЕ]": ["Жертва крови (HP -> Мгновенный шаг)", "Сгущение скверны"],
        "Ментальный Суверен (Телекинетик) [УЛЬТРА-РЕДКОЕ]": ["Телекинетический щит", "Подчинение воли", "Голос принуждения"],
        "Плазмомансер (Эфирный ткач) [УЛЬТРА-РЕДКОЕ]": ["Клинки эфира (Ближний бой)", "Искажение пространства (Mid-range)"]
      };

      const randClass = classes[Math.floor(Math.random() * classes.length)];
      const randRace = races[Math.floor(Math.random() * races.length)];
      
      const newChar = {
        name: prompt("Введите имя нового Изгнанника:", character.name) || "Изгнанник",
        race: randRace,
        class: randClass,
        level: 1,
        xp: 0,
        hp: 100,
        maxHp: 100,
        mana: 50,
        maxMana: 50,
        equipped: { weapon: null, shield: null, armor: null, ring: null },
        inventory: [],
        perks: startingPerks[randClass] || ["Случайная стойкость"],
        shacklesBroken: false,
        intensity: character.intensity || "grim",
        completedTasksCount: 0,
        completedSiegesCount: 0,
        totalGoldEarned: 0,
        totalManaSpent: 0,
        totalHpSacrificed: 0,
        potionsDrunk: 0,
        meditationsCount: 0,
        gold: 0
      };

      setCharacter(newChar);
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
      })
      .catch(err => console.warn("Using in-memory tasks (Backend server offline)"));

    // 2. Load character stats
    fetch('http://localhost:3001/api/character')
      .then(res => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      })
      .then(data => setCharacter(data))
      .catch(err => console.warn("Using in-memory character (Backend server offline)"));

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
    fetch('http://localhost:3001/api/character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(character)
    }).catch(err => console.warn("Could not save character to backend"));
  }, [character]);

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
    "randomEvent": "Густой туман Бездны скрывает здоровье..."
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
      systemPrompt = `Ты — Бездна. Разложи задачу на 4-6 элементарных физических микро-шагов, которые не требуют усилий. Дай также 1-строчное намерение (intent) "зачем мне это сегодня". Выведи ответ ТОЛЬКО в формате JSON:
{
  "steps": ["Микро-шаг 1", "Микро-шаг 2"],
  "intent": "Намерение"
}`;
      userPrompt = `Задача: "${task.title}". Тип: ${task.type}.`;
    } else if (mode === 'guided_questions') {
      systemPrompt = `Ты — Бездна. Задай ровно 3 простых вопроса пользователю с СДВГ, чтобы диагностировать психологический барьер (страшно, скучно, мутно, слишком много) для выполнения задачи. Ответ выведи ТОЛЬКО в JSON:
{
  "questions": ["Вопрос 1", "Вопрос 2", "Вопрос 3"]
}`;
      userPrompt = `Задача: "${task.title}".`;
    } else if (mode === 'guided_steps') {
      systemPrompt = `Ты — Бездна. Учитывая ответы пользователя, составь для него 4 физических беспрепятственных микро-шага, снижающих стресс. Определи тип барьера ("unclear", "scary", "boring", "too_much"). Выведи ответ ТОЛЬКО в JSON:
{
  "steps": ["Физический микро-шаг 1", "Шаг 2"],
  "intent": "Экзистенциальное намерение сегодня",
  "barrierType": "scary"
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
    if (safeMode) return 0;
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
          right: '15px',
          zIndex: 1100,
          padding: '8px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(20, 15, 25, 0.85)',
          border: '1px solid var(--color-iron-light)',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          cursor: 'pointer'
        }}
        title="Настройки Бездны"
      >
        <SettingsIcon size={18} style={{ color: 'var(--color-bone)' }} />
      </button>

      {/* Settings gothic dropdown/modal panel */}
      {settingsOpen && (
        <div className="gothic-modal-overlay" style={{ zIndex: 1050 }}>
          <div className="gothic-modal-content" style={{ maxWidth: '500px', width: '90%', border: '2px solid var(--color-iron-light)' }}>
            
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
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>Режим Милосердия (Safe Focus):</span>
                <button 
                  className={`rpg-btn ${safeMode ? 'rpg-btn-mana' : ''}`}
                  style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                  onClick={() => { playClick(); setSafeMode(!safeMode); }}
                >
                  {safeMode ? "АКТИВЕН" : "ОТКЛЮЧЕН"}
                </button>
              </div>

              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* Main HUD Stats */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        character={character}
        spotifyConnected={!!spotifyToken}
      />

      {/* Main Tab Controller Grid */}
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {activeTab === 'escape' && (
          <CarriageSession 
            character={character}
            setCharacter={setCharacter}
            tasks={tasks}
            setTasks={setTasks}
            parseMessyTasks={parseMessyTasks}
            playActiveSessionTrack={playActiveSessionTrack}
            generateRedemptionEulogy={generateRedemptionEulogy}
            pedestals={pedestals}
            savePedestals={savePedestals}
            requestTaskExecutionModeSelect={requestTaskExecutionModeSelect}
            communeWithSpirits={handleCommuneWithSpirits}
          />
        )}

        {activeTab === 'character' && (
          <CharacterSheet 
            character={character}
            setCharacter={setCharacter}
            tasks={tasks}
            setTasks={setTasks}
            requestDeconstruction={requestDeconstruction}
            pedestals={pedestals}
            savePedestals={savePedestals}
          />
        )}

        {activeTab === 'planner' && (
          <TweekPlanner 
            tasks={tasks}
            setTasks={setTasks}
            character={character}
            setCharacter={setCharacter}
            requestDeconstruction={requestDeconstruction}
            communeWithSpirits={handleCommuneWithSpirits}
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
        <div className="rpg-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.5rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>
            <span>⚙ РЕЖИМ МИЛОСЕРДИЯ (SAFE FOCUS):</span>
            <button 
              className={`rpg-btn ${safeMode ? 'rpg-btn-mana' : ''}`}
              style={{ padding: '2px 10px', fontSize: '0.75rem' }}
              onClick={() => { playClick(); setSafeMode(!safeMode); }}
            >
              {safeMode ? "АКТИВЕН (Без Скверны)" : "ОТКЛЮЧЕН (Полный хоррор)"}
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-iron-light)' }}>
            Abaddon Task Vessel v1.0.0
          </span>
        </div>
        
        <SpotifyPlayer 
          character={character}
          spotifyToken={spotifyToken}
          setSpotifyToken={setSpotifyToken}
          currentTrack={currentTrack}
          setCurrentTrack={setCurrentTrack}
          activeSessionType={activeSessionType}
        />
      </footer>

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
    </div>
  );
}
