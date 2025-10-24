import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Box, Button, Select, MenuItem } from '@mui/material';
import Advertisement from './Advertisement';

type Props = {
  slug: string;
  onMessage?: (msg: any) => void;
  style?: React.CSSProperties;
  fullScreen?: boolean;
};

const GameEmbed: React.FC<Props> = ({ slug, onMessage, style, fullScreen = false }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [status, setStatus] = useState({ score:0, highScore:0, difficulty:'normal', paused:false });

  const handleMessage = useCallback((ev: MessageEvent) => {
    // accept same-origin messages only
    if (ev.origin !== window.location.origin) return;
    const msg = ev.data || {};
    if (msg.type === 'STATUS'){
      setStatus({ score: msg.score || 0, highScore: msg.highScore || 0, difficulty: msg.difficulty || 'normal', paused: !!msg.paused });
    }
    if (onMessage) onMessage(ev.data);
  }, [onMessage]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const postToChild = (msg: any) => {
    const w = iframeRef.current?.contentWindow;
    if (w) w.postMessage(msg, window.location.origin);
  };

  // helpers for UI actions
  const sendPause = () => postToChild({ type: 'PAUSE' });
  const sendResume = () => postToChild({ type: 'RESUME' });
  // mode toggle removed; always human mode
  const sendSetDifficulty = (value: string) => postToChild({ type: 'SET_DIFFICULTY', value });
  const sendReset = () => postToChild({ type: 'RESET' });

  const enterFullscreen = async () => {
    const el = iframeRef.current;
    if (!el) return;
    if (el.requestFullscreen) await el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
  };

  // If fullScreen, render controls and fixed overlay; otherwise, embed inline using provided style
  return (
    <Box>
      {fullScreen && (
      <Box sx={{ position: 'fixed', top: 8, right: 8, zIndex: 1200, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button href="/" variant="outlined" sx={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.14)', bgcolor: 'transparent', textTransform: 'none', '&:hover': { borderColor: 'rgba(96,165,250,0.22)' } }}>← Back</Button>
        <Button onClick={() => sendPause()} variant="outlined" sx={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.14)', bgcolor: 'transparent', textTransform: 'none', '&:hover': { borderColor: 'rgba(96,165,250,0.22)' } }}>Pause</Button>
        <Button onClick={() => sendResume()} variant="outlined" sx={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.14)', bgcolor: 'transparent', textTransform: 'none', '&:hover': { borderColor: 'rgba(96,165,250,0.22)' } }}>Resume</Button>
  {/* Mode toggle removed - game is always human-controlled */}
        <Select
          value={status.difficulty}
          onChange={(e) => sendSetDifficulty(String(e.target.value))}
          size="small"
          variant="outlined"
          sx={{
            minWidth: 96,
            bgcolor: 'transparent',
            textTransform: 'none',
            '& .MuiSelect-select': { color: '#60a5fa', padding: '6px 10px' },
            '& .MuiOutlinedInput-input': { color: '#60a5fa' },
            '& .MuiSelect-icon': { color: '#60a5fa' },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(96,165,250,0.14)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(96,165,250,0.22)' }
          }}
        >
          <MenuItem value="easy">Easy</MenuItem>
          <MenuItem value="normal">Normal</MenuItem>
          <MenuItem value="hard">Hard</MenuItem>
        </Select>
  <Button onClick={() => sendReset()} variant="outlined" sx={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.14)', bgcolor: 'transparent', textTransform: 'none', '&:hover': { borderColor: 'rgba(96,165,250,0.22)' } }}>Reset</Button>
  <Button onClick={enterFullscreen} variant="outlined" sx={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.14)', bgcolor: 'transparent', textTransform: 'none', '&:hover': { borderColor: 'rgba(96,165,250,0.22)' } }}>Fullscreen</Button>
      </Box>
      )}

      {/* Advertisement panel (reused component) */}
      {fullScreen && (
        <Box sx={{ position: 'fixed', top: 64, right: 8, zIndex: 1195, display: { xs: 'none', sm: 'block' } }}>
          <Advertisement />
        </Box>
      )}

     <iframe
        ref={iframeRef}
        src={`/games/${slug}/index.html`}
        title={slug}
        style={fullScreen
          ? { position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', border: 0, zIndex: 1100, ...(style || {}) }
          : { width: '100%', height: '480px', border: 0, ...(style || {}) }
        }
        sandbox="allow-scripts allow-same-origin allow-forms"
        allow="fullscreen"
      />
    </Box>
  );
};

export default GameEmbed;
