# DaggerForge Obsidian Plugin - Makefile
.PHONY: help build watch test deploy docker-build clean branch count

IMAGE  = daggerforge-builder
# Mount project into container; shadow node_modules with the container's copy
RUN    = docker run --rm -v $(PWD):/app -v /app/node_modules $(IMAGE)

# Rebuild image when Dockerfile or deps change
.docker-image: Dockerfile package-lock.json
	docker build -t $(IMAGE) .
	@touch .docker-image

help:
	@echo "_____________________________________________________________"
	@echo "DaggerForge Plugin"
	@echo "make build        - Build for production (Docker)"
	@echo "make watch        - Watch mode / dev build (Docker)"
	@echo "make test         - Run tests (Docker)"
	@echo "make deploy       - Deploy built files to Obsidian vault"
	@echo "make docker-build - Force-rebuild the Docker image"
	@echo "make clean        - Remove build output and Docker image"
	@echo "make count        - Count lines of code"
	@echo "make branch       - List all branches"
	@echo "_____________________________________________________________"

docker-build:
	docker build -t $(IMAGE) .
	@touch .docker-image

build: .docker-image
	$(RUN) npm run build

watch: .docker-image
	docker run --rm -v $(PWD):/app -v /app/node_modules $(IMAGE) npm run watch

test: .docker-image
	$(RUN) npm test

clean:
	@rm -f main.js .docker-image
	docker rmi $(IMAGE) 2>/dev/null || true
	@echo "Cleaned."

deploy:
	@bash scripts/deploy.sh

count:
	@powershell -ExecutionPolicy Bypass -File ./scripts/count-lines.ps1

branch:
	@git branch --format="%(refname:short)"
