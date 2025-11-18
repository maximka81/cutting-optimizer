# Cutting Optimizer — оптимизатор раскроя листовых материалов

Автоматизации раскроя листовых деталей в производстве. Для
Состоит из двух связанных проектов — **backend** на NestJS и **frontend** на Next.js 15.

## API

[Читать документацию API](./api/README.md)

## Web

[Читать документацию Web](./web/README.md)

## Запуск

```bash
# 1. Клонировать репозиторий
git clone https://github.com/maximka81/cutting-optimizer.git

# 2. Перейти в директорию проекта
cd cutting-optimizer

# 3. Установить зависимости
npm install

# 4. Скопировать `.env.example` в `.env` в директориях api и web:
cp api/.env.example api/.env && cp web/.env.example web/.env
# или windows
copy api\.env.example api\.env & copy web\.env.example web\.env

# 5. Запустить
npm start

# 6. Открыть в браузере
http://localhost:3000
```
