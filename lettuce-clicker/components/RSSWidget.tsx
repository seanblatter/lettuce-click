import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  Linking, 
  Alert,
  RefreshControl 
} from 'react-native';
import { type RSSFeedItem } from '@/lib/rssService';

interface RSSWidgetProps {
  items: RSSFeedItem[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<void>;
  onItemPress?: (item: RSSFeedItem) => void;
}

export const RSSWidget: React.FC<RSSWidgetProps> = ({
  items = [],
  isLoading = false,
  error,
  onRefresh,
  onItemPress,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);
  
  // Defensive check for items array
  const safeItems = Array.isArray(items) ? items : [];

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.warn('RSS refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleItemPress = (item: RSSFeedItem) => {
    if (onItemPress) {
      onItemPress(item);
      return;
    }

    // Default behavior: open link or show alert
    if (item.link) {
      Alert.alert(
        item.title,
        'Open this article in your browser?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open', 
            onPress: () => {
              Linking.openURL(item.link).catch(() => {
                Alert.alert('Error', 'Unable to open link');
              });
            }
          },
        ]
      );
    } else {
      Alert.alert(item.title, item.description);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 60) {
        return `${minutes}m`;
      } else if (hours < 24) {
        return `${hours}h`;
      } else if (days < 7) {
        return `${days}d`;
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch {
      return '';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📰 Error loading news feeds</Text>
        </View>
      </View>
    );
  }

  if (items.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📰 No news feeds enabled</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>📰 Loading news...</Text>
        </View>
      ) : (
        <>
          {/* Debug info - remove in production */}
          <View style={{ position: 'absolute', top: 2, left: 16, zIndex: 999 }}>
            <Text style={{ fontSize: 8, color: '#666' }}>Items: {safeItems.length}</Text>
          </View>
          
          <ScrollView
            horizontal
            style={styles.scrollView}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', minHeight: '100%' }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#666"
              />
            }
          >
            {safeItems.length > 0 ? (
              safeItems.slice(0, 8).map((item, index) => {
                if (!item || !item.id) return null;
                
                return (
                  <Pressable
                    key={`rss-item-${item.id}-${index}`}
                    style={({ pressed }) => [
                      styles.newsItem,
                      pressed && styles.newsItemPressed,
                    ]}
                    onPress={() => handleItemPress(item)}
                  >
                    <View style={styles.newsContent}>
                      <Text style={styles.newsSource}>{item.source || 'News'}</Text>
                      <Text style={styles.newsTitle} numberOfLines={2}>
                        {truncateText(item.title || 'Loading...', 50)}
                      </Text>
                    </View>
                    {index < safeItems.slice(0, 8).length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </Pressable>
                );
              }).filter(Boolean)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>📰 No news feeds available</Text>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 280,
    height: '100%',
    backgroundColor: 'transparent',
  },
  newsItemPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  newsContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  newsSource: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb', // Blue color for source
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937', // Dark text for readability
    lineHeight: 20,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginLeft: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});