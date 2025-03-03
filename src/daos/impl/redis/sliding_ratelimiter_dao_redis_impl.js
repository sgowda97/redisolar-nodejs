const redis = require('./redis_client');
/* eslint-disable no-unused-vars */
const keyGenerator = require('./redis_key_generator');
const timeUtils = require('../../../utils/time_utils');
/* eslint-enable */

/* eslint-disable no-unused-vars */

// Challenge 7
const hitSlidingWindow = async (name, opts) => {
  const client = redis.getClient();
  const key = keyGenerator.getSlidingLimiterKey(name, opts.interval, opts.maxHits);
  const transaction = client.multi();
  const currentTimeMs = timeUtils.getCurrentTimestampMillis();

  transaction.zadd(key, currentTimeMs, `${currentTimeMs}-${Math.random()}`);
  transaction.zremrangebyscore(key, 0, currentTimeMs - opts.interval);
  transaction.zcard(key);

  const transactionRes = await transaction.execAsync();
  const remaining = opts.maxHits - parseInt(transactionRes[2], 10);

  return remaining < 0 ? -1 : remaining;
};

/* eslint-enable */

module.exports = {
  /**
   * Record a hit against a unique resource that is being
   * rate limited.  Will return 0 when the resource has hit
   * the rate limit.
   * @param {string} name - the unique name of the resource.
   * @param {Object} opts - object containing interval and maxHits details:
   *   {
   *     interval: 1,
   *     maxHits: 5
   *   }
   * @returns {Promise} - Promise that resolves to number of hits remaining,
   *   or 0 if the rate limit has been exceeded..
   */
  hit: hitSlidingWindow,
};
