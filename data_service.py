import json
import os
from models import Product
from app import db
import logging

class DataService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def load_from_json(self, file_path='temp_kotly_repo/data.json'):
        """Load boiler products from JSON file"""
        try:
            if not os.path.exists(file_path):
                self.logger.warning(f"JSON file not found: {file_path}")
                return "JSON file not found"
                
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            products_loaded = 0
            
            # Load products from JSON data (котлы)
            for item in data:
                existing_product = Product.query.filter_by(article=item.get('Артикул')).first()
                if existing_product:
                    # Обновляем существующий товар
                    existing_product.name = item.get('Модель')
                    existing_product.price = float(item.get('Цена', 0))
                    existing_product.stock_quantity = int(item.get('В_наличии', 0))
                    existing_product.in_stock = item.get('В_наличии', 0) > 0
                    existing_product.power = item.get('Мощность')
                    existing_product.contours = item.get('Контуры')
                    existing_product.wifi = item.get('WiFi')
                    existing_product.status = item.get('Статус')
                    existing_product.power_level = item.get('Уровень_мощности')
                    existing_product.category = item.get('Категория')
                    existing_product.image_url = item.get('Фото')
                    products_loaded += 1
                else:
                    # Создаем новый товар
                    product = Product()
                    product.article = item.get('Артикул')
                    product.name = item.get('Модель')
                    product.description = f"Котел {item.get('Мощность')} кВт, {item.get('Контуры')}"
                    product.price = float(item.get('Цена', 0))
                    product.category = item.get('Категория')
                    product.image_url = item.get('Фото')
                    product.specifications = {
                        'power': item.get('Мощность'),
                        'contours': item.get('Контуры'),
                        'wifi': item.get('WiFi'),
                        'power_level': item.get('Уровень_мощности')
                    }
                    product.stock_quantity = int(item.get('В_наличии', 0))
                    product.in_stock = item.get('В_наличии', 0) > 0
                    product.power = item.get('Мощность')
                    product.contours = item.get('Контуры')
                    product.wifi = item.get('WiFi')
                    product.status = item.get('Статус')
                    product.power_level = item.get('Уровень_мощности')
                    
                    db.session.add(product)
                    products_loaded += 1
            
            db.session.commit()
            self.logger.info(f"Loaded {products_loaded} products from JSON")
            return f"Successfully loaded {products_loaded} products"
            
        except Exception as e:
            self.logger.error(f"Error loading from JSON: {e}")
            db.session.rollback()
            raise e
    
    def sync_from_sheets(self):
        """Sync boiler data from Google Sheets"""
        try:
            from google_sheets_sync import GoogleSheetsSync
            sheets_sync = GoogleSheetsSync()
            products_data = sheets_sync.sync_data()
            
            if products_data:
                products_loaded = 0
                
                # Обновляем данные в базе
                for item in products_data:
                    existing_product = Product.query.filter_by(article=item.get('Артикул')).first()
                    if existing_product:
                        # Обновляем существующий товар
                        existing_product.name = item.get('Модель')
                        existing_product.price = float(item.get('Цена', 0))
                        existing_product.stock_quantity = int(item.get('В_наличии', 0))
                        existing_product.in_stock = item.get('В_наличии', 0) > 0
                        existing_product.power = item.get('Мощность')
                        existing_product.contours = item.get('Контуры')
                        existing_product.wifi = item.get('WiFi')
                        existing_product.status = item.get('Статус')
                        existing_product.power_level = item.get('Уровень_мощности')
                        existing_product.category = item.get('Категория')
                        existing_product.image_url = item.get('Фото')
                        products_loaded += 1
                    else:
                        # Создаем новый товар
                        product = Product()
                        product.article = item.get('Артикул')
                        product.name = item.get('Модель')
                        product.description = f"Котел {item.get('Мощность')} кВт, {item.get('Контуры')}"
                        product.price = float(item.get('Цена', 0))
                        product.category = item.get('Категория')
                        product.image_url = item.get('Фото')
                        product.specifications = {
                            'power': item.get('Мощность'),
                            'contours': item.get('Контуры'),
                            'wifi': item.get('WiFi'),
                            'power_level': item.get('Уровень_мощности')
                        }
                        product.stock_quantity = int(item.get('В_наличии', 0))
                        product.in_stock = item.get('В_наличии', 0) > 0
                        product.power = item.get('Мощность')
                        product.contours = item.get('Контуры')
                        product.wifi = item.get('WiFi')
                        product.status = item.get('Статус')
                        product.power_level = item.get('Уровень_мощности')
                        
                        db.session.add(product)
                        products_loaded += 1
                
                db.session.commit()
                self.logger.info(f"Synced {products_loaded} products from Google Sheets")
                return f"Successfully synced {products_loaded} products from Google Sheets"
            else:
                return "No data received from Google Sheets"
                
        except Exception as e:
            self.logger.error(f"Error syncing from Google Sheets: {e}")
            # Fallback to local JSON file
            try:
                return self.load_from_json()
            except:
                raise e
    
    def get_products(self, category=None, search=None, sort_by='name', in_stock_only=False):
        """Get products with filtering and sorting"""
        query = Product.query
        
        if category and category != 'all':
            query = query.filter(Product.category == category)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                Product.name.ilike(search_term) | 
                Product.description.ilike(search_term)
            )
        
        if in_stock_only:
            query = query.filter(Product.in_stock == True)
        
        # Sorting
        if sort_by == 'price':
            query = query.order_by(Product.price)
        elif sort_by == 'price_desc':
            query = query.order_by(Product.price.desc())
        elif sort_by == 'name':
            query = query.order_by(Product.name)
        elif sort_by == 'power':
            query = query.order_by(Product.power)
        
        return query.all()
    
    def get_categories(self):
        """Get all unique categories"""
        categories = db.session.query(Product.category).distinct().all()
        return [cat[0] for cat in categories if cat[0]]