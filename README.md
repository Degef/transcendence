# ft_transcendence Project

## Overview
**ft_transcendence** is the final project of the 42 Common Core program, developed by our team. It is a single-page web application featuring an online real-time Pong game, tournaments, chat functionality, user account management, and player statistics. The project combines gameplay, competition, and social interaction, utilizing Django for the backend and vanilla JavaScript with HTML, CSS, and the Bootstrap library for the frontend.

## Features
### 1. Real-Time Pong Game
Players can engage in a responsive, real-time Pong game. The game uses server-client communication for real-time interactivity.

### 2. Tournament Mode
A structured tournament mode where multiple users can compete, adding a competitive aspect to the game.

### 3. Chat Feature
A live chat system is integrated to allow players to communicate during games or in the lobby, enhancing the social aspect of the game.

### 4. User Account System
- **User Creation & Authentication**: Players can create accounts, log in, and manage their profiles. Authentication is handled securely through Django’s built-in user management.
- **Profile Pages**: Each player has a dedicated profile page displaying personal information, statistics, and preferences.

### 5. Game Dashboard
Players have access to a personal dashboard that tracks game stats such as the number of games played, won, and lost, allowing users to keep track of their progress.

## Technologies Used
- **Backend**: Django (Python)
- **Frontend**: Vanilla JavaScript, HTML, CSS, Bootstrap
- **Database**: PostgreSQL
- **Real-time Communication**: Django Channels / WebSockets for real-time gameplay
- **Version Control**: Git
- **Deployed**: Docker and Docker Compose

## Installation
1. Clone the repository:
   ```bash
   https://github.com/Degef/transcendence.git

## Set Up Project

Follow these steps to set up and run the application using Docker:

### Step 1: Add Environment Variables

Create a `.env` file in the root directory and add the following content:

```plaintext
DATABASE_NAME=pong_app
DATABASE_USER=<username>
DATABASE_PASSWORD=<password>
DATABASE_HOST=my-postgres
DATABASE_PORT=5432
IP_ADDRESS=<your ipaddress>
UID_42=<your 42 client id>
SECRET_42=<your 42 secret>
```
note: you can leave the UID_42 and SECRET_42, but then 42 authentication api won't work

### Step 2: Build and Run with Docker Compose
```
make all

```
### Step 3: Database Migration

```
docker compose run web python manage.py migrate

```
### Access the App

At this point, the app should be up and running. Open your browser and access it using:

```
https://localhost

```


