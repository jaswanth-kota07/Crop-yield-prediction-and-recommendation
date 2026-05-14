# Krishi-Mitra Modernization

We have successfully migrated the legacy PHP + MySQL **Krishi-Mitra** application to a robust decoupled stack using **React (Vite), Node.js (Express), and MySQL**. The frontend fully leverages **Vanilla CSS** to construct the exact glassmorphism, animations, and high-fidelity design from the original PHP code base, while securely querying a modular set of backend APIs instead of tightly coupling via PHP tags.

## What Has Been Built

### 1. Backend (Node.js + Express)
Located in `backend/`. This serves as the secure layer that coordinates with your local MySQL database and FastAPI ML model.

- **Endpoints Migrated & Modularized:**
  - `POST /api/auth/register` & `POST /api/auth/login` (Replaces `register.php` & `login.php`). Secured using JSON Web Tokens (JWT).
  - `POST /api/recommendations` & `GET /api/recommendations` (Replaces `save_recommendation.php`).
  - `POST /api/analysis` & `GET /api/analysis` (Replaces `save_image_analysis.php`). Supports Base64 image payload handling.
  - `POST /api/feedback` (Replaces `save_feedback.php`).
  - `GET /api/profile` & `PUT /api/profile` (Replaces profile actions from `profile.php`).
- **Proxy Layer:** The server securely relays requests (`/api/ml/predict/...`) to the underlying FastAPI backend, ensuring CORS validation and abstracting the ML location from the client browser.
- **Auto-initialization:** Connects to your local MySQL (`krishi_mitra` DB) and automatically generates the 5 identical tables from your previous implementation (`farmers`, `recommendation_history`, `analysis_images`, `user_feedback`, `notifications`) if they don't already exist.

### 2. Frontend (React + Vite)
Located in `frontend/`. Fast, stateful, component-driven client mapping precisely to the original layouts.

- **Pages Built:**
  - `LandingPage` containing the exact grid feature descriptions, particles, animated headers.
  - `LoginPage` implementing the original phone number authentication design minus form POST actions, now fully asynchronous via Axios.
  - `RegisterPage` bringing over HTML5 Geolocation queries linked with Nominatim to figure out a farmer's location, alongside exact layout properties.
  - `DashboardPage` which orchestrates a unified React Router Outlet, bringing the standard sidebar with its links (Dashboard, Crop Suggest, Health Analysis, etc.).
- **Tools & Context:** Added `AuthContext` to manage local JWT storage. Interceptors injected in `src/services/api.js` automatically stamp headers avoiding PHP session messiness.
- **Design:** Using Vanilla CSS variables defined in `src/index.css`, effectively compiling a completely custom UI framework matching the original Tailwind aesthetic without overhead or complexity. Native variables drive colors (`--color-primary`), spacing, container sizing, and `badge` tokens.

### 3. ML Model Integation
- Retained the current FastAPI ML structure cleanly. We query the local `http://localhost:8000` via Express safely.

## How To Run Locally

1. **Start ML API Model**
    ```sh
    cd ML-model
    python -m uvicorn api:app --reload --port 8000
    ```

2. **Start Backend Server**
    ```sh
    cd backend
    npm install
    npm run dev
    # Running on http://localhost:5000
    ```
    *Note: Ensure XAMPP/WAMP MySQL is running locally. The code connects as `root` with no password by default on port `3306`.*

3. **Start Frontend Client**
    ```sh
    cd frontend
    npm install
    npm run dev
    # Running on http://localhost:5173
    ```

## Configuration Note
The Gemini Vision API and ML configuration is located in the `.env` directories of both `/backend` and `/frontend`, securely utilizing variables that matching your exact PHP tokens.
