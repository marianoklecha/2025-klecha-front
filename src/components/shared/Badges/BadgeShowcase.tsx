import React from 'react';
import { Box, CircularProgress, Typography, Chip } from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BadgeCard from './BadgeCard';
import type { Badge, BadgeProgress, BadgeType, PatientBadgeType } from '#/models/Badge';
import './BadgeStyles.css';
import './BadgeShowcase.css';

interface BadgeShowcaseProps {
  badges: Badge[];
  progress: BadgeProgress[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({
  progress,
  isLoading = false,
  onViewAll
}) => {
  if (isLoading) {
    return (
      <Box className="badge-showcase">
        <Box className="badge-showcase-loading">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!progress || progress.length === 0) {
    return null;
  }

  const earnedBadges = progress.filter(p => p.earned);
  const totalEarned = earnedBadges.length;
  const totalAvailable = progress.length;
  const completionPercentage = totalAvailable > 0
    ? Math.round((totalEarned / totalAvailable) * 100)
    : 0;

  const recentlyEarned = earnedBadges
    .filter(p => p.earnedAt)
    .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
    .slice(0, 4)
    .map(p => ({
      id: `earned-${p.badgeType}`,
      doctorId: '', // Not needed for display
      badgeType: p.badgeType as BadgeType,
      earnedAt: p.earnedAt!,
      isActive: p.isActive || true,
      lastEvaluatedAt: p.lastEvaluatedAt || p.earnedAt!,
      progress: p // Include the full progress data for metadata
    } as Badge & { progress: BadgeProgress }));

  const closestToEarn = progress
    .filter(p => !p.earned && p.progressPercentage > 50)
    .sort((a, b) => b.progressPercentage - a.progressPercentage)
    .slice(0, 3);

  return (
    <Box className="badge-showcase">
      {/* Header */}
      <Box className="badge-showcase__header">
        <Box className="badge-showcase__title-section">
          <Box className="badge-showcase__title">
            <WorkspacePremiumIcon className="badge-showcase__title-icon" />
            Mis Logros
          </Box>
          
          <Chip 
            label={`${totalEarned} Obtenidos`}
            className="badge-showcase__stat-chip"
            size="small"
          />
          <Chip 
            label={`${totalAvailable} Disponibles`}
            className="badge-showcase__stat-chip"
            size="small"
          />
          <Chip 
            label={`${completionPercentage}% Completado`}
            className="badge-showcase__stat-chip"
            size="small"
          />
        </Box>
        
        <Box className="badge-showcase__header-actions">
          {onViewAll && (
            <Box 
              className="badge-showcase__view-all" 
              onClick={onViewAll}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onViewAll();
                }
              }}
            >
              Ver todos <ArrowForwardIcon style={{ fontSize: 16, marginLeft: 4, verticalAlign: 'middle' }} />
            </Box>
          )}
        </Box>
      </Box>

      {/* Recently Earned Badges */}
      {recentlyEarned.length > 0 && (
        <Box className="badge-showcase__recent">
          <Box className="badge-showcase__section-title">
              Recién Obtenidos
          </Box>
          <Box className="badge-showcase__recent-grid">
            {recentlyEarned.map((badge) => (
              <BadgeCard
                key={badge.id}
                badgeType={badge.badgeType}
                badge={badge}
                progress={badge.progress}
                size="small"
                onClick={() => onViewAll?.()}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Closest to Earn */}
      {closestToEarn.length > 0 && (
        <Box className="badge-showcase__recent badge-showcase__recent--closest">
          <Box className="badge-showcase__section-title">
              Próximos a Conseguir
          </Box>
          <Box className="badge-showcase__recent-grid">
            {closestToEarn.map((prog) => (
              <BadgeCard
                key={prog.badgeType}
                badgeType={prog.badgeType as BadgeType | PatientBadgeType}
                progress={prog}
                size="small"
                onClick={() => onViewAll?.()}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Empty State */}
      {totalEarned === 0 && closestToEarn.length === 0 && (
        <Box className="badge-showcase__empty-state">
          <Typography className="badge-showcase__empty-title" gutterBottom>
            ¡Comienza tu colección de logros!
          </Typography>
          <Typography className="badge-showcase__empty-subtitle">
            Completa consultas, documenta casos y brinda atención de calidad para obtener logros
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BadgeShowcase;
