import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "your_gemini_api_key_here":
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    if not model:
        return jsonify({"error": "Gemini API key not configured."}), 500
        
    data = request.json
    user_message = data.get('message', '')
    skin_tone = data.get('skin_tone', 'unknown')
    
    system_prompt = f"""You are a professional beauty consultant. 
The user's skin tone is detected as: {skin_tone}. 
Recommend suitable makeup products based on their skin tone, preferences, and occasion. 
Keep your response concise, helpful, and in a friendly tone. Limit to 3-4 sentences."""

    prompt = f"{system_prompt}\n\nUser: {user_message}\nConsultant:"
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.5,
                top_p=0.9,
            )
        )
        return jsonify({"reply": response.text})
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=3000, debug=True)
