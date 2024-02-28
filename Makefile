all:
	docker compose up --build

build:
	docker compose build

up:
	docker-compose up

down:
	docker compose down

clean:
	docker compose down
	docker rm $(docker ps -a -q) -f
