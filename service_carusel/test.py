import os

def print_file_tree(start_path='.'):
    """Выводит дерево файлов и каталогов"""
    print(f"Дерево каталогов для: {os.path.abspath(start_path)}")
    print(".")
    
    for root, dirs, files in os.walk(start_path):
        # Вычисляем уровень вложенности
        level = root.replace(start_path, '').count(os.sep)
        indent = ' ' * 4 * level
        
        # Выводим текущую директорию
        print(f'{indent}{os.path.basename(root)}/')
        
        # Выводим файлы в текущей директории
        sub_indent = ' ' * 4 * (level + 1)
        for file in files:
            print(f'{sub_indent}{file}')

if __name__ == "__main__":
    print_file_tree()