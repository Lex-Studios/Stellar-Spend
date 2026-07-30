import { validateConfig, type Config } from "./schema";
import { getEnvironmentConfig } from "./environments";

/**
 * Configuration manager with hot-reloading and versioning support
 */

export interface ConfigVersion {
  version: string;
  timestamp: number;
  config: Config;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private currentConfig: Config;
  private configHistory: ConfigVersion[] = [];
  private watchers: Set<(config: Config) => void> = new Set();
  private version: string = "1.0.0";

  private constructor() {
    this.currentConfig = getEnvironmentConfig();
    this.recordVersion();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Get current configuration
   */
  getConfig(): Config {
    return { ...this.currentConfig };
  }

  /**
   * Get specific config section
   */
  getSection<K extends keyof Config>(section: K): Config[K] {
    return { ...this.currentConfig[section] };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<Config>): void {
    const merged = { ...this.currentConfig, ...newConfig };
    const validated = validateConfig(merged);

    this.currentConfig = validated;
    this.recordVersion();
    this.notifyWatchers();
  }

  /**
   * Update specific config section
   */
  updateSection<K extends keyof Config>(
    section: K,
    updates: Partial<Config[K]>,
  ): void {
    const merged = {
      ...this.currentConfig,
      [section]: { ...this.currentConfig[section], ...updates },
    };
    this.updateConfig(merged);
  }

  /**
   * Watch for configuration changes
   */
  watch(callback: (config: Config) => void): () => void {
    this.watchers.add(callback);
    return () => this.watchers.delete(callback);
  }

  /**
   * Get configuration history
   */
  getHistory(limit?: number): ConfigVersion[] {
    const history = [...this.configHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get current version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Set version
   */
  setVersion(version: string): void {
    this.version = version;
    this.recordVersion();
  }

  /**
   * Rollback to previous version
   */
  rollback(steps: number = 1): boolean {
    if (this.configHistory.length < 2) {
      return false;
    }

    const targetIndex = Math.max(0, this.configHistory.length - steps - 1);
    const targetVersion = this.configHistory[targetIndex];

    this.currentConfig = { ...targetVersion.config };
    this.notifyWatchers();
    return true;
  }

  /**
   * Reset to environment defaults
   */
  reset(): void {
    this.currentConfig = getEnvironmentConfig();
    this.recordVersion();
    this.notifyWatchers();
  }

  /**
   * Record configuration version
   */
  private recordVersion(): void {
    this.configHistory.push({
      version: this.version,
      timestamp: Date.now(),
      config: { ...this.currentConfig },
    });

    // Keep only last 50 versions
    if (this.configHistory.length > 50) {
      this.configHistory = this.configHistory.slice(-50);
    }
  }

  /**
   * Notify all watchers of configuration change
   */
  private notifyWatchers(): void {
    const config = this.getConfig();
    this.watchers.forEach((callback) => {
      try {
        callback(config);
      } catch (error) {
        console.error("Error in config watcher:", error);
      }
    });
  }
}

/**
 * Get global config manager instance
 */
export function getConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}

/**
 * Get current configuration
 */
export function getConfig(): Config {
  return getConfigManager().getConfig();
}

/**
 * Get specific config section
 */
export function getConfigSection<K extends keyof Config>(
  section: K,
): Config[K] {
  return getConfigManager().getSection(section);
}
