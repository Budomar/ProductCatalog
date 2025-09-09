from flask import render_template, jsonify, request, session
from app import app, db
from models import Product, ProductView, Promotion
from data_service import DataService
from data_loader import DataLoader
import uuid
from datetime import datetime

@app.route('/')
def index():
    """Main catalog page"""
    return render_template('index.html')

@app.route('/api/load-data', methods=['POST'])
def load_data_from_sheets():
    """Загрузить данные из Google Sheets"""
    try:
        data_loader = DataLoader()
        result = data_loader.load_from_sheets()
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': result['message'],
                'products_count': Product.query.count()
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/products')
def get_products():
    """Get all products with optional filtering"""
    category = request.args.get('category')
    search = request.args.get('search')
    
    query = Product.query
    
    if category:
        query = query.filter(Product.category == category)
    
    if search:
        query = query.filter(Product.name.contains(search) | Product.description.contains(search))
    
    products = query.all()
    
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'price': p.price,
        'category': p.category,
        'image_url': p.image_url,
        'specifications': p.specifications,
        'in_stock': p.in_stock,
        'views_count': p.views_count
    } for p in products])

@app.route('/api/product/<int:product_id>')
def get_product(product_id):
    """Get single product details"""
    product = Product.query.get_or_404(product_id)
    
    # Track product view
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    
    view = ProductView()
    view.product_id = product_id
    view.user_session = session['session_id']
    view.user_agent = request.headers.get('User-Agent')
    view.ip_address = request.remote_addr
    db.session.add(view)
    
    # Increment view count
    product.views_count += 1
    db.session.commit()
    
    return jsonify({
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'price': product.price,
        'category': product.category,
        'image_url': product.image_url,
        'specifications': product.specifications,
        'in_stock': product.in_stock,
        'views_count': product.views_count
    })

@app.route('/api/categories')
def get_categories():
    """Get all product categories"""
    categories = db.session.query(Product.category).distinct().all()
    return jsonify([cat[0] for cat in categories if cat[0]])

@app.route('/api/recommendations/<int:product_id>')
def get_recommendations(product_id):
    """Get product recommendations"""
    product = Product.query.get_or_404(product_id)
    
    # Simple recommendation: same category, different product
    recommendations = Product.query.filter(
        Product.category == product.category,
        Product.id != product_id,
        Product.in_stock == True
    ).limit(4).all()
    
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'price': p.price,
        'image_url': p.image_url
    } for p in recommendations])

@app.route('/api/promotions')
def get_promotions():
    """Get active promotions"""
    now = datetime.utcnow()
    promotions = Promotion.query.filter(
        Promotion.active == True,
        Promotion.start_date <= now,
        Promotion.end_date >= now
    ).all()
    
    return jsonify([{
        'id': p.id,
        'title': p.title,
        'description': p.description,
        'discount_percentage': p.discount_percentage
    } for p in promotions])

@app.route('/api/analytics/views')
def get_analytics():
    """Get view analytics"""
    if 'session_id' not in session:
        return jsonify({'error': 'No session found'}), 400
    
    views = ProductView.query.filter_by(user_session=session['session_id']).all()
    
    return jsonify([{
        'product_id': v.product_id,
        'viewed_at': v.viewed_at.isoformat()
    } for v in views])

@app.route('/api/sync-data', methods=['POST'])
def sync_data():
    """Trigger data synchronization from Google Sheets"""
    try:
        data_service = DataService()
        result = data_service.sync_from_sheets()
        return jsonify({'success': True, 'message': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/events', methods=['POST'])
def analytics_events():
    """Receive analytics events"""
    try:
        data = request.get_json()
        if data and 'events' in data:
            # Log events for now (in production you'd save to database)
            print(f"Analytics events received: {len(data['events'])} events")
            for event in data['events']:
                print(f"Event: {event.get('event_name')} - {event.get('timestamp')}")
        return jsonify({'success': True})
    except Exception as e:
        print(f"Analytics error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/notifications/subscribe', methods=['POST'])
def notifications_subscribe():
    """Subscribe to push notifications"""
    try:
        data = request.get_json()
        if data and 'subscription' in data:
            print(f"Push notification subscription received")
            # In production, you'd save the subscription to database
        return jsonify({'success': True})
    except Exception as e:
        print(f"Notification subscription error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delivery/rates')
def delivery_rates():
    """Get delivery rates and zones"""
    rates = {
        'rates': {
            'express': {'name': 'Экспресс-доставка', 'baseRate': 500, 'perKg': 50, 'time': '2-4 часа'},
            'standard': {'name': 'Стандартная доставка', 'baseRate': 200, 'perKg': 20, 'time': '1-2 дня'},
            'economy': {'name': 'Экономная доставка', 'baseRate': 100, 'perKg': 10, 'time': '3-5 дней'},
            'pickup': {'name': 'Самовывоз', 'baseRate': 0, 'perKg': 0, 'time': 'В любое время'}
        },
        'freeThreshold': 3000
    }
    return jsonify(rates)
