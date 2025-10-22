#!/bin/bash

function main_menu {
    clear
    echo "==================================="
    echo "Utility App Manager"
    echo "==================================="
    echo
    echo "Deployment Options:"
    echo "1. Local Deployment"
    echo "2. Docker Deployment"
    echo "3. Exit"
    echo
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1) local_menu ;;
        2) docker_menu ;;
        3) exit 0 ;;
        *) main_menu ;;
    esac
}

function local_menu {
    clear
    echo "==================================="
    echo "Local Deployment Options"
    echo "==================================="
    echo
    echo "Database Operations:"
    echo "1. Switch to H2 file-based database"
    echo "2. Switch to PostgreSQL database"
    echo "3. Reset H2 database (delete files)"
    echo "4. Set H2 database password"
    echo
    echo "Security Configuration:"
    echo "5. Configure JWT Settings"
    echo "6. View Current Configuration"
    echo
    echo "Application:"
    echo "7. Start application with current config"
    echo "8. Back to main menu"
    echo
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1) switch_h2 ;;
        2) switch_postgres ;;
        3) reset_h2 ;;
        4) set_password ;;
        5) config_jwt ;;
        6) view_config ;;
        7) start_app ;;
        8) main_menu ;;
        *) local_menu ;;
    esac
}

function docker_menu {
    clear
    echo "==================================="
    echo "Docker Deployment Options"
    echo "==================================="
    echo
    echo "1. Build Docker Image"
    echo "2. Initialize Database (First-time setup)"
    echo "3. Start Application (Regular use)"
    echo "4. Stop Application"
    echo "5. View Application Logs"
    echo "6. Back to main menu"
    echo
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1) docker_build ;;
        2) docker_init ;;
        3) docker_start ;;
        4) docker_stop ;;
        5) docker_logs ;;
        6) main_menu ;;
        *) docker_menu ;;
    esac
}

function docker_build {
    echo
    echo "Building Docker image..."
    docker build -t utility-app .
    echo
    echo "Docker image built successfully."
    read -p "Press Enter to continue..."
    docker_menu
}

function docker_init {
    echo
    echo "Initializing database (first-time setup)..."
    docker run -it --rm \
        --name utility-init \
        -v ./data:/app/data \
        -e SPRING_PROFILES_ACTIVE=init \
        utility-app
    echo
    echo "Database initialization completed."
    read -p "Press Enter to continue..."
    docker_menu
}

function docker_start {
    echo
    echo "Starting application in Docker container..."
    docker run -d \
        --name utility-app \
        -p 8080:8080 \
        -v ./data:/app/data \
        utility-app
    echo
    echo "Application started on http://localhost:8080"
    read -p "Press Enter to continue..."
    docker_menu
}

function docker_stop {
    echo
    echo "Stopping and removing Docker container..."
    docker stop utility-app
    docker rm utility-app
    echo
    echo "Docker container stopped and removed."
    read -p "Press Enter to continue..."
    docker_menu
}

function docker_logs {
    echo
    echo "Viewing application logs..."
    docker logs utility-app
    echo
    read -p "Press Enter to continue..."
    docker_menu
}

function switch_h2 {
    echo
    echo "Switching to H2 file-based database..."
    {
        echo "# Auto-generated configuration file"
        echo "# Created by utility-manager.sh on $(date)"
        echo "spring.profiles.active=prod-h2"
        echo "utility.database.type=h2"
    } > src/main/resources/application.properties
    echo "Database configuration updated to H2"
    echo "Spring profile set to: prod-h2"
    read -p "Press Enter to continue..."
    local_menu
}

function switch_postgres {
    echo
    echo "Switching to PostgreSQL database..."
    {
        echo "# Auto-generated configuration file"
        echo "# Created by utility-manager.sh on $(date)"
        echo "spring.profiles.active=prod"
        echo "utility.database.type=postgresql"
    } > src/main/resources/application.properties
    echo "Database configuration updated to PostgreSQL"
    echo "Spring profile set to: prod"
    read -p "Press Enter to continue..."
    local_menu
}

function reset_h2 {
    echo
    echo "This will delete the current H2 database files."
    echo "WARNING: All data in the database will be lost!"
    echo
    read -p "Are you sure you want to continue? (y/n): " confirm
    
    if [[ $confirm != [Yy] ]]; then
        echo "Operation cancelled."
        read -p "Press Enter to continue..."
        local_menu
        return
    fi
    
    echo
    echo "Removing existing database files..."
    if [ -f data/utilitydb.mv.db ]; then
        rm -f data/utilitydb.mv.db
        echo "- Removed data/utilitydb.mv.db"
    fi
    
    if [ -f data/utilitydb.trace.db ]; then
        rm -f data/utilitydb.trace.db
        echo "- Removed data/utilitydb.trace.db"
    fi
    
    echo
    echo "Database files removed."
    echo "A new database will be created when the application starts."
    read -p "Press Enter to continue..."
    local_menu
}

function set_password {
    echo
    echo "Setting H2 database password..."
    echo "NOTE: The database must not be in use when changing the password."
    echo
    read -p "Enter new password (leave empty for no password): " new_password
    echo
    echo "Updating application-prod-h2.properties with the new password..."
    sed -i "s/h2.datasource.password=.*/h2.datasource.password=$new_password/" src/main/resources/application-prod-h2.properties
    echo "Password updated."
    read -p "Press Enter to continue..."
    local_menu
}

function start_app {
    echo
    echo "Building and starting application..."
    read -p "Reset database before starting? (y/n) [default=n]: " db_reset
    
    if [[ $db_reset == [Yy] ]]; then
        if [ -f data/utilitydb.mv.db ]; then
            rm -f data/utilitydb.mv.db
            echo "- Removed data/utilitydb.mv.db"
        fi
        
        if [ -f data/utilitydb.trace.db ]; then
            rm -f data/utilitydb.trace.db
            echo "- Removed data/utilitydb.trace.db"
        fi
        echo "Database files removed."
    fi
    
    echo "Building application..."
    ./mvnw clean package -DskipTests
    
    echo "Starting application..."
    java -jar target/utility-1.2.0-SNAPSHOT.jar
    local_menu
}

function config_jwt {
    echo
    echo "JWT Configuration"
    echo "================="
    echo
    echo "Current JWT configuration:"
    echo
    grep "app.jwt" src/main/resources/application-prod-h2.properties
    echo
    echo "Enter new JWT configuration values or press ENTER to keep existing values."
    echo
    
    read -p "JWT Secret (leave empty to keep current): " secret
    read -p "JWT Expiration in ms (leave empty to keep current, default 86400000): " expiration
    
    if [ -n "$secret" ]; then
        sed -i "s/app.jwt.secret=.*/app.jwt.secret=$secret/" src/main/resources/application-prod-h2.properties
        echo "JWT Secret updated."
    fi
    
    if [ -n "$expiration" ]; then
        sed -i "s/app.jwt.expiration=.*/app.jwt.expiration=$expiration/" src/main/resources/application-prod-h2.properties
        echo "JWT Expiration updated."
    fi
    
    echo
    echo "Updated JWT configuration:"
    echo
    grep "app.jwt" src/main/resources/application-prod-h2.properties
    read -p "Press Enter to continue..."
    local_menu
}

function view_config {
    echo
    echo "Current Configuration"
    echo "==================="
    echo
    echo "[Database Settings - H2 Profile]"
    grep -v "#" src/main/resources/application-prod-h2.properties
    echo
    echo "[Database Settings - PostgreSQL Profile]"
    grep -v "#" src/main/resources/application-prod.properties
    echo
    echo "[Active Configuration]"
    grep -v "#" src/main/resources/application.properties
    read -p "Press Enter to continue..."
    local_menu
}

# Start the main menu
main_menu