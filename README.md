# MyPartsRunner - Anything, Anytime, Anywhere

A modern delivery service platform built with React, TypeScript, and Vite. MyPartsRunner is the only delivery service that picks up from absolutely anywhere, available 24/7 nationwide.

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
git clone https://github.com/Toma-Shops-2025/MyPartsRunner247.git
cd MyPartsRunner247
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
