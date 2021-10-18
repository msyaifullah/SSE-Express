'use strict'

/**
 * Module dependencies
 */

const Readable = require('stream').Readable;
const redis = require("redis");


/**
 *
 *
 * https://www.html5rocks.com/en/tutorials/eventsource/basics/
 */
class Subscribe extends Readable {

    constructor(options) {
        options = options || {}
        super(options)

        if (!this._isObject(options.topics) && !this._isString(options.topics)) {
            throw new TypeError('option `topics` is required and must be an Array or a String')
        }

        if (options.retry && (!this._isNumber(options.retry) || options.retry <= 0)) {
            throw new TypeError('option `sse.retry` must be a Number greater than 0')
        }

        if (options.transform) {
            if (!this._isFunction(options.transform)) {
                throw new TypeError('option `transform` must be a function')
            } else {
                this.transform = options.transform
                this.transformType = this.transform.length === 2 ? 'async' : 'sync'
            }
        }

        this.topics = Array.isArray(options.topics) ?
            options.topics :
            [options.topics]

        this.topicsAsEvents = !!options.topicsAsEvents || false
        this.patternSubscribe = !!options.patternSubscribe || false

        this.port = +options.port || 6379
        this.host = options.host || '127.0.0.1'
        this.password = options.password || null
        this.clientOptions = options.clientOptions || {}

        this.retry = options.retry || 5000
        this.push('retry: ' + this.retry + '\n')

        this._init()
    }

    _read() {
        console.log("do nothing this is implementation")
    }

    _init() {
        this.setMaxListeners(0)

        this.client = redis.createClient({
            host: this.host,
            port: this.port,
            // password: this.password,
        })
        this.client.on('error', this._onError.bind(this))

        let self = this

        this.client.on('ready', () => {
            console.log('Redis client ready')
            self._subscribe()
        })
    }

    _subscribe() {
        let self = this

        let msgEventName = this.patternSubscribe ? 'pmessage' : 'message'
        let mode = this.patternSubscribe ? 'psubscribe' : 'subscribe'
        let handler = this.patternSubscribe ? '_onPmessage' : '_onMessage'

        this.client.on(msgEventName, this[handler].bind(this))

        let callback = (err, count) => {
            console.log('Redis client subscribed to %s topic(s) (%j) with mode %s', count, self.topics, mode)
            self.emit('ready')
        }

        let args = this.topics.concat(callback)

        this.client[mode].apply(this.client, args)
    }

    _onMessage(topic, message) {
        console.log('received %j message on topic %s', message, topic)
        this._push(topic, message)
    }

    _onPmessage(pattern, topic, message) {
        console.log('received %j message on topic %s (from pattern %s)', message, topic, pattern)
        this._push(topic, message)
    }

    _runTransform(message, callback) {
        if (!this.transform) {
            return callback(message)
        }

        console.log('%s transform() input: %s', this.transformType, message)

        switch (this.transformType) {
            case 'sync':
                let output = this.transform(message)
                console.log('transform() output: %s', output)
                return callback(output)

            case 'async':
                return this.transform(message, (output) => {
                    console.log('transform() output: %s', output)
                    callback(output)
                })

        }
    }

    _push(topic, message) {
        let self = this

        this._runTransform(message, output => {
            if (self.topicsAsEvents) {
                self.push('event: ' + topic + '\n')
            }

            self.push('data: ' + output + '\n\n')
            console.log('pushed %s on %s', output, topic)
        })

    }

    _onError(err) {
        this.emit('error', err)
    }

    close(callback) {
        let self = this

        this.client.quit()

        this.client.on('end', () => {
            self.emit('close')

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

    _isNumber(value) {
        return typeof value == 'number';
    }

    _isFunction(value) {
        return typeof value == 'function';
    }

}

module.exports = function (options) {
    return new Subscribe(options)
}
