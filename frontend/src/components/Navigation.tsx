import { AppBar, Toolbar, Typography, Button, Box, IconButton, useMediaQuery, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface SubNavItem {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  path: string;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Blogs', path: '/blogs' },
  { 
    label: 'Articles',
    path: '/articles',
    subItems: [
      { label: 'Spring Boot', path: '/articles/spring-boot' },
      { label: 'React JS', path: '/articles/react' },
      { label: 'Java', path: '/articles/java' },
      { label: 'PostgreSQL', path: '/articles/postgresql' },
      { label: 'Docker', path: '/articles/docker' },
      { label: 'Microservices', path: '/articles/microservices' },
    ]
  }
];

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [articleAnchorEl, setArticleAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleArticleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setArticleAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleArticleClose = () => {
    setArticleAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleClose();
    handleArticleClose();
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
          <Box key={item.path}>
            <Button
              color="inherit"
              onClick={item.subItems ? handleArticleMenu : () => navigate(item.path)}
              aria-current={location.pathname === item.path ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
              aria-controls={item.subItems ? 'article-menu' : undefined}
              aria-haspopup={item.subItems ? 'true' : undefined}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 1,
                bgcolor: location.pathname.startsWith(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              {item.label}
              {item.subItems && ' ▾'}
            </Button>
            {item.subItems && (
              <Menu
                id="article-menu"
                anchorEl={articleAnchorEl}
                open={Boolean(articleAnchorEl)}
                onClose={handleArticleClose}
                sx={{
                  '& .MuiPaper-root': {
                    borderRadius: 2,
                    mt: 1,
                    minWidth: 180,
                    boxShadow: 3
                  }
                }}
              >
                {item.subItems.map((subItem) => (
                  <MenuItem
                    key={subItem.path}
                    onClick={() => handleNavigation(subItem.path)}
                    selected={location.pathname === subItem.path}
                    sx={{
                      py: 1,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'white'
                      },
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark'
                        }
                      }
                    }}
                  >
                    {subItem.label}
                  </MenuItem>
                ))}
              </Menu>
            )}
          </Box>
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
          <img 
            src="/favicon.ico"
            alt="Utility Zone Logo"
            style={{ 
              width: '32px', 
              height: '32px',
              marginRight: '16px',
              backgroundColor: 'white',
              padding: '4px',
              borderRadius: '4px'
            }}
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
   
