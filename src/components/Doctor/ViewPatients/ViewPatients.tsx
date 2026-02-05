import { 
    Avatar,
    Box, 
    Button, 
    List, 
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Typography,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert,
    Rating
} from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { useMachines } from "#/providers/MachineProvider"
import { PeopleOutlined, SearchOutlined, ChevronRight } from '@mui/icons-material'
import { Patient } from "#/models/Doctor"
import './ViewPatients.css'
import { useDataMachine } from "#/providers/DataProvider"

const ViewPatients: React.FC = () => {
    const { dataState, dataSend } = useDataMachine();
    const { doctorState, doctorSend } = useMachines();

    const doctorContext = doctorState.context;
    const dataContext = dataState.context;
    
    const patients: Patient[] = dataContext.doctorPatients || [];
    const isLoading = dataContext.loading.doctorPatients;
    const error = dataContext.errors.doctorPatients;
    const searchTerm = doctorContext.patientSearchTerm;

    const handlePatientClick = (patient: Patient) => {
        doctorSend({ type: "SELECT_PATIENT", patientId: patient.id });
    };

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.surname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getInitials = (name: string, surname: string) => {
        return (name[0] + surname[0]).toUpperCase();
    };

    const getFullName = (name: string, surname: string) => {
        return `${name} ${surname}`;
    };
    
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box className="viewpatients-container">
                <Box className="shared-header">
                    <Box className="shared-header-layout">

                        <Box className="shared-header-content">
                            <Avatar className="shared-header-icon">
                                <PeopleOutlined sx={{ fontSize: 28 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="h4" component="h1" className="shared-header-title">
                                    Mis Pacientes
                                </Typography>
                                <Typography variant="h6" className="shared-header-subtitle">
                                    Gestiona y consulta la información de tus pacientes
                                </Typography>                                                                                 
                            </Box>
                        </Box>
                        <Box className="shared-header-spacer"></Box>
                    </Box>
                </Box>

                <Box className="viewpatients-content">

                    {error && (
                        <Alert 
                            severity="error" 
                            action={
                                <Button color="inherit" size="small" onClick={() => dataSend({ type: "LOAD_DOCTOR_PATIENTS" })}>
                                    Reintentar
                                </Button>
                            }
                            className="viewpatients-error-alert"
                        >
                            {error}
                        </Alert>
                    )}

                    {isLoading ? (
                        <Box className="viewpatients-empty-state">
                            <CircularProgress size={40} className="viewpatients-loading-progress" />
                            <Typography variant="h6" gutterBottom>
                                Cargando pacientes...
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {filteredPatients.length > 0 ? (
                                <Box className="viewpatients-list-container">
                                    <Box className="viewpatients-search-and-count-container">
                                        <Box className="viewpatients-search-container">
                                            <TextField className="viewpatients-search-field" placeholder="Buscar por nombre..." value={searchTerm}
                                                onChange={(e) => doctorSend({ type: "SET_PATIENT_SEARCH", searchTerm: e.target.value })}
                                                disabled={isLoading}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchOutlined color="action" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Box>

                                        <Box className="viewpatients-patients-count">
                                            <Typography variant="body2">
                                                {filteredPatients.length} de {patients.length} paciente{patients.length !== 1 ? 's' : ''}
                                                {searchTerm && ' encontrado' + (filteredPatients.length !== 1 ? 's' : '')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <List>
                                        {filteredPatients.map((patient) => (
                                            <ListItem key={patient.id} disablePadding>
                                                <ListItemButton 
                                                    onClick={() => handlePatientClick(patient)}
                                                    className="viewpatients-patient-card viewpatients-patient-card-hover"
                                                >
                                                    <ListItemAvatar>
                                                        <Avatar className="viewpatients-patient-avatar">
                                                            {getInitials(patient.name, patient.surname)}
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText 
                                                        primary={
                                                            <Typography className="viewpatients-patient-name">
                                                                {getFullName(patient.name, patient.surname)}
                                                            </Typography>
                                                        }
                                                        secondary="Ver detalles del paciente"
                                                    />
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                                                        {((patient as any).score) != null ? (
                                                            <>
                                                                <Rating value={(patient as any).score} precision={0.1} readOnly size="small" />
                                                                <Typography variant="body2" color="text.secondary">{(patient as any).score.toFixed(1)}</Typography>
                                                            </>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">Sin calificación</Typography>
                                                        )}
                                                    </Box>
                                                    <ChevronRight color="action" />
                                                </ListItemButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            ) : (
                                <Box className="viewpatients-empty-state">
                                    <Avatar className="viewpatients-empty-icon">
                                        <SearchOutlined />
                                    </Avatar>
                                    <Typography variant="h6" gutterBottom>
                                        {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {searchTerm 
                                            ? 'Intenta con otros términos de búsqueda' 
                                            : 'Los pacientes aparecerán aquí cuando tengas turnos asignados'
                                        }
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        
        </LocalizationProvider>
    )
}

export default ViewPatients