import React, { useState } from 'react';
import { Box, Tab, Tabs, Paper } from '@mui/material';
import CurrencyConverter from './CurrencyConverter';
import TimezoneConverter from './TimezoneConverter';

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
    <Box sx={{ width: '100%', maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Currency Converter" />
            <Tab label="Timezone Converter" />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <CurrencyConverter />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <TimezoneConverter />
        </TabPanel>
      </Paper>
    </Box>
  );
}