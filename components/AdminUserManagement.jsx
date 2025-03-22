import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
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
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.08)',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const SearchBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 1),
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
}));

const AdminUserManagement = ({ users, loading }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'teacher',
    password: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleOpenDialog = (type, user = null) => {
    setDialogType(type);
    setSelectedUser(user);
    setOpenDialog(true);
    setActionError('');
    setActionSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleNewUserChange = (event) => {
    const { name, value } = event.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      // In a real application, make API call to create user
      // await api.post('/users/admin/create', newUser);
      
      // For demo, just simulate success
      setTimeout(() => {
        setActionSuccess('Utilisateur créé avec succès');
        setActionLoading(false);
        // Reset form and close dialog after success
        setNewUser({
          name: '',
          email: '',
          role: 'teacher',
          password: '',
        });
        setTimeout(() => handleCloseDialog(), 1500);
      }, 1000);
      
    } catch (error) {
      console.error('Error creating user:', error);
      setActionError('Erreur lors de la création de l\'utilisateur');
      setActionLoading(false);
    }
  };

  const handleUserAction = async (action) => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    setActionError('');
    try {
      // In a real application, make API call based on action
      // e.g., await api.post(`/users/admin/${action}/${selectedUser.id}`);
      
      // For demo, just simulate success
      setTimeout(() => {
        const actionMap = {
          'delete': 'supprimé',
          'block': 'bloqué',
          'activate': 'activé'
        };
        
        setActionSuccess(`Utilisateur ${actionMap[action]} avec succès`);
        setActionLoading(false);
        // Close dialog after success
        setTimeout(() => handleCloseDialog(), 1500);
      }, 1000);
      
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      setActionError(`Erreur lors de l'opération sur l'utilisateur`);
      setActionLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    return (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'pending': return 'warning';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      case 'blocked': return 'Bloqué';
      default: return status;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'teacher': return 'Enseignant';
      case 'school_admin': return 'Admin école';
      default: return role;
    }
  };

  // Render the new user dialog
  const renderNewUserDialog = () => (
    <Dialog open={openDialog && dialogType === 'new'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label="Nom complet"
          type="text"
          fullWidth
          variant="outlined"
          value={newUser.name}
          onChange={handleNewUserChange}
          sx={{ mb: 2, mt: 2 }}
        />
        <TextField
          margin="dense"
          name="email"
          label="Email"
          type="email"
          fullWidth
          variant="outlined"
          value={newUser.email}
          onChange={handleNewUserChange}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
          <InputLabel id="role-select-label">Rôle</InputLabel>
          <Select
            labelId="role-select-label"
            name="role"
            value={newUser.role}
            onChange={handleNewUserChange}
            label="Rôle"
          >
            <MenuItem value="teacher">Enseignant</MenuItem>
            <MenuItem value="admin">Administrateur</MenuItem>
            <MenuItem value="school_admin">Admin école</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          name="password"
          label="Mot de passe temporaire"
          type="password"
          fullWidth
          variant="outlined"
          value={newUser.password}
          onChange={handleNewUserChange}
          sx={{ mb: 1 }}
        />
        {actionError && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}
        {actionSuccess && <Alert severity="success" sx={{ mt: 2 }}>{actionSuccess}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog} color="inherit" disabled={actionLoading}>Annuler</Button>
        <Button 
          onClick={handleCreateUser} 
          color="primary" 
          variant="contained"
          disabled={!newUser.name || !newUser.email || !newUser.password || actionLoading}
        >
          {actionLoading ? <CircularProgress size={24} /> : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render the confirmation dialog for delete/block/activate actions
  const renderConfirmationDialog = () => {
    if (!selectedUser || !['delete', 'block', 'activate'].includes(dialogType)) return null;

    const getDialogContent = () => {
      switch (dialogType) {
        case 'delete':
          return {
            title: 'Confirmer la suppression',
            content: `Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur ${selectedUser.name} ?`,
            action: 'Supprimer',
            color: 'error'
          };
        case 'block':
          return {
            title: 'Confirmer le blocage',
            content: `Êtes-vous sûr de vouloir bloquer l'accès pour ${selectedUser.name} ?`,
            action: 'Bloquer',
            color: 'warning'
          };
        case 'activate':
          return {
            title: 'Confirmer l\'activation',
            content: `Êtes-vous sûr de vouloir activer le compte de ${selectedUser.name} ?`,
            action: 'Activer',
            color: 'success'
          };
        default:
          return { title: '', content: '', action: '', color: 'primary' };
      }
    };

    const dialogContent = getDialogContent();

    return (
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{dialogContent.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogContent.content}
          </DialogContentText>
          {actionError && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}
          {actionSuccess && <Alert severity="success" sx={{ mt: 2 }}>{actionSuccess}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit" disabled={actionLoading}>Annuler</Button>
          <Button 
            onClick={() => handleUserAction(dialogType)} 
            color={dialogContent.color}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : dialogContent.action}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <ContentCard>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Gestion des utilisateurs</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog('new')}
        >
          Nouvel utilisateur
        </Button>
      </Box>

      <SearchBox>
        <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
        <TextField
          placeholder="Rechercher un utilisateur..."
          variant="standard"
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{ disableUnderline: true }}
        />
      </SearchBox>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Dernière connexion</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Aucun utilisateur trouvé
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <StyledTableRow key={user.id}>
                    <TableCell>
                      <Typography variant="body2">{user.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Créé le {formatDate(user.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleLabel(user.role)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(user.status)} 
                        color={getStatusColor(user.status)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.lastLogin)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Modifier">
                        <IconButton size="small" sx={{ mr: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {user.status === 'active' ? (
                        <Tooltip title="Bloquer">
                          <IconButton 
                            size="small" 
                            color="warning"
                            sx={{ mr: 1 }}
                            onClick={() => handleOpenDialog('block', user)}
                          >
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Activer">
                          <IconButton 
                            size="small" 
                            color="success"
                            sx={{ mr: 1 }}
                            onClick={() => handleOpenDialog('activate', user)}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Supprimer">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleOpenDialog('delete', user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </StyledTableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
      />

      {renderNewUserDialog()}
      {renderConfirmationDialog()}
    </ContentCard>
  );
};

export default AdminUserManagement;
