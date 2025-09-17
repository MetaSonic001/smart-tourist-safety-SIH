up:
	docker compose up -d
	@echo "Infra started. Run 'make migrate' next if needed."

migrate:
	./migrate.sh
	python seed_data.py

start:
	python orchestrator.py --start-all

test:
	# Run unit tests across services (assuming pytest in each)
	for dir in services/*; do \
		cd $$dir; \
		pytest; \
		cd ../..; \
	done

fabric:
	./fabric-dev-quickstart.sh

down:
	docker compose down