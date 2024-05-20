all: build up

build:
	docker compose build

up:
	docker compose up

down:
	docker compose down

stop:
	docker compose stop

clean:
	-$(MAKE) down
	docker container prune -f
# @docker rm -f $$(docker ps -qa)
# -docker volume rm $$(docker volume ls -q --filter=dangling=true)
# -docker network rm $$(docker network ls -q --filter=dangling=true)

rm-volume: clean
	docker-compose down --volumes
# docker volume rm $$(docker volume ls -q)

.PHONY: all build up down clean rm-volume