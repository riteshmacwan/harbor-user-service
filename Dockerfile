# Define the base image
FROM node:21

ARG AZURE_CLIENT_ID
ENV AZURE_CLIENT_ID=$AZURE_CLIENT_ID

ARG AZURE_CLIENT_SECRET   
ENV AZURE_CLIENT_SECRET=$AZURE_CLIENT_SECRET

ARG AZURE_TENANT_ID  
ENV AZURE_TENANT_ID=$AZURE_TENANT_ID

ARG KEYVAULT_URI
ENV KEYVAULT_URI=$KEYVAULT_URI

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the application code
COPY . .

# Install dependencies
RUN npm install

# Build the TypeScript application
RUN npm run build

# Expose the port your application listens on
EXPOSE 3002

# Start the application using the default command
CMD [ "node", "dist/index.js" ]