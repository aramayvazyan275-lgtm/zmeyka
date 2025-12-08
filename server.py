#!/usr/bin/env python3
import http.server
import socketserver
from pathlib import Path

PORT = 8000
DIRECTORY = "/workspace"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Добавляем CORS заголовки для тестирования SDK
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Сервер запущен на порту {PORT}")
        print(f"Директория: {DIRECTORY}")
        print("Для доступа к игре откройте: http://localhost:8000/yandex_game.html")
        httpd.serve_forever()