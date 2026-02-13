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
import BottomNav from './components/BottomNav';

export default function App() {
  const [tab, setTab] = useState('home');
  const [screen, setScreen] = useState(null);
  const [showPremium, setShowPremium] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

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

    switch (tab) {
      case 'home': return <HomeScreen onNavigate={navigate} onPremium={() => setShowPremium(true)} />;
      case 'tests': return <TestsScreen onNavigate={navigate} />;
      case 'wellness': return <WellnessScreen />;
      case 'more': return <MoreScreen onPremium={() => setShowPremium(true)} />;
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
