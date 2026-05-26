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

const maleNames = [
  "Аларик", "Брандон", "Дариан", "Эверон", "Конрад", "Мордекай", "Освальд", "Рагнар", "Ульрих", "Виктор", "Бьерн", "Лотар", "Адриан", "Калеб"
];

const femaleNames = [
  "Аэлис", "Брюнхильда", "Гвендолин", "Изольда", "Лилит", "Морриган", "Сибилла", "Талия", "Урсула", "Элеонора", "Кира", "Ингрид", "Лира", "Селена"
];

export function rollStartingCharacter(pedestals = []) {
  // 1. Roll Race based on percentage drop rates
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
    race = "Каргахаулец (Бледный гигант)"; // 5% chance: Very Rare!
  }

  // 2. Roll Class based on percentage drop rates
  const classRoll = Math.random() * 100;
  let chosenClass = "";
  
  if (classRoll < 60) {
    // Common Classes (60% total chance)
    const commons = [
      "Маг огня", "Маг земли", "Маг камня", "Маг молнии",
      "Дикий Рыцарь", "Наемник Военной Банды", "Бывший Рыцарь",
      "Рыцарь-Убийца", "Рыцарь Чумной Стали", "Отреченный Паладин",
      "Мятежник Изгоев (Бандит)", "Головорез Чумных Земель (Бандит)",
      "Каратель Багрового Ордена", "Храмовник Пепла"
    ];
    chosenClass = commons[Math.floor(Math.random() * commons.length)];
  } else if (classRoll < 90) {
    // Rare Classes (30% total chance)
    const rares = [
      "Маг огня и камня (Мультикласс)", "Маг молнии и земли (Мультикласс)",
      "Некромант", "Рунный маг", "Маг света", "Маг тьмы", "Маг бездны",
      "Маг меток (Сфрагист) [РЕДКОЕ]"
    ];
    chosenClass = rares[Math.floor(Math.random() * rares.length)];
  } else if (classRoll < 97) {
    // Epic / Very Rare Class (7% total chance)
    chosenClass = "Химомансер (Маг крови) [РЕДКОЕ]";
  } else {
    // Legendary / Ultra-Rare Classes (3% total chance)
    const legendaries = [
      "Ментальный Суверен (Телекинетик) [УЛЬТРА-РЕДКОЕ]",
      "Плазмомансер (Эфирный ткач) [УЛЬТРА-РЕДКОЕ]"
    ];
    chosenClass = legendaries[Math.floor(Math.random() * legendaries.length)];
  }

  // Generate Base Name
  const allNames = [...maleNames, ...femaleNames];
  const baseName = allNames[Math.floor(Math.random() * allNames.length)];
  let nickname = "";
  let pedigreeDesc = "";
  let baseHp = 100;
  let baseMana = 50;
  let baseGold = 0;
  
  const perks = startingPerks[chosenClass] ? [...startingPerks[chosenClass]] : ["Случайная стойкость"];

  // Process Heritage from Pedestals
  const lastLegend = pedestals && pedestals.length > 0 ? pedestals[pedestals.length - 1] : null;
  if (lastLegend) {
    if (lastLegend.legacyStatus === 'stained') {
      // Previous hero died or surrendered!
      nickname = `Тень Падшего ${lastLegend.name}`;
      pedigreeDesc = `Несет бремя позора предка, ${lastLegend.name} (${lastLegend.class}), погибшего во рвах Абаддона. Враги будут глумиться над вашей слабостью.`;
      
      // Penalty: -10 HP, bonus to Mana
      baseHp = 90;
      baseMana = 60;
      
      // Add custom Mark of Shame starting perk/trait
      perks.push("Печать Позора (Травма предка: -10 HP, +10 RP маны)");
    } else if (lastLegend.legacyStatus === 'sanctified') {
      // Previous hero won!
      nickname = `Наследник Освященного ${lastLegend.name}`;
      pedigreeDesc = `Потомок великого ${lastLegend.name} (${lastLegend.class}), одолевшего Скверну Абаддона и стяжавшего вечную славу. Его путь благословлен предками.`;
      
      // Reward: +10 HP, +50 Gold
      baseHp = 110;
      baseGold = 50;
      
      // Add custom starting trait
      perks.push("Оберег Благословенных (Наследие славы: +10 HP, +50 золота)");
    } else {
      nickname = `Преемник ${lastLegend.name}`;
      pedigreeDesc = `Продолжатель пути ${lastLegend.name}.`;
    }
  } else {
    nickname = "Первый Изгнанник";
    pedigreeDesc = "Первопроходец Бездны. Его роду еще предстоит вписать свои имена в летописи.";
  }

  const startingBio = `Родился под знаком Бездны как ${race} (${chosenClass}). Ступил на путь когнитивного искупления в Абаддоне, неся напутствие рода: "${nickname} — ${pedigreeDesc.split('.')[0]}."`;

  return {
    name: baseName,
    nickname: nickname,
    pedigreeDesc: pedigreeDesc,
    race: race,
    class: chosenClass,
    level: 1,
    xp: 0,
    hp: baseHp,
    maxHp: baseHp,
    mana: baseMana,
    maxMana: baseMana,
    gold: baseGold,
    equipped: { weapon: null, shield: null, armor: null, ring: null },
    inventory: [],
    perks: perks,
    shacklesBroken: false,
    intensity: "grim",
    completedTasksCount: 0,
    completedSiegesCount: 0,
    totalGoldEarned: baseGold,
    totalManaSpent: 0,
    totalHpSacrificed: 0,
    potionsDrunk: 0,
    meditationsCount: 0,
    biography: [startingBio]
  };
}

export const merchantItems = [
  { id: 'item_dagger', name: 'Кинжал Отсечения Долгов', slot: 'weapon', price: 10, bonus: '+15% к скорости Охоты', icon: '🗡️' },
  { id: 'item_sword', name: 'Палаш Кровавого Алтаря', slot: 'weapon', price: 25, bonus: '+25% к сбору Золота', icon: '⚔️' },
  { id: 'item_shield', name: 'Рунический Эгис Файрвола', slot: 'shield', price: 15, bonus: '+10 HP при отходе', icon: '🛡️' },
  { id: 'item_armor', name: 'Мантия Безмятежности', slot: 'armor', price: 30, bonus: '+25 к Макс HP', icon: '👘' },
  { id: 'item_ring', name: 'Перстень Допаминовой Сети', slot: 'ring', price: 20, bonus: '+5 RP за микро-действия', icon: '💍' },
  { id: 'item_potion', name: 'Зелье Когнитивной Выносливости', slot: 'potion', price: 8, bonus: 'Мгновенный сброс 60м усталости, лечит 25 HP', icon: '🧪' }
];

