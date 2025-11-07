import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  RefreshControl,
  Linking,
  Dimensions,
  PanResponder,
  Animated,
  Modal,
  SafeAreaView
} from 'react-native';
import { type RSSFeedItem } from '@/lib/rssService';
import { useGame } from '@/context/GameContext';

interface RSSWidgetProps {
  height?: number;
}

export const RSSWidget: React.FC<RSSWidgetProps> = ({ height = 80 }) => {
  const { rssFeeds, rssItems, updateRSSFeeds } = useGame();
  const [refreshing, setRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const screenHeight = Dimensions.get('window').height;

  // Simple pan responder for swipe up
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy < -30) {
          // Swipe up detected - show modal
          setIsExpanded(true);
        }
      },
    })
  ).current;  console.log('📱 RSS Widget rendering with:', {
    feedsCount: rssFeeds.length,
    itemsCount: rssItems.length,
    height
  });


  // Load items on mount and when feeds change
  useEffect(() => {
    console.log('🔄 RSS Widget useEffect triggered, rssFeeds.length:', rssFeeds.length);
    console.log('🔍 RSS Widget current rssItems:', rssItems.length);
    loadItems();
  }, [rssFeeds]);

  // Monitor rssItems changes
  useEffect(() => {
    console.log('📰 RSS Items updated:', rssItems.length, 'items');
    if (rssItems.length > 0) {
      console.log('📰 First RSS item:', rssItems[0].title);
    }
  }, [rssItems]);

  const loadItems = async () => {
    const startTime = Date.now();
    
    console.log('🚀 LoadItems called with rssFeeds:', rssFeeds.length, 'feeds');
    
    try {
      // Trigger RSS update which will populate context state
      await updateRSSFeeds();
      
      const loadTime = Date.now() - startTime;
      console.log(`🆕 DYNAMIC RSS: Update triggered in ${loadTime}ms`);
      
    } catch (error) {
      console.warn('RSS loading error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await updateRSSFeeds();
      // Simulate refresh delay for UX
      setTimeout(() => {
        loadItems();
        setRefreshing(false);
      }, 300);
    } catch (error) {
      console.warn('RSS refresh error:', error);
      setRefreshing(false);
    }
  };

  const handleItemPress = async (item: RSSFeedItem) => {
    console.log('RSS item pressed:', item.title);
    try {
      const supported = await Linking.canOpenURL(item.link);
      if (supported) {
        await Linking.openURL(item.link);
        console.log('📱 Opened article in system browser:', item.link);
      } else {
        Alert.alert(
          'Cannot Open Link',
          `Unable to open this article: ${item.title}`,
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Failed to open article:', error);
      Alert.alert(
        'Error',
        'Failed to open the article. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };



  if (rssItems.length === 0) {
    return (
      <Animated.View 
        style={[styles.container, { height }]} 
        {...panResponder.panHandlers}
      >
        {/* Subtle swipe indicator */}
        <View style={styles.swipeIndicator}>
          <View style={styles.swipeHandle} />
        </View>
        
        <ScrollView
          horizontal
          style={{ flex: 1 }}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.emptyWidgetContainer}>
            <Text style={styles.emptyText}>📰 Enable RSS feeds in Profile</Text>
          </View>
        </ScrollView>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      style={[styles.expandableContainer, { height }]} 
      {...panResponder.panHandlers}
    >
      {/* Subtle swipe indicator */}
      <View style={styles.swipeIndicator}>
        <View style={styles.swipeHandle} />
      </View>
      
      {/* Original horizontal scroll footer */}
      <View style={styles.footerSection}>
        <ScrollView
          horizontal
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          bounces={true}
          alwaysBounceVertical={false}
          alwaysBounceHorizontal={true}
          overScrollMode="auto"
          decelerationRate="fast"
        >
          {rssItems.slice(0, 5).map((item: RSSFeedItem, index: number) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity 
                style={styles.articleContainer}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.sourceText}>{item.source?.toUpperCase()}</Text>
                <Text style={styles.titleText} numberOfLines={2}>
                  {item.title}
                </Text>
              </TouchableOpacity>
              {index < Math.min(rssItems.length - 1, 4) && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </ScrollView>
      </View>

      {/* Expanded articles grid */}
      {isExpanded && (
        <ScrollView style={styles.expandedContent} showsVerticalScrollIndicator={false}>
          <View style={styles.articlesGrid}>
            {rssItems.map((item: RSSFeedItem, index: number) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridArticleContainer}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.gridSourceText}>{item.source?.toUpperCase()}</Text>
                <Text style={styles.gridTitleText} numberOfLines={3}>
                  {item.title}
                </Text>
                <Text style={styles.gridMetaText}>
                  {item.source} • Tap to read
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
      
      {/* Simple Modal */}
      <Modal
        visible={isExpanded}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsExpanded(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📰 RSS Articles</Text>
            <TouchableOpacity onPress={() => setIsExpanded(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.gridContainer}>
              {rssItems.map((item: RSSFeedItem, index: number) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.gridSource}>{item.source?.toUpperCase()}</Text>
                  <Text style={styles.gridTitle} numberOfLines={3}>
                    {item.title}
                  </Text>
                  <Text style={styles.gridMeta}>Tap to read</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent', // Transparent - parent provides white footer background
    borderRadius: 0, // No border radius for edge-to-edge footer
    flex: 1, // Fill the footer container
  },
  expandableContainer: {
    backgroundColor: 'white',
    borderRadius: 0,
    overflow: 'hidden',
    minHeight: 100,
  },
  footerSection: {
    height: 100, // Fixed height for the footer section
    backgroundColor: 'white',
  },
  expandedContent: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 10,
  },
  articlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gridArticleContainer: {
    width: '31%', // 3 columns with spacing
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gridSourceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  gridTitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 14,
    marginBottom: 6,
  },
  gridMetaText: {
    fontSize: 9,
    color: '#6b7280',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20, // Increased for better spacing
    alignItems: 'flex-start', // Align to top instead of center
    minHeight: '100%',
    paddingVertical: 0, // Remove vertical padding to maximize space
    flexDirection: 'row', // Ensure horizontal layout
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  // Subtle container for empty state in footer
  emptyWidgetContainer: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  emptyText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  debugText: {
    position: 'absolute',
    top: 4,
    left: 16,
    fontSize: 10,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  articleContainer: {
    minWidth: 220, // Optimized for compact footer
    maxWidth: 260, // Better fit in reduced height
    paddingHorizontal: 12, // Reduced padding for compact design
    paddingVertical: 6, // Compact vertical padding for smaller footer
    backgroundColor: 'rgba(255, 255, 255, 0.98)', // High opacity white background for maximum readability
    borderRadius: 12, // Larger radius for modern look
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3, // More pronounced shadow
    },
    shadowOpacity: 0.12, // Stronger shadow for better definition
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)', // More visible border for definition
  },
  sourceText: {
    fontSize: 10, // Compact size for footer
    fontWeight: '800', // Very bold for visibility
    color: '#1e40af', // Strong blue for visibility
    letterSpacing: 0.4, // Tighter spacing
    marginBottom: 4, // Reduced space for compact design
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 13, // Slightly smaller for compact footer
    fontWeight: '700', // Bolder for better visibility
    color: '#000000', // Pure black for maximum contrast
    lineHeight: 16, // Tighter line height for compact display
    flexWrap: 'wrap', // Allow text to wrap properly
  },
  separator: {
    width: 12, // Spacing between cards
  },
  swipeIndicator: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  swipeHandle: {
    width: 36,
    height: 3,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '31%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gridSource: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 16,
    marginBottom: 6,
  },
  gridMeta: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
});