from app import db
from datetime import datetime
from sqlalchemy import JSON

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    article = db.Column(db.String(50), unique=True, nullable=False)  # Артикул
    name = db.Column(db.String(300), nullable=False)  # Модель
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)  # Цена
    category = db.Column(db.String(100))  # Категория (meteor, mk, laggartt)
    image_url = db.Column(db.String(500))  # Фото
    specifications = db.Column(JSON)
    in_stock = db.Column(db.Boolean, default=True)
    stock_quantity = db.Column(db.Integer, default=0)  # В_наличии
    power = db.Column(db.String(20))  # Мощность
    contours = db.Column(db.String(50))  # Контуры
    wifi = db.Column(db.String(10))  # WiFi
    status = db.Column(db.String(50))  # Статус
    power_level = db.Column(db.String(20))  # Уровень_мощности
    views_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProductView(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    user_session = db.Column(db.String(100))
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_agent = db.Column(db.String(500))
    ip_address = db.Column(db.String(45))

class Promotion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    discount_percentage = db.Column(db.Float)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
