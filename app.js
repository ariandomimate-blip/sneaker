let PRODUCTS=[];let cart=[];try{const saved=JSON.parse(localStorage.getItem('sneaker-cart')||'[]');cart=Array.isArray(saved)?saved:[]}catch{localStorage.removeItem('sneaker-cart')}let activeCategory='all';
const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n);const products=document.getElementById('products');
async function load(){try{const r=await fetch('products.json');const data=await r.json();PRODUCTS=data.products;render()}catch(e){products.innerHTML='<p>Produktkatalog konnte nicht geladen werden.</p>'}}
function render(){const q=(document.getElementById('search').value||'').toLowerCase();let list=PRODUCTS.filter(p=>(activeCategory==='all'||p.category===activeCategory)&&(p.name+' '+p.description+' '+p.category).toLowerCase().includes(q));products.innerHTML=list.map(p=>`<article class="card"><button class="productlink" onclick="details('${p.id}')"><div class="pic">${p.image?`<img src="${p.image}" alt="${p.name}" onerror="this.remove();this.parentElement.classList.add('fallback')">`:''}<span>${p.name.split(' ')[0].toUpperCase()}</span></div></button><div class="info"><p class="tag">${p.category.toUpperCase()}</p><h3>${p.name}</h3><p>${p.description}</p><span class="price">${euro(p.price)}</span><button class="add" onclick="details('${p.id}')">GRÖSSE WÄHLEN</button></div></article>`).join('')||'<p class="empty">Keine Produkte gefunden.</p>'}
function details(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;document.getElementById('modalContent').innerHTML=`<div class="detail"><div class="detailpic">${p.image?`<img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">`:''}<span>${p.name.split(' ')[0].toUpperCase()}</span></div><div><p class="eyebrow">${p.category.toUpperCase()}</p><h2>${p.name}</h2><p>${p.description}</p><strong class="detailprice">${euro(p.price)}</strong><label>Größe<select id="size">${p.sizes.map(s=>`<option>${s}</option>`).join('')}</select></label><button class="btn" onclick="add('${p.id}',document.getElementById('size').value);closeModal()">IN DEN WARENKORB</button></div></div>`;document.getElementById('modal').classList.add('show')}
function closeModal(){document.getElementById('modal').classList.remove('show')}
function add(id,size){
 const p=PRODUCTS.find(x=>x.id===id);if(!p)return;
 const selected=String(size||'').trim();
 if(!selected||!p.sizes.map(String).includes(selected)){alert('Bitte zuerst eine verfügbare Größe auswählen.');details(id);return}
 const x=cart.find(i=>i.id===id&&String(i.size)===selected);
 if(x)x.qty=Math.min(99,(Number(x.qty)||0)+1);else cart.push({id,qty:1,size:selected});
 save();openCart()
}
function save(){localStorage.setItem('sneaker-cart',JSON.stringify(cart));renderCart()}
function renderCart(){document.getElementById('cartCount').textContent=cart.reduce((a,x)=>a+(Number(x.qty)||0),0);document.getElementById('cartItems').innerHTML=cart.map(x=>{const p=PRODUCTS.find(y=>y.id===x.id);return p?`<div class="line"><span>${p.name} · Größe ${x.size||'bitte neu auswählen'} × ${x.qty}</span><b>${euro(p.price*x.qty)}</b></div>`:''}).join('')||'<p class="empty">Dein Warenkorb ist leer.</p>';document.getElementById('total').textContent=euro(cart.reduce((a,x)=>{const p=PRODUCTS.find(y=>y.id===x.id);return a+(p?p.price*(Number(x.qty)||0):0)},0))}
function openCart(){document.getElementById('drawer').classList.add('open')}document.getElementById('cartOpen').onclick=openCart;document.getElementById('cartClose').onclick=()=>document.getElementById('drawer').classList.remove('open');document.getElementById('modalClose').onclick=closeModal;document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')closeModal()};document.getElementById('search').oninput=render;document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.classList.remove('active'));b.classList.add('active');render()});
document.getElementById('checkout').onclick=()=>{if(!cart.length)return alert('Dein Warenkorb ist leer.');openTelegramCheckout()};
function openTelegramCheckout(){
  let box=document.getElementById('telegramCheckout');
  if(!box){box=document.createElement('div');box.id='telegramCheckout';box.className='modal show';box.innerHTML=`<div class="modalbox"><button class="modalclose" id="telegramCheckoutClose">×</button><p class="eyebrow">TELEGRAM BESTELLUNG</p><h2>Bestellung abschließen</h2><form id="telegramCheckoutForm"><input name="name" placeholder="Vollständiger Name" required><input name="email" type="email" placeholder="E-Mail-Adresse" required><textarea name="address" placeholder="Lieferadresse / Anschrift" rows="4" required></textarea><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" required> Ich akzeptiere die Bestell- und Datenschutzhinweise.</label><button class="btn" type="submit">BESTELLUNG AN TELEGRAM SENDEN</button><p id="telegramCheckoutResult"></p></form></div>`;document.body.appendChild(box);document.getElementById('telegramCheckoutClose').onclick=()=>box.remove();document.getElementById('telegramCheckoutForm').onsubmit=submitTelegramOrder}
}
async function submitTelegramOrder(e){
 e.preventDefault();const form=e.target,fd=new FormData(form);
 const lines=cart.map(x=>{const p=PRODUCTS.find(y=>y.id===x.id);return p?`• ${p.name} · Größe ${x.size} · ${x.qty} × ${euro(p.price)} = ${euro(p.price*x.qty)}`:''}).filter(Boolean);
 const total=cart.reduce((sum,x)=>{const p=PRODUCTS.find(y=>y.id===x.id);return sum+(p?p.price*(Number(x.qty)||0):0)},0);
 const summary=[ 'SNEAKER STORE · BESTELLENTWURF', 'Name: '+String(fd.get('name')||'').trim(), 'E-Mail: '+String(fd.get('email')||'').trim(), 'Anschrift: '+String(fd.get('address')||'').trim(), '', ...lines, '', 'Gesamt: '+euro(total), '', 'Hinweis: Noch nicht online übermittelt – Zahlungs- und Bestellkanal ist noch nicht verbunden.' ].join('\n');
 localStorage.setItem('sneaker-last-order-draft',summary);
 const result=document.getElementById('telegramCheckoutResult');
 result.textContent='Bestellentwurf erstellt. Der Shop hat derzeit noch keinen verbundenen Bestell- oder Zahlungsdienst. Du kannst die Zusammenfassung kopieren; es wurde keine Bestellung versendet.';
 let copy=document.getElementById('copySneakerOrder');
 if(!copy){copy=document.createElement('button');copy.id='copySneakerOrder';copy.type='button';copy.className='btn';copy.textContent='BESTELLENTWURF KOPIEREN';result.insertAdjacentElement('afterend',copy)}
 copy.onclick=async()=>{try{await navigator.clipboard.writeText(summary);copy.textContent='KOPIERT ✓'}catch{copy.textContent='Kopieren nicht verfügbar'}};
}
load();renderCart();
