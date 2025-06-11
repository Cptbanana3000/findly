// server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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

/**
 * NEW FUNCTION: Generates Key Insights based on the analysis.
 * @returns {Array<object>} An array of insight objects.
 */
function generateKeyInsights(scores, domainData, brandName) {
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

  const tldsToCheck = ['.com', '.io', '.ai', '.co', '.org', '.net'];
  const domainsToCheck = tldsToCheck.map(tld => `${brandName}${tld}`);

  try {
    const [domainData, googleData] = await Promise.all([
      getDomainAvailability(domainsToCheck),
      getGoogleResults(brandName)
    ]);

    const scores = {
      domainStrength: calculateDomainStrength(domainData, brandName),
      competitionIntensity: calculateCompetitionIntensity(googleData, brandName),
      seoDifficulty: calculateSeoDifficulty(googleData),
    };

    const overallScore = (scores.domainStrength * 0.4) + (scores.competitionIntensity * 0.4) + (scores.seoDifficulty * 0.2);
    const recommendation = generateRecommendation(overallScore);
    const insights = generateKeyInsights(scores, domainData, brandName); // Generate insights

    const finalResponse = {
      brandName: brandName,
      overallScore: Math.round(overallScore),
      recommendation: recommendation,
      scores: scores,
      keyInsights: insights, // Add insights to the response
      detailedAnalysis: {
        domainAvailability: domainData.map(d => ({ domain: d.domain, isAvailable: d.available })),
        googleCompetition: { topResults: googleData.slice(0, 5).map(item => ({ title: item.title, link: item.link, snippet: item.snippet })) }
      }
    };
    res.send(finalResponse);
  } catch (error) {
    console.error('Error in /analyze-brand route:', error);
    res.status(500).send({ message: 'An error occurred during analysis.' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
