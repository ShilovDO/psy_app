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
    res.sendFile(path.join(__dirname, 'views/show.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/admin.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/settings.html'));
});

app.get('/config', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/settings.html'));
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


// Эндпоинт для сохранения результатов просмотра
app.post('/api/result_save', async (req, res) => {
    try {
        const { id, user, station, route, config, date, timers } = req.body;

        console.log('Получены данные для сохранения:', { id, user, station, route, config, date });

        // Проверяем обязательные поля
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Отсутствует id'
            });
        }

        // Преобразуем в числа
        const numericId = parseInt(id);
        const numericUser = parseInt(user) || 0;
        const numericStation = parseInt(station) || 0;
        const numericRoute = parseInt(route) || 0;
        const numericConfig = parseInt(config) || 0;

        if (isNaN(numericId)) {
            return res.status(400).json({
                success: false,
                error: 'id должен быть числом'
            });
        }

        try {
            // Основной результат
            await db.query(`
                INSERT INTO schema_comics.results (id, "user", station, route, config, date_time, result)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE 
                SET "user" = $2, station = $3, route = $4, config = $5, date_time = $6
            `, [
                numericId,
                numericUser,
                numericStation,
                numericRoute,
                numericConfig,
                date || new Date().toISOString(),
                '0'
            ]);

            console.log('Основной результат сохранен');

            // Таймеры для каждого изображения
            if (timers && typeof timers === 'object') {
                let savedCount = 0;
                
                for (const [imageName, timeSpent] of Object.entries(timers)) {
                    const timeValue = parseFloat(timeSpent);
                    if (timeValue > 0) {
                        await db.query(`
                            INSERT INTO schema_comics.images_time_result (result_id, image, time)
                            VALUES ($1, $2, $3)
                        `, [numericId, imageName, timeValue]);
                        savedCount++;
                    }
                }
                
                console.log(`Сохранено ${savedCount} записей времени`);
            }

            res.json({
                success: true,
                message: 'OK'
            });
            
        } catch (dbError) {
            console.error('Ошибка БД:', dbError);
            res.status(500).json({
                success: false,
                error: 'Ошибка базы данных: ' + dbError.message
            });
        }
    } catch (error) {
        console.error('Общая ошибка:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
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

// Эндпоинт для сохранения конфигурации с изображениями
app.post('/api/config/save', upload.array('images'), async (req, res) => {
    try {
        console.log('Получены данные:', {
            body: req.body,
            files: req.files ? req.files.length : 0
        });

        const { platform_id, config_text, comics_data } = req.body;
        const uploadedFiles = req.files || [];

        // Валидация входных данных
        if (!platform_id) {
            return res.status(400).json({
                success: false,
                error: 'Необходим platform_id'
            });
        }

        if (!config_text) {
            return res.status(400).json({
                success: false,
                error: 'Необходим config_text'
            });
        }

        // Парсим comics_data если он приходит как JSON строка
        let comicsData = [];
        if (comics_data) {
            try {
                if (typeof comics_data === 'string') {
                    comicsData = JSON.parse(comics_data);
                } else if (Array.isArray(comics_data)) {
                    comicsData = comics_data;
                } else {
                    return res.status(400).json({
                        success: false,
                        error: 'comics_data должен быть массивом'
                    });
                }
            } catch (e) {
                console.error('Ошибка парсинга comics_data:', e);
                return res.status(400).json({
                    success: false,
                    error: 'Неверный формат comics_data: ' + e.message
                });
            }
        }

        // 1. Получаем старые записи комиксов ДО удаления
        const oldComicsQuery = 'SELECT * FROM schema_comics.comics WHERE id = $1';
        const oldComicsResult = await db.query(oldComicsQuery, [platform_id]);
        const oldImages = oldComicsResult.rows.map(row => row.image);

        // 2. Сохраняем или обновляем конфигурацию
        const saveConfigQuery = `
            INSERT INTO schema_comics.configs (id, test) 
            VALUES ($1, $2)
            ON CONFLICT (id) 
            DO UPDATE SET 
                test = EXCLUDED.test
            RETURNING *
        `;

        const configResult = await db.query(saveConfigQuery, [platform_id, config_text]);
        console.log('Конфигурация сохранена:', configResult.rows[0]);

        // 3. Обрабатываем изображения и данные комиксов
        // Сохраняем новые загруженные файлы
        const savedImages = [];
        
        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}.webp`;
            const newPath = path.join(IMAGES_DIR, uniqueName);
            
            try {
                fs.renameSync(file.path, newPath);
                console.log(`Файл сохранен: ${uniqueName}`);
                
                savedImages.push({
                    index: i,
                    filename: uniqueName,
                    newPath: newPath
                });
            } catch (fileError) {
                console.error(`Ошибка сохранения файла ${i}:`, fileError);
                throw new Error(`Ошибка сохранения файла: ${fileError.message}`);
            }
        }

        // 4. Собираем список новых имен файлов из comicsData
        const newImageNames = [];
        comicsData.forEach(comic => {
            if (comic.image && typeof comic.image === 'string') {
                newImageNames.push(comic.image);
            }
        });

        // 5. Удаляем неиспользуемые файлы изображений
        for (const oldImage of oldImages) {
            // Проверяем, используется ли старое изображение в новых данных
            if (!newImageNames.includes(oldImage)) {
                const oldFilePath = path.join(IMAGES_DIR, oldImage);
                try {
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                        console.log(`Удален неиспользуемый файл: ${oldImage}`);
                    }
                } catch (fileError) {
                    console.error(`Ошибка удаления файла ${oldImage}:`, fileError);
                }
            }
        }

        // 6. Удаляем старые записи комиксов
        const deleteOldComicsQuery = `
            DELETE FROM schema_comics.comics 
            WHERE id = $1
        `;
        await db.query(deleteOldComicsQuery, [platform_id]);
        console.log('Старые комиксы удалены');

        // 7. Вставляем новые записи комиксов
        const insertComicsQuery = `
            INSERT INTO schema_comics.comics (id, image, "order", description) 
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        let savedImageIndex = 0;
        
        for (let i = 0; i < comicsData.length; i++) {
            const comic = comicsData[i];
            
            let imageFilename = null;
            
            if (comic.image === null && savedImageIndex < savedImages.length) {
                // Это новый загруженный файл
                imageFilename = savedImages[savedImageIndex].filename;
                savedImageIndex++;
            } else if (comic.image && typeof comic.image === 'string') {
                // Это существующее имя файла
                imageFilename = comic.image;
            }

            if (imageFilename) {
                await db.query(insertComicsQuery, [
                    platform_id,
                    imageFilename,
                    comic.order || i,
                    comic.description || ''
                ]);
                console.log(`Комикс ${i} сохранен:`, { 
                    image: imageFilename, 
                    order: comic.order, 
                    description: comic.description 
                });
            }
        }

        console.log('Все данные успешно сохранены');

        res.json({
            success: true,
            message: 'Конфигурация и комиксы сохранены',
            data: {
                config: configResult.rows[0],
                images_count: uploadedFiles.length,
                comics_count: comicsData.length
            }
        });

    } catch (error) {
        console.error('Ошибка сохранения конфигурации:', error);
        
        // Удаляем уже сохраненные файлы в случае ошибки
        if (req.files) {
            req.files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (cleanupError) {
                    console.error('Ошибка очистки файлов:', cleanupError);
                }
            });
        }

        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Эндпоинт для получения конфигурации
app.get('/api/config/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Получаем конфигурацию
        const configQuery = 'SELECT * FROM schema_comics.configs WHERE id = $1';
        const configResult = await db.query(configQuery, [id]);
        
        if (configResult.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    test: '',
                    comics: []
                }
            });
        }
        
        // Получаем комиксы
        const comicsQuery = 'SELECT * FROM schema_comics.comics WHERE id = $1 ORDER BY "order"';
        const comicsResult = await db.query(comicsQuery, [id]);
        
        res.json({
            success: true,
            data: {
                ...configResult.rows[0],
                comics: comicsResult.rows
            }
        });
        
    } catch (error) {
        console.error('Ошибка получения конфигурации:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения конфигурации'
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