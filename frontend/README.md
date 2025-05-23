# DTR ZKTeco Attendance Tracker

A real-time attendance tracking service that connects to a ZKTeco biometric device, fetches attendance logs, and broadcasts them via Redis Pub/Sub and Socket.IO to any connected frontend clients.

## Features

* Connects to a ZKTeco device over TCP to retrieve:

  * Device details (firmware, serial number, current time, etc.)
  * Enrolled user roster
  * Attendance logs (filtered from the start of the year)
* Publishes attendance payloads (device info, user roster, logs) to a Redis channel every minute
* Broadcasts the latest payload instantly to Socket.IO clients upon connection and on every update

---

## Development Setup

### Prerequisites

* Node.js v18+ (tested on v22.12.0)
* npm v9+ or yarn
* Docker Desktop (for local Redis)
* XAMPP (for PHP/MySQL if you have other services)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/dtr.zkteco.git
cd dtr.zkteco
```

### 2. Environment Variables

Create a `.env.development` file in the project root:

```ini
REDIS_URL=redis://localhost:6379
DEVICE_IP=10.10.80.8
DEVICE_PORT=4370
SEND_TIMEOUT=20000
RECV_TIMEOUT=20000
```

### 3. Run Redis Locally with Docker

Ensure Docker Desktop is running, then:

```bash
docker run -d --name dev-redis -p 6379:6379 redis:7
```

Verify Redis is up:

```bash
redis-cli ping  # Should return PONG
```

### 4. Install Dependencies

```bash
npm install
# or
# yarn install
```

### 5. Start the Dev Server

```bash
npm run dev
```

This will launch two parallel processes:

* **dev\:server**: Loads `.env.development` and runs `server/index.js` (Socket.IO + attendance polling)
* **dev\:client**: Starts Vite on [http://localhost:2000](http://localhost:2000) for the frontend UI

You should see in the server logs:

```
✅ Connected to Redis Pub/Sub
⚡️ Socket.IO listening on port 8090
```

---

## Production Setup

### 1. Environment Variables

Create a `.env.production` file or export the following in your environment:

```ini
REDIS_URL=redis://<redis-host>:6379
DEVICE_IP=<device-ip>
DEVICE_PORT=4370
SEND_TIMEOUT=20000
RECV_TIMEOUT=20000
PORT=8090            # optional override
```

### 2. (Optional) Docker Compose

To deploy both Redis and your app:

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"

  app:
    build: .
    restart: unless-stopped
    environment:
      - REDIS_URL=redis://redis:6379
      - DEVICE_IP=${DEVICE_IP}
      - DEVICE_PORT=${DEVICE_PORT}
    ports:
      - "8090:8090"
    depends_on:
      - redis
```

Start in production mode:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Install & Run (Without Docker)

On your production host (e.g., Ubuntu server):

```bash
git clone https://github.com/your-org/dtr.zkteco.git
cd dtr.zkteco
npm install --production

# ensure Redis is reachable at $REDIS_URL

env $(cat .env.production) node server/index.js
```

Use a process manager (e.g., `pm2`, `systemd`) to keep the service alive and restart on crashes.

---

## License

MIT © Your Name
