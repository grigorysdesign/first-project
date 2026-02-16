-- ============================================
-- ClinicHub — Схема базы данных
-- СУБД: PostgreSQL (легко адаптировать под MySQL)
-- ============================================

-- =====================
-- 1. ПОЛЬЗОВАТЕЛИ
-- =====================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    login       VARCHAR(50)  UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,  -- хранить bcrypt-хеш, НЕ открытый текст
    name        VARCHAR(150) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'doctor'
                CHECK (role IN ('admin', 'head_doctor', 'doctor', 'intern')),
    specialty   VARCHAR(100),
    coins       INTEGER      NOT NULL DEFAULT 0,
    rating      NUMERIC(2,1) NOT NULL DEFAULT 0.0,
    tasks_completed INTEGER  NOT NULL DEFAULT 0,
    avatar_url  TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =====================
-- 2. ЗАДАЧИ
-- =====================
CREATE TABLE tasks (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(300) NOT NULL,
    description TEXT,
    category    VARCHAR(30)  NOT NULL
                CHECK (category IN (
                    'consultation', 'research', 'training',
                    'mentoring', 'documentation', 'emergency'
                )),
    reward      INTEGER      NOT NULL DEFAULT 0,
    status      VARCHAR(20)  NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'review', 'completed')),
    priority    VARCHAR(10)  NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    created_by  INTEGER      NOT NULL REFERENCES users(id),
    deadline    DATE,
    completed_at TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =====================
-- 3. НОВОСТИ
-- =====================
CREATE TABLE news (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(300) NOT NULL,
    content     TEXT         NOT NULL,
    category    VARCHAR(30)  NOT NULL DEFAULT 'announcement',
    author_id   INTEGER      NOT NULL REFERENCES users(id),
    pinned      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =====================
-- 4. БАЗА ЗНАНИЙ
-- =====================
CREATE TABLE knowledge_base (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(300) NOT NULL,
    content     TEXT         NOT NULL,
    category    VARCHAR(30)  NOT NULL
                CHECK (category IN (
                    'protocols', 'guidelines', 'research',
                    'training_materials', 'faq'
                )),
    author_id   INTEGER      NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Теги для статей базы знаний (связь многие-ко-многим)
CREATE TABLE kb_tags (
    id          SERIAL PRIMARY KEY,
    article_id  INTEGER NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
    tag         VARCHAR(50) NOT NULL
);
CREATE INDEX idx_kb_tags_article ON kb_tags(article_id);
CREATE INDEX idx_kb_tags_tag     ON kb_tags(tag);

-- =====================
-- 5. ТРАНЗАКЦИИ (Ист Коины)
-- =====================
CREATE TABLE transactions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(id),
    amount      INTEGER      NOT NULL,  -- положительное = заработал, отрицательное = потратил
    type        VARCHAR(10)  NOT NULL CHECK (type IN ('earned', 'spent')),
    description VARCHAR(300),
    task_id     INTEGER      REFERENCES tasks(id) ON DELETE SET NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transactions_user ON transactions(user_id);

-- =====================
-- 6. СЕССИИ (авторизация)
-- =====================
CREATE TABLE sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(255) UNIQUE NOT NULL,  -- случайный токен сессии
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMP NOT NULL
);
CREATE INDEX idx_sessions_token ON sessions(token);

-- =====================
-- ИНДЕКСЫ для частых запросов
-- =====================
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_tasks_assigned    ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by  ON tasks(created_by);
CREATE INDEX idx_news_pinned       ON news(pinned);
CREATE INDEX idx_news_created      ON news(created_at DESC);
CREATE INDEX idx_kb_category       ON knowledge_base(category);

-- =====================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- =====================
INSERT INTO users (login, password, name, role, specialty, coins, rating, tasks_completed) VALUES
    ('admin',   '$2b$10$ХЕШПАРОЛЯ', 'Иванов Сергей Петрович',       'admin',       'Администрация', 0,   0.0, 0),
    ('head',    '$2b$10$ХЕШПАРОЛЯ', 'Петрова Анна Михайловна',       'head_doctor', 'Кардиология',   500, 4.8, 45),
    ('doctor',  '$2b$10$ХЕШПАРОЛЯ', 'Сидоров Алексей Николаевич',    'doctor',      'Терапия',       320, 4.5, 28),
    ('doctor2', '$2b$10$ХЕШПАРОЛЯ', 'Козлова Мария Ивановна',        'doctor',      'Неврология',    180, 4.2, 15),
    ('intern',  '$2b$10$ХЕШПАРОЛЯ', 'Новиков Дмитрий Александрович', 'intern',      'Хирургия',      50,  3.8, 5);
