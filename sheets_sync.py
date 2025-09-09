import os
import json
import logging
from datetime import datetime
import gspread
from google.oauth2.service_account import Credentials

class GoogleSheetsSync:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.credentials_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
        self.sheet_id = os.getenv('GOOGLE_SHEET_ID')
        self.worksheet_name = os.getenv('GOOGLE_WORKSHEET_NAME', 'Products')
        
    def _get_client(self):
        """Initialize Google Sheets client"""
        if not self.credentials_json:
            raise ValueError("GOOGLE_CREDENTIALS_JSON environment variable not set")
        
        # Parse credentials from environment variable
        creds_data = json.loads(self.credentials_json)
        
        # Define required scopes
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets.readonly',
            'https://www.googleapis.com/auth/drive.readonly'
        ]
        
        credentials = Credentials.from_service_account_info(creds_data, scopes=scopes)
        return gspread.authorize(credentials)
    
    def fetch_products(self):
        """Fetch products from Google Sheets"""
        try:
            if not self.sheet_id:
                raise ValueError("GOOGLE_SHEET_ID environment variable not set")
            
            client = self._get_client()
            sheet = client.open_by_key(self.sheet_id)
            worksheet = sheet.worksheet(self.worksheet_name)
            
            # Get all records
            records = worksheet.get_all_records()
            
            products = []
            for record in records:
                # Map sheet columns to product fields
                product = {
                    'name': record.get('Name', ''),
                    'description': record.get('Description', ''),
                    'price': float(record.get('Price', 0)) if record.get('Price') else 0,
                    'category': record.get('Category', ''),
                    'image_url': record.get('Image URL', ''),
                    'in_stock': str(record.get('In Stock', 'true')).lower() == 'true',
                    'specifications': self._parse_specifications(record.get('Specifications', ''))
                }
                
                if product['name']:  # Only add products with names
                    products.append(product)
            
            self.logger.info(f"Fetched {len(products)} products from Google Sheets")
            return products
            
        except Exception as e:
            self.logger.error(f"Error fetching from Google Sheets: {e}")
            raise e
    
    def _parse_specifications(self, specs_string):
        """Parse specifications from string format"""
        if not specs_string:
            return {}
        
        try:
            # Try to parse as JSON first
            return json.loads(specs_string)
        except json.JSONDecodeError:
            # Fallback: parse as key:value pairs separated by semicolons
            specs = {}
            for pair in specs_string.split(';'):
                if ':' in pair:
                    key, value = pair.split(':', 1)
                    specs[key.strip()] = value.strip()
            return specs

def scheduled_sync():
    """Function to be called by scheduler for hourly updates"""
    try:
        sync = GoogleSheetsSync()
        products = sync.fetch_products()
        
        # Save to JSON file
        with open('data/products.json', 'w', encoding='utf-8') as f:
            json.dump({'products': products, 'last_updated': datetime.now().isoformat()}, f, ensure_ascii=False, indent=2)
        
        logging.info("Scheduled sync completed successfully")
        return True
        
    except Exception as e:
        logging.error(f"Scheduled sync failed: {e}")
        return False

if __name__ == "__main__":
    scheduled_sync()
