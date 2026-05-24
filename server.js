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

const DEFAULT_CHARACTER = {
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
  equipped: {
    weapon: null,
    shield: null,
    armor: null,
    ring: null
  },
  inventory: [],
  perks: ["Сгусток крови"],
  shacklesBroken: false,
  intensity: "grim", // grim, soft_grim, quiet_focus
  returnAnchor: "",
  barrierType: null
};

if (!fs.existsSync(CHARACTER_FILE)) {
  fs.writeFileSync(CHARACTER_FILE, JSON.stringify(DEFAULT_CHARACTER, null, 2));
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

// 3. AI Proxy Endpoint
app.post('/api/ai/complete', async (req, res) => {
  const { messages } = req.body;
  const API_KEY = process.env.AI_TUNNEL_KEY || 'your_sk_aitunnel_key_here';
  const BASE_URL = 'https://api.aitunnel.ru/v1/chat/completions';

  if (!process.env.AI_TUNNEL_KEY) {
    console.warn("⚠️ Warning: AI_TUNNEL_KEY environment variable is missing. Falling back to default credential.");
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
