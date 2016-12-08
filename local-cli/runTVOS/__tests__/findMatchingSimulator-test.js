/**
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../findMatchingSimulator');

const findMatchingSimulator = require('../findMatchingSimulator');

describe('findMatchingSimulator', () => {
  it('should find simulator', () => {
    expect(findMatchingSimulator({
        "devices" : {
          "tvOS 10.0" : [
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple TV 1080p",
              "udid" : "79A75120-023E-44BF-BF0A-37F57D89CC80"
            }
          ]
        }
      },
      'Apple TV 1080p'
    )).toEqual({
      udid: '79A75120-023E-44BF-BF0A-37F57D89CC80',
      name: 'Apple TV 1080p',
      version: 'tvOS 10.0'
    });
  });

  it('should return null if no simulators available', () => {
    expect(findMatchingSimulator({
        "devices" : {
          "tvOS 10.0" : [
            {
              "state" : "Shutdown",
              "availability" : "(unavailable, runtime profile not found)",
              "name" : "Apple TV 1080p",
              "udid" : "79A75120-023E-44BF-BF0A-37F57D89CC80"
            }
          ]
        }
      },
      'Apple TV 1080p'
    )).toEqual(null);
  });

  it('should return null if an odd input', () => {
    expect(findMatchingSimulator('random string input', 'Apple TV 1080p')).toEqual(null);
  });

  it('should return the first simulator in list if none is defined', () => {
    expect(findMatchingSimulator({
        "devices" : {
          "tvOS 10.0" : [
            {
              "state" : "Shutdown",
              "availability" : "(unavailable, runtime profile not found)",
              "name" : "Apple TV 1080p",
              "udid" : "79A75120-023E-44BF-BF0A-37F57D89CC80"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple TV 1080p",
              "udid" : "B9B5E161-416B-43C4-A78F-729CB96CC8C6"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple TV 1080p",
              "udid" : "1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB"
            }
          ]
        }
      },
      null
    )).toEqual({
      udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
      name: 'Apple TV 1080p',
      version: 'tvOS 10.0'
    });
  });

  it('should return the botted simulator in list if none is defined', () => {
    expect(findMatchingSimulator({
        "devices" : {
          "tvOS 10.0" : [
            {
              "state" : "Shutdown",
              "availability" : "(unavailable, runtime profile not found)",
              "name" : "Apple TV 1080p",
              "udid" : "79A75120-023E-44BF-BF0A-37F57D89CC80"
            },
            {
              "state" : "Shutdown",
              "availability" : "(available)",
              "name" : "Apple TV 1080p",
              "udid" : "B9B5E161-416B-43C4-A78F-729CB96CC8C6"
            },
            {
              "state" : "Booted",
              "availability" : "(available)",
              "name" : "Apple TV 1080p",
              "udid" : "1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB"
            }
          ]
        }
      },
      null
    )).toEqual({
      udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
      name: 'Apple TV 1080p',
      version: 'tvOS 10.0'
    });
  });
});
