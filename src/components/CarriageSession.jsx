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
  { type: "туман", icon: "🌫️", prefix: "Густой Туман", suffix: "Неясных Шагов", desc: "Вы не знаете с чего начать, и враг прячется в этой дымке." },
  { type: "шёпот", icon: "🗣️", prefix: "Зловещий Шёпот", suffix: "Самосаботажа", desc: "Голос в темноте, уговаривающий сделать паузу ещё до начала работы." },
  { type: "трясина", icon: "🦎", prefix: "Илистая Трясина", suffix: "Соцсетей", desc: "Липкое болото, затягивающее ваше внимание бесконечным потоком постов." },
  { type: "червь", icon: "🐛", prefix: "Некро-Червь", suffix: "Лишних Деталей", desc: "Существо, заставляющее вас полировать ненужные мелочи часами." },
  { type: "глыба", icon: "🧱", prefix: "Гранитная Глыба", suffix: "Чужих Ожиданий", desc: "Тяжёлый груз ответственности перед другими, мешающий сделать первый шаг." },
  { type: "рык", icon: "🦁", prefix: "Яростный Рык", suffix: "Синдрома Самозванца", desc: "Чудовище утверждает, что все ваши успехи — лишь случайность." },
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

export default function CarriageSession({ 
  character, 
  setCharacter, 
  tasks, 
  setTasks, 
  parseMessyTasks,
  playActiveSessionTrack,
  generateRedemptionEulogy,
  pedestals = [],
  savePedestals,
  requestTaskExecutionModeSelect,
  communeWithSpirits
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

  // Система Перерывов и НПС-Встреч (Break Events)
  const sessionElapsedRef = useRef(0);
  const lastMiniBreakRef = useRef(0);
  const lastBigBreakRef = useRef(0);
  const [breakEvent, setBreakEvent] = useState(null);
  const [breakActivityChoice, setBreakActivityChoice] = useState('breathing');
  const [breakAiText, setBreakAiText] = useState('');
  const [breakAiLoading, setBreakAiLoading] = useState(false);

  const [resolutionType, setResolutionType] = useState('victory'); // victory, flee, death
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionLoading, setResolutionLoading] = useState(false);

  const handleGenerateResolutionChronicle = async (type, task, enemy) => {
    setResolutionLoading(true);
    setResolutionText('');
    
    let prompt = '';
    if (type === 'victory') {
      prompt = `Ты — Летописец Бездны во вселенной Абаддона. Герой (класс: ${character.class}, раса: ${character.race}, ур.${character.level}) одержал великую победу в фокус-сессии над когнитивным монстром: «${enemy}» (квест: "${task?.title}"). 
Опиши в мрачном фэнтезийном стиле финальный удар героя, смерть павшего врага, гордость за победу, преодоление страха перед поражением и обретение когнитивной силы. Сделай текст воодушевляющим для человека с СДВГ. 3-4 предложения.`;
    } else if (type === 'flee') {
      prompt = `Ты — Летописец Бездны во вселенной Абаддона. Герой (класс: ${character.class}, раса: ${character.race}, ур.${character.level}) был вынужден отступить и бежать с поля боя с монстром: «${enemy}» (квест: "${task?.title}"). 
Опиши в стиле темного фэнтези горечь отступления, тени Бездны, страх поражения, но подчеркни, что это лишь тактическое отступление, передышка, и воля героя не сломлена окончательно — он вернется сильнее. 3-4 предложения.`;
    } else if (type === 'death') {
      prompt = `Ты — Летописец Бездны во вселенной Абаддона. Герой (класс: ${character.class}, раса: ${character.race}, ур.${character.level}) пал в бою с монстром: «${enemy}» (квест: "${task?.title}"). Его здоровье разума снизилось до критического минимума (10 HP).
Опиши в стиле темного фэнтези момент падения героя в грязь, холодные кандалы Бездны, торжество монстра, но укажи, что духи предков или остатки воли дают ему шанс очнуться в лагере и зализать раны. 3-4 предложения.`;
    }

    try {
      const response = await fetch('http://localhost:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) throw new Error('AI offline');
      const data = await response.json();
      setResolutionText(data.choices[0].message.content.trim());
      playSuccess();
    } catch (e) {
      const fallbacks = {
        victory: `«Враг ${enemy} пал, рассыпавшись прахом»\n\nТвоя стальная воля разорвала оковы прокрастинации. Страх перед поражением, сковывавший твои члены, рассеялся как утренний туман. Ты стоишь над телом поверженного чудовища, чувствуя гордость и прилив когнитивных сил. Битва выиграна!`,
        flee: `«Ты растворяешься в тенях Бездны, убегая от когтей ${enemy}»\n\nГоречь отступления жжет твое сердце. Но ты жив, а значит — бой не окончен. Это не поражение, а передышка. Залижи раны в лагере и возвращайся, чтобы нанести сокрушительный ответный удар.`,
        death: `«Твое зрение меркнет, ты падаешь на холодные камни»\n\n${enemy} празднует победу, пока ты лежишь без сил. Но Бездна не принимает тебя сегодня — искра жизни все еще теплится в твоей груди. Восстанови силы у костра лагеря и попытайся снова.`
      };
      setResolutionText(fallbacks[type] || fallbacks.victory);
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
      if (setupStage === 'active' && activeTask) {
        const storedTime = localStorage.getItem('combat_time_left');
        const finalTime = storedTime !== null ? Number(storedTime) : timeLeft;
        setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, timeLeft: finalTime } : t));
        localStorage.removeItem('active_task_id');
        localStorage.removeItem('combat_time_left');
        localStorage.setItem('combat_is_running', 'false');
      }
    };
  }, [setupStage, activeTask, timeLeft, setTasks]);

  // Visibility tab auto-pause
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsRunning(false);
        localStorage.setItem('combat_is_running', 'false');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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
    
    setSetupStage('resolution');
    setResolutionType('victory');
    handleGenerateResolutionChronicle('victory', task, enemyName);
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
    if (setupStage === 'active' && isRunning && timeLeft > 0 && !meditationActive && activeTask?.executionMode !== 'day') {
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
              let died = false;
              setCharacter(c => {
                const nextHp = Math.max(10, c.hp - 5);
                if (nextHp <= 10 && c.hp > 10) {
                  died = true;
                }
                return { ...c, hp: nextHp };
              });
              triggerFlash('blood');
              spawnFloater("-5 HP", "enemy-strike");
              setCombatLog(log => [
                `💥 [Враг] ${enemyName} пробивает вашу защиту и заносит удар! Вы теряете 5 HP (когнитивный ресурс).`,
                ...log.slice(0, 5)
              ]);
              if (died) {
                setIsRunning(false);
                setSetupStage('resolution');
                setResolutionType('death');
                handleGenerateResolutionChronicle('death', activeTask, enemyName);
              }
              return 0; 
            }
            return nextTicks;
          });

          return nextTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning && activeTask?.executionMode !== 'day') {
      handleWinActiveSession(activeTask);
    }
    return () => clearInterval(timer);
  }, [setupStage, isRunning, timeLeft, meditationActive, activeTask]);

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
    setBreakEvent({ type, npc });
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

    let prompt = '';
    if (npc.type === 'mirror') {
      prompt = `Ты — ${npc.name}, ${npc.prompt}. Герой (класс: ${character.class}, раса: ${character.race}, ур.${character.level}) выбрал перерыв: «${activity.label}» (в лоре: ${activity.lore}). Порицай его прокрастинацию как грех изгнанника, напомни что он мог бы избежать Бездны будь он внимательнее к себе, но дай шанс искупиться через эту активность. Жёстко но справедливо, тёмное фэнтези. 4-5 предложений.`;
    } else if (npc.type === 'provoking') {
      prompt = `Ты — ${npc.name}, ${npc.prompt}. Герой (класс: ${character.class}, ур.${character.level}) делает перерыв: «${activity.label}» (${activity.lore}). Подначь его, спровоцируй вернуться в бой после перерыва ещё сильнее. Дерзко но с уважением. Тёмное фэнтези. 3-4 предложения.`;
    } else if (npc.type === 'helping') {
      prompt = `Ты — ${npc.name}, ${npc.prompt}. Герой (класс: ${character.class}, раса: ${character.race}) делает перерыв: «${activity.label}» (${activity.lore}). Помоги практическим советом в стиле своего персонажа. Объясни пользу через метафору мира Абаддона. 3-4 предложения.`;
    } else {
      prompt = `Ты — ${npc.name}, ${npc.prompt}. Герой (класс: ${character.class}, раса: ${character.race}, ур.${character.level}) делает перерыв: «${activity.label}» (${activity.lore}). Мотивируй его, скажи мудрое и ободряющее в стиле тёмного фэнтези мира Абаддона. 3-4 предложения.`;
    }
    if (breakEvent.type === 'big') {
      prompt += ' Это БОЛЬШОЙ привал (1.5 часа работы). Опиши восстановление ран, маны, еду у костра. Подчеркни важность полноценного отдыха для когнитивного здоровья.';
    }

    try {
      const response = await fetch('http://localhost:3001/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      if (!response.ok) throw new Error('AI недоступен');
      const data = await response.json();
      setBreakAiText(data.choices[0].message.content);
      playSuccess();
    } catch (e) {
      const fallbacks = {
        mirror: `«${npc.name} смотрит сквозь тебя ледяным взглядом»\n\nТвоя слабость — не в теле, а в разуме. Ты откладывал, прятался, убегал от себя. Именно поэтому ты здесь, в Бездне. Но сейчас у тебя есть выбор: сделать ${activity.label.toLowerCase()}, и доказать что ты сильнее своих демонов.`,
        provoking: `«${npc.name} усмехается»\n\nХа! Ты думаешь, что заслужил отдых? Может быть. Но не затягивай — враги не ждут. Сделай ${activity.label.toLowerCase()} и возвращайся. Докажи, что ты не трус.`,
        helping: `«${npc.name} кивает»\n\n${activity.label} — мудрый выбор, путник. В мире Бездны даже короткий привал может спасти жизнь. Позаботься о себе, чтобы потом сражаться с удвоенной силой.`,
        motivating: `«${npc.name} улыбается»\n\nТы уже прошёл так далеко, воин. ${activity.label} — это не слабость, это мудрость. Даже величайшие герои отдыхали у костра перед решающей битвой.`
      };
      setBreakAiText(fallbacks[npc.type] || fallbacks.motivating);
    } finally {
      setBreakAiLoading(false);
    }
  };

  const handleDismissBreak = (applyRewards) => {
    playClick();
    if (applyRewards && breakEvent) {
      playSuccess();
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
    setBreakEvent(null);
    setBreakAiText('');
    setIsRunning(true);
    setAtmosphereMood(activeTask?.type === 'siege' ? 'siege' : 'hunt');
  };

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
    
    setSetupStage('resolution');
    setResolutionType('flee');
    handleGenerateResolutionChronicle('flee', activeTask, enemyName);
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

  // --- RENDERING: BREAK EVENT NPC ENCOUNTER OVERLAY ---
  if (breakEvent) {
    const isBig = breakEvent.type === 'big';
    const activities = isBig ? BIG_BREAK_ACTIVITIES : MINI_BREAK_ACTIVITIES;
    const selectedActivity = activities.find(a => a.id === breakActivityChoice) || activities[0];
    const npc = breakEvent.npc;
    const npcTypeBorder = { motivating: '#d4af37', helping: '#2ecc71', provoking: '#e74c3c', mirror: '#9b59b6' };
    const npcTypeLabel = { motivating: '💛 Мотиватор', helping: '💚 Помощник', provoking: '🔴 Провокатор', mirror: '🪞 Зеркало Истины' };
    const borderColor = npcTypeBorder[npc.type] || '#d4af37';

    return (
      <div className="break-event-overlay animate-fade-in">
        <div className="break-event-card" style={{ borderColor }}>
          {/* NPC Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', filter: `drop-shadow(0 0 15px ${borderColor})` }}>{npc.icon}</div>
            <h1 className="gothic-title" style={{ fontSize: isBig ? '1.8rem' : '1.5rem', color: borderColor, marginBottom: '0.3rem' }}>
              {isBig ? '🏕️ Большой Привал' : '🕯️ Встреча на Пути'}
            </h1>
            <h2 className="rpg-title" style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.4rem' }}>{npc.name}</h2>
            <span style={{ fontSize: '0.75rem', padding: '2px 10px', background: `${borderColor}22`, border: `1px solid ${borderColor}`, color: borderColor, fontFamily: 'var(--font-rpg)' }}>
              {npcTypeLabel[npc.type]}
            </span>
            {isBig && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', marginTop: '0.8rem', fontStyle: 'italic', maxWidth: '500px', margin: '0.8rem auto 0' }}>
                «Ты сражался 1.5 часа без остановки. Твоё тело и разум требуют полноценного восстановления. Раны, мана, усталость — всё нуждается в заботе.»
              </p>
            )}
          </div>

          {/* Activity Dropdown */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-rpg)', display: 'block', marginBottom: '0.4rem' }}>
              {isBig ? '🍽️ Выбери способ восстановления:' : '🎯 Выбери активность перерыва:'}
            </label>
            <select className="rpg-input" style={{ width: '100%', fontSize: '0.95rem', padding: '0.6rem' }} value={breakActivityChoice} onChange={(e) => setBreakActivityChoice(e.target.value)}>
              {activities.map(a => (<option key={a.id} value={a.id}>{a.label}</option>))}
            </select>
            <div style={{ fontSize: '0.7rem', color: '#8c7d6b', fontStyle: 'italic', marginTop: '4px' }}>В мире Бездны: «{selectedActivity.lore}»</div>
          </div>

          {/* AI Generate Button */}
          {!breakAiText && !breakAiLoading && (
            <button className="rpg-btn rpg-btn-mana" style={{ width: '100%', padding: '0.7rem', fontSize: '0.95rem', marginBottom: '1rem' }} onClick={handleBreakAiGenerate}>
              {npc.icon} ПРИЗВАТЬ {npc.name.toUpperCase()}
            </button>
          )}

          {/* Loading */}
          {breakAiLoading && (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <RefreshCw className="heartbeat-pulse fast" style={{ color: borderColor, marginBottom: '0.5rem' }} size={28} />
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-bone-dim)' }}>{npc.name} приближается из тумана Бездны...</p>
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
              ✅ {isBig ? 'ЗАВЕРШИТЬ ПРИВАЛ' : 'ВЫПОЛНЕНО — В БОЙ'}
            </button>
            <button className="rpg-btn rpg-btn-blood" style={{ padding: '0.7rem', fontSize: '0.8rem' }} onClick={() => handleDismissBreak(false)}>
              ⏭️ Пропустить
            </button>
          </div>

          {/* Rewards Preview */}
          <div style={{ marginTop: '0.8rem', fontSize: '0.7rem', color: 'var(--color-bone-dim)', textAlign: 'center', borderTop: '1px solid var(--color-iron-light)', paddingTop: '0.6rem' }}>
            Награда за выполнение: {isBig ? '❤️+20 HP, 🔮+15 MP, ⚡-30мин усталости' : '❤️+8 HP, 🔮+5 MP, ⚡-10мин усталости'}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING: BATTLE RESOLUTION SCREEN ---
  if (setupStage === 'resolution') {
    const isVictory = resolutionType === 'victory';
    const isFlee = resolutionType === 'flee';
    const isDeath = resolutionType === 'death';
    const borderColor = isVictory ? '#d4af37' : isFlee ? '#8c7d6b' : '#ff0000';
    const title = isVictory ? '🏆 Триумф Воли' : isFlee ? '🌫️ Бегство в Тени' : '💀 Падение Изгнанника';

    return (
      <div className="break-event-overlay animate-fade-in">
        <div className="break-event-card" style={{ borderColor, maxWidth: '650px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '3.5rem' }}>{isVictory ? '🏆' : isFlee ? '🌫️' : '💀'}</span>
            <h1 className="gothic-title" style={{ fontSize: '2.2rem', color: borderColor, marginTop: '0.5rem' }}>{title}</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', fontStyle: 'italic', marginTop: '0.3rem' }}>
              Хроники Абаддона • Запись Летописца
            </p>
          </div>

          {resolutionLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <RefreshCw className="heartbeat-pulse fast" style={{ color: borderColor, marginBottom: '0.8rem' }} size={32} />
              <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--color-bone-dim)' }}>
                Летописец Бездны записывает исход битвы в фолиант...
              </p>
            </div>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${borderColor}44`, borderLeft: `3px solid ${borderColor}`, padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
              <p style={{ fontSize: '1rem', color: '#e6dfd3', lineHeight: '1.7', fontFamily: 'Georgia, serif', whiteSpace: 'pre-line', textAlign: 'justify' }}>
                {resolutionText}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              className="rpg-btn" 
              style={{ padding: '0.8rem 2.5rem', fontSize: '1rem', borderColor }}
              onClick={() => {
                playClick();
                // Check if user qualifies for legacy redemption ceremony
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
              {isVictory ? '☀️ ВЕРНУТЬСЯ В ШТАБ' : isFlee ? '⛺ УЙТИ В ЛАГЕРЬ' : '🔥 ВОССТАТЬ ИЗ ПЕПЛА'}
            </button>
          </div>
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
              className="rpg-btn rpg-btn-mana" 
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 0 8px rgba(0, 191, 255, 0.3)' }}
              onClick={communeWithSpirits}
            >
              🧿 Обратиться к духам (Совет ИИ)
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.25rem' }}>{variation.icon}</span>
                      <h4 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold', margin: 0 }}>{task.title}</h4>
                      
                      <span style={{ 
                        fontSize: '0.65rem', 
                        color: task.nature === 'internal' ? '#4fc3f7' : '#ff8a80', 
                        background: 'rgba(0,0,0,0.4)', 
                        padding: '1px 5px', 
                        borderRadius: '3px',
                        border: `1px solid ${task.nature === 'internal' ? 'rgba(79, 195, 247, 0.25)' : 'rgba(255, 138, 128, 0.25)'}` 
                      }}>
                        {task.nature === 'internal' ? '🧿 Внутренний Обет' : '⚔️ Внешняя Схватка'}
                        {task.combatLore?.visualType ? ` (${task.combatLore.visualType})` : ''}
                      </span>
                      {task.executionMode && task.executionMode !== 'ask_later' && (
                        <span style={{
                          fontSize: '0.65rem',
                          color: 'var(--color-bone-dim)',
                          background: 'rgba(0,0,0,0.4)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          {task.executionMode === 'timer' ? '⏳ Таймер' : '🌅 В течение дня'}
                        </span>
                      )}
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
                      const runStart = (mode) => {
                        setActiveTask(task);
                        const initialTime = task.timeLeft !== undefined ? task.timeLeft : task.pomodoroTime * 60;
                        setTimeLeft(initialTime);
                        setSessionSteps(task.steps || []);
                        setSetupStage('active');
                        generateCombatEncounter(task);
                        localStorage.setItem('active_task_id', task.id);
                        localStorage.setItem('combat_time_left', initialTime);
                        localStorage.setItem('combat_is_running', mode === 'timer' ? 'true' : 'false');
                        setIsRunning(mode === 'timer');
                        setAtmosphereMood(task.type === 'siege' ? 'siege' : 'hunt');
                        if (playActiveSessionTrack) playActiveSessionTrack(task.type === 'siege' ? 'siege' : 'hunt');
                      };

                      if (!task.executionMode || task.executionMode === 'ask_later') {
                        requestTaskExecutionModeSelect(task, (chosenMode) => {
                          runStart(chosenMode);
                        });
                      } else {
                        runStart(task.executionMode);
                      }
                    }}
                  >
                    {task.timeLeft !== undefined ? `⚔️ ВОЗОБНОВИТЬ БОЙ (${Math.ceil(task.timeLeft / 60)} мин)` : '⚔️ ВСТУПИТЬ В БОЙ'}
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
                {activeTask.executionMode === 'day' ? (
                  <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-rpg)', color: '#1db954', border: '1px solid rgba(29,185,84,0.3)', padding: '4px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                    🌅 СВОБОДНЫЙ ПЕРЕХОД
                  </div>
                ) : (
                  <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-rpg)', color: isRunning ? '#fff' : 'var(--color-bone-dim)' }}>
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
                  {/* Multiclass Skills */}
                  {character.class.includes("огня и камня") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Лавовая струя", "mana", 12, 30, "fire")}>
                        <span>🌋 Лавовая струя</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>12 MP • 30 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Метеоритный барьер", "mana", 9, 22, "stone")}>
                        <span>🪨 Метеоритный барьер</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>9 MP • 22 Урона</span>
                      </button>
                    </>
                  )}

                  {character.class.includes("молнии и земли") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Сейсмический шок", "mana", 13, 32, "earth")}>
                        <span>⚡ Сейсмический шок</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>13 MP • 32 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Грозовой щит", "mana", 8, 18, "lightning")}>
                        <span>🛡️ Грозовой щит</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 18 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 1. Fire Mage Skills */}
                  {character.class.includes("огня") && !character.class.includes("Мультикласс") && (
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
                  {character.class.includes("земли") && !character.class.includes("Мультикласс") && (
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
                  {character.class.includes("камня") && !character.class.includes("Мультикласс") && (
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

                  {/* 3.5. Lightning Mage Skills */}
                  {character.class.includes("молнии") && !character.class.includes("Мультикласс") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#00ffff' }} onClick={() => castClassSkill("Грозовой разряд", "mana", 11, 26, "lightning")}>
                        <span>⚡ Грозовой разряд</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>11 MP • 26 Урона</span>
                      </button>
                      <button className="skill-btn" style={{ borderColor: '#00ffff' }} onClick={() => castClassSkill("Цепная молния", "mana", 15, 35, "lightning")}>
                        <span>🌀 Цепная молния</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>15 MP • 35 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 4. Necromancer Skills */}
                  {character.class.includes("Некромант") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Воскрешение зомби", "mana", 12, 35, "earth")}>
                        <span>🧟 Воскрешение зомби</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>12 MP • 35 Урона</span>
                      </button>
                      <button className="skill-btn blood" onClick={() => castClassSkill("Магия тьмы", "hp", 10, 25, "shiver")}>
                        <span>🌑 Магия тьмы (Стрела)</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 HP • 25 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 4.5. Light Mage Skills */}
                  {character.class.includes("света") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#ffd700' }} onClick={() => castClassSkill("Вспышка озарения", "mana", 10, 24, "heal")}>
                        <span>☀️ Вспышка озарения</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 MP • 24 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Световой барьер", "mana", 7, 15, "stone")}>
                        <span>🛡️ Световой барьер</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>7 MP • 15 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 4.6. Dark Mage Skills */}
                  {character.class.includes("тьмы") && !character.class.includes("Некромант") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#4b0082' }} onClick={() => castClassSkill("Сгущение тьмы", "mana", 11, 26, "shiver")}>
                        <span>🌑 Сгущение тьмы</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>11 MP • 26 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Покров теней", "mana", 7, 16, "shiver")}>
                        <span>👥 Покров теней</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>7 MP • 16 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 4.7. Abyss Mage Skills */}
                  {character.class.includes("бездны") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#8a2be2' }} onClick={() => castClassSkill("Зов Бездны", "mana", 14, 33, "shiver")}>
                        <span>🕳️ Зов Бездны</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>14 MP • 33 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Щит Забвения", "mana", 8, 18, "stone")}>
                        <span>🛡️ Щит Забвения</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 18 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 4.8. Mark Mage Skills */}
                  {character.class.includes("меток") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#ff007f' }} onClick={() => castClassSkill("Метка слабости", "mana", 10, 22, "lightning")}>
                        <span>🎯 Метка слабости</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 MP • 22 Урона</span>
                      </button>
                      <button className="skill-btn" style={{ borderColor: '#ff007f' }} onClick={() => castClassSkill("Печать отсечения", "mana", 12, 28, "fire")}>
                        <span>💮 Печать отсечения</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>12 MP • 28 Урона</span>
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

                  {/* 6. Knight Subclasses Skills */}
                  {character.class.includes("Дикий Рыцарь") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#e25822' }} onClick={() => castClassSkill("Ярость зверя", "mana", 8, 22, "fire")}>
                        <span>🐺 Ярость зверя</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 22 Урона</span>
                      </button>
                      <button className="skill-btn blood" onClick={() => castClassSkill("Удар топора", "hp", 10, 30, "blood")}>
                        <span>🪓 Удар топора</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 HP • 30 Урона</span>
                      </button>
                    </>
                  )}

                  {character.class.includes("Наемник Военной Банды") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Круговой замах", "mana", 10, 26, "fire")}>
                        <span>⚔️ Круговой замах</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 MP • 26 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Боевой клич", "mana", 8, 18, "stone")}>
                        <span>📢 Боевой клич</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 18 Урона</span>
                      </button>
                    </>
                  )}

                  {character.class.includes("Бывший Рыцарь") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#d4af37' }} onClick={() => castClassSkill("Забытая присяга", "mana", 12, 28, "heal")}>
                        <span>🛡️ Забытая присяга</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>12 MP • 28 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Парирование клинком", "mana", 6, 14, "stone")}>
                        <span>⚔️ Парирование</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>6 MP • 14 Урона</span>
                      </button>
                    </>
                  )}

                  {character.class.includes("Рыцарь-Убийца") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#8b0000' }} onClick={() => castClassSkill("Смертельный выпад", "mana", 10, 30, "blood")}>
                        <span>🗡️ Смертельный выпад</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 MP • 30 Урона</span>
                      </button>
                      <button className="skill-btn" style={{ borderColor: '#228b22' }} onClick={() => castClassSkill("Яд на лезвии", "mana", 8, 20, "stone")}>
                        <span>🧪 Яд на лезвии</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 20 Урона</span>
                      </button>
                    </>
                  )}

                  {/* New Grim-Dark Subclass Skills */}
                  {character.class.includes("Мятежник Изгоев (Бандит)") && (
                    <>
                      <button className="skill-btn special" onClick={() => castClassSkill("Нож в спину", "mana", 8, 24, "shiver")}>
                        <span>🗡️ Нож в спину</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 24 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Коварная уловка", "mana", 6, 16, "stone")}>
                        <span>🎭 Коварная уловка</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>6 MP • 16 Урона</span>
                      </button>
                    </>
                  )}

                  {character.class.includes("Головорез Чумных Земель (Бандит)") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#228b22' }} onClick={() => castClassSkill("Чумной клинок", "mana", 10, 28, "stone")}>
                        <span>🤢 Чумной клинок</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 MP • 28 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Грабёж допамина", "mana", 8, 20, "fire")}>
                        <span>💰 Грабёж допамина</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 20 Урона</span>
                      </button>
                    </>
                  )}

                  {character.class.includes("Каратель Багрового Ордена") && (
                    <>
                      <button className="skill-btn blood" onClick={() => castClassSkill("Багровый допрос", "hp", 12, 36, "blood")}>
                        <span>🩸 Багровый допрос</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>12 HP • 36 Урона</span>
                      </button>
                      <button className="skill-btn special" onClick={() => castClassSkill("Священная плеть", "mana", 10, 26, "fire")}>
                        <span>📿 Священная плеть</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 MP • 26 Урона</span>
                      </button>
                    </>
                  )}

                  {character.class.includes("Храмовник Пепла") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#8c7d6b' }} onClick={() => castClassSkill("Карающий пепел", "mana", 10, 28, "fire")}>
                        <span>💨 Карающий пепел</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 MP • 28 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Завеса пепла", "mana", 8, 22, "stone")}>
                        <span>🌫️ Завеса пепла</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 22 Урона</span>
                      </button>
                    </>
                  )}

                  {character.class.includes("Рыцарь Чумной Стали") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#556b2f' }} onClick={() => castClassSkill("Ржавый замах", "mana", 12, 30, "stone")}>
                        <span>🛡️ Ржавый замах</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>12 MP • 30 Урона</span>
                      </button>
                      <button className="skill-btn" onClick={() => castClassSkill("Сгнивший барьер", "mana", 8, 20, "stone")}>
                        <span>🏚️ Сгнивший барьер</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 20 Урона</span>
                      </button>
                    </>
                  )}

                  {character.class.includes("Отреченный Паладин") && (
                    <>
                      <button className="skill-btn blood" onClick={() => castClassSkill("Оскверненная клятва", "hp", 10, 32, "blood")}>
                        <span>🩸 Оскверненная клятва</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 HP • 32 Урона</span>
                      </button>
                      <button className="skill-btn special" onClick={() => castClassSkill("Слепое неистовство", "mana", 12, 32, "fire")}>
                        <span>🔥 Слепое неистовство</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>12 MP • 32 Урона</span>
                      </button>
                    </>
                  )}

                  {character.class.includes("меча") && !character.class.includes("Рыцарь-") && (
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

                  {/* 8. Plasmamancer (Ether Weaver) Skills */}
                  {character.class.includes("Плазмомансер") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#ff00ff' }} onClick={() => castClassSkill("Клинки эфира (Ближний бой)", "mana", 10, 32, "shiver")}>
                        <span>⚔️ Клинки эфира (Ближний)</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>10 MP • 32 Урона</span>
                      </button>
                      <button className="skill-btn" style={{ borderColor: '#ff00ff' }} onClick={() => castClassSkill("Искажение пространства (Mid-range)", "mana", 8, 22, "shiver")}>
                        <span>🌀 Искажение (Mid-range)</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 MP • 22 Урона</span>
                      </button>
                    </>
                  )}

                  {/* 9. Mental Sovereign (Psi-Telekinetic) Skills */}
                  {character.class.includes("Ментальный Суверен") && (
                    <>
                      <button className="skill-btn special" style={{ borderColor: '#da70d6' }} onClick={() => castClassSkill("Разрыв головы словом", "mana", 12, 35, "shiver")}>
                        <span>🗣️ Разрыв головы</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>12 MP • 35 Урона</span>
                      </button>
                      <button className="skill-btn" style={{ borderColor: '#da70d6' }} onClick={() => castClassSkill("Телекинетический щит", "mana", 7, 18, "stone")}>
                        <span>🛡️ Телекинез-отражение</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>7 MP • 18 Урона</span>
                      </button>
                      <button className="skill-btn special" style={{ borderColor: '#da70d6' }} onClick={() => castClassSkill("Подчинение воли", "mana", 15, 45, "shiver")}>
                        <span>👁️ Подчинение воли</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>15 MP • 45 Урона</span>
                      </button>
                    </>
                  )}

                  {/* Fallback generic skills if none match */}
                  {!character.class.includes("огня") && !character.class.includes("земли") && !character.class.includes("камня") && !character.class.includes("молнии") && !character.class.includes("Некромант") && !character.class.includes("Рунный") && !character.class.includes("меча") && !character.class.includes("Рыцарь") && !character.class.includes("Наемник") && !character.class.includes("Химомансер") && !character.class.includes("Плазмомансер") && !character.class.includes("света") && !character.class.includes("тьмы") && !character.class.includes("бездны") && !character.class.includes("меток") && !character.class.includes("Ментальный") && (
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
