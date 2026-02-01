# DaggerForge Obsidian Plugin - Makefile
# Simple wrapper around npm commands for easier development

.PHONY: help install dev build watch test deploy

# Default target - show help
help:
	@echo _____________________________________________________________
	@echo DaggerForge Plugin
	@echo make install    - Install dependencies (npm install)
	@echo make build      - Build for production
	@echo make watch      - Watch mode for development (auto-rebuild)
	@echo make test       - Run tests
	@echo make deploy     - Deploy to Obsidian vault
	@echo _____________________________________________________________

# Install dependencies
install:
	npm install

# Production build
build:
	npm run build

# Watch mode for development
watch:
	npm run watch

# Run tests
test:
	npm test

# Deploy to Obsidian vault (PowerShell script)
deploy:
	powershell -ExecutionPolicy Bypass -File ./deploy.ps1