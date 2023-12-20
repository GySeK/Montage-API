# API "Монтажник"

## Перед запуском
### Установите Postgresql
https://www.postgresql.org/

### Создайте файл .env в корне проекта такого вида

JWT_REFRESH_SECRET="123"
JWT_ACCESS_SECRET="456"
JWT_REFRESH_EXPIRESIN="30d"
JWT_ACCESS_EXPIRESIN="30m"
DB_HOST="localhost"
DB_PORT="5432"
DB_DATABASE="db"
DB_USER="postgres"
DB_PASSWORD="password"
BCRYPT_SALT_ROUNDS=10

### Инициализируйте бд
#### `npm run init`

## Запустить проект в режиме разработки
### `npm run dev`

Адрес по умолчанию: http://localhost:3000

## Запустить проект в продакшн
### `npm start`