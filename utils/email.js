const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
  // For development, you can use Gmail or other services
  // For production, use services like SendGrid, AWS SES, etc.
  
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development configuration (using Gmail or similar)
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Luxe Salon <noreply@luxesalon.com>',
      to: booking.clientEmail,
      subject: '🎉 Your Appointment is Confirmed - Luxe Salon',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation - Luxe Salon</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .service-info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .cta-button { display: inline-block; background: linear-gradient(45deg, #f5576c, #d4af37); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💇‍♀️ Luxe Salon</h1>
              <h2>Your Appointment is Confirmed!</h2>
            </div>
            
            <div class="content">
              <p>Dear <strong>${booking.clientName}</strong>,</p>
              
              <p>Thank you for choosing Luxe Salon! We're excited to confirm your appointment.</p>
              
              <div class="booking-details">
                <h3>📅 Appointment Details</h3>
                <p><strong>Date:</strong> ${booking.formattedDate}</p>
                <p><strong>Time:</strong> ${booking.formattedTime}</p>
                <p><strong>Booking ID:</strong> ${booking._id}</p>
                
                <div class="service-info">
                  <h4>${booking.serviceName}</h4>
                  <p><strong>Duration:</strong> ${booking.serviceDuration}</p>
                  <p><strong>Price:</strong> $${booking.servicePrice}</p>
                  <p><strong>Category:</strong> ${booking.serviceCategory}</p>
                </div>
                
                ${booking.notes ? `<p><strong>Special Requests:</strong> ${booking.notes}</p>` : ''}
              </div>
              
              <h3>📍 Location</h3>
              <p>Luxe Salon<br>
              123 Beauty Street<br>
              City, State 12345</p>
              
              <h3>📞 Contact Information</h3>
              <p>Phone: (555) 123-4567<br>
              Email: info@luxesalon.com</p>
              
              <h3>⚠️ Important Reminders</h3>
              <ul>
                <li>Please arrive 10 minutes before your appointment time</li>
                <li>Bring any relevant medical information or allergies</li>
                <li>Cancellations must be made 24 hours in advance</li>
                <li>We accept cash, credit cards, and digital payments</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="http://localhost:3000/bookings/${booking._id}" class="cta-button">View Booking Details</a>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing Luxe Salon for your beauty needs!</p>
              <p>© 2024 Luxe Salon. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

// Send booking reminder email
const sendBookingReminder = async (booking) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Luxe Salon <noreply@luxesalon.com>',
      to: booking.clientEmail,
      subject: '⏰ Reminder: Your Appointment Tomorrow - Luxe Salon',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Reminder - Luxe Salon</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .reminder-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cta-button { display: inline-block; background: linear-gradient(45deg, #f5576c, #d4af37); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💇‍♀️ Luxe Salon</h1>
              <h2>Appointment Reminder</h2>
            </div>
            
            <div class="content">
              <p>Dear <strong>${booking.clientName}</strong>,</p>
              
              <p>This is a friendly reminder about your appointment tomorrow.</p>
              
              <div class="reminder-box">
                <h3>📅 Your Appointment</h3>
                <p><strong>Date:</strong> ${booking.formattedDate}</p>
                <p><strong>Time:</strong> ${booking.formattedTime}</p>
                <p><strong>Service:</strong> ${booking.serviceName}</p>
                <p><strong>Duration:</strong> ${booking.serviceDuration}</p>
              </div>
              
              <h3>📍 Location</h3>
              <p>Luxe Salon<br>
              123 Beauty Street<br>
              City, State 12345</p>
              
              <h3>📞 Need to Reschedule?</h3>
              <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
              
              <div style="text-align: center;">
                <a href="tel:+15551234567" class="cta-button">Call Us Now</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking reminder email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending booking reminder email:', error);
    throw error;
  }
};

// Send booking cancellation email
const sendBookingCancellation = async (booking) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Luxe Salon <noreply@luxesalon.com>',
      to: booking.clientEmail,
      subject: '❌ Appointment Cancelled - Luxe Salon',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Cancelled - Luxe Salon</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .cancelled-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cta-button { display: inline-block; background: linear-gradient(45deg, #f5576c, #d4af37); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💇‍♀️ Luxe Salon</h1>
              <h2>Appointment Cancelled</h2>
            </div>
            
            <div class="content">
              <p>Dear <strong>${booking.clientName}</strong>,</p>
              
              <p>Your appointment has been cancelled as requested.</p>
              
              <div class="cancelled-box">
                <h3>❌ Cancelled Appointment</h3>
                <p><strong>Date:</strong> ${booking.formattedDate}</p>
                <p><strong>Time:</strong> ${booking.formattedTime}</p>
                <p><strong>Service:</strong> ${booking.serviceName}</p>
                <p><strong>Booking ID:</strong> ${booking._id}</p>
              </div>
              
              <h3>📅 Book a New Appointment</h3>
              <p>We'd love to see you again! Book a new appointment at your convenience.</p>
              
              <div style="text-align: center;">
                <a href="http://localhost:3000/booking" class="cta-button">Book New Appointment</a>
              </div>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking cancellation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending booking cancellation email:', error);
    throw error;
  }
};

// Send admin notification for new booking
const sendAdminNotification = async (booking) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Luxe Salon <noreply@luxesalon.com>',
      to: process.env.ADMIN_EMAIL || 'admin@luxesalon.com',
      subject: '🆕 New Booking Received - Luxe Salon',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Booking - Luxe Salon</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cta-button { display: inline-block; background: linear-gradient(45deg, #f5576c, #d4af37); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💇‍♀️ Luxe Salon</h1>
              <h2>New Booking Received</h2>
            </div>
            
            <div class="content">
              <p>A new booking has been received and requires your attention.</p>
              
              <div class="booking-details">
                <h3>📋 Booking Details</h3>
                <p><strong>Client:</strong> ${booking.clientName}</p>
                <p><strong>Email:</strong> ${booking.clientEmail}</p>
                <p><strong>Phone:</strong> ${booking.clientPhone}</p>
                <p><strong>Service:</strong> ${booking.serviceName}</p>
                <p><strong>Date:</strong> ${booking.formattedDate}</p>
                <p><strong>Time:</strong> ${booking.formattedTime}</p>
                <p><strong>Price:</strong> $${booking.servicePrice}</p>
                <p><strong>Status:</strong> ${booking.status}</p>
                ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="http://localhost:3000/admin/bookings/${booking._id}" class="cta-button">View in Admin Panel</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendBookingReminder,
  sendBookingCancellation,
  sendAdminNotification
};
