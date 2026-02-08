import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography,
  Rating, Box, Paper, Chip
} from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useDataMachine } from '#/providers/DataProvider';
import { useMachines } from '#/providers/MachineProvider';
import { useAuthMachine } from '#/providers/AuthProvider';
import { SignInResponse } from '#/models/Auth';
import { TurnService } from '#/service/turn-service.service';
import { orchestrator } from '#/core/Orchestrator';
import { UI_MACHINE_ID } from '#/machines/uiMachine';
import { formatDateTime } from '#/utils/dateTimeUtils';
import './RatingModal.css';

const RatingModal = () => {
  const { uiState, ratingState, ratingSend } = useMachines();
  const { dataState } = useDataMachine();
  const { authState } = useAuthMachine();
  
  const user = authState?.context?.authResponse as SignInResponse;
  const modalData = uiState.context.ratingModal;
  const open = modalData.open;
  const turn = modalData.turn;
  
  const ratingSubcategories = dataState.context.ratingSubcategories || [];
  const isLoadingSubcategories = dataState.context.loading?.ratingSubcategories || false;
  const subcategoriesError = dataState.context.errors?.ratingSubcategories;
  const accessToken = dataState.context.accessToken;
  const turnsNeedingRating = dataState.context.turnsNeedingRating || [];
    
  const rating = ratingState?.context?.rating || 0;
  const subcategories = ratingState?.context?.subcategories || [];
  const loading = ratingState?.context?.loading || false;
  
  const currentTurnIndex = turnsNeedingRating.findIndex((t: any) => t.id === turn?.id);
  const currentPosition = currentTurnIndex >= 0 ? currentTurnIndex + 1 : 1;
  const totalTurns = turnsNeedingRating.length;
  const showProgress = totalTurns > 1;
  
  const isDoctor = user?.role === 'DOCTOR';
  const displayName = isDoctor ? turn?.patientName : `Dr. ${turn?.doctorName}`;
 
  const displayInfo = isDoctor ? 'Paciente' : (turn?.doctorSpecialty || 'Medicina General');

  const dataContext = dataState.context;
  const myPatients = isDoctor ? dataContext.doctorPatients : null;

  const getFamilyMember = (familyMemberId: string) => {
    if (!myPatients || !Array.isArray(myPatients)) return null;

    for (const patient of myPatients) {
      const member = patient.familyMembers?.find((m: any) => m.id === familyMemberId);
      if (member) return member;
    }
    return null;
  }

  const displayFamilyMemberName = turn?.familyMemberId ? getFamilyMember(turn.familyMemberId) : null;
  
  const handleClose = () => {
    if (isDoctor) {
      ratingSend({ type: 'RESET_RATING' });
      orchestrator.sendToMachine(UI_MACHINE_ID, { type: "CLOSE_RATING_MODAL" });
    }
  };

  const handleSuccessfulSubmit = () => {
    ratingSend({ type: 'RESET_RATING' });
    
    if (isDoctor) {
      orchestrator.sendToMachine("data", { type: "LOAD_MY_TURNS" });
      orchestrator.sendToMachine(UI_MACHINE_ID, { type: "CLOSE_RATING_MODAL" });
      return;
    }
    
    const currentTurnIndex = turnsNeedingRating.findIndex((t: any) => t.id === turn?.id);
    const nextTurnIndex = currentTurnIndex + 1;
    
    if (nextTurnIndex < turnsNeedingRating.length) {
      const nextTurn = turnsNeedingRating[nextTurnIndex];
      orchestrator.sendToMachine(UI_MACHINE_ID, { 
        type: "OPEN_RATING_MODAL", 
        turn: nextTurn 
      });
    } else {
      orchestrator.sendToMachine(UI_MACHINE_ID, { type: "CLOSE_RATING_MODAL" });
    }
  };

  const handleSubmit = async () => {
    if (!rating || !turn?.id || !accessToken) {
      return;
    }

    ratingSend({ type: 'START_SUBMIT' });
    try {
      await TurnService.createRating(
        turn.id,
        { score: rating, subcategories },
        accessToken
      );

      orchestrator.sendToMachine(UI_MACHINE_ID, {
        type: "OPEN_SNACKBAR",
        message: "Calificación enviada exitosamente",
        severity: "success"
      });

      ratingSend({ type: 'SUBMIT_SUCCESS' });
      handleSuccessfulSubmit();
    } catch (error) {
      orchestrator.sendToMachine(UI_MACHINE_ID, {
        type: "OPEN_SNACKBAR",
        message: error instanceof Error ? error.message : "Error al enviar la calificación",
        severity: "error"
      });
      ratingSend({ type: 'SUBMIT_ERROR' });
    }
  };

  const isValidSubmission = rating > 0;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!isDoctor}
      className="rating-modal"
    >
      <DialogTitle className="rating-modal-header">        
        <Box className="rating-modal-header-content">
          <MedicalServicesIcon />
          <Typography variant="h5" className="rating-modal-title">
            {showProgress 
              ? `Calificar consulta ${currentPosition} de ${totalTurns}`
              : 'Calificar Consulta'
            }
          </Typography>
        </Box>
        
        <Typography variant="body2" className="rating-modal-subtitle">
          Tu evaluación es <strong>confidencial</strong> y nos ayuda a mejorar
        </Typography>
      </DialogTitle>
      
      <DialogContent className="rating-modal-content">
        {turn && (
          <Paper className="rating-modal-info-card">
            <Box className="rating-modal-doctor-info">
              <Box className="rating-modal-doctor-details">
                {
                  (displayFamilyMemberName && isDoctor) ? (
                    <>
                      <Typography variant="h6" className="rating-modal-doctor-name">
                        Paciente: {displayFamilyMemberName.name} {displayFamilyMemberName.surname} ({displayFamilyMemberName.relationship})
                      </Typography>
                      <Typography variant="h6" className="rating-modal-doctor-name">
                        Familiar: {displayName}
                      </Typography>
                    </>
                    
                  ) : (
                    <Typography variant="h6" className="rating-modal-doctor-name">
                      {displayName}
                    </Typography>
                  )
                }
                
                <Typography variant="body2" className="rating-modal-doctor-specialty">
                  {displayInfo}
                </Typography>
                <Box className="rating-modal-appointment-details">
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(turn.scheduledAt, 'DD/MM/YYYY [a las] HH:mm')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        )}

        <Box className="rating-modal-rating-section">
          <Typography variant="h6" className="rating-modal-section-title">
            Calificación General
          </Typography>
          
          <Box className="rating-modal-rating-container">
            <Rating
              name="rating"
              value={rating}
              onChange={(_, newValue) => ratingSend({ type: 'SET_RATING', rating: newValue || 0 })}
              size="large"
              className="rating-modal-stars"
            />
            <Typography variant="body2" className="rating-modal-rating-description">
              {rating === 0 && 'Selecciona una calificación'}
              {rating === 1 && 'Muy insatisfecho'}
              {rating === 2 && 'Insatisfecho'}
              {rating === 3 && 'Neutral'}
              {rating === 4 && 'Satisfecho'}
              {rating === 5 && 'Muy satisfecho'}
            </Typography>
          </Box>
        </Box>

        <Box className="rating-modal-subcategory">
          <Typography variant="h6" className="rating-modal-section-title">
            Aspectos a Destacar (opcional)
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Selecciona hasta 3 aspectos
          </Typography>

          {subcategories.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {subcategories.map((value: string) => (
                <Chip 
                  key={value} 
                  label={value} 
                  size="small"
                  onDelete={() => {
                    ratingSend({ 
                      type: 'SET_SUBCATEGORIES', 
                      subcategories: subcategories.filter((s: string) => s !== value) 
                    });
                  }}
                  color="primary"
                />
              ))}
            </Box>
          )}
          
          <Box 
            sx={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              p: 1,
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: isLoadingSubcategories || subcategoriesError || ratingSubcategories.length === 0 ? 'center' : 'stretch',
              justifyContent: isLoadingSubcategories || subcategoriesError || ratingSubcategories.length === 0 ? 'center' : 'flex-start',
            }}
          >
            {isLoadingSubcategories ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Cargando categorías...
              </Typography>
            ) : subcategoriesError ? (
              <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
                Error al cargar categorías. Por favor, intenta de nuevo.
              </Typography>
            ) : ratingSubcategories.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                No hay categorías disponibles
              </Typography>
            ) : (
              ratingSubcategories.map((category: string) => (
                <Box
                  key={category}
                  onClick={() => {
                    if (subcategories.includes(category)) {
                      ratingSend({ 
                        type: 'SET_SUBCATEGORIES', 
                        subcategories: subcategories.filter((s: string) => s !== category) 
                      });
                    } else if (subcategories.length < 3) {
                      ratingSend({ 
                        type: 'SET_SUBCATEGORIES', 
                        subcategories: [...subcategories, category] 
                      });
                    }
                  }}
                  sx={{
                    p: 1.5,
                    mb: 0.5,
                    borderRadius: '4px',
                    cursor: subcategories.length >= 3 && !subcategories.includes(category) ? 'not-allowed' : 'pointer',
                    backgroundColor: subcategories.includes(category) ? 'primary.light' : 'transparent',
                    opacity: subcategories.length >= 3 && !subcategories.includes(category) ? 0.5 : 1,
                    '&:hover': {
                      backgroundColor: subcategories.includes(category) ? 'primary.light' : 'action.hover',
                    },
                    transition: 'all 0.2s',
                    color: subcategories.includes(category) ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">
                    {subcategories.includes(category) ? '✓ ' : ''}{category}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions className="rating-modal-actions">
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValidSubmission || loading}
          className="rating-modal-submit-btn"
        >
          {loading ? 'Enviando...' : 'Enviar Evaluación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RatingModal;