import React, { useState } from 'react';
import { Box, Paper, Container, Tabs, Tab } from '@mui/material';
import CurrencyConverter from './CurrencyConverter';
import TimezoneConverter from './TimezoneConverter';
import FileConverter from './FileConverter';
import QRCodeGenerator from './QRCodeGenerator';
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
        <Box sx={{ p: 2 }}>
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
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, position: 'relative' }}>
      <Container maxWidth="md" sx={{ mt: 4, flex: 1 }}>
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
              <Tab label="File Converter" sx={{ py: 2 }} />
              <Tab label="QR Code Generator" sx={{ py: 2 }} />
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}>
            <CurrencyConverter />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <TimezoneConverter />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <FileConverter />
          </TabPanel>
          <TabPanel value={value} index={3}>
            <QRCodeGenerator />
          </TabPanel>
        </Paper>
      </Container>
      {/* Advertisement aligned right, scrolls with page */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: 300,
          ml: 3,
          flexShrink: 0,
          alignSelf: 'flex-start'
        }}
      >
        <Advertisement />
      </Box>
    </Box>
  );
}