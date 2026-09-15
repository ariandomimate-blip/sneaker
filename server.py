import os,json
from flask import Flask,send_from_directory,jsonify
from cryptomus import register_cryptomus
app=Flask(__name__,static_folder='.',static_url_path='')
with open('products.json',encoding='utf-8') as f: raw=json.load(f); CATALOG={str(p['id']):p for p in raw['products']}
register_cryptomus(app,CATALOG)
@app.get('/')
def index():return send_from_directory('.','index.html')
@app.get('/api/health')
def health():return jsonify(ok=True,service='sneaker',cryptomus=bool(os.getenv('CRYPTOMUS_MERCHANT_ID') and os.getenv('CRYPTOMUS_PAYMENT_API_KEY')))
@app.route('/<path:path>')
def static_files(path):return send_from_directory('.',path)
if __name__=='__main__':app.run(host='0.0.0.0',port=int(os.getenv('PORT','5000')))
