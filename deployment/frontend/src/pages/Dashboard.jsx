import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Paper, Button, CircularProgress,
  Card, CardContent, CardHeader, List, ListItem, ListItemText, ListItemIcon,
  Divider, Chip, IconButton, Avatar, Tooltip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Check as CheckIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    assignments: [],
    submissions: [],
    notifications: [],
    analytics: {
      assignmentsCreated: 0,
      submissionsGraded: 0,
      averageScore: 0,
      timeSpent: 0
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch assignments
        const assignmentsResponse = await api.get('/assignments?limit=5');
        
        // Fetch submissions
        const submissionsResponse = await api.get('/submissions?limit=5');
        
        // Fetch notifications
        const notificationsResponse = await api.get('/notifications?limit=5');
        
        // Fetch analytics
        const analyticsResponse = await api.get('/analytics/user');
        
        setDashboardData({
          assignments: assignmentsResponse.data || [],
          submissions: submissionsResponse.data || [],
          notifications: notificationsResponse.data || [],
          analytics: analyticsResponse.data || {
            assignmentsCreated: 0,
            submissionsGraded: 0,
            averageScore: 0,
            timeSpent: 0
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Une erreur s\'est produite lors du chargement des données du tableau de bord');
        
        // Set mock data for demonstration
        setDashboardData({
          assignments: [
            { _id: '1', title: 'Devoir de Mathématiques', subject: 'Mathématiques', submissionsCount: 15, status: 'active' },
            { _id: '2', title: 'Rédaction Française', subject: 'Français', submissionsCount: 22, status: 'active' },
            { _id: '3', title: 'Expérience Scientifique', subject: 'Sciences', submissionsCount: 18, status: 'active' }
          ],
          submissions: [
            { _id: '1', student: { name: 'Marie Dupont' }, status: 'graded', grade: { score: 85 }, submittedAt: new Date() },
            { _id: '2', student: { name: 'Thomas Martin' }, status: 'graded', grade: { score: 92 }, submittedAt: new Date() },
            { _id: '3', student: { name: 'Julie Bernard' }, status: 'pending', submittedAt: new Date() }
          ],
          notifications: [
            { _id: '1', type: 'submission_graded', content: 'La soumission de Marie Dupont a été notée', isRead: false, createdAt: new Date() },
            { _id: '2', type: 'assignment_reminder', content: 'Rappel: La date limite du devoir Mathématiques est demain', isRead: true, createdAt: new Date() }
          ],
          analytics: {
            assignmentsCreated: 8,
            submissionsGraded: 45,
            averageScore: 82,
            timeSpent: 12,
            recentActivity: [
              { type: 'assignment_created', timestamp: new Date() },
              { type: 'submission_graded', timestamp: new Date(Date.now() - 86400000) }
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Prepare chart data
  const gradeDistributionData = {
    labels: ['90-100', '80-89', '70-79', '60-69', 'Moins de 60'],
    datasets: [
      {
        label: 'Distribution des notes',
        data: [12, 19, 8, 5, 2],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const activityData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Soumissions notées',
        data: [3, 5, 2, 7, 4, 1, 0],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography>{error}</Typography>
          </Paper>
        )}

        {/* Welcome section */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" component="h1" gutterBottom>
                Bonjour, {currentUser?.name || 'Enseignant'} 👋
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Bienvenue sur votre tableau de bord Correcte-AI. Voici un aperçu de vos activités récentes et de vos statistiques.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/assignments/new')}
                sx={{ mr: 1 }}
              >
                Nouveau Devoir
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/submissions/new')}
              >
                Nouvelle Soumission
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Analytics cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <AssignmentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div">
                      {dashboardData.analytics.assignmentsCreated}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Devoirs créés
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <CheckIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div">
                      {dashboardData.analytics.submissionsGraded}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Soumissions notées
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <TimelineIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div">
                      {dashboardData.analytics.averageScore}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Note moyenne
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div">
                      {dashboardData.analytics.timeSpent}h
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Temps économisé
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main content */}
        <Grid container spacing={4}>
          {/* Recent assignments and submissions */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardHeader
                    title="Devoirs récents"
                    action={
                      <Button
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate('/assignments')}
                      >
                        Voir tous
                      </Button>
                    }
                  />
                  <Divider />
                  <List sx={{ p: 0 }}>
                    {dashboardData.assignments.length > 0 ? (
                      dashboardData.assignments.map((assignment, index) => (
                        <React.Fragment key={assignment._id}>
                          <ListItem
                            button
                            onClick={() => navigate(`/assignments/${assignment._id}`)}
                            secondaryAction={
                              <Chip 
                                label={`${assignment.submissionsCount} soumissions`} 
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            }
                          >
                            <ListItemIcon>
                              <AssignmentIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={assignment.title}
                              secondary={assignment.subject}
                            />
                          </ListItem>
                          {index < dashboardData.assignments.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Aucun devoir récent" secondary="Créez votre premier devoir pour commencer" />
                      </ListItem>
                    )}
                  </List>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardHeader
                    title="Soumissions récentes"
                    action={
                      <Button
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate('/submissions')}
                      >
                        Voir toutes
                      </Button>
                    }
                  />
                  <Divider />
                  <List sx={{ p: 0 }}>
                    {dashboardData.submissions.length > 0 ? (
                      dashboardData.submissions.map((submission, index) => (
                        <React.Fragment key={submission._id}>
                          <ListItem
                            button
                            onClick={() => navigate(`/submissions/${submission._id}`)}
                            secondaryAction={
                              submission.status === 'graded' ? (
                                <Chip 
                                  label={`${submission.grade.score}%`} 
                                  size="small"
                                  color="success"
                                />
                              ) : (
                                <Chip 
                                  label={submission.status === 'pending' ? 'En attente' : 'En cours'} 
                                  size="small"
                                  color="warning"
                                />
                              )
                            }
                          >
                            <ListItemIcon>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                                {submission.student.name.charAt(0)}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={submission.student.name}
                              secondary={new Date(submission.submittedAt).toLocaleDateString()}
                            />
                          </ListItem>
                          {index < dashboardData.submissions.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Aucune soumission récente" secondary="Soumettez des travaux d'élèves pour commencer la notation" />
                      </ListItem>
                    )}
                  </List>
                </Card>
              </Grid>
            </Grid>
          </Grid>
          
          {/* Stats and notifications */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>              
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardHeader title="Distribution des notes" />
                  <CardContent>
                    <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                      <Doughnut data={gradeDistributionData} options={{ maintainAspectRatio: false }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardHeader title="Activité hebdomadaire" />
                  <CardContent>
                    <Box sx={{ height: 200 }}>
                      <Line 
                        data={activityData} 
                        options={{ 
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                precision: 0
                              }
                            }
                          }
                        }} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardHeader
                    title="Notifications"
                    action={
                      <IconButton aria-label="mark all as read" size="small">
                        <NotificationsIcon />
                      </IconButton>
                    }
                  />
                  <Divider />
                  <List sx={{ p: 0 }}>
                    {dashboardData.notifications.length > 0 ? (
                      dashboardData.notifications.map((notification, index) => (
                        <React.Fragment key={notification._id}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{
                              bgcolor: notification.isRead ? 'inherit' : 'action.hover',
                              py: 1
                            }}
                          >
                            <ListItemText
                              primary={notification.content}
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < dashboardData.notifications.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Aucune notification" secondary="Vous n'avez pas de nouvelles notifications" />
                      </ListItem>
                    )}
                  </List>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default Dashboard;
