const aws = require('aws-sdk');

// the aws region our lambda function and dynamodb table are in
const region = process.env.AWS_REGION || 'us-east-1';

// our dynamodb table name, which is located in the region above
const TableName = 'event-service-table';

// these are the sns topics we will be pushing messages to
const events = [
    'Audit',
    'User',
    'Post',
    'Reply',
];

// these are the fields that we are requiring to be saved to our event queue
const requiredFields = {
    eventId: 'string',
    data: 'string',
    event: 'string',
    timestamp: 'number',
};

/**
 * @desc  Log data out to the console
 * @param string type - the type of message ie: log, warn, error
 * @param mixed what - what we wish to log to the console
 */
const log = (type, what) => {
    // istanbul ignore if
    if (typeof process.env.NO_LAMBDA_LOG === 'undefined') {
        console[type](what);
    }
};

/**
 * @desc  verify that the required fields are set and match the data type we expect, validating the data in
 * @param object data - what we want to add to the event queue
 */
const verifyFields = (data) => {
    const keys = Object.keys(requiredFields);
    keys.forEach((key) => {
        /* eslint-disable valid-typeof */
        if (typeof data[key] === 'undefined' || typeof data[key] !== requiredFields[key] || !data[key]) {
            throw new Error('missing required fields for entry or data type was not correct or was a falsy value');
        }
    });
};

/**
 * @desc  verify the event that is occuring is supported by our event queue
 * @param string eventType - the event type that is occuring
 */
const verifyEvent = (eventType) => {
    if (events.indexOf(eventType) === -1) {
        throw new Error('event type is not supported');
    }
};

module.exports.run = async (event) => {
    let data;

    // make sure event matches as we would expect
    if (typeof event === 'undefined' || typeof event.body === 'undefined') {
        log('error', 'event not as expected');
        throw new Error('event not as expected');
    }

    // convert data to JSON object
    try {
        data = JSON.parse(event.body);
    } catch (error) {
        log('error', error);
        throw new Error('json body malformed');
    }

    // verify the data
    verifyFields(data);
    verifyEvent(data.event);

    // paramaters to create entry in our dynamodb table
    const params = {
        TableName,
        Item: data,
    };

    // store the data in our dynamodb table
    try {
        const ddb = new aws.DynamoDB.DocumentClient({ region });
        const result = await ddb.put(params).promise();
        log('log', result);
        return result;
    } catch (error) {
        log('error', error);
        throw new Error('dynamodb error');
    }
};
