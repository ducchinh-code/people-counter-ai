FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --gid 1001 appuser && adduser --uid 1001 --gid 1001 --disabled-password --gecos '' appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appuser . .
RUN mkdir -p output logs && chown -R appuser:appuser output logs

USER appuser

ENV HEADLESS=true
ENV PYTHONUNBUFFERED=1
ENV BACKEND_URL=http://backend:8080
ENV TZ=Asia/Ho_Chi_Minh

HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=5)" || exit 1

CMD ["python", "app.py"]
