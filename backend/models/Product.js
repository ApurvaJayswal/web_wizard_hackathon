const mongoose = require('mongoose');

/**
 * Product Schema for e-commerce catalog
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters long'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(value) {
        // Ensure price has at most 2 decimal places
        return Number(value.toFixed(2)) === value;
      },
      message: 'Price can have at most 2 decimal places'
    }
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Stock must be a whole number'
    }
  },
  imageUrl: {
    type: String,
    required: [true, 'Product image URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Basic URL validation
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true,
    lowercase: true,
    enum: {
      values: [
        'electronics',
        'clothing',
        'books',
        'home-garden',
        'sports',
        'toys',
        'beauty',
        'automotive',
        'food',
        'other'
      ],
      message: 'Category must be one of the predefined categories'
    }
  },
  // Additional product details
  brand: {
    type: String,
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  sku: {
    type: String,
    unique: true,
    sparse: true, // Allows null values to be non-unique
    trim: true,
    uppercase: true,
    maxlength: [20, 'SKU cannot exceed 20 characters']
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: {
      type: Number,
      min: [0, 'Length cannot be negative']
    },
    width: {
      type: Number,
      min: [0, 'Width cannot be negative']
    },
    height: {
      type: Number,
      min: [0, 'Height cannot be negative']
    }
  },
  // Product status and availability
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // SEO and search optimization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Ratings and reviews (basic implementation)
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5'],
    set: function(val) {
      return Math.round(val * 10) / 10; // Round to 1 decimal place
    }
  },
  ratingsCount: {
    type: Number,
    default: 0,
    min: [0, 'Ratings count cannot be negative']
  },
  // Inventory tracking
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Low stock threshold cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Indexes for better query performance
 */
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // Text search
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });

/**
 * Virtual for checking if product is in stock
 */
productSchema.virtual('isInStock').get(function() {
  return this.stock > 0;
});

/**
 * Virtual for checking if product is low in stock
 */
productSchema.virtual('isLowStock').get(function() {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

/**
 * Virtual for formatted price (with currency symbol)
 */
productSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

/**
 * Instance method to update stock after purchase
 * @param {number} quantity - Quantity purchased
 * @returns {Promise<Product>} - Updated product
 */
productSchema.methods.updateStock = async function(quantity) {
  if (quantity > this.stock) {
    throw new Error('Insufficient stock available');
  }
  
  this.stock -= quantity;
  return await this.save();
};

/**
 * Instance method to restore stock (for cancelled orders)
 * @param {number} quantity - Quantity to restore
 * @returns {Promise<Product>} - Updated product
 */
productSchema.methods.restoreStock = async function(quantity) {
  this.stock += quantity;
  return await this.save();
};

/**
 * Static method to find products by category
 * @param {string} category - Product category
 * @param {object} options - Query options (limit, sort, etc.)
 * @returns {Promise<Product[]>} - Array of products
 */
productSchema.statics.findByCategory = function(category, options = {}) {
  const query = this.find({ 
    category: category.toLowerCase(), 
    isActive: true 
  });
  
  if (options.limit) query.limit(options.limit);
  if (options.sort) query.sort(options.sort);
  
  return query;
};

/**
 * Static method to search products
 * @param {string} searchTerm - Search term
 * @param {object} filters - Additional filters
 * @returns {Promise<Product[]>} - Array of products
 */
productSchema.statics.searchProducts = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    isActive: true,
    ...filters
  };
  
  return this.find(query).sort({ score: { $meta: 'textScore' } });
};

/**
 * Pre-save middleware to generate SKU if not provided
 */
productSchema.pre('save', function(next) {
  if (!this.sku && this.isNew) {
    // Generate SKU: First 3 letters of category + timestamp
    const categoryPrefix = this.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.sku = `${categoryPrefix}${timestamp}`;
  }
  next();
});

/**
 * Transform toJSON to format output
 */
productSchema.methods.toJSON = function() {
  const productObject = this.toObject();
  
  // Remove version key
  delete productObject.__v;
  
  return productObject;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;