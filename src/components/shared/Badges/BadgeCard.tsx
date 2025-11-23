import React from 'react';
import { Tooltip, Box, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Favorite from '@mui/icons-material/Favorite';
import Chat from '@mui/icons-material/Chat';
import LibraryBooks from '@mui/icons-material/LibraryBooks';
import Schedule from '@mui/icons-material/Schedule';
import Assignment from '@mui/icons-material/Assignment';
import GpsFixed from '@mui/icons-material/GpsFixed';
import CalendarToday from '@mui/icons-material/CalendarToday';
import People from '@mui/icons-material/People';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Star from '@mui/icons-material/Star';
import PanTool from '@mui/icons-material/PanTool';
import Shield from '@mui/icons-material/Shield';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import Refresh from '@mui/icons-material/Refresh';
import Psychology from '@mui/icons-material/Psychology';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import AccessTime from '@mui/icons-material/AccessTime';
import WavingHand from '@mui/icons-material/WavingHand';
import ThumbUp from '@mui/icons-material/ThumbUp';
import Repeat from '@mui/icons-material/Repeat';
import type { Badge, BadgeType, BadgeProgress, PatientBadgeType } from '#/models/Badge';
import { getRarityColor, getRarityDisplayName } from '#/models/Badge';
import { BadgeService } from '#/service/badge-service.service';
import './BadgeStyles.css';
import './BadgeCard.css';

const iconMap: Record<string, React.ComponentType<any>> = {
  Favorite, Chat, LibraryBooks, Schedule, Assignment, GpsFixed, CalendarToday, People, EmojiEvents, Star, 
  PanTool, Shield, FitnessCenter, Refresh, Psychology, VerifiedUser, AccessTime, WavingHand, ThumbUp, Repeat,
};

interface BadgeCardProps {
  badgeType: BadgeType | PatientBadgeType;
  badge?: Badge;
  progress?: BadgeProgress;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  badgeType,
  badge,
  progress,
  onClick,
  size = 'medium'
}) => {
  // Use metadata from progress data if available, otherwise use fallback
  const metadata = progress ? {
    type: progress.badgeType,
    category: progress.category,
    rarity: progress.rarity,
    name: progress.badgeName,
    description: progress.description,
    icon: progress.icon,
    color: progress.color,
    criteria: progress.criteria
  } : null;
  
  // Fallback metadata for unknown badge types
  const fallbackMetadata = {
    type: badgeType,
    category: 'ACHIEVEMENT' as any,
    rarity: 'COMMON' as any,
    name: badgeType.replace(/^(PATIENT_|DOCTOR_)/g, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    description: 'Achievement unlocked',
    icon: '🏆',
    color: '#9C27B0',
    criteria: 'Special achievement'
  };
  
  const finalMetadata = metadata || fallbackMetadata;
  
  const isEarned = !!badge;
  const rarityColor = getRarityColor(finalMetadata.rarity);

  const rawValue = progress && typeof progress.progressPercentage === 'number' && isFinite(progress.progressPercentage)
    ? progress.progressPercentage
    : 0;
  const progressValue = Math.min(100, Math.max(0, rawValue));
  const isHighProgress = progressValue >= 75;

  const sizeClasses = {
    small: 'badge-card--small',
    medium: 'badge-card--medium',
    large: 'badge-card--large'
  };

  return (
    <Tooltip 
      title={
        <Box className="badge-card-tooltip-title">
          <Typography className="badge-card-tooltip-text">
            {finalMetadata.criteria}
          </Typography>
        </Box>
      }
      arrow
      placement="top"
    >
      <Box
        className={`badge-card ${isEarned ? 'badge-card--earned' : 'badge-card--locked'} ${sizeClasses[size]}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick?.();
          }
        }}
        style={{
          '--badge-rarity-color': rarityColor,
          '--badge-rarity-color-light': `${rarityColor}22`,
          '--badge-rarity-color-lighter': `${rarityColor}44`,
          '--badge-color': finalMetadata.color,
          '--badge-color-light': `${finalMetadata.color}88`
        } as React.CSSProperties}
      >
        {/* Glow effect for earned badges */}
        {isEarned && (
          <Box className="badge-card__glow" />
        )}

        {/* Rarity indicator */}
        <Box className="badge-card__rarity-indicator">
          {getRarityDisplayName(finalMetadata.rarity)}
        </Box>

        {/* Lock icon for unearned badges */}
        {!isEarned && (
          <LockIcon className="badge-card__lock-icon" />
        )}

        {/* Card content */}
        <Box className="badge-card__content">
          <Box 
            className={`badge-card__icon-container ${isEarned ? 'badge-card__icon-container--earned' : 'badge-card__icon-container--locked'}`}
          >
            {(() => {
              const IconComponent = iconMap[finalMetadata.icon] || Star;
              return <IconComponent className="badge-card__icon" style={{ color: finalMetadata.color }} />;
            })()}
          </Box>
          <Typography className="badge-card__name">{finalMetadata.name}</Typography>
          <Typography className="badge-card__description">{finalMetadata.description}</Typography>

          {isEarned && badge && (
            <Typography className="badge-card__earned-date">
              {BadgeService.formatEarnedDate(badge.earnedAt)}
            </Typography>
          )}

          {/* Progress bar for unearned badges */}
          {!isEarned && progress && (
            <Box className="badge-card-progress-container">
              <Box className="badge-card-progress-bar-wrapper">
                <Box className="badge-card-progress-bar">
                  <Box 
                    className={`badge-card-progress-fill ${isHighProgress ? 'badge-card-progress-fill--high' : 'badge-card-progress-fill--normal'}`}
                    style={{ width: `${progressValue}%` }}
                  />
                </Box>
                <Typography 
                  component="span" 
                  className={`badge-card-progress-percentage ${isHighProgress ? 'badge-card-progress-percentage--high' : 'badge-card-progress-percentage--normal'}`}
                >
                  {progressValue.toFixed(0)}%
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Tooltip>
  );
};

export default BadgeCard;
