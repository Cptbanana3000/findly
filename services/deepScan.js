// Deep Scan Service - Advanced Web Analysis + AI Intelligence
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
      
      // Step 1: Analyze competitor website
      const analyzedData = await this.analyzeWebsite(competitorUrl);
      
      // Step 2: Generate AI intelligence report
      const analysis = await this.generateAIAnalysis(analyzedData, userBrandName, competitorUrl);
      
      return {
        success: true,
        competitorUrl: competitorUrl,
        analyzedData: analyzedData,
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

  // Website analysis function with professional data extraction
  async analyzeWebsite(url) {
    try {
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      console.log(`📡 Analyzing: ${url}`);

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

      // Get the final URL after redirects (the actual URL that was reached)
      const finalUrl = response.request.res?.responseUrl || response.config.url || url;

      // Extract key data points (17 comprehensive metrics)
      const analyzedData = {
        url: finalUrl,
        title: $('title').text().trim() || 'No title found',
        metaDescription: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || 'No meta description found',
        h1: $('h1').first().text().trim() || 'No H1 found',
        h2Count: $('h2').length,
        h3Count: $('h3').length,
        wordCount: this.estimateWordCount($('body').text()),
        internalLinks: this.countInternalLinks($, finalUrl),
        externalLinks: this.countExternalLinks($, finalUrl),
        hasSSL: finalUrl.startsWith('https://'),
        images: $('img').length,
        imagesWithAlt: $('img[alt]').length,
        socialLinks: this.findSocialLinks($),
        metaKeywords: $('meta[name="keywords"]').attr('content') || null,
        schemaMarkup: $('script[type="application/ld+json"]').length > 0,
        canonicalUrl: $('link[rel="canonical"]').attr('href') || null,
        metaRobots: $('meta[name="robots"]').attr('content') || null
      };

      console.log('✅ Website analysis completed successfully');
      console.log(`📊 Data extracted: ${analyzedData.wordCount} words, ${analyzedData.internalLinks} internal links`);

      return analyzedData;

    } catch (error) {
      console.error('Website analysis error:', error.message);
      throw new Error(`Failed to analyze ${url}: ${error.message}`);
    }
  }

  // AI Analysis using advanced prompt engineering strategy
  async generateAIAnalysis(analyzedData, userBrandName, competitorUrl) {
    try {
      console.log('🧠 Generating AI analysis...');

      const domain = new URL(competitorUrl).hostname;
      
      const prompt = `You are an expert-level SEO and Digital Marketing Strategist. Your name is "Aura," and you provide brutally honest, data-driven competitive analysis.

Your primary task is to generate a "DEEP SCAN ANALYSIS" report. You will analyze a competitor's scraped data to identify their strategy, threats, and opportunities for a user's brand. You must then formulate a recommended counter-strategy.

Your analysis must be sharp, insightful, and presented in the exact format specified below.

IMPORTANT: Your final output MUST follow this exact format, including all emojis and structure. Do not add any extra conversation or introductory text.

**User's Brand Name:** "${userBrandName}"
**Competitor's Domain:** "${domain}"

**Competitor's Analyzed Data (17 Key Metrics):**
\`\`\`json
${JSON.stringify(analyzedData, null, 2)}
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

  // Function to perform deep scan on multiple competitors
  async performMultipleDeepScan(competitorUrls, brandName) {
    console.log(`🚀 Starting multi-competitor deep scan for: ${brandName}`);
    console.log(`📊 Analyzing ${competitorUrls.length} competitors:`, competitorUrls);
    
    try {
      const results = [];
      let totalDataPoints = 0;
      
      // Analyze each competitor (process all available URLs for comprehensive analysis)
      const urlsToProcess = competitorUrls.slice(0, 5); // Analyze up to 5 competitors
      
      for (let i = 0; i < urlsToProcess.length; i++) {
        const url = urlsToProcess[i];
        console.log(`🔍 Analyzing competitor ${i + 1}/${urlsToProcess.length}: ${url}`);
        
        try {
          const analyzedData = await this.analyzeWebsite(url);
          if (analyzedData) {
            results.push(analyzedData);
            // Count data points (17 metrics per competitor)
            totalDataPoints += Object.keys(analyzedData).length;
          }
        } catch (error) {
          console.error(`❌ Failed to analyze ${url}:`, error.message);
          // Continue with other competitors even if one fails
        }
      }
      
      if (results.length === 0) {
        return {
          success: false,
          error: 'No competitor data could be analyzed'
        };
      }
      
      console.log(`✅ Successfully analyzed ${results.length} competitors`);
      
      // Generate AI analysis for the best competitor (highest word count)
      const bestCompetitor = results.reduce((best, current) => 
        current.wordCount > best.wordCount ? current : best
      );
      
      console.log('🤖 Generating AI analysis for best competitor...');
      const aiAnalysis = await this.generateAIAnalysis(bestCompetitor, brandName, bestCompetitor.url);
      
      return {
        success: true,
        data: {
          brandName: brandName,
          competitors: results,
          aiAnalysis: aiAnalysis,
          totalDataPoints: totalDataPoints,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Multi-competitor deep scan failed:', error);
      return {
        success: false,
        error: error.message || 'Multi-competitor deep scan failed'
      };
    }
  }
}

module.exports = new DeepScanService(); 