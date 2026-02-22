import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const ReportIssue = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    orderNumber: '',
    description: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(false);
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
    setError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.category || !formData.description) {
      setError(true);
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("customer_issues").insert({
        user_id: user?.id || null,
        name: formData.name.trim(),
        email: formData.email.trim(),
        category: formData.category,
        order_number: formData.orderNumber.trim() || null,
        description: formData.description.trim(),
      });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting issue:", err);
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    'Bug Report', 'Feature Request', 'Product Related', 'Order Issue',
    'Payment Problem', 'Shipping & Delivery', 'Return & Refund',
    'Account Issue', 'Website Problem', 'Other'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        {submitted ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Thank you for this report!
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Our team will review this issue as soon as possible and let you know. We appreciate your feedback in helping us improve.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', category: '', orderNumber: '', description: '' }); }} variant="outline">
                Report Another Issue
              </Button>
              <Link to="/">
                <Button>Back to Home</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Report an Issue</h1>
              <p className="text-muted-foreground">Help us improve by reporting any problems you encounter</p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-destructive">Please fill in all required fields.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Enter your full name" className="w-full" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" className="w-full" />
              </div>

              <div className="space-y-2">
                <Label>Issue Category *</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderNumber">Order Number (if applicable)</Label>
                <Input id="orderNumber" name="orderNumber" type="text" value={formData.orderNumber} onChange={handleChange} placeholder="e.g., ORD-12345" className="w-full" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Please describe the issue in detail..." rows={5} className="w-full resize-none" />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Issue"}
              </Button>
            </form>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-2">Need to speak with us directly?</p>
              <Link to="/contact" className="text-primary hover:underline font-medium">
                Contact Us →
              </Link>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ReportIssue;
