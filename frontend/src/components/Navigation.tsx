import { AppBar, Toolbar, Typography, Button, Box, IconButton, useMediaQuery, Menu, MenuItem } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Blogs', path: '/blogs' },
];

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleClose();
  };

  const renderDesktopNav = () => (
    <Box sx={{ 
      display: 'flex', 
      gap: 2,
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      ml: 4
    }}>
      <Box sx={{ display: 'flex', gap: 3 }}>
        {navItems.map((item) => (
          <Button
            key={item.path}
            color="inherit"
            onClick={() => navigate(item.path)}
            aria-current={location.pathname === item.path ? 'page' : undefined}
            aria-label={`Navigate to ${item.label}`}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 1,
              bgcolor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            {item.label}
          </Button>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {user ? (
          <Button 
            color="inherit" 
            onClick={logout}
            sx={{ 
              px: 3,
              py: 1,
              bgcolor: 'primary.dark',
              '&:hover': { bgcolor: 'primary.dark', opacity: 0.9 }
            }}
          >
            Logout ({user.username})
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 1,
                bgcolor: location.pathname === '/login' ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              Login
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/register')}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 1,
                bgcolor: location.pathname === '/register' ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              Register
            </Button>
          </div>
        )}
      </Box>
    </Box>
  );

  const renderMobileNav = () => (
    <>
      <IconButton
        size="large"
        edge="end"
        color="inherit"
        aria-label="menu"
        onClick={handleMenu}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id="navigation-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{ mt: 1 }}
        MenuListProps={{
          'aria-label': 'Navigation options',
          role: 'menu'
        }}
      >
        {navItems.map((item) => (
          <MenuItem 
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            role="menuitem"
            aria-current={location.pathname === item.path ? 'page' : undefined}
          >
            {item.label}
          </MenuItem>
        ))}
        {user ? (
          <MenuItem 
            onClick={() => { logout(); handleClose(); }}
            role="menuitem"
          >
            Logout ({user.username})
          </MenuItem>
        ) : (
          <>
            <MenuItem 
              onClick={() => handleNavigation('/login')}
              role="menuitem"
            >
              Login
            </MenuItem>
            <MenuItem 
              onClick={() => handleNavigation('/register')}
              role="menuitem"
            >
              Register
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );

  return (
    <AppBar 
      position="fixed"
      component="nav"
      aria-label="Main navigation"
      sx={{
        width: '100%',
        left: 0,
        right: 0,
        mb: 3,
        background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)', // Darker gradient
        boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)'
      }}
    >
      <Toolbar sx={{ 
          width: '100%', 
          maxWidth: 'lg', 
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 4 }
        }}>
        <Box 
          component="div"
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            minWidth: 'fit-content'
          }}
        >
          <CalculateIcon 
            aria-hidden="true"
            sx={{ display: 'flex', mr: 2, color: '#ffffff' }} 
          />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ fontWeight: 'bold', color: '#ffffff' }}
          >
            Utility Zone
          </Typography>
        </Box>
        {isMobile ? renderMobileNav() : renderDesktopNav()}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
   
