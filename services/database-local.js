// Local storage backup database service (no Firebase needed)
const fs = require('fs').promises;
const path = require('path');

class LocalDatabaseService {
  constructor() {
    this.analysisFile = path.join(__dirname, '../data/brand_analyses.json');
    this.analyticsFile = path.join(__dirname, '../data/usage_analytics.json');
    this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.ensureDataDirectory();
  }

  async ensureDataDirectory() {
    try {
      await fs.mkdir(path.join(__dirname, '../data'), { recursive: true });
    } catch (error) {
      // Directory already exists, ignore
    }
  }

  // Generate cache key for brand analysis
  generateCacheKey(brandName) {
    return brandName.toLowerCase().trim();
  }

  // Load data from file
  async loadData(filename) {
    try {
      const data = await fs.readFile(filename, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  // Save data to file
  async saveData(filename, data) {
    try {
      await fs.writeFile(filename, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  // Check if cached result exists and is still valid
  async getCachedAnalysis(brandName) {
    try {
      const cacheKey = this.generateCacheKey(brandName);
      const analyses = await this.loadData(this.analysisFile);
      
      if (analyses[cacheKey]) {
        const data = analyses[cacheKey];
        const now = Date.now();
        const cacheTime = new Date(data.timestamp).getTime();

        // Check if cache is still valid (within 7 days)
        if (now - cacheTime < this.cacheExpiry) {
          console.log(`Cache hit for brand: ${brandName}`);
          
          // Update hit count for analytics
          await this.updateAnalytics('cache_hit', brandName);
          
          return {
            ...data.analysis,
            cached: true,
            cacheTime: data.timestamp
          };
        } else {
          console.log(`Cache expired for brand: ${brandName}`);
        }
      } else {
        console.log(`No cache found for brand: ${brandName}`);
      }

      return null;
    } catch (error) {
      console.error('Error getting cached analysis:', error);
      return null;
    }
  }

  // Store analysis result in cache
  async cacheAnalysis(brandName, analysisResult) {
    try {
      const cacheKey = this.generateCacheKey(brandName);
      const analyses = await this.loadData(this.analysisFile);

      const cacheData = {
        brandName: brandName,
        analysis: analysisResult,
        timestamp: new Date().toISOString(),
        hitCount: analyses[cacheKey] ? analyses[cacheKey].hitCount + 1 : 1
      };

      analyses[cacheKey] = cacheData;
      await this.saveData(this.analysisFile, analyses);
      
      console.log(`Cached analysis for brand: ${brandName}`);
      await this.updateAnalytics('analysis_cached', brandName);

      return true;
    } catch (error) {
      console.error('Error caching analysis:', error);
      return false;
    }
  }

  // Update usage analytics
  async updateAnalytics(action, brandName = null, additionalData = {}) {
    try {
      const analytics = await this.loadData(this.analyticsFile);
      const analyticsArray = analytics.events || [];

      const analyticsData = {
        id: Date.now() + Math.random(),
        action: action,
        brandName: brandName,
        timestamp: new Date().toISOString(),
        ...additionalData
      };

      analyticsArray.push(analyticsData);
      analytics.events = analyticsArray;
      
      await this.saveData(this.analyticsFile, analytics);
      console.log(`Analytics tracked: ${action} for ${brandName || 'system'}`);

      return true;
    } catch (error) {
      console.error('Error updating analytics:', error);
      return false;
    }
  }

  // Get popular brand searches
  async getPopularBrands(limitCount = 10) {
    try {
      const analyses = await this.loadData(this.analysisFile);
      const popularBrands = [];

      Object.values(analyses).forEach((data) => {
        popularBrands.push({
          brandName: data.brandName,
          hitCount: data.hitCount,
          lastAccessed: data.timestamp
        });
      });

      return popularBrands
        .sort((a, b) => b.hitCount - a.hitCount)
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting popular brands:', error);
      return [];
    }
  }

  // Get usage statistics
  async getUsageStats() {
    try {
      const analytics = await this.loadData(this.analyticsFile);
      const events = analytics.events || [];
      
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const recentEvents = events.filter(event => 
        new Date(event.timestamp) >= last24Hours
      );

      const stats = {
        totalAnalyses: 0,
        cacheHits: 0,
        newAnalyses: 0,
        uniqueBrands: new Set()
      };

      recentEvents.forEach((event) => {
        if (event.action === 'cache_hit') {
          stats.cacheHits++;
        } else if (event.action === 'analysis_cached') {
          stats.newAnalyses++;
        }
        
        if (event.brandName) {
          stats.uniqueBrands.add(event.brandName);
        }
      });

      stats.totalAnalyses = stats.cacheHits + stats.newAnalyses;
      stats.uniqueBrands = stats.uniqueBrands.size;

      return stats;
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        totalAnalyses: 0,
        cacheHits: 0,
        newAnalyses: 0,
        uniqueBrands: 0
      };
    }
  }

  // Update hit count for existing cached analysis
  async updateHitCount(brandName) {
    try {
      const cacheKey = this.generateCacheKey(brandName);
      const analyses = await this.loadData(this.analysisFile);
      
      if (analyses[cacheKey]) {
        analyses[cacheKey].hitCount = (analyses[cacheKey].hitCount || 0) + 1;
        analyses[cacheKey].lastAccessed = new Date().toISOString();
        await this.saveData(this.analysisFile, analyses);
      }

      return true;
    } catch (error) {
      console.error('Error updating hit count:', error);
      return false;
    }
  }
}

module.exports = new LocalDatabaseService(); 