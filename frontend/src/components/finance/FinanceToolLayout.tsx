import { Box, Grid, Paper, Stack, Typography } from '@mui/material';
import type { PropsWithChildren, ReactNode } from 'react';

interface FinanceToolLayoutProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string; // emoji
  sidebar?: ReactNode; // optional right-side content
}

export default function FinanceToolLayout({ title, subtitle, description, icon, children, sidebar }: PropsWithChildren<FinanceToolLayoutProps>) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {icon && <Box component="span" aria-hidden sx={{ fontSize: 24 }}>{icon}</Box>}
        <Typography variant="h4" fontWeight={700} color="primary.main">{title}</Typography>
      </Box>
      {subtitle && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.6, fontWeight: 600 }}
        >
          {subtitle}
        </Typography>
      )}
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.9rem', md: '0.95rem' }, lineHeight: 1.6 }}
        >
          {description}
        </Typography>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Stack spacing={2}>{children}</Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          {sidebar ? (
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              {sidebar}
            </Paper>
          ) : null}
        </Grid>
      </Grid>
    </Box>
  );
}
