FROM mcr.microsoft.com/devcontainers/typescript-node:22

USER root

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        ffmpeg \
        git-lfs \
    && git lfs install --system \
    && corepack enable \
    && rm -rf /var/lib/apt/lists/*

USER node
