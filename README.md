# 🏋️ High Street Gym

### 💪 Full-Stack Gym Management Web Application

High Street Gym is a full-stack web application developed as part of my **Diploma of Web Development at TAFE Queensland**.

The application allows gym members to browse fitness sessions, make bookings and interact with gym blog posts. Trainers and administrators have additional functionality to manage gym operations.

The project features a **React frontend**, a **Node.js/Express backend**, and a **MySQL database**.

---

## 🛠️ Technologies Used

### 🎨 Frontend

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![DaisyUI](https://img.shields.io/badge/DaisyUI-5A0EF8?style=for-the-badge&logo=daisyui&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css&logoColor=white)

### ⚙️ Backend

![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

### 🔧 Development Tools

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![VS Code](https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)

---

## ✨ Features

### 👤 Authentication and User Management

- User registration and login
- Authentication-key-based access
- Role-based permissions for members, trainers and administrators
- User management functionality for administrators

### 📅 Gym Timetable

- Browse available gym sessions
- Search for sessions using filters
- View session dates, times, locations, trainers and capacity
- Responsive session cards with hover animations
- Prevent bookings for past sessions

### 🎟️ Booking Management

- Book gym sessions
- Cancel existing bookings
- Prevent duplicate bookings
- Validate session capacity
- Display booking confirmation dialogs
- View personal bookings

### 📝 Gym Blog

- Create and view blog posts
- Role-based blog functionality
- Manage posts using backend operations

### 🏋️ Trainer Management

- View assigned gym sessions
- Manage sessions through authorised backend functionality
- View session and booking information
- Export session data to XML

### 🛡️ Administration

- Manage users
- Manage gym activities
- Manage locations
- Manage sessions and bookings
- Perform CRUD operations with role-based access controls

### 🌐 REST API

- RESTful endpoints built with Express.js
- API integration with the React frontend
- HTTP methods including GET, POST, PUT and DELETE where supported
- Authentication and authorisation checks
- Swagger/OpenAPI documentation and endpoint testing
- XML export functionality

---

## 📂 Project Structure

```text
High-Street-Gym/
├── frontend/
│   ├── src/
│   │   ├── authentication/
│   │   ├── booking/
│   │   ├── common/
│   │   ├── post/
│   │   ├── profile/
│   │   ├── sessions/
│   │   └── timetable/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── controllers/
│   │   └── api/
│   ├── models/
│   ├── public/
│   ├── views/
│   ├── server.mjs
│   └── package.json
│
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Install the following:

- Node.js and npm
- MySQL
- Git

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ShauryaParmar2102/High-Street-Gym.git
cd High-Street-Gym
```

### 2️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

### 3️⃣ Install Frontend Dependencies

From the project root:

```bash
cd frontend
npm install
```

### 4️⃣ Configure the Database

Set up a local MySQL database using the project's required schema.

Configure the backend database connection with your local credentials.

**Note:** Database setup details and required environment variables depend on the local configuration. Do not commit passwords or private credentials.

### 5️⃣ Start the Application

Start the Express backend using the start command defined in its `package.json`.

Then start the React frontend:

```bash
cd frontend
npm run dev
```

Open the local URL displayed by Vite.

---

## 📸 Screenshots

Screenshots of the application can be added here.

Suggested screenshots:

- 🔐 Login and registration
- 📅 Gym timetable
- 🎟️ Member bookings
- 📝 Blog posts
- 🛡️ Administration dashboard

---

## 👨‍💻 Development Process

During development, I worked on:

- Designing and implementing frontend components
- Building backend controllers and REST API endpoints
- Integrating a MySQL database
- Implementing CRUD functionality
- Testing API requests and responses
- Debugging JavaScript and React issues
- Improving responsive layouts
- Using documentation, reference projects and AI-assisted debugging to support development
- Maintaining the project with Git and GitHub

---

## 🎓 About This Project

This application was developed as part of my **Diploma of Web Development at TAFE Queensland**.

It demonstrates practical experience in full-stack JavaScript development, React, Express.js, relational databases, REST APIs and responsive web application design.

I plan to continue maintaining and improving the application as a portfolio project.

---

## 👤 Author

**Shaurya Parmar**

🎓 Diploma of Web Development — TAFE Queensland

💻 Aspiring Web Developer

🔗 [GitHub Profile](https://github.com/ShauryaParmar2102)

---

⭐ *Thanks for checking out High Street Gym!*
