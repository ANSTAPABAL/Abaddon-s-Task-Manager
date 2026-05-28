import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn("Failed to set custom DNS servers:", e.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[Server Log] ${req.method} ${req.url}`);
  next();
});

// Ensure the local data directory and files exist
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const CHARACTER_FILE = path.join(DATA_DIR, 'character.json');
const PEDESTALS_FILE = path.join(DATA_DIR, 'pedestals.json');
const SESSION_FILE = path.join(DATA_DIR, 'active_session.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(TASKS_FILE)) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(PEDESTALS_FILE)) {
  fs.writeFileSync(PEDESTALS_FILE, JSON.stringify([], null, 2));
}

const DEFAULT_SESSION = {
  combat: {
    activeTask: null,
    timeLeft: 0,
    isRunning: false,
    enemyHp: 100,
    combatLog: [],
    enemyName: "",
    combatVignette: "",
    setupStage: "hub",
    deadlineDmgApplied: false,
    ticksWithoutStep: 0
  },
  ritual: {
    ritualTimerActive: false,
    ritualTimeLeft: 0,
    ritualTimeTotal: 600,
    ritualUnit: "minutes",
    ritualValue: 10,
    ritualFinished: false,
    ritualBlessingText: ""
  },
  hunt: {
    huntIsRunning: false,
    huntIsBreak: false,
    huntMode: "pomodoro",
    huntBreakInterval: 30,
    huntTimerValue: 1800,
    huntTimeSpent: 0,
    huntTimeTotal: 0,
    huntBreakTimeLeft: 1800,
    huntLastBreakCheckpoint: 0,
    huntBreakEvent: null,
    huntPayoutActive: false
  },
  lastTickTimestamp: 0
};

if (!fs.existsSync(SESSION_FILE)) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(DEFAULT_SESSION, null, 2));
}

let activeSession = DEFAULT_SESSION;
try {
  activeSession = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
} catch (e) {
  activeSession = DEFAULT_SESSION;
}

const classes = [
  "Маг огня", "Маг земли", "Маг камня", "Маг молнии",
  "Маг огня и камня", "Маг молнии и земли",
  "Некромант", "Рунный маг", "Маг света", "Маг тьмы", "Маг бездны",
  "Дикий Рыцарь", "Наемник Военной Банды", "Бывший Рыцарь", "Рыцарь-Убийца",
  "Рыцарь Чумной Стали", "Отреченный Паладин",
  "Мятежник Изгоев", "Головорез Чумных Земель",
  "Каратель Багрового Ордена", "Храмовник Пепла",
  "Маг меток",
  "Химомансер",
  "Ментальный Суверен",
  "Плазмомансер"
];

const races = ["Человек", "Эльф", "Нежить", "Тролль", "Каргахаулец"];

const startingPerks = {
  "Маг огня": ["Огненный щит", "Вспышка страсти"],
  "Маг земли": ["Каменное упорство", "Заземление тревоги"],
  "Маг камня": ["Руна защиты", "Нерушимый фокус"],
  "Маг молнии": ["Грозовой разряд", "Цепная молния"],
  "Маг огня и камня": ["Лавовая струя", "Метеоритный барьер"],
  "Маг молнии и земли": ["Грозовой щит", "Сейсмический шок"],
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
  "Мятежник Изгоев": ["Нож в спину", "Коварная уловка"],
  "Головорез Чумных Земель": ["Чумной клинок", "Грабёж допамина"],
  "Каратель Багрового Ордена": ["Багровый допрос", "Священная плеть"],
  "Храмовник Пепла": ["Карающий пепел", "Завеса пепла"],
  "Маг меток": ["Метка слабости", "Печать отсечения"],
  "Химомансер": ["Жертва крови", "Сгущение скверны"],
  "Ментальный Суверен": ["Телекинетический щит", "Подчинение воли", "Голос принуждения"],
  "Плазмомансер": ["Клинки эфира", "Искажение пространства"]
};

function getRandomStartingCharacter() {
  // 1. Roll Race
  const raceRoll = Math.random() * 100;
  let race = "";
  if (raceRoll < 35) {
    race = "Человек";
  } else if (raceRoll < 55) {
    race = "Нежить";
  } else if (raceRoll < 75) {
    race = "Эльф";
  } else if (raceRoll < 95) {
    race = "Тролль";
  } else {
    race = "Каргахаулец"; // 5% chance! Very rare!
  }

  // 2. Roll Class
  const classRoll = Math.random() * 100;
  let chosenClass = "";
  
  if (classRoll < 60) {
    // Common Classes (60% total)
    const commons = [
      "Маг огня", "Маг земли", "Маг камня", "Маг молнии",
      "Дикий Рыцарь", "Наемник Военной Банды", "Бывший Рыцарь",
      "Рыцарь-Убийца", "Рыцарь Чумной Стали", "Отреченный Паладин",
      "Мятежник Изгоев", "Головорез Чумных Земель",
      "Каратель Багрового Ордена", "Храмовник Пепла"
    ];
    chosenClass = commons[Math.floor(Math.random() * commons.length)];
  } else if (classRoll < 90) {
    // Rare Classes (30% total)
    const rares = [
      "Маг огня и камня", "Маг молнии и земли",
      "Некромант", "Рунный маг", "Маг света", "Маг тьмы", "Маг бездны",
      "Маг меток"
    ];
    chosenClass = rares[Math.floor(Math.random() * rares.length)];
  } else if (classRoll < 97) {
    // Epic / Very Rare Class (7% total)
    chosenClass = "Химомансер";
  } else {
    // Legendary / Ultra-Rare Classes (3% total)
    const legendaries = [
      "Ментальный Суверен",
      "Плазмомансер"
    ];
    chosenClass = legendaries[Math.floor(Math.random() * legendaries.length)];
  }

  const startBio = `Родился под знаком Бездны как ${race} (${chosenClass}). Ступил на путь когнитивного искупления в Абаддоне.`;

  return {
    name: "Изгнанник",
    race: race,
    class: chosenClass,
    level: 1,
    xp: 0,
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50,
    gold: 0,
    equipped: {
      weapon: null,
      shield: null,
      armor: null,
      ring: null
    },
    inventory: [],
    perks: startingPerks[chosenClass] || ["Случайная стойкость"],
    shacklesBroken: false,
    intensity: "grim",
    returnAnchor: "",
    barrierType: null,
    biography: [startBio]
  };
}

if (!fs.existsSync(CHARACTER_FILE)) {
  fs.writeFileSync(CHARACTER_FILE, JSON.stringify(getRandomStartingCharacter(), null, 2));
}

// 1. Task API Endpoints
app.get('/api/tasks', (req, res) => {
  try {
    const data = fs.readFileSync(TASKS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: "Failed to load tasks database" });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const tasks = req.body;
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
    res.json({ success: true, count: tasks.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to save tasks database" });
  }
});

// 2. Character API Endpoints
app.get('/api/character', (req, res) => {
  try {
    const data = fs.readFileSync(CHARACTER_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: "Failed to load character stats" });
  }
});

app.post('/api/character', (req, res) => {
  try {
    const character = req.body;
    fs.writeFileSync(CHARACTER_FILE, JSON.stringify(character, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save character stats" });
  }
});

// 2.5. Pedestals Hall API Endpoints
app.get('/api/pedestals', (req, res) => {
  try {
    const data = fs.readFileSync(PEDESTALS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: "Failed to load pedestals list" });
  }
});

app.post('/api/pedestals', (req, res) => {
  try {
    const pedestals = req.body;
    fs.writeFileSync(PEDESTALS_FILE, JSON.stringify(pedestals, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save pedestals list" });
  }
});

// 2.7. Env Configuration API Endpoints
app.get('/api/env-config', (req, res) => {
  try {
    const API_KEY = process.env.AI_TUNNEL_KEY;
    const hasKey = !!API_KEY && API_KEY.trim() !== '' && API_KEY !== 'placeholder_key_here';
    res.json({
      configured: hasKey,
      key: hasKey ? `${API_KEY.slice(0, 6)}...` : '',
      port: process.env.PORT || 3001
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to read env status" });
  }
});

app.post('/api/env-config', (req, res) => {
  try {
    const { apiKey, port } = req.body;
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    } else {
      envContent = '# Abaddon Focus Vessel Local Configuration\n';
    }

    // Set/replace AI_TUNNEL_KEY
    if (apiKey !== undefined) {
      if (envContent.includes('AI_TUNNEL_KEY=')) {
        envContent = envContent.replace(/AI_TUNNEL_KEY=[^\r\n]*/, `AI_TUNNEL_KEY=${apiKey.trim()}`);
      } else {
        envContent += `\nAI_TUNNEL_KEY=${apiKey.trim()}\n`;
      }
      process.env.AI_TUNNEL_KEY = apiKey.trim();
    }

    // Set/replace PORT
    if (port !== undefined) {
      if (envContent.includes('PORT=')) {
        envContent = envContent.replace(/PORT=[^\r\n]*/, `PORT=${port}`);
      } else {
        envContent += `\nPORT=${port}\n`;
      }
      process.env.PORT = port;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    res.json({ success: true, message: "Environment configuration saved and applied." });
  } catch (error) {
    res.status(500).json({ error: "Failed to write env configuration: " + error.message });
  }
});

// 3. AI Proxy Endpoint
app.post('/api/ai/complete', async (req, res) => {
  const { messages } = req.body;
  const API_KEY = process.env.AI_TUNNEL_KEY;
  const BASE_URL = 'https://api.aitunnel.ru/v1/chat/completions';

  if (!API_KEY) {
    console.warn("⚠️ Warning: AI_TUNNEL_KEY environment variable is missing.");
  }

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v4-flash',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Tunnel Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("AI Complete Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve races portraits folder statically
app.use('/races', express.static(path.join(__dirname, 'races')));

// Serve local atmospheric MP3 files
app.get('/tracks/fear_and_hunger.mp3', (req, res) => {
  const filePath = path.join(__dirname, 'The Perfect Being｜Fear and Hunger Atmospheric Playlist.mp3');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Fear and Hunger track not found in root directory');
  }
});

app.get('/tracks/brown_noise.mp3', (req, res) => {
  const filePath = path.join(__dirname, 'Sonic_Wellness_Journey__Super_Deep_Brown_Noise_Spectrum_For_Focus.mp3');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Brown Noise track not found in root directory');
  }
});

app.get('/api/active-session', (req, res) => {
  try {
    res.json(activeSession);
  } catch (error) {
    res.status(500).json({ error: "Failed to load active session" });
  }
});

app.post('/api/active-session', (req, res) => {
  try {
    activeSession = {
      ...activeSession,
      ...req.body,
      combat: { ...activeSession.combat, ...req.body.combat },
      ritual: { ...activeSession.ritual, ...req.body.ritual },
      hunt: { ...activeSession.hunt, ...req.body.hunt }
    };
    activeSession.lastTickTimestamp = Date.now();
    fs.writeFileSync(SESSION_FILE, JSON.stringify(activeSession, null, 2));
    res.json(activeSession);
  } catch (error) {
    res.status(500).json({ error: "Failed to save active session: " + error.message });
  }
});

const ABERCROMBIE_BREAK_EVENTS = [
  {
    title: "Схватка за сухарь",
    story: "Вы присели на замшелый ствол дерева, чтобы перевести дух, как вдруг из кустов вылетел ободранный налетчик Бездны с ржавым тесаком. Схватка была короткой и грязной — вы ткнули его коленом в пах и перерубили горло. Зато в его карманах обнаружилась краюха подсохшего сыра."
  },
  {
    title: "Шепот в тумане",
    story: "Пока вы отдыхали у костерка, туман сгустился до плотности дегтя. Из темноты раздался глумливый голос Инквизитора Забвения: «Ты можешь отдохнуть, изгнанник... но долг все равно найдет тебя». Вы бросили в темноту тяжелый камень. Раздался глухой стук и отборная брань. Кажется, вы попали ему в лоб."
  },
  {
    title: "Спасение бродячего гоблина",
    story: "Вы наткнулись на гоблина-торговца, которого завалило упавшей костяной повозкой. Кряхтя и проклиная все на свете, вы навалились плечом и приподняли колесо. Гоблин выскользнул, низко поклонился, пробормотал: «Да пребудет с тобой благословение сундука!» и дал вам медную монетку."
  },
  {
    title: "Философия Кольца",
    story: "Вы сидели и тупо смотрели на ржавое кольцо на своем пальце. Вдруг оно тихо зашептало: «Знаешь, почему мы в Бездне? Потому что мы вечно откладывали великие дела ради мелких обид». Вы стряхнули пыль с кольца. Оно замолчало, но осадок остался."
  },
  {
    title: "Теплая стоянка Ищеек",
    story: "Вы наткнулись на заброшенный лагерь Ищеек Севера. Угли еще тлели. Вы подбросили сухих веток, погрели руки и нашли забытый кем-то кинжал с гравировкой: «Делай то, что должно, и будь что будет». Ваши раны затянулись от тепла."
  },
  {
    title: "Встреча со старым калекой",
    story: "Пожилой солдат с одной ногой сидел у обочины и пытался заточить тупой меч. Вы молча забрали у него точильный брусок и за пять минут помогли довести лезвие до идеального блеска. Старик кивнул: «В бою тупое оружие убивает владельца. В работе — тупые мысли»."
  },
  {
    title: "Когнитивный мираж",
    story: "Перед вашими глазами на мгновение возник величественный образ Цитадели Искупления, но стоило вам моргнуть, как он рассыпался облаком пепла. Вы поняли, что единственный путь туда — это продолжать копать землю шаг за шагом."
  },
  {
    title: "Бешеная барсучья ярость",
    story: "На вас напал бешеный барсук Бездны, светящийся ядовитой слизью. Пришлось спасаться бегством на дерево. Барсук яростно грыз кору, а вы сидели на ветке и дышали свежим воздухом. Разминка удалась."
  }
];

setInterval(() => {
  try {
    const now = Date.now();
    if (!activeSession.lastTickTimestamp) {
      activeSession.lastTickTimestamp = now;
      return;
    }

    const elapsedSeconds = Math.max(0, Math.floor((now - activeSession.lastTickTimestamp) / 1000));
    activeSession.lastTickTimestamp = now;

    if (elapsedSeconds === 0) return;

    let sessionChanged = false;
    let characterChanged = false;
    let character = null;

    if (fs.existsSync(CHARACTER_FILE)) {
      try {
        character = JSON.parse(fs.readFileSync(CHARACTER_FILE, 'utf8'));
      } catch (err) {
        // ignore
      }
    }

    // 1. Tick Combat
    if (activeSession.combat && activeSession.combat.isRunning && activeSession.combat.setupStage === 'active') {
      activeSession.combat.timeLeft = Math.max(-3600, activeSession.combat.timeLeft - elapsedSeconds);
      sessionChanged = true;

      // Accumulate work fatigue
      if (character) {
        character.dailyWorkMinutes = (character.dailyWorkMinutes || 0) + (elapsedSeconds / 60);
        characterChanged = true;
      }

      // Check deadline expired damage
      if (activeSession.combat.timeLeft <= 0 && !activeSession.combat.deadlineDmgApplied) {
        activeSession.combat.deadlineDmgApplied = true;
        
        if (character) {
          const prevHp = character.hp;
          character.hp = Math.max(10, character.hp - 15);
          characterChanged = true;

          activeSession.combat.combatLog = [
            `💥 [Дедлайн] Время истекло! Противник ${activeSession.combat.enemyName || 'враг'} нанес сокрушительный удар на 15 HP за опоздание!`,
            ...(activeSession.combat.combatLog || [])
          ].slice(0, 8);

          // Handle Character Death
          if (character.hp <= 10 && prevHp > 10) {
            const nextChar = getRandomStartingCharacter();
            nextChar.intensity = character.intensity || "grim";
            
            // Save to pedestals
            if (fs.existsSync(PEDESTALS_FILE)) {
              try {
                const pedestals = JSON.parse(fs.readFileSync(PEDESTALS_FILE, 'utf8')) || [];
                const newLegend = {
                  name: character.name || "Безымянный Падший",
                  nickname: character.nickname || "Первый Изгнанник",
                  race: character.race || "Человек",
                  class: character.class || "Воин",
                  level: character.level || 1,
                  completedTasksCount: character.completedTasksCount || 0,
                  completedSiegesCount: character.completedSiegesCount || 0,
                  totalGoldEarned: character.totalGoldEarned || 0,
                  totalManaSpent: character.totalManaSpent || 0,
                  totalHpSacrificed: character.totalHpSacrificed || 0,
                  potionsDrunk: character.potionsDrunk || 0,
                  meditationsCount: character.meditationsCount || 0,
                  legacyStatus: 'stained',
                  pedestalEulogy: "Его когнитивные силы иссякли, разум сдался Бездне..."
                };
                pedestals.push(newLegend);
                fs.writeFileSync(PEDESTALS_FILE, JSON.stringify(pedestals, null, 2));
              } catch (pedErr) {
                console.error("Failed to add stained pedestal", pedErr);
              }
            }

            // Convert active tasks to corpses
            if (fs.existsSync(TASKS_FILE)) {
              try {
                const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
                const updatedTasks = tasks.map(t => {
                  if (t.status === 'active') {
                    return {
                      ...t,
                      type: 'corpse',
                      curseLevel: Math.min(5, (t.curseLevel || 0) + 1)
                    };
                  }
                  return t;
                });
                fs.writeFileSync(TASKS_FILE, JSON.stringify(updatedTasks, null, 2));
              } catch (taskErr) {
                console.error("Failed to convert tasks to corpses", taskErr);
              }
            }

            character = nextChar;
            activeSession.combat = {
              activeTask: null,
              timeLeft: 0,
              isRunning: false,
              enemyHp: 100,
              combatLog: [],
              enemyName: "",
              combatVignette: "",
              setupStage: "lore",
              deadlineDmgApplied: false,
              ticksWithoutStep: 0
            };
          }
        }
      }
    }

    // 2. Tick Ritual Focus
    if (activeSession.ritual && activeSession.ritual.ritualTimerActive) {
      activeSession.ritual.ritualTimeLeft = Math.max(0, activeSession.ritual.ritualTimeLeft - elapsedSeconds);
      sessionChanged = true;

      if (activeSession.ritual.ritualTimeLeft <= 0) {
        activeSession.ritual.ritualTimerActive = false;
        activeSession.ritual.ritualFinished = true;

        if (character) {
          const spentMinutes = Math.ceil(activeSession.ritual.ritualTimeTotal / 60);
          character.dailyWorkMinutes = (character.dailyWorkMinutes || 0) + spentMinutes;
          characterChanged = true;
        }

        activeSession.ritual.ritualBlessingText = `«Твоя стойкость и прилежная работа завершена. Отмечено в Летописях Судьбы: +${Math.ceil(activeSession.ritual.ritualTimeTotal / 60)} мин. Ступай вперед!»`;
      }
    }

    // 3. Tick Hunt
    if (activeSession.hunt && activeSession.hunt.huntIsRunning) {
      sessionChanged = true;
      if (activeSession.hunt.huntIsBreak) {
        if (activeSession.hunt.huntBreakTimeLeft > 0) {
          activeSession.hunt.huntBreakTimeLeft = Math.max(0, activeSession.hunt.huntBreakTimeLeft - elapsedSeconds);
          activeSession.hunt.huntTimeTotal += elapsedSeconds;
        } else {
          // End break
          activeSession.hunt.huntIsBreak = false;
          activeSession.hunt.huntBreakEvent = null;
          if (activeSession.hunt.huntMode === 'pomodoro') {
            const remainingWorkSecs = (activeSession.hunt.huntBreakInterval * 60) - activeSession.hunt.huntTimeSpent;
            activeSession.hunt.huntTimerValue = Math.min(30 * 60, Math.max(0, remainingWorkSecs));
          }
        }
      } else {
        activeSession.hunt.huntTimeSpent += elapsedSeconds;
        activeSession.hunt.huntTimeTotal += elapsedSeconds;

        if (character) {
          character.dailyWorkMinutes = (character.dailyWorkMinutes || 0) + (elapsedSeconds / 60);
          characterChanged = true;
        }

        if (activeSession.hunt.huntTimeSpent >= activeSession.hunt.huntBreakInterval * 60) {
          activeSession.hunt.huntIsRunning = false;
          activeSession.hunt.huntPayoutActive = true;
        } else if (activeSession.hunt.huntMode === 'pomodoro') {
          if (activeSession.hunt.huntTimerValue > 0) {
            activeSession.hunt.huntTimerValue = Math.max(0, activeSession.hunt.huntTimerValue - elapsedSeconds);
            if (activeSession.hunt.huntTimerValue <= 0 && activeSession.hunt.huntTimeSpent < activeSession.hunt.huntBreakInterval * 60) {
              // Trigger Break
              activeSession.hunt.huntIsBreak = true;
              activeSession.hunt.huntBreakTimeLeft = 1800;
              activeSession.hunt.huntLastBreakCheckpoint = activeSession.hunt.huntTimeSpent;

              const xpReward = Math.random() < 0.5 ? 5 : 10;
              if (character) {
                character.xp += xpReward;
                const needed = character.level * 100;
                if (character.xp >= needed) {
                  character.level += 1;
                  character.xp -= needed;
                }
                characterChanged = true;
              }

              const randomEvent = ABERCROMBIE_BREAK_EVENTS[Math.floor(Math.random() * ABERCROMBIE_BREAK_EVENTS.length)];
              activeSession.hunt.huntBreakEvent = {
                xp: xpReward,
                story: randomEvent.story,
                title: randomEvent.title
              };
            }
          }
        } else if (activeSession.hunt.stopwatch) {
          const diff = activeSession.hunt.huntTimeSpent - activeSession.hunt.huntLastBreakCheckpoint;
          if (diff >= 30 * 60) {
            // Trigger Break
            activeSession.hunt.huntIsBreak = true;
            activeSession.hunt.huntBreakTimeLeft = 1800;
            activeSession.hunt.huntLastBreakCheckpoint = activeSession.hunt.huntTimeSpent;

            const xpReward = Math.random() < 0.5 ? 5 : 10;
            if (character) {
              character.xp += xpReward;
              const needed = character.level * 100;
              if (character.xp >= needed) {
                character.level += 1;
                character.xp -= needed;
              }
              characterChanged = true;
            }

            const randomEvent = ABERCROMBIE_BREAK_EVENTS[Math.floor(Math.random() * ABERCROMBIE_BREAK_EVENTS.length)];
            activeSession.hunt.huntBreakEvent = {
              xp: xpReward,
              story: randomEvent.story,
              title: randomEvent.title
            };
          }
        }
      }
    }

    if (characterChanged && character) {
      fs.writeFileSync(CHARACTER_FILE, JSON.stringify(character, null, 2));
    }

    if (sessionChanged) {
      fs.writeFileSync(SESSION_FILE, JSON.stringify(activeSession, null, 2));
    }
  } catch (loopErr) {
    console.error("Error in server tick loop: ", loopErr);
  }
}, 1000);

// Serve frontend build static files in production
const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*splat', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Abaddon local server running at http://localhost:${PORT}`);
});
