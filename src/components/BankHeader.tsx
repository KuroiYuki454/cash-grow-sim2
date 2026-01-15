import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, Menu, LogOut, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function BankHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-money flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl hidden sm:block">MoneyFlow</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            Compte
          </Link>
          <Link
            to="/upgrades"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              isActive('/upgrades') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Améliorations
          </Link>
          <Link
            to="/virtual"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              isActive('/virtual') 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Carte virtuelle
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
            type="button"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-secondary"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              Compte
            </Link>
            <Link
              to="/upgrades"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive('/upgrades') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Améliorations
            </Link>
            <Link
              to="/virtual"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive('/virtual') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Carte virtuelle
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
              type="button"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
