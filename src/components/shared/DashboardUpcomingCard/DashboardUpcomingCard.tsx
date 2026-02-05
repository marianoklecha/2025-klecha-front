import React from "react";
import {
  Box,
  Card,
  Typography,
  CircularProgress
} from "@mui/material";
import { formatDateTime } from '#/utils/dateTimeUtils';
import "./DashboardUpcomingCard.css";

type CardType = 'patient' | 'doctor';

interface FamilyMember {
  id: string;
  name: string;
  surname: string;
  relationship: string;
  birthdate?: string;
  dni?: number;
  gender?: string;
}

interface Turn {
  id: string;
  scheduledAt: string;
  status: string;
  doctorName?: string;
  doctorSpecialty?: string;
  patientName?: string;
  motive?: string;
  familyMemberId?:string;
  // legacy field
  reason?: string;
}

interface DashboardUpcomingCardProps {
  type: CardType;
  title: string;
  turns: Turn[];
  family?: FamilyMember[];
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
  viewAllText?: string;
  onViewAll?: () => void;
}

 const getFamilyMember = (familyMemberId: string, familyMembers: FamilyMember[]) => {
    const member = familyMembers?.find((m: any) => m.id === familyMemberId);
    if (member) return member;
    
    return null;
  }

   const getFamilyMemberFromList = (familyMemberId: string, family: any[]) => {
    for (const patient of family) {
      const member = patient.familyMembers?.find((m: any) => m.id === familyMemberId);
      if (member) return member;
    }
    return null;
  }

const DashboardUpcomingCard: React.FC<DashboardUpcomingCardProps> = ({
  type,
  title,
  turns,
  family,
  isLoading = false,
  error,
  emptyMessage = "No hay turnos próximos",
  onViewAll
}) => {
  const renderTurnContent = (turn: Turn) => {
    if (type === 'patient') {

     const familyMember = turn.familyMemberId && family ? getFamilyMember(turn.familyMemberId, family) : null

      return (
        <>
          <Typography variant="body1" className="upcoming-card-date">
            {formatDateTime(turn.scheduledAt, "DD/MM/YYYY - HH:mm")}
          </Typography>
          <Typography variant="body2" className="upcoming-card-date">
            {turn.doctorSpecialty || "Especialidad"}
          </Typography>

          {familyMember && (
              <Typography variant="body2" className="upcoming-card-secondary">
                Paciente: {familyMember.name} {familyMember.surname} ({familyMember.relationship})
              </Typography>
          )}

          <Typography variant="body2" className="upcoming-card-secondary">
             Dr. {turn.doctorName || "Doctor"}
          </Typography>
        </>
      );
    } else {

      const familyMember = turn.familyMemberId && family ? getFamilyMemberFromList(turn.familyMemberId, family) : null

      return (
        <>
          <Box className="upcoming-card-header-row">
            <Typography variant="body1" className="upcoming-card-date">
              {formatDateTime(turn.scheduledAt, "DD/MM/YYYY - HH:mm")}
            </Typography>
          </Box>
          {familyMember ? (
            <>
              <Typography variant="body2" className="upcoming-card-secondary">
                Responsable: {turn.patientName || "Paciente"}
              </Typography>
              <Typography variant="body2" className="upcoming-card-secondary">
                Paciente: {familyMember.name} {familyMember.surname} ({familyMember.relationship})
              </Typography>
            </>
          ) : (
            <Typography variant="body2" className="upcoming-card-secondary">
              Paciente: {turn.patientName || "Paciente"}
            </Typography>
          )}


          {turn.motive && (
            <Typography variant="body2" className="upcoming-card-reason">
              {turn.motive=="HEALTH CERTIFICATE"?"Certificado de apto físico":turn.motive}
            </Typography>
          )}
        </>
      );
    }
  };

  return (
    <Box className="dashboard-card-item" onClick={onViewAll}>
      <Card className={`upcoming-card ${type}-upcoming-card`}>
        <Box className={`upcoming-card-header ${type}-upcoming-header`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" className="upcoming-card-title">
            {title}
          </Typography>
        </Box>
        
        <Box className="upcoming-card-content">
          {isLoading ? (
            <Box className="upcoming-card-loading">
              <CircularProgress size={24} />
              {type === 'doctor' && (
                <Typography className="upcoming-card-loading-text">
                  Cargando turnos...
                </Typography>
              )}
            </Box>
          ) : error ? (
            <Typography variant="body2" className="upcoming-card-error">
              Error al cargar turnos: {error}
            </Typography>
          ) : turns.length > 0 ? (
            turns.map((turn, index) => (
              <Box 
                key={turn.id || index} 
                className={`upcoming-card-item ${turn.status === 'CANCELED' ? 'upcoming-card-item-canceled' : ''}`}
              >
                {renderTurnContent(turn)}
              </Box>
            ))
          ) : (
            <Typography variant="body2" className="upcoming-card-empty">
              {emptyMessage}
            </Typography>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default DashboardUpcomingCard;