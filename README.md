# chaoscraft

Support Me on Patreon:
https://www.patreon.com/schematical

For more information on ChaosCraft check out this playlist: https://www.youtube.com/playlist?list=PLLkpLgU9B5xJ7Qy4kOyBJl5J6zsDIMceH

Discord: https://discord.gg/zUEacFT

## Install:

### Step 1:
Install Git
https://git-scm.com/downloads


### Step 2:
Install NodeJS
https://nodejs.org/en/

### Step 3:
Pull down the code
```
git clone https://github.com/schematical/chaoscraft.git
```

### Step 4:
Run NPM install
```
cd ./chaoscraft
npm install
```

### Step 5:
Build the code
```
npm build
```
NOTE: Some NPM versions might need
```
npm run-script build
```

NOTE: if the build fails try
```npm install -g typescript@2.9.2```
then from the project root directory
```tsc```

### Step 6:
Start it
```
npm start
```

NOTE: Windows users use the following:
```
setx NODE_ENV "production"
```
then
```node dist\index.js```




### Common Install Errors:


####Windows Users:

`npm start` wont work on windows at the moment.
Instead try
```
 setx NODE_ENV "production"
 node dist\index.js
```

### `npm build` errors out

Try it manually by running `npm i -g typescript` then just run `tsc` at the root of the repo. That should create a `./dist` folder with a bunch of stuff in it.


## Special Env Vars:
You can now prefix your bots by setting the following env vars:
```
CC_USERNAME_PREFIX=AA
```
I limited it to 2 chars as there are only 3 people running this at the time of this writing.


## Random Notes:

https://github.com/PrismarineJS/mineflayer/blob/master/doc/api.md#move

https://github.com/PrismarineJS/mineflayer-navigate/blob/master/index.js


## Finds Block At:
https://github.com/PrismarineJS/mineflayer/blob/master/doc/api.md#botblockatpoint


## Can Craft:
You will need to do a little bit more logic to determine this:

https://github.com/PrismarineJS/mineflayer/blob/master/doc/api.md#botrecipesforitemtype-metadata-minresultcount-craftingtable




{
  "domain": null,
  "_events": {},
  "_eventsCount": 0,
  "id": 26842,
  "type": "object",
  "position": {
    "x": 265.1096849302338,
    "y": 64,
    "z": 226.74282263306264
  },
  "velocity": {
    "x": -0.000625,
    "y": 0,
    "z": 0.0003125
  },
  "yaw": 2.6016314162540475,
  "pitch": 0,
  "onGround": true,
  "height": 0,
  "effects": {},
  "equipment": [
    null,
    null,
    null,
    null,
    null
  ],
  "isValid": true,
  "metadata": {
    "0": 0,
    "1": 300,
    "2": "",
    "3": false,
    "4": false,
    "5": false,
    "6": {
      "blockId": 12,
      "itemCount": 1,
      "itemDamage": 0
    }
  },
  "objectType": "Dropped item",
  "displayName": "Dropped item",
  "entityType": 2,
  "name": "item",
  "kind": "Drops"
}












Entity