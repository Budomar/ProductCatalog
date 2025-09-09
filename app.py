import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
# Удалите эту строку ↓
# from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Удалите этот класс ↓
# class Base(DeclarativeBase):
#     pass

# Измените инициализацию ↓
# db = SQLAlchemy(model_class=Base)
db = SQLAlchemy()  # ← Простая инициализация

# Create the app
def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    # Configure the database
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///catalog.db")
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
    from models import Product, ProductView, Promotion
    
    # Import routes
    from routes import *
    
    # Create all tables
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)