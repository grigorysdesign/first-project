// ============================================
// Database & Data Layer - Supabase Edition
// ============================================

// ⚠️ ЗАМЕНИ ЭТИ ЗНАЧЕНИЯ НА СВОИ (из Supabase → Settings → API)
const SUPABASE_URL = 'https://ihlecobbuzeuhwstryqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGVjb2JidXpldWh3c3RyeXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTU3OTcsImV4cCI6MjA4NjgzMTc5N30.H4MQGWg2ixJaT2qgVGlOTOjCTR8Xmwc6uP4msrfiEcg';

// Инициализация Supabase-клиента
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DB = {
  // Кеш данных в памяти (загружается при старте)
  _cache: {
    users: [],
    tasks: [],
    news: [],
    kb: [],
    transactions: []
  },

  KEY_SESSION: 'clinic_session',

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

  // ============================================
  // Инициализация — загрузка всех данных из Supabase
  // ============================================
  async init() {
    console.log('🔄 Загрузка данных из Supabase...');

    try {
      // Загружаем все таблицы параллельно
      const [usersRes, tasksRes, newsRes, kbRes, transRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }),
        supabase.from('knowledge_base').select('*'),
        supabase.from('transactions').select('*').order('date', { ascending: false })
      ]);

      // Проверяем ошибки
      if (usersRes.error) throw new Error('Ошибка загрузки users: ' + usersRes.error.message);
      if (tasksRes.error) throw new Error('Ошибка загрузки tasks: ' + tasksRes.error.message);
      if (newsRes.error) throw new Error('Ошибка загрузки news: ' + newsRes.error.message);
      if (kbRes.error) throw new Error('Ошибка загрузки knowledge_base: ' + kbRes.error.message);
      if (transRes.error) throw new Error('Ошибка загрузки transactions: ' + transRes.error.message);

      // Маппинг полей из БД в формат фронтенда
      this._cache.users = (usersRes.data || []).map(u => ({
        id: u.id,
        login: u.login,
        password: u.password,
        name: u.name,
        role: u.role,
        specialty: u.specialty,
        coins: u.coins,
        rating: parseFloat(u.rating) || 0,
        tasksCompleted: u.tasks_completed,
        avatar: u.avatar_url,
        createdAt: u.created_at
      }));

      this._cache.tasks = (tasksRes.data || []).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        reward: t.reward,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assigned_to,
        createdBy: t.created_by,
        createdAt: t.created_at,
        deadline: t.deadline,
        completedAt: t.completed_at
      }));

      this._cache.news = (newsRes.data || []).map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        author: n.author,
        createdAt: n.created_at,
        pinned: n.pinned
      }));

      this._cache.kb = (kbRes.data || []).map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        category: a.category,
        author: a.author,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        tags: a.tags || []
      }));

      this._cache.transactions = (transRes.data || []).map(t => ({
        id: t.id,
        userId: t.user_id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        taskId: t.task_id,
        date: t.date
      }));

      console.log('✅ Данные загружены:', {
        users: this._cache.users.length,
        tasks: this._cache.tasks.length,
        news: this._cache.news.length,
        kb: this._cache.kb.length,
        transactions: this._cache.transactions.length
      });

    } catch (err) {
      console.error('❌ Ошибка подключения к Supabase:', err);
      console.log('⚠️ Используем пустые данные');
    }
  },

  // ============================================
  // Хелпер: синхронизация с Supabase (в фоне)
  // ============================================
  _sync(table, action, data) {
    // Маппинг из camelCase в snake_case для БД
    const mapToDb = {
      users: (u) => ({
        id: u.id, login: u.login, password: u.password, name: u.name,
        role: u.role, specialty: u.specialty, coins: u.coins,
        rating: u.rating, tasks_completed: u.tasksCompleted,
        avatar_url: u.avatar, created_at: u.createdAt
      }),
      tasks: (t) => ({
        id: t.id, title: t.title, description: t.description,
        category: t.category, reward: t.reward, status: t.status,
        priority: t.priority, assigned_to: t.assignedTo,
        created_by: t.createdBy, created_at: t.createdAt,
        deadline: t.deadline, completed_at: t.completedAt
      }),
      news: (n) => ({
        id: n.id, title: n.title, content: n.content,
        category: n.category, author: n.author,
        created_at: n.createdAt, pinned: n.pinned
      }),
      knowledge_base: (a) => ({
        id: a.id, title: a.title, content: a.content,
        category: a.category, author: a.author,
        created_at: a.createdAt, updated_at: a.updatedAt,
        tags: a.tags
      }),
      transactions: (t) => ({
        id: t.id, user_id: t.userId, amount: t.amount,
        type: t.type, description: t.description,
        task_id: t.taskId, date: t.date
      })
    };

    const dbData = mapToDb[table] ? mapToDb[table](data) : data;

    let promise;
    if (action === 'upsert') {
      promise = supabase.from(table).upsert(dbData);
    } else if (action === 'delete') {
      promise = supabase.from(table).delete().eq('id', data.id || data);
    } else if (action === 'insert') {
      promise = supabase.from(table).insert(dbData);
    }

    if (promise) {
      promise.then(({ error }) => {
        if (error) console.error(`❌ Sync error (${table}/${action}):`, error.message);
        else console.log(`✅ Synced: ${table}/${action}`);
      });
    }
  },

  // ============================================
  // User methods
  // ============================================
  getUsers() { return this._cache.users; },
  getUserById(id) { return this._cache.users.find(u => u.id === id); },

  updateUser(id, updates) {
    const users = this._cache.users;
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this._sync('users', 'upsert', users[idx]);
      return users[idx];
    }
    return null;
  },

  addUser(user) {
    user.id = 'u' + Date.now();
    this._cache.users.push(user);
    this._sync('users', 'insert', user);
    return user;
  },

  // ============================================
  // Task methods
  // ============================================
  getTasks() { return this._cache.tasks; },
  getTaskById(id) { return this._cache.tasks.find(t => t.id === id); },

  updateTask(id, updates) {
    const tasks = this._cache.tasks;
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...updates };
      this._sync('tasks', 'upsert', tasks[idx]);
      return tasks[idx];
    }
    return null;
  },

  addTask(task) {
    task.id = 't' + Date.now();
    this._cache.tasks.push(task);
    this._sync('tasks', 'insert', task);
    return task;
  },

  deleteTask(id) {
    this._cache.tasks = this._cache.tasks.filter(t => t.id !== id);
    this._sync('tasks', 'delete', { id });
  },

  // ============================================
  // News methods
  // ============================================
  getNews() { return this._cache.news; },

  addNews(article) {
    article.id = 'n' + Date.now();
    this._cache.news.unshift(article);
    this._sync('news', 'insert', article);
    return article;
  },

  deleteNews(id) {
    this._cache.news = this._cache.news.filter(n => n.id !== id);
    this._sync('news', 'delete', { id });
  },

  // ============================================
  // Knowledge base methods
  // ============================================
  getKB() { return this._cache.kb; },

  addKBArticle(article) {
    article.id = 'kb' + Date.now();
    this._cache.kb.push(article);
    this._sync('knowledge_base', 'insert', article);
    return article;
  },

  updateKBArticle(id, updates) {
    const kb = this._cache.kb;
    const idx = kb.findIndex(a => a.id === id);
    if (idx !== -1) {
      kb[idx] = { ...kb[idx], ...updates };
      this._sync('knowledge_base', 'upsert', kb[idx]);
      return kb[idx];
    }
    return null;
  },

  deleteKBArticle(id) {
    this._cache.kb = this._cache.kb.filter(a => a.id !== id);
    this._sync('knowledge_base', 'delete', { id });
  },

  // ============================================
  // Transaction methods
  // ============================================
  getTransactions() { return this._cache.transactions; },
  getUserTransactions(userId) { return this._cache.transactions.filter(t => t.userId === userId); },

  addTransaction(transaction) {
    transaction.id = 'tr' + Date.now();
    this._cache.transactions.unshift(transaction);
    this._sync('transactions', 'insert', transaction);
    return transaction;
  },

  // ============================================
  // Auth methods (сессия в localStorage, данные в Supabase)
  // ============================================
  login(login, password) {
    const user = this._cache.users.find(u => u.login === login && u.password === password);
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

  // ============================================
  // Rating & Leaderboard
  // ============================================
  calculateRating(userId) {
    const tasks = this._cache.tasks.filter(t => t.assignedTo === userId && t.status === 'completed');
    if (tasks.length === 0) return 0;
    const onTime = tasks.filter(t => !t.deadline || t.completedAt <= t.deadline).length;
    const ratio = onTime / tasks.length;
    return Math.round((3 + ratio * 2) * 10) / 10;
  },

  getLeaderboard() {
    return this._cache.users
      .filter(u => u.role !== 'admin')
      .sort((a, b) => b.coins - a.coins)
      .map((u, i) => ({ ...u, rank: i + 1 }));
  }
};
