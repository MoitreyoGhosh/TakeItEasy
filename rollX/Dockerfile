# takeiteasy/rollx/Dockerfile

# --- STAGE 1: The Builder ---
# This stage installs all dependencies and builds our Next.js application.
# We use the full `node:18` image because it has all the tools needed to compile
# native dependencies that might be part of the Next.js toolchain.
# We give this stage a name, "builder", so we can refer to it later.
FROM node:18 AS builder

# Set the working directory inside the container.
WORKDIR /app

# Copy the dependency manifest files.
COPY package*.json ./

# Install all dependencies, including development dependencies.
RUN npm install

# Copy the rest of the application source code.
COPY . .

# Set an environment variable to disable Next.js telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Run the Next.js build command. This creates an optimized production
# build in the `.next` folder.
RUN npm run build

# --- STAGE 2: The Production Runner ---
# This is the final stage that will create the image we actually deploy.
# We start from a fresh, lightweight 'alpine' image.
FROM node:18-alpine

# Set the working directory.
WORKDIR /app

# Set the environment to 'production'. This is critical for Next.js to run
# in its optimized mode.
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# For security, we will run the app as a non-root user.
# We create a new system user and group named 'nextjs'.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Now, we selectively copy ONLY the necessary files from the 'builder' stage.
# We are not copying the entire source code or the original node_modules.
#
# Copy the 'public' folder.
COPY --from=builder /app/public ./public
#
# Copy the standalone Next.js server output. This is a special, optimized
# output folder for running Next.js in a container.
# We also change the ownership of these files to our new 'nextjs' user.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the user to our newly created non-root user.
# From this point on, all commands will run as 'nextjs'.
USER nextjs

# Expose the port that the Next.js server will run on.
EXPOSE 3000

# The command to start the Next.js server.
# The standalone output creates a `server.js` file at the root.
CMD ["node", "server.js"]