import os
import sys

def generate_directory_tree(startpath, output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        for root, dirs, files in os.walk(startpath):
            level = root.replace(startpath, '').count(os.sep)
            indent = ' ' * 4 * (level)
            f.write('{}{}/\n'.format(indent, os.path.basename(root)))
            subindent = ' ' * 4 * (level + 1)
            for file in files:
                f.write('{}{}\n'.format(subindent, file))

if __name__ == "__main__":
    # Проверяем аргументы командной строки
    if len(sys.argv) < 2:
        print("Использование: python script.py <директория> [<выходной_файл>]")
        sys.exit(1)
    
    directory = sys.argv[1]
    
    # Проверяем существование директории
    if not os.path.isdir(directory):
        print(f"Ошибка: '{directory}' не является директорией или не существует")
        sys.exit(1)
    
    # Определяем имя выходного файла
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    else:
        # Используем имя директории для имени файла по умолчанию
        dir_name = os.path.basename(os.path.normpath(directory))
        output_file = f"{dir_name}_tree.txt"
    
    # Генерируем дерево
    try:
        generate_directory_tree(directory, output_file)
        print(f"Дерево директорий сохранено в файл: {output_file}")
    except Exception as e:
        print(f"Произошла ошибка: {e}")
        sys.exit(1)