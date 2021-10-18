'use strict'

/**
 * Module dependencies
 */

const redis = require("redis");


module.exports = function (options) {
    return new Publisher(options)
}

class Publisher {

    constructor (options) {
        options = options || {}

        if (!this._isObject(options.topic) && !this._isString(options.topic)) {
            throw new TypeError('option `topic` is required and must be an Array or a String')
        }

        this.topic = Array.isArray(options.topic) ?
            options.topic[0] :
            options.topic

        this.topicsAsEvents = !!options.topicsAsEvents || false

        this.port = +options.port || 6379
        this.host = options.host || '127.0.0.1'
        this.password = options.password || null
        this.clientOptions = options.clientOptions || {}

        this._init()
    }

    _init () {

        this.client = redis.createClient({
            host: this.host,
            port: this.port,
            // password: this.password,
        })
        this.client.on('error', this._onError.bind(this))

        this.client.on('ready', () => {
            console.log('Redis client ready')
        })
    }

    _onError (err) {
        console.log('error ', err);
    }

    publish(message){
        this.client.publish(this.topic, message);
    }

    close (callback) {
        let self = this

        this.client.quit()

        this.client.on('end', () => {
            if (callback) {
                callback.call(self)
            }
        })
    }

    _isObject(value) {
        let type = typeof value
        return !!value && (type === 'object' || type === 'function')
    }

    _isString(value) {
        return typeof value == 'string'
    }

}
