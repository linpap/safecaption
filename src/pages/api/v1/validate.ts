import type { APIRoute } from 'astro';
import { validateApiKey, trackUsage, checkRateLimit } from '../../../lib/api-auth';

interface ValidationRequest {
  caption: string;
  hashtags?: string[];
  options?: {
    checkHateSpeech?: boolean;
    checkSpam?: boolean;
    checkCompliance?: boolean;
    optimizeHashtags?: boolean;
    predictEngagement?: boolean;
  };
}

interface ValidationResponse {
  safe: boolean;
  score: number;
  issues: string[];
  suggestions: {
    caption?: string;
    hashtags?: string[];
  };
  metrics: {
    engagementScore: number;
    readabilityScore: number;
    hashtagRelevance: number;
  };
  processingTime: number;
}

// Banned words and patterns for content moderation
const INAPPROPRIATE_PATTERNS = [
  /\b(hate|violence|abuse|harassment)\b/gi,
  /\b(spam|follow4follow|f4f|l4l)\b/gi,
  /\b(click\s*link|bio\s*link|dm\s*me)\b/gi,
  /\b(free\s*followers|buy\s*followers)\b/gi,
];

const SPAM_INDICATORS = [
  'DM for collab',
  'Check my bio',
  'Link in bio',
  '100% real',
  'No scam',
  'Get rich quick',
];

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  // Check for API key in header
  const apiKey = request.headers.get('Authorization') || request.headers.get('X-API-Key');

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'API key required',
      code: 'MISSING_API_KEY',
      message: 'Please provide an API key in the Authorization header'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate API key
  const { valid, keyData, error } = await validateApiKey(apiKey);

  if (!valid) {
    return new Response(JSON.stringify({
      error: error || 'Invalid API key',
      code: 'INVALID_API_KEY'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(apiKey);

  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      limit: rateLimit.limit,
      remaining: 0
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(rateLimit.limit || 10),
        'X-RateLimit-Remaining': '0',
        'Retry-After': '60'
      }
    });
  }

  try {
    const body = await request.json() as ValidationRequest;
    const { caption, hashtags = [], options = {} } = body;

    if (!caption) {
      return new Response(JSON.stringify({
        error: 'Caption is required',
        code: 'MISSING_CAPTION'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate caption length (Instagram limit: 2200 characters)
    if (caption.length > 2200) {
      return new Response(JSON.stringify({
        error: 'Caption exceeds Instagram limit of 2200 characters',
        code: 'CAPTION_TOO_LONG'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const issues: string[] = [];
    let safe = true;
    let score = 100;

    // 1. Check for hate speech and inappropriate content
    if (options.checkHateSpeech !== false) {
      for (const pattern of INAPPROPRIATE_PATTERNS) {
        if (pattern.test(caption)) {
          issues.push('Potentially inappropriate content detected');
          safe = false;
          score -= 30;
          break;
        }
      }
    }

    // 2. Check for spam
    if (options.checkSpam !== false) {
      const lowerCaption = caption.toLowerCase();
      for (const indicator of SPAM_INDICATORS) {
        if (lowerCaption.includes(indicator.toLowerCase())) {
          issues.push('Spam-like content detected');
          safe = false;
          score -= 20;
          break;
        }
      }

      // Check for excessive emoji usage
      const emojiCount = (caption.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
      if (emojiCount > 15) {
        issues.push('Excessive emoji usage detected');
        score -= 10;
      }

      // Check for excessive hashtags in caption
      const hashtagInCaption = (caption.match(/#\w+/g) || []).length;
      if (hashtagInCaption > 10) {
        issues.push('Too many hashtags in caption text');
        score -= 10;
      }
    }

    // 3. Check compliance
    if (options.checkCompliance !== false) {
      // Check for misleading claims
      const misleadingPatterns = [
        /guaranteed\s*(results|success|money)/gi,
        /\b(cure|miracle|instant\s*results)\b/gi,
        /\b(medical\s*advice|financial\s*advice)\b/gi,
      ];

      for (const pattern of misleadingPatterns) {
        if (pattern.test(caption)) {
          issues.push('Potentially misleading claims detected');
          safe = false;
          score -= 25;
          break;
        }
      }
    }

    // 4. Calculate engagement metrics
    const metrics = {
      engagementScore: calculateEngagementScore(caption, hashtags),
      readabilityScore: calculateReadabilityScore(caption),
      hashtagRelevance: calculateHashtagRelevance(caption, hashtags),
    };

    // 5. Generate suggestions
    const suggestions: ValidationResponse['suggestions'] = {};

    if (options.optimizeHashtags !== false && hashtags.length > 0) {
      suggestions.hashtags = optimizeHashtags(hashtags, caption);
    }

    if (!safe && caption.length > 0) {
      suggestions.caption = sanitizeCaption(caption);
    }

    const response: ValidationResponse = {
      safe,
      score: Math.max(0, Math.min(100, score)),
      issues,
      suggestions,
      metrics,
      processingTime: Date.now() - startTime,
    };

    // Track API usage
    if (keyData) {
      await trackUsage(
        keyData.id,
        '/api/v1/validate',
        200,
        response.processingTime,
        request.headers.get('X-Forwarded-For') || request.headers.get('CF-Connecting-IP')
      );
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Processing-Time': `${response.processingTime}ms`,
        'X-RateLimit-Limit': String(rateLimit.limit || 10),
        'X-RateLimit-Remaining': String(rateLimit.remaining || 0),
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function calculateEngagementScore(caption: string, hashtags: string[]): number {
  let score = 50; // Base score

  // Check for call-to-action
  const ctaPatterns = [
    /\b(comment|share|like|follow|tag|save)\b/gi,
    /\b(let me know|thoughts|agree|disagree)\b/gi,
    /\?$/m, // Questions tend to drive engagement
  ];

  for (const pattern of ctaPatterns) {
    if (pattern.test(caption)) {
      score += 10;
      break;
    }
  }

  // Optimal caption length (100-150 characters performs best)
  if (caption.length >= 100 && caption.length <= 150) {
    score += 20;
  } else if (caption.length >= 50 && caption.length <= 200) {
    score += 10;
  }

  // Hashtag optimization
  if (hashtags.length >= 5 && hashtags.length <= 10) {
    score += 15;
  } else if (hashtags.length >= 3 && hashtags.length <= 15) {
    score += 10;
  }

  // Emoji usage (moderate is best)
  const emojiCount = (caption.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]/gu) || []).length;
  if (emojiCount >= 1 && emojiCount <= 3) {
    score += 5;
  }

  return Math.min(100, score);
}

function calculateReadabilityScore(caption: string): number {
  // Simple readability calculation
  const sentences = caption.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = caption.split(/\s+/).filter(w => w.length > 0);
  const avgWordsPerSentence = words.length / Math.max(1, sentences.length);

  // Ideal is 10-15 words per sentence for social media
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 15) {
    return 90;
  } else if (avgWordsPerSentence >= 5 && avgWordsPerSentence <= 20) {
    return 70;
  } else {
    return 50;
  }
}

function calculateHashtagRelevance(caption: string, hashtags: string[]): number {
  if (hashtags.length === 0) return 50;

  const captionWords = caption.toLowerCase().split(/\s+/);
  let relevantCount = 0;

  for (const hashtag of hashtags) {
    const cleanHashtag = hashtag.replace('#', '').toLowerCase();
    if (captionWords.some(word => word.includes(cleanHashtag) || cleanHashtag.includes(word))) {
      relevantCount++;
    }
  }

  return Math.round((relevantCount / hashtags.length) * 100);
}

function optimizeHashtags(hashtags: string[], caption: string): string[] {
  // Remove duplicate hashtags
  const unique = [...new Set(hashtags.map(h => h.toLowerCase()))];

  // Add # if missing
  const formatted = unique.map(h => h.startsWith('#') ? h : `#${h}`);

  // Sort by relevance and popularity (simulated)
  const optimized = formatted.slice(0, 30); // Instagram limit

  // Add trending general hashtags if space available
  const trending = ['#reels', '#instagram', '#viral', '#explore', '#instagood'];
  for (const trend of trending) {
    if (optimized.length < 30 && !optimized.includes(trend)) {
      optimized.push(trend);
    }
  }

  return optimized;
}

function sanitizeCaption(caption: string): string {
  let sanitized = caption;

  // Remove potentially problematic content
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '***');
  }

  // Clean up spam indicators
  for (const indicator of SPAM_INDICATORS) {
    const regex = new RegExp(indicator, 'gi');
    sanitized = sanitized.replace(regex, '');
  }

  // Clean up excessive punctuation
  sanitized = sanitized.replace(/[!]{3,}/g, '!');
  sanitized = sanitized.replace(/[?]{3,}/g, '?');
  sanitized = sanitized.replace(/[.]{4,}/g, '...');

  return sanitized.trim();
}