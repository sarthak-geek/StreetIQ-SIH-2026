from flask import Flask,render_template
app = Flask(__name__)

@app.route('/')
def index():
    return render_template(r"C:\Users\samar\OneDrive\Desktop\SIH-2026\digital-twin-dashboard\street-iq-digital-twin\frontend\src\App.jsx")

if __name__ == '__main__':
    app.run(debug=True)