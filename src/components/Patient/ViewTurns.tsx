import React from "react";
import { Box, Button, Typography, CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem, Avatar } from "@mui/material";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useMachines } from "#/providers/MachineProvider";
import { useDataMachine } from "#/providers/DataProvider";
import { dayjsArgentina, nowArgentina, formatDateTime, formatTime } from '#/utils/dateTimeUtils';
import type { TurnModifyRequest } from "#/models/TurnModifyRequest";
import type { TurnResponse } from "#/models/Turn";
import ListAltIcon from "@mui/icons-material/ListAlt";
import EditIcon from "@mui/icons-material/Edit";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import "./ViewTurns.css";
import { orchestrator } from "#/core/Orchestrator";
import { filterTurns } from "#/utils/filterTurns";
import ConfirmationModal from "#/components/shared/ConfirmationModal/ConfirmationModal";
import { useTurnFileLogic } from "#/hooks/useTurnFileLogic";
import FileActions from "#/utils/FileActions/FileActions";
import { FamilyMemberResponse } from "#/models/FamilyMember";

const ViewTurns: React.FC = () => {
  const { turnState, turnSend, uiSend } = useMachines();
  const { dataState } = useDataMachine();

  const {
    fileInputRef,
    handleFileUpload,
    handleFileChange,
    handleDeleteFile,
    getTurnFileInfo,
    getFileStatus,
    truncateFileName,
    isUploadingFile,
    isDeletingFile
  } = useTurnFileLogic();

  const turnContext = turnState.context;
  const dataContext = dataState.context;
  const showTurnsContext = turnContext.showTurns;
  const { cancellingTurnId, isCancellingTurn } = turnContext;

  const allTurns: TurnResponse[] = dataContext.myTurns || [];
  const filteredTurns: TurnResponse[] = (filterTurns(allTurns, showTurnsContext.statusFilter, showTurnsContext.familyFilter) as TurnResponse[])
    .slice()
    .sort((a, b) => dayjsArgentina(b.scheduledAt).valueOf() - dayjsArgentina(a.scheduledAt).valueOf());
  const pendingModifyRequests = dataContext.myModifyRequests?.filter((r: TurnModifyRequest) => r.status === "PENDING") || [];

  const family = dataContext.myFamily;

  const handleCancelTurn = (turnId: string) => {
    const turnData = allTurns.find((turn: TurnResponse) => turn.id === turnId);
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

  const handleModifyTurn = (turnId: string) => {
    orchestrator.send({ type: "NAVIGATE", to: '/patient/modify-turn?turnId=' + turnId });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Programado';
      case 'CANCELED':
        return 'Cancelado';
      case 'NO_SHOW':
        return 'No Asistió';
      case 'AVAILABLE':
        return 'Disponible';
      case 'COMPLETED':
        return 'Completado';
      default:
        return status;
    }
  };

  const isTurnPast = (scheduledAt: string) => {
    return dayjsArgentina(scheduledAt).isBefore(nowArgentina());
  };

  const canCancelTurn = (turn: TurnResponse) => {
    return turn.status === 'SCHEDULED' && !isTurnPast(turn.scheduledAt);
  };

  const hasPendingModifyRequest = (turnId: string) => {
    return pendingModifyRequests.some((r: TurnModifyRequest) => r.turnId === turnId);
  };

  const canModifyTurn = (turn: TurnResponse) => {
    return turn.status === 'SCHEDULED' && !isTurnPast(turn.scheduledAt) && !hasPendingModifyRequest(turn.id);
  };

  const canUploadFile = (turn: TurnResponse) => {
    return turn.status === 'SCHEDULED' && !isTurnPast(turn.scheduledAt);
  };

  const canShowFileSection = (turn: TurnResponse) => {
    return turn.status === 'SCHEDULED' || turn.status === 'COMPLETED';
  };

  const canDeleteFile = (turn: TurnResponse) => {
    return turn.status !== 'COMPLETED';
  };

  return (
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
                Gestiona tus citas médicas
              </Typography>
            </Box>
          </Box>
          <Box className="shared-header-spacer"></Box>
        </Box>
      </Box>

      <Box className="viewturns-content">

        {/* Turns List Section */}
        <Box className="viewturns-list-section">
          <Box className="viewturns-list-content">
            <Box className="viewturns-filters-header">
              <Box flexDirection={"row"} display={"flex"} justifyContent={"flex-end"} alignItems={"center"} gap={1}>
                <FilterAltIcon sx={{color:"#3a67c9"}}/>
                <Typography variant="subtitle1" className="viewturns-section-title">
                  Filtros
                </Typography>
              </Box>
              
              <Box className="viewturns-filters-controls">
                <FormControl size="small" className="viewturns-filter-select">
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

                <FormControl size="small" className="viewturns-filter-select">
                  <InputLabel>Paciente</InputLabel>
                  <Select
                    value={showTurnsContext.familyFilter}
                    label="Paciente"
                    onChange={(e) => turnSend({
                      type: "UPDATE_FORM",
                      path: ["showTurns", "familyFilter"],
                      value: e.target.value
                    })}
                  >
                    <MenuItem value="">Todos</MenuItem>

                    { family && family.map((familyMember: FamilyMemberResponse) => (
                       <MenuItem key={familyMember.id} value={familyMember.id}>
                          {familyMember.name}
                        </MenuItem>
                      ))
                    }
                  
                  </Select>
                </FormControl>

                {(showTurnsContext.statusFilter || showTurnsContext.familyFilter) && (
                  <Button
                    variant="outlined"
                      onClick={() => 
                        {
                          turnSend({
                            type: "UPDATE_FORM",
                            path: ["showTurns", "statusFilter"],
                            value: ""
                          });
                          turnSend({
                            type: "UPDATE_FORM",
                            path: ["showTurns", "familyFilter"],
                            value: ""
                          }); 
                        }
                    }
                    className="viewturns-clear-filter-btn"
                  >
                    Limpiar filtro
                  </Button>
                )}
              </Box>
            </Box>


            {turnContext.isLoadingMyTurns ? (
              <Box className="viewturns-loading-container">
                <CircularProgress size={24} />
                <Typography className="viewturns-loading-text">
                  Cargando turnos...
                </Typography>
              </Box>
            ) : filteredTurns.length > 0 ? (
              filteredTurns.map((turn: TurnResponse, index: number) => (
                <Box key={turn.id || index} className="viewturns-turn-item">
                  <Box className="viewturns-turn-content">
                    
                    <Box className="viewturns-turn-info">                        
                      <Box className="viewturns-date-header">
                        
                        {turn.status === 'SCHEDULED' && isTurnPast(turn.scheduledAt) ? (
                          <Chip 
                            label="Programado" 
                            size="small"
                            className="viewturns-status-chip status-scheduled viewturns-chip-small"
                          />
                        ) : !hasPendingModifyRequest(turn.id) ? (
                          <Chip
                            label={getStatusLabel(turn.status)}
                            className={`viewturns-status-chip status-${turn.status.toLowerCase()}`}
                            size="small"
                          />
                        ) : null}
                        {hasPendingModifyRequest(turn.id) && (
                          <Chip
                            label="Cambio pendiente"
                            size="small"
                            color="info"
                            className="viewturns-chip-small"
                          />
                        )}

                        <Typography variant="body1" className="viewturns-turn-datetime viewturns-date-text">
                          {formatDateTime(turn.scheduledAt, "dddd, DD [de] MMMM [de] YYYY").replace(/^\w/, (c) => c.toUpperCase())}
                        </Typography>

                      </Box>

                      {/* Detalles del turno */}
                      <Box className="viewturns-turn-details">
                        <Typography variant="h5" className="viewturns-time-text">
                          {formatTime(turn.scheduledAt)} hs
                        </Typography>
                        <Box sx={{ml: 3}}>
                          {turn.familyMemberId && (
                            <Box sx={{mb:1}}>
                              <Typography variant="h6" className="viewturns-family-text">
                                Paciente: {family.find((m: any) => m.id === turn.familyMemberId).name } {family.find((m: any) => m.id === turn.familyMemberId).surname} ({family.find((m: any) => m.id === turn.familyMemberId).relationship})
                              </Typography>
                            </Box>
                          )}    
                          <Typography variant="h6" className="viewturns-doctor-text" >
                           {turn.doctorSpecialty} - Dr. {turn.doctorName} 
                          </Typography>
                        
                         
                          {turn.motive && (
                            <Typography variant="body2" className="viewturns-reason-text">
                              Motivo: {turn.motive=="HEALTH CERTIFICATE"?"Certificado de apto físico":turn.motive}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                          
                      
                      
                    </Box>
                    
                    {/* Sección de Acciones - Separada en dos grupos */}
                    <Box className="viewturns-turn-actions">
                      {/* Acciones Principales */}
                      <Box className={`viewturns-main-actions ${canShowFileSection(turn) ? 'viewturns-main-actions-conditional' : 'viewturns-main-actions-no-margin'}`}>
                        {canCancelTurn(turn) && (
                          <Button 
                            variant="outlined" 
                            size="small"
                            color="error"
                            className="viewturns-cancel-btn"
                            onClick={() => handleCancelTurn(turn.id)}
                            disabled={isCancellingTurn && cancellingTurnId === turn.id}
                          >
                            {isCancellingTurn && cancellingTurnId === turn.id ? (
                              <>
                                <CircularProgress size={16} className="viewturns-loading-spinner" />
                                Cancelando...
                              </>
                            ) : (
                              'Cancelar'
                            )}
                          </Button>
                        )}
                        {canModifyTurn(turn) && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleModifyTurn(turn.id)}
                            className="viewturns-modify-btn"
                          >
                            Reprogramar
                          </Button>
                        )}
                      </Box>
                      
                      {/* Sección de Archivos - Separada visualmente */}
                      {canShowFileSection(turn) && (
                        <Box className="viewturns-file-actions">
                          <FileActions
                            turnId={turn.id}
                            fileStatus={getFileStatus(turn.id)}
                            canUploadFile={canUploadFile(turn)}
                            canDeleteFile={canDeleteFile(turn)}
                            fileInfo={getTurnFileInfo(turn.id)}
                            isUploadingFile={isUploadingFile}
                            isDeletingFile={isDeletingFile}
                            onFileUpload={handleFileUpload}
                            onFileDelete={handleDeleteFile}
                            truncateFileName={truncateFileName}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))
            ) : (
              <Box className="viewturns-empty-state">
                <Avatar className="viewturns-empty-icon">
                  <SearchOutlined />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  No hay turnos disponibles
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {showTurnsContext.dateSelected || showTurnsContext.statusFilter
                    ? 'No hay turnos que coincidan con los filtros seleccionados'
                    : 'No tenés turnos registrados'
                  }
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />
      <ConfirmationModal />
    </Box>
  );
};
export default ViewTurns;