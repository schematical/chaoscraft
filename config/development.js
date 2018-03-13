const path = require('path');
module.exports = {
    socket:{
        host:'http://localhost:3000'
    },
    server:{
        host:'http://localhost:3000'
    },
    minecraft:{
        host:process.env.MINECRAFT_HOST || '54.175.23.97'
    },
};