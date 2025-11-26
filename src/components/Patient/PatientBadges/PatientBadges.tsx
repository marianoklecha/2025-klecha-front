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
  PatientBadgeType,
  sortBadgesByRarity
} from "#/models/Badge";
import type { Badge, BadgeProgress } from "#/models/Badge";
import "./PatientBadges.css";

const PatientBadges: React.FC = () => {
  const { badgeState } = useMachines();
  const badgeContext = badgeState?.context;

  const isLoading = badgeContext?.isLoadingBadges || badgeContext?.isLoadingProgress;
  const badges = badgeContext?.badges || [];
  const progress = badgeContext?.progress || [];
  const stats = badgeContext?.stats || null;

  const allBadgeTypes = Object.values(PatientBadgeType);
  const earnedBadgeTypes = new Set(badges.map((b: Badge) => b.badgeType.replace(/^PATIENT_/, '')));

  const getBadgeObject = (badgeType: PatientBadgeType): Badge | undefined => {
    const backendBadgeType = `PATIENT_${badgeType}`;
    return badges.find((b: Badge) => b.badgeType === backendBadgeType);
  };

  const getProgressForBadge = (badgeType: PatientBadgeType): BadgeProgress | undefined => {
    const backendBadgeType = `PATIENT_${badgeType}`;
    return progress.find((p: BadgeProgress) => p.badgeType === backendBadgeType);
  };

  const badgesWithRarity = allBadgeTypes.map(badgeType => {
    const prog = getProgressForBadge(badgeType);
    return {
      badgeType,
      rarity: prog?.rarity || 'COMMON'
    };
  });

  const sortedBadges = sortBadgesByRarity(badgesWithRarity).map(item => item.badgeType);

  const lockedBadgesCount = sortedBadges.filter(type => !earnedBadgeTypes.has(type)).length;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="shared-container">
        <Box className="shared-header">
          <Box className="shared-header-layout">
            <Box className="shared-header-content">
              <Avatar className="shared-header-icon patient-header-avatar">
                <WorkspacePremiumIcon className="patient-header-icon" />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" className="shared-header-title">
                  Colección de Logros
                </Typography>
                <Typography variant="h6" className="shared-header-subtitle patient-header-subtitle">
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
            <Box className="patient-badges-stats-summary">
              <Box className="patient-stat-card">
                <Typography className="patient-stat-value">
                  {stats.totalEarned}
                </Typography>
                <Typography className="patient-stat-label">
                  Obtenidos
                </Typography>
              </Box>
              <Box className="patient-stat-card">
                <Typography className="patient-stat-value">
                  {stats.totalAvailable}
                </Typography>
                <Typography className="patient-stat-label">
                  Disponibles
                </Typography>
              </Box>
              <Box className="patient-stat-card">
                <Typography className="patient-stat-value">
                  {stats.completionPercentage}%
                </Typography>
                <Typography className="patient-stat-label">
                  Completado
                </Typography>
              </Box>
              <Box className="patient-stat-card">
                <Typography className="patient-stat-locked-value">
                  {lockedBadgesCount}
                </Typography>
                <Typography className="patient-stat-label">
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
                  className="patient-badges-chip"
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
              <Box className="badges-loading-state">
                <CircularProgress size={40} />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  Cargando logros...
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default PatientBadges;