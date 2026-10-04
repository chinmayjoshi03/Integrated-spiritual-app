import logo from '@/assets/logo.png';
import loginOrnament from '@/assets/login-ornament.png';
import './AuthVisualPanel.css';

interface AuthVisualPanelProps {
  headline: string;
  subtext: string;
}

const AuthVisualPanel = ({ headline, subtext }: AuthVisualPanelProps) => {
  return (
    <>
      <img src={logo} alt="Spiritual Platform" className="brand-logo" />
      <div className="auth-visual">
        <h1 className="auth-visual-headline">{headline}</h1>
        <div className="auth-visual-divider" />
        <p className="auth-visual-subtext">{subtext}</p>

        <div className="auth-visual-ring" style={{ left: '400px', top: '340px' }} />
        <div className="auth-visual-dot" style={{ left: '330px', top: '380px' }} />
        <div className="auth-visual-dot" style={{ left: '500px', top: '310px' }} />
        <div className="auth-visual-dot" style={{ left: '415px', top: '250px' }} />

        <img src={loginOrnament} alt="" className="auth-visual-ornament" />
      </div>
    </>
  );
};

export default AuthVisualPanel;