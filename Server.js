'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000;

const {addFeedId, addFeeds, events} = require('./Service');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/status', (request, response) => {
    response.json({
        sever: "running",
        status: 'ok'
    });
});

app.get('/events/:clientId', events);
app.post('/feeds', addFeeds);
app.post('/feed/:id', addFeedId);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
