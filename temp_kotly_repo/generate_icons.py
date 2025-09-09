# generate_icons.py - Скрипт для генерации иконок PWA
from PIL import Image, ImageDraw, ImageFont
import os

def create_icons():
    """Создает все необходимые иконки для PWA"""
    
    # Цвета из вашей темы
    colors = {
        'primary': '#2563eb',      # Основной синий
        'primary_dark': '#1d4ed8', # Темный синий
        'white': '#ffffff',        # Белый
        'accent': '#f59e0b'        # Акцентный оранжевый
    }
    
    # Создаем папку images если ее нет
    os.makedirs('images', exist_ok=True)
    
    # Размеры иконок
    sizes = [
        ('icon-192.png', 192),
        ('icon-512.png', 512),
        ('icon-144.png', 144),
        ('badge.png', 72)
    ]
    
    print("🔄 Создаем иконки для PWA...")
    
    for filename, size in sizes:
        # Создаем изображение
        img = Image.new('RGB', (size, size), colors['primary'])
        draw = ImageDraw.Draw(img)
        
        # Рисуем иконку в зависимости от размера
        if size >= 144:
            # Для больших иконок - детализированное изображение котла
            draw_boiler_icon(draw, size, colors)
        else:
            # Для маленьких - простой символ
            draw_simple_icon(draw, size, colors)
        
        # Сохраняем
        img.save(f'images/{filename}')
        print(f"✅ Создана: {filename} ({size}x{size}px)")
    
    print("🎉 Все иконки успешно созданы!")
    print("📁 Файлы сохранены в папку: images/")

def draw_boiler_icon(draw, size, colors):
    """Рисует детализированную иконку котла"""
    # Основной корпус котла
    body_width = size * 0.6
    body_height = size * 0.4
    body_x = (size - body_width) / 2
    body_y = size * 0.3
    
    # Рисуем корпус
    draw.rectangle(
        [body_x, body_y, body_x + body_width, body_y + body_height],
        fill=colors['white'],
        outline=colors['primary_dark'],
        width=2
    )
    
    # Верхняя часть котла
    top_width = body_width * 0.7
    top_x = body_x + (body_width - top_width) / 2
    top_y = body_y - size * 0.1
    
    draw.rectangle(
        [top_x, top_y, top_x + top_width, body_y],
        fill=colors['white'],
        outline=colors['primary_dark'],
        width=2
    )
    
    # Труба
    pipe_width = size * 0.08
    pipe_x = top_x + top_width - pipe_width - size * 0.05
    pipe_y = top_y - size * 0.15
    
    draw.rectangle(
        [pipe_x, pipe_y, pipe_x + pipe_width, top_y],
        fill=colors['white'],
        outline=colors['primary_dark'],
        width=2
    )
    
    # Дверца
    door_width = body_width * 0.4
    door_height = body_height * 0.6
    door_x = body_x + (body_width - door_width) / 2
    door_y = body_y + (body_height - door_height) / 2
    
    draw.rectangle(
        [door_x, door_y, door_x + door_width, door_y + door_height],
        fill=colors['primary_dark'],
        outline=colors['white'],
        width=1
    )
    
    # Ручка двери
    handle_size = size * 0.04
    handle_x = door_x + door_width - handle_size * 2
    handle_y = door_y + door_height / 2 - handle_size / 2
    
    draw.ellipse(
        [handle_x, handle_y, handle_x + handle_size, handle_y + handle_size],
        fill=colors['accent']
    )
    
    # Для большой иконки добавляем текст
    if size >= 400:
        try:
            # Пытаемся использовать шрифт
            font_size = max(20, size // 20)
            font = ImageFont.truetype("arial.ttf", font_size)
            
            # Рисуем текст "METEOR"
            text = "METEOR"
            text_width = draw.textlength(text, font=font)
            text_x = (size - text_width) / 2
            text_y = body_y + body_height + size * 0.05
            
            draw.text(
                (text_x, text_y),
                text,
                fill=colors['white'],
                font=font
            )
        except:
            # Если шрифт не доступен, пропускаем текст
            pass

def draw_simple_icon(draw, size, colors):
    """Рисует упрощенную иконку для маленьких размеров"""
    # Простой силуэт котла
    body_width = size * 0.6
    body_height = size * 0.4
    body_x = (size - body_width) / 2
    body_y = size * 0.3
    
    # Корпус
    draw.rectangle(
        [body_x, body_y, body_x + body_width, body_y + body_height],
        fill=colors['white']
    )
    
    # Верхняя часть
    top_width = body_width * 0.7
    top_x = body_x + (body_width - top_width) / 2
    top_y = body_y - size * 0.08
    
    draw.rectangle(
        [top_x, top_y, top_x + top_width, body_y],
        fill=colors['white']
    )
    
    # Труба
    pipe_width = size * 0.1
    pipe_x = top_x + top_width - pipe_width
    pipe_y = top_y - size * 0.12
    
    draw.rectangle(
        [pipe_x, pipe_y, pipe_x + pipe_width, top_y],
        fill=colors['white']
    )

def create_screenshots():
    """Создает заглушки для скриншотов"""
    print("\n🔄 Создаем заглушки для скриншотов...")
    
    # Скриншоты (просто цветные прямоугольники)
    screenshots = [
        ('screenshot-1.png', (1280, 720), '#2563eb'),
        ('screenshot-2.png', (750, 1334), '#1d4ed8')
    ]
    
    for filename, dimensions, color in screenshots:
        img = Image.new('RGB', dimensions, color)
        draw = ImageDraw.Draw(img)
        
        # Добавляем текст
        try:
            font_size = min(dimensions) // 15
            font = ImageFont.truetype("arial.ttf", font_size)
            
            text = f"Скриншот {filename}"
            text_width = draw.textlength(text, font=font)
            text_x = (dimensions[0] - text_width) / 2
            text_y = (dimensions[1] - font_size) / 2
            
            draw.text((text_x, text_y), text, fill='white', font=font)
        except:
            # Просто белый прямоугольник если нет шрифта
            draw.rectangle(
                [dimensions[0]*0.2, dimensions[1]*0.4, 
                 dimensions[0]*0.8, dimensions[1]*0.6],
                fill='white'
            )
        
        img.save(f'images/{filename}')
        print(f"✅ Создана заглушка: {filename} ({dimensions[0]}x{dimensions[1]}px)")
    
    print("📝 Замечание: Это временные заглушки. Замените их реальными скриншотами после запуска сайта.")

if __name__ == "__main__":
    # Проверяем наличие библиотеки Pillow
    try:
        create_icons()
        create_screenshots()
        
        print("\n" + "="*50)
        print("🎯 Дальнейшие действия:")
        print("1. Запустите сайт и сделайте реальные скриншоты")
        print("2. Замените временные файлы в папке images/")
        print("3. Проверьте PWA в браузере (F12 -> Application)")
        print("="*50)
        
    except ImportError:
        print("❌ Ошибка: Не установлена библиотека Pillow")
        print("📦 Установите ее командой: pip install Pillow")
        print("💻 Или запустите: python -m pip install Pillow")