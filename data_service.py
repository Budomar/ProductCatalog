import json
import os
from models import Product
from app import db
import logging

class DataService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def load_from_json(self, file_path='data/products.json'):
        """Load products from JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Clear existing products
            Product.query.delete()
            
            # Add products from JSON
            for item in data.get('products', []):
                product = Product(
                    name=item.get('name'),
                    description=item.get('description'),
                    price=float(item.get('price', 0)),
                    category=item.get('category'),
                    image_url=item.get('image_url'),
                    specifications=item.get('specifications', {}),
                    in_stock=item.get('in_stock', True)
                )
                db.session.add(product)
            
            db.session.commit()
            self.logger.info(f"Loaded {len(data.get('products', []))} products from JSON")
            return f"Successfully loaded {len(data.get('products', []))} products"
            
        except Exception as e:
            self.logger.error(f"Error loading from JSON: {e}")
            db.session.rollback()
            raise e
    
    def sync_from_sheets(self):
        """Sync data from Google Sheets"""
        try:
            # This would integrate with the sheets_sync.py module
            from sheets_sync import GoogleSheetsSync
            
            sheets_sync = GoogleSheetsSync()
            products_data = sheets_sync.fetch_products()
            
            if products_data:
                # Save to JSON first
                with open('data/products.json', 'w', encoding='utf-8') as f:
                    json.dump({'products': products_data}, f, ensure_ascii=False, indent=2)
                
                # Load into database
                return self.load_from_json()
            else:
                return "No data received from Google Sheets"
                
        except ImportError:
            # Fallback to JSON file if Google Sheets sync is not available
            self.logger.warning("Google Sheets sync not available, using local JSON")
            return self.load_from_json()
        except Exception as e:
            self.logger.error(f"Error syncing from sheets: {e}")
            raise e
