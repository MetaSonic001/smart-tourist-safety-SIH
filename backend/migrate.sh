#!/bin/bash

# Run Alembic migrations for each service (assuming each has alembic.ini in services/<service>/)
for service in auth tourist alerts dashboard operator; do  # Add services with DB as needed; skip blockchain/ml if no DB
    echo "Running migrations for $service"
    cd services/$service
    alembic upgrade head
    cd ../..
done

echo "All migrations complete."