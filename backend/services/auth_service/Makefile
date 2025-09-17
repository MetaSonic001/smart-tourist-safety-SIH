.PHONY: help install dev test clean build deploy

help:  ## Show this help message
	@echo "Smart Tourist Auth & Onboarding Service"
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-15s %s\n", $1, $2 }' $(MAKEFILE_LIST)

install:  ## Install dependencies
	pip install -r requirements.txt
	pip install -e ".[dev]"

dev:  ## Start development environment
	docker-compose up -d postgres minio redis
	sleep 5
	alembic upgrade head
	python main.py

test:  ## Run all tests
	python run_tests.py

test-unit:  ## Run unit tests only
	python -m pytest tests/test_*.py -v

test-load:  ## Run load tests
	locust -f tests/load_test.py --host=http://localhost:8001

lint:  ## Run code linting
	black --check .
	isort --check-only .
	flake8 .
	mypy .

format:  ## Format code
	black .
	isort .

clean:  ## Clean up temporary files
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.coverage" -delete
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/

build:  ## Build Docker image
	docker build -t smart-tourist/auth-onboarding:latest .

deploy:  ## Deploy to production (placeholder)
	@echo "🚀 Deploying to production..."
	@echo "⚠️  Remember to:"
	@echo "   - Update environment variables"
	@echo "   - Run database migrations"
	@echo "   - Check service health"
	@echo "   - Monitor logs"

migrate:  ## Run database migrations
	alembic upgrade head

migrate-down:  ## Rollback last migration
	alembic downgrade -1

db-reset:  ## Reset database (WARNING: destroys data)
	@echo "⚠️  This will destroy all data. Press Ctrl+C to cancel."
	@sleep 10
	docker-compose down -v
	docker-compose up -d postgres
	sleep 5
	alembic upgrade head

logs:  ## Show service logs
	docker-compose logs -f auth-service

stop:  ## Stop all services
	docker-compose down

restart:  ## Restart the auth service
	docker-compose restart auth-service