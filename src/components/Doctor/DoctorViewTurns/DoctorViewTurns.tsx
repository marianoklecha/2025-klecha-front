import React from "react";
import { 
  Box, Button, Typography, CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem, Avatar, Rating
} from "@mui/material";
import { useMachines } from "#/providers/MachineProvider";
import { useAuthMachine } from "#/providers/AuthProvider";
import { dayjsArgentina, nowArgentina, formatDateTime, formatTime } from '#/utils/dateTimeUtils';
import { SignInResponse } from "#/models/Auth";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { filterTurns } from "#/utils/filterTurns";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import "./DoctorViewTurns.css";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useDataMachine } from "#/providers/DataProvider";

const DoctorViewTurns: React.FC = () => {
  
  const { turnState, turnSend, uiSend } = useMachines();
  const { dataState } = useDataMachine();
  const { authState } = useAuthMachine();
  const authContext = authState?.context;
  const user = authContext?.authResponse as SignInResponse;
  
  const turnContext = turnState.context;
  const showTurnsContext = turnContext.showTurns;
  const { cancellingTurnId, isCancellingTurn } = turnContext;

  const dataContext = dataState.context;
  const myPatients = dataContext.doctorPatients;

  const filteredTurns = (filterTurns(turnContext.myTurns, showTurnsContext.statusFilter, null) || [])
    .slice()
    .sort((a: any, b: any) => dayjsArgentina(b.scheduledAt).valueOf() - dayjsArgentina(a.scheduledAt).valueOf());

  const handleCancelTurn = (turnId: string) => {
    if (!user.accessToken) return;
    const turnData = filteredTurns.find((turn: any) => turn.id === turnId);
    uiSend({ 
      type: "OPEN_CANCEL_TURN_DIALOG", 
      turnId,
      turnData,
      title: "Cancelar Turno",
      message: "¿Estás seguro de que quieres cancelar este turno? Esta acción no se puede deshacer.",
      confirmButtonText: "Cancelar Turno",
      confirmButtonColor: "error"
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Programado';
      case 'CANCELED':
        return 'Cancelado';
      case 'NO_SHOW':
        return 'No Asistió';
      case 'COMPLETED':
        return 'Completado';
      case 'AVAILABLE':
        return 'Disponible';
      default:
        return status;
    }
  };

  const isTurnPast = (scheduledAt: string) => {
    return dayjsArgentina(scheduledAt).isBefore(nowArgentina());
  };

  const canCancelTurn = (turn: any) => {
    return turn.status === 'SCHEDULED' && !isTurnPast(turn.scheduledAt);
  };

  const isPastScheduledTurn = (turn: any) => {
    return turn.status === 'SCHEDULED' && isTurnPast(turn.scheduledAt);
  };

  const isCompletedTurn = (turn: any) => {
    return turn.status === 'COMPLETED';
  };

  const turnNeedsRating = (turn: any) => {
    return turn.needsDoctorRating === true;
  };

  const handleCompleteTurn = (turnId: string) => {
    if (!user.accessToken) return;
    const turnData = filteredTurns.find((turn: any) => turn.id === turnId);
    uiSend({ 
      type: "OPEN_COMPLETE_TURN_DIALOG", 
      turnId,
      turnData,
      title: "Marcar Turno como Completado",
      message: "¿Confirmas que este turno fue atendido exitosamente?",
      confirmButtonText: "Marcar Completado",
      confirmButtonColor: "success"
    });
  };

  const handleNoShowTurn = (turnId: string) => {
    if (!user.accessToken) return;
    const turnData = filteredTurns.find((turn: any) => turn.id === turnId);
    uiSend({ 
      type: "OPEN_NO_SHOW_TURN_DIALOG", 
      turnId,
      turnData,
      title: "Marcar Turno como No Asistió",
      message: "¿Confirmas que el paciente no asistió a este turno?",
      confirmButtonText: "No Asistió",
      confirmButtonColor: "error"
    });
  };

  const handleRatePatient = (turnId: string) => {
    const turnToRate = filteredTurns.find((turn: any) => turn.id === turnId);
    if (turnToRate) {
      uiSend({ 
        type: "OPEN_RATING_MODAL", 
        turn: turnToRate 
      });
    }
  };

  const getFamilyMember = (familyMemberId: string) => {
    for (const patient of myPatients) {
      const member = patient.familyMembers?.find((m: any) => m.id === familyMemberId);
      if (member) return member;
    }
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="shared-container">
        {/* Header Section */}
        <Box className="shared-header">
          <Box className="shared-header-layout">
            <Box className="shared-header-content">
              <Avatar className="shared-header-icon">
                <ListAltIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" className="shared-header-title">
                  Mis Turnos
                </Typography>
                <Typography variant="h6" className="shared-header-subtitle">
                  Consulta y gestiona tus citas médicas
                </Typography>
              </Box>
            </Box>
            <Box className="shared-header-spacer"></Box>
          </Box>
        </Box>

        <Box className="doctor-viewturns-content">
        
          {/* Turns List Section */}
          <Box className="doctor-viewturns-list-section">
            <Box className="doctor-viewturns-list-content">
                <Box className="doctor-viewturns-filters-header">
                  <Box flexDirection={"row"} display={"flex"} justifyContent={"center"} alignItems={"center"} gap={1}>
                    <FilterAltIcon sx={{color:"#3a67c9"}}/>
                    <Typography variant="subtitle1" className="viewturns-section-title">
                      Filtros
                    </Typography>
                  </Box>
                  <Box className="doctor-viewturns-filters-controls">
                    <FormControl size="small" className="doctor-viewturns-filter-select">
                      <InputLabel>Estado del turno</InputLabel>
                      <Select
                        value={showTurnsContext.statusFilter}
                        label="Estado del turno"
                        onChange={(e) => turnSend({
                          type: "UPDATE_FORM",
                          path: ["showTurns", "statusFilter"],
                          value: e.target.value
                        })}
                      >
                        <MenuItem value="">Todos los estados</MenuItem>
                        <MenuItem value="SCHEDULED">Programados</MenuItem>
                        <MenuItem value="CANCELED">Cancelados</MenuItem>
                        <MenuItem value="NO_SHOW">No Asistió</MenuItem>
                        <MenuItem value="COMPLETED">Completados</MenuItem>
                      </Select>
                    </FormControl>

                    {showTurnsContext.statusFilter && (
                      <Button
                        variant="outlined"
                        onClick={() => turnSend({
                          type: "UPDATE_FORM",
                          path: ["showTurns", "statusFilter"],
                          value: ""
                        })}
                        className="doctor-viewturns-clear-filter-btn"
                      >
                        Limpiar filtro
                      </Button>
                    )}
                  </Box>
                </Box>


              {turnContext.isLoadingMyTurns ? (
                <Box className="doctor-viewturns-loading-container">
                  <CircularProgress size={24} />
                  <Typography className="doctor-viewturns-loading-text">
                    Cargando turnos...
                  </Typography>
                </Box>
              ) : filteredTurns.length > 0 ? (
                filteredTurns.map((turn: any, index: number) => (
                  <Box key={turn.id || index} className="doctor-viewturns-turn-item">
                    <Box className="doctor-viewturns-turn-content">
                      <Box className="doctor-viewturns-turn-info">
                        {/* Header: Fecha y Estado */}
                        <Box className="doctor-viewturns-date-header">
                          
                          {turn.status === 'SCHEDULED' && isTurnPast(turn.scheduledAt) ? (
                            <Chip 
                              label="Programado" 
                              size="small"
                              className="doctor-viewturns-status-chip status-scheduled doctor-viewturns-chip-small"
                            />
                          ) : (
                            <Chip
                              label={getStatusLabel(turn.status)}
                              className={`doctor-viewturns-status-chip status-${turn.status.toLowerCase()}`}
                              size="small"
                            />
                          )}
                          <Typography variant="body1" className="doctor-viewturns-turn-datetime doctor-viewturns-date-text">
                            {formatDateTime(turn.scheduledAt, "dddd, DD [de] MMMM [de] YYYY").replace(/^\w/, (c) => c.toUpperCase())}
                          </Typography>
                        </Box>

                        {/* Detalles del turno */}
                        <Box className="doctor-viewturns-turn-details">
                          <Typography variant="h5" className="doctor-viewturns-time-text">
                            {formatTime(turn.scheduledAt)} hs
                          </Typography>
                          <Box>
                            <Box className="doctor-viewturns-patient-info">
                              {turn.familyMemberId ? (
                                (() => {

                                const familyMember = getFamilyMember(turn.familyMemberId);
                                return familyMember ? (
                                  <Box>
                                    <Typography variant="h6" className="doctor-viewturns-patient-text">
                                      Familiar a cargo: { turn.patientName }
                                    </Typography>
                                    <Typography variant="h6" className="doctor-viewturns-patient-text">
                                      Paciente: { familyMember.name } { familyMember.surname } ({ familyMember.relationship })
                                    </Typography>
                                    
                                  </Box>
                                ) : null;
                              })()
                            ) : (
                              <Typography variant="h6" className="doctor-viewturns-patient-text">
                                Paciente: {turn.patientName || "Paciente"}
                              </Typography>
                            )}

                              {turn.patientScore != null && (
                                <Box className="doctor-viewturns-rating-container">
                                  <Rating 
                                    value={turn.patientScore} 
                                    readOnly 
                                    size="small" 
                                    precision={0.1}
                                    className="doctor-viewturns-rating"
                                  />
                                  <Typography 
                                    variant="body2" 
                                    className="doctor-viewturns-rating-text"
                                  >
                                    ({turn.patientScore.toFixed(1)})
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            {turn.motive && (
                              <Typography variant="body2" className="doctor-viewturns-reason-text">
                                Motivo: {turn.motive=="HEALTH CERTIFICATE"?"Certificado de apto físico":turn.motive}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        
                      </Box>
                      <Box className="doctor-viewturns-turn-actions">
                         <Box className="doctor-viewturns-main-actions">
                          {canCancelTurn(turn) && (
                            <Button 
                              variant="contained" 
                              size="small"
                              className="doctor-viewturns-cancel-btn"
                              onClick={() => handleCancelTurn(turn.id)}
                              disabled={isCancellingTurn && cancellingTurnId === turn.id}
                            >
                              {isCancellingTurn && cancellingTurnId === turn.id ? (
                                <>
                                  <CircularProgress size={16} className="doctor-viewturns-loading-spinner" />
                                  Cancelando...
                                </>
                              ) : (
                                'Cancelar turno'
                              )}
                            </Button>
                          )}
                          {isPastScheduledTurn(turn) && (
                            <>
                              <Button 
                                variant="contained" 
                                size="small"
                                className="doctor-viewturns-complete-btn"
                                onClick={() => handleCompleteTurn(turn.id)}
                                disabled={isCancellingTurn && cancellingTurnId === turn.id}
                              >
                                {isCancellingTurn && cancellingTurnId === turn.id ? (
                                  <>
                                    <CircularProgress size={16} className="doctor-viewturns-loading-spinner" />
                                    Procesando...
                                  </>
                                ) : (
                                  'Completado'
                                )}
                              </Button>
                              <Button 
                                variant="contained" 
                                size="small"
                                className="doctor-viewturns-noshow-btn"
                                onClick={() => handleNoShowTurn(turn.id)}
                                disabled={isCancellingTurn && cancellingTurnId === turn.id}
                              >
                                {isCancellingTurn && cancellingTurnId === turn.id ? (
                                  <>
                                    <CircularProgress size={16} className="doctor-viewturns-loading-spinner" />
                                    Procesando...
                                  </>
                                ) : (
                                  'No Asistió'
                                )}
                              </Button>
                            </>
                          )}
                          {isCompletedTurn(turn) && turnNeedsRating(turn) && (
                            <Button 
                              variant="contained" 
                              size="small"
                              className="doctor-viewturns-rate-btn"
                              onClick={() => handleRatePatient(turn.id)}
                            >
                              Calificar Paciente
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))
              ) : (
                <Box className="doctor-viewturns-empty-state">
                  <Avatar className="doctor-viewturns-empty-icon">
                    <SearchOutlined />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    No hay turnos disponibles
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    No tenés turnos registrados
                  </Typography>
                </Box>
              )}
            </Box>
            </Box>
          </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default DoctorViewTurns;