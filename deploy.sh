#!/bin/bash

# Configuration
FRONTEND_DIST="frontend/dist"
BACKEND_JAR="target/utility-0.0.1-SNAPSHOT.jar"
DOMAIN="utilityzone.in"
REMOTE_USER="u824574859"  # Your Hostinger SSH username
REMOTE_HOST="156.67.74.51"  # Your Hostinger server IP
REMOTE_PATH="/home/$REMOTE_USER/utility"
PUBLIC_HTML="/home/$REMOTE_USER/public_html"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Starting deployment...${NC}"

# Create remote directories
echo "Creating remote directories..."
ssh $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH"

# Upload backend JAR
echo "Uploading backend JAR..."
scp $BACKEND_JAR $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# Upload frontend files
echo "Uploading frontend files..."
scp -r $FRONTEND_DIST/* $REMOTE_USER@$REMOTE_HOST:$PUBLIC_HTML/

# Create systemd service file
echo "Creating systemd service..."
ssh $REMOTE_USER@$REMOTE_HOST "sudo tee /etc/systemd/system/utility.service << EOF
[Unit]
Description=Utility Application
After=network.target

[Service]
User=$REMOTE_USER
WorkingDirectory=$REMOTE_PATH
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=prod $REMOTE_PATH/utility-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143
TimeoutStopSec=10
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF"

# Reload systemd and start service
echo "Starting service..."
ssh $REMOTE_USER@$REMOTE_HOST "sudo systemctl daemon-reload && sudo systemctl enable utility && sudo systemctl start utility"

echo -e "${GREEN}Deployment completed!${NC}"
