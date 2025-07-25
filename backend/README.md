# 🚀 Event-Sync Backend - ASP.NET Core Web API

This is the backend service for the **Event-Sync** project, rebuilt using **ASP.NET Core 8 Web API**.

---

## 📦 Tech Stack

* **.NET SDK**: 8.0.115
* **ASP.NET Core Web API**
* **Swagger / OpenAPI** (auto-generated API docs)
* **PostgreSQL** 
* **Docker**

---

## 📁 Project Structure

```
backend/
├── Controllers/         # API endpoints
├── Models/              # Data models (DTOs or EF Core models)
├── Services/            # Business logic and helpers
├── Data/                # DbContext and database setup (if using EF Core)
├── Program.cs           # Entry point and configuration
├── appsettings.json     # Configuration (e.g., connection strings)
└── backend.csproj
```

---

## 🛠️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/bmogul/event-sync.git
cd event-sync/backend
```

### 2. Install .NET SDK

Make sure you have the [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) installed:

```bash
dotnet --version
# Should output: 8.0.115 or later
```

### 3. Run the development server

```bash
dotnet watch run
```

The app will be available at:
[http://localhost:5000](http://localhost:5000) (or [https://localhost:5001](https://localhost:5001) if using HTTPS)

---

## 📚 API Documentation

Auto-generated API docs are available via Swagger UI:

* Swagger UI: [http://localhost:{PORT}/swagger](http://localhost:{PORT}/swagger)

Versioning and grouping are supported using API version attributes and Swagger configuration (if enabled).

---

## 🧪 Running Tests

If you add unit/integration tests:

```bash
dotnet test
```

Make sure your tests are under a separate `backend.Tests/` project.

---

## 🧾 License

TODO

---
