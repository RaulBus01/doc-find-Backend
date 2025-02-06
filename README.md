# React Native & Deno Backend Server

This repository contains the backend server for our React Native app built with Expo. The backend is implemented using Deno 2.0 and connects to a PostgreSQL database. It features secure endpoints for uploading various types of data (text, PDF, images, audio), OAuth 2.0 based authentication, and integration with AI models.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [Project Layout](#project-layout)

## Overview

This backend server provides secure RESTful API endpoints that handle:
- **User Authentication:** via OAuth 2.0 and JWT token validation.
- **File Uploads:** accepting text, PDF, images, and audio files.
- **AI Model Integration:** processing user inputs with AI services and returning model responses.
- **Data Management:** interfacing with PostgreSQL for persistent storage.

## Features

- **Secure OAuth 2.0 Authentication:** Uses middleware to protect endpoints.
- **Robust File Handling:** Supports multiple file formats with validation and secure storage.
- **AI Integration:** Abstracted service layer for communicating with AI models.
- **PostgreSQL Integration:** For secure and scalable data storage.
- **Structured Logging & Error Handling:** Helps in monitoring and debugging.
- **Environment-based Configuration:** Uses environment variables for secrets and configuration.

## Architecture

- **Deno 2.0:** Main backend runtime using TypeScript.
- **Oak Framework:** HTTP server framework for routing and middleware support.
- **PostgreSQL:** Primary database for storing user and application data.
- **OAuth 2.0:** For secure authentication.
- **File Storage:** Configured for local development with the option to use cloud storage for production.
- **AI Model Service:** Separate module for handling AI-related requests.

## Prerequisites

Before running the project, ensure you have the following installed:

- [Deno](https://deno.land/#installation) (version 2.0 or above)
- [PostgreSQL](https://www.postgresql.org/download/)
- Git

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```
## Configuration
Environment Variables:

Create an .env file in the root directory with the following variables (adjust values as needed):
   PORT=8000
   DATABASE_URL=postgres://user:password@localhost:5432/mydb
   OAUTH_CLIENT_ID=yourclientid
   OAUTH_CLIENT_SECRET=yourclientsecret
## Configuration
  Environment Variables:
  ```bash
  PORT=8000
  DATABASE_URL=postgres://user:password@localhost:5432/mydb
  OAUTH_CLIENT_ID=yourclientid
  OAUTH_CLIENT_SECRET=yourclientsecret
```
## Running the Server
  ```bash
  deno run --allow-net --allow-read --allow-env src/app.ts
  ```
## Project Layout
  ```bash
  backend-server/
  ├── src/
  │   ├── controllers/      # API controllers for handling requests
  │   ├── middlewares/      # Custom middleware (e.g., authentication)
  │   ├── models/           # Database models and schema definitions
  │   ├── routes/           # API routes configuration
  │   ├── services/         # Business logic and external service integrations (e.g., AI models)
  │   └── utils/            # Utility functions (e.g., database connection)
  ├── config/               # Configuration files and scripts
  ├── tests/                # Automated tests for the project
  ├── .env                  # Environment variables (local development)
  ├── deps.ts               # Centralized dependency exports
  └── README.md             # This readme file
```
