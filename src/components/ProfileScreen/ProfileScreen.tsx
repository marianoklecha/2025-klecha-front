
import { Box, Button, Card, CardContent, Divider, List, ListItem, ListItemText, Typography, CircularProgress } from "@mui/material";

import { useAuthMachine } from "#/providers/AuthProvider";
import { SignInResponse } from "#/models/Auth";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { motion } from "framer-motion";
import { useMachines } from "#/providers/MachineProvider";

import EditField from "./EditField";
import { useEffect } from "react";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
const MotionCard = motion.create(Card);


const ProfileScreen: React.FC = () => {
    const { authState } = useAuthMachine();
    const { uiState, profileState, profileSend } = useMachines();
    const user = authState?.context?.authResponse as SignInResponse | null;
    const profile = profileState?.context?.profile;
    const uiContext = uiState?.context || {};

    const formContext = uiContext.toggleStates || {};
    const name= formContext["editName"] ?? false;
    const surname= formContext["editSurname"] ?? false;
    const phone= formContext["editNumberPhone"] ?? false;
    const minutes= formContext["editMinutes"] ?? false;
    const gender= formContext["editGender"] ?? false;
    const birthdate= formContext["editBirthdate"] ?? false;
    
    useEffect(() => {
        profileSend({ type: "INIT_PROFILE_PAGE" });
    }, [profileSend]);

    return (
        <Box
        sx={{
            p: { xs: 2, md: 4 },
            backgroundColor: "background.default",
            minHeight: "100vh",
        }}
        >
            <MotionCard
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.01, boxShadow: "0px 8px 24px rgba(0,0,0,0.12)" }}
                sx={{
                maxWidth: 600,
                mx: "auto",
                borderRadius: 3,
                boxShadow: 4,
                }}
            >
                 <CardContent>
                    <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    mb: 3,
                    }}
                    >
                       <AccountCircleIcon
                        sx={{ fontSize: 90, color: "primary.main", mb: 1 }}
                        /> 
                        <Typography variant="h6" fontWeight="bold">
                        Mi Perfil
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                        Acá podes ver y editar tu información personal
                        </Typography>
                    </Box>
                    {!profile ? (
                        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                            <CircularProgress />
                            <Typography sx={{ ml: 2 }}>Cargando perfil...</Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            <EditField  key="name" label="Nombre" value={profile.name} isEditing={name} toggleKey="editName" fieldKey="name" maxLength={50} onChange={(val) => profileSend({ type: "UPDATE_FORM", key: "name", value: val })}/>
                            <EditField  key= "surname" label="Apellido" value={profile.surname} isEditing={surname} toggleKey="editSurname" fieldKey="surname" maxLength={50} onChange={(val) => profileSend({ type: "UPDATE_FORM", key: "surname", value: val })} />
                            {/*<EditField key="email" label="Email" value={profile.email} isEditing={email} toggleKey="editEmail" fieldKey="email" onChange={(val) => profileSend({ type: "UPDATE_FORM", key: "email", value: val })}/>*/}
                            <ListItem>
                                <ListItemText primary={`Email `}  secondary={profile.email}/>
                            </ListItem>
                            <Divider component="li" />
                            <EditField key="phone" label="Telefono" value={profile.phone} isEditing={phone} toggleKey="editNumberPhone" fieldKey="phone" maxLength={20} onChange={(val) => profileSend({ type: "UPDATE_FORM", key: "phone", value: val })}/>
                            {/*<EditField key="dni" label="DNI" value={profile.dni} isEditing={dni} toggleKey="editDni" fieldKey="dni" onChange={(val) => profileSend({ type: "UPDATE_FORM", key: "dni", value: val })}/>*/}
                            <ListItem>
                                <ListItemText primary={`DNI `}  secondary={profile.dni}/>
                            </ListItem>
                            <Divider component="li" />
                                                        <EditField
                                                            key="gender"
                                                            label="Género"
                                                            value={profile.gender ?? ""}
                                                            displayValue={profile.gender === "MALE" ? "Masculino" : profile.gender === "FEMALE" ? "Femenino" : ""}
                                                            isEditing={gender}
                                                            toggleKey="editGender"
                                                            fieldKey="gender"
                                                            options={[
                                                                { value: "MALE", label: "Masculino" },
                                                                { value: "FEMALE", label: "Femenino" },
                                                            ]}
                                                            onChange={(val) => profileSend({ type: "UPDATE_FORM", key: "gender", value: val })}
                                                        />
                            <EditField key="birthdate" label="Fecha de nacimiento" value={profile.birthdate} isEditing={birthdate} toggleKey="editBirthdate" fieldKey="birthdate" onChange={(val) => profileSend({ type: "UPDATE_FORM", key: "birthdate", value: val })}/>

                            {user?.role === 'DOCTOR' && (
                            <>

                                <ListItem>
                                <ListItemText primary={`Matrícula Nacional `}  secondary={profile.medicalLicense}/>
                                </ListItem>
                                <Divider component="li" />
                                <ListItem>
                                <ListItemText primary={`Especialidad `}  secondary={profile.specialty}/>
                                </ListItem>
                                <Divider component="li" />
                                                                <EditField
                                                                    key="slotDurationMin"
                                                                    label="Minutos por turno"
                                                                    value={profile.slotDurationMin}
                                                                    isEditing={minutes}
                                                                    toggleKey="editMinutes"
                                                                    fieldKey="slotDurationMin"
                                                                    onChange={(val) => {
                                                                        const parsed = parseInt(val, 10);
                                                                        profileSend({
                                                                            type: "UPDATE_FORM",
                                                                            key: "slotDurationMin",
                                                                            value: Number.isNaN(parsed) ? null : parsed,
                                                                        });
                                                                    }}
                                                                />


                                </>
                                )}

                            <Box
                            component={motion.div}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
                            >
                            <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteForeverIcon />}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: '0px 6px 16px rgba(0,0,0,0.15)',
                                },
                            }}
                            onClick={() => {
                                if (window.confirm('¿Estás seguro de que quieres dar de baja tu cuenta? Esta acción no se puede deshacer.')) {
                                    profileSend({ type: "DEACTIVATE_ACCOUNT" });
                                }
                            }}
                            >
                            Dar de baja la cuenta
                            </Button>
                        </Box>
                     
                        </List>
                    
                    
                    )}
                 </CardContent>
            </MotionCard> 
        </Box>





    );
};

export default ProfileScreen;