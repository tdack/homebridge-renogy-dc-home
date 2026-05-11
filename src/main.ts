import { API } from 'homebridge';
import { RenogyHomebridgePlatform } from './index';
import { PLATFORM_NAME } from './settings';

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, RenogyHomebridgePlatform);
};
