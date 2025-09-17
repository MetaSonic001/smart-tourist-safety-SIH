import argparse
import subprocess
import os
from multiprocessing import Process

SERVICES = {
    'auth': {'port': 8001, 'module': 'services.auth.main:app'},
    'blockchain': {'port': 8002, 'module': 'services.blockchain.main:app'},
    'tourist': {'port': 8003, 'module': 'services.tourist.main:app'},
    'ml': {'port': 8004, 'module': 'services.ml.main:app'},
    'alerts': {'port': 8005, 'module': 'services.alerts.main:app'},
    'dashboard': {'port': 8006, 'module': 'services.dashboard.main:app'},
}
if os.getenv('ENABLE_OPERATOR', 'true').lower() == 'true':
    SERVICES['operator'] = {'port': 8007, 'module': 'services.operator.main:app'}

def start_service(service_name, port, module):
    log_dir = 'logs'
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, f'{service_name}.log')
    with open(log_file, 'w') as log:
        subprocess.Popen(
            ['uvicorn', module, '--host', '0.0.0.0', '--port', str(port), '--reload'],
            stdout=log, stderr=log
        )
    print(f"Started {service_name} on port {port}, logs at {log_file}")

def main():
    parser = argparse.ArgumentParser(description="Orchestrator for local FastAPI services")
    parser.add_argument('--start-all', action='store_true', help="Start all services in background")
    parser.add_argument('--service', type=str, help="Start a specific service (e.g., auth)")
    args = parser.parse_args()

    if args.start_all:
        processes = []
        for name, info in SERVICES.items():
            p = Process(target=start_service, args=(name, info['port'], info['module']))
            p.start()
            processes.append(p)
        for p in processes:
            p.join()
    elif args.service:
        if args.service in SERVICES:
            info = SERVICES[args.service]
            start_service(args.service, info['port'], info['module'])
        else:
            print(f"Unknown service: {args.service}")
    else:
        parser.print_help()

if __name__ == '__main__':
    main()