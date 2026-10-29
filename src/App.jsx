import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import TestsScreen from './components/TestsScreen';
import WellnessScreen from './components/WellnessScreen';
import MoreScreen from './components/MoreScreen';
import FaceScanScreen from './components/FaceScanScreen';
import ColorimetriaScreen from './components/ColorimetriaScreen';
import SkinTestScreen from './components/SkinTestScreen';
import ChatScreen from './components/ChatScreen';
import PremiumModal from './components/PremiumModal';
import ProfileScreen from './components/ProfileScreen';
import ResultsScreen from './components/ResultsScreen';
import LookbookScreen from './components/LookbookScreen';
import CollageScreen from './components/CollageScreen';
import PlanScreen from './components/PlanScreen';
import BottomNav from './components/BottomNav';
import OnboardingFlow from './components/OnboardingFlow';
import { hasCompletedOnboarding } from './utils/profile';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => !hasCompletedOnboarding());
  const [tab, setTab] = useState('home');
  const [screen, setScreen] = useState(null);
  const [showPremium, setShowPremium] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  if (showOnboarding) {
    return (
      <div style={{
        width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100vh',
        background: 'var(--bg)', position: 'relative', overflow: 'hidden',
      }}>
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      </div>
    );
  }

  const navigate = (newTab, newScreen = null) => {
    setFadeIn(false);
    setTimeout(() => {
      setTab(newTab);
      setScreen(newScreen);
      setFadeIn(true);
    }, 120);
  };

  const renderContent = () => {
    if (screen === 'facial') return <FaceScanScreen onBack={() => navigate('tests')} />;
    if (screen === 'colorimetria') return <ColorimetriaScreen onBack={() => navigate('tests')} />;
    if (screen === 'skintest') return <SkinTestScreen onBack={() => navigate('tests')} />;
    if (screen === 'chat') return <ChatScreen onBack={() => navigate('home')} />;
    if (screen === 'profile') return <ProfileScreen onBack={() => navigate('more')} />;
    if (screen === 'results') return <ResultsScreen onBack={() => navigate('more')} onNavigate={navigate} />;
    if (screen === 'lookbook') return <LookbookScreen onBack={() => navigate('home')} onNavigate={navigate} />;
    if (screen === 'collage') return <CollageScreen onBack={() => navigate('home', 'lookbook')} onNavigate={navigate} />;

    switch (tab) {
      case 'home': return <HomeScreen onNavigate={navigate} onPremium={() => setShowPremium(true)} />;
      case 'plan': return <PlanScreen />;
      case 'tests': return <TestsScreen onNavigate={navigate} />;
      case 'wellness': return <WellnessScreen />;
      case 'more': return <MoreScreen onPremium={() => setShowPremium(true)} onNavigate={navigate} />;
      default: return <HomeScreen onNavigate={navigate} />;
    }
  };

  return (
    <div style={{
      width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100vh',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        paddingBottom: screen ? 0 : 90, minHeight: '100vh',
        opacity: fadeIn ? 1 : 0, transform: fadeIn ? 'none' : 'translateY(6px)',
        transition: 'all 0.2s ease',
      }}>
        {renderContent()}
      </div>

      {!screen && <BottomNav tab={tab} onTab={navigate} />}
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </div>
  );
}
