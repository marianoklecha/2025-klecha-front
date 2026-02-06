import { 
  Box, Typography, Avatar, Chip, CircularProgress
} from "@mui/material";
import { useMachines } from "#/providers/MachineProvider";
import { dayjsArgentina, formatDateTime } from '#/utils/dateTimeUtils';
import type { TurnModifyRequest } from "#/models/TurnModifyRequest";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { Patient } from "#/models/Doctor"
import "./TurnsModifications.css";
import { useDataMachine } from "#/providers/DataProvider"
import PendingCard from "#/components/shared/PendingCard/PendingCard";
import { MarkEmailUnread } from "@mui/icons-material";

const TurnsModifications: React.FC = () => {
  const { dataState } = useDataMachine();
  const { uiState, uiSend } = useMachines();

  const dataContext = dataState.context;
  const patients: Patient[] = dataContext.doctorPatients || [];
  const pendingModifyRequests: TurnModifyRequest[] = dataContext.doctorModifyRequests?.filter((r: TurnModifyRequest) => r.status === "PENDING") || [];
  const isLoadingPatients = dataContext.loading?.doctorPatients || false;
  const isLoadingRequest = dataContext.loading?.doctorModifyRequests || false;
  const loadingApprove = uiState.context.toggleStates.loadingApprove;
  const loadingReject = uiState.context.toggleStates.loadingReject;

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      return `${patient.name} ${patient.surname}`;
    } else {
      if (isLoadingPatients) {
        return "Cargando paciente...";
      }
      return `Paciente ID: ${patientId}`;
    }
  };

  return (
    <Box className="turnsmod-container">
      <Box className="shared-header">
        <Box className="shared-header-layout">
          <Box className="shared-header-content">
            <Avatar className="shared-header-icon">
              <MarkEmailUnread sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" className="shared-header-title">
                Solicitudes Pendientes
              </Typography>
              <Typography variant="h6" className="shared-header-subtitle">
                Gestiona los cambios de turnos de tus pacientes
              </Typography>
            </Box>
          </Box>
          <Box className="shared-header-spacer"></Box>
        </Box>
      </Box>

      <Box maxWidth="lg" className="pending-content-container" sx={{ mx: 'auto', px: 3 }}>
        {/* Pending Turn Modification Requests */}
        { (isLoadingRequest || loadingApprove || loadingReject) ? (
          <Box className="pending-empty-state">
            <CircularProgress size={24} />
            <Typography variant="h6" className="pending-empty-title">
              Cargando solicitudes...
            </Typography>
          </Box>
        ) : pendingModifyRequests.length > 0 ? (
          <Box>
            <Box className="pending-status-chip-container">
              <Chip
                label={`${pendingModifyRequests.length} solicitud(es) pendiente(s)`}
                className="pending-status-chip"
              />
            </Box>

            <Box className="pending-cards-container">
              {pendingModifyRequests.map((request, index) => {
                const isDateChange = dayjsArgentina(request.currentScheduledAt).format("YYYY-MM-DD") !== dayjsArgentina(request.requestedScheduledAt).format("YYYY-MM-DD");
                const isTimeChange = dayjsArgentina(request.currentScheduledAt).format("HH:mm") !== dayjsArgentina(request.requestedScheduledAt).format("HH:mm");

                return (
                  <PendingCard
                    key={request.id || index}
                    id={request.id}
                    title={getPatientName(request.patientId)}
                    avatarContent={<ListAltIcon sx={{ fontSize: 28 }} />}
                    onApprove={(id) => uiSend({ 
                      type: "OPEN_CONFIRMATION_DIALOG", 
                      action: 'approve', 
                      requestId: String(id),
                      title: "Aprobar Solicitud",
                      message: "¿Estás seguro de que quieres aprobar esta solicitud de modificación de turno?",
                      confirmButtonText: "Aprobar",
                      confirmButtonColor: "success"
                    })}
                    onReject={(id) => uiSend({ 
                      type: "OPEN_CONFIRMATION_DIALOG", 
                      action: 'reject', 
                      requestId: String(id),
                      title: "Rechazar Solicitud",
                      message: "¿Estás seguro de que quieres rechazar esta solicitud de modificación de turno?",
                      confirmButtonText: "Rechazar",
                      confirmButtonColor: "error"
                    })}
                    isLoading={uiState.context.toggleStates.loadingApprove === request.id || uiState.context.toggleStates.loadingReject === request.id}
                  >
                    <Typography variant="body2" color="text.secondary">
                      <strong>Fecha actual:</strong> {formatDateTime(request.currentScheduledAt, "DD/MM/YYYY HH:mm")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Fecha solicitada:</strong> {formatDateTime(request.requestedScheduledAt, "DD/MM/YYYY HH:mm")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Cambio:</strong> {
                        isDateChange && isTimeChange ? 'Nueva fecha y horario' :
                        isDateChange ? 'Nueva fecha' :
                        isTimeChange ? 'Nuevo horario' : 'Sin cambios'
                      }
                    </Typography>
                  </PendingCard>
                );
              })}
            </Box>
          </Box>
        ) : (
          <Box className="turnsmod-empty-state">
            <Avatar className="turnsmod-empty-emoji">
              <SearchOutlined />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              No hay solicitudes pendientes
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Todas las solicitudes han sido procesadas
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TurnsModifications;