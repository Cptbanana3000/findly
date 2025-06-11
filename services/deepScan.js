// Deep Scan Service - Web Scraping + AI Analysis
const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');

class DeepScanService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Main Deep Scan function
  async performDeepScan(competitorUrl, userBrandName) {
    try {
      console.log(`🔍 Starting Deep Scan for: ${competitorUrl}`);
      
      // Step 1: Scrape competitor website
      const scrapedData = await this.scrapeWebsite(competitorUrl);
      
      // Step 2: Analyze with AI
      const analysis = await this.generateAIAnalysis(scrapedData, userBrandName, competitorUrl);
      
      return {
        success: true,
        competitorUrl: competitorUrl,
        scrapedData: scrapedData,
        analysis: analysis,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Deep Scan error:', error.message);
      return {
        success: false,
        error: error.message,
        competitorUrl: competitorUrl
      };
    }
  }

  // Web scraping function with ethical practices
  async scrapeWebsite(url) {
    try {
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      console.log(`📡 Scraping: ${url}`);

      // Make request with proper headers
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'VeritoLabBot/1.0 (+https://veritolab.com/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000, // 10 second timeout
        maxRedirects: 5
      });

      // Parse HTML with Cheerio
      const $ = cheerio.load(response.data);

      // Extract key data points
      const scrapedData = {
        url: url,
        title: $('title').text().trim() || 'No title found',
        metaDescription: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || 'No meta description found',
        h1: $('h1').first().text().trim() || 'No H1 found',
        h2Count: $('h2').length,
        h3Count: $('h3').length,
        wordCount: this.estimateWordCount($('body').text()),
        internalLinks: this.countInternalLinks($, url),
        externalLinks: this.countExternalLinks($, url),
        hasSSL: url.startsWith('https://'),
        images: $('img').length,
        imagesWithAlt: $('img[alt]').length,
        socialLinks: this.findSocialLinks($),
        metaKeywords: $('meta[name="keywords"]').attr('content') || null,
        schemaMarkup: $('script[type="application/ld+json"]').length > 0,
        canonicalUrl: $('link[rel="canonical"]').attr('href') || null,
        metaRobots: $('meta[name="robots"]').attr('content') || null
      };

      console.log('✅ Scraping completed successfully');
      console.log(`📊 Data extracted: ${scrapedData.wordCount} words, ${scrapedData.internalLinks} internal links`);

      return scrapedData;

    } catch (error) {
      console.error('Scraping error:', error.message);
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }

  // AI Analysis using your prompt engineering strategy
  async generateAIAnalysis(scrapedData, userBrandName, competitorUrl) {
    try {
      console.log('🧠 Generating AI analysis...');

      const domain = new URL(competitorUrl).hostname;
      
      const prompt = `You are an expert-level SEO and Digital Marketing Strategist. Your name is "Aura," and you provide brutally honest, data-driven competitive analysis.

Your primary task is to generate a "DEEP SCAN ANALYSIS" report. You will analyze a competitor's scraped data to identify their strategy, threats, and opportunities for a user's brand. You must then formulate a recommended counter-strategy.

Your analysis must be sharp, insightful, and presented in the exact format specified below.

IMPORTANT: Your final output MUST follow this exact format, including all emojis and structure. Do not add any extra conversation or introductory text.

**User's Brand Name:** "${userBrandName}"
**Competitor's Domain:** "${domain}"

**Competitor's Scraped Data:**
\`\`\`json
${JSON.stringify(scrapedData, null, 2)}
\`\`\`

Generate the DEEP SCAN ANALYSIS report in this exact format:

DEEP SCAN ANALYSIS: ${domain}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 THREAT LEVEL: [RATING] ([SCORE]/100)
🎯 THEIR STRATEGY: [One concise sentence describing their main strategy]
⚡ KEYWORD FOCUS: "[keyword1]", "[keyword2]", "[keyword3]"

🚨 COMPETITIVE THREATS:
• [Threat based on their strengths from the data]
• [Threat based on their technical SEO]
• [Threat based on their content/authority]
• [Threat based on their market position]

💡 OPPORTUNITIES FOR "${userBrandName}":
• [Gap they're not addressing that you can own]
• [Keyword opportunity they're missing]
• [Market positioning opportunity]
• [Technical or content opportunity]

🎯 RECOMMENDED STRATEGY:
• [Specific actionable recommendation]
• [Content/SEO recommendation]
• [Positioning recommendation]
• [Technical recommendation]`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Aura, an expert SEO and digital marketing strategist. Provide brutally honest, data-driven competitive analysis in the exact format requested."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const analysis = completion.choices[0].message.content.trim();
      console.log('✅ AI analysis completed');

      return analysis;

    } catch (error) {
      console.error('AI Analysis error:', error.message);
      throw new Error(`Failed to generate AI analysis: ${error.message}`);
    }
  }

  // Helper functions
  estimateWordCount(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  countInternalLinks($, baseUrl) {
    const domain = new URL(baseUrl).hostname;
    let count = 0;
    
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && (href.startsWith('/') || href.includes(domain))) {
        count++;
      }
    });
    
    return count;
  }

  countExternalLinks($, baseUrl) {
    const domain = new URL(baseUrl).hostname;
    let count = 0;
    
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.startsWith('http') && !href.includes(domain)) {
        count++;
      }
    });
    
    return count;
  }

  findSocialLinks($) {
    const socialPlatforms = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'tiktok.com'];
    let count = 0;
    
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && socialPlatforms.some(platform => href.includes(platform))) {
        count++;
      }
    });
    
    return count;
  }
}

module.exports = new DeepScanService(); 