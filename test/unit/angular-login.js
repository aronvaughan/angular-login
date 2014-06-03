'use strict';

describe('Module: myApp', function() {
    this.avLogin = undefined;

    // load the controller's module
    beforeEach(module('myApp'));

    beforeEach(inject(function(avLogin) {

        this.avLogin = avLogin;
        console.log('avLogin injected', this.avLogin);
    }));

    afterEach(function() {
        //scope.$destroy();
    });

    it('should correctly return mock values on a getAll', inject(function() {

        //check that injection works
        expect(this.nameServiceMock).toBeDefined();

        //fetch the default log level
        //console.log('checking config default loglevel', logger.getConfig().loglevel);
        var mockValues = this.nameServiceMock.getAll({ /*no params*/ });
        expect(mockValues.length).toEqual(2);
        expect(mockValues[0].name).toEqual('Charlie Brown');
        expect(mockValues[1].name).toEqual('Snoopy');

        //test with filtering by params
        mockValues = this.nameServiceMock.getAll({
            id: 0
        });
        expect(mockValues.length).toEqual(1);
        expect(mockValues[0].name).toEqual('Charlie Brown');

        mockValues = this.nameServiceMock.getAll({
            name: 'Snoopy'
        });
        expect(mockValues.length).toEqual(1);
        expect(mockValues[0].name).toEqual('Snoopy');
    }));

    it('should correctly return mock values on a get', inject(function() {

        //check that injection works
        expect(this.nameServiceMock).toBeDefined();

        var mockValue = this.nameServiceMock.get({
            id: 0
        });
        expect(mockValue).toBeDefined();
        expect(mockValue.name).toEqual('Charlie Brown');
    }));

    it('should correctly handle a mock update', inject(function() {

        //check that injection works
        expect(this.nameServiceMock).toBeDefined();

        var updatedValue = {
            id: 0,
            name: 'Charlie Green'
        };
        var returnedValue = this.nameServiceMock.save(updatedValue, {
            id: 0
        });
        expect(returnedValue).toBeDefined();
        expect(returnedValue.name).toEqual('Charlie Green');

        returnedValue = this.nameServiceMock.get({
            id: 0
        });
        expect(returnedValue).toBeDefined();
        expect(returnedValue.name).toEqual('Charlie Green');
    }));

    it('should correctly handle a mock create', inject(function() {

        //check that injection works
        expect(this.nameServiceMock).toBeDefined();

        var newValue = {
            name: 'Linus'
        };
        var returnedValue = this.nameServiceMock.save(newValue, {});
        expect(returnedValue).toBeDefined();
        expect(returnedValue.name).toEqual('Linus');

        returnedValue = this.nameServiceMock.get({
            id: returnedValue.id
        });
        expect(returnedValue).toBeDefined();
        expect(returnedValue.name).toEqual('Linus');
    }));

    it('should correctly handle a mock delete', inject(function() {

        //check that injection works
        expect(this.nameServiceMock).toBeDefined();

        this.nameServiceMock.delete(0);

        var returnedValues = this.nameServiceMock.getAll({});
        expect(returnedValues).toBeDefined();
        expect(returnedValues.length).toEqual(1);
        expect(returnedValues[0].name).toEqual('Snoopy');
    }));

});
