# Correcte-AI: AI-Powered Handwriting Grader for K-12 Teachers

Correct-AI is an innovative application designed to assist K-12 teachers in grading handwritten assignments using artificial intelligence. This platform leverages OCR (Optical Character Recognition) and advanced AI models to analyze, assess, and provide feedback on student handwriting submissions.

## Features

- **Intelligent Handwriting Analysis**: Automatically recognize and assess student handwriting
- **Customizable Grading Rubrics**: Create and manage personalized grading criteria
- **Detailed Feedback Generation**: Provide students with constructive, AI-assisted feedback
- **Assignment Management**: Organize and track assignments and submissions
- **Analytics Dashboard**: Gain insights into student performance and progress
- **Collaboration Tools**: Share resources and rubrics with other teachers
- **Notifications**: Stay updated on student submissions and system events

## Architecture

Correct-AI follows a modern microservices architecture with the following components:

- **Frontend**: React-based responsive web application
- **Backend API**: Node.js/Express RESTful API
- **Database**: MongoDB for document storage
- **Cache**: Redis for performance optimization
- **Queue**: RabbitMQ for asynchronous task processing
- **AI Services**: Integration with advanced AI models for text and handwriting analysis

## Prerequisites

- Node.js (v16+)
- Docker and Docker Compose
- MongoDB (or use the dockerized version)
- Redis (or use the dockerized version)
- RabbitMQ (or use the dockerized version)

## Local Development

### Setting Up the Environment

1. Clone the repository
2. Create a `.env` file based on the `.env.example` template
   ```bash
   cp .env.example .env
   ```
3. Update the `.env` file with your specific configuration values

### Running with Docker Compose

The easiest way to run the entire application stack locally is using Docker Compose:

```bash
docker-compose up -d
```

This will start all required services including:
- Backend API server
- Frontend web server
- MongoDB database
- Redis cache
- RabbitMQ message broker
- MongoDB Express (admin interface)

Access the application at:
- Frontend: http://localhost:80
- Backend API: http://localhost:5000
- MongoDB Express: http://localhost:8081
- RabbitMQ Management: http://localhost:15672

### Running Services Individually

#### Backend

```bash
cd home/ubuntu/correcte-ai/backend
npm install
npm run dev
```

#### Frontend

```bash
cd home/ubuntu/correcte-ai/frontend
npm install
npm start
```

## Cloud Deployment

Correct-AI can be deployed to AWS using the provided scripts and templates.

### Prerequisites for AWS Deployment

1. An AWS account with appropriate permissions
2. AWS CLI installed and configured
3. A registered domain name (optional, but recommended)
4. SSL certificate in AWS Certificate Manager

### Deployment Steps

1. **Prepare your AWS environment**

   Create the necessary parameters in AWS Systems Manager Parameter Store:

   ```bash
   aws ssm put-parameter --name "/correcte-ai/production/MONGODB_URI" --value "your-mongodb-connection-string" --type "SecureString"
   aws ssm put-parameter --name "/correcte-ai/production/JWT_SECRET" --value "your-secure-jwt-secret" --type "SecureString"
   aws ssm put-parameter --name "/correcte-ai/production/REDIS_URI" --value "your-redis-connection-string" --type "SecureString"
   aws ssm put-parameter --name "/correcte-ai/production/RABBITMQ_URI" --value "your-rabbitmq-connection-string" --type "SecureString"
   aws ssm put-parameter --name "/correcte-ai/production/AI_API_KEY" --value "your-ai-api-key" --type "SecureString"
   ```

2. **Deploy using CloudFormation**

   Use the provided CloudFormation template to create the entire infrastructure:

   ```bash
   aws cloudformation create-stack \
     --stack-name correcte-ai-production \
     --template-body file://cloudformation-template.yml \
     --parameters \
         ParameterKey=AppName,ParameterValue=correcte-ai \
         ParameterKey=Environment,ParameterValue=production \
         ParameterKey=VpcId,ParameterValue=vpc-xxxxxxxxxxxxxxxxx \
         ParameterKey=PublicSubnet1,ParameterValue=subnet-xxxxxxxxxxxxxxxxx \
         ParameterKey=PublicSubnet2,ParameterValue=subnet-xxxxxxxxxxxxxxxxx \
         ParameterKey=PrivateSubnet1,ParameterValue=subnet-xxxxxxxxxxxxxxxxx \
         ParameterKey=PrivateSubnet2,ParameterValue=subnet-xxxxxxxxxxxxxxxxx \
         ParameterKey=SSLCertificateArn,ParameterValue=arn:aws:acm:region:account:certificate/certificate_ID \
         ParameterKey=DomainName,ParameterValue=correcte-ai.com \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Deploy your application code**

   Use the provided deployment script:

   ```bash
   chmod +x deploy-aws.sh
   ./deploy-aws.sh
   ```

4. **Configure DNS**

   Create a CNAME record in your domain's DNS settings pointing to the generated AWS Load Balancer DNS name.

## Administration

### Default Admin Account

After deployment, you can access the system with the default admin credentials:

- Email: admin@correcte-ai.com
- Password: ChangeMe123!

**Important**: Change this password immediately after the first login!

### MongoDB Administration

Access MongoDB Express at the URL provided in the deployment outputs with the configured username and password.

## Monitoring and Logging

- Application logs are available in CloudWatch Logs
- System metrics are available in CloudWatch Metrics
- Custom analytics are available in the admin dashboard

## Security

Correct-AI implements multiple security measures:

- JWT-based authentication
- Role-based access control
- Data encryption at rest and in transit
- Input validation and sanitization
- Protection against common web vulnerabilities
- Rate limiting and brute force protection

## Support and Maintenance

For support, contact support@correcte-ai.com or open an issue in the repository.

## License

This project is proprietary software. All rights reserved.

---

© 2025 Correcte-AI. All rights reserved.
