const fs = require('fs');
const path = require('path');

console.log("Starting Precise Abaddon Task Manager Patching Script...");

// Normalize line endings to avoid CRLF mismatch
function patchFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const originalEndings = content.includes('\r\n') ? '\r\n' : '\n';
  
  // Normalize to LF for replacements
  content = content.replace(/\r\n/g, '\n');

  let successCount = 0;
  for (const rep of replacements) {
    if (content.includes(rep.target)) {
      content = content.replace(rep.target, rep.replacement);
      successCount++;
    } else {
      console.log(`❌ Target not found in ${path.basename(filePath)}:\n---[TARGET START]---\n${rep.target}\n---[TARGET END]---`);
    }
  }

  // Restore line endings
  if (originalEndings === '\r\n') {
    content = content.replace(/\n/g, '\r\n');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✔ Patched ${path.basename(filePath)}: ${successCount}/${replacements.length} updates applied successfully.`);
}

// -------------------------------------------------------------
// APP.JSX PATCHES
// -------------------------------------------------------------
const appPath = path.join(__dirname, '../src/App.jsx');
const appReplacements = [
  {
    target: `                        hp: Math.max(10, c.hp - 10),
                        moralCompass: Math.max(0, (c.moralCompass || 50) - 10),
                        totalHpSacrificed: (c.totalHpSacrificed || 0) + 10`,
    replacement: `                        const currentTask = judgmentTasks[judgmentIndex];
                        const hpDmg = currentTask?.isSurvival ? 30 : 10;
                        setCharacter(c => ({
                          ...c,
                          hp: Math.max(1, c.hp - hpDmg),
                          moralCompass: Math.max(0, (c.moralCompass || 50) - 10),
                          totalHpSacrificed: (c.totalHpSacrificed || 0) + hpDmg
                        }));`
  },
  {
    target: `                  💥 Вы теряете 10 HP здоровья разума! <br />`,
    replacement: `                  💥 Вы теряете {judgmentTasks[judgmentIndex]?.isSurvival ? 30 : 10} HP здоровья разума! <br />`
  }
];

// Run App.jsx patch
patchFile(appPath, appReplacements);


// -------------------------------------------------------------
// CARRIAGE_SESSION.JSX PATCHES
// -------------------------------------------------------------
const sessionPath = path.join(__dirname, '../src/components/CarriageSession.jsx');
const sessionReplacements = [
  // 1. Add prep states
  {
    target: `  const [isSurvivalModeActive, setIsSurvivalModeActive] = useState(false);`,
    replacement: `  const [isSurvivalModeActive, setIsSurvivalModeActive] = useState(false);

  // Prep modal states
  const [prepModalOpen, setPrepModalOpen] = useState(false);
  const [prepTask, setPrepTask] = useState(null);
  const [prepActionInput, setPrepActionInput] = useState('');
  const [prepTimerActive, setPrepTimerActive] = useState(false);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(100);
  const [prepChosenMode, setPrepChosenMode] = useState('timer');
  const [prepCallback, setPrepCallback] = useState(null);`
  },
  // 2. Add prep timer countdown
  {
    target: `  useEffect(() => {
    if (onStateSync) {
      onStateSync({ activeTask, timeLeft, isRunning });
    }
  }, [activeTask, timeLeft, isRunning, onStateSync]);`,
    replacement: `  useEffect(() => {
    if (onStateSync) {
      onStateSync({ activeTask, timeLeft, isRunning });
    }
  }, [activeTask, timeLeft, isRunning, onStateSync]);

  // Preparation countdown timer
  useEffect(() => {
    let interval = null;
    if (prepModalOpen && prepTimerActive && prepSecondsLeft > 0) {
      interval = setInterval(() => {
        setPrepSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (prepSecondsLeft === 0) {
      setPrepTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [prepModalOpen, prepTimerActive, prepSecondsLeft]);`
  },
  // 3. Intercept handleStartCombatSession with prep modal
  {
    target: `    if (!task.executionMode || task.executionMode === 'ask_later') {
      requestTaskExecutionModeSelect(task, (chosenMode) => {
        runStart(chosenMode);
      });
    } else {
      runStart(task.executionMode);
    }`,
    replacement: `    const triggerPrep = (mode) => {
      setPrepTask(task);
      setPrepChosenMode(mode);
      setPrepActionInput('');
      setPrepTimerActive(false);
      setPrepSecondsLeft(100);
      setPrepCallback(() => () => runStart(mode));
      setPrepModalOpen(true);
    };

    if (!task.executionMode || task.executionMode === 'ask_later') {
      requestTaskExecutionModeSelect(task, (chosenMode) => {
        triggerPrep(chosenMode);
      });
    } else {
      triggerPrep(task.executionMode);
    }`
  },
  // 4. Update standard victory handler to save defeated enemies and apply double rewards
  {
    target: `  const handleWinActiveSession = (task) => {
    if (resolutionTriggeredRef.current) return;
    resolutionTriggeredRef.current = true;
    setIsRunning(false);
    playSuccess();
    
    const moral = character.moralCompass !== undefined ? character.moralCompass : 50;
    const ambushChance = (40 - moral) / 40;
    const isAmbush = moral < 40 && (Math.random() < ambushChance);
    setResolutionIsAmbush(isAmbush);

    // Choose random NPC for encounter
    const randNpc = NPC_ENCOUNTERS[Math.floor(Math.random() * NPC_ENCOUNTERS.length)];
    setResolutionNpc(randNpc);
    
    const isSiege = task?.type === 'siege';
    const expReward = isAmbush ? 10 : (isSiege ? 60 : 25);
    const goldReward = isAmbush ? 5 : (isSiege ? 15 : 5);
    
    setCharacter(prev => {
      const nextXp = prev.xp + expReward;
      const xpNeeded = prev.level * 100;
      let nextLevel = prev.level;
      let remXp = nextXp;
      let extraGold = 0;
      
      let nextHp = prev.hp;
      if (nextLevel > prev.level && !isAmbush) {
        nextHp = prev.maxHp;
      }

      if (remXp >= xpNeeded) {
        nextLevel += 1;
        remXp -= xpNeeded;
        extraGold = isAmbush ? 0 : 15;
        playSuccess();
      }
      
      const earnedGold = goldReward + extraGold;
      
      const updatedBio = [...(prev.biography || [])];
      if (isAmbush) {
        updatedBio.push(\`На месте встречи Изгнанник обнаружил лишь растерзанное тело \${randNpc.name}. Ему пришлось вступить в бой с устроившими засаду бандитами Бездны. Разбойники перебиты, с их тел снято +10 XP и +5 Золота.\`);
      } else {
        updatedBio.push(\`Выполнен контракт: "\${task?.title || ''}". Встречен \${randNpc.name}. Получено +\${expReward} XP и +\${earnedGold} Золота.\`);
      }

      return {
        ...prev,
        level: nextLevel,
        xp: remXp,
        gold: (prev.gold || 0) + earnedGold,
        hp: nextHp,
        moralCompass: Math.min(100, (prev.moralCompass || 50) + 5),
        completedTasksCount: (prev.completedTasksCount || 0) + 1,
        completedSiegesCount: (prev.completedSiegesCount || 0) + (isSiege ? 1 : 0),
        totalGoldEarned: (prev.totalGoldEarned || 0) + earnedGold,
        biography: updatedBio
      };
    });

    if (task) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
    }
    
    localStorage.removeItem('active_task_id');
    localStorage.removeItem('combat_time_left');
    
    setSetupStage('resolution');
    setResolutionType('victory');
    handleGenerateResolutionChronicle('victory', task, enemyName, isAmbush, randNpc.name);
  };`,
    replacement: `  const handleWinActiveSession = (task) => {
    if (resolutionTriggeredRef.current) return;
    resolutionTriggeredRef.current = true;
    setIsRunning(false);
    playSuccess();
    
    const moral = character.moralCompass !== undefined ? character.moralCompass : 50;
    const ambushChance = (40 - moral) / 40;
    const isAmbush = moral < 40 && (Math.random() < ambushChance);
    setResolutionIsAmbush(isAmbush);

    // Choose random NPC for encounter
    const randNpc = NPC_ENCOUNTERS[Math.floor(Math.random() * NPC_ENCOUNTERS.length)];
    setResolutionNpc(randNpc);
    
    const isSiege = task?.type === 'siege';
    let expReward = isAmbush ? 10 : (isSiege ? 60 : 25);
    let goldReward = isAmbush ? 5 : (isSiege ? 15 : 5);
    
    const isSurvival = task?.isSurvival;
    if (isSurvival) {
      expReward *= 2;
      goldReward *= 2;
    }

    const today = new Date();
    const formattedDate = \`\${String(today.getDate()).padStart(2, '0')}.\${String(today.getMonth() + 1).padStart(2, '0')}.\${today.getFullYear()}\`;
    const newDefeatId = \`defeat-\${Date.now()}-\${Math.random().toString(36).substr(2, 4)}\`;

    let rawSteps = task?.steps || [];
    if (rawSteps.length === 0) {
      rawSteps = generateLocalSteps(task?.title || '', task?.type || 'hunt').map(s => ({ title: s.title || s, completed: true }));
    } else {
      rawSteps = rawSteps.map(s => ({ title: s.title || s, completed: s.completed !== undefined ? s.completed : true }));
    }

    const defeatedEnemyObj = {
      id: newDefeatId,
      enemyName: enemyName,
      enemyIcon: '👹',
      taskTitle: task?.title || '',
      taskType: task?.type || 'hunt',
      pomodoroTime: task?.pomodoroTime || task?.estimatedTime || 25,
      steps: rawSteps,
      date: formattedDate,
      victoryChronicle: 'Запись Летописца Бездны составляется...'
    };

    try {
      const hashStr = (task?.title || '') + (task?.id || '');
      let hash = 0;
      for (let i = 0; i < hashStr.length; i++) {
        hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      hash = Math.abs(hash);
      const variation = COMBAT_VARIATIONS[hash % COMBAT_VARIATIONS.length];
      if (variation && variation.icon) {
        defeatedEnemyObj.enemyIcon = variation.icon;
      }
    } catch (e) {}

    setCharacter(prev => {
      const nextXp = prev.xp + expReward;
      const xpNeeded = prev.level * 100;
      let nextLevel = prev.level;
      let remXp = nextXp;
      let extraGold = 0;
      
      let nextHp = prev.hp;
      if (nextLevel > prev.level && !isAmbush) {
        nextHp = prev.maxHp;
      }

      if (remXp >= xpNeeded) {
        nextLevel += 1;
        remXp -= xpNeeded;
        extraGold = isAmbush ? 0 : 15;
        playSuccess();
      }
      
      const earnedGold = goldReward + extraGold;
      
      const updatedBio = [...(prev.biography || [])];
      const survivalText = isSurvival ? ' (Вопрос жизни и смерти: x2 награды!)' : '';
      if (isAmbush) {
        updatedBio.push(\`На месте встречи Изгнанник обнаружил лишь растерзанное тело \${randNpc.name}. Ему пришлось вступить в бой с устроившими засаду бандитами Бездны. Разбойники перебиты, с их тел снято +10 XP и +\${earnedGold} Золота.\${survivalText}\`);
      } else {
        updatedBio.push(\`Выполнен контракт: "\${task?.title || ''}". Встречен \${randNpc.name}. Получено +\${expReward} XP и +\${earnedGold} Золота.\${survivalText}\`);
      }

      const existingDefeated = prev.defeatedEnemies || [];

      return {
        ...prev,
        level: nextLevel,
        xp: remXp,
        gold: (prev.gold || 0) + earnedGold,
        hp: nextHp,
        moralCompass: Math.min(100, (prev.moralCompass || 50) + 5),
        completedTasksCount: (prev.completedTasksCount || 0) + 1,
        completedSiegesCount: (prev.completedSiegesCount || 0) + (isSiege ? 1 : 0),
        totalGoldEarned: (prev.totalGoldEarned || 0) + earnedGold,
        biography: updatedBio,
        defeatedEnemies: [...existingDefeated, defeatedEnemyObj]
      };
    });

    if (task) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
    }
    
    localStorage.removeItem('active_task_id');
    localStorage.removeItem('combat_time_left');
    
    setSetupStage('resolution');
    setResolutionType('victory');
    handleGenerateResolutionChronicle('victory', task, enemyName, isAmbush, randNpc.name, newDefeatId);
  };`
  },
  // 5. Update instant complete victory handler to save defeated enemies and apply double rewards
  {
    target: `  const handleInstantCompleteTask = (task) => {
    resolutionTriggeredRef.current = false;
    setIsRunning(false);
    playSuccess();

    // Determine enemy name
    const hashStr = task.title + (task.id || '');
    let hash = 0;
    for (let i = 0; i < hashStr.length; i++) {
      hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    const variation = COMBAT_VARIATIONS[hash % COMBAT_VARIATIONS.length];
    const eName = task.combatLore?.enemyName || \`\${variation.prefix} \${variation.suffix}\`;
    setEnemyName(eName);

    const moral = character.moralCompass !== undefined ? character.moralCompass : 50;
    const ambushChance = (40 - moral) / 40;
    const isAmbush = moral < 40 && (Math.random() < ambushChance);
    setResolutionIsAmbush(isAmbush);

    // Choose random NPC for encounter
    const randNpc = NPC_ENCOUNTERS[Math.floor(Math.random() * NPC_ENCOUNTERS.length)];
    setResolutionNpc(randNpc);

    const isSiege = task.type === 'siege';
    const expReward = isAmbush ? 10 : (isSiege ? 60 : 25);
    const goldReward = isAmbush ? 5 : (isSiege ? 15 : 5);

    setCharacter(prev => {
      const nextXp = prev.xp + expReward;
      const xpNeeded = prev.level * 100;
      let nextLevel = prev.level;
      let remXp = nextXp;
      let extraGold = 0;

      let nextHp = prev.hp;
      if (nextLevel > prev.level && !isAmbush) {
        nextHp = prev.maxHp;
      }

      if (remXp >= xpNeeded) {
        nextLevel += 1;
        remXp -= xpNeeded;
        extraGold = isAmbush ? 0 : 15;
        playSuccess();
      }

      const earnedGold = goldReward + extraGold;

      const updatedBio = [...(prev.biography || [])];
      if (isAmbush) {
        updatedBio.push(\`На месте встречи Изгнанник обнаружил лишь растерзанное тело \${randNpc.name}. Ему пришлось вступить в бой с устроившими засаду бандитами Бездны. Разбойники перебиты, с их тел снято +10 XP и +5 Золота.\`);
      } else {
        updatedBio.push(\`Выполнен контракт: "\${task.title}". Встречен \${randNpc.name}. Получено +\${expReward} XP и +\${earnedGold} Золота.\`);
      }

      return {
        ...prev,
        level: nextLevel,
        xp: remXp,
        gold: (prev.gold || 0) + earnedGold,
        hp: nextHp,
        moralCompass: Math.min(100, (prev.moralCompass || 50) + 5),
        completedTasksCount: (prev.completedTasksCount || 0) + 1,
        completedSiegesCount: (prev.completedSiegesCount || 0) + (isSiege ? 1 : 0),
        totalGoldEarned: (prev.totalGoldEarned || 0) + earnedGold,
        biography: updatedBio
      };
    });

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));

    localStorage.removeItem('active_task_id');
    localStorage.removeItem('combat_time_left');

    setSetupStage('resolution');
    setResolutionType('victory');
    handleGenerateResolutionChronicle('victory', task, eName, isAmbush, randNpc.name);
  };`,
    replacement: `  const handleInstantCompleteTask = (task) => {
    resolutionTriggeredRef.current = false;
    setIsRunning(false);
    playSuccess();

    // Determine enemy name
    const hashStr = task.title + (task.id || '');
    let hash = 0;
    for (let i = 0; i < hashStr.length; i++) {
      hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    const variation = COMBAT_VARIATIONS[hash % COMBAT_VARIATIONS.length];
    const eName = task.combatLore?.enemyName || \`\${variation.prefix} \${variation.suffix}\`;
    setEnemyName(eName);

    const moral = character.moralCompass !== undefined ? character.moralCompass : 50;
    const ambushChance = (40 - moral) / 40;
    const isAmbush = moral < 40 && (Math.random() < ambushChance);
    setResolutionIsAmbush(isAmbush);

    // Choose random NPC for encounter
    const randNpc = NPC_ENCOUNTERS[Math.floor(Math.random() * NPC_ENCOUNTERS.length)];
    setResolutionNpc(randNpc);

    const isSiege = task.type === 'siege';
    let expReward = isAmbush ? 10 : (isSiege ? 60 : 25);
    let goldReward = isAmbush ? 5 : (isSiege ? 15 : 5);

    const isSurvival = task.isSurvival;
    if (isSurvival) {
      expReward *= 2;
      goldReward *= 2;
    }

    const today = new Date();
    const formattedDate = \`\${String(today.getDate()).padStart(2, '0')}.\${String(today.getMonth() + 1).padStart(2, '0')}.\${today.getFullYear()}\`;
    const newDefeatId = \`defeat-\${Date.now()}-\${Math.random().toString(36).substr(2, 4)}\`;

    let rawSteps = task.steps || [];
    if (rawSteps.length === 0) {
      rawSteps = generateLocalSteps(task.title, task.type || 'hunt').map(s => ({ title: s, completed: true }));
    } else {
      rawSteps = rawSteps.map(s => ({ title: s.title || s, completed: true }));
    }

    const defeatedEnemyObj = {
      id: newDefeatId,
      enemyName: eName,
      enemyIcon: variation.icon || "👹",
      taskTitle: task.title || '',
      taskType: task.type || 'hunt',
      pomodoroTime: task.pomodoroTime || task.estimatedTime || 25,
      steps: rawSteps,
      date: formattedDate,
      victoryChronicle: 'Запись Летописца Бездны составляется...'
    };

    setCharacter(prev => {
      const nextXp = prev.xp + expReward;
      const xpNeeded = prev.level * 100;
      let nextLevel = prev.level;
      let remXp = nextXp;
      let extraGold = 0;

      let nextHp = prev.hp;
      if (nextLevel > prev.level && !isAmbush) {
        nextHp = prev.maxHp;
      }

      if (remXp >= xpNeeded) {
        nextLevel += 1;
        remXp -= xpNeeded;
        extraGold = isAmbush ? 0 : 15;
        playSuccess();
      }

      const earnedGold = goldReward + extraGold;

      const updatedBio = [...(prev.biography || [])];
      const survivalText = isSurvival ? ' (Вопрос жизни и смерти: x2 награды!)' : '';
      if (isAmbush) {
        updatedBio.push(\`На месте встречи Изгнанник обнаружил лишь растерзанное тело \${randNpc.name}. Ему пришлось вступить в бой с устроившими засаду бандитами Бездны. Разбойники перебиты, с их тел снято +10 XP и +\${earnedGold} Золота.\${survivalText}\`);
      } else {
        updatedBio.push(\`Выполнен контракт: "\${task.title}". Встречен \${randNpc.name}. Получено +\${expReward} XP и +\${earnedGold} Золота.\${survivalText}\`);
      }

      const existingDefeated = prev.defeatedEnemies || [];

      return {
        ...prev,
        level: nextLevel,
        xp: remXp,
        gold: (prev.gold || 0) + earnedGold,
        hp: nextHp,
        moralCompass: Math.min(100, (prev.moralCompass || 50) + 5),
        completedTasksCount: (prev.completedTasksCount || 0) + 1,
        completedSiegesCount: (prev.completedSiegesCount || 0) + (isSiege ? 1 : 0),
        totalGoldEarned: (prev.totalGoldEarned || 0) + earnedGold,
        biography: updatedBio,
        defeatedEnemies: [...existingDefeated, defeatedEnemyObj]
      };
    });

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));

    localStorage.removeItem('active_task_id');
    localStorage.removeItem('combat_time_left');
    localStorage.removeItem('combat_chosen_mode');
    localStorage.removeItem('combat_is_survival');
    setIsSurvivalModeActive(false);

    setSetupStage('resolution');
    setResolutionType('victory');
    handleGenerateResolutionChronicle('victory', task, eName, isAmbush, randNpc.name, newDefeatId);
  };`
  },
  // 6. Update rescheduling penalty tomorrow
  {
    target: `  const handleRescheduleTomorrow = (task) => {
    playClick();
    const tomorrowStr = getVirtualTomorrowStr();
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, date: tomorrowStr } : t));
    spawnFloater("На завтра", "heal-hp");
  };`,
    replacement: `  const handleRescheduleTomorrow = (task) => {
    playClick();
    const tomorrowStr = getVirtualTomorrowStr();
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, date: tomorrowStr } : t));
    if (task.isSurvival) {
      setCharacter(prev => ({
        ...prev,
        hp: Math.max(1, prev.hp - 15),
        totalHpSacrificed: (prev.totalHpSacrificed || 0) + 15
      }));
      spawnFloater("-15 HP!", "enemy-strike");
      triggerFlash('blood');
    } else {
      spawnFloater("На завтра", "heal-hp");
    }
  };`
  },
  // 7. Update failure damage inside handleFlee and timer countdown
  {
    target: `    const dmg = isSurvivalModeActive ? 30 : 15;`,
    replacement: `    const dmg = (isSurvivalModeActive || activeTask?.isSurvival) ? 30 : 15;`
  },
  {
    target: `      spawnFloater(isSurvivalModeActive ? "-30 HP!" : "-15 HP!", "enemy-strike");`,
    replacement: `      spawnFloater((isSurvivalModeActive || activeTask?.isSurvival) ? "-30 HP!" : "-15 HP!", "enemy-strike");`
  },
  {
    target: `      const battleLogEntry = \`💥 [Дедлайн] Время истекло! Противник \${enemyName} наносит вам сокрушительный удар на \${isSurvivalModeActive ? 30 : 15} HP за опоздание!\`;`,
    replacement: `      const battleLogEntry = \`💥 [Дедлайн] Время истекло! Противник \${enemyName} наносит вам сокрушительный удар на \${(isSurvivalModeActive || activeTask?.isSurvival) ? 30 : 15} HP за опоздание!\`;`
  },
  // 8. Inject prep modal and survival badges
  {
    target: `                      {task.executionMode && task.executionMode !== 'ask_later' && (`,
    replacement: `                      {task.isSurvival && (
                        <span style={{ 
                          fontSize: '0.6rem', 
                          color: '#ff3333', 
                          background: 'rgba(255, 51, 51, 0.15)', 
                          padding: '1px 5px', 
                          borderRadius: '3px',
                          border: '1px solid rgba(255, 51, 51, 0.4)',
                          fontWeight: 'bold',
                          animation: 'heartbeat-pulse 1.5s infinite'
                        }}>
                          💀 Жизнь или Смерть
                        </span>
                      )}
                      {task.executionMode && task.executionMode !== 'ask_later' && (`
  },
  {
    target: `      {/* Screen Flash overlays */}`,
    replacement: `      {prepModalOpen && (
        <div className="gothic-modal-overlay animate-fade-in" style={{ zIndex: 1400, background: 'rgba(10, 3, 3, 0.96)' }}>
          <div className={prepTimerActive ? "gothic-modal-content shiver-alert" : "gothic-modal-content"} style={{
            maxWidth: '550px',
            width: '90%',
            textAlign: 'center',
            padding: '2.5rem 2rem 2rem 2rem',
            background: 'linear-gradient(180deg, #1b0c0c 0%, #0d0404 100%)',
            border: '2px solid var(--color-blood)',
            boxShadow: prepTimerActive ? '0 0 40px rgba(255, 51, 51, 0.4), inset 0 0 25px rgba(255, 51, 51, 0.2)' : '0 0 25px rgba(139,0,0,0.5)',
            position: 'relative',
            animation: prepTimerActive ? 'heartbeat-pulse 1.2s infinite' : 'none'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚔️</div>
            <h3 className="gothic-title" style={{ fontSize: '1.6rem', color: '#ff3333', marginBottom: '0.8rem', letterSpacing: '1px', textShadow: '0 0 10px rgba(255,51,51,0.3)' }}>
              ПОДГОТОВИТЬСЯ К БОЮ
            </h3>
            
            {!prepTimerActive ? (
              <>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-bone-dim)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                  Изгнанник, чтобы одолеть когнитивную тварь, вы должны сделать первый физический шаг без раздумий.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left', marginBottom: '1.8rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-rpg)' }}>
                    Впишите действие, которое необходимо сделать ПРЯМО СЕЙЧАС, чтобы начать:
                  </label>
                  <input
                    type="text"
                    className="rpg-input"
                    style={{ width: '100%', fontSize: '0.95rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--color-blood)' }}
                    placeholder="Например: открыть проект в IDE, помыть ровно одну тарелку..."
                    value={prepActionInput}
                    onChange={(e) => setPrepActionInput(e.target.value)}
                  />
                </div>
                <button
                  className="rpg-btn rpg-btn-blood heartbeat-pulse"
                  style={{ padding: '0.8rem 2rem', fontSize: '0.95rem', fontWeight: 'bold', width: '100%' }}
                  disabled={!prepActionInput.trim()}
                  onClick={() => {
                    playSuccess();
                    setPrepTimerActive(true);
                    setPrepSecondsLeft(100);
                  }}
                >
                  🔥 СОБРАТЬСЯ!
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>
                  МЕНТАЛЬНАЯ КОНЦЕНТРАЦИЯ НА ПЕРВОМ ШАГЕ:
                </p>
                <div style={{ 
                  fontSize: '1.4rem', 
                  color: '#fff', 
                  fontWeight: 'bold', 
                  background: 'rgba(0,0,0,0.4)', 
                  padding: '1rem', 
                  border: '1px dashed var(--color-blood-glow)',
                  marginBottom: '1.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  👉 {prepActionInput} 👈
                </div>

                <div style={{ fontSize: '1.1rem', color: '#ff3333', fontWeight: 'bold', marginBottom: '1.8rem', fontFamily: 'monospace' }}>
                  ⏱️ ОСТАЛОСЬ ВРЕМЕНИ НА СТАРТ: <span style={{ fontSize: '2rem', textShadow: '0 0 10px rgba(255,51,51,0.5)' }}>{prepSecondsLeft}</span> СЕКУНД
                </div>

                {prepSecondsLeft === 0 && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-blood-glow)', marginBottom: '1rem', fontStyle: 'italic' }}>
                    ⏳ Время вышло! Враг наступает. Жмите кнопку ниже и делайте первый шаг!
                  </div>
                )}

                <button
                  className="rpg-btn rpg-btn-mana"
                  style={{ padding: '0.85rem 2rem', fontSize: '0.95rem', fontWeight: 'bold', width: '100%', boxShadow: '0 0 15px rgba(29, 185, 84, 0.2)' }}
                  onClick={() => {
                    playSuccess();
                    setPrepModalOpen(false);
                    if (prepCallback) prepCallback();
                  }}
                >
                  ⚔️ В БОЙ! Я НАЧАЛ!
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Screen Flash overlays */}`
  }
];

// Run CarriageSession.jsx patch
patchFile(sessionPath, sessionReplacements);


// -------------------------------------------------------------
// TWEEK_PLANNER.JSX PATCHES
// -------------------------------------------------------------
const plannerPath = path.join(__dirname, '../src/components/TweekPlanner.jsx');
const plannerReplacements = [
  // 1. Add states
  {
    target: `  const [isLongJourney, setIsLongJourney] = useState(false);`,
    replacement: `  const [isLongJourney, setIsLongJourney] = useState(false);
  const [isSurvivalMode, setIsSurvivalMode] = useState(false);
  const [isChaosSurvivalMode, setIsChaosSurvivalMode] = useState(false);
  const [editIsSurvival, setEditIsSurvival] = useState(false);`
  },
  // 2. Inject isSurvival in handleCreateTask
  {
    target: `      isLongJourney: isLongJourney
    };`,
    replacement: `      isLongJourney: isLongJourney,
      isSurvival: isSurvivalMode
    };`
  },
  // Reset survival mode in handleCreateTask
  {
    target: `        setIsLongJourney(false);
        playSuccess();`,
    replacement: `        setIsLongJourney(false);
        setIsSurvivalMode(false);
        playSuccess();`
  },
  // 3. Inject isSurvival in Chaos Dump Parse
  {
    target: `            isLongJourney: t.isLongJourney || false,`,
    replacement: `            isLongJourney: t.isLongJourney || false,
            isSurvival: isChaosSurvivalMode,`
  },
  // Reset chaos survival
  {
    target: `        setChaosText('');
        setChaosDumpOpen(false);`,
    replacement: `        setChaosText('');
        setChaosDumpOpen(false);
        setIsChaosSurvivalMode(false);`
  },
  // 4. Update rescheduling penalty
  {
    target: `      setCharacter(prev => ({
        ...prev,
        hp: Math.max(1, prev.hp - 2),
        totalHpSacrificed: (prev.totalHpSacrificed || 0) + 2
      }));`,
    replacement: `      const hpPenalty = targetTask.isSurvival ? 15 : 2;
      setCharacter(prev => ({
        ...prev,
        hp: Math.max(1, prev.hp - hpPenalty),
        totalHpSacrificed: (prev.totalHpSacrificed || 0) + hpPenalty
      }));`
  },
  {
    target: `      setRitualMessage(\`💀 Задача «\${targetTask.title}» изгнана \${destLabel}! Потеряно 2 HP. Скверна задачи возросла.\`);`,
    replacement: `      setRitualMessage(\`💀 Задача «\${targetTask.title}» изгнана \${destLabel}! Потеряно \${hpPenalty} HP. Скверна задачи возросла.\`);`
  },
  // 5. Inject manual survival checkbox
  {
    target: `          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-bone-dim)' }}>
              <input
                type="checkbox"
                checked={isLongJourney}
                onChange={(e) => setIsLongJourney(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-blood)', cursor: 'pointer' }}
              />
              <span>Длительное путешествие</span>
            </label>
          </div>`,
    replacement: `          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-bone-dim)' }}>
              <input
                type="checkbox"
                checked={isLongJourney}
                onChange={(e) => setIsLongJourney(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-blood)', cursor: 'pointer' }}
              />
              <span>Длительное путешествие</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-blood)', fontWeight: 'bold', marginLeft: '12px' }}>
              <input
                type="checkbox"
                checked={isSurvivalMode}
                onChange={(e) => setIsSurvivalMode(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-blood)', cursor: 'pointer' }}
              />
              <span>Вопрос жизни и смерти</span>
            </label>
          </div>`
  },
  // 6. Inject chaos survival checkbox
  {
    target: `            <textarea
              className="rpg-input"
              style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontSize: '0.92rem', background: 'rgba(10,5,15,0.6)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', lineHeight: '1.4' }}
              placeholder="Например: мне надо помыть посуду, но блин раковина полная и воняет, это пипец страшно начать. Еще сдать проект заказчику до среды, там куча мелких правок, надо написать тесты и проверить сборку, это огромная осада! Еще купить корм коту, это быстро."
              value={chaosText}
              onChange={(e) => setChaosText(e.target.value)}
              disabled={chaosLoading}
            />`,
    replacement: `            <textarea
              className="rpg-input"
              style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontSize: '0.92rem', background: 'rgba(10,5,15,0.6)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', lineHeight: '1.4' }}
              placeholder="Например: мне надо помыть посуду, но блин раковина полная и воняет, это пипец страшно начать. Еще сдать проект заказчику до среды, там куча мелких правок, надо написать тесты и проверить сборку, это огромная осада! Еще купить корм коту, это быстро."
              value={chaosText}
              onChange={(e) => setChaosText(e.target.value)}
              disabled={chaosLoading}
            />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', alignSelf: 'flex-start' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-blood)', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={isChaosSurvivalMode}
                  onChange={(e) => setIsChaosSurvivalMode(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-blood)', cursor: 'pointer' }}
                />
                <span>Вопрос жизни и смерти (Режим Выживания: х2 EXP/Золото, суровые штрафы HP!)</span>
              </label>
            </div>`
  },
  // 7. Inject survival badge inside renderTaskTitle
  {
    target: `  const renderTaskTitle = (task, fontSize = '0.9rem') => {
    return (
      <span style={{ fontSize, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
        {task.title}`,
    replacement: `  const renderTaskTitle = (task, fontSize = '0.9rem') => {
    return (
      <span style={{ fontSize, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
        {task.title}
        {task.isSurvival && (
          <span className="shiver-alert" style={{
            fontSize: '0.65rem',
            color: '#ff3333',
            background: 'rgba(255, 51, 51, 0.1)',
            padding: '1px 4px',
            borderRadius: '3px',
            border: '1px solid rgba(255, 51, 51, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            boxShadow: '0 0 5px rgba(255,51,51,0.2)'
          }}>
            💀 Жизнь или Смерть
          </span>
        )}`
  },
  // 8. Add task editor states
  {
    target: `    setEditDeadline(task.deadline || '');`,
    replacement: `    setEditDeadline(task.deadline || '');
    setEditIsSurvival(task.isSurvival || false);`
  },
  {
    target: `      nature: editNature,
      executionMode: editExecutionMode,
      deadline: editDeadline
    } : t));`,
    replacement: `      nature: editNature,
      executionMode: editExecutionMode,
      deadline: editDeadline,
      isSurvival: editIsSurvival
    } : t));`
  },
  // Editor survival checkbox
  {
    target: `                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>СРОК (ДЕДЛАЙН)</label>
                    <input 
                      type="text" 
                      className="rpg-input" 
                      style={{ width: '100%', fontSize: '0.9rem' }} 
                      placeholder="Например: до 18:00, через 2 дня"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                    />
                  </div>`,
    replacement: `                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>СРОК (ДЕДЛАЙН)</label>
                    <input 
                      type="text" 
                      className="rpg-input" 
                      style={{ width: '100%', fontSize: '0.9rem' }} 
                      placeholder="Например: до 18:00, через 2 дня"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-blood)', fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      checked={editIsSurvival}
                      onChange={(e) => setEditIsSurvival(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-blood)', cursor: 'pointer' }}
                    />
                    <span>Вопрос жизни и смерти (Режим Выживания: х2 EXP/Золото, суровые штрафы HP!)</span>
                  </label>`
  }
];

// Run TweekPlanner.jsx patch
patchFile(plannerPath, plannerReplacements);


// -------------------------------------------------------------
// CHARACTER_SHEET.JSX PATCHES
// -------------------------------------------------------------
const sheetPath = path.join(__dirname, '../src/components/CharacterSheet.jsx');
const sheetReplacements = [
  // 1. Add recapEnemy and chroniclePage states
  {
    target: `  const [selectedTask, setSelectedTask] = useState(null);`,
    replacement: `  const [selectedTask, setSelectedTask] = useState(null);
  const [recapEnemy, setRecapEnemy] = useState(null);
  const [chroniclePage, setChroniclePage] = useState(1);
  const itemsPerPage = 5;`
  },
  // 2. Inject Bestiary
  {
    target: `              ) : (
                <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--color-iron-light)', padding: '5px' }}>
                  Рюкзак пуст. Купите вещи у Торговца ниже.
                </div>
              )}
            </div>
          </div>
        </div>`,
    replacement: `              ) : (
                <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--color-iron-light)', padding: '5px' }}>
                  Рюкзак пуст. Купите вещи у Торговца ниже.
                </div>
              )}
            </div>
          </div>

          {/* Bestiary (Книга Поверженных Тварей) */}
          <div style={{ background: '#0a090b', padding: '0.8rem', border: '1px solid var(--color-iron-light)', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', color: 'var(--color-blood)', marginBottom: '8px', fontFamily: 'var(--font-rpg)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>📜</span>
              <span>Книга Поверженных Тварей (Бестиарий):</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }} className="rpg-scrollbar">
              {(character.defeatedEnemies && character.defeatedEnemies.length > 0) ? (
                [...character.defeatedEnemies].reverse().map((enemy) => (
                  <div 
                    key={enemy.id} 
                    style={{ 
                      background: 'rgba(20,10,15,0.4)', 
                      border: '1px solid rgba(255,51,51,0.15)', 
                      borderLeft: '3px solid var(--color-blood)', 
                      padding: '0.5rem 0.7rem', 
                      borderRadius: '3px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 'bold' }}>
                        {enemy.enemyIcon || '👹'} {enemy.enemyName}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-bone-dim)' }}>
                        {enemy.date}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-bone-dim)' }}>
                      Контракт: <span style={{ color: '#eeddbb' }}>«{enemy.taskTitle}»</span> ({enemy.taskType === 'siege' ? 'Осада' : 'Охота'})
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-iron-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span>Время боя: {enemy.pomodoroTime || 25} мин</span>
                      <button 
                        className="rpg-btn" 
                        style={{ fontSize: '0.6rem', padding: '2px 6px', color: 'var(--color-relic-glow)', borderColor: 'rgba(212,175,55,0.3)' }}
                        onClick={() => { playClick(); setRecapEnemy(enemy); }}
                      >
                        🔍 Прочитать рекап
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--color-iron-light)', padding: '5px', textAlign: 'center' }}>
                  Бестиарий пуст. Одолейте своего первого врага в фокус-сессии, чтобы начать книгу подвигов!
                </div>
              )}
            </div>
          </div>
        </div>`
  },
  // 3. Paginated Chronicle
  {
    target: `                    {rest.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ borderBottom: '1px dashed var(--color-iron-light)', paddingBottom: '0.5rem', textAlign: 'left' }}>
                          <h4 className="gothic-title" style={{ fontSize: '1.2rem', color: 'var(--color-bone-dim)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            ⚓ ДРУГИЕ ДУХИ БЕЗДНЫ (ПАВШИЕ ИЛИ ВОЗНЕСШИЕСЯ)
                          </h4>
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-iron-light)' }}>Упорядочены по очкам славы и заслугам</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                          {rest.map((legend, idx) => {
                            const isStained = legend.legacyStatus === 'stained';
                            const cardBorder = isStained 
                              ? 'linear-gradient(to bottom, #cf142b, #8b0000, #220000) 1'
                              : 'linear-gradient(to bottom, #d4af37, #aa820a, #1a1505) 1';
                            const cardShadow = isStained
                              ? '0 5px 15px rgba(139,0,0,0.3), inset 0 0 10px rgba(139,0,0,0.05)'
                              : '0 5px 15px rgba(0,0,0,0.6), inset 0 0 10px rgba(212,175,55,0.02)';
                            const icon = isStained ? '☠️' : '☀️';
                            const label = isStained ? 'ЗАПЯТНАННОЕ ИМЯ' : \`ЛЕГЕНДА #\${idx + 4}\`;
                            const titleColor = isStained ? '#ff4d4d' : '#ffb813';
                            const scrollBg = isStained
                              ? 'radial-gradient(circle, #1c0e0e 0%, #0d0505 100%)'
                              : 'radial-gradient(circle, #1a1613 0%, #0d0b09 100%)';
                            const scrollBorder = isStained ? '#5c1a1a' : '#4a3e31';
                            const scrollText = isStained ? '#dfc5c5' : '#cbbba5';
                            const scrollTitleColor = isStained ? '#ff4d4d' : '#ffb813';
                            const scrollTitle = isStained ? '📜 Печать Тлена / Летопись Падения:' : '📜 Летопись Искупления ИИ:';

                            return (
                              <div 
                                key={idx} 
                                style={{
                                  background: '#0a080c',
                                  border: '2px solid',
                                  borderImage: cardBorder,
                                  padding: '1.2rem',
                                  boxShadow: cardShadow,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.8rem'
                                }}
                              >
                                <div style={{ borderBottom: '1px solid ' + (isStained ? '#5c1a1a' : '#4a3e31'), paddingBottom: '0.6rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                                    <span style={{ fontSize: '0.7rem', color: titleColor, fontFamily: 'var(--font-rpg)', fontWeight: 'bold' }}>{label}</span>
                                  </div>
                                  <h3 className="gothic-title" style={{ fontSize: '1.15rem', color: titleColor, marginTop: '4px', margin: 0 }}>
                                    {legend.name}
                                  </h3>
                                  {legend.nickname && (
                                    <div style={{ fontSize: '0.68rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', marginTop: '1px' }}>
                                      «{legend.nickname}»
                                    </div>
                                  )}
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginTop: '4px' }}>
                                    {legend.race} • {legend.class} • <b>Уровень {legend.level}</b>
                                  </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--color-bone-dim)', background: 'rgba(0,0,0,0.3)', padding: '6px', border: '1px solid var(--color-iron-light)', textAlign: 'left' }}>
                                  <div>📜 Квесты: <b>{legend.completedTasksCount || 0} шт</b></div>
                                  <div>👹 Боссы: <b>{legend.completedSiegesCount || 0} шт</b></div>
                                  <div>🪙 Золото: <b>{legend.totalGoldEarned || 0}</b></div>
                                  <div>🔮 Ур: <b>{legend.level || 1}</b></div>
                                </div>

                                <div style={{ background: scrollBg, border: '1px solid ' + scrollBorder, padding: '0.8rem', color: scrollText, textAlign: 'left' }}>
                                  <h4 style={{ fontSize: '0.75rem', fontFamily: 'var(--font-rpg)', borderBottom: '1px solid ' + (isStained ? '#441414' : '#33281e'), paddingBottom: '3px', marginBottom: '6px', color: scrollTitleColor, textTransform: 'uppercase', margin: 0 }}>
                                    {scrollTitle}
                                  </h4>
                                  <div style={{ fontSize: '0.7rem', lineHeight: '1.35', overflowY: 'auto', maxHeight: '100px', textAlign: 'justify', whiteSpace: 'pre-line' }} className="rpg-scrollbar">
                                    {legend.pedestalEulogy}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}`,
    replacement: `                    {(() => {
                      const sortedAll = [...pedestals].reverse();
                      const totalPages = Math.ceil(sortedAll.length / itemsPerPage);
                      const currentPage = Math.min(chroniclePage, Math.max(1, totalPages));
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const paginatedHeroes = sortedAll.slice(startIndex, startIndex + itemsPerPage);

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                          <div style={{ borderBottom: '1px dashed var(--color-relic-glow)', paddingBottom: '0.5rem', textAlign: 'center' }}>
                            <h4 className="gothic-title" style={{ fontSize: '1.4rem', color: 'var(--color-mana-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                              📜 ЛЕТОПИСЬ ИЗГНАННИКОВ (ХРОНИКА ВСЕХ ВРЕМЕН)
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase' }}>Деяния абсолютно всех ушедших духов в истории Абаддона</span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            {paginatedHeroes.map((legend, idx) => {
                              const isStained = legend.legacyStatus === 'stained';
                              const cardBorder = isStained 
                                ? 'linear-gradient(to bottom, #cf142b, #8b0000, #220000) 1'
                                : 'linear-gradient(to bottom, #d4af37, #aa820a, #1a1505) 1';
                              const cardShadow = isStained
                                ? '0 5px 15px rgba(139,0,0,0.3), inset 0 0 10px rgba(139,0,0,0.05)'
                                : '0 5px 15px rgba(0,0,0,0.6), inset 0 0 10px rgba(212,175,55,0.02)';
                              const icon = isStained ? '☠️' : '☀️';
                              const label = isStained ? 'ЗАПЯТНАННОЕ ИМЯ' : \`Искупленная Душа\`;
                              const titleColor = isStained ? '#ff4d4d' : '#ffb813';
                              const scrollBg = isStained
                                ? 'radial-gradient(circle, #1c0e0e 0%, #0d0505 100%)'
                                : 'radial-gradient(circle, #1a1613 0%, #0d0b09 100%)';
                              const scrollBorder = isStained ? '#5c1a1a' : '#4a3e31';
                              const scrollText = isStained ? '#dfc5c5' : '#cbbba5';
                              const scrollTitleColor = isStained ? '#ff4d4d' : '#ffb813';
                              const scrollTitle = isStained ? '📜 Печать Тлена / Летопись Падения:' : '📜 Летопись Искупления:';

                              return (
                                <div 
                                  key={legend.id || idx} 
                                  style={{
                                    background: '#0a080c',
                                    border: '2px solid',
                                    borderImage: cardBorder,
                                    padding: '1.2rem',
                                    boxShadow: cardShadow,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.8rem'
                                  }}
                                >
                                  <div style={{ borderBottom: '1px solid ' + (isStained ? '#5c1a1a' : '#4a3e31'), paddingBottom: '0.6rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                                      <span style={{ fontSize: '0.7rem', color: titleColor, fontFamily: 'var(--font-rpg)', fontWeight: 'bold' }}>{label}</span>
                                    </div>
                                    <h3 className="gothic-title" style={{ fontSize: '1.15rem', color: titleColor, marginTop: '4px', margin: 0 }}>
                                      {legend.name}
                                    </h3>
                                    {legend.nickname && (
                                      <div style={{ fontSize: '0.68rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', marginTop: '1px' }}>
                                        «{legend.nickname}»
                                      </div>
                                    )}
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginTop: '4px' }}>
                                      {legend.race} • {legend.class} • <b>Уровень {legend.level}</b>
                                    </div>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--color-bone-dim)', background: 'rgba(0,0,0,0.3)', padding: '6px', border: '1px solid var(--color-iron-light)', textAlign: 'left' }}>
                                    <div>📜 Квесты: <b>{legend.completedTasksCount || 0} шт</b></div>
                                    <div>👹 Боссы: <b>{legend.completedSiegesCount || 0} шт</b></div>
                                    <div>🪙 Золото: <b>{legend.totalGoldEarned || 0}</b></div>
                                    <div>🔮 Ур: <b>{legend.level || 1}</b></div>
                                  </div>

                                  <div style={{ background: scrollBg, border: '1px solid ' + scrollBorder, padding: '0.8rem', color: scrollText, textAlign: 'left' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontFamily: 'var(--font-rpg)', borderBottom: '1px solid ' + (isStained ? '#441414' : '#33281e'), paddingBottom: '3px', marginBottom: '6px', color: scrollTitleColor, textTransform: 'uppercase', margin: 0 }}>
                                      {scrollTitle}
                                    </h4>
                                    <div style={{ fontSize: '0.7rem', lineHeight: '1.35', overflowY: 'auto', maxHeight: '100px', textAlign: 'justify', whiteSpace: 'pre-line' }} className="rpg-scrollbar">
                                      {legend.pedestalEulogy}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                              <button
                                className="rpg-btn"
                                disabled={currentPage === 1}
                                onClick={() => { playClick(); setChroniclePage(p => Math.max(1, p - 1)); }}
                                style={{ fontFamily: 'var(--font-rpg)', fontSize: '0.8rem', padding: '6px 15px' }}
                              >
                                ◀ Предыдущая Эпоха
                              </button>
                              
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-rpg)' }}>
                                Эпоха <b style={{ color: 'var(--color-relic-glow)' }}>{currentPage}</b> из <b>{totalPages}</b>
                              </span>

                              <button
                                className="rpg-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => { playClick(); setChroniclePage(p => Math.min(totalPages, p + 1)); }}
                                style={{ fontFamily: 'var(--font-rpg)', fontSize: '0.8rem', padding: '6px 15px' }}
                              >
                                Следующая Эпоха ▶
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}`
  },
  // 4. Modal placement
  {
    target: `        </div>
      )}
    </div>
  );
}`,
    replacement: `        </div>
      )}
      {/* Recap Gothic Modal Overlay */}
      {recapEnemy && (
        <div className="gothic-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10,3,3,0.92)', zIndex: 2000 }} onClick={() => setRecapEnemy(null)}>
          <div className="gothic-modal-content" style={{ maxWidth: '550px', width: '90%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', border: '2px solid var(--color-blood)', background: 'linear-gradient(180deg, #150909 0%, #080303 100%)', padding: '2rem', boxShadow: '0 0 25px rgba(139,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
            <button 
              className="gothic-close-btn"
              onClick={() => setRecapEnemy(null)} 
              style={{ position: 'absolute', top: '12px', right: '15px', background: 'none', border: 'none', color: '#ff3333', fontSize: '1.4rem', cursor: 'pointer', outline: 'none' }}
            >
              ✕
            </button>
            <div style={{ borderBottom: '1px solid rgba(255,51,51,0.2)', paddingBottom: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem' }}>{recapEnemy.enemyIcon || '👹'}</span>
              <h3 className="gothic-title" style={{ fontSize: '1.35rem', color: 'var(--color-blood-glow)', margin: '0.3rem 0 0 0' }}>
                Триумф над: {recapEnemy.enemyName}
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Рекап священной схватки • {recapEnemy.date}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: '#eeddbb' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px solid var(--color-iron-light)', borderRadius: '3px' }}>
                <div><strong>📜 Контракт:</strong> «{recapEnemy.taskTitle}»</div>
                <div><strong>⚔️ Тип сражения:</strong> {recapEnemy.taskType === 'siege' ? 'Осада крепости (Босс)' : 'Охота на монстра'}</div>
                <div><strong>⌛ Затраченное время:</strong> {recapEnemy.pomodoroTime || 25} минут</div>
              </div>

              {recapEnemy.steps && recapEnemy.steps.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-rpg)', letterSpacing: '0.5px' }}>Выполненные шаги квеста:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'rgba(0,0,0,0.4)', padding: '0.6rem 0.8rem', border: '1px solid rgba(255,255,255,0.03)', marginTop: '0.3rem', borderRadius: '3px' }}>
                    {recapEnemy.steps.map((st, sIdx) => (
                      <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: st.completed ? '#2ecc71' : 'var(--color-bone-dim)' }}>
                        <span>{st.completed ? '🟢 [x]' : '🔴 [ ]'}</span>
                        <span style={{ textDecoration: st.completed ? 'none' : 'line-through' }}>{st.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recapEnemy.victoryChronicle && (
                <div style={{ background: 'radial-gradient(circle, #1a1012 0%, #0c0506 100%)', border: '1px solid #5c1a1a', padding: '0.8rem 1.2rem', color: '#dfc5c5', fontStyle: 'italic', lineHeight: '1.4', fontFamily: 'Georgia, serif', textAlign: 'justify', whiteSpace: 'pre-line', borderRadius: '3px' }}>
                  <h4 style={{ fontSize: '0.72rem', color: 'var(--color-blood-glow)', textTransform: 'uppercase', margin: '0 0 6px 0', borderBottom: '1px solid rgba(255,51,51,0.15)', paddingBottom: '3px', fontFamily: 'var(--font-rpg)' }}>
                    📖 Запись Летописца Бездны:
                  </h4>
                  {recapEnemy.victoryChronicle}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                className="rpg-btn" 
                style={{ padding: '6px 20px', fontFamily: 'var(--font-rpg)', fontSize: '0.8rem' }}
                onClick={() => setRecapEnemy(null)}
              >
                ЗАКРЫТЬ ФОЛИАНТ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`
  }
];

// Run CharacterSheet.jsx patch
patchFile(sheetPath, sheetReplacements);

console.log("All precision patching complete successfully!");
