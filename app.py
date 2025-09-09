import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create database instance
db = SQLAlchemy()

# Create the app
def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    # Configure the database
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///catalog.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }

    # Initialize the app with the extension
    db.init_app(app)
    
    return app

# Create app instance
app = create_app()

# Import routes and models AFTER creating app and db
with app.app_context():
    # Import models
    try:
        from models import Product, ProductView, Promotion
        print("Models imported successfully")
    except ImportError as e:
        print(f"Error importing models: {e}")
        # Создаем заглушки чтобы приложение могло запуститься
        class Product(db.Model):
            __tablename__ = 'products'
            id = db.Column(db.Integer, primary_key=True)
            name = db.Column(db.String(100))
        
        class ProductView(db.Model):
            __tablename__ = 'product_views'
            id = db.Column(db.Integer, primary_key=True)
        
        class Promotion(db.Model):
            __tablename__ = 'promotions'
            id = db.Column(db.Integer, primary_key=True)
    
    # Import routes
    try:
        from routes import *
        print("Routes imported successfully")
    except ImportError as e:
        print(f"Error importing routes: {e}")
        # Базовые роуты если routes.py не работает
        @app.route('/')
        def index():
            return "Каталог товаров - Базовая страница работает!"
        
        @app.route('/api/products')
        def get_products():
            return {"products": [], "message": "API в разработке"}
        
        @app.route('/api/health')
        def health_check():
            return {"status": "ok", "message": "Server is running"}
    
    # Create all tables
    try:
        db.create_all()
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error creating database tables: {e}")

# Basic health check route
@app.route('/health')
def health():
    return {"status": "healthy", "service": "product-catalog"}

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return {"error": "Not found", "message": "The requested resource was not found"}, 404

@app.errorhandler(500)
def internal_error(error):
    return {"error": "Internal server error", "message": "Something went wrong"}, 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    print(f"Starting server on {host}:{port}")
    app.run(host=host, port=port, debug=debug)