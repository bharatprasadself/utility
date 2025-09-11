import React, { useState } from 'react';
import { Box, Paper, Container, Tabs, Tab } from '@mui/material';
import CurrencyConverter from './CurrencyConverter';
import TimezoneConverter from './TimezoneConverter';
import Advertisement from './Advertisement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="dashboard tabs"
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{ bgcolor: 'grey.100' }}
          >
            <Tab label="Currency Converter" sx={{ py: 2 }} />
            <Tab label="Timezone Converter" sx={{ py: 2 }} />
          </Tabs>
        </Box>
        
        <TabPanel value={value} index={0}>
          <CurrencyConverter />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <TimezoneConverter />
        </TabPanel>
      </Paper>

      {/* Render Advertisement at bottom on small screens, side on larger screens */}
      <Box sx={{ 
        mt: { xs: 3, md: 0 }, 
        ml: { md: 3 },
        position: { md: 'fixed' },
        right: { md: '2rem' },
        top: { md: '5rem' },
        width: { md: '300px' }
      }}>
        <Advertisement />
      </Box>
    </Container>
  );
}