const fs = require('fs');
const path = require('path');

console.log("Starting Abaddon Task Manager Patching Script...");

// File 1: App.jsx
const appPath = path.join(__dirname, '../src/App.jsx');
if (fs.existsSync(appPath)) {
  let content = fs.readFileSync(appPath, 'utf8');

  // Update Daily Judgment failure HP damage for survival tasks
  const failDmgTarget = `                       setCharacter(c => ({
                         ...c,
                         hp: Math.max(10, c.hp - 10),
                         moralCompass: Math.max(0, (c.moralCompass || 50) - 10),
                         totalHpSacrificed: (c.totalHpSacrificed || 0) + 10
                       }));`;

  const failDmgReplacement = `                       const currentTask = judgmentTasks[judgmentIndex];
                       const hpDmg = currentTask?.isSurvival ? 30 : 10;
                       setCharacter(c => ({
                         ...c,
                         hp: Math.max(1, c.hp - hpDmg),
                         moralCompass: Math.max(0, (c.moralCompass || 50) - 10),
                         totalHpSacrificed: (c.totalHpSacrificed || 0) + hpDmg
                       }));`;

  if (content.includes(failDmgTarget)) {
    content = content.replace(failDmgTarget, failDmgReplacement);
    console.log("✔ App.jsx failure damage updated!");
  } else {
    console.log("❌ App.jsx failure damage target not found!");
  }

  // Update Daily Judgment message box text
  const msgTarget = `                  💥 Вы теряете 10 HP здоровья разума! <br />`;
  const msgReplacement = `                  💥 Вы теряете {judgmentTasks[judgmentIndex]?.isSurvival ? 30 : 10} HP здоровья разума! <br />`;
  if (content.includes(msgTarget)) {
    content = content.replace(msgTarget, msgReplacement);
    console.log("✔ App.jsx warning message text updated!");
  }

  fs.writeFileSync(appPath, content, 'utf8');
} else {
  console.log("❌ App.jsx not found!");
}

// File 2: CarriageSession.jsx
const sessionPath = path.join(__dirname, '../src/components/CarriageSession.jsx');
if (fs.existsSync(sessionPath)) {
  let content = fs.readFileSync(sessionPath, 'utf8');

  // 1. Add prep states
  const stateTarget = `  const [isSurvivalModeActive, setIsSurvivalModeActive] = useState(false);`;
  const stateReplacement = `  const [isSurvivalModeActive, setIsSurvivalModeActive] = useState(false);

  // Prep modal states
  const [prepModalOpen, setPrepModalOpen] = useState(false);
  const [prepTask, setPrepTask] = useState(null);
  const [prepActionInput, setPrepActionInput] = useState('');
  const [prepTimerActive, setPrepTimerActive] = useState(false);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(100);
  const [prepChosenMode, setPrepChosenMode] = useState('timer');
  const [prepCallback, setPrepCallback] = useState(null);`;

  if (content.includes(stateTarget)) {
    content = content.replace(stateTarget, stateReplacement);
    console.log("✔ CarriageSession.jsx prep states added!");
  }

  // 2. Add prep timer useEffect
  const syncEffectTarget = `  useEffect(() => {
    if (onStateSync) {
      onStateSync({ activeTask, timeLeft, isRunning });
    }
  }, [activeTask, timeLeft, isRunning, onStateSync]);`;

  const syncEffectReplacement = `  useEffect(() => {
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
  }, [prepModalOpen, prepTimerActive, prepSecondsLeft]);`;

  if (content.includes(syncEffectTarget)) {
    content = content.replace(syncEffectTarget, syncEffectReplacement);
    console.log("✔ CarriageSession.jsx prep countdown effect added!");
  }

  // 3. Intercept handleStartCombatSession with prep modal
  const interceptTarget = `    if (!task.executionMode || task.executionMode === 'ask_later') {
      requestTaskExecutionModeSelect(task, (chosenMode) => {
        runStart(chosenMode);
      });
    } else {
      runStart(task.executionMode);
    }`;

  const interceptReplacement = `    const triggerPrep = (mode) => {
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
    }`;

  if (content.includes(interceptTarget)) {
    content = content.replace(interceptTarget, interceptReplacement);
    console.log("✔ CarriageSession.jsx handleStartCombatSession intercepted!");
  }

  // 4. Update handleInstantCompleteTask to save defeated enemies
  const instantTarget = `    setCharacter(prev => {
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
    localStorage.removeItem('combat_chosen_mode');
    localStorage.removeItem('combat_is_survival');
    setIsSurvivalModeActive(false);

    setSetupStage('resolution');
    setResolutionType('victory');
    handleGenerateResolutionChronicle('victory', task, eName, isAmbush, randNpc.name);`;

  const instantReplacement = `    const isSurvival = task.isSurvival;
    let finalExp = expReward;
    let finalGoldReward = goldReward;
    if (isSurvival) {
      finalExp *= 2;
      finalGoldReward *= 2;
    }

    const today = new Date();
    const formattedDate = \`\${String(today.getDate()).padStart(2, '0')}.\${String(today.getMonth() + 1).padStart(2, '0')}.\${today.getFullYear()}\`;
    const newDefeatId = \`defeat-\${Date.now()}-\${Math.random().toString(36).substr(2, 4)}\`;

    // Map instant steps as all completed
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

    let earnedGold = 0;

    setCharacter(prev => {
      const nextXp = prev.xp + finalExp;
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

      earnedGold = finalGoldReward + extraGold;

      const updatedBio = [...(prev.biography || [])];
      const survivalText = isSurvival ? ' (Вопрос жизни и смерти: x2 награды!)' : '';
      if (isAmbush) {
        updatedBio.push(\`На месте встречи Изгнанник обнаружил лишь растерзанное тело \${randNpc.name}. Ему пришлось вступить в бой с устроившими засаду бандитами Бездны. Разбойники перебиты, с их тел снято +10 XP и +\${earnedGold} Золота.\${survivalText}\`);
      } else {
        updatedBio.push(\`Выполнен контракт: "\${task.title}". Встречен \${randNpc.name}. Получено +\${finalExp} XP и +\${earnedGold} Золота.\${survivalText}\`);
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
    handleGenerateResolutionChronicle('victory', task, eName, isAmbush, randNpc.name, newDefeatId);`;

  if (content.includes(instantTarget)) {
    content = content.replace(instantTarget, instantReplacement);
    console.log("✔ CarriageSession.jsx handleInstantCompleteTask updated!");
  } else {
    console.log("❌ CarriageSession.jsx handleInstantCompleteTask target NOT found!");
  }

  // 5. Update rescheduling penalty inside handleRescheduleTomorrow
  const rescheduleTomorrowTarget = `  const handleRescheduleTomorrow = (task) => {
    playClick();
    const tomorrowStr = getVirtualTomorrowStr();
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, date: tomorrowStr } : t));
    spawnFloater("На завтра", "heal-hp");
  };`;

  const rescheduleTomorrowReplacement = `  const handleRescheduleTomorrow = (task) => {
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
  };`;

  if (content.includes(rescheduleTomorrowTarget)) {
    content = content.replace(rescheduleTomorrowTarget, rescheduleTomorrowReplacement);
    console.log("✔ CarriageSession.jsx reschedule tomorrow updated!");
  }

  // 6. Update failure damage inside handleFlee and timer countdown
  content = content.replace(
    `const dmg = isSurvivalModeActive ? 30 : 15;`,
    `const dmg = (isSurvivalModeActive || activeTask?.isSurvival) ? 30 : 15;`
  );
  console.log("✔ CarriageSession.jsx flee survival dmg updated!");

  content = content.replace(
    `const dmg = isSurvivalModeActive ? 30 : 15;`, // next tick deadline damage
    `const dmg = (isSurvivalModeActive || activeTask?.isSurvival) ? 30 : 15;`
  );
  content = content.replace(
    `spawnFloater(isSurvivalModeActive ? "-30 HP!" : "-15 HP!", "enemy-strike");`,
    `spawnFloater((isSurvivalModeActive || activeTask?.isSurvival) ? "-30 HP!" : "-15 HP!", "enemy-strike");`
  );
  content = content.replace(
    `💥 [Дедлайн] Время истекло! Противник \${enemyName} наносит вам сокрушительный удар на \${isSurvivalModeActive ? 30 : 15} HP за опоздание!`,
    `💥 [Дедлайн] Время истекло! Противник \${enemyName} наносит вам сокрушительный удар на \${(isSurvivalModeActive || activeTask?.isSurvival) ? 30 : 15} HP за опоздание!`
  );
  console.log("✔ CarriageSession.jsx tick deadline survival dmg updated!");

  // 7. Inject red prep modal and survival badge in CarriageSession layout
  // We place survival badge in gothic-fate-card badges row
  const cardBadgesRow = `                      {task.executionMode && task.executionMode !== 'ask_later' && (`;
  const cardBadgesRowReplacement = `                      {task.isSurvival && (
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
                      {task.executionMode && task.executionMode !== 'ask_later' && (`;

  if (content.includes(cardBadgesRow)) {
    content = content.replace(cardBadgesRow, cardBadgesRowReplacement);
    console.log("✔ CarriageSession.jsx survival badges injected!");
  }

  // We place prep modal right next to other modals inside return wrapper
  const modalPlacement = `{/* Screen Flash overlays */}`;
  const prepModalCode = `{prepModalOpen && (
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
        {/* Screen Flash overlays */}
        `;

  if (content.includes(modalPlacement)) {
    content = content.replace(modalPlacement, prepModalCode);
    console.log("✔ CarriageSession.jsx prep modal injected!");
  }

  fs.writeFileSync(sessionPath, content, 'utf8');
} else {
  console.log("❌ CarriageSession.jsx not found!");
}

// File 3: TweekPlanner.jsx
const plannerPath = path.join(__dirname, '../src/components/TweekPlanner.jsx');
if (fs.existsSync(plannerPath)) {
  let content = fs.readFileSync(plannerPath, 'utf8');

  // 1. Add manual survival state variables
  const pStateTarget = `  const [isLongJourney, setIsLongJourney] = useState(false);`;
  const pStateReplacement = `  const [isLongJourney, setIsLongJourney] = useState(false);
  const [isSurvivalMode, setIsSurvivalMode] = useState(false);
  const [isChaosSurvivalMode, setIsChaosSurvivalMode] = useState(false);
  const [editIsSurvival, setEditIsSurvival] = useState(false);`;

  if (content.includes(pStateTarget)) {
    content = content.replace(pStateTarget, pStateReplacement);
    console.log("✔ TweekPlanner.jsx survival state variables added!");
  }

  // 2. Inject isSurvival in handleCreateTask
  const cTaskTarget = `      isLongJourney: isLongJourney
    };`;
  const cTaskReplacement = `      isLongJourney: isLongJourney,
      isSurvival: isSurvivalMode
    };`;
  if (content.includes(cTaskTarget)) {
    content = content.replace(cTaskTarget, cTaskReplacement);
    console.log("✔ TweekPlanner.jsx handleCreateTask isSurvival injected!");
  }

  // Preserve isSurvival inside adaptation split tasks
  content = content.replace(
    `            isLongJourney: false\n          });\n          finalTasks.push({\n            ...newTask,\n            id: \`task-\${Date.now()}-2\`,\n            title: \`\${title} (Часть II: Завершение)\`,`,
    `            isLongJourney: false,\n            isSurvival: newTask.isSurvival\n          });\n          finalTasks.push({\n            ...newTask,\n            id: \`task-\${Date.now()}-2\`,\n            title: \`\${title} (Часть II: Завершение)\`,`
  );
  content = content.replace(
    `            isLongJourney: false,\n            date: dateStr\n          });`,
    `            isLongJourney: false,\n            isSurvival: newTask.isSurvival,\n            date: dateStr\n          });`
  );
  content = content.replace(
    `            isLongJourney: false\n          });\n        } else {`,
    `            isLongJourney: false,\n            isSurvival: newTask.isSurvival\n          });\n        } else {`
  );
  content = content.replace(
    `            isLongJourney: isLongJourney\n          });`,
    `            isLongJourney: isLongJourney,\n            isSurvival: newTask.isSurvival\n          });`
  );
  console.log("✔ TweekPlanner.jsx split and postponed tasks survival preserved!");

  // Reset isSurvivalMode in handleCreateTask
  const resetTarget = `        setIsLongJourney(false);\n        playSuccess();`;
  const resetReplacement = `        setIsLongJourney(false);\n        setIsSurvivalMode(false);\n        playSuccess();`;
  if (content.includes(resetTarget)) {
    content = content.replace(resetTarget, resetReplacement);
  }
  content = content.replace(
    `    const wasLong = isLongJourney;\n    setIsLongJourney(false); // reset`,
    `    const wasLong = isLongJourney;\n    setIsLongJourney(false); // reset\n    setIsSurvivalMode(false);`
  );
  console.log("✔ TweekPlanner.jsx survival resets added!");

  // 3. Inject isSurvival in Chaos Dump Parse
  const chaosTarget = `            isLongJourney: t.isLongJourney || false,`;
  const chaosReplacement = `            isLongJourney: t.isLongJourney || false,
            isSurvival: isChaosSurvivalMode,`;
  if (content.includes(chaosTarget)) {
    content = content.replace(chaosTarget, chaosReplacement);
    console.log("✔ TweekPlanner.jsx chaos dump survival injected!");
  }
  
  // Reset chaos survival mode
  const chaosReset = `        setChaosText('');\n        setChaosDumpOpen(false);`;
  const chaosResetReplacement = `        setChaosText('');\n        setChaosDumpOpen(false);\n        setIsChaosSurvivalMode(false);`;
  if (content.includes(chaosReset)) {
    content = content.replace(chaosReset, chaosResetReplacement);
  }

  // 4. Update individual task rescheduling HP penalty under isSurvival
  const rescheduleTarget = `      setCharacter(prev => ({
        ...prev,
        hp: Math.max(1, prev.hp - 2),
        totalHpSacrificed: (prev.totalHpSacrificed || 0) + 2
      }));`;
  
  const rescheduleReplacement = `      const hpPenalty = targetTask.isSurvival ? 15 : 2;
      setCharacter(prev => ({
        ...prev,
        hp: Math.max(1, prev.hp - hpPenalty),
        totalHpSacrificed: (prev.totalHpSacrificed || 0) + hpPenalty
      }));`;

  if (content.includes(rescheduleTarget)) {
    content = content.replace(rescheduleTarget, rescheduleReplacement);
    console.log("✔ TweekPlanner.jsx rescheduling HP penalty updated!");
  }

  const rescheduleMsgTarget = `      setRitualMessage(\`💀 Задача «\${targetTask.title}» изгнана \${destLabel}! Потеряно 2 HP. Скверна задачи возросла.\`);`;
  const rescheduleMsgReplacement = `      setRitualMessage(\`💀 Задача «\${targetTask.title}» изгнана \${destLabel}! Потеряно \${hpPenalty} HP. Скверна задачи возросла.\`);`;
  if (content.includes(rescheduleMsgTarget)) {
    content = content.replace(rescheduleMsgTarget, rescheduleMsgReplacement);
  }

  // 5. Inject isSurvival checkbox in manual task creation form
  const formCheckboxTarget = `          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-bone-dim)' }}>
              <input
                type="checkbox"
                checked={isLongJourney}
                onChange={(e) => setIsLongJourney(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-blood)', cursor: 'pointer' }}
              />
              <span>Длительное путешествие</span>
            </label>
          </div>`;

  const formCheckboxReplacement = `          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
          </div>`;

  if (content.includes(formCheckboxTarget)) {
    content = content.replace(formCheckboxTarget, formCheckboxReplacement);
    console.log("✔ TweekPlanner.jsx manual form checkbox injected!");
  }

  // 6. Inject isSurvival checkbox in Chaos Dump form modal
  const chaosCheckboxTarget = `            <textarea
              className="rpg-input"
              style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontSize: '0.92rem', background: 'rgba(10,5,15,0.6)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', lineHeight: '1.4' }}
              placeholder="Например: мне надо помыть посуду, но блин раковина полная и воняет, это пипец страшно начать. Еще сдать проект заказчику до среды, там куча мелких правок, надо написать тесты и проверить сборку, это огромная осада! Еще купить корм коту, это быстро."
              value={chaosText}
              onChange={(e) => setChaosText(e.target.value)}
              disabled={chaosLoading}
            />`;

  const chaosCheckboxReplacement = `            <textarea
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
            </div>`;

  if (content.includes(chaosCheckboxTarget)) {
    content = content.replace(chaosCheckboxTarget, chaosCheckboxReplacement);
    console.log("✔ TweekPlanner.jsx chaos dump checkbox injected!");
  }

  // 7. Inject survival badge inside renderTaskTitle
  const titleTarget = `  const renderTaskTitle = (task, fontSize = '0.9rem') => {
    return (
      <span style={{ fontSize, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
        {task.title}`;

  const titleReplacement = `  const renderTaskTitle = (task, fontSize = '0.9rem') => {
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
        )}`;

  if (content.includes(titleTarget)) {
    content = content.replace(titleTarget, titleReplacement);
    console.log("✔ TweekPlanner.jsx title survival badge injected!");
  }

  // 8. Add task editing survival support
  const editOpenTarget = `    setEditDeadline(task.deadline || '');`;
  const editOpenReplacement = `    setEditDeadline(task.deadline || '');
    setEditIsSurvival(task.isSurvival || false);`;
  if (content.includes(editOpenTarget)) {
    content = content.replace(editOpenTarget, editOpenReplacement);
  }

  const editSaveTarget = `      nature: editNature,
      executionMode: editExecutionMode,
      deadline: editDeadline
    } : t));`;
  const editSaveReplacement = `      nature: editNature,
      executionMode: editExecutionMode,
      deadline: editDeadline,
      isSurvival: editIsSurvival
    } : t));`;
  if (content.includes(editSaveTarget)) {
    content = content.replace(editSaveTarget, editSaveReplacement);
    console.log("✔ TweekPlanner.jsx task editor survival saved!");
  }

  // Render checkbox in task editor modal
  const editModalTarget = `                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>СРОК (ДЕДЛАЙН)</label>
                    <input 
                      type="text" 
                      className="rpg-input" 
                      style={{ width: '100%', fontSize: '0.9rem' }} 
                      placeholder="Например: до 18:00, через 2 дня"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                    />
                  </div>`;
  const editModalReplacement = `                  <div>
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
                  </label>`;

  if (content.includes(editModalTarget)) {
    content = content.replace(editModalTarget, editModalReplacement);
    console.log("✔ TweekPlanner.jsx editor modal checkbox injected!");
  }

  fs.writeFileSync(plannerPath, content, 'utf8');
} else {
  console.log("❌ TweekPlanner.jsx not found!");
}

// File 4: CharacterSheet.jsx
const sheetPath = path.join(__dirname, '../src/components/CharacterSheet.jsx');
if (fs.existsSync(sheetPath)) {
  let content = fs.readFileSync(sheetPath, 'utf8');

  // 1. Add recapEnemy and chroniclePage state variables
  const sStateTarget = `  const [selectedTask, setSelectedTask] = useState(null);`;
  const sStateReplacement = `  const [selectedTask, setSelectedTask] = useState(null);
  const [recapEnemy, setRecapEnemy] = useState(null);
  const [chroniclePage, setChroniclePage] = useState(1);
  const itemsPerPage = 5;`;

  if (content.includes(sStateTarget)) {
    content = content.replace(sStateTarget, sStateReplacement);
    console.log("✔ CharacterSheet.jsx bestiary states added!");
  }

  // 2. Inject Bestiary (Книга Поверженных Тварей) in left column under visual inventory backpack
  const backpackEnd = `            </div>
          </div>
        </div>

              </div>`;

  const bestiaryCode = `            </div>
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
        </div>

              </div>`;

  if (content.includes(backpackEnd)) {
    content = content.replace(backpackEnd, bestiaryCode);
    console.log("✔ CharacterSheet.jsx bestiary panel injected!");
  } else {
    console.log("❌ CharacterSheet.jsx visual inventory backpack end mismatch!");
  }

  // 3. Inject Recap gothic modal at the bottom of the return statement
  const renderEnd = `    </div>
  );
}`;
  
  const recapModalCode = `      {/* Recap Gothic Modal Overlay */}
      {recapEnemy && (
        <div className="gothic-modal-overlay" onClick={() => setRecapEnemy(null)}>
          <div className="gothic-modal-content" style={{ maxWidth: '550px', width: '90%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', border: '2px solid var(--color-blood)', boxShadow: '0 0 25px rgba(139,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
            <button 
              className="gothic-close-btn"
              onClick={() => setRecapEnemy(null)} 
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ff3333', fontSize: '1.2rem', cursor: 'pointer', outline: 'none' }}
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
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px solid var(--color-iron-light)' }}>
                <div><strong>📜 Контракт:</strong> «{recapEnemy.taskTitle}»</div>
                <div><strong>⚔️ Тип сражения:</strong> {recapEnemy.taskType === 'siege' ? 'Осада крепости (Босс)' : 'Охота на монстра'}</div>
                <div><strong>⌛ Затраченное время:</strong> {recapEnemy.pomodoroTime || 25} минут</div>
              </div>

              {recapEnemy.steps && recapEnemy.steps.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-rpg)', letterSpacing: '0.5px' }}>Выполненные шаги квеста:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'rgba(0,0,0,0.4)', padding: '0.6rem 0.8rem', border: '1px solid rgba(255,255,255,0.03)', marginTop: '0.3rem' }}>
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
                <div style={{ background: 'radial-gradient(circle, #1a1012 0%, #0c0506 100%)', border: '1px solid #5c1a1a', padding: '0.8rem 1.2rem', color: '#dfc5c5', fontStyle: 'italic', lineHeight: '1.4', fontFamily: 'Georgia, serif', textAlign: 'justify', whiteSpace: 'pre-line' }}>
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
}`;

  if (content.includes(renderEnd)) {
    content = content.replace(renderEnd, recapModalCode);
    console.log("✔ CharacterSheet.jsx recap modal overlay added!");
  }

  // 4. Implement paginated Chronicle of Exiles below other legends in sheetTab === 'pedestals'
  const restSpiritsTarget = `                    {rest.length > 0 && (
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
                    )}`;

  const paginatedChronicleReplacement = `                    {(() => {
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
                    })()}`;

  if (content.includes(restSpiritsTarget)) {
    content = content.replace(restSpiritsTarget, paginatedChronicleReplacement);
    console.log("✔ CharacterSheet.jsx exiles chronicle paginated!");
  } else {
    console.log("❌ CharacterSheet.jsx restSpiritsTarget mismatched!");
  }

  fs.writeFileSync(sheetPath, content, 'utf8');
} else {
  console.log("❌ CharacterSheet.jsx not found!");
}

console.log("Patching complete!");
