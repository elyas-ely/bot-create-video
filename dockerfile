# -----------------------------
# Base image: Ubuntu 24.04
# -----------------------------
    FROM ubuntu:24.04

    # Prevent interactive prompts
    ENV DEBIAN_FRONTEND=noninteractive
    
    # -----------------------------
    # Install system dependencies including FFmpeg
    # -----------------------------
    RUN apt-get update && \
        apt-get install -y curl git ffmpeg unzip && \
        rm -rf /var/lib/apt/lists/*
    
    # -----------------------------
    # Install Bun
    # -----------------------------
    RUN curl -fsSL https://bun.sh/install | bash
    
    # Add Bun to PATH
    ENV PATH="/root/.bun/bin:$PATH"
    
    # -----------------------------
    # Set working directory
    # -----------------------------
    WORKDIR /app
    
    # -----------------------------
    # Copy Bun lockfile and package.json
    # -----------------------------
    COPY bun.lockb package.json ./
    
    # -----------------------------
    # Install dependencies with Bun
    # -----------------------------
    RUN bun install
    
    # -----------------------------
    # Copy the rest of the project
    # -----------------------------
    COPY . .
    
    # -----------------------------
    # Set environment variables
    # -----------------------------
    ENV NODE_ENV=production
    
    # -----------------------------
    # Command to run your app
    # -----------------------------
    CMD ["bun", "run", "start"]
    