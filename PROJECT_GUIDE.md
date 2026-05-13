# HPE Recipe Detection - Complete Project Guide

## What Is This Project?

HPE (Hewlett Packard Enterprise) deploys software to Kubernetes clusters using **Helm charts**. Each Helm chart version contains a set of **recipes**, and each recipe defines specific versions of software components (Spark, Kafka, Airflow, HBase, etc.).

**The problem:** When a Helm chart is deployed in production, it's hard to know which component versions are inside it. Engineers have to dig through Git history, check ConfigMaps, and manually trace versions.

**This project solves that** by providing a web UI where engineers can:
- Define recipes and component versions for each Helm chart release
- Deploy them to Kubernetes with one click
- Visualize the entire version graph — recipes, components, and upgrade paths
- See real-time status updates as deployments happen

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        THE FULL FLOW                            │
│                                                                 │
│   Browser (/manage)                                             │
│       │                                                         │
│       ├── 1. Create Helm release (e.g. 0.0.4)                  │
│       ├── 2. Add recipes + components                           │
│       ├── 3. Click "Deploy"                                     │
│       │                                                         │
│   Spring Boot Backend (port 8081)                               │
│       │                                                         │
│       ├── 4. Generates values-v0.0.4.yaml                      │
│       ├── 5. Commits + pushes to GitHub (JGit)                  │
│       ├── 6. Sets status to "deploying"                         │
│       ├── 7. Broadcasts via WebSocket to all browsers           │
│       │                                                         │
│   GitHub (NaomiiAP/hpe-recipe)                                  │
│       │                                                         │
│       ├── 8. Jenkins polls every 1 min, detects new commit      │
│       │                                                         │
│   Jenkins (port 8080)                                           │
│       │                                                         │
│       ├── 9.  Checkout code                                     │
│       ├── 10. Read Chart.yaml version                           │
│       ├── 11. mvn clean package (build backend JAR)             │
│       ├── 12. minikube image build (Docker image)               │
│       ├── 13. helm install/upgrade (deploy to K8s)              │
│       ├── 14. kubectl rollout status (verify pods)              │
│       ├── 15. PUT /api/helm-releases/0.0.4/status → "deployed" │
│       │                                                         │
│   Spring Boot Backend                                           │
│       │                                                         │
│       ├── 16. Updates status in memory                          │
│       ├── 17. Broadcasts "deployed" via WebSocket               │
│       │                                                         │
│   All Browsers                                                  │
│       │                                                         │
│       └── 18. Status flips to "deployed" (no refresh needed)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Web UI (visualizer + manage page) |
| **Visualization** | React Flow + Dagre | Interactive graph of recipes and components |
| **Real-time** | WebSocket (native) | Live updates across all browsers |
| **Routing** | React Router DOM | Navigation between pages |
| **Backend** | Spring Boot 3.2.5 (Java 17) | REST API + WebSocket server |
| **Git Integration** | JGit (Eclipse) | Clone, commit, push to GitHub from Java |
| **YAML Generation** | SnakeYAML | Generates Helm values files |
| **CI/CD** | Jenkins | Automated build and deploy pipeline |
| **Containerization** | Docker (multi-stage) | Packages backend into a container image |
| **Orchestration** | Kubernetes (Minikube) | Runs the deployed application |
| **Package Manager** | Helm 3 | Manages K8s deployments with templated charts |
| **K8s Client** | Fabric8 | Java library for K8s API (future use) |
| **Source Control** | Git + GitHub | Code repository and GitOps trigger |

---

## Project Structure

```
hpe-recipe-detection/
│
├── backend/                          # Spring Boot REST API
│   ├── src/main/java/com/hpe/recipe/
│   │   ├── RecipeDetectionApplication.java    # Entry point
│   │   │
│   │   ├── controller/
│   │   │   ├── HealthController.java          # GET /health
│   │   │   ├── HelmReleaseController.java     # Full CRUD + deploy endpoint
│   │   │   ├── CatalogController.java         # Legacy catalog endpoints
│   │   │   └── RecipeController.java          # Recipe query endpoints
│   │   │
│   │   ├── service/
│   │   │   ├── HelmReleaseService.java        # Business logic + in-memory data
│   │   │   ├── GitOpsService.java             # YAML generation + Git push
│   │   │   └── CatalogService.java            # Legacy catalog service
│   │   │
│   │   ├── model/
│   │   │   ├── HelmRelease.java               # version, releaseName, status, recipes
│   │   │   ├── Recipe.java                    # version, description, components, upgradePaths
│   │   │   └── Catalog.java                   # Legacy catalog model
│   │   │
│   │   └── config/
│   │       ├── WebSocketConfig.java           # Registers /ws/releases endpoint
│   │       └── ReleaseWebSocketHandler.java   # Broadcasts events to all clients
│   │
│   ├── src/main/resources/
│   │   └── application.yml                    # Server config + GitOps config
│   │
│   └── pom.xml                                # Maven dependencies
│
├── frontend/                          # React UI
│   ├── src/
│   │   ├── main.jsx                   # Entry point with React Router
│   │   ├── App.jsx                    # Visualizer page (/) — graph view
│   │   ├── ManagePage.jsx             # Manage page (/manage) — CRUD + deploy
│   │   └── useRealtimeReleases.js     # WebSocket hook for live updates
│   │
│   ├── package.json                   # Dependencies
│   ├── vite.config.js                 # Dev server config + API proxy
│   └── index.html                     # HTML entry
│
├── helm/                              # Kubernetes Helm Chart
│   └── recipe-detection-chart/
│       ├── Chart.yaml                 # Chart metadata (version updated by GitOps)
│       ├── values.yaml                # Base values (defaults)
│       ├── values-v0.0.2.yaml         # Values for Helm release 0.0.2
│       ├── values-v0.0.3.yaml         # Values for Helm release 0.0.3
│       ├── values-v0.0.4.yaml         # Values for Helm release 0.0.4 (created by website)
│       └── templates/
│           ├── deployment.yaml        # K8s Deployment with health probes
│           ├── service.yaml           # K8s Service (ClusterIP:8080)
│           ├── configmap.yaml         # ConfigMap for recipe data
│           └── _helpers.tpl           # Helm template helpers
│
├── Dockerfile                         # Multi-stage build (Maven → JRE)
├── Jenkinsfile                        # CI/CD pipeline definition
├── .github/workflows/build.yml        # GitHub Actions CI (alternative to Jenkins)
├── .gitignore
├── HOW_TO_RUN.md                      # Commands to run the project
└── PROJECT_GUIDE.md                   # This file
```

---

## The Two Pages

### Page 1: Visualizer (`/` — http://localhost:3000)

This is the main dashboard. It shows:

- **Version Timeline** — circular buttons at the top for each Helm release (v1, v2, v3...)
- **Recipe Graph** — interactive node graph showing recipes and their upgrade paths
- **Component Expansion** — click a recipe node to see its components (Spark, Kafka, etc.)
- **Detail Panel** — right sidebar showing component versions and upgrade paths
- **Compare Modal** — compare two Helm versions side-by-side to see what changed
- **Stats Bar** — recipe count, component count, upgrade paths, deployment status

### Page 2: Recipe Manager (`/manage` — http://localhost:3000/manage)

This is where engineers create and manage releases:

- **Create Helm Release** — enter chart version and release name
- **Add Recipes** — define recipe version, description, component versions
- **Edit Recipes** — inline editing of descriptions, components, upgrade paths
- **Deploy Button** — pushes to Git, triggers Jenkins, deploys to K8s
- **Redeploy Button** — update an already-deployed release with new recipes
- **Delete** — remove recipes or entire releases
- **Real-time Status** — watch status change live: pending → deploying → deployed
- **Toast Notifications** — see when other users or Jenkins make changes

---

## API Endpoints

### Helm Releases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/helm-releases` | List all releases (lightweight) |
| GET | `/api/helm-releases/{version}` | Get full release with recipes |
| POST | `/api/helm-releases` | Create a new release |
| PUT | `/api/helm-releases/{version}` | Update release details |
| DELETE | `/api/helm-releases/{version}` | Delete a release |
| PUT | `/api/helm-releases/{version}/status` | Update status (called by Jenkins) |
| POST | `/api/helm-releases/{version}/deploy` | Push to Git + trigger deployment |

### Recipes (within a release)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/helm-releases/{v}/recipes` | List recipes for a release |
| POST | `/api/helm-releases/{v}/recipes` | Add a recipe |
| PUT | `/api/helm-releases/{v}/recipes/{rv}` | Update a recipe |
| DELETE | `/api/helm-releases/{v}/recipes/{rv}` | Delete a recipe |
| GET | `/api/helm-releases/{v}/recipes/{rv}/components` | Get component versions |
| GET | `/api/helm-releases/{v}/recipes/{rv}/upgradePaths` | Get upgrade paths |

### Compare & Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/helm-releases/compare?from=X&to=Y` | Diff two Helm versions |
| GET | `/api/health` | Health check |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8081/api/ws/releases` | Real-time event stream |

**WebSocket Events:**
- `release_created` — new release added
- `release_updated` — release details changed
- `release_deleted` — release removed
- `recipe_added` — recipe added to a release
- `recipe_updated` — recipe modified
- `recipe_deleted` — recipe removed
- `status_changed` — deployment status changed (from Jenkins or deploy action)

---

## Data Model

### HelmRelease
```json
{
  "version": "0.0.4",
  "releaseName": "recipe-detection-v0-0-4",
  "status": "deployed",
  "recipes": [ ... ]
}
```

**Status lifecycle:** `pending` → `deploying` → `deployed` or `failed`

### Recipe
```json
{
  "version": "1.6.0",
  "description": "Next-gen HPE Ezmeral Runtime with upgraded analytics",
  "components": {
    "spark": "3.5.1",
    "kafka": "3.6.0",
    "airflow": "2.8.2",
    "hbase": "2.7.0"
  },
  "upgradePaths": ["1.5.0", "1.4.1"]
}
```

---

## GitOps Flow (How Deploy Works)

This is the core of the project — **GitOps** means Git is the single source of truth.

### What happens when you click Deploy:

1. **Backend generates YAML** — converts the release's recipes into a Helm values file (`values-v0.0.4.yaml`)
2. **Backend updates Chart.yaml** — sets the version field so Jenkins knows what to deploy
3. **Backend commits and pushes** — uses JGit to commit both files and push to GitHub
4. **Status → "deploying"** — broadcast to all browsers via WebSocket
5. **Jenkins detects the push** — SCM polling (every 1 minute) or manual Build Now
6. **Jenkins pipeline runs:**
   - Checks out code from GitHub
   - Reads Chart.yaml to determine version
   - Builds backend with Maven
   - Builds Docker image inside Minikube
   - Runs `helm install` (new) or `helm upgrade` (existing) with the values file
   - Waits for pods to be ready
   - Calls `PUT /api/helm-releases/{version}/status` with `"deployed"`
7. **Status → "deployed"** — broadcast to all browsers via WebSocket

### What happens on failure:

- Jenkins `post { failure }` block calls the status API with `"failed"`
- All browsers see the red "failed" badge instantly

### Why GitOps?

- **Audit trail** — every deployment is a Git commit, you can see who deployed what and when
- **Rollback** — revert a Git commit to roll back a deployment
- **Single source of truth** — what's in Git is what's deployed
- **Industry standard** — tools like ArgoCD and Flux follow this same pattern

---

## Jenkins Pipeline Stages

The `Jenkinsfile` defines 6 stages:

```
┌──────────────────┐
│ 1. Checkout       │  Pull code from GitHub
├──────────────────┤
│ 2. Chart Version  │  Read version from Chart.yaml
├──────────────────┤
│ 3. Build Backend  │  mvn clean package -DskipTests
├──────────────────┤
│ 4. Docker Image   │  minikube image build
├──────────────────┤
│ 5. Deploy to K8s  │  helm install/upgrade with values file
├──────────────────┤
│ 6. Verify         │  kubectl rollout status + show pods
├──────────────────┤
│ 7. Update Status  │  curl PUT /api/.../status → "deployed"
└──────────────────┘
```

- On **success**: status → `deployed`
- On **failure**: status → `failed`
- **Always**: workspace cleaned up

---

## Kubernetes Resources

When a Helm release is deployed, it creates:

| Resource | Name Pattern | Purpose |
|----------|-------------|---------|
| **Deployment** | `recipe-v{x}-recipe-detection` | Runs the application pod |
| **Service** | `recipe-v{x}-recipe-detection` | ClusterIP service on port 8080 |
| **ConfigMap** | `recipe-v{x}-recipe-detection-config` | Stores recipe data as JSON |

Each release gets its own set of resources, so multiple versions can run side-by-side.

### Pod Configuration
- **Image:** `hpe-recipe-detection:{version}`
- **Pull Policy:** `Never` (image is built locally in Minikube)
- **Port:** 8080 (overrides the default 8081 via `SERVER_PORT` env var)
- **Health Probes:** Liveness and readiness on `/api/health`
- **Resources:** 256Mi-512Mi memory, 250m-500m CPU

---

## How to Run

### Prerequisites
- Java 17+, Maven 3.9+, Node.js 18+, Docker, Minikube, Helm 3, Jenkins

### Start (2 terminals):

**Terminal 1 — Backend:**
```bash
cd backend # For Linux/macOS
./run-backend.sh

# For Windows
cd backend
run-backend.bat
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### Access:
- **Visualizer:** http://localhost:3000
- **Manage page:** http://localhost:3000/manage
- **API:** http://localhost:8082/api
- **Jenkins:** http://localhost:8080

### Background services (should already be running):
- **Minikube:** `minikube start --driver=docker`
- **Jenkins:** runs as a Windows service on port 8080

---

## Real-Time Updates (WebSocket)

- **Backend REST API**: Spring Boot 3.2.5 (port 8082)
- **Frontend Context**: React 18 + Vite (port 3000)
- **Real-time Engine**: native WebSockets (`ws://localhost:8082/api/ws/releases`). When any change happens — whether from the website, another user, or Jenkins — every browser gets updated instantly.

**How it works:**
1. `ReleaseWebSocketHandler.java` maintains a set of all connected WebSocket sessions
2. Every controller method that modifies data calls `wsHandler.broadcast(event, data)`
3. The broadcast sends a JSON message to every connected browser
4. The frontend `useRealtimeReleases.js` hook receives the message and refetches data

**Auto-reconnect:** If the WebSocket disconnects (backend restart, network issue), it automatically reconnects every 3 seconds.

---

## Sample Data

The project comes with 3 pre-loaded Helm releases:

| Helm Version | Recipes | Components |
|-------------|---------|------------|
| **0.0.1** | v1.3.0, v1.3.1 | Spark 3.1.2→3.2.0, Kafka 3.1.0→3.2.1, Airflow 2.3.0→2.4.1, HBase 2.4.6→2.4.8 |
| **0.0.2** | v1.3.2, v1.4.0 | Spark 3.2.1→3.3.0, Kafka 3.2.3→3.3.2, Airflow 2.4.3→2.5.3, HBase 2.4.9→2.5.4 |
| **0.0.3** | v1.4.1, v1.5.0 | Spark 3.3.1→3.4.0, Kafka 3.4.0→3.5.0, Airflow 2.6.3→2.7.0, HBase 2.5.5→2.6.0 |

Each newer recipe upgrades component versions. Upgrade paths show which older recipes can be upgraded to newer ones.

---

## Key Design Decisions

| Decision | Why |
|----------|-----|
| **In-memory data** | Keeps the project simple for demo purposes. Production would use a database. |
| **JGit (not CLI git)** | Pure Java, works on Windows without PATH issues, handles credentials cleanly. |
| **WebSocket (not polling)** | Instant updates, no wasted requests, scales to many clients. |
| **GitOps (not direct deploy)** | Industry standard, provides audit trail, matches how HPE operates. |
| **Per-version values files** | Each Helm release has its own `values-v{x}.yaml`, keeping versions isolated. |
| **Jenkins SCM polling** | Simpler than webhooks for local dev (no public URL needed). |
| **Multi-stage Docker** | Final image ~200MB instead of ~700MB, no build tools in production. |
| **Helm chart with ConfigMap** | Recipe data is non-sensitive, ConfigMaps are easy to inspect with kubectl. |
| **React Flow + Dagre** | Professional graph visualization with automatic layout. |

---

## Interview Talking Points

This project covers these enterprise software engineering topics:

1. **Kubernetes** — Deployments, Services, ConfigMaps, health probes, resource limits
2. **Helm** — Chart templating, values files, install/upgrade lifecycle, multi-version releases
3. **CI/CD** — Jenkins pipeline, automated build-deploy-verify cycle
4. **GitOps** — Git as source of truth, automated deployments from commits
5. **Docker** — Multi-stage builds, image optimization, local registry with Minikube
6. **REST API Design** — Full CRUD, proper HTTP status codes, resource-based URLs
7. **WebSocket** — Real-time bidirectional communication, broadcast pattern
8. **Spring Boot** — Dependency injection, configuration properties, service layer pattern
9. **React** — Hooks, component composition, routing, state management
10. **Full-Stack Integration** — Frontend → Backend → Git → CI/CD → K8s → WebSocket → Frontend
