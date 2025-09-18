# ============================================================================
# Makefile - Cross-platform build commands
# ============================================================================
.PHONY: help install-prereqs setup start stop restart status logs test clean

# Default target
help:  ## Show this help message
	@echo "Smart Tourist Safety - Keycloak Setup"
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-15s %s\n", $1, $2 }' $(MAKEFILE_LIST)

install-prereqs:  ## Check and install prerequisites
	@chmod +x install-requirements.sh
	@./install-requirements.sh

setup:  ## Complete first-time setup
	@chmod +x setup-complete.sh
	@./setup-complete.sh

start:  ## Start Keycloak services
	@docker-compose -f docker-compose-keycloak.yml up -d
	@echo "✅ Keycloak starting at: http://localhost:8080"

stop:  ## Stop Keycloak services  
	@docker-compose -f docker-compose-keycloak.yml stop
	@echo "✅ Keycloak services stopped"

restart:  ## Restart Keycloak services
	@docker-compose -f docker-compose-keycloak.yml restart
	@echo "✅ Keycloak services restarted"

status:  ## Check service status
	@chmod +x docker-status-check.sh
	@./docker-status-check.sh

logs:  ## View recent logs
	@echo "=== Keycloak Logs ==="
	@docker logs keycloak-sih --tail 50
	@echo ""
	@echo "=== PostgreSQL Logs ==="
	@docker logs postgres-keycloak --tail 20

test:  ## Run integration tests
	@python3 keycloak-test.py 2>/dev/null || python keycloak-test.py

daily:  ## Daily usage menu
	@chmod +x daily-usage.sh
	@./daily-usage.sh

clean:  ## Remove all containers and volumes
	@echo "⚠️  This will delete ALL Keycloak data!"
	@read -p "Continue? (y/N): " confirm && [ "$confirm" = "y" ]
	@docker-compose -f docker-compose-keycloak.yml down -v
	@docker volume prune -f
	@echo "🧹 Cleanup completed"

backup:  ## Create database backup
	@backup_name="keycloak-backup-$(date +%Y%m%d_%H%M%S).sql"; \
	docker exec postgres-keycloak pg_dump -U keycloak keycloak > "$backup_name"; \
	echo "💾 Backup created: $backup_name"

