import React from "react";
import { Box, Typography, CircularProgress, Avatar, Grid, Stack, TextField, useMediaQuery, useTheme, FormControl, InputLabel, Select, MenuItem, FormHelperText, Button } from "@mui/material";
import { useDataMachine } from "#/providers/DataProvider";
import { dayjsArgentina, formatDateTime, nowArgentina } from '#/utils/dateTimeUtils';
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import PersonIcon from '@mui/icons-material/Person';
import "./ViewTurns.css";
import "./Family.css";
import ConfirmationModal from "#/components/shared/ConfirmationModal/ConfirmationModal";
import { FamilyMemberResponse } from "#/models/FamilyMember";
import { useMachines } from "#/providers/MachineProvider";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";


const Family: React.FC = () => {
  const { dataState } = useDataMachine();
  const { familyState, familySend } = useMachines();
  const dataContext = dataState.context;
  const myFamily: FamilyMemberResponse[] = dataContext.myFamily || [];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const formValues = familyState?.context?.formValues || {};
  const formErrors = familyState?.context?.formErrors || {};
  const loading = familyState?.context?.loading || false;
  const error = familyState?.context?.error;

  const hasErrors = Object.values(formErrors as Record<string, string>).some(error => error && error.length > 0);
  const allFieldsFilled = Object.values(formValues).every(value => value !== "" && value !== null && value !== undefined);
  const isButtonDisabled = loading || hasErrors || !allFieldsFilled;

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
              <ListAltIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" className="shared-header-title">
                Mi Familia
              </Typography>
              <Typography variant="h6" className="shared-header-subtitle">
                Gestiona los perfiles de familiares bajo tu cuidado
              </Typography>
            </Box>
          </Box>
          <Box className="shared-header-spacer"></Box>
        </Box>
      </Box>

      <Box className="viewturns-content">
        {/* Turns List Section */}
        <Grid container spacing={3} size = {12} className="viewturns-list-section">
            {dataContext.isLoadingMyFamily ? (
              <Box className="viewturns-loading-container">
                <CircularProgress size={24} />
                <Typography className="viewturns-loading-text">
                  Cargando ...
                </Typography>
              </Box>
            ) :               
              myFamily.map((familyMember: FamilyMemberResponse, index: number) => (
                <Grid size={6} key={familyMember.id || index} className="viewturns-turn-item">             
                    {/* Detalles del turno */}
                    <Box className="viewturns-turn-details" alignContent="center" justifyContent="left">
                        <Avatar className="family-header-icon" sx={{mt:2}}>
                            <PersonIcon sx={{ fontSize: 28}} />
                        </Avatar>
                        <Box >
                            <Typography variant="h6" className="viewturns-doctor-text" sx={{pl: 1}}>
                            {familyMember.name} {familyMember.surname} 
                            </Typography>
                            <Typography variant="body1" className="viewturns-specialty-text" sx={{pl: 1}}>
                            {familyMember.relationship} (DNI: {familyMember.dni})
                            </Typography>
                            <Typography variant="body1" className="viewturns-turn-datetime viewturns-date-text">
                                Fecha de Nacimiento: {formatDateTime(familyMember.birthdate, "DD [de] MMMM [de] YYYY").replace(/^\w/, (c) => c.toUpperCase())}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
              ))
            }

            <Grid size={12} className="viewturns-filters-section" gap={3}>

                <Box className="viewturns-filters-header">
                    <Box flexDirection={"row"} display={"flex"} justifyContent={"center"} alignItems={"center"} gap={1} sx={{mb:3}}>
                        <PersonAddAlt1Icon sx={{color:"#3a67c9"}}/>
                        <Typography variant="h6" className="viewturns-section-title">
                            Añadir nuevo familiar
                        </Typography>
                    </Box>                    
                </Box>                           
    
                <Box component="form" onSubmit={handleSubmit}>
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
                        <MenuItem value={"Hijo"}>Hijo</MenuItem>
                        <MenuItem value={"Hija"}>Hija</MenuItem>
                        <MenuItem value={"Hermano"}>Hermano</MenuItem>
                        <MenuItem value={"Hermana"}>Hermana</MenuItem>
                        <MenuItem value={"Padre"}>Padre</MenuItem>
                        <MenuItem value={"Madre"}>Madre</MenuItem>
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
                    {loading ? "Añadiendo familiar..." : "Añadir Familiar"}
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
                    

                
            </Grid>
        </Grid>
      </Box>
      
      <ConfirmationModal />
    </Box>
  );
};

export default Family;