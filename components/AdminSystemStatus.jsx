import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import DnsIcon from '@mui/icons-material/Dns';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import DataObjectIcon from '@mui/icons-material/DataObject';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TimerIcon from '@mui/icons-material/Timer';
import axios from 'axios';

// API client
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ContentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.08)',
}));

const StatusCard = styled(Card)(({ theme }) => ({
  height: '100%',
  position: 'relative',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[5],
  },
}));

const StatusIndicator = styled('div')(({ theme, status }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: 
    status === 'online' ? theme.palette.success.main :
    status === 'degraded' ? theme.palette.warning.main :
    status === 'offline' ? theme.palette.error.main :
    theme.palette.grey[400],
  marginRight: theme.spacing(1)
}));

const MetricBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
  height: '100%',
  minHeight: 100,
}));

const CircularProgressWithLabel = ({ value, color, size = 80, thickness = 4 }) => {
  const theme = useTheme();
  
  // Determine color based on value
  const getColor = (value) => {
    if (color) return color;
    if (value < 50) return theme.palette.success.main;
    if (value < 80) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        thickness={thickness}
        sx={{ color: getColor(value) }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          sx={{ fontSize: size / 4 }}
        >{`${Math.round(value)}%`}</Typography>
      </Box>
    </Box>
  );
};

const AdminSystemStatus = ({ metrics, loading }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [services, setServices] = useState([]);
  const [queues, setQueues] = useState([]);
  const [logs, setLogs] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    setServicesLoading(true);
    try {
      // In a real application, make API calls to fetch data
      // const servicesResponse = await api.get('/admin/services');
      // const queuesResponse = await api.get('/admin/queues');
      // const logsResponse = await api.get('/admin/logs?limit=10');
      
      // For demo, use mock data
      setTimeout(() => {
        setServices(generateMockServices());
        setQueues(generateMockQueues());
        setLogs(generateMockLogs());
        setServicesLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching system data:', error);
      // Use mock data if API calls fail
      setServices(generateMockServices());
      setQueues(generateMockQueues());
      setLogs(generateMockLogs());
      setServicesLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    fetchSystemData();
  };

  const handleRestartService = (serviceId) => {
    // In a real application, make API call to restart service
    // await api.post(`/admin/services/${serviceId}/restart`);
    alert(`Demande de redu00e9marrage du service ${serviceId} envoyu00e9e.`);
  };

  const handlePurgeQueue = (queueId) => {
    // In a real application, make API call to purge queue
    // await api.post(`/admin/queues/${queueId}/purge`);
    alert(`Demande de purge de la file ${queueId} envoyu00e9e.`);
  };

  // Generate mock data for demo purposes
  const generateMockServices = () => [
    { id: 'api-server', name: 'Serveur API', status: 'online', uptime: '14j 7h 23m', version: '1.2.5', lastRestart: '2025-03-08T12:30:00Z' },
    { id: 'db-server', name: 'Base de donnu00e9es', status: 'online', uptime: '30j 5h 12m', version: '4.2.1', lastRestart: '2025-02-20T08:15:00Z' },
    { id: 'ai-processor', name: 'Processeur IA', status: 'degraded', uptime: '5j 18h 45m', version: '2.0.3', lastRestart: '2025-03-17T06:00:00Z' },
    { id: 'cache-server', name: 'Serveur cache', status: 'online', uptime: '14j 8h 17m', version: '5.0.7', lastRestart: '2025-03-08T11:30:00Z' },
    { id: 'file-storage', name: 'Stockage fichiers', status: 'online', uptime: '23j 12h 41m', version: '3.1.2', lastRestart: '2025-02-27T12:00:00Z' },
    { id: 'ocr-service', name: 'Service OCR', status: 'offline', uptime: '0h 0m', version: '1.8.3', lastRestart: '2025-03-22T09:45:00Z' }
  ];

  const generateMockQueues = () => [
    { id: 'processing-queue', name: 'File de traitement', pending: 23, processing: 5, failed: 2, avgProcessingTime: '12.3s' },
    { id: 'notification-queue', name: 'File de notifications', pending: 8, processing: 1, failed: 0, avgProcessingTime: '0.8s' },
    { id: 'export-queue', name: 'File d\'export', pending: 3, processing: 1, failed: 1, avgProcessingTime: '45.2s' }
  ];

  const generateMockLogs = () => [
    { id: 1, level: 'error', message: 'Erreur de connexion u00e0 la base de donnu00e9es', service: 'db-server', timestamp: '2025-03-22T09:42:15Z' },
    { id: 2, level: 'warning', message: 'Haute utilisation CPU sur le service OCR (95%)', service: 'ocr-service', timestamp: '2025-03-22T09:40:30Z' },
    { id: 3, level: 'error', message: 'Service OCR arru00eatu00e9 inopinu00e9ment', service: 'ocr-service', timestamp: '2025-03-22T09:45:00Z' },
    { id: 4, level: 'info', message: 'Sauvegarde de la base de donnu00e9es terminu00e9e', service: 'db-server', timestamp: '2025-03-22T08:00:00Z' },
    { id: 5, level: 'info', message: 'Migration des donnu00e9es utilisateurs ru00e9ussie', service: 'api-server', timestamp: '2025-03-21T22:30:00Z' },
    { id: 6, level: 'warning', message: 'Espace disque faible (15% restant)', service: 'file-storage', timestamp: '2025-03-21T18:15:00Z' },
    { id: 7, level: 'error', message: 'u00c9chec du traitement OCR pour 3 documents', service: 'ai-processor', timestamp: '2025-03-22T07:12:00Z' },
    { id: 8, level: 'info', message: 'Mise u00e0 jour du cache terminu00e9e', service: 'cache-server', timestamp: '2025-03-22T06:30:00Z' },
    { id: 9, level: 'warning', message: 'Temps de ru00e9ponse API u00e9levu00e9 (800ms)', service: 'api-server', timestamp: '2025-03-22T09:30:00Z' },
    { id: 10, level: 'info', message: '10 nouveaux utilisateurs cru00e9u00e9s', service: 'api-server', timestamp: '2025-03-21T14:45:00Z' }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success';
      case 'degraded': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'online': return 'En ligne';
      case 'degraded': return 'Du00e9gradu00e9';
      case 'offline': return 'Hors ligne';
      default: return status;
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'info': return <CheckCircleIcon color="info" />;
      default: return <CheckCircleIcon color="info" />;
    }
  };

  // Render infrastructure tab content
  const renderInfrastructure = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MemoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Processeur (CPU)</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgressWithLabel value={metrics?.systemLoad || 0} />
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center' }}>
                {metrics?.systemLoad < 50 ? 'Utilisation normale' : 
                 metrics?.systemLoad < 80 ? 'Utilisation u00e9levu00e9e' : 
                 'Utilisation critique'}
              </Typography>
            </CardContent>
          </StatusCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatusCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Stockage</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgressWithLabel value={metrics?.storageUsed || 0} />
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center' }}>
                {metrics?.storageUsed < 50 ? 'Espace disponible' : 
                 metrics?.storageUsed < 80 ? 'Espace limitu00e9' : 
                 'Espace critique'}
              </Typography>
            </CardContent>
          </StatusCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatusCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MemoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Mu00e9moire (RAM)</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgressWithLabel value={65} />
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center' }}>
                Utilisation normale
              </Typography>
            </CardContent>
          </StatusCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatusCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimerIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Temps de ru00e9ponse</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Typography variant="h3">
                  {metrics?.responseTime || 0}
                  <Typography variant="caption" sx={{ ml: 1 }}>ms</Typography>
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center' }}>
                {metrics?.responseTime < 200 ? 'Tru00e8s bon' : 
                 metrics?.responseTime < 500 ? 'Acceptable' : 
                 'Lent'}
              </Typography>
            </CardContent>
          </StatusCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <ContentCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Services</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
              >
                Actualiser
              </Button>
            </Box>

            {servicesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {services.map((service) => (
                  <React.Fragment key={service.id}>
                    <ListItem
                      sx={{ 
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      secondaryAction={
                        <Tooltip title="Redu00e9marrer le service">
                          <IconButton
                            edge="end"
                            onClick={() => handleRestartService(service.id)}
                            disabled={service.status === 'offline'}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemIcon>
                        <StatusIndicator status={service.status} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle2">{service.name}</Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                ml: 1, 
                                color: `${getStatusColor(service.status)}.main`,
                                bgcolor: `${getStatusColor(service.status)}.light`,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1
                              }}
                            >
                              {getStatusLabel(service.status)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item>
                              <Typography variant="caption" display="block">
                                <strong>Version:</strong> {service.version}
                              </Typography>
                            </Grid>
                            <Grid item>
                              <Typography variant="caption" display="block">
                                <strong>Uptime:</strong> {service.uptime}
                              </Typography>
                            </Grid>
                            <Grid item>
                              <Typography variant="caption" display="block">
                                <strong>Dernier redu00e9marrage:</strong> {formatDate(service.lastRestart)}
                              </Typography>
                            </Grid>
                          </Grid>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </ContentCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <ContentCard>
            <Typography variant="h6" gutterBottom>Files d'attente</Typography>

            {servicesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {queues.map((queue) => (
                  <React.Fragment key={queue.id}>
                    <ListItem
                      sx={{ 
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      secondaryAction={
                        <Tooltip title="Purger la file">
                          <IconButton
                            edge="end"
                            onClick={() => handlePurgeQueue(queue.id)}
                          >
                            <SendIcon />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemIcon>
                        <CloudQueueIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={queue.name}
                        secondary={
                          <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item>
                              <Typography variant="caption" display="block">
                                <strong>En attente:</strong> {queue.pending}
                              </Typography>
                            </Grid>
                            <Grid item>
                              <Typography variant="caption" display="block">
                                <strong>En cours:</strong> {queue.processing}
                              </Typography>
                            </Grid>
                            <Grid item>
                              <Typography variant="caption" display="block">
                                <strong>Erreurs:</strong> {queue.failed}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="caption" display="block">
                                <strong>Temps moyen:</strong> {queue.avgProcessingTime}
                              </Typography>
                            </Grid>
                          </Grid>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </ContentCard>
        </Grid>
      </Grid>
    </Box>
  );

  // Render logs tab content
  const renderLogs = () => (
    <ContentCard>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Logs systu00e8me ru00e9cents</Typography>
        <Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Actualiser
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon />}
            href="/admin/logs"
          >
            Logs complets
          </Button>
        </Box>
      </Box>

      {servicesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {logs.map((log) => (
            <ListItem key={log.id} sx={{ px: 1, py: 1 }}>
              <ListItemIcon>
                {getLevelIcon(log.level)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2">{log.message}</Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      {log.service} - {formatDate(log.timestamp)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </ContentCard>
  );

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="system status tabs">
          <Tab label="Infrastructure" />
          <Tab label="Logs" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderInfrastructure()}
      {activeTab === 1 && renderLogs()}
    </Box>
  );
};

export default AdminSystemStatus;
