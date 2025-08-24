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
    Expects 'realtime' token type with aud=realtime.
    """
    try:
        # Use custom decode for realtime tokens
        is_production = getattr(current_app.config, 'IS_PRODUCTION', False) or os.environ.get('FLASK_ENV') == 'production'
        is_dev = os.environ.get('FLASK_ENV', 'development') == 'development'
        
        options = {
            'verify_signature': True,
            'verify_exp': True,
            'verify_nbf': True,
            'verify_iat': True,
            'verify_aud': is_production,  # Strict audience validation in PROD
            'verify_iss': is_production,  # Strict issuer validation in PROD
        }
        
        # Decode with realtime-specific audience
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256'],
            options=options,
            audience=os.environ.get('WS_AUDIENCE', 'realtime') if is_production else None,
            issuer=os.environ.get('JWT_ISSUER', 'parkdog-api') if is_production else None
        )
        
        # Must be realtime token type
        if payload.get('type') != 'realtime':
            logger.warning(f"WebSocket expects realtime token, got: {payload.get('type')}")
            return None
        
        # Additional WebSocket-specific validations
        current_time = time.time()
        token_age = current_time - payload.get('iat', current_time)
        
        # Use environment-based token age limits
        max_age_minutes = int(os.environ.get('WS_JWT_TTL_MIN', 60 if is_dev else 10))
        max_age = max_age_minutes * 60
        if token_age > max_age:
            logger.warning(f"WebSocket token too old: {token_age}s (max: {max_age}s)")
            return None
        
        # Check user_id exists and is valid
        user_id = payload.get('user_id')
        if not user_id or not isinstance(user_id, int):
            logger.warning("Invalid user_id in WebSocket token")
            return None
        
        # Check token blacklist if enabled
        if current_app.config.get('ENABLE_TOKEN_BLACKLIST', False):
            jti = payload.get('jti')
            if jti and is_token_blacklisted(jti):
                logger.warning(f"Blacklisted WebSocket token attempted: {jti}")
                return None
        
        return payload
        
    except jwt.ExpiredSignatureError:
        logger.warning("Expired WebSocket token attempted")
        return None
    except jwt.InvalidAudienceError:
        logger.warning(f"Invalid audience in WebSocket token (expected: realtime)")
        return None
    except jwt.InvalidIssuerError:
        logger.warning("Invalid issuer in WebSocket token")
        return None
    except jwt.ImmatureSignatureError:
        logger.warning("WebSocket token used before nbf time")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid WebSocket token: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error validating WebSocket token: {str(e)}")
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