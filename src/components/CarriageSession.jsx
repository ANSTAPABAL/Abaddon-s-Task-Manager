import React, { useState, useEffect, useRef } from 'react';
import { 
  Skull, AlertTriangle, ChevronRight, Zap, RefreshCw, X, AlertCircle, 
  Shield, Sword, Heart, Flame, Sparkles, BatteryCharging, Coffee, 
  Timer, Award, Compass, Eye, BookOpen, Volume2 
} from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

// Список 50 уникальных вариаций когнитивной борьбы Бездны (ADHD-аспекты)
const COMBAT_VARIATIONS = [
  { type: "схватка", icon: "⚔️", prefix: "Костяной Голем", suffix: "Апатии", desc: "Древний голем, собранный из обломков ваших отложенных планов." },
  { type: "руна", icon: "🔮", prefix: "Светящаяся Руна", suffix: "Откладывания", desc: "Сложная ментальная печать, вытягивающая вашу концентрацию." },
  { type: "ритуал", icon: "🕯️", prefix: "Некро-Пакт", suffix: "Тревожности", desc: "Темный культ сковывает ваши мысли невидимыми оковами." },
  { type: "заклятье", icon: "✨", prefix: "Ментальный Вакуум", suffix: "Прокрастинации", desc: "Заклинание, отсекающее вдохновение и порождающее ступор." },
  { type: "погоня", icon: "🐕", prefix: "Гончие", suffix: "Ускользающего Времени", desc: "Жуткие гончие с огненными глазами преследуют ваши драгоценные секунды." },
  { type: "побег", icon: "⛓️", prefix: "Каргахаульские", suffix: "Оковы Рутины", desc: "Антимагические кандалы, мешающие вам совершить физическое действие." },
  { type: "потасовка", icon: "👹", prefix: "Болотный Тролль", suffix: "Скучных Дел", desc: "Огромный тролль, швыряющий в вас комьями нудной рутины." },
  { type: "драка", icon: "🕷️", prefix: "Химо-Паразит", suffix: "Забывчивости", desc: "Склизкое существо империи смерти, пожирающее когнитивный ресурс." },
  { type: "засада", icon: "🏹", prefix: "Мародеры", suffix: "Внешнего Шума", desc: "Разбойники засыпают вас стрелами уведомлений и звонков." },
  { type: "наблюдение", icon: "👁️", prefix: "Парящее Око", suffix: "Инквизиции", desc: "Глаз ждет вашей малейшей оплошности, блокируя старт." },
  { type: "событие", icon: "🩸", prefix: "Алтарь", suffix: "Ментального Саботажа", desc: "Шепчет вам забросить дела и отдаться допаминовому голоду." },
  { type: "бой", icon: "🤺", prefix: "Рыцарь", suffix: "Ненужного Перфекционизма", desc: "Рыцарь в сияющих латах Света требует идеальности каждого шага." },
  { type: "дуэль", icon: "⚔️", prefix: "Призрак", suffix: "Прошлых Ошибок", desc: "Ваша собственная тень, упрекающая вас за былые неудачи." },
  { type: "осада", icon: "🏰", prefix: "Цитадель", suffix: "Громоздких Сборок", desc: "Крепость из тысячи мелких подзадач, блокирующая проход." },
  { type: "вылазка", icon: "🚶", prefix: "Соляной Разбойник", suffix: "Сомнений", desc: "Пытается украсть вашу уверенность в собственных силах." },
  { type: "охота", icon: "🦅", prefix: "Гарпия-Крикунья", suffix: "Поверхностного Внимания", desc: "Своим визгом заставляет ваш фокус скакать с темы на тему." },
  { type: "изгнание", icon: "🎭", prefix: "Когнитивный Демон", suffix: "Страха", desc: "Сущность, раздувающая мелкие риски до размеров катастрофы." },
  { type: "пакт", icon: "📜", prefix: "Договор", suffix: "Смертельного Дедлайна", desc: "Спешащий призрак с часами, бьющими когнитивный ресурс." },
  { type: "алтарь", icon: "🪦", prefix: "Костяной Оплот", suffix: "Хаотичных Мыслей", desc: "Бастион, перегружающий оперативную память вашего мозга." },
  { type: "проклятие", icon: "☣️", prefix: "Скверна", suffix: "Чистого Листа", desc: "Парализующее проклятие, мешающее написать первое слово." },
  { type: "ловушка", icon: "🕸️", prefix: "Рунная Петля", suffix: "Уныния", desc: "Ловушка, делающая любую задачу невероятно пресной и скучной." },
  { type: "склеп", icon: "⚰️", prefix: "Заброшенный Склеп", suffix: "Старых Долгов", desc: "Пыльное подземелье, откуда тянутся призраки забытых обещаний." },
  { type: "сжигание", icon: "🔥", prefix: "Архивы", suffix: "Когнитивной Гнили", desc: "Куча старых писем, отчетов и документов, требующая немедленного огня." },
  { type: "сбор", icon: "🍯", prefix: "Химо-Плазма", suffix: "Волевого Ресурса", desc: "Капли редкого эликсира, который нужно собрать сквозь шум." },
  { type: "призыв", icon: "🔮", prefix: "Послушный Мертвец", suffix: "Механической Рутины", desc: "Требует бездумного монотонного повторения скучных действий." },
  { type: "пытка", icon: "⛓️", prefix: "Ментальный Пресс", suffix: "Непонятности", desc: "Пресс сжимается, если вы не понимаете истинные границы задачи." },
  { type: "кандалы", icon: "🔒", prefix: "Замок", suffix: "Ментального Барьера", desc: "Невидимый замок, блокирующий доступ к рабочей памяти." },
  { type: "барьер", icon: "🛡️", prefix: "Стена", suffix: "Когнитивного Сопротивления", desc: "Непреодолимая преграда, возникающая при попытке сесть за работу." },
  { type: "шторм", icon: "🌪️", prefix: "Вихрь", suffix: "Постороннего Шума", desc: "Ураган из звонков, сообщений, мыслей и внешних отвлечений." },
  { type: "призрак", icon: "👻", prefix: "Блуждающий Дух", suffix: "Сонливости", desc: "Дух, убаюкивающий вас посреди разгара рабочего дня." },
  { type: "легион", icon: "👥", prefix: "Орда", suffix: "Мелких Раздражителей", desc: "Толпа копошащихся мелких хлопот, отвлекающих от главного квеста." },
  { type: "пожиратель", icon: "🦖", prefix: "Пожиратель", suffix: "Ментальной Энергии", desc: "Чудовище с огромной пастью, высасывающее силы за секунды." },
  { type: "когти", icon: "🦅", prefix: "Когти", suffix: "Социального Давления", desc: "Страх перед оценкой других людей парализует ваши действия." },
  { type: "яд", icon: "🧪", prefix: "Ментальный Токсин", suffix: "Неуверенности", desc: "Яд, заставляющий вас сомневаться в качестве своей работы." },
  { type: "лабиринт", icon: "🌀", prefix: "Лабиринт", suffix: "Множества Выборов", desc: "Слишком много вариантов путей, заставляющих застрять на месте." },
  { type: "допрос", icon: "📢", prefix: "Голос", suffix: "Внутреннего Критика", desc: "Шепчет, что у вас ничего не получится и нет смысла начинать." },
  { type: "печать", icon: "🔏", prefix: "Печать", suffix: "Информационного Шума", desc: "Печать, забивающая каналы восприятия бесполезными данными." },
  { type: "shepot", icon: "🗣️", prefix: "Шепот", suffix: "Ложных Приоритетов", desc: "Заставляет вас заниматься неважными вещами вместо главного." },
  { type: "бездна", icon: "🕳️", prefix: "Пропасть", suffix: "Когнитивного Тупика", desc: "Чувство полной пустоты в голове при взгляде на задачу." },
  { type: "тлен", icon: "🍂", prefix: "Тлен", suffix: "Утраченного Времени", desc: "Привидение укоряет вас за потерянные часы сегодняшнего дня." },
  { type: "кости", icon: "🦴", prefix: "Скелет", suffix: "Недоделанных Проектов", desc: "Оживший мертвец из прошлых брошенных начинаний." },
  { type: "скверна", icon: "🌋", prefix: "Извержение", suffix: "Ментального Сквернословия", desc: "Злость и фрустрация, мешающие трезво оценивать свои силы." },
  { type: "оковы", icon: "🔗", prefix: "Цепи", suffix: "Физического Застоя", desc: "Тело затекло и просит разминки, стягивая фокус." },
  { type: "скрежет", icon: "⚙️", prefix: "Скрежет", suffix: "Тяжелого Старта", desc: "Ужасное когнитивное трение при первых секундах работы." },
  { type: "пепел", icon: "💨", prefix: "Пепел", suffix: "Сгоревшего Интереса", desc: "Задача быстро потеряла новизну и кажется пресной трухой." },
  { type: "пламя", icon: "🔥", prefix: "Адское Пламя", suffix: "Горящего Дедлайна", desc: "Враг атакует с бешеной скоростью, требуя немедленной сдачи." },
  { type: "искры", icon: "⚡", prefix: "Искры", suffix: "Идейной Вспышки", desc: "Заставляет ваш мозг фонтанировать идеями, уходя в сторону." },
  { type: "вспышка", icon: "💡", prefix: "Вспышка", suffix: "Гиперфокуса", desc: "Монстр уязвим, если вы поймаете состояние потока разума." },
  { type: "тень", icon: "🌑", prefix: "Тень", suffix: "Когнитивного Искажения", desc: "Заставляет вас преувеличивать сложность работы." },
  { type: "туман", icon: "🌫️", prefix: "Густой Туман", suffix: "Неясных Шагов", desc: "Вы не знаете с чего начать, и враг прячется в этой дымке." }
];

export default function CarriageSession({ 
  character, 
  setCharacter, 
  tasks, 
  setTasks, 
  parseMessyTasks,
  playActiveSessionTrack,
  generateRedemptionEulogy,
  pedestals = [],
  savePedestals
}) {
  const { playClick, playBoneCrack, playSuccess, startHeartbeat, stopHeartbeat, setAtmosphereMood } = useAudio();
  const [messyText, setMessyText] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // Exile/Setup Phase Stage: 'lore' -> 'hub' -> 'input' -> 'review' -> 'crash' -> 'active'
  const [setupStage, setSetupStage] = useState('lore'); 
  const [parsedList, setParsedList] = useState([]);
  
  // "Write to Survive" States
  const [survivalInput, setSurvivalInput] = useState('');
  const [survivalTimeLeft, setSurvivalTimeLeft] = useState(180); 
  const [survivalTimerStarted, setSurvivalTimerStarted] = useState(false);
  const [survivalCompleted, setSurvivalCompleted] = useState(false);

  // Active Session states
  const [activeTask, setActiveTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1500); 
  const [isRunning, setIsRunning] = useState(false);
  const [sessionSteps, setSessionSteps] = useState([]);
  
  // Active RPG Combat Arena States
  const [enemyName, setEnemyName] = useState('Призрак Прокрастинации');
  const [enemyHp, setEnemyHp] = useState(100);
  const [combatLog, setCombatLog] = useState(['⚔️ Свиток боя развернут. Ожидание атаки...']);
  const [combatVignette, setCombatVignette] = useState('Тьма сгущается над вашим разумом...');
  const [ticksWithoutStep, setTicksWithoutStep] = useState(0); 

  // WOW-эффекты: Всплывающий урон и Вспышки экрана
  const [damageFloats, setDamageFloats] = useState([]);
  const [screenFlash, setScreenFlash] = useState(null);

  // СДВГ-оптимизация интерфейса (предотвращение перегруза кнопками)
  const [actionTab, setActionTab] = useState('spells'); // spells, rest, log

  // Церемония Искупления (Redemption)
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  const [redemptionEulogyText, setRedemptionEulogyText] = useState('');

  // Лагерь Отдыха и Медитация
  const [meditationActive, setMeditationActive] = useState(false);
  const [meditationDuration, setMeditationDuration] = useState(60); 
  const [meditationTimeLeft, setMeditationTimeLeft] = useState(60);
  const [meditationPhase, setMeditationPhase] = useState('inhale'); // inhale (4s), hold-in (4s), exhale (4s), hold-out (4s)
  const [meditationPulseCounter, setMeditationPulseCounter] = useState(0);

  // --- LEGACY LEGEND & WIN CONDITION FUNCTIONS ---

  const handleWinActiveSession = (task) => {
    setIsRunning(false);
    playSuccess();
    
    const isSiege = task?.type === 'siege';
    const expReward = isSiege ? 60 : 25;
    const goldReward = isSiege ? 15 : 5;
    
    setCharacter(prev => {
      const nextXp = prev.xp + expReward;
      const xpNeeded = prev.level * 100;
      let nextLevel = prev.level;
      let remXp = nextXp;
      let extraGold = 0;
      
      if (remXp >= xpNeeded) {
        nextLevel += 1;
        remXp -= xpNeeded;
        extraGold = 15;
        playSuccess();
      }
      
      const earnedGold = goldReward + extraGold;
      
      return {
        ...prev,
        level: nextLevel,
        xp: remXp,
        gold: (prev.gold || 0) + earnedGold,
        hp: nextLevel > prev.level ? prev.maxHp : prev.hp,
        completedTasksCount: (prev.completedTasksCount || 0) + 1,
        completedSiegesCount: (prev.completedSiegesCount || 0) + (isSiege ? 1 : 0),
        totalGoldEarned: (prev.totalGoldEarned || 0) + earnedGold
      };
    });

    if (task) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
    }
    
    localStorage.removeItem('active_task_id');
    localStorage.removeItem('combat_time_left');
    
    alert(`🎉 Сражение завершено! Вы одолели врага ${enemyName}! Получено +${expReward} XP и +${goldReward} Золота.`);

    const willQualify = (character.completedTasksCount || 0) + 1 >= 15 && 
                        (character.completedSiegesCount || 0) + (isSiege ? 1 : 0) >= 3;
    
    if (willQualify) {
      setSetupStage('redemption');
      handleTriggerRedemptionCeremony();
    } else {
      setSetupStage('hub');
    }
  };

  const handleTriggerRedemptionCeremony = async () => {
    if (!generateRedemptionEulogy) return;
    setRedemptionLoading(true);
    setAtmosphereMood('recovery');
    try {
      const text = await generateRedemptionEulogy(character);
      setRedemptionEulogyText(text);
    } catch (err) {
      setRedemptionEulogyText("«Его воля сокрушила прокрастинацию и навеки разогнала Скверну Абаддона...»\n\n(Не удалось соединиться с сервером AI для составления индивидуальной летописи, но духи помнят твой подвиг!)");
    } finally {
      setRedemptionLoading(false);
    }
  };

  const handleEnshrineLegend = () => {
    playSuccess();
    
    const newLegend = {
      name: character.name || "Безымянный Герой",
      race: character.race || "Человек",
      class: character.class || "Воин",
      level: character.level || 1,
      completedTasksCount: character.completedTasksCount || 15,
      completedSiegesCount: character.completedSiegesCount || 3,
      totalGoldEarned: character.totalGoldEarned || 0,
      totalManaSpent: character.totalManaSpent || 0,
      totalHpSacrificed: character.totalHpSacrificed || 0,
      potionsDrunk: character.potionsDrunk || 0,
      meditationsCount: character.meditationsCount || 0,
      pedestalEulogy: redemptionEulogyText || "Его воля спасла Бездну..."
    };

    const updatedPedestals = [...pedestals, newLegend];
    savePedestals(updatedPedestals);

    // Reset character
    setCharacter({
      name: "Изгнанник",
      race: "Каргахаулец",
      class: "Химомансер (Маг крови)",
      level: 1,
      xp: 0,
      hp: 100,
      maxHp: 100,
      mana: 50,
      maxMana: 50,
      gold: 0,
      equipped: { weapon: null, shield: null, armor: null, ring: null },
      inventory: [],
      perks: ["Сгусток крови"],
      shacklesBroken: false,
      intensity: "grim",
      completedTasksCount: 0,
      completedSiegesCount: 0,
      totalGoldEarned: 0,
      totalManaSpent: 0,
      totalHpSacrificed: 0,
      potionsDrunk: 0,
      meditationsCount: 0
    });

    setSetupStage('lore');
    setAtmosphereMood('escape');
  };

  // 1. Persistent Character Check (Skips lore setup if alive!)
  useEffect(() => {
    if (character && character.race && character.class && character.hp > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayTask = tasks.find(t => t.date === todayStr && t.status === 'active' && t.id === localStorage.getItem('active_task_id'));
      
      if (todayTask) {
        setActiveTask(todayTask);
        setTimeLeft(Number(localStorage.getItem('combat_time_left') || todayTask.pomodoroTime * 60));
        setSessionSteps(todayTask.steps || []);
        setSetupStage('active');
        generateCombatEncounter(todayTask);
      } else {
        setSetupStage('hub'); // Directly load Tasks Hub
      }
    }
  }, [character, tasks]);

  // 2. Generate RPG Combat Encounter from 50+ Variations
  const generateCombatEncounter = (task) => {
    let lore = null;
    if (task.combatLore) {
      lore = task.combatLore;
    } else {
      // Hashing algorithm to pick one of the 50 variations strictly
      const hashStr = task.title + (task.id || '');
      let hash = 0;
      for (let i = 0; i < hashStr.length; i++) {
        hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      hash = Math.abs(hash);
      const variation = COMBAT_VARIATIONS[hash % COMBAT_VARIATIONS.length];

      let weakPoints = [
        "Монстр боится правила 5 минут: первый шаг сломает его панцирь.",
        "Враг неповоротлив: начните с самого глупого действия, чтобы войти в слепое пятно."
      ];
      if (task.toxicity === 'scary') {
        weakPoints = [
          "Слабость врага: Боится расщепления. Разбейте первый шаг на микро-физические действия.",
          "Страх отступит: Закройте глаза и сделайте глубокий вдох на 4 секунды."
        ];
      } else if (task.toxicity === 'tedious') {
        weakPoints = [
          "Слабость врага: Не выносит быстрой музыки. Включите Spotify-трек и действуйте на скорость!",
          "Усыпите его бдительность: Согласитесь работать ровно 10 минут, а затем отдохните."
        ];
      } else if (task.toxicity === 'vague') {
        weakPoints = [
          "Слабость врага: Ненавидит конкретику. Дайте четкое письменное Намерение квеста.",
          "Противник ослепнет: Перепишите шаг, указав точное физическое действие в скобках."
        ];
      }

      const events = [
        "Допаминовая Вспышка: Двойной опыт за этот бой!",
        "Густой Туман Бездны скрывает точные значения здоровья противника.",
        "Аура Стойкости: Любой удар по врагу восстанавливает 2 MP маны.",
        "Дыхание Скверны: Время идет чуть быстрее, но враг бьет слабее.",
        "Алтарь Рун: Проведение шага наносит противнику сокрушительный критический урон!"
      ];
      const randomEvent = events[hash % events.length];

      lore = {
        enemyName: `${variation.prefix} ${variation.suffix}`,
        visualType: variation.type,
        weakPoints: weakPoints,
        randomEvent: randomEvent,
        loreDescription: `${variation.desc} Рожден силой ваших мыслей об этой задаче.`
      };
    }

    setEnemyName(lore.enemyName);
    setEnemyHp(100);
    setCombatVignette(`💥 Режим схватки: [${lore.visualType.toUpperCase()}]. ${lore.loreDescription}`);
    setCombatLog([
      `⚔️ Начинается бой! Противник: ${lore.enemyName}.`,
      `📜 Вы зажали в руках оружие своего класса. Ваша цель: уничтожить врага, выполняя шаги квеста!`,
      `👁️ Мысль о слабости врага: "${lore.weakPoints[0]}"`,
      `🌀 Событие поля боя: ${lore.randomEvent}`
    ]);
    setTicksWithoutStep(0);
  };

  // WOW Effect: Trigger Screen Flash
  const triggerFlash = (type) => {
    setScreenFlash(type);
    setTimeout(() => setScreenFlash(null), 450);
  };

  // WOW Effect: Spawn Damage Floater
  const spawnFloater = (text, type) => {
    const id = Date.now() + Math.random();
    setDamageFloats(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setDamageFloats(prev => prev.filter(f => f.id !== id));
    }, 1200);
  };

  // Core random initialization of character
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
      maxMana: 50,
      dailyWorkMinutes: 0
    }));
    setSetupStage('hub');
  };

  // Parse Tasks with AI Tunnel
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
    const todayStr = new Date().toISOString().split('T')[0];
    
    const newTasks = parsedList.map((t, idx) => {
      // Hashing and pre-generating lore profiles for parsed tasks
      const hashStr = t.title + idx;
      let hash = 0;
      for (let i = 0; i < hashStr.length; i++) {
        hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      hash = Math.abs(hash);
      const variation = COMBAT_VARIATIONS[hash % COMBAT_VARIATIONS.length];

      return {
        id: `task-${Date.now()}-${idx}`,
        title: t.title,
        type: t.type || 'hunt',
        status: 'active',
        date: todayStr, 
        pomodoroTime: t.estimatedTime || 25,
        pomodoroSpent: 0,
        toxicity: t.toxicity || 'standard',
        barrierType: null,
        curseLevel: 0,
        steps: t.steps ? t.steps.map((s, sIdx) => ({ id: `step-${sIdx}-${Date.now()}`, title: s, completed: false })) : [],
        intent: t.intent || '',
        combatLore: {
          enemyName: t.enemyName || `${variation.prefix} ${variation.suffix}`,
          visualType: t.visualType || variation.type,
          weakPoints: t.weakPoints || ["Монстр боится разбития на мелкие части.", "Сделайте шаг за 5 минут!"],
          randomEvent: t.randomEvent || "Бой протекает при поддержке Бездны."
        }
      };
    });

    setTasks(prev => [...prev, ...newTasks]);
    const target = newTasks[0] || null;
    setActiveTask(target);
    if (target) {
      setTimeLeft(target.pomodoroTime * 60);
      setSessionSteps(target.steps);
      generateCombatEncounter(target);
      localStorage.setItem('active_task_id', target.id);
      localStorage.setItem('combat_time_left', target.pomodoroTime * 60);
    }

    if (character.shacklesBroken) {
      setSetupStage('active');
      setAtmosphereMood(target?.type === 'siege' ? 'siege' : 'hunt');
      if (playActiveSessionTrack) playActiveSessionTrack(target?.type === 'siege' ? 'siege' : 'hunt');
    } else {
      setSetupStage('crash');
      setAtmosphereMood('escape');
    }
  };

  // "Write to Survive" countdown logic
  useEffect(() => {
    let interval = null;
    if (setupStage === 'crash' && survivalTimerStarted && survivalTimeLeft > 0 && !survivalCompleted) {
      interval = setInterval(() => {
        setSurvivalTimeLeft(prev => prev - 1);
        const heartRate = survivalTimeLeft < 60 ? 120 : survivalTimeLeft < 120 ? 90 : 70;
        startHeartbeat(heartRate);
      }, 1000);
    } else if (survivalTimeLeft === 0) {
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

  // Active Session Focus Timer & Fatigue accumulation & Ticking Combat Damage
  useEffect(() => {
    let timer = null;
    if (setupStage === 'active' && isRunning && timeLeft > 0 && !meditationActive) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const nextTime = prev - 1;
          localStorage.setItem('combat_time_left', nextTime);

          // 1. Fatigue accumulator (caps work daily limits)
          setCharacter(c => {
            const nextMin = (c.dailyWorkMinutes || 0) + (1/60);
            return { ...c, dailyWorkMinutes: nextMin };
          });

          // 2. Active Combat ticking system
          setTicksWithoutStep(t => {
            const nextTicks = t + 1;
            if (nextTicks >= 90) {
              playBoneCrack();
              setCharacter(c => ({ ...c, hp: Math.max(10, c.hp - 5) })); 
              triggerFlash('blood');
              spawnFloater("-5 HP", "enemy-strike");
              setCombatLog(log => [
                `💥 [Враг] ${enemyName} пробивает вашу защиту и заносит удар! Вы теряете 5 HP (когнитивный ресурс).`,
                ...log.slice(0, 5)
              ]);
              return 0; 
            }
            return nextTicks;
          });

          return nextTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleWinActiveSession(activeTask);
    }
    return () => clearInterval(timer);
  }, [setupStage, isRunning, timeLeft, meditationActive]);

  // Timed Meditation Recovery Timer Loop
  useEffect(() => {
    let medInterval = null;
    if (setupStage === 'active' && meditationActive && meditationTimeLeft > 0) {
      medInterval = setInterval(() => {
        setMeditationTimeLeft(prev => {
          const nextSec = prev - 1;
          
          // 1. Ticking Breathing Cycle: Inhale (4s) -> Hold (4s) -> Exhale (4s) -> Hold (4s)
          setMeditationPulseCounter(c => {
            const nextPulse = (c + 1) % 16;
            if (nextPulse < 4) {
              setMeditationPhase('inhale');
            } else if (nextPulse < 8) {
              setMeditationPhase('hold-in');
            } else if (nextPulse < 12) {
              setMeditationPhase('exhale');
            } else {
              setMeditationPhase('hold-out');
            }
            return nextPulse;
          });

          // 2. Recovery Ticks
          setCharacter(hero => {
            const nextHp = Math.min(hero.maxHp, hero.hp + 0.5);
            const nextMp = Math.min(hero.maxMana, hero.mana + 0.35);
            const nextFatigue = Math.max(0, hero.dailyWorkMinutes - 1.5/60);
            return {
              ...hero,
              hp: nextHp,
              mana: nextMp,
              dailyWorkMinutes: nextFatigue
            };
          });

          // Floating indicators every 4 seconds
          if (nextSec % 4 === 0) {
            spawnFloater("+HP восстанавливается", "heal-hp");
            spawnFloater("-1.5мин Усталости", "fatigue-recovery");
          }

          return nextSec;
        });
      }, 1000);
    } else if (meditationTimeLeft === 0 && meditationActive) {
      // Completed meditation chimes
      setMeditationActive(false);
      playSuccess();
      setCharacter(prev => ({
        ...prev,
        meditationsCount: (prev.meditationsCount || 0) + 1
      }));
      alert("Медитация в Лагере завершена! Силы разума полностью очищены от скверны.");
      setAtmosphereMood(activeTask?.type === 'siege' ? 'siege' : 'hunt');
    }
    return () => clearInterval(medInterval);
  }, [meditationActive, meditationTimeLeft]);

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
    
    // Complete active step -> Hero strikes the enemy!
    const step = sessionSteps.find(s => s.id === stepId);
    if (step && !step.completed) {
      playSuccess();
      
      // Calculate damage dealt based on step size
      const dmg = Math.ceil(100 / sessionSteps.length);
      setEnemyHp(prev => {
        const nextHp = Math.max(0, prev - dmg);
        if (nextHp <= 0) {
          setTimeout(() => handleWinActiveSession(activeTask), 100);
        }
        return nextHp;
      });
      triggerFlash('fire');
      spawnFloater(`-${dmg} HP!`, 'hero-damage');
      
      // Write combat log strike
      setCombatLog(log => [
        `⚔️ [Герой] Вы провели успешный шаг («${step.title.split('(')[0].trim()}»)! Вы нанесли ${dmg} урона противнику ${enemyName}!`,
        ...log.slice(0, 5)
      ]);
      
      // Reset enemy tick threat
      setTicksWithoutStep(0);
    }

    const updatedSteps = sessionSteps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s);
    setSessionSteps(updatedSteps);
    if (activeTask) {
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, steps: updatedSteps } : t));
    }
  };

  const handleFlee = () => {
    playClick();
    setIsRunning(false);
    setCharacter(prev => ({ ...prev, hp: Math.max(10, prev.hp - 15) }));
    triggerFlash('shiver');
    if (activeTask) {
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, date: null } : t));
    }
    localStorage.removeItem('active_task_id');
    setSetupStage('hub');
    setAtmosphereMood('quiet_focus');
  };

  const handleExtend = () => {
    playClick();
    setTimeLeft(prev => prev + 600);
    spawnFloater("+10 минут!", "restore-mp");
    setCombatLog(log => [
      `⌛ Вы провели заклинание Времени (+10 минут к таймеру focus-сессии).`,
      ...log.slice(0, 5)
    ]);
  };

  // Instant class skill cast triggers
  const castClassSkill = (skillName, costType, costVal, damage, flashColor) => {
    if (costType === 'mana' && character.mana < costVal) {
      alert("Недостаточно Маны для сотворения этого заклинания!");
      return;
    }
    if (costType === 'hp' && character.hp <= costVal + 10) {
      alert("Слишком опасно! Жертва крови оставит вас без сил.");
      return;
    }

    playBoneCrack();
    triggerFlash(flashColor);
    
    // Deduct cost and update
    setCharacter(hero => {
      const nextHp = costType === 'hp' ? hero.hp - costVal : hero.hp;
      const nextMp = costType === 'mana' ? hero.mana - costVal : hero.mana;
      return { 
        ...hero, 
        hp: nextHp, 
        mana: nextMp,
        totalManaSpent: (hero.totalManaSpent || 0) + (costType === 'mana' ? costVal : 0),
        totalHpSacrificed: (hero.totalHpSacrificed || 0) + (costType === 'hp' ? costVal : 0)
      };
    });

    // Deal damage
    setEnemyHp(prev => {
      const nextHp = Math.max(0, prev - damage);
      if (nextHp <= 0) {
        setTimeout(() => handleWinActiveSession(activeTask), 100);
      }
      return nextHp;
    });
    spawnFloater(`-${damage} HP!`, 'hero-damage');
    
    if (costType === 'hp') {
      spawnFloater(`-${costVal} HP`, 'enemy-strike');
    } else {
      spawnFloater(`-${costVal} MP`, 'restore-mp');
    }

    setCombatLog(log => [
      `✨ Вы применили классовый навык [${skillName}]! Противнику нанесен сокрушительный удар на ${damage} урона!`,
      ...log.slice(0, 5)
    ]);
  };

  // Blood Mage sacrifice completes step instantly
  const handleSacrificeHP = () => {
    if (character.hp <= 15) return;
    playBoneCrack();
    triggerFlash('blood');
    setCharacter(prev => ({ 
      ...prev, 
      hp: prev.hp - 10,
      totalHpSacrificed: (prev.totalHpSacrificed || 0) + 10
    }));
    spawnFloater("-10 HP", "enemy-strike");
    
    const firstIncomplete = sessionSteps.find(s => !s.completed);
    if (firstIncomplete) {
      handleToggleStep(firstIncomplete.id);
    }
  };

  // Timed Rest Meditations Camp initialization
  const startTimedMeditation = (durationSec) => {
    playClick();
    setMeditationDuration(durationSec);
    setMeditationTimeLeft(durationSec);
    setMeditationActive(true);
    setMeditationPulseCounter(0);
    setMeditationPhase('inhale');
    setAtmosphereMood('recovery');
  };

  // Instant Potion recovery (purchased in shop)
  const useStaminaPotion = () => {
    const potionCount = character.inventory?.filter(i => i.id === 'item_potion').length || 0;
    if (potionCount === 0) {
      alert("У вас в рюкзаке нет Зелий Выносливости! Купите их в Лавке Темного Торговца во вкладке Персонажа.");
      return;
    }

    playClick();
    playSuccess();
    triggerFlash('heal');
    
    // Remove one potion and restore HP/Fatigue
    setCharacter(hero => {
      const idx = hero.inventory.findIndex(i => i.id === 'item_potion');
      const newInv = [...hero.inventory];
      if (idx !== -1) newInv.splice(idx, 1);

      const nextHp = Math.min(hero.maxHp, hero.hp + 25);
      const nextFatigue = Math.max(0, hero.dailyWorkMinutes - 60);

      return {
        ...hero,
        hp: nextHp,
        dailyWorkMinutes: nextFatigue,
        inventory: newInv,
        potionsDrunk: (hero.potionsDrunk || 0) + 1
      };
    });

    spawnFloater("+25 HP", "heal-hp");
    spawnFloater("-60мин Усталости", "fatigue-recovery");

    setCombatLog(log => [
      `🧪 Вы выпили Зелье Выносливости! Мгновенно восстановлено 25 HP, а усталость снижена на 60 минут.`,
      ...log.slice(0, 5)
    ]);
  };

  // --- BURNOUT BLOCK OVERLAY (Mandatory Rest Camp Screen) ---
  if (character && character.dailyWorkMinutes >= 300) {
    return (
      <div className="rpg-panel" style={{ maxWidth: '750px', margin: '3rem auto', padding: '2.5rem', border: '3px solid var(--color-blood)', animation: 'pulse-red 3s infinite', textAlign: 'center' }}>
         <Skull size={64} style={{ color: 'var(--color-blood-glow)', marginBottom: '1.5rem' }} />
         <h1 className="gothic-title" style={{ color: 'var(--color-blood-glow)', fontSize: '2.2rem', marginBottom: '1rem' }}>
           Когнитивное Истощение
         </h1>
         <p style={{ lineHeight: '1.7', color: 'var(--color-bone)', fontSize: '1.1rem', marginBottom: '1.5rem', fontFamily: 'Georgia, serif' }}>
           «Скверна Абаддона сковала твой разум. Ты вел ожесточенные сражения и выполнял контракты более 5 часов (300 минут) сегодня. 
           Твоя когнитивная выносливость полностью иссякла. Продолжение боя приведет к выгоранию разума.»
         </p>
         <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
           Вы можете мгновенно восстановить силы с помощью Зелья Выносливости или руны Стойкости, либо запустить дыхательную сессию медитации в Лагере!
         </p>
         
         <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
           <button 
             className="rpg-btn rpg-btn-mana"
             onClick={() => {
               if (character.mana < 20) {
                 alert("Недостаточно Маны для плетения руны Стойкости!");
                 return;
               }
               playSuccess();
               setCharacter(prev => ({ ...prev, mana: prev.mana - 20, dailyWorkMinutes: 0 }));
             }}
             disabled={character.mana < 20}
             style={{ padding: '0.8rem 2rem', fontSize: '0.95rem' }}
           >
             🔮 Руна Стойкости (Сбросить усталость за 20 MP)
           </button>
           
           <button 
             className="rpg-btn"
             onClick={() => {
               playClick();
               setCharacter(prev => ({ ...prev, dailyWorkMinutes: 0 }));
             }}
             style={{ padding: '0.8rem 2rem', fontSize: '0.95rem' }}
           >
             🛡️ Прилив сил (Ручной Оверрайд)
           </button>
         </div>
      </div>
    );
  }

  // --- RENDERING ACTIVE TIMER TIMED REST MEDITATION CAMP OVERLAY ---
  if (meditationActive) {
    const formattedMedTime = formatTime(meditationTimeLeft);
    const progress = ((meditationDuration - meditationTimeLeft) / meditationDuration) * 100;

    return (
      <div className="rest-camp-overlay animate-fade-in">
        {/* Bonfire effect */}
        <div className="bonfire-wrapper">
          <div className="bonfire-flame" />
          <div className="bonfire-logs" />
        </div>

        <h1 className="gothic-title" style={{ fontSize: '2.2rem', color: 'var(--color-relic-glow)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
          🎪 Когнитивный Лагерь Отдыха
        </h1>
        <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.95rem', maxWidth: '550px', textAlign: 'center', lineHeight: '1.4', marginBottom: '1.5rem', fontStyle: 'italic' }}>
          «Позвольте мыслям улечься, а скверне — рассеяться. Синхронизируйте дыхание с биением древнего круга, пока костер восстанавливает вашу силу.»
        </p>

        {/* Breathing Circular Guide */}
        <div className="breathing-circle-container">
          <div className={`breathing-circle ${meditationPhase}`}>
            <span className="breathing-phase-text">
              {meditationPhase === 'inhale' && "Вдох"}
              {meditationPhase === 'hold-in' && "Задержка"}
              {meditationPhase === 'exhale' && "Выдох"}
              {meditationPhase === 'hold-out' && "Задержка"}
            </span>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>
              {meditationPhase === 'inhale' && "Расширяйте легкие"}
              {meditationPhase === 'hold-in' && "Удерживайте фокус"}
              {meditationPhase === 'exhale' && "Отпускайте тревогу"}
              {meditationPhase === 'hold-out' && "Полное расслабление"}
            </span>
          </div>
        </div>

        {/* Remaining meditation time */}
        <div style={{ fontSize: '2rem', fontFamily: 'var(--font-rpg)', color: '#fff', marginBottom: '0.8rem' }}>
          {formattedMedTime}
        </div>

        {/* Recovery progress bar */}
        <div style={{ width: '100%', maxWidth: '400px', height: '8px', background: '#000', border: '1px solid var(--color-iron-light)', borderRadius: '4px', overflow: 'hidden', marginBottom: '2.5rem' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(to right, var(--color-relic-glow), var(--color-mana-glow))', transition: 'width 0.4s' }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="rpg-btn rpg-btn-blood"
            style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
            onClick={() => {
              playClick();
              setMeditationActive(false);
              setAtmosphereMood(activeTask?.type === 'siege' ? 'siege' : 'hunt');
            }}
          >
            🏃 Прервать отдых и вернуться в бой
          </button>
        </div>
      </div>
    );
  }

  // --- STAGES RENDERING ---

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

  // HUB STAGE: "Текущий статус задач" (Tasks daily overview screen instead of forced text dump)
  if (setupStage === 'hub') {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === todayStr && t.status === 'active');
    const potionCount = character.inventory?.filter(i => i.id === 'item_potion').length || 0;

    return (
      <div className="rpg-panel" style={{ maxWidth: '850px', margin: '1rem auto', padding: '2rem' }}>
        {/* Hub Header: Hero card summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--color-iron-light)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="gothic-title" style={{ fontSize: '1.5rem', color: 'var(--color-relic-glow)' }}>
              ⚜️ Военный Штаб Беглеца
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>
              Класс: <b style={{ color: '#fff' }}>{character.class}</b> • Уровень: <b style={{ color: '#fff' }}>{character.level}</b>
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className="rpg-btn" 
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => startTimedMeditation(180)}
            >
              🎪 Войти в Лагерь (Медитация)
            </button>
            <button 
              className="rpg-btn rpg-btn-blood" 
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setSetupStage('input')}
            >
              🔮 Сплести хаос (AI Текстовый дамп)
            </button>
          </div>
        </div>

        {/* Stats Row inside Hub */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px solid var(--color-iron-light)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)' }}>ЗДОРОВЬЕ (Cognitive HP):</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--color-blood-glow)', fontWeight: 'bold', fontFamily: 'var(--font-rpg)' }}>
              ❤️ {Math.round(character.hp)} / {character.maxHp} HP
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px solid var(--color-iron-light)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)' }}>МАНА (Focus MP):</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--color-mana-glow)', fontWeight: 'bold', fontFamily: 'var(--font-rpg)' }}>
              🔮 {Math.round(character.mana)} / {character.maxMana} MP
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px solid var(--color-iron-light)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)' }}>УСТАЛОСТЬ (Fatigue):</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--color-relic-glow)', fontWeight: 'bold', fontFamily: 'var(--font-rpg)' }}>
              ⚡ {Math.floor(character.dailyWorkMinutes || 0)} / 300 мин
            </div>
          </div>
        </div>

        {/* Active daily tasks list (RPG Bounty Contracts) */}
        <h3 className="gothic-title" style={{ fontSize: '1.15rem', color: 'var(--color-bone)', marginBottom: '0.8rem' }}>
          ⚔️ Активные Боевые Контракты на Сегодня:
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {todayTasks.length > 0 ? (
            todayTasks.map(task => {
              // Procedural profile generation for preview
              const hashStr = task.title + task.id;
              let hash = 0;
              for (let i = 0; i < hashStr.length; i++) {
                hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
              }
              const variation = COMBAT_VARIATIONS[Math.abs(hash) % COMBAT_VARIATIONS.length];
              const eName = task.combatLore?.enemyName || `${variation.prefix} ${variation.suffix}`;
              const isBoss = task.type === 'siege';

              return (
                <div 
                  key={task.id} 
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${isBoss ? 'var(--color-blood)' : 'var(--color-iron-light)'}`,
                    borderLeft: `4px solid ${isBoss ? 'var(--color-blood)' : task.type === 'relic' ? 'var(--color-relic)' : 'var(--color-bone)'}`,
                    padding: '1.2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{variation.icon}</span>
                      <h4 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>{task.title}</h4>
                    </div>
                    
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-bone-dim)', marginTop: '4px' }}>
                      Враг: <b style={{ color: 'var(--color-blood-glow)' }}>{eName}</b> ({isBoss ? 'Босс Осады' : 'Существо Охоты'}) 
                      • Время: <b>{task.pomodoroTime} мин</b> • Токсичность: <b>{task.toxicity === 'scary' ? 'Страшная' : task.toxicity === 'tedious' ? 'Скучная' : task.toxicity === 'vague' ? 'Мутная' : 'Обычная'}</b>
                    </div>
                    {task.intent && (
                      <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#8c7d6b', marginTop: '4px' }}>
                        «{task.intent}»
                      </div>
                    )}
                  </div>

                  <button 
                    className="rpg-btn rpg-btn-blood"
                    style={{ padding: '0.6rem 1.8rem', fontSize: '0.9rem' }}
                    onClick={() => {
                      playClick();
                      setActiveTask(task);
                      setTimeLeft(task.pomodoroTime * 60);
                      setSessionSteps(task.steps || []);
                      setSetupStage('active');
                      generateCombatEncounter(task);
                      localStorage.setItem('active_task_id', task.id);
                      localStorage.setItem('combat_time_left', task.pomodoroTime * 60);
                      setAtmosphereMood(task.type === 'siege' ? 'siege' : 'hunt');
                      if (playActiveSessionTrack) playActiveSessionTrack(task.type === 'siege' ? 'siege' : 'hunt');
                    }}
                  >
                    ⚔️ ВСТУПИТЬ В БОЙ
                  </button>
                </div>
              );
            })
          ) : (
            <div style={{ border: '1px dashed var(--color-iron-light)', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <Compass size={32} style={{ color: 'var(--color-iron-light)', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--color-bone-dim)' }}>
                Свиток пуст. На сегодня нет активных контрактов (задач) в ежедневнике.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-iron-light)', marginTop: '4px' }}>
                Вы можете перетащить ваши задачи на сегодняшний день во вкладке <b>Планировщика</b>, либо нажать кнопку <b>«Сплести хаос»</b> выше, чтобы вывалить СДВГ-мысли и разобрать их Бездной!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (setupStage === 'input') {
    return (
      <div className="rpg-panel" style={{ maxWidth: '800px', margin: '1rem auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="gothic-title" style={{ fontSize: '1.5rem', color: 'var(--color-bone)' }}>
            Сплести заклинание Задач
          </h2>
          <button className="rpg-btn" style={{ padding: '2px 10px', fontSize: '0.75rem' }} onClick={() => setSetupStage('hub')}>
            К ВОЕННОМУ ШТАБУ
          </button>
        </div>
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

  // --- ACTIVE SESSION STAGE (RPG COMBAT ARENA WITH DYNAMIC WOW CLASS SKILLS) ---
  if (setupStage === 'active' && activeTask) {
    const isBoss = activeTask.type === 'siege';
    const potionCount = character.inventory?.filter(i => i.id === 'item_potion').length || 0;

    // Stable seed selection of procedural lore details if not pre-configured
    const hashStr = activeTask.title + activeTask.id;
    let hash = 0;
    for (let i = 0; i < hashStr.length; i++) {
      hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    const variation = COMBAT_VARIATIONS[hash % COMBAT_VARIATIONS.length];
    
    // Choose which Weakpoint to render under enemy card based on step completion state
    const currentWeakpoint = activeTask.combatLore?.weakPoints?.[0] || 
      (activeTask.toxicity === 'scary' ? "Монстр боится разбития. Пройдите первый физический микро-шаг!" : 
       activeTask.toxicity === 'tedious' ? "Враг ненавидит скорость. Сделайте один шаг быстро!" : 
       "Враг неповоротлив: начните с самого простого физического шага.");

    return (
      <div className="rpg-panel" style={{ maxWidth: '950px', margin: '0 auto', border: `2px solid ${isBoss ? 'var(--color-blood-glow)' : 'var(--color-iron-light)'}` }}>
        {/* Screen Flash overlays */}
        {screenFlash && <div className={`screen-flash flash-${screenFlash}`} />}

        {isBoss && (
          <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-blood)', color: '#fff', padding: '3px 15px', fontSize: '0.75rem', fontFamily: 'var(--font-rpg)', border: '1px solid var(--color-blood-glow)', zIndex: 10 }}>
            👹 БОСС-БИТВА (ОСАДА)
          </div>
        )}

        {/* Global HUD inside Arena */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-iron-light)', paddingBottom: '0.8rem', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>
            🛡️ Выносливость: <b style={{ color: '#fff' }}>{Math.floor(character.dailyWorkMinutes || 0)} / 300 мин</b>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>
            <span>❤️ Здоровье: <b style={{ color: 'var(--color-blood-glow)' }}>{Math.round(character.hp)} HP</b></span>
            <span>🔮 Мана: <b style={{ color: 'var(--color-mana-glow)' }}>{Math.round(character.mana)} MP</b></span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-blood-glow)' }}>
            🚨 Угроза Скверны: {isRunning ? '⚔️ ИДЕТ СХВАТКА' : '⏸ БЕЗОПАСНЫЙ СОН'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: '1.5rem' }}>
          
          {/* LEFT AREA: Quest Title, Timer, and Steps */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h1 className="gothic-title" style={{ fontSize: '1.6rem', color: isBoss ? 'var(--color-blood-glow)' : '#fff' }}>
                  {activeTask.title}
                </h1>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', fontStyle: 'italic' }}>
                  Сущность: {variation.icon} {variation.type.toUpperCase()} • Оценка: {activeTask.toxicity === 'scary' ? 'Страшная' : 'Стандарт'}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-rpg)', color: isRunning ? '#fff' : 'var(--color-bone-dim)' }}>
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {activeTask.intent && (
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.8rem 1.2rem', borderLeft: '3px solid var(--color-mana)', marginBottom: '1.2rem', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--color-bone)' }}>
                <b>Намерение:</b> «{activeTask.intent}»
              </div>
            )}

            {/* Active Steps deconstruction */}
            <h3 className="rpg-title" style={{ fontSize: '1rem', marginBottom: '0.6rem', color: 'var(--color-bone-dim)' }}>
              🎯 Фазы прорыва к победе:
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
              {sessionSteps.map((step) => (
                <div 
                  key={step.id} 
                  onClick={() => handleToggleStep(step.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    padding: '0.75rem',
                    background: step.completed ? 'rgba(0,0,0,0.25)' : 'var(--color-iron)',
                    border: '1px solid var(--color-iron-light)',
                    textDecoration: step.completed ? 'line-through' : 'none',
                    opacity: step.completed ? 0.45 : 1,
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={step.completed} 
                    onChange={() => {}} 
                    style={{ pointerEvents: 'none' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: step.completed ? 'var(--color-bone-dim)' : '#fff' }}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`rpg-btn ${isRunning ? 'rpg-btn-blood' : 'rpg-btn-mana'}`} 
                style={{ flex: 1, fontSize: '1.1rem', padding: '0.75rem' }} 
                onClick={toggleTimer}
              >
                {isRunning ? "⏸ ПРИОСТАНОВИТЬ БИТВУ" : "⚔ НАЧАТЬ СХВАТКУ"}
              </button>
            </div>
          </div>

          {/* RIGHT AREA: RPG Combat Arena Monster Card & Log & WOW Skills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            
            {/* RPG Floating Damage float container */}
            {damageFloats.length > 0 && (
              <div className="damage-float-container">
                {damageFloats.map(float => (
                  <div key={float.id} className={`damage-float ${float.type}`}>
                    {float.text}
                  </div>
                ))}
              </div>
            )}

            {/* 1. Immersive Gothic Enemy Card */}
            <div className={`gothic-monster-card ${activeTask.curseLevel > 2 ? 'cursed-border' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="monster-sigil">{variation.icon}</span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-bone-dim)', border: '1px solid var(--color-iron-light)' }}>
                  УР. {activeTask.pomodoroTime}
                </span>
              </div>
              
              <h3 className="rpg-title" style={{ fontSize: '1.15rem', color: 'var(--color-blood-glow)', marginBottom: '2px', fontFamily: 'var(--font-gothic)', letterSpacing: '1px' }}>
                {enemyName}
              </h3>
              
              {/* Enemy HP Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px', fontFamily: 'var(--font-rpg)', color: 'var(--color-bone-dim)' }}>
                <span>ЗДОРОВЬЕ ВРАГА:</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{enemyHp}%</span>
              </div>
              <div className="character-bar" style={{ height: '12px', marginBottom: '10px' }}>
                <div 
                  className="character-bar-fill hp" 
                  style={{ width: `${enemyHp}%`, background: 'linear-gradient(to right, #7a1212, #ff2424)', boxShadow: '0 0 10px #ff2424' }} 
                />
              </div>

              {/* Weakness Insight box (ADHD Insights) */}
              <div className="weakness-insight-box">
                <div style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#ffb813', marginBottom: '3px', fontFamily: 'var(--font-rpg)' }}>
                  👁️ МЫСЛИ О СЛАБОСТИ ВРАГА:
                </div>
                {currentWeakpoint}
              </div>
            </div>

            {/* Action Deck Tabs to avoid choice paralysis (ADHD Optimization) */}
            <div style={{ display: 'flex', background: '#0a080c', border: '1px solid var(--color-iron-light)', padding: '2px', gap: '2px', marginTop: '0.5rem' }}>
              <button 
                onClick={() => { playClick(); setActionTab('spells'); }}
                style={{
                  flex: 1, padding: '8px 4px', fontSize: '0.72rem', fontFamily: 'var(--font-rpg)', background: actionTab === 'spells' ? 'var(--color-iron)' : 'none',
                  border: 'none', color: actionTab === 'spells' ? 'var(--color-mana-glow)' : 'var(--color-bone-dim)', borderBottom: actionTab === 'spells' ? '2px solid var(--color-mana)' : 'none', cursor: 'pointer',
                  fontWeight: 'bold', textShadow: actionTab === 'spells' ? '0 0 5px var(--color-mana-glow)' : 'none'
                }}
              >
                🧙 ЗАКЛИНАНИЯ
              </button>
              <button 
                onClick={() => { playClick(); setActionTab('rest'); }}
                style={{
                  flex: 1, padding: '8px 4px', fontSize: '0.72rem', fontFamily: 'var(--font-rpg)', background: actionTab === 'rest' ? 'var(--color-iron)' : 'none',
                  border: 'none', color: actionTab === 'rest' ? 'var(--color-relic-glow)' : 'var(--color-bone-dim)', borderBottom: actionTab === 'rest' ? '2px solid var(--color-relic)' : 'none', cursor: 'pointer',
                  fontWeight: 'bold', textShadow: actionTab === 'rest' ? '0 0 5px var(--color-relic-glow)' : 'none'
                }}
              >
                🎒 СУМКА & ПРИВАЛ
              </button>
              <button 
                onClick={() => { playClick(); setActionTab('log'); }}
                style={{
                  flex: 1, padding: '8px 4px', fontSize: '0.72rem', fontFamily: 'var(--font-rpg)', background: actionTab === 'log' ? 'var(--color-iron)' : 'none',
                  border: 'none', color: actionTab === 'log' ? '#cbbba5' : 'var(--color-bone-dim)', borderBottom: actionTab === 'log' ? '2px solid #4a3e31' : 'none', cursor: 'pointer',
                  fontWeight: 'bold', textShadow: actionTab === 'log' ? '0 0 5px #cbbba5' : 'none'
                }}
              >
                📜 ЖУРНАЛ БОЯ
              </button>
            </div>

            {/* TAB CONTENT: 1. Spells Deck */}
            {actionTab === 'spells' && (
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px solid var(--color-iron-light)', minHeight: '165px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-bone-dim)', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'var(--font-rpg)', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '3px' }}>
                  🧙 Классовые заклинания фокуса:
                </div>
                
                <div className="skill-grid">
                  {/* 1. Fire Mage Skills */}
                  {character.class.includes("огня") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Вспышка страсти", "mana", 10, 25, "fire")}>
                        <span>🔥 Вспышка страсти</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 MP • 25 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Огненный щит", "mana", 8, 15, "stone")}>
                        <span>🛡️ Огненный щит</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 15 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 2. Earth Mage Skills */}
                  {character.class.includes("земли") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Каменное упорство", "mana", 12, 30, "earth")}>
                        <span>🪨 Сдвиг плит</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>12 MP • 30 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Заземление тревоги", "mana", 7, 15, "stone")}>
                        <span>🌾 Заземление</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>7 MP • 15 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 3. Stone Mage Skills */}
                  {character.class.includes("камня") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Нерушимый фокус", "mana", 15, 30, "stone")}>
                        <span>💎 Гранит фокуса</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>15 MP • 30 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Руна защиты", "mana", 6, 12, "stone")}>
                        <span>🛡️ Руна защиты</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>6 MP • 12 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 4. Necromancer Skills */}
                  {character.class.includes("Некромант") && (
                    <>
                      <button className="skill-btn blood" onClick={() => castClassSkill("Договор с костями", "hp", 15, 40, "blood")}>
                        <span>🦴 Договор с костями</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>15 HP • 40 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Призыв слуги", "mana", 10, 20, "lightning")}>
                        <span>👻 Призыв слуги</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 MP • 20 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 5. Rune Mage Skills */}
                  {character.class.includes("Рунный маг") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Начертание рун", "mana", 12, 28, "lightning")}>
                        <span>📜 Начертание рун</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>12 MP • 28 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Магический барьер", "mana", 8, 16, "stone")}>
                        <span>🛡️ Барьер</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 16 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 6. Sword Knight Skills */}
                  {character.class.includes("меча") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Удар по прокрастинации", "mana", 10, 30, "stone")}>
                        <span>⚔️ Тяжелый удар</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 MP • 30 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Закаленная воля", "mana", 8, 18, "stone")}>
                        <span>🛡️ Закаленная воля</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 18 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 7. Blood Mage / Chemomancer Skills */}
                  {character.class.includes("Химомансер") && (
                    <>
                      <button className="skill-btn blood" onClick={handleSacrificeHP}>
                        <span>🩸 Жертва крови</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 HP • Шаг квеста</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Сгущение скверны", "mana", 9, 22, "blood")}>
                        <span>💥 Химо-взрыв</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>9 MP • 22 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 8. Plasmamancer Skills */}
                  {character.class.includes("Плазмомансер") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Разряд молнии", "mana", 15, 45, "lightning")}>
                        <span>⚡ Разряд молнии</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>15 MP • 45 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Плазменный щит", "mana", 8, 20, "lightning")}>
                        <span>🛡️ Плазменный щит</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 20 Урона</span>
                      </button>
                    </>
                  )}

                  {/* Fallback generic skills if none match */}
                  {!character.class.includes("огня") && !character.class.includes("земли") && !character.class.includes("камня") && !character.class.includes("Некромант") && !character.class.includes("Рунный") && !character.class.includes("меча") && !character.class.includes("Химомансер") && !character.class.includes("Плазмомансер") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Ментальный удар", "mana", 8, 18, "lightning")}>
                        <span>🔮 Ментальный удар</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 18 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Рунный барьер", "mana", 6, 12, "stone")}>
                        <span>🛡️ Рунный барьер</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>6 MP • 12 Урона</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. Backpack & Rest & Potions Deck */}
            {actionTab === 'rest' && (
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px solid var(--color-iron-light)', minHeight: '165px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-rpg)', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '3px' }}>
                  🎒 Припасы рюкзака и Отдых:
                </div>
                
                {/* Stamina potion usage */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '6px 10px', border: '1px solid var(--color-iron-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🧪</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 'bold' }}>Зелье Выносливости</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--color-bone-dim)' }}>В рюкзаке: {potionCount} шт</div>
                    </div>
                  </div>
                  <button 
                    className="rpg-btn" 
                    style={{ fontSize: '0.72rem', padding: '3px 8px', borderColor: 'var(--color-mana-glow)' }}
                    onClick={useStaminaPotion}
                    disabled={potionCount === 0}
                  >
                    ВЫПИТЬ
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.3rem', marginTop: 'auto' }}>
                  <button 
                    className="rpg-btn" 
                    style={{ flex: 1, fontSize: '0.75rem', padding: '6px', background: 'rgba(0,0,0,0.5)', borderColor: 'var(--color-relic-glow)' }}
                    onClick={() => startTimedMeditation(180)}
                  >
                    🎪 Войти в Лагерь (3м)
                  </button>
                  <button 
                    className="rpg-btn" 
                    style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }} 
                    onClick={handleExtend}
                  >
                    ⏳ Продлить (+10м)
                  </button>
                </div>

                <button 
                  className="rpg-btn rpg-btn-blood" 
                  style={{ width: '100%', fontSize: '0.75rem', padding: '6px' }} 
                  onClick={handleFlee}
                >
                  🏃 Сбежать с поля боя
                </button>
              </div>
            )}

            {/* TAB CONTENT: 3. Combat History Log */}
            {actionTab === 'log' && (
              <div style={{ 
                background: 'radial-gradient(circle, #1a1613 0%, #0d0b09 100%)', 
                border: '1px solid #4a3e31', 
                padding: '0.8rem', 
                color: '#cbbba5',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '165px'
              }}>
                <h4 style={{ fontSize: '0.75rem', fontFamily: 'var(--font-rpg)', borderBottom: '1px solid #33281e', paddingBottom: '3px', marginBottom: '6px', color: '#c5b59f' }}>
                  📜 СВИТОК БОЕВЫХ СОБЫТИЙ:
                </h4>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem', lineHeight: '1.3' }}>
                  {combatLog.map((log, idx) => (
                    <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '2px' }}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    );
  }

  if (setupStage === 'redemption') {
    return (
      <div className="rpg-panel rest-camp-overlay animate-fade-in" style={{ 
        maxWidth: '800px', 
        margin: '2rem auto', 
        padding: '2.5rem', 
        border: '3px solid #d4af37', 
        borderRadius: '8px', 
        boxShadow: '0 0 35px rgba(212,175,55,0.25)',
        background: 'radial-gradient(circle, #100b05 0%, #000000 100%)',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.4))' }}>☀️</span>
        
        <h1 className="gothic-title" style={{ color: '#ffb813', fontSize: '2.4rem', marginBottom: '0.5rem', letterSpacing: '2px', textShadow: '0 0 10px rgba(212,175,55,0.3)' }}>
          Церемония Великого Искупления
        </h1>
        <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.5', fontStyle: 'italic' }}>
          «Ты с честью выдержал бесконечные испытания, запечатал 15 квестов и одолел 3 Осадных Боссов. 
          Твоя воля спасла этот мир от вечной Скверны прокрастинации.»
        </p>

        {redemptionLoading ? (
          <div style={{ padding: '3rem 0' }}>
            <RefreshCw className="heartbeat-pulse fast" style={{ color: '#ffb813', marginBottom: '1rem' }} size={40} />
            <p style={{ fontFamily: 'var(--font-rpg)', fontSize: '1.1rem', color: '#ffb813' }}>
              Летописец Бездны расшифровывает летопись твоего разума...
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ 
              background: 'radial-gradient(circle, #1e1812 0%, #0e0a07 100%)', 
              border: '2px solid #8c6a2c', 
              borderRadius: '4px',
              padding: '1.8rem', 
              maxWidth: '650px',
              width: '100%',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 25px rgba(0,0,0,0.6)',
              color: '#cbbba5',
              textAlign: 'justify'
            }}>
              <h3 className="rpg-title" style={{ fontSize: '1rem', borderBottom: '1px solid #4a381c', paddingBottom: '5px', marginBottom: '1rem', color: '#ffb813', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                📜 Вечная Хроника: {character.name}
              </h3>
              
              <div style={{ fontSize: '0.85rem', lineHeight: '1.6', fontFamily: 'Georgia, serif', whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
                {redemptionEulogyText}
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '0.5rem', 
                fontSize: '0.75rem', 
                background: 'rgba(0,0,0,0.4)', 
                padding: '10px', 
                border: '1px solid #4a381c',
                color: 'var(--color-bone-dim)',
                textAlign: 'left'
              }}>
                <div>🏹 Квестов: <b style={{ color: '#fff' }}>{character.completedTasksCount || 0}</b></div>
                <div>👹 Боссов: <b style={{ color: '#fff' }}>{character.completedSiegesCount || 0}</b></div>
                <div>🪙 Золото: <b style={{ color: '#ffb813' }}>{character.totalGoldEarned || 0}</b></div>
                <div>🔮 MP потрачено: <b style={{ color: 'var(--color-mana-glow)' }}>{character.totalManaSpent || 0}</b></div>
                <div>🧪 Выпито зелий: <b style={{ color: 'var(--color-relic-glow)' }}>{character.potionsDrunk || 0}</b></div>
                <div>🎪 Медитаций: <b style={{ color: '#fff' }}>{character.meditationsCount || 0}</b></div>
                <div style={{ gridColumn: 'span 3', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px', marginTop: '4px' }}>
                  🩸 Жертва HP здоровья разума: <b style={{ color: 'var(--color-blood-glow)' }}>{character.totalHpSacrificed || 0} HP</b>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                className="rpg-btn" 
                style={{ padding: '0.8rem 2rem' }}
                onClick={() => {
                  playClick();
                  setSetupStage('hub');
                }}
              >
                Вернуться в штаб
              </button>
              
              <button 
                className="rpg-btn rpg-btn-mana heartbeat-pulse"
                style={{ 
                  padding: '0.8rem 3rem', 
                  fontSize: '1rem', 
                  borderColor: '#d4af37', 
                  color: '#ffd700', 
                  boxShadow: '0 0 25px rgba(212,175,55,0.5)',
                  fontWeight: 'bold'
                }}
                onClick={handleEnshrineLegend}
              >
                ☀️ УВЕКОВЕЧИТЬ В ЗАЛЕ СЛАВЫ
              </button>
            </div>
          </div>
        )}
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
