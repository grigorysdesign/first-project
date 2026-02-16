// ============================================
// Main Application - Doctor Clinic Platform
// ============================================

const App = {
  currentPage: 'login',
  currentUser: null,

  init() {
    // DB.init() теперь вызывается снаружи (async)
    this.currentUser = DB.getCurrentUser();
    if (this.currentUser) {
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

    return `
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#2563eb"/><path d="M16 8v16M8 16h16" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>
            <span>ClinicHub</span>
          </div>
        </div>
        <div class="sidebar-user">
          <div class="avatar">${user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
          <div class="user-info">
            <div class="user-name">${user.name.split(' ').slice(0, 2).join(' ')}</div>
            <div class="user-role">${role}</div>
          </div>
        </div>
        <div class="sidebar-coins">
          <span class="coin-icon">◆</span>
          <span class="coin-amount">${user.coins}</span>
          <span class="coin-label">Ист Коинов</span>
        </div>
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
    const items = [
      { page: 'dashboard', label: 'Дашборд', icon: '⊞', permission: 'view_dashboard' },
      { page: 'tasks', label: 'Задачи', icon: '☰', permission: 'view_dashboard', badge: openTasks || null },
      { page: 'news', label: 'Новости', icon: '⊕', permission: 'view_dashboard' },
      { page: 'knowledge', label: 'База знаний', icon: '⊘', permission: 'view_dashboard' },
      { page: 'rating', label: 'Рейтинг', icon: '★', permission: 'view_dashboard' },
      { page: 'wallet', label: 'Кошелёк', icon: '◆', permission: 'view_dashboard' },
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
      tasks: 'Задачи',
      news: 'Новости',
      knowledge: 'База знаний',
      rating: 'Рейтинг врачей',
      wallet: 'Кошелёк Ист Коинов',
      users: 'Управление пользователями',
      'task-detail': 'Детали задачи',
      'news-detail': 'Новость',
      'kb-detail': 'Статья',
      'create-task': 'Новая задача',
      'create-news': 'Новая новость',
      'create-kb': 'Новая статья'
    };
    return `
      <header class="page-header">
        <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Открыть меню">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h2>${titles[this.currentPage] || 'Страница'}</h2>
        <div class="header-right">
          <span class="header-date">${new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </header>
    `;
  },

  // ============ PAGE ROUTER ============
  renderPage() {
    switch (this.currentPage) {
      case 'dashboard': return this.renderDashboard();
      case 'tasks': return this.renderTasks();
      case 'task-detail': return this.renderTaskDetail();
      case 'create-task': return this.renderCreateTask();
      case 'news': return this.renderNews();
      case 'news-detail': return this.renderNewsDetail();
      case 'create-news': return this.renderCreateNews();
      case 'knowledge': return this.renderKnowledge();
      case 'kb-detail': return this.renderKBDetail();
      case 'create-kb': return this.renderCreateKB();
      case 'rating': return this.renderRating();
      case 'wallet': return this.renderWallet();
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

    return `
      <div class="dashboard">
        <div class="stats-grid">
          <div class="stat-card stat-blue">
            <div class="stat-icon">★</div>
            <div class="stat-info">
              <div class="stat-value">${user.rating.toFixed(1)}</div>
              <div class="stat-label">Рейтинг</div>
            </div>
          </div>
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
              <h3>Топ врачей</h3>
              <a href="#" class="link" data-page="rating">Весь рейтинг →</a>
            </div>
            <div class="card-body">
              ${leaderboard.map((u, i) => `
                <div class="leader-row">
                  <span class="leader-rank ${i < 3 ? 'top-' + (i + 1) : ''}">#${u.rank}</span>
                  <span class="leader-name">${u.name.split(' ').slice(0, 2).join(' ')}</span>
                  <span class="leader-coins">${u.coins} ◆</span>
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
              <a href="#" class="link" data-page="wallet">Кошелёк →</a>
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
          </div>
          <div class="detail-reward">
            <span class="reward-label">Награда:</span>
            <span class="reward-value">${task.reward} ◆ Ист Коинов</span>
          </div>
          <div class="detail-description">
            <h4>Описание</h4>
            <p>${task.description}</p>
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
                  <th>Задач</th>
                  <th>Ист Коины</th>
                </tr>
              </thead>
              <tbody>
                ${leaderboard.map(u => `
                  <tr class="${u.id === user.id ? 'highlight-row' : ''}">
                    <td><span class="leader-rank ${u.rank <= 3 ? 'top-' + u.rank : ''}">#${u.rank}</span></td>
                    <td>${u.name}</td>
                    <td>${u.specialty}</td>
                    <td>${this.renderStars(u.rating)} ${u.rating.toFixed(1)}</td>
                    <td>${u.tasksCompleted}</td>
                    <td><strong>${u.coins} ◆</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
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
          <p>Ваш баланс Ист Коинов</p>
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
          <div class="card-header"><h3>На что потратить Ист Коины</h3></div>
          <div class="card-body">
            <div class="shop-items">
              <div class="shop-item">
                <div class="shop-item-icon">🏖️</div>
                <div class="shop-item-info">
                  <h4>День отпуска</h4>
                  <p>Дополнительный день к отпуску</p>
                </div>
                <div class="shop-item-price">500 ◆</div>
              </div>
              <div class="shop-item">
                <div class="shop-item-icon">🎓</div>
                <div class="shop-item-info">
                  <h4>Конференция</h4>
                  <p>Оплата участия в конференции</p>
                </div>
                <div class="shop-item-price">300 ◆</div>
              </div>
              <div class="shop-item">
                <div class="shop-item-icon">📚</div>
                <div class="shop-item-info">
                  <h4>Курс обучения</h4>
                  <p>Повышение квалификации</p>
                </div>
                <div class="shop-item-price">400 ◆</div>
              </div>
              <div class="shop-item">
                <div class="shop-item-icon">⭐</div>
                <div class="shop-item-info">
                  <h4>Приоритет графика</h4>
                  <p>Выбор удобного графика на месяц</p>
                </div>
                <div class="shop-item-price">200 ◆</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
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
      DB.addTask({
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDesc').value,
        category: document.getElementById('taskCategory').value,
        priority: document.getElementById('taskPriority').value,
        reward: parseInt(document.getElementById('taskReward').value),
        deadline: document.getElementById('taskDeadline').value || null,
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
