import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield, TrendingUp, TrendingDown } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { SafetyScore } from '@/types';

interface SafetyScoreCardProps {
  score: SafetyScore;
}

export const SafetyScoreCard: React.FC<SafetyScoreCardProps> = ({ score }) => {
  const getScoreColor = () => {
    if (score.riskLevel === 'low') return Colors.success;
    if (score.riskLevel === 'medium') return Colors.warning;
    return Colors.error;
  };

  const getScoreIcon = () => {
    if (score.riskLevel === 'low') return TrendingUp;
    if (score.riskLevel === 'medium') return Shield;
    return TrendingDown;
  };

  const ScoreIcon = getScoreIcon();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Shield size={24} color={Colors.primary} />
          <Text style={styles.title}>Safety Score</Text>
        </View>
        <Text style={styles.modelVersion}>v{score.modelVersion}</Text>
      </View>

      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreNumber, { color: getScoreColor() }]}>
            {score.score}
          </Text>
          <Text style={styles.scoreOutOf}>/100</Text>
        </View>
        
        <View style={styles.scoreDetails}>
          <View style={[styles.riskBadge, { backgroundColor: getScoreColor() }]}>
            <ScoreIcon size={16} color={Colors.white} />
            <Text style={styles.riskText}>
              {score.riskLevel.toUpperCase()} RISK
            </Text>
          </View>
          
          <View style={styles.reasonsContainer}>
            {score.reasons.slice(0, 2).map((reason, index) => (
              <Text key={index} style={styles.reasonText}>
                • {reason}
              </Text>
            ))}
            {score.reasons.length > 2 && (
              <Text style={styles.moreReasons}>
                +{score.reasons.length - 2} more factors
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginLeft: 8,
  },
  modelVersion: {
    ...Typography.caption,
    color: Colors.textSecondary,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  scoreNumber: {
    ...Typography.h1,
    fontWeight: 'bold',
  },
  scoreOutOf: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  scoreDetails: {
    flex: 1,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  riskText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reasonsContainer: {
    flex: 1,
  },
  reasonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  moreReasons: {
    ...Typography.caption,
    color: Colors.primary,
    fontStyle: 'italic',
  },
});