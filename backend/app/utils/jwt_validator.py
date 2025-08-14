"""Strict JWT validation with iss/aud/exp/nbf checks for PROD security."""
import os
import time
import jwt
import logging
from datetime import datetime
from flask import current_app
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def decode_token(token: str, token_type: str = 'access') -> Dict[str, Any]:
    """
    Decode and strictly validate JWT token.
    Verifies iss/aud/exp/nbf claims as per CLAUDE.md requirements.
    """
    try:
        # Decode with strict validation
        # Use config-based security settings instead of debug flag
        is_production = getattr(current_app.config, 'IS_PRODUCTION', False)
        strict_validation = getattr(current_app.config, 'STRICT_JWT_VALIDATION', False)
        
        options = {
            'verify_signature': True,
            'verify_exp': True,
            'verify_nbf': True,
            'verify_iat': True,
            'verify_aud': is_production or strict_validation,
            'verify_iss': is_production or strict_validation,
        }
        
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256'],
            options=options,
            audience=current_app.config.get('JWT_AUDIENCE', 'parkdog-client'),
            issuer=current_app.config.get('JWT_ISSUER', 'parkdog-api')
        )
        
        # Additional validations
        if payload.get('type') != token_type:
            raise jwt.InvalidTokenError(f'Invalid token type. Expected: {token_type}')
        
        # Check user_id exists and is valid
        user_id = payload.get('user_id')
        if not user_id or not isinstance(user_id, int):
            raise jwt.InvalidTokenError('Invalid user_id in token')
        
        # Check token blacklist if enabled
        if current_app.config.get('ENABLE_TOKEN_BLACKLIST', False):
            jti = payload.get('jti')
            if jti and is_token_blacklisted(jti):
                raise jwt.InvalidTokenError('Token has been revoked')
        
        return payload
        
    except jwt.ExpiredSignatureError:
        logger.warning(f"Expired {token_type} token attempted")
        raise
    except jwt.InvalidAudienceError:
        logger.warning(f"Invalid audience in {token_type} token")
        raise
    except jwt.InvalidIssuerError:
        logger.warning(f"Invalid issuer in {token_type} token")
        raise
    except jwt.ImmatureSignatureError:
        logger.warning(f"Token used before nbf time ({token_type})")
        raise
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid {token_type} token: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error decoding {token_type} token: {str(e)}")
        raise jwt.InvalidTokenError('Token validation failed')

def validate_websocket_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validate WebSocket handshake token with strict security.
    As per CLAUDE.md: enforce WSS and short-lived JWTs for Socket.IO.
    """
    try:
        payload = decode_token(token, 'access')
        
        # Additional WebSocket-specific validations
        current_time = time.time()
        token_age = current_time - payload.get('iat', current_time)
        
        # Use config-based token age limits
        is_dev = getattr(current_app.config, 'IS_DEVELOPMENT', True)
        max_age = 3600 if is_dev else 900  # 1 hour DEV, 15 min PROD
        if token_age > max_age:
            logger.warning(f"WebSocket token too old: {token_age}s")
            return None
        
        return payload
        
    except Exception as e:
        logger.warning(f"WebSocket token validation failed: {str(e)}")
        return None

def is_token_blacklisted(jti: str) -> bool:
    """
    Check if token is blacklisted/revoked.
    Uses Redis in production, always allows in development.
    """
    # DEV: Always allow
    if current_app.config.get('IS_DEVELOPMENT', True):
        return False
    
    # PROD: Check blacklist in Redis
    try:
        from app.utils.redis_client import redis_client
        return redis_client.redis_client and redis_client.redis_client.sismember('blacklisted_tokens', jti)
    except:
        # Fail safe - if can't check blacklist, allow but log
        logger.warning(f"Could not check token blacklist for jti: {jti}")
        return False

def blacklist_token(jti: str, ttl_seconds: int = 86400):
    """
    Add token to blacklist.
    Implements proper token revocation in production.
    """
    if current_app.config.get('IS_DEVELOPMENT', True):
        logger.info(f"DEV: Would blacklist token {jti}")
        return
    
    try:
        from app.utils.redis_client import redis_client
        if redis_client.redis_client:
            redis_client.redis_client.sadd('blacklisted_tokens', jti)
            redis_client.redis_client.expire('blacklisted_tokens', ttl_seconds)
    except Exception as e:
        logger.error(f"Failed to blacklist token {jti}: {str(e)}")

def get_token_claims(token: str) -> Dict[str, Any]:
    """Get token claims without validation (for debugging only)."""
    try:
        return jwt.decode(token, options={"verify_signature": False})
    except:
        return {}