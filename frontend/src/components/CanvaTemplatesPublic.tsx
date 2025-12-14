import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardMedia, CardActions, CardContent, Button, Skeleton, Container } from '@mui/material';
import { listPublicTemplates, type PublicTemplate } from '@/services/templates';
import { API_BASE_URL } from '@/services/axiosConfig';
import Advertisement from './Advertisement';

const CanvaTemplatesPublic = () => {
  const [items, setItems] = useState<PublicTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          borderBottom: '2px solid',
          borderColor: 'grey.200',
          pb: 2
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Canva Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hand-picked editable designs. Click to view on Etsy.
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {loading ? 'Loading…' : `${items.length} item${items.length === 1 ? '' : 's'}`}
          </Typography>
        </Box>

        {/* Admin tools are intentionally not shown on Shop route */}

        {err && <Typography color="error" sx={{ mb: 2 }}>{err}</Typography>}

  <Grid container spacing={2}>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} item xs={12} sm={6} md={6}>
                <Card>
                  <Skeleton variant="rectangular" height={260} />
                  <CardContent>
                    <Skeleton variant="text" width="80%" />
                  </CardContent>
                  <CardActions>
                    <Button fullWidth disabled>Loading…</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}

            {!loading && items.map(t => {
              const imgSrc = t.mockupUrl
                ? (t.mockupUrl.startsWith('http') ? t.mockupUrl : `${API_BASE_URL}${t.mockupUrl}`)
                : undefined;
              return (
              <Grid key={t.id} item xs={12} sm={6} md={6}>
                <Card sx={{ display: 'flex', flexDirection: 'column', transition: 'box-shadow .2s ease', '&:hover': { boxShadow: 6 } }}>
              {imgSrc ? (
                <CardMedia
                  component="img"
                  src={imgSrc}
                  alt={t.title}
                  loading="lazy"
                  sx={{ height: { xs: 200, sm: 220, md: 260 }, objectFit: 'cover' }}
                />
              ) : (
                    <Box sx={{ height: { xs: 200, sm: 220, md: 260 }, bgcolor: 'grey.100' }} />
              )}
              <CardContent sx={{ pb: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  title={t.title}
                  sx={{
                    display: 'block',
                    overflowWrap: 'anywhere'
                  }}
                >
                  {t.title}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  fullWidth
                  variant="contained" 
                  color="primary" 
                  disabled={!t.etsyListingUrl}
                  onClick={() => { if (t.etsyListingUrl) window.open(t.etsyListingUrl, '_blank'); }}
                >
                  Buy
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )})}

        {!loading && items.length === 0 && (
          <Grid item xs={12}><Typography color="text.secondary">No templates found.</Typography></Grid>
        )}
      </Grid>
      </Container>
      {/* Right rail ads: match Blog layout exactly */}
      <Box
        sx={{
          marginTop: '0',
          ml: 6,
          alignSelf: 'flex-start',
          position: 'sticky',
          top: '5rem',
          width: '200px',
          display: 'flex',
          justifyContent: 'flex-end',
          mr: 1
        }}
      >
        <Advertisement />
      </Box>
    </Box>
  );
};

export default CanvaTemplatesPublic;
