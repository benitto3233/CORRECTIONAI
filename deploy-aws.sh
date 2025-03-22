#!/bin/bash

# Correcte-AI AWS Deployment Script
# This script automates the deployment of Correcte-AI to AWS ECS

set -e

# Configuration variables - change these as needed
APP_NAME="correcte-ai"
REGION="us-east-1"  # Change to your preferred region
ECR_REPOSITORY_BACKEND="${APP_NAME}-backend"
ECR_REPOSITORY_FRONTEND="${APP_NAME}-frontend"
CLUSTER_NAME="${APP_NAME}-cluster"
TASK_FAMILY_BACKEND="${APP_NAME}-backend-task"
TASK_FAMILY_FRONTEND="${APP_NAME}-frontend-task"
SERVICE_NAME_BACKEND="${APP_NAME}-backend-service"
SERVICE_NAME_FRONTEND="${APP_NAME}-frontend-service"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if the user is logged in to AWS
aws sts get-caller-identity &> /dev/null || {
    echo "Error: You are not logged in to AWS. Run 'aws configure' first."
    exit 1
}

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install it first."
    exit 1
fi

docker info &> /dev/null || {
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
}

echo "=== Starting Correcte-AI deployment to AWS ==="

# Create ECR repositories if they don't exist
echo "Creating ECR repositories if they don't exist..."
aws ecr describe-repositories --repository-names "${ECR_REPOSITORY_BACKEND}" --region "${REGION}" &> /dev/null || \
    aws ecr create-repository --repository-name "${ECR_REPOSITORY_BACKEND}" --region "${REGION}"

aws ecr describe-repositories --repository-names "${ECR_REPOSITORY_FRONTEND}" --region "${REGION}" &> /dev/null || \
    aws ecr create-repository --repository-name "${ECR_REPOSITORY_FRONTEND}" --region "${REGION}"

# Get the ECR login command
echo "Logging in to ECR..."
aws ecr get-login-password --region "${REGION}" | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com"

# Build and push backend image
echo "Building and pushing backend image..."
cd home/ubuntu/correcte-ai/backend
docker build -t "${ECR_REPOSITORY_BACKEND}:latest" .
docker tag "${ECR_REPOSITORY_BACKEND}:latest" "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY_BACKEND}:latest"
docker push "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY_BACKEND}:latest"
cd ../..

# Build and push frontend image
echo "Building and pushing frontend image..."
cd home/ubuntu/correcte-ai/frontend
docker build -t "${ECR_REPOSITORY_FRONTEND}:latest" .
docker tag "${ECR_REPOSITORY_FRONTEND}:latest" "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY_FRONTEND}:latest"
docker push "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY_FRONTEND}:latest"
cd ../..

# Create ECS cluster if it doesn't exist
echo "Creating ECS cluster if it doesn't exist..."
aws ecs describe-clusters --clusters "${CLUSTER_NAME}" --region "${REGION}" | grep "${CLUSTER_NAME}" &> /dev/null || \
    aws ecs create-cluster --cluster-name "${CLUSTER_NAME}" --region "${REGION}"

# Register task definitions
echo "Registering task definitions..."

# Backend task definition
cat > backend-task-def.json << EOF
{
  "family": "${TASK_FAMILY_BACKEND}",
  "networkMode": "awsvpc",
  "executionRoleArn": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "${APP_NAME}-backend",
      "image": "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY_BACKEND}:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 5000,
          "hostPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "5000" }
      ],
      "secrets": [
        { "name": "MONGODB_URI", "valueFrom": "arn:aws:ssm:${REGION}:$(aws sts get-caller-identity --query Account --output text):parameter/${APP_NAME}/MONGODB_URI" },
        { "name": "JWT_SECRET", "valueFrom": "arn:aws:ssm:${REGION}:$(aws sts get-caller-identity --query Account --output text):parameter/${APP_NAME}/JWT_SECRET" },
        { "name": "REDIS_URI", "valueFrom": "arn:aws:ssm:${REGION}:$(aws sts get-caller-identity --query Account --output text):parameter/${APP_NAME}/REDIS_URI" },
        { "name": "RABBITMQ_URI", "valueFrom": "arn:aws:ssm:${REGION}:$(aws sts get-caller-identity --query Account --output text):parameter/${APP_NAME}/RABBITMQ_URI" },
        { "name": "AI_API_KEY", "valueFrom": "arn:aws:ssm:${REGION}:$(aws sts get-caller-identity --query Account --output text):parameter/${APP_NAME}/AI_API_KEY" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${APP_NAME}-backend",
          "awslogs-region": "${REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "requiresCompatibilities": [
    "FARGATE"
  ],
  "cpu": "512",
  "memory": "1024"
}
EOF

# Frontend task definition
cat > frontend-task-def.json << EOF
{
  "family": "${TASK_FAMILY_FRONTEND}",
  "networkMode": "awsvpc",
  "executionRoleArn": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "${APP_NAME}-frontend",
      "image": "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY_FRONTEND}:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "hostPort": 80,
          "protocol": "tcp"
        },
        {
          "containerPort": 443,
          "hostPort": 443,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "BACKEND_URL", "value": "https://api.${APP_NAME}.com" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${APP_NAME}-frontend",
          "awslogs-region": "${REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "requiresCompatibilities": [
    "FARGATE"
  ],
  "cpu": "256",
  "memory": "512"
}
EOF

# Register the task definitions
aws ecs register-task-definition --cli-input-json file://backend-task-def.json --region "${REGION}"
aws ecs register-task-definition --cli-input-json file://frontend-task-def.json --region "${REGION}"

echo "Task definitions registered. You can now deploy them to your ECS cluster."
echo "To deploy the backend service:"
echo "aws ecs create-service --cluster ${CLUSTER_NAME} --service-name ${SERVICE_NAME_BACKEND} --task-definition ${TASK_FAMILY_BACKEND} --desired-count 1 --launch-type FARGATE --network-configuration 'awsvpcConfiguration={subnets=[subnet-xxxxxxxxxxxxxxxxx],securityGroups=[sg-xxxxxxxxxxxxxxxxx],assignPublicIp=ENABLED}' --region ${REGION}"

echo "To deploy the frontend service:"
echo "aws ecs create-service --cluster ${CLUSTER_NAME} --service-name ${SERVICE_NAME_FRONTEND} --task-definition ${TASK_FAMILY_FRONTEND} --desired-count 1 --launch-type FARGATE --network-configuration 'awsvpcConfiguration={subnets=[subnet-xxxxxxxxxxxxxxxxx],securityGroups=[sg-xxxxxxxxxxxxxxxxx],assignPublicIp=ENABLED}' --region ${REGION}"

echo "=== Deployment preparation complete ==="
echo "Next steps:"
echo "1. Create an Application Load Balancer for your services"
echo "2. Set up SSL certificates in AWS Certificate Manager"
echo "3. Configure your domain in Route 53"
echo "4. Create the Parameter Store entries for your environment variables"

# Clean up temporary files
rm backend-task-def.json frontend-task-def.json
