// server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database service (switched back to Firebase with fixed config)
const databaseService = require('./services/database');

// Import Deep Scan service for premium competitor analysis
const deepScanService = require('./services/deepScan');

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware & Static Files ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API Keys & Config ---
const GODADDY_API_KEY = process.env.GODADDY_API_KEY;
const GODADDY_API_SECRET = process.env.GODADDY_API_SECRET;
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_CX = process.env.GOOGLE_SEARCH_CX;
const GODADDY_BASE_URL = process.env.GODADDY_ENV === 'PRODUCTION' ? 'https://api.godaddy.com' : 'https://api.ote-godaddy.com';

// =================================================================
//  API HELPER FUNCTIONS
// =================================================================

async function checkSocialMediaHandles(brandName) {
  console.log(`Checking social media handles for: ${brandName}`);
  
  const platforms = [
    { name: 'Instagram', url: `https://www.instagram.com/${brandName}/`, icon: 'fab fa-instagram' },
    { name: 'Twitter', url: `https://twitter.com/${brandName}`, icon: 'fab fa-twitter' },
    { name: 'TikTok', url: `https://www.tiktok.com/@${brandName}`, icon: 'fab fa-tiktok' },
    { name: 'LinkedIn', url: `https://www.linkedin.com/in/${brandName}`, icon: 'fab fa-linkedin' },
    { name: 'YouTube', url: `https://www.youtube.com/@${brandName}`, icon: 'fab fa-youtube' }
  ];

  const results = [];
  
  // For now, let's simulate the social media checking with a more reliable approach
  // In a production environment, you'd want to use official APIs or specialized services
  for (const platform of platforms) {
    try {
      // For demo purposes, let's create mock data based on common patterns
      // In reality, you'd need to use official APIs or specialized services
      const isAvailable = await simulateSocialMediaCheck(platform.name, brandName);
      
      results.push({
        platform: platform.name,
        handle: `@${brandName}`,
        url: platform.url,
        available: isAvailable,
        status: isAvailable ? 404 : 200,
        icon: platform.icon
      });
      
      console.log(`${platform.name}: ${isAvailable ? 'Available' : 'Taken'}`);
    } catch (error) {
      console.error(`Error checking ${platform.name}:`, error.message);
      
      // Default to unavailable if we can't check
      results.push({
        platform: platform.name,
        handle: `@${brandName}`,
        url: platform.url,
        available: false,
        status: 'Error',
        icon: platform.icon,
        error: true
      });
    }
  }
  
  console.log('Social media results:', results);
  return results;
}

// Simulate social media checking with reasonable logic
async function simulateSocialMediaCheck(platform, brandName) {
  // For well-known brands, they're likely taken on major platforms
  const wellKnownBrands = ['netflix', 'google', 'apple', 'microsoft', 'amazon', 'facebook', 'twitter'];
  const isWellKnown = wellKnownBrands.includes(brandName.toLowerCase());
  
  if (isWellKnown) {
    return false; // Taken
  }
  
  // For other brands, simulate availability based on length and platform
  const nameLength = brandName.length;
  
  // Shorter names are more likely to be taken
  if (nameLength <= 4) {
    return Math.random() > 0.8; // 20% chance available
  } else if (nameLength <= 6) {
    return Math.random() > 0.6; // 40% chance available  
  } else if (nameLength <= 8) {
    return Math.random() > 0.4; // 60% chance available
  } else {
    return Math.random() > 0.2; // 80% chance available
  }
}

async function getDomainAvailability(domains) {
  const results = [];
  for (const domain of domains) {
    try {
      const url = `${GODADDY_BASE_URL}/v1/domains/available?domain=${domain}`;
      const response = await axios.get(url, { headers: { 'Authorization': `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}` } });
      results.push(response.data);
    } catch (error) {
      console.error(`Failed to check domain ${domain}:`, error.response?.data || error.message);
      results.push({ domain, available: false, error: true });
    }
  }
  return results;
}

async function getGoogleResults(keyword) {
    if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_CX) return [];
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_CX}&q="${keyword}"`;
    try {
        const response = await axios.get(url);
        return response.data.items || [];
    } catch(error) {
        console.error('Google API Error:', error.response?.data?.error?.message || error.message);
        return [];
    }
}

// =================================================================
//  ANALYSIS & SCORING LOGIC
// =================================================================
function calculateDomainStrength(domainData, brandName) {
    const comDomain = domainData.find(d => d.domain === `${brandName}.com`);
    if (!comDomain || comDomain.error) return 10;
    if (comDomain.available) return 100;
    const hasGoodAlternatives = domainData.some(d => ['.io', '.ai', '.co'].includes(d.domain.replace(brandName, '')) && d.available);
    if (hasGoodAlternatives) return 40;
    return 10;
}

function calculateCompetitionIntensity(googleResults, brandName) {
    if (googleResults.length === 0) return 100;
    const topResults = googleResults.slice(0, 5);
    const informationalDomains = ['wikipedia.org', 'wiktionary.org', 'forbes.com', 'nytimes.com', '.gov', '.edu'];
    const directCompetitors = topResults.filter(r => {
        const domain = new URL(r.link).hostname.replace('www.', '');
        return !informationalDomains.some(d => domain.includes(d)) && domain.includes(brandName);
    });
    if (directCompetitors.length > 0) return 20;
    return googleResults.length > 3 ? 80 : 100;
}

function calculateSeoDifficulty(googleResults) {
    if (googleResults.length === 0) return 100;
    const authorityDomains = {
        'very-high': ['wikipedia.org', 'forbes.com', '.gov', '.edu', 'github.com', 'amazon.com'],
        'high': ['techcrunch.com', 'medium.com', 'reddit.com']
    };
    const hasVeryHighAuthority = googleResults.slice(0, 3).some(r => authorityDomains['very-high'].some(d => r.link.includes(d)));
    const hasHighAuthority = googleResults.slice(0, 3).some(r => authorityDomains['high'].some(d => r.link.includes(d)));
    if (hasVeryHighAuthority) return 0;
    if (hasHighAuthority) return 20;
    return googleResults.length < 3 ? 100 : 60;
}

function calculateSocialMediaScore(socialResults) {
    console.log('Calculating social media score for:', socialResults);
    
    if (!socialResults || socialResults.length === 0) {
        console.log('No social results, returning default score of 50');
        return 50;
    }
    
    const availableCount = socialResults.filter(result => result.available && !result.error).length;
    const totalPlatforms = socialResults.length;
    
    console.log(`Available handles: ${availableCount}/${totalPlatforms}`);
    
    // Weight major platforms more heavily
    const platformWeights = {
        'Instagram': 25,
        'Twitter': 25,
        'TikTok': 20,
        'LinkedIn': 15,
        'YouTube': 15
    };
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    socialResults.forEach(result => {
        const weight = platformWeights[result.platform] || 10;
        totalWeight += weight;
        if (result.available && !result.error) {
            weightedScore += weight;
        }
        console.log(`${result.platform}: available=${result.available}, weight=${weight}`);
    });
    
    const finalScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 50;
    console.log(`Social media score: ${finalScore} (weighted: ${weightedScore}/${totalWeight})`);
    return finalScore;
}

/**
 * NEW FUNCTION: Generates Key Insights based on the analysis.
 * @returns {Array<object>} An array of insight objects.
 */
function generateKeyInsights(scores, domainData, brandName, socialData) {
    const insights = [];
    const comDomain = domainData.find(d => d.domain === `${brandName}.com`);

    // Domain Insights
    if (scores.domainStrength === 100) {
        insights.push({ title: "Domain Available", points: "+40pts", description: "Primary .com domain is ready to register.", type: "positive" });
    } else if (scores.domainStrength > 30) {
        insights.push({ title: "Alternatives Found", points: "+15pts", description: "Good alternatives like .io or .ai are available.", type: "positive" });
    } else {
        insights.push({ title: "Domain Risk", points: "-25pts", description: "The .com and top alternatives are unavailable.", type: "negative" });
    }

    // Social Media Insights
    if (scores.socialMediaAvailability > 80) {
        insights.push({ title: "Social Gold Mine", points: "+25pts", description: "Most major social media handles are available.", type: "positive" });
    } else if (scores.socialMediaAvailability > 50) {
        insights.push({ title: "Mixed Social Availability", points: "+10pts", description: "Some key social platforms available.", type: "positive" });
    } else {
        insights.push({ title: "Social Challenges", points: "-20pts", description: "Limited social media handle availability.", type: "negative" });
    }

    // Competition & SEO Insights
    if (scores.competitionIntensity > 90) {
        insights.push({ title: "Low Competition", points: "+30pts", description: "No direct commercial competitors identified.", type: "positive" });
    } else if (scores.competitionIntensity < 30) {
        insights.push({ title: "Risk Alert", points: "-30pts", description: "Direct competitors dominate search results.", type: "negative" });
    }
    
    if (scores.seoDifficulty > 90) {
        insights.push({ title: "SEO Opportunity", points: "+20pts", description: "The search landscape is open to rank for this name.", type: "positive" });
    } else if (scores.seoDifficulty < 30) {
        insights.push({ title: "High SEO Difficulty", points: "-20pts", description: "Ranking will be difficult against authoritative sites.", type: "negative" });
    }

    return insights;
}

function generateRecommendation(overallScore) {
  if (overallScore > 80) return "Excellent Prospect. A clear path to ownership and market leadership.";
  if (overallScore > 60) return "Strong Contender. This name is viable but requires a clear strategy.";
  if (overallScore > 40) return "Challenging. Significant hurdles exist. Proceed with caution.";
  return "Not Recommended. This name poses major branding challenges.";
}


// =================================================================
//  MAIN API ROUTE
// =================================================================

app.get('/analyze-brand', async (req, res) => {
  const brandName = req.query.brandName?.toLowerCase().trim();
  if (!brandName) return res.status(400).send({ message: 'brandName parameter is required' });

  try {
    console.log(`Starting analysis for brand: ${brandName}`);
    
    // Check cache first
    const cachedResult = await databaseService.getCachedAnalysis(brandName);
    if (cachedResult) {
      console.log(`Returning cached result for: ${brandName}`);
      // Update hit count
      await databaseService.updateHitCount(brandName);
      return res.send(cachedResult);
    }

    // If not cached, perform fresh analysis
    console.log(`Performing fresh analysis for: ${brandName}`);
    await databaseService.updateAnalytics('fresh_analysis_started', brandName);

    const tldsToCheck = ['.com', '.io', '.ai', '.co', '.org', '.net'];
    const domainsToCheck = tldsToCheck.map(tld => `${brandName}${tld}`);
    
    const [domainData, googleData, socialData] = await Promise.all([
      getDomainAvailability(domainsToCheck),
      getGoogleResults(brandName),
      checkSocialMediaHandles(brandName)
    ]);

    console.log('Raw data received:', {
      domains: domainData.length,
      google: googleData.length,
      social: socialData.length
    });

    const scores = {
      domainStrength: calculateDomainStrength(domainData, brandName),
      competitionIntensity: calculateCompetitionIntensity(googleData, brandName),
      seoDifficulty: calculateSeoDifficulty(googleData),
      socialMediaAvailability: calculateSocialMediaScore(socialData)
    };

    console.log('Calculated scores:', scores);

    const overallScore = (scores.domainStrength * 0.3) + (scores.competitionIntensity * 0.3) + (scores.seoDifficulty * 0.2) + (scores.socialMediaAvailability * 0.2);
    const recommendation = generateRecommendation(overallScore);
    const insights = generateKeyInsights(scores, domainData, brandName, socialData);

    const finalResponse = {
      brandName: brandName,
      overallScore: Math.round(overallScore),
      recommendation: recommendation,
      scores: scores,
      keyInsights: insights,
      detailedAnalysis: {
        domainAvailability: domainData.map(d => ({ domain: d.domain, isAvailable: d.available })),
        socialMediaAvailability: socialData,
        googleCompetition: { topResults: googleData.slice(0, 5).map(item => ({ title: item.title, link: item.link, snippet: item.snippet })) }
      },
      cached: false,
      analysisTime: new Date().toISOString()
    };

    // Cache the result for future requests
    await databaseService.cacheAnalysis(brandName, finalResponse);
    await databaseService.updateAnalytics('fresh_analysis_completed', brandName, {
      overallScore: finalResponse.overallScore,
      hasErrors: false
    });

    res.send(finalResponse);
  } catch (error) {
    console.error('Error in /analyze-brand route:', error);
    
    // Track error analytics
    await databaseService.updateAnalytics('analysis_error', brandName, {
      error: error.message
    });
    
    res.status(500).send({ message: 'An error occurred during analysis.' });
  }
});

// Analytics endpoint (for internal use)
app.get('/analytics', async (req, res) => {
  try {
    const [usageStats, popularBrands] = await Promise.all([
      databaseService.getUsageStats(),
      databaseService.getPopularBrands(10)
    ]);

    res.json({
      usage: usageStats,
      popularBrands: popularBrands,
      cacheEfficiency: usageStats.totalAnalyses > 0 
        ? Math.round((usageStats.cacheHits / usageStats.totalAnalyses) * 100) 
        : 0
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ message: 'Error retrieving analytics' });
  }
});

// Deep Scan endpoint (Premium feature)
app.post('/deep-scan', async (req, res) => {
  try {
    const { brandName } = req.body;
    
    if (!brandName) {
      return res.status(400).json({ 
        message: 'Missing required parameter: brandName' 
      });
    }

    console.log(`🔍 Deep Scan requested for brand: ${brandName}`);
    
    // Track deep scan analytics
    await databaseService.updateAnalytics('deep_scan_started', brandName);

    // Get competitor URLs from Google search results
    const googleResults = await getGoogleResults(brandName);
    const competitorUrls = googleResults.slice(0, 5).map(result => result.link);
    
    if (competitorUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No competitors found for analysis'
      });
    }

    // Perform deep scan with AI analysis on multiple competitors
    const result = await deepScanService.performMultipleDeepScan(competitorUrls, brandName);

    if (result.success) {
      // Track successful deep scan
      await databaseService.updateAnalytics('deep_scan_completed', brandName, {
        competitorsAnalyzed: result.data.competitors?.length || 0,
        totalDataPoints: result.data.totalDataPoints || 0,
        aiAnalysesGenerated: result.data.aiAnalyses?.length || 0
      });

      res.json({
        success: true,
        data: {
          brandName: brandName,
          competitors: result.data.competitors,
          aiAnalyses: result.data.aiAnalyses, // Multiple AI analyses
          totalDataPoints: result.data.totalDataPoints,
          timestamp: result.data.timestamp
        }
      });
    } else {
      // Track failed deep scan
      await databaseService.updateAnalytics('deep_scan_failed', brandName, {
        error: result.error
      });

      res.status(500).json({
        success: false,
        error: result.error || 'Deep scan failed'
      });
    }

  } catch (error) {
    console.error('Deep Scan endpoint error:', error);
    
    // Track error
    await databaseService.updateAnalytics('deep_scan_error', req.body.brandName || 'unknown', {
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      message: 'An error occurred during deep scan analysis' 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('🔥 Firebase Firestore integration active (config fixed!)');
  console.log('📊 Analytics and caching enabled');
});
