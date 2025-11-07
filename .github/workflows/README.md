# CI/CD Pipeline

This document provides an overview of the CI/CD pipeline for this project, which is defined in the [`ci-cd.yml`](ci-cd.yml) file.

## Overview

The CI/CD pipeline is designed to ensure code quality, security, and automated deployment of the application. It consists of the following main stages:

1.  **Testing:** Runs a suite of tests to verify the application's functionality.
2.  **Security Scan:** Checks for vulnerabilities in the project's dependencies.
3.  **Deployment:** Deploys the application to Vercel for preview and production environments.

## Workflow Triggers

The pipeline is automatically triggered by the following events:

-   **Push to `main` or `develop` branches:** Triggers the full pipeline, including testing, security scan, and deployment to production (for the `main` branch).
-   **Pull request to the `main` branch:** Triggers the testing, security scan, and a preview deployment to Vercel.

## Jobs

### `test`

This job runs on `ubuntu-latest` and tests the application against multiple Node.js versions (18.x and 20.x). The steps include:

1.  **Checkout code:** Checks out the repository's code.
2.  **Setup Node.js:** Sets up the specified Node.js version.
3.  **Install dependencies:** Installs the project's dependencies using `npm ci`.
4.  **Run type checking:** Runs `npm run type-check` to ensure type safety.
5.  **Run linting:** Runs `npm run lint` to enforce code style.
6.  **Run tests:** Executes the test suite with `npm run test:ci`.
7.  **Build application:** Builds the application using `npm run build`.

### `security-scan`

This job runs on `ubuntu-latest` and performs a security audit of the project's dependencies.

1.  **Checkout code:** Checks out the repository's code.
2.  **Run security audit:** Runs `npm audit --audit-level high` to check for high-level vulnerabilities.

### `deploy-preview`

This job runs on `ubuntu-latest` and deploys a preview version of the application to Vercel when a pull request is opened to the `main` branch. It depends on the `test` job.

1.  **Checkout code:** Checks out the repository's code.
2.  **Setup Node.js:** Sets up Node.js version 20.x.
3.  **Install dependencies:** Installs dependencies using `npm ci`.
4.  **Build for preview:** Builds the application for the preview environment.

### `deploy-production`

This job runs on `ubuntu-latest` and deploys the application to production on Vercel when a push is made to the `main` branch. It depends on the `test` job.

1.  **Checkout code:** Checks out the repository's code.
2.  **Setup Node.js:** Sets up Node.js version 20.x.
3.  **Install dependencies:** Installs dependencies using `npm ci`.
4.  **Build application:** Builds the application for the production environment.
5.  **Deploy to Vercel:** Deploys the application to Vercel using the Vercel CLI.

## Required Secrets

To enable deployment to Vercel, the following secrets must be configured in the GitHub repository's settings (`Settings > Secrets and variables > Actions`):

-   `DATABASE_URL`: The connection string for the production database.
-   `NEXTAUTH_SECRET`: The secret used to encrypt NextAuth.js session data.
-   `ENCRYPTION_KEY`: The key used for encryption.
-   `VERCEL_TOKEN`: A Vercel access token with permission to deploy the project.
-   `VERCEL_ORG_ID`: The ID of the Vercel organization.
-   `VERCEL_PROJECT_ID`: The ID of the Vercel project.
