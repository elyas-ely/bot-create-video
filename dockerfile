# -----------------------------
# Base image with Node.js (Bun compatible)
# -----------------------------
    FROM jarredsumner/bun:latest

    # -----------------------------
    # Install system FFmpeg
    # -----------------------------
    RUN apt-get update && \
        apt-get install -y ffmpeg && \
        rm -rf /var/lib/apt/lists/*
    
    # -----------------------------
    # Set working directory
    # -----------------------------
    WORKDIR /app
    
    # -----------------------------
    # Copy Bun config and package files
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
    