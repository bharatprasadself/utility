/*
  Falling Ball Rescue - JS Canvas version
  - ball falls straight down under gravity
  - paddle can move left/right
  - human controls or minimax AI chooses action per tick
  - minimax: actions = ['LEFT','STAY','RIGHT'], depth configurable, alpha-beta pruning
  - save/load high-score and settings in localStorage
*/

(() => {
  // Canvas + context
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size to fit available viewport so game is fully visible without scrollbars
  function computeAndSetCanvasSize(){
    // allow larger canvas on wide screens to better fill the browser
    const maxW = 1200;
    const maxH = 1400;
    const minW = 300;
    const minH = 240;

    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const headerH = header ? header.offsetHeight : 0;
    const footerH = footer ? footer.offsetHeight : 0;

    // available viewport size minus header/footer and margins
    const availH = Math.max(minH, window.innerHeight - headerH - footerH - 48);
    const availW = Math.max(minW, window.innerWidth - 48);

  // prefer to fit by height (so canvas fills browser height), maintain 4:3 aspect
  const aspect = 4 / 3;
  // if running embedded (iframe), allow a tighter fit so canvas spans nearly full viewport
  const isEmbedded = document.body.classList.contains('embedded');
  const verticalInset = isEmbedded ? 8 : 48; // fewer margins when embedded
  let chosenH = Math.min(maxH, Math.max(minH, window.innerHeight - headerH - footerH - verticalInset));
    let chosenW = Math.round(chosenH * aspect);

    // if width would overflow, fallback to width-limited sizing
    if (chosenW > availW) {
      chosenW = Math.min(maxW, availW);
      chosenH = Math.round(chosenW / aspect);
    }

    // clamp to minimums
    chosenW = Math.max(minW, chosenW);
    chosenH = Math.max(minH, chosenH);

  // reduce width by 10% while preserving aspect ratio
  chosenW = Math.max(minW, Math.round(chosenW * 0.9));
  chosenH = Math.round(chosenW / aspect);

    // If embedded, prefer spanning full viewport height (CSS) and set pixel buffer accordingly
    if (isEmbedded) {
      // compute desired CSS size (span full viewport height)
      const cssH = window.innerHeight; // 100vh
      const cssW = Math.round(Math.min(window.innerWidth - 16, cssH * aspect));
      const ratio = window.devicePixelRatio || 1;
      const pixelW = Math.max(minW, Math.round(cssW * ratio));
      const pixelH = Math.max(minH, Math.round(cssH * ratio));

      // set pixel buffer to DPR-scaled size, and CSS size to CSS pixels
      canvas.width = pixelW;
      canvas.height = pixelH;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';

      // scale drawing so 1 unit in drawing = 1 CSS pixel
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    } else {
      // normal (non-embedded) behavior: use chosenW/chosenH as CSS pixels and 1:1 buffer
      canvas.width = chosenW;
      canvas.height = chosenH;
      canvas.style.width = chosenW + 'px';
      canvas.style.height = chosenH + 'px';
      // reset transform to identity
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    canvas.style.maxWidth = '100%';
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
  }

  // compute initial size
  computeAndSetCanvasSize();

  // On resize, reload page to re-calc sizes and restart game cleanly
  let resizeTimer = null;
  // make WIDTH/HEIGHT mutable so we can update them when canvas resizes
  // Use CSS dimensions (clientWidth/clientHeight) as the logical game units
  let WIDTH = canvas.clientWidth || canvas.width;
  let HEIGHT = canvas.clientHeight || canvas.height;

    // On resize, recompute canvas size and reinitialize entities in-place while preserving score/mode.
    function handleResize(){
      const saved = {
        score: gameState.score,
        highScore: gameState.highScore,
        humanMode: gameState.humanMode,
        paused: gameState.paused,
        difficulty: gameState.difficulty
      };
  computeAndSetCanvasSize();
  // Ensure logical units remain CSS pixels (not device pixels)
  WIDTH = canvas.clientWidth || canvas.width;
  HEIGHT = canvas.clientHeight || canvas.height;
      // reset entities to fit new sizes
      resetEntities();
      gameState.score = saved.score;
      gameState.highScore = saved.highScore;
      gameState.humanMode = saved.humanMode;
      gameState.paused = saved.paused;
      gameState.difficulty = saved.difficulty;
      // update UI
      if (scoreEl) scoreEl.textContent = gameState.score;
      if (highScoreEl) highScoreEl.textContent = gameState.highScore;
      if (aiDepthEl) aiDepthEl.textContent = DIFFICULTY_PRESETS[gameState.difficulty].depth;
    }
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 200);
    });

  // UI elements
  const btnToggleMode = document.getElementById('btnToggleMode');
  const btnPause = document.getElementById('btnPause');
  const selectDifficulty = document.getElementById('selectDifficulty');
  const btnSave = document.getElementById('btnSave');
  const btnLoad = document.getElementById('btnLoad');
  const btnReset = document.getElementById('btnReset');
  const btnBack = document.getElementById('btnBack');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const aiDepthEl = document.getElementById('aiDepth');
  const modeLabelEl = document.getElementById('modeLabel');
  const predXEl = document.getElementById('predX');

  // Post status to parent (if embedded). Keeps parent React in sync with score/state.
  function postStatus(){
    try{
      if (window.parent && window.parent !== window){
        window.parent.postMessage({
          type: 'STATUS',
          score: gameState.score,
          highScore: gameState.highScore,
          difficulty: gameState.difficulty,
          humanMode: gameState.humanMode
        }, window.location.origin);
      }
    }catch(e){ /* ignore */ }
  }

  if (btnBack){
    btnBack.addEventListener('click', (e)=>{
      if (window.history && window.history.length > 1) window.history.back();
      else window.location.href = '/';
    });
  }

  // Configurable constants
    // Configurable constants (WIDTH/HEIGHT above are mutable)
    // WIDTH and HEIGHT are initialized above from canvas size
  const DEFAULTS = {
    ballRadius: 14,
    gravity: 1200, // px/s^2
    dt: 1/60, // seconds per tick
    paddleWidth: 180,
    paddleHeight: 20,
    paddleYfromBottom: 28,
    paddleSpeed: 360 // px/s
  };

  // Ball behavior tuning
  DEFAULTS.maxBallVx = 260; // max initial horizontal speed (base)
  DEFAULTS.bounceSpeed = 720; // upward speed applied on paddle bounce (base)

  // Difficulty presets (include paddleWidth so higher difficulty narrows the paddle)
  const DIFFICULTY_PRESETS = {
    easy:  { depth: 4, paddleSpeed: 420, paddleWidth: 180, bounceSpeed: 1200, maxBallVx: 180 },
    normal:{ depth: 6, paddleSpeed: 360, paddleWidth: 120, bounceSpeed: 1500, maxBallVx: 260 },
    hard:  { depth: 8, paddleSpeed: 300, paddleWidth: 80, bounceSpeed: 2000, maxBallVx: 380 }
  };

  // Game state
  let gameState = {
    ball: null,
    paddle: null,
    score: 0,
    highScore: Number(localStorage.getItem('bb_high_score') || 0),
    humanMode: true,
    paused: false,
    difficulty: 'normal'
  };

  if (highScoreEl) highScoreEl.textContent = gameState.highScore;
  if (modeLabelEl) modeLabelEl.textContent = gameState.humanMode ? 'Human' : 'AI';
  // notify parent on load
  postStatus();

  // Apply difficulty-based speed presets to DEFAULTS for initial difficulty
  try{
    const _initPreset = DIFFICULTY_PRESETS[gameState.difficulty] || DIFFICULTY_PRESETS['normal'];
    DEFAULTS.bounceSpeed = _initPreset.bounceSpeed;
    DEFAULTS.maxBallVx = _initPreset.maxBallVx;
    // set paddle width from preset
    DEFAULTS.paddleWidth = _initPreset.paddleWidth || DEFAULTS.paddleWidth;
    if (gameState.paddle){
      gameState.paddle.width = DEFAULTS.paddleWidth;
      // clamp paddle x within new width bounds
      const half = gameState.paddle.width / 2;
      const maxX = (canvas.clientWidth || WIDTH) - half;
      gameState.paddle.x = Math.max(half, Math.min(maxX, gameState.paddle.x));
    }
  }catch(e){ /* ignore */ }

  // Entities
  class Ball {
    constructor(x, y, radius){
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.radius = radius;
      this.landed = false;
    }
    update(dt){
      this.vy += DEFAULTS.gravity * dt;
      this.y += this.vy * dt;
      this.x += (this.vx || 0) * dt;
      // wall collisions: reflect vx
      const r = this.radius;
      if (this.x - r < 0){ this.x = r; this.vx = -this.vx; }
      if (this.x + r > WIDTH){ this.x = WIDTH - r; this.vx = -this.vx; }
      // ceiling collision: reflect vy so ball can come back down
      if (this.y - r < 0){ this.y = r; this.vy = -this.vy; }
    }
    reset(){
      // compute visible width fallback (use clientWidth or window.innerWidth)
      const w = Math.max(100, canvas.clientWidth || WIDTH || window.innerWidth);
      this.x = Math.random() * Math.max(0, (w - 2*this.radius)) + this.radius;
      this.y = -20 - Math.random()*50;
      this.vy = 0;
  // give a larger random horizontal velocity so ball starts with more horizontal motion
  this.vx = (Math.random()*2 - 1) * (DEFAULTS.maxBallVx * 0.6);
      this.landed = false;
    }
  }

  class Paddle {
    constructor(width, height, speed){
      this.width = width;
      this.height = height;
      this.x = WIDTH/2; // center x (may be updated by reset)
      this.y = HEIGHT - DEFAULTS.paddleYfromBottom;
      this.speed = speed;
      this.moveDirection = 0; // -1 left, 0 stay, 1 right
    }
    update(dt){
      this.x += this.moveDirection * this.speed * dt;
      // clamp
      const half = this.width/2;
      if (this.x - half < 0) this.x = half;
      if (this.x + half > WIDTH) this.x = WIDTH - half;
    }
    setAction(action){
      if (action === 'LEFT') this.moveDirection = -1;
      else if (action === 'RIGHT') this.moveDirection = 1;
      else this.moveDirection = 0;
    }
    reset(){
      const w = Math.max(100, canvas.clientWidth || WIDTH || window.innerWidth);
      const h = Math.max(100, canvas.clientHeight || HEIGHT || window.innerHeight);
      this.x = w/2;
      this.y = h - DEFAULTS.paddleYfromBottom;
      this.moveDirection = 0;
    }
  }

  // Initialize entities
  function resetEntities(){
    const preset = DIFFICULTY_PRESETS[gameState.difficulty];
    // create with defaults then reset to ensure they use current client sizes
    gameState.ball = new Ball(0, -30, DEFAULTS.ballRadius);
    gameState.paddle = new Paddle(DEFAULTS.paddleWidth, DEFAULTS.paddleHeight, preset.paddleSpeed);
    // reset positions using client sizes
    gameState.paddle.reset();
    gameState.ball.reset();
  }

  resetEntities();

  // Input handling for human mode
  const keys = {left:false,right:false};
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // Pointer (mouse/touch) movement control: move paddle to pointer x when in human mode
  canvas.addEventListener('pointermove', (ev) => {
    try{
      if (!gameState.humanMode) return;
      if (!gameState.paddle) return;
      const rect = canvas.getBoundingClientRect();
      const px = ev.clientX - rect.left; // CSS pixels relative to canvas
      const half = gameState.paddle.width / 2;
      const minX = half;
      const maxX = (canvas.clientWidth || WIDTH) - half;
      const targetX = Math.max(minX, Math.min(maxX, px));
      gameState.paddle.x = targetX;
      // ensure paddle isn't left in a moveDirection state
      gameState.paddle.moveDirection = 0;
    }catch(e){ /* ignore */ }
  });

  // Game ticks
  let lastTs = null;
  function tick(ts){
    if (!lastTs) lastTs = ts;
    const elapsed = (ts - lastTs)/1000;
    lastTs = ts;
    if (!gameState.paused){
      // step in fixed dt chunks for stable sim
      let remaining = elapsed;
      const dt = DEFAULTS.dt;
      while (remaining > 0){
        const step = Math.min(dt, remaining);
        stepUpdate(step);
        remaining -= step;
      }
    }
    render();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function stepUpdate(dt){
    // Decide action
    if (gameState.humanMode){
      if (keys.left && !keys.right) gameState.paddle.setAction('LEFT');
      else if (keys.right && !keys.left) gameState.paddle.setAction('RIGHT');
      else gameState.paddle.setAction('STAY');
    } else {
      // AI: call minimax to pick action
      const preset = DIFFICULTY_PRESETS[gameState.difficulty];
      const depth = preset.depth;
      const action = MinimaxAI.chooseAction(gameState.ball, gameState.paddle, depth);
      gameState.paddle.setAction(action);
    }

    // update entities
    gameState.paddle.update(dt);
    gameState.ball.update(dt);

    // Landing check: if ball y >= paddle.y - paddle.height/2 - ball.radius
    const groundY = gameState.paddle.y - gameState.paddle.height/2;
    if (!gameState.ball.landed && gameState.ball.y + gameState.ball.radius >= groundY){
      // check horizontal overlap
      const half = gameState.paddle.width / 2;
      const paddleLeft = gameState.paddle.x - half;
      const paddleRight = gameState.paddle.x + half;
      if (gameState.ball.x >= paddleLeft && gameState.ball.x <= paddleRight){
        // bounce off the paddle: reflect vertical velocity upward and add horizontal impulse based on hit offset
        gameState.score += 1;
        if (gameState.score > gameState.highScore){
          gameState.highScore = gameState.score;
          localStorage.setItem('bb_high_score', gameState.highScore);
          if (highScoreEl) highScoreEl.textContent = gameState.highScore;
        }
        // compute hit fraction (-1 left .. 0 center .. 1 right)
        const hitFrac = ((gameState.ball.x - gameState.paddle.x) / half);
        // give horizontal velocity proportional to offset
        gameState.ball.vx = (hitFrac) * DEFAULTS.maxBallVx;
        // set upward vy for bounce
        gameState.ball.vy = -Math.abs(DEFAULTS.bounceSpeed);
        // small nudge to ensure it's above the paddle
        gameState.ball.y = gameState.paddle.y - gameState.paddle.height/2 - gameState.ball.radius - 1;
      } else {
        // missed — stop the game and ask player to restart
        gameState.score = 0;
        // pause the game
        gameState.paused = true;
        if (btnPause) btnPause.textContent = 'Resume';
        // show restart overlay
        showGameOverOverlay();
      }
    }

  // update UI score
  if (scoreEl) scoreEl.textContent = gameState.score;
  if (aiDepthEl) aiDepthEl.textContent = DIFFICULTY_PRESETS[gameState.difficulty].depth;
  if (modeLabelEl) modeLabelEl.textContent = gameState.humanMode ? 'Human' : 'AI';
  }

  // Rendering
  function render(){
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    // background grid / subtle
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let y=0;y<HEIGHT;y+=40){
      ctx.fillRect(0,y,WIDTH,0.5);
    }

    // predicted landing marker for AI (dotted line)
    if (!gameState.humanMode){
      const pred = MinimaxAI.predictLandingX(gameState.ball);
      if (pred !== null){
        ctx.beginPath();
        ctx.setLineDash([4,6]);
        ctx.moveTo(pred,0);
        ctx.lineTo(pred,HEIGHT);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        if (predXEl) predXEl.textContent = Math.round(pred);
      } else if (predXEl) predXEl.textContent = '-';
  } else if (predXEl) predXEl.textContent = '-';

    // ball
    ctx.beginPath();
    ctx.fillStyle = '#ffd166';
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI*2);
    ctx.fill();

    // paddle
    const half = gameState.paddle.width/2;
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(gameState.paddle.x - half, gameState.paddle.y - gameState.paddle.height/2, gameState.paddle.width, gameState.paddle.height);
    // paddle center marker
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(gameState.paddle.x - 1, gameState.paddle.y - 30, 2, 20);

    // HUD small
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '12px system-ui';
    ctx.fillText(`Mode: ${gameState.humanMode ? 'Human' : 'AI'}`, 10, 18);
    ctx.fillText(`Difficulty: ${gameState.difficulty}`, 10, 34);
    ctx.fillText(`Ball x: ${Math.round(gameState.ball.x)} y:${Math.round(gameState.ball.y)}`, 10, 50);
  }

  // ===== Minimax AI implementation =====
  const MinimaxAI = {
    // Predict where ball will land (x coordinate) ignoring paddle — since no horizontal velocity, it's just current x
    // Keep function for clarity and potential future horizontal forces
    predictLandingX(ball) {
      if (!ball) return null;
      // ball has no horizontal motion in this game's rules, so landing x is ball.x
      return ball.x;
    },

    // Simulate forward deterministically: given a ball and paddle state, and a sequence of actions for paddle,
    // find predicted landing x and whether it will be caught.
    simulateUntilLanding(ball, paddle, actions, dt = DEFAULTS.dt) {
      // clone basic state
      let simBall = { x: ball.x, y: ball.y, vy: ball.vy, radius: ball.radius };
      let simPaddle = { x: paddle.x, width: paddle.width, speed: paddle.speed };
      let t = 0;
      let actionIndex = 0;
      const maxIters = 1000;
      for (let iter=0; iter<maxIters; iter++){
        // apply action for this timestep
        const action = actions[actionIndex] || 'STAY';
        if (action === 'LEFT') simPaddle.x -= simPaddle.speed * dt;
        else if (action === 'RIGHT') simPaddle.x += simPaddle.speed * dt;
        // clamp paddle
        const half = simPaddle.width/2;
        if (simPaddle.x - half < 0) simPaddle.x = half;
        if (simPaddle.x + half > WIDTH) simPaddle.x = WIDTH - half;

        // step ball
        simBall.vy += DEFAULTS.gravity * dt;
        simBall.y += simBall.vy * dt;

        // check landing
        const groundY = HEIGHT - DEFAULTS.paddleYfromBottom - DEFAULTS.paddleHeight/2;
        if (simBall.y + simBall.radius >= groundY){
          // return predicted landing x and whether paddle covers it
          const paddleLeft = simPaddle.x - half;
          const paddleRight = simPaddle.x + half;
          const caught = simBall.x >= paddleLeft && simBall.x <= paddleRight;
          return { landingX: simBall.x, caught, time: t };
        }

        actionIndex++;
        t += dt;
      }
      // fallback
      return { landingX: simBall.x, caught: false, time: t };
    },

    // Evaluate a leaf position (higher = better)
    evaluateLeaf(ball, paddle) {
      // heuristic: negative absolute distance between paddle center and predicted landing x
      const landingX = this.predictLandingX(ball);
      const dist = Math.abs(paddle.x - landingX);
      // we want higher score when dist small. scale and invert
      const score = -dist;
      return score;
    },

    // Choose action using minimax with alpha-beta
    chooseAction(ball, paddle, depth = 6, dt = DEFAULTS.dt) {
      // use small discrete branching (3 actions)
      const actions = ['LEFT','STAY','RIGHT'];
      // Node representation for minimax: (ball,paddle) are passed through simulation for simplicity
      let best = { action: 'STAY', value: -Infinity };

      // alpha-beta wrapper
      const alphaBeta = (ballState, paddleState, currentDepth, alpha, beta, maximizingPlayer) => {
        // leaf or terminal check: if ball would land within a short simulated horizon -> evaluate
        // We'll simulate until landing or for a small horizon = currentDepth * dt ticks
        if (currentDepth === 0){
          // evaluate heuristic of current state
          return this.evaluateLeaf(ballState, paddleState);
        }

        if (maximizingPlayer){
          let v = -Infinity;
          for (const a of actions){
            // simulate one step with action 'a' to get next states
            // We'll do a fast deterministic simulation for one dt step here:
            const nextPaddleX = clamp(paddleState.x + actionToDelta(a,paddleState.speed,dt), paddleState.width/2, WIDTH - paddleState.width/2);
            // ball after one step
            const nextBallVY = ballState.vy + DEFAULTS.gravity * dt;
            const nextBallY = ballState.y + nextBallVY * dt;
            const nextBall = { x: ballState.x, y: nextBallY, vy: nextBallVY, radius: ballState.radius };
            const nextPaddle = { x: nextPaddleX, width: paddleState.width, speed: paddleState.speed };

            // If the ball would have landed in the next step, return terminal evaluation
            const groundY = HEIGHT - DEFAULTS.paddleYfromBottom - DEFAULTS.paddleHeight/2;
            if (nextBall.y + nextBall.radius >= groundY){
              // check catch
              const half = nextPaddle.width/2;
              const caught = nextBall.x >= nextPaddle.x - half && nextBall.x <= nextPaddle.x + half;
              if (caught) return 1000; // terminal success
              else return -1000; // terminal failure
            }

            const childVal = alphaBeta(nextBall, nextPaddle, currentDepth - 1, alpha, beta, false);
            v = Math.max(v, childVal);
            alpha = Math.max(alpha, v);
            if (beta <= alpha) break; // prune
          }
          return v;
        } else {
          // MIN node — here we can model environment adversarially, but simpler: treat MIN as time progression with 'STAY' only
          // We'll simulate environment step (ball falls, paddle keeps its current x)
          const nextBallVY = ballState.vy + DEFAULTS.gravity * dt;
          const nextBallY = ballState.y + nextBallVY * dt;
          const nextBall = { x: ballState.x, y: nextBallY, vy: nextBallVY, radius: ballState.radius };
          const nextPaddle = { x: paddleState.x, width: paddleState.width, speed: paddleState.speed };
          // Terminal check
          const groundY = HEIGHT - DEFAULTS.paddleYfromBottom - DEFAULTS.paddleHeight/2;
          if (nextBall.y + nextBall.radius >= groundY){
            const half = nextPaddle.width/2;
            const caught = nextBall.x >= nextPaddle.x - half && nextBall.x <= nextPaddle.x + half;
            if (caught) return 1000;
            else return -1000;
          }
          // continue deeper, but now it's maximizing player's turn
          return alphaBeta(nextBall, nextPaddle, currentDepth - 1, alpha, beta, true);
        }
      };

      // top-level: evaluate each action
      for (const a of actions){
        // clone states
        const paddleClone = { x: paddle.x, width: paddle.width, speed: paddle.speed };
        const ballClone = { x: ball.x, y: ball.y, vy: ball.vy, radius: ball.radius };
        // apply action for one dt
        paddleClone.x = clamp(paddleClone.x + actionToDelta(a,paddleClone.speed,dt), paddleClone.width/2, WIDTH - paddleClone.width/2);
        ballClone.vy += DEFAULTS.gravity * dt;
        ballClone.y += ballClone.vy * dt;

        // if landing occurs immediately:
        const groundY = HEIGHT - DEFAULTS.paddleYfromBottom - DEFAULTS.paddleHeight/2;
        if (ballClone.y + ballClone.radius >= groundY){
          const half = paddleClone.width/2;
          const caught = ballClone.x >= paddleClone.x - half && ballClone.x <= paddleClone.x + half;
          const val = caught ? 1000 : -1000;
          if (val > best.value) { best.value = val; best.action = a; }
          continue;
        }

        const v = alphaBeta(ballClone, paddleClone, depth-1, -Infinity, Infinity, false);
        if (v > best.value){
          best.value = v;
          best.action = a;
        }
      }

      return best.action;
    },

    // Utility that predicts landing x quickly (here trivial)
    predictLandingX(ball) {
      return ball.x;
    }
  };

  // helpers
  function actionToDelta(action, speed, dt){
    if (action === 'LEFT') return -speed * dt;
    if (action === 'RIGHT') return speed * dt;
    return 0;
  }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  // Buttons behavior
  if (btnToggleMode){
    btnToggleMode.addEventListener('click', () => {
      gameState.humanMode = !gameState.humanMode;
      if (btnToggleMode) btnToggleMode.textContent = `Mode: ${gameState.humanMode ? 'Human' : 'AI'}`;
      if (modeLabelEl) modeLabelEl.textContent = gameState.humanMode ? 'Human' : 'AI';
      postStatus();
    });
  }

  if (btnPause){
    btnPause.addEventListener('click', () => {
      gameState.paused = !gameState.paused;
      if (btnPause) btnPause.textContent = gameState.paused ? 'Resume' : 'Pause';
      postStatus();
    });
  }

  if (selectDifficulty){
    selectDifficulty.addEventListener('change', (e) => {
      const v = (e.target && e.target.value) ? e.target.value : selectDifficulty.value;
      gameState.difficulty = v;
      const preset = DIFFICULTY_PRESETS[gameState.difficulty];
      if (gameState.paddle) gameState.paddle.speed = preset.paddleSpeed;
      // apply paddle width preset
      DEFAULTS.paddleWidth = preset.paddleWidth || DEFAULTS.paddleWidth;
      if (gameState.paddle){
        gameState.paddle.width = DEFAULTS.paddleWidth;
        const half = gameState.paddle.width/2;
        const maxX = (canvas.clientWidth || WIDTH) - half;
        gameState.paddle.x = Math.max(half, Math.min(maxX, gameState.paddle.x));
      }
      if (aiDepthEl) aiDepthEl.textContent = preset.depth;
      // apply ball speed presets
      DEFAULTS.bounceSpeed = preset.bounceSpeed;
      DEFAULTS.maxBallVx = preset.maxBallVx;
      // clamp existing ball vx so it respects new difficulty
      if (gameState.ball){
        gameState.ball.vx = Math.max(-DEFAULTS.maxBallVx, Math.min(DEFAULTS.maxBallVx, gameState.ball.vx || 0));
      }
      postStatus();
    });
  }

  if (btnSave){
    btnSave.addEventListener('click', () => {
      const payload = { highScore: gameState.highScore, difficulty: gameState.difficulty };
      localStorage.setItem('bb_saved_state', JSON.stringify(payload));
    });
  }

  if (btnLoad){
    btnLoad.addEventListener('click', () => {
      const raw = localStorage.getItem('bb_saved_state');
      if (!raw) return;
      try {
        const payload = JSON.parse(raw);
        if (payload.highScore !== undefined) gameState.highScore = payload.highScore;
        if (payload.difficulty) gameState.difficulty = payload.difficulty;
        if (selectDifficulty) selectDifficulty.value = gameState.difficulty;
        const preset = DIFFICULTY_PRESETS[gameState.difficulty];
        if (gameState.paddle) gameState.paddle.speed = preset.paddleSpeed;
        // apply paddle width from preset when loading a saved state
        DEFAULTS.paddleWidth = preset.paddleWidth || DEFAULTS.paddleWidth;
        if (gameState.paddle){
          gameState.paddle.width = DEFAULTS.paddleWidth;
          const half = gameState.paddle.width/2;
          const maxX = (canvas.clientWidth || WIDTH) - half;
          gameState.paddle.x = Math.max(half, Math.min(maxX, gameState.paddle.x));
        }
        if (highScoreEl) highScoreEl.textContent = gameState.highScore;
        if (aiDepthEl) aiDepthEl.textContent = preset.depth;
        postStatus();
      } catch (e){ /* ignore */ }
    });
  }

  if (btnReset){
    btnReset.addEventListener('click', () => {
      gameState.score = 0;
      resetEntities();
      if (scoreEl) scoreEl.textContent = 0;
      postStatus();
    });
  }

  // Listen for messages from parent (React overlay) to control the game
  window.addEventListener('message', (ev) => {
    try{
      if (ev.origin !== window.location.origin) return;
      const msg = ev.data || {};
      switch(msg.type){
        case 'PAUSE':
          gameState.paused = true; if (btnPause) btnPause.textContent = 'Resume'; postStatus(); break;
        case 'RESUME':
          gameState.paused = false; if (btnPause) btnPause.textContent = 'Pause'; postStatus(); break;
        case 'TOGGLE_MODE':
          gameState.humanMode = !gameState.humanMode; if (btnToggleMode) btnToggleMode.textContent = `Mode: ${gameState.humanMode ? 'Human' : 'AI'}`; postStatus(); break;
        case 'SET_DIFFICULTY':
          if (msg.value){
            gameState.difficulty = msg.value;
            const preset = DIFFICULTY_PRESETS[gameState.difficulty];
            if (gameState.paddle) gameState.paddle.speed = preset.paddleSpeed;
            // apply paddle width preset
            DEFAULTS.paddleWidth = preset.paddleWidth || DEFAULTS.paddleWidth;
            if (gameState.paddle){
              gameState.paddle.width = DEFAULTS.paddleWidth;
              const half = gameState.paddle.width/2;
              const maxX = (canvas.clientWidth || WIDTH) - half;
              gameState.paddle.x = Math.max(half, Math.min(maxX, gameState.paddle.x));
            }
            if (aiDepthEl) aiDepthEl.textContent = preset.depth;
            if (selectDifficulty) selectDifficulty.value = msg.value;
            // apply speed presets
            DEFAULTS.bounceSpeed = preset.bounceSpeed;
            DEFAULTS.maxBallVx = preset.maxBallVx;
            if (gameState.ball){
              gameState.ball.vx = Math.max(-DEFAULTS.maxBallVx, Math.min(DEFAULTS.maxBallVx, gameState.ball.vx || 0));
            }
            postStatus();
          }
          break;
        case 'RESET':
          gameState.score = 0; resetEntities(); postStatus(); break;
        case 'REQUEST_STATUS':
          postStatus(); break;
        default: break;
      }
    }catch(e){ /* ignore */ }
  });

  // Touch controls: wire optional on-screen buttons for mobile
  function startTouchLeft(){ if (gameState.paddle) gameState.paddle.setAction('LEFT'); }
  function startTouchRight(){ if (gameState.paddle) gameState.paddle.setAction('RIGHT'); }
  function stopTouch(){ if (gameState.paddle) gameState.paddle.setAction('STAY'); }
  const touchLeftBtn = document.getElementById('touchLeft');
  const touchRightBtn = document.getElementById('touchRight');
  if (touchLeftBtn){
    ['pointerdown','touchstart','mousedown'].forEach(ev => touchLeftBtn.addEventListener(ev, (e)=>{ e.preventDefault(); startTouchLeft(); }));
    ['pointerup','touchend','mouseup','pointerleave','touchcancel'].forEach(ev => touchLeftBtn.addEventListener(ev, stopTouch));
  }
  if (touchRightBtn){
    ['pointerdown','touchstart','mousedown'].forEach(ev => touchRightBtn.addEventListener(ev, (e)=>{ e.preventDefault(); startTouchRight(); }));
    ['pointerup','touchend','mouseup','pointerleave','touchcancel'].forEach(ev => touchRightBtn.addEventListener(ev, stopTouch));
  }

  // expose some functions for debugging in console
  window._bb = { gameState, resetEntities, MinimaxAI };

  // ------- Game over / Restart overlay helpers -------
  function ensureGameOverOverlay(){
    if (document.getElementById('bb_gameover_overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'bb_gameover_overlay';
    ov.setAttribute('role','dialog');
    ov.setAttribute('aria-modal','true');
    ov.style.position = 'fixed';
    ov.style.left = '0';
    ov.style.top = '0';
    ov.style.width = '100%';
    ov.style.height = '100%';
    ov.style.display = 'flex';
    ov.style.alignItems = 'center';
    ov.style.justifyContent = 'center';
    ov.style.zIndex = 1400;
    ov.style.pointerEvents = 'auto';
    ov.innerHTML = `
      <div id="bb_gameover_inner" style="background:rgba(3,7,12,0.85);border:1px solid rgba(255,255,255,0.06);color:var(--text);padding:20px;border-radius:12px;min-width:280px;max-width:90%;text-align:center;">
        <h2 style="margin:0 0 8px;font-size:1.25rem">Game Over</h2>
        <p style="margin:0 0 16px">You missed the ball. Restart to try again.</p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button id="bb_restart_btn" style="padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:var(--text);cursor:pointer;">Restart</button>
        </div>
      </div>
    `;
    document.body.appendChild(ov);
    const restartBtn = document.getElementById('bb_restart_btn');
    const backBtn = document.getElementById('bb_back_btn');
    restartBtn && restartBtn.addEventListener('click', ()=>{
      // reset entities and resume
      gameState.score = 0;
      resetEntities();
      gameState.paused = false;
      if (btnPause) btnPause.textContent = 'Pause';
      hideGameOverOverlay();
      postStatus();
    });
  }

  function showGameOverOverlay(){
    ensureGameOverOverlay();
    const ov = document.getElementById('bb_gameover_overlay');
    if (ov) ov.style.display = 'flex';
  }

  function hideGameOverOverlay(){
    const ov = document.getElementById('bb_gameover_overlay');
    if (ov) ov.style.display = 'none';
  }

})();
