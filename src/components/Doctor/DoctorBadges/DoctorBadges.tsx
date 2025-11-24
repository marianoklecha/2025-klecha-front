import React from 'react';
import {
  Box, 
  Typography, 
  Avatar,
  CircularProgress,
  Chip
} from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { useMachines } from "#/providers/MachineProvider";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import BadgeCard from "../../shared/Badges/BadgeCard";
import { 
  BadgeType,
  BadgeRarity
} from "#/models/Badge";
import type { Badge, BadgeProgress } from "#/models/Badge";
import "./DoctorBadges.css";

const DoctorBadges: React.FC = () => {
  const { badgeState } = useMachines();
  const badgeContext = badgeState?.context;

  const isLoading = badgeContext?.isLoadingBadges || badgeContext?.isLoadingProgress;
  const badges = badgeContext?.badges || [];
  const progress = badgeContext?.progress || [];
  const stats = badgeContext?.stats || null;

  const earnedBadgeTypes = new Set(badges.map((b: Badge) => b.badgeType.replace(/^DOCTOR_/, '')));

  const rarityOrder = {
    [BadgeRarity.COMMON]: 1,
    [BadgeRarity.RARE]: 2,
    [BadgeRarity.EPIC]: 3,
    [BadgeRarity.LEGENDARY]: 4,
  };

  // Sort badges by rarity using progress data
  const sorted = [...progress].sort((a, b) => {
    const rarityA = a.rarity as BadgeRarity;
    const rarityB = b.rarity as BadgeRarity;
    return rarityOrder[rarityA] - rarityOrder[rarityB];
  });
  const sortedBadges = sorted.map(p => p.badgeType.replace(/^DOCTOR_/, '') as BadgeType);

  const lockedBadgesCount = sortedBadges.filter(type => !earnedBadgeTypes.has(type)).length;

  const getBadgeObject = (badgeType: BadgeType): Badge | undefined => {
    const backendBadgeType = `DOCTOR_${badgeType}`;
    return badges.find((b: Badge) => b.badgeType === backendBadgeType);
  };

  const getProgressForBadge = (badgeType: BadgeType): BadgeProgress | undefined => {
    const backendBadgeType = `DOCTOR_${badgeType}`;
    return progress.find((p: BadgeProgress) => p.badgeType === backendBadgeType);
  };
    
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="shared-container">
        <Box className="shared-header">
          <Box className="shared-header-layout">
            <Box className="shared-header-content">
              <Avatar className="shared-header-icon doctor-header-avatar">
                <WorkspacePremiumIcon className="doctor-header-icon" />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" className="shared-header-title">
                  Colección de Logros
                </Typography>
                <Typography variant="h6" className="shared-header-subtitle doctor-header-subtitle">
                  Explora todos tus logros y progreso
                </Typography>
              </Box>
            </Box>
            <Box className="shared-header-spacer">
              {isLoading && <CircularProgress />}
            </Box>
          </Box>
        </Box>

        <Box className="badges-content">
          {stats && (
            <Box className="doctor-badges-stats-summary">
              <Box className="doctor-stat-card">
                <Typography className="doctor-stat-value">
                  {stats.totalEarned}
                </Typography>
                <Typography className="doctor-stat-label">
                  Obtenidos
                </Typography>
              </Box>
              <Box className="doctor-stat-card">
                <Typography className="doctor-stat-value">
                  {stats.totalAvailable}
                </Typography>
                <Typography className="doctor-stat-label">
                  Disponibles
                </Typography>
              </Box>
              <Box className="doctor-stat-card">
                <Typography className="doctor-stat-value">
                  {stats.completionPercentage}%
                </Typography>
                <Typography className="doctor-stat-label">
                  Completado
                </Typography>
              </Box>
              <Box className="doctor-stat-card">
                <Typography className="doctor-stat-locked-value">
                  {lockedBadgesCount}
                </Typography>
                <Typography className="doctor-stat-label">
                  Por Desbloquear
                </Typography>
              </Box>
            </Box>
          )}

          {sortedBadges.length > 0 && (
            <Box className="badges-section">
              <Box className="badges-section-header">
                <Typography variant="h5" className="badges-section-title">
                  Todos los Logros
                </Typography>
                <Chip
                  label={`${sortedBadges.length} logros`}
                  size="small"
                  className="doctor-badges-chip"
                />
              </Box>
              <Box className="badges-grid">
                {sortedBadges.map((badgeType) => {
                  const badge = getBadgeObject(badgeType);
                  const prog = getProgressForBadge(badgeType);
                  return (
                    <BadgeCard
                      key={badgeType}
                      badgeType={badgeType}
                      badge={badge}
                      progress={prog}
                      size="medium"
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {sortedBadges.length === 0 && (
            <Box className="badges-empty-state">
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No se encontraron logros
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Los logros se cargarán automáticamente
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default DoctorBadges;
