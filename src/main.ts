import { API } from 'homebridge';
import { RenogyHomebridgePlatform } from './index.js';
import { PLATFORM_NAME } from './settings.js';

export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, RenogyHomebridgePlatform);
};
