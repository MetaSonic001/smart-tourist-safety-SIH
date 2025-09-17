import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image
} from 'react-native';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Users,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Navigation,
  Camera,
  Heart
} from 'lucide-react-native';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<number[]>([]);

  const categories = [
    { id: 'all', label: 'All', color: '#3B82F6' },
    { id: 'restaurants', label: 'Food', color: '#EF4444' },
    { id: 'attractions', label: 'Sights', color: '#10B981' },
    { id: 'shopping', label: 'Shopping', color: '#8B5CF6' },
    { id: 'hotels', label: 'Stay', color: '#F59E0B' }
  ];

  const places = [
    {
      id: 1,
      name: 'Mall Road',
      category: 'attractions',
      rating: 4.5,
      safetyScore: 92,
      crowdLevel: 'Moderate',
      bestTime: '6:00 AM - 8:00 PM',
      distance: '0.5 km',
      description: 'Famous shopping street with colonial architecture',
      image: 'https://images.pexels.com/photos/3224156/pexels-photo-3224156.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['Shopping', 'Heritage', 'Walking']
    },
    {
      id: 2,
      name: 'The Ridge',
      category: 'attractions',
      rating: 4.7,
      safetyScore: 88,
      crowdLevel: 'High',
      bestTime: '7:00 AM - 7:00 PM',
      distance: '0.8 km',
      description: 'Open space with panoramic mountain views',
      image: 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['Views', 'Photography', 'Events']
    },
    {
      id: 3,
      name: 'Cafe Sol',
      category: 'restaurants',
      rating: 4.3,
      safetyScore: 95,
      crowdLevel: 'Low',
      bestTime: '8:00 AM - 10:00 PM',
      distance: '0.3 km',
      description: 'Cozy cafe with mountain views and local cuisine',
      image: 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['Cafe', 'Local Food', 'Wifi']
    },
    {
      id: 4,
      name: 'Tibetan Market',
      category: 'shopping',
      rating: 4.1,
      safetyScore: 90,
      crowdLevel: 'Moderate',
      bestTime: '10:00 AM - 8:00 PM',
      distance: '1.2 km',
      description: 'Traditional market with handicrafts and souvenirs',
      image: 'https://images.pexels.com/photos/1005644/pexels-photo-1005644.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['Handicrafts', 'Souvenirs', 'Culture']
    }
  ];

  const getSafetyColor = (score: number) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getCrowdColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return '#10B981';
      case 'moderate': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const toggleFavorite = (placeId: number) => {
    setFavorites(prev =>
      prev.includes(placeId)
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    );
  };

  const handleFeedback = (placeId: number, positive: boolean) => {
    Alert.alert(
      'Feedback Submitted',
      `Thank you for your feedback! This helps other tourists stay safe.`,
      [{ text: 'OK' }]
    );
  };

  const filteredPlaces = places.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderPlaceCard = (place: any) => (
    <View key={place.id} style={styles.placeCard}>
      <View style={styles.placeImageContainer}>
        <Image source={{ uri: place.image }} style={styles.placeImage} />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(place.id)}
        >
          <Heart
            size={20}
            color={favorites.includes(place.id) ? '#EF4444' : '#FFFFFF'}
            fill={favorites.includes(place.id) ? '#EF4444' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.placeContent}>
        <View style={styles.placeHeader}>
          <Text style={styles.placeName}>{place.name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.rating}>{place.rating}</Text>
          </View>
        </View>

        <Text style={styles.placeDescription}>{place.description}</Text>

        <View style={styles.placeStats}>
          <View style={styles.statItem}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.statText}>{place.distance}</Text>
          </View>
          <View style={styles.statItem}>
            <Users size={14} color={getCrowdColor(place.crowdLevel)} />
            <Text style={styles.statText}>{place.crowdLevel}</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.statText}>Best: {place.bestTime.split(' - ')[0]}</Text>
          </View>
        </View>

        <View style={styles.safetyContainer}>
          <Text style={styles.safetyLabel}>Safety Score:</Text>
          <View style={[styles.safetyBadge, { backgroundColor: getSafetyColor(place.safetyScore) + '20' }]}>
            <Text style={[styles.safetyScore, { color: getSafetyColor(place.safetyScore) }]}>
              {place.safetyScore}% Safe
            </Text>
          </View>
        </View>

        <View style={styles.tagContainer}>
          {place.tags.map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.placeActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Navigation', `Getting directions to ${place.name}...`)}
          >
            <Navigation size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => Alert.alert('Added to Itinerary', `${place.name} added to your travel plan`)}
          >
            <Plus size={16} color="#3B82F6" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Add to Plan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Was this place safe?</Text>
          <View style={styles.feedbackButtons}>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => handleFeedback(place.id, true)}
            >
              <ThumbsUp size={16} color="#10B981" />
              <Text style={styles.feedbackButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => handleFeedback(place.id, false)}
            >
              <ThumbsDown size={16} color="#EF4444" />
              <Text style={styles.feedbackButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Safe Places</Text>
        <TouchableOpacity style={styles.cameraButton}>
          <Camera size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search safe places..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && { backgroundColor: category.color }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Places List */}
      <ScrollView style={styles.placesList} showsVerticalScrollIndicator={false}>
        {filteredPlaces.map(renderPlaceCard)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 60, // Add this to limit height
    flexGrow: 0,   // Add this to prevent expansion
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    alignItems: 'center', // Add this to center items vertically
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  placesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  placeImageContainer: {
    position: 'relative',
  },
  placeImage: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeContent: {
    padding: 16,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  placeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  placeStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  safetyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  safetyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  safetyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  safetyScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 6,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  placeActions: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#3B82F6',
  },
  feedbackSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  feedbackTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  feedbackButtonText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
