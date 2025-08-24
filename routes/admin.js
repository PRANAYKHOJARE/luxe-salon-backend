const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Apply authentication and admin middleware to all routes
router.use(authenticateToken, requireAdmin);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [bookingStats, userStats, serviceStats] = await Promise.all([
      Booking.getStats(),
      User.getStats(),
      Service.countDocuments({ available: true })
    ]);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('service', 'name price duration category')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get revenue for last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const weeklyRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top services
    const topServices = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: '$serviceName',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      bookingStats,
      userStats,
      serviceStats,
      recentBookings,
      weeklyRevenue,
      topServices
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get booking statistics with filters
router.get('/bookings/stats', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (status) {
      filter.status = status;
    }

    const stats = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments(filter);
    const totalRevenue = await Booking.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      stats,
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ error: 'Failed to fetch booking statistics' });
  }
});

// Get revenue analytics
router.get('/revenue/analytics', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFormat, daysBack;
    switch (period) {
      case 'week':
        dateFormat = '%Y-%m-%d';
        daysBack = 7;
        break;
      case 'month':
        dateFormat = '%Y-%m-%d';
        daysBack = 30;
        break;
      case 'year':
        dateFormat = '%Y-%m';
        daysBack = 365;
        break;
      default:
        dateFormat = '%Y-%m-%d';
        daysBack = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const revenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate growth percentage
    const currentPeriod = revenueData.slice(-1)[0]?.revenue || 0;
    const previousPeriod = revenueData.slice(-2, -1)[0]?.revenue || 0;
    const growthPercentage = previousPeriod > 0 
      ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 
      : 0;

    res.json({
      revenueData,
      growthPercentage: Math.round(growthPercentage * 100) / 100,
      period
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Get service performance
router.get('/services/performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const servicePerformance = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$serviceName',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json(servicePerformance);
  } catch (error) {
    console.error('Error fetching service performance:', error);
    res.status(500).json({ error: 'Failed to fetch service performance' });
  }
});

// Export bookings data
router.get('/export/bookings', async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(filter)
      .populate('service', 'name price duration category')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = bookings.map(booking => ({
        'Booking ID': booking._id,
        'Client Name': booking.clientName,
        'Client Email': booking.clientEmail,
        'Client Phone': booking.clientPhone,
        'Service': booking.serviceName,
        'Price': booking.servicePrice,
        'Date': booking.appointmentDate,
        'Time': booking.appointmentTime,
        'Status': booking.status,
        'Created At': booking.createdAt
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=bookings-${new Date().toISOString().split('T')[0]}.csv`);
      
      // Convert to CSV string
      const csvString = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      res.send(csvString);
    } else {
      res.json({
        bookings,
        exportDate: new Date().toISOString(),
        totalBookings: bookings.length
      });
    }
  } catch (error) {
    console.error('Error exporting bookings:', error);
    res.status(500).json({ error: 'Failed to export bookings' });
  }
});

// Get system health
router.get('/system/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      },
      metrics: {
        totalBookings: await Booking.countDocuments(),
        totalServices: await Service.countDocuments(),
        totalUsers: await User.countDocuments(),
        activeUsers: await User.countDocuments({ isActive: true })
      }
    };

    res.json(health);
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Failed to check system health',
      timestamp: new Date().toISOString()
    });
  }
});

// Get user activity
router.get('/users/activity', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const userActivity = await User.aggregate([
      {
        $match: {
          lastLogin: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastLogin' } },
          activeUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(userActivity);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

module.exports = router;
