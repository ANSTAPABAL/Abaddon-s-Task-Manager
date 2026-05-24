import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import CarriageSession from './components/CarriageSession';
import CharacterSheet from './components/CharacterSheet';
import TweekPlanner from './components/TweekPlanner';
import SpotifyPlayer from './components/SpotifyPlayer';
import RecoveryScreen from './components/RecoveryScreen';
import { useAudio } from './hooks/useAudio';

export default function App() {
  const { initAudio, setAtmosphereMood, playClick } = useAudio();
  
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
    intensity: "grim" // grim, soft_grim, quiet_focus
  });

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

  // --- LOCAL BACKEND JSON PERSISTENCE & LOAD ---
  
  useEffect(() => {
    // 1. Load tasks from local server
    fetch('http://localhost:3001/api/tasks')
      .then(res => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      })
      .then(data => setTasks(data))
      .catch(err => console.warn("Using in-memory tasks (Backend server offline)"));

    // 2. Load character stats
    fetch('http://localhost:3001/api/character')
      .then(res => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      })
      .then(data => setCharacter(data))
      .catch(err => console.warn("Using in-memory character (Backend server offline)"));
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

  // --- DEEPSEEK CORE INTEGRATIONS (AI TUNNEL) ---

  const parseMessyTasks = async (textBlob) => {
    const systemPrompt = `Ты — Бездна во вселенной Абаддона. Твоя задача — взять хаотичные мысли СДВГ-пользователя и превратить их в структурированный JSON-массив задач, оформленных как квесты из мрачной RPG.

Геймифицируй каждую задачу! Свяжи её с одной из 50+ ролевых вариаций борьбы:
- Драки/Схватки/Потасовки: Засада каргахаульских мародеров, Схватка с костяным големом, Дуэль с паладином Света, Нападение гарпий Ndravna, Бой с болотным химо-слизнем, Потасовка с пьяным троллем, Атака гончих Бездны, Босс: Инквизитор Забвения, Сражение с некро-паразитом, Босс: Некро-Паук Хаоса, Схватка с железным рыцарем, Дуэль на мосту Вздохов, Стычка с темным культистом, Сражение с плазменным элементалем, Охота на слепого пожирателя, Босс: Призрак Прокрастинации.
- Ритуалы/Заклятья/Руны: Снятие скверны соляного завеса, Ритуал кровавого пакта, Расшифровка руны забвения, Начертание защитного рунного круга, Сжигание архивов Скверны, Изгнание когнитивного демона, Призыв слуги смерти, Пленение духа сомнений, Заклятие плазменного щита, Ритуал искупления грехов, Активация алтаря костей.
- Погони/Побеги: Побег от каргахаульского конвоя, Погоня на костяных колесницах, Ускользание от гончих света, Прорыв сквозь огненный шторм, Побег из цитадели инквизиции, Вылазка из окружения, Преследование вора реликвий.
- События/Наблюдения/Засады: Слежка за лагерем ордена, Осмотр заброшенного склепа, Сбор ядовитой химо-плазмы, Скрытное проникновение в башню, Обезвреживание рунной ловушки, Поиск древней реликвии в руинах, Разгадка тайны алтаря крови.

Сделай названия шагов ("steps") атмосферными, добавив к ролевому описанию реальное действие в скобках! (Например: "Прорвать оцепление паладинов (Открыть среду разработки)", "Начертить руну отсечения (Удалить старые файлы)").

Оцени "toxicity" (токсичность задачи): "scary" (страшная), "vague" (мутная), "tedious" (скучная), "standard" (обычная).

Каждому квесту обязательно сгенерируй:
1. "visualType": одна из 50+ категорий (руна, ритуал, заклятье, погоня, побег, потасовка, схватка, драка, засада, наблюдение, событие, бой, дуэль, осада, вылазка, охота, изгнание, пакт, алтарь, проклятие, ловушка, склеп, сжигание, сбор, призыв, пытка, кандалы, барьер, шторм, призрак, легион, пожиратель, когти, яд, лабиринт, допрос, печать, шепот, бездна, тлен, кости, скверна, оковы, скрежет, пепел, пламя, искры, вспышка, тень, туман).
2. "enemyName": атмосферное, жуткое и уникальное имя врага или босса (например, "Костяной Жнец Апатии", "Огненная Тварь Дедлайнов", "Призрак Мутных Задач", "Палач Бледных Земель").
3. "weakPoints": массив из 2 инсайтов о психологических и поведенческих слабостях этого врага/задачи (например: ["Монстр боится правила 5 минут: первый шаг сломает его панцирь", "Враг слеп к вашей активности: начните с глупого действия, чтобы войти в слепое пятно"]).
4. "randomEvent": жуткое или допаминовое случайное событие-модификатор боя (например: "Густой туман Бездны скрывает шкалу здоровья", "Допаминовая вспышка: удвоенный опыт за этот бой!", "Скрежет цепей ускоряет таймер страха").

Выведи ТОЛЬКО валидный JSON-массив, без markdown-разметки или постороннего текста.

Пример формата:
[
  {
    "title": "Название задачи",
    "type": "hunt",
    "estimatedTime": 25,
    "toxicity": "scary",
    "steps": ["Шаг 1", "Шаг 2"],
    "visualType": "схватка",
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

      {/* Main HUD Stats */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
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
          />
        )}

        {activeTab === 'character' && (
          <CharacterSheet 
            character={character}
            setCharacter={setCharacter}
            tasks={tasks}
            setTasks={setTasks}
            requestDeconstruction={requestDeconstruction}
          />
        )}

        {activeTab === 'planner' && (
          <TweekPlanner 
            tasks={tasks}
            setTasks={setTasks}
            character={character}
            setCharacter={setCharacter}
            requestDeconstruction={requestDeconstruction}
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
    </div>
  );
}
