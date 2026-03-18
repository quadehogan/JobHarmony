import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import QuizInterface from './pages/QuizInterface';
import QuizResults from './pages/QuizResults';
import Jobs from './pages/Jobs';
import SavedJobs from './pages/SavedJobs';
import Recruit from './pages/Recruit';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/quiz" element={<QuizInterface />} />
          <Route path="/quiz/interface" element={<QuizInterface />} />
          <Route path="/quiz/results" element={<QuizResults />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/saved" element={<SavedJobs />} />
          <Route path="/recruit" element={<Recruit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
