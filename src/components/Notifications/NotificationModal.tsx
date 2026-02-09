import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  IconButton,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  Fade,
  Paper,
  CircularProgress,
  Backdrop,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  Close, 
  Delete, 
  CheckCircle, 
  Warning, 
  NotificationsActive,
  MarkEmailRead,
  Schedule
} from '@mui/icons-material';
import { useMachines } from '#/providers/MachineProvider';
import { useDataMachine } from '#/providers/DataProvider';
import { NotificationResponse } from '#/service/notification-service.service';
import { formatDateTime } from '#/utils/dateTimeUtils';

interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ open, onClose }) => {
  const { notificationState, notificationSend, uiSend, doctorSend } = useMachines();
  const { dataState } = useDataMachine();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const notifications: NotificationResponse[] = notificationState?.context?.notifications || [];
  const isDeletingNotification = notificationState?.context?.isDeletingNotification || false;
  const isDeletingAllNotifications = notificationState?.context?.isDeletingAllNotifications || false;
  const userRole = dataState?.context?.userRole;

  const handleDeleteNotification = (notificationId: string) => {
    if (!isDeletingNotification && !isDeletingAllNotifications) {
      notificationSend({ type: "DELETE_NOTIFICATION", notificationId });
    }
  };

  const handleMarkAllAsRead = () => {
    if (!isDeletingNotification && !isDeletingAllNotifications) {
      notificationSend({ type: "DELETE_ALL_NOTIFICATIONS" });
    }
  };

  const handleNotificationClick = (notification: NotificationResponse) => {
    const { type, relatedEntityId } = notification;
    
    switch (type) {
      case 'TURN_CANCELLED':
        if (userRole === 'PATIENT') {
          uiSend({ type: "NAVIGATE", to: "/patient/view-turns" });
        } else if (userRole === 'DOCTOR') {
          uiSend({ type: "NAVIGATE", to: "/doctor/view-turns" });
        }
        break;
        
      case 'MODIFY_REQUEST_APPROVED':
      case 'MODIFY_REQUEST_REJECTED':
        uiSend({ type: "NAVIGATE", to: "/patient/view-turns" });
        break;
        
      case 'PATIENT_FILE_UPLOADED':
      case 'TURN_RESERVED':
        navigateToPatientDetails(relatedEntityId);
        break;
    }
    
    onClose();
  };

  const navigateToPatientDetails = (turnId: string) => {
    const turns = dataState?.context?.myTurns || [];
    const turn = turns.find((t: any) => t.id === turnId);
    
    if (turn && turn.patientId) {
      doctorSend({ type: "SELECT_PATIENT", patientId: turn.patientId });
    } else {
      uiSend({ type: "NAVIGATE", to: "/doctor/view-patients" });
    }
  };

  const getSeverityIcon = (message: string) => {
    const isWarning = message.toLowerCase().includes('rechazada') || 
                     message.toLowerCase().includes('cancelado');
    return isWarning ? <Warning color="warning" /> : <CheckCircle color="success" />;
  };

  const getSeverityColor = (message: string) => {
    const isWarning = message.toLowerCase().includes('rechazada') || 
                     message.toLowerCase().includes('cancelado');
    return isWarning ? 'warning' : 'success';
  };

  return (
    <Dialog
      open={open}
      onClose={isDeletingAllNotifications ? undefined : onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown={isDeletingAllNotifications}
      PaperProps={{
        sx: {
          maxHeight: isMobile ? '100vh' : '85vh',
          borderRadius: isMobile ? 0 : '16px',
          boxShadow: '0 12px 30px rgba(34, 87, 122, 0.15)',
          border: isMobile ? 'none' : '1px solid #e2e8f0',
        },
      }}
    >
      {/* Loading Backdrop for Delete All Operation */}
      <Backdrop
        open={isDeletingAllNotifications}
        sx={{
          position: 'absolute',
          zIndex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 2,
          color: '#22577a' 
        }}>
          <CircularProgress size={48} color="inherit" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Eliminando notificaciones...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Por favor espera mientras se procesan las eliminaciones
          </Typography>
        </Box>
      </Backdrop>

      <DialogTitle 
        sx={{ 
          background: 'linear-gradient(135deg, #22577a 0%, #2d7d90 100%)',
          color: 'white',
          padding: isMobile ? '16px' : '24px 32px',
          borderRadius: isMobile ? 0 : '16px 16px 0 0',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(34, 87, 122, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)', 
            width: isMobile ? 32 : 40, 
            height: isMobile ? 32 : 40,
            backdropFilter: 'blur(10px)',
          }}>
            <NotificationsActive sx={{ color: 'white', fontSize: isMobile ? 20 : 24 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Notificaciones
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {notifications.length === 0 
                ? 'No hay notificaciones' 
                : `${notifications.length} notificación${notifications.length !== 1 ? 'es' : ''}`
              }
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {notifications.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleMarkAllAsRead}
              disabled={isDeletingAllNotifications || isDeletingNotification}
              startIcon={isDeletingAllNotifications ? <CircularProgress size={16} color="inherit" /> : <MarkEmailRead />}
              sx={{ 
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:disabled': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                textTransform: 'none',
                fontWeight: 500,
                minWidth: isMobile ? 'auto' : 'inherit',
                px: isMobile ? 1 : undefined
              }}
            >
              {isDeletingAllNotifications ? 'Eliminando...' : (isMobile ? 'Leídas' : 'Marcar todas como leídas')}
            </Button>
          )}
          <IconButton 
            onClick={onClose} 
            size="small"
            disabled={isDeletingAllNotifications}
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:disabled': {
                color: 'rgba(255, 255, 255, 0.5)',
              }
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, backgroundColor: '#f8fafc' }}>
        {notifications.length === 0 ? (
          <Box sx={{ 
            p: 6, 
            textAlign: 'center',
            backgroundColor: 'white',
          }}>
            <Avatar sx={{ 
              mx: 'auto', 
              mb: 3, 
              width: 80, 
              height: 80,
              bgcolor: '#f1f5f9',
              border: '3px solid #e2e8f0',
            }}>
              <NotificationsActive sx={{ fontSize: 40, color: '#64748b' }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: '#1f4f6f', mb: 1, fontWeight: 600 }}>
              No hay notificaciones nuevas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cuando tengas nuevas notificaciones aparecerán aquí
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <Fade in={true} timeout={300 + index * 100} key={notification.id}>
                <Paper 
                  elevation={0}
                  sx={{
                    mb: index === notifications.length - 1 ? 0 : 1,
                    mx: 2,
                    mt: index === 0 ? 2 : 0,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(34, 87, 122, 0.1)',
                      borderColor: '#22577a',
                    }
                  }}
                >
                  <ListItem
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      py: isMobile ? 2 : 3,
                      px: isMobile ? 2 : 3,
                      backgroundColor: 'white',
                      position: 'relative',
                      cursor: 'pointer',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        backgroundColor: getSeverityColor(notification.message) === 'warning' ? '#f59e0b' : '#57cc99',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', ml: isMobile ? 0 : 1 }}>
                      <Avatar sx={{ 
                        mr: isMobile ? 1.5 : 2, 
                        mt: 0.5,
                        width: isMobile ? 40 : 48,
                        height: isMobile ? 40 : 48,
                        bgcolor: getSeverityColor(notification.message) === 'warning' 
                          ? 'rgba(245, 158, 11, 0.1)' 
                          : 'rgba(87, 204, 153, 0.1)',
                        border: `2px solid ${getSeverityColor(notification.message) === 'warning' ? '#f59e0b' : '#57cc99'}`,
                      }}>
                        {getSeverityIcon(notification.message)}
                      </Avatar>
                      
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" component="div" sx={{ 
                            fontWeight: 600, 
                            color: '#0d2230',
                            fontSize: isMobile ? '0.95rem' : '1rem'
                          }}>
                            Nueva Notificación
                          </Typography>
                          <Chip 
                            label={getSeverityColor(notification.message) === 'warning' ? 'Atención' : 'Confirmación'}
                            size="small"
                            color={getSeverityColor(notification.message) as any}
                            variant="filled"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        </Box>
                        
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: '#1f4f6f',
                            lineHeight: 1.6,
                            wordWrap: 'break-word',
                            mb: 2,
                            fontSize: isMobile ? '0.875rem' : '0.95rem',
                          }}
                        >
                          {notification.message}
                        </Typography>
                        
                        {notification.createdAt && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Schedule sx={{ fontSize: 16, color: '#64748b' }} />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#64748b',
                                fontWeight: 500,
                              }}
                            >
                              {formatDateTime(notification.createdAt)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        size="small"
                        disabled={isDeletingNotification || isDeletingAllNotifications}
                        sx={{ 
                          ml: 1,
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                          },
                          '&:disabled': {
                            color: '#94a3b8',
                          }
                        }}
                      >
                        {isDeletingNotification ? 
                          <CircularProgress size={20} color="inherit" /> : 
                          <Delete />
                        }
                      </IconButton>
                    </Box>
                  </ListItem>
                </Paper>
              </Fade>
            ))}
            <Box sx={{ height: 16 }} /> {/* Bottom spacing */}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;