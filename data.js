// ============================================
// Database & Data Layer - Supabase Edition
// ============================================

// ⚠️ ЗАМЕНИ ЭТИ ЗНАЧЕНИЯ НА СВОИ (из Supabase → Settings → API)
const SUPABASE_URL = 'https://ihlecobbuzeuhwstryqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGVjb2JidXpldWh3c3RyeXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTU3OTcsImV4cCI6MjA4NjgzMTc5N30.H4MQGWg2ixJaT2qgVGlOTOjCTR8Xmwc6uP4msrfiEcg';

// Инициализация Supabase-клиента
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DB = {
  // Кеш данных в памяти (загружается при старте)
  _cache: {
    users: [],
    tasks: [],
    news: [],
    kb: [],
    transactions: [],
    todos: [],
    taskAttachments: [],
    userRatings: [],
    storeProducts: [],
    purchases: [],
    messages: []
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
      const [usersRes, tasksRes, newsRes, kbRes, transRes, todosRes, attachRes, ratingsRes, productsRes, purchasesRes, messagesRes] = await Promise.all([
        supabaseClient.from('users').select('*'),
        supabaseClient.from('tasks').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('news').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('knowledge_base').select('*'),
        supabaseClient.from('transactions').select('*').order('date', { ascending: false }),
        supabaseClient.from('user_todos').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('task_attachments').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('user_ratings').select('*'),
        supabaseClient.from('store_products').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('purchases').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('messages').select('*').order('created_at', { ascending: true })
      ]);

      // Проверяем ошибки (некритичные для новых таблиц)
      if (usersRes.error) throw new Error('Ошибка загрузки users: ' + usersRes.error.message);
      if (tasksRes.error) throw new Error('Ошибка загрузки tasks: ' + tasksRes.error.message);
      if (newsRes.error) throw new Error('Ошибка загрузки news: ' + newsRes.error.message);
      if (kbRes.error) throw new Error('Ошибка загрузки knowledge_base: ' + kbRes.error.message);
      if (transRes.error) throw new Error('Ошибка загрузки transactions: ' + transRes.error.message);
      if (todosRes.error) console.warn('user_todos не загружены:', todosRes.error.message);
      if (attachRes.error) console.warn('task_attachments не загружены:', attachRes.error.message);
      if (ratingsRes.error) console.warn('user_ratings не загружены:', ratingsRes.error.message);
      if (productsRes.error) console.warn('store_products не загружены:', productsRes.error.message);
      if (purchasesRes.error) console.warn('purchases не загружены:', purchasesRes.error.message);
      if (messagesRes.error) console.warn('messages не загружены:', messagesRes.error.message);

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
        birthday: u.birthday,
        phone: u.phone,
        email: u.email,
        bio: u.bio,
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
        completedAt: t.completed_at,
        estimatedHours: t.estimated_hours,
        actualHours: t.actual_hours,
        tags: t.tags || [],
        notes: t.notes
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

      this._cache.todos = (todosRes.data || []).map(t => ({
        id: t.id,
        userId: t.user_id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        isDone: t.is_done,
        dueDate: t.due_date,
        createdAt: t.created_at,
        completedAt: t.completed_at
      }));

      this._cache.taskAttachments = (attachRes.data || []).map(a => ({
        id: a.id,
        taskId: a.task_id,
        fileName: a.file_name,
        fileUrl: a.file_url,
        fileSize: a.file_size,
        fileType: a.file_type,
        uploadedBy: a.uploaded_by,
        createdAt: a.created_at
      }));

      this._cache.userRatings = (ratingsRes.data || []).map(r => ({
        id: r.id,
        userId: r.user_id,
        ratedBy: r.rated_by,
        score: r.score,
        comment: r.comment,
        createdAt: r.created_at
      }));

      this._cache.storeProducts = (productsRes.data || []).map(p => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        description: p.description,
        price: p.price,
        stock: p.stock,
        active: p.active,
        category: p.category || 'other',
        createdBy: p.created_by,
        createdAt: p.created_at
      }));

      this._cache.purchases = (purchasesRes.data || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        productId: p.product_id,
        productName: p.product_name,
        price: p.price,
        date: p.created_at
      }));

      this._cache.messages = (messagesRes.data || []).map(m => ({
        id: m.id,
        fromUserId: m.from_user_id,
        toUserId: m.to_user_id,
        text: m.text,
        read: m.read,
        fileName: m.file_name || null,
        fileUrl: m.file_url || null,
        fileSize: m.file_size || null,
        fileType: m.file_type || null,
        createdAt: m.created_at
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
        avatar_url: u.avatar, birthday: u.birthday, phone: u.phone,
        email: u.email, bio: u.bio, created_at: u.createdAt
      }),
      tasks: (t) => ({
        id: t.id, title: t.title, description: t.description,
        category: t.category, reward: t.reward, status: t.status,
        priority: t.priority, assigned_to: t.assignedTo,
        created_by: t.createdBy, created_at: t.createdAt,
        deadline: t.deadline, completed_at: t.completedAt,
        estimated_hours: t.estimatedHours, actual_hours: t.actualHours,
        tags: t.tags, notes: t.notes
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
      }),
      user_todos: (t) => ({
        id: t.id, user_id: t.userId, title: t.title,
        description: t.description, priority: t.priority,
        is_done: t.isDone, due_date: t.dueDate,
        created_at: t.createdAt, completed_at: t.completedAt
      }),
      task_attachments: (a) => ({
        id: a.id, task_id: a.taskId, file_name: a.fileName,
        file_url: a.fileUrl, file_size: a.fileSize,
        file_type: a.fileType, uploaded_by: a.uploadedBy,
        created_at: a.createdAt
      }),
      user_ratings: (r) => ({
        id: r.id, user_id: r.userId, rated_by: r.ratedBy,
        score: r.score, comment: r.comment,
        created_at: r.createdAt
      }),
      store_products: (p) => ({
        id: p.id, name: p.name, icon: p.icon,
        description: p.description, price: p.price,
        stock: p.stock, active: p.active,
        category: p.category,
        created_by: p.createdBy, created_at: p.createdAt
      }),
      purchases: (p) => ({
        id: p.id, user_id: p.userId, product_id: p.productId,
        product_name: p.productName, price: p.price,
        created_at: p.date
      }),
      messages: (m) => ({
        id: m.id, from_user_id: m.fromUserId, to_user_id: m.toUserId,
        text: m.text, read: m.read,
        file_name: m.fileName, file_url: m.fileUrl,
        file_size: m.fileSize, file_type: m.fileType,
        created_at: m.createdAt
      })
    };

    const dbData = mapToDb[table] ? mapToDb[table](data) : data;

    const doSync = async (attempt = 1) => {
      let promise;
      if (action === 'upsert') {
        promise = supabaseClient.from(table).upsert(dbData);
      } else if (action === 'delete') {
        promise = supabaseClient.from(table).delete().eq('id', data.id || data);
      } else if (action === 'insert') {
        promise = supabaseClient.from(table).insert(dbData);
      }

      if (!promise) return;

      const { error } = await promise;
      if (error) {
        console.error(`❌ Sync error (${table}/${action}, attempt ${attempt}):`, error.message);
        // Retry up to 3 times for network/timeout errors
        if (attempt < 3 && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout'))) {
          const delay = attempt * 2000;
          console.log(`🔄 Retrying in ${delay}ms...`);
          setTimeout(() => doSync(attempt + 1), delay);
          return;
        }
        // Show visible notification for persistent errors
        this._showSyncError(table, action, error.message);
      } else {
        console.log(`✅ Synced: ${table}/${action}`);
        // Remove error notification on success
        this._hideSyncError();
      }
    };

    doSync();
  },

  _syncErrorTimeout: null,

  _showSyncError(table, action, msg) {
    // Show a non-intrusive toast at the top of the page
    let toast = document.getElementById('syncErrorToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'syncErrorToast';
      toast.className = 'sync-error-toast';
      document.body.appendChild(toast);
    }
    const tableLabels = {
      users: 'Пользователи', tasks: 'Задачи', news: 'Новости',
      knowledge_base: 'База знаний', transactions: 'Транзакции',
      user_todos: 'Задачи', task_attachments: 'Вложения',
      user_ratings: 'Рейтинг', store_products: 'Магазин',
      purchases: 'Покупки', messages: 'Сообщения'
    };
    toast.innerHTML = `
      <span>⚠️ Ошибка сохранения (${tableLabels[table] || table}): ${msg}</span>
      <button onclick="this.parentElement.remove()">✕</button>
    `;
    toast.classList.add('visible');
    // Auto-hide after 8 seconds
    clearTimeout(this._syncErrorTimeout);
    this._syncErrorTimeout = setTimeout(() => this._hideSyncError(), 8000);
  },

  _hideSyncError() {
    const toast = document.getElementById('syncErrorToast');
    if (toast) toast.classList.remove('visible');
  },

  // ============================================
  // User methods
  // ============================================
  getUsers() { return this._cache.users; },
  getUserById(id) { return this._cache.users.find(u => String(u.id) === String(id)); },

  updateUser(id, updates) {
    const users = this._cache.users;
    const idx = users.findIndex(u => String(u.id) === String(id));
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
  getTaskById(id) { return this._cache.tasks.find(t => String(t.id) === String(id)); },

  updateTask(id, updates) {
    const tasks = this._cache.tasks;
    const idx = tasks.findIndex(t => String(t.id) === String(id));
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
    this._cache.tasks = this._cache.tasks.filter(t => String(t.id) !== String(id));
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
    this._cache.news = this._cache.news.filter(n => String(n.id) !== String(id));
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
    const idx = kb.findIndex(a => String(a.id) === String(id));
    if (idx !== -1) {
      kb[idx] = { ...kb[idx], ...updates };
      this._sync('knowledge_base', 'upsert', kb[idx]);
      return kb[idx];
    }
    return null;
  },

  deleteKBArticle(id) {
    this._cache.kb = this._cache.kb.filter(a => String(a.id) !== String(id));
    this._sync('knowledge_base', 'delete', { id });
  },

  // ============================================
  // Transaction methods
  // ============================================
  getTransactions() { return this._cache.transactions; },
  getUserTransactions(userId) { return this._cache.transactions.filter(t => String(t.userId) === String(userId)); },

  addTransaction(transaction) {
    transaction.id = 'tr' + Date.now();
    this._cache.transactions.unshift(transaction);
    this._sync('transactions', 'insert', transaction);
    return transaction;
  },

  // ============================================
  // To-Do List methods
  // ============================================
  getUserTodos(userId) { return this._cache.todos.filter(t => String(t.userId) === String(userId)); },

  addTodo(todo) {
    todo.id = 'td' + Date.now();
    this._cache.todos.unshift(todo);
    this._sync('user_todos', 'insert', todo);
    return todo;
  },

  updateTodo(id, updates) {
    const idx = this._cache.todos.findIndex(t => String(t.id) === String(id));
    if (idx !== -1) {
      this._cache.todos[idx] = { ...this._cache.todos[idx], ...updates };
      this._sync('user_todos', 'upsert', this._cache.todos[idx]);
      return this._cache.todos[idx];
    }
    return null;
  },

  deleteTodo(id) {
    this._cache.todos = this._cache.todos.filter(t => String(t.id) !== String(id));
    this._sync('user_todos', 'delete', { id });
  },

  // ============================================
  // Task Attachments methods
  // ============================================
  getTaskAttachments(taskId) { return this._cache.taskAttachments.filter(a => String(a.taskId) === String(taskId)); },

  addTaskAttachment(attachment) {
    attachment.id = 'att' + Date.now();
    this._cache.taskAttachments.push(attachment);
    this._sync('task_attachments', 'insert', attachment);
    return attachment;
  },

  deleteTaskAttachment(id) {
    this._cache.taskAttachments = this._cache.taskAttachments.filter(a => String(a.id) !== String(id));
    this._sync('task_attachments', 'delete', { id });
  },

  // ============================================
  // User Ratings methods
  // ============================================
  getUserRatings(userId) { return this._cache.userRatings.filter(r => String(r.userId) === String(userId)); },

  getAverageRating(userId) {
    const ratings = this.getUserRatings(userId);
    if (ratings.length === 0) return 0;
    return Math.round((ratings.reduce((s, r) => s + r.score, 0) / ratings.length) * 10) / 10;
  },

  addUserRating(rating) {
    // Обновляем если уже оценивал
    const existing = this._cache.userRatings.find(r => String(r.userId) === String(rating.userId) && String(r.ratedBy) === String(rating.ratedBy));
    if (existing) {
      existing.score = rating.score;
      existing.comment = rating.comment;
      this._sync('user_ratings', 'upsert', existing);
      // Пересчёт среднего рейтинга пользователя
      const avg = this.getAverageRating(rating.userId);
      this.updateUser(rating.userId, { rating: avg });
      return existing;
    }
    rating.id = 'rt' + Date.now();
    this._cache.userRatings.push(rating);
    this._sync('user_ratings', 'insert', rating);
    const avg = this.getAverageRating(rating.userId);
    this.updateUser(rating.userId, { rating: avg });
    return rating;
  },

  // ============================================
  // Birthday methods
  // ============================================
  getTodayBirthdays() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    return this._cache.users.filter(u => {
      if (!u.birthday) return false;
      const bd = new Date(u.birthday);
      return (bd.getMonth() + 1) === month && bd.getDate() === day;
    });
  },

  // ============================================
  // Profile / Avatar upload
  // ============================================
  async uploadAvatar(userId, file) {
    const ext = file.name.split('.').pop();
    const path = `avatars/${userId}_${Date.now()}.${ext}`;
    const { data, error } = await supabaseClient.storage.from('avatars').upload(path, file);
    if (error) {
      console.error('Ошибка загрузки аватара:', error.message);
      return null;
    }
    const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(path);
    const url = urlData.publicUrl;
    this.updateUser(userId, { avatar: url });
    return url;
  },

  async uploadTaskFile(taskId, file, uploadedBy) {
    const ext = file.name.split('.').pop();
    const path = `tasks/${taskId}_${Date.now()}.${ext}`;
    const { data, error } = await supabaseClient.storage.from('task-files').upload(path, file);
    if (error) {
      console.error('Ошибка загрузки файла:', error.message);
      return null;
    }
    const { data: urlData } = supabaseClient.storage.from('task-files').getPublicUrl(path);
    return this.addTaskAttachment({
      taskId,
      fileName: file.name,
      fileUrl: urlData.publicUrl,
      fileSize: file.size,
      fileType: file.type,
      uploadedBy,
      createdAt: new Date().toISOString()
    });
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
  },

  // ============================================
  // Store Products methods
  // ============================================
  STORE_CATEGORIES: {
    all: 'Все',
    privileges: 'Привилегии',
    merch: 'Мерч',
    education: 'Обучение',
    services: 'Услуги',
    other: 'Другое'
  },

  getStoreProducts() { return this._cache.storeProducts; },

  addStoreProduct(product) {
    product.id = 'sp' + Date.now();
    this._cache.storeProducts.unshift(product);
    this._sync('store_products', 'insert', product);
    return product;
  },

  updateStoreProduct(id, updates) {
    const idx = this._cache.storeProducts.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) {
      this._cache.storeProducts[idx] = { ...this._cache.storeProducts[idx], ...updates };
      this._sync('store_products', 'upsert', this._cache.storeProducts[idx]);
      return this._cache.storeProducts[idx];
    }
    return null;
  },

  deleteStoreProduct(id) {
    this._cache.storeProducts = this._cache.storeProducts.filter(p => String(p.id) !== String(id));
    this._sync('store_products', 'delete', { id });
  },

  // ============================================
  // Purchases methods
  // ============================================
  getUserPurchases(userId) { return this._cache.purchases.filter(p => String(p.userId) === String(userId)); },

  purchaseProduct(userId, productId) {
    const product = this._cache.storeProducts.find(p => String(p.id) === String(productId));
    if (!product) return null;
    const user = this.getUserById(userId);
    if (!user || user.coins < product.price) return null;

    // Deduct coins
    this.updateUser(userId, { coins: user.coins - product.price });

    // Record transaction
    this.addTransaction({
      userId,
      amount: -product.price,
      type: 'spent',
      description: `Покупка: ${product.name}`,
      taskId: null,
      date: new Date().toISOString().split('T')[0]
    });

    // Reduce stock if applicable
    if (product.stock !== null) {
      this.updateStoreProduct(productId, { stock: product.stock - 1 });
      if (product.stock - 1 <= 0) {
        this.updateStoreProduct(productId, { active: false });
      }
    }

    // Record purchase
    const purchase = {
      id: 'pu' + Date.now(),
      userId,
      productId,
      productName: product.name,
      price: product.price,
      date: new Date().toISOString()
    };
    this._cache.purchases.unshift(purchase);
    this._sync('purchases', 'insert', purchase);
    return purchase;
  },

  // ============================================
  // Messages methods
  // ============================================
  getUserMessages(userId) {
    const uid = String(userId);
    return this._cache.messages.filter(m => String(m.fromUserId) === uid || String(m.toUserId) === uid);
  },

  getConversation(userId1, userId2) {
    const u1 = String(userId1);
    const u2 = String(userId2);
    return this._cache.messages.filter(m =>
      (String(m.fromUserId) === u1 && String(m.toUserId) === u2) ||
      (String(m.fromUserId) === u2 && String(m.toUserId) === u1)
    );
  },

  addMessage(message) {
    message.id = 'msg' + Date.now();
    this._cache.messages.push(message);
    this._sync('messages', 'insert', message);
    return message;
  },

  async uploadMessageFile(file) {
    const ext = file.name.split('.').pop();
    const path = `messages/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabaseClient.storage.from('message-files').upload(path, file);
    if (error) {
      console.error('Ошибка загрузки файла сообщения:', error.message);
      return null;
    }
    const { data: urlData } = supabaseClient.storage.from('message-files').getPublicUrl(path);
    return {
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    };
  },

  markMessageRead(id) {
    const idx = this._cache.messages.findIndex(m => String(m.id) === String(id));
    if (idx !== -1) {
      this._cache.messages[idx].read = true;
      this._sync('messages', 'upsert', this._cache.messages[idx]);
    }
  }
};
