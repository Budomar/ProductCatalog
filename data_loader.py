import pandas as pd
import json
import re
from datetime import datetime
from app import db
from models import Product

class DataLoader:
    def __init__(self):
        self.price_url = "https://docs.google.com/spreadsheets/d/19PRNpA6F_HMI6iHSCg2iJF52PnN203ckY1WnqY_t5fc/export?format=csv"
        self.stock_url = "https://docs.google.com/spreadsheets/d/1o0e3-E20mQsWToYVQpCHZgLcbizCafLRpoPdxr8Rqfw/export?format=csv"
    
    def load_from_sheets(self):
        """Загрузка данных из Google Sheets и сохранение в базу"""
        try:
            print("Загрузка данных из Google Sheets...")
            
            # Загружаем данные
            price_df = pd.read_csv(self.price_url)
            stock_df = pd.read_csv(self.stock_url)
            
            # Обработка данных
            processed_data = self.process_data(price_df, stock_df)
            
            # Сохраняем в базу
            self.save_to_database(processed_data)
            
            return {"success": True, "message": f"Загружено {len(processed_data)} товаров"}
            
        except Exception as e:
            print(f"Ошибка загрузки: {e}")
            return {"success": False, "error": str(e)}
    
    def find_column(self, df, possible_names):
        """Найти колонку по возможным названиям"""
        for col in df.columns:
            col_lower = str(col).lower()
            for name in possible_names:
                if name.lower() in col_lower:
                    return col
        return None
    
    def parse_price(self, price):
        """Преобразовать цену в число"""
        try:
            if pd.isna(price):
                return 0.0
            price_str = str(price).replace(' ', '').replace(',', '.')
            price_str = re.sub(r'[^\d\.]', '', price_str)
            return float(price_str)
        except:
            return 0.0
    
    def parse_quantity(self, qty):
        """Преобразовать количество в число"""
        try:
            if pd.isna(qty):
                return 0
            qty_str = str(qty).replace(' ', '').replace(',', '.')
            qty_val = float(qty_str)
            return max(0, int(qty_val))
        except:
            return 0
    
    def get_image_for_model(self, model_name):
        """Определить фото для модели"""
        model = str(model_name).upper()
        
        if 'METEOR T2' in model:
            return 'images/meteor-t2.jpg'
        elif 'METEOR C30' in model:
            return 'images/meteor-c30.jpg'
        elif 'METEOR B30' in model:
            return 'images/meteor-b30.jpg'
        elif 'METEOR B20' in model:
            return 'images/meteor-b20.jpg'
        elif 'METEOR C11' in model:
            return 'images/meteor-c11.jpg'
        elif 'METEOR Q3' in model:
            return 'images/meteor-q3.jpg'
        elif 'METEOR M30' in model:
            return 'images/meteor-m30.jpg'
        elif 'METEOR M6' in model:
            return 'images/meteor-m6.jpg'
        elif 'LAGGARTT' in model or 'ГАЗ 6000' in model:
            return 'images/laggartt.jpg'
        elif 'DEVOTION' in model:
            return 'images/devotion.jpg'
        elif 'MK' in model:
            return 'images/mk.jpg'
        else:
            return 'images/default.jpg'
    
    def extract_info(self, model):
        """Извлечь информацию из названия модели"""
        model_str = str(model).upper()
        
        # Мощность
        power = "Не указана"
        patterns = [
            (r'(T2|M6|M30|B20|B30|C30|C11|Q3)[^\d]*(\d+)', 2),
            (r'(\d+)\s*(C|H|С|Х|кВт|KW)', 1),
            (r'ГАЗ\s*6000\s*(\d+)', 1),
            (r'MK\s*(\d+)', 1),
            (r'LL1GBQ(\d+)', 1),
            (r'LN1GBQ(\d+)', 1),
        ]
        
        for pattern, group in patterns:
            match = re.search(pattern, model_str)
            if match:
                power = match.group(group)
                break
        
        if power == "Не указана":
            numbers = re.findall(r'\b(\d{2,3})\b', model_str)
            if numbers:
                power = numbers[0]
        
        # Контуры
        if any(x in model_str for x in [' C', 'С ', 'C)', '-C', ' C ', ' С ']):
            contours = "Двухконтурный"
        elif any(x in model_str for x in [' H', 'Н ', 'H)', '-H', ' H ', ' Н ']):
            contours = "Одноконтурный"
        else:
            contours = "Двухконтурный" if 'НАСТЕННЫЙ' in model_str else "Одноконтурный"
        
        # Wi-Fi
        wifi = "Да" if any(x in model_str for x in ['WI-FI', 'WIFI', 'ВАЙ-ФАЙ', 'WI FI']) else "Нет"
        
        return power, contours, wifi
    
    def get_product_category(self, model):
        """Определить категорию товара"""
        model_str = str(model).lower()
        if 'meteor' in model_str:
            return 'meteor'
        elif 'laggartt' in model_str or 'газ' in model_str:
            return 'laggartt'
        elif 'devotion' in model_str:
            return 'devotion'
        elif 'mk' in model_str:
            return 'mk'
        else:
            return 'other'
    
    def get_power_level(self, power):
        """Определить уровень мощности"""
        try:
            power_val = int(power)
            if power_val <= 20:
                return 'low'
            elif power_val <= 30:
                return 'medium'
            else:
                return 'high'
        except:
            return 'unknown'
    
    def process_data(self, price_df, stock_df):
        """Обработка данных"""
        # Находим колонки
        article_col_price = self.find_column(price_df, ['артикул', 'article'])
        name_col = self.find_column(price_df, ['модель', 'наименование'])
        price_col = self.find_column(price_df, ['цена', 'price'])
        
        article_col_stock = self.find_column(stock_df, ['артикул', 'article'])
        stock_col = self.find_column(stock_df, ['в наличии', 'остаток'])
        
        if not all([article_col_price, name_col, price_col, article_col_stock, stock_col]):
            raise ValueError("Не найдены все необходимые колонки")
        
        # Создаем чистые датафреймы
        price_clean = price_df[[article_col_price, name_col, price_col]].copy()
        price_clean.columns = ['Артикул', 'Модель', 'Цена']
        
        stock_clean = stock_df[[article_col_stock, stock_col]].copy()
        stock_clean.columns = ['Артикул', 'В_наличии']
        
        # Очистка данных
        price_clean = price_clean.dropna(subset=['Артикул'])
        price_clean['Артикул'] = price_clean['Артикул'].astype(str).str.strip()
        price_clean['Цена'] = price_clean['Цена'].apply(self.parse_price)
        
        stock_clean = stock_clean.dropna(subset=['Артикул'])
        stock_clean['Артикул'] = stock_clean['Артикул'].astype(str).str.strip()
        stock_clean['В_наличии'] = stock_clean['В_наличии'].apply(self.parse_quantity)
        
        # Объединяем
        merged_df = pd.merge(price_clean, stock_clean, on='Артикул', how='left')
        merged_df['В_наличии'] = merged_df['В_наличии'].fillna(0).astype(int)
        
        # Добавляем дополнительные поля
        merged_df[['Мощность', 'Контуры', 'WiFi']] = merged_df['Модель'].apply(
            lambda x: pd.Series(self.extract_info(x))
        )
        
        merged_df['Фото'] = merged_df['Модель'].apply(self.get_image_for_model)
        merged_df['Статус'] = merged_df['В_наличии'].apply(lambda x: 'В наличии' if x > 0 else 'Нет в наличии')
        merged_df['Категория'] = merged_df['Модель'].apply(self.get_product_category)
        merged_df['Уровень_мощности'] = merged_df['Мощность'].apply(self.get_power_level)
        
        return merged_df.to_dict('records')
    
    def save_to_database(self, products_data):
        """Сохранение в базу данных"""
        # Очищаем старые данные
        Product.query.delete()
        
        # Добавляем новые товары
        for product_data in products_data:
            product = Product(
                article=product_data['Артикул'],
                name=product_data['Модель'],
                description=f"Газовый котел {product_data['Модель']}",
                price=product_data['Цена'],
                category=product_data['Категория'],
                image_url=product_data['Фото'],
                specifications={
                    'power': product_data['Мощность'],
                    'contours': product_data['Контуры'],
                    'wifi': product_data['WiFi']
                },
                in_stock=product_data['В_наличии'] > 0,
                stock_quantity=product_data['В_наличии'],
                power=product_data['Мощность'],
                contours=product_data['Контуры'],
                wifi=product_data['WiFi'],
                status=product_data['Статус'],
                power_level=product_data['Уровень_мощности']
            )
            db.session.add(product)
        
        db.session.commit()
        print(f"Сохранено {len(products_data)} товаров в базу данных")