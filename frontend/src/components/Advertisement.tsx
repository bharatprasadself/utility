import { Paper, Typography, Box } from '@mui/material';

const Advertisement = () => {
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        width: '200px',
        minHeight: { xs: '240px', sm: '400px' },
        maxHeight: 'calc(100vh - 120px)', /* responsive to viewport */
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Sponsored
      </Typography>
      
      {/* Sample Ad Slots */}
      {[1, 2, 3].map((slot) => (
        <Box 
          key={slot}
          sx={{
            height: '150px',
            bgcolor: 'grey.100',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2
          }}
        >
          <Typography color="text.secondary">
            Ad Space {slot}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

export default Advertisement;
