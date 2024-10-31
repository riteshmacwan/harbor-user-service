## Prerequisites

Before getting started, ensure you have the following installed on your local machine:

- Node.js (>=18.x) installed on your machine. You can download it from [here](https://nodejs.org/).
- Yarn (>=1.22.x) package manager installed globally. You can install it via npm with the following command: npm install -g yarn

## Getting Started

To get a local copy up and running follow these simple steps:

1. Clone the repository:
   git clone https://millsoft0745@dev.azure.com/millsoft0745/Communication%20Module/\_git/Communication%20Module

2. Navigate into the project directory:
   cd mass_communication/

3. Install dependencies using Yarn:
   yarn install

4. place the below content in file called .env

```
NODE_ENV=local | development | qa | staging | production
HOST_URL=localhost
HOST_PORT=3006
PAGE_LIMIT=20
MAX_PIN_COUNT=5
KEYVAULT_URI=Key Vault URI
AZURE_CLIENT_ID=Azure Client ID
AZURE_TENANT_ID=Azure Tenant ID
AZURE_CLIENT_SECRET=Azure Client Secret


// configure envirenment variables locally
// Run following command in your project directory terminal

export KEYVAULT_URI="Place Keyvault URL"
export AZURE_CLIENT_ID="Place Azure Client ID"
export AZURE_TENANT_ID="Place Azure Tenant ID"
export AZURE_CLIENT_SECRET="Place Azure Client Secret"


```


```

# Configurations saved in the Key Vault

```

```
(local | development | qa | staging | production)-JWT-SECRET
(local | development | qa | staging | production)-MSSQL-HOST
(local | development | qa | staging | production)-MSSQL-DB
(local | development | qa | staging | production)-MSSQL-USERNAME
(local | development | qa | staging | production)-MSSQL-PASSWORD
(local | development | qa | staging | production)-MSSQL-PORT
(local | development | qa | staging | production)-REDIS-HOST
(local | development | qa | staging | production)-REDIS-PORT 
(local | development | qa | staging | production)-REDIS-PASSWORD
(local | development | qa | staging | production)-REDIS-DB
```

5. Start the server:
   nodemon

## Usage

- The server will start running on `http://localhost:8080` by default.
- You can make HTTP requests to this server using your preferred client (e.g., Postman, curl).

## Project Structure

```
├── config/ # Project & database configuration
├── controllers/ # Controller logic
├── logs/ # Request/Response logging
├── middlewares/ # Authentication/Validation middlewares
├── models/ # Models to connect with db
├── node_modules/ # Dependencies (generated)
├── repository/ # Data access repository (generated)
├── routes/ # Express.js route definitions
├── service/ # Express.js service layer definitions
├── types/ # Types and interface for data
├── uploads/ # File uploads
├── utils/ # Common helper functions
├── .env/ # Environment variables
├── .gitignore # Specifies intentionally untracked files to ignore
├── index.ts/ # Entry point for the server
├── package.json # Project metadata and dependencies
├── tsconfig.json # TypeScript configuration
└── yarn.lock # Yarn package lock file
```
