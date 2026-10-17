# University Equipment Booking System

## 1. Project Overview

The University Equipment Booking System is a web-based application designed to help university users view equipment and manage equipment bookings. Users can check equipment availability, submit booking requests, and manage their bookings. The system also provides administrative functionality for managing equipment and booking requests.

## 2. Project Objectives

The main objectives of the system are to:

- Allow users to register and log in.
- Display equipment available for booking.
- Allow users to submit and manage equipment bookings.
- Help prevent conflicting bookings.
- Support the management of equipment and booking requests by administrators.
- Store and manage application data through Supabase.

## 3. Main Features

- **User authentication:** Supports user registration and login.
- **Equipment browsing:** Allows users to view available equipment.
- **Booking management:** Allows users to submit and manage booking requests.
- **Availability checking:** Helps users check equipment availability.
- **Booking conflict prevention:** Applies the system's booking rules to help prevent conflicting reservations.
- **Administrative management:** Provides functionality for managing equipment and booking requests.

## 4. Technologies Used

- **React:** Used to build the user interface.
- **TypeScript:** Provides static type checking for the application.
- **Vite:** Used to run the development server and build the application.
- **Supabase:** Provides backend services and database connectivity.
- **Git and GitHub:** Used for version control and team collaboration.

## 5. Requirements

To run the project locally, you need:

- Node.js and npm.
- Git, if you want to clone the repository.
- Access to the required Supabase project configuration.
- The environment variables required by the application.

## 6. Installation and Setup

### Step 1: Clone the Repository

Clone the project using the repository URL shown on the GitHub repository page:

```bash
git clone https://github.com/Luyanda-za/University-Equipment-Booking-System..git
```



### Step 2: Open the Project Folder

Move into the folder created when you cloned the repository:

```bash
cd University-Equipment-Booking-System.-main
```


### Step 3: Install Dependencies

Run the following command from the project directory:

```bash
npm install
```

This installs the dependencies listed in the project's package configuration.

### Step 4: Configure Supabase

Configure the environment variables required by the application before running it.

Check the project's source code to confirm the exact variable names and values required. Do not commit private keys, passwords, or other secrets to GitHub.

### Step 5: Start the Development Server

Run:

```bash
npm run dev
```

Open the local URL displayed in the terminal. The development server commonly uses `http://localhost:5173`, but use the URL shown by your terminal.

## 7. Available Development Commands

The project provides the following commands, as defined in its `package.json`:

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the development server. |
| `npm run build` | Builds the application for production. |
| `npm run lint` | Checks the code using the configured linting rules. |
| `npm run typecheck` | Checks TypeScript types without generating output files. |

## 8. Project Structure

The application source code is organised into folders and configuration files. The following are examples of common project locations; refer to the actual repository for the complete structure.

- `src/` – application source code.
- `src/components/` – reusable user interface components, if present.
- `src/pages/` – application pages, if present.
- `src/context/` – shared React context, if present.
- `src/lib/` – supporting libraries and configuration, if present.
- `public/` – static assets, if present.
- `package.json` – project dependencies and available scripts.

## 9. Testing

The application should be tested to check that its main functionality continues to work correctly.

Important areas to test include:

- User registration and login.
- Viewing available equipment.
- Submitting and managing bookings.
- Checking equipment availability.
- Preventing conflicting bookings.
- Administrative equipment and booking management.

The build, lint, and type-check commands should also be run after relevant code changes.

## 10. Deployment

The deployed application can be accessed at:

https://group4system12.netlify.app/

The deployed version should be checked after significant changes to confirm that the main features continue to work.

## 11. Version Control and Collaboration

Git and GitHub are used to manage the project's source code and support collaboration between team members. Changes should be organised into focused commits, tested before submission, and reviewed according to the team's agreed workflow.

## 12. Project Information

This project was developed as part of the Software Engineering module. It demonstrates the design, implementation, testing, and maintenance of a university equipment booking application.
