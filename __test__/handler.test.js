const aws = require('aws-sdk-mock');
const realAws = require('aws-sdk');
const object = require('../handler');

aws.setSDKInstance(realAws);
process.env.NO_LAMBDA_LOG = true;

describe('handler', async () => {
    test('gives an error when data does not meet expected', async () => {
        const expectedError = new Error('event not as expected');
        await expect(object.run()).rejects.toThrowError(expectedError);
    });

    test('gives an error when malformed body', async () => {
        const data = '{"test": test}';
        const expectedError = new Error('json body malformed');
        await expect(object.run({ body: data })).rejects.toThrowError(expectedError);
    });

    test('gives an error when dynamodb fails', async () => {
        const data = {
            eventId: '12345-test',
            dateCreate: '2018-09-07 13:37:00',
            data: 'test data',
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
            dateCreate: '2018-09-07 13:37:00',
            data: 'test data',
        };

        const mockClient = async (params) => {
            expect(params.Item).toEqual(data);
            return params;
        };
        await aws.mock('DynamoDB.DocumentClient', 'put', mockClient);
        const result = await object.run({ body: JSON.stringify(data) });
        expect(result.TableName).toBe('event-service-db');
        expect(result.Item).toEqual(data);
        aws.restore('DynamoDB.DocumentClient', 'put');
    });
});
