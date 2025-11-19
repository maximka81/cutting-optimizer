# Cutting Optimizer — оптимизатор раскроя листовых материалов

Автоматизации раскроя листовых деталей в производстве. Для
Состоит из двух связанных проектов — **backend** на NestJS и **frontend** на Next.js 15.

## Скриншоты

### Редактирование размещаемых изделий

![Редактирование размещаемых изделий](/images/screenshot-web-parts.png)

### Редактирование листов материалов

![Редактирование листов материалов](/images/screenshot-web-materials.png)

### Параметры

![Параметры раскроя](/images/screenshot-web-settings.png)

### Результат раскроя

![Результат раскроя](/images/screenshot-web-result.png)

### Визуализация схемы

![Визуализация схемы раскроя](/images/screenshot-web-result-schema.png)

### Интерфейс API (Swagger)

![Интерфейс API (Swagger)](/images/screenshot-api-swagger.png)

## Backend

Описание смотрите в [README бэкэнда](./api/README.md)

## Frontend

Описание смотрите в [README фронтенда](./web/README.md)

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
