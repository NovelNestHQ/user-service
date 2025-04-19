# NovelNest User Service

## Project Overview

NovelNest is an online bookstore platform built with a microservices architecture. This repository contains the User Service component, which handles user authentication, profile management, and purchase history tracking.

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Authentication**: SuperTokens
- **Database**: PostgreSQL with Prisma ORM
- **Messaging**: RabbitMQ for event processing
- **Container**: Docker, Docker Compose
- **Orchestration**: Kubernetes
- **JWT**: JSON Web Tokens for API authentication

## Project Structure

```
user-service/
├── docker-compose.yaml     # Local development environment setup
├── Dockerfile              # Container image definition
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── .env                    # Environment variables (not for production)
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma       # Database model definitions
│   └── migrations/         # Database migration files
├── src/                    # Source code
│   ├── config.ts           # SuperTokens configuration
│   ├── db.ts               # Database operations
│   ├── index.ts            # Main application entry point
│   ├── middleware.ts       # Express middleware (JWT verification)
│   ├── types.ts            # TypeScript type definitions
│   └── utils.ts            # Utility functions
└── hack/                   # Helper scripts
    └── create-supertokens-admin.sh # Setup script for admin users
```

## Features

- **User Authentication**
  - Registration and login using SuperTokens
  - JWT-based API authentication
  - Session management
- **User Profile Management**
  - User metadata storage and retrieval
- **Purchase History**
  - Track and display user book purchases
  - Store order status and details
- **Event Processing**
  - Consumer for RabbitMQ order events
  - Real-time purchase updates
- **SuperTokens Admin Dashboard**
  - User management interface
  - User roles management

## Prerequisites

Before you begin, ensure you have the following installed:
- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18 or later)
- [Yarn](https://yarnpkg.com/) package manager
- [Kubernetes](https://kubernetes.io/) for production deployment (optional)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) for Kubernetes management (optional)

## Local Development Setup

### Environment Variables

Create a `.env` file in the root directory with the following variables (already provided in the repository):

```
SUPERTOKENS_DATABASE_URL="postgresql://user:password@postgres-auth:5432/users_db"
USER_DATABASE_URL="postgresql://user:password@postgres-user:5432/users_db"
SUPERTOKENS_CORE_URL="http://supertokens-service:3567"
RABBITMQ_URL="amqp://rabbitmq"

USERSERVICE_API_URL="http://localhost:5000"
VITE_APP_UI_URL="http://localhost:5173"

SUPERTOKENS_DASHBOARD_ADMIN_EMAIL="admin@novelnest.com"
SUPERTOKENS_DASHBOARD_ADMIN_PASSWORD="password123"

QUEUE_NAME=orders
PORT=5000
VITE_APP_PORT=5173
JWT_SECRET=qwertyuiopasdfghjklzxcvbnm123456
```

### Using Docker Compose

The easiest way to run the service locally is using Docker Compose:

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f user-service

# Run database migrations if needed
docker-compose exec user-service yarn migrate

# Generate Prisma client
docker-compose exec user-service yarn generate
```

This will start:
- PostgreSQL instances for user data and SuperTokens
- SuperTokens authentication service
- The User Service API
- A script to create an admin user for the SuperTokens dashboard

### Running without Docker

If you prefer to run the service directly:

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn generate

# Run database migrations
yarn migrate

# Start the development server with hot reloading
yarn dev:hot
```

Note: You'll need to have PostgreSQL and RabbitMQ running separately.

## API Endpoints

The service exposes the following REST endpoints:

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in an existing user
- `POST /api/auth/logout` - Log out the current user
- `GET /api/auth/user` - Get the current user's profile (authenticated)

### User Data

- `GET /api/user/purchases` - Get the current user's purchase history (authenticated)

## Message Queue Consumer

The service consumes order events from RabbitMQ:

- `ORDER_CREATED` - When a user purchases a book
- `ORDER_UPDATED` - When an order status changes

## Deployment to Kubernetes

The NovelNest application includes Kubernetes manifests for production deployment located in the `k8s-manifests/user-service` directory.

### Deployment Steps

```bash
# Navigate to the k8s-manifests directory
cd ../k8s-manifests

# Deploy the user service and dependencies
./deploy-user-service.sh

# To deploy the entire application
./deploy-all.sh
```

The deployment includes:
- PostgreSQL databases for user data and SuperTokens
- SuperTokens service for authentication
- User service API deployment and service
- Necessary migrations

## SuperTokens Dashboard

After deployment, you can access the SuperTokens dashboard for user management:

1. Port-forward the SuperTokens service:
   ```bash
   kubectl port-forward svc/supertokens 3567:3567 -n novelnest
   ```

2. Access the dashboard at `http://localhost:3567/auth/dashboard`

3. Log in with the admin credentials defined in environment variables:
   - Email: `admin@novelnest.com`
   - Password: `password123`

## Testing

You can test the API endpoints using tools like [Postman](https://www.postman.com/) or [curl](https://curl.se/).

Example login request:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "yourpassword"}'
```

## Cleanup

### Docker Compose

```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v
```

### Kubernetes

```bash
# Remove user service resources
kubectl delete -f user-service.yaml
kubectl delete -f postgres-user.yaml
kubectl delete -f postgres-auth.yaml
kubectl delete -f supertokens.yaml

# Or to remove all NovelNest resources
kubectl delete namespace novelnest
```

## Contributing

We welcome contributions to the NovelNest project! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*This README is for the user-service component of the NovelNest application, a microservices-based online bookstore platform.*