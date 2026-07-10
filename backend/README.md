# Xasread API - AI Medical Consultation Backend

Xasread API is a FastAPI-based backend service for the AI Medical Consultation platform. It handles user authentication, medical consultation conversation histories, messaging, file attachments, and integrates with the Groq API (supporting Llama, Mixtral, and Gemma models) to provide clinical and patient-oriented responses.

---

## 🛠️ Tech Stack & Dependencies

The backend is built with Python 3.10+ and relies on the following key libraries:
* **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Web framework) & [Uvicorn](https://www.uvicorn.org/) (ASGI server)
* **Database & ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) (with `asyncio` extension) & [AioSQLite](https://github.com/nbraud/aiosqlite) (async driver for SQLite)
* **Authentication**: [Authlib](https://authlib.org/) (for Google OAuth 2.0 flow) & [PyJWT](https://pyjwt.readthedocs.io/) (for JSON Web Token authentication)
* **Settings & Environments**: [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) & [python-dotenv](https://github.com/theofidry/django-dotenv-filenames)
* **Testing**: [pytest](https://docs.pytest.org/) & [pytest-asyncio](https://github.com/pytest-dev/pytest-asyncio)

Refer to [requirements.txt](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/requirements.txt) for the full list of dependencies.

---

## 🗄️ Database Architecture

The backend uses a local SQLite database (`xasread.db`) managed via async SQLAlchemy. The database schema defined in [models.py](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/models.py) includes the following models:

1. **[User](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/models.py#L9)**: Stores authenticated users.
   - `id` (UUID string, Primary Key)
   - `email` (Unique string, indexed)
   - `name` (String)
   - `avatar_url` (String, nullable)
   - `google_id` (Unique string, indexed)
   - `created_at` (DateTime, UTC)
2. **[Conversation](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/models.py#L31)**: Grouping for chat threads.
   - `id` (UUID string, Primary Key)
   - `user_id` (Foreign Key referencing `users.id` with cascade delete)
   - `title` (String, defaults to "New Consultation")
   - `created_at` / `updated_at` (DateTime)
3. **[Message](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/models.py#L53)**: Stores dialogue messages.
   - `id` (UUID string, Primary Key)
   - `conversation_id` (Foreign Key referencing `conversations.id` with cascade delete)
   - `role` (String: `"user"` or `"assistant"`)
   - `content` (Text)
   - `created_at` (DateTime)
4. **[UserSettings](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/models.py#L69)**: Custom user configurations.
   - `user_id` (Primary Key & Foreign Key referencing `users.id` with cascade delete)
   - `theme` (String: e.g., `"light"`, `"dark"`)
   - `font_size` (String: e.g., `"medium"`)
   - `chat_mode` (String: e.g., `"plain"`, `"standard"`, `"clinical"`)

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the root backend directory to configure the application. Refer to the existing [.env](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/.env) configuration.

| Environment Variable | Description | Default / Example Value |
|----------------------|-------------|-------------------------|
| `DATABASE_URL` | SQLite database path with async SQLite driver | `sqlite+aiosqlite:///./xasread.db` |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console | `your-google-client-id` |
| `GOOGLE_CLIENT_SECRET`| OAuth 2.0 Client Secret from Google Cloud Console | `your-google-client-secret` |
| `JWT_SECRET` | Secret key used to sign JWT access tokens | `change-me-in-production` |
| `FRONTEND_URL` | Base URL of the frontend application for callbacks | `http://localhost:5173` |
| `GROQ_API_KEY` | Groq Console API Key for LLM inference | `gsk_...` |

Settings loading logic is handled in [config.py](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/config.py).

---

## 🚀 Getting Started

### 1. Set Up Virtual Environment

From the `backend` directory, create and activate a Python virtual environment:

```powershell
# Create venv
python -m venv venv

# Activate venv (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate venv (macOS/Linux)
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Database Migrations/Initialization

The database is initialized automatically during the startup lifespan defined in [main.py](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/main.py#L13-L16) by invoking `init_db()` from [database.py](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/database.py#L28-L30).

### 4. Start the Server

Launch the ASGI server locally using Uvicorn:

```bash
uvicorn main:app --reload
```
The API documentation will be available at:
* **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Alternative Redoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🔌 API Endpoints & Routes

The API router configuration is structured into separate routers in [main.py](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/main.py):

### 🔑 Authentication (`/auth`) — [auth.py](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/auth.py)
* `GET /auth/google`: Redirects users to Google's OAuth consent screen.
* `GET /auth/google/callback`: Processes Google OAuth callback, generates or retrieves the user profile, issues a JWT token, and redirects back to the frontend.
* `GET /auth/me`: Verifies and returns current user details.
* `POST /auth/logout`: Simulates logging out.
* `GET /auth/guest`: Allows non-registered users to start a guest session.

### 📁 Conversations (`/conversations`) — [conversations.py](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/conversations.py)
* `GET /conversations`: Lists all conversations for the authenticated user, sorted by last updated time.
* `POST /conversations`: Creates a new consultation session.
* `GET /conversations/{conv_id}`: Retrieves details of a specific conversation (including message history).
* `PATCH /conversations/{conv_id}`: Updates consultation metadata (e.g., title).
* `DELETE /conversations/{conv_id}`: Deletes a consultation session and all associated messages.

### 💬 Messages (`/conversations/{conv_id}/messages`) — [messages.py](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/messages.py)
* `GET /conversations/{conv_id}/messages`: Lists all messages in a conversation.
* `POST /conversations/{conv_id}/messages`: Manually adds a user/assistant message to a conversation.

### 🧠 Chat & AI Assistant (`/conversations`) — [app/api/v1/chat.py](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/app/api/v1/chat.py)
* `POST /conversations/{conv_id}/chat`: Sends a message to the AI assistant. It gathers conversation history, applies medical prompts, includes attachments context, queries Groq models, saves the assistant response, and returns the response.
* `POST /conversations/{conv_id}/rephrase`: Rephrases an assistant's medical response to target different user comprehension levels (`"plain"`, `"standard"`, or `"clinical"`).

---

## 🤖 AI Consultation Model Configuration

Xasread uses the **Groq API** for LLM generation. To ensure high availability, the backend implements a fallback mechanism in [app/services/chat_service.py](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/app/services/chat_service.py#L193-L194) over these model targets:
1. `llama-3.3-70b-versatile`
2. `mixtral-8x7b-32768`
3. `gemma2-9b-it`

### System Prompts & Modes
The assistant follows a structured clinical reasoning framework with mode-specific adaptations:
* **Plain**: Warm, simple language (6th grade level) with analogies. Targets patients with limited medical knowledge.
* **Standard**: Balanced, professional language (high school level). Targets general users. Briefly explains medical terms.
* **Clinical**: Precise medical terminology with ICD-10 codes and ranked differentials. Targets healthcare professionals.

---

## 🧪 Testing

Test coverage is located in the [tests](file:///C:/Users/daryl/OneDrive/Documents/Desktop/XasreadFree/backend/tests) folder. It runs against an in-memory SQLite database using `pytest` and `pytest-asyncio`.

Run all tests with:
```bash
pytest
```
