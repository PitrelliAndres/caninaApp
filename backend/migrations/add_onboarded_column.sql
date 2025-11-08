-- Migración: Agregar columna onboarded a la tabla users
-- Fecha: 2025-11-07
-- Descripción: Agregar campo para marcar si el usuario completó el onboarding

-- Agregar columna onboarded con valor por defecto FALSE
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT FALSE;

-- Actualizar usuarios existentes que tienen perro y preferencias (completaron onboarding)
UPDATE users
SET onboarded = TRUE
WHERE id IN (
    SELECT DISTINCT u.id
    FROM users u
    INNER JOIN dogs d ON d.user_id = u.id
    INNER JOIN user_preferences up ON up.user_id = u.id
    WHERE u.nickname IS NOT NULL
);

-- Crear índice para mejorar performance en consultas de usuarios onboarded
CREATE INDEX IF NOT EXISTS idx_users_onboarded ON users(onboarded);
