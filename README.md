
# 💊 Pharmacy Management System

A **web-based pharmacy dashboard** for managing drug inventory, supplier orders, sales, and real-time stock levels.  
This full-stack application features a secure login, smart alerts, and detailed activity logs, built with **ASP.NET Core (Backend)** and a **modern JavaScript frontend (Vite + React)**.

<p align="center">
  <img src="https://github.com/user-attachments/assets/5a79fa51-7bf5-4d2d-b86d-251a1ac020f0" alt="Pharmacy App UI" width="600"/>
</p>

---

## 🌐 Live Preview

> 🚀 **Live URL:** _Coming soon..._

---

## 🧰 Tech Stack

| Layer        | Technologies                       |
|--------------|------------------------------------|
| **Frontend** | React, Vite, Tailwind CSS          |
| **Backend**  | ASP.NET Core Web API (.NET 6+)     |
| **Database** | MSSQL (auto-created with EF Core)  |
| **Dev Tools**| VS Code, Swagger                   |

---

## 📦 Project Structure

```

Pharmacy-Management-System/
├── SPC.API/              # Backend Web API
├── SPC.Core/             # Core business logic
├── SPC.Infrastructure/   # DB context, repositories
├── SPC.Shared/           # Shared models
├── dumiUI.../src         # Frontend app (React + Tailwind)
└── README.md

````

---

## 📋 Features

- 📦 Drug inventory tracking  
- 🛒 Supplier & order management  
- 📊 Sales analytics  
- 🔔 Low stock alerts  
- 🔐 Secure login/authentication  
- 🧾 Activity logs  
- 🌐 Fully responsive UI  
- 📑 Swagger auto-generated API documentation  

---

## 🚀 Getting Started

### 📁 Clone the Repository

```bash
git clone https://github.com/codedbydumi/Pharmacy-Management-System.git
cd Pharmacy-Management-System
````

---

### ⚙️ Backend Setup (ASP.NET Core)

Navigate to the backend project folder:

```bash
cd SPC.API
```

Run the backend using:

```bash
dotnet run
```

✅ This will:

* Automatically create the MSSQL database using Entity Framework Core.
* Launch the Swagger UI at `https://localhost:5001/swagger` (or your configured port).

---

### 💻 Frontend Setup (Vite + React)

Navigate to the frontend folder:

```bash
cd dumiUI02.23.2025-main/src
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

🚀 The app will be available at `http://localhost:5173` (or your Vite default port).

---

## 🔄 API Integration

* Ensure the frontend is pointing to the correct backend URL (`https://localhost:5001/api/...`).
* Make sure **CORS** is enabled in the backend for cross-origin requests if needed.

---

## 📸 Screenshots

## 📸 Screenshots

### 🔹 GitHub Repository View
<p align="center">
  <img src="https://github.com/user-attachments/assets/02c5bbc3-ba47-47fb-9c25-30b707dc54fc" alt="GitHub Repo View" width="800"/>
</p>

### 🔹 VS Code Workspace
<p align="center">
  <img src="https://github.com/user-attachments/assets/46a549f4-eec2-4925-a09a-40022bbc17aa" alt="VS Code Workspace" width="800"/>
</p>


📁 Save your screenshots in an `Assets/` folder to ensure they render properly.

---

## ✅ Installation Summary

| Part     | Command                      | URL                              |
| -------- | ---------------------------- | -------------------------------- |
| Backend  | `dotnet run`                 | `https://localhost:5001/swagger` |
| Frontend | `npm install && npm run dev` | `http://localhost:5173`          |

---

> Made with ❤️ by **codedbydumi**
