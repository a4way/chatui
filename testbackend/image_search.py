import os
import requests
from typing import Optional
from dotenv import load_dotenv

# Lade Umgebungsvariablen aus .env Datei
load_dotenv()

class ImageSearchService:
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_API_KEY')
        self.search_engine_id = os.getenv('GOOGLE_SEARCH_ENGINE_ID')
        self.base_url = "https://www.googleapis.com/customsearch/v1"
        print(f"Initialisiere ImageSearchService mit API Key: {self.api_key[:10]}... und Search Engine ID: {self.search_engine_id}", flush=True)

    def search_image(self, query: str) -> Optional[str]:
        """
        Führt eine Google-Bildersuche durch und gibt die URL des ersten Bildes zurück
        """
        if not self.api_key or not self.search_engine_id:
            print("Fehler: API Key oder Search Engine ID fehlt", flush=True)
            raise ValueError("Google API Key und Search Engine ID müssen in den Umgebungsvariablen gesetzt sein")

        params = {
            'key': self.api_key,
            'cx': self.search_engine_id,
            'q': query,
            'searchType': 'image',
            'num': 1
        }
        
        print(f"Sende API-Anfrage mit Parametern: {params}", flush=True)

        try:
            response = requests.get(self.base_url, params=params)
            print(f"API-Antwort Status: {response.status_code}", flush=True)
            print(f"API-Antwort: {response.text[:200]}...", flush=True)
            
            response.raise_for_status()
            data = response.json()

            if 'items' in data and len(data['items']) > 0:
                image_url = data['items'][0]['link']
                print(f"Gefundene Bild-URL: {image_url}", flush=True)
                return image_url
            else:
                print("Keine Bilder in der API-Antwort gefunden", flush=True)
                return None

        except requests.exceptions.RequestException as e:
            print(f"Fehler bei der API-Anfrage: {str(e)}", flush=True)
            return None
        except Exception as e:
            print(f"Unerwarteter Fehler: {str(e)}", flush=True)
            return None 