export interface RSSFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category?: string;
}

export interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: string;
  enabled: boolean;
  lastFetched?: number;
}

export interface RSSCache {
  [feedId: string]: {
    items: RSSFeedItem[];
    lastUpdated: number;
  };
}

// Predefined popular RSS feeds (simplified for demo)
export const DEFAULT_RSS_FEEDS: RSSFeed[] = [
  {
    id: 'demo-feed',
    name: 'Demo News',
    url: 'https://feeds.bbci.co.uk/news/rss.xml',
    category: 'News',
    enabled: true,
  },
];

class RSSService {
  private cache: RSSCache = {};
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  
  // Multiple proxy options for better reliability
  private readonly RSS_PROXIES = [
    'https://api.allorigins.win/get?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://thingproxy.freeboard.io/fetch/',
  ];

  /**
   * Fetch and parse RSS feed with fallback proxies
   */
  async fetchFeed(feed: RSSFeed): Promise<RSSFeedItem[]> {
    try {
      // Check cache first
      const cached = this.cache[feed.id];
      if (cached && Date.now() - cached.lastUpdated < this.CACHE_DURATION) {
        console.log(`📦 Using cached data for ${feed.name}`);
        return cached.items;
      }

      console.log(`🔄 Fetching RSS feed: ${feed.name}`);
      
      // Try multiple proxies
      for (let i = 0; i < this.RSS_PROXIES.length; i++) {
        try {
          const items = await this.tryFetchWithProxy(feed, i);
          if (items.length > 0) {
            // Update cache
            this.cache[feed.id] = {
              items,
              lastUpdated: Date.now(),
            };
            console.log(`✅ Successfully fetched ${items.length} items from ${feed.name}`);
            return items;
          }
        } catch (proxyError) {
          const errorMsg = proxyError instanceof Error ? proxyError.message : 'Unknown error';
          console.warn(`❌ Proxy ${i + 1} failed for ${feed.name}:`, errorMsg);
          // Continue to next proxy
        }
      }

      throw new Error('All proxies failed');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`❌ Failed to fetch RSS feed ${feed.name}:`, errorMsg);
      
      // Return cached items if available
      const cached = this.cache[feed.id];
      if (cached) {
        console.log(`📦 Falling back to cached data for ${feed.name}`);
        return cached.items;
      }
      
      // Return mock data as fallback to always show something
      console.log(`🎭 Using mock data for ${feed.name} (all sources failed)`);
      return this.getMockRSSItems(feed);
    }
  }

  /**
   * Try fetching with a specific proxy
   */
  private async tryFetchWithProxy(feed: RSSFeed, proxyIndex: number): Promise<RSSFeedItem[]> {
    const proxy = this.RSS_PROXIES[proxyIndex];
    let proxyUrl: string;

    // Different proxy formats and handling
    if (proxy.includes('allorigins')) {
      proxyUrl = `${proxy}${encodeURIComponent(feed.url)}`;
    } else if (proxy.includes('cors-anywhere')) {
      proxyUrl = `${proxy}${feed.url}`;
    } else if (proxy.includes('codetabs')) {
      proxyUrl = `${proxy}${encodeURIComponent(feed.url)}`;
    } else if (proxy.includes('thingproxy')) {
      proxyUrl = `${proxy}${encodeURIComponent(feed.url)}`;
    } else {
      proxyUrl = `${proxy}${encodeURIComponent(feed.url)}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      console.log(`🌐 Trying proxy ${proxyIndex + 1}: ${proxy.split('/')[2]}`);
      
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'X-Requested-With': 'XMLHttpRequest',
        },
        method: 'GET',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let xmlText: string;

      // Handle different proxy response formats
      try {
        if (proxy.includes('allorigins')) {
          const data = await response.json();
          if (data.status && data.status.http_code !== 200) {
            throw new Error(`Proxy returned HTTP ${data.status.http_code}`);
          }
          xmlText = data.contents;
        } else {
          xmlText = await response.text();
        }
      } catch (parseError) {
        throw new Error(`Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      if (!xmlText || xmlText.length === 0) {
        throw new Error('Empty response from proxy');
      }

      if (xmlText.includes('404') || xmlText.includes('Not Found')) {
        throw new Error('RSS feed not found (404)');
      }

      const items = this.parseRSSContent(xmlText, feed);
      if (items.length === 0) {
        throw new Error('No valid RSS items parsed');
      }

      return items;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`❌ Proxy ${proxyIndex + 1} (${proxy.split('/')[2]}) failed: ${errorMsg}`);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse RSS content (works in both React Native and Web)
   */
  private parseRSSContent(xmlText: string, feed: RSSFeed): RSSFeedItem[] {
    try {
      // Simple regex-based parsing that works everywhere
      const items: RSSFeedItem[] = [];
      
      // Extract items using regex (more reliable than DOMParser in RN)
      const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
      
      itemMatches.forEach((itemXml, index) => {
        try {
          const title = this.extractTag(itemXml, 'title') || 'Untitled';
          const description = this.extractTag(itemXml, 'description') || '';
          const link = this.extractTag(itemXml, 'link') || '';
          const pubDate = this.extractTag(itemXml, 'pubDate') || new Date().toISOString();
          const category = this.extractTag(itemXml, 'category') || feed.category;

          const id = `${feed.id}-${index}-${Date.now()}`;

          items.push({
            id,
            title: this.cleanText(title),
            description: this.cleanText(description).substring(0, 200), // Limit description
            link,
            pubDate,
            source: feed.name,
            category,
          });
        } catch (error) {
          console.warn('Failed to parse RSS item:', error);
        }
      });

      return items.slice(0, 10); // Limit to 10 items per feed
    } catch (error) {
      console.warn('Failed to parse RSS XML:', error);
      return [];
    }
  }

  /**
   * Extract tag content using regex (React Native compatible)
   */
  private extractTag(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Generate mock RSS items when all proxies fail
   */
  private getMockRSSItems(feed: RSSFeed): RSSFeedItem[] {
    const demoItems: RSSFeedItem[] = [
      {
        id: `demo-1-${Date.now()}`,
        title: 'Breaking: Scientists discover new species in deep ocean',
        description: 'Researchers have identified a previously unknown marine creature living at record depths.',
        link: '#',
        pubDate: new Date().toISOString(),
        source: 'Science News',
        category: 'Science',
      },
      {
        id: `demo-2-${Date.now()}`,
        title: 'Tech giant announces revolutionary AI breakthrough',
        description: 'New artificial intelligence system shows remarkable capabilities in problem solving.',
        link: '#',
        pubDate: new Date(Date.now() - 300000).toISOString(),
        source: 'Tech Today',
        category: 'Technology',
      },
      {
        id: `demo-3-${Date.now()}`,
        title: 'Global climate summit reaches historic agreement',
        description: 'World leaders unite on comprehensive environmental protection measures.',
        link: '#',
        pubDate: new Date(Date.now() - 600000).toISOString(),
        source: 'World News',
        category: 'Environment',
      },
      {
        id: `demo-4-${Date.now()}`,
        title: 'Space mission reveals stunning cosmic discoveries',
        description: 'Latest telescope images show unprecedented details of distant galaxies.',
        link: '#',
        pubDate: new Date(Date.now() - 900000).toISOString(),
        source: 'Space Daily',
        category: 'Space',
      },
      {
        id: `demo-5-${Date.now()}`,
        title: 'Medical breakthrough offers hope for rare diseases',
        description: 'New treatment shows promising results in clinical trials.',
        link: '#',
        pubDate: new Date(Date.now() - 1200000).toISOString(),
        source: 'Medical Journal',
        category: 'Health',
      },
    ];

    return demoItems;
  }

  /**
   * Parse RSS items from XML document
   */
  private parseRSSItems(xmlDoc: Document, feed: RSSFeed): RSSFeedItem[] {
    const items: RSSFeedItem[] = [];
    const itemNodes = xmlDoc.querySelectorAll('item');

    itemNodes.forEach((item, index) => {
      try {
        const title = this.getTextContent(item, 'title') || 'Untitled';
        const description = this.getTextContent(item, 'description') || '';
        const link = this.getTextContent(item, 'link') || '';
        const pubDate = this.getTextContent(item, 'pubDate') || new Date().toISOString();
        const category = this.getTextContent(item, 'category') || feed.category;

        // Create unique ID
        const id = `${feed.id}-${index}-${Date.now()}`;

        items.push({
          id,
          title: this.cleanText(title),
          description: this.cleanText(description),
          link,
          pubDate,
          source: feed.name,
          category,
        });
      } catch (error) {
        console.warn('Failed to parse RSS item:', error);
      }
    });

    return items.slice(0, 10); // Limit to 10 items per feed
  }

  /**
   * Get text content from XML element
   */
  private getTextContent(parent: Element, tagName: string): string | null {
    const element = parent.querySelector(tagName);
    return element?.textContent?.trim() || null;
  }

  /**
   * Clean HTML tags and decode entities from text
   */
  private cleanText(text: string): string {
    // Remove HTML tags
    const cleaned = text.replace(/<[^>]*>/g, '');
    
    // Decode common HTML entities
    const entityMap: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
    };

    return cleaned.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
      return entityMap[match] || match;
    }).trim();
  }

  /**
   * Fetch multiple feeds
   */
  async fetchMultipleFeeds(feeds: RSSFeed[]): Promise<RSSFeedItem[]> {
    const enabledFeeds = feeds.filter(feed => feed.enabled);
    
    if (enabledFeeds.length === 0) {
      console.log('📭 No RSS feeds enabled');
      return [];
    }

    console.log(`🔄 Fetching ${enabledFeeds.length} RSS feeds:`, enabledFeeds.map(f => f.name));

    // Fetch all feeds in parallel
    const promises = enabledFeeds.map(feed => this.fetchFeed(feed));
    const results = await Promise.allSettled(promises);

    // Combine all items
    const allItems: RSSFeedItem[] = [];
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
        successCount++;
      } else {
        console.warn(`❌ Feed ${enabledFeeds[index].name} failed:`, result.reason);
      }
    });

    console.log(`📰 Successfully fetched ${successCount}/${enabledFeeds.length} feeds, ${allItems.length} total items`);

    // Sort by date (newest first)
    allItems.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      return dateB - dateA;
    });

    return allItems.slice(0, 20); // Limit to 20 total items
  }

  /**
   * Clear cache for a specific feed
   */
  clearFeedCache(feedId: string): void {
    delete this.cache[feedId];
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache = {};
  }

  /**
   * Get cached items for a feed
   */
  getCachedItems(feedId: string): RSSFeedItem[] {
    const cached = this.cache[feedId];
    return cached?.items || [];
  }
}

export const rssService = new RSSService();