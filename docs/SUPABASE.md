# Бесплатная полная версия на GitHub Pages

GitHub Pages раздаёт интерфейс, Supabase Free — аккаунты и PostgreSQL. Node.js-сервер для этой конфигурации не нужен. Локальный режим SQLite остаётся доступен без переменных Supabase.

1. Создайте проект в организации **Free** на https://supabase.com/dashboard. Пароль базы храните у себя.
2. В **SQL Editor** выполните [backend/supabase/schema.sql](../backend/supabase/schema.sql). Скрипт создаёт таблицу с RLS и две функции. Новые аккаунты получают только пустые коллекции; чужие записи недоступны. Запись выполняется функцией с проверкой владельца и версии данных.
3. В **Authentication → URL Configuration** задайте Site URL и Redirect URL: `https://delivery12335.github.io/365.---life-management/`.
4. В **Authentication → Providers / Sign In → Email** выберите настройку подтверждения email. Для входа сразу после регистрации без почтового сервиса отключите Confirm email. Это означает, что владение email не проверяется. Если подтверждение включено, настройте собственный SMTP: стандартная почта Supabase ограничена адресами команды проекта.
5. В **Project Settings → API Keys** скопируйте **publishable key**, а в Data API — **Project URL**. Не используйте secret key, service_role или пароль базы.
6. В GitHub **Settings → Secrets and variables → Actions → Variables** создайте публичные переменные `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`.
7. Запустите **Actions → Deploy GitHub Pages → Run workflow**. При наличии обеих переменных презентационные ограничения заменяются настоящим облачным входом.

## Что хранится в браузере

Личные записи загружаются из облачной базы и не кэшируются в localStorage. Supabase SDK хранит токены авторизации: по умолчанию в sessionStorage, при «Запомнить меня» — в localStorage. Сроки сессий определяет Supabase Auth, а не настройки локального Node-сервера.

## Почта и лимиты

Восстановление использует Supabase Auth и требует настроенной отправки писем. Стандартный SMTP Supabase — для тестов адресов команды, не для публичного сервиса. Без собственной почты обычная регистрация и вход работают при отключённом подтверждении email, но восстановление для произвольных адресов обещать нельзя.

Free имеет квоты и может приостанавливаться при низкой активности. Никакие платные опции для этой конфигурации включать не нужно. Удаление проекта уничтожает данные; выгружайте свои записи из настроек 365.

Локальные SQLite-аккаунты автоматически в Supabase не переносятся. Для облачной версии создаётся отдельный аккаунт.

Документация: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [тарифы](https://supabase.com/pricing).
