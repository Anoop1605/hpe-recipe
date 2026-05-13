#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "Loaded environment variables from .env"
else
  echo ".env file not found. Ensure GITOPS_TOKEN is set manually if needed."
fi

# Run the Spring Boot application
mvn spring-boot:run