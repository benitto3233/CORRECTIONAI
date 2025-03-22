import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
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

const ChartWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 300,
}));

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [dataResolution, setDataResolution] = useState('day');
  const [metrics, setMetrics] = useState(null);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, dataResolution]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // In a real application, make API call with time range and resolution parameters
      // const response = await api.get(`/analytics/admin?timeRange=${timeRange}&resolution=${dataResolution}`);
      // setMetrics(response.data);
      
      // For demo, use mock data
      setTimeout(() => {
        setMetrics(generateMockData());
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Use mock data if API call fails
      setMetrics(generateMockData());
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  const handleExportData = () => {
    // In a real application, generate CSV or Excel export
    alert('Export de données initialisé. Le téléchargement démarrera sous peu.');
  };

  // Generate mock data for demo purposes
  const generateMockData = () => {
    // Different data based on time range
    let timePoints;
    let userGrowthData;
    let assignmentSubmissionsData;
    
    // Generate proper time points based on selected time range and resolution
    if (timeRange === 'week') {
      timePoints = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      userGrowthData = [120, 132, 141, 154, 162, 168, 172];
      assignmentSubmissionsData = [42, 35, 67, 54, 89, 32, 21];
    } else if (timeRange === 'month') {
      timePoints = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
      userGrowthData = [110, 142, 168, 190];
      assignmentSubmissionsData = [187, 215, 298, 342];
    } else { // year
      timePoints = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      userGrowthData = [80, 95, 110, 125, 140, 155, 160, 165, 180, 195, 210, 225];
      assignmentSubmissionsData = [152, 189, 245, 378, 456, 498, 345, 256, 632, 758, 842, 965];
    }
    
    return {
      userGrowth: timePoints.map((label, index) => ({
        name: label,
        value: userGrowthData[index]
      })),
      
      assignmentSubmissions: timePoints.map((label, index) => ({
        name: label,
        value: assignmentSubmissionsData[index]
      })),
      
      userDistribution: [
        { name: 'Français', value: 35 },
        { name: 'Mathématiques', value: 25 },
        { name: 'Histoire', value: 15 },
        { name: 'Sciences', value: 20 },
        { name: 'Langues', value: 5 }
      ],
      
      processingMetrics: [
        { name: 'Succès', value: 92 },
        { name: 'Erreurs', value: 8 }
      ],
      
      performanceMetrics: timePoints.map((label, index) => ({
        name: label,
        'Temps moyen': 5 + Math.random() * 3,
        'Précision': 85 + Math.random() * 10
      })),
      
      peakHours: [
        { name: '8h', users: 15 },
        { name: '10h', users: 32 },
        { name: '12h', users: 27 },
        { name: '14h', users: 45 },
        { name: '16h', users: 62 },
        { name: '18h', users: 38 },
        { name: '20h', users: 21 }
      ],
      
      summary: {
        totalUsers: 256,
        activeUsers: 183,
        totalAssignments: 1842,
        totalSubmissions: 15673,
        averageGrade: 72.4,
        performanceIndex: 89.2
      }
    };
  };

  // Format a value for percentage display
  const formatPercent = value => `${Math.round(value)}%`;

  return (
    <Box>
      <ContentCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Analytiques de la plateforme</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="time-range-label">Période</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Période"
              >
                <MenuItem value="week">Semaine</MenuItem>
                <MenuItem value="month">Mois</MenuItem>
                <MenuItem value="year">Année</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Actualiser
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportData}
            >
              Exporter
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Summary metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={6} sm={4} md={2}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="caption" gutterBottom>
                      Utilisateurs totaux
                    </Typography>
                    <Typography variant="h5">
                      {metrics.summary.totalUsers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="caption" gutterBottom>
                      Utilisateurs actifs
                    </Typography>
                    <Typography variant="h5">
                      {metrics.summary.activeUsers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="caption" gutterBottom>
                      Devoirs créés
                    </Typography>
                    <Typography variant="h5">
                      {metrics.summary.totalAssignments}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="caption" gutterBottom>
                      Copies évaluées
                    </Typography>
                    <Typography variant="h5">
                      {metrics.summary.totalSubmissions}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="caption" gutterBottom>
                      Note moyenne
                    </Typography>
                    <Typography variant="h5">
                      {metrics.summary.averageGrade}/100
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="caption" gutterBottom>
                      Indice perf.
                    </Typography>
                    <Typography variant="h5">
                      {metrics.summary.performanceIndex}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Main charts */}
            <Grid container spacing={3}>
              {/* User Growth */}
              <Grid item xs={12} md={6}>
                <ContentCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Croissance des utilisateurs</Typography>
                    <Tooltip title="Nombre total d'utilisateurs au fil du temps">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.userGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <RechartsTooltip />
                        <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </ContentCard>
              </Grid>
              
              {/* Assignment Submissions */}
              <Grid item xs={12} md={6}>
                <ContentCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Soumissions de devoirs</Typography>
                    <Tooltip title="Nombre de copies soumises pour évaluation">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.assignmentSubmissions} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </ContentCard>
              </Grid>
              
              {/* User Distribution by Subject */}
              <Grid item xs={12} sm={6} md={4}>
                <ContentCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Répartition par matière</Typography>
                    <Tooltip title="Distribution des utilisateurs par matière enseignée">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.userDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${formatPercent(percent * 100)}`}
                        >
                          {metrics.userDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </ContentCard>
              </Grid>
              
              {/* Processing Success Rate */}
              <Grid item xs={12} sm={6} md={4}>
                <ContentCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Taux de réussite du traitement</Typography>
                    <Tooltip title="Pourcentage de copies traitées avec succès vs. erreurs">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.processingMetrics}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name} ${value}%`}
                        >
                          <Cell fill="#00C49F" />
                          <Cell fill="#FF8042" />
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </ContentCard>
              </Grid>
              
              {/* Peak Usage Hours */}
              <Grid item xs={12} sm={6} md={4}>
                <ContentCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Heures de pointe</Typography>
                    <Tooltip title="Nombre d'utilisateurs actifs par heure de la journée">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.peakHours} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="users" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </ContentCard>
              </Grid>
              
              {/* Performance Metrics */}
              <Grid item xs={12}>
                <ContentCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Métriques de performance</Typography>
                    <Tooltip title="Temps de traitement moyen et précision du système">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics.performanceMetrics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="Temps moyen" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="Précision" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </ContentCard>
              </Grid>
            </Grid>
          </Box>
        )}
      </ContentCard>
    </Box>
  );
};

export default AdminAnalytics;
