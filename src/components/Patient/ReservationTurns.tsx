import { 
  Box, Button, FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectChangeEvent, 
  TextField, Typography, CircularProgress, Container, Avatar, Rating, Chip, Stack, Checkbox, ListItemText, FormControlLabel
} from "@mui/material";
import React from "react";
import { useMachines } from "#/providers/MachineProvider";
import { orchestrator } from "#/core/Orchestrator";
import { DATA_MACHINE_ID } from "#/machines/dataMachine";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { esES } from '@mui/x-date-pickers/locales';
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { DateCalendar } from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";
import dayjs from "#/utils/dayjs.config";
import 'dayjs/locale/es';
import { formatTime, dayjsArgentina, nowArgentina } from '#/utils/dateTimeUtils';
import Event from "@mui/icons-material/Event";
import "./ReservationTurns.css";
import { buildAvailableSubcats, buildDoctorSubcatMap, buildFilteredDoctors, requestRatedCountsForDoctors } from "#/utils/reservationUtils";

const ReservationTurns: React.FC = () => {
  const { turnState, turnSend } = useMachines();  
  const turnContext = turnState.context;
  const formValues = turnContext.takeTurn;

  const currentStep = turnState.value.takeTurn;

  const isProfessionSelected = !!formValues.professionSelected;
  const isDoctorSelected = !!formValues.doctorId;

  dayjs.locale('es');

 

  let ratedCountsSnapshot: Record<string, { subcategory: string | null; count: number }[]> = {};
  try {
    const dataSnapshot = orchestrator.getSnapshot(DATA_MACHINE_ID as any);
    ratedCountsSnapshot = dataSnapshot?.context?.ratedSubcategoryCounts || {};
  } catch (e) {
    ratedCountsSnapshot = {};
  }

  const doctorsBySpecialty = isProfessionSelected
    ? turnContext.doctors.filter((doctor: any) => doctor.specialty.toLowerCase() === formValues.professionSelected.toLowerCase())
    : [];
  const availableSubcats = buildAvailableSubcats(ratedCountsSnapshot);

  const doctorSubcatMap = buildDoctorSubcatMap(ratedCountsSnapshot);

  const minScore = formValues.filterMinScore ?? null;
  const selectedSubcats = formValues.filterSelectedSubcats ?? [];
  const filteredDoctors = buildFilteredDoctors(doctorsBySpecialty, doctorSubcatMap, minScore, selectedSubcats);

  const SUBCAT_COLOR_VARS = ['var(--lapis-lazuli)', 'var(--verdigris)', 'var(--emerald)'];

  const getColorForTop = (index: number) => {
    return SUBCAT_COLOR_VARS[index % SUBCAT_COLOR_VARS.length];
  };

  const resolveToHex = (value: string): string | null => {
    if (!value) return null;
    const varMatch = value.match(/^var\((--[a-zA-Z0-9-_]+)\)$/);
    let resolved = value;
    if (varMatch && typeof window !== 'undefined') {
      const prop = varMatch[1];
      const computed = getComputedStyle(document.documentElement).getPropertyValue(prop);
      if (computed) resolved = computed.trim();
    }

    const rgbMatch = resolved.match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    const hexMatch = resolved.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (hexMatch) {
      let h = hexMatch[0];
      if (h.length === 4) {
        h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
      }
      return h.toLowerCase();
    }

    return null;
  };

  const getContrastColor = (cssVarOrHex: string) => {
    const hex = resolveToHex(cssVarOrHex);
    if (!hex) return '#fff';
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000' : '#fff';
  };

  const selectedDoctor = turnContext.doctors.find((d: any) => d.id === formValues.doctorId) ?? null;

  const handleMotiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 500) {
      turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "motive"], value });
    }
  };

  const handleProfessionChange = (event: SelectChangeEvent) => {
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "professionSelected"], value: event.target.value });
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "doctorId"], value: "" });
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "profesionalSelected"], value: "" });
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "needsHealthCertificate"], value: false });
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "motive"], value: "" });

    const doctorsToFetch = turnContext.doctors.filter((doctor: any) => doctor.specialty.toLowerCase() === String(event.target.value).toLowerCase());
    if (doctorsToFetch.length) {
      requestRatedCountsForDoctors(doctorsToFetch);
    }
  };
  
  const handleDoctorChange = (event: SelectChangeEvent) => {
    const selectedDoctor = turnContext.doctors.find((doctor: any) => doctor.id === event.target.value);
    
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "doctorId"], value: event.target.value });
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "profesionalSelected"], value: selectedDoctor ? `${selectedDoctor.name} ${selectedDoctor.surname}` : "" });
    
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "dateSelected"], value: null });
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "timeSelected"], value: null });
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "scheduledAt"], value: null });
    
    if (event.target.value) {
      orchestrator.sendToMachine(DATA_MACHINE_ID, { 
        type: "LOAD_AVAILABLE_DATES", 
        doctorId: event.target.value 
      });
    }
  };



  const handleDateChange = (newValue: Dayjs | null) => {
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "dateSelected"], value: newValue });
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "timeSelected"], value: null });
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "scheduledAt"], value: null });
    
    if (newValue && formValues.doctorId) {
      orchestrator.sendToMachine(DATA_MACHINE_ID, { 
        type: "LOAD_AVAILABLE_TURNS", 
        doctorId: formValues.doctorId, 
        date: newValue.format('YYYY-MM-DD') 
      });
    }
  };

  const handleTimeSelect = (timeSlot: string) => {
    const selectedDateTime = dayjsArgentina(timeSlot);
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "timeSelected"], value: selectedDateTime });
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "scheduledAt"], value: timeSlot });
  };

  const handleReserve = async () => {
    if (!formValues.scheduledAt) return;
    try {
      turnSend({ type: "CREATE_TURN" });
    } catch (error) {
      console.error('Error creating turn:', error);
    }
  };

  const handleNext = () => {
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "dateSelected"], value: null });
    turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "scheduledAt"], value: null });
    
    turnSend({ type: "NEXT" });
  };

  return(
    <Box className="shared-container">
      {/* Page Header */}
      <Box className="shared-header">
        <Box className="shared-header-layout">

          <Box className="shared-header-content">
            <Avatar className="shared-header-icon">
              <Event sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" className="shared-header-title">
                Reservar Turno Médico
              </Typography>
              <Typography variant="h6" className="shared-header-subtitle">
                Agenda tu cita médica en simples pasos
              </Typography>
            </Box>
          </Box>

          <Box className="shared-header-spacer"></Box>
        </Box>
      </Box>

      <Container maxWidth="lg" className="reservation-page-container">

          {currentStep === "step1" && (
            <Box className="reservation-step1-container">
              <Box className="reservation-progress-indicator">
                <Box className="reservation-progress-step active">
                  1. Información de la consulta
                </Box>
                <Box className="reservation-progress-step inactive">
                  2. Selecciona fecha y horario
                </Box>
              </Box>

              <Box className="reservation-form-section">

                <FormControl required size="small" fullWidth className="reservation-select specialty-select">
                  <InputLabel id="profession-select-label">Especialidad</InputLabel>
                  <Select
                    labelId="profession-select-label"
                    id="profession-select"
                    value={formValues.professionSelected}
                    label="Especialidad *"
                    onChange={handleProfessionChange}
                    disabled={turnContext.isLoadingDoctors || turnContext.specialties.length === 0}
                  >
                    <MenuItem value="">
                      <em>Seleccione una especialidad</em>
                    </MenuItem>
                    {turnContext.specialties.map((specialty: { value: string; label: string }) => (
                      <MenuItem key={specialty.value} value={specialty.value}>
                        {specialty.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {turnContext.isLoadingDoctors && <FormHelperText>Cargando especialidades...</FormHelperText>}
                </FormControl>

                
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel id="min-score-label">Puntaje mínimo</InputLabel>
                    <Select
                      labelId="min-score-label"
                      id="min-score-select"
                      value={minScore != null ? String(minScore) : ''}
                      label="Puntaje mínimo"
                      onChange={(e: SelectChangeEvent) => { const v = e.target.value as string; turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "filterMinScore"], value: v === '' ? null : Number(v) }); }}
                    >
                      <MenuItem value="">
                        <em>Cualquiera</em>
                      </MenuItem>
                      {[0, 1, 2, 3, 4, 5].map(v => (
                        <MenuItem key={v} value={v}>{v}+</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="subcat-select-label">Subcategorías</InputLabel>
                    <Select
                      labelId="subcat-select-label"
                      id="subcat-select"
                      multiple
                      value={selectedSubcats}
                      onChange={(e) => turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "filterSelectedSubcats"], value: e.target.value as string[] })}
                      renderValue={(selected) => {
                        const items = selected as string[];
                        return (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 320 }}>
                            {items.map((it) => {
                              const idx = availableSubcats.indexOf(it);
                              const bg = getColorForTop(idx >= 0 ? idx : 0);
                              return (
                                <Chip
                                  key={`sel-${it}`}
                                  size="small"
                                  label={it}
                                  sx={{
                                    height: 26,
                                    fontSize: '0.72rem',
                                    backgroundColor: `${bg} !important`,
                                    color: `${getContrastColor(bg)} !important`,
                                  }}
                                />
                              );
                            })}
                          </Box>
                        );
                      }}
                      label="Subcategorías"
                      disabled={availableSubcats.length === 0}
                    >
                      {availableSubcats.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          <Checkbox checked={selectedSubcats.indexOf(opt) > -1} />
                          <ListItemText primary={opt} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <FormControl required size="small" fullWidth className="reservation-select">
                  <InputLabel id="doctor-select-label">Doctor</InputLabel>
                  <Select
                    labelId="doctor-select-label"
                    id="doctor-select"
                    value={formValues.doctorId}
                    label="Doctor *"
                    onChange={handleDoctorChange}
                    disabled={!isProfessionSelected || turnContext.isLoadingDoctors || filteredDoctors.length === 0}
                  >
                    <MenuItem value="">
                      <em>Seleccione un doctor</em>
                    </MenuItem>
                    {filteredDoctors.map((doctor: any) => (
                      <MenuItem key={doctor.id} value={doctor.id} sx={{ '&:hover': { transform: 'none !important' }, transition: 'none' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Box sx={{ mr: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {doctor.name} {doctor.surname}
                            {ratedCountsSnapshot[doctor.id] && ratedCountsSnapshot[doctor.id].length > 0 && (
                              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                                    {(() => {
                                      
                                     
                                      const raw = ratedCountsSnapshot[doctor.id] || [];
                                      return raw.map((s: any, idx: number) => {
                                        const bg = getColorForTop(idx);
                                        const label = s.subcategory ? `${s.subcategory} (${s.count})` : `(${s.count})`;
                                        return (
                                          <Chip
                                            key={`${doctor.id}-subcat-${idx}`}
                                            size="small"
                                            label={label}
                                            variant="filled"
                                            sx={{
                                              fontSize: '0.72rem',
                                              height: 26,
                                              backgroundColor: `${bg} !important`,
                                              color: `${getContrastColor(bg)} !important`,
                                              borderColor: `${bg} !important`,
                                              '& .MuiChip-label': { px: 1 },
                                            }}
                                            title={s.subcategory ?? 'No subcategory'}
                                          />
                                        );
                                      });
                                    })()}
                              </Stack>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {doctor.score != null ? (
                              <>
                                <Rating value={doctor.score} precision={0.1} readOnly size="small" />
                                <Typography variant="body2">{doctor.score.toFixed(1)}</Typography>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">Sin calificación</Typography>
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {!isProfessionSelected 
                      ? "Primero selecciona una especialidad" 
                      : "Requerido"
                    }
                  </FormHelperText>
                </FormControl>

                { !formValues.needsHealthCertificate && (
                  <TextField
                      label="Motivo de la consulta"
                      value={formValues.motive}
                      onChange={handleMotiveChange}
                      fullWidth
                      size="small"
                      className="reservation-input"
                      multiline
                      rows={3}
                      placeholder="Describe brevemente el motivo de tu consulta..."
                      helperText={`${formValues.motive?.length || 0}/500 caracteres`}
                      error={(formValues.motive?.length || 0) > 500}
                    />
                ) }
                
                {(() => {
                  const specialtyFromSelect = formValues.professionSelected || '';
                  const specialty = (selectedDoctor?.specialty || specialtyFromSelect).toString();
                  const canIssueHealthCertificate = specialty === "CLÍNICA MÉDICA" || specialty === 'PEDIATRÍA';
                  
                  if (canIssueHealthCertificate) {
                    return (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!formValues.needsHealthCertificate}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "needsHealthCertificate"], value: checked });
                              if (checked) {
                                turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "motive"], value: "HEALTH CERTIFICATE" });
                              } else {
                                const currentMotive = (formValues.motive || "").toString();
                                if (currentMotive.toUpperCase() === "HEALTH CERTIFICATE") {
                                  turnSend({ type: "UPDATE_FORM", path: ["takeTurn", "motive"], value: "" });
                                }
                              }
                            }}
                          />
                        }
                        label="Necesito apto físico"
                      />
                    );
                  }

                  return null;
                })()}
                
              </Box>

              <Box className="reservation-actions-step-1">
                <Button
                  onClick={handleNext}
                  variant="contained"
                  className="reservation-btn-primary"
                  disabled={
                    !isProfessionSelected ||
                    !isDoctorSelected
                  }
                >
                  Siguiente: Fecha y Horario →
                </Button>
              </Box>
            </Box>
          )}
          
          {currentStep === "step2" && (
            <Box className="reservation-step2-container">
              {/* Progress Indicator */}
              <Box className="reservation-progress-indicator">
                <Box className="reservation-progress-step completed">
                  ✓ 1. Información completada
                </Box>
                <Box className="reservation-progress-step active">
                  2. Selecciona fecha y horario
                </Box>
              </Box>

              <Box className="reservation-step2-content">
                <Box className="reservation-calendar-section">
                  <Box className="reservation-calendar-container">
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es" localeText={esES.components.MuiLocalizationProvider.defaultProps.localeText}>
                      <DemoContainer components={['DateCalendar']}>
                        <DemoItem>
                          <DateCalendar
                            value={formValues.dateSelected}
                            onChange={handleDateChange}
                            minDate={nowArgentina()}
                            shouldDisableDate={(date) => {
                              const dateString = date.format('YYYY-MM-DD');
                              const isDisabled = !turnContext.availableDates.includes(dateString);
                              return isDisabled;
                            }}
                            slotProps={{
                              day: (props: any) => {
                                const { day, ...other } = props;
                                const dateString = day.format('YYYY-MM-DD');
                                const hasAvailability = turnContext.availableDates.includes(dateString);
                                
                                return {
                                  ...other,
                                  sx: {
                                    ...other.sx,
                                    position: 'relative',
                                    '&::after': hasAvailability ? {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: '2px',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      width: '4px',
                                      height: '4px',
                                      borderRadius: '50%',
                                      backgroundColor: '#1976d2',
                                      opacity: 0.7,
                                    } : {},
                                  }
                                };
                              }
                            }}
                          />
                        </DemoItem>
                      </DemoContainer>
                    </LocalizationProvider>
                  </Box>
                  <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                    👨‍⚕️ Dr. {selectedDoctor?.name} {selectedDoctor?.surname}
                    {selectedDoctor?.score != null && (
                      <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Rating value={selectedDoctor.score} precision={0.1} readOnly size="small" />
                        <Box component="span" sx={{ fontWeight: 600 }}>{selectedDoctor.score.toFixed(1)}</Box>
                      </Box>
                    )}
                  </Typography>
                </Box>

                <Box className="reservation-time-section">
                  {!formValues.dateSelected ? (
                    <Box className="reservation-empty-state">
                      <Typography>
                        📅 Primero selecciona una fecha
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                        Elige una fecha en el calendario para ver los horarios disponibles
                      </Typography>
                    </Box>
                  ) : turnContext.isLoadingAvailableDates ? (
                    <Box className="reservation-loading-container">
                      <CircularProgress />
                      <Typography className="reservation-loading-text">
                        Cargando horarios disponibles...
                      </Typography>
                    </Box>
                  ) : turnContext.availableTurns.length > 0 ? (
                    <Box className="reservation-time-slots">
                      <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: '#1e3a8a', fontWeight: 600 }}>
                        {formValues.dateSelected.format("DD/MM/YYYY")}
                      </Typography>
                      <Box className="reservation-time-grid">
                        {(() => {
                          return turnContext.availableTurns
                            .filter((timeSlot: string) => {
                              const slotDateTime = dayjsArgentina(timeSlot);
                              const now = nowArgentina();
                              
                              if (slotDateTime.isSame(now, 'day')) {
                                return slotDateTime.isAfter(now);
                              }
                              
                              return slotDateTime.isAfter(now, 'day');
                            })
                            .map((timeSlot: string, index: number) => {
                              return (
                                <Button
                                  key={index}
                                  className={`reservation-time-slot-button ${formValues.scheduledAt === timeSlot ? 'selected' : ''}`}
                                  onClick={() => handleTimeSelect(timeSlot)}
                                  variant={formValues.scheduledAt === timeSlot ? 'contained' : 'outlined'}
                                >
                                  <Typography variant="body1" component="span" sx={{ fontWeight: 600 }}>
                                    {formatTime(timeSlot)}
                                  </Typography>
                                </Button>
                              );
                            });
                        })()}
                      </Box>
                    </Box>
                  ) : (
                    <Box className="reservation-loading-container">
                      <CircularProgress />
                      <Typography className="reservation-loading-text">
                        Cargando horarios disponibles...
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              
              <Box className="reservation-actions-step-2">
                <Button 
                  onClick={() => turnSend({ type: "BACK" })} 
                  className="reservation-btn-secondary"
                  variant="outlined"
                >
                  ← Atrás
                </Button>
                <Button
                  onClick={handleReserve}
                  variant="contained"
                  className="reservation-btn-primary"
                  disabled={!formValues.scheduledAt || turnContext.isCreatingTurn}
                >
                  {turnContext.isCreatingTurn ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Confirmando reserva...
                    </>
                  ) : (
                    '✓ Confirmar Reserva'
                  )}
                </Button>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    );
  }

  export default ReservationTurns;