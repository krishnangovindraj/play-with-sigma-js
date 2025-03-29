
from http.server import HTTPServer, SimpleHTTPRequestHandler # Python 3

class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_my_headers()
        SimpleHTTPRequestHandler.end_headers(self)

    def send_my_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")


if __name__ == '__main__':
    from sys import argv
    port =int(argv[1]) if len(argv) > 1 else 8080
    print("Serving on port: ", port)
    server_address = ('', port)
    httpd = HTTPServer(server_address, MyHTTPRequestHandler)
    httpd.serve_forever()