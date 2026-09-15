import os,json
from flask import Flask,send_from_directory,jsonify
app=Flask(__name__,static_folder='.',static_url_path='')
@app.get('/')
def index():return send_from_directory('.','index.html')
@app.get('/api/health')
def health():return jsonify(ok=True,service='sneaker',cryptomus=False)
@app.route('/<path:path>')
def static_files(path):return send_from_directory('.',path)
if __name__=='__main__':app.run(host='0.0.0.0',port=int(os.getenv('PORT','5000')))
