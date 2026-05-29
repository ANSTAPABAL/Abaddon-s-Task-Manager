import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read API Key from .env
let apiKey = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  const match = envContent.match(/AI_TUNNEL_KEY=([^\r\n]+)/);
  if (match) apiKey = match[1].trim();
} catch (e) {
  console.error("Could not read .env file:", e.message);
}

if (!apiKey) {
  console.error("AI_TUNNEL_KEY not found in .env. Exiting smoke test.");
  process.exit(1);
}

const BASE_URL = 'https://api.aitunnel.ru/v1/chat/completions';

// Simulated matrix prefixes and entities to check variance
const prefixOptions = ["Иссохший", "Гнойный", "Чумной", "Бледный", "Одержимый", "Кровавый", "Мертвоглазый", "Костяной", "Каргахаульский", "Ослепший", "Свирепый", "Дикий"];
const entityOptions = ["Людоед", "Дезертир", "Вор реликвий", "Костяной Жнец", "Болотный химо-слизень", "Мародер империи", "Инквизитор Света", "Элитный паладин", "Бродяга Бездны", "Пепельный Скелет", "Одичавший волк"];

async function runSingleTest(testCase) {
  const { taskTitle, taskType, needsSteps, level, moralCompass, legacyStatus } = testCase;
  
  // 1. Determine Location by level/progress
  let locationName = "Пограничные Рубежи Абаддона";
  let locationContext = "Окраинные холодные пустоши на границе Каргахаула, где бродят проголодавшиеся волки, дикие твари и мелкие бродяги.";
  if (level === 2) {
    locationName = "Болотные Топи Смерти";
    locationContext = "Гнилые трясины, кишащие болотными химо-слизнями, гнойными людоедами и обезумевшими мародерами.";
  } else if (level === 3) {
    locationName = "Пепельные Чертоги Инквизиции";
    locationContext = "Обугленные руины старых замков, где рыщут слепые инквизиторы Света, иссохшая нежить и бродячие дезертиры.";
  } else if (level >= 4) {
    locationName = "Цитадель Владыки Света";
    locationContext = "Величественный замок из белого мрамора, оскверненный некро-паразитами, охраняемый элитными паладинами.";
  }

  // 2. Determine Scale Context based on level & task type
  let scaleContext = "";
  if (taskType === 'siege') {
    if (level === 1) {
      scaleContext = "Герой находится на 1-м уровне. Штурмовать огромные замки ему не по зубам. Вместо этого Осада должна быть локальной и приземленной: отбивать покосившийся аванпост бродяг от волков, защищать хлипкий забор от гнилых людоедов в трущобах или прорываться из окружения мелких разбойников.";
    } else if (level <= 3) {
      scaleContext = "Герой набрался опыта. Осада представляет собой штурм разбойничьего лагеря, зачистку склепа костей или защиту каравана от орд иссохшей нежити.";
    } else {
      scaleContext = "Герой — могучий воин (уровень 4+). Осада величественна: например, штурм форта Империи Света плечом к плечу с выжившим Принцем маленького человеческого княжества, либо битва за Цитадель Владыки.";
    }
  } else {
    scaleContext = "Это быстрая сессия фокуса. Масштаб приземленный, сосредоточенный на быстрой схватке, побеге или поиске реликвии.";
  }

  // 3. Determine Faction Alignment based on Moral/Spirit ("дух")
  let moraleContext = "";
  if (moralCompass < 45) {
    moraleContext = "У героя низкий, темный дух (плохой дух, Изгой). Он циничен, одинок и готов на все ради денег и выживания (порой 'подъедает' трупы, крадет у слабых или выступает хладнокровным наемником). Его враги и окружение — выжившие изгнанники, подозрительные путешественники, бродячие солдаты, дезертиры империи или крестьяне-людоеды.";
  } else if (moralCompass >= 65) {
    moraleContext = "У героя высокий, благородный дух (Искупленный). Он стремится к искуплению, защищает слабых и готов вступиться за местных жителей в городке или деревушке, куда притопал. Его враги — порождения тьмы, гнилая нежить и бесчестные чудовища.";
  } else {
    moraleContext = "Герой — прагматичный выживающий. Его цели диктуются выживанием во мгле.";
  }

  const randomPrefix = prefixOptions[Math.floor(Math.random() * prefixOptions.length)];
  const randomEntity = entityOptions[Math.floor(Math.random() * entityOptions.length)];

  let legacyPromptContext = "";
  if (legacyStatus === 'stained') {
    legacyPromptContext = "\n⚠️ ЛЕГЕНДА ПРОШЛОГО: Предыдущий герой (Гаррихальд, класс Маг огня) погиб в канавах Абаддона, и его имя ЗАПЯТНАНО. Если уместно, пусть враг в своем появлении (\"loreDescription\") мимоходом поглумится над этим позором рода текущего героя (например: \"Я чую запах гнилой крови Гаррихальд на тебе...\").";
  } else if (legacyStatus === 'sanctified') {
    legacyPromptContext = "\n⚠️ ЛЕГЕНДА ПРОШЛОГО: Предыдущий герой (Квазар, класс Плазмомансер) совершил великий триумф, и его имя ОСВЯЩЕНО. Если уместно, пусть враг в своем появлении (\"loreDescription\") выразит ярость или опаску относительно этого благородного рода.";
  }

  const systemPrompt = `Ты — Древний Летописец Ничейных Земель во вселенной Абаддона (grim-dark RPG). Действие разворачивается в Ничейных Землях — суровом холодном фронтире, где непрерывно бьются Империя Света (люди), разрозненные людские королевства, дикий Каргахаул, Деревянные Люди, орды Хаоса и бродячая Нежить. Изредка тут проходит разведка эльфов, еще реже бродячие тролли или опасные гарпии с небесных островов. Потусторонняя Бездна — это лишь скрытый запредельный мир, нечто за пределами человеческого восприятия.
Твоя задача — проанализировать задачу пользователя и вернуть JSON с геймификацией и деконструкцией.
${legacyPromptContext}

ЛОКАЦИЯ И МИР:
Текущая локация героя: ${locationName}.
Контекст окуржения: ${locationContext}.

МАСШТАБ СРАЖЕНИЯ И ПРОГРЕСС:
${scaleContext}

ДУХ И ПОВЕДЕНИЕ ГЕРОЯ:
${moraleContext}

ТРЕБОВАНИЯ К УНИКАЛЬНОСТИ ВРАГА (БОЛЕЕ 300 ВАРИАЦИЙ):
1. Сгенерируй полностью уникального врага, идеально подходящего под локацию, силу духа героя и масштаб приключения.
2. Враг должен быть преимущественно ГУМАНОИДНЫМ или МИФОЛОГИЧЕСКИМ существом из жанра grim-dark (например: ослепший паладин, бродячий дезертир, крестьянин-людоед, выживший изгой, элитный солдат).
3. Дай ему жуткое, уникальное имя ("enemyName") и подробное описание его появления из грота ("loreDescription", 3-4 предложения).
   - Для уникального вдохновения используй концепцию: "${randomPrefix} ${randomEntity}".
   - Описание должно сочно и детализированно рисовать гуманоидный или мифологический grim-dark силуэт (его пронзительный взгляд, очертания лат или масок, трещины на оружии, мрачные повадки).
   - СТРОГО ЗАПРЕЩЕНЫ любые бесформенные летающие сгустки плоти и аморфные черви.
4. Сгенерируй 2 слабости ("weakPoints") на основе его повадок (например: "он медлителен из-за тяжелых лат...", "боится резких шагов...").
5. Сгенерируй 1 случайное событие поля боя ("randomEvent").

ПРИРОДА ЗАДАЧИ:
1. Классифицируй задачу по типу ("type"):
   - "siege" (осада): крупные проекты, сложные отчеты, курсовые, дипломные, написание большого объема кода/текста.
   - "relic" (реликвия): изучение нового, чтение документации, рисование, исследование, анализ.
   - "corpse" (тлен/труп): разбор старых хвостов, долгов, уборка, очистка файлов, рутина.
   - "hunt" (охота): стандартные дела, звонки, отправка писем, быстрые задачи.

2. Если needsSteps равен true, разложи задачу на 4-6 элементарных физических микро-шагов ("steps"). Шаги должны быть геймифицированы (RPG действие + в скобках простое реальное действие, например: "Прочесть первую страницу древнего фолианта (Открыть документацию)"). Также дай краткое намерение квеста ("intent"). СТРОГОЕ ТРЕБОВАНИЕ: НИ В КОЕМ СЛУЧАЕ не выдумывай конкретный стек технологий, базы данных, языки программирования, библиотеки или требования, если они явно не указаны в названии задачи! Шаги в скобках должны быть общими и приземленными физическими действиями (например, «открыть файл», «написать черновик», «вытереть пыль»), соответствующими реальному тексту. Не делай ложных допущений за пользователя!

Выведи ТОЛЬКО валидный JSON-объект в формате:
{
  "type": "siege"|"relic"|"hunt"|"corpse",
  "enemyName": "Имя врага",
  "loreDescription": "Жуткое подробное описание появления врага из грота.",
  "weakPoints": ["Слабость 1", "Слабость 2"],
  "randomEvent": "Событие на поле боя",
  "intent": "Намерение",
  "steps": ["Микро-шаг 1", "Микро-шаг 2"] // вернуть только если needsSteps равен true
}`;

  const userPrompt = `Задача: "${taskTitle}". Текущий тип: ${taskType || 'hunt'}. Требуется шагов (needsSteps): ${needsSteps}.`;

  console.log(`\n================================================================================`);
  console.log(`🧪 TEST CASE: "${taskTitle}" | Lvl: ${level} | Morale: ${moralCompass} (${moralCompass < 45 ? 'Low' : moralCompass >= 65 ? 'High' : 'Medium'}) | Type: ${taskType}`);
  console.log(`📍 Location: ${locationName}`);
  console.log(`🧩 Inspiration Matrix Target: "${randomPrefix} ${randomEntity}"`);
  console.log(`================================================================================`);

  try {
    const startTime = Date.now();
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ API Response Time: ${duration}s | Status: ${response.status}`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ API Error: ${errText}`);
      return { success: false, error: errText };
    }

    const data = await response.json();
    let text = data?.choices?.[0]?.message?.content?.trim();
    
    if (!text) {
      console.error(`❌ Empty response content`);
      return { success: false, error: "Empty content" };
    }

    // Clean JSON wrappers
    if (text.startsWith("```json")) text = text.slice(7);
    if (text.endsWith("```")) text = text.slice(0, -3);
    text = text.trim();

    const parsed = JSON.parse(text);
    console.log(`✅ Success! Generated JSON payload:`);
    console.log(JSON.stringify(parsed, null, 2));

    // Automated sanity checks
    const checks = [];
    
    // Check 1: Humanoid / Mythological Check
    const blockwords = ["слизистый червь", "летающий сгусток", "бесформенное мясо", "черный червь", "слизкий паразит"];
    const textLower = JSON.stringify(parsed).toLowerCase();
    const hasBlobs = blockwords.some(word => textLower.includes(word));
    checks.push({
      name: "No amorphous forbidden blobs",
      status: !hasBlobs ? "PASS" : "FAIL (contains forbidden words)"
    });

    // Check 2: Correct fields exist
    const hasFields = !!(parsed.type && parsed.enemyName && parsed.loreDescription && parsed.weakPoints && parsed.randomEvent);
    checks.push({
      name: "Required JSON fields present",
      status: hasFields ? "PASS" : "FAIL"
    });

    // Check 3: Steps included if needsSteps
    if (needsSteps) {
      const hasSteps = Array.isArray(parsed.steps) && parsed.steps.length > 0;
      checks.push({
        name: "Steps generated when needsSteps=true",
        status: hasSteps ? "PASS" : "FAIL"
      });
    }

    // Check 4: Context relevance
    const hasPrefixMatch = prefixOptions.some(p => textLower.includes(p.toLowerCase().slice(0, 5)));
    const hasEntityMatch = entityOptions.some(e => textLower.includes(e.toLowerCase().slice(0, 5)));
    checks.push({
      name: "Inspiration variance matrix aligned",
      status: (hasPrefixMatch || hasEntityMatch) ? "PASS" : "WARN (AI created its own words, which is fine for extra variety)"
    });

    console.log(`\n🛡️ SANITY CHECKS:`);
    checks.forEach(c => console.log(`  - [${c.status}] ${c.name}`));

    return { success: true, payload: parsed, duration };

  } catch (err) {
    console.error(`❌ Exception during test:`, err);
    return { success: false, error: err.message };
  }
}

async function runSuite() {
  const cases = [
    {
      taskTitle: "Написать дипломную работу по методам оптимизации глубоких сетей",
      taskType: "siege",
      needsSteps: true,
      level: 1,
      moralCompass: 35, // low morale (Dark spirit)
      legacyStatus: "stained"
    },
    {
      taskTitle: "Сделать генеральную уборку на кухне и вынести старый хлам",
      taskType: "corpse",
      needsSteps: true,
      level: 2, // swamp location
      moralCompass: 75, // high morale (Mercy spirit)
      legacyStatus: "none"
    },
    {
      taskTitle: "Разобраться с документацией по React Server Components",
      taskType: "relic",
      needsSteps: false,
      level: 4, // Citadel of Light
      moralCompass: 50, // neutral morale
      legacyStatus: "sanctified"
    }
  ];

  console.log("🚀 Starting RPG AI Generation Smoke Test Suite...");
  
  const results = [];
  for (const c of cases) {
    const res = await runSingleTest(c);
    results.push({ case: c, result: res });
  }

  console.log("\n================================================================================");
  console.log("🏁 SMOKE TEST SUMMARY");
  console.log("================================================================================");
  results.forEach((r, idx) => {
    console.log(`Test #${idx+1}: "${r.case.taskTitle}"`);
    console.log(`  - Status: ${r.result.success ? "🟢 PASSED" : "🔴 FAILED"}`);
    if (r.result.success) {
      console.log(`  - Generated Enemy: ${r.result.payload.enemyName}`);
      console.log(`  - Task Type Classified: ${r.result.payload.type}`);
      console.log(`  - Duration: ${r.result.duration}s`);
    } else {
      console.log(`  - Error: ${r.result.error}`);
    }
  });
}

runSuite();
