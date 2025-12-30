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

  const [imgIndexes, setImgIndexes] = useState<{[id: number]: number}>({});

  const getImages = (t: PublicTemplate): string[] => {
    return [t.mockupUrl, t.secondaryMockupUrl, t.mobileMockupUrl]
      .filter((url): url is string => !!url)
      .map(url => url.startsWith('http') ? url : `${API_BASE_URL}${url}`);
  };

  const handlePrev = (id: number, images: string[]) => {
    setImgIndexes(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? images.length - 1 : (prev[id] - 1 + images.length) % images.length
    }));
  };
  const handleNext = (id: number, images: string[]) => {
    setImgIndexes(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? 1 : (prev[id] + 1) % images.length
    }));
  };

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
            const images = getImages(t);
            const idx = imgIndexes[t.id] ?? 0;
            const imgSrc = images[idx];
            return (
              <Grid key={t.id} item xs={12} sm={6} md={6}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'box-shadow .2s ease', '&:hover': { boxShadow: 6 } }}>
                  <Box sx={{ position: 'relative', height: { xs: 200, sm: 220, md: 260 }, bgcolor: imgSrc ? undefined : 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {imgSrc ? (
                      <CardMedia
                        component="img"
                        src={imgSrc}
                        alt={t.title}
                        loading="lazy"
                        sx={{ height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ height: '100%', width: '100%', bgcolor: 'grey.100' }} />
                    )}
                    {images.length > 1 && (
                      <>
                        <Button onClick={() => handlePrev(t.id, images)} sx={{ position: 'absolute', left: 8, minWidth: 32, bgcolor: 'rgba(255,255,255,0.7)' }} size="small">&#8592;</Button>
                        <Button onClick={() => handleNext(t.id, images)} sx={{ position: 'absolute', right: 8, minWidth: 32, bgcolor: 'rgba(255,255,255,0.7)' }} size="small">&#8594;</Button>
                      </>
                    )}
                  </Box>
                  <CardContent sx={{ pb: 0, minHeight: 72 }}>
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
                  <CardActions sx={{ mt: 'auto' }}>
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
            );
          })}

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
