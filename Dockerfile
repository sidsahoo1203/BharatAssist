# BharatAssist AI backend: FastAPI + ML safety guard
FROM python:3.11-slim

WORKDIR /app

# install dependencies first (cached between builds)
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# app code + the ML package and trained models it loads
COPY backend/ backend/
COPY ml/src ml/src
COPY ml/models ml/models

WORKDIR /app/backend
ENV PORT=8000
EXPOSE 8000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}