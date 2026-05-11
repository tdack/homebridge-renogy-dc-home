# Renogy OpenAPI V0.9

## Overview

> API Base URL: `https://openapi.renogy.com/`

## API Supported

Product Type	| Sample Products	| SDK Version	| Release Date
----------------|-------------------|---------------|--------------
Power Management	| Renogy ONE M1 <br/> Renogy ONE Core	| 1.0.0	| 2024-12-31(beta)
Power Station	| Lycan Series <br/> Phoenix Series	| 1.0.0	| 2026-03-31(beta)

## Introduction

This document provides a brief overview of some of the available endpoints and their parameters. The API is a REST API, accepting JSON as request body, And the response output format is JSON. Developers can use Postman to play around with it.

This API feature requires users to have a Renogy gateway product in order to function properly.

## Authentication

All endpoints require authentication, The specified `Access-Key`, `Timestamp`, and Signature need to be placed in the HTTP request header. Developers need to register and log in successfully to maintain relevant information on our [API Key](https://platform.renogy.com/apikey) page to apply for developer Keys (`Access-Key` and `Secret-Key`).
Then refer to the [signature](#signature) calculation demo at the end of the documentation to implement the signing process.

### WARNING & DISCLAIMER

This document is not intended for public release and is provided solely for communication purposes with professional users.
Renogy will not disclose developer information to any third parties.
Developers are responsible for securely storing developer keys. Renogy is not responsible for any data privacy issues resulting from leaks or consequences arising from the developer’s own key misuse.

## Endpoints

### Retrieve all devices
---
Get `/device/list`

**Response**

`Array[Object]` - application/json

key	| type	| description	| example
----|-------|---------------|---------
deviceId	| String	| device unique identifier	| 220800000000000000
sn	| String	| serial number	| 22RMG3500000000000
sku	| String	| SKU	| RSHGWSN-W02W-G2
name	| String	| device name	| Renogy ONE Core
category	| String	| device category	| Renogy ONE Core
mac	| String	| physical communication address	| 3C:E1:74:4C:10:89
firmware	| String	| firmware version	| V11.1.143
onlineStatus	| String	| online status: online/offline	| online
connectType	| String	| communication connection type: <br> zigbee/bt/rvc/rs485/rs232/ethernet/wifi/can/mesh	| bt
addTime	| Timestamp	| time of addition to the system	| 1725608156000
sublist	| Array[Object]	|sub-device list	 |

**example**

```json
[
    {
        "deviceId": "220800000000000000",
        "sn": "22RMG3500000000000",
        "sku": "RSHGWSN-W02W-G2",
        "name": "Renogy ONE Core",
        "category": "Renogy ONE Core",
        "mac": "3C:E1:74:4C:10:89",
        "firmware": "V11.1.143",
        "onlineStatus": "online",
        "addTime": 1725608156000,
        "sublist": [
            {
                "deviceId": "4637441777613316849",
                "sku": "RBT12400LFPLSHBT",
                "name": "Battery",
                "category": "Battery",
                "mac": "04:7F:0E:30:66:2248",
                "firmware": "V1.0",
                "onlineStatus": "online",
                "connectType": "bt",
                "addTime": 1726137385000
            }
        ]
    } 
]
```

### Retrieve data dictionary of the device
---
GET `/device/datamap/{deviceId}`

**Params**

key	| type	| description	| example
----|-------|---------------|---------
deviceId	| String	| Device unique identifier	| 4637441777613316849

**Response**

`Array[Object]` - application/json

key	| type	| description	| example
----|-------|---------------|--------
name	| String	| data name	| maximumCapacity
type	| String	| data type	| float
operation	| String	| operability: RO/RW	| RO
unit	| String	|data unit	| Ah
length	| int	| data length	| 4
max	| float	| maximum value	| 10000.0
min	| float	| minimum value	| 0.1
desc	| String	| description	 

**example**

```json
[
    {
        "name": "maximumCapacity",
        "type": "float",
        "operation": "RO",
        "unit":"Ah",
        "length": 4,
        "max": 10000.0,
        "min": 0.1
    },
    {
        "name": "presentAmps",
        "type": "float",
        "operation": "RO",
        "unit":"A",
        "length": 4,
        "max": 1000000.0,
        "min": -1000000.0
    },
    {
        "name": "batteryLevel",
        "type": "float",
        "operation": "RO",
        "unit": "%",
        "desc": ""
    }
]
```

### Retrieve the latest data of the device
---
GET `/device/data/latest/{deviceId}`

**Params**

key	| type	| description	| example
----|-------|---------------|--------
deviceId	| String	| Device unique identifier	|4637441777613316849
**Response**

`Array[Object]` - application/json

key	| type	| description	| example
----|-------|---------------|--------
data	| Object	| different devices have different properties
|||(reference data dictionary of device)	 

**example**

```json
{
    "data": {
        "presentCapacity": 260.200012,
        "presentVolts": 13.1,
        "maximumCapacity": 400.0,
        "presentAmps": -15400.0,
        "heatingModeStatus": 0,
        "batteryLevel": 65.050003
    }
}
```

### Retrieve solar yield of the device
---
GET `/device/data/history/{deviceId}?year={year}&month={month}&utcOffsetHours={utcOffsetHours}`

**Params**

key	| type	| description	| example
----|-------|---------------|--------
deviceId	| String	| Device unique identifier	| 4637441777613316849
year	| int	| year	| 2024
month	| int	| month	| 8
utcOffsetHours	| int	| UTC timezone offset	| -8

**Response**

`Array[Object]` - application/json

key	| type	| description	| example
----|-------|---------------|--------
generatePower	| float	solar yield (Wh)	| 1000
ts	| Timestamp	| Timestamp in millisecond format	| 1725177600000

**example**


```json
[
    {
        "generatePower": 0.0,
        "ts": 1725177600000
    },
    {
        "generatePower": 103.0,
        "ts": 1725264000000
    },
    {
        "generatePower": 0.0,
        "ts": 1725350400000
    },
    {
        "generatePower": 377.0,
        "ts": 1725436800000
    },
    {
        "generatePower": 39.0,
        "ts": 1725523200000
    },
    ...
]
```

### Retrieve the alarms currently happening of the device
---
GET `/device/alarm/{deviceId}`

**Params**

key	| type	| description	| example
----|-------|---------------|--------
deviceId	| String	| Device unique identifier	| 240913013714971001

**Response**

`Array[Object]` - application/json

key	| type	| description	| example
----|-------|---------------|--------
code		| | alarm code	 
alarmLevel	| String	| alarm level: <br> Minor/Medium/Severe/Fatal	 
alarmName	| String	| alarm name	 
desc	| String	| description	 
suggestion	| String	| suggestion	 
ts	| Timestamp	| Timestamp in millisecond format	| 1725177600000

**example**

```json
[
    {
        "alarmLevel": null,
        "alarmName": "Battery Overvoltage Protection",
        "code": 39,
        "desc": null,
        "suggestion": "Please make sure that the charging source is compatible with lithium iron phosphate batteries and the charge voltage is set correctly.",
        "ts": 1726811563033
    }
]
```

### Retrieve logs of the Zigbee device
---
To retrieve the latest 200 log entries for the Zigbee device

GET `/device/log/{deviceId}`

**Params**

key	| type	| description	| example
----|-------|---------------|--------
deviceId	String	Device unique identifier	240913013714971001
**Response**

`Array[Object]` - application/json

key	| type	| description	| example
----|-------|---------------|--------
content	| String	| content	| Door/Window is open.
ts	| Timestamp	| Timestamp in millisecond format	| 1725177600000

**example**

```json
[
    {
        "content": "Door/Window is open.",
        "ts": 1726297462000
    },
    {
        "content": "Door/Window is closed.",
        "ts": 1726292560000
    },
    {
        "content": "Door/Window is open.",
        "ts": 1726292559000
    }
]
```
### Endpoint Status
--- 
HTTP Status Code |	description
-----------------|-------------
200 | OK
401	| Access-Key, Timestamp, Signature incorrect or not provided
429	| The request frequency with the developer key exceeds 30 times per minute.  <br> Solution: Reduce the request frequency or consult the DC Home development team.

### Signature
---
param	| type	| description	| example
--------|-------|---------------|---------
url	| String		| | /data/history/4666131559607060560
paramStr	| String	| Parameters in the URL	| ?year=2024&month=9&utcOffsetHours=-8
ts	| Timestamp	| Timestamp in millisecond format	| 1726739190910
secretKey	| String	| Obtain from the DC Home development team	| sk_abc

#### Java
```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class SignCalculator {
    public static String calcSign(String url, String paramStr, long ts, String secretKey) {
        String strToSign = ts + "." + url + "." + paramStr;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] signData = mac.doFinal(strToSign.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(signData);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
```

#### Python
```python
import hmac
import hashlib
import base64

def calc_sign(url, param_str, ts, secret_key):
    str_to_sign = f'{ts}.{url}.{param_str}'.encode('utf-8')
    hmac_obj = hmac.new(secret_key.encode('utf-8'), str_to_sign, hashlib.sha256)
    return base64.b64encode(hmac_obj.digest()).decode('utf-8')
```

#### JavaScript
```js
function calcSign(url, paramStr, ts, secretKey){
    var str = ts + "." + url + "." + paramStr; 
    var hash = CryptoJS.HmacSHA256(str, secretKey);
    return CryptoJS.enc.Base64.stringify(hash);
}
```