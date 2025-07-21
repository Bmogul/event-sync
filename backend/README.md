# 🚀 FastAPI Backend - Event Sync

This is the backend service for the Event Sync project, built with **FastAPI**.

---

## 📦 Tech Stack

- **Python**: 3.11+
- **FastAPI**: High-performance API framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation and serialization
- **(Optional)** PostgreSQL via `asyncpg` or `SQLAlchemy`
- **(Optional)** Docker & Docker Compose

---

## 📁 Project Structure
backend/
├── app/
│ ├── main.py # Entry point (FastAPI app)
│ ├── api/ # API route definitions
│ ├── models/ # Pydantic schemas / DB models
│ ├── services/ # Business logic
│ └── core/ # Config, dependencies, utils
├── tests/ 
├── requirements.txt

---

## 🛠️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/your-username/event-sync.git
cd event-sync/backend
```

### 2. Create a virtal environment

```bash
python3.11 -m venv venv
source venv/bin/activate
```
### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the development server

```bash
fastapi dev main.py
```
The app will be available at: http://127.0.0.1:8000

---

## 📚 API Docs


FastAPI automatically generates interactive docs:

Swagger UI: http://127.0.0.1:8000/docs

ReDoc: http://127.0.0.1:8000/redoc

---

## 🧪 Running Tests

```bash
pytest
```
---

## 🧾 License

todo

