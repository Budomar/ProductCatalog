from app import db
from datetime import datetime
from sqlalchemy import JSON

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100))
    image_url = db.Column(db.String(500))
    specifications = db.Column(JSON)
    in_stock = db.Column(db.Boolean, default=True)
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
