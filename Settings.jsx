import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, TextField, MenuItem, FormControl, InputLabel, Select } from '@mui/material';
import { styled } from '@mui/material/styles';
import Layout from '../components/Layout';
import KeyIcon from '@mui/icons-material/Key';

// Composants stylisés
const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
}));

const FormCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
}));

const ApiKeyCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
  border: '1px solid #e0e0e0',
}));

const Settings = () => {
  const [apiKeys, setApiKeys] = useState([
    { id: 1, provider: 'openai', key: '••••••••••••••••••••••••••', active: true },
    { id: 2, provider: 'gemini', key: '••••••••••••••••••••••••••', active: false }
  ]);
  const [newProvider, setNewProvider] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [preferredModel, setPreferredModel] = useState('openai');
  const [exportFormat, setExportFormat] = useState('csv');

  const handleAddApiKey = () => {
    if (newProvider && newApiKey) {
      setApiKeys([
        ...apiKeys,
        {
          id: apiKeys.length + 1,
          provider: newProvider,
          key: newApiKey,
          active: false
        }
      ]);
      setNewProvider('');
      setNewApiKey('');
    }
  };

  const handleToggleActive = (id) => {
    setApiKeys(apiKeys.map(key => 
      key.id === id 
        ? { ...key, active: true } 
        : { ...key, active: false }
    ));
  };

  const handleDeleteApiKey = (id) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Paramètres
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormCard>
              <CardContent>
                <SectionTitle variant="h6">Configuration des API d'IA</SectionTitle>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Configurez vos clés API pour les différents services d'IA utilisés par Correcte-AI.
                </Typography>

                {apiKeys.map((apiKey) => (
                  <ApiKeyCard key={apiKey.id}>
                    <CardContent sx={{ p: 2 }}>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body1" fontWeight={500}>
                            {apiKey.provider.toUpperCase()}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="textSecondary">
                            {apiKey.key}
                          </Typography>
                        </Grid>
                        <Grid item xs={4} sx={{ textAlign: 'right' }}>
                          <Button 
                            size="small" 
                            color={apiKey.active ? "primary" : "inherit"}
                            variant={apiKey.active ? "contained" : "outlined"}
                            onClick={() => handleToggleActive(apiKey.id)}
                            sx={{ mr: 1 }}
                          >
                            {apiKey.active ? "Actif" : "Activer"}
                          </Button>
                          <Button 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                          >
                            Supprimer
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </ApiKeyCard>
                ))}

                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={5}>
                      <FormControl fullWidth>
                        <InputLabel>Fournisseur</InputLabel>
                        <Select
                          value={newProvider}
                          onChange={(e) => setNewProvider(e.target.value)}
                          label="Fournisseur"
                        >
                          <MenuItem value="openai">OpenAI</MenuItem>
                          <MenuItem value="gemini">Google Gemini</MenuItem>
                          <MenuItem value="anthropic">Anthropic</MenuItem>
                          <MenuItem value="deepseek">Deepseek R1 V3</MenuItem>
                          <MenuItem value="mistral">Mistral OCR</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Clé API"
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        type="password"
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        color="primary"
                        onClick={handleAddApiKey}
                        sx={{ height: '56px' }}
                      >
                        Ajouter
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </FormCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormCard>
              <CardContent>
                <SectionTitle variant="h6">Préférences de notation</SectionTitle>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Configurez vos préférences pour la notation automatique des travaux.
                </Typography>

                <FormControl fullWidth sx={{ mb: 3, mt: 2 }}>
                  <InputLabel>Modèle d'IA préféré</InputLabel>
                  <Select
                    value={preferredModel}
                    onChange={(e) => setPreferredModel(e.target.value)}
                    label="Modèle d'IA préféré"
                  >
                    <MenuItem value="openai">OpenAI GPT-4</MenuItem>
                    <MenuItem value="gemini">Google Gemini Pro</MenuItem>
                    <MenuItem value="anthropic">Anthropic Claude</MenuItem>
                    <MenuItem value="deepseek">Deepseek R1 V3</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Format d'exportation des notes</InputLabel>
                  <Select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    label="Format d'exportation des notes"
                  >
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="excel">Excel</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                    <MenuItem value="pdf">PDF</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </FormCard>

            <FormCard>
              <CardContent>
                <SectionTitle variant="h6">Intégration LMS</SectionTitle>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Configurez l'intégration avec votre système de gestion d'apprentissage (LMS).
                </Typography>

                <FormControl fullWidth sx={{ mb: 3, mt: 2 }}>
                  <InputLabel>Système LMS</InputLabel>
                  <Select
                    value=""
                    label="Système LMS"
                  >
                    <MenuItem value="canvas">Canvas</MenuItem>
                    <MenuItem value="blackboard">Blackboard</MenuItem>
                    <MenuItem value="moodle">Moodle</MenuItem>
                    <MenuItem value="google">Google Classroom</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="URL du LMS"
                  placeholder="https://votre-lms.exemple.com"
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Clé d'API du LMS"
                  type="password"
                  sx={{ mb: 3 }}
                />

                <Button 
                  variant="contained" 
                  color="primary"
                  sx={{ mt: 1 }}
                >
                  Connecter
                </Button>
              </CardContent>
            </FormCard>
          </Grid>

          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ px: 4, py: 1, borderRadius: 1 }}
            >
              Enregistrer les paramètres
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default Settings;
