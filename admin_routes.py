"""
Admin routes for catalog management
"""

import os
from flask import render_template, request, jsonify, redirect, url_for, flash
from app import app, db
from models import Product, Promotion, ProductView
from data_service import DataService
from sheets_sync import GoogleSheetsSync
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)

@app.route('/admin')
def admin_dashboard():
    """Admin dashboard"""
    try:
        # Get basic statistics
        total_products = Product.query.count()
        in_stock_products = Product.query.filter_by(in_stock=True).count()
        total_views = ProductView.query.count()
        recent_views = ProductView.query.filter(
            ProductView.viewed_at >= datetime.utcnow() - timedelta(days=7)
        ).count()
        
        # Get top viewed products
        top_products = db.session.query(Product)\
            .order_by(Product.views_count.desc())\
            .limit(5).all()
        
        # Get active promotions
        active_promotions = Promotion.query.filter_by(active=True).count()
        
        stats = {
            'total_products': total_products,
            'in_stock_products': in_stock_products,
            'out_of_stock_products': total_products - in_stock_products,
            'total_views': total_views,
            'recent_views': recent_views,
            'active_promotions': active_promotions,
            'top_products': [{
                'id': p.id,
                'name': p.name,
                'views_count': p.views_count,
                'price': p.price
            } for p in top_products]
        }
        
        return render_template('admin/dashboard.html', stats=stats)
        
    except Exception as e:
        logger.error(f"Admin dashboard error: {e}")
        flash('Ошибка загрузки панели администратора', 'error')
        return redirect(url_for('index'))

@app.route('/admin/products')
def admin_products():
    """Manage products"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = 20
        
        products = Product.query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return render_template('admin/products.html', products=products)
        
    except Exception as e:
        logger.error(f"Admin products error: {e}")
        flash('Ошибка загрузки списка товаров', 'error')
        return redirect(url_for('admin_dashboard'))

@app.route('/admin/products/<int:product_id>/edit', methods=['GET', 'POST'])
def admin_edit_product(product_id):
    """Edit product"""
    product = Product.query.get_or_404(product_id)
    
    if request.method == 'POST':
        try:
            product.name = request.form.get('name')
            product.description = request.form.get('description')
            product.price = float(request.form.get('price', 0))
            product.category = request.form.get('category')
            product.image_url = request.form.get('image_url')
            product.in_stock = bool(request.form.get('in_stock'))
            
            # Handle specifications JSON
            specs_json = request.form.get('specifications')
            if specs_json:
                try:
                    product.specifications = json.loads(specs_json)
                except json.JSONDecodeError:
                    flash('Неверный формат характеристик (должен быть JSON)', 'error')
                    return render_template('admin/edit_product.html', product=product)
            
            product.updated_at = datetime.utcnow()
            db.session.commit()
            
            flash('Товар обновлен успешно', 'success')
            return redirect(url_for('admin_products'))
            
        except Exception as e:
            logger.error(f"Product update error: {e}")
            db.session.rollback()
            flash('Ошибка обновления товара', 'error')
    
    return render_template('admin/edit_product.html', product=product)

@app.route('/admin/products/<int:product_id>/delete', methods=['POST'])
def admin_delete_product(product_id):
    """Delete product"""
    try:
        product = Product.query.get_or_404(product_id)
        
        # Delete related views
        ProductView.query.filter_by(product_id=product_id).delete()
        
        # Delete product
        db.session.delete(product)
        db.session.commit()
        
        flash('Товар удален успешно', 'success')
        
    except Exception as e:
        logger.error(f"Product deletion error: {e}")
        db.session.rollback()
        flash('Ошибка удаления товара', 'error')
    
    return redirect(url_for('admin_products'))

@app.route('/admin/promotions')
def admin_promotions():
    """Manage promotions"""
    try:
        promotions = Promotion.query.order_by(Promotion.created_at.desc()).all()
        return render_template('admin/promotions.html', promotions=promotions)
        
    except Exception as e:
        logger.error(f"Admin promotions error: {e}")
        flash('Ошибка загрузки акций', 'error')
        return redirect(url_for('admin_dashboard'))

@app.route('/admin/promotions/new', methods=['GET', 'POST'])
def admin_new_promotion():
    """Create new promotion"""
    if request.method == 'POST':
        try:
            promotion = Promotion()
            promotion.title = request.form.get('title')
            promotion.description = request.form.get('description')
            promotion.discount_percentage = float(request.form.get('discount_percentage', 0))
            start_date_str = request.form.get('start_date')
            end_date_str = request.form.get('end_date')
            if start_date_str:
                promotion.start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            if end_date_str:
                promotion.end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            promotion.active = bool(request.form.get('active'))
            
            db.session.add(promotion)
            db.session.commit()
            
            flash('Акция создана успешно', 'success')
            return redirect(url_for('admin_promotions'))
            
        except Exception as e:
            logger.error(f"Promotion creation error: {e}")
            db.session.rollback()
            flash('Ошибка создания акции', 'error')
    
    return render_template('admin/new_promotion.html')

@app.route('/admin/sync', methods=['POST'])
def admin_sync_data():
    """Manually trigger data sync"""
    try:
        data_service = DataService()
        result = data_service.sync_from_sheets()
        
        flash(f'Синхронизация выполнена: {result}', 'success')
        
    except Exception as e:
        logger.error(f"Manual sync error: {e}")
        flash(f'Ошибка синхронизации: {str(e)}', 'error')
    
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/analytics')
def admin_analytics():
    """View analytics"""
    try:
        # Get view statistics
        total_views = ProductView.query.count()
        today_views = ProductView.query.filter(
            ProductView.viewed_at >= datetime.utcnow().date()
        ).count()
        
        week_views = ProductView.query.filter(
            ProductView.viewed_at >= datetime.utcnow() - timedelta(days=7)
        ).count()
        
        # Top products by views
        top_products = db.session.query(Product.name, Product.views_count)\
            .order_by(Product.views_count.desc())\
            .limit(10).all()
        
        # Views by category
        category_views = db.session.query(
            Product.category, 
            db.func.sum(Product.views_count).label('total_views')
        ).group_by(Product.category).all()
        
        analytics_data = {
            'total_views': total_views,
            'today_views': today_views,
            'week_views': week_views,
            'top_products': [{'name': name, 'views': views} for name, views in top_products],
            'category_views': [{'category': cat, 'views': views} for cat, views in category_views]
        }
        
        return render_template('admin/analytics.html', analytics=analytics_data)
        
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        flash('Ошибка загрузки аналитики', 'error')
        return redirect(url_for('admin_dashboard'))

@app.route('/admin/settings')
def admin_settings():
    """Admin settings"""
    try:
        # Get current settings
        settings = {
            'google_sheets_configured': bool(os.getenv('GOOGLE_SHEET_ID')),
            'auto_sync_enabled': True,  # This could be stored in config
            'notifications_enabled': True,
            'analytics_enabled': True
        }
        
        return render_template('admin/settings.html', settings=settings)
        
    except Exception as e:
        logger.error(f"Settings error: {e}")
        flash('Ошибка загрузки настроек', 'error')
        return redirect(url_for('admin_dashboard'))

@app.route('/admin/export/products')
def admin_export_products():
    """Export products to JSON"""
    try:
        products = Product.query.all()
        
        export_data = {
            'products': [{
                'name': p.name,
                'description': p.description,
                'price': p.price,
                'category': p.category,
                'image_url': p.image_url,
                'specifications': p.specifications,
                'in_stock': p.in_stock,
                'views_count': p.views_count
            } for p in products],
            'exported_at': datetime.utcnow().isoformat(),
            'total_count': len(products)
        }
        
        response = jsonify(export_data)
        response.headers['Content-Disposition'] = 'attachment; filename=products_export.json'
        return response
        
    except Exception as e:
        logger.error(f"Export error: {e}")
        return jsonify({'error': 'Export failed'}), 500

@app.route('/admin/api/stats')
def admin_api_stats():
    """API endpoint for dashboard stats"""
    try:
        # Real-time stats for dashboard updates
        stats = {
            'products_count': Product.query.count(),
            'in_stock_count': Product.query.filter_by(in_stock=True).count(),
            'views_today': ProductView.query.filter(
                ProductView.viewed_at >= datetime.utcnow().date()
            ).count(),
            'views_total': ProductView.query.count(),
            'last_sync': datetime.utcnow().isoformat()
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Stats API error: {e}")
        return jsonify({'error': 'Failed to fetch stats'}), 500

# Error handlers for admin routes
@app.errorhandler(404)
def admin_not_found(error):
    if request.path.startswith('/admin'):
        return render_template('admin/404.html'), 404
    return error

@app.errorhandler(500)
def admin_internal_error(error):
    if request.path.startswith('/admin'):
        db.session.rollback()
        return render_template('admin/500.html'), 500
    return error
