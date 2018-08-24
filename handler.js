const aws = require('aws-sdk');

const region = process.env.AWS_REGION || 'us-east-1';
const TableName = 'event-service-db';

const log = (type, what) => {
    // istanbul ignore if
    if (typeof process.env.NO_LAMBDA_LOG === 'undefined') {
        console[type](what);
    }
};

module.exports.run = async (event) => {
    let data;

    if (typeof event === 'undefined' || typeof event.body === 'undefined') {
        log('error', 'event not as expected');
        throw new Error('event not as expected');
    }

    try {
        data = JSON.parse(event.body);
    } catch (e) {
        log('error', e);
        throw new Error('json body malformed');
    }

    const params = {
        TableName,
        Item: data,
    };

    try {
        const ddb = new aws.DynamoDB.DocumentClient({ region });
        const result = await ddb.put(params).promise();
        log('log', result);
        return result;
    } catch (e) {
        log('error', e);
        throw new Error('dynamodb error');
    }
};
