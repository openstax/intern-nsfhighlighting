'use strict';

var angular = require('angular');
var proxyquire = require('proxyquire');

var events = require('../events');

var mock = angular.mock;

describe('session', function () {
  var $httpBackend;
  var $rootScope;

  var fakeAnalytics;
  var fakeAuth;
  var fakeFlash;
  var fakeRaven;
  var fakeServiceConfig = sinon.stub();
  var fakeSettings;
  var fakeStore;
  var sandbox;
  var session;

  before(function () {
    angular.module('h', ['ngResource'])
      .service(
        'session',
        proxyquire('../session', {'./service-config': fakeServiceConfig})
      );
  });

  beforeEach(function () {
    sandbox = sinon.sandbox.create();

    var state = {};
    fakeAnalytics = {
      track: sinon.stub(),
      events: require('../analytics')().events,
    };
    var fakeAnnotationUI = {
      getState: function () {
        return {session: state};
      },
      updateSession: function (session) {
        state = session;
      },
    };
    fakeAuth = {
      clearCache: sandbox.spy(),
    };
    fakeFlash = {error: sandbox.spy()};
    fakeRaven = {
      setUserInfo: sandbox.spy(),
    };
    fakeStore = {
      profile: {
        read: sandbox.stub(),
        update: sandbox.stub().returns(Promise.resolve({})),
      },
    };
    fakeServiceConfig.reset();
    fakeServiceConfig.returns(null);
    fakeSettings = {
      serviceUrl: 'https://test.hypothes.is/root/',
    };

    mock.module('h', {
      analytics: fakeAnalytics,
      annotationUI: fakeAnnotationUI,
      auth: fakeAuth,
      flash: fakeFlash,
      raven: fakeRaven,
      settings: fakeSettings,
      store: fakeStore,
    });
  });


  beforeEach(mock.inject(function (_$httpBackend_, _$rootScope_, _session_) {
    $httpBackend = _$httpBackend_;
    session = _session_;
    $rootScope = _$rootScope_;
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
    sandbox.restore();
  });

  // There's little point testing every single route here, as they're
  // declarative and ultimately we'd be testing ngResource.
  describe('#login()', function () {
    var url = 'https://test.hypothes.is/root/app?__formid__=login';

    it('should send an HTTP POST to the action', function () {
      $httpBackend.expectPOST(url, {code: 123}).respond({});
      session.login({code: 123});
      $httpBackend.flush();
    });

    it('should invoke the flash service with any flash messages', function () {
      var response = {
        flash: {
          error: ['fail'],
        },
      };
      $httpBackend.expectPOST(url).respond(response);
      session.login({});
      $httpBackend.flush();
      assert.calledWith(fakeFlash.error, 'fail');
    });

    it('should assign errors and status reasons to the model', function () {
      var response = {
        model: {
          userid: 'alice',
        },
        errors: {
          password: 'missing',
        },
        reason: 'bad credentials',
      };
      $httpBackend.expectPOST(url).respond(response);
      var result = session.login({});
      $httpBackend.flush();
      assert.match(result, response.model, 'the model is present');
      assert.match(result.errors, response.errors, 'the errors are present');
      assert.match(result.reason, response.reason, 'the reason is present');
    });

    it('should capture and send the xsrf token', function () {
      var token = 'deadbeef';
      var headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=utf-8',
        'X-XSRF-TOKEN': token,
      };
      var model = {csrf: token};
      $httpBackend.expectPOST(url).respond({model: model});
      session.login({});
      $httpBackend.flush();
      assert.equal(session.state.csrf, token);

      $httpBackend.expectPOST(url, {}, headers).respond({});
      session.login({});
      $httpBackend.flush();
    });

    it('should expose the model as session.state', function () {
      var response = {
        model: {
          userid: 'alice',
        },
      };
      assert.deepEqual(session.state, {});
      $httpBackend.expectPOST(url).respond(response);
      session.login({});
      $httpBackend.flush();
      assert.deepEqual(session.state, response.model);
    });

    it('an immediately-following call to #load() should not trigger a new request', function () {
      $httpBackend.expectPOST(url).respond({});
      session.login();
      $httpBackend.flush();

      session.load();
    });
  });

  describe('#load()', function () {
    var url = 'https://test.hypothes.is/root/app';

    it('should fetch the session data', function () {
      $httpBackend.expectGET(url).respond({});
      session.load();
      $httpBackend.flush();
    });

    context('when the host page provides an OAuth grant token', function () {
      beforeEach(function () {
        fakeServiceConfig.returns({
          authority: 'publisher.org',
          grantToken: 'a.jwt.token',
        });
        fakeStore.profile.read.returns(Promise.resolve({
          userid: 'acct:user@publisher.org',
        }));
      });

      it('should fetch profile data from the API', function () {
        return session.load().then(function () {
          assert.calledWith(fakeStore.profile.read, {authority: 'publisher.org'});
        });
      });

      it('should update the session with the profile data from the API', function () {
        return session.load().then(function () {
          assert.equal(session.state.userid, 'acct:user@publisher.org');
        });
      });
    });

    it('should cache the session data', function () {
      $httpBackend.expectGET(url).respond({});
      session.load();
      session.load();
      $httpBackend.flush();
    });

    it('should eventually expire the cache', function () {
      var clock = sandbox.useFakeTimers();
      $httpBackend.expectGET(url).respond({});
      session.load();
      $httpBackend.flush();

      clock.tick(301 * 1000);

      $httpBackend.expectGET(url).respond({});
      session.load();
      $httpBackend.flush();
    });

    var failedRequestCases = [{
      status: -1,
      body: null,
    },{
      status: 504,
      body: 'Gateway Timeout',
    }];

    failedRequestCases.forEach(function (testCase) {
      it('should tolerate failed requests', function () {
        $httpBackend.expectGET(url).respond(testCase.status, testCase.body);
        session.load();
        $httpBackend.flush();
      });
    });
  });

  describe('#update()', function () {
    it('broadcasts GROUPS_CHANGED when the groups change', function () {
      var groupChangeCallback = sinon.stub();
      $rootScope.$on(events.GROUPS_CHANGED, groupChangeCallback);
      session.update({
        groups: [{
          id: 'groupid',
        }],
        csrf: 'dummytoken',
      });
      assert.calledOnce(groupChangeCallback);
    });

    it('broadcasts USER_CHANGED when the user changes', function () {
      var userChangeCallback = sinon.stub();
      $rootScope.$on(events.USER_CHANGED, userChangeCallback);
      session.update({
        userid: 'fred',
        csrf: 'dummytoken',
      });
      assert.calledOnce(userChangeCallback);
    });

    it('clears the API token cache when the user changes', function () {
      session.update({userid: 'different-user', csrf: 'dummytoken'});
      assert.called(fakeAuth.clearCache);
    });

    it('updates the user ID for Sentry error reports', function () {
      session.update({
        userid: 'anne',
        csrf: 'dummytoken',
      });
      assert.calledWith(fakeRaven.setUserInfo, {
        id: 'anne',
      });
    });

    it('does not clear the access token when the host page provides a grant token', function () {
      fakeServiceConfig.returns({
        authority: 'publisher.org',
        grantToken: 'a.jwt.token',
      });

      session.update({userid: 'different-user', csrf: 'dummytoken'});

      assert.notCalled(fakeAuth.clearCache);
    });
  });

  describe('#dismissSidebarTutorial()', function () {
    beforeEach(function () {
      fakeStore.profile.update.returns(Promise.resolve({
        preferences: {},
      }));
    });

    it('disables the tutorial for the user', function () {
      session.dismissSidebarTutorial();
      assert.calledWith(fakeStore.profile.update, {}, {preferences: {show_sidebar_tutorial: false}});
    });

    it('should update the session with the response from the API', function () {
      return session.dismissSidebarTutorial().then(function () {
        assert.isNotOk(session.state.preferences.show_sidebar_tutorial);
      });
    });
  });

  describe('#logout()', function () {
    var postExpectation;
    beforeEach(function () {
      var logoutUrl = 'https://test.hypothes.is/root/app?__formid__=logout';
      postExpectation = $httpBackend.expectPOST(logoutUrl).respond(200, {
        model: {
          userid: 'logged-out-id',
        },
      });
    });

    it('logs the user out on the service and updates the session', function () {
      session.logout().then(function () {
        assert.equal(session.state.userid, 'logged-out-id');
      });
      $httpBackend.flush();
    });

    it('clears the API access token cache', function () {
      session.logout().then(function () {
        assert.called(fakeAuth.clearCache);
      });
      $httpBackend.flush();
    });

    it('tracks successful logout actions in analytics', function () {
      session.logout().then(function () {
        assert.calledWith(fakeAnalytics.track, fakeAnalytics.events.LOGOUT_SUCCESS);
      });
      $httpBackend.flush();
    });

    it('tracks unsuccessful logout actions in analytics', function () {
      postExpectation.respond(500);

      session.logout().catch(function(){
        assert.calledWith(fakeAnalytics.track, fakeAnalytics.events.LOGOUT_FAILURE);
      });

      $httpBackend.flush();
    });
  });
});
