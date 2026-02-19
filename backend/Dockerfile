# ============================================
# Stage 1: Build dependencies
# ============================================
FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

# Switch to Yandex mirror (default repos unreachable from this server)
RUN echo "deb http://mirror.yandex.ru/debian/ bookworm main" > /etc/apt/sources.list && \
    echo "deb http://mirror.yandex.ru/debian/ bookworm-updates main" >> /etc/apt/sources.list && \
    echo "deb http://mirror.yandex.ru/debian-security/ bookworm-security main" >> /etc/apt/sources.list

# Install build dependencies for binary wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages into /install prefix
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ============================================
# Stage 2: Minimal runtime image
# ============================================
FROM python:3.12-slim-bookworm AS runner

# Switch to Yandex mirror
RUN echo "deb http://mirror.yandex.ru/debian/ bookworm main" > /etc/apt/sources.list && \
    echo "deb http://mirror.yandex.ru/debian/ bookworm-updates main" >> /etc/apt/sources.list && \
    echo "deb http://mirror.yandex.ru/debian-security/ bookworm-security main" >> /etc/apt/sources.list

# Install only runtime library for PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy only application source code
COPY app/ ./app/

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
