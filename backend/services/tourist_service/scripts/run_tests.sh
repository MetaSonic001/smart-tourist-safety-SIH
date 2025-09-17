#!/bin/bash
set -e

echo "Setting up test environment..."

# Set test environment variables
export DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/touristdb_test"
export REDIS_URL="redis://localhost:6379/1"
export JWT_SECRET="test-secret-key"
export USE_SUPABASE="false"

# Create test database if it doesn't exist
createdb touristdb_test 2>/dev/null || true

echo "Running database setup..."
python scripts/setup_db.py

echo "Running tests..."
pytest tests/ -v --tb=short

echo "Cleaning up..."
dropdb touristdb_test 2>/dev/null || true

echo "All tests completed!"

# Makefile
.PHONY: help install dev test clean docker-up docker-down

help:
    @echo "Available commands:"
    @echo "  install    - Install dependencies"
    @echo "  dev        - Run development server"
    @echo "  test       - Run tests"
    @echo "  clean      - Clean cache files"
    @echo "  docker-up  - Start Docker services"
    @echo "  docker-down- Stop Docker services"

install:
    pip install -r requirements.txt

dev:
    uvicorn main:app --host 0.0.0.0 --port 8003 --reload

test:
    bash scripts/run_tests.sh

clean:
    find . -type d -name __pycache__ -delete
    find . -type f -name "*.pyc" -delete
    rm -rf .pytest_cache
    rm -rf htmlcov
    rm -rf .coverage

docker-up:
    docker-compose up -d

docker-down:
    docker-compose down

setup-db:
    python scripts/setup_db.py

lint:
    flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
    black . --check

format:
    black .
    isort .