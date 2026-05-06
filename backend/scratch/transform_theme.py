import os
import re

def transform_colors():
    pages_dir = 'frontend/src/pages'
    components_dir = 'frontend/src/components'
    
    targets = [pages_dir, components_dir]
    
    for target in targets:
        if not os.path.exists(target):
            continue
            
        for root, dirs, files in os.walk(target):
            for file in files:
                if file.endswith('.jsx') or file.endswith('.js'):
                    path = os.path.join(root, file)
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Replace slate with zinc
                    new_content = content.replace('slate', 'zinc')
                    
                    # Remove some specific blues if found
                    new_content = new_content.replace('#3498DB', '#3f3f46') # blue to zinc-600
                    new_content = new_content.replace('#2C3E50', '#18181b') # dark blue-grey to zinc-900
                    
                    if new_content != content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated {path}")

if __name__ == "__main__":
    transform_colors()
