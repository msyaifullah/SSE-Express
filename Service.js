'use strict'

/**
 * Module dependencies
 */

const Publisher = require("./Publisher");
const Subscribe = require("./Subscribe");

module.exports = {
    addFeeds,
    addFeedId,
    events
}

async function addFeeds(request, response, next) {
    const newFeed = request.body;
    let pub = new Publisher({
        topic: 'transform.group.1234',
        host: 'minidev'
    })

    pub.publish(JSON.stringify(newFeed));
    response.json({
        message: 'success send feeds to transform.group.1234'
    })
}

async function addFeedId(request, response, next) {
    const id = request.params.id;
    const newFeed = request.body;
    let pub = new Publisher({
        topic: `transform.people.${id}`,
        host: 'minidev'
    })

    pub.publish(JSON.stringify(newFeed));
    response.json({
        message: `success send feed to transform.people.${id}`
    })
}

function events(request, response, next) {
    const clientId = request.params.clientId;
    let sub = new Subscribe({
        topics: ['transform.group.1234', `transform.people.${clientId}`],
        host: 'minidev'
    });

    response.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    })

    sub.pipe(response)
}
