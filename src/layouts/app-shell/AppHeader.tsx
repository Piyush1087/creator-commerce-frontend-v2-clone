import { Bell, Menu, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "../../design-system/aurora";

type AppHeaderProps = {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
};

export function AppHeader({ onToggleMenu }: AppHeaderProps) {
  const location = useLocation();
  
  const getPageTitle = () => {
    if (location.pathname.includes('brand-centre-budget')) return 'Budget Alignment';
    if (location.pathname.includes('brand-centre')) return 'Solv Skincare';
    return 'Dashboard';
  };

  const getBreadcrumb = () => {
    if (location.pathname.includes('brand-centre')) return 'Brand Centre';
    return 'Home';
  };

  return (
    <header className="aurora-header">
      <div className="aurora-header__left">
        <div className="aurora-header__logo">
          <div className="aurora-header__logo-mark">T</div>
        </div>
        <div className="aurora-header__breadcrumbs">
          <span>{getBreadcrumb()}</span>
          <div className="aurora-header__separator">
            <ChevronRight size={14} />
          </div>
          <span className="aurora-header__current">{getPageTitle()}</span>
        </div>
      </div>

      <div className="aurora-header__right">
        <Button 
          variant="primary" 
          style={{ height: 40, paddingInline: 24, fontSize: 13 }}
        >
          Upgrade
        </Button>
        
        <button className="aurora-header__btn" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className="aurora-header__user">
          <div className="aurora-header__avatar">
            B
          </div>
        </div>

        <button 
          className="aurora-header__btn aurora-header__menu-trigger" 
          onClick={onToggleMenu}
          aria-label="Open Menu"
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}
