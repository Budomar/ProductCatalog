# Overview

This is a Flask-based product catalog web application built for e-commerce purposes. The system provides a comprehensive product management solution with features including product browsing, search and filtering, shopping cart functionality, product comparison, analytics tracking, and admin management capabilities. The application supports both manual product management and automated synchronization with Google Sheets for inventory updates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend follows a modular JavaScript architecture with a main `CatalogApp` class that coordinates multiple specialized modules:
- **ModularJS Design**: Individual modules for cart, comparison, search/filter, analytics, notifications, social sharing, mobile touch interactions, recommendations, delivery calculator, and view toggling
- **Progressive Enhancement**: Service worker implementation for offline caching and push notifications
- **Responsive Design**: Bootstrap-based UI with custom CSS, supporting both grid and list views
- **Mobile-First Approach**: Dedicated mobile touch module for enhanced mobile user experience

## Backend Architecture
Built using Flask with a clean separation of concerns:
- **Flask Application Factory**: Centralized app configuration with modular route organization
- **SQLAlchemy ORM**: Database abstraction layer with declarative models
- **Service Layer Pattern**: `DataService` class handles business logic for product management
- **Background Processing**: Scheduler module for periodic tasks like data synchronization

## Data Storage
- **SQLAlchemy Models**: Three main entities - Product, ProductView, and Promotion
- **JSON Support**: Product specifications stored as JSON for flexible attribute management
- **View Tracking**: Comprehensive analytics with ProductView model tracking user interactions
- **Session Management**: User session tracking for cart persistence and analytics

## Authentication & Authorization
- **Session-Based Auth**: Simple session management for user tracking
- **Admin Routes**: Protected admin interface for catalog management
- **Basic Security**: Environment-based configuration for secrets and credentials

## API Design
- **RESTful Endpoints**: Clean API structure for product retrieval and filtering
- **Query Parameters**: Support for category filtering, search, and sorting
- **JSON Responses**: Structured API responses for frontend consumption

# External Dependencies

## Third-Party Services
- **Google Sheets API**: Two-way integration for product catalog synchronization using service account authentication
- **Google OAuth2**: Service account credentials for secure API access

## JavaScript Libraries
- **Bootstrap**: UI framework with dark theme support
- **Font Awesome**: Icon library for enhanced user interface
- **Service Worker API**: Browser-native caching and push notification support

## Python Packages
- **Flask**: Web application framework
- **SQLAlchemy**: Database ORM and query builder
- **gspread**: Google Sheets API client library
- **google-oauth2**: Authentication library for Google services
- **schedule**: Task scheduling for background jobs

## Development Tools
- **Werkzeug ProxyFix**: Production deployment middleware for reverse proxy support
- **Python logging**: Comprehensive logging system for debugging and monitoring

## Data Sources
- **Local JSON**: Fallback product data storage in `data/products.json`
- **Google Sheets**: Primary data source for product information and inventory management
- **SQLite/PostgreSQL**: Configurable database backend (defaults to SQLite for development)