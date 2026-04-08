const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', 'data');
const CONFIG_PATH = path.join(CONFIG_DIR, 'admin-config.json');

const defaultConfig = {
  platform_name: 'SmartAppoint',
  contact_email: '',
  noshow_threshold: 10,
  ai_enabled: true,
  registration_open: true,
};

const ensureConfigFile = () => {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
  }
};

const readAdminConfig = () => {
  ensureConfigFile();

  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultConfig, ...parsed };
  } catch (error) {
    return { ...defaultConfig };
  }
};

const writeAdminConfig = (partialConfig) => {
  const nextConfig = {
    ...readAdminConfig(),
    ...partialConfig,
  };

  ensureConfigFile();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(nextConfig, null, 2));

  return nextConfig;
};

module.exports = {
  readAdminConfig,
  writeAdminConfig,
  defaultConfig,
};
