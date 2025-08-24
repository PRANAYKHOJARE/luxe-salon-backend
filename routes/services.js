const express = require('express');
const { body, validationResult } = require('express-validator');
const Service = require('../models/Service');

const router = express.Router();

// Validation middleware
const validateService = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('duration')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Duration is required'),
  body('category')
    .isIn(['Hair', 'Skincare', 'Nails', 'Brows & Lashes', 'Wellness', 'Makeup', 'Bridal'])
    .withMessage('Invalid category'),
  body('icon')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Icon is required')
];

// Get all services
router.get('/', async (req, res) => {
  try {
    const { category, popular, available } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (popular !== undefined) filter.popular = popular === 'true';
    if (available !== undefined) filter.available = available === 'true';

    const services = await Service.find(filter).sort({ category: 1, name: 1 });
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Get services by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const services = await Service.getByCategory(category);
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get popular services
router.get('/popular/all', async (req, res) => {
  try {
    const services = await Service.getPopular();
    res.json(services);
  } catch (error) {
    console.error('Error fetching popular services:', error);
    res.status(500).json({ error: 'Failed to fetch popular services' });
  }
});

// Get all categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Service.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new service (admin only)
router.post('/', validateService, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const service = new Service(req.body);
    await service.save();

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Service name already exists' });
    }
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service (admin only)
router.put('/:id', validateService, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Service name already exists' });
    }
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      message: 'Service deleted successfully',
      service
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Toggle service availability (admin only)
router.patch('/:id/toggle-availability', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    service.available = !service.available;
    await service.save();

    res.json({
      message: `Service ${service.available ? 'enabled' : 'disabled'} successfully`,
      service
    });
  } catch (error) {
    console.error('Error toggling service availability:', error);
    res.status(500).json({ error: 'Failed to toggle service availability' });
  }
});

// Toggle service popularity (admin only)
router.patch('/:id/toggle-popularity', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    service.popular = !service.popular;
    await service.save();

    res.json({
      message: `Service ${service.popular ? 'marked as popular' : 'removed from popular'} successfully`,
      service
    });
  } catch (error) {
    console.error('Error toggling service popularity:', error);
    res.status(500).json({ error: 'Failed to toggle service popularity' });
  }
});

// Search services
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const services = await Service.find({
      $text: { $search: query }
    }).sort({ score: { $meta: 'textScore' } });

    res.json(services);
  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({ error: 'Failed to search services' });
  }
});

module.exports = router;
