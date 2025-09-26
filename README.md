# SafeCaption - Instagram Content Validation API

> AI-powered Instagram content validation service inspired by SafePrompt.dev

SafeCaption is a professional API service that validates Instagram captions for safety, compliance, and engagement optimization before publishing. Built with Astro, TypeScript, and modern web technologies.

## 🚀 Quick Start

```bash
# Navigate to project
cd /Users/soumyajit/Desktop/Code/instagram-safecaption

# Install dependencies
npm install

# Start development server
npm run dev
```

**Live at:** http://localhost:4322

## 📁 Project Structure

```
instagram-safecaption/
├── src/
│   ├── pages/
│   │   ├── index.astro          # Landing page with features
│   │   ├── demo.astro           # Interactive playground
│   │   ├── pricing.astro        # Pricing tiers (Free/Pro/Enterprise)
│   │   ├── api.astro           # API documentation
│   │   └── api/
│   │       └── v1/
│   │           └── validate.ts  # Main validation API endpoint
│   ├── layouts/
│   │   └── Layout.astro        # Base layout with dark theme
│   ├── components/
│   │   └── Header.astro        # Navigation header
│   └── styles/
│       └── global.css          # Custom Tailwind components
├── public/
│   └── favicon.svg            # Instagram-themed favicon
├── package.json               # Dependencies and scripts
├── astro.config.mjs          # Astro + Tailwind configuration
├── tailwind.config.js        # Dark theme customization
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🎯 Key Features

### 🔒 Content Validation
- **Hate Speech Detection** - Identifies offensive and inappropriate content
- **Spam Filtering** - Detects spam patterns and aggressive promotion
- **Policy Compliance** - Ensures content meets Instagram guidelines
- **Fast Processing** - Ultra-fast validation (<10ms response time)

### 📈 Content Optimization
- **Hashtag Optimization** - Suggests relevant and trending hashtags
- **Engagement Prediction** - Calculates potential engagement score
- **Readability Analysis** - Measures content readability
- **Caption Sanitization** - Provides clean versions of flagged content

### 👨‍💻 Developer Experience
- **RESTful API** - Simple HTTP POST requests
- **TypeScript Support** - Full type safety
- **Live Demo** - Interactive testing playground
- **Comprehensive Docs** - Complete API documentation

## 🌐 Pages & Routes

### Web Interface
- **Homepage** (`/`) - Features overview and API examples
- **Live Demo** (`/demo`) - Test captions in real-time
- **API Documentation** (`/api`) - Complete docs with code examples
- **Pricing** (`/pricing`) - Three-tier pricing structure

### API Endpoints
- **POST** `/api/v1/validate` - Main validation endpoint

## 🛠 API Usage

### Basic Request
```bash
curl -X POST http://localhost:4322/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Check out my new collection! 🔥",
    "hashtags": ["#fashion", "#style"],
    "options": {
      "checkSpam": true,
      "optimizeHashtags": true,
      "predictEngagement": true
    }
  }'
```

### Response Example
```json
{
  "safe": true,
  "score": 95,
  "issues": [],
  "suggestions": {
    "hashtags": ["#fashion", "#style", "#trendy", "#ootd", "#reels"]
  },
  "metrics": {
    "engagementScore": 82,
    "readabilityScore": 90,
    "hashtagRelevance": 85
  },
  "processingTime": 8
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `caption` | string | ✅ | Instagram caption to validate (max 2200 chars) |
| `hashtags` | array | ❌ | Array of hashtags to analyze |
| `options` | object | ❌ | Validation options |

### Validation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `checkHateSpeech` | boolean | `true` | Check for hate speech |
| `checkSpam` | boolean | `true` | Check for spam patterns |
| `checkCompliance` | boolean | `true` | Check policy compliance |
| `optimizeHashtags` | boolean | `false` | Generate hashtag suggestions |
| `predictEngagement` | boolean | `false` | Calculate engagement metrics |

## 🎨 Design & Tech Stack

### Visual Design
- **Professional Dark Theme** - Black/gray color scheme like SafePrompt
- **Gradient Accents** - Purple-to-pink-to-blue gradients
- **Modern Typography** - Inter font with optimized features
- **Responsive Layout** - Mobile-first design approach
- **Interactive Elements** - Smooth hover effects and transitions

### Technology Stack
- **Framework**: Astro 5.14.0 (Modern web framework)
- **Language**: TypeScript (Type-safe development)
- **Styling**: Tailwind CSS (Utility-first styling)
- **Runtime**: Node.js (Server-side processing)
- **Bundler**: Vite (Fast development server)

## 🧪 Validation Engine

### Content Analysis Features
1. **Pattern Recognition** - Regex-based detection of inappropriate content
2. **Keyword Filtering** - Comprehensive banned words database
3. **Context Understanding** - Analyzing content meaning and intent
4. **Engagement Prediction** - Estimating post performance potential

### Spam Detection
- Follow-for-follow schemes detection
- Excessive self-promotion identification
- Link farming attempt recognition
- Repetitive content pattern analysis
- Emoji overuse detection (>15 emojis flagged)

### Hashtag Intelligence
- **Relevance Scoring** - Match hashtags against caption content
- **Trending Integration** - Include popular hashtags
- **Duplicate Removal** - Clean up redundant tags
- **Limit Compliance** - Respect Instagram's 30 hashtag limit
- **Niche Optimization** - Category-specific suggestions

## 💰 Pricing Structure

### 🆓 Free Tier
- 1,000 validations/month
- Basic content validation
- Hashtag suggestions
- API access
- Community support

### 💎 Pro Tier - $9/month
- 50,000 validations/month
- Advanced AI analysis
- Engagement predictions
- Batch processing capabilities
- Analytics dashboard
- Email support

### 🏢 Enterprise - Custom Pricing
- Unlimited validations
- Custom AI model training
- Dedicated infrastructure
- SLA guarantee (99.9% uptime)
- White-label solutions
- 24/7 priority support

## 🚀 Deployment Options

### Free Hosting Platforms
1. **Vercel** ⭐ - Recommended for Astro projects
2. **Netlify** - Excellent for static sites with serverless functions
3. **Render** - Free web services with automatic deployments
4. **Railway** - $5 monthly credit, ideal for APIs
5. **Cyclic** - 100% free tier with no sleep

### Environment Configuration
Create a `.env` file for API integrations:

```env
PORT=4322
NODE_ENV=development

# Future AI API Keys (all optional)
HUGGINGFACE_API_KEY=your_key_here
COHERE_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
INSTAGRAM_API_KEY=your_key_here
```

## 🧞 Available Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at localhost:4322 |
| `npm run build` | Build production site to ./dist/ |
| `npm run preview` | Preview production build locally |
| `npm run astro check` | Check Astro project for issues |

## 🔮 Roadmap & Future Enhancements

### Phase 1 - AI Integration (Next)
- [ ] Integrate Hugging Face API for advanced NLP
- [ ] Add Cohere API for creative text generation
- [ ] Implement Google Gemini for multimodal analysis
- [ ] Enhanced accuracy with machine learning models

### Phase 2 - User Management
- [ ] User authentication and API key management
- [ ] Usage tracking and analytics dashboard
- [ ] Rate limiting implementation
- [ ] Stripe billing system integration
- [ ] User dashboard with statistics

### Phase 3 - Advanced Features
- [ ] Multi-language content support
- [ ] Image-based caption generation
- [ ] Trending topic analysis and alerts
- [ ] Chrome extension for direct Instagram integration
- [ ] Bulk caption validation
- [ ] Content scheduling recommendations

### Phase 4 - Enterprise Solutions
- [ ] Custom AI model training for brands
- [ ] White-label API solutions
- [ ] Advanced analytics and reporting
- [ ] Social media management tool integrations
- [ ] Team collaboration features
- [ ] Custom compliance rule creation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Test your changes thoroughly
5. Commit with descriptive messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request with detailed description

## 📞 Support & Contact

- **Email**: support@safecaption.com
- **API Documentation**: [/api](http://localhost:4322/api)
- **Live Demo**: [/demo](http://localhost:4322/demo)
- **Issues**: Create an issue in this repository
- **Enterprise Sales**: enterprise@safecaption.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

### Instagram Content Creator Tools
- **Instagram Reel Helper** - Simple caption generation tool
  📍 Location: `/Users/soumyajit/Desktop/Code/instagram`
  🌐 Access: http://localhost:3000

### Other Projects
- **Day Trading Platform** - Real-time NSE data integration
  📍 Location: `/Users/soumyajit/Desktop/Code/day_trading`
  🌐 Access: http://localhost:8080

## 🙏 Acknowledgments

- Inspired by [SafePrompt.dev](https://safeprompt.dev) for API design
- Built with [Astro](https://astro.build) framework
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Icons from [Heroicons](https://heroicons.com)

---

**Built with ❤️ using Astro, TypeScript, and Tailwind CSS**

*SafeCaption - Protecting creators, one caption at a time.*
