
## Project Structure:

Your layout is almost spot on. Here are a few tweaks and additions to make it complete and reflect all the pieces you’ll need:

```text
attendance-app/
├─ .gitignore                       # Ignore node_modules, vendor, dist, .env, etc.
├─ README.md                        # Project overview & setup instructions
├─ docker-compose.yml               # Orchestrates app, Redis, MySQL
├─ Dockerfile                       # Builds PHP/Swoole + Node/Vite image
├─ .env                             # Environment variables (DB, Redis, ngrok, ports)
├─ composer.json                    # PHP deps & PSR-4 autoloading
├─ package.json                     # JS deps & Vite build/dev scripts
├─ tsconfig.json                    # TypeScript compiler settings
├─ vite.config.ts                   # Vite build config (base path, aliases)
├─ public/
│  ├─ index.php                     # Swoole HTTP/WebSocket bootstrap & REST entrypoint
│  └─ index.html                    # React SPA shell (mounts to `<div id="root">`)
├─ src/
│  ├─ Config/
│  │  └─ Env.php                    # Loads `.env` into `$_ENV`
│  ├─ Device/
│  │  └─ ZKPoller.php               # Polls ZKTeco device over TCP
│  ├─ Api/
│  │  └─ NgrokPoller.php            # Fetches remote logs via ngrok-exposed API
│  ├─ Stream/
│  │  ├─ RedisClient.php            # Singleton Redis + Streams helper
│  │  └─ LogConsumer.php            # Consumes Stream, writes to DB, publishes Pub/Sub
│  ├─ Database/
│  │  ├─ DB.php                     # PDO wrapper / connection factory
│  │  └─ AttendanceRepo.php         # Inserts into partitioned `attendance_logs`
│  ├─ Websocket/
│  │  └─ WsServer.php               # Subscribes Redis Pub/Sub, pushes via Swoole WS
│  ├─ UI/
│  │  ├─ components/
│  │  │  └─ LogRow.tsx              # Renders a single attendance record
│  │  ├─ hooks/
│  │  │  ├─ useFetchLogs.ts         # React Query hook for history
│  │  │  └─ useAttendanceWs.ts      # WebSocket hook for live updates
│  │  ├─ pages/
│  │  │  ├─ Dashboard.tsx           # Summary charts and KPIs
│  │  │  └─ History.tsx             # Virtualized list (react-window)
│  │  ├─ services/
│  │  │  └─ api.ts                  # Axios + React Query setup
│  │  └─ App.tsx                    # Routes, providers, global styles
│  └─ migrations/                   # SQL or PHP migration files
└─ tests/
   ├─ backend/                      # PHPUnit tests for PHP classes
   └─ ui/                           # Jest / React Testing Library tests
```

### Details:

* **`.gitignore`** – to skip `node_modules/`, `vendor/`, `dist/`, `.env`, etc.
* **`README.md`** – documents installation, `.env` vars, how to build/run locally and in Docker.
* **`tsconfig.json`** & **`vite.config.ts`** – required by Vite/TypeScript to control compilation, path aliases, and base routes (important if you serve from a subfolder).
* **`migrations/`** – store your database schema definition and versioned migrations (e.g. creating your `attendance_logs` table with partitions).
* **`tests/`** – separate directories for backend (PHPUnit) and UI (Jest/RTL) tests, ensuring you cover critical logic and components.


## Summary

* **Orchestration** via Docker Compose to spin up your PHP/Swoole app, Redis, and MySQL containers ([GitHub][1]).
* **Source code** under `src/`, organized by domain (Config, Device, Api, Stream, Database, Websocket, UI) .
* **Public entrypoint** (`public/index.php` + `public/index.html`) for REST and SPA shell .
* **Vite**-powered React + TypeScript in `src/UI/…`, built into `dist/` and served from `public/` ([vitejs][2]).
* **Redis Streams** for buffering and deduplication, with consumer groups and Pub/Sub for real-time pushes ([CodeSandbox][3]).
* **MySQL** with a partitioned `attendance_logs` table for high-volume writes and queries ([CodeSandbox][3]).

---

## 1. Root & Orchestration

### 1.1 `docker-compose.yml`

```yaml
version: '3.8'
services:
  app:
    build: .
    env_file: .env
    ports:
      - "9501:9501"
    depends_on:
      - redis
      - db
  redis:
    image: redis:7-alpine
    restart: unless-stopped
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASS}
    volumes:
      - db_data:/var/lib/mysql
volumes:
  db_data:
```

* Orchestrates your **app**, **Redis**, and **MySQL** in isolated containers, ensuring each service uses the correct versions and can scale independently ([GitHub][1]).

### 1.2 `Dockerfile`

```dockerfile
FROM phpswoole/swoole:latest
RUN apt-get update && apt-get install -y git unzip \
    && pecl install redis \
    && docker-php-ext-enable redis
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader
COPY package.json package-lock.json vite.config.ts tsconfig.json public/ src/ ./
RUN npm ci && npm run build
EXPOSE 9501 80
CMD ["php", "public/index.php"]
```

* **Multi-stage** build pulls in PHP/Swoole with Redis support, installs Composer dependencies, then installs Node modules and builds the React app via Vite .

### 1.3 `.env`

```
DB_HOST=db
DB_NAME=attendance
DB_USER=appuser
DB_PASS=secret
DB_ROOT_PASSWORD=rootsecret
REDIS_HOST=redis
NGROK_URL=https://abcd1234.ngrok.io
API_PORT=9501
```

* Centralizes configuration for database, Redis, and your ngrok API URL .

---

## 2. Public Entrypoints (`public/`)

### 2.1 `public/index.php`

```php
<?php
require __DIR__ . '/../vendor/autoload.php';
use App\Config\Env;
Env::load(__DIR__ . '/../.env');

// Bootstrap Swoole HTTP + WebSocket
use Swoole\Http\Server;
use App\Websocket\WsServer;
use App\Stream\LogConsumer;
use App\Device\ZKPoller;
use App\Api\NgrokPoller;

Runtime::enableCoroutine();
$server = new Server('0.0.0.0', (int)$_ENV['API_PORT']);
$zk = new ZKPoller(); $zk->run();
$ngrok = new NgrokPoller(); $ngrok->run();
$consumer = new LogConsumer(); $consumer->run();
$ws = new WsServer($server); $ws->run();

// REST & SPA Routing
$server->on('request', [App\Router::class, 'handle']);
$server->start();
```

* Initializes environment, starts **pollers**, **consumer**, and **WebSocket** server, then handles REST routes and serves `index.html` for the SPA .

### 2.2 `public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Attendance App</title>
  <link rel="stylesheet" href="/assets/index.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>
```

* The **single HTML shell** into which your React app is injected by Vite’s build, with correct hashed asset paths ([GitHub][4]).

---

## 3. Source Code (`src/`)

### 3.1 `Config/Env.php`

```php
namespace App\Config;
use Dotenv\Dotenv;

class Env {
  public static function load(string $path): void {
    Dotenv::createImmutable(dirname($path))->load();
  }
}
```

* Loads your `.env` into `$_ENV` using **vlucas/phpdotenv** for safe config management .

### 3.2 `Device/ZKPoller.php`

```php
namespace App\Device;
use Swoole\Timer;
use ZKTecoPhp\Libs\ZKTeco;
use App\Stream\RedisClient;

class ZKPoller {
  public function run(): void {
    $zk = new ZKTeco($_ENV['DEVICE_IP'], 4370);
    if (! $zk->connect()) throw new \Exception("Cannot connect");
    Timer::tick(10000, function() use ($zk) {
      $logs = $zk->getAttendances();
      RedisClient::pushStream('attendance', $logs);
    });
  }
}
```

* Polls your **on-prem** ZKTeco device every 10 s inside a Swoole coroutine, then pushes to Redis Streams for decoupled processing ([LogRocket Blog][5]).

### 3.3 `Api/NgrokPoller.php`

```php
namespace App\Api;
use Swoole\Timer;
use GuzzleHttp\Client;
use App\Stream\RedisClient;

class NgrokPoller {
  public function run(): void {
    $client = new Client(['base_uri'=>$_ENV['NGROK_URL']]);
    Timer::tick(15000, function() use ($client) {
      $resp = $client->get('/api/attendance');
      $data = json_decode((string)$resp->getBody(), true);
      RedisClient::pushStream('attendance', $data);
    });
  }
}
```

* Fetches logs from your **remote** ngrok-exposed API every 15 s and uses the same Redis Stream for unified handling ([Vite][6]).

### 3.4 `Stream/RedisClient.php`

```php
namespace App\Stream;
class RedisClient {
  private static \Redis $r;
  public static function get(): \Redis {
    if (!isset(self::$r)) {
      self::$r = new \Redis();
      self::$r->connect($_ENV['REDIS_HOST'], 6379);
    }
    return self::$r;
  }
  public static function pushStream(string $stream, array $entries): void {
    $r = self::get();
    foreach ($entries as $e) {
      $member = "{$e['uid']}:{$e['record_time']}";
      if ($r->sAdd('seen', $member)) {
        $r->xAdd($stream, '*', $e);
      }
    }
  }
}
```

* **Streams** offer at-least-once delivery and back-pressure; dedupe via a Redis SET prevents duplicate entries ([CodeSandbox][3]).

### 3.5 `Stream/LogConsumer.php`

```php
namespace App\Stream;
use App\Database\AttendanceRepo;

class LogConsumer {
  public function run(): void {
    $r = RedisClient::get();
    while (true) {
      $batch = $r->xReadGroup('cg','c1',['attendance'=>'>'],10,5000);
      foreach ($batch['attendance'] as $id=>$entry) {
        AttendanceRepo::insert($entry);
        $r->xAck('attendance','cg',$id);
        $r->publish('attendance_updates', json_encode($entry));
      }
    }
  }
}
```

* Uses **consumer groups** to scale multiple workers without duplicating work, acknowledges IDs, and publishes to Pub/Sub for real-time updates .

### 3.6 `Database/DB.php`

```php
namespace App\Database;
class DB {
  private static \PDO $pdo;
  public static function get(): \PDO {
    if (!isset(self::$pdo)) {
      $dsn = "mysql:host={$_ENV['DB_HOST']};dbname={$_ENV['DB_NAME']};charset=utf8mb4";
      self::$pdo = new \PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS'], [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
      ]);
    }
    return self::$pdo;
  }
}
```

* A **singleton** PDO wrapper for database access, throwing exceptions on errors .

### 3.7 `Database/AttendanceRepo.php`

```php
namespace App\Database;
class AttendanceRepo {
  public static function insert(array $d): void {
    $sql = "INSERT INTO attendance_logs (device_id,user_id,checked_at,status)
            VALUES (:device_id,:uid,:record_time,:status)";
    $stmt = DB::get()->prepare($sql);
    $stmt->execute([
      ':device_id'=>$d['device_ip'],
      ':uid'=>$d['uid'],
      ':record_time'=>$d['record_time'],
      ':status'=>$d['status']
    ]);
  }
}
```

* Inserts into a **partitioned** `attendance_logs` table (e.g., by `MONTH(checked_at)`) for performance on large volumes ([CodeSandbox][3]).

### 3.8 `Websocket/WsServer.php`

```php
namespace App\Websocket;
use Swoole\WebSocket\Server as Ws;
use App\Stream\RedisClient;

class WsServer {
  private Ws $server;
  public function __construct(Ws $server) { $this->server = $server; }
  public function run(): void {
    go(function() {
      $r = RedisClient::get();
      $r->subscribe(['attendance_updates'], function($r,$chan,$msg) {
        foreach ($this->server->connections as $fd) {
          $this->server->push($fd, $msg);
        }
      });
    });
  }
}
```

* Subscribes to the **Pub/Sub** channel and pushes updates over WebSocket to all connected clients .

---

## 4. React + TypeScript UI (`src/UI/…`)

### 4.1 Vite Config (`vite.config.ts`)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: '/',               // adjust to '/attendance/' in shared hosting
});
```

* Sets up Vite to handle React/TSX, with `base` controlling asset paths ([Vite][6]).

### 4.2 `services/api.ts`

```ts
import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
```

* Centralizes your REST client; add interceptors here for auth or error handling ([Electron Forge][7]).

### 4.3 `hooks/useFetchLogs.ts`

```ts
import { useQuery } from 'react-query';
import { api } from '../services/api';
export function useFetchLogs(start:string,end:string) {
  return useQuery(['logs',start,end],()=>
    api.get(`/attendance?start=${start}&end=${end}`).then(r=>r.data)
  );
}
```

* **React Query** handles caching, retry logic, and stale-while-revalidate ([Electron Forge][7]).

### 4.4 `hooks/useAttendanceWs.ts`

```ts
import { useEffect } from 'react';
import { QueryClient } from 'react-query';
export function useAttendanceWs(qc:QueryClient) {
  useEffect(()=>{
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);
    ws.onmessage = e=> {
      const entry = JSON.parse(e.data);
      qc.setQueryData('logs', (old:any)=> [entry, ...old]);
    };
    return ()=> ws.close();
  },[qc]);
}
```

* Connects WebSocket, merges live entries into the React Query cache for instant UI updates .

### 4.5 `components/LogRow.tsx`

```tsx
import React from 'react';
export const LogRow = React.memo(({ entry }: { entry:any })=> (
  <div className="p-2 border-b">
    {entry.user_id} @ {entry.record_time} ({entry.status})
  </div>
));
```

* `React.memo` prevents unnecessary re-renders when props haven’t changed .

### 4.6 `pages/History.tsx`

```tsx
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { useFetchLogs } from '../hooks/useFetchLogs';
import { LogRow } from '../components/LogRow';

export function History() {
  const { data: logs=[] } = useFetchLogs('2025-04-01','2025-04-30');
  return (
    <List height={600} width="100%" itemCount={logs.length} itemSize={40}>
      {({ index, style }) => (
        <div style={style}><LogRow entry={logs[index]} /></div>
      )}
    </List>
  );
}
```

* **Virtualized** list renders only visible rows, keeping DOM size small even for thousands of entries ([Yarn][8]).

### 4.7 `App.tsx`

```tsx
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAttendanceWs } from './hooks/useAttendanceWs';
import { History } from './pages/History';

const qc = new QueryClient();
export default function App() {
  useAttendanceWs(qc);
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/history" element={<History />} />
          {/* add Dashboard here */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

* Bootstraps **React Query**, WebSocket hook, and **React Router** for navigation .

---

## 5. Data-Flow Diagram

```text
┌────────────┐   TCP   ┌──────────┐   xAdd   ┌─────────┐
│ZKTeco      │ ─────▶ │ZKPoller  │ ───────▶ │ Redis   │
│Device      │        └──────────┘          │ Streams │
└────────────┘                              └──┬──────┘
     ▲                                             │
     │  HTTPS                                      │
┌────────────┐  ─────▶ ┌────────────┐  xAdd        │
│ngrok API   │        │NgrokPoller │ ─────────────┘
└────────────┘        └────────────┘
                         │
                         ▼
                    ┌──────────────┐
                    │LogConsumer   │─ insert → MySQL
                    │(xReadGroup)  │─ pub→Pub/Sub
                    └──────┬───────┘
                           │
                    ┌──────▼─────┐
                    │ WsServer   │─ WebSocket push
                    └──────┬─────┘
                           │
                    ┌──────▼──────┐
                    │ React App   │
                    │ (useFetch & │
                    │  useAttendanceWs) │
                    └─────────────┘
```

---

By following this **file-by-file blueprint**, you’ll have a fully configured, containerized attendance app that polls devices and remote APIs, buffers with Redis Streams, writes to partitioned MySQL tables, and delivers real-time updates to a Vite-built React + TypeScript frontend. You can deploy it locally via XAMPP (by copying `public/` and `dist/` to your web root) or in production using the same Docker images, ensuring consistency across environments.

[1]: https://github.com/PolGubau/vite-ts-template?utm_source=chatgpt.com "Vite template with typescript for react projects - GitHub"
[2]: https://vite.dev/guide/?utm_source=chatgpt.com "Getting Started - Vite"
[3]: https://codesandbox.io/p/github/R35007/vite-react-typescript?utm_source=chatgpt.com "Vite React Typescript Template - CodeSandbox"
[4]: https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts?utm_source=chatgpt.com "create-vite/template-react-ts - GitHub"
[5]: https://blog.logrocket.com/build-react-typescript-app-vite/?utm_source=chatgpt.com "How to build a React + TypeScript app with Vite - LogRocket Blog"
[6]: https://v3.vitejs.dev/guide/?utm_source=chatgpt.com "Getting Started - Vite"
[7]: https://www.electronforge.io/templates/vite-%2B-typescript?utm_source=chatgpt.com "Vite + TypeScript - Electron Forge"
[8]: https://classic.yarnpkg.com/en/package/vite-react-ts-template?utm_source=chatgpt.com "vite-react-ts-template - Yarn 1"
