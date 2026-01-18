# 🛍️ Marketplace Nepal

A modern, full-featured e-commerce platform for online clothing retail in Nepal. Built with React, TypeScript, and Tailwind CSS.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## ✨ Features

### 🛒 Shopping Experience
- **Product Catalog** - Browse clothing items with detailed information
- **Shopping Cart** - Add, remove, and manage cart items
- **User Authentication** - Secure login and account management
- **Responsive Design** - Seamless experience on desktop, tablet, and mobile

### 💳 Payment Integration
- **eSewa** - Nepal's most popular digital wallet
- **Khalti/IME Pay** - Alternative digital payment options
- **PrabhuPay** - Additional payment gateway
- **ConnectIPS** - Bank-to-bank transfers
- **Cash on Delivery (COD)** - Pay when you receive

### 📍 Delivery
- **Kathmandu Valley** - 2-5 business days
- **Outside Valley** - 5-10 business days (all districts)
- Free delivery on orders above Rs. 1,500 (Kathmandu Valley)

### 📋 Policy Pages
- **Refund Policy** - No cash refund policy with store credit for genuine issues
- **Terms & Conditions** - Comprehensive legal agreement
- **Cookie Policy** - Transparent cookie usage and user choices
- **Contact Us** - Multiple contact methods and inquiry form

## 🚀 Tech Stack

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Vite
- React Router
- Lucide React (Icons)

**Backend/Services:**
- Supabase (Backend as a Service)
- Payment Gateway APIs (eSewa, Khalti, IME Pay)

**Deployment:**
- Lovable.dev

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Clone the Repository
```bash
git clone https://github.com/Gyal-zenSherpa/your-marketplace-hub.git
cd your-marketplace-hub
```

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## 🗂️ Project Structure

```
your-marketplace-hub/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   │   ├── Index.tsx     # Home page
│   │   ├── RefundPolicy.tsx
│   │   ├── TermsAndConditions.tsx
│   │   ├── CookiePolicy.tsx
│   │   └── ContactUs.tsx
│   ├── lib/              # Utility functions
│   ├── integrations/     # Supabase integration
│   └── App.tsx           # Main app component
├── public/               # Static assets
├── index.html
└── package.json
```

## 🎯 Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Main landing page with product catalog |
| Refund Policy | `/refund-policy` | No refund policy with store credit details |
| Terms & Conditions | `/terms` | Legal terms and user agreement |
| Cookie Policy | `/cookie-policy` | Cookie usage and user privacy |
| Contact Us | `/contact` | Contact form and information |

## 💼 Business Information

**Company:** Marketplace Nepal Pvt. Ltd.  
**Registration No.:** 21345698  
**PAN No.:** 5115274  
**Location:** New Road, Kathmandu, Nepal  
**Email:** marketplaceauthentic01@gmail.com  
**Phone:** 9763689295

## 🔒 Security & Privacy

- Secure payment processing through authorized gateways
- No storage of payment card information
- HTTPS encryption for all data transmission
- Compliance with Nepal's Electronic Transactions Act (2063) and Privacy Act (2075)
- Transparent cookie and data collection policies

## 📱 Contact & Support

**Customer Service Hours:**  
Sunday - Friday: 10:00 AM - 6:00 PM NPT  
Closed on Saturdays and Public Holidays

**Contact Methods:**
- 📧 Email: marketplaceauthentic01@gmail.com
- 📞 Phone/WhatsApp: 9763689295
- 💬 Website Contact Form

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Lovable.dev](https://lovable.dev)
- Icons by [Lucide Icons](https://lucide.dev)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Backend by [Supabase](https://supabase.com)

## 📊 Project Status

🟢 **Active Development** - Regularly updated and maintained

## 🗺️ Roadmap

- [ ] Product review and rating system
- [ ] Wishlist functionality
- [ ] Order tracking system
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Multi-language support (Nepali/English)
- [ ] Social media login integration

**Made with ❤️ in Nepal**
# Supabase CLI

[![Coverage Status](https://coveralls.io/repos/github/supabase/cli/badge.svg?branch=main)](https://coveralls.io/github/supabase/cli?branch=main) [![Bitbucket Pipelines](https://img.shields.io/bitbucket/pipelines/supabase-cli/setup-cli/master?style=flat-square&label=Bitbucket%20Canary)](https://bitbucket.org/supabase-cli/setup-cli/pipelines) [![Gitlab Pipeline Status](https://img.shields.io/gitlab/pipeline-status/sweatybridge%2Fsetup-cli?label=Gitlab%20Canary)
](https://gitlab.com/sweatybridge/setup-cli/-/pipelines)

[Supabase](https://supabase.io) is an open source Firebase alternative. We're building the features of Firebase using enterprise-grade open source tools.

This repository contains all the functionality for Supabase CLI.

- [x] Running Supabase locally
- [x] Managing database migrations
- [x] Creating and deploying Supabase Functions
- [x] Generating types directly from your database schema
- [x] Making authenticated HTTP requests to [Management API](https://supabase.com/docs/reference/api/introduction)


For more information, visit our website or contact us at marketplaceauthentic01@gmail.com

© 2024-2026 Marketplace Nepal Pvt. Ltd. All Rights Reserved.
