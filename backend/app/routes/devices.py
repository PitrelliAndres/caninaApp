"""
Device Registration Routes
Handles FCM/APNS token registration for push notifications
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.device import DeviceToken
from app.utils.validators import validate_required_fields
from app.utils.rate_limiter import rate_limit_api

bp = Blueprint('devices', __name__, url_prefix='/api/v1/devices')


@bp.route('/register', methods=['POST'])
@jwt_required()
@rate_limit_api
def register_device():
    """
    Register or update a device token for push notifications

    POST /api/v1/devices/register

    Body:
    {
        "token": "fcm_token_here",
        "platform": "ios" | "android" | "web",
        "device_info": {
            "device_id": "uuid",
            "app_version": "1.0.0",
            "os_version": "iOS 17.0",
            "device_model": "iPhone 15 Pro"
        }
    }

    Returns:
    {
        "device_token": {...},
        "is_new": true
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        required = ['token', 'platform']
        missing = validate_required_fields(data, required)
        if missing:
            return jsonify({
                'error': {
                    'code': 'MISSING_FIELDS',
                    'message': f'Missing required fields: {", ".join(missing)}'
                }
            }), 400

        token = data['token']
        platform = data['platform']
        device_info = data.get('device_info', {})

        # Validate platform
        valid_platforms = ['ios', 'android', 'web']
        if platform not in valid_platforms:
            return jsonify({
                'error': {
                    'code': 'INVALID_PLATFORM',
                    'message': f'Platform must be one of: {", ".join(valid_platforms)}'
                }
            }), 400

        # Validate token format (basic check)
        if not token or len(token) < 20:
            return jsonify({
                'error': {
                    'code': 'INVALID_TOKEN',
                    'message': 'Token must be at least 20 characters'
                }
            }), 400

        # Register or update token
        device_token, is_new = DeviceToken.register_token(
            user_id=current_user_id,
            token=token,
            platform=platform,
            device_info=device_info
        )

        return jsonify({
            'device_token': device_token.to_dict(),
            'is_new': is_new,
            'message': 'Device registered successfully' if is_new else 'Device token updated'
        }), 201 if is_new else 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': {
                'code': 'REGISTRATION_FAILED',
                'message': str(e)
            }
        }), 500


@bp.route('/unregister', methods=['POST'])
@jwt_required()
@rate_limit_api
def unregister_device():
    """
    Unregister a device token (e.g., on logout)

    POST /api/v1/devices/unregister

    Body:
    {
        "token": "fcm_token_here"
    }

    Returns:
    {
        "success": true,
        "message": "Device unregistered successfully"
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required = ['token']
        missing = validate_required_fields(data, required)
        if missing:
            return jsonify({
                'error': {
                    'code': 'MISSING_FIELDS',
                    'message': f'Missing required fields: {", ".join(missing)}'
                }
            }), 400

        token = data['token']

        # Deactivate token
        success = DeviceToken.deactivate_token(token)

        if success:
            return jsonify({
                'success': True,
                'message': 'Device unregistered successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Token not found or already inactive'
            }), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': {
                'code': 'UNREGISTRATION_FAILED',
                'message': str(e)
            }
        }), 500


@bp.route('/tokens', methods=['GET'])
@jwt_required()
@rate_limit_api
def get_my_tokens():
    """
    Get all active device tokens for current user

    GET /api/v1/devices/tokens

    Query params:
    - platform: (optional) Filter by platform

    Returns:
    {
        "tokens": [...]
    }
    """
    try:
        current_user_id = get_jwt_identity()
        platform = request.args.get('platform')

        # Get active tokens
        tokens = DeviceToken.get_active_tokens(current_user_id, platform)

        return jsonify({
            'tokens': [t.to_dict() for t in tokens],
            'count': len(tokens)
        }), 200

    except Exception as e:
        return jsonify({
            'error': {
                'code': 'FETCH_FAILED',
                'message': str(e)
            }
        }), 500


@bp.route('/test', methods=['POST'])
@jwt_required()
@rate_limit_api
def test_notification():
    """
    Send a test notification to current user's devices

    POST /api/v1/devices/test

    Body:
    {
        "token": "fcm_token_here" (optional, defaults to all user tokens),
        "title": "Test Title" (optional),
        "body": "Test Body" (optional)
    }

    Returns:
    {
        "success": true,
        "result": {...}
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}

        from app.services.notification_service import notification_service

        if not notification_service.is_initialized():
            return jsonify({
                'error': {
                    'code': 'SERVICE_NOT_INITIALIZED',
                    'message': 'Notification service is not initialized'
                }
            }), 503

        # Get token(s)
        token = data.get('token')

        if token:
            # Test specific token
            result = notification_service.test_notification(
                token=token,
                title=data.get('title', 'Test Notification'),
                body=data.get('body', 'This is a test notification from ParkDog')
            )
        else:
            # Test all user tokens
            tokens = DeviceToken.get_active_tokens(current_user_id)

            if not tokens:
                return jsonify({
                    'error': {
                        'code': 'NO_TOKENS',
                        'message': 'No active tokens found for user'
                    }
                }), 404

            results = []
            for device_token in tokens:
                result = notification_service.test_notification(
                    token=device_token.token,
                    title=data.get('title', 'Test Notification'),
                    body=data.get('body', f'Test from {device_token.platform}')
                )
                results.append({
                    'device_id': device_token.id,
                    'platform': device_token.platform,
                    'result': result
                })

            return jsonify({
                'success': True,
                'results': results,
                'count': len(results)
            }), 200

        return jsonify({
            'success': result.get('success', False),
            'result': result
        }), 200 if result.get('success') else 500

    except Exception as e:
        return jsonify({
            'error': {
                'code': 'TEST_FAILED',
                'message': str(e)
            }
        }), 500
