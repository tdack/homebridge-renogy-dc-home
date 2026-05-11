import * as crypto from 'crypto';
import { PlatformConfig } from 'homebridge';

const API_BASE_URL = 'https://openapi.renogy.com';

function objectToQueryString(params: { [key: string]: any }): string {
  if (!params || typeof params !== 'object') {
    return '';
  }

  const parts = [];
  for (const key in params) {
    if (Object.hasOwnProperty.call(params, key)) {
      const value = params[key];
            
      if (Array.isArray(value)) {
        value.forEach(item => {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
        });
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
  }

  return parts.join('&');
}

function calcSign(url: string, paramStr: string, ts: number, secretKey: string): string {
  const str = ts + '.' + url + '.' + paramStr; 
  const hash = crypto.createHmac('sha256', secretKey).update(str).digest('base64');
  return hash;
}

export class RenogyService {
  private dataMapCache: { [deviceId: string]: any } = {};

  constructor(
        public readonly config: PlatformConfig,
        public readonly accessKey: string,
        public readonly secretKey: string,
  ) {
    if (!this.accessKey || !this.secretKey) {
      throw new Error('RenogyService requires both accessKey and secretKey.');
    }
    console.log('RenogyService initialized with secure authentication enabled.');
  }

  async getDeviceDataMap(deviceId: string): Promise<any> {
    if (this.dataMapCache[deviceId]) {
      return this.dataMapCache[deviceId];
    }

    try {
      const dataMap = await this.renogyAPI(`/device/datamap/${deviceId}`);
      this.dataMapCache[deviceId] = dataMap;
      return dataMap;
    } catch (error: any) {
      console.error(`Failed to retrieve datamap for device ${deviceId}:`, error.message);
      throw new Error(`Failed to retrieve datamap for device ${deviceId}: ${error.message}`);
    }
  }


  async renogyAPI(endpoint: string, params: { [key: string]: any } = {}): Promise<any> {
    if (!endpoint) {
      throw new Error('Endpoint is required for API call.');
    }
        
    const ts = Date.now(); 
    const paramStr = objectToQueryString(params);

    const res = await fetch(`${API_BASE_URL}${endpoint}`, { 
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Key': this.accessKey, 
        'Signature': calcSign(endpoint, paramStr, ts, this.secretKey),
        'Timestamp': ts.toString(),
      },
    });

    if (res.ok) {
      const json = await res.json();
      return json;
    } else {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
  }

  async pollAllDevices(): Promise<any[]> {
    console.log('Starting poll of all devices...');
    try {
      const rawData = await this.renogyAPI('/device/list');
            
      if (!rawData || !Array.isArray(rawData)) {
        throw new Error('Invalid or missing device data in API response.');
      }

      const mappedDevices = [];

      for (const mainDevice of rawData) {
        const mainDeviceMapped = this._mapDevice(mainDevice);
        mainDeviceMapped.sensorData = await this._getDeviceSensorData(mainDevice.deviceId);
        mappedDevices.push(mainDeviceMapped);

        if (mainDevice.sublist && Array.isArray(mainDevice.sublist)) {
          for (const subDevice of mainDevice.sublist) {
            const subDeviceMapped = this._mapDevice(subDevice);
            subDeviceMapped.sensorData = await this._getDeviceSensorData(subDevice.deviceId);
            mappedDevices.push(subDeviceMapped);
          }
        }
      }

      return mappedDevices;
    } catch (error: any) {
      console.error('Error polling all devices:', error.message);
      throw new Error(`Failed to retrieve data from Renogy API: ${error.message}`);
    }
  }

  async _getDeviceSensorData(deviceId: string): Promise<any> {
    try {
      const dataMap = await this.getDeviceDataMap(deviceId);
      const response = await this.renogyAPI(`/device/data/latest/${deviceId}`);
      const sensorData = response && response.data ? response.data : {};
            
      const structuredData: { [key: string]: any } = {};

      if (Array.isArray(dataMap)) {
        for (const dataPoint of dataMap) {
          if (sensorData.hasOwnProperty(dataPoint.name)) {
            structuredData[dataPoint.name] = {
              value: sensorData[dataPoint.name],
              unit: dataPoint.unit,
              type: dataPoint.type,
              description: dataPoint.desc,
              operation: dataPoint.operation,
            };
          }
        }
      }

      return structuredData;
    } catch (error: any) {
      console.warn(`Failed to retrieve sensor data for device ${deviceId}:`, error.message);
      return {};
    }
  }

  _mapDevice(device: any): any {
    const state = device.onlineStatus === 'online' ? 'online' : 'offline';
        
    return {
      deviceId: device.deviceId,
      name: device.name,
      category: device.category,
      state: state,
      onlineStatus: device.onlineStatus,
      firmware: device.firmware || 'unknown',
      sn: device.sn || 'unknown',
      sensorData: {},
    };
  }
}