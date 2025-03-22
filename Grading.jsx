import React, { useState } from 'react';
import { Box, Typography, TextField, Grid, Card, CardContent, Button, Paper, Divider, IconButton, Stepper, Step, StepLabel } from '@mui/material';
import { styled } from '@mui/material/styles';
import Layout from '../components/Layout';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

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
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.3s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

const UploadButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  borderRadius: theme.spacing(0.5),
}));

const FileItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  marginTop: theme.spacing(1),
  backgroundColor: '#f5f5f5',
  borderRadius: theme.spacing(0.5),
}));

const Grading = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState({
    questionPaper: null,
    studentSubmissions: null,
    solutions: null,
    rubric: null
  });
  const [instructions, setInstructions] = useState('');

  const handleFileUpload = (type) => (event) => {
    if (event.target.files && event.target.files[0]) {
      setFiles({
        ...files,
        [type]: event.target.files[0]
      });
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const steps = ['Téléchargement des fichiers', 'Instructions de notation', 'Notation'];

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Notation des travaux
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <SectionTitle variant="h6">Questionnaire</SectionTitle>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Téléchargez le document contenant les questions du devoir ou de l'examen.
                  </Typography>
                  <UploadBox
                    component="label"
                    htmlFor="question-paper-upload"
                  >
                    <input
                      id="question-paper-upload"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload('questionPaper')}
                    />
                    <UploadFileIcon sx={{ fontSize: 40, color: '#4361EE', mb: 1 }} />
                    <Typography variant="body1" gutterBottom>
                      Aucun fichier téléchargé
                    </Typography>
                    <UploadButton variant="contained" color="primary">
                      Télécharger
                    </UploadButton>
                  </UploadBox>
                  {files.questionPaper && (
                    <FileItem>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {files.questionPaper.name}
                      </Typography>
                    </FileItem>
                  )}
                </CardContent>
              </FormCard>
            </Grid>

            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <SectionTitle variant="h6">Soumissions des élèves</SectionTitle>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Téléchargez les travaux manuscrits des élèves à noter.
                  </Typography>
                  <UploadBox
                    component="label"
                    htmlFor="student-submissions-upload"
                  >
                    <input
                      id="student-submissions-upload"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload('studentSubmissions')}
                      multiple
                    />
                    <UploadFileIcon sx={{ fontSize: 40, color: '#4361EE', mb: 1 }} />
                    <Typography variant="body1" gutterBottom>
                      Aucun fichier téléchargé
                    </Typography>
                    <UploadButton variant="contained" color="primary">
                      Télécharger
                    </UploadButton>
                  </UploadBox>
                  {files.studentSubmissions && (
                    <FileItem>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {files.studentSubmissions.name}
                      </Typography>
                    </FileItem>
                  )}
                </CardContent>
              </FormCard>
            </Grid>

            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <SectionTitle variant="h6">Solutions</SectionTitle>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Téléchargez le corrigé ou les solutions du devoir.
                  </Typography>
                  <UploadBox
                    component="label"
                    htmlFor="solutions-upload"
                  >
                    <input
                      id="solutions-upload"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload('solutions')}
                    />
                    <UploadFileIcon sx={{ fontSize: 40, color: '#4361EE', mb: 1 }} />
                    <Typography variant="body1" gutterBottom>
                      Aucun fichier téléchargé
                    </Typography>
                    <UploadButton variant="contained" color="primary">
                      Télécharger
                    </UploadButton>
                  </UploadBox>
                  {files.solutions && (
                    <FileItem>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {files.solutions.name}
                      </Typography>
                    </FileItem>
                  )}
                </CardContent>
              </FormCard>
            </Grid>

            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <SectionTitle variant="h6">Rubrique</SectionTitle>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Téléchargez une rubrique de notation ou utilisez une rubrique existante.
                  </Typography>
                  <UploadBox
                    component="label"
                    htmlFor="rubric-upload"
                  >
                    <input
                      id="rubric-upload"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload('rubric')}
                    />
                    <UploadFileIcon sx={{ fontSize: 40, color: '#4361EE', mb: 1 }} />
                    <Typography variant="body1" gutterBottom>
                      Aucun fichier téléchargé
                    </Typography>
                    <UploadButton variant="contained" color="primary">
                      Télécharger
                    </UploadButton>
                  </UploadBox>
                  {files.rubric && (
                    <FileItem>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {files.rubric.name}
                      </Typography>
                    </FileItem>
                  )}
                </CardContent>
              </FormCard>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                sx={{ px: 4, py: 1, borderRadius: 1 }}
              >
                Suivant
              </Button>
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <SectionTitle variant="h6">Instructions supplémentaires (Optionnel)</SectionTitle>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Ajoutez des instructions spécifiques pour personnaliser la notation selon vos besoins.
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    placeholder="Exemple:
- Comment personnaliser la notation pour correspondre à votre style
- Quels critères devraient guider la notation
- Quelle échelle de notation utiliser
- Quels points partiels devraient être accordés pour les réponses partielles
- Quelles erreurs courantes devraient être soulignées
- Quel ton les commentaires de feedback devraient avoir"
                    variant="outlined"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </FormCard>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={handleBack}
                sx={{ px: 4, py: 1, borderRadius: 1 }}
              >
                Retour
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                sx={{ px: 4, py: 1, borderRadius: 1 }}
              >
                Commencer la notation
              </Button>
            </Grid>
          </Grid>
        )}

        {activeStep === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormCard>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <PlayArrowIcon sx={{ fontSize: 60, color: '#4361EE', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    Notation en cours...
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    Notre IA analyse les soumissions des élèves et applique les critères de notation.
                    Ce processus peut prendre quelques minutes.
                  </Typography>
                </CardContent>
              </FormCard>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={handleBack}
                sx={{ px: 4, py: 1, borderRadius: 1 }}
              >
                Retour
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled
                sx={{ px: 4, py: 1, borderRadius: 1 }}
              >
                Voir les résultats
              </Button>
            </Grid>
          </Grid>
        )}
      </Box>
    </Layout>
  );
};

export default Grading;
