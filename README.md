## Системные требования

Для работы приложения необходимы следующие системные зависимости:

- ffmpeg
- ffprobe (обычно входит в пакет ffmpeg)
- python3
- pip3

При использовании Docker все необходимые зависимости устанавливаются автоматически.

## Установка и запуск

1. Через Docker (рекомендуется)

```bash
# Клонируем репозиторий
git clone <repository-url>
cd <project-directory>

# Создаем .env файл
echo "INPUT_FILE=/path/to/audio.mp3
OUTPUT_FILE=/path/to/result.txt" > .env

# Собираем и запускаем контейнер
docker compose up
```

2. Локальная установка

```bash
# Установка системных зависимостей (Ubuntu/Debian)
sudo apt-get update && sudo apt-get install -y ffmpeg python3 python3-pip

# Установка npm зависимостей
npm install

# Запуск
node index.js /path/to/audio.mp3 /path/to/result.txt
```

## Особенности реализации

- Автоматическое разбиение длинных аудио на части по 10 минут
- Перекрытие частей (30 секунд) для корректной обработки слов на границах
- Промежуточное сохранение результатов
- Автоматическая очистка временных файлов
- Поддержка различных языков (автоопределение)

## Примеры использования

1. Через Docker Compose:

```bash
docker-compose build
docker-compose up

# Или с прямым указанием переменных
INPUT_FILE=/path/to/lecture.mp3 OUTPUT_FILE=/path/to/transcript.txt docker-compose up
```

2. Напрямую через Docker:

```bash
docker run -v /path/to/audio.mp3:/input -v /path/to/result.txt:/output audio-transcriber /input /output
```

3. Локально:

```bash
node index.js ./lecture.mp3 ./transcript.txt
```

## Ограничения

- Входной файл должен быть в формате, поддерживаемом ffmpeg
- Требуется достаточно места на диске для временных файлов
- Процесс транскрипции может занять значительное время для длинных аудио

## Поддерживаемые форматы

- Входные аудио форматы:
  - MP3
  - WAV
  - M4A
  - и другие форматы, поддерживаемые ffmpeg
- Выходной формат: текстовый файл (UTF-8)
