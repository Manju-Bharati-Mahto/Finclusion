# Budget Tracker Application

A full-stack application for tracking personal finances, built with React, TypeScript, Node.js, Express, and MongoDB.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

This budget tracker application allows users to manage their personal finances by tracking income and expenses, categorizing transactions, and providing insights into spending habits.

## Features

- **User Authentication**: Register, login, and profile management
- **Dashboard**: Overview of financial status, recent transactions, and spending trends
- **Transactions**: Add, edit, and delete income and expense transactions
- **Categories**: Create and manage custom categories for transactions
- **Reporting**: Monthly summary of income and expenses
- **Data Visualization**: Charts and graphs for better understanding of spending patterns

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Chart.js
- Axios

### Backend
- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication

## Project Structure

```
budget-tracker/
├── backend/            # Backend API server code
│   ├── src/            # Source code
│   ├── dist/           # Compiled output
│   └── README.md       # Backend documentation
├── src/                # Frontend React application
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API and service functions
│   └── utils/          # Utility functions
├── public/             # Static files
└── README.md           # Main documentation
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/budget-tracker.git
cd budget-tracker
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Configure environment variables:
   - In the backend directory, copy `.env.example` to `.env` and update values
   - In the root directory, create a `.env` file with `REACT_APP_API_URL=http://localhost:5000/api`

### Running the Application

You can run the frontend and backend separately or together:

#### Option 1: Run Frontend and Backend Together (Recommended)

```bash
# From the root directory
npm run dev:all
```

#### Option 2: Run Frontend and Backend Separately

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, seed the database (optional):
```bash
cd backend
npm run seed
```

3. Start the frontend development server:
```bash
# From the root directory
npm run dev
```
# From the root directory
npm start
```

4. Open your browser and navigate to `http://localhost:3060`

### Windows Compatibility

This project has been configured to work on Windows systems:

1. Environment variables are set using `cross-env` for cross-platform compatibility
2. File paths use Node.js path module for proper handling on all operating systems
3. Upload functionality is Windows-compatible with proper file naming

#### Windows Setup Script

For Windows users, we've included setup scripts to make installation easier:

1. Using Command Prompt (CMD):
   ```
   setup-windows.bat
   ```

2. Using PowerShell:
   ```
   .\setup-windows.ps1
   ```

These scripts will install all dependencies, create necessary directories, and set up environment files.

### Switching from Mock to Real Backend

By default, the application uses a mock backend with localStorage. To use the real MongoDB backend:

1. Ensure the backend server is running
2. Open `src/services/api.ts` and change `USE_MOCK_AUTH` to `false`

## API Documentation

See the [backend README](backend/README.md) for detailed API documentation.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
