# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS REST API backend based on a boilerplate architecture, customized for the Tiny Planet application. The project uses PostgreSQL with TypeORM and follows Hexagonal Architecture principles for clean separation of concerns.

## Development Commands

### Core Development
```bash
npm run start:dev          # Start development server with hot reload
npm run start:swc          # Start with SWC compiler for faster builds
npm run build              # Build for production
npm run start:prod         # Start production server
```

### Database Operations
```bash
npm run migration:generate # Generate new migration based on entity changes
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run schema:drop        # Drop database schema
npm run seed:run:relational # Run database seeds
```

### Code Quality
```bash
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run e2e tests
npm run test:e2e:relational:docker # Run e2e tests in Docker
```

### Resource Generation
```bash
npm run generate:resource:relational -- --name ResourceName # Generate new resource with hexagonal architecture
npm run add:property:to-relational   # Add property to existing resource
```

## Architecture

### Hexagonal Architecture
The codebase follows Hexagonal Architecture (Ports and Adapters) with clear separation between:

**Domain Layer** (`domain/`): Business entities with no infrastructure dependencies
**Application Layer**: Controllers and services orchestrating business logic  
**Infrastructure Layer** (`infrastructure/`): Database adapters, external service integrations

### Module Structure
```
src/[module]/
├── domain/
│   └── [entity].ts              # Domain entity
├── dto/                         # Data transfer objects
├── infrastructure/
│   └── persistence/
│       ├── [port].repository.ts # Repository interface (port)
│       └── relational/
│           ├── entities/[entity].entity.ts    # TypeORM entity
│           ├── mappers/[entity].mapper.ts     # Domain↔Entity mapper
│           └── repositories/[entity].repository.ts # Repository implementation
├── [module].controller.ts       # REST endpoints
├── [module].service.ts         # Business logic
└── [module].module.ts          # NestJS module configuration
```

### Key Dependencies
- **NestJS**: Framework with decorators, dependency injection, guards
- **TypeORM**: ORM with PostgreSQL, migrations, entities
- **Passport**: Authentication with JWT, Google, Apple strategies  
- **class-validator**: DTO validation with decorators
- **Swagger**: API documentation at `/docs`
- **Docker**: Containerization and test environments

### Authentication & Authorization
- JWT-based authentication with access/refresh tokens
- Social login support (Google, Apple, Facebook)
- Role-based access control (Admin/User roles)
- Passport strategies in `src/auth/strategies/`

### File Upload Support
Multiple upload strategies available:
- Local file system storage
- AWS S3 direct upload
- S3 pre-signed URL approach

## Environment Setup

Copy `env-example-relational` to `.env` and configure:
- Database connection (`DATABASE_*`)
- JWT secrets (`AUTH_JWT_SECRET`, `AUTH_JWT_TOKEN_EXPIRES_IN`)
- Social auth credentials (Google, Apple, Facebook)
- Email service configuration
- File upload settings (local/S3)

## Database Configuration

Uses TypeORM with PostgreSQL by default. Key files:
- `src/database/data-source.ts`: TypeORM configuration
- `src/database/migrations/`: Database migrations
- `src/database/seeds/`: Database seeding

## Testing Strategy

- **Unit tests**: `*.spec.ts` files alongside source code
- **E2E tests**: `test/` directory with Docker test environment
- **Coverage**: `npm run test:cov` generates coverage reports
- **Docker E2E**: Isolated test environment with containerized database

## Important Development Notes

### Repository Pattern
Create specific repository methods rather than universal ones:
```typescript
// ✅ Good - specific methods
async findByEmail(email: string): Promise<User>
async findByRoles(roles: string[]): Promise<User>

// ❌ Avoid - universal methods
async find(condition: UniversalConditionInterface): Promise<User>
```

### Code Generation
Use built-in generators to maintain architectural consistency:
- `npm run generate:resource:relational -- --name NewResource`
- `npm run add:property:to-relational` for extending existing resources

### Migration Workflow
1. Modify TypeORM entities
2. `npm run migration:generate` to create migration
3. Review generated migration file
4. `npm run migration:run` to apply changes

The project includes comprehensive seeding, extensive social authentication, file upload capabilities, and Docker-based testing infrastructure.