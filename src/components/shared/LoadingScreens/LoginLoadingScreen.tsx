import { 
  CircularProgress, 
  Box, 
  Typography, 
  Fade 
} from "@mui/material";
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const LoginLoadingScreen = () => {
  return (
    <Fade in={true} timeout={400}>
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{
          background: 'linear-gradient(135deg, #0d2230 0%, #22577a 25%, #38a3a5 50%, #57cc99 75%, #c7f9cc 100%)',
        }}
      >
        {/* Main loading card */}
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '48px 40px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Medical icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22577a 0%, #38a3a5 100%)',
              boxShadow: '0 4px 16px rgba(56, 163, 165, 0.3)',
            }}
          >
            <LocalHospitalIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>

          {/* Circular Progress */}
          <Box sx={{ mb: 3 }}>
            <CircularProgress
              size={56}
              thickness={4}
              sx={{
                color: '#38a3a5',
              }}
            />
          </Box>

          {/* Loading message */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#22577a',
            }}
          >
            Aguarde un momento...
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
};

export default LoginLoadingScreen;
