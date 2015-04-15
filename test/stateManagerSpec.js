var _ = require('underscore'),
    expect = require('chai').expect,
    StateManager = require('stateManager'),
    Ears = require('elephant-ears'),
    sinon = require('sinon');

describe('State Manager', function () {

    beforeEach(function () {
        this.sandbox = sinon.sandbox.create();
        this.data = [
            {
                id: '1',
                name: 'a',
                foo: 'I',
                bar: {
                    foo: {
                        deep: 'deep value'
                    }
                }
            },
            {
                id: '2',
                name: 'b',
                foo: 'I'
            },
            {
                id: '3',
                name: 'c'
            }
        ];
        this.options = {
            recordIdName: 'id'
        };
        this.columns = [
            {
                name: 'col-1'
            },
            {
                name: 'col-2'
            }
        ];
        this.ears = new Ears();
        this.stateManager = new StateManager(this.data, this.columns, this.ears, this.options);
    });

    afterEach(function () {
        this.sandbox.restore();
        delete this.stateManager;
        delete this.ears;
    });

    it('Should private vars setup after construction', function () {
        expect(_.keys(this.stateManager)).to.have.length(6);
        expect(this.stateManager._data).to.equal(this.data);
        expect(this.stateManager._columns).to.equal(this.columns);
        expect(this.stateManager._ears).to.equal(this.ears);
        expect(this.stateManager._options).to.equal(this.options);
        expect(this.stateManager._newRecordUniqueId).to.equal(-1);
        expect(this.stateManager._deletedRecords).to.have.length(0);
    });

    it('Should return all records', function () {
        expect(this.stateManager.getRecords()).to.have.length(3);
    });

    it('Should return a record by its id', function () {
        expect(this.stateManager.getRecord('1').name).to.equal('a');
        expect(this.stateManager.getRecord('2').name).to.equal('b');
        expect(this.stateManager.getRecord('3').name).to.equal('c');

        this.stateManager = new StateManager([
            {
                key: 'a',
                name: 'foo'
            },
            {
                key: 'b',
                name: 'bar'
            }
        ], this.columns, this.ears, {
            recordIdName: 'key'
        });

        expect(this.stateManager.getRecord('a').name).to.equal('foo');
        expect(this.stateManager.getRecord('b').name).to.equal('bar');
    });

    it('Should return a set of records by a given set of key value pairs', function () {
        var records = this.stateManager.findRecords({foo: 'I'});
        expect(records).to.have.length(2);
        expect(records[0].name).to.equal('a');
        expect(records[1].name).to.equal('b');
    });

    it('Should give a value for a given property name', function () {
        var record = this.stateManager.getRecord('1');
        expect(this.stateManager.getRecordValue(record, 'name')).to.equal('a');
        expect(this.stateManager.getRecordValue(record, 'bar.foo.deep')).to.equal('deep value');
    });

    it('Should set a value for a given property name', function () {

        var callback = this.sandbox.spy();
        this.ears.on('record-updated', callback);

        expect(callback.callCount).to.equal(0);

        var record = this.stateManager.getRecord('1');
        expect(this.stateManager.getRecordValue(record, 'name')).to.equal('a');
        this.stateManager.setRecordValue(record, 'name', 'aaa');
        expect(this.stateManager.getRecordValue(record, 'name')).to.equal('aaa');

        // deep set
        expect(this.stateManager.getRecordValue(record, 'bar.foo.deep')).to.equal('deep value');
        this.stateManager.setRecordValue(record, 'bar.foo.deep', 'hello');
        expect(this.stateManager.getRecordValue(record, 'bar.foo.deep')).to.equal('hello');

        // set a value on a property name that does not exist
        expect(this.stateManager.getRecordValue(record, 'z')).to.be.null;
        this.stateManager.setRecordValue(record, 'z', 'hello world');
        expect(this.stateManager.getRecordValue(record, 'z')).to.be.equal('hello world');

        // set a deep value on a property name that does not exist
        expect(this.stateManager.getRecordValue(record, 'm.n.o')).to.be.null;
        this.stateManager.setRecordValue(record, 'm.n.o', 'world');
        expect(this.stateManager.getRecordValue(record, 'm.n.o')).to.be.equal('world');

        expect(callback.callCount).to.equal(4);
        var params = callback.args[0][0];
        expect(params.record.name).to.equal('aaa');
        expect(params.recordId).to.equal('1');
        expect(params.propertyName).to.equal('name');
        expect(params.value).to.equal('aaa');

    });

    it('Should add record to record set', function () {
        var callback = this.sandbox.spy();
        this.ears.on('record-added', callback);

        expect(callback.callCount).to.equal(0);

        expect(this.stateManager.getRecords()).to.have.length(3);
        var newRecord = this.stateManager.addRecord({
            name: 'new record 1'
        });
        expect(newRecord.name).to.equal('new record 1');
        expect(this.stateManager.getRecords()[3].id).to.equal('-1');
        newRecord = this.stateManager.addRecord({
            name: 'new record 2'
        }, 2);
        expect(newRecord.name).to.equal('new record 2');
        expect(this.stateManager.getRecords()[0].id).to.equal('1');
        expect(this.stateManager.getRecords()[1].id).to.equal('2');
        expect(this.stateManager.getRecords()[2].id).to.equal('-2');
        expect(this.stateManager.getRecords()[3].id).to.equal('3');
        expect(this.stateManager.getRecords()[4].id).to.equal('-1');

        expect(callback.callCount).to.equal(2);
        expect(callback.args[1][0]).to.equal(newRecord);

    });

    it('Should delete record from record set with a given id', function () {
        var callback = this.sandbox.spy();
        this.ears.on('record-deleted', callback);

        expect(callback.callCount).to.equal(0);

        expect(this.stateManager.getRecords()).to.have.length(3);
        expect(this.stateManager.getRecords()[0].id).to.equal('1');
        expect(this.stateManager.getRecords()[1].id).to.equal('2');
        expect(this.stateManager.getRecords()[2].id).to.equal('3');
        this.stateManager.deleteRecord('2');
        expect(this.stateManager.getRecords()).to.have.length(2);
        expect(this.stateManager.getRecords()[0].id).to.equal('1');
        expect(this.stateManager.getRecords()[1].id).to.equal('3');
        this.stateManager.deleteRecord('1');
        expect(this.stateManager.getRecords()).to.have.length(1);
        expect(this.stateManager.getRecords()[0].id).to.equal('3');
        var recordToDelete = this.stateManager.getRecord('3');
        this.stateManager.deleteRecord('3');
        expect(this.stateManager.getRecords()).to.have.length(0);

        expect(callback.callCount).to.equal(3);
        expect(callback.args[2][0]).to.equal(recordToDelete);
    });

    it('Should return a set of attributes determining the state of the record', function () {
        var record = this.stateManager.getRecord('2');
        var attributes = this.stateManager.getRecordAttributes(record);
        expect(_.keys(attributes)).to.have.length(5);
        expect(attributes.areEditableValues).to.have.length(0);
        expect(attributes.canDelete).to.be.null;
        expect(attributes.isNew).to.be.false;
        expect(attributes.recordClasses).to.have.length(0);
        var propertyNameClasses = attributes.propertyNameClasses;
        expect(_.keys(propertyNameClasses)).to.have.length(2);
        expect(propertyNameClasses['col-1']).to.have.length(0);
        expect(propertyNameClasses['col-2']).to.have.length(0);

        record.id = '-1';
        attributes = this.stateManager.getRecordAttributes(record);
        expect(attributes.isNew).to.be.true;

    });

    it('Should return a set of deleted records', function () {
        expect(this.stateManager.getDeletedRecords()).to.have.length(0);
        this.stateManager.deleteRecord('2');
        var deletedRecords = this.stateManager.getDeletedRecords();
        expect(deletedRecords).to.have.length(1);
        expect(deletedRecords[0].name).to.equal('b');
        expect(this.stateManager.getRecords()).to.have.length(2);
        var newRecord = this.stateManager.addRecord({name: 'oi'});
        expect(this.stateManager.getRecords()).to.have.length(3);
        this.stateManager.deleteRecord(newRecord.id);
        deletedRecords = this.stateManager.getDeletedRecords();
        expect(deletedRecords).to.have.length(1);
        this.stateManager.deleteRecord('1');
        deletedRecords = this.stateManager.getDeletedRecords();
        expect(deletedRecords).to.have.length(2);
        expect(deletedRecords[0].name).to.equal('b');
        expect(deletedRecords[1].name).to.equal('a');

    });

    it('Should return the order of records to presenting layer', function () {
        // confirm records are in original order
        var orderRecords = [];
        this.stateManager.iterator(function (record) {
            orderRecords.push(record);
        });
        expect(orderRecords).to.have.length(3);
        expect(orderRecords[0].name).to.equal('a');
        expect(orderRecords[1].name).to.equal('b');
        expect(orderRecords[2].name).to.equal('c');

        // confirm records are returned in order to the sortConfig
        orderRecords = [];
        var sortConfig = [
            {
                type: 'string',
                ascending: false,
                name: 'name'
            }
        ];
        this.stateManager.iterator(function (record) {
            orderRecords.push(record);
        }, sortConfig);
        expect(orderRecords).to.have.length(3);
        expect(orderRecords[0].name).to.equal('c');
        expect(orderRecords[1].name).to.equal('b');
        expect(orderRecords[2].name).to.equal('a');

        var records = this.stateManager.getRecords();
        expect(records[0].name).to.equal('a');
        expect(records[1].name).to.equal('b');
        expect(records[2].name).to.equal('c');

        // confirm records are back in original order
        orderRecords = [];
        this.stateManager.iterator(function (record) {
            orderRecords.push(record);
        });
        expect(orderRecords).to.have.length(3);
        expect(orderRecords[0].name).to.equal('a');
        expect(orderRecords[1].name).to.equal('b');
        expect(orderRecords[2].name).to.equal('c');

        // confirm only a range of records are returned
        this.data.push({
            id: '4',
            name: 'd'
        });
        this.data.push({
            id: '5',
            name: 'e'
        });
        this.stateManager = new StateManager(this.data, this.columns, this.ears, this.options);
        orderRecords = [];
        this.stateManager.iterator(function (record) {
            orderRecords.push(record);
        });
        expect(orderRecords).to.have.length(5);
        orderRecords = [];
        this.stateManager.iterator(function (record) {
            orderRecords.push(record);
        }, [], {
            topIndex: 1,
            bottomIndex: 3
        });
        expect(orderRecords).to.have.length(3);
        expect(orderRecords[0].name).to.equal('b');
        expect(orderRecords[1].name).to.equal('c');
        expect(orderRecords[2].name).to.equal('d');
    });

    it('Should create a new record', function () {
        var record = this.stateManager.createRecord();
        expect(_.isEmpty(record)).to.be.true;

    });
});
