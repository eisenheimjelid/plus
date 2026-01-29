install:
	docker compose run -u node --rm -T --entrypoint yarn web

test:
	docker compose run --rm --entrypoint node web --test src/test/*.test.js

up:
	docker compose up -d

dev: install up

up_prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod: install up_prod