const { db } = require('../config/firebase');
const { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  increment 
} = require('firebase/firestore');

class DatabaseService {
  constructor() {
    this.analysisCollection = 'brand_analyses';
    this.analyticsCollection = 'usage_analytics';
    this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  }

  // Generate cache key for brand analysis
  generateCacheKey(brandName) {
    return brandName.toLowerCase().trim();
  }

  // Check if cached result exists and is still valid
  async getCachedAnalysis(brandName) {
    try {
      const cacheKey = this.generateCacheKey(brandName);
      const docRef = doc(db, this.analysisCollection, cacheKey);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const now = Date.now();
        const cacheTime = data.timestamp?.toMillis() || 0;

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
      const docRef = doc(db, this.analysisCollection, cacheKey);

      const cacheData = {
        brandName: brandName,
        analysis: analysisResult,
        timestamp: serverTimestamp(),
        hitCount: 1
      };

      await setDoc(docRef, cacheData);
      console.log(`Cached analysis for brand: ${brandName}`);

      // Track cache store for analytics
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
      const analyticsData = {
        action: action,
        brandName: brandName,
        timestamp: serverTimestamp(),
        ...additionalData
      };

      await addDoc(collection(db, this.analyticsCollection), analyticsData);
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
      const q = query(
        collection(db, this.analysisCollection),
        orderBy('hitCount', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const popularBrands = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        popularBrands.push({
          brandName: data.brandName,
          hitCount: data.hitCount,
          lastAccessed: data.timestamp
        });
      });

      return popularBrands;
    } catch (error) {
      console.error('Error getting popular brands:', error);
      return [];
    }
  }

  // Get usage statistics
  async getUsageStats() {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const q = query(
        collection(db, this.analyticsCollection),
        where('timestamp', '>=', last24Hours),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const stats = {
        totalAnalyses: 0,
        cacheHits: 0,
        newAnalyses: 0,
        uniqueBrands: new Set()
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.action === 'cache_hit') {
          stats.cacheHits++;
        } else if (data.action === 'analysis_cached') {
          stats.newAnalyses++;
        }
        
        if (data.brandName) {
          stats.uniqueBrands.add(data.brandName);
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
      const docRef = doc(db, this.analysisCollection, cacheKey);
      
      await setDoc(docRef, {
        hitCount: increment(1),
        lastAccessed: serverTimestamp()
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error updating hit count:', error);
      return false;
    }
  }
}

module.exports = new DatabaseService(); 