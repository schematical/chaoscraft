module.exports = {
    brain:{
        outputNodeErrorThreshold: 5,
        maxOutputsFiredPerTick: 2
    },
    socket:{
        host:'https://chaoscraft-api.schematical.com'
    },
    minecraft:{
        host:process.env.MINECRAFT_HOST || '54.209.248.126'
    },
    server:{
        host:'https://chaoscraft-api.schematical.com'
    }
}