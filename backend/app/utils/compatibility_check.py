"""
Compatibility checker for optional dependencies
Tests all fallbacks work properly in development
"""
import os
import logging
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

def check_optional_dependencies() -> Dict[str, Dict]:
    """Check status of all optional dependencies and their fallbacks"""
    results = {
        'redis': check_redis(),
        'ulid': check_ulid(),
        'bleach': check_bleach(),
        'rate_limiter': check_rate_limiter(),
        'overall': {'status': 'checking'}
    }
    
    # Overall status
    failed_critical = []
    working_fallbacks = 0
    
    for name, result in results.items():
        if name == 'overall':
            continue
            
        if result['status'] == 'fallback_ok':
            working_fallbacks += 1
        elif result['status'] == 'failed' and result.get('critical', False):
            failed_critical.append(name)
    
    if failed_critical:
        results['overall'] = {
            'status': 'failed',
            'message': f'Critical dependencies failed: {", ".join(failed_critical)}',
            'fallbacks_working': working_fallbacks
        }
    else:
        results['overall'] = {
            'status': 'ok',
            'message': f'All systems operational. {working_fallbacks} fallbacks active.',
            'fallbacks_working': working_fallbacks
        }
    
    return results

def check_redis() -> Dict:
    """Check Redis availability and fallback"""
    try:
        from app.utils.redis_client import redis_client
        
        is_connected = redis_client.is_connected()
        
        if is_connected:
            return {
                'status': 'available',
                'message': 'Redis connected successfully',
                'fallback': False
            }
        else:
            # Test fallback functionality
            test_key = 'test:compatibility'
            redis_client.check_rate_limit(test_key, 10, 60)
            redis_client.set_user_online(999, 'test_socket')
            redis_client.set_user_offline(999)
            
            return {
                'status': 'fallback_ok',
                'message': 'Redis not available, in-memory fallback working',
                'fallback': True,
                'production_required': True
            }
    except Exception as e:
        return {
            'status': 'failed',
            'message': f'Redis fallback failed: {str(e)}',
            'error': str(e),
            'critical': False
        }

def check_ulid() -> Dict:
    """Check ULID availability and fallback"""
    try:
        from app.utils.message_ids import message_id_generator, validate_message_id
        
        # Generate test ID
        test_id = message_id_generator.generate_id()
        
        # Validate test ID
        is_valid = validate_message_id(test_id)
        
        if not is_valid:
            raise ValueError("Generated ID is not valid")
        
        # Check if it's ULID or fallback
        if len(test_id) == 26:
            return {
                'status': 'available',
                'message': 'ULID library working correctly',
                'sample_id': test_id,
                'fallback': False
            }
        else:
            return {
                'status': 'fallback_ok',
                'message': 'ULID not available, timestamp fallback working',
                'sample_id': test_id,
                'fallback': True,
                'production_required': True
            }
    except Exception as e:
        return {
            'status': 'failed',
            'message': f'ULID fallback failed: {str(e)}',
            'error': str(e),
            'critical': True  # ID generation is critical
        }

def check_bleach() -> Dict:
    """Check bleach availability and fallback"""
    try:
        from app.utils.sanitizer import sanitizer
        
        # Test sanitization
        test_input = '<script>alert("xss")</script>Hello <b>World</b>'
        clean_text, warnings = sanitizer.sanitize_message_text(test_input)
        
        if '<script>' not in clean_text:
            # Check if it's bleach or fallback
            if clean_text == 'Hello <b>World</b>':
                return {
                    'status': 'available',
                    'message': 'Bleach library working correctly',
                    'sample_clean': clean_text,
                    'warnings': warnings,
                    'fallback': False
                }
            else:
                return {
                    'status': 'fallback_ok',
                    'message': 'Bleach not available, HTML escape fallback working',
                    'sample_clean': clean_text,
                    'warnings': warnings,
                    'fallback': True,
                    'production_required': True
                }
        else:
            raise ValueError("Sanitization failed - script tag not removed")
            
    except Exception as e:
        return {
            'status': 'failed',
            'message': f'Sanitization failed: {str(e)}',
            'error': str(e),
            'critical': True  # Security is critical
        }

def check_rate_limiter() -> Dict:
    """Check rate limiter functionality"""
    try:
        from app.utils.rate_limiter import rate_limiter
        
        # Test rate limiting
        test_allowed, info = rate_limiter.check_rate_limit('test_limit', 'test_user')
        
        if test_allowed:
            is_dev = os.environ.get('FLASK_ENV', 'development') == 'development'
            
            return {
                'status': 'fallback_ok' if is_dev else 'available',
                'message': 'Rate limiter working (development mode)' if is_dev else 'Rate limiter working',
                'test_result': info,
                'fallback': is_dev,
                'production_required': True
            }
        else:
            return {
                'status': 'failed',
                'message': 'Rate limiter blocking test request unexpectedly',
                'test_result': info,
                'critical': False
            }
    except Exception as e:
        return {
            'status': 'failed',
            'message': f'Rate limiter failed: {str(e)}',
            'error': str(e),
            'critical': False
        }

def log_compatibility_status():
    """Log compatibility status for debugging"""
    results = check_optional_dependencies()
    
    logger.info("=== DEPENDENCY COMPATIBILITY CHECK ===")
    
    for name, result in results.items():
        if name == 'overall':
            continue
            
        status_emoji = {
            'available': '✅',
            'fallback_ok': '⚠️ ',
            'failed': '❌'
        }.get(result['status'], '❓')
        
        logger.info(f"{status_emoji} {name.upper()}: {result['message']}")
        
        if result.get('production_required'):
            logger.warning(f"   → {name} fallback active - install for production")
    
    overall = results['overall']
    overall_emoji = '✅' if overall['status'] == 'ok' else '❌'
    logger.info(f"{overall_emoji} OVERALL: {overall['message']}")
    
    return results

def get_production_install_commands() -> List[str]:
    """Get list of pip install commands needed for production"""
    commands = []
    results = check_optional_dependencies()
    
    for name, result in results.items():
        if name == 'overall':
            continue
            
        if result.get('production_required') and result.get('fallback'):
            if name == 'redis':
                commands.append('pip install redis==4.6.0')
            elif name == 'ulid':
                commands.append('pip install ulid-py==1.1.0')
            elif name == 'bleach':
                commands.append('pip install bleach==6.1.0')
    
    return commands