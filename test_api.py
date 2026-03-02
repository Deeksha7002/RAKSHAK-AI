import urllib.request, json
req = urllib.request.Request('https://scam-defender-honeypot-1.onrender.com/api/analyze', method='POST')
req.add_header('X-Rakshak-Token', 'rakshak-core-v1')
req.add_header('Content-Type', 'application/json')
try:
    urllib.request.urlopen(req, data=b'{"text":"hello"}')
except urllib.error.HTTPError as e:
    print('ERROR:', e.code, e.read().decode())
