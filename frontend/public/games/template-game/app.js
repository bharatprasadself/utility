/* Template Game Shell
 - This template registers a global `GameShell` object with lifecycle methods
 - Replace the game loop below with your own game logic.
*/
(function(){
  const root = document.getElementById('game-root');

  // simple canvas creation
  const canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let raf = null;
  let running = false;

  function resize(){
    const w = Math.max(320, window.innerWidth - 48);
    const h = Math.max(240, Math.round(w * 3/4));
    canvas.width = w;
    canvas.height = h;
  }

  function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#022';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillText('Template Game Canvas', 20,40);
  }

  function loop(){
    render();
    raf = requestAnimationFrame(loop);
  }

  window.GameShell = {
    init({ container, params } = {}){
      resize();
      window.addEventListener('resize', resize);
      running = true;
      loop();
      // notify parent (if present)
      try{ parent.postMessage({ type:'READY' }, location.origin); }catch(e){}
    },
    resize(width,height){ resize(); },
    pause(){ if (running && raf){ cancelAnimationFrame(raf); raf=null; running=false; } },
    resume(){ if (!running){ running=true; loop(); } },
    destroy(){ window.removeEventListener('resize', resize); if (raf) cancelAnimationFrame(raf); },
    onMessage(msg){
      // handle messages from parent
      if (msg && msg.type === 'PAUSE') this.pause();
      if (msg && msg.type === 'RESUME') this.resume();
    },
    postToParent(obj){ try{ parent.postMessage(obj, location.origin); }catch(e){} }
  };

  // auto-init when opened directly
  if (!window.parent || window.parent === window){
    window.addEventListener('load', ()=>{ if (window.GameShell && GameShell.init) GameShell.init({ container: root }); });
  }

})();
