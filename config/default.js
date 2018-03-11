module.exports = {
    brain:{
        outputNodeErrorThreshold: 5,
        maxOutputsFiredPerTick: 1
    },
    socket:{
        host:'https://chaoscraft-api.schematical.com'
    },
    minecraft:{
        host:process.env.MINECRAFT_HOST || '34.226.141.72'
    },
    server:{
        host:'https://chaoscraft-api.schematical.com'
    }
}