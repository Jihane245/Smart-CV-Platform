FROM python:3.11-slim

WORKDIR /app

# 🔥 dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    python3-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*



# upgrade pip (important)
RUN python -m pip install --upgrade pip

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]