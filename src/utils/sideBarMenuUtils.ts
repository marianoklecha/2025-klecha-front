
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  ExitToApp as ExitIcon,
  BarChart as BarChartIcon,
  EmojiEvents as TrophyIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Group as GroupIcon
} from '@mui/icons-material';

export interface MenuItem {
  id: string;
  title: string;
  iconComponent: any; 
  path: string;
  action?: () => void;
}


export const iconMap = {
  Dashboard: DashboardIcon,
  People: PeopleIcon,
  CalendarToday: CalendarIcon,
  Schedule: ScheduleIcon,
  Notifications: NotificationsIcon,
  Person: PersonIcon,
  ExitToApp: ExitIcon,
  BarChart: BarChartIcon,
  Trophy: TrophyIcon,
  WorkspacePremium: WorkspacePremiumIcon,
  Group: GroupIcon
};

export const getDoctorMenuItems = (handleLogout: () => void): MenuItem[] => [
  {
    id: 'dashboard',
    title: 'Inicio',
    iconComponent: DashboardIcon,
    path: '/'
  },
  {
    id: 'patients',
    title: 'Pacientes',
    iconComponent: PeopleIcon,
    path: '/doctor/view-patients'
  },
  {
    id: 'turns',
    title: 'Mis Turnos',
    iconComponent: CalendarIcon,
    path: '/doctor/view-turns'
  },
  {
    id: 'availability',
    title: 'Disponibilidad',
    iconComponent: ScheduleIcon,
    path: '/doctor/enable-hours'
  },
  {
    id: 'requests',
    title: 'Solicitudes',
    iconComponent: NotificationsIcon,
    path: '/doctor/turns-modifications'
  },
  {
    id: 'metrics',
    title: 'Métricas',
    iconComponent: BarChartIcon,
    path: '/doctor/metrics'
  },
  {
    id: 'badges',
    title: 'Logros',
    iconComponent: WorkspacePremiumIcon,
    path: '/doctor/badges'
  },
  {
    id: 'profile',
    title: 'Mi Perfil',
    iconComponent: PersonIcon,
    path: '/profile'
  },
  {
    id: 'logout',
    title: 'Cerrar Sesión',
    iconComponent: ExitIcon,
    path: '',
    action: handleLogout
  }
];

export const getPatientMenuItems = (handleLogout: () => void): MenuItem[] => [
  {
    id: 'dashboard',
    title: 'Inicio',
    iconComponent: DashboardIcon,
    path: '/'
  },
  {
    id: 'profile',
    title: 'Mi Perfil',
    iconComponent: PersonIcon,
    path: '/profile'
  },
  {
    id: 'turns',
    title: 'Mis Turnos',
    iconComponent: CalendarIcon,
    path: '/patient/view-turns'
  },
  {
    id: 'reservation',
    title: 'Reservar Turno',
    iconComponent: CalendarIcon,
    path: '/patient/reservation-turns'
  },
  {
    id: 'family',
    title: 'Mi Familia',
    iconComponent: GroupIcon,
    path: '/patient/family'
  },
  
  {
    id: 'badges',
    title: 'Logros',
    iconComponent: WorkspacePremiumIcon,
    path: '/patient/badges'
  },
  
  {
    id: 'logout',
    title: 'Cerrar Sesión',
    iconComponent: ExitIcon,
    path: '',
    action: handleLogout
  }
];

export const getAdminMenuItems = (handleLogout: () => void): MenuItem[] => [
  {
    id: 'dashboard',
    title: 'Inicio',
    iconComponent: DashboardIcon,
    path: '/'
  },
  {
    id: 'pending',
    title: 'Solicitudes Pendientes',
    iconComponent: NotificationsIcon,
    path: '/admin/pending'
  },
  {
    id: 'patients',
    title: 'Pacientes',
    iconComponent: PeopleIcon,
    path: '/admin/patients'
  },
  {
    id: 'doctors',
    title: 'Doctores',
    iconComponent: PersonIcon,
    path: '/admin/doctors'
  },
  {
    id: 'profile',
    title: 'Mi Perfil',
    iconComponent: PersonIcon,
    path: '/profile'
  },
  {
    id: 'logout',
    title: 'Cerrar Sesión',
    iconComponent: ExitIcon,
    path: '',
    action: handleLogout
  }
];

export const getMenuItems = (
  userRole: 'DOCTOR' | 'PATIENT' | 'ADMIN',
  handleLogout: () => void
): MenuItem[] => {
  switch (userRole) {
    case 'PATIENT':
      return getPatientMenuItems(handleLogout);
    case 'ADMIN':
      return getAdminMenuItems(handleLogout);
    case 'DOCTOR':
    default:
      return getDoctorMenuItems(handleLogout);
  }
};


export const getUserDisplayName = (user: any): string => {
  const name = user.name;
  const role = user.role;
  
  switch (role) {
    case 'DOCTOR':
      return `Dr. ${name}`;
    case 'ADMIN':
      return `Admin ${name}`;
    case 'PATIENT':
    default:
      return name;
  }
};