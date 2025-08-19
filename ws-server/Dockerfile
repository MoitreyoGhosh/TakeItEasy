# takeiteasy/ws-server/Dockerfile

# --- STAGE 1: The Builder ---
# This stage is responsible for building our TypeScript code into JavaScript.
# We start from a full Node.js image because it includes all the necessary build tools.
# We give this stage a name, "builder", so we can refer to it later.
FROM node:18-alpine AS builder

# Set the working directory for this stage.
WORKDIR /app

# Copy the dependency manifest files.
COPY package*.json ./

# Install ALL dependencies, including the 'devDependencies' like 'typescript'
# which are required to build the project.
RUN npm install

# Copy the rest of the application's source code.
COPY . .

# Run the 'build' script from our package.json.
# This executes 'tsc' and compiles our TypeScript code from 'src/' into
# JavaScript, outputting it to the 'dist/' directory.
RUN npm run build

# --- STAGE 2: The Production Runner ---
# This is the final stage that will create the lean image we actually deploy.
# We start from a fresh, lightweight 'alpine' image to keep the final size small.
FROM node:18-alpine

# Set the working directory for our final image.
WORKDIR /app

# Copy the 'package.json' and 'package-lock.json' files again.
COPY package*.json ./

# Install ONLY the production dependencies. We skip the 'devDependencies'
# because our code is already compiled, making the final image smaller and more secure.
RUN npm install --only=production

# Now, we selectively copy ONLY the compiled JavaScript code from the 'builder' stage.
# We are not copying the original TypeScript source code or the builder's node_modules.
# The `COPY --from=builder` command is the key to a multi-stage build.
COPY --from=builder /app/dist ./dist

# Tell Docker that the container will listen on port 3001 at runtime.
# This is documentation for the image; the port mapping is done in docker-compose.yml.
EXPOSE 3001

# Define the command that will be executed when the container starts.
# This runs the 'start' script from our package.json, which is `node dist/server.js`.
CMD ["npm", "start"]