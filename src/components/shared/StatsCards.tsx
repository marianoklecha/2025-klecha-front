import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';
import './StatsCards.css';

export interface StatCardData {
  icon: ReactNode;
  value: string | number;
  label: string;
  subValue?: string;
}

interface StatsCardsProps {
  stats: StatCardData[];
  loading?: boolean;
}

export default function StatsCards({ stats, loading = false }: StatsCardsProps) {
  return (
    <Box className="stats-cards-container">
      {stats.map((stat, index) => (
        <Box key={index} className="stats-card">
          <Box className="stats-card-content">
            <Box className="stats-card-icon">
              {stat.icon}
            </Box>
            <Box className="stats-card-info">
              <Typography variant="h5" className="stats-card-number">
                {loading ? '...' : stat.value}
              </Typography>
              <Typography variant="caption" className="stats-card-label">
                {stat.label}
              </Typography>
              {stat.subValue && !loading && (
                 <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                   {stat.subValue}
                 </Typography>
               )}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}