(() => {
const canvas=document.getElementById('gameCanvas');const ctx=canvas.getContext('2d');
const btnPause=document.getElementById('btnPause');const btnReset=document.getElementById('btnReset');const selectDifficulty=document.getElementById('selectDifficulty');
const scoreEl=document.getElementById('score');const highScoreEl=document.getElementById('highScore');const speedEl=document.getElementById('speed');
const WIDTH=canvas.width,HEIGHT=canvas.height;const DEFAULTS={gravity:2000,dt:1/60,groundY:HEIGHT-40};
const DIFF={
    easy:{speed:3,spawnRate:0.6},
    normal:{speed:5,spawnRate:0.4},
    hard:{speed:7,spawnRate:0.1}};
let game={dino:null,obstacles:[],speed:DIFF.normal.speed,spawnTimer:0,score:0,highScore:Number(localStorage.getItem('dino_high_score')||0),paused:false,running:true,difficulty:'normal'};
highScoreEl.textContent=game.highScore;

// Post status to parent (if embedded) so React overlay can stay in sync
function postStatus(){
	try{
		if (window.parent && window.parent !== window){
			window.parent.postMessage({
				type: 'STATUS',
				score: game.score,
				highScore: game.highScore,
				difficulty: game.difficulty,
				// humanMode removed; this game is always human-controlled
				paused: !!game.paused,
				running: !!game.running
			}, window.location.origin);
		}
	}catch(e){/* ignore */}
}
class Dino{
	constructor(){
		this.x=50;this.y=DEFAULTS.groundY;this.width=44;this.height=44;this.vy=0;this.jumping=false;this.ducking=false;
	}
	update(dt){
		if(this.jumping){
			this.vy+=DEFAULTS.gravity*dt;
			this.y+=this.vy*dt;
			if(this.y>=DEFAULTS.groundY){ this.y=DEFAULTS.groundY; this.vy=0; this.jumping=false; }
		}
		if(this.ducking && !this.jumping) this.height = 24; else this.height = 44;
	}
	jump(){ if(!this.jumping){ this.jumping=true; this.vy=-750; } }
	setDuck(v){ this.ducking = !!v; }
	getBounds(){ return { x:this.x, y:this.y - this.height, w:this.width, h:this.height }; }
	draw(ctx){
		// stylized dino silhouette
		const b = this.getBounds();
		ctx.save();
		// body
		ctx.fillStyle = '#10b981'; // green
		ctx.beginPath();
		// main body as an ellipse
		ctx.ellipse(b.x + b.w*0.45, b.y + b.h*0.55, b.w*0.5, b.h*0.5, 0, 0, Math.PI*2);
		ctx.fill();
		// head
		ctx.beginPath();
		ctx.ellipse(b.x + b.w*0.88, b.y + b.h*0.32, b.w*0.28, b.h*0.28, 0, 0, Math.PI*2);
		ctx.fill();
		// tail (triangle)
		ctx.beginPath();
		ctx.moveTo(b.x + b.w*0.05, b.y + b.h*0.55);
		ctx.lineTo(b.x + b.w*0.35, b.y + b.h*0.35);
		ctx.lineTo(b.x + b.w*0.35, b.y + b.h*0.65);
		ctx.closePath();
		ctx.fill();
		// legs
		ctx.fillStyle = '#0ea56f';
		const legW = Math.max(4, Math.round(b.w*0.18));
		const legH = Math.max(6, Math.round(b.h*0.28));
		ctx.fillRect(Math.round(b.x + b.w*0.35), Math.round(b.y + b.h*0.9) - legH, legW, legH);
		if (!this.ducking) ctx.fillRect(Math.round(b.x + b.w*0.6), Math.round(b.y + b.h*0.9) - legH, legW, legH);
		// eye
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(b.x + b.w*0.92, b.y + b.h*0.28, Math.max(1, Math.round(b.w*0.06)), 0, Math.PI*2);
		ctx.fill();
		ctx.restore();
	}
}
class Obstacle{
	constructor(x,w,h){ this.x=x; this.y=DEFAULTS.groundY - h; this.w=w; this.h=h; this.passed=false; }
	update(dt,speed){ this.x -= speed; }
	isOffscreen(){ return this.x + this.w < 0; }
	getBounds(){ return { x:this.x, y:this.y, w:this.w, h:this.h }; }
	draw(ctx){
		// draw cactus-like obstacle
		ctx.save();
		const x = Math.round(this.x);
		const y = Math.round(this.y);
		const w = Math.round(this.w);
		const h = Math.round(this.h);
		// central stem
		const stemW = Math.max(6, Math.round(w*0.5));
		const stemX = x + Math.round((w - stemW)/2);
		ctx.fillStyle = '#16a34a';
		ctx.fillRect(stemX, y, stemW, h);
		// rounded top for stem
		ctx.beginPath();
		ctx.ellipse(stemX + stemW/2, y, stemW/2, Math.max(6, Math.round(stemW/3)), 0, Math.PI, 0, true);
		ctx.fill();
		// left arm
		const armW = Math.max(4, Math.round(w*0.25));
		const armH = Math.max(8, Math.round(h*0.45));
		ctx.fillRect(stemX - Math.round(armW*0.6), y + Math.round(h*0.25), armW, armH);
		ctx.beginPath();
		ctx.ellipse(stemX - Math.round(armW*0.1), y + Math.round(h*0.25), armW/2, Math.max(5, Math.round(armW/3)), 0, Math.PI*1.1, Math.PI*0.1, true);
		ctx.fill();
		// right arm
		ctx.fillRect(stemX + stemW - Math.round(armW*0.4), y + Math.round(h*0.15), armW, Math.max(6, Math.round(h*0.35)));
		ctx.beginPath();
		ctx.ellipse(stemX + stemW + Math.round(armW*0.2), y + Math.round(h*0.15), armW/2, Math.max(4, Math.round(armW/3)), 0, Math.PI*1.1, Math.PI*0.1, true);
		ctx.fill();
		// small spines
		ctx.strokeStyle = '#14532d';
		ctx.lineWidth = 1;
		for (let i=0;i<4;i++){
			const sx = stemX + Math.round(stemW*0.15) + i*(stemW*0.18);
			const sy = y + Math.round(h*0.15) + i*(h*0.18);
			ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx-6, sy-6); ctx.stroke();
			ctx.beginPath(); ctx.moveTo(sx+2, sy+10); ctx.lineTo(sx+8, sy+14); ctx.stroke();
		}
		ctx.restore();
	}
}
function reset(){game.dino=new Dino();game.obstacles=[];game.speed=DIFF[game.difficulty].speed;game.spawnTimer=0;game.score=0;game.running=true;}
reset();
// Robust keyboard handling: accept multiple space identifiers and fallbacks to e.key.
window.addEventListener('keydown', e => {
	const code = e.code || '';
	const key = e.key || '';
	const isJump = code === 'Space' || key === ' ' || key === 'Spacebar' || key === 'Space' || code === 'ArrowUp' || key === 'ArrowUp' || key === 'Up';
	const isDuck = code === 'ArrowDown' || key === 'ArrowDown' || key === 'Down';
	if (isJump) {
		// prevent scrolling or other default behavior (especially when a control has focus)
		e.preventDefault();
		if (!game.running) {
			// start/reset the game if it isn't running
			reset();
			game.paused = false;
			if (btnPause) btnPause.textContent = 'Pause';
		} else if (game.dino) {
			game.dino.jump();
		}
	}
	if (isDuck) {
		e.preventDefault();
		if (game.dino) game.dino.setDuck(true);
	}
}, true);

window.addEventListener('keyup', e => {
	const key = e.key || '';
	const code = e.code || '';
	if (code === 'ArrowDown' || key === 'ArrowDown' || key === 'Down') {
		if (game.dino) game.dino.setDuck(false);
	}
}, true);
canvas.addEventListener('click', ()=>{ if(!game.running) reset(); else game.dino.jump(); });
// touch controls (embedded small buttons)
const touchJumpBtn = document.getElementById('touchJump');
const touchLeftBtn = document.getElementById('touchLeft');
if (touchJumpBtn){
	['pointerdown','touchstart','mousedown'].forEach(ev => touchJumpBtn.addEventListener(ev, (e)=>{ e.preventDefault(); if (!game.running) reset(); else game.dino.jump(); }));
}
if (touchLeftBtn){
	['pointerdown','touchstart','mousedown'].forEach(ev => touchLeftBtn.addEventListener(ev, (e)=>{ e.preventDefault(); game.dino.setDuck(true); }));
	['pointerup','touchend','mouseup','pointerleave','touchcancel'].forEach(ev => touchLeftBtn.addEventListener(ev, ()=>{ game.dino.setDuck(false); }));
}
// Listen for messages from parent overlay
window.addEventListener('message', (ev)=>{
	try{
		if (ev.origin !== window.location.origin) return;
		const msg = ev.data || {};
		switch(msg.type){
			case 'PAUSE': game.paused = true; if (btnPause) btnPause.textContent = 'Resume'; postStatus(); break;
			case 'RESUME': game.paused = false; if (btnPause) btnPause.textContent = 'Pause'; postStatus(); break;
			case 'RESET': reset(); postStatus(); break;
			case 'SET_DIFFICULTY': if (msg.value){ game.difficulty = msg.value; reset(); postStatus(); } break;
			// TOGGLE_MODE removed; game is always human-controlled
			case 'REQUEST_STATUS': postStatus(); break;
			default: break;
		}
	}catch(e){/* ignore */}
});
let lastTs=null;function loop(ts){if(!lastTs)lastTs=ts;const elapsed=(ts-lastTs)/1000;lastTs=ts;if(!game.paused&&game.running){let remaining=elapsed;const dt=DEFAULTS.dt;while(remaining>0){const step=Math.min(dt,remaining);update(step);remaining-=step;}}
render();requestAnimationFrame(loop);}requestAnimationFrame(loop);
function update(dt){
	game.dino.update(dt);
	game.spawnTimer -= dt;
	if (game.spawnTimer <= 0){
		const spawnRate = DIFF[game.difficulty].spawnRate;
		const randFactor = (Math.random()*1.2 + 0.6);
		const computedDelay = randFactor * spawnRate * (60 / game.speed);
		// ensure an obstacle (or cluster) appears within 4 seconds at most
		game.spawnTimer = Math.min(computedDelay, 4);
		// cluster size depends on difficulty: easy -> 1, normal -> up to 2, hard -> up to 3
		const clusterMax = ({ easy: 1, normal: 2, hard: 3 })[game.difficulty] || 1;
		const clusterCount = 1 + Math.floor(Math.random() * clusterMax);

		// gap ranges (px) between obstacles in a cluster per difficulty
		const gapRanges = { easy: [80, 140], normal: [50, 100], hard: [20, 70] };
		const [minGap, maxGap] = gapRanges[game.difficulty] || gapRanges.normal;

		let spawnX = WIDTH + 40;
		for (let i = 0; i < clusterCount; i++){
			// vary obstacle width/height
			const w = 20 + Math.floor(Math.random() * 28); // 20..47
			const h = 20 + Math.floor(Math.random() * 70); // 20..89 variable heights
			game.obstacles.push(new Obstacle(spawnX, w, h));
			// compute random gap to next obstacle and triple it so obstacles are farther apart
			const gap = Math.round((minGap + Math.random() * (maxGap - minGap)) * 5);
			spawnX += w + gap;
		}
	}
for(let i=game.obstacles.length-1;i>=0;i--){const ob=game.obstacles[i];ob.update(dt,game.speed);if(!ob.passed&&ob.x+ob.w<game.dino.x){ob.passed=true;game.score++;if(game.score>game.highScore){game.highScore=game.score;localStorage.setItem('dino_high_score',game.highScore);highScoreEl.textContent=game.highScore;}}if(ob.isOffscreen())game.obstacles.splice(i,1);}
	// post status whenever score updates
	postStatus();
for(const ob of game.obstacles){
		if (rectsOverlap(ob.getBounds(), game.dino.getBounds())){
			game.running = false;
			break;
		}
}
// if game just ended, show overlay and pause
if (!game.running){
	game.paused = true;
	if (btnPause) btnPause.textContent = 'Resume';
	showGameOverOverlay();
	postStatus();
}
// Keep speed constant per difficulty; game.speed is initialized in reset()
speedEl.textContent = Math.round(game.speed);
scoreEl.textContent = game.score;
}
function rectsOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function render(){
	// background gradient
	const g = ctx.createLinearGradient(0,0,0,HEIGHT);
	g.addColorStop(0, '#082533');
	g.addColorStop(1, '#03212a');
	ctx.fillStyle = g;
	ctx.fillRect(0,0,WIDTH,HEIGHT);

	// subtle horizontal grid
	ctx.fillStyle = 'rgba(255,255,255,0.02)';
	for (let y = 0; y < HEIGHT; y += 40) ctx.fillRect(0, y, WIDTH, 0.5);

	// ground
	ctx.fillStyle = '#e9e9e922';
	ctx.fillRect(0, DEFAULTS.groundY + 20, WIDTH, HEIGHT - (DEFAULTS.groundY + 20));
	ctx.fillStyle = '#d0d0d0';
	ctx.fillRect(0, DEFAULTS.groundY + 18, WIDTH, 3);

	// entities
	game.dino.draw(ctx);
	for (const ob of game.obstacles) ob.draw(ctx);

	// small HUD overlay (optional)
	ctx.fillStyle = 'rgba(255,255,255,0.12)';
	ctx.font = '12px system-ui';
	ctx.fillText(`Difficulty: ${game.difficulty}`, 10, 18);
	ctx.fillText(`Speed: ${Math.round(game.speed)}`, 10, 34);
}
btnPause.addEventListener('click',()=>{game.paused=!game.paused;btnPause.textContent=game.paused?'Resume':'Pause';});
btnReset.addEventListener('click',reset);
selectDifficulty.addEventListener('change',e=>{game.difficulty=e.target.value;reset();});

// Game over / Restart overlay helpers (inside IIFE so reset() is in scope)
function ensureGameOverOverlay(){
	if (document.getElementById('dino_gameover_overlay')) return;
	const ov = document.createElement('div');
	ov.id = 'dino_gameover_overlay';
	ov.style.position = 'fixed'; ov.style.left = '0'; ov.style.top = '0'; ov.style.width = '100%'; ov.style.height = '100%';
	ov.style.display = 'none'; ov.style.alignItems = 'center'; ov.style.justifyContent = 'center'; ov.style.zIndex = '1400'; ov.style.pointerEvents = 'auto';
	ov.innerHTML = `
		<div style="background:rgba(3,7,12,0.9);border:1px solid rgba(255,255,255,0.06);color:var(--text);padding:20px;border-radius:12px;min-width:260px;text-align:center;">
			<h2 style="margin:0 0 8px;font-size:1.2rem">Game Over</h2>
			<p style="margin:0 0 14px">You hit an obstacle.</p>
			<div style="display:flex;gap:10px;justify-content:center;">
				<button id="dino_restart_btn" style="padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:var(--text);">Restart</button>
			</div>
		</div>
	`;
	document.body.appendChild(ov);
	const rb = document.getElementById('dino_restart_btn');
	const bb = document.getElementById('dino_back_btn');
	rb && rb.addEventListener('click', ()=>{ game.score = 0; reset(); game.paused = false; if (btnPause) btnPause.textContent = 'Pause'; hideGameOverOverlay(); postStatus(); });
	bb && bb.addEventListener('click', ()=>{ if (window.history && window.history.length>1) window.history.back(); else window.location.href = '/'; });
}
function showGameOverOverlay(){ ensureGameOverOverlay(); const ov = document.getElementById('dino_gameover_overlay'); if (ov) ov.style.display = 'flex'; }
function hideGameOverOverlay(){ const ov = document.getElementById('dino_gameover_overlay'); if (ov) ov.style.display = 'none'; }

})();