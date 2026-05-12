# Renogy Homebridge Plugin

This is a Homebridge plugin for Renogy devices. It allows you to monitor your Renogy devices in the Apple Home app.

Currently a work in progress. Populates sub-devices from main device (eg: Renogy One Core).

## Installation

Search for `homebridge-renogy-dc-home` in the Homebridge Plugin page.

## Getting API Keys

To use this plugin, you will need to get an Access Key and a Secret Key from the Renogy platform. You can get your keys by visiting [https://platform.renogy.com/apikey/](https://platform.renogy.com/apikey/).

## Configuration

**Note:** See the "Getting API Keys" section above to learn how to get your `accessKey` and `secretKey`.

```json
{
  "platforms": [
    {
      "platform": "RenogyHomebridgePlugin",
      "name": "Renogy",
      "accessKey": "YOUR_ACCESS_KEY",
      "secretKey": "YOUR_SECRET_KEY"
    }
  ]
}
```
