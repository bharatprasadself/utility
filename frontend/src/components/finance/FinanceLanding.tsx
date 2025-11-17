import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const tools = [
  { label: 'CAGR Calculator', path: '/finance/cagr', description: 'Annualized growth rate between two values.' },
  { label: 'SIP Calculator', path: '/finance/sip', description: 'Future value of monthly recurring investments.' },
  { label: 'ROI Calculator', path: '/finance/roi', description: 'Return on investment percentage.' },
  { label: 'Dividend Tracker', path: '/finance/dividends', description: 'Track dividend holdings & income.' },
  { label: 'Compounding Calculator', path: '/finance/compounding', description: 'Future value with custom compounding and contributions.' },
];

export default function FinanceLanding() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4" fontWeight={700} color="primary.main">Finance Tools</Typography>
      <Typography variant="body2" color="text.secondary">
        Explore calculators and trackers to analyze investment performance.
      </Typography>
      <Card>
        <CardContent>
          <List>
            {tools.map(t => (
              <ListItem key={t.path} disablePadding>
                <ListItemButton onClick={() => navigate(t.path)}>
                  <ListItemText 
                    primary={t.label}
                    secondary={t.description}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
