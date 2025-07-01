# UEAB Parent Portal Backend

A comprehensive Node.js backend API for the University of Eastern Africa, Baraton (UEAB) Parent Portal system.

## 🚀 Features

- **Authentication System**: JWT-based login/signup with password reset
- **Dashboard Analytics**: Overview stats, recent activities, notifications
- **Student Management**: Personal info, academic details, relationship management
- **Academic Results**: Grade tracking, performance analytics, GPA calculation
- **Attendance Tracking**: Daily attendance, monthly summaries, calendar view
- **Financial Management**: Fee payments, transactions, financial reports
- **Security**: Rate limiting, input validation, CORS protection

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment example file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your database credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ueab_parent_portal
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

**Option A: Automatic Setup (Recommended)**
```bash
npm run setup-db
```

**Option B: Manual Setup**
1. Create MySQL database:
```sql
CREATE DATABASE ueab_parent_portal;
```

2. Run the schema file:
```bash
mysql -u your_username -p ueab_parent_portal < database/schema.sql
```

### 4. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📊 Database Schema

The system includes the following tables:

- **parents**: Parent/guardian information
- **students**: Student details and academic info
- **parent_student**: Relationship mapping between parents and students
- **subjects**: Academic subjects and courses
- **academic_results**: Grades and assessment records
- **attendance**: Daily attendance tracking
- **fee_structure**: Fee types and amounts
- **fee_payments**: Payment transactions
- **notifications**: System notifications
- **password_reset_tokens**: Password reset functionality

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview data
- `GET /api/dashboard/notifications` - User notifications
- `PUT /api/dashboard/notifications/:id/read` - Mark notification as read
- `GET /api/dashboard/quick-stats` - Quick statistics

### Students
- `GET /api/students` - List all students for parent
- `GET /api/students/:studentId` - Get student details
- `PUT /api/students/:studentId` - Update student information
- `GET /api/students/:studentId/report` - Generate student report

### Academic Results
- `GET /api/results/overview` - Results overview
- `GET /api/results/student/:studentId` - Student results
- `POST /api/results` - Add academic result
- `PUT /api/results/:resultId` - Update academic result
- `DELETE /api/results/:resultId` - Delete academic result

### Attendance
- `GET /api/attendance/overview` - Attendance overview
- `GET /api/attendance/student/:studentId` - Student attendance
- `POST /api/attendance` - Add attendance record
- `PUT /api/attendance/:attendanceId` - Update attendance
- `DELETE /api/attendance/:attendanceId` - Delete attendance
- `GET /api/attendance/calendar/:studentId` - Calendar view

### Financials
- `GET /api/financials/overview` - Financial overview
- `GET /api/financials/student/:studentId` - Student financials
- `POST /api/financials/payment` - Record payment
- `PUT /api/financials/payment/:paymentId` - Update payment
- `GET /api/financials/fee-structure` - Fee structure
- `GET /api/financials/report/:studentId` - Financial report

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📝 Sample Data

The setup script includes sample data:

- **Demo Parent**: sarah.johnson@example.com (accepts any password)
- **Demo Students**: Emma Johnson & Alex Johnson
- **Subjects**: 10 common academic subjects
- **Fee Structure**: Sample fee types and amounts

## 🧪 Testing

```bash
npm test
```

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── database/
│   └── schema.sql           # Database schema
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── validation.js        # Request validation
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── dashboard.js         # Dashboard routes
│   ├── students.js          # Student management
│   ├── results.js           # Academic results
│   ├── attendance.js        # Attendance tracking
│   └── financials.js        # Financial management
├── server.js                # Main server file
├── setup-database.js        # Database setup script
├── package.json
├── env.example
└── README.md
```

## 🔧 Development

### Adding New Routes

1. Create a new route file in `routes/`
2. Add validation middleware if needed
3. Import and register in `server.js`

### Database Migrations

For production, consider using a migration tool like `knex` or `sequelize`.

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
JWT_SECRET=your_production_jwt_secret
```

### Security Considerations

- Use strong JWT secrets
- Enable HTTPS in production
- Configure proper CORS origins
- Set up database backups
- Use environment variables for sensitive data

## 📞 Support

For technical support or questions, contact the UEAB IT Department.

## 📄 License

This project is proprietary software for the University of Eastern Africa, Baraton. 