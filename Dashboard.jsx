import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Paper, 
  Divider,
  useMediaQuery,
  CircularProgress,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Tab,
  Tabs
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ShareIcon from '@mui/icons-material/Share';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import ClassIcon from '@mui/icons-material/Class';
import SchoolIcon from '@mui/icons-material/School';
import GradingIcon from '@mui/icons-material/Grading';
import InsightsIcon from '@mui/icons-material/Insights';

import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

const WelcomeSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    marginBottom: theme.spacing(4),
  }
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.spacing(1),
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  fontSize: '1rem',
  [theme.breakpoints.up('md')]: {
    marginBottom: theme.spacing(2),
    fontSize: '1.125rem',
  }
}));

const InsightCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  display: 'flex',
  alignItems: 'center',
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  marginRight: theme.spacing(2),
}));

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // États pour les données du tableau de bord
  const [stats, setStats] = useState({
    assignmentsGraded: 0,
    averageScore: 0,
    pendingAssignments: 0,
    improvementRate: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [feedbackSnack, setFeedbackSnack] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [collabSpaces, setCollabSpaces] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [workloadPrediction, setWorkloadPrediction] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Charger les données du tableau de bord
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Charger les statistiques
        const statsResponse = await api.get('/analytics/user');
        setStats(statsResponse.data);
        
        // Charger les recommandations personnalisées
        const recommendationsResponse = await api.get('/analytics/recommendations');
        setSuggestions(recommendationsResponse.data);
        
        // Charger les notifications
        const notificationsResponse = await api.get('/notifications?limit=5');
        setNotifications(notificationsResponse.data.notifications);
        setUnreadCount(notificationsResponse.data.unreadCount);
        
        // Charger les espaces de collaboration
        const collabResponse = await api.get('/collaboration/spaces');
        setCollabSpaces(collabResponse.data);
        
        // Charger l'activité récente
        const activityResponse = await api.get('/users/activity');
        setRecentActivity(activityResponse.data);
        
        // Charger la prédiction de charge de travail
        const workloadResponse = await api.get('/analytics/workload?days=7');
        setWorkloadPrediction(workloadResponse.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données du tableau de bord:', error);
        // Charger des données fictives pour la démonstration
        loadDemoData();
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Charger des données fictives pour la démonstration
  const loadDemoData = () => {
    setStats({
      assignmentsGraded: 128,
      averageScore: 85,
      pendingAssignments: 12,
      improvementRate: 7.5,
      totalStudents: 87,
      activeCollaborations: 5
    });
    
    setSuggestions([
      { id: 1, text: "D'après l'analyse de vos notations précédentes, ajoutez plus de commentaires détaillés", type: "improvement" },
      { id: 2, text: "Créez un nouveau matériel basé sur les difficultés rencontrées par vos élèves en mathématiques", type: "content" },
      { id: 3, text: "Partagez votre rubrique d'évaluation d'écriture avec d'autres enseignants de votre établissement", type: "collaboration" }
    ]);
    
    setNotifications([
      { id: 1, title: "Nouvelle mise à jour des modèles d'IA", message: "De nouveaux modèles d'IA sont maintenant disponibles", createdAt: "2025-03-22T10:30:00Z", isRead: false },
      { id: 2, title: "Collaboration", message: "Marie Dupont a partagé un nouveau matériel avec vous", createdAt: "2025-03-22T09:15:00Z", isRead: false },
      { id: 3, title: "Devoir terminé", message: "L'évaluation automatique des copies de mathématiques est terminée", createdAt: "2025-03-21T18:45:00Z", isRead: true }
    ]);
    
    setUnreadCount(2);
    
    setCollabSpaces([
      { id: 1, name: "Enseignants de Mathématiques", members: [{name: "Jean Martin"}, {name: "Sophie Leclerc"}], resourceCount: 15 },
      { id: 2, name: "Projets interdisciplinaires", members: [{name: "Marie Dupont"}, {name: "Paul Lambert"}], resourceCount: 8 }
    ]);
    
    setRecentActivity([
      { id: 1, action: "a créé un devoir", user: "Vous", target: "Exercice de mathématiques", timestamp: "2025-03-21T15:30:00Z" },
      { id: 2, action: "a noté un devoir", user: "Vous", target: "Dictée hebdomadaire", timestamp: "2025-03-21T11:20:00Z" },
      { id: 3, action: "a partagé une rubrique", user: "Marie Dupont", target: "Grille d'évaluation de rédaction", timestamp: "2025-03-20T16:45:00Z" }
    ]);
    
    setWorkloadPrediction([
      { day: "Lun", assignments: 5 },
      { day: "Mar", assignments: 8 },
      { day: "Mer", assignments: 12 },
      { day: "Jeu", assignments: 7 },
      { day: "Ven", assignments: 4 },
      { day: "Sam", assignments: 0 },
      { day: "Dim", assignments: 0 }
    ]);
  };
  
  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };
  
  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };
  
  const handleSuggestionAction = (id) => {
    setFeedbackMessage('Suggestion appliquée avec succès');
    setFeedbackSnack(true);
    setSuggestions(suggestions.filter(suggestion => suggestion.id !== id));
  };
  
  const handleSnackClose = () => {
    setFeedbackSnack(false);
  };
  
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  
  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      setFeedbackMessage('Toutes les notifications ont été marquées comme lues');
      setFeedbackSnack(true);
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
    }
  };
  
  const handleCreateCollabSpace = () => {
    navigate('/collaboration/create');
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, md: 3 } }}>
      <WelcomeSection>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
              Bonjour, Enseignant
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Typography>
          </Box>
          
          <IconButton 
            color="primary" 
            aria-label="notifications"
            onClick={handleNotificationClick}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleNotificationClose}
            PaperProps={{
              style: {
                width: 320,
                maxHeight: 400,
              },
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
              <Button size="small" onClick={handleMarkAllRead}>Tout marquer comme lu</Button>
            </Box>
            <Divider />
            {notifications.length > 0 ? (
              <List sx={{ p: 0 }}>
                {notifications.map((notification) => (
                  <ListItem 
                    key={notification.id} 
                    sx={{ 
                      bgcolor: notification.isRead ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight={notification.isRead ? 'normal' : 'bold'}>
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDate(notification.createdAt)}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">Aucune notification</Typography>
              </Box>
            )}
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button 
                fullWidth 
                component={Link} 
                to="/notifications" 
                size="small"
                onClick={handleNotificationClose}
              >
                Voir toutes les notifications
              </Button>
            </Box>
          </Menu>
        </Box>
      </WelcomeSection>

      {/* Cartes de statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 1 }}>
                  <GradingIcon fontSize="small" />
                </Avatar>
                <Typography variant="subtitle2" color="textSecondary">
                  Devoirs corrigés
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {loading ? <CircularProgress size={20} /> : stats.assignmentsGraded}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 1 }}>
                  <InsightsIcon fontSize="small" />
                </Avatar>
                <Typography variant="subtitle2" color="textSecondary">
                  Score moyen
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {loading ? <CircularProgress size={20} /> : `${stats.averageScore}%`}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 1 }}>
                  <AccessTimeIcon fontSize="small" />
                </Avatar>
                <Typography variant="subtitle2" color="textSecondary">
                  En attente
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {loading ? <CircularProgress size={20} /> : stats.pendingAssignments}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: theme.palette.info.main, mr: 1 }}>
                  <GroupIcon fontSize="small" />
                </Avatar>
                <Typography variant="subtitle2" color="textSecondary">
                  Collaborations
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {loading ? <CircularProgress size={20} /> : stats.activeCollaborations || 0}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Onglets de contenu */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange} 
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
        >
          <Tab label="Aperçu" icon={<InsightsIcon />} iconPosition="start" />
          <Tab label="Collaborations" icon={<GroupIcon />} iconPosition="start" />
          <Tab label="Suggestions" icon={<TrendingUpIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Contenu de l'onglet Aperçu */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {/* Graphique de prédiction de charge de travail */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <SectionTitle>
                <TrendingUpIcon sx={{ mr: 1 }} fontSize="small" />
                Prédiction de charge de travail
              </SectionTitle>
              <Box sx={{ height: 250 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workloadPrediction}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="assignments" fill={theme.palette.primary.main} name="Devoirs" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Activité récente */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <SectionTitle>
                <AccessTimeIcon sx={{ mr: 1 }} fontSize="small" />
                Activité récente
              </SectionTitle>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {recentActivity.map((activity) => (
                    <ListItem key={activity.id} sx={{ px: 0, py: 1 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            <Box component="span" fontWeight="bold">{activity.user}</Box> {activity.action} <Box component="span" fontWeight="medium">{activity.target}</Box>
                          </Typography>
                        }
                        secondary={formatDate(activity.timestamp)}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Contenu de l'onglet Collaborations */}
      {selectedTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Mes espaces de collaboration</Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreateCollabSpace}
            >
              Créer un espace
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <CircularProgress />
            </Box>
          ) : collabSpaces.length > 0 ? (
            <Grid container spacing={2}>
              {collabSpaces.map((space) => (
                <Grid item xs={12} sm={6} md={4} key={space.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{space.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {space.members.length} membres
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ClassIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {space.resourceCount} ressources
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          component={Link}
                          to={`/collaboration/spaces/${space.id}`}
                        >
                          Accéder
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small"
                          startIcon={<ShareIcon />}
                        >
                          Partager
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" paragraph>
                Vous n'avez pas encore d'espaces de collaboration.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleCreateCollabSpace}
              >
                Créer votre premier espace
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {/* Contenu de l'onglet Suggestions */}
      {selectedTab === 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Suggestions intelligentes</Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <CircularProgress />
            </Box>
          ) : suggestions.length > 0 ? (
            <Grid container spacing={2}>
              {suggestions.map((suggestion) => (
                <Grid item xs={12} key={suggestion.id}>
                  <InsightCard>
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: suggestion.type === 'improvement' ? theme.palette.info.main : 
                                  suggestion.type === 'content' ? theme.palette.success.main : 
                                  theme.palette.primary.main,
                          mr: 2
                        }}
                      >
                        {suggestion.type === 'improvement' ? <TrendingUpIcon /> : 
                         suggestion.type === 'content' ? <AssignmentIcon /> : 
                         <ShareIcon />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">{suggestion.text}</Typography>
                      </Box>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => handleSuggestionAction(suggestion.id)}
                      >
                        Appliquer
                      </Button>
                    </Box>
                  </InsightCard>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                Aucune suggestion disponible pour le moment.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      <Snackbar open={feedbackSnack} autoHideDuration={4000} onClose={handleSnackClose}>
        <Alert onClose={handleSnackClose} severity="success" sx={{ width: '100%' }}>
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
