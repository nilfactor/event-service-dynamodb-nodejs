const object = require('../handler');

describe('handler', async () => {
    test('gives an error when data does not meet expected', async () => {
        let error;

        try {
            await object.run();
        } catch (e) {
            error = e;
        }

        expect(error).toEqual(new Error('event not as expected'));
    });
});
