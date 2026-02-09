import { Box, Typography, Avatar, Alert, CircularProgress } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { useMachines } from "#/providers/MachineProvider";
import { useDataMachine } from "#/providers/DataProvider";
import { useMemo } from "react";
import StatsCards, { type StatCardData } from '../shared/StatsCards';
import RatingsTable, { type RatingData } from '../shared/RatingsTable';
import '../shared/SharedStyles.css';
import "./AdminDashboard.css";
import "./AdminPatients.css";

interface Patient {
  id: string;
  name: string;
}

export default function AdminPatients() {
  const { adminUserState, adminUserSend } = useMachines();
  const { dataState } = useDataMachine();
  const adminContext = adminUserState.context;
  const dataContext = dataState.context;

  const selectedPatientId = adminContext.selectedFilterPatientId;
  
  const handleFilterChange = (patientId: string) => {
    adminUserSend({ type: 'SELECT_FILTER_PATIENT', patientId });
  };

  const loading = adminContext.loading || 
                  dataContext.loading?.adminRatings || 
                  dataContext.loading?.adminStats;

  const error = adminContext.error || dataContext.errors?.adminRatings;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const patientStats = useMemo(() => {
    const adminRatings = adminContext.adminRatings || dataContext.adminRatings;
    const doctorRatings = adminRatings?.doctorRatings || []; 
    
    const filteredRatings = selectedPatientId === 'all' 
      ? doctorRatings 
      : doctorRatings.filter((rating: any) => rating.ratedId === selectedPatientId);
    
    const totalPatients = adminContext.adminStats?.patients || 0;
    const totalRatingsToPatients = filteredRatings.length;
    
    const averageRatingReceived = filteredRatings.length > 0 
      ? (filteredRatings.reduce((sum: number, rating: any) => sum + rating.score, 0) / filteredRatings.length).toFixed(1)
      : '0.0';
    
    const patientsRated = selectedPatientId === 'all'
      ? new Set(doctorRatings.map((rating: any) => rating.ratedId)).size
      : filteredRatings.length > 0 ? 1 : 0;
    const ratingCoverage = selectedPatientId === 'all' && totalPatients > 0 
      ? ((patientsRated / totalPatients) * 100).toFixed(1)
      : filteredRatings.length > 0 ? '100.0' : '0.0';

    return {
      totalPatients: selectedPatientId === 'all' ? totalPatients : 1,
      totalRatingsToPatients,
      averageRatingReceived,
      ratingCoverage,
      patientsRated
    };
  }, [adminContext.adminRatings, dataContext.adminRatings, adminContext.adminStats, selectedPatientId]);

  const patientsList = useMemo(() => {
    const adminRatings = adminContext.adminRatings || dataContext.adminRatings;
    const doctorRatings = adminRatings?.doctorRatings || [];
    
    const uniquePatients: Patient[] = doctorRatings.reduce((acc: Patient[], rating: any) => {
      const existing = acc.find(p => p.id === rating.ratedId);
      if (!existing) {
        acc.push({
          id: rating.ratedId,
          name: rating.ratedName
        });
      }
      return acc;
    }, []);
    
    return uniquePatients.sort((a: Patient, b: Patient) => a.name.localeCompare(b.name));
  }, [adminContext.adminRatings, dataContext.adminRatings]);

  const ratingsData: RatingData[] = useMemo(() => {
    const adminRatings = adminContext.adminRatings || dataContext.adminRatings;
    const doctorRatings = adminRatings?.doctorRatings || []; 
    
    const filteredRatings = selectedPatientId === 'all' 
      ? doctorRatings 
      : doctorRatings.filter((rating: any) => rating.ratedId === selectedPatientId);
    
    return filteredRatings.map((rating: any) => ({
      id: rating.id,
      patientName: rating.ratedName, 
      doctorName: rating.raterName, 
      score: rating.score,
      subcategories: rating.subcategories || [],
      createdAt: formatDate(rating.createdAt),
      turnId: rating.turnId
    }));
  }, [adminContext.adminRatings, dataContext.adminRatings, selectedPatientId]);

  const statsData: StatCardData[] = useMemo(() => [
    {
      icon: <PersonIcon />,
      value: patientStats.totalPatients,
      label: "Pacientes Activos",
      subValue: `Familiares registrados: ${adminContext.adminStats?.familyMembers || 0}`
    },
    {
      icon: <RateReviewIcon />,
      value: patientStats.totalRatingsToPatients,
      label: "Total Evaluaciones"
    },
    {
      icon: <StarIcon />,
      value: patientStats.averageRatingReceived,
      label: "Calificación Promedio"
    },
    {
      icon: <TrendingUpIcon />,
      value: `${patientStats.ratingCoverage}%`,
      label: "Pacientes Evaluados"
    }
  ], [patientStats]);

  return (
    <Box className="shared-container">
      {/* Header Section */}
      <Box className="shared-header">
        <Box className="shared-header-layout">
          <Box className="shared-header-content">
            <Avatar className="shared-header-icon">
              <PersonIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" className="shared-header-title">
                Gestión de Pacientes
              </Typography>
              <Typography variant="h6" className="shared-header-subtitle">
                Panel administrativo para revisión de pacientes
              </Typography>
            </Box>
          </Box>
          <Box className="shared-header-spacer">
            {loading && <CircularProgress />}
          </Box>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box className="patients-content">
        {/* Statistics Cards */}
        <StatsCards stats={statsData} loading={loading} />

        {/* Ratings Section */}
        <RatingsTable
          ratingsData={ratingsData}
          title="Evaluaciones de Doctores a Pacientes"
          subtitle="Historial completo de todas las evaluaciones realizadas por doctores a pacientes"
          loading={loading}
          emptyMessage={{
            title: "No hay evaluaciones disponibles",
            subtitle: "Los doctores aún no han realizado evaluaciones a los pacientes"
          }}
          filterConfig={{
            filterType: 'patient',
            filterOptions: patientsList,
            selectedFilterId: selectedPatientId,
            onFilterChange: handleFilterChange,
            getFilteredTitle: (selectedName) => 
              selectedName 
                ? `Evaluaciones de Doctores a ${selectedName}`
                : "Evaluaciones de Doctores a Pacientes",
            getFilteredSubtitle: (selectedName) =>
              selectedName
                ? "Evaluaciones específicas para el paciente seleccionado"
                : "Historial completo de todas las evaluaciones realizadas por doctores a pacientes",
            getFilteredEmptyMessage: (selectedName) => ({
              title: selectedName 
                ? "No hay evaluaciones para este paciente"
                : "No hay evaluaciones disponibles",
              subtitle: selectedName
                ? "Este paciente aún no ha recibido evaluaciones de doctores"
                : "Los doctores aún no han realizado evaluaciones a los pacientes"
            })
          }}
        />
      </Box>
    </Box>
  );
}