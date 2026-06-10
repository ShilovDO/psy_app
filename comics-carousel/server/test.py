import os
from pathlib import Path

def generate_tree(directory, prefix="", output_file=None):
    """
    Рекурсивно обходит директорию и записывает структуру в файл
    
    Args:
        directory: путь к директории для обхода
        prefix: префикс для форматирования (используется для отступов)
        output_file: файловый объект для записи
    """
    try:
        # Получаем отсортированный список содержимого директории
        items = sorted(os.listdir(directory))
    except PermissionError:
        output_file.write(f"{prefix}[Доступ запрещён]\n")
        return
    except Exception as e:
        output_file.write(f"{prefix}[Ошибка: {e}]\n")
        return
    
    for i, item in enumerate(items):
        path = os.path.join(directory, item)
        is_last = (i == len(items) - 1)
        
        # Определяем символы для форматирования дерева
        if is_last:
            current_prefix = "└── "
            next_prefix = prefix + "    "
        else:
            current_prefix = "├── "
            next_prefix = prefix + "│   "
        
        # Записываем имя файла/папки
        if os.path.isdir(path):
            output_file.write(f"{prefix}{current_prefix}📁 {item}/\n")
            # Рекурсивно обходим поддиректорию
            generate_tree(path, next_prefix, output_file)
        else:
            output_file.write(f"{prefix}{current_prefix}📄 {item}\n")

def main():
    # Определяем корневую директорию (где лежит скрипт)
    root_dir = Path(__file__).parent
    
    # Имя выходного файла
    output_filename = "tree.txt"
    output_path = root_dir / output_filename
    
    print(f"Генерирую дерево файлов для: {root_dir}")
    
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            # Записываем заголовок
            f.write(f"Структура файлов и папок: {root_dir}\n")
            f.write("=" * 50 + "\n\n")
            
            # Корневая папка
            f.write(f"📁 {root_dir.name}/\n")
            
            # Генерируем дерево
            generate_tree(root_dir, "", f)
        
        print(f"✅ Дерево файлов сохранено в: {output_path}")
        print(f"Содержит {sum(1 for _ in open(output_path, 'r', encoding='utf-8'))} строк")
        
    except Exception as e:
        print(f"❌ Ошибка при создании файла: {e}")

if __name__ == "__main__":
    main()