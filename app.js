// ============================================
// Main Application - Doctor Clinic Platform
// ============================================

const App = {
  currentPage: 'login',
  currentUser: null,
  notifications: [],
  messengerOpen: false,
  messengerChatWith: null,

  // File upload constraints
  FILE_MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  FILE_ALLOWED_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv'
  ],
  FILE_ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'],

  init() {
    // DB.init() теперь вызывается снаружи (async)
    this.currentUser = DB.getCurrentUser();
    if (this.currentUser) {
      this.generateNotifications();
      this.navigate('dashboard');
    } else {
      this.navigate('login');
    }
  },

  navigate(page, params = {}) {
    this.currentPage = page;
    this.params = params;
    this.render();
  },

  // File validation
  validateFile(file) {
    const errors = [];
    if (file.size > this.FILE_MAX_SIZE) {
      errors.push(`Файл "${file.name}" превышает максимальный размер 10 МБ (${this.formatFileSize(file.size)})`);
    }
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!this.FILE_ALLOWED_EXTENSIONS.includes(ext)) {
      errors.push(`Тип файла "${ext}" не поддерживается. Допустимые: ${this.FILE_ALLOWED_EXTENSIONS.join(', ')}`);
    }
    return errors;
  },

  validateImageFile(file) {
    const errors = [];
    if (file.size > 5 * 1024 * 1024) {
      errors.push(`Изображение превышает 5 МБ (${this.formatFileSize(file.size)})`);
    }
    if (!file.type.startsWith('image/')) {
      errors.push('Допустимы только изображения (JPG, PNG, GIF, WebP)');
    }
    return errors;
  },

  // Notifications
  generateNotifications() {
    this.notifications = [];
    const user = this.currentUser;
    if (!user) return;

    // Birthday notifications
    const birthdays = DB.getTodayBirthdays();
    birthdays.forEach(b => {
      if (b.id !== user.id) {
        this.notifications.push({
          id: 'bday-' + b.id,
          type: 'birthday',
          icon: '🎂',
          title: 'День рождения',
          text: `Сегодня день рождения у ${b.name}!`,
          time: 'Сегодня',
          read: false
        });
      }
    });

    // New task assignments
    const myTasks = DB.getTasks().filter(t => t.assignedTo === user.id && t.status === 'in_progress');
    myTasks.forEach(t => {
      this.notifications.push({
        id: 'task-' + t.id,
        type: 'task',
        icon: '📋',
        title: 'Назначена задача',
        text: t.title,
        time: this.formatDate(t.createdAt),
        read: false,
        page: 'task-detail',
        pageId: t.id
      });
    });

    // New reviews
    const reviews = DB.getUserRatings(user.id);
    reviews.slice(0, 3).forEach(r => {
      const reviewer = DB.getUserById(r.ratedBy);
      this.notifications.push({
        id: 'review-' + r.id,
        type: 'review',
        icon: '⭐',
        title: 'Новый отзыв',
        text: `${reviewer?.name.split(' ').slice(0, 2).join(' ') || 'Коллега'} оценил вас на ${r.score}/5`,
        time: this.formatDate(r.createdAt),
        read: false
      });
    });

    // Tasks on review (for admins/heads)
    if (this.hasPermission('edit_tasks')) {
      const reviewTasks = DB.getTasks().filter(t => t.status === 'review');
      reviewTasks.forEach(t => {
        this.notifications.push({
          id: 'review-task-' + t.id,
          type: 'task',
          icon: '🔍',
          title: 'Задача на проверке',
          text: t.title,
          time: this.formatDate(t.createdAt),
          read: false,
          page: 'task-detail',
          pageId: t.id
        });
      });
    }
  },

  // Show loading spinner
  showSpinner(container, text = 'Загрузка...') {
    if (typeof container === 'string') {
      container = document.getElementById(container) || document.querySelector(container);
    }
    if (container) {
      container.innerHTML = `<div class="spinner-overlay"><div class="spinner"></div><span class="spinner-text">${text}</span></div>`;
    }
  },

  hasPermission(perm) {
    return DB.hasPermission(perm);
  },

  render() {
    const root = document.getElementById('app');
    if (this.currentPage === 'login') {
      root.innerHTML = this.renderLogin();
      this.bindLoginEvents();
      return;
    }

    root.innerHTML = `
      <div class="layout">
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
        ${this.renderSidebar()}
        <main class="main-content">
          ${this.renderHeader()}
          <div class="page-content">
            ${this.renderPage()}
          </div>
        </main>
      </div>
    `;
    this.bindPageEvents();
  },

  // ============ LOGIN ============
  renderLogin() {
    return `
      <div class="login-page">
        <div class="login-card">
          <div class="login-logo">
            <div class="logo-icon">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="#2563eb"/>
                <path d="M24 12v24M12 24h24" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </div>
            <h1>ClinicHub</h1>
            <p class="login-subtitle">Платформа для врачей клиники</p>
          </div>
          <form id="loginForm" class="login-form">
            <div class="form-group">
              <label for="login">Логин</label>
              <input type="text" id="login" placeholder="Введите логин" required autocomplete="username">
            </div>
            <div class="form-group">
              <label for="password">Пароль</label>
              <input type="password" id="password" placeholder="Введите пароль" required autocomplete="current-password">
            </div>
            <div id="loginError" class="error-msg hidden"></div>
            <button type="submit" class="btn btn-primary btn-full">Войти в систему</button>
          </form>
          <div class="login-demo">
            <p>Демо-доступ:</p>
            <div class="demo-accounts">
              <button class="demo-btn" data-login="admin" data-pass="admin123">Админ</button>
              <button class="demo-btn" data-login="head" data-pass="head123">Гл. врач</button>
              <button class="demo-btn" data-login="doctor" data-pass="doctor123">Врач</button>
              <button class="demo-btn" data-login="intern" data-pass="intern123">Интерн</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  bindLoginEvents() {
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const login = document.getElementById('login').value;
      const password = document.getElementById('password').value;
      const user = DB.login(login, password);
      if (user) {
        this.currentUser = user;
        this.navigate('dashboard');
      } else {
        const err = document.getElementById('loginError');
        err.textContent = 'Неверный логин или пароль';
        err.classList.remove('hidden');
      }
    });

    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('login').value = btn.dataset.login;
        document.getElementById('password').value = btn.dataset.pass;
      });
    });
  },

  // ============ SIDEBAR ============
  renderSidebar() {
    const user = this.currentUser;
    const role = DB.ROLE_LABELS[user.role];
    const menuItems = this.getMenuItems();

    const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2);
    const unreadNotifs = this.notifications.filter(n => !n.read).length;

    return `
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#2563eb"/><path d="M16 8v16M8 16h16" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>
            <span>ClinicHub</span>
          </div>
        </div>
        <a href="#" class="sidebar-user sidebar-profile-link" data-page="profile">
          <div class="avatar ${user.avatar ? 'has-image' : ''}">${user.avatar ? `<img src="${user.avatar}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : initials}</div>
          <div class="user-info">
            <div class="user-name">${user.name.split(' ').slice(0, 2).join(' ')}</div>
            <div class="user-role">${role}</div>
          </div>
        </a>
        <a href="#" class="sidebar-coins" data-page="wallet">
          <span class="coin-icon">◆</span>
          <span class="coin-amount">${user.coins}</span>
          <span class="coin-label">Ист Коинов</span>
        </a>
        <nav class="sidebar-nav">
          ${menuItems.map(item => `
            <a href="#" class="nav-item ${this.currentPage === item.page ? 'active' : ''}" data-page="${item.page}">
              <span class="nav-icon">${item.icon}</span>
              <span class="nav-text">${item.label}</span>
              ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
            </a>
          `).join('')}
        </nav>
        <div class="sidebar-footer">
          <a href="#" class="nav-item" id="logoutBtn">
            <span class="nav-icon">⏻</span>
            <span class="nav-text">Выйти</span>
          </a>
        </div>
      </aside>
    `;
  },

  getMenuItems() {
    const openTasks = DB.getTasks().filter(t => t.status === 'open').length;
    const todoCount = DB.getUserTodos(this.currentUser.id).filter(t => !t.isDone).length;
    const unreadNotifs = this.notifications.filter(n => !n.read).length;
    const items = [
      { page: 'dashboard', label: 'Дашборд', icon: '⊞', permission: 'view_dashboard' },
      { page: 'tasks', label: 'Задачи', icon: '☰', permission: 'view_dashboard', badge: openTasks || null },
      { page: 'my-todos', label: 'Мои дела', icon: '✓', permission: 'view_dashboard', badge: todoCount || null },
      { page: 'news', label: 'Новости', icon: '⊕', permission: 'view_dashboard' },
      { page: 'knowledge', label: 'База знаний', icon: '⊘', permission: 'view_dashboard' },
      { page: 'wallet', label: 'Ист Коины', icon: '◆', permission: 'view_dashboard' },
      { page: 'store', label: 'Магазин', icon: '🛒', permission: 'view_dashboard' },
      { page: 'messenger', label: 'Сообщения', icon: '💬', permission: 'view_dashboard' },
      { page: 'notifications', label: 'Уведомления', icon: '🔔', permission: 'view_dashboard', badge: unreadNotifs || null },
    ];

    if (this.hasPermission('manage_users')) {
      items.push({ page: 'users', label: 'Пользователи', icon: '⊡', permission: 'manage_users' });
    }

    return items.filter(i => this.hasPermission(i.permission));
  },

  // ============ HEADER ============
  renderHeader() {
    const titles = {
      dashboard: 'Дашборд',
      profile: 'Мой профиль',
      tasks: 'Задачи',
      'my-todos': 'Мои дела',
      news: 'Новости',
      knowledge: 'База знаний',
      wallet: 'Ист Коины',
      store: 'Магазин',
      messenger: 'Сообщения',
      notifications: 'Уведомления',
      users: 'Управление пользователями',
      'task-detail': 'Детали задачи',
      'news-detail': 'Новость',
      'kb-detail': 'Статья',
      'create-task': 'Новая задача',
      'create-news': 'Новая новость',
      'create-kb': 'Новая статья',
      'store-manage': 'Управление магазином'
    };
    const unreadNotifs = this.notifications.filter(n => !n.read).length;
    return `
      <header class="page-header">
        <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Открыть меню">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h2>${titles[this.currentPage] || 'Страница'}</h2>
        <div class="header-right">
          <button class="header-notif-btn" data-page="notifications" title="Уведомления">
            🔔${unreadNotifs > 0 ? `<span class="header-notif-badge">${unreadNotifs}</span>` : ''}
          </button>
          <span class="header-date">${new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </header>
    `;
  },

  // ============ PAGE ROUTER ============
  renderPage() {
    switch (this.currentPage) {
      case 'dashboard': return this.renderDashboard();
      case 'profile': return this.renderProfile();
      case 'tasks': return this.renderTasks();
      case 'task-detail': return this.renderTaskDetail();
      case 'create-task': return this.renderCreateTask();
      case 'my-todos': return this.renderMyTodos();
      case 'news': return this.renderNews();
      case 'news-detail': return this.renderNewsDetail();
      case 'create-news': return this.renderCreateNews();
      case 'knowledge': return this.renderKnowledge();
      case 'kb-detail': return this.renderKBDetail();
      case 'create-kb': return this.renderCreateKB();
      case 'wallet': return this.renderWallet();
      case 'store': return this.renderStore();
      case 'store-manage': return this.renderStoreManage();
      case 'messenger': return this.renderMessenger();
      case 'notifications': return this.renderNotifications();
      case 'users': return this.renderUsers();
      default: return '<p>Страница не найдена</p>';
    }
  },

  // ============ DASHBOARD ============
  renderDashboard() {
    const user = this.currentUser;
    const tasks = DB.getTasks();
    const myTasks = tasks.filter(t => t.assignedTo === user.id);
    const myActive = myTasks.filter(t => t.status === 'in_progress').length;
    const myCompleted = myTasks.filter(t => t.status === 'completed').length;
    const openTasks = tasks.filter(t => t.status === 'open').length;
    const transactions = DB.getUserTransactions(user.id).slice(0, 5);
    const leaderboard = DB.getLeaderboard().slice(0, 5);
    const news = DB.getNews().slice(0, 3);

    const birthdays = DB.getTodayBirthdays();
    const isSelfBirthday = birthdays.some(b => b.id === user.id);

    return `
      <div class="dashboard">
        ${isSelfBirthday ? `
          <div class="birthday-banner birthday-self">
            <div class="birthday-icon">🎂</div>
            <div class="birthday-text">
              <h3>С Днём Рождения, ${user.name.split(' ')[1] || user.name.split(' ')[0]}!</h3>
              <p>Коллектив ClinicHub поздравляет вас! Желаем здоровья, успехов и отличного настроения!</p>
            </div>
          </div>
        ` : ''}
        ${birthdays.filter(b => b.id !== user.id).length > 0 ? `
          <div class="birthday-banner">
            <div class="birthday-icon">🎉</div>
            <div class="birthday-text">
              <h3>Сегодня День Рождения!</h3>
              <p>Поздравляем: ${birthdays.filter(b => b.id !== user.id).map(b => `<strong>${b.name}</strong> (${b.specialty})`).join(', ')}</p>
            </div>
          </div>
        ` : ''}
        <div class="stats-grid">
          <div class="stat-card stat-green">
            <div class="stat-icon">◆</div>
            <div class="stat-info">
              <div class="stat-value">${user.coins}</div>
              <div class="stat-label">Ист Коинов</div>
            </div>
          </div>
          <div class="stat-card stat-purple">
            <div class="stat-icon">✓</div>
            <div class="stat-info">
              <div class="stat-value">${myCompleted}</div>
              <div class="stat-label">Завершено задач</div>
            </div>
          </div>
          <div class="stat-card stat-orange">
            <div class="stat-icon">◎</div>
            <div class="stat-info">
              <div class="stat-value">${openTasks}</div>
              <div class="stat-label">Доступно задач</div>
            </div>
          </div>
          <div class="stat-card stat-blue">
            <div class="stat-icon">💬</div>
            <div class="stat-info">
              <div class="stat-value">${DB.getUserMessages(user.id).filter(m => !m.read && String(m.toUserId) === String(user.id)).length}</div>
              <div class="stat-label">Новых сообщений</div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="card">
            <div class="card-header">
              <h3>Мои активные задачи</h3>
              <a href="#" class="link" data-page="tasks">Все задачи →</a>
            </div>
            <div class="card-body">
              ${myTasks.filter(t => t.status !== 'completed').length === 0
                ? '<p class="empty-text">Нет активных задач</p>'
                : myTasks.filter(t => t.status !== 'completed').slice(0, 4).map(t => `
                  <div class="task-mini" data-page="task-detail" data-id="${t.id}">
                    <div class="task-mini-left">
                      <span class="status-dot status-${t.status}"></span>
                      <span class="task-mini-title">${t.title}</span>
                    </div>
                    <span class="task-mini-reward">+${t.reward} ◆</span>
                  </div>
                `).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Уведомления</h3>
              <a href="#" class="link" data-page="notifications">Все →</a>
            </div>
            <div class="card-body">
              ${this.notifications.length === 0
                ? '<p class="empty-text">Нет уведомлений</p>'
                : this.notifications.slice(0, 4).map(n => `
                  <div class="notif-mini ${n.read ? '' : 'notif-unread'}">
                    <span class="notif-mini-icon">${n.icon}</span>
                    <div class="notif-mini-content">
                      <div class="notif-mini-title">${n.title}</div>
                      <div class="notif-mini-text">${n.text}</div>
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Последние новости</h3>
              <a href="#" class="link" data-page="news">Все новости →</a>
            </div>
            <div class="card-body">
              ${news.map(n => `
                <div class="news-mini" data-page="news-detail" data-id="${n.id}">
                  <div class="news-mini-date">${this.formatDate(n.createdAt)}</div>
                  <div class="news-mini-title">${n.title}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Последние транзакции</h3>
              <a href="#" class="link" data-page="wallet">Ист Коины →</a>
            </div>
            <div class="card-body">
              ${transactions.length === 0
                ? '<p class="empty-text">Нет транзакций</p>'
                : transactions.map(t => `
                  <div class="transaction-mini">
                    <span class="transaction-desc">${t.description}</span>
                    <span class="transaction-amount ${t.amount > 0 ? 'positive' : 'negative'}">${t.amount > 0 ? '+' : ''}${t.amount} ◆</span>
                  </div>
                `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ============ TASKS ============
  renderTasks() {
    const tasks = DB.getTasks();
    const user = this.currentUser;
    const filter = this.params.filter || 'all';
    const canCreate = this.hasPermission('create_tasks');

    let filtered = tasks;
    if (filter === 'my') filtered = tasks.filter(t => t.assignedTo === user.id);
    else if (filter === 'open') filtered = tasks.filter(t => t.status === 'open');
    else if (filter === 'in_progress') filtered = tasks.filter(t => t.status === 'in_progress');
    else if (filter === 'completed') filtered = tasks.filter(t => t.status === 'completed');

    return `
      <div class="tasks-page">
        <div class="page-actions">
          <div class="filter-tabs">
            ${[
              ['all', 'Все'],
              ['open', 'Открытые'],
              ['my', 'Мои'],
              ['in_progress', 'В работе'],
              ['completed', 'Завершённые']
            ].map(([key, label]) => `
              <button class="tab ${filter === key ? 'active' : ''}" data-filter="${key}">${label}</button>
            `).join('')}
          </div>
          ${canCreate ? '<button class="btn btn-primary" data-page="create-task">+ Новая задача</button>' : ''}
        </div>
        <div class="tasks-list">
          ${filtered.length === 0
            ? '<div class="empty-state"><p>Нет задач</p></div>'
            : filtered.map(t => {
              const creator = DB.getUserById(t.createdBy);
              const assignee = t.assignedTo ? DB.getUserById(t.assignedTo) : null;
              return `
                <div class="task-card" data-page="task-detail" data-id="${t.id}">
                  <div class="task-card-top">
                    <span class="task-category cat-${t.category}">${DB.TASK_CATEGORY_LABELS[t.category]}</span>
                    <span class="task-priority priority-${t.priority}">${t.priority === 'high' ? 'Высокий' : t.priority === 'medium' ? 'Средний' : 'Низкий'}</span>
                  </div>
                  <h4 class="task-card-title">${t.title}</h4>
                  <p class="task-card-desc">${t.description.slice(0, 100)}...</p>
                  <div class="task-card-bottom">
                    <div class="task-card-meta">
                      <span class="task-status status-badge-${t.status}">${DB.TASK_STATUS_LABELS[t.status]}</span>
                      ${assignee ? `<span class="task-assignee">→ ${assignee.name.split(' ')[0]}</span>` : ''}
                      ${t.deadline ? `<span class="task-deadline">до ${this.formatDate(t.deadline)}</span>` : ''}
                    </div>
                    <div class="task-reward">+${t.reward} ◆</div>
                  </div>
                </div>
              `;
            }).join('')}
        </div>
      </div>
    `;
  },

  renderTaskDetail() {
    const task = DB.getTaskById(this.params.id);
    if (!task) return '<p>Задача не найдена</p>';
    const creator = DB.getUserById(task.createdBy);
    const assignee = task.assignedTo ? DB.getUserById(task.assignedTo) : null;
    const user = this.currentUser;
    const canTake = this.hasPermission('take_tasks') && task.status === 'open' && task.assignedTo !== user.id;
    const canComplete = task.assignedTo === user.id && task.status === 'in_progress';
    const canReview = task.status === 'review' && (this.hasPermission('edit_tasks'));
    const canDelete = this.hasPermission('delete_tasks');
    const attachments = DB.getTaskAttachments(task.id);
    const canUpload = task.assignedTo === user.id || this.hasPermission('edit_tasks');

    return `
      <div class="detail-page">
        <button class="btn btn-ghost" data-page="tasks">← Назад к задачам</button>
        <div class="detail-card">
          <div class="detail-top">
            <span class="task-category cat-${task.category}">${DB.TASK_CATEGORY_LABELS[task.category]}</span>
            <span class="task-priority priority-${task.priority}">${task.priority === 'high' ? 'Высокий приоритет' : task.priority === 'medium' ? 'Средний приоритет' : 'Низкий приоритет'}</span>
            <span class="task-status status-badge-${task.status}">${DB.TASK_STATUS_LABELS[task.status]}</span>
          </div>
          <h2>${task.title}</h2>
          <div class="detail-meta">
            <span>Создал: ${creator?.name || 'Неизвестно'}</span>
            <span>Дата: ${this.formatDate(task.createdAt)}</span>
            ${task.deadline ? `<span>Дедлайн: ${this.formatDate(task.deadline)}</span>` : ''}
            ${assignee ? `<span>Исполнитель: ${assignee.name}</span>` : ''}
            ${task.estimatedHours ? `<span>Оценка: ${task.estimatedHours} ч.</span>` : ''}
            ${task.actualHours ? `<span>Факт: ${task.actualHours} ч.</span>` : ''}
          </div>
          <div class="detail-reward">
            <span class="reward-label">Награда:</span>
            <span class="reward-value">${task.reward} ◆ Ист Коинов</span>
          </div>
          ${(task.tags && task.tags.length > 0) ? `
            <div class="kb-tags" style="margin-bottom:16px;">
              ${task.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
          ` : ''}
          <div class="detail-description">
            <h4>Описание</h4>
            <p>${task.description}</p>
          </div>
          ${task.notes ? `
            <div class="detail-description">
              <h4>Заметки</h4>
              <p>${task.notes}</p>
            </div>
          ` : ''}

          <div class="task-attachments-section">
            <h4>Вложения (${attachments.length})</h4>
            ${attachments.length > 0 ? `
              <div class="attachments-list">
                ${attachments.map(a => `
                  <div class="attachment-item">
                    ${a.fileType && a.fileType.startsWith('image/') && a.fileUrl ? `
                      <div class="attachment-thumb">
                        <img src="${a.fileUrl}" alt="${a.fileName}" loading="lazy">
                      </div>
                    ` : `<span class="attachment-icon">${this.getFileIcon(a.fileType)}</span>`}
                    <div class="attachment-info">
                      <a href="${a.fileUrl}" target="_blank" class="attachment-name">${a.fileName}</a>
                      <span class="attachment-size">${this.formatFileSize(a.fileSize)}</span>
                    </div>
                    ${(a.uploadedBy === user.id || canDelete) ? `<button class="btn btn-sm btn-ghost" data-delete-attachment="${a.id}">✕</button>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : '<p class="empty-text">Нет вложений</p>'}
            ${canUpload && task.status !== 'completed' ? `
              <div class="attachment-upload-zone" id="dropZone">
                <div class="drop-zone-content">
                  <span class="drop-zone-icon">📁</span>
                  <span class="drop-zone-text">Перетащите файлы сюда или</span>
                  <label class="btn btn-sm btn-primary" for="taskFileInput">Выберите файлы</label>
                  <input type="file" id="taskFileInput" class="hidden" multiple>
                  <span class="drop-zone-hint">Макс. 10 МБ. Форматы: изображения, PDF, DOC, XLS, PPT, TXT, CSV</span>
                </div>
                <div class="drop-zone-progress hidden" id="uploadProgress">
                  <div class="spinner"></div>
                  <span class="spinner-text" id="uploadProgressText">Загрузка файлов...</span>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="detail-actions">
            ${canTake ? `<button class="btn btn-primary" id="takeTaskBtn" data-id="${task.id}">Взять задачу</button>` : ''}
            ${canComplete ? `<button class="btn btn-success" id="submitTaskBtn" data-id="${task.id}">Отправить на проверку</button>` : ''}
            ${canReview ? `
              <button class="btn btn-success" id="approveTaskBtn" data-id="${task.id}">Одобрить</button>
              <button class="btn btn-danger" id="rejectTaskBtn" data-id="${task.id}">Вернуть</button>
            ` : ''}
            ${canDelete ? `<button class="btn btn-danger" id="deleteTaskBtn" data-id="${task.id}">Удалить</button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  renderCreateTask() {
    return `
      <div class="detail-page">
        <button class="btn btn-ghost" data-page="tasks">← Назад</button>
        <div class="detail-card">
          <h2>Создать задачу</h2>
          <form id="createTaskForm" class="form">
            <div class="form-group">
              <label>Название</label>
              <input type="text" id="taskTitle" required placeholder="Название задачи">
            </div>
            <div class="form-group">
              <label>Описание</label>
              <textarea id="taskDesc" rows="5" required placeholder="Подробное описание задачи"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Категория</label>
                <select id="taskCategory">
                  ${Object.entries(DB.TASK_CATEGORY_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Приоритет</label>
                <select id="taskPriority">
                  <option value="low">Низкий</option>
                  <option value="medium" selected>Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Награда (Ист Коины)</label>
                <input type="number" id="taskReward" min="10" max="1000" value="50" required>
              </div>
              <div class="form-group">
                <label>Дедлайн</label>
                <input type="date" id="taskDeadline">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Оценка времени (часов)</label>
                <input type="number" id="taskEstimatedHours" min="0.5" max="100" step="0.5" placeholder="Например: 4">
              </div>
              <div class="form-group">
                <label>Теги (через запятую)</label>
                <input type="text" id="taskTags" placeholder="хирургия, срочное, отчёт">
              </div>
            </div>
            <div class="form-group">
              <label>Дополнительные заметки</label>
              <textarea id="taskNotes" rows="3" placeholder="Заметки к задаче..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Создать задачу</button>
          </form>
        </div>
      </div>
    `;
  },

  // ============ NEWS ============
  renderNews() {
    const news = DB.getNews();
    const canCreate = this.hasPermission('create_news');
    const pinnedNews = news.filter(n => n.pinned);
    const regularNews = news.filter(n => !n.pinned);

    return `
      <div class="news-page">
        <div class="page-actions">
          <h3>Новости клиники</h3>
          ${canCreate ? '<button class="btn btn-primary" data-page="create-news">+ Новая новость</button>' : ''}
        </div>
        ${pinnedNews.length > 0 ? `
          <div class="pinned-news">
            ${pinnedNews.map(n => this.renderNewsCard(n, true)).join('')}
          </div>
        ` : ''}
        <div class="news-list">
          ${regularNews.map(n => this.renderNewsCard(n, false)).join('')}
        </div>
      </div>
    `;
  },

  renderNewsCard(n, pinned) {
    const author = DB.getUserById(n.author);
    const categoryIcons = { announcement: '📢', medical: '🏥', achievement: '🏆', event: '📅' };
    const categoryLabels = { announcement: 'Объявление', medical: 'Медицина', achievement: 'Достижения', event: 'Событие' };
    return `
      <div class="news-card ${pinned ? 'pinned' : ''}" data-page="news-detail" data-id="${n.id}">
        ${pinned ? '<div class="pinned-badge">Закреплено</div>' : ''}
        <div class="news-card-category">${categoryLabels[n.category] || n.category}</div>
        <h3 class="news-card-title">${n.title}</h3>
        <p class="news-card-preview">${n.content.slice(0, 150).replace(/[#*\n]/g, ' ')}...</p>
        <div class="news-card-footer">
          <span>${author?.name.split(' ').slice(0, 2).join(' ') || 'Неизвестно'}</span>
          <span>${this.formatDate(n.createdAt)}</span>
        </div>
      </div>
    `;
  },

  renderNewsDetail() {
    const article = DB.getNews().find(n => n.id === this.params.id);
    if (!article) return '<p>Новость не найдена</p>';
    const author = DB.getUserById(article.author);
    const canDelete = this.hasPermission('delete_news');

    return `
      <div class="detail-page">
        <button class="btn btn-ghost" data-page="news">← Назад к новостям</button>
        <div class="detail-card">
          <h2>${article.title}</h2>
          <div class="detail-meta">
            <span>Автор: ${author?.name || 'Неизвестно'}</span>
            <span>Дата: ${this.formatDate(article.createdAt)}</span>
          </div>
          <div class="detail-description article-content">
            ${this.renderMarkdown(article.content)}
          </div>
          ${canDelete ? `<div class="detail-actions"><button class="btn btn-danger" id="deleteNewsBtn" data-id="${article.id}">Удалить</button></div>` : ''}
        </div>
      </div>
    `;
  },

  renderCreateNews() {
    return `
      <div class="detail-page">
        <button class="btn btn-ghost" data-page="news">← Назад</button>
        <div class="detail-card">
          <h2>Создать новость</h2>
          <form id="createNewsForm" class="form">
            <div class="form-group">
              <label>Заголовок</label>
              <input type="text" id="newsTitle" required placeholder="Заголовок новости">
            </div>
            <div class="form-group">
              <label>Категория</label>
              <select id="newsCategory">
                <option value="announcement">Объявление</option>
                <option value="medical">Медицина</option>
                <option value="achievement">Достижения</option>
                <option value="event">Событие</option>
              </select>
            </div>
            <div class="form-group">
              <label>Содержание</label>
              <textarea id="newsContent" rows="10" required placeholder="Текст новости (поддерживается Markdown)"></textarea>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="newsPinned">
                Закрепить новость
              </label>
            </div>
            <button type="submit" class="btn btn-primary">Опубликовать</button>
          </form>
        </div>
      </div>
    `;
  },

  // ============ KNOWLEDGE BASE ============
  renderKnowledge() {
    const articles = DB.getKB();
    const canCreate = this.hasPermission('create_kb');
    const filter = this.params.category || 'all';

    let filtered = articles;
    if (filter !== 'all') filtered = articles.filter(a => a.category === filter);

    return `
      <div class="kb-page">
        <div class="page-actions">
          <div class="filter-tabs">
            <button class="tab ${filter === 'all' ? 'active' : ''}" data-kb-filter="all">Все</button>
            ${Object.entries(DB.KB_CATEGORY_LABELS).map(([k, v]) => `
              <button class="tab ${filter === k ? 'active' : ''}" data-kb-filter="${k}">${v}</button>
            `).join('')}
          </div>
          ${canCreate ? '<button class="btn btn-primary" data-page="create-kb">+ Новая статья</button>' : ''}
        </div>
        <div class="kb-search">
          <input type="text" id="kbSearch" placeholder="Поиск по базе знаний..." class="search-input">
        </div>
        <div class="kb-list" id="kbList">
          ${filtered.map(a => {
            const author = DB.getUserById(a.author);
            return `
              <div class="kb-card" data-page="kb-detail" data-id="${a.id}">
                <div class="kb-card-category">${DB.KB_CATEGORY_LABELS[a.category]}</div>
                <h4 class="kb-card-title">${a.title}</h4>
                <div class="kb-card-tags">
                  ${(a.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
                </div>
                <div class="kb-card-footer">
                  <span>${author?.name.split(' ').slice(0, 2).join(' ') || ''}</span>
                  <span>Обновлено: ${this.formatDate(a.updatedAt)}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  renderKBDetail() {
    const article = DB.getKB().find(a => a.id === this.params.id);
    if (!article) return '<p>Статья не найдена</p>';
    const author = DB.getUserById(article.author);
    const canEdit = this.hasPermission('edit_kb');
    const canDelete = this.hasPermission('delete_kb');

    return `
      <div class="detail-page">
        <button class="btn btn-ghost" data-page="knowledge">← Назад к базе знаний</button>
        <div class="detail-card">
          <div class="detail-top">
            <span class="kb-detail-category">${DB.KB_CATEGORY_LABELS[article.category]}</span>
          </div>
          <h2>${article.title}</h2>
          <div class="detail-meta">
            <span>Автор: ${author?.name || 'Неизвестно'}</span>
            <span>Создано: ${this.formatDate(article.createdAt)}</span>
            <span>Обновлено: ${this.formatDate(article.updatedAt)}</span>
          </div>
          <div class="kb-tags">
            ${(article.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
          <div class="detail-description article-content">
            ${this.renderMarkdown(article.content)}
          </div>
          <div class="detail-actions">
            ${canDelete ? `<button class="btn btn-danger" id="deleteKBBtn" data-id="${article.id}">Удалить</button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  renderCreateKB() {
    return `
      <div class="detail-page">
        <button class="btn btn-ghost" data-page="knowledge">← Назад</button>
        <div class="detail-card">
          <h2>Создать статью</h2>
          <form id="createKBForm" class="form">
            <div class="form-group">
              <label>Заголовок</label>
              <input type="text" id="kbTitle" required placeholder="Заголовок статьи">
            </div>
            <div class="form-group">
              <label>Категория</label>
              <select id="kbCategory">
                ${Object.entries(DB.KB_CATEGORY_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Содержание (Markdown)</label>
              <textarea id="kbContent" rows="15" required placeholder="## Заголовок\n\nТекст статьи..."></textarea>
            </div>
            <div class="form-group">
              <label>Теги (через запятую)</label>
              <input type="text" id="kbTags" placeholder="кардиология, протокол, лечение">
            </div>
            <button type="submit" class="btn btn-primary">Опубликовать</button>
          </form>
        </div>
      </div>
    `;
  },

  // ============ PROFILE ============
  renderProfile() {
    const user = this.currentUser;
    const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2);
    const tasks = DB.getTasks().filter(t => t.assignedTo === user.id);
    const completed = tasks.filter(t => t.status === 'completed').length;
    const ratings = DB.getUserRatings(user.id);
    const avgRating = DB.getAverageRating(user.id) || user.rating;

    return `
      <div class="profile-page">
        <div class="profile-header-card">
          <div class="profile-avatar-section">
            <div class="profile-avatar ${user.avatar ? 'has-image' : ''}">
              ${user.avatar ? `<img src="${user.avatar}" alt="Аватар">` : `<span>${initials}</span>`}
            </div>
            <label class="btn btn-sm btn-ghost profile-upload-btn" for="avatarInput">Сменить фото</label>
            <input type="file" id="avatarInput" accept="image/*" class="hidden">
          </div>
          <div class="profile-info">
            <h2>${user.name}</h2>
            <p class="profile-role">${DB.ROLE_LABELS[user.role]} — ${user.specialty}</p>
            <div class="profile-stats">
              <div class="profile-stat">
                <span class="profile-stat-value">${user.coins}</span>
                <span class="profile-stat-label">Ист Коинов</span>
              </div>
              <div class="profile-stat">
                <span class="profile-stat-value">${completed}</span>
                <span class="profile-stat-label">Задач</span>
              </div>
              <div class="profile-stat">
                <span class="profile-stat-value">${ratings.length}</span>
                <span class="profile-stat-label">Отзывов</span>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-grid">
          <div class="card">
            <div class="card-header"><h3>Личные данные</h3></div>
            <div class="card-body">
              <form id="profileForm" class="form">
                <div class="form-group">
                  <label>ФИО</label>
                  <input type="text" id="profileName" value="${user.name}" required>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Телефон</label>
                    <input type="text" id="profilePhone" value="${user.phone || ''}" placeholder="+7 (999) 123-45-67">
                  </div>
                  <div class="form-group">
                    <label>Email</label>
                    <input type="text" id="profileEmail" value="${user.email || ''}" placeholder="email@clinic.ru">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Специальность</label>
                    <input type="text" id="profileSpecialty" value="${user.specialty || ''}">
                  </div>
                  <div class="form-group">
                    <label>Дата рождения</label>
                    <input type="date" id="profileBirthday" value="${user.birthday || ''}">
                  </div>
                </div>
                <div class="form-group">
                  <label>О себе</label>
                  <textarea id="profileBio" rows="3" placeholder="Расскажите о себе...">${user.bio || ''}</textarea>
                </div>
                <button type="submit" class="btn btn-primary">Сохранить изменения</button>
              </form>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>Отзывы коллег</h3></div>
            <div class="card-body">
              ${ratings.length === 0
                ? '<p class="empty-text">Пока нет отзывов</p>'
                : ratings.map(r => {
                    const reviewer = DB.getUserById(r.ratedBy);
                    return `
                      <div class="review-item">
                        <div class="review-header">
                          <strong>${reviewer?.name.split(' ').slice(0, 2).join(' ') || 'Аноним'}</strong>
                          <span class="rating-stars">${this.renderStars(r.score)}</span>
                        </div>
                        ${r.comment ? `<p class="review-text">${r.comment}</p>` : ''}
                        <span class="review-date">${this.formatDate(r.createdAt)}</span>
                      </div>
                    `;
                  }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ============ MY TODOS ============
  renderMyTodos() {
    const user = this.currentUser;
    const todos = DB.getUserTodos(user.id);
    const active = todos.filter(t => !t.isDone);
    const done = todos.filter(t => t.isDone);
    const filter = this.params.todoFilter || 'active';

    const list = filter === 'done' ? done : filter === 'all' ? todos : active;

    return `
      <div class="todos-page">
        <div class="page-actions">
          <div class="filter-tabs">
            <button class="tab ${filter === 'active' ? 'active' : ''}" data-todo-filter="active">Активные (${active.length})</button>
            <button class="tab ${filter === 'done' ? 'active' : ''}" data-todo-filter="done">Выполненные (${done.length})</button>
            <button class="tab ${filter === 'all' ? 'active' : ''}" data-todo-filter="all">Все (${todos.length})</button>
          </div>
        </div>

        <div class="todo-add-card card">
          <div class="card-body">
            <form id="addTodoForm" class="todo-add-form">
              <input type="text" id="todoTitle" placeholder="Что нужно сделать?" required class="todo-input">
              <input type="text" id="todoDesc" placeholder="Описание (необязательно)" class="todo-input-desc">
              <div class="todo-add-row">
                <select id="todoPriority" class="todo-select">
                  <option value="low">Низкий</option>
                  <option value="medium" selected>Средний</option>
                  <option value="high">Высокий</option>
                </select>
                <input type="date" id="todoDueDate" class="todo-date">
                <button type="submit" class="btn btn-primary btn-sm">Добавить</button>
              </div>
            </form>
          </div>
        </div>

        <div class="todos-list">
          ${list.length === 0
            ? '<div class="empty-state"><p>Нет задач</p></div>'
            : list.map(t => `
              <div class="todo-item ${t.isDone ? 'todo-done' : ''} todo-priority-${t.priority}">
                <label class="todo-checkbox">
                  <input type="checkbox" ${t.isDone ? 'checked' : ''} data-todo-toggle="${t.id}">
                  <span class="todo-checkmark"></span>
                </label>
                <div class="todo-content">
                  <div class="todo-title">${t.title}</div>
                  ${t.description ? `<div class="todo-desc">${t.description}</div>` : ''}
                  <div class="todo-meta">
                    <span class="task-priority priority-${t.priority}">${t.priority === 'high' ? 'Высокий' : t.priority === 'medium' ? 'Средний' : 'Низкий'}</span>
                    ${t.dueDate ? `<span class="todo-due ${new Date(t.dueDate) < new Date() && !t.isDone ? 'overdue' : ''}">${this.formatDate(t.dueDate)}</span>` : ''}
                  </div>
                </div>
                <button class="btn btn-sm btn-ghost todo-delete" data-todo-delete="${t.id}">✕</button>
              </div>
            `).join('')}
        </div>
      </div>
    `;
  },

  // ============ RATING ============
  renderRating() {
    const leaderboard = DB.getLeaderboard();
    const user = this.currentUser;

    return `
      <div class="rating-page">
        <div class="rating-my-card">
          <div class="rating-my-info">
            <div class="avatar avatar-lg">${user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
            <div>
              <h3>${user.name}</h3>
              <p>${DB.ROLE_LABELS[user.role]} — ${user.specialty}</p>
            </div>
          </div>
          <div class="rating-my-stats">
            <div class="rating-stat">
              <div class="rating-stat-value">${user.rating.toFixed(1)}</div>
              <div class="rating-stat-label">Рейтинг</div>
              <div class="rating-stars">${this.renderStars(user.rating)}</div>
            </div>
            <div class="rating-stat">
              <div class="rating-stat-value">${user.coins}</div>
              <div class="rating-stat-label">Ист Коинов</div>
            </div>
            <div class="rating-stat">
              <div class="rating-stat-value">${user.tasksCompleted}</div>
              <div class="rating-stat-label">Задач выполнено</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Таблица лидеров</h3>
          </div>
          <div class="card-body">
            <table class="rating-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Врач</th>
                  <th>Специальность</th>
                  <th>Рейтинг</th>
                  <th>Отзывов</th>
                  <th>Задач</th>
                  <th>Ист Коины</th>
                  <th>Оценить</th>
                </tr>
              </thead>
              <tbody>
                ${leaderboard.map(u => {
                  const reviewCount = DB.getUserRatings(u.id).length;
                  const myReview = DB.getUserRatings(u.id).find(r => r.ratedBy === user.id);
                  return `
                    <tr class="${u.id === user.id ? 'highlight-row' : ''}">
                      <td><span class="leader-rank ${u.rank <= 3 ? 'top-' + u.rank : ''}">#${u.rank}</span></td>
                      <td>${u.name}</td>
                      <td>${u.specialty}</td>
                      <td>${this.renderStars(u.rating)} ${u.rating.toFixed(1)}</td>
                      <td>${reviewCount}</td>
                      <td>${u.tasksCompleted}</td>
                      <td><strong>${u.coins} ◆</strong></td>
                      <td>
                        ${u.id !== user.id ? `
                          <button class="btn btn-sm btn-ghost rate-user-btn" data-user-id="${u.id}" data-user-name="${u.name}">${myReview ? 'Изменить' : 'Оценить'}</button>
                        ` : '—'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div id="ratingModal" class="modal hidden">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <h3 id="ratingModalTitle">Оценить врача</h3>
          <form id="rateUserForm" class="form">
            <input type="hidden" id="rateUserId">
            <div class="form-group">
              <label>Оценка</label>
              <div class="star-picker" id="starPicker">
                ${[1,2,3,4,5].map(i => `<span class="star-pick" data-score="${i}">☆</span>`).join('')}
              </div>
              <input type="hidden" id="rateScore" value="0">
            </div>
            <div class="form-group">
              <label>Комментарий (необязательно)</label>
              <textarea id="rateComment" rows="3" placeholder="Ваш отзыв..."></textarea>
            </div>
            <div class="detail-actions">
              <button type="submit" class="btn btn-primary">Отправить оценку</button>
              <button type="button" class="btn btn-ghost" id="closeRatingModal">Отмена</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  // ============ WALLET ============
  renderWallet() {
    const user = this.currentUser;
    const transactions = DB.getUserTransactions(user.id);
    const earned = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const spent = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

    return `
      <div class="wallet-page">
        <div class="wallet-balance">
          <div class="wallet-balance-main">
            <span class="wallet-coin-icon">◆</span>
            <span class="wallet-amount">${user.coins}</span>
          </div>
          <p>Ваш баланс</p>
        </div>
        <div class="wallet-stats">
          <div class="wallet-stat earned">
            <span class="wallet-stat-label">Заработано</span>
            <span class="wallet-stat-value">+${earned} ◆</span>
          </div>
          <div class="wallet-stat spent">
            <span class="wallet-stat-label">Потрачено</span>
            <span class="wallet-stat-value">-${spent} ◆</span>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>История транзакций</h3>
          </div>
          <div class="card-body">
            ${transactions.length === 0
              ? '<p class="empty-text">Нет транзакций</p>'
              : transactions.map(t => `
                <div class="transaction-row">
                  <div class="transaction-info">
                    <div class="transaction-icon ${t.amount > 0 ? 'earned' : 'spent'}">${t.amount > 0 ? '↑' : '↓'}</div>
                    <div>
                      <div class="transaction-desc">${t.description}</div>
                      <div class="transaction-date">${this.formatDate(t.date)}</div>
                    </div>
                  </div>
                  <div class="transaction-amount ${t.amount > 0 ? 'positive' : 'negative'}">
                    ${t.amount > 0 ? '+' : ''}${t.amount} ◆
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>Потратить Ист Коины</h3>
            <a href="#" class="link" data-page="store">Перейти в магазин →</a>
          </div>
          <div class="card-body">
            <p class="empty-text">Покупайте товары и привилегии за Ист Коины в <a href="#" data-page="store">Магазине</a></p>
          </div>
        </div>
      </div>
    `;
  },

  // ============ STORE ============
  renderStore() {
    const user = this.currentUser;
    const products = DB.getStoreProducts();
    const canManage = this.hasPermission('manage_users');
    const storeFilter = this.params.storeCategory || 'all';
    const activeProducts = products.filter(p => p.active);
    const filtered = storeFilter === 'all' ? activeProducts : activeProducts.filter(p => p.category === storeFilter);

    return `
      <div class="store-page">
        <div class="page-actions">
          <h3>Магазин — тратьте Ист Коины</h3>
          ${canManage ? '<button class="btn btn-primary" data-page="store-manage">⚙ Управление товарами</button>' : ''}
        </div>
        <div class="store-balance-bar">
          <span>Ваш баланс:</span>
          <strong>${user.coins} ◆ Ист Коинов</strong>
        </div>
        <div class="filter-tabs" style="margin-bottom:16px;">
          ${Object.entries(DB.STORE_CATEGORIES).map(([k, v]) => `
            <button class="tab ${storeFilter === k ? 'active' : ''}" data-store-filter="${k}">${v}</button>
          `).join('')}
        </div>
        <div class="store-grid">
          ${filtered.length === 0
            ? '<div class="empty-state"><p>Нет товаров в этой категории</p></div>'
            : filtered.map(p => `
              <div class="store-product-card">
                <div class="store-product-category-badge">${DB.STORE_CATEGORIES[p.category] || 'Другое'}</div>
                <div class="store-product-icon">${p.icon}</div>
                <h4 class="store-product-title">${p.name}</h4>
                <p class="store-product-desc">${p.description}</p>
                <div class="store-product-footer">
                  <span class="store-product-price">${p.price} ◆</span>
                  <button class="btn btn-sm ${user.coins >= p.price ? 'btn-primary' : 'btn-ghost'} buy-product-btn"
                    data-product-id="${p.id}" ${user.coins < p.price ? 'disabled title="Недостаточно Ист Коинов"' : ''}>
                    ${user.coins >= p.price ? 'Купить' : 'Недостаточно'}
                  </button>
                </div>
                ${p.stock !== null ? `<div class="store-product-stock">Осталось: ${p.stock}</div>` : ''}
              </div>
            `).join('')}
        </div>

        <div class="card" style="margin-top:20px;">
          <div class="card-header"><h3>Мои покупки</h3></div>
          <div class="card-body">
            ${(() => {
              const purchases = DB.getUserPurchases(user.id);
              return purchases.length === 0
                ? '<p class="empty-text">Вы ещё ничего не покупали</p>'
                : purchases.map(p => `
                  <div class="transaction-row">
                    <div class="transaction-info">
                      <div class="transaction-icon spent">🛒</div>
                      <div>
                        <div class="transaction-desc">${p.productName}</div>
                        <div class="transaction-date">${this.formatDate(p.date)}</div>
                      </div>
                    </div>
                    <div class="transaction-amount negative">-${p.price} ◆</div>
                  </div>
                `).join('');
            })()}
          </div>
        </div>
      </div>
    `;
  },

  renderStoreManage() {
    const products = DB.getStoreProducts();
    const editingProduct = this.params.editProductId ? DB.getStoreProducts().find(p => String(p.id) === String(this.params.editProductId)) : null;

    return `
      <div class="detail-page">
        <button class="btn btn-ghost" data-page="store">← Назад в магазин</button>
        <div class="detail-card">
          <h2>Управление товарами</h2>
          <form id="${editingProduct ? 'editProductForm' : 'addProductForm'}" class="form" style="margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--gray-200);">
            <h4 style="margin-bottom:12px;">${editingProduct ? 'Редактировать товар' : 'Добавить товар'}</h4>
            ${editingProduct ? `<input type="hidden" id="editProductId" value="${editingProduct.id}">` : ''}
            <div class="form-row">
              <div class="form-group">
                <label>Название</label>
                <input type="text" id="productName" required placeholder="Название товара" value="${editingProduct ? editingProduct.name : ''}">
              </div>
              <div class="form-group">
                <label>Иконка (эмодзи)</label>
                <input type="text" id="productIcon" value="${editingProduct ? editingProduct.icon : '🎁'}" required placeholder="🎁">
              </div>
            </div>
            <div class="form-group">
              <label>Описание</label>
              <textarea id="productDesc" rows="2" required placeholder="Описание товара">${editingProduct ? editingProduct.description : ''}</textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Категория</label>
                <select id="productCategory">
                  ${Object.entries(DB.STORE_CATEGORIES).filter(([k]) => k !== 'all').map(([k, v]) => `
                    <option value="${k}" ${editingProduct && editingProduct.category === k ? 'selected' : ''}>${v}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Цена (Ист Коины)</label>
                <input type="number" id="productPrice" min="1" max="10000" value="${editingProduct ? editingProduct.price : 100}" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Кол-во (пусто = безлимит)</label>
                <input type="number" id="productStock" min="0" placeholder="Безлимитно" ${editingProduct && editingProduct.stock !== null ? `value="${editingProduct.stock}"` : ''}>
              </div>
            </div>
            <div class="detail-actions">
              <button type="submit" class="btn btn-primary">${editingProduct ? 'Сохранить' : 'Добавить товар'}</button>
              ${editingProduct ? '<button type="button" class="btn btn-ghost" id="cancelEditProduct">Отмена</button>' : ''}
            </div>
          </form>
          <h4>Текущие товары (${products.length})</h4>
          <div style="margin-top:12px;">
            ${products.length === 0 ? '<p class="empty-text">Нет товаров</p>' : products.map(p => `
              <div class="store-manage-item ${!p.active ? 'store-manage-inactive' : ''}">
                <span class="store-manage-icon">${p.icon}</span>
                <div class="store-manage-info">
                  <strong>${p.name}</strong>
                  <span>${p.price} ◆ | ${DB.STORE_CATEGORIES[p.category] || 'Другое'} | ${p.stock !== null ? `${p.stock} шт.` : 'безлимит'} ${p.active ? '' : '— неактивен'}</span>
                </div>
                <button class="btn btn-sm btn-ghost edit-product-btn" data-product-id="${p.id}" title="Редактировать">✎</button>
                <button class="btn btn-sm btn-ghost toggle-product-btn" data-product-id="${p.id}">${p.active ? 'Скрыть' : 'Показать'}</button>
                <button class="btn btn-sm btn-danger delete-product-btn" data-product-id="${p.id}">✕</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ============ NOTIFICATIONS ============
  renderNotifications() {
    this.notifications.forEach(n => n.read = true);
    return `
      <div class="notifications-page" style="max-width:800px;">
        <h3 style="margin-bottom:16px;">Все уведомления</h3>
        ${this.notifications.length === 0
          ? '<div class="empty-state"><p>Нет уведомлений</p></div>'
          : `<div class="notifications-list">
              ${this.notifications.map(n => `
                <div class="notif-item ${n.page ? 'notif-clickable' : ''}" ${n.page ? `data-page="${n.page}" data-id="${n.pageId}"` : ''}>
                  <div class="notif-icon">${n.icon}</div>
                  <div class="notif-content">
                    <div class="notif-title">${n.title}</div>
                    <div class="notif-text">${n.text}</div>
                    <div class="notif-time">${n.time}</div>
                  </div>
                </div>
              `).join('')}
            </div>`}
      </div>
    `;
  },

  // ============ MESSENGER ============
  renderMessenger() {
    const user = this.currentUser;
    const users = DB.getUsers().filter(u => u.id !== user.id);
    const chatWith = this.messengerChatWith;
    const chatUser = chatWith ? DB.getUserById(chatWith) : null;

    let messages = [];
    if (chatWith) {
      messages = DB.getConversation(user.id, chatWith);
      // Mark as read
      messages.forEach(m => {
        if (String(m.toUserId) === String(user.id) && !m.read) {
          DB.markMessageRead(m.id);
        }
      });
    }

    // Group conversations
    const conversations = [];
    const seen = new Set();
    const allMessages = DB.getUserMessages(user.id);
    allMessages.forEach(m => {
      const otherId = String(m.fromUserId) === String(user.id) ? m.toUserId : m.fromUserId;
      if (!seen.has(otherId)) {
        seen.add(otherId);
        const other = DB.getUserById(otherId);
        const unread = allMessages.filter(x => String(x.fromUserId) === String(otherId) && String(x.toUserId) === String(user.id) && !x.read).length;
        conversations.push({ user: other, lastMessage: m, unread });
      }
    });

    return `
      <div class="messenger-page">
        <div class="messenger-layout">
          <div class="messenger-sidebar ${chatWith ? 'messenger-sidebar-hidden-mobile' : ''}">
            <div class="messenger-search">
              <input type="text" id="messengerSearch" placeholder="Поиск сотрудника..." class="search-input">
            </div>
            <div class="messenger-contacts" id="messengerContacts">
              ${users.map(u => {
                const conv = conversations.find(c => c.user?.id === u.id);
                const unread = conv?.unread || 0;
                return `
                  <div class="messenger-contact ${String(chatWith) === String(u.id) ? 'active' : ''}" data-chat-user="${u.id}">
                    <div class="avatar" style="width:36px;height:36px;font-size:12px;">${u.avatar ? `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                    <div class="messenger-contact-info">
                      <div class="messenger-contact-name">${u.name.split(' ').slice(0, 2).join(' ')}</div>
                      <div class="messenger-contact-role">${u.specialty || DB.ROLE_LABELS[u.role]}</div>
                    </div>
                    ${unread > 0 ? `<span class="nav-badge">${unread}</span>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div class="messenger-chat ${!chatWith ? 'messenger-chat-empty' : ''}">
            ${!chatWith ? `
              <div class="messenger-empty">
                <div style="font-size:48px;margin-bottom:16px;">💬</div>
                <p>Выберите сотрудника для начала разговора</p>
              </div>
            ` : `
              <div class="messenger-chat-header">
                <button class="btn btn-sm btn-ghost messenger-back-btn" id="messengerBackBtn">←</button>
                <div class="avatar" style="width:32px;height:32px;font-size:11px;">${chatUser ? chatUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}</div>
                <div>
                  <strong>${chatUser ? chatUser.name.split(' ').slice(0, 2).join(' ') : 'Пользователь'}</strong>
                  <div style="font-size:12px;color:var(--gray-500);">${chatUser?.specialty || ''}</div>
                </div>
              </div>
              <div class="messenger-messages" id="messengerMessages">
                ${messages.length === 0 ? '<p class="empty-text" style="margin-top:40px;">Начните разговор</p>' : messages.map(m => `
                  <div class="message ${String(m.fromUserId) === String(user.id) ? 'message-own' : 'message-other'}">
                    <div class="message-bubble">
                      ${m.text ? `<span>${m.text}</span>` : ''}
                      ${m.fileUrl ? `
                        <div class="message-file">
                          ${m.fileType && m.fileType.startsWith('image/') ? `
                            <a href="${m.fileUrl}" target="_blank" class="message-image-preview">
                              <img src="${m.fileUrl}" alt="${m.fileName}" loading="lazy">
                            </a>
                          ` : `
                            <a href="${m.fileUrl}" target="_blank" class="message-file-link">
                              <span class="message-file-icon">${this.getFileIcon(m.fileType)}</span>
                              <span class="message-file-name">${m.fileName}</span>
                              <span class="message-file-size">${this.formatFileSize(m.fileSize)}</span>
                            </a>
                          `}
                        </div>
                      ` : ''}
                    </div>
                    <div class="message-time">${this.formatMessageTime(m.createdAt)}</div>
                  </div>
                `).join('')}
              </div>
              <div class="messenger-file-preview hidden" id="messengerFilePreview">
                <span class="messenger-file-preview-name" id="messengerFileName"></span>
                <button type="button" class="btn btn-sm btn-ghost" id="messengerFileRemove">✕</button>
              </div>
              <form class="messenger-input-form" id="messengerForm">
                <label class="messenger-attach-btn" for="messengerFileInput" title="Прикрепить файл">📎</label>
                <input type="file" id="messengerFileInput" class="hidden">
                <input type="text" id="messengerInput" placeholder="Введите сообщение..." autocomplete="off">
                <button type="submit" class="btn btn-primary btn-sm">Отправить</button>
              </form>
            `}
          </div>
        </div>
      </div>
    `;
  },

  formatMessageTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  },

  // ============ USERS (ADMIN) ============
  renderUsers() {
    const users = DB.getUsers();
    return `
      <div class="users-page">
        <div class="page-actions">
          <h3>Все пользователи</h3>
          <button class="btn btn-primary" id="addUserBtn">+ Добавить пользователя</button>
        </div>
        <table class="users-table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Логин</th>
              <th>Роль</th>
              <th>Специальность</th>
              <th>Ист Коины</th>
              <th>Рейтинг</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>${u.name}</td>
                <td><code>${u.login}</code></td>
                <td>
                  <select class="role-select" data-user-id="${u.id}" ${u.id === this.currentUser.id ? 'disabled' : ''}>
                    ${Object.entries(DB.ROLE_LABELS).map(([k, v]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${v}</option>`).join('')}
                  </select>
                </td>
                <td>${u.specialty}</td>
                <td>${u.coins} ◆</td>
                <td>${u.rating.toFixed(1)}</td>
                <td>
                  ${u.id !== this.currentUser.id ? `
                    <button class="btn btn-sm btn-ghost award-coins-btn" data-user-id="${u.id}" data-name="${u.name}">+ Коины</button>
                  ` : '—'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div id="modal" class="modal hidden">
        <div class="modal-overlay"></div>
        <div class="modal-content"></div>
      </div>
    `;
  },

  // ============ EVENT BINDING ============
  bindPageEvents() {
    // Mobile menu toggle
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('mobileMenuBtn');

    const closeMobileMenu = () => {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('open');
    };

    menuBtn?.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('open');
    });

    overlay?.addEventListener('click', closeMobileMenu);

    // Navigation
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        const page = el.dataset.page;
        const id = el.dataset.id;
        this.navigate(page, id ? { id } : {});
      });
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      DB.logout();
      this.currentUser = null;
      this.navigate('login');
    });

    // Task filters
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.params.filter = btn.dataset.filter;
        this.render();
      });
    });

    // KB filters
    document.querySelectorAll('[data-kb-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigate('knowledge', { category: btn.dataset.kbFilter });
      });
    });

    // KB search
    document.getElementById('kbSearch')?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.kb-card').forEach(card => {
        const title = card.querySelector('.kb-card-title')?.textContent.toLowerCase() || '';
        const tags = card.querySelector('.kb-card-tags')?.textContent.toLowerCase() || '';
        card.style.display = (title.includes(query) || tags.includes(query)) ? '' : 'none';
      });
    });

    // Take task
    document.getElementById('takeTaskBtn')?.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      DB.updateTask(id, { assignedTo: this.currentUser.id, status: 'in_progress' });
      this.navigate('task-detail', { id });
    });

    // Submit task for review
    document.getElementById('submitTaskBtn')?.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      DB.updateTask(id, { status: 'review' });
      this.navigate('task-detail', { id });
    });

    // Approve task
    document.getElementById('approveTaskBtn')?.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const task = DB.getTaskById(id);
      DB.updateTask(id, { status: 'completed', completedAt: new Date().toISOString().split('T')[0] });
      if (task.assignedTo) {
        const user = DB.getUserById(task.assignedTo);
        DB.updateUser(task.assignedTo, {
          coins: user.coins + task.reward,
          tasksCompleted: user.tasksCompleted + 1
        });
        DB.addTransaction({
          userId: task.assignedTo,
          amount: task.reward,
          type: 'earned',
          description: task.title,
          taskId: task.id,
          date: new Date().toISOString().split('T')[0]
        });
        if (task.assignedTo === this.currentUser.id) {
          this.currentUser = DB.getUserById(this.currentUser.id);
        }
      }
      this.navigate('task-detail', { id });
    });

    // Reject task
    document.getElementById('rejectTaskBtn')?.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      DB.updateTask(id, { status: 'in_progress' });
      this.navigate('task-detail', { id });
    });

    // Delete task
    document.getElementById('deleteTaskBtn')?.addEventListener('click', (e) => {
      if (confirm('Удалить задачу?')) {
        DB.deleteTask(e.target.dataset.id);
        this.navigate('tasks');
      }
    });

    // Delete news
    document.getElementById('deleteNewsBtn')?.addEventListener('click', (e) => {
      if (confirm('Удалить новость?')) {
        DB.deleteNews(e.target.dataset.id);
        this.navigate('news');
      }
    });

    // Delete KB
    document.getElementById('deleteKBBtn')?.addEventListener('click', (e) => {
      if (confirm('Удалить статью?')) {
        DB.deleteKBArticle(e.target.dataset.id);
        this.navigate('knowledge');
      }
    });

    // Create task form
    document.getElementById('createTaskForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const tagsVal = document.getElementById('taskTags')?.value || '';
      const tags = tagsVal.split(',').map(t => t.trim()).filter(Boolean);
      const estHours = document.getElementById('taskEstimatedHours')?.value;
      DB.addTask({
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDesc').value,
        category: document.getElementById('taskCategory').value,
        priority: document.getElementById('taskPriority').value,
        reward: parseInt(document.getElementById('taskReward').value),
        deadline: document.getElementById('taskDeadline').value || null,
        estimatedHours: estHours ? parseFloat(estHours) : null,
        actualHours: null,
        tags: tags,
        notes: document.getElementById('taskNotes')?.value || null,
        status: 'open',
        assignedTo: null,
        createdBy: this.currentUser.id,
        createdAt: new Date().toISOString().split('T')[0],
        completedAt: null
      });
      this.navigate('tasks');
    });

    // Create news form
    document.getElementById('createNewsForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      DB.addNews({
        title: document.getElementById('newsTitle').value,
        content: document.getElementById('newsContent').value,
        category: document.getElementById('newsCategory').value,
        author: this.currentUser.id,
        createdAt: new Date().toISOString().split('T')[0],
        pinned: document.getElementById('newsPinned').checked
      });
      this.navigate('news');
    });

    // Create KB form
    document.getElementById('createKBForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const tags = document.getElementById('kbTags').value.split(',').map(t => t.trim()).filter(Boolean);
      const now = new Date().toISOString().split('T')[0];
      DB.addKBArticle({
        title: document.getElementById('kbTitle').value,
        content: document.getElementById('kbContent').value,
        category: document.getElementById('kbCategory').value,
        author: this.currentUser.id,
        createdAt: now,
        updatedAt: now,
        tags
      });
      this.navigate('knowledge');
    });

    // Admin: role change
    document.querySelectorAll('.role-select').forEach(sel => {
      sel.addEventListener('change', () => {
        DB.updateUser(sel.dataset.userId, { role: sel.value });
      });
    });

    // Admin: award coins
    document.querySelectorAll('.award-coins-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = prompt(`Начислить Ист Коины для ${btn.dataset.name}.\nВведите количество:`);
        if (amount && !isNaN(amount) && parseInt(amount) > 0) {
          const userId = btn.dataset.userId;
          const user = DB.getUserById(userId);
          DB.updateUser(userId, { coins: user.coins + parseInt(amount) });
          DB.addTransaction({
            userId,
            amount: parseInt(amount),
            type: 'earned',
            description: 'Начислено администратором',
            taskId: null,
            date: new Date().toISOString().split('T')[0]
          });
          this.render();
        }
      });
    });

    // Profile form
    document.getElementById('profileForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const updates = {
        name: document.getElementById('profileName').value,
        phone: document.getElementById('profilePhone').value || null,
        email: document.getElementById('profileEmail').value || null,
        specialty: document.getElementById('profileSpecialty').value,
        birthday: document.getElementById('profileBirthday').value || null,
        bio: document.getElementById('profileBio').value || null
      };
      DB.updateUser(this.currentUser.id, updates);
      this.currentUser = DB.getUserById(this.currentUser.id);
      this.navigate('profile');
    });

    // Avatar upload with validation & spinner
    document.getElementById('avatarInput')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const errors = this.validateImageFile(file);
      if (errors.length > 0) {
        alert(errors.join('\n'));
        e.target.value = '';
        return;
      }
      const avatarSection = document.querySelector('.profile-avatar-section');
      if (avatarSection) {
        const origHTML = avatarSection.innerHTML;
        avatarSection.innerHTML = '<div class="spinner-inline"><div class="spinner"></div><span class="spinner-text">Загрузка фото...</span></div>';
        const url = await DB.uploadAvatar(this.currentUser.id, file);
        if (url) {
          this.currentUser = DB.getUserById(this.currentUser.id);
          this.render();
        } else {
          avatarSection.innerHTML = origHTML;
          alert('Ошибка загрузки аватара');
        }
      }
    });

    // Task file upload with validation & spinner (input + drag-and-drop)
    const dropZone = document.getElementById('dropZone');
    const taskFileInput = document.getElementById('taskFileInput');

    const handleTaskFiles = async (files) => {
      if (!files || !files.length) return;
      const allErrors = [];
      for (const file of files) {
        const errors = this.validateFile(file);
        if (errors.length > 0) allErrors.push(...errors);
      }
      if (allErrors.length > 0) {
        alert('Ошибки валидации:\n' + allErrors.join('\n'));
        if (taskFileInput) taskFileInput.value = '';
        return;
      }
      const taskId = this.params.id;
      const progressEl = document.getElementById('uploadProgress');
      const contentEl = dropZone?.querySelector('.drop-zone-content');
      if (progressEl && contentEl) {
        contentEl.classList.add('hidden');
        progressEl.classList.remove('hidden');
        const textEl = document.getElementById('uploadProgressText');
        if (textEl) textEl.textContent = `Загрузка файлов (0/${files.length})...`;
      }
      let uploaded = 0;
      for (const file of files) {
        await DB.uploadTaskFile(taskId, file, this.currentUser.id);
        uploaded++;
        const textEl = document.getElementById('uploadProgressText');
        if (textEl) textEl.textContent = `Загрузка файлов (${uploaded}/${files.length})...`;
      }
      this.navigate('task-detail', { id: taskId });
    };

    taskFileInput?.addEventListener('change', (e) => handleTaskFiles(e.target.files));

    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drop-zone-active');
      });
      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drop-zone-active');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drop-zone-active');
        handleTaskFiles(e.dataTransfer.files);
      });
    }

    // Delete attachment
    document.querySelectorAll('[data-delete-attachment]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Удалить вложение?')) {
          DB.deleteTaskAttachment(btn.dataset.deleteAttachment);
          this.navigate('task-detail', { id: this.params.id });
        }
      });
    });

    // Todo filters
    document.querySelectorAll('[data-todo-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.params.todoFilter = btn.dataset.todoFilter;
        this.render();
      });
    });

    // Add todo
    document.getElementById('addTodoForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      DB.addTodo({
        userId: this.currentUser.id,
        title: document.getElementById('todoTitle').value,
        description: document.getElementById('todoDesc').value || null,
        priority: document.getElementById('todoPriority').value,
        isDone: false,
        dueDate: document.getElementById('todoDueDate').value || null,
        createdAt: new Date().toISOString(),
        completedAt: null
      });
      this.render();
    });

    // Toggle todo
    document.querySelectorAll('[data-todo-toggle]').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.todoToggle;
        const isDone = cb.checked;
        DB.updateTodo(id, {
          isDone,
          completedAt: isDone ? new Date().toISOString() : null
        });
        this.render();
      });
    });

    // Delete todo
    document.querySelectorAll('[data-todo-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        DB.deleteTodo(btn.dataset.todoDelete);
        this.render();
      });
    });

    // Rate user modal
    document.querySelectorAll('.rate-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = document.getElementById('ratingModal');
        if (modal) {
          modal.classList.remove('hidden');
          document.getElementById('rateUserId').value = btn.dataset.userId;
          document.getElementById('ratingModalTitle').textContent = `Оценить: ${btn.dataset.userName}`;
          // Reset stars
          document.querySelectorAll('.star-pick').forEach(s => s.textContent = '☆');
          document.getElementById('rateScore').value = '0';
          document.getElementById('rateComment').value = '';
        }
      });
    });

    // Star picker
    document.querySelectorAll('.star-pick').forEach(star => {
      star.addEventListener('click', () => {
        const score = parseInt(star.dataset.score);
        document.getElementById('rateScore').value = score;
        document.querySelectorAll('.star-pick').forEach(s => {
          s.textContent = parseInt(s.dataset.score) <= score ? '★' : '☆';
        });
      });
    });

    // Close rating modal
    document.getElementById('closeRatingModal')?.addEventListener('click', () => {
      document.getElementById('ratingModal')?.classList.add('hidden');
    });
    document.querySelector('#ratingModal .modal-overlay')?.addEventListener('click', () => {
      document.getElementById('ratingModal')?.classList.add('hidden');
    });

    // Submit rating
    document.getElementById('rateUserForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const score = parseInt(document.getElementById('rateScore').value);
      if (score < 1 || score > 5) { alert('Выберите оценку от 1 до 5'); return; }
      DB.addUserRating({
        userId: document.getElementById('rateUserId').value,
        ratedBy: this.currentUser.id,
        score,
        comment: document.getElementById('rateComment').value || null,
        createdAt: new Date().toISOString().split('T')[0]
      });
      document.getElementById('ratingModal')?.classList.add('hidden');
      this.render();
    });

    // Store: category filter
    document.querySelectorAll('[data-store-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.params.storeCategory = btn.dataset.storeFilter;
        this.render();
      });
    });

    // Store: buy product
    document.querySelectorAll('.buy-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.dataset.productId;
        const product = DB.getStoreProducts().find(p => p.id === productId);
        if (!product) return;
        if (this.currentUser.coins < product.price) {
          alert('Недостаточно Ист Коинов');
          return;
        }
        if (confirm(`Купить "${product.name}" за ${product.price} ◆?`)) {
          DB.purchaseProduct(this.currentUser.id, productId);
          this.currentUser = DB.getUserById(this.currentUser.id);
          this.render();
        }
      });
    });

    // Store: add product form
    document.getElementById('addProductForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const stock = document.getElementById('productStock')?.value;
      DB.addStoreProduct({
        name: document.getElementById('productName').value,
        icon: document.getElementById('productIcon').value,
        description: document.getElementById('productDesc').value,
        category: document.getElementById('productCategory')?.value || 'other',
        price: parseInt(document.getElementById('productPrice').value),
        stock: stock ? parseInt(stock) : null,
        active: true,
        createdBy: this.currentUser.id,
        createdAt: new Date().toISOString()
      });
      this.render();
    });

    // Store: edit product form
    document.getElementById('editProductForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editProductId')?.value;
      const stock = document.getElementById('productStock')?.value;
      DB.updateStoreProduct(id, {
        name: document.getElementById('productName').value,
        icon: document.getElementById('productIcon').value,
        description: document.getElementById('productDesc').value,
        category: document.getElementById('productCategory')?.value || 'other',
        price: parseInt(document.getElementById('productPrice').value),
        stock: stock ? parseInt(stock) : null
      });
      this.params.editProductId = null;
      this.render();
    });

    // Store: cancel edit
    document.getElementById('cancelEditProduct')?.addEventListener('click', () => {
      this.params.editProductId = null;
      this.render();
    });

    // Store: edit product button
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.params.editProductId = btn.dataset.productId;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Store: toggle product
    document.querySelectorAll('.toggle-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = DB.getStoreProducts().find(p => p.id === btn.dataset.productId);
        if (product) {
          DB.updateStoreProduct(product.id, { active: !product.active });
          this.render();
        }
      });
    });

    // Store: delete product
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Удалить товар?')) {
          DB.deleteStoreProduct(btn.dataset.productId);
          this.render();
        }
      });
    });

    // Messenger: select contact
    document.querySelectorAll('.messenger-contact').forEach(el => {
      el.addEventListener('click', () => {
        this.messengerChatWith = el.dataset.chatUser;
        this.render();
        // Scroll to bottom
        const msgs = document.getElementById('messengerMessages');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
      });
    });

    // Messenger: file attachment
    this._messengerFile = null;
    const messengerFileInput = document.getElementById('messengerFileInput');
    const filePreview = document.getElementById('messengerFilePreview');
    const fileNameEl = document.getElementById('messengerFileName');

    messengerFileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const errors = this.validateFile(file);
      if (errors.length > 0) {
        alert(errors.join('\n'));
        e.target.value = '';
        return;
      }
      this._messengerFile = file;
      if (fileNameEl) fileNameEl.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
      filePreview?.classList.remove('hidden');
    });

    document.getElementById('messengerFileRemove')?.addEventListener('click', () => {
      this._messengerFile = null;
      if (messengerFileInput) messengerFileInput.value = '';
      filePreview?.classList.add('hidden');
    });

    // Messenger: send message
    document.getElementById('messengerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('messengerInput');
      const text = input.value.trim();
      if (!text && !this._messengerFile) return;
      if (!this.messengerChatWith) return;

      const msg = {
        fromUserId: this.currentUser.id,
        toUserId: this.messengerChatWith,
        text: text || '',
        read: false,
        fileName: null,
        fileUrl: null,
        fileSize: null,
        fileType: null,
        createdAt: new Date().toISOString()
      };

      if (this._messengerFile) {
        const submitBtn = document.querySelector('#messengerForm button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '...'; }
        const fileData = await DB.uploadMessageFile(this._messengerFile);
        if (fileData) {
          msg.fileName = fileData.fileName;
          msg.fileUrl = fileData.fileUrl;
          msg.fileSize = fileData.fileSize;
          msg.fileType = fileData.fileType;
        }
        this._messengerFile = null;
      }

      DB.addMessage(msg);
      input.value = '';
      if (messengerFileInput) messengerFileInput.value = '';
      filePreview?.classList.add('hidden');
      this.render();
      const msgs = document.getElementById('messengerMessages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    });

    // Messenger: back button (mobile)
    document.getElementById('messengerBackBtn')?.addEventListener('click', () => {
      this.messengerChatWith = null;
      this.render();
    });

    // Messenger: search
    document.getElementById('messengerSearch')?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.messenger-contact').forEach(el => {
        const name = el.querySelector('.messenger-contact-name')?.textContent.toLowerCase() || '';
        el.style.display = name.includes(query) ? '' : 'none';
      });
    });

    // Sidebar coins click -> wallet (already handled by data-page)

    // Add user button
    document.getElementById('addUserBtn')?.addEventListener('click', () => {
      const name = prompt('ФИО нового пользователя:');
      if (!name) return;
      const login = prompt('Логин:');
      if (!login) return;
      const password = prompt('Пароль:');
      if (!password) return;
      const specialty = prompt('Специальность:') || 'Общая практика';

      DB.addUser({
        login, password, name, specialty,
        role: 'doctor',
        coins: 0,
        rating: 0,
        tasksCompleted: 0,
        avatar: null,
        createdAt: new Date().toISOString().split('T')[0]
      });
      this.render();
    });
  },

  // ============ HELPERS ============
  getFileIcon(mimeType) {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📗';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📙';
    return '📄';
  },

  formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / 1048576).toFixed(1) + ' МБ';
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(empty);
  },

  renderMarkdown(text) {
    return text
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/^• (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }
};

// Start the app
document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  App.init();
});
