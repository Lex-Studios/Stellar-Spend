import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Custom metrics
const errorRate = new Rate("errors");
const apiDuration = new Trend("api_duration");
const successfulRequests = new Counter("successful_requests");
const activeConnections = new Gauge("active_connections");

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m30s", target: 50 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.1"],
    errors: ["rate<0.05"],
  },
};

export default function () {
  group("Health Check", () => {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      "health status is 200": (r) => r.status === 200,
      "health response time < 200ms": (r) => r.timings.duration < 200,
    });
    apiDuration.add(res.timings.duration);
    if (res.status === 200) {
      successfulRequests.add(1);
    } else {
      errorRate.add(1);
    }
  });

  group("Quote API", () => {
    const payload = JSON.stringify({
      amount: "100",
      currency: "NGN",
      feeMethod: "USDC",
    });

    const params = {
      headers: { "Content-Type": "application/json" },
    };

    const res = http.post(`${BASE_URL}/api/offramp/quote`, payload, params);
    check(res, {
      "quote status is 200": (r) => r.status === 200,
      "quote has rate": (r) => r.json("rate") !== undefined,
      "quote response time < 1000ms": (r) => r.timings.duration < 1000,
    });
    apiDuration.add(res.timings.duration);
    if (res.status === 200) {
      successfulRequests.add(1);
    } else {
      errorRate.add(1);
    }
  });

  group("Currencies API", () => {
    const res = http.get(`${BASE_URL}/api/offramp/currencies`);
    check(res, {
      "currencies status is 200": (r) => r.status === 200,
      "currencies is array": (r) => Array.isArray(r.json()),
      "currencies response time < 500ms": (r) => r.timings.duration < 500,
    });
    apiDuration.add(res.timings.duration);
    if (res.status === 200) {
      successfulRequests.add(1);
    } else {
      errorRate.add(1);
    }
  });

  group("Rate API", () => {
    const res = http.get(`${BASE_URL}/api/offramp/rate`);
    check(res, {
      "rate status is 200": (r) => r.status === 200,
      "rate has value": (r) => r.json("rate") !== undefined,
      "rate response time < 300ms": (r) => r.timings.duration < 300,
    });
    apiDuration.add(res.timings.duration);
    if (res.status === 200) {
      successfulRequests.add(1);
    } else {
      errorRate.add(1);
    }
  });

  activeConnections.add(__VU);
  sleep(1);
}
