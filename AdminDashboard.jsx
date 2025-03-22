import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import AdminUserManagement from './components/AdminUserManagement';
import AdminSystemStatus from './components/AdminSystemStatus';
import AdminAnalytics from './components/AdminAnalytics';

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

const StyledTab = styled(Tab)(({ theme }) => ({
  minWidth: 0,
  marginRight: theme.spacing(3),
  [theme.breakpoints.up('sm')]: {
    minWidth: 90,
  }
}));

const ContentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.08)',
}));

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  position: 'relative',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10],
  },
}));

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        // Fetch system metrics
        const metricsResponse = await api.get('/analytics/system');
        setSystemMetrics(metricsResponse.data);

        // Fetch users data
        const usersResponse = await api.get('/users/admin/list');
        setUsersData(usersResponse.data);

        // Fetch recent activity
        const activityResponse = await api.get('/admin/activity');
        setRecentActivity(activityResponse.data);

        // Fetch system alerts
        const alertsResponse = await api.get('/admin/alerts');
        setAlerts(alertsResponse.data);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        setSnackbar({
          open: true,
          message: 'Erreur lors du chargement des données',
          severity: 'error'
        });
        // Load demo data if API calls fail
        loadDemoData();
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const loadDemoData = () => {
    // System metrics demo data
    setSystemMetrics({
      activeUsers: 256,
      totalAssignments: 1842,
      totalSubmissions: 15673,
      processingErrors: 24,
      averageProcessingTime: 8.3,
      systemLoad: 38,
      storageUsed: 62,
      newUsersThisWeek: 28,
      userRetentionRate: 93,
      responseTime: 230
    });

    // Users data
    setUsersData([
      { id: 1, name: 'Sophie Martin', email: 'smartin@educorrecte.fr', role: 'teacher', status: 'active', createdAt: '2025-01-15T10:30:00Z', lastLogin: '2025-03-22T08:45:00Z' },
      { id: 2, name: 'Jean Dupont', email: 'jdupont@educorrecte.fr', role: 'admin', status: 'active', createdAt: '2025-01-10T09:15:00Z', lastLogin: '2025-03-21T16:20:00Z' },
      { id: 3, name: 'Marie Leclerc', email: 'mleclerc@educorrecte.fr', role: 'teacher', status: 'inactive', createdAt: '2025-02-05T14:30:00Z', lastLogin: '2025-03-01T11:10:00Z' },
      { id: 4, name: 'Thomas Bernard', email: 'tbernard@educorrecte.fr', role: 'teacher', status: 'active', createdAt: '2025-03-01T08:00:00Z', lastLogin: '2025-03-22T09:30:00Z' },
      { id: 5, name: 'Camille Roux', email: 'croux@educorrecte.fr', role: 'teacher', status: 'pending', createdAt: '2025-03-20T13:45:00Z', lastLogin: null }
    ]);

    // Recent activity
    setRecentActivity([
      { id: 1, action: 'Connexion', user: 'Sophie Martin', timestamp: '2025-03-22T08:45:00Z', details: 'IP: 192.168.1.45' },
      { id: 2, action: 'Création de compte', user: 'Camille Roux', timestamp: '2025-03-20T13:45:00Z', details: 'Rôle: Enseignant' },
      { id: 3, action: 'Modification de paramètres', user: 'Jean Dupont', timestamp: '2025-03-21T16:20:00Z', details: 'Paramètres système' },
      { id: 4, action: 'Erreur de traitement', user: 'Système', timestamp: '2025-03-22T07:30:00Z', details: 'OCR décodage échoué' },
      { id: 5, action: 'Mise à jour', user: 'Système', timestamp: '2025-03-21T02:00:00Z', details: 'Version 1.2.5 installée' }
    ]);

    // System alerts
    setAlerts([
      { id: 1, type: 'warning', message: 'Utilisation élevée du CPU (85%)', timestamp: '2025-03-22T09:30:00Z' },
      { id: 2, type: 'error', message: '24 erreurs de traitement OCR détectées', timestamp: '2025-03-22T08:15:00Z' },
      { id: 3, type: 'info', message: 'Mise à jour du modèle d\'IA disponible', timestamp: '2025-03-21T14:00:00Z' },
      { id: 4, type: 'warning', message: 'Espace de stockage à 62% de capacité', timestamp: '2025-03-20T16:45:00Z' }
    ]);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Overview dashboard content
  const renderOverview = () => (
    <>
      {/* Key metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Utilisateurs actifs</Typography>
              <Typography variant="h4" component="div">
                {loading ? <CircularProgress size={24} /> : systemMetrics?.activeUsers}
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Devoirs traités</Typography>
              <Typography variant="h4" component="div">
                {loading ? <CircularProgress size={24} /> : systemMetrics?.totalSubmissions}
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Erreurs système</Typography>
              <Typography variant="h4" component="div" color="error">
                {loading ? <CircularProgress size={24} /> : systemMetrics?.processingErrors}
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Temps moyen</Typography>
              <Typography variant="h4" component="div">
                {loading ? <CircularProgress size={24} /> : `${systemMetrics?.averageProcessingTime}s`}
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
      </Grid>

      {/* System status and alerts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <ContentCard>
            <Typography variant="h6" gutterBottom>État du système</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Charge CPU</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgressWithLabel 
                        value={systemMetrics?.systemLoad || 0} 
                        color={systemMetrics?.systemLoad > 80 ? 'error' : 
                              systemMetrics?.systemLoad > 60 ? 'warning' : 'primary'}
                      />
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Stockage</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgressWithLabel 
                        value={systemMetrics?.storageUsed || 0} 
                        color={systemMetrics?.storageUsed > 80 ? 'error' : 
                              systemMetrics?.storageUsed > 60 ? 'warning' : 'primary'}
                      />
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Temps de réponse</Typography>
                  <Typography variant="body2">
                    {systemMetrics?.responseTime}ms (moyen)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Alertes système</Typography>
                {alerts.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {alerts.map((alert) => (
                      <ListItem key={alert.id} sx={{ px: 0, py: 1 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: alert.type === 'error' ? theme.palette.error.light : 
                                   alert.type === 'warning' ? theme.palette.warning.light : 
                                   theme.palette.info.light 
                          }}>
                            {alert.type === 'error' ? <WarningIcon /> : 
                             alert.type === 'warning' ? <WarningIcon /> : 
                             <InfoIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={alert.message} 
                          secondary={formatDate(alert.timestamp)} 
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      Aucune alerte active
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </ContentCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ContentCard>
            <Typography variant="h6" gutterBottom>Activité récente</Typography>
            {recentActivity.length > 0 ? (
              <List sx={{ p: 0 }}>
                {recentActivity.map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0, py: 1 }}>
                    <ListItemText 
                      primary={
                        <Typography variant="body2">
                          <strong>{activity.action}</strong> - {activity.user}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" display="block">
                            {formatDate(activity.timestamp)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {activity.details}
                          </Typography>
                        </>
                      } 
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Aucune activité récente
                </Typography>
              </Box>
            )}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="outlined" 
                size="small"
                component={Link}
                to="/admin/logs"
              >
                Voir tous les logs
              </Button>
            </Box>
          </ContentCard>
        </Grid>
      </Grid>
    </>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Administration Correcte-AI
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          aria-label="admin dashboard tabs"
        >
          <StyledTab icon={<DashboardIcon />} iconPosition="start" label="Aperçu" />
          <StyledTab icon={<PeopleIcon />} iconPosition="start" label="Utilisateurs" />
          <StyledTab icon={<EqualizerIcon />} iconPosition="start" label="Analytiques" />
          <StyledTab icon={<StorageIcon />} iconPosition="start" label="Système" />
          <StyledTab icon={<SettingsIcon />} iconPosition="start" label="Paramètres" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && renderOverview()}
        {activeTab === 1 && <AdminUserManagement users={usersData} loading={loading} />}
        {activeTab === 2 && <AdminAnalytics />}
        {activeTab === 3 && <AdminSystemStatus metrics={systemMetrics} loading={loading} />}
        {activeTab === 4 && (
          <ContentCard>
            <Typography variant="h6">Paramètres système</Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 4 }}>
              Configuration des paramètres globaux de l'application Correcte-AI
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Cette section est en cours de développement
            </Alert>
          </ContentCard>
        )}
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Helper component for progress bars
const LinearProgressWithLabel = ({ value, color }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <div style={{ 
          height: 10, 
          borderRadius: 5, 
          backgroundColor: '#e0e0e0',
          position: 'relative'
        }}>
          <div style={{
            width: `${value}%`,
            height: '100%',
            borderRadius: 5,
            backgroundColor: color === 'primary' ? '#1976d2' : 
                            color === 'warning' ? '#ff9800' : 
                            '#f44336',
            transition: 'width 0.5s ease-in-out'
          }} />
        </div>
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(value)}%`}</Typography>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
