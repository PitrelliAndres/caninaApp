"""
Manejo de uploads de archivos (versión simplificada)
"""
import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app
import base64
from io import BytesIO

def save_base64_image(base64_data, folder='avatars'):
    """Guardar imagen desde base64"""
    try:
        # Remover prefijo data:image/xxx;base64,
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        
        # Decodificar
        image_data = base64.b64decode(base64_data)
        
        # Generar nombre único
        filename = f"{uuid.uuid4()}.png"
        upload_folder = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), folder)
        
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        filepath = os.path.join(upload_folder, filename)
        
        # Guardar archivo
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        # Retornar URL relativa
        return f"/uploads/{folder}/{filename}"
        
    except Exception as e:
        current_app.logger.error(f"Error saving image: {str(e)}")
        return None

def delete_file(filepath):
    """Eliminar archivo del servidor"""
    try:
        if filepath and filepath.startswith('/uploads/'):
            # Convertir URL relativa a path absoluto
            rel_path = filepath.replace('/uploads/', '')
            full_path = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), rel_path)
            
            if os.path.exists(full_path):
                os.remove(full_path)
                return True
    except Exception as e:
        current_app.logger.error(f"Error deleting file: {str(e)}")
    return False
