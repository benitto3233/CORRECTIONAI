import React, { useState } from 'react';
import { Box, Typography, TextField, Grid, Card, CardContent, Button, MenuItem, Paper, Divider, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import Layout from '../components/Layout';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArticleIcon from '@mui/icons-material/Article';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RuleIcon from '@mui/icons-material/Rule';

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

const UploadBox = styled(Box)(({ theme }) => ({
  border: '2px dashed #ccc',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.3s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

const TypeButton = styled(Button)(({ theme, selected }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  '&:hover': {
    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.05),
  },
}));

const QuestionTypeButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  border: '1px solid #e0e0e0',
  textAlign: 'left',
  justifyContent: 'flex-start',
  marginBottom: theme.spacing(1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
}));

// Fonction pour créer un alpha avec Material UI
function alpha(color, value) {
  return color + value.toString(16).padStart(2, '0');
}

const CreateMaterial = () => {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [file, setFile] = useState(null);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  const handleFileUpload = (event) => {
    setFile(event.target.files[0]);
  };

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Créons votre matériel de cours
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormCard>
              <CardContent>
                <SectionTitle variant="h6">Titre</SectionTitle>
                <TextField
                  fullWidth
                  placeholder="Entrez le titre"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  variant="outlined"
                />
              </CardContent>
            </FormCard>
          </Grid>

          <Grid item xs={12}>
            <FormCard>
              <CardContent>
                <SectionTitle variant="h6">Type de devoir</SectionTitle>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TypeButton
                      fullWidth
                      selected={selectedType === 'homework'}
                      onClick={() => handleTypeSelect('homework')}
                      startIcon={<ArticleIcon />}
                    >
                      Devoir
                    </TypeButton>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TypeButton
                      fullWidth
                      selected={selectedType === 'exam'}
                      onClick={() => handleTypeSelect('exam')}
                      startIcon={<MenuBookIcon />}
                    >
                      Examen
                    </TypeButton>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TypeButton
                      fullWidth
                      selected={selectedType === 'rubric'}
                      onClick={() => handleTypeSelect('rubric')}
                      startIcon={<RuleIcon />}
                    >
                      Rubrique
                    </TypeButton>
                  </Grid>
                </Grid>
              </CardContent>
            </FormCard>
          </Grid>

          <Grid item xs={12}>
            <FormCard>
              <CardContent>
                <SectionTitle variant="h6">Sélectionner un devoir/examen pour créer une rubrique</SectionTitle>
                <UploadBox
                  component="label"
                  htmlFor="file-upload"
                >
                  <input
                    id="file-upload"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <CloudUploadIcon sx={{ fontSize: 48, color: '#4361EE', mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    Déposez vos documents de cours ici ou parcourez
                  </Typography>
                  {file && (
                    <Typography variant="body2" color="primary">
                      Fichier sélectionné: {file.name}
                    </Typography>
                  )}
                </UploadBox>
              </CardContent>
            </FormCard>
          </Grid>

          {selectedType === 'exam' && (
            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <SectionTitle variant="h6">Sélection des questions</SectionTitle>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <QuestionTypeButton fullWidth>
                        Choix multiple
                      </QuestionTypeButton>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <QuestionTypeButton fullWidth>
                        Remplir les blancs
                      </QuestionTypeButton>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <QuestionTypeButton fullWidth>
                        Réponse courte
                      </QuestionTypeButton>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <QuestionTypeButton fullWidth>
                        Correspondance
                      </QuestionTypeButton>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <QuestionTypeButton fullWidth>
                        Réponse longue
                      </QuestionTypeButton>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <QuestionTypeButton fullWidth>
                        Vrai/Faux
                      </QuestionTypeButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </FormCard>
            </Grid>
          )}

          <Grid item xs={12}>
            <FormCard>
              <CardContent>
                <SectionTitle variant="h6">Instructions</SectionTitle>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Veuillez décrire le sujet et les objectifs que vous aimeriez voir couverts. De plus, vous pouvez télécharger du matériel de cours supplémentaire pour préciser vos préférences.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Veuillez préciser vos exigences ici..."
                  variant="outlined"
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </FormCard>
          </Grid>

          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ px: 4, py: 1, borderRadius: 1 }}
            >
              Générer
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default CreateMaterial;
