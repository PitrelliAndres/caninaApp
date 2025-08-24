#!/usr/bin/env python3
"""
Script para crear match entre usuarios de prueba
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User
from app.models.match import Match

def create_test_match():
    """Crear match entre usuarios de prueba"""
    app = create_app()
    
    with app.app_context():
        # Buscar usuarios por email
        user1 = User.query.filter_by(email='andiyp9@gmail.com').first()
        user2 = User.query.filter_by(email='pitrelliandres@gmail.com').first()
        
        if not user1:
            print("[ERROR] Usuario andiyp9@gmail.com no encontrado")
            return False
            
        if not user2:
            print("[ERROR] Usuario pitrelliandres@gmail.com no encontrado")
            return False
            
        print(f"[OK] Usuario 1 encontrado: {user1.name} (ID: {user1.id})")
        print(f"[OK] Usuario 2 encontrado: {user2.name} (ID: {user2.id})")
        
        # Crear match mutuo
        try:
            # Match de user1 hacia user2
            result1 = Match.create_match(
                user_id=user1.id,
                matched_user_id=user2.id,
                match_type='manual'
            )
            
            # Match de user2 hacia user1
            result2 = Match.create_match(
                user_id=user2.id,
                matched_user_id=user1.id,
                match_type='manual'
            )
            
            db.session.commit()
            
            # Manejar resultados que pueden tener 2 o 3 elementos
            match1 = result1[0] if result1 else None
            created1 = result1[1] if len(result1) > 1 else False
            conversation1 = result1[2] if len(result1) > 2 else None
            
            match2 = result2[0] if result2 else None
            created2 = result2[1] if len(result2) > 1 else False
            conversation2 = result2[2] if len(result2) > 2 else None
            
            print(f"[SUCCESS] Match creado entre {user1.name} y {user2.name}")
            if match1:
                print(f"   Match 1: {'Nuevo' if created1 else 'Existente'} - Mutuo: {match1.is_mutual}")
            if match2:
                print(f"   Match 2: {'Nuevo' if created2 else 'Existente'} - Mutuo: {match2.is_mutual}")
            
            if conversation1 or conversation2:
                conv = conversation1 or conversation2
                print(f"   Conversación creada: ID {conv.id}")
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Error creando match: {str(e)}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    success = create_test_match()
    sys.exit(0 if success else 1)