FROM node:18

WORKDIR /app

# Установка необходимых системных зависимостей
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    build-essential \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Клонирование и сборка whisper.cpp
RUN git clone https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    make

# Скачивание модели
RUN mkdir -p /app/models && \
    wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q8_0.bin -O /app/models/ggml-large-v3-turbo-q8_0.bin

# Копирование файлов приложения
COPY package*.json ./
COPY index.js ./

# Установка зависимостей Node.js
RUN npm install

# Создание символической ссылки на whisper.cpp
RUN ln -s /app/whisper.cpp /whisper

ENTRYPOINT ["node", "index.js"]