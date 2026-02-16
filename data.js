// ============================================
// Database & Data Layer - Doctor Clinic Platform
// ============================================

const DB = {
  KEY_USERS: 'clinic_users',
  KEY_TASKS: 'clinic_tasks',
  KEY_NEWS: 'clinic_news',
  KEY_KB: 'clinic_knowledge_base',
  KEY_SESSION: 'clinic_session',
  KEY_TRANSACTIONS: 'clinic_transactions',

  // Access Levels
  ROLES: {
    ADMIN: 'admin',
    HEAD_DOCTOR: 'head_doctor',
    DOCTOR: 'doctor',
    INTERN: 'intern'
  },

  ROLE_LABELS: {
    admin: 'Администратор',
    head_doctor: 'Главный врач',
    doctor: 'Врач',
    intern: 'Интерн'
  },

  ROLE_PERMISSIONS: {
    admin: ['view_dashboard', 'manage_users', 'manage_tasks', 'manage_news', 'manage_kb', 'view_all_ratings', 'assign_coins', 'create_tasks', 'edit_tasks', 'delete_tasks', 'create_news', 'edit_news', 'delete_news', 'create_kb', 'edit_kb', 'delete_kb'],
    head_doctor: ['view_dashboard', 'manage_tasks', 'view_all_ratings', 'create_tasks', 'edit_tasks', 'create_news', 'edit_news', 'create_kb', 'edit_kb', 'assign_coins'],
    doctor: ['view_dashboard', 'take_tasks', 'view_own_rating', 'view_kb', 'view_news'],
    intern: ['view_dashboard', 'view_kb', 'view_news', 'view_own_rating']
  },

  // Task categories
  TASK_CATEGORIES: {
    CONSULTATION: 'consultation',
    RESEARCH: 'research',
    TRAINING: 'training',
    MENTORING: 'mentoring',
    DOCUMENTATION: 'documentation',
    EMERGENCY: 'emergency'
  },

  TASK_CATEGORY_LABELS: {
    consultation: 'Консультация',
    research: 'Исследование',
    training: 'Обучение',
    mentoring: 'Наставничество',
    documentation: 'Документация',
    emergency: 'Экстренная помощь'
  },

  TASK_STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    COMPLETED: 'completed'
  },

  TASK_STATUS_LABELS: {
    open: 'Открыта',
    in_progress: 'В работе',
    review: 'На проверке',
    completed: 'Завершена'
  },

  // Knowledge base categories
  KB_CATEGORIES: {
    PROTOCOLS: 'protocols',
    GUIDELINES: 'guidelines',
    RESEARCH: 'research',
    TRAINING: 'training_materials',
    FAQ: 'faq'
  },

  KB_CATEGORY_LABELS: {
    protocols: 'Протоколы лечения',
    guidelines: 'Руководства',
    research: 'Исследования',
    training_materials: 'Учебные материалы',
    faq: 'Часто задаваемые вопросы'
  },

  // Initialize default data
  init() {
    if (!localStorage.getItem(this.KEY_USERS)) {
      const defaultUsers = [
        {
          id: 'u1',
          login: 'admin',
          password: 'admin123',
          name: 'Иванов Сергей Петрович',
          role: 'admin',
          specialty: 'Администрация',
          coins: 0,
          rating: 0,
          tasksCompleted: 0,
          avatar: null,
          createdAt: '2025-01-15'
        },
        {
          id: 'u2',
          login: 'head',
          password: 'head123',
          name: 'Петрова Анна Михайловна',
          role: 'head_doctor',
          specialty: 'Кардиология',
          coins: 500,
          rating: 4.8,
          tasksCompleted: 45,
          avatar: null,
          createdAt: '2025-01-20'
        },
        {
          id: 'u3',
          login: 'doctor',
          password: 'doctor123',
          name: 'Сидоров Алексей Николаевич',
          role: 'doctor',
          specialty: 'Терапия',
          coins: 320,
          rating: 4.5,
          tasksCompleted: 28,
          avatar: null,
          createdAt: '2025-02-01'
        },
        {
          id: 'u4',
          login: 'doctor2',
          password: 'doctor123',
          name: 'Козлова Мария Ивановна',
          role: 'doctor',
          specialty: 'Неврология',
          coins: 180,
          rating: 4.2,
          tasksCompleted: 15,
          avatar: null,
          createdAt: '2025-02-10'
        },
        {
          id: 'u5',
          login: 'intern',
          password: 'intern123',
          name: 'Новиков Дмитрий Александрович',
          role: 'intern',
          specialty: 'Хирургия',
          coins: 50,
          rating: 3.8,
          tasksCompleted: 5,
          avatar: null,
          createdAt: '2025-03-01'
        }
      ];
      localStorage.setItem(this.KEY_USERS, JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem(this.KEY_TASKS)) {
      const defaultTasks = [
        {
          id: 't1',
          title: 'Провести консультацию пациента с гипертонией',
          description: 'Необходимо провести первичную консультацию пациента, назначить обследования и составить план лечения. Включает измерение АД, сбор анамнеза и выдачу рекомендаций.',
          category: 'consultation',
          reward: 50,
          status: 'open',
          priority: 'high',
          assignedTo: null,
          createdBy: 'u2',
          createdAt: '2026-02-10',
          deadline: '2026-02-20',
          completedAt: null
        },
        {
          id: 't2',
          title: 'Подготовить отчёт по клиническим исследованиям',
          description: 'Составить сводный отчёт по результатам клинических исследований за последний квартал. Включить статистику, выводы и рекомендации по улучшению протоколов.',
          category: 'research',
          reward: 120,
          status: 'open',
          priority: 'medium',
          assignedTo: null,
          createdBy: 'u1',
          createdAt: '2026-02-08',
          deadline: '2026-02-28',
          completedAt: null
        },
        {
          id: 't3',
          title: 'Провести обучение интернов по УЗИ-диагностике',
          description: 'Организовать и провести практическое занятие для интернов по основам ультразвуковой диагностики. Подготовить материалы и провести тестирование.',
          category: 'training',
          reward: 80,
          status: 'in_progress',
          priority: 'medium',
          assignedTo: 'u3',
          createdBy: 'u2',
          createdAt: '2026-02-05',
          deadline: '2026-02-18',
          completedAt: null
        },
        {
          id: 't4',
          title: 'Наставничество нового врача в отделении',
          description: 'Курировать работу нового врача в течение недели: помощь с пациентами, объяснение внутренних процессов, контроль качества.',
          category: 'mentoring',
          reward: 100,
          status: 'open',
          priority: 'low',
          assignedTo: null,
          createdBy: 'u2',
          createdAt: '2026-02-12',
          deadline: '2026-03-01',
          completedAt: null
        },
        {
          id: 't5',
          title: 'Обновить протокол лечения ОРВИ',
          description: 'Актуализировать клинический протокол лечения ОРВИ в соответствии с последними рекомендациями Минздрава. Согласовать с заведующим.',
          category: 'documentation',
          reward: 70,
          status: 'open',
          priority: 'high',
          assignedTo: null,
          createdBy: 'u1',
          createdAt: '2026-02-14',
          deadline: '2026-02-25',
          completedAt: null
        },
        {
          id: 't6',
          title: 'Дежурство в приёмном отделении',
          description: 'Экстренное дежурство в приёмном отделении в выходные. Приём и первичная сортировка пациентов.',
          category: 'emergency',
          reward: 200,
          status: 'open',
          priority: 'high',
          assignedTo: null,
          createdBy: 'u1',
          createdAt: '2026-02-15',
          deadline: '2026-02-17',
          completedAt: null
        },
        {
          id: 't7',
          title: 'Анализ эффективности нового препарата',
          description: 'Провести ретроспективный анализ эффективности нового кардиопрепарата на основе данных пациентов за 3 месяца.',
          category: 'research',
          reward: 150,
          status: 'completed',
          priority: 'medium',
          assignedTo: 'u3',
          createdBy: 'u2',
          createdAt: '2026-01-15',
          deadline: '2026-02-15',
          completedAt: '2026-02-13'
        }
      ];
      localStorage.setItem(this.KEY_TASKS, JSON.stringify(defaultTasks));
    }

    if (!localStorage.getItem(this.KEY_NEWS)) {
      const defaultNews = [
        {
          id: 'n1',
          title: 'Открытие нового диагностического центра',
          content: 'С радостью сообщаем об открытии нового диагностического центра на базе нашей клиники. Центр оснащён современным оборудованием: МРТ нового поколения, КТ с низкой дозой облучения и полный комплект для функциональной диагностики.\n\nВсе врачи могут направлять пациентов на обследования. Запись через внутреннюю систему.',
          category: 'announcement',
          author: 'u1',
          createdAt: '2026-02-15',
          pinned: true
        },
        {
          id: 'n2',
          title: 'Обновлены клинические рекомендации по лечению диабета 2 типа',
          content: 'Минздрав выпустил обновлённые клинические рекомендации по лечению сахарного диабета 2 типа. Основные изменения:\n\n• Пересмотрены целевые показатели HbA1c для разных возрастных групп\n• Добавлены новые классы препаратов в первую линию терапии\n• Обновлены алгоритмы скрининга осложнений\n\nВсем врачам рекомендуется ознакомиться с полным текстом в базе знаний.',
          category: 'medical',
          author: 'u2',
          createdAt: '2026-02-13',
          pinned: false
        },
        {
          id: 'n3',
          title: 'Итоги программы Ист Коинов за январь',
          content: 'Подводим итоги программы мотивации за январь 2026:\n\n• Всего выполнено задач: 127\n• Лидер месяца: Сидоров А.Н. — 28 задач, 1200 Ист Коинов\n• Средний рейтинг врачей: 4.3\n\nНапоминаем, что Ист Коины можно обменять на дополнительные дни отпуска, оплату конференций и курсов повышения квалификации.',
          category: 'achievement',
          author: 'u1',
          createdAt: '2026-02-01',
          pinned: false
        },
        {
          id: 'n4',
          title: 'Конференция по нейрохирургии — регистрация открыта',
          content: 'Открыта регистрация на ежегодную конференцию по нейрохирургии, которая пройдёт 15-17 марта 2026 года. Участие можно оплатить Ист Коинами (стоимость: 300 коинов).\n\nПрограмма включает мастер-классы, доклады ведущих специалистов и практические сессии.',
          category: 'event',
          author: 'u2',
          createdAt: '2026-02-10',
          pinned: false
        }
      ];
      localStorage.setItem(this.KEY_NEWS, JSON.stringify(defaultNews));
    }

    if (!localStorage.getItem(this.KEY_KB)) {
      const defaultKB = [
        {
          id: 'kb1',
          title: 'Протокол лечения артериальной гипертензии',
          content: '## Цель\nДостижение и поддержание целевых показателей артериального давления.\n\n## Целевые показатели\n- Общая популяция: < 140/90 мм рт.ст.\n- Пациенты с СД: < 130/80 мм рт.ст.\n- Пожилые пациенты (>80 лет): < 150/90 мм рт.ст.\n\n## Первая линия терапии\n1. Ингибиторы АПФ (Эналаприл, Лизиноприл)\n2. Блокаторы рецепторов ангиотензина (Лозартан, Валсартан)\n3. Блокаторы кальциевых каналов (Амлодипин)\n4. Тиазидные диуретики (Гидрохлортиазид)\n\n## Мониторинг\n- Контроль АД каждые 2 недели до достижения цели\n- Биохимия крови через 2 недели после начала терапии\n- Далее — контроль каждые 3 месяца',
          category: 'protocols',
          author: 'u2',
          createdAt: '2026-01-10',
          updatedAt: '2026-02-05',
          tags: ['кардиология', 'гипертензия', 'протокол']
        },
        {
          id: 'kb2',
          title: 'Руководство по экстренной помощи при анафилаксии',
          content: '## Диагностика\nАнафилаксия — острая системная аллергическая реакция. Признаки:\n- Крапивница, отёк Квинке\n- Бронхоспазм, стридор\n- Гипотензия, тахикардия\n- Тошнота, боли в животе\n\n## Алгоритм действий\n1. **Немедленно**: Адреналин 0.3-0.5 мг в/м в переднюю поверхность бедра\n2. Уложить пациента, приподнять ноги\n3. Обеспечить проходимость дыхательных путей\n4. В/в доступ, инфузия NaCl 0.9%\n5. При бронхоспазме — Сальбутамол ингаляционно\n6. Преднизолон 90-120 мг в/в\n7. Наблюдение минимум 24 часа\n\n## Важно\n- Повторная доза адреналина через 5-15 минут при отсутствии эффекта\n- Обязательно направить к аллергологу после выписки',
          category: 'guidelines',
          author: 'u2',
          createdAt: '2026-01-15',
          updatedAt: '2026-01-15',
          tags: ['экстренная помощь', 'анафилаксия', 'аллергология']
        },
        {
          id: 'kb3',
          title: 'Методы современной диагностики в кардиологии',
          content: '## Обзор\nСовременная кардиологическая диагностика включает широкий спектр инструментальных и лабораторных методов.\n\n## Инструментальные методы\n### ЭКГ\n- Стандартная 12-канальная ЭКГ\n- Холтеровское мониторирование (24-72 часа)\n- Стресс-тест\n\n### Эхокардиография\n- Трансторакальная ЭхоКГ\n- Чреспищеводная ЭхоКГ\n- Стресс-ЭхоКГ\n\n### Визуализация\n- КТ-коронарография\n- МРТ сердца\n- Сцинтиграфия миокарда\n\n## Лабораторная диагностика\n- Тропонин I/T — маркер повреждения миокарда\n- BNP/NT-proBNP — маркер сердечной недостаточности\n- Липидный профиль\n- Коагулограмма',
          category: 'research',
          author: 'u3',
          createdAt: '2026-02-01',
          updatedAt: '2026-02-10',
          tags: ['кардиология', 'диагностика', 'исследования']
        },
        {
          id: 'kb4',
          title: 'Основы УЗИ-диагностики для начинающих',
          content: '## Введение\nУльтразвуковая диагностика — неинвазивный метод визуализации внутренних органов.\n\n## Физические основы\n- Частота: 2-18 МГц\n- Принцип: отражение ультразвуковых волн от тканей\n- Разрешение зависит от частоты датчика\n\n## Типы датчиков\n1. **Конвексный** — органы брюшной полости\n2. **Линейный** — поверхностные структуры, сосуды\n3. **Секторный** — сердце (ЭхоКГ)\n4. **Эндокавитарный** — гинекология, урология\n\n## Стандартные протоколы\n- УЗИ брюшной полости: натощак, 6-8 часов голода\n- УЗИ почек: без специальной подготовки\n- УЗИ мочевого пузыря: наполненный мочевой пузырь\n- УЗИ щитовидной железы: без подготовки',
          category: 'training_materials',
          author: 'u2',
          createdAt: '2026-01-20',
          updatedAt: '2026-01-25',
          tags: ['УЗИ', 'обучение', 'диагностика']
        },
        {
          id: 'kb5',
          title: 'FAQ: Частые вопросы по работе платформы',
          content: '## Как заработать Ист Коины?\nВыполняйте задачи из раздела «Задачи». Каждая задача имеет указанную награду в Ист Коинах.\n\n## На что можно потратить Ист Коины?\n- Дополнительные дни отпуска (500 коинов = 1 день)\n- Оплата конференций и обучения\n- Премиальные бонусы\n- Приоритет в выборе графика\n\n## Как повысить свой рейтинг?\n- Выполняйте задачи качественно и в срок\n- Участвуйте в наставничестве\n- Публикуйте материалы в базе знаний\n- Получайте положительные отзывы от коллег\n\n## Уровни доступа\n- **Интерн**: просмотр базы знаний и новостей\n- **Врач**: выполнение задач, заработок коинов\n- **Главный врач**: создание задач, управление контентом\n- **Администратор**: полный доступ ко всем функциям',
          category: 'faq',
          author: 'u1',
          createdAt: '2026-01-05',
          updatedAt: '2026-02-14',
          tags: ['FAQ', 'платформа', 'Ист Коины']
        }
      ];
      localStorage.setItem(this.KEY_KB, JSON.stringify(defaultKB));
    }

    if (!localStorage.getItem(this.KEY_TRANSACTIONS)) {
      const defaultTransactions = [
        { id: 'tr1', userId: 'u3', amount: 150, type: 'earned', description: 'Анализ эффективности нового препарата', taskId: 't7', date: '2026-02-13' },
        { id: 'tr2', userId: 'u3', amount: 80, type: 'earned', description: 'Обучение интернов', taskId: 't3', date: '2026-02-06' },
        { id: 'tr3', userId: 'u4', amount: 50, type: 'earned', description: 'Консультация пациента', taskId: null, date: '2026-02-08' },
        { id: 'tr4', userId: 'u3', amount: -300, type: 'spent', description: 'Оплата конференции по кардиологии', taskId: null, date: '2026-01-20' },
        { id: 'tr5', userId: 'u2', amount: 200, type: 'earned', description: 'Экстренное дежурство', taskId: null, date: '2026-01-28' }
      ];
      localStorage.setItem(this.KEY_TRANSACTIONS, JSON.stringify(defaultTransactions));
    }
  },

  // CRUD helpers
  getAll(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // User methods
  getUsers() { return this.getAll(this.KEY_USERS); },
  getUserById(id) { return this.getUsers().find(u => u.id === id); },

  updateUser(id, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.save(this.KEY_USERS, users);
      return users[idx];
    }
    return null;
  },

  addUser(user) {
    const users = this.getUsers();
    user.id = 'u' + Date.now();
    users.push(user);
    this.save(this.KEY_USERS, users);
    return user;
  },

  // Task methods
  getTasks() { return this.getAll(this.KEY_TASKS); },
  getTaskById(id) { return this.getTasks().find(t => t.id === id); },

  updateTask(id, updates) {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...updates };
      this.save(this.KEY_TASKS, tasks);
      return tasks[idx];
    }
    return null;
  },

  addTask(task) {
    const tasks = this.getTasks();
    task.id = 't' + Date.now();
    tasks.push(task);
    this.save(this.KEY_TASKS, tasks);
    return task;
  },

  deleteTask(id) {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.save(this.KEY_TASKS, tasks);
  },

  // News methods
  getNews() { return this.getAll(this.KEY_NEWS); },
  addNews(article) {
    const news = this.getNews();
    article.id = 'n' + Date.now();
    news.unshift(article);
    this.save(this.KEY_NEWS, news);
    return article;
  },
  deleteNews(id) {
    const news = this.getNews().filter(n => n.id !== id);
    this.save(this.KEY_NEWS, news);
  },

  // Knowledge base methods
  getKB() { return this.getAll(this.KEY_KB); },
  addKBArticle(article) {
    const kb = this.getKB();
    article.id = 'kb' + Date.now();
    kb.push(article);
    this.save(this.KEY_KB, kb);
    return article;
  },
  updateKBArticle(id, updates) {
    const kb = this.getKB();
    const idx = kb.findIndex(a => a.id === id);
    if (idx !== -1) {
      kb[idx] = { ...kb[idx], ...updates };
      this.save(this.KEY_KB, kb);
      return kb[idx];
    }
    return null;
  },
  deleteKBArticle(id) {
    const kb = this.getKB().filter(a => a.id !== id);
    this.save(this.KEY_KB, kb);
  },

  // Transaction methods
  getTransactions() { return this.getAll(this.KEY_TRANSACTIONS); },
  getUserTransactions(userId) { return this.getTransactions().filter(t => t.userId === userId); },
  addTransaction(transaction) {
    const transactions = this.getTransactions();
    transaction.id = 'tr' + Date.now();
    transactions.unshift(transaction);
    this.save(this.KEY_TRANSACTIONS, transactions);
    return transaction;
  },

  // Auth methods
  login(login, password) {
    const user = this.getUsers().find(u => u.login === login && u.password === password);
    if (user) {
      const session = { userId: user.id, loginAt: new Date().toISOString() };
      localStorage.setItem(this.KEY_SESSION, JSON.stringify(session));
      return user;
    }
    return null;
  },

  logout() {
    localStorage.removeItem(this.KEY_SESSION);
  },

  getCurrentUser() {
    const session = JSON.parse(localStorage.getItem(this.KEY_SESSION) || 'null');
    if (session) {
      return this.getUserById(session.userId);
    }
    return null;
  },

  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) return false;
    return this.ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
  },

  // Rating calculation
  calculateRating(userId) {
    const tasks = this.getTasks().filter(t => t.assignedTo === userId && t.status === 'completed');
    if (tasks.length === 0) return 0;
    const onTime = tasks.filter(t => !t.deadline || t.completedAt <= t.deadline).length;
    const ratio = onTime / tasks.length;
    return Math.round((3 + ratio * 2) * 10) / 10; // Rating 3.0 - 5.0
  },

  // Leaderboard
  getLeaderboard() {
    return this.getUsers()
      .filter(u => u.role !== 'admin')
      .sort((a, b) => b.coins - a.coins)
      .map((u, i) => ({ ...u, rank: i + 1 }));
  }
};
