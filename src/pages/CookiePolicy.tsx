import React from 'react';
import { Cookie, Shield, Settings, Info, AlertTriangle, Mail, Phone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const CookiePolicy = () => {
  const navigate = useNavigate();

  const cookieTypes = [
    {
      id: 'essential',
      icon: <Shield className="h-6 w-6 text-white" />,
      title: 'Essential/Necessary Cookies',
      color: 'bg-red-500',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      required: true,
      description: 'Required for the website to function properly. Cannot be disabled.',
      purposes: [
        'Enable core website functionality',
        'Maintain user sessions when logged in',
        'Remember items in your shopping cart',
        'Process payments securely',
        'Ensure website security',
        'Load balancing and performance'
      ]
    },
    {
      id: 'functional',
      icon: <Settings className="h-6 w-6 text-white" />,
      title: 'Functional Cookies',
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      required: false,
      description: 'Enhance functionality and personalization.',
      purposes: [
        'Remember your preferences (language, currency, location)',
        'Provide personalized content',
        'Remember your login details (if you choose)',
        'Enable chat support features',
        'Customize user interface based on preferences'
      ]
    },
    {
      id: 'analytics',
      icon: <Info className="h-6 w-6 text-white" />,
      title: 'Analytics/Performance Cookies',
      color: 'bg-purple-500',
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      required: false,
      description: 'Help us understand how visitors use our Platform.',
      purposes: [
        'Analyze website traffic and usage patterns',
        'Understand which pages are most visited',
        'Identify technical issues and errors',
        'Measure effectiveness of marketing campaigns',
        'Improve website performance and user experience',
        'A/B testing and optimization'
      ]
    },
    {
      id: 'marketing',
      icon: <AlertTriangle className="h-6 w-6 text-white" />,
      title: 'Marketing/Advertising Cookies',
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      required: false,
      description: 'Track your browsing activity for advertising purposes.',
      purposes: [
        'Deliver targeted advertisements',
        'Measure advertising campaign effectiveness',
        'Limit the number of times you see an ad',
        'Track conversions from ads',
        'Build advertising profiles',
        'Retargeting and remarketing'
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-6 sm:py-8 lg:py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <Cookie className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Cookie Policy
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Learn about how we use cookies on our Platform to enhance your shopping experience.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Last Updated: January 5, 2026
            </p>
          </div>

          {/* Introduction */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              What Are Cookies?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-4">
              Cookies are small text files stored on your device when you visit our website. They help us provide 
              you with a better shopping experience by remembering your preferences and understanding how you use our Platform.
            </p>
            <p className="text-muted-foreground text-sm sm:text-base">
              By using our Platform, you consent to our use of cookies as described below.
            </p>
          </div>

          {/* Why We Use Cookies */}
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
              Why We Use Cookies
            </h2>
            
            <div className="space-y-4">
              {cookieTypes.map((cookie) => (
                <div 
                  key={cookie.id}
                  className={`${cookie.bgColor} border-l-4 ${cookie.borderColor} rounded-lg p-4 sm:p-6`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className={`${cookie.color} p-3 rounded-full w-fit shrink-0`}>
                      {cookie.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">
                          {cookie.title}
                        </h3>
                        {cookie.required ? (
                          <span className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-medium">
                            Required
                          </span>
                        ) : (
                          <span className="bg-gray-100 dark:bg-gray-800 text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">
                        {cookie.description}
                      </p>
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">Used For:</p>
                        <ul className="space-y-1">
                          {cookie.purposes.map((purpose, idx) => (
                            <li key={idx} className="flex items-start text-xs sm:text-sm text-muted-foreground">
                              <span className="mr-2 text-primary">•</span>
                              {purpose}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your Control */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              Your Cookie Choices
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-4">
              You can manage or disable cookies through your browser settings. However, disabling essential cookies 
              may affect your ability to use certain features of our Platform.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                  ✓ If You Allow Cookies
                </h4>
                <ul className="space-y-1 text-sm text-green-600 dark:text-green-400">
                  <li>• Full website functionality</li>
                  <li>• Personalized shopping experience</li>
                  <li>• Saved preferences and cart items</li>
                  <li>• Smooth checkout process</li>
                  <li>• Better customer service</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                  ⚠ If You Disable Cookies
                </h4>
                <ul className="space-y-1 text-sm text-yellow-600 dark:text-yellow-400">
                  <li>• Limited website functionality</li>
                  <li>• Cannot stay logged in</li>
                  <li>• Shopping cart won't work</li>
                  <li>• Preferences not saved</li>
                  <li>• Payment may not process</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Legal Compliance */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              Legal Compliance
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-4">
              Our cookie policy complies with the laws and regulations of Nepal:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <p className="font-semibold text-foreground text-sm">Electronic Transactions Act</p>
                <p className="text-xs text-muted-foreground">2063 (2008)</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <p className="font-semibold text-foreground text-sm">Privacy Act</p>
                <p className="text-xs text-muted-foreground">2075 (2018)</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <p className="font-semibold text-foreground text-sm">Consumer Protection Act</p>
                <p className="text-xs text-muted-foreground">2075 (2018)</p>
              </div>
            </div>
          </div>

          {/* Consent Statement */}
          <div className="bg-muted/50 border border-border rounded-xl p-4 sm:p-6 text-center mb-6">
            <Cookie className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Your Consent</h3>
            <p className="text-muted-foreground text-sm">
              By continuing to use our Platform, you consent to our use of cookies as described in this policy. 
              You can manage your cookie preferences through your browser settings at any time.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-muted-foreground text-xs sm:text-sm space-y-1">
            <p className="font-semibold">Marketplace Nepal Pvt. Ltd.</p>
            <p>Registration No.: 21345698 | PAN No.: 5115274</p>
            <p>New Road, Kathmandu, Nepal</p>
            <p className="text-xs">Last Reviewed: Magh 22, 2082 BS (January 5, 2026)</p>
            <p className="text-xs mt-2">© 2024-2026 Marketplace. All Rights Reserved.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicy;
