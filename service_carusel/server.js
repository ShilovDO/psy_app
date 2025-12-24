const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { saveConfig, checkIdExists } = require('./db');
const app = express();
const PORT = 3000;
const db = require('./db');
const IMAGES_DIR = path.join(__dirname, 'public/images');

// server.js
let currentResult = 0; // хранит текущее значение счётчика


// Настройки Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, IMAGES_DIR),
    filename: (req, file, cb) => cb(null, 'temp_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });
const cors = require('cors');


app.use(cors()); // теперь все запросы с любого домена будут разрешены
app.use(express.static('public'));
app.use(express.json());


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/admin.html'));
});

app.get('/config', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/config.html'));
});

app.use('/images', express.static(IMAGES_DIR, {
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store');
    }
}));
app.get('/result', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/result.html'));
});

// Этот запрос вызывается с фронта или другого приложения
app.post('/api/set_result', (req, res) => {
    const { result } = req.body;

    if (result === undefined) {
        return res.status(400).send('Нет параметра result');
    }

    currentResult = result; // обновляем глобальную переменную
    res.sendStatus(200);
});


// Запись результата при закрытии приложения (POST)
app.post('/api/result_save', async (req, res) => {
    try {
        const {
            id,
            user,
            station,
            route,
            config,
            date
        } = req.body; // теперь данные из тела запроса

        if (!id || !user || !station || !route || !config || !date) {
            return res.status(400).send('Недостаточно параметров');
        }

        await db.query(
            `
            INSERT INTO schema_comics.results
            (id, "user", station, route, config, date_time, result)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [id, user, station, route, config, date, currentResult]
        );

        res.sendStatus(200);

    } catch (e) {
        console.error('Ошибка записи результата:', e);
        res.sendStatus(500);
    }
});

// Получить результат по ID
app.get('/api/results/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Не передан id'
            });
        }

        const query = `
            SELECT id, result
            FROM schema_comics.results
            WHERE id = $1
            ORDER BY date_time DESC
            LIMIT 1
        `;

        const dbResult = await db.query(query, [id]);

        if (dbResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Результат не найден'
            });
        }

        res.json({
            success: true,
            data: dbResult.rows[0]
        });

    } catch (error) {
        console.error('Ошибка получения результата:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

// Эндпоинт для сохранения конфигурации
app.post('/api/config/save', async (req, res) => {
    try {
        const { platform_id, config_text } = req.body;

        // Валидация входных данных
        if (!platform_id || !config_text) {
            return res.status(400).json({
                success: false,
                error: 'Необходимы platform_id и config_text'
            });
        }

        // Сохраняем или обновляем конфигурацию
        // Используем UPSERT (INSERT ... ON CONFLICT ...)
        const saveQuery = `
            INSERT INTO schema_comics.configs (id, test) 
            VALUES ($1, $2)
            ON CONFLICT (id) 
            DO UPDATE SET 
                test = EXCLUDED.test
            RETURNING *
        `;

        const result = await db.query(saveQuery, [platform_id, config_text]);

        res.json({
            success: true,
            message: 'Конфигурация сохранена',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Ошибка сохранения конфигурации:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Эндпоинт для получения конфигурации
app.get('/api/config/:platform_id', async (req, res) => {
    try {
        const { platform_id } = req.params;
        
        const result = await db.query(
            'SELECT * FROM schema_comics.configs WHERE id = $1',
            [platform_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Конфигурация не найдена'
            });
        }

        if (row.result === null) {
            return res.json({
                success: true,
                data: {
                    id: row.id,
                    result: null
                },
                message: 'Результат ещё не установлен'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Ошибка получения конфигурации:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

// Получить список изображений
app.get('/api/images', (req, res) => {
    fs.readdir(IMAGES_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Ошибка чтения папки' });

        const images = files
            .filter(f => f.match(/^\d+\.webp$/))
            .sort((a, b) => parseInt(a) - parseInt(b));

        res.json(images);
    });
});

// Загрузка новых изображений
app.post('/api/upload', upload.array('images'), async (req, res) => {
    try {
        const uploadedFiles = req.files;

        // Получаем текущие файлы в порядке
        let existingFiles = fs.readdirSync(IMAGES_DIR)
            .filter(f => f.endsWith('.webp'))
            .sort((a, b) => parseInt(a) - parseInt(b));

        let nextIndex = existingFiles.length + 1;

        // Переименовываем загруженные в последовательные имена
        uploadedFiles.forEach((file, i) => {
            const newFilename = `${nextIndex + i}.webp`;
            const newPath = path.join(IMAGES_DIR, newFilename);

            fs.renameSync(file.path, newPath);
        });

        res.sendStatus(200);
    } catch (error) {
        console.error('Ошибка загрузки изображений:', error);
        res.sendStatus(500);
    }
});


// Удалить изображение по имени (например "3.webp")
app.delete('/api/delete/:name', (req, res) => {
    const filePath = path.join(IMAGES_DIR, req.params.name);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        renumberImages();
        res.sendStatus(200);
    } else {
        res.status(404).json({ error: 'Файл не найден' });
    }
});

// Обновить порядок (передаётся массив имен файлов)
app.post('/api/reorder', (req, res) => {
    const newOrder = req.body;

    const tempMap = newOrder.map((filename, index) => ({
        oldPath: path.join(IMAGES_DIR, filename),
        tempPath: path.join(IMAGES_DIR, `__temp_${index + 1}.webp`),
        finalPath: path.join(IMAGES_DIR, `${index + 1}.webp`)
    }));

    // Шаг 1: Временно переименовываем, чтобы не затирать
    tempMap.forEach(file => {
        if (fs.existsSync(file.oldPath)) {
            fs.renameSync(file.oldPath, file.tempPath);
        }
    });

    // Шаг 2: Переименовываем во временные в окончательные
    tempMap.forEach(file => {
        if (fs.existsSync(file.tempPath)) {
            fs.renameSync(file.tempPath, file.finalPath);
        }
    });

    res.sendStatus(200);
});


function renumberImages() {
    const files = fs.readdirSync(IMAGES_DIR)
        .filter(f => f.match(/^\d+\.webp$/))
        .sort((a, b) => parseInt(a) - parseInt(b));

    files.forEach((filename, i) => {
        const newName = `${i + 1}.webp`;
        if (filename !== newName) {
            fs.renameSync(
                path.join(IMAGES_DIR, filename),
                path.join(IMAGES_DIR, `__${newName}`)
            );
        }
    });

    // Удаляем временные имена
    fs.readdirSync(IMAGES_DIR).forEach(f => {
        if (f.startsWith('__')) {
            fs.renameSync(
                path.join(IMAGES_DIR, f),
                path.join(IMAGES_DIR, f.slice(2))
            );
        }
    });
}

app.listen(PORT, () => console.log(`Сервер запущен: http://localhost:${PORT}`));