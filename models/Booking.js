const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  clientEmail: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  clientPhone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  serviceName: {
    type: String,
    required: true
  },
  servicePrice: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  serviceDuration: {
    type: String,
    required: true
  },
  serviceCategory: {
    type: String,
    required: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Appointment date must be in the future'
    }
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: 'No special requests'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  stylist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stylist'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
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

// Virtual for formatted date
bookingSchema.virtual('formattedDate').get(function() {
  return this.appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted time
bookingSchema.virtual('formattedTime').get(function() {
  const time = this.appointmentTime;
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
});

// Index for better query performance
bookingSchema.index({ appointmentDate: 1, appointmentTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ clientEmail: 1 });
bookingSchema.index({ createdAt: -1 });

// Pre-save middleware to update total amount
bookingSchema.pre('save', function(next) {
  this.totalAmount = this.servicePrice;
  this.updatedAt = new Date();
  next();
});

// Static method to get booking statistics
bookingSchema.statics.getStats = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const stats = await this.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        pending: [{ $match: { status: 'pending' } }, { $count: 'count' }],
        confirmed: [{ $match: { status: 'confirmed' } }, { $count: 'count' }],
        completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
        todayRevenue: [
          {
            $match: {
              appointmentDate: { $gte: today, $lt: tomorrow },
              status: { $in: ['confirmed', 'completed'] }
            }
          },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]
      }
    }
  ]);

  return {
    total: stats[0].total[0]?.count || 0,
    pending: stats[0].pending[0]?.count || 0,
    confirmed: stats[0].confirmed[0]?.count || 0,
    completed: stats[0].completed[0]?.count || 0,
    todayRevenue: stats[0].todayRevenue[0]?.total || 0
  };
};

module.exports = mongoose.model('Booking', bookingSchema);
