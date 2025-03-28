#!/usr/bin/env python

import asyncio
import websockets
import os
import json
import logging
from image_search import ImageSearchService
from dotenv import load_dotenv
from openai import OpenAI
from typing import Optional, Dict, Any

# Konfiguriere Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lade Umgebungsvariablen
logger.info("Lade Umgebungsvariablen...")
load_dotenv()
logger.info("Umgebungsvariablen geladen")

# OpenAI Konfiguration
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError("OPENAI_API_KEY nicht gefunden in .env Datei")
logger.info("OpenAI API Key geladen")

image_search = ImageSearchService()

def get_chatgpt_response(message: str) -> str:
    """
    Sendet eine Nachricht an ChatGPT und gibt die Antwort zurück.
    
    Args:
        message: Die Benutzernachricht
        
    Returns:
        str: Die Antwort von ChatGPT oder eine Fehlermeldung
    """
    try:
        client = OpenAI(api_key=api_key)
        model = client.models.retrieve("gpt-4o-mini")
        response = client.chat.completions.create(
            model=model.id,
            messages=[
                {"role": "user", "content": message}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Fehler bei ChatGPT-Anfrage: {str(e)}")
        return "Kappa! Da ist etwas schiefgelaufen! Fehler bei der ChatGPT-Anfrage."

async def handle_message(message: str, websocket: websockets.WebSocketServerProtocol) -> None:
    """
    Verarbeitet eine eingehende Nachricht und sendet die Antwort zurück.
    
    Args:
        message: Die eingehende Nachricht
        websocket: Die WebSocket-Verbindung
    """
    logger.info(f"Received message: {message}")
    
    try:
        # Prüfe, ob es sich um eine Bildersuche handelt
        if message.startswith("/image "):
            search_query = message[7:]  # Entferne "/image " vom Anfang
            logger.info(f"Suche nach Bildern für: {search_query}")
            
            image_url = image_search.search_image(search_query)
            logger.info(f"Gefundene Bild-URL: {image_url}")
            
            if image_url:
                response = {
                    "type": "image",
                    "url": image_url,
                    "query": search_query
                }
                logger.info(f"Sende Antwort: {response}")
                await websocket.send(json.dumps(response))
            else:
                error_response = {
                    "type": "error",
                    "message": "Keine Bilder gefunden"
                }
                logger.warning(f"Sende Fehler: {error_response}")
                await websocket.send(json.dumps(error_response))
        else:
            # ChatGPT Antwort für normale Nachrichten
            logger.info(f"Frage ChatGPT nach Antwort für: {message}")
            try:
                chatgpt_response = get_chatgpt_response(message)
                logger.info(f"ChatGPT Antwort: {chatgpt_response}")
                await websocket.send(chatgpt_response)
            except Exception as e:
                logger.error(f"Fehler bei der ChatGPT-Verarbeitung: {str(e)}")
                error_response = {
                    "type": "error",
                    "message": "Fehler bei der Verarbeitung der Nachricht"
                }
                await websocket.send(json.dumps(error_response))
        
        await websocket.send("[END]")
    except Exception as e:
        logger.error(f"Fehler bei der Verarbeitung: {str(e)}")
        await websocket.send(json.dumps({
            "type": "error",
            "message": f"Fehler bei der Verarbeitung: {str(e)}"
        }))
        await websocket.send("[END]")

async def echo(websocket: websockets.WebSocketServerProtocol) -> None:
    """
    Hauptfunktion für die WebSocket-Verbindung.
    
    Args:
        websocket: Die WebSocket-Verbindung
    """
    logger.info("Neue WebSocket-Verbindung hergestellt")
    try:
        async for message in websocket:
            await handle_message(message, websocket)
    except websockets.exceptions.ConnectionClosed:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"Error: {e}")

async def main() -> None:
    """Startet den WebSocket-Server."""
    logger.info("WebSocket server starting")
    
    try:
        async with websockets.serve(
            echo,
            "0.0.0.0",
            int(os.environ.get('PORT', 8090))
        ) as server:
            logger.info("WebSocket server running on port 8090")
            await asyncio.Future()  # run forever
    except Exception as e:
        logger.error(f"Fehler beim Starten des Servers: {str(e)}")
        raise

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server wird beendet...")
    except Exception as e:
        logger.error(f"Unerwarteter Fehler: {str(e)}")