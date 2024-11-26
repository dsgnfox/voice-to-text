import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);
const CHUNK_DURATION = 600; // 10 минут в секундах
const OVERLAP_DURATION = 30; // 30 секунд перекрытия

async function splitAudio(inputFile, tempDir) {
  try {
    await fs.mkdir(tempDir, { recursive: true });

    const { stdout: durationStr } = await execAsync(
      `ffprobe -i "${inputFile}" -show_entries format=duration -v quiet -of csv="p=0"`
    );
    const duration = parseFloat(durationStr);

    const segments = [];
    let start = 0;

    while (start < duration) {
      const segmentPath = path.join(tempDir, `chunk_${segments.length}.wav`); // Изменено расширение на .wav

      // Изменена команда ffmpeg для конвертации в WAV
      await execAsync(
        `ffmpeg -i "${inputFile}" -ss ${start} -t ${CHUNK_DURATION} -acodec pcm_s16le -ar 16000 -ac 1 "${segmentPath}"`
      );

      segments.push(segmentPath);
      start += CHUNK_DURATION - OVERLAP_DURATION;
    }

    return segments;
  } catch (error) {
    console.error("Ошибка при разделении аудио:", error);
    throw error;
  }
}

async function transcribeChunk(filePath, isFirst, isLast) {
  try {
    // Добавляем вывод команды для отладки
    console.log(
      "Выполняем команду:",
      `/app/whisper.cpp/main -m /app/models/ggml-large-v3-turbo-q8_0.bin -f "${filePath}" -l auto`
    );

    const { stdout, stderr } = await execAsync(
      `/app/whisper.cpp/main -m /app/models/ggml-large-v3-turbo-q8_0.bin -f "${filePath}" -l auto`
    );

    // Выводим результат выполнения
    console.log("stdout:", stdout);
    if (stderr) console.error("stderr:", stderr);

    if (!stdout) {
      console.error("Не удалось получить транскрипцию для файла:", filePath);
      return "";
    }

    let text = stdout.trim();

    // Обработка текста для первого/последнего чанка
    if (!isFirst) {
      const firstSentenceMatch = text.match(/[.!?]\s+[A-ZА-Я]/);
      if (firstSentenceMatch) {
        text = text.slice(firstSentenceMatch.index + 2);
      }
    }

    if (!isLast) {
      const lastSentenceMatch = text.match(/[.!?]\s+[A-ZА-Я][^.!?]*$/);
      if (lastSentenceMatch) {
        text = text.slice(0, lastSentenceMatch.index + 1);
      }
    }

    return text;
  } catch (error) {
    console.error(`Ошибка при обработке ${filePath}:`, error);
    return "";
  }
}

async function transcribeAudio() {
  const [, , inputPath, outputPath] = process.argv;
  const tempDir = path.join(process.cwd(), "temp_chunks");

  try {
    console.log("Разделение аудио на части...");
    const chunks = await splitAudio(inputPath, tempDir);

    console.log(`Аудио разделено на ${chunks.length} частей`);
    let fullTranscript = "";

    // Обрабатываем каждый чанк
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Обработка части ${i + 1}/${chunks.length}...`);
      const isFirst = i === 0;
      const isLast = i === chunks.length - 1;

      const chunkText = await transcribeChunk(chunks[i], isFirst, isLast);
      fullTranscript += chunkText + " ";

      // Сохраняем промежуточный результат
      await fs.writeFile(outputPath, fullTranscript, { flag: "w" });
    }

    console.log("Транскрипция завершена успешно");
  } catch (error) {
    console.error("Ошибка при обработке файла:", error);
    process.exit(1);
  } finally {
    // Очищаем временные файлы
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Ошибка при удалении временных файлов:", error);
    }
  }
}

transcribeAudio();
