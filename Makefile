all: build up

build:
	docker compose build

up:
	docker compose up

down:
	docker compose down

clean:
	-$(MAKE) down
	-docker compose rm -f
	-docker volume rm $$(docker volume ls -q --filter=dangling=true)
	-docker network rm $$(docker network ls -q --filter=dangling=true)

.PHONY: all build up down clean
