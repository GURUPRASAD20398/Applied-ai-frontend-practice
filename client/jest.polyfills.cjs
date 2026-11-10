const { TextEncoder, TextDecoder } = require('util');

// jsdom does not expose these; react-router 7 needs them at import time.
Object.assign(global, { TextEncoder, TextDecoder });
