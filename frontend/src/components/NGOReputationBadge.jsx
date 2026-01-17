import React from 'react';

/**
 * NGO Reputation Badge Component
 * Displays reputation score with visual indicators
 */
export default function NGOReputationBadge({ reputation }) {
  if (!reputation) {
    return (
      <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
        <span className="mr-1">⭐</span>
        <span>New NGO</span>
      </div>
    );
  }

  const { reputationScore, totalFeedbackCount, thumbsUpCount, redFlagCount } = reputation;

  // Determine badge color and icon based on score
  let bgColor, textColor, icon, label;
  
  if (reputationScore >= 80) {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
    icon = '🏆';
    label = 'Excellent';
  } else if (reputationScore >= 60) {
    bgColor = 'bg-blue-100';
    textColor = 'text-blue-800';
    icon = '⭐';
    label = 'Good';
  } else if (reputationScore >= 40) {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
    icon = '⚠️';
    label = 'Fair';
  } else if (totalFeedbackCount > 0) {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
    icon = '🚨';
    label = 'Poor';
  } else {
    bgColor = 'bg-gray-100';
    textColor = 'text-gray-600';
    icon = '⭐';
    label = 'No Ratings';
  }

  return (
    <div className="inline-flex flex-col gap-2">
      {/* Main Badge */}
      <div className={`inline-flex items-center px-4 py-2 ${bgColor} ${textColor} rounded-lg font-medium`}>
        <span className="mr-2 text-xl">{icon}</span>
        <div>
          <div className="text-sm font-semibold">{label} Reputation</div>
          <div className="text-xs">
            {reputationScore}% ({totalFeedbackCount} {totalFeedbackCount === 1 ? 'rating' : 'ratings'})
          </div>
        </div>
      </div>

      {/* Detailed Stats (optional, can be shown on hover or always visible) */}
      {totalFeedbackCount > 0 && (
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span>👍</span>
            <span className="text-green-600 font-medium">{thumbsUpCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🚩</span>
            <span className="text-red-600 font-medium">{redFlagCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for lists
 */
export function NGOReputationBadgeCompact({ reputation }) {
  if (!reputation || !reputation.totalFeedbackCount) {
    return (
      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
        No ratings
      </span>
    );
  }

  const { reputationScore } = reputation;
  
  let bgColor, textColor, icon;
  
  if (reputationScore >= 80) {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
    icon = '🏆';
  } else if (reputationScore >= 60) {
    bgColor = 'bg-blue-100';
    textColor = 'text-blue-800';
    icon = '⭐';
  } else if (reputationScore >= 40) {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
    icon = '⚠️';
  } else {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
    icon = '🚨';
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 ${bgColor} ${textColor} rounded text-xs font-medium`}>
      <span className="mr-1">{icon}</span>
      {reputationScore}%
    </span>
  );
}

/**
 * Usage Examples:
 * 
 * // Full badge
 * <NGOReputationBadge reputation={ngo.reputation} />
 * 
 * // Compact badge for lists
 * <NGOReputationBadgeCompact reputation={ngo.reputation} />
 */
