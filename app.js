// QuantumLeap SPA — correct, self-contained, and responsive
// Author: ChatGPT (GPT-5 Thinking) for Divyansh

/* ========== UTILITIES ========== */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const html = (strings, ...vals) =>
  strings.reduce((acc, s, i) => acc + s + (vals[i] ?? ''), '');

const state = {
  theme: localStorage.getItem('theme') || 'dark',
  noJargon: JSON.parse(localStorage.getItem('nojargon') || 'false'),
  betaSpots: 3,
  betaCloseAt: Date.now() + 5*60*1000, // 5 minutes from load
};

document.documentElement.setAttribute('data-theme', state.theme);
const setTheme = (t) => {
  state.theme = t; localStorage.setItem('theme', t);
  document.documentElement.setAttribute('data-theme', t);
};

/* ========== ROUTER (hash-based) ========== */
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
  const path = location.hash.replace('#', '') || '/';
  const view = routes[path] || routes['/'];
  const app = $('#app');
  app.innerHTML = ''; // clean
  view(app);
  markActiveLink(path);
  app.focus(); // a11y
  // re-mount icons
  if (window.lucide) window.lucide.createIcons();
}
function markActiveLink(path){
  $$('#navmenu a').forEach(a=>{
    a.setAttribute('aria-current', a.getAttribute('href') === '#'+path ? 'page' : 'false');
  });
}
window.addEventListener('hashchange', navigate);
window.addEventListener('load', () => {
  // mobile nav
  const toggle = $('#nav-toggle');
  toggle?.addEventListener('click', ()=>{
    const menu = $('#navmenu');
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('is-open');
  });
  // header controls
  $('#theme-toggle')?.addEventListener('click', ()=> setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  const jt = $('#jargon-toggle');
  jt?.addEventListener('click', ()=>{
    state.noJargon = !state.noJargon;
    localStorage.setItem('nojargon', JSON.stringify(state.noJargon));
    jt.setAttribute('aria-pressed', String(state.noJargon));
    applyJargon();
  });
  // footer year
  $('#year').textContent = new Date().getFullYear();
  // newsletter
  $('#newsletter-form')?.addEventListener('submit', e=>{
    e.preventDefault();
    $('#newsletter-status').textContent = 'Thanks! You are subscribed.';
    e.target.reset();
  });
  // beta bar
  initBetaBar();
  // chat
  initChat();
  // first route
  navigate();
});

/* ========== JARGON TOGGLE ========== */
function applyJargon(){
  // Elements with data-jargon contain the technical phrase; in noJargon mode we keep plain text, else replace with data-jargon text
  $$('[data-jargon]').forEach(el=>{
    const tech = el.getAttribute('data-jargon');
    const plain = el.getAttribute('data-plain') || el.textContent;
    if (!el.getAttribute('data-plain')) el.setAttribute('data-plain', plain);
    el.textContent = state.noJargon ? plain : tech;
  });
}

/* ========== HERO PARTICLE CANVAS ========== */
function mountQuantumCanvas(){
  const canvas = $('#quantum-canvas'); if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [], w, h, mouse={x:0,y:0};
  function resize(){ w=canvas.width=canvas.offsetWidth; h=canvas.height=canvas.offsetHeight; }
  window.addEventListener('resize', resize); resize();

  const count = 70;
  for(let i=0;i<count;i++){
    particles.push({ x:Math.random()*w, y:Math.random()*h, vx:(Math.random()-.5)*0.6, vy:(Math.random()-.5)*0.6 });
  }
  canvas.addEventListener('mousemove', e=>{
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
  });
  function step(){
    ctx.clearRect(0,0,w,h);
    for(const p of particles){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>w) p.vx*=-1; if(p.y<0||p.y>h) p.vy*=-1;
      // attraction to mouse
      const dx=p.x-mouse.x, dy=p.y-mouse.y, d=Math.hypot(dx,dy);
      if(d<120 && d>0){ p.vx -= dx/d*0.02; p.vy -= dy/d*0.02; }
    }
    // draw links
    ctx.lineWidth=1;
    for(let i=0;i<count;i++){
      for(let j=i+1;j<count;j++){
        const a=particles[i], b=particles[j];
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<120){
          const alpha = 1 - d/120;
          const g = ctx.createLinearGradient(a.x,a.y,b.x,b.y);
          g.addColorStop(0,'#00e5ff'); g.addColorStop(1,'#6a00ff');
          ctx.strokeStyle = `rgba(255,255,255,${alpha*0.3})`;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    // draw nodes
    for(const p of particles){
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath(); ctx.arc(p.x,p.y,1.5,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(step);
  }
  step();
}

/* ========== HOME VIEW ========== */
function renderHome(app){
  app.append($('#view-home').content.cloneNode(true));
  applyJargon();
  mountQuantumCanvas();
  mountROI($('#roi-widget'));
  mountSimulator($('#simulator-widget'));
  mountDashboard($('#dashboard-widget'));
  mountStories();
  if (window.lucide) window.lucide.createIcons();
}

/* ROI Estimator */
function mountROI(root){
  if(!root) return;
  root.innerHTML = html`
    <form id="roi-form" class="grid responsive-two">
      <label>Current Monthly Compute Cost ($)
        <input type="number" name="cost" min="0" value="20000" required />
      </label>
      <label>Problem Size (constraints)
        <input type="number" name="size" min="10" value="5000" required />
      </label>
      <label>Current Avg Runtime (minutes)
        <input type="number" name="time" min="1" value="180" required />
      </label>
      <label>Industry
        <select name="industry">
          <option>Medicine</option><option>Finance</option><option>Logistics</option>
        </select>
      </label>
      <button class="btn btn--primary" type="submit">Estimate ROI</button>
    </form>
    <div class="grid responsive-two" style="margin-top:12px">
      <div class="card"><canvas id="roi-chart" height="160" aria-label="ROI chart"></canvas></div>
      <div class="card" id="roi-summary"></div>
    </div>
  `;
  const form = $('#roi-form', root);
  const chartCtx = $('#roi-chart', root);
  const summary = $('#roi-summary', root);
  let chart;

  function calc(data){
    // Simple deterministic model for demo
    const accel = Math.max(1.8, Math.min(12, Math.log10(data.size)*6)); // 2x–12x
    const timeNew = Math.max(1, Math.round(data.time/accel));
    const costSave = Math.round(data.cost * (0.35 + (accel/20))); // 35%–95% depending on accel
    const paybackMonths = Math.max(1, Math.round( (data.cost - costSave) / Math.max(1000, data.cost*0.15) ));
    return { accel, timeNew, costSave, paybackMonths };
  }
  function draw(data, res){
    if(chart) chart.destroy();
    chart = new Chart(chartCtx, {
      type:'bar',
      data:{
        labels:['Runtime (min)','Monthly Cost ($)'],
        datasets:[
          {label:'Current', data:[data.time, data.cost]},
          {label:'With QuantumLeap', data:[res.timeNew, Math.max(0, data.cost - res.costSave)]}
        ]
      },
      options:{
        responsive:true,
        plugins:{legend:{position:'bottom'}},
        scales:{y:{beginAtZero:true}}
      }
    });
    summary.innerHTML = html`
      <h4>Result</h4>
      <p><strong>~${res.accel.toFixed(1)}× faster</strong> • New runtime ≈ <strong>${res.timeNew} min</strong></p>
      <p><strong>$${res.costSave.toLocaleString()}</strong> saved monthly • Payback ≈ <strong>${res.paybackMonths} mo</strong></p>
      <a href="#/contact" class="btn btn--outline">Talk to Sales</a>
    `;
  }
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const parsed = { cost:+data.cost, size:+data.size, time:+data.time, industry:data.industry };
    const res = calc(parsed); draw(parsed, res);
  });
  // initial draw
  const initData = { cost:20000, size:5000, time:180, industry:'Finance' };
  draw(initData, calc(initData));
}

/* Use-Case Simulator */
function mountSimulator(root){
  if(!root) return;
  root.innerHTML = html`
    <form id="sim-form" class="row">
      <select name="case">
        <option value="logistics">Vehicle Routing</option>
        <option value="finance">Portfolio Rebalance</option>
        <option value="medicine">Docking Shortlist</option>
      </select>
      <input type="number" name="scale" value="100" min="10" step="10" />
      <button class="btn btn--primary btn--sm">Run</button>
    </form>
    <div class="grid responsive-two" style="margin-top:10px">
      <div class="card"><canvas id="sim-chart" height="160"></canvas></div>
      <div class="card" id="sim-out"></div>
    </div>
  `;
  const form = $('#sim-form', root);
  const ctx = $('#sim-chart', root);
  const out = $('#sim-out', root);
  let chart;

  function simulate(kind, scale){
    const base = Math.max(1, Math.log(scale) * 10);
    const quantum = Math.max(1, base * (0.35 + Math.random()*0.15)); // 35–50% of baseline
    const quality = 2 + Math.random()*3; // 2–5% better objective
    return { baseline: Math.round(base), quantum: Math.round(quantum), quality: quality.toFixed(1) };
  }
  function draw(res){
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
      type:'bar',
      data:{ labels:['Time Units'], datasets:[
        {label:'Classical', data:[res.baseline]},
        {label:'QuantumLeap', data:[res.quantum]}
      ]},
      options:{responsive:true,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}
    });
    out.innerHTML = html`
      <p>Estimated runtime improvement: <strong>${Math.max(1, Math.round(res.baseline/res.quantum))}×</strong></p>
      <p>Objective quality improvement: <strong>${res.quality}%</strong></p>
    `;
  }

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const fd = new FormData(form);
    const res = simulate(fd.get('case'), +fd.get('scale'));
    draw(res);
  });
  draw(simulate('logistics', 100));
}

/* Dashboard Sneak Peek */
function mountDashboard(root){
  if(!root) return;
  let pct = 68;
  root.innerHTML = html`
    <div class="grid responsive-two">
      <div>
        <div class="chip">Job <strong>#QPU-23</strong></div>
        <p>Status: <strong id="job-status">Running</strong></p>
        <progress id="job-progress" max="100" value="${pct}" style="width:100%"></progress>
        <p>Predicted completion: <strong id="job-eta">12m</strong></p>
      </div>
      <div>
        <canvas id="dash-chart" height="120" aria-label="QPU Utilization"></canvas>
      </div>
    </div>
  `;
  const prog = $('#job-progress', root);
  const status = $('#job-status', root);
  const eta = $('#job-eta', root);
  const ctx = $('#dash-chart', root);
  const util = Array.from({length:12},()=> 40+Math.round(Math.random()*40));
  const chart = new Chart(ctx,{type:'line',data:{labels:Array(12).fill(''),datasets:[{label:'QPU Utilization %',data:util,tension:.35}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100}}}});
  // Animate progress
  const t = setInterval(()=>{
    pct = Math.min(100, pct + Math.random()*2);
    prog.value = pct;
    if(pct>98){ status.textContent='Finalizing'; eta.textContent='~1m'; }
    if(pct>=100){ status.textContent='Complete'; eta.textContent='—'; clearInterval(t); }
  }, 900);
}

/* Stories Carousel */
function mountStories(){
  const track = $('#stories-track');
  const stories = [
    {name:'BioSynth', text:'Reduced docking shortlist from 3d → 12h', metric:'83% faster'},
    {name:'QFinAI', text:'Cut compute cost by $1.2M/year', metric:'60% cheaper'},
    {name:'MoveX', text:'22% fewer fleet miles in Q4', metric:'22% fewer miles'},
  ];
  track.innerHTML = stories.map(s => html`
    <article class="card" style="min-width:280px">
      <h4>${s.name}</h4>
      <p>${s.text}</p>
      <div class="badge">${s.metric}</div>
    </article>
  `).join('');
  $('#stories-prev').addEventListener('click', ()=> track.scrollBy({left:-280,behavior:'smooth'}));
  $('#stories-next').addEventListener('click', ()=> track.scrollBy({left: 280,behavior:'smooth'}));
}

/* ========== SOLUTIONS VIEW ========== */
function renderSolutions(app){
  app.append($('#view-solutions').content.cloneNode(true));
  const tabs = $$('.tab');
  const panels = {
    medicine: $('#tab-medicine'),
    finance: $('#tab-finance'),
    logistics: $('#tab-logistics'),
  };
  const content = {
    medicine: html`
      <p data-jargon="Quantum-inspired search narrows ligand candidates quickly.">
        Prioritize candidates faster and reduce wet-lab cycles.
      </p>
      <ul class="list">
        <li>3× faster shortlist generation</li>
        <li>On-prem options for PHI/PII</li>
        <li>Audit logs and access controls</li>
      </ul>`,
    finance: html`
      <p data-jargon="QAOA/VQE drive constrained optimization for risk/return.">
        Optimize portfolios and rebalance with lower compute cost.
      </p>
      <ul class="list">
        <li>Real-time VaR estimates</li>
        <li>Latency-aware execution</li>
        <li>Strong encryption in transit/at rest</li>
      </ul>`,
    logistics: html`
      <p data-jargon="Hybrid solvers tackle vehicle routing with time windows.">
        Cut miles and improve on-time performance.
      </p>
      <ul class="list">
        <li>Feasible routes in seconds</li>
        <li>Driver and depot constraints respected</li>
        <li>API or CSV uploads</li>
      </ul>`
  };
  Object.entries(panels).forEach(([k, el]) => el.innerHTML = content[k]);

  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      tabs.forEach(x=>x.classList.remove('is-active'));
      t.classList.add('is-active');
      $$('.tab-panel').forEach(p=>p.classList.remove('is-active'));
      const id = t.dataset.tab;
      $('#tab-'+id).classList.add('is-active');
      applyJargon();
    });
  });
  applyJargon();
  if (window.lucide) window.lucide.createIcons();
}

/* ========== PLATFORM VIEW ========== */
function renderPlatform(app){
  app.append($('#view-platform').content.cloneNode(true));
  applyJargon();
  // Diagram widget: tiny drag-and-snap demo
  const root = $('#diagram-widget');
  root.innerHTML = html`
    <div class="chip">Drag gates onto the wire</div>
    <svg id="qc" viewBox="0 0 500 160" style="width:100%;height:220px;border:1px dashed var(--border);border-radius:12px">
      <line x1="20" y1="60" x2="480" y2="60" stroke="var(--muted)" stroke-width="2"/>
      <line x1="20" y1="120" x2="480" y2="120" stroke="var(--muted)" stroke-width="2"/>
      <rect id="gate-H" x="30" y="10" width="34" height="34" rx="6" fill="url(#g)" stroke="var(--border)"></rect>
      <text x="47" y="31" font-size="18" text-anchor="middle">H</text>
      <rect id="gate-X" x="30" y="54" width="34" height="34" rx="6" fill="url(#g)" stroke="var(--border)"></rect>
      <text x="47" y="75" font-size="18" text-anchor="middle">X</text>
      <rect id="gate-Z" x="30" y="98" width="34" height="34" rx="6" fill="url(#g)" stroke="var(--border)"></rect>
      <text x="47" y="119" font-size="18" text-anchor="middle">Z</text>
      <defs>
        <linearGradient id="g"><stop offset="0%" stop-color="var(--primary)"/><stop offset="100%" stop-color="var(--accent)"/></linearGradient>
      </defs>
    </svg>
    <p class="muted">This is a playful visual—no physics engine—just to explain gate composition.</p>
  `;
  const svg = $('#qc', root);
  ['gate-H','gate-X','gate-Z'].forEach(id=>{
    const r = $('#'+id, svg);
    let drag=false, ox=0, oy=0, sx=0, sy=0;
    r.addEventListener('pointerdown', e=>{ drag=true; r.setPointerCapture(e.pointerId); ox=e.clientX; oy=e.clientY; sx=parseFloat(r.getAttribute('x')); sy=parseFloat(r.getAttribute('y')); });
    r.addEventListener('pointermove', e=>{
      if(!drag) return;
      const dx=e.clientX-ox, dy=e.clientY-oy;
      r.setAttribute('x', sx+dx); r.setAttribute('y', sy+dy);
    });
    r.addEventListener('pointerup', ()=>{
      drag=false;
      // snap to nearest wire (60 or 120)
      const y = parseFloat(r.getAttribute('y'));
      const ny = Math.abs((y+17)-60) < Math.abs((y+17)-120) ? 43 : 103;
      r.setAttribute('y', ny);
    });
  });

  // Security list
  const sec = [
    {icon:'shield', text:'Encryption in transit & at rest (TLS/AES)'},
    {icon:'key-round', text:'Role-based access control'},
    {icon:'server', text:'Single-tenant VPC or on-prem'},
    {icon:'file-check', text:'Audit trails & signed logs'},
  ];
  $('#security-list').innerHTML = sec.map(s=> html`
    <li><i data-lucide="${s.icon}"></i> <span>${s.text}</span></li>
  `).join('');
  if (window.lucide) window.lucide.createIcons();
}

/* ========== PRICING VIEW ========== */
function renderPricing(app){
  app.append($('#view-pricing').content.cloneNode(true));
  const toggle = $('#price-toggle');
  const cards = $('#pricing-cards');
  const table = $('#pricing-table');

  const plans = [
    {name:'Starter (Beta)', price:299, features:['Community support','1 concurrent job','Up to 100 CPU hrs','ROI estimator']},
    {name:'Growth', price:1999, features:['Email support','5 concurrent jobs','Up to 1,000 CPU hrs','Priority queue']},
    {name:'Enterprise', price: 'Talk to us', features:['SLA & SSO','Unlimited jobs','Dedicated VPC/On-prem','Custom solvers']},
  ];
  function renderCards(annual){
    cards.innerHTML = plans.map(p=>{
      const price = typeof p.price==='number' ? (annual ? Math.round(p.price*12*0.8) : p.price) : p.price;
      const unit = typeof p.price==='number' ? (annual ? '/yr' : '/mo') : '';
      return html`
        <article class="card">
          <h3>${p.name}</h3>
          <p class="muted">Best for ${p.name.includes('Enterprise')?'large orgs':'getting started'}</p>
          <div style="font-size:28px;font-weight:700;margin:8px 0">${typeof price==='number'?'$'+price.toLocaleString():price} <span class="muted" style="font-size:14px">${unit}</span></div>
          <ul class="list">${p.features.map(f=> `<li>${f}</li>`).join('')}</ul>
          <a href="#/contact" class="btn btn--primary" style="margin-top:10px">${p.name==='Enterprise'?'Talk to Sales':'Start Trial'}</a>
        </article>
      `;
    }).join('');
  }
  function renderTable(){
    const feats = Array.from(new Set(plans.flatMap(p=>p.features)));
    table.innerHTML = html`
      <table class="table">
        <thead><tr><th>Feature</th>${plans.map(p=> `<th>${p.name}</th>`).join('')}</tr></thead>
        <tbody>
          ${feats.map(f=> html`<tr><td>${f}</td>${plans.map(p=> `<td>${p.features.includes(f)?'✔︎':'—'}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `;
  }
  renderCards(false); renderTable();
  toggle.addEventListener('change', ()=> renderCards(toggle.checked));
}

/* ========== RESOURCES VIEW ========== */
function renderResources(app){
  app.append($('#view-resources').content.cloneNode(true));
  // FAQ
  const faqs = [
    {q:'What is QaaS?', a:'Quantum AI as a Service: we run hybrid quantum-classical optimization for your workloads and return results via API.'},
    {q:'Do I need a quantum computer?', a:'No. We abstract hardware. You can run in simulation, classical accelerators, or on QPU where available.'},
    {q:'Is my data safe?', a:'Yes. Encryption in transit/at rest, role-based access, audit logs. On-prem/VPC options available.'},
    {q:'What problems does this help?', a:'Routing, scheduling, portfolio optimization, feature selection, combinatorial search.'},
  ];
  const acc = $('#faq-accordion');
  acc.innerHTML = faqs.map((f,i)=> html`
    <details ${i===0?'open':''}><summary>${f.q}</summary><p>${f.a}</p></details>
  `).join('');

  // Glossary
  const gloss = [
    ['QPU','Quantum Processing Unit (specialized hardware).'],
    ['Hybrid','Combining classical CPUs/GPUs with quantum methods.'],
    ['Annealing','Technique for finding low-energy (good) solutions.'],
    ['VQE/QAOA','Variational algorithms for constrained optimization.'],
  ];
  $('#glossary').innerHTML = gloss.map(g=> `<li><strong>${g[0]}</strong> — ${g[1]}</li>`).join('');

  // Myths
  const myths = [
    ['Quantum is sci-fi','Reality: practical hybrid gains exist today on certain optimization classes.'],
    ['Needs huge data','Reality: benefits show up with hard constraints, not just big data.'],
  ];
  $('#myths').innerHTML = myths.map(m=> html`<div class="card"><h4>Myth: ${m[0]}</h4><p>${m[1]}</p></div>`).join('');
}

/* ========== ABOUT VIEW ========== */
function renderAbout(app){
  app.append($('#view-about').content.cloneNode(true));
  const team = [
    ['A. Rao','CEO'],['M. Chen','Head of Research'],['S. Gupta','Platform Lead'],['J. Silva','Security'],
  ];
  $('#team').innerHTML = team.map(t=> html`
    <div class="card">
      <div class="row row--center">
        <div class="chip">👩🏽‍💻</div>
        <div><strong>${t[0]}</strong><div class="muted">${t[1]}</div></div>
      </div>
    </div>
  `).join('');
  const events = [
    ['2025','Founded'],['2026','Beta launch'],['2027','First 100 customers'],
  ];
  $('#timeline').innerHTML = events.map(e=> `<li><strong>${e[0]}</strong> — ${e[1]}</li>`).join('');
}

/* ========== CONTACT VIEW ========== */
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
  // Map (static pins)
  $('#map').innerHTML = html`<div class="chip">🏢 SF</div> <div class="chip">🏢 Bengaluru</div> <div class="chip">🏢 London</div>`;
}

/* ========== BETA BAR & MODAL ========== */
function initBetaBar(){
  const countdownEl = $('#beta-countdown');
  const spotsEl = $('#beta-spots');
  spotsEl.textContent = state.betaSpots;
  const it = setInterval(()=>{
    const left = Math.max(0, state.betaCloseAt - Date.now());
    const m = String(Math.floor(left/60000)).padStart(2,'0');
    const s = String(Math.floor(left/1000)%60).padStart(2,'0');
    countdownEl.textContent = `${m}:${s}`;
    if(left<=0) { clearInterval(it); countdownEl.textContent = 'Closed'; }
  }, 1000);

  // modal
  const modal = $('#beta-modal');
  $$('[data-open="beta-modal"]').forEach(btn => btn.addEventListener('click', ()=> modal.showModal()));
  $('#beta-submit').addEventListener('click', (e)=>{
    e.preventDefault();
    const email = $('#beta-email').value.trim();
    if(!/^\S+@\S+\.\S+$/.test(email)) { $('#beta-status').textContent = 'Enter a valid email.'; return; }
    if(state.betaSpots<=0){ $('#beta-status').textContent = 'Sorry, beta is full.'; return; }
    state.betaSpots--; $('#beta-spots').textContent = state.betaSpots;
    $('#beta-status').textContent = 'Applied! We will contact you shortly.';
    setTimeout(()=> $('#beta-modal').close(), 800);
  });
}

/* ========== CHAT WIDGET ========== */
function initChat(){
  const open = $('#chat-open'), chat = $('#chat'), close = $('#chat-close');
  const body = $('#chat-body'), form = $('#chat-form'), input = $('#chat-text');
  const sugg = $$('#chat .chip');
  const QAs = {
    'What is QaaS?': 'QaaS = Quantum AI as a Service. We host hybrid solvers and return results via secure API.',
    'How secure is this?': 'Encryption in transit/at rest, RBAC, audit logs, and VPC/on-prem options.',
    'How can you help logistics?': 'We reduce miles and late arrivals via hybrid routing with constraints. Typical 10–25% gains.',
    'pricing': 'Starter $299/mo, Growth $1,999/mo, or Enterprise (custom). Annual billing saves 20%.',
    'roi': 'Typical compute savings: 35–70%, runtime 2–10× faster, depending on constraints.',
  };
  function append(msg, who){
    const el = document.createElement('div');
    el.className = 'chat__msg '+(who==='user'?'chat__msg--user':'chat__msg--bot');
    el.textContent = msg; body.appendChild(el); body.scrollTop = body.scrollHeight;
  }
  open.addEventListener('click', ()=> chat.classList.add('is-open'));
  close.addEventListener('click', ()=> chat.classList.remove('is-open'));
  sugg.forEach(b=> b.addEventListener('click', ()=> { input.value = b.dataset.q; form.requestSubmit(); }));
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const q = input.value.trim(); if(!q) return;
    append(q, 'user'); input.value='';
    const key = Object.keys(QAs).find(k => q.toLowerCase().includes(k.toLowerCase()));
    const a = QAs[key] || 'Great question! For specifics, share your constraints and we will estimate impact.';
    setTimeout(()=> append(a,'bot'), 200);
  });
}

/* ========== GLOBAL ICONS ON LOAD ========== */
document.addEventListener('DOMContentLoaded', ()=> { if(window.lucide) window.lucide.createIcons(); });
