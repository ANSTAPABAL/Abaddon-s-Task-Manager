import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Ensure the local data directory and files exist
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const CHARACTER_FILE = path.join(DATA_DIR, 'character.json');
const PEDESTALS_FILE = path.join(DATA_DIR, 'pedestals.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(TASKS_FILE)) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(PEDESTALS_FILE)) {
  fs.writeFileSync(PEDESTALS_FILE, JSON.stringify([], null, 2));
}

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
    race = "Каргахаулец (Бледный гигант)"; // 5% chance! Very rare!
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
      "Мятежник Изгоев (Бандит)", "Головорез Чумных Земель (Бандит)",
      "Каратель Багрового Ордена", "Храмовник Пепла"
    ];
    chosenClass = commons[Math.floor(Math.random() * commons.length)];
  } else if (classRoll < 90) {
    // Rare Classes (30% total)
    const rares = [
      "Маг огня и камня (Мультикласс)", "Маг молнии и земли (Мультикласс)",
      "Некромант", "Рунный маг", "Маг света", "Маг тьмы", "Маг бездны",
      "Маг меток (Сфрагист) [РЕДКОЕ]"
    ];
    chosenClass = rares[Math.floor(Math.random() * rares.length)];
  } else if (classRoll < 97) {
    // Epic / Very Rare Class (7% total)
    chosenClass = "Химомансер (Маг крови) [РЕДКОЕ]";
  } else {
    // Legendary / Ultra-Rare Classes (3% total)
    const legendaries = [
      "Ментальный Суверен (Телекинетик) [УЛЬТРА-РЕДКОЕ]",
      "Плазмомансер (Эфирный ткач) [УЛЬТРА-РЕДКОЕ]"
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
  const filePath = path.join(__dirname, 'The Perfect Being|Fear and Hunger Atmospheric Playlist.mp3');
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
