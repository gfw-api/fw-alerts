const json2csv = require('json2csv');

class Converter {

    static json2csv(data, fields) {
        try {
            return json2csv({ data, fields });
        } catch (e) {
            throw new Error(e);
        }
    }

}

module.exports = Converter;
