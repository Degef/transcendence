# Project Setup Guide

## Dockerizing the App

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
http://localhost:8000

```
