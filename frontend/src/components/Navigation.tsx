import { AppBar, Toolbar, Typography, Button, Box, IconButton, useMediaQuery, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef } from 'react';

interface SubNavItem {
  label: string;
  path: string;
  isHeader?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/' },

  {
    label: 'Tools',
    // keep path '/finance' so current routes continue to highlight correctly
    path: '/finance',
    subItems: [
      { label: 'Finance', path: '/finance', isHeader: true },
      { label: 'ROI Calculator', path: '/finance/roi' },
      { label: 'Compounding Calculator', path: '/finance/compounding' },
      { label: 'CAGR Calculator', path: '/finance/cagr' },
      { label: 'SIP Calculator', path: '/finance/sip' },
      { label: 'Dividend Tracker', path: '/finance/dividends' },
      { label: 'Ebook', path: '/tools/ebook', isHeader: true },
      { label: 'Ebook Writer', path: '/tools/ebook-writer' },
      { label: 'Author Page', path: '/tools/author-page' },
      { label: 'Publish Ebooks', path: '/tools/publish-ebooks' },
      { label: 'Template', path: '/tools/templates', isHeader: true },
      { label: 'Publish Template', path: '/tools/publish-template' },
      { label: 'Buyer PDF', path: '/admin/canva-templates' }
    ]
  },
  // Shop menu groups commerce-related items like Ebooks
  {
    label: 'Shop',
    path: '/shop',
    subItems: [
      { label: 'Ebooks', path: '/ebooks' },
      { label: 'Templates', path: '/shop/canva-templates' }
    ]
  },
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
  //,
  //{
  //  label: 'Games',
  //  path: '/games',
  //  subItems: [
  //    { label: 'Falling Ball', path: '/games/falling-ball' },
  //    { label: 'Dino Runner', path: '/games/dino-runner' }
  //  ]
  //}
];

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, deleteAccount } = useAuth();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  // Second-level submenu for Tools groups
  const [toolsGroupAnchorEl, setToolsGroupAnchorEl] = useState<null | HTMLElement>(null);
  const [activeToolsGroup, setActiveToolsGroup] = useState<string | null>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(userMenuAnchorEl);

  // Emoji icons for Tools > Finance submenu items
  const financeEmoji: Record<string, string> = {
    'CAGR Calculator': '📈',
    'SIP Calculator': '💰',
    'ROI Calculator': '📊',
    'Dividend Tracker': '🧾',
    'Compounding Calculator': '🔁'
  };
  // Emoji icons for Articles submenu items
  const articlesEmoji: Record<string, string> = {
    'Spring Boot': '🌱',
    'React JS': '⚛️',
    'Java': '☕',
    'PostgreSQL': '🐘',
    'Docker': '🐳',
    'Microservices': '🧩'
  };
    // Expanded icons for Tools submenu
    const toolsExtraEmoji: Record<string, string> = {
      'Finance': '💰',
      'ROI Calculator': '📊',
      'Compounding Calculator': '🔁',
      'CAGR Calculator': '📈',
      'SIP Calculator': '💸',
      'Dividend Tracker': '🧾',
      'Ebook': '📚',
      'Ebook Writer': '✍️',
      'Author Page': '👤',
      'Publish Ebooks': '🚀',
      'Template': '🎨',
      'Publish Template': '📝',
      'Buyer PDF': '📄'
    };

    // Icons for Shop submenu
    const shopExtraEmoji: Record<string, string> = {
      'Ebooks': '📚',
      'Templates': '🎨'
    };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleOpenSubMenu = (event: React.MouseEvent<HTMLElement>, label: string) => {
    setSubMenuAnchorEl(event.currentTarget);
    setActiveSubMenu(label);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSubMenuClose = () => {
    setSubMenuAnchorEl(null);
    setActiveSubMenu(null);
    // also close any second-level tools submenu
    setToolsGroupAnchorEl(null);
    setActiveToolsGroup(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleClose();
    handleSubMenuClose();
  };

  const handleUserMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(e.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
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
              onClick={item.subItems ? (e) => handleOpenSubMenu(e, item.label) : () => navigate(item.path)}
              aria-current={location.pathname === item.path ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
              aria-controls={item.subItems ? `${item.label}-menu` : undefined}
              aria-haspopup={item.subItems ? 'true' : undefined}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 1,
                bgcolor: (location.pathname.startsWith(item.path) || (item.subItems && item.subItems.some(si => location.pathname.startsWith(si.path)))) ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              {item.label}
              {item.subItems && ' ▾'}
            </Button>
            {/* sub-menu opens below (single Menu rendered outside the map) */}
          </Box>
        ))}
      </Box>
      {/* Single sub-menu for any nav item with subItems (Games, Articles, etc.) */}
      <Menu
        id={activeSubMenu ? `${activeSubMenu}-menu` : 'sub-menu'}
        anchorEl={subMenuAnchorEl}
        open={Boolean(subMenuAnchorEl)}
        onClose={handleSubMenuClose}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            mt: 1,
            minWidth: 240,
            boxShadow: 3
          }
        }}
      >
        {activeSubMenu === 'Tools'
          ? (() => {
              const tools = navItems.find(i => i.label === 'Tools');
              const sub = tools?.subItems || [];
              const groups: Record<string, SubNavItem[]> = {};
              let current: string | null = null;
              sub.forEach(si => {
                if (si.isHeader) {
                  current = si.label;
                  if (!groups[current]) groups[current] = [];
                } else if (current) {
                  groups[current].push(si);
                }
              });
              const groupLabels = Object.keys(groups);
              return groupLabels.map(gl => (
                <MenuItem
                  key={`tools-group-${gl}`}
                  aria-haspopup="true"
                  aria-controls={`tools-${gl}-submenu`}
                  onClick={e => {
                    setActiveToolsGroup(gl);
                    setToolsGroupAnchorEl(e.currentTarget);
                  }}
                  sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{gl}</Typography>
                  <Box component="span" aria-hidden>▸</Box>
                </MenuItem>
              ));
            })()
          : navItems.find(i => i.label === activeSubMenu)?.subItems?.map((subItem) => {
              const isArticles = activeSubMenu === 'Articles';
              const isShop = activeSubMenu === 'Shop';
              let emoji = '';
              if (isArticles) emoji = articlesEmoji[subItem.label];
              else if (isShop) emoji = shopExtraEmoji[subItem.label];
              else emoji = toolsExtraEmoji[subItem.label];
              if (subItem.isHeader) {
                return (
                  <MenuItem key={`${subItem.path}-header`} disabled sx={{ fontWeight: 700, opacity: 0.8, cursor: 'default' }}>
                    {subItem.label}
                  </MenuItem>
                );
              }
              return (
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
                  {emoji ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 200 }}>
                      <Box component="span" aria-hidden sx={{ fontSize: 18, width: 22, textAlign: 'center' }}>{emoji}</Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{subItem.label}</Typography>
                    </Box>
                  ) : (
                    subItem.label
                  )}
                </MenuItem>
              );
            })}
      </Menu>
      {/* Second-level submenu for Tools groups */}
      <Menu
        id={activeToolsGroup ? `tools-${activeToolsGroup}-submenu` : 'tools-submenu'}
        anchorEl={toolsGroupAnchorEl}
        open={Boolean(activeToolsGroup && toolsGroupAnchorEl)}
        onClose={() => { setToolsGroupAnchorEl(null); setActiveToolsGroup(null); }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            mt: 1,
            minWidth: 260,
            boxShadow: 3
          }
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {(() => {
          const tools = navItems.find(i => i.label === 'Tools');
          const sub = tools?.subItems || [];
          const groups: Record<string, SubNavItem[]> = {};
          let current: string | null = null;
          sub.forEach(si => {
            if (si.isHeader) {
              current = si.label;
              if (!groups[current]) groups[current] = [];
            } else if (current) {
              groups[current].push(si);
            }
          });
          const items = activeToolsGroup ? groups[activeToolsGroup] || [] : [];
          return items.map((si) => {
            const emoji = activeToolsGroup === 'Finance' ? (financeEmoji[si.label] || toolsExtraEmoji[si.label]) : toolsExtraEmoji[si.label];
            return (
              <MenuItem
                key={si.path}
                onClick={() => { handleNavigation(si.path); handleSubMenuClose(); }}
                selected={location.pathname === si.path}
                sx={{
                  py: 1,
                  px: 2,
                  '&:hover': { bgcolor: 'primary.light', color: 'white' },
                  '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }
                }}
              >
                {emoji ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 220 }}>
                    <Box component="span" aria-hidden sx={{ fontSize: 18, width: 22, textAlign: 'center' }}>{emoji}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{si.label}</Typography>
                  </Box>
                ) : si.label}
              </MenuItem>
            );
          });
        })()}
      </Menu>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {user ? (
          <>
            <Button
              color="inherit"
              aria-controls={userMenuOpen ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuOpen ? 'true' : undefined}
              onClick={handleUserMenuOpen}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              {user.username} ▾
            </Button>
            <Menu
              id="user-menu"
              anchorEl={userMenuAnchorEl}
              open={userMenuOpen}
              onClose={handleUserMenuClose}
              sx={{ '& .MuiPaper-root': { mt: 1, minWidth: 200, borderRadius: 2 } }}
            >
              <MenuItem
                onClick={() => { navigate('/profile'); handleUserMenuClose(); }}
              >
                My Profile
              </MenuItem>
              <MenuItem
                onClick={() => { logout(); handleUserMenuClose(); }}
              >
                Logout
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  handleUserMenuClose();
                  if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
                    try { await deleteAccount(); } catch (e: any) { alert(e?.message || 'Failed to delete account.'); }
                  }
                }}
                sx={{ color: 'error.main' }}
              >
                Delete Account
              </MenuItem>
            </Menu>
          </>
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
          item.subItems ? (
            <Box key={item.label}>
              <MenuItem
                disabled
                role="presentation"
                sx={{ fontWeight: 600, opacity: 0.8 }}
              >
                {item.label}
              </MenuItem>
              {item.subItems.map((sub) => {
                const isShop = item.label === 'Shop';
                let emoji = '';
                if (isShop) emoji = shopExtraEmoji[sub.label];
                else emoji = toolsExtraEmoji[sub.label];
                return sub.isHeader ? (
                  <MenuItem key={`${sub.path}-header`} disabled role="presentation" sx={{ pl: 2, fontWeight: 700, opacity: 0.8 }}>
                    {sub.label}
                  </MenuItem>
                ) : (
                  <MenuItem
                    key={sub.path}
                    onClick={() => handleNavigation(sub.path)}
                    selected={location.pathname === sub.path}
                    role="menuitem"
                    aria-current={location.pathname === sub.path ? 'page' : undefined}
                    sx={{ pl: 3 }}
                  >
                    {emoji ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box component="span" aria-hidden sx={{ fontSize: 18 }}>{emoji}</Box>
                        {sub.label}
                      </Box>
                    ) : sub.label}
                  </MenuItem>
                );
              })}
            </Box>
          ) : (
            <MenuItem 
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              role="menuitem"
              aria-current={location.pathname === item.path ? 'page' : undefined}
            >
              {item.label}
            </MenuItem>
          )
        ))}
        {user ? (
          <>
            <MenuItem 
              onClick={() => { handleNavigation('/profile'); }}
              role="menuitem"
            >
              My Profile
            </MenuItem>
            <MenuItem 
              onClick={() => { logout(); handleClose(); }}
              role="menuitem"
            >
              Logout ({user.username})
            </MenuItem>
            <MenuItem
              onClick={async () => {
                handleClose();
                if (window.confirm('Delete account permanently?')) {
                  try { await deleteAccount(); } catch (e: any) { alert(e?.message || 'Failed to delete account.'); }
                }
              }}
              role="menuitem"
            >
              Delete Account
            </MenuItem>
          </>
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
   
