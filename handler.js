module.exports.run = async (event) => {
    if (typeof event === 'undefined' || typeof event.body !== 'undefined') {
        throw new Error('event not as expected');
    }
};
