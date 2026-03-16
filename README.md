# Архітектура та структура проєкту

Проєкт побудований на **NestJS** , згенерований **@nestjs/cli** і використовує **feature-based** (доменно-орієнтовану) організацію коду: кожна фіча/домен має власний модуль з усіма потрібними компонентами поруч.

## Обрана структура `src/`

```text
src/
├── common/                    # Спільні утиліти, що використовуються в різних модулях
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   ├── filters/
│   └── constants/
├── config/                    # Конфіги застосунку
│   ├── validation.schema.ts
│   └── configuration.ts
├── modules/                   # Модулі фіч (основна “вісь” структури)
│   ├── users/
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── users.repository.ts
│   ├── auth/
│   │   ├── strategies/
│   │   ├── guards/
│   │   ├── dto/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   └── products/
│       └── ...
├── database/                  # Міграції/сіди та інші DB-артефакти
│   ├── migrations/
│   └── seeds/
├── main.ts
└── app.module.ts
```

## Чому структура виглядає саме так

- **Feature-based organization**: легше знаходити код і масштабувати проєкт - все, що стосується конкретної фічі, лежить в одному місці.
- **Module encapsulation**: кожен модуль є самодостатнім і експортує назовні лише те, що потрібно іншим модулям.
- **Shared resources в `common/`**: повторно використовувані декоратори/гуарди/пайпи/фільтри не дублюються між модулями.
- **DTO та entity поруч із модулем**: DTO/Entity живуть поруч із місцем використання, що зменшує “розмазування” коду по проєкту.
- **Без надмірної вкладеності**: структуру варто тримати відносно пласкою; якщо модуль розростається - краще розділяти на підмодулі.

## Вже налаштовано

- **SWC**: швидша компіляція TypeScript (заміна повільнішого `tsc` у dev/build сценаріях залежно від конфігурації).
- **`cross-env`**: коректна робота змінних середовища на різних ОС.
- **Валідація env через Joi**: перевірка `.env` на старті застосунку (щоб падати швидко та зрозуміло при неправильній конфігурації).

## Dev setup

```bash
# Terminal 1 — payments gRPC server (port 50051)
npm run start:payments:dev

# Terminal 2 — orders API (port 3000)
docker compose up -d           # starts postgres, minio, rabbitmq
npm run db:migrate
npm run db:seed
npm run start:dev
```

### Environment variables

| Variable                   | Service    | Default           | Description                        |
| -------------------------- | ---------- | ----------------- | ---------------------------------- |
| `PAYMENTS_GRPC_URL`        | orders-api | `localhost:50051` | gRPC address of payments-service   |
| `PAYMENTS_GRPC_TIMEOUT_MS` | orders-api | `5000`            | Per-call deadline in ms            |
| `PAYMENTS_GRPC_PORT`       | payments   | `50051`           | Port payments gRPC server binds to |

## Clean-start

Перевіряє, що порожня БД проходить увесь ланцюжок `migrate > seed > start` без помилок.

```bash
# 1. Скинути стан
docker compose down -v

# 2. Підняти інфраструктуру + міграції + seed одним кроком
docker compose up --build --abort-on-container-exit --exit-code-from seed migrate seed

# 3. Переконатися, що всі сервіси стартують
docker compose up --build api
```

RabbitMQ Management UI: http://localhost:15672 (guest / guest)

---

## gRPC — Payments Service

### Proto contract

`proto/payments.proto` — shared by both services (no code import, only the file).

```
service Payments {
  Authorize(AuthorizeRequest)         → AuthorizeResponse   { paymentId, status }
  GetPaymentStatus(...)               → { paymentId, status }
  Capture / Refund                    → stub handlers
}
```

### How it is wired

| Role           | File                       | Details                                                                                 |
| -------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| gRPC server    | `payments-service/main.ts` | Standalone NestJS microservice, Transport.GRPC                                          |
| gRPC handlers  | `payments.controller.ts`   | `@GrpcMethod` decorators                                                                |
| gRPC client    | `payments-grpc.module.ts`  | `ClientsModule.registerAsync`, url from `PAYMENTS_GRPC_URL`                             |
| Client wrapper | `payments-grpc.service.ts` | deadline from `PAYMENTS_GRPC_TIMEOUT_MS`, retry on UNAVAILABLE, gRPC→HTTP error mapping |

### Happy path (curl)

```bash
# 1. Register / login
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<email>","password":"<pass>"}' | jq -r .accessToken)

# 2. Get a product id
PRODUCT_ID=$(curl -s http://localhost:8080/products \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

# 3. Create order — triggers Payments.Authorize via gRPC
curl -s -X POST http://localhost:8080/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "idempotency-key: $(python3 -c 'import uuid; print(uuid.uuid4())')" \
  -d "{\"userId\":\"<userId>\",\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}]}" \
  | jq '{id, status, paymentId}'
# → { "id": "...", "status": "PENDING", "paymentId": "..." }
```

---

## RabbitMQ — Async Orders Workflow

### Topology

```
Producer (POST /orders)
  └─► orders.exchange  [direct]
        ├─► routing key: order.process  ──► orders.process queue  ──► Worker (consumer)
        └─► routing key: order.dlq      ──► orders.dlq queue
```

**Exchange:** `orders.exchange` (direct)
**Queues:**

- `orders.process` — main processing queue
- `orders.dlq` — dead-letter queue (messages that exhausted retries)

### Demo Scenarios

**1. Happy path**

```bash
# 1. POST /orders → returns { id, status: "PENDING" }
# 2. Worker picks it up, inserts into processed_messages, updates order status → PROCESSED
# 3. GET /orders?status=PROCESSED — order appears
```

**2. Retry simulation**

```
In OrdersConsumerService.handleMessage() temporarily add:
  if (attempt < 2) throw new Error('simulated failure');

POST /orders — watch logs:
  { result: 'retry', attempt: 1 }
  { result: 'retry', attempt: 2 }
  { result: 'success', attempt: 2 }
```

**3. DLQ (Dead-Letter Queue)**

```
Set MAX_RETRY_ATTEMPTS=3 and throw an unconditional error in the handler.
After 3 retries the message lands in orders.dlq.
Check http://localhost:15672 → Queues → orders.dlq → Get messages.
```

**4. Idempotency guard**

```
# Publish the same messageId twice (e.g. via RabbitMQ Management UI or direct amqplib publish).
# Second delivery logs: { result: 'duplicate, skipping' }
# DB has exactly one row in processed_messages for that messageId.
```

---

## Docker

### Перший запуск (налаштування секретів)

```bash
cp .env.example .env                  # заповніть реальними значеннями

# Секрети для Docker Compose secrets
cp secrets/jwt_secret.txt.example         secrets/jwt_secret.txt
cp secrets/jwt_refresh_secret.txt.example secrets/jwt_refresh_secret.txt
cp secrets/db_password.txt.example        secrets/db_password.txt
# Заповніть кожен файл реальним значенням
```

### 6.1 Команди запуску

**Dev (hot reload, bind-mount, env з .env):**

```bash
docker compose -f compose.yml -f compose.dev.yml up --build app-dev
```

**Prod-like (distroless, non-root, без .env у контейнері):**

```bash
docker compose -f compose.yml up --build
```

**Міграції / seed (one-off jobs):**

```bash
docker compose -f compose.yml run --rm migrate
docker compose -f compose.yml run --rm seed
```

---

### Оптимізація

```
$ docker image ls --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep nodejs_rd

REPOSITORY                  TAG       SIZE
nodejs_rd-prod-distroless   latest    426MB
nodejs_rd-prod              latest    561MB
nodejs_rd-seed              latest    561MB
nodejs_rd-migrate           latest    561MB
nodejs_rd-app-dev           latest    822MB
```

```
$ docker history nodejs_rd-prod

CREATED BY                                        SIZE
CMD ["node" "dist/main"]                          0B
EXPOSE [3000/tcp]                                 0B
USER appuser                                      0B
RUN groupadd --system appgroup && useradd ...     41kB
COPY /app/dist ./dist                             737kB     ← тільки скомпільований код
COPY /app/node_modules ./node_modules             191MB     ← тільки prod deps (без devDeps)
WORKDIR /app                                      8kB
<node:22-slim base layers>                        ~158MB
```

**Висновок: чому `prod-distroless` менший і безпечніший за `prod`:**

|                       | `app-dev`     | `prod`       | `prod-distroless` |
| --------------------- | ------------- | ------------ | ----------------- |
| Розмір                | **822 MB**    | **561 MB**   | **426 MB**        |
| Shell                 | ✅ bash       | ✅ bash      | ❌ відсутній      |
| devDependencies       | ✅ є          | ❌ відсутні  | ❌ відсутні       |
| Вихідний код (`src/`) | ✅ bind-mount | ❌ відсутній | ❌ відсутній      |
| OS утиліти            | ✅ є          | часткові     | ❌ мінімум        |
| Attack surface        | висока        | середня      | **мінімальна**    |

`prod-distroless` на **136 MB менший** за `prod` завдяки відсутності shell, пакетного менеджера apt та OS-утиліт.
Без shell неможливо виконати довільні команди через RCE-вразливість — навіть якщо атакуючий отримає доступ до контейнера, зробити `/bin/sh` він не зможе.

---

### non-root

- appuser in dockerfile

**`prod` (node:22-slim) — перевірка через `id`:**

```bash
$ docker run --rm --entrypoint id nodejs_rd-prod

uid=999(appuser) gid=999(appgroup) groups=999(appgroup)
```
