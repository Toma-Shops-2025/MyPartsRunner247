## SendGrid Setup Checklist

1. Create a SendGrid account at https://sendgrid.com.
2. Navigate to Settings → API Keys and create a key with “Mail Send” permission.
3. Add the key in Netlify as `SENDGRID_API_KEY`.
4. Verify your sender (either single sender or domain) and use that address for `SENDGRID_FROM_EMAIL`.
5. Test via `/notification-test` route once your site is redeployed.
# MY-RUNNER.COM - Anything, Anytime, Anywhere

A modern delivery service platform built with React, TypeScript, and Vite. MY-RUNNER.COM is the only delivery service that picks up from absolutely anywhere, available 24/7 nationwide.

## Features

- 🚚 **Universal Pickup**: Pick up from absolutely anywhere
- ⏰ **24/7 Availability**: Round-the-clock service nationwide
- 📱 **Progressive Web App**: Install and use like a native app
- 🗺️ **Real-time Tracking**: Live location tracking with Mapbox
- 💳 **Secure Payments**: Integrated with Stripe for secure transactions
- 🔐 **User Authentication**: Secure login with Supabase
- 📊 **Driver Dashboard**: Comprehensive driver management system
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (Database, Auth, Real-time)
- **Maps**: Mapbox
- **Payments**: Stripe
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Toma-Shops-2025/MY-RUNNER.COM247.git
cd MY-RUNNER.COM247
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your actual values
```

4. Start the development server:
```bash
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_APP_URL=https://mypartsrunner.com
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Build for production with optimizations
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## Deployment

The application is configured for deployment on Netlify with the included `netlify.toml` configuration file.

## License

This project is proprietary software. All rights reserved.
