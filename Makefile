
COMPOSE_FILE = docker-compose.yml

PROJECT_NAME = transcendence

DOCKER_COMPOSE = docker compose -p $(PROJECT_NAME)

all: build up

up:
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file .env up

build:
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file .env build

down:
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file .env down

clean: stop
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file .env down -v --remove-orphans
	-docker volume prune -f
	-docker network prune -f

stop:
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file .env stop

.PHONY: all up build clean stop
