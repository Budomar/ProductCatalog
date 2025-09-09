from flask import render_template, jsonify, request, session
from app import app, db
from models import Product, ProductView, Promotion
from data_service import DataService
import uuid
from datetime import datetime

@app.route('/')
def index():
    """Main catalog page"""
    return render_template('index.html')

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
    
    view = ProductView(
        product_id=product_id,
        user_session=session['session_id'],
        user_agent=request.headers.get('User-Agent'),
        ip_address=request.remote_addr
    )
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
