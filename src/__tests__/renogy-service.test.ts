import { RenogyService } from '../renogy-service';
import { PlatformConfig } from 'homebridge';

// Mock the fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('RenogyService', () => {
    let service: RenogyService;
    const config: PlatformConfig = {
        name: 'Renogy',
        platform: 'RenogyHomebridgePlugin'
    };
    const accessKey = 'test-access-key';
    const secretKey = 'test-secret-key';

    beforeEach(() => {
        service = new RenogyService(config, accessKey, secretKey);
        mockFetch.mockClear();
    });

    it('should be created', () => {
        expect(service).toBeInstanceOf(RenogyService);
    });

    describe('renogyAPI', () => {
        it('should call fetch with the correct headers and signature', async () => {
            const endpoint = '/device/list';
            const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) };
            mockFetch.mockResolvedValue(mockResponse);

            const ts = 1672531200000; // 2023-01-01 00:00:00 UTC
            jest.spyOn(Date, 'now').mockReturnValue(ts);

            await service.renogyAPI(endpoint);

            expect(mockFetch).toHaveBeenCalledWith(
                'https://openapi.renogy.com/device/list',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Access-Key': accessKey,
                        'Timestamp': ts.toString(),
                        'Signature': expect.any(String)
                    })
                })
            );
        });
    });

    describe('getDeviceDataMap', () => {
        it('should fetch and cache the datamap', async () => {
            const deviceId = '4637441777613316849';
            const mockDataMap = [{ name: 'voltage', type: 'float' }];
            const mockResponse = { ok: true, json: () => Promise.resolve(mockDataMap) };
            mockFetch.mockResolvedValue(mockResponse);

            const dataMap = await service.getDeviceDataMap(deviceId);

            expect(dataMap).toEqual(mockDataMap);
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith(
                `https://openapi.renogy.com/device/datamap/${deviceId}`,
                expect.any(Object)
            );

            // Call again to check cache
            const cachedDataMap = await service.getDeviceDataMap(deviceId);
            expect(cachedDataMap).toEqual(mockDataMap);
            expect(mockFetch).toHaveBeenCalledTimes(1); // Should not call fetch again
        });
    });

    describe('_getDeviceSensorData', () => {
        it('should return structured sensor data', async () => {
            const deviceId = '4637441777613316849';
            const mockDataMap = [
                { name: 'presentVolts', unit: 'V', type: 'float', desc: 'Voltage', operation: 'RO' },
                { name: 'presentAmps', unit: 'A', type: 'float', desc: 'Current', operation: 'RO' }
            ];
            const mockLatestData = { data: { presentVolts: 13.1, presentAmps: -15400.0 } };

            const mockDataMapResponse = { ok: true, json: () => Promise.resolve(mockDataMap) };
            const mockLatestDataResponse = { ok: true, json: () => Promise.resolve(mockLatestData) };
            
            mockFetch
                .mockResolvedValueOnce(mockDataMapResponse) // for getDeviceDataMap
                .mockResolvedValueOnce(mockLatestDataResponse); // for renogyAPI

            const sensorData = await service['_getDeviceSensorData'](deviceId);

            expect(sensorData).toEqual({
                presentVolts: {
                    value: 13.1,
                    unit: 'V',
                    type: 'float',
                    description: 'Voltage',
                    operation: 'RO'
                },
                presentAmps: {
                    value: -15400.0,
                    unit: 'A',
                    type: 'float',
                    description: 'Current',
                    operation: 'RO'
                }
            });
        });
    });

    describe('pollAllDevices', () => {
        it('should poll all devices and their sub-devices', async () => {
            const mockDeviceList = [
                {
                    deviceId: '220800000000000000',
                    name: 'Main Device',
                    sublist: [
                        {
                            deviceId: '4637441777613316849',
                            name: 'Sub Device'
                        }
                    ]
                }
            ];
            const mockDataMap = [{ name: 'voltage', type: 'float' }];
            const mockLatestData = { data: { voltage: 12.5 } };

            mockFetch
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockDeviceList) }) // for /device/list
                .mockResolvedValue({ ok: true, json: () => Promise.resolve(mockDataMap) }) // for datamaps
                .mockResolvedValue({ ok: true, json: () => Promise.resolve(mockLatestData) }); // for latest data

            const mapDeviceSpy = jest.spyOn(service as any, '_mapDevice');
            const getSensorDataSpy = jest.spyOn(service as any, '_getDeviceSensorData');
            
            const devices = await service.pollAllDevices();

            expect(devices).toHaveLength(2);
            expect(mapDeviceSpy).toHaveBeenCalledTimes(2);
            expect(getSensorDataSpy).toHaveBeenCalledTimes(2);
            expect(getSensorDataSpy).toHaveBeenCalledWith('220800000000000000');
            expect(getSensorDataSpy).toHaveBeenCalledWith('4637441777613316849');
        });
    });
});
