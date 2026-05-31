# ── Phase 1: Base Runtime Environment ─────────────────────────────────────────
FROM python:3.12-slim AS base

# Prevent Python from writing .pyc files and force unbuffered standard streams
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV NLTK_DATA=/app/nltk_data

WORKDIR /app

# Install critical system compilation packages and library drivers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Phase 2: Dependency Resolution ───────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Phase 3: Assets & NLP Pre-caching ─────────────────────────────────────────
# Pre-download and index standard NLTK datasets during the build phase.
# This prevents expensive network calls and cold-start latency during cloud boots.
RUN mkdir -p /app/nltk_data
RUN python -c "import nltk; \
    nltk.download('punkt', download_dir='/app/nltk_data'); \
    nltk.download('averaged_perceptron_tagger', download_dir='/app/nltk_data'); \
    nltk.download('brown', download_dir='/app/nltk_data'); \
    nltk.download('wordnet', download_dir='/app/nltk_data')"

# Copy the actual application source code
COPY . .

# Expose target listening socket
EXPOSE 8000

# ── Phase 4: High-Performance Execution ───────────────────────────────────────
# We execute uvicorn with 4 concurrent worker processes to utilize multiple CPU cores,
# and wire up the preloaded NLTK directory directly to the system paths.
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT} --workers 4 --loop uvloop --http httptools"]
