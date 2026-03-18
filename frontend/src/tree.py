import os
import sys
from pathlib import Path

def print_file_tree(start_path=".", prefix="", is_last=True, max_depth=None, current_depth=0):
    """
    Рекурсивно выводит дерево файлов и папок
    
    Args:
        start_path: начальная директория
        prefix: префикс для текущего уровня
        is_last: является ли текущий элемент последним в родительской директории
        max_depth: максимальная глубина обхода (None - без ограничений)
        current_depth: текущая глубина
    """
    if max_depth is not None and current_depth > max_depth:
        return
    
    path = Path(start_path)
    
    # Пропускаем скрытые файлы/папки (начинающиеся с точки)
    if path.name.startswith('.'):
        return
    
    # Вывод текущего элемента
    if current_depth == 0:
        print(f"📁 {path.name or '.'}")
    else:
        connector = "└── " if is_last else "├── "
        icon = "📁 " if path.is_dir() else "📄 "
        print(prefix + connector + icon + path.name)
    
    if path.is_dir():
        try:
            # Получаем все элементы в директории
            items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name))
            # Фильтруем скрытые файлы
            items = [item for item in items if not item.name.startswith('.')]
            
            for i, item in enumerate(items):
                is_last_item = i == len(items) - 1
                new_prefix = prefix + ("    " if is_last else "│   ")
                
                print_file_tree(
                    item, 
                    new_prefix, 
                    is_last_item,
                    max_depth,
                    current_depth + 1
                )
        except PermissionError:
            print(prefix + "    " + "⚠️  Нет доступа")

def main():
    # Определяем директорию запуска
    start_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    
    # Парсим аргументы для максимальной глубины
    max_depth = None
    if len(sys.argv) > 2:
        try:
            max_depth = int(sys.argv[2])
        except ValueError:
            print("Ошибка: глубина должна быть числом")
            return
    
    print(f"\n📊 Иерархия файлов в: {os.path.abspath(start_dir)}\n")
    print_file_tree(start_dir, max_depth=max_depth)
    print()

if __name__ == "__main__":
    main()