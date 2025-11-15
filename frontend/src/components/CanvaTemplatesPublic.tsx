import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardMedia, CardActions, Button, Skeleton, Paper } from '@mui/material';
import { listPublicTemplates, type PublicCanvaTemplate } from '@/services/canvaTemplates';
import CanvaTemplatesAdmin from './CanvaTemplates';
import { useAuth } from '@/contexts/AuthContext';

const CanvaTemplatesPublic = () => {
  const [items, setItems] = useState<PublicCanvaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await listPublicTemplates();
      setItems(data);
    } catch (e: any) {
      setErr(e.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>Canva Templates</Typography>

      {isAdmin && isAdmin() && (
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Admin tools</Typography>
          {/* Reuse full admin component inline */}
          <CanvaTemplatesAdmin />
        </Paper>
      )}
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Browse our editable Canva templates. Click a card to view the listing.
      </Typography>

      {err && <Typography color="error" sx={{ mb: 2 }}>{err}</Typography>}

  <Grid container spacing={2}>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} item xs={12} sm={12} md={6}>
                <Card>
                  <Skeleton variant="rectangular" height={300} />
                  <CardActions>
                    <Button fullWidth disabled>Loading…</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}

            {!loading && items.map(t => (
              <Grid key={t.id} item xs={12} sm={12} md={6}>
                <Card sx={{ display: 'flex', flexDirection: 'column' }}>
              {t.mockupUrl ? (
                <CardMedia
                  component="img"
                  src={t.mockupUrl}
                  alt={t.title}
                  loading="lazy"
                  sx={{ height: { xs: 260, sm: 300, md: 340 }, objectFit: 'cover' }}
                />
              ) : (
                    <Box sx={{ height: { xs: 300, sm: 340, md: 380 }, bgcolor: 'grey.100' }} />
              )}
              <CardActions>
                <Button 
                  fullWidth
                  variant="contained" 
                  color="primary" 
                  disabled={!t.etsyListingUrl}
                  onClick={() => { if (t.etsyListingUrl) window.open(t.etsyListingUrl, '_blank'); }}
                >
                  View on Etsy
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {!loading && items.length === 0 && (
          <Grid item xs={12}><Typography color="text.secondary">No templates found.</Typography></Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CanvaTemplatesPublic;
