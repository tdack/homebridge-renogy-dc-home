import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { RenogyService } from './renogy-service';
import { PLATFORM_NAME, PLUGIN_IDENTIFIER } from './settings';
import { RenogyAccessory } from './renogy-accessory';

export class RenogyHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  async discoverDevices() {
    const renogyService = new RenogyService(this.config, this.config.accessKey, this.config.secretKey);
    const devices = await renogyService.pollAllDevices();

    for (const device of devices) {
      const uuid = this.api.hap.uuid.generate(device.deviceId);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        new RenogyAccessory(this, existingAccessory);
      } else {
        this.log.info('Adding new accessory:', device.name);
        const accessory = new this.api.platformAccessory(device.name, uuid);
        accessory.context.device = device;
        new RenogyAccessory(this, accessory);
        this.api.registerPlatformAccessories(PLUGIN_IDENTIFIER, PLATFORM_NAME, [accessory]);
      }
    }
  }
}