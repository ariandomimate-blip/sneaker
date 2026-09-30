import os,json,requests

# SECURITY HARDENING
from collections import defaultdict, deque
from time import monotonic
_SEC_RATE=defaultdict(deque)
@app.before_request
def _sec_before():
    if request.content_length and request.content_length > 1048576: return jsonify(error="Request too large."),413
    if request.path in {"/.env","/.git/config","/server.py","/app.py","/main.py","/package.json","/requirements.txt","/render.yaml","/Procfile"} or request.path.startswith("/.git/") or request.path.startswith("/.env"): return jsonify(error="Not Found."),404
    q=_SEC_RATE[request.remote_addr or "unknown"]; now=monotonic()
    while q and now-q[0]>60:q.popleft()
    if len(q)>=(30 if request.method in {"POST","PUT","PATCH","DELETE"} else 120): return jsonify(error="Too many requests. Please try again later."),429
    q.append(now)
@app.after_request
def _sec_headers(response):
    response.headers.setdefault("X-Content-Type-Options","nosniff")
    response.headers.setdefault("X-Frame-Options","DENY")
    response.headers.setdefault("Referrer-Policy","strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy","camera=(), microphone=(), geolocation=()")
    response.headers.setdefault("Cross-Origin-Opener-Policy","same-origin")
    response.headers.setdefault("Strict-Transport-Security","max-age=31536000; includeSubDomains")
    if request.path.startswith("/api/"): response.headers["Cache-Control"]="no-store"
    response.headers.pop("Server",None)
    return response
from flask import Flask,send_from_directory,jsonify,request
app=Flask(__name__,static_folder='.',static_url_path='')
PRODUCTS={p['id']:p for p in json.load(open('products.json',encoding='utf-8')).get('products',[])}
@app.get('/')
def index():return send_from_directory('.','index.html')
@app.get('/api/health')
def health():return jsonify(ok=True,service='sneaker',telegram=bool(os.getenv('TELEGRAM_BOT_TOKEN') and os.getenv('TELEGRAM_ADMIN_CHAT_ID')))
@app.post('/api/telegram-order')
def telegram_order():
    data=request.get_json(silent=True) or {};customer=data.get('customer') or {};items=data.get('items') or []
    if not customer.get('name') or not customer.get('email') or '@' not in customer.get('email','') or not customer.get('address') or not items:return jsonify(error='Bitte Name, E-Mail, Anschrift und Warenkorb angeben.'),400
    normalized=[];total=0.0
    for item in items:
        p=PRODUCTS.get(str(item.get('id')))
        try:qty=int(item.get('qty',0))
        except (TypeError,ValueError):qty=0
        if not p or qty<1 or qty>99:return jsonify(error='Produkt oder Menge ungültig.'),400
        price=float(p.get('price',0));normalized.append((p.get('name','Produkt'),qty,price));total+=price*qty
    order_no=f'SN-{__import__("time").time_ns()//1000000}'
    lines='\n'.join(f'{name} · {qty} × {price:.2f} €' for name,qty,price in normalized)
    text=f'🛒 Neue Bestellung · SNEAKER STORE\n\nBestellnummer: {order_no}\nName: {customer["name"]}\nE-Mail: {customer["email"]}\nAnschrift: {customer["address"]}\n\nBestellinformationen:\n{lines}\n\nGesamt: {total:.2f} €'
    token=os.getenv('TELEGRAM_BOT_TOKEN','').strip();chat_id=os.getenv('TELEGRAM_ADMIN_CHAT_ID','').strip()
    if not token or not chat_id:return jsonify(error='Telegram-Bestellbot ist auf dem Server noch nicht konfiguriert.'),503
    try:
        r=requests.post(f'https://api.telegram.org/bot{token}/sendMessage',json={'chat_id':chat_id,'text':text},timeout=15);result=r.json()
        if not r.ok or not result.get('ok'):raise RuntimeError(result.get('description','Telegram-Fehler'))
    except Exception as exc:
        app.logger.exception('Telegram order send failed: %s',exc);return jsonify(error='Bestellung konnte nicht an Telegram gesendet werden.'),502
    username=os.getenv('TELEGRAM_BOT_USERNAME','').strip().lstrip('@')
    return jsonify(ok=True,order_number=order_no,telegram_url=f'https://t.me/{username}?start={order_no}' if username else None),201
@app.route('/<path:path>')
def static_files(path):return send_from_directory('.',path)
if __name__=='__main__':app.run(host='0.0.0.0',port=int(os.getenv('PORT','5000')))
