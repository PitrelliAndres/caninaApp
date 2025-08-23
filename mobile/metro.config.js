// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname, {
  isCSSEnabled: false,
});

// Agregar soporte para SVG
defaultConfig.resolver.assetExts = defaultConfig.resolver.assetExts.filter(
  ext => ext !== 'svg'
);
defaultConfig.resolver.sourceExts.push('svg');

// Configuración para Windows - resolver problemas de rutas
defaultConfig.resolver.unstable_enableSymlinks = true;
defaultConfig.resolver.unstable_enablePackageExports = true;

// Excluir plataformas web para evitar conflictos
defaultConfig.resolver.platforms = ['android', 'ios', 'native'];

// Optimización de caché
defaultConfig.resetCache = true;
defaultConfig.cacheVersion = '1.0';

// Configuración para react-native-svg-transformer
defaultConfig.transformer = {
  ...defaultConfig.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Configuración para desarrollo
defaultConfig.server = {
  ...defaultConfig.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Agregar headers CORS para desarrollo
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return middleware(req, res, next);
    };
  },
};

// Watchman configuración para Windows
defaultConfig.watchFolders = [__dirname];
defaultConfig.resolver.blacklistRE = /.*\.test\.(js|ts|tsx)$/;

// Configuración para mejorar el rendimiento en Windows
defaultConfig.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = defaultConfig;