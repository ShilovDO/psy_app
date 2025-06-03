const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = 3000;

const IMAGES_DIR = path.join(__dirname, 'public/images');

// Настройки Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, IMAGES_DIR),
    filename: (req, file, cb) => cb(null, 'temp_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use(express.static('public'));
app.use(express.json());


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/admin.html'));
});

app.use('/images', express.static(IMAGES_DIR, {
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store');
    }
}));

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
