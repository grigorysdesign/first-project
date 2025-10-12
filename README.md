# SimpleReplit.AI

SimpleReplit.AI — минималистичная онлайн IDE c ИИ-помощником. Проект собирается по `docker-compose` и предоставляет три основных сервиса: фронтенд (Next.js), API (NestJS) и runner для изолированного запуска проектов в Docker.

## Быстрый старт

```bash
git clone <repo>
cd first-project
cp .env.example .env
docker compose up -d --build
```

Через ~60 секунд откройте [http://localhost:3000](http://localhost:3000) и создайте первый проект.

> Переменная `NEXT_PUBLIC_API_URL` в `.env` управляет адресом API для фронтенда (по умолчанию `http://localhost:8080`).

### Базовый сценарий

1. Нажмите **New Project**, выберите стек (`python`, `node` или `static`).
2. В чате ИИ введите запрос — например, «Сделай страницу с формой и счётчиком».
3. Нажмите **Run**, чтобы поднять среду выполнения. Предпросмотр и логи появятся в правой панели.
4. Внесите изменения в файлы и сохраните — runner перезапустит проект автоматически.
5. Нажмите **Deploy**, чтобы получить локальный URL предпросмотра.

## Архитектура

```
frontend (Next.js, TS)
api      (NestJS, Node 20)
runner   (Node 20) — управляет docker-контейнерами проектов
postgres (15)
redis    (BullMQ)
minio    (S3-совместимое хранилище)
ollama   (локальный LLM qwen2.5:7b)
```

### Основные порты

| Сервис   | Порт |
|----------|------|
| frontend | 3000 |
| api      | 8080 |
| runner   | 4000 |
| postgres | 5432 |
| redis    | 6379 |
| minio    | 9000 |
| ollama   | 11434|

## Переменные окружения

Все переменные перечислены в `.env.example`. Для локальной разработки достаточно скопировать файл и изменить при необходимости.

```
APP_ENV=development
DATABASE_URL=postgresql://app:app_password@localhost:5432/simplereplit
REDIS_URL=redis://localhost:6379/0
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio_password
OLLAMA_URL=http://localhost:11434
RUNNER_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Тесты

В API доступен набор Jest-тестов:

```bash
cd api
npm install
npm run test
```

## Структура репозитория

```
frontend/  – Next.js + Tailwind + Monaco Editor
api/       – NestJS, REST + WebSocket, работа с Postgres/Redis/MinIO
runner/    – управление Docker-контейнерами проектов
infra/     – миграции БД и дополнительные скрипты
```

## Лицензия

MIT
