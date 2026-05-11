import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { RenogyHomebridgePlatform } from './index.js';

export class RenogyAccessory {
  private service: Service;

  constructor(
    private readonly platform: RenogyHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Renogy')
      .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.category)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.sn);

    this.service = this.accessory.getService(this.platform.Service.Battery) ?? this.accessory.addService(this.platform.Service.Battery);

    this.service.getCharacteristic(this.platform.Characteristic.ChargingState)
      .onGet(this.getChargingState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .onGet(this.getBatteryLevel.bind(this));
  }

  getChargingState(): CharacteristicValue {
    const batteryData = this.accessory.context.device.sensorData;
    if (this.accessory.context.device.onlineStatus !== 'online') {
      return this.platform.Characteristic.ChargingState.NOT_CHARGEABLE;
    }
    return batteryData.presentAmps > 0
      ? this.platform.Characteristic.ChargingState.CHARGING
      : this.platform.Characteristic.ChargingState.NOT_CHARGING;
  }

  getBatteryLevel(): CharacteristicValue {
    const batteryData = this.accessory.context.device.sensorData;
    const level = batteryData.batteryLevel || 0;
    return Math.max(0, Math.min(100, level));
  }
}

