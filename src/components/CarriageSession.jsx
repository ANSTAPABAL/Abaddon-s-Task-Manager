import React, { useState, useEffect, useRef } from 'react';
import { 
  Skull, AlertTriangle, ChevronRight, Zap, RefreshCw, X, AlertCircle, 
  Shield, Sword, Heart, Flame, Sparkles, BatteryCharging, Coffee, 
  Timer, Award, Compass, Eye, BookOpen, Volume2 
} from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import { rollStartingCharacter } from '../utils/characterUtils';
import { getVirtualTodayStr, getVirtualTomorrowStr, parseDeadlineTextToDate } from '../utils/dateUtils';

// Список 50 уникальных вариаций когнитивной борьбы Бездны (ADHD-аспекты)
const COMBAT_VARIATIONS = [
  { type: "схватка", icon: "⚔️", prefix: "Палач", suffix: "Апатии", desc: "Мрачный палач в капюшоне, готовый отсечь вашу мотивацию." },
  { type: "руна", icon: "🔮", prefix: "Еретик", suffix: "Откладывания", desc: "Темный сектант, плетущий заклятия лени вокруг вашего сознания." },
  { type: "ритуал", icon: "🕯️", prefix: "Чернокнижник", suffix: "Тревожности", desc: "Маг Бездны, сковывающий ваши мысли ритуалами паники." },
  { type: "заклятье", icon: "✨", prefix: "Ассасин", suffix: "Прокрастинации", desc: "Убийца из ордена тени, бесшумно ворующий драгоценные минуты." },
  { type: "погоня", icon: "🐕", prefix: "Надзиратель", suffix: "Ускользающего Времени", desc: "Быстрый следопыт империи смерти, преследующий ваши дедлайны." },
  { type: "побег", icon: "⛓️", prefix: "Каргахаульский", suffix: "Тюремщик", desc: "Тяжеловооруженный воин с цепями, мешающий вам сделать шаг." },
  { type: "потасовка", icon: "👹", prefix: "Болотный", suffix: "Гладиатор", desc: "Огромный боец арены, швыряющий в вас комьями нудной рутины." },
  { type: "драка", icon: "🕷️", prefix: "Алхимик", suffix: "Забывчивости", desc: "Безумный отравитель, распыляющий токсины забытья." },
  { type: "засада", icon: "🏹", prefix: "Мародер", suffix: "Внешнего Шума", desc: "Стрелок засыпает вас стрелами уведомлений и сообщений." },
  { type: "наблюдение", icon: "👁️", prefix: "Инквизитор", suffix: "Ока Истины", desc: "Суровый следователь, высматривающий малейшие ошибки в работе." },
  { type: "событие", icon: "🩸", prefix: "Жрец", suffix: "Ментального Саботажа", desc: "Служитель хаоса, призывающий вас отдаться допаминовому голоду." },
  { type: "бой", icon: "🤺", prefix: "Рыцарь", suffix: "Ненужного Перфекционизма", desc: "Паладин в сияющих латах, требующий идеальности каждого шага." },
  { type: "дуэль", icon: "⚔️", prefix: "Теневой", suffix: "Дуэлянт", desc: "Ваш собственный двойник из зеркала, упрекающий за прошлые ошибки." },
  { type: "осада", icon: "🏰", prefix: "Командор", suffix: "Громоздких Сборок", desc: "Тяжелый рыцарь-командир крепости, заслоняющий проход щитом." },
  { type: "вылазка", icon: "🚶", prefix: "Разбойник", suffix: "Сомнений", desc: "Вор в кожаной маске, крадущий вашу уверенность в своих силах." },
  { type: "охота", icon: "🦅", prefix: "Ведьма", suffix: "Поверхностного Внимания", desc: "Кричащая колдунья, заставляющая фокус скакать с темы на тему." },
  { type: "изгнание", icon: "🎭", prefix: "Демонолог", suffix: "Страха", desc: "Маг, раздувающий мелкие риски до размеров катастрофы." },
  { type: "пакт", icon: "📜", prefix: "Глашатай", suffix: "Дедлайна", desc: "Вестник суда с песочными часами, отбивающий секунды разума." },
  { type: "алтарь", icon: "🪦", prefix: "Некромант", suffix: "Хаотичных Мыслей", desc: "Чародей мертвых, перегружающий оперативную память мозга." },
  { type: "проклятие", icon: "☣️", prefix: "Чумной", suffix: "Доктор", desc: "Странный лекарь в маске птицы, парализующий волю к старту." },
  { type: "ловушка", icon: "🕸️", prefix: "Иллюзионист", suffix: "Уныния", desc: "Мистик, делающий любую задачу невероятно пресной и скучной." },
  { type: "склеп", icon: "⚰️", prefix: "Могильщик", suffix: "Старых Долгов", desc: "Сгорбленный гробокопатель, призывающий призраки забытых планов." },
  { type: "сжигание", icon: "🔥", prefix: "Архивариус", suffix: "Когнитивной Гнили", desc: "Безумный писец, погребенный под кучей отчетов и документов." },
  { type: "сбор", icon: "🍯", prefix: "Химомансер", suffix: "Волевого Ресурса", desc: "Маг крови, собирающий капли редкого эликсира сквозь шум." },
  { type: "призыв", icon: "🔮", prefix: "Надсмотрщик", suffix: "Механической Рутины", desc: "Слуга империи, требующий монотонного повторения действий." },
  { type: "пытка", icon: "⛓️", prefix: "Мастер", suffix: "Пыточных Дел", desc: "Истязатель, сжимающий тиски при непонятных границах задачи." },
  { type: "кандалы", icon: "🔒", prefix: "Страж", suffix: "Ментального Барьера", desc: "Бронированный часовой, блокирующий доступ к рабочей памяти." },
  { type: "барьер", icon: "🛡️", prefix: "Часовой", suffix: "Когнитивного Сопротивления", desc: "Гвардеец преграждает путь при попытке сесть за работу." },
  { type: "шторм", icon: "🌪️", prefix: "Вестник", suffix: "Постороннего Шума", desc: "Глашатай отвлекает вас звонками и сообщениями." },
  { type: "призрак", icon: "👻", prefix: "Окутанный", suffix: "Сном Монах", desc: "Спящий жрец, убаюкивающий вас посреди разгара рабочего дня." },
  { type: "легион", icon: "👥", prefix: "Орда", suffix: "Мелких Разбойников", desc: "Толпа мелких воришек, растаскивающих фокус по кусочкам." },
  { type: "пожиратель", icon: "🦖", prefix: "Пожиратель", suffix: "Разума", desc: "Жуткий псионик в мантии, высасывающий силы за секунды." },
  { type: "когти", icon: "🦅", prefix: "Судья", suffix: "Социального Давления", desc: "Суровый арбитр в мантии, парализующий страхом оценки." },
  { type: "яд", icon: "🧪", prefix: "Отравитель", suffix: "Неуверенности", desc: "Ассасин, отравляющий веру в качество вашей работы." },
  { type: "лабиринт", icon: "🌀", prefix: "Хранитель", suffix: "Лабиринта Выборов", desc: "Конструктор ловушек, заставляющий метаться между решениями." },
  { type: "допрос", icon: "📢", prefix: "Оратор", suffix: "Внутреннего Критика", desc: "Дезинформатор вещает, что у вас ничего не получится." },
  { type: "печать", icon: "🔏", prefix: "Цензор", suffix: "Информационного Шума", desc: "Писарь, забивающий каналы восприятия бесполезными данными." },
  { type: "shepot", icon: "🗣️", prefix: "Искуситель", suffix: "Ложных Приоритетов", desc: "Купец, предлагающий заняться неважными мелочами." },
  { type: "бездна", icon: "🕳️", prefix: "Чародей", suffix: "Когнитивного Тупика", desc: "Маг пустоты, вызывающий полное онемение мыслей." },
  { type: "тлен", icon: "🍂", prefix: "Жнец", suffix: "Утраченного Времени", desc: "Скелет в плаще с косой, считающий упущенные часы." },
  { type: "кости", icon: "🦴", prefix: "Воин-Скелет", suffix: "Недоделанных Проектов", desc: "Оживший мертвец из прошлых брошенных начинаний." },
  { type: "скверна", icon: "🌋", prefix: "Фанатик", suffix: "Сквернословия", desc: "Безумный фанатик, вызывающий злость и фрустрацию." },
  { type: "оковы", icon: "🔗", prefix: "Надзиратель", suffix: "Физического Застоя", desc: "Стражник требует немедленно размять затекшие мышцы." },
  { type: "скрежет", icon: "⚙️", prefix: "Инженер", suffix: "Тяжелого Старта", desc: "Механик, нагнетающий ужасное сопротивление в начале пути." },
  { type: "пепел", icon: "💨", prefix: "Испепелитель", suffix: "Сгоревшего Интереса", desc: "Маг огня, быстро превращающий новизну в скучную труху." },
  { type: "пламя", icon: "🔥", prefix: "Поджигатель", suffix: "Горящего Дедлайна", desc: "Штурмовик, метающий огонь на ваши защитные стены." },
  { type: "искры", icon: "⚡", prefix: "Ментальный", suffix: "Изобретатель", desc: "Безумный ученый, фонтанирующий миллионом побочных идей." },
  { type: "вспышка", icon: "💡", prefix: "Адепт", suffix: "Гиперфокуса", desc: "Колдун, уязвимый перед вашей вспышкой воли." },
  { type: "тень", icon: "🌑", prefix: "Разведчик", suffix: "Когнитивных Искажений", desc: "Шпион, преувеличивающий сложность стоящей перед вами работы." },
  { type: "туман", icon: "🌫️", prefix: "Маг Тумана", suffix: "Неясных Шагов", desc: "Колдун дымки, скрывающий истинные границы задачи." },
  { type: "искажение", icon: "🌀", prefix: "Зеркальное Искажение", suffix: "Перфекционизма", desc: "Заставляет вас переделывать идеальную работу снова и снова." },
  { type: "пыль", icon: "🧹", prefix: "Пыльца", suffix: "Ментальной Усталости", desc: "Туманное облако, затуманивающее рабочую память и внимание." },
  { type: "клинок", icon: "🗡️", prefix: "Кровавый Клинок", suffix: "Чужих Советов", desc: "Оружие, отсекающее вашу интуицию и уверенность в собственных методах." },
  { type: "башня", icon: "🗼", prefix: "Шпиль", suffix: "Отвлечённого Внимания", desc: "Высокая башня, с которой открывается вид на сотни других интересных дел." },
  { type: "сфера", icon: "🔮", prefix: "Стеклянная Сфера", suffix: "Замкнутого Круга", desc: "Вы пытаетесь начать, но возвращаетесь к началу из-за хаоса мыслей." },
  { type: "кандалы", icon: "⛓️", prefix: "Ржавые Цепи", suffix: "Откладывания на Завтра", desc: "Древние оковы, заставляющие верить, что завтра работа пойдет лучше." },
  { type: "пелена", icon: "💨", prefix: "Эфирная Пелена", suffix: "Когнитивного Сна", desc: "Сонная дымка, укутывающая мозг во время чтения сложной документации." },
  { type: "паук", icon: "🕷️", prefix: "Паук-Ткач", suffix: "Лишних Ссылок", desc: "Огромный паук плетет сеть из бесконечных вкладок в браузере." },
  { type: "призрак", icon: "👻", prefix: "Фантом", suffix: "Старых Обязательств", desc: "Призрак дела, о котором вы договорились полгода назад и забыли." },
  { type: "дракон", icon: "🐉", prefix: "Дракон", suffix: "Ментальной Перегрузки", desc: "Исполинское чудовище, сжигающее остатки энергии при взгляде на список дел." },
  { type: "стена", icon: "🧱", prefix: "Мраморная Стена", suffix: "Непонимания ТЗ", desc: "Преграда, возникающая из-за размытых формулировок задачи." },
  { type: "вихрь", icon: "🌪️", prefix: "Песчаный Вихрь", suffix: "Мелких Уведомлений", desc: "Песок летит в глаза при каждой попытке сосредоточиться." },
  { type: "токсин", icon: "🧪", prefix: "Ядовитый Газ", suffix: "Допаминового Голодания", desc: "Смертельный туман, заставляющий искать быстрые удовольствия в сети." },
  { type: "голем", icon: "🗿", prefix: "Глиняный Голем", suffix: "Монотонной Рутины", desc: "Тяжелый противник, превращающий любую задачу в невыносимую скуку." },
  { type: "пленник", icon: "🔒", prefix: "Узник", suffix: "Собственных Сомнений", desc: "Внутренний голос просит вас сдаться до совершения первого удара." },
  { type: "эхо", icon: "📢", prefix: "Эхо", suffix: "Критики Коллег", desc: "Шепчущие стены, напоминающие о прошлых ошибках на работе." },
  { type: "искра", icon: "⚡", prefix: "Импульсивная Искра", suffix: "Новой Идеи", desc: "Вспышка, заставляющая бросить текущий квест ради нового черновика." },
  { type: "капкан", icon: "🕸️", prefix: "Капкан", suffix: "Ментальной Паники", desc: "Парализует при приближении жесткого временного дедлайна." },
  { type: "провал", icon: "🕳️", prefix: "Черный Провал", suffix: "Упущенных Возможностей", desc: "Бездна вины за то, что задача не была сделана вовремя." },
  { type: "орда", icon: "👥", prefix: "Орда", suffix: "Внезапных Просьб", desc: "Коллеги и близкие окружают вас толпой мелких поручений." },
  { type: "вампир", icon: "🧛", prefix: "Энергетический Вампир", suffix: "Митапов", desc: "Бесконечные созвоны без четкой повестки, выпивающие силы." },
  { type: "карта", icon: "🗺️", prefix: "Лабиринт", suffix: "Ложных Направлений", desc: "Вы делаете много работы, но не продвигаетесь к финалу задачи." },
  { type: "зеркало", icon: "🪞", prefix: "Осколок Зеркала", suffix: "Сравнения с Другими", desc: "Показывает успехи коллег, вызывая уныние и когнитивный ступор." },
  { type: "рыцарь", icon: "🤺", prefix: "Паладин", suffix: "Завышенных Планку", desc: "Требует от вас прыгнуть выше головы и сдать все идеально." },
  { type: "болото", icon: "🐸", prefix: "Тина", suffix: "Зависания в Мыслях", desc: "Состояние, когда вы смотрите в одну точку и не можете начать." },
  { type: "маска", icon: "🎭", prefix: "Личина", suffix: "Постоянного Откладывания", desc: "Маска, скрывающая страх неудачи под предлогом усталости." },
  { type: "стрела", icon: "🏹", prefix: "Стрела", suffix: "Внезапного Вопроса", desc: "Неожиданный вопрос в чате сбивает вас с когнитивного ритма." },
  { type: "купол", icon: "🔮", prefix: "Купол", suffix: "Информационного Перегруза", desc: "Слишком много открытых статей и документации блокируют действия." },
  { type: "грот", icon: "🕳️", prefix: "Подземелье", suffix: "Нелюбимых Задач", desc: "Место, где пылятся самые противные и скучные дела." },
  { type: "ржавчина", icon: "⚙️", prefix: "Ржавчина", suffix: "Утраченных Навыков", desc: "Ощущение, что вы забыли как делать эту работу, вызывающее страх." },
  { type: "пламя", icon: "🔥", prefix: "Жар", suffix: "Внутренней Тревоги", desc: "Физическое беспокойство, мешающее усидеть на месте." },
  { type: "туча", icon: "☁️", prefix: "Грозовая Туча", suffix: "Предчувствия Провала", desc: "Страх перед тем, что результат вашей работы никому не понравится." },
  { type: "цепь", icon: "⛓️", prefix: "Узы", suffix: "Парализующего Страха", desc: "Чувство ужаса перед сложной задачей, сковывающее руки." },
  { type: "страж", icon: "🧙", prefix: "Страж", suffix: "Комфортной Зоны", desc: "Уговаривает вас поиграть в игру или посмотреть видео вместо работы." },
  { type: "прилив", icon: "🌊", prefix: "Прилив", suffix: "Хаотичных Мыслей", desc: "Шторм в голове, не позволяющий зацепиться за одну идею." },
  { type: "омут", icon: "🌪️", prefix: "Омут", suffix: "Персонального Ада Задач", desc: "Чувство безысходности от бесконечного количества дел." },
  { type: "камень", icon: "🗿", prefix: "Груз", suffix: "Отложенных Решений", desc: "Камень на сердце от того, что вы до сих пор не выбрали путь." },
  { type: "могила", icon: "🪦", prefix: "Курган", suffix: "Забытых Обещаний", desc: "Воспоминания о людях, которых вы подвели, откладывая дела." },
  { type: "шепот", icon: "🗣️", prefix: "Шепот", suffix: "Внутреннего Саботажника", desc: "Говорит, что можно начать через час, ведь времени еще полно." },
  { type: "дым", icon: "💨", prefix: "Дым", suffix: "Иллюзии Занятости", desc: "Вы делаете легкие дела, чтобы не приступать к главному квесту." },
  { type: "лед", icon: "❄️", prefix: "Ледник", suffix: "Эмоционального Выгорания", desc: "Полное отсутствие эмоций и мотивации к любой деятельности." },
  { type: "кристалл", icon: "💎", prefix: "Кристалл", suffix: "Слишком Сладких Планов", desc: "Красивые фантазии о результате работы вместо самой работы." },
  { type: "эликсир", icon: "🧪", prefix: "Осадок", suffix: "Прошлых Поражений", desc: "Воспоминания о неудачах отравляют вашу текущую попытку." },
  { type: "печать", icon: "🏮", prefix: "Печать", suffix: "Силы Воли", desc: "Печать ослабевает, когда запас вашей ментальной энергии на исходе." },
  { type: "голем", icon: "🤖", prefix: "Стальной Голем", suffix: "Чужих Шаблонов", desc: "Попытка делать работу так, как говорят другие, ломая свой ритм." },
  { type: "кандалы", icon: "🔒", prefix: "Затвор", suffix: "Синдрома Дефицита Допамина", desc: "Мозг физически отказывается концентрироваться без яркого стимула." },
  { type: "туман", icon: "🌫️", prefix: "Серый Туман", suffix: "Неопределенного Будущего", desc: "Вы не понимаете, к чему приведет выполнение этой задачи." },
  { type: "когти", icon: "🦅", prefix: "Когти", suffix: "Ускользающего Момента", desc: "Ощущение, что время идет слишком быстро, вызывающее панику." },
  { type: "зверь", icon: "🐺", prefix: "Призрачный Зверь", suffix: "Внешней Критики", desc: "Страх получить плохую оценку вашей работы от заказчика." },
  { type: "руна", icon: "🔮", prefix: "Руна", suffix: "Хаотичного Переключения", desc: "Заставляет перескакивать с вкладки на вкладку каждые 30 секунд." },
  { type: "архив", icon: "📜", prefix: "Свитки", suffix: "Нереализованных Идей", desc: "Грусть по проектам, которые вы придумали, но так и не начали." },
  { type: "бездна", icon: "🕳️", prefix: "Зев Бездны", suffix: "Полного Паралича Внимания", desc: "Взгляд стекленеет при попытке прочитать одну строчку текста." },
  { type: "капкан", icon: "⚙️", prefix: "Капкан", suffix: "Ложного Упрощения", desc: "Вы думали, что задача простая, но застряли в скрытых сложностях." },
  { type: "пепел", icon: "💨", prefix: "Пепел", suffix: "Сгоревшей Концентрации", desc: "Остатки воли после тяжелого рабочего дня." },
  { type: "стена", icon: "🧱", prefix: "Бастион", suffix: "Когнитивной Глухоты", desc: "Вы не можете усвоить новую информацию из-за перегрузки." }
];

// НПС-встречи Бездны: мотиваторы, помощники, провокаторы, Зеркала Истины
const NPC_ENCOUNTERS = [
  { name: "Странствующий Монах Ордена Тишины", type: "motivating", icon: "🧙", prompt: "мудрый старец-монах, говорящий притчами о силе разума и стойкости духа" },
  { name: "Призрак Бывалого Воина", type: "motivating", icon: "⚔️", prompt: "грубый но добрый ветеран-призрак, знающий цену каждому мгновению отдыха в бою" },
  { name: "Светлая Жрица Источника", type: "motivating", icon: "✨", prompt: "жрица света из разрушенного храма, излучающая спокойствие и веру в героя" },
  { name: "Бард Перекрёстка", type: "motivating", icon: "🎶", prompt: "весёлый бард, поднимающий дух песнями и напоминающий что отдых — часть победы" },
  { name: "Лесная Целительница", type: "helping", icon: "🌿", prompt: "тихая травница, лечащая тело и разум настоями и мудрыми словами" },
  { name: "Кузнец Рунного Горна", type: "helping", icon: "🔨", prompt: "мастер-кузнец, объясняющий что даже лучший клинок нужно остужать и закалять" },
  { name: "Разведчик Приграничья", type: "helping", icon: "🏹", prompt: "быстрый разведчик, помогающий расставлять приоритеты в хаосе задач" },
  { name: "Алхимик Серебряной Луны", type: "helping", icon: "⚗️", prompt: "алхимик, объясняющий химию восстановления мозга через метафору зельеварения" },
  { name: "Тёмный Дуэлянт", type: "provoking", icon: "🗡️", prompt: "надменный дуэлянт, подначивающий героя доказать силу действием после отдыха" },
  { name: "Демон-Искуситель Лени", type: "provoking", icon: "😈", prompt: "демон, шепчущий бросить всё — его нужно победить, встав и сделав активность" },
  { name: "Каргахаульский Надзиратель", type: "provoking", icon: "⛓️", prompt: "бывший надзиратель из повозки, угрожающий вернуть кандалы при долгом безделье" },
  { name: "Зеркало Истины (Малое)", type: "mirror", icon: "🪞", prompt: "безжалостное магическое зеркало, показывающее грехи прокрастинации как духовные раны" },
  { name: "Зеркало Истины (Великое)", type: "mirror", icon: "🔮", prompt: "древнее зеркало Бездны, порицающее прокрастинацию как смертный грех и напоминающее что герой мог бы не оказаться здесь будь он чутче к себе" },
  { name: "Оракул Потерянных Часов", type: "mirror", icon: "⏳", prompt: "оракул-скелет, считающий потерянные часы жизни героя и показывающий что время невозвратимо" },
  { name: "Дух Совести", type: "mirror", icon: "💀", prompt: "дух, напоминающий герою о всех откладываемых делах как о неоплаченных долгах перед собой" },
];

// Мини-перерывы (каждые 30 минут активной работы)
const MINI_BREAK_ACTIVITIES = [
  { id: 'breathing', label: '🫁 Дыхательная техника (4-4-4-4)', lore: 'ритуал очищения дыхания у древнего алтаря' },
  { id: 'meditation', label: '🧘 Закрыть глаза на 1 минуту', lore: 'медитация у затухающего костра лагеря' },
  { id: 'window', label: '🪟 Посмотреть вдаль (20-20-20)', lore: 'наблюдение с дозорной башни за горизонтом Бездны' },
  { id: 'grip', label: '💪 Пожамкать эспандер', lore: 'тренировка хвата на рукояти боевого оружия' },
  { id: 'stretch', label: '🤸 Потянуться и размяться', lore: 'разминка мышц перед следующей фазой сражения' },
  { id: 'walk', label: '🚶 Встать и пройтись', lore: 'обход лагерного периметра и проверка ловушек' },
  { id: 'water', label: '💧 Попить воды', lore: 'глоток из Источника Чистой Воли' },
  { id: 'eyes', label: '👀 Гимнастика для глаз', lore: 'упражнение Орлиного Зрения рейнджеров Приграничья' },
  { id: 'ball', label: '✋ Помять антистресс-мяч', lore: 'сжатие артефакта спокойствия из лавки Торговца' },
  { id: 'music', label: '🎵 Послушать 1 любимый трек', lore: 'бард играет восстанавливающую балладу у костра' },
  { id: 'face', label: '🧊 Умыть лицо холодной водой', lore: 'обряд ледяного крещения для бодрости духа' },
  { id: 'snack', label: '🍎 Съесть фрукт или орехи', lore: 'перекус эльфийским хлебом и лесными ягодами' },
];

// Большие перерывы (каждые 1.5 часа)
const BIG_BREAK_ACTIVITIES = [
  { id: 'eat', label: '🍲 Полноценный приём пищи', lore: 'пир воинов у большого костра лагеря героев' },
  { id: 'tea', label: '☕ Чай или кофе ритуал', lore: 'варка зелья бодрости у котла алхимика' },
  { id: 'walk_long', label: '🚶 Прогулка 10-15 минут', lore: 'разведывательная вылазка за стены лагеря' },
  { id: 'shower', label: '🚿 Умыться / освежиться', lore: 'омовение в священных водах Лунного Источника' },
  { id: 'nap', label: '😴 Короткий сон (power nap)', lore: 'магический сон восстановления в шатре целителя' },
  { id: 'nature', label: '🌳 Выйти на свежий воздух', lore: 'сбор целебных трав и дыхание в лесу Приграничья' },
];


const generateLocalSteps = (title, type) => {
  const t = title.toLowerCase();
  
  if (t.includes('код') || t.includes('программ') || t.includes('питон') || t.includes('тест') || t.includes('написать') || t.includes('разработ') || t.includes('фикс') || t.includes('баг') || t.includes('dev') || t.includes('react') || t.includes('js') || t.includes('css')) {
    return [
      "Найти безопасное место в укрытии (Включить компьютер, открыть IDE)",
      "Снять ржавые кандалы апатии (Закрыть все развлекательные вкладки и чаты)",
      "Заварить эликсир концентрации (Налить стакан свежей воды или чая)",
      "Совершить пробный выпад клинком (Написать одну строчку кода, функцию или комментарий)",
      "Проверить натяжение тетивы (Запустить сборку проекта, тесты или проверить в браузере)",
      "Осадить врага до конца (Сосредоточенно работать в течение 10-15 минут)"
    ];
  }
  
  if (t.includes('изучить') || t.includes('прочитать') || t.includes('почитать') || t.includes('курс') || t.includes('книг') || t.includes('лекци') || t.includes('учить') || t.includes('разобрать') || t.includes('исследов') || t.includes('анализ')) {
    return [
      "Протереть линзы очков мудрости (Открыть нужный учебный материал, статью или книгу)",
      "Запечатать посторонние шепоты (Поставить телефон на беззвучный режим)",
      "Прочесть первую руну древнего свитка (Внимательно прочесть ровно один абзац или 1 слайд)",
      "Записать ценное откровение в летопись (Выписать одну ключевую мысль или термин в блокнот)",
      "Укрепить ментальный барьер (Прочитать еще 2-3 страницы без самокритики)",
      "Осознать полученное знание (Сделать краткую паузу и осмыслить прочитанное)"
    ];
  }
  
  if (t.includes('помыть') || t.includes('убрать') || t.includes('стир') || t.includes('уборка') || t.includes('комнат') || t.includes('вещи') || t.includes('посуд') || t.includes('пыль') || t.includes('чистк')) {
    return [
      "Надеть латные рукавицы выживания (Встать со стула и дойти до места уборки)",
      "Собрать осколки Скверны Бездны (Выбросить в мусорку ровно 3 ненужные вещи/бумажки)",
      "Призвать силу Водного Источника (Включить воду, взять тряпку или губку)",
      "Очистить первый рубеж обороны (Помыть или убрать одну конкретную тарелку, вещь или полку)",
      "Объявить о победе в лагере (Поставить очищенный предмет на его законное место)",
      "Оглядеть очищенные земли (Оценить результат и похвалить себя за сделанный шаг)"
    ];
  }
  
  // Generic fallback steps
  return [
    "Снять кандалы ступора (Сделать глубокий вдох и выдох по схеме 4-4-4-4)",
    "Разведать территорию боя (Открыть материалы задачи, файл или блокнот перед собой)",
    "Совершить микро-удар кинжалом (Сделать любое простейшее действие по задаче за 2 минуты)",
    "Прорвать когнитивную блокаду (Сделать второе простое микро-действие)",
    "Занять доминирующую позицию (Продолжить работу в спокойном ритме в течение 5 минут)",
    "Оценить первый рубеж (Свериться с планом и продолжить путь)"
  ];
};

const generateEnrichedEnemyDescription = (enemyName, taskTitle, toxicity, variation) => {
  const hashStr = enemyName + taskTitle;
  let hash = 0;
  for (let i = 0; i < hashStr.length; i++) {
    hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const classes = [
    "ослепший паладин Бездны",
    "падшая сирена Каргахаульских перекатов",
    "сутулый костяной жнец",
    "безумный чернокнижник прокрастинации",
    "тяжеловооруженный инквизитор Ока",
    "призрачный лорд Забвения",
    "каратель Багрового Храма",
    "повелитель железных цепей"
  ];

  const appearances = [
    "в растрескавшихся, сочащихся багровой кровью латах",
    "под маской из отполированной человеческой кости",
    "с пронзительно горящими фиолетовым пламенем глазницами",
    "чье исхудавшее, бледное тело обвито звенящими ржавыми цепями",
    "в изорванном священном одеянии, исписанном светящимися рунами",
    "с холодным, безжизненным взором и неестественно бледной кожей",
    "в оскверненной чешуйчатой броне, покрытой наростами черной соли",
    "с костяными наростами вместо ребер и оскаленным лицом древнего воина"
  ];

  const weapons = [
    "держащий в дрожащих руках гигантский зазубренный двуручный меч",
    "сжимающий в длинных суставчатых пальцах тлеющий свиток Скверны",
    "вооруженный тяжелым ржавым шипастым цепом",
    "направляющий на вас оскверненное багровое кадило",
    "держащий в руках старинные песочные часы, отсчитывающие секунды вашей воли",
    "направляющий острие обжигающего эфирного клинка",
    "сжимающий в когтях окровавленный жезл Империи",
    "перебирающий длинными пальцами невидимые нити ментальной ловушки"
  ];

  const behaviors = [
    "Он хрипло, прерывисто дышит, медленно высматривая малейшую когнитивную слабость в вашей осанке.",
    "Он безумно хохочет, сотрясая камни грота и пытаясь заглушить ваш мысленный фокус.",
    "Он медленно чертит круги на сырой земле, ожидая вашей первой оплошности или прокрастинации.",
    "Он замирает в неподвижной зловещей стойке, готовясь совершить молниеносный смертельный выпад.",
    "Существо шипит и медленно пятится, ослепленное ровным светом вашей решимости.",
    "Он издает протяжный, полный боли стон, транслируя в вашу голову образы прошлых ошибок.",
    "Монстр медленно приближается к вам, заставляя воздух вокруг густеть и леденеть.",
    "Он расправляет свои плечи и яростно бьет оружием о щит, требуя идеальности каждого вашего шага."
  ];

  const cls = classes[hash % classes.length] || "ослепший паладин Бездны";
  const app = appearances[Math.floor(hash / 2) % appearances.length] || "в бледных костяных доспехах";
  const wpn = weapons[Math.floor(hash / 4) % weapons.length] || "с зазубренным двуручным мечом";
  const beh = behaviors[Math.floor(hash / 8) % behaviors.length] || "Он хрипло дышит, высматривая вашу слабину.";

  const intro = `Из сырого мрака грота, волоча за собой тяжелый могильный холод, медленно выходит ${cls}, ${app}, ${wpn}. ${beh}`;

  const descriptions = {
    scary: `Существо соткано из вашего первобытного страха перед началом квеста. Оно застывает на месте, готовясь к резкому броску, если вы проявите нерешительность. Однако в его движениях сквозит фатальная медлительность: резкий шаг вперед, простейшее физическое микро-действие расколет его хрупкий костяной панцирь. Одолеть его можно, совершив мгновенный выпад прямо сейчас!`,
    tedious: `Тварь медлительна, но неумолимо давит своим жутким весом, пытаясь погрузить ваш разум в вязкое болото уныния. Она не выносит резкого темпа и напора. Ваша лучшая стратегия — двигаться быстро, обходя ее громоздкие фланги. Резкий и короткий шаг (работа ровно 10 минут) заставит монстра споткнуться и откроет его уязвимое ядро!`,
    vague: `Этот монстр постоянно меняет свои очертания, расплываясь в воздухе туманными пятнами и сбивая вас с толку. Он слепнет от яркого света конкретики. Чтобы одолеть его, совершите точный шаг — зафиксируйте в мыслях конкретное физическое действие, и его размытая форма материализуется, став уязвимой для вашего клинка!`,
    standard: `Теневой паразит Бездны, питающийся вашим временем. Он медленно кружит вокруг, выжидая момент, когда вы отвлечетесь от пути. У него есть скрытая слабость — он неповоротлив и впадает в ступор при виде планомерной, решительной атаки. Резкий шаг, даже самый скромный, собьет его с толку. Не давайте ему передышки!`
  };

  const body = descriptions[toxicity] || descriptions.standard;
  return `${intro} Он приближается, распространяя вокруг ауру «${taskTitle}». ${body}`;
};

export default function CarriageSession({ 
  character, 
  setCharacter, 
  tasks, 
  setTasks, 
  parseMessyTasks,
  requestDeconstruction,
  playActiveSessionTrack,
  generateRedemptionEulogy,
  pedestals = [],
  savePedestals,
  requestTaskExecutionModeSelect,
  communeWithSpirits,
  onStateSync
}) {
  const { playClick, playBoneCrack, playSuccess, startHeartbeat, stopHeartbeat, setAtmosphereMood } = useAudio();
  const toggleFullscreenFocus = () => {
    playClick();
    const nextVal = !isFullscreenFocus;
    setIsFullscreenFocus(nextVal);
    localStorage.setItem('immersive_fullscreen_focus', nextVal ? 'true' : 'false');
  };
  const [messyText, setMessyText] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // Exile/Setup Phase Stage: 'lore' -> 'hub' -> 'input' -> 'review' -> 'crash' -> 'active'
  const [setupStage, setSetupStage] = useState('lore'); 
  const [parsedList, setParsedList] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewGuidedQuestions, setReviewGuidedQuestions] = useState([]);
  const [reviewGuidedAnswers, setReviewGuidedAnswers] = useState({});
  const [reviewGuidedActive, setReviewGuidedActive] = useState(false);
  const [reviewAiEditPrompt, setReviewAiEditPrompt] = useState('');
  const [reviewAiEditActive, setReviewAiEditActive] = useState(false);
  
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

  const [resolutionNpc, setResolutionNpc] = useState(null);
  const [npcNewTaskTitle, setNpcNewTaskTitle] = useState('');

  // Editing Task modal states in CarriageSession
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('hunt');
  const [editTime, setEditTime] = useState(25);
  const [editIntent, setEditIntent] = useState('');
  const [editSteps, setEditSteps] = useState([]);
  const [newStepText, setNewStepText] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editNature, setEditNature] = useState('external');
  const [editExecutionMode, setEditExecutionMode] = useState('ask_later');
  const [editDeconstructLoading, setEditDeconstructLoading] = useState(false);
  const [editAiEditPrompt, setEditAiEditPrompt] = useState('');
  const [editAiEditActive, setEditAiEditActive] = useState(false);
  const [editIsSurvival, setEditIsSurvival] = useState(false);

  // Preparation (Prepare for Battle) overlay states
  const [prepTask, setPrepTask] = useState(null);
  const [autoAskedForIndex, setAutoAskedForIndex] = useState(-1);
  const [selectedDialogueChoice, setSelectedDialogueChoice] = useState(null);
  const [prepExecutionMode, setPrepExecutionMode] = useState(null);
  const [prepActionInput, setPrepActionInput] = useState('');
  const [prepTimerActive, setPrepTimerActive] = useState(false);
  const [prepTimeLeft, setPrepTimeLeft] = useState(100);

  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Ritual Time Manager States
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [ritualUnit, setRitualUnit] = useState('minutes'); // seconds, minutes, hours
  const [ritualValue, setRitualValue] = useState(10);
  const [ritualTimeTotal, setRitualTimeTotal] = useState(600); // total seconds
  const [ritualTimeLeft, setRitualTimeLeft] = useState(0);
  const [ritualTimerActive, setRitualTimerActive] = useState(false);
  const [ritualFinished, setRitualFinished] = useState(false);
  const [ritualBlessingText, setRitualBlessingText] = useState('');
  const [ritualBlessingLoading, setRitualBlessingLoading] = useState(false);

  // Hunt Time Manager States
  const [huntModalOpen, setHuntModalOpen] = useState(false);
  const [huntMode, setHuntMode] = useState('pomodoro'); // pomodoro (Расчет по времени), stopwatch (Узы со временем)
  const [huntBreakInterval, setHuntBreakInterval] = useState(30); // in minutes
  const [huntTimerValue, setHuntTimerValue] = useState(1800); // countdown value in seconds (default 30 mins)
  const [huntTimeSpent, setHuntTimeSpent] = useState(0); // active work seconds spent
  const [huntTimeTotal, setHuntTimeTotal] = useState(0); // total session seconds
  const [huntIsRunning, setHuntIsRunning] = useState(false);
  const [huntIsBreak, setHuntIsBreak] = useState(false);
  const [huntBreakTimeLeft, setHuntBreakTimeLeft] = useState(1800); // 30 minutes break in seconds
  const [huntLastBreakCheckpoint, setHuntLastBreakCheckpoint] = useState(0);
  const [huntBreakEvent, setHuntBreakEvent] = useState(null);
  const [huntPayoutActive, setHuntPayoutActive] = useState(false);

  // Guided Deconstruction (ADHD Interview) States inside Edit Modal
  const [guidedStep, setGuidedStep] = useState(0); // 0 = default, 1 = answering questions, 2 = done
  const [guidedQuestions, setGuidedQuestions] = useState([]);
  const [guidedAnswers, setGuidedAnswers] = useState({});

  // Gothic Adaptation Modal States
  const [adaptationModalOpen, setAdaptationModalOpen] = useState(false);
  const [adaptationTask, setAdaptationTask] = useState(null);
  const [adaptationTaskIndex, setAdaptationTaskIndex] = useState(-1);
  const [adaptationDeadline, setAdaptationDeadline] = useState('');

  // Immersive Fullscreen Focus, Combat Break, and Inline Step Edit States
  const [isFullscreenFocus, setIsFullscreenFocus] = useState(() => localStorage.getItem('immersive_fullscreen_focus') === 'true');
  const [activeCombatBreak, setActiveCombatBreak] = useState(null); // null, or { index: 1, tasks: [...] }
  const [accumulatedBreakRewards, setAccumulatedBreakRewards] = useState({ xp: 0, gold: 0 });
  const [newCombatStepText, setNewCombatStepText] = useState('');
  const [editingStepId, setEditingStepId] = useState(null);
  const [editingStepText, setEditingStepText] = useState('');
  const triggeredBreaksRef = useRef(new Set());

  const editTitleRef = useRef(null);

  useEffect(() => {
    const el = editTitleRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.value === '' ? '40px' : `${el.scrollHeight}px`;
    }
  }, [editTitle]);

  // Sync state to parent layout
  useEffect(() => {
    if (onStateSync) {
      onStateSync({ 
        activeTask, 
        timeLeft, 
        isRunning,
        ritualTimerActive,
        ritualTimeLeft,
        ritualTimeTotal,
        huntIsRunning,
        huntTimeSpent,
        huntTimerValue,
        huntMode,
        huntIsBreak,
        huntBreakTimeLeft
      });
    }
  }, [
    activeTask, timeLeft, isRunning, 
    ritualTimerActive, ritualTimeLeft, ritualTimeTotal,
    huntIsRunning, huntTimeSpent, huntTimerValue, huntMode,
    huntIsBreak, huntBreakTimeLeft, onStateSync
  ]);

  // Preparation Timer Effect
  useEffect(() => {
    let timerId = null;
    if (prepTimerActive) {
      if (prepTimeLeft > 0) {
        timerId = setInterval(() => {
          setPrepTimeLeft(prev => prev - 1);
        }, 1000);
      } else {
        // Countdown expired! Automatically start combat session
        setPrepTimerActive(false);
        playSuccess();
        actuallyStartCombat(prepTask, prepExecutionMode);
        setPrepTask(null);
        setPrepExecutionMode(null);
        setPrepActionInput('');
        setPrepTimeLeft(100);
      }
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [prepTimerActive, prepTimeLeft, prepTask, prepExecutionMode]);
  
  // Active RPG Combat Arena States
  const [enemyName, setEnemyName] = useState('Призрак Прокрастинации');
  const [enemyHp, setEnemyHp] = useState(100);
  const [combatLog, setCombatLog] = useState(['⚔️ Свиток боя развернут. Ожидание атаки...']);
  const [combatVignette, setCombatVignette] = useState('Тьма сгущается над вашим разумом...');
  const [ticksWithoutStep, setTicksWithoutStep] = useState(0); 
  const [deadlineDmgApplied, setDeadlineDmgApplied] = useState(false);

  // WOW-эффекты: Всплывающий урон и Вспышки экрана
  const [damageFloats, setDamageFloats] = useState([]);
  const [screenFlash, setScreenFlash] = useState(null);

  // СДВГ-оптимизация интерфейса (упрощено: только передышка и продление)

  // Церемония Искупления (Redemption)
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  const [redemptionEulogyText, setRedemptionEulogyText] = useState('');

  // Лагерь Отдыха и Медитация
  const [meditationActive, setMeditationActive] = useState(false);
  const [meditationDuration, setMeditationDuration] = useState(180); // Default to 3m
  const [meditationTimeLeft, setMeditationTimeLeft] = useState(180);
  const [meditationPhase, setMeditationPhase] = useState('inhale'); // inhale (4s), hold-in (4s), exhale (4s), hold-out (4s)
  const [meditationPulseCounter, setMeditationPulseCounter] = useState(0);
  const [meditationSelectOpen, setMeditationSelectOpen] = useState(false);
  const [selectedMeditationType, setSelectedMeditationType] = useState('stretch');
  const [meditationType, setMeditationType] = useState('stretch');

  // Система Перерывов и НПС-Встреч (Break Events)
  const sessionElapsedRef = useRef(0);
  const lastMiniBreakRef = useRef(0);
  const lastBigBreakRef = useRef(0);
  
  const activeTaskRef = useRef(activeTask);
  const timeLeftRef = useRef(timeLeft);
  const setupStageRef = useRef(setupStage);
  const lastTickTimeRef = useRef(Date.now());
  const resolutionTriggeredRef = useRef(false);

  useEffect(() => {
    activeTaskRef.current = activeTask;
  }, [activeTask]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    setupStageRef.current = setupStage;
  }, [setupStage]);

  useEffect(() => {
    if (isRunning) {
      lastTickTimeRef.current = Date.now();
    }
  }, [isRunning]);
  const [breakEvent, setBreakEvent] = useState(null);
  const [breakActivityChoice, setBreakActivityChoice] = useState('breathing');
  const [breakAiText, setBreakAiText] = useState('');
  const [breakAiLoading, setBreakAiLoading] = useState(false);

  const [resolutionType, setResolutionType] = useState('victory'); // victory, flee, death
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionLoading, setResolutionLoading] = useState(false);
  const [resolutionIsAmbush, setResolutionIsAmbush] = useState(false);

  const getDialogueOptions = (npc, moral, completedCount) => {
    if (!npc) return [];
    return [
      {
        type: 'mercy',
        title: '☀️ Путь Милосердия (Искупление)',
        text: `Вступиться за жителей деревни, поделиться с «${npc.name}» пищей и помолиться о его пути у костра.`,
        resolutionText: `Вы проявили истинное благородство духа. Поделившись крохами пищи с «${npc.name}», вы тихо молились у костра. В вашей душе зажегся огонь искупления, согревающий разум во мгле.`,
        statChangeText: '❤️ +8 HP, 🔮 Моральный компас +5, 🪙 -2 Золота',
        apply: (char) => ({
          ...char,
          hp: Math.min(char.maxHp || 100, (char.hp || 80) + 8),
          moralCompass: Math.min(100, (char.moralCompass !== undefined ? char.moralCompass : 50) + 5),
          gold: Math.max(0, (char.gold || 0) - 2)
        })
      },
      {
        type: 'cynic',
        title: '💀 Путь Цинизма (Изгой / Наемник)',
        text: `Хладнокровно потребовать плату за избавление от монстра или обыскать останки у костра в поисках монет.`,
        resolutionText: `Мир Абаддона не прощает слабости. Вы без лишних слов затребовали плату с «${npc.name}» и обыскали грязную землю у костра. Золото приятно греет карман, но совесть покрылась коркой льда.`,
        statChangeText: '🪙 +12 Золота, 🔮 Моральный компас -5',
        apply: (char) => ({
          ...char,
          gold: (char.gold || 0) + 12,
          moralCompass: Math.max(0, (char.moralCompass !== undefined ? char.moralCompass : 50) - 5)
        })
      },
      {
        type: 'focus',
        title: '👁️ Путь Воли (Нейтралитет)',
        text: `Молча вытереть кровь с клинка, расспросить о следующих рубежах и продолжить поход.`,
        resolutionText: `Вы не тратите драгоценную волю на пустые разговоры. Очистив сталь от черной крови, вы расспросили «${npc.name}» о следующей угрозе. Ваша воля непоколебима, а разум сфокусирован.`,
        statChangeText: '🔮 +8 MP Маны, 🌟 +8 XP Опыта',
        apply: (char) => ({
          ...char,
          mana: Math.min(char.maxMana || 100, (char.mana || 80) + 8),
          xp: (char.xp || 0) + 8
        })
      }
    ];
  };

  const handleExecuteDialogueChoice = (choice) => {
    playSuccess();
    setSelectedDialogueChoice(choice);
    
    // Apply changes to the character state!
    setCharacter(prev => {
      const nextChar = choice.apply(prev);
      
      // Handle level up if XP exceeds threshold
      let nextXp = nextChar.xp || 0;
      let nextLvl = nextChar.level || 1;
      const xpNeeded = nextLvl * 100;
      if (nextXp >= xpNeeded) {
        nextXp -= xpNeeded;
        nextLvl += 1;
        spawnFloater("LEVEL UP!", "hero-heal");
      }
      return {
        ...nextChar,
        xp: nextXp,
        level: nextLvl
      };
    });

    // Log the event in combat log!
    setCombatLog(prev => [`💬 Вы выбрали: «${choice.title}». Влияние: ${choice.statChangeText}`, ...prev.slice(0, 5)]);
  };

  const handleGenerateResolutionChronicle = async (type, task, enemy, isAmbush = false, npcName = '') => {
    if (resolutionLoading) return;
    setResolutionLoading(true);
    setResolutionText('');

    const isPastDebt = task?.type === 'corpse' || (task?.curseLevel && task.curseLevel > 0);
    const isLargeQuest = task?.pomodoroTime >= 50 || task?.type === 'siege';
    const hpContext = character.hp <= 30 ? `Герой истощен, едва держится на ногах (критический уровень здоровья HP: ${character.hp})` : `Герой крепок и полон сил (здоровье HP: ${character.hp})`;
    
    const moralVal = character.moralCompass !== undefined ? character.moralCompass : 50;
    let spiritContext = "";
    if (moralVal >= 80) {
      spiritContext = `\nСИЛА ДУХА И МЕНТАЛЬНОЕ СОСТОЯНИЕ: Искупленный (${moralVal}/100). Изгнанник милосерден, смирен, глубок духом, покорен предначертанию Времени, его диалоги с NPC добрые, он выражает искреннюю благодарность и скромен. В летописи его победы будут выглядеть благородно, милосердно, величественно, он стремится сберечь жизни невиновных.`;
    } else if (moralVal >= 60) {
      spiritContext = `\nСИЛА ДУХА И МЕНТАЛЬНОЕ СОСТОЯНИЕ: Стойкий Путник (${moralVal}/100). Изгнанник вежлив, покоен, скромен, сосредоточен на искуплении долга, уважает союзников.`;
    } else if (moralVal >= 40) {
      spiritContext = `\nСИЛА ДУХА И МЕНТАЛЬНОЕ СОСТОЯНИЕ: Черствый Скиталец (${moralVal}/100). Изгнанник безразличен, холоден, отвечает односложно, его заботит только выживание, к встречным он абсолютно равнодушен.`;
    } else if (moralVal >= 20) {
      spiritContext = `\nСИЛА ДУХА И МЕНТАЛЬНОЕ СОСТОЯНИЕ: Падший Изгой (${moralVal}/100). Изгнанник озлоблен, раздражителен, полон злобы и затаенной боли, говорит сквозь зубы, совершает неоправданно жестокие поступки. Встреченные им люди боятся его или презирают.`;
    } else {
      spiritContext = `\nСИЛА ДУХА И МЕНТАЛЬНОЕ СОСТОЯНИЕ: Мясник Бездны (${moralVal}/100). Полное падение духа. Изгнанник абсолютно жесток, кровожаден, безумен от боли и ярости, совершает страшную дикую жестокость, может без повода убить хорошего человека, встреченные им люди нападают на него из самообороны или страха, а диалоги полны угрожающей тьмы и ненависти.`;
    }

    const lastLegend = pedestals && pedestals.length > 0 ? pedestals[pedestals.length - 1] : null;
    let legacyPromptContext = "";
    if (lastLegend) {
      if (lastLegend.legacyStatus === 'stained') {
        legacyPromptContext = `\n⚠️ НАСЛЕДИЕ РОДОСЛОВНОЙ: Предыдущий герой пользователя (${lastLegend.name}, класс ${lastLegend.class}) трагически пал/потерпел позорное поражение, и его имя ЗАПЯТНАНО. Текущий герой несет груз стыда предка ${lastLegend.name} и отчаянно пытается искупить этот позор. Вплети это кратко в текст летописи.`;
      } else if (lastLegend.legacyStatus === 'sanctified') {
        legacyPromptContext = `\n⚠️ НАСЛЕДИЕ РОДОСЛОВНОЙ: Предыдущий герой пользователя (${lastLegend.name}, класс ${lastLegend.class}) совершил великий триумф, одолев Скверну Абаддона, и его имя ОСВЯЩЕНО. Текущий герой овеян славой предка ${lastLegend.name} и стремится соответствовать его величию. Вплети это кратко в текст летописи.`;
      }
    }

    let prompt = '';
    const loreGuidelines = `
ПРАВИЛА ИМЕНОВАНИЯ И ЛОРА:
1. НИКОГДА не выдумывай и не используй конкретные имена (никаких "Дункан" и т.д.). Протагонист — БЕЗЛИКОЕ НИЧТО, у которого не осталось прошлого.
2. ВСЕГДА называй его только «Изгнанник» или по его классу/расе (например, «Изгнанник-Маг меток», «Изгнанный эльф» с учетом его переданных класса и расы).
3. Его былая личность выжжена дотла. В его памяти лишь шрамы, ожоги, фантомная боль от бесконечных прошлых избиений, пыток, удушений и ментального насилия в застенках Бездны, откуда его израненным вышвырнули в повозку смерти сражаться из последних сил. Отрази этот тяжелый лорный контекст преодоления боли и триумфа увядающей воли.

ЗАПРЕТ НА ВУЛЬГАРНОСТЬ:
Строго ЗАПРЕЩЕН любой туалетный юмор, физиологические отвратительные подробности (мочеиспускание, испражнения и т.д.). Держи суровый, реалистичный, трагический и пафосный тон темного фэнтези Джо Аберкромби без дешевой пошлости.
${spiritContext}
`;

    if (isAmbush) {
      prompt = `Ты — Летописец Бездны во вселенной Абаддона. Опиши короткую, суровую и грязную летопись-эпитафию в стиле Джо Аберкромби.
Изгнанник завершил контракт «${task?.title || ''}», одолев врага «${enemy}», но его промедление и нерешительность привлекли разбойников. Он пришел на место встречи, но обнаружил лишь растерзанное тело «${npcName}». Герой в ярости перебил бандитов Бездны, осквернивших привал. Опиши эту суровую схватку и запах крови. До 90 слов, 2 абзаца.
${loreGuidelines}`;
    } else if (type === 'victory') {
      prompt = `Ты — Летописец Бездны во вселенной Абаддона. Опиши короткую, суровую и грязную летопись-эпитафию в стиле Джо Аберкромби (темное фэнтези, реализм, цинизм, кровь, пот и грязь).
Изгнанник одержал победу в фокус-сессии над когнитивной тварью: «${enemy}» (задача: "${task?.title || ''}").
${legacyPromptContext}

ТЕХНИЧЕСКИЙ КОНТЕКСТ ГЕРОЯ:
- Раса: ${character.race}
- Класс: ${character.class}
- Текущее состояние здоровья: ${hpContext}
- Время контракта: ${task?.pomodoroTime || 25} минут
- Срок (дедлайн): ${task?.deadline || 'без жесткого дедлайна'}
- Характер задачи: ${isLargeQuest ? 'КРУПНОЕ СРАЖЕНИЕ (Осада/Большой квест)' : 'НЕБОЛЬШАЯ СХВАТКА'}
- Статус просрочки: ${isPastDebt ? 'ПРОСРОЧЕННЫЙ ДОЛГ / ПРОКЛЯТАЯ ЗАДАЧА (труп прошлого / высокий уровень скверны)' : 'Свежий своевременный контракт'}

ТРЕБОВАНИЯ К ОПИСАНИЮ:
1. Используй неподражаемый циничный писательский стиль Джо Аберкромби (темное фэнтези, кровь в грязи, тяжелое дыхание, грубые фразы, суровый реализм).
2. Опиши финальный безжалостный удар с использованием классовых фишек героя (если класс — Химомансер/Маг крови, упомяни использование алой крови, шипов, вен; если класс — Пси-Телекинетик/Psi-Telekinetic/Mental Sovereign, упомяни использование ментального взрыва/Kopfplatzen; если класс — Плазмамансер, упомяни клинки эфира или искривление пространства; если другой класс — обыграй его особенности).
3. Обыграй состояние здоровья (если HP мало — покажи, что герой победил на грани сил, сплевывая кровь; если HP много — что он двигался уверенно).
4. Обыграй размер задачи и статус просрочки:
   - Если это КРУПНЫЙ квест или ПРОСРОЧЕННЫЙ долг, покажи, что этот триумф возвращает Изгнаннику веру в свои силы после кучи провалов и прокрастинации.
   - Если это мелкий квест — покажи, что это быстрая и уверенная победа, приближающая нас к цели.
5. Текст должен быть коротким (до 90 слов), разделенным ровно на 2-3 коротких абзаца. Разрешены уместные крепкие словечки (вроде "ублюдок", "дерьмо") для придания грязи и атмосферы.
${loreGuidelines}`;
    } else if (type === 'flee') {
      prompt = `Ты — Летописец Бездны во вселенной Абаддона. Опиши короткую, суровую и грязную летопись-эпитафию в стиле Джо Аберкромби (темное фэнтези, реализм, цинизм, грязь, холодный дождь).
Изгнанник отступил и сбежал с поля боя от когнитивной твари: «${enemy}» (задача: "${task?.title || ''}").

ТЕХНИЧЕСКИЙ КОНТЕКСТ ГЕРОЯ:
- Раса: ${character.race}
- Класс: ${character.class}
- Текущее состояние здоровья: ${hpContext}
- Время контракта: ${task?.pomodoroTime || 25} минут
- Срок (дедлайн): ${task?.deadline || 'без жесткого дедлайна'}
- Характер задачи: ${isLargeQuest ? 'КРУПНОЕ СРАЖЕНИЕ (Осада)' : 'НЕБОЛЬШАЯ СХВАТКА'}

ТРЕБОВАНИЯ К ОПИСАНИЮ:
1. Используй циничный писательский стиль Джо Аберкромби (грязь, дождь, разочарование, хмурое утро).
2. Обыграй бегство с учетом класса героя (например, Химомансер убегает, оставляя алый след, или укрываясь барьером).
3. Обыграй HP (если HP мало — он едва уполз в жиже; если много — отступил расчетливо).
4. Покажи, что бегство — это обидно, но это не конец. Нужно вернуться к костру, зализать раны, сплюнуть кровь и подготовить реванш.
5. Текст должен быть коротким (до 80 слов), разделенным ровно на 2 коротких абзаца. Разрешены крепкие выражения к месту.
${loreGuidelines}`;
    } else if (type === 'death') {
      prompt = `Ты — Летописец Бездны во вселенной Абаддона. Опиши короткую, суровую летопись в стиле Джо Аберкромби (запах сырой земли, хруст костей, темнота, горькая ирония).
Изгнанник пал в бою с тварью: «${enemy}» (задача: "${task?.title || ''}"). Его здоровье на критическом минимуме (10 HP), разум сломлен.
${legacyPromptContext}

ТЕХНИЧЕСКИЙ КОНТЕКСТ ГЕРОЯ:
- Раса: ${character.race}
- Класс: ${character.class}
- Время контракта: ${task?.pomodoroTime || 25} минут
- Срок (дедлайн): ${task?.deadline || 'без жесткого дедлайна'}
- Характер задачи: ${isLargeQuest ? 'КРУПНОЕ СРАЖЕНИЕ' : 'НЕБОЛЬШАЯ СХВАТКА'}

ТРЕБОВАНИЯ К ОПИСАНИЮ:
1. Стиль Джо Аберкромби (реалистичное падение лицом в жижу, хруст, тяжелые раны, циничная надежда).
2. Обыграй падение с использованием класса.
3. Покажи, что костлявая сегодня осталась голодной. Герой очнется у теплого костра в лагере, чтобы подняться из этого дерьма и отомстить.
4. Текст должен быть коротким (до 80 слов), разделенным на 2 коротких абзаца. Разрешены уместные маты.
${loreGuidelines}`;
    }

    try {
      const response = await fetch('http://127.0.0.1:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) throw new Error('AI offline');
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error("AI returned empty content");
      const generatedText = content.trim();
      setResolutionText(generatedText);
      
      // Sync chronicle back to the defeated enemy
      if (type === 'victory') {
        setCharacter(prev => {
          const updatedDefeated = prev.defeatedEnemies ? [...prev.defeatedEnemies] : [];
          if (updatedDefeated.length > 0) {
            updatedDefeated[updatedDefeated.length - 1] = {
              ...updatedDefeated[updatedDefeated.length - 1],
              aiChronicle: generatedText
            };
          }
          return {
            ...prev,
            defeatedEnemies: updatedDefeated
          };
        });
      }
      playSuccess();
    } catch (e) {
      const lastLegend = pedestals && pedestals.length > 0 ? pedestals[pedestals.length - 1] : null;
      let heritageVictoryLine = "";
      let heritageDeathLine = "";
      if (lastLegend) {
        if (lastLegend.legacyStatus === 'stained') {
          heritageVictoryLine = ` Вы искупили позор ${lastLegend.name}, очистив родословную от скверны!`;
          heritageDeathLine = ` Вы пали в ту же грязь, повторив позорную кончину вашего предка ${lastLegend.name}...`;
        } else if (lastLegend.legacyStatus === 'sanctified') {
          heritageVictoryLine = ` Освященное имя предка ${lastLegend.name} направляло ваш клинок.`;
          heritageDeathLine = ` Вы опозорили священное имя предка ${lastLegend.name}, захлебнувшись кровью в этой бездне...`;
        }
      }

      let textToUse = "";
      if (isAmbush) {
        textToUse = `Ты завершил контракт «${task?.title || ''}», одолев врага «${enemy}», но твое промедление привело к трагедии. Придя на встречу, ты наткнулся лишь на растерзанный труп «${npcName}», окруженный шакалами Бездны. \n\nВ ярости ты врубился в строй разбойников. Земля пропиталась грязной кровью, когда последний бандит испустил дух. Запах гари и сырого мяса еще долго будет преследовать тебя, а в карманах нападавших нашлось лишь 10 XP и 5 золотых монет.`;
      } else {
        const fallbacks = {
          victory: `Удар пришелся точно в цель. Зазубренное лезвие вошло по самую рукоять, и эта сука «${enemy}» наконец-то испустила дух, захлебнувшись собственной когнитивной желчью. Твой клинок дымится, а вокруг оседает вонючая тень.${heritageVictoryLine}\n\nТы стоишь по колено в грязи, тяжело дыша, но оковы спали. Голова чиста от дерьма и страхов. ${isLargeQuest || isPastDebt ? 'Этот чертов триумф заставляет тебя вновь поверить в себя, ублюдок, после всей этой бесконечной череды провалов!' : 'Ты победил эту тварь, а значит, и весь остальной мир подождет, пока ты вытираешь кровь с лица.'}`,
          flee: `Пришлось улепетывать. Тварь «${enemy}» оказалась слишком проворной, а ноги вязли в липкой жиже Бездны. Привкус поражения горчит во рту, как протухший эль.\n\nНо хрен там плавал — ты все еще жив. Спрячься в лагере, залижи раны, погрей задницу у костра и возвращайся. Следующий раунд будет за нами, ублюдок.`,
          death: `Лицо встретилось с холодной грязью. Хруст костей, гогот «${enemy}» над ухом и темнота. Твой разум расколот на куски, а костлявая уже тянет свои лапы.${heritageDeathLine}\n\nНо сдохнуть сегодня не получилось. Ты очнулся у костра в лагере. Голова трещит, все тело ноет, но ты дышишь. Поднимайся из дерьма, Изгнанник. Нам еще нужно отплатить этой твари.`
        };
        textToUse = fallbacks[type] || fallbacks.victory;
      }
      setResolutionText(textToUse);

      // Sync fallback chronicle back to the defeated enemy
      if (type === 'victory') {
        setCharacter(prev => {
          const updatedDefeated = prev.defeatedEnemies ? [...prev.defeatedEnemies] : [];
          if (updatedDefeated.length > 0) {
            updatedDefeated[updatedDefeated.length - 1] = {
              ...updatedDefeated[updatedDefeated.length - 1],
              aiChronicle: textToUse
            };
          }
          return {
            ...prev,
            defeatedEnemies: updatedDefeated
          };
        });
      }
    } finally {
      setResolutionLoading(false);
    }
  };

  // Track running state in localStorage
  useEffect(() => {
    localStorage.setItem('combat_is_running', isRunning ? 'true' : 'false');
  }, [isRunning]);

  // Unmount cleanup: Save time and release indicators
  useEffect(() => {
    return () => {
      if (setupStageRef.current === 'active' && activeTaskRef.current) {
        const taskId = activeTaskRef.current.id;
        const storedTime = localStorage.getItem('combat_time_left');
        const finalTime = storedTime !== null ? Number(storedTime) : timeLeftRef.current;
        setTasks(prev => prev.map(t => (t && t.id === taskId) ? { ...t, timeLeft: finalTime } : t));
        localStorage.removeItem('active_task_id');
        localStorage.removeItem('combat_time_left');
        localStorage.setItem('combat_is_running', 'false');
      }
    };
  }, [setTasks]);



  const handleRetreatToHub = () => {
    playClick();
    if (activeTask && activeTask.executionMode === 'timer') {
      if (!window.confirm("Вы собираетесь временно отступить в штаб. Оставшееся время таймера будет сохранено. Продолжить?")) {
        return;
      }
    }
    setIsRunning(false);
    localStorage.setItem('combat_is_running', 'false');

    if (activeTask) {
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, timeLeft: timeLeft } : t));
    }

    localStorage.removeItem('active_task_id');
    localStorage.removeItem('combat_time_left');
    setActiveTask(null);
    setSetupStage('hub');
  };

  // --- LEGACY LEGEND & WIN CONDITION FUNCTIONS ---

  
  const enrichTaskAndLore = async (task) => {
    // If the task already has steps AND custom combatLore, we can skip it
    if (task.steps && task.steps.length > 0 && task.combatLore && !task.combatLore.isGeneric) {
      return;
    }

    try {
      const needsSteps = !task.steps || task.steps.length === 0;
      const level = character.level || 1;
      const completedCount = character.completedTasksCount || 0;
      const moral = character.moralCompass !== undefined ? character.moralCompass : 50;

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
      if (task.type === 'siege') {
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
      if (moral < 45) {
        moraleContext = "У героя низкий, темный дух (плохой дух, Изгой). Он циничен, одинок и готов на все ради денег и выживания (порой 'подъедает' трупы, крадет у слабых или выступает хладнокровным наемником). Его враги и окружение — выжившие изгнанники, подозрительные путешественники, бродячие солдаты, дезертиры империи или крестьяне-людоеды.";
      } else if (moral >= 65) {
        moraleContext = "У героя высокий, благородный дух (Искупленный). Он стремится к искуплению, защищает слабых и готов вступиться за местных жителей в городке или деревушке, куда притопал. Его враги — порождения тьмы, гнилая нежить и бесчестные чудовища.";
      } else {
        moraleContext = "Герой — прагматичный выживающий. Его цели диктуются выживанием во мгле.";
      }

      // 4. Matrix for 300+ enemies keywords to supply the AI
      const prefixOptions = ["Иссохший", "Гнойный", "Чумной", "Бледный", "Одержимый", "Кровавый", "Мертвоглазый", "Костяной", "Каргахаульский", "Ослепший", "Свирепый", "Дикий"];
      const entityOptions = ["Людоед", "Дезертир", "Вор реликвий", "Костяной Жнец", "Болотный химо-слизень", "Мародер империи", "Инквизитор Света", "Элитный паладин", "Бродяга Бездны", "Пепельный Скелет", "Одичавший волк"];
      const randomPrefix = prefixOptions[Math.floor(Math.random() * prefixOptions.length)];
      const randomEntity = entityOptions[Math.floor(Math.random() * entityOptions.length)];
      
      const lastLegend = pedestals && pedestals.length > 0 ? pedestals[pedestals.length - 1] : null;
      let legacyPromptContext = "";
      if (lastLegend && Math.random() < 0.45) { // 45% chance to refer to the legacy, maintaining high variance!
        if (lastLegend.legacyStatus === 'stained') {
          legacyPromptContext = "\n⚠️ ЛЕГЕНДА ПРОШЛОГО (Используй ТОЛЬКО для тонкого намека или редкой издевки, не зацикливайся!): Предыдущий герой (" + lastLegend.name + ", класс " + lastLegend.class + ") погиб в канавах Абаддона, и его имя ЗАПЯТНАНО. Если уместно, пусть враг в своем появлении (\"loreDescription\") мимоходом поглумится над этим позором рода текущего героя (например: \"Я чую запах гнилой крови " + lastLegend.name + " на тебе...\"). Но сохраняй уникальную самобытность текущего врага!";
        } else if (lastLegend.legacyStatus === 'sanctified') {
          legacyPromptContext = "\n⚠️ ЛЕГЕНДА ПРОШЛОГО (Используй ТОЛЬКО для тонкого намека, не зацикливайся!): Предыдущий герой (" + lastLegend.name + ", класс " + lastLegend.class + ") совершил великий триумф, и его имя ОСВЯЩЕНО. Если уместно, пусть враг в своем появлении (\"loreDescription\") выразит ярость или опаску относительно этого благородного рода (например: \"Слава твоего предка " + lastLegend.name + " не спасет тебя от моих когтей...\"). Но сохраняй уникальную самобытность текущего врага!";
        }
      }

      const systemPrompt = `Ты — Древний Летописец Бездны во вселенной Абаддона (grim-dark RPG).
Твоя задача — проанализировать задачу пользователя и вернуть JSON с геймификацией и деконструкцией.
${legacyPromptContext}

ЛОКАЦИЯ И МИР:
Текущая локация героя: ${locationName}.
Контекст окружения: ${locationContext}.

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

2. Если needsSteps равен true, разложи задачу на 4-6 элементарных физических микро-шагов ("steps"). Шаги должны быть геймифицированы (RPG действие + в скобках простое реальное действие, например: "Прочесть первую страницу древнего фолианта (Открыть документацию)"). Также дай краткое намерение квеста ("intent").

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

      const userPrompt = `Задача: "${task.title}". Текущий тип: ${task.type || 'hunt'}. Требуется шагов (needsSteps): ${needsSteps}.`;

      const response = await fetch('http://127.0.0.1:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') throw new Error("AI returned empty content");
        let text = content.trim();
        if (text.startsWith("```json")) text = text.slice(7);
        if (text.endsWith("```")) text = text.slice(0, -3);
        const parsed = JSON.parse(text.trim());

        const updatedLore = {
          enemyName: parsed.enemyName || "Безымянный Ужас Бездны",
          visualType: parsed.type || task.type || 'hunt',
          weakPoints: parsed.weakPoints || ["Враг неповоротлив: начните с простого действия."],
          randomEvent: parsed.randomEvent || "Тьма сгущается над полем боя.",
          loreDescription: parsed.loreDescription || "Жуткая тварь преграждает вам путь.",
          isGeneric: false
        };

        const generatedSteps = parsed.steps ? parsed.steps.map((st, index) => ({
          id: `step-${Date.now()}-${index}`,
          title: st,
          completed: false
        })) : [];

        // Update tasks list in parent state
        setTasks(prev => prev.map(t => t.id === task.id ? {
          ...t,
          type: updatedLore.visualType,
          pomodoroTime: updatedLore.visualType === 'siege' ? 50 : 25,
          combatLore: updatedLore,
          steps: needsSteps ? generatedSteps : t.steps,
          intent: parsed.intent || t.intent
        } : t));

        // Update current activeTask state
        setActiveTask(prev => {
          if (prev && prev.id === task.id) {
            return {
              ...prev,
              type: updatedLore.visualType,
              pomodoroTime: updatedLore.visualType === 'siege' ? 50 : 25,
              combatLore: updatedLore,
              steps: needsSteps ? generatedSteps : prev.steps,
              intent: parsed.intent || prev.intent
            };
          }
          return prev;
        });

        if (needsSteps) {
          setSessionSteps(generatedSteps);
          setEnemyHp(100);
        }

        setEnemyName(updatedLore.enemyName);
        setCombatVignette(`💥 Режим схватки: [${updatedLore.visualType.toUpperCase()}]. ${updatedLore.loreDescription}`);
        setCombatLog(prev => [
          ...prev,
          `⚔️ Духовная связь установлена! Противник опознан как: ${updatedLore.enemyName}.`,
          `👁️ Мысль о слабости врага: "${updatedLore.weakPoints[0]}"`,
          `🌀 Событие поля боя: ${updatedLore.randomEvent}`
        ]);
      }
    } catch (e) {
      console.warn("Could not enrich task and lore with AI, generating procedural local values:", e);
      generateCombatEncounter(task);
    }
  };

  // --- CARRIAGE TASK EDITING LOGIC ---
  const handleOpenEdit = (task) => {
    playClick();
    setEditingTask(task);
    setEditTitle(task.title);
    setEditType(task.type || 'hunt');
    setEditTime(task.pomodoroTime || 25);
    setEditIntent(task.intent || '');
    setEditSteps(task.steps ? [...task.steps] : []);
    setNewStepText('');
    setEditDeadline(task.deadline || '');
    setEditNature(task.nature || 'external');
    setEditExecutionMode(task.executionMode || 'ask_later');
    setGuidedStep(0);
    setGuidedAnswers({});
    setEditAiEditPrompt('');
    setEditAiEditActive(false);
    setEditIsSurvival(task.isSurvival || false);
  };

  const handleSaveEdit = () => {
    playClick();
    if (!editTitle.trim()) return;
    const todayStr = getVirtualTodayStr();
    setTasks(prev => prev.map(t => {
      if (t.id === editingTask.id) {
        const parsedDate = editDeadline ? parseDeadlineTextToDate(editDeadline, todayStr) : null;
        return {
          ...t,
          title: editTitle,
          type: editType,
          pomodoroTime: parseInt(editTime) || 25,
          intent: editIntent,
          steps: editSteps,
          deadline: editDeadline,
          date: parsedDate || t.date || (editDeadline ? todayStr : null),
          nature: editNature,
          executionMode: editExecutionMode,
          isSurvival: editIsSurvival
        };
      }
      return t;
    }));
    playSuccess();
    setEditingTask(null);
    setGuidedStep(0);
    setGuidedAnswers({});
  };

  const handleAddToBacklog = () => {
    playClick();
    setTasks(prev => prev.map(t => {
      if (t.id === editingTask.id) {
        return {
          ...t,
          date: null,
          status: 'active'
        };
      }
      return t;
    }));
    playSuccess();
    spawnFloater("В бэклоге", "heal-hp");
    setEditingTask(null);
  };

  const handleExileTask = () => {
    playBoneCrack();
    setTasks(prev => prev.map(t => {
      if (t.id === editingTask.id) {
        return {
          ...t,
          status: 'buried'
        };
      }
      return t;
    }));
    setCharacter(prev => ({
      ...prev,
      hp: Math.max(10, prev.hp - 15),
      totalHpSacrificed: (prev.totalHpSacrificed || 0) + 15
    }));
    triggerFlash('blood');
    spawnFloater("-15 HP!", "enemy-strike");
    setEditingTask(null);
  };

  const handleDetailedDeconstructInEdit = async () => {
    if (!editTitle.trim()) return;
    playClick();
    setEditDeconstructLoading(true);
    try {
      const tempTask = { title: editTitle, type: editType };
      const response = await requestDeconstruction(tempTask, 'instant');
      if (response && response.steps) {
        const generated = response.steps.map((s, idx) => ({
          id: `step-${idx}-${Date.now()}`,
          title: s,
          completed: false
        }));
        setEditSteps(generated);
        setEditIntent(response.intent || '');
        playSuccess();
      }
    } catch (e) {
      console.warn("AI deconstruction failed, falling back to local steps", e);
      const localSteps = generateLocalSteps(editTitle, editType).map((s, idx) => ({
        id: `step-${idx}-${Date.now()}`,
        title: s,
        completed: false
      }));
      setEditSteps(localSteps);
      setEditIntent("Локальный контракт воли (ИИ Бездны оффлайн)");
      playSuccess();
    } finally {
      setEditDeconstructLoading(false);
    }
  };

  const handleEditStartGuided = async () => {
    if (!editTitle.trim()) return;
    playClick();
    setEditDeconstructLoading(true);
    try {
      const tempTask = { title: editTitle };
      const response = await requestDeconstruction(tempTask, 'guided_questions');
      setGuidedQuestions(response.questions || [
        "Какой технологический стек или инструменты вы планируете использовать?",
        "Какие конкретные функциональные требования должны быть выполнены?",
        "Что будет являться промежуточным результатом, а что итоговым?"
      ]);
      setGuidedStep(1);
    } catch (e) {
      alert("Ошибка запуска ритуала: " + e.message);
    } finally {
      setEditDeconstructLoading(false);
    }
  };

  const handleEditAnswerSubmit = async () => {
    playClick();
    setEditDeconstructLoading(true);
    try {
      const tempTask = { title: editTitle };
      const response = await requestDeconstruction(tempTask, 'guided_steps', {
        questions: guidedQuestions,
        answers: guidedAnswers
      });
      const steps = response.steps.map((s, idx) => ({
        id: `step-${idx}-${Date.now()}`,
        title: s,
        completed: false
      }));
      setEditSteps(steps);
      setEditIntent(response.intent || '');
      setGuidedStep(2);
      playSuccess();
    } catch (e) {
      alert("Ошибка ритуала: " + e.message);
    } finally {
      setEditDeconstructLoading(false);
    }
  };

  const handleEditAiEditSubmit = async () => {
    if (!editTitle.trim() || !editAiEditPrompt.trim()) return;
    setEditDeconstructLoading(true);
    playClick();
    try {
      const stepTitles = editSteps.map(s => s.title);
      const prompt = `Пользователь хочет скорректировать задачу: «${editTitle}» с текущими шагами: ${stepTitles.length > 0 ? stepTitles.join(', ') : 'нет'}.
Инструкция пользователя по изменению: «${editAiEditPrompt}».
Перепиши название задачи и её шаги на основе этой инструкции. Выведи ответ строго в формате JSON:
{
  "title": "Новое название задачи",
  "steps": ["шаг 1", "шаг 2", ...]
}`;
      const response = await fetch('http://127.0.0.1:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) {
        let errMsg = 'AI Tunnel offline';
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg += `: ${errData.error}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error("AI returned empty content");
      let cleanedText = content.trim();
      if (cleanedText.startsWith("```json")) cleanedText = cleanedText.slice(7);
      if (cleanedText.endsWith("```")) cleanedText = cleanedText.slice(0, -3);
      const parsed = JSON.parse(cleanedText.trim());
      if (parsed.steps) {
        setEditTitle(parsed.title || editTitle);
        const generated = parsed.steps.map((s, idx) => ({
          id: `step-${idx}-${Date.now()}`,
          title: s,
          completed: false
        }));
        setEditSteps(generated);
        setEditAiEditActive(false);
        setEditAiEditPrompt('');
        playSuccess();
      }
    } catch (e) {
      alert("Не удалось отредактировать через ИИ: " + e.message);
    } finally {
      setEditDeconstructLoading(false);
    }
  };

  const handleAddEditStep = () => {
    if (!newStepText.trim()) return;
    playClick();
    setEditSteps(prev => [
      ...prev,
      { id: `step-${Date.now()}`, title: newStepText.trim(), completed: false }
    ]);
    setNewStepText('');
  };

  const handleRemoveEditStep = (stepId) => {
    playClick();
    setEditSteps(prev => prev.filter(s => s.id !== stepId));
  };

  const handleToggleEditStep = (stepId) => {
    playClick();
    setEditSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s));
  };

  const handleUpdateEditStepText = (stepId, text) => {
    setEditSteps(prev => prev.map(s => s.id === stepId ? { ...s, title: text } : s));
  };

  // --- RITUAL TIME SUPPORT FUNCTIONS ---
  const handleStartRitual = () => {
    playClick();
    let totalSecs = 600; // default 10 mins
    if (ritualUnit === 'seconds') {
      totalSecs = Number(ritualValue);
    } else if (ritualUnit === 'minutes') {
      totalSecs = Number(ritualValue) * 60;
    } else if (ritualUnit === 'hours') {
      totalSecs = Number(ritualValue) * 3600;
    }

    // Clamp between 5 seconds and 5 hours (18000s)
    totalSecs = Math.max(5, Math.min(18000, totalSecs));

    setRitualTimeTotal(totalSecs);
    setRitualTimeLeft(totalSecs);
    setRitualTimerActive(true);
    setRitualFinished(false);
    setRitualBlessingText('');
  };

  const handleFinishRitual = async (naturalComplete = true) => {
    playSuccess();
    setRitualTimerActive(false);
    setRitualFinished(true);

    const spentSecs = naturalComplete ? ritualTimeTotal : (ritualTimeTotal - ritualTimeLeft);
    const spentMinutes = Math.ceil(spentSecs / 60);

    // Sync active minutes spent to dailyWorkMinutes
    setCharacter(prev => ({
      ...prev,
      dailyWorkMinutes: (prev.dailyWorkMinutes || 0) + spentMinutes
    }));

    setRitualBlessingLoading(true);
    setRitualBlessingText('');

    try {
      const systemPrompt = `Ты — Древний ИИ Бездны во вселенной Абаддона. Игрок завершил священный Ритуал Времени (сосредоточенной работы).
Напиши короткое, вдохновляющее и немного готическое благословение (3-4 предложения), адаптированное под контекст его персонажа:
- Раса: ${character.race || 'Человек'}
- Класс: ${character.class || 'Воин'}
- Уровень: ${character.level}
- Биография: ${character.bio || 'Нет'}
- Побежденные враги: ${JSON.stringify(character.defeatedEnemies || [])}
- Золото: ${character.gold}, Дух: ${character.willpower || 100}

Сделай благословение пафосным, в стиле мрачного фэнтези (Fear & Hunger, Darkest Dungeon), упомянув его победы над конкретными врагами (если они есть) или его расовые/классовые черты. Благослови его на новые свершения и похвали его верность Времени! Пиши на русском языке.`;

      const response = await fetch('http://127.0.0.1:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Ритуал длился ${spentMinutes} минут. Выдай благословение!` }
          ]
        })
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error("AI returned empty content");
      let text = content.trim();
      if (text.startsWith("```json")) text = text.slice(7);
      if (text.endsWith("```")) text = text.slice(0, -3);
      setRitualBlessingText(text);
    } catch (err) {
      setRitualBlessingText(`«Твоя расовая стойкость ${character.race || 'героя'} и концентрация ${character.class || 'искателя'} пронзили туман Бездны. Отрезок времени в ${spentMinutes} мин зачтен в Летопись Судьбы. Ступай вперед, отмеченный благословением Времени!»`);
    } finally {
      setRitualBlessingLoading(false);
    }
  };

  // Ritual Ticking Effect
  useEffect(() => {
    let intervalId = null;
    if (ritualTimerActive && ritualTimeLeft > 0) {
      intervalId = setInterval(() => {
        setRitualTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setRitualTimerActive(false);
            handleFinishRitual(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [ritualTimerActive, ritualTimeLeft]);


  // --- HUNT TIME SUPPORT FUNCTIONS & NARRATIVES ---
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

  const handleStartHunt = () => {
    playClick();
    setHuntIsRunning(true);
    setHuntIsBreak(false);
    setHuntBreakEvent(null);
    setHuntPayoutActive(false);
    setHuntTimeSpent(0);
    setHuntLastBreakCheckpoint(0);
    
    if (huntMode === 'pomodoro') {
      setHuntTimerValue(Math.min(30, huntBreakInterval) * 60);
    }
  };

  const triggerHuntBreak = () => {
    playBoneCrack();
    setHuntIsBreak(true);
    setHuntBreakTimeLeft(1800); // 30 minutes break
    setHuntLastBreakCheckpoint(huntTimeSpent);

    const xpReward = Math.random() < 0.5 ? 5 : 10;
    setCharacter(prev => {
      const nextXp = prev.xp + xpReward;
      const needed = prev.level * 100;
      let nextLvl = prev.level;
      let rx = nextXp;
      if (rx >= needed) {
        nextLvl += 1;
        rx -= needed;
      }
      return {
        ...prev,
        level: nextLvl,
        xp: rx
      };
    });

    const randomEvent = ABERCROMBIE_BREAK_EVENTS[Math.floor(Math.random() * ABERCROMBIE_BREAK_EVENTS.length)];
    setHuntBreakEvent({
      xp: xpReward,
      story: randomEvent.story,
      title: randomEvent.title
    });
  };

  const handleEndHuntBreak = () => {
    playSuccess();
    setHuntIsBreak(false);
    setHuntBreakEvent(null);
    if (huntMode === 'pomodoro') {
      const remainingWorkSecs = (huntBreakInterval * 60) - huntTimeSpent;
      setHuntTimerValue(Math.min(30 * 60, Math.max(0, remainingWorkSecs)));
    }
  };

  const handleSelectHuntPayout = (payoutType) => {
    playSuccess();
    const spentMinutes = Math.floor(huntTimeSpent / 60);
    const intervals = spentMinutes / 30; // base reward per 30 minutes

    // Add work fatigue
    setCharacter(prev => ({
      ...prev,
      dailyWorkMinutes: (prev.dailyWorkMinutes || 0) + spentMinutes
    }));

    if (payoutType === 'free_travel') {
      // Free play awards: Full Gold, XP, Morale!
      const xpEarned = Math.round(intervals * 25);
      const goldEarned = Math.round(intervals * 5);
      const moraleEarned = Math.round(intervals * 5);

      setCharacter(prev => {
        const nextXp = prev.xp + xpEarned;
        const needed = prev.level * 100;
        let nextLvl = prev.level;
        let rx = nextXp;
        if (rx >= needed) {
          nextLvl += 1;
          rx -= needed;
        }
        return {
          ...prev,
          level: nextLvl,
          xp: rx,
          gold: (prev.gold || 0) + goldEarned,
          moralCompass: Math.min(100, (prev.moralCompass || 50) + moraleEarned),
          totalGoldEarned: (prev.totalGoldEarned || 0) + goldEarned
        };
      });

      spawnFloater(`+${xpEarned} XP`, "heal-hp");
      if (goldEarned > 0) spawnFloater(`+${goldEarned} Золото`, "fatigue-recovery");
      if (moraleEarned > 0) spawnFloater(`+${moraleEarned} Мораль`, "restore-mp");

      alert(`🏆 Награда Вольных путешествий начислена! Получено: +${xpEarned} XP, +${goldEarned} Золота, +${moraleEarned} Морального компаса за ${spentMinutes} мин работы!`);
    } else {
      // Doing standard tasks: no gold/morale, but gives 0.25 XP and some willpower spirit!
      const xpEarned = Math.round(intervals * 25 * 0.25);
      const spiritEarned = Math.round(intervals * 5);

      setCharacter(prev => {
        const nextXp = prev.xp + xpEarned;
        const needed = prev.level * 100;
        let nextLvl = prev.level;
        let rx = nextXp;
        if (rx >= needed) {
          nextLvl += 1;
          rx -= needed;
        }
        return {
          ...prev,
          level: nextLvl,
          xp: rx,
          willpower: Math.min(100, (prev.willpower || 100) + spiritEarned)
        };
      });

      spawnFloater(`+${xpEarned} XP`, "heal-hp");
      if (spiritEarned > 0) spawnFloater(`+${spiritEarned} Дух`, "restore-mp");

      alert(`🕯️ Ритуальный бонус задач получен! Получено: +${xpEarned} XP, +${spiritEarned} Силы духа за ${spentMinutes} мин прилежной работы!`);
    }

    // Reset hunt state
    setHuntModalOpen(false);
    setHuntIsRunning(false);
    setHuntIsBreak(false);
    setHuntBreakEvent(null);
    setHuntPayoutActive(false);
    setHuntTimeSpent(0);
    setHuntTimeTotal(0);
  };

  // Hunt Ticking Effect
  useEffect(() => {
    let timerId = null;
    if (huntIsRunning) {
      if (huntIsBreak) {
        if (huntBreakTimeLeft > 0) {
          timerId = setInterval(() => {
            setHuntBreakTimeLeft(prev => prev - 1);
            setHuntTimeTotal(prev => prev + 1);
          }, 1000);
        } else {
          handleEndHuntBreak();
        }
      } else {
        timerId = setInterval(() => {
          let nextSpent = 0;
          setHuntTimeSpent(prev => {
            nextSpent = prev + 1;
            
            // Check if total selected duration is reached
            if (nextSpent >= huntBreakInterval * 60) {
              setTimeout(() => {
                setHuntIsRunning(false);
                setHuntPayoutActive(true);
              }, 0);
            }
            
            // Check for break in stopwatch mode
            if (huntMode === 'stopwatch') {
              const diff = nextSpent - huntLastBreakCheckpoint;
              if (diff >= 30 * 60) {
                setTimeout(() => triggerHuntBreak(), 0);
              }
            }
            
            return nextSpent;
          });
          
          setHuntTimeTotal(prev => prev + 1);

          if (huntMode === 'pomodoro') {
            setHuntTimerValue(prev => {
              if (prev <= 1) {
                // Trigger break only if we haven't reached the end of the total session yet
                if (nextSpent < huntBreakInterval * 60) {
                  setTimeout(() => triggerHuntBreak(), 0);
                }
                return 0;
              }
              return prev - 1;
            });
          }
        }, 1000);
      }
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [huntIsRunning, huntIsBreak, huntBreakTimeLeft, huntMode, huntTimerValue, huntBreakInterval, huntLastBreakCheckpoint]);


  const actuallyStartCombat = (task, mode) => {
    setActiveTask(task);
    const initialTime = task.timeLeft !== undefined ? task.timeLeft : task.pomodoroTime * 60;
    setTimeLeft(initialTime);
    setSessionSteps(task.steps || []);
    generateCombatEncounter(task);
    localStorage.setItem('active_task_id', task.id);
    localStorage.setItem('combat_time_left', initialTime);
    setDeadlineDmgApplied(false);

    if (character.shacklesBroken) {
      setSetupStage('active');
      if (mode === 'timer') {
        localStorage.setItem('combat_timer_start_time', Date.now());
        localStorage.setItem('combat_timer_start_value', initialTime);
        localStorage.setItem('combat_is_running', 'true');
        setIsRunning(true);
      } else {
        localStorage.setItem('combat_is_running', 'false');
        setIsRunning(false);
      }
      setAtmosphereMood(task.type === 'siege' ? 'siege' : 'hunt');
      if (playActiveSessionTrack) playActiveSessionTrack(task.type === 'siege' ? 'siege' : 'hunt');
    } else {
      setSetupStage('crash');
      setAtmosphereMood('escape');
    }
    
    // Async enrich lore and steps using AI!
    enrichTaskAndLore(task);
  };

  const handleStartCombatSession = (task) => {
    resolutionTriggeredRef.current = false;
    
    const triggerPrep = (mode) => {
      setPrepTask(task);
      setPrepExecutionMode(mode);
      setPrepActionInput('');
      setPrepTimerActive(false);
      setPrepTimeLeft(100);
    };

    if (!task.executionMode || task.executionMode === 'ask_later') {
      requestTaskExecutionModeSelect(task, (chosenMode) => {
        triggerPrep(chosenMode);
      });
    } else {
      triggerPrep(task.executionMode);
    }
  };

  const createSingleTaskLocally = (title) => {
    let initialType = 'hunt';
    const lower = title.toLowerCase();
    if (lower.includes('прочитать') || lower.includes('изучить') || lower.includes('почитать') || lower.includes('нарисовать')) {
      initialType = 'relic';
    } else if (lower.includes('уборка') || lower.includes('помыть') || lower.includes('очистить')) {
      initialType = 'siege';
    } else if (lower.includes('хвост') || lower.includes('долг') || lower.includes('старый') || lower.includes('разобрать')) {
      initialType = 'corpse';
    }
    const todayDateStr = new Date().toISOString().split('T')[0];
    const newTask = {
      id: 'task-' + Date.now(),
      title,
      type: initialType,
      status: 'active',
      date: todayDateStr,
      pomodoroTime: initialType === 'siege' ? 50 : 25,
      pomodoroSpent: 0,
      toxicity: 'standard',
      barrierType: null,
      curseLevel: 0,
      createdAt: Date.now(),
      steps: generateLocalSteps(title, initialType).map((s, sIdx) => ({ id: 'step-' + sIdx + '-' + Date.now(), title: s, completed: false })),
      intent: '',
      deadline: '',
      combatLore: {
        enemyName: "Безымянный Ужас Бездны",
        visualType: initialType,
        weakPoints: ["Монстр боится конкретики.", "Разбейте на микро-действия!"],
        randomEvent: "Бой протекает при поддержке Бездны."
      }
    };
    setTasks(prev => [...prev, newTask]);
    handleStartCombatSession(newTask);
    playSuccess();
  };

  const handleCreateAndStartTaskFromNpc = async () => {
    if (!npcNewTaskTitle.trim()) return;
    const rawText = npcNewTaskTitle.trim();
    setNpcNewTaskTitle('');
    playClick();

    setLoadingAI(true);
    setSetupStage('review');
    setReviewIndex(0);
    setReviewGuidedActive(false);
    setReviewGuidedQuestions([]);
    setReviewGuidedAnswers({});
    setReviewAiEditActive(false);
    setReviewAiEditPrompt('');
    
    // Put a placeholder card so the UI doesn't crash while parsing
    setParsedList([{
      title: rawText,
      type: 'hunt',
      estimatedTime: 25,
      toxicity: 'standard',
      isLongJourney: false,
      steps: [],
      intent: '',
      deadline: '',
      executionMode: 'ask_later'
    }]);

    try {
      let result = null;
      if (parseMessyTasks) {
        result = await parseMessyTasks(rawText);
      }
      
      if (result && Array.isArray(result) && result.length > 0) {
        const mapped = result.map(t => {
          const initialType = t.type || 'hunt';
          return {
            title: t.title,
            type: initialType,
            estimatedTime: t.estimatedTime || (initialType === 'siege' ? 50 : 25),
            toxicity: t.toxicity || 'standard',
            isLongJourney: t.isLongJourney || false,
            steps: t.steps || generateLocalSteps(t.title, initialType),
            intent: t.intent || '',
            deadline: t.deadline || '',
            executionMode: t.executionMode || 'ask_later'
          };
        });
        setParsedList(mapped);
      } else {
        // Fallback for single task
        const initialType = classifyLocally(rawText);
        const steps = generateLocalSteps(rawText, initialType);
        setParsedList([{
          title: rawText,
          type: initialType,
          estimatedTime: initialType === 'siege' ? 50 : 25,
          toxicity: 'standard',
          isLongJourney: false,
          steps: steps,
          intent: '',
          deadline: '',
          executionMode: 'ask_later'
        }]);
      }
      playSuccess();
    } catch (err) {
      console.warn("Failed to parse messy task from NPC, falling back to local single task:", err);
      const initialType = classifyLocally(rawText);
      const steps = generateLocalSteps(rawText, initialType);
      setParsedList([{
        title: rawText,
        type: initialType,
        estimatedTime: initialType === 'siege' ? 50 : 25,
        toxicity: 'standard',
        isLongJourney: false,
        steps: steps,
        intent: '',
        deadline: '',
        executionMode: 'ask_later'
      }]);
    } finally {
      setLoadingAI(false);
    }
  };

const handleWinActiveSession = (task) => {
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
    const isSurvival = task?.isSurvival || false;
    const rewardMultiplier = isSurvival ? 2 : 1;
    const baseExpReward = (isAmbush ? 10 : (isSiege ? 60 : 25)) * rewardMultiplier;
    const baseGoldReward = (isAmbush ? 5 : (isSiege ? 15 : 5)) * rewardMultiplier;
    const expReward = baseExpReward + (accumulatedBreakRewards.xp || 0);
    const goldReward = baseGoldReward + (accumulatedBreakRewards.gold || 0);

    // Create Defeated Enemy Object
    const hashStrForIcon = (enemyName || "") + (task?.id || '');
    let hashVal = 0;
    for (let i = 0; i < hashStrForIcon.length; i++) {
      hashVal = hashStrForIcon.charCodeAt(i) + ((hashVal << 5) - hashVal);
    }
    hashVal = Math.abs(hashVal);
    const variationForIcon = COMBAT_VARIATIONS[hashVal % COMBAT_VARIATIONS.length];
    const enemyIcon = task?.combatLore?.enemyIcon || variationForIcon?.icon || "⚔️";

    const defeatedEnemyObj = {
      id: `enemy-${Date.now()}`,
      name: enemyName,
      taskTitle: task?.title || "",
      steps: task?.steps?.map(s => ({ title: s.title, completed: s.completed })) || [],
      estimatedTime: task?.pomodoroTime || 25,
      aiChronicle: "", // Will be filled dynamically by resolution text
      defeatedAt: new Date().toLocaleDateString('ru-RU') + ' в ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      icon: enemyIcon,
      nature: task?.nature || "external",
      type: task?.type || "hunt"
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
      if (isAmbush) {
        updatedBio.push(`На месте встречи Изгнанник обнаружил лишь растерзанное тело ${randNpc.name}. Ему пришлось вступить в бой с устроившими засаду бандитами Бездны. Разбойники перебиты, с их тел снято +${expReward} XP и +${earnedGold} Золота.`);
      } else {
        const modeText = isSurvival ? " [Жизнь и Смерть]" : "";
        const breakText = (accumulatedBreakRewards.xp > 0 || accumulatedBreakRewards.gold > 0)
          ? ` За время привалов в бою зачищены дополнительные цели: +${accumulatedBreakRewards.xp} XP и +${accumulatedBreakRewards.gold} Золота.`
          : "";
        updatedBio.push(`Выполнен контракт${modeText}: "${task?.title || ''}". Встречен ${randNpc.name}. Получено +${expReward} XP и +${earnedGold} Золота.${breakText}`);
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

    setAccumulatedBreakRewards({ xp: 0, gold: 0 });
    triggeredBreaksRef.current.clear();
    
    setSetupStage('resolution');
    setResolutionType('victory');
    handleGenerateResolutionChronicle('victory', task, enemyName, isAmbush, randNpc.name);
  };

  const handleInstantCompleteTask = (task) => {
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
    const eName = task.combatLore?.enemyName || `${variation.prefix} ${variation.suffix}`;
    setEnemyName(eName);

    const moral = character.moralCompass !== undefined ? character.moralCompass : 50;
    const ambushChance = (40 - moral) / 40;
    const isAmbush = moral < 40 && (Math.random() < ambushChance);
    setResolutionIsAmbush(isAmbush);

    // Choose random NPC for encounter
    const randNpc = NPC_ENCOUNTERS[Math.floor(Math.random() * NPC_ENCOUNTERS.length)];
    setResolutionNpc(randNpc);

    const isSiege = task.type === 'siege';
    const isSurvival = task.isSurvival || false;
    const rewardMultiplier = isSurvival ? 2 : 1;
    const expReward = (isAmbush ? 10 : (isSiege ? 60 : 25)) * rewardMultiplier;
    const goldReward = (isAmbush ? 5 : (isSiege ? 15 : 5)) * rewardMultiplier;

    // Create Defeated Enemy Object
    const defeatedEnemyObj = {
      id: `enemy-${Date.now()}`,
      name: eName,
      taskTitle: task.title,
      steps: task.steps?.map(s => ({ title: s.title, completed: s.completed })) || [],
      estimatedTime: task.pomodoroTime || 25,
      aiChronicle: "", // Will be filled dynamically by resolution text
      defeatedAt: new Date().toLocaleDateString('ru-RU') + ' в ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      icon: task.combatLore?.enemyIcon || variation?.icon || "⚔️",
      nature: task.nature || "external",
      type: task.type || "hunt"
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
      if (isAmbush) {
        updatedBio.push(`На месте встречи Изгнанник обнаружил лишь растерзанное тело ${randNpc.name}. Ему пришлось вступить в бой с устроившими засаду бандитами Бездны. Разбойники перебиты, с их тел снято +${expReward} XP и +${earnedGold} Золота.`);
      } else {
        const modeText = isSurvival ? " [Жизнь и Смерть]" : "";
        updatedBio.push(`Выполнен контракт${modeText}: "${task.title}". Встречен ${randNpc.name}. Получено +${expReward} XP и +${earnedGold} Золота.`);
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

    setSetupStage('resolution');
    setResolutionType('victory');
    handleGenerateResolutionChronicle('victory', task, eName, isAmbush, randNpc.name);
  };

  const handleRescheduleTomorrow = (task) => {
    playClick();
    const tomorrowStr = getVirtualTomorrowStr();
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, date: tomorrowStr } : t));
    
    if (task.isSurvival) {
      setCharacter(prev => ({
        ...prev,
        hp: Math.max(1, prev.hp - 15),
        totalHpSacrificed: (prev.totalHpSacrificed || 0) + 15
      }));
      triggerFlash('blood');
      spawnFloater("-15 HP (Перенос)!", "enemy-strike");
    } else {
      spawnFloater("На завтра", "heal-hp");
    }
  };

  const handleMoveToBacklog = (task) => {
    playClick();
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, date: null } : t));
    
    if (task.isSurvival) {
      setCharacter(prev => ({
        ...prev,
        hp: Math.max(1, prev.hp - 15),
        totalHpSacrificed: (prev.totalHpSacrificed || 0) + 15
      }));
      triggerFlash('blood');
      spawnFloater("-15 HP (Перенос)!", "enemy-strike");
    } else {
      spawnFloater("В бэклог", "heal-hp");
    }
  };

  const executeEscapeFate = (task) => {
    playBoneCrack();
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'buried' } : t));
    
    const penaltyDmg = task.isSurvival ? 30 : 15;
    setCharacter(prev => ({
      ...prev,
      hp: Math.max(1, prev.hp - penaltyDmg),
      moralCompass: Math.max(0, (prev.moralCompass || 50) - 10),
      totalHpSacrificed: (prev.totalHpSacrificed || 0) + penaltyDmg
    }));
    triggerFlash('blood');
    spawnFloater(`-${penaltyDmg} HP!`, "enemy-strike");
    spawnFloater("-10 Мораль", "enemy-strike");
  };

  const handleEscapeFate = (task) => {
    playClick();
    setEscapeFatePendingTask(task);
  };

  const renderEscapeFateConfirmationModal = () => {
    if (!escapeFatePendingTask) return null;
    const penaltyDmg = escapeFatePendingTask.isSurvival ? 30 : 15;
    return (
      <div className="gothic-modal-overlay animate-fade-in" style={{ zIndex: 100000 }}>
        <div className="gothic-modal-content" style={{ 
          maxWidth: '500px', 
          border: '2px solid var(--color-blood-glow)',
          boxShadow: '0 0 30px rgba(139, 26, 26, 0.8)',
          background: 'radial-gradient(circle, #1a080a 0%, #050102 100%)',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h2 className="gothic-title" style={{ fontSize: '1.6rem', color: '#ff4d4d', marginBottom: '1rem', textShadow: '0 0 10px rgba(255, 77, 77, 0.5)' }}>
            Твой ли это выбор?
          </h2>
          
          <p style={{ fontSize: '0.95rem', color: 'var(--color-bone)', lineHeight: '1.5', marginBottom: '1.5rem', fontFamily: 'Georgia, serif' }}>
            Побег от предначертанного контракта <strong style={{ color: '#fff' }}>«{escapeFatePendingTask.title}»</strong> нанесет вашему телу <strong style={{ color: '#ff4d4d' }}>-{penaltyDmg} HP</strong> урона и осквернит моральный компас на <strong style={{ color: '#ff4d4d' }}>-10 Морали</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button
              className="rpg-btn rpg-btn-blood"
              style={{ fontWeight: 'bold', fontSize: '0.95rem', padding: '10px' }}
              onClick={() => {
                const t = escapeFatePendingTask;
                setEscapeFatePendingTask(null);
                executeEscapeFate(t);
              }}
            >
              Да, я бегу от своей судьбы
            </button>
            <button
              className="rpg-btn"
              style={{ fontSize: '0.95rem', padding: '10px', borderColor: 'var(--color-iron-light)', color: 'var(--color-bone-dim)' }}
              onClick={() => {
                playClick();
                setEscapeFatePendingTask(null);
              }}
            >
              Нет, поток времени решил всё за меня
            </button>
          </div>
        </div>
      </div>
    );
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
      nickname: character.nickname || "Первый Изгнанник",
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
      legacyStatus: 'sanctified',
      pedestalEulogy: redemptionEulogyText || "Его воля спасла Бездну..."
    };

    // Convert active tasks to "corpse" (Труп прошлого / Debt) for the new character
    setTasks(prev => prev.map(t => {
      if (t.status === 'active') {
        return {
          ...t,
          type: 'corpse',
          curseLevel: Math.min(5, (t.curseLevel || 0) + 1)
        };
      }
      return t;
    }));

    const updatedPedestals = [...pedestals, newLegend];
    savePedestals(updatedPedestals);

    // Reset character using the centralized percentage-based drop utility passing updatedPedestals
    const newChar = rollStartingCharacter(updatedPedestals);
    newChar.intensity = character.intensity || "grim";
    setCharacter(newChar);

    setSetupStage('lore');
    setAtmosphereMood('escape');
  };

  const handleAcceptDeathAndStainName = () => {
    playBoneCrack();
    
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
      pedestalEulogy: resolutionText || "Его когнитивные силы иссякли, разум сдался Бездне..."
    };

    // Convert active tasks to "corpse" (Труп прошлого / Debt) and increase curse
    setTasks(prev => prev.map(t => {
      if (t.status === 'active') {
        return {
          ...t,
          type: 'corpse',
          curseLevel: Math.min(5, (t.curseLevel || 0) + 1)
        };
      }
      return t;
    }));

    const updatedPedestals = [...pedestals, newLegend];
    savePedestals(updatedPedestals);

    // Roll new character with legacy array
    const newChar = rollStartingCharacter(updatedPedestals);
    newChar.intensity = character.intensity || "grim";
    setCharacter(newChar);

    setSetupStage('lore');
    setAtmosphereMood('escape');
  };

  // 1. Persistent Character Check & Session Fetch (Skips lore setup if alive!)
  useEffect(() => {
    if (setupStage !== 'lore') return; // Guard to run only during initial page load
    
    let active = true;
    
    // Fetch active session from local backend
    fetch('http://127.0.0.1:3001/api/active-session')
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data) {
          let hasActiveCombat = false;
          
          if (data.combat && data.combat.activeTask) {
            // Check if task is still in tasks array
            const taskInTasks = tasks.find(t => t.id === data.combat.activeTask.id && t.status === 'active');
            if (taskInTasks) {
              setActiveTask(taskInTasks);
              setTimeLeft(data.combat.timeLeft);
              setIsRunning(data.combat.isRunning);
              setEnemyHp(data.combat.enemyHp);
              setCombatLog(data.combat.combatLog || []);
              setEnemyName(data.combat.enemyName || '');
              setCombatVignette(data.combat.combatVignette || '');
              setSetupStage(data.combat.setupStage || 'active');
              setSessionSteps(taskInTasks.steps || []);
              setDeadlineDmgApplied(data.combat.deadlineDmgApplied || false);
              setTicksWithoutStep(data.combat.ticksWithoutStep || 0);
              hasActiveCombat = true;
              
              // Restore localStorage values for client-side ticking baseline
              if (data.combat.isRunning) {
                localStorage.setItem('combat_timer_start_time', Date.now());
                localStorage.setItem('combat_timer_start_value', data.combat.timeLeft);
                localStorage.setItem('combat_time_left', data.combat.timeLeft);
                localStorage.setItem('combat_is_running', 'true');
              } else {
                localStorage.setItem('combat_is_running', 'false');
              }
              localStorage.setItem('active_task_id', taskInTasks.id);
            }
          }
          
          if (!hasActiveCombat && character && character.race && character.class && character.hp > 0) {
            setSetupStage(data.combat?.setupStage === 'lore' ? 'lore' : 'hub');
          }
          
          if (data.ritual) {
            setRitualTimerActive(data.ritual.ritualTimerActive || false);
            setRitualTimeLeft(data.ritual.ritualTimeLeft || 0);
            setRitualTimeTotal(data.ritual.ritualTimeTotal || 600);
            setRitualUnit(data.ritual.ritualUnit || 'minutes');
            setRitualValue(data.ritual.ritualValue || 10);
            setRitualFinished(data.ritual.ritualFinished || false);
            setRitualBlessingText(data.ritual.ritualBlessingText || '');
          }
          
          if (data.hunt) {
            setHuntIsRunning(data.hunt.huntIsRunning || false);
            setHuntIsBreak(data.hunt.huntIsBreak || false);
            setHuntMode(data.hunt.huntMode || 'pomodoro');
            setHuntBreakInterval(data.hunt.huntBreakInterval || 30);
            setHuntTimerValue(data.hunt.huntTimerValue || 1800);
            setHuntTimeSpent(data.hunt.huntTimeSpent || 0);
            setHuntTimeTotal(data.hunt.huntTimeTotal || 0);
            setHuntBreakTimeLeft(data.hunt.huntBreakTimeLeft || 1800);
            setHuntLastBreakCheckpoint(data.hunt.huntLastBreakCheckpoint || 0);
            setHuntBreakEvent(data.hunt.huntBreakEvent || null);
            setHuntPayoutActive(data.hunt.huntPayoutActive || false);
          }
        }
        setSessionLoaded(true);
      })
      .catch(err => {
        if (!active) return;
        console.warn("Failed to load active session from backend: ", err);
        // Fallback to legacy localStorage method if server is offline
        if (character && character.race && character.class && character.hp > 0) {
          const activeTaskId = localStorage.getItem('active_task_id');
          const activeTaskInTasks = activeTaskId ? tasks.find(t => t.id === activeTaskId && t.status === 'active') : null;
          
          if (activeTaskInTasks) {
            setActiveTask(activeTaskInTasks);
            const storedTime = Number(localStorage.getItem('combat_time_left') || activeTaskInTasks.pomodoroTime * 60);
            setTimeLeft(storedTime);
            setSessionSteps(activeTaskInTasks.steps || []);
            setSetupStage('active');
            generateCombatEncounter(activeTaskInTasks);
            
            const isTimer = activeTaskInTasks.executionMode !== 'day';
            localStorage.setItem('combat_timer_start_time', Date.now());
            localStorage.setItem('combat_timer_start_value', storedTime);
            localStorage.setItem('combat_is_running', isTimer ? 'true' : 'false');
            setDeadlineDmgApplied(storedTime <= 0);
            setIsRunning(isTimer);
          } else {
            setSetupStage('hub');
          }
        }
        setSessionLoaded(true);
      });
      
    return () => {
      active = false;
    };
  }, [character, tasks, setupStage]);

  const syncSessionToBackend = (updates = {}) => {
    const currentSession = {
      combat: {
        activeTask: updates.activeTask !== undefined ? updates.activeTask : activeTask,
        timeLeft: updates.timeLeft !== undefined ? updates.timeLeft : timeLeft,
        isRunning: updates.isRunning !== undefined ? updates.isRunning : isRunning,
        enemyHp: updates.enemyHp !== undefined ? updates.enemyHp : enemyHp,
        combatLog: updates.combatLog !== undefined ? updates.combatLog : combatLog,
        enemyName: updates.enemyName !== undefined ? updates.enemyName : enemyName,
        combatVignette: updates.combatVignette !== undefined ? updates.combatVignette : combatVignette,
        setupStage: updates.setupStage !== undefined ? updates.setupStage : setupStage,
        deadlineDmgApplied: updates.deadlineDmgApplied !== undefined ? updates.deadlineDmgApplied : deadlineDmgApplied,
        ticksWithoutStep: updates.ticksWithoutStep !== undefined ? updates.ticksWithoutStep : ticksWithoutStep
      },
      ritual: {
        ritualTimerActive: updates.ritualTimerActive !== undefined ? updates.ritualTimerActive : ritualTimerActive,
        ritualTimeLeft: updates.ritualTimeLeft !== undefined ? updates.ritualTimeLeft : ritualTimeLeft,
        ritualTimeTotal: updates.ritualTimeTotal !== undefined ? updates.ritualTimeTotal : ritualTimeTotal,
        ritualUnit: updates.ritualUnit !== undefined ? updates.ritualUnit : ritualUnit,
        ritualValue: updates.ritualValue !== undefined ? updates.ritualValue : ritualValue,
        ritualFinished: updates.ritualFinished !== undefined ? updates.ritualFinished : ritualFinished,
        ritualBlessingText: updates.ritualBlessingText !== undefined ? updates.ritualBlessingText : ritualBlessingText
      },
      hunt: {
        huntIsRunning: updates.huntIsRunning !== undefined ? updates.huntIsRunning : huntIsRunning,
        huntIsBreak: updates.huntIsBreak !== undefined ? updates.huntIsBreak : huntIsBreak,
        huntMode: updates.huntMode !== undefined ? updates.huntMode : huntMode,
        huntBreakInterval: updates.huntBreakInterval !== undefined ? updates.huntBreakInterval : huntBreakInterval,
        huntTimerValue: updates.huntTimerValue !== undefined ? updates.huntTimerValue : huntTimerValue,
        huntTimeSpent: updates.huntTimeSpent !== undefined ? updates.huntTimeSpent : huntTimeSpent,
        huntTimeTotal: updates.huntTimeTotal !== undefined ? updates.huntTimeTotal : huntTimeTotal,
        huntBreakTimeLeft: updates.huntBreakTimeLeft !== undefined ? updates.huntBreakTimeLeft : huntBreakTimeLeft,
        huntLastBreakCheckpoint: updates.huntLastBreakCheckpoint !== undefined ? updates.huntLastBreakCheckpoint : huntLastBreakCheckpoint,
        huntBreakEvent: updates.huntBreakEvent !== undefined ? updates.huntBreakEvent : huntBreakEvent,
        huntPayoutActive: updates.huntPayoutActive !== undefined ? updates.huntPayoutActive : huntPayoutActive
      }
    };
    
    fetch('http://127.0.0.1:3001/api/active-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentSession)
    }).catch(err => console.warn("Failed to sync active session to backend: ", err));
  };

  // Debounced session sync to backend
  useEffect(() => {
    if (setupStage === 'lore') return; // Don't sync during initial setup loading phase
    if (!sessionLoaded) return; // Don't sync until backend session has been fetched!
    
    const timerId = setTimeout(() => {
      syncSessionToBackend();
    }, 2000);
    return () => clearTimeout(timerId);
  }, [
    activeTask, timeLeft, isRunning, 
    ritualTimerActive, ritualTimeLeft, ritualTimeTotal,
    huntIsRunning, huntTimeSpent, huntTimerValue, huntMode,
    huntIsBreak, huntBreakTimeLeft, setupStage, enemyHp, combatLog,
    ritualFinished, ritualBlessingText, huntPayoutActive, huntBreakEvent,
    sessionLoaded
  ]);

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

      const enemyName = `${variation.prefix} ${variation.suffix}`;
      const detailedDesc = generateEnrichedEnemyDescription(
        enemyName,
        task.title,
        task.toxicity || 'standard',
        variation
      );

      lore = {
        enemyName: enemyName,
        visualType: variation.type,
        weakPoints: weakPoints,
        randomEvent: randomEvent,
        loreDescription: detailedDesc,
        isGeneric: true
      };
    }

    setEnemyName(lore.enemyName);
    // Calculate initial enemy HP based on already completed steps to support resuming tasks correctly
    if (task.steps && task.steps.length > 0) {
      const totalSteps = task.steps.length;
      const completedSteps = task.steps.filter(s => s.completed).length;
      const dmgPerStep = Math.ceil(100 / totalSteps);
      const remainingHp = Math.max(0, 100 - completedSteps * dmgPerStep);
      setEnemyHp(remainingHp);
    } else {
      setEnemyHp(100);
    }
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

  // Core random initialization of character using the centralized percentage drop utility
  const generateRandomCharacter = () => {
    playClick();
    const newChar = rollStartingCharacter(pedestals);
    newChar.intensity = character?.intensity || "grim";
    setCharacter(newChar);
    setSetupStage('hub');
  };

  // Parse Tasks with AI Tunnel
  const handleParseTasks = async () => {
    if (!messyText.trim()) return;
    setLoadingAI(true);
    playClick();
    try {
      const result = await parseMessyTasks(messyText);
      // Initialize with isLongJourney defaults
      const mapped = result.map(t => ({ ...t, isLongJourney: !!t.isLongJourney }));
      setParsedList(mapped);
      setReviewIndex(0);
      setSetupStage('review');
    } catch (e) {
      alert("Не удалось связаться с Бездной (AI Tunnel): " + e.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleRequestReviewQuestions = async () => {
    if (!parsedList[reviewIndex]) return;
    const currentCard = parsedList[reviewIndex];
    setLoadingAI(true);
    playClick();
    try {
      const prompt = `Ты — Бездна во вселенной Абаддона (grim-dark RPG фэнтези дух). Твоя цель — расспросить Изгнанника о деталях по планируемому контракту: «${currentCard.title}». Шаги прорыва: ${currentCard.steps ? currentCard.steps.join(', ') : 'нет'}.
Задай 3-4 простых, приземленных и крайне конкретных уточняющих вопроса о технических/физических мелочах этой задачи (например, "Какой файл откроешь первым?", "Каким инструментом воспользуешься?"). Формулируй их кратко и атмосферно в стиле темного фэнтези.
Ответ выведи СТРОГО в формате JSON:
{
  "questions": ["Вопрос 1", "Вопрос 2", "Вопрос 3"]
}`;
      const response = await fetch('http://127.0.0.1:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) {
        let errMsg = 'AI Tunnel offline';
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg += `: ${errData.error}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error("AI returned empty content");
      let cleanedText = content.trim();
      if (cleanedText.startsWith("```json")) cleanedText = cleanedText.slice(7);
      if (cleanedText.endsWith("```")) cleanedText = cleanedText.slice(0, -3);
      const parsed = JSON.parse(cleanedText.trim());
      if (parsed.questions) {
        setReviewGuidedQuestions(parsed.questions);
        setReviewGuidedAnswers({});
        setReviewGuidedActive(true);
        playSuccess();
      }
    } catch (e) {
      alert("Не удалось запросить вопросы от Бездны: " + e.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleReviewAnswerSubmit = async () => {
    if (!parsedList[reviewIndex]) return;
    const currentCard = parsedList[reviewIndex];
    setLoadingAI(true);
    playClick();
    try {
      const qaText = reviewGuidedQuestions.map((q, idx) => `Вопрос: ${q}\nОтвет: ${reviewGuidedAnswers[idx] || ''}`).join('\n');
      const prompt = `Пользователь планирует задачу: «${currentCard.title}». Исходные шаги: ${currentCard.steps ? currentCard.steps.join(', ') : 'нет'}.
Вот ответы пользователя на уточняющие вопросы:
${qaText}
Используя эту информацию, перепиши и максимально подробно деконструируй задачу на 6-10 понятных, простейших физических микро-шагов, чтобы снизить когнитивную нагрузку. Выведи ответ строго в формате JSON:
{
  "title": "Уточненное название задачи",
  "steps": ["микро-шаг 1", "микро-шаг 2", ...]
}`;
      const response = await fetch('http://127.0.0.1:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) {
        let errMsg = 'AI Tunnel offline';
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg += `: ${errData.error}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error("AI returned empty content");
      let cleanedText = content.trim();
      if (cleanedText.startsWith("```json")) cleanedText = cleanedText.slice(7);
      if (cleanedText.endsWith("```")) cleanedText = cleanedText.slice(0, -3);
      const parsed = JSON.parse(cleanedText.trim());
      if (parsed.steps) {
        setParsedList(prev => prev.map((item, idx) => idx === reviewIndex ? { 
          ...item, 
          title: parsed.title || item.title, 
          steps: parsed.steps 
        } : item));
        setReviewGuidedActive(false);
        setReviewGuidedQuestions([]);
        setReviewGuidedAnswers({});
        playSuccess();
      }
    } catch (e) {
      alert("Не удалось завершить разбор через ИИ: " + e.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleReviewAiEditSubmit = async () => {
    if (!parsedList[reviewIndex] || !reviewAiEditPrompt.trim()) return;
    const currentCard = parsedList[reviewIndex];
    setLoadingAI(true);
    playClick();
    try {
      const prompt = `Пользователь хочет скорректировать задачу: «${currentCard.title}» с текущими шагами: ${currentCard.steps ? currentCard.steps.join(', ') : 'нет'}.
Инструкция пользователя по изменению: «${reviewAiEditPrompt}».
Перепиши название задачи и её шаги на основе этой инструкции. Выведи ответ строго в формате JSON:
{
  "title": "Новое название задачи",
  "steps": ["шаг 1", "шаг 2", ...]
}`;
      const response = await fetch('http://127.0.0.1:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) {
        let errMsg = 'AI Tunnel offline';
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg += `: ${errData.error}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error("AI returned empty content");
      let cleanedText = content.trim();
      if (cleanedText.startsWith("```json")) cleanedText = cleanedText.slice(7);
      if (cleanedText.endsWith("```")) cleanedText = cleanedText.slice(0, -3);
      const parsed = JSON.parse(cleanedText.trim());
      if (parsed.steps) {
        setParsedList(prev => prev.map((item, idx) => idx === reviewIndex ? { 
          ...item, 
          title: parsed.title || item.title, 
          steps: parsed.steps 
        } : item));
        setReviewAiEditActive(false);
        setReviewAiEditPrompt('');
        playSuccess();
      }
    } catch (e) {
      alert("Не удалось отредактировать через ИИ: " + e.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleDetailedDeconstruction = async () => {
    if (!parsedList[reviewIndex]) return;
    const currentCard = parsedList[reviewIndex];
    setLoadingAI(true);
    playClick();
    try {
      const prompt = `Ты — Бездна во вселенной Абаддона. Разложи задачу «${currentCard.title}» на 5-8 максимально мелких, понятных физических микро-шагов, чтобы человек с СДВГ мог приступить к ней без паники и ступора. Текущие шаги: ${currentCard.steps ? currentCard.steps.join(', ') : 'нет'}. Выведи ответ строго в формате JSON: { "steps": ["микро-шаг 1", "микро-шаг 2", ...] }`;
      
      const response = await fetch('http://127.0.0.1:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) {
        let errMsg = 'AI Tunnel offline';
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg += `: ${errData.error}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error("AI returned empty content");
      let cleanedText = content.trim();
      if (cleanedText.startsWith("```json")) cleanedText = cleanedText.slice(7);
      if (cleanedText.endsWith("```")) cleanedText = cleanedText.slice(0, -3);
      const parsed = JSON.parse(cleanedText.trim());
      
      if (parsed.steps) {
        setParsedList(prev => prev.map((item, idx) => {
          if (idx === reviewIndex) {
            return { ...item, steps: parsed.steps };
          }
          return item;
        }));
        playSuccess();
      }
    } catch (e) {
      alert("Не удалось детализировать шаги: " + e.message);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (setupStage === 'review' && parsedList && parsedList[reviewIndex]) {
      const currentCard = parsedList[reviewIndex];
      const hasNoSteps = !currentCard.steps || currentCard.steps.length === 0;
      if (hasNoSteps && autoAskedForIndex !== reviewIndex && !reviewGuidedActive && !loadingAI) {
        setAutoAskedForIndex(reviewIndex);
        handleRequestReviewQuestions();
      }
    }
  }, [setupStage, reviewIndex, parsedList, autoAskedForIndex, reviewGuidedActive, loadingAI]);

  const handleSplitReviewTask = (index) => {
    const taskToSplit = parsedList[index];
    if (!taskToSplit) return;
    
    const halfTime = Math.max(15, Math.round((taskToSplit.estimatedTime || 25) / 2));
    
    const part1 = {
      ...taskToSplit,
      title: `${taskToSplit.title} (Часть I: Подготовка)`,
      estimatedTime: halfTime,
      steps: taskToSplit.steps ? taskToSplit.steps.slice(0, Math.ceil(taskToSplit.steps.length / 2)) : []
    };
    
    const part2 = {
      ...taskToSplit,
      title: `${taskToSplit.title} (Часть II: Завершение)`,
      estimatedTime: halfTime,
      steps: taskToSplit.steps ? taskToSplit.steps.slice(Math.ceil(taskToSplit.steps.length / 2)) : [],
      deadline: 'Завтра'
    };
    
    setParsedList(prev => {
      const copy = [...prev];
      copy.splice(index, 1, part1, part2);
      return copy;
    });
    playSuccess();
  };

  const handleStartCrashSequence = (listToUse = null, skipCombat = false) => {
    playClick();
    const todayStr = new Date().toISOString().split('T')[0];
    const sourceList = listToUse || parsedList;
    
    const newTasks = sourceList.map((t, idx) => {
      // Hashing and pre-generating lore profiles for parsed tasks
      const hashStr = t.title + idx;
      let hash = 0;
      for (let i = 0; i < hashStr.length; i++) {
        hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      hash = Math.abs(hash);
      const variation = COMBAT_VARIATIONS[hash % COMBAT_VARIATIONS.length];

      // Procedural rich ADHD weakness insights
      const allWeakPoints = [
        ["Монстр боится правила 5 минут: первый физический шаг разрушит его броню.", "Враг неповоротлив: начните с самого простого действия, чтобы войти в его слепую зону."],
        ["Слабость врага: Боится расщепления. Разбейте первый шаг на микро-физические действия.", "Страх отступит: сделайте глубокий вдох на 4 секунды и выдохните тревогу."],
        ["Слабость врага: Не выносит ритмичной музыки. Запустите Spotify-трек и действуйте на скорость!", "Усыпите его бдительность: согласитесь поработать ровно 10 минут, а затем устройте привал."],
        ["Слабость врага: Ненавидит конкретику. Дайте четкое письменное намерение квеста.", "Противник ослепнет: перепишите шаг, указав точное физическое действие в скобках."],
        ["Монстр беспомощен перед правилом 2 минут: сделайте микроскопическое действие прямо сейчас.", "Слабое место: враг слепнет, если вы уберете телефон во внутренний карман доспехов."],
        ["Сила монстра иссякнет, если вы просто откроете рабочий файл и посмотрите на него 60 секунд.", "Уязвимость: монстр теряет бдительность, если начать делать задачу криво и неидеально."],
        ["Враг боится смены обстановки: встаньте и потянитесь перед началом битвы.", "Слабость: монстр питается вашим перфекционизмом. Разрешите себе сделать работу на троечку."]
      ];
      const selectedWeakPoints = allWeakPoints[hash % allWeakPoints.length];

      // Procedural battle events
      const events = [
        "Допаминовая Вспышка: Двойной опыт за этот бой!",
        "Густой Туман Бездны скрывает точные значения здоровья противника.",
        "Аура Стойкости: Любой удар по врагу восстанавливает 2 MP маны.",
        "Дыхание Скверны: Время идет чуть быстрее, но враг бьет слабее.",
        "Алтарь Рун: Проведение шага наносит противнику сокрушительный критический урон!"
      ];
      const selectedEvent = events[hash % events.length];

      return {
        id: `task-${Date.now()}-${idx}`,
        title: t.title,
        type: t.type || 'hunt',
        status: 'active',
        date: t.scheduledDate || parseDeadlineTextToDate(t.deadline, todayStr) || todayStr, 
        pomodoroTime: t.estimatedTime || 25,
        pomodoroSpent: 0,
        toxicity: t.toxicity || 'standard',
        barrierType: null,
        curseLevel: 0,
        isLongJourney: t.isLongJourney || false,
        createdAt: Date.now(),
        steps: (t.steps && t.steps.length > 0) 
          ? t.steps.map((s, sIdx) => ({ id: `step-${sIdx}-${Date.now()}`, title: s, completed: false })) 
          : generateLocalSteps(t.title, t.type || 'hunt').map((s, sIdx) => ({ id: `step-${sIdx}-${Date.now()}`, title: s, completed: false })),
        intent: t.intent || '',
        deadline: t.deadline || '',
        nature: t.nature || 'external',
        executionMode: t.executionMode || 'ask_later',
        combatLore: {
          enemyName: t.enemyName || `${variation.prefix} ${variation.suffix}`,
          visualType: t.visualType || variation.type,
          weakPoints: t.weakPoints || selectedWeakPoints,
          randomEvent: t.randomEvent || selectedEvent
        }
      };
    });

    setTasks(prev => [...prev, ...newTasks]);

    // Always go to the contracts grid lobby so the user can choose which quest to start!
    setActiveTask(null);
    setSetupStage('hub');
    localStorage.removeItem('active_task_id');
    localStorage.setItem('combat_is_running', 'false');
    setIsRunning(false);
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

    const initialTime = timeLeft;
    const isTimer = activeTask?.executionMode !== 'day';
    localStorage.setItem('combat_timer_start_time', Date.now());
    localStorage.setItem('combat_timer_start_value', initialTime);
    localStorage.setItem('combat_is_running', isTimer ? 'true' : 'false');
    setDeadlineDmgApplied(false);
    setIsRunning(isTimer);

    setAtmosphereMood(activeTask?.type === 'siege' ? 'siege' : 'hunt');
    if (playActiveSessionTrack) playActiveSessionTrack(activeTask?.type === 'siege' ? 'siege' : 'hunt');
  };

  // Active Session Focus Timer & Fatigue accumulation & Ticking Combat Damage (Background friendly!)
  useEffect(() => {
    let timer = null;
    if (setupStage === 'active' && isRunning && !meditationActive && activeTask?.executionMode !== 'day') {
      timer = setInterval(() => {
        const startTime = Number(localStorage.getItem('combat_timer_start_time') || Date.now());
        const startVal = Number(localStorage.getItem('combat_timer_start_value') || 1500);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const nextTime = startVal - elapsed;

        setTimeLeft(nextTime);
        localStorage.setItem('combat_time_left', nextTime);

        // Check and trigger combat break every 30 minutes (1800 seconds)
        if (activeTask && activeTask.executionMode !== 'day') {
          const totalSessionTime = activeTask.pomodoroTime * 60;
          const elapsedSecs = totalSessionTime - nextTime;
          const breakInterval = 1800; // 30 minutes
          const breakIndex = Math.floor(elapsedSecs / breakInterval);
          
          if (breakIndex > 0 && !triggeredBreaksRef.current.has(breakIndex) && nextTime > 0) {
            triggeredBreaksRef.current.add(breakIndex);
            setIsRunning(false);
            localStorage.setItem('combat_is_running', 'false');
            
            const proceduralBreakTasks = [
              { id: `break-task-1-${Date.now()}`, title: "💆 Когнитивная передышка (Сделать разминку шеи и плеч - 1 мин)", completed: false, xp: 5, gold: 2 },
              { id: `break-task-2-${Date.now()}`, title: "💧 Эликсир Жизни (Выпить стакан чистой воды)", completed: false, xp: 5, gold: 2 },
              { id: `break-task-3-${Date.now()}`, title: "💨 Дыхание Бездны (Сделать 5 глубоких вдохов по квадрату)", completed: false, xp: 5, gold: 2 }
            ];
            
            setActiveCombatBreak({
              index: breakIndex,
              tasks: proceduralBreakTasks
            });
            
            playBoneCrack();
            playSuccess();
            
            setCombatLog(log => [
              `⛺ [ПРИВАЛ БОЯ] Достигнута отметка в 30 минут сражения! Таймер приостановлен. Время передохнуть и набраться сил!`,
              ...log.slice(0, 5)
            ]);
            return;
          }
        }

        // 1. Fatigue accumulator (caps work daily limits) using accurate delta
        const now = Date.now();
        const deltaSec = Math.max(0, (now - lastTickTimeRef.current) / 1000);
        lastTickTimeRef.current = now;

        setCharacter(c => {
          const nextMin = (c.dailyWorkMinutes || 0) + (deltaSec / 60);
          return { ...c, dailyWorkMinutes: nextMin };
        });

        // 2. Overtime Damage system: Enemy deals damage only if time is expired (timeLeft <= 0)
        if (nextTime <= 0) {
          // If all steps are completed, win immediately
          if (sessionSteps.length > 0 && sessionSteps.every(s => s.completed)) {
            handleWinActiveSession(activeTask);
            return;
          }

          if (!deadlineDmgApplied) {
            setDeadlineDmgApplied(true);
            playBoneCrack();
            let died = false;
            setCharacter(c => {
              const nextHp = Math.max(10, c.hp - 15);
              if (nextHp <= 10 && c.hp > 10) {
                died = true;
              }
              return { ...c, hp: nextHp };
            });
            triggerFlash('blood');
            spawnFloater("-15 HP!", "enemy-strike");
            setCombatLog(log => [
              `💥 [Дедлайн] Время истекло! Противник ${enemyName} наносит вам сокрушительный удар на 15 HP за опоздание!`,
              ...log.slice(0, 5)
            ]);

            if (died) {
              if (resolutionTriggeredRef.current) return;
              resolutionTriggeredRef.current = true;
              setIsRunning(false);
              setSetupStage('resolution');
              setResolutionType('death');

              // Convert active tasks to corpse and increase curse level as penalty
              setTasks(prev => prev.map(t => {
                if (t.status === 'active') {
                  return {
                    ...t,
                    type: 'corpse',
                    curseLevel: Math.min(5, (t.curseLevel || 0) + 1)
                  };
                }
                return t;
              }));

              handleGenerateResolutionChronicle('death', activeTask, enemyName);
            }
          }
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [setupStage, isRunning, meditationActive, activeTask, sessionSteps, enemyName, deadlineDmgApplied]);

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

  // Break Event Timer: мини-перерыв каждые 30 мин, большой привал каждые 1.5 часа активной работы
  useEffect(() => {
    let breakTimer = null;
    if (setupStage === 'active' && isRunning && !meditationActive && !breakEvent) {
      breakTimer = setInterval(() => {
        sessionElapsedRef.current += 1;
        const elapsed = sessionElapsedRef.current;
        const sinceLastMini = elapsed - lastMiniBreakRef.current;
        const sinceLastBig = elapsed - lastBigBreakRef.current;

        if (sinceLastBig >= 5400) {
          triggerBreakEvent('big');
          lastBigBreakRef.current = elapsed;
          lastMiniBreakRef.current = elapsed;
        } else if (sinceLastMini >= 1800) {
          triggerBreakEvent('mini');
          lastMiniBreakRef.current = elapsed;
        }
      }, 1000);
    }
    return () => clearInterval(breakTimer);
  }, [setupStage, isRunning, meditationActive, breakEvent]);

  const triggerBreakEvent = (type) => {
    playClick();
    setIsRunning(false);
    const npc = NPC_ENCOUNTERS[Math.floor(Math.random() * NPC_ENCOUNTERS.length)];
    const moral = character.moralCompass !== undefined ? character.moralCompass : 50;
    const ambushChance = (40 - moral) / 40;
    const isAmbush = moral < 40 && (Math.random() < ambushChance);

    setBreakEvent({ type, npc, isAmbush });
    setBreakAiText('');
    setBreakAiLoading(false);
    setBreakActivityChoice(type === 'big' ? 'eat' : 'breathing');
    setAtmosphereMood('recovery');
  };

  const handleBreakAiGenerate = async () => {
    if (!breakEvent) return;
    setBreakAiLoading(true);
    setBreakAiText('');
    const activities = breakEvent.type === 'big' ? BIG_BREAK_ACTIVITIES : MINI_BREAK_ACTIVITIES;
    const activity = activities.find(a => a.id === breakActivityChoice) || activities[0];
    const npc = breakEvent.npc;

    const moralVal = character.moralCompass !== undefined ? character.moralCompass : 50;
    let spiritContext = "";
    if (moralVal >= 80) {
      spiritContext = `\nСИЛА ДУХА И МЕНТАЛЬНОЕ СОСТОЯНИЕ: Искупленный (${moralVal}/100). Изгнанник милосерден, смирен, глубок духом, покорен предначертанию Времени, его диалоги с NPC добрые, он выражает искреннюю благодарность и скромен. NPC говорят с ним тепло и уважительно.`;
    } else if (moralVal >= 60) {
      spiritContext = `\nСИЛА ДУХА И МЕНТАЛЬНОЕ СОСТОЯНИЕ: Стойкий Путник (${moralVal}/100). Изгнанник вежлив, покоен, скромен, сосредоточен на искуплении долга, уважает тех, кто делит с ним костер.`;
    } else if (moralVal >= 40) {
      spiritContext = `\nСИЛА ДУХА И МЕНТАЛЬНОЕ СОСТОЯНИЕ: Черствый Скиталец (${moralVal}/100). Изгнанник безразличен, холоден, отвечает односложно и безразлично, его заботит только выживание. NPC реагируют так же сухо.`;
    } else if (moralVal >= 20) {
      spiritContext = `\nСИЛА ДУХА И МЕНТАЛЬНОЕ СОСТОЯНИЕ: Падший Изгой (${moralVal}/100). Изгнанник озлоблен, раздражителен, говорит сквозь зубы, полон злобы и затаенной боли, грубит NPC. NPC отвечают ему с опаской, презрением или скрытой враждебностью.`;
    } else {
      spiritContext = `\nСИЛА ДУХА И МЕНТАЛЬНОЕ СОСТОЯНИЕ: Мясник Бездны (${moralVal}/100). Полное падение духа. Изгнанник безумен от боли, жесток, кровожаден, диалоги полны угрожающей тьмы и ненависти. Встреченные NPC боятся его или нападают первыми в самообороне. Опиши атмосферу дикой жестокости, где он едва сдерживает себя, чтобы не совершить убийство хорошего человека у костра.`;
    }

    const loreGuidelines = `
ПРАВИЛА ИМЕНОВАНИЯ И ЛОРА:
1. НИКОГДА не выдумывай и не используй конкретные имена. Протагонист — БЕЗЛИКОЕ НИЧТО, у которого не осталось прошлого.
2. ВСЕГДА называй его только «Изгнанник» или по его классу/расе (например, «Изгнанник-Маг меток», «Изгнанный эльф» с учетом переданных класса и расы).
3. Его былая личность выжжена дотла. В его памяти лишь шрамы, ожоги, фантомная боль от бесконечных прошлых избиений, пыток, удушений и ментального насилия в застенках Бездны, откуда его израненным вышвырнули в повозку смерти сражаться из последних сил.

ЗАПРЕТ НА ВУЛЬГАРНОСТЬ И ТУАЛЕТНЫЙ ЮМОР:
Строго ЗАПРЕЩЕН любой туалетный юмор, физиологические отвратительные подробности (мочеиспускание, испражнения и т.д.). Держи суровый, реалистичный, трагический и пафосный тон темного фэнтези Джо Аберкромби без дешевой пошлости.
${spiritContext}
`;

    let prompt = '';
    if (breakEvent.isAmbush) {
      prompt = `Ты — Летописец Бездны во вселенной Абаддона. Опиши короткую летопись в стиле Джо Аберкромби.
Изгнанник (класс: ${character.class}, раса: ${character.race}) собирался сделать перерыв, но обнаружил лишь растерзанный труп «${npc.name}» и засаду разбойников Бездны. Ему пришлось драться за свою жизнь. Опиши эту внезапную схватку в темноте и то, как он перебил бандитов Бездны. 4-5 предложений.
${loreGuidelines}`;
    } else {
      if (npc.type === 'mirror') {
        prompt = `Ты — ${npc.name}, ${npc.prompt}. Изгнанник (класс: ${character.class}, раса: ${character.race}, ур.${character.level}) выбрал перерыв: «${activity.label}» (в лоре: ${activity.lore}). Порицай его прокрастинацию как грех изгнанника, напомни что он мог бы избежать Бездны будь он внимательнее к себе, но дай шанс искупиться через эту активность. Жёстко но справедливо, тёмное фэнтези. 4-5 предложений.
${loreGuidelines}`;
      } else if (npc.type === 'provoking') {
        prompt = `Ты — ${npc.name}, ${npc.prompt}. Изгнанник (класс: ${character.class}, ур.${character.level}) делает перерыв: «${activity.label}» (${activity.lore}). Подначь его, спровоцируй вернуться в бой после перерыва ещё сильнее. Дерзко но с уважением. Тёмное фэнтези. 3-4 предложения.
${loreGuidelines}`;
      } else if (npc.type === 'helping') {
        prompt = `Ты — ${npc.name}, ${npc.prompt}. Изгнанник (класс: ${character.class}, раса: ${character.race}) делает перерыв: «${activity.label}» (${activity.lore}). Помоги практическим советом в стиле своего персонажа. Объясни пользу через метафору мира Абаддона. 3-4 предложения.
${loreGuidelines}`;
      } else {
        prompt = `Ты — ${npc.name}, ${npc.prompt}. Изгнанник (класс: ${character.class}, раса: ${character.race}, ур.${character.level}) делает перерыв: «${activity.label}» (${activity.lore}). Мотивируй его, скажи мудрое и ободряющее в стиле тёмного фэнтези мира Абаддона. 3-4 предложения.
${loreGuidelines}`;
      }
      if (breakEvent.type === 'big') {
        prompt += ' Это БОЛЬШОЙ привал (1.5 часа работы). Опиши восстановление ран, маны, еду у костра. Подчеркни важность полноценного отдыха для когнитивного здоровья.';
      }
    }

    try {
      const response = await fetch('http://127.0.0.1:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) throw new Error('AI недоступен');
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error("AI returned empty content");
      setBreakAiText(content);
      playSuccess();
    } catch (e) {
      if (breakEvent.isAmbush) {
        setBreakAiText(`«Привал осквернен кровью»\n\nВместо костра и мирной беседы тебя ждал лишь изуродованный труп «${npc.name}» и оскал разбойников Бездны. Пришлось вынимать оружие. Грязь, крики, хруст стали о кости. Когда все стихло, ты остался стоять среди трупов, тяжело дыша.`);
      } else {
        const fallbacks = {
          mirror: `«${npc.name} смотрит сквозь тебя ледяным взглядом»\n\nТвоя слабость — не в теле, а в разуме. Ты откладывал, прятался, убегал от себя. Именно поэтому ты здесь, в Бездне. Но сейчас у тебя есть выбор: сделать ${activity.label.toLowerCase()}, и доказать что ты сильнее своих демонов.`,
          provoking: `«${npc.name} усмехается»\n\nХа! Ты думаешь, что заслужил отдых? Может быть. Но не затягивай — враги не ждут. Сделай ${activity.label.toLowerCase()} и возвращайся. Докажи, что ты не трус.`,
          helping: `«${npc.name} кивает»\n\n${activity.label} — мудрый выбор, путник. В мире Бездны даже короткий привал может спасти жизнь. Позаботься о себе, чтобы потом сражаться с удвоенной силой.`,
          motivating: `«${npc.name} улыбается»\n\nТы уже прошёл так далеко, воин. ${activity.label} — это не слабость, это мудрость. Даже величайшие герои отдыхали у костра перед решающей битвой.`
        };
        setBreakAiText(fallbacks[npc.type] || fallbacks.motivating);
      }
    } finally {
      setBreakAiLoading(false);
    }
  };

  const handleDismissBreak = (applyRewards) => {
    playClick();
    if (applyRewards && breakEvent) {
      playSuccess();
      if (breakEvent.isAmbush) {
        triggerFlash('blood');
        setCharacter(prev => {
          const nextXp = prev.xp + 10;
          const xpNeeded = prev.level * 100;
          let nextLevel = prev.level;
          let remXp = nextXp;
          let extraGold = 0;
          if (remXp >= xpNeeded) {
            nextLevel += 1;
            remXp -= xpNeeded;
            extraGold = 15;
          }
          const earnedGold = 5 + extraGold;

          const updatedBio = [...(prev.biography || [])];
          updatedBio.push(`При попытке устроить привал Изгнанник столкнулся с засадой бандитов Бездны, убивших ${breakEvent.npc.name}. Разбойники перебиты, получено +10 XP и +5 Золота.`);

          return {
            ...prev,
            level: nextLevel,
            xp: remXp,
            gold: (prev.gold || 0) + earnedGold,
            totalGoldEarned: (prev.totalGoldEarned || 0) + earnedGold,
            biography: updatedBio
          };
        });
        spawnFloater('+10 XP', 'heal-hp');
        spawnFloater('+5 Золота', 'restore-mp');
        setCombatLog(log => [`⚔️ Засада бандитов! NPC «${breakEvent.npc.name}» убит. Получено +10 XP и +5 Золота с тел разбойников.`, ...log.slice(0, 5)]);
      } else {
        triggerFlash('heal');
        if (breakEvent.type === 'big') {
          setCharacter(prev => ({
            ...prev,
            hp: Math.min(prev.maxHp, prev.hp + 20),
            mana: Math.min(prev.maxMana, prev.mana + 15),
            dailyWorkMinutes: Math.max(0, prev.dailyWorkMinutes - 30),
            meditationsCount: (prev.meditationsCount || 0) + 1
          }));
          spawnFloater('+20 HP', 'heal-hp');
          spawnFloater('+15 MP', 'restore-mp');
          spawnFloater('-30мин Усталости', 'fatigue-recovery');
          setCombatLog(log => [`🏕️ Большой привал завершён! Раны залечены, мана восстановлена, усталость отступила.`, ...log.slice(0, 5)]);
        } else {
          setCharacter(prev => ({
            ...prev,
            hp: Math.min(prev.maxHp, prev.hp + 8),
            mana: Math.min(prev.maxMana, prev.mana + 5),
            dailyWorkMinutes: Math.max(0, prev.dailyWorkMinutes - 10)
          }));
          spawnFloater('+8 HP', 'heal-hp');
          spawnFloater('+5 MP', 'restore-mp');
          setCombatLog(log => [`🕯️ Мини-привал завершён. Встреча с «${breakEvent.npc.name}» укрепила дух.`, ...log.slice(0, 5)]);
        }
      }
    }
    setBreakEvent(null);
    setBreakAiText('');
    const isTimer = activeTask?.executionMode !== 'day';
    setIsRunning(isTimer);
    setAtmosphereMood(activeTask?.type === 'siege' ? 'siege' : 'hunt');
  };

  const toggleTimer = () => {
    playClick();
    if (isRunning) {
      setIsRunning(false);
      localStorage.setItem('combat_is_running', 'false');
    } else {
      localStorage.setItem('combat_timer_start_time', Date.now());
      localStorage.setItem('combat_timer_start_value', timeLeft);
      localStorage.setItem('combat_is_running', 'true');
      setIsRunning(true);
    }
  };

  const formatTime = (secs) => {
    const isNegative = secs < 0;
    const absSecs = Math.abs(secs);
    const m = Math.floor(absSecs / 60).toString().padStart(2, '0');
    const s = (absSecs % 60).toString().padStart(2, '0');
    return `${isNegative ? '-' : ''}${m}:${s}`;
  };

  const recalculateEnemyHp = (steps) => {
    if (!steps || steps.length === 0) return 100;
    const total = steps.length;
    const completed = steps.filter(s => s.completed).length;
    if (completed === total) return 0;
    const dmgPerStep = 100 / total;
    return Math.max(1, Math.round(100 - completed * dmgPerStep));
  };

  const handleToggleStep = (stepId) => {
    playClick();
    
    // Complete active step -> Hero strikes the enemy!
    const step = sessionSteps.find(s => s.id === stepId);
    if (!step) return;
    const wasCompleted = step.completed;

    const updatedSteps = sessionSteps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s);
    setSessionSteps(updatedSteps);
    if (activeTask) {
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, steps: updatedSteps } : t));
    }

    if (!wasCompleted) {
      playSuccess();
      
      // Calculate damage dealt based on step size
      const dmg = Math.ceil(100 / updatedSteps.length);
      const nextHp = recalculateEnemyHp(updatedSteps);
      setEnemyHp(nextHp);
      
      triggerFlash('fire');
      spawnFloater(`-${dmg} HP!`, 'hero-damage');
      
      // Write combat log strike
      setCombatLog(log => [
        `⚔️ [Герой] Вы провели успешный шаг («${step.title.split('(')[0].trim()}»)! Вы нанесли ${dmg} урона противнику ${enemyName}!`,
        ...log.slice(0, 5)
      ]);
      
      // Reset enemy tick threat
      setTicksWithoutStep(0);

      if (nextHp <= 0) {
        setTimeout(() => handleWinActiveSession(activeTask), 100);
      }
    } else {
      const nextHp = recalculateEnemyHp(updatedSteps);
      setEnemyHp(nextHp);
    }
  };

  const handleAddStepInCombat = (title) => {
    if (!title.trim()) return;
    playClick();
    const newStep = {
      id: `step-${Date.now()}`,
      title: title.trim(),
      completed: false
    };
    const updatedSteps = [...sessionSteps, newStep];
    setSessionSteps(updatedSteps);
    if (activeTask) {
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, steps: updatedSteps } : t));
    }
    const nextHp = recalculateEnemyHp(updatedSteps);
    setEnemyHp(nextHp);
    
    setCombatLog(log => [
      `➕ Добавлена новая фаза прорыва: «${title.trim()}». Здоровье врага пересчитано!`,
      ...log.slice(0, 5)
    ]);
  };

  const handleDeleteStepInCombat = (stepId) => {
    playClick();
    const step = sessionSteps.find(s => s.id === stepId);
    if (!step) return;
    const updatedSteps = sessionSteps.filter(s => s.id !== stepId);
    setSessionSteps(updatedSteps);
    if (activeTask) {
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, steps: updatedSteps } : t));
    }
    const nextHp = recalculateEnemyHp(updatedSteps);
    setEnemyHp(nextHp);

    setCombatLog(log => [
      `🗑️ Удалена фаза прорыва: «${step.title.trim()}». Здоровье врага пересчитано!`,
      ...log.slice(0, 5)
    ]);
    
    if (updatedSteps.length > 0 && updatedSteps.every(s => s.completed) && nextHp === 0) {
      setTimeout(() => handleWinActiveSession(activeTask), 100);
    }
  };

  const handleEditStepInCombat = (stepId, newTitle) => {
    if (!newTitle.trim()) return;
    playClick();
    const updatedSteps = sessionSteps.map(s => s.id === stepId ? { ...s, title: newTitle.trim() } : s);
    setSessionSteps(updatedSteps);
    if (activeTask) {
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, steps: updatedSteps } : t));
    }
  };

  const handleCompleteCombatBreak = () => {
    playClick();
    playSuccess();
    
    let earnedXp = 0;
    let earnedGold = 0;
    if (activeCombatBreak) {
      activeCombatBreak.tasks.forEach(t => {
        if (t.completed) {
          earnedXp += t.xp;
          earnedGold += t.gold;
        }
      });
    }
    
    setAccumulatedBreakRewards(prev => ({
      xp: prev.xp + earnedXp,
      gold: prev.gold + earnedGold
    }));
    
    setActiveCombatBreak(null);
    
    // Resume combat
    setIsRunning(true);
    localStorage.setItem('combat_timer_start_time', Date.now());
    localStorage.setItem('combat_timer_start_value', timeLeft);
    localStorage.setItem('combat_is_running', 'true');
    
    setCombatLog(log => [
      `⛺ Привал завершен! Вы свернули лагерь и бросились обратно в бой! Накоплено на привале: +${earnedXp} XP, +${earnedGold} Золота.`,
      ...log.slice(0, 5)
    ]);
  };

  const handleFlee = () => {
    if (resolutionTriggeredRef.current) return;
    resolutionTriggeredRef.current = true;
    playClick();
    setIsRunning(false);
    setCharacter(prev => ({ ...prev, hp: Math.max(10, prev.hp - 15) }));
    triggerFlash('shiver');
    if (activeTask) {
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, date: null } : t));
    }
    localStorage.removeItem('active_task_id');
    
    setSetupStage('resolution');
    setResolutionType('flee');
    handleGenerateResolutionChronicle('flee', activeTask, enemyName);
  };

  const handleExtend = () => {
    playClick();
    setTimeLeft(prev => {
      const nextVal = prev + 600;
      if (isRunning) {
        localStorage.setItem('combat_timer_start_time', Date.now());
        localStorage.setItem('combat_timer_start_value', nextVal);
      }
      return nextVal;
    });
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
  const startTimedMeditation = (durationSec, type = 'breathing') => {
    playClick();
    setMeditationDuration(durationSec);
    setMeditationTimeLeft(durationSec);
    setMeditationType(type);
    setMeditationActive(true);
    setMeditationPulseCounter(0);
    setMeditationPhase('inhale');
    setAtmosphereMood('recovery');
  };

  const renderMeditationSelect = () => {
    if (!meditationSelectOpen) return null;
    return (
      <div className="break-event-overlay animate-fade-in" style={{ zIndex: 9999 }}>
        <div className="break-event-card rpg-scrollbar" style={{ borderColor: 'var(--color-relic-glow)', maxWidth: '500px', padding: '1rem 1.25rem', maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🎪</span>
            <h1 className="gothic-title" style={{ fontSize: '1.25rem', color: 'var(--color-relic-glow)', marginTop: '0.2rem', marginBottom: '0.1rem' }}>
              Разбить Лагерь Восстановления
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', margin: 0 }}>
              Выберите когнитивную или физическую активность для отдыха
            </p>
          </div>

          <div className="rpg-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.8rem', maxHeight: '32vh', overflowY: 'auto', paddingRight: '6px' }}>
            {[
              { id: 'stretch', label: '🤸 Разминка суставов', desc: 'Снятие оков застоя и потягивания. Повращайте плечами, наклоните голову, потянитесь.' },
              { id: 'walk', label: '🚶 Походить по комнате', desc: 'Вылазка из-за стола, смена обстановки. Сделайте круг по комнате, переключите внимание.' },
              { id: 'mental', label: '🧘 Медитация Бездны', desc: 'Созерцание тишины и мыслей со стороны. Отпустите все думы, слушая дыхание.' },
              { id: 'expander', label: '✊ Пожамкать эспандер', desc: 'Высвобождение хаотичной моторной энергии. Сжимайте эспандер или антистресс-игрушку.' },
              { id: 'breathing', label: '🌬️ Подышать глубоко', desc: 'Очищение разума кислородом. Дыхательный ритуал Бездны (вдох, задержка, выдох 4-7-8).' },
              { id: 'look_around', label: '👀 Посмотреть в стороны', desc: 'Гимнастика для глаз. Отведите взгляд от экрана, сфокусируйтесь на дальних объектах.' },
              { id: 'wash_face', label: '🧊 Умыться холодной водой', desc: 'Обряд ледяного пробуждения чувств. Верните фокус и бодрость холодной струей.' },
              { id: 'drink_water', label: '💧 Попить свежей воды', desc: 'Глоток кристальной влаги для ясности ума. Напитайте разум живительной влагой.' }
            ].map(act => (
              <div 
                key={act.id} 
                onClick={() => { playClick(); setSelectedMeditationType(act.id); }}
                style={{
                  background: selectedMeditationType === act.id ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.3)',
                  border: `1px solid ${selectedMeditationType === act.id ? 'var(--color-relic-glow)' : 'var(--color-iron-light)'}`,
                  padding: '0.45rem 0.6rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
              >
                <h4 style={{ color: selectedMeditationType === act.id ? '#ffb813' : '#fff', fontSize: '0.85rem', margin: 0 }}>
                  {act.label}
                </h4>
                <p style={{ fontSize: '0.68rem', color: 'var(--color-bone-dim)', margin: '2px 0 0 0', lineHeight: '1.25' }}>
                  {act.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '0.8rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)' }}>Время привала:</span>
            <div style={{ display: 'flex', gap: '0.4rem', flex: 1 }}>
              {[60, 180, 300].map(dur => (
                <button 
                  key={dur} 
                  className="rpg-btn" 
                  style={{ flex: 1, padding: '3px 6px', fontSize: '0.75rem', background: meditationDuration === dur ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.2)', borderColor: meditationDuration === dur ? 'var(--color-relic-glow)' : 'var(--color-iron-light)' }}
                  onClick={() => { playClick(); setMeditationDuration(dur); }}
                >
                  {dur === 60 ? '1 мин' : dur === 180 ? '3 мин' : '5 мин'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button 
              className="rpg-btn" 
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
              onClick={() => { playClick(); setMeditationSelectOpen(false); }}
            >
              Отмена
            </button>
            <button 
              className="rpg-btn rpg-btn-mana" 
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderColor: 'var(--color-relic-glow)', color: '#ffb813' }}
              onClick={() => {
                setMeditationSelectOpen(false);
                startTimedMeditation(meditationDuration, selectedMeditationType);
              }}
            >
              🎪 Войти в Лагерь
            </button>
          </div>
        </div>
      </div>
    );
  };

  const onSplitAdaptation = (index, dl) => {
    const taskToSplit = parsedList[index];
    if (!taskToSplit) return;
    
    const halfTime = Math.max(15, Math.round((taskToSplit.estimatedTime || 25) / 2));
    
    const part1 = {
      ...taskToSplit,
      title: `${taskToSplit.title} (Часть I: Подготовка)`,
      estimatedTime: halfTime,
      deadline: dl || taskToSplit.deadline || 'до конца дня',
      isLongJourney: false,
      isAdaptationChecked: true,
      steps: taskToSplit.steps ? taskToSplit.steps.slice(0, Math.ceil(taskToSplit.steps.length / 2)) : []
    };
    
    const part2 = {
      ...taskToSplit,
      title: `${taskToSplit.title} (Часть II: Завершение)`,
      estimatedTime: halfTime,
      steps: taskToSplit.steps ? taskToSplit.steps.slice(Math.ceil(taskToSplit.steps.length / 2)) : [],
      deadline: dl ? `Завтра / ${dl}` : 'Завтра',
      isLongJourney: false,
      isAdaptationChecked: true
    };
    
    setParsedList(prev => {
      const copy = [...prev];
      copy.splice(index, 1, part1, part2);
      return copy;
    });
    playSuccess();
  };

  const onPostponeAdaptation = (index, dl) => {
    setParsedList(prev => prev.map((item, idx) => idx === index ? { 
      ...item, 
      deadline: dl || 'через 2 дня', 
      estimatedTime: Math.max(15, Math.round((item.estimatedTime || 25) / 2)),
      isLongJourney: false,
      isAdaptationChecked: true
    } : item));
    playSuccess();
  };

  const onContinueAdaptation = (index, dl) => {
    setParsedList(prev => prev.map((item, idx) => idx === index ? { 
      ...item, 
      deadline: dl || item.deadline,
      isAdaptationChecked: true
    } : item));
    playSuccess();
  };

  const renderAdaptationModal = () => {
    if (!adaptationModalOpen || !adaptationTask) return null;

    return (
      <div className="gothic-modal-overlay" style={{ zIndex: 100000 }}>
        <div className="gothic-modal-content" style={{ 
          maxWidth: '550px', 
          border: '2px solid var(--color-blood-glow)', 
          boxShadow: '0 0 35px rgba(139, 26, 26, 0.75)',
          animation: 'pulse-red 3s infinite',
          background: 'radial-gradient(circle, #1a0f12 0%, #060203 100%)'
        }}>
          <h3 className="gothic-title" style={{ color: 'var(--color-blood-glow)', fontSize: '1.4rem', marginBottom: '1rem', textAlign: 'center', letterSpacing: '2px' }}>
            🔮 ПРОТИВОСТОЯНИЕ БЕЗДНЫ
          </h3>
          
          <div style={{ color: 'var(--color-bone)', fontSize: '0.95rem', marginBottom: '1.2rem', lineHeight: '1.5', fontFamily: 'Georgia, serif' }}>
            <p style={{ marginBottom: '8px' }}>
              Вы ставите длительный контракт или призываете его поздним вечером (после 20:00).
            </p>
            <p style={{ color: '#ffb813', fontStyle: 'italic', borderLeft: '2px solid #ffb813', paddingLeft: '8px', fontSize: '0.85rem' }}>
              «Бездна рекомендует детально спланировать дедлайн или разделить его силы, дабы избежать штрафного урона разуму!»
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-bone-dim)', marginBottom: '6px', fontFamily: 'var(--font-rpg)' }}>
              🚨 КОНЕЦ ДЕДЛАЙНА (необязательно, но крайне рекомендуется):
            </label>
            <input 
              type="text"
              className="rpg-input"
              style={{ width: '100%', fontSize: '0.95rem', background: '#000', color: '#fff', border: '1px solid var(--color-iron-light)' }}
              placeholder="Например: до 18:00 / среды / через 2 дня"
              value={adaptationDeadline}
              onChange={(e) => setAdaptationDeadline(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button 
              className="rpg-btn rpg-btn-mana"
              style={{ fontSize: '0.9rem', padding: '10px 15px', fontWeight: 'bold' }}
              onClick={() => {
                onSplitAdaptation(adaptationTaskIndex, adaptationDeadline);
                setAdaptationModalOpen(false);
              }}
            >
              🛡️ Разбить на 2 части (Рекомендуется)
            </button>

            <button 
              className="rpg-btn"
              style={{ fontSize: '0.9rem', padding: '10px 15px', borderColor: 'var(--color-relic-glow)', color: '#ffb813' }}
              onClick={() => {
                onPostponeAdaptation(adaptationTaskIndex, adaptationDeadline || 'через 2 дня');
                setAdaptationModalOpen(false);
              }}
            >
              ⏳ На 2 дня и более
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                className="rpg-btn rpg-btn-blood"
                style={{ flex: 1, fontSize: '0.85rem', padding: '8px' }}
                onClick={() => {
                  onContinueAdaptation(adaptationTaskIndex, adaptationDeadline);
                  setAdaptationModalOpen(false);
                }}
              >
                ✓ Продолжить
              </button>
              <button 
                className="rpg-btn"
                style={{ flex: 1, fontSize: '0.85rem', padding: '8px' }}
                onClick={() => {
                  playClick();
                  setAdaptationModalOpen(false);
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEditTaskModal = () => {
    if (!editingTask) return null;
    return (
      <div className="gothic-modal-overlay" style={{ zIndex: 99999 }} onClick={() => setEditingTask(null)}>
        <div className="gothic-modal-content" style={{ maxWidth: '1300px', width: '98%', maxHeight: '98vh', overflowY: 'auto', padding: '1.25rem 2.5rem' }} onClick={(e) => e.stopPropagation()}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-iron-light)', paddingBottom: '0.6rem', marginBottom: '0.8rem' }}>
            <h3 className="gothic-title" style={{ fontSize: '1.25rem', color: 'var(--color-relic-glow)' }}>
              ⚔ Свиток Контракта: {editingTask.title.slice(0, 55)}...
            </h3>
          </div>

          {editDeconstructLoading && guidedStep === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <RefreshCw className="heartbeat-pulse fast" style={{ color: 'var(--color-mana-glow)', marginBottom: '1rem' }} size={32} />
              <p style={{ fontFamily: 'var(--font-rpg)' }}>Взывание к Бездне... ИИ перестраивает шаги под новый контекст...</p>
            </div>
          )}

          {guidedStep === 1 && (
            <div>
              <h4 className="rpg-title" style={{ color: 'var(--color-mana-glow)', marginBottom: '0.8rem', fontFamily: 'var(--font-rpg)' }}>Ритуал уточняющих вопросов:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {guidedQuestions.map((q, idx) => (
                  <div key={idx}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>
                      Вопрос {idx + 1}: {q}
                    </label>
                    <input 
                      type="text" 
                      className="rpg-input" 
                      style={{ width: '100%', fontSize: '0.9rem' }}
                      placeholder="Ответьте честно..."
                      value={guidedAnswers[idx] || ''}
                      onChange={(e) => setGuidedAnswers({ ...guidedAnswers, [idx]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button className="rpg-btn" onClick={() => setGuidedStep(0)}>Назад</button>
                <button 
                  className="rpg-btn rpg-btn-mana" 
                  onClick={handleEditAnswerSubmit}
                  disabled={Object.keys(guidedAnswers).length < guidedQuestions.length || editDeconstructLoading}
                >
                  {editDeconstructLoading ? "🔮 ПРОВЕДЕНИЕ РИТУАЛА..." : "Завершить разбор"}
                </button>
              </div>
            </div>
          )}

          {guidedStep !== 1 && !editDeconstructLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              
              {/* 1. Title, Type, and Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr', gap: '0.8rem' }}>
                <div style={{ gridColumn: 'span 1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>НАЗВАНИЕ КВЕСТА</label>
                  <textarea 
                    ref={editTitleRef}
                    className="rpg-input rpg-input-auto" 
                    style={{ 
                      width: '100%', 
                      minHeight: '40px',
                      resize: 'none',
                      overflowY: 'hidden',
                      paddingTop: '8px',
                      paddingBottom: '8px',
                      lineHeight: '1.3',
                      display: 'block'
                    }} 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>ТИП СУЩНОСТИ</label>
                  <select 
                    className="rpg-input" 
                    style={{ width: '100%', fontSize: '0.9rem' }}
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                  >
                    <option value="hunt">🏹 Охота</option>
                    <option value="siege">💥 Осада</option>
                    <option value="relic">💎 Реликвия</option>
                    <option value="corpse">💀 Труп прошлого</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>ВРЕМЯ (МИН)</label>
                  <input 
                    type="number" 
                    className="rpg-input" 
                    style={{ width: '100%', fontSize: '0.9rem' }} 
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Nature, Execution Mode and Deadline selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>ПРИРОДА ЗАДАЧИ</label>
                  <select 
                    className="rpg-input" 
                    style={{ width: '100%', fontSize: '0.9rem' }}
                    value={editNature}
                    onChange={(e) => setEditNature(e.target.value)}
                  >
                    <option value="internal">🧿 Внутренний Обет (для себя)</option>
                    <option value="external">⚔️ Внешняя Схватка (для мира)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>РЕЖИМ ВЫПОЛНЕНИЯ</label>
                  <select 
                    className="rpg-input" 
                    style={{ width: '100%', fontSize: '0.9rem' }}
                    value={editExecutionMode}
                    onChange={(e) => setEditExecutionMode(e.target.value)}
                  >
                    <option value="timer">⏳ Таймер (Печать Времени)</option>
                    <option value="day">🌅 В течение дня (Свободный Переход)</option>
                    <option value="ask_later">❓ Спросить позже (Шепот Сомнений)</option>
                  </select>
                </div>
                <div>
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

              {/* Survival toggle inside CarriageSession task edit modal */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#ff4d4d', fontWeight: 'bold' }}>
                  <input
                    type="checkbox"
                    checked={editIsSurvival}
                    onChange={(e) => setEditIsSurvival(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#ff4d4d', cursor: 'pointer' }}
                  />
                  <span>💀 Вопрос жизни и смерти (Жизнь и смерть на задачу)</span>
                </label>
              </div>

              {/* 2. Intent Field ("Зачем мне это сегодня") */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '4px' }}>
                  СМЫСЛОВОЙ ЯКОРЬ (НАМЕРЕНИЕ ДЛЯ ADHD - ЗАЧЕМ МНЕ ЭТО СЕГОДНЯ?)
                </label>
                <textarea 
                  className="rpg-input" 
                  style={{ width: '100%', minHeight: '45px', fontSize: '0.85rem', resize: 'vertical' }}
                  placeholder="Например: Чтобы сдать проект и получить деньги..."
                  value={editIntent}
                  onChange={(e) => setEditIntent(e.target.value)}
                />
              </div>

              {/* 3. DeepSeek AI Deconstructor Panel */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px solid var(--color-iron-light)', borderRadius: '4px' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-mana-glow)', marginBottom: '4px', fontFamily: 'var(--font-rpg)' }}>
                  🔮 Авто-настройка шагов ИИ (Контекст Бездны)
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginBottom: '8px' }}>
                  ИИ перестроит структуру шагов, используя отредактированное название и ваши ответы как истинный контекст.
                </p>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="rpg-btn" 
                    style={{ flex: 1, fontSize: '0.8rem', padding: '6px 0' }} 
                    onClick={handleDetailedDeconstructInEdit}
                    disabled={editDeconstructLoading}
                  >
                    🚀 БЫСТРО И ГРУБО
                  </button>
                  <button 
                    className="rpg-btn rpg-btn-mana" 
                    style={{ flex: 1, fontSize: '0.8rem', padding: '6px 0' }} 
                    onClick={handleEditStartGuided}
                    disabled={editDeconstructLoading}
                  >
                    🔮 С СОПРОВОЖДЕНИЕМ
                  </button>
                  <button 
                    className={`rpg-btn ${editAiEditActive ? 'active' : ''}`}
                    style={{ 
                      flex: 1, 
                      fontSize: '0.8rem', 
                      padding: '6px 0',
                      border: editAiEditActive ? '1px solid var(--color-relic-glow)' : '1px solid var(--color-iron-light)'
                    }} 
                    onClick={() => {
                      playClick();
                      setEditAiEditActive(!editAiEditActive);
                    }}
                    disabled={editDeconstructLoading}
                  >
                    🪄 КОРРЕКТИРОВАТЬ ИИ
                  </button>
                </div>

                {editAiEditActive && (
                  <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-bone-dim)' }}>
                      УКАЖИТЕ ИНСТРУКЦИИ ДЛЯ ИЗМЕНЕНИЯ ШАГОВ / НАЗВАНИЯ:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="rpg-input" 
                        style={{ flex: 1, fontSize: '0.85rem' }} 
                        placeholder="Например: перепиши шаги на английском / добавь тестирование..."
                        value={editAiEditPrompt}
                        onChange={(e) => setEditAiEditPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditAiEditSubmit()}
                        disabled={editDeconstructLoading}
                      />
                      <button 
                        className="rpg-btn rpg-btn-mana" 
                        onClick={handleEditAiEditSubmit}
                        disabled={!editAiEditPrompt.trim() || editDeconstructLoading}
                      >
                        🔮 ИЗМЕНИТЬ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Manual steps manipulation */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-bone)', marginBottom: '4px', fontFamily: 'var(--font-rpg)' }}>
                  СПИСОК ШАГОВ (ЖМИТЕ НА ТЕКСТ ДЛЯ РЕДАКТИРОВАНИЯ ИЛИ ДОБАВЬТЕ/УДАЛИТЕ):
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '260px', overflowY: 'auto', marginBottom: '0.6rem' }} className="rpg-scrollbar">
                  {editSteps.map(s => (
                    <div 
                      key={s.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        background: 'rgba(0,0,0,0.2)', 
                        padding: '4px 10px', 
                        border: '1px solid var(--color-iron-light)' 
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={s.completed} 
                        onChange={() => handleToggleEditStep(s.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        className="rpg-input" 
                        style={{ 
                          flex: 1, 
                          fontSize: '0.85rem', 
                          background: 'transparent', 
                          border: 'none', 
                          borderBottom: '1px dashed rgba(255,255,255,0.1)', 
                          padding: '2px 0',
                          color: s.completed ? 'var(--color-bone-dim)' : '#fff',
                          textDecoration: s.completed ? 'line-through' : 'none'
                        }}
                        value={s.title}
                        onChange={(e) => handleUpdateEditStepText(s.id, e.target.value)}
                      />
                      <button 
                        className="rpg-btn" 
                        style={{ padding: '2px 6px', color: 'var(--color-blood-glow)', fontSize: '0.75rem' }} 
                        onClick={() => handleRemoveEditStep(s.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {editSteps.length === 0 && (
                    <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--color-iron-light)', padding: '5px' }}>
                      Нет шагов в контракте. Сделайте ручной шаг или призовите ИИ.
                    </div>
                  )}
                </div>

                {/* Manual Step Adding Field */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="rpg-input" 
                    style={{ flex: 1, fontSize: '0.85rem' }} 
                    placeholder="Добавить свой ручной шаг..."
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEditStep()}
                  />
                  <button className="rpg-btn" onClick={handleAddEditStep} disabled={!newStepText.trim()}>
                    Добавить
                  </button>
                </div>
              </div>

              {/* Footer Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-iron-light)', paddingTop: '0.8rem', marginTop: '0.4rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="rpg-btn" onClick={handleAddToBacklog}>
                    🗄️ Добавить в бэклог
                  </button>
                  <button className="rpg-btn rpg-btn-blood" onClick={handleExileTask}>
                    💀 Изгнать задачу (15 HP)
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="rpg-btn" onClick={() => setEditingTask(null)}>
                    ЗАКРЫТЬ
                  </button>
                  <button className="rpg-btn rpg-btn-blood" onClick={handleSaveEdit}>
                    СОХРАНИТЬ КОНТРАКТ В БАЗУ
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    );
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

  // --- RENDERING: BREAK EVENT NPC ENCOUNTER OVERLAY ---
  if (breakEvent) {
    const isBig = breakEvent.type === 'big';
    const isAmbush = breakEvent.isAmbush === true;
    const activities = isBig ? BIG_BREAK_ACTIVITIES : MINI_BREAK_ACTIVITIES;
    const selectedActivity = activities.find(a => a.id === breakActivityChoice) || activities[0];
    const npc = breakEvent.npc;
    const npcTypeBorder = { motivating: '#d4af37', helping: '#2ecc71', provoking: '#e74c3c', mirror: '#9b59b6' };
    const npcTypeLabelMap = { motivating: '💛 Мотиватор', helping: '💚 Помощник', provoking: '🔴 Провокатор', mirror: '🪞 Зеркало Истины' };
    const borderColor = isAmbush ? 'var(--color-blood-glow)' : (npcTypeBorder[npc.type] || '#d4af37');
    const npcTypeLabel = isAmbush ? '👹 Засада бандитов' : (npcTypeLabelMap[npc.type] || 'Путник');

    return (
      <div className="break-event-overlay animate-fade-in">
        <div className="break-event-card" style={{ borderColor }}>
          {/* NPC Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', filter: `drop-shadow(0 0 15px ${borderColor})` }}>{isAmbush ? '👹' : npc.icon}</div>
            <h1 className="gothic-title" style={{ fontSize: isBig ? '1.8rem' : '1.5rem', color: borderColor, marginBottom: '0.3rem' }}>
              {isAmbush ? '⚔️ Внезапная Засада' : (isBig ? '🏕️ Большой Привал' : '🕯️ Встреча на Пути')}
            </h1>
            <h2 className="rpg-title" style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.4rem', textDecoration: isAmbush ? 'line-through' : 'none' }}>
              {isAmbush ? `${npc.name} (Убит)` : npc.name}
            </h2>
            <span style={{ fontSize: '0.75rem', padding: '2px 10px', background: `${borderColor}22`, border: `1px solid ${borderColor}`, color: borderColor, fontFamily: 'var(--font-rpg)' }}>
              {npcTypeLabel}
            </span>
            {isBig && !isAmbush && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', marginTop: '0.8rem', fontStyle: 'italic', maxWidth: '500px', margin: '0.8rem auto 0' }}>
                «Ты сражался 1.5 часа без остановки. Твоё тело и разум требуют полноценного восстановления. Раны, мана, усталость — всё нуждается в заботе.»
              </p>
            )}
          </div>

          {/* Activity Dropdown or Warning Message */}
          <div style={{ marginBottom: '1.2rem' }}>
            {isAmbush ? (
              <div style={{ 
                background: 'rgba(139, 26, 26, 0.1)', 
                border: '1px solid var(--color-blood)', 
                padding: '1rem', 
                color: 'var(--color-blood-glow)', 
                fontSize: '0.85rem', 
                fontFamily: 'var(--font-rpg)', 
                marginBottom: '1rem',
                lineHeight: '1.4',
                borderRadius: '4px'
              }}>
                ⚠️ Бандиты напали на лагерь и убили вашего спутника. У вас нет возможности отдохнуть или восстановить ману. Сражайтесь, чтобы выжить и забрать их скудное золото!
              </div>
            ) : (
              <>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-rpg)', display: 'block', marginBottom: '0.6rem' }}>
                  {isBig ? '🍽️ Выбери способ восстановления:' : '🎯 Выбери активность перерыва:'}
                </label>
                
                {activeTask && activeTask.pomodoroTime < 20 ? (
                  /* Premium Grid of Buttons for Tasks under 20 mins */
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', 
                    gap: '0.6rem', 
                    marginBottom: '1rem',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '4px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)'
                  }} className="rpg-scrollbar">
                    {activities.map(a => {
                      const isSelected = breakActivityChoice === a.id;
                      return (
                        <button
                          key={a.id}
                          className={`rpg-btn ${isSelected ? 'rpg-btn-mana' : ''}`}
                          onClick={() => { playClick(); setBreakActivityChoice(a.id); }}
                          style={{
                            padding: '8px 6px',
                            fontSize: '0.78rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            minHeight: '65px',
                            borderColor: isSelected ? '#ffb813' : 'rgba(255,255,255,0.08)',
                            background: isSelected ? 'rgba(212,175,55,0.12)' : 'rgba(10,8,12,0.6)',
                            transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            boxShadow: isSelected ? '0 0 12px rgba(255, 184, 19, 0.2)' : 'none',
                            whiteSpace: 'normal',
                            lineHeight: '1.25'
                          }}
                        >
                          <span style={{ color: isSelected ? '#ffd700' : 'var(--color-bone)', fontWeight: isSelected ? 'bold' : 'normal' }}>
                            {a.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Standard dropdown for longer tasks */
                  <select className="rpg-input" style={{ width: '100%', fontSize: '0.95rem', padding: '0.6rem' }} value={breakActivityChoice} onChange={(e) => setBreakActivityChoice(e.target.value)}>
                    {activities.map(a => (<option key={a.id} value={a.id}>{a.label}</option>))}
                  </select>
                )}

                <div style={{ fontSize: '0.72rem', color: '#ffb813', fontStyle: 'italic', marginTop: '4px', textAlign: 'center', background: 'rgba(0,0,0,0.25)', padding: '6px', borderLeft: '3px solid #ffb813' }}>
                  В мире Бездны: «{selectedActivity.lore}»
                </div>
              </>
            )}
          </div>

          {/* AI Generate Button */}
          {!breakAiText && !breakAiLoading && (
            <button 
              className={`rpg-btn ${isAmbush ? 'rpg-btn-blood' : 'rpg-btn-mana'} heartbeat-pulse`} 
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                fontSize: '1rem', 
                marginBottom: '1rem',
                borderColor: isAmbush ? 'var(--color-blood-glow)' : '#ffb813',
                color: isAmbush ? '#fff' : '#ffb813',
                boxShadow: isAmbush ? '0 0 15px rgba(139,26,26,0.3)' : '0 0 15px rgba(212,175,55,0.2)',
                fontWeight: 'bold'
              }} 
              onClick={handleBreakAiGenerate}
            >
              {isAmbush ? '⚔️ ВСТУПИТЬ В БОЙ' : (activeTask && activeTask.pomodoroTime < 20 ? 'АКТИВИРОВАТЬ ВСТРЕЧУ' : `ПРИЗВАТЬ ${npc.name.toUpperCase()}`)}
            </button>
          )}

          {/* Loading */}
          {breakAiLoading && (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <RefreshCw className="heartbeat-pulse fast" style={{ color: borderColor, marginBottom: '0.5rem' }} size={28} />
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-bone-dim)' }}>{isAmbush ? 'Идет бой...' : `${npc.name} приближается из тумана Бездны...`}</p>
            </div>
          )}

          {/* AI NPC Response */}
          {breakAiText && (
            <div style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${borderColor}44`, borderLeft: `3px solid ${borderColor}`, padding: '1.2rem', marginBottom: '1.2rem' }}>
              <p style={{ fontSize: '0.95rem', color: '#e6dfd3', lineHeight: '1.7', fontFamily: 'Georgia, serif', whiteSpace: 'pre-line' }}>{breakAiText}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button className="rpg-btn rpg-btn-mana" style={{ flex: 1, padding: '0.7rem', fontSize: '0.9rem' }} onClick={() => handleDismissBreak(true)}>
              {isAmbush ? '⚔️ УБИТЬ БАНДИТОВ И ЗАБРАТЬ ДОБЫЧУ' : (isBig ? '✅ ЗАВЕРШИТЬ ПРИВАЛ' : 'ВЫПОЛНЕНО — В БОЙ')}
            </button>
            {!isAmbush && (
              <button className="rpg-btn rpg-btn-blood" style={{ padding: '0.7rem', fontSize: '0.8rem' }} onClick={() => handleDismissBreak(false)}>
                ⏭️ Пропустить
              </button>
            )}
          </div>

          {/* Rewards Preview */}
          <div style={{ marginTop: '0.8rem', fontSize: '0.7rem', color: 'var(--color-bone-dim)', textAlign: 'center', borderTop: '1px solid var(--color-iron-light)', paddingTop: '0.6rem' }}>
            Награда за выполнение: {isAmbush ? '🪙+5 Золота, 🌟+10 XP (0 HP/MP восстановлено)' : (isBig ? '❤️+20 HP, 🔮+15 MP, ⚡-30мин усталости' : '❤️+8 HP, 🔮+5 MP, ⚡-10мин усталости')}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING: BATTLE RESOLUTION SCREEN ---
    // --- RENDERING: BATTLE RESOLUTION SCREEN ---
if (setupStage === 'resolution') {
    const isVictory = resolutionType === 'victory';
    const isFlee = resolutionType === 'flee';
    const isDeath = resolutionType === 'death';
    const borderColor = isVictory ? '#d4af37' : isFlee ? '#8c7d6b' : '#ff0000';
    const title = isVictory ? '🏆 Триумф Воли' : isFlee ? '🌫️ Бегство в Тени' : '💀 Падение Изгнанника';
    
    const activeTasksToOffer = tasks.filter(t => t.status === 'active');
    const hasNpc = isVictory && resolutionNpc;
    const cardWidth = hasNpc ? '1100px' : '650px';

    return (
      <div className="break-event-overlay animate-fade-in" style={{ zIndex: 99999 }}>
        <div className="break-event-card rpg-scrollbar" style={{ borderColor, maxWidth: cardWidth, width: '95%', padding: '2rem', maxHeight: '95vh', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
            <span style={{ fontSize: '3rem' }}>{isVictory ? '🏆' : isFlee ? '🌫️' : '💀'}</span>
            <h1 className="gothic-title" style={{ fontSize: '2rem', color: borderColor, marginTop: '0.3rem' }}>{title}</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', marginTop: '0.2rem' }}>
              Хроники Абаддона • Запись Летописца
            </p>
          </div>

          {resolutionLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <RefreshCw className="heartbeat-pulse fast" style={{ color: borderColor, marginBottom: '0.8rem' }} size={32} />
              <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--color-bone-dim)' }}>
                Летописец Бездны записывает исход битвы в фолиант...
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: hasNpc ? '1.1fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
              
              {/* Left Column: Chronicle & Return Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid ' + borderColor + '44', borderLeft: '3px solid ' + borderColor, padding: '1.25rem', borderRadius: '4px' }}>
                  <p style={{ fontSize: '0.95rem', color: '#e6dfd3', lineHeight: '1.6', fontFamily: 'Georgia, serif', whiteSpace: 'pre-line', textAlign: 'justify', margin: 0 }}>
                    {resolutionText}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem', width: '100%' }}>
                  {isDeath && (
                    <button 
                      className="rpg-btn rpg-btn-blood" 
                      style={{ padding: '0.8rem 2.5rem', fontSize: '1.05rem', borderColor: 'var(--color-blood)', width: '100%', fontWeight: 'bold' }}
                      onClick={handleAcceptDeathAndStainName}
                    >
                      ☠️ ПРИНЯТЬ ГИБЕЛЬ И ЗАПЯТНАТЬ ИМЯ
                    </button>
                  )}
                  
                  <button 
                    className="rpg-btn" 
                    style={{ padding: '0.8rem 2.5rem', fontSize: '1rem', borderColor, width: '100%' }}
                    onClick={() => {
                      playClick();
                      const willQualify = (character.completedTasksCount || 0) >= 15 && 
                                          (character.completedSiegesCount || 0) >= 3;
                      if (isVictory && willQualify) {
                        setSetupStage('redemption');
                        handleTriggerRedemptionCeremony();
                      } else {
                        setSetupStage('hub');
                      }
                    }}
                  >
                    {isVictory ? '☀️ ВЕРНУТЬСЯ В ШТАБ' : isFlee ? '⛺ УЙТИ В ЛАГЕРЬ' : '🔥 ОТКУПИТЬСЯ ОТ СМЕРТИ (ВСТАТЬ)'}
                  </button>
                </div>
              </div>

              {/* Right Column: NPC Card */}
              {hasNpc && (
                <div style={{ 
                  background: 'rgba(25, 20, 30, 0.75)', 
                  border: `1px solid ${resolutionIsAmbush ? 'var(--color-blood-glow)' : 'rgba(255, 184, 19, 0.25)'}`, 
                  borderRadius: '6px', 
                  padding: '1.2rem', 
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem'
                }}>
                  {resolutionIsAmbush ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', filter: 'grayscale(100%)' }}>💀</span>
                        <h3 className="gothic-title" style={{ fontSize: '1.1rem', color: 'var(--color-blood-glow)', margin: 0, textDecoration: 'line-through' }}>
                          {resolutionNpc.name}
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-blood-glow)', fontStyle: 'italic', margin: 0, lineHeight: '1.3' }}>
                        «Вы нашли лишь растерзанное тело и засаду бандитов Бездны. Пришлось проливать чужую кровь, чтобы выжить...»
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{resolutionNpc.icon}</span>
                        <h3 className="gothic-title" style={{ fontSize: '1.1rem', color: 'var(--color-relic-glow)', margin: 0 }}>
                          {resolutionNpc.name}
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#e6dfd3', fontStyle: 'italic', margin: 0, lineHeight: '1.3' }}>
                        «Вы одолели угрозу, Изгнанник. Но тени сгущаются. Какой контракт мы запечатаем следующим?»
                      </p>
                    </>
                  )}

                  {/* Dynamic Post-Combat Dialogue Choices */}
                  {!resolutionIsAmbush && (
                    <div style={{ marginTop: '0.8rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.8rem' }}>
                      <div style={{ fontSize: '0.78rem', color: '#ffb813', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-rpg)', fontWeight: 'bold' }}>
                        💬 Выбор Изгнанника (Диалог с NPC):
                      </div>
                      
                      {selectedDialogueChoice ? (
                        <div style={{ 
                          background: 'rgba(255, 184, 19, 0.05)', 
                          border: '1px solid rgba(255, 184, 19, 0.2)', 
                          padding: '0.8rem', 
                          fontSize: '0.82rem', 
                          color: '#e6dfd3',
                          lineHeight: '1.4',
                          fontStyle: 'italic',
                          borderRadius: '4px'
                        }}>
                          {selectedDialogueChoice.resolutionText}
                          <div style={{ color: '#2ed573', marginTop: '5px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            Результат: {selectedDialogueChoice.statChangeText}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {getDialogueOptions(resolutionNpc, moralVal, completedCount).map((choice, cIdx) => (
                            <button
                              key={cIdx}
                              className="rpg-btn"
                              style={{ 
                                display: 'block',
                                width: '100%',
                                textAlign: 'left', 
                                padding: '8px 10px', 
                                fontSize: '0.78rem', 
                                lineHeight: '1.3',
                                borderColor: choice.type === 'mercy' ? '#2ecc71' : choice.type === 'cynic' ? '#e74c3c' : 'rgba(255,255,255,0.15)',
                                background: 'rgba(10,8,12,0.6)',
                                transition: 'all 0.15s'
                              }}
                              onClick={() => handleExecuteDialogueChoice(choice)}
                            >
                              <div style={{ fontWeight: 'bold', color: '#ffb813', marginBottom: '2px' }}>
                                {choice.title}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-bone-dim)' }}>
                                {choice.text}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Offer existing contracts */}
                  {activeTasksToOffer.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'var(--font-rpg)' }}>
                        📜 Выбрать существующий контракт:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {activeTasksToOffer.slice(0, 3).map(t => (
                          <button 
                            key={t.id}
                            className="rpg-btn"
                            style={{ display: 'block', width: '100%', padding: '5px 10px', fontSize: '0.8rem', textAlign: 'left', borderColor: 'rgba(255,255,255,0.1)' }}
                            onClick={() => {
                              playClick();
                              handleStartCombatSession(t);
                            }}
                          >
                            ⚔️ {t.title} ({t.pomodoroTime}м)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Create and start a new contract (Auto-expanding Textarea Chaos Dump) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-rpg)' }}>
                      ✍️ Записать новый контракт (Омут Хаоса):
                    </div>
                    <textarea 
                      placeholder="Опишите новый контракт или излейте хаос мыслей..." 
                      className="rpg-input rpg-scrollbar" 
                      value={npcNewTaskTitle}
                      onChange={(e) => setNpcNewTaskTitle(e.target.value)}
                      style={{ 
                        width: '100%', 
                        minHeight: '60px', 
                        maxHeight: '180px', 
                        fontSize: '0.82rem', 
                        lineHeight: '1.3',
                        padding: '6px 10px',
                        resize: 'vertical',
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid var(--color-iron-light)',
                        borderRadius: '4px',
                        color: '#fff'
                      }}
                    />
                    <button 
                      className="rpg-btn rpg-btn-blood"
                      onClick={handleCreateAndStartTaskFromNpc}
                      disabled={!npcNewTaskTitle.trim()}
                      style={{ fontSize: '0.8rem', padding: '6px 0', width: '100%' }}
                    >
                      🔮 В БОЙ
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    );
  }

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
          «Позвольте мыслям улечься, а скверне — рассеяться. Восстановите свою силу через выбранное действие.»
        </p>

        {meditationType === 'breathing' ? (
          /* Breathing Circular Guide */
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
        ) : (
          /* Alternate physical activities guide */
          <div style={{ margin: '2rem auto', textAlign: 'center' }}>
            <div className="heartbeat-pulse" style={{ fontSize: '5rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 15px var(--color-relic-glow))' }}>
              {meditationType === 'stretch' && "🤸"}
              {meditationType === 'walk' && "🚶"}
              {meditationType === 'mental' && "🧘"}
              {meditationType === 'expander' && "✊"}
              {meditationType === 'look_around' && "👀"}
              {meditationType === 'wash_face' && "🧊"}
              {meditationType === 'drink_water' && "💧"}
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem', fontFamily: 'var(--font-rpg)' }}>
              {meditationType === 'stretch' && "Разминка суставов: расправьте плечи и потянитесь"}
              {meditationType === 'walk' && "Вылазка по комнате: разомните ноги, посмотрите в окно"}
              {meditationType === 'mental' && "Медитация Бездны: созерцание тишины"}
              {meditationType === 'expander' && "Эспандер: пожамкайте антистресс-мяч или эспандер"}
              {meditationType === 'look_around' && "Посмотреть в стороны: гимнастика для глаз"}
              {meditationType === 'wash_face' && "Умыться: обряд ледяного пробуждения чувств"}
              {meditationType === 'drink_water' && "Попить воды: глоток живительной ясности разума"}
            </h3>
            <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.4' }}>
              {meditationType === 'stretch' && "Сделайте глубокие круговые движения плечами, наклоните голову, потяните руки вверх. Снимите зажимы."}
              {meditationType === 'walk' && "Встаньте со стула, сделайте круг по комнате, посмотрите вдаль в окно. Налейте стакан прохладной воды."}
              {meditationType === 'mental' && "Отпустите все мысли, как плывущие облака. Не концентрируйтесь на них, просто слушайте тишину Бездны."}
              {meditationType === 'expander' && "Сжимайте эспандер или антистресс-игрушку. Выпустите физическое напряжение и накопившийся стресс."}
              {meditationType === 'look_around' && "Отведите взор от свитка. Посмотрите влево, вправо, вверх, вниз, а затем сфокусируйтесь на дальнем объекте."}
              {meditationType === 'wash_face' && "Сделайте паузу, омойте лицо холодной влагой. Ледяное прикосновение мгновенно развеет сонные чары Бездны."}
              {meditationType === 'drink_water' && "Выпейте стакан чистой прохладной воды медленными глотками. Вода вернет тонус вашему телу и уму."}
            </p>
          </div>
        )}

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
          Путешествие Смерти
        </h1>
        <p style={{ lineHeight: '1.7', color: 'var(--color-bone)', fontSize: '1.05rem', marginBottom: '1.5rem', fontFamily: 'Georgia, serif' }}>
          «Ты — изгнанник, совершивший непростительное злодеяние во вселенной Абаддона. Твои силы запечатаны, на руках звенят 
          тяжелые антимагические оковы. Тебя везли на скрипучей повозке к рубежам Империи Света, чтобы выпнуть в бескрайние 
          пустоши выживать в одиночку...»
        </p>
        <p style={{ lineHeight: '1.7', color: 'var(--color-bone-dim)', fontSize: '0.95rem', marginBottom: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Но у судьбы свои планы. На рубежах Каргахаула повозка попадает в засаду. Скрежет железа, грохот... Тебе нужно выбраться. 
          Ваше путешествие начинается здесь. Но сперва давай разберемся с хаосом в твоей голове.
        </p>
        <div style={{ textAlign: 'center' }}>
          <button className="rpg-btn rpg-btn-blood" style={{ padding: '0.8rem 2.5rem', fontSize: '1.1rem' }} onClick={generateRandomCharacter}>
            СГЕНЕРИРОВАТЬ ГЕРОЯ
          </button>
        </div>
      </div>
    );
  }

  const renderPreparationOverlay = () => {
    if (!prepTask) return null;

    const isSurvival = prepTask.isSurvival || false;
    const combatsynonym = prepTask.combatLore?.visualType || prepTask.visualType || 'схватка';
    const enemyName = prepTask.combatLore?.enemyName || "Враг Бездны";

    return (
      <div 
        className="gothic-modal-overlay" 
        style={{ 
          position: isFullscreenFocus ? 'fixed' : 'absolute',
          top: 0,
          left: 0,
          width: isFullscreenFocus ? '100vw' : '100%',
          height: isFullscreenFocus ? '100vh' : 'auto',
          minHeight: isFullscreenFocus ? '100vh' : 'calc(100vh - 120px)',
          zIndex: 9999,
          background: 'radial-gradient(circle, rgba(26, 8, 10, 0.5) 0%, rgba(5, 3, 6, 0.65) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: prepTimerActive ? 'pulse-red 1.5s infinite alternate' : 'none'
        }}
      >
        <div 
          className="gothic-modal-content" 
          style={{ 
            maxWidth: '650px', 
            width: '90%', 
            border: isSurvival ? '3px solid #ff4d4d' : '2px solid var(--color-blood-glow)',
            boxShadow: isSurvival ? '0 0 45px rgba(255, 77, 77, 0.8)' : '0 0 30px rgba(139, 26, 26, 0.5)',
            background: '#090506',
            textAlign: 'center',
            padding: '2.5rem',
            position: 'relative'
          }}
        >
          <button 
            className="rpg-btn" 
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10005,
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderColor: 'var(--color-blood-glow)',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
            }} 
            onClick={toggleFullscreenFocus}
          >
            {isFullscreenFocus ? '🌌 СВЕРНУТЬ В ОКНО' : '🌌 ПОЛНОЭКРАННЫЙ РЕЖИМ'}
          </button>
          <h2 className="gothic-title" style={{ fontSize: '1.8rem', color: '#ff4d4d', marginBottom: '1.2rem', textShadow: '0 0 10px rgba(255, 77, 77, 0.5)' }}>
            🚨 ПОДГОТОВИТЬСЯ К БОЮ! 🚨
          </h2>
          
          <div style={{ background: 'rgba(255, 77, 77, 0.03)', border: '1px solid rgba(255, 77, 77, 0.1)', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#ffcc00', marginBottom: '6px', fontFamily: 'var(--font-rpg)' }}>
              ⚔️ {prepTask.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', marginBottom: '4px' }}>
              Тип квеста: {combatsynonym.toUpperCase()} | Противник: {enemyName}
            </p>
            {isSurvival && (
              <p style={{ fontSize: '0.9rem', color: '#ff4d4d', fontWeight: 'bold', margin: '4px 0 0 0' }}>
                💀 РЕЖИМ ЖИЗНИ И СМЕРТИ АКТИВЕН! (+100% XP и Золота, -30 HP при провале)
              </p>
            )}
          </div>

          {!prepTimerActive ? (
            <div>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-bone)', lineHeight: '1.5', marginBottom: '1.5rem', fontFamily: 'Georgia, serif' }}>
                Чтобы открыть портал сражения и запустить таймер, запишите <strong>одно конкретное физическое действие</strong>, которое вы совершите прямо сейчас, чтобы начать (например: открыть файл с кодом, взять ручку, открыть вкладку браузера):
              </p>
              
              <input 
                type="text"
                className="rpg-input"
                style={{ width: '100%', fontSize: '1rem', padding: '12px', border: '1px solid #ff4d4d', textAlign: 'center', background: '#000', color: '#fff', marginBottom: '1.5rem' }}
                placeholder="Впишите стартовое физическое действие..."
                value={prepActionInput}
                onChange={(e) => setPrepActionInput(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  className="rpg-btn"
                  style={{ background: '#2c1e21', color: 'var(--color-bone-dim)', borderColor: 'var(--color-iron-light)' }}
                  onClick={() => {
                    playClick();
                    setPrepTask(null);
                    setPrepExecutionMode(null);
                    setPrepActionInput('');
                  }}
                >
                  🛡️ Отступить в лагерь
                </button>
                <button
                  className="rpg-btn rpg-btn-blood"
                  style={{ fontWeight: 'bold' }}
                  disabled={!prepActionInput.trim()}
                  onClick={() => {
                    playClick();
                    setPrepTimerActive(true);
                    setPrepTimeLeft(100);
                  }}
                >
                  ⚔️ СОБРАТЬСЯ!
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <p style={{ fontSize: '1rem', color: '#ff4d4d', fontWeight: 'bold', marginBottom: '1rem', fontFamily: 'var(--font-rpg)' }}>
                РИТУАЛ ГОТОВНОСТИ ЗАПУЩЕН! ВЫПОЛНИТЕ ДЕЙСТВИЕ:
              </p>
              <p style={{ fontSize: '1.25rem', color: '#fff', border: '1px dashed rgba(255,255,255,0.15)', padding: '0.8rem 1.5rem', background: '#000', margin: '0 auto 1.5rem auto', maxWidth: '500px', borderRadius: '4px', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
                👉 {prepActionInput}
              </p>

              {/* Ticking 100 seconds timer */}
              <div style={{ fontSize: '3rem', fontFamily: 'var(--font-rpg)', color: '#ff4d4d', fontWeight: 'bold', marginBottom: '1rem', animation: 'heartbeat-animation 1s infinite' }}>
                {prepTimeLeft} <span style={{ fontSize: '1.2rem' }}>секунд</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', marginBottom: '2rem' }}>
                Таймер страха запущен. Совершите это действие прямо сейчас, пока время не истекло!
              </p>

              <button
                className="rpg-btn rpg-btn-mana"
                style={{ fontSize: '1.1rem', padding: '12px 35px', fontWeight: 'bold', color: '#ffcc00', borderColor: 'var(--color-relic-glow)', boxShadow: '0 0 25px rgba(255, 184, 19, 0.4)' }}
                onClick={() => {
                  playSuccess();
                  setPrepTimerActive(false);
                  actuallyStartCombat(prepTask, prepExecutionMode);
                  setPrepTask(null);
                  setPrepExecutionMode(null);
                  setPrepActionInput('');
                  setPrepTimeLeft(100);
                }}
              >
                ⚔️ ВСТУПИТЬ В БОЙ!
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRitualScreen = () => {
    if (!ritualModalOpen) return null;

    const formattedTime = (secs) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const pctLeft = ritualTimeTotal > 0 ? (ritualTimeLeft / ritualTimeTotal) * 100 : 100;
    const isUnder30 = ritualTimerActive && pctLeft < 30;
    const pulseSpeed = isUnder30 ? `${(ritualTimeLeft / (ritualTimeTotal * 0.3)) * 1.0 + 0.15}s` : '1.5s';

    return (
      <div 
        className="gothic-modal-overlay" 
        style={{ 
          position: isFullscreenFocus ? 'fixed' : 'absolute',
          top: 0,
          left: 0,
          width: isFullscreenFocus ? '100vw' : '100%',
          height: isFullscreenFocus ? '100vh' : 'auto',
          minHeight: isFullscreenFocus ? '100vh' : 'calc(100vh - 120px)',
          zIndex: 9999,
          background: 'radial-gradient(circle, rgba(14, 5, 20, 0.5) 0%, rgba(5, 3, 6, 0.65) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: ritualTimerActive ? `pulse-red ${pulseSpeed} infinite alternate` : 'none'
        }}
      >
        {isUnder30 && (
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulse-red {
              0% { box-shadow: inset 0 0 30px rgba(139, 26, 26, 0.3); }
              100% { box-shadow: inset 0 0 100px rgba(255, 0, 0, ${0.4 + (1 - pctLeft / 30) * 0.6}); }
            }
          `}} />
        )}

        <div 
          className="gothic-modal-content" 
          style={{ 
            maxWidth: '650px', 
            width: '90%', 
            border: '2px solid #9b5de5',
            boxShadow: '0 0 35px rgba(155, 93, 229, 0.4), inset 0 0 15px rgba(0,0,0,0.6)',
            background: '#09050e',
            textAlign: 'center',
            padding: '2.5rem',
            position: 'relative'
          }}
        >
          <button 
            className="rpg-btn" 
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10005,
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderColor: '#9b5de5',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
            }} 
            onClick={toggleFullscreenFocus}
          >
            {isFullscreenFocus ? '🌌 СВЕРНУТЬ В ОКНО' : '🌌 ПОЛНОЭКРАННЫЙ РЕЖИМ'}
          </button>
          <h2 className="gothic-title" style={{ fontSize: '1.6rem', color: '#9b5de5', marginBottom: '1.5rem', textShadow: '0 0 10px rgba(155, 93, 229, 0.4)' }}>
            🔮 РИТУАЛ 🔮
          </h2>

          {!ritualTimerActive && !ritualFinished && (
            <div className="animate-fade-in">
              <p style={{ fontSize: '0.95rem', color: 'var(--color-bone-dim)', lineHeight: '1.5', marginBottom: '1.5rem', fontFamily: 'Georgia, serif' }}>
                Изгнанник, ритуал времени — это обет абсолютной тишины и концентрации. Выберите длительность от 5 секунд до 5 часов. Ползунок и ввод минут связаны воедино!
              </p>

              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', border: '1px solid rgba(155, 93, 229, 0.15)', borderRadius: '4px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase' }}>Величина:</span>
                  <input 
                    type="number"
                    className="rpg-input"
                    style={{ width: '80px', fontSize: '1rem', padding: '5px', textAlign: 'center', background: '#000', color: '#fff', border: '1px solid #9b5de5' }}
                    value={ritualValue}
                    min={ritualUnit === 'seconds' ? 5 : 1}
                    max={ritualUnit === 'seconds' ? 60 : ritualUnit === 'minutes' ? 300 : 5}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRitualValue(val);
                    }}
                  />
                  
                  <select
                    className="rpg-input"
                    style={{ fontSize: '0.9rem', padding: '5px', background: '#000', color: '#fff', border: '1px solid #9b5de5' }}
                    value={ritualUnit}
                    onChange={(e) => {
                      const unit = e.target.value;
                      setRitualUnit(unit);
                      if (unit === 'seconds') setRitualValue(10);
                      else if (unit === 'minutes') setRitualValue(10);
                      else if (unit === 'hours') setRitualValue(1);
                    }}
                  >
                    <option value="seconds">Секунды</option>
                    <option value="minutes">Минуты</option>
                    <option value="hours">Часы</option>
                  </select>
                </div>

                <input 
                  type="range"
                  min={ritualUnit === 'seconds' ? 5 : 1}
                  max={ritualUnit === 'seconds' ? 60 : ritualUnit === 'minutes' ? 300 : 5}
                  value={ritualValue}
                  onChange={(e) => setRitualValue(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#9b5de5', cursor: 'pointer' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginTop: '8px' }}>
                  <span>Мин: {ritualUnit === 'seconds' ? 5 : 1}</span>
                  <span style={{ color: '#9b5de5', fontWeight: 'bold' }}>Выбрано: {ritualValue} {ritualUnit === 'seconds' ? 'сек' : ritualUnit === 'minutes' ? 'мин' : 'час'}</span>
                  <span>Макс: {ritualUnit === 'seconds' ? 60 : ritualUnit === 'minutes' ? 300 : 5}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  className="rpg-btn"
                  onClick={() => setRitualModalOpen(false)}
                >
                  Отмена
                </button>
                <button 
                  className="rpg-btn rpg-btn-mana"
                  style={{ borderColor: '#9b5de5', color: '#ffb813', fontWeight: 'bold' }}
                  onClick={handleStartRitual}
                >
                  🔮 ЗАПУСТИТЬ РИТУАЛ
                </button>
              </div>
            </div>
          )}

          {ritualTimerActive && (
            <div className="animate-fade-in">
              <div 
                style={{ 
                  width: '180px', 
                  height: '180px', 
                  border: '3px solid #9b5de5', 
                  borderRadius: '50%', 
                  margin: '0 auto 2rem auto', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.6)',
                  boxShadow: isUnder30 ? '0 0 35px rgba(255,0,0,0.8)' : '0 0 20px rgba(155, 93, 229, 0.3)',
                  animation: isUnder30 ? `heartbeat-animation 0.6s infinite` : 'none'
                }}
              >
                <span style={{ fontSize: '2.5rem', fontFamily: 'var(--font-rpg)', color: isUnder30 ? '#ff4d4d' : '#9b5de5', fontWeight: 'bold' }}>
                  {formattedTime(ritualTimeLeft)}
                </span>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', marginBottom: '2rem' }}>
                {isUnder30 ? '🔥 Время горит! Концентрируйтесь изо всех сил!' : '🔮 Ритуал активен. Дышите глубоко и сфокусируйтесь на работе...'}
              </p>

              <button 
                className="rpg-btn rpg-btn-blood"
                style={{ padding: '8px 25px' }}
                onClick={() => handleFinishRitual(false)}
              >
                🕯️ ЗАВЕРШИТЬ РИТУАЛ РАНЬШЕ
              </button>
            </div>
          )}

          {ritualFinished && (
            <div className="animate-fade-in">
              <div 
                style={{ 
                  background: 'radial-gradient(circle, #22142e 0%, #0d0514 100%)',
                  border: '1px solid #9b5de5', 
                  padding: '1.5rem', 
                  marginBottom: '2rem', 
                  borderRadius: '4px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.8), inset 0 0 15px rgba(155,93,229,0.1)'
                }}
              >
                <h3 className="gothic-title" style={{ fontSize: '1rem', color: '#ffb813', marginBottom: '1rem' }}>
                  📜 ЛЕТОПИСЬ БЛАГОСЛОВЕНИЯ БЕЗДНЫ
                </h3>

                {ritualBlessingLoading ? (
                  <div style={{ padding: '2rem' }}>
                    <RefreshCw className="heartbeat-pulse fast" style={{ color: 'var(--color-mana-glow)', marginBottom: '1rem' }} size={24} />
                    <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-bone-dim)' }}>
                      «Древние духи ткут строки вечности для вашей души...»
                    </p>
                  </div>
                ) : (
                  <p 
                    style={{ 
                      fontSize: '0.92rem', 
                      color: '#e6dfd3', 
                      lineHeight: '1.5', 
                      fontFamily: 'Georgia, serif', 
                      fontStyle: 'italic',
                      whiteSpace: 'pre-wrap',
                      textAlign: 'left'
                    }}
                  >
                    {ritualBlessingText}
                  </p>
                )}
              </div>

              <button 
                className="rpg-btn rpg-btn-mana"
                style={{ borderColor: 'var(--color-relic-glow)', color: '#ffb813', fontSize: '1.05rem', padding: '10px 30px' }}
                onClick={() => {
                  setRitualModalOpen(false);
                  setRitualFinished(false);
                  setRitualBlessingText('');
                }}
              >
                ✓ ПРИНЯТЬ БЛАГОСЛОВЕНИЕ И ВЕРНУТЬСЯ
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHuntScreen = () => {
    if (!huntModalOpen) return null;

    const formattedTime = (secs) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const breakCount = Math.floor(huntBreakInterval / 30);
    const breakPlural = (() => {
      if (breakCount % 10 === 1 && breakCount % 100 !== 11) return 'перевал';
      if ([2, 3, 4].includes(breakCount % 10) && ![12, 13, 14].includes(breakCount % 100)) return 'перевала';
      return 'перевалов';
    })();

    return (
      <div 
        className="gothic-modal-overlay" 
        style={{ 
          position: isFullscreenFocus ? 'fixed' : 'absolute',
          top: 0,
          left: 0,
          width: isFullscreenFocus ? '100vw' : '100%',
          height: isFullscreenFocus ? '100vh' : 'auto',
          minHeight: isFullscreenFocus ? '100vh' : 'calc(100vh - 120px)',
          zIndex: 9999,
          background: 'radial-gradient(circle, rgba(14, 10, 5, 0.5) 0%, rgba(5, 3, 6, 0.65) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        <div 
          className="gothic-modal-content" 
          style={{ 
            maxWidth: '650px', 
            width: '90%', 
            border: '2px solid var(--color-blood-glow)',
            boxShadow: '0 0 35px rgba(139, 26, 26, 0.4), inset 0 0 15px rgba(0,0,0,0.6)',
            background: '#0a0605',
            textAlign: 'center',
            padding: '2.5rem',
            position: 'relative'
          }}
        >
          <button 
            className="rpg-btn" 
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10005,
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderColor: 'var(--color-blood-glow)',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
            }} 
            onClick={toggleFullscreenFocus}
          >
            {isFullscreenFocus ? '🌌 СВЕРНУТЬ В ОКНО' : '🌌 ПОЛНОЭКРАННЫЙ РЕЖИМ'}
          </button>
          <h2 className="gothic-title" style={{ fontSize: '1.5rem', color: '#ffcc00', marginBottom: '1.5rem', textShadow: '0 0 10px rgba(255, 204, 0, 0.3)' }}>
            ОХОТА
          </h2>

          {!huntIsRunning && !huntPayoutActive && (
            <div className="animate-fade-in">
              <p style={{ fontSize: '0.95rem', color: 'var(--color-bone-dim)', lineHeight: '1.5', marginBottom: '1.5rem', fontFamily: 'Georgia, serif' }}>
                Заработайте золото, мораль и тонны опыта за ваши приключения!
              </p>

              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', border: '1px solid rgba(255, 204, 0, 0.15)', borderRadius: '4px', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-bone-dim)' }}>РЕЖИМ СЕАНСА:</span>
                  <div style={{ display: 'flex', border: '1px solid var(--color-iron-light)', borderRadius: '4px', overflow: 'hidden' }}>
                    <button 
                      className={`rpg-btn ${huntMode === 'pomodoro' ? 'active' : ''}`}
                      style={{ fontSize: '0.75rem', padding: '5px 12px', background: huntMode === 'pomodoro' ? 'rgba(255,204,0,0.2)' : 'transparent', color: huntMode === 'pomodoro' ? '#ffcc00' : 'var(--color-bone-dim)' }}
                      onClick={() => setHuntMode('pomodoro')}
                    >
                      Расчет по времени
                    </button>
                    <button 
                      className={`rpg-btn ${huntMode === 'stopwatch' ? 'active' : ''}`}
                      style={{ fontSize: '0.75rem', padding: '5px 12px', background: huntMode === 'stopwatch' ? 'rgba(255,204,0,0.2)' : 'transparent', color: huntMode === 'stopwatch' ? '#ffcc00' : 'var(--color-bone-dim)' }}
                      onClick={() => setHuntMode('stopwatch')}
                    >
                      Узы со временем
                    </button>
                  </div>
                </div>

                {huntMode === 'pomodoro' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-bone-dim)' }}>
                        Длительность забега:
                      </span>
                      
                      {/* Hours and Minutes Inputs */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input 
                          type="number" 
                          min="0" 
                          max="5"
                          value={Math.floor(huntBreakInterval / 60)}
                          onChange={(e) => {
                            const hrs = Math.max(0, Math.min(5, Number(e.target.value)));
                            const mins = huntBreakInterval % 60;
                            const total = hrs * 60 + mins;
                            setHuntBreakInterval(Math.max(5, Math.min(300, total)));
                          }}
                          className="rpg-input" 
                          style={{ width: '55px', textAlign: 'center', fontSize: '0.9rem', padding: '4px', background: '#000', color: '#fff', border: '1px solid rgba(255,204,0,0.3)' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)' }}>ч</span>
                        
                        <input 
                          type="number" 
                          min="0" 
                          max="59"
                          value={huntBreakInterval % 60}
                          onChange={(e) => {
                            const hrs = Math.floor(huntBreakInterval / 60);
                            const mins = Math.max(0, Math.min(59, Number(e.target.value)));
                            const total = hrs * 60 + mins;
                            setHuntBreakInterval(Math.max(5, Math.min(300, total)));
                          }}
                          className="rpg-input" 
                          style={{ width: '55px', textAlign: 'center', fontSize: '0.9rem', padding: '4px', background: '#000', color: '#fff', border: '1px solid rgba(255,204,0,0.3)' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)' }}>мин</span>
                      </div>
                    </div>

                    {/* Range Slider from 5 to 300 minutes */}
                    <input 
                      type="range"
                      min="5"
                      max="300"
                      step="5"
                      value={huntBreakInterval}
                      onChange={(e) => setHuntBreakInterval(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--color-blood-glow, #8b1a1a)', cursor: 'pointer' }}
                    />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-bone-dim)' }}>
                      <span>Мин: 5 мин</span>
                      <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>
                        Выбрано: {Math.floor(huntBreakInterval / 60) > 0 ? `${Math.floor(huntBreakInterval / 60)} ч ` : ''}{huntBreakInterval % 60} мин ({huntBreakInterval} мин)
                      </span>
                      <span>Макс: 5 ч (300 мин)</span>
                    </div>

                    <div style={{ 
                      marginTop: '0.6rem', 
                      fontSize: '0.85rem', 
                      color: '#ffb813', 
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      Расчет похода: {breakCount} {breakPlural}
                    </div>
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="rpg-btn" onClick={() => setHuntModalOpen(false)}>Отмена</button>
                <button 
                  className="rpg-btn"
                  style={{ background: 'var(--color-blood)', borderColor: 'var(--color-blood-glow)', color: '#fff', fontWeight: 'bold' }}
                  onClick={handleStartHunt}
                >
                  Начать охоту
                </button>
              </div>
            </div>
          )}

          {huntIsRunning && (
            <div className="animate-fade-in">
              {huntIsBreak ? (
                <div 
                  style={{ 
                    background: 'radial-gradient(circle, #33201a 0%, #150d0a 100%)',
                    border: '2px solid var(--color-relic-glow)', 
                    padding: '1.5rem', 
                    borderRadius: '4px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.9), inset 0 0 15px rgba(255,184,19,0.15)',
                    textAlign: 'left',
                    marginBottom: '2rem'
                  }}
                >
                  <h3 className="rpg-title" style={{ fontSize: '1.1rem', color: '#ffb813', borderBottom: '1px solid rgba(255,184,19,0.2)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>⛺ Привал: {huntBreakEvent?.title || 'Отдых'}</span>
                    <span style={{ fontSize: '0.85rem', color: '#2ed573' }}>🎁 +{huntBreakEvent?.xp} XP получен!</span>
                  </h3>
                  
                  <p style={{ fontSize: '0.92rem', color: '#e6dfd3', lineHeight: '1.5', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                    {huntBreakEvent?.story}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-rpg)', color: '#ffd700' }}>
                      Осталось на привале: {Math.floor(huntBreakTimeLeft / 60)}:{(huntBreakTimeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <button 
                      className="rpg-btn"
                      style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                      onClick={handleEndHuntBreak}
                    >
                      ⛺ СВЕРНУТЬ ПРИВАЛ ДОСРОЧНО
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div 
                    style={{ 
                      width: '180px', 
                      height: '180px', 
                      border: '3px solid var(--color-blood-glow)', 
                      borderRadius: '50%', 
                      margin: '0 auto 1.5rem auto', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      background: 'rgba(0,0,0,0.6)',
                      boxShadow: '0 0 20px rgba(139, 26, 26, 0.4)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {huntMode === 'pomodoro' ? 'Поиск добычи' : 'Охота'}
                      </span>
                      <span style={{ fontSize: '2rem', fontFamily: 'var(--font-rpg)', color: '#fff', fontWeight: 'bold' }}>
                        {huntMode === 'pomodoro' ? formattedTime(huntTimerValue) : formattedTime(huntTimeSpent)}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', marginBottom: '2rem' }}>
                    🏹 Вы выслеживаете прокрастинацию в густых зарослях времени... Оставайтесь сфокусированными!
                  </p>

                  <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                    <button 
                      className="rpg-btn"
                      style={{ background: 'rgba(255,184,19,0.08)', borderColor: 'var(--color-relic-glow)', color: '#ffb813' }}
                      onClick={triggerHuntBreak}
                    >
                      ⛺ СТАРТОВАТЬ ПРИВАЛ ПОРАНЬШЕ
                    </button>
                    <button 
                      className="rpg-btn rpg-btn-blood"
                      onClick={() => setHuntPayoutActive(true)}
                    >
                      🏹 СВЕРНУТЬ ОХОТУ И РАЗДЕЛИТЬ ТРОФЕИ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {huntPayoutActive && (
            <div className="animate-fade-in" style={{ textAlign: 'left' }}>
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1.5rem', border: '1px solid var(--color-iron-light)', borderRadius: '4px', marginBottom: '1.5rem' }}>
                <h3 className="gothic-title" style={{ fontSize: '1.05rem', color: '#ffb813', marginBottom: '0.8rem', textAlign: 'center' }}>
                  💰 РАЗДЕЛ ТРОФЕЕВ БЕЗДНЫ 💰
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#e6dfd3', lineHeight: '1.5', textAlign: 'center', marginBottom: '1rem', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                  «Бездна пристально смотрит на плоды твоего труда, Путешественник...»
                </p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem', fontSize: '0.85rem', color: 'var(--color-bone-dim)', textAlign: 'center' }}>
                  Вы провели в сессии: <strong>{Math.floor(huntTimeSpent / 60)} мин</strong>. Укажите честный характер ваших трудов:
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div 
                  className="rpg-panel" 
                  style={{ padding: '1rem 1.5rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', background: 'radial-gradient(circle, #100f13 0%, #060507 100%)' }}
                  onClick={() => handleSelectHuntPayout('tasks')}
                >
                  <h4 className="rpg-title" style={{ color: '#2ed573', fontSize: '1.1rem', marginBottom: '4px' }}>
                    🛡️ Я делал текущие задачи из Свитка Дел
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', lineHeight: '1.4' }}>
                    Я работал над задачами, которые уже занесены в мой ежедневный свиток. (Награда: 0.25 от обычного опыта + Сила Духа для маны. Честно, без двойных начислений!).
                  </p>
                </div>

                <div 
                  className="rpg-panel" 
                  style={{ padding: '1rem 1.5rem', cursor: 'pointer', border: '1px solid var(--color-relic-glow)', background: 'radial-gradient(circle, #2b1f0c 0%, #0e0a03 100%)' }}
                  onClick={() => handleSelectHuntPayout('free_travel')}
                >
                  <h4 className="rpg-title" style={{ color: '#ffd700', fontSize: '1.1rem', marginBottom: '4px' }}>
                    🏕️ Вольные путешествия, которые не удостоились летописи
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', lineHeight: '1.4' }}>
                    Я занимался творчеством, уборкой, личными целями или неучтенными делами вне летописи. (Награда: Полное RPG золото, рост Морального компаса и куча опыта!).
                  </p>
                </div>

                <button 
                  className="rpg-btn" 
                  style={{ alignSelf: 'center', marginTop: '0.5rem' }} 
                  onClick={() => setHuntPayoutActive(false)}
                >
                  Вернуться к сессии
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Intercept and render Battle Preparation Screen if prepTask is set
  if (prepTask) {
    return renderPreparationOverlay();
  }

  // Intercept and render Ritual Time Screen if ritualModalOpen is true
  if (ritualModalOpen) {
    return renderRitualScreen();
  }

  // Intercept and render Hunt Time Screen if huntModalOpen is true
  if (huntModalOpen) {
    return renderHuntScreen();
  }

  // Intercept and render Battle Preparation Screen if prepTask is set
  if (prepTask) {
    return renderPreparationOverlay();
  }

  // HUB STAGE: "Текущий статус задач" (Tasks daily overview screen instead of forced text dump)
  if (setupStage === 'hub') {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === todayStr && t.status === 'active');
    const potionCount = character.inventory?.filter(i => i.id === 'item_potion').length || 0;

    return (
      <div className="rpg-panel" style={{ maxWidth: '1280px', margin: '1rem auto', padding: '2rem' }}>
        {/* Hub Header: Hero card summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--color-iron-light)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="gothic-title" style={{ fontSize: '1.5rem', color: 'var(--color-relic-glow)' }}>
              ⚜️ Походный Штаб Путешествия
            </h2>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className="rpg-btn" 
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--color-blood-glow)', color: '#ffb813' }}
              onClick={() => { playClick(); setHuntModalOpen(true); }}
            >
              🏹 Время Охоты
            </button>
            <button 
              className="rpg-btn" 
              style={{ 
                fontSize: '0.8rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                borderColor: '#9b5de5', 
                color: '#ff4d4d',
                animation: ritualTimerActive && (ritualTimeLeft < ritualTimeTotal * 0.3) ? 'pulse-red 0.5s infinite alternate' : 'none'
              }}
              onClick={() => { playClick(); setRitualModalOpen(true); }}
            >
              🔮 Время Ритуала
            </button>
            <button 
              className="rpg-btn" 
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => { playClick(); setMeditationSelectOpen(true); }}
            >
              🎪 Войти в Лагерь
            </button>
            <button 
              className="rpg-btn" 
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setSetupStage('input')}
            >
              🔮 Сплести хаос
            </button>
          </div>
        </div>

        {/* Active daily tasks list (RPG Bounty Contracts) */}
        <h3 className="gothic-title" style={{ fontSize: '1.15rem', color: 'var(--color-bone)', marginBottom: '1.2rem' }}>
          ⚔️ Активные Боевые Контракты на Сегодня:
        </h3>
        
        <div className="combat-contracts-grid">
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
                    background: 'radial-gradient(circle, rgba(25, 20, 30, 0.85) 0%, rgba(12, 10, 15, 0.95) 100%)',
                    border: `2px solid ${isBoss ? 'var(--color-blood-glow)' : 'var(--color-iron-light)'}`,
                    boxShadow: isBoss 
                      ? '0 0 15px rgba(139, 26, 26, 0.4), inset 0 0 10px rgba(139, 26, 26, 0.1)'
                      : '0 5px 15px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.02)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '430px',
                    position: 'relative',
                    transition: 'all 0.25s ease',
                    cursor: 'pointer'
                  }}
                  className="gothic-fate-card"
                  onClick={() => handleOpenEdit(task)}
                >
                  <div>
                    {/* Centered Small Icon */}
                    <div style={{ display: 'flex', justifyContent: 'center', fontSize: '2rem', margin: '0.2rem 0 0.5rem 0', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.05))' }} onClick={(e) => e.stopPropagation()}>
                      {variation.icon}
                    </div>

                    <h4 className="gothic-title" style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 'bold', margin: '0 0 0.5rem 0', textAlign: 'center', lineHeight: '1.3', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {task.title}
                    </h4>
                    
                    {/* Nature / Mode Badges */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                      <span style={{ 
                        fontSize: '0.6rem', 
                        color: task.nature === 'internal' ? '#4fc3f7' : '#ff8a80', 
                        background: 'rgba(0,0,0,0.4)', 
                        padding: '1px 5px', 
                        borderRadius: '3px',
                        border: `1px solid ${task.nature === 'internal' ? 'rgba(79, 195, 247, 0.25)' : 'rgba(255, 138, 128, 0.25)'}` 
                      }}>
                        {task.nature === 'internal' ? '🧿 Внутренний' : '⚔️ Внешний'}
                      </span>
                      {task.executionMode && task.executionMode !== 'ask_later' && (
                        <span style={{
                          fontSize: '0.6rem',
                          color: 'var(--color-bone-dim)',
                          background: 'rgba(0,0,0,0.4)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          {task.executionMode === 'timer' ? '⏳ Таймер' : '🌅 День'}
                        </span>
                      )}
                    </div>
                    
                    {/* Details Info */}
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-bone-dim)', background: 'rgba(0,0,0,0.25)', padding: '0.4rem 0.5rem', border: '1px solid rgba(255,255,255,0.02)', marginBottom: '0.5rem' }}>
                      <div style={{ marginBottom: '1px' }}>Враг: <b style={{ color: 'var(--color-blood-glow)' }}>{eName}</b></div>
                      <div style={{ marginBottom: '1px' }}>Сущность: <b>{isBoss ? 'Осада (Босс)' : 'Охота'}</b></div>
                      <div style={{ marginBottom: '1px' }}>Время: <b>{task.pomodoroTime} мин</b></div>
                      <div>Токсичность: <b>{task.toxicity === 'scary' ? 'Страшная' : task.toxicity === 'tedious' ? 'Скучная' : task.toxicity === 'vague' ? 'Мутная' : 'Обычная'}</b></div>
                    </div>

                    {/* Intent / Description */}
                    {task.intent && (
                      <div style={{ 
                        background: 'rgba(140, 125, 107, 0.08)', 
                        borderLeft: '2px solid var(--color-relic)', 
                        padding: '0.4rem 0.6rem', 
                        fontSize: '0.75rem', 
                        fontStyle: 'italic', 
                        color: 'var(--color-bone-dim)', 
                        margin: '0.6rem 0',
                        lineHeight: '1.3'
                      }}>
                        <b>Намерение:</b> «{task.intent}»
                      </div>
                    )}

                    {/* Task Steps */}
                    {task.steps && task.steps.length > 0 && (
                      <div style={{ marginTop: '0.6rem', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '0.6rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-rpg)', display: 'block', marginBottom: '4px' }}>
                          🎯 Шаги прорыва ({task.steps.filter(s => s.completed).length}/{task.steps.length}):
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '90px', overflowY: 'auto', paddingRight: '4px' }} className="rpg-scrollbar">
                          {task.steps.map(step => (
                            <div 
                              key={step.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '5px', 
                                fontSize: '0.75rem', 
                                color: step.completed ? 'var(--color-bone-dim)' : '#fff',
                                textDecoration: step.completed ? 'line-through' : 'none',
                                opacity: step.completed ? 0.6 : 1
                              }}
                            >
                              <span style={{ color: step.completed ? 'var(--color-relic-glow)' : 'var(--color-blood-glow)' }}>
                                {step.completed ? '☑' : '☐'}
                              </span>
                              <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }} title={step.title}>
                                {step.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }} onClick={(e) => e.stopPropagation()}>
                    {/* Row 1: В бой and Выполнено */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="rpg-btn"
                        style={{ 
                          flex: 1, 
                          padding: '0.4rem 0', 
                          fontSize: '0.8rem', 
                          fontWeight: 'bold',
                          background: '#1b5e20', 
                          borderColor: '#2e7d32',
                          color: '#fff'
                        }}
                        onClick={() => {
                          handleInstantCompleteTask(task);
                        }}
                      >
                        🏹 ВЫПОЛНИЛ
                      </button>

                      <button 
                        className="rpg-btn rpg-btn-blood"
                        style={{ flex: 1, padding: '0.4rem 0', fontSize: '0.8rem', fontWeight: 'bold' }}
                        onClick={() => {
                          playClick();
                          handleStartCombatSession(task);
                        }}
                      >
                        {task.timeLeft !== undefined ? `⚔️ В БОЙ (${Math.ceil(task.timeLeft / 60)}м)` : '⚔️ В БОЙ'}
                      </button>
                    </div>

                    {/* Row 2: На завтра and В бэклог */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="rpg-btn"
                        style={{ flex: 1, padding: '0.3rem 0', fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.1)' }}
                        onClick={() => {
                          handleRescheduleTomorrow(task);
                        }}
                      >
                        📅 НА ЗАВТРА
                      </button>
                      <button 
                        className="rpg-btn"
                        style={{ flex: 1, padding: '0.3rem 0', fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.1)' }}
                        onClick={() => {
                          handleMoveToBacklog(task);
                        }}
                      >
                        📦 В БЭКЛОГ
                      </button>
                    </div>

                    {/* Row 3: Сбежать от судьбы */}
                    <button 
                      className="rpg-btn"
                      style={{ 
                        width: '100%', 
                        padding: '0.3rem 0', 
                        fontSize: '0.72rem', 
                        background: '#3a0000', 
                        borderColor: '#5c0000',
                        color: '#ff8a80',
                        marginTop: '0.2rem',
                        fontWeight: 'bold'
                      }}
                      onClick={() => {
                        handleEscapeFate(task);
                      }}
                    >
                      🏃 СБЕЖАТЬ ОТ СУДЬБЫ
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ border: '1px dashed var(--color-iron-light)', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', gridColumn: 'span 3' }}>
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
        {renderMeditationSelect()}
        {editingTask && renderEditTaskModal()}
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
        <p style={{ fontSize: '0.95rem', color: 'var(--color-bone-dim)', marginBottom: '1.5rem', fontFamily: 'Georgia, serif', lineHeight: '1.5', fontStyle: 'italic' }}>
          «Ввергните в этот омут все помыслы и заботы, что терзают ваш разум черным комом. Бессвязно, хаотично, со всей яростью и отчаянием. Бездна Абаддона внемлет этому шепоту, взвесит скверну каждого деяния и разделит их по законам Пути (Охота, Осады, Реликвии).»
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
    if (!parsedList || parsedList.length === 0) {
      return (
        <div className="rpg-panel" style={{ maxWidth: '800px', margin: '1rem auto', textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--color-bone-dim)' }}>В омуте хаоса ничего не найдено...</p>
          <button className="rpg-btn" onClick={() => setSetupStage('input')}>Назад</button>
        </div>
      );
    }

    const currentCard = parsedList[reviewIndex];
    const isLastCard = reviewIndex >= parsedList.length - 1;

    const currentHour = new Date().getHours();
    const isLateHour = currentHour >= 20 || currentHour < 5;
    const failuresLessons = tasks ? tasks.filter(t => t.runeOfReturn && t.runeOfReturn.futureAdvice).map(t => t.runeOfReturn.futureAdvice) : [];

    return (
      <div className="rpg-panel" style={{ maxWidth: '650px', margin: '1rem auto', padding: '2rem' }}>
        <h2 className="gothic-title" style={{ fontSize: '1.4rem', marginBottom: '0.3rem', color: 'var(--color-bone)', textAlign: 'center' }}>
          Одобрить Пакт Задач ({reviewIndex + 1} из {parsedList.length})
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', marginBottom: '1.5rem', textAlign: 'center' }}>
          Проверьте контракт перед вступлением в бой. Настройте детальность и определите глубину пути.
        </p>

        {loadingAI ? (
          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--color-iron-light)', padding: '3rem', textAlign: 'center' }}>
            <RefreshCw className="heartbeat-pulse fast" style={{ color: 'var(--color-mana-glow)', marginBottom: '1rem' }} size={32} />
            <p style={{ fontFamily: 'var(--font-rpg)' }}>Бездна шепчет заклинания... Идет разделение шагов...</p>
          </div>
        ) : (
          <div style={{
            background: 'radial-gradient(circle, rgba(25, 20, 30, 0.85) 0%, rgba(12, 10, 15, 0.95) 100%)',
            border: `2px solid ${currentCard.type === 'siege' ? 'var(--color-blood-glow)' : 'var(--color-iron-light)'}`,
            padding: '1.5rem',
            boxShadow: currentCard.type === 'siege' ? '0 0 15px rgba(139, 26, 26, 0.3)' : '0 5px 15px rgba(0,0,0,0.5)',
            marginBottom: '1.5rem',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', gap: '10px' }}>
              <input 
                type="text" 
                value={currentCard.title || ''} 
                onChange={(e) => {
                  const val = e.target.value;
                  setParsedList(prev => prev.map((item, idx) => idx === reviewIndex ? { ...item, title: val } : item));
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '1.15rem',
                  fontWeight: 'bold',
                  flex: 1,
                  padding: '2px 0',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                placeholder="Название квеста..."
              />
              <span style={{ 
                fontSize: '0.72rem', 
                padding: '2px 8px', 
                background: currentCard.type === 'siege' ? 'rgba(139,26,26,0.2)' : 'rgba(255,255,255,0.05)',
                color: currentCard.type === 'siege' ? 'var(--color-blood-glow)' : 'var(--color-bone-dim)',
                border: `1px solid ${currentCard.type === 'siege' ? 'var(--color-blood)' : 'var(--color-iron-light)'}`,
                whiteSpace: 'nowrap'
              }}>
                {currentCard.type === 'siege' ? '💥 ОСАДА' : currentCard.type === 'relic' ? '💎 РЕЛИКВИЯ' : currentCard.type === 'corpse' ? '💀 ДОЛГ' : '🏹 ОХОТА'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-bone-dim)' }}>
                  ⏳ Время таймера:
                  <input 
                    type="number" 
                    min="1" 
                    max="180"
                    value={currentCard.estimatedTime || 25}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 25;
                      setParsedList(prev => prev.map((item, idx) => idx === reviewIndex ? { ...item, estimatedTime: val } : item));
                    }}
                    style={{
                      width: '60px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--color-iron-light)',
                      color: '#fff',
                      padding: '2px 5px',
                      textAlign: 'center',
                      fontFamily: 'monospace'
                    }}
                  />
                  <span>мин</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-bone-dim)' }}>
                  🚨 Дедлайн:
                  <input 
                    type="text" 
                    placeholder="до 18:00 / среду"
                    value={currentCard.deadline || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setParsedList(prev => prev.map((item, idx) => idx === reviewIndex ? { ...item, deadline: val } : item));
                    }}
                    style={{
                      width: '130px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--color-iron-light)',
                      color: '#fff',
                      padding: '2px 5px',
                      fontFamily: 'var(--font-rpg)',
                      fontSize: '0.8rem'
                    }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-bone-dim)' }}>
                  📅 Дата выполнения:
                  <input 
                    type="date" 
                    value={currentCard.scheduledDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setParsedList(prev => prev.map((item, idx) => idx === reviewIndex ? { ...item, scheduledDate: val } : item));
                    }}
                    style={{
                      width: '135px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--color-iron-light)',
                      color: '#fff',
                      padding: '2px 5px',
                      fontFamily: 'var(--font-rpg)',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  />
                </label>
              </div>

              {!currentCard.deadline && (
                <div style={{ color: '#ffb813', fontSize: '0.75rem', fontFamily: 'var(--font-rpg)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⚠️ Бездна не нашла дедлайн в ваших мыслях. Пожалуйста, укажите его вручную выше!
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>
                {currentCard.toxicity && (
                  <span style={{ color: 'var(--color-blood-glow)' }}>
                    Токсичность: <b>{currentCard.toxicity === 'scary' ? 'Страшно' : currentCard.toxicity === 'vague' ? 'Мутно' : currentCard.toxicity === 'tedious' ? 'Скучно' : 'Стандарт'}</b>
                  </span>
                )}
              </div>
            </div>

            {/* Steps Section or Guided Questions Panel */}
            {reviewGuidedActive ? (
              <div style={{ background: 'rgba(25, 20, 35, 0.65)', border: '1px dashed var(--color-relic-glow)', padding: '1rem', marginBottom: '1.2rem', borderRadius: '4px' }}>
                <h4 style={{ fontSize: '0.88rem', color: 'var(--color-relic-glow)', marginBottom: '10px', fontFamily: 'var(--font-rpg)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>💬 Бездна задает вопросы о деталях:</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {reviewGuidedQuestions.map((q, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.82rem', color: 'var(--color-bone-dim)', lineHeight: '1.3' }}>{q}</label>
                      <input 
                        type="text" 
                        className="rpg-input" 
                        style={{ fontSize: '0.85rem', padding: '6px 10px', width: '100%' }} 
                        placeholder="Ваш ответ..."
                        value={reviewGuidedAnswers[idx] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReviewGuidedAnswers(prev => ({ ...prev, [idx]: val }));
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
                  <button 
                    className="rpg-btn rpg-btn-mana" 
                    style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                    onClick={handleReviewAnswerSubmit}
                    disabled={loadingAI}
                  >
                    🔮 Уточнить шаги Бездной
                  </button>
                  <button 
                    className="rpg-btn" 
                    style={{ fontSize: '0.78rem', padding: '5px 12px', borderColor: 'var(--color-iron-light)' }}
                    onClick={() => {
                      playClick();
                      setReviewGuidedActive(false);
                      handleDetailedDeconstruction();
                    }}
                    disabled={loadingAI}
                  >
                    ✨ Достаточно (Спланировать как есть)
                  </button>
                  <button 
                    className="rpg-btn" 
                    style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                    onClick={() => {
                      playClick();
                      setReviewGuidedActive(false);
                    }}
                    disabled={loadingAI}
                  >
                    ОТМЕНА
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-bone)', marginBottom: '6px', fontFamily: 'var(--font-rpg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Шаги прорыва:</span>
                  <button 
                    className="rpg-btn" 
                    style={{ fontSize: '0.7rem', padding: '2px 6px', height: 'auto', lineHeight: '1' }}
                    onClick={() => {
                      playClick();
                      setParsedList(prev => prev.map((item, idx) => {
                        if (idx === reviewIndex) {
                          return { ...item, steps: [...(item.steps || []), ''] };
                        }
                        return item;
                      }));
                    }}
                  >
                    ➕ Добавить шаг
                  </button>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.2rem', paddingLeft: '0.5rem', borderLeft: '1px dashed var(--color-iron-light)' }}>
                  {currentCard.steps && currentCard.steps.map((s, sIdx) => (
                    <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--color-bone-dim)', fontSize: '0.85rem' }}>•</span>
                      <input 
                        type="text"
                        value={s}
                        onChange={(e) => {
                          const val = e.target.value;
                          setParsedList(prev => prev.map((item, idx) => {
                            if (idx === reviewIndex) {
                              const updatedSteps = [...(item.steps || [])];
                              updatedSteps[sIdx] = val;
                              return { ...item, steps: updatedSteps };
                            }
                            return item;
                          }));
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px dashed rgba(255,255,255,0.15)',
                          color: 'var(--color-bone-dim)',
                          fontSize: '0.85rem',
                          flex: 1,
                          padding: '2px 0',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                        placeholder="Напишите физическое действие..."
                      />
                      <button 
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-blood-glow)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          padding: '0 4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onClick={() => {
                          playClick();
                          setParsedList(prev => prev.map((item, idx) => {
                            if (idx === reviewIndex) {
                              return { ...item, steps: (item.steps || []).filter((_, stepI) => stepI !== sIdx) };
                            }
                            return item;
                          }));
                        }}
                        title="Удалить шаг"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  {(!currentCard.steps || currentCard.steps.length === 0) && (
                    <div style={{ fontStyle: 'italic', color: 'var(--color-iron-light)', fontSize: '0.8rem' }}>Нет шагов. Нажмите кнопку выше для добавления или ниже для авто-расширения.</div>
                  )}
                </div>
              </>
            )}

            {/* AI Warning & Actions for Late Hour / Long Journey */}
            {(currentCard.isLongJourney || isLateHour) && (
              <div style={{ 
                background: 'rgba(139, 26, 26, 0.15)', 
                border: '1px solid var(--color-blood)', 
                padding: '0.8rem', 
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ color: 'var(--color-blood-glow)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                  <span>🔮 Провидение Бездны (Анализ риска провала):</span>
                </div>
                {isLateHour ? (
                  <p style={{ color: 'var(--color-bone-dim)', margin: '0 0 8px 0', fontSize: '0.8rem' }}>
                    Внимание! Уже поздний вечер (после 20:00). Ставить длительную задачу на сегодня рискованно — это может привести к просрочке и потере HP разума.
                  </p>
                ) : (
                  <p style={{ color: 'var(--color-bone-dim)', margin: '0 0 8px 0', fontSize: '0.8rem' }}>
                    Квест определен как Длительное путешествие. Для таких тяжелых контрактов Бездна рекомендует детально спланировать дедлайн или разделить его силы.
                  </p>
                )}

                {failuresLessons.length > 0 && (
                  <div style={{ fontStyle: 'italic', fontSize: '0.78rem', color: '#ffb813', marginBottom: '8px', paddingLeft: '5px', borderLeft: '2px solid #ffb813' }}>
                    ⚠️ Урок из ваших прошлых промахов: "{failuresLessons[failuresLessons.length - 1]}" (рекомендуется планировать время и не ставить задачи поздно).
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '8px' }}>
                  <button 
                    className="rpg-btn" 
                    style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    onClick={() => handleSplitReviewTask(reviewIndex)}
                  >
                    🛡️ Разбить на 2 части
                  </button>
                  <button 
                    className="rpg-btn" 
                    style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    onClick={() => {
                      playClick();
                      setParsedList(prev => prev.map((item, idx) => idx === reviewIndex ? { ...item, deadline: 'через 2 дня', estimatedTime: Math.max(15, Math.round(item.estimatedTime / 2)) } : item));
                    }}
                  >
                    ⏳ На 2 дня и более
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Options inside single card */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-bone-dim)' }}>
                  <input 
                    type="checkbox" 
                    checked={currentCard.isLongJourney || false} 
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setParsedList(prev => prev.map((item, idx) => idx === reviewIndex ? { ...item, isLongJourney: isChecked } : item));
                      if (isChecked) {
                        setAdaptationTask({ ...currentCard, isLongJourney: true });
                        setAdaptationTaskIndex(reviewIndex);
                        setAdaptationDeadline(currentCard.deadline || '');
                        setAdaptationModalOpen(true);
                        playClick();
                      }
                    }} 
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-blood)', cursor: 'pointer' }} 
                  />
                  <span>Длительное путешествие</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-bone-dim)' }}>
                  Режим:
                  <select
                    value={currentCard.executionMode || 'ask_later'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setParsedList(prev => prev.map((item, idx) => idx === reviewIndex ? { ...item, executionMode: val } : item));
                    }}
                    className="rpg-input"
                    style={{ fontSize: '0.8rem', padding: '2px 5px', height: '28px', cursor: 'pointer' }}
                  >
                    <option value="ask_later">❓ Спросить позже</option>
                    <option value="timer">⏳ Таймер</option>
                    <option value="day">🌅 В течение дня</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="rpg-btn" 
                  style={{ fontSize: '0.75rem', padding: '3px 8px', borderColor: 'var(--color-mana-glow)' }}
                  onClick={handleDetailedDeconstruction}
                  disabled={loadingAI}
                >
                  🔮 Нужны более подробные шаги
                </button>
                <button 
                  className="rpg-btn" 
                  style={{ fontSize: '0.75rem', padding: '3px 8px', borderColor: 'var(--color-relic-glow)' }}
                  onClick={handleRequestReviewQuestions}
                  disabled={loadingAI || reviewGuidedActive}
                >
                  💬 Расспросить Бездну
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="rpg-btn" onClick={() => setSetupStage('input')}>
              ВЕРНУТЬСЯ
            </button>
            <button 
              className="rpg-btn rpg-btn-mana"
              style={{ fontSize: '0.8rem', padding: '4px 12px' }}
              onClick={() => {
                playClick();
                handleStartCrashSequence(parsedList, true);
              }}
              title="Создать все задачи из дампа хаоса и перейти к выбору"
            >
              ⏭️ Создать все и выбрать квест
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="rpg-btn rpg-btn-blood"
              style={{ fontSize: '0.8rem', padding: '4px 10px' }}
              onClick={() => {
                playClick();
                const updated = parsedList.filter((_, idx) => idx !== reviewIndex);
                setParsedList(updated);
                if (updated.length === 0) {
                  setSetupStage('input');
                } else if (reviewIndex >= updated.length) {
                  // If we rejected the last card but have remaining approved tasks, start the journey!
                  handleStartCrashSequence(updated);
                }
              }}
            >
              Отклонить карту
            </button>

            <button 
              className="rpg-btn rpg-btn-mana" 
              style={{ padding: '0.75rem 2rem', fontWeight: 'bold' }} 
              onClick={() => {
                const currentHour = new Date().getHours();
                const isLateHour = currentHour >= 20 || currentHour < 5;
                if ((currentCard.isLongJourney || isLateHour) && !currentCard.isAdaptationChecked) {
                  setAdaptationTask(currentCard);
                  setAdaptationTaskIndex(reviewIndex);
                  setAdaptationDeadline(currentCard.deadline || '');
                  setAdaptationModalOpen(true);
                  playClick();
                } else {
                  if (isLastCard) {
                    handleStartCrashSequence();
                  } else {
                    playClick();
                    setReviewIndex(reviewIndex + 1);
                  }
                }
              }}
            >
              {isLastCard ? "НАЧАТЬ ПУТЕШЕСТВИЕ" : "ОДОБРИТЬ КОНТРАКТ"}
            </button>
          </div>
        </div>
        {renderAdaptationModal()}
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
            {(character.completedTasksCount || 0) === 0 ? "НАПИШИ, ЧТОБЫ ВЫЖИТЬ" : "ПОДГОТОВИТЬСЯ К БОЮ"}
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-bone-dim)', marginBottom: '2rem', lineHeight: '1.4' }}>
            {(() => {
              const taskCount = character.completedTasksCount || 0;
              const hashStr = (activeTask?.id || '') + taskCount;
              let hash = 0;
              for (let i = 0; i < hashStr.length; i++) {
                hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
              }
              hash = Math.abs(hash);

              const firstQuestScenarios = [
                "Повозка Империи Света перевернулась и разбита в щепки! Вы очнулись в кандалах под проливным дождем. Инквизиторы Света лежат без сознания, но коварная скверна стягивается из глубин леса...",
                "Повозка Империи Света атакована дикими тварями! Вы очнулись в полуразрушенной клетке среди обломков. Вокруг царит зловещая тишина, но тени Бездны уже ползут к вашей душе..."
              ];

              const subsequentScenarios = [
                "Бездна Абаддона внезапно сковала ваши мысли ледяным параличом внимания! Призраки прокрастинации кружат над вами, готовясь поглотить волю разума...",
                "Вы очнулись посреди черного пепелища, скованные тяжелыми цепями сомнений и страха. Дух Когнитивного Тупика нависает над вашим изголовьем...",
                "Скверна опутала ваши руки колючими лозами апатии. Каждый вдох дается с трудом, а враг уже занес свой призрачный клинок над вашей головой...",
                "Вы провалились в зыбучие пески сомнений во время ночного перехода. Тьма сгущается с каждой секундой, заглушая биение вашего сердца..."
              ];

              return taskCount === 0 
                ? firstQuestScenarios[hash % firstQuestScenarios.length]
                : subsequentScenarios[hash % subsequentScenarios.length];
            })()}
            <br /><br />
            <b>Напишите первое элементарное физическое или умственное действие, которое вы сделаете ПРЯМО СЕЙЧАС, чтобы запустить путешествие.</b>
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
    if (activeCombatBreak) {
      return (
        <div 
          className="rpg-panel rest-camp-overlay animate-fade-in" 
          style={isFullscreenFocus ? {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            overflowY: 'auto',
            background: 'radial-gradient(circle, #24140b 0%, #080301 100%)',
            padding: '2.5rem',
            border: '3px solid #ff9f43',
            boxShadow: '0 0 35px rgba(255, 159, 67, 0.4), inset 0 0 20px rgba(0,0,0,0.8)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          } : {
            maxWidth: '950px',
            margin: '0 auto',
            padding: '2.5rem',
            border: '3px solid #ff9f43',
            boxShadow: '0 0 35px rgba(255, 159, 67, 0.4), inset 0 0 20px rgba(0,0,0,0.8)',
            background: 'radial-gradient(circle, #24140b 0%, #080301 100%)',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <button 
            className="rpg-btn" 
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10005,
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderColor: '#ff9f43',
              background: 'rgba(0,0,0,0.6)',
              color: '#ff9f43',
            }} 
            onClick={toggleFullscreenFocus}
          >
            {isFullscreenFocus ? '🌌 СВЕРНУТЬ В ОКНО' : '🌌 ПОЛНОЭКРАННЫЙ РЕЖИМ'}
          </button>

          <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 15px rgba(255, 159, 67, 0.4))' }}>⛺</span>
          
          <h1 className="gothic-title" style={{ color: '#ff9f43', fontSize: '2rem', marginBottom: '0.5rem', letterSpacing: '2px', textShadow: '0 0 10px rgba(255, 159, 67, 0.3)' }}>
            ⛺ БОЕВОЙ ПРИВАЛ: Дыхание Бездны
          </h1>
          <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 1.5rem auto', lineHeight: '1.5', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
            «Вы бьетесь в чертогах Абаддона уже 30 минут. Разум требует краткой передышки, костер трещит во мгле. Духи шепчут вам выполнить простые дела, дабы укрепить боевую волю!»
          </p>

          <div style={{ 
            background: 'rgba(0,0,0,0.5)', 
            border: '1px solid rgba(255, 159, 67, 0.2)', 
            borderRadius: '4px',
            padding: '1.5rem', 
            maxWidth: '650px',
            width: '100%',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '0.9rem', color: '#ff9f43', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px dashed rgba(255,159,67,0.2)', paddingBottom: '5px', fontFamily: 'var(--font-rpg)' }}>
              🎯 Испытания привала (Дополнительные награды в конце боя):
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {activeCombatBreak.tasks.map(t => (
                <div 
                  key={t.id}
                  onClick={() => {
                    playClick();
                    if (!t.completed) playSuccess();
                    setActiveCombatBreak(prev => {
                      const updatedTasks = prev.tasks.map(task => task.id === t.id ? { ...task, completed: !task.completed } : task);
                      return { ...prev, tasks: updatedTasks };
                    });
                    if (!t.completed) {
                      spawnFloater(`+${t.xp} XP!`, 'hero-damage');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    padding: '0.75rem 1rem',
                    background: t.completed ? 'rgba(46, 213, 115, 0.05)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${t.completed ? '#2ed573' : 'rgba(255, 159, 67, 0.15)'}`,
                    cursor: 'pointer',
                    textDecoration: t.completed ? 'line-through' : 'none',
                    opacity: t.completed ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => {}}
                    style={{ accentColor: '#2ed573', pointerEvents: 'none' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.9rem', color: '#fff' }}>{t.title}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-rpg)', color: '#2ed573', display: 'flex', gap: '8px' }}>
                    <span>🎁 +{t.xp} XP</span>
                    <span style={{ color: '#ffd700' }}>🪙 +{t.gold} Золота</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            className="rpg-btn"
            style={{ 
              padding: '0.8rem 2.5rem', 
              fontSize: '1.05rem', 
              borderColor: '#ff9f43', 
              color: '#ff9f43',
              boxShadow: '0 0 15px rgba(255, 159, 67, 0.2)',
              fontWeight: 'bold'
            }}
            onClick={handleCompleteCombatBreak}
          >
            ⛺ СВЕРНУТЬ ЛАГЕРЬ И ПРОДОЛЖИТЬ БОЙ
          </button>
        </div>
      );
    }

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
      <div 
        className={`rpg-panel ${isFullscreenFocus ? 'immersive-fullscreen-arena' : ''}`}
        style={isFullscreenFocus ? {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          overflowY: 'auto',
          background: 'radial-gradient(circle, #0e0813 0%, #030106 100%)',
          padding: '2rem',
          maxWidth: '100vw',
          margin: 0,
          border: `3px solid ${isBoss ? 'var(--color-blood-glow)' : 'var(--color-relic-glow)'}`,
          boxSizing: 'border-box'
        } : {
          maxWidth: '950px',
          margin: '0 auto',
          border: `2px solid ${isBoss ? 'var(--color-blood-glow)' : 'var(--color-iron-light)'}`,
          position: 'relative'
        }}
      >
        <button 
          className="rpg-btn" 
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10005,
            padding: '6px 12px',
            fontSize: '0.75rem',
            borderColor: isBoss ? 'var(--color-blood-glow)' : 'var(--color-relic-glow)',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }} 
          onClick={toggleFullscreenFocus}
        >
          {isFullscreenFocus ? '🌌 СВЕРНУТЬ В ОКНО' : '🌌 ПОЛНОЭКРАННЫЙ РЕЖИМ'}
        </button>

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
            <span>🔮 Ресурс: <b style={{ color: 'var(--color-mana-glow)' }}>{Math.round(character.mana)} RP</b></span>
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
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', fontStyle: 'italic' }}>
                    Сущность: {variation.icon} {variation.type.toUpperCase()} • Оценка: {activeTask.toxicity === 'scary' ? 'Страшная' : 'Стандарт'}
                  </span>
                  {activeTask.deadline && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-blood-glow)', fontFamily: 'var(--font-rpg)', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
                      🚨 ДЕДЛАЙН: {activeTask.deadline}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                {activeTask.executionMode === 'day' ? (
                  <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-rpg)', color: '#1db954', border: '1px solid rgba(29,185,84,0.3)', padding: '4px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                    🌅 СВОБОДНЫЙ ПЕРЕХОД
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontFamily: 'var(--font-rpg)', 
                    color: timeLeft < 0 ? 'var(--color-blood-glow)' : isRunning ? '#fff' : 'var(--color-bone-dim)',
                    textShadow: timeLeft < 0 ? '0 0 10px var(--color-blood-glow)' : 'none'
                  }}>
                    {formatTime(timeLeft)}
                  </div>
                )}
              </div>
            </div>

            {activeTask.intent && (
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.8rem 1.2rem', borderLeft: '3px solid var(--color-mana)', marginBottom: '1.2rem', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--color-bone)' }}>
                <b>Намерение:</b> «{activeTask.intent}»
              </div>
            )}

            {timeLeft < 0 && (
              <div className="heartbeat-pulse" style={{ 
                background: 'rgba(139, 26, 26, 0.15)', 
                border: '1px solid var(--color-blood)', 
                padding: '0.6rem 1rem', 
                color: 'var(--color-blood-glow)', 
                fontSize: '0.85rem', 
                fontFamily: 'var(--font-rpg)', 
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                ⏳ СРОК ИСТЕК! Вы получили разовый штрафной удар. Завершите все шаги, чтобы одолеть врага!
              </div>
            )}

            {/* Active Steps deconstruction */}
            <h3 className="rpg-title" style={{ fontSize: '1rem', marginBottom: '0.6rem', color: 'var(--color-bone-dim)' }}>
              🎯 Фазы прорыва к победе:
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
              {sessionSteps.length > 0 ? (
                sessionSteps.map((step) => (
                  <div 
                    key={step.id} 
                    onClick={() => {
                      if (editingStepId !== step.id) {
                        handleToggleStep(step.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: step.completed ? 'rgba(0,0,0,0.25)' : 'var(--color-iron)',
                      border: '1px solid var(--color-iron-light)',
                      opacity: step.completed ? 0.45 : 1,
                      cursor: 'pointer'
                    }}
                  >
                    {editingStepId === step.id ? (
                      <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="text" 
                          className="rpg-input" 
                          style={{ flex: 1, fontSize: '0.85rem', padding: '4px 8px', background: '#000', color: '#fff', border: '1px solid var(--color-relic)' }} 
                          value={editingStepText}
                          onChange={(e) => setEditingStepText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editingStepText.trim()) {
                              handleEditStepInCombat(step.id, editingStepText);
                              setEditingStepId(null);
                            }
                          }}
                        />
                        <button 
                          className="rpg-btn" 
                          style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: '#2ed573', color: '#2ed573' }}
                          onClick={() => {
                            handleEditStepInCombat(step.id, editingStepText);
                            setEditingStepId(null);
                          }}
                        >
                          ✓
                        </button>
                        <button 
                          className="rpg-btn" 
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => setEditingStepId(null)}
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: step.completed ? 'line-through' : 'none' }}>
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
                        
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="rpg-btn"
                            style={{ padding: '2px 6px', fontSize: '0.75rem', border: 'none', background: 'none', cursor: 'pointer' }}
                            title="Редактировать фазу"
                            onClick={() => {
                              setEditingStepId(step.id);
                              setEditingStepText(step.title);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="rpg-btn"
                            style={{ padding: '2px 6px', fontSize: '0.75rem', border: 'none', background: 'none', cursor: 'pointer' }}
                            title="Удалить фазу"
                            onClick={() => handleDeleteStepInCombat(step.id)}
                          >
                            ❌
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '1rem',
                  border: '1px dashed var(--color-bone-dim)',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  color: 'var(--color-bone-dim)',
                  fontSize: '0.85rem'
                }}>
                  🔮 Бездна расшифровывает фазы прорыва квеста...
                </div>
              )}
            </div>

            {/* Input to add step manually in combat */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                className="rpg-input"
                style={{ flex: 1, fontSize: '0.85rem', padding: '6px 10px', background: '#000', color: '#fff', border: '1px solid var(--color-iron-light)' }}
                placeholder="Призвать новую фазу прорыва..."
                value={newCombatStepText}
                onChange={(e) => setNewCombatStepText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCombatStepText.trim()) {
                    handleAddStepInCombat(newCombatStepText);
                    setNewCombatStepText('');
                  }
                }}
              />
              <button 
                className="rpg-btn"
                style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'var(--color-relic-glow)', color: 'var(--color-relic-glow)' }}
                onClick={() => {
                  if (newCombatStepText.trim()) {
                    handleAddStepInCombat(newCombatStepText);
                    setNewCombatStepText('');
                  }
                }}
              >
                + ФАЗА
              </button>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activeTask.executionMode === 'day' ? (
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(29, 185, 84, 0.1)',
                  border: '1px dashed #1db954',
                  textAlign: 'center',
                  fontFamily: 'var(--font-rpg)',
                  color: '#1db954',
                  fontSize: '0.85rem',
                  borderRadius: '4px',
                  lineHeight: '1.4'
                }}>
                  🌅 Свободный Переход (без урона и таймера). Нажимайте на фазы ниже по мере их завершения!
                </div>
              ) : (
                <button 
                  className={`rpg-btn ${isRunning ? 'rpg-btn-blood' : 'rpg-btn-mana'}`} 
                  style={{ flex: 1, fontSize: '1.1rem', padding: '0.75rem' }} 
                  onClick={toggleTimer}
                >
                  {isRunning ? "⏸ ПРИОСТАНОВИТЬ БИТВУ" : "⚔ НАЧАТЬ СХВАТКУ"}
                </button>
              )}

              <button 
                className="rpg-btn" 
                style={{ flex: 1, fontSize: '1rem', padding: '0.6rem', borderColor: 'var(--color-iron-light)', marginTop: '0.25rem' }} 
                onClick={handleRetreatToHub}
              >
                🛡️ ОТСТУПИТЬ В ШТАБ (ПАУЗА)
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
              {/* Immersive Gothic Description */}
              <div style={{ 
                fontSize: '0.78rem', 
                color: 'var(--color-bone-dim)', 
                lineHeight: '1.45', 
                fontStyle: 'italic', 
                background: 'rgba(0,0,0,0.3)', 
                borderLeft: '2px solid var(--color-blood)',
                padding: '8px 10px', 
                marginBottom: '10px',
                borderRadius: '0 4px 4px 0',
                fontFamily: 'sans-serif'
              }}>
                {activeTask.combatLore?.loreDescription || 
                  (activeTask && generateEnrichedEnemyDescription(enemyName, activeTask.title, activeTask.toxicity || 'standard', variation))}
              </div>
      <div className="weakness-insight-box">
                <div style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#ffb813', marginBottom: '3px', fontFamily: 'var(--font-rpg)' }}>
                  👁️ МЫСЛИ О СЛАБОСТИ ВРАГА:
                </div>
                {currentWeakpoint}
              </div>
            </div>

            {/* Simple ADHD-Optimized Actions Panel */}
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '1rem', 
              border: '1px solid var(--color-iron-light)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.8rem', 
              marginTop: '0.5rem',
              justifyContent: 'center',
              minHeight: '120px'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-rpg)', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '5px' }}>
                🎪 Действия путешествия:
              </div>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button 
                  className="rpg-btn" 
                  style={{ flex: 1, fontSize: '0.85rem', padding: '10px 5px', borderColor: 'var(--color-relic-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  onClick={() => { playClick(); setMeditationSelectOpen(true); }}
                >
                  🎪 ПЕРЕДЫШКА (3М)
                </button>
                <button 
                  className="rpg-btn" 
                  style={{ flex: 1, fontSize: '0.85rem', padding: '10px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} 
                  onClick={handleExtend}
                >
                  ⏳ ПРОДЛИТЬ (+10М)
                </button>
              </div>
            </div>

          </div>

        </div>

        {renderMeditationSelect()}
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
      <h2 className="gothic-title">Путешествие пусто</h2>
      <p style={{ color: 'var(--color-bone-dim)', marginTop: '0.5rem', fontStyle: 'italic' }}>
        Ваша судьба ещё засветится во мраке Абаддона, Изгнанник. Враги повержены, или вы ещё не пробудили свою стезю.
      </p>
      <button className="rpg-btn rpg-btn-blood" style={{ marginTop: '1.5rem' }} onClick={() => setSetupStage('lore')}>
        НАЧАТЬ НОВОЕ ПУТЕШЕСТВИЕ
      </button>
    </div>
  );
}
