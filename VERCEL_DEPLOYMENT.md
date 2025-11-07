# Vercel Deployment

This document explains how to deploy the application to Vercel.

## Automated Deployment with GitHub Actions

The recommended way to deploy to Vercel is through the automated CI/CD pipeline configured in this repository. The pipeline is defined in the `.github/workflows/ci-cd.yml` file and includes steps for testing, security scanning, and deploying to Vercel.

For a detailed explanation of the CI/CD pipeline, please refer to the [`.github/workflows/README.md`](.github/workflows/README.md) file.

### Production Deployment

A production deployment is automatically triggered when a push is made to the `main` branch. The `deploy-production` job in the CI/CD pipeline will build the application and deploy it to Vercel.

### Preview Deployment

A preview deployment is automatically triggered when a pull request is opened to the `main` branch. The `deploy-preview` job in the CI/CD pipeline will build the application and deploy it to a unique preview URL on Vercel.

### Required Secrets

For the automated deployment to work, you need to configure the following secrets in your GitHub repository's settings (`Settings > Secrets and variables > Actions`):

-   `DATABASE_URL`: The connection string for the production database.
-   `NEXTAUTH_SECRET`: The secret used to encrypt NextAuth.js session data.
-   `ENCRYPTION_KEY`: The key used for encryption.
-   `VERCEL_TOKEN`: A Vercel access token with permission to deploy the project.
-   `VERCEL_ORG_ID`: The ID of the Vercel organization.
-   `VERCEL_PROJECT_ID`: The ID of the Vercel project.

## Manual Deployment

You can also deploy the application to Vercel manually using the Vercel CLI.

1.  Install the Vercel CLI: `npm i -g vercel`
2.  Run the deployment command: `vercel --prod`

## Vercel Configuration File

The `vercel.json` file in the root of the repository contains basic configuration for Vercel deployments. In its current state, it specifies the build command and a default `DATABASE_URL`.

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DATABASE_URL": "file:./prisma/dev.db"
  }
}
```

## Potential Conflict with Netlify Configuration

Please be aware that this project also contains a `netlify.toml` file, which is used to configure deployments to Netlify. This file may conflict with the Vercel deployment setup.

If Vercel is the intended deployment platform, you might consider removing the `netlify.toml` file to avoid confusion. However, if you plan to deploy to both platforms, you will need to manage the configurations carefully.
