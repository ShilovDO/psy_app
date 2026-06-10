const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;
const db = require('./db');

// Используем абсолютные пути и создаем директорию если её нет
const PUBLIC_DIR = path.join(__dirname, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

// Создаем директорию для изображений, если её нет
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log('Created images directory:', IMAGES_DIR);
}

// Временное хранилище таймеров
const tempTimersStorage = new Map();
let currentResult = 0;
const lastSlideResult = new Map();

// Настройки Multer с проверкой прав
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Проверяем существование директории
        if (!fs.existsSync(IMAGES_DIR)) {
            fs.mkdirSync(IMAGES_DIR, { recursive: true });
        }
        cb(null, IMAGES_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'temp_' + Date.now() + ext);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Статические файлы с правильными путями
app.use(express.static(PUBLIC_DIR));
app.use('/images', express.static(IMAGES_DIR, {
    setHeaders: (res, filePath) => {
        // Отключаем кеширование для изображений
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        // Устанавливаем правильный Content-Type
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.webp': 'image/webp',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
        };
        if (mimeTypes[ext]) {
            res.set('Content-Type', mimeTypes[ext]);
        }
    }
}));

// Логирование запросов к изображениям для отладки
app.use('/images', (req, res, next) => {
    console.log('Image request:', req.url);
    const fullPath = path.join(IMAGES_DIR, req.url);
    console.log('Full path:', fullPath);
    if (fs.existsSync(fullPath)) {
        console.log('File exists');
    } else {
        console.log('File NOT found');
    }
    next();
});

// ============================================
// МАРШРУТЫ СТРАНИЦ
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'settings.html'));
});

app.get('/config', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'settings.html'));
});

app.get('/result', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'result.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

// ============================================
// API: HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
    try {
        const imagesCount = fs.existsSync(IMAGES_DIR) ? 
            fs.readdirSync(IMAGES_DIR).filter(f => /\.(webp|jpg|jpeg|png|gif)$/i.test(f)).length : 0;
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            node_version: process.version,
            platform: process.platform,
            directories: {
                public: {
                    path: PUBLIC_DIR,
                    exists: fs.existsSync(PUBLIC_DIR)
                },
                images: {
                    path: IMAGES_DIR,
                    exists: fs.existsSync(IMAGES_DIR),
                    writable: fs.existsSync(IMAGES_DIR) ? 
                        fs.accessSync(IMAGES_DIR, fs.constants.W_OK) || true : false,
                    imagesCount: imagesCount
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// ============================================
// API: РАБОТА С ИЗОБРАЖЕНИЯМИ
// ============================================

app.get('/api/images', (req, res) => {
    try {
        if (!fs.existsSync(IMAGES_DIR)) {
            return res.json([]);
        }
        
        const files = fs.readdirSync(IMAGES_DIR);
        const images = files.filter(f => /\.(webp|jpg|jpeg|png|gif)$/i.test(f));
        
        // Добавляем информацию о каждом файле
        const imagesWithInfo = images.map(img => ({
            name: img,
            url: `/images/${img}`,
            exists: true,
            size: fs.statSync(path.join(IMAGES_DIR, img)).size
        }));
        
        res.json(imagesWithInfo);
    } catch (err) {
        console.error('Error reading images directory:', err);
        res.status(500).json({ error: 'Ошибка чтения папки', details: err.message });
    }
});

app.post('/api/upload', upload.array('images'), async (req, res) => {
    try {
        const uploadedFiles = req.files;
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ error: 'Нет файлов для загрузки' });
        }

        const results = [];
        for (const file of uploadedFiles) {
            const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webp`;
            const newPath = path.join(IMAGES_DIR, uniqueName);
            
            try {
                fs.renameSync(file.path, newPath);
                // Устанавливаем правильные права на файл
                fs.chmodSync(newPath, 0o644);
                results.push({ original: file.originalname, saved: uniqueName });
            } catch (err) {
                console.error(`Error renaming file ${file.originalname}:`, err);
            }
        }

        res.json({ success: true, message: 'Файлы загружены', files: results });
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        res.status(500).json({ error: 'Ошибка загрузки файлов', details: error.message });
    }
});

app.delete('/api/delete/:name', (req, res) => {
    const filePath = path.join(IMAGES_DIR, req.params.name);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Файл удален' });
        } else {
            res.status(404).json({ error: 'Файл не найден' });
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Ошибка удаления', details: error.message });
    }
});

app.post('/api/reorder', (req, res) => {
    try {
        const newOrder = req.body;
        const tempPrefix = `__temp_${Date.now()}_`;

        // Переименовываем во временные имена
        newOrder.forEach((filename, index) => {
            const oldPath = path.join(IMAGES_DIR, filename);
            const tempPath = path.join(IMAGES_DIR, `${tempPrefix}${index}.webp`);
            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, tempPath);
            }
        });

        // Переименовываем в финальные имена
        newOrder.forEach((filename, index) => {
            const tempPath = path.join(IMAGES_DIR, `${tempPrefix}${index}.webp`);
            const finalPath = path.join(IMAGES_DIR, `${index + 1}.webp`);
            if (fs.existsSync(tempPath)) {
                fs.renameSync(tempPath, finalPath);
                fs.chmodSync(finalPath, 0o644);
            }
        });

        res.json({ success: true, message: 'Порядок изменен' });
    } catch (error) {
        console.error('Ошибка изменения порядка:', error);
        res.status(500).json({ error: 'Ошибка изменения порядка', details: error.message });
    }
});

// ============================================
// API: КОНФИГУРАЦИЯ
// ============================================

app.post('/api/config/save', upload.array('images'), async (req, res) => {
    try {
        console.log('Получены данные:', {
            body: req.body,
            files: req.files ? req.files.length : 0
        });

        const { platform_id, config_text, comics_data } = req.body;
        const uploadedFiles = req.files || [];

        if (!platform_id) {
            return res.status(400).json({ success: false, error: 'Необходим platform_id' });
        }

        if (!config_text) {
            return res.status(400).json({ success: false, error: 'Необходим config_text' });
        }

        let comicsData = [];
        if (comics_data) {
            try {
                comicsData = typeof comics_data === 'string' 
                    ? JSON.parse(comics_data) 
                    : comics_data;
            } catch (e) {
                return res.status(400).json({ success: false, error: 'Неверный формат comics_data' });
            }
        }

        await db.query(`
            INSERT INTO schema_comics.configs (id, test) 
            VALUES ($1, $2)
            ON CONFLICT (id) DO UPDATE SET test = EXCLUDED.test
        `, [platform_id, config_text]);

        const savedImages = [];
        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}.webp`;
            const newPath = path.join(IMAGES_DIR, uniqueName);
            
            try {
                fs.renameSync(file.path, newPath);
                fs.chmodSync(newPath, 0o644);
                savedImages.push({ index: i, filename: uniqueName });
            } catch (err) {
                console.error(`Error saving uploaded file:`, err);
            }
        }

        await db.query('DELETE FROM schema_comics.comics WHERE id = $1', [platform_id]);

        let savedImageIndex = 0;
        for (let i = 0; i < comicsData.length; i++) {
            const comic = comicsData[i];
            let imageFilename = null;

            if (comic.image === null && savedImageIndex < savedImages.length) {
                imageFilename = savedImages[savedImageIndex].filename;
                savedImageIndex++;
            } else if (comic.image && typeof comic.image === 'string') {
                imageFilename = comic.image;
            }

            if (imageFilename) {
                await db.query(
                    'INSERT INTO schema_comics.comics (id, image, "order", description) VALUES ($1, $2, $3, $4)',
                    [platform_id, imageFilename, comic.order || i, comic.description || '']
                );
            }
        }

        res.json({ success: true, message: 'Конфигурация сохранена' });

    } catch (error) {
        console.error('Ошибка сохранения:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/config/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const configResult = await db.query(
            'SELECT * FROM schema_comics.configs WHERE id = $1',
            [id]
        );

        const comicsResult = await db.query(
            'SELECT * FROM schema_comics.comics WHERE id = $1 ORDER BY "order"',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...(configResult.rows[0] || { test: '' }),
                comics: comicsResult.rows
            }
        });

    } catch (error) {
        console.error('Ошибка получения конфигурации:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// API: ТАЙМЕРЫ И РЕЗУЛЬТАТЫ
// ============================================

app.post('/api/set_result', (req, res) => {
    const { result } = req.body;
    if (result === undefined) {
        return res.status(400).send('Нет параметра result');
    }
    currentResult = result;
    
    const platformId = req.query.platform_id || req.body.platform_id;
    if (platformId) {
        lastSlideResult.set(platformId.toString(), result);
        console.log(`Последний слайд для ${platformId}: ${result}`);
    }
    
    res.sendStatus(200);
});

app.post('/api/save_timers', async (req, res) => {
    try {
        const { platform_id, timers } = req.body;
        
        console.log('=== СОХРАНЕНИЕ ТАЙМЕРОВ ВО ВРЕМЕННОЕ ХРАНИЛИЩЕ ===');
        console.log('platform_id:', platform_id);
        console.log('timers:', JSON.stringify(timers, null, 2));
        
        if (!platform_id || !timers) {
            return res.status(400).json({ 
                success: false, 
                error: 'Отсутствуют platform_id или timers' 
            });
        }
        
        tempTimersStorage.set(platform_id.toString(), {
            timers: timers,
            timestamp: Date.now()
        });
        
        console.log('✅ Таймеры сохранены во временном хранилище');
        console.log('Всего в хранилище:', tempTimersStorage.size, 'записей');
        
        res.json({ 
            success: true, 
            message: 'Таймеры сохранены во временное хранилище' 
        });
        
    } catch (error) {
        console.error('Ошибка сохранения таймеров:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/result_save', async (req, res) => {
    try {
        console.log('=== ПОЛУЧЕН ЗАПРОС НА СОХРАНЕНИЕ РЕЗУЛЬТАТА ===');
        console.log('Тело запроса:', JSON.stringify(req.body));
        
        const { id, user, station, route, config, date } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, error: 'Отсутствует id' });
        }

        const resultId = parseInt(id);
        const configId = config ? parseInt(config) : 0;

        if (isNaN(resultId)) {
            return res.status(400).json({ success: false, error: 'id должен быть числом' });
        }

        await db.query(`
            INSERT INTO schema_comics.results (id, "user", station, route, config, date_time, result)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE 
            SET "user" = $2, station = $3, route = $4, config = $5, date_time = $6
        `, [
            resultId,
            parseInt(user) || 0,
            parseInt(station) || 0,
            parseInt(route) || 0,
            configId,
            date || new Date().toISOString(),
            '0'
        ]);
        
        console.log('✓ Запись результата сохранена, id:', resultId);

        // Сохраняем номер последнего просмотренного слайда
        const configKey = configId.toString();
        const lastSlide = lastSlideResult.get(configKey);
        if (lastSlide) {
            await db.query(
                'UPDATE schema_comics.results SET result = $1 WHERE id = $2',
                [lastSlide.toString(), resultId]
            );
            console.log(`✓ Последний слайд ${lastSlide} сохранен для result_id: ${resultId}`);
            lastSlideResult.delete(configKey);
        }

        // Проверяем временное хранилище таймеров
        console.log('Поиск таймеров для config_id:', configKey);
        console.log('Доступные ключи в хранилище:', Array.from(tempTimersStorage.keys()));
        
        const tempData = tempTimersStorage.get(configKey);
        
        if (tempData && tempData.timers && Object.keys(tempData.timers).length > 0) {
            console.log('Найдены таймеры в хранилище для config_id:', configKey);
            console.log('Таймеры:', JSON.stringify(tempData.timers, null, 2));
            
            const insertPromises = Object.entries(tempData.timers).map(([image, time]) => {
                const roundedTime = Math.round((typeof time === 'number' ? time : parseFloat(time)) * 100) / 100;
                
                console.log(`Сохранение таймера: result_id=${resultId}, image=${image}, time=${roundedTime}`);
                
                return db.query(`
                    INSERT INTO schema_comics.images_time_result (result_id, image, time)
                    VALUES ($1, $2, $3)
                `, [resultId, image, roundedTime]);
            });
            
            await Promise.all(insertPromises);
            tempTimersStorage.delete(configKey);
            
            console.log('✅ Таймеры успешно сохранены для result_id:', resultId);
        } else {
            console.log('❌ Таймеры не найдены в хранилище для config_id:', configKey);
        }
        
        res.json({ 
            success: true, 
            message: 'Результат сохранен', 
            result_id: resultId,
            timers_saved: !!tempData
        });
        
    } catch (error) {
        console.error('Ошибка сохранения результата:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ВАЖНО: специфичный маршрут ДО общего
// Получение полного результата с таймерами и всеми изображениями
app.get('/api/results/:id/full', async (req, res) => {
    try {
        const { id } = req.params;

        console.log('=== ЗАПРОС ПОЛНОГО РЕЗУЛЬТАТА ===');
        console.log('result_id:', id);

        const resultQuery = `
            SELECT id, "user", station, route, config, date_time, result
            FROM schema_comics.results
            WHERE id = $1
        `;
        const resultData = await db.query(resultQuery, [id]);

        if (resultData.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Результат не найден'
            });
        }

        const result = resultData.rows[0];
        const configId = result.config;

        let comics = [];
        let configTitle = '';
        
        if (configId) {
            const configQuery = 'SELECT test FROM schema_comics.configs WHERE id = $1';
            const configData = await db.query(configQuery, [configId]);
            
            if (configData.rows.length > 0) {
                configTitle = configData.rows[0].test || '';
            }

            const comicsQuery = `
                SELECT image, description, "order"
                FROM schema_comics.comics
                WHERE id = $1
                ORDER BY "order"
            `;
            const comicsData = await db.query(comicsQuery, [configId]);
            comics = comicsData.rows;
        }

        const timersQuery = `
            SELECT image, time
            FROM schema_comics.images_time_result
            WHERE result_id = $1
        `;
        const timersData = await db.query(timersQuery, [id]);
        
        const timers = {};
        timersData.rows.forEach(row => {
            if (timers[row.image]) {
                timers[row.image] += parseFloat(row.time);
            } else {
                timers[row.image] = parseFloat(row.time);
            }
        });

        console.log('✅ Полный результат сформирован');
        console.log('Изображений:', comics.length);
        console.log('Таймеров:', Object.keys(timers).length);

        res.json({
            success: true,
            data: {
                result: {
                    id: result.id,
                    user: result.user,
                    station: result.station,
                    route: result.route,
                    config: result.config,
                    date_time: result.date_time,
                    result: result.result
                },
                comics: comics,
                timers: timers,
                configTitle: configTitle
            }
        });

    } catch (error) {
        console.error('Ошибка получения полного результата:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения данных'
        });
    }
});

// Получение результата по ID (общий маршрут - ПОСЛЕ специфичного)
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

app.get('/api/timers/:result_id', async (req, res) => {
    try {
        const { result_id } = req.params;
        
        const result = await db.query(`
            SELECT image, time 
            FROM schema_comics.images_time_result 
            WHERE result_id = $1 
            ORDER BY time DESC
        `, [result_id]);
        
        res.json({
            success: true,
            data: result.rows,
            total_time: result.rows.reduce((sum, row) => sum + parseFloat(row.time), 0)
        });
        
    } catch (error) {
        console.error('Ошибка получения таймеров:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/debug/temp-storage', (req, res) => {
    const storage = {};
    tempTimersStorage.forEach((value, key) => {
        storage[key] = value;
    });
    res.json({ success: true, data: storage });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен: http://0.0.0.0:${PORT}`);
    console.log('PUBLIC_DIR:', PUBLIC_DIR);
    console.log('IMAGES_DIR:', IMAGES_DIR);
    console.log('Images dir exists:', fs.existsSync(IMAGES_DIR));
    if (fs.existsSync(IMAGES_DIR)) {
        const files = fs.readdirSync(IMAGES_DIR);
        console.log('Files in images dir:', files.length);
        files.forEach(f => console.log(' -', f));
    }
});