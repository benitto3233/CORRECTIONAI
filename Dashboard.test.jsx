const { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../src/pages/Dashboard';
import '@testing-library/jest-dom';

// Mock des composants et des hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock des données
const mockAssignments = [
  { _id: '1', title: 'Devoir de mathématiques', type: 'homework', createdAt: new Date().toISOString() },
  { _id: '2', title: 'Examen de français', type: 'exam', createdAt: new Date().toISOString() }
];

const mockStats = {
  totalAssignments: 10,
  totalGraded: 8,
  averageScore: 85,
  pendingSubmissions: 5
};

// Mock du service API
jest.mock('../src/services/api', () => ({
  getRecentAssignments: jest.fn().mockResolvedValue(mockAssignments),
  getStats: jest.fn().mockResolvedValue(mockStats)
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  });

  test('affiche le titre du tableau de bord', () => {
    expect(screen.getByText(/Bonjour/i)).toBeInTheDocument();
  });

  test('affiche les sections principales du tableau de bord', () => {
    expect(screen.getByText(/À faire/i)).toBeInTheDocument();
    expect(screen.getByText(/Récemment noté/i)).toBeInTheDocument();
    expect(screen.getByText(/Récemment créé/i)).toBeInTheDocument();
  });

  test('affiche les statistiques', async () => {
    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument(); // Total des devoirs
      expect(screen.getByText(/85/)).toBeInTheDocument(); // Note moyenne
    });
  });

  test('affiche les devoirs récents', async () => {
    await waitFor(() => {
      expect(screen.getByText(/Devoir de mathématiques/i)).toBeInTheDocument();
      expect(screen.getByText(/Examen de français/i)).toBeInTheDocument();
    });
  });

  test('le bouton Nouveau fonctionne correctement', () => {
    const newButton = screen.getByText(/Nouveau/i);
    expect(newButton).toBeInTheDocument();
    
    fireEvent.click(newButton);
    // Vérifier que la navigation a été appelée (implémentation spécifique dépend de la structure)
  });
});
