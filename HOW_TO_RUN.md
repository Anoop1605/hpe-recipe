# HPE Recipe Detection - How to Run

## Prerequisites

| Tool | Required Version | Check Command |
|------|-----------------|---------------|
| Java (JDK) | 17+ | `java -version` |
| Maven | 3.9+ | `mvn -version` |
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |

---

## Quick Start (Local Development)

### 1. Build the Backend

```bash
cd backend
mvn clean package -DskipTests
```

### 2. Start the Backend (Terminal 1)

```bash
# For Linux/macOS
cd backend && ./run-backend.sh

# For Windows
cd backend && run-backend.bat
```

Backend starts on **http://localhost:8082/api**

### 3. Verify Backend is Running

```bash
curl http://localhost:8082/api/health
```

Expected response:
```json
{"service":"recipe-detection-api","status":"UP"}
```

### 4. Install Frontend Dependencies (first time only)

```bash
cd frontend
npm install
```

### 5. Start the Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend starts on **http://localhost:3000**

### 6. Open the App

Open your browser and go to: **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/helm-releases` | List all Helm releases |
| GET | `/api/helm-releases/{version}` | Get a specific release with recipes |
| GET | `/api/helm-releases/{version}/recipes` | List recipes for a release |
| GET | `/api/helm-releases/{version}/recipes/{recipeVersion}/components` | Get components for a recipe |
| GET | `/api/helm-releases/{version}/recipes/{recipeVersion}/upgradePaths` | Get upgrade paths |
| GET | `/api/helm-releases/compare?from=X&to=Y` | Compare two Helm versions |
| GET | `/api/catalogs` | List all catalogs |
| GET | `/api/recipes/{recipeVersion}/components` | Get recipe components |

### Example API Calls

```bash
# List all helm releases
curl http://localhost:8081/api/helm-releases

# Get details for helm release v0.0.1
curl http://localhost:8081/api/helm-releases/0.0.1

# Get recipes for a release
curl http://localhost:8081/api/helm-releases/0.0.1/recipes

# Get components for a specific recipe in a release
curl http://localhost:8081/api/helm-releases/0.0.1/recipes/1.4.0/components

# Compare two helm versions
curl "http://localhost:8081/api/helm-releases/compare?from=0.0.1&to=0.0.2"
```

---

## Docker Deployment

### Build Docker Image

```bash
docker build -t hpe-recipe-detection:0.0.1 .
```

### Run with Docker

```bash
docker run -p 8080:8080 hpe-recipe-detection:0.0.1
```

App available at **http://localhost:8080/api**

---

## Kubernetes / Minikube Deployment

### 1. Start Minikube

```bash
minikube start --driver=docker --cpus=4 --memory=8192
```

### 2. Build and Load Image

```bash
docker build -t hpe-recipe-detection:0.0.1 .
minikube image load hpe-recipe-detection:0.0.1
```

### 3. Deploy with Helm

```bash
helm install recipe-detection ./helm/recipe-detection-chart --namespace default
```

### 4. Port Forward and Access

```bash
kubectl port-forward svc/recipe-detection 8080:8080
```

App available at **http://localhost:8080/api**

### 5. Check Pod Status

```bash
kubectl get pods -l app=recipe-detection
kubectl logs -l app=recipe-detection
```

### 6. Uninstall

```bash
helm uninstall recipe-detection
```

---

## Stopping the Application

- **Backend:** Press `Ctrl+C` in Terminal 1
- **Frontend:** Press `Ctrl+C` in Terminal 2

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 8082 already in use | Kill the process: `netstat -ano \| findstr :8082` then `taskkill /PID <pid> /F` |
| Port 3000 already in use | Kill the process or change port in `frontend/vite.config.js` |
| Maven build fails | Ensure JDK 17+ is installed and `JAVA_HOME` is set |
| npm install fails | Delete `node_modules` and `package-lock.json`, then run `npm install` again |
| Frontend can't reach backend | Make sure backend is running first on port 8082 |

---

## Project Structure

```
hpe-recipe-detection/
├── backend/          # Spring Boot REST API (Java 17, port 8082)
├── frontend/         # React UI (Vite, port 3000)
├── helm/             # Kubernetes Helm chart
├── docs/             # Architecture & implementation docs
├── Dockerfile        # Multi-stage Docker build
├── Jenkinsfile       # Jenkins CI/CD pipeline
└── .github/          # GitHub Actions workflow
```
