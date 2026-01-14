import React, { useState } from 'react';
import { Mail, Phone, Clock, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    orderNumber: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubjectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subject: value
    }));
    if (errors.subject) {
      setErrors(prev => ({
        ...prev,
        subject: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', formData);
      setSubmitted(true);
      
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          orderNumber: ''
        });
        setSubmitted(false);
      }, 5000);
    } else {
      setErrors(newErrors);
    }
  };

  const contactMethods = [
    {
      icon: <Phone className="h-6 w-6 text-white" />,
      title: 'Phone',
      details: ['Mobile/WhatsApp: 9763689295', 'Viber: 9763689295'],
      color: 'bg-blue-500'
    },
    {
      icon: <Mail className="h-6 w-6 text-white" />,
      title: 'Email',
      details: ['marketplaceauthentic01@gmail.com', 'Response within 24 hours'],
      color: 'bg-green-500'
    },
    {
      icon: <Clock className="h-6 w-6 text-white" />,
      title: 'Business Hours',
      details: ['Sunday - Friday', '10:00 AM - 6:00 PM', 'Closed on Saturdays & Public Holidays'],
      color: 'bg-purple-500'
    }
  ];

  const faqItems = [
    {
      question: 'How do I track my order?',
      answer: 'You can track your order using the tracking number sent to your email/SMS after shipment.'
    },
    {
      question: 'What is your refund policy?',
      answer: 'We have a strict no cash refund policy. Store credit is offered only for our errors or defects. Please see our Refund Policy for details.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'Inside Kathmandu Valley: 2-5 business days. Outside Valley: 5-10 business days.'
    },
    {
      question: 'Do you offer Cash on Delivery?',
      answer: 'Yes, COD is available for most locations across Nepal.'
    }
  ];

  const subjects = [
    'Order Inquiry',
    'Delivery Status',
    'Product Question',
    'Store Credit Issue',
    'Defect/Quality Complaint',
    'Payment Issue',
    'Feedback/Suggestion',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">Get in Touch</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
          {contactMethods.map((method, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className={`inline-flex items-center justify-center w-14 h-14 ${method.color} rounded-full mb-4`}>
                {method.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{method.title}</h3>
              <div className="space-y-1">
                {method.details.map((detail, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground">{detail}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content - Form and Info Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-6">Send Us a Message</h2>
              
              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">
                    Thank you for contacting us. We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="98XXXXXXXX"
                        className={errors.phone ? 'border-destructive' : ''}
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orderNumber">Order Number (Optional)</Label>
                      <Input
                        id="orderNumber"
                        name="orderNumber"
                        value={formData.orderNumber}
                        onChange={handleChange}
                        placeholder="ORD-XXXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Select value={formData.subject} onValueChange={handleSubjectChange}>
                      <SelectTrigger className={errors.subject ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      rows={5}
                      className={`resize-none ${errors.message ? 'border-destructive' : ''}`}
                    />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting this form, you agree to our{' '}
                    <Link to="/terms" className="text-primary hover:underline">Terms and Conditions</Link>
                    {' '}and{' '}
                    <Link to="/refund-policy" className="text-primary hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar - Quick Links & Info */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Contact</h3>
              <div className="space-y-3">
                <a href="tel:9763689295" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="h-5 w-5" />
                  Call: 9763689295
                </a>
                <a href="https://wa.me/9779763689295" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-green-500 transition-colors">
                  <Phone className="h-5 w-5" />
                  WhatsApp: 9763689295
                </a>
                <a href="mailto:marketplaceauthentic01@gmail.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                  Email Us
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-2">Follow Us</h3>
              <p className="text-sm text-muted-foreground mb-4">Stay updated with our latest collections and offers</p>
              <div className="flex gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5h-4.33C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2.16c3.2,0,3.58,0,4.85.07,3.25.15,4.77,1.69,4.92,4.92.06,1.27.07,1.65.07,4.85s0,3.58-.07,4.85c-.15,3.23-1.66,4.77-4.92,4.92-1.27.06-1.64.07-4.85.07s-3.58,0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s0-3.58.07-4.85C2.38,3.92,3.9,2.38,7.15,2.23,8.42,2.18,8.8,2.16,12,2.16ZM12,0C8.74,0,8.33,0,7.05.07c-4.27.2-6.78,2.71-7,7C0,8.33,0,8.74,0,12s0,3.67.07,4.95c.2,4.27,2.71,6.78,7,7C8.33,24,8.74,24,12,24s3.67,0,4.95-.07c4.27-.2,6.78-2.71,7-7C24,15.67,24,15.26,24,12s0-3.67-.07-4.95c-.2-4.27-2.71-6.78-7-7C15.67,0,15.26,0,12,0Zm0,5.84A6.16,6.16,0,1,0,18.16,12,6.16,6.16,0,0,0,12,5.84ZM12,16a4,4,0,1,1,4-4A4,4,0,0,1,12,16ZM18.41,4.15a1.44,1.44,0,1,0,1.44,1.44A1.44,1.44,0,0,0,18.41,4.15Z"/></svg>
                </a>
              </div>
            </div>

            {/* Report Issue Link */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Having Issues?</h3>
              <p className="text-sm text-muted-foreground mb-4">Report technical problems or bugs</p>
              <Link to="/report-issue">
                <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  Report an Issue
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-muted/50 rounded-xl p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold text-foreground text-center mb-6">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqItems.map((faq, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-muted-foreground mb-2">Can't find what you're looking for?</p>
            <Link to="/terms" className="text-primary hover:underline font-medium">
              View All FAQs →
            </Link>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-primary text-primary-foreground rounded-xl p-6 md:p-8 text-center mb-12">
          <h2 className="text-xl font-bold mb-2">Need Immediate Assistance?</h2>
          <p className="opacity-90 mb-4">
            Our customer support team is available Sunday to Friday, 10 AM - 6 PM
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:9763689295">
              <Button variant="secondary" className="w-full sm:w-auto">
                <Phone className="h-4 w-4 mr-2" />
                Call: 9763689295
              </Button>
            </a>
            <a href="https://wa.me/9779763689295" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="w-full sm:w-auto">
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp: 9763689295
              </Button>
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-muted-foreground text-sm space-y-1">
          <p className="font-medium">Marketplace Nepal Pvt. Ltd.</p>
          <p>Registration No.: 21345698 | PAN No.: 5115274</p>
          <p>© 2024-2026 Marketplace. All Rights Reserved.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
