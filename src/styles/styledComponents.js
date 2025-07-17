// styledComponents.js - Contains all styled components for the brain visualization app

import { styled } from '@mui/material/styles';
import { 
  Box, 
  Paper, 
  Button, 
  Toolbar,
  alpha,
} from '@mui/material';
import { createTheme } from '@mui/material/styles';

// Create a professional dark theme for the application
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00b4ff',
    },
    secondary: {
      main: '#00ff64',
    },
    background: {
      default: '#050510',
      paper: '#10102a',
    },
    text: {
      primary: '#e0e0fa',
      secondary: '#a0a0c0',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h4: {
      fontWeight: 300,
      letterSpacing: '0.05em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 400,
        },
      },
    },
  },
});

// Styled components
export const BrainCell = styled(Paper)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(8px)',
  borderRadius: theme.shape.borderRadius * 1.5,
  padding: theme.spacing(1),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  height: '100%',
  width: '100%',
  position: 'relative',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 25px rgba(0, 20, 80, 0.5)',
    transform: 'translateY(-2px)',
  }
}));

export const AppContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  background: 'linear-gradient(to bottom, #050518 0%, #0a0a2a 100%)',
}));

export const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  background: 'linear-gradient(90deg, rgba(10,10,40,0.8) 0%, rgba(20,20,60,0.8) 100%)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(80,80,150,0.2)',
}));

export const FooterBar = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(10px)',
  padding: theme.spacing(0.8),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  borderTop: '1px solid rgba(80,80,150,0.1)',
}));

export const StatsOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 4,
  left: 0,
  right: 0,
  textAlign: 'center',
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
}));

export const HeaderButton = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  backdropFilter: 'blur(5px)',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
  }
}));

export const ColorScaleLegend = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: 16,
  top: 80,
  width: 28,
  height: 160,
  background: 'linear-gradient(to top, #00f 0%, #0ff 20%, #0f0 40%, #ff0 60%, #f80 80%, #f00 100%)',
  borderRadius: 8,
  border: '1px solid rgba(80,80,150,0.3)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 10,
  pointerEvents: 'none'
}));

export const InfoPanel = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: 80,
  right: 60,
  width: 320,
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  zIndex: 100,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  borderRadius: theme.shape.borderRadius * 1.5,
  maxHeight: 'calc(100vh - 160px)',
  overflowY: 'auto',
  transform: 'translateX(110%)',
  transition: 'transform 0.3s ease-in-out',
  '&.visible': {
    transform: 'translateX(0)',
  }
}));

export const ControlButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.secondary.main, 0.2),
  }
}));

export const ActivityIndicator = styled(Box)(({ theme, $active }) => ({
  display: 'inline-block',
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: $active ? theme.palette.success.main : theme.palette.error.main,
  marginRight: 8,
  boxShadow: $active ? '0 0 8px rgba(0, 255, 0, 0.5)' : 'none',
}));

export const DetailCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
  }
}));

export const InactiveBrainOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  borderRadius: theme.shape.borderRadius * 1.5,
  zIndex: 10,
}));

// Settings dialog styled components
export const SettingsTabList = styled(Box)(({ theme }) => ({
  width: 200, 
  borderRight: '1px solid rgba(255, 255, 255, 0.12)',
  background: 'rgba(10,10,30,0.5)'
}));

export const SettingsTabContent = styled(Box)(({ theme }) => ({
  flexGrow: 1, 
  p: 3
}));

export const SettingsTitle = styled(Box)(({ theme }) => ({
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
  background: 'linear-gradient(90deg, rgba(16,16,42,1) 0%, rgba(23,23,64,1) 100%)',
  display: 'flex',
  alignItems: 'center',
  gap: 1
}));

export const SettingsFooter = styled(Box)(({ theme }) => ({
  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
  px: 3,
  py: 2,
  background: 'rgba(10,10,30,0.5)'
}));

export const SettingsAccordion = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  background: 'rgba(20,20,50,0.4)'
}));

export const StatusMessage = styled(Box)(({ theme, $success }) => ({
  marginRight: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  color: $success ? theme.palette.success.main : theme.palette.error.main
}));