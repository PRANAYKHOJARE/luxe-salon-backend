const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters'],
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: String,
    required: [true, 'Service duration is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: [
      'Hair',
      'Skincare', 
      'Nails',
      'Brows & Lashes',
      'Wellness',
      'Makeup',
      'Bridal'
    ]
  },
  icon: {
    type: String,
    required: [true, 'Service icon is required'],
    trim: true
  },
  popular: {
    type: Boolean,
    default: false
  },
  available: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: null
  },
  features: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted price
serviceSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

// Virtual for duration in minutes
serviceSchema.virtual('durationMinutes').get(function() {
  const match = this.duration.match(/(\d+)\s*min/);
  return match ? parseInt(match[1]) : 0;
});

// Index for better query performance
serviceSchema.index({ category: 1 });
serviceSchema.index({ popular: 1 });
serviceSchema.index({ available: 1 });
serviceSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware
serviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get services by category
serviceSchema.statics.getByCategory = function(category) {
  return this.find({ 
    category: category, 
    available: true 
  }).sort({ popular: -1, name: 1 });
};

// Static method to get popular services
serviceSchema.statics.getPopular = function() {
  return this.find({ 
    popular: true, 
    available: true 
  }).sort({ name: 1 });
};

// Static method to get all categories
serviceSchema.statics.getCategories = function() {
  return this.distinct('category');
};

module.exports = mongoose.model('Service', serviceSchema);
