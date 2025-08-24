#!/bin/bash

echo "======================================"
echo " ParkDog - Build and Deploy Script"
echo "======================================"

if [ $# -eq 0 ]; then
    echo "Usage: $0 [build|deploy|full|stop|logs|clean]"
    echo ""
    echo "Commands:"
    echo "  build  - Build all Docker images"
    echo "  deploy - Start services with Docker Compose"
    echo "  full   - Build and deploy everything"
    echo "  stop   - Stop all services"
    echo "  logs   - Show container logs"
    echo "  clean  - Remove all containers and images"
    exit 1
fi

COMMAND=$1

case $COMMAND in
    "build")
        echo "Building Docker images..."
        docker-compose build --no-cache
        echo "Build completed!"
        ;;
    
    "deploy")
        echo "Starting services..."
        docker-compose up -d
        echo "Waiting for services to start..."
        sleep 10
        echo "Services started!"
        echo "Frontend: http://localhost:3000"
        echo "Backend:  http://localhost:5000"
        ;;
    
    "full")
        echo "Building and deploying..."
        docker-compose build --no-cache
        docker-compose up -d
        echo "Waiting for services to start..."
        sleep 15
        echo ""
        echo "======================================"
        echo " Services Ready!"
        echo "======================================"
        echo "Frontend: http://localhost:3000"
        echo "Backend:  http://localhost:5000"
        echo "Database: localhost:5432"
        echo ""
        echo "Run './build-deploy.sh logs' to see logs"
        ;;
    
    "stop")
        echo "Stopping services..."
        docker-compose down
        echo "Services stopped!"
        ;;
    
    "logs")
        echo "Showing logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    
    "clean")
        echo "WARNING: This will remove all containers and images!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Cleaning up..."
            docker-compose down -v --remove-orphans
            docker system prune -af --volumes
            echo "Cleanup completed!"
        else
            echo "Cancelled."
        fi
        ;;
    
    *)
        echo "Invalid command: $COMMAND"
        exit 1
        ;;
esac