#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
SERVICE_NAME="agentmesh"

usage() {
  cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  start     Build and start the backend Docker service
  stop      Stop the backend Docker service
  restart   Stop and start the backend Docker service
  status    Show service status
  logs      Tail backend service logs
  help      Show this message
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

command="$1"
shift

cd "$ROOT_DIR"

case "$command" in
  start)
    docker compose -f "$COMPOSE_FILE" up -d --build "$SERVICE_NAME"
    ;;
  stop)
    docker compose -f "$COMPOSE_FILE" stop "$SERVICE_NAME"
    ;;
  restart)
    docker compose -f "$COMPOSE_FILE" stop "$SERVICE_NAME"
    docker compose -f "$COMPOSE_FILE" up -d --build "$SERVICE_NAME"
    ;;
  status)
    docker compose -f "$COMPOSE_FILE" ps "$SERVICE_NAME"
    ;;
  logs)
    docker compose -f "$COMPOSE_FILE" logs -f "$SERVICE_NAME"
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    echo "Unknown command: $command"
    usage
    exit 1
    ;;
esac
