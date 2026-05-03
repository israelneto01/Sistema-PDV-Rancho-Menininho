document.addEventListener("DOMContentLoaded", function() {
// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════
let CARDAPIO = [
  {id:1, nome:'Cerveja Long Neck',        preco:9,   categoria:'Bebidas'},
  {id:2, nome:'Caipirinha',               preco:14,  categoria:'Bebidas'},
  {id:3, nome:'Refrigerante Lata',        preco:6,   categoria:'Bebidas'},
  {id:4, nome:'Água sem Gás',             preco:4,   categoria:'Bebidas'},
  {id:5, nome:'Suco Natural',             preco:10,  categoria:'Bebidas'},
  {id:6, nome:'Dose de Whisky',           preco:18,  categoria:'Bebidas'},
  {id:7, nome:'Vinho Taça',               preco:20,  categoria:'Bebidas'},
  {id:8, nome:'Chopp 300ml',              preco:8,   categoria:'Bebidas'},
  {id:9, nome:'Porção de Fritas',         preco:22,  categoria:'Petiscos'},
  {id:10,nome:'Isca de Frango',           preco:28,  categoria:'Petiscos'},
  {id:11,nome:'Queijo Coalho',            preco:18,  categoria:'Petiscos'},
  {id:12,nome:'Bolinho de Bacalhau',      preco:24,  categoria:'Petiscos'},
  {id:13,nome:'Calabresa Acebolada',      preco:26,  categoria:'Petiscos'},
  {id:14,nome:'Carne de Sol c/ Macaxeira',preco:32,  categoria:'Petiscos'},
  {id:15,nome:'Prato do Dia',             preco:35,  categoria:'Pratos'},
  {id:16,nome:'Filé à Parmegiana',        preco:48,  categoria:'Pratos'},
  {id:17,nome:'Frango Grelhado',          preco:38,  categoria:'Pratos'},
  {id:18,nome:'Moqueca de Peixe',         preco:55,  categoria:'Pratos'},
  {id:19,nome:'Pudim',                    preco:12,  categoria:'Sobremesas'},
  {id:20,nome:'Açaí 300ml',              preco:18,  categoria:'Sobremesas'},
  {id:21,nome:'Brownie c/ Sorvete',       preco:16,  categoria:'Sobremesas'},
];
const N = 100;
let mesas = {};
for(let i=1;i<=N;i++) mesas[i]={numero:i,status:'fechada',pedidos:[],abertura:null,cliente:'',obs:''};
let historico=[], mesaAtual=null, itemAtual=null, addQtd=1, catAtiva='Todas', divN=2, editItemId=null, nextId=22, pagSel='Dinheiro', mesaFilter='todas';

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════
const $=id=>document.getElementById(id);
function fmt(n){return'R$ '+Number(n).toFixed(2).replace('.',',')}
function calcTotal(n){return(mesas[n]?.pedidos||[]).reduce((s,p)=>s+p.preco*p.qtd,0)}
function totalItens(n){return(mesas[n]?.pedidos||[]).reduce((s,p)=>s+p.qtd,0)}

// ═══════════════════════════════════════
// SALVAMENTO LOCAL DOS DADOS
// ═══════════════════════════════════════
const STORAGE_KEY = 'rancho_menininho_dados_v1';

function salvarDados(){
  const dados = { mesas, historico, CARDAPIO, nextId };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function carregarDados(){
  const salvo = localStorage.getItem(STORAGE_KEY);
  if(!salvo) return;

  try{
    const dados = JSON.parse(salvo);
    if(dados.mesas) mesas = dados.mesas;
    if(Array.isArray(dados.historico)) historico = dados.historico;
    if(Array.isArray(dados.CARDAPIO)) CARDAPIO = dados.CARDAPIO;
    if(dados.nextId) nextId = dados.nextId;
  }catch(e){
    console.error('Erro ao carregar dados salvos:', e);
  }
}

function toast(msg,t='i'){
  const icons={s:'✓',e:'✕',i:'•'};
  const el=document.createElement('div');
  el.className=`toast ${t}`;
  el.innerHTML=`<span>${icons[t]}</span><span>${msg}</span>`;
  $('toasts').appendChild(el);
  setTimeout(()=>{el.style.opacity='0';el.style.transition='opacity 0.4s';},2200);
  setTimeout(()=>el.remove(),2700);
}

// ═══════════════════════════════════════
// RELÓGIO — corrigido (1s interval)
// ═══════════════════════════════════════
function updateClock(){
  const el=$('clock');
  if(!el)return;
  el.textContent=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}
updateClock();
setInterval(updateClock,1000);

// ═══════════════════════════════════════
// NAVEGAÇÃO — via addEventListener, sem onclick inline
// ═══════════════════════════════════════
let navStack=['s-dashboard'];

function showScreen(id,dir){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=$(id);
  if(!el){console.error('Screen not found:',id);return;}
  el.classList.add('active');
}

function navigate(id){
  renderScreen(id);
  showScreen(id,'forward');
  if(navStack[navStack.length-1]!==id) navStack.push(id);
}

function back(){
  if(navStack.length<=1)return;
  navStack.pop();
  const prev=navStack[navStack.length-1];
  renderScreen(prev);
  showScreen(prev,'back');
}

function goHome(){
  navStack=['s-dashboard'];
  renderScreen('s-dashboard');
  showScreen('s-dashboard','back');
}

function renderScreen(id){
  if(id==='s-dashboard')       renderDashboard();
  if(id==='s-mesas')           renderMesas();
  if(id==='s-comanda')         {resetTabs();renderComanda();}
  if(id==='s-cardapio-pedido') renderCardapioLista();
  if(id==='s-relatorio')       renderRelatorio();
  if(id==='s-cardapio-mgmt')   renderMgmtCardapio();
  if(id==='s-dividir')         renderDividir();
  if(id==='s-fechar')          renderFechar();
}

// ═══════════════════════════════════════
// BIND ALL EVENTS — centralizado aqui
// ═══════════════════════════════════════
function bindEvents(){
  // Dashboard
  $('btn-mesas').addEventListener('click',()=>navigate('s-mesas'));
  $('btn-relatorio').addEventListener('click',()=>navigate('s-relatorio'));
  $('btn-cardapio').addEventListener('click',()=>navigate('s-cardapio-mgmt'));
  $('btn-novo-pedido').addEventListener('click',()=>navigate('s-mesas'));

  // Backs
  $('back-mesas').addEventListener('click',back);
  $('back-abrir').addEventListener('click',back);
  $('back-comanda').addEventListener('click',back);
  $('back-cardapio').addEventListener('click',back);
  $('back-add-item').addEventListener('click',back);
  $('back-fechar').addEventListener('click',back);
  $('back-dividir').addEventListener('click',back);
  $('back-relatorio').addEventListener('click',back);
  $('back-cardapio-mgmt').addEventListener('click',back);
  $('back-novo-item').addEventListener('click',back);

  // Filtros mesas
  $('f-todas').addEventListener('click',function(){setMesaFilter('todas',this)});
  $('f-abertas').addEventListener('click',function(){setMesaFilter('abertas',this)});
  $('f-livres').addEventListener('click',function(){setMesaFilter('livres',this)});

  // Abrir comanda
  $('btn-confirmar-abrir').addEventListener('click',confirmarAbrirComanda);

  // Comanda actions
  $('btn-add-item-top').addEventListener('click',irParaCardapio);
  $('qa-pedir').addEventListener('click',irParaCardapio);
  $('qa-dividir').addEventListener('click',()=>navigate('s-dividir'));
  $('qa-imprimir').addEventListener('click',imprimirComanda);
  $('qa-fechar').addEventListener('click',()=>navigate('s-fechar'));
  $('qa-cancelar').addEventListener('click',showCancelarSheet);

  // Tabs comanda
  $('comanda-tab-bar').addEventListener('click',function(e){
    const t=e.target.closest('.tab-item');
    if(!t)return;
    document.querySelectorAll('#comanda-tab-bar .tab-item').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('.tab-pane').forEach(x=>x.classList.remove('on'));
    t.classList.add('on');
    const pane=$('tab-'+t.dataset.tab);
    if(pane){
      pane.classList.add('on');
      if(t.dataset.tab==='resumo')    renderResumo();
      if(t.dataset.tab==='historico') renderComandaHist();
    }
  });

  // Cardápio search
  $('card-search').addEventListener('input',renderCardapioLista);
  $('cart-badge-btn').addEventListener('click',back);

  // Add item qtd
  $('qtd-minus').addEventListener('click',()=>changeAddQtd(-1));
  $('qtd-plus').addEventListener('click',()=>changeAddQtd(1));
  $('btn-confirmar-add').addEventListener('click',confirmarAddItem);

  // Fechar
  $('btn-confirmar-fechar').addEventListener('click',confirmarFecharComanda);
  $('pag-grid').addEventListener('click',function(e){
    const t=e.target.closest('.pag-tile');
    if(!t)return;
    pagSel=t.dataset.pag;
    document.querySelectorAll('.pag-tile').forEach(x=>x.classList.remove('sel'));
    t.classList.add('sel');
  });

  // Dividir
  $('div-minus').addEventListener('click',()=>{divN=Math.max(1,divN-1);renderDividir();});
  $('div-plus').addEventListener('click',()=>{divN++;renderDividir();});

  // Relatório refresh
  $('btn-refresh-rel').addEventListener('click',renderRelatorio);

  // Cardápio mgmt
  $('btn-novo-item').addEventListener('click',novoItemCardapio);

  // Salvar item
  $('btn-salvar-item').addEventListener('click',salvarItem);
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════
function renderDashboard(){
  const n=new Date();
  $('dash-date').textContent=n.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
  const h=n.getHours();
  const saudacao=h<12?'Bom dia! ☀️':h<18?'Boa tarde! 🌤️':'Boa noite! 🌙';
  const g=$('dash-greeting');
  if(g) g.innerHTML=`<em style="color:var(--gold)">${saudacao}</em>`;
  const totalArr=historico.reduce((s,h)=>s+h.total,0);
  const abertas=Object.values(mesas).filter(m=>m.status==='aberta').length;
  const ticket=historico.length?totalArr/historico.length:0;
  $('kpi-total').textContent=fmt(totalArr);
  $('kpi-cmd').textContent=`${historico.length} comanda${historico.length!==1?'s':''}`;
  $('kpi-abertas').textContent=abertas;
  $('kpi-ticket').textContent=fmt(ticket);

  const grid=$('mesas-preview-grid');
  grid.innerHTML='';
  for(let i=1;i<=N;i++){
    const m=mesas[i];
    const d=document.createElement('div');
    d.className=`mp-dot${m.status==='aberta'?' open':''}`;
    d.textContent=i;
    if(m.status==='aberta'){const v=calcTotal(i);if(v>0)d.title=`Mesa ${i} — R$ ${v.toFixed(2).replace('.',',')}`;};
    d.title=`Mesa ${i}${m.status==='aberta'?' — Aberta':''}`;
    d.addEventListener('click',()=>abrirMesa(i));
    grid.appendChild(d);
  }
}

// ═══════════════════════════════════════
// MESAS
// ═══════════════════════════════════════
function setMesaFilter(f,btn){
  mesaFilter=f;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderMesas();
}

function renderMesas(){
  const grid=$('mesas-grid');
  if(!grid)return;
  grid.innerHTML='';
  let abertas=0;
  for(let i=1;i<=N;i++){
    const m=mesas[i];
    const ab=m.status==='aberta';
    if(ab)abertas++;
    if(mesaFilter==='abertas'&&!ab)continue;
    if(mesaFilter==='livres'&&ab)continue;
    const total=calcTotal(i);
    const tile=document.createElement('div');
    tile.className=`mesa-tile${ab?' open':''}`;
    tile.innerHTML=`
      <div class="mesa-tile-top"></div>
      <div class="mesa-tile-body">
        <div class="mesa-tile-num">${String(i).padStart(2,'0')}</div>
        <div class="mesa-tile-label">Mesa</div>
        <div class="mesa-tile-status"><span class="status-dot"></span><span>${ab?'Aberta':'Livre'}</span></div>
        ${ab?`<div class="mesa-tile-total">${fmt(total)}</div>`:''}
        ${ab&&m.cliente?`<div class="mesa-tile-client">${m.cliente}</div>`:''}
      </div>`;
    tile.addEventListener('click',()=>abrirMesa(i));
    grid.appendChild(tile);
  }
  const badge=$('mesas-abertas-badge');
  if(badge)badge.textContent=`${abertas} aberta${abertas!==1?'s':''}`;
}

function abrirMesa(num){
  mesaAtual=num;
  if(mesas[num].status==='aberta'){
    navigate('s-comanda');
  }else{
    $('abrir-title').textContent=`Mesa ${String(num).padStart(2,'0')}`;
    $('abrir-hero').textContent=`Abrir Mesa ${String(num).padStart(2,'0')}`;
    $('abrir-cliente').value='';
    $('abrir-obs').value='';
    navigate('s-abrir');
  }
}

// ═══════════════════════════════════════
// ABRIR COMANDA
// ═══════════════════════════════════════
function confirmarAbrirComanda(){
  const cliente=$('abrir-cliente').value.trim();
  const obs=$('abrir-obs').value.trim();
  const now=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  mesas[mesaAtual]={...mesas[mesaAtual],status:'aberta',abertura:now,cliente,obs,pedidos:[]};
  salvarDados();
  toast(`Mesa ${mesaAtual} aberta!`,'s');
  navStack=['s-dashboard','s-mesas'];
  navigate('s-comanda');
}

// ═══════════════════════════════════════
// COMANDA
// ═══════════════════════════════════════
const sCycle=['pendente','preparando','pronto','entregue'];
const sLabel={pendente:'⏳ Pendente',preparando:'🔥 Preparando',pronto:'✅ Pronto',entregue:'🍽 Entregue'};
const sClass={pendente:'st-pendente',preparando:'st-preparando',pronto:'st-pronto',entregue:'st-entregue'};

function resetTabs(){
  document.querySelectorAll('#comanda-tab-bar .tab-item').forEach((t,i)=>t.classList.toggle('on',i===0));
  document.querySelectorAll('.tab-pane').forEach((p,i)=>p.classList.toggle('on',i===0));
}

function renderComanda(){
  if(!mesaAtual)return;
  const m=mesas[mesaAtual];
  const total=calcTotal(mesaAtual);
  const itens=totalItens(mesaAtual);
  $('comanda-title').textContent=`Mesa ${String(mesaAtual).padStart(2,'0')}`;
  $('c-mesa-num').textContent=`Mesa ${String(mesaAtual).padStart(2,'0')}`;
  $('c-mesa-sub').textContent=m.abertura?`Aberta às ${m.abertura}${m.cliente?' · '+m.cliente:''}`:'—';
  $('c-total').textContent=fmt(total);
  $('cardapio-topbar-title').textContent=`Mesa ${String(mesaAtual).padStart(2,'0')} — Cardápio`;

  const pane=$('tab-pedidos');
  pane.innerHTML='';
  if(m.pedidos.length===0){
    pane.innerHTML=`<div class="empty-pane"><div class="empty-icon">🛒</div><div class="empty-label">Nenhum pedido ainda</div><div class="empty-sub">Toque em "🍽 Pedir" para adicionar</div></div>`;
  }else{
    m.pedidos.forEach((p,idx)=>{
      const card=document.createElement('div');
      card.className='pedido-card';
      card.innerHTML=`
        <div class="pc-main">
          <div class="pc-nome">${p.nome}</div>
          ${p.obs?`<div class="pc-obs">${p.obs}</div>`:''}
          <button class="status-tag ${sClass[p.status]}" data-idx="${idx}">${sLabel[p.status]}</button>
        </div>
        <div class="pc-right">
          <div class="pc-price">${fmt(p.preco*p.qtd)}</div>
          <div class="qtd-ctrl">
            <button class="qc-btn" data-action="minus" data-idx="${idx}">−</button>
            <span class="qc-num">${p.qtd}</span>
            <button class="qc-btn" data-action="plus" data-idx="${idx}">+</button>
          </div>
          <button class="rm-item" data-action="rm" data-idx="${idx}">✕</button>
        </div>`;
      pane.appendChild(card);
    });
    // Delegação de eventos no pane
    pane.addEventListener('click',function handler(e){
      const st=e.target.closest('.status-tag[data-idx]');
      const qm=e.target.closest('[data-action="minus"]');
      const qp=e.target.closest('[data-action="plus"]');
      const rm=e.target.closest('[data-action="rm"]');
      if(st){const i=+st.dataset.idx;const p=mesas[mesaAtual].pedidos[i];p.status=sCycle[(sCycle.indexOf(p.status)+1)%sCycle.length];salvarDados();renderComanda();}
      if(qm){const i=+qm.dataset.idx;mesas[mesaAtual].pedidos[i].qtd=Math.max(1,mesas[mesaAtual].pedidos[i].qtd-1);salvarDados();renderComanda();}
      if(qp){const i=+qp.dataset.idx;mesas[mesaAtual].pedidos[i].qtd++;salvarDados();renderComanda();}
      if(rm){const i=+rm.dataset.idx;mesas[mesaAtual].pedidos.splice(i,1);salvarDados();renderComanda();toast('Item removido','i');}
    },{once:true}); // once:true pois re-renderiza sempre
  }
  const cc=$('cart-count');
  if(cc){cc.textContent=itens;cc.classList.toggle('show',itens>0);}
}

function renderResumo(){
  const m=mesas[mesaAtual];
  const pane=$('tab-resumo');
  const total=calcTotal(mesaAtual);
  if(!m||m.pedidos.length===0){pane.innerHTML=`<div class="empty-pane"><div class="empty-icon">📋</div><div class="empty-label">Sem itens</div></div>`;return;}
  const by={};
  m.pedidos.forEach(p=>{if(!by[p.status])by[p.status]=[];by[p.status].push(p);});
  let html='';
  ['pendente','preparando','pronto','entregue'].forEach(s=>{
    if(!by[s])return;
    html+=`<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--sand4);margin-bottom:8px">${sLabel[s]}</div>`;
    by[s].forEach(p=>{html+=`<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--sand2);padding:5px 0;border-bottom:1px solid var(--line)"><span>${p.qtd}× ${p.nome}${p.obs?' <em style="font-size:11px;color:var(--sand4)">('+p.obs+')</em>':''}</span><span style="font-family:'Montserrat',sans-serif;color:var(--gold)">${fmt(p.preco*p.qtd)}</span></div>`;});
    html+='</div>';
  });
  html+=`<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:12px;padding-top:12px;border-top:1px solid var(--line2)"><span style="font-family:'Montserrat',sans-serif;font-size:16px;color:var(--sand)">Total</span><span style="font-family:'Montserrat',sans-serif;font-size:28px;color:var(--gold)">${fmt(total)}</span></div>`;
  pane.innerHTML=html;
}

function renderComandaHist(){
  const pane=$('tab-historico');
  const items=historico.filter(h=>h.mesa===mesaAtual).slice().reverse();
  if(!items.length){pane.innerHTML=`<div class="empty-pane"><div class="empty-icon">📋</div><div class="empty-label">Sem histórico desta mesa</div></div>`;return;}
  pane.innerHTML=items.map(h=>`<div class="hist-entry"><div class="he-mesa">${String(h.mesa).padStart(2,'0')}</div><div class="he-info"><div class="he-client">${h.cliente||'—'} · ${h.pagamento}</div><div class="he-meta">${h.data} · ${h.itens} itens</div></div><div class="he-total">${fmt(h.total)}</div></div>`).join('');
}

function irParaCardapio(){
  if(!mesaAtual){toast('Nenhuma mesa selecionada','e');return;}
  catAtiva='Todas';
  const inp=$('card-search');
  if(inp)inp.value='';
  navigate('s-cardapio-pedido');
}

function showCancelarSheet(){
  showSheet(`
    <div class="bs-title">Cancelar Comanda</div>
    <div class="bs-sub">Todos os pedidos da Mesa ${String(mesaAtual).padStart(2,'0')} serão removidos.</div>
    <div class="bs-actions">
      <button class="bs-btn cancel" id="sh-cancel">Voltar</button>
      <button class="bs-btn danger" id="sh-confirm">Cancelar Comanda</button>
    </div>`);
  $('sh-cancel').addEventListener('click',closeSheet);
  $('sh-confirm').addEventListener('click',()=>{
    mesas[mesaAtual]={numero:mesaAtual,status:'fechada',pedidos:[],abertura:null,cliente:'',obs:''};
    salvarDados();
    closeSheet();
    toast(`Comanda da Mesa ${mesaAtual} cancelada`,'e');
    navStack=['s-dashboard','s-mesas'];
    renderScreen('s-mesas');
    showScreen('s-mesas','back');
  });
}

// ═══════════════════════════════════════
// CARDÁPIO PEDIDO
// ═══════════════════════════════════════
function renderCardapioLista(){
  if(!mesaAtual)return;
  const q=($('card-search')?.value||'').toLowerCase();
  const cats=['Todas',...new Set(CARDAPIO.map(i=>i.categoria))];
  $('cat-scroll').innerHTML=cats.map(c=>`<div class="cat-chip${c===catAtiva?' on':''}" data-cat="${c}">${c}</div>`).join('');
  // bind cat chips
  $('cat-scroll').querySelectorAll('.cat-chip').forEach(el=>{
    el.addEventListener('click',()=>{catAtiva=el.dataset.cat;renderCardapioLista();});
  });
  const items=CARDAPIO.filter(i=>(catAtiva==='Todas'||i.categoria===catAtiva)&&i.nome.toLowerCase().includes(q));
  const el=$('cardapio-items');
  if(catAtiva==='Todas'&&!q){
    const groups={};
    items.forEach(i=>{if(!groups[i.categoria])groups[i.categoria]=[];groups[i.categoria].push(i);});
    el.innerHTML=Object.entries(groups).map(([cat,list])=>`<div class="cat-header">${cat}</div>${list.map(itemTileHTML).join('')}`).join('');
  }else{
    el.innerHTML=items.length?items.map(itemTileHTML).join(''):`<div class="empty-pane"><div class="empty-icon">🔍</div><div class="empty-label">Nenhum item encontrado</div></div>`;
  }
  el.querySelectorAll('.item-tile').forEach(t=>{
    t.addEventListener('click',()=>openAddItem(+t.dataset.id));
  });
  el.querySelectorAll('.it-add').forEach(b=>{
    b.addEventListener('click',e=>{e.stopPropagation();openAddItem(+b.dataset.id);});
  });
}

function itemTileHTML(item){
  return`<div class="item-tile" data-id="${item.id}"><div class="it-info"><div class="it-nome">${item.nome}</div><div class="it-cat">${item.categoria}</div></div><div class="it-price">${fmt(item.preco)}</div><button class="it-add" data-id="${item.id}">+</button></div>`;
}

function openAddItem(id){
  itemAtual=CARDAPIO.find(i=>i.id===id);
  if(!itemAtual)return;
  addQtd=1;
  $('add-item-title').textContent=itemAtual.nome;
  $('add-item-icon').textContent={Bebidas:'🍺',Petiscos:'🍟',Pratos:'🍽',Sobremesas:'🍮'}[itemAtual.categoria]||'🍽';
  $('add-item-name').textContent=itemAtual.nome;
  $('add-item-meta').textContent=`${fmt(itemAtual.preco)} · ${itemAtual.categoria}`;
  $('add-qtd-num').textContent=addQtd;
  $('add-subtotal').textContent=fmt(itemAtual.preco*addQtd);
  $('add-obs').value='';
  navigate('s-add-item');
}

function changeAddQtd(d){
  addQtd=Math.max(1,addQtd+d);
  $('add-qtd-num').textContent=addQtd;
  $('add-subtotal').textContent=fmt(itemAtual.preco*addQtd);
}

function confirmarAddItem(){
  if(!mesaAtual||!itemAtual)return;
  const obs=$('add-obs').value.trim();
  const m=mesas[mesaAtual];
  const ex=m.pedidos.find(p=>p.itemId===itemAtual.id&&p.obs===obs);
  if(ex){ex.qtd+=addQtd;}else{m.pedidos.push({itemId:itemAtual.id,nome:itemAtual.nome,preco:itemAtual.preco,qtd:addQtd,obs,status:'pendente'});}
  salvarDados();
  toast(`${addQtd}× ${itemAtual.nome} adicionado`,'s');
  back();
}

// ═══════════════════════════════════════
// FECHAR COMANDA
// ═══════════════════════════════════════
function renderFechar(){
  if(!mesaAtual)return;
  const m=mesas[mesaAtual];
  const total=calcTotal(mesaAtual);
  const itens=totalItens(mesaAtual);
  $('pagto-total').textContent=fmt(total);
  $('pagto-sub').textContent=`${itens} itens · Mesa ${String(mesaAtual).padStart(2,'0')}${m.cliente?' · '+m.cliente:''}`;
  $('pagto-items').innerHTML=m.pedidos.map(p=>`<div class="pis-row"><span>${p.qtd}× ${p.nome}${p.obs?' ('+p.obs+')':''}</span><span style="font-family:'Montserrat',sans-serif;color:var(--gold)">${fmt(p.preco*p.qtd)}</span></div>`).join('')+`<div class="pis-row total"><span>Total</span><span style="font-family:'Montserrat',sans-serif;color:var(--gold)">${fmt(total)}</span></div>`;
  pagSel='Dinheiro';
  document.querySelectorAll('.pag-tile').forEach((t,i)=>t.classList.toggle('sel',i===0));
}

function confirmarFecharComanda(){
  const m=mesas[mesaAtual];
  const total=calcTotal(mesaAtual);
  const now=new Date();
  const reg={mesa:mesaAtual,cliente:m.cliente,data:now.toLocaleDateString('pt-BR')+' '+now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),pagamento:pagSel,total,itens:totalItens(mesaAtual),pedidos:JSON.parse(JSON.stringify(m.pedidos))};
  historico.push(reg);
  mesas[mesaAtual]={numero:mesaAtual,status:'fechada',pedidos:[],abertura:null,cliente:'',obs:''};
  salvarDados();
  toast(`Mesa ${mesaAtual} fechada · ${fmt(total)} via ${pagSel}`,'s');
  imprimirRecibo(reg);
  navStack=['s-dashboard','s-mesas'];
  renderScreen('s-mesas');
  showScreen('s-mesas','back');
}

// ═══════════════════════════════════════
// DIVIDIR
// ═══════════════════════════════════════
function renderDividir(){
  if(!mesaAtual)return;
  const total=calcTotal(mesaAtual);
  $('div-n').textContent=divN;
  $('div-por-pessoa').textContent=fmt(total/divN);
  $('div-sub-info').textContent=`÷ ${divN} pessoa${divN!==1?'s':''}`;
  const manual=$('div-manual');
  if(divN<=8&&mesas[mesaAtual].pedidos.length>0){
    let html='<div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--sand4);margin-bottom:12px">Seleção Manual por Pessoa</div>';
    for(let p=1;p<=divN;p++){
      html+=`<div class="div-person-block"><div class="dpb-head"><div class="dpb-name">Pessoa ${p}</div><div class="dpb-total" id="dpv-${p}">R$ 0,00</div></div>
      ${mesas[mesaAtual].pedidos.map((item,idx)=>`<label class="dpb-item"><input type="checkbox" data-p="${p}" data-preco="${item.preco}" data-qtd="${item.qtd}" id="dpc-${p}-${idx}"> ${item.qtd}× ${item.nome} — ${fmt(item.preco*item.qtd)}</label>`).join('')}</div>`;
    }
    manual.innerHTML=html;
    for(let p=1;p<=divN;p++){
      mesas[mesaAtual].pedidos.forEach((_,idx)=>{
        const cb=$(`dpc-${p}-${idx}`);
        if(cb)cb.addEventListener('change',()=>{
          let tot=0;
          mesas[mesaAtual].pedidos.forEach((_,i)=>{const c=$(`dpc-${p}-${i}`);if(c?.checked)tot+=+c.dataset.preco*+c.dataset.qtd;});
          const el=$(`dpv-${p}`);if(el)el.textContent=fmt(tot);
        });
      });
    }
  }else{manual.innerHTML='';}
}

// ═══════════════════════════════════════
// RELATÓRIO
// ═══════════════════════════════════════
function renderRelatorio(){
  const totalArr=historico.reduce((s,h)=>s+h.total,0);
  const totalCmd=historico.length;
  const totalIt=historico.reduce((s,h)=>s+h.itens,0);
  const ticket=totalCmd?totalArr/totalCmd:0;
  const abertas=Object.values(mesas).filter(m=>m.status==='aberta').length;
  let html=`<div class="rel-kpis">
    <div class="rel-kpi g"><div class="rel-kpi-label">Arrecadado</div><div class="rel-kpi-val">${fmt(totalArr)}</div><div class="rel-kpi-sub">${totalCmd} comanda${totalCmd!==1?'s':''}</div></div>
    <div class="rel-kpi s"><div class="rel-kpi-label">Ticket Médio</div><div class="rel-kpi-val">${fmt(ticket)}</div><div class="rel-kpi-sub">por comanda</div></div>
    <div class="rel-kpi b"><div class="rel-kpi-label">Itens Vendidos</div><div class="rel-kpi-val">${totalIt}</div><div class="rel-kpi-sub">no total</div></div>
    <div class="rel-kpi r"><div class="rel-kpi-label">Mesas Abertas</div><div class="rel-kpi-val">${abertas}</div><div class="rel-kpi-sub">agora</div></div>
  </div>`;
  const ci={};
  historico.forEach(h=>(h.pedidos||[]).forEach(p=>{if(!ci[p.nome])ci[p.nome]=0;ci[p.nome]+=p.qtd;}));
  const top=Object.entries(ci).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const mx=top[0]?.[1]||1;
  html+=`<div class="rel-block"><div class="rel-block-title">🏆 Itens Mais Vendidos</div>${top.length?top.map(([nome,q],i)=>`<div class="rank-item"><span class="ri-n">${i+1}</span><span class="ri-nome">${nome}</span><div class="ri-bar-wrap"><div class="ri-bar" style="width:${q/mx*100}%"></div></div><span class="ri-qty">${q}×</span></div>`).join(''):`<div style="font-size:12px;color:var(--sand4);padding:8px 0">Nenhum dado ainda</div>`}</div>`;
  const cp={};
  historico.forEach(h=>{if(!cp[h.pagamento])cp[h.pagamento]={total:0,count:0};cp[h.pagamento].total+=h.total;cp[h.pagamento].count++;});
  const pi={Dinheiro:'💵','Cartão Crédito':'💳','Cartão Débito':'🏧',Pix:'📱'};
  html+=`<div class="rel-block"><div class="rel-block-title">💳 Formas de Pagamento</div>${Object.keys(cp).length?Object.entries(cp).sort((a,b)=>b[1].total-a[1].total).map(([pag,d])=>`<div class="pag-stat-row"><span class="psr-name">${pi[pag]||'•'} ${pag} <span style="font-size:11px;color:var(--sand4)">(${d.count}×)</span></span><span class="psr-val">${fmt(d.total)}</span></div>`).join(''):`<div style="font-size:12px;color:var(--sand4);padding:8px 0">Nenhum dado ainda</div>`}</div>`;
  html+=`<div class="rel-block"><div class="rel-block-title">📋 Histórico de Comandas</div>${historico.length?historico.slice().reverse().map(h=>`<div class="hist-entry"><div class="he-mesa">${String(h.mesa).padStart(2,'0')}</div><div class="he-info"><div class="he-client">${h.cliente||'—'} · ${h.pagamento}</div><div class="he-meta">${h.data} · ${h.itens} itens</div></div><div class="he-total">${fmt(h.total)}</div></div>`).join(''):`<div style="font-size:12px;color:var(--sand4);padding:8px 0">Nenhuma comanda fechada ainda</div>`}</div>`;
  $('rel-body').innerHTML=html;
}

// ═══════════════════════════════════════
// GERENCIAR CARDÁPIO
// ═══════════════════════════════════════
const cpClass={Bebidas:'cp-bebidas',Petiscos:'cp-petiscos',Pratos:'cp-pratos',Sobremesas:'cp-sobremesas'};
function renderMgmtCardapio(){
  const body=$('mgmt-body');
  body.innerHTML=CARDAPIO.map(item=>`
    <div class="mgmt-item">
      <div class="mi-info"><div class="mi-nome">${item.nome}</div><div class="mi-meta">${item.categoria}</div></div>
      <span class="cat-pill ${cpClass[item.categoria]||''}">${item.categoria}</span>
      <div class="mi-price">${fmt(item.preco)}</div>
      <div class="mi-actions">
        <button class="mi-btn ed" data-action="edit" data-id="${item.id}">Editar</button>
        <button class="mi-btn dl" data-action="del" data-id="${item.id}">Excluir</button>
      </div>
    </div>`).join('');
  body.addEventListener('click',function handler(e){
    const ed=e.target.closest('[data-action="edit"]');
    const dl=e.target.closest('[data-action="del"]');
    if(ed)editarItem(+ed.dataset.id);
    if(dl)confirmarDelItem(+dl.dataset.id);
  },{once:true});
}

function novoItemCardapio(){
  editItemId=null;
  $('novo-item-title').textContent='Novo Item';
  $('ni-hero').textContent='Cadastrar Novo Item';
  $('ni-nome').value='';$('ni-cat').value='Bebidas';$('ni-preco').value='';
  navigate('s-novo-item');
}

function editarItem(id){
  const item=CARDAPIO.find(i=>i.id===id);
  if(!item)return;
  editItemId=id;
  $('novo-item-title').textContent='Editar Item';
  $('ni-hero').textContent=`Editar "${item.nome}"`;
  $('ni-nome').value=item.nome;$('ni-cat').value=item.categoria;$('ni-preco').value=item.preco;
  navigate('s-novo-item');
}

function salvarItem(){
  const nome=$('ni-nome').value.trim();
  const cat=$('ni-cat').value;
  const preco=parseFloat($('ni-preco').value);
  if(!nome||!preco||preco<=0){toast('Preencha todos os campos!','e');return;}
  if(editItemId){
    const item=CARDAPIO.find(i=>i.id===editItemId);
    if(item){item.nome=nome;item.categoria=cat;item.preco=preco;}
    toast(`"${nome}" atualizado!`,'s');editItemId=null;
  }else{
    CARDAPIO.push({id:nextId++,nome,preco,categoria:cat});
    toast(`"${nome}" adicionado!`,'s');
  }
  salvarDados();
  back();
}

function confirmarDelItem(id){
  const item=CARDAPIO.find(i=>i.id===id);
  if(!item)return;
  showSheet(`
    <div class="bs-title">Excluir Item</div>
    <div class="bs-sub">Remover <strong style="color:var(--sand)">${item.nome}</strong> do cardápio?</div>
    <div class="bs-actions">
      <button class="bs-btn cancel" id="sh-cancel">Cancelar</button>
      <button class="bs-btn danger" id="sh-confirm">Excluir</button>
    </div>`);
  $('sh-cancel').addEventListener('click',closeSheet);
  $('sh-confirm').addEventListener('click',()=>{CARDAPIO=CARDAPIO.filter(i=>i.id!==id);salvarDados();closeSheet();renderMgmtCardapio();toast('Item excluído','e');});
}

// ═══════════════════════════════════════
// IMPRESSÃO
// ═══════════════════════════════════════
function imprimirComanda(){
  if(!mesaAtual)return;
  const m=mesas[mesaAtual],total=calcTotal(mesaAtual);
  const now=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const date=new Date().toLocaleDateString('pt-BR');
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{margin:4mm;size:80mm auto}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Courier New',monospace;font-size:11px;width:72mm;color:#000;background:#fff}.center{text-align:center}.line{border-top:1px dashed #000;margin:4px 0}.logo{font-size:18px;font-weight:bold;letter-spacing:2px}.mesa{font-size:15px;font-weight:bold;margin:4px 0}.row{display:flex;justify-content:space-between;margin:2px 0}.obs{font-size:10px;color:#555;padding-left:8px}.total{font-weight:bold;font-size:13px}</style></head><body><div class="center"><div class="logo">★ RANCHO MENININHO ★</div><div>Sistema de Comandas</div></div><div class="line"></div><div class="center"><div class="mesa">MESA ${String(mesaAtual).padStart(2,'0')}</div>${m.cliente?'<div>Cliente: <strong>'+m.cliente+'</strong></div>':''}<div>Abertura: ${m.abertura||'--'} | Impressão: ${now}</div><div>${date}</div></div><div class="line"></div><strong>PEDIDOS</strong><br>${m.pedidos.map(p=>`<div class="row"><span>${p.qtd}x ${p.nome}</span><span>R$ ${(p.preco*p.qtd).toFixed(2).replace('.',',')}</span></div>${p.obs?'<div class="obs">↳ '+p.obs+'</div>':''}`).join('')}<div class="line"></div><div class="row total"><span>TOTAL</span><span>R$ ${total.toFixed(2).replace('.',',')}</span></div><div class="line"></div><div class="center" style="font-size:10px;margin-top:8px">★ Obrigado pela preferência ★</div><\/body><\/html>`;
  const w=window.open('','_blank','width=340,height=600');
  if(!w){toast('Permita pop-ups para imprimir!','e');return;}
  w.document.write(html);w.document.close();w.onload=()=>{w.focus();w.print();};
  toast('Comanda enviada para impressão!','s');
}

function imprimirRecibo(h){
  if(!h)return;
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{margin:4mm;size:80mm auto}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Courier New',monospace;font-size:11px;width:72mm;color:#000;background:#fff}.center{text-align:center}.line{border-top:1px dashed #000;margin:4px 0}.logo{font-size:18px;font-weight:bold}.mesa{font-size:15px;font-weight:bold;margin:4px 0}.row{display:flex;justify-content:space-between;margin:2px 0}.total{font-weight:bold;font-size:14px}.pag{border:1px solid #000;padding:4px 8px;text-align:center;margin:6px 0;font-weight:bold;font-size:13px}</style></head><body><div class="center"><div class="logo">★ RANCHO MENININHO ★</div><div>RECIBO DE PAGAMENTO</div></div><div class="line"></div><div class="center"><div class="mesa">MESA ${String(h.mesa).padStart(2,'0')}</div>${h.cliente?'<div>Cliente: <strong>'+h.cliente+'</strong></div>':''}<div>${h.data}</div></div><div class="line"></div>${(h.pedidos||[]).map(p=>`<div class="row"><span>${p.qtd}x ${p.nome}</span><span>R$ ${(p.preco*p.qtd).toFixed(2).replace('.',',')}</span></div>${p.obs?'<div style="font-size:10px;padding-left:8px">↳ '+p.obs+'</div>':''}`).join('')}<div class="line"></div><div class="row total"><span>TOTAL PAGO</span><span>R$ ${h.total.toFixed(2).replace('.',',')}</span></div><div class="pag">💳 ${h.pagamento}</div><div class="line"></div><div class="center" style="font-size:10px;margin-top:8px">★ Obrigado pela preferência ★</div><\/body><\/html>`;
  const w=window.open('','_blank','width=340,height=600');
  if(!w)return;
  w.document.write(html);w.document.close();w.onload=()=>{w.focus();w.print();};
}

// ═══════════════════════════════════════
// SHEET
// ═══════════════════════════════════════
function showSheet(html){
  const ov=document.createElement('div');
  ov.className='overlay';ov.id='sheet-ov';
  ov.addEventListener('click',e=>{if(e.target===ov)closeSheet();});
  ov.innerHTML=`<div class="bottom-sheet"><div class="bs-handle"></div>${html}</div>`;
  document.body.appendChild(ov);
}
function closeSheet(){$('sheet-ov')?.remove();}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
carregarDados();
bindEvents();
renderDashboard();
showScreen('s-dashboard');
}); // DOMContentLoaded
