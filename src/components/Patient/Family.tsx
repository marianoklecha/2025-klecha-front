import React from "react";
import { Box, Typography, CircularProgress, Avatar, Grid, Stack, TextField, useMediaQuery, useTheme, FormControl, InputLabel, Select, MenuItem, FormHelperText, Button, Divider, Card, CardContent, IconButton } from "@mui/material";
import { useDataMachine } from "#/providers/DataProvider";
import { calculateAge } from "#/models/Doctor"
import { dayjsArgentina, formatDateTime, nowArgentina } from '#/utils/dateTimeUtils';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import "./Family.css";
import ConfirmationModal from "#/components/shared/ConfirmationModal/ConfirmationModal";
import { FamilyMemberResponse } from "#/models/FamilyMember";
import { useMachines } from "#/providers/MachineProvider";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { motion, AnimatePresence } from "framer-motion"
import { Edit, Group, KeyboardArrowDown } from "@mui/icons-material";
import Diversity3Icon from '@mui/icons-material/Diversity3';


const Family: React.FC = () => {
  const { dataState } = useDataMachine();
  const { familyState, familySend, uiState, uiSend } = useMachines();
  const uiContext = uiState.context;
  const dataContext = dataState.context;
  const myFamily: FamilyMemberResponse[] = dataContext.myFamily || [];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const formValues = familyState?.context?.formValues || {};
  const formErrors = familyState?.context?.formErrors || {};
  const isLoadingMyFamily = dataContext.loading?.myFamily || dataContext.loading?.initializing;
  const loading = familyState?.context?.loading || false;
  const error = familyState?.context?.error;

  const hasErrors = Object.values(formErrors as Record<string, string>).some(error => error && error.length > 0);
  const allFieldsFilled = Object.values(formValues).every(value => value !== "" && value !== null && value !== undefined);
  const isButtonDisabled = loading || hasErrors || !allFieldsFilled;
  const isCreateFamilyVisible = uiContext.toggleStates?.['CreateFamily'] || false;
  const editingId = familyState?.context?.editingFamilyMemberId;
  const isEditing = Boolean(editingId);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    familySend({ type: "SAVE_FAMILY_MEMBER" });
  };

  return (
    <Box className="shared-container">
      {/* Header Section */}
      <Box className="shared-header">
        <Box className="shared-header-layout">
          <Box className="shared-header-content">
            <Avatar className="shared-header-icon">
              <Group sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" className="shared-header-title">
                Grupo Familiar
              </Typography>
              <Typography variant="h6" className="shared-header-subtitle">
                Administra los perfiles de tus familiares
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="viewturns-content">
        {/* Turns List Section */}
        { isLoadingMyFamily ? (
          <Box className="reservation-loading-container">
            <CircularProgress />
            <Typography className="reservation-loading-text">
              Cargando grupo familiar ...
            </Typography>
          </Box>
        ) :
        (myFamily.length) === 0 ? (
          <Box 
            className="viewturns-empty-state" 
            sx={{ 
              py: 6, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              bgcolor: 'rgba(240, 249, 255, 0.5)', 
              borderRadius: 4, 
              border: '2px dashed #bae6fd' 
            }}
          >
            <Avatar sx={{ width: 80, height: 80, bgcolor: '#e0f2fe', mb: 2 }}>
              <Diversity3Icon sx={{ fontSize: 40, color: '#0284c7' }} />
            </Avatar>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Tu grupo familiar está vacío
            </Typography>
          </Box>
        ) : 
        (null)
        }

        <Grid container spacing={2} size={12} className="viewturns-list-section">
            {           
              myFamily.map((familyMember: FamilyMemberResponse, index: number) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={familyMember.id || index} className="viewturns-turn-item">             
                    {/* Detalles del turno */}
                    <Box className="viewturns-turn-details" display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Box display="flex" alignItems="center" gap={2} flex={1} overflow="hidden">
                          <Avatar 
                            sx={{ 
                              width: 50, 
                              height: 50, 
                              bgcolor: 'var(--cerulean)',
                              fontSize: 20,
                              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                              flexShrink: 0
                            }}
                          >
                              {familyMember.name.charAt(0)}{familyMember.surname.charAt(0)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                              <Typography variant="h6" className="viewturns-doctor-text" noWrap>
                              {familyMember.name} {familyMember.surname}
                              </Typography>
                              <Typography variant="body1" className="viewturns-specialty-text" noWrap>
                                  Relación: {familyMember.relationship}
                              </Typography>
                              <Typography variant="body1" className="viewturns-specialty-text" noWrap>
                                  Edad: {calculateAge(familyMember.birthdate)} años
                              </Typography>
                              <Typography variant="body1" className="viewturns-specialty-text" noWrap>
                                DNI: {familyMember.dni}
                              </Typography>
                          </Box>
                        </Box>
                        <IconButton 
                          sx={{ ml: 1, flexShrink: 0 }}
                          onClick= {() => {
                            familySend({ type: "SET_EDIT_FAMILY_MEMBER", member: familyMember});
                            if (!isCreateFamilyVisible) {
                              uiSend({type: "TOGGLE", key: "CreateFamily"});
                            }
                            setTimeout(() => {
                              document.getElementById('add-family-form')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                        >
                          <Edit></Edit>
                        </IconButton>
                    </Box>
                </Grid>
              ))
            }

            {/* Add Family Section */}
            <Grid size={12} id="add-family-form" sx={{ mt: 2 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card 
                  className="enablehours-no-config-card" 
                  sx={{ 
                    overflow: 'visible', 
                    border: isCreateFamilyVisible ? '2px solid var(--cerulean)' : '1px solid #e0e0e0',
                    transition: 'all 0.3s ease',
                    backgroundColor: isCreateFamilyVisible ? '#fff' : '#fafafa'
                  }}
                >
                    <CardContent className="enablehours-no-config-content" sx={{ p: '24px !important', textAlign: 'left !important' }}>
                      <Box 
                        className="viewturns-filters-header" 
                        onClick={() => {
                            uiSend({ type: "TOGGLE", key: "CreateFamily" });
                            familySend({type: "CANCEL_EDIT"});
                          }}
                        sx={{ 
                          cursor: 'pointer', 
                          justifyContent: 'space-between !important',
                          '&:hover': { opacity: 0.8 }
                        }}
                      >
                        <Box flexDirection={"row"} display={"flex"} alignItems={"center"} gap={2}>
                            <Avatar sx={{ bgcolor: isCreateFamilyVisible ? 'var(--cerulean)' : '#e0e0e0', width: 40, height: 40 }}>
                              <PersonAddAlt1Icon sx={{ color: isCreateFamilyVisible ? 'white' : '#757575'}}/>
                            </Avatar>
                            <Box textAlign="left">
                              <Typography variant="h6" className="viewturns-section-title">
                                  {isEditing ? "Editar Familiar" : "Añadir nuevo familiar"}
                              </Typography>
                              {!isCreateFamilyVisible && (
                                <Typography variant="body2" color="text.secondary">
                                  Haz clic para desplegar el formulario
                                </Typography>
                              )}
                            </Box>
                        </Box>  
                        <IconButton
                          sx={{ 
                            color: 'var(--cerulean)', 
                            transform: isCreateFamilyVisible ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s'
                          }}
                        >
                            <KeyboardArrowDown />
                        </IconButton>                  
                      </Box>  

                      <AnimatePresence>
                          {(isCreateFamilyVisible && !loading) ? (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ overflow: 'hidden' }}
                            >                                                       
                              <Divider sx={{ my: 3 }} />
                              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                                <Stack className="register-form-stack">
                                  <Stack direction={isMobile ? "column" : "row"} spacing={2} className="register-form-row">
                                    <TextField
                                        label="Nombre"
                                        name="name"
                                        fullWidth
                                        required
                                        value={formValues.name || ""}
                                        onChange={(e) => familySend({ type: "UPDATE_FORM", key: "name", value: e.target.value })}
                                        error={!!formErrors.name}
                                        helperText={formErrors.name || " "}
                                        className="auth-field"
                                        sx={{mt:5}}
                                    />
                                    <TextField
                                        label="Apellido"
                                        name="surname"
                                        fullWidth
                                        required
                                        value={formValues.surname || ""}
                                        onChange={(e) => familySend({ type: "UPDATE_FORM", key: "surname", value: e.target.value })}
                                        error={!!formErrors.surname}
                                        helperText={formErrors.surname || " "}
                                        className="auth-field"
                                    />
                                  </Stack>

                                  <Stack direction={isMobile ? "column" : "row"} spacing={2} className="register-form-row">
                                    <TextField
                                        label="DNI"
                                        name="dni"
                                        type="number"
                                        fullWidth
                                        required
                                        value={formValues.dni || ""}
                                        onChange={(e) => familySend({ type: "UPDATE_FORM", key: "dni", value: e.target.value })}
                                        error={!!formErrors.dni}
                                        helperText={formErrors.dni || " "}
                                        className="auth-field"
                                    />

                                    <FormControl
                                        fullWidth
                                        required
                                        error={!!formErrors.gender}
                                        className="auth-field register-form-control"
                                    >
                                        <InputLabel id="genero-label">Género</InputLabel>
                                        <Select
                                        labelId="genero-label"
                                        id="genero"
                                        name="gender"
                                        value={formValues.gender || ""}
                                        label="Género"
                                        fullWidth
                                        onChange={(e) => familySend({ type: "UPDATE_FORM", key: "gender", value: e.target.value })}
                                        >
                                        <MenuItem value={"MALE"}>Masculino</MenuItem>
                                        <MenuItem value={"FEMALE"}>Femenino</MenuItem>
                                        </Select>
                                        <FormHelperText>
                                        {formErrors.gender || " "}
                                        </FormHelperText>
                                    </FormControl>                          
                                  </Stack>

                                  <Stack direction={isMobile ? "column" : "row"} spacing={2} className="register-form-row">
                                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                                      <DatePicker
                                      label="Fecha de Nacimiento"
                                      format="DD/MM/YYYY"
                                      value={formValues.birthdate ? dayjsArgentina(formValues.birthdate) : null}
                                      maxDate={nowArgentina().subtract(18, 'year')}
                                      minDate={nowArgentina().subtract(120, 'year')}
                                      views={['year', 'month', 'day']}
                                      openTo="year"
                                      onChange={(date) => familySend({ 
                                          type: "UPDATE_FORM", 
                                          key: "birthdate", 
                                          value: date ? date.toISOString() : null 
                                      })}
                                      slotProps={{
                                          textField: {
                                          required: true,
                                          fullWidth: true,
                                          name: "birthdate",
                                          error: !!formErrors.birthdate,
                                          helperText: formErrors.birthdate || " ",
                                          className: "auth-field",
                                          placeholder: "DD/MM/YYYY"
                                          },
                                          field: {
                                          clearable: true
                                          }
                                      }}
                                      />
                                    </LocalizationProvider>
                                    <FormControl
                                        fullWidth
                                        required
                                        error={!!formErrors.relationship}
                                        className="auth-field register-form-control"
                                    >
                                        <InputLabel id="genero-label">Relación</InputLabel>
                                        <Select
                                        labelId="genero-label"
                                        id="relationship"
                                        name="relationship"
                                        value={formValues.relationship || ""}
                                        label="Relación"
                                        fullWidth
                                        onChange={(e) => familySend({ type: "UPDATE_FORM", key: "relationship", value: e.target.value })}
                                        >
                                        <MenuItem value={"Nieto"}>Nieto</MenuItem>
                                        <MenuItem value={"Nieta"}>Nieta</MenuItem>
                                        <MenuItem value={"Hijo"}>Hijo</MenuItem>
                                        <MenuItem value={"Hija"}>Hija</MenuItem>
                                        <MenuItem value={"Hermano"}>Hermano</MenuItem>
                                        <MenuItem value={"Hermana"}>Hermana</MenuItem>
                                        <MenuItem value={"Padre"}>Padre</MenuItem>
                                        <MenuItem value={"Madre"}>Madre</MenuItem>
                                        <MenuItem value={"Abuelo"}>Abuelo</MenuItem>
                                        <MenuItem value={"Abuela"}>Abuela</MenuItem>
                                        </Select>
                                        <FormHelperText>
                                        {formErrors.relationship || " "}
                                        </FormHelperText>
                                    </FormControl>                          
                                  </Stack>     

                                  <Button
                                      type="submit"
                                      variant="contained"
                                      fullWidth
                                      size="large"
                                      disabled={isButtonDisabled}
                                      className="auth-submit-button"
                                  >
                                  { isEditing ? "Guardar Cambios" : "Añadir" }
                                  { loading ? (isEditing ? "Guardando cambios..." : "Añadiendo familiar..." ) : null}
                                  </Button>

                                  {error && (
                                  <Box className="auth-error-box">
                                      <Typography variant="body2" color="error" className="auth-message-text">
                                      {error}
                                      </Typography>
                                  </Box>
                                  )}
                                </Stack>
                              </Box>   
                            </motion.div>   
                          ) : (loading) ? (
                            <Box className="reservation-loading-container">
                              <CircularProgress />
                              <Typography className="reservation-loading-text">
                                Guardando perfil de familiar ...
                              </Typography>
                            </Box>
                          ) : (
                            null)
                          
                        }
                      </AnimatePresence>
                    </CardContent>
                </Card>
              </motion.div>                             
            </Grid>

            
        </Grid>
      </Box>
      
      <ConfirmationModal />
    </Box>
  );
};

export default Family;