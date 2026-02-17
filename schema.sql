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
-- 7. ПЕРСОНАЛЬНЫЕ ЗАДАЧИ (To-Do List)
-- =====================
CREATE TABLE user_todos (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(300) NOT NULL,
    description TEXT,
    priority    VARCHAR(10)  NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
    is_done     BOOLEAN      NOT NULL DEFAULT FALSE,
    due_date    DATE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);
CREATE INDEX idx_user_todos_user ON user_todos(user_id);

-- =====================
-- 8. ВЛОЖЕНИЯ К ЗАДАЧАМ
-- =====================
CREATE TABLE task_attachments (
    id          SERIAL PRIMARY KEY,
    task_id     INTEGER      NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_url    TEXT         NOT NULL,
    file_size   INTEGER      NOT NULL DEFAULT 0,
    file_type   VARCHAR(100),
    uploaded_by INTEGER      NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);

-- =====================
-- 9. РЕЙТИНГ / ОТЗЫВЫ
-- =====================
CREATE TABLE user_ratings (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rated_by    INTEGER      NOT NULL REFERENCES users(id),
    score       INTEGER      NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, rated_by)
);
CREATE INDEX idx_user_ratings_user ON user_ratings(user_id);

-- =====================
-- Добавление поля birthday в users
-- =====================
ALTER TABLE users ADD COLUMN birthday DATE;
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN email VARCHAR(150);
ALTER TABLE users ADD COLUMN bio TEXT;

-- Добавление дополнительных полей в tasks
ALTER TABLE tasks ADD COLUMN estimated_hours NUMERIC(5,1);
ALTER TABLE tasks ADD COLUMN actual_hours NUMERIC(5,1);
ALTER TABLE tasks ADD COLUMN tags TEXT[];
ALTER TABLE tasks ADD COLUMN notes TEXT;

-- =====================
-- 10. ТОВАРЫ МАГАЗИНА
-- =====================
CREATE TABLE store_products (
    id          TEXT PRIMARY KEY,
    name        VARCHAR(300) NOT NULL,
    icon        VARCHAR(10) NOT NULL DEFAULT '🎁',
    description TEXT,
    price       INTEGER NOT NULL DEFAULT 0,
    stock       INTEGER,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_by  TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================
-- 11. ПОКУПКИ
-- =====================
CREATE TABLE purchases (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    product_id   TEXT NOT NULL,
    product_name VARCHAR(300),
    price        INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_purchases_user ON purchases(user_id);

-- =====================
-- 12. СООБЩЕНИЯ (МЕССЕНДЖЕР)
-- =====================
CREATE TABLE messages (
    id            TEXT PRIMARY KEY,
    from_user_id  TEXT NOT NULL,
    to_user_id    TEXT NOT NULL,
    text          TEXT NOT NULL,
    read          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_from ON messages(from_user_id);
CREATE INDEX idx_messages_to ON messages(to_user_id);

-- =====================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- =====================
INSERT INTO users (login, password, name, role, specialty, coins, rating, tasks_completed, birthday) VALUES
    ('admin',   '$2b$10$ХЕШПАРОЛЯ', 'Иванов Сергей Петрович',       'admin',       'Администрация', 0,   0.0, 0,  '1980-03-15'),
    ('head',    '$2b$10$ХЕШПАРОЛЯ', 'Петрова Анна Михайловна',       'head_doctor', 'Кардиология',   500, 4.8, 45, '1975-07-22'),
    ('doctor',  '$2b$10$ХЕШПАРОЛЯ', 'Сидоров Алексей Николаевич',    'doctor',      'Терапия',       320, 4.5, 28, '1985-02-16'),
    ('doctor2', '$2b$10$ХЕШПАРОЛЯ', 'Козлова Мария Ивановна',        'doctor',      'Неврология',    180, 4.2, 15, '1990-11-08'),
    ('intern',  '$2b$10$ХЕШПАРОЛЯ', 'Новиков Дмитрий Александрович', 'intern',      'Хирургия',      50,  3.8, 5,  '1998-06-30');

-- =====================
-- МИГРАЦИИ: недостающие колонки
-- Выполните эти запросы в Supabase SQL Editor
-- =====================

-- Категория товара в магазине
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'other';

-- Файловые вложения в сообщениях
ALTER TABLE messages ALTER COLUMN text DROP NOT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);
