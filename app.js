// QuantumLeap SPA — INR, fixed pricing toggle, spacing, taller hero/header, smooth top scroll,
// beta card, improved ROI layout, starfield with fluid cursor, no downshift on route.

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const html = (s,...v)=> s.map((p,i)=>p+(v[i]??'')).join('');

// ---- State ----
const state = {
  theme: localStorage.getItem('theme') || 'dark',
  noJargon: JSON.parse(localStorage.getItem('nojargon') || 'false'),
  betaSpots: 3,
  betaCloseAt: Date.now() + 5*60*1000,
  billing: 'monthly', // or 'annual'
};

// ---- Setup theme ----
document.documentElement.setAttribute('data-theme', state.theme);
const setTheme = t => { state.theme=t; localStorage.setItem('theme',t); document.documentElement.setAttribute('data-theme',t); };

// ---- Router ----
const routes = {
  '/': renderHome,
  '/solutions': renderSolutions,
  '/platform': renderPlatform,
  '/pricing': renderPricing,
  '/resources': renderResources,
  '/about': renderAbout,
  '/contact': renderContact,
};
function navigate() {
  const path = location.hash.replace('#','') || '/';
  const app = $('#app');
  app.innerHTML = '';
  (routes[path] || routes['/'])(app);

  // highlight nav
  $$('#navmenu a').forEach(a=> a.setAttribute('aria-current', a.getAttribute('href') === '#'+path ? 'page' : 'false'));

  // prevent focus-induced scroll jump; ensure top
  if (path === '/') window.scrollTo({top:0, behavior:'instant'});
  try { app.focus({preventScroll:true}); } catch(_) {}
  if (window.lucide) window.lucide.createIcons();
  mountReveals();
}
addEventListener('hashchange', navigate);
// ---- Confetti (4s colorful rain) ----
function triggerConfetti() {
    if (!window.confetti) return; // safety if CDN didn't load
    const duration = 4000; // 4 seconds
    const end = Date.now() + duration;
    // big opening burst
    confetti({
        particleCount: 180,
        spread: 75,
        startVelocity: 55,
        gravity: 1.0,
        origin: { y: 0.2 }
    });
    const colors = ['#55D6FF','#8B6CFF','#FFC857','#2FD5A7','#FF6B81', '#E6ECF5'];
    (function frame(){
            const timeLeft = end - Date.now();
            if (timeLeft <= 0) return;
            // left + right emitters
            confetti({
                particleCount: 10 + Math.round(Math.random()*12),
                angle: 60,
                spread: 65,
                origin: { x: 0 },
                ticks: 250,
                colors
        });
        confetti({
            particleCount: 10 + Math.round(Math.random()*12),
            angle: 120,
            spread: 65,
            origin: { x: 1 },
            ticks: 250,
            colors
        });
        requestAnimationFrame(frame);
    })();
}
// ---- Init ----
addEventListener('load', ()=>{
  // mobile nav
  $('#nav-toggle')?.addEventListener('click', ()=>{
    const m=$('#navmenu'); const ex=$('#nav-toggle').getAttribute('aria-expanded')==='true';
    $('#nav-toggle').setAttribute('aria-expanded', String(!ex)); m.classList.toggle('is-open');
  });
  // theme
  $('#theme-toggle')?.addEventListener('click', ()=> setTheme(state.theme==='dark'?'light':'dark'));
  // jargon
  const jt = $('#jargon-toggle');
  jt?.addEventListener('click', ()=>{
    state.noJargon = !state.noJargon;
    localStorage.setItem('nojargon', JSON.stringify(state.noJargon));
    jt.setAttribute('aria-pressed', String(state.noJargon));
    applyJargon();
  });
  // brand click -> force scroll top (no downshift)
  $('#brand-link')?.addEventListener('click', ()=>{
    setTimeout(()=> window.scrollTo({top:0, behavior:'instant'}), 0);
  });

  // footer
  $('#year').textContent = new Date().getFullYear();
  $('#newsletter-form')?.addEventListener('submit', e=>{ e.preventDefault(); $('#newsletter-status').textContent='Thanks! You are subscribed.'; e.target.reset(); });

  initBetaModal();   // only modal now (top bar removed)
  initChat();
  navigate();
});

// ---- Currency: INR formatter ----
const INR = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 });
const INR0 = n => INR.format(Math.max(0, Math.round(n)));

// ---- Jargon toggle ----
function applyJargon(){
  $$('[data-jargon]').forEach(el=>{
    const tech=el.getAttribute('data-jargon');
    const plain=el.getAttribute('data-plain')||el.textContent;
    if(!el.getAttribute('data-plain')) el.setAttribute('data-plain', plain);
    el.textContent = state.noJargon ? plain : tech;
  });
}

// ---- Scroll reveal ----
function mountReveals(){
  const els = $$('.reveal');
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  },{threshold:.15});
  els.forEach(el=> io.observe(el));
}

// ---- Backgrounds ----
function mountQuantumCanvas(){
  const canvas=$('#quantum-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d'); let w,h;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){ w=canvas.width=canvas.offsetWidth; h=canvas.height=canvas.offsetHeight; } resize();
  addEventListener('resize', resize, {passive:true});
  const N = reduced ? 25 : 60;
  const pts = Array.from({length:N},()=>({x:Math.random()*w, y:Math.random()*h, vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3}));
  function step(){
    ctx.clearRect(0,0,w,h);
    for(const p of pts){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>w) p.vx*=-1; if(p.y<0||p.y>h) p.vy*=-1; }
    for(let i=0;i<pts.length;i++){
      for(let j=i+1;j<pts.length;j++){
        const a=pts[i], b=pts[j]; const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<120){ ctx.strokeStyle=`rgba(230,236,245,${(1-d/120)*0.15})`; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
      }
    }
    ctx.fillStyle='#55D6FF'; pts.forEach(p=>{ ctx.beginPath(); ctx.arc(p.x,p.y,1.3,0,6.283); ctx.fill(); });
    if(!reduced) requestAnimationFrame(step);
  }
  if(!reduced) step();
}

function mountOrbs(){
  const canvas=$('#orbs-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d'); let w,h; const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){ w=canvas.width=canvas.offsetWidth; h=canvas.height=canvas.offsetHeight; } resize(); addEventListener('resize', resize, {passive:true});
  const orbs = Array.from({length:8},()=>({x:Math.random()*w,y:Math.random()*h, vx:0,vy:0,r:8+Math.random()*10}));
  let gx=0, gy=0;
  addEventListener('mousemove', e=>{ const r=canvas.getBoundingClientRect(); gx=((e.clientX-r.left)-w/2)/w*0.6; gy=((e.clientY-r.top)-h/2)/h*0.6; }, {passive:true});
  addEventListener('deviceorientation', e=>{ gx=(e.gamma||0)/45; gy=(e.beta||0)/45; }, true);
  function step(){
    ctx.clearRect(0,0,w,h);
    for(const o of orbs){
      o.vx += gx*0.2; o.vy += gy*0.2; o.vx*=0.98; o.vy*=0.98;
      o.x += o.vx; o.y += o.vy;
      if(o.x<o.r || o.x>w-o.r) o.vx*=-0.9;
      if(o.y<o.r || o.y>h-o.r) o.vy*=-0.9;
      const g = ctx.createRadialGradient(o.x,o.y,1,o.x,o.y,o.r*2.5);
      g.addColorStop(0,'rgba(139,108,255,.9)'); g.addColorStop(1,'rgba(139,108,255,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,6.283); ctx.fill();
    }
    if(!reduced) requestAnimationFrame(step);
  }
  if(!reduced) step();
}

// NEW: starfield with twinkle + fluid displacement
function mountStars(){
  const canvas = $('#stars-canvas'); if(!canvas) return;
  const ctx = canvas.getContext('2d'); let w,h;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){ w=canvas.width=canvas.offsetWidth; h=canvas.height=canvas.offsetHeight; } resize(); addEventListener('resize', resize, {passive:true});
  const N = 140;
  const stars = Array.from({length:N},()=>({
    x: Math.random()*w, y: Math.random()*h, r: Math.random()*1.3+0.2, a: Math.random(), t: Math.random()*Math.PI*2
  }));
  let mouse = {x: w/2, y: h/2};
  canvas.addEventListener('mousemove', e=>{ const r=canvas.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; }, {passive:true});
  canvas.addEventListener('touchmove', e=>{ const t=e.touches[0]; const r=canvas.getBoundingClientRect(); mouse.x=t.clientX-r.left; mouse.y=t.clientY-r.top; }, {passive:true});

  function step(){
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      // twinkle
      s.t += 0.02 + Math.random()*0.01;
      const tw = (Math.sin(s.t)+1)/2; // 0..1
      const dist = Math.hypot(s.x-mouse.x, s.y-mouse.y);
      const push = Math.max(0, 120 - dist)/120; // field around cursor
      const ang = Math.atan2(s.y-mouse.y, s.x-mouse.x);
      // gentle displacement away from cursor
      s.x += Math.cos(ang)*push*0.6;
      s.y += Math.sin(ang)*push*0.6;

      // wrap
      if(s.x<0) s.x=w; if(s.x>w) s.x=0; if(s.y<0) s.y=h; if(s.y>h) s.y=0;

      ctx.globalAlpha = 0.35 + tw*0.6;
      ctx.fillStyle = '#E6ECF5';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if(!reduced) requestAnimationFrame(step);
  }
  if(!reduced) step();
}

// ---- Views ----
function renderHome(app){
  app.append($('#view-home').content.cloneNode(true));
  applyJargon();
  mountStars();
  mountQuantumCanvas();
  mountOrbs();
  mountROI($('#roi-widget'));
  mountSimulator($('#simulator-widget'));
  mountDashboard($('#dashboard-widget'));
  mountStories();
  initBetaCard();
}

function renderSolutions(app){
  app.append($('#view-solutions').content.cloneNode(true));
  const tabs = $$('.tab'); const panels={ medicine:$('#tab-medicine'), finance:$('#tab-finance'), logistics:$('#tab-logistics') };
  const content = {
    medicine: html`
      <div class="img-ph img-ph--wide" aria-label="Medicine case image"><i data-lucide="flask-conical"></i> Discovery</div>
      <p data-jargon="Quantum-inspired search narrows ligand candidates quickly.">Prioritize candidates faster and reduce wet-lab cycles.</p>
      <ul class="list"><li>3× faster shortlist generation</li><li>On-prem options for PHI/PII</li><li>Audit logs and access controls</li></ul>`,
    finance: html`
      <div class="img-ph img-ph--wide" aria-label="Finance case image"><i data-lucide="wallet"></i> Portfolio</div>
      <p data-jargon="QAOA/VQE drive constrained optimization for risk/return.">Optimize portfolios & rebalance with lower compute cost.</p>
      <ul class="list"><li>Real-time VaR estimates</li><li>Latency-aware execution</li><li>Strong encryption end-to-end</li></ul>`,
    logistics: html`
      <div class="img-ph img-ph--wide" aria-label="Logistics case image"><i data-lucide="truck"></i> Routing</div>
      <p data-jargon="Hybrid solvers tackle vehicle routing with time windows.">Cut miles and improve on-time performance.</p>
      <ul class="list"><li>Feasible routes in seconds</li><li>Driver & depot constraints respected</li><li>API & CSV workflows</li></ul>`
  };
  Object.entries(panels).forEach(([k, el]) => el.innerHTML = content[k]);

  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      tabs.forEach(x=>x.classList.remove('is-active'));
      t.classList.add('is-active');
      $$('.tab-panel').forEach(p=>p.classList.remove('is-active'));
      $('#tab-'+t.dataset.tab).classList.add('is-active');
      applyJargon();
      if (window.lucide) window.lucide.createIcons();
      window.scrollTo({top:0, behavior:'instant'}); // avoid downshift feel
    });
  });
  applyJargon();
}

function renderPlatform(app){
  app.append($('#view-platform').content.cloneNode(true));
  applyJargon();
  // Diagram
  const root = $('#diagram-widget');
  root.innerHTML = html`
    <div class="chip">Drag gates onto the wire</div>
    <svg id="qc" viewBox="0 0 500 160" style="width:100%;height:220px;border:1px dashed var(--border);border-radius:12px">
      <defs><linearGradient id="g"><stop offset="0%" stop-color="var(--primary)"/><stop offset="100%" stop-color="var(--accent)"/></linearGradient></defs>
      <line x1="20" y1="60" x2="480" y2="60" stroke="var(--muted)" stroke-width="2"/>
      <line x1="20" y1="120" x2="480" y2="120" stroke="var(--muted)" stroke-width="2"/>
      <rect id="gate-H" x="30" y="10" width="34" height="34" rx="6" fill="url(#g)" stroke="var(--border)"></rect><text x="47" y="31" font-size="18" text-anchor="middle">H</text>
      <rect id="gate-X" x="30" y="54" width="34" height="34" rx="6" fill="url(#g)" stroke="var(--border)"></rect><text x="47" y="75" font-size="18" text-anchor="middle">X</text>
      <rect id="gate-Z" x="30" y="98" width="34" height="34" rx="6" fill="url(#g)" stroke="var(--border)"></rect><text x="47" y="119" font-size="18" text-anchor="middle">Z</text>
    </svg>
    <p class="muted">A playful visual—no physics—just to explain gate composition.</p>
  `;
  const svg = $('#qc', root);
  ['gate-H','gate-X','gate-Z'].forEach(id=>{
    const r = $('#'+id, svg); let drag=false, ox=0, oy=0, sx=0, sy=0;
    r.addEventListener('pointerdown', e=>{ drag=true; r.setPointerCapture(e.pointerId); ox=e.clientX; oy=e.clientY; sx=parseFloat(r.getAttribute('x')); sy=parseFloat(r.getAttribute('y')); });
    r.addEventListener('pointermove', e=>{ if(!drag) return; const dx=e.clientX-ox, dy=e.clientY-oy; r.setAttribute('x', sx+dx); r.setAttribute('y', sy+dy); });
    r.addEventListener('pointerup', ()=>{ drag=false; const y = parseFloat(r.getAttribute('y')); const ny = Math.abs((y+17)-60) < Math.abs((y+17)-120) ? 43 : 103; r.setAttribute('y', ny); });
  });

  // Security
  const sec = [
    {icon:'shield', text:'Encryption in transit & at rest (TLS/AES)'},
    {icon:'key-round', text:'Role-based access control'},
    {icon:'server', text:'Single-tenant VPC or on-prem'},
    {icon:'file-check', text:'Audit trails & signed logs'},
  ];
  $('#security-list').innerHTML = sec.map(s=> `<li><i data-lucide="${s.icon}"></i> <span>${s.text}</span></li>`).join('');
  if (window.lucide) window.lucide.createIcons();

  // avoid downshift feel
  window.scrollTo({top:0, behavior:'instant'});
}

function renderPricing(app){
  app.append($('#view-pricing').content.cloneNode(true));
  const cards = $('#pricing-cards');
  const table = $('#pricing-table');

  // Plans in INR base monthly; annual = 20% off * 12 months
  const plans = [
    {name:'Starter (Beta)', priceMonthly: 24999, features:['Community support','1 concurrent job','Up to 100 CPU hrs','ROI estimator']},
    {name:'Growth', priceMonthly: 164999, features:['Email support','5 concurrent jobs','Up to 1,000 CPU hrs','Priority queue']},
    {name:'Enterprise', priceMonthly: null, features:['SLA & SSO','Unlimited jobs','Dedicated VPC/On-prem','Custom solvers']},
  ];

  const renderCards = ()=>{
    const annual = state.billing === 'annual';
    cards.innerHTML = plans.map(p=>{
      let priceStr = 'Talk to us', unit='';
      if (typeof p.priceMonthly === 'number'){
        const price = annual ? Math.round(p.priceMonthly*12*0.8) : p.priceMonthly;
        priceStr = INR0(price); unit = annual ? '/yr' : '/mo';
      }
      return html`
        <article class="card tilt reveal">
          <div class="img-ph img-ph--card" aria-label="${p.name} plan"><i data-lucide="layers"></i></div>
          <h3>${p.name}</h3>
          <p class="muted">Best for ${p.name.includes('Enterprise')?'large orgs':'getting started'}</p>
          <div style="font-size:28px;font-weight:700;margin:8px 0">${priceStr} <span class="muted" style="font-size:14px">${unit}</span></div>
          <ul class="list">${p.features.map(f=> `<li>${f}</li>`).join('')}</ul>
          <a href="#/contact" class="btn btn--primary" style="margin-top:10px">${p.name==='Enterprise'?'Talk to Sales':'Start Trial'}</a>
        </article>
      `;
    }).join('');
    mountReveals();
  };

  const renderTable = ()=>{
    const feats = Array.from(new Set(plans.flatMap(p=>p.features)));
    table.innerHTML = html`
      <table class="table">
        <thead><tr><th>Feature</th>${plans.map(p=> `<th>${p.name}</th>`).join('')}</tr></thead>
        <tbody>
          ${feats.map(f=> `<tr><td>${f}</td>${plans.map(p=> `<td>${p.features.includes(f)?'✔︎':'—'}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `;
  };

  // Segmented control
  const btnM = $('#bill-monthly');
  const btnA = $('#bill-annually');
  function setBilling(mode){
    state.billing = mode;
    btnM.classList.toggle('seg--active', mode==='monthly');
    btnA.classList.toggle('seg--active', mode==='annual');
    btnM.setAttribute('aria-selected', String(mode==='monthly'));
    btnA.setAttribute('aria-selected', String(mode==='annual'));
    renderCards();
    // lock scroll top feel
    window.scrollTo({top:0, behavior:'instant'});
  }
  btnM.addEventListener('click', ()=> setBilling('monthly'));
  btnA.addEventListener('click', ()=> setBilling('annual'));

  setBilling(state.billing);
  renderTable();
}

function renderResources(app){
  app.append($('#view-resources').content.cloneNode(true));
  const faqs = [
    {q:'What is QaaS?', a:'Quantum AI as a Service: we run hybrid quantum-classical optimization for your workloads and return results via API.'},
    {q:'Do I need a quantum computer?', a:'No. We abstract hardware. You can run in simulation, classical accelerators, or on QPU where available.'},
    {q:'Is my data safe?', a:'Yes. Encryption in transit/at rest, role-based access, audit logs. On-prem/VPC options available.'},
    {q:'What problems does this help?', a:'Routing, scheduling, portfolio optimization, feature selection, combinatorial search.'},
  ];
  $('#faq-accordion').innerHTML = faqs.map((f,i)=> `<details ${i===0?'open':''}><summary>${f.q}</summary><p>${f.a}</p></details>`).join('');
  const gloss = [
    ['QPU','Quantum Processing Unit (specialized hardware).'],
    ['Hybrid','Combining classical CPUs/GPUs with quantum methods.'],
    ['Annealing','Technique for finding low-energy (good) solutions.'],
    ['VQE/QAOA','Variational algorithms for constrained optimization.'],
  ];
  $('#glossary').innerHTML = gloss.map(g=> `<li><strong>${g[0]}</strong> — ${g[1]}</li>`).join('');
  const myths = [
    ['Quantum is sci-fi','Reality: practical hybrid gains exist today on certain optimization classes.'],
    ['Needs huge data','Reality: benefits show up with hard constraints, not just big data.'],
  ];
  $('#myths').innerHTML = myths.map(m=> `<div class="card tilt reveal"><h4>Myth: ${m[0]}</h4><p>${m[1]}</p></div>`).join('');
  mountReveals();
}

function renderAbout(app){
  app.append($('#view-about').content.cloneNode(true));
  const team = [['A. Rao','CEO'],['M. Chen','Head of Research'],['S. Gupta','Platform Lead'],['J. Silva','Security']];
  $('#team').innerHTML = team.map(t=> `
    <div class="card tilt reveal">
      <div class="img-ph img-ph--card" aria-label="${t[0]} avatar"><i data-lucide="user"></i></div>
      <div><strong>${t[0]}</strong><div class="muted">${t[1]}</div></div>
    </div>`).join('');
  const events = [['2025','Founded'],['2026','Beta launch'],['2027','First 100 customers']];
  $('#timeline').innerHTML = events.map(e=> `<li><strong>${e[0]}</strong> — ${e[1]}</li>`).join('');
  mountReveals();
}

function renderContact(app){
  app.append($('#view-contact').content.cloneNode(true));
  $('#contact-form').addEventListener('submit', e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if(!data.name || !data.email || !/^\S+@\S+\.\S+$/.test(data.email)){
      $('#contact-status').textContent = 'Please provide a valid name and email.'; return;
    }
    $('#contact-status').textContent = 'Thanks! We will reach out within 1 business day.';
    e.target.reset();
  });
  $('#map').innerHTML = `<div class="chip">🏢 SF</div> <div class="chip">🏢 Bengaluru</div> <div class="chip">🏢 London</div>`;
  mountReveals();
}

// ---- ROI Estimator (INR + aligned result) ----
function mountROI(root){
  if(!root) return;
  root.innerHTML = html`
    <form id="roi-form" class="grid responsive-two">
      <label>Current Monthly Compute Cost (₹)<input type="number" name="cost" min="0" value="200000" required /></label>
      <label>Problem Size (constraints)<input type="number" name="size" min="10" value="5000" required /></label>
      <label>Current Avg Runtime (minutes)<input type="number" name="time" min="1" value="180" required /></label>
      <label>Industry<select name="industry"><option>Medicine</option><option>Finance</option><option>Logistics</option></select></label>
      <button class="btn btn--primary" type="submit">Estimate ROI</button>
      <button class="btn btn--outline" id="roi-export" type="button" title="Export ROI as PDF">Export ROI as PDF</button>
    </form>
    <div class="grid responsive-two" style="margin-top:12px">
      <div class="card"><canvas id="roi-chart" height="160" aria-label="ROI chart"></canvas></div>
      <div class="card" id="roi-summary" style="display:flex;flex-direction:column;gap:6px;justify-content:center"></div>
    </div>`;
  const form = $('#roi-form', root); const chartCtx = $('#roi-chart', root); const summary = $('#roi-summary', root); let chart;let lastInputs = null, lastResults = null;
  const calc = d => {
    const accel = Math.max(1.8, Math.min(12, Math.log10(d.size)*6));
    const timeNew = Math.max(1, Math.round(d.time/accel));
    const costSave = Math.round(d.cost * (0.35 + (accel/20)));
    const paybackMonths = Math.max(1, Math.round( (d.cost - costSave) / Math.max(10000, d.cost*0.15) ));
    return { accel, timeNew, costSave, paybackMonths };
  };
  const draw = (d,r)=>{
    if(chart) chart.destroy();
    chart = new Chart(chartCtx, {
      type:'bar',
      data:{ labels:['Runtime (min)','Monthly Cost (₹)'],
        datasets:[
          {label:'Current', data:[d.time, d.cost]},
          {label:'With QuantumLeap', data:[r.timeNew, Math.max(0, d.cost - r.costSave)]}
        ]},
      options:{ responsive:true, plugins:{legend:{position:'bottom'}}, scales:{y:{beginAtZero:true}} }
    });
    summary.innerHTML = `
      <div><strong>~${r.accel.toFixed(1)}× faster</strong> • New runtime ≈ <strong>${r.timeNew} min</strong></div>
      <div><strong>${INR0(r.costSave)}</strong> saved monthly • Payback ≈ <strong>${r.paybackMonths} mo</strong></div>
      <a href="#/contact" class="btn btn--outline" style="align-self:start">Talk to Sales</a>`;
      lastInputs = d; lastResults = r;
  };
  form.addEventListener('submit', e=>{
    e.preventDefault(); const data = Object.fromEntries(new FormData(form).entries());
    const d = { cost:+data.cost, size:+data.size, time:+data.time, industry:data.industry }; draw(d, calc(d));
  });
  const init = { cost:200000, size:5000, time:180, industry:'Finance' }; draw(init, calc(init));
  const exportBtn = $('#roi-export', root);
exportBtn.addEventListener('click', () => {
    try {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) { alert('PDF library failed to load.'); return; }
        if (!lastInputs || !lastResults) { alert('Run the ROI estimate first.'); return; }


        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const pad = 40; let y = pad;


        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('QuantumLeap — ROI Estimate', pad, y); y += 26;


        // Summary
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const lines = [
            `Industry: ${lastInputs.industry}`,
            `Current monthly compute: ₹${new Intl.NumberFormat('en-IN').format(lastInputs.cost)}`,
            `Problem size (constraints): ${lastInputs.size}`,
            `Current runtime: ${lastInputs.time} min`,
            `Projected speedup: ~${lastResults.accel.toFixed(1)}× (new runtime ≈ ${lastResults.timeNew} min)`,
            `Projected monthly savings: ₹${new Intl.NumberFormat('en-IN').format(lastResults.costSave)} (payback ≈ ${lastResults.paybackMonths} mo)`
        ];
        lines.forEach(t => { doc.text(t, pad, y); y += 18; });
        y += 6;


        // Chart image
        const canvasEl = $('#roi-chart', root);
        const dataURL = canvasEl.toDataURL('image/png', 1.0);
        const imgW = 520, imgH = imgW * 0.5; // simple aspect
        doc.addImage(dataURL, 'PNG', pad, y, imgW, imgH);
        y += imgH + 20;


        // Footer
        doc.setFontSize(10);
        doc.text('Generated by QuantumLeap ROI estimator', pad, y);


        const fname = `QuantumLeap_ROI_${Date.now()}.pdf`;
        doc.save(fname);
    } catch (err) {
        console.error(err);
        alert('Could not generate PDF. See console for details.');
    }
    });
}

// ---- Simulator ----
function mountSimulator(root){
  if(!root) return;
  root.innerHTML = html`
    <form id="sim-form" class="row">
      <select name="case"><option value="logistics">Vehicle Routing</option><option value="finance">Portfolio Rebalance</option><option value="medicine">Docking Shortlist</option></select>
      <input type="number" name="scale" value="100" min="10" step="10" />
      <button class="btn btn--primary btn--sm">Run</button>
    </form>
    <div class="grid responsive-two" style="margin-top:10px">
      <div class="card"><canvas id="sim-chart" height="160"></canvas></div>
      <div class="card" id="sim-out" style="display:flex;align-items:center"></div>
    </div>`;
  const form=$('#sim-form', root); const ctx=$('#sim-chart', root); const out=$('#sim-out', root); let chart;
  const simulate=(kind,scale)=>{ const base=Math.max(1, Math.log(scale)*10); const quantum=Math.max(1, base*(0.35+Math.random()*0.15)); const quality=(2+Math.random()*3).toFixed(1); return { baseline:Math.round(base), quantum:Math.round(quantum), quality }; };
  const draw=res=>{
    if(chart) chart.destroy();
    chart = new Chart(ctx,{ type:'bar', data:{labels:['Time Units'], datasets:[{label:'Classical',data:[res.baseline]},{label:'QuantumLeap',data:[res.quantum]}]}, options:{responsive:true,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}} });
    out.innerHTML = `<div><p>Estimated runtime improvement: <strong>${Math.max(1, Math.round(res.baseline/res.quantum))}×</strong></p><p>Objective quality improvement: <strong>${res.quality}%</strong></p></div>`;
  };
  form.addEventListener('submit', e=>{ e.preventDefault(); const fd=new FormData(form); draw(simulate(fd.get('case'), +fd.get('scale'))); });
  draw(simulate('logistics',100));
}

// ---- Dashboard ----
function mountDashboard(root){
  if(!root) return;
  let pct=68;
  root.innerHTML = html`
    <div class="grid responsive-two">
      <div>
        <div class="chip">Job <strong>#QPU-23</strong></div>
        <p>Status: <strong id="job-status">Running</strong></p>
        <progress id="job-progress" max="100" value="${pct}" style="width:100%"></progress>
        <p>Predicted completion: <strong id="job-eta">12m</strong></p>
      </div>
      <div><canvas id="dash-chart" height="120" aria-label="QPU Utilization"></canvas></div>
    </div>`;
  const prog=$('#job-progress', root), status=$('#job-status', root), eta=$('#job-eta', root), ctx=$('#dash-chart', root);
  const util = Array.from({length:12},()=> 40+Math.round(Math.random()*40));
  const chart=new Chart(ctx,{type:'line',data:{labels:Array(12).fill(''),datasets:[{label:'QPU Utilization %',data:util,tension:.35}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100}}}});
  const t=setInterval(()=>{ pct=Math.min(100, pct + Math.random()*2); prog.value=pct; if(pct>98){status.textContent='Finalizing'; eta.textContent='~1m';} if(pct>=100){status.textContent='Complete'; eta.textContent='—'; clearInterval(t);} }, 900);
}

// ---- Stories ----
function mountStories(){
  const track=$('#stories-track');
  const stories=[ {name:'BioSynth', text:'Reduced docking shortlist from 3d → 12h', metric:'83% faster'}, {name:'QFinAI', text:'Saved ₹1.0Cr+/year in compute', metric:'~60% cheaper'}, {name:'MoveX', text:'22% fewer fleet miles in Q4', metric:'22% fewer miles'} ];
  track.innerHTML = stories.map(s=> `<article class="card tilt" style="min-width:280px"><div class="img-ph img-ph--card"><i data-lucide="sparkle"></i></div><h4>${s.name}</h4><p>${s.text}</p><div class="badge">${s.metric}</div></article>`).join('');
  $('#stories-prev').addEventListener('click', ()=> track.scrollBy({left:-280,behavior:'smooth'}));
  $('#stories-next').addEventListener('click', ()=> track.scrollBy({left: 280,behavior:'smooth'}));
}

// ---- Beta (card + modal) ----
function initBetaCard(){
  const countdownEl = $('#beta-countdown'); const spotsEl = $('#beta-spots');
  if(!countdownEl) return;
  spotsEl.textContent = state.betaSpots;
  const it = setInterval(()=>{
    const left=Math.max(0, state.betaCloseAt - Date.now());
    const m=String(Math.floor(left/60000)).padStart(2,'0'); const s=String(Math.floor(left/1000)%60).padStart(2,'0');
    countdownEl.textContent=`${m}:${s}`; if(left<=0){ clearInterval(it); countdownEl.textContent='Closed'; }
  }, 1000);
  // open modal buttons
  $$('[data-open="beta-modal"]').forEach(btn => btn.addEventListener('click', ()=> $('#beta-modal').showModal()));
}
function initBetaModal(){
  $('#beta-submit')?.addEventListener('click', (e)=>{
    e.preventDefault();
    const email = $('#beta-email').value.trim();
    if(!/^\S+@\S+\.\S+$/.test(email)) { $('#beta-status').textContent = 'Enter a valid email.'; return; }
    if(state.betaSpots<=0){ $('#beta-status').textContent = 'Sorry, beta is full.'; return; }
    state.betaSpots--; const sp=$('#beta-spots'); if(sp) sp.textContent = state.betaSpots;
    $('#beta-status').textContent = 'Applied! We will contact you shortly.';
    triggerConfetti();
    // Close after a brief moment (confetti continues globally)
    setTimeout(()=> $('#beta-modal').close(), 800);
  });
}

// ---- Chat ----
function initChat(){
  const open=$('#chat-open'), chat=$('#chat'), close=$('#chat-close'), body=$('#chat-body'), form=$('#chat-form'), input=$('#chat-text');
  const sugg=$$('#chat .chip');
  const QAs={
    'What is QaaS?':'QaaS = Quantum AI as a Service. We host hybrid solvers and return results via secure API.',
    'How secure is this?':'Encryption in transit/at rest, RBAC, audit logs, and VPC/on-prem options.',
    'How can you help logistics?':'We reduce miles and late arrivals via hybrid routing with constraints. Typical 10–25% gains.',
    'pricing':'Starter ₹24,999/mo, Growth ₹1,64,999/mo, or Enterprise (custom). Annual bills save ~20%.',
    'roi':'Typical compute savings: 35–70%, runtime 2–10× faster, depending on constraints.',
  };
  function append(msg, who){
    const el=document.createElement('div'); el.className='chat__msg '+(who==='user'?'chat__msg--user':'chat__msg--bot');
    el.textContent=msg; body.appendChild(el); body.scrollTop=body.scrollHeight;
  }
  open.addEventListener('click', ()=> chat.classList.add('is-open'));
  close.addEventListener('click', ()=> chat.classList.remove('is-open'));
  sugg.forEach(b=> b.addEventListener('click', ()=> { input.value=b.dataset.q; form.requestSubmit(); }));
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const q=input.value.trim(); if(!q) return;
    append(q, 'user'); input.value='';
    const key = Object.keys(QAs).find(k=> q.toLowerCase().includes(k.toLowerCase()));
    const a = QAs[key] || 'Great question! Share your constraints and we will estimate impact.';
    setTimeout(()=> append(a,'bot'), 200);
  });
}

// ---- Icons init ----
document.addEventListener('DOMContentLoaded', ()=> { if(window.lucide) window.lucide.createIcons(); });
