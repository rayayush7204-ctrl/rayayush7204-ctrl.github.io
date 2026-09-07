import glob
import re

html_files = glob.glob('D:/Ayush Portfolio/irainsec.github.io-main/*.html')

nav_items = [
    ('index.html', 'Home'),
    ('about.html', 'About'),
    ('works.html', 'Projects'),
    ('certifications.html', 'Certifications'),
    ('contact.html', 'Contact')
]

for file in html_files:
    filename = file.replace('\\', '/').split('/')[-1]
    
    # build the menu HTML for this specific file
    menu_lines = []
    for link, name in nav_items:
        if link == filename:
            menu_lines.append(f'                            <li class="active"><a href="{link}">{name}</a></li>')
        else:
            menu_lines.append(f'                            <li><a href="{link}">{name}</a></li>')
            
    nav_html = '\n'.join(menu_lines)

    footer_menu_lines = []
    for link, name in nav_items:
        if link == filename:
            footer_menu_lines.append(f'                        <li class="active"><a href="{link}">{name}</a></li>')
        else:
            footer_menu_lines.append(f'                        <li><a href="{link}">{name}</a></li>')
            
    footer_nav_html = '\n'.join(footer_menu_lines)
    
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(r'<ul class="menu">.*?</ul>', f'<ul class="menu">\n{nav_html}\n                        </ul>', content, flags=re.DOTALL)
    
    content = re.sub(r'<ul class="footer-menu">.*?</ul>', f'<ul class="footer-menu">\n{footer_nav_html}\n                    </ul>', content, flags=re.DOTALL)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
