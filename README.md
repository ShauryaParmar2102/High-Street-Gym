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

### 4️⃣ Database Setup

High Street Gym uses **MySQL 8.0** to manage users, activities, locations, sessions, bookings and blog posts.

### 1. Create the Database

Open MySQL Workbench and connect to your local MySQL server.

Run the following SQL:

```sql
CREATE DATABASE IF NOT EXISTS high_street_gym;
USE high_street_gym;
```

### 2. Create the Database Tables

Execute the following SQL statements in MySQL Workbench to create the six required tables.

**Users Table**

Stores member, trainer and administrator accounts.

```sql
CREATE TABLE users (
    user_id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('member', 'trainer', 'administrator')
        NOT NULL DEFAULT 'member',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    authentication_key VARCHAR(255) UNIQUE,
    PRIMARY KEY (user_id)
);

```

### 👤 Account Registration & User Roles

High Street Gym allows users to register and access features based on their assigned role.

#### 📧 Registration Requirements

- Users must provide a valid email address, such as `example@gmail.com`.
- Each email address must be unique.
- Passwords are securely hashed before being stored in the database.
- New accounts are automatically assigned the `member` role.

#### 🛡️ User Roles

| Role | Permissions |
|---|---|
| 👤 Member | Browse gym sessions, make bookings and view personal bookings |

| 🏋️ Trainer | View assigned sessions and manage sessions through authorised backend functionality |

| 🔑 Administrator | Manage users, activities, locations, sessions and bookings |

#### ⚙️ Managing User Roles

Administrators can change a user's role to `member`, `trainer` or `administrator` through the admin interface.

**🔒 Security Note:** Passwords should never be stored as plaintext. Use the application's registration functionality to ensure passwords are hashed correctly.

```

**Activities Table**

Stores the different gym activities.

```sql
CREATE TABLE activities (
    activity_id INT NOT NULL AUTO_INCREMENT,
    activity_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    PRIMARY KEY (activity_id)
);


**To add new activities, run the following SQL:**

```sql
INSERT INTO activities (activity_name, description)
VALUES
('Pilates', 'A relaxing class focused on flexibility and balance.'),
('Boxing', 'Develop fitness and boxing techniques.'),
('Yoga', 'Improve flexibility, balance and relaxation.'),
('HIIT', 'High-intensity exercises to improve fitness.');

```

**Locations Table**

Stores gym locations and their addresses.

```sql
CREATE TABLE locations (
    location_id INT NOT NULL AUTO_INCREMENT,
    location_name VARCHAR(100) NOT NULL UNIQUE,
    address VARCHAR(255),
    PRIMARY KEY (location_id)
);
```

**Sessions Table**

Stores scheduled gym sessions, including trainers, locations and capacities.

```sql
CREATE TABLE sessions (
    session_id INT NOT NULL AUTO_INCREMENT,
    activity_id INT NOT NULL,
    trainer_id INT NOT NULL,
    location_id INT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL DEFAULT 20,
    PRIMARY KEY (session_id),
    CONSTRAINT fk_sessions_activity
        FOREIGN KEY (activity_id) REFERENCES activities(activity_id),
    CONSTRAINT fk_sessions_trainer
        FOREIGN KEY (trainer_id) REFERENCES users(user_id),
    CONSTRAINT fk_sessions_location
        FOREIGN KEY (location_id) REFERENCES locations(location_id)
);
```

**Bookings Table**

Stores bookings made by members for gym sessions.

```sql
CREATE TABLE bookings (
    booking_id INT NOT NULL AUTO_INCREMENT,
    member_id INT NOT NULL,
    session_id INT NOT NULL,
    booking_status ENUM('booked', 'cancelled')
        NOT NULL DEFAULT 'booked',
    booked_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (booking_id),
    UNIQUE KEY unique_member_session (member_id, session_id),
    CONSTRAINT fk_bookings_member
        FOREIGN KEY (member_id) REFERENCES users(user_id),
    CONSTRAINT fk_bookings_session
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

**Posts Table**

Stores blog posts created by users.

```sql
CREATE TABLE posts (
    post_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255),
    PRIMARY KEY (post_id),
    CONSTRAINT fk_posts_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);
```

### 3. Verify the Tables

After executing the SQL statements, run:

```sql
SHOW TABLES;
```

You should see the following tables:

- `users`
- `activities`
- `locations`
- `sessions`
- `bookings`
- `posts`

### 4. Configure the Backend

Ensure the backend database connection uses the correct MySQL credentials and the database name `high_street_gym`.

After creating the tables, insert the sample gym activities using the SQL provided above. Users can register through the application, and administrators can manage user roles.

**Important:** Do not upload real user information, password hashes, authentication keys or database credentials to GitHub.
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

Made by **Shaurya Parmar**
