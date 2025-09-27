const Product = require('../models/Product');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Get all products with pagination, search, and filters
 * GET /api/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    category,
    minPrice,
    maxPrice,
    inStock
  } = req.query;

  // Build query object
  const query = { isActive: true };

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Category filter
  if (category) {
    query.category = category.toLowerCase();
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Stock filter
  if (inStock !== undefined) {
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    } else if (inStock === 'false') {
      query.stock = { $lte: 0 };
    }
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Add text search score sorting if searching
  if (search) {
    sort.score = { $meta: 'textScore' };
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalProducts / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    }
  });
});

/**
 * Get single product by ID
 * GET /api/products/:id
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  if (!product.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Product is not available'
    });
  }

  res.status(200).json({
    success: true,
    data: { product }
  });
});

/**
 * Get products by category
 * GET /api/products/category/:category
 */
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const {
    page = 1,
    limit = 12,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const [products, totalProducts] = await Promise.all([
    Product.findByCategory(category, { sort, limit: limitNum, skip }),
    Product.countDocuments({ 
      category: category.toLowerCase(), 
      isActive: true 
    })
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalProducts / limitNum);

  res.status(200).json({
    success: true,
    data: {
      products,
      category,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      }
    }
  });
});

/**
 * Get featured products
 * GET /api/products/featured
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await Product.find({
    isActive: true,
    isFeatured: true
  })
    .sort({ averageRating: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  res.status(200).json({
    success: true,
    data: { products }
  });
});

/**
 * Search products
 * GET /api/products/search
 */
const searchProducts = asyncHandler(async (req, res) => {
  const { q: searchTerm, limit = 20 } = req.query;

  if (!searchTerm || searchTerm.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search term is required'
    });
  }

  const products = await Product.searchProducts(searchTerm.trim())
    .limit(parseInt(limit))
    .lean();

  res.status(200).json({
    success: true,
    data: {
      products,
      searchTerm: searchTerm.trim(),
      resultCount: products.length
    }
  });
});

/**
 * Create new product (Admin only)
 * POST /api/products
 */
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
});

/**
 * Update product (Admin only)
 * PUT /api/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Update product fields
  Object.keys(req.body).forEach(key => {
    product[key] = req.body[key];
  });

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
});

/**
 * Delete product (Admin only) - Soft delete
 * DELETE /api/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Soft delete - mark as inactive instead of removing
  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

/**
 * Get product categories
 * GET /api/products/categories/list
 */
const getCategories = asyncHandler(async (req, res) => {
  // Get all categories with product counts
  const categories = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $project: {
        _id: 0,
        name: '$_id',
        count: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
        minPrice: 1,
        maxPrice: 1
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: { categories }
  });
});

/**
 * Update product stock (Admin only)
 * PATCH /api/products/:id/stock
 */
const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  product.stock = stock;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Stock updated successfully',
    data: {
      product: {
        id: product._id,
        name: product.name,
        stock: product.stock,
        isInStock: product.isInStock,
        isLowStock: product.isLowStock
      }
    }
  });
});

/**
 * Toggle product featured status (Admin only)
 * PATCH /api/products/:id/featured
 */
const toggleFeatured = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  product.isFeatured = !product.isFeatured;
  await product.save();

  res.status(200).json({
    success: true,
    message: `Product ${product.isFeatured ? 'marked as featured' : 'unmarked as featured'}`,
    data: {
      product: {
        id: product._id,
        name: product.name,
        isFeatured: product.isFeatured
      }
    }
  });
});

/**
 * Get low stock products (Admin only)
 * GET /api/products/admin/low-stock
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  const products = await Product.find({
    isActive: true,
    $expr: {
      $and: [
        { $gt: ['$stock', 0] },
        { $lte: ['$stock', '$lowStockThreshold'] }
      ]
    }
  })
    .sort({ stock: 1 })
    .limit(parseInt(limit))
    .select('name stock lowStockThreshold category price')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      products,
      count: products.length
    }
  });
});

module.exports = {
  getProducts,
  getProduct,
  getProductsByCategory,
  getFeaturedProducts,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  updateStock,
  toggleFeatured,
  getLowStockProducts
};