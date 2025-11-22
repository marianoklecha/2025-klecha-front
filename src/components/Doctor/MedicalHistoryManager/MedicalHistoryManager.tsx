import React from 'react';
import {Box,Typography,Paper,Button,Alert,CircularProgress,Dialog,DialogTitle,DialogContent,DialogActions,
  IconButton,Card,CardContent,CardActions,Slide,Grow} from '@mui/material';
import {Delete,PersonOutlined,AccessTime,Warning} from '@mui/icons-material';
import type { MedicalHistory } from '#/models/MedicalHistory';
import { useMachines } from '#/providers/MachineProvider';
import { formatDateTime, dayjsArgentina } from '#/utils/dateTimeUtils';
import './MedicalHistoryManager.css';


interface MedicalHistoryManagerProps {
  patientId: string;
  patientName: string;
  patientSurname: string;
  onHistoryUpdate?: () => void;
}

const MedicalHistoryManager: React.FC<MedicalHistoryManagerProps> = ({patientId,patientName,patientSurname,onHistoryUpdate}) => {
  const { doctorState, uiState, uiSend, medicalHistoryState, medicalHistorySend} = useMachines();

  const accessToken = doctorState.context.accessToken;
  const doctorId = doctorState.context.doctorId;

  const histories = medicalHistoryState.context.medicalHistories || [];
  const loading = medicalHistoryState.context.isLoading;
  const error = medicalHistoryState.context.error;


  const sortedHistories = [...histories].sort((a, b) => 
    dayjsArgentina(b.createdAt).valueOf() - dayjsArgentina(a.createdAt).valueOf()
  );

  const isDeleteDialogOpen = uiState.context.toggleStates.deleteMedicalHistoryDialog || false;
  const isViewDialogOpen = uiState.context.toggleStates.viewMedicalHistoryDialog || false;
  const currentPatientId = medicalHistoryState.context.currentPatientId
  const entryToDelete = medicalHistoryState.context.selectedHistory?.id;
  const selectedHistoryForView = isViewDialogOpen ? medicalHistoryState.context.selectedHistory : null;


  if (patientId && accessToken && (patientId !== currentPatientId || currentPatientId === null)) {
    medicalHistorySend({
      type: 'LOAD_PATIENT_MEDICAL_HISTORY',
      patientId,
      accessToken,
      doctorId,
    });
  }

  const handleDeleteHistory = (historyId: string) => {
    if (isViewDialogOpen) {
      uiSend({ type: 'TOGGLE', key: 'viewMedicalHistoryDialog' });
    }
    medicalHistorySend({ type: 'CLEAR_SELECTION' });
    
    const historyToDelete = histories.find((h: MedicalHistory) => h.id === historyId);
    if (historyToDelete) {
      medicalHistorySend({ type: 'SELECT_HISTORY', history: historyToDelete });
      uiSend({ type: 'TOGGLE', key: 'deleteMedicalHistoryDialog' });
    }
  };

  const handleViewHistory = (history: MedicalHistory) => {
    medicalHistorySend({ type: 'CLEAR_SELECTION' });
    if (isDeleteDialogOpen) {
      uiSend({ type: 'TOGGLE', key: 'deleteMedicalHistoryDialog' });
    }
    medicalHistorySend({ type: 'SELECT_HISTORY', history });
    uiSend({ type: 'TOGGLE', key: 'viewMedicalHistoryDialog' });
  };

  const handleCloseViewDialog = () => {
    uiSend({ type: 'TOGGLE', key: 'viewMedicalHistoryDialog' });
    medicalHistorySend({ type: 'CLEAR_SELECTION' });
  };

  const handleConfirmDelete = () => {
    if (!entryToDelete || !accessToken || !doctorId) return;

    medicalHistorySend({type: 'DELETE_HISTORY_ENTRY',historyId: entryToDelete,accessToken,doctorId,});
    uiSend({ type: 'TOGGLE', key: 'deleteMedicalHistoryDialog' });
    medicalHistorySend({ type: 'CLEAR_SELECTION' });
    onHistoryUpdate?.();
  };

  const handleCancelDelete = () => {
    uiSend({ type: 'TOGGLE', key: 'deleteMedicalHistoryDialog' });
    medicalHistorySend({ type: 'CLEAR_SELECTION' });
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress className="loading-spinner" />
      </Box>
    );
  }

  return (
    <Box className="medical-history-container">
      <Box className="medical-history-header">
        <Typography variant="h6" className="medical-history-title">
          Historia Clínica
        </Typography>
      </Box>

      {loading && <CircularProgress className="loading-spinner" />}

      {error && (
        <Alert severity="error" className="error-alert">
          {error}
        </Alert>
      )}

      {!loading && sortedHistories.length === 0 && (
        <Paper elevation={2} className="empty-state">
          <Typography variant="body2" color="textSecondary">
            No hay entradas en la historia clínica para este paciente.
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Tip: Agregue historia clínica desde la vista de turnos para asociarla correctamente con la consulta.
          </Typography>
        </Paper>
      )}

      {sortedHistories.length > 0 && (
        <Grow in={true} timeout={600}>
          <Box className="histories-container">
            {sortedHistories.map((history: MedicalHistory, index: number) => (
              <Grow 
                key={history.id} 
                in={true} 
                timeout={400 + index * 150}
                style={{ transformOrigin: '0 0 0' }}
              >
              <Card 
                elevation={2}
                onClick={() => handleViewHistory(history)}
                className="history-card"
              >
                <CardContent>
                  <Box className="card-header">
                    <Box>
                      <Typography variant="subtitle2" className="doctor-info">
                        <PersonOutlined fontSize="small" />
                        Dr. {history.doctorName} {history.doctorSurname}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" className="timestamp-info">
                        <AccessTime fontSize="small" />
                        {formatDateTime(history.createdAt, 'DD/MM/YYYY HH:mm')}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body1" className="card-content-text">
                    {history.content}
                  </Typography>
                </CardContent>

                <CardActions className="card-actions">
                  {history.doctorId === doctorId && (
                    <Box className="card-actions-container">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation(); // Prevent card click event
                          handleDeleteHistory(history.id);
                        }}
                        disabled={loading}
                        color="error"
                        className="delete-button"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </CardActions>
              </Card>
            </Grow>
          ))}
          </Box>
        </Grow>
      )}

      <Dialog
        open={isViewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        TransitionComponent={Grow as any}
        TransitionProps={{ timeout: 400 } as any}
        PaperProps={{
          className: "view-dialog"
        }}
      >
        {selectedHistoryForView && (
          <>
            <DialogTitle className="view-dialog-title">
              <Box className="view-dialog-header">
                <PersonOutlined className="view-dialog-icon" />
                <Box>
                  <Typography variant="h6" className="view-dialog-title-text">
                    Historia Clínica - {patientName} {patientSurname}
                  </Typography>
                  <Typography variant="subtitle2" className="view-dialog-subtitle">
                    Dr. {selectedHistoryForView.doctorName} {selectedHistoryForView.doctorSurname}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent className="view-dialog-content">
              <Box className="content-timestamp-container">
                <Typography variant="caption" className="content-timestamp">
                  <AccessTime fontSize="small" />
                  {formatDateTime(selectedHistoryForView.createdAt, 'DD/MM/YYYY HH:mm')}
                </Typography>
              </Box>
              
              <Paper 
                elevation={0}
                className="content-paper"
              >
                <Typography 
                  variant="body1" 
                  className="content-text"
                >
                  {selectedHistoryForView.content}
                </Typography>
              </Paper>
            </DialogContent>
            
            <DialogActions className="view-dialog-actions">
              <Grow in={true} timeout={1200} style={{ transformOrigin: 'center bottom' }}>
                <Button 
                  onClick={handleCloseViewDialog}
                  variant="contained"
                  className="close-button"
                >
                  Cerrar
                </Button>
              </Grow>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide as any}
        TransitionProps={{ direction: "up" } as any}
        PaperProps={{
          className: "delete-dialog"
        }}
      >
        <DialogTitle className="delete-dialog-title">
          <Box className="delete-dialog-title-content">
            <Warning className="delete-dialog-warning-icon" />
            <span>Confirmar Eliminación</span>
          </Box>
        </DialogTitle>
        
        <DialogContent className="delete-dialog-content">
          <Typography variant="body1" className="delete-dialog-text">
            ¿Está seguro de que desea eliminar esta entrada del historial médico?
          </Typography>
          <Typography variant="body2" className="delete-dialog-subtext">
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        
        <DialogActions className="delete-dialog-actions">
          <Button 
            onClick={handleCancelDelete} 
            variant="outlined"
            className="cancel-button"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Delete />}
            className="confirm-delete-button"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default MedicalHistoryManager;