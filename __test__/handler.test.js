const aws = require('aws-sdk-mock');
const realAws = require('aws-sdk');
const object = require('../handler');

aws.setSDKInstance(realAws);
process.env.NO_LAMBDA_LOG = true;

describe('handler', async () => {
    test('gives an error when data does not meet expected', async () => {
        const expectedError = new Error('event not as expected');
        aws.mock('DynamoDB.DocumentClient', 'put', async () => true);
        await expect(object.run()).rejects.toThrowError(expectedError);
        aws.restore('DynamoDB.DocumentClient', 'put');
    });

    test('gives an error when malformed body', async () => {
        const data = '{"test": test}';
        const expectedError = new Error('json body malformed');

        aws.mock('DynamoDB.DocumentClient', 'put', async () => true);
        await expect(object.run({ body: data })).rejects.toThrowError(expectedError);
        aws.restore('DynamoDB.DocumentClient', 'put');
    });

    test('gives an error when field is missing', async () => {
        const data = {
            timestamp: '2018-09-07 13:37:00',
            data: 'test data',
            event: 'audit',
        };

        const expectedError = new Error(
            'missing required fields for entry or data type was not correct or was a falsy value' // eslint-disable-line
        );

        aws.mock('DynamoDB.DocumentClient', 'put', async () => true);
        await expect(object.run({ body: JSON.stringify(data) })).rejects.toThrowError(expectedError);
        aws.restore('DynamoDB.DocumentClient', 'put');
    });

    test('gives an error when event type is not supported', async () => {
        const data = {
            eventId: '12345-test',
            timestamp: 20180907133700,
            data: 'test data',
            event: 'test',
        };

        const expectedError = new Error('event type is not supported');

        aws.mock('DynamoDB.DocumentClient', 'put', async () => true);
        await expect(object.run({ body: JSON.stringify(data) })).rejects.toThrowError(expectedError);
        aws.restore('DynamoDB.DocumentClient', 'put');
    });

    test('gives an error when dynamodb fails', async () => {
        const data = {
            eventId: '12345-test',
            timestamp: 20180907133700,
            data: 'test data',
            event: 'Audit',
        };

        const mockError = new Error('simulated error');
        const expectedError = new Error('dynamodb error');
        const mockClient = async (params) => {
            expect(params.Item).toEqual(data);
            throw mockError;
        };

        aws.mock('DynamoDB.DocumentClient', 'put', mockClient);
        await expect(object.run({ body: JSON.stringify(data) })).rejects.toThrowError(expectedError);
        aws.restore('DynamoDB.DocumentClient', 'put');
    });

    test('retuns as expected when successful', async () => {
        const data = {
            eventId: '12345-test',
            timestamp: 20180907133700,
            data: 'test data',
            event: 'Audit',
        };

        const mockClient = async (params) => {
            expect(params.Item).toEqual(data);
            return params;
        };
        aws.mock('DynamoDB.DocumentClient', 'put', mockClient);
        const result = await object.run({ body: JSON.stringify(data) });
        expect(result.TableName).toBe('event-service-table');
        expect(result.Item).toEqual(data);
        aws.restore('DynamoDB.DocumentClient', 'put');
    });
});
